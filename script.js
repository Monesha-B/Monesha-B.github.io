// Theme Toggle System with Fevicon Sync
document.addEventListener('DOMContentLoaded', function() {
  console.log('Script loaded!');
  
  const toggle = document.getElementById('themeToggle');
  const html = document.documentElement;
  
  if (!toggle) {
    console.error('Theme toggle button not found!');
    return;
  }
  
  console.log('Theme toggle button found!');
  
  // Icon setting functions
  function setSunIcon() {
    const svg = toggle.querySelector('svg');
    if (svg) {
      svg.innerHTML = '<circle cx="12" cy="12" r="5"/><path d="m12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>';
    }
  }
  
  function setMoonIcon() {
    const svg = toggle.querySelector('svg');
    if (svg) {
      svg.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
    }
  }
  
  // Apply theme function
  function applyTheme(isDark) {
    if (isDark) {
      html.classList.add('dark');
      document.body.classList.add('dark');
      setSunIcon();
      console.log('Applied DARK theme');
    } else {
      html.classList.remove('dark');
      document.body.classList.remove('dark');
      setMoonIcon();
      console.log('Applied LIGHT theme');
    }
  }
  
  // Load saved theme or default to light
  const savedTheme = localStorage.getItem('theme');
  console.log('Saved theme:', savedTheme);
  
  const isDarkMode = savedTheme === 'dark';
  applyTheme(isDarkMode);
  
  // Set initial themes for globe and fevicon
  setTimeout(() => {
    updateGlobeTheme(isDarkMode);
    updateFeviconTheme(isDarkMode);
  }, 100);
  
  // Toggle function
  function switchTheme() {
    const isDark = html.classList.contains('dark');
    console.log('Switching from:', isDark ? 'dark' : 'light');

    // Prepare animation overlay
    const overlay = document.getElementById('theme-overlay');
    const circle = document.getElementById('theme-circle');
    if (!overlay || !circle) {
      // Fallback: immediate toggle
      if (isDark) {
        applyTheme(false);
        localStorage.setItem('theme', 'light');
        updateGlobeTheme(false);
        updateFeviconTheme(false);
      } else {
        applyTheme(true);
        localStorage.setItem('theme', 'dark');
        updateGlobeTheme(true);
        updateFeviconTheme(true);
      }
      return;
    }

    // Compute origin (center of the toggle button)
    const rect = toggle.getBoundingClientRect();
    const originX = rect.left + rect.width / 2 + window.scrollX;
    const originY = rect.top + rect.height / 2 + window.scrollY;

    // Place circle at origin
    circle.style.left = originX + 'px';
    circle.style.top = originY + 'px';

    // Compute needed diameter to cover viewport from origin
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    const distX = Math.max(originX, vw - originX);
    const distY = Math.max(originY, vh - originY);
    const radius = Math.sqrt(distX * distX + distY * distY);
    const diameter = Math.ceil(radius * 2);

    // Set circle size
    circle.style.setProperty('--size', diameter + 'px');
    circle.style.width = diameter + 'px';
    circle.style.height = diameter + 'px';

    // Set circle color depending on direction
    const willDarken = !isDark;
    circle.style.background = willDarken ? 'var(--bg)' : 'var(--text)';

    // Start animation
    overlay.classList.add('animating');

    // After a short tick, expand
    requestAnimationFrame(() => requestAnimationFrame(() => {
      circle.style.transform = 'translate(-50%, -50%) scale(1)';
      circle.style.opacity = '1';
    }));

    // Midpoint timing: switch theme
    const totalMs = 650;
    const switchAt = Math.floor(totalMs * 0.5);

    // Apply theme at midpoint
    setTimeout(() => {
      if (isDark) {
        applyTheme(false);
        localStorage.setItem('theme', 'light');
        updateGlobeTheme(false);
        updateFeviconTheme(false);
      } else {
        applyTheme(true);
        localStorage.setItem('theme', 'dark');
        updateGlobeTheme(true);
        updateFeviconTheme(true);
      }
    }, switchAt);

    // Clean up after animation completes
    setTimeout(() => {
      overlay.classList.remove('animating');
      overlay.classList.add('reverting');
      setTimeout(() => {
        overlay.classList.remove('reverting');
        circle.style.opacity = '0';
        circle.style.transform = 'translate(-50%, -50%) scale(0)';
      }, 380);
    }, totalMs + 20);
  }
  
  // Add click listener
  toggle.addEventListener('click', function(e) {
    console.log('Toggle clicked!');
    e.preventDefault();
    switchTheme();
  });
  
  console.log('Theme system initialized!');
});

// Globe iframe theme sync
function updateGlobeTheme(isDark) {
  const globeIframe = document.querySelector('.globe-container iframe');
  if (globeIframe) {
    const base = globeIframe.src.split('?')[0];
    const newSrc = base + '?theme=' + (isDark ? 'dark' : 'light') + '&t=' + Date.now();
    globeIframe.src = newSrc;
    console.log('Globe updated to:', isDark ? 'dark' : 'light');
  } else {
    console.log('Globe iframe not found yet');
  }
}

// Fevicon iframe theme sync
function updateFeviconTheme(isDark) {
  const feviconIframe = document.querySelector('.logo-link iframe');
  if (feviconIframe) {
    const base = feviconIframe.src.split('?')[0];
    const newSrc = base + '?theme=' + (isDark ? 'dark' : 'light') + '&t=' + Date.now();
    feviconIframe.src = newSrc;
    console.log('Fevicon updated to:', isDark ? 'dark' : 'light');
  } else {
    console.log('Fevicon iframe not found');
  }
}