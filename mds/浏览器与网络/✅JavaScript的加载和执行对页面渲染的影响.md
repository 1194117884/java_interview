# ✅JavaScript的加载和执行对页面渲染的影响

# 典型回答

JavaScript 的加载和执行对页面渲染有显著的阻塞影响，主要体现在以下几个方面：

**1. 阻塞 HTML 解析**：默认情况下，当浏览器在解析 HTML 过程中遇到 `<script>` 标签（无 `async` 或 `defer` 属性），会立即暂停 DOM 树的构建，转而下载并执行 JavaScript 脚本，直到执行完毕才继续解析 HTML。

**2. 阻塞 CSSOM 构建**：如果 JavaScript 试图访问或修改样式（如读取 `getComputedStyle`），它必须等待 CSSOM 构建完成才能执行。因此，位于 CSS 后面的 `<script>` 标签会等待 CSS 加载并构建 CSSOM 后再执行，形成"CSS 阻塞 JS，JS 阻塞 DOM"的链式阻塞。

**3. 影响首屏渲染**：由于 JS 的阻塞特性，如果首屏需要的关键 JS 资源加载过慢，会延迟首次渲染时间（FCP），影响用户体验。

解决方案：使用 `async` 或 `defer` 属性加载非关键的脚本，或者将脚本放在 `<body>` 底部。

# 扩展知识

### script 标签的三种加载方式对比

```html
<!-- 1. 默认（同步）加载：阻塞解析 -->
<script src="normal.js"></script>

<!-- 2. defer 加载：HTML解析完成后执行（按顺序） -->
<script src="defer.js" defer></script>

<!-- 3. async 加载：下载完成后立即执行（不保证顺序） -->
<script src="async.js" async></script>
```

| 特性 | 默认 | defer | async |
|------|------|-------|-------|
| 下载是否阻塞HTML解析 | 是 | 否 | 否 |
| 执行时机 | 下载完成后立即执行 | HTML解析完成后，DOMContentLoaded之前 | 下载完成后立即执行 |
| 执行顺序 | 按文档顺序 | 按文档顺序 | 不保证顺序（谁先下载完谁先执行） |
| 对DOMContentLoaded影响 | 延迟触发 | 延迟触发（在defer执行后触发） | 可能在DCL之前或之后 |
| 适用场景 | 模块加载器、需立即执行的逻辑 | 依赖DOM的操作、普通脚本 | 独立脚本（如统计、广告） |
| 多个脚本的依赖关系 | 按顺序执行 | 按顺序执行 | 无序，不适用有依赖的脚本 |

### 解析过程中的阻塞链

```text
HTML 解析开始
  │
  ├──> 遇到普通 <script src="app.js">
  │      │
  │      ├── ① 暂停 HTML 解析
  │      ├── ② 下载 app.js（网络请求，阻塞解析）
  │      │     如果前面有 <link rel="stylesheet">（CSS资源）
  │      │     └──> 还要等 CSSOM 构建完成（blocking chain）
  │      ├── ③ 执行 app.js（阻塞解析）
  │      └── ④ 恢复 HTML 解析
  │
  ├──> 遇到 <script async>
  │      ├── 不暂停 HTML 解析，并行下载
  │      └── 下载完成后立即暂停解析并执行
  │
  ├──> 遇到 <script defer>
  │      ├── 不暂停 HTML 解析，并行下载
  │      └── HTML 解析完成后顺序执行
  │
  └──> HTML 解析完成
         └──> DOMContentLoaded 事件
```

### CSS 对 JavaScript 的阻塞效应

```html
<!-- 阻塞链示例 -->
<link rel="stylesheet" href="styles.css"> <!-- 1. 开始下载 CSS -->
<script src="app.js"></script>             <!-- 2. 等待 CSS 下载完成 -->
<!-- 
  为什么 JavaScript 会等待 CSS？
  因为 JavaScript 可能读取样式信息：
  - getComputedStyle(element)
  - element.offsetWidth / offsetHeight
  - window.getComputedStyle()
  如果 JS 在 CSSOM 未就绪时执行，会读到错误的值。
-->
```

```javascript
// JavaScript 在 CSSOM 未就绪前执行会得到不一致的结果
const el = document.querySelector('.box');
const style = getComputedStyle(el);
console.log(style.height); // 如果 CSSOM 未就绪，可能得到错误值
```

### 动态脚本加载

```javascript
// 动态创建脚本元素（默认 async）
const script = document.createElement('script');
script.src = 'dynamic.js';
document.body.appendChild(script);
// 动态创建的脚本默认是 async 行为

// 设置为非 async 使其按顺序执行
script.async = false;
script.src = 'dep1.js';
document.body.appendChild(script);

const script2 = document.createElement('script');
script2.async = false;
script2.src = 'dep2.js';
document.body.appendChild(script2);
// 此时 dep1.js 会在 dep2.js 之前执行
```

### 现代优化技术

```html
<!-- 1. Preload 预加载关键脚本 -->
<link rel="preload" href="critical.js" as="script">
<!-- 预加载通知浏览器提前下载，但不执行 -->

<!-- 2. Prefetch 预获取未来页面需要的脚本 -->
<link rel="prefetch" href="next-page.js" as="script">
<!-- 在空闲时下载，用于未来导航 -->

<!-- 3. Module scripts（默认 defer） -->
<script type="module" src="main.js"></script>
<!-- ES Module 自动 defer，支持 import -->

<!-- 4. 内联关键 JavaScript -->
<script>
// 关键渲染路径需要的 JavaScript 直接内联
// 减少网络请求次数
(function() {
  'use strict';
  // 关键逻辑，如首屏交互
})();
</script>
```

### 测量脚本对渲染的影响

```javascript
// 使用 Performance API 测量解析阻塞
const observer = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach(entry => {
    if (entry.initiatorType === 'script') {
      console.log('脚本:', entry.name);
      console.log('阻塞延迟:', entry.duration, 'ms');
    }
  });
});
observer.observe({ entryTypes: ['resource'] });

// 测量 DOMContentLoaded 和 Load 时间
document.addEventListener('DOMContentLoaded', () => {
  const timing = performance.getEntriesByType('navigation')[0];
  console.log('DOMContentLoaded:', timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart);
  console.log('Load:', timing.loadEventEnd - timing.loadEventStart);
});
```

### 实际项目中的加载策略

| 场景 | 策略 | 原因 |
|------|------|------|
| 核心框架（React/Vue） | 使用 `<script defer>` 或放在 `<body>` 底部 | 需要完整 DOM 才能挂载 |
| 首屏交互脚本 | 内联 + 关键CSS后立即执行 | 尽快响应用户操作 |
| 第三方分析工具 | `async` 加载 | 独立功能，不依赖其他资源 |
| 图片懒加载库 | 首屏渲染完成后 `defer` 加载 | 非首屏必须 |
| 聊天插件 | 页面完全加载后动态创建 | 优先级最低 |
| Polyfill | 放在 `<head>` 中用 `defer` | 需在业务逻辑前准备好 |
