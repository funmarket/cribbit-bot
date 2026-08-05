require('dotenv').config();
const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');

if (!process.env.BOT_TOKEN) {
  throw new Error('BOT_TOKEN is required. Add it to .env locally or Railway Variables in production.');
}

const bot = new Telegraf(process.env.BOT_TOKEN);
const DATA_DIR = process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || '.';
const DATA_FILE = path.join(DATA_DIR, 'expenses.json');

fs.mkdirSync(DATA_DIR, { recursive: true });

let groupExpenses = {};
let groupChores = {};

if (fs.existsSync(DATA_FILE)) {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    groupExpenses = data.expenses || {};
    groupChores = data.chores || {};
  } catch (err) {
    console.log('Starting with empty data');
  }
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify({
    expenses: groupExpenses,
    chores: groupChores
  }, null, 2));
}

bot.start((ctx) => {
  ctx.reply(`🐸 Cribbit is alive!

Commands:
/split 50 pizza
/balance
/chore add clean kitchen
/chores
/done 1
/clear`);
});

bot.command('help', (ctx) => {
  ctx.reply(`Commands:
/split amount description
/balance
/chore add <task>
/chores
/done <number>
/clear`);
});

// ========== EXPENSES ==========
bot.command('split', (ctx) => {
  const chatId = ctx.chat.id;
  const text = ctx.message.text;
  const parts = text.split(' ');

  if (parts.length < 3) {
    return ctx.reply('Format: /split 50 pizza');
  }

  const amount = parseFloat(parts[1]);
  const description = parts.slice(2).join(' ');

  if (isNaN(amount) || amount <= 0) {
    return ctx.reply('Please enter a valid amount.\nExample: /split 50 pizza');
  }

  if (!groupExpenses[chatId]) groupExpenses[chatId] = [];

  groupExpenses[chatId].push({
    amount,
    description,
    paidBy: ctx.from.first_name
  });

  saveData();
  ctx.reply(`✅ Logged!\n$${amount.toFixed(2)} for ${description}\nPaid by: ${ctx.from.first_name}`);
});

bot.command('balance', (ctx) => {
  const chatId = ctx.chat.id;
  const expenses = groupExpenses[chatId] || [];

  if (expenses.length === 0) {
    return ctx.reply('No expenses logged yet.\nUse /split to add one.');
  }

  const paid = {};
  expenses.forEach(exp => {
    paid[exp.paidBy] = (paid[exp.paidBy] || 0) + exp.amount;
  });

  const people = Object.keys(paid);
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const fairShare = totalSpent / people.length;

  let message = `💰 Group Balance\nTotal spent: $${totalSpent.toFixed(2)}\nFair share: $${fairShare.toFixed(2)}\n\n`;

  message += `Who paid what:\n`;
  for (const person of people) {
    message += `• ${person}: $${paid[person].toFixed(2)}\n`;
  }

  message += `\nWho owes what:\n`;
  for (const person of people) {
    const amount = paid[person] - fairShare;
    if (amount > 0.01) {
      message += `✅ ${person} should receive $${amount.toFixed(2)}\n`;
    } else if (amount < -0.01) {
      message += `❌ ${person} owes $${Math.abs(amount).toFixed(2)}\n`;
    } else {
      message += `✔️ ${person} is settled\n`;
    }
  }

  ctx.reply(message);
});

// ========== CHORES ==========
bot.command('chore', (ctx) => {
  const chatId = ctx.chat.id;
  const text = ctx.message.text;
  const parts = text.split(' ');

  if (parts.length < 3 || parts[1].toLowerCase() !== 'add') {
    return ctx.reply('Format: /chore add clean the kitchen');
  }

  const task = parts.slice(2).join(' ');

  if (!groupChores[chatId]) groupChores[chatId] = [];

  groupChores[chatId].push({
    task,
    addedBy: ctx.from.first_name,
    done: false
  });

  saveData();
  ctx.reply(`🧹 Chore added: "${task}"`);
});

bot.command('chores', (ctx) => {
  const chatId = ctx.chat.id;
  const chores = groupChores[chatId] || [];

  if (chores.length === 0) {
    return ctx.reply('No chores yet.\nAdd one with:\n/chore add clean kitchen');
  }

  let message = '🧹 Chore List:\n\n';
  chores.forEach((chore, i) => {
    const status = chore.done ? '✅' : '⬜';
    message += `${status} ${i + 1}. ${chore.task}\n`;
  });

  message += `\nMark as done with: /done 1`;
  ctx.reply(message);
});

bot.command('done', (ctx) => {
  const chatId = ctx.chat.id;
  const parts = ctx.message.text.split(' ');

  if (parts.length < 2) {
    return ctx.reply('Format: /done 1');
  }

  const number = parseInt(parts[1]);
  const chores = groupChores[chatId] || [];

  if (isNaN(number) || number < 1 || number > chores.length) {
    return ctx.reply('Please enter a valid chore number.\nUse /chores to see the list.');
  }

  const chore = chores[number - 1];

  if (chore.done) {
    return ctx.reply(`This chore is already done: "${chore.task}"`);
  }

  chore.done = true;
  chore.doneBy = ctx.from.first_name;
  saveData();

  ctx.reply(`✅ Done! "${chore.task}" marked as completed by ${ctx.from.first_name}`);
});

bot.command('clear', (ctx) => {
  const chatId = ctx.chat.id;
  groupExpenses[chatId] = [];
  groupChores[chatId] = [];
  saveData();
  ctx.reply('🧹 All expenses and chores in this group have been cleared.');
});

bot.launch()
  .then(() => console.log(`Cribbit bot is running. Data file: ${DATA_FILE}`))
  .catch((err) => {
    console.error('Failed to start Cribbit:', err);
    process.exit(1);
  });

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
