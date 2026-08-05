const telegram = window.Telegram?.WebApp;
telegram?.ready();
telegram?.expand();

const params = new URLSearchParams(window.location.search);
const chatId = params.get('chatId');
const apiBaseUrl = (params.get('apiBaseUrl') || '').replace(/\/$/, '');
const status = document.querySelector('#status');
const dashboard = document.querySelector('#dashboard');

const money = (amount) => `$${Number(amount).toFixed(2)}`;
const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

function empty(message) {
  return `<p class="empty">${escapeHtml(message)}</p>`;
}

function render(data) {
  const { expenses, chores, balances } = data;
  document.querySelector('#total-spent').textContent = money(balances.totalSpent);
  document.querySelector('#member-count').textContent = balances.memberCount;
  document.querySelector('#open-chores').textContent = chores.filter((chore) => !chore.done).length;
  document.querySelector('#expense-count').textContent = expenses.length;
  document.querySelector('#chore-count').textContent = chores.length;

  document.querySelector('#settlements').innerHTML = balances.settlements.length
    ? balances.settlements.map((item) => `<div class="row"><div class="row-main"><p class="row-title">${escapeHtml(item.from)} → ${escapeHtml(item.to)}</p><p class="row-meta">Suggested payment</p></div><span class="amount">${money(item.amount)}</span></div>`).join('')
    : empty('Everyone is settled up.');

  document.querySelector('#expenses').innerHTML = expenses.length
    ? [...expenses].reverse().slice(0, 20).map((expense) => `<div class="row"><div class="row-main"><p class="row-title">${escapeHtml(expense.description)}</p><p class="row-meta">Paid by ${escapeHtml(expense.paidBy)}</p></div><span class="amount">${money(expense.amount)}</span></div>`).join('')
    : empty('No expenses yet.');

  document.querySelector('#chores').innerHTML = chores.length
    ? chores.map((chore) => `<div class="row ${chore.done ? 'done' : ''}"><div class="row-main"><p class="row-title">${chore.done ? '✓ ' : ''}${escapeHtml(chore.task)}</p><p class="row-meta">${chore.assignedTo ? `Assigned to ${escapeHtml(chore.assignedTo)}` : 'Unassigned'}${chore.doneBy ? ` · Done by ${escapeHtml(chore.doneBy)}` : ''}</p></div></div>`).join('')
    : empty('No chores yet.');

  status.hidden = true;
  dashboard.hidden = false;
}

if (!chatId) {
  status.textContent = 'Open this dashboard from Cribbit in your Telegram group.';
} else {
  fetch(`${apiBaseUrl}/api/dashboard?chatId=${encodeURIComponent(chatId)}`, {
    headers: telegram?.initData ? { 'X-Telegram-Init-Data': telegram.initData } : {}
  })
    .then((response) => {
      if (!response.ok) throw new Error('Dashboard request failed');
      return response.json();
    })
    .then(render)
    .catch(() => { status.textContent = 'Could not load this household. Please try again.'; });
}
