const DEFAULT_MODE = 'classic';

const MODE_DEFINITIONS = {
  classic: {
    key: 'classic',
    name: 'Classic',
    emoji: '🏠',
    symbol: '·',
    tagline: 'Home base. No frills, no drama. Just balanced.',
    audience: 'universal / no-flavour groups',
    personality: 'neutral, clean, direct',
    tone: { label: 'neutral', sample: 'Simple, clear, and quiet.' },
    memberLabel: 'members',
    houseLabel: 'the group',
    color: '#888780',
    aliases: ['default', 'neutral', 'base'],
    primaryCommands: ['split', 'balance', 'settle', 'last', 'undo', 'void', 'dashboard', 'settings', 'help'],
    plannedCommands: [],
    overviewCards: ['balances', 'recentExpenses', 'quickActions', 'settings']
  },
  roomies: {
    key: 'roomies',
    name: 'Roomies',
    emoji: '🛋️',
    symbol: '—',
    tagline: 'Your flat, balanced. Rent, bills, chores — handled.',
    audience: 'roommates / flatshare',
    personality: 'practical, direct, calm',
    tone: { label: 'practical', sample: 'Clean, clear, and roommate-proof.' },
    memberLabel: 'flatmates',
    houseLabel: 'the house',
    color: '#378ADD',
    aliases: ['roommate', 'roommates', 'flatshare', 'flatmates'],
    primaryCommands: ['split', 'balance', 'settle', 'chore', 'chores', 'grocery', 'groceries', 'houserules', 'quiethours', 'tab'],
    plannedCommands: [
      { command: 'bills', symbol: '🏠', description: 'Recurring bills hub (rent, electricity, internet)' },
      { command: 'away', symbol: '✈️', description: 'Mark yourself away — excluded from splits' },
      { command: 'inventory', symbol: '📦', description: 'Household stock tracker' },
      { command: 'rules', symbol: '📜', description: 'View or set house rules' },
      { command: 'housemeet', symbol: '🗓️', description: 'Schedule a house meeting' },
      { command: 'cleaner', symbol: '🧼', description: 'Log a cleaning service expense' }
    ],
    overviewCards: ['balances', 'chores', 'groceries', 'houseRules', 'quietHours']
  },
  buds: {
    key: 'buds',
    name: 'Buds',
    emoji: '👯',
    symbol: '✦',
    tagline: "Split it, forget it, let's gooo. Chaos is the plan.",
    audience: 'friend groups / social spending',
    personality: 'chaotic fun, casual, loud',
    tone: { label: 'playful', sample: 'Fun first, chaos contained.' },
    memberLabel: 'squad',
    houseLabel: 'the gang',
    color: '#D85A30',
    aliases: ['cubs', 'friends', 'party', 'social', 'buddies'],
    primaryCommands: ['party', 'ding', 'tab', 'fundme', 'chipin', 'funds', 'dinner'],
    plannedCommands: [
      { command: 'trip', symbol: '✈️', description: 'Create a trip expense group' },
      { command: 'vibe', symbol: '🎲', description: 'Who buys the next round?' },
      { command: 'roast', symbol: '👀', description: 'Friendly payment reminder' },
      { command: 'poll', symbol: '📊', description: 'Quick group poll' },
      { command: 'streak', symbol: '🔥', description: 'Payment streaks' },
      { command: 'dare', symbol: '😈', description: 'Random dare for whoever owes most' }
    ],
    overviewCards: ['partyMode', 'tab', 'ding', 'funds', 'activity']
  },
  ladiessecret: {
    key: 'ladiessecret',
    name: 'LadiesSecret',
    emoji: '🤫',
    symbol: '✺',
    tagline: 'Our money, our rules, no drama. The circle holds.',
    audience: "girls' circles / private social planning",
    personality: 'warm, inclusive, a little extra',
    tone: { label: 'secret', sample: 'Soft power, private plans.' },
    memberLabel: 'the girls',
    houseLabel: 'our circle',
    color: '#D4537E',
    aliases: ['ladies', 'girls', 'circle', 'secretcircle'],
    primaryCommands: ['fundme', 'chipin', 'funds', 'party', 'dinner', 'tab', 'activity'],
    plannedCommands: [
      { command: 'ladiesnight', symbol: '🌙', description: "Plan a girls' night out" },
      { command: 'brunch', symbol: '🥐', description: 'Quick brunch split + driver picker' },
      { command: 'spa', symbol: '💅', description: 'Spa day fund' },
      { command: 'glow', symbol: '✨', description: 'Monthly group self-care fund' },
      { command: 'secret', symbol: '🤫', description: 'Private expense — only you can see it' },
      { command: 'birthplan', symbol: '🎂', description: 'Birthday celebration fund + to-do' }
    ],
    overviewCards: ['funds', 'socialPlans', 'activity', 'privacySafePlans', 'quickActions']
  },
  twinsoul: {
    key: 'twinsoul',
    name: 'TwinSoul',
    emoji: '💛',
    symbol: '⟡',
    tagline: "Because love doesn't have to mean complicated money.",
    audience: 'couples',
    personality: 'intimate, soft, thoughtful',
    tone: { label: 'soft', sample: 'Tiny rituals for two.' },
    memberLabel: 'us',
    houseLabel: 'we',
    color: '#EF9F27',
    aliases: ['couple', 'couples', 'partner', 'partners'],
    primaryCommands: ['date', 'ours', 'mood', 'dinner', 'split', 'balance'],
    plannedCommands: [
      { command: 'datenight', symbol: '🍝', description: 'Log a date night expense' },
      { command: 'goal', symbol: '🎯', description: 'Shared savings goal' },
      { command: 'anniversary', symbol: '💐', description: 'Anniversary reminder + fund' },
      { command: 'mine', symbol: '🔒', description: 'Log a personal expense (not split)' },
      { command: 'surprise', symbol: '🎁', description: "Hidden expense — partner can't see yet" },
      { command: 'moodcheck', symbol: '💭', description: 'Weekly financial check-in prompt' }
    ],
    overviewCards: ['date', 'mood', 'ours', 'expenses', 'dinner']
  },
  famsquad: {
    key: 'famsquad',
    name: 'FamSquad',
    emoji: '👨‍👩‍👧‍👦',
    symbol: '✧',
    tagline: 'Family first. Expenses second. Sunday dinner, always.',
    audience: 'family / household',
    personality: 'warm, organized, grounded',
    tone: { label: 'warm', sample: 'Soft landing, organized home.' },
    memberLabel: 'family',
    houseLabel: 'the household',
    color: '#1D9E75',
    aliases: ['nest', 'family', 'home', 'household'],
    primaryCommands: ['dinner', 'pickup', 'sundayplan', 'grocery', 'groceries', 'chore', 'chores', 'quiethours'],
    plannedCommands: [
      { command: 'dinnerfund', symbol: '🍽️', description: 'Collect for a family dinner' },
      { command: 'reunion', symbol: '🏡', description: 'Plan a family reunion' },
      { command: 'kids', symbol: '🧒', description: 'Log child-related expenses' },
      { command: 'occasion', symbol: '🎊', description: 'Occasion fund (Eid, Christmas, birthday)' },
      { command: 'allowance', symbol: '💵', description: 'Track regular allowances' },
      { command: 'household', symbol: '🏠', description: 'Weekly household spending digest' }
    ],
    overviewCards: ['dinner', 'pickup', 'groceries', 'chores', 'quietHours', 'weeklyPlan']
  },
  schoolbuddies: {
    key: 'schoolbuddies',
    name: 'SchoolBuddies',
    emoji: '🎓',
    symbol: '⋄',
    tagline: 'Broke together, thriving together. Student budget forever.',
    audience: 'student groups / cohorts',
    personality: 'casual, relatable, self-aware broke',
    tone: { label: 'budget', sample: 'No shame, just receipts.' },
    memberLabel: 'the crew',
    houseLabel: 'the cohort',
    color: '#7F77DD',
    aliases: ['school', 'students', 'student', 'campus', 'cohort'],
    primaryCommands: ['split', 'balance', 'settle', 'fundme', 'chipin', 'funds', 'sundayplan', 'tab', 'activity'],
    plannedCommands: [
      { command: 'textbook', symbol: '📚', description: 'Split shared course materials' },
      { command: 'studysesh', symbol: '☕', description: 'Log study session costs' },
      { command: 'gradtrip', symbol: '🎉', description: 'Graduation trip fund' },
      { command: 'semester', symbol: '🗂️', description: 'Archive expenses and start fresh' },
      { command: 'broke', symbol: '💀', description: "Who's the brokest this month?" },
      { command: 'project', symbol: '📋', description: 'Group project expense tracker' },
      { command: 'library', symbol: '🏛️', description: 'Shared resource list (who has what)' }
    ],
    overviewCards: ['sharedCosts', 'funds', 'studyPlan', 'activity', 'recentExpenses']
  },
  workcrew: {
    key: 'workcrew',
    name: 'WorkCrew',
    emoji: '💼',
    symbol: '▣',
    tagline: 'Keep it clean, keep it fair. No awkward Slack messages.',
    audience: 'work team / office',
    personality: 'professional, efficient, low-drama',
    tone: { label: 'professional', sample: 'Action items without the meeting fog.' },
    memberLabel: 'team',
    houseLabel: 'the office',
    color: '#185FA5',
    aliases: ['colleagues', 'work', 'office', 'team', 'coworkers', 'colleague'],
    primaryCommands: ['corrections', 'confirm', 'reject', 'sundayplan', 'fundme', 'chipin', 'funds', 'activity'],
    plannedCommands: [
      { command: 'teamlunch', symbol: '🥗', description: 'Log and split a team lunch' },
      { command: 'offsite', symbol: '🧭', description: 'Team offsite budget tracker' },
      { command: 'reimburse', symbol: '💼', description: 'Mark expense as company-reimbursable' },
      { command: 'receipt', symbol: '🧾', description: 'Log receipt with category for expense reports' },
      { command: 'teamfund', symbol: '🎊', description: 'Team celebration fund' },
      { command: 'report', symbol: '📄', description: 'Generate expense report CSV' }
    ],
    overviewCards: ['corrections', 'actions', 'funds', 'weeklyPlan', 'activity']
  },
  wandercrew: {
    key: 'wandercrew',
    name: 'WanderCrew',
    emoji: '✈️',
    symbol: '⌁',
    tagline: 'Split the costs, share the memories. We made it.',
    audience: 'travel groups',
    personality: 'adventurous, global, energetic',
    tone: { label: 'travel', sample: 'The mission board, but friendlier.' },
    memberLabel: 'crew',
    houseLabel: 'the trip',
    color: '#E24B4A',
    aliases: ['crew', 'travel', 'project', 'trip', 'mission'],
    primaryCommands: ['sundayplan', 'fundme', 'chipin', 'funds', 'tab', 'ding', 'corrections'],
    plannedCommands: [
      { command: 'trip', symbol: '🗺️', description: 'Create a named trip expense group' },
      { command: 'legs', symbol: '🧳', description: 'View expenses by trip leg' },
      { command: 'currency', symbol: '💱', description: 'Switch active currency mid-trip' },
      { command: 'convert', symbol: '🔁', description: 'Live currency conversion' },
      { command: 'packing', symbol: '🎒', description: 'Shared packing list — who brings what' },
      { command: 'itinerary', symbol: '🗺️', description: 'View trip plan and budget vs actual' },
      { command: 'postcard', symbol: '📮', description: 'Send group trip summary' }
    ],
    overviewCards: ['tripPlan', 'sharedCosts', 'funds', 'corrections', 'activity']
  },
  pawpack: {
    key: 'pawpack',
    name: 'PawPack',
    emoji: '🐾',
    symbol: '❋',
    tagline: 'Every paw print, fairly split. Our baby deserves the best.',
    audience: 'pet co-owners',
    personality: 'warm, caring, pet-focused',
    tone: { label: 'care', sample: 'Tiny paws, big receipts.' },
    memberLabel: 'the pack',
    houseLabel: 'our baby',
    color: '#BA7517',
    aliases: ['pet', 'pets', 'animal', 'dog', 'cat', 'pack'],
    primaryCommands: ['split', 'balance', 'settle', 'fundme', 'chipin', 'funds', 'chore', 'chores'],
    plannedCommands: [
      { command: 'vet', symbol: '🏥', description: 'Log a vet visit expense' },
      { command: 'petfood', symbol: '🥫', description: 'Track recurring food and supply costs' },
      { command: 'walk', symbol: '🦮', description: 'Log dog walking or sitting costs' },
      { command: 'petfund', symbol: '🐾', description: 'Emergency vet fund' },
      { command: 'care', symbol: '🧡', description: "Who's done what for the pet this week" }
    ],
    overviewCards: ['petFund', 'careTasks', 'petExpenses', 'balances', 'activity']
  }
};

