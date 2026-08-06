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
const { dashboardReplyMarkup, menuAppUrl, miniAppOrigin } = require('./src/dashboard-links');
const { BOT_COMMANDS, commandsForLocale } = require('./src/bot-commands');
const { SUPPORTED_LOCALES, normalizeLocale, translate: t, formatCurrency, localeName } = require('./src/i18n');

if (!process.env.BOT_TOKEN) throw new Error('BOT_TOKEN is required. Add it to .env locally or Railway Variables in production.');
const bot = new Telegraf(process.env.BOT_TOKEN); const DATA_DIR = process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || '.'; const DATA_FILE = path.join(DATA_DIR, 'expenses.json'); const PORT = Number(process.env.PORT) || 3000;
fs.mkdirSync(DATA_DIR, { recursive: true }); const store = createStore(DATA_FILE);

const actorName = (ctx) => cleanName(ctx.from?.first_name || ctx.from?.username || String(ctx.from?.id || 'Unknown'));
const localeFor = (ctx) => store.resolveLocale(ctx.chat.id, ctx.from, { groupMessage: ctx.chat.type !== 'private' });
const money = (cents, currency = 'USD', locale = 'en') => formatCurrency(locale, cents, currency);
const dashboardKeyboard = (ctx, view, locale = 'en') => dashboardReplyMarkup(process.env, { chatId: ctx.chat.id, chatType: ctx.chat.type, botUsername: ctx.me, view, text: t(locale, 'dashboard.open') });
const languageKeyboard = { inline_keyboard: [[{ text: 'English', callback_data: 'language:en' }, { text: 'Français', callback_data: 'language:fr' }, { text: 'العربية', callback_data: 'language:ar' }]] };
const expenseLine = (expense, currency, locale) => `${money(expense.amountCents, currency, locale)} - ${expense.description}\nPaid by ${expense.paidBy}`;
const commandInput = (ctx, command) => ctx.message.text.replace(new RegExp(`^/${command}(?:@\\w+)?\\s*`, 'i'), '').trim();
const listByNumber = (items, formatter) => items.map((item, index) => `${index + 1}. ${formatter(item)}`).join('\n');

bot.use(async (ctx, next) => {
  if (!store.markUpdate(ctx.update?.update_id)) return;
  if (ctx.chat && ctx.from) store.registerMember(ctx.chat.id, ctx.from, ctx.chat.title || ctx.chat.first_name || 'My Crib');
  return next();
});

bot.start((ctx) => { const locale = localeFor(ctx); return ctx.reply(t(locale, 'bot.help'), { reply_markup: dashboardKeyboard(ctx, null, locale) }); });
bot.command('help', (ctx) => ctx.reply(t(localeFor(ctx), 'bot.help')));
bot.command('setup', (ctx) => { const locale = localeFor(ctx); const input = commandInput(ctx, 'setup'); if (!input) return ctx.reply('Setup\nUse /setup <house name> to name this crib.\nThen add Cribbit to your house group and use /dashboard.'); const updated = store.updateSettings(ctx.chat.id, { houseName: input }, actorName(ctx)); return ctx.reply(`Setup saved\nHouse: ${updated.houseName}`, { reply_markup: dashboardKeyboard(ctx, 'settings', locale) }); });

function saveExpense(ctx, details, source = 'telegram') {
  const actor = actorName(ctx); let participants = details.participants;
  if (!participants?.length) participants = store.memberNames(ctx.chat.id);
  if (details.excluded) participants = participants.filter((name) => name.toLowerCase() !== details.excluded.toLowerCase());
  const expense = store.addExpense(ctx.chat.id, { ...details, participants }, actor, source); const currency = store.settings(ctx.chat.id).currency; const locale = localeFor(ctx);
  return ctx.reply(`Logged\n${expenseLine(expense, currency, locale)}`);
}

