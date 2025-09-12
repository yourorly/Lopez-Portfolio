/* Main script for portfolio site */

(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  document.addEventListener('DOMContentLoaded', () => {
    setupYear();
    setupThemeToggle();
    setupMenuToggle();
    setupRevealOnScroll();
    setupMarqueeControls();
  });

  // Footer current year
  function setupYear() {
    const yearEl = $('#year');
    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }
  }

  // Theme toggle (light/dark/system)
  function setupThemeToggle() {
    const html = document.documentElement;
    const btn = $('#theme-toggle');
    const icon = $('#theme-icon');
    if (!btn || !icon) return;

    const THEME_KEY = 'theme-preference'; // 'light' | 'dark' | 'system'
    const getSystemDark = () => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    function applyTheme(pref) {
      if (pref === 'system') {
        html.setAttribute('data-theme', getSystemDark() ? 'dark' : 'light');
      } else {
        html.setAttribute('data-theme', pref);
      }
      updateBtn(pref);
    }

    function updateBtn(pref) {
      const effective = pref === 'system' ? (getSystemDark() ? 'dark' : 'light') : pref;
      btn.setAttribute('aria-pressed', effective === 'dark' ? 'true' : 'false');
      icon.textContent = effective === 'dark' ? '🌙' : '🌞';
    }

    let pref = localStorage.getItem(THEME_KEY) || 'system';
    applyTheme(pref);

    // React to system changes when in system mode
    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener?.('change', () => {
        if ((localStorage.getItem(THEME_KEY) || 'system') === 'system') applyTheme('system');
      });
    }

    btn.addEventListener('click', () => {
      // cycle: system -> dark -> light -> system
      const curr = localStorage.getItem(THEME_KEY) || 'system';
      const next = curr === 'system' ? 'dark' : curr === 'dark' ? 'light' : 'system';
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
    });
  }

  // Mobile menu toggle
  function setupMenuToggle() {
    const btn = $('#menu-toggle');
    const panel = $('#mobile-menu');
    if (!btn || !panel) return;

    function setOpen(open) {
      btn.setAttribute('aria-expanded', String(open));
      panel.classList.toggle('open', open);
      panel.hidden = !open; // ensure it actually shows/hides
      document.body.classList.toggle('no-scroll', open);
      if (open) {
        // Move focus to first actionable item for a11y
        const first = panel.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
        first?.focus();
      } else {
        btn.focus();
      }
    }

    // Initialize closed unless already marked open
    setOpen(panel.classList.contains('open'));

    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      setOpen(!isOpen);
    });

    // Close when clicking a link
    $$('#mobile-menu a').forEach(a => {
      a.addEventListener('click', () => setOpen(false));
    });

    // Close when clicking overlay (outside content)
    panel.addEventListener('click', (e) => {
      if (e.target === panel) setOpen(false);
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  // IntersectionObserver for reveal
  function setupRevealOnScroll() {
    const elements = $$('.reveal');
    if (!elements.length) return;

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        }
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
      elements.forEach(el => io.observe(el));
    } else {
      // Fallback: show immediately
      elements.forEach(el => el.classList.add('is-visible'));
    }
  }

  // Marquee pause/resume controls
  function setupMarqueeControls() {
    const marquee = $('.marquee');
    const track = $('.marquee-track');
    const toggleBtn = $('#marquee-toggle');
    if (!marquee || !track || !toggleBtn) return;

    // Respect reduced motion by default
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      marquee.classList.add('paused');
      toggleBtn.setAttribute('aria-pressed', 'true');
      toggleBtn.textContent = 'Play';
      toggleBtn.setAttribute('aria-label', 'Play animation');
    }

    toggleBtn.addEventListener('click', () => {
      const isPaused = marquee.classList.toggle('paused');
      toggleBtn.setAttribute('aria-pressed', String(isPaused));
      toggleBtn.textContent = isPaused ? 'Play' : 'Pause';
      toggleBtn.setAttribute('aria-label', isPaused ? 'Play animation' : 'Pause animation');
    });

    // Pause on hover/focus for better UX
    marquee.addEventListener('mouseenter', () => marquee.classList.add('paused'));
    marquee.addEventListener('mouseleave', () => {
      if (toggleBtn.getAttribute('aria-pressed') === 'false') marquee.classList.remove('paused');
    });
    marquee.addEventListener('focusin', () => marquee.classList.add('paused'));
    marquee.addEventListener('focusout', () => {
      if (toggleBtn.getAttribute('aria-pressed') === 'false') marquee.classList.remove('paused');
    });
  }
})();