# ✅什么是生成器函数？yield关键字的作用是什么？

# 典型回答

**生成器函数（Generator Function）** 是ES6引入的一种特殊函数，使用 `function*` 声明。生成器函数返回一个**Generator对象**，该对象既符合**可迭代协议**也符合**迭代器协议**。

**核心特点：**
- 使用 `function*` 定义
- 函数体内部使用 `yield` 关键字暂停执行
- 调用生成器函数不会立即执行函数体，而是返回一个迭代器对象
- 通过调用 `next()` 方法分步执行函数体

**yield关键字的作用：**
- **暂停**函数执行，保存当前执行上下文
- **产出**一个值给外部（作为next()返回值中的value）
- **接收**外部传入的值（作为yield表达式的返回值）
- 控制生成器的执行流程

# 扩展知识

## 生成器的基本使用

```javascript
function* numberGenerator() {
  yield 1;
  yield 2;
  yield 3;
}

const gen = numberGenerator();
console.log(gen.next()); // { value: 1, done: false }
console.log(gen.next()); // { value: 2, done: false }
console.log(gen.next()); // { value: 3, done: false }
console.log(gen.next()); // { value: undefined, done: true }

// 生成器是可迭代的
for (const value of numberGenerator()) {
  console.log(value); // 1 2 3
}

console.log([...numberGenerator()]); // [1, 2, 3]
```

## yield的双向通信

`yield` 不仅可以产出值，还能接收外部通过 `next()` 传入的值：

```javascript
function* twoWay() {
  const a = yield '请输入a';
  console.log('收到a:', a);
  const b = yield '请输入b';
  console.log('收到b:', b);
  return a + b;
}

const gen = twoWay();
console.log(gen.next());        // { value: '请输入a', done: false }
console.log(gen.next(10));      // 收到a: 10  { value: '请输入b', done: false }
console.log(gen.next(20));      // 收到b: 20  { value: 30, done: true }
```

## yield* 委托

`yield*` 用于在生成器内部委托给另一个可迭代对象或生成器：

```javascript
function* inner() {
  yield 'a';
  yield 'b';
}

function* outer() {
  yield 1;
  yield* inner();    // 委托给inner生成器
  yield* [2, 3];     // 委托给数组
  yield* 'hi';       // 委托给字符串
  yield 4;
}

console.log([...outer()]);
// [1, 'a', 'b', 2, 3, 'h', 'i', 4]

// yield* 可以接收返回值
function* withReturn() {
  const result = yield* [1, 2, 3];
  yield result;
  return 'done';
}
console.log([...withReturn()]); // [1, 2, 3, 3]
```

## 生成器的return()和throw()

```javascript
function* myGen() {
  try {
    yield 1;
    yield 2;
    yield 3;
  } catch (e) {
    yield `捕获异常: ${e}`;
  }
  yield 4;
  yield 5;
}

const gen = myGen();
console.log(gen.next());      // { value: 1, done: false }
console.log(gen.return('结束')); // { value: '结束', done: true } — 提前结束
console.log(gen.next());      // { value: undefined, done: true }

// throw() 向生成器内部注入异常
const gen2 = myGen();
console.log(gen2.next());          // { value: 1, done: false }
console.log(gen2.throw('出错了')); // { value: '捕获异常: 出错了', done: false }
console.log(gen2.next());          // { value: 4, done: false }
```

## 生成器的实际应用场景

```javascript
// 1. 实现迭代器
class Range {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }
  *[Symbol.iterator]() {
    for (let i = this.start; i <= this.end; i++) {
      yield i;
    }
  }
}
for (const n of new Range(1, 5)) console.log(n);

// 2. 控制异步流程（Redux-Saga核心）
function* fetchUserFlow() {
  try {
    yield put({ type: 'FETCH_START' });
    const user = yield call(api.fetchUser);  // call是effect创建函数
    yield put({ type: 'FETCH_SUCCESS', payload: user });
  } catch (error) {
    yield put({ type: 'FETCH_ERROR', error });
  }
}

// 3. 惰性求值（无限序列）
function* fibonacci() {
  let a = 0, b = 1;
  while (true) {  // 无限循环是安全的
    yield a;
    [a, b] = [b, a + b];
  }
}
const fib = fibonacci();
console.log(fib.next().value); // 0
console.log(fib.next().value); // 1
console.log(fib.next().value); // 1
console.log(fib.next().value); // 2
// 只取需要的值，不会浪费计算

// 4. 状态机
function* stateMachine() {
  let state = 'idle';
  while (true) {
    if (state === 'idle') {
      state = yield '等待输入';
    } else if (state === 'running') {
      state = yield '正在执行...';
    } else if (state === 'done') {
      yield '完成';
      return;
    }
  }
}

// 5. 扁平化嵌套数组
function* flatten(arr) {
  for (const item of arr) {
    if (Array.isArray(item)) {
      yield* flatten(item);
    } else {
      yield item;
    }
  }
}
const flat = [...flatten([1, [2, [3, 4], 5], 6])];
console.log(flat); // [1, 2, 3, 4, 5, 6]
```

## 生成器的内存和性能特性

```javascript
// 生成器是惰性求值 — 只在需要时计算
function* infiniteSequence() {
  let i = 0;
  while (true) {
    yield i++;
  }
}

// 不会耗尽内存，因为只计算需要的值
const seq = infiniteSequence();
for (let i = 0; i < 5; i++) {
  console.log(seq.next().value); // 0, 1, 2, 3, 4
}

// 对比数组方案 — 会创建并占用大量内存
function infiniteArray() {
  const arr = [];
  for (let i = 0; i < 1000000; i++) {
    arr.push(i);
  }
  return arr;
}
```

## 生成器与async/await的关系

```javascript
// async/await 本质上是生成器 + Promise 的语法糖
// 简化版实现
function asyncToGenerator(generatorFn) {
  return function(...args) {
    const gen = generatorFn.apply(this, args);
    return new Promise((resolve, reject) => {
      function step(key, arg) {
        try {
          const result = gen[key](arg);
          const { value, done } = result;
          if (done) {
            resolve(value);
          } else {
            Promise.resolve(value).then(
              v => step('next', v),
              e => step('throw', e)
            );
          }
        } catch (err) {
          reject(err);
        }
      }
      step('next');
    });
  };
}

// 使用
const asyncFunc = asyncToGenerator(function* () {
  const a = yield Promise.resolve(1);
  const b = yield Promise.resolve(2);
  return a + b;
});
asyncFunc().then(console.log); // 3
```

## 生成器的缺点

- **不可随机访问**：必须顺序调用next()，不能跳过
- **一次性**：生成器状态耗尽后不能重置
- **调试困难**：断点调试时难以追踪yield之间的状态
- **错误处理复杂**：try/catch跨yield的异常处理需要谨慎
- **性能开销**：相比普通函数有额外的上下文保存恢复开销
