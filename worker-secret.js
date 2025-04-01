// worker-secret.js
// Warning: Do not attempt to use this code under any production environment!
// Warning: Use this code only for testing purposes!

// 页面同时部署了Turnstile
// 定义 Turnstile 的 sitekey (替换为你自己的)
const TURNSTILE_SITEKEY = '<site_key>';

// 辅助函数：生成随机ID
const generateId = () => crypto.randomUUID();

// 辅助函数：HTML 模板
const html = (strings, ...values) => String.raw({ raw: strings }, ...values);

// 主页面模板
const mainPage = (turnstileSitekey, error = '') => html`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>阅后即焚</title>
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
    <style>
        :root {
            --primary: #4f46e5;
            --primary-hover: #4338ca;
            --danger: #dc2626;
            --danger-hover: #b91c1c;
            --bg: #f9fafb;
            --card-bg: #ffffff;
            --text: #111827;
            --text-secondary: #6b7280;
            --border: #e5e7eb;
        }
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        }
        
        body {
            background-color: var(--bg);
            color: var(--text);
            line-height: 1.5;
            padding: 1rem;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .container {
            max-width: 640px;
            width: 100%;
            margin: 2rem auto;
        }
        
        .card {
            background-color: var(--card-bg);
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
            padding: 2rem;
            margin-bottom: 1.5rem;
        }
        
        h1 {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
            text-align: center;
        }
        
        .form-group {
            margin-bottom: 1.25rem;
        }
        
        label {
            display: block;
            font-weight: 500;
            margin-bottom: 0.5rem;
        }
        
        textarea {
            width: 100%;
            min-height: 150px;
            padding: 0.75rem;
            border: 1px solid var(--border);
            border-radius: 0.375rem;
            resize: vertical;
            font-size: 1rem;
        }
        
        textarea:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }
        
        /* 新增开关样式 */
        .switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
          margin-right: 0.75rem;
        }
        
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
          border-radius: 34px;
        }
        
        .slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 2px;
          bottom: 2px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        
        input:checked + .slider {
          background-color: var(--primary);
        }
        
        input:checked + .slider:before {
          transform: translateX(20px);
        }
        
        /* 修改后的复选框组样式 */
        .checkbox-group {
          display: flex;
          align-items: center;
          margin-bottom: 1.5rem;
          padding: 0.75rem;
          background-color: var(--bg);
          border-radius: 0.375rem;
          transition: background-color 0.2s;
        }
        
        .checkbox-group:hover {
          background-color: #f3f4f6;
        }
        
        .checkbox-label {
          font-weight: 500;
          color: var(--text);
          cursor: pointer;
          user-select: none;
        }
        
        .button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.75rem 1.5rem;
            border-radius: 0.375rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
            border: none;
            font-size: 1rem;
            width: 100%;
        }
        
        .button-primary {
            background-color: var(--primary);
            color: white;
        }
        
        .button-primary:hover {
            background-color: var(--primary-hover);
        }
        
        .button-danger {
            background-color: var(--danger);
            color: white;
        }
        
        .button-danger:hover {
            background-color: var(--danger-hover);
        }
        
        .error {
            color: var(--danger);
            margin-bottom: 1rem;
            text-align: center;
        }
        
        .success {
            color: var(--primary);
            margin-bottom: 1rem;
            text-align: center;
        }
        
        .link {
            color: var(--primary);
            text-decoration: none;
        }
        
        .link:hover {
            text-decoration: underline;
        }
        
        .message-container {
            white-space: pre-wrap;
            padding: 1rem;
            background-color: #f3f4f6;
            border-radius: 0.375rem;
            margin-bottom: 1.5rem;
        }
        
        .copy-button {
            margin-top: 1rem;
            background-color: var(--card-bg);
            border: 1px solid var(--border);
            color: var(--text);
        }
        
        .copy-button:hover {
            background-color: #f3f4f6;
        }
        
        footer {
            margin-top: 2rem;
            text-align: center;
            color: var(--text-secondary);
            font-size: 0.875rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <h1>阅后即焚 - 安全消息分享</h1>
            
            ${error ? `<div class="error">${error}</div>` : ''}
            
            <form id="messageForm" method="POST">
                <div class="form-group">
                    <label for="message">输入您的秘密消息：</label>
                    <textarea id="message" name="message" required></textarea>
                </div>
                
                <div class="checkbox-group">
                  <label class="switch">
                    <input type="checkbox" id="burnAfterReading" name="burnAfterReading" checked>
                    <span class="slider"></span>
                  </label>
                  <label class="checkbox-label" for="burnAfterReading">阅后即焚（链接打开一次后立即失效）</label>
                </div>
                
                <div class="cf-turnstile" data-sitekey="${turnstileSitekey}" data-callback="onTurnstileSuccess"></div>
                <input type="hidden" id="turnstileToken" name="turnstileToken">
                
                <button type="submit" class="button button-primary" id="submitButton" disabled>创建秘密链接</button>
            </form>
        </div>
        
        <footer>
            <p>阅后即焚 - 安全消息分享服务</p>
        </footer>
    </div>
    
    <script>
        function onTurnstileSuccess(token) {
            document.getElementById('turnstileToken').value = token;
            document.getElementById('submitButton').disabled = false;
        }
    </script>
</body>
</html>
`;