bot.command('split', (ctx) => { const locale = localeFor(ctx); const parts = ctx.message.text.trim().split(/\s+/); if (parts.length < 3) return ctx.reply(t(locale, 'expenses.format')); const amount = Number(parts[1].replace(',', '.')); const description = parts.slice(2).join(' ').trim(); if (!Number.isFinite(amount) || amount <= 0 || !description) return ctx.reply(t(locale, 'expenses.format')); return saveExpense(ctx, { amount, description, paidBy: actorName(ctx) }); });
function balanceReply(ctx) {
  const locale = localeFor(ctx); const data = store.dashboard(ctx.chat.id); if (!data.expenses.length) return ctx.reply(t(locale, 'expenses.noLogged'));
  const viewer = actorName(ctx); const cents = data.balances.netCents[Object.keys(data.balances.netCents).find((n) => n.toLowerCase() === viewer.toLowerCase())] || 0; const owed = Math.max(cents, 0), owe = Math.max(-cents, 0); const currency = data.settings.currency;
  const paid = Object.entries(data.balances.paidCents).map(([name, amount]) => `${name}: ${money(amount, currency, locale)}`).join('\n');
  let message = `Balance\nSpent: ${money(data.balances.totalSpentCents, currency, locale)}\nYou are owed: ${money(owed, currency, locale)}\nYou owe: ${money(owe, currency, locale)}`;
  if (paid) message += `\n\nPaid\n${paid}`;
  message += `\n\nSettle\n${data.balances.settlements.length ? data.balances.settlements.map((s) => `${s.from} should pay ${s.to} ${money(s.amountCents, currency, locale)}`).join('\n') : 'Everyone is settled.'}`;
  return ctx.reply(message, { reply_markup: dashboardKeyboard(ctx, 'expenses', locale) });
}
bot.command('balance', balanceReply);
bot.command('settle', balanceReply);
bot.command('last', (ctx) => { const locale = localeFor(ctx); const expense = store.lastExpense(ctx.chat.id); if (!expense) return ctx.reply(t(locale, 'expenses.noLogged')); const currency = store.settings(ctx.chat.id).currency; return ctx.reply(`Last expense\n${expense.id}\n${expenseLine(expense, currency, locale)}`); });
bot.command('undo', (ctx) => { const locale = localeFor(ctx); const expense = store.voidExpense(ctx.chat.id, null, actorName(ctx), 'undo'); if (!expense) return ctx.reply(t(locale, 'expenses.noLogged')); const currency = store.settings(ctx.chat.id).currency; return ctx.reply(`Undone\n${expense.description}\n${money(expense.amountCents, currency, locale)} removed from balance.`); });
bot.command('void', (ctx) => { const locale = localeFor(ctx); const id = ctx.message.text.replace(/^\/void(?:@\w+)?\s*/i, '').trim(); if (!id) return ctx.reply('Format: /void <expense-id>'); const expense = store.voidExpense(ctx.chat.id, id, actorName(ctx)); if (!expense) return ctx.reply('Expense not found. Use /last to see the latest ID.'); const currency = store.settings(ctx.chat.id).currency; return ctx.reply(`Voided\n${expense.description}\n${money(expense.amountCents, currency, locale)} removed from balance.`); });

bot.command('chore', (ctx) => {
  const input = ctx.message.text.replace(/^\/chore(?:@\w+)?\s*/i, '').trim(); const [action, ...rest] = input.split(/\s+/); const actor = actorName(ctx);
  const locale = localeFor(ctx);
  if (action?.toLowerCase() === 'add') { const parsed = parseChoreInput(rest.join(' ')); if (!parsed) return ctx.reply(t(locale, 'chores.format')); const chore = store.addChore(ctx.chat.id, parsed, actor); return ctx.reply(t(locale, 'chores.added', { task: chore.task, assignee: chore.assignedTo || t(locale, 'common.unassigned'), due: chore.dueDate || t(locale, 'common.noDueDate'), id: chore.id }), { reply_markup: dashboardKeyboard(ctx, 'chores', locale) }); }
  if (['done', 'reopen'].includes(action?.toLowerCase())) { const chore = store.updateChore(ctx.chat.id, rest[0], { done: action.toLowerCase() === 'done' }, actor); return ctx.reply(chore ? `${t(locale, chore.done ? 'chores.completed' : 'common.reopen')}: ${chore.task}` : t(locale, 'chores.notFound')); }
  if (action?.toLowerCase() === 'reassign') { const chore = store.updateChore(ctx.chat.id, rest[0], { assignedTo: rest[1] || null }, actor); return ctx.reply(chore ? `${chore.task} — ${t(locale, 'chores.assignedTo', { name: chore.assignedTo || t(locale, 'common.unassigned') })}` : t(locale, 'chores.notFound')); }
  if (action?.toLowerCase() === 'delete') return ctx.reply(store.deleteChore(ctx.chat.id, rest[0], actor) ? t(locale, 'common.delete') : t(locale, 'chores.notFound'));
  return ctx.reply(t(locale, 'chores.format'));
});
bot.command('done', (ctx) => { const locale = localeFor(ctx); const id = ctx.message.text.trim().split(/\s+/)[1]; const chore = store.updateChore(ctx.chat.id, id, { done: true }, actorName(ctx)); return ctx.reply(chore ? `${t(locale, 'chores.completed')}: “${chore.task}” — ${chore.doneBy}` : t(locale, 'chores.notFound')); });
bot.command('chores', (ctx) => { const locale = localeFor(ctx); const chores = store.dashboard(ctx.chat.id).chores; if (!chores.length) return ctx.reply(t(locale, 'chores.empty')); const active = chores.filter((c) => !c.done), completed = chores.filter((c) => c.done).slice(-5); let message = `${t(locale, 'chores.list')}\n\n`; if (active.length) message += `${t(locale, 'chores.active')}\n${active.map((c) => `• ${c.task} — ${c.assignedTo || t(locale, 'common.unassigned')}\n  ${c.id}`).join('\n')}\n`; if (completed.length) message += `\n${t(locale, 'chores.recent')}\n${completed.map((c) => `✓ ${c.task}`).join('\n')}`; return ctx.reply(message, { reply_markup: dashboardKeyboard(ctx, 'chores', locale) }); });

bot.command('grocery', (ctx) => {
  const input = ctx.message.text.replace(/^\/grocery(?:@\w+)?\s*/i, '').trim(); const [action, ...rest] = input.split(/\s+/); const actor = actorName(ctx); const locale = localeFor(ctx);
  if (action?.toLowerCase() === 'add' && rest.length) { const urgent = rest.at(-1)?.toLowerCase() === 'urgent'; const name = urgent ? rest.slice(0, -1).join(' ') : rest.join(' '); const item = store.addGrocery(ctx.chat.id, { name, priority: urgent ? 'urgent' : 'normal' }, actor); return ctx.reply(`${t(locale, 'groceries.addItem')}: ${item.name}\nID: ${item.id}`, { reply_markup: dashboardKeyboard(ctx, 'groceries', locale) }); }
  if (['done', 'restore'].includes(action?.toLowerCase())) { const price = Number(rest[1]); const patch = { purchased: action.toLowerCase() === 'done', ...(Number.isFinite(price) && price > 0 ? { purchasePriceCents: Math.round(price * 100) } : {}) }; const item = store.updateGrocery(ctx.chat.id, rest[0], patch, actor); return ctx.reply(item ? `${t(locale, item.purchased ? 'groceries.purchased' : 'groceries.restore')}: ${item.name}` : t(locale, 'groceries.empty')); }
  if (action?.toLowerCase() === 'delete') return ctx.reply(store.deleteGrocery(ctx.chat.id, rest[0], actor) ? t(locale, 'common.delete') : t(locale, 'groceries.empty'));
  return ctx.reply(`${t(locale, 'groceries.addItem')}: /grocery add milk`);
});
bot.command('groceries', (ctx) => { const locale = localeFor(ctx); const items = store.dashboard(ctx.chat.id).groceries; const active = items.filter((i) => !i.purchased); if (!active.length) return ctx.reply(t(locale, 'groceries.empty')); return ctx.reply(`${t(locale, 'groceries.title')}\n\n${active.map((i) => `${i.priority === 'urgent' ? '!' : '•'} ${i.name} × ${i.quantity}\n  ${i.id}`).join('\n')}`, { reply_markup: dashboardKeyboard(ctx, 'groceries', locale) }); });
bot.command('roomies', (ctx) => { const locale = localeFor(ctx); const members = store.dashboard(ctx.chat.id).members.filter((m) => m.active); return ctx.reply(`${t(locale, 'navigation.roomies')}\n\n${members.map((m) => `• ${m.displayName}${m.username ? ` (${m.username})` : ''} — ${m.role}`).join('\n') || t(locale, 'ui.roomiesEmpty')}`, { reply_markup: dashboardKeyboard(ctx, 'roomies', locale) }); });
bot.command('activity', (ctx) => { const locale = localeFor(ctx); const events = store.dashboard(ctx.chat.id).activity.slice(0, 10); return ctx.reply(`${t(locale, 'navigation.activity')}\n\n${events.map((e) => `• ${e.message}`).join('\n') || t(locale, 'ui.activityEmpty')}`, { reply_markup: dashboardKeyboard(ctx, 'activity', locale) }); });
bot.command('settings', (ctx) => { const locale = localeFor(ctx); const input = ctx.message.text.replace(/^\/settings(?:@\w+)?\s*/i, '').trim(); const current = store.settings(ctx.chat.id); if (!input) return ctx.reply(`${t(locale, 'navigation.settings')}\n\n${t(locale, 'settings.houseName')}: ${current.houseName}\n${t(locale, 'settings.currency')}: ${current.currency}\n${t(locale, 'settings.timezone')}: ${current.timezone}\n${t(locale, 'settings.houseLanguage')}: ${localeName(current.defaultLocale, locale)}`, { reply_markup: dashboardKeyboard(ctx, 'settings', locale) }); const member = store.memberByTelegramId(ctx.chat.id, ctx.from.id); if (!['owner', 'admin'].includes(member?.role)) return ctx.reply(t(locale, 'settings.adminOnly')); const [key, ...valueParts] = input.split(/\s+/); const map = { name: 'houseName', currency: 'currency', timezone: 'timezone' }; if (!map[key.toLowerCase()] || !valueParts.length) return ctx.reply(`${t(locale, 'navigation.settings')}: /settings name, currency, timezone`); const value = valueParts.join(' '); try { const updated = store.updateSettings(ctx.chat.id, { [map[key.toLowerCase()]]: key.toLowerCase() === 'currency' ? value.toUpperCase().slice(0, 3) : value }, actorName(ctx)); return ctx.reply(`${t(locale, 'dashboard.saved')} ${updated[map[key.toLowerCase()]]}`); } catch (error) { return ctx.reply(error.message); } });

