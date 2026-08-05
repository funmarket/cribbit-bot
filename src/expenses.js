function cleanName(name) { return String(name || '').trim().replace(/^@/, '').replace(/\s+/g, ' ').slice(0, 60); }
function uniqueNames(names) { const seen = new Set(); return names.map(cleanName).filter((name) => { const key = name.toLocaleLowerCase(); if (!name || seen.has(key)) return false; seen.add(key); return true; }); }
function normalizeDigits(value) { return String(value || '').replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit))).replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))); }
function parseLocalizedAmount(value, locale) { let normalized = normalizeDigits(value).replace(/[\s\u00a0\u202f]/g, '').replace(/[$€£¥₦]|USD|EUR|GBP|NGN|CAD|AUD/giu, ''); if (locale === 'fr') normalized = normalized.replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.'); else normalized = normalized.replace(/,(?=\d{3}(?:\D|$))/g, '').replace(',', '.'); const amount = Number(normalized); return Number.isFinite(amount) && amount > 0 ? amount : null; }
function parseNaturalExpense(text, actorName) {
  const input = normalizeDigits(String(text)).trim().replace(/[،؛]/g, ' '); let match; let locale = 'en';
  match = input.match(/^(?:(?<payer>i|[\p{L}][\p{L}\p{M}'’ـ-]*(?:\s+[\p{L}][\p{L}\p{M}'’ـ-]*){0,2})\s+)?(?:paid|spent)\s+(?<amount>(?:[$€£¥₦]\s*)?\d[\d,.\s]*(?:\s*(?:USD|EUR|GBP|NGN|CAD|AUD))?)\s+(?:for|on)\s+(?<description>.+?)\s*[.!]?$/iu);
  if (!match) { locale = 'fr'; match = input.match(/^(?:j['’]ai\s+|(?<payer>[\p{L}][\p{L}\p{M}'’ـ-]*(?:\s+[\p{L}][\p{L}\p{M}'’ـ-]*){0,2}?)\s+a\s+)?pay[ée]\s+(?<amount>(?:[$€£¥₦]\s*)?\d[\d,.\s]*(?:\s*(?:USD|EUR|GBP|NGN|CAD|AUD))?)\s+pour\s+(?<description>.+?)\s*[.!]?$/iu); }
  if (!match) { locale = 'ar'; match = input.match(/^دفعت(?:\s+(?<payer>[\p{L}][\p{L}\p{M}'’ـ-]*(?:\s+[\p{L}][\p{L}\p{M}'’ـ-]*){0,2}))?\s+(?<amount>(?:[$€£¥₦]\s*)?\d[\d,.\s]*(?:\s*(?:USD|EUR|GBP|NGN|CAD|AUD))?)\s+(?<preposition>مقابل|لـ?|على)\s*(?<description>.+?)\s*[.!؟]?$/iu); }
  if (!match) return null;
  const amount = parseLocalizedAmount(match.groups.amount, locale); let description = match.groups.description.trim().replace(/[.!؟]+$/, ''); if (locale === 'ar' && match.groups.preposition?.startsWith('ل') && description.startsWith('ل') && !description.startsWith('ال')) description = `ا${description}`;
  if (!Number.isFinite(amount) || amount <= 0 || !description) return null;
  const rawPayer = match.groups.payer; const selfPayer = !rawPayer || ['i', "j'ai", 'j’ai'].includes(rawPayer.toLocaleLowerCase()); const paidBy = selfPayer ? cleanName(actorName) : cleanName(rawPayer);
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
module.exports = { cleanName, createExpense, parseNaturalExpense, uniqueNames, normalizeDigits, parseLocalizedAmount };
