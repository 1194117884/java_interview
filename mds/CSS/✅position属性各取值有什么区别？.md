# ✅position属性各取值有什么区别？

# 典型回答

CSS 的 `position` 属性决定了元素的**定位方式**，它定义了元素在文档流中的行为以及如何通过 `top`、`right`、`bottom`、`left` 进行偏移。

`position` 有 5 个主要取值：

| 取值 | 定位基准 | 是否脱离文档流 | 是否可通过 top/left 偏移 | 适用场景 |
|------|---------|--------------|------------------------|---------|
| `static` | 默认值，不定位 | 否 | 否 | 默认文档流 |
| `relative` | 元素自身原本位置 | 否（保留占位） | 是 | 微调元素位置、作为 absolute 的参考容器 |
| `absolute` | 最近的 non-static 祖先 | 是 | 是 | 精确定位于父容器内 |
| `fixed` | 视口（viewport） | 是 | 是 | 固定导航栏、返回顶部按钮 |
| `sticky` | 滚动容器 | 否（正常占位） | 是（到达阈值时） | 粘性导航、表头固定 |

```css
.static   { position: static; }     /* 默认，标准文档流 */
.relative { position: relative; top: 10px; }  /* 相对于自己偏移 */
.absolute { position: absolute; top: 0; }     /* 相对于祖先定位 */
.fixed    { position: fixed; bottom: 0; }      /* 相对于视口 */
.sticky   { position: sticky; top: 0; }         /* 粘性定位 */
```

# 扩展知识

## position: relative 细节

`relative` 保留了元素在文档流中的占位空间，但视觉上偏移：

```css
.relative-box {
  position: relative;
  top: 20px;
  left: 30px;
}
/* 元素视觉上向下 20px、向右 30px 移动 */
/* 但原始位置仍然被占据，周围元素不受影响 */
```

**注意事项**：
- 相对于元素自身的原始位置进行偏移
- 偏移量支持百分比值（相对于包含块的尺寸）
- `z-index` 可以控制层叠顺序
- 常用于作为 `absolute` 子元素的定位锚点

## position: absolute 细节

`absolute` 完全脱离文档流，其他元素会忽略它的存在：

```css
.absolute-element {
  position: absolute;
  top: 0;
  right: 0;
  width: 200px;
  height: 100px;
}
```

**定位基准的寻找规则**：
1. 查找最近的**非 static 定位**祖先元素
2. 如果不存在这样的祖先，则相对于**初始包含块**（通常是视口）定位
3. 偏移相对于该祖先元素的 **padding box**

```html
<div class="page">                 <!-- static: 不作为定位基准 -->
  <div class="container">          <!-- position: relative: 作为定位基准 -->
    <div class="child"></div>      <!-- position: absolute -->
  </div>
</div>
```

**auto 宽高行为**：
- 如果 `absolute` 元素同时设置了 `top` 和 `bottom`，其高度会被拉伸
- 如果同时设置了 `left` 和 `right`，其宽度会被拉伸
- 如果不设置宽度，默认由内容决定（shrink-to-fit）

```css
.stretch {
  position: absolute;
  top: 10px;
  bottom: 10px;
  left: 10px;
  right: 10px;
  /* 元素被拉伸到距离父容器的每边各 10px */
}
```

## position: fixed 细节

`fixed` 相对于**视口**（viewport）定位，滚动页面时位置不变：

```css
.fixed-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  z-index: 100;
}
```

**特殊情况**：当祖先元素有 `transform`、`perspective`、`filter` 属性且值不为 `none` 时，`fixed` 的包含块会变为该祖先元素，而非视口：

```css
/* 这个容器会破坏内部 fixed 元素的视口定位！ */
.container {
  transform: translateZ(0);
}
.fixed-inside {
  position: fixed;
  bottom: 0;
  /* 不再相对于视口，而是相对于 .container */
}
```

## position: sticky 细节

`sticky` 是 relative 和 fixed 的混合体，元素在滚动到阈值之前表现为 relative，到达阈值之后变为 fixed：

```css
.sticky-nav {
  position: sticky;
  top: 0;           /* 滚动到距离视口顶部 0 时粘住 */
  z-index: 10;
}
```

**生效条件**：
1. 必须指定 `top`、`right`、`bottom`、`left` 中的至少一个
2. 父元素不能是 `overflow: hidden/scroll/auto`
3. 父元素的 `height` 必须大于 `sticky` 元素的 `top` 值（有足够的滚动空间）
4. sticky 元素在父容器内生效，超出父容器自动释放

```html
<section>
  <h2 class="sticky-header">Section Title</h2>
  <!-- 滚动到该 section 时，h2 会粘在顶部 -->
  <!-- 离开 section 时，h2 会随 section 一起滚走 -->
</section>
```

## z-index 与堆叠上下文

`z-index` 仅对定位元素（非 static）生效：

```css
.box1 { position: absolute; z-index: 2; }
.box2 { position: absolute; z-index: 1; }
/* box1 在 box2 之上 */
```

**堆叠上下文（Stacking Context）** 的创建条件：
- `position` 非 `static` + `z-index` 不为 `auto`
- `opacity` 值小于 1
- `transform` 值不为 `none`
- `filter` 值不为 `none`
- `isolation: isolate`

```css
/* 每个层叠上下文内部独立堆叠 */
.parent {
  position: relative;
  z-index: 1;
}
.child {
  position: absolute;
  z-index: 999;  /* 999 只在父级上下文中生效 */
}
```

## position 对元素显示类型的影响

`position: absolute/fixed` 会改变元素的 `display` 类型：

```css
span {
  position: absolute;
  /* span 原本是 inline，定位后变成类似 block */
  /* width 和 height 现在可以设置了 */
}
```

| 原 display | absolute/fixed 后 |
|-----------|-------------------|
| `inline` | 变成块级行为（可设置宽高） |
| `inline-block` | 变成块级行为 |
| `block` | 保持块级，但宽度变为 shrink-to-fit |
| `flex` | 保持 flex |

## position 性能考量

| 定位方式 | 重排影响 | 性能 |
|---------|---------|------|
| `static/relative` | 影响周围元素 | 普通 |
| `absolute` | 不影响兄弟元素 | 较好（局部） |
| `fixed` | 不随滚动重排 | 较好（但可能影响合成） |
| `sticky` | 频繁状态切换 | 可能较差（需触发重绘） |

## 各浏览器兼容性

| 浏览器的 sticky 支持 |
|--------------------|
| Chrome 56+ |
| Firefox 32+ |
| Safari 6.1+（需 -webkit- 前缀） |
| Edge 16+ |
| IE 不支持 |
