# ✅CSS3 transition和animation的区别

# 典型回答

CSS3 的 `transition` 和 `animation` 都用于实现元素状态变化的动画效果，但它们的核心区别在于控制方式和复杂度：

| 对比维度 | transition（过渡） | animation（动画） |
|---------|-------------------|------------------|
| **触发方式** | 需要状态变化触发（如 hover） | 可自动执行（无需触发） |
| **循环播放** | 不支持 | 支持（`infinite`） |
| **中间帧控制** | 只有起始和结束两帧 | 支持多关键帧（`@keyframes`） |
| **控制粒度** | 只有开始和结束状态 | 多个中间状态，精细控制 |
| **暂停/恢复** | 不支持 | 支持（`animation-play-state`） |
| **反向播放** | 不支持（回到初始状态无过渡） | 支持（`alternate`） |
| **浏览器兼容** | CSS2 开始支持，CSS3 规范 | CSS3 规范 |
| **适用场景** | 简单状态变化 | 复杂、循环、多阶段动画 |

```css
/* transition：鼠标悬停时颜色渐变（0.3秒过渡） */
.button {
  background: blue;
  transition: background 0.3s ease;
}
.button:hover {
  background: red;
}

/* animation：自动播放的脉冲动画 */
@keyframes pulse {
  0%   { transform: scale(1); opacity: 1; }
  50%  { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}
.button {
  animation: pulse 2s ease-in-out infinite;
}
```

# 扩展知识

## transition 详细用法

### 完整语法

```css
.element {
  /* 简写 */
  transition: property duration timing-function delay;

  /* 完整属性 */
  transition-property: transform, opacity;  /* 要过渡的属性 */
  transition-duration: 0.3s;                /* 过渡时长 */
  transition-timing-function: ease;         /* 缓动函数 */
  transition-delay: 0s;                     /* 延迟时间 */

  /* 多属性分别设置 */
  transition: transform 0.3s ease, opacity 0.5s ease-in 0.1s;

  /* 对所有属性生效 */
  transition: all 0.3s ease;
}
```

### 可过渡的属性

| 属性类型 | 示例 |
|---------|------|
| **变换** | `transform`、`translate`、`rotate`、`scale` |
| **颜色** | `color`、`background-color`、`border-color` |
| **尺寸** | `width`、`height`、`padding`、`margin` |
| **边框** | `border-radius`、`border-width` |
| **定位** | `top`、`left`、`right`、`bottom` |
| **透明** | `opacity` |
| **滤镜** | `filter` |
| **Flex/Grid** | `gap`、`flex-basis` |

**不可过渡的属性**：
- `display`（可用 `visibility` 替代）
- `font-family`
- `background-image`（但 `background-color` 可以）

### 缓动函数详解

```css
/* 预设值 */
transition-timing-function: ease;         /* 慢→快→慢（默认） */
transition-timing-function: linear;       /* 匀速 */
transition-timing-function: ease-in;      /* 慢→快 */
transition-timing-function: ease-out;     /* 快→慢 */
transition-timing-function: ease-in-out;  /* 慢→快→慢 */

/* 自定义三次贝塞尔曲线 */
transition-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1);

/* 阶跃函数（逐帧动画） */
transition-timing-function: steps(4, end);

/* 弹性效果 */
transition-timing-function: cubic-bezier(0.68, -0.55, 0.27, 1.55);
```

### transition 的局限性

```css
/* 问题：无法实现从 display: none 到显示的过渡 */
.modal {
  display: none;
  opacity: 0;
  transition: opacity 0.3s;
}
.modal.active {
  display: block;      /* display 不可过渡，opacity 过渡失败 */
  opacity: 1;
}

/* 解决方案：使用 visibility + opacity */
.modal {
  visibility: hidden;
  opacity: 0;
  transition: opacity 0.3s, visibility 0.3s;
}
.modal.active {
  visibility: visible;
  opacity: 1;
}
```

## animation 详细用法

### 完整语法

