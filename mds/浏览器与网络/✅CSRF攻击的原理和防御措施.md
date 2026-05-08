# ✅CSRF攻击的原理和防御措施

# 典型回答

**CSRF（Cross-Site Request Forgery，跨站请求伪造）** 是一种攻击方式，攻击者诱导用户在已登录的情况下访问恶意网站，恶意网站利用用户的登录状态，向目标网站发送伪造的请求，执行非用户本意的操作。

**攻击原理：**
1. 用户登录目标网站（如银行网站），浏览器保存了该网站的 Cookie
2. 用户未退出目标网站，又在同一浏览器中访问了攻击者控制的恶意网站
3. 恶意网站自动向目标网站发起请求（如图片标签、表单提交、AJAX 请求）
4. 浏览器自动携带目标网站的 Cookie（Session Cookie），服务器误认为请求来自合法用户

**防御措施：** 使用 CSRF Token、SameSite Cookie 属性、Referer/Origin 头验证、二次验证（如验证码）。

# 扩展知识

### CSRF 攻击的常见形式

```html
<!-- 形式1: 通过图片标签发起 GET 请求 -->
<!-- 攻击者网站中的 HTML -->
<img src="https://bank.example.com/transfer?to=attacker&amount=10000" 
     style="display:none">
<!-- 用户浏览器访问此页面时，会发送GET请求到银行网站 -->
<!-- 如果银行网站使用GET方式处理转账，则攻击成功 -->

<!-- 形式2: 通过表单自动提交发起 POST 请求 -->
<!-- 攻击者网站中的 HTML -->
<form id="attackForm" action="https://bank.example.com/transfer" method="POST">
  <input type="hidden" name="to" value="attacker">
  <input type="hidden" name="amount" value="10000">
</form>
<script>
  // 页面加载后自动提交表单
  document.getElementById('attackForm').submit();
</script>
```

### CSRF 攻击的利用条件

| 条件 | 说明 |
|------|------|
| 用户已登录目标网站 | 浏览器中存在有效的 Session Cookie |
| 目标网站未使用有效的 CSRF 防护 | 请求不需要额外的验证信息 |
| 目标网站依赖 Cookie 进行身份认证 | 没有使用 Token 或其他认证方式 |
| 跨站请求可以携带 Cookie | 未设置 SameSite 或设置为 None |

### CSRF vs XSS 对比

| 对比维度 | CSRF | XSS |
|---------|------|-----|
| 攻击原理 | 利用用户登录状态，伪造请求 | 向页面注入恶意脚本 |
| 攻击目标 | 用户的操作权限 | 用户浏览器环境 |
| 是否需要用户交互 | 部分不需要（自动表单提交） | 通常需要点击链接 |
| 防御重点 | 验证请求来源和操作者意图 | 过滤和转义用户输入 |
| Cookie 作用 | 攻击利用 Cookie 进行身份认证 | 攻击目标是窃取 Cookie |
| 影响范围 | 执行攻击者指定的操作 | 执行任意 JavaScript 代码 |

### 防御措施一：CSRF Token

```javascript
// 服务端生成 CSRF Token 并嵌入页面
// Node.js (Express) 示例
import crypto from 'crypto';

// 生成 Token（每个用户会话独立）
function generateCSRFToken(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  // 将 token 与用户会话关联存储
  // 可以存储在 session 或 redis 中
  session.csrfToken = token;
  return token;
}

// 在 HTML 表单中嵌入 Token
// <form action="/transfer" method="POST">
//   <input type="hidden" name="_csrf" value="<%= csrfToken %>">
//   <input name="to">
//   <input name="amount">
//   <button type="submit">转账</button>
// </form>

// 在 AJAX 请求中携带 Token
fetch('/api/transfer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken  // 自定义头
  },
  body: JSON.stringify({ to: 'user1', amount: 1000 }),
  credentials: 'include'
});

// 服务端验证 Token
function validateCSRFToken(req, res, next) {
  const token = req.body._csrf || req.headers['x-csrf-token'];
  
  if (!token || token !== req.session.csrfToken) {
    return res.status(403).json({ error: 'CSRF token 验证失败' });
  }
  next();
}
```

### 防御措施二：SameSite Cookie

