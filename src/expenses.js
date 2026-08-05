function cleanName(name) { return String(name || '').trim().replace(/^@/, '').replace(/\s+/g, ' ').slice(0, 60); }
function uniqueNames(names) { const seen = new Set(); return names.map(cleanName).filter((name) => { const key = name.toLocaleLowerCase(); if (!name || seen.has(key)) return false; seen.add(key); return true; }); }
function parseNaturalExpense(text, actorName) {
  const input = String(text).trim();
  const match = input.match(/^(?:(?<payer>i|[\p{L}][\p{L}\p{M}'-]*(?:\s+[\p{L}][\p{L}\p{M}'-]*){0,2})\s+)?(?:paid|spent)\s+\$?(?<amount>\d[\d,]*(?:\.\d{1,2})?)\s+(?:for|on)\s+(?<description>.+?)\s*[.!]?$/iu);
  if (!match) return null;
  const amount = Number(match.groups.amount.replace(/,/g, '')); let description = match.groups.description.trim().replace(/[.!]+$/, '');
  if (!Number.isFinite(amount) || amount <= 0 || !description) return null;
  const rawPayer = match.groups.payer; const paidBy = !rawPayer || rawPayer.toLocaleLowerCase() === 'i' ? cleanName(actorName) : cleanName(rawPayer);
  let participants; let excluded;
  const between = description.match(/,?\s*split between\s+(.+)$/i);
  const exclude = description.match(/,?\s*exclude\s+(@?[A-Za-z0-9_]+)$/i);
  if (between) { participants = uniqueNames(between[1].split(/\s*(?:,|and)\s*/)); description = description.slice(0, between.index).trim(); }
  if (exclude) { excluded = cleanName(exclude[1]); description = description.slice(0, exclude.index).trim(); }
  return { amount, description, paidBy, ...(participants ? { participants } : {}), ...(excluded ? { excluded } : {}) };
}
function createExpense({ amount, amountCents, description, paidBy, addedBy, participants, source = 'telegram', category = 'Other', notes = '' }) {
  const cents = Number.isInteger(amountCents) ? amountCents : Math.round(Number(amount) * 100);
  if (!Number.isInteger(cents) || cents <= 0) throw Object.assign(new Error('Expense amount must be greater than zero.'), { statusCode: 400 });
  return { id: `e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, amountCents: cents, amount: cents / 100, description: String(description).trim().slice(0, 160), paidBy: cleanName(paidBy), addedBy: cleanName(addedBy), participants: uniqueNames(participants || []), category: String(category || 'Other').trim().slice(0, 40), notes: String(notes || '').trim().slice(0, 500), source, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}
module.exports = { cleanName, createExpense, parseNaturalExpense, uniqueNames };
