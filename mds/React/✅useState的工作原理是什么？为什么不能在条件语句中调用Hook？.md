# ✅useState的工作原理是什么？为什么不能在条件语句中调用Hook？

# 典型回答

`useState` 是React中最基础的Hook，它让函数组件拥有管理内部状态的能力。其工作原理基于**Fiber节点上的链表结构**和**Hook调用顺序的确定性**。

当我们在函数组件中调用 `useState` 时，React会将这个Hook挂载到当前Fiber节点的 `memoizedState` 属性上，多个Hook通过 `next` 指针连成一个**单向链表**。每次组件渲染时，React会按照完全相同的顺序遍历这个链表，依次读取对应的状态值。这就是为什么Hook的调用顺序必须在每次渲染时保持一致。

**不能在条件语句中调用Hook**的核心原因是：条件语句会破坏Hook链表的确定性顺序。如果某次渲染中某个Hook因为条件不满足而没有执行，那么从下一次渲染开始，React在遍历链表时就会"错位"——把当前调用的Hook对应到了链表上错误的位置，导致状态混乱甚至导致Bug。

```jsx
// 错误示例 —— 条件中的Hook会破坏链表顺序
if (isEnabled) {
  useEffect(() => { /* ... */ });  // 第一次渲染执行了
}                                 // 第二次渲染没执行
// 后续的Hook全部错位！
```

# 扩展知识

### useState的底层数据结构

每个useState调用在Fiber内部对应一个Hook对象：

```jsx
// 简化版Hook节点结构
interface Hook {
  memoizedState: any;      // 当前状态值
  baseState: any;          // 基础状态
  baseQueue: Update<any, any> | null;  // 待处理的更新队列
  queue: UpdateQueue<any, any> | null;  // 更新队列
  next: Hook | null;       // 指向下一个Hook
}

// Fiber节点中的相关属性
interface Fiber {
  memoizedState: Hook | null;  // 指向第一个Hook
  // 类组件中指向state，函数组件中指向Hook链表头
}
```

### Hook链表的挂载过程

```jsx
function MyComponent() {
  const [count, setCount] = useState(0);       // Hook1
  const [name, setName] = useState('React');    // Hook2
  const [items, setItems] = useState([]);       // Hook3
  
  useEffect(() => {                             // Hook4
    document.title = `${count}次点击`;
  });
  
  return <div>{count}</div>;
}

// 内部链表结构（memoizedState）：
// Hook1(count) --next--> Hook2(name) --next--> Hook3(items) --next--> Hook4(effect)
//                                ^
//                                |
//                          memoizedState 指向链表头部
```

### 挂载阶段（mount） vs 更新阶段（update）

React内部区分两个阶段：

**mount阶段**：首次渲染时，按顺序创建Hook节点并链接成链表

```jsx
// mountState 简化版
function mountState(initialState) {
  const hook = mountWorkInProgressHook();  // 创建新的Hook节点并追加到链表
  
  hook.memoizedState = hook.baseState = initialState;
  
  const queue = {
    pending: null,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: initialState,
  };
  hook.queue = queue;
  
  const dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);
  queue.dispatch = dispatch;
  
  return [hook.memoizedState, dispatch];
}
```

**update阶段**：重新渲染时，按顺序从链表中取出对应的Hook节点

```jsx
// updateState 简化版
function updateState(initialState) {
  const hook = updateWorkInProgressHook();  // 从链表中取出下一个Hook
  
  const queue = hook.queue;
  // 处理更新队列中的pending更新
  // 计算新的memoizedState
  
  return [hook.memoizedState, queue.dispatch];
}
```

### 为什么顺序如此重要？

```jsx
// 场景：条件调用Hook导致的灾难
function SearchBox({ isSearchable }) {
  // Hook1 —— 每次都执行，没问题
  const [query, setQuery] = useState('');
  
  // 条件调用Hook！
  if (isSearchable) {
    useEffect(() => {
      // 搜索副作用
    });
    // 这次渲染：query的useEffect在位置2
    // 如果下次isSearchable变为false，位置2的useEffect不执行
  }
  
  // Hook3 —— 出现严重问题
  const [results, setResults] = useState([]);
  // 当isSearchable为true时：results对应链表位置3
  // 当isSearchable为false时：results对应链表位置2（错位！）
  // results读到的可能是useEffect的state，或者更糟
}
```

### Hook的调用规则 —— React的规定

React通过ESLint插件 `eslint-plugin-react-hooks` 来强制执行两条规则：

1. **只在最顶层调用Hook**：不要在循环、条件或嵌套函数中调用
2. **只在React函数组件或自定义Hook中调用Hook**：不要在普通JavaScript函数中调用

```jsx
// ESLint规则 —— hooks/rules-of-hooks
// 正确
function GoodComponent() {
  const [a, setA] = useState(0);
  useEffect(() => { /* ... */ }, []);
  return <div />;
}

// 错误 —— ESLint会报错
function BadComponent() {
  if (condition) {
    useState(0);  // Error: React Hook "useState" is called conditionally
  }
  for (let i = 0; i < count; i++) {
    useEffect(() => {});  // Error: React Hook "useEffect" may be executed more than once
  }
  function handleClick() {
    useState(0);  // Error: React Hook "useState" is called in function "handleClick"
  }
}
```

### 如果需要条件执行怎么办？

```jsx
// 正确做法：在Hook内部处理条件，而不是条件式调用Hook
function SearchBox({ isSearchable }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  
  // Hook总是无条件调用，条件逻辑放在内部
  useEffect(() => {
    if (!isSearchable) return;  // 条件逻辑在Hook内部
    fetchResults(query).then(setResults);
  }, [isSearchable, query]);
  
  return <div>{/* ... */}</div>;
}
```

### 状态更新的批处理

React 18中，所有状态更新都会自动批处理：

```jsx
function BatchingExample() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);
  
  function handleClick() {
    // React 18：这两次setState会合并到一次渲染中
    setCount(c => c + 1);
    setFlag(f => !f);
    // 只触发一次重新渲染
  }
  
  // React 18之前：在setTimeout/Promise中不会批处理
  function handleAsyncClick() {
    setTimeout(() => {
      setCount(c => c + 1);  // 两次渲染
      setFlag(f => !f);      // 两次渲染
    }, 100);
  }
  // React 18中，所有场景都会自动批处理
}
```
