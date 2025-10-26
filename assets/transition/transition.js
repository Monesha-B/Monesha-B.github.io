(() => {
  "use strict";

  const onReady = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else { fn(); }
  };

  onReady(() => {
    // Ensure initial CSS is applied before we add .page-ready
    document.body.classList.remove("page-ready","page-exiting");
    // Force style & a double rAF so the transition always triggers
    void getComputedStyle(document.body).transform;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.body.classList.add("page-ready");
      });
    });

    // Exit animation on same-site links
    document.addEventListener("click", (e) => {
      const a = e.target.closest?.("a");
      if (!a) return;

      if (a.target === "_blank" || a.hasAttribute("download") ||
          e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      let to;
      try { to = new URL(href, location.href); } catch { return; }
      if (to.origin !== location.origin) return;
      if (to.pathname === location.pathname && to.hash) return;

      e.preventDefault();
      document.body.classList.add("page-exiting");
      setTimeout(() => { location.href = to.href; }, 360); // match --exit
    });

    // In-view reveal
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries, obs) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        }
      }, { threshold: 0.12, rootMargin: "0px 0px -10% 0px" });

      document.querySelectorAll("[data-reveal]").forEach(el => io.observe(el));

      document.querySelectorAll("[data-reveal-group]").forEach(group => {
        const kids = Array.from(group.children).filter(el => el.hasAttribute("data-reveal"));
        kids.forEach((el, i) => el.style.setProperty("--i", i));
      });
    } else {
      document.querySelectorAll("[data-reveal]").forEach(el => el.classList.add("is-visible"));
    }
  });
})();
