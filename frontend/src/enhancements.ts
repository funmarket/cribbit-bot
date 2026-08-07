// @ts-nocheck

(() => {
  const root = document.documentElement;
  const meta = document.getElementById("theme-color-meta");
  const syncThemeIcons = () => {
    document.querySelectorAll(".mobile-theme").forEach((btn) => {
      btn.innerHTML =
        root.dataset.theme === "dark"
          ? '<svg class="icon-svg sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="3.5"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>'
          : '<svg class="icon-svg sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M20 15.2A8 8 0 0 1 8.8 4 8.2 8.2 0 1 0 20 15.2Z"/></svg>';
    });
  };
  const setTheme = (theme) => {
    root.dataset.theme = theme;
    localStorage.setItem("cribbit-theme", theme);
    meta?.setAttribute("content", theme === "dark" ? "#0d1013" : "#f6f7f8");
    syncThemeIcons();
  };
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-theme-toggle]"))
      setTheme(root.dataset.theme === "dark" ? "light" : "dark");
  });
  syncThemeIcons();

  const icon = {
    money:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3.8" y="5.2" width="16.4" height="13.6" rx="3"/><path d="M3.8 9h16.4M8 14h3"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 10.2 12 4l7.5 6.2v8.3a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5z"/><path d="M9.3 20v-6.3h5.4V20"/></svg>',
    grocery:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5.2 8h13.6l-1.1 11H6.3z"/><path d="M8.3 9V7a3.7 3.7 0 0 1 7.4 0v2"/></svg>',
    utility:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M13.7 2.8 6.6 13h5l-1.3 8.2L17.4 11h-5z"/></svg>',
    dining:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3v7M4.5 3v4.5A2.5 2.5 0 0 0 7 10M9.5 3v4.5A2.5 2.5 0 0 1 7 10v11M16 3v18M16 3c3 2.4 3.8 6.1 0 9"/></svg>',
    check:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"><path d="m6 12 3.2 3.2L18 6.5"/></svg>',
  };

  const upgradeDynamicIcons = () => {
    document.querySelectorAll(".row-icon").forEach((el) => {
      if (el.querySelector("svg")) return;
      const text = el.textContent.trim();
      if (text === "✓") el.innerHTML = icon.check;
      else if (text === "□") el.innerHTML = icon.grocery;
      else if (text === "⌂") el.innerHTML = icon.home;
      else if (text === "⌁") el.innerHTML = icon.utility;
      else if (text === "◉") el.innerHTML = icon.dining;
      else el.innerHTML = icon.money;
    });
  };
  const observer = new MutationObserver(upgradeDynamicIcons);
  observer.observe(document.body, { subtree: true, childList: true });
  document.addEventListener("DOMContentLoaded", upgradeDynamicIcons);
})();

export {};
