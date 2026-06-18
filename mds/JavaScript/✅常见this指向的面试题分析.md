# ✅常见this指向的面试题分析

# 典型回答

this指向是JavaScript面试中的高频考点，主要考察对**绑定规则**、**优先级**和**箭头函数**的理解。以下是最常见的this面试题类型。

**核心判断流程：**
1. 函数是箭头函数？ → this继承外层作用域
2. 是否通过new调用？ → this指向新创建的对象
3. 是否通过call/apply/bind调用？ → this指向指定的对象
4. 是否作为对象方法调用？ → this指向调用该方法的对象
5. 默认规则：严格模式→undefined，非严格模式→全局对象

# 扩展知识

## 基础题

```javascript
// 题1：全局上下文中的this
console.log(this); // 浏览器: window, Node.js: global

// 题2：普通函数调用
function show() {
  console.log(this);
}
show(); // 非严格: window, 严格: undefined

// 题3：对象方法调用
const obj = {
  name: 'obj',
  show() {
    console.log(this.name);
  }
};
obj.show(); // 'obj'

// 题4：方法赋值后调用
const ref = obj.show;
ref(); // undefined（非严格: window.name，如果全局有name的话）
```

## 经典链式调用题

```javascript
// 题5：对象链中的this
const obj1 = {
  name: 'obj1',
  obj2: {
    name: 'obj2',
    obj3: {
      name: 'obj3',
      show() {
        console.log(this.name);
      }
    }
  }
};

obj1.obj2.obj3.show(); // 'obj3' — this指向最后一层调用对象

// 题6：链式调用中的方法提取
const test = obj1.obj2.obj3.show;
test(); // undefined — 默认绑定
```

## setTimeout相关

```javascript
// 题7：定时器中的this
const obj7 = {
  name: 'obj7',
  delayed() {
    setTimeout(function() {
      console.log(this.name); // undefined — 回调函数独立调用
    }, 100);
  }
};
obj7.delayed();

// 题8：定时器中的this修正（传统方式）
const obj8 = {
  name: 'obj8',
  delayed() {
    const self = this;
    setTimeout(function() {
      console.log(self.name); // 'obj8' — 闭包
    }, 100);
  }
};
obj8.delayed();

// 题9：定时器中的this修正（箭头函数）
const obj9 = {
  name: 'obj9',
  delayed() {
    setTimeout(() => {
      console.log(this.name); // 'obj9' — 箭头函数继承delayed的this
    }, 100);
  }
};
obj9.delayed();
```

## 综合题

```javascript
// 题10：综合this判断
var name = 'window';

const person = {
  name: 'person',
  show: function() {
    console.log('1:', this.name);

    (function() {
      console.log('2:', this.name);
    })();

    return function() {
      console.log('3:', this.name);
    };
  }
};

const fn = person.show();
fn();

// 输出：
// 1: person — 隐式绑定
// 2: window — IIFE独立调用（默认绑定）
// 3: window — 返回的函数独立调用（默认绑定）

// 题11：对象中的箭头函数
const obj11 = {
  name: 'obj11',
  arrow: () => {
    console.log(this.name);
  }
};
obj11.arrow(); // 'window' — 箭头函数this由定义时的作用域决定

// 题12：箭头函数在对象方法中
const obj12 = {
  name: 'obj12',
  method() {
    return () => {
      console.log(this.name);
    };
  }
};
const arrowFn = obj12.method();
arrowFn(); // 'obj12' — 箭头函数继承method的this
```

## 构造函数与this

```javascript
// 题13：new绑定
function Foo(name) {
  this.name = name;
  this.show = function() {
    console.log(this.name);
  };
}

const foo = new Foo('foo');
foo.show(); // 'foo'

// 题14：new绑定中返回对象
function Bar(name) {
  this.name = name;
  return { custom: 'object' };
}
const bar = new Bar('bar');
console.log(bar.name); // undefined — 构造函数返回了对象
console.log(bar.custom); // 'object'

// 题15：构造函数中方法提取
const extracted = foo.show;
extracted(); // undefined（非严格: window.name）
```

