# ✅CSS伪类和伪元素的区别是什么？

# 典型回答

**伪类（Pseudo-classes）** 和 **伪元素（Pseudo-elements）** 是 CSS 选择器中的两种特殊类型，它们的核心区别在于：

| 特性 | 伪类 | 伪元素 |
|------|------|--------|
| **概念** | 选择元素的特定**状态** | 创建元素的特定**部分**或生成虚拟元素 |
| **选择对象** | 已存在的元素 | DOM 中不存在的虚拟元素 |
| **CSS 语法** | 单冒号 `:` | 双冒号 `::`（CSS3 规范） |
| **数量** | 一个元素可同时应用多个伪类 | 一个元素一般只能应用一个伪元素 |
| **示例** | `:hover`、`:focus`、`:nth-child()` | `::before`、`::after`、`::first-line` |

**伪类**用于选择处于特定状态的元素，比如鼠标悬停时（`:hover`）、被聚焦时（`:focus`）、或者是第 n 个子元素（`:nth-child()`）。它不产生新的内容，只是对已有元素做状态过滤。

**伪元素**用于创建不在 DOM 树中的虚拟元素，或者在已有元素的特定部分应用样式。比如用 `::before` 在元素前插入内容，或用 `::first-line` 选中段落的第一行。

```css
/* 伪类：选择鼠标悬停状态的链接 */
a:hover {
  color: red;
}

/* 伪元素：在元素前插入额外内容 */
.quote::before {
  content: "「";
  color: gray;
}
```

# 扩展知识

## 伪类的详细分类

### 状态伪类

| 伪类 | 作用 |
|------|------|
| `:link` | 未被访问的链接 |
| `:visited` | 已被访问的链接 |
| `:hover` | 鼠标悬停时 |
| `:active` | 被激活时（如点击瞬间） |
| `:focus` | 获得焦点时 |
| `:focus-within` | 元素自身或其任一后代获得焦点时 |
| `:focus-visible` | 浏览器认为焦点应可见时 |

### 结构化伪类

| 伪类 | 作用 |
|------|------|
| `:first-child` | 父元素的第一个子元素 |
| `:last-child` | 父元素的最后一个子元素 |
| `:nth-child(n)` | 父元素的第 n 个子元素 |
| `:nth-of-type(n)` | 同类型中的第 n 个元素 |
| `:only-child` | 父元素中唯一的子元素 |
| `:empty` | 没有子元素的元素 |

```css
/* 选择表格中除第一行外的所有行 */
tr:not(:first-child) {
  border-top: 1px solid #ccc;
}

/* 选择奇数行 */
tr:nth-child(odd) {
  background: #f5f5f5;
}

/* 选择前 3 个列表项 */
li:nth-child(-n+3) {
  font-weight: bold;
}
```

### 表单相关伪类

```css
input:required { border-color: red; }
input:optional { border-color: gray; }
input:disabled { opacity: 0.5; }
input:checked + label { font-weight: bold; }
input:valid { border-color: green; }
input:invalid { border-color: pink; }
```

### 函数式伪类

- **`:is()`**：将多个选择器组合成一个，取最高优先级
- **`:where()`**：类似 `:is()` 但优先级始终为 0
- **`:has()`**：父级选择器，根据后代条件选择父元素
- **`:not()`**：排除匹配的选择器

```css
/* 选择包含 <img> 的 <figure> */
figure:has(img) {
  border: 1px solid #ddd;
}

/* 选择不包含 .active 类的 li */
li:not(.active) {
  color: #666;
}
```

## 伪元素的详细分类

### 常用伪元素

| 伪元素 | 作用 | 是否支持 content |
|--------|------|-----------------|
| `::before` | 在元素内容前插入 | 是 |
| `::after` | 在元素内容后插入 | 是 |
| `::first-line` | 选中首行文本 | 否 |
| `::first-letter` | 选中首字母 | 否 |
| `::selection` | 用户选中的文本 | 否 |
| `::placeholder` | 输入框的占位文本 | 否 |
| `::marker` | 列表项的标记（如项目符号） | 否 |
| `::backdrop` | 全屏元素背后的渲染层 | 否 |

### `::before` 和 `::after` 的经典用法

```css
/* 清除浮动 */
.clearfix::after {
  content: "";
  display: table;
  clear: both;
}

/* 自定义列表符号 */
ul.custom li::before {
  content: "→";
  color: #007bff;
  margin-right: 8px;
}

/* 工具提示 */
.tooltip {
  position: relative;
}
.tooltip::after {
  content: attr(data-tip);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
  display: none;
}
.tooltip:hover::after {
  display: block;
}
```

## CSS1/2 与 CSS3 的语法差异

在 CSS1 和 CSS2 中，伪类和伪元素都使用单冒号语法。CSS3 为了区分两者，规定伪元素使用双冒号 `::`：

```css
/* CSS2 语法（仍兼容） */
div:before { content: "→"; }
div:first-line { font-weight: bold; }

/* CSS3 推荐语法 */
div::before { content: "→"; }
div::first-line { font-weight: bold; }
```

浏览器为了向后兼容，仍然支持单冒号的伪元素写法，但推荐使用双冒号以明确区分。

## 伪元素与 content 属性

`::before` 和 `::after` 必须配合 `content` 属性使用（即使 `content` 为空字符串）。没有 `content`，伪元素不会生成。

`content` 支持的值：

| 值类型 | 示例 | 说明 |
|--------|------|------|
| 字符串 | `content: "→"` | 文本内容 |
| attr() | `content: attr(href)` | 元素的 HTML 属性值 |
| url() | `content: url(icon.png)` | 图片 |
| counter() | `content: counter(section)` | CSS 计数器 |
| 空字符串 | `content: ""` | 常用于清除浮动或装饰性元素 |

```css
/* 动态显示链接地址 */
a::after {
  content: " (" attr(href) ")";
  font-size: 0.8em;
  color: #666;
}

/* CSS 计数器实现自动编号 */
ol.custom {
  counter-reset: item;
}
ol.custom li::before {
  counter-increment: item;
  content: counter(item) ".";
  font-weight: bold;
}
```

## 常见面试追问

**Q: 伪元素是否可交互？**
A: 默认不可交互，因为伪元素不在 DOM 树中，无法绑定事件。但可以通过 CSS 为伪元素添加 pointer-events 或调整层级使其"看起来"可交互。

**Q: 一个元素可以使用多个伪元素吗？**
A: 每个元素最多只能有一个 `::before` 和一个 `::after`。但可以同时使用多个其他伪元素，如 `::first-line` 和 `::selection`。
