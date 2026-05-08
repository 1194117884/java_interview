# ✅ES6新增了哪些特性？let、const和var有什么区别？

# 典型回答

ES6（ECMAScript 2015）是JavaScript发展史上最重要的版本之一，引入了大量新特性，主要包括：

- **声明方式**：let、const（块级作用域声明）
- **箭头函数**：更简洁的函数语法，不绑定this
- **模板字符串**：支持嵌入表达式和多行字符串
- **解构赋值**：从数组或对象中提取值
- **默认参数、剩余参数、扩展运算符**
- **对象字面量增强**：属性简写、计算属性名
- **Symbol**：新增原始数据类型
- **Map、Set、WeakMap、WeakSet**：新的数据结构
- **Proxy、Reflect**：元编程能力
- **Promise**：异步编程解决方案
- **Iterator、Generator**：迭代器和生成器
- **Class**：类的语法糖
- **Module**：ES Module模块化方案
- **async/await**（ES2017，常一并讨论）
- **BigInt**（ES2020）

**let、const与var的核心区别：**

| 特性 | var | let | const |
|------|-----|-----|-------|
| 作用域 | 函数级作用域 | 块级作用域 | 块级作用域 |
| 变量提升 | 声明提升，初始化为undefined | 声明提升，但未初始化（TDZ） | 声明提升，但未初始化（TDZ） |
| 重复声明 | 允许 | 不允许 | 不允许 |
| 重新赋值 | 允许 | 允许 | 不允许（引用不可变） |
| 全局声明 | 成为window属性 | 不成为window属性 | 不成为window属性 |
| 暂时性死区 | 无 | 有 | 有 |

# 扩展知识

## 块级作用域详解

var声明的变量在函数内部任何位置都能访问，不存在块级作用域：

```javascript
if (true) {
  var x = 10;
  let y = 20;
}
console.log(x); // 10，var无视块级作用域
console.log(y); // ReferenceError: y is not defined
```

let和const在`{}`内部形成块级作用域，包括：if语句、for循环、while循环、switch语句等。

## 经典循环问题

var的变量提升特性导致了一个经典问题：

```javascript
// var版本：全部输出5
for (var i = 0; i < 5; i++) {
  setTimeout(() => console.log(i), 0); // 5 5 5 5 5
}

// let版本：输出0-4
for (let i = 0; i < 5; i++) {
  setTimeout(() => console.log(i), 0); // 0 1 2 3 4
}
```

var版本中，只有一个i变量被提升到函数顶部，循环结束后i=5，所有回调共享同一个i。而let在每个迭代中创建了独立的绑定，每次循环都是一个新的变量。

## const的"不可变"陷阱

const保证的是**引用地址不可变**，而不是值不可变：

```javascript
const obj = { name: 'Alice' };
obj.name = 'Bob';  // 允许，对象属性可以修改
// obj = {};  // TypeError: Assignment to constant variable

const arr = [1, 2, 3];
arr.push(4);       // 允许，变成[1,2,3,4]
arr[0] = 0;        // 允许
// arr = [];       // TypeError
```

要实现真正的不可变对象，可以使用`Object.freeze()`（浅冻结）或借助Immutable.js等库。

## 暂时性死区（TDZ）

从进入作用域到变量声明语句之间的区域称为暂时性死区，在此区域内访问变量会抛出ReferenceError：

```javascript
{
  // TDZ开始
  // console.log(a); // ReferenceError
  let a = 1;
  // TDZ结束，可以访问
  console.log(a); // 1
}

// typeof也不再安全
typeof undeclaredVar;    // "undefined"，未声明变量没问题
typeof blockedVar;       // ReferenceError!
let blockedVar = 1;
```

## 最佳实践

- **默认使用const**：除非明确需要重新赋值
- **需要重新赋值时用let**：循环计数器、累加器等场景
- **避免使用var**：除非需要兼容非常古老的浏览器（IE10及以下）
- const语义更清晰，能防止意外的变量覆盖，提高代码可预测性
