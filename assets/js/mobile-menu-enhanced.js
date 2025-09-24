(function () {
  'use strict';

  var mq = window.matchMedia('(max-width: 768px)');
  var toggleBtn, drawer, overlay;
  var lastFocus;

  // configuration
  var ACCORDION_MODE = true; // only one submenu open at a time
  var MAX_DEPTH = 3; // protect from overly deep trees

  function qs(sel) { return document.querySelector(sel); }

  function init() {
    if (!mq.matches) return; // mobile only
    toggleBtn = qs('#m-header-toggle');
    drawer = qs('#m-drawer');
    overlay = qs('.m-drawer-overlay');

    if (!toggleBtn || !drawer || !overlay) return;

    // Build drawer menu from existing site nav if drawer is empty or marked for auto
    ensureDrawerMenu();

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

  // Clone and build nested, collapsible menu into drawer
  function ensureDrawerMenu() {
    var navWrapper = drawer.querySelector('.m-drawer-nav');
    if (!navWrapper) return;

    // If already built once (contains .m-built), skip
    if (navWrapper.querySelector('.m-built')) return;

    var siteNav = qs('#site-navigation .main-nav > ul');
    if (!siteNav) return;

    // Clone and normalize
    var cloned = siteNav.cloneNode(true);
    normalizeClonedMenu(cloned);
    navWrapper.innerHTML = '';
    var container = document.createElement('div');
    container.className = 'm-built';
    container.appendChild(cloned);
    navWrapper.appendChild(container);

    enhanceSubmenus(navWrapper);
  }

  function normalizeClonedMenu(rootUl) {
    // Remove ids to avoid duplicates; convert classes minimally
    rootUl.removeAttribute('id');
    var all = rootUl.querySelectorAll('*');
    all.forEach(function(el){
      el.removeAttribute('id');
    });
    // keep links and structure; strip dropdown toggle spans
    rootUl.querySelectorAll('.dropdown-menu-toggle').forEach(function(el){ el.remove(); });
    // remove superfish classes
    rootUl.classList.remove('sf-menu');
    // flatten attributes that are not needed
  }

  function enhanceSubmenus(scope) {
    var items = scope.querySelectorAll('li');
    items.forEach(function(li){
      var sub = li.querySelector(':scope > ul');
      var link = li.querySelector(':scope > a');

      if (sub) {
        sub.classList.add('m-sub');
        // collapse by default
        sub.hidden = true;

        // create a toggle button
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'm-sub-toggle';
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'Expand submenu');

        // insert toggle button after link; or before sub if no link
        if (link) {
          link.after(btn);
        } else {
          li.insertBefore(btn, sub);
        }

        // toggle by button (primary)
        btn.addEventListener('click', function(e){
          e.stopPropagation();
          e.preventDefault();
          toggleSubmenu(li, sub, btn);
        });

        // smart first-tap on link: first opens, second navigates
        if (link) {
          link.addEventListener('click', function(e){
            if (sub.hidden) {
              e.preventDefault();
              toggleSubmenu(li, sub, btn);
            }
          });
        }
      }
    });
  }

  function toggleSubmenu(li, sub, btn) {
    var willOpen = sub.hidden === true;

    if (ACCORDION_MODE && willOpen) {
      // close siblings at same level
      var siblings = Array.from(li.parentElement.children).filter(function(s){ return s !== li; });
      siblings.forEach(function(sib){
        var sibSub = sib.querySelector(':scope > ul.m-sub');
        var sibBtn = sib.querySelector(':scope > .m-sub-toggle, :scope > a + .m-sub-toggle');
        if (sibSub && sibBtn && !sibSub.hidden) {
          sibSub.hidden = true;
          sibBtn.setAttribute('aria-expanded', 'false');
          sib.classList.remove('m-open');
        }
      });
    }

    sub.hidden = !willOpen;
    btn.setAttribute('aria-expanded', String(willOpen));
    li.classList.toggle('m-open', willOpen);
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