bot.command('fundme', (ctx) => { const locale = localeFor(ctx); const input = commandInput(ctx, 'fundme'); const parts = input.split(/\s+/); const target = Number(parts.at(-1)?.replace(',', '.')); const title = parts.slice(0, -1).join(' '); try { const fund = store.addFund(ctx.chat.id, { title, target }, actorName(ctx)); return ctx.reply(`Fund created\n${fund.title}\nTarget: ${money(fund.targetCents, store.settings(ctx.chat.id).currency, locale)}\nID: ${fund.id}\nUse /chipin ${fund.id} 10`, { reply_markup: dashboardKeyboard(ctx, 'activity', locale) }); } catch (error) { return ctx.reply(error.message); } });
bot.command('chipin', (ctx) => { const locale = localeFor(ctx); const [id, amount] = commandInput(ctx, 'chipin').split(/\s+/); const fund = store.chipInFund(ctx.chat.id, id, Number(amount?.replace(',', '.')), actorName(ctx)); if (!fund) return ctx.reply('Format: /chipin <fund-id-or-number> <amount>'); const currency = store.settings(ctx.chat.id).currency; const raised = fund.contributions.reduce((sum, item) => sum + item.amountCents, 0); return ctx.reply(`Chip-in saved\n${fund.title}\nRaised: ${money(raised, currency, locale)} / ${money(fund.targetCents, currency, locale)}`); });
bot.command('funds', (ctx) => { const locale = localeFor(ctx); const funds = store.dashboard(ctx.chat.id).funds.filter((fund) => fund.status === 'active'); if (!funds.length) return ctx.reply('No shared funds yet.\nCreate one with /fundme couch 250'); const currency = store.settings(ctx.chat.id).currency; return ctx.reply(`Shared funds\n\n${listByNumber(funds, (fund) => { const raised = fund.contributions.reduce((sum, item) => sum + item.amountCents, 0); return `${fund.title} — ${money(raised, currency, locale)} / ${money(fund.targetCents, currency, locale)}\n   ${fund.id}`; })}`); });
bot.command('corrections', (ctx) => { const input = commandInput(ctx, 'corrections'); if (input.toLowerCase().startsWith('add ')) { const correction = store.addCorrection(ctx.chat.id, input.slice(4), actorName(ctx)); return ctx.reply(`Correction requested\n${correction.message}\nID: ${correction.id}\nUse /confirm ${correction.id} or /reject ${correction.id}`); } const pending = store.dashboard(ctx.chat.id).corrections.filter((item) => item.status === 'pending'); return ctx.reply(pending.length ? `Pending corrections\n\n${listByNumber(pending, (item) => `${item.message}\n   ${item.id}`)}` : 'No pending corrections.\nCreate one with /corrections add <what needs fixing>'); });
bot.command('confirm', (ctx) => { const correction = store.updateCorrection(ctx.chat.id, commandInput(ctx, 'confirm'), 'confirmed', actorName(ctx)); return ctx.reply(correction ? `Correction confirmed\n${correction.message}` : 'Pending correction not found. Use /corrections.'); });
bot.command('reject', (ctx) => { const correction = store.updateCorrection(ctx.chat.id, commandInput(ctx, 'reject'), 'rejected', actorName(ctx)); return ctx.reply(correction ? `Correction rejected\n${correction.message}` : 'Pending correction not found. Use /corrections.'); });
bot.command('houserules', (ctx) => { const input = commandInput(ctx, 'houserules'); const current = store.settings(ctx.chat.id); if (!input) return ctx.reply(`House rules\n${current.houseRules || 'No house rules saved yet.'}\n\nSet them with /houserules <rules>`); const updated = store.updateSettings(ctx.chat.id, { houseRules: input }, actorName(ctx)); return ctx.reply(`House rules saved\n${updated.houseRules}`); });
bot.command('quiethours', (ctx) => { const input = commandInput(ctx, 'quiethours'); const current = store.settings(ctx.chat.id); if (!input) return ctx.reply(`Quiet hours\n${current.quietHours || 'Not set'}\n\nSet them with /quiethours 22:00-08:00 or /quiethours off`); const quietHours = input.toLowerCase() === 'off' ? '' : input; const updated = store.updateSettings(ctx.chat.id, { quietHours }, actorName(ctx)); return ctx.reply(`Quiet hours ${updated.quietHours ? `saved: ${updated.quietHours}` : 'turned off'}`); });
bot.command('party', (ctx) => { const input = commandInput(ctx, 'party').toLowerCase(); const current = store.settings(ctx.chat.id); if (!input || input === 'status') return ctx.reply(`Party mode is ${current.partyMode ? 'on' : 'off'}.\nUse /party on or /party off.`); if (!['on', 'off'].includes(input)) return ctx.reply('Format: /party on or /party off'); const updated = store.updateSettings(ctx.chat.id, { partyMode: input === 'on' }, actorName(ctx)); return ctx.reply(`Party mode ${updated.partyMode ? 'on' : 'off'}`); });
bot.command('tab', (ctx) => { const locale = localeFor(ctx); const input = commandInput(ctx, 'tab'); const [action, amountText, ...descriptionParts] = input.split(/\s+/); if (action?.toLowerCase() === 'add') { const amount = Number(amountText?.replace(',', '.')); const description = descriptionParts.join(' '); if (!Number.isFinite(amount) || amount <= 0 || !description) return ctx.reply('Format: /tab add 20 drinks'); return saveExpense(ctx, { amount, description: `Tab: ${description}`, paidBy: actorName(ctx), category: 'tab' }, 'tab'); } const tabs = store.dashboard(ctx.chat.id).expenses.filter((expense) => expense.category === 'tab' || expense.description.toLowerCase().startsWith('tab:')).slice(-10); const currency = store.settings(ctx.chat.id).currency; return ctx.reply(tabs.length ? `Shared tab\n\n${tabs.map((expense) => expenseLine(expense, currency, locale)).join('\n\n')}` : 'No shared tab items yet.\nAdd one with /tab add 20 drinks'); });
bot.command('ding', (ctx) => { const input = commandInput(ctx, 'ding'); const members = store.dashboard(ctx.chat.id).members.filter((m) => m.active).map((m) => m.username || m.displayName); if (input) store.addNote(ctx.chat.id, 'ding', input, actorName(ctx)); return ctx.reply(`Ding sent${input ? `: ${input}` : ''}\n${members.length ? members.join(' ') : 'No roomies registered yet.'}`); });
function noteCommand(command, title, emptyText) { bot.command(command, (ctx) => { const input = commandInput(ctx, command); if (input) { const note = store.addNote(ctx.chat.id, command, input, actorName(ctx)); return ctx.reply(`${title} saved\n${note.text}\nID: ${note.id}`); } const notes = store.listNotes(ctx.chat.id, command); return ctx.reply(notes.length ? `${title}\n\n${listByNumber(notes, (note) => note.text)}` : `${emptyText}\nAdd one with /${command} <details>`); }); }
noteCommand('dinner', 'Dinner plan', 'No dinner plan saved yet.');
noteCommand('sundayplan', 'Sunday plan', 'No Sunday plan saved yet.');
noteCommand('pickup', 'Pickup task', 'No pickup tasks saved yet.');
noteCommand('date', 'Date mode', 'No date plan saved yet.');
noteCommand('mood', 'Mood check-in', 'No mood check-ins saved yet.');
bot.command('ours', (ctx) => { const input = commandInput(ctx, 'ours'); if (input) { const note = store.addNote(ctx.chat.id, 'ours', input, actorName(ctx)); return ctx.reply(`Couple note saved\n${note.text}`); } const data = store.dashboard(ctx.chat.id); const recent = ['date', 'mood', 'ours'].flatMap((type) => store.listNotes(ctx.chat.id, type, 2)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5); return ctx.reply(`Ours summary\nExpenses: ${data.expenses.length}\nOpen chores: ${data.chores.filter((c) => !c.done).length}\nRecent notes:\n${recent.length ? recent.map((note) => `• ${note.type}: ${note.text}`).join('\n') : 'No couple notes yet.'}`); });

