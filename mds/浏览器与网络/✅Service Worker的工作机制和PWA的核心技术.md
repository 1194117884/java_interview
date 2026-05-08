# ✅Service Worker的工作机制和PWA的核心技术

# 典型回答

**Service Worker** 是浏览器在后台独立运行的脚本，相当于浏览器和网络之间的**代理服务器**。它可以拦截网络请求、管理缓存、推送通知，即使页面关闭也能运行。

**Service Worker 的工作机制：**
1. **注册**：页面 JavaScript 注册 Service Worker，浏览器下载并安装脚本
2. **安装**：Service Worker 触发 `install` 事件，适合预缓存静态资源
3. **激活**：Service Worker 触发 `activate` 事件，清理旧缓存，接管页面控制权
4. **运行**：Service Worker 监听 `fetch`、`push`、`sync`、`message` 等事件，持续运行

**PWA（Progressive Web App，渐进式 Web 应用）** 是一种让 Web 应用具有原生 App 体验的技术方案。PWA 的核心技术包括：
1. **Service Worker**：离线缓存、网络代理、后台同步
2. **Web App Manifest**：配置应用名称、图标、启动画面等（可添加到主屏幕）
3. **HTTPS**：PWA 强制要求 HTTPS（本地开发可用 localhost）

# 扩展知识

### Service Worker 的生命周期

```javascript
// Service Worker 生命周期
// 注册 → 安装 → 激活 → 运行 → 更新 → 重复

// 状态转换图:
// 已注册(Registered)
//     │
//     ▼
// 正在安装(Installing) ← install 事件
//     │
//     ├── 安装失败 → 丢弃
//     │
//     ▼
// 已安装但未激活(Installed/Waiting)
//     │
//     ├── 使用 self.skipWaiting() 跳过等待
//     │
//     ▼
// 正在激活(Activating) ← activate 事件
//     │
//     ▼
// 已激活(Activated) ← 开始拦截 fetch 事件
//     │
//     ▼
// 运行中(Running)
//     │
//     ├── 页面关闭 → 休眠（再次访问时唤醒）
//     │
//     ▼ (Service Worker 文件发生变化时)
// 更新(Update) ← 浏览器发现新版本
//     │
//     ▼
// 新版本安装 → 等待激活 → 接管...
```

### Service Worker 注册和安装

```javascript
// 主页面 JavaScript（在主线程中执行）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // 注册 Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',  // 控制范围，默认为 sw.js 所在路径
      });
      
      console.log('Service Worker 注册成功:', registration.scope);
      
      // 监听 Service Worker 状态变化
      if (registration.installing) {
        console.log('Service Worker 正在安装');
      } else if (registration.waiting) {
        console.log('Service Worker 等待激活');
      } else if (registration.active) {
        console.log('Service Worker 已激活');
      }
      
      // 检测新版本
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('发现新版本 Service Worker');
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // 新版本已安装，通知用户刷新
            showUpdateNotification();
          }
        });
      });
      
      // 监听控制器变化（页面被 Service Worker 接管）
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
      
    } catch (error) {
      console.error('Service Worker 注册失败:', error);
    }
  });
}

// 通知用户有新版本
function showUpdateNotification() {
  const notification = document.createElement('div');
  notification.className = 'update-banner';
  notification.innerHTML = `
    <span>有新版本可用</span>
    <button onclick="location.reload()">更新</button>
  `;
  document.body.appendChild(notification);
}
```

### Service Worker 脚本（sw.js）

```javascript
// sw.js - 在 Service Worker 线程中执行
// 注意：这个文件中不能使用 DOM API（没有 window、document）

const CACHE_NAME = 'my-app-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/scripts/app.js',
  '/images/logo.png',
  '/offline.html',
];

// 安装阶段：预缓存静态资源
self.addEventListener('install', (event) => {
  console.log('Service Worker: 安装中...');
  
  // 跳过等待，立即激活（开发时方便）
  // 生产环境可根据需要决定是否跳过
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: 缓存静态资源');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: 安装完成');
      })
      .catch((error) => {
        console.error('Service Worker: 预缓存失败', error);
      })
  );
});

// 激活阶段：清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('Service Worker: 激活中...');
  
  // 立即接管所有页面（不等待页面重新加载）
  event.waitUntil(clients.claim());
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('Service Worker: 删除旧缓存', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('Service Worker: 激活完成');
    })
  );
});

// 拦截 fetch 请求
self.addEventListener('fetch', (event) => {
  // 跳过非 GET 请求
  if (event.request.method !== 'GET') return;
  
  // 跳过浏览器扩展请求
  if (event.request.url.startsWith('chrome-extension://')) return;
  
  // 根据请求类型选择不同策略
  if (event.request.url.includes('/api/')) {
    // API 请求：网络优先
    event.respondWith(networkFirst(event.request));
  } else if (isImageRequest(event.request)) {
    // 图片：缓存优先
    event.respondWith(cacheFirst(event.request));
  } else {
    // 其他资源：Stale-While-Revalidate
    event.respondWith(staleWhileRevalidate(event.request));
  }
});

// 监听推送通知
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || '有新消息',
    icon: '/images/icon-192.png',
    badge: '/images/badge.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
    },
    actions: [
      { action: 'view', title: '查看' },
      { action: 'close', title: '关闭' },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || '通知', options)
  );
});

// 通知点击事件
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    const urlToOpen = event.notification.data.url;
    event.waitUntil(
      clients.openWindow(urlToOpen)
    );
  }
});

// 后台同步事件
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

// ---- 缓存策略实现 ----

// 网络优先（Network First）
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    // 缓存成功响应
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // 离线时返回缓存
    const cached = await caches.match(request);
    if (cached) return cached;
    
    // 如果请求的是页面，返回离线页面
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// 缓存优先（Cache First）
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  
  const response = await fetch(request);
  const cache = await caches.open(CACHE_NAME);
  cache.put(request, response.clone());
  return response;
}

// Stale-While-Revalidate
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // 立即返回缓存
  const cachedResponse = await cache.match(request);
  
  // 同时发起网络请求更新缓存
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// 判断图片请求
function isImageRequest(request) {
  const url = new URL(request.url);
  const ext = url.pathname.split('.').pop().toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'ico'].includes(ext);
}

// 后台同步实现
async function syncMessages() {
  try {
    // 从 IndexedDB 获取待发送的消息
    const db = await openDB();
    const pendingMessages = await db.getAll('outbox');
    
    for (const message of pendingMessages) {
      try {
        await fetch('/api/messages', {
          method: 'POST',
          body: JSON.stringify(message),
          headers: { 'Content-Type': 'application/json' },
        });
        await db.delete('outbox', message.id);
      } catch (error) {
        console.error('同步消息失败:', error);
      }
    }
  } catch (error) {
    console.error('后台同步失败:', error);
  }
}
```

