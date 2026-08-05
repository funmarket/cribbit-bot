const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { parseNaturalExpense } = require('../src/expenses');
const { calculateBalances, simplifyDebts } = require('../src/balances');
const { parseChoreInput } = require('../src/chores');
const { createStore } = require('../src/store');
const { validateTelegramInitData } = require('../src/telegram-auth');
const { startDashboardServer } = require('../src/dashboard-server');
const { BOT_COMMANDS } = require('../src/bot-commands');

test('parses natural-language expenses including participant rules', () => {
  assert.deepEqual(parseNaturalExpense('Paid 45 for groceries', 'Alex'), { amount: 45, description: 'groceries', paidBy: 'Alex' });
  assert.deepEqual(parseNaturalExpense('Ken paid 30 for pizza', 'Alex'), { amount: 30, description: 'pizza', paidBy: 'Ken' });
  assert.deepEqual(parseNaturalExpense('Paid 60 for dinner, split between @alex and @maya', 'Noah'), { amount: 60, description: 'dinner', paidBy: 'Noah', participants: ['alex', 'maya'] });
  assert.deepEqual(parseNaturalExpense('Paid 100 for groceries, exclude @noah', 'Alex'), { amount: 100, description: 'groceries', paidBy: 'Alex', excluded: 'noah' });
  assert.equal(parseNaturalExpense('We should buy groceries tomorrow', 'Alex'), null);
});

test('calculates exact cent balances and minimum transfers', () => {
  const result = calculateBalances([{ amountCents: 1000, paidBy: 'Alex', participants: ['Alex', 'Maya', 'Noah'] }], ['Alex', 'Maya', 'Noah']);
  assert.deepEqual(result.netCents, { Alex: 666, Maya: -333, Noah: -333 });
  assert.deepEqual(result.settlements, [{ from: 'Maya', to: 'Alex', amountCents: 333, amount: 3.33 }, { from: 'Noah', to: 'Alex', amountCents: 333, amount: 3.33 }]);
  assert.deepEqual(simplifyDebts({ Alex: 23.5, Sarah: -15.5, Marcus: -8 }).map(({ from, to, amount }) => ({ from, to, amount })), [{ from: 'Sarah', to: 'Alex', amount: 15.5 }, { from: 'Marcus', to: 'Alex', amount: 8 }]);
});

test('parses assigned chores with due labels', () => {
  assert.deepEqual(parseChoreInput('clean kitchen @ken_1'), { task: 'clean kitchen', assignedTo: '@ken_1', dueDate: null });
  assert.deepEqual(parseChoreInput('take out trash @maya Friday'), { task: 'take out trash', assignedTo: '@maya', dueDate: 'friday' });
  assert.deepEqual(parseChoreInput('wash dishes'), { task: 'wash dishes', assignedTo: null, dueDate: null });
});

test('persists groceries, roomies, activity, and settings in one store', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cribbit-')); const file = path.join(directory, 'expenses.json'); t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const store = createStore(file); const member = store.registerMember('123', { id: 42, first_name: 'Alex', username: 'alex' }, 'Oak Street');
  store.addGrocery('123', { name: 'Milk', priority: 'urgent' }, 'Alex'); store.addChore('123', { task: 'Dishes', assignedTo: '@alex' }, 'Alex'); store.updateSettings('123', { currency: 'GBP', timezone: 'Europe/London' }, 'Alex');
  const reloaded = createStore(file).dashboard('123', member);
  assert.equal(reloaded.groceries[0].name, 'Milk'); assert.equal(reloaded.chores[0].task, 'Dishes'); assert.equal(reloaded.members[0].telegramId, '42'); assert.equal(reloaded.settings.currency, 'GBP'); assert.ok(reloaded.activity.length >= 4);
});

test('deduplicates Telegram update identifiers', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cribbit-')); t.after(() => fs.rmSync(directory, { recursive: true, force: true })); const store = createStore(path.join(directory, 'data.json'));
  assert.equal(store.markUpdate(1001), true); assert.equal(store.markUpdate(1001), false);
});

function signedInitData(botToken, user, authDate = Math.floor(Date.now() / 1000)) {
  const params = new URLSearchParams({ auth_date: String(authDate), user: JSON.stringify(user) }); const check = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join('\n'); const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest(); params.set('hash', crypto.createHmac('sha256', secret).update(check).digest('hex')); return params.toString();
}
test('validates Telegram Mini App authentication and rejects tampering', () => {
  const initData = signedInitData('token', { id: 42, first_name: 'Alex' }); assert.equal(validateTelegramInitData(initData, 'token').id, 42);
  assert.throws(() => validateTelegramInitData(`${initData}x`, 'token'), /could not be verified/);
});

test('serves authenticated dashboard data and persistent actions', async (t) => {
  let groceries = []; const server = startDashboardServer({
    getDashboard: (_chatId, viewer) => ({ viewer, expenses: [], chores: [], groceries, members: [], activity: [], settings: { currency: 'USD' }, balances: calculateBalances([]) }),
    performAction: (_chatId, action, payload) => { if (action !== 'grocery.add') throw Object.assign(new Error('Unsupported'), { statusCode: 400 }); const item = { id: 'g1', name: payload.name }; groceries.push(item); return item; },
    authenticate: (initData) => { if (initData !== 'valid') throw Object.assign(new Error('Unauthorized'), { statusCode: 401 }); return { displayName: 'Alex' }; }, port: 0, allowedOrigin: 'https://cribbit.vercel.app'
  });
  await new Promise((resolve) => server.once('listening', resolve)); t.after(() => server.close()); const base = `http://127.0.0.1:${server.address().port}`;
  const denied = await fetch(`${base}/api/dashboard?chatId=123`); assert.equal(denied.status, 401);
  const action = await fetch(`${base}/api/action`, { method: 'POST', headers: { Origin: 'https://cribbit.vercel.app', 'Content-Type': 'application/json', 'X-Telegram-Init-Data': 'valid' }, body: JSON.stringify({ chatId: '123', action: 'grocery.add', payload: { name: 'Milk' } }) }); assert.equal(action.status, 200);
  const response = await fetch(`${base}/api/dashboard?chatId=123`, { headers: { Origin: 'https://cribbit.vercel.app', 'X-Telegram-Init-Data': 'valid' } }); const body = await response.json(); assert.equal(response.status, 200); assert.equal(response.headers.get('access-control-allow-origin'), 'https://cribbit.vercel.app'); assert.equal(body.groceries[0].name, 'Milk');
});

test('Telegram command menu includes persistent product areas', () => {
  const commands = BOT_COMMANDS.map(({ command }) => command); for (const command of ['grocery', 'groceries', 'roomies', 'activity', 'settings', 'dashboard']) assert.ok(commands.includes(command)); assert.ok(BOT_COMMANDS.every(({ description }) => description.length > 0 && description.length <= 256));
});