// 成功页面模板
const successPage = (messageId, origin) => html`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>消息创建成功 - 阅后即焚</title>
    <style>
        :root {
            --primary: #4f46e5;
            --primary-hover: #4338ca;
            --danger: #dc2626;
            --danger-hover: #b91c1c;
            --bg: #f9fafb;
            --card-bg: #ffffff;
            --text: #111827;
            --text-secondary: #6b7280;
            --border: #e5e7eb;
        }
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        }
        
        body {
            background-color: var(--bg);
            color: var(--text);
            line-height: 1.5;
            padding: 1rem;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .container {
            max-width: 640px;
            width: 100%;
            margin: 2rem auto;
        }
        
        .card {
            background-color: var(--card-bg);
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
            padding: 2rem;
            margin-bottom: 1.5rem;
        }
        
        h1 {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
            text-align: center;
        }
        
        .success {
            color: var(--primary);
            margin-bottom: 1.5rem;
            text-align: center;
        }
        
        .link-container {
            display: flex;
            margin-bottom: 1.5rem;
        }
        
        .link-input {
            flex: 1;
            padding: 0.75rem;
            border: 1px solid var(--border);
            border-radius: 0.375rem 0 0 0.375rem;
            font-size: 1rem;
        }
        
        .copy-button {
            padding: 0.75rem 1rem;
            background-color: var(--primary);
            color: white;
            border: none;
            border-radius: 0 0.375rem 0.375rem 0;
            cursor: pointer;
            transition: background-color 0.15s ease;
        }
        
        .copy-button:hover {
            background-color: var(--primary-hover);
        }
        
        .button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.75rem 1.5rem;
            border-radius: 0.375rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
            border: none;
            font-size: 1rem;
            width: 100%;
        }
        
        .button-primary {
            background-color: var(--primary);
            color: white;
        }
        
        .button-primary:hover {
            background-color: var(--primary-hover);
        }
        
        footer {
            margin-top: 2rem;
            text-align: center;
            color: var(--text-secondary);
            font-size: 0.875rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <h1>消息创建成功</h1>
            
            <div class="success">
                您的秘密消息链接已生成，请复制并分享给接收者：
            </div>
            
            <div class="link-container">
                <input type="text" class="link-input" id="messageLink" value="${origin}/view/${messageId}" readonly>
                <button class="copy-button" onclick="copyLink()">复制</button>
            </div>
            
            <div class="warning">
                <p><strong>请注意：</strong>此链接只能访问一次，访问后消息将${messageId.endsWith('-burn') ? '被永久删除' : '保留'}。</p>
            </div>
            
            <button class="button button-primary" onclick="window.location.href='/'">创建新消息</button>
        </div>
        
        <footer>
            <p>阅后即焚 - 安全消息分享服务</p>
        </footer>
    </div>
    
    <script>
        function copyLink() {
            const linkInput = document.getElementById('messageLink');
            linkInput.select();
            document.execCommand('copy');
            
            const copyButton = document.querySelector('.copy-button');
            copyButton.textContent = '已复制!';
            setTimeout(() => {
                copyButton.textContent = '复制';
            }, 2000);
        }
    </script>
</body>
</html>
`;

