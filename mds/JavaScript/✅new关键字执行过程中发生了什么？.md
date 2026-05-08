# ✅new关键字执行过程中发生了什么？

# 典型回答

当使用 `new` 关键字调用一个函数时，JavaScript引擎会执行以下4个步骤：

1. **创建一个空对象**：创建一个新的普通空对象 `{}`
2. **设置原型链**：将新对象的 `[[Prototype]]`（即 `__proto__`）指向构造函数的 `prototype` 属性
3. **绑定this并执行构造函数**：将构造函数内的 `this` 绑定到新对象，并执行构造函数代码
4. **返回结果**：如果构造函数返回一个**对象**，则返回该对象；否则返回新创建的对象

```javascript
function Person(name, age) {
  // 隐含操作：
  // 1. const obj = {}
  // 2. obj.__proto__ = Person.prototype
  // 3. this = obj

  this.name = name;
  this.age = age;

  // 4. return this（默认）
}

const p = new Person('Alice', 25);
```

# 扩展知识

## 手动实现new操作符

```javascript
function myNew(constructor, ...args) {
  // 1. 创建一个空对象，原型指向构造函数的prototype
  const obj = Object.create(constructor.prototype);

  // 2. 将构造函数内部的this绑定到obj，并调用构造函数
  const result = constructor.apply(obj, args);

  // 3. 如果构造函数返回对象，返回该对象，否则返回新创建的obj
  return (result !== null && typeof result === 'object') || typeof result === 'function'
    ? result
    : obj;
}

// 测试
function Person(name) {
  this.name = name;
  return { custom: 'object' }; // 返回对象
}

const p1 = new Person('Alice');
console.log(p1.name);        // undefined（返回的不是Person实例）
console.log(p1.custom);      // 'object'

const p2 = myNew(Person, 'Bob');
console.log(p2.name);        // undefined
console.log(p2.custom);      // 'object'
```

## 构造函数返回值的处理

```javascript
// 情况1：构造函数不返回值 —— 返回新创建的对象
function A(name) {
  this.name = name;
  // 没有return
}
console.log(new A('Alice')); // { name: 'Alice' }

// 情况2：构造函数返回基本类型 —— 忽略返回值，返回新对象
function B(name) {
  this.name = name;
  return 42; // 基本类型，被忽略
}
console.log(new B('Bob')); // { name: 'Bob' }

// 情况3：构造函数返回对象 —— 返回该对象
function C(name) {
  this.name = name;
  return { custom: true }; // 对象，替代创建的新对象
}
console.log(new C('Charlie')); // { custom: true }

// 情况4：构造函数返回null —— 返回新对象（null是对象但被视为无效）
function D(name) {
  this.name = name;
  return null;
}
console.log(new D('David')); // { name: 'David' }

// 情况5：构造函数返回函数 —— 返回该函数
function E() {
  return function() {};
}
console.log(new E()); // function() {}（函数也是对象）
```

## instanceof与new的关系

```javascript
function Person(name) {
  this.name = name;
}

// new做了原型链接，所以instanceof可以检测
const p = new Person('Alice');
console.log(p instanceof Person); // true
console.log(p instanceof Object);  // true

// 手动打断原型链
function FakePerson(name) {
  this.name = name;
  return {};
}
const fake = new FakePerson('Bob');
console.log(fake instanceof FakePerson); // false（返回的是空对象）
console.log(fake instanceof Object);     // true
```

## 使用new和不使用new的区别

```javascript
function Person(name) {
  this.name = name;
}

// 使用 new
const p1 = new Person('Alice');
console.log(p1);              // Person { name: 'Alice' }
console.log(p1 instanceof Person); // true

// 不适用 new（非严格模式）
const p2 = Person('Bob');
console.log(p2);              // undefined（函数没有返回值）
console.log(window.name);     // 'Bob' — this指向window！

// 防止忘记new的写法
function SafePerson(name) {
  // 如果调用者忘记使用new，自动修正
  if (!(this instanceof SafePerson)) {
    return new SafePerson(name);
  }
  this.name = name;
}

// 或者使用new.target（ES2015）
function ModernPerson(name) {
  if (!new.target) {
    throw new Error('ModernPerson must be called with new');
  }
  this.name = name;
}
```

## new.target

`new.target` 用于检测函数或构造函数是否通过 `new` 调用：

```javascript
function Constructor() {
  console.log(new.target);
  if (new.target === undefined) {
    throw new Error('必须使用new调用');
  }
  if (new.target === Constructor) {
    console.log('通过new Constructor()调用');
  }
}

new Constructor();  // 输出指向Constructor
Constructor();      // 报错

// 在class中，new.target始终指向直接调用的构造函数
class Parent {
  constructor() {
    console.log(new.target);
  }
}

class Child extends Parent {
  constructor() {
    super();
  }
}

new Parent(); // [Function: Parent]
new Child();  // [Function: Child]（new.target指向Child）
```

## 箭头函数不能用作构造函数

```javascript
const Arrow = () => {};
// new Arrow(); // TypeError: Arrow is not a constructor

// 原因：箭头函数没有[[Construct]]内部方法
// 没有prototype属性
console.log(Arrow.prototype); // undefined
```

## Object.create与new的关系

```javascript
// new本质上 = Object.create(prototype) + 调用构造函数

function Person(name) {
  this.name = name;
}
Person.prototype.sayHi = function() {
  console.log(`Hi, ${this.name}`);
};

// 使用new
const p1 = new Person('Alice');

// 模拟new
const p2 = Object.create(Person.prototype);
Person.call(p2, 'Bob');

p1.sayHi(); // 'Hi, Alice'
p2.sayHi(); // 'Hi, Bob'
```

## Symbol和BigInt不能使用new

```javascript
// Symbol不能使用new
// const s = new Symbol('test'); // TypeError: Symbol is not a constructor
const s = Symbol('test'); // 正确

// BigInt不能使用new
// const b = new BigInt(123); // TypeError: BigInt is not a constructor
const b = BigInt(123); // 正确

// 但内置对象可以用new的有：
// Object, Array, Function, Date, RegExp, Map, Set, Error, Promise, Proxy等
```

## new的优化技巧

```javascript
// 使用new创建对象比对象字面量稍慢
const obj = {};  // 推荐

const obj2 = new Object(); // 不推荐（多一次函数调用）

// 对于频繁创建对象的场景，考虑对象池
class ObjectPool {
  constructor(factory, size = 100) {
    this.factory = factory;
    this.pool = [];
    for (let i = 0; i < size; i++) {
      this.pool.push(new factory());
    }
  }
  acquire() {
    return this.pool.pop() || new this.factory();
  }
  release(obj) {
    this.pool.push(obj);
  }
}
```
