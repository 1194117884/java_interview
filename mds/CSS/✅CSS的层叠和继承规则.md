# ✅CSS的层叠和继承规则

# 典型回答

**层叠（Cascading）** 和 **继承（Inheritance）** 是 CSS 的两大核心机制，决定了当多个样式规则作用于同一元素时，最终的样式值是什么。

## 层叠规则

层叠是 CSS 解决声明冲突的算法，它按以下优先级顺序（从低到高）决定哪个声明生效：

1. **样式来源**：浏览器默认样式 < 用户样式 < 作者样式
2. **`!important`**：带 `!important` 的作者声明 > 普通声明
3. **选择器优先级**：内联样式 > ID > 类/属性/伪类 > 元素/伪元素
4. **出现顺序**：同优先级下，后定义的覆盖先定义的
5. **层叠层（`@layer`）**：未分层的样式 > 后定义的层 > 先定义的层

## 继承规则

**继承**是指某些 CSS 属性会自动从父元素传递到子元素。不是所有属性都可继承：

- **可继承属性**：主要与文本相关的属性，如 `color`、`font-family`、`font-size`、`font-weight`、`line-height`、`text-align`、`visibility` 等
- **不可继承属性**：与布局、盒模型相关的属性，如 `margin`、`padding`、`border`、`width`、`height`、`position`、`display`、`background` 等

```css
/* 父元素 */
.parent {
  color: blue;
  font-size: 16px;
  padding: 20px; /* 不会被继承 */
}

/* 子元素自动继承 color 和 font-size，但不会继承 padding */
.child {
  /* color: blue (继承父级) */
  /* font-size: 16px (继承父级) */
}
```

# 扩展知识

## 层叠算法的完整步骤

当浏览器计算元素的最终样式时，遵循以下步骤：

### Step 1：收集所有声明

从所有来源收集应用到该元素的 CSS 声明。

### Step 2：按来源和权重排序

```
1. 浏览器默认样式（最低优先级）
2. 用户普通声明
3. 作者普通声明
4. 作者 !important 声明
5. 用户 !important 声明
6. 动画声明
7. 过渡声明（最高优先级）
```

### Step 3：按层叠层排序

CSS 层叠层（`@layer`）允许开发者显式控制层的优先级：

```css
@layer reset {
  button { background: none; } /* 低优先级层 */
}

@layer components {
  button { background: blue; } /* 中优先级层 */
}

@layer utilities {
  button { background: red; } /* 高优先级层 */
}

/* 未分层的样式优先级最高 */
button { background: green; }
```

### Step 4：按选择器优先级排序

### Step 5：按出现顺序排序

```css
/* 优先级相同，后者覆盖前者 */
.title { color: red; }
.title { color: blue; } /* 最终颜色为 blue */
```

## CSS 继承的控制机制

CSS 提供了三个特殊关键字来控制继承行为：

| 关键字 | 作用 |
|--------|------|
| `inherit` | 强制子元素继承父元素的该属性值（即使该属性默认不可继承） |
| `initial` | 将属性值设置为其 CSS 规范定义的初始值 |
| `unset` | 如果属性可继承则表现如 `inherit`，否则表现如 `initial` |
| `revert` | 将属性值重置为用户代理样式表（浏览器默认样式）的值 |
| `revert-layer` | 将属性值重置为上一层叠层的值 |

```css
/* 强制继承 */
.child {
  border: inherit; /* border 默认不可继承，但使用 inherit 强制继承 */
}

/* 重置为初始值 */
.child {
  color: initial; /* color 重置为浏览器默认（通常是黑色） */
}

/* unset 表现 */
.child {
  color: unset;    /* 可继承属性 → 继承父级 */
  border: unset;   /* 不可继承属性 → 初始值 */
}
```

## 显式继承 vs 隐式继承

```css
body {
  color: #333;
  font-family: "PingFang SC", sans-serif;
}

/* 隐式继承：p 元素自动继承 body 的 color 和 font-family */
p { /* 无需声明 color 和 font-family */ }

/* 显式继承：使用 inherit 关键字强制继承 */
a {
  color: inherit; /* 链接颜色继承父级，而非使用浏览器默认蓝色 */
  text-decoration: inherit;
}
```

## all 属性

`all` 属性可以一次性重置所有属性：

```css
.reset-all {
  all: initial; /* 将所有属性重置为初始值 */
}

.reset-inherit {
  all: unset;   /* 可继承的继承，不可继承的重置 */
}

.inherit-all {
  all: inherit; /* 强制继承所有属性 */
}
```

## 层叠与继承的常见面试问题

### Q: 给 body 设置 font-size: 62.5% 是什么原理？

```css
html { font-size: 100%; }   /* 通常是 16px */
body { font-size: 62.5%; }  /* 16 * 0.625 = 10px */
```

因为 `font-size` 可继承，子元素用 rem 时，`1rem = html 的 font-size = 16px`，而 em 相对父级。设置 body 为 62.5%（即 10px）后，后续的 em 计算更直观（`1.2em = 12px`）。

### Q: 子元素如何避免继承父元素的样式？

```css
.child {
  /* 方法一：使用 initial 关键字 */
  color: initial;

  /* 方法二：显式设置具体值 */
  color: #000;

  /* 方法三：使用 unset */
  all: unset;
}
```

## 层叠上下文（Stacking Context）

层叠上下文是另一个与层叠相关的重要概念，它控制元素在 Z 轴上的排列顺序：

```css
div {
  position: relative;
  z-index: 1; /* 创建层叠上下文 */
}
```

触发条件：
- `position` 非 `static` 且 `z-index` 不为 `auto`
- `opacity` 小于 1
- `transform` 不为 `none`
- `filter` 不为 `none`
- `isolation: isolate`

## 总结对比

| 概念 | 方向 | 作用范围 | 控制方式 |
|------|------|---------|---------|
| 层叠（Cascading） | 垂直方向 | 同一元素的多重规则 | 优先级、来源、顺序 |
| 继承（Inheritance） | 水平方向 | 父子元素之间 | 属性类型、inherit/initial/unset 关键字 |
| 层叠上下文 | Z 轴方向 | 元素的堆叠顺序 | z-index、position、transform 等 |
