# ✅箭头函数和普通函数的区别是什么？箭头函数的this指向如何确定？

# 典型回答

箭头函数是ES6引入的一种更简洁的函数语法，与普通函数有多个关键区别：

**主要区别：**

| 特性 | 普通函数 | 箭头函数 |
|------|---------|---------|
| this绑定 | 动态绑定，取决于调用方式 | 词法绑定，继承外层作用域的this |
| 构造函数 | 可以作为构造函数，使用new | 不能作为构造函数，没有[[Construct]] |
| arguments对象 | 拥有自己的arguments | 没有arguments，需用剩余参数替代 |
| prototype属性 | 有prototype属性 | 没有prototype属性 |
| 语法 | function关键字声明 | => 箭头语法 |
| 重复参数名 | 非严格模式下允许 | 不允许 |
| 用作方法 | 适合对象方法 | 不适合（this指向外层） |

**箭头函数的this指向如何确定：**

箭头函数没有自己的this，它的this继承自**外层（词法作用域）的this**，在定义时确定，而不是在调用时确定。箭头函数的this一旦确定，即使通过call/apply/bind也无法改变。

# 扩展知识

## 箭头函数不能用作构造函数的深层原因

箭头函数没有`[[Construct]]`内部方法，也没有`prototype`属性。当使用`new`调用时，JavaScript引擎会尝试调用`[[Construct]]`，但箭头函数不存在这个方法，因此抛出错误：

```javascript
const Fn = () => {};
// new Fn(); // TypeError: Fn is not a constructor

function NormalFn() {}
console.log(NormalFn.prototype); // {constructor: ƒ}
console.log(Fn.prototype);       // undefined
```

## 箭头函数中this的绑定机制

```javascript
const obj = {
  name: 'Alice',
  normalFunc: function() {
    console.log(this.name);
  },
  arrowFunc: () => {
    console.log(this.name);
  }
};

obj.normalFunc(); // 'Alice' — this指向obj
obj.arrowFunc();  // undefined — this指向全局（或undefined在严格模式下）

// 更复杂的嵌套场景
const outer = {
  name: 'outer',
  inner: {
    name: 'inner',
    normal: function() {
      return function() {
        console.log(this.name);
      };
    },
    arrow: function() {
      return () => {
        console.log(this.name);
      };
    }
  }
};

outer.inner.normal()(); // undefined — 普通匿名函数this指向全局
outer.inner.arrow()();  // 'inner' — 箭头函数this继承自outer.inner.arrow的this
```

## call/apply/bind无法改变箭头函数this

```javascript
const arrow = () => console.log(this);
const normal = function() { console.log(this); };

arrow.call({ x: 1 });   // 仍然是外层的this
normal.call({ x: 1 });  // { x: 1 }

const boundArrow = arrow.bind({ x: 1 });
boundArrow();            // 仍然是外层的this
```

## 没有arguments对象的替代方案

```javascript
function normal() {
  console.log(arguments[0], arguments[1]);
}

const arrow = (...args) => {
  console.log(args[0], args[1]);
};

normal(1, 2);  // 1 2
arrow(1, 2);   // 1 2

// 注意：如果箭头函数外层是普通函数，可以访问外层的arguments
function wrapper() {
  const arrow = () => console.log(arguments[0]);
  arrow();
}
wrapper(42);   // 42
```

## 不适合使用箭头函数的场景

1. **对象方法**：需要this指向对象本身时
2. **原型方法**：需要this指向实例时
3. **事件监听器**：需要this指向触发事件的元素时
4. **需要动态绑定this**：什么时候调用不确定

```javascript
// 错误示例
const counter = {
  count: 0,
  increment: () => { this.count++; }  // this指向外层，不是counter
};

// DOM事件中
button.addEventListener('click', () => {
  this.textContent = 'Clicked';  // this指向window，不是button
});
```

## 适合使用箭头函数的场景

1. **回调函数**：setTimeout、Promise链、数组方法等
2. **函数式编程**：map、filter、reduce等
3. **需要保留外层this**：在嵌套函数中避免`var self = this`
