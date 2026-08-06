const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { parseNaturalExpense, normalizeDigits, parseLocalizedAmount } = require('../src/expenses');
const { calculateBalances, simplifyDebts } = require('../src/balances');
const { parseChoreInput } = require('../src/chores');
const { createStore } = require('../src/store');
const { validateTelegramInitData } = require('../src/telegram-auth');
const { startDashboardServer } = require('../src/dashboard-server');
const { dashboardUrl, menuAppUrl } = require('../src/dashboard-links');
const { BOT_COMMANDS, commandsForLocale } = require('../src/bot-commands');
const { normalizeLocale, translate, missingTranslationKeys } = require('../src/i18n');

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

test('discovers only active shared-house memberships for a Telegram user', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cribbit-houses-')); t.after(() => fs.rmSync(directory, { recursive: true, force: true })); const store = createStore(path.join(directory, 'data.json'));
  store.registerMember('-1001', { id: 42, first_name: 'Alex' }, 'Oak Street'); store.registerMember('-1002', { id: 42, first_name: 'Alex' }, 'Pine House'); store.registerMember('42', { id: 42, first_name: 'Alex' }, 'Private chat');
  assert.deepEqual(store.housesForTelegramId(42).map(({ chatId, houseName }) => ({ chatId, houseName })), [{ chatId: '-1001', houseName: 'Oak Street' }, { chatId: '-1002', houseName: 'Pine House' }]);
});

test('builds canonical inline and global menu Mini App URLs', () => {
  const env = { MINI_APP_URL: 'https://cribbit-dashboard-sigma.vercel.app/app', RAILWAY_PUBLIC_DOMAIN: 'cribbit-production.up.railway.app' };
  assert.equal(dashboardUrl(env, -1001), 'https://cribbit-dashboard-sigma.vercel.app/app?chatId=-1001&apiBaseUrl=https%3A%2F%2Fcribbit-production.up.railway.app');
  assert.equal(menuAppUrl(env), 'https://cribbit-dashboard-sigma.vercel.app/app?apiBaseUrl=https%3A%2F%2Fcribbit-production.up.railway.app');
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
    listHouses: (initData) => { if (initData !== 'valid') throw Object.assign(new Error('Unauthorized'), { statusCode: 401 }); return { houses: [{ chatId: '123', houseName: 'Oak Street' }] }; },
    authenticate: (initData) => { if (initData !== 'valid') throw Object.assign(new Error('Unauthorized'), { statusCode: 401 }); return { displayName: 'Alex' }; }, port: 0, allowedOrigin: 'https://cribbit.vercel.app'
  });
  await new Promise((resolve) => server.once('listening', resolve)); t.after(() => server.close()); const base = `http://127.0.0.1:${server.address().port}`;
  const denied = await fetch(`${base}/api/dashboard?chatId=123`); assert.equal(denied.status, 401);
  const deniedHouses = await fetch(`${base}/api/houses`); assert.equal(deniedHouses.status, 401);
  const housesResponse = await fetch(`${base}/api/houses`, { headers: { Origin: 'https://cribbit.vercel.app', 'X-Telegram-Init-Data': 'valid' } }); assert.equal(housesResponse.status, 200); assert.deepEqual((await housesResponse.json()).houses, [{ chatId: '123', houseName: 'Oak Street' }]);
  const action = await fetch(`${base}/api/action`, { method: 'POST', headers: { Origin: 'https://cribbit.vercel.app', 'Content-Type': 'application/json', 'X-Telegram-Init-Data': 'valid' }, body: JSON.stringify({ chatId: '123', action: 'grocery.add', payload: { name: 'Milk' } }) }); assert.equal(action.status, 200);
  const response = await fetch(`${base}/api/dashboard?chatId=123`, { headers: { Origin: 'https://cribbit.vercel.app', 'X-Telegram-Init-Data': 'valid' } }); const body = await response.json(); assert.equal(response.status, 200); assert.equal(response.headers.get('access-control-allow-origin'), 'https://cribbit.vercel.app'); assert.equal(body.groceries[0].name, 'Milk');
});

test('Telegram command menu includes persistent product areas', () => {
  const commands = BOT_COMMANDS.map(({ command }) => command); for (const command of ['split', 'balance', 'chore', 'chores', 'dashboard', 'help', 'language']) assert.ok(commands.includes(command)); assert.ok(BOT_COMMANDS.every(({ description }) => description.length > 0 && description.length <= 256));
});

test('normalizes supported Telegram locale variants and falls back to English', () => {
  assert.equal(normalizeLocale('en-GB'), 'en'); assert.equal(normalizeLocale('fr-CA'), 'fr'); assert.equal(normalizeLocale('ar-TN'), 'ar'); assert.equal(normalizeLocale('de-DE'), 'en');
});

