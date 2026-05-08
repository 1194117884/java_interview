# ✅什么是视口？meta viewport标签的作用

# 典型回答

## 视口（Viewport）的概念

视口是浏览器中用于显示网页内容的**可视区域**。在移动端开发中，视口涉及三个不同的概念：

| 视口类型 | 说明 |
|---------|------|
| **布局视口（Layout Viewport）** | 浏览器用来渲染页面的区域，通常大于屏幕宽度（iOS 默认 980px） |
| **视觉视口（Visual Viewport）** | 用户当前在屏幕上实际看到的区域 |
| **理想视口（Ideal Viewport）** | 最适合移动设备的视口尺寸，等于设备的屏幕宽度 |

在没有 `meta viewport` 标签时，移动浏览器使用布局视口（通常 980px）来渲染页面，导致页面被整体缩小显示，用户需要缩放和拖动才能查看内容。

## meta viewport 标签的作用

`<meta name="viewport">` 标签用于**控制布局视口的大小和行为**，让移动浏览器按照理想视口来渲染页面：

```html
<!-- 标准配置（移动端适配必加） -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

**主要作用**：
1. 将布局视口宽度设置为设备宽度（`width=device-width`）
2. 设置初始缩放比例为 1:1（`initial-scale=1.0`）
3. 让页面在移动设备上以最佳尺寸显示，无需缩放

## 参数详解

```html
<meta name="viewport" content="
  width=device-width,          <!-- 布局视口宽度 = 设备宽度 -->
  initial-scale=1.0,          <!-- 初始缩放比例 -->
  minimum-scale=1.0,          <!-- 最小缩放比例 -->
  maximum-scale=1.0,          <!-- 最大缩放比例 -->
  user-scalable=no            <!-- 是否允许用户缩放 -->
">
```

| 参数 | 可选值 | 说明 |
|------|--------|------|
| `width` | `device-width` 或具体像素值 | 设置布局视口宽度 |
| `height` | `device-height` 或具体像素值 | 设置布局视口高度（较少使用） |
| `initial-scale` | `0.1` - `10` | 页面初始缩放比例 |
| `minimum-scale` | `0.1` - `10` | 最小允许缩放比例 |
| `maximum-scale` | `0.1` - `10` | 最大允许缩放比例 |
| `user-scalable` | `yes` / `no` | 是否允许用户双指缩放 |

# 扩展知识

## 无 meta viewport 时的表现

如果没有设置 meta viewport，移动浏览器默认使用**布局视口 980px** 渲染：

```html
<!-- 没有这行 -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

效果：
- 页面以 980px 宽度渲染
- 在 375px 宽的手机上，整体缩放到约 38%（375/980）
- 文字极小，用户需要双指缩放才能阅读
- 点击目标缩小，难以操作

## iOS Safari 的特殊行为

### 动态视口（Dynamic Viewport）

iOS Safari 的视口大小会随着工具栏的显示/隐藏而变化：

```css
/* 传统 100vh 在 iOS 上可能包含地址栏高度 */
.full-height {
  height: 100vh;
  /* iOS Safari 上，底部可能被工具栏遮挡 */
}

/* 解决方案 */
.full-height {
  height: 100vh;                       /* 回退 */
  height: -webkit-fill-available;      /* iOS Safari */
  height: 100dvh;                      /* 动态视口高度（现代浏览器） */
}
```

### 安全区域适配

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```

配合 CSS `env()` 处理刘海屏：

```css
.safe-area {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

## 三种视口的区别图解

```
┌─────────────────────────────────────┐
│         布局视口 (980px)             │
│  ┌─────────────────────────────┐    │
│  │     视觉视口 (375px)        │    │
│  │                             │    │
│  │   ┌───────────────────┐     │    │
│  │   │                   │     │    │
│  │   │   理想视口        │     │    │
│  │   │   = 设备宽度      │     │    │
│  │   │   375px           │     │    │
│  │   │                   │     │    │
│  │   └───────────────────┘     │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

## 常见的 viewport 配置模式

### 标准响应式站点

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### 禁止缩放的 H5 页面

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

**注意**：禁止缩放可能造成**可访问性问题**，WCAG 建议允许缩放。

### 固定宽度页面（不推荐）

```html
<meta name="viewport" content="width=375">
```

### 带安全区域适配（iOS）

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```

## JavaScript 获取视口尺寸

```javascript
// 布局视口尺寸
document.documentElement.clientWidth   // 布局视口宽度
document.documentElement.clientHeight  // 布局视口高度

// 视觉视口尺寸
window.innerWidth   // 视觉视口宽度（含滚动条）
window.innerHeight  // 视觉视口高度

// 屏幕尺寸
window.screen.width  // 屏幕宽度
window.screen.height // 屏幕高度
```

## 常见的面试问题

### Q: `width=device-width` 和 `initial-scale=1` 有什么不同？

两者都能将布局视口设置为理想视口，但机制不同：

- `width=device-width`：直接设置布局视口宽度 = 设备宽度
- `initial-scale=1`：根据屏幕宽度反推算布局视口宽度

**当只设置其中一个时**，另一个可能不生效。因此**最佳实践是两者都设置**。

### Q: 为什么 100vw 会导致水平滚动条？

```css
/* 100vw 包括滚动条的宽度 */
.full-width {
  width: 100vw;
  /* 当页面有垂直滚动条时（约 17px），实际宽度 = 视口 + 滚动条宽度 */
  /* 导致水平滚动条出现 */
}

/* 解决方案 */
.full-width {
  width: 100%;
}
```

### Q: 移动端适配时 viewport 的最佳实践？

```html
<!-- 标准做法 -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```

配合 CSS：

```css
html {
  /* 基于视口宽度设置 rem */
  font-size: calc(100vw / 3.75);
}

body {
  /* 限制最大宽度，防止在大屏上过宽 */
  max-width: 750px;
  margin: 0 auto;
}
```

## 视口相关的浏览器兼容性

| 特性 | Chrome | Firefox | Safari | IE/Edge |
|------|--------|---------|--------|---------|
| `width=device-width` | 全部 | 全部 | 全部 | IE10+ |
| `initial-scale` | 全部 | 全部 | 全部 | IE10+ |
| `user-scalable=no` | 全部 | 全部 | iOS 10+ 忽略 | IE10+ |
| `viewport-fit=cover` | 不支持 | 不支持 | iOS 11+ | 不支持 |
| CSS `env(safe-area-inset-*)` | 不支持 | 不支持 | iOS 11+ | 不支持 |
