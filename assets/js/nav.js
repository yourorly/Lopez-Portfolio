    (function () {
      const header = document.querySelector('.site-nav');
      const toggle = document.querySelector('.nav-toggle');
      if (!header || !toggle) return;

      toggle.addEventListener('click', () => {
        const open = header.getAttribute('data-open') === 'true';
        header.setAttribute('data-open', String(!open));
        toggle.setAttribute('aria-expanded', String(!open));
      });

      // Close menu when clicking a link (mobile)
      header.addEventListener('click', (e) => {
        const link = e.target.closest('.nav-links a');
        if (link) {
          header.setAttribute('data-open', 'false');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    })();