### Web App Manifest 配置

```json
{
  "manifest.json"

{
  "name": "我的应用",
  "short_name": "应用",
  "description": "这是一个 PWA 应用",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#ffffff",
  "theme_color": "#4285f4",
  "scope": "/",
  "lang": "zh-CN",
  
  "icons": [
    {
      "src": "/images/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/images/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  
  "screenshots": [
    {
      "src": "/screenshots/home.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshots/desktop.png",
      "sizes": "1920x1080",
      "type": "image/png",
      "form_factor": "wide"
    }
  ],
  
  "related_applications": [],
  "prefer_related_applications": false,
  
  "categories": ["productivity", "utilities"],
  "iarc_rating_id": ""
}
```

```html
<!-- 在 HTML 中引入 Manifest -->
<!DOCTYPE html>
<html>
<head>
  <link rel="manifest" href="/manifest.json">
  
  <!-- iOS 专用设置 -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <link rel="apple-touch-icon" href="/images/icon-192.png">
  
  <!-- Windows 专用 -->
  <meta name="msapplication-TileImage" content="/images/icon-144.png">
  <meta name="msapplication-TileColor" content="#4285f4">
  
  <!-- 启动画面 -->
  <meta name="theme-color" content="#4285f4">
</head>
```

### display 模式对比

| 模式 | 说明 | 有地址栏 | 有状态栏 | 可全屏 |
|------|------|---------|---------|--------|
| `fullscreen` | 全屏模式（常用于游戏） | 否 | 否 | 是 |
| `standalone` | 独立应用模式（推荐） | 否 | 是 | 否 |
| `minimal-ui` | 最小化浏览器界面 | 有最小化控件 | 是 | 否 |
| `browser` | 普通浏览器模式 | 是 | 是 | 否 |

### PWA 的离线体验场景

```javascript
// 检测网络状态
window.addEventListener('online', () => {
  console.log('网络已恢复');
  updateOnlineStatus(true);
});

window.addEventListener('offline', () => {
  console.log('网络已断开');
  updateOnlineStatus(false);
});

function updateOnlineStatus(isOnline) {
  const banner = document.getElementById('offline-banner');
  if (isOnline) {
    banner.style.display = 'none';
    // 尝试后台同步
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.sync.register('sync-messages');
      });
    }
  } else {
    banner.style.display = 'block';
    banner.textContent = '当前处于离线状态，部分功能不可用';
  }
}
```

### PWA 的优势和局限性

| 优势 | 说明 |
|------|------|
| 离线可用 | Service Worker 缓存关键资源，无网络也能访问 |
| 安装到主屏幕 | 像原生 App 一样添加到桌面 |
| 推送通知 | 即使浏览器关闭也可以接收推送 |
| 自动更新 | Service Worker 在后台静默更新 |
| 安全性 | 强制 HTTPS，防止中间人攻击 |
| 无需应用商店 | 直接通过 URL 分发，无需审核流程 |
| 占用空间小 | 相比原生 App 小得多 |

| 局限性 | 说明 |
|--------|------|
| 无法访问所有系统 API | 如蓝牙、NFC（但 Web API 在不断完善） |
| iOS 支持有限 | Safari 的 PWA 支持不如 Android |
| 后台能力受限 | 和原生 App 相比，后台活动时间有限 |
| 存储限制 | 受浏览器存储配额限制 |
| 首次加载体验 | 需要网络加载 Service Worker 和缓存 |

### 开发调试技巧

```javascript
// Chrome DevTools 中的 Service Worker 调试：

// 1. Application → Service Workers 面板
//    - 查看注册状态
//    - 手动触发 install/activate
//    - 更新/卸载 Service Worker
//    - 模拟离线

// 2. 跳过 Service Worker 等待
//    在 DevTools 中勾选 "Update on reload"
//    或 Network 面板中勾选 "Bypass for network"

// 3. 本地开发时的处理
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  // 开发环境不注册 Service Worker
  // 或注册时不进行缓存
  navigator.serviceWorker.register('/sw-dev.js');
} else {
  // 生产环境注册完整版本
  navigator.serviceWorker.register('/sw.js');
}

// 4. Service Worker 版本更新流程
self.addEventListener('activate', (event) => {
  // 通知所有页面有新版本
  event.waitUntil(
    clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'SW_UPDATED',
          version: CACHE_NAME,
        });
      });
    })
  );
});
```
