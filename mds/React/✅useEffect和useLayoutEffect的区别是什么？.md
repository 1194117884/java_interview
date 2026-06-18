# ✅useEffect和useLayoutEffect的区别是什么？

# 典型回答

`useEffect` 和 `useLayoutEffect` 都是React中用于执行副作用（side effects）的Hook，它们的函数签名完全相同，核心区别在于**执行的时机不同**：

- **`useEffect`**：在**浏览器完成布局和绘制之后**异步执行。不会阻塞浏览器的视觉更新。
- **`useLayoutEffect`**：在**DOM更新完成后、浏览器绘制之前**同步执行。会阻塞浏览器的视觉更新。

两者的执行时机对比：
```
触发渲染 → 更新虚拟DOM → 更新真实DOM → [useLayoutEffect执行] → 浏览器绘制 → [useEffect执行]
```

大部分场景应该使用 `useEffect`，因为它不会阻塞浏览器绘制，性能更好。**只有在需要读取或同步修改DOM布局（如测量元素尺寸、触发同步动画）时，才使用 `useLayoutEffect`**。

# 扩展知识

### 执行时机的详细对比

```jsx
// useEffect —— 在浏览器绘制后异步执行
useEffect(() => {
  // 此时浏览器已经完成绘制，用户已经看到UI
  // 适合：数据请求、事件订阅、日志上报
  fetchData().then(setData);
  
  return () => {
    // 清理函数在下次effect执行前或组件卸载时执行
    cleanup();
  };
}, [dependencies]);

// useLayoutEffect —— 在DOM更新后、浏览器绘制前同步执行
useLayoutEffect(() => {
  // 此时DOM已更新，但浏览器还没有将结果绘制到屏幕上
  // 适合：读取DOM布局、同步修改样式
  const rect = ref.current.getBoundingClientRect();
  // 同步修改以避免视觉闪烁
  ref.current.style.height = `${rect.width}px`;
  
  return () => {
    // 清理逻辑
  };
}, [dependencies]);
```

### 完整的工作流程时间线

```
1. 组件渲染函数执行
2. React协调（diff），计算DOM变更
3. 提交阶段 —— React更新真实DOM
   ↓
4. useLayoutEffect被同步调用（此时还未绘制）
   ↓
5. 浏览器绘制（将屏幕内容呈现给用户）
   ↓
6. useEffect在空闲时被异步调用
```

### 关键区别表

| 维度 | useEffect | useLayoutEffect |
|------|----------|----------------|
| 执行时机 | 浏览器绘制之后 | DOM更新后、绘制之前 |
| 是否阻塞绘制 | 不阻塞 | 阻塞 |
| 触发方式 | 异步（微任务后） | 同步 |
| 服务端渲染 | 支持 | 有警告（SSR中不支持） |
| 典型场景 | 数据请求、事件订阅、日志 | DOM测量、同步样式调整 |
| 性能影响 | 低 | 高（会延迟首次绘制） |

### 使用useLayoutEffect的典型场景

```jsx
// 场景1：测量DOM元素尺寸
function Tooltip({ content, targetRef }) {
  const tooltipRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // 必须用useLayoutEffect - 需要在绘制前获取位置
  // 如果用useEffect，用户可能会看到tooltip在错误位置闪一下
  useLayoutEffect(() => {
    if (!tooltipRef.current || !targetRef.current) return;
    
    const targetRect = targetRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    
    let x = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
    let y = targetRect.bottom + 8;
    
    // 边界检测
    if (x < 0) x = 0;
    if (y + tooltipRect.height > window.innerHeight) {
      y = targetRect.top - tooltipRect.height - 8;
    }
    
    setPosition({ x, y });
  }, [content]);

  return (
    <div 
      ref={tooltipRef}
      style={{ left: position.x, top: position.y, position: 'fixed' }}
    >
      {content}
    </div>
  );
}
```

```jsx
// 场景2：防止闪烁的动画
function AnimatedBox({ visible }) {
  const boxRef = useRef(null);

  useLayoutEffect(() => {
    if (!boxRef.current) return;
    
    if (visible) {
      // 在绘制前设置好初始状态
      boxRef.current.style.opacity = '0';
      boxRef.current.style.transform = 'scale(0.8)';
      
      // 强制回流后触发动画
      requestAnimationFrame(() => {
        boxRef.current.style.transition = 'all 300ms';
        boxRef.current.style.opacity = '1';
        boxRef.current.style.transform = 'scale(1)';
      });
    }
  }, [visible]);

  return <div ref={boxRef}>Content</div>;
}
```

### 性能考量

使用 `useLayoutEffect` 会延迟浏览器的首次绘制（FCP）和后续更新，因为它是同步执行的。在以下情况下应考虑使用 `useEffect`：

```jsx
// 适合 useEffect —— 数据获取和一般副作用
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  
  // 数据获取不需要阻塞绘制
  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(setUser);
  }, [userId]);
  
  // 不需要在绘制前执行
  useEffect(() => {
    document.title = user ? user.name : 'Loading...';
  }, [user]);
  
  return <div>{/* 渲染内容 */}</div>;
}
```

### SSR中的useLayoutEffect警告

在服务端渲染（SSR）环境中，`useLayoutEffect` 会收到React警告，因为SSR没有浏览器DOM环境。解决方案：

```jsx
// 方案1：迁移到useEffect（如果不需要同步测量）
useEffect(() => {
  // 大部分逻辑可以在这里执行
}, [deps]);

// 方案2：检测客户端环境
const useIsomorphicLayoutEffect = 
  typeof window !== 'undefined' 
    ? useLayoutEffect 
    : useEffect;
    
// 在组件中使用
useIsomorphicLayoutEffect(() => {
  // 只在客户端执行的布局逻辑
}, [deps]);
```
