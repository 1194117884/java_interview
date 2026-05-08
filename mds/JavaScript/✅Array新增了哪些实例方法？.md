# ✅Array新增了哪些实例方法？

# 典型回答

ES6及后续版本给Array.prototype增加了大量实用方法，按功能分类如下：

**ES6新增：**
- `Array.from()`：从类数组或可迭代对象创建数组（静态方法）
- `Array.of()`：根据参数创建数组（静态方法）
- `Array.prototype.find()`：返回第一个满足条件的元素
- `Array.prototype.findIndex()`：返回第一个满足条件的元素的索引
- `Array.prototype.fill()`：用指定值填充数组所有元素
- `Array.prototype.copyWithin()`：在数组内部复制元素
- `Array.prototype.entries()`：返回键值对迭代器
- `Array.prototype.keys()`：返回键名迭代器
- `Array.prototype.values()`：返回键值迭代器
- `Array.prototype.includes()`（ES2016）：判断数组是否包含某个值

**ES2019新增：**
- `Array.prototype.flat()`：将嵌套数组扁平化
- `Array.prototype.flatMap()`：映射后再扁平化

**ES2023新增：**
- `Array.prototype.toReversed()`：返回反转后的新数组（不修改原数组）
- `Array.prototype.toSorted()`：返回排序后的新数组
- `Array.prototype.toSpliced()`：返回删除/替换后的新数组
- `Array.prototype.with()`：返回替换指定位置元素后的新数组

# 扩展知识

## Array.from() 详解

```javascript
// 1. 从类数组对象转换
const arrayLike = { 0: 'a', 1: 'b', 2: 'c', length: 3 };
console.log(Array.from(arrayLike)); // ['a', 'b', 'c']

// 2. 从可迭代对象转换
console.log(Array.from('hello')); // ['h', 'e', 'l', 'l', 'o']
console.log(Array.from(new Set([1, 2, 3]))); // [1, 2, 3]
console.log(Array.from(new Map([['a', 1], ['b', 2]]))); // [['a', 1], ['b', 2]]

// 3. 第二个参数：mapFn
console.log(Array.from([1, 2, 3], x => x * 2)); // [2, 4, 6]

// 4. 创建指定长度的数组
const zeroArr = Array.from({ length: 5 }, () => 0); // [0, 0, 0, 0, 0]
const range = Array.from({ length: 10 }, (_, i) => i + 1); // [1..10]

// 5. 第三个参数：thisArg
const handler = { factor: 2 };
const nums = Array.from([1, 2, 3], function(x) {
  return x * this.factor;
}, handler); // [2, 4, 6]
```

## Array.of() 详解

```javascript
// 解决 Array() 构造函数的歧义
console.log(Array(3));     // [empty × 3] — 长度3的空数组
console.log(Array(3, 4));  // [3, 4] — 两个元素

console.log(Array.of(3));    // [3] — 一个元素3
console.log(Array.of(3, 4)); // [3, 4] — 两个元素
console.log(Array.of());     // [] — 空数组
```

## find() 和 findIndex()

```javascript
const users = [
  { id: 1, name: 'Alice', age: 25 },
  { id: 2, name: 'Bob', age: 30 },
  { id: 3, name: 'Charlie', age: 35 }
];

// find() 返回第一个匹配的元素
const user = users.find(u => u.age > 28);
console.log(user); // { id: 2, name: 'Bob', age: 30 }

// findIndex() 返回第一个匹配的索引
const index = users.findIndex(u => u.name === 'Charlie');
console.log(index); // 2

// 对比 indexOf — 不能使用复杂条件
console.log(users.indexOf({ id: 1, name: 'Alice', age: 25 })); // -1（引用不同）
```

## flat() 和 flatMap()

```javascript
// flat() 扁平化嵌套数组
const nested = [1, [2, 3], [4, [5, 6]]];
console.log(nested.flat());     // [1, 2, 3, 4, [5, 6]] — 默认深度1
console.log(nested.flat(2));    // [1, 2, 3, 4, 5, 6]
console.log(nested.flat(Infinity)); // [1, 2, 3, 4, 5, 6] — 全部扁平

// 移除空位
console.log([1, 2, , 4].flat()); // [1, 2, 4]

// flatMap() — map + flat(1)
const sentences = ['Hello world', 'How are you'];
const words = sentences.flatMap(s => s.split(' '));
console.log(words); // ['Hello', 'world', 'How', 'are', 'you']

// 对比 map + flat
console.log(sentences.map(s => s.split(' ')).flat(1)); // 同上
```

