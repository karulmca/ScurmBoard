/**
 * /api/config  →  FastAPI /config
 *
 * GET  /api/config[?org_id=]         effective config for an org
 * POST /api/config                   upsert a config key
 * GET  /api/config/defaults          raw system defaults
 * DELETE /api/config/:key[?org_id=]  reset a key to default
 */
const express = require('express');
const { proxyRequest } = require('../middleware/proxy');

const router = express.Router();
const FASTAPI = () => process.env.FASTAPI_URL || 'http://localhost:8000';

router.get('/defaults',  (req, res) => proxyRequest(req, res, FASTAPI(), '/config/defaults'));
router.get('/',          (req, res) => {
  const qs = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, FASTAPI(), `/config${qs ? '?' + qs : ''}`);
});
router.post('/',         (req, res) => proxyRequest(req, res, FASTAPI(), '/config'));
router.delete('/:key',   (req, res) => {
  const qs = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, FASTAPI(), `/config/${req.params.key}${qs ? '?' + qs : ''}`);
});

module.exports = router;
