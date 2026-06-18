# ✅AMD、CMD、UMD的演进历史

# 典型回答

AMD、CMD、UMD是ES Module出现之前的JavaScript模块化方案，它们代表了前端模块化的发展历程：

**模块化方案演进时间线：**

```
2009: CommonJS (Node.js)
2011: AMD (RequireJS) 
2012: CMD (Sea.js)
2013: UMD (通用兼容方案)
2015: ES Module (标准)
```

**各方案的核心区别：**

| 方案 | 代表库 | 加载方式 | 定义语法 | 主要环境 |
|------|--------|---------|---------|---------|
| CommonJS | Node.js | 同步加载 | `require`/`module.exports` | 服务端 |
| AMD | RequireJS | 异步加载 | `define`/`require` | 浏览器 |
| CMD | Sea.js | 异步加载（就近依赖） | `define`/`require` | 浏览器 |
| UMD | 通用 | 同步或异步 | 兼容CJS/AMD | 通用 |
| ES Module | 标准 | 静态/动态 | `import`/`export` | 所有环境 |

# 扩展知识

## AMD (Asynchronous Module Definition)

AMD是"异步模块定义"，由RequireJS推广，主要解决浏览器中模块的异步加载问题。

```javascript
// AMD模块定义
define('moduleA', ['dependency1', 'dependency2'], function(dep1, dep2) {
  // 模块定义
  const privateVar = 'private';

  return {
    publicMethod() {
      return dep1.method() + dep2.method();
    }
  };
});

// AMD模块加载
require(['moduleA', 'moduleB'], function(moduleA, moduleB) {
  moduleA.publicMethod();
});

// 单文件定义（无依赖）
define('utils', function() {
  return {
    add: (a, b) => a + b
  };
});

// 依赖前置
define('controller', ['model', 'view'], function(model, view) {
  // 所有依赖在函数执行前已加载完毕
  return { init: () => { /* ... */ } };
});
```

## AMD的特点与缺陷

```javascript
// AMD特点：
// 1. 依赖前置（依赖数组在模块开头声明）
// 2. 异步加载（适合浏览器环境）
// 3. 并行加载多个依赖
// 4. 支持插件系统（text!、css!等）

// AMD的问题：
// 1. 代码书写复杂（需要嵌套define/require）
// 2. 依赖前置导致阅读代码不够直观
// 3. 配置复杂（路径映射、shim配置等）

// AMD配置示例
require.config({
  baseUrl: '/js',
  paths: {
    'jquery': 'lib/jquery-3.6.0',
    'lodash': 'lib/lodash.min'
  },
  shim: {
    'backbone': {
      deps: ['jquery', 'underscore'],
      exports: 'Backbone'
    }
  }
});
```

## CMD (Common Module Definition)

CMD是"通用模块定义"，由淘宝的玉伯提出，Sea.js实现。CMD更接近CommonJS的书写风格。

```javascript
// CMD模块定义
define(function(require, exports, module) {
  // 就近依赖：需要时才引入
  var $ = require('jquery');

  if (condition) {
    var dialog = require('./dialog');
    dialog.show();
  }

  exports.doSomething = function() {
    console.log('done');
  };
});

// 定义无依赖模块
define(function(require, exports, module) {
  exports.name = 'CMD Module';
});

// AMD vs CMD 的核心差异：
// AMD: 依赖前置，提前执行
// CMD: 就近依赖，延迟执行
```

## AMD vs CMD 对比

```javascript
// AMD方式
define(['a', 'b', 'c', 'd'], function(a, b, c, d) {
  // 所有依赖必须提前声明
  // 依赖模块会提前执行
  a.doSomething();
  if (false) {
    b.doSomething(); // b仍然会被加载执行
  }
});

// CMD方式
define(function(require, exports, module) {
  var a = require('a');
  a.doSomething();
  if (false) {
    var b = require('b'); // b不会被加载
  }
});

// 执行时机差异：
// AMD: 尽早执行依赖（浏览器并行加载，尽早执行）
// CMD: 就近延迟执行（在require时才执行）
```

## UMD (Universal Module Definition)

UMD是"通用模块定义"，它不是独立的规范，而是**多种模块化方案的兼容模式**，让同一份代码同时支持CommonJS、AMD和全局变量。

```javascript
// UMD典型模式
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD (RequireJS)
    define(['jquery', 'lodash'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS (Node.js)
    module.exports = factory(require('jquery'), require('lodash'));
  } else {
    // 浏览器全局变量
    root.MyLib = factory(root.jQuery, root._);
  }
})(this, function($, _) {
  // 实际的库代码
  const MyLib = {
    version: '1.0.0',
    method: function() {
      return $.trim(' hello ');
    }
  };
  return MyLib;
});
```

## ES Module的标准化

```javascript
// ES Module 最终统一了模块化标准
// 浏览器和Node.js都原生支持

// 静态导入
import { readFile } from 'fs';
import React from 'react';

// 动态导入
const module = await import('./dynamic.js');

// 导出
export const name = 'ES Module';
export default class MyClass {}
export { utility, CONSTANT } from './helper.js';

// ES Module的优势：
// 1. 语言标准，无需第三方库
// 2. 静态分析，支持Tree Shaking
// 3. 异步加载
// 4. 循环依赖处理更好
// 5. 浏览器原生支持（ES2015+）
```

## 模块化方案各阶段对比

| 维度 | 原始script | AMD | CMD | CommonJS | UMD | ES Module |
|------|:---------:|:---:|:---:|:--------:|:---:|:---------:|
| 全局污染 | 严重 | 无 | 无 | 无 | 无 | 无 |
| 依赖管理 | 手动 | 自动 | 自动 | 自动 | 自动 | 自动 |
| 异步加载 | 不支持 | 支持 | 支持 | 不支持 | 取决于环境 | 支持 |
| 浏览器支持 | 原生 | 需库 | 需库 | 不支持（需打包） | 需打包 | 现代浏览器 |
| 服务端支持 | 不支持 | 不支持 | 不支持 | 原生 | 需转换 | Node 14+ |
| Tree Shaking | 不支持 | 不支持 | 不支持 | 不支持 | 不支持 | 支持 |
| 循环依赖 | N/A | 有限 | 有限 | 有限 | 有限 | 好 |
| 静态分析 | 不支持 | 有限 | 不支持 | 不支持 | 不支持 | 支持 |

## 模块化发展的启示

```javascript
// 1. 从"全局变量"到"模块化"
// 原始：<script src="a.js"><script src="b.js">
// 现代：import { a } from './a.js';

// 2. 模块加载从"同步"到"异步"
// 3. 依赖管理从"手动"到"自动"
// 4. 从"运行时"到"编译时"（静态分析）
// 5. 从"规范碎片化"到"标准统一"

// 今天的实践：
// - 新项目：ES Module
// - 遗留库维护：UMD（兼容）
// - Node.js：ES Module（首选）或 CommonJS
// - 打包工具内部：各自的模块处理机制
```

## 总结

AMD、CMD、UMD是前端模块化发展过程中的重要里程碑。它们解决了在ES Module标准化之前JavaScript模块化的需求。如今，ES Module已经成为事实标准，但理解这些历史方案有助于了解前端工程化的发展脉络，并且在维护遗留项目时仍然会接触到它们。
