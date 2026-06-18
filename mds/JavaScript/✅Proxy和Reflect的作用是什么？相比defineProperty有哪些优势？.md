# ✅Proxy和Reflect的作用是什么？相比defineProperty有哪些优势？

# 典型回答

## Proxy

**Proxy**是ES6提供的元编程能力，用于创建一个对象的代理，拦截并自定义对象的基本操作（如属性读取、赋值、函数调用等）。

```javascript
const proxy = new Proxy(target, handler);
// target：被代理的对象
// handler：包含拦截操作（trap）的对象
```

## Reflect

**Reflect**是一个内置对象，提供了一组与Proxy拦截方法对应的方法，用于执行对象的默认操作。它不是一个构造函数，所有方法都是静态的。

```javascript
// 等价的两种写法
obj.prop       // 读取属性
Reflect.get(obj, 'prop')  // 等价的Reflect调用

obj.prop = val
Reflect.set(obj, 'prop', val)
```

**Proxy相比defineProperty的优势：**

| 对比维度 | Proxy | Object.defineProperty |
|---------|-------|----------------------|
| 拦截范围 | 13种元操作（get/set/apply/construct等） | 仅get和set |
| 数组操作 | 可以完整拦截数组操作 | 无法很好的拦截数组push/pop等 |
| 新增属性 | 自动拦截新增属性 | 需要手动监听 |
| 性能 | 更优（V8持续优化） | 需要递归遍历属性 |
| 删除操作 | 可以拦截deleteProperty | 无法拦截 |
| 返回撤销 | 支持revocable撤销代理 | 不支持 |
| 目标类型 | 任意对象 | 只能用于对象 |

# 扩展知识

## Proxy的13种拦截方法

```javascript
const handler = {
  // 拦截属性读取
  get(target, prop, receiver) {
    console.log(`GET ${String(prop)}`);
    return Reflect.get(target, prop, receiver);
  },
  // 拦截属性设置
  set(target, prop, value, receiver) {
    console.log(`SET ${String(prop)} = ${value}`);
    return Reflect.set(target, prop, value, receiver);
  },
  // 拦截in操作符
  has(target, prop) {
    return Reflect.has(target, prop);
  },
  // 拦截delete操作符
  deleteProperty(target, prop) {
    console.log(`DELETE ${String(prop)}`);
    return Reflect.deleteProperty(target, prop);
  },
  // 拦截for...in和Object.keys
  ownKeys(target) {
    return Reflect.ownKeys(target);
  },
  // 拦截Object.getOwnPropertyDescriptor
  getOwnPropertyDescriptor(target, prop) {
    return Reflect.getOwnPropertyDescriptor(target, prop);
  },
  // 拦截Object.defineProperty
  defineProperty(target, prop, descriptor) {
    return Reflect.defineProperty(target, prop, descriptor);
  },
  // 拦截Object.getPrototypeOf
  getPrototypeOf(target) {
    return Reflect.getPrototypeOf(target);
  },
  // 拦截Object.setPrototypeOf
  setPrototypeOf(target, proto) {
    return Reflect.setPrototypeOf(target, proto);
  },
  // 拦截函数调用
  apply(target, thisArg, args) {
    console.log(`CALL ${target.name}`);
    return Reflect.apply(target, thisArg, args);
  },
  // 拦截new操作符
  construct(target, args, newTarget) {
    console.log(`CONSTRUCT ${target.name}`);
    return Reflect.construct(target, args, newTarget);
  },
  // 拦截Object.isExtensible
  isExtensible(target) {
    return Reflect.isExtensible(target);
  },
  // 拦截Object.preventExtensions
  preventExtensions(target) {
    return Reflect.preventExtensions(target);
  }
};
```

## Proxy的实际应用场景

