# 文档说明

本目录包含应用的法律文档，包括：

- [用户服务协议](./user-service-agreement.md)
- [隐私政策](./privacy-policy.md)

这些文档可以通过以下方式访问：

## GitHub Pages 访问

如果您将项目推送到 GitHub，可以启用 GitHub Pages 功能：

1. 在 GitHub 仓库设置中启用 Pages
2. 选择 `docs` 目录作为源
3. 访问地址将是：`https://[用户名].github.io/[仓库名]/`

## 本地访问

您也可以将这些文件部署到任何支持 HTTPS 的 Web 服务器上。

## 配置应用

在 `uni_modules/uni-id-pages/config.js` 中配置协议地址：

```javascript
agreements: {
  serviceUrl: 'https://[您的域名]/user-service-agreement.html',
  privacyUrl: 'https://[您的域名]/privacy-policy.html',
  scope: ['register', 'login', 'realNameVerify']
}
``` 