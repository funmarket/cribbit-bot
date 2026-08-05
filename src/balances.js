const { uniqueNames } = require('./expenses');
function simplifyDebts(netBalances, valuesAreCents = false) {
  const debtors = [], creditors = [];
  for (const [name, value] of Object.entries(netBalances)) { const cents = valuesAreCents ? Math.round(value) : Math.round(value * 100); if (cents < 0) debtors.push({ name, cents: -cents }); if (cents > 0) creditors.push({ name, cents }); }
  debtors.sort((a, b) => b.cents - a.cents); creditors.sort((a, b) => b.cents - a.cents);
  const settlements = []; let d = 0, c = 0;
  while (d < debtors.length && c < creditors.length) { const cents = Math.min(debtors[d].cents, creditors[c].cents); if (cents > 0) settlements.push({ from: debtors[d].name, to: creditors[c].name, amountCents: cents, amount: cents / 100 }); debtors[d].cents -= cents; creditors[c].cents -= cents; if (!debtors[d].cents) d++; if (!creditors[c].cents) c++; }
  return settlements;
}
function calculateBalances(expenses, knownMembers = []) {
  const fallback = uniqueNames([...knownMembers, ...expenses.map((e) => e.paidBy)]); const paidCents = {}, netCents = {}; let totalSpentCents = 0;
  for (const expense of expenses) {
    const cents = Number.isInteger(expense.amountCents) ? expense.amountCents : Math.round(Number(expense.amount) * 100); if (!Number.isInteger(cents) || cents <= 0 || !expense.paidBy || expense.deletedAt) continue;
    const participants = uniqueNames(expense.participants?.length ? expense.participants : fallback).filter((name) => !(expense.excluded || []).some((excluded) => excluded.toLowerCase() === name.toLowerCase()));
    if (!participants.some((n) => n.toLowerCase() === expense.paidBy.toLowerCase())) participants.push(expense.paidBy);
    const payer = participants.find((n) => n.toLowerCase() === expense.paidBy.toLowerCase()) || expense.paidBy; totalSpentCents += cents; paidCents[payer] = (paidCents[payer] || 0) + cents;
    const base = Math.floor(cents / participants.length), remainder = cents % participants.length;
    participants.forEach((person, index) => { netCents[person] = (netCents[person] || 0) - base - (index < remainder ? 1 : 0); }); netCents[payer] += cents;
  }
  const settlements = simplifyDebts(netCents, true); const toDollars = (object) => Object.fromEntries(Object.entries(object).map(([k, v]) => [k, v / 100]));
  return { totalSpentCents, totalSpent: totalSpentCents / 100, memberCount: Object.keys(netCents).length, paidCents, paid: toDollars(paidCents), netCents, net: toDollars(netCents), settlements };
}
module.exports = { calculateBalances, simplifyDebts };
