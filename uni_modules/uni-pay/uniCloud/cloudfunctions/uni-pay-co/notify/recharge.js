'use strict';
/**
 * 充值支付成功回调处理
 * 此处建议只改下订单状态，保证能及时返回给第三方支付服务器成功状态
 * 且where条件可以增加判断服务器推送过来的金额和订单表中订单需支付金额是否一致
 * 将消息发送、返佣、业绩结算等业务逻辑异步处理(写入异步任务队列表)
 * 如开启定时器每隔5秒触发一次，处理订单
 * 建议再判断下金额和你业务系统订单中的金额是否一致
 */
module.exports = async (obj) => {
	let user_order_success = true;
	let { data = {} } = obj;
	let {
		order_no,
		out_trade_no,
		total_fee,
		user_id,
		body,
		description
	} = data; // uni-pay-orders 表内的数据均可获取到

	console.log("充值回调处理开始", {
		order_no,
		out_trade_no,
		total_fee,
		user_id,
		body,
		description
	});

	try {
		// 此处写你自己的支付成功逻辑开始-----------------------------------------------------------
		
		// 验证必要参数
		if (!user_id || !total_fee || !order_no) {
			console.error("充值回调缺少必要参数", { user_id, total_fee, order_no });
			return false;
		}

		// 获取数据库引用
		const db = uniCloud.database();
		const balanceCollection = db.collection('kl-id-balance');

		// 检查是否已经处理过这个订单（防止重复处理）
		const existingRecord = await balanceCollection
			.where({
				order_no: order_no // 使用订单号判断，而不是金额描述
			})
			.get();

		if (existingRecord.data && existingRecord.data.length > 0) {
			console.log("该充值订单已处理过，跳过重复处理", {
				order_no,
				user_id,
				total_fee
			});
			return true; // 已处理过，返回成功
		}

		// 查询用户最新的余额记录，计算当前总余额
		const balanceResult = await balanceCollection
			.where({
				user_id: user_id
			})
			.orderBy('create_date', 'desc')
			.limit(1)
			.get();

		let currentBalance = 0;
		if (balanceResult.data && balanceResult.data.length > 0) {
			currentBalance = balanceResult.data[0].balance || 0;
		}

		const newBalance = currentBalance + total_fee;

		// 插入余额变动记录
		const addResult = await balanceCollection.add({
			user_id: user_id,
			type: 5, // 5: 充值获得
			amount: total_fee,
			balance: newBalance,
			order_no: order_no, // 添加订单号
			transaction_id: out_trade_no, // 添加支付流水号
			comment: `充值获得 ${(total_fee / 100).toFixed(2)} 元`,
			create_date: new Date()
		});
		
		console.log("充值处理成功", {
			user_id,
			old_balance: currentBalance,
			new_balance: newBalance,
			amount: total_fee,
			order_no: order_no,
			transaction_id: out_trade_no,
			record_id: addResult.id
		});

		// 此处写你自己的支付成功逻辑结束-----------------------------------------------------------
		
	} catch (error) {
		console.error("充值回调处理异常", error);
		// 记录详细的错误信息
		console.error("错误详情:", {
			error_message: error.message,
			error_stack: error.stack,
			error_code: error.code,
			user_id,
			total_fee,
			order_no,
			out_trade_no
		});
		user_order_success = false;
	}

	// user_order_success = true 代表你自己的逻辑处理成功 返回 false 代表你自己的处理逻辑失败。
	return user_order_success;
}; 