// 查看消息页面模板
const viewMessagePage = (message, isBurnAfterReading, origin) => html`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>查看秘密消息 - 阅后即焚</title>
    <style>
        :root {
            --primary: #4f46e5;
            --primary-hover: #4338ca;
            --danger: #dc2626;
            --danger-hover: #b91c1c;
            --bg: #f9fafb;
            --card-bg: #ffffff;
            --text: #111827;
            --text-secondary: #6b7280;
            --border: #e5e7eb;
        }
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        }
        
        body {
            background-color: var(--bg);
            color: var(--text);
            line-height: 1.5;
            padding: 1rem;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .container {
            max-width: 640px;
            width: 100%;
            margin: 2rem auto;
        }
        
        .card {
            background-color: var(--card-bg);
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
            padding: 2rem;
            margin-bottom: 1.5rem;
        }
        
        h1 {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
            text-align: center;
        }
        
        .message-container {
            white-space: pre-wrap;
            padding: 1rem;
            background-color: #f3f4f6;
            border-radius: 0.375rem;
            margin-bottom: 1.5rem;
        }
        
        .button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.75rem 1.5rem;
            border-radius: 0.375rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
            border: none;
            font-size: 1rem;
            width: 100%;
        }
        
        .button-primary {
            background-color: var(--primary);
            color: white;
        }
        
        .button-primary:hover {
            background-color: var(--primary-hover);
        }
        
        .copy-button {
            margin-top: 1rem;
            background-color: var(--card-bg);
            border: 1px solid var(--border);
            color: var(--text);
        }
        
        .copy-button:hover {
            background-color: #f3f4f6;
        }
        
        footer {
            margin-top: 2rem;
            text-align: center;
            color: var(--text-secondary);
            font-size: 0.875rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <h1>秘密消息</h1>
            
            <div class="message-container">
                ${message}
            </div>
            
            ${isBurnAfterReading ? `
                <div class="warning">
                    <p><strong>注意：</strong>此消息已被设置为阅后即焚，刷新页面将无法再次查看。</p>
                </div>
            ` : ''}
            
            <button class="button button-primary" onclick="window.location.href='/'">创建新消息</button>
            
            <button class="button copy-button" onclick="copyMessage()">复制消息</button>
        </div>
        
        <footer>
            <p>使用 Cloudflare Workers 和 Turnstile 构建的安全消息分享服务</p>
        </footer>
    </div>
    
    <script>
        function copyMessage() {
            const message = document.querySelector('.message-container').textContent;
            navigator.clipboard.writeText(message).then(() => {
                const button = document.querySelector('.copy-button');
                button.textContent = '已复制!';
                setTimeout(() => {
                    button.textContent = '复制消息';
                }, 2000);
            });
        }
    </script>
</body>
</html>
`;

