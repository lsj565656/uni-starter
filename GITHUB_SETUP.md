# GitHub 上传步骤指南

## 准备工作

### 1. 安装 Git
如果还没有安装 Git，请先下载安装：
- Windows: https://git-scm.com/download/win
- macOS: `brew install git`
- Linux: `sudo apt-get install git` 或 `sudo yum install git`

### 2. 配置 Git
```bash
# 设置用户名和邮箱
git config --global user.name "你的GitHub用户名"
git config --global user.email "你的邮箱地址"

# 查看配置
git config --list
```

### 3. 创建 GitHub 仓库
1. 登录 GitHub (https://github.com)
2. 点击右上角 "+" 号，选择 "New repository"
3. 填写仓库信息：
   - Repository name: `uni-starter` (或你想要的名称)
   - Description: `uni-app starter project with user authentication`
   - 选择 Public 或 Private
   - **不要**勾选 "Initialize this repository with a README"
4. 点击 "Create repository"

## 上传步骤

### 步骤 1: 初始化本地 Git 仓库
```bash
# 进入项目根目录
cd /path/to/your/uni-starter

# 初始化 Git 仓库
git init
```

### 步骤 2: 添加远程仓库
```bash
# 添加远程仓库（替换为你的 GitHub 仓库地址）
git remote add origin https://github.com/你的用户名/uni-starter.git

# 验证远程仓库
git remote -v
```

### 步骤 3: 添加文件到暂存区
```bash
# 添加所有文件（.gitignore 会自动忽略不需要的文件）
git add .

# 查看暂存区状态
git status
```

### 步骤 4: 提交代码
```bash
# 创建第一次提交
git commit -m "Initial commit: uni-app starter project"

# 查看提交历史
git log --oneline
```

### 步骤 5: 推送到 GitHub
```bash
# 推送到主分支（如果是新仓库，使用 -u 设置上游分支）
git push -u origin main

# 如果默认分支是 master，则使用：
# git push -u origin master
```

## 验证上传

### 1. 检查 GitHub 仓库
- 访问你的 GitHub 仓库页面
- 确认所有文件都已上传
- 检查 `.gitignore` 是否生效（忽略的文件不会显示）

### 2. 检查忽略的文件
确认以下文件/目录**没有**被上传：
- `unpackage/` 目录
- `node_modules/` 目录
- `.hbuilderx/` 目录
- 各种日志和临时文件

## 后续操作

### 1. 启用 GitHub Pages（用于协议文档）
1. 进入仓库设置 (Settings)
2. 找到 "Pages" 选项
3. 在 "Source" 中选择 "Deploy from a branch"
4. 选择 "main" 分支和 "/docs" 文件夹
5. 点击 "Save"

### 2. 更新协议配置
启用 GitHub Pages 后，更新 `uni_modules/uni-id-pages/config.js`：
```javascript
agreements: {
  serviceUrl: 'https://你的用户名.github.io/uni-starter/user-service-agreement.html',
  privacyUrl: 'https://你的用户名.github.io/uni-starter/privacy-policy.html',
  scope: ['register', 'login', 'realNameVerify']
}
```

### 3. 提交配置更新
```bash
git add uni_modules/uni-id-pages/config.js
git commit -m "Update agreement URLs to GitHub Pages"
git push
```

## 常用 Git 命令

### 查看状态
```bash
git status                    # 查看工作区状态
git log --oneline            # 查看提交历史
git branch                   # 查看分支
```

### 更新代码
```bash
git add .                    # 添加所有更改
git commit -m "描述信息"      # 提交更改
git push                     # 推送到远程仓库
```

### 拉取更新
```bash
git pull                     # 拉取远程更新
git fetch                    # 获取远程更新但不合并
```

### 分支操作
```bash
git branch feature-name      # 创建新分支
git checkout feature-name    # 切换到分支
git merge feature-name       # 合并分支
```

## 注意事项

1. **敏感信息**：确保没有上传包含密码、密钥等敏感信息的文件
2. **大文件**：GitHub 对单个文件有 100MB 限制，大文件建议使用 Git LFS
3. **协作开发**：如果是团队项目，建议设置分支保护规则
4. **定期备份**：建议定期推送到 GitHub 作为备份

## 故障排除

### 如果推送失败
```bash
# 检查远程仓库配置
git remote -v

# 重新设置远程仓库
git remote remove origin
git remote add origin https://github.com/你的用户名/uni-starter.git

# 强制推送（谨慎使用）
git push -f origin main
```

### 如果分支名称不匹配
```bash
# 查看当前分支
git branch

# 重命名分支
git branch -m master main

# 推送新分支
git push -u origin main
```

### 如果需要忽略已提交的文件
```bash
# 从 Git 中移除文件但保留本地文件
git rm --cached 文件名

# 提交更改
git commit -m "Remove file from tracking"
git push
``` 