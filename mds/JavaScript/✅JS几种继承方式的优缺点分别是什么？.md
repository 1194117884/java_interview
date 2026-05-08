# ✅JS几种继承方式的优缺点分别是什么？

# 典型回答

JavaScript实现继承有多种方式，每种方式都有其优缺点。以下是主要的继承方式：

**1. 原型链继承**
**2. 构造函数继承（借用构造函数）**
**3. 组合继承**
**4. 原型式继承**
**5. 寄生式继承**
**6. 寄生组合式继承**
**7. ES6 Class继承**

**各方式对比总览：**

| 继承方式 | 父类方法复用 | 子类传参 | 多继承 | 引用属性共享问题 |
|---------|:----------:|:--------:|:-----:|:--------------:|
| 原型链继承 | ✓ | ✗ | ✗ | 有 |
| 构造函数继承 | ✗ | ✓ | ✓ | 无 |
| 组合继承 | ✓ | ✓ | ✗ | 无 |
| 原型式继承 | ✓ | ✗ | ✗ | 有 |
| 寄生式继承 | ✗ | ✗ | ✗ | 无 |
| 寄生组合式继承 | ✓ | ✓ | ✗ | 无 |
| Class继承 | ✓ | ✓ | ✗ | 无 |

# 扩展知识

## 原型链继承

```javascript
function Parent() {
  this.name = 'parent';
  this.children = [1, 2, 3];
}

Parent.prototype.sayName = function() {
  console.log(this.name);
};

function Child() {}
Child.prototype = new Parent();

const child1 = new Child();
const child2 = new Child();

child1.children.push(4);
console.log(child1.children); // [1, 2, 3, 4]
console.log(child2.children); // [1, 2, 3, 4] — 引用共享问题！
```

**优点：**
- 父类方法可以复用
- 实现简单

**缺点：**
- 引用类型属性被所有实例共享
- 创建子类实例时不能向父类构造函数传参
- 子类原型上的constructor指向Parent

## 构造函数继承

```javascript
function Parent(name) {
  this.name = name;
  this.children = [1, 2, 3];
}

Parent.prototype.sayName = function() {
  console.log(this.name);
};

function Child(name) {
  Parent.call(this, name);  // 调用父类构造函数
}

const child1 = new Child('child1');
const child2 = new Child('child2');

child1.children.push(4);
console.log(child1.children); // [1, 2, 3, 4]
console.log(child2.children); // [1, 2, 3] — 没有共享问题

child1.sayName(); // TypeError — 无法继承父类原型上的方法
```

**优点：**
- 解决了引用属性共享问题
- 可以向父类传参
- 可以实现多继承（call多个父类）

**缺点：**
- 无法继承父类原型上的方法
- 每个实例都有父类方法副本，造成内存浪费

## 组合继承（最常用的方式）

```javascript
function Parent(name) {
  this.name = name;
  this.children = [1, 2, 3];
}

Parent.prototype.sayName = function() {
  console.log(this.name);
};

function Child(name, age) {
  Parent.call(this, name);  // 第二次调用Parent
  this.age = age;
}

Child.prototype = new Parent();  // 第一次调用Parent
Child.prototype.constructor = Child;
Child.prototype.sayAge = function() {
  console.log(this.age);
};

const child = new Child('Alice', 5);
child.sayName(); // 'Alice'
child.sayAge();  // 5
```

**优点：**
- 结合了原型链和构造函数的优点
- 方法复用，属性独立
- 可以传参
- instanceof和isPrototypeOf可用

**缺点：**
- 父类构造函数被调用了两次
- 子类原型上多了不必要的父类实例属性（造成内存浪费）

## 原型式继承

```javascript
function objectCreate(o) {
  function F() {}
  F.prototype = o;
  return new F();
}

// ES5的Object.create就是这种实现
const parent = {
  name: 'parent',
  children: [1, 2, 3],
  sayName() {
    console.log(this.name);
  }
};

const child1 = Object.create(parent);
const child2 = Object.create(parent);

child1.name = 'child1';
child1.children.push(4);

console.log(child1.children); // [1, 2, 3, 4]
console.log(child2.children); // [1, 2, 3, 4] — 引用共享！
```

**优点：**
- 不需要定义构造函数，基于已有对象创建新对象
- 适合简单场景

**缺点：**
- 引用类型属性共享
- 无法传参

## 寄生式继承

```javascript
function createAnother(original) {
  const clone = Object.create(original);
  clone.sayHi = function() {  // 增强对象
    console.log('Hi');
  };
  return clone;
}

const base = { name: 'base' };
const enhanced = createAnother(base);
enhanced.sayHi(); // 'Hi'
```

**优点：**
- 可以在不修改原对象的情况下增加功能
- 适合为对象添加行为

**缺点：**
- 方法不能复用（每次创建都生成新函数）
- 引用共享问题依然存在

## 寄生组合式继承（最理想的方案）

```javascript
function inheritPrototype(child, parent) {
  const prototype = Object.create(parent.prototype);
  prototype.constructor = child;
  child.prototype = prototype;
}

function Parent(name) {
  this.name = name;
  this.children = [1, 2, 3];
}

Parent.prototype.sayName = function() {
  console.log(this.name);
};

function Child(name, age) {
  Parent.call(this, name);
  this.age = age;
}

inheritPrototype(Child, Parent);

Child.prototype.sayAge = function() {
  console.log(this.age);
};

const child = new Child('Alice', 5);
console.log(child.name);     // 'Alice'
console.log(child.age);      // 5
child.sayName();             // 'Alice'
child.sayAge();              // 5
console.log(child instanceof Child);   // true
console.log(child instanceof Parent);  // true
```

**优点：**
- 只调用一次父类构造函数
- 避免了子类原型上不必要的属性
- 原型链保持不变
- 效率最高，是引用类型最理想的继承范式

**缺点：**
- 实现相对复杂

## ES6 Class继承

```javascript
class Parent {
  constructor(name) {
    this.name = name;
  }
  sayName() {
    console.log(this.name);
  }
}

class Child extends Parent {
  constructor(name, age) {
    super(name);      // 调用父类构造函数
    this.age = age;
  }
  sayAge() {
    console.log(this.age);
  }
  // 重写父类方法
  sayName() {
    super.sayName();  // 调用父类方法
    console.log(`I'm ${this.name} and I'm ${this.age}`);
  }
}

const child = new Child('Alice', 5);
child.sayName();
// Alice
// I'm Alice and I'm 5
```

**优点：**
- 语法简洁清晰
- 底层是寄生组合式继承
- 支持super关键字
- 不能被new调用（如果父类是class）

**缺点：**
- 是语法糖，仍然是原型链继承
- 不能继承普通对象（需使用Object.setPrototypeOf）
- 过度使用继承可能导致代码复杂

## 各方式选择建议

| 场景 | 推荐方式 |
|------|---------|
| 简单继承 | Class继承 |
| 需要精细控制 | 寄生组合式继承 |
| 不定义类型，仅创建类似对象 | Object.create |
| 只需复用方法 | 原型链继承 |
| 需要多继承 | Mixin模式（Object.assign混入） |
