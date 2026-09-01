# Cloudflare Worker 部署

## 1. 创建 D1

```bash
npx wrangler d1 create java-interview
```

将返回的 `database_id` 填入 `wrangler.toml`（可从 `wrangler.toml.example` 复制）。

## 2. 执行迁移并部署

```bash
npx wrangler d1 migrations apply java-interview --remote
npx wrangler deploy
npx wrangler secret put MODEL_API_KEY
```

可选的服务端变量：`MODEL_PROVIDER`、`MODEL_NAME`。Worker 使用 D1 的 `api_records` 表保存按用户隔离的资源。

## 3. 部署前端

Cloudflare Pages 的根目录设为 `web`，构建命令为 `npm run build`，输出目录为 `dist`。在 Pages 环境变量中设置：

```text
VITE_API_BASE_URL=https://你的-worker域名.workers.dev
```

不要把 `MODEL_API_KEY` 设置为 `VITE_` 开头的变量；Vite 变量会进入浏览器构建产物。
