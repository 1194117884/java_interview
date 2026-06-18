# ✅Content Security Policy的原理和配置

# 典型回答

**Content Security Policy（CSP，内容安全策略）** 是一种浏览器安全机制，用于检测和缓解 XSS、数据注入等攻击。CSP 通过白名单机制告诉浏览器**可以加载和执行哪些来源的资源**，即使攻击者注入了恶意代码，浏览器也会根据 CSP 规则阻止其执行。

**工作原理：** 服务器在 HTTP 响应头中添加 `Content-Security-Policy` 字段，定义允许的资源来源。浏览器在解析页面时，根据 CSP 规则对资源加载和脚本执行进行管控。对于违反规则的行为，浏览器可以阻止执行并（可选地）向服务器报告违规日志。

**主要作用：**
1. 限制脚本执行源（防御 XSS 攻击）
2. 限制样式、图片、字体等资源的加载源
3. 阻止内联脚本和 `eval()` 的执行
4. 限制 form 表单的提交目标
5. 控制 iframe 的嵌套来源
6. 检测并报告违规行为

# 扩展知识

### CSP 的配置方式

```html
<!-- 方式1: HTTP 响应头（推荐） -->
Content-Security-Policy: policy-definition

<!-- 方式2: HTML meta 标签 -->
<meta http-equiv="Content-Security-Policy" content="policy-definition">

<!-- 方式3: 仅报告不阻止（用于调试） -->
Content-Security-Policy-Report-Only: policy-definition
```

### 完整的 CSP 指令

```text
Content-Security-Policy:
  default-src 'self';                    # 全局默认策略
  script-src 'self' 'nonce-abc123';       # 脚本来源
  style-src 'self' 'unsafe-inline';       # 样式来源
  img-src 'self' https: data: blob:;      # 图片来源
  font-src 'self' https://fonts.gstatic.com; # 字体来源
  connect-src 'self' https://api.example.com; # XHR/Fetch/WebSocket
  media-src 'self' *.cdn.com;             # 音视频来源
  object-src 'none';                      # <object>/<embed>/<applet>
  frame-src 'self' https://player.vimeo.com; # iframe 来源
  frame-ancestors 'self';                 # 允许谁嵌入本页面（防点击劫持）
  form-action 'self';                     # 表单提交目标
  base-uri 'self';                        # <base> 标签限制
  manifest-src 'self';                    # 应用清单来源
  worker-src 'self';                      # Worker 脚本来源
  report-uri /csp-report-endpoint;        # 违规报告地址
  upgrade-insecure-requests;              # 自动升级 HTTP 为 HTTPS
  block-all-mixed-content;                # 阻止混合内容
```

### CSP 关键指令详解

```text
default-src: 其他指令未指定时的默认值
'self': 只允许同源资源
'none': 不允许任何来源（最严格）
https:: 允许所有 HTTPS 来源
data:: 允许 data: URI（内嵌图片）
blob:: 允许 blob: URI
*.example.com: 允许所有子域名（通配符）

script-src 特有选项:
'unsafe-inline':    允许内联 <script>（⚠️ 降低安全性）
'unsafe-eval':      允许 eval()、setTimeout(string) 等
'strict-dynamic':   允许已信任脚本动态加载的脚本
'nonce-{random}':   只允许带有指定 nonce 属性的脚本
{hash_value}:       只允许内容哈希匹配的内联脚本
```

### 使用 nonce 和 hash 管理内联脚本

```html
<!-- 方案1: 使用 nonce（推荐） -->
<!-- 服务端生成随机 nonce，嵌入 CSP 头和 HTML 中 -->

<!-- CSP header: -->
<!-- script-src 'nonce-8IBTHwOdqNM3kUoR3s6rw' -->

<!-- HTML: -->
<script nonce="8IBTHwOdqNM3kUoR3s6rw">
  // 只有这个内联脚本会被执行
  console.log('安全的脚本');
</script>

<script nonce="8IBTHwOdqNM3kUoR3s6rw" src="app.js"></script>

<!-- 没有正确 nonce 的脚本会被阻止 -->
<script>
  alert('XSS');  // ❌ 被 CSP 阻止
</script>
```

```html
<!-- 方案2: 使用 hash（适合静态内联脚本） -->
<!-- CSP header: -->
<!-- script-src 'sha256-abc123...' 'sha384-def456...' -->

<!-- 只有内容哈希匹配的脚本才能执行 -->
<script>console.log('静态脚本')</script>
```

### strict-dynamic 策略

