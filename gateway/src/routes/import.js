/**
 * /api/import  →  FastAPI /import
 *
 * POST /api/import   multipart file upload (ADO dump CSV/Excel/JSON)
 *
 * We use multer to receive the file in memory, then re-POST it to FastAPI
 * as a multipart form — preserving the original "file" field name.
 */
const express  = require('express');
const multer   = require('multer');
const http     = require('http');
const https    = require('https');
const { URL }  = require('url');
const FormData = require('form-data'); // Node built-in (no extra dep needed in Node 18+)

const router  = express.Router();
const upload  = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
const FASTAPI = () => process.env.FASTAPI_URL || 'http://localhost:8000';

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded. Use field name "file".' });
  }

  // Build a new multipart body to forward to FastAPI
  const form = new FormData();
  form.append('file', req.file.buffer, {
    filename:    req.file.originalname,
    contentType: req.file.mimetype,
  });

  const target    = new URL('/import', FASTAPI());
  const transport = target.protocol === 'https:' ? https : http;

  const options = {
    hostname: target.hostname,
    port:     target.port || 80,
    path:     target.pathname,
    method:   'POST',
    headers:  form.getHeaders(),
  };

  const proxyReq = transport.request(options, (proxyRes) => {
    let body = '';
    proxyRes.setEncoding('utf8');
    proxyRes.on('data', (chunk) => { body += chunk; });
    proxyRes.on('end', () => {
      try {
        res.status(proxyRes.statusCode).json(JSON.parse(body));
      } catch {
        res.status(proxyRes.statusCode).send(body);
      }
    });
  });

  proxyReq.on('error', (err) => {
    console.error('[Import Proxy Error]', err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'FastAPI backend unavailable', detail: err.message });
    }
  });

  form.pipe(proxyReq);
});

module.exports = router;
