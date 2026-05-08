# ✅Map、Set、WeakMap、WeakSet的区别和用途是什么？

# 典型回答

Map、Set、WeakMap、WeakSet是ES6新增的四种数据结构：

**Set**：类似于数组，但成员的值都是**唯一**的，没有重复。
**Map**：类似于对象，但键可以是**任何类型**（包括对象、函数、原始值）。
**WeakSet**：成员只能是**对象**，且是**弱引用**，不会阻止垃圾回收。
**WeakMap**：键只能是**对象**，且是**弱引用**，不会阻止垃圾回收。

**核心区别对比：**

| 特性 | Set | Map | WeakSet | WeakMap |
|------|-----|-----|---------|---------|
| 键的类型 | 值本身 | 任意类型 | 只能是对象 | 只能是对象 |
| 值的类型 | 任意类型 | 任意类型 | 只能是对象 | 任意类型 |
| 引用方式 | 强引用 | 强引用 | 弱引用 | 弱引用 |
| 可迭代 | 可迭代 | 可迭代 | 不可迭代 | 不可迭代 |
| size属性 | 有 | 有 | 无 | 无 |
| 遍历方法 | forEach、keys、values | forEach、keys、values | 无 | 无 |
| 垃圾回收影响 | 阻止GC | 阻止GC | 不阻止GC | 不阻止GC |

**使用场景：**

- **Set**：数组去重、集合运算（交集、并集、差集）
- **Map**：需要对象作为键、频繁增删查的场景
- **WeakSet**：存储DOM节点标记、防止内存泄漏
- **WeakMap**：存储对象关联数据、缓存、私有属性

# 扩展知识

## Set的常用操作

```javascript
// 基本操作
const set = new Set();
set.add(1).add(2).add(2).add(3);
console.log(set.size); // 3

console.log(set.has(2));  // true
set.delete(2);
console.log(set.has(2));  // false

// 数组去重
const arr = [1, 2, 2, 3, 3, 4];
const unique = [...new Set(arr)]; // [1, 2, 3, 4]

// 集合运算
const a = new Set([1, 2, 3]);
const b = new Set([2, 3, 4]);

// 并集
const union = new Set([...a, ...b]); // {1, 2, 3, 4}

// 交集
const intersect = new Set([...a].filter(x => b.has(x))); // {2, 3}

// 差集 (a - b)
const difference = new Set([...a].filter(x => !b.has(x))); // {1}
```

## Map的键可以是任意类型

```javascript
const map = new Map();

// 对象作为键
const key1 = { id: 1 };
const key2 = { id: 2 };
map.set(key1, 'Alice');
map.set(key2, 'Bob');

// 函数作为键
const funcKey = () => {};
map.set(funcKey, 'function value');

// NaN作为键
map.set(NaN, 'not a number');
console.log(map.get(NaN)); // 'not a number'

// Map的键是基于SameValueZero算法比较的
const map2 = new Map();
map2.set(0, 'zero');
map2.set(-0, 'negative zero'); // 0和-0被视为相同
console.log(map2.size); // 1
```

## WeakMap的典型应用

**场景一：存储私有数据**

```javascript
const privateData = new WeakMap();

class Person {
  constructor(name) {
    privateData.set(this, { name, secret: 'private info' });
  }

  getName() {
    return privateData.get(this).name;
  }
}

const p = new Person('Alice');
console.log(p.getName()); // 'Alice'
console.log(p.secret);    // undefined
```

**场景二：缓存计算结果**

```javascript
const cache = new WeakMap();

function computeExpensive(obj) {
  if (cache.has(obj)) {
    return cache.get(obj);
  }
  const result = heavyComputation(obj);
  cache.set(obj, result);
  return result;
}
// 当obj被回收时，对应的缓存自动清除
```

**场景三：DOM节点关联数据**

```javascript
const domData = new WeakMap();

function trackClicks(element) {
  if (!domData.has(element)) {
    domData.set(element, { clicks: 0 });
  }
  element.addEventListener('click', () => {
    const data = domData.get(element);
    data.clicks++;
    console.log(`Clicked ${data.clicks} times`);
  });
}
// 当DOM节点被移除时，关联数据自动被GC回收
```

## 为什么WeakMap不可迭代？

WeakMap中的键是弱引用，垃圾回收器可能在任意时刻回收键对应的对象。这意味着迭代器中的键可能在遍历过程中被回收，导致不一致的行为。因此WeakMap不提供迭代方法和size属性，以避免这种不确定性。

## Map vs Object 选择指南

| 场景 | 推荐 | 原因 |
|------|------|------|
| 键为字符串/Symbol | Object | 对象字面量更简洁 |
| 键为任意类型 | Map | 支持对象/函数等作为键 |
| 频繁增删键值对 | Map | 性能优于Object |
| 需要顺序遍历 | Map | 保留插入顺序 |
| 需要序列化(JSON) | Object | Map不支持直接JSON序列化 |
| 需要计算大小 | Map | 有size属性 |
| 需从原型链继承 | Object | 默认继承Object.prototype |

## Set vs Array 选择指南

| 场景 | 推荐 | 原因 |
|------|------|------|
| 需要唯一值 | Set | 自动去重 |
| 需要索引访问 | Array | 支持arr[i] |
| 频繁查找 | Set | has()是O(1) |
| 频繁增删 | Set | 有专门的add/delete方法 |
| 需要排序 | Array | 有sort方法 |
| 保存顺序 | 两者均可 | 均保留插入顺序 |
