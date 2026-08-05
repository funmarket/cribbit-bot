const BOT_COMMANDS = [
  { command: 'start', description: 'Open Cribbit and see examples' },
  { command: 'split', description: 'Split an expense' },
  { command: 'balance', description: 'Show balances and settlements' },
  { command: 'chore', description: 'Add and assign a chore' },
  { command: 'chores', description: 'List household chores' },
  { command: 'done', description: 'Mark a chore as completed' },
  { command: 'dashboard', description: 'Open the household dashboard' },
  { command: 'help', description: 'Show commands and examples' },
  { command: 'clear', description: 'Clear this group\'s saved data' }
];

module.exports = { BOT_COMMANDS };
