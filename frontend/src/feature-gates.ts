// Production gates for theme surfaces whose trusted backend workflows are not implemented yet.
// Keep these controls out of the live UI instead of shipping dead or misleading actions.
const unsupportedViews = new Set(["requests", "wishlists", "reports"]);

document.querySelectorAll<HTMLElement>("[data-view]").forEach((element) => {
  if (unsupportedViews.has(element.dataset.view || "")) element.hidden = true;
});

document.querySelectorAll<HTMLElement>("[data-panel]").forEach((element) => {
  if (unsupportedViews.has(element.dataset.panel || "")) element.hidden = true;
});

[
  "#notification-button",
  "#notification-popover",
  "#notification-scrim",
  "#expense-approvals",
  "#chore-reviews",
  ".settlements-card",
  "[data-wishlist-card]",
  "[data-wishlist-toggle]",
  "[data-open-wishlist]",
  ".receipt-upload-head",
  ".receipt-source",
  ".receipt-hidden-input",
  ".receipt-preview",
  ".ocr-status",
  ".ocr-items",
].forEach((selector) => {
  document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
    const container =
      element.closest<HTMLElement>("section.card, article.card") || element;
    container.hidden = true;
  });
});

const verifiedNote = document.querySelector<HTMLElement>(".verified-note");
if (verifiedNote) verifiedNote.hidden = true;
const expenseKicker = document.querySelector<HTMLElement>(
  "#expense-modal .kicker",
);
if (expenseKicker) expenseKicker.textContent = "SHARED EXPENSE";
const expenseHeading = document.querySelector<HTMLElement>("#expense-modal h2");
if (expenseHeading) expenseHeading.textContent = "Add a shared cost";
const expenseSubmit = document.querySelector<HTMLButtonElement>(
  '#expense-form button[type="submit"]',
);
if (expenseSubmit) expenseSubmit.textContent = "Add expense";

export {};
