# ✅useContext的工作原理和使用注意事项

# 典型回答

`useContext` 是React提供的用于在组件树中**跨层级传递数据**的Hook，它让你无需通过props逐层传递就能在任意深度的组件中访问共享数据。

工作原理：`useContext(context)` 接收一个Context对象（由 `React.createContext` 创建），返回该Context的当前值。当前值由上层最近的 `<Context.Provider>` 组件的 `value` 属性决定。如果组件树中没有对应的Provider，则返回创建Context时传入的默认值。

```jsx
// 1. 创建Context
const ThemeContext = React.createContext('light');

// 2. Provider提供数据
function App() {
  const [theme, setTheme] = useState('dark');
  
  return (
    <ThemeContext.Provider value={theme}>
      <Toolbar />
    </ThemeContext.Provider>
  );
}

// 3. 消费数据
function Toolbar() {
  const theme = useContext(ThemeContext);  // 'dark'
  return <div className={theme}>Toolbar</div>;
}
```

**使用注意事项**：
- 当Provider的 `value` 变化时，所有使用 `useContext` 的组件都会**强制重新渲染**
- 避免滥用Context导致**全局状态管理混乱**
- 合理拆分Context以防止不必要的跨组件更新
- 注意 `value` 属性应为稳定引用（避免内联对象）

# 扩展知识

### Context的更新传播机制

当Provider的value变化时，React会从Provider开始向下遍历，找到所有消费该Context的组件并强制更新：

```jsx
function App() {
  const [user, setUser] = useState({ name: '张三' });
  
  // 问题：每次App渲染，value都是新对象
  // 导致所有useContext(ThemeContext)的组件重新渲染
  return (
    <ThemeContext.Provider value={{ theme: 'dark', user }}>
      <Main />
    </ThemeContext.Provider>
  );
}

// 解决：使用useMemo稳定value引用
function App() {
  const [user, setUser] = useState({ name: '张三' });
  
  const contextValue = useMemo(() => ({
    theme: 'dark',
    user,
  }), [user]);  // 仅user变化时创建新对象
  
  return (
    <ThemeContext.Provider value={contextValue}>
      <Main />
    </ThemeContext.Provider>
  );
}
```

### Context的传播比较方式

Context使用**Object.is（引用相等）**来判断value是否变化，不是深度比较：

```jsx
const UserContext = React.createContext();

function UserProvider({ children }) {
  const [user, setUser] = useState({ name: 'React' });
  
  // 下面的调用方式，即使数据没变，也会创建新对象
  // 导致所有Consumer重新渲染
  const updateName = (name) => {
    setUser(prev => {
      if (prev.name === name) {
        // 返回同一个引用 —— Consumer不会重新渲染
        return prev;
      }
      return { ...prev, name };
    });
  };
  
  const value = useMemo(() => ({ user, updateName }), [user]);
  
  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}
```

### 多个Context的组合模式

```jsx
// 好的实践：拆分关注点不同的Context
// 而不是把所有东西塞到一个大Context中
const AuthContext = React.createContext(null);
const ThemeContext = React.createContext('light');
const LocaleContext = React.createContext('zh-CN');

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LocaleProvider>
          <MainApp />
        </LocaleProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

// 这样，主题变化不会引起只使用Auth的组件重新渲染
function UserAvatar() {
  const { user } = useContext(AuthContext);  // 只在Auth变化时重新渲染
  return <img src={user.avatar} alt="" />;
}
```

### Context的性能问题与优化

Context的**最大性能问题**：Provider的value一旦变化，所有消费该Context的组件都会重新渲染，即使它们只使用了其中一部分数据。

```jsx
// 问题：组件A只用了user，组件B只用了settings
// 但任何一方数据变化都会导致双方都重新渲染
const AppContext = React.createContext();

function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({});
  
  const value = useMemo(() => ({ user, setUser, settings, setSettings }), [
    user, settings
  ]);
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// 优化方案：拆分Context
const UserContext = React.createContext();
const SettingsContext = React.createContext();

function AppProvider({ children }) {
  return (
    <UserProvider>
      <SettingsProvider>
        {children}
      </SettingsProvider>
    </UserProvider>
  );
}
```

### useContext vs Redux vs 组件props

| 维度 | Context API | Redux | Props 逐层传递 |
|------|------------|-------|--------------|
| 使用复杂度 | 低 | 高 | 低 |
| 适合范围 | 低频更新、全局数据 | 复杂状态、高频更新 | 相邻层级 |
| 调试工具 | 有限 | 强大的DevTools | React DevTools |
| 性能（大量更新） | 较差 | 好（选择性更新） | 好 |
| 中间件支持 | 无 | 有 | 无 |
| 代码侵入性 | 中 | 高 | 低 |

### Context + useReducer 实现轻量状态管理

```jsx
// 结合useReducer可以实现类似Redux的局部状态管理
const CounterContext = React.createContext();

function counterReducer(state, action) {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + 1 };
    case 'DECREMENT':
      return { count: state.count - 1 };
    case 'RESET':
      return { count: 0 };
    default:
      return state;
  }
}

function CounterProvider({ children }) {
  const [state, dispatch] = useReducer(counterReducer, { count: 0 });
  
  const value = useMemo(() => ({ state, dispatch }), [state]);
  
  return (
    <CounterContext.Provider value={value}>
      {children}
    </CounterContext.Provider>
  );
}

// 消费
function CounterDisplay() {
  const { state, dispatch } = useContext(CounterContext);
  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: 'INCREMENT' })}>+</button>
      <button onClick={() => dispatch({ type: 'DECREMENT' })}>-</button>
    </div>
  );
}
```

### 默认值的特殊场景

```jsx
// 创建Context时的默认值只在没有Provider时生效
const ThemeContext = React.createContext('light');

function ComponentA() {
  // 有Provider包裹，取Provider的值
  const theme = useContext(ThemeContext); // 'dark'
  return <div />;
}

function ComponentB() {
  // 没有Provider包裹，取默认值
  const theme = useContext(ThemeContext); // 'light'
  return <div />;
}

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <ComponentA />
      {/* ComponentB不在Provider内 */}
    </ThemeContext.Provider>
    <ComponentB />
  );
}
```

### 嵌套Provider的值覆盖

```jsx
// 同类型的Provider会覆盖上层值
const ThemeContext = React.createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <>
        <Toolbar />  {/* 取到 'dark' */}
        <ThemeContext.Provider value="blue">
          <Sidebar />  {/* 取到 'blue' —— 覆盖了外层的 'dark' */}
        </ThemeContext.Provider>
      </>
    </ThemeContext.Provider>
  );
}
```
