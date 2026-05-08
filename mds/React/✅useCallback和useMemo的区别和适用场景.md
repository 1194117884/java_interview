# ✅useCallback和useMemo的区别和适用场景

# 典型回答

`useCallback` 和 `useMemo` 都是React提供的性能优化Hook，它们都通过**缓存（记忆化）**来避免不必要的计算或引用变化。两者的核心区别在于：

- **`useCallback(fn, deps)`**：返回一个**记忆化的函数**。等价于 `useMemo(() => fn, deps)`，专门用于缓存函数引用。
- **`useMemo(() => value, deps)`**：返回一个**记忆化的值**。缓存的是函数的计算结果，可以是任何JavaScript值。

```jsx
// useCallback —— 缓存函数本身
const handleClick = useCallback(() => {
  doSomething(a, b);
}, [a, b]);

// 等价写法
const handleClick = useMemo(() => () => {
  doSomething(a, b);
}, [a, b]);

// useMemo —— 缓存计算结果
const sortedList = useMemo(() => {
  return items.sort((a, b) => a.name.localeCompare(b.name));
}, [items]);
```

**使用原则**：不要过早优化。`useCallback` 和 `useMemo` 本身也有开销（内存占用和依赖比较）。仅在以下场景中使用：
1. 作为props传递给经过 `React.memo` 优化的子组件
2. 作为其他Hook的依赖项
3. 计算开销极大的纯计算场景

# 扩展知识

### 函数的引用相等性问题

在React中，函数组件每次渲染都会重新创建内部函数。这对子组件优化产生了影响：

```jsx
// 问题：每次渲染都创建新函数引用
function Parent() {
  const [count, setCount] = useState(0);
  
  // 每次Parent重新渲染，handleClick都是新函数
  const handleClick = () => {
    setCount(c => c + 1);
  };
  
  // Child组件即使用了React.memo，也无法阻止重新渲染
  // 因为handleClick的引用每次都变了
  return <Child onClick={handleClick} />;
}

const Child = React.memo(({ onClick }) => {
  console.log('Child re-rendered');
  return <button onClick={onClick}>Click</button>;
});
```

```jsx
// 修复：使用useCallback稳定函数引用
function Parent() {
  const [count, setCount] = useState(0);
  
  // handleClick的引用只在count变化时改变
  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []);  // 注意：使用函数式更新可以不依赖count
  
  return <Child onClick={handleClick} />;
}
```

### 适用场景对比

| 场景 | useCallback | useMemo |
|------|-----------|---------|
| 缓存事件处理函数 | 是 | 可用但不推荐 |
| 缓存复杂计算结果 | 不适用 | 是 |
| 避免子组件无效渲染 | 主要用于此 | 间接用于此 |
| 缓存组件 | 不适用 | 是（返回JSX） |
| 作为其他Hook的依赖 | 是 | 是 |

### useMemo的典型场景

```jsx
// 场景1：复杂计算 —— 只在items变化时重新计算
function ItemList({ items, filter }) {
  const filteredItems = useMemo(() => {
    console.log('Filtering items...');
    return items.filter(item => {
      // 模拟复杂过滤逻辑
      return item.name.includes(filter) && item.price > 0;
    }).sort((a, b) => b.price - a.price);
  }, [items, filter]);
  
  return (
    <ul>
      {filteredItems.map(item => (
        <li key={item.id}>{item.name} - ${item.price}</li>
      ))}
    </ul>
  );
}

// 场景2：缓存组件实例
function ComplexPanel({ data }) {
  const memoizedChart = useMemo(() => (
    <ExpensiveChart 
      data={data}
      width={800}
      height={600}
      options={chartOptions}
    />
  ), [data]);  // 当data不变时复用同一棵元素树
  
  return <div>{memoizedChart}</div>;
}

// 场景3：派生状态
function UserDashboard({ users, posts }) {
  const stats = useMemo(() => ({
    totalUsers: users.length,
    activeUsers: users.filter(u => u.active).length,
    totalPosts: posts.length,
    avgPostsPerUser: users.length ? (posts.length / users.length).toFixed(1) : 0,
  }), [users, posts]);
  
  return <StatsPanel stats={stats} />;
}
```

### useCallback的典型场景

```jsx
// 场景1：配合React.memo使用
function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  
  // 缓存回调，避免SearchInput不必要重新渲染
  const handleSearch = useCallback((value) => {
    setQuery(value);
  }, []);
  
  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
  }, []);
  
  return (
    <div>
      <SearchInput 
        value={query}
        onSearch={handleSearch}
        onClear={handleClear}
      />
      <SearchResults results={results} />
    </div>
  );
}

// 场景2：作为自定义Hook的返回值
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
}

// 场景3：作为effect的依赖（稳定回调引用）
function DataLoader({ url }) {
  const fetchData = useCallback(async () => {
    const response = await fetch(url);
    return response.json();
  }, [url]);
  
  useEffect(() => {
    fetchData().then(data => {
      // 处理数据
    });
  }, [fetchData]);  // fetchData引用稳定，仅在url变化时触发
}
```

### 性能开销分析

使用 `useCallback` 和 `useMemo` 并非没有成本：

```jsx
// 不必要使用useMemo —— 简单计算的开销可能低于记忆化本身
function SimpleComponent({ a, b }) {
  // 不推荐：简单的加法运算
  const sum = useMemo(() => a + b, [a, b]);
  // 直接 const sum = a + b 更好，因为：
  // 1. useMemo需要创建闭包
  // 2. useMemo需要比较依赖数组
  // 3. 加法运算本身非常廉价
  
  return <div>{sum}</div>;
}
```

`useCallback` 的性能开销分析：

```
使用useCallback:
  内存分配 → 创建闭包 → 存储依赖 → 依赖比较（每次渲染）
  → 当依赖全部不变时 → 返回缓存函数
  → 当依赖变化时 → 创建新函数

不使用useCallback:
  每次渲染创建新函数（无额外开销）
  
结论：只有当useCallback能阻止子组件的渲染开销，且该开销大于useCallback本身时，才值得使用。
```

### 配合React.memo的最佳实践

```jsx
// 完整优化的例子
const ExpensiveListItem = React.memo(({ item, onSelect }) => {
  console.log(`Rendering ${item.id}`);
  return (
    <div onClick={() => onSelect(item.id)}>
      <h3>{item.title}</h3>
      <p>{item.description}</p>
    </div>
  );
});

function ExpensiveList({ items }) {
  // 使用useCallback稳定回调，配合React.memo生效
  const handleSelect = useCallback((id) => {
    console.log('Selected:', id);
  }, []);
  
  return (
    <div>
      {items.map(item => (
        <ExpensiveListItem
          key={item.id}
          item={item}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
}
```

### 误区：useCallback防止"创建"函数

一个常见的误解是useCallback"阻止了函数的创建"。实际上，无论是否使用useCallback，函数都在每次渲染时被创建：

```jsx
// 函数仍然在每次渲染时被创建
const handleClick = useCallback(() => {
  doSomething(a, b);
}, [a, b]);

// 等价于
const handleClick = useMemo(() => {
  return () => doSomething(a, b);  // 箭头函数每次都创建
}, [a, b]);
```

`useCallback` 并非阻止函数创建，而是决定**返回缓存的旧函数还是新创建的函数**。当依赖不变时，返回上次缓存的函数引用。
