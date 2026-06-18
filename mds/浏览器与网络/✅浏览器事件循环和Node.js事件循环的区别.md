# ✅浏览器事件循环和Node.js事件循环的区别

# 典型回答

**浏览器事件循环**和**Node.js 事件循环**都是基于 JavaScript 的单线程模型实现的异步机制，但它们在实现细节和执行阶段上有明显的区别。

**核心区别：**

| 对比维度 | 浏览器事件循环 | Node.js 事件循环 |
|---------|--------------|-----------------|
| 规范标准 | HTML Standard | libuv 实现 |
| 宏任务队列 | 多种任务源（script、事件、setTimeout、网络请求等） | 多个阶段（timers、poll、check、close callbacks 等） |
| 微任务队列 | 每个宏任务执行后清空所有微任务 | 每个阶段切换时清空微任务 |
| `process.nextTick` | 不存在 | 有，优先级高于微任务 |
| `setImmediate` | 不存在（仅 IE 有） | 有，属于 check 阶段 |
| 渲染时机 | 宏任务执行完后、下一宏任务前可能渲染 | 无渲染步骤（服务端场景） |

**相同点：**
- 都是单线程模型
- 都有宏任务（MacroTask）和微任务（MicroTask）的概念
- 每次执行完一个宏任务，都会清空微任务队列

# 扩展知识

### 浏览器事件循环模型

```text
浏览器事件循环每次迭代（Tick）的流程：

1. 从宏任务队列中取出一个任务执行
2. 执行过程中产生的微任务（Promise.then、MutationObserver）加入微任务队列
3. 宏任务执行完毕 → 检查微任务队列：
   ├── 按先进先出顺序执行所有微任务
   └── 执行微任务过程中产生的新微任务 → 继续执行（微任务队列必须清空）
4. 检查是否需要更新渲染（requestAnimationFrame 等）
5. requestAnimationFrame 回调执行
6. 浏览器可能进行渲染（重排/重绘）
7. 回到步骤 1，取下一个宏任务
```

```javascript
// 浏览器中的宏任务和微任务
// 宏任务（MacroTask/MacroTask）：setTimeout, setInterval, I/O, UI rendering, 事件回调
// 微任务（MicroTask）：Promise.then/catch/finally, MutationObserver, queueMicrotask

console.log('1');  // 同步代码

setTimeout(() => {
  console.log('2'); // 宏任务
}, 0);

Promise.resolve().then(() => {
  console.log('3'); // 微任务
});

queueMicrotask(() => {
  console.log('4'); // 微任务
});

console.log('5');  // 同步代码

// 输出顺序: 1, 5, 3, 4, 2
// 分析:
// 1. 同步代码: 1, 5
// 2. 清空微任务: 3, 4
// 3. 宏任务 setTimeout: 2
```

### 典型的浏览器事件循环题

```javascript
console.log('start');

setTimeout(() => {
  console.log('timeout1');
  Promise.resolve().then(() => {
    console.log('promise1');
  });
}, 0);

Promise.resolve().then(() => {
  console.log('promise2');
  setTimeout(() => {
    console.log('timeout2');
  }, 0);
});

console.log('end');

// 输出: start, end, promise2, timeout1, promise1, timeout2
// 分析:
// 1. 同步输出: start, end
// 2. 微任务队列: promise2
//    输出 promise2，向宏任务队列添加 timeout2
// 3. 宏任务队列: timeout1
//    输出 timeout1，向微任务队列添加 promise1
// 4. 清空微任务: promise1
// 5. 下一个宏任务: timeout2
```

### Node.js 事件循环模型

Node.js 事件循环基于 **libuv**，包含以下阶段（Phase）：

```text
Node.js 事件循环各阶段：

   ┌───────────────────────────┐
┌─>│           timers           │ ← setTimeout/setInterval 回调执行
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │      pending callbacks    │ ← 上一轮延迟的 I/O 回调
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │       idle, prepare       │ ← 内部使用
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │           poll            │ ← 轮询 I/O 事件（核心阶段）
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │           check           │ ← setImmediate 回调执行
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │      close callbacks      │ ← close 事件（socket.on('close') 等）
│  └───────────────────────────┘
└──────────────────────────────── 循环继续

每个阶段之间会检查并执行微任务队列和 process.nextTick
```

### process.nextTick 和微任务的执行优先级

```javascript
// Node.js 中的 process.nextTick 有特殊的优先级
// 它不属于事件循环的任何阶段，而是在每个阶段之间执行

console.log('1');

setTimeout(() => {
  console.log('2');
}, 0);

process.nextTick(() => {
  console.log('3');
});

Promise.resolve().then(() => {
  console.log('4');
});

setImmediate(() => {
  console.log('5');
});

console.log('6');

// Node.js 中的输出: 1, 6, 3, 4, 2, 5
// 或 (在某些场景下可能是): 1, 6, 3, 4, 5, 2

// 分析:
// 1. 同步输出: 1, 6
// 2. 当前阶段结束，执行 process.nextTick: 3
// 3. 执行微任务 (Promise): 4
// 4. 进入 timers 阶段: 
//    - 如果 setTimeout 已经到期 → 输出 2
//    - 进入 check 阶段 → 输出 5

// 重要：process.nextTick 优先级高于 Promise 微任务！
// nextTick 队列会在每个阶段切换时被完全清空
```

