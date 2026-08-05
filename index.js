require('dotenv').config();
const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');
const { calculateBalances } = require('./src/balances');
const { cleanName, createExpense, parseNaturalExpense, uniqueNames } = require('./src/expenses');
const { parseChoreInput } = require('./src/chores');
const { startDashboardServer } = require('./src/dashboard-server');
const { BOT_COMMANDS } = require('./src/bot-commands');

if (!process.env.BOT_TOKEN) {
  throw new Error('BOT_TOKEN is required. Add it to .env locally or Railway Variables in production.');
}

const bot = new Telegraf(process.env.BOT_TOKEN);
const DATA_DIR = process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || '.';
const DATA_FILE = path.join(DATA_DIR, 'expenses.json');
const PORT = Number(process.env.PORT) || 3000;

fs.mkdirSync(DATA_DIR, { recursive: true });

let groupExpenses = {};
let groupChores = {};
let groupMembers = {};

if (fs.existsSync(DATA_FILE)) {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    groupExpenses = data.expenses || {};
    groupChores = data.chores || {};
    groupMembers = data.members || {};
  } catch (error) {
    console.error(`Could not read ${DATA_FILE}; starting with empty data.`, error);
  }
}

function saveData() {
  const temporaryFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify({
    expenses: groupExpenses,
    chores: groupChores,
    members: groupMembers
  }, null, 2));
  fs.renameSync(temporaryFile, DATA_FILE);
}

function getActorName(ctx) {
  return cleanName(ctx.from.first_name || ctx.from.username || String(ctx.from.id));
}

function addMembers(chatId, names) {
  groupMembers[chatId] = uniqueNames([...(groupMembers[chatId] || []), ...names]);
  return groupMembers[chatId];
}

function logExpense(chatId, details, actorName) {
  if (!groupExpenses[chatId]) groupExpenses[chatId] = [];
  const members = addMembers(chatId, [actorName, details.paidBy]);
  const expense = createExpense({ ...details, addedBy: actorName, participants: members });
  groupExpenses[chatId].push(expense);
  saveData();
  return expense;
}

function dashboardBaseUrl() {
  if (process.env.MINI_APP_URL) return process.env.MINI_APP_URL.replace(/\/$/, '');
  if (process.env.RAILWAY_PUBLIC_DOMAIN) return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  return null;
}

function dashboardUrl(chatId) {
  const baseUrl = dashboardBaseUrl();
  if (!baseUrl) return null;

  const params = new URLSearchParams({ chatId: String(chatId) });
  const railwayApiUrl = process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : null;
  if (process.env.MINI_APP_URL && railwayApiUrl) {
    params.set('apiBaseUrl', railwayApiUrl);
  }
  return `${baseUrl}/?${params.toString()}`;
}

function dashboardKeyboard(chatId) {
  const url = dashboardUrl(chatId);
  return url ? { inline_keyboard: [[{ text: 'Open Dashboard', web_app: { url } }]] } : undefined;
}

bot.start((ctx) => {
  const replyMarkup = dashboardKeyboard(ctx.chat.id);
  return ctx.reply(`🐸 Cribbit is alive!

Log expenses naturally:
Paid 45 for groceries
Ken paid 30 for pizza
I paid 20 on Uber

Commands:
/split 50 dinner
/balance
/chore add clean kitchen @username
/chores
/done 1
/dashboard
/clear`, replyMarkup ? { reply_markup: replyMarkup } : undefined);
});

bot.command('help', (ctx) => ctx.reply(`Commands:
/split amount description
/balance
/chore add <task> [@username | for Name]
/chores
/done <number>
/dashboard
/clear

You can also say: “Paid 45 for groceries”`));

bot.command('split', (ctx) => {
  const parts = ctx.message.text.trim().split(/\s+/);
  if (parts.length < 3) return ctx.reply('Format: /split 50 pizza');

  const amount = Number(parts[1].replace(/,/g, ''));
  const description = parts.slice(2).join(' ').trim();
  if (!Number.isFinite(amount) || amount <= 0 || !description) {
    return ctx.reply('Please enter a valid amount.\nExample: /split 50 pizza');
  }

  const actorName = getActorName(ctx);
  const expense = logExpense(ctx.chat.id, { amount, description, paidBy: actorName }, actorName);
  return ctx.reply(`✅ Logged!\n$${expense.amount.toFixed(2)} for ${expense.description}\nPaid by: ${expense.paidBy}`);
});