## 事件处理中的this

```javascript
// 题16：DOM事件中的this
// button.addEventListener('click', function() {
//   console.log(this); // 触发事件的DOM元素
// });

// 题17：箭头函数在事件中的问题
// button.addEventListener('click', () => {
//   console.log(this); // window — 箭头函数没有自己的this
// });

// 题18：React类组件中的this
class MyComponent {
  constructor() {
    this.state = { count: 0 };
    // 如果不绑定，事件处理中的this为undefined（严格模式）
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    console.log(this.state.count); // 需要bind
  }

  handleClickArrow = () => {
    console.log(this.state.count); // 箭头函数自动绑定实例this
  }
}
```

## 高级面试题

```javascript
// 题19：优先级比较
function Foo() {
  getName = function() { console.log(1); };
  return this;
}
Foo.getName = function() { console.log(2); };
Foo.prototype.getName = function() { console.log(3); };
var getName = function() { console.log(4); };
function getName() { console.log(5); }

// 请写出以下输出：
Foo.getName();          // 2 — 静态方法调用
getName();              // 4 — 变量提升，函数声明(5)被var赋值(4)覆盖
Foo().getName();        // 1 — Foo()中的getName覆盖了全局getName，返回this=window
getName();              // 1 — 全局getName被改为1
new Foo.getName();      // 2 — new (Foo.getName)()，静态方法
new Foo().getName();    // 3 — (new Foo()).getName()，原型上的方法
```

## 箭头函数与普通函数综合

```javascript
// 题20：多层嵌套
const obj20 = {
  name: 'obj20',
  outer() {
    console.log('outer:', this.name);

    function inner() {
      console.log('inner:', this.name);
    }

    const arrowInner = () => {
      console.log('arrowInner:', this.name);
    };

    inner();
    arrowInner();

    return {
      name: 'returned',
      inner,
      arrowInner
    };
  }
};

const returned = obj20.outer();
returned.inner();        // outer: obj20, inner: window, arrowInner: obj20
returned.arrowInner();   // 'returned'

// 题21：class中的this
class Person {
  constructor(name) {
    this.name = name;
  }
  sayName() {
    console.log(this.name);
  }
  sayNameArrow = () => {
    console.log(this.name);
  }
}

const p = new Person('p');
const sayName = p.sayName;
const sayNameArrow = p.sayNameArrow;

sayName();       // undefined — 严格模式
sayNameArrow();  // 'p' — 箭头函数绑定实例
```

## React中的this问题

```javascript
// 题22：React函数组件中的this（无意义）
function Button() {
  console.log(this); // undefined（严格模式）
  // 函数组件中不需要关心this
}

// 题23：React类组件三种处理this的方式
class Toggle extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isToggle: false };

    // 方式1：bind绑定
    this.handleClick1 = this.handleClick1.bind(this);
  }

  // 方式2：实验性箭头函数语法
  handleClick2 = () => {
    this.setState(prev => ({ isToggle: !prev.isToggle }));
  }

  handleClick1() {
    this.setState(prev => ({ isToggle: !prev.isToggle }));
  }

  // 方式3：内联箭头函数（每次渲染创建新函数）
  render() {
    return (
      <button onClick={() => this.handleClick1()}>
        {this.state.isToggle ? 'ON' : 'OFF'}
      </button>
    );
  }
}
```

## 总结表格

| 调用方式 | this指向 | 示例 |
|---------|---------|------|
| 独立函数调用 | 全局对象/undefined | `fn()` |
| 对象方法调用 | 调用对象 | `obj.fn()` |
| new调用 | 新创建的对象 | `new Fn()` |
| call/apply/bind | 指定的对象 | `fn.call(ctx)` |
| 箭头函数 | 外层作用域的this | `() => {}` |
| DOM事件处理 | 触发事件的元素 | `el.addEventListener('click', fn)` |
| 定时器 | 全局对象 | `setTimeout(fn, 0)` |
