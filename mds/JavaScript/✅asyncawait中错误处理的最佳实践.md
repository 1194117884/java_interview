# ✅async/await中错误处理的最佳实践

# 典型回答

async/await的错误处理主要有以下几种方式：

## 1. try/catch（推荐）
在async函数内部使用try/catch包裹可能出错的await调用。

## 2. Promise的catch方法
在async函数外部对返回的Promise调用catch。

## 3. 全局错误处理
处理未捕获的promise异常。

```javascript
// 方式一：try/catch（推荐）
async function getUser(id) {
  try {
    const response = await fetch(`/api/users/${id}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('获取用户失败:', error);
    throw error; // 重新抛出或返回默认值
  }
}

// 方式二：在调用处catch
async function getData() {
  const data = await fetchData().catch(error => {
    console.error('获取数据失败:', error);
    return null; // 提供默认值
  });
  return data;
}

// 方式三：Promise链式catch
getUser(123).catch(error => {
  // 处理async函数内部未被捕获的错误
});
```

# 扩展知识

## try/catch的几种模式

```javascript
// 1. 包裹所有await（通用模式）
async function fetchAll() {
  try {
    const user = await fetchUser();
    const posts = await fetchPosts();
    return { user, posts };
  } catch (err) {
    // 无法区分是哪个步骤出错
    console.error('操作失败:', err);
    throw err;
  }
}

// 2. 精细化错误处理（推荐）
async function fetchUserDashboard(userId) {
  let user, posts, notifications;

  try {
    user = await fetchUser(userId);
  } catch (err) {
    console.error('获取用户失败:', err);
    throw new Error('用户数据获取失败');
  }

  // 用户获取成功后再获取其他数据
  try {
    [posts, notifications] = await Promise.all([
      fetchPosts(user.id),
      fetchNotifications(user.id)
    ]);
  } catch (err) {
    console.error('获取辅助数据失败:', err);
    // 可以有默认值
    posts = [];
    notifications = [];
  }

  return { user, posts, notifications };
}

// 3. 并行请求的错误隔离
async function fetchWithIsolation() {
  const results = await Promise.allSettled([
    fetchUser(),
    fetchPosts(),
    fetchNotifications()
  ]);

  const [userResult, postsResult, notifResult] = results;

  if (userResult.status === 'rejected') {
    throw new Error('关键数据获取失败');
  }

  return {
    user: userResult.value,
    posts: postsResult.status === 'fulfilled' ? postsResult.value : [],
    notifications: notifResult.status === 'fulfilled' ? notifResult.value : []
  };
}
```

## 返回默认值的模式

```javascript
// 1. catch返回默认值
async function getConfig(key) {
  try {
    const config = await fetchConfig();
    return config[key];
  } catch {
    return 'default'; // 提供默认值
  }
}

// 2. 使用??操作符
async function getSettings() {
  return (await fetchSettings().catch(() => null)) ?? {};
}

// 3. 错误降级
async function getDataWithFallback() {
  try {
    return await fetchPrimary();
  } catch {
    console.warn('主服务不可用，使用备用');
    return await fetchBackup();
  }
}

// 4. 多重降级
async function getDataWithMultipleFallback() {
  const sources = [fetchPrimary, fetchSecondary, fetchBackup];
  for (const source of sources) {
    try {
      return await source();
    } catch {
      continue; // 尝试下一个
    }
  }
  throw new Error('所有数据源都不可用');
}
```

## 错误类型的区分

```javascript
// 区分不同类型的错误
class NetworkError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'NetworkError';
    this.statusCode = statusCode;
  }
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

async function submitForm(data) {
  try {
    const response = await fetch('/api/submit', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      if (response.status === 400) {
        throw new ValidationError('数据验证失败');
      }
      throw new NetworkError('请求失败', response.status);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ValidationError) {
      // 显示表单验证错误
      showValidationErrors(error.message);
    } else if (error instanceof NetworkError) {
      // 显示网络错误
      showNetworkError(error.message);
    } else if (error instanceof SyntaxError) {
      // JSON解析错误
      console.error('响应格式错误');
    } else {
      // 未知错误
      console.error('未知错误:', error);
    }

    throw error; // 继续向上抛出
  }
}
```

## 全局未捕获Promise错误

```javascript
// 浏览器中
window.addEventListener('unhandledrejection', event => {
  console.warn('未捕获的Promise拒绝:', event.reason);
  event.preventDefault(); // 可选：阻止默认处理
});

// Node.js中
process.on('unhandledRejection', (reason, promise) => {
  console.error('未捕获的Promise拒绝:', reason);
});

// async函数中的未捕获异常
async function badFunction() {
  throw new Error('这个错误会被忽略吗？');
}

badFunction(); // 没有await，也没有catch
// 这会导致unhandledRejection事件触发

// 总是处理async函数的返回值
badFunction().catch(() => {
  // 防止未捕获的异常
});
```

## 避免常见的错误处理陷阱

```javascript
// 陷阱1：在Promise回调中的try/catch无效
async function badPattern() {
  // 错误！try/catch在Promise构造函数中无效
  try {
    new Promise((resolve, reject) => {
      throw new Error('在Promise构造函数中');
    });
  } catch (e) {
    console.log('捕获不到这个错误');
  }
}
// 正确方式：
async function goodPattern() {
  try {
    await new Promise((resolve, reject) => {
      throw new Error('在Promise构造函数中');
    });
  } catch (e) {
    console.log('正确处理:', e.message);
  }
}

// 陷阱2：reject后继续执行
async function rejectThenContinue() {
  try {
    await new Promise((resolve, reject) => {
      reject(new Error('错误'));
      console.log('这行会执行！'); // 错误：reject不终止函数执行
    });
  } catch (e) {
    console.log('捕获错误');
  }
}

// 陷阱3：return await vs return
async function returnVsReturnAwait() {
  try {
    // return await 会在当前async函数的try/catch中捕获
    return await riskyOperation();
  } catch (e) {
    // 可以捕获到错误
    return fallbackValue;
  }
}

async function justReturn() {
  try {
    // 直接return不会在当前try/catch中捕获
    return riskyOperation(); // 返回的是Promise
  } catch (e) {
    // 不能捕获到错误！
    return fallbackValue;
  }
}

// 陷阱4：forEach中的async/await错误
async function forEachError() {
  const items = [1, 2, 3];
  try {
    items.forEach(async (item) => {
      await processItem(item); // forEach不等待
    });
  } catch (e) {
    // 不能捕获到错误！
  }
}
// 正确方式：
async function forEachFixed() {
  const items = [1, 2, 3];
  for (const item of items) {
    try {
      await processItem(item);
    } catch (e) {
      console.error(`处理 ${item} 失败:`, e);
    }
  }
}
```

## 工具函数

```javascript
// 封装错误处理的工具函数

// 1. 永远不抛异常的async函数
async function safeAsync(promise, fallback = null) {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

// 使用
const user = await safeAsync(fetchUser(1), { name: 'anonymous' });

// 2. 返回[error, result]元组（类似Go语言风格）
async function to(promise) {
  try {
    const data = await promise;
    return [null, data];
  } catch (err) {
    return [err, null];
  }
}

// 使用
const [err, user] = await to(fetchUser(123));
if (err) {
  console.error('获取用户失败:', err);
  return;
}
console.log('用户:', user.name);

// 3. 超时包装
async function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('请求超时')), ms);
  });
  return Promise.race([promise, timeout]);
}

// 使用
try {
  const data = await withTimeout(fetchData(), 5000);
} catch (err) {
  if (err.message === '请求超时') {
    // 超时处理
  }
}
```

## 最佳实践总结

```javascript
// 1. 总是在async函数中使用try/catch或在外部调用catch
// 2. 区分错误类型（网络错误、验证错误、业务错误）
// 3. 重要的操作单独try/catch，次要操作可以提供默认值
// 4. 避免在Promise构造函数内部使用try/catch
// 5. 使用Promise.allSettled处理部分失败场景
// 6. 使用return await而不是直接return（在try/catch中）
// 7. 全局监听unhandledRejection事件
// 8. 错误应该包含足够的信息：时间、上下文、详情
// 9. 合理使用错误恢复和降级策略
```