bot.command('dashboard', (ctx) => { const locale = localeFor(ctx); const replyMarkup = dashboardKeyboard(ctx, null, locale); return replyMarkup ? ctx.reply(t(locale, 'bot.dashboardReady'), { reply_markup: replyMarkup }) : ctx.reply('Dashboard URL is not configured yet. Set MINI_APP_URL.'); });
bot.command('language', (ctx) => { const locale = localeFor(ctx); const isGroup = ctx.chat.type !== 'private'; const prefix = isGroup ? `${t(locale, 'bot.houseLanguage', { language: localeName(store.settings(ctx.chat.id).defaultLocale, locale) })}\n` : ''; return ctx.reply(`${prefix}${t(locale, 'bot.chooseLanguage')}`, { reply_markup: languageKeyboard }); });
bot.action(/^language:(en|fr|ar)$/, async (ctx) => { const selected = normalizeLocale(ctx.match[1]); const isGroup = ctx.chat.type !== 'private'; if (isGroup) { const member = store.memberByTelegramId(ctx.chat.id, ctx.from.id); if (!['owner', 'admin'].includes(member?.role)) { await ctx.answerCbQuery(); return ctx.reply(`${t(localeFor(ctx), 'settings.adminOnly')}\n${t(localeFor(ctx), 'bot.personalLanguageHint')}`); } store.updateSettings(ctx.chat.id, { defaultLocale: selected }, actorName(ctx)); } else store.setUserLocale(ctx.from.id, selected); await ctx.answerCbQuery(t(selected, 'settings.languageUpdated')); return ctx.editMessageText(t(selected, 'settings.languageUpdated')); });
bot.command('clear', (ctx) => { const locale = localeFor(ctx); store.clear(ctx.chat.id); store.registerMember(ctx.chat.id, ctx.from, ctx.chat.title || 'My Crib'); return ctx.reply(`${t(locale, 'common.delete')}: ${t(locale, 'settings.house')}`); });
bot.on('text', (ctx) => { const parsed = parseNaturalExpense(ctx.message.text, actorName(ctx)); if (parsed) return saveExpense(ctx, parsed); if (ctx.message.text.startsWith('/')) return ctx.reply(t(localeFor(ctx), 'bot.unknownCommand')); return undefined; });
bot.catch((error, ctx) => console.error(`Bot error for update ${ctx.update.update_id}:`, error));

