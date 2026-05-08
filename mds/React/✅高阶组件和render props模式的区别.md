# ✅高阶组件和render props模式的区别

# 典型回答

高阶组件（HOC）和Render Props都是React中用于**复用组件逻辑**的经典模式，它们都解决组件之间共享代码的问题，但实现方式完全不同。

**高阶组件（Higher-Order Component, HOC）**：是一个函数，接收一个组件作为参数，返回一个增强后的新组件。本质上是一种**组件包装模式**。

```jsx
// HOC模式 —— 函数接收组件，返回新组件
function withLogging(WrappedComponent) {
  return class extends React.Component {
    componentDidMount() {
      console.log(`Component ${WrappedComponent.name} mounted`);
    }
    render() {
      return <WrappedComponent {...this.props} />;
    }
  };
}

const EnhancedButton = withLogging(MyButton);
```

**Render Props模式**：通过组件的props（通常是名为 `render` 或 `children` 的prop）来共享代码。父组件控制"渲染什么"，子组件控制"如何渲染"。

```jsx
// Render Props模式 —— 通过prop共享代码
class MouseTracker extends React.Component {
  state = { x: 0, y: 0 };
  
  handleMouseMove = (e) => {
    this.setState({ x: e.clientX, y: e.clientY });
  };
  
  render() {
    return (
      <div onMouseMove={this.handleMouseMove}>
        {this.props.render(this.state)}
      </div>
    );
  }
}

// 使用时
<MouseTracker render={({ x, y }) => (
  <h1>鼠标位置: {x}, {y}</h1>
)} />
```

**核心区别**：
- HOC是**组合模式**，在渲染前完成增强；Render Props是**委托模式**，在渲染时决定内容
- HOC可能产生命名冲突（props合并时）；Render Props更灵活但可能导致嵌套过深
- HOC通过静态组合扩展功能；Render Props通过动态渲染控制UI

# 扩展知识

### HOC的详细实现

```jsx
// HOC的常见用途
// 1. 权限控制HOC
function withAuth(WrappedComponent) {
  return function AuthenticatedComponent(props) {
    const { user, ...restProps } = props;
    
    if (!user) {
      return <div>请先登录</div>;
    }
    
    return <WrappedComponent user={user} {...restProps} />;
  };
}

// 2. 数据加载HOC
function withData(WrappedComponent, fetchData) {
  return class extends React.Component {
    state = { data: null, loading: true };
    
    async componentDidMount() {
      const data = await fetchData(this.props);
      this.setState({ data, loading: false });
    }
    
    render() {
      const { data, loading } = this.state;
      return (
        <WrappedComponent
          {...this.props}
          data={data}
          loading={loading}
        />
      );
    }
  };
}

// 3. 多个HOC组合
const EnhancedComponent = withAuth(withData(MyComponent, fetchData));
// 等价于
// const EnhancedComponent = compose(withAuth, withData)(MyComponent);
// compose(f, g)(x) = f(g(x))
```

### Render Props的详细实现

```jsx
// Render Props的多种写法
// 写法1：通过render prop
class DataProvider extends React.Component {
  state = { data: null };
  
  render() {
    return this.props.render(this.state);
  }
}

<DataProvider render={({ data }) => <div>{data}</div>} />

// 写法2：通过children prop（更常见）
class DataProvider extends React.Component {
  state = { data: null };
  
  render() {
    return this.props.children(this.state);
  }
}

<DataProvider>
  {({ data }) => <div>{data}</div>}
</DataProvider>
```

```jsx
// Render Props的实际应用：表单字段
class FormField extends React.Component {
  state = { value: '', touched: false, error: null };
  
  handleChange = (value) => {
    const { validate } = this.props;
    const error = validate ? validate(value) : null;
    this.setState({ value, error, touched: true });
  };
  
  render() {
    return this.props.children({
      ...this.state,
      onChange: this.handleChange,
      isValid: !this.state.error,
    });
  }
}

// 使用
<FormField validate={(v) => v.length < 3 ? '太短了' : null}>
  {({ value, error, onChange }) => (
    <div>
      <input value={value} onChange={e => onChange(e.target.value)} />
      {error && <span style={{ color: 'red' }}>{error}</span>}
    </div>
  )}
</FormField>
```

