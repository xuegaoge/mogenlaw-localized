(function () {
  'use strict';

  var mq = window.matchMedia('(max-width: 768px)');
  var toggleBtn, drawer, overlay;
  var lastFocus;

  function qs(sel) { return document.querySelector(sel); }

  function init() {
    if (!mq.matches) return; // mobile only
    toggleBtn = qs('#m-header-toggle');
    drawer = qs('#m-drawer');
    overlay = qs('.m-drawer-overlay');

    if (!toggleBtn || !drawer || !overlay) return;

    // If theme left mobile menu toggled, close it to avoid double menu
    var siteNav = qs('#site-navigation');
    if (siteNav && siteNav.classList.contains('toggled')) {
      siteNav.classList.remove('toggled');
      var htmlEl = document.documentElement;
      htmlEl && htmlEl.classList.remove('mobile-menu-open');
    }

    toggleBtn.addEventListener('click', onToggle);
    overlay.addEventListener('click', close);
    document.addEventListener('keydown', onKeydown, { passive: true });

    // Handle viewport changes dynamically
    mq.addEventListener('change', function (e) {
      if (!e.matches) {
        // leaving mobile: ensure cleanup
        teardown();
      }
    });
  }

  function onToggle() {
    var expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    if (expanded) {
      close();
    } else {
      open();
    }
  }

  function open() {
    lastFocus = document.activeElement;
    document.body.classList.add('is-mobile-menu-open');
    drawer.classList.add('open');
    overlay.hidden = false;
    toggleBtn.setAttribute('aria-expanded', 'true');

    // Move focus into drawer
    drawer.setAttribute('tabindex', '-1');
    drawer.focus({ preventScroll: true });

    // Basic focus trap
    document.addEventListener('focus', trapFocus, true);
  }

  function close() {
    document.body.classList.remove('is-mobile-menu-open');
    drawer.classList.remove('open');
    overlay.hidden = true;
    toggleBtn.setAttribute('aria-expanded', 'false');

    document.removeEventListener('focus', trapFocus, true);

    // Restore focus
    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus({ preventScroll: true });
    } else {
      toggleBtn.focus({ preventScroll: true });
    }
  }

  function onKeydown(e) {
    // ESC to close
    if (e.key === 'Escape' || e.key === 'Esc') {
      if (document.body.classList.contains('is-mobile-menu-open')) {
        close();
      }
    }
  }

  function trapFocus(e) {
    if (!document.body.classList.contains('is-mobile-menu-open')) return;
    if (!drawer.contains(e.target)) {
      // Keep focus inside drawer
      e.stopPropagation();
      drawer.focus({ preventScroll: true });
    }
  }

  function teardown() {
    // Unbind and ensure UI closed
    try {
      toggleBtn && toggleBtn.removeEventListener('click', onToggle);
      overlay && overlay.removeEventListener('click', close);
      document.removeEventListener('keydown', onKeydown, { passive: true });
      document.removeEventListener('focus', trapFocus, true);
    } catch (_) {}
    document.body.classList.remove('is-mobile-menu-open');
    drawer && drawer.classList.remove('open');
    overlay && (overlay.hidden = true);
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();