### Node.js 中 setImmediate vs setTimeout(fn, 0)

```javascript
// setImmediate 和 setTimeout(fn, 0) 的执行顺序

// 场景1: 在模块（全局）中执行
setTimeout(() => {
  console.log('timeout');
}, 0);

setImmediate(() => {
  console.log('immediate');
});

// 输出顺序不确定！
// 可能: timeout, immediate
// 可能: immediate, timeout
// 原因: 初始阶段不同，setTimeout 的延迟精度（1ms）导致不确定性

// 场景2: 在 I/O 循环中执行
const fs = require('fs');
fs.readFile(__filename, () => {
  setTimeout(() => {
    console.log('timeout');
  }, 0);
  
  setImmediate(() => {
    console.log('immediate');
  });
});

// 输出: immediate, timeout（确定）
// 原因: readFile 的回调在 poll 阶段执行
// poll 阶段之后是 check 阶段（setImmediate）
// timers 阶段要等到下一次循环
```

### Node.js 微任务执行时机（Node 11+ 与 Node <11 的区别）

```javascript
// Node.js 版本不同，微任务执行行为有差异

// Node < 11 版本：
// 微任务在每个阶段之间执行
setTimeout(() => {
  console.log('timeout1');
  Promise.resolve().then(() => console.log('promise1'));
}, 0);

setTimeout(() => {
  console.log('timeout2');
  Promise.resolve().then(() => console.log('promise2'));
}, 0);

// Node < 11 输出: timeout1, timeout2, promise1, promise2
// 两个 timers 执行完后，才清空微任务

// Node >= 11 版本：
// 行为与浏览器一致：每个宏任务执行后都清空微任务
// Node >= 11 输出: timeout1, promise1, timeout2, promise2
// 与浏览器行为一致
```

### 完整的执行顺序对比

```javascript
// 浏览器和 Node.js 执行顺序对比

async function async1() {
  console.log('async1 start');
  await async2();
  console.log('async1 end');
}

async function async2() {
  console.log('async2');
}

console.log('script start');

setTimeout(() => {
  console.log('setTimeout');
}, 0);

async1();

new Promise((resolve) => {
  console.log('promise1');
  resolve();
}).then(() => {
  console.log('promise2');
});

process.nextTick(() => {
  console.log('nextTick');
});

console.log('script end');

// 浏览器输出:
// script start, async1 start, async2, promise1, script end,
// async1 end, promise2, setTimeout

// Node.js 输出 (Node >= 11):
// script start, async1 start, async2, promise1, script end,
// nextTick, async1 end, promise2, setTimeout

// 区别: Node.js 中 process.nextTick 优先于 Promise 微任务
```

### 各自的最佳实践

```javascript
// 浏览器场景

// 1. 优化用户交互响应
button.addEventListener('click', () => {
  // 先处理高优先级更新
  updateUI();
  
  // 低优先级任务使用 requestIdleCallback
  requestIdleCallback(() => {
    sendAnalytics();
  });
});

// 2. 分解长时间任务
function processLargeArray(data) {
  // 使用 setTimeout 将任务拆分为多个宏任务
  let index = 0;
  function processChunk() {
    const chunkSize = 100;
    const end = Math.min(index + chunkSize, data.length);
    
    for (; index < end; index++) {
      processItem(data[index]);
    }
    
    if (index < data.length) {
      setTimeout(processChunk, 0); // 继续下一块
    }
  }
  processChunk();
}

// 3. 使用 queueMicrotask 处理需要立即执行的异步逻辑
queueMicrotask(() => {
  // 在当前宏任务之后、渲染之前执行
});
```

```javascript
// Node.js 场景

// 1. 使用 setImmediate 替代 setTimeout(fn, 0)
// setImmediate 在 poll 阶段之后执行，更高效
setImmediate(() => {
  console.log('在 I/O 之后立即执行');
});

// 2. 使用 process.nextTick 确保在事件循环继续前执行
// 但注意：递归使用 nextTick 会导致 I/O 饥饿
function maybeSync(callback) {
  // 确保 callback 异步执行（避免 Zalgo 问题）
  if (typeof callback === 'function') {
    process.nextTick(callback);
  }
}

// 3. 避免递归使用 process.nextTick
// ❌ 可能导致 I/O 饿死
function recursiveNextTick() {
  process.nextTick(recursiveNextTick);
}

// ✅ 使用 setImmediate 允许 I/O 轮询
function recursiveImmediate() {
  setImmediate(recursiveImmediate);
}
```
