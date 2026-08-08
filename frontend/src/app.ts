// @ts-nocheck

import { preferredHouseId, resolveApiBaseUrl } from "./config";
import { runFormSubmission } from "./forms";

const telegram = window.Telegram?.WebApp;
telegram?.ready();
telegram?.expand();
const query = new URLSearchParams(location.search);
let chatId = query.get("chatId");
const demoMode = query.get("demo") === "1" || import.meta.env.DEV;
const apiBaseUrl = resolveApiBaseUrl(
  query.get("apiBaseUrl") || import.meta.env.VITE_API_BASE_URL,
  location.origin,
);
const initData = telegram?.initData || "";
const startParam = telegram?.initDataUnsafe?.start_param || query.get("startapp") || query.get("start_param");
function parseLaunchChatId(raw) {
  const value = String(raw || "").trim();
  if (!value) return null;
  try {
    const decoded = decodeURIComponent(value);
    if (/^-?\d+$/.test(decoded)) return decoded;
    const compact = decoded.match(/^(?:chatId|chat|house)=(.+)$/i);
    if (compact?.[1]) return compact[1].trim() || null;
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.chatId !== "undefined") return String(parsed.chatId).trim() || null;
  } catch {
    /* ignored: malformed launch context falls back to normal house discovery */
  }
  return null;
}
const launchChatId = parseLaunchChatId(startParam);
if (!chatId && launchChatId) chatId = launchChatId;
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
let data = null;
let availableHouses = [];
let switchingCrib = false;
let currentView = query.get("view") || location.hash.slice(1) || "overview";
const i18n = window.CribbitI18n;
const t = (key, variables) => i18n.t(key, variables);
async function apiFetch(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === "AbortError")
      throw new Error("Cribbit took too long to respond. Please try again.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

const demoData = {
  viewer: { displayName: "Alex", role: "owner", locale: "en" },
  locale: "en",
  settings: {
    houseName: "Oak Street",
    currency: "USD",
    timezone: "America/New_York",
    notifications: true,
    weeklyDigest: true,
    quietHours: "22:00–08:00",
    defaultLocale: "en",
  },
  members: [
    {
      id: "m1",
      displayName: "Alex",
      username: "@alex",
      role: "owner",
      active: true,
      joinedAt: "2026-07-01",
    },
    {
      id: "m2",
      displayName: "Maya",
      username: "@maya",
      role: "admin",
      active: true,
      joinedAt: "2026-07-02",
    },
    {
      id: "m3",
      displayName: "Noah",
      username: "@noah",
      role: "member",
      active: true,
      joinedAt: "2026-07-03",
    },
  ],
  expenses: [
    {
      id: "e1",
      description: "August rent",
      paidBy: "Maya",
      amountCents: 126000,
      amount: 1260,
      category: "Rent",
      participants: ["Alex", "Maya", "Noah"],
      createdAt: "2026-08-03T09:00:00Z",
    },
    {
      id: "e2",
      description: "Groceries",
      paidBy: "Alex",
      amountCents: 8600,
      amount: 86,
      category: "Groceries",
      participants: ["Alex", "Maya", "Noah"],
      createdAt: "2026-08-04T16:30:00Z",
    },
    {
      id: "e3",
      description: "Wi-Fi",
      paidBy: "Noah",
      amountCents: 4800,
      amount: 48,
      category: "Utilities",
      participants: ["Alex", "Maya", "Noah"],
      createdAt: "2026-08-01T12:00:00Z",
    },
  ],
  balances: {
    totalSpentCents: 139400,
    totalSpent: 1394,
    memberCount: 3,
    netCents: { Alex: -39134, Maya: 79533, Noah: -40399 },
    settlements: [
      { from: "Noah", to: "Maya", amountCents: 40399, amount: 403.99 },
      { from: "Alex", to: "Maya", amountCents: 39134, amount: 391.34 },
    ],
  },
  settlementRequests: [],
  expenseClaims: [
    {
      id: "xc1",
      description: "Party supplies",
      paidBy: "Noah",
      amountCents: 7250,
      category: "Household",
      notes: "Cups, plates and ice",
      receiptUrl: "",
      receiptText:
        "PARTY MART\nCups 22.50\nPlates 18.00\nIce 10.00\nDecor 21.00\nTOTAL 72.50",
      receiptItems: [
        { name: "Cups", amountCents: 2250 },
        { name: "Plates", amountCents: 1800 },
        { name: "Ice", amountCents: 1000 },
        { name: "Decor", amountCents: 2100 },
      ],
      status: "pending",
      submittedAt: "2026-08-06T18:20:00Z",
      submittedBy: "Noah",
    },
    {
      id: "xc2",
      description: "Breakfast groceries",
      paidBy: "Maya",
      amountCents: 2840,
      category: "Groceries",
      notes: "",
      receiptUrl: "",
      receiptText: "MARKET\nTOTAL 28.40",
      receiptItems: [],
      status: "pending",
      submittedAt: "2026-08-07T08:10:00Z",
      submittedBy: "Maya",
    },
  ],
  chores: [
    {
      id: "c1",
      task: "Clean the kitchen",
      assignedTo: "Maya",
      dueDate: "2026-08-06",
      priority: "high",
      done: false,
      status: "open",
      createdAt: "2026-08-04T10:00:00Z",
    },
    {
      id: "c2",
      task: "Take out recycling",
      assignedTo: "Alex",
      dueDate: "2026-08-07",
      priority: "normal",
      done: false,
      status: "pending_review",
      submittedBy: "Alex",
      submittedAt: "2026-08-07T10:30:00Z",
      createdAt: "2026-08-04T10:20:00Z",
    },
    {
      id: "c3",
      task: "Water the plants",
      assignedTo: "Noah",
      done: true,
      status: "verified_completed",
      doneBy: "Noah",
      verifiedBy: "Maya",
      verifiedAt: "2026-08-04T19:30:00Z",
      createdAt: "2026-08-02T10:00:00Z",
    },
    {
      id: "c4",
      task: "Wipe dining table",
      assignedTo: "Maya",
      dueDate: "2026-08-07",
      priority: "normal",
      done: false,
      status: "needs_fixing",
      reviewComment: "Please wipe underneath the placemats too.",
      reviewedBy: "Alex",
      reviewedAt: "2026-08-07T09:10:00Z",
      createdAt: "2026-08-06T12:00:00Z",
    },
  ],
  groceries: [
    {
      id: "g1",
      name: "Oat milk",
      quantity: "2",
      category: "Dairy",
      priority: "urgent",
      addedBy: "Maya",
      purchased: false,
      createdAt: "2026-08-05T08:00:00Z",
    },
    {
      id: "g2",
      name: "Pasta",
      quantity: "1",
      category: "Pantry",
      priority: "normal",
      addedBy: "Alex",
      purchased: false,
      createdAt: "2026-08-05T09:00:00Z",
    },
    {
      id: "g3",
      name: "Dish soap",
      quantity: "1",
      category: "Household",
      priority: "normal",
      addedBy: "Noah",
      purchased: true,
      purchasedBy: "Noah",
      createdAt: "2026-08-03T09:00:00Z",
    },
  ],
  funds: [
    {
      id: "f1",
      title: "New kettle",
      goalCents: 12000,
      contributions: [
        { user: "Alex", amountCents: 2500 },
        { user: "Maya", amountCents: 3000 },
      ],
      status: "open",
      createdAt: "2026-08-02T12:00:00Z",
    },
    {
      id: "f2",
      title: "Living room projector",
      goalCents: 45000,
      contributions: [
        { user: "Noah", amountCents: 6000 },
        { user: "Alex", amountCents: 4000 },
      ],
      status: "open",
      createdAt: "2026-08-01T12:00:00Z",
    },
  ],
  plans: [
    {
      id: "p1",
      title: "Saturday BBQ",
      type: "BBQ",
      description: "Easy backyard dinner before sunset.",
      location: "Backyard",
      startsAt: "2026-08-09T17:00:00Z",
      costMode: "shared",
      estimatedBudgetCents: 12000,
      status: "active",
      createdBy: "Alex",
      participants: ["Alex", "Maya"],
      bringItems: [
        { id: "bi1", name: "Ice", claimedBy: null },
        { id: "bi2", name: "Drinks", claimedBy: "Maya" },
        { id: "bi3", name: "Speaker", claimedBy: "Alex" },
      ],
    },
    {
      id: "p2",
      title: "Movie Night",
      type: "Movie Night",
      description: "Pick the movie when everyone arrives.",
      location: "Living room",
      startsAt: "2026-08-08T20:00:00Z",
      costMode: "free",
      status: "active",
      createdBy: "Maya",
      participants: ["Alex", "Maya", "Noah"],
      bringItems: [
        { id: "bi4", name: "Popcorn", claimedBy: null },
        { id: "bi5", name: "Drinks", claimedBy: "Noah" },
      ],
    },
    {
      id: "p3",
      title: "Beach Day",
      type: "Beach Day",
      description: "Morning swim and lunch.",
      location: "Brighton Beach",
      startsAt: "2026-08-23T10:00:00Z",
      costMode: "shared",
      estimatedBudgetCents: 9000,
      status: "active",
      createdBy: "Noah",
      participants: ["Maya", "Noah"],
      bringItems: [
        { id: "bi6", name: "Blanket", claimedBy: "Maya" },
        { id: "bi7", name: "Sunscreen", claimedBy: null },
      ],
    },
  ],
  wishlists: [
    {
      id: "w1",
      area: "expenses",
      title: "Movie night projector rental",
      category: "Movie Night",
      createdBy: "Maya",
      targetCents: 6500,
      participants: ["Maya", "Alex"],
      contributions: [
        { user: "Maya", amountCents: 1500 },
        { user: "Alex", amountCents: 1000 },
      ],
      status: "open",
    },
    {
      id: "w2",
      area: "expenses",
      title: "Flowers for the dinner table",
      category: "Flowers",
      createdBy: "Alex",
      targetCents: 4000,
      participants: ["Alex"],
      contributions: [],
      status: "open",
    },
    {
      id: "w3",
      area: "groceries",
      title: "BBQ weekend supplies",
      category: "BBQ",
      createdBy: "Noah",
      targetCents: 8000,
      participants: ["Noah", "Maya"],
      contributions: [{ user: "Noah", amountCents: 2000 }],
      status: "open",
    },
    {
      id: "w4",
      area: "groceries",
      title: "Movie snacks",
      category: "Snacks",
      createdBy: "Maya",
      targetCents: 0,
      participants: ["Maya"],
      contributions: [],
      status: "open",
    },
  ],
  requests: [
    {
      id: "r1",
      from: "Maya",
      to: "Alex",
      type: "bring",
      message: "Can you bring the cooler to Beach Day?",
      planId: "p3",
      dueDate: "2026-08-23",
      status: "open",
      createdAt: "2026-08-07T11:50:00Z",
    },
    {
      id: "r2",
      from: "Alex",
      to: "Noah",
      type: "grocery",
      message: "Can you pick up charcoal for Saturday BBQ?",
      planId: "p1",
      dueDate: "2026-08-09",
      status: "accepted",
      createdAt: "2026-08-07T12:10:00Z",
    },
  ],
  activity: [
    {
      id: "a0",
      message: "Maya mentioned @Alex in Movie Night",
      actor: "Maya",
      type: "plan.mention",
      createdAt: "2026-08-07T11:45:00Z",
      targetUser: "Alex",
      relatedView: "plans",
      relatedId: "p2",
    },
    {
      id: "a00",
      message: "Noah chipped in to New kettle",
      actor: "Noah",
      type: "fund.contributed",
      createdAt: "2026-08-07T11:20:00Z",
      relatedView: "funds",
      relatedId: "f1",
    },
    {
      id: "a01",
      message: "Maya added Movie night projector rental to the wishlist",
      actor: "Maya",
      type: "wishlist.created",
      createdAt: "2026-08-07T10:55:00Z",
      relatedView: "expenses",
      relatedId: "w1",
    },
    {
      id: "a1",
      message: "Maya added Oat milk",
      actor: "Maya",
      type: "grocery.added",
      createdAt: "2026-08-05T08:00:00Z",
      relatedView: "groceries",
      relatedId: "g1",
    },
    {
      id: "a2",
      message: "Noah completed “Water the plants”",
      actor: "Noah",
      type: "chore.completed",
      createdAt: "2026-08-04T19:00:00Z",
      relatedView: "chores",
      relatedId: "c3",
    },
    {
      id: "a3",
      message: "Alex added Groceries",
      actor: "Alex",
      type: "expense.created",
      createdAt: "2026-08-04T16:30:00Z",
      relatedView: "expenses",
      relatedId: "e2",
    },
  ],
  modePicker: {
    selected: "classic",
    options: [
      {
        key: "classic",
        name: "Classic",
        emoji: "🏠",
        badge: "🏠 Classic",
        tagline: "Home base. No frills, no drama.",
        selected: true,
      },
      {
        key: "roomies",
        name: "Roomies",
        emoji: "🛋️",
        badge: "🛋️ Roomies",
        tagline: "Your flat, balanced. Rent, bills, chores — handled.",
        selected: false,
      },
      {
        key: "buds",
        name: "Buds",
        emoji: "👯",
        badge: "👯 Buds",
        tagline: "Split it, forget it, let's gooo. Chaos is the plan.",
        selected: false,
      },
      {
        key: "ladiessecret",
        name: "LadiesSecret",
        emoji: "🤫",
        badge: "🤫 LadiesSecret",
        tagline: "Our money, our rules, no drama. The circle holds.",
        selected: false,
      },
      {
        key: "twinsoul",
        name: "TwinSoul",
        emoji: "💛",
        badge: "💛 TwinSoul",
        tagline: "Because love doesn't have to mean complicated money.",
        selected: false,
      },
      {
        key: "famsquad",
        name: "FamSquad",
        emoji: "👨‍👩‍👧‍👦",
        badge: "👨‍👩‍👧‍👦 FamSquad",
        tagline: "Family first. Expenses second. Sunday dinner, always.",
        selected: false,
      },
      {
        key: "schoolbuddies",
        name: "SchoolBuddies",
        emoji: "🎓",
        badge: "🎓 SchoolBuddies",
        tagline: "Broke together, thriving together. Student budget forever.",
        selected: false,
      },
      {
        key: "workcrew",
        name: "WorkCrew",
        emoji: "💼",
        badge: "💼 WorkCrew",
        tagline: "Keep it clean, keep it fair. No awkward Slack messages.",
        selected: false,
      },
      {
        key: "wandercrew",
        name: "WanderCrew",
        emoji: "✈️",
        badge: "✈️ WanderCrew",
        tagline: "Split the costs, share the memories. We made it.",
        selected: false,
      },
      {
        key: "pawpack",
        name: "PawPack",
        emoji: "🐾",
        badge: "🐾 PawPack",
        tagline: "Every paw print, fairly split. Our baby deserves the best.",
        selected: false,
      },
    ],
  },
};

function currency(cents) {
  return i18n.currency(cents, data?.settings?.currency || "USD");
}
function initials(name) {
  return String(name || "Member")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
function dateLabel(value) {
  if (!value) return t("common.noDueDate");
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? escapeHtml(value) : i18n.date(date);
}
function empty(title, copy) {
  return `<div class="empty"><strong>${escapeHtml(title)}</strong>${escapeHtml(copy)}</div>`;
}
function expenseIcon(category) {
  return (
    { Rent: "⌂", Groceries: "□", Utilities: "⌁", Dining: "◉", Household: "◇" }[
      category
    ] || "$"
  );
}
function statusForExpense(expense) {
  const viewer = data.viewer?.displayName;
  if (expense.paidBy === viewer)
    return { label: t("expenses.owedToYou"), className: "" };
  return { label: t("expenses.youOwe"), className: "owe" };
}

const WISH_PRESETS = {
  expenses: [
    "Flowers",
    "Gift",
    "Birthday",
    "Movie Night",
    "Dinner Out",
    "Party",
    "Night Out",
    "Concert",
    "Weekend Trip",
    "Surprise",
    "House Decoration",
    "New Gadget",
    "Gaming",
    "Sports Event",
    "Celebration",
    "Custom",
  ],
  groceries: [
    "Snacks",
    "Drinks",
    "Desserts",
    "Breakfast",
    "BBQ",
    "Party Food",
    "Healthy Food",
    "Fruit",
    "Coffee / Tea",
    "Baking",
    "Picnic",
    "Movie Snacks",
    "Household Supplies",
    "Cleaning Supplies",
    "Pet Supplies",
    "Kids",
    "Special Ingredient",
    "Bulk Buy",
    "Treat Yourself",
    "Custom",
  ],
};
function wishSvg() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/></svg>`;
}
function wishJoined(w) {
  return (w.participants || []).some(
    (n) =>
      String(n).toLowerCase() ===
      String(data.viewer?.displayName || "").toLowerCase(),
  );
}
function renderWishlists() {
  data.wishlists = Array.isArray(data.wishlists) ? data.wishlists : [];
  ["expenses", "groceries"].forEach((area) => {
    const target = $(
      `#${area === "expenses" ? "expense" : "grocery"}-wishlist`,
    );
    if (!target) return;
    const search = (
      $(`#${area === "expenses" ? "expense" : "grocery"}-wishlist-search`)
        ?.value || ""
    )
      .trim()
      .toLowerCase();
    let items = data.wishlists.filter(
      (w) => w.area === area && w.status !== "closed",
    );
    if (search)
      items = items.filter((w) =>
        `${w.title} ${w.category || ""} ${w.createdBy || ""}`
          .toLowerCase()
          .includes(search),
      );
    const count = $(
      `#${area === "expenses" ? "expense" : "grocery"}-wishlist-count`,
    );
    if (count) count.textContent = items.length;
    target.innerHTML = items.length
      ? items
          .map((w) => {
            const raised = (w.contributions || []).reduce(
                (a, c) => a + (Number(c.amountCents) || 0),
                0,
              ),
              goal = Number(w.targetCents) || 0,
              pct = goal ? Math.min(100, Math.round((raised / goal) * 100)) : 0,
              joined = wishJoined(w),
              ready = goal > 0 && raised >= goal;
            return `<article class="wish-item ${ready ? "wish-ready" : ""}" data-wish-id="${escapeHtml(w.id)}" data-entity-id="${escapeHtml(w.id)}"><div class="wish-top"><span class="wish-icon">${wishSvg()}</span><div class="wish-main"><h3>${escapeHtml(w.title)}</h3><p>${escapeHtml(w.category || "Wish")} · by ${escapeHtml(w.createdBy || "a roomie")} · ${(w.participants || []).length} in</p></div><span class="wish-badge">${ready ? "Ready ✓" : goal ? `${pct}%` : "Just a wish"}</span></div>${goal ? `<div class="wish-progress"><i style="width:${pct}%"></i></div><div class="wish-money"><span>${currency(raised)} chipped in</span><span>${currency(goal)} goal</span></div>` : ""}<div class="wish-actions"><button type="button" class="row-action ${joined ? "joined" : ""}" data-wish-join="${w.id}">${joined ? "I’m in ✓" : "I’m in"}</button><button type="button" class="row-action" data-wish-chip="${w.id}">Chip in</button>${area === "groceries" ? `<button type="button" class="row-action" data-wish-claim="${w.id}">${w.claimedBy ? `Claimed · ${escapeHtml(w.claimedBy)}` : "I’ll get it"}</button>` : ""}</div></article>`;
          })
          .join("")
      : `<div class="wish-empty">No wishes yet. Add something the house would love to make happen.</div>`;
  });
  bindWishlistActions();
}
function wishlistCreateForm(area) {
  const host = $(
    `#${area === "expenses" ? "expense" : "grocery"}-wishlist-create`,
  );
  if (!host) return;
  const presets = WISH_PRESETS[area];
  host.hidden = false;
  host.innerHTML = `<form class="wish-form" data-wish-form="${area}"><div class="wish-presets">${presets.map((p, i) => `<button type="button" class="wish-preset ${i === 0 ? "active" : ""}" data-wish-preset="${escapeHtml(p)}">${escapeHtml(p)}</button>`).join("")}</div><input name="title" maxlength="140" required placeholder="Write your wish…"><input name="category" type="hidden" value="${presets[0]}"><div class="wish-form-row"><select name="mode"><option value="wish">Just a wish</option><option value="groupbuy">Group buy</option></select><input name="target" type="number" min="0" step="0.01" inputmode="decimal" placeholder="Goal amount (optional)"></div><div class="wish-note">Joining a wish never creates debt. Chipping in is voluntary; a real purchase can later become an expense.</div><div class="wish-form-foot"><button type="button" class="row-action" data-wish-cancel>Cancel</button><button type="submit" class="quick-add">Add wish</button></div></form>`;
  host.querySelectorAll("[data-wish-preset]").forEach(
    (b) =>
      (b.onclick = () => {
        host
          .querySelectorAll("[data-wish-preset]")
          .forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        host.querySelector("[name=category]").value = b.dataset.wishPreset;
      }),
  );
  host.querySelector("[data-wish-cancel]").onclick = () => {
    host.hidden = true;
    host.innerHTML = "";
  };
  const form = host.querySelector("form");
  form.onsubmit = (event) => {
    event.preventDefault();
    const values = new FormData(form);
    return runFormSubmission({
      form,
      submitButton: form.querySelector('[type="submit"]'),
      save: () =>
        apiAction("wishlist.create", {
          area,
          title: String(values.get("title") || "").trim(),
          category: values.get("category"),
          targetCents: Math.round(Number(values.get("target") || 0) * 100),
        }),
      onError: (error) => toast(error.message, true),
      onSuccess: () => {
        host.hidden = true;
        host.innerHTML = "";
        document
          .querySelector(`[data-wishlist-card="${area}"]`)
          ?.classList.add("open");
      },
    });
  };
}
function bindWishlistActions() {
  $$("[data-wish-join]").forEach(
    (b) =>
      (b.onclick = () => {
        const w = (data.wishlists || []).find(
          (x) => String(x.id) === String(b.dataset.wishJoin),
        );
        return apiAction(
          w && wishJoined(w) ? "wishlist.leave" : "wishlist.join",
          { wishId: b.dataset.wishJoin },
        ).catch((e) => toast(e.message, true));
      }),
  );
  $$("[data-wish-chip]").forEach(
    (b) =>
      (b.onclick = () => {
        const wish = (data.wishlists || []).find(
          (w) => String(w.id) === String(b.dataset.wishChip),
        );
        $("#wishlist-chipin-id").value = b.dataset.wishChip;
        $("#wishlist-chipin-title").textContent =
          `Chip in to ${wish?.title || "this wish"}`;
        const form = $("#wishlist-chipin-form");
        if (form?.elements?.amount) form.elements.amount.value = "";
        $("#wishlist-chipin-modal").showModal();
        setTimeout(() => form?.elements?.amount?.focus(), 80);
      }),
  );
  $$("[data-wish-claim]").forEach(
    (b) =>
      (b.onclick = () =>
        apiAction("wishlist.claim", { wishId: b.dataset.wishClaim }).catch(
          (e) => toast(e.message, true),
        )),
  );
}

