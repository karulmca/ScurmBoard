/**
 * /api/reports  →  FastAPI /reports
 *
 * GET /api/reports/daily
 * GET /api/reports/weekly
 * GET /api/reports/monthly
 */
const express = require('express');
const { proxyRequest } = require('../middleware/proxy');

const router = express.Router();
const FASTAPI = () => process.env.FASTAPI_URL || 'http://localhost:8000';

router.get('/daily', (req, res) => {
  proxyRequest(req, res, FASTAPI(), '/reports/daily');
});

router.get('/weekly', (req, res) => {
  proxyRequest(req, res, FASTAPI(), '/reports/weekly');
});

router.get('/monthly', (req, res) => {
  proxyRequest(req, res, FASTAPI(), '/reports/monthly');
});

module.exports = router;