```
// strict-dynamic 允许已信任的脚本动态创建和执行其他脚本
// 减少了维护白名单的负担

// 不使用 strict-dynamic:
Content-Security-Policy: script-src 'self' https://cdn.example.com 'nonce-abc123'

// 使用 strict-dynamic（自动信任 nonce 脚本加载的后代脚本）:
Content-Security-Policy: script-src 'nonce-abc123' 'strict-dynamic'
// strict-dynamic 会覆盖 self 和 URL 白名单，仅信任 nonce/hash 标记的脚本
```

```javascript
// 在 strict-dynamic 下，以下动态加载行为会被信任
const script = document.createElement('script');
script.src = 'https://cdn.example.com/widget.js';
// 如果父脚本有正确的 nonce，动态加载的脚本也被信任
document.head.appendChild(script);
```

### CSP 配置示例

```html
<!-- 最严格：仅同源资源，无内联 -->
Content-Security-Policy: default-src 'self'

<!-- 典型的企业级配置 -->
Content-Security-Policy:
  default-src 'none';
  script-src 'self' 'nonce-{random}' 'strict-dynamic';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://*.img-cdn.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://api.example.com wss://ws.example.com;
  frame-src 'self' https://player.vimeo.com;
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'self';
  object-src 'none';
  upgrade-insecure-requests;
  block-all-mixed-content;
  report-uri /csp-violations;

<!-- 宽松配置（过渡期使用） -->
Content-Security-Policy: default-src 'self'; img-src *; script-src 'self' 'unsafe-inline' 'unsafe-eval'
```

### CSP 违规报告

```javascript
// 服务端接收 CSP 违规报告
app.post('/csp-violations', (req, res) => {
  const report = req.body['csp-report'] || req.body;
  
  console.warn('CSP 违规:', {
    '被阻止的URI': report['blocked-uri'],
    '违规页面': report['document-uri'],
    '违规指令': report['violated-directive'],
    '原策略': report['original-policy'],
    '来源文件': report['source-file'],
    '行号': report['line-number'],
    '列号': report['column-number'],
    '用户代理': report['user-agent'],
    '时间': new Date().toISOString()
  });
  
  // 可以将违规记录到日志系统或告警
  res.status(204).end();
});
```

```javascript
// 在前端也可以监听 CSP 违规事件（ReportingObserver API）
const observer = new ReportingObserver((reports) => {
  for (const report of reports) {
    if (report.type === 'csp-violation') {
      console.warn('CSP 违规:', report.body);
      // 可以发送到日志服务
    }
  }
}, { types: ['csp-violation'] });

observer.observe();
```

### CSP 与其他安全头配合

```javascript
// 完整的 Web 安全头配置
const helmet = require('helmet');
app.use(helmet());

// 手动配置
app.use((req, res, next) => {
  // CSP
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  // 防止 MIME 类型嗅探
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // 防止页面被嵌入 iframe（点击劫持）
  res.setHeader('X-Frame-Options', 'DENY');
  
  // 启用 XSS 过滤器（旧浏览器）
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // 强制 HTTPS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // 控制 Referer 信息
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // 限制权限 API
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  
  next();
});
```

### CSP 的浏览器兼容性

| 浏览器 | 最低版本 | 支持情况 |
|--------|---------|---------|
| Chrome | 25+ | 完整支持 |
| Firefox | 23+ | 完整支持 |
| Safari | 7+ | 大部分支持 |
| Edge | 14+ | 完整支持（Chromium版本） |
| IE | 10-11 | 仅部分支持（X-Content-Security-Policy） |

### CSP 常见问题排查

```text
问题1: 使用了非安全 CDN 资源
场景: 页面中加载了 http://cdn.example.com 的资源
解决: 确保所有资源使用 HTTPS；在 CSP 中添加 https://cdn.example.com

问题2: 内联脚本被阻止
场景: 页面中的 <script>alert(1)</script> 被阻止
解决: 使用 nonce 或 hash，或添加 'unsafe-inline'（不推荐）

问题3: eval() 被阻止
场景: 使用了 JSON.parse 以外的字符串解析方式
解决: 使用 JSON.parse 替代 eval；添加 'unsafe-eval'（不推荐）

问题4: 浏览器扩展注入的脚本被阻止
场景: 安装了浏览器扩展后页面功能异常
解决: 这不是 CSP 配置问题，扩展应在独立环境中运行

问题5: Report-Only 模式下的误报
场景: 生产环境开启后出现大量违规报告
解决: 先将规则配置为 Report-Only 模式，收集并分析违规报告，
      调整配置后再强制实施
```
