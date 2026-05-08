# ✅this的绑定规则有哪些？

# 典型回答

JavaScript中 `this` 的绑定规则有五种，优先级从低到高：

| 规则 | 绑定规则 | 优先级 |
|------|---------|:------:|
| 默认绑定 | 独立函数调用，this指向全局对象（非严格模式）或undefined（严格模式） | 5（最低） |
| 隐式绑定 | 作为对象方法调用，this指向调用该方法的对象 | 4 |
| 显式绑定 | 通过call/apply/bind手动指定this | 3 |
| new绑定 | 通过new调用构造函数，this指向新创建的对象 | 2 |
| 箭头函数绑定 | 箭头函数没有自己的this，继承外层作用域的this | 1（最高，不可覆盖） |

**优先级总结：** `箭头函数 > new绑定 > 显式绑定 > 隐式绑定 > 默认绑定`

# 扩展知识

## 默认绑定

```javascript
// 非严格模式：this指向全局对象（浏览器中的window，Node.js中的global）
function sayHello() {
  console.log(this.name);
}

var name = 'Global';  // var声明会挂在全局对象上

sayHello(); // 'Global'

// 严格模式：this为undefined
function strictHello() {
  'use strict';
  console.log(this); // undefined
  console.log(this.name); // TypeError: Cannot read property 'name' of undefined
}

function wrapping() {
  'use strict';
  sayHello(); // 'Global' — this的指向取决于函数的调用位置，不是定义位置
}

// let/const不会挂在全局对象上
let nameLet = 'Let Name';
sayHello(); // 'Global'（不是'Let Name'）
```

## 隐式绑定

```javascript
const obj = {
  name: 'Object',
  sayName() {
    console.log(this.name);
  }
};

obj.sayName(); // 'Object' — this指向obj

// 隐式丢失
const fn = obj.sayName;
fn(); // undefined（或全局对象上的name）— this丢失，变为默认绑定

// 更隐蔽的丢失
function execute(fn) {
  fn();
}
execute(obj.sayName); // undefined — 传参也是隐式赋值

// 对象链中的this
const obj1 = {
  name: 'obj1',
  inner: {
    name: 'inner',
    sayName() {
      console.log(this.name);
    }
  }
};

obj1.inner.sayName(); // 'inner' — this指向最后一层对象
```

## 显式绑定

```javascript
function greet() {
  console.log(`Hello, ${this.name}`);
}

const user1 = { name: 'Alice' };
const user2 = { name: 'Bob' };

// call — 立即调用，逐个传参
greet.call(user1);  // 'Hello, Alice'

// apply — 立即调用，数组传参
greet.apply(user2); // 'Hello, Bob'

// bind — 返回新函数，永久绑定this
const boundGreet = greet.bind(user1);
boundGreet();               // 'Hello, Alice'
boundGreet.call(user2);     // 'Hello, Alice' — bind过的函数this不可改变

// 硬绑定
function hardBind(fn, ctx) {
  return function(...args) {
    return fn.apply(ctx, args);
  };
}

const bound = hardBind(greet, user1);
bound(); // 'Hello, Alice'
```

## new绑定

```javascript
function Person(name) {
  this.name = name;
  this.sayName = function() {
    console.log(this.name);
  };
}

const p = new Person('Alice');
p.sayName(); // 'Alice'

// new绑定的优先级高于隐式绑定
const obj = {
  create: Person
};

const p2 = new obj.create('Bob');
console.log(p2.name);  // 'Bob'
// 如果是隐式绑定，this指向obj，但new绑定优先级更高

// new绑定高于显式绑定？
function Foo() {
  console.log(this);
}

const foo = Foo.bind({ bound: true });
new foo(); // {}（新创建的对象），bind绑定的this被忽略
// new绑定的优先级高于bind
```

## 箭头函数绑定

```javascript
// 箭头函数不绑定this，继承外层作用域的this
const obj = {
  name: 'obj',
  normal: function() {
    console.log(this.name);
  },
  arrow: () => {
    console.log(this.name);
  }
};

obj.normal(); // 'obj' — 隐式绑定
obj.arrow();  // undefined（全局）— 继承外层的this

// 箭头函数中的this无法被改变
const arrowFn = () => console.log(this);
arrowFn.call({ x: 1 });   // 仍然是外层的this
arrowFn.apply({ x: 1 });  // 同上
arrowFn.bind({ x: 1 })(); // 同上

// 箭头函数在回调中的优势
function Timer() {
  this.seconds = 0;

  // 普通函数：需要额外处理
  setInterval(function() {
    this.seconds++; // this指向window
  }, 1000);

  // 解决方案1：箭头函数
  setInterval(() => {
    this.seconds++; // this指向Timer实例
  }, 1000);
}
```

## 综合优先级测试

```javascript
function testThis() {
  console.log(this.name);
}

const ctx = { name: 'context' };
const bound = testThis.bind(ctx);

// 优先级：new绑定 > bind
const obj = new bound();
console.log(obj instanceof testThis); // true

// 特殊场景：bind函数被new调用时的行为
function bind(fn, ctx) {
  const boundFn = function(...args) {
    // 如果通过new调用，this是新创建的对象，忽略ctx
    return fn.apply(
      new.target ? this : ctx,
      args
    );
  };
  boundFn.prototype = fn.prototype;
  return boundFn;
}
```

## 绑定规则判断流程

```javascript
function determineThis(context) {
  // 1. 函数是箭头函数？ → 继承外层this
  // 2. 通过new调用？ → 新创建的对象
  // 3. 通过call/apply/bind？ → 指定对象
  // 4. 作为对象方法调用？ → 调用对象
  // 5. 默认规则：严格模式 → undefined，非严格模式 → 全局对象
}

// 实战判断
const obj = {
  name: 'obj',
  say: function() {
    const inner = () => console.log(this.name);
    inner();
  }
};

obj.say(); // 'obj'
// say的this由隐式绑定指向obj
// 箭头函数inner继承say的this

const extracted = obj.say;
extracted(); // undefined — say的this丢失，变为默认绑定
// 箭头函数inner继承的是say的this（现在是全局/undefined）
```

## 常见面试题

```javascript
// 面试题1
var name = 'window';
const obj = {
  name: 'obj',
  method: function() {
    console.log(this.name);
    return function() {
      console.log(this.name);
    };
  }
};

obj.method()(); // 'obj' 然后 'window'
// obj.method() — 隐式绑定 → 'obj'
// 返回的函数独立调用 — 默认绑定 → 'window'

// 面试题2
const obj2 = {
  name: 'obj2',
  fn: () => {
    console.log(this.name);
  }
};
obj2.fn(); // window.name — 箭头函数的this在定义时确定，不是调用时

// 面试题3
const person = {
  name: 'person',
  greet: function() {
    setTimeout(() => {
      console.log(this.name);
    }, 100);
  }
};
person.greet(); // 'person' — 箭头函数继承greet的this
```
