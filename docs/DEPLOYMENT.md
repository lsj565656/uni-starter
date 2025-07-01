# 协议文档部署说明

## 方案一：GitHub Pages（推荐）

### 1. 创建 GitHub 仓库
1. 在 GitHub 上创建一个新的仓库
2. 将项目代码推送到仓库

### 2. 启用 GitHub Pages
1. 进入仓库设置（Settings）
2. 找到 "Pages" 选项
3. 在 "Source" 中选择 "Deploy from a branch"
4. 选择 "main" 分支和 "/docs" 文件夹
5. 点击 "Save"

### 3. 访问地址
启用后，您的协议文档将通过以下地址访问：
- 用户服务协议：`https://[用户名].github.io/[仓库名]/user-service-agreement.html`
- 隐私政策：`https://[用户名].github.io/[仓库名]/privacy-policy.html`

### 4. 更新配置文件
在 `uni_modules/uni-id-pages/config.js` 中更新地址：

```javascript
agreements: {
  serviceUrl: 'https://[用户名].github.io/[仓库名]/user-service-agreement.html',
  privacyUrl: 'https://[用户名].github.io/[仓库名]/privacy-policy.html',
  scope: ['register', 'login', 'realNameVerify']
}
```

## 方案二：GitHub Raw 文件

### 1. 直接使用 Raw 地址
GitHub 提供原始文件访问服务，地址格式为：
- 用户服务协议：`https://raw.githubusercontent.com/[用户名]/[仓库名]/main/docs/user-service-agreement.html`
- 隐私政策：`https://raw.githubusercontent.com/[用户名]/[仓库名]/main/docs/privacy-policy.html`

### 2. 更新配置文件
```javascript
agreements: {
  serviceUrl: 'https://raw.githubusercontent.com/[用户名]/[仓库名]/main/docs/user-service-agreement.html',
  privacyUrl: 'https://raw.githubusercontent.com/[用户名]/[仓库名]/main/docs/privacy-policy.html',
  scope: ['register', 'login', 'realNameVerify']
}
```

## 方案三：自建服务器

### 1. 部署到 Web 服务器
将 `docs` 目录下的文件部署到支持 HTTPS 的 Web 服务器上。

### 2. 更新配置文件
```javascript
agreements: {
  serviceUrl: 'https://[您的域名]/user-service-agreement.html',
  privacyUrl: 'https://[您的域名]/privacy-policy.html',
  scope: ['register', 'login', 'realNameVerify']
}
```

## 方案四：使用 CDN 服务

### 1. 上传到 CDN
将 HTML 文件上传到 CDN 服务（如阿里云 OSS、腾讯云 COS 等）。

### 2. 更新配置文件
```javascript
agreements: {
  serviceUrl: 'https://[CDN域名]/user-service-agreement.html',
  privacyUrl: 'https://[CDN域名]/privacy-policy.html',
  scope: ['register', 'login', 'realNameVerify']
}
```

## 注意事项

1. **HTTPS 要求**：应用商店要求协议链接必须使用 HTTPS
2. **访问速度**：建议选择访问速度较快的服务器
3. **内容更新**：协议内容更新后需要重新部署
4. **备份**：建议保留协议文档的备份

## 测试验证

部署完成后，请测试以下内容：
1. 协议链接是否可以正常访问
2. 在应用内点击协议链接是否正常打开
3. 协议内容是否正确显示
4. 移动端访问是否正常 