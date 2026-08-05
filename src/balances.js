const { uniqueNames } = require('./expenses');

function simplifyDebts(netBalances) {
  const debtors = [];
  const creditors = [];

  for (const [name, amount] of Object.entries(netBalances)) {
    const cents = Math.round(amount * 100);
    if (cents < 0) debtors.push({ name, cents: -cents });
    if (cents > 0) creditors.push({ name, cents });
  }

  debtors.sort((a, b) => b.cents - a.cents);
  creditors.sort((a, b) => b.cents - a.cents);

  const settlements = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const cents = Math.min(debtor.cents, creditor.cents);

    if (cents > 0) {
      settlements.push({ from: debtor.name, to: creditor.name, amount: cents / 100 });
    }

    debtor.cents -= cents;
    creditor.cents -= cents;
    if (debtor.cents === 0) debtorIndex += 1;
    if (creditor.cents === 0) creditorIndex += 1;
  }

  return settlements;
}

function calculateBalances(expenses, knownMembers = []) {
  const fallbackMembers = uniqueNames([
    ...knownMembers,
    ...expenses.map((expense) => expense.paidBy)
  ]);
  const paid = {};
  const net = {};
  let totalSpent = 0;

  for (const expense of expenses) {
    const amount = Number(expense.amount);
    if (!Number.isFinite(amount) || amount <= 0 || !expense.paidBy) continue;

    const participants = uniqueNames(
      Array.isArray(expense.participants) && expense.participants.length
        ? expense.participants
        : fallbackMembers
    );
    if (!participants.some((name) => name.toLocaleLowerCase() === expense.paidBy.toLocaleLowerCase())) {
      participants.push(expense.paidBy);
    }
    const payerName = participants.find(
      (name) => name.toLocaleLowerCase() === expense.paidBy.toLocaleLowerCase()
    ) || expense.paidBy;

    totalSpent += amount;
    paid[payerName] = (paid[payerName] || 0) + amount;
    const share = amount / participants.length;

    for (const person of participants) {
      net[person] = (net[person] || 0) - share;
    }
    net[payerName] = (net[payerName] || 0) + amount;
  }

  return {
    totalSpent,
    memberCount: Object.keys(net).length,
    paid,
    net,
    settlements: simplifyDebts(net)
  };
}

module.exports = { calculateBalances, simplifyDebts };
