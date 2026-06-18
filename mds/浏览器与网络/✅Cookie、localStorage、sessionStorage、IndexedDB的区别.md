# ✅Cookie、localStorage、sessionStorage、IndexedDB的区别

# 典型回答

四种浏览器存储方案各有不同的设计目标和使用场景：

| 特性 | Cookie | localStorage | sessionStorage | IndexedDB |
|------|--------|-------------|----------------|-----------|
| 容量 | 4KB | 5-10MB | 5-10MB | 理论上无上限（通常>=250MB） |
| 存储类型 | 字符串 | 字符串 | 字符串 | 结构化数据（支持对象、二进制） |
| 数据持久性 | 可设置过期时间 | 持久化，需手动删除 | 标签页关闭即清除 | 持久化，需手动删除 |
| 同源策略 | 同源+路径 | 同源 | 同源+同标签页 | 同源 |
| 是否随HTTP请求发送 | 是（自动携带） | 否 | 否 | 否 |
| 是否支持服务端读写 | 是 | 否 | 否 | 否 |
| 操作方式 | 同步 | 同步 | 同步 | 异步（基于事件/回调/Promise） |
| 是否支持事务 | 否 | 否 | 否 | 是 |
| 是否支持索引 | 否 | 否 | 否 | 是（支持游标和索引查询） |
| 浏览器支持 | 所有 | IE8+ | IE8+ | IE10+ |
| 存储内容可见 | 可被服务器读取 | 仅客户端 | 仅客户端 | 仅客户端 |

**Cookie** 主要用于服务端会话管理、用户身份认证和追踪。**localStorage** 适合在同一域名下跨页面持久化存储简单数据。**sessionStorage** 适合在单次会话中临时保存数据。**IndexedDB** 适合存储大量结构化数据，如离线数据缓存、用户生成内容等。

# 扩展知识

### Cookie 的详细特性

```javascript
// 设置 Cookie
document.cookie = 'username=John; path=/; expires=Thu, 18 Dec 2025 12:00:00 UTC; Secure; SameSite=Lax';

// 读取 Cookie
const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
  const [key, value] = cookie.split('=');
  acc[key] = value;
  return acc;
}, {});

// Cookie 属性详解
/*
  Name=Value    - 键值对
  Expires/Max-Age - 过期时间（Max-Age 优先级更高，单位秒）
  Path          - 限定路径（默认当前路径）
  Domain        - 限定域名（包含子域名）
  Secure        - 仅通过 HTTPS 传输
  HttpOnly      - 禁止 JavaScript 访问（防御 XSS）
  SameSite      - 跨站请求策略（Strict/Lax/None）
  Priority      - 优先级（Chrome 独有，Low/Medium/High）
*/
```

### localStorage 和 sessionStorage 的基本操作

```javascript
// localStorage - 持久化存储
// 存储
localStorage.setItem('theme', 'dark');
localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Alice' }));

// 读取
const theme = localStorage.getItem('theme');
const user = JSON.parse(localStorage.getItem('user'));

// 删除
localStorage.removeItem('theme');

// 清空
localStorage.clear();

// 遍历
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  console.log(key, localStorage.getItem(key));
}

// sessionStorage - 会话级存储（API 与 localStorage 完全一致）
sessionStorage.setItem('tempData', 'value');
```

### IndexedDB 基本操作

```javascript
// 1. 打开数据库（创建或连接）
const request = indexedDB.open('MyDatabase', 1);

request.onerror = (event) => {
  console.error('数据库打开失败:', event.target.error);
};

request.onupgradeneeded = (event) => {
  // 数据库版本升级时触发（首次创建也会）
  const db = event.target.result;
  
  // 创建对象仓库（类似表）
  if (!db.objectStoreNames.contains('users')) {
    const store = db.createObjectStore('users', { 
      keyPath: 'id',           // 主键
      autoIncrement: false 
    });
    
    // 创建索引
    store.createIndex('name', 'name', { unique: false });
    store.createIndex('email', 'email', { unique: true });
    store.createIndex('age', 'age', { unique: false });
  }
};

request.onsuccess = (event) => {
  const db = event.target.result;
  console.log('数据库连接成功');
  
  // 2. 添加数据（事务操作）
  const transaction = db.transaction(['users'], 'readwrite');
  const store = transaction.objectStore('users');
  
  store.add({ id: 1, name: 'Alice', email: 'alice@example.com', age: 28 });
  store.add({ id: 2, name: 'Bob', email: 'bob@example.com', age: 32 });
  
  transaction.oncomplete = () => {
    console.log('数据写入完成');
  };
  
  // 3. 查询数据
  const getTx = db.transaction(['users'], 'readonly');
  const getStore = getTx.objectStore('users');
  const getRequest = getStore.get(1); // 通过主键查询
  
  getRequest.onsuccess = () => {
    console.log('查询结果:', getRequest.result);
  };
  
  // 4. 使用索引查询
  const indexTx = db.transaction(['users'], 'readonly');
  const indexStore = indexTx.objectStore('users');
  const nameIndex = indexStore.index('name');
  const indexRequest = nameIndex.get('Bob'); // 通过索引查询
  
  indexRequest.onsuccess = () => {
    console.log('索引查询结果:', indexRequest.result);
  };
  
  // 5. 游标遍历
  const cursorTx = db.transaction(['users'], 'readonly');
  const cursorStore = cursorTx.objectStore('users');
  const cursorRequest = cursorStore.openCursor();
  
  cursorRequest.onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      console.log('游标遍历:', cursor.key, cursor.value);
      cursor.continue();
    }
  };
  
  // 6. 使用游标范围查询
  const rangeTx = db.transaction(['users'], 'readonly');
  const rangeStore = rangeTx.objectStore('users');
  const range = IDBKeyRange.bound(18, 60); // 范围：18-60
  const rangeRequest = rangeStore.openCursor(range);
  
  rangeRequest.onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      console.log('年龄范围内的用户:', cursor.value);
      cursor.continue();
    }
  };
};

// 关闭数据库
// db.close();
```

