# ✅React合成事件机制和工作原理

# 典型回答

React合成事件（SyntheticEvent）是React对原生DOM事件的一层**跨浏览器封装**，它提供了统一的API、自动处理浏览器兼容性，并实现了**事件委托**来优化性能。

**合成事件的核心机制**：
1. **事件委托**：React不会将事件处理器直接绑定到实际DOM节点上，而是在根容器（root）上统一监听
2. **事件池**：React 17之前使用事件池来复用事件对象以节省内存
3. **跨浏览器兼容**：封装了不同浏览器的事件API差异

```jsx
function Button() {
  // React的onClick不是原生click事件
  const handleClick = (e) => {
    // e是SyntheticEvent，不是原生MouseEvent
    console.log(e.type);            // "click"
    console.log(e.nativeEvent);     // 原生MouseEvent
    console.log(e.currentTarget);   // React根容器（不是button元素）
  };
  
  return <button onClick={handleClick}>Click</button>;
}
```

**React 17的变化**：事件委托从 `document` 改为React根容器（root），这让多个React应用共存或与非React代码集成都更安全。

# 扩展知识

### 事件委托的层级变化

```bash
React 16及之前：
  document.addEventListener('click', handleClick)
  document.addEventListener('change', handleChange)
  // 所有事件都在document上监听

React 17+：
  root.addEventListener('click', handleClick)  // root = React根DOM节点
  root.addEventListener('change', handleChange)
  // 事件绑定在React应用的根容器上
```

### 合成事件的创建和复用

```jsx
// React 17之前：事件池机制
function EventPoolExample() {
  const handleClick = (e) => {
    // e是SyntheticEvent，被事件池管理
    setTimeout(() => {
      console.log(e.type);  // React 17之前：e已被回收，抛出警告
      // 因为事件对象被放回池中重用
    }, 0);
  };
  
  // React 17之前需要这样
  const handleClickCorrect = (e) => {
    e.persist();  // 从事件池中取出，持久化事件对象
    setTimeout(() => {
      console.log(e.type);  // 现在可以访问了
    }, 0);
  };
  
  return <button onClick={handleClick}>Click</button>;
}

// React 17+：移除了事件池
function NoEventPool() {
  const handleClick = (e) => {
    // React 17+：不再使用事件池
    // e在任何时候都可以访问
    setTimeout(() => {
      console.log(e.type);  // 正常访问，无需e.persist()
    }, 1000);
  };
  
  return <button onClick={handleClick}>OK</button>;
}
```

### 合成事件与原生事件对比

| 特性 | 合成事件（SyntheticEvent） | 原生事件（NativeEvent） |
|------|--------------------------|----------------------|
| 绑定方式 | React的onXXX属性 | addEventListener |
| 目标绑定 | 根容器（事件委托） | 具体DOM元素 |
| 浏览器兼容 | 统一API | 需要手动处理兼容 |
| 默认行为阻止 | e.preventDefault() | 兼容版本 |
| 事件传播阻止 | e.stopPropagation() | 标准方式 |
| 事件对象复用 | React 17前有事件池 | 无池化 |
| 可访问性 | 异步访问需注意 | 始终可访问 |

### 阻止事件传播的交互影响

```jsx
// 合成事件和原生事件的传播互操作
function MixedEvents() {
  const rootRef = useRef(null);
  
  // 原生事件绑定（直接绑定在根节点）
  useEffect(() => {
    const root = rootRef.current;
    const handleNativeClick = () => {
      console.log('2. 原生事件捕获阶段');
    };
    root.addEventListener('click', handleNativeClick, true);  // 捕获阶段
    return () => root.removeEventListener('click', handleNativeClick);
  }, []);
  
  // React合成事件
  const handleReactClick = (e) => {
    console.log('1. React事件（委托）');
    // e.stopPropagation() 阻止合成事件冒泡
    // 但不阻止根容器上其他原生事件监听器
  };
  
  return (
    <div ref={rootRef}>
      <button onClick={handleReactClick}>Test</button>
    </div>
  );
}
// 输出顺序：
// 合成事件处理器 → 绑在root上的原生事件捕获
// 因为合成事件通过事件委托触发，而原生事件直接绑定
```

### React所有支持的事件类型

