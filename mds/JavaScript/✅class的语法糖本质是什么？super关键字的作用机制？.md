# ✅class的语法糖本质是什么？super关键字的作用机制？

# 典型回答

## class的语法糖本质

ES6的`class`本质上是**原型链继承的语法糖**，底层仍然是基于构造函数和原型链的继承机制。class定义的方法都会被添加到`prototype`上。

```javascript
// class写法
class Person {
  constructor(name) {
    this.name = name;
  }
  sayHi() {
    console.log(`Hi, I'm ${this.name}`);
  }
}

// 等价的原型链写法
function Person(name) {
  this.name = name;
}
Person.prototype.sayHi = function() {
  console.log(`Hi, I'm ${this.name}`);
};
```

## super关键字的作用机制

`super` 有两种使用场景，其机制不同：

1. **作为函数调用** `super(args)`：在子类constructor中调用，代表父类的构造函数
2. **作为对象使用** `super.prop` 或 `super.method()`：指向父类的原型对象

**super在构造函数中的机制：**
- 子类的`this`是由父类构造函数创建的（必须先调用super才能使用this）
- `super()` 实际上调用了 `Parent.prototype.constructor.call(this)`

# 扩展知识

## class与普通构造函数的区别

```javascript
// 1. class不能被直接调用（必须用new）
class MyClass {}
// MyClass(); // TypeError: Class constructor MyClass cannot be invoked without 'new'

function MyFunc() {}
MyFunc(); // 可以 — 但this指向全局

// 2. class的方法不可枚举
console.log(Object.keys(Person.prototype)); // [] — 不可枚举
console.log(Object.getOwnPropertyNames(Person.prototype)); // ['constructor', 'sayHi']

// 对比普通函数
function PersonFunc(name) {
  this.name = name;
}
PersonFunc.prototype.sayHi = function() {};
console.log(Object.keys(PersonFunc.prototype)); // ['sayHi'] — 可枚举

// 3. class内部的代码在严格模式下执行
class Strict {
  constructor() {
    console.log(this); // 严格模式下的this
  }
}

// 4. class没有变量提升
// const p = new EarlierClass(); // ReferenceError
class EarlierClass {}

// 5. class可以定义静态方法
class MathUtil {
  static add(a, b) { return a + b; }
}
console.log(MathUtil.add(1, 2)); // 3
```

## super作为对象的使用

```javascript
class Parent {
  constructor(name) {
    this.name = name;
  }
  getName() {
    return this.name;
  }
  static staticMethod() {
    return 'parent static';
  }
}

class Child extends Parent {
  constructor(name, age) {
    super(name);  // 调用父类构造函数
    this.age = age;
  }

  getInfo() {
    // super作为对象：指向父类原型
    const name = super.getName();  // 相当于 Parent.prototype.getName.call(this)
    return `${name}, ${this.age}`;
  }

  // 在静态方法中，super指向父类本身
  static childStatic() {
    return super.staticMethod();  // 相当于 Parent.staticMethod()
  }
}

const child = new Child('Alice', 5);
console.log(child.getInfo());        // 'Alice, 5'
console.log(Child.childStatic());    // 'parent static'
```

## super的this绑定

```javascript
class Parent {
  constructor() {
    this.name = 'parent';
  }
  getName() {
    return this.name;  // this指向调用方法的对象
  }
}

class Child extends Parent {
  constructor() {
    super();
    this.name = 'child';
  }
  getParentName() {
    return super.getName();  // this指向Child实例
  }
}

const child = new Child();
console.log(child.getParentName()); // 'child' — this是child实例，不是parent
```

## super.prop的查找机制

```javascript
class GrandParent {
  method() { return 'grandparent'; }
}

class Parent extends GrandParent {
  method() { return 'parent'; }
}

class Child extends Parent {
  method() {
    console.log(super.method());  // 'parent' — 从Parent.prototype开始查找
  }
  // super.method() 相当于：
  // Object.getPrototypeOf(Child.prototype).method.call(this)
  // 即 Parent.prototype.method.call(this)
}

// super的查找是静态的，基于声明时的原型链
const child = new Child();
child.method(); // 'parent'
```

## 继承内置类

```javascript
class MyArray extends Array {
  first() {
    return this[0];
  }
  last() {
    return this[this.length - 1];
  }
  // 确保map/filter等返回子类实例
  static get [Symbol.species]() { return Array; }
}

const arr = new MyArray(1, 2, 3);
console.log(arr.first()); // 1
console.log(arr.last());  // 3

// Symbol.species控制衍生对象的类型
const doubled = arr.map(x => x * 2);
console.log(doubled instanceof MyArray); // false（因为Symbol.species返回Array）

class MyPromise extends Promise {
  // 自定义方法
  finally(fn) {
    return super.finally(fn);  // 调用原生的finally
  }
}
```

## super的注意事项

```javascript
// 1. 子类必须有constructor时，必须先调用super才能使用this
class Base {
  constructor(x) { this.x = x; }
}
class Derived extends Base {
  constructor(x, y) {
    // console.log(this); // ReferenceError: must call super first
    super(x);
    this.y = y;  // OK
    // super(); // Error: 只能调用一次super()
  }
}

// 2. 如果子类没有定义constructor，会默认添加
class Derived2 extends Base {}
// 等价于：
class Derived3 extends Base {
  constructor(...args) {
    super(...args);
  }
}

// 3. 在普通方法中指向父类原型，在静态方法中指向父类
class Child extends Parent {
  method() {
    console.log(super.constructor === Parent); // true
  }
  static staticMethod() {
    console.log(super === Parent); // true
  }
}

// 4. super不能指向普通对象（非extends情况）
// const obj = { method() { super.method(); } }; // 可以，但super为Object.prototype

// 5. super在对象字面量中的简化
const obj = {
  toString() {
    return `Obj: ${super.toString()}`;
  }
};
```

## 底层实现原理

```javascript
// class extends 的转译效果（简化版）
class Child extends Parent {}

// 转译后大致为：
function Child() {
  if (this instanceof Child) {
    // 继承基类时不返回实例
    const _this = Reflect.construct(Parent, arguments, Child);
    return _this;
  }
  // 没有继承时（不extends）直接初始化
}

// 设置原型链
Object.setPrototypeOf(Child.prototype, Parent.prototype);
Object.setPrototypeOf(Child, Parent);  // 继承静态方法

// super() 的转译
function _super(that, args) {
  return _possibleReturn(
    Parent.apply(this, args) || this
  );
}

// super.prop 的转译
function _get(proto, prop, receiver) {
  return Reflect.get(proto, prop, receiver);
}
```

## class字段声明（ES2022新增）

```javascript
class Person {
  // 公共字段
  name = 'anonymous';
  age = 0;

  // 私有字段（ES2022）
  #ssn = '000-00-0000';
  #privateMethod() {
    return 'private';
  }

  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  getSSN() {
    return this.#ssn;  // 可以访问私有字段
  }
}

const p = new Person('Alice', 25);
console.log(p.name);      // 'Alice'
// console.log(p.#ssn);   // SyntaxError: Private field
// console.log(p.#privateMethod()); // SyntaxError
```
