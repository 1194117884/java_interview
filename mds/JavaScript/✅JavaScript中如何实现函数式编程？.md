# ✅JavaScript中如何实现函数式编程？

# 典型回答

**函数式编程（Functional Programming, FP）** 是一种以函数为核心的编程范式，强调使用**纯函数**、**避免副作用**、**数据不可变**和**声明式代码**。JavaScript虽然不是纯函数式语言，但通过语言特性和一些技巧可以很好地支持函数式编程。

**函数式编程的核心原则：**

| 原则 | 说明 | JavaScript实现 |
|------|------|---------------|
| 纯函数 | 相同输入始终返回相同输出，无副作用 | 不修改外部变量，不进行I/O操作 |
| 不可变性 | 数据一旦创建不可修改 | const、展开运算符、Object.freeze |
| 函数是一等公民 | 函数可以作为参数和返回值 | 函数可以赋值给变量、传入参数 |
| 高阶函数 | 接收或返回函数的函数 | map/filter/reduce、函数工厂 |
| 柯里化 | 将多参数函数转为单参数函数链 | 闭包 + 递归 |
| 组合 | 组合多个函数为新的函数 | compose/pipe工具函数 |
| 声明式 | 关注"做什么"而非"怎么做" | 数组方法链式调用 |

# 扩展知识

## 纯函数

```javascript
// 纯函数：相同输入 → 相同输出，无副作用
function add(a, b) {
  return a + b; // 纯函数
}

function toUpperCase(str) {
  return str.toUpperCase(); // 纯函数（不修改原字符串）
}

// 非纯函数
let counter = 0;
function increment() {
  return ++counter; // 修改外部变量
}

function getRandom() {
  return Math.random(); // 相同输入不同输出
}

function processUser(user) {
  user.name = 'modified'; // 副作用：修改输入对象
  return user;
}

// 避免副作用的写法
function processUserPure(user) {
  return { ...user, name: 'modified' }; // 返回新对象
}
```

## 不可变性

```javascript
// 保持数据不可变
const arr = [1, 2, 3];

// 修改（可变）
arr.push(4);

// 不可变的方式
const newArr = [...arr, 4]; // [1, 2, 3, 4]
const filtered = arr.filter(x => x > 1); // [2, 3]
const mapped = arr.map(x => x * 2); // [2, 4, 6]

// 对象不可变
const obj = { a: 1, b: { c: 2 } };

// 修改（可变）
obj.a = 10;

// 不可变的方式
const newObj = { ...obj, a: 10 };
const deepNewObj = { ...obj, b: { ...obj.b, c: 20 } };

// 使用Object.freeze（浅冻结）
const frozen = Object.freeze({ a: 1 });
// frozen.a = 2; // 严格模式报错

// 使用Immutable.js（重度场景）
// import { Map } from 'immutable';
// const map = Map({ a: 1 });
// const newMap = map.set('a', 2);
```

## 高阶函数

```javascript
// 接收函数作为参数
function map(arr, fn) {
  const result = [];
  for (const item of arr) {
    result.push(fn(item));
  }
  return result;
}

// 返回函数作为结果（函数工厂）
function multiply(factor) {
  return function(number) {
    return number * factor;
  };
}

const double = multiply(2);
const triple = multiply(3);
console.log(double(5)); // 10
console.log(triple(5)); // 15

// 常用高阶函数
const numbers = [1, 2, 3, 4, 5];

// map — 转换
const doubled = numbers.map(x => x * 2);

// filter — 过滤
const evens = numbers.filter(x => x % 2 === 0);

// reduce — 归约
const sum = numbers.reduce((acc, x) => acc + x, 0);
```

## 柯里化

```javascript
// 手动柯里化
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return function(...args2) {
      return curried.apply(this, args.concat(args2));
    };
  };
}

// 使用
const add = curry((a, b, c) => a + b + c);
console.log(add(1, 2, 3));    // 6
console.log(add(1)(2, 3));    // 6
console.log(add(1)(2)(3));    // 6

// 实际应用：格式化日志
const log = curry((level, tag, message) => {
  console.log(`[${level}][${tag}] ${message}`);
});

const info = log('INFO');
const error = log('ERROR');

const infoAPI = info('API');
const errorDB = error('DB');

infoAPI('请求成功');  // [INFO][API] 请求成功
errorDB('连接超时');  // [ERROR][DB] 连接超时

// 简化版：箭头函数柯里化
const multiply = a => b => a * b;
const double2 = multiply(2);
console.log(double2(5)); // 10
```

## 函数组合

