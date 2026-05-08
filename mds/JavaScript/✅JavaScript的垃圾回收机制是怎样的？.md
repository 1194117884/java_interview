# ✅JavaScript的垃圾回收机制是怎样的？

# 典型回答

JavaScript的**垃圾回收（GC）** 是自动的，JavaScript引擎会定期检测不再使用的对象并释放其占用的内存。主流引擎（V8、SpiderMonkey等）主要使用**标记-清除（Mark-and-Sweep）** 算法，并辅以**分代回收**和**增量回收**等优化策略。

**核心垃圾回收算法：**

| 算法 | 原理 | 优点 | 缺点 |
|------|------|------|------|
| 引用计数 | 记录每个对象的引用次数，为0时回收 | 实现简单，实时性好 | 无法处理循环引用 |
| 标记-清除 | 从根对象遍历，标记可达对象，清除不可达对象 | 可以处理循环引用 | 产生内存碎片 |
| 标记-整理 | 标记后对存活对象进行整理，压缩内存 | 减少内存碎片 | 额外开销较大 |
| 分代回收 | 将对象分为新生代和老生代，分别采用不同策略 | 效率高，针对性强 | 实现复杂 |

**现代JavaScript引擎（V8）的垃圾回收步骤：**
1. 标记：从根对象（全局对象、当前函数调用栈等）出发，标记所有可达对象
2. 清除/整理：回收未被标记的对象，或整理存活对象以压缩内存
3. 可选去碎片的步骤

# 扩展知识

## V8引擎的分代回收

V8将堆内存分为两个区域：

```javascript
// 新生代（New Space）：
// - 存放生命周期短的对象
// - 使用Scavenge算法（Cheney算法）
// - 空间小（1-8MB）
// - 频繁回收（~20%空间会晋升到老生代）

// 老生代（Old Space）：
// - 存放生命周期长的对象
// - 使用Mark-Sweep和Mark-Compact
// - 空间大
// - 回收频率低

// 对象晋升条件：
// 1. 经历过一次新生代GC仍然存活
// 2. 从新生代复制到空闲空间时，占用空间超过25%

function demo() {
  // 局部变量：在新生代分配
  let local = { data: 'short-lived' };
  // 函数执行完毕后，local不可达，会被新生代GC回收

  // 全局变量：在老生代分配
  globalVar = { data: 'long-lived' };
  // 一直可达，不会被回收
}
```

## 标记-清除算法的详细过程

```javascript
// 1. 根对象（Root Set）
// - 全局对象（window/global）
// - 当前执行上下文中的局部变量
// - 正在执行的函数参数
// - DOM元素（浏览器中）

// 2. 标记阶段
// 从根对象出发，深度优先遍历，标记所有可达对象

// 3. 清除阶段
// 遍历堆内存，回收所有未标记的对象

// 示例：标记-清除过程
let a = { name: 'a' };
let b = { name: 'b' };
let c = { name: 'c' };

a.ref = b;
b.ref = a;  // a和b互相引用

a = null;   // a不再引用对象

// 此时：
// - { name: 'a' } 和 { name: 'b' } 仍然互相引用
// - 但从根对象出发，它们不可达（没有变量引用它们）
// - 引用计数法无法回收它们（循环引用）
// - 标记-清除法可以回收它们（从根出发找不到它们）

// 标记-清除从根出发找：
// 根 → c（可达，保留）
// 根 → a? a已经被赋值为null，所以{name:'a'}不可达 → 清除
// {name:'a'} → b（但a不可达，b也不可达） → 清除
```

## 引用计数的问题

```javascript
// 引用计数的循环引用问题
function problem() {
  let objA = {};
  let objB = {};

  objA.ref = objB;
  objB.ref = objA;

  // 即使函数执行完毕，objA和objB的引用计数为1
  // 因为互相引用，永远不会变成0
  // 导致内存泄漏
}

// IE6-8中的真实案例 — DOM与JS对象的循环引用
function createElement() {
  const element = document.createElement('div');
  const obj = {};

  element.obj = obj;
  obj.element = element;

  // 即使函数结束，element和obj互相引用
  // IE6-8（使用引用计数）无法回收
}

// 现代浏览器使用标记-清除，已经解决这个问题
```

