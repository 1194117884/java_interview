# ✅CSS预处理器的核心功能有哪些？

# 典型回答

**CSS 预处理器**（如 Sass/SCSS、Less、Stylus）是对 CSS 的扩展，它们在原生 CSS 的基础上增加了**编程语言特性**，通过编译生成标准 CSS 文件。

## 核心功能

| 功能 | Sass/SCSS 示例 | Less 示例 | 说明 |
|------|---------------|-----------|------|
| **变量** | `$color: #333` | `@color: #333` | 存储可复用的值 |
| **嵌套** | `nav { ul { li {} } }` | 相同 | 反映 HTML 结构 |
| **混合（Mixin）** | `@mixin flex-center` | `.flex-center()` | 复用样式代码块 |
| **继承/扩展** | `@extend .btn` | `&:extend(.btn)` | 共享选择器样式 |
| **函数** | `darken($color, 10%)` | `darken(@color, 10%)` | 颜色计算、数值操作 |
| **运算** | `width: 100% - 200px` | 相同 | 数学运算 |
| **条件/循环** | `@if`、`@for`、`@each` | 较少支持 | 逻辑控制 |
| **模块化** | `@use`、`@import` | `@import` | 文件拆分和组织 |

## 变量

```scss
// SCSS 变量
$primary-color: #3498db;
$font-stack: 'PingFang SC', sans-serif;
$base-font-size: 16px;
$spacing-unit: 8px;

.header {
  color: $primary-color;
  font-family: $font-stack;
  font-size: $base-font-size;
  padding: $spacing-unit * 2;
}
```

## 嵌套

```scss
// SCSS 嵌套——反映 HTML 结构
nav {
  background: #333;

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  li {
    display: inline-block;
  }

  a {
    color: white;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

// 编译结果
nav { background: #333; }
nav ul { list-style: none; }
nav li { display: inline-block; }
nav a { color: white; }
nav a:hover { text-decoration: underline; }
```

# 扩展知识

## Mixin 详解

### 基本用法

```scss
// 定义 mixin
@mixin flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

@mixin box-shadow($x, $y, $blur, $color) {
  box-shadow: $x $y $blur $color;
}

// 使用 mixin
.modal-overlay {
  @include flex-center;
}

.card {
  @include box-shadow(0, 2px, 8px, rgba(0,0,0,.15));
}
```

### 带参数和默认值

```scss
@mixin button-variant($bg: blue, $color: white, $hover-darken: 10%) {
  background: $bg;
  color: $color;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;

  &:hover {
    background: darken($bg, $hover-darken);
  }

  &:active {
    background: darken($bg, $hover-darken + 5%);
  }
}

.btn-primary { @include button-variant(#3498db); }
.btn-danger  { @include button-variant(#e74c3c); }
.btn-custom  { @include button-variant(purple, gold, 15%); }
```

### Content 块传递

```scss
@mixin respond-to($breakpoint) {
  @if $breakpoint == 'mobile' {
    @media (max-width: 767px) { @content; }
  } @else if $breakpoint == 'tablet' {
    @media (min-width: 768px) and (max-width: 1023px) { @content; }
  } @else if $breakpoint == 'desktop' {
    @media (min-width: 1024px) { @content; }
  }
}

// 使用
.sidebar {
  width: 300px;

  @include respond-to('mobile') {
    width: 100%;
    display: none;
  }
}
```

## 继承（@extend）

```scss
// @extend 共享选择器，生成的 CSS 更紧凑
%btn-shared {
  display: inline-block;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary {
  @extend %btn-shared;
  background: #3498db;
  color: white;
}

.btn-danger {
  @extend %btn-shared;
  background: #e74c3c;
  color: white;
}

// 编译结果
.btn-primary, .btn-danger {
  display: inline-block;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}
.btn-primary { background: #3498db; color: white; }
.btn-danger  { background: #e74c3c; color: white; }
```

**Mixin vs Extend 的选择**：

