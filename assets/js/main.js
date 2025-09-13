/* Main Portfolio JS */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  document.addEventListener('DOMContentLoaded', () => {
    initHangingId();
    initMarquee();
    initReveal();
    initCertificatesLightbox();
  });

  /* =========================
     Hanging ID: Physics + Two Cords + Entrance Bounce
     ========================= */
  function initHangingId() {
    const stage = $('.stage');
    const anchor = $('#anchor');
    const hanger = $('#hanger');
    const pin = $('#pin');
    const badge = $('#id-badge');
    const attachLeftEl = badge ? badge.querySelector('.attach-left') : null;
    const attachRightEl = badge ? badge.querySelector('.attach-right') : null;
    const cordLeft = $('#cord-left');
    const cordRight = $('#cord-right');

    if (!stage || !anchor || !hanger || !pin || !badge || !attachLeftEl || !attachRightEl || !cordLeft || !cordRight) {
      return; // Missing pieces, skip
    }

    // Physics parameters (tweak feel)
    const m = 1.0;          // mass
    const k = 120.0;        // spring stiffness
    const c = 6.5;          // damping (lower => more swing); critical ~ 2*sqrt(k*m) ~ 21.9
    const releaseBoost = 1.6;
    const stopThresholdPos = 0.05;  // px
    const stopThresholdVel = 0.2;   // px/s
    const ENABLE_ENTRANCE_BOUNCE = true;

    let dragging = false;
    let pointerId = null;

    let pinCenter = { x: 0, y: 0 };
    let L0 = 240; // rest length
    let pos = { x: 0, y: 0 }; // vector from pin -> badge
    let vel = { x: 0, y: 0 };
    let lastTs = null;
    let rafId = null;

    const css = (el) => getComputedStyle(el);
    const readNumberVar = (el, name, fallback = 0) => {
      const raw = css(el).getPropertyValue(name).trim();
      const n = parseFloat(raw);
      return Number.isFinite(n) ? n : fallback;
    };
    const prefersReducedMotion = () =>
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const updatePinCenter = () => {
      const r = pin.getBoundingClientRect();
      pinCenter.x = r.left + r.width / 2;
      pinCenter.y = r.top + r.height / 2;
    };

    const setVisualFromPos = (x, y) => {
      const angleRad = Math.atan2(x, y);
      const angleDeg = -angleRad * (180 / Math.PI); // CSS rotation direction
      const length = Math.hypot(x, y);
      hanger.style.setProperty('--angle', angleDeg + 'deg');
      hanger.style.setProperty('--current-length', length + 'px');
    };

    const pointerToVector = (clientX, clientY) => ({
      x: clientX - pinCenter.x,
      y: clientY - pinCenter.y
    });

    const toAnchorLocal = (x, y) => {
      const a = anchor.getBoundingClientRect();
      return { x: x - a.left, y: y - a.top };
    };

    const layoutCords = () => {
      const split = readNumberVar(document.documentElement, '--lanyard-split', 16);
      const startY = pinCenter.y + 0.0;
      const startLeftX = pinCenter.x - split / 2;
      const startRightX = pinCenter.x + split / 2;

      const rectL = attachLeftEl.getBoundingClientRect();
      const rectR = attachRightEl.getBoundingClientRect();

      const sL = toAnchorLocal(startLeftX, startY);
      const sR = toAnchorLocal(startRightX, startY);
      const eL = toAnchorLocal(rectL.left, rectL.top);
      const eR = toAnchorLocal(rectR.left, rectR.top);

      // Left cord
      const dxL = eL.x - sL.x; const dyL = eL.y - sL.y;
      const lenL = Math.hypot(dxL, dyL);
      const angL = -Math.atan2(dxL, dyL) * (180 / Math.PI);
      cordLeft.style.left = sL.x + 'px';
      cordLeft.style.top = sL.y + 'px';
      cordLeft.style.height = lenL + 'px';
      cordLeft.style.transform = 'translateX(-50%) rotate(' + angL + 'deg)';

      // Right cord
      const dxR = eR.x - sR.x; const dyR = eR.y - sR.y;
      const lenR = Math.hypot(dxR, dyR);
      const angR = -Math.atan2(dxR, dyR) * (180 / Math.PI);
      cordRight.style.left = sR.x + 'px';
      cordRight.style.top = sR.y + 'px';
      cordRight.style.height = lenR + 'px';
      cordRight.style.transform = 'translateX(-50%) rotate(' + angR + 'deg)';
    };

    const computeOffscreenStart = () => {
      const a = anchor.getBoundingClientRect();
      const margin = Math.max(120, Math.min(a.width, a.height) * 0.18);
      const startScreenX = a.right + margin; // right
      const startScreenY = a.top - margin;   // above
      updatePinCenter();
      return pointerToVector(startScreenX, startScreenY);
    };

    const tick = (ts) => {
      if (lastTs == null) lastTs = ts;
      const dt = Math.max(0.001, Math.min((ts - lastTs) / 1000, 0.05));
      lastTs = ts;

      if (!dragging) {
        const dx = pos.x;
        const dy = pos.y - L0;
        const ax = (-k * dx - c * vel.x) / m;
        const ay = (-k * dy - c * vel.y) / m;
        vel.x += ax * dt; vel.y += ay * dt;
        pos.x += vel.x * dt; pos.y += vel.y * dt;

        const nearRest =
          Math.abs(pos.x) < stopThresholdPos &&
          Math.abs(pos.y - L0) < stopThresholdPos &&
          Math.hypot(vel.x, vel.y) < stopThresholdVel;

        if (nearRest) { pos.x = 0; pos.y = L0; vel.x = vel.y = 0; }
      }

      setVisualFromPos(pos.x, pos.y);
      layoutCords();

      rafId = requestAnimationFrame(tick);
    };

    const onPointerDown = (e) => {
      if (e.button != null && e.button !== 0) return;
      pointerId = e.pointerId;
      badge.setPointerCapture && badge.setPointerCapture(pointerId);
      updatePinCenter();

      const v = pointerToVector(e.clientX, e.clientY);
      pos.x = v.x; pos.y = v.y; vel.x = vel.y = 0;
      dragging = true;
      stage.classList.add('dragging');
      e.preventDefault();
      if (rafId == null) rafId = requestAnimationFrame(tick);
    };

    const onPointerMove = (e) => {
      if (!dragging || (pointerId != null && e.pointerId !== pointerId)) return;
      const v = pointerToVector(e.clientX, e.clientY);
      const now = e.timeStamp || performance.now();
      const dt = Math.max(0.001, (now - (onPointerMove._t || now)) / 1000);
      vel.x = (v.x - (onPointerMove._x || v.x)) / dt;
      vel.y = (v.y - (onPointerMove._y || v.y)) / dt;
      onPointerMove._x = v.x; onPointerMove._y = v.y; onPointerMove._t = now;
      pos.x = v.x; pos.y = v.y;
    };

    const onPointerUp = (e) => {
      if (!dragging || (pointerId != null && e.pointerId !== pointerId)) return;
      dragging = false; pointerId = null; stage.classList.remove('dragging');
      vel.x *= releaseBoost; vel.y *= releaseBoost;
      if (Math.hypot(vel.x, vel.y) < 0.05 && Math.abs(pos.y - L0) < 0.5 && Math.abs(pos.x) < 0.5) vel.y += 12;
    };

    const init = () => {
      L0 = readNumberVar(document.documentElement, '--string-length', 240);
      updatePinCenter();

      if (ENABLE_ENTRANCE_BOUNCE && !prefersReducedMotion()) {
        const off = computeOffscreenStart();
        pos.x = off.x; pos.y = off.y; vel.x = vel.y = 0;
      } else {
        pos.x = 0; pos.y = L0; vel.x = vel.y = 0;
      }
      setVisualFromPos(pos.x, pos.y);
      layoutCords();
      if (rafId == null) rafId = requestAnimationFrame(tick);
    };

    badge.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('blur', onPointerUp);
    window.addEventListener('resize', () => { updatePinCenter(); layoutCords(); });
    window.addEventListener('scroll', () => { updatePinCenter(); layoutCords(); }, { passive: true });

    init();
  }

  /* =========================
     Marquee: Pause/Resume
     ========================= */
  function initMarquee() {
    const marquee = $('.marquee');
    const btn = $('#marquee-toggle');
    if (!marquee || !btn) return;

    const setPaused = (paused) => {
      marquee.classList.toggle('paused', paused);
      btn.setAttribute('aria-pressed', String(paused));
      btn.textContent = paused ? 'Play' : 'Pause';
      btn.setAttribute('aria-label', paused ? 'Play animation' : 'Pause animation');
    };

    btn.addEventListener('click', () => {
      setPaused(!marquee.classList.contains('paused'));
    });
  }

  /* =========================
     Reveal on Scroll
     ========================= */
  function initReveal() {
    const targets = [
      ...$$('.reveal'),
      ...$$('#projects .card'),
      ...$$('#offerings .offer-card'),
      ...$$('#certificates .cert-card'),
      ...$$('#experience .timeline-item')
    ];
    if (!targets.length || !('IntersectionObserver' in window)) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });

    targets.forEach(el => {
      el.classList.add('reveal');
      io.observe(el);
    });
  }

  /* =========================
     Certificates Lightbox
     ========================= */
  function initCertificatesLightbox() {
    const container = $('#certificates');
    if (!container) return;

    const imgs = $$('img', container);
    if (!imgs.length) return;

    // Build overlay once
    const overlay = document.createElement('div');
    overlay.className = 'lb-overlay';
    overlay.innerHTML = `
      <div class="lb-dialog" role="dialog" aria-modal="true" aria-label="Certificate preview">
        <div class="lb-media"><img alt=""></div>
        <div class="lb-footer">
          <div class="lb-title"></div>
          <button class="lb-close" type="button" aria-label="Close">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const imgEl = $('.lb-media img', overlay);
    const titleEl = $('.lb-title', overlay);
    const closeBtn = $('.lb-close', overlay);

    const open = (src, title) => {
      imgEl.src = src;
      titleEl.textContent = title || '';
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    };

    const close = () => {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      imgEl.src = '';
      titleEl.textContent = '';
    };

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target === closeBtn) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });

    imgs.forEach((img) => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => {
        const src = img.getAttribute('data-full') || img.src;
        const title = img.closest('.cert-card')?.querySelector('.cert-title')?.textContent || img.alt || 'Certificate';
        open(src, title);
      });
    });
  }
})();