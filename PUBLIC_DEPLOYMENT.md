# MarketLens 公网部署

公网地址：

    https://dwayne111-cmd.github.io/price-audit-site/

main 分支推送后，.github/workflows/deploy-pages.yml 会自动发布 outputs/。根地址会进入新版 ui-concepts/，旧市场与基金页面保留在 market-dashboard.html。

## 数据分层

- 市场、基金和稀土：公开来源快照，由 daily-prices.yml 每日更新。
- 公司内部电子料：只发布 AES-256-GCM 加密文件 outputs/data/component-quotes.secure.json。
- 访问口令：仅保存在本机 private-data/component-access-key.txt，不会提交到 GitHub。
- 原 Excel、internal-quotes.json、规格书路径和 API 密钥禁止发布。

发布工作流包含隔离检查；一旦发现访问口令或原始内部数据库，部署会直接失败。

## 更新内部电子料

先启动本机 MarketLens，再运行：

    & 'C:\Users\15175\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'C:\Users\15175\Documents\Codex\2026-07-13\c\work\build-secure-pages-data.mjs' --deploy-repo 'C:\Users\15175\Documents\Codex\2026-07-08\new-chat-2' --source-root 'C:\Users\15175\Documents\Codex\2026-07-13\c\outputs\market-dashboard' --api 'http://127.0.0.1:8900'

脚本会校验内部记录数量、生成新的加密包并同步新版前端。访问口令文件已存在时不会自动更换。

## 手机访问

手机可直接打开公网地址。进入“参数成本”后输入本机访问口令；口令和解密后的数据只保留在当前页面内存，刷新页面后清除。