| 对比 | Mixin | Extend |
|------|-------|--------|
| 输出方式 | 复制代码到每个选择器 | 合并选择器 |
| 传参 | 支持 | 不支持 |
| 逻辑控制 | 支持（@if @for 等） | 不支持 |
| 生成代码体积 | 较大（多次复制） | 较小（合并选择器） |
| 适用场景 | 需要传参、带逻辑 | 单纯的样式复用 |

## 颜色函数

```scss
$base-color: #3498db;

.lighter { color: lighten($base-color, 20%); }  // #8bc4ea
.darker  { color: darken($base-color, 10%); }   // #2980b9
.saturate { color: saturate($base-color, 20%); }
.desaturate { color: desaturate($base-color, 20%); }
.opacity { color: rgba($base-color, 0.5); }
.mix     { color: mix($base-color, red, 50%); }
.hue-rotate { color: adjust-hue($base-color, 180deg); }
```

## 循环与条件

```scss
// @for 循环生成栅格
@for $i from 1 through 12 {
  .col-#{$i} {
    width: percentage($i / 12);
  }
}

// @each 遍历列表
$sizes: ('sm', 576px), ('md', 768px), ('lg', 992px);

@each $name, $width in $sizes {
  @media (min-width: $width) {
    .container-#{$name} {
      max-width: $width;
    }
  }
}

// @if 条件
@mixin text-truncate($lines: 1) {
  @if $lines == 1 {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  } @else {
    display: -webkit-box;
    -webkit-line-clamp: $lines;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
```

## 模块化

```scss
// Sass 的模块系统（推荐）
// _variables.scss
$primary: #3498db;

// _mixins.scss
@use 'variables' as v;
@mixin btn { background: v.$primary; }

// main.scss
@use 'variables';
@use 'mixins';
@use 'components/button';

// 命名空间
@use 'variables' as var;  // 使用时 var.$primary
@use 'variables' as *;    // 导入到全局命名空间
```

## 预处理器对比

| 特性 | Sass/SCSS | Less | Stylus |
|------|-----------|------|--------|
| 诞生时间 | 2006 | 2009 | 2010 |
| 编译方式 | Ruby（旧）→ Dart（新） | JavaScript | JavaScript |
| 语法 | SCSS（类 CSS）/ 缩进式 | 类 CSS | 缩进式 / 类 CSS |
| 变量符号 | `$` | `@` | 无前缀 |
| 社区生态 | 最大 | 中等（Bootstrap 4） | 较小 |
| 功能丰富度 | 最丰富 | 较丰富 | 丰富 |
| 编译速度 | 中等（Dart 较快） | 快 | 快 |

## 现代趋势

### 原生 CSS 已支持的功能

CSS 自定义属性（变量）已经原生支持：

```css
:root {
  --primary-color: #3498db;
}

.button {
  background: var(--primary-color);
}
```

CSS 也开始支持嵌套（2023+）：

```css
.card {
  padding: 16px;

  & .title {
    font-size: 18px;
  }
}
```

### 预处理器仍然不可替代的原因

1. **Mixin 带逻辑**：CSS 没有 `@mixin` 和 `@if/@for` 控制流
2. **颜色函数**：CSS 没有 `darken()`、`lighten()` 等颜色工具
3. **模块化机制**：比 CSS `@import` 更高效
4. **代码复用**：`@extend` 减少重复代码
5. **构建时优化**：编译后无额外运行时开销

## 最佳实践

```scss
// 1. 变量集中管理
// _variables.scss
$font-size-base: 16px;
$spacing-unit: 8px;
$color-primary: #1890ff;

// 2. 混合只用于有逻辑的场景
@mixin responsive-font($min-size, $max-size) {
  font-size: clamp(#{$min-size}, #{$min-size} + 2vw, #{$max-size});
}

// 3. 嵌套不超过 3 层
.card {
  &__header { }
  &__body {
    &__title { }  // 不要超过 3 层
  }
}

// 4. 继承用占位符（placeholder selectors）
%clearfix {
  &::after {
    content: '';
    display: table;
    clear: both;
  }
}
```
