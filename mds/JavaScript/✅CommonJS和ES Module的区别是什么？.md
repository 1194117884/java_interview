# ✅CommonJS和ES Module的区别是什么？

# 典型回答

CommonJS和ES Module是JavaScript最常用的两种模块化方案：

| 对比维度 | CommonJS (CJS) | ES Module (ESM) |
|---------|---------------|-----------------|
| 语法 | `require()` / `module.exports` | `import` / `export` |
| 加载方式 | 运行时加载（动态） | 编译时加载（静态） |
| 输出方式 | 值拷贝（输出值的副本） | 值引用（输出值的只读引用） |
| 加载时机 | 同步加载 | 异步加载（支持静态分析） |
| 支持环境 | Node.js（原生） | 浏览器/Node.js（ES2015+） |
| this指向 | 模块内部的this指向module.exports | 模块顶层的this是undefined |
| 循环依赖 | 可以处理（返回未完成的副本） | 可以处理（通过实时绑定） |
| Tree Shaking | 不支持 | 原生支持 |
| 动态导入 | 天然支持（require是函数） | `import()` 动态导入 |

**核心区别总结：**
- CommonJS是**运行时动态加载**，可以在条件语句中使用require
- ES Module是**编译时静态分析**，import语句会被提升到模块顶部
- CommonJS输出的是值的**拷贝**，ES Module输出的是值的**引用**

# 扩展知识

## 语法对比

```javascript
// CommonJS
// a.js
const value = require('./b');
module.exports = { value };

// 或者
exports.value = value;

// ES Module
// a.js
import { value } from './b.js';
export { value };

// 或者
export const value = 'hello';
```

## 值拷贝 vs 值引用

```javascript
// CommonJS — 值拷贝
// counter.js
let count = 0;
function increment() {
  count++;
}
module.exports = { count, increment };

// main.js
const { count, increment } = require('./counter');
console.log(count); // 0
increment();
console.log(count); // 0 — 依然是0，因为count是值的拷贝

// 解决方法：导出getter
module.exports = {
  get count() { return count; },
  increment
};

// ES Module — 值引用
// counter.js
export let count = 0;
export function increment() {
  count++;
}

// main.js
import { count, increment } from './counter.js';
console.log(count); // 0
increment();
console.log(count); // 1 — 实时反映模块内部的值变化
```

## 静态分析与Tree Shaking

```javascript
// ES Module的静态导入允许工具在编译时进行分析
// 未使用的导出可以被删除（Tree Shaking）

// utils.js
export function used() { return 'used'; }
export function unused() { return 'unused'; }

// main.js
import { used } from './utils.js';
// unused函数可以被Tree Shaking移除

// CommonJS无法进行静态分析
// const utils = require('./utils');
// 无法确定哪些方法被使用，需要全部加载

// Tree Shaking的前提条件：
// 1. ES Module语法（import/export）
// 2. 没有副作用（sideEffects: false in package.json）
// 3. 使用打包工具（webpack/Rollup等）
```

## 动态导入

```javascript
// CommonJS — 可以在任何地方使用require
if (condition) {
  const module = require('./dynamic-module');
  module.doSomething();
}

const moduleName = getModuleName();
const dynamicModule = require(`./${moduleName}`);

// ES Module — 静态import不能动态使用
// import { something } from dynamicPath; // SyntaxError

// ES Module的动态导入使用import()
async function loadModule() {
  if (condition) {
    const module = await import('./dynamic-module.js');
    module.doSomething();
  }

  const moduleName = getModuleName();
  const dynamicModule = await import(`./${moduleName}.js`);
}

// import()返回Promise，可以在浏览器中使用
const [lodash, moment] = await Promise.all([
  import('lodash'),
  import('moment')
]);
```

## 循环依赖处理

```javascript
// CommonJS处理循环依赖
// a.js
const b = require('./b');
console.log('a 加载 b:', b);
module.exports = { name: 'a', bValue: b?.name };

// b.js
const a = require('./a');
console.log('b 加载 a:', a); // a可能还不完整
module.exports = { name: 'b', aValue: a?.name };

// 可能出现aValue为undefined的情况

// ES Module处理循环依赖（通过实时绑定）
// a.js
import { b } from './b.js';
console.log(b); // b的值会实时更新
export const a = 'a';

// b.js
import { a } from './a.js';
console.log(a); // 同样能获取到最新的值
export const b = 'b';
```

## 在Node.js中的使用

```javascript
// Node.js 支持两种模块系统

// 方式1：通过文件扩展名决定
// .mjs — 始终使用ES Module
// .cjs — 始终使用CommonJS
// .js — 由package.json决定

// 方式2：package.json配置
{
  "type": "module",   // .js文件使用ES Module
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  }
}

// 在ES Module中使用CommonJS
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const cjsModule = require('./legacy-module.cjs');

// 在CommonJS中使用ES Module（需要使用动态导入）
async function loadESM() {
  const esModule = await import('./es-module.mjs');
  return esModule.default;
}
```

## import.meta

```javascript
// ES Module中的import.meta对象

// 获取当前模块的URL
console.log(import.meta.url);
// file:///path/to/module.js

// 相当于CommonJS中的__dirname、__filename
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 其他元数据（取决于环境）
// 浏览器：import.meta.url
// Node.js：import.meta.url, import.meta.resolve
```

## 互操作性

| 操作 | CommonJS → ESM | ESM → CommonJS |
|-----|:-------------:|:--------------:|
| import default | 支持（cjs的module.exports映射到default） | 不支持 |
| import named | 部分支持（静态分析可能无法识别） | 不支持 |
| require | 不支持（ESM中没有require） | 支持 |
| import() | 支持 | 支持 |

## 最佳实践

- 新项目使用**ES Module**（标准、静态分析、Tree Shaking）
- 遗留Node.js项目继续使用CommonJS
- 使用`import()`实现代码拆分和按需加载
- 使用`type: "module"`统一项目模块系统
- 库发布时同时提供ESM和CJS两种格式
