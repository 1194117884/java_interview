# ✅Promise的三种状态是什么？状态转换规则是怎样的？

# 典型回答

Promise对象代表一个异步操作的最终结果，具有三种状态：

| 状态 | 英文 | 含义 |
|------|------|------|
| 待定 | pending | 初始状态，既没有完成也没有失败 |
| 已完成 | fulfilled | 操作成功完成，产生了结果值 |
| 已拒绝 | rejected | 操作失败，产生了错误原因 |

**状态转换规则：**

1. **单向转换**：状态一旦改变，就**不可逆转**
2. **pending → fulfilled**：调用 `resolve(value)` 时
3. **pending → rejected**：调用 `reject(reason)` 时，或构造函数中抛出异常
4. **fulfilled 和 rejected 之间不可转换**：从pending变为fulfilled后不能再变为rejected，反之亦然

```
                  resolve(value)
    pending ──────────────────────> fulfilled
       │
       │  reject(reason) 或 抛出异常
       └──────────────────────────> rejected
```

**状态转换之后：**
- 如果状态变为 fulfilled，Promise的 `then` 回调中的 `onFulfilled` 会被调用
- 如果状态变为 rejected，`then` 回调中的 `onRejected` 或 `catch` 会被调用
- 状态一旦确定，后续的 `then/catch` 回调会立即执行（异步）

# 扩展知识

## 状态转换的触发方式

```javascript
// 1. resolve() — pending → fulfilled
const p1 = new Promise((resolve) => {
  setTimeout(() => resolve('成功'), 1000);
});
p1.then(console.log); // 1秒后输出 '成功'

// 2. reject() — pending → rejected
const p2 = new Promise((_, reject) => {
  setTimeout(() => reject(new Error('失败')), 1000);
});
p2.catch(console.error); // 1秒后输出 Error: 失败

// 3. 抛出异常 — pending → rejected
const p3 = new Promise(() => {
  throw new Error('同步异常');
});
p3.catch(console.error); // 立即捕获

// 4. 先resolve再reject（无效）
const p4 = new Promise((resolve, reject) => {
  resolve('先成功');
  reject(new Error('后失败')); // 被忽略，状态已经是fulfilled
});
p4.then(console.log); // '先成功'
p4.catch(console.error); // 不会执行

// 5. resolve一个Promise
const p5 = new Promise(resolve => {
  resolve(Promise.resolve('嵌套Promise'));
});
p5.then(console.log); // '嵌套Promise'

// 6. resolve一个thenable对象
const p6 = new Promise(resolve => {
  resolve({
    then(res, rej) {
      res('thenable resolved');
    }
  });
});
p6.then(console.log); // 'thenable resolved'
```

## 状态不可逆的重要意义

```javascript
// 安全保证：一旦成功或失败，状态不再改变
function getUserData(userId) {
  let cancelled = false;

  return new Promise((resolve, reject) => {
    fetch(`/api/users/${userId}`)
      .then(response => {
        if (!cancelled) {
          resolve(response.json());
        }
      })
      .catch(reject);

    // 如果外部取消，cancelled设为true
    // 但fetch已经完成，resolve不会被执行
    // 但API请求已经发送，无法真正取消
  });
}

// Promise状态不可逆保证了then/catch只会执行一次
const promise = new Promise((resolve) => {
  resolve('第一次');
  resolve('第二次'); // 被忽略
  resolve('第三次'); // 被忽略
});
promise.then(console.log); // 只输出 '第一次'
```

## 状态检查

```javascript
// Promise没有直接的API检查当前状态
// 但可以通过then/catch间接观察

// 但我们可以扩展一个状态检查
function createObservablePromise(executor) {
  let state = 'pending';
  let value = undefined;

  const promise = new Promise((resolve, reject) => {
    executor(
      (v) => {
        state = 'fulfilled';
        value = v;
        resolve(v);
      },
      (r) => {
        state = 'rejected';
        value = r;
        reject(r);
      }
    );
  });

  promise.getState = () => ({ state, value });
  return promise;
}

const p = createObservablePromise((resolve) => {
  setTimeout(() => resolve(42), 100);
});
console.log(p.getState()); // { state: 'pending', value: undefined }
setTimeout(() => {
  console.log(p.getState()); // { state: 'fulfilled', value: 42 }
}, 200);
```

## resolve/reject的多次调用

```javascript
// resolve和reject只会生效一次，后续调用被忽略
const p = new Promise((resolve, reject) => {
  resolve(1);
  reject(new Error('失败'));  // 忽略
  resolve(2);                  // 忽略
  reject(new Error('再次失败')); // 忽略
});
p.then(console.log); // 1
p.catch(console.error); // 不执行

// 实际应用：超时处理
function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Timeout'));
    }, ms);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (reason) => {
        clearTimeout(timer);
        reject(reason);
      }
    );
  });
}

// 谁先到？可能是resolve，也可能是reject，但只有一个生效
```

## 异步状态转换

```javascript
// then/catch回调在状态转换后异步执行
console.log('1: 开始');

const p = new Promise(resolve => {
  resolve('3: 立即成功');
});

p.then(console.log);

console.log('2: 同步代码继续');

// 输出顺序：
// 1: 开始
// 2: 同步代码继续
// 3: 立即成功

// 即使Promise是立即resolved的，then回调也是微任务（microtask）
```

## allSettled的状态特点

```javascript
// Promise.allSettled 的每个结果都有自己的状态
const promises = [
  Promise.resolve(1),
  Promise.reject(new Error('err')),
  new Promise(resolve => setTimeout(() => resolve(3), 100))
];

Promise.allSettled(promises).then(results => {
  results.forEach(result => {
    console.log(result.status); // 'fulfilled' 或 'rejected'
    if (result.status === 'fulfilled') {
      console.log('value:', result.value);
    } else {
      console.log('reason:', result.reason);
    }
  });
});

// 输出：
// fulfilled value: 1
// rejected reason: Error: err
// fulfilled value: 3
```

## 状态转换与值穿透

```javascript
// Promise状态转换后携带的值会穿透then链
Promise.resolve(1)
  .then(v => v * 2)     // 返回 2
  .then(v => v + 1)     // 返回 3
  .then(console.log);   // 3

// rejected状态穿透
Promise.reject(new Error('错误'))
  .then(v => console.log('不会执行'))
  .then(v => console.log('也不会执行'))
  .catch(e => console.log('捕获:', e.message)); // '捕获: 错误'

// 错误恢复
Promise.reject(new Error('错误'))
  .catch(e => {
    console.log('处理错误:', e.message);
    return '恢复值';
  })
  .then(v => console.log('恢复后:', v)); // '恢复后: 恢复值'
```
