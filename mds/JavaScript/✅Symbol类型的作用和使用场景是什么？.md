# ✅Symbol类型的作用和使用场景是什么？

# 典型回答

Symbol是ES6引入的一种新的**原始数据类型**，表示独一无二的值。它是JavaScript的第七种数据类型（Undefined、Null、Boolean、String、Number、Object、Symbol）。

**Symbol的核心特性：**

1. **唯一性**：每个Symbol值都是唯一的，即使描述相同也不相等
2. **不可变性**：Symbol值不能被改变
3. **可作为对象的属性键**：Symbol值可以作为对象属性的键，且不会出现在常规的枚举中（如for...in、Object.keys）
4. **不自动转换为字符串**：Symbol不能隐式转换为字符串，需要显式调用toString或String()

**主要使用场景：**

- 定义对象的私有/唯一属性
- 定义常量，避免命名冲突
- 实现迭代器（Symbol.iterator）
- 定义元编程协议（Symbol.hasInstance、Symbol.toPrimitive等）
- 模拟私有属性
- 注册全局Symbol（Symbol.for）

# 扩展知识

## Symbol的创建方式

```javascript
// 方式一：直接创建
const s1 = Symbol();
const s2 = Symbol('description'); // 可选描述
console.log(s2.toString()); // "Symbol(description)"

// 即使描述相同也不相等
const s3 = Symbol('id');
const s4 = Symbol('id');
console.log(s3 === s4); // false

// 方式二：全局Symbol注册
const gs1 = Symbol.for('globalId');
const gs2 = Symbol.for('globalId');
console.log(gs1 === gs2); // true

// 获取Symbol的描述
console.log(s2.description); // "description"（ES2019新增）
```

## 用作对象属性键

```javascript
const uniqueId = Symbol('id');
const user = {
  name: 'Alice',
  [uniqueId]: 12345,
  [Symbol('private')]: 'hidden data'
};

// 常规遍历方法无法获取Symbol键
console.log(Object.keys(user));         // ['name']
console.log(Object.getOwnPropertyNames(user)); // ['name']

// 获取Symbol键
console.log(Object.getOwnPropertySymbols(user)); // [Symbol(id), Symbol(private)]

// 包含Symbol的完整遍历
console.log(Reflect.ownKeys(user));     // ['name', Symbol(id), Symbol(private)]
```

## 内置Symbol（Well-known Symbols）

ES6提供了一系列内置Symbol，用于自定义语言内部行为：

```javascript
// Symbol.iterator — 自定义迭代行为
const range = {
  start: 1, end: 5,
  [Symbol.iterator]() {
    let current = this.start;
    const end = this.end;
    return {
      next() {
        return current <= end
          ? { value: current++, done: false }
          : { done: true };
      }
    };
  }
};
console.log([...range]); // [1, 2, 3, 4, 5]

// Symbol.toPrimitive — 自定义类型转换
const obj = {
  value: 42,
  [Symbol.toPrimitive](hint) {
    if (hint === 'string') return `Value: ${this.value}`;
    if (hint === 'number') return this.value;
    return this.value;
  }
};
console.log(String(obj)); // "Value: 42"
console.log(+obj);        // 42

// Symbol.hasInstance — 自定义instanceof行为
class MyArray {
  static [Symbol.hasInstance](instance) {
    return Array.isArray(instance);
  }
}
console.log([] instanceof MyArray); // true
```

## 其他内置Symbol

| Symbol | 用途 |
|--------|------|
| Symbol.iterator | 定义默认迭代器 |
| Symbol.asyncIterator | 定义异步迭代器 |
| Symbol.toStringTag | 自定义Object.prototype.toString行为 |
| Symbol.species | 指定衍生对象的构造函数 |
| Symbol.match/replace/search/split | 自定义字符串匹配行为 |
| Symbol.isConcatSpreadable | 控制Array.prototype.concat行为 |
| Symbol.unscopables | 控制with语句的绑定 |

## Symbol与私有属性

虽然Symbol不能完全实现私有属性（可以通过Object.getOwnPropertySymbols获取），但可以避免意外的属性覆盖：

```javascript
// 模拟私有属性
const _password = Symbol('password');

class User {
  constructor(name, password) {
    this.name = name;
    this[_password] = password;
  }

  checkPassword(input) {
    return this[_password] === input;
  }
}

const user = new User('Alice', 'secret123');
console.log(user.password);          // undefined
console.log(user[_password]);        // 需要持有Symbol引用
```

## Symbol与JSON

```javascript
const sym = Symbol('key');
const obj = { [sym]: 'value', normal: 'visible' };

console.log(JSON.stringify(obj)); // '{"normal":"visible"}' — Symbol属性被忽略
```

## 注意事项

- Symbol不能通过`new Symbol()`创建，因为它不是构造函数
- Symbol并非完全私有——`Object.getOwnPropertySymbols()`可以获取所有Symbol键
- 全局Symbol注册（Symbol.for）适合跨模块共享Symbol
- 每个Symbol值占用内存，但全局注册表实现的Symbol会在全局范围内复用
