# ✅React.memo和React.PureComponent的区别

# 典型回答

`React.memo` 和 `React.PureComponent` 都是React提供的**性能优化机制**，它们通过对props进行**浅比较**来避免不必要的重新渲染。两者的核心区别在于适用对象和API形式：

- **`React.memo`**：用于**函数组件**，是一个**高阶组件**，接收一个组件并返回一个记忆化版本
- **`React.PureComponent`**：用于**类组件**，是一个基类，继承它的类自动具备props浅比较能力

```jsx
// React.memo —— 用于函数组件
const MemoizedComponent = React.memo(function MyComponent(props) {
  return <div>{props.name}</div>;
});

// 等价于
const MemoizedComponent = React.memo((props) => {
  return <div>{props.name}</div>;
});

// React.PureComponent —— 用于类组件
class MyPureComponent extends React.PureComponent {
  render() {
    return <div>{this.props.name}</div>;
  }
}
```

**共同点**：都是通过**浅比较（shallow comparison）**来判断props是否变化：
- 对于原始类型（string、number、boolean）：比较值是否相等
- 对于引用类型（object、array、function）：比较引用地址是否相同

# 扩展知识

### 浅比较的实现

```jsx
// React内部浅比较的简化实现
function shallowEqual(objA, objB) {
  if (Object.is(objA, objB)) return true;  // 相同引用
  
  if (typeof objA !== 'object' || objA === null ||
      typeof objB !== 'object' || objB === null) {
    return false;
  }
  
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  
  if (keysA.length !== keysB.length) return false;
  
  for (let i = 0; i < keysA.length; i++) {
    if (!Object.prototype.hasOwnProperty.call(objB, keysA[i]) ||
        !Object.is(objA[keysA[i]], objB[keysA[i]])) {
      return false;  // 只比较第一层
    }
  }
  
  return true;
}
```

### React.memo 的高级用法

```jsx
// 自定义比较函数 —— 不满足于浅比较时
const MemoizedComponent = React.memo(
  (props) => <div>{props.data.name}</div>,
  (prevProps, nextProps) => {
    // 返回true表示props相等（不重新渲染）
    // 返回false表示props变化（重新渲染）
    return prevProps.data.id === nextProps.data.id;
  }
);

// 注意：自定义比较函数是反向逻辑（与shouldComponentUpdate相反）
// shouldComponentUpdate返回true表示重新渲染
// React.memo第二个参数返回true表示不重新渲染
```

### React.PureComponent 的注意事项

```jsx
// 类组件的三种优化方式对比

// 方式1：React.Component + shouldComponentUpdate
class ManualOptimized extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    // 完全控制渲染条件
    return nextProps.user.id !== this.props.user.id;
  }
  render() {
    return <div>{this.props.user.name}</div>;
  }
}

// 方式2：React.PureComponent —— 自动浅比较
class AutoOptimized extends React.PureComponent {
  render() {
    return <div>{this.props.user.name}</div>;
  }
  // 等同于自动实现了浅比较的shouldComponentUpdate
}

// 方式3：React.Component —— 不优化
class NotOptimized extends React.Component {
  render() {
    return <div>{this.props.user.name}</div>;
  }
  // 每次父组件渲染都重新渲染
}
```

### 常见陷阱：浅比较的局限性

```jsx
function Parent() {
  const [count, setCount] = useState(0);
  
  const data = { value: 'test' };  // 每次渲染都创建新对象
  
  return (
    <div>
      <MemoizedChild data={data} />  {/* React.memo失效！ */}
      <PureChild data={data} />      {/* PureComponent失效！ */}
      {/* 原因：data每次都是新引用，浅比较认为props变了 */}
    </div>
  );
}

// 修复方案
function Parent() {
  const [count, setCount] = useState(0);
  
  // 使用useMemo稳定引用
  const data = useMemo(() => ({ value: 'test' }), []);
  
  return (
    <div>
      <MemoizedChild data={data} />  {/* 现在能正确memo了 */}
    </div>
  );
}
```

### 函数作为props的陷阱

```jsx
function Parent() {
  const [count, setCount] = useState(0);
  
  // ❌ 每次渲染都创建新函数
  const handleClick = () => console.log('clicked');
  
  return <MemoButton onClick={handleClick} />;  // React.memo失效
}

// ✅ 使用useCallback
function Parent() {
  const [count, setCount] = useState(0);
  
  const handleClick = useCallback(
    () => console.log('clicked'),
    []  // 依赖不变，引用稳定
  );
  
  return <MemoButton onClick={handleClick} />;  // memo生效
}
```

### 完全对比表

| 维度 | React.memo | React.PureComponent |
|------|-----------|-------------------|
| 适用组件 | 函数组件 | 类组件 |
| 本质 | 高阶组件 | 基类 |
| props比较 | 默认浅比较，可自定义 | 自动浅比较 |
| state比较 | 不存在（函数组件无此概念） | 也进行浅比较 |
| 自定义比较 | 第二个参数（areEqual） | shouldComponentUpdate |
| children处理 | 需要额外注意 | 需要额外注意 |
| 嵌套对象 | 只比较引用 | 只比较引用 |

### children对memo的影响

```jsx
// 一个容易被忽视的问题：children导致memo失效
function Parent() {
  const [count, setCount] = useState(0);
  
  return (
    <MemoizedCard>
      {/* children是JSX对象，每次渲染新创建 */}
      <p>Content count: {count}</p>
    </MemoizedCard>
  );
  // 即使MemoizedCard的props没变，但children每次都不同
  // 导致MemoizedCard仍然重新渲染
}

// 方案1：将children提取为稳定引用
function Parent() {
  const [count, setCount] = useState(0);
  
  const content = useMemo(() => (
    <p>Static content</p>  // 不依赖count的内容
  ), []);
  
  return <MemoizedCard>{content}</MemoizedCard>;
}

// 方案2：使用React.memo的自定义比较（不比较children）
```

### 性能开销考量

使用 `React.memo` 和 `React.PureComponent` 本身也有性能开销（每次渲染都要进行浅比较）：

```jsx
// 不需要memo的场景
function SimpleButton({ label, onClick }) {
  return <button onClick={onClick}>{label}</button>;
}
// 简单的按钮，渲染成本低，即使不memo也很快
// 加上memo后，浅比较的开销可能超过渲染本身

// 需要memo的场景
function ExpensiveChart({ data, width, height, options }) {
  // 大量DOM节点或复杂计算
  return <div>{/* 复杂渲染 */}</div>;
}
// 渲染成本高，memo的浅比较开销远小于渲染开销
```

### 使用建议

```bash
✅ 推荐使用React.memo的场景：
  - 组件渲染开销大（大量子组件、复杂DOM）
  - 组件经常被重新渲染但props很少变化
  - 作为列表项（ListItem）的子组件
  - 配合useCallback/useMemo使用

❌ 不推荐使用React.memo的场景：
  - 组件渲染很简单（纯文本、原生元素）
  - props每次都变化（没有稳定引用的可能）
  - 组件本身就是简单叶子节点
  - 浅比较的开销大于渲染开销

⚠️ 使用PureComponent的注意点：
  - 避免在render中创建新对象/数组/函数
  - 不要在props中传递内联对象
  - 子组件props变化不频繁时才使用
```
