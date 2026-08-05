const fs = require('fs');
const http = require('http');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const STATIC_FILES = { '/': ['index.html', 'text/html; charset=utf-8'], '/dashboard': ['app.html', 'text/html; charset=utf-8'], '/app': ['app.html', 'text/html; charset=utf-8'], '/app.js': ['app.js', 'application/javascript; charset=utf-8'], '/styles.css': ['styles.css', 'text/css; charset=utf-8'], '/logo.png': ['logo.png', 'image/png'] };
const jsonHeaders = (cors) => ({ ...cors, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
const sendJson = (res, status, body, cors = {}) => { res.writeHead(status, jsonHeaders(cors)); res.end(JSON.stringify(body)); };
function readJson(req) { return new Promise((resolve, reject) => { let body = ''; req.on('data', (chunk) => { body += chunk; if (body.length > 65536) reject(Object.assign(new Error('Request is too large.'), { statusCode: 413 })); }); req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch { reject(Object.assign(new Error('Request body must be valid JSON.'), { statusCode: 400 })); } }); req.on('error', reject); }); }

function startDashboardServer({ getDashboard, performAction, authenticate, port, allowedOrigin }) {
  const normalizedOrigin = allowedOrigin ? allowedOrigin.replace(/\/$/, '') : null;
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`); const origin = req.headers.origin; const cors = normalizedOrigin && origin === normalizedOrigin ? { 'Access-Control-Allow-Origin': normalizedOrigin, Vary: 'Origin' } : {};
    if (req.method === 'OPTIONS') { res.writeHead(204, { ...cors, 'Access-Control-Allow-Headers': 'Content-Type, X-Telegram-Init-Data', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' }); return res.end(); }
    if (url.pathname === '/health') return sendJson(res, 200, { status: 'ok' });
    try {
      if (url.pathname === '/api/dashboard' && req.method === 'GET') {
        const chatId = url.searchParams.get('chatId'); if (!chatId) throw Object.assign(new Error('chatId is required.'), { statusCode: 400 });
        const viewer = await authenticate(req.headers['x-telegram-init-data'], chatId); return sendJson(res, 200, getDashboard(chatId, viewer), cors);
      }
      if (url.pathname === '/api/action' && req.method === 'POST') {
        const body = await readJson(req); if (!body.chatId || !body.action) throw Object.assign(new Error('chatId and action are required.'), { statusCode: 400 });
        const viewer = await authenticate(req.headers['x-telegram-init-data'], String(body.chatId)); const result = await performAction(String(body.chatId), body.action, body.payload || {}, viewer); return sendJson(res, 200, { ok: true, result }, cors);
      }
    } catch (error) { const status = Number(error.statusCode) || 500; if (status >= 500) console.error('Dashboard API error:', error); return sendJson(res, status, { error: error.message || 'Unexpected server error.' }, cors); }
    const staticFile = STATIC_FILES[url.pathname]; if (!staticFile) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Not found'); }
    fs.readFile(path.join(PUBLIC_DIR, staticFile[0]), (error, content) => { if (error) { res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Unable to load dashboard'); } res.writeHead(200, { 'Content-Type': staticFile[1], 'Cache-Control': url.pathname === '/logo.png' ? 'public, max-age=86400' : 'no-cache' }); res.end(content); });
  });
  server.listen(port, '0.0.0.0', () => console.log(`Dashboard server listening on port ${port}`)); return server;
}
module.exports = { startDashboardServer };
