# ✅前端性能指标FCP、LCP、FID、CLS的含义

# 典型回答

FCP、LCP、FID、CLS 是 Google 定义的 **Core Web Vitals（核心网页指标）**，用于量化用户体验的三个方面：加载性能、交互性能和视觉稳定性。

| 指标 | 全称 | 含义 | 衡量内容 | 良好标准 |
|------|------|------|---------|---------|
| **FCP** | First Contentful Paint | 首次内容绘制 | 浏览器首次绘制任何内容（文本、图片、canvas等）的时间 | ≤ 1.8秒 |
| **LCP** | Largest Contentful Paint | 最大内容绘制 | 页面中最大可见内容元素（图片、视频、大文本块）完成渲染的时间 | ≤ 2.5秒 |
| **FID** | First Input Delay | 首次输入延迟 | 用户首次与页面交互（点击、按键）到浏览器能够响应该交互的时间 | ≤ 100毫秒 |
| **CLS** | Cumulative Layout Shift | 累积布局偏移 | 页面整个生命周期中所有意外布局偏移的总分数 | ≤ 0.1 |

**TBT（Total Blocking Time）** 和 **INP（Interaction to Next Paint）** 也是重要的补充指标。FID 正在逐渐被 INP 取代，后者衡量的是所有交互的延迟而非仅首次。

# 扩展知识

### 各指标的测量方式

```javascript
// FCP - 首次内容绘制
// 浏览器绘制第一个文本或图片的时间
new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach(entry => {
    console.log('FCP:', entry.startTime, 'ms');
    // 记录到分析系统
  });
}).observe({ type: 'paint', buffered: true });

// LCP - 最大内容绘制
// 监听页面中最大内容元素的渲染完成时间
new PerformanceObserver((list) => {
  const entries = list.getEntries();
  const lastEntry = entries[entries.length - 1];
  console.log('LCP:', lastEntry.startTime, 'ms');
  console.log('LCP元素:', lastEntry.element?.tagName, lastEntry.element?.src || '');
}).observe({ type: 'largest-contentful-paint', buffered: true });

// FID - 首次输入延迟
// 用户首次交互到事件处理器开始处理的时间差
new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach(entry => {
    console.log('FID:', entry.processingStart - entry.startTime, 'ms');
    console.log('交互类型:', entry.name);
    console.log('交互目标:', entry.target?.tagName);
  });
}).observe({ type: 'first-input', buffered: true });

// CLS - 累积布局偏移
// 累计所有意外布局偏移的分数
let clsValue = 0;
let clsEntries = [];

new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (!entry.hadRecentInput) { // 过滤掉用户交互导致的偏移
      clsValue += entry.value;
      clsEntries.push(entry);
    }
  }
  console.log('CLS:', clsValue);
}).observe({ type: 'layout-shift', buffered: true });

// TBT - 总阻塞时间（FCP之后，所有长任务的主线程阻塞时间总和）
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.duration > 50) {
      const blockingTime = entry.duration - 50;
      console.log('长任务:', entry.name, '阻塞:', blockingTime, 'ms');
    }
  }
}).observe({ type: 'longtask', buffered: true });
```

### LCP 的评分阈值和分布

```text
LCP 指标：
  良好（Good）： ≤ 2500ms (2.5秒)
  需改进（Needs Improvement）： 2500ms ~ 4000ms
  差（Poor）： > 4000ms (4秒)

根据 HTTP Archive 的数据统计（2024）：
  在移动端，约 50% 的网站 LCP 达标（≤2.5秒）
  在桌面端，约 60% 的网站 LCP 达标
```

### 影响 LCP 的关键因素

| 因素 | 影响 | 优化方向 |
|------|------|---------|
| TTFB（首字节时间） | 服务器响应速度 | CDN、服务器优化、缓存策略 |
| 资源加载时间 | 图片、字体等资源的加载 | 压缩、预加载、现代格式 |
| 渲染阻塞 | CSS 和 JS 阻塞渲染 | 内联关键CSS、defer JS |
| 客户端渲染 | JavaScript 生成 DOM 的耗时 | SSR、预渲染、代码优化 |

### CLS 分数的计算方式

