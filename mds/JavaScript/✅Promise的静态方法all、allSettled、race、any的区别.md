# ✅Promise的静态方法all、allSettled、race、any的区别

# 典型回答

Promise提供了四个静态方法用于处理多个Promise实例的组合：

| 方法 | 成功条件 | 失败条件 | 返回结果 | ES版本 |
|------|---------|---------|---------|-------|
| `Promise.all` | 所有Promise都fulfilled | 任意一个rejected | 所有结果的数组/第一个拒绝原因 | ES2015 |
| `Promise.race` | 第一个Promise完成（不论fulfilled/rejected） | 同左 | 第一个完成的值/原因 | ES2015 |
| `Promise.allSettled` | 所有Promise都settled（完成或拒绝） | 永不reject | 每个Promise的状态和结果 | ES2020 |
| `Promise.any` | 任意一个fulfilled | 所有都rejected（返回AggregateError） | 第一个fulfilled的值 | ES2021 |

**核心区别速记：**
- **all**：全部成功才成功，一个失败即失败
- **race**：谁先settled（不管成功还是失败）就返回谁
- **allSettled**：等所有都settled，不关心成功还是失败
- **any**：一个成功就成功，全部失败才失败

# 扩展知识

## Promise.all 详解

```javascript
// 全部成功
const p1 = Promise.resolve(1);
const p2 = Promise.resolve(2);
const p3 = Promise.resolve(3);

Promise.all([p1, p2, p3])
  .then(values => console.log(values)) // [1, 2, 3]
  .catch(err => console.error(err));

// 其中一个失败
const p4 = Promise.reject(new Error('失败'));
const p5 = Promise.resolve(2);
const p6 = Promise.resolve(3);

Promise.all([p4, p5, p6])
  .then(values => console.log('不会执行'))
  .catch(err => console.error(err.message)); // '失败'

// 注意：如果一个rejected，其他Promise仍然会执行
const slowPromise = new Promise(resolve => {
  setTimeout(() => {
    console.log('slowPromise仍然执行了');
    resolve('慢');
  }, 2000);
});

Promise.all([
  Promise.reject(new Error('快速失败')),
  slowPromise
]).catch(err => console.log('捕获:', err.message));
// 输出：
// 捕获: 快速失败
// slowPromise仍然执行了（2秒后）

// 所有值必须都是Promise，非Promise值会被Promise.resolve包装
Promise.all([1, 'hello', true]).then(console.log); // [1, 'hello', true]

// 应用：并行请求
const [users, products, orders] = await Promise.all([
  fetch('/api/users').then(r => r.json()),
  fetch('/api/products').then(r => r.json()),
  fetch('/api/orders').then(r => r.json())
]);
```

## Promise.race 详解

```javascript
// 超时控制
function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('超时')), ms);
  });
  return Promise.race([promise, timeout]);
}

const slowRequest = new Promise(resolve =>
  setTimeout(() => resolve('数据'), 3000)
);

withTimeout(slowRequest, 2000)
  .then(data => console.log(data))
  .catch(err => console.error(err.message)); // '超时'

// 第一个settled（无论成功失败）即返回
const p1 = new Promise(resolve => setTimeout(() => resolve('快'), 100));
const p2 = new Promise((_, reject) => setTimeout(() => reject('更快失败'), 50));

Promise.race([p1, p2])
  .then(v => console.log('成功:', v))
  .catch(e => console.log('失败:', e));
// 输出：失败: 更快失败（50ms先settled）

// 注意：未被选中的Promise仍然会执行完
const unselected = new Promise(resolve => {
  setTimeout(() => {
    console.log('未被选中的Promise也执行了');
    resolve('数据');
  }, 1000);
});

Promise.race([
  Promise.resolve('立即结果'),
  unselected
]).then(v => console.log('选中的:', v));
// 输出：
// 选中的: 立即结果
// 未被选中的Promise也执行了（1秒后）
```

## Promise.allSettled 详解