```javascript
// 设置 SameSite Cookie 是最简单有效的 CSRF 防御

// Node.js (Express)
res.cookie('sessionId', 'abc123', {
  sameSite: 'strict', // 最严格：完全禁止跨站发送
  // sameSite: 'lax', // 默认：允许安全的方法（GET）跨站发送
  httpOnly: true,
  secure: true
});

// Java (Spring Boot)
// @Configuration
// public class WebConfig implements WebMvcConfigurer {
//     @Override
//     public void addCorsMappings(CorsRegistry registry) {
//         registry.addMapping("/**")
//             .allowedOrigins("...");
//     }
// }
//
// application.yml:
// server.servlet.session.cookie.same-site: lax

// 不同 SameSite 值对 CSRF 的防护效果
/*
  攻击方式                          Strict    Lax      None
  点击恶意链接（GET 导航）           防御成功  携带Cookie 携带Cookie
  自动提交表单（POST）              防御成功  防御成功  携带Cookie
  XMLHttpRequest/Fetch            防御成功  防御成功  携带Cookie
  <img>/<script>/<iframe> 标签    防御成功  防御成功  携带Cookie
*/
```

### 防御措施三：Referer/Origin 头验证

```javascript
// 服务端验证请求来源
function validateRequestOrigin(req, res, next) {
  // 获取请求来源
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  
  // 允许的域名白名单
  const allowedOrigins = [
    'https://example.com',
    'https://www.example.com'
  ];
  
  // Origin 头验证（更可靠，POST 请求通常携带）
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: '不允许的来源' });
  }
  
  // Referer 头验证（备选）
  if (referer && !allowedOrigins.some(allowed => referer.startsWith(allowed))) {
    return res.status(403).json({ error: '不允许的来源' });
  }
  
  next();
}

// 注意：某些情况下 Referer 可能为空
// - 用户从地址栏直接输入 URL 访问
// - HTTPS → HTTP 降级时（浏览器默认不发送 Referer）
// - 页面设置了 <meta name="referrer" content="no-referrer">
```

### 防御措施四：二次验证

```javascript
// 对敏感操作要求用户进行二次确认

// 1. 验证码（CAPTCHA）
// 转账前要求输入验证码
fetch('/api/transfer', {
  method: 'POST',
  body: JSON.stringify({
    to: 'user1',
    amount: 10000,
    captcha: '用户输入的验证码'
  })
});

// 2. 支付密码/交易密码
// 除登录密码外，设置独立的交易密码
fetch('/api/transfer', {
  method: 'POST',
  body: JSON.stringify({
    to: 'user1',
    amount: 10000,
    tradePassword: '用户输入的交易密码'
  })
});

// 3. 短信/邮箱验证码
// 发送验证码到绑定手机或邮箱

// 4. 生物识别
// 要求指纹或面部识别确认
```

### 主流框架的 CSRF 防护

```java
// Spring Security CSRF 防护（默认启用）
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
            )
            // 对于 API 服务，可以禁用 CSRF（使用 Token 认证）
            // .csrf(csrf -> csrf.disable())
            ;
        return http.build();
    }
}
```

```javascript
// Express csurf 中间件（Express 4.x）
import csurf from 'csurf';
import cookieParser from 'cookie-parser';

app.use(cookieParser());
app.use(csurf({ cookie: true }));

// 将 CSRF token 传递到视图
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// 当 CSRF 验证失败时返回错误
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ error: 'CSRF 攻击检测' });
  }
  next(err);
});
```

### CSRF 攻击的检测和监控

```javascript
// 服务端记录异常请求模式
function csrfMonitor(req, res, next) {
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const userAgent = req.headers['user-agent'];
  const ip = req.ip;
  
  // 检测异常：无 Referer 但有 Origin，且 Origin 不在白名单
  if (!referer && origin && !isAllowedOrigin(origin)) {
    console.warn(`[CSRF警戒] 异常请求: IP=${ip}, Origin=${origin}, Path=${req.path}`);
  }
  
  // 检测异常：请求频率异常
  // 使用 Redis 计数等
  next();
}
```

### 防御策略总结

```text
防御层次（从基础到进阶）：

第一层：浏览器原生防御
  └── SameSite Cookie（Lax 或 Strict）
  
第二层：请求验证
  ├── CSRF Token（嵌入表单和请求头）
  └── Referer/Origin 头验证

第三层：用户确认
  ├── 验证码
  ├── 交易密码
  └── 短信/邮箱二次确认

第四层：架构层面
  ├── 使用 JSON API + Token 认证（替代 Cookie-based 认证）
  └── 设置 CORS 策略
```
