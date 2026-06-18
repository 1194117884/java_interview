# ✅什么是margin collapsing？如何解决？

# 典型回答

**Margin collapsing（外边距折叠）** 是 CSS 中的一种行为：在垂直方向上，相邻的两个或多个块级元素的外边距（margin）会合并成一个，取其中的**最大值**，而不是相加。

## 三种折叠场景

### 1. 相邻兄弟元素的垂直 margin 折叠

```css
.box1 { margin-bottom: 30px; }
.box2 { margin-top: 20px; }
/* 实际间距 = max(30, 20) = 30px，而不是 50px */
```

### 2. 父元素与第一个/最后一个子元素的 margin 折叠

```css
.parent { margin-top: 0; }
.child { margin-top: 20px; }
/* 父元素的 margin-top 会变成 20px，与子元素的 margin-top 折叠 */
/* 父元素没有 border/padding/inline-content 分隔时发生 */
```

### 3. 空元素的上下 margin 折叠

```css
.empty {
  margin-top: 20px;
  margin-bottom: 30px;
  /* 没有内容、border、padding，上下 margin 会折叠 */
  /* 最终高度仅由折叠后的 margin 决定 */
}
```

## 解决/阻止 margin 折叠的方法

1. **触发 BFC**：给父元素设置 `overflow: hidden` 或 `display: flow-root`
2. **添加分隔**：在父元素和子元素之间添加 `border` 或 `padding`
3. **使用 Flexbox/Grid**：Flexbox 和 Grid 容器内部的 margin 不会折叠
4. **使用 `display: inline-block`**：行内块元素不参与折叠
5. **使用浮动或绝对定位**：脱离文档流的元素不参与折叠

```css
/* 解法一：触发 BFC */
.parent {
  overflow: hidden;
  /* 或 display: flow-root; */
}

/* 解法二：添加 padding */
.parent {
  padding-top: 1px;  /* 阻止父子和自身 margin 折叠 */
}

/* 解法三：用 flex 替代 */
.parent {
  display: flex;
  flex-direction: column;
}
```

# 扩展知识

## 折叠的详细计算规则

### 同号 margin

```css
.box1 { margin-bottom: 30px; }
.box2 { margin-top: 20px; }
/* 结果：max(30, 20) = 30px */
```

### 异号 margin

```css
.box1 { margin-bottom: 30px; }   /* 正 */
.box2 { margin-top: -20px; }     /* 负 */
/* 结果：30 + (-20) = 10px */
```

### 多值混合

```css
.box1 { margin-bottom: 20px; }
.box2 { margin-top: -30px; }
/* 结果：20 + (-30) = -10px（取和，负值，元素重叠） */
```

当正负数都存在时：取**最大正数 + 最小负数（即绝对值最大的负数）**

```css
.box1 { margin-bottom: 10px; }
.box2 { margin-top: 20px; }
.box3 { margin-top: -40px; }
/* 折叠结果 = max(10, 20, -40) = 20  ... 不对 */
/* 实际: max(10, 20) + (-40) = 20 - 40 = -20px */
```

**规则总结**：
- 正正折叠：取最大值
- 正负折叠：取正数 + 负数（即代数和）
- 负负折叠：取最小值（绝对值最大的负数）

## 折叠的触发条件

margin 折叠必须同时满足以下条件：

1. 元素是**块级元素**（`display: block`）
2. margin 是**垂直方向**的（`margin-top` / `margin-bottom`）
3. 元素之间没有 border、padding、inline 内容、BFC 等**分隔**
4. 元素不在 Flexbox 或 Grid 容器中
5. 元素没有浮动或绝对定位

## 不会发生 margin 折叠的情况

| 场景 | 原因 |
|------|------|
| Flexbox 子元素之间 | Flex 容器内部的 margin 不折叠 |
| Grid 子元素之间 | Grid 容器内部的 margin 不折叠 |
| 浮动元素之间 | 浮动元素脱离文档流 |
| 绝对定位元素 | 脱离文档流 |
| `inline-block` 元素 | 行内块级元素有自己的 BFC |
| BFC 内部与外部 | BFC 隔离了 margin |
| 水平方向 margin | 左右 margin 不会折叠（水平书写模式下） |
| 有 border 或 padding 隔开的父子元素 | 有分隔物阻止折叠 |

## 实战中的坑

### 坑 1：子元素的 margin-top 穿透

```html
<div class="card">
  <h2 class="title">Title</h2>
</div>
```

```css
.card { background: #f5f5f5; }
.title { margin-top: 30px; }
/* 期望：标题距离卡片顶部 30px */
/* 实际：卡片整体下移 30px，标题紧贴卡片顶部 */
```

**解决方案**：

```css
/* 方案 A：给父元素加 padding */
.card { padding-top: 1px; }

/* 方案 B：触发 BFC */
.card { overflow: hidden; }
/* 或 */ .card { display: flow-root; }

/* 方案 C：使用 flex */
.card { display: flex; flex-direction: column; }

/* 方案 D：用 padding 代替子元素的 margin */
.card { padding-top: 30px; }
.title { margin-top: 0; }
```

### 坑 2：连续折叠（三层以上）

```html
<div class="outer">
  <div class="middle">
    <div class="inner" style="margin-top: 40px;"></div>
  </div>
</div>
```

```css
.outer { margin-top: 10px; }
.middle { margin-top: 20px; }
/* 三个 margin 全部折叠为一个：max(10, 20, 40) = 40px */
```

### 坑 3：空 div 的 margin 折叠

```html
<div class="empty" style="margin-top: 20px; margin-bottom: 30px;"></div>
<div class="next" style="margin-top: 10px;"></div>
```

结果是 `empty` 的上下 margin 先自折叠（max(20,30)=30px），再与 `next` 的 margin-top（10px）折叠，最终为 `max(30, 10) = 30px`。

## 为什么要有 margin 折叠？

这是 CSS 的设计特性而非 bug，主要目的是为了**排版美观**：

1. **段落间距一致性**：多个段落之间，margin 折叠保证间距是设置的较大值，避免间距加倍
2. **嵌套元素的自然边距**：块级元素嵌套时，如果没有折叠，内层元素的 margin 会导致外层额外增加间距

```css
/* 如果没有 margin 折叠 */
p { margin: 1em 0; }
/* 段落之间间距为 2em（1em + 1em），而不是 1em */
/* 有了折叠，间距为 max(1em, 1em) = 1em，更合理 */
```

## 最佳实践建议

1. **统一使用方向**：要么全用 `margin-top`，要么全用 `margin-bottom`，避免两者混用导致折叠混淆
2. **组件化思维**：在组件容器上使用 `padding` 而非在组件内部使用 `margin-top`
3. **优先使用 `gap`**：在 Flexbox 和 Grid 中优先使用 `gap` 属性创建间距
4. **利用折叠**：可以利用折叠特性保持间距一致性，比如标题和段落之间的间距