const ALIASES = Object.fromEntries(
  Object.values(MODE_DEFINITIONS).flatMap((mode) => [mode.key, mode.name, ...(mode.aliases || [])].map((alias) => [normalizeToken(alias), mode.key]))
);

function normalizeToken(value) {
  return String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function normalizeMode(value) {
  return ALIASES[normalizeToken(value)] || DEFAULT_MODE;
}

function modeDefinition(value) {
  return MODE_DEFINITIONS[normalizeMode(value)];
}

function modeNames() {
  return Object.values(MODE_DEFINITIONS).map(({ key, name, emoji, tagline }) => ({ key, name, emoji, tagline, label: `${emoji} ${name}` }));
}

function modeBadge(value) {
  const mode = modeDefinition(value);
  return `${mode.emoji} ${mode.name}`;
}

function commandsForMode(value) {
  return modeDefinition(value).primaryCommands.map((command) => `/${command}`);
}

function isPrimaryModeCommand(mode, command) {
  const normalizedCommand = String(command || '').trim().replace(/^\//, '').toLowerCase();
  return modeDefinition(mode).primaryCommands.includes(normalizedCommand);
}

module.exports = { DEFAULT_MODE, MODE_DEFINITIONS, normalizeMode, modeDefinition, modeNames, modeBadge, commandsForMode, isPrimaryModeCommand };