```jsx
// 合成事件按类型分组

// 剪贴板事件
onCopy, onCut, onPaste

// 键盘事件
onKeyDown, onKeyUp, onKeyPress

// 焦点事件
onFocus, onBlur

// 表单事件
onChange, onInput, onInvalid, onSubmit, onReset

// 鼠标事件
onClick, onDoubleClick, onMouseDown, onMouseUp
onMouseEnter, onMouseLeave, onMouseMove, onMouseOver, onMouseOut

// 指针事件（统一鼠标/触控/笔）
onPointerDown, onPointerUp, onPointerMove

// 触摸事件
onTouchStart, onTouchEnd, onTouchMove, onTouchCancel

// UI事件
onScroll, onResize

// 滚动事件
onWheel

// 媒体事件
onPlay, onPause, onEnded, onError, onLoadedData

// 动画事件
onAnimationStart, onAnimationEnd, onAnimationIteration

// 过渡事件
onTransitionEnd, onTransitionCancel
```

### onClick 的事件流验证

```jsx
function EventFlowDemo() {
  const handleOuterCapture = () => console.log('1. 外部捕获阶段');
  const handleInnerCapture = () => console.log('2. 内部捕获阶段');
  const handleClick = () => console.log('3. 目标阶段（冒泡）');
  const handleOuterBubble = () => console.log('4. 外部冒泡阶段');
  
  useEffect(() => {
    document.addEventListener('click', () => console.log('5. document捕获'), true);
    document.addEventListener('click', () => console.log('6. document冒泡'));
  }, []);
  
  return (
    // 注意：合成事件不支持捕获阶段绑定
    // 可以使用 onClickCapture
    <div onClickCapture={handleOuterCapture} onClick={handleOuterBubble}>
      <button onClickCapture={handleInnerCapture} onClick={handleClick}>
        点击
      </button>
    </div>
  );
}

// 点击按钮时的输出：
// 1. 外部捕获阶段（合成事件）
// 2. 内部捕获阶段（合成事件）
// 3. 目标阶段（合成事件）
// 4. 外部冒泡阶段（合成事件）
// 5. document捕获（原生事件）
// 6. document冒泡（原生事件）
```

### 合成事件的实现原理

```jsx
// React合成事件的简化实现
class SyntheticEvent {
  constructor(type, nativeEvent) {
    this.type = type;
    this.nativeEvent = nativeEvent;
    this.target = nativeEvent.target;
    this.currentTarget = nativeEvent.currentTarget;
    this._isPropagationStopped = false;
  }
  
  preventDefault() {
    this.nativeEvent.preventDefault();
    this.defaultPrevented = true;
  }
  
  stopPropagation() {
    this.nativeEvent.stopPropagation();
    this._isPropagationStopped = true;
  }
}

// 事件监听器的注册（简化）
function listenToEvent(eventType, rootContainerElement) {
  rootContainerElement.addEventListener(
    eventType,
    (nativeEvent) => {
      // 创建合成事件
      const syntheticEvent = new SyntheticEvent(eventType, nativeEvent);
      
      // 从原生事件target开始，向上遍历触发React事件处理器
      let fiberNode = findFiberForDOMNode(nativeEvent.target);
      while (fiberNode && !syntheticEvent._isPropagationStopped) {
        const handler = fiberNode.memoizedProps[`on${eventType}`];
        if (handler) {
          handler(syntheticEvent);
        }
        fiberNode = fiberNode.return;  // 向上遍历Fiber树
      }
    },
    false  // 冒泡阶段
  );
}
```

### onChange 的特殊处理

React的 `onChange` 与原生 `change` 事件不同：

```jsx
// 原生change：在失焦且值发生变化时触发
// React onChange：在每次输入变化时触发（相当于原生input事件）

function InputExample() {
  // React onChange ≈ 原生input事件
  // 每次键盘输入都会触发
  return <input onChange={(e) => console.log(e.target.value)} />;
  
  // 原生change事件需要手动绑定input事件才能实时获取
  // <input onInput={(e) => console.log(e.target.value)} />
}

// React onChange在表单元素上的行为
// <input>       → 每次值变化
// <textarea>    → 每次值变化
// <select>      → 选项变化时
// <input type="checkbox">  → 选中状态变化时
// <input type="radio">     → 选中状态变化时
```