function renderExpenses(items, target) {
  const viewer = data.viewer?.displayName;
  target.innerHTML = items.length
    ? items
        .map((expense) => {
          const status = statusForExpense(expense);
          const share = Math.round(
            (expense.amountCents ?? expense.amount * 100) /
              (expense.participants?.length || 1),
          );
          const paid =
            expense.paidBy === viewer
              ? t("expenses.youPaid", { date: dateLabel(expense.createdAt) })
              : t("expenses.personPaid", {
                  name: escapeHtml(expense.paidBy),
                  date: dateLabel(expense.createdAt),
                });
          return `<article class="data-row"><span class="row-icon">${expenseIcon(expense.category)}</span><div class="row-main"><strong>${escapeHtml(expense.description)}</strong><small>${paid}</small></div><div class="row-amount"><strong>${currency(expense.amountCents ?? Math.round(expense.amount * 100))}</strong><span class="status ${status.className}">${status.label} ${currency(share)}</span></div></article>`;
        })
        .join("")
    : empty(t("dashboard.noExpenses"), t("expenses.empty"));
}
function choreStatus(chore) {
  if (chore.status) return chore.status;
  if (chore.done) return "verified_completed";
  return "open";
}
function renderChores(items, target, preview = false) {
  const actionable = items.filter((c) =>
    ["open", "needs_fixing", "pending_review"].includes(choreStatus(c)),
  );
  const shown = preview ? actionable.slice(0, 3) : items;
  const buttonFor = (chore) => {
    const state = choreStatus(chore);
    if (state === "open") return `<button class="row-action" data-chore-submit="${escapeHtml(chore.id)}">Mark done</button>`;
    if (state === "needs_fixing") return `<button class="row-action" data-chore-resubmit="${escapeHtml(chore.id)}">Fix & resubmit</button>`;
    return "";
  };
  if (preview) {
    target.innerHTML = shown.length
      ? shown
          .map((chore) => {
            const state = choreStatus(chore);
            return `<article class="data-row" data-entity-id="${escapeHtml(chore.id)}"><span class="row-icon">✓</span><div class="row-main"><strong>${escapeHtml(chore.task)}</strong><small>${escapeHtml(chore.assignedTo || t("common.unassigned"))} · ${dateLabel(chore.dueDate)}</small>${state === "needs_fixing" && chore.reviewComment ? `<small style="color:var(--negative)">${escapeHtml(chore.reviewComment)}</small>` : ""}</div>${buttonFor(chore)}</article>`;
          })
          .join("")
      : empty(t("chores.noneDue"), "");
    return;
  }
  target.innerHTML = shown.length
    ? shown
        .map((chore) => {
          const state = choreStatus(chore);
          const stateLabel =
            state === "pending_review"
              ? "Pending Review"
              : state === "needs_fixing"
                ? "Needs Fixing"
                : state === "verified_completed"
                  ? "Verified Completed"
                  : "Open";
          const stateClass =
            state === "pending_review"
              ? "pending"
              : state === "needs_fixing"
                ? "fixing"
                : state === "verified_completed"
                  ? "verified"
                  : "open";
          return `<article class="chore-card ${state.replaceAll("_", "-")}" data-entity-id="${escapeHtml(chore.id)}"><span class="priority ${chore.priority === "high" ? "high" : ""}">${t(chore.priority === "high" ? "ui.high" : "ui.normal")}</span><h3>${escapeHtml(chore.task)}</h3><p>${escapeHtml(chore.assignedTo || t("common.unassigned"))} · ${dateLabel(chore.dueDate)}</p><span class="chore-state ${stateClass}">${stateLabel}</span>${state === "needs_fixing" && chore.reviewComment ? `<div class="chore-review-feedback"><strong>Admin note</strong><br>${escapeHtml(chore.reviewComment)}</div>` : ""}<footer><small>${escapeHtml(chore.id)}</small>${buttonFor(chore)}</footer></article>`;
        })
        .join("")
    : empty(t("chores.boardEmpty"), t("chores.empty"));
}
function renderChoreReviews() {
  const target = $("#chore-reviews");
  if (!target) return;
  const reviewer = ["owner", "admin"].includes(data.viewer?.role);
  const actor = String(data.viewer?.displayName || "").toLowerCase();
  const reviews = (data.chores || []).filter((c) =>
    ["pending_review", "needs_fixing"].includes(choreStatus(c)),
  );
  $("#chore-review-count").textContent = reviews.filter(
    (c) => choreStatus(c) === "pending_review",
  ).length;
  if (!reviews.length) {
    target.innerHTML = empty(
      "Nothing waiting for review",
      "Completed chores will appear here before they become verified.",
    );
    return;
  }
  target.innerHTML = reviews
    .map((chore) => {
      const state = choreStatus(chore),
        pending = state === "pending_review",
        canReview =
          reviewer &&
          String(chore.submittedBy || chore.assignedTo || "").toLowerCase() !==
            actor;
      return `<article class="chore-review-row" data-entity-id="${escapeHtml(chore.id)}"><span class="chore-review-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m7 12 3 3 7-7"/><circle cx="12" cy="12" r="9"/></svg></span><div class="chore-review-main"><strong>${escapeHtml(chore.task)}</strong><small>${pending ? `${escapeHtml(chore.submittedBy || chore.assignedTo || "Roomie")} says this is done · waiting for admin review` : `Needs fixing · ${escapeHtml(chore.assignedTo || "Roomie")}`}</small>${chore.reviewComment ? `<div class="chore-review-feedback">${escapeHtml(chore.reviewComment)}</div>` : ""}</div><div class="chore-review-actions">${canReview && pending ? `<button class="approve" type="button" data-chore-approve="${escapeHtml(chore.id)}">Approve</button><button class="fix" type="button" data-chore-fix="${escapeHtml(chore.id)}">Needs Fixing</button>` : pending ? '<span class="chore-state pending">Awaiting admin</span>' : ""}</div></article>`;
    })
    .join("");
  $$("[data-chore-approve]").forEach(
    (b) =>
      (b.onclick = () =>
        apiAction("chore.review.approve", {
          choreId: b.dataset.choreApprove,
        }).catch((e) => toast(e.message, true))),
  );
  $$("[data-chore-fix]").forEach(
    (b) =>
      (b.onclick = () => {
        $("#review-chore-id").value = b.dataset.choreFix;
        $("#chore-review-modal").showModal();
      }),
  );
}
function renderGroceries(items, target, preview = false) {
  const shown = preview ? items.filter((i) => !i.purchased).slice(0, 3) : items;
  target.innerHTML = shown.length
    ? shown
        .map(
          (item) =>
            `<article class="data-row ${item.purchased ? "done" : ""}"><span class="row-icon">${item.purchased ? "✓" : "□"}</span><div class="row-main"><strong>${escapeHtml(item.name)} × ${escapeHtml(item.quantity || "1")}</strong><small>${escapeHtml(item.category || "Other")} · ${t("groceries.addedBy", { name: escapeHtml(item.addedBy || "Cribbit") })}</small></div>${item.priority === "urgent" && !item.purchased ? `<span class="status urgent">${t("groceries.urgent")}</span>` : ""}<button class="row-action" data-grocery-toggle="${item.id}" data-purchased="${!item.purchased}">${t(item.purchased ? "groceries.restore" : "groceries.markPurchased")}</button></article>`,
        )
        .join("")
    : empty(t("groceries.empty"), "");
}
function renderFunds(items, target, preview = false) {
  if (!target) return;
  const open = (items || []).filter((f) => f.status !== "closed");
  const shown = preview ? open.slice(0, 2) : open;
  target.innerHTML = shown.length
    ? shown
        .map((f) => {
          const contributions = f.contributions || [];
          const raised = contributions.reduce(
            (sum, c) => sum + (Number(c.amountCents) || 0),
            0,
          );
          const goal = Number(f.goalCents) || 0;
          const pct = goal
            ? Math.min(100, Math.round((raised / goal) * 100))
            : 0;
          const totals = new Map();
          contributions.forEach((c) => {
            const name = String(c.user || "Roomie");
            totals.set(
              name,
              (totals.get(name) || 0) + (Number(c.amountCents) || 0),
            );
          });
          const people = [...totals.entries()];
          const contributorSummary = people.length
            ? `${people.length} contributor${people.length === 1 ? "" : "s"}`
            : "Be the first to chip in";
          const contributorRows = people.length
            ? people
                .map(
                  ([name, amount]) =>
                    `<div class="fund-contributor"><span class="fund-contributor-avatar">${escapeHtml(initials(name))}</span><span class="fund-contributor-copy"><strong>${escapeHtml(name)}</strong><small>Chipped in</small></span><span class="fund-contributor-amount">${currency(amount)}</span></div>`,
                )
                .join("")
            : `<div class="fund-contributors-empty">No contributions yet.</div>`;
          const targetKey = String(target.id || "funds").replace(
            /[^a-zA-Z0-9_-]/g,
            "",
          );
          const panelId = `fund-contributors-${targetKey}-${String(f.id).replace(/[^a-zA-Z0-9_-]/g, "")}`;
          return `<article class="fund-card" data-fund-id="${escapeHtml(f.id)}" data-entity-id="${escapeHtml(f.id)}"><div class="fund-top"><button type="button" class="fund-icon" data-fund-expand="${escapeHtml(f.id)}" aria-expanded="false" aria-controls="${panelId}" aria-label="Show contributors"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7.5"/><path d="M12 8v8M8 12h8"/></svg></button><div class="fund-copy"><strong>${escapeHtml(f.title)}</strong><small>${contributorSummary}</small></div><span class="fund-percent">${pct}%</span></div><div id="${panelId}" class="fund-contributors-panel"><div class="fund-contributors-inner"><div class="fund-contributors-list">${contributorRows}</div></div></div><div class="fund-progress"><i style="width:${pct}%"></i></div><div class="fund-meta"><span><b>${currency(raised)}</b> raised</span><span>${currency(goal)} goal</span></div><div class="fund-actions"><button class="row-action" data-chipin="${escapeHtml(f.id)}" data-fund-title="${escapeHtml(f.title)}">Chip in</button></div></article>`;
        })
        .join("")
    : empty(
        "No active fund goals",
        "Create one for something the house wants to save for.",
      );
  bindDynamicActions();
}
function renderModeFeature() {
  const target = $("#mode-feature-container");
  if (!target) return;
  const selected =
    (data.modePicker?.options || []).find((m) => m.selected)?.key ||
    data.settings?.cribMode ||
    data.cribMode ||
    "classic";
  const openFunds = (data.funds || []).filter((f) => f.status !== "closed");
  let title = "",
    copy = "",
    action = "";
  if (["wandercrew", "crew"].includes(selected) && openFunds.length) {
    title = "Trip fund is moving";
    copy = `${openFunds[0].title} is ready for the next chip-in.`;
    action = '<button class="row-action" data-view="funds">Open fund</button>';
  } else if (["famsquad", "nest"].includes(selected)) {
    title = "Family rhythm";
    copy =
      "Chores and groceries stay visible so everyone can help without asking.";
    action =
      '<button class="row-action" data-view="chores">See chores</button>';
  } else if (selected === "twinsoul") {
    title = "Shared goals";
    copy =
      "A small fund is an easy way to save together for a date, trip, or home upgrade.";
    action = '<button class="row-action" data-view="funds">See funds</button>';
  }
  if (!title) {
    target.innerHTML = "";
    return;
  }
  target.innerHTML = `<section class="card mode-feature"><div class="mode-feature-inner"><span class="mode-feature-icon"><svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 14.6 9l5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2L9.4 9z"/></svg></span><div><h3>${title}</h3><p>${copy}</p></div>${action}</div></section>`;
}