async function authenticate(initData, chatId) { const user = validateTelegramInitData(initData, process.env.BOT_TOKEN); if (!store.isMember(chatId, user.id)) throw Object.assign(new Error('You are not an active member of this crib.'), { statusCode: 403 }); return { ...store.memberByTelegramId(chatId, user.id), telegramLanguageCode: user.language_code, locale: store.resolveLocale(chatId, user) }; }
async function listHouses(initData) {
  const user = validateTelegramInitData(initData, process.env.BOT_TOKEN);
  return {
    viewer: { telegramId: String(user.id), displayName: cleanName(user.first_name || user.username || String(user.id)), locale: store.userLocale(user.id) || normalizeLocale(user.language_code) },
    houses: store.housesForTelegramId(user.id),
    activeChatId: store.activeChatId(user.id)
  };
}
async function setActiveHouse(initData, chatId) { const viewer = await authenticate(initData, chatId); return { activeChatId: store.setActiveChatId(viewer.telegramId, chatId) }; }
async function performAction(chatId, action, payload, viewer) {
  const actor = viewer.displayName;
  if (action === 'expense.add') return store.addExpense(chatId, { amount: Number(payload.amount), description: payload.description, paidBy: payload.paidBy || actor, participants: payload.participants || store.memberNames(chatId), category: payload.category, notes: payload.notes }, actor, 'app');
  if (action === 'chore.add') return store.addChore(chatId, payload, actor);
  if (action === 'chore.toggle') { const result = store.updateChore(chatId, payload.id, { done: Boolean(payload.done) }, actor); if (!result) throw Object.assign(new Error('Chore not found.'), { statusCode: 404 }); return result; }
  if (action === 'grocery.add') return store.addGrocery(chatId, payload, actor);
  if (action === 'grocery.toggle') { const result = store.updateGrocery(chatId, payload.id, { purchased: Boolean(payload.purchased), ...(payload.purchasePrice ? { purchasePriceCents: Math.round(Number(payload.purchasePrice) * 100) } : {}) }, actor); if (!result) throw Object.assign(new Error('Grocery item not found.'), { statusCode: 404 }); return result; }
  if (action === 'settings.update') { if (!['owner', 'admin'].includes(viewer.role)) throw Object.assign(new Error('Only a house owner or admin can change settings.'), { statusCode: 403 }); return store.updateSettings(chatId, payload, actor); }
  if (action === 'locale.update') { const locale = store.setUserLocale(viewer.telegramId, payload.locale); return { locale }; }
  throw Object.assign(new Error('Unsupported dashboard action.'), { statusCode: 400 });
}