## 内存泄漏的常见模式

```javascript
// 1. 意外的全局变量
function leak() {
  leaked = '全局变量'; // 没有var/let/const
}
// 相当于 window.leaked = '全局变量'

// 2. 被遗忘的定时器
const data = getData();
setInterval(() => {
  // data不会被释放
  console.log(data);
}, 1000);

// 3. 闭包中的大对象
function createClosure() {
  const largeData = new Array(1000000).fill('*');
  return function() {
    console.log(largeData.length); // largeData一直被引用
  };
}

// 4. DOM引用
const elements = [];
document.querySelectorAll('button').forEach(button => {
  elements.push(button); // DOM元素被长期引用
  button.addEventListener('click', () => {
    console.log(button); // 闭包引用
  });
});

// 5. Map/Set中的对象键
const map = new Map();
let key = { data: 'temp' };
map.set(key, 'value');
key = null; // Map中仍然引用着key，无法回收
// 使用WeakMap可以解决
```

## 如何排查内存问题

```javascript
// Chrome DevTools 内存分析

// 1. Performance面板 — 记录内存使用变化
// 2. Memory面板 — 堆快照对比
// 3. Allocation instrumentation on timeline — 内存分配时间线

// 代码中辅助排查
function checkMemory() {
  // 使用performance.memory（Chrome）
  if (performance.memory) {
    console.log('JS堆大小:', performance.memory.usedJSHeapSize);
    console.log('JS堆限制:', performance.memory.jsHeapSizeLimit);
  }
}

// Node.js中监控
const usage = process.memoryUsage();
console.log('堆使用:', usage.heapUsed / 1024 / 1024, 'MB');
console.log('堆总计:', usage.heapTotal / 1024 / 1024, 'MB');
```

## V8的优化技术

```javascript
// 1. 增量标记（Incremental Marking）
// 将标记过程拆分为多个小步骤，避免长时间停顿
// 每次只标记一部分对象，然后让出主线程

// 2. 惰性清除（Lazy Sweeping）
// 清除操作延迟到需要分配内存时再进行

// 3. 并发标记（Concurrent Marking）
// 在辅助线程上进行标记（不阻塞主线程）

// 4. 写屏障（Write Barrier）
// 记录对象引用的变化，确保增量标记的正确性

// 5. 空闲时间回收（Idle GC）
// 在浏览器空闲时间进行垃圾回收

// 触发GC的条件
// 1. 内存分配达到阈值
// 2. 浏览器标签页切换到后台（空闲时回收）
// 3. 显式调用（不推荐）
// 在Node.js中：global.gc()
```

## Node.js中的GC控制

```javascript
// Node.js 中查看GC日志
// node --trace-gc app.js

// 手动触发GC（需要 --expose-gc 参数）
// node --expose-gc app.js
if (global.gc) {
  global.gc(); // 不推荐在生产环境使用
}

// 调整内存限制
// node --max-old-space-size=4096 app.js

// 查看V8内存统计
const v8 = require('v8');
console.log(v8.getHeapStatistics());
// {
//   total_heap_size: ...,
//   used_heap_size: ...,
//   heap_size_limit: ...
// }
```

## 弱引用对GC的影响

```javascript
// 弱引用不会阻止GC回收对象
// WeakMap、WeakSet、WeakRef

const weakMap = new WeakMap();
let obj = { data: 'test' };
weakMap.set(obj, 'value');
obj = null; // obj被回收，WeakMap中的键值对自动移除

// WeakRef（ES2021）
let target = { name: 'target' };
const ref = new WeakRef(target);

// 通过deref()获取目标对象
console.log(ref.deref()?.name); // 'target'

target = null;
// GC可能已经回收target
console.log(ref.deref()); // undefined 或 对象

// FinalizationRegistry — 监听对象被回收
const registry = new FinalizationRegistry((heldValue) => {
  console.log(`对象 ${heldValue} 被回收了`);
});

let obj2 = { name: 'obj2' };
registry.register(obj2, 'obj2的标识');
obj2 = null; // 当obj2被GC回收时，会触发回调
```
