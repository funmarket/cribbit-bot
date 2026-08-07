(() => {
  const root = document.documentElement;
  const stored = localStorage.getItem("cribbit-theme");
  const telegramScheme = window.Telegram?.WebApp?.colorScheme;
  const systemDark = window.matchMedia?.(
    "(prefers-color-scheme: dark)",
  ).matches;
  const theme = stored || telegramScheme || (systemDark ? "dark" : "light");
  root.dataset.theme = theme === "dark" ? "dark" : "light";
  document
    .getElementById?.("theme-color-meta")
    ?.setAttribute(
      "content",
      root.dataset.theme === "dark" ? "#0d1013" : "#f6f7f8",
    );
})();

export {};