### IndexedDB 的 Promise 封装

```javascript
// IndexedDB 原生 API 基于事件，使用 Promise 封装更友好
class IndexedDBHelper {
  constructor(dbName, version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }
  
  open(upgradeCallback) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onupgradeneeded = (event) => {
        upgradeCallback && upgradeCallback(event.target.result);
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this);
      };
      
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }
  
  add(storeName, data) {
    return this._performTransaction(storeName, 'readwrite', (store) => {
      return store.add(data);
    });
  }
  
  get(storeName, key) {
    return this._performTransaction(storeName, 'readonly', (store) => {
      return store.get(key);
    });
  }
  
  getAll(storeName) {
    return this._performTransaction(storeName, 'readonly', (store) => {
      return store.getAll();
    });
  }
  
  update(storeName, data) {
    return this._performTransaction(storeName, 'readwrite', (store) => {
      return store.put(data);
    });
  }
  
  delete(storeName, key) {
    return this._performTransaction(storeName, 'readwrite', (store) => {
      return store.delete(key);
    });
  }
  
  _performTransaction(storeName, mode, operation) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], mode);
      const store = transaction.objectStore(storeName);
      const request = operation(store);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// 使用示例
const db = new IndexedDBHelper('MyApp', 1);
await db.open((db) => {
  if (!db.objectStoreNames.contains('tasks')) {
    const store = db.createObjectStore('tasks', { 
      keyPath: 'id', 
      autoIncrement: true 
    });
    store.createIndex('status', 'status', { unique: false });
  }
});

await db.add('tasks', { title: '学习 IndexedDB', status: 'pending' });
const tasks = await db.getAll('tasks');
console.log(tasks);
```

### 四种存储方案的选择指南

```javascript
// 场景1: 用户登录态管理
// ✅ 使用 Cookie（HttpOnly + Secure）
document.cookie = 'sessionId=abc123; path=/; Secure; HttpOnly; SameSite=Lax';

// 场景2: 用户偏好设置（主题、语言、布局）
// ✅ 使用 localStorage
localStorage.setItem('preferences', JSON.stringify({
  theme: 'dark',
  language: 'zh-CN',
  sidebar: 'collapsed'
}));

// 场景3: 表单草稿保存（同一个标签页）
// ✅ 使用 sessionStorage
sessionStorage.setItem('formDraft', JSON.stringify(formData));

// 场景4: 离线缓存大量数据（如消息列表、文章数据）
// ✅ 使用 IndexedDB
// 使用上面封装的 IndexedDBHelper 存储数据

// 场景5: 购物车数据
// ✅ 短期（未登录）→ localStorage
// ✅ 长期（已登录）→ IndexedDB + 服务端同步

// 场景6: 追踪用户行为（埋点数据）
// ✅ 先存 IndexedDB 批量上报，避免每个事件都发请求
```

### 存储限制与配额

| 浏览器 | localStorage | IndexedDB |
|--------|-------------|-----------|
| Chrome | 每个源 10MB | 每个源 可用磁盘空间60%（以组为单位共享） |
| Firefox | 每个源 10MB | 每个源 可用磁盘空间50%（最大2GB） |
| Safari | 每个源 5MB | 每个源 可用磁盘空间20%（最大1GB） |
| Edge | 每个源 10MB | 和Chrome一致（Chromium核心） |

```javascript
// 浏览器提供的存储配额查询
if (navigator.storage && navigator.storage.estimate) {
  const estimate = await navigator.storage.estimate();
  console.log('已使用:', estimate.usage / 1024 / 1024, 'MB');
  console.log('配额:', estimate.quota / 1024 / 1024, 'MB');
  console.log('使用率:', (estimate.usage / estimate.quota * 100).toFixed(2) + '%');
}
```
