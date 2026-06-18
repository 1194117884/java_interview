# ✅自定义Hook的设计模式和最佳实践

# 典型回答

自定义Hook是React中**复用状态逻辑**的机制。它是一个以 `use` 开头的JavaScript函数，内部可以调用其他React Hook。自定义Hook让开发者能够将组件中的逻辑提取为可复用的函数，与组件渲染逻辑分离。

```jsx
// 一个简单的自定义Hook —— 管理布尔值切换
function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue(v => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  
  return [value, { toggle, setTrue, setFalse, setValue }];
}

// 使用
function ExpandablePanel() {
  const [isOpen, { toggle }] = useToggle(false);
  return (
    <div>
      <button onClick={toggle}>展开/收起</button>
      {isOpen && <div>Content</div>}
    </div>
  );
}
```

**最佳实践**：自定义Hook应当遵循"单一职责"原则，每个Hook只关注一个功能点。命名要清晰表达用途，返回值要符合直觉（数组或命名对象）。Hook内部要正确处理清理逻辑，避免内存泄漏。

# 扩展知识

### 自定义Hook的命名规范

React要求自定义Hook**必须以 `use` 开头**。这不是一个约定，而是一个规则：

```jsx
// 正确 —— 以use开头
function useWindowSize() { /* ... */ }
function useDebounce(value, delay) { /* ... */ }
function useLocalStorage(key, initial) { /* ... */ }

// 错误 —— 不以use开头，React无法检测Hook规则违反
function windowSize() { 
  useState(0);  // React无法检测此Hook是否在条件中被调用
  useEffect(() => {}); 
}
```

> `use` 前缀让React插件（ESLint、DevTools）能够正确识别Hook并检查规则。

### 常见的自定义Hook设计模式

```jsx
// 模式1：状态管理型 —— 封装特定状态逻辑
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });
  
  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [key, storedValue]);
  
  return [storedValue, setValue];
}
```

```jsx
// 模式2：副作用型 —— 封装副作用逻辑
function useDocumentTitle(title) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;
    
    return () => {
      document.title = prevTitle;  // 清理时恢复
    };
  }, [title]);
}

function useEventListener(eventName, handler, element = window) {
  const savedHandler = useRef(handler);
  
  // 保持handler引用最新
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);
  
  useEffect(() => {
    const eventListener = (event) => savedHandler.current(event);
    element.addEventListener(eventName, eventListener);
    return () => element.removeEventListener(eventName, eventListener);
  }, [eventName, element]);
}
```

```jsx
// 模式3：生命周期型 —— 封装组件生命周期逻辑
function useInterval(callback, delay) {
  const savedCallback = useRef(callback);
  
  useEffect(() => {
    savedCallback.current = callback;
  });
  
  useEffect(() => {
    if (delay === null || delay === undefined) return;
    
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

// 使用
function Timer() {
  const [count, setCount] = useState(0);
  useInterval(() => setCount(c => c + 1), 1000);
  return <div>{count}s</div>;
}
```

### 自定义Hook的返回值设计

```jsx
// 推荐：数组 —— 类似useState的API
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  const increment = useCallback(() => setCount(c => c + 1), []);
  const decrement = useCallback(() => setCount(c => c - 1), []);
  const reset = useCallback(() => setCount(initialValue), [initialValue]);
  
  return [count, { increment, decrement, reset, setCount }];
}
// 使用：const [count, { increment, decrement }] = useCounter(10);

// 推荐：命名对象 —— 多个返回值时更清晰
function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const login = useCallback(async (credentials) => { /* ... */ }, []);
  const logout = useCallback(async () => { /* ... */ }, []);
  
  return { user, loading, error, login, logout };
}
// 使用：const { user, login, loading } = useAuth();
```

### 组合自定义Hook

```jsx
// 通过组合多个自定义Hook构建更复杂的功能
function useUserData(userId) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 组合useEffect获取数据
  useEffect(() => {
    let cancelled = false;
    
    async function fetchUser() {
      setLoading(true);
      try {
        const data = await fetch(`/api/users/${userId}`).then(r => r.json());
        if (!cancelled) {
          setUser(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    
    fetchUser();
    return () => { cancelled = true; };
  }, [userId]);
  
  return { user, loading, error };
}

function useUserPreferences(userId) {
  const [preferences, setPreferences] = useState(null);
  // ...类似的逻辑
  return { preferences, setPreferences };
}

// 组合多个Hook
function useUserProfilePage(userId) {
  const userData = useUserData(userId);
  const prefs = useUserPreferences(userId);
  const documentTitle = `${userData.user?.name || '加载中...'} - 个人资料`;
  useDocumentTitle(documentTitle);
  
  return { ...userData, ...prefs };
}
```

### 自定义Hook的测试

```jsx
// 使用 @testing-library/react-hooks 测试自定义Hook
import { renderHook, act } from '@testing-library/react';

test('useCounter should increment and decrement', () => {
  const { result } = renderHook(() => useCounter(0));
  
  expect(result.current[0]).toBe(0);  // 初始值
  
  act(() => {
    result.current[1].increment();
  });
  expect(result.current[0]).toBe(1);
  
  act(() => {
    result.current[1].decrement();
  });
  expect(result.current[0]).toBe(0);
});

test('useCounter should handle different initial values', () => {
  const { result } = renderHook(() => useCounter(10));
  expect(result.current[0]).toBe(10);
});
```

### 自定义Hook的反模式

```jsx
// 反模式1：Hook内部依赖外部状态但未声明为参数
function useData() {
  const [data, setData] = useState(null);
  // ❌ 依赖全局变量，不明确
  useEffect(() => {
    fetch(window.apiUrl + '/data').then(setData);
  }, []);
}

// ✅ 正确：通过参数显式声明依赖
function useData(apiUrl) {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch(apiUrl + '/data').then(setData);
  }, [apiUrl]);
}

// 反模式2：过度抽象
// ❌ 单一场景的Hook，不如直接写在组件中
function useShowMoreButton(showMore, setShowMore) {
  const toggle = () => setShowMore(!showMore);
  return { showMore, toggle };
}

// ✅ 当逻辑有明显的复用价值时才抽离为自定义Hook
function useInfiniteScroll(callback) {
  // 通用的无限滚动逻辑...
}
```

### 自定义Hook中的Context访问模式

```jsx
// 将Context访问封装在自定义Hook中
const ThemeContext = React.createContext('light');

// 在自定义Hook中封装Context使用
function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// 使用方无需知道Context细节
function ThemedButton() {
  const theme = useTheme();  // 简单清晰
  return <button className={theme}>Click me</button>;
}
```
