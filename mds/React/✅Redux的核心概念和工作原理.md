# ✅Redux的核心概念和工作原理

# 典型回答

Redux是一个**可预测的状态管理容器**，它通过**单一数据源**、**只读状态**和**纯函数修改**三个核心原则，为JavaScript应用提供可预测、可调试的状态管理方案。

**Redux的三大核心概念**：

1. **Store**：单一状态树，存储整个应用的全局状态
2. **Action**：描述状态变化的普通JavaScript对象，必须包含 `type` 字段
3. **Reducer**：纯函数，接收当前state和action，返回新的state

**工作原理（单向数据流）**：
```
用户交互 → dispatch(action) → reducer(state, action) → new state → view更新
                              ↑                                     |
                              └──────────── 订阅通知 ──────────────┘
```

```jsx
// 1. 定义Action
const ADD_TODO = 'ADD_TODO';
const addTodo = (text) => ({
  type: ADD_TODO,
  payload: { text, completed: false }
});

// 2. 定义Reducer
function todosReducer(state = [], action) {
  switch (action.type) {
    case ADD_TODO:
      return [...state, { id: Date.now(), ...action.payload }];
    case TOGGLE_TODO:
      return state.map(todo =>
        todo.id === action.payload
          ? { ...todo, completed: !todo.completed }
          : todo
      );
    default:
      return state;
  }
}

// 3. 创建Store
const store = createStore(todosReducer);

// 4. 派发Action
store.dispatch(addTodo('学习Redux'));

// 5. 读取状态
store.getState();
```

# 扩展知识

### Redux的三大原则

```bash
1. 单一数据源（Single Source of Truth）
   → 整个应用的全局状态存储在一个对象树中（单一store）
   → 便于调试、序列化、时间旅行

2. State是只读的（State is Read-Only）
   → 唯一改变state的方式是触发action
   → 确保所有状态变化集中可追踪

3. 使用纯函数执行修改（Changes are Made with Pure Functions）
   → Reducer必须是纯函数：给定相同的输入，始终返回相同的输出
   → 不产生副作用，不修改传入的参数
```

### 完整的Redux数据流

```jsx
// 1. View层触发交互
function TodoItem({ todo, dispatch }) {
  return (
    <li onClick={() => dispatch({
      type: 'TOGGLE_TODO',
      payload: todo.id
    })}>
      {todo.text}
    </li>
  );
}

// 2. Middleware拦截处理（如果有）
// 例如 redux-thunk 处理异步action
const thunkMiddleware = (store) => (next) => (action) => {
  if (typeof action === 'function') {
    return action(store.dispatch, store.getState);
  }
  return next(action);
};

// 3. Reducer计算新状态
function appReducer(state = initialState, action) {
  switch (action.type) {
    case 'TOGGLE_TODO':
      // 返回新对象，不修改原state
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload
            ? { ...todo, completed: !todo.completed }
            : todo
        )
      };
    default:
      return state;
  }
}

// 4. Store通知订阅者
store.subscribe(() => {
  console.log('State updated:', store.getState());
});

// 5. React组件重新渲染
// react-redux的useSelector/connect内部会订阅store变化
```

### combineReducers 的用法

```jsx
import { createStore, combineReducers } from 'redux';

// 每个reducer管理自己的状态切片
const todosReducer = (state = [], action) => {
  switch (action.type) {
    case 'ADD_TODO':
      return [...state, action.payload];
    default:
      return state;
  }
};

const userReducer = (state = null, action) => {
  switch (action.type) {
    case 'SET_USER':
      return action.payload;
    case 'LOGOUT':
      return null;
    default:
      return state;
  }
};

// 合并reducer
const rootReducer = combineReducers({
  todos: todosReducer,
  user: userReducer,
});

const store = createStore(rootReducer);

// 最终state结构
// {
//   todos: [...],
//   user: { name: 'React' }
// }
```

### Redux Toolkit —— 现代Redux

Redux官方推荐的现代写法，大幅减少了模板代码：

```jsx
import { createSlice, configureStore } from '@reduxjs/toolkit';

// createSlice 自动生成action creators和reducer
const todosSlice = createSlice({
  name: 'todos',
  initialState: [],
  reducers: {
    addTodo: (state, action) => {
      // 注意：Redux Toolkit内部使用Immer，允许"可变"语法
      state.push({ id: Date.now(), text: action.payload, completed: false });
    },
    toggleTodo: (state, action) => {
      const todo = state.find(t => t.id === action.payload);
      if (todo) todo.completed = !todo.completed;
    },
    removeTodo: (state, action) => {
      return state.filter(t => t.id !== action.payload);
    },
  },
});

// 导出actions
export const { addTodo, toggleTodo, removeTodo } = todosSlice.actions;

// 配置store
const store = configureStore({
  reducer: {
    todos: todosSlice.reducer,
  },
});
```

### Redux 中间件原理

中间件是Redux中处理副作用的扩展点，位于action被dispatch后和到达reducer之前：

```jsx
// 中间件的签名
const middleware = (store) => (next) => (action) => {
  // 前处理
  console.log('Dispatching:', action);
  
  // 调用下一个中间件或reducer
  const result = next(action);
  
  // 后处理
  console.log('Next state:', store.getState());
  
  return result;
};

// 中间件链
dispatch(action) → middleware1 → middleware2 → middleware3 → reducer → new state
```

### Redux vs React内置方案

| 维度 | Redux | Context + useReducer | Zustand |
|------|-------|-------------------|---------|
| 样板代码 | 多（RTK大幅减少） | 少 | 极少 |
| 性能 | 好（选择性订阅） | 穿透渲染问题 | 好（选择性订阅） |
| 中间件 | 丰富（thunk/saga） | 无 | 有（简约） |
| DevTools | 强大的时间旅行调试 | 有限的React DevTools | 支持 |
| 学习曲线 | 陡峭 | 平缓 | 平缓 |
| 适用规模 | 大型应用 | 中小型应用 | 中大型应用 |
| 服务端渲染 | 支持 | 原生支持 | 支持 |

### Redux 的适用场景

```bash
适合使用Redux的场景：
  ✓ 跨多个组件共享的复杂全局状态
  ✓ 需要时间旅行调试的复杂交互
  ✓ 大量用户交互、频繁状态更新
  ✓ 需要中间件处理复杂副作用（saga、websocket）
  ✓ 大型团队协作，需要规范的状态管理

不适合使用Redux的场景：
  ✗ 简单的UI状态（切换开关、表单输入）
  ✗ 服务端数据缓存（用TanStack Query更合适）
  ✗ 小项目或原型开发
  ✗ 组件内部隔离状态
```
