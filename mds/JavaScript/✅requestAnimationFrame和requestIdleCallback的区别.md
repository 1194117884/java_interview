# ✅requestAnimationFrame和requestIdleCallback的区别

# 典型回答

`requestAnimationFrame` 和 `requestIdleCallback` 是浏览器提供的两个用于调度回调的API，但它们的用途和执行时机完全不同：

| 特性 | requestAnimationFrame | requestIdleCallback |
|------|---------------------|-------------------|
| 执行时机 | 浏览器**每次重绘前** | 浏览器**空闲时期** |
| 执行频率 | 约60fps（与屏幕刷新率同步） | 不确定，取决于空闲时间 |
| 优先级 | **高**（渲染关键） | **低**（后台任务） |
| 回调参数 | DOMHighResTimeStamp（时间戳） | IdleDeadline（包含剩余时间和是否超时） |
| 主要用途 | 动画、DOM更新、视觉变化 | 非紧急任务、数据上报、预计算 |
| 对性能的影响 | 可能导致掉帧 | 不阻塞主线程 |
| 是否强制等待 | 是，一定会在渲染前执行 | 否，浏览器可能不调用回调 |

**核心区别：**
- `requestAnimationFrame`：**"我需要在下一次渲染前执行这个"** — 用于视觉更新
- `requestIdleCallback`：**"浏览器有空时再执行这个"** — 用于非紧急后台任务

# 扩展知识

## requestAnimationFrame 详解

```javascript
// 基本的动画循环
function animate(timestamp) {
  // timestamp: 从页面加载开始的高精度时间戳（毫秒）
  element.style.left = Math.sin(timestamp / 1000) * 100 + 'px';

  // 继续下一帧动画
  animationId = requestAnimationFrame(animate);
}

const animationId = requestAnimationFrame(animate);

// 取消动画
// cancelAnimationFrame(animationId);
```

## requestAnimationFrame 的优势

```javascript
// 1. 自动与屏幕刷新率同步（60Hz/120Hz）
// 2. 页面不可见时自动暂停（节省CPU/电池）
// 3. 动画更平滑（在渲染之前执行）

// 与setTimeout对比
let start = Date.now();

// setTimeout动画
function setTimeoutAnim() {
  const elapsed = Date.now() - start;
  element.style.left = Math.min(elapsed / 10, 200) + 'px';
  if (elapsed < 2000) setTimeout(setTimeoutAnim, 16); // 模拟60fps
}
// 问题：可能掉帧、后台继续运行

// requestAnimationFrame动画
function rAFAnim(timestamp) {
  const elapsed = timestamp - startTime;
  element.style.left = Math.min(elapsed / 10, 200) + 'px';
  if (elapsed < 2000) requestAnimationFrame(rAFAnim);
}
const startTime = performance.now();
requestAnimationFrame(rAFAnim);
// 优点：平滑、自动暂停、省电

// 实际应用：实现帧率独立的动画
function frameRateIndependent(deltaTime) {
  // deltaTime是两帧之间的时间差
  speed = 100; // 像素/秒
  position += speed * (deltaTime / 1000);
}
```

## requestIdleCallback 详解

```javascript
// 基本使用
function myIdleCallback(deadline) {
  // deadline.timeRemaining() — 剩余空闲时间（毫秒）
  // deadline.didTimeout — 是否因超时而执行

  while (deadline.timeRemaining() > 0 && tasks.length > 0) {
    const task = tasks.shift();
    process(task); // 执行一个任务
  }

  if (tasks.length > 0) {
    // 还有任务没完成，下次空闲继续
    requestIdleCallback(myIdleCallback);
  }
}

requestIdleCallback(myIdleCallback);

// 注意：浏览器可能根本不调用回调（没有空闲时间）
// 可以选择设置超时
requestIdleCallback(myIdleCallback, { timeout: 2000 });
// 如果2000ms内浏览器都没有空闲，会强制执行回调
```

## requestIdleCallback 的应用场景