const CRIB_MODE_META = {
  classic: {
    label: "the.og.crib",
    category: "Universal",
    color: "#888780",
    bg: "#F1EFE8",
    text: "#5F5E5A",
    tones: ["Neutral", "Clean", "Direct"],
    vocab: ["members", "the group", "your share"],
    commands: ["/setup", "/mode"],
    tagline: "Home base. No frills, no drama. Just balanced.",
  },
  roomies: {
    label: "the.flat",
    category: "Shared living",
    color: "#378ADD",
    bg: "#E6F1FB",
    text: "#185FA5",
    tones: ["Practical", "Domestic", "Calm"],
    vocab: ["flatmates", "the house", "house fund"],
    commands: [
      "/bills",
      "/away",
      "/inventory",
      "/rules",
      "/housemeet",
      "/cleaner",
    ],
    tagline: "Your flat, balanced. Rent, bills, chores — handled.",
  },
  buds: {
    label: "the.squad",
    category: "Friend groups",
    color: "#D85A30",
    bg: "#FAECE7",
    text: "#993C1D",
    tones: ["Chaotic fun", "Casual", "Loud"],
    vocab: ["squad", "the gang", "bestie", "your cut"],
    commands: [
      "/party",
      "/trip",
      "/vibe",
      "/roast",
      "/poll",
      "/streak",
      "/dare",
    ],
    tagline: "Split it, forget it, let's gooo. Chaos is the plan.",
  },
  ladiessecret: {
    label: "the.inner.circle",
    category: "Girls' circle",
    color: "#D4537E",
    bg: "#FBEAF0",
    text: "#993556",
    tones: ["Warm", "Inclusive", "A little extra"],
    vocab: ["the girls", "our circle", "queen", "we got you"],
    commands: [
      "/ladiesnight",
      "/brunch",
      "/spa",
      "/glow",
      "/secret",
      "/birthplan",
    ],
    tagline: "Our money, our rules, no drama. The circle holds.",
  },
  twinsoul: {
    label: "the.two.of.you",
    category: "Couples",
    color: "#EF9F27",
    bg: "#FAEEDA",
    text: "#854F0B",
    tones: ["Warm", "Intimate", "Not cutesy"],
    vocab: ["we", "our", "together", "your half"],
    commands: [
      "/datenight",
      "/goal",
      "/anniversary",
      "/ours",
      "/mine",
      "/surprise",
      "/moodcheck",
    ],
    tagline: "Because love doesn't have to mean complicated money.",
  },
  famsquad: {
    label: "the.family",
    category: "Family",
    color: "#1D9E75",
    bg: "#E1F5EE",
    text: "#0F6E56",
    tones: ["Warm", "Organized", "Grounded"],
    vocab: ["family", "household", "our home", "family fund"],
    commands: [
      "/dinnerfund",
      "/reunion",
      "/kids",
      "/occasion",
      "/allowance",
      "/household",
    ],
    tagline: "Family first. Expenses second. Sunday dinner, always.",
  },
  schoolbuddies: {
    label: "the.cohort",
    category: "Students",
    color: "#7F77DD",
    bg: "#EEEDFE",
    text: "#534AB7",
    tones: ["Casual", "Relatable", "Self-aware broke"],
    vocab: ["the crew", "cohort", "student life", "we're broke"],
    commands: [
      "/textbook",
      "/studysesh",
      "/gradtrip",
      "/semester",
      "/broke",
      "/project",
      "/library",
    ],
    tagline: "Broke together, thriving together. Student budget forever.",
  },
  workcrew: {
    label: "the.office",
    category: "Colleagues",
    color: "#378ADD",
    bg: "#E6F1FB",
    text: "#0C447C",
    tones: ["Professional", "Efficient", "Low-drama"],
    vocab: ["team", "colleagues", "the office", "your share"],
    commands: [
      "/teamlunch",
      "/offsite",
      "/reimburse",
      "/receipt",
      "/teamfund",
      "/report",
    ],
    tagline: "Keep it clean, keep it fair. No awkward Slack messages.",
  },
  wandercrew: {
    label: "the.travelers",
    category: "Travel groups",
    color: "#E24B4A",
    bg: "#FCEBEB",
    text: "#A32D2D",
    tones: ["Adventurous", "Global", "Energetic"],
    vocab: ["crew", "the trip", "adventure fund", "we made it"],
    commands: [
      "/trip",
      "/legs",
      "/currency",
      "/convert",
      "/packing",
      "/itinerary",
      "/postcard",
    ],
    tagline: "Split the costs, share the memories. We're going places.",
  },
  pawpack: {
    label: "the.fur.parents",
    category: "Pet co-owners",
    color: "#BA7517",
    bg: "#FAEEDA",
    text: "#633806",
    tones: ["Warm", "Caring", "Pet-obsessed"],
    vocab: ["the pack", "our baby", "fur budget", "pet fund"],
    commands: ["/vet", "/petfood", "/walk", "/petfund", "/care"],
    tagline: "Every paw print, fairly split. Our baby deserves the best.",
  },
};
function modeIconSvg(key) {
  const common =
    'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  const paths = {
    classic: '<path d="M4 10.5 12 4l8 6.5V20H4z"/><path d="M9.5 20v-6h5v6"/>',
    roomies:
      '<path d="M5 20V8l7-4 7 4v12"/><path d="M8 11h2M14 11h2M8 15h2M14 15h2"/>',
    buds: '<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M3.5 19a4.5 4.5 0 0 1 9 0M11.5 19a4.5 4.5 0 0 1 9 0"/>',
    ladiessecret:
      '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V8a4 4 0 0 1 8 0v2"/>',
    twinsoul:
      '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
    famsquad:
      '<path d="M4 10.5 12 4l8 6.5V20H4z"/><circle cx="9" cy="13" r="1.5"/><circle cx="15" cy="13" r="1.5"/><path d="M8 17h8"/>',
    schoolbuddies:
      '<path d="m3 9 9-5 9 5-9 5z"/><path d="M6 11.2V16c3 2.2 9 2.2 12 0v-4.8"/>',
    workcrew:
      '<rect x="4" y="7" width="16" height="12" rx="2"/><path d="M9 7V5h6v2M4 12h16"/>',
    wandercrew:
      '<path d="M3 12h18M12 3l3 9-3 9-3-9z"/><path d="m6 7 6 5 6-5"/>',
    pawpack:
      '<circle cx="12" cy="14" r="4"/><circle cx="6.5" cy="8" r="2"/><circle cx="11" cy="6" r="2"/><circle cx="16" cy="7" r="2"/><circle cx="18.5" cy="11" r="2"/>',
  };
  return `<svg ${common}>${paths[key] || paths.classic}</svg>`;
}
function renderModePicker(target) {
  if (!target) return;
  const modes = data.modePicker?.options || [];
  const canEdit = ["owner", "admin"].includes(data.viewer?.role);
  target.innerHTML = modes.length
    ? modes
        .map((mode) => {
          const m = CRIB_MODE_META[mode.key] || {
            label: mode.key,
            category: "Crib mode",
            color: "#888780",
            bg: "#F1EFE8",
            text: "#5F5E5A",
            tones: [],
            vocab: [],
            commands: [],
            tagline: mode.tagline || "",
          };
          return `<button class="mode-card" style="--mode:${m.color};--mode-bg:${m.bg};--mode-text:${m.text}" type="button" data-mode-select="${escapeHtml(mode.key)}" ${mode.selected ? 'aria-current="true"' : ""} ${!canEdit ? "disabled" : ""}><span class="mode-card-head"><span class="mode-card-icon" aria-hidden="true">${escapeHtml(mode.emoji || { classic: "🏠", roomies: "🏢", buds: "🤝", ladiessecret: "💖", twinsoul: "❤️", famsquad: "👨‍👩‍👧‍👦", schoolbuddies: "🎓", workcrew: "💼", wandercrew: "✈️", pawpack: "🐾" }[mode.key] || "🏠")}</span><span class="mode-card-title"><strong>${escapeHtml(mode.name || mode.key)}</strong><small>${escapeHtml(m.label)}</small></span>${mode.selected ? '<span class="mode-selected">Selected ✓</span>' : ""}</span><span class="mode-category">${escapeHtml(m.category)}</span><span class="mode-tagline">“${escapeHtml(m.tagline)}”</span><span class="mode-tone-row">${m.tones.map((x) => `<span class="mode-tone">${escapeHtml(x)}</span>`).join("")}</span><span class="mode-details"><small><b>Vocab</b> · ${m.vocab.map(escapeHtml).join(" · ")}</small><small><b>Commands</b> · ${m.commands.map(escapeHtml).join(" ")}</small></span></button>`;
        })
        .join("")
    : empty("Crib modes", "");
}
function bindModePickerActions() {
  $$("[data-mode-select]").forEach(
    (button) =>
      (button.onclick = () =>
        apiAction("settings.update", {
          cribMode: button.dataset.modeSelect,
        }).catch((error) => toast(error.message, true))),
  );
}

let planTab = "active";
function planDateLabel(value) {
  if (!value) return "Date TBD";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return escapeHtml(value);
  return (
    d.toLocaleDateString(i18n.locale || "en", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }) +
    (d.getHours() || d.getMinutes()
      ? ` · ${d.toLocaleTimeString(i18n.locale || "en", { hour: "numeric", minute: "2-digit" })}`
      : "")
  );
}
function planTypeSvg() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5.5" width="16" height="14" rx="2.5"/><path d="M8 3.5v4M16 3.5v4M4 9.5h16"/><path d="m8.2 14 2 2 4.2-4.2"/></svg>`;
}
function viewerJoined(plan) {
  const name = data.viewer?.displayName || "";
  return (plan.participants || []).some(
    (p) =>
      String(
        typeof p === "string" ? p : p.displayName || p.name || "",
      ).toLowerCase() === name.toLowerCase(),
  );
}
function renderPlans() {
  const target = $("#plans-list");
  if (!target) return;
  const plans = (data.plans || []).filter(
    (p) => p.status !== "cancelled" && p.status !== "completed",
  );
  const search = ($("#plans-search")?.value || "").trim().toLowerCase();
  let shown = plans.filter((p) =>
    planTab === "joined" ? viewerJoined(p) : true,
  );
  if (search)
    shown = shown.filter((p) =>
      `${p.title || ""} ${p.type || ""} ${p.customType || ""} ${p.location || ""} ${p.createdBy || ""} ${(p.participants || []).join(" ")}`
        .toLowerCase()
        .includes(search),
    );
  shown.sort(
    (a, b) =>
      new Date(a.startsAt || a.date || "2999-01-01") -
      new Date(b.startsAt || b.date || "2999-01-01"),
  );
  $("#plans-active-count").textContent = plans.length;
  $("#plans-joined-count").textContent = plans.filter(viewerJoined).length;
  target.innerHTML = shown.length
    ? shown
        .map((plan) => {
          const joined = viewerJoined(plan);
          const participants = plan.participants || [];
          const bring = (plan.bringItems || []).slice(0, 4);
          const start = plan.startsAt || plan.date;
          const today =
            start &&
            new Date(start).toDateString() === new Date().toDateString();
          return `<article class="plan-card" data-plan-id="${escapeHtml(plan.id)}" data-entity-id="${escapeHtml(plan.id)}"><div class="plan-card-head"><span class="plan-type-icon">${planTypeSvg()}</span><div class="plan-card-title"><h3>${escapeHtml(plan.title)}</h3><p>${escapeHtml(plan.type || plan.customType || "Plan")} · ${planDateLabel(start)}${plan.location ? ` · ${escapeHtml(plan.location)}` : ""}</p></div></div><div class="plan-badges"><span class="plan-badge ${plan.costMode === "free" ? "free" : "shared"}">${plan.costMode === "free" ? "Free" : "Shared Cost"}</span>${today ? '<span class="plan-badge today">Today</span>' : ""}${plan.estimatedBudgetCents ? `<span class="plan-badge">Est. ${currency(plan.estimatedBudgetCents)}</span>` : ""}</div>${bring.length ? `<div class="bring-preview"><strong>Things to bring</strong>${bring.map((item) => `<span class="bring-chip ${item.claimedBy ? "claimed" : ""}">${item.claimedBy ? "✓" : "○"} ${escapeHtml(item.name)}${item.claimedBy ? ` · ${escapeHtml(item.claimedBy)}` : ""}</span>`).join("")}</div>` : ""}<div class="plan-card-footer"><span class="plan-people">${participants.length} ${participants.length === 1 ? "person" : "people"} joined · by ${escapeHtml(plan.createdBy || "a roomie")}</span><button class="plan-join ${joined ? "joined" : ""}" type="button" data-plan-join="${escapeHtml(plan.id)}" data-joined="${joined}">${joined ? "Joined ✓" : "Join"}</button></div></article>`;
        })
        .join("")
    : empty(
        planTab === "joined" ? "No joined plans yet" : "No active plans",
        "Create one and make something happen.",
      );
  bindPlanActions();
}
function bindPlanActions() {
  $$("[data-plan-join]").forEach(
    (btn) =>
      (btn.onclick = async () => {
        const id = btn.dataset.planJoin;
        const joined = btn.dataset.joined === "true";
        try {
          await apiAction(joined ? "plan.leave" : "plan.join", { planId: id });
        } catch (error) {
          toast(error.message, true);
        }
      }),
  );
}
function settlementRequestFor(settlement) {
  return (data.settlementRequests || []).find(
    (r) =>
      r.status === "pending" &&
      String(r.from).toLowerCase() === String(settlement.from).toLowerCase() &&
      String(r.to).toLowerCase() === String(settlement.to).toLowerCase() &&
      Number(r.amountCents) === Number(settlement.amountCents),
  );
}
function renderSettlements() {
  const target = $("#settlements");
  if (!target) return;
  data.settlementRequests = Array.isArray(data.settlementRequests)
    ? data.settlementRequests
    : [];
  const settlements = Array.isArray(data.balances?.settlements)
    ? data.balances.settlements
    : [];
  const viewerName = String(data.viewer?.displayName || "");
  const pending = data.settlementRequests.filter((r) => r.status === "pending");
  $("#settlement-count").textContent = settlements.length;
  $("#pending-settlement-count").textContent = pending.length;
  if (!settlements.length) {
    target.innerHTML = `<div class="settlement-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="m8.5 12 2.2 2.2 4.8-5"/></svg><span>Everyone is settled up. Nothing needs attention.</span></div>`;
    return;
  }
  target.innerHTML = settlements
    .map((settlement, index) => {
      const req = settlementRequestFor(settlement);
      const isPayer =
        String(settlement.from).toLowerCase() === viewerName.toLowerCase();
      const isOwner =
        String(settlement.to).toLowerCase() === viewerName.toLowerCase();
      let actions = "";
      let sub = "Outstanding balance";
      if (req) {
        sub = `${escapeHtml(settlement.from)} marked this as paid · waiting for ${escapeHtml(settlement.to)}`;
        if (isOwner) {
          actions = `<div class="settlement-actions"><button class="settle-button confirm" type="button" data-settlement-confirm="${escapeHtml(req.id)}">Confirm received</button><button class="settle-button decline" type="button" data-settlement-decline="${escapeHtml(req.id)}">Decline</button></div>`;
        } else {
          actions = `<span class="settlement-state">Pending confirmation</span>`;
        }
      } else if (isPayer) {
        actions = `<button class="settle-button" type="button" data-settlement-request="${index}">Settle</button>`;
        sub = `You owe ${escapeHtml(settlement.to)} · tap Settle after you have paid`;
      } else if (isOwner) {
        actions = `<span class="settlement-state owed">Awaiting payment</span>`;
        sub = `${escapeHtml(settlement.from)} owes you`;
      }
      return `<article class="settlement-item ${req ? "pending" : ""}"><div class="settlement-avatar">${initials(settlement.from)}</div><div class="settlement-main"><strong>${escapeHtml(settlement.from)} → ${escapeHtml(settlement.to)}</strong><small>${sub}</small></div><div class="settlement-side"><span class="settlement-amount">${currency(settlement.amountCents)}</span>${actions}</div></article>`;
    })
    .join("");
  bindSettlementActions();
}
function bindSettlementActions() {
  $$("[data-settlement-request]").forEach(
    (button) =>
      (button.onclick = () => {
        const settlement = (data.balances?.settlements || [])[
          Number(button.dataset.settlementRequest)
        ];
        if (!settlement) return;
        apiAction("settlement.request", {
          from: settlement.from,
          to: settlement.to,
          amountCents: settlement.amountCents,
        }).catch((error) => toast(error.message, true));
      }),
  );
  $$("[data-settlement-confirm]").forEach(
    (button) =>
      (button.onclick = () =>
        apiAction("settlement.confirm", {
          requestId: button.dataset.settlementConfirm,
        }).catch((error) => toast(error.message, true))),
  );
  $$("[data-settlement-decline]").forEach(
    (button) =>
      (button.onclick = () =>
        apiAction("settlement.decline", {
          requestId: button.dataset.settlementDecline,
        }).catch((error) => toast(error.message, true))),
  );
}

