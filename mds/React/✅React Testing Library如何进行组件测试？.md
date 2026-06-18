# ✅React Testing Library如何进行组件测试？

# 典型回答

React Testing Library（RTL）是目前React社区**最推荐的组件测试库**，它的核心理念是：**测试应当模拟用户使用组件的方式，而不是测试组件的实现细节**。RTL强调从用户视角出发，关注组件的行为和输出，而不是内部状态和方法。

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

// 基本测试模板
test('按钮点击后触发onClick回调', async () => {
  const handleClick = jest.fn();
  
  render(<Button onClick={handleClick}>点击我</Button>);
  
  // 通过文本找到按钮（模拟用户视角）
  const button = screen.getByText('点击我');
  
  // 模拟用户点击
  await userEvent.click(button);
  
  // 验证回调被调用
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

**核心原则**：
1. **不要测试实现细节**：不测试state变化，不测试生命周期，不测试内部方法
2. **模拟用户行为**：通过文本、角色等用户可感知的方式查找元素
3. **测试可访问性**：优先使用getByRole等可访问性的查询方式

# 扩展知识

### 查询方法优先级

RTL提供了多种查询方法，**建议按以下优先级使用**：

```jsx
// 第一优先级：可访问性查询（所有用户都能感知）
screen.getByRole('button', { name: /提交/i });     // 按ARIA角色
screen.getByLabelText(/用户名/i);                     // 按label文本
screen.getByPlaceholderText('请输入密码');             // 按placeholder
screen.getByText('确认提交');                         // 按文本内容
screen.getByDisplayValue('张三');                     // 按表单值

// 第二优先级：语义查询
screen.getByAltText('用户头像');                     // 按alt文本
screen.getByTitle('关闭');                           // 按title属性

// 最后手段：testid（仅当以上方式都不适用时）
screen.getByTestId('submit-button');                 // 按data-testid

// 查询变体
screen.getBy...    // 精确匹配，找不到抛错
screen.queryBy...  // 找不到返回null（用于断言不存在）
screen.findBy...   // 返回Promise，用于异步元素（waitFor的替代）
screen.getAllBy... // 返回数组
```

### 按情境选择查询方式

```jsx
// 查询推荐场景
function FormTest() {
  render(<LoginForm />);
  
  // ✅ 推荐：getByRole
  const submitButton = screen.getByRole('button', { name: /登录/ });
  const usernameInput = screen.getByRole('textbox', { name: /用户名/ });
  
  // ✅ 推荐：getByLabelText（表单字段）
  const passwordInput = screen.getByLabelText('密码');
  
  // ✅ 推荐：getByText（普通文本元素）
  const title = screen.getByText('用户登录');
  
  // ⚠️ 过渡使用：getByPlaceholderText
  // placeholder在用户输入后消失，不应作为主定位
  screen.getByPlaceholderText('请输入用户名');
  
  // ❌ 避免：使用CSS选择器
  // container.querySelector('.form-input');
}
```

### 用户事件模拟：fireEvent vs userEvent

```jsx
// fireEvent —— 触发DOM事件（基础，较底层）
import { fireEvent } from '@testing-library/react';

fireEvent.click(element);
fireEvent.change(input, { target: { value: 'Hello' } });
fireEvent.keyDown(element, { key: 'Enter', code: 'Enter' });

// userEvent —— 模拟真实用户交互（推荐）
import userEvent from '@testing-library/user-event';

const user = userEvent.setup();
await user.click(element);           // 真实点击（包含hover、focus等）
await user.type(input, 'Hello');     // 逐字输入（触发change、keyDown、keyUp等）
await user.keyboard('{Enter}');      // 键盘输入
await user.tab();                    // Tab切换焦点
await user.selectOptions(select, 'option1'); // 选择选项
await user.clear(input);             // 清空输入

// 区别总结
// fireEvent 直接触发指定事件，不模拟额外行为
// userEvent 模拟完整用户交互，包含所有中间事件
// ✅ 推荐使用 userEvent，测试更接近真实用户操作
```

### 异步测试

```jsx
// 场景：数据加载完成后显示内容
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(setUser);
  }, [userId]);
  
  if (!user) return <div>加载中...</div>;
  return <div>{user.name}</div>;
}

// 测试
test('用户数据加载完成后显示用户名', async () => {
  // 模拟fetch
  global.fetch = jest.fn().mockResolvedValue({
    json: async () => ({ name: '张三' }),
  });
  
  render(<UserProfile userId={1} />);
  
  // 初始显示加载状态
  expect(screen.getByText('加载中...')).toBeInTheDocument();
  
  // 等待异步数据加载完成（findBy返回Promise）
  const userName = await screen.findByText('张三');
  expect(userName).toBeInTheDocument();
});
```

### 测试自定义Hook

```jsx
// 使用 @testing-library/react-hooks 测试自定义Hook
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

test('useCounter 基本功能', () => {
  const { result } = renderHook(() => useCounter(0));
  
  expect(result.current.count).toBe(0);
  
  act(() => {
    result.current.increment();
  });
  
  expect(result.current.count).toBe(1);
  
  act(() => {
    result.current.decrement();
  });
  
  expect(result.current.count).toBe(0);
});

// React 18+ 可以直接在组件中测试Hook
function TestComponent({ initialValue }) {
  const { count, increment } = useCounter(initialValue);
  return (
    <div>
      <span data-testid="count">{count}</span>
      <button onClick={increment}>+</button>
    </div>
  );
}

test('useCounter 在组件中的行为', async () => {
  render(<TestComponent initialValue={5} />);
  
  expect(screen.getByTestId('count')).toHaveTextContent('5');
  
  await userEvent.click(screen.getByText('+'));
  
  expect(screen.getByTestId('count')).toHaveTextContent('6');
});
```

### 测试用户交互完整流程

```jsx
// 完整场景：表单提交
function LoginForm({ onLogin }) {
  const [error, setError] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      await onLogin(formData.get('username'), formData.get('password'));
    } catch (err) {
      setError(err.message);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="username">用户名</label>
      <input id="username" name="username" type="text" required />
      
      <label htmlFor="password">密码</label>
      <input id="password" name="password" type="password" required />
      
      {error && <div role="alert">{error}</div>}
      
      <button type="submit">登录</button>
    </form>
  );
}

// 测试
test('表单提交成功', async () => {
  const mockLogin = jest.fn().mockResolvedValue({ token: 'abc' });
  const user = userEvent.setup();
  
  render(<LoginForm onLogin={mockLogin} />);
  
  // 填写表单
  await user.type(screen.getByLabelText('用户名'), 'admin');
  await user.type(screen.getByLabelText('密码'), '123456');
  
  // 提交
  await user.click(screen.getByRole('button', { name: '登录' }));
  
  expect(mockLogin).toHaveBeenCalledWith('admin', '123456');
});

test('表单提交失败显示错误', async () => {
  const mockLogin = jest.fn().mockRejectedValue(new Error('密码错误'));
  const user = userEvent.setup();
  
  render(<LoginForm onLogin={mockLogin} />);
  
  await user.type(screen.getByLabelText('用户名'), 'admin');
  await user.type(screen.getByLabelText('密码'), 'wrong');
  await user.click(screen.getByRole('button', { name: '登录' }));
  
  expect(await screen.findByRole('alert')).toHaveTextContent('密码错误');
});
```

### Mock外部依赖

```jsx
// Mock API请求
jest.mock('../../api/user', () => ({
  fetchUser: jest.fn(() => Promise.resolve({ name: 'Mock User' })),
}));

// Mock React Router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useParams: () => ({ id: '123' }),
}));

// Mock第三方组件
jest.mock('@/components/ui/Chart', () => ({
  Chart: () => <div data-testid="mock-chart">Chart</div>,
}));

// Mock window对象
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    })),
  });
});
```

### 常用的断言库

```jsx
// @testing-library/jest-dom 提供了额外的DOM断言

// 存在性
expect(element).toBeInTheDocument();
expect(element).not.toBeInTheDocument();

// 可见性
expect(element).toBeVisible();
expect(element).not.toBeVisible();

// 值与内容
expect(input).toHaveValue('Hello');
expect(input).toHaveDisplayValue('Hello');

// 属性
expect(button).toBeDisabled();
expect(button).toBeEnabled();
expect(button).toHaveAttribute('type', 'submit');
expect(element).toHaveClass('active');

// 表单状态
expect(checkbox).toBeChecked();
expect(select).toHaveFocus();

// 文本
expect(element).toHaveTextContent('Hello');

// 样式
expect(element).toHaveStyle({ color: 'red' });

// 长度
expect(container).toContainElement(childElement);
expect(screen.getAllByRole('listitem')).toHaveLength(3);
```
