# ✅useEffect的依赖数组是如何比较的？

# 典型回答

`useEffect` 的依赖数组通过**Object.is**（即严格相等比较，类似于 `===`）来判断每个依赖项是否发生变化。当依赖数组中的任何一个值在上次渲染和本次渲染之间发生**引用变化**时，React就会重新执行effect回调。

```jsx
useEffect(() => {
  // 当 deps 中任一值变化时执行
}, [dep1, dep2]);

// React内部的比较逻辑（简化版）
const hasChanged = !Object.is(dep1, prevDep1) || !Object.is(dep2, prevDep2);
if (hasChanged) {
  // 执行effect
}
```

关键要点是：**依赖比较用的是引用相等，而不是深度相等**。这意味着对于引用类型（对象、数组、函数），只要引用地址没变，React就认为该依赖没有变化。这是React性能优化的核心理念——通过引用比较而非深度比较来避免昂贵的遍历操作。

# 扩展知识

### Object.is 与 === 的区别

`Object.is` 与严格相等 `===` 几乎相同，只有两个细微区别：

```jsx
// === 的行为
+0 === -0   // true
NaN === NaN // false

// Object.is 的行为
Object.is(+0, -0)  // false
Object.is(NaN, NaN) // true
```

React使用 `Object.is` 而非 `===` 主要是为了正确处理 `NaN` 的情况。

### 浅比较的限制和常见陷阱

```jsx
function UserView({ user }) {
  // 陷阱1：对象字面量每次渲染都是新引用
  useEffect(() => {
    fetchUserPosts(user.id);
  }, [user]);  
  // 正确：user是props，只要父组件不创建新对象，引用就稳定
  
  // 陷阱2：内联创建的对象会导致无限循环
  useEffect(() => {
    // do something
  }, [{ name: 'React' }]);  
  // 每次渲染都创建一个新对象，effect每次都执行 → 无限循环
  
  // 陷阱3：函数作为依赖
  useEffect(() => {
    fetchData(handler);
  }, [handler]);
  // 如果handler是内联函数或useCallback依赖变化，会频繁执行
}
```

### 依赖数组的三种形态

```jsx
// 形态1：不传依赖数组 —— 每次渲染都执行
useEffect(() => {
  // 每次组件渲染后都执行
  // 相当于 componentDidMount + componentDidUpdate
});

// 形态2：传空数组 —— 只在挂载时执行一次
useEffect(() => {
  // 仅在组件首次挂载时执行
  // 相当于 componentDidMount
}, []);

// 形态3：传依赖项 —— 依赖变化时执行
useEffect(() => {
  // 依赖变化时才执行
  // 相当于 componentDidUpdate 的特定条件版本
}, [dep1, dep2]);
```

### React18严格模式下的双重执行

在React 18的开发模式且开启 `<StrictMode>` 时，effect会在挂载时执行两次（一次setup，一次cleanup，再一次setup）：

```jsx
useEffect(() => {
  console.log('Effect setup');  // 开发模式下执行两次
  return () => {
    console.log('Effect cleanup');  // cleanup也会执行
  };
}, []);
// 输出：
// Effect setup
// Effect cleanup
// Effect setup
```

这是React故意设计的，用来帮助开发者发现effect清理函数中可能存在的遗漏。

### 依赖数组的lint规则（exhaustive-deps）

ESLint插件 `react-hooks/exhaustive-deps` 规则要求所有在effect中使用的外部值必须出现在依赖数组中：

```jsx
function Profile({ userId }) {
  const [user, setUser] = useState(null);
  
  // ESLint会警告 —— 缺少依赖
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, []);  // 警告：userId 和 setUser 应该在这里
  
  // 正确写法
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);  // setUser是稳定引用，可以不写（但建议写上）
}
```

### 处理对象依赖的正确方式

```jsx
function SearchResults({ filters }) {
  // 错误方式：直接依赖对象
  useEffect(() => {
    fetchResults(filters);
  }, [filters]); 
  // 如果filters是内联对象，每次都会执行
  
  // 方案1：依赖原始值
  useEffect(() => {
    fetchResults(filters);
  }, [filters.category, filters.keyword, filters.page]);
  // 只依赖具体的原始值
  
  // 方案2：使用JSON序列化（简单场景）
  useEffect(() => {
    fetchResults(filters);
  }, [JSON.stringify(filters)]);
  // 注意：JSON.stringify不保证属性顺序
  
  // 方案3：使用useMemo稳定引用
  const stableFilters = useMemo(() => filters, [
    filters.category, 
    filters.keyword, 
    filters.page
  ]);
  useEffect(() => {
    fetchResults(stableFilters);
  }, [stableFilters]);
}
```

### useEffect在Fiber中的实现

在React Fiber架构中，useEffect的依赖比较发生在Fiber节点的update阶段：

```jsx
// 简化版 —— React如何比较依赖
function areHookInputsEqual(nextDeps, prevDeps) {
  if (prevDeps === null) return false;  // 首次渲染，执行effect
  
  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (Object.is(nextDeps[i], prevDeps[i])) {
      continue;  // 当前依赖没变
    }
    return false;  // 某个依赖变了，需要重新执行
  }
  return true;  // 所有依赖都没变
}
```

### 省略依赖的后果

```jsx
function Clock() {
  const [time, setTime] = useState(new Date());
  
  // 错误：依赖数组为空，但使用了time
  useEffect(() => {
    const timer = setInterval(() => {
      console.log('Current time:', time);  // 永远是最初的time值
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);  // 闭包陷阱：time被锁定在初始值
  
  // 正确
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());  // 使用函数式更新，不需要依赖time
    }, 1000);
    return () => clearInterval(timer);
  }, []);
}
```