let activeReceiptDataUrl = "";
let activeReceiptFile = null;
function parseReceiptText(raw) {
  const text = String(raw || "").replace(/\r/g, "");
  const lines = text
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);
  const money = /(-?\d{1,5}[.,]\d{2})\s*$/;
  let total = null,
    totalIndex = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/\b(total|amount due|balance due|grand total)\b/i.test(lines[i])) {
      const m = lines[i].match(money);
      if (m) {
        total = Math.round(Number(m[1].replace(",", ".")) * 100);
        totalIndex = i;
        break;
      }
    }
  }
  if (total == null) {
    for (let i = lines.length - 1; i >= 0; i--) {
      const m = lines[i].match(money);
      if (m) {
        total = Math.round(Number(m[1].replace(",", ".")) * 100);
        totalIndex = i;
        break;
      }
    }
  }
  const merchant = (
    lines.find(
      (l) =>
        !money.test(l) &&
        l.length > 2 &&
        !/receipt|thank|date|time|cashier|tax/i.test(l),
    ) || ""
  ).slice(0, 80);
  const items = [];
  lines.forEach((line, i) => {
    if (
      i === totalIndex ||
      /subtotal|tax|total|change|cash|card|visa|mastercard/i.test(line)
    )
      return;
    const m = line.match(money);
    if (!m) return;
    const name = line
      .slice(0, m.index)
      .replace(/[.·_-]+$/, "")
      .trim();
    if (name.length > 1)
      items.push({
        name: name.slice(0, 80),
        amountCents: Math.round(Number(m[1].replace(",", ".")) * 100),
      });
  });
  return { merchant, totalCents: total, items: items.slice(0, 20), text };
}
function setOcrStatus(message, state = "") {
  const el = $("#ocr-status");
  if (!el) return;
  el.className = `ocr-status ${state}`.trim();
  el.querySelector("span").textContent = message;
}
function showParsedReceipt(parsed, confidence) {
  if (parsed.merchant && !$("#expense-description").value.trim())
    $("#expense-description").value = parsed.merchant;
  if (parsed.totalCents)
    $("#expense-amount").value = (parsed.totalCents / 100).toFixed(2);
  $("#expense-receipt-text").value = parsed.text || "";
  $("#expense-receipt-confidence").value = String(confidence || "");
  const box = $("#ocr-items"),
    list = $("#ocr-items-list"),
    badge = $("#ocr-confidence");
  if (parsed.items.length) {
    box.classList.add("visible");
    list.innerHTML = parsed.items
      .map(
        (i) =>
          `<div class="ocr-item"><span>${escapeHtml(i.name)}</span><strong>${currency(i.amountCents)}</strong></div>`,
      )
      .join("");
  } else {
    box.classList.remove("visible");
    list.innerHTML = "";
  }
  badge.textContent = confidence ? `${Math.round(confidence)}% OCR` : "Review";
  badge.className = `approval-pill ${confidence >= 70 ? "approved" : "pending"}`;
}
async function scanReceiptLocal() {
  const file =
    activeReceiptFile ||
    $("#expense-receipt").files?.[0] ||
    $("#expense-receipt-camera").files?.[0];
  if (!file) {
    toast("Choose a receipt photo first.", true);
    return;
  }
  if (!window.Tesseract) {
    setOcrStatus(
      "Local OCR is unavailable. You can still enter the details manually.",
      "warn",
    );
    return;
  }
  setOcrStatus("Reading receipt on this device…");
  $("#scan-receipt").disabled = true;
  try {
    const result = await Tesseract.recognize(file, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text")
          setOcrStatus(
            `Reading receipt… ${Math.round((m.progress || 0) * 100)}%`,
          );
      },
    });
    const parsed = parseReceiptText(result.data?.text || "");
    showParsedReceipt(parsed, result.data?.confidence || 0);
    setOcrStatus(
      parsed.totalCents
        ? "Receipt read. Check the amount and items before submitting."
        : "Text found, but please check the total manually.",
      parsed.totalCents ? "good" : "warn",
    );
  } catch (e) {
    setOcrStatus(
      "Could not read this photo locally. Try Improve scan or enter the details manually.",
      "warn",
    );
  } finally {
    $("#scan-receipt").disabled = false;
  }
}
async function scanReceiptCloud() {
  const file =
    activeReceiptFile ||
    $("#expense-receipt").files?.[0] ||
    $("#expense-receipt-camera").files?.[0];
  if (!file) {
    toast("Choose a receipt photo first.", true);
    return;
  }
  if (demoMode) {
    const parsed = parseReceiptText(
      $("#expense-receipt-text").value ||
        "Demo Market\\nOat milk 5.49\\nPasta 3.99\\nDish soap 6.50\\nTOTAL 15.98",
    );
    showParsedReceipt(parsed, 96);
    setOcrStatus(
      "Improved structured scan ready. Review before submitting.",
      "good",
    );
    return;
  }
  setOcrStatus("Sending receipt for structured parsing…");
  $("#cloud-scan-receipt").disabled = true;
  try {
    const fd = new FormData();
    fd.append("receipt", file);
    fd.append("chatId", chatId || "");
    const res = await apiFetch(`${apiBaseUrl}/api/receipt-ocr`, {
      method: "POST",
      headers: { "X-Telegram-Init-Data": initData },
      body: fd,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok)
      throw new Error(body.error || "Structured receipt scan unavailable.");
    const parsed = {
      merchant: body.merchant || body.supplierName || "",
      totalCents:
        Number(body.totalCents) || Math.round(Number(body.total || 0) * 100),
      items: Array.isArray(body.items)
        ? body.items.map((i) => ({
            name: i.name || i.description || "Item",
            amountCents:
              Number(i.amountCents) || Math.round(Number(i.amount || 0) * 100),
          }))
        : [],
      text: body.text || "",
    };
    showParsedReceipt(parsed, body.confidence || 95);
    setOcrStatus("Structured scan ready. Review before submitting.", "good");
  } catch (e) {
    setOcrStatus(
      "Cloud receipt parsing is not configured yet. Local OCR/manual review still works.",
      "warn",
    );
    toast(e.message, true);
  } finally {
    $("#cloud-scan-receipt").disabled = false;
  }
}
function renderExpenseApprovals() {
  data.expenseClaims = Array.isArray(data.expenseClaims)
    ? data.expenseClaims
    : [];
  const target = $("#expense-approvals");
  if (!target) return;
  const pending = data.expenseClaims.filter((c) => c.status === "pending");
  $("#expense-approval-count").textContent = pending.length;
  const reviewer = ["owner", "admin"].includes(data.viewer?.role);
  const actor = String(data.viewer?.displayName || "");
  if (!data.expenseClaims.length) {
    target.innerHTML = empty(
      "No claims waiting",
      "Submitted receipts will appear here for verification.",
    );
    return;
  }
  target.innerHTML = data.expenseClaims
    .slice()
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    .map((c) => {
      const canReview =
        reviewer &&
        String(c.submittedBy || c.paidBy).toLowerCase() !==
          actor.toLowerCase() &&
        c.status === "pending";
      const pill =
        c.status === "approved"
          ? "approved"
          : c.status === "rejected"
            ? "rejected"
            : "pending";
      return `<article class="approval-row"><div class="approval-receipt">${c.receiptUrl ? `<img src="${escapeHtml(c.receiptUrl)}" alt="Receipt">` : '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/></svg>'}</div><div class="approval-main"><strong>${escapeHtml(c.description)} · ${currency(c.amountCents)}</strong><small>${escapeHtml(c.paidBy)} · ${escapeHtml(c.category || "Other")} · ${dateLabel(c.submittedAt)}</small>${c.rejectionComment ? `<small style="color:var(--danger)">Rejected: ${escapeHtml(c.rejectionComment)}</small>` : ""}<div class="approval-meta"><span class="approval-pill ${pill}">${c.status === "pending" ? "Payment Pending" : c.status === "approved" ? "Payment Verified" : "Payment Rejected"}</span>${(c.receiptItems || []).length ? `<span class="approval-pill pending">${c.receiptItems.length} items read</span>` : ""}</div></div><div class="approval-actions">${canReview ? `<button class="approve" type="button" data-expense-approve="${escapeHtml(c.id)}">Approve</button><button class="reject" type="button" data-expense-reject="${escapeHtml(c.id)}">Reject</button>` : ""}${c.status === "pending" && !canReview ? '<span class="approval-pill pending">Awaiting admin</span>' : ""}</div></article>`;
    })
    .join("");
  $$("[data-expense-approve]").forEach(
    (b) =>
      (b.onclick = () =>
        apiAction("payment.claim.approve", {
          claimId: b.dataset.expenseApprove,
        }).catch((e) => toast(e.message, true))),
  );
  $$("[data-expense-reject]").forEach(
    (b) =>
      (b.onclick = () => {
        $("#reject-claim-id").value = b.dataset.expenseReject;
        $("#expense-reject-modal").showModal();
      }),
  );
}

const notificationReadKey = () =>
  `cribbit-personal-notifications:${String(data?.viewer?.displayName || "member").toLowerCase()}`;
function readNotificationIds() {
  try {
    return new Set(
      JSON.parse(localStorage.getItem(notificationReadKey()) || "[]"),
    );
  } catch {
    return new Set();
  }
}
function saveNotificationIds(set) {
  try {
    localStorage.setItem(
      notificationReadKey(),
      JSON.stringify([...set].slice(-200)),
    );
  } catch {}
}
function notificationIcon(type) {
  if (type === "mention")
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><path d="M15.5 9.2v4.1a2 2 0 0 0 4 0V12a7.5 7.5 0 1 0-2.1 5.2"/></svg>`;
  if (type === "chore")
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="16" rx="2.5"/><path d="m8.5 11.5 2.1 2.1 4.9-5"/></svg>`;
  if (type === "money")
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="4" y="6" width="16" height="12" rx="2.5"/><path d="M8 12h8M12 9v6"/></svg>`;
  if (type === "plan")
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="4" y="5.5" width="16" height="14" rx="2.5"/><path d="M8 3.5v4M16 3.5v4M4 9.5h16"/></svg>`;
  if (type === "request")
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5.5h14v10H9l-4 3z"/><path d="M9 9h6M9 12h4"/></svg>`;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 9a6 6 0 0 0-12 0c0 7-2.5 7-2.5 7h17S18 16 18 9Z"/></svg>`;
}
function getPersonalNotifications() {
  const viewerName = String(data.viewer?.displayName || "");
  const viewer = viewerName.toLowerCase();
  const admin = ["owner", "admin"].includes(data.viewer?.role);
  const out = [];
  const push = (n) =>
    out.push({ ...n, createdAt: n.createdAt || new Date().toISOString() });
  (data.notifications || []).forEach((n) =>
    push({
      id: `server:${n.id}`,
      type: String(n.type || "notification").split(".")[0],
      tone: "attention",
      title: n.type === "settlement.pending" ? "Confirm a payment you received" : "New crib notification",
      body: n.message,
      createdAt: n.createdAt,
      view: n.type?.startsWith("request") ? "requests" : "expenses",
      entityId: n.metadata?.requestId || n.metadata?.settlementRequestId || "",
    }),
  );
  if (admin)
    (data.expenseClaims || [])
      .filter(
        (c) =>
          c.status === "pending" &&
          String(c.submittedBy || c.paidBy).toLowerCase() !== viewer,
      )
      .forEach((c) =>
        push({
          id: `payment-review:${c.id}`,
          type: "money",
          tone: "attention",
          title: `Payment claim needs your review`,
          body: `${c.paidBy} · ${currency(c.amountCents)} · ${c.description}`,
          createdAt: c.submittedAt,
          view: "expenses",
          entityId: c.id,
        }),
      );
  (data.expenseClaims || [])
    .filter(
      (c) =>
        String(c.submittedBy || c.paidBy).toLowerCase() === viewer &&
        ["approved", "rejected"].includes(c.status),
    )
    .forEach((c) =>
      push({
        id: `payment-result:${c.id}:${c.status}`,
        type: "money",
        tone: c.status === "approved" ? "success" : "urgent",
        title:
          c.status === "approved"
            ? "Your payment was approved"
            : "Your payment needs attention",
        body:
          c.status === "approved"
            ? `${c.description} · ${currency(c.amountCents)} verified`
            : c.rejectionComment || `${c.description} was rejected`,
        createdAt: c.reviewedAt || c.submittedAt,
        view: "expenses",
        entityId: c.id,
      }),
    );
  if (admin)
    (data.chores || [])
      .filter(
        (c) =>
          choreStatus(c) === "pending_review" &&
          String(c.submittedBy || c.assignedTo || "").toLowerCase() !== viewer,
      )
      .forEach((c) =>
        push({
          id: `chore-review:${c.id}`,
          type: "chore",
          tone: "attention",
          title: "Completed chore needs your review",
          body: `${c.submittedBy || c.assignedTo || "A roomie"} · ${c.task}`,
          createdAt: c.submittedAt || c.createdAt,
          view: "chores",
          entityId: c.id,
        }),
      );
  (data.chores || [])
    .filter(
      (c) =>
        String(c.assignedTo || "").toLowerCase() === viewer &&
        choreStatus(c) === "needs_fixing",
    )
    .forEach((c) =>
      push({
        id: `chore-fix:${c.id}:${c.reviewedAt || ""}`,
        type: "chore",
        tone: "urgent",
        title: "Your chore needs fixing",
        body: c.reviewComment || c.task,
        createdAt: c.reviewedAt || c.createdAt,
        view: "chores",
        entityId: c.id,
      }),
    );
  (data.chores || [])
    .filter(
      (c) =>
        String(c.assignedTo || "").toLowerCase() === viewer &&
        choreStatus(c) === "verified_completed" &&
        c.verifiedAt,
    )
    .forEach((c) =>
      push({
        id: `chore-approved:${c.id}:${c.verifiedAt}`,
        type: "chore",
        tone: "success",
        title: "Your chore was approved",
        body: c.task,
        createdAt: c.verifiedAt,
        view: "chores",
        entityId: c.id,
      }),
    );
  (data.settlementRequests || [])
    .filter(
      (r) =>
        r.status === "pending" && String(r.to || "").toLowerCase() === viewer,
    )
    .forEach((r) =>
      push({
        id: `settlement-confirm:${r.id}`,
        type: "money",
        tone: "attention",
        title: "Confirm a payment you received",
        body: `${r.from} says they paid you ${currency(r.amountCents)}`,
        createdAt: r.createdAt,
        view: "expenses",
        entityId: r.id,
      }),
    );
  (data.activity || [])
    .filter((a) => {
      const msg = String(a.message || "").toLowerCase();
      return (
        String(a.targetUser || "").toLowerCase() === viewer ||
        msg.includes(`@${viewer}`)
      );
    })
    .forEach((a) =>
      push({
        id: `mention:${a.id}`,
        type: "mention",
        tone: "info",
        title: `${a.actor || "Someone"} mentioned you`,
        body: String(a.message || "").replace(
          new RegExp(`@${viewerName}`, "ig"),
          "you",
        ),
        createdAt: a.createdAt,
        view:
          a.relatedView || (/plan/i.test(a.type || "") ? "plans" : "activity"),
        entityId: a.relatedId || a.id,
      }),
    );
  (data.requests || [])
    .filter(
      (r) =>
        String(r.to || "").toLowerCase() === viewer &&
        ["open", "accepted"].includes(r.status),
    )
    .forEach((r) =>
      push({
        id: `request:${r.id}:${r.status}`,
        type: "request",
        tone: r.status === "open" ? "attention" : "info",
        title: `${r.from} requested something from you`,
        body: r.message,
        createdAt: r.createdAt,
        view: "requests",
        entityId: r.id,
      }),
    );
  (data.plans || [])
    .filter((p) => String(p.createdBy || "").toLowerCase() === viewer)
    .forEach((p) =>
      (p.participants || [])
        .filter((n) => String(n).toLowerCase() !== viewer)
        .forEach((name) =>
          push({
            id: `plan-member:${p.id}:${String(name).toLowerCase()}`,
            type: "plan",
            tone: "info",
            title: `${name} is in your plan`,
            body: p.title,
            createdAt: p.updatedAt || p.startsAt || p.createdAt,
            view: "plans",
            entityId: p.id,
          }),
        ),
    );
  return out
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 40);
}
function renderPersonalNotifications() {
  const btn = $("#notification-button"),
    badge = $("#notification-badge"),
    list = $("#personal-notification-list");
  if (!btn || !badge || !list) return;
  const items = getPersonalNotifications(),
    read = readNotificationIds(),
    unread = items.filter((n) => !read.has(n.id));
  badge.textContent = unread.length > 9 ? "9+" : String(unread.length);
  btn.classList.toggle("has-notifications", unread.length > 0);
  btn.setAttribute(
    "aria-label",
    unread.length
      ? `${unread.length} personal notifications`
      : "No new personal notifications",
  );
  list.innerHTML = items.length
    ? items
        .map(
          (n) =>
            `<button class="personal-notification tone-${escapeHtml(n.tone || "info")} ${read.has(n.id) ? "" : "unread"}" type="button" data-personal-notification="${escapeHtml(n.id)}" data-notification-view="${escapeHtml(n.view || "overview")}" data-notification-entity="${escapeHtml(n.entityId || "")}"><span class="notification-symbol">${notificationIcon(n.type)}</span><span class="notification-copy"><strong>${escapeHtml(n.title)}</strong><small>${escapeHtml(n.body || "")}</small></span><span class="notification-time">${dateLabel(n.createdAt)}</span></button>`,
        )
        .join("")
    : `<div class="notification-empty"><strong>You’re all caught up.</strong><br>Only mentions, assignments, approvals, confirmations and other things involving you appear here.</div>`;
  $$("[data-personal-notification]").forEach(
    (el) =>
      (el.onclick = () => {
        const readNow = readNotificationIds();
        readNow.add(el.dataset.personalNotification);
        saveNotificationIds(readNow);
        closeNotificationPopover();
        openEntity(
          el.dataset.notificationView || "overview",
          el.dataset.notificationEntity || "",
        );
        renderPersonalNotifications();
      }),
  );
}
function renderNotificationBell() {
  renderPersonalNotifications();
}
function openNotificationPopover() {
  renderPersonalNotifications();
  $("#notification-popover")?.classList.add("open");
  $("#notification-scrim")?.classList.add("open");
  $("#notification-popover")?.setAttribute("aria-hidden", "false");
}
function closeNotificationPopover() {
  $("#notification-popover")?.classList.remove("open");
  $("#notification-scrim")?.classList.remove("open");
  $("#notification-popover")?.setAttribute("aria-hidden", "true");
}

function requestSymbol(type) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${type === "bring" ? '<path d="M5 7h14v12H5z"/><path d="M8 7V5h8v2M9 12h6"/>' : type === "grocery" ? '<path d="M5.2 8h13.6l-1.1 11H6.3z"/><path d="M8.3 9V7a3.7 3.7 0 0 1 7.4 0v2"/>' : '<path d="M5 5.5h14v10H9l-4 3z"/><path d="M9 9h6M9 12h4"/>'}</svg>`;
}
function renderRequests() {
  data.requests = Array.isArray(data.requests) ? data.requests : [];
  const target = $("#request-list");
  if (!target) return;
  const viewer = String(data.viewer?.displayName || "");
  const active = data.requests.filter(
    (r) => !["done", "declined", "cancelled"].includes(r.status),
  );
  const forYou = active.filter(
      (r) => String(r.to).toLowerCase() === viewer.toLowerCase(),
    ),
    sent = active.filter(
      (r) => String(r.from).toLowerCase() === viewer.toLowerCase(),
    );
  $("#requests-for-you-count").textContent = forYou.length;
  $("#requests-sent-count").textContent = sent.length;
  $("#request-count").textContent = active.length;
  const linkedEntity = (r) => {
    const type = r.relatedType || (r.planId ? "plan" : "");
    const id = r.relatedId || r.planId || "";
    if (!type || !id) return null;
    const pools = {
      plan: data.plans || [],
      fund: data.funds || [],
      wishlist: data.wishlists || [],
      chore: data.chores || [],
    };
    const item = (pools[type] || []).find((x) => String(x.id) === String(id));
    if (!item) return null;
    const title = item.title || item.task || item.name || "Related item";
    const view =
      type === "plan"
        ? "plans"
        : type === "fund"
          ? "funds"
          : type === "wishlist"
            ? item.area === "groceries"
              ? "groceries"
              : "expenses"
            : "chores";
    return { type, id, title, view };
  };
  target.innerHTML = active.length
    ? active
        .map((r) => {
          const mine = String(r.to).toLowerCase() === viewer.toLowerCase(),
            sentByMe = String(r.from).toLowerCase() === viewer.toLowerCase(),
            status = String(r.status || "open"),
            linked = linkedEntity(r);
          return `<article class="request-card ${mine ? "for-you" : ""}" data-entity-type="requests" data-entity-id="${escapeHtml(r.id)}"><div class="request-head"><span class="request-symbol">${requestSymbol(r.type)}</span><div class="request-copy"><strong>${escapeHtml(r.message)}</strong><small>${mine ? `From ${escapeHtml(r.from)}` : `To ${escapeHtml(r.to)}`}${linked ? ` · ${escapeHtml(linked.title)}` : ""}${r.dueDate ? ` · Due ${dateLabel(r.dueDate)}` : ""}</small></div><span class="request-status ${status}">${status === "open" ? "Requested" : status === "accepted" ? "Accepted" : "Done"}</span></div><div class="request-actions">${mine && status === "open" ? `<button class="primary" type="button" data-request-accept="${escapeHtml(r.id)}">Accept</button><button class="decline" type="button" data-request-decline="${escapeHtml(r.id)}">Decline</button>` : ""}${mine && status === "accepted" ? `<button class="done" type="button" data-request-done="${escapeHtml(r.id)}">Done ✓</button>` : ""}${linked ? `<button type="button" data-request-open-view="${escapeHtml(linked.view)}" data-request-open-id="${escapeHtml(linked.id)}">Open ${escapeHtml(linked.type)}</button>` : ""}${sentByMe ? `<button type="button" data-request-remind="${escapeHtml(r.id)}">Remind</button>` : ""}</div></article>`;
        })
        .join("")
    : empty(
        "No active requests",
        "Ask a roomie directly and attach the request to an active or upcoming plan, wish, fund, or chore when useful.",
      );
  $$("[data-request-accept]").forEach(
    (b) =>
      (b.onclick = () =>
        apiAction("request.accept", {
          requestId: b.dataset.requestAccept,
        }).catch((e) => toast(e.message, true))),
  );
  $$("[data-request-decline]").forEach(
    (b) =>
      (b.onclick = () =>
        apiAction("request.decline", {
          requestId: b.dataset.requestDecline,
        }).catch((e) => toast(e.message, true))),
  );
  $$("[data-request-done]").forEach(
    (b) =>
      (b.onclick = () =>
        apiAction("request.complete", {
          requestId: b.dataset.requestDone,
        }).catch((e) => toast(e.message, true))),
  );
  $$("[data-request-open-view]").forEach(
    (b) =>
      (b.onclick = () =>
        openEntity(b.dataset.requestOpenView, b.dataset.requestOpenId)),
  );
  $$("[data-request-remind]").forEach(
    (b) =>
      (b.onclick = () =>
        apiAction("request.remind", {
          requestId: b.dataset.requestRemind,
        }).catch((e) => toast(e.message, true))),
  );
}
function renderWishlistHub() {
  const exp = (data.wishlists || []).filter(
      (w) => w.area === "expenses" && w.status !== "closed",
    ).length,
    groc = (data.wishlists || []).filter(
      (w) => w.area === "groceries" && w.status !== "closed",
    ).length;
  const e = $("#wishlist-hub-expense-count"),
    g = $("#wishlist-hub-grocery-count");
  if (e) e.textContent = `${exp} active`;
  if (g) g.textContent = `${groc} active`;
}
function inferActivityTarget(event) {
  if (event.relatedView)
    return { view: event.relatedView, id: event.relatedId || "" };
  const t = String(event.type || "");
  if (t.startsWith("plan."))
    return { view: "plans", id: event.planId || event.relatedId || "" };
  if (t.startsWith("fund."))
    return { view: "funds", id: event.fundId || event.relatedId || "" };
  if (t.startsWith("wishlist."))
    return {
      view: event.area === "groceries" ? "groceries" : "expenses",
      id: event.wishId || event.relatedId || "",
    };
  if (t.startsWith("chore."))
    return { view: "chores", id: event.choreId || event.relatedId || "" };
  if (t.startsWith("settlement."))
    return { view: "expenses", id: event.requestId || event.relatedId || "" };
  if (t.startsWith("request."))
    return { view: "requests", id: event.requestId || event.relatedId || "" };
  if (t.startsWith("expense.") || t.startsWith("payment."))
    return {
      view: "expenses",
      id: event.claimId || event.expenseId || event.relatedId || "",
    };
  if (t.startsWith("grocery."))
    return { view: "groceries", id: event.groceryId || event.relatedId || "" };
  return { view: "", id: "" };
}
function openEntity(view, id = "") {
  if (view === "wishlists") {
    const wish = (data.wishlists || []).find(
      (w) => String(w.id) === String(id),
    );
    if (wish) {
      view = wish.area === "groceries" ? "groceries" : "expenses";
    } else {
      showView("wishlists");
      return;
    }
  }
  showView(view || "overview");
  if (view === "expenses" && id) {
    document
      .querySelector('[data-wishlist-card="expenses"]')
      ?.classList.add("open");
  }
  if (view === "groceries" && id) {
    document
      .querySelector('[data-wishlist-card="groceries"]')
      ?.classList.add("open");
  }
  if (!id) return;
  setTimeout(() => {
    let node = document.querySelector(
      `[data-entity-id="${CSS.escape(String(id))}"]`,
    );
    if (!node && view === "plans")
      node = document.querySelector(
        `[data-plan-id="${CSS.escape(String(id))}"]`,
      );
    if (!node && view === "funds")
      node = document.querySelector(
        `[data-fund-id="${CSS.escape(String(id))}"]`,
      );
    if (!node && ["expenses", "groceries"].includes(view))
      node = document.querySelector(
        `[data-wish-id="${CSS.escape(String(id))}"]`,
      );
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "center" });
      node.classList.remove("entity-highlight");
      void node.offsetWidth;
      node.classList.add("entity-highlight");
    }
  }, 120);
}
function bindActivityActions() {
  $$("[data-activity-view]").forEach(
    (el) =>
      (el.onclick = () =>
        openEntity(el.dataset.activityView, el.dataset.activityEntity || "")),
  );
}