### 完整对比表

| 维度 | HOC | Render Props |
|------|-----|-------------|
| 本质 | 函数 → 增强组件 | prop → 动态渲染 |
| 组合方式 | 静态包装（组件层级） | 动态委托（运行时） |
| 命名冲突 | 有风险（props合并） | 无（作用域隔离） |
| 代码可读性 | 中（需要追踪包装链） | 高（直接看到渲染内容） |
| 嵌套问题 | 多层HOC嵌套难以调试 | Render Props嵌套（回调地狱） |
| 静态类型 | 较复杂（类型推断困难） | 较简单（泛型支持好） |
| 性能 | 创建额外组件实例 | 无额外组件 |
| 灵活性 | 中（固定增强逻辑） | 高（调用方控制渲染） |
| Hooks替代 | 大部分可被自定义Hook替代 | 可被自定义Hook替代 |

### HOC的陷阱和注意事项

```jsx
// 陷阱1：ref不会传递到被包装组件
function withLogging(WrappedComponent) {
  return class Enhanced extends React.Component {
    render() {
      // ref指向Enhanced组件，不是WrappedComponent
      return <WrappedComponent {...this.props} />;
    }
  };
}
// 解决：使用React.forwardRef
function withLogging(WrappedComponent) {
  class Enhanced extends React.Component {
    render() {
      const { forwardedRef, ...rest } = this.props;
      return <WrappedComponent ref={forwardedRef} {...rest} />;
    }
  }
  return React.forwardRef((props, ref) => {
    return <Enhanced {...props} forwardedRef={ref} />;
  });
}

// 陷阱2：静态方法丢失
MyComponent.staticMethod = () => {};
const EnhancedComponent = withLogging(MyComponent);
EnhancedComponent.staticMethod;  // undefined
// 解决：使用hoist-non-react-statics

// 陷阱3：displayName问题（调试困难）
// 解决：手动设置displayName
```

### Hooks如何替代这两种模式

React Hooks的出现让这两种模式的需求大幅降低：

```jsx
// HOC模式：withData → 自定义Hook useData
function useData(fetchData) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchData().then(result => {
      setData(result);
      setLoading(false);
    });
  }, []);
  
  return { data, loading };
}

function MyComponent() {
  const { data, loading } = useData(fetchData);
  if (loading) return <div>Loading...</div>;
  return <div>{data}</div>;
}

// Render Props模式：MouseTracker → 自定义Hook useMousePosition
function useMousePosition() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  return position;
}

function MyComponent() {
  const { x, y } = useMousePosition();
  return <h1>鼠标位置: {x}, {y}</h1>;
}
```

### 当前的最佳实践

```bash
2024年React模式建议：

✅ 优先使用自定义Hook
  - 最简洁、最灵活
  - 无组件层级增加
  - 类型推断最友好

✅ 必要时使用Render Props（custom hook无法覆盖的场景）
  - 需要父组件控制渲染内容的动态性很强时
  - 与第三方库的集成需求

⚠️ 谨慎使用HOC
  - 旧项目迁移中可能存在
  - 某些库（connect from react-redux）仍在使用
  - 新代码建议使用Hook替代

❌ 避免的新场景
  - 避免创造新的HOC
  - 避免Render Props嵌套过深
```

### 实际应用场景

```jsx
// HOC的现代应用：withRouter（react-router v5）
import { withRouter } from 'react-router-dom';

class MyComponent extends React.Component {
  render() {
    // 通过HOC注入route相关props
    const { match, location, history } = this.props;
  }
}
export default withRouter(MyComponent);

// render props的现代应用：Formik的Field
import { Field } from 'formik';

<Field name="email">
  {({ field, meta }) => (
    <div>
      <input {...field} />
      {meta.touched && meta.error && <div>{meta.error}</div>}
    </div>
  )}
</Field>

// Hook的现代应用：几乎所有场景
const { match, location } = useRouteMatch();
const { values, errors, handleSubmit } = useFormik({ initialValues: {} });
```