```javascript
// compose — 从右到左组合
function compose(...fns) {
  return function(input) {
    return fns.reduceRight((result, fn) => fn(result), input);
  };
}

// pipe — 从左到右组合
function pipe(...fns) {
  return function(input) {
    return fns.reduce((result, fn) => fn(result), input);
  };
}

// 使用
const toUpper = str => str.toUpperCase();
const exclaim = str => str + '!';
const repeat = str => str + ' ' + str;

const shout = compose(exclaim, toUpper, repeat);
console.log(shout('hello')); // 'HELLO HELLO!'

const shoutPipe = pipe(repeat, toUpper, exclaim);
console.log(shoutPipe('hello')); // 'HELLO HELLO!'

// 实际应用：数据处理管道
const users = [
  { name: 'Alice', age: 25, active: true },
  { name: 'Bob', age: 30, active: false },
  { name: 'Charlie', age: 35, active: true }
];

const getActiveUsers = users => users.filter(u => u.active);
const getNames = users => users.map(u => u.name);
const toUpperCase = names => names.map(n => n.toUpperCase());

const getActiveUserNames = pipe(getActiveUsers, getNames, toUpperCase);
console.log(getActiveUserNames(users)); // ['ALICE', 'CHARLIE']
```

## 声明式编程

```javascript
// 命令式 vs 声明式

// 命令式（如何做）
function sumEvens(numbers) {
  let sum = 0;
  for (let i = 0; i < numbers.length; i++) {
    if (numbers[i] % 2 === 0) {
      sum += numbers[i];
    }
  }
  return sum;
}

// 声明式（做什么）
const sumEvensDeclarative = numbers =>
  numbers
    .filter(n => n % 2 === 0)
    .reduce((sum, n) => sum + n, 0);

// 另一个例子
// 命令式
function getFirstNames(people) {
  const result = [];
  for (let i = 0; i < people.length; i++) {
    if (people[i].age >= 18) {
      result.push(people[i].firstName);
    }
  }
  return result;
}

// 声明式
const getFirstNamesDeclarative = people =>
  people
    .filter(p => p.age >= 18)
    .map(p => p.firstName);
```

## 函子（Functor）

```javascript
// 函子：实现了map方法的容器
const Box = value => ({
  map: fn => Box(fn(value)),
  fold: fn => fn(value),
  inspect: () => `Box(${value})`
});

// 使用
const result = Box(5)
  .map(x => x * 2)
  .map(x => x + 1)
  .fold(x => x);

console.log(result); // 11

// Either 函子（错误处理）
const Right = value => ({
  map: fn => Right(fn(value)),
  fold: (leftFn, rightFn) => rightFn(value),
  chain: fn => fn(value),
  inspect: () => `Right(${value})`
});

const Left = value => ({
  map: fn => Left(value),
  fold: (leftFn, rightFn) => leftFn(value),
  chain: fn => Left(value),
  inspect: () => `Left(${value})`
});

// 使用Either进行错误处理
function safeDivide(a, b) {
  return b === 0
    ? Left('Division by zero')
    : Right(a / b);
}

const result2 = safeDivide(10, 2)
  .map(x => x + 1)
  .fold(
    err => console.error(err),
    val => console.log(val)
  ); // 6
```

## 实际应用示例

```javascript
// 数据处理的函数式风格
const orders = [
  { id: 1, items: [{ price: 10 }, { price: 20 }], status: 'completed' },
  { id: 2, items: [{ price: 30 }], status: 'pending' },
  { id: 3, items: [{ price: 15 }, { price: 25 }, { price: 35 }], status: 'completed' }
];

const getCompletedOrderTotal = pipe(
  orders => orders.filter(o => o.status === 'completed'),
  orders => orders.flatMap(o => o.items),
  items => items.map(i => i.price),
  prices => prices.reduce((sum, p) => sum + p, 0)
);

console.log(getCompletedOrderTotal(orders)); // 105

// 状态管理的函数式风格（类似Redux）
const createStore = (reducer, initialState) => {
  let state = initialState;
  const listeners = [];

  return {
    getState: () => state,
    dispatch: action => {
      state = reducer(state, action);
      listeners.forEach(l => l());
    },
    subscribe: listener => {
      listeners.push(listener);
      return () => listeners.splice(listeners.indexOf(listener), 1);
    }
  };
};

// 纯函数reducer
const counterReducer = (state = 0, action) => {
  switch (action.type) {
    case 'INCREMENT': return state + 1;
    case 'DECREMENT': return state - 1;
    case 'RESET': return 0;
    default: return state;
  }
};
```

## 函数式编程的优缺点

| 优点 | 缺点 |
|------|------|
| 代码更简洁、可读性更好 | 性能可能较差（大量创建新对象） |
| 无副作用，易于测试 | 与面向对象范式冲突 |
| 并发安全（不可变数据） | 调试困难（难以追踪状态变化） |
| 模块化程度高 | 某些场景代码过于抽象 |
| 容易推理和调试 | 学习曲线较陡 |

## 最佳实践

- 优先使用数组方法（map/filter/reduce）代替循环
- 避免修改变量和对象（使用const + 展开运算）
- 保持函数小且专注（单一职责）
- 使用箭头函数简化函数表达
- 使用compose/pipe组合函数
- 纯函数优先，副作用隔离
- 不可变数据优先，必要时使用Immer/Immutable.js
- 不滥用柯里化和组合，保持代码可读性
