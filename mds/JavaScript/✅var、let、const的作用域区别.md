# ✅var、let、const的作用域区别

# 典型回答

`var`、`let`、`const`是JavaScript中三种声明变量的方式，它们的作用域规则完全不同：

| 维度 | var | let | const |
|------|-----|-----|-------|
| 作用域 | 函数级作用域 | 块级作用域 | 块级作用域 |
| 变量提升 | 声明提升，初始化为undefined | 声明提升，但未初始化（TDZ） | 声明提升，但未初始化（TDZ） |
| 重复声明 | 允许在同一作用域重复声明 | 不允许重复声明 | 不允许重复声明 |
| 重新赋值 | 允许 | 允许 | 不允许（引用不可变） |
| 全局声明 | 成为window/global属性 | 不会成为全局对象属性 | 不会成为全局对象属性 |
| 暂时性死区 | 无 | 有 | 有 |
| 块级作用域 | 不支持（if/for/while中的var会泄露） | 支持 | 支持 |

# 扩展知识

## 函数级作用域 vs 块级作用域

```javascript
// var：函数级作用域，只在函数边界限制
function fn() {
  var a = 1;
  if (true) {
    var a = 2;  // 同个函数作用域，覆盖了外层的a
    console.log(a); // 2
  }
  console.log(a); // 2 — var没有块级作用域限制
}
fn();
// console.log(a); // ReferenceError — 函数边界仍然有效

// let/const：块级作用域
function fn2() {
  let b = 1;
  if (true) {
    let b = 2;  // 独立的块级作用域
    console.log(b); // 2
  }
  console.log(b); // 1 — 块级作用域保护了外部变量
}
```

## var的常见陷阱

```javascript
// 1. 循环变量泄露
for (var i = 0; i < 5; i++) {
  // ...
}
console.log(i); // 5 — i泄露到外部

// 2. if语句中的变量泄露
if (true) {
  var leaked = '我泄露了';
}
console.log(leaked); // '我泄露了'

// 3. switch语句中的变量泄露
switch (1) {
  case 1:
    var caseVar = 'switch中的var';
    break;
}
console.log(caseVar); // 'switch中的var'

// 4. 重复声明没有警告
var name = 'Alice';
var name = 'Bob';  // 覆盖，不报错
console.log(name); // 'Bob'
```

## 块级作用域的覆盖范围

```javascript
// 哪些花括号创建块级作用域？
// 1. if语句
if (true) {
  let x = 1;
}
// console.log(x); // ReferenceError

// 2. for/while循环
for (let i = 0; i < 3; i++) {
  // i仅在循环体内有效
}
// console.log(i); // ReferenceError

// 3. switch语句
switch (1) {
  case 1:
    let y = 1;  // 正常
    break;
  case 2:
    // let y = 2; // SyntaxError: 标识符'y'已被声明
    break;
}
// 建议用花括号包裹每个case
switch (1) {
  case 1: {
    let y = 1;
    break;
  }
  case 2: {
    let y = 2;
    break;
  }
}

// 4. try/catch
try {
  let errorVar = 'try';
} catch (e) {
  let errorVar = 'catch';
}
// console.log(errorVar); // ReferenceError

// 5. 独立的块
{
  let blockVar = '块级';
  const blockConst = '块级常量';
  var stillGlobal = '仍然全局';
}
```

## 三种声明方式的选择策略

```javascript
// 现代JavaScript编码规范：
// 1. 默认使用 const — 所有不需要重新赋值的变量
const MAX_SIZE = 100;
const config = { theme: 'dark' };
const users = [];

// 2. 需要重新赋值时用 let
let count = 0;
let currentUser = null;
for (let i = 0; i < 10; i++) { }

// 3. 绝不使用 var（除非维护老旧代码）

// 为什么不用var？
// - 作用域不明确，容易造成bug
// - 变量提升导致代码可读性差
// - 重复声明不能及时发现错误
// - 块级作用域缺失
```

## 全局声明差异

```javascript
// var 声明全局变量
var globalVar = 'global';
console.log(window.globalVar); // 'global' — 成为window属性

// let/const 声明全局变量
let globalLet = 'let global';
const globalConst = 'const global';
console.log(window.globalLet);   // undefined
console.log(window.globalConst); // undefined

// 影响：var可能意外覆盖全局对象的现有属性
var name = 'myName';  // window.name 是已存在的属性！
console.log(window.name); // 'myName' — 覆盖了默认的window.name
```

## 暂时性死区（TDZ）的深入理解

```javascript
// TDZ指的是从进入作用域到声明完成之间的区域
{
  // TDZ开始
  // console.log(val); // ReferenceError
  let val = 1;
  // TDZ结束
  console.log(val); // 1
}

// typeof 在TDZ中也不安全
typeof notDeclared;    // 'undefined' — 未声明变量是安全的
typeof x;              // ReferenceError — TDZ中的变量
let x;

// TDZ与函数参数默认值
function test(a = b, b = 1) {
  // 参数a的默认值b处于TDZ
}
// test(); // ReferenceError: Cannot access 'b' before initialization

// 正确的顺序
function test(a = 1, b = a) {
  console.log(a, b); // 1, 1
}
test();
```

## for循环中的特殊行为

```javascript
// var在for循环中：共享同一个变量
const funcsVar = [];
for (var i = 0; i < 3; i++) {
  funcsVar.push(() => console.log(i));
}
funcsVar[0](); // 3
funcsVar[1](); // 3
funcsVar[2](); // 3

// let在for循环中：每次迭代创建新的绑定
const funcsLet = [];
for (let i = 0; i < 3; i++) {
  funcsLet.push(() => console.log(i));
}
funcsLet[0](); // 0
funcsLet[1](); // 1
funcsLet[2](); // 2

// 底层原理：for循环的let每次迭代会创建新的词法环境
// 类似于以下效果：
{
  let i = 0;
  funcs.push(() => console.log(i));
}
{
  let i = 1;
  funcs.push(() => console.log(i));
}
{
  let i = 2;
  funcs.push(() => console.log(i));
}
```

## 性能影响

```javascript
// var在全局作用域中影响作用域链查找性能
var x = 1;
function test() {
  // var x = 2;  // 如果没有var，会沿着作用域链找到全局x
  // 但如果有var，会在当前作用域创建新变量，更快
}

// let/const在块级作用域中可能比var稍慢（需要管理块级作用域）
// 但在现代V8引擎中差异可以忽略

// const的语义优化
const VALUE = 100;
// 引擎知道VALUE不会被改变，可以做出优化
// 而var/let声明的变量引擎不能确定
```