```javascript
// 1. 数据上报（非关键）
function scheduleReport(data) {
  requestIdleCallback(() => {
    navigator.sendBeacon('/api/report', data);
  }, { timeout: 5000 });
}

// 2. 预计算/预渲染
function prepareForNextPage() {
  requestIdleCallback(() => {
    // 预先编译模板
    const template = compileTemplate(nextPageTemplate);
    // 预计算复杂样式
    precomputeStyles();
  });
}

// 3. 大型数据的分片处理
function processLargeArray(data) {
  let index = 0;

  function processChunk(deadline) {
    while (deadline.timeRemaining() > 5 && index < data.length) {
      // 分批处理数据
      const item = data[index++];
      const processed = heavyProcess(item);
      results.push(processed);
    }

    if (index < data.length) {
      requestIdleCallback(processChunk);
    } else {
      onComplete(results);
    }
  }

  requestIdleCallback(processChunk);
}

// 4. 惰性加载非关键资源
function lazyLoadNonCritical() {
  requestIdleCallback(() => {
    // 加载非关键图片
    const images = document.querySelectorAll('[data-lazy="true"]');
    images.forEach(img => {
      img.src = img.dataset.src;
    });
  });
}
```

## 两者的对比实验

```javascript
// 模拟一个需要大量计算的场景
function measureExecutionTime() {
  const data = Array.from({ length: 1000 }, (_, i) => i);

  // requestAnimationFrame中执行
  requestAnimationFrame(() => {
    const start = performance.now();
    data.forEach(i => heavyComputation(i));
    const elapsed = performance.now() - start;
    console.log(`rAF: 阻塞${elapsed}ms`); // 会导致掉帧
  });

  // requestIdleCallback中执行
  requestIdleCallback((deadline) => {
    const start = performance.now();
    while (deadline.timeRemaining() > 0) {
      // 分片处理
    }
    const elapsed = performance.now() - start;
    console.log(`rIC: 使用${elapsed}ms空闲时间`); // 不阻塞渲染
  });
}

function heavyComputation(n) {
  let result = 0;
  for (let i = 0; i < 10000; i++) {
    result += Math.sqrt(n * i);
  }
  return result;
}
```

## 三者对比：setTimeout vs rAF vs rIC

```javascript
// 执行时机图
// ----[宏任务]----[微任务]----[requestAnimationFrame]----[渲染]----[requestIdleCallback]----

// 测试代码
console.log('1: 同步代码');

setTimeout(() => console.log('2: setTimeout'), 0);

requestAnimationFrame(() => {
  console.log('3: requestAnimationFrame');
});

requestIdleCallback(() => {
  console.log('4: requestIdleCallback');
});

console.log('5: 同步代码结束');

// 通常输出顺序：
// 1, 5, 2 或 3, 4
// 注意：rAF可能在setTimeout之前或之后，取决于浏览器实现
// rIC通常在下一帧的空闲时间执行
```

## 浏览器兼容性与Polyfill

```javascript
// requestIdleCallback的兼容性不如requestAnimationFrame好
// Safari不支持requestIdleCallback

// 简单的polyfill（使用setTimeout模拟）
if (typeof requestIdleCallback === 'undefined') {
  window.requestIdleCallback = function(callback) {
    const start = Date.now();
    return setTimeout(function() {
      callback({
        didTimeout: false,
        timeRemaining: function() {
          return Math.max(0, 50 - (Date.now() - start));
        }
      });
    }, 1);
  };

  window.cancelIdleCallback = function(id) {
    clearTimeout(id);
  };
}
```

## 实际应用选择指南

| 场景 | 推荐API | 原因 |
|------|--------|------|
| DOM动画/过渡 | rAF | 与渲染同步，平滑 |
| Canvas/SVG动画 | rAF | 高帧率要求 |
| 滚动监听更新 | rAF | 避免滚动卡顿 |
| 非关键数据上报 | rIC | 不阻塞交互 |
| 大数据分批处理 | rIC | 利用空闲时间 |
| 预加载/预计算 | rIC | 后台执行 |
| 需要即时执行 | setTimeout | 尽快执行但不阻塞 |
| 代码统计分析 | rIC | 非关键、可延迟 |
| 无障碍通知 | rAF | 需要及时更新 |
