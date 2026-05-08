# ✅Web Vitals的测量方式和优化策略

# 典型回答

Web Vitals 是 Google 推出的衡量网页用户体验的质量指标集合，核心是 **Core Web Vitals**（LCP、FID/INP、CLS），辅助指标包括 FCP、TTFB 和 TBT。

**测量方式主要有三种：**

1. **实验室测量（Lab Data）**：在受控环境中使用工具模拟页面加载，如 Lighthouse、WebPageTest、Chrome DevTools。数据可重复且便于调试，但不反映真实用户体验。
2. **实地测量（Field Data）**：从真实用户浏览器收集数据，通过 **RUM（Real User Monitoring）** 技术。数据来自 Chrome 用户体验报告（CrUX）或自建的 RUM 系统。
3. **合成测量（Synthetic Monitoring）**：定期用脚本模拟用户访问，持续监控性能变化。

**优化策略总结：**
- **LCP**：优化服务器响应、预加载关键资源、压缩图片、使用 SSR
- **FID/INP**：拆分长任务、减少 JS 执行时间、使用 Web Worker、代码分割
- **CLS**：为媒体元素设置尺寸、预留动态内容空间、使用 font-display、避免在已渲染内容前插入元素

# 扩展知识

### 实验室测量工具

```javascript
// 1. Chrome DevTools Performance 面板
// 手动录制或使用 "Reload" 按钮测量加载性能

// 2. Lighthouse CLI（Node.js）
// npm install -g lighthouse
// lighthouse https://example.com --view --preset=desktop

// 3. PageSpeed Insights API
const API_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const params = new URLSearchParams({
  url: 'https://example.com',
  strategy: 'MOBILE',  // 'MOBILE' | 'DESKTOP'
  category: ['PERFORMANCE', 'ACCESSIBILITY']
});

fetch(`${API_URL}?${params}`)
  .then(res => res.json())
  .then(data => {
    const audits = data.lighthouseResult.audits;
    console.log('LCP:', audits['largest-contentful-paint'].displayValue);
    console.log('CLS:', audits['cumulative-layout-shift'].displayValue);
    console.log('TBT:', audits['total-blocking-time'].displayValue);
  });
```

### 实地测量（RUM）实现

```javascript
// 自建 RUM 系统示例

// 1. 收集性能指标
class WebVitalsCollector {
  constructor(endpoint) {
    this.endpoint = endpoint;
    this.metrics = {};
  }
  
  init() {
    // 收集关键指标
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeFCP();
    this.collectNavigationTiming();
    
    // 页面卸载前上报
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.report();
      }
    });
    
    // 使用 sendBeacon 确保卸载时数据能送达
    window.addEventListener('beforeunload', () => {
      this.report('beforeunload');
    }, { once: true });
  }
  
  observeLCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.lcp = lastEntry.startTime;
      this.metrics.lcpElement = lastEntry.element?.tagName || '';
    });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  }
  
  observeFID() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.metrics.fid = entry.processingStart - entry.startTime;
        this.metrics.fidTarget = entry.target?.tagName || '';
      }
    });
    observer.observe({ type: 'first-input', buffered: true });
  }
  
  observeCLS() {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      this.metrics.cls = clsValue;
    });
    observer.observe({ type: 'layout-shift', buffered: true });
  }
  
  observeFCP() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.fcp = entry.startTime;
        }
      }
    });
    observer.observe({ type: 'paint', buffered: true });
  }
  
  collectNavigationTiming() {
    const nav = performance.getEntriesByType('navigation')[0];
    if (nav) {
      this.metrics.ttfb = nav.responseStart - nav.requestStart;
      this.metrics.domContentLoaded = nav.domContentLoadedEventEnd;
      this.metrics.loadTime = nav.loadEventEnd;
      this.metrics.domSize = nav.domInteractive;
    }
    
    // 连接信息
    if (navigator.connection) {
      this.metrics.effectiveType = navigator.connection.effectiveType; // 4g/3g/2g
      this.metrics.rtt = navigator.connection.rtt;
      this.metrics.downlink = navigator.connection.downlink;
    }
    
    // 设备信息
    this.metrics.deviceMemory = navigator.deviceMemory || 'unknown';
    this.metrics.hardwareConcurrency = navigator.hardwareConcurrency || 'unknown';
    
    // 页面信息
    this.metrics.url = window.location.pathname;
    this.metrics.viewportWidth = window.innerWidth;
    this.metrics.viewportHeight = window.innerHeight;
  }
  
  report(reason = 'visibility') {
    if (Object.keys(this.metrics).length === 0) return;
    
    const payload = {
      ...this.metrics,
      timestamp: Date.now(),
      reason,
      userAgent: navigator.userAgent,
      // 采样控制
      sessionId: this.getSessionId(),
    };
    
    // sendBeacon 优先
    if (navigator.sendBeacon) {
      navigator.sendBeacon(this.endpoint, JSON.stringify(payload));
    } else {
      fetch(this.endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
    
    this.metrics = {};
  }
  
  getSessionId() {
    let id = sessionStorage.getItem('rum_session_id');
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem('rum_session_id', id);
    }
    return id;
  }
}

// 使用
const collector = new WebVitalsCollector('/api/rum');
collector.init();
```

### LCP 优化策略详解

