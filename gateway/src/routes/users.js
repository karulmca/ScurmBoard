/**
 * /api/login      →  FastAPI /login
 * /api/register   →  FastAPI /register
 * /api/users      →  FastAPI /users
 */
const express = require('express');
const { proxyRequest } = require('../middleware/proxy');

const router = express.Router();
const FASTAPI = () => process.env.FASTAPI_URL || 'http://localhost:8000';

// POST /api/login
router.post('/login', (req, res) => {
  proxyRequest(req, res, FASTAPI(), '/login');
});

// POST /api/register
router.post('/register', (req, res) => {
  proxyRequest(req, res, FASTAPI(), '/register');
});

// GET /api/users
router.get('/', (req, res) => {
  proxyRequest(req, res, FASTAPI(), '/users');
});

// GET /api/users/:userId
router.get('/:userId', (req, res) => {
  proxyRequest(req, res, FASTAPI(), `/users/${req.params.userId}`);
});

// POST /api/users
router.post('/', (req, res) => {
  proxyRequest(req, res, FASTAPI(), '/users');
});

// PATCH /api/users/:userId
router.patch('/:userId', (req, res) => {
  proxyRequest(req, res, FASTAPI(), `/users/${req.params.userId}`);
});

// DELETE /api/users/:userId
router.delete('/:userId', (req, res) => {
  proxyRequest(req, res, FASTAPI(), `/users/${req.params.userId}`);
});

// GET /api/projects/:projectId/roles/:userId
router.get('/projects/:projectId/roles/:userId', (req, res) => {
  proxyRequest(req, res, FASTAPI(), `/projects/${req.params.projectId}/roles/${req.params.userId}`);
});

// POST /api/projects/:projectId/roles
router.post('/projects/:projectId/roles', (req, res) => {
  proxyRequest(req, res, FASTAPI(), `/projects/${req.params.projectId}/roles`);
});

// PATCH /api/roles/:roleId
router.patch('/roles/:roleId', (req, res) => {
  proxyRequest(req, res, FASTAPI(), `/roles/${req.params.roleId}`);
});

// DELETE /api/roles/:roleId
router.delete('/roles/:roleId', (req, res) => {
  proxyRequest(req, res, FASTAPI(), `/roles/${req.params.roleId}`);
});

module.exports = router;
