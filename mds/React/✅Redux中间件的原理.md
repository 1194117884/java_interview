# ✅Redux中间件的原理

# 典型回答

Redux中间件是一种**在action到达reducer之前进行拦截处理**的函数式编程模式。它允许开发者扩展Redux的功能，主要用于处理异步操作、日志记录、错误报告等副作用。

**中间件的核心原理是"函数复合"（compose）**：多个中间件通过组合形成一个处理链，每个中间件可以决定是否将action传递给下一个中间件或reducer，也可以在传递之前或之后执行自定义逻辑。

```jsx
// 中间件的标准签名 —— 三层嵌套的柯里化函数
const middleware = (store) => (next) => (action) => {
  // store: 包含 dispatch 和 getState
  // next: 下一个中间件或原始的store.dispatch
  // action: 当前被派发的action
  
  // 前处理逻辑
  // 可以修改action、延迟派发、忽略、派发新action等
  
  const result = next(action);  // 传递给下一个中间件
  
  // 后处理逻辑
  return result;
};
```

**dispatch的增强过程**：`applyMiddleware` 函数通过组合所有中间件来增强 `store.dispatch`，形成从外到内的洋葱圈模型。

# 扩展知识

### 中间件的洋葱圈模型

```jsx
// 多个中间件形成洋葱圈结构
applyMiddleware([middleware1, middleware2, middleware3])(createStore)(reducer);

// dispatch调用时的执行顺序：
// → middleware1(前处理) → middleware2(前处理) → middleware3(前处理)
// → reducer
// → middleware3(后处理) → middleware2(后处理) → middleware1(后处理)
```

```
图示洋葱圈模型：

    action → [中间件1] → [中间件2] → [中间件3] → [reducer]
                ↑                                    │
                │         中间件内部                    │
                │   前处理 → next() → 后处理            │
                │                                      │
                └──────────── new state ←───────────────┘
```

### applyMiddleware 的源码实现

```jsx
// 简化版 —— applyMiddleware的实现原理
function applyMiddleware(...middlewares) {
  return (createStore) => (reducer, preloadedState) => {
    // 创建原始store
    const store = createStore(reducer, preloadedState);
    
    // 准备middleware API
    const middlewareAPI = {
      getState: store.getState,
      dispatch: (action) => dispatch(action),  // 最终版的dispatch
    };
    
    // 调用第一层函数，传入store API
    const chain = middlewares.map(middleware => middleware(middlewareAPI));
    
    // 组合所有中间件
    // 最简单的compose: chain.reduce((a, b) => (...args) => a(b(...args)))
    const dispatch = compose(...chain)(store.dispatch);
    
    return {
      ...store,
      dispatch,  // 增强后的dispatch
    };
  };
}
```

### 常见中间件的实现

```jsx
// 1. 日志中间件 —— 最直观的例子
const loggerMiddleware = (store) => (next) => (action) => {
  console.group(`Action: ${action.type}`);
  console.log('Prev State:', store.getState());
  console.log('Action:', action);
  
  const result = next(action);
  
  console.log('Next State:', store.getState());
  console.groupEnd();
  
  return result;
};
```

```jsx
// 2. redux-thunk —— 处理异步action
// 让dispatch可以接收函数（thunk）而不是普通对象
function thunkMiddleware(store) {
  return (next) => (action) => {
    // 如果是函数，执行它并传入dispatch和getState
    if (typeof action === 'function') {
      return action(store.dispatch, store.getState);
    }
    // 普通action对象，传递给下一个中间件
    return next(action);
  };
}

// thunk的用法
const fetchUser = (userId) => async (dispatch, getState) => {
  dispatch({ type: 'FETCH_USER_START' });
  
  try {
    const user = await api.getUser(userId);
    dispatch({ type: 'FETCH_USER_SUCCESS', payload: user });
  } catch (error) {
    dispatch({ type: 'FETCH_USER_ERROR', payload: error.message });
  }
};

store.dispatch(fetchUser(1));
```

