# Java 面试宝典 Web App

基于 DESIGN.md 设计系统打造的移动端友好面试题学习工具。

## 特性

- 📱 **移动端优先**: 适配手机屏幕，支持触摸操作
- 🔍 **全文搜索**: 支持模糊搜索，快速找到题目
- 🌙 **暗黑模式**: 一键切换，保护眼睛
- 📴 **离线可用**: PWA 支持，无网络也能学习
- ⚡ **快速加载**: 按需加载分类，首屏秒开
- 🎨 **精美设计**: 温暖的奶油色系，珊瑚色强调

## Cloudflare Pages 部署指南

### 方式一：Wrangler CLI（直接上传）

```bash
# 1. 进入项目目录
cd web

# 2. 安装 Wrangler CLI（如果还没有）
npm i -g wrangler

# 3. 登录 Cloudflare
wrangler login

# 4. 构建项目
npm run build

# 5. 部署到 Cloudflare Pages
wrangler pages deploy ./dist --project-name=java-interview

# 6. 绑定自定义域名
wrangler pages project set-domain java-interview your-domain.com
```

### 方式二：Git 集成（自动部署）

1. Push 项目到 GitHub/GitLab
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
3. 进入 **Workers & Pages** → **创建** → **Pages** → **连接到 Git**
4. 选择仓库，配置构建设置：
   - **构建命令**: `npm run build`
   - **构建输出目录**: `dist`
   - **根目录**: `web`
5. 点击部署 — 之后每次 push 都会自动部署

### 配置自定义域名

1. 在 Cloudflare Dashboard 进入 Pages 项目
2. 点击 **自定义域** → **设置自定义域**
3. 输入域名（如 `interview.yourdomain.com`）
4. 如果域名已在 Cloudflare 托管，DNS 记录会自动配置
5. 如果域名在其他服务商，按提示添加 CNAME 记录：
   - 类型: CNAME
   - 名称: interview
   - 值: `java-interview.pages.dev`

### 本地预览

```bash
# 构建后本地预览
npm run build
npx wrangler pages dev ./dist
```

## 本地开发

```bash
cd web
npm install
npm run dev
```

访问 http://localhost:5173

## 构建

```bash
npm run build
```

输出到 `dist/` 目录。

## 数据更新

如果 `mds/` 目录的内容更新了，重新生成数据：

```bash
npm run build:data
```

## 项目结构

```
web/
├── public/              # 静态资源
│   ├── icons/           # PWA 图标
│   └── manifest.json    # PWA 配置
├── scripts/
│   └── build-data.js    # Markdown 转 JSON 脚本
├── src/
│   ├── components/      # React 组件
│   ├── data/            # 生成的 JSON 数据
│   ├── hooks/           # 自定义 Hooks
│   ├── stores/          # 状态管理
│   └── styles/          # 全局样式
├── wrangler.jsonc       # Cloudflare Pages 配置
└── package.json
```

## PWA 安装

1. 使用 Chrome/Edge/Safari 访问网站
2. 点击地址栏右侧的 "安装" 或 "添加到主屏幕"
3. 即可像原生 App 一样使用

## 设计系统

基于 DESIGN.md 实现：

- **主色调**: 珊瑚色 `#cc785c`
- **背景色**: 奶油色 `#faf9f5`（浅色）/ `#181715`（深色）
- **字体**: Cormorant Garamond（标题）+ Inter（正文）

## 技术栈

- Vite 5 + React 18 + TypeScript
- Tailwind CSS
- React Markdown + Syntax Highlighter
- Fuse.js 搜索
- Zustand 状态管理
- PWA (Service Worker)

## 许可证

MIT
