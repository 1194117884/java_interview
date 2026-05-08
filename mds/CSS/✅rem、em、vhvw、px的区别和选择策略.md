# ✅rem、em、vh/vw、px的区别和选择策略

# 典型回答

CSS 中的长度单位分为**绝对单位**和**相对单位**两大类：

| 单位 | 类型 | 相对基准 | 特点 |
|------|------|---------|------|
| `px` | 绝对单位 | CSS 像素 | 固定大小，不随其他因素变化 |
| `em` | 相对单位 | **父元素**的 font-size | 链式继承，嵌套时累加 |
| `rem` | 相对单位 | **根元素（html）** 的 font-size | 全局统一，不受父级影响 |
| `vw` | 相对单位 | 视口宽度的 1% | `100vw` = 视口完全宽度 |
| `vh` | 相对单位 | 视口高度的 1% | `100vh` = 视口完全高度 |
| `vmin` | 相对单位 | `vw` 和 `vh` 中的较小值 | 保持比例 |
| `vmax` | 相对单位 | `vw` 和 `vh` 中的较大值 | 保持比例 |
| `%` | 相对单位 | 父元素或包含块的对应属性 | 不同属性基准不同 |

```css
/* 示例对比 */
.parent { font-size: 20px; }

.child {
  font-size: 2em;   /* = 20px × 2 = 40px（相对于父元素） */
  width: 2rem;      /* = 16px × 2 = 32px（相对于 html 根元素，默认 16px） */
  height: 50vh;     /* = 视口高度的 50% */
  padding: 50%;     /* = 父元素宽度的 50%（注意：不是高度！） */
}
```

## 选择策略总结

| 使用场景 | 推荐单位 | 原因 |
|---------|---------|------|
| **字体大小** | `rem`（全局）、`em`（局部） | 统一缩放，可访问性好 |
| **容器宽度** | `%`、`vw`、`clamp()` | 流式布局 |
| **容器高度** | `vh`、`min-height` | 全屏场景 |
| **边框、阴影** | `px` | 需要像素级精确 |
| **间距（margin/padding）** | `em`（组件内）、`rem`（全局） | 保持比例 |
| **响应式字体** | `clamp(min, preferred, max)` | 平滑缩放 |

# 扩展知识

## px 的深入理解

### CSS 像素 vs 设备像素

```css
/* CSS 像素（逻辑像素）：我们代码中写的 px */
.box { width: 100px; }

/* 设备像素（物理像素）：屏幕的实际像素点 */
/* 在 2x Retina 屏上，100px CSS 像素 = 200 个设备像素 */
/* devicePixelRatio = 设备像素 / CSS 像素 */
```

- **1px 在不同设备上的物理大小不同**：Retina 屏上 1 CSS px 占据 4 个物理像素
- **px 是相对单位还是绝对单位？** 从现实世界看是"相对"的（不同屏幕大小不同），但从 CSS 规范看是"绝对"的（1px = 1/96 英寸的参考值）

### 什么时候用 px？

```css
/* 适合用 px 的场景 */
.border { border: 1px solid #ddd; }          /* 边框需要精确 */
.shadow { box-shadow: 0 2px 4px rgba(0,0,0,.1); } /* 阴影偏移 */
.icon { width: 24px; height: 24px; }          /* 图标固定尺寸 */
.min-height { min-height: 44px; }             /* 触摸目标最小尺寸（WCAG 规范） */
```

## em 的深入理解

### em 的链式继承问题

```css
html { font-size: 16px; }

.container { font-size: 1.5em; }  /* = 16 × 1.5 = 24px */
.card     { font-size: 1.5em; }  /* = 24 × 1.5 = 36px（嵌套效应！） */
.text     { font-size: 1.5em; }  /* = 36 × 1.5 = 54px（越来越大） */
```

**嵌套陷阱**：多层嵌套时，em 值会逐层累积，导致结果难以预测。

### em 的最佳实践

```css
/* em 适合用在组件内部，保持组件内元素的比例关系 */
.button {
  font-size: 16px;
  padding: 0.5em 1em;   /* padding = 8px 16px */
  border-radius: 0.25em; /* = 4px */
}

.button--large {
  font-size: 20px;       /* 只改 font-size，所有内边距自动放大 */
  /* padding 变为 10px 20px，border-radius 变为 5px */
}
```

