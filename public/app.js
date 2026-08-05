const telegram = window.Telegram?.WebApp;
telegram?.ready();
telegram?.expand();

const TELEGRAM_BOT_URL = 'https://t.me/Cribbit_bot';
const params = new URLSearchParams(window.location.search);
const chatId = params.get('chatId');
const apiBaseUrl = (params.get('apiBaseUrl') || '').replace(/\/$/, '');
const status = document.querySelector('#status');
const statusCopy = document.querySelector('#status-copy');
const dashboard = document.querySelector('#dashboard');
const refreshButton = document.querySelector('#refresh-button');
const money = (amount) => `$${Number(amount).toFixed(2)}`;
const escapeHtml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

function empty(message) { return `<p class="empty">${escapeHtml(message)}</p>`; }

function expenseRows(expenses, limit) {
  const items = [...expenses].reverse().slice(0, limit);
  return items.length ? items.map((expense) => `<div class="row"><span class="row-icon" aria-hidden="true">$</span><div class="row-main"><p class="row-title">${escapeHtml(expense.description)}</p><p class="row-meta">Paid by ${escapeHtml(expense.paidBy)}</p></div><span class="amount">${money(expense.amount)}</span></div>`).join('') : empty('No expenses yet. Add one in Telegram to get started.');
}

function choreRows(chores, limit) {
  const items = chores.slice(0, limit);
  return items.length ? items.map((chore) => `<div class="row ${chore.done ? 'done chore-done' : 'chore-open'}"><span class="row-icon" aria-hidden="true">${chore.done ? '✓' : '○'}</span><div class="row-main"><p class="row-title">${escapeHtml(chore.task)}</p><p class="row-meta">${chore.assignedTo ? `Assigned to ${escapeHtml(chore.assignedTo)}` : 'Unassigned'}${chore.doneBy ? ` · Done by ${escapeHtml(chore.doneBy)}` : ''}</p></div></div>`).join('') : empty('No chores yet. Add one in Telegram to get the house moving.');
}

function render(data) {
  const { expenses, chores, balances } = data;
  document.querySelector('#total-spent').textContent = money(balances.totalSpent);
  document.querySelector('#member-count').textContent = balances.memberCount;
  document.querySelector('#open-chores').textContent = chores.filter((chore) => !chore.done).length;
  document.querySelector('#expense-count').textContent = expenses.length;
  document.querySelector('#chore-count').textContent = chores.length;
  document.querySelector('#settlements').innerHTML = balances.settlements.length ? balances.settlements.map((item) => `<div class="row settlement-row"><span class="row-icon" aria-hidden="true">↗</span><div class="row-main"><p class="row-title">${escapeHtml(item.from)} should pay ${escapeHtml(item.to)}</p><p class="row-meta">Suggested settlement</p></div><span class="amount">${money(item.amount)}</span></div>`).join('') : empty('Everyone is settled. That is a good house vibe.');
  document.querySelector('#expense-preview').innerHTML = expenseRows(expenses, 3);
  document.querySelector('#expenses').innerHTML = expenseRows(expenses, 50);
  document.querySelector('#chore-preview').innerHTML = choreRows(chores, 3);
  document.querySelector('#chores').innerHTML = choreRows(chores, 50);
  status.hidden = true;
  dashboard.hidden = false;
}

function showStatus(message, isError = false) {
  statusCopy.textContent = message;
  status.classList.toggle('error', isError);
  status.hidden = false;
}

async function loadDashboard() {
  if (!chatId) {
    showStatus('Open this dashboard from /dashboard in your Cribbit Telegram group.');
    dashboard.hidden = true;
    return;
  }
  refreshButton.disabled = true;
  showStatus('Refreshing your household…');
  try {
    const response = await fetch(`${apiBaseUrl}/api/dashboard?chatId=${encodeURIComponent(chatId)}`, { headers: telegram?.initData ? { 'X-Telegram-Init-Data': telegram.initData } : {} });
    if (!response.ok) throw new Error(`Dashboard request failed with ${response.status}`);
    render(await response.json());
  } catch (error) {
    console.error('Could not load dashboard:', error);
    showStatus('Could not load this household. Return to Telegram and try /dashboard again.', true);
  } finally { refreshButton.disabled = false; }
}

function showView(view, scroll = true) {
  const nextView = ['overview', 'expenses', 'chores'].includes(view) ? view : 'overview';
  document.querySelectorAll('[data-panel]').forEach((panel) => { panel.hidden = panel.dataset.panel !== nextView; });
  document.querySelectorAll('.nav-button').forEach((button) => {
    const active = button.dataset.view === nextView;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.querySelector('#overview-intro').hidden = nextView !== 'overview';
  window.location.hash = nextView;
  if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('[data-view]').forEach((control) => control.addEventListener('click', () => showView(control.dataset.view)));
document.querySelectorAll('[data-view-link]').forEach((control) => control.addEventListener('click', (event) => { event.preventDefault(); showView(control.dataset.viewLink); }));
document.querySelectorAll('.telegram-link').forEach((link) => { link.href = TELEGRAM_BOT_URL; });
refreshButton.addEventListener('click', loadDashboard);
showView(window.location.hash.slice(1), false);
loadDashboard();
