# ✅IndexedDB的使用场景和基本操作

# 典型回答

IndexedDB 是浏览器提供的一种**非关系型、结构化数据存储方案**，采用键值对存储，支持索引、事务和异步操作。与 localStorage 的 5-10MB 限制相比，IndexedDB 的存储容量通常为可用磁盘空间的 60%（Chrome），适合存储大量数据。

**主要使用场景：**
1. **离线应用数据缓存**：PWA 应用中缓存文章、商品列表等结构化数据，离线时仍可浏览
2. **客户端大数据管理**：如在线文档编辑器（Google Docs）存储文档历史、邮件客户端缓存邮件列表
3. **用户操作日志/埋点**：先将用户行为数据存入 IndexedDB，批量上报，减少网络请求次数
4. **复杂查询需求**：需要按多个条件查询、范围查询的场景
5. **文件/二进制数据存储**：存储图片、音频等 Blob 数据，配合离线使用

**基本操作模式：** 打开数据库 → 创建对象仓库（表）→ 创建事务 → 使用游标/索引增删改查。

# 扩展知识

### IndexedDB 的核心概念

| 概念 | 类比关系数据库 | 说明 |
|------|--------------|------|
| 数据库（Database） | 数据库 | 每个源（origin）可以创建多个数据库 |
| 对象仓库（Object Store） | 表（Table） | 存储数据的容器 |
| 键（Key） | 主键（Primary Key） | 可以是 autoIncrement 或 keyPath |
| 索引（Index） | 索引（Index） | 按非主键字段快速查询 |
| 事务（Transaction） | 事务（Transaction） | 保证数据操作的原子性和一致性 |
| 游标（Cursor） | 游标（Cursor） | 遍历多个数据记录 |
| 范围（KeyRange） | WHERE 子句 | 限定查询的范围 |

### 数据库版本管理

```javascript
// IndexedDB 的版本号很重要，用于数据库结构升级
// 每次修改对象仓库结构（新增/删除 store、修改索引）都要升级版本号

const request = indexedDB.open('MyAppDB', 2);

request.onupgradeneeded = (event) => {
  const db = event.target.result;
  const oldVersion = event.oldVersion;
  
  console.log(`数据库从版本 ${oldVersion} 升级到 ${event.newVersion}`);
  
  // 根据旧版本号做增量迁移
  switch (oldVersion) {
    case 0:
      // 首次创建（从无到有）
      const userStore = db.createObjectStore('users', { 
        keyPath: 'id' 
      });
      userStore.createIndex('email', 'email', { unique: true });
      
    case 1:
      // 从版本1升级到版本2：新增 posts 仓库
      if (!db.objectStoreNames.contains('posts')) {
        const postStore = db.createObjectStore('posts', {
          keyPath: 'id',
          autoIncrement: true
        });
        postStore.createIndex('authorId', 'authorId', { unique: false });
        postStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
      
    // case 2: 未来版本继续追加
  }
};

// 如果不小心用低版本打开高版本数据库会报错
const failRequest = indexedDB.open('MyAppDB', 1);
failRequest.onerror = (event) => {
  // 错误: 版本号低于当前数据库版本
  console.error('版本号过低, 当前数据库版本:', event.target.error);
};
```

### 事务的隔离级别和生命周期

```javascript
const db = await openDB();

// IndexedDB 事务支持三种模式
const mode = {
  readonly: 'readonly',      // 只读（可并发执行）
  readwrite: 'readwrite',    // 读写（同一 store 串行执行）
  versionchange: 'versionchange' // 版本变更（独占）
};

// 事务生命周期
const transaction = db.transaction(['users', 'posts'], 'readwrite');

// 事件监听
transaction.onabort = (event) => {
  console.error('事务被中止:', event.target.error);
};

transaction.onerror = (event) => {
  console.error('事务出错:', event.target.error);
};

transaction.oncomplete = () => {
  console.log('事务完成');
};

// 注意：事务在事件循环中若没有被继续引用，会自动提交
// 因此对于长时间操作，需要保持事务活跃
```

### 使用游标进行复杂查询

