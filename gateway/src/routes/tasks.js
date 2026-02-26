/**
 * /api/tasks  →  FastAPI /tasks
 *
 * GET   /api/tasks                       list all tasks
 * PATCH /api/tasks/:taskId               update status/fields
 * GET   /api/tasks/:taskId/updates       daily updates log
 * GET   /api/tasks/export/excel          Excel export
 */
const express = require('express');
const { proxyRequest } = require('../middleware/proxy');

const router = express.Router();
const FASTAPI = () => process.env.FASTAPI_URL || 'http://localhost:8000';

router.get('/', (req, res) => {
  proxyRequest(req, res, FASTAPI(), '/tasks');
});

router.get('/export/excel', (req, res) => {
  proxyRequest(req, res, FASTAPI(), '/export/excel');
});

router.get('/:taskId/updates', (req, res) => {
  proxyRequest(req, res, FASTAPI(), `/tasks/${req.params.taskId}/updates`);
});

router.patch('/:taskId', (req, res) => {
  proxyRequest(req, res, FASTAPI(), `/tasks/${req.params.taskId}`);
});

module.exports = router;
