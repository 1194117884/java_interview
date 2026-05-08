# ✅CSS容器查询的用途是什么？

# 典型回答

**CSS 容器查询（Container Queries）** 是一项现代 CSS 特性，它允许开发者根据**容器自身的大小**而非**视口**来应用样式。这是对传统媒体查询（Media Queries）的重要补充和进化。

## 核心用途

1. **组件级响应式**：同一个组件在不同尺寸的容器中自动调整样式，无需关心视口大小
2. **可复用组件**：创建真正可复用的组件，无论在页面哪个位置都能自适应
3. **解耦样式逻辑**：将样式与页面布局解耦，组件只关心自己所在的容器

```css
/* 定义容器 */
.card-container {
  container-type: inline-size;
  container-name: card;
}

/* 容器查询：根据容器宽度调整样式 */
@container card (max-width: 400px) {
  .card {
    flex-direction: column;
  }
  .card-image {
    width: 100%;
  }
  .card-title {
    font-size: 1rem;
  }
}

@container card (min-width: 401px) {
  .card {
    flex-direction: row;
  }
  .card-image {
    width: 200px;
  }
  .card-title {
    font-size: 1.25rem;
  }
}
```

**与媒体查询的关键区别**：

| 特性 | 媒体查询（@media） | 容器查询（@container） |
|------|-------------------|----------------------|
| 查询基准 | 视口（viewport） | 容器元素本身 |
| 响应对象 | 整个页面 | 单个组件 |
| 组件复用性 | 依赖于页面位置 | 与位置无关 |
| 定义方式 | 全局定义 | 需要先声明容器 |
| 适用场景 | 页面级布局 | 组件级样式 |

# 扩展知识

## 容器查询的语法

### 定义容器

```css
/* 完整写法 */
.container {
  container-type: inline-size;   /* 容器类型 */
  container-name: sidebar;       /* 容器名称 */
}

/* 简写 */
.container {
  container: sidebar / inline-size;
}
```

`container-type` 取值：

| 值 | 说明 |
|----|------|
| `inline-size` | 基于内联方向尺寸（最常用，相当于宽度） |
| `size` | 基于内联和块方向尺寸（需注意会影响布局） |
| `normal` | 不是查询容器 |

### 编写查询

```css
/* 无名称查询（匹配最近的容器） */
@container (max-width: 500px) { ... }

/* 具名查询 */
@container sidebar (max-width: 300px) {
  .widget { display: none; }
}

/* 范围语法（新语法） */
@container (300px < width < 600px) { ... }
@container (width >= 400px) { ... }
```

## 对比媒体查询的代码示例

```css
/* 传统媒体查询：组件行为依赖视口 */
.product-card { display: flex; }

@media (max-width: 600px) {
  .product-card {
    flex-direction: column;
  }
}
/* 问题：如果卡片在宽屏页面的窄侧边栏中，不会触发响应 */
```

```css
/* 容器查询：组件行为依赖容器 */
.product-grid {
  container-type: inline-size;
}

.product-card { display: flex; }

@container (max-width: 400px) {
  .product-card {
    flex-direction: column;
    font-size: 0.875rem;
  }
}
/* 优势：无论在页面哪个位置，卡片都会根据自身容器自适应 */
```

## 实际应用场景

### 1. 可复用卡片组件

```css
.card-container {
  container-type: inline-size;
}

.card {
  display: grid;
  gap: 16px;
}

@container (min-width: 500px) {
  .card {
    grid-template-columns: 200px 1fr;
  }
  .card-image {
    border-radius: 8px 0 0 8px;
  }
}

@container (max-width: 499px) {
  .card {
    grid-template-columns: 1fr;
  }
  .card-image {
    height: 200px;
  }
}
```