```html
<!-- 1. 预加载关键资源 -->
<head>
  <!-- 预加载 LCP 图片 -->
  <link rel="preload" href="hero.webp" as="image" 
        imagesrcset="hero-400.webp 400w, hero-800.webp 800w"
        imagesizes="(max-width: 600px) 400px, 800px">
  
  <!-- 预加载关键字体 -->
  <link rel="preload" href="/fonts/heading.woff2" as="font" crossorigin>
</head>

<!-- 2. 使用现代图片格式 -->
<picture>
  <source srcset="hero.avif" type="image/avif">
  <source srcset="hero.webp" type="image/webp">
  <img src="hero.jpg" width="1200" height="600" alt="横幅" 
       loading="eager" fetchpriority="high">
</picture>

<!-- 3. 使用 CDN + 图片优化服务 -->
<!-- 例如: imgix, Cloudinary, Akamai Image Manager -->
<img src="https://cdn.example.com/hero.jpg?w=800&q=75&format=webp"
     width="800" height="450" alt="横幅">

<!-- 4. 服务端渲染（SSR）-->
<!-- SSR 可以避免客户端 JS 渲染导致的首屏延迟 -->
```

```javascript
// 5. 优化 TTFB
// 使用 CDN 缓存静态内容
// 启用 Brotli 压缩
// 数据库查询优化

// 6. 最小化关键 CSS
// 提取首屏 CSS，内联到 <head> 中
// 非关键 CSS 异步加载
```

### CLS 优化策略详解

```javascript
// 1. 为动态插入的内容预留空间
// 广告位
const adContainer = document.getElementById('ad-slot');
// 监听广告加载，设置最小高度
const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    // 记录广告的最终尺寸，确保布局稳定
  }
});
resizeObserver.observe(adContainer);

// 2. 防止已渲染内容的移动
// 使用 transform 做动画（不要修改 top/left/margin）
element.style.transform = 'translateX(100px)'; // ✅ 不触发 CLS
element.style.marginLeft = '100px';             // ❌ 触发 CLS

// 3. 避免在现有内容前插入 DOM
// ❌ 会触发 CLS
const banner = document.createElement('div');
banner.style.height = '100px';
document.body.prepend(banner); // 插入到 body 开头，导致内容下移

// ✅ 优化方案：预留在页面顶部
<body>
  <div id="banner-slot" style="min-height: 100px;"></div>
  <!-- 已有内容 -->
</body>
```

### FID/INP 优化策略

```javascript
// 1. 拆分长任务（Long Tasks）
// 一个超过 50ms 的任务会阻塞主线程

// ❌ 一个长任务阻塞主线程
function processLargeData(data) {
  // 假设这个循环执行了 200ms
  for (const item of data) {
    processItem(item); // 主线程被阻塞 200ms
  }
}

// ✅ 拆分成多个小任务（yield to main thread）
async function processLargeData(data) {
  const chunkSize = 50;
  
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    
    // 处理当前块
    chunk.forEach(item => processItem(item));
    
    // 让出主线程（使用微任务或 requestIdleCallback）
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}

// 2. 使用 Web Worker 处理计算密集型任务
const worker = new Worker('data-worker.js');

worker.postMessage(largeData);

worker.onmessage = (event) => {
  const result = event.data;
  // 更新 UI，Worker 不会阻塞主线程
};

// 3. 代码分割（Code Splitting）
// 使用动态 import 按需加载
button.addEventListener('click', async () => {
  // 仅在用户点击时加载
  const module = await import('./heavy-module.js');
  module.doSomething();
});

// 4. 预加载关键交互逻辑
// 使用 requestIdleCallback 在空闲时预加载
requestIdleCallback(() => {
  import('./likely-needed-module.js');
});

// 5. 减少不必要的 JavaScript
// - Tree Shaking 移除无用代码
// - 使用更轻量的库
// - 延迟加载 polyfill
```

### CrUX API 使用

```javascript
// Chrome UX Report (CrUX) API
// 查询某个 URL 的实地性能数据

const CRUX_API = 'https://chromeuxreport.googleapis.com/v1/records:queryRecord';
const API_KEY = 'YOUR_API_KEY';

async function getCruxData(url) {
  const response = await fetch(CRUX_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: url,
      formFactor: 'PHONE', // 'PHONE' | 'DESKTOP' | 'TABLET'
    }),
  });
  
  const data = await response.json();
  const metrics = data.record.metrics;
  
  console.log('LCP 分布:');
  console.log('  良好:', metrics.largest_contentful_paint.histogram[0].proportion * 100, '%');
  console.log('  需改进:', metrics.largest_contentful_paint.histogram[1].proportion * 100, '%');
  console.log('  差:', metrics.largest_contentful_paint.histogram[2].proportion * 100, '%');
  
  console.log('CLS 分布:');
  console.log('  良好:', metrics.cumulative_layout_shift.histogram[0].proportion * 100, '%');
  console.log('  需改进:', metrics.cumulative_layout_shift.histogram[1].proportion * 100, '%');
  console.log('  差:', metrics.cumulative_layout_shift.histogram[2].proportion * 100, '%');
  
  console.log('FID 分布:');
  console.log('  良好:', metrics.first_input_delay.histogram[0].proportion * 100, '%');
  console.log('  需改进:', metrics.first_input_delay.histogram[1].proportion * 100, '%');
  console.log('  差:', metrics.first_input_delay.histogram[2].proportion * 100, '%');
}

await getCruxData('https://example.com');
```

### 优化前后对比示例

| 指标 | 优化前 | 优化策略 | 优化后 |
|------|--------|---------|--------|
| TTFB | 1.2s | CDN + 服务器优化 | 0.3s |
| FCP | 3.5s | 内联关键CSS + 字体预加载 | 1.2s |
| LCP | 6.8s | 图片WebP + preload + CDN | 1.8s |
| CLS | 0.35 | 设置图片尺寸 + 预留广告位 | 0.05 |
| FID | 180ms | 拆分长任务 + Web Worker | 45ms |
| TBT | 650ms | 代码分割 + 延迟加载 | 150ms |
