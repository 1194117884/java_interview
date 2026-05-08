# ✅如何取消一个正在执行的Promise？

# 典型回答

**Promise本身是不支持取消的**，一旦创建就会立即执行，无法从外部终止。但可以通过多种模式实现"取消"的效果：

**常见方案：**

| 方案 | 原理 | 优点 | 缺点 |
|------|------|------|------|
| AbortController | 通过信号量中断fetch请求 | 浏览器内置，标准化 | 仅适用于fetch等特定API |
| 取消标志（flag） | 通过闭包变量标记取消状态 | 简单通用 | 请求不会真正取消 |
| Promise.race | 与"取消Promise"竞赛 | 不用修改原Promise | 需要额外创建取消Promise |
| 包装Promise | 自定义可控的Promise | 灵活可控 | 实现复杂 |

# 扩展知识

## 方案一：AbortController（推荐）

```javascript
// 浏览器原生的取消机制
const controller = new AbortController();
const { signal } = controller;

// fetch请求
fetch('/api/data', { signal })
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(err => {
    if (err.name === 'AbortError') {
      console.log('请求已取消');
    } else {
      console.error('请求出错:', err);
    }
  });

// 取消请求
controller.abort();

// 超时控制
function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  return fetch(url, { signal: controller.signal })
    .then(response => response.json())
    .finally(() => clearTimeout(timeoutId));
}
```

## 方案二：Promise.race + 取消Token

```javascript
// 创建可取消的Promise
function createCancellablePromise(promise) {
  let cancel;
  const cancelPromise = new Promise((_, reject) => {
    cancel = (reason = 'cancelled') => {
      reject(new Error(reason));
    };
  });

  return {
    promise: Promise.race([promise, cancelPromise]),
    cancel
  };
}

// 使用
const fetchPromise = fetch('/api/data').then(r => r.json());
const { promise, cancel } = createCancellablePromise(fetchPromise);

promise
  .then(data => console.log(data))
  .catch(err => {
    if (err.message === 'cancelled') {
      console.log('Promise被取消');
    }
  });

// 取消
cancel();

// 注意：原始Promise仍然会执行并占用资源
// 只是我们不再关心它的结果
```

## 方案三：取消标志（Cancel Flag）

```javascript
// 通过标志变量控制
function cancellableRequest(url) {
  let cancelled = false;

  const promise = fetch(url)
    .then(response => {
      if (cancelled) return null; // 检查取消状态
      return response.json();
    })
    .then(data => {
      if (cancelled) return null;
      return data;
    });

  return {
    promise,
    cancel() {
      cancelled = true;
    }
  };
}

const { promise, cancel } = cancellableRequest('/api/data');
promise.then(data => {
  if (data !== null) {
    console.log('处理数据:', data);
  }
});

// 取消
cancel();

// 简化版本：包装类
class CancellablePromise {
  constructor(executor) {
    this._cancelled = false;

    this._promise = new Promise((resolve, reject) => {
      executor(
        value => {
          if (!this._cancelled) resolve(value);
        },
        reason => {
          if (!this._cancelled) reject(reason);
        }
      );
    });
  }

  get promise() {
    return this._promise;
  }

  cancel() {
    this._cancelled = true;
  }
}

// 使用
const task = new CancellablePromise((resolve) => {
  setTimeout(() => resolve('完成'), 1000);
});
task.promise.then(console.log);
task.cancel(); // 不会输出任何内容
```

## 方案四：自定义包装（最灵活）

```javascript
class CancelToken {
  constructor() {
    this.promise = new Promise((_, reject) => {
      this.reject = reject;
    });
    this.cancelled = false;
  }

  cancel(reason = 'Operation cancelled') {
    this.cancelled = true;
    this.reject(new CancelError(reason));
  }

  throwIfCancelled() {
    if (this.cancelled) {
      throw new CancelError('Operation was cancelled');
    }
  }
}

class CancelError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CancelError';
  }
}

// 在Promise中使用
function createCancellableTask(token) {
  return new Promise((resolve, reject) => {
    // 监听取消信号
    token.promise.catch(reject);

    // 执行异步操作
    const timer = setTimeout(() => {
      token.throwIfCancelled(); // 检查取消状态
      resolve('任务完成');
    }, 2000);

    // 也可以在finally中清理资源
  });
}

// 使用
const token = new CancelToken();
createCancellableTask(token)
  .then(console.log)
  .catch(err => {
    if (err instanceof CancelError) {
      console.log('任务被取消:', err.message);
    }
  });

// 取消
token.cancel('用户取消操作');
```

## 方案五：React Hooks中的取消

```javascript
// React组件中取消异步操作
function useCancellableEffect() {
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const response = await fetch('/api/data');
        const data = await response.json();

        if (!cancelled) {
          setData(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      }
    }

    fetchData();

    // 清理函数：组件卸载时设置取消标志
    return () => {
      cancelled = true;
    };
  }, []);
}

// 使用AbortController
function useAbortableFetch(url) {
  useEffect(() => {
    const controller = new AbortController();

    fetch(url, { signal: controller.signal })
      .then(r => r.json())
      .then(data => setData(data))
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError(err);
        }
      });

    return () => controller.abort();
  }, [url]);
}
```

## 方案六：Promise.finally中的资源清理

```javascript
class AsyncTask {
  constructor() {
    this._cancelled = false;
    this._resources = [];
  }

  cancel() {
    this._cancelled = true;
    this._cleanup();
  }

  async run() {
    try {
      this._resources.push(/* 分配资源 */);
      const result = await this._doWork();
      if (this._cancelled) return null;
      return result;
    } finally {
      this._cleanup();
    }
  }

  _cleanup() {
    // 清理资源：关闭连接、清理定时器等
    this._resources.forEach(r => r.dispose());
    this._resources = [];
  }
}

// 使用
const task = new AsyncTask();
task.run().then(result => {
  if (result !== null) {
    console.log('任务结果:', result);
  }
});

// 取消并清理
task.cancel();
```

## 各方案对比

| 方案 | 真正终止请求 | 资源清理 | 实现复杂度 | 适用场景 |
|------|:-----------:|:-------:|:---------:|---------|
| AbortController | ✅（fetch） | ✅ | 低 | 网络请求 |
| Promise.race | ❌ | ❌ | 低 | 场景通用 |
| 取消标志 | ❌ | 手动 | 低 | 通用 |
| 自定义包装 | ❌ | ✅ | 中 | 复杂场景 |
| React Hook | ❌ | ✅ | 中 | React组件 |

## 注意事项

```javascript
// 1. 取消不是真正的终止
const p = new Promise(resolve => {
  setTimeout(() => {
    console.log('即使调用了cancel，这行也会输出');
    resolve('done');
  }, 2000);
});
// p被取消后，Promise内的代码仍然会执行

// 2. 取消后还要清理资源
async function watchFileChanges() {
  const watcher = fs.watch('file.txt');
  const { promise, cancel } = createCancellablePromise(watcher);

  promise.then(handleChange);

  // 取消时需要关闭watcher
  cancel(); // 还需要 watcher.close()
}

// 3. 避免内存泄漏
// 确保取消后不持有对Promise结果的引用
```

## 总结

- **没有"真正"的Promise取消**机制，只能忽略结果或中断触发源  
- 最佳实践是**AbortController**（用于fetch等Web API）  
- 通用场景用**取消标志**配合资源清理  
- React中利用useEffect的**清理函数**处理  
- 注意在finally中清理定时器、监听器等资源，防止内存泄漏
