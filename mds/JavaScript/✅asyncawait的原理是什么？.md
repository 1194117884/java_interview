# ✅async/await的原理是什么？

# 典型回答

`async/await` 是ES2017引入的异步编程语法糖，其**本质是 Generator（生成器） + Promise 的组合**。

**async函数：**
- 返回一个Promise对象
- 内部可以使用await关键字
- 函数内的返回值会被Promise.resolve()包装

**await表达式：**
- 暂停当前async函数的执行
- 等待一个Promise的settled结果
- 如果等待的是非Promise值，会被Promise.resolve()包装
- 恢复async函数的执行，并返回Promise的resolved值

**运行机制：**
async/await 通过类似"自动执行生成器"的方式，每次遇到await就暂停函数执行，等待Promise完成后自动恢复执行。这背后依赖于事件循环的**微任务（microtask）**机制。

# 扩展知识

## 手动实现async/await

```javascript
// 模拟async/await的核心实现
function asyncToGenerator(generatorFn) {
  // 返回一个函数，调用后返回Promise
  return function(...args) {
    const gen = generatorFn.apply(this, args);

    return new Promise((resolve, reject) => {
      function step(key, arg) {
        try {
          const result = gen[key](arg);
          const { value, done } = result;

          if (done) {
            // 生成器执行完毕，resolve最终值
            resolve(value);
          } else {
            // 将yield的值视为Promise，等待它完成
            Promise.resolve(value).then(
              // 成功时继续执行下一个yield
              val => step('next', val),
              // 失败时向生成器注入错误
              err => step('throw', err)
            );
          }
        } catch (err) {
          reject(err);
        }
      }

      // 开始执行生成器
      step('next');
    });
  };
}

// 使用示例
const asyncFunc = asyncToGenerator(function* () {
  const a = yield Promise.resolve(1);
  console.log('a =', a);
  const b = yield Promise.resolve(2);
  console.log('b =', b);
  const c = yield Promise.resolve(3);
  console.log('c =', c);
  return a + b + c;
});

asyncFunc().then(result => {
  console.log('result:', result); // 6
});
```

## async函数总是返回Promise

```javascript
// async函数总是返回Promise（即使没有await）
async function fn1() {
  return 'hello';
}
console.log(fn1()); // Promise { 'hello' }
fn1().then(console.log); // 'hello'

// 没有return时返回undefined的Promise
async function fn2() {}
fn2().then(console.log); // undefined

// 抛出错误返回rejected Promise
async function fn3() {
  throw new Error('出错了');
}
fn3().catch(e => console.log(e.message)); // '出错了'

// 返回Promise时不会额外包装
const p = Promise.resolve(42);
async function fn4() {
  return p;
}
console.log(fn4() === p); // false（返回的是新的Promise，但结果相同）
fn4().then(console.log); // 42
```

## await的表达式

```javascript
async function example() {
  // await Promise值
  const a = await Promise.resolve(1);
  console.log(a); // 1

  // await非Promise值（被Promise.resolve包装）
  const b = await 42;
  console.log(b); // 42

  // await thenable对象
  const c = await { then(resolve) { resolve('thenable'); } };
  console.log(c); // 'thenable'

  // await一个rejected Promise
  try {
    await Promise.reject(new Error('失败'));
  } catch (e) {
    console.log(e.message); // '失败'
  }

  // 不需要await的情况（没有依赖后续操作）
  // 错误做法：
  const user = await fetchUser();  // 不需要await
  const post = await fetchPost();  // 两个独立操作

  // 正确做法：
  const [user2, post2] = await Promise.all([
    fetchUser(),
    fetchPost()
  ]);
}
```

## await的串行与并行

```javascript
// 串行执行（耗时：5秒）
async function serial() {
  console.time('serial');
  const a = await delay(1, 'A'); // 1秒
  const b = await delay(1, 'B'); // 1秒
  const c = await delay(1, 'C'); // 1秒
  console.timeEnd('serial'); // ~3秒
}

// 并行执行（耗时：1秒）
async function parallel() {
  console.time('parallel');
  const [a, b, c] = await Promise.all([
    delay(1, 'A'),
    delay(1, 'B'),
    delay(1, 'C')
  ]);
  console.timeEnd('parallel'); // ~1秒
}

// 条件性串行
async function conditional(userId) {
  const user = await fetchUser(userId);

  // 需要user结果才能继续
  const orders = await fetchOrders(user.id);
  const details = await fetchDetails(orders[0].id);

  // 不需要user结果的并行操作
  const [notifications, messages] = await Promise.all([
    fetchNotifications(user.id),
    fetchMessages(user.id)
  ]);

  return { user, orders, details, notifications, messages };
}
```

## await在循环中的使用

```javascript
// for循环中正确使用await
async function processItems(items) {
  for (const item of items) {
    // 每次迭代都等待，但串行执行
    await processItem(item);
  }
}

// forEach中的await不会等待（错误用法）
async function wrongProcess(items) {
  items.forEach(async (item) => {
    await processItem(item); // forEach不返回Promise
  });
  console.log('forEach结束，但processItem还在执行');
}

// 正确的并行处理
async function parallelProcess(items) {
  await Promise.all(items.map(item => processItem(item)));
}

// 带限制的并发
async function limitedConcurrency(items, limit) {
  const results = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    const batchResults = await Promise.all(batch.map(item => processItem(item)));
    results.push(...batchResults);
  }
  return results;
}

// reduce中的串行
async function sequentialProcess(items) {
  return items.reduce(async (promise, item) => {
    const results = await promise;
    const result = await processItem(item);
    return [...results, result];
  }, Promise.resolve([]));
}
```

## async/await与事件循环

```javascript
console.log('1: 同步开始');

async function test() {
  console.log('2: async函数开始执行');
  const result = await 'await值';
  console.log('4: await后的代码（微任务）', result);
}

test();

console.log('3: 同步结束');

// 输出顺序：
// 1: 同步开始
// 2: async函数开始执行（执行到await前）
// 3: 同步结束
// 4: await后的代码（微任务）

// 这是因为await会创建一个微任务
```

## async/await的转换编译

```javascript
// 源码
async function fetchData() {
  const user = await fetchUser();
  const posts = await fetchPosts(user.id);
  return { user, posts };
}

// Babel转译后的简化版
function fetchData() {
  return asyncToGenerator(function* () {
    const user = yield fetchUser();
    const posts = yield fetchPosts(user.id);
    return { user, posts };
  });
}
```

## async/await常见错误

```javascript
// 1. 忘记await
async function getUser() {
  const user = fetchUser();  // 忘记await，得到Promise而不是结果
  console.log(user.name);    // undefined
}

// 2. 不必要的串行
async function getData() {
  const user = await fetchUser();
  const posts = await fetchPosts();  // 可以和user并行获取
}

// 3. try/catch包裹范围过大
async function badErrorHandling() {
  try {
    const user = await fetchUser();
    const posts = await fetchPosts(user.id);
    // 如果posts失败，这里会捕获所有错误
  } catch (e) {
    // 区分不了是fetchUser还是fetchPosts的错误
  }
}

// 4. 在Promise回调中使用async没有意义
arr.forEach(async (item) => {
  await process(item);  // forEach不等待
});

// 5. await Promise.all中某个reject的问题
const results = await Promise.all([
  fetchA(),
  fetchB(),
  fetchC()
]).catch(e => {
  // 只要有一个失败，全部丢失
});

// 修复：使用allSettled
const results2 = await Promise.allSettled([
  fetchA(), fetchB(), fetchC()
]);
```
