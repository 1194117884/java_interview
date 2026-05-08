# ✅Grid布局的核心原理和与Flexbox的对比

# 典型回答

**CSS Grid（网格布局）** 是 CSS 中第一个真正的**二维布局**系统，它可以同时处理行和列，适用于构建复杂的页面布局结构。

## Grid 的核心概念

```
  ┌──────┬──────┬──────┐
  │      │      │      │  ← 网格线（Grid Line）
  ├──────┼──────┼──────┤
  │      │      │      │  ← 网格单元格（Grid Cell）
  ├──────┼──────┼──────┤
  │      │      │      │  ← 网格轨道（Grid Track）
  └──────┴──────┴──────┘
```

| 概念 | 说明 |
|------|------|
| **网格容器（Grid Container）** | `display: grid` 的元素 |
| **网格项目（Grid Item）** | 容器的直接子元素 |
| **网格线（Grid Line）** | 划分网格的线（行线和列线） |
| **网格轨道（Grid Track）** | 两条相邻网格线之间的空间（行或列） |
| **网格单元格（Grid Cell）** | 行列交叉的最小单元 |
| **网格区域（Grid Area）** | 由多个单元格组成的矩形区域 |

## 容器的核心属性

```css
.grid-container {
  display: grid;
  /* 或 display: inline-grid; */

  /* 定义列 */
  grid-template-columns: 1fr 1fr 1fr;  /* 三列等宽 */
  /* 或 grid-template-columns: repeat(3, 1fr); */

  /* 定义行 */
  grid-template-rows: 100px auto 100px; /* 三行 */

  /* 区域模板 */
  grid-template-areas:
    "header  header  header"
    "sidebar content content"
    "footer  footer  footer";

  /* 间距 */
  gap: 20px;
  /* row-gap: 20px; column-gap: 20px; */

  /* 项目对齐 */
  justify-items: stretch;  /* 水平方向 */
  align-items: stretch;    /* 垂直方向 */

  /* 轨道对齐（容器有多余空间时） */
  justify-content: start;
  align-content: start;

  /* 自动行列 */
  grid-auto-rows: minmax(100px, auto);
}
```

## 项目的核心属性

```css
.grid-item {
  /* 使用网格线编号 */
  grid-column: 1 / 3;    /* 从列线 1 到列线 3 */
  grid-row: 1 / 2;       /* 从行线 1 到行线 2 */

  /* 或使用 span 关键字 */
  grid-column: 1 / span 2;  /* 从第 1 列跨越 2 列 */
  grid-row: span 2;         /* 跨越 2 行 */

  /* 使用命名区域 */
  grid-area: header;

  /* 单独对齐 */
  justify-self: center;   /* 水平 */
  align-self: center;     /* 垂直 */
}
```

# 扩展知识

## Grid 与 Flexbox 的对比

| 对比维度 | CSS Grid | Flexbox |
|---------|---------|---------|
| **维度** | 二维布局（同时控制行和列） | 一维布局（行或列） |
| **设计目标** | 页面整体布局 | 组件内布局或简单排列 |
| **内容驱动** | 容器驱动（先定义网格，再放内容） | 内容驱动（由内容决定布局） |
| **换行控制** | 显式定义行列结构 | flex-wrap 控制自动换行 |
| **对齐控制** | 两轴独立控制 | 主/交叉轴控制 |
| **重叠控制** | 支持（项目可占据同一网格单元格） | 不支持 |
| **浏览器支持** | 现代浏览器（IE10+ 部分支持） | 所有现代浏览器 |
| **适用场景** | 页面整体布局、复杂二维布局 | 导航栏、居中对齐、等分布置 |

### 选择原则

```css
/* 页面整体布局 → 使用 Grid */
.page {
  display: grid;
  grid-template-areas:
    "nav    main   aside"
    "footer footer footer";
}

/* 组件内部排列 → 使用 Flexbox */
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}
```

## fr 单位的深入理解

`fr`（fraction）是 Grid 专有的弹性单位，表示网格容器中**可用空间**的份额：

```css
.grid {
  display: grid;
  width: 800px;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 20px;
}
/* 计算：
   总宽度 = 800px
   gap 总占用 = 20 * 2 = 40px
   可用空间 = 760px
   每份 fr = 760 / 4 = 190px
   三列分别 = 190px, 380px, 190px
*/
```

`fr` 与百分比的区别：
- 百分比是相对于容器宽度，计算时不考虑 gap
- `fr` 会自动扣除 gap 后再分配

## `repeat()` 函数的灵活用法

```css
/* 重复固定次数 */
grid-template-columns: repeat(3, 1fr);

/* 自动填充 */
grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));

/* 自动适应 */
grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
```

**auto-fill vs auto-fit 的区别**：

```css
/* 容器宽度 600px，每列最小 200px */
grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
/* 结果：3列，各 200px，无剩余空间 */

/* 如果容器宽度 700px */
/* auto-fill: 3列，各 233px（仍有空列轨道） */
/* auto-fit: 3列，各 233px（折叠空轨道） */
```

## 命名网格线

```css
.grid {
  display: grid;
  grid-template-columns:
    [sidebar-start] 200px
    [sidebar-end main-start] 1fr
    [main-end];
}

.header {
  grid-column: sidebar-start / main-end;
}
```

## 隐式网格与显式网格

- **显式网格**：通过 `grid-template-rows/columns` 定义的网格
- **隐式网格**：内容超出显式网格时，自动创建的网格
- 隐式网格轨道的大小由 `grid-auto-rows` 和 `grid-auto-columns` 控制

```css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: minmax(100px, auto);  /* 隐式行高至少 100px */
  grid-auto-flow: dense;  /* 自动排列时尽量填充空白 */
}
```

## 实战：典型布局模式

### 1. 经典页面框架

```css
.layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  grid-template-rows: 64px 1fr 60px;
  grid-template-areas:
    "header header"
    "sidebar main"
    "sidebar footer";
  min-height: 100vh;
  gap: 0;
}
```

### 2. 响应式卡片网格

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  padding: 24px;
}
```

### 3. 不规则布局（杂志风格）

```css
.magazine {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.feature {
  grid-column: 1 / -1;  /* 占满整行 */
}

.sidebar {
  grid-column: 4 / 5;
  grid-row: 2 / 4;
}
```

### 4. 居中布局（Grid 方式）

```css
.center-grid {
  display: grid;
  place-items: center;  /* justify-items + align-items 的简写 */
  height: 400px;
}
```

## 对齐方式汇总

| 容器属性 | 作用对象 | 效果 |
|---------|---------|------|
| `justify-items` | 所有项目（水平） | 项目在单元格内的水平对齐 |
| `align-items` | 所有项目（垂直） | 项目在单元格内的垂直对齐 |
| `justify-content` | 整个网格（水平） | 网格在容器中的水平对齐（有剩余空间时） |
| `align-content` | 整个网格（垂直） | 网格在容器中的垂直对齐（有剩余空间时） |

| 项目属性 | 作用 |
|---------|------|
| `justify-self` | 覆盖 `justify-items`，设置单个项目水平对齐 |
| `align-self` | 覆盖 `align-items`，设置单个项目垂直对齐 |
| `place-self` | `align-self` 和 `justify-self` 的简写 |

## 层叠与重叠

Grid 允许多个项目占据同一个网格单元格，利用 `z-index` 控制层叠顺序：

```css
.item1 { grid-area: 1 / 1 / 3 / 3; z-index: 1; }
.item2 { grid-area: 2 / 2 / 4 / 4; z-index: 2; }
```

这在 Flexbox 中无法实现，是 Grid 的一大优势。
