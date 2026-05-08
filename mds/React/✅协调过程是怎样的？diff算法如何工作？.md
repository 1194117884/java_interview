# ✅协调过程是怎样的？diff算法如何工作？

# 典型回答

协调（Reconciliation）是React将当前UI与新的状态进行比较，计算出最小化DOM更新的过程。简单来说，协调就是**React的"差异化比较"机制**，它决定了当组件的props或state发生变化时，如何高效地更新DOM。

React的diff算法基于三个核心策略来将时间复杂度从O(n³)优化到O(n)：

1. **不同类型的元素替换策略**：如果前后两棵树的根节点类型不同，React直接销毁旧树，创建新树
2. **同层比较策略**：React只对同一层级的节点进行比较，不跨层级移动节点
3. **key属性策略**：通过key属性标识列表中的稳定元素，在列表更新时精确复用或移动节点

# 扩展知识

### 完整的协调流程

当组件的状态更新时，React会经历以下步骤：

```
state/props 更新 → 触发重新渲染 → 生成新的虚拟DOM树
  → 进入协调阶段 → Fiber节点对比 → 打上effectTag标记
  → 生成Effect List → 提交阶段 → 执行DOM操作
```

### 元素类型对比

```jsx
// 根节点类型变化 —— 整树重建
// 旧
<div>
  <Counter />
</div>

// 新 —— span没有找到div的可复用信息，整个子树销毁重建
<span>
  <Counter />  {/* Counter也被卸载重装 */}
</span>

// 根节点类型相同 —— 保留DOM节点，仅更新属性
// 旧
<div className="old" style={{ color: 'red' }} />
// 新
<div className="new" style={{ color: 'blue' }} />
// React保留DOM节点，仅更新className和style
```

### 列表对比与key的作用

列表对比是diff算法最复杂的部分。没有key时，React使用基于索引的比对：

```jsx
// 没有key的情况 —— 基于索引比对
// 旧列表
<li>Apple</li>    // index 0
<li>Banana</li>   // index 1
<li>Cherry</li>   // index 2

// 新列表（在头部插入一个元素）
<li>Apricot</li>  // index 0 —— 与Apple对比，内容不同，替换
<li>Apple</li>    // index 1 —— 与Banana对比，内容不同，替换
<li>Banana</li>   // index 2 —— 与Cherry对比，内容不同，替换
<li>Cherry</li>   // index 3 —— 新增

// 结果：4个DOM操作，效率极低
```

```jsx
// 有稳定key的情况 —— 基于key比对
// 旧列表
<li key="a">Apple</li>    // key: a
<li key="b">Banana</li>   // key: b
<li key="c">Cherry</li>   // key: c

// 新列表
<li key="d">Apricot</li>  // key: d —— 新增
<li key="a">Apple</li>    // key: a —— 复用旧节点
<li key="b">Banana</li>   // key: b —— 复用旧节点
<li key="c">Cherry</li>   // key: c —— 复用旧节点

// 结果：1次新增 + 3次移动（或order操作），效率高
```

### 协调的子阶段

在Fiber架构中，协调被分为两个主要阶段：

**Render Phase（可中断）**
- 遍历Fiber树，执行组件渲染函数
- 对比新旧Fiber节点
- 标记需要执行的DOM操作类型（Placement、Update、Deletion）

**Commit Phase（不可中断）**
- 将Effect List中的副作用提交到DOM
- 执行DOM插入、更新、删除
- 同步执行，保证UI一致性

### Diff算法的特殊情况处理

```jsx
// 组件类型相同 —— 更新实例，不卸载
// 旧
<Counter count={1} />
// 新
<Counter count={2} />
// React更新Counter实例的props，触发组件内更新

// 组件类型不同 —— 卸载旧组件，挂载新组件
// 旧
<Counter />
// 新
<Clock />
// Counter被卸载（componentWillUnmount），Clock被挂载
```

### 为什么不跨层级移动？

跨层级移动节点在React中会导致重建而非移动：

```jsx
// 旧结构
<div>
  <p>child</p>
</div>

// 新结构 —— p从div移到了section下
<section>
  <p>child</p>
</section>

// React的处理：p节点被销毁，然后在新位置重新创建
// 不会复用旧的p DOM节点
```

这是因为跨层级移动在真实场景中非常罕见，React选择牺牲这种场景来换取大部分场景的性能优化。

### 协调与渲染器

React的协调结果（Effect List）是平台无关的，具体的DOM操作由渲染器（ReactDOM、React Native）执行：

```
协调（Reconciler）→ 差异列表（平台无关）
  → ReactDOM → DOM操作
  → React Native → Native组件操作
  → 其他渲染器 → 对应平台操作
```
