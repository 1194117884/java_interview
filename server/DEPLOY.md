# Cloudflare Worker 部署

也可以在项目根目录直接运行一键脚本：

```bash
VITE_API_BASE_URL=https://你的-worker域名.workers.dev \\
MODEL_API_KEY=你的模型密钥 \\
./scripts/deploy-cloudflare.sh
```

脚本会登录检查、部署 Worker、写入可选的模型密钥、构建前端并部署 Pages。只部署 Worker 时设置 `SKIP_PAGES=1`。

## 1. 复制配置并部署 Worker

```bash
cp wrangler.toml.example wrangler.toml
npx wrangler login
npx wrangler deploy
npx wrangler secret put MODEL_API_KEY
```

可选的服务端变量：`MODEL_PROVIDER`、`MODEL_NAME`。Worker 不依赖数据库；浏览器端的面试配置、报告和能力记忆使用 `localStorage` 保存。

## 2. 部署前端

Cloudflare Pages 的根目录设为 `web`，构建命令为 `npm run build`，输出目录为 `dist`。在 Pages 环境变量中设置：

```text
VITE_API_BASE_URL=https://你的-worker域名.workers.dev
```

不要把 `MODEL_API_KEY` 设置为 `VITE_` 开头的变量；Vite 变量会进入浏览器构建产物。

本地存储仅属于当前浏览器和设备，不会跨设备同步；清理浏览器站点数据会删除本地记录。
