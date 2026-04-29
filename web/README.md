# Java 面试宝典 Web App

基于 DESIGN.md 设计系统打造的移动端友好面试题学习工具。

## 特性

- 📱 **移动端优先**: 适配手机屏幕，支持触摸操作
- 🔍 **全文搜索**: 支持模糊搜索，快速找到题目
- 🌙 **暗黑模式**: 一键切换，保护眼睛
- 📴 **离线可用**: PWA 支持，无网络也能学习
- ⚡ **快速加载**: 按需加载分类，首屏秒开
- 🎨 **精美设计**: 温暖的奶油色系，珊瑚色强调

## Vercel 部署指南

### 方式一：Vercel CLI（推荐）

```bash
# 1. 进入项目目录
cd web

# 2. 安装 Vercel CLI（如果还没有）
npm i -g vercel

# 3. 登录 Vercel
vercel login

# 4. 部署
vercel --prod

# 5. 绑定自定义域名
```

### 方式二：Git 集成（自动部署）

```bash
# 1. 创建 git 仓库并推送
cd web
git init
git add .
git commit -m "Initial commit"

# 2. 推送到 GitHub/GitLab
# 然后在 Vercel Dashboard 中导入项目

# 3. 配置环境变量（如果需要）
# 在 Vercel Dashboard → Project Settings → Environment Variables 中设置
```

### 配置自定义域名

1. 在 Vercel Dashboard 进入项目
2. 点击 **Settings** → **Domains**
3. 添加 `自有域名`
4. 按提示在 DNS 服务商添加 CNAME 记录：
   - 类型: CNAME
   - 名称: interview
   - 值: cname.vercel-dns.com

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
├── vercel.json          # Vercel 部署配置
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
