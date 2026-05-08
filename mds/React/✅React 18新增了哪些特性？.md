# ✅React 18新增了哪些特性？

# 典型回答

React 18是React历史上最重要的一次更新，引入了**并发机制（Concurrency）**作为底层架构变革，并带来了多项新特性和API变更。

**React 18的核心新特性**：

1. **并发渲染（Concurrent Rendering）**：可中断的渲染机制，让React能同时准备多个版本的UI
2. **自动批处理（Automatic Batching）**：所有状态更新自动合并，不再区分同步/异步环境
3. **Transitions（过渡更新）**：`useTransition` 和 `useDeferredValue` 用于标记低优先级更新
4. **Suspense改进**：支持服务端流式渲染、Suspense不再只是用于代码分割
5. **新的客户端API**：`createRoot` 替代 `ReactDOM.render`
6. **新的服务端API**：`renderToPipeableStream` 支持流式SSR
7. **Hooks新增**：`useId`、`useSyncExternalStore`、`useInsertionEffect`
8. **Strict Mode改进**：开发模式下组件会卸载再挂载以检测副作用问题

```jsx
// 升级React 18的第一步：使用createRoot替代ReactDOM.render

// React 17
ReactDOM.render(<App />, document.getElementById('root'));

// React 18
import { createRoot } from 'react-dom/client';
const root = createRoot(document.getElementById('root'));
root.render(<App />);
```

# 扩展知识

### 自动批处理（Automatic Batching）

React 18之前，批处理只在React事件处理函数中生效。React 18中，所有地方的更新都自动批处理：

```jsx
// React 17 —— 不同上下文中的批处理行为不同
function App() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);
  
  function handleClick() {
    // React事件中：批处理，一次渲染
    setCount(c => c + 1);
    setFlag(f => !f);
    // 一次渲染
  }
  
  function handleAsyncClick() {
    // setTimeout中：不批处理
    setTimeout(() => {
      setCount(c => c + 1);  // 一次渲染
      setFlag(f => !f);       // 又一次渲染
    }, 100);
  }
  
  function handlePromiseClick() {
    // Promise中：不批处理
    fetch(url).then(() => {
      setCount(c => c + 1);  // 一次渲染
      setFlag(f => !f);       // 又一次渲染
    });
  }
}

// React 18 —— 所有场景自动批处理
function App() {
  const [count, setCount] = useState(0);
  const [flag, setFlag] = useState(false);
  
  function handleClick() {
    // 批处理
    setCount(c => c + 1);
    setFlag(f => !f);
  }
  
  function handleAsyncClick() {
    setTimeout(() => {
      setCount(c => c + 1);  // React 18：批处理，一次渲染
      setFlag(f => !f);
    }, 100);
  }
  
  function handlePromiseClick() {
    fetch(url).then(() => {
      setCount(c => c + 1);  // React 18：批处理，一次渲染
      setFlag(f => !f);
    });
  }
  
  // 如果需要不批处理（极少情况），使用 flushSync
  const { flushSync } = require('react-dom');
  function handleFlush() {
    flushSync(() => setCount(c => c + 1));  // 立即渲染
    flushSync(() => setFlag(f => !f));       // 再次渲染
  }
}
```

### 并发特性详解

```jsx
// 并发不是"同时执行"，而是"可中断执行"
// React可以在渲染过程中被更高优先级的任务打断

// 传统渲染（React 17及之前）：
// setState → 开始渲染 → 不可中断 → 渲染完成 → 显示结果
// 如果渲染耗时100ms，浏览器在这100ms内无法响应用户输入

// 并发渲染（React 18）：
// setState → 开始渲染 → 用户输入 → 中断渲染 → 响应输入 → 继续渲染
// 用户始终能获得即时反馈
```

