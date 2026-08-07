if (location.protocol === "file:") {
  document.addEventListener("DOMContentLoaded", () => {
    const b = document.getElementById("demo-banner");
    if (b) {
      b.hidden = false;
      const s = b.querySelector("span");
      if (s) s.textContent = "Local preview · Oak Street demo data";
    }
  });
}

export {};
