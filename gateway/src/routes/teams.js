/**
 * Team & User management routes → FastAPI
 *
 * GET    /api/users
 * POST   /api/users
 * GET    /api/users/:id
 * PATCH  /api/users/:id
 * DELETE /api/users/:id
 *
 * GET    /api/teams
 * POST   /api/teams
 * GET    /api/teams/:id
 * PATCH  /api/teams/:id
 * DELETE /api/teams/:id
 *
 * GET    /api/teams/:id/members
 * POST   /api/teams/:id/members
 * DELETE /api/teams/:id/members/:userId
 *
 * GET    /api/projects/:id/teams
 * POST   /api/projects/:id/teams/:teamId
 * DELETE /api/projects/:id/teams/:teamId
 *
 * GET    /api/projects/:id/access/:userId
 */
const express = require('express');
const { proxyRequest } = require('../middleware/proxy');

const router = express.Router();
const FASTAPI = () => process.env.FASTAPI_URL || 'http://localhost:8000';

/* ── Users ──────────────────────────────────────────────────────────────────── */
router.get('/users',       (req, res) => proxyRequest(req, res, FASTAPI(), '/users'));
router.post('/users',      (req, res) => proxyRequest(req, res, FASTAPI(), '/users'));
router.get('/users/:id',   (req, res) => proxyRequest(req, res, FASTAPI(), `/users/${req.params.id}`));
router.patch('/users/:id', (req, res) => proxyRequest(req, res, FASTAPI(), `/users/${req.params.id}`));
router.delete('/users/:id',(req, res) => proxyRequest(req, res, FASTAPI(), `/users/${req.params.id}`));

/* ── Teams CRUD ─────────────────────────────────────────────────────────────── */
router.get('/teams',        (req, res) => proxyRequest(req, res, FASTAPI(), '/teams'));
router.post('/teams',       (req, res) => proxyRequest(req, res, FASTAPI(), '/teams'));
router.get('/teams/:id',    (req, res) => proxyRequest(req, res, FASTAPI(), `/teams/${req.params.id}`));
router.patch('/teams/:id',  (req, res) => proxyRequest(req, res, FASTAPI(), `/teams/${req.params.id}`));
router.delete('/teams/:id', (req, res) => proxyRequest(req, res, FASTAPI(), `/teams/${req.params.id}`));

/* ── Team members ───────────────────────────────────────────────────────────── */
router.get('/teams/:id/members',               (req, res) => proxyRequest(req, res, FASTAPI(), `/teams/${req.params.id}/members`));
router.post('/teams/:id/members',              (req, res) => proxyRequest(req, res, FASTAPI(), `/teams/${req.params.id}/members`));
router.delete('/teams/:id/members/:userId',    (req, res) => proxyRequest(req, res, FASTAPI(), `/teams/${req.params.id}/members/${req.params.userId}`));

/* ── Project ↔ Team mapping ─────────────────────────────────────────────────── */
router.get('/projects/:id/teams',              (req, res) => proxyRequest(req, res, FASTAPI(), `/projects/${req.params.id}/teams`));
router.post('/projects/:id/teams/:teamId',     (req, res) => proxyRequest(req, res, FASTAPI(), `/projects/${req.params.id}/teams/${req.params.teamId}`));
router.delete('/projects/:id/teams/:teamId',   (req, res) => proxyRequest(req, res, FASTAPI(), `/projects/${req.params.id}/teams/${req.params.teamId}`));

/* ── Access check ───────────────────────────────────────────────────────────── */
router.get('/projects/:id/access/:userId',     (req, res) => proxyRequest(req, res, FASTAPI(), `/projects/${req.params.id}/access/${req.params.userId}`));

module.exports = router;