function render() {
  data.funds = Array.isArray(data.funds) ? data.funds : [];
  const viewer = data.viewer ||
    data.members[0] || { displayName: "House member", role: "member" };
  const settings = data.settings;
  const viewerKey = Object.keys(data.balances.netCents || {}).find(
    (name) => name.toLowerCase() === viewer.displayName.toLowerCase(),
  );
  const viewerNet = data.balances.netCents?.[viewerKey] || 0;
  $("#house-name-side").textContent = settings.houseName;
  $("#house-name-mobile").textContent = settings.houseName;
  $("#settings-house-name").textContent = settings.houseName;
  $("#profile-name").textContent = viewer.displayName;
  $("#profile-role").textContent = viewer.role || "Member";
  $("#profile-avatar").textContent = initials(viewer.displayName);
  const period =
    new Date().getHours() < 12
      ? "morning"
      : new Date().getHours() < 18
        ? "afternoon"
        : "evening";
  $("#greeting").textContent = t(`dashboard.greeting.${period}`, {
    name: viewer.displayName,
  });
  $("#current-date").textContent = i18n
    .date(new Date(), { weekday: "long", month: "short", day: "numeric" })
    .toLocaleUpperCase(i18n.locale);
  $("#owed-total").textContent = currency(Math.max(viewerNet, 0));
  $("#owe-total").textContent = currency(Math.max(-viewerNet, 0));
  const owedPeople = data.balances.settlements.filter(
    (s) => s.to.toLowerCase() === viewer.displayName.toLowerCase(),
  ).length;
  const owePeople = data.balances.settlements.filter(
    (s) => s.from.toLowerCase() === viewer.displayName.toLowerCase(),
  ).length;
  $("#owed-note").textContent = owedPeople
    ? t("dashboard.peopleOwe", { count: owedPeople })
    : t("dashboard.nothingOutstanding");
  $("#owe-note").textContent = owePeople
    ? t("dashboard.youOwePeople", { count: owePeople })
    : t("dashboard.nothingDue");
  const newest = [...data.expenses].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
  renderExpenses(newest.slice(0, 3), $("#expense-preview"));
  renderExpenses(filterExpenses(), $("#expense-list"));
  $("#expense-count").textContent = data.expenses.length;
  $("#expense-total").textContent = currency(data.balances.totalSpentCents);
  renderSettlements();
  renderExpenseApprovals();
  renderChores(data.chores, $("#chore-preview"), true);
  renderChores(data.chores, $("#chore-list"));
  renderChoreReviews();
  $("#chore-count").textContent = data.chores.length;
  $("#chore-open-count").textContent = data.chores.filter(
    (c) => choreStatus(c) !== "verified_completed",
  ).length;
  $("#chore-done-count").textContent = data.chores.filter(
    (c) => choreStatus(c) === "verified_completed",
  ).length;
  renderGroceries(data.groceries, $("#grocery-preview"), true);
  renderGroceries(data.groceries, $("#grocery-list"));
  $("#grocery-count").textContent = data.groceries.length;
  $("#grocery-active-count").textContent = data.groceries.filter(
    (i) => !i.purchased,
  ).length;
  $("#grocery-done-count").textContent = data.groceries.filter(
    (i) => i.purchased,
  ).length;
  renderWishlists();
  renderWishlistHub();
  renderRequests();
  $("#snapshot-spent").textContent = currency(
    data.balances.totalSpentCents || 0,
  );
  $("#snapshot-chores").textContent = data.chores.filter(
    (c) => choreStatus(c) !== "verified_completed",
  ).length;
  $("#shortcut-request-count").textContent = (data.requests || []).filter(
    (r) => !["done", "declined", "cancelled"].includes(r.status),
  ).length;
  $("#shortcut-wishlist-count").textContent = (data.wishlists || []).filter(
    (w) => w.status !== "closed",
  ).length;
  $("#shortcut-plan-count").textContent = (data.plans || []).filter(
    (p) => !["cancelled", "completed"].includes(p.status),
  ).length;
  $("#shortcut-activity-count").textContent = (data.activity || []).length;
  const funds = data.funds || [];
  renderFunds(funds, $("#fund-preview"), true);
  renderFunds(funds, $("#fund-list"));
  renderPlans();
  const activeFunds = funds.filter((f) => f.status !== "closed");
  $("#fund-count").textContent = activeFunds.length;
  $("#fund-active-count").textContent = activeFunds.length;
  $("#fund-total-raised").textContent = currency(
    activeFunds.reduce(
      (sum, f) =>
        sum +
        (f.contributions || []).reduce(
          (s, c) => s + (Number(c.amountCents) || 0),
          0,
        ),
      0,
    ),
  );
  renderModeFeature();
  $("#roomie-grid").innerHTML = data.members.length
    ? data.members
        .map((member) => {
          const net =
            data.balances.netCents?.[
              Object.keys(data.balances.netCents || {}).find(
                (n) => n.toLowerCase() === member.displayName.toLowerCase(),
              )
            ] || 0;
          const assigned = data.chores.filter(
            (c) =>
              !c.done &&
              String(c.assignedTo || "")
                .replace(/^@/, "")
                .toLowerCase() ===
                String(member.username || member.displayName)
                  .replace(/^@/, "")
                  .toLowerCase(),
          ).length;
          return `<article class="roomie-card"><div class="roomie-avatar">${initials(member.displayName)}</div><h2>${escapeHtml(member.displayName)}</h2><span>${escapeHtml(member.username || t("ui.noUsername"))} · ${escapeHtml(member.role || t("ui.roleMember"))}</span><div class="roomie-meta"><div><small>${t("ui.balance")}</small><strong>${currency(net)}</strong></div><div><small>${t("navigation.chores")}</small><strong>${t("ui.assignedCount", { count: assigned })}</strong></div></div></article>`;
        })
        .join("")
    : empty(t("ui.roomiesEmpty"), "");
  const activityStatusClass = (event) => {
    const type = String(event?.type || "").toLowerCase();
    const message = String(event?.message || "").toLowerCase();
    const text = `${type} ${message}`;
    // Severity/state wins over category so the dots remain universally readable.
    if (/declin|reject|overdue|urgent|late|failed|problem/.test(text))
      return "status-urgent";
    if (
      /complet|confirmed|received|settled|purchased|bought|done|resolved|goal reached/.test(
        text,
      )
    )
      return "status-success";
    if (/fund|chip|contribut|goal/.test(text)) return "status-fund";
    if (
      /plan\.(created|joined)|joined .*plan|birthday|celebrat|movie night|party|outing|vacation/.test(
        text,
      )
    )
      return "status-cheerful";
    if (
      /chore|grocery|bring|request|unclaimed|pending|review|resubmit|await|settlement\.request|marked .*paid|due soon/.test(
        text,
      )
    )
      return "status-attention";
    if (/expense|payment|plan\.updated|settings|member|house|added/.test(text))
      return "status-info";
    return "status-muted";
  };
  $("#activity-count").textContent = data.activity.length;
  $("#activity-list").innerHTML = data.activity.length
    ? data.activity
        .map((event) => {
          const target = inferActivityTarget(event),
            actionable = Boolean(target.view);
          return `<article class="timeline-item ${activityStatusClass(event)} ${actionable ? "actionable" : ""}" ${actionable ? `role="button" tabindex="0" data-activity-view="${escapeHtml(target.view)}" data-activity-entity="${escapeHtml(target.id || "")}"` : ""}><strong>${escapeHtml(event.message)}</strong><small>${dateLabel(event.createdAt)} · ${escapeHtml(event.actor || "Cribbit")}${actionable ? " · Tap to open" : ""}</small></article>`;
        })
        .join("")
    : empty(t("ui.activityEmpty"), "");
  bindActivityActions();
  const sf = $("#settings-form");
  sf.elements.houseName.value = settings.houseName || "";
  sf.elements.currency.value = settings.currency || "USD";
  sf.elements.timezone.value = settings.timezone || "";
  sf.elements.locale.value = i18n.locale;
  sf.elements.defaultLocale.value = settings.defaultLocale || "en";
  sf.elements.notifications.checked = Boolean(settings.notifications);
  sf.elements.weeklyDigest.checked = Boolean(settings.weeklyDigest);
  sf.elements.quietHours.value = settings.quietHours || "";
  $("#house-locale-row").hidden = !["owner", "admin"].includes(viewer.role);
  renderModePicker($("#mode-picker"));
  const memberOptions = data.members
    .filter((m) => m.active !== false)
    .map(
      (m) =>
        `<option value="${escapeHtml(m.displayName)}">${escapeHtml(m.displayName)}</option>`,
    )
    .join("");
  $("#expense-payer").innerHTML = memberOptions;
  $("#expense-payer").value = viewer.displayName;
  $("#chore-assignee").innerHTML =
    `<option value="">Unassigned</option>${memberOptions}`;
  const requestPeople = data.members
    .filter(
      (m) =>
        m.active !== false &&
        String(m.displayName).toLowerCase() !==
          String(viewer.displayName).toLowerCase(),
    )
    .map(
      (m) =>
        `<option value="${escapeHtml(m.displayName)}">${escapeHtml(m.displayName)}</option>`,
    )
    .join("");
  if ($("#request-to"))
    $("#request-to").innerHTML =
      requestPeople || '<option value="">No other roomies</option>';
  if ($("#request-related")) {
    const groups = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const plans = (data.plans || []).filter((p) => {
      if (["completed", "cancelled"].includes(p.status)) return false;
      const raw = p.startsAt || p.date;
      if (!raw) return true;
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) || d >= today;
    });
    if (plans.length)
      groups.push(
        `<optgroup label="Current & upcoming plans">${plans.map((p) => `<option value="plan:${escapeHtml(p.id)}">${escapeHtml(p.title)}${p.startsAt || p.date ? ` · ${planDateLabel(p.startsAt || p.date)}` : ""}</option>`).join("")}</optgroup>`,
      );
    const wishes = (data.wishlists || []).filter(
      (w) => !["closed", "purchased", "cancelled"].includes(w.status),
    );
    if (wishes.length)
      groups.push(
        `<optgroup label="Active wishlists">${wishes.map((w) => `<option value="wishlist:${escapeHtml(w.id)}">${escapeHtml(w.title)}</option>`).join("")}</optgroup>`,
      );
    const funds = (data.funds || []).filter(
      (f) => !["closed", "completed", "cancelled"].includes(f.status),
    );
    if (funds.length)
      groups.push(
        `<optgroup label="Active funds">${funds.map((f) => `<option value="fund:${escapeHtml(f.id)}">${escapeHtml(f.title)}</option>`).join("")}</optgroup>`,
      );
    const chores = (data.chores || []).filter(
      (c) => !["verified_completed"].includes(choreStatus(c)),
    );
    if (chores.length)
      groups.push(
        `<optgroup label="Open chores">${chores.map((c) => `<option value="chore:${escapeHtml(c.id)}">${escapeHtml(c.task)}</option>`).join("")}</optgroup>`,
      );
    $("#request-related").innerHTML =
      '<option value="">Nothing specific</option>' + groups.join("");
  }
  bindDynamicActions();
  bindModePickerActions();
  renderNotificationBell();
  renderReports();
  showView(currentView, false);
}

