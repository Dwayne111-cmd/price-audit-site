# 料差智析部署说明

这是一个纯静态网站，核心文件只有：

- `index.html`
- `styles.css`
- `app.js`

`preview-server.mjs` 和 `start-preview.cmd` 只用于本地预览，上线时不需要。

## 当前预览方式

当前地址：

```text
http://127.0.0.1:4173/
```

这个地址只代表“当前电脑本机”。手机、其他电脑、外网用户都不能直接访问。

## 推荐上线方式

### 方案 A：Cloudflare Pages

适合长期外网访问，免费额度充足，访问速度稳定。

1. 新建一个 GitHub 仓库。
2. 上传 `index.html`、`styles.css`、`app.js`。
3. 在 Cloudflare Pages 选择该仓库。
4. 构建命令留空。
5. 输出目录填写 `/`。
6. 部署完成后会得到一个 `*.pages.dev` 外网地址。

### 方案 B：Netlify Drop

适合最快拿到外网预览地址。

1. 打开 Netlify 的站点拖拽部署页面。
2. 把 `outputs` 文件夹拖进去。
3. 部署完成后会得到一个 `*.netlify.app` 外网地址。

注意：如果只想上线页面本身，可以只上传 `index.html`、`styles.css`、`app.js`。

### 方案 C：GitHub Pages

适合项目后续持续维护。

1. 新建 GitHub 仓库。
2. 上传 `index.html`、`styles.css`、`app.js` 到仓库根目录。
3. 在仓库 Settings -> Pages 中选择部署分支。
4. 保存后会得到一个 `https://用户名.github.io/仓库名/` 地址。

## 不推荐的方式

不建议把家里或公司电脑端口直接映射到公网。这样需要路由器端口转发、固定公网 IP 或内网穿透，并且安全风险更高。这个项目是纯静态站，直接部署到静态托管平台更稳。

## 后续上线前整理

等页面确认通过后，建议把最终上线目录整理为：

```text
site/
  index.html
  styles.css
  app.js
  assets/
```

之后把外链图片替换为本地 `assets/` 素材，避免第三方图片失效。
