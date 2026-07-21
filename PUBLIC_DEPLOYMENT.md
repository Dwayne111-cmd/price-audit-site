# 价差归因 / 价审网站公网部署说明

## 推荐方案

先用 GitHub Pages 上线静态版，适合手机随时预览和给内部人员看页面效果。

当前发布目录是：

```text
outputs/
```

GitHub Actions 工作流已经配置好：

```text
.github/workflows/deploy-pages.yml
```

只要代码推送到 GitHub 仓库的 `main` 分支，GitHub Pages 会自动发布。

## 上线前必须确认

`outputs/data/company-procurement-prices.json` 会被一起发布到公网。

如果这里将来放的是公司真实价格，不建议直接上 GitHub Pages。更稳的做法是：

- 页面仍然放 GitHub Pages、Cloudflare Pages 或 Vercel。
- 公司价格放后端私有 API。
- API 开启 token、账号登录或内网权限。
- 前端只请求 API，不直接暴露 JSON 文件。

现在这个版本适合作为外网预览版或演示版。

## GitHub Pages 操作步骤

1. 打开 GitHub，新建一个仓库，例如：

```text
price-audit-site
```

2. 在本机项目目录初始化并提交：

```powershell
git init
git add .
git commit -m "Initial price audit site"
```

3. 绑定你的 GitHub 仓库地址：

```powershell
git branch -M main
git remote add origin https://github.com/你的用户名/price-audit-site.git
git push -u origin main
```

4. 打开 GitHub 仓库：

```text
Settings -> Pages
```

5. Source 选择：

```text
GitHub Actions
```

6. 等待 Actions 跑完，GitHub 会生成外网地址：

```text
https://你的用户名.github.io/price-audit-site/
```

## 后续更新网站

以后本地改完页面后执行：

```powershell
git add .
git commit -m "Update price audit site"
git push
```

GitHub Pages 会自动重新发布。

## 如果要上真实业务版

真实业务版建议不要用纯静态 JSON 暴露公司价格。建议改成：

```text
前端页面：GitHub Pages / Cloudflare Pages / Vercel
后端 API：Vercel Functions / Cloudflare Workers / Render / 公司服务器
数据：服务器私有目录或数据库
权限：API_TOKEN / 登录 / 企业内权限
```

这样手机能访问页面，但公司价格不会被直接下载。
