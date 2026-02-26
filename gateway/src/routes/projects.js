/**
 * /api/projects  and  /api/sprints  →  FastAPI
 *
 * GET    /api/organizations
 * POST   /api/organizations
 * PATCH  /api/organizations/:id
 * DELETE /api/organizations/:id
 *
 * GET    /api/projects[?org_id=]
 * POST   /api/projects
 * GET    /api/projects/:id
 * PATCH  /api/projects/:id
 * DELETE /api/projects/:id
 *
 * GET    /api/projects/:id/sprints
 * POST   /api/projects/:id/sprints
 * PATCH  /api/sprints/:id
 * POST   /api/sprints/:id/activate
 * POST   /api/sprints/:id/complete
 * DELETE /api/sprints/:id
 */
const express = require('express');
const { proxyRequest } = require('../middleware/proxy');

const router = express.Router();
const FASTAPI = () => process.env.FASTAPI_URL || 'http://localhost:8000';

/* ── Organizations ───────────────────────────────────────────────────────── */
router.get('/organizations',       (req, res) => proxyRequest(req, res, FASTAPI(), '/organizations'));
router.post('/organizations',      (req, res) => proxyRequest(req, res, FASTAPI(), '/organizations'));
router.patch('/organizations/:id', (req, res) => proxyRequest(req, res, FASTAPI(), `/organizations/${req.params.id}`));
router.delete('/organizations/:id',(req, res) => proxyRequest(req, res, FASTAPI(), `/organizations/${req.params.id}`));

/* ── Projects ────────────────────────────────────────────────────────────── */
router.get('/projects', (req, res) => {
  const qs = new URLSearchParams(req.query).toString();
  proxyRequest(req, res, FASTAPI(), `/projects${qs ? '?' + qs : ''}`);
});

router.post('/projects',       (req, res) => proxyRequest(req, res, FASTAPI(), '/projects'));
router.get('/projects/:id',    (req, res) => proxyRequest(req, res, FASTAPI(), `/projects/${req.params.id}`));
router.patch('/projects/:id',  (req, res) => proxyRequest(req, res, FASTAPI(), `/projects/${req.params.id}`));
router.delete('/projects/:id', (req, res) => proxyRequest(req, res, FASTAPI(), `/projects/${req.params.id}`));

/* ── Team Members ────────────────────────────────────────────────────────── */
router.get('/projects/:id/team_members',                        (req, res) => proxyRequest(req, res, FASTAPI(), `/projects/${req.params.id}/team_members`));
router.post('/projects/:id/team_members',                       (req, res) => proxyRequest(req, res, FASTAPI(), `/projects/${req.params.id}/team_members`));
router.patch('/projects/:id/team_members/:memberId',            (req, res) => proxyRequest(req, res, FASTAPI(), `/projects/${req.params.id}/team_members/${req.params.memberId}`));
router.delete('/projects/:id/team_members/:memberId',           (req, res) => proxyRequest(req, res, FASTAPI(), `/projects/${req.params.id}/team_members/${req.params.memberId}`));

/* ── Roles ───────────────────────────────────────────────────────────────── */
router.get('/projects/:id/roles/:userId',  (req, res) => proxyRequest(req, res, FASTAPI(), `/projects/${req.params.id}/roles/${req.params.userId}`));
router.post('/projects/:id/roles',         (req, res) => proxyRequest(req, res, FASTAPI(), `/projects/${req.params.id}/roles`));
router.patch('/roles/:roleId',             (req, res) => proxyRequest(req, res, FASTAPI(), `/roles/${req.params.roleId}`));

/* ── Sprints ─────────────────────────────────────────────────────────────── */
router.get('/projects/:id/sprints',  (req, res) => proxyRequest(req, res, FASTAPI(), `/projects/${req.params.id}/sprints`));
router.post('/projects/:id/sprints', (req, res) => proxyRequest(req, res, FASTAPI(), `/projects/${req.params.id}/sprints`));

router.patch('/sprints/:id',            (req, res) => proxyRequest(req, res, FASTAPI(), `/sprints/${req.params.id}`));
router.post('/sprints/:id/activate',    (req, res) => proxyRequest(req, res, FASTAPI(), `/sprints/${req.params.id}/activate`));
router.post('/sprints/:id/complete',    (req, res) => proxyRequest(req, res, FASTAPI(), `/sprints/${req.params.id}/complete`));
router.delete('/sprints/:id',           (req, res) => proxyRequest(req, res, FASTAPI(), `/sprints/${req.params.id}`));

/* ── Retrospectives ──────────────────────────────────────────────────────── */
router.get('/sprints/:id/retrospective',   (req, res) => proxyRequest(req, res, FASTAPI(), `/sprints/${req.params.id}/retrospective`));
router.post('/sprints/:id/retrospective',  (req, res) => proxyRequest(req, res, FASTAPI(), `/sprints/${req.params.id}/retrospective`));
router.patch('/sprints/:id/retrospective', (req, res) => proxyRequest(req, res, FASTAPI(), `/sprints/${req.params.id}/retrospective`));

module.exports = router;
