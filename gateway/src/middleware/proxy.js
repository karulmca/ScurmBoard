/**
 * Lightweight HTTP proxy helper.
 * Uses Node's built-in http/https modules so we don't need http-proxy-middleware
 * to handle multipart/file uploads transparently.
 */
const http  = require('http');
const https = require('https');
const { URL } = require('url');

/**
 * Forward an incoming Express request to a target URL and pipe the response back.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {string} targetBase  e.g. "http://localhost:8000"
 * @param {string} targetPath  e.g. "/workitems?type=Epic"
 */
function proxyRequest(req, res, targetBase, targetPath) {
  const target = new URL(targetPath, targetBase);
  const transport = target.protocol === 'https:' ? https : http;

  // Forward original query string if not already included
  if (req.url.includes('?') && !targetPath.includes('?')) {
    target.search = new URL(req.url, 'http://dummy').search;
  }

  const options = {
    hostname: target.hostname,
    port:     target.port || (target.protocol === 'https:' ? 443 : 80),
    path:     target.pathname + target.search,
    method:   req.method,
    headers: {
      ...req.headers,
      host: target.host,           // rewrite host header
    },
  };

  const proxyReq = transport.request(options, (proxyRes) => {
    res.status(proxyRes.statusCode);
    // Forward response headers (except hop-by-hop)
    Object.entries(proxyRes.headers).forEach(([key, val]) => {
      if (!['connection', 'transfer-encoding', 'keep-alive'].includes(key.toLowerCase())) {
        res.setHeader(key, val);
      }
    });
    // Always set CORS headers for proxied responses
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('[Proxy Error]', err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'FastAPI backend unavailable', detail: err.message });
    }
  });

  // Pipe request body for POST/PATCH/PUT
  if (['POST', 'PATCH', 'PUT'].includes(req.method)) {
    // express.json() already consumed the stream – re-serialise from req.body
    if (req.body !== undefined && !req.is('multipart/*')) {
      const bodyStr = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyStr));
      proxyReq.write(bodyStr);
      proxyReq.end();
    } else {
      req.pipe(proxyReq, { end: true });
    }
  } else {
    proxyReq.end();
  }
}

module.exports = { proxyRequest };