```css
.element {
  /* 简写 */
  animation: name duration timing-function delay iteration-count direction fill-mode play-state;

  /* 完整属性 */
  animation-name: slideIn;             /* @keyframes 名称 */
  animation-duration: 1s;              /* 动画时长 */
  animation-timing-function: ease;     /* 缓动函数 */
  animation-delay: 0.5s;              /* 延迟时间 */
  animation-iteration-count: infinite; /* 播放次数 */
  animation-direction: alternate;      /* 播放方向 */
  animation-fill-mode: both;          /* 填充模式 */
  animation-play-state: running;      /* 播放状态 */

  /* 简写 */
  animation: slideIn 1s ease 0.5s infinite alternate both;
}
```

### @keyframes 详解

```css
/* 使用百分比 */
@keyframes slideIn {
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }
  50% {
    transform: translateX(10%);
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 使用 from/to（等同于 0%/100%） */
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

### animation-direction 取值

| 值 | 说明 |
|----|------|
| `normal` | 正向播放（默认） |
| `reverse` | 反向播放 |
| `alternate` | 先正后反，交替播放 |
| `alternate-reverse` | 先反后正，交替播放 |

### animation-fill-mode 取值

| 值 | 说明 |
|----|------|
| `none` | 动画结束后回到初始状态（默认） |
| `forwards` | 动画结束后保持在最后一帧 |
| `backwards` | 动画开始前（延迟期间）应用第一帧样式 |
| `both` | 同时应用 forwards 和 backwards |

```css
/* 确保动画结束后保持最终状态 */
.element {
  animation: fadeIn 1s forwards;
}

/* 确保延迟期间已经显示初始状态 */
.element {
  animation: slideIn 1s 2s backwards;
}

/* 常见做法 */
.element {
  animation: fadeIn 1s both;
}
```

### 暂停和恢复动画

```css
.element {
  animation: pulse 2s infinite;
}

/* 悬停时暂停 */
.element:hover {
  animation-play-state: paused;
}

/* JS 控制 */
// element.style.animationPlayState = 'paused';
// element.style.animationPlayState = 'running';
```

## transition vs animation 的选择策略

### 用 transition 的场景

```css
/* 1. 鼠标交互效果 */
.button { transition: transform 0.2s; }
.button:active { transform: scale(0.95); }

/* 2. 状态切换 */
.menu { transition: max-height 0.3s ease; }
.menu.open { max-height: 500px; }

/* 3. 数值变化的平滑过渡 */
.progress-bar {
  width: 0%;
  transition: width 0.5s ease;
}
```

### 用 animation 的场景

```css
/* 1. 加载指示器 */
@keyframes spin { to { transform: rotate(360deg); } }
.loading { animation: spin 1s linear infinite; }

/* 2. 入场动画 */
.element { animation: fadeInUp 0.6s ease backwards; }

/* 3. 多阶段复杂动画 */
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  40% { transform: translateY(-30px); }
  60% { transform: translateY(-15px); }
}
.element { animation: bounce 1s ease infinite; }

/* 4. 自动播放的背景动画 */
@keyframes shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}
.skeleton { animation: shimmer 1.5s infinite; }
```

## 性能对比

| 方面 | transition | animation |
|------|-----------|-----------|
| CPU 消耗 | 较低 | 中等到高 |
| GPU 加速 | 支持（transform/opacity） | 支持 |
| 内存占用 | 较少 | 较多（多帧缓存） |
| 适用属性 | 推荐 transform/opacity | 推荐 transform/opacity |

**性能建议**：无论 transition 还是 animation，都优先使用 `transform` 和 `opacity` 属性，它们可以由 GPU 合成，避免重排（reflow）和重绘（repaint）。

## 面试常见追问

**Q: 如何让 animation 在页面加载时只播放一次？**
A: 不设置 `infinite`，默认就播放一次。需要回放时，重新设置 `animation: none` 再恢复。

**Q: transition 可以设置中间关键帧吗？**
A: 不可以。transition 只有起始和结束两帧。需要中间帧必须使用 animation + @keyframes。

**Q: 如何实现动画完成后的回调？**
A: 使用 JavaScript 监听 `transitionend` 或 `animationend` 事件：

```javascript
element.addEventListener('transitionend', () => {
  console.log('Transition 完成');
});

element.addEventListener('animationend', () => {
  console.log('Animation 完成');
});
```