function filterExpenses() {
  let items = [...data.expenses];
  const search = $("#expense-search")?.value.trim().toLowerCase();
  if (search)
    items = items.filter((e) =>
      `${e.description} ${e.paidBy} ${e.category}`
        .toLowerCase()
        .includes(search),
    );
  const sort = $("#expense-sort")?.value || "newest";
  items.sort((a, b) =>
    sort === "amount"
      ? (b.amountCents || 0) - (a.amountCents || 0)
      : sort === "oldest"
        ? new Date(a.createdAt) - new Date(b.createdAt)
        : new Date(b.createdAt) - new Date(a.createdAt),
  );
  return items;
}

function trustedReportExpenses() {
  return (data?.expenses || []).filter((e) => {
    const state = String(
      e.paymentStatus || e.verificationStatus || e.status || "approved",
    ).toLowerCase();
    return ![
      "pending",
      "pending_review",
      "rejected",
      "draft",
      "submitted",
    ].includes(state);
  });
}
function reportBounds() {
  const now = new Date();
  const range = $("#report-range")?.value || "month";
  let start,
    end = new Date(now);
  end.setHours(23, 59, 59, 999);
  if (range === "week") {
    start = new Date(now);
    const day = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
  } else if (range === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (range === "3months") {
    start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  } else if (range === "year") {
    start = new Date(now.getFullYear(), 0, 1);
  } else {
    const sv = $("#report-start")?.value,
      ev = $("#report-end")?.value;
    start = sv
      ? new Date(`${sv}T00:00:00`)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    end = ev ? new Date(`${ev}T23:59:59`) : end;
  }
  return { start, end, range };
}
function currentReportData() {
  const { start, end } = reportBounds();
  return trustedReportExpenses()
    .filter((e) => {
      const d = new Date(e.createdAt || e.date || 0);
      return !Number.isNaN(d.getTime()) && d >= start && d <= end;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
function renderReportBars(targetId, map, total) {
  const target = $(targetId);
  if (!target) return;
  const rows = [...map.entries()].sort((a, b) => b[1] - a[1]);
  target.innerHTML = rows.length
    ? rows
        .map(
          ([label, amount]) =>
            `<div class="report-bar"><b>${escapeHtml(label || "Other")}</b><span class="report-bar-track"><i style="width:${total ? Math.max(4, Math.round((amount / total) * 100)) : 0}%"></i></span><span>${currency(amount)}</span></div>`,
        )
        .join("")
    : '<div class="wish-empty">No verified spending in this period.</div>';
}
function renderReports() {
  if (!data || !$("#report-total")) return;
  const items = currentReportData();
  const { start, end } = reportBounds();
  const total = items.reduce(
    (s, e) =>
      s + (Number(e.amountCents) || Math.round(Number(e.amount || 0) * 100)),
    0,
  );
  const days = Math.max(1, Math.round((end - start) / 86400000) + 1);
  $("#report-total").textContent = currency(total);
  $("#report-count").textContent = items.length;
  $("#report-average").textContent = currency(Math.round(total / days));
  $("#report-period-label").textContent =
    `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`;
  const cats = new Map(),
    people = new Map();
  items.forEach((e) => {
    const amt =
      Number(e.amountCents) || Math.round(Number(e.amount || 0) * 100);
    cats.set(
      e.category || "Other",
      (cats.get(e.category || "Other") || 0) + amt,
    );
    people.set(
      e.paidBy || "Unknown",
      (people.get(e.paidBy || "Unknown") || 0) + amt,
    );
  });
  renderReportBars("#report-categories", cats, total);
  renderReportBars("#report-roomies", people, total);
  $("#report-rows").innerHTML = items.length
    ? items
        .map(
          (e) =>
            `<tr><td>${new Date(e.createdAt).toLocaleDateString()}</td><td>${escapeHtml(e.description || "Expense")}</td><td>${escapeHtml(e.category || "Other")}</td><td>${escapeHtml(e.paidBy || "—")}</td><td>${currency(Number(e.amountCents) || Math.round(Number(e.amount || 0) * 100))}</td></tr>`,
        )
        .join("")
    : '<tr><td colspan="5">No verified expenses in this period.</td></tr>';
}
function reportExportRows() {
  return currentReportData().map((e) => ({
    Date: new Date(e.createdAt).toLocaleDateString(),
    Description: e.description || "",
    Category: e.category || "Other",
    "Paid by": e.paidBy || "",
    Amount:
      (Number(e.amountCents) || Math.round(Number(e.amount || 0) * 100)) / 100,
    Currency: data?.settings?.currency || "USD",
  }));
}
function exportReportXlsx() {
  const rows = reportExportRows();
  if (!window.XLSX) {
    toast("XLSX exporter is still loading. Try again in a moment.", true);
    return;
  }
  const wb = XLSX.utils.book_new();
  const total = rows.reduce((s, r) => s + Number(r.Amount || 0), 0);
  const summary = [
    ["Cribbit spending report"],
    ["House", data?.settings?.houseName || data?.houseName || "Your crib"],
    ["Period", $("#report-period-label")?.textContent || ""],
    ["Verified spend", total],
    ["Expense count", rows.length],
    ["Generated", new Date().toLocaleString()],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "Summary");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Expenses");
  const settlements = (data?.balances?.settlements || []).map((x) => ({
    From: x.from,
    To: x.to,
    Amount: (Number(x.amountCents) || 0) / 100,
    Currency: data?.settings?.currency || "USD",
  }));
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(settlements),
    "Settlements",
  );
  XLSX.writeFile(
    wb,
    `Cribbit-Spending-${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}
function exportReportPdf() {
  const rows = reportExportRows();
  const jspdf = window.jspdf?.jsPDF;
  if (!jspdf) {
    toast("PDF exporter is still loading. Try again in a moment.", true);
    return;
  }
  const doc = new jspdf();
  doc.setFontSize(18);
  doc.text("Cribbit spending report", 14, 18);
  doc.setFontSize(10);
  doc.text($("#report-period-label")?.textContent || "", 14, 25);
  doc.text(`Verified spend: ${$("#report-total")?.textContent || ""}`, 14, 31);
  if (typeof doc.autoTable === "function")
    doc.autoTable({
      startY: 38,
      head: [["Date", "Description", "Category", "Paid by", "Amount"]],
      body: rows.map((r) => [
        r.Date,
        r.Description,
        r.Category,
        r["Paid by"],
        `${r.Amount.toFixed(2)} ${r.Currency}`,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [34, 116, 112] },
    });
  else doc.text("Expense detail export unavailable.", 14, 40);
  doc.save(`Cribbit-Spending-${new Date().toISOString().slice(0, 10)}.pdf`);
}

function showView(view, scroll = true) {
  const allowed = [
    "overview",
    "expenses",
    "chores",
    "groceries",
    "plans",
    "requests",
    "wishlists",
    "funds",
    "roomies",
    "activity",
    "reports",
    "settings",
  ];
  currentView = allowed.includes(view) ? view : "overview";
  $$("[data-panel]").forEach(
    (panel) => (panel.hidden = panel.dataset.panel !== currentView),
  );
  $$("[data-view]").forEach((button) =>
    button.classList.toggle("active", button.dataset.view === currentView),
  );
  $$(".bottom-nav button").forEach((button) =>
    button.classList.toggle("active", button.dataset.view === currentView),
  );
  $("#more-menu").hidden = true;
  history.replaceState(
    null,
    "",
    `${location.pathname}${location.search}#${currentView}`,
  );
  if (currentView === "reports") renderReports();
  document.querySelector(".bottom-nav")?.classList.remove("nav-hidden");
  if (scroll) scrollTo({ top: 0, behavior: "smooth" });
}
function toast(message, error = false) {
  const node = $("#toast");
  node.textContent = message;
  node.classList.toggle("error", error);
  node.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (node.hidden = true), 3200);
}

function normalizeActionName(action) {
  if (action === "expense.submit") return "payment.claim.submit";
  if (action === "expense.approve") return "payment.claim.approve";
  if (action === "expense.reject") return "payment.claim.reject";
  return action;
}

async function apiAction(action, payload) {
  const normalizedAction = normalizeActionName(action);
  if (demoMode) {
    demoAction(normalizedAction, payload);
    render();
    toast(t("dashboard.demoUpdated"));
    return;
  }
  const response = await apiFetch(`${apiBaseUrl}/api/action`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Telegram-Init-Data": initData,
    },
    body: JSON.stringify({ chatId, action: normalizedAction, payload }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(body.error || "Cribbit could not save that change.");
  await loadData();
  toast(t("dashboard.saved"));
}
function demoAction(action, payload) {
  const stamp = new Date().toISOString();
  const actor = data.viewer.displayName;
  if (action === "expense.add") {
    const cents = Math.round(Number(payload.amount) * 100);
    data.expenses.push({
      id: `demo-e-${Date.now()}`,
      amountCents: cents,
      amount: cents / 100,
      description: payload.description,
      paidBy: payload.paidBy || actor,
      participants: data.members.map((m) => m.displayName),
      category: payload.category || "Other",
      createdAt: stamp,
    });
    data.balances.totalSpentCents += cents;
  }
  if (action === "chore.add")
    data.chores.push({
      id: `demo-c-${Date.now()}`,
      task: payload.task,
      assignedTo: payload.assignedTo || null,
      dueDate: payload.dueDate || null,
      priority: payload.priority || "normal",
      done: false,
      status: "open",
      createdAt: stamp,
    });
  if (action === "chore.complete.submit") {
    const item = data.chores.find((i) => i.id === payload.choreId);
    if (item) {
      item.status = "pending_review";
      item.done = false;
      item.submittedBy = actor;
      item.submittedAt = stamp;
      item.reviewComment = "";
    }
  }
  if (action === "chore.review.approve") {
    const item = data.chores.find((i) => i.id === payload.choreId);
    if (item && item.status === "pending_review") {
      item.status = "verified_completed";
      item.done = true;
      item.doneBy = item.submittedBy || item.assignedTo || actor;
      item.verifiedBy = actor;
      item.verifiedAt = stamp;
    }
  }
  if (action === "chore.review.needs_fixing") {
    const item = data.chores.find((i) => i.id === payload.choreId);
    if (item) {
      item.status = "needs_fixing";
      item.done = false;
      item.reviewComment =
        payload.comment || "Please check the chore and try again.";
      item.reviewedBy = actor;
      item.reviewedAt = stamp;
    }
  }
  if (action === "chore.review.resubmit") {
    const item = data.chores.find((i) => i.id === payload.choreId);
    if (item) {
      item.status = "pending_review";
      item.submittedBy = actor;
      item.submittedAt = stamp;
    }
  }
  if (action === "grocery.add")
    data.groceries.push({
      id: `demo-g-${Date.now()}`,
      name: payload.name,
      quantity: "1",
      category: "Other",
      priority: payload.priority || "normal",
      addedBy: actor,
      purchased: false,
      createdAt: stamp,
    });
  if (action === "grocery.toggle") {
    const item = data.groceries.find((i) => i.id === payload.id);
    if (item) item.purchased = payload.purchased;
  }
  if (action === "fund.create") {
    const goalCents = Math.round(
      Number(payload.goal || payload.goalCents / 100) * 100,
    );
    data.funds = data.funds || [];
    data.funds.push({
      id: `demo-f-${Date.now()}`,
      title: payload.title,
      goalCents,
      contributions: [],
      status: "open",
      createdAt: stamp,
    });
  }
  if (action === "fund.chipin") {
    const fund = (data.funds || []).find(
      (f) => String(f.id) === String(payload.fundId),
    );
    if (fund) {
      fund.contributions = fund.contributions || [];
      fund.contributions.push({
        user: actor,
        amountCents: Math.round(
          Number(payload.amount || payload.amountCents / 100) * 100,
        ),
      });
    }
  }
  if (action === "plan.create") {
    data.plans = data.plans || [];
    data.plans.unshift({
      id: `demo-p-${Date.now()}`,
      title: payload.title,
      type:
        payload.type === "Custom"
          ? payload.customType || "Custom"
          : payload.type,
      customType: payload.customType || "",
      description: payload.description || "",
      location: payload.location || "",
      startsAt: payload.startsAt || payload.date,
      status: "active",
      costMode: payload.costMode || "free",
      estimatedBudgetCents: payload.estimatedBudgetCents || 0,
      createdBy: actor,
      participants: [actor],
      bringItems: (payload.bringItems || []).map((name, i) => ({
        id: `bi-${Date.now()}-${i}`,
        name,
        claimedBy: null,
      })),
    });
  }
  if (action === "plan.join") {
    const plan = (data.plans || []).find(
      (p) => String(p.id) === String(payload.planId),
    );
    if (plan) {
      plan.participants = plan.participants || [];
      if (!viewerJoined(plan)) plan.participants.push(actor);
    }
  }
  if (action === "plan.leave") {
    const plan = (data.plans || []).find(
      (p) => String(p.id) === String(payload.planId),
    );
    if (plan)
      plan.participants = (plan.participants || []).filter(
        (p) => String(p).toLowerCase() !== actor.toLowerCase(),
      );
  }
  if (action === "settlement.request") {
    data.settlementRequests = data.settlementRequests || [];
    const duplicate = data.settlementRequests.find(
      (r) =>
        r.status === "pending" &&
        String(r.from).toLowerCase() === String(payload.from).toLowerCase() &&
        String(r.to).toLowerCase() === String(payload.to).toLowerCase() &&
        Number(r.amountCents) === Number(payload.amountCents),
    );
    if (!duplicate)
      data.settlementRequests.push({
        id: `demo-s-${Date.now()}`,
        from: payload.from,
        to: payload.to,
        amountCents: Number(payload.amountCents) || 0,
        status: "pending",
        requestedAt: stamp,
        requestedBy: actor,
      });
  }
  if (action === "settlement.confirm") {
    const request = (data.settlementRequests || []).find(
      (r) => String(r.id) === String(payload.requestId),
    );
    if (request && request.status === "pending") {
      request.status = "confirmed";
      request.confirmedAt = stamp;
      request.confirmedBy = actor;
      const idx = (data.balances.settlements || []).findIndex(
        (s) =>
          String(s.from).toLowerCase() === String(request.from).toLowerCase() &&
          String(s.to).toLowerCase() === String(request.to).toLowerCase() &&
          Number(s.amountCents) === Number(request.amountCents),
      );
      if (idx >= 0) data.balances.settlements.splice(idx, 1);
      if (data.balances.netCents) {
        data.balances.netCents[request.from] =
          (Number(data.balances.netCents[request.from]) || 0) +
          Number(request.amountCents);
        data.balances.netCents[request.to] =
          (Number(data.balances.netCents[request.to]) || 0) -
          Number(request.amountCents);
      }
    }
  }
  if (action === "settlement.decline") {
    const request = (data.settlementRequests || []).find(
      (r) => String(r.id) === String(payload.requestId),
    );
    if (request) {
      request.status = "declined";
      request.declinedAt = stamp;
      request.declinedBy = actor;
    }
  }
  if (action === "wishlist.create") {
    data.wishlists = data.wishlists || [];
    data.wishlists.unshift({
      id: `demo-w-${Date.now()}`,
      area: payload.area,
      title: payload.title,
      category: payload.category || "Custom",
      createdBy: actor,
      targetCents: Number(payload.targetCents) || 0,
      participants: [actor],
      contributions: [],
      status: "open",
    });
  }
  if (action === "wishlist.join") {
    const w = (data.wishlists || []).find(
      (x) => String(x.id) === String(payload.wishId),
    );
    if (w) {
      w.participants = w.participants || [];
      if (!wishJoined(w)) w.participants.push(actor);
    }
  }
  if (action === "wishlist.leave") {
    const w = (data.wishlists || []).find(
      (x) => String(x.id) === String(payload.wishId),
    );
    if (w)
      w.participants = (w.participants || []).filter(
        (n) => String(n).toLowerCase() !== actor.toLowerCase(),
      );
  }
  if (action === "request.create") {
    data.requests = data.requests || [];
    data.requests.unshift({
      id: `demo-r-${Date.now()}`,
      from: actor,
      to: payload.to,
      type: payload.type || "other",
      message: payload.message,
      planId: payload.planId || "",
      dueDate: payload.dueDate || "",
      status: "open",
      createdAt: stamp,
    });
  }
  if (action === "request.accept") {
    const r = (data.requests || []).find(
      (x) => String(x.id) === String(payload.requestId),
    );
    if (r) r.status = "accepted";
  }
  if (action === "request.decline") {
    const r = (data.requests || []).find(
      (x) => String(x.id) === String(payload.requestId),
    );
    if (r) r.status = "declined";
  }
  if (action === "request.complete") {
    const r = (data.requests || []).find(
      (x) => String(x.id) === String(payload.requestId),
    );
    if (r) r.status = "done";
  }
  if (action === "wishlist.chipin") {
    const w = (data.wishlists || []).find(
      (x) => String(x.id) === String(payload.wishId),
    );
    if (w) {
      w.participants = w.participants || [];
      if (!wishJoined(w)) w.participants.push(actor);
      w.contributions = w.contributions || [];
      w.contributions.push({
        user: actor,
        amountCents: Number(payload.amountCents) || 0,
      });
    }
  }
  if (action === "wishlist.claim") {
    const w = (data.wishlists || []).find(
      (x) => String(x.id) === String(payload.wishId),
    );
    if (w) w.claimedBy = w.claimedBy === actor ? null : actor;
  }
  if (action === "payment.claim.submit") {
    data.expenseClaims = data.expenseClaims || [];
    data.expenseClaims.unshift({
      id: `demo-x-${Date.now()}`,
      description: payload.description,
      paidBy: payload.paidBy || actor,
      amountCents:
        Number(payload.amountCents) ||
        Math.round(Number(payload.amount || 0) * 100),
      category: payload.category || "Other",
      notes: payload.notes || "",
      receiptUrl: payload.receiptDataUrl || "",
      receiptText: payload.receiptText || "",
      receiptItems: parseReceiptText(payload.receiptText || "").items,
      status: "pending",
      submittedAt: stamp,
      submittedBy: actor,
    });
  }
  if (action === "payment.claim.approve") {
    const claim = (data.expenseClaims || []).find(
      (c) => String(c.id) === String(payload.claimId),
    );
    if (claim && claim.status === "pending") {
      claim.status = "approved";
      claim.approvedAt = stamp;
      claim.approvedBy = actor;
      data.expenses.unshift({
        id: `e-${Date.now()}`,
        description: claim.description,
        paidBy: claim.paidBy,
        amountCents: claim.amountCents,
        amount: claim.amountCents / 100,
        category: claim.category,
        participants: data.members.map((m) => m.displayName),
        createdAt: claim.submittedAt,
        approvalStatus: "approved",
        receiptClaimId: claim.id,
      });
      data.balances.totalSpentCents =
        (Number(data.balances.totalSpentCents) || 0) + claim.amountCents;
    }
  }
  if (action === "payment.claim.reject") {
    const claim = (data.expenseClaims || []).find(
      (c) => String(c.id) === String(payload.claimId),
    );
    if (claim && claim.status === "pending") {
      claim.status = "rejected";
      claim.rejectedAt = stamp;
      claim.rejectedBy = actor;
      claim.rejectionComment = payload.comment || "Rejected by admin";
    }
  }
  if (action === "settings.update") Object.assign(data.settings, payload);
  if (action === "locale.update") {
    data.locale = payload.locale;
    data.viewer.locale = payload.locale;
  }
  const activityMessage =
    action === "payment.claim.submit"
      ? `${actor} submitted a payment claim for review`
      : action === "payment.claim.approve"
        ? `${actor} approved a payment claim`
        : action === "payment.claim.reject"
          ? `${actor} rejected a payment claim`
          : action === "chore.complete.submit"
            ? `${actor} submitted a chore for review`
            : action === "chore.review.approve"
              ? `${actor} verified a completed chore`
              : action === "chore.review.needs_fixing"
                ? `${actor} sent chore feedback`
                : action === "chore.review.resubmit"
                  ? `${actor} resubmitted a chore`
                  : action === "settlement.request"
                    ? `${actor} marked a settlement as paid`
                    : action === "settlement.confirm"
                      ? `${actor} confirmed a settlement was received`
                      : action === "settlement.decline"
                        ? `${actor} declined a settlement confirmation`
                        : action === "request.create"
                          ? `${actor} sent a request to ${payload.to}`
                          : action === "request.accept"
                            ? `${actor} accepted a request`
                            : action === "request.complete"
                              ? `${actor} completed a request`
                              : action === "request.decline"
                                ? `${actor} declined a request`
                                : action === "fund.chipin"
                                  ? `${actor} chipped in to a fund`
                                  : action.startsWith("plan.")
                                    ? `${actor} updated a plan`
                                    : action.startsWith("wishlist.")
                                      ? `${actor} updated a wishlist`
                                      : `${actor} updated the demo house`;
  const relatedView = action.startsWith("plan.")
    ? "plans"
    : action.startsWith("fund.")
      ? "funds"
      : action.startsWith("wishlist.")
        ? "wishlists"
        : action.startsWith("chore.")
          ? "chores"
          : action.startsWith("settlement.") || action.startsWith("expense.")
            ? "expenses"
            : action.startsWith("request.")
              ? "requests"
              : "";
  const relatedId =
    payload.planId ||
    payload.fundId ||
    payload.wishId ||
    payload.choreId ||
    payload.requestId ||
    payload.claimId ||
    "";
  data.activity.unshift({
    id: `demo-a-${Date.now()}`,
    message: activityMessage,
    actor,
    type: action,
    createdAt: stamp,
    relatedView,
    relatedId,
  });
}
async function fetchDashboard(targetChatId) {
  const response = await apiFetch(
    `${apiBaseUrl}/api/dashboard?chatId=${encodeURIComponent(targetChatId)}`,
    { headers: { "X-Telegram-Init-Data": initData } },
  );
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      body.error || `Could not open this crib (API ${response.status}).`,
    );
  return body;
}
async function loadData(targetChatId = chatId) {
  const body = await fetchDashboard(targetChatId);
  await i18n.load(body.locale || body.viewer?.locale || "en");
  chatId = String(targetChatId);
  data = body;
  render();
}
function showAuthGate(title, message) {
  $("#loading").hidden = true;
  $("#app").hidden = true;
  $("#auth-gate").hidden = false;
  $("#auth-title").textContent = title;
  $("#auth-copy").textContent = message;
}
async function fetchHouses() {
  const response = await apiFetch(`${apiBaseUrl}/api/houses`, {
    headers: { "X-Telegram-Init-Data": initData },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      body.error || `Could not find your cribs (API ${response.status}).`,
    );
  availableHouses = Array.isArray(body.houses) ? body.houses : [];
  return body;
}
async function persistActiveCrib(targetChatId) {
  const response = await apiFetch(`${apiBaseUrl}/api/preferences/active-crib`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Telegram-Init-Data": initData,
    },
    body: JSON.stringify({ chatId: String(targetChatId) }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      body.error || `Could not save your active crib (API ${response.status}).`,
    );
  return body.activeChatId;
}
function syncCribUrl() {
  const next = new URL(location.href);
  next.searchParams.set("chatId", chatId);
  history.replaceState(null, "", next);
}
function renderCribChoices(container, { limit = Infinity, menu = false } = {}) {
  if (!container) return;
  const choices = Number.isFinite(limit)
    ? [...availableHouses].sort(
        (left, right) =>
          Number(String(right.chatId) === String(chatId)) -
          Number(String(left.chatId) === String(chatId)),
      )
    : availableHouses;
  container.innerHTML = choices
    .slice(0, limit)
    .map(
      (house) =>
        `<button${menu ? ' role="menuitem"' : ' class="secondary-button"'} type="button" data-crib-id="${escapeHtml(house.chatId)}" ${String(house.chatId) === String(chatId) ? 'aria-current="true"' : ""}><span>${escapeHtml(house.houseName)}</span><small>${escapeHtml(house.role)}${String(house.chatId) === String(chatId) ? " · Current" : ""}</small></button>`,
    )
    .join("");
  container
    .querySelectorAll("[data-crib-id]")
    .forEach(
      (button) =>
        (button.onclick = () =>
          switchCrib(button.dataset.cribId).catch((error) =>
            toast(error.message, true),
          )),
    );
}
function closeCribDropdowns() {
  $$(".crib-dropdown-menu").forEach((menu) => (menu.hidden = true));
  $("#house-switcher-button")?.setAttribute("aria-expanded", "false");
  $("#mobile-house-switcher")?.setAttribute("aria-expanded", "false");
}
async function toggleCribDropdown(trigger, menu) {
  const opening = menu.hidden;
  closeCribDropdowns();
  if (!opening) return;
  if (demoMode) {
    toast(
      "Crib switching is available after opening Cribbit through Telegram.",
    );
    return;
  }
  await fetchHouses();
  if (!availableHouses.length)
    throw new Error("No active Telegram group Cribs were found.");
  renderCribChoices(menu, { limit: 4, menu: true });
  menu.hidden = false;
  trigger.setAttribute("aria-expanded", "true");
}
async function switchCrib(targetChatId) {
  if (switchingCrib) return;
  const target = String(targetChatId);
  if (!availableHouses.some((house) => String(house.chatId) === target))
    throw new Error("That Crib is no longer available.");
  switchingCrib = true;
  $$("[data-crib-id]").forEach((button) => (button.disabled = true));
  try {
    const nextData = await fetchDashboard(target);
    await i18n.load(nextData.locale || nextData.viewer?.locale || "en");
    await persistActiveCrib(target);
    chatId = target;
    data = nextData;
    render();
    syncCribUrl();
    $("#auth-gate").hidden = true;
    $("#loading").hidden = true;
    $("#app").hidden = false;
    const dialog = $("#crib-switcher-modal");
    if (dialog.open) dialog.close();
    closeCribDropdowns();
    toast(`Opened ${data.settings.houseName}.`);
  } finally {
    switchingCrib = false;
    $$("[data-crib-id]").forEach((button) => (button.disabled = false));
  }
}
async function openCribSwitcher() {
  if (demoMode) {
    toast(
      "Crib switching is available after opening Cribbit through Telegram.",
    );
    return;
  }
  await fetchHouses();
  if (!availableHouses.length)
    throw new Error("No active Telegram group Cribs were found.");
  renderCribChoices($("#crib-switcher-list"));
  $("#crib-switcher-modal").showModal();
}
async function chooseHouse() {
  const body = await fetchHouses();
  if (availableHouses.length === 0) {
    showAuthGate(
      "Add Cribbit to your group",
      "No shared house is connected to your Telegram account yet. Add Cribbit to a group, send /start, then open the app again.",
    );
    return false;
  }
  const preferred = preferredHouseId(availableHouses, body.activeChatId);
  if (preferred) {
    chatId = preferred;
    if (String(body.activeChatId || "") !== preferred)
      await persistActiveCrib(preferred);
    return true;
  }
  showAuthGate(
    "Choose your crib",
    "You belong to more than one Cribbit house. Choose the one you want to open.",
  );
  $("#open-telegram").hidden = true;
  $("#open-demo").hidden = true;
  const selector = $("#house-selector");
  selector.hidden = false;
  renderCribChoices(selector);
  return false;
}
function bindDynamicActions() {
  $$('[data-chore-submit]').forEach((button) => (button.onclick = () => apiAction('chore.complete.submit', { choreId: button.dataset.choreSubmit }).catch((e) => toast(e.message, true))));
  $$('[data-chore-resubmit]').forEach((button) => (button.onclick = () => apiAction('chore.review.resubmit', { choreId: button.dataset.choreResubmit }).catch((e) => toast(e.message, true))));
  $$("[data-chore-toggle]").forEach(
    (button) =>
      (button.onclick = () =>
        apiAction("chore.toggle", {
          id: button.dataset.choreToggle,
          done: button.dataset.done === "true",
        }).catch((e) => toast(e.message, true))),
  );
  $$("[data-grocery-toggle]").forEach(
    (button) =>
      (button.onclick = () =>
        apiAction("grocery.toggle", {
          id: button.dataset.groceryToggle,
          purchased: button.dataset.purchased === "true",
        }).catch((e) => toast(e.message, true))),
  );
  $$("[data-chipin]").forEach(
    (button) =>
      (button.onclick = () => {
        $("#chipin-fund-id").value = button.dataset.chipin;
        $("#chipin-title").textContent =
          `Chip in to ${button.dataset.fundTitle || "this goal"}`;
        $("#chipin-modal").showModal();
      }),
  );
  $$("[data-fund-expand]").forEach(
    (button) =>
      (button.onclick = () => {
        const panel = document.getElementById(
          button.getAttribute("aria-controls"),
        );
        if (!panel) return;
        const isOpen = button.getAttribute("aria-expanded") === "true";
        button.setAttribute("aria-expanded", String(!isOpen));
        button.setAttribute(
          "aria-label",
          isOpen ? "Show contributors" : "Hide contributors",
        );
        panel.classList.toggle("open", !isOpen);
      }),
  );
}

$$("[data-view]").forEach((button) =>
  button.addEventListener("click", () => {
    showView(button.dataset.view);
    const focus = button.dataset.focus;
    if (focus) setTimeout(() => document.getElementById(focus)?.focus(), 80);
  }),
);
const moreButton = $("#mobile-more"),
  moreMenu = $("#more-menu");
function positionMoreMenu() {
  if (!moreButton || !moreMenu) return;
  const r = moreButton.getBoundingClientRect();
  document.documentElement.style.setProperty(
    "--more-menu-top",
    `${Math.round(r.bottom + 7)}px`,
  );
  document.documentElement.style.setProperty(
    "--more-menu-right",
    `${Math.max(8, Math.round(innerWidth - r.right))}px`,
  );
}
moreButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  positionMoreMenu();
  moreMenu.hidden = !moreMenu.hidden;
});
addEventListener("resize", () => {
  if (moreMenu && !moreMenu.hidden) positionMoreMenu();
});
document.addEventListener("click", (event) => {
  if (
    moreMenu &&
    !moreMenu.hidden &&
    !moreMenu.contains(event.target) &&
    event.target !== moreButton
  )
    moreMenu.hidden = true;
});

// Mobile-native bottom navigation: hide on deliberate downward scroll, reveal on upward scroll.
(() => {
  const nav = document.querySelector(".bottom-nav");
  if (!nav) return;
  let lastY = Math.max(0, window.scrollY),
    accumulated = 0,
    lastDirection = 0,
    ticking = false;
  const SHOW_NEAR_TOP = 72,
    HIDE_DISTANCE = 34,
    SHOW_DISTANCE = 18;
  const update = () => {
    const y = Math.max(0, window.scrollY);
    const delta = y - lastY;
    if (y <= SHOW_NEAR_TOP) {
      nav.classList.remove("nav-hidden");
      accumulated = 0;
      lastDirection = 0;
      lastY = y;
      ticking = false;
      return;
    }
    if (Math.abs(delta) < 2) {
      lastY = y;
      ticking = false;
      return;
    }
    const direction = delta > 0 ? 1 : -1;
    if (direction !== lastDirection) {
      accumulated = 0;
      lastDirection = direction;
    }
    accumulated += Math.abs(delta);
    if (direction > 0 && accumulated >= HIDE_DISTANCE) {
      nav.classList.add("nav-hidden");
      accumulated = 0;
    }
    if (direction < 0 && accumulated >= SHOW_DISTANCE) {
      nav.classList.remove("nav-hidden");
      accumulated = 0;
    }
    lastY = y;
    ticking = false;
  };
  addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true },
  );
  addEventListener("pageshow", () => nav.classList.remove("nav-hidden"));
  document.addEventListener(
    "close",
    () => nav.classList.remove("nav-hidden"),
    true,
  );
})();
[
  ["#house-switcher-button", "#sidebar-crib-menu"],
  ["#mobile-house-switcher", "#mobile-crib-menu"],
].forEach(([triggerSelector, menuSelector]) => {
  const trigger = $(triggerSelector);
  const menu = $(menuSelector);
  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleCribDropdown(trigger, menu).catch((error) =>
      toast(error.message, true),
    );
  });
});
$("#settings-switch-crib").addEventListener("click", () =>
  openCribSwitcher().catch((error) => toast(error.message, true)),
);
function goHome() {
  closeCribDropdowns();
  showView("overview");
  document.querySelector(".bottom-nav")?.classList.remove("nav-hidden");
}
$("#brand-home-button").addEventListener("click", goHome);
$("#mobile-home-button").addEventListener("click", goHome);
document.addEventListener("click", (event) => {
  if (!event.target.closest(".crib-dropdown")) closeCribDropdowns();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeCribDropdowns();
});
$$("[data-modal]").forEach((button) =>
  button.addEventListener("click", () => {
    if (
      button.dataset.modal === "expense-modal" &&
      button.dataset.expenseCategory
    ) {
      $("#expense-category").value = button.dataset.expenseCategory;
    }
    document.getElementById(button.dataset.modal).showModal();
  }),
);
$$("[data-close]").forEach((button) =>
  button.addEventListener("click", () => button.closest("dialog").close()),
);
$$("dialog").forEach((dialog) =>
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const content = dialog.firstElementChild;
    if (!content) return;
    const bounds = content.getBoundingClientRect();
    const outside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;
    if (outside) dialog.close();
  }),
);
$$("[data-wishlist-toggle]").forEach((btn) =>
  btn.addEventListener("click", () =>
    document
      .querySelector(`[data-wishlist-card="${btn.dataset.wishlistToggle}"]`)
      ?.classList.toggle("open"),
  ),
);
$$("[data-wishlist-create]").forEach((btn) =>
  btn.addEventListener("click", () => {
    const card = document.querySelector(
      `[data-wishlist-card="${btn.dataset.wishlistCreate}"]`,
    );
    card?.classList.add("open");
    wishlistCreateForm(btn.dataset.wishlistCreate);
  }),
);
$("#expense-wishlist-search")?.addEventListener(
  "input",
  () => data && renderWishlists(),
);
$("#grocery-wishlist-search")?.addEventListener(
  "input",
  () => data && renderWishlists(),
);
$$("[data-open-wishlist]").forEach((btn) =>
  btn.addEventListener("click", () => {
    const area = btn.dataset.openWishlist;
    showView(area === "groceries" ? "groceries" : "expenses");
    setTimeout(
      () =>
        document
          .querySelector(`[data-wishlist-card="${area}"]`)
          ?.classList.add("open"),
      60,
    );
  }),
);
$("#expense-search").addEventListener(
  "input",
  () => data && renderExpenses(filterExpenses(), $("#expense-list")),
);
$("#expense-sort").addEventListener(
  "change",
  () => data && renderExpenses(filterExpenses(), $("#expense-list")),
);
function submitForm(event, action, dialog) {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = Object.fromEntries(new FormData(form));
  return runFormSubmission({
    form,
    dialog,
    submitButton: form.querySelector('[type="submit"]'),
    save: () => apiAction(action, payload),
    onError: (error) => toast(error.message, true),
  });
}
function handleReceiptSelected(file) {
  if (!file) return;
  activeReceiptFile = file;
  $("#receipt-file-name").textContent = file.name || "Camera receipt";
  $("#receipt-preview").classList.add("visible");
  const reader = new FileReader();
  reader.onload = () => {
    activeReceiptDataUrl = String(reader.result || "");
    $("#receipt-preview-image").src = activeReceiptDataUrl;
  };
  reader.readAsDataURL(file);
  setOcrStatus("Receipt ready. Scan it or enter the details manually.");
  setTimeout(() => scanReceiptLocal(), 100);
}
$("#take-receipt-photo").addEventListener("click", () => {
  const input = $("#expense-receipt-camera");
  input.value = "";
  input.click();
});
$("#upload-receipt-photo").addEventListener("click", () => {
  const input = $("#expense-receipt");
  input.value = "";
  input.click();
});
$("#expense-receipt").addEventListener("change", (event) =>
  handleReceiptSelected(event.target.files?.[0]),
);
$("#expense-receipt-camera").addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  handleReceiptSelected(file);
});
$("#scan-receipt").addEventListener("click", () => scanReceiptLocal());
$("#cloud-scan-receipt").addEventListener("click", () => scanReceiptCloud());
$("#expense-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!activeReceiptFile) {
    toast("Take a photo or upload a receipt before submitting.", true);
    return;
  }
  const values = new FormData(form);
  const amount = Number(values.get("amount"));
  const description = String(values.get("description") || "").trim();
  if (!description || !Number.isFinite(amount) || amount <= 0) {
    toast("Enter a description and a valid expense amount.", true);
    return;
  }
  const parsed = parseReceiptText(String(values.get("receiptText") || ""));
  return runFormSubmission({
    form,
    dialog: $("#expense-modal"),
    submitButton: form.querySelector('[type="submit"]'),
    save: () =>
      apiAction("payment.claim.submit", {
        description,
        amountCents: Math.round(amount * 100),
        paidBy: String(values.get("paidBy") || data.viewer?.displayName || ""),
        category: String(values.get("category") || "Other"),
        notes: String(values.get("notes") || "").trim(),
        receiptText: parsed.text,
        receiptConfidence: Number(values.get("receiptConfidence") || 0),
        receiptItems: parsed.items,
        receiptUrl: activeReceiptDataUrl,
      }),
    onError: (error) => toast(error.message, true),
  }).then((saved) => {
    if (!saved) return;
    activeReceiptDataUrl = "";
    activeReceiptFile = null;
    $("#receipt-preview").classList.remove("visible");
    $("#ocr-items").classList.remove("visible");
    setOcrStatus("Upload a receipt to begin.");
    toast("Payment claim submitted for admin review.");
    showView("expenses");
  });
});
$("#expense-reject-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const fd = new FormData(form);
  const claimId = fd.get("claimId"),
    comment = String(fd.get("comment") || "").trim();
  if (!comment) {
    toast("Add a rejection comment.", true);
    return;
  }
  return runFormSubmission({
    form,
    dialog: $("#expense-reject-modal"),
    submitButton: form.querySelector('[type="submit"]'),
    save: () => apiAction("payment.claim.reject", { claimId, comment }),
    onError: (error) => toast(error.message, true),
  });
});
$("#chore-review-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const fd = new FormData(form);
  const choreId = fd.get("choreId"),
    comment = String(fd.get("comment") || "").trim();
  if (!comment) {
    toast("Tell them what needs fixing.", true);
    return;
  }
  return runFormSubmission({
    form,
    dialog: $("#chore-review-modal"),
    submitButton: form.querySelector('[type="submit"]'),
    save: () => apiAction("chore.review.needs_fixing", { choreId, comment }),
    onError: (error) => toast(error.message, true),
  });
});
$("#request-related")?.addEventListener("change", (event) => {
  const value = String(event.target.value || "");
  if (!value.startsWith("plan:")) return;
  const id = value.slice(5);
  const plan = (data.plans || []).find((p) => String(p.id) === id);
  const due = $("#request-form")?.elements?.dueDate;
  if (plan && due && !due.value) {
    const raw = plan.startsAt || plan.date;
    if (raw) {
      const d = new Date(raw);
      if (!Number.isNaN(d.getTime())) due.value = d.toISOString().slice(0, 10);
    }
  }
});
$("#request-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const fd = new FormData(form);
  const related = String(fd.get("relatedEntity") || "");
  const [relatedType = "", relatedId = ""] = related.includes(":")
    ? related.split(/:(.+)/)
    : ["", ""];
  const payload = {
    to: String(fd.get("to") || ""),
    type: String(fd.get("type") || "other"),
    message: String(fd.get("message") || "").trim(),
    dueDate: String(fd.get("dueDate") || ""),
    relatedType,
    relatedId,
    planId: relatedType === "plan" ? relatedId : "",
  };
  if (!payload.to || !payload.message) {
    toast("Choose a roomie and write the request.", true);
    return;
  }
  return runFormSubmission({
    form,
    dialog: $("#request-modal"),
    submitButton: form.querySelector('[type="submit"]'),
    save: () => apiAction("request.create", payload),
    onError: (error) => toast(error.message, true),
    onSuccess: () => showView("requests"),
  });
});
$("#chore-form").addEventListener("submit", (event) =>
  submitForm(event, "chore.add", $("#chore-modal")),
);
$("#chore-quick-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = $("#chore-quick-input");
  const task = input.value.trim();
  if (!task) return;
  try {
    await apiAction("chore.add", { task, assignedTo: "", priority: "normal" });
    input.value = "";
  } catch (error) {
    toast(error.message, true);
  }
});
$("#grocery-form").addEventListener("submit", (event) =>
  submitForm(event, "grocery.add"),
);
$("#fund-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const fd = new FormData(form);
  const title = String(fd.get("title") || "").trim();
  const goal = Number(fd.get("goal"));
  if (!title || !goal || goal <= 0) {
    toast("Add a goal name and target amount.", true);
    return;
  }
  return runFormSubmission({
    form,
    dialog: $("#fund-modal"),
    submitButton: form.querySelector('[type="submit"]'),
    save: () =>
      apiAction("fund.create", {
        title,
        goal,
        goalCents: Math.round(goal * 100),
      }),
    onError: (error) => toast(error.message, true),
  });
});
$("#chipin-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const fd = new FormData(form);
  const fundId = fd.get("fundId");
  const amount = Number(fd.get("amount"));
  if (!fundId || !amount || amount <= 0) {
    toast("Enter an amount to chip in.", true);
    return;
  }
  return runFormSubmission({
    form,
    dialog: $("#chipin-modal"),
    submitButton: form.querySelector('[type="submit"]'),
    save: () =>
      apiAction("fund.chipin", {
        fundId,
        amount,
        amountCents: Math.round(amount * 100),
      }),
    onError: (error) => toast(error.message, true),
  });
});
$("#wishlist-chipin-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const fd = new FormData(form);
  const wishId = fd.get("wishId");
  const amount = Number(fd.get("amount"));
  if (!wishId || !amount || amount <= 0) {
    toast("Enter an amount to chip in.", true);
    return;
  }
  return runFormSubmission({
    form,
    dialog: $("#wishlist-chipin-modal"),
    submitButton: form.querySelector('[type="submit"]'),
    save: () =>
      apiAction("wishlist.chipin", {
        wishId,
        amount,
        amountCents: Math.round(amount * 100),
      }),
    onError: (error) => toast(error.message, true),
  });
});
let planBringDraft = [];
function renderPlanBringDraft() {
  const box = $("#plan-bring-list");
  if (box)
    box.innerHTML = planBringDraft
      .map(
        (name, i) =>
          `<span class="draft-item">${escapeHtml(name)}<button type="button" aria-label="Remove ${escapeHtml(name)}" data-remove-bring="${i}">×</button></span>`,
      )
      .join("");
  $$("[data-remove-bring]").forEach(
    (btn) =>
      (btn.onclick = () => {
        planBringDraft.splice(Number(btn.dataset.removeBring), 1);
        renderPlanBringDraft();
      }),
  );
}
$("#plans-search").addEventListener("input", () => data && renderPlans());
$$("[data-plan-tab]").forEach((btn) =>
  btn.addEventListener("click", () => {
    planTab = btn.dataset.planTab;
    $$("[data-plan-tab]").forEach((b) =>
      b.classList.toggle("active", b === btn),
    );
    renderPlans();
  }),
);
$("#plan-type").addEventListener(
  "change",
  (event) =>
    ($("#plan-custom-type-row").hidden = event.target.value !== "Custom"),
);
$$('input[name="costMode"]').forEach((input) =>
  input.addEventListener(
    "change",
    () =>
      ($("#plan-budget-row").hidden =
        !$("#plan-form").elements.costMode.value.includes("shared")),
  ),
);
$("#plan-bring-add").addEventListener("click", () => {
  const input = $("#plan-bring-input");
  const value = input.value.trim();
  if (!value) return;
  if (!planBringDraft.some((v) => v.toLowerCase() === value.toLowerCase()))
    planBringDraft.push(value);
  input.value = "";
  renderPlanBringDraft();
});
$("#plan-bring-input").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    $("#plan-bring-add").click();
  }
});
$("#plan-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const fd = new FormData(form);
  const title = String(fd.get("title") || "").trim();
  if (!title) {
    toast("Add a plan title.", true);
    return;
  }
  const date = fd.get("date");
  const time = fd.get("time") || "12:00";
  const startsAt = date ? new Date(`${date}T${time}`).toISOString() : null;
  const estimated = Number(fd.get("estimatedBudget") || 0);
  const payload = {
    title,
    type: fd.get("type"),
    customType: String(fd.get("customType") || "").trim(),
    date,
    startsAt,
    location: String(fd.get("location") || "").trim(),
    description: String(fd.get("description") || "").trim(),
    costMode: fd.get("costMode") || "free",
    estimatedBudget: estimated,
    estimatedBudgetCents: Math.round(estimated * 100),
    bringItems: [...planBringDraft],
  };
  return runFormSubmission({
    form,
    dialog: $("#plan-modal"),
    submitButton: form.querySelector('[type="submit"]'),
    save: () => apiAction("plan.create", payload),
    onError: (error) => toast(error.message, true),
    onSuccess: () => {
      planBringDraft = [];
      renderPlanBringDraft();
      $("#plan-custom-type-row").hidden = true;
      $("#plan-budget-row").hidden = true;
      showView("plans");
    },
  });
});
$("#locale-select").addEventListener("change", async (event) => {
  const locale = i18n.normalize(event.target.value);
  await i18n.load(locale);
  if (demoMode) {
    demoAction("locale.update", { locale });
    render();
    return;
  }
  try {
    await apiAction("locale.update", { locale });
  } catch (error) {
    toast(error.message, true);
  }
});
$("#settings-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const payload = Object.fromEntries(form);
  delete payload.locale;
  if (!["owner", "admin"].includes(data.viewer?.role))
    delete payload.defaultLocale;
  payload.notifications = event.currentTarget.elements.notifications.checked;
  payload.weeklyDigest = event.currentTarget.elements.weeklyDigest.checked;
  try {
    await apiAction("settings.update", payload);
  } catch (error) {
    toast(error.message, true);
  }
});

$("#report-range")?.addEventListener("change", () => {
  const custom = $("#report-range").value === "custom";
  $("#report-custom").hidden = !custom;
  renderReports();
});
$("#report-start")?.addEventListener("change", renderReports);
$("#report-end")?.addEventListener("change", renderReports);
$$("[data-report-export]").forEach((b) =>
  b.addEventListener("click", () =>
    b.dataset.reportExport === "xlsx" ? exportReportXlsx() : exportReportPdf(),
  ),
);
$("#notification-button")?.addEventListener("click", (event) => {
  event.stopPropagation();
  const pop = $("#notification-popover");
  pop?.classList.contains("open")
    ? closeNotificationPopover()
    : openNotificationPopover();
});
$("#notification-scrim")?.addEventListener("click", closeNotificationPopover);
$("#notification-read-all")?.addEventListener("click", () => {
  const set = readNotificationIds();
  getPersonalNotifications().forEach((n) => set.add(n.id));
  saveNotificationIds(set);
  renderPersonalNotifications();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeNotificationPopover();
  const item = event.target.closest?.("[data-activity-view]");
  if (item && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    openEntity(item.dataset.activityView, item.dataset.activityEntity || "");
  }
});

(async () => {
  try {
    await i18n.load(query.get("lang") || "en");
    if (demoMode) {
      data = structuredClone(demoData);
      data.locale = i18n.locale;
      data.viewer.locale = i18n.locale;
      $("#demo-banner").hidden = false;
      render();
      $("#loading").hidden = true;
      $("#app").hidden = false;
      return;
    }
    if (!initData) {
      showAuthGate(
        "Open Cribbit through Telegram",
        "Your house data is protected by Telegram. Open @Cribbit_bot and tap Cribbit or Dashboard to continue.",
      );
      return;
    }
    if (!chatId && !(await chooseHouse())) return;
    await loadData();
    if (String(chatId).startsWith("-")) {
      await fetchHouses();
      if (
        availableHouses.some((house) => String(house.chatId) === String(chatId))
      )
        await persistActiveCrib(chatId);
    }
    syncCribUrl();
    $("#loading").hidden = true;
    $("#app").hidden = false;
  } catch (error) {
    showAuthGate("Could not open Cribbit", error.message);
  }
})();

export {};
