# ✅call、apply、bind的区别和实现原理

# 典型回答

`call`、`apply`、`bind` 都是用于显式绑定函数中 `this` 指向的方法，它们都定义在 `Function.prototype` 上。

**三者区别：**

| 方法 | 执行时机 | 参数传递 | 返回值 | 是否改变原函数this |
|------|---------|---------|-------|:--------------:|
| call | 立即执行 | 逐个传递 `fn.call(thisArg, arg1, arg2, ...)` | 函数执行结果 | 不改变（临时绑定） |
| apply | 立即执行 | 数组传递 `fn.apply(thisArg, [arg1, arg2, ...])` | 函数执行结果 | 不改变（临时绑定） |
| bind | 返回新函数 | 分批传递 `fn.bind(thisArg, arg1)(arg2)` | 返回绑定了this的新函数 | 永久改变（返回新函数） |

**核心记忆：**
- `call` — **c** 代表 **comma**（逗号），参数用逗号分隔
- `apply` — **a** 代表 **array**（数组），参数用数组传递
- `bind` — 返回新函数，不立即执行

# 扩展知识

## 手动实现 call

```javascript
Function.prototype.myCall = function(context, ...args) {
  // 处理null/undefined，指向全局对象
  context = context ?? globalThis;

  // 使用Symbol避免属性冲突
  const fnKey = Symbol('fn');
  context[fnKey] = this;  // this指向调用myCall的函数

  const result = context[fnKey](...args);
  delete context[fnKey];  // 清除添加的属性

  return result;
};

// 测试
function greet(greeting, punctuation) {
  return `${greeting}, ${this.name}${punctuation}`;
}

const person = { name: 'Alice' };
console.log(greet.myCall(person, 'Hello', '!')); // 'Hello, Alice!'
```

## 手动实现 apply

```javascript
Function.prototype.myApply = function(context, args) {
  context = context ?? globalThis;
  const fnKey = Symbol('fn');
  context[fnKey] = this;

  // args可能是类数组或undefined
  const argsArray = args ? Array.from(args) : [];
  const result = context[fnKey](...argsArray);
  delete context[fnKey];

  return result;
};

// 测试
const numbers = [3, 1, 4, 1, 5];
const max = Math.max.myApply(null, numbers); // 正常Math.max不需要this
console.log(max); // 5

function introduce(hobby, age) {
  return `I'm ${this.name}, I like ${hobby}, I'm ${age}`;
}
const user = { name: 'Bob' };
console.log(introduce.myApply(user, ['coding', 25]));
// "I'm Bob, I like coding, I'm 25"
```

## 手动实现 bind

```javascript
Function.prototype.myBind = function(context, ...bindArgs) {
  const originalFn = this;

  // 返回的新函数
  function boundFn(...callArgs) {
    // 如果通过new调用，this指向新创建的对象
    // 否则指向传入的context
    return originalFn.apply(
      this instanceof boundFn ? this : context,
      [...bindArgs, ...callArgs]
    );
  }

  // 维护原型链
  if (originalFn.prototype) {
    boundFn.prototype = Object.create(originalFn.prototype);
  }

  return boundFn;
};

// 测试
function multiply(a, b, c) {
  return a * b * c;
}

const double = multiply.myBind(null, 2);
console.log(double(3, 4)); // 24 (2 * 3 * 4)

const triple = multiply.myBind(null, 3);
console.log(triple(4, 5)); // 60 (3 * 4 * 5)

// new绑定优先
function Person(name) {
  this.name = name;
}

const BoundPerson = Person.myBind({ x: 1 });
const p = new BoundPerson('Alice');
console.log(p.name); // 'Alice'
console.log(p.x);    // undefined — new绑定优先
```

## 实际应用场景

```javascript
// 1. 借用数组方法
function sumArguments() {
  // arguments是类数组，借用数组方法
  const args = Array.prototype.slice.call(arguments);
  // 或
  const args2 = [].slice.call(arguments);
  return args.reduce((a, b) => a + b, 0);
}
console.log(sumArguments(1, 2, 3, 4)); // 10

// 借用Math方法
const maxVal = Math.max.apply(null, [1, 2, 3, 4, 5]);
console.log(maxVal); // 5

// 2. 继承
function Parent(name) {
  this.name = name;
}

function Child(name, age) {
  Parent.call(this, name);  // 借用构造函数
  this.age = age;
}

// 3. 函数柯里化
function add(a, b, c) {
  return a + b + c;
}
const add5 = add.bind(null, 5);
const add5And10 = add5.bind(null, 10);
console.log(add5And10(15)); // 30

// 4. setTimeout中的this
const obj = {
  name: 'obj',
  sayName() {
    console.log(this.name);
  },
  delayed() {
    // 普通函数会丢失this
    setTimeout(this.sayName.bind(this), 100); // 使用bind绑定
  }
};
obj.delayed(); // 'obj'

// 5. 事件处理
class Button {
  constructor(text) {
    this.text = text;
    this.handleClick = this.handleClick.bind(this); // 绑定this
  }
  handleClick() {
    console.log(`Button ${this.text} clicked`);
  }
}
```

## 性能对比

```javascript
// 性能：call > apply > bind

function test() {
  return this.x;
}

const ctx = { x: 1 };

// call 最快（参数已知时）
console.time('call');
for (let i = 0; i < 100000; i++) {
  test.call(ctx);
}
console.timeEnd('call');

// apply 稍慢（需要解析参数数组）
console.time('apply');
for (let i = 0; i < 100000; i++) {
  test.apply(ctx);
}
console.timeEnd('apply');

// bind 最慢（创建新函数）
console.time('bind');
for (let i = 0; i < 100000; i++) {
  const fn = test.bind(ctx);
  fn();
}
console.timeEnd('bind');

// 如果只需要绑定一次并多次调用，bind的开销可以分摊
console.time('bind once call many');
const bound = test.bind(ctx);
for (let i = 0; i < 100000; i++) {
  bound();
}
console.timeEnd('bind once call many');
```

## 注意事项

```javascript
// 1. null/undefined作为thisArg
function showThis() {
  console.log(this);
}
showThis.call(null); // 非严格模式：window/global
showThis.call(undefined); // 非严格模式：window/global

// 严格模式下：
function strictShow() {
  'use strict';
  console.log(this);
}
strictShow.call(null);      // null
strictShow.call(undefined); // undefined

// 2. 基本类型作为thisArg会被包装
function showType() {
  console.log(this.constructor.name);
}
showType.call(42);     // Number
showType.call('str');  // String
showType.call(true);   // Boolean

// 3. bind返回的函数没有length属性
function original(a, b, c) {}
console.log(original.length);       // 3
const bound = original.bind(null);
console.log(bound.length);          // 0

// 4. bind的函数不能再次bind
const bound1 = original.bind(ctx1);
const bound2 = bound1.bind(ctx2);
// bound2的this仍然是ctx1，不是ctx2
```