test('translation fallback and resource completeness', () => {
  assert.equal(translate('fr', 'settings.languageUpdated'), 'Langue changée en français.'); assert.equal(translate('ar', 'settings.languageUpdated'), 'تم تغيير اللغة إلى العربية.'); assert.equal(translate('fr', 'not.present'), 'not.present');
  assert.deepEqual(missingTranslationKeys(), { fr: [], ar: [] });
});

test('saved preference overrides Telegram language and house controls group responses', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cribbit-locale-')); t.after(() => fs.rmSync(directory, { recursive: true, force: true })); const store = createStore(path.join(directory, 'data.json'));
  store.registerMember('house', { id: 7, first_name: 'Maya', language_code: 'fr-CA' }, 'Oak'); store.updateSettings('house', { defaultLocale: 'ar' }, 'Maya');
  assert.equal(store.resolveLocale('house', { id: 7, language_code: 'fr-CA' }), 'fr'); assert.equal(store.resolveLocale('house', { id: 7, language_code: 'fr-CA' }, { groupMessage: true }), 'ar');
  store.setUserLocale(7, 'en-GB'); assert.equal(store.resolveLocale('house', { id: 7, language_code: 'fr' }), 'en'); assert.equal(createStore(path.join(directory, 'data.json')).userLocale(7), 'en');
});

test('house language changes require an owner or admin role in command policy', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cribbit-admin-')); t.after(() => fs.rmSync(directory, { recursive: true, force: true })); const store = createStore(path.join(directory, 'data.json'));
  const owner = store.registerMember('house', { id: 1, first_name: 'Owner' }, 'Oak'); const member = store.registerMember('house', { id: 2, first_name: 'Member' }, 'Oak');
  assert.ok(['owner', 'admin'].includes(owner.role)); assert.equal(['owner', 'admin'].includes(member.role), false);
});

test('localized help, empty expenses, and empty chores are available', () => {
  for (const locale of ['en', 'fr', 'ar']) { assert.notEqual(translate(locale, 'bot.help'), 'bot.help'); assert.notEqual(translate(locale, 'expenses.noLogged'), 'expenses.noLogged'); assert.notEqual(translate(locale, 'chores.empty'), 'chores.empty'); }
});

test('parses French expenses and decimal commas', () => {
  assert.deepEqual(parseNaturalExpense('J’ai payé 45 pour les courses', 'Alex'), { amount: 45, description: 'les courses', paidBy: 'Alex' });
  assert.deepEqual(parseNaturalExpense('Maya a payé 16,50 pour les produits de nettoyage', 'Alex'), { amount: 16.5, description: 'les produits de nettoyage', paidBy: 'Maya' });
  assert.equal(parseLocalizedAmount('1 260,50 €', 'fr'), 1260.5);
});

test('parses Arabic expenses and Arabic-Indic numerals', () => {
  assert.equal(normalizeDigits('١٢٣ ۴۵۶'), '123 456'); assert.deepEqual(parseNaturalExpense('دفعت ٨٠ للكهرباء', 'Alex'), { amount: 80, description: 'الكهرباء', paidBy: 'Alex' });
  assert.deepEqual(parseNaturalExpense('دفعت مايا ٢٤ مقابل مواد التنظيف', 'Alex'), { amount: 24, description: 'مواد التنظيف', paidBy: 'مايا' });
});

test('localized command descriptions retain official command names', () => {
  for (const locale of ['en', 'fr', 'ar']) for (const command of ['split', 'balance', 'chore', 'chores', 'dashboard', 'help', 'language']) assert.ok(commandsForLocale(locale).some((item) => item.command === command));
});

test('Mini App localization applies Arabic RTL and keeps the logo unmirrored', () => {
  const script = fs.readFileSync(path.join(__dirname, '..', 'public', 'i18n.js'), 'utf8'); const css = fs.readFileSync(path.join(__dirname, '..', 'public', 'styles.css'), 'utf8');
  assert.match(script, /documentElement\.dir = locale === 'ar' \? 'rtl' : 'ltr'/); assert.match(css, /\[dir="rtl"\] \.app-logo,\[dir="rtl"\] img\{transform:none\}/);
});

test('dashboard route opens the Mini App document', async () => {
  const server = startDashboardServer({ getDashboard: () => ({}), performAction: () => ({}), authenticate: () => ({}), port: 0 }); await new Promise((resolve) => server.once('listening', resolve));
  try { const response = await fetch(`http://127.0.0.1:${server.address().port}/app`); const html = await response.text(); assert.equal(response.status, 200); assert.match(html, /id="settings-form"/); } finally { server.close(); }
});