```
CLS 分数 = 影响比例 × 距离比例

影响比例 = 不稳定元素在视口中的面积占比
距离比例 = 元素移动的距离相对于视口的比例

示例：
一个图片突然加载，向下推动了文本内容
- 受影响区域占视口的 30%（影响比例 = 0.3）
- 文本移动了视口高度的 25%（距离比例 = 0.25）
- CLS 分数 = 0.3 × 0.25 = 0.075（良好）
```

```css
/* 常见 CLS 问题及其解决方案 */

/* 问题1: 图片和视频没有设置尺寸 */
/* ❌ 问题代码 */
<img src="hero.jpg">  <!-- 浏览器不知道宽高 -->

/* ✅ 解决方案：设置明确的宽高比 */
<img src="hero.jpg" width="800" height="450" alt="横幅">
<img src="hero.jpg" style="aspect-ratio: 16/9;">

/* 问题2: 动态插入内容（广告、弹窗） */
/* ✅ 解决方案：为动态内容预留占位空间 */
.ad-container {
  min-height: 250px;  /* 预留广告位高度 */
  width: 100%;
}

/* 问题3: 字体加载导致布局偏移（FOUT/FOIT） */
/* ✅ 解决方案：使用 font-display: optional 或预加载字体 */
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  font-display: swap;  /* 先使用后备字体，加载完成后切换 */
}
```

### 使用 Web Vitals Library

```javascript
// 使用 web-vitals 库简化指标收集
// npm install web-vitals

import { onLCP, onFID, onCLS, onFCP, onTTFB, onINP } from 'web-vitals';

function sendToAnalytics(metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,  // 'good' | 'needs-improvement' | 'poor'
    delta: metric.delta,
    id: metric.id,          // 唯一标识，用于去重
    navigationType: metric.navigationType,
  });
  
  // 发送到分析服务
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/analytics', body);
  } else {
    fetch('/analytics', { method: 'POST', body, keepalive: true });
  }
  
  console.log(`${metric.name}: ${metric.value} (${metric.rating})`);
}

// 监听各指标
onFCP(sendToAnalytics);
onLCP(sendToAnalytics);
onFID(sendToAnalytics);
onCLS(sendToAnalytics);
onTTFB(sendToAnalytics);
onINP(sendToAnalytics); // Interaction to Next Paint (FID 的替代)
```

### INP（Interaction to Next Paint）指标

```javascript
// INP 是 FID 的升级替代，衡量页面所有交互的延迟
// FID 只衡量首次输入，INP 衡量所有输入

/*
INP 评分标准：
  良好（Good）： ≤ 200ms
  需改进： 200ms ~ 500ms  
  差（Poor）： > 500ms
*/

// 使用 web-vitals 库监听 INP
import { onINP } from 'web-vitals';

onINP((metric) => {
  console.log('INP:', metric.value, 'ms');
  console.log('评级:', metric.rating);
});

// 手动测量交互延迟
function measureInteraction(callback) {
  const start = performance.now();
  
  // 模拟交互响应
  requestAnimationFrame(() => {
    const delay = performance.now() - start;
    console.log('交互延迟:', delay, 'ms');
    
    // 在下一帧中记录
    requestAnimationFrame(() => {
      callback(delay);
    });
  });
}
```

### 性能指标导航类型

```javascript
// 不同的导航类型会影响指标解读
const navEntry = performance.getEntriesByType('navigation')[0];
const navType = navEntry?.type;  // 'navigate' | 'reload' | 'back_forward' | 'prerender'

// 区分首次访问和回访用户
switch (navType) {
  case 'navigate':
    // 用户首次访问或通过链接进入
    console.log('首次导航');
    break;
  case 'reload':
    // 用户刷新页面
    console.log('页面刷新');
    break;
  case 'back_forward':
    // 用户使用前进/后退按钮（页面可能被 BFCache 恢复）
    console.log('前后导航');
    // 注意：BFCache 恢复的页面 LCP 可能为 0
    break;
}

// 针对回访用户优化性能指标解读
if (performance.navigation.type === 2) {
  // 使用 BFCache 时，页面几乎瞬间加载
  // LCP 应该接近 0ms
}
```
