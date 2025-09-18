const httpRequest = async function(url, data, config) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    config = config || {};
    const method = (config.method || 'GET').toUpperCase();
    const headers = {
      'Content-Type': 'application/json',
      ...config.headers
    };

    // 处理GET请求的查询参数
    let parsedUrl = url;
    if (method === 'GET' && data) {
      const query = new URLSearchParams(data).toString();
      parsedUrl += `${url.includes('?') ? '&' : '?'}${query}`;
    }

    xhr.open(method, parsedUrl, true);

    // 设置请求头
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }

    // 处理响应
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = {
          data: parseResponse(xhr),
          status: xhr.status,
          statusText: xhr.statusText,
          headers: parseHeaders(xhr.getAllResponseHeaders())
        };
        resolve(response);
      } else {
        handleError(xhr, reject);
      }
    };

    xhr.onerror = function() {
      handleError(new Error('Network Error'), reject);
    };

    xhr.ontimeout = function() {
      handleError(new Error(`Timeout of ${config.timeout}ms exceeded`), reject);
    };

    if (config.timeout) {
      xhr.timeout = config.timeout;
    }

    // 发送请求体
    let body = null;
    if (method !== 'GET' && data) {
      body = headers['Content-Type'] === 'application/json' 
        ? JSON.stringify(data) 
        : new URLSearchParams(data).toString();
    }
    xhr.send(body);
  });
};

// 辅助函数：解析响应内容
function parseResponse(xhr) {
  const contentType = xhr.getResponseHeader('Content-Type') || '';
  try {
    if (contentType.includes('application/json')) {
      return JSON.parse(xhr.responseText);
    }
    return xhr.responseText;
  } catch (e) {
    return xhr.responseText;
  }
}

// 辅助函数：解析响应头
function parseHeaders(headerString) {
  const headers = {};
  headerString.split('\r\n').forEach(line => {
    if (line) {
      const [key, value] = line.split(': ');
      headers[key.toLowerCase()] = value;
    }
  });
  return headers;
}

// 辅助函数：统一错误处理
function handleError(error, reject) {
  reject(error);
}
module.exports = httpRequest
