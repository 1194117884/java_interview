# ✅useRef的作用是什么？和普通变量的区别？

# 典型回答

`useRef` 是React中用于在组件的整个生命周期内**持久化保存可变值**的Hook。它返回一个包含 `current` 属性的可变对象，该对象在组件的多次渲染之间保持不变。

`useRef` 主要有两个核心用途：
1. **访问DOM元素**：通过将 `ref` 赋值给React元素的 `ref` 属性，直接获取底层的DOM节点
2. **存储可变值**：保存任何可变数据（如定时器ID、前一个值、实例变量等），这些数据的变化不会触发组件重新渲染

```jsx
// 用途1：访问DOM元素
function TextInput() {
  const inputRef = useRef(null);
  
  useEffect(() => {
    inputRef.current.focus();  // 组件挂载后自动聚焦
  }, []);
  
  return <input ref={inputRef} type="text" />;
}

// 用途2：存储可变值
function Timer() {
  const countRef = useRef(0);
  // countRef的变化不会触发重新渲染
}
```

**与普通变量的核心区别**：普通局部变量在每次渲染时都会重新创建，且修改不会持久化；而 `useRef` 返回的对象在整个组件生命周期内共享同一个引用。

# 扩展知识

### useRef与普通变量的对比

```jsx
function Counter() {
  let count = 0;                  // 普通变量
  const countRef = useRef(0);     // ref变量
  const [countState, setCountState] = useState(0);  // state变量
  
  function handleClick() {
    count++;                      // 修改后，下次渲染count又会重置为0
    countRef.current++;           // 修改后，数据持久化但不触发渲染
    setCountState(c => c + 1);    // 修改后，触发重新渲染
  }
  
  console.log('Render:', count, countRef.current, countState);
  
  return <button onClick={handleClick}>Click</button>;
}
```

| 特性 | 普通变量 | useRef | useState |
|------|---------|--------|---------|
| 跨渲染持久化 | 否 | 是 | 是 |
| 修改触发渲染 | 否 | 否 | 是 |
| 异步获取最新值 | 否 | 是 | 否（闭包问题） |
| 赋值方式 | `count = x` | `ref.current = x` | `setState(x)` |

### useRef存储可变值的典型场景

```jsx
// 场景1：保存定时器ID
function Timer() {
  const timerRef = useRef(null);
  
  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      console.log('Tick');
    }, 1000);
  }, []);
  
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);
  
  // 确保组件卸载时清理
  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);
  
  return (
    <div>
      <button onClick={startTimer}>开始</button>
      <button onClick={stopTimer}>停止</button>
    </div>
  );
}
```

```jsx
// 场景2：保存前一个值
function usePrevious(value) {
  const ref = useRef();
  
  useEffect(() => {
    ref.current = value;  // 更新时保存当前值
  }, [value]);
  
  return ref.current;  // 返回前一次渲染时的值
}

// 使用
function Counter() {
  const [count, setCount] = useState(0);
  const prevCount = usePrevious(count);
  
  return (
    <p>
      现在: {count}, 之前: {prevCount}
    </p>
  );
}
```

```jsx
// 场景3：避免effect重复执行
function useFirstMount() {
  const isFirst = useRef(true);
  
  if (isFirst.current) {
    isFirst.current = false;
    return true;
  }
  return false;
}

function EffectfulComponent({ data }) {
  const isFirstMount = useFirstMount();
  
  useEffect(() => {
    if (isFirstMount) {
      console.log('首次挂载，不依赖data');
    } else {
      console.log('data变化了:', data);
    }
  }, [data, isFirstMount]);
  // 注意：isFirstMount始终为false（除首次）
}
```

### useRef与闭包陷阱

useRef是解决React闭包陷阱的重要手段：

```jsx
function Counter() {
  const [count, setCount] = useState(0);
  
  // 问题：useEffect只执行一次，内部闭包捕获了count=0
  useEffect(() => {
    const timer = setInterval(() => {
      console.log(count);  // 始终输出0
      setCount(count + 1); // count始终是0，所以一直设置为1
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  // 方案1：使用函数式更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCount(c => c + 1);  // 不依赖闭包中的count
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  // 方案2：使用useRef读取最新值
  const countRef = useRef(count);
  countRef.current = count;  // 每次渲染时同步
  
  useEffect(() => {
    const timer = setInterval(() => {
      console.log('当前count:', countRef.current);  // 读取最新值
    }, 1000);
    return () => clearInterval(timer);
  }, []);
}
```

### ref回调（Callback Refs）

除了 `useRef` 创建的ref对象，React还支持**回调ref**，在节点挂载/卸载时获得更精确的控制：

```jsx
// 回调ref —— 在节点挂载和卸载时精确控制
function MeasureExample() {
  const [height, setHeight] = useState(0);
  
  // 回调ref会在DOM节点挂载/卸载时被调用
  const measuredRef = useCallback((node) => {
    if (node !== null) {
      setHeight(node.getBoundingClientRect().height);
    }
    // node为null时表示节点卸载
  }, []);
  
  return (
    <>
      <h1 ref={measuredRef}>Hello, React</h1>
      <p>上方标题的高度: {height}px</p>
    </>
  );
}
```

### ref转发（forwardRef）

当需要在父组件中访问子组件的DOM节点时，需要配合 `forwardRef` 使用：

```jsx
// 子组件使用 forwardRef 暴露DOM节点
const FancyInput = forwardRef((props, ref) => {
  return <input ref={ref} className="fancy-input" {...props} />;
});

// 父组件通过ref访问子组件的input
function Parent() {
  const inputRef = useRef(null);
  
  const focusInput = () => {
    inputRef.current.focus();  // 直接控制子组件中的input
  };
  
  return (
    <>
      <FancyInput ref={inputRef} placeholder="点击按钮聚焦" />
      <button onClick={focusInput}>聚焦输入框</button>
    </>
  );
}
```

### useRef的内部实现

理解useRef的内部实现有助于深入理解其行为：

```jsx
// React内部useRef的简化实现
function mountRef(initialValue) {
  const hook = mountWorkInProgressHook();
  const ref = { current: initialValue };
  hook.memoizedState = ref;
  return ref;
}

function updateRef(initialValue) {
  const hook = updateWorkInProgressHook();
  // 直接返回已存在的ref对象，不做任何比较
  return hook.memoizedState;
}
```

注意：`useRef` 没有依赖数组，也不需要依赖数组。它的 `update` 阶段只是复用已有的ref对象，不进行任何比较——这正是ref的引用始终稳定的原因。
