/* sovereign. — shell: router, navigation drawer, service worker registration. */
(function (S) {
  'use strict';
  const app = document.getElementById('app');
  const main = document.getElementById('main');
  const sidebar = document.getElementById('sidebar');
  const scrim = document.getElementById('scrim');
  const menuBtn = document.getElementById('menu-btn');
  const V = S.views;

  // Routes: #/  #/work  #/data  #/new-ai  #/course/<id>[/announcements|syllabus|modules[/<moduleId>]|assignments[/<assignmentId>]|grades|portfolio]
  S.render = function (reset) {
    const y = window.scrollY;
    S.finalizeExpired();
    const parts = (location.hash || '#/').replace(/^#\/?/, '').split('/');
    let route = 'dash', view, title = 'Dashboard';

    if (!S.state.setup) { route = 'welcome'; view = V.firstRun(); title = 'Welcome'; }
    else if (parts[0] === 'work') { route = 'work'; view = V.work(); title = 'My Work'; }
    else if (parts[0] === 'new-ai') { route = 'dash'; view = V.newAI(); title = 'Build with AI'; }
    else if (parts[0] === 'data') { route = 'data'; view = V.data(); title = 'Data & Backup'; }
    else if (parts[0] === 'course' && S.course(parts[1])) {
      const c = S.course(parts[1]);
      view = V.course(c, parts[2] || 'home', parts[3]);
      title = c.code + ' · ' + V.sectionLabel(parts[2] || 'home');
    } else view = V.dashboard();

    document.body.classList.toggle('firstrun', !S.state.setup);
    app.replaceChildren(...[
      S.loadWarning ? S.h('p', { class: 'banner error', role: 'alert' }, S.loadWarning) : null,
      !S.storageOK && route !== 'data' ? S.h('p', { class: 'banner error', role: 'alert' }, 'Your browser is blocking local storage, so progress will not be saved. See Data & Backup.') : null,
      view,
    ].filter(Boolean));
    document.title = title + ' · sovereign.';

    sidebar.querySelectorAll('a[data-route]').forEach((a) => {
      if (a.dataset.route === route) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    window.scrollTo(0, reset ? 0 : y);

    // On phones the Course Menu is a swipeable row: keep the current tab visible.
    const cur = document.querySelector('.course-menu [aria-current]');
    if (cur && cur.parentElement.parentElement.scrollWidth > cur.parentElement.parentElement.clientWidth) {
      const row = cur.parentElement.parentElement;
      row.scrollLeft = cur.offsetLeft - 20;
    }
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
