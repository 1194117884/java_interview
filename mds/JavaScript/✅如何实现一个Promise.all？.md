# ✅如何实现一个Promise.all？

# 典型回答

实现 `Promise.all` 的核心思路是：

1. 接收一个可迭代的Promise集合
2. 返回一个新的Promise
3. 内部遍历所有Promise，收集它们的结果
4. 当所有Promise都fulfilled时，resolve结果数组
5. 只要有一个Promise rejected，立即reject

```javascript
function promiseAll(iterable) {
  return new Promise((resolve, reject) => {
    // 将可迭代对象转换为数组
    const promises = Array.from(iterable);
    const results = [];
    let completed = 0;

    // 处理空数组的情况
    if (promises.length === 0) {
      resolve(results);
      return;
    }

    promises.forEach((promise, index) => {
      // 确保每个值都是Promise
      Promise.resolve(promise)
        .then(value => {
          results[index] = value;  // 保持顺序
          completed++;
          if (completed === promises.length) {
            resolve(results);
          }
        })
        .catch(reject);  // 任何Promise失败，立即reject
    });
  });
}
```

# 扩展知识

## 完整实现（含边界情况）

```javascript
Promise.myAll = function(iterable) {
  return new Promise((resolve, reject) => {
    if (iterable === null || iterable === undefined) {
      reject(new TypeError('Promise.all requires an iterable'));
      return;
    }

    // 处理非可迭代对象
    if (typeof iterable[Symbol.iterator] !== 'function') {
      reject(new TypeError(`${typeof iterable} is not iterable`));
      return;
    }

    const promises = Array.from(iterable);

    if (promises.length === 0) {
      resolve([]);
      return;
    }

    const results = new Array(promises.length);
    let remaining = promises.length;
    let settled = false;  // 防止多次resolve/reject

    promises.forEach((promise, index) => {
      Promise.resolve(promise).then(value => {
        if (settled) return;  // 已经settled，忽略
        results[index] = value;
        remaining--;
        if (remaining === 0) {
          settled = true;
          resolve(results);
        }
      }, reason => {
        if (settled) return;  // 已经settled，忽略
        settled = true;
        reject(reason);
      });
    });
  });
};
```

## 测试验证

```javascript
// 基本功能测试
const p1 = Promise.resolve(1);
const p2 = Promise.resolve(2);
const p3 = Promise.resolve(3);

Promise.myAll([p1, p2, p3]).then(results => {
  console.log(results); // [1, 2, 3]
});

// 混合非Promise值
Promise.myAll([1, 'hello', true]).then(results => {
  console.log(results); // [1, 'hello', true]
});

// 空数组
Promise.myAll([]).then(results => {
  console.log(results); // []
});

// 拒绝测试
const p4 = Promise.reject(new Error('失败'));
const p5 = Promise.resolve(2);
Promise.myAll([p4, p5])
  .then(results => console.log('不会执行'))
  .catch(err => console.error(err.message)); // '失败'

// 保持顺序测试
const delays = [300, 100, 200];
const promiseList = delays.map(delay =>
  new Promise(resolve => setTimeout(() => resolve(delay), delay))
);
Promise.myAll(promiseList).then(results => {
  console.log(results); // [300, 100, 200] — 保持原始顺序
});
```

## 与原生Promise.all的对比

```javascript
// 原生Promise.all的行为
// 1. 参数不是数组但可迭代
const set = new Set([Promise.resolve(1), Promise.resolve(2)]);
Promise.all(set).then(console.log); // [1, 2]
Promise.myAll(set).then(console.log); // [1, 2]

// 2. 非Promise值自动包装
Promise.all([1, { a: 2 }]).then(console.log); // [1, { a: 2 }]

// 3. 非可迭代参数
// Promise.all(null); // TypeError
// Promise.myAll(null); // TypeError

// 4. 迭代器中有非Promise值
Promise.all([1, 2, 3]).then(console.log); // [1, 2, 3]
```

## 性能优化版本

```javascript
// 使用for...of替代forEach（性能稍好）
Promise.promiseAllOptimized = function(iterable) {
  return new Promise((resolve, reject) => {
    const results = [];
    let completed = 0;
    let index = 0;

    for (const item of iterable) {
      const currentIndex = index++;
      Promise.resolve(item).then(value => {
        results[currentIndex] = value;
        completed++;
        if (completed === index) {  // 使用index而不是固定长度（支持动态添加）
          resolve(results);
        }
      }, reject);
    }

    // 空的可迭代对象
    if (index === 0) {
      resolve(results);
    }
  });
};
```

## 应用于Generator

```javascript
// 支持Generator作为参数
function* generatePromises() {
  yield Promise.resolve(1);
  yield Promise.resolve(2);
  yield Promise.resolve(3);
}

Promise.myAll(generatePromises()).then(console.log); // [1, 2, 3]

// 支持异步Generator（需要额外处理）
async function* asyncGenerator() {
  yield 1;
  yield 2;
  yield 3;
}
// Promise.myAll(asyncGenerator()); // 需要特殊处理
```

## 同时实现Promise.allSettled

```javascript
// 基于Promise.all实现allSettled
Promise.myAllSettled = function(iterable) {
  const wrap = promise =>
    Promise.resolve(promise)
      .then(value => ({ status: 'fulfilled', value }))
      .catch(reason => ({ status: 'rejected', reason }));

  return this.myAll(Array.from(iterable).map(wrap));
};

// 测试
Promise.myAllSettled([
  Promise.resolve(1),
  Promise.reject(new Error('err')),
  3
]).then(console.log);
// [
//   { status: 'fulfilled', value: 1 },
//   { status: 'rejected', reason: Error('err') },
//   { status: 'fulfilled', value: 3 }
// ]
```

## Promise.all的局限性

```javascript
// 1. 即使一个Promise失败，其他Promise仍然会执行
Promise.all([
  new Promise(resolve => setTimeout(() => {
    console.log('仍然执行');
    resolve('A');
  }, 100)),
  Promise.reject(new Error('快速失败'))
]).catch(() => {}); // 输出 '仍然执行'

// 2. 不能优雅处理部分失败
// 如果需要部分失败，使用allSettled

// 3. 大并发量的限制
async function processBatch(items, batchSize = 10) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => processItem(item))
    );
    results.push(...batchResults);
  }
  return results;
}
```

## 现代替代方案

```javascript
// 在现代JavaScript中：
// 使用原生 Promise.all
const results = await Promise.all(promises);

// 需要部分失败时使用 allSettled
const settled = await Promise.allSettled(promises);

// 需要自定义并发控制
async function concurrentMap(items, maxConcurrency, fn) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const currentIndex = index++;
      results[currentIndex] = await fn(items[currentIndex], currentIndex);
    }
  }

  const workers = Array.from({ length: maxConcurrency }, worker);
  await Promise.all(workers);
  return results;
}
```
