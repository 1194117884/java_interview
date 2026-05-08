# ✅useReducer的适用场景和Redux的关系

# 典型回答

`useReducer` 是React提供的用于管理**复杂状态逻辑**的Hook，它是 `useState` 的替代方案。当状态更新逻辑涉及多个子值、或者下一个状态依赖于前一个状态时，`useReducer` 比 `useState` 更合适。

```jsx
// useState —— 适合简单独立的状态
const [count, setCount] = useState(0);

// useReducer —— 适合复杂的状态逻辑
const [state, dispatch] = useReducer(reducer, initialState);

function reducer(state, action) {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + 1, lastUpdated: Date.now() };
    case 'DECREMENT':
      return { count: state.count - 1, lastUpdated: Date.now() };
    case 'SET':
      return { count: action.payload, lastUpdated: Date.now() };
    default:
      return state;
  }
}
```

**useReducer与Redux的关系**：它们基于相同的思想——**reducer模式（状态归约）**，但**不在同一抽象层级**。`useReducer` 是组件级别的状态管理工具，而Redux是应用级别的全局状态管理方案。`useReducer` 不解决跨组件状态共享问题，需要配合Context才能实现类似Redux的效果。可以这样理解：useReducer ≈ 局部Redux，但不包含Redux的中间件、DevTools等高级特性。

# 扩展知识

### useReducer vs useState 的选择指南

| 条件 | 推荐方案 |
|------|---------|
| 简单独立的状态（数字、布尔值） | useState |
| 状态逻辑涉及多个子值 | useReducer |
| 状态更新逻辑复杂（多种操作类型） | useReducer |
| 状态更新逻辑可复用（独立reducer函数） | useReducer |
| 深层组件需要更新状态 | useState + 回调 |
| 深层组件需要分发多种操作 | useReducer + Context |

### 何时应该使用useReducer

```jsx
// 场景1：状态逻辑复杂，涉及多个字段
function BookingForm() {
  // ❌ useState —— 多个setState调用散落各处
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [guests, setGuests] = useState(1);
  const [occasion, setOccasion] = useState('');
  const [errors, setErrors] = useState({});
  
  // ✅ useReducer —— 状态逻辑集中管理
  const [state, dispatch] = useReducer(bookingReducer, {
    date: '',
    time: '',
    guests: 1,
    occasion: '',
    errors: {},
  });
  
  // reducer逻辑独立，可测试
  function bookingReducer(state, action) {
    switch (action.type) {
      case 'SET_DATE':
        return { ...state, date: action.payload, errors: validateDate(action.payload) };
      case 'SET_TIME':
        return { ...state, time: action.payload };
      case 'SET_GUESTS':
        return { ...state, guests: action.payload, errors: validateGuests(action.payload) };
      case 'RESET':
        return initialState;
      default:
        return state;
    }
  }
}
```

```jsx
// 场景2：状态更新依赖复杂计算
// ❌ 使用useState时，多个setState之间相互依赖难以管理
function handleSubmit() {
  setLoading(true);
  setError(null);
  // 异步操作后...
  setData(result);
  setLoading(false);
}

// ✅ 使用useReducer，所有状态更新在一个dispatch中完成
function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, data: action.payload };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
  }
}

function fetchData(dispatch) {
  dispatch({ type: 'FETCH_START' });
  try {
    const result = await api.get('/data');
    dispatch({ type: 'FETCH_SUCCESS', payload: result });
  } catch (err) {
    dispatch({ type: 'FETCH_ERROR', payload: err.message });
  }
}
```

### useReducer + Context 实现局部Redux

```jsx
// 创建Context
const TodoContext = React.createContext();
const TodoDispatchContext = React.createContext();

// Reducer
function todoReducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return [...state, { id: Date.now(), text: action.payload, completed: false }];
    case 'TOGGLE':
      return state.map(todo =>
        todo.id === action.payload
          ? { ...todo, completed: !todo.completed }
          : todo
      );
    case 'DELETE':
      return state.filter(todo => todo.id !== action.payload);
    default:
      return state;
  }
}

// Provider
function TodoProvider({ children }) {
  const [todos, dispatch] = useReducer(todoReducer, []);
  
  return (
    <TodoContext.Provider value={todos}>
      <TodoDispatchContext.Provider value={dispatch}>
        {children}
      </TodoDispatchContext.Provider>
    </TodoContext.Provider>
  );
}

// 自定义Hooks
function useTodos() {
  return useContext(TodoContext);
}
function useTodosDispatch() {
  return useContext(TodoDispatchContext);
}

// 组件中使用
function TodoList() {
  const todos = useTodos();
  const dispatch = useTodosDispatch();
  
  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>
          <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
            {todo.text}
          </span>
          <button onClick={() => dispatch({ type: 'TOGGLE', payload: todo.id })}>
            {todo.completed ? '撤销' : '完成'}
          </button>
        </li>
      ))}
    </ul>
  );
}
```

### useReducer 与 Redux 的详细对比

| 维度 | useReducer | Redux |
|------|-----------|-------|
| 作用范围 | 组件内部或局部 | 全局应用状态 |
| 状态共享 | 需配合Context | 内置store机制 |
| 中间件 | 不支持 | 强大的中间件体系 |
| DevTools | 仅React DevTools | 专用Redux DevTools |
| 时间旅行调试 | 不支持 | 支持 |
| 代码量 | 少 | 多 |
| 学习成本 | 低 | 高 |
| 大型团队协作 | 不适合 | 适合 |
| 服务端渲染 | 原生支持 | 需额外配置 |
| 持久化 | 需手动实现 | 有中间件支持 |

### Reducer的纯函数要求

无论是 `useReducer` 还是 Redux，reducer都必须是**纯函数**：

```jsx
// ✅ 正确 —— 纯函数
function goodReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM':
      return [...state, action.payload];  // 返回新数组，不修改原数组
    default:
      return state;
  }
}

// ❌ 错误 —— 非纯函数
function badReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM':
      state.push(action.payload);  // 直接修改state！
      return state;
    case 'FETCH_DATA':
      fetch('/api/data').then(setData);  // 副作用！
      return state;
    default:
      return state;
  }
}
```

### useReducer的惰性初始化

useReducer支持第三个参数实现惰性初始化：

```jsx
// 惰性初始化 —— 初始值只在首次渲染时计算
function init(initialCount) {
  return { count: initialCount };
}

function Counter({ initialCount = 0 }) {
  const [state, dispatch] = useReducer(reducer, initialCount, init);
  // init(initialCount) 只在首次渲染时执行
  // 后续渲染不会重新计算
}
```

### useReducer + Immer 处理不可变数据

```jsx
import { produce } from 'immer';

function todoReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE':
      // Immer允许"可变"写法，但实际返回不可变数据
      return produce(state, draft => {
        const todo = draft.find(t => t.id === action.payload);
        if (todo) {
          todo.completed = !todo.completed;
        }
      });
    default:
      return state;
  }
}
```
