# ✅for...of和for...in的区别是什么？

# 典型回答

`for...of` 和 `for...in` 都是JavaScript中遍历数据结构的语法，但它们的遍历机制和适用场景截然不同：

| 对比维度 | for...in | for...of |
|---------|---------|---------|
| 遍历对象 | 对象**键名**（属性名） | 可迭代对象的**键值** |
| 适用范围 | 普通对象、数组 | 可迭代对象（Array、Map、Set、String等） |
| 遍历原型链 | 会遍历原型链上的可枚举属性 | 不遍历原型链 |
| 遍历顺序 | 不保证（整数键按升序，字符串按添加顺序） | 遵循迭代器定义的顺序 |
| 适用场景 | 遍历对象属性 | 遍历数组/集合的元素值 |
| 底层机制 | 枚举（enumerable）属性遍历 | 迭代器（Iterator）协议 |
| 能否遍历Symbol属性 | 不能 | 不能 |
| 对数组的空位 | 会遍历空位 | 会遍历为undefined |

**核心记忆：**
- `for...in` 遍历的是**键**（key）
- `for...of` 遍历的是**值**（value）

# 扩展知识

## for...in 遍历对象的特性

```javascript
const obj = { a: 1, b: 2, c: 3 };

for (const key in obj) {
  console.log(key, obj[key]);
}
// a 1
// b 2
// c 3

// 会遍历继承的可枚举属性
Object.prototype.customProp = 'inherited';
const myObj = { own: 'property' };

for (const key in myObj) {
  console.log(key);
}
// own
// customProp — 来自原型链！

// 使用 hasOwnProperty 过滤
for (const key in myObj) {
  if (myObj.hasOwnProperty(key)) {
    console.log(key); // 只输出 'own'
  }
}
```

## for...in 遍历数组的问题

```javascript
const arr = [10, 20, 30];
arr.customProp = 'custom';

for (const index in arr) {
  console.log(index, arr[index]);
}
// 0 10
// 1 20
// 2 30
// customProp custom — 数组也是对象!

// 遍历的是字符串类型的索引
for (const index in arr) {
  console.log(typeof index); // 'string'
}

// 遍历顺序：整数键先按升序遍历
const mixed = { b: 1, 2: 'two', a: 3, 1: 'one' };
for (const key in mixed) {
  console.log(key);
}
// 1, 2, a, b — 整数索引优先
```

## for...of 遍历的值

```javascript
// 数组
for (const val of [10, 20, 30]) {
  console.log(val); // 10, 20, 30
}

// 字符串
for (const char of 'hello') {
  console.log(char); // 'h', 'e', 'l', 'l', 'o'
}

// Map
const map = new Map([['a', 1], ['b', 2]]);
for (const [key, value] of map) {
  console.log(key, value);
}

// Set
const set = new Set([1, 2, 3]);
for (const val of set) {
  console.log(val);
}

// TypedArray
for (const byte of new Uint8Array([0x41, 0x42])) {
  console.log(byte); // 65, 66
}

// arguments
(function() {
  for (const arg of arguments) {
    console.log(arg);
  }
})(1, 2, 3);

// NodeList
// for (const node of document.querySelectorAll('div')) {}
```

## for...of 遍历普通对象会报错

```javascript
const obj = { a: 1, b: 2 };

// for (const val of obj) { } // TypeError: obj is not iterable

// 可以让对象可迭代
obj[Symbol.iterator] = function*() {
  for (const key of Object.keys(this)) {
    yield this[key];
  }
};

for (const val of obj) {
  console.log(val); // 1, 2
}
```

## 性能对比

```javascript
const arr = Array.from({ length: 1000000 }, (_, i) => i);

console.time('for...in');
let sum1 = 0;
for (const key in arr) {
  if (arr.hasOwnProperty(key)) {
    sum1 += arr[key];
  }
}
console.timeEnd('for...in'); // 很慢

console.time('for...of');
let sum2 = 0;
for (const val of arr) {
  sum2 += val;
}
console.timeEnd('for...of'); // 快

console.time('for循环');
let sum3 = 0;
for (let i = 0; i < arr.length; i++) {
  sum3 += arr[i];
}
console.timeEnd('for循环'); // 最快

console.time('forEach');
let sum4 = 0;
arr.forEach(v => { sum4 += v; });
console.timeEnd('forEach'); // 接近for循环
```

## 其他遍历方法的对比

```javascript
const arr = [1, 2, 3];
arr.custom = 'custom';

// forEach — 不能break/return提前终止
arr.forEach(v => {
  if (v === 2) return; // 不能终止，只是跳过本次回调
  console.log(v);      // 1, 3
});

// for...of — 可以break
for (const v of arr) {
  if (v === 2) break;
  console.log(v); // 1
}

// 遍历空位
const sparse = [1, , 3];

for (const key in sparse) {
  console.log('in:', key); // 'in: 0', 'in: 2' — 跳过空位
}

for (const val of sparse) {
  console.log('of:', val); // 'of: 1', 'of: undefined', 'of: 3'
}

sparse.forEach(v => {
  console.log('forEach:', v); // 1, 3 — 跳过空位
});
```

## 总结：何时使用哪种遍历方式

| 场景 | 推荐遍历方式 |
|------|------------|
| 遍历对象属性（自身） | for...in + hasOwnProperty 或 Object.keys + forEach |
| 遍历数组元素 | for...of 或 forEach |
| 需要数组索引 | for 循环或 Array.prototype.entries |
| 遍历Map/Set | for...of |
| 遍历字符串字符 | for...of |
| 需要提前终止 | for...of 或 for 循环 |
| 性能要求极高 | for 循环 |
| 函数式编程 | forEach/map/filter |
