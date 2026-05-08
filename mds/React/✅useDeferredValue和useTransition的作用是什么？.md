# ✅useDeferredValue和useTransition的作用是什么？

# 典型回答

`useDeferredValue` 和 `useTransition` 是React 18引入的两个**并发渲染（Concurrent Features）**Hook，它们的核心目的是**在不阻塞UI的情况下处理高开销更新**，从而提升页面响应性。

**`useTransition`**：将某个状态更新标记为**低优先级过渡任务**，允许UI在等待更新完成时保持交互。返回一个 `isPending` 标志和一个 `startTransition` 函数。

```jsx
function SearchPage() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  
  const handleChange = (e) => {
    // 紧急更新：立即更新输入框显示
    setQuery(e.target.value);
    
    // 过渡更新：低优先级处理搜索结果
    startTransition(() => {
      setSearchQuery(e.target.value);  // 触发展搜索
    });
  };
  
  return (
    <div>
      <input value={query} onChange={handleChange} />
      {isPending ? <Spinner /> : <SearchResults />}
    </div>
  );
}
```

**`useDeferredValue`**：允许你**延迟**某个值的更新，让UI优先响应更紧急的变化。适合在自定义Hook或不想修改状态更新方式时使用。

```jsx
function SearchPage() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);  // 延迟query的更新
  
  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <SearchResults query={deferredQuery} />
    </div>
  );
}
```

**核心区别**：`useTransition` 控制的是**状态更新**（包裹setState调用），`useDeferredValue` 控制的是**值**（生成一个延迟后的值）。`useTransition` 提供了 `isPending` 状态来展示加载指示，而 `useDeferredValue` 需要通过比较原值和延迟值来手动实现。

# 扩展知识

### 并发更新的工作方式

在React 18之前，所有更新都是**同步紧急**的——一旦触发setState，必须马上完成重新渲染。React 18引入了**可中断渲染**的概念：

```
传统渲染（React 17）:
用户输入 → 立即渲染（不可中断） → 展示结果
          ↑ 如果渲染耗时，页面卡顿

并发渲染（React 18）:
用户输入 → 开始高优更新 → 中断低优渲染 → 处理用户交互
          低优更新 → 空闲时继续渲染 → 展示结果
```

### useTransition 的详细使用

```jsx
function TabSwitcher() {
  const [tab, setTab] = useState('feed');
  const [isPending, startTransition] = useTransition();
  
  const switchTab = (newTab) => {
    // 紧急更新：立即更新UI标签高亮
    // 过渡更新：切换内容
    startTransition(() => {
      setTab(newTab);
    });
  };
  
  return (
    <div>
      <TabButton active={tab === 'feed'} onClick={() => switchTab('feed')}>
        动态流
      </TabButton>
      <TabButton active={tab === 'photos'} onClick={() => switchTab('photos')}>
        照片
      </TabButton>
      
      {/* 如果过渡中，显示旧内容 + 加载指示 */}
      {isPending && <LoadingIndicator />}
      
      {/* 过渡完成时立即切换显示 */}
      {tab === 'feed' && <FeedView />}
      {tab === 'photos' && <PhotosView />}
    </div>
  );
}
```

### useDeferredValue 的详细使用

```jsx
function CityList() {
  const [filter, setFilter] = useState('');
  const deferredFilter = useDeferredValue(filter);
  
  // 判断是否需要显示延迟指示
  const isStale = filter !== deferredFilter;
  
  // 使用useMemo缓存昂贵的过滤计算
  const filteredCities = useMemo(() => {
    return cities.filter(city => 
      city.name.toLowerCase().includes(deferredFilter.toLowerCase())
    );
  }, [deferredFilter]);
  
  return (
    <div>
      <input
        type="text"
        value={filter}
        onChange={e => setFilter(e.target.value)}
        placeholder="搜索城市..."
      />
      
      {/* 延迟提示 */}
      {isStale && <div>正在过滤...</div>}
      
      <ul style={{ opacity: isStale ? 0.8 : 1 }}>
        {filteredCities.map(city => (
          <li key={city.id}>{city.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### useTransition vs useDeferredValue 对比

| 维度 | useTransition | useDeferredValue |
|------|--------------|-----------------|
| 控制对象 | 状态更新（setState） | 值 |
| 内置isPending | 是 | 否（需手动比较） |
| 适用场景 | 你知道更新来源 | 值来自props或自定义Hook |
| 外部状态管理 | 有限制 | 更灵活 |
| 使用方式 | 包裹状态更新逻辑 | 包裹值的接收端 |

### 结合Suspense使用

`useTransition` 与 `Suspense` 配合时，可以在等待数据加载时继续展示旧界面：

```jsx
function ProfilePage() {
  const [userId, setUserId] = useState(1);
  const [isPending, startTransition] = useTransition();
  
  const handleUserChange = (id) => {
    startTransition(() => {
      setUserId(id);  // 触发Suspense数据加载
    });
  };
  
  return (
    <div>
      <UserSelector onSelect={handleUserChange} />
      
      {/* isPending为true时，保持显示旧Profile */}
      <Suspense fallback={<Spinner />}>
        <Profile userId={userId} />
      </Suspense>
    </div>
  );
}
```

### 性能优化机制

deferred value的更新机制是：**当高优先级更新完成渲染后，再处理低优先级的延迟更新**：

```jsx
// 详细的时间线
用户输入 'R' →
  1. 紧急渲染: input显示 'R'
  2. deferredQuery 还是 ''，列表用旧值渲染
  3. 用户看到输入框更新，列表不变
用户输入 'Re' →
  1. 紧急渲染: input显示 'Re'
  2. 浏览器空闲时 → deferredQuery更新为 'Re'
  3. 列表使用 'Re' 重新渲染
```

这种机制确保用户的输入始终得到即时响应，而不会被列表渲染阻塞。

### 底层原理：与Fiber优先级的关系

`useTransition` 和 `useDeferredValue` 都依赖于React 18 Fiber架构的**优先级调度系统**：

- 紧急更新 → **SyncLane**（最高优先级，立即执行）
- 过渡更新 → **TransitionLane**（低优先级，可被中断）

```jsx
// 内部优先级分配（简化）
function startTransition(callback) {
  // 保存当前优先级
  const prevTransition = ReactCurrentBatchConfig.transition;
  ReactCurrentBatchConfig.transition = 1;  // 标记为过渡更新
  
  try {
    callback();  // 内部的setState被标记为低优先级
  } finally {
    ReactCurrentBatchConfig.transition = prevTransition;
  }
}
```

### 何时不需要使用

不是所有场景都需要这两个Hook：

```jsx
// ❌ 不需要：简单的列表渲染（无需延迟）
function SimpleList({ items }) {
  return items.map(item => <Item key={item.id} {...item} />);
}

// ❌ 不需要：用户不感知的计算
function Header({ title }) {
  return <h1>{title.toUpperCase()}</h1>;
}

// ✅ 适用场景：搜索结果过滤、大型列表渲染、图表渲染、页面切换
function Dashboard() {
  const [data, setData] = useState(largeDataset);
  const deferredData = useDeferredValue(data);
  
  return <ExpensiveChart data={deferredData} />;
}
```
