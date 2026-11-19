/* sovereign. — shell: router, navigation drawer, service worker registration. */
(function (S) {
  'use strict';
  const app = document.getElementById('app');
  const main = document.getElementById('main');
  const sidebar = document.getElementById('sidebar');
  const scrim = document.getElementById('scrim');
  const menuBtn = document.getElementById('menu-btn');
  const V = S.views;

  const TITLES = { dash: 'Dashboard', curriculum: 'Curriculum', practice: 'Practice', work: 'My Work', data: 'Data & Backup' };

  S.render = function (reset) {
    const y = window.scrollY;
    const parts = (location.hash || '#/').replace(/^#\/?/, '').split('/');
    const has = S.state.curricula.length > 0;
    let route = 'dash', view;

    if (!has) {
      route = parts[0] === 'new' ? 'new' : 'welcome';
      view = route === 'new' ? V.newCurriculum() : V.firstRun();
    } else {
      route = TITLES[parts[0]] && parts[0] !== 'dash' ? parts[0] : 'dash';
      view = V[route === 'dash' ? 'dashboard' : route](parts[1]);
    }

    document.body.classList.toggle('firstrun', !has);
    app.replaceChildren(...[
      S.loadWarning ? S.h('p', { class: 'banner error', role: 'alert' }, S.loadWarning) : null,
      !S.storageOK && route !== 'data' ? S.h('p', { class: 'banner error', role: 'alert' }, 'Your browser is blocking local storage, so progress will not be saved. See Data & Backup.') : null,
      view,
    ].filter(Boolean));
    document.title = (TITLES[route] || (route === 'new' ? 'New curriculum' : 'Welcome')) + ' · sovereign.';

    sidebar.querySelectorAll('a[data-route]').forEach((a) => {
      if (a.dataset.route === route) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });

    if (reset && route === 'curriculum' && parts[1]) {
      const el = document.getElementById('mod-' + parts[1]);
      if (el) { el.scrollIntoView(); return; }
    }
    window.scrollTo(0, reset ? 0 : y);
  };

  /* ----- mobile navigation drawer ----- */
  function setMenu(open) {
    sidebar.classList.toggle('open', open);
    scrim.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? 'Close' : 'Menu';
  }
  menuBtn.addEventListener('click', () => {
    const open = !sidebar.classList.contains('open');
    setMenu(open);
    if (open) sidebar.querySelector('a[data-route]').focus();
  });
  scrim.addEventListener('click', () => setMenu(false));
  sidebar.addEventListener('click', (e) => { if (e.target.closest('a[data-route]')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
  });
  window.matchMedia('(min-width: 1024px)').addEventListener('change', () => setMenu(false));

  /* ----- routing ----- */
  window.addEventListener('hashchange', () => {
    S.ui.edit = null; S.ui.dataMsg = null;
    S.render(true);
    main.focus({ preventScroll: true });
  });

  S.load();
  S.render(true);

  // Offline support / installability. Needs https or localhost; silently skipped otherwise.
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})(window.Sovereign);
