<template>
	<view class="container">
		<view class="search-container">
			<view class="search-container-bar">
				<uni-icons class="search-icons" :color="iconColor" size="22" type="mic-filled" @click="speech" />
				<uni-search-bar ref="searchBar" style="flex:1;" radius="100" v-model="searchText" :focus="focus" :placeholder="hotWorld"
				 clearButton="auto" cancelButton="always" @clear="clear" @confirm="confirm" @cancel="cancel" />
			</view>
		</view>
		<view class="search-body">
			<!-- 搜索历史 -->
			<view class="word-container" v-if="localSearchList.length">
				<view class="word-container_header">
					<text class="word-container_header-text">搜索历史</text>
					<uni-icons v-if="!localSearchListDel" @click="localSearchListDel = true" class="search-icons" style="padding-right: 0;"
					 :color="iconColor" size="18" type="trash"></uni-icons>
					<view v-else class="flex-center flex-row" style="font-weight: 500;justify-content: space-between;">
						<text style="font-size: 14px;color: #666;padding-top:4px;padding-bottom:4px;padding-right:20px;" @click="LocalSearchListClear">全部删除</text>
						<text style="font-size: 14px;color: #c0402b;padding-top:4px;padding-bottom:4px;padding-left:20px;" @click="localSearchListDel = false">完成</text>
					</view>
				</view>
				<view class="word-container_body">
					<view class="flex-center flex-row word-container_body-text" v-for="(word,index) in localSearchList" :key="index"
					 @click="LocalSearchlistItemClick(word,index)">
						<text class="word-display" :key="word">{{word}}</text>
						<uni-icons v-if="localSearchListDel" size="12" type="closeempty" />
					</view>
				</view>
			</view>
			<!-- 搜索发现 -->
			<view class="word-container">
				<view class="word-container_header">
					<view class="flex-center flex-row">
						<text class="word-container_header-text">搜索发现</text>
						<uni-icons v-if="!netHotListIsHide" class="search-icons" :color="iconColor" size="14" type="reload" @click="searchHotRefresh"></uni-icons>
					</view>
					<uni-icons class="search-icons" style="padding-right: 0;" :color="iconColor" size="18" :type="netHotListIsHide ? 'eye-slash' : 'eye'"
					 @click="netHotListIsHide = !netHotListIsHide"></uni-icons>
				</view>
				<unicloud-db ref="udb" #default="{data, loading, error, options}" field="content" collection="opendb-search-hot"
				 orderby="create_date desc,count desc" page-data="replace" :page-size="10">
					<text v-if="loading && !netHotListIsHide" class="word-container_body-info">正在加载...</text>
					<view v-else class="word-container_body">
						<template v-if="!netHotListIsHide">
							<text v-if="error" class="word-container_body-info">{{error.message}}</text>
							<template v-else>
								<text v-for="(word,index) in data" class="word-container_body-text" :key="index" @click="search(word.content)">{{word.content}}</text>
							</template>
						</template>
						<view v-else style="flex:1;">
							<text class="word-container_body-info">当前搜索发现已隐藏</text>
						</view>
					</view>
				</unicloud-db>
			</view>
		</view>
		<!-- 搜索联想 -->
		<view class="search-associative" v-if="associativeShow">
			<uni-list>
				<uni-list-item  v-for="(item,index) in associativeList" :key="item._id" :ellipsis="1" :title="item.name" @click="associativeClick(item)" show-extra-icon
				 clickable :extra-icon="{size:18,color:iconColor,type:'search'}" >
				</uni-list-item>
			</uni-list>
		</view>
	</view>
</template>

<script>
// ... 保持原有 script 内容 ...
</script>

<style scoped lang="scss">
.container {
	height: 100%;
	display: flex;
	flex-direction: column;
	background-color: #f7f7f7;
}

.search-container {
	height: 52px;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	position: relative;
	background-color: #fff;
}
.search-container-bar {
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
}

.search-body {
	background-color: #fff;
	border-bottom-right-radius: 10px;
	border-bottom-left-radius: 10px;
}

.search-associative {
	overflow-y: auto;
	position: absolute;
	top: 52px;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: #fff;
	margin-top: 10px;
	padding-left: 10px;
	padding-right: 10px;
}

.search-icons {
	padding: 16px;
}

.flex-center {
	display: flex;
	justify-content: center;
	align-items: center;
}
.flex-row {
	display: flex;
	flex-direction: row;
}

.word-display {
	font-size: 16px;
	color: #666;
}

.word-container {
	padding: 20px;
}
.word-container_header {
	display: flex;
	height: 36px;
	line-height: 36px;
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
}
.word-container_header-text {
	color: #3e3e3e;
	font-size: 18px;
	font-weight: bold;
}
.word-container_body {
	display: flex;
	flex-wrap: wrap;
	flex-direction: row;
}
.word-container_body-text {
	display: flex;
	justify-content: center;
	align-items: center;
	font-size: 16px;
	color: #666;
	background-color: #f6f6f6;
	padding: 10px 20px;
	margin: 10px 15px 0 0;
	border-radius: 30px;
	box-sizing: border-box;
	text-align: center;
}
.word-container_body-info {
	display: block;
	flex: 1;
	text-align: center;
	font-size: 16px;
	color: #808080;
	margin-top: 20px;
}
</style> 