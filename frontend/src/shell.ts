const shellHtml = String.raw`<!doctype html>

<html data-theme="light" lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      content="width=device-width,initial-scale=1,viewport-fit=cover"
      name="viewport"
    />
    <meta content="#f6f7f8" id="theme-color-meta" name="theme-color" />
    <meta content="Cribbit shared-house dashboard" name="description" />
    <title>Cribbit · Your crib</title>

    <link href="https://fonts.googleapis.com" rel="preconnect" />
    <link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect" />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500;550;600;650;700&amp;display=swap"
      rel="stylesheet"
    />

    <script src="https://telegram.org/js/telegram-web-app.js?63"></script>
    <script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.4/dist/jspdf.plugin.autotable.min.js"></script>
    <script src="/src/main.ts" type="module"></script>
  </head>
  <body>
    <div aria-live="polite" class="loading-screen" id="loading">
      <img alt="Cribbit" src="/logo.png" />
      <div><span></span><span></span><span></span></div>
      <p data-i18n="common.loading">Opening your crib…</p>
    </div>
    <section class="auth-gate" hidden="" id="auth-gate">
      <div class="auth-card">
        <img alt="Cribbit" src="/logo.png" />
        <p class="kicker">TELEGRAM MINI APP</p>
        <h1 data-i18n="auth.title" id="auth-title">
          Open Cribbit through Telegram
        </h1>
        <p data-i18n="auth.copy" id="auth-copy">
          Your house data is protected by Telegram. Open the bot and tap
          Dashboard to continue.
        </p>
        <div class="house-selector" hidden="" id="house-selector"></div>
        <a
          class="primary-button"
          data-i18n="auth.button"
          href="https://t.me/Cribbit_bot?startgroup=true"
          id="open-telegram"
          >Open @Cribbit_bot</a
        >
        <a
          class="secondary-button"
          href="?demo=1"
          id="open-demo"
          style="margin-top: 8px"
          >Explore demo dashboard</a
        >
      </div>
    </section>
    <div class="app-frame" hidden="" id="app">
      <aside class="sidebar">
        <button
          aria-label="Go to Home"
          class="brand-row brand-home-button"
          id="brand-home-button"
          type="button"
        >
          <img alt="Cribbit" class="app-logo" src="/logo.png" /><span
            class="brand-word"
            >Cribbit</span
          >
        </button>
        <div class="crib-dropdown sidebar-crib-dropdown">
          <button
            aria-expanded="false"
            aria-haspopup="menu"
            class="house-card"
            id="house-switcher-button"
            type="button"
          >
            <span aria-hidden="true" class="house-icon">
              <svg
                class="icon-svg sm"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.8"
                viewbox="0 0 24 24"
              >
                <path
                  d="M4.5 10.2 12 4l7.5 6.2v8.3a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5z"
                ></path>
                <path d="M9.3 20v-6.3h5.4V20"></path>
              </svg>
            </span>
            <span
              ><small>YOUR CRIB</small
              ><strong id="house-name-side">My Crib</strong></span
            >
            <span aria-hidden="true" class="chevron"
              ><svg
                class="icon-svg sm"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-width="1.8"
                viewbox="0 0 24 24"
              >
                <path d="m8.5 10 3.5 3.5 3.5-3.5"></path></svg
            ></span>
          </button>
          <div
            class="crib-dropdown-menu"
            hidden=""
            id="sidebar-crib-menu"
            role="menu"
          ></div>
        </div>
        <nav aria-label="Main navigation" class="side-nav">
          <button class="active" data-view="overview">
            <svg
              class="icon-svg"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
              viewbox="0 0 24 24"
            >
              <rect height="6.2" rx="1.2" width="6.2" x="4" y="4"></rect>
              <rect height="6.2" rx="1.2" width="6.2" x="13.8" y="4"></rect>
              <rect height="6.2" rx="1.2" width="6.2" x="4" y="13.8"></rect>
              <rect
                height="6.2"
                rx="1.2"
                width="6.2"
                x="13.8"
                y="13.8"
              ></rect></svg
            ><b data-i18n="navigation.overview">Overview</b>
          </button>
          <button data-view="expenses">
            <svg
              class="icon-svg"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.7"
              viewbox="0 0 24 24"
            >
              <rect height="13.6" rx="3" width="16.4" x="3.8" y="5.2"></rect>
              <path d="M3.8 9h16.4M8 14h3"></path></svg
            ><b data-i18n="navigation.expenses">Expenses</b>
          </button>
          <button data-view="chores">
            <svg
              class="icon-svg"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.7"
              viewbox="0 0 24 24"
            >
              <rect height="16" rx="2.5" width="14" x="5" y="4"></rect>
              <path d="m8.5 11.5 2.1 2.1 4.9-5M8.5 17h7"></path></svg
            ><b data-i18n="navigation.chores">Chores</b>
          </button>
          <button data-view="groceries">
            <svg
              class="icon-svg"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.7"
              viewbox="0 0 24 24"
            >
              <path d="M5.2 8h13.6l-1.1 11H6.3z"></path>
              <path d="M8.3 9V7a3.7 3.7 0 0 1 7.4 0v2"></path></svg
            ><b data-i18n="navigation.groceries">Groceries</b>
          </button>
          <button data-view="plans">
            <svg
              class="icon-svg"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.7"
              viewbox="0 0 24 24"
            >
              <rect height="14" rx="2.5" width="16" x="4" y="5.5"></rect>
              <path d="M8 3.5v4M16 3.5v4M4 9.5h16"></path>
              <path d="m8.2 14 2 2 4.2-4.2"></path></svg
            ><b>Plans</b>
          </button>
          <button data-view="roomies">
            <svg
              class="icon-svg"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-width="1.7"
              viewbox="0 0 24 24"
            >
              <circle cx="9" cy="8" r="3"></circle>
              <path
                d="M3.8 19v-1.2A4.8 4.8 0 0 1 8.6 13h.8a4.8 4.8 0 0 1 4.8 4.8V19M15 6.2a2.8 2.8 0 0 1 0 5.6M16.3 13.3a4.3 4.3 0 0 1 3.9 4.3V19"
              ></path></svg
            ><b data-i18n="navigation.roomies">Roomies</b>
          </button>
          <button data-view="activity">
            <svg
              class="icon-svg"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.7"
              viewbox="0 0 24 24"
            >
              <path d="M4 12h3l2-5 4 10 2-5h5"></path></svg
            ><b data-i18n="navigation.activity">Activity</b>
          </button>
          <button data-view="funds">
            <svg
              class="icon-svg"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.7"
              viewbox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="8"></circle>
              <path d="M12 8v8M8 12h8"></path></svg
            ><b>Funds</b>
          </button>
        </nav>
        <button class="settings-link" data-view="settings">
          <svg
            class="icon-svg"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.7"
            viewbox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="3"></circle>
            <path
              d="M19 13.4v-2.8l-2-.7a6.6 6.6 0 0 0-.7-1.7l.9-1.9-2-2-1.9.9a6.6 6.6 0 0 0-1.7-.7l-.7-2H8.1l-.7 2a6.6 6.6 0 0 0-1.7.7l-1.9-.9-2 2 .9 1.9a6.6 6.6 0 0 0-.7 1.7l-2 .7v2.8l2 .7c.15.6.4 1.2.7 1.7l-.9 1.9 2 2 1.9-.9c.5.3 1.1.55 1.7.7l.7 2h2.8l.7-2c.6-.15 1.2-.4 1.7-.7l1.9.9 2-2-.9-1.9c.3-.5.55-1.1.7-1.7z"
            ></path></svg
          ><b data-i18n="navigation.settings">Settings</b>
        </button>
        <div class="sidebar-spacer"></div>
        <div class="sidebar-theme">
          <span>Appearance</span
          ><button
            aria-label="Toggle light and dark mode"
            class="theme-toggle"
            data-theme-toggle=""
            type="button"
          >
            <svg
              class="moon"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewbox="0 0 24 24"
            >
              <path
                d="M20 15.2A8 8 0 0 1 8.8 4 8.2 8.2 0 1 0 20 15.2Z"
              ></path></svg
            ><svg
              class="sun"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewbox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="3.5"></circle>
              <path
                d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"
              ></path>
            </svg>
          </button>
        </div>
        <div class="profile">
          <span id="profile-avatar">ME</span>
          <div>
            <strong id="profile-name">House member</strong
            ><small id="profile-role">Member</small>
          </div>
        </div>
      </aside>
      <div class="app-main">
        <header class="mobile-header">
          <button
            aria-label="Go to Home"
            class="mobile-home-button"
            id="mobile-home-button"
            type="button"
          >
            <img alt="Cribbit" src="/logo.png" />
          </button>
          <div class="crib-dropdown mobile-crib-dropdown">
            <button
              aria-expanded="false"
              aria-haspopup="menu"
              class="mobile-house-switcher"
              id="mobile-house-switcher"
              type="button"
            >
              <span
                ><small>YOUR CRIB</small
                ><strong id="house-name-mobile">My Crib</strong></span
              ><b class="chevron"
                ><svg
                  class="icon-svg sm"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="1.8"
                  viewbox="0 0 24 24"
                >
                  <path d="m8.5 10 3.5 3.5 3.5-3.5"></path></svg
              ></b>
            </button>
            <div
              class="crib-dropdown-menu mobile-crib-menu"
              hidden=""
              id="mobile-crib-menu"
              role="menu"
            ></div>
          </div>
          <button
            aria-label="Toggle light and dark mode"
            class="mobile-theme"
            data-theme-toggle=""
            type="button"
          >
            <svg
              class="icon-svg sm"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-width="1.8"
              viewbox="0 0 24 24"
            >
              <path d="M20 15.2A8 8 0 0 1 8.8 4 8.2 8.2 0 1 0 20 15.2Z"></path>
            </svg>
          </button>
          <button aria-label="Open more navigation" id="mobile-more">
            <svg class="icon-svg sm" fill="currentColor" viewbox="0 0 24 24">
              <circle cx="5" cy="12" r="1.6"></circle>
              <circle cx="12" cy="12" r="1.6"></circle>
              <circle cx="19" cy="12" r="1.6"></circle>
            </svg>
          </button>
        </header>
        <div class="demo-banner" hidden="" id="demo-banner">
          <span data-i18n="dashboard.demo">Demo mode · sample household</span
          ><a data-i18n="dashboard.openTelegram" href="https://t.me/Cribbit_bot"
            >Open your real crib ↗</a
          >
        </div>
        <main>
          <section class="view" data-panel="overview">
            <div class="page-header overview-command">
              <div class="overview-command-main">
                <p class="kicker" id="current-date">TODAY</p>
                <div class="overview-command-line">
                  <h1 id="greeting">Morning.</h1>
                  <button
                    aria-label="View spending reports"
                    class="header-metric spent"
                    data-view="reports"
                    type="button"
                  >
                    <span>Total spent</span
                    ><strong id="snapshot-spent">$0.00</strong></button
                  ><button
                    aria-label="Open your to do list"
                    class="header-metric todo"
                    data-view="chores"
                    type="button"
                  >
                    <span>To Do</span><strong id="snapshot-chores">0</strong>
                  </button>
                </div>
              </div>
              <div class="header-actions">
                <button
                  aria-label="Notifications"
                  class="icon-button notification-button"
                  data-i18n-aria="notifications.title"
                  id="notification-button"
                  type="button"
                >
                  <svg
                    class="icon-svg sm"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.8"
                    viewbox="0 0 24 24"
                  >
                    <path
                      d="M18 9a6 6 0 0 0-12 0c0 7-2.5 7-2.5 7h17S18 16 18 9Z"
                    ></path>
                    <path d="M10 20h4"></path></svg
                  ><i></i
                  ><span class="notification-badge" id="notification-badge"
                    >0</span
                  ></button
                ><button class="quick-add" data-modal="expense-modal">
                  <svg
                    class="icon-svg sm"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-width="2"
                    viewbox="0 0 24 24"
                  >
                    <path d="M12 5v14M5 12h14"></path></svg
                  ><span data-i18n="ui.add">Add</span>
                </button>
              </div>
            </div>
            <div class="balance-grid">
              <article class="balance-card owed-card">
                <small data-i18n="dashboard.youAreOwed">YOU’RE OWED</small
                ><strong id="owed-total">$0.00</strong
                ><span id="owed-note">Nothing outstanding</span>
              </article>
              <article class="balance-card owe-card">
                <small data-i18n="dashboard.youOwe">YOU OWE</small
                ><strong id="owe-total">$0.00</strong
                ><span id="owe-note">Nothing due</span>
              </article>
            </div>
            <nav
              aria-label="House coordination shortcuts"
              class="coordination-strip"
            >
              <button
                class="coordination-shortcut"
                data-view="requests"
                type="button"
              >
                <svg
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                  viewbox="0 0 24 24"
                >
                  <path d="M5 5.5h14v10H9l-4 3z"></path>
                  <path d="M9 9h6M9 12h4"></path></svg
                ><span>Requests</span><b id="shortcut-request-count">0</b>
              </button>
              <button
                class="coordination-shortcut"
                data-view="wishlists"
                type="button"
              >
                <svg
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                  viewbox="0 0 24 24"
                >
                  <path
                    d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"
                  ></path></svg
                ><span>Wishlists</span><b id="shortcut-wishlist-count">0</b>
              </button>
              <button
                class="coordination-shortcut"
                data-view="plans"
                type="button"
              >
                <svg
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                  viewbox="0 0 24 24"
                >
                  <rect height="14" rx="2.5" width="16" x="4" y="5.5"></rect>
                  <path d="M8 3.5v4M16 3.5v4M4 9.5h16"></path></svg
                ><span>Plans</span><b id="shortcut-plan-count">0</b>
              </button>
              <button
                class="coordination-shortcut"
                data-view="activity"
                type="button"
              >
                <svg
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="1.8"
                  viewbox="0 0 24 24"
                >
                  <path d="M4 12h3l2-5 4 10 2-5h5"></path></svg
                ><span>Activity</span><b id="shortcut-activity-count">0</b>
              </button>
            </nav>
            <div class="quick-actions">
              <button data-modal="expense-modal">
                <b
                  ><svg
                    class="icon-svg sm"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-width="1.8"
                    viewbox="0 0 24 24"
                  >
                    <path d="M12 5v14M5 12h14"></path></svg></b
                ><span>Add expense</span>
              </button>
              <button data-modal="chore-modal">
                <b
                  ><svg
                    class="icon-svg sm"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.8"
                    viewbox="0 0 24 24"
                  >
                    <path d="m6 12 3.2 3.2L18 6.5"></path></svg></b
                ><span>Add chore</span>
              </button>
              <button data-focus="grocery-input" data-view="groceries">
                <b
                  ><svg
                    class="icon-svg sm"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.8"
                    viewbox="0 0 24 24"
                  >
                    <path d="M5.2 8h13.6l-1.1 11H6.3z"></path>
                    <path d="M8.3 9V7a3.7 3.7 0 0 1 7.4 0v2"></path></svg></b
                ><span>Add grocery</span>
              </button>
              <button data-modal="fund-modal">
                <b
                  ><svg
                    class="icon-svg sm"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.8"
                    viewbox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="7.5"></circle>
                    <path d="M12 8v8M8 12h8"></path></svg></b
                ><span>New fund</span>
              </button>
            </div>
            <section class="card">
              <div class="card-head">
                <h2 data-i18n="dashboard.recentExpenses">Recent expenses</h2>
                <button data-view="expenses">View all →</button>
              </div>
              <div class="rows" id="expense-preview"></div>
            </section>
            <div class="overview-split">
              <section class="card">
                <div class="card-head">
                  <h2>Chores due</h2>
                  <button data-view="chores">Open board →</button>
                </div>
                <div class="rows" id="chore-preview"></div>
              </section>
              <section class="card">
                <div class="card-head">
                  <h2>Grocery list</h2>
                  <button data-view="groceries">Open list →</button>
                </div>
                <div class="rows" id="grocery-preview"></div>
              </section>
            </div>
            <section class="card fund-preview-card">
              <div class="card-head">
                <h2>Shared funds</h2>
                <button data-view="funds">View goals →</button>
              </div>
              <div id="fund-preview"></div>
            </section>
            <div id="mode-feature-container"></div>
          </section>
          <section class="view" data-panel="expenses" hidden="">
            <div class="page-header">
              <div>
                <p class="kicker">MONEY, MADE CLEAR</p>
                <h1>Expenses</h1>
                <p>Every shared cost and the fairest way home.</p>
              </div>
              <button class="quick-add" data-modal="expense-modal">
                <svg
                  class="icon-svg sm"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="2"
                  viewbox="0 0 24 24"
                >
                  <path d="M12 5v14M5 12h14"></path></svg
                >Log paid expense
              </button>
            </div>
            <div class="filter-bar">
              <input
                aria-label="Search expenses"
                id="expense-search"
                placeholder="Search expenses"
                type="search"
              /><select aria-label="Sort expenses" id="expense-sort">
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="amount">Highest amount</option>
              </select>
            </div>
            <div class="metric-grid expense-metrics">
              <article>
                <small>TOTAL HOUSE SPEND</small
                ><strong id="expense-total">$0.00</strong>
              </article>
              <article>
                <small>OPEN SETTLEMENTS</small
                ><strong id="settlement-count">0</strong>
              </article>
            </div>
            <section class="card wishlist-card" data-wishlist-card="expenses">
              <div class="card-head">
                <button
                  class="wishlist-toggle"
                  data-wishlist-toggle="expenses"
                  type="button"
                >
                  <svg
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-width="1.8"
                    viewbox="0 0 24 24"
                  >
                    <path d="M12 5v14M5 12h14"></path></svg
                  ><span>Wishlist</span></button
                ><span class="count" id="expense-wishlist-count">0</span>
              </div>
              <div class="wishlist-body">
                <div class="wishlist-body-inner">
                  <div class="wishlist-tools">
                    <input
                      aria-label="Search expense wishlist"
                      class="wishlist-search"
                      id="expense-wishlist-search"
                      placeholder="Search wishes…"
                      type="search"
                    /><button
                      class="quick-add wishlist-create"
                      data-wishlist-create="expenses"
                      type="button"
                    >
                      Create
                    </button>
                  </div>
                  <div
                    class="wish-create-panel"
                    hidden=""
                    id="expense-wishlist-create"
                  ></div>
                  <div class="wish-grid" id="expense-wishlist"></div>
                </div>
              </div>
            </section>
            <section class="card settlements-card">
              <div class="card-head">
                <div>
                  <h2>Settlements needed</h2>
                  <p class="card-head-copy">
                    Payments only clear after the person receiving the money
                    confirms it.
                  </p>
                </div>
                <span class="count" id="pending-settlement-count">0</span>
              </div>
              <div class="settlements-list" id="settlements"></div>
            </section>
            <section class="card">
              <div class="card-head">
                <div>
                  <h2>Payment approvals</h2>
                  <p class="card-head-copy">
                    The expense can be recorded now, but the claimed payment
                    only affects balances after an admin verifies the receipt.
                  </p>
                </div>
                <span class="count" id="expense-approval-count">0</span>
              </div>
              <div class="approval-list" id="expense-approvals"></div>
            </section>
            <section class="card">
              <div class="card-head">
                <h2>Expense history</h2>
                <span class="count" id="expense-count">0</span>
              </div>
              <div class="rows" id="expense-list"></div>
            </section>
          </section>
          <section class="view" data-panel="chores" hidden="">
            <div class="page-header">
              <div>
                <p class="kicker">HOUSE RHYTHM</p>
                <h1>Chores</h1>
                <p>Clear owners, clear due dates, zero chasing.</p>
              </div>
              <button class="quick-add" data-modal="chore-modal">
                <svg
                  class="icon-svg sm"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="2"
                  viewbox="0 0 24 24"
                >
                  <path d="M12 5v14M5 12h14"></path></svg
                >Full details
              </button>
            </div>
            <form class="quick-inline" id="chore-quick-form">
              <label class="sr-only" for="chore-quick-input">Quick chore</label
              ><input
                id="chore-quick-input"
                maxlength="160"
                name="task"
                placeholder="Quick add a chore…"
                required=""
              /><button type="submit">Add</button>
            </form>
            <div class="metric-grid">
              <article>
                <small>TO DO</small><strong id="chore-open-count">0</strong>
              </article>
              <article>
                <small>VERIFIED DONE</small
                ><strong id="chore-done-count">0</strong>
              </article>
            </div>
            <section class="card">
              <div class="card-head">
                <div>
                  <h2>Chore reviews</h2>
                  <p class="card-head-copy">
                    Done means submitted. An admin approves it or explains what
                    still needs fixing.
                  </p>
                </div>
                <span class="count" id="chore-review-count">0</span>
              </div>
              <div class="chore-review-list" id="chore-reviews"></div>
            </section>
            <section class="card">
              <div class="card-head">
                <h2>Chore board</h2>
                <span class="count" id="chore-count">0</span>
              </div>
              <div class="board" id="chore-list"></div>
            </section>
          </section>
          <section class="view" data-panel="groceries" hidden="">
            <div class="page-header">
              <div>
                <p class="kicker">SHARED SHOPPING</p>
                <h1>Groceries</h1>
                <p>One list, fewer “did anyone buy milk?” messages.</p>
              </div>
              <button
                class="quick-add"
                data-expense-category="Groceries"
                data-modal="expense-modal"
                type="button"
              >
                <svg
                  class="icon-svg sm"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="2"
                  viewbox="0 0 24 24"
                >
                  <path d="M12 5v14M5 12h14"></path></svg
                >Bought groceries
              </button>
            </div>
            <form class="inline-form" id="grocery-form">
              <label class="sr-only" for="grocery-input">Grocery item</label
              ><input
                id="grocery-input"
                maxlength="120"
                name="name"
                placeholder="Add what the house needs…"
                required=""
              /><select aria-label="Priority" name="priority">
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option></select
              ><button type="submit">Add item</button>
            </form>
            <div class="metric-grid">
              <article>
                <small>ACTIVE ITEMS</small
                ><strong id="grocery-active-count">0</strong>
              </article>
              <article>
                <small>PURCHASED</small
                ><strong id="grocery-done-count">0</strong>
              </article>
            </div>
            <section class="card wishlist-card" data-wishlist-card="groceries">
              <div class="card-head">
                <button
                  class="wishlist-toggle"
                  data-wishlist-toggle="groceries"
                  type="button"
                >
                  <svg
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-width="1.8"
                    viewbox="0 0 24 24"
                  >
                    <path d="M12 5v14M5 12h14"></path></svg
                  ><span>Wishlist</span></button
                ><span class="count" id="grocery-wishlist-count">0</span>
              </div>
              <div class="wishlist-body">
                <div class="wishlist-body-inner">
                  <div class="wishlist-tools">
                    <input
                      aria-label="Search grocery wishlist"
                      class="wishlist-search"
                      id="grocery-wishlist-search"
                      placeholder="Search grocery wishes…"
                      type="search"
                    /><button
                      class="quick-add wishlist-create"
                      data-wishlist-create="groceries"
                      type="button"
                    >
                      Create
                    </button>
                  </div>
                  <div
                    class="wish-create-panel"
                    hidden=""
                    id="grocery-wishlist-create"
                  ></div>
                  <div class="wish-grid" id="grocery-wishlist"></div>
                </div>
              </div>
            </section>
            <section class="card">
              <div class="card-head">
                <h2>Shopping list</h2>
                <span class="count" id="grocery-count">0</span>
              </div>
              <div class="rows" id="grocery-list"></div>
            </section>
          </section>
          <section class="view" data-panel="plans" hidden="">
            <div class="page-header">
              <div>
                <p class="kicker">MAKE SOMETHING HAPPEN</p>
                <h1>Plans</h1>
                <p>
                  Coordinate the people, costs and things everyone needs to
                  bring.
                </p>
              </div>
              <button class="quick-add" data-modal="plan-modal">
                <svg
                  class="icon-svg sm"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="2"
                  viewbox="0 0 24 24"
                >
                  <path d="M12 5v14M5 12h14"></path></svg
                >Create
              </button>
            </div>
            <div class="plans-search">
              <svg
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-width="1.8"
                viewbox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="6.5"></circle>
                <path d="m16 16 4 4"></path></svg
              ><input
                aria-label="Search plans"
                id="plans-search"
                placeholder="Search plans…"
                type="search"
              />
            </div>
            <div class="plans-tabs" role="tablist">
              <button
                class="plans-tab active"
                data-plan-tab="active"
                type="button"
              >
                Active Plans</button
              ><button class="plans-tab" data-plan-tab="joined" type="button">
                Joined Plans
              </button>
            </div>
            <div class="metric-grid">
              <article>
                <small>ACTIVE</small><strong id="plans-active-count">0</strong>
              </article>
              <article>
                <small>JOINED</small><strong id="plans-joined-count">0</strong>
              </article>
            </div>
            <div class="plans-grid" id="plans-list"></div>
          </section>
          <section class="view" data-panel="requests" hidden="">
            <div class="page-header">
              <div>
                <p class="kicker">ASK A ROOMIE</p>
                <h1>Requests</h1>
                <p>
                  Ask a specific person for help, an item, a pickup, or
                  something needed for a plan.
                </p>
              </div>
              <button class="quick-add" data-modal="request-modal">
                <svg
                  class="icon-svg sm"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="2"
                  viewbox="0 0 24 24"
                >
                  <path d="M12 5v14M5 12h14"></path></svg
                >New request
              </button>
            </div>
            <div class="metric-grid">
              <article>
                <small>FOR YOU</small
                ><strong id="requests-for-you-count">0</strong>
              </article>
              <article>
                <small>SENT BY YOU</small
                ><strong id="requests-sent-count">0</strong>
              </article>
            </div>
            <section class="card">
              <div class="card-head">
                <div>
                  <h2>Active requests</h2>
                  <p class="card-head-copy">
                    Requests stay personal and actionable until they are
                    completed or declined.
                  </p>
                </div>
                <span class="count" id="request-count">0</span>
              </div>
              <div
                class="request-grid"
                id="request-list"
                style="padding: 12px"
              ></div>
            </section>
          </section>
          <section class="view" data-panel="wishlists" hidden="">
            <div class="page-header">
              <div>
                <p class="kicker">THINGS WE WANT</p>
                <h1>Wishlists</h1>
                <p>
                  One place to jump into house wishes, group buys, and shared
                  grocery wants.
                </p>
              </div>
            </div>
            <div class="wishlist-hub-grid">
              <article class="wishlist-hub-card">
                <h3>Expense Wishlist</h3>
                <p>
                  Gifts, flowers, movie nights, parties, gadgets and other
                  shared ideas.
                </p>
                <strong id="wishlist-hub-expense-count">0 active</strong
                ><button
                  class="quick-add"
                  data-open-wishlist="expenses"
                  type="button"
                >
                  Open wishes
                </button>
              </article>
              <article class="wishlist-hub-card">
                <h3>Grocery Wishlist</h3>
                <p>
                  Snacks, BBQ supplies, treats, household items and things
                  someone can pick up.
                </p>
                <strong id="wishlist-hub-grocery-count">0 active</strong
                ><button
                  class="quick-add"
                  data-open-wishlist="groceries"
                  type="button"
                >
                  Open wishes
                </button>
              </article>
            </div>
          </section>
          <section class="view" data-panel="funds" hidden="">
            <div class="page-header">
              <div>
                <p class="kicker">SHARED GOALS</p>
                <h1>Funds</h1>
                <p>Save together for the things the house actually wants.</p>
              </div>
              <button class="quick-add" data-modal="fund-modal">
                <svg
                  class="icon-svg sm"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="2"
                  viewbox="0 0 24 24"
                >
                  <path d="M12 5v14M5 12h14"></path></svg
                >New fund
              </button>
            </div>
            <div class="metric-grid">
              <article>
                <small>ACTIVE GOALS</small
                ><strong id="fund-active-count">0</strong>
              </article>
              <article>
                <small>TOTAL RAISED</small
                ><strong id="fund-total-raised">$0.00</strong>
              </article>
            </div>
            <section class="card">
              <div class="card-head">
                <h2>Fund goals</h2>
                <span class="count" id="fund-count">0</span>
              </div>
              <div id="fund-list"></div>
            </section>
          </section>
          <section class="view" data-panel="reports" hidden="">
            <div class="page-header">
              <div>
                <p class="kicker">TRUSTED SPENDING</p>
                <h1>Spending reports</h1>
                <p>
                  See verified household spending by week, month, category and
                  roomie, then export a clean report.
                </p>
              </div>
              <div class="report-export">
                <button class="primary" data-report-export="xlsx" type="button">
                  Export XLSX</button
                ><button data-report-export="pdf" type="button">
                  Export PDF
                </button>
              </div>
            </div>
            <div class="reports-toolbar">
              <select aria-label="Report range" id="report-range">
                <option value="week">This week</option>
                <option selected="" value="month">This month</option>
                <option value="3months">Last 3 months</option>
                <option value="year">This year</option>
                <option value="custom">Custom dates</option>
              </select>
              <div class="reports-custom" hidden="" id="report-custom">
                <input
                  aria-label="Report start date"
                  id="report-start"
                  type="date"
                /><input
                  aria-label="Report end date"
                  id="report-end"
                  type="date"
                />
              </div>
            </div>
            <div class="report-summary">
              <article>
                <small>Verified spend</small
                ><strong id="report-total">$0.00</strong>
              </article>
              <article>
                <small>Expenses</small><strong id="report-count">0</strong>
              </article>
              <article>
                <small>Daily average</small
                ><strong id="report-average">$0.00</strong>
              </article>
            </div>
            <div class="report-layout">
              <section class="card">
                <div class="card-head">
                  <div>
                    <h2>By category</h2>
                    <p class="card-head-copy">
                      Where the household money went.
                    </p>
                  </div>
                </div>
                <div class="report-breakdown" id="report-categories"></div>
              </section>
              <section class="card">
                <div class="card-head">
                  <div>
                    <h2>By roomie</h2>
                    <p class="card-head-copy">
                      Verified payments made by each person.
                    </p>
                  </div>
                </div>
                <div class="report-breakdown" id="report-roomies"></div>
              </section>
            </div>
            <section class="card">
              <div class="card-head">
                <div>
                  <h2>Expense detail</h2>
                  <p class="card-head-copy" id="report-period-label">
                    Current period
                  </p>
                </div>
              </div>
              <div class="report-table-wrap">
                <table class="report-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Paid by</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody id="report-rows"></tbody>
                </table>
              </div>
            </section>
            <p class="report-trust-note">
              Reports include verified/approved household expenses only. Pending
              payment claims are excluded until approval.
            </p>
          </section>
          <section class="view" data-panel="roomies" hidden="">
            <div class="page-header">
              <div>
                <p class="kicker">THE HOUSE</p>
                <h1>Roomies</h1>
                <p>
                  Everyone connected to this crib and what they have going on.
                </p>
              </div>
              <a class="quick-add link-button" href="https://t.me/Cribbit_bot"
                >Invite in Telegram ↗</a
              >
            </div>
            <div class="roomie-grid" id="roomie-grid"></div>
          </section>
          <section class="view" data-panel="activity" hidden="">
            <div class="page-header">
              <div>
                <p class="kicker">ONE SHARED PULSE</p>
                <h1>Activity</h1>
                <p>A calm, chronological record of what changed.</p>
              </div>
            </div>
            <section class="card">
              <div class="card-head">
                <h2>House activity</h2>
                <span class="count" id="activity-count">0</span>
              </div>
              <div class="timeline" id="activity-list"></div>
            </section>
          </section>
          <section class="view" data-panel="settings" hidden="">
            <div class="page-header">
              <div>
                <p class="kicker">MAKE IT YOURS</p>
                <h1 data-i18n="navigation.settings">Settings</h1>
                <p>
                  House defaults and the notifications that keep everyone
                  aligned.
                </p>
              </div>
            </div>
            <form class="settings-grid" id="settings-form">
              <section class="card">
                <h2 data-i18n="settings.house">House</h2>
                <div class="setting-action">
                  <span
                    ><b>Active Crib</b
                    ><small id="settings-house-name">My Crib</small></span
                  ><button
                    class="secondary-button"
                    id="settings-switch-crib"
                    type="button"
                  >
                    Switch Crib
                  </button>
                </div>
                <label
                  ><span data-i18n="settings.houseName">House name</span
                  ><input maxlength="80" name="houseName" /></label
                ><label
                  ><span data-i18n="settings.currency">Default currency</span
                  ><select name="currency">
                    <option>USD</option>
                    <option>GBP</option>
                    <option>EUR</option>
                    <option>NGN</option>
                    <option>CAD</option>
                    <option>AUD</option>
                  </select></label
                ><label
                  ><span data-i18n="settings.timezone">Time zone</span
                  ><input name="timezone" placeholder="Africa/Lagos" /></label
                ><label
                  ><span data-i18n="settings.language">Language</span
                  ><select id="locale-select" name="locale">
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="ar">العربية</option>
                  </select></label
                ><label id="house-locale-row"
                  ><span data-i18n="settings.houseLanguage"
                    >Default language</span
                  ><select name="defaultLocale">
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="ar">العربية</option></select
                  ><small data-i18n="settings.houseLanguageHelp"
                    >Controls shared messages posted in Telegram groups.</small
                  ></label
                >
              </section>
              <section class="card">
                <h2>Crib mode</h2>
                <p>
                  Choose the personality that best matches this crib. Each mode
                  keeps Cribbit’s main theme while adding its own tone,
                  vocabulary, and shortcuts.
                </p>
                <div class="mode-card-grid" id="mode-picker"></div>
              </section>
              <section class="card">
                <h2 data-i18n="settings.notifications">Notifications</h2>
                <label class="toggle-row"
                  ><span
                    ><b>Telegram notifications</b
                    ><small>Post neutral house updates</small></span
                  ><input name="notifications" type="checkbox" /></label
                ><label class="toggle-row"
                  ><span
                    ><b>Weekly CribCheck</b
                    ><small>Weekly household summary</small></span
                  ><input name="weeklyDigest" type="checkbox" /></label
                ><label
                  >Quiet hours<input
                    name="quietHours"
                    placeholder="22:00–08:00"
                /></label>
              </section>
              <button
                class="primary-button save-settings"
                data-i18n="settings.save"
                type="submit"
              >
                Save settings
              </button>
            </form>
          </section>
        </main>
      </div>
      <nav aria-label="Mobile navigation" class="bottom-nav">
        <button class="active" data-view="overview">
          <span
            ><svg
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.9"
              viewbox="0 0 24 24"
            >
              <path d="M4 10.5 12 4l8 6.5V20H4z"></path>
              <path d="M9.5 20v-6h5v6"></path></svg></span
          >Home
        </button>
        <button data-view="expenses">
          <span
            ><svg
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.9"
              viewbox="0 0 24 24"
            >
              <rect height="12" rx="2" width="17" x="3.5" y="6"></rect>
              <path d="M7 9.5h.01M17 14.5h.01"></path>
              <circle cx="12" cy="12" r="2.6"></circle>
              <path
                d="M12 10.5v3M11.15 11h1.35c.55 0 1 .34 1 .76 0 .42-.45.76-1 .76h-1c-.55 0-1 .34-1 .76 0 .42.45.76 1 .76h1.35"
              ></path></svg></span
          >Expenses
        </button>
        <button data-view="chores">
          <span
            ><svg
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.35"
              viewbox="0 0 24 24"
            >
              <path d="m5.5 12.5 4 4 9-10"></path></svg></span
          >Chores
        </button>
        <button data-view="groceries">
          <span
            ><svg
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.9"
              viewbox="0 0 24 24"
            >
              <path d="M3.5 5h2l1.6 9.2h10.8l1.6-6.3H6.2"></path>
              <circle cx="9" cy="18" r="1.2"></circle>
              <circle cx="17" cy="18" r="1.2"></circle></svg></span
          >Groceries
        </button>
        <button data-view="plans">
          <span
            ><svg
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.65"
              viewbox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="8.5"></circle>
              <circle cx="12" cy="12" r="5.3"></circle>
              <circle cx="12" cy="12" r="2.2"></circle>
              <path d="M12 3.5v17M9.5 5.1h5M9.8 18.8h4.4"></path></svg></span
          >Plans
        </button>
      </nav>
    </div>
    <div class="more-menu" hidden="" id="more-menu">
      <button data-view="requests">
        <svg
          class="icon-svg sm"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.8"
          viewbox="0 0 24 24"
        >
          <path d="M5 5.5h14v10H9l-4 3z"></path>
          <path d="M9 9h6M9 12h4"></path></svg
        >Requests
      </button>
      <button data-view="wishlists">
        <svg
          class="icon-svg sm"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.8"
          viewbox="0 0 24 24"
        >
          <path
            d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"
          ></path></svg
        >Wishlists
      </button>
      <button data-view="roomies">
        <svg
          class="icon-svg sm"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-width="1.8"
          viewbox="0 0 24 24"
        >
          <circle cx="9" cy="8" r="3"></circle>
          <path
            d="M3.8 19v-1.2A4.8 4.8 0 0 1 8.6 13h.8a4.8 4.8 0 0 1 4.8 4.8V19M15 6.2a2.8 2.8 0 0 1 0 5.6M16.3 13.3a4.3 4.3 0 0 1 3.9 4.3V19"
          ></path></svg
        >Roomies
      </button>
      <button data-view="activity">
        <svg
          class="icon-svg sm"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-width="1.8"
          viewbox="0 0 24 24"
        >
          <path d="M4 12h3l2-5 4 10 2-5h5"></path></svg
        >Activity
      </button>
      <button data-view="funds">
        <svg
          class="icon-svg sm"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.8"
          viewbox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="7.5"></circle>
          <path d="M12 8v8M8 12h8"></path></svg
        >Funds
      </button>
      <button data-view="settings">
        <svg
          class="icon-svg sm"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.8"
          viewbox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="3"></circle>
          <path
            d="M19 13.4v-2.8l-2-.7a6.6 6.6 0 0 0-.7-1.7l.9-1.9-2-2-1.9.9a6.6 6.6 0 0 0-1.7-.7l-.7-2H8.1l-.7 2a6.6 6.6 0 0 0-1.7.7l-1.9-.9-2 2 .9 1.9a6.6 6.6 0 0 0-.7 1.7l-2 .7v2.8l2 .7c.15.6.4 1.2.7 1.7l-.9 1.9 2 2 1.9-.9c.5.3 1.1.55 1.7.7l.7 2h2.8l.7-2c.6-.15 1.2-.4 1.7-.7l1.9.9 2-2-.9-1.9c.3-.5.55-1.1.7-1.7z"
          ></path></svg
        >Settings
      </button>
    </div>
    <div class="notification-scrim" id="notification-scrim"></div>
    <aside
      aria-hidden="true"
      aria-label="Personal notifications"
      class="notification-popover"
      id="notification-popover"
    >
      <div class="notification-head">
        <div>
          <h3>Notifications</h3>
          <p>Only things that involve you or need your attention.</p>
        </div>
        <button id="notification-read-all" type="button">Mark all read</button>
      </div>
      <div class="notification-list" id="personal-notification-list"></div>
    </aside>
    <div
      aria-live="polite"
      class="toast"
      hidden=""
      id="toast"
      role="status"
    ></div>
    <dialog id="crib-switcher-modal">
      <div class="crib-switcher-shell">
        <div class="modal-head">
          <div>
            <p class="kicker">YOUR CRIBS</p>
            <h2>Switch Crib</h2>
          </div>
          <button aria-label="Close" data-close="" type="button">
            <svg
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-width="2"
              viewbox="0 0 24 24"
            >
              <path d="m7 7 10 10M17 7 7 17"></path>
            </svg>
          </button>
        </div>
        <p>Choose one of your active Telegram group houses.</p>
        <div class="house-selector" id="crib-switcher-list"></div>
      </div>
    </dialog>
    <dialog id="expense-modal">
      <form id="expense-form" method="dialog">
        <div class="modal-head">
          <div>
            <p class="kicker">VERIFIED PAYMENT</p>
            <h2>Log a paid expense</h2>
          </div>
          <button aria-label="Close" data-close="" type="button">
            <svg
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-width="2"
              viewbox="0 0 24 24"
            >
              <path d="m7 7 10 10M17 7 7 17"></path>
            </svg>
          </button>
        </div>
        <div class="receipt-upload">
          <div class="receipt-upload-head">
            <div>
              <strong>Receipt required</strong
              ><small>Choose how you want to add the receipt.</small>
            </div>
          </div>
          <div class="receipt-source-grid">
            <button
              class="receipt-source"
              id="take-receipt-photo"
              type="button"
            >
              <span
                ><svg
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.7"
                  viewbox="0 0 24 24"
                >
                  <path d="M4 7h3l1.5-2h7L17 7h3v12H4z"></path>
                  <circle cx="12" cy="13" r="3.5"></circle></svg
                ><b>Take Photo</b><small>Open the device camera</small></span
              ></button
            ><button
              class="receipt-source"
              id="upload-receipt-photo"
              type="button"
            >
              <span
                ><svg
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.7"
                  viewbox="0 0 24 24"
                >
                  <path d="M12 4v11M8 8l4-4 4 4"></path>
                  <path d="M5 14v5h14v-5"></path></svg
                ><b>Upload Receipt</b
                ><small>Choose from gallery or files</small></span
              ></button
            ><input
              accept="image/*"
              capture="environment"
              class="receipt-hidden-input"
              id="expense-receipt-camera"
              type="file"
            /><input
              accept="image/*"
              class="receipt-hidden-input"
              id="expense-receipt"
              name="receipt"
              type="file"
            />
            <div class="receipt-preview" id="receipt-preview">
              <img alt="Receipt preview" id="receipt-preview-image" />
              <div class="receipt-scan-copy">
                <strong id="receipt-file-name">Receipt selected</strong
                ><small id="receipt-scan-summary">Ready to scan locally.</small>
                <div class="receipt-scan-actions">
                  <button
                    class="secondary-button"
                    id="scan-receipt"
                    type="button"
                  >
                    Scan receipt</button
                  ><button
                    class="secondary-button"
                    id="cloud-scan-receipt"
                    type="button"
                  >
                    Improve scan
                  </button>
                </div>
              </div>
            </div>
            <div class="ocr-status" id="ocr-status">
              <i></i><span>Upload a receipt to begin.</span>
            </div>
            <div class="ocr-items" id="ocr-items">
              <div class="ocr-items-head">
                <strong>Items detected</strong
                ><span class="approval-pill pending" id="ocr-confidence"
                  >Review</span
                >
              </div>
              <div class="ocr-items-list" id="ocr-items-list"></div>
            </div>
          </div>
          <label
            >Description<input
              id="expense-description"
              maxlength="160"
              name="description"
              placeholder="Pizza, Wi-Fi, cleaning supplies…"
              required=""
          /></label>
          <div class="form-row">
            <label
              >Amount<input
                id="expense-amount"
                inputmode="decimal"
                min="0.01"
                name="amount"
                placeholder="0.00"
                required=""
                step="0.01"
                type="number" /></label
            ><label
              >Category<select id="expense-category" name="category">
                <option>Other</option>
                <option>Groceries</option>
                <option>Rent</option>
                <option>Utilities</option>
                <option>Dining</option>
                <option>Household</option>
              </select></label
            >
          </div>
          <label
            >Paid by<select id="expense-payer" name="paidBy"></select></label
          ><label
            >Notes<textarea
              maxlength="500"
              name="notes"
              placeholder="Optional note"
            ></textarea></label
          ><input
            id="expense-receipt-text"
            name="receiptText"
            type="hidden"
          /><input
            id="expense-receipt-confidence"
            name="receiptConfidence"
            type="hidden"
          />
          <div class="verified-note">
            <svg
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.8"
              viewbox="0 0 24 24"
            >
              <path
                d="M12 3 4.5 6v5.5c0 4.5 3 7.6 7.5 9.5 4.5-1.9 7.5-5 7.5-9.5V6z"
              ></path>
              <path d="m9 12 2 2 4-4"></path></svg
            ><span
              >The expense can be recorded immediately, but your
              <strong>payment claim</strong> stays Pending Review and does not
              affect balances until a house admin verifies the receipt.</span
            >
          </div>
          <div class="modal-actions">
            <button class="secondary-button" data-close="" type="button">
              Cancel</button
            ><button class="primary-button" type="submit">
              Submit payment claim
            </button>
          </div>
        </div>
      </form>
    </dialog>
    <dialog id="expense-reject-modal">
      <form id="expense-reject-form" method="dialog">
        <div class="modal-head">
          <div>
            <p class="kicker">REJECT PAYMENT</p>
            <h2>Tell them what needs fixing</h2>
          </div>
          <button aria-label="Close" data-close="" type="button">
            <svg
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-width="2"
              viewbox="0 0 24 24"
            >
              <path d="m7 7 10 10M17 7 7 17"></path>
            </svg>
          </button>
        </div>
        <input id="reject-claim-id" name="claimId" type="hidden" /><label
          >Comment<textarea
            maxlength="300"
            name="comment"
            placeholder="Example: The total does not match the receipt."
            required=""
          ></textarea>
        </label>
        <div class="modal-actions">
          <button class="secondary-button" data-close="" type="button">
            Cancel</button
          ><button
            class="primary-button"
            style="background: var(--danger)"
            type="submit"
          >
            Reject payment
          </button>
        </div>
      </form>
    </dialog>
    <dialog id="chore-review-modal">
      <form id="chore-review-form" method="dialog">
        <div class="modal-head">
          <div>
            <p class="kicker">CHORE REVIEW</p>
            <h2>Tell them what needs fixing</h2>
          </div>
          <button aria-label="Close" data-close="" type="button">
            <svg
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-width="2"
              viewbox="0 0 24 24"
            >
              <path d="m7 7 10 10M17 7 7 17"></path>
            </svg>
          </button>
        </div>
        <input id="review-chore-id" name="choreId" type="hidden" /><label
          >What is missing?<textarea
            maxlength="300"
            name="comment"
            placeholder="Example: Please wipe the counters too."
            required=""
          ></textarea>
        </label>
        <p
          style="
            margin: 6px 0 0;
            color: var(--muted);
            font-size: 10px;
            line-height: 1.45;
          "
        >
          The chore returns to the person as <strong>Needs Fixing</strong>. They
          can correct it and resubmit for review.
        </p>
        <div class="modal-actions">
          <button class="secondary-button" data-close="" type="button">
            Cancel</button
          ><button
            class="primary-button"
            style="background: var(--danger)"
            type="submit"
          >
            Send feedback
          </button>
        </div>
      </form>
    </dialog>
    <dialog id="plan-modal">
      <form id="plan-form" method="dialog">
        <div class="modal-head">
          <div>
            <p class="kicker">NEW PLAN</p>
            <h2>Create a plan</h2>
          </div>
          <button aria-label="Close" data-close="" type="button">
            <svg
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-width="2"
              viewbox="0 0 24 24"
            >
              <path d="m7 7 10 10M17 7 7 17"></path>
            </svg>
          </button>
        </div>
        <label
          >Plan title<input
            maxlength="100"
            name="title"
            placeholder="Saturday BBQ"
            required=""
        /></label>
        <label
          >Plan type<select id="plan-type" name="type">
            <optgroup label="Social">
              <option>House Party</option>
              <option>Dinner</option>
              <option>Brunch</option>
              <option>Movie Night</option>
              <option>Game Night</option>
              <option>Night Out</option>
              <option>Ladies’ Night</option>
              <option>Guys’ Night</option>
              <option>Birthday</option>
              <option>Celebration</option>
              <option>Date Night</option>
              <option>Meetup</option>
            </optgroup>
            <optgroup label="Travel &amp; Outdoors">
              <option>Vacation</option>
              <option>Weekend Trip</option>
              <option>Road Trip</option>
              <option>Day Trip</option>
              <option>Beach Day</option>
              <option>Camping</option>
              <option>Hiking</option>
              <option>Picnic</option>
              <option>Festival</option>
              <option>Concert</option>
            </optgroup>
            <optgroup label="Sports &amp; Fitness">
              <option>Sporting Event</option>
              <option>Sports Activity</option>
              <option>Training Session</option>
              <option>Gym Session</option>
              <option>Running</option>
              <option>Cycling</option>
              <option>Football / Soccer</option>
              <option>Basketball</option>
              <option>Tennis</option>
              <option>Padel</option>
              <option>Swimming</option>
              <option>Sport Partner / Training Buddy</option>
            </optgroup>
            <optgroup label="Home &amp; Community">
              <option>House Dinner</option>
              <option>BBQ</option>
              <option>Cleaning Day</option>
              <option>Moving Day</option>
              <option>Shopping Trip</option>
              <option>DIY Project</option>
              <option>Study Session</option>
              <option>Work Session</option>
              <option>Community Event</option>
            </optgroup>
            <optgroup label="Other"><option>Custom</option></optgroup>
          </select></label
        >
        <label class="custom-type-row" hidden="" id="plan-custom-type-row"
          >Custom plan type<input
            maxlength="60"
            name="customType"
            placeholder="What kind of plan is it?"
        /></label>
        <div class="form-row">
          <label>Date<input name="date" required="" type="date" /></label
          ><label>Time<input name="time" type="time" /></label>
        </div>
        <label
          >Location<input
            maxlength="120"
            name="location"
            placeholder="Backyard, cinema, beach…"
        /></label>
        <label
          >Description<textarea
            maxlength="500"
            name="description"
            placeholder="What should everyone know?"
          ></textarea>
        </label>
        <div class="plan-form-section">
          <strong>Cost</strong>
          <div class="cost-picker">
            <label class="cost-option"
              ><input
                checked=""
                name="costMode"
                type="radio"
                value="free"
              /><span><b>Free</b><small>No shared expenses</small></span></label
            ><label class="cost-option"
              ><input name="costMode" type="radio" value="shared" /><span
                ><b>Shared Cost</b><small>Split plan expenses</small></span
              ></label
            >
          </div>
        </div>
        <label class="budget-row" hidden="" id="plan-budget-row"
          >Estimated budget<input
            inputmode="decimal"
            min="0"
            name="estimatedBudget"
            placeholder="Optional"
            step="0.01"
            type="number"
        /></label>
        <div class="plan-form-section">
          <strong>Things to bring</strong>
          <div class="bring-builder">
            <input
              id="plan-bring-input"
              maxlength="80"
              placeholder="Ice, drinks, speaker…"
              type="text"
            /><button id="plan-bring-add" type="button">Add item</button>
          </div>
          <div id="plan-bring-list"></div>
        </div>
        <div class="modal-actions">
          <button class="secondary-button" data-close="" type="button">
            Cancel</button
          ><button class="primary-button" type="submit">Create Plan</button>
        </div>
      </form>
    </dialog>
    <dialog id="fund-modal">
      <form id="fund-form" method="dialog">
        <div class="modal-head">
          <div>
            <p class="kicker">NEW FUND</p>
            <h2>Create a shared goal</h2>
          </div>
          <button aria-label="Close" data-close="" type="button">
            <svg
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-width="2"
              viewbox="0 0 24 24"
            >
              <path d="m7 7 10 10M17 7 7 17"></path>
            </svg>
          </button>
        </div>
        <label
          >Goal name<input
            maxlength="80"
            name="title"
            placeholder="New kettle, game console, trip…"
            required="" /></label
        ><label
          >Target amount<input
            inputmode="decimal"
            min="1"
            name="goal"
            placeholder="100.00"
            required=""
            step="0.01"
            type="number"
        /></label>
        <div class="modal-actions">
          <button class="secondary-button" data-close="" type="button">
            Cancel</button
          ><button class="primary-button" type="submit">Create fund</button>
        </div>
      </form>
    </dialog>
    <dialog id="chipin-modal">
      <form id="chipin-form" method="dialog">
        <div class="modal-head">
          <div>
            <p class="kicker">CHIP IN</p>
            <h2 id="chipin-title">Add to this goal</h2>
          </div>
          <button aria-label="Close" data-close="" type="button">
            <svg
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-width="2"
              viewbox="0 0 24 24"
            >
              <path d="m7 7 10 10M17 7 7 17"></path>
            </svg>
          </button>
        </div>
        <input id="chipin-fund-id" name="fundId" type="hidden" /><label
          >Amount<input
            inputmode="decimal"
            min="0.01"
            name="amount"
            placeholder="10.00"
            required=""
            step="0.01"
            type="number"
        /></label>
        <div class="modal-actions">
          <button class="secondary-button" data-close="" type="button">
            Cancel</button
          ><button class="primary-button" type="submit">Chip in</button>
        </div>
      </form>
    </dialog>
    <dialog id="wishlist-chipin-modal">
      <form id="wishlist-chipin-form" method="dialog">
        <div class="modal-head">
          <div>
            <p class="kicker">CHIP IN</p>
            <h2 id="wishlist-chipin-title">Add to this wish</h2>
          </div>
          <button aria-label="Close" data-close="" type="button">
            <svg
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-width="2"
              viewbox="0 0 24 24"
            >
              <path d="m7 7 10 10M17 7 7 17"></path>
            </svg>
          </button>
        </div>
        <input id="wishlist-chipin-id" name="wishId" type="hidden" /><label
          >Amount<input
            autocomplete="off"
            inputmode="decimal"
            min="0.01"
            name="amount"
            placeholder="10.00"
            required=""
            step="0.01"
            type="number"
        /></label>
        <p
          style="
            margin: 8px 0 0;
            color: var(--muted);
            font-size: 11px;
            line-height: 1.45;
          "
        >
          Chipping in is voluntary and does not create a debt.
        </p>
        <div class="modal-actions">
          <button class="secondary-button" data-close="" type="button">
            Cancel</button
          ><button class="primary-button" type="submit">Chip in</button>
        </div>
      </form>
    </dialog>
    <dialog id="request-modal">
      <form id="request-form" method="dialog">
        <div class="modal-head">
          <div>
            <p class="kicker">NEW REQUEST</p>
            <h2>Ask a roomie</h2>
          </div>
          <button aria-label="Close" data-close="" type="button">
            <svg
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-width="2"
              viewbox="0 0 24 24"
            >
              <path d="m7 7 10 10M17 7 7 17"></path>
            </svg>
          </button>
        </div>
        <label
          >Send to<select id="request-to" name="to" required=""></select></label
        ><label
          >Type<select name="type">
            <option value="bring">Bring something</option>
            <option value="help">Help / favor</option>
            <option value="grocery">Pick something up</option>
            <option value="chore">House task</option>
            <option value="plan">Plan help</option>
            <option value="other">Other</option>
          </select></label
        ><label
          >What do you need?<textarea
            maxlength="240"
            name="message"
            placeholder="Example: Can you bring the cooler to Beach Day?"
            required=""
          ></textarea>
        </label>
        <div class="form-row">
          <label>Due date<input name="dueDate" type="date" /></label
          ><label
            >Related to<select id="request-related" name="relatedEntity">
              <option value="">Nothing specific</option></select
            ><small
              >Attach this request to something active or upcoming so the
              recipient gets the full context.</small
            ></label
          >
        </div>
        <div class="modal-actions">
          <button class="secondary-button" data-close="" type="button">
            Cancel</button
          ><button class="primary-button" type="submit">Send request</button>
        </div>
      </form>
    </dialog>
    <dialog id="chore-modal">
      <form id="chore-form" method="dialog">
        <div class="modal-head">
          <div>
            <p class="kicker">NEW CHORE</p>
            <h2>Add a house task</h2>
          </div>
          <button aria-label="Close" data-close="" type="button">
            <svg
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-width="2"
              viewbox="0 0 24 24"
            >
              <path d="m7 7 10 10M17 7 7 17"></path>
            </svg>
          </button>
        </div>
        <label
          >Chore title<input
            maxlength="160"
            name="task"
            placeholder="Clean the kitchen"
            required="" /></label
        ><label
          >Assign to<select id="chore-assignee" name="assignedTo">
            <option value="">Unassigned</option>
          </select></label
        >
        <div class="form-row">
          <label>Due date<input name="dueDate" type="date" /></label
          ><label
            >Priority<select name="priority">
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select></label
          >
        </div>
        <div class="modal-actions">
          <button class="secondary-button" data-close="" type="button">
            Cancel</button
          ><button class="primary-button" type="submit">Add chore</button>
        </div>
      </form>
    </dialog>
  </body>
</html>
`;

document.open();
document.write(shellHtml);
document.close();

export {};
