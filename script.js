// Theme Toggle System with Fevicon/Globe Sync
// Behavior: to LIGHT => SPREAD, to DARK => PULL BACK (slower, clearly visible)
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('themeToggle');
  const html = document.documentElement;
  if (!toggle) { console.error('Theme toggle button not found!'); return; }

  // ---- Icons
  function setSunIcon() {
    const svg = toggle.querySelector('svg');
    if (svg) svg.innerHTML =
      '<circle cx="12" cy="12" r="5"/>' +
      '<path d="m12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>';
  }
  function setMoonIcon() {
    const svg = toggle.querySelector('svg');
    if (svg) svg.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
  }

  // ---- Apply theme (and icon)
  function applyTheme(isDark) {
    if (isDark) {
      html.classList.add('dark');
      document.body.classList.add('dark');
      setSunIcon();
    } else {
      html.classList.remove('dark');
      document.body.classList.remove('dark');
      setMoonIcon();
    }
  }

  // ---- Initial theme (no flash)
  const saved = localStorage.getItem('theme');
  const startDark = saved === 'dark' || (!saved && matchMedia('(prefers-color-scheme: dark)').matches);
  applyTheme(startDark);
  requestAnimationFrame(() => {
    updateGlobeTheme(startDark);
    updateFeviconTheme(startDark);
  });

  // ---- Overlay creator (inline styles so no extra CSS needed)
  function ensureOverlay() {
    let overlay = document.getElementById('theme-overlay');
    let circle = document.getElementById('theme-circle');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'theme-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      Object.assign(overlay.style, {
        position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '2147483647'
      });
      document.body.appendChild(overlay);
    }
    if (!circle) {
      circle = document.createElement('div');
      circle.id = 'theme-circle';
      overlay.appendChild(circle);
    }
    Object.assign(circle.style, {
      position: 'absolute',
      left: '0px', top: '0px',
      width: '0px', height: '0px',
      borderRadius: '9999px',
      transform: 'translate(-50%, -50%) scale(0)',
      opacity: '0',
      willChange: 'transform, opacity',
      transitionProperty: 'transform, opacity',
      transitionTimingFunction: 'cubic-bezier(.22,.61,.36,1)'
    });
    return { overlay, circle };
  }

  // constants (neutral backgrounds; no blue)
  const LIGHT_BG = '#ffffff';
  const DARK_BG  = '#0f0f10';

  let isAnimating = false;

  function switchTheme() {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDark = html.classList.contains('dark');
    const toDark = !isDark;

    if (reduce) {
      applyTheme(toDark);
      localStorage.setItem('theme', toDark ? 'dark' : 'light');
      updateGlobeTheme(toDark);
      updateFeviconTheme(toDark);
      return;
    }

    if (isAnimating) return;
    isAnimating = true;

    const { overlay, circle } = ensureOverlay();

    // origin = center of the toggle button
    const r = toggle.getBoundingClientRect();
    const x = r.left + r.width / 2 + window.scrollX;
    const y = r.top  + r.height / 2 + window.scrollY;

    circle.style.left = x + 'px';
    circle.style.top  = y + 'px';

    // size to cover viewport from origin
    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    const distX = Math.max(x, vw - x);
    const distY = Math.max(y, vh - y);
    const radius   = Math.ceil(Math.hypot(distX, distY));
    const diameter = radius * 2;

    circle.style.width  = diameter + 'px';
    circle.style.height = diameter + 'px';

    // Timings
    const SPREAD_MS  = 1200; // to LIGHT
    const PULL_MS    = 1000; // to DARK
    const FADE_MS    = 300;

    if (toDark) {
      // ==== PULL BACK (to DARK) ====
      // Cover instantly with LIGHT color, then shrink to reveal DARK.
      circle.style.transitionDuration = '0ms';
      circle.style.background = LIGHT_BG;
      circle.style.opacity = '1';
      circle.style.transform = 'translate(-50%, -50%) scale(1)';
      // force reflow
      circle.getBoundingClientRect();

      // Apply DARK immediately behind the overlay
      applyTheme(true);
      localStorage.setItem('theme', 'dark');
      updateGlobeTheme(true);
      updateFeviconTheme(true);

      // Now animate the pull back
      circle.style.transitionDuration = `${PULL_MS}ms`;
      requestAnimationFrame(() => {
        circle.style.transform = 'translate(-50%, -50%) scale(0)';
        circle.style.opacity = '0';
      });

      setTimeout(() => { isAnimating = false; }, PULL_MS + 40);

    } else {
      // ==== SPREAD (to LIGHT) ====
      // Start as a tiny LIGHT circle, expand to fill, then fade it away.
      circle.style.background = LIGHT_BG;
      circle.style.transitionDuration = `${SPREAD_MS}ms`;
      // ensure start state
      circle.style.opacity = '0';
      circle.style.transform = 'translate(-50%, -50%) scale(0)';
      circle.getBoundingClientRect();

      // expand
      requestAnimationFrame(() => {
        circle.style.opacity = '1';
        circle.style.transform = 'translate(-50%, -50%) scale(1)';
      });

      // switch to LIGHT near the end so you never see a mismatch
      const switchAt = Math.round(SPREAD_MS * 0.85);
      const t1 = setTimeout(() => {
        applyTheme(false);
        localStorage.setItem('theme', 'light');
        updateGlobeTheme(false);
        updateFeviconTheme(false);
      }, switchAt);

      // fade overlay out after spread completes
      const t2 = setTimeout(() => {
        circle.style.transitionDuration = `${FADE_MS}ms`;
        circle.style.opacity = '0';
      }, SPREAD_MS + 20);

      const t3 = setTimeout(() => {
        isAnimating = false;
      }, SPREAD_MS + FADE_MS + 40);

      // safety
      window.addEventListener('pagehide', () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); }, { once: true });
    }
  }

  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    switchTheme();
  });
});

// Globe iframe theme sync (unchanged)
function updateGlobeTheme(isDark) {
  const globeIframe = document.querySelector('.globe-container iframe');
  if (globeIframe) {
    const base = globeIframe.src.split('?')[0];
    const newSrc = base + '?theme=' + (isDark ? 'dark' : 'light') + '&t=' + Date.now();
    if (globeIframe.src !== newSrc) globeIframe.src = newSrc;
  }
}

// Fevicon iframe theme sync (unchanged)
function updateFeviconTheme(isDark) {
  const feviconIframe = document.querySelector('.logo-link iframe');
  if (feviconIframe) {
    const base = feviconIframe.src.split('?')[0];
    const newSrc = base + '?theme=' + (isDark ? 'dark' : 'light') + '&t=' + Date.now();
    if (feviconIframe.src !== newSrc) feviconIframe.src = newSrc;
  }
}
