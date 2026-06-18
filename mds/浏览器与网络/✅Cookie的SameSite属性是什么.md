# ✅Cookie的SameSite属性是什么？

# 典型回答

`SameSite` 是 Cookie 的一个安全属性，用于控制 Cookie 在跨站请求中是否被发送。它的主要目的是防止 CSRF（跨站请求伪造）攻击和增强用户隐私保护。

`SameSite` 属性有三个可选值：

| 值 | 行为 | 安全级别 | 适用场景 |
|-----|------|---------|---------|
| **Strict** | 完全禁止跨站发送 Cookie。只有在当前网站的页面中发起请求时才携带 Cookie | 最高 | 银行转账、密码修改等关键操作 |
| **Lax** | 允许部分安全请求携带 Cookie（GET 导航，如点击链接、使用 `<a>` 标签导航）。POST、AJAX 等请求不携带 | 中等 | 默认值，适用于大多数场景 |
| **None** | 任何请求都携带 Cookie（包括跨站请求），但必须配合 `Secure` 属性（仅 HTTPS） | 最低 | 第三方嵌入场景（如支付回调、嵌入的评论系统） |

从 Chrome 80 开始（2020年2月），如果未设置 `SameSite` 属性，默认值被更新为 `SameSite=Lax`，这使得大多数 Cookie 默认不再跨站发送。

# 扩展知识

### SameSite 严格程度对比

```text
用户从 example.com 点击链接访问 other.com

SameSite=Strict:
  - 从 other.com 发起的请求中 ❌ 不携带 other.com 的 Cookie
  - 用户直接访问 other.com ✅ 携带 Cookie
  - 用户从 other.com 点击跳转到 example.com ❌ 不携带 Cookie

SameSite=Lax:
  - 从 other.com 使用 <a> 标签导航到 example.com ✅ 携带 Cookie
  - 从 other.com 使用 window.location 跳转 ✅ 携带 Cookie  
  - 从 other.com 使用 <form> method=GET 提交到 example.com ✅ 携带 Cookie
  - 从 other.com 使用 <form> method=POST 提交到 example.com ❌ 不携带 Cookie
  - 从 other.com 使用 fetch/XMLHttpRequest 请求 example.com ❌ 不携带 Cookie

SameSite=None:
  - 任何跨站请求 ✅ 都携带 Cookie（需 Secure）
```

### 不同场景下的 Cookie 发送行为

```html
<!-- 场景1: 用户点击外部链接进入网站（Lax 允许） -->
<a href="https://bank.example.com/transfer">点此转账</a>
<!-- SameSite=Lax: 请求携带 Cookie ✅ -->
<!-- SameSite=Strict: 请求不携带 Cookie ❌（用户将处于未登录状态） -->

<!-- 场景2: 第三方网站通过表单 POST 提交 -->
<form action="https://bank.example.com/transfer" method="POST">
  <input name="amount" value="10000">
  <input name="to" value="attacker">
</form>
<!-- SameSite=Lax: 不携带 Cookie ✅（防御成功） -->
<!-- SameSite=None: 携带 Cookie ❌（CSRF 攻击可能成功） -->

<!-- 场景3: 嵌入第三方资源 -->
<img src="https://ad.example.com/track?page=home">
<iframe src="https://widget.example.com/chat">
<!-- 这些都是跨站请求，SameSite=Lax/Strict 都不携带 Cookie -->
```

### 如何设置 SameSite 属性

```javascript
// 服务端设置 Cookie（后端）
// Node.js (Express) 示例
res.cookie('sessionId', 'abc123', {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',    // 'strict' | 'lax' | 'none'
  maxAge: 3600000,    // 1小时过期
});

// Java Servlet 示例
response.setHeader(
  "Set-Cookie",
  "sessionId=abc123; Path=/; HttpOnly; Secure; SameSite=Lax"
);

// Nginx 配置中添加 SameSite 属性
// add_header Set-Cookie "sessionId=$sessionId; Path=/; HttpOnly; Secure; SameSite=Lax";

// 前端无法直接设置 HttpOnly 的 Cookie，但可以设置非 HttpOnly 的
document.cookie = 'preference=dark; path=/; SameSite=Lax; Secure';
```

### SameSite=None 的要求

