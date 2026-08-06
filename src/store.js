const fs = require('fs');
const { calculateBalances } = require('./balances');
const { cleanName, createExpense, uniqueNames } = require('./expenses');
const { normalizeLocale } = require('./i18n');

const now = () => new Date().toISOString();
const makeId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const defaultSettings = (houseName = 'My Crib') => ({ houseName, currency: 'USD', timezone: 'UTC', notifications: true, weeklyDigest: true, quietHours: '', defaultLocale: 'en' });

function createStore(dataFile) {
  const state = { expenses: {}, chores: {}, members: {}, memberProfiles: {}, groceries: {}, activity: {}, settings: {}, processedUpdates: {}, userPreferences: {} };
  if (fs.existsSync(dataFile)) {
    try { Object.assign(state, JSON.parse(fs.readFileSync(dataFile, 'utf8'))); }
    catch (error) { console.error(`Could not read ${dataFile}; starting with empty data.`, error); }
  }
  for (const key of ['expenses', 'chores', 'members', 'memberProfiles', 'groceries', 'activity', 'settings', 'processedUpdates', 'userPreferences']) state[key] ||= {};

  function save() {
    const temporaryFile = `${dataFile}.tmp`;
    fs.writeFileSync(temporaryFile, JSON.stringify(state, null, 2));
    fs.renameSync(temporaryFile, dataFile);
  }
  function list(bucket, chatId) { state[bucket][chatId] ||= []; return state[bucket][chatId]; }
  function settings(chatId, houseName) { state.settings[chatId] ||= defaultSettings(houseName); state.settings[chatId].defaultLocale = normalizeLocale(state.settings[chatId].defaultLocale); return state.settings[chatId]; }
  function userPreference(telegramId) { const key = String(telegramId); state.userPreferences[key] ||= {}; return state.userPreferences[key]; }
  function userLocale(telegramId) { return state.userPreferences[String(telegramId)]?.locale || null; }
  function setUserLocale(telegramId, locale) { const preference = userPreference(telegramId); preference.locale = normalizeLocale(locale); preference.updatedAt = now(); save(); return preference.locale; }
  function resolveLocale(chatId, telegramUser, options = {}) { const saved = userLocale(telegramUser?.id); const telegramLocale = telegramUser?.language_code ? normalizeLocale(telegramUser.language_code) : null; const houseLocale = settings(chatId).defaultLocale; return options.groupMessage ? houseLocale : saved || telegramLocale || houseLocale || 'en'; }
  function addActivity(chatId, type, message, actor, metadata = {}) {
    const event = { id: makeId('a'), type, message, actor: cleanName(actor), metadata, createdAt: now() };
    const events = list('activity', chatId); events.unshift(event); state.activity[chatId] = events.slice(0, 300); return event;
  }
  function registerMember(chatId, telegramUser, houseName) {
    if (!telegramUser?.id) return null;
    const profiles = list('memberProfiles', chatId);
    const telegramId = String(telegramUser.id);
    const displayName = cleanName(telegramUser.first_name || telegramUser.username || telegramId);
    let profile = profiles.find((item) => item.telegramId === telegramId);
    if (!profile) {
      profile = { id: makeId('m'), telegramId, displayName, username: telegramUser.username ? `@${telegramUser.username}` : '', role: profiles.length ? 'member' : 'owner', joinedAt: now(), active: true, awayUntil: null, dietaryPreferences: '', notificationFrequency: 'immediate', locale: userLocale(telegramId) };
      profiles.push(profile);
      addActivity(chatId, 'member.joined', `${displayName} joined the crib`, displayName, { memberId: profile.id });
    } else {
      profile.displayName = displayName; profile.username = telegramUser.username ? `@${telegramUser.username}` : profile.username; profile.active = true; profile.locale = userLocale(telegramId); profile.updatedAt = now();
    }
    state.members[chatId] = uniqueNames([...(state.members[chatId] || []), displayName]);
    settings(chatId, houseName);
    save(); return profile;
  }
  function isMember(chatId, telegramId) { return list('memberProfiles', chatId).some((item) => item.telegramId === String(telegramId) && item.active); }
  function memberByTelegramId(chatId, telegramId) { return list('memberProfiles', chatId).find((item) => item.telegramId === String(telegramId)); }
  function housesForTelegramId(telegramId) {
    const expectedId = String(telegramId);
    return Object.entries(state.memberProfiles)
      .filter(([chatId, profiles]) => String(chatId).startsWith('-') && Array.isArray(profiles) && profiles.some((item) => item.telegramId === expectedId && item.active))
      .map(([chatId, profiles]) => {
        const member = profiles.find((item) => item.telegramId === expectedId && item.active);
        const houseSettings = state.settings[chatId] || defaultSettings();
        return { chatId, houseName: houseSettings.houseName || 'My Crib', role: member.role || 'member' };
      })
      .sort((a, b) => a.houseName.localeCompare(b.houseName));
  }
  function activeChatId(telegramId) {
    const preference = state.userPreferences[String(telegramId)];
    if (!preference?.activeChatId) return null;
    const chatId = String(preference.activeChatId);
    if (housesForTelegramId(telegramId).some((house) => house.chatId === chatId)) return chatId;
    delete preference.activeChatId; preference.updatedAt = now(); save(); return null;
  }
  function setActiveChatId(telegramId, chatId) {
    const normalizedChatId = String(chatId || '');
    if (!housesForTelegramId(telegramId).some((house) => house.chatId === normalizedChatId)) throw Object.assign(new Error('You are not an active member of this crib.'), { statusCode: 403 });
    const preference = userPreference(telegramId); preference.activeChatId = normalizedChatId; preference.updatedAt = now(); save(); return normalizedChatId;
  }
  function clearActiveChatId(telegramId) {
    const preference = state.userPreferences[String(telegramId)];
    if (!preference?.activeChatId) return false;
    delete preference.activeChatId; preference.updatedAt = now(); save(); return true;
  }
  function memberNames(chatId) { return uniqueNames([...(state.members[chatId] || []), ...list('memberProfiles', chatId).filter((m) => m.active).map((m) => m.displayName)]); }
  function addExpense(chatId, details, actor, source = 'telegram') {
    const expense = createExpense({ ...details, addedBy: actor, participants: details.participants?.length ? details.participants : memberNames(chatId), source });
    list('expenses', chatId).push(expense); state.members[chatId] = uniqueNames([...memberNames(chatId), actor, expense.paidBy]);
    addActivity(chatId, 'expense.created', `${actor} added ${expense.description}`, actor, { expenseId: expense.id, amountCents: expense.amountCents }); save(); return expense;
  }
  function addChore(chatId, details, actor) {
    const chore = { id: makeId('c'), task: String(details.task).trim().slice(0, 160), description: String(details.description || '').trim().slice(0, 500), assignedTo: details.assignedTo || null, addedBy: actor, dueDate: details.dueDate || null, recurrence: details.recurrence || 'one-time', priority: details.priority || 'normal', done: false, createdAt: now(), updatedAt: now() };
    list('chores', chatId).push(chore); addActivity(chatId, 'chore.created', `${actor} added “${chore.task}”`, actor, { choreId: chore.id }); save(); return chore;
  }
  function findChore(chatId, identifier) { const chores = list('chores', chatId); const index = Number(identifier); return chores.find((c) => c.id === identifier) || (Number.isInteger(index) && index > 0 ? chores[index - 1] : null); }
  function updateChore(chatId, identifier, patch, actor) {
    const chore = findChore(chatId, identifier); if (!chore) return null;
    Object.assign(chore, patch, { updatedAt: now() });
    if (patch.done === true) { chore.doneBy = actor; chore.completedAt = now(); }
    addActivity(chatId, patch.done === true ? 'chore.completed' : 'chore.updated', `${actor} updated “${chore.task}”`, actor, { choreId: chore.id }); save(); return chore;
  }
  function deleteChore(chatId, identifier, actor) { const chores = list('chores', chatId); const chore = findChore(chatId, identifier); if (!chore) return false; state.chores[chatId] = chores.filter((c) => c.id !== chore.id); addActivity(chatId, 'chore.deleted', `${actor} deleted “${chore.task}”`, actor); save(); return true; }
  function addGrocery(chatId, details, actor) {
    const item = { id: makeId('g'), name: String(details.name || '').trim().slice(0, 120), quantity: String(details.quantity || '1').trim().slice(0, 30), category: String(details.category || 'Other').trim().slice(0, 40), brand: String(details.brand || '').trim().slice(0, 60), dietaryNote: String(details.dietaryNote || '').trim().slice(0, 120), priority: details.priority === 'urgent' ? 'urgent' : 'normal', addedBy: actor, purchased: false, createdAt: now(), updatedAt: now() };
    if (!item.name) throw Object.assign(new Error('Grocery item name is required.'), { statusCode: 400 });
    list('groceries', chatId).push(item); addActivity(chatId, 'grocery.added', `${actor} added ${item.name}`, actor, { groceryId: item.id }); save(); return item;
  }
  function updateGrocery(chatId, identifier, patch, actor) {
    const items = list('groceries', chatId); const index = Number(identifier); const item = items.find((g) => g.id === identifier) || (Number.isInteger(index) && index > 0 ? items[index - 1] : null); if (!item) return null;
    Object.assign(item, patch, { updatedAt: now() });
    if (patch.purchased === true) { item.purchasedBy = actor; item.purchasedAt = now(); }
    if (patch.purchased === false) { delete item.purchasedBy; delete item.purchasedAt; }
    addActivity(chatId, patch.purchased ? 'grocery.purchased' : 'grocery.updated', `${actor} updated ${item.name}`, actor, { groceryId: item.id }); save(); return item;
  }
  function deleteGrocery(chatId, identifier, actor) { const items = list('groceries', chatId); const item = items.find((g) => g.id === identifier); if (!item) return false; state.groceries[chatId] = items.filter((g) => g.id !== item.id); addActivity(chatId, 'grocery.deleted', `${actor} removed ${item.name}`, actor); save(); return true; }
  function updateSettings(chatId, patch, actor) {
    const allowed = ['houseName', 'currency', 'timezone', 'notifications', 'weeklyDigest', 'quietHours', 'defaultLocale']; const current = settings(chatId);
    if (patch.currency !== undefined) {
      const currency = String(patch.currency).trim().toUpperCase();
      try { new Intl.NumberFormat('en', { style: 'currency', currency }).format(1); } catch { throw Object.assign(new Error('Choose a valid three-letter currency code.'), { statusCode: 400 }); }
      patch = { ...patch, currency };
    }
    if (patch.defaultLocale !== undefined) patch = { ...patch, defaultLocale: normalizeLocale(patch.defaultLocale) };
    for (const key of allowed) if (patch[key] !== undefined) current[key] = typeof patch[key] === 'string' ? patch[key].trim().slice(0, 80) : Boolean(patch[key]);
    current.updatedAt = now(); addActivity(chatId, 'settings.updated', `${actor} updated house settings`, actor); save(); return current;
  }
  function dashboard(chatId, viewer) {
    const expenses = list('expenses', chatId); const chores = list('chores', chatId); const groceries = list('groceries', chatId); const members = list('memberProfiles', chatId); const balances = calculateBalances(expenses, memberNames(chatId));
    const locale = viewer?.telegramId ? resolveLocale(chatId, { id: viewer.telegramId, language_code: viewer.telegramLanguageCode }) : settings(chatId).defaultLocale;
    return { expenses, chores, groceries, members, activity: list('activity', chatId), settings: settings(chatId), balances, viewer: viewer ? { ...viewer, locale } : null, locale };
  }
  function markUpdate(updateId) { if (updateId == null) return true; if (state.processedUpdates[updateId]) return false; state.processedUpdates[updateId] = now(); const ids = Object.keys(state.processedUpdates); if (ids.length > 1000) ids.slice(0, ids.length - 1000).forEach((id) => delete state.processedUpdates[id]); save(); return true; }
  function clear(chatId) { for (const key of ['expenses', 'chores', 'members', 'memberProfiles', 'groceries', 'activity', 'settings']) state[key][chatId] = key === 'settings' ? defaultSettings() : []; save(); }
  return { state, save, registerMember, isMember, memberByTelegramId, housesForTelegramId, activeChatId, setActiveChatId, clearActiveChatId, memberNames, addExpense, addChore, findChore, updateChore, deleteChore, addGrocery, updateGrocery, deleteGrocery, updateSettings, dashboard, addActivity, markUpdate, clear, settings, userLocale, setUserLocale, resolveLocale };
}

module.exports = { createStore, defaultSettings };