```javascript
// 1. 数据验证
const validator = {
  set(target, prop, value) {
    if (prop === 'age') {
      if (!Number.isInteger(value)) throw new TypeError('Age must be an integer');
      if (value < 0 || value > 150) throw new RangeError('Invalid age');
    }
    return Reflect.set(target, prop, value);
  }
};
const person = new Proxy({}, validator);
person.age = 25;  // OK
// person.age = 'abc'; // TypeError

// 2. 属性访问日志/监控
function createLogger(obj, name = 'Object') {
  return new Proxy(obj, {
    get(target, prop) {
      console.log(`[${new Date().toISOString()}] ${name}.${String(prop)} accessed`);
      return Reflect.get(target, prop);
    }
  });
}

// 3. 自动填充默认值
function withDefaults(target, defaults) {
  return new Proxy(target, {
    get(target, prop) {
      if (!(prop in target)) {
        target[prop] = typeof defaults[prop] === 'function'
          ? defaults[prop]() : defaults[prop];
      }
      return Reflect.get(target, prop);
    }
  });
}

// 4. 实现私有属性
function createPrivate(obj) {
  const handler = {
    get(target, prop) {
      if (prop.startsWith('_')) throw new Error(`Access denied: ${String(prop)}`);
      return Reflect.get(target, prop);
    },
    set(target, prop, value) {
      if (prop.startsWith('_')) throw new Error(`Access denied: ${String(prop)}`);
      return Reflect.set(target, prop, value);
    },
    ownKeys(target) {
      return Reflect.ownKeys(target).filter(k => !String(k).startsWith('_'));
    }
  };
  return new Proxy(obj, handler);
}

// 5. 实现观察者模式
function observe(obj, callback) {
  return new Proxy(obj, {
    set(target, prop, value) {
      const oldValue = target[prop];
      const result = Reflect.set(target, prop, value);
      callback({ prop, oldValue, newValue: value, object: target });
      return result;
    }
  });
}

// 6. 虚拟属性（计算属性）
const range = new Proxy({ start: 1, end: 10 }, {
  get(target, prop) {
    if (prop === 'length') return target.end - target.start + 1;
    if (prop === 'values') {
      const result = [];
      for (let i = target.start; i <= target.end; i++) result.push(i);
      return result;
    }
    return Reflect.get(target, prop);
  }
});
console.log(range.length); // 10
console.log(range.values); // [1,2,...,10]
```

## Proxy与defineProperty实现数据响应的对比

```javascript
// defineProperty方式（如Vue 2）
function defineReactive(obj) {
  const data = {};
  Object.keys(obj).forEach(key => {
    let value = obj[key];
    Object.defineProperty(data, key, {
      get() {
        console.log(`GET ${key}`);
        return value;
      },
      set(newVal) {
        console.log(`SET ${key} = ${newVal}`);
        value = newVal;
      }
    });
  });
  return data;
}
// 缺点：需要预先知道所有属性、无法监听数组变化

// Proxy方式（如Vue 3）
function reactive(obj) {
  return new Proxy(obj, {
    get(target, prop) {
      console.log(`GET ${String(prop)}`);
      return Reflect.get(target, prop);
    },
    set(target, prop, value) {
      console.log(`SET ${String(prop)} = ${value}`);
      return Reflect.set(target, prop, value);
    }
  });
}
// 优点：无需预先声明、支持数组、支持新增属性
```

## 可撤销Proxy

```javascript
const { proxy, revoke } = Proxy.revocable(target, handler);
// 使用proxy...
revoke();
// proxy.a // TypeError: Cannot perform 'get' on a proxy that has been revoked
```

## Reflect的作用

```javascript
// 1. 更优雅的调用方式
Reflect.get(obj, 'prop');         // vs obj.prop（无错误处理）
Reflect.set(obj, 'prop', value);  // 返回布尔值表示成功与否

// 2. 与Proxy完美配合（receiver参数）
const parent = {
  get name() { return 'Parent'; }
};
const handler = {
  get(target, prop, receiver) {
    // receiver确保this指向代理对象
    return Reflect.get(target, prop, receiver);
  }
};

// 3. 替代一些Object方法
Reflect.defineProperty(obj, 'key', descriptor);  // 返回boolean
Object.defineProperty(obj, 'key', descriptor);    // 抛出异常或返回对象

// 4. 替代Function.prototype.apply/call
Reflect.apply(fn, thisArg, args);
// vs
fn.apply(thisArg, args); // 如果fn是一个代理对象，apply可能被劫持
```
