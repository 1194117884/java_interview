# ✅useSyncExternalStore的用途是什么？

# 典型回答

`useSyncExternalStore` 是React 18引入的一个Hook，用于**从外部数据源（非React状态）读取和订阅数据**。它解决了React组件在读取外部存储（如Redux store、Zustand store、浏览器API、全局状态等）时遇到的**并发安全（concurrent-safe）**问题。

```jsx
const state = useSyncExternalStore(
  subscribe,  // 订阅函数，返回取消订阅函数
  getSnapshot, // 获取当前快照
  getServerSnapshot? // 服务端渲染时使用的快照（可选）
);
```

核心作用：
1. **保证并发安全**：在React并发模式下，确保组件始终读到一致的数据快照
2. **防止撕裂（Tearing）**：防止同一组件在不同Fiber中读到不同值导致的UI不一致
3. **提供标准订阅机制**：为外部存储提供统一的接入方式

```jsx
// 使用示例 —— 订阅浏览器网络状态
function useOnlineStatus() {
  const isOnline = useSyncExternalStore(
    (callback) => {
      window.addEventListener('online', callback);
      window.addEventListener('offline', callback);
      return () => {
        window.removeEventListener('online', callback);
        window.removeEventListener('offline', callback);
      };
    },
    () => navigator.onLine,  // 获取当前值
    () => true               // SSR时的初始值
  );
  
  return isOnline;
}
```

# 扩展知识

### 撕裂问题（Tearing）是什么？

撕裂是并发渲染中可能出现的一个问题。当React在并发模式下渲染组件时，同一个组件的不同Fiber节点可能读到外部存储的不同值：

```
时间线：
1. store更新: count = 0 → count = 1
2. React开始并发渲染，部分组件读到 count=0，部分读到 count=1
3. 结果：同一UI中显示不一致的数据（撕裂）
```

`useSyncExternalStore` 通过强制读取与当前渲染一致的快照来避免这个问题。

### 不使用useSyncExternalStore的问题

```jsx
// ❌ 传统方式 —— 手动订阅store（有撕裂风险）
function Counter() {
  const [count, setCount] = useState(store.getState().count);
  
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setCount(store.getState().count);
    });
    return unsubscribe;
  }, []);
  
  return <div>{count}</div>;
}
// 问题：并发模式下，useEffect的setState可能与其他更新不同步
```

```jsx
// ✅ 使用useSyncExternalStore
function Counter() {
  const count = useSyncExternalStore(
    store.subscribe,
    () => store.getState().count
  );
  
  return <div>{count}</div>;
}
// React确保在并发模式下读取一致的值
```

### useSyncExternalStore的常用场景

```jsx
// 场景1：订阅浏览器API
function useWindowSize() {
  const width = useSyncExternalStore(
    (callback) => {
      window.addEventListener('resize', callback);
      return () => window.removeEventListener('resize', callback);
    },
    () => window.innerWidth,
    () => 1024  // SSR fallback
  );
  
  const height = useSyncExternalStore(
    (callback) => {
      window.addEventListener('resize', callback);
      return () => window.removeEventListener('resize', callback);
    },
    () => window.innerHeight,
    () => 768
  );
  
  return { width, height };
}

// 使用
function ResponsiveLayout() {
  const { width } = useWindowSize();
  
  if (width < 768) return <MobileLayout />;
  if (width < 1024) return <TabletLayout />;
  return <DesktopLayout />;
}
```

```jsx
// 场景2：订阅Redux Store（手动方式，框架已封装）
function useSelector(selector) {
  const store = useStore();
  
  return useSyncExternalStore(
    store.subscribe,
    useCallback(() => selector(store.getState()), [store, selector])
  );
}

// 场景3：订阅浏览器地理位置
function useGeolocation() {
  const position = useSyncExternalStore(
    (callback) => {
      navigator.geolocation.watchPosition(callback);
      return () => {};
    },
    () => ({
      latitude: 0,
      longitude: 0,
    })
  );
  
  return position;
}
```

```jsx
// 场景4：订阅localStorage
function useLocalStorage(key) {
  const value = useSyncExternalStore(
    (callback) => {
      window.addEventListener('storage', callback);
      return () => window.removeEventListener('storage', callback);
    },
    () => {
      try {
        return JSON.parse(localStorage.getItem(key));
      } catch {
        return null;
      }
    }
  );
  
  return value;
}
```

### useSyncExternalStore vs useEffect + useState

| 维度 | useSyncExternalStore | useEffect + useState |
|------|---------------------|---------------------|
| 并发安全 | 是 | 否（有撕裂风险） |
| 订阅时机 | 同步（渲染阶段） | 异步（commit阶段） |
| 数据一致性 | 强一致性 | 可能不一致 |
| 代码复杂度 | 适中 | 简单 |
| 适用React版本 | 18+ | 17及以下 |
| SSR支持 | 内置（第三个参数） | 需额外处理 |

### 内部实现原理

`useSyncExternalStore` 在React内部通过**强制同步读取**来保证数据一致性：

```jsx
// React内部机制（简化）
function useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
  const store = {
    getSnapshot,
    subscribe,
  };
  
  // 在渲染阶段同步读取快照
  // 确保读取的值与当前渲染一致
  const snapshot = getSnapshot();
  
  // 使用useEffect订阅更新
  useEffect(() => {
    let isCancelled = false;
    
    const checkForUpdates = () => {
      if (isCancelled) return;
      
      const newSnapshot = getSnapshot();
      // 如果快照变化，触发重新渲染
      if (!Object.is(snapshot, newSnapshot)) {
        // 触发同步更新
      }
    };
    
    const unsubscribe = subscribe(checkForUpdates);
    return () => {
      isCancelled = true;
      unsubscribe();
    };
  }, [subscribe, getSnapshot]);
  
  return snapshot;
}
```

### getSnapshot函数的引用稳定性

`getSnapshot` 函数的引用稳定性非常重要，因为它被用作effect的依赖：

```jsx
// ❌ 不稳定的getSnapshot —— 每次渲染都是新函数
const count = useSyncExternalStore(
  store.subscribe,
  () => store.getState().count  // 每次渲染创建新函数
);

// ✅ 使用useCallback稳定引用
const getCount = useCallback(
  () => store.getState().count,
  [store]
);
const count = useSyncExternalStore(store.subscribe, getCount);

// ✅ 或者使用useStore的selector（如果库已实现）
const count = useSyncExternalStore(
  store.subscribe,
  () => store.getState().count,
);
// 注意：React内部会对getSnapshot的返回值做浅比较优化
```

### getServerSnapshot 的重要性

在SSR场景中，第三个参数 `getServerSnapshot` 是必需的：

```jsx
function useMediaQuery(query) {
  const matches = useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', callback);
      return () => mql.removeEventListener('change', callback);
    },
    () => window.matchMedia(query).matches,
    // SSR时没有window，必须提供初始值
    () => false  // 服务端默认不匹配
  );
  
  return matches;
}
```

如果不提供 `getServerSnapshot` 且组件在SSR环境中使用，React会抛出错误。
