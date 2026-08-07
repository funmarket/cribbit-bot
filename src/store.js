const fs = require('fs');
const { calculateBalances, simplifyDebts } = require('./balances');
const { cleanName, createExpense, uniqueNames } = require('./expenses');
const { normalizeLocale } = require('./i18n');
const { DEFAULT_MODE, normalizeMode } = require('./modes');
const { dashboardModePicker } = require('./mode-picker');

const now = () => new Date().toISOString();
const makeId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const defaultSettings = (houseName = 'My Crib') => ({ houseName, currency: 'USD', timezone: 'UTC', notifications: true, weeklyDigest: true, quietHours: '', houseRules: '', partyMode: false, defaultLocale: 'en', cribMode: DEFAULT_MODE });

function createJsonStore(dataFile) {
  const state = { expenses: {}, expenseClaims: {}, chores: {}, members: {}, memberProfiles: {}, groceries: {}, funds: {}, wishlists: {}, requests: {}, notifications: {}, settlementRequests: {}, corrections: {}, notes: {}, plans: {}, activity: {}, settings: {}, processedUpdates: {}, userPreferences: {} };
  if (fs.existsSync(dataFile)) {
    try { Object.assign(state, JSON.parse(fs.readFileSync(dataFile, 'utf8'))); }
    catch (error) { console.error(`Could not read ${dataFile}; starting with empty data.`, error); }
  }
  for (const key of ['expenses', 'expenseClaims', 'chores', 'members', 'memberProfiles', 'groceries', 'funds', 'wishlists', 'requests', 'notifications', 'settlementRequests', 'corrections', 'notes', 'plans', 'activity', 'settings', 'processedUpdates', 'userPreferences']) state[key] ||= {};

  function save() {
    const temporaryFile = `${dataFile}.tmp`;
    fs.writeFileSync(temporaryFile, JSON.stringify(state, null, 2));
    fs.renameSync(temporaryFile, dataFile);
  }
  function list(bucket, chatId) { state[bucket][chatId] ||= []; return state[bucket][chatId]; }
  function settings(chatId, houseName) {
    state.settings[chatId] ||= defaultSettings(houseName);
    state.settings[chatId].defaultLocale = normalizeLocale(state.settings[chatId].defaultLocale);
    state.settings[chatId].cribMode = normalizeMode(state.settings[chatId].cribMode);
    return state.settings[chatId];
  }
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
  function listExpenseClaims(chatId) { return list('expenseClaims', chatId); }
  function addExpenseClaim(chatId, details, actor) {
    const description = String(details.description || '').trim().slice(0, 160);
    const amountCents = Number(details.amountCents);
    if (!description || !Number.isFinite(amountCents) || amountCents <= 0) throw Object.assign(new Error('Expense claim details are required.'), { statusCode: 400 });
    const claim = {
      id: makeId('x'), description, amountCents: Math.round(amountCents),
      paidBy: String(details.paidBy || actor).trim().slice(0, 80),
      category: String(details.category || 'Other').trim().slice(0, 40),
      notes: String(details.notes || '').trim().slice(0, 500),
      receiptText: String(details.receiptText || '').trim().slice(0, 12000),
      receiptConfidence: Number.isFinite(Number(details.receiptConfidence)) ? Number(details.receiptConfidence) : null,
      receiptItems: Array.isArray(details.receiptItems) ? details.receiptItems.slice(0, 100) : [],
      // The current JSON-backed deployment has no object store. Keep a bounded
      // data URL so a submitted receipt remains reviewable after reload.
      receiptUrl: String(details.receiptUrl || '').trim().slice(0, 1500000),
      status: 'pending', submittedBy: cleanName(actor), submittedById: details.submittedById || null,
      submittedAt: now(), reviewedBy: null, reviewedById: null, reviewedAt: null,
      reviewComment: '', rejectionComment: '', approvedExpenseId: null
    };
    list('expenseClaims', chatId).unshift(claim); addActivity(chatId, 'expense.claim.submitted', `${actor} submitted a payment claim`, actor, { claimId: claim.id }); save(); return claim;
  }
  function reviewExpenseClaim(chatId, identifier, verdict, actor, reviewer, comment = '') {
    const claims = list('expenseClaims', chatId);
    const claim = claims.find((item) => item.id === identifier);
    if (!claim || claim.status !== 'pending') return null;
    if (!['approved', 'rejected'].includes(verdict)) throw Object.assign(new Error('Invalid payment claim decision.'), { statusCode: 400 });
    if (!reviewer || !['owner', 'admin'].includes(reviewer.role)) throw Object.assign(new Error('Only a house owner or admin can review payment claims.'), { statusCode: 403 });
    if ((reviewer.id && claim.submittedById && reviewer.id === claim.submittedById) || cleanName(actor).toLowerCase() === claim.submittedBy.toLowerCase()) throw Object.assign(new Error('You cannot review your own payment claim.'), { statusCode: 403 });
    claim.status = verdict;
    claim.reviewedBy = cleanName(actor);
    claim.reviewedById = reviewer.id || null;
    claim.reviewedAt = now();
    claim.reviewComment = String(comment || '').trim().slice(0, 500);
    if (verdict === 'approved') {
      const expense = addExpense(chatId, {
        amountCents: claim.amountCents,
        description: claim.description,
        paidBy: claim.paidBy,
        category: claim.category,
        notes: claim.notes,
        participants: memberNames(chatId),
      }, claim.submittedBy, 'payment-claim');
      expense.approvalStatus = 'approved';
      expense.receiptClaimId = claim.id;
      expense.receiptText = claim.receiptText;
      expense.receiptItems = claim.receiptItems;
      claim.approvedExpenseId = expense.id;
      addActivity(chatId, 'expense.claim.approved', `${actor} approved a payment claim`, actor, { claimId: claim.id });
    } else {
      claim.rejectionComment = claim.reviewComment;
      addActivity(chatId, 'expense.claim.rejected', `${actor} rejected a payment claim`, actor, { claimId: claim.id });
    }
    save();
    return claim;
  }
  function findPlan(chatId, identifier) { const plans = list('plans', chatId); const index = Number(identifier); return plans.find((plan) => plan.id === identifier) || (Number.isInteger(index) && index > 0 ? plans[index - 1] : null); }
  function normalizeBringItem(item, index) { return { id: item.id || makeId('pi'), name: String(item.name || item).trim().slice(0, 120), quantity: String(item.quantity || '').trim().slice(0, 30), notes: String(item.notes || '').trim().slice(0, 160), claimedBy: item.claimedBy || null, claimedById: item.claimedById || null, claimedAt: item.claimedAt || null, status: item.status || (item.claimedBy ? 'claimed' : 'open') }; }
  function planParticipant(member) { return { memberId: member?.id || null, telegramId: member?.telegramId || null, displayName: cleanName(member?.displayName || 'Unknown'), joinedAt: now(), status: 'joined' }; }
  function samePlanMember(participant, member, actor) { if (member?.id && participant.memberId) return participant.memberId === member.id; if (member?.telegramId && participant.telegramId) return String(participant.telegramId) === String(member.telegramId); return participant.displayName.toLowerCase() === cleanName(actor).toLowerCase(); }
  function canManagePlan(plan, member, actor) { return ['owner', 'admin'].includes(member?.role) || (member?.id && plan.createdById === member.id) || (!plan.createdById && plan.createdBy.toLowerCase() === cleanName(actor).toLowerCase()); }
  function requirePlanManager(plan, member, actor) { if (!canManagePlan(plan, member, actor)) throw Object.assign(new Error('Only the plan creator or a house admin can manage this plan.'), { statusCode: 403 }); }
  function addPlan(chatId, details, actor, actorProfile) {
    const title = String(details.title || '').trim().slice(0, 140); if (!title) throw Object.assign(new Error('Plan title is required.'), { statusCode: 400 });
    const startsAt = details.startsAt ? new Date(details.startsAt) : null; if (!startsAt || Number.isNaN(startsAt.getTime())) throw Object.assign(new Error('Choose a valid plan date.'), { statusCode: 400 });
    const costMode = details.costMode === 'shared' ? 'shared' : 'free'; const budget = details.estimatedBudgetCents == null || details.estimatedBudgetCents === '' ? null : Number(details.estimatedBudgetCents);
    if (budget !== null && (!Number.isFinite(budget) || budget < 0)) throw Object.assign(new Error('Estimated budget must be zero or more.'), { statusCode: 400 });
    const creator = actorProfile || memberByTelegramId(chatId, details.createdByTelegramId) || list('memberProfiles', chatId).find((m) => m.displayName.toLowerCase() === cleanName(actor).toLowerCase());
    const plan = { id: makeId('p'), title, type: String(details.type || 'Custom').trim().slice(0, 60), customType: details.customType ? String(details.customType).trim().slice(0, 60) : null, description: String(details.description || '').trim().slice(0, 500), location: String(details.location || '').trim().slice(0, 120), startsAt: startsAt.toISOString(), endsAt: details.endsAt || null, createdBy: cleanName(actor), createdById: creator?.id || null, costMode, estimatedBudgetCents: budget, status: 'active', participants: [planParticipant(creator || { displayName: actor })], bringItems: (details.bringItems || []).map(normalizeBringItem).filter((item) => item.name), createdAt: now(), updatedAt: now() };
    list('plans', chatId).push(plan); addActivity(chatId, 'plan.created', `${actor} created “${plan.title}”`, actor, { planId: plan.id }); save(); return plan;
  }
  function joinPlan(chatId, identifier, actor, actorProfile) {
    const plan = findPlan(chatId, identifier); if (!plan || plan.status !== 'active') return null; const member = actorProfile || list('memberProfiles', chatId).find((m) => m.displayName.toLowerCase() === cleanName(actor).toLowerCase()); const participant = planParticipant(member || { displayName: actor });
    const existing = plan.participants.find((p) => (p.memberId && p.memberId === participant.memberId) || p.displayName.toLowerCase() === participant.displayName.toLowerCase());
    if (existing) { existing.status = 'joined'; existing.displayName = participant.displayName; plan.updatedAt = now(); save(); return { plan, participant: existing, joined: false }; }
    plan.participants.push(participant); plan.updatedAt = now(); addActivity(chatId, 'plan.joined', `${participant.displayName} joined “${plan.title}”`, participant.displayName, { planId: plan.id }); save(); return { plan, participant, joined: true };
  }
  function leavePlan(chatId, identifier, actor, actorProfile) {
    const plan = findPlan(chatId, identifier); if (!plan || plan.status !== 'active') return null; const name = cleanName(actor); const participant = plan.participants.find((p) => samePlanMember(p, actorProfile, actor)); if (!participant) return { plan, left: false };
    participant.status = 'left'; plan.updatedAt = now(); addActivity(chatId, 'plan.left', `${name} left “${plan.title}”`, name, { planId: plan.id }); save(); return { plan, left: true };
  }
  function addPlanItem(chatId, identifier, details, actor, actorProfile) {
    const plan = findPlan(chatId, identifier); if (!plan || plan.status !== 'active') return null; requirePlanManager(plan, actorProfile, actor); const item = normalizeBringItem(details, plan.bringItems.length); if (!item.name) throw Object.assign(new Error('Bring item name is required.'), { statusCode: 400 });
    plan.bringItems.push(item); plan.updatedAt = now(); addActivity(chatId, 'plan.item.added', `${actor} added ${item.name} to “${plan.title}”`, actor, { planId: plan.id, itemId: item.id }); save(); return { plan, item };
  }
  function claimPlanItem(chatId, identifier, itemId, actor, actorProfile, claimed = true) {
    const plan = findPlan(chatId, identifier); if (!plan || plan.status !== 'active') return null; const item = plan.bringItems.find((entry) => entry.id === itemId || entry.name.toLowerCase() === String(itemId).toLowerCase()); if (!item) return null; const name = cleanName(actor); const member = actorProfile || list('memberProfiles', chatId).find((m) => m.displayName.toLowerCase() === name.toLowerCase());
    if (claimed) { if (item.claimedById && item.claimedById !== member?.id) throw Object.assign(new Error('This item is already claimed by another member.'), { statusCode: 409 }); item.claimedBy = name; item.claimedById = member?.id || null; item.claimedAt = now(); item.status = 'claimed'; } else { const ownsClaim = (member?.id && item.claimedById === member.id) || (!item.claimedById && item.claimedBy?.toLowerCase() === name.toLowerCase()); if (!ownsClaim && !canManagePlan(plan, member, actor)) throw Object.assign(new Error('Only the claimant or a plan manager can unclaim this item.'), { statusCode: 403 }); item.claimedBy = null; item.claimedById = null; item.claimedAt = null; item.status = 'open'; }
    plan.updatedAt = now(); addActivity(chatId, claimed ? 'plan.item.claimed' : 'plan.item.unclaimed', `${name} ${claimed ? 'claimed' : 'unclaimed'} “${item.name}”`, name, { planId: plan.id, itemId: item.id }); save(); return { plan, item };
  }
  function updatePlanStatus(chatId, identifier, status, actor, actorProfile) {
    const plan = findPlan(chatId, identifier); if (!plan) return null; if (!['active', 'completed', 'cancelled'].includes(status)) throw Object.assign(new Error('Invalid plan status.'), { statusCode: 400 });
    requirePlanManager(plan, actorProfile, actor); plan.status = status; plan.updatedAt = now(); addActivity(chatId, `plan.${status}`, `${actor} marked “${plan.title}” ${status}`, actor, { planId: plan.id }); save(); return plan;
  }
  function addPlanExpense(chatId, identifier, details, actor, source = 'telegram', actorProfile) {
    const plan = findPlan(chatId, identifier); if (!plan || plan.status !== 'active') return null; if (plan.costMode !== 'shared') throw Object.assign(new Error('Plan expenses require Shared Cost mode.'), { statusCode: 400 });
    if (!plan.participants.some((participant) => participant.status === 'joined' && samePlanMember(participant, actorProfile, actor))) throw Object.assign(new Error('Join this plan before adding a plan expense.'), { statusCode: 403 });
    const participants = uniqueNames(plan.participants.filter((p) => p.status === 'joined').map((p) => p.displayName)); if (!participants.length) throw Object.assign(new Error('At least one joined participant is required.'), { statusCode: 400 });
    const expense = addExpense(chatId, { ...details, planId: plan.id, participants }, actor, source); addActivity(chatId, 'plan.expense.added', `${actor} added ${expense.description} to “${plan.title}”`, actor, { planId: plan.id, expenseId: expense.id }); save(); return expense;
  }
  function activeExpenses(chatId) { return list('expenses', chatId).filter((expense) => !expense.deletedAt && expense.status !== 'void'); }
  function lastExpense(chatId) { return activeExpenses(chatId).at(-1) || null; }
  function findExpense(chatId, identifier) {
    const expenses = activeExpenses(chatId); const index = Number(identifier);
    return expenses.find((expense) => expense.id === identifier) || (Number.isInteger(index) && index > 0 ? expenses[index - 1] : null);
  }
  function voidExpense(chatId, identifier, actor, reason = 'voided') {
    const expense = identifier ? findExpense(chatId, identifier) : lastExpense(chatId); if (!expense) return null;
    expense.status = 'void'; expense.deletedAt = now(); expense.voidedBy = actor; expense.voidReason = reason; expense.updatedAt = now();
    addActivity(chatId, 'expense.voided', `${actor} voided ${expense.description}`, actor, { expenseId: expense.id }); save(); return expense;
  }
  function addChore(chatId, details, actor) {
    const chore = { id: makeId('c'), task: String(details.task).trim().slice(0, 160), description: String(details.description || '').trim().slice(0, 500), assignedTo: details.assignedTo || null, addedBy: actor, dueDate: details.dueDate || null, recurrence: details.recurrence || 'one-time', priority: details.priority || 'normal', done: false, status: 'open', createdAt: now(), updatedAt: now() };
    list('chores', chatId).push(chore); addActivity(chatId, 'chore.created', `${actor} added “${chore.task}”`, actor, { choreId: chore.id }); save(); return chore;
  }
  function findChore(chatId, identifier) { const chores = list('chores', chatId); const index = Number(identifier); return chores.find((c) => c.id === identifier) || (Number.isInteger(index) && index > 0 ? chores[index - 1] : null); }
  function updateChore(chatId, identifier, patch, actor) {
    const chore = findChore(chatId, identifier); if (!chore) return null;
    Object.assign(chore, patch, { updatedAt: now() });
    if (patch.done === true) { chore.doneBy = actor; chore.completedAt = now(); chore.status = 'verified_completed'; }
    if (patch.done === false) chore.status = 'open';
    addActivity(chatId, patch.done === true ? 'chore.completed' : 'chore.updated', `${actor} updated “${chore.task}”`, actor, { choreId: chore.id }); save(); return chore;
  }
  function choreActorMatches(chore, profile, actor) {
    return (profile?.id && chore.submittedById === profile.id) || (!chore.submittedById && cleanName(chore.submittedBy || chore.assignedTo).toLowerCase() === cleanName(actor).toLowerCase());
  }
  function submitChoreForReview(chatId, identifier, actor, profile, resubmission = false) {
    const chore = findChore(chatId, identifier); if (!chore) return null;
    const status = chore.status || (chore.done ? 'verified_completed' : 'open');
    if (!['open', 'needs_fixing'].includes(status)) throw Object.assign(new Error('Only open or needs-fixing chores can be submitted for review.'), { statusCode: 409 });
    if (status === 'needs_fixing' && !choreActorMatches(chore, profile, actor)) throw Object.assign(new Error('Only the roomie asked to fix this chore can resubmit it.'), { statusCode: 403 });
    chore.status = 'pending_review'; chore.done = false; chore.submittedBy = cleanName(actor); chore.submittedById = profile?.id || null; chore.submittedAt = now(); chore.reviewComment = ''; chore.updatedAt = now();
    addActivity(chatId, resubmission ? 'chore.review.resubmitted' : 'chore.review.submitted', `${actor} submitted “${chore.task}” for review`, actor, { choreId: chore.id }); save(); return chore;
  }
  function reviewChore(chatId, identifier, verdict, actor, reviewer, comment = '') {
    const chore = findChore(chatId, identifier); if (!chore || chore.status !== 'pending_review') return null;
    if (!reviewer || !['owner', 'admin'].includes(reviewer.role)) throw Object.assign(new Error('Only a house owner or admin can review chores.'), { statusCode: 403 });
    if (choreActorMatches(chore, reviewer, actor)) throw Object.assign(new Error('You cannot review your own chore submission.'), { statusCode: 403 });
    const reviewComment = String(comment || '').trim().slice(0, 500);
    if (verdict === 'needs_fixing' && !reviewComment) throw Object.assign(new Error('Needs Fixing requires feedback.'), { statusCode: 400 });
    if (!['approved', 'needs_fixing'].includes(verdict)) throw Object.assign(new Error('Invalid chore review decision.'), { statusCode: 400 });
    chore.status = verdict === 'approved' ? 'verified_completed' : 'needs_fixing'; chore.done = verdict === 'approved'; chore.reviewComment = reviewComment; chore.reviewedBy = cleanName(actor); chore.reviewedById = reviewer.id || null; chore.reviewedAt = now(); chore.updatedAt = now();
    addActivity(chatId, verdict === 'approved' ? 'chore.review.approved' : 'chore.review.needs_fixing', `${actor} ${verdict === 'approved' ? 'verified' : 'requested fixes for'} “${chore.task}”`, actor, { choreId: chore.id }); save(); return chore;
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
  function addFund(chatId, details, actor) {
    const title = String(details.title || '').trim().slice(0, 140); const target = Number(details.target);
    if (!title || !Number.isFinite(target) || target <= 0) throw Object.assign(new Error('Format: /fundme <goal> <target amount>'), { statusCode: 400 });
    const fund = { id: makeId('f'), title, targetCents: Math.round(target * 100), contributions: [], createdBy: actor, status: 'active', createdAt: now(), updatedAt: now() };
    list('funds', chatId).push(fund); addActivity(chatId, 'fund.created', `${actor} created fund “${fund.title}”`, actor, { fundId: fund.id }); save(); return fund;
  }
  function findFund(chatId, identifier) { const funds = list('funds', chatId); const index = Number(identifier); return funds.find((fund) => fund.id === identifier) || (Number.isInteger(index) && index > 0 ? funds[index - 1] : null); }
  function chipInFund(chatId, identifier, amount, actor) {
    const fund = findFund(chatId, identifier); const value = Number(amount);
    if (!fund || !Number.isFinite(value) || value <= 0) return null;
    const contribution = { id: makeId('fc'), amountCents: Math.round(value * 100), by: actor, createdAt: now() };
    fund.contributions.push(contribution); fund.updatedAt = now();
    addActivity(chatId, 'fund.contributed', `${actor} chipped in to “${fund.title}”`, actor, { fundId: fund.id, amountCents: contribution.amountCents }); save(); return fund;
  }
  function activeProfileByName(chatId, name) { return list('memberProfiles', chatId).find((member) => member.active && member.displayName.toLowerCase() === cleanName(name).toLowerCase()); }
  function addNotification(chatId, recipient, type, message, metadata = {}) {
    const item = { id: makeId('n'), recipientId: recipient?.id || null, recipient: recipient?.displayName || '', type, message: String(message).slice(0, 300), metadata, createdAt: now() };
    list('notifications', chatId).unshift(item); state.notifications[chatId] = list('notifications', chatId).slice(0, 300); return item;
  }
  function addWishlist(chatId, details, actor, profile) {
    const title = String(details.title || '').trim().slice(0, 140); if (!title) throw Object.assign(new Error('Wishlist title is required.'), { statusCode: 400 });
    const area = details.area === 'groceries' ? 'groceries' : 'expenses'; const targetCents = Number(details.targetCents || 0);
    if (!Number.isFinite(targetCents) || targetCents < 0) throw Object.assign(new Error('Wishlist goal must be zero or more.'), { statusCode: 400 });
    const wish = { id: makeId('w'), area, title, category: String(details.category || 'Custom').trim().slice(0, 60), targetCents: Math.round(targetCents), createdBy: cleanName(actor), createdById: profile?.id || null, participants: [cleanName(actor)], participantIds: profile?.id ? [profile.id] : [], contributions: [], claimedBy: null, claimedById: null, status: 'open', createdAt: now(), updatedAt: now() };
    list('wishlists', chatId).unshift(wish); addActivity(chatId, 'wishlist.created', `${actor} added “${wish.title}” to the wishlist`, actor, { wishlistId: wish.id }); save(); return wish;
  }
  function findWishlist(chatId, identifier) { return list('wishlists', chatId).find((wish) => wish.id === identifier) || null; }
  function updateWishlistMembership(chatId, identifier, actor, profile, joined) {
    const wish = findWishlist(chatId, identifier); if (!wish || wish.status !== 'open') return null; const name = cleanName(actor); const position = (wish.participantIds || []).indexOf(profile?.id);
    if (joined && position < 0) { wish.participants.push(name); if (profile?.id) wish.participantIds.push(profile.id); }
    if (!joined && position >= 0) { wish.participantIds.splice(position, 1); wish.participants = wish.participants.filter((item) => item.toLowerCase() !== name.toLowerCase()); }
    wish.updatedAt = now(); addActivity(chatId, joined ? 'wishlist.joined' : 'wishlist.left', `${actor} ${joined ? 'joined' : 'left'} “${wish.title}”`, actor, { wishlistId: wish.id }); save(); return wish;
  }
  function chipInWishlist(chatId, identifier, amountCents, actor, profile) {
    const wish = findWishlist(chatId, identifier); const amount = Number(amountCents); if (!wish || !Number.isFinite(amount) || amount <= 0) return null;
    const name = cleanName(actor); if (!(wish.participantIds || []).includes(profile?.id)) updateWishlistMembership(chatId, identifier, actor, profile, true);
    wish.contributions.push({ id: makeId('wc'), by: name, memberId: profile?.id || null, amountCents: Math.round(amount), createdAt: now() }); wish.updatedAt = now(); addActivity(chatId, 'wishlist.contributed', `${actor} chipped in to “${wish.title}”`, actor, { wishlistId: wish.id, amountCents: Math.round(amount) }); save(); return wish;
  }
  function claimWishlist(chatId, identifier, actor, profile) {
    const wish = findWishlist(chatId, identifier); if (!wish || wish.area !== 'groceries' || wish.status !== 'open') return null;
    const name = cleanName(actor); const isOwner = wish.claimedById ? wish.claimedById === profile?.id : wish.claimedBy?.toLowerCase() === name.toLowerCase();
    if (wish.claimedBy && !isOwner) throw Object.assign(new Error('This grocery wishlist is already claimed.'), { statusCode: 409 });
    wish.claimedBy = isOwner ? null : name; wish.claimedById = isOwner ? null : profile?.id || null; wish.updatedAt = now(); addActivity(chatId, isOwner ? 'wishlist.unclaimed' : 'wishlist.claimed', `${actor} ${isOwner ? 'unclaimed' : 'claimed'} “${wish.title}”`, actor, { wishlistId: wish.id }); save(); return wish;
  }
  function addRequest(chatId, details, actor, profile) {
    const target = activeProfileByName(chatId, details.to); const message = String(details.message || '').trim().slice(0, 500); if (!target || !message) throw Object.assign(new Error('Choose an active roomie and add a request message.'), { statusCode: 400 });
    const request = { id: makeId('rq'), from: cleanName(actor), fromMemberId: profile?.id || null, to: target.displayName, toMemberId: target.id, type: String(details.type || 'other').trim().slice(0, 40), message, dueDate: details.dueDate || null, relatedType: String(details.relatedType || '').trim(), relatedId: String(details.relatedId || '').trim(), planId: String(details.planId || '').trim(), status: 'open', createdAt: now(), updatedAt: now() };
    list('requests', chatId).unshift(request); addNotification(chatId, target, 'request.created', `${actor} sent you a request`, { requestId: request.id }); addActivity(chatId, 'request.created', `${actor} sent a request to ${target.displayName}`, actor, { requestId: request.id }); save(); return request;
  }
  function updateRequest(chatId, identifier, status, actor, profile) {
    const request = list('requests', chatId).find((item) => item.id === identifier); if (!request || !['open', 'accepted'].includes(request.status)) return null;
    if (request.toMemberId && request.toMemberId !== profile?.id) throw Object.assign(new Error('Only the request recipient can update this request.'), { statusCode: 403 });
    if (!['accepted', 'declined', 'done'].includes(status)) throw Object.assign(new Error('Invalid request status.'), { statusCode: 400 });
    if (status === 'done' && request.status !== 'accepted') throw Object.assign(new Error('Accept the request before marking it done.'), { statusCode: 409 });
    request.status = status; request.updatedAt = now(); request.updatedBy = cleanName(actor); addActivity(chatId, `request.${status}`, `${actor} ${status} a request`, actor, { requestId: request.id }); save(); return request;
  }
  function remindRequest(chatId, identifier, actor, profile) {
    const request = list('requests', chatId).find((item) => item.id === identifier);
    if (!request) return null;
    if (!profile || (request.fromMemberId && request.fromMemberId !== profile.id) || cleanName(actor).toLowerCase() !== request.from.toLowerCase()) {
      throw Object.assign(new Error('Only the person who sent the request can remind about it.'), { statusCode: 403 });
    }
    const recipient = request.toMemberId ? list('memberProfiles', chatId).find((member) => member.id === request.toMemberId && member.active) : activeProfileByName(chatId, request.to);
    if (!recipient) throw Object.assign(new Error('Request recipient is no longer active.'), { statusCode: 404 });
    addNotification(chatId, recipient, 'request.reminder', `${actor} reminded you about a request`, { requestId: request.id });
    addActivity(chatId, 'request.reminded', `${actor} reminded ${recipient.displayName} about a request`, actor, { requestId: request.id });
    save();
    return request;
  }
  function findSettlementRequest(chatId, identifier) { return list('settlementRequests', chatId).find((item) => item.id === identifier) || null; }
  function requestSettlement(chatId, details, actor, profile) {
    const from = cleanName(details.from || actor); const to = cleanName(details.to); const amountCents = Math.round(Number(details.amountCents));
    if (!profile || from.toLowerCase() !== cleanName(profile.displayName).toLowerCase()) throw Object.assign(new Error('You can only mark your own settlement as paid.'), { statusCode: 403 });
    if (!to || !Number.isInteger(amountCents) || amountCents <= 0) throw Object.assign(new Error('A settlement recipient and positive amount are required.'), { statusCode: 400 });
    const balances = calculateBalances(activeExpenses(chatId), memberNames(chatId));
    const outstanding = balances.settlements.find((item) => item.from.toLowerCase() === from.toLowerCase() && item.to.toLowerCase() === to.toLowerCase() && item.amountCents === amountCents);
    if (!outstanding) throw Object.assign(new Error('That settlement is no longer outstanding.'), { statusCode: 409 });
    const recipient = activeProfileByName(chatId, to); if (!recipient) throw Object.assign(new Error('Settlement recipient is not an active roomie.'), { statusCode: 404 });
    const duplicate = list('settlementRequests', chatId).find((item) => ['pending', 'confirmed'].includes(item.status) && item.from.toLowerCase() === from.toLowerCase() && item.to.toLowerCase() === to.toLowerCase() && item.amountCents === amountCents);
    if (duplicate) return duplicate;
    const request = { id: makeId('s'), from, fromMemberId: profile.id, to: recipient.displayName, toMemberId: recipient.id, amountCents, status: 'pending', requestedAt: now(), requestedBy: from };
    list('settlementRequests', chatId).unshift(request); addNotification(chatId, recipient, 'settlement.pending', `${from} marked a ${amountCents}¢ settlement as paid`, { settlementRequestId: request.id }); addActivity(chatId, 'settlement.requested', `${from} marked a settlement to ${recipient.displayName} as paid`, actor, { settlementRequestId: request.id }); save(); return request;
  }
  function reviewSettlement(chatId, identifier, verdict, actor, profile) {
    const request = findSettlementRequest(chatId, identifier); if (!request || request.status !== 'pending') return null;
    if (!profile || request.toMemberId !== profile.id) throw Object.assign(new Error('Only the settlement recipient can confirm or decline it.'), { statusCode: 403 });
    if (!['confirmed', 'declined'].includes(verdict)) throw Object.assign(new Error('Invalid settlement decision.'), { statusCode: 400 });
    request.status = verdict; request.reviewedAt = now(); request.reviewedBy = cleanName(actor); request.reviewedById = profile.id;
    addActivity(chatId, `settlement.${verdict}`, `${actor} ${verdict} a settlement from ${request.from}`, actor, { settlementRequestId: request.id }); save(); return request;
  }
  function addCorrection(chatId, text, actor) {
    const message = String(text || '').trim().slice(0, 500);
    if (!message) throw Object.assign(new Error('Format: /corrections add <what needs correcting>'), { statusCode: 400 });
    const correction = { id: makeId('r'), message, status: 'pending', createdBy: actor, createdAt: now(), updatedAt: now() };
    list('corrections', chatId).push(correction); addActivity(chatId, 'correction.created', `${actor} requested a correction`, actor, { correctionId: correction.id }); save(); return correction;
  }
  function findCorrection(chatId, identifier) { const corrections = list('corrections', chatId); const index = Number(identifier); return corrections.find((item) => item.id === identifier) || (Number.isInteger(index) && index > 0 ? corrections[index - 1] : null); }
  function updateCorrection(chatId, identifier, status, actor) {
    const correction = findCorrection(chatId, identifier); if (!correction || correction.status !== 'pending') return null;
    correction.status = status; correction.resolvedBy = actor; correction.resolvedAt = now(); correction.updatedAt = now();
    addActivity(chatId, `correction.${status}`, `${actor} ${status} a correction`, actor, { correctionId: correction.id }); save(); return correction;
  }
  function addNote(chatId, type, text, actor, status = 'active') {
    const body = String(text || '').trim().slice(0, 500);
    if (!body) throw Object.assign(new Error(`Format: /${type} <details>`), { statusCode: 400 });
    const note = { id: makeId('n'), type, text: body, status, createdBy: actor, createdAt: now(), updatedAt: now() };
    list('notes', chatId).unshift(note); state.notes[chatId] = list('notes', chatId).slice(0, 300);
    addActivity(chatId, `${type}.saved`, `${actor} updated ${type}`, actor, { noteId: note.id }); save(); return note;
  }
  function listNotes(chatId, type, limit = 5) { return list('notes', chatId).filter((note) => note.type === type).slice(0, limit); }
  function updateSettings(chatId, patch, actor) {
    const allowed = ['houseName', 'currency', 'timezone', 'notifications', 'weeklyDigest', 'quietHours', 'houseRules', 'partyMode', 'defaultLocale', 'cribMode']; const current = settings(chatId);
    if (patch.currency !== undefined) {
      const currency = String(patch.currency).trim().toUpperCase();
      try { new Intl.NumberFormat('en', { style: 'currency', currency }).format(1); } catch { throw Object.assign(new Error('Choose a valid three-letter currency code.'), { statusCode: 400 }); }
      patch = { ...patch, currency };
    }
    if (patch.defaultLocale !== undefined) patch = { ...patch, defaultLocale: normalizeLocale(patch.defaultLocale) };
    if (patch.cribMode !== undefined) patch = { ...patch, cribMode: normalizeMode(patch.cribMode) };
    for (const key of allowed) if (patch[key] !== undefined) current[key] = typeof patch[key] === 'string' ? patch[key].trim().slice(0, 80) : Boolean(patch[key]);
    current.updatedAt = now(); addActivity(chatId, 'settings.updated', `${actor} updated house settings`, actor); save(); return current;
  }
  function dashboard(chatId, viewer) {
    const expenses = activeExpenses(chatId); const chores = list('chores', chatId); const groceries = list('groceries', chatId); const members = list('memberProfiles', chatId); const balances = calculateBalances(expenses, memberNames(chatId));
    for (const settlement of list('settlementRequests', chatId).filter((item) => item.status === 'confirmed')) {
      balances.netCents[settlement.from] = (balances.netCents[settlement.from] || 0) + settlement.amountCents;
      balances.netCents[settlement.to] = (balances.netCents[settlement.to] || 0) - settlement.amountCents;
    }
    balances.net = Object.fromEntries(Object.entries(balances.netCents).map(([name, cents]) => [name, cents / 100])); balances.settlements = simplifyDebts(balances.netCents, true);
    const locale = viewer?.telegramId ? resolveLocale(chatId, { id: viewer.telegramId, language_code: viewer.telegramLanguageCode }) : settings(chatId).defaultLocale;
    const cribSettings = settings(chatId);
    const viewerId = viewer?.id || null;
    return { expenses, expenseClaims: list('expenseClaims', chatId), chores, groceries, funds: list('funds', chatId), wishlists: list('wishlists', chatId), requests: list('requests', chatId), notifications: list('notifications', chatId).filter((item) => !viewerId || item.recipientId === viewerId), settlementRequests: list('settlementRequests', chatId), corrections: list('corrections', chatId), notes: list('notes', chatId), plans: list('plans', chatId), members, activity: list('activity', chatId), settings: cribSettings, balances, viewer: viewer ? { ...viewer, locale } : null, locale, modePicker: dashboardModePicker(cribSettings.cribMode) };
  }

  function markUpdate(updateId) { if (updateId == null) return true; if (state.processedUpdates[updateId]) return false; state.processedUpdates[updateId] = now(); const ids = Object.keys(state.processedUpdates); if (ids.length > 1000) ids.slice(0, ids.length - 1000).forEach((id) => delete state.processedUpdates[id]); save(); return true; }

  function clear(chatId) { for (const key of ['expenses', 'expenseClaims', 'chores', 'members', 'memberProfiles', 'groceries', 'funds', 'wishlists', 'requests', 'notifications', 'settlementRequests', 'corrections', 'notes', 'plans', 'activity', 'settings']) state[key][chatId] = key === 'settings' ? defaultSettings() : []; save(); }
  return { driver: 'json', state, save, registerMember, isMember, memberByTelegramId, housesForTelegramId, activeChatId, setActiveChatId, clearActiveChatId, memberNames, addExpense, listExpenseClaims, addExpenseClaim, reviewExpenseClaim, activeExpenses, lastExpense, findExpense, voidExpense, addChore, findChore, updateChore, submitChoreForReview, reviewChore, deleteChore, addGrocery, updateGrocery, deleteGrocery, addFund, findFund, chipInFund, addWishlist, findWishlist, updateWishlistMembership, chipInWishlist, claimWishlist, addRequest, updateRequest, remindRequest, requestSettlement, reviewSettlement, addPlan, findPlan, joinPlan, leavePlan, addPlanItem, claimPlanItem, updatePlanStatus, addPlanExpense, addCorrection, findCorrection, updateCorrection, addNote, listNotes, updateSettings, dashboard, addActivity, markUpdate, clear, settings, userLocale, setUserLocale, resolveLocale };
}

function createStore(dataFile) {
  return createJsonStore(dataFile);
}

module.exports = { createStore, createJsonStore, defaultSettings };
