/**
 * /api/workitems  →  FastAPI /workitems
 *
 * GET    /api/workitems          list (supports ?type=&state=&assigned_to=&sprint=&search=)
 * POST   /api/workitems          create
 * DELETE /api/workitems/:taskId  delete
 */
const express = require('express');
const { proxyRequest } = require('../middleware/proxy');

const router = express.Router();
const FASTAPI = () => process.env.FASTAPI_URL || 'http://localhost:8000';

// GET /api/workitems?type=Epic&state=Active ...
router.get('/', (req, res) => {
  const qs = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, FASTAPI(), `/workitems${qs ? '?' + qs : ''}`);
});

// POST /api/workitems
router.post('/', (req, res) => {
  proxyRequest(req, res, FASTAPI(), '/workitems');
});

// PATCH /api/workitems/:taskId
router.patch('/:taskId', (req, res) => {
  proxyRequest(req, res, FASTAPI(), `/workitems/${req.params.taskId}`);
});

// DELETE /api/workitems/:taskId
router.delete('/:taskId', (req, res) => {
  proxyRequest(req, res, FASTAPI(), `/workitems/${req.params.taskId}`);
});

module.exports = router;
