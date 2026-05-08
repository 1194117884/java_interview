# ✅Portals的作用和使用场景

# 典型回答

React Portal（传送门）提供了一种将子节点**渲染到父组件DOM树之外**的能力。通过 `ReactDOM.createPortal`，你可以让子组件突破父组件的DOM层级限制，渲染到DOM树的任意位置，同时**保持React组件树中的父子关系和事件冒泡行为**。

```jsx
import { createPortal } from 'react-dom';

function PortalExample({ children }) {
  // 将children渲染到document.body中
  return createPortal(
    children,
    document.body
  );
}
```

**核心价值**：Portal解决了CSS层叠上下文、overflow:hidden、z-index等样式问题导致的UI困境。最典型的应用是模态框——模态框需要显示在页面最顶层，不受父组件样式影响，但在逻辑上仍属于触发它的组件。

```jsx
function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  
  // 渲染到body下，避免父组件的overflow:hidden裁剪
  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content">
        <button onClick={onClose}>X</button>
        {children}
      </div>
    </div>,
    document.body
  );
}
```

# 扩展知识

### Portal的语法和解构

```jsx
// createPortal 签名
ReactDOM.createPortal(
  reactNode,      // 要渲染的React元素（JSX）
  domNode,        // 目标DOM节点（必须是已存在的DOM元素）
  key?            // 可选的key
);

// 基本使用
const portal = createPortal(
  <div>Portal Content</div>,
  document.getElementById('portal-root')
);
```

### Portal的事件冒泡

Portal的一个重要特性是：**事件冒泡遵循React组件树，而不是DOM树**：

```jsx
function App() {
  const [clicks, setClicks] = useState(0);
  
  const handleClick = () => {
    setClicks(c => c + 1);
    console.log('Portal触发的冒泡到达了父组件');
  };
  
  return (
    <div onClick={handleClick}>
      <PortalButton />
      <p>点击次数: {clicks}</p>
    </div>
  );
}

function PortalButton() {
  return createPortal(
    <button>
      这个按钮渲染在body下，但点击会冒泡到App组件的onClick
    </button>,
    document.body
  );
}
// 点击按钮 → 事件冒泡遵循React树 → 触发App的handleClick
// 尽管DOM结构上button不在App的div内
```

### Portal的典型使用场景

```jsx
// 场景1：模态框（Modal）
function Modal({ isOpen, title, children, onClose }) {
  // 创建portal DOM节点
  const portalRef = useRef(document.createElement('div'));
  
  useEffect(() => {
    const portal = portalRef.current;
    document.body.appendChild(portal);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.removeChild(portal);
      document.body.style.overflow = '';
    };
  }, []);
  
  if (!isOpen) return null;
  
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>,
    portalRef.current
  );
}
```

```jsx
// 场景2：工具提示（Tooltip）
function Tooltip({ text, targetRef }) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef(null);
  
  useLayoutEffect(() => {
    if (!targetRef.current) return;
    const rect = targetRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 8,
      left: rect.left + rect.width / 2,
    });
  }, [targetRef]);
  
  // 渲染到body，避免父组件的overflow裁剪
  return createPortal(
    <div
      ref={tooltipRef}
      className="tooltip"
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
      }}
    >
      {text}
    </div>,
    document.body
  );
}
```

```jsx
// 场景3：下拉菜单和弹出层
function DropdownMenu({ trigger, children, isOpen, onClose }) {
  // 需要计算触发元素的位置
  // Portal确保菜单不会被父组件的overflow:hidden裁剪
  // 也不会受父组件的z-index影响
  
  if (!isOpen) return null;
  
  return createPortal(
    <div className="dropdown-backdrop" onClick={onClose}>
      <div className="dropdown-menu" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
}
```

```jsx
// 场景4：全局通知/Toast
const ToastContext = React.createContext();

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);
  
  return (
    <ToastContext.Provider value={addToast}>
      {children}
      {/* 渲染到body的Toast容器 */}
      {createPortal(
        <div className="toast-container">
          {toasts.map(toast => (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              {toast.message}
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}
```

### Portal vs 普通渲染位置对比

| 特性 | 普通渲染（在组件树中） | Portal（传送门） |
|------|---------------------|-----------------|
| DOM位置 | 在父组件DOM内部 | 在指定的目标DOM节点 |
| 样式隔离 | 受父组件CSS影响 | 不受父组件样式束缚 |
| overflow裁剪 | 受父组件影响 | 不受影响 |
| z-index上下文 | 受父组件层叠上下文影响 | 独立 |
| 事件冒泡 | 遵循DOM树 | 遵循React树 |
| Context访问 | 可以访问 | 可以访问（仍是React子节点） |
| 生命周期 | 与父组件关联 | 由触发条件控制 |

### Portal的样式控制

```jsx
// 为Portal的DOM节点设置样式隔离
function Portal({ children }) {
  const portalRoot = useMemo(() => {
    const div = document.createElement('div');
    div.className = 'portal-root';
    return div;
  }, []);
  
  useEffect(() => {
    // 确保portal在z-index最高层
    document.body.appendChild(portalRoot);
    return () => document.body.removeChild(portalRoot);
  }, [portalRoot]);
  
  // 可以在这里设置全局portal样式
  useLayoutEffect(() => {
    portalRoot.style.position = 'relative';
    portalRoot.style.zIndex = '9999';
  }, [portalRoot]);
  
  return createPortal(children, portalRoot);
}
```

### 服务端渲染中的Portal

SSR中createPortal不可用，需要做兼容处理：

```jsx
function SafePortal({ children }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // SSR时不渲染Portal内容
  if (!mounted || typeof document === 'undefined') {
    return null;
  }
  
  return createPortal(children, document.body);
}
```

### Portal的accessibility考虑

```jsx
function AccessibleModal({ isOpen, onClose, title, children }) {
  const id = useId();
  
  useEffect(() => {
    if (isOpen) {
      // 焦点陷阱 - 将焦点限制在模态框内
      const focusable = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable?.length) focusable[0].focus();
    }
  }, [isOpen]);
  
  // ESC键关闭
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={id}
      className="modal-backdrop"
    >
      <div className="modal-content" ref={modalRef}>
        <h2 id={id}>{title}</h2>
        {children}
        <button onClick={onClose} aria-label="关闭">X</button>
      </div>
    </div>,
    document.body
  );
}
```