// 错误页面模板
const errorPage = (message) => html`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>错误 - 阅后即焚</title>
    <style>
        :root {
            --primary: #4f46e5;
            --danger: #dc2626;
            --bg: #f9fafb;
            --card-bg: #ffffff;
            --text: #111827;
            --text-secondary: #6b7280;
        }
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        }
        
        body {
            background-color: var(--bg);
            color: var(--text);
            line-height: 1.5;
            padding: 1rem;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        
        .card {
            background-color: var(--card-bg);
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
            padding: 2rem;
            text-align: center;
            max-width: 640px;
            width: 100%;
        }
        
        h1 {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: var(--danger);
        }
        
        p {
            margin-bottom: 1.5rem;
        }
        
        .button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.75rem 1.5rem;
            border-radius: 0.375rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
            border: none;
            font-size: 1rem;
            background-color: var(--primary);
            color: white;
            text-decoration: none;
        }
        
        footer {
            margin-top: 2rem;
            text-align: center;
            color: var(--text-secondary);
            font-size: 0.875rem;
        }
    </style>
</head>
<body>
    <div class="card">
        <h1>发生错误</h1>
        <p>${message}</p>
        <a href="/" class="button">返回首页</a>
    </div>
    
    <footer>
        <p>阅后即焚 - 安全消息分享服务</p>
    </footer>
</body>
</html>
`;

// 验证 Turnstile token
async function validateTurnstile(token, ip, secret) {
  const formData = new FormData();
  formData.append('secret', secret);
  formData.append('response', token);
  formData.append('remoteip', ip);

  const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData,
  });

  const outcome = await result.json();
  return outcome.success;
}

// 处理请求
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const origin = url.origin;
  const path = url.pathname;
  const clientIp = request.headers.get('CF-Connecting-IP');

  // 首页 - 显示表单
  if (path === '/' && request.method === 'GET') {
    return new Response(mainPage(TURNSTILE_SITEKEY), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // 提交表单 - 创建消息
  if (path === '/' && request.method === 'POST') {
    try {
      const formData = await request.formData();
      const message = formData.get('message');
      const burnAfterReading = formData.get('burnAfterReading') === 'on';
      const turnstileToken = formData.get('turnstileToken');

      // 验证 Turnstile token
      if (!turnstileToken || !await validateTurnstile(turnstileToken, clientIp, env.TURNSTILE_SECRET_KEY)) {
        return new Response(mainPage(TURNSTILE_SITEKEY, '验证失败，请完成人机验证'), {
          status: 400,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      // 验证消息内容
      if (!message || message.trim().length === 0) {
        return new Response(mainPage(TURNSTILE_SITEKEY, '请输入消息内容'), {
          status: 400,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      // 生成消息ID
      const messageId = generateId() + (burnAfterReading ? '-burn' : '');

      // 存储消息到 KV
      await env.SECRET_MESSAGES.put(messageId, message, {
        metadata: {
          burnAfterReading,
          createdAt: new Date().toISOString(),
        },
      });

      // 返回成功页面
      return new Response(successPage(messageId, origin), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    } catch (error) {
      return new Response(errorPage('处理请求时发生错误: ' + error.message), {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
  }

  // 查看消息
  if (path.startsWith('/view/')) {
    const messageId = path.split('/view/')[1];

    try {
      // 从 KV 获取消息
      const message = await env.SECRET_MESSAGES.get(messageId);
      const metadata = await env.SECRET_MESSAGES.getWithMetadata(messageId);

      if (!message) {
        return new Response(errorPage('消息不存在或已被删除'), {
          status: 404,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      // 如果是阅后即焚消息，查看后删除
      const isBurnAfterReading = metadata.metadata?.burnAfterReading || messageId.endsWith('-burn');
      if (isBurnAfterReading) {
        await env.SECRET_MESSAGES.delete(messageId);
      }

      // 返回消息查看页面
      return new Response(viewMessagePage(message, isBurnAfterReading, origin), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    } catch (error) {
      return new Response(errorPage('获取消息时发生错误: ' + error.message), {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
  }

  // 404 处理
  return new Response(errorPage('页面未找到'), {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export default {
  async fetch(request, env) {
    return handleRequest(request, env);
  },
};