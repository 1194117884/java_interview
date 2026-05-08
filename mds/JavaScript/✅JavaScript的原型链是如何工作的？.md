# ✅JavaScript的原型链是如何工作的？

# 典型回答

JavaScript的原型链（Prototype Chain）是实现**继承**的主要机制。每个对象都有一个内部属性 `[[Prototype]]`（可通过 `__proto__` 或 `Object.getPrototypeOf()` 访问），指向另一个对象（即原型）。当访问对象的某个属性时，如果对象自身不存在该属性，JavaScript引擎会沿着原型链向上查找，直到找到该属性或到达 `null` 为止。

**核心概念：**

- **prototype**：函数对象特有的属性，指向实例的原型对象
- **`__proto__`**：每个对象都有的属性（非标准，但广泛支持），指向构造函数的prototype
- **constructor**：原型对象上的属性，指向构造函数本身

**原型链的基本结构：**
```
实例对象.__proto__ → 构造函数.prototype
构造函数.prototype.__proto__ → Object.prototype
Object.prototype.__proto__ → null（原型链终点）
```

# 扩展知识

## 原型链的查找过程

```javascript
function Person(name) {
  this.name = name;
}

Person.prototype.sayHi = function() {
  console.log(`Hi, I'm ${this.name}`);
};

const alice = new Person('Alice');

// 属性查找过程
console.log(alice.name);      // 'Alice' — 在实例上找到
alice.sayHi();                // 'Hi, I'm Alice' — 在原型上找到
console.log(alice.toString()); // '[object Object]' — 在Object.prototype上找到

// 查找链：alice → Person.prototype → Object.prototype → null
console.log(alice.__proto__ === Person.prototype);              // true
console.log(Person.prototype.__proto__ === Object.prototype);    // true
console.log(Object.prototype.__proto__);                         // null
```

## 完整的原型链图示

```javascript
// 构造函数
function Foo() {}
const foo = new Foo();

// 关系链
console.log(foo.__proto__ === Foo.prototype);           // true
console.log(Foo.prototype.__proto__ === Object.prototype); // true
console.log(Object.prototype.__proto__);                // null

// 函数的原型链
console.log(Foo.__proto__ === Function.prototype);      // true
console.log(Function.prototype.__proto__ === Object.prototype); // true

// Object函数的原型链
console.log(Object.__proto__ === Function.prototype);   // true

// Object本身的prototype
console.log(Object.prototype.__proto__);                // null

// Function.prototype是一个函数对象
console.log(typeof Function.prototype);                 // 'function'
console.log(Function.prototype.__proto__ === Object.prototype); // true
```

## 属性遮蔽（Property Shadowing）

```javascript
const parent = { value: 10, method() { return 'parent'; } };
const child = Object.create(parent);
child.value = 20;  // 在child上创建自有属性，遮蔽parent的value

console.log(child.value);     // 20 — 实例属性遮蔽原型属性
console.log(child.method());  // 'parent' — child没有method，从原型获取
console.log(parent.value);    // 10 — 原对象不受影响

// 删除遮蔽属性后，恢复原型上的值
delete child.value;
console.log(child.value);     // 10 — 重新从原型链上获取
```

## 设置原型的方式

```javascript
// 1. Object.create() — 推荐
const proto = { greet() { return 'Hello'; } };
const obj = Object.create(proto);
console.log(obj.greet()); // 'Hello'

// 2. 构造函数 + new
function Animal(type) { this.type = type; }
Animal.prototype.speak = function() { return '...'; };

// 3. class语法（ES6）
class Dog extends Animal {
  speak() { return 'Woof!'; }
}

// 4. Object.setPrototypeOf()（性能较差）
const obj2 = {};
Object.setPrototypeOf(obj2, proto);

// 5. __proto__（非标准，不推荐）
const obj3 = {};
obj3.__proto__ = proto;
```

## instanceof 运算符的原理

`instanceof` 检查构造函数的 `prototype` 是否在实例的原型链上：

```javascript
function MyClass() {}
const obj = new MyClass();

console.log(obj instanceof MyClass);     // true
console.log(obj instanceof Object);      // true
console.log(obj instanceof Array);       // false

// 手动实现 instanceof
function myInstanceof(instance, constructor) {
  let proto = Object.getPrototypeOf(instance);
  while (proto !== null) {
    if (proto === constructor.prototype) return true;
    proto = Object.getPrototypeOf(proto);
  }
  return false;
}

console.log(myInstanceof(obj, MyClass)); // true
```

## 原型链的常见操作

```javascript
// 判断属性是自有属性还是继承属性
const obj = Object.create({ inherited: true });
obj.own = true;

console.log(obj.hasOwnProperty('own'));        // true
console.log(obj.hasOwnProperty('inherited'));  // false
console.log('inherited' in obj);               // true — in操作符会遍历原型链

// 获取对象原型
console.log(Object.getPrototypeOf(obj));
console.log(obj.__proto__);  // 非标准

// 检查原型关系
console.log(Person.prototype.isPrototypeOf(alice)); // true
```

## 原型链继承的优缺点

```javascript
function Parent() {
  this.name = 'parent';
  this.children = [1, 2, 3];
}
Parent.prototype.sayName = function() {
  console.log(this.name);
};

function Child() {
  Parent.call(this);  // 借用构造函数
  this.type = 'child';
}

Child.prototype = Object.create(Parent.prototype);
Child.prototype.constructor = Child;

const child1 = new Child();
const child2 = new Child();

child1.children.push(4);
console.log(child1.children); // [1, 2, 3, 4]
console.log(child2.children); // [1, 2, 3] — 不会被影响

console.log(child1 instanceof Child);   // true
console.log(child1 instanceof Parent);  // true
console.log(child1 instanceof Object);  // true
```

**优缺点总结：**

| 优点 | 缺点 |
|------|------|
| 实现简单，性能好 | 引用类型属性共享问题 |
| 支持方法复用 | 无法向父构造函数传参 |
| instanceof自动支持 | 必须使用Object.create设置原型 |
| 符合JavaScript语言设计 | 多重继承复杂 |

## 原型链的性能影响

```javascript
// 原型链越长，属性查找越慢
// 深度嵌套的原型链应避免

// 优化建议：
// 1. 保持原型链扁平（不超过2-3层）
// 2. 将频繁访问的属性放在实例上
// 3. 合理使用方法委托而非数据继承
// 4. 使用 hasOwnProperty 过滤原型属性

// V8引擎的优化：隐藏类（Hidden Class）
function Point(x, y) {
  this.x = x;
  this.y = y;
}
const p1 = new Point(1, 2);
const p2 = new Point(3, 4);
// p1和p2共享相同的隐藏类，属性访问被优化为固定偏移量
```