```javascript
// 1. 基本游标遍历
function iterateAll(storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.openCursor();
    const results = [];
    
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        results.push(cursor.value);
        cursor.continue(); // 移动到下一个
      } else {
        resolve(results);   // 遍历完毕
      }
    };
    
    request.onerror = () => reject(request.error);
  });
}

// 2. 范围查询
function queryByRange(storeName, lower, upper, lowerOpen = false, upperOpen = false) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    
    // 创建范围：下界和上界
    const range = IDBKeyRange.bound(lower, upper, lowerOpen, upperOpen);
    const request = store.openCursor(range);
    const results = [];
    
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
  });
}

// 使用示例
// 查询年龄在18-30之间（包含18和30）的用户
const users = await queryByRange('users', 18, 30);

// 3. 使用索引排序
async function queryByIndex(storeName, indexName, value) {
  const transaction = db.transaction(storeName, 'readonly');
  const store = transaction.objectStore(storeName);
  const index = store.index(indexName);
  
  return new Promise((resolve, reject) => {
    const request = index.getAll(value);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 按状态查询任务
const pendingTasks = await queryByIndex('tasks', 'status', 'pending');

// 4. 反向遍历（最新的数据在前）
function queryLatest(storeName, limit = 10) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.openCursor(null, 'prev'); // 反向遍历
    const results = [];
    let count = 0;
    
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor && count < limit) {
        results.push(cursor.value);
        count++;
        cursor.continue();
      } else {
        resolve(results);
      }
    };
  });
}
```

### 存储和读取 Blob/文件数据

```javascript
// 存储文件（如用户上传的图片）
async function saveFile(file, id) {
  const transaction = db.transaction(['files'], 'readwrite');
  const store = transaction.objectStore('files');
  
  store.put({
    id: id,
    name: file.name,
    type: file.type,
    size: file.size,
    data: file,        // File 对象是 Blob 的子类，可以直接存储
    uploadedAt: Date.now()
  });
  
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// 读取文件并创建 URL 供页面使用
async function loadFile(id) {
  const transaction = db.transaction(['files'], 'readonly');
  const store = transaction.objectStore('files');
  
  const request = store.get(id);
  const result = await new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  
  if (result) {
    // 创建 Blob URL 用于在页面中显示
    const blob = result.data instanceof Blob ? result.data : new Blob([result.data]);
    return URL.createObjectURL(blob);
  }
  return null;
}

// 使用示例
// document.getElementById('preview').src = await loadFile('avatar_1');
```

### 常用的 IndexedDB 封装库

由于原生 IndexedDB API 使用事件驱动模式，代码较为繁琐，实际项目中常使用封装库：

| 库 | 特点 | 适用场景 |
|----|------|---------|
| **Dexie.js** | Promise 封装，API 简洁清晰，支持 TypeScript | 中小型项目，推荐首选 |
| **IDB** | 轻量级 Promise 封装，大小仅 1KB | 对包体积敏感的项目 |
| **localForage** | 类 localStorage API，自动降级到 WebSQL | 需要兼容旧浏览器的项目 |
| **idb-keyval** | 极致简洁的键值存储，大小 < 600B | 只需要简单的键值存储 |

```javascript
// Dexie.js 使用示例
// npm install dexie

import Dexie from 'dexie';

class TaskDB extends Dexie {
  constructor() {
    super('TaskDB');
    
    // 定义数据库结构
    this.version(1).stores({
      tasks: '++id, title, status, createdAt, priority'
    });
    
    // this.version(2).stores({
    //   tasks: '++id, title, status, createdAt, priority, *tags' // 新增多值索引
    // });
  }
}

const db = new TaskDB();

// 添加任务
await db.tasks.add({
  title: '学习 IndexedDB',
  status: 'pending',
  priority: 5,
  createdAt: new Date()
});

// 查询待办任务，按优先级排序
const pendingTasks = await db.tasks
  .where('status')
  .equals('pending')
  .reverse()
  .sortBy('priority');

// 范围查询
const todayTasks = await db.tasks
  .where('createdAt')
  .between(new Date('2025-01-01'), new Date('2025-12-31'))
  .toArray();

// 更新
await db.tasks.update(1, { status: 'completed' });

// 批量操作，使用事务
await db.transaction('rw', db.tasks, async () => {
  await db.tasks.bulkAdd([
    { title: '任务1', status: 'pending' },
    { title: '任务2', status: 'pending' },
  ]);
  await db.tasks.where('status').equals('pending').modify({ priority: 3 });
});
```

### IndexedDB 的性能优化

```javascript
// 1. 批量操作使用 bulkAdd/bulkPut 代替循环 add
// ❌ 不推荐
for (const item of largeArray) {
  await db.add('store', item);
}

// ✅ 推荐
await db.bulkAdd('store', largeArray);

// 2. 使用 getAll 代替游标遍历（数据量不太大时）
// ✅ 获取全部数据
const allItems = await db.getAll('store');
// 而不是用游标逐个获取

// 3. 限制结果数量
// 使用游标 + limit 控制
let count = 0;
const limit = 100;
// ...游标遍历时计数，达到limit时停止

// 4. 只读操作使用 readonly 事务（允许并发）
// ✅
db.transaction('store', 'readonly');

// 5. 及时关闭不需要的连接
// 页面卸载时关闭
window.addEventListener('beforeunload', () => {
  db.close();
});
```
