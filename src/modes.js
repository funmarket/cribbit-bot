const DEFAULT_MODE = 'roomies';

const MODE_DEFINITIONS = {
  roomies: {
    key: 'roomies',
    name: 'Roomies',
    audience: 'roommates / flatshare',
    personality: 'practical, direct, calm',
    tone: { label: 'practical', sample: 'Clean, clear, and roommate-proof.' },
    aliases: ['roommate', 'roommates', 'flatshare', 'flatmates'],
    primaryCommands: ['split', 'balance', 'settle', 'chore', 'chores', 'grocery', 'groceries', 'houserules', 'quiethours', 'tab'],
    overviewCards: ['balances', 'chores', 'groceries', 'houseRules', 'quietHours']
  },
  cubs: {
    key: 'cubs',
    name: 'Cubs',
    audience: 'friends / social house',
    personality: 'playful, party-energy, teasing but helpful',
    tone: { label: 'playful', sample: 'Fun first, chaos contained.' },
    aliases: ['friends', 'party', 'social'],
    primaryCommands: ['party', 'ding', 'tab', 'fundme', 'chipin', 'funds', 'dinner'],
    overviewCards: ['partyMode', 'tab', 'ding', 'funds', 'activity']
  },
  nest: {
    key: 'nest',
    name: 'Nest',
    audience: 'family / household',
    personality: 'warm, organized, gentle',
    tone: { label: 'warm', sample: 'Soft landing, organized home.' },
    aliases: ['family', 'home', 'household'],
    primaryCommands: ['dinner', 'pickup', 'sundayplan', 'grocery', 'groceries', 'chore', 'chores', 'quiethours'],
    overviewCards: ['dinner', 'pickup', 'groceries', 'chores', 'quietHours', 'weeklyPlan']
  },
  twinsoul: {
    key: 'twinsoul',
    name: 'TwinSoul',
    audience: 'couples',
    personality: 'intimate, soft, thoughtful',
    tone: { label: 'soft', sample: 'Tiny rituals for two.' },
    aliases: ['couple', 'couples', 'partner', 'partners'],
    primaryCommands: ['date', 'ours', 'mood', 'dinner', 'split', 'balance'],
    overviewCards: ['date', 'mood', 'ours', 'expenses', 'dinner']
  },
  colleagues: {
    key: 'colleagues',
    name: 'Colleagues',
    audience: 'work team / office',
    personality: 'clear, professional, action-oriented',
    tone: { label: 'professional', sample: 'Action items without the meeting fog.' },
    aliases: ['work', 'office', 'team', 'coworkers', 'colleague'],
    primaryCommands: ['corrections', 'confirm', 'reject', 'sundayplan', 'fundme', 'chipin', 'funds', 'activity'],
    overviewCards: ['corrections', 'actions', 'funds', 'weeklyPlan', 'activity']
  },
  buddies: {
    key: 'buddies',
    name: 'Buddies',
    audience: 'sports / events / hobby partners',
    personality: 'energetic, casual, team-focused',
    tone: { label: 'casual', sample: 'Team plan, low friction.' },
    aliases: ['sports', 'events', 'hobby', 'mates'],
    primaryCommands: ['ding', 'sundayplan', 'tab', 'fundme', 'chipin', 'funds', 'party'],
    overviewCards: ['eventPlan', 'tab', 'ding', 'funds', 'activity']
  },
  crew: {
    key: 'crew',
    name: 'Crew',
    audience: 'travel / project group',
    personality: 'mission-style, coordinated, practical',
    tone: { label: 'coordinated', sample: 'The mission board, but friendlier.' },
    aliases: ['travel', 'project', 'trip', 'mission'],
    primaryCommands: ['sundayplan', 'fundme', 'chipin', 'funds', 'tab', 'ding', 'corrections'],
    overviewCards: ['missionPlan', 'sharedCosts', 'funds', 'corrections', 'activity']
  },
  guild: {
    key: 'guild',
    name: 'Guild',
    audience: 'gaming / online community',
    personality: 'playful, quest-like, achievement-flavored',
    tone: { label: 'quest', sample: 'Quests, tabs, and party buffs.' },
    aliases: ['gaming', 'game', 'community', 'quest'],
    primaryCommands: ['ding', 'party', 'tab', 'mood', 'fundme', 'chipin', 'funds'],
    overviewCards: ['guildStatus', 'quests', 'tab', 'party', 'mood', 'funds']
  }
};

const ALIASES = Object.fromEntries(Object.values(MODE_DEFINITIONS).flatMap((mode) => [mode.key, mode.name, ...(mode.aliases || [])].map((alias) => [normalizeToken(alias), mode.key])));

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
  return Object.values(MODE_DEFINITIONS).map(({ key, name }) => ({ key, name }));
}

function commandsForMode(value) {
  return modeDefinition(value).primaryCommands.map((command) => `/${command}`);
}

function isPrimaryModeCommand(mode, command) {
  const normalizedCommand = String(command || '').trim().replace(/^\//, '').toLowerCase();
  return modeDefinition(mode).primaryCommands.includes(normalizedCommand);
}

module.exports = { DEFAULT_MODE, MODE_DEFINITIONS, normalizeMode, modeDefinition, modeNames, commandsForMode, isPrimaryModeCommand };
