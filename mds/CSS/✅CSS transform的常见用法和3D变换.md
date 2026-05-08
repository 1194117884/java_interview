# ✅CSS transform的常见用法和3D变换

# 典型回答

CSS `transform` 属性允许对元素进行**旋转、缩放、倾斜、平移**等变换操作。它不会改变元素的文档流布局，只会改变元素的视觉呈现。

## 2D 变换的常见函数

| 函数 | 说明 | 示例 |
|------|------|------|
| `translate(x, y)` | 平移 | `translate(50px, 100px)` |
| `translateX(x)` | 水平平移 | `translateX(50%)` |
| `translateY(y)` | 垂直平移 | `translateY(-20px)` |
| `scale(n)` | 缩放 | `scale(1.5)`（放大 1.5 倍） |
| `scaleX(n)` | 水平缩放 | `scaleX(2)` |
| `scaleY(n)` | 垂直缩放 | `scaleY(0.5)` |
| `rotate(deg)` | 旋转 | `rotate(45deg)` |
| `skew(x, y)` | 倾斜 | `skew(10deg, 5deg)` |
| `skewX(deg)` | 水平倾斜 | `skewX(-15deg)` |
| `skewY(deg)` | 垂直倾斜 | `skewY(10deg)` |

```css
.box {
  transform: translate(50px, 100px) rotate(45deg) scale(1.2);
  /* 注意：多个变换从右到左依次执行 */
}
```

## 3D 变换的核心函数

```css
.box {
  /* 3D 平移 */
  transform: translateZ(100px);
  transform: translate3d(x, y, z);

  /* 3D 旋转 */
  transform: rotateX(45deg);
  transform: rotateY(45deg);
  transform: rotateZ(45deg);
  transform: rotate3d(x, y, z, angle);

  /* 3D 缩放 */
  transform: scaleZ(2);
  transform: scale3d(x, y, z);

  /* 透视效果 */
  perspective: 1000px;
}
```

## 3D 变换的辅助属性

```css
/* 透视（景深）：设置在父元素上 */
.scene {
  perspective: 800px;          /* 视距，值越小效果越明显 */
  perspective-origin: center;  /* 视点位置 */
}

/* 保留 3D 空间：设置在父元素上 */
.scene {
  transform-style: preserve-3d;  /* 默认 flat，不保留 3D 空间 */
}

/* 背面可见性 */
.card {
  backface-visibility: hidden;   /* 翻转后隐藏背面 */
}
```

# 扩展知识

## transform 的常见应用场景

### 1. 居中定位

```css
.center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  /* 相对于自身尺寸偏移，无需知道宽高 */
}
```

### 2. 悬停缩放效果

```css
.card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 8px 24px rgba(0,0,0,.15);
}
```

### 3. 3D 翻转卡片

```html
<div class="scene">
  <div class="card">
    <div class="front">正面</div>
    <div class="back">反面</div>
  </div>
</div>
```

```css
.scene {
  width: 200px;
  height: 300px;
  perspective: 1000px;
}

.card {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s;
}

.card:hover {
  transform: rotateY(180deg);
}

.front, .back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 8px;
}

.front { background: #4A90D9; }
.back {
  background: #E74C3C;
  transform: rotateY(180deg);
}
```

### 4. 加载动画

```css
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #eee;
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
```

### 5. 视差滚动效果

```css
.parallax-layer {
  transform: translateZ(-1px) scale(2);
  /* 利用 3D 变换实现视差效果 */
}
```

## 变换原点（transform-origin）

`transform-origin` 控制变换的基准点位置：

```css
.box {
  transform-origin: center;       /* 默认，中心点 */
  transform-origin: top left;     /* 左上角 */
  transform-origin: 50% 50%;     /* 等同于 center */
  transform-origin: 0 0;         /* 左上角 */
  transform-origin: 100% 100%;   /* 右下角 */
  transform-origin: 20px 30px;   /* 具体坐标 */
}

/* 应用效果对比 */
.box { transform: rotate(45deg); transform-origin: center; }     /* 绕中心旋转 */
.box { transform: rotate(45deg); transform-origin: top left; }   /* 绕左上角旋转 */
```

## 透视（perspective）的两种写法

```css
/* 方式一：设置在父元素上（推荐） */
.scene {
  perspective: 800px;
}
.child {
  transform: rotateY(45deg);
}

/* 方式二：直接写在变换中 */
.child {
  transform: perspective(800px) rotateY(45deg);
}
```

**区别**：
- 父元素方式：所有子元素共享同一个透视点
- 变换中方式：每个元素有独立的透视点

## transform 与性能

`transform` 是**高性能动画**的关键属性，因为它：

1. **不触发重排（reflow）**：不影响文档流
2. **不触发重绘（repaint）**：大部分情况只触发合成（composite）
3. **由 GPU 加速**：通过图层合成，高效渲染

```css
/* 推荐：使用 transform 实现动画 */
.better {
  transform: translateX(100px);
  /* 仅触发合成，性能好 */
}

/* 不推荐：通过位置属性实现 */
.worse {
  left: 100px;
  /* 触发重排，性能差 */
}
```

**性能层级对比**：

| 变换方式 | 触发操作 | 性能 |
|---------|---------|------|
| `transform` + `opacity` | 仅合成 | 最佳 |
| `left` / `top` | 重排 + 重绘 + 合成 | 最差 |
| `visibility` | 仅重绘 | 中等 |

## transform 与矩阵

所有 transform 变换在底层都转换为**矩阵运算**。可以使用 `matrix()` 和 `matrix3d()` 直接控制矩阵：

```css
/* 2D 矩阵：matrix(a, b, c, d, tx, ty) */
/* 等价于 translate(50px, 100px) rotate(45deg) */
.box {
  transform: matrix(0.707, 0.707, -0.707, 0.707, 50, 100);
}

/* 3D 矩阵：matrix3d(16 个值) */
.box {
  transform: matrix3d(...);
}
```

## 常见陷阱

### 1. 变换顺序的影响

```css
/* 顺序不同，结果不同 */
.box1 { transform: translate(50px, 0) rotate(45deg); }
.box2 { transform: rotate(45deg) translate(50px, 0); }
/* box1: 先平移再旋转 → 沿自身坐标轴旋转 */
/* box2: 先旋转再平移 → 沿旋转后的坐标轴平移 */
```

**规则**：变换从右到左依次执行，后写的先执行。

### 2. 变换导致 z-index 问题

```css
/* transform 会创建新的层叠上下文 */
.modal {
  transform: translateZ(0);
  /* 即使没有变换效果，translateZ(0) 也会触发 GPU 合成 */
}
```

### 3. 字体模糊

```css
/* 某些变换后文字可能变模糊 */
.box {
  transform: scale(0.5);  /* 缩放后文字可能模糊 */
  transform: rotate(45deg); /* 旋转后可能模糊 */
}
```

**解决方案**：使用 `image-rendering: crisp-edges` 或避免非整数倍缩放。

## 浏览器兼容性

| 特性 | Chrome | Firefox | Safari | IE/Edge |
|------|--------|---------|--------|---------|
| 2D transform | 全部 | 全部 | 全部 | IE9+ |
| 3D transform | 全部 | 全部 | 全部 | IE10+ |
| `perspective` | 全部 | 全部 | 全部 | IE10+ |
| `transform-style: preserve-3d` | 36+ | 16+ | 全部 | 不支持 |
| `backface-visibility` | 36+ | 16+ | 全部 | IE10+ |
