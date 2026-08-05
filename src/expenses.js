function cleanName(name) {
  return String(name || '').trim().replace(/^@/, '').replace(/\s+/g, ' ').slice(0, 60);
}

function uniqueNames(names) {
  const seen = new Set();
  return names.map(cleanName).filter((name) => {
    const key = name.toLocaleLowerCase();
    if (!name || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseNaturalExpense(text, actorName) {
  const match = String(text).trim().match(
    /^(?:(?<payer>i|[\p{L}][\p{L}\p{M}'-]*(?:\s+[\p{L}][\p{L}\p{M}'-]*){0,2})\s+)?(?:paid|spent)\s+\$?(?<amount>\d[\d,]*(?:\.\d{1,2})?)\s+(?:for|on)\s+(?<description>.+?)\s*[.!]?$/iu
  );

  if (!match) return null;

  const amount = Number(match.groups.amount.replace(/,/g, ''));
  const description = match.groups.description.trim().replace(/[.!]+$/, '');
  if (!Number.isFinite(amount) || amount <= 0 || !description) return null;

  const rawPayer = match.groups.payer;
  const paidBy = !rawPayer || rawPayer.toLocaleLowerCase() === 'i'
    ? cleanName(actorName)
    : cleanName(rawPayer);

  return { amount, description, paidBy };
}

function createExpense({ amount, description, paidBy, addedBy, participants }) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    amount,
    description: String(description).trim(),
    paidBy: cleanName(paidBy),
    addedBy: cleanName(addedBy),
    participants: uniqueNames(participants),
    createdAt: new Date().toISOString()
  };
}

module.exports = { cleanName, createExpense, parseNaturalExpense, uniqueNames };
