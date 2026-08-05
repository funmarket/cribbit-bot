const fs = require('fs');
const http = require('http');
const path = require('path');
const { calculateBalances } = require('./balances');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const STATIC_FILES = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/dashboard': ['index.html', 'text/html; charset=utf-8'],
  '/app.js': ['app.js', 'application/javascript; charset=utf-8'],
  '/styles.css': ['styles.css', 'text/css; charset=utf-8']
};

function startDashboardServer({ getExpenses, getChores, getMembers, port, allowedOrigin }) {
  const normalizedOrigin = allowedOrigin ? allowedOrigin.replace(/\/$/, '') : null;
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const corsHeaders = normalizedOrigin ? { 'Access-Control-Allow-Origin': normalizedOrigin } : {};

    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        ...corsHeaders,
        'Access-Control-Allow-Headers': 'X-Telegram-Init-Data',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      });
      return res.end();
    }

    if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'ok' }));
    }

    if (url.pathname === '/api/dashboard') {
      const chatId = url.searchParams.get('chatId');
      if (!chatId) {
        res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'chatId is required' }));
      }

      const expenses = getExpenses(chatId);
      const chores = getChores(chatId);
      const balances = calculateBalances(expenses, getMembers(chatId));
      res.writeHead(200, {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      });
      return res.end(JSON.stringify({ expenses, chores, balances }));
    }

    const staticFile = STATIC_FILES[url.pathname];
    if (!staticFile) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not found');
    }

    fs.readFile(path.join(PUBLIC_DIR, staticFile[0]), (error, content) => {
      if (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Unable to load dashboard');
      }
      res.writeHead(200, { 'Content-Type': staticFile[1] });
      return res.end(content);
    });
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`Dashboard server listening on port ${port}`);
  });
  return server;
}

module.exports = { startDashboardServer };
