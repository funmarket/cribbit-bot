const BOT_COMMANDS = [
  { command: 'start', description: 'Open Cribbit and see examples' }, { command: 'split', description: 'Split an expense' }, { command: 'balance', description: 'Show balances and settlements' },
  { command: 'chore', description: 'Add, complete, or reassign a chore' }, { command: 'chores', description: 'List household chores' }, { command: 'done', description: 'Mark a chore as completed' },
  { command: 'grocery', description: 'Add or update a grocery item' }, { command: 'groceries', description: 'Show the shared grocery list' }, { command: 'roomies', description: 'Show active house members' },
  { command: 'activity', description: 'Show recent house activity' }, { command: 'settings', description: 'View or update house settings' }, { command: 'dashboard', description: 'Open the household dashboard' },
  { command: 'help', description: 'Show commands and examples' }, { command: 'clear', description: 'Clear this group\'s saved data' }
];
module.exports = { BOT_COMMANDS };
