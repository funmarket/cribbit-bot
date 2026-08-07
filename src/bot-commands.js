const COMMANDS = [
  ['start', 'Open Cribbit'],
  ['help', 'Show commands'],
  ['setup', 'Set up your household'],
  ['split', 'Log an expense'],
  ['balance', 'View balances'],
  ['settle', 'Show settlement suggestions'],
  ['undo', 'Undo the last expense'],
  ['void', 'Void an expense by ID'],
  ['last', 'Show the last expense'],
  ['chore', 'Add or manage chores'],
  ['chores', 'List chores'],
  ['done', 'Mark a chore complete'],
  ['grocery', 'Add a grocery item'],
  ['groceries', 'View the grocery list'],
  ['plan', 'Create, join, or view plans'],
  ['plans', 'List active plans'],
  ['fundme', 'Create a shared fund goal'],
  ['chipin', 'Contribute to a fund'],
  ['funds', 'List shared funds'],
  ['corrections', 'View pending corrections'],
  ['confirm', 'Confirm a correction'],
  ['reject', 'Reject a correction'],
  ['roomies', 'Show household members'],
  ['activity', 'View recent activity'],
  ['settings', 'View or update house settings'],
  ['dashboard', 'Open Cribbit dashboard'],
  ['language', 'Change language'],
  ['houserules', 'View or set house rules'],
  ['quiethours', 'View or set quiet hours'],
  ['party', 'Party mode tools'],
  ['tab', 'Shared tab tools'],
  ['ding', 'Ping who is free'],
  ['dinner', 'Dinner planning'],
  ['sundayplan', 'Weekly planning'],
  ['pickup', 'Family pickup task'],
  ['date', 'Date mode tools'],
  ['ours', 'Couple summary'],
  ['mood', 'Light couple check-in']
];

const LOCALIZED_DESCRIPTIONS = {
  en: Object.fromEntries(COMMANDS),
  fr: Object.fromEntries(COMMANDS),
  ar: Object.fromEntries(COMMANDS)
};

const commandsForLocale = (locale = 'en') => {
  const descriptions = LOCALIZED_DESCRIPTIONS[locale] || LOCALIZED_DESCRIPTIONS.en;
  return COMMANDS.map(([command]) => ({ command, description: descriptions[command] || LOCALIZED_DESCRIPTIONS.en[command] }));
};

const BOT_COMMANDS = commandsForLocale('en');

module.exports = { BOT_COMMANDS, commandsForLocale };