## rem 的深入理解

### rem 的全局统一性

```css
/* 设置根字体 */
html {
  font-size: 16px;
}

/* 全局字体遵循 rem */
body {
  font-size: 1rem;      /* = 16px */
}

h1 { font-size: 2rem; }  /* = 32px */
h2 { font-size: 1.5rem; }/* = 24px */
p  { font-size: 1rem; }  /* = 16px */
small { font-size: 0.875rem; } /* = 14px */
```

### 移动端 rem 适配

```css
/* 动态设置 html 的 font-size */
html {
  font-size: calc(100vw / 3.75);  /* 375px 设计稿下 1rem = 100px */
}

.box {
  width: 1.5rem;  /* = 150px（设计稿 150px） */
}
```

现代方案：使用 `clamp()` 限制 rem 范围

```css
html {
  font-size: clamp(12px, calc(100vw / 3.75), 24px);
}
```

## vw/vh 的深入理解

### 关键注意事项

```css
/* 问题：100vh 在 iOS Safari 上的行为 */
.full-screen {
  height: 100vh;
  /* iOS Safari 上，100vh 包括了地址栏的高度 */
  /* 实际可见区域 < 100vh，导致底部被裁剪 */
}

/* 解决方案：使用 -webkit-fill-available */
.full-screen {
  height: 100vh;
  height: -webkit-fill-available;  /* iOS Safari 兼容 */
}

/* 或使用 dynamic viewport units（现代浏览器） */
.full-screen {
  height: 100dvh;  /* dynamic viewport height */
}
```

### vw 与 % 的区别

```css
.parent { width: 500px; }

.child-percent {
  width: 50%;       /* = 250px（相对父元素） */
}

.child-vw {
  width: 50vw;      /* = 视口宽度的 50%（与父元素无关） */
  /* 如果视口宽度 1000px：= 500px */
  /* 如果视口宽度 375px：= 187.5px */
}
```

### vw 用于字体大小

```css
/* 字体随视口宽度变化 */
.title {
  font-size: 4vw;  /* 视口越宽字体越大 */
}
/* 问题：在超大屏幕下字体过大，在小屏幕下字体过小 */
```

## 现代 CSS 长度单位

### `clamp()` 函数

推荐使用 `clamp()` 实现平滑响应式：

```css
/* 字体平滑缩放，带上下限 */
.title {
  font-size: clamp(1.5rem, 4vw, 3rem);
  /* 最小 1.5rem，首选 4vw，最大 3rem */
}

/* 容器宽度 */
.container {
  width: clamp(320px, 80vw, 1200px);
}
```

### `lh` 和 `cap` 等单位

CSS Values Level 4 引入的新单位：

```css
/* 行高单位 */
.text {
  margin-bottom: 2lh;  /* 2 倍行高 */
}

/* 相对于元素自身的百分比 */
.box {
  transform: translate(50%, 50%);  /* 相对于自身宽高 */
}
```

## 各单位的适用场景速查表

| 场景 | 推荐单位 | 备选 |
|------|---------|------|
| 正文 | `rem` | `px` |
| 标题 | `rem` / `clamp()` | `vw` |
| 组件内边距 | `em` | `rem` |
| 行高 | 无单位（如 `1.5`） | `em` |
| 组件间距 | `rem` | `px` |
| 容器宽度 | `%` / `clamp()` | `vw` |
| 全屏容器 | `100vh` / `100dvh` | `100%` |
| 边框 | `px` | — |
| 圆角 | `px` / `em` | `%` |
| 阴影偏移 | `px` | — |
| 图标尺寸 | `px` / `em` | `rem` |

## 核心原则

1. **可访问性优先**：使用相对单位（`rem`、`em`），让用户可以调整浏览器默认字体
2. **一致性优先**：全局尺寸用 `rem`，组件内相对尺寸用 `em`
3. **精确优先**：需要像素级精确的地方用 `px`（边框、阴影）
4. **流动优先**：容器宽度用 `%` 或 `clamp()`，而非固定 `px`