```javascript
// 等所有Promise完成，不关心成功或失败
const promises = [
  Promise.resolve(1),
  Promise.reject(new Error('错误A')),
  new Promise(resolve => setTimeout(() => resolve(3), 100)),
  Promise.reject(new Error('错误B'))
];

Promise.allSettled(promises).then(results => {
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      console.log(`Promise ${i}: 成功`, result.value);
    } else {
      console.log(`Promise ${i}: 失败`, result.reason.message);
    }
  });
});

// 输出：
// Promise 0: 成功 1
// Promise 1: 失败 错误A
// Promise 2: 成功 3
// Promise 3: 失败 错误B

// 区别于Promise.all：allSettled永不进入catch
Promise.allSettled([
  Promise.reject('错误1'),
  Promise.reject('错误2')
]).then(results => {
  console.log('总会进入then');
  console.log(results.filter(r => r.status === 'rejected').length); // 2
});

// 应用：批量操作，需要知道每个操作的结果
async function batchProcess(items) {
  const results = await Promise.allSettled(
    items.map(item => processItem(item))
  );

  const succeeded = results.filter(r => r.status === 'fulfilled').map(r => r.value);
  const failed = results.filter(r => r.status === 'rejected').map(r => r.reason);

  console.log(`成功: ${succeeded.length}, 失败: ${failed.length}`);
  return { succeeded, failed };
}
```

## Promise.any 详解

```javascript
// 第一个成功的返回
const p1 = Promise.reject('错误1');
const p2 = new Promise(resolve => setTimeout(() => resolve('成功2'), 200));
const p3 = Promise.reject('错误3');

Promise.any([p1, p2, p3])
  .then(v => console.log('第一个成功:', v)) // '第一个成功: 成功2'
  .catch(e => console.error('全部失败:', e));

// 全部失败：返回AggregateError
const allFails = [
  Promise.reject(new Error('错误A')),
  Promise.reject(new Error('错误B')),
];

Promise.any(allFails)
  .then(v => console.log('不会执行'))
  .catch(e => {
    console.log(e instanceof AggregateError); // true
    console.log(e.errors.length);             // 2
    console.log(e.errors[0].message);         // '错误A'
    console.log(e.errors[1].message);         // '错误B'
  });

// 应用场景：从多个镜像/服务中选择最快的成功响应
async function fetchFromMirrors(urls) {
  const fetches = urls.map(url =>
    fetch(url).then(r => r.json())
  );
  return Promise.any(fetches);
}

// 空数组：永远pending
// Promise.any([]).then(console.log); // 永远不会resolve或reject（pending forever）

// 与非Promise值
Promise.any([1, 2, 3]).then(v => console.log(v)); // 1
```

## 四者对比表

| 特性 | all | race | allSettled | any |
|------|:---:|:----:|:----------:|:---:|
| 输入为空数组 | ✅ resolved([]) | 永远pending | ✅ resolved([]) | ❌ rejected(AggregateError) |
| 需要全部成功 | ✅ | ❌ | ❌ | ❌ |
| 一个成功即返回 | ❌ | ✅ | ❌ | ✅ |
| 一个失败即返回 | ✅(全部才成功) | ✅ | ❌ | ❌(全部才失败) |
| 返回所有结果 | ✅（全部成功时） | ❌ | ✅ | ❌ |
| 是否可能reject | ✅（任一失败） | ✅（第一个失败） | ❌（永不） | ✅（全部失败） |
| 返回类型 | Array | 单个值 | Array of Settlement | 单个值 |
| 失败类型 | Error | Error | 不失败 | AggregateError |

## 实战选择指南

```javascript
// 1. 需要所有数据 → Promise.all
const [user, posts] = await Promise.all([
  fetchUser(id),
  fetchPosts(id)
]);

// 2. 只取最快的结果 → Promise.race
const cached = getFromCache(key);
const fresh = fetchFromNetwork(key);
const data = await Promise.race([cached, fresh]);

// 3. 不关心失败，只要成功 → Promise.any
const result = await Promise.any([
  fetchFromCDN(url),
  fetchFromOrigin(url),
  fetchFromBackup(url)
]);

// 4. 需要知道所有结果 → Promise.allSettled
const uploadResults = await Promise.allSettled(
  files.map(f => uploadFile(f))
);
const errors = uploadResults.filter(r => r.status === 'rejected');
if (errors.length > 0) {
  // 部分文件上传失败，记录日志
}
```
