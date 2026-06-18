# ✅什么是Fiber架构？React为什么要引入Fiber？

# 典型回答

Fiber是React 16引入的新协调引擎（Reconciler）的核心数据结构，是对React核心算法的彻底重构。每一个Fiber节点对应一个虚拟DOM节点，但Fiber额外包含了**工作单元**的概念——每个Fiber节点代表一个需要完成的工作单元。

React引入Fiber的核心原因是为了解决**大组件树下的掉帧问题**。在旧的Stack Reconciler中，协调过程是递归的、不可中断的。一旦开始更新，就必须遍历完整棵组件树才能让出主线程。当组件树规模较大时，单次更新可能持续超过16.6ms（60fps的一帧），导致页面卡顿。Fiber通过**可中断的异步渲染**解决了这个问题——将渲染工作拆分为小的工作单元，在每帧的空闲时间执行，让浏览器能够及时处理用户输入和动画。

# 扩展知识

### Stack Reconciler 的瓶颈

旧架构使用递归遍历虚拟DOM树：

```jsx
// 伪代码 —— Stack Reconciler的工作方式
function reconcile(parentDom, oldVNode, newVNode) {
  if (oldVNode == null && newVNode == null) return;
  if (oldVNode.type !== newVNode.type) {
    replaceNode(parentDom, oldVNode, newVNode);
    return;
  }
  // 递归遍历子节点 —— 不可中断
  reconcileChildren(dom, oldVNode.children, newVNode.children);
  // 如果组件树有1000个节点，这个过程必须一次性完成
}
```

递归调用栈一旦开始就无法中断，就像`while(true)`循环一样霸占主线程。

### Fiber节点结构

每个Fiber节点是一个JavaScript对象，通过链表连接：

```jsx
// Fiber节点的核心属性（简化版）
function FiberNode(tag, pendingProps, key) {
  // 静态结构信息
  this.tag = tag;           // 组件类型：FunctionComponent、ClassComponent等
  this.type = null;         // 组件类型
  this.key = key;
  this.elementType = null;  // 与type类似，但保留了开发时的元素类型
  
  // 连接信息 —— 构成Fiber树的三条链表
  this.return = null;       // 指向父节点
  this.child = null;        // 指向第一个子节点
  this.sibling = null;      // 指向下一个兄弟节点
  
  // 工作单元信息
  this.pendingProps = pendingProps;
  this.memoizedProps = null;
  this.memoizedState = null;  // 组件的state
  this.effectTag = null;      // 标记需要执行的操作（增/删/改）
  
  // 替身 —— 双缓存技术
  this.alternate = null;    // 指向workInProgress树中对应的节点
}
```

### 双缓存机制

Fiber使用双缓存技术，维护两棵Fiber树：

- **current树**：当前屏幕上显示的UI对应的Fiber树
- **workInProgress树**：在内存中构建的新Fiber树

```jsx
// 双缓存工作流程
1. 状态更新 → 从current树的根节点克隆出workInProgress树
2. 在workInProgress树上执行协调（可中断）
3. 协调完成后，workInProgress树成为新的current树
4. 旧的current树成为下一次构建的workInProgress的基线
```

这种机制的好处是：工作过程中始终存在一棵完整的树对应UI，即使用户看到的是旧的，但界面不会断裂。

### 可中断的工作循环

Fiber将渲染分为两个阶段：

**渲染阶段（Render Phase）—— 可中断**
- 遍历Fiber树，收集副作用（Effect List）
- 可以暂停、恢复或放弃工作
- 在浏览器的帧空闲时间执行（通过 `requestIdleCallback` 或自己的调度器）

**提交阶段（Commit Phase）—— 不可中断**
- 将副作用列表一次性应用到DOM
- 同步执行，保证UI的一致性
- 触发生命周期方法（`componentDidMount`、`useEffect`等）

```jsx
// 调度逻辑伪代码
function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;  // 检查剩余时间
  }
  if (!nextUnitOfWork) {
    commitRoot();  // 所有工作完成，提交到DOM
  }
  requestIdleCallback(workLoop);  // 继续等待空闲时间
}
```

### 优先级调度

Fiber引入了优先级概念，不同类型的更新拥有不同的优先级：

| 优先级级别 | 描述 | 对应的更新类型 |
|-----------|------|--------------|
| Immediate | 最高优先级，需要同步执行 | 用户输入、键盘事件 |
| UserBlocking | 用户交互级 | 点击、悬停 |
| Normal | 普通优先级 | 网络请求引起的更新 |
| Low | 低优先级 | 数据预取 |
| Idle | 空闲优先级 | 日志上报、分析 |

### 带来的新特性

Fiber架构使得React能够实现：

1. **并发模式（Concurrent Mode）**：多个更新可以同时进行，高优先级更新打断低优先级更新
2. **Suspense**：在数据加载完成前展示fallback内容
3. **useTransition**：将某些更新标记为低优先级，避免阻塞UI
4. **自动批处理**：在异步代码中也能自动合并状态更新