使用 `SameSite=None` 时必须同时设置 `Secure` 属性（即仅通过 HTTPS 发送），否则浏览器会拒绝该 Cookie：

```javascript
// ✅ 正确：SameSite=None + Secure
res.cookie('thirdPartyToken', 'xyz789', {
  sameSite: 'none',
  secure: true,  // 必须，否则 Cookie 会被拒绝
});

// ❌ 错误：SameSite=None 但未设置 Secure
res.cookie('thirdPartyToken', 'xyz789', {
  sameSite: 'none',
  // secure: false 或未设置，浏览器会拒绝此 Cookie
});
```

### Cookie 的其他安全属性

```javascript
// 完整的安全 Cookie 配置
res.cookie('sessionId', 'abc123', {
  // HttpOnly: 禁止 JavaScript 访问 Cookie
  // 防御 XSS 攻击（防止恶意脚本窃取会话 Cookie）
  httpOnly: true,
  
  // Secure: 仅通过 HTTPS 传输
  // 防止中间人攻击窃取 Cookie
  secure: true,
  
  // SameSite: 控制跨站请求是否携带 Cookie
  // 防御 CSRF 攻击
  sameSite: 'lax',
  
  // Domain: 控制 Cookie 可访问的域名范围
  domain: '.example.com',  // 包括子域名
  
  // Path: 控制 Cookie 可访问的路径范围
  path: '/',
  
  // Max-Age / Expires: Cookie 的存活时间
  maxAge: 7 * 24 * 60 * 60,  // 7天，单位秒
  // expires: new Date('2025-12-31'), // 或使用绝对时间
});
```

### 同站（SameSite）与同源（SameOrigin）的区别

这是一个常见的混淆点：

| 概念 | 协议比较 | 域名比较 | 端口比较 | 子域名 |
|------|---------|---------|---------|--------|
| 同源（Same Origin） | 必须相同 | 必须相同 | 必须相同 | 视为不同源 |
| 同站（Same Site） | 不要求 | 要求注册域名相同（eTLD+1） | 不要求 | 视为同站 |

```text
SameSite 判定规则（基于 eTLD+1，即有效顶级域名+一级域名）:

https://www.example.com
https://api.example.com      → 同站（Same Site）
https://login.example.com    → 同站（Same Site）
http://example.com           → 同站（Same Site，协议不同）
https://www.other.com        → 跨站（Cross Site）

https://www.github.io
  （github.io 是公共后缀，因此 yongkl.github.io 与 other.github.io 视为不同站）
```

### SameSite 对第三方 Cookie 的影响

```html
<!-- 场景：A网站嵌入了B网站的图片/脚本/iframe -->
<!-- a.com/index.html -->
<html>
<body>
  <!-- 这是跨站请求， SameSite=Lax 或 Strict 时不发送 Cookie -->
  <img src="https://b.com/track.gif">
  
  <!-- 嵌入的 iframe 同样是跨站 -->
  <iframe src="https://b.com/widget"></iframe>
  
  <!-- JavaScript 发起的跨站请求 -->
  <script>
    fetch('https://b.com/api/data', { credentials: 'include' });
    // SameSite=Lax: ❌ 不携带 b.com 的 Cookie
    // SameSite=None;Secure: ✅ 携带 b.com 的 Cookie
  </script>
</body>
</html>
```

这说明 SameSite=Lax（默认值）实际上**阻止了大多数第三方 Cookie 的使用场景**，包括广告追踪、第三方分析服务等。这是浏览器厂商在推动隐私保护的重要举措。

### 浏览器兼容性处理

```javascript
// 处理不支持 SameSite 的旧浏览器
// 可以采用双重 Set-Cookie 策略

// 方案: 同时设置新格式和旧格式
res.setHeader('Set-Cookie', [
  'sessionId=abc123; Path=/; HttpOnly; Secure; SameSite=None',
  'sessionId=abc123; Path=/; HttpOnly; Secure'  // 旧浏览器降级
]);

// 或者检测 User-Agent 来决定是否设置 SameSite
const userAgent = req.headers['user-agent'];
if (supportsSameSiteNone(userAgent)) {
  res.cookie('sessionId', 'abc123', { sameSite: 'none', secure: true });
} else {
  res.cookie('sessionId', 'abc123', { secure: true });
}
```
