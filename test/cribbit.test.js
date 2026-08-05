const test = require('node:test');
const assert = require('node:assert/strict');
const { parseNaturalExpense } = require('../src/expenses');
const { calculateBalances, simplifyDebts } = require('../src/balances');
const { parseChoreInput } = require('../src/chores');
const { startDashboardServer } = require('../src/dashboard-server');
const { BOT_COMMANDS } = require('../src/bot-commands');

test('parses supported natural-language expenses', () => {
  assert.deepEqual(parseNaturalExpense('Paid 45 for groceries', 'Alex'), { amount: 45, description: 'groceries', paidBy: 'Alex' });
  assert.deepEqual(parseNaturalExpense('Ken paid 30 for pizza', 'Alex'), { amount: 30, description: 'pizza', paidBy: 'Ken' });
  assert.deepEqual(parseNaturalExpense('I paid 20 on Uber', 'Alex'), { amount: 20, description: 'Uber', paidBy: 'Alex' });
});

test('rejects unrelated chat messages', () => {
  assert.equal(parseNaturalExpense('We should buy groceries tomorrow', 'Alex'), null);
});

test('creates simplified settlement suggestions', () => {
  const result = calculateBalances([
    { amount: 46.5, paidBy: 'Alex', participants: ['Alex', 'Sarah', 'Marcus'] },
    { amount: 22.5, paidBy: 'Alex', participants: ['Alex', 'Sarah', 'Marcus'] },
    { amount: 4.5, paidBy: 'Sarah', participants: ['Alex', 'Sarah', 'Marcus'] }
  ]);
  assert.deepEqual(result.settlements, [
    { from: 'Marcus', to: 'Alex', amount: 24.5 },
    { from: 'Sarah', to: 'Alex', amount: 20 }
  ]);
});

test('simplifies a net balance into minimum transfers', () => {
  assert.deepEqual(simplifyDebts({ Alex: 23.5, Sarah: -15.5, Marcus: -8 }), [
    { from: 'Sarah', to: 'Alex', amount: 15.5 },
    { from: 'Marcus', to: 'Alex', amount: 8 }
  ]);
});

test('uses one canonical balance name when payer casing differs', () => {
  const result = calculateBalances([
    { amount: 20, paidBy: 'ken', participants: ['Alex', 'Ken'] }
  ], ['Alex', 'Ken']);
  assert.deepEqual(result.net, { Alex: -10, Ken: 10 });
});

test('parses chore assignments', () => {
  assert.deepEqual(parseChoreInput('clean kitchen @ken_1'), { task: 'clean kitchen', assignedTo: '@ken_1' });
  assert.deepEqual(parseChoreInput('take out trash for Sarah'), { task: 'take out trash', assignedTo: 'Sarah' });
  assert.deepEqual(parseChoreInput('wash dishes'), { task: 'wash dishes', assignedTo: null });
});

test('serves dashboard data for a group', async (t) => {
  const server = startDashboardServer({
    getExpenses: () => [{ amount: 20, description: 'test', paidBy: 'Alex', participants: ['Alex', 'Ken'] }],
    getChores: () => [{ task: 'dishes', assignedTo: 'Ken', done: false }],
    getMembers: () => ['Alex', 'Ken'],
    port: 0,
    allowedOrigin: 'https://cribbit.vercel.app'
  });
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => server.close());

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/dashboard?chatId=123`, {
    headers: { Origin: 'https://cribbit.vercel.app' }
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://cribbit.vercel.app');
  assert.equal(body.balances.totalSpent, 20);
  assert.deepEqual(body.balances.settlements, [{ from: 'Ken', to: 'Alex', amount: 10 }]);
});

test('Telegram command menu includes every public command', () => {
  assert.deepEqual(BOT_COMMANDS.map(({ command }) => command), [
    'start',
    'split',
    'balance',
    'chore',
    'chores',
    'done',
    'dashboard',
    'help',
    'clear'
  ]);
  assert.ok(BOT_COMMANDS.every(({ description }) => description.length > 0 && description.length <= 256));
});