```jsx
// 3. redux-promise —— 处理Promise类型的action
const promiseMiddleware = (store) => (next) => (action) => {
  // 如果action.payload是Promise
  if (action.payload && typeof action.payload.then === 'function') {
    // 立即派发一个"开始"的action
    store.dispatch({
      type: action.type + '_PENDING',
      meta: action.meta,
    });
    
    // 等待Promise完成
    action.payload.then(
      (result) => {
        store.dispatch({
          type: action.type + '_FULFILLED',
          payload: result,
          meta: action.meta,
        });
      },
      (error) => {
        store.dispatch({
          type: action.type + '_REJECTED',
          payload: error,
          error: true,
          meta: action.meta,
        });
      }
    );
  }
  
  return next(action);
};
```

```jsx
// 4. redux-saga 的核心思想（简化）
// saga使用Generator函数来处理复杂的异步流程
function* fetchUserSaga(action) {
  try {
    yield put({ type: 'FETCH_USER_START' });
    const user = yield call(api.getUser, action.payload);
    yield put({ type: 'FETCH_USER_SUCCESS', payload: user });
  } catch (error) {
    yield put({ type: 'FETCH_USER_ERROR', payload: error.message });
  }
}

// saga中间件拦截所有action，检测是否有对应的saga监听
function sagaMiddleware(store) {
  return (next) => (action) => {
    // 检查是否有saga监听这个action type
    if (sagaMonitor.hasListener(action.type)) {
      // 运行对应的saga
      runSaga(fetchUserSaga, action);
    }
    return next(action);
  };
}
```

### 中间件的限制和注意事项

```jsx
// 注意1：不要在中间件中访问增强后的dispatch
// ❌ 可能导致无限循环
const badMiddleware = (store) => (next) => (action) => {
  store.dispatch({ type: 'ANOTHER_ACTION' });  // 使用store.dispatch!
  return next(action);
};

// ✅ 正确：使用next而不是store.dispatch
const goodMiddleware = (store) => (next) => (action) => {
  if (action.type === 'SPECIAL_ACTION') {
    // 可以派发新action，但要确保不会形成循环
    next({ type: 'DERIVED_ACTION' });
  }
  return next(action);
};
```

### 中间件 vs 其他副作用处理方案

| 方案 | 适用场景 | 学习成本 | 测试难度 | 异步流程控制 |
|------|---------|---------|---------|------------|
| redux-thunk | 简单异步 | 低 | 中 | 基础 |
| redux-saga | 复杂异步、竞态处理 | 高 | 低（可测试） | 强大（Generator） |
| redux-observable | 流式数据、WebSocket | 高 | 低 | 强大（RxJS） |
| redux-promise | Promise-based异步 | 低 | 中 | 基础 |
| RTK Query | API数据获取 | 中 | 低 | 内置缓存 |

### 自定义中间件的常见用途

```jsx
// 1. 错误报告中间件
const errorReportingMiddleware = (store) => (next) => (action) => {
  try {
    return next(action);
  } catch (error) {
    console.error('Redux Error:', error);
    // 发送到错误追踪服务
    errorReporter.captureException(error, { action });
    // 可以派发错误恢复action
    store.dispatch({ type: 'GLOBAL_ERROR', payload: error.message });
  }
};

// 2. 操作去重中间件
const dedupMiddleware = (() => {
  const pendingActions = new Set();
  
  return (store) => (next) => (action) => {
    if (action.meta?.dedup && pendingActions.has(action.type)) {
      // 同类型操作正在进行中，忽略当前action
      return;
    }
    
    if (action.meta?.dedup) {
      pendingActions.add(action.type);
    }
    
    const result = next(action);
    pendingActions.delete(action.type);
    return result;
  };
})();

// 3. 权限验证中间件
const authMiddleware = (store) => (next) => (action) => {
  if (action.meta?.requiresAuth) {
    const state = store.getState();
    if (!state.user.isAuthenticated) {
      console.warn('Unauthorized action:', action.type);
      return;  // 阻止未授权操作
    }
  }
  return next(action);
};
```

### Redux Toolkit中的中间件配置

```jsx
import { configureStore } from '@reduxjs/toolkit';
import logger from 'redux-logger';
import thunk from 'redux-thunk';

const store = configureStore({
  reducer: rootReducer,
  // RTK的configureStore默认集成了thunk和开发环境的redux DevTools
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(logger)  // 追加自定义中间件
      // .prepend(otherMiddleware)  // 前置到默认中间件之前
});
```
