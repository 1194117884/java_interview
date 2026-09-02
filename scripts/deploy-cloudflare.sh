#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_DIR="$ROOT_DIR/server"
WEB_DIR="$ROOT_DIR/web"
PAGES_PROJECT="${CF_PAGES_PROJECT:-java-interview-web}"

die() {
    printf '错误: %s\n' "$*" >&2
    exit 1
}

command -v node >/dev/null 2>&1 || die '未找到 node，请先安装 Node.js。'
command -v npx >/dev/null 2>&1 || die '未找到 npx，请先安装 Node.js。'

if [[ ! -f "$SERVER_DIR/wrangler.toml" ]]; then
    cp "$SERVER_DIR/wrangler.toml.example" "$SERVER_DIR/wrangler.toml"
fi

printf '==> 检查 Cloudflare 登录状态\n'
(cd "$SERVER_DIR" && npx wrangler whoami >/dev/null 2>&1) || {
    printf '尚未登录 Cloudflare，打开浏览器完成授权...\n'
    (cd "$SERVER_DIR" && npx wrangler login)
}

printf '==> 部署 Worker\n'
(cd "$SERVER_DIR" && npx wrangler deploy)

if [[ -n "${MODEL_API_KEY:-}" ]]; then
    printf '==> 写入 MODEL_API_KEY secret\n'
    printf '%s' "$MODEL_API_KEY" | (cd "$SERVER_DIR" && npx wrangler secret put MODEL_API_KEY)
else
    printf '提示: 未设置 MODEL_API_KEY，跳过 secret 写入。\n'
fi

if [[ "${SKIP_PAGES:-0}" == '1' ]]; then
    printf '==> 已跳过 Pages 部署（SKIP_PAGES=1）\n'
    exit 0
fi

[[ -n "${VITE_API_BASE_URL:-}" ]] || die '请设置 VITE_API_BASE_URL，例如 https://你的-worker.workers.dev；仅部署 Worker 可使用 SKIP_PAGES=1。'

printf '==> 构建前端\n'
(cd "$WEB_DIR" && VITE_API_BASE_URL="$VITE_API_BASE_URL" npm run build)

printf '==> 部署 Cloudflare Pages: %s\n' "$PAGES_PROJECT"
(cd "$WEB_DIR" && npx wrangler pages deploy dist --project-name "$PAGES_PROJECT")

printf '完成：Worker 与 Pages 已部署。\n'
