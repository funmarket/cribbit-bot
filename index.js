require('dotenv').config();
const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');
const { calculateBalances } = require('./src/balances');
const { cleanName, parseNaturalExpense } = require('./src/expenses');
const { parseChoreInput } = require('./src/chores');
const { createStore } = require('./src/store');
const { validateTelegramInitData } = require('./src/telegram-auth');
const { startDashboardServer } = require('./src/dashboard-server');
const { BOT_COMMANDS } = require('./src/bot-commands');

if (!process.env.BOT_TOKEN) throw new Error('BOT_TOKEN is required. Add it to .env locally or Railway Variables in production.');
const bot = new Telegraf(process.env.BOT_TOKEN); const DATA_DIR = process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || '.'; const DATA_FILE = path.join(DATA_DIR, 'expenses.json'); const PORT = Number(process.env.PORT) || 3000;
fs.mkdirSync(DATA_DIR, { recursive: true }); const store = createStore(DATA_FILE);

const actorName = (ctx) => cleanName(ctx.from?.first_name || ctx.from?.username || String(ctx.from?.id || 'Unknown'));
const money = (cents, currency = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
const dashboardBaseUrl = () => process.env.MINI_APP_URL?.replace(/\/$/, '') || (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : null);
function dashboardUrl(chatId, view) { const base = dashboardBaseUrl(); if (!base) return null; const params = new URLSearchParams({ chatId: String(chatId) }); if (view) params.set('view', view); if (process.env.MINI_APP_URL && process.env.RAILWAY_PUBLIC_DOMAIN) params.set('apiBaseUrl', `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`); return `${base}/?${params}`; }
const dashboardKeyboard = (chatId, view) => { const url = dashboardUrl(chatId, view); return url ? { inline_keyboard: [[{ text: 'Open Cribbit', web_app: { url } }]] } : undefined; };

bot.use(async (ctx, next) => {
  if (!store.markUpdate(ctx.update?.update_id)) return;
  if (ctx.chat && ctx.from) store.registerMember(ctx.chat.id, ctx.from, ctx.chat.title || ctx.chat.first_name || 'My Crib');
  return next();
});

bot.start((ctx) => ctx.reply(`Cribbit is ready for the house.\n\nExpenses: /split 50 pizza\nChores: /chore add clean kitchen @username\nGroceries: /grocery add milk\nRoomies: /roomies\nActivity: /activity\nSettings: /settings\nDashboard: /dashboard`, { reply_markup: dashboardKeyboard(ctx.chat.id) }));
bot.command('help', (ctx) => ctx.reply(`Cribbit commands\n\n/split 50 pizza\n/balance\n/chore add clean kitchen @username\n/chore done c-id\n/chores\n/grocery add milk\n/grocery done g-id 4.50\n/groceries\n/roomies\n/activity\n/settings\n/dashboard\n\nYou can also say: “Paid 45 for groceries”`));

function saveExpense(ctx, details, source = 'telegram') {
  const actor = actorName(ctx); let participants = details.participants;
  if (!participants?.length) participants = store.memberNames(ctx.chat.id);
  if (details.excluded) participants = participants.filter((name) => name.toLowerCase() !== details.excluded.toLowerCase());
  const expense = store.addExpense(ctx.chat.id, { ...details, participants }, actor, source); const currency = store.settings(ctx.chat.id).currency;
  return ctx.reply(`Added ${expense.description}.\n${money(expense.amountCents, currency)} paid by ${expense.paidBy}.\nSplit between ${expense.participants.join(', ') || expense.paidBy}.`);
}

bot.command('split', (ctx) => { const parts = ctx.message.text.trim().split(/\s+/); if (parts.length < 3) return ctx.reply('Format: /split 50 pizza'); const amount = Number(parts[1].replace(/,/g, '')); const description = parts.slice(2).join(' ').trim(); if (!Number.isFinite(amount) || amount <= 0 || !description) return ctx.reply('Format: /split 50 pizza'); return saveExpense(ctx, { amount, description, paidBy: actorName(ctx) }); });
bot.command('balance', (ctx) => {
  const data = store.dashboard(ctx.chat.id); if (!data.expenses.length) return ctx.reply('No expenses logged yet.\nUse /split or say “Paid 45 for groceries”.');
  const viewer = actorName(ctx); const cents = data.balances.netCents[Object.keys(data.balances.netCents).find((n) => n.toLowerCase() === viewer.toLowerCase())] || 0; const owed = Math.max(cents, 0), owe = Math.max(-cents, 0); const currency = data.settings.currency;
  let message = `Your Cribbit balance\n\nYou are owed: ${money(owed, currency)}\nYou owe: ${money(owe, currency)}\n\n`;
  const related = data.balances.settlements.filter((s) => s.from.toLowerCase() === viewer.toLowerCase() || s.to.toLowerCase() === viewer.toLowerCase()); message += related.length ? related.map((s) => `${s.from} should pay ${s.to} ${money(s.amountCents, currency)}`).join('\n') : 'Nothing owed. Financial peace achieved.';
  return ctx.reply(message, { reply_markup: dashboardKeyboard(ctx.chat.id, 'expenses') });
});

bot.command('chore', (ctx) => {
  const input = ctx.message.text.replace(/^\/chore(?:@\w+)?\s*/i, '').trim(); const [action, ...rest] = input.split(/\s+/); const actor = actorName(ctx);
  if (action?.toLowerCase() === 'add') { const parsed = parseChoreInput(rest.join(' ')); if (!parsed) return ctx.reply('Format: /chore add clean the kitchen @username'); const chore = store.addChore(ctx.chat.id, parsed, actor); return ctx.reply(`Chore added\n${chore.task}\nAssigned: ${chore.assignedTo || 'Unassigned'}\nDue: ${chore.dueDate || 'No due date'}\nID: ${chore.id}`, { reply_markup: dashboardKeyboard(ctx.chat.id, 'chores') }); }
  if (['done', 'reopen'].includes(action?.toLowerCase())) { const chore = store.updateChore(ctx.chat.id, rest[0], { done: action.toLowerCase() === 'done' }, actor); return ctx.reply(chore ? `${chore.done ? 'Done' : 'Reopened'}: ${chore.task}` : 'Chore not found. Use /chores to see IDs.'); }
  if (action?.toLowerCase() === 'reassign') { const chore = store.updateChore(ctx.chat.id, rest[0], { assignedTo: rest[1] || null }, actor); return ctx.reply(chore ? `“${chore.task}” has moved to ${chore.assignedTo || 'Unassigned'}.` : 'Chore not found.'); }
  if (action?.toLowerCase() === 'delete') return ctx.reply(store.deleteChore(ctx.chat.id, rest[0], actor) ? 'Chore deleted.' : 'Chore not found.');
  return ctx.reply('Format: /chore add clean the kitchen @username');
});
bot.command('done', (ctx) => { const id = ctx.message.text.trim().split(/\s+/)[1]; const chore = store.updateChore(ctx.chat.id, id, { done: true }, actorName(ctx)); return ctx.reply(chore ? `Done. “${chore.task}” completed by ${chore.doneBy}.` : 'Please enter a valid chore number or ID. Use /chores to see the list.'); });
bot.command('chores', (ctx) => { const chores = store.dashboard(ctx.chat.id).chores; if (!chores.length) return ctx.reply('No chores yet.\nAdd one with:\n/chore add clean kitchen @username'); const active = chores.filter((c) => !c.done), completed = chores.filter((c) => c.done).slice(-5); let message = 'House chores\n\n'; if (active.length) message += `ACTIVE\n${active.map((c) => `• ${c.task} — ${c.assignedTo || 'Unassigned'}\n  ${c.id}`).join('\n')}\n`; if (completed.length) message += `\nCOMPLETED RECENTLY\n${completed.map((c) => `✓ ${c.task}`).join('\n')}`; return ctx.reply(message, { reply_markup: dashboardKeyboard(ctx.chat.id, 'chores') }); });

bot.command('grocery', (ctx) => {
  const input = ctx.message.text.replace(/^\/grocery(?:@\w+)?\s*/i, '').trim(); const [action, ...rest] = input.split(/\s+/); const actor = actorName(ctx);
  if (action?.toLowerCase() === 'add' && rest.length) { const urgent = rest.at(-1)?.toLowerCase() === 'urgent'; const name = urgent ? rest.slice(0, -1).join(' ') : rest.join(' '); const item = store.addGrocery(ctx.chat.id, { name, priority: urgent ? 'urgent' : 'normal' }, actor); return ctx.reply(`Added ${item.name} to groceries.\nID: ${item.id}`, { reply_markup: dashboardKeyboard(ctx.chat.id, 'groceries') }); }
  if (['done', 'restore'].includes(action?.toLowerCase())) { const price = Number(rest[1]); const patch = { purchased: action.toLowerCase() === 'done', ...(Number.isFinite(price) && price > 0 ? { purchasePriceCents: Math.round(price * 100) } : {}) }; const item = store.updateGrocery(ctx.chat.id, rest[0], patch, actor); return ctx.reply(item ? `${item.purchased ? 'Purchased' : 'Restored'}: ${item.name}` : 'Grocery item not found.'); }
  if (action?.toLowerCase() === 'delete') return ctx.reply(store.deleteGrocery(ctx.chat.id, rest[0], actor) ? 'Grocery item removed.' : 'Grocery item not found.');
  return ctx.reply('Format: /grocery add milk\nOr: /grocery done g-id 4.50');
});
bot.command('groceries', (ctx) => { const items = store.dashboard(ctx.chat.id).groceries; const active = items.filter((i) => !i.purchased); if (!active.length) return ctx.reply('The list is suspiciously empty.\nAdd an item with /grocery add milk'); return ctx.reply(`Shared groceries\n\n${active.map((i) => `${i.priority === 'urgent' ? '!' : '•'} ${i.name} × ${i.quantity}\n  ${i.id}`).join('\n')}`, { reply_markup: dashboardKeyboard(ctx.chat.id, 'groceries') }); });
bot.command('roomies', (ctx) => { const members = store.dashboard(ctx.chat.id).members.filter((m) => m.active); return ctx.reply(`Roomies\n\n${members.map((m) => `• ${m.displayName}${m.username ? ` (${m.username})` : ''} — ${m.role}`).join('\n') || 'No active roomies yet.'}`, { reply_markup: dashboardKeyboard(ctx.chat.id, 'roomies') }); });
bot.command('activity', (ctx) => { const events = store.dashboard(ctx.chat.id).activity.slice(0, 10); return ctx.reply(`Recent activity\n\n${events.map((e) => `• ${e.message}`).join('\n') || 'No house activity yet.'}`, { reply_markup: dashboardKeyboard(ctx.chat.id, 'activity') }); });
bot.command('settings', (ctx) => { const input = ctx.message.text.replace(/^\/settings(?:@\w+)?\s*/i, '').trim(); const current = store.settings(ctx.chat.id); if (!input) return ctx.reply(`House settings\n\nName: ${current.houseName}\nCurrency: ${current.currency}\nTime zone: ${current.timezone}\n\nUpdate with:\n/settings name Oak Street\n/settings currency USD\n/settings timezone Africa/Lagos`, { reply_markup: dashboardKeyboard(ctx.chat.id, 'settings') }); const member = store.memberByTelegramId(ctx.chat.id, ctx.from.id); if (!['owner', 'admin'].includes(member?.role)) return ctx.reply('Only a house owner or admin can change house settings.'); const [key, ...valueParts] = input.split(/\s+/); const map = { name: 'houseName', currency: 'currency', timezone: 'timezone' }; if (!map[key.toLowerCase()] || !valueParts.length) return ctx.reply('Use /settings name, currency, or timezone followed by a value.'); const value = valueParts.join(' '); try { const updated = store.updateSettings(ctx.chat.id, { [map[key.toLowerCase()]]: key.toLowerCase() === 'currency' ? value.toUpperCase().slice(0, 3) : value }, actorName(ctx)); return ctx.reply(`Settings updated. ${map[key.toLowerCase()]}: ${updated[map[key.toLowerCase()]]}`); } catch (error) { return ctx.reply(error.message); } });

bot.command('dashboard', (ctx) => { const replyMarkup = dashboardKeyboard(ctx.chat.id); return replyMarkup ? ctx.reply('Your crib dashboard is ready.\n\nView balances, expenses, chores, groceries, roomies, and activity in one place.', { reply_markup: replyMarkup }) : ctx.reply('Dashboard URL is not configured yet. Set MINI_APP_URL.'); });
bot.command('clear', (ctx) => { store.clear(ctx.chat.id); store.registerMember(ctx.chat.id, ctx.from, ctx.chat.title || 'My Crib'); return ctx.reply('All saved house data has been cleared.'); });
bot.on('text', (ctx) => { const parsed = parseNaturalExpense(ctx.message.text, actorName(ctx)); return parsed ? saveExpense(ctx, parsed) : undefined; });
bot.catch((error, ctx) => console.error(`Bot error for update ${ctx.update.update_id}:`, error));

async function authenticate(initData, chatId) { const user = validateTelegramInitData(initData, process.env.BOT_TOKEN); if (!store.isMember(chatId, user.id)) throw Object.assign(new Error('You are not an active member of this crib.'), { statusCode: 403 }); return store.memberByTelegramId(chatId, user.id); }
async function performAction(chatId, action, payload, viewer) {
  const actor = viewer.displayName;
  if (action === 'expense.add') return store.addExpense(chatId, { amount: Number(payload.amount), description: payload.description, paidBy: payload.paidBy || actor, participants: payload.participants || store.memberNames(chatId), category: payload.category, notes: payload.notes }, actor, 'app');
  if (action === 'chore.add') return store.addChore(chatId, payload, actor);
  if (action === 'chore.toggle') { const result = store.updateChore(chatId, payload.id, { done: Boolean(payload.done) }, actor); if (!result) throw Object.assign(new Error('Chore not found.'), { statusCode: 404 }); return result; }
  if (action === 'grocery.add') return store.addGrocery(chatId, payload, actor);
  if (action === 'grocery.toggle') { const result = store.updateGrocery(chatId, payload.id, { purchased: Boolean(payload.purchased), ...(payload.purchasePrice ? { purchasePriceCents: Math.round(Number(payload.purchasePrice) * 100) } : {}) }, actor); if (!result) throw Object.assign(new Error('Grocery item not found.'), { statusCode: 404 }); return result; }
  if (action === 'settings.update') { if (!['owner', 'admin'].includes(viewer.role)) throw Object.assign(new Error('Only a house owner or admin can change settings.'), { statusCode: 403 }); return store.updateSettings(chatId, payload, actor); }
  throw Object.assign(new Error('Unsupported dashboard action.'), { statusCode: 400 });
}

const dashboardServer = startDashboardServer({ getDashboard: (chatId, viewer) => store.dashboard(chatId, viewer), performAction, authenticate, port: PORT, allowedOrigin: process.env.MINI_APP_URL || null });
bot.telegram.setMyCommands(BOT_COMMANDS).then(() => bot.launch()).then(() => console.log(`Cribbit bot is running. Data file: ${DATA_FILE}`)).catch((error) => { console.error('Failed to start Cribbit:', error); dashboardServer.close(); process.exit(1); });
function shutdown(signal) { bot.stop(signal); dashboardServer.close(); }
process.once('SIGINT', () => shutdown('SIGINT')); process.once('SIGTERM', () => shutdown('SIGTERM'));
