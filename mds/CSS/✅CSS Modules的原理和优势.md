# ✅CSS Modules的原理和优势

# 典型回答

**CSS Modules** 是一种 CSS 模块化方案，它在构建阶段（如 Webpack、Vite）将 CSS 类名进行**局部作用域化**处理，从根本上解决 CSS 全局命名冲突的问题。

## 核心原理

CSS Modules 的实现原理很简单：**将 CSS 类名编译为唯一的哈希字符串**，使其只在当前组件内生效。

### 编译前

```css
/* style.module.css */
.title {
  font-size: 24px;
  color: #333;
}

.highlight {
  background: yellow;
}
```

```javascript
// React 组件
import styles from './style.module.css';

function Component() {
  return <h1 className={styles.title}>标题</h1>;
}
```

### 编译后

```css
/* 构建后生成的 CSS */
.style_title_1a2b3 {
  font-size: 24px;
  color: #333;
}

.style_highlight_4d5e6 {
  background: yellow;
}
```

```javascript
// JS 中的 styles 对象
console.log(styles);
// { title: 'style_title_1a2b3', highlight: 'style_highlight_4d5e6' }
```

## 核心优势

| 优势 | 说明 |
|------|------|
| **局部作用域** | 类名自动哈希，避免全局冲突 |
| **显式依赖** | JS 显式引用 CSS，清楚知道组件依赖哪些样式 |
| **无全局污染** | 不会污染其他组件或页面 |
| **可组合** | 支持 `composes` 语法实现样式组合 |
| **构建时处理** | 无运行时开销 |
| **Tree Shaking** | 未使用的样式可被构建工具移除 |

# 扩展知识

## CSS Modules vs 其他方案对比

| 特性 | CSS Modules | CSS-in-JS | BEM | Scoped CSS（Vue） |
|------|-------------|-----------|-----|------------------|
| 作用域隔离 | 强（编译哈希） | 强 | 中（靠约定） | 强（属性选择器） |
| 运行时开销 | 无 | 有（生成和注入样式） | 无 | 无 |
| 学习成本 | 低 | 中 | 低 | 低 |
| 动态样式 | 通过 JS 切换类名 | 原生支持 | 通过 JS | 通过绑定 |
| 类型安全 | 需要 .d.ts | 有 | 无 | 无 |
| 调试难度 | 中（哈希类名） | 低 | 低 | 低 |
| 打包大小 | 小 | 中大 | 小 | 小 |

## 配置 CSS Modules

### Webpack 配置

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.module\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[name]__[local]--[hash:base64:5]',
                // 开发环境: '[path][name]__[local]'
                // 生产环境: '[hash:base64:8]'
              },
            },
          },
        ],
      },
    ],
  },
};
```

### Vite 配置

```javascript
// vite.config.js
export default {
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',  // 类名转驼峰
      scopeBehaviour: 'local',            // local | global
      generateScopedName: '[name]__[local]___[hash:base64:5]',
    },
  },
};
```

## 进阶用法

### 1. 全局样式

```css
/* 使用 :global 声明全局样式 */
.title {
  color: #333;
}

:global(.global-class) {
  font-size: 18px;
}

:global {
  .global-class {
    margin: 0;
  }
}
```

### 2. 样式组合（composes）

```css
/* base.css */
.base {
  font-size: 16px;
  line-height: 1.5;
}

/* button.module.css */
.button {
  composes: base from './base.css';
  padding: 8px 16px;
  background: blue;
}

.primary {
  composes: button;  /* 继承 .button 的样式 */
  background: green;
}
```

### 3. 驼峰命名

```css
/* 传统命名 */
.my-title { ... }

/* 启用 camelCase 后 */
styles.myTitle  /* 在 JS 中使用 */
```

配置 `localsConvention`：

```javascript
// 配置选项
{
  localsConvention: 'camelCase'        // my-title → myTitle
  // 或 'camelCaseOnly'
  // 或 'dashesOnly'
  // 或 'asIs'（默认）
}
```

### 4. 变量传递

```css
/* 组件内使用 CSS 变量传递动态值 */
.title {
  color: var(--text-color, #333);
  font-size: var(--font-size, 16px);
}
```

```javascript
function Component({ color, size }) {
  return (
    <h1
      className={styles.title}
      style={{
        '--text-color': color,
        '--font-size': size,
      }}
    >
      标题
    </h1>
  );
}
```

## 类型安全

TypeScript 项目中需要为 `.module.css` 文件声明类型：

```typescript
// src/globals.d.ts 或 env.d.ts
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
```

或者使用 `typed-css-modules` 自动生成 `.d.ts` 文件：

```bash
npm install -g typed-css-modules
tcm src
```

## 调试技巧

### Source Map 配置

```javascript
// 开启 Source Map，在 DevTools 中查看原始类名
{
  loader: 'css-loader',
  options: {
    modules: {
      localIdentName: '[name]__[local]--[hash:base64:5]',
    },
    sourceMap: true,
  },
}
```

### 开发环境 vs 生产环境

```javascript
// 开发环境：保留可读名称
const localIdentName = isDev
  ? '[path][name]__[local]'
  : '[hash:base64:8]';
```

## 在框架中使用

### React

```javascript
import styles from './Button.module.css';

function Button({ variant, children }) {
  return (
    <button
      className={`${styles.button} ${styles[variant]}`}
    >
      {children}
    </button>
  );
}
```

### Vue（配合 CSS Modules）

```vue
<template>
  <h1 :class="$style.title">标题</h1>
</template>

<style module>
.title {
  color: #333;
}
</style>
```

### Next.js

Next.js 内置支持 CSS Modules，文件名以 `.module.css` 结尾即可：

```javascript
// pages/index.js
import styles from './index.module.css';

export default function Home() {
  return <div className={styles.container}>Hello</div>;
}
```

## 局限性与注意事项

| 问题 | 说明 | 解决方案 |
|------|------|---------|
| **调试困难** | 哈希类名不易识别 | 开发环境使用可读名称 |
| **第三方库覆盖** | 无法直接覆盖库样式 | 使用 `:global` 或 `unset` |
| **动态类名** | 拼接字符串较繁琐 | 使用 `classnames` 库 |
| **CSS 变量** | 变量不能模块化 | 结合 CSS 自定义属性使用 |
| **类型声明** | TypeScript 需要额外配置 | 添加 `.d.ts` 或使用自动生成工具 |

## 最佳实践

1. **命名约定**：文件名使用 `*.module.css` 后缀
2. **组件级样式**：每个组件独立 CSS Module 文件
3. **全局样式**：单独放在 `global.css` 中
4. **CSS 变量**：使用 CSS 自定义属性实现主题切换
5. **预处理器结合**：支持 SASS/Less 的 module 文件
