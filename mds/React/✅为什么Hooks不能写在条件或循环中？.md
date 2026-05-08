# ✅为什么Hooks不能写在条件或循环中？

# 典型回答

Hooks不能写在条件或循环中的根本原因是：**React依赖Hook的调用顺序来正确地将状态和副作用关联到对应的Hook调用**。React内部使用一个单向链表来存储组件中的所有Hook，每次渲染时按相同的顺序遍历这个链表。如果Hook的调用顺序因条件或循环而改变，React就无法正确匹配Hook与对应的状态。

```jsx
// React内部结构 —— Hook链表
function MyComponent() {
  const [count, setCount] = useState(0);    // Hook 1 —— 链表位置1
  useEffect(() => { /* ... */ }, []);       // Hook 2 —— 链表位置2
  const [name, setName] = useState('');     // Hook 3 —— 链表位置3
  // ↑ 每次渲染都必须按这个顺序执行
}
```

如果允许条件调用：
```jsx
// 灾难场景
function MyComponent({ showExtra }) {
  const [count, setCount] = useState(0);  // Hook 1
  
  if (showExtra) {
    const [extra, setExtra] = useState('');  // Hook 2 —— 有时存在，有时不存在
    // 当showExtra变化时，Hook 2不存在了，后续所有Hook全部错位！
  }
  
  useEffect(() => { /* ... */ }, []);  // Hook 3 —— 在showExtra为true时是位置3
                                        // 在showExtra为false时变成了位置2！
                                        // 读取到的是extra的状态！
}
```

**换一种方式理解**：React不知道Hook的名字，它只知道"这是第几个被调用的Hook"。就像排队一样，每个人必须站固定的位置，如果某人突然消失或插队，整个队伍就乱了。

# 扩展知识

### 深入：React如何追踪Hook

React在Fiber节点中为每个函数组件维护一个 `memoizedState` 属性，指向Hook链表的头部：

```jsx
// 组件首次渲染后，memoizedState指向的链表结构
memoizedState → {
  memoizedState: 0,           // useState(0) 的当前值
  next: → {
    memoizedState: { /* effect对象 */ },  // useEffect的副作用对象
    next: → {
      memoizedState: '',       // useState('') 的当前值
      next: null               // 链表结束
    }
  }
}
```

每次更新时，React通过 `next` 指针依次访问链表节点：

```jsx
// 简化版 —— React update阶段的workInProgressHook
let currentlyRenderingFiber = null;
let workInProgressHook = null;

function updateWorkInProgressHook() {
  let hook;
  const currentHook = currentlyRenderingFiber.memoizedState;
  
  if (workInProgressHook === null) {
    // 第一个Hook
    hook = currentHook;
  } else {
    // 后续Hook，沿链表前进
    hook = workInProgressHook.next;
  }
  
  workInProgressHook = hook;
  return hook;
}
```

### 条件Hooks导致的Bug演示

```jsx
function SearchPage() {
  // 稳定的Hook
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  
  // 假设我们希望：只在第一页显示搜索提示
  const [page] = useState(1);  // Hook 3
  
  // ❌ 条件Hook —— 当isFirstPage为false时，这个Hook不会执行
  if (page === 1) {
    useEffect(() => {
      // 显示搜索提示
      showSearchTips();
      return () => hideSearchTips();
    });  // Hook 4 —— 只在page===1时存在
  }
  
  // ❌ 此时page===2时的问题：
  // Hook 1: query (正确)
  // Hook 2: results (正确)  
  // Hook 3: page (正确)
  // 期望Hook 4是useEffect，但实际不存在
  // 期望Hook 5是某个状态，但实际变成了...！
  const [sortBy, setSortBy] = useState('relevance'); // 变成了Hook 4 ???
  // 这个useState读到的可能是useEffect的memoizedState！
}
```

### Hook顺序被破坏导致的具体错误类型

| 情况 | 发生的问题 | 错误类型 |
|------|-----------|---------|
| 条件减少Hook | 后续Hook全部错位 | 状态读取错误 |
| 条件增加Hook | 链表长度不匹配 | React内部错误/Runtime Error |
| 循环中Hook | 链表长度不一致 | React抛出错误 |
| 嵌套函数中Hook | Hook不在组件渲染路径中 | React检测到并抛出错误 |

### React的错误检测机制

React在开发模式下会通过检测Hook的数量一致性来发现违规：

```jsx
// React内部的检查 —— 开发模式
function checkHookOnInvalidCall() {
  if (numberOfReRenders < 0) {
    throw new Error('Hooks can only be called inside the body of a function component.');
  }
  
  if (!currentlyRenderingFiber) {
    // 发生在条件/循环/嵌套函数中的Hook调用
    throw new Error(
      'Invalid hook call. Hooks can only be called inside of the body of a function component.'
    );
  }
}
```

### 如何在条件逻辑中使用Hooks？

```jsx
// ❌ 错误：在条件中调用Hook
if (isVisible) {
  useEffect(() => {
    trackImpression();
  }, []);
}

// ✅ 正确：在Hook内部使用条件
useEffect(() => {
  if (isVisible) {
    trackImpression();
  }
}, [isVisible]);

// ❌ 错误：在循环中调用Hook
items.forEach(item => {
  useEffect(() => {
    // ...
  }, [item.id]);
});

// ✅ 正确：使用单个Hook处理循环逻辑
useEffect(() => {
  items.forEach(item => {
    // 处理每个item
  });
}, [items]);

// ❌ 错误：提前返回导致Hook未执行
function MyComponent({ data }) {
  if (!data) return null;  // 提前返回，后面的Hook没执行
  const [state, setState] = useState(data);
  // ...
}

// ✅ 正确：在Hook调用之后再处理条件
function MyComponent({ data }) {
  const [state, setState] = useState(data);
  if (!data) return null;  // Hook已经执行，顺序不变
  // ...
}
```

### useEffect在条件中的正确方式

```jsx
function Example({ shouldSync, id }) {
  // ✅ 方式1：条件逻辑在effect内部
  useEffect(() => {
    if (!shouldSync) return;
    const unsubscribe = subscribe(id, () => { /* ... */ });
    return unsubscribe;
  }, [shouldSync, id]);
  
  // ✅ 方式2：使用逻辑与控制effect是否有效
  useEffect(() => {
    if (!shouldSync) return;
    syncData(id);
  }, [shouldSync, id]);
  
  // ❌ 方式3：条件包裹useEffect（禁止！）
  if (shouldSync) {
    useEffect(() => { /* ... */ }, [id]);  // React Hook "useEffect" is called conditionally
  }
}
```

### 自定义Hook的封装技巧

有时为了在特定条件下使用Hook，可以将条件逻辑封装到自定义Hook内部：

```jsx
// 自定义Hook —— 内部使用条件判断
function useConditionalEffect(callback, deps, shouldExecute) {
  useEffect(() => {
    if (!shouldExecute) return;
    return callback();
  }, [...deps, shouldExecute]);
}

// 使用
function Component({ isActive, itemId }) {
  const track = useCallback(() => {
    analytics.track('item_view', { itemId });
  }, [itemId]);
  
  useConditionalEffect(track, [itemId], isActive);
}
```