```jsx
// useTransition —— 标记低优先级更新
function SearchPage() {
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  // isPending: 过渡是否正在进行
  // startTransition: 将回调内的更新标记为过渡
  
  const handleChange = (e) => {
    // 紧急更新：输入框即时响应
    setQuery(e.target.value);
    
    // 过渡更新：搜索结果可以延迟
    startTransition(() => {
      setSearchQuery(e.target.value);
    });
  };
  
  return (
    <div>
      <input value={query} onChange={handleChange} />
      {isPending && <Spinner />}
      <SearchResults query={searchQuery} />
    </div>
  );
}
```

### Suspense改进

React 18的Suspense不再只是用于 `React.lazy`，还可以用于数据获取：

```jsx
// React 18之前：Suspense只支持React.lazy
<Suspense fallback={<Loading />}>
  <LazyComponent />
</Suspense>

// React 18：Suspense支持更多场景
// 1. 服务端流式渲染
// 2. 配合支持Suspense的数据获取库（如Relay、SWR）
// 3. 更稳定的组件卸载/重新挂载检测

// 服务端流式 SSR —— Suspense边界可以独立流式传输
function ProfilePage() {
  return (
    <div>
      <ProfileHeader />  {/* 立即发送 */}
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileTimeline />  {/* 数据就绪后流式补充 */}
      </Suspense>
    </div>
  );
}
```

### 新的Hooks

```jsx
// 1. useId —— 生成唯一ID（SSR安全）
function FormField({ label }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} type="text" />
    </div>
  );
}

// 2. useSyncExternalStore —— 外部存储的并发安全订阅
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
    () => navigator.onLine,
    () => true  // SSR fallback
  );
  return isOnline;
}

// 3. useInsertionEffect —— CSS-in-JS库专用
// 在DOM变更前同步执行，用于注入样式
// 不推荐普通应用场景使用
useInsertionEffect(() => {
  // 在此处注入样式规则
  const style = document.createElement('style');
  style.textContent = '.dynamic-class { color: red }';
  document.head.appendChild(style);
  return () => style.remove();
}, []);
```

### React 18 版本迁移清单

```bash
升级到React 18的检查清单：

[ ] 将 ReactDOM.render 替换为 createRoot
[ ] 更新TypeScript类型定义（@types/react, @types/react-dom）
[ ] 检查StrictMode的新行为（开发模式双重挂载）
[ ] 处理自动批处理带来的行为变化
[ ] 确保第三方库支持React 18
[ ] 可选：启用并发特性（useTransition, useDeferredValue）
[ ] 可选：升级服务端渲染API（renderToPipeableStream）

常见迁移问题：
- ReactDOM.render未替换 → 控制台警告
- 旧的setTimeout中的渲染行为变化（自动批处理）
- 移除componentWillMount等不安全的生命周期
```

### React 18 性能提升数据

```bash
性能改进概览：

自动批处理：
  - 减少不必要的渲染次数
  - 综合性能提升：5-20%（取决于应用场景）

并发渲染：
  - 输入响应延迟降低：40-60%
  - 大列表渲染不再阻塞交互

流式SSR：
  - 首字节时间（TTFB）：不变
  - 首次内容渲染（FCP）：提升20-50%
  - 可交互时间（TTI）：提升10-30%

Suspense + 流式渲染配合：
  - 用户感知加载时间减少
  - 可交互相对于FCP的延迟降低
```

### React 18 中的StrictMode变化

```jsx
// React 18的StrictMode在开发环境下会让组件：
// 挂载 → 卸载 → 再挂载
// 这有助于发现useEffect中的清理遗漏

function App() {
  return (
    <StrictMode>
      <Component />
    </StrictMode>
  );
}

function Component() {
  useEffect(() => {
    console.log('Effect mounted');
    // 在React 18 StrictMode下，开发环境会输出两次
    // "Effect mounted" (第一次)
    // "Effect cleanup" (清理)
    // "Effect mounted" (第二次)
    
    return () => {
      console.log('Effect cleanup');
    };
  }, []);
}
```