## fill() 详解

```javascript
// fill(value, start, end)
const arr = [1, 2, 3, 4, 5];

console.log(arr.fill(0));         // [0, 0, 0, 0, 0] — 全部填充
console.log(arr.fill(0, 2));      // [1, 2, 0, 0, 0] — 从索引2开始
console.log(arr.fill(0, 1, 3));   // [1, 0, 0, 4, 5] — 索引1到3

// 创建默认二维数组
const matrix = Array.from({ length: 3 }, () => Array(3).fill(0));
// 不要这样！所有行共享同一个引用
const badMatrix = Array(3).fill(Array(3).fill(0));
```

## ES2023 不修改原数组的方法

```javascript
// 这些方法返回新数组，不修改原数组
const arr = [3, 1, 4, 1, 5, 9];

// toReversed() — 返回反转后的新数组
const reversed = arr.toReversed();
console.log(reversed); // [9, 5, 1, 4, 1, 3]
console.log(arr);      // [3, 1, 4, 1, 5, 9] — 原数组不变

// toSorted() — 返回排序后的新数组
const sorted = arr.toSorted((a, b) => a - b);
console.log(sorted);   // [1, 1, 3, 4, 5, 9]
console.log(arr);      // [3, 1, 4, 1, 5, 9] — 原数组不变

// toSpliced(start, deleteCount, ...items)
const spliced = arr.toSpliced(2, 3, 10, 20);
console.log(spliced);  // [3, 1, 10, 20, 9]

// with(index, value) — 替换指定位置的元素
const modified = arr.with(0, 99);
console.log(modified); // [99, 1, 4, 1, 5, 9]
console.log(arr);      // [3, 1, 4, 1, 5, 9] — 原数组不变
```

## includes() 详解

```javascript
// ES2016加入，比indexOf更语义化
const arr = [1, 2, 3, NaN];

console.log(arr.includes(2));    // true
console.log(arr.includes(4));    // false
console.log(arr.includes(NaN));  // true（与indexOf不同）
console.log(arr.indexOf(NaN));   // -1（indexOf使用严格相等，NaN !== NaN）

// 第二个参数：起始位置
console.log(arr.includes(2, 2)); // false（从索引2开始找）
console.log(arr.includes(2, -3)); // true（负索引从末尾算起）
```

## Array方法性能对比

| 方法 | 用途 | 是否修改原数组 | 返回值 | 性能特点 |
|------|------|:---------:|--------|---------|
| forEach | 遍历 | 否 | undefined | 无法提前终止 |
| map | 映射 | 否 | 新数组 | 适合转换操作 |
| filter | 过滤 | 否 | 新数组 | 筛选子集 |
| find | 查找 | 否 | 第一个匹配 | 短路，找到即停 |
| some | 条件判断 | 否 | boolean | 短路，找到true即停 |
| every | 全量判断 | 否 | boolean | 短路，找到false即停 |
| reduce | 归约 | 否 | 任意值 | 最灵活但可读性差 |
| sort | 排序 | **是** | 原数组 | V8使用TimSort |
| splice | 增删 | **是** | 被删元素 | 综合操作 |

## 实用组合示例

```javascript
// 1. 数组去重
const uniq = [...new Set([1, 2, 2, 3])];
const uniq2 = arr.filter((v, i, a) => a.indexOf(v) === i);

// 2. 分组
const grouped = arr.reduce((acc, item) => {
  const key = item.category;
  (acc[key] = acc[key] || []).push(item);
  return acc;
}, {});

// 3. 交集、并集、差集
const a = [1, 2, 3], b = [2, 3, 4];
const intersect = a.filter(v => b.includes(v));
const union = [...new Set([...a, ...b])];
const diff = a.filter(v => !b.includes(v));

// 4. 对象数组转Map
const userMap = new Map(users.map(u => [u.id, u]));

// 5. 统计频率
const freq = arr.reduce((acc, v) => {
  acc[v] = (acc[v] || 0) + 1;
  return acc;
}, {});
```