const dashboardServer = startDashboardServer({ getDashboard: (chatId, viewer) => store.dashboard(chatId, viewer), listHouses, setActiveHouse, performAction, authenticate, port: PORT, allowedOrigin: miniAppOrigin(process.env) });
async function syncMenuButton() {
  try {
    const url = menuAppUrl(process.env);
    if (!url) return console.warn('Cribbit menu button was not synchronized: MINI_APP_URL and RAILWAY_PUBLIC_DOMAIN are required.');
    await bot.telegram.setChatMenuButton({ menuButton: { type: 'web_app', text: 'Cribbit', web_app: { url } } });
  }
  catch (error) { console.error('Cribbit menu button synchronization failed:', error.message); }
}
Promise.all([bot.telegram.setMyCommands(BOT_COMMANDS), ...SUPPORTED_LOCALES.map((locale) => bot.telegram.setMyCommands(commandsForLocale(locale), { language_code: locale }))]).then(syncMenuButton).then(() => bot.launch()).then(() => console.log(`Cribbit bot is running. Data file: ${DATA_FILE}`)).catch((error) => { console.error('Failed to start Cribbit:', error); dashboardServer.close(); process.exit(1); });
function shutdown(signal) { bot.stop(signal); dashboardServer.close(); }
process.once('SIGINT', () => shutdown('SIGINT')); process.once('SIGTERM', () => shutdown('SIGTERM'));