```html
<!-- 同一组件在不同位置自适应 -->
<div class="main-content">
  <div class="card-container">
    <div class="card"><!-- 宽屏样式 --></div>
  </div>
</div>

<aside class="sidebar">
  <div class="card-container">
    <div class="card"><!-- 窄屏样式 --></div>
  </div>
</aside>
```

### 2. Dashboard 面板

```css
.dashboard-panel {
  container: panel / inline-size;
}

@container panel (max-width: 400px) {
  .chart { display: none; }
  .data-table { font-size: 0.75rem; }
  .summary { grid-template-columns: 1fr; }
}

@container panel (min-width: 800px) {
  .summary { grid-template-columns: 1fr 1fr 1fr; }
  .chart { display: block; height: 300px; }
}
```

### 3. 表单组件自适应

```css
.form-group {
  container-type: inline-size;
}

@container (max-width: 300px) {
  .form-row {
    flex-direction: column;
  }
  .form-label {
    margin-bottom: 4px;
  }
}

@container (min-width: 301px) {
  .form-row {
    flex-direction: row;
    align-items: center;
  }
  .form-label {
    width: 120px;
    margin-bottom: 0;
  }
}
```

## 容器长度单位

容器查询还引入了专有的**容器查询单位**：

| 单位 | 说明 | 示例 |
|------|------|------|
| `cqw` | 容器宽度的 1% | `width: 50cqw` |
| `cqh` | 容器高度的 1% | `height: 30cqh` |
| `cqi` | 容器内联尺寸的 1% | `font-size: 5cqi` |
| `cqb` | 容器块尺寸的 1% | `margin: 2cqb` |
| `cqmin` | `cqi` 和 `cqb` 的较小值 | `width: 40cqmin` |
| `cqmax` | `cqi` 和 `cqb` 的较大值 | `width: 40cqmax` |

```css
.card-title {
  font-size: clamp(1rem, 5cqi, 2rem);
  /* 字体大小根据容器宽度平滑缩放，范围 1rem - 2rem */
}

.card-image {
  height: 30cqh;  /* 容器高度的 30% */
}

.card-padding {
  padding: 2cqi;  /* 容器宽度的 2% */
}
```

## 与 container-type: size 的注意事项

```css
.container {
  container-type: size;
  /* 当使用 size 时，需要明确设置高度 */
  /* 否则容器高度为 0，元素可能不显示 */
  height: 100%;
  /* 或 min-height */
}
```

**推荐**：大多数场景下使用 `container-type: inline-size` 即可，它只监听宽度变化，不影响布局。

## 浏览器兼容性

| 浏览器 | 支持版本 |
|--------|---------|
| Chrome | 105+ |
| Edge | 105+ |
| Firefox | 110+ |
| Safari | 16.0+ |
| Opera | 91+ |

目前所有主流现代浏览器均已支持容器查询。

## 容器查询 vs. 其他方案对比

| 方案 | 响应基准 | 组件复用性 | 代码复杂度 |
|------|---------|-----------|-----------|
| Media Queries | 视口 | 低 | 低 |
| Container Queries | 容器 | 高 | 中 |
| ResizeObserver（JS） | 元素 | 高 | 高 |
| iframe 自包含 | 独立窗口 | 高 | 非常高 |

## 最佳实践

1. **容器查询 + 媒体查询协同使用**：媒体查询负责页面级布局，容器查询负责组件级样式
2. **避免嵌套过深**：容器查询可以嵌套，但过多层级可能影响性能
3. **配合 clamp() 使用**：在容器查询内部使用 `clamp()` 实现平滑过渡
4. **设置合理的查询阈值**：根据设计稿的组件断点设置

```css
/* 推荐：分层使用 */
/* 1. 媒体查询控制布局 */
@media (max-width: 768px) {
  .page-grid {
    grid-template-columns: 1fr;
  }
}

/* 2. 容器查询控制组件 */
.component-container {
  container-type: inline-size;
}

@container (max-width: 350px) {
  .component { /* 紧凑模式 */ }
}
```