bot.command('balance', (ctx) => {
  const chatId = ctx.chat.id;
  const expenses = groupExpenses[chatId] || [];
  if (!expenses.length) return ctx.reply('No expenses logged yet.\nUse /split or say “Paid 45 for groceries”.');

  const balances = calculateBalances(expenses, groupMembers[chatId] || []);
  let message = `💰 Group Balance\nTotal spent: $${balances.totalSpent.toFixed(2)}\nPeople included: ${balances.memberCount}\n\nWho paid what:\n`;

  for (const [person, amount] of Object.entries(balances.paid)) {
    message += `• ${person}: $${amount.toFixed(2)}\n`;
  }

  message += '\nNet positions:\n';
  for (const [person, amount] of Object.entries(balances.net)) {
    if (amount > 0.01) message += `✅ ${person} should receive $${amount.toFixed(2)}\n`;
    else if (amount < -0.01) message += `❌ ${person} owes $${Math.abs(amount).toFixed(2)}\n`;
    else message += `✔️ ${person} is settled\n`;
  }

  message += '\nSuggested payments:\n';
  if (!balances.settlements.length) message += '🎉 Everyone is settled!\n';
  for (const settlement of balances.settlements) {
    message += `• ${settlement.from} should pay ${settlement.to} $${settlement.amount.toFixed(2)}\n`;
  }

  return ctx.reply(message);
});

bot.command('chore', (ctx) => {
  const match = ctx.message.text.match(/^\/chore(?:@\w+)?\s+add\s+(.+)$/i);
  if (!match) return ctx.reply('Format: /chore add clean the kitchen @username');

  const parsed = parseChoreInput(match[1]);
  if (!parsed) return ctx.reply('Please include a chore description.');
  const chatId = ctx.chat.id;
  if (!groupChores[chatId]) groupChores[chatId] = [];
  groupChores[chatId].push({
    ...parsed,
    addedBy: getActorName(ctx),
    done: false,
    createdAt: new Date().toISOString()
  });
  saveData();
  return ctx.reply(`🧹 Chore added: “${parsed.task}”${parsed.assignedTo ? `\nAssigned to: ${parsed.assignedTo}` : ''}`);
});

bot.command('chores', (ctx) => {
  const chores = groupChores[ctx.chat.id] || [];
  if (!chores.length) return ctx.reply('No chores yet.\nAdd one with:\n/chore add clean kitchen @username');

  let message = '🧹 Chore List:\n\n';
  chores.forEach((chore, index) => {
    message += `${chore.done ? '✅' : '⬜'} ${index + 1}. ${chore.task}`;
    if (chore.assignedTo) message += ` — ${chore.assignedTo}`;
    if (chore.doneBy) message += ` (done by ${chore.doneBy})`;
    message += '\n';
  });
  return ctx.reply(`${message}\nMark as done with: /done 1`);
});

bot.command('done', (ctx) => {
  const number = Number.parseInt(ctx.message.text.trim().split(/\s+/)[1], 10);
  const chores = groupChores[ctx.chat.id] || [];
  if (!Number.isInteger(number) || number < 1 || number > chores.length) {
    return ctx.reply('Please enter a valid chore number.\nUse /chores to see the list.');
  }

  const chore = chores[number - 1];
  if (chore.done) return ctx.reply(`This chore is already done: “${chore.task}”`);
  chore.done = true;
  chore.doneBy = getActorName(ctx);
  chore.completedAt = new Date().toISOString();
  saveData();
  return ctx.reply(`✅ Done! “${chore.task}” marked as completed by ${chore.doneBy}`);
});

bot.command('dashboard', (ctx) => {
  const replyMarkup = dashboardKeyboard(ctx.chat.id);
  if (!replyMarkup) {
    return ctx.reply('Dashboard URL is not configured yet. Set MINI_APP_URL or generate a Railway public domain.');
  }
  return ctx.reply('Your Cribbit household dashboard:', { reply_markup: replyMarkup });
});

bot.command('clear', (ctx) => {
  groupExpenses[ctx.chat.id] = [];
  groupChores[ctx.chat.id] = [];
  groupMembers[ctx.chat.id] = [];
  saveData();
  return ctx.reply('🧹 All expenses and chores in this group have been cleared.');
});

bot.on('text', (ctx) => {
  const actorName = getActorName(ctx);
  const parsed = parseNaturalExpense(ctx.message.text, actorName);
  if (!parsed) return;
  const expense = logExpense(ctx.chat.id, parsed, actorName);
  return ctx.reply(`✅ Logged!\n$${expense.amount.toFixed(2)} for ${expense.description}\nPaid by: ${expense.paidBy}`);
});

bot.catch((error, ctx) => {
  console.error(`Bot error for update ${ctx.update.update_id}:`, error);
});

const dashboardServer = startDashboardServer({
  getExpenses: (chatId) => groupExpenses[chatId] || [],
  getChores: (chatId) => groupChores[chatId] || [],
  getMembers: (chatId) => groupMembers[chatId] || [],
  port: PORT,
  allowedOrigin: process.env.MINI_APP_URL || null
});

bot.telegram.setMyCommands(BOT_COMMANDS)
  .then(() => bot.launch())
  .then(() => console.log(`Cribbit bot is running. Data file: ${DATA_FILE}`))
  .catch((error) => {
    console.error('Failed to start Cribbit:', error);
    dashboardServer.close();
    process.exit(1);
  });

function shutdown(signal) {
  bot.stop(signal);
  dashboardServer.close();
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
