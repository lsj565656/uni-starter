<script>
	import initApp from '@/common/appInit.js';
	import openApp from '@/common/openApp.js';
	// #ifdef H5
		openApp() //创建在h5端全局悬浮引导用户下载app的功能
	// #endif
	import checkIsAgree from '@/pages/uni-agree/utils/uni-agree.js';
	import uniIdPageInit from '@/uni_modules/uni-id-pages/init.js';
	export default {
		globalData: {
			searchText: '',
			appVersion: {},
			config: {},
			$i18n: {},
			$t: {}
		},
		onLaunch: function() {
			console.log('App Launch')
			this.globalData.$i18n = this.$i18n
			this.globalData.$t = str => this.$t(str)
			initApp();
			uniIdPageInit()
			
			// #ifdef APP
			//checkIsAgree(); APP端暂时先用原生默认生成的。目前，自定义方式启动vue界面时，原生层已经请求了部分权限这并不符合国家的法规
			// #endif

			// #ifdef H5
			// checkIsAgree(); // 默认不开启。目前全球，仅欧盟国家有网页端同意隐私权限的需要。如果需要可以自己去掉注视后生效
			// #endif

			// #ifdef APP-PLUS
			//idfa有需要的用户在应用首次启动时自己获取存储到storage中
			/*var idfa = '';
			var manager = plus.ios.invoke('ASIdentifierManager', 'sharedManager');
			if(plus.ios.invoke(manager, 'isAdvertisingTrackingEnabled')){
				var identifier = plus.ios.invoke(manager, 'advertisingIdentifier');
				idfa = plus.ios.invoke(identifier, 'UUIDString');
				plus.ios.deleteObject(identifier);
			}
			plus.ios.deleteObject(manager);
			console.log('idfa = '+idfa);*/
			// #endif
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style lang="scss">
	/*每个页面公共css */
	@import "static/iconfont.css";
	
	/* 全局CSS变量定义 */
	:root {
		/* 颜色变量 */
		--primary-color: #007aff;
		--success-color: #28a746;
		--warning-color: #ffc107;
		--error-color: #dc3545;
		--text-primary: #333333;
		--text-secondary: #666666;
		--text-light: #ffffff;
		--bg-primary: #ffffff;
		--bg-secondary: #f8f9fa;
		--border-color: #e9ecef;
		
		/* 字体变量 */
		--font-size-xs: 12px;
		--font-size-sm: 14px;
		--font-size-md: 16px;
		--font-size-lg: 18px;
		--font-size-xl: 20px;
		--font-weight-normal: 400;
		--font-weight-medium: 500;
		--font-weight-bold: 600;
		
		/* 间距变量 */
		--spacing-xs: 4px;
		--spacing-sm: 8px;
		--spacing-md: 12px;
		--spacing-lg: 16px;
		--spacing-xl: 20px;
		
		/* 圆角变量 */
		--radius-sm: 4px;
		--radius-md: 8px;
		--radius-lg: 12px;
		--radius-xl: 16px;
		--radius-full: 50%;
		
		/* 阴影变量 */
		--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
		--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
		--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
	}
	
	/* 移动端适配 */
	@media (max-width: 768px) {
		:root {
			--font-size-xs: 10px;
			--font-size-sm: 12px;
			--font-size-md: 14px;
			--font-size-lg: 16px;
			--font-size-xl: 18px;
			--spacing-xs: 2px;
			--spacing-sm: 4px;
			--spacing-md: 8px;
			--spacing-lg: 12px;
			--spacing-xl: 16px;
		}
	}
</style>
