/* sovereign. — inside a course: Home, Announcements, Syllabus, Modules (+ module pages), Assignments, Grades. */
(function (S) {
  'use strict';
  const { h, field, select, progressBar, checkbox, badge, plural, trunc, toast, go, commit, tile } = S;
  const V = (S.views = S.views || {});
  const ui = S.ui;
  const BAD_LINK = 'That link doesn’t look valid. Use an http(s) address.';
  const SECTIONS = [['home', 'Home'], ['announcements', 'Announcements'], ['syllabus', 'Syllabus'], ['modules', 'Modules'], ['assignments', 'Assignments'], ['grades', 'Grades']];

  const href = (c, sec, sub) => '#/course/' + c.id + (sec && sec !== 'home' ? '/' + sec + (sub ? '/' + sub : '') : '');
  S.href = href;
  V.sectionLabel = (sec) => (SECTIONS.find((s) => s[0] === sec) || SECTIONS[0])[1];

  const num = (v) => { const t = String(v == null ? '' : v).trim(); if (!t) return null; const n = parseFloat(t); return Number.isFinite(n) && n >= 0 ? n : null; };
  const empty = (...k) => h('p', { class: 'empty' }, ...k);
  const cancelBtn = () => h('button', { class: 'btn ghost', type: 'button', onclick: () => { ui.edit = null; S.render(false); } }, 'Cancel');
  const editBtn = (key, label) => h('button', { class: 'linkbtn', type: 'button', onclick: () => { ui.edit = key; S.render(false); } }, label || 'Edit');

  function moveBtns(list, item) {
    const i = list.indexOf(item);
    const mv = (d) => { list.splice(i, 1); list.splice(i + d, 0, item); commit(); };
    return [
      h('button', { class: 'linkbtn', type: 'button', 'aria-label': 'Move up', disabled: i === 0, onclick: () => mv(-1) }, '↑'),
      h('button', { class: 'linkbtn', type: 'button', 'aria-label': 'Move down', disabled: i === list.length - 1, onclick: () => mv(1) }, '↓'),
    ];
  }
  function removeBtn(what, list, item) {
    return h('button', { class: 'linkbtn danger', type: 'button', onclick: () => {
      if (!confirm('Remove this ' + what + '? This cannot be undone.')) return;
      list.splice(list.indexOf(item), 1); commit();
    } }, 'Remove');
  }

  /* ---------- course form (new + edit) ---------- */

  S.courseForm = function (c) {
    return h('form', { class: 'panel', onsubmit: (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const v = { code: f.get('code').trim(), title: f.get('title').trim(), description: f.get('description').trim(), objective: f.get('objective').trim(), deliverable: f.get('deliverable').trim() };
      if (c) {
        const lines = (k, n) => String(f.get(k) || '').split('\n').map((x) => x.trim()).filter(Boolean).slice(0, n).map((x) => x.slice(0, 400));
        Object.assign(c, v, { syllabus: f.get('syllabus').trim(), duration: String(f.get('duration') || '').trim().slice(0, 80), pathway: String(f.get('pathway') || '').trim().slice(0, 300), outcomes: lines('outcomes', 12) });
        if (f.has('criteria')) c.work.criteria = lines('criteria', 12);
        ui.edit = null; commit(); toast('Course updated.');
      }
      else { const nc = S.newCourse(v); S.state.courses.push(nc); ui.edit = null; S.save(); go(href(nc)); toast('Course added. It starts with one module you can rename.'); }
    } },
      field('Course code', 'code', { value: c ? c.code : '', required: true, placeholder: 'e.g. ANTH 101' }),
      field('Course title', 'title', { value: c ? c.title : '', required: true, placeholder: 'e.g. Cultural Anthropology' }),
      field('Description', 'description', { value: c ? c.description : '', multiline: true, rows: 3 }),
      field('Learning objective (optional)', 'objective', { value: c ? c.objective : '', multiline: true, rows: 2, hint: 'What do you want to be able to do when you finish?' }),
      field('Final deliverable (optional)', 'deliverable', { value: c ? c.deliverable : '', multiline: true, rows: 2, hint: 'What will you make to prove it? Tracked in My Work.' }),
      c ? field('Syllabus notes', 'syllabus', { value: c.syllabus, multiline: true, rows: 6, hint: 'Schedule, expectations, how you will grade yourself.' }) : null,
      c ? field('Course length (optional)', 'duration', { value: c.duration, placeholder: 'e.g. 8 weeks, about 5 hours a week' }) : null,
      c ? field('What you will be able to do (optional)', 'outcomes', { value: c.outcomes.join('\n'), multiline: true, rows: 4, hint: 'One per line.' }) : null,
      c ? field('Where this course leads (optional)', 'pathway', { value: c.pathway }) : null,
      c && (c.work.criteria.length || c.work.title) ? field('Final project: how you will know it is done', 'criteria', { value: c.work.criteria.join('\n'), multiline: true, rows: 4, hint: 'One per line.' }) : null,
      h('div', { class: 'btn-row' }, h('button', { class: 'btn', type: 'submit' }, c ? 'Save changes' : 'Add course'), cancelBtn()));
  };

  /* ---------- shell: banner + Course Menu ---------- */

  V.course = function (c, section, sub) {
    let body, current = section;
    switch (section) {
      case 'announcements': body = pageAnnouncements(c); break;
      case 'syllabus': body = pageSyllabus(c); break;
      case 'modules': {
        const m = sub && c.modules.find((x) => x.id === sub);
        body = m ? pageModule(c, m) : pageModules(c); break;
      }
      case 'assignments': body = pageAssignments(c); break;
      case 'grades': body = pageGrades(c); break;
      default: body = pageHome(c); current = 'home';
    }
    return h('div', { class: 'course' },
      h('p', { class: 'crumbs' }, h('a', { href: '#/' }, '← Dashboard')),
      h('header', { class: 'course-head' },
        h('div', { class: 'course-banner tile-art art-' + c.color, style: '--c:' + S.COLORS[c.color], 'aria-hidden': 'true' }, h('span', { class: 'tile-label' }, c.code)),
        h('h1', {}, c.title)),
      h('div', { class: 'course-layout' },
        h('nav', { class: 'course-menu', 'aria-label': 'Course menu' },
          h('ul', {}, SECTIONS.map(([key, label]) => h('li', {}, h('a', { href: href(c, key), 'aria-current': key === current ? 'page' : null }, label))))),
        h('div', { class: 'course-main' }, body)));
  };

  const pageHead = (title, ...extra) => h('div', { class: 'page-head' }, h('h2', {}, title), ...extra);

  /* ---------- Home ---------- */

  function homeSection(c, key, title, content) {
    return h('section', { class: 'home-sec' },
      h('div', { class: 'section-head' }, h('h2', {}, title), h('a', { class: 'small', href: href(c, key) }, 'Open ' + title + ' →')),
      content);
  }

  function pageHome(c) {
    const g = S.grade(c), cs = S.courseStats(c);
    return h('div', {},
      S.state.name ? h('p', { class: 'lede' }, 'Welcome back, ' + S.state.name + '.') : null,
      h('div', { class: 'progress-row' }, h('strong', {}, cs.pct + '%'), h('span', { class: 'muted' }, cs.done + ' of ' + plural(cs.mods, 'module') + ' complete')),
      progressBar(cs.pct, c.title + ' progress'),
      homeSection(c, 'announcements', 'Announcements', announcementList(c, 2, false)),
      homeSection(c, 'syllabus', 'Syllabus', syllabusSummary(c)),
      homeSection(c, 'modules', 'Modules', moduleTiles(c, false)),
      homeSection(c, 'assignments', 'Assignments', assignmentGroups(c, false)),
      homeSection(c, 'grades', 'Grades', g
        ? h('div', {}, h('div', { class: 'grade-big' }, g.pct + '%'), h('p', { class: 'muted' }, 'Current Grade, from ' + plural(g.n, 'graded assignment') + '.'))
        : empty('No scores yet. Enter points and your score on an assignment to see your Current Grade.')));
  }

  /* ---------- Announcements ---------- */

  function announcementList(c, limit, manage) {
    const list = c.announcements.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit || 999);
    if (!list.length) return empty('No announcements yet.', manage ? ' Post one to keep notes on your own progress.' : '');
    return h('div', {}, list.map((a) => {
      if (manage && ui.edit === a.id) return annForm(c, a);
      return h('article', { class: 'ann' },
        h('h3', {}, a.title), h('p', { class: 'muted small' }, S.fmtDate(a.date)),
        a.body ? h('p', { class: 'pre' }, manage ? a.body : trunc(a.body, 220)) : null,
        manage ? h('div', { class: 'item-actions' }, editBtn(a.id), removeBtn('announcement', c.announcements, a)) : null);
    }));
  }

  function annForm(c, a) {
    return h('form', { class: a ? 'inline-edit' : 'panel', onsubmit: (e) => {
      e.preventDefault(); const f = new FormData(e.target);
      const v = { title: f.get('title').trim(), body: f.get('body').trim() };
      if (a) { Object.assign(a, v); ui.edit = null; } else c.announcements.push({ id: S.uid(), date: S.todayISO(), ...v });
      commit();
    } },
      field('Title', 'title', { value: a ? a.title : '', required: true }),
      field('Message', 'body', { value: a ? a.body : '', multiline: true, rows: 4 }),
      h('div', { class: 'btn-row' }, h('button', { class: 'btn', type: 'submit' }, a ? 'Save' : 'Post announcement'), a ? cancelBtn() : null));
  }

  function pageAnnouncements(c) {
    return h('div', {}, pageHead('Announcements'), announcementList(c, 0, true),
      h('details', { class: 'add' }, h('summary', {}, 'New announcement'), annForm(c, null)));
  }

  /* ---------- Syllabus ---------- */

  function syllabusSummary(c) {
    return h('div', {},
      c.description ? h('p', {}, c.description) : empty('No course description yet.'),
      c.deliverable ? h('p', { class: 'muted' }, h('b', {}, 'Final deliverable: '), c.deliverable) : null);
  }

  function pageSyllabus(c) {
    if (ui.edit === 'course') return h('div', {}, pageHead('Edit course details'), S.courseForm(c));
    return h('div', {},
      pageHead('Syllabus', editBtn('course', 'Edit course details')),
      h('section', {}, h('h3', { class: 'minor' }, 'About this course'), c.description ? h('p', { class: 'pre' }, c.description) : empty('No description yet. Use Edit course details to add one.')),
      h('dl', { class: 'brief' },
        h('div', {}, h('dt', {}, 'Learning objective'), h('dd', {}, c.objective || '—')),
        h('div', {}, h('dt', {}, 'Final deliverable'), h('dd', {}, c.deliverable || '—', ' ', c.deliverable ? h('a', { class: 'small', href: '#/work' }, 'Track in My Work') : null))),
      c.ai && c.ai.generated ? h('p', { class: 'banner' + (c.ai.status === 'partial' ? ' error' : '') }, 'Drafted by AI: review and change anything. ', c.ai.note || '') : null,
      c.duration ? h('p', { class: 'muted' }, h('b', {}, 'Course length: '), c.duration) : null,
      c.outcomes.length ? h('section', {}, h('h3', { class: 'minor' }, 'What you will be able to do'), h('ul', { class: 'plain' }, c.outcomes.map((x) => h('li', {}, x)))) : null,
      c.pathway ? h('p', { class: 'muted' }, h('b', {}, 'Where this leads: '), c.pathway) : null,
      c.licensureNote ? h('p', { class: 'callout' }, h('b', {}, 'About licenses and credentials: '), c.licensureNote) : null,
      c.work.criteria.length ? h('section', {}, h('h3', { class: 'minor' }, 'Final project: ' + (c.work.title || 'criteria')), h('ul', { class: 'plain' }, c.work.criteria.map((x) => h('li', {}, x)))) : null,
      h('section', {}, h('h3', { class: 'minor' }, 'Syllabus notes'), c.syllabus ? h('p', { class: 'pre' }, c.syllabus) : empty('Add your schedule, expectations, and how you will grade yourself.')),
      S.usageBlock(c),
      h('section', {},
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn danger', type: 'button', onclick: () => {
            if (!confirm('Delete “' + c.title + '” with all its modules, assignments, grades and credentials? This cannot be undone unless you exported a backup.')) return;
            S.state.courses = S.state.courses.filter((x) => x !== c); S.save(); go('#/'); toast('Course deleted.');
          } }, 'Delete this course'))));
  }

  /* ---------- Modules (tiles) ---------- */

  function moduleTiles(c, manage) {
    if (!c.modules.length) return empty('No modules yet.', manage ? ' Add your first below.' : '');
    return h('ul', { class: 'tiles' }, c.modules.map((m, i) => {
      const ms = S.moduleStats(m);
      const mv = (d) => { c.modules.splice(i, 1); c.modules.splice(i + d, 0, m); commit(); };
      return h('li', { class: 'tile-wrap' },
        tile({ href: href(c, 'modules', m.id), color: c.color, label: 'Module ' + (i + 1), title: m.title, badge: m.complete ? 'Complete' : '',
          meta: ms.items ? ms.done + ' of ' + plural(ms.items, 'step') + ' done' : 'No steps yet', pct: ms.pct }),
        manage ? h('div', { class: 'tile-tools' },
          h('button', { class: 'linkbtn', type: 'button', disabled: i === 0, onclick: () => mv(-1) }, '← Earlier'),
          h('button', { class: 'linkbtn', type: 'button', disabled: i === c.modules.length - 1, onclick: () => mv(1) }, 'Later →')) : null);
    }));
  }

  function credentialForm(c, k) {
    return h('form', { class: k ? 'inline-edit' : '', onsubmit: (e) => {
      e.preventDefault(); const f = new FormData(e.target), u = S.cleanUrl(f.get('url'));
      if (u === null) return toast(BAD_LINK);
      const v = { name: f.get('name').trim(), issuer: f.get('issuer').trim(), url: u, note: f.get('note').trim(), status: f.get('status') };
      if (!k) { v.requirement = ''; v.origin = 'user'; }
      if (k) { Object.assign(k, v); ui.edit = null; } else c.credentials.push({ id: S.uid(), ...v });
      commit();
    } },
      field('Credential', 'name', { value: k ? k.name : '', required: true, placeholder: 'e.g. Certificate in data journalism' }),
      field('Issued by (optional)', 'issuer', { value: k ? k.issuer : '' }),
      field('Link (optional)', 'url', { value: k ? k.url : '', placeholder: 'https://' }),
      select('Status', 'status', S.CRED_STATUS, k ? k.status : 'considering'),
      field('Note (optional)', 'note', { value: k ? k.note : '', multiline: true, rows: 2, hint: 'Requirements, cost, or why it adds credibility.' }),
      h('div', { class: 'btn-row' }, h('button', { class: 'btn', type: 'submit' }, k ? 'Save' : 'Add credential'), k ? cancelBtn() : null));
  }

  function credentialItem(c, k) {
    if (ui.edit === k.id) return h('li', { class: 'item' }, credentialForm(c, k));
    return h('li', { class: 'item' }, h('div', { class: 'item-body' },
      h('div', { class: 'item-title' }, k.url ? h('a', { href: k.url, target: '_blank', rel: 'noopener noreferrer' }, k.name) : k.name, ' ', badge(S.label(S.CRED_STATUS, k.status), k.status === 'earned' ? 'solid' : ''), k.requirement ? ' ' : null, k.requirement ? badge(k.requirement === 'required' ? 'Required for your goal' : 'Suggested', 'soft') : null),
      k.issuer ? h('div', { class: 'item-note' }, k.issuer) : null,
      k.origin === 'ai' ? h('div', { class: 'small muted' }, 'Suggested by AI. Check requirements with the official issuer; they can depend on where you live. Marking it earned is self-reported.') : null,
      k.note ? h('div', { class: 'item-note' }, k.note) : null,
      h('div', { class: 'item-actions' }, editBtn(k.id), removeBtn('credential', c.credentials, k))));
  }

  function pageModules(c) {
    return h('div', {},
      pageHead('Modules'),
      moduleTiles(c, true),
      h('details', { class: 'add', open: !c.modules.length }, h('summary', {}, 'New module'),
        h('form', { onsubmit: (e) => {
          e.preventDefault();
          const m = S.newModule(new FormData(e.target).get('title').trim());
          c.modules.push(m); S.save(); go(href(c, 'modules', m.id));
        } },
          field('Module title', 'title', { required: true, placeholder: 'e.g. Asset Creation' }),
          h('button', { class: 'btn', type: 'submit' }, 'Add module'))),
      h('section', { class: 'home-sec' },
        h('div', { class: 'section-head' }, h('h2', {}, 'Licenses and credentials'), h('span', { class: 'count' }, 'Optional')),
        h('p', { class: 'muted' }, 'Some fields offer licenses or certifications that add credibility to your portfolio. Track the ones worth pursuing, and mark them earned when you have them.'),
        c.credentials.length ? h('ul', { class: 'items' }, c.credentials.map((k) => credentialItem(c, k))) : empty('None yet. Not every field has one, so skip this if it doesn’t apply.'),
        h('details', { class: 'add' }, h('summary', {}, 'Add a license or credential'), credentialForm(c, null))));
  }

  /* ---------- Assignments (always belong to exactly one module) ---------- */

  function assignmentForm(c, m, a) {
    return h('form', { class: a ? 'inline-edit' : '', onsubmit: (e) => {
      e.preventDefault(); const f = new FormData(e.target);
      const graded = a && a.work && a.work.final && a.work.final.feedback;
      const v = { title: f.get('title').trim(), description: f.get('description').trim(), due: a && a.locked ? a.due : S.validDate(f.get('due') || '') };
      if (!graded) { v.points = num(f.get('points')); v.score = num(f.get('score')); }
      if (a) { Object.assign(a, v); ui.edit = null; }
      else {
        const target = m || c.modules.find((x) => x.id === f.get('module'));
        if (!target) return toast('Choose a module first.');
        target.assignments.push({ id: S.uid(), done: false, ...v });
      }
      commit();
    } },
      !m && !a ? select('Module', 'module', c.modules.map((x) => [x.id, x.title]), c.modules[0] && c.modules[0].id) : null,
      field('Assignment title', 'title', { value: a ? a.title : '', required: true, placeholder: 'e.g. Writing Exercise 1' }),
      field('Instructions (optional)', 'description', { value: a ? a.description : '', multiline: true, rows: 3 }),
      a && a.locked ? h('p', { class: 'small muted' }, 'Due ' + S.fmtDate(a.due) + '. Set by your course timeline, so it can’t be changed.') : field('Due date (optional)', 'due', { type: 'date', value: a ? a.due : '' }),
      a && a.work && a.work.final && a.work.final.feedback ? h('p', { class: 'small muted' }, 'Graded by the AI review: ' + a.score + ' / ' + a.points + ' pts. Points and score are fixed once graded.') : h('div', { class: 'two' }, field('Points (optional)', 'points', { type: 'number', value: a ? a.points : '' }), field('Your score (optional)', 'score', { type: 'number', value: a ? a.score : '' })),
      h('div', { class: 'btn-row' }, h('button', { class: 'btn', type: 'submit' }, a ? 'Save' : 'Add assignment'), a ? cancelBtn() : null));
  }

  // o: link (title links to its module), actions (edit/remove), reorder
  function assignmentItem(c, m, a, o) {
    if (ui.edit === a.id) return h('li', { class: 'item' }, assignmentForm(c, m, a));
    const pct = S.pctOf(a), late = !a.done && a.due && a.due < S.todayISO();
    const meta = [
      a.kind ? h('span', { class: 'badge soft' }, a.kind === 'learn' ? 'Learn' : a.kind === 'apply' ? 'Apply' : 'Demonstrate') : null,
      a.due ? h('span', { class: 'due' + (late ? ' late' : '') }, (late ? 'Overdue · ' : 'Due ') + S.fmtDate(a.due)) : null,
      a.points != null ? h('span', { class: 'due' }, a.score != null ? a.score + ' / ' + a.points + ' pts' + (pct != null ? ' · ' + pct + '%' : '') : a.points + ' pts') : null,
    ].filter(Boolean);
    return h('li', { class: 'item' + (a.done ? ' is-done' : '') },
      checkbox(a.done, 'Mark completed: ' + a.title, (v) => { a.done = v; commit(); }),
      h('div', { class: 'item-body' },
        h('div', { class: 'item-title' }, o.link ? h('a', { href: href(c, 'modules', m.id) }, a.title) : a.title),
        meta.length ? h('div', { class: 'item-meta' }, meta) : null,
        a.description ? h('div', { class: 'item-note' }, a.description) : null,
        a.work && a.work.final && a.work.final.feedback && a.work.final.late ? h('div', { class: 'item-meta' }, h('span', { class: 'badge warn' }, 'Late')) : null,
        o.work ? S.workPanel(c, m, a) : null,
        o.actions ? h('div', { class: 'item-actions' }, editBtn(a.id), o.reorder ? moveBtns(m.assignments, a) : null, removeBtn('assignment', m.assignments, a)) : null));
  }

  function assignmentGroups(c, manage) {
    const groups = c.modules.map((m, i) => (m.assignments.length ? h('div', { class: 'agroup' },
      h('h3', { class: 'minor' }, h('a', { href: href(c, 'modules', m.id) }, 'Module ' + (i + 1) + ' · ' + m.title)),
      h('ul', { class: 'items' }, m.assignments.map((a) => assignmentItem(c, m, a, { link: false, actions: manage })))) : null)).filter(Boolean);
    return groups.length ? h('div', {}, groups) : empty('No assignments yet. Assignments are created inside a module, so each one belongs to the module it is for.');
  }

  function pageAssignments(c) {
    return h('div', {},
      pageHead('Assignments'),
      assignmentGroups(c, true),
      c.modules.length
        ? h('details', { class: 'add' }, h('summary', {}, 'New assignment'), h('div', { class: 'panel' }, h('p', { class: 'muted small' }, 'Pick the module this assignment belongs to. It will live in that module.'), assignmentForm(c, null, null)))
        : empty('Add a module first. Every assignment belongs to a module.'));
  }

  /* ---------- Grades ---------- */

  function pageGrades(c) {
    const g = S.grade(c);
    const rows = [];
    c.modules.forEach((m, i) => {
      if (!m.assignments.length) return;
      rows.push(h('tr', { class: 'grp' }, h('th', { colspan: 4, scope: 'colgroup' }, 'Module ' + (i + 1) + ' · ' + m.title)));
      m.assignments.forEach((a) => {
        const pct = S.pctOf(a);
        const numIn = (key, label) => h('input', { type: 'number', min: '0', step: 'any', inputmode: 'decimal', value: a[key] == null ? '' : String(a[key]), 'aria-label': label + ': ' + a.title,
          onchange: (e) => { a[key] = num(e.target.value); commit(); } });
        const aiGraded = !!(a.work && a.work.final && a.work.final.feedback);
        rows.push(h('tr', {}, h('td', {}, a.title, aiGraded ? h('small', { class: 'muted' }, ' · AI-graded') : null), h('td', {}, aiGraded ? String(a.points) : numIn('points', 'Points')), h('td', {}, aiGraded ? String(a.score) : numIn('score', 'Score')), h('td', { class: 'pct' }, pct != null ? pct + '%' + (aiGraded ? ' · ' + S.letter(pct) : '') : '—')));
      });
    });
    return h('div', {},
      pageHead('Grades'),
      h('div', { class: 'grade-card' },
        h('p', { class: 'eyebrow' }, 'Current Grade'),
        h('div', { class: 'grade-big' }, g ? g.pct + '%' : '—'),
        h('p', { class: 'muted small' }, g ? g.earned + ' of ' + g.possible + ' points, across ' + plural(g.n, 'graded assignment') + '.' : 'Enter points and your score for an assignment to see your average.')),
      rows.length
        ? h('div', { class: 'table-wrap' }, h('table', { class: 'grades' },
            h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, 'Assignment'), h('th', { scope: 'col' }, 'Points'), h('th', { scope: 'col' }, 'Score'), h('th', { scope: 'col' }, '%'))),
            h('tbody', {}, rows)))
        : empty('No assignments yet. Add assignments inside a module, then grade yourself here.'));
  }

  /* ---------- A single module page ---------- */

  function textSection(m, key, title, hint) {
    const k = key + ':' + m.id;
    return h('section', { class: 'msec' },
      h('div', { class: 'sec-head' }, h('h3', {}, title), ui.edit === k ? null : editBtn(k)),
      ui.edit === k
        ? h('form', { onsubmit: (e) => { e.preventDefault(); m[key] = new FormData(e.target).get('text').trim(); m.edited = true; ui.edit = null; commit(); } },
            field(title, 'text', { value: m[key], multiline: true, rows: 6, hint }), h('div', { class: 'btn-row' }, h('button', { class: 'btn', type: 'submit' }, 'Save'), cancelBtn()))
        : (m[key] ? h('p', { class: 'pre' }, m[key]) : empty(hint)));
  }

  function extraSection(m, x) {
    const k = 'x:' + x.id;
    return h('section', { class: 'msec' },
      h('div', { class: 'sec-head' }, h('h3', {}, x.title), ui.edit === k ? null : h('span', { class: 'item-actions' }, editBtn(k), removeBtn('section', m.extras, x))),
      ui.edit === k
        ? h('form', { onsubmit: (e) => { e.preventDefault(); const f = new FormData(e.target); x.title = f.get('title').trim(); x.body = f.get('body').trim(); ui.edit = null; commit(); } },
            field('Section title', 'title', { value: x.title, required: true }), field('Content', 'body', { value: x.body, multiline: true, rows: 6 }),
            h('div', { class: 'btn-row' }, h('button', { class: 'btn', type: 'submit' }, 'Save'), cancelBtn()))
        : (x.body ? h('p', { class: 'pre' }, x.body) : empty('Nothing here yet. Use Edit to add to this section.')));
  }

  // A list stored as an array of strings (objectives, self-check questions). Hidden when empty so manual modules look unchanged.
  function listSection(m, key, title, hint) {
    const k = key + ':' + m.id;
    if (!m[key].length && ui.edit !== k) return null;
    return h('section', { class: 'msec' },
      h('div', { class: 'sec-head' }, h('h3', {}, title), ui.edit === k ? null : editBtn(k)),
      ui.edit === k
        ? h('form', { onsubmit: (e) => { e.preventDefault(); m[key] = String(new FormData(e.target).get('text') || '').split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 12).map((x) => x.slice(0, 400)); m.edited = true; ui.edit = null; commit(); } },
            field(title, 'text', { value: m[key].join('\n'), multiline: true, rows: 5, hint }), h('div', { class: 'btn-row' }, h('button', { class: 'btn', type: 'submit' }, 'Save'), cancelBtn()))
        : h('ul', { class: 'plain' }, m[key].map((x) => h('li', {}, x))));
  }

  const busy = new Set();
  const sylN = (n) => n + (n === 1 ? ' syllabus' : ' syllabi');

  // Syllabi from other courses live here, apart from readings. "Source readings" asks the AI to open one and add what it assigns.
  function syllabiSection(c, m) {
    const item = (y) => {
      const working = busy.has(y.id);
      return h('li', { class: 'item' }, h('div', { class: 'item-body' },
        h('div', { class: 'item-title' }, y.url ? h('a', { href: y.url, target: '_blank', rel: 'noopener noreferrer' }, y.title) : y.title),
        S.syllabusLabels(y),
        y.sourcedAt ? h('div', { class: 'small' }, y.sourcedCount + ' reading' + (y.sourcedCount === 1 ? '' : 's') + ' added to this module from it on ' + y.sourcedAt.slice(0, 10) + '.') : null,
        h('div', { class: 'item-actions' },
          y.url ? h('button', { class: 'btn ghost', type: 'button', disabled: working, onclick: async () => {
            if (!S.ai.ready()) { toast('Add the AI service address and access code first (Data & Backup → AI).'); return; }
            busy.add(y.id); S.render(false);
            try { const r = await S.ai.sourceSyllabus(c, m, y, {}); toast(r.added ? 'Added ' + plural(r.added, 'reading') + ' from this syllabus.' : (r.missing ? 'No readings could be sourced from this syllabus.' : 'Nothing new to add.')); }
            catch (e) { toast(e.message); }
            busy.delete(y.id); S.render(false);
          } }, working ? 'Reading the syllabus…' : (y.sourcedAt ? 'Source again' : 'Source readings from this syllabus')) : null,
          removeBtn('syllabus', m.syllabi, y))));
    };
    return h('section', { class: 'msec' },
      h('div', { class: 'sec-head' }, h('h3', {}, 'Syllabi from other courses'), h('span', { class: 'count' }, m.syllabi.length ? sylN(m.syllabi.length) : '')),
      m.syllabi.length ? h('p', { class: 'small muted' }, 'Not readings themselves. Choose “Source readings” and the AI will open a syllabus and add the readings it assigns, noting where they came from.') : null,
      m.syllabi.length ? h('ul', { class: 'items' }, m.syllabi.map(item)) : null,
      h('details', { class: 'add' }, h('summary', {}, 'Add a syllabus'),
        h('form', { onsubmit: (e) => {
          e.preventDefault(); const f = new FormData(e.target), u = S.cleanUrl(f.get('url'));
          if (!u) return toast(BAD_LINK);
          m.syllabi.push(S.makeSyllabus({ title: f.get('title').trim() || u, url: u, note: f.get('note').trim(), source: 'user' })); commit();
        } },
          field('Syllabus title', 'title', { placeholder: 'e.g. WGS 101, Prof. Name, University' }), field('Link', 'url', { required: true, placeholder: 'https://' }),
          field('Note (optional)', 'note', { multiline: true, rows: 2 }), h('button', { class: 'btn', type: 'submit' }, 'Add syllabus'))));
  }
  function findMaterialsBtn(c, m) {
    const working = busy.has(m.id);
    return h('div', { class: 'find-row' },
      h('button', { class: 'btn ghost', type: 'button', disabled: working, onclick: async () => {
        if (!S.ai.ready()) { toast('Add the AI service address and access code first (Data & Backup → AI).'); return; }
        busy.add(m.id); S.render(false);
        try {
          const r = await S.ai.findMaterials(c, m, {});
          toast(r.missing && r.syllabi ? 'No readings found, but ' + sylN(r.syllabi) + ' were added below to source from.' : r.missing ? 'No verifiable source was found for this module.' : 'Added ' + plural(r.added, 'suggested resource') + (r.syllabi ? ' and ' + sylN(r.syllabi) : '') + '.');
        } catch (e) { toast(e.message); }
        busy.delete(m.id); S.render(false);
      } }, working ? 'Searching…' : 'Find materials with AI'),
      h('span', { class: 'small muted' }, 'Adds suggestions; never removes your own.'));
  }

  function readingItem(m, r) {
    if (ui.edit === r.id) {
      return h('li', { class: 'item' }, h('form', { class: 'inline-edit', onsubmit: (e) => {
        e.preventDefault(); const f = new FormData(e.target), u = S.cleanUrl(f.get('url'));
        if (u === null) return toast(BAD_LINK);
        const urlChanged = u !== r.url;
        r.title = f.get('title').trim(); r.url = u; r.note = f.get('note').trim();
        // Once a person changes the link (or fills in a placeholder), the AI's check and opinion no longer describe it.
        if (r.source && (urlChanged || r.source === 'placeholder')) { ['source', 'kind', 'creator', 'access', 'sourceType', 'derivedFrom', 'derivedUrl', 'relevance', 'verification'].forEach((k) => delete r[k]); }
        ui.edit = null; commit();
      } },
        field('Title', 'title', { value: r.title, required: true }), field('Link (optional)', 'url', { value: r.url, placeholder: 'https://' }),
        field('Note (optional)', 'note', { value: r.note, multiline: true, rows: 2 }),
        h('div', { class: 'btn-row' }, h('button', { class: 'btn', type: 'submit' }, 'Save'), cancelBtn())));
    }
    return h('li', { class: 'item' + (r.done ? ' is-done' : '') },
      checkbox(r.done, 'Mark done: ' + r.title, (v) => { r.done = v; commit(); }),
      h('div', { class: 'item-body' },
        h('div', { class: 'item-title' }, r.url ? h('a', { href: r.url, target: '_blank', rel: 'noopener noreferrer' }, r.title) : r.title),
        r.note ? h('div', { class: 'item-note' }, r.note) : null,
        S.readingLabels(r),
        h('div', { class: 'item-actions' }, editBtn(r.id), moveBtns(m.readings, r), removeBtn('reading', m.readings, r))));
  }

  function pageModule(c, m) {
    const idx = c.modules.indexOf(m), ms = S.moduleStats(m);
    const prev = c.modules[idx - 1], next = c.modules[idx + 1];
    const head = ui.edit === 'title:' + m.id
      ? h('form', { class: 'inline-edit', onsubmit: (e) => { e.preventDefault(); const f = new FormData(e.target); m.title = f.get('title').trim(); m.duration = String(f.get('duration') || '').trim().slice(0, 60); m.edited = true; ui.edit = null; commit(); } },
          field('Module title', 'title', { value: m.title, required: true }), field('Timing (optional)', 'duration', { value: m.duration, placeholder: 'e.g. Week 1' }), h('div', { class: 'btn-row' }, h('button', { class: 'btn', type: 'submit' }, 'Save'), cancelBtn()))
      : h('div', {},
          h('p', { class: 'eyebrow' }, 'Module ' + (idx + 1) + ' of ' + c.modules.length + (m.duration ? ' · ' + m.duration : '')),
          m.origin === 'ai' && !m.edited ? h('p', { class: 'small muted' }, h('span', { class: 'badge soft' }, 'AI draft'), ' Check it over and change whatever doesn’t fit.') : null,
          h('h2', { class: 'mod-h' }, m.title),
          h('div', { class: 'tools' }, editBtn('title:' + m.id, 'Rename'),
            h('button', { class: 'linkbtn danger', type: 'button', onclick: () => {
              if (!confirm('Delete “' + m.title + '” with its readings and assignments? This cannot be undone.')) return;
              c.modules.splice(idx, 1); S.save(); go(href(c, 'modules')); toast('Module deleted.');
            } }, 'Delete module')));

    return h('div', {},
      h('p', { class: 'crumbs' }, h('a', { href: href(c, 'modules') }, '← All modules')),
      head,
      h('div', { class: 'complete-row' },
        h('label', { class: 'checkline' }, h('span', { class: 'check' }, h('input', { type: 'checkbox', checked: m.complete, onchange: (e) => { m.complete = e.target.checked; commit(); toast(m.complete ? 'Module marked complete.' : 'Module reopened.'); } }), h('span', { class: 'box', 'aria-hidden': 'true' })), h('span', {}, 'Mark this module complete')),
        progressBar(ms.pct, 'Module progress')),

      textSection(m, 'overview', 'Overview', 'Add a short overview: what this module covers and what you want to get from it.'),
      listSection(m, 'objectives', 'Learning objectives', 'One objective per line.'),

      h('section', { class: 'msec' },
        h('div', { class: 'sec-head' }, h('h3', {}, 'Readings'), h('span', { class: 'count' }, m.readings.filter((r) => r.done).length + ' of ' + m.readings.length + ' done')),
        m.readings.length ? h('ul', { class: 'items' }, m.readings.map((r) => readingItem(m, r))) : empty('Add readings, videos, links, or notes to study.'),
        findMaterialsBtn(c, m),
        h('details', { class: 'add' }, h('summary', {}, 'Add a reading'),
          h('form', { onsubmit: (e) => {
            e.preventDefault(); const f = new FormData(e.target), u = S.cleanUrl(f.get('url'));
            if (u === null) return toast(BAD_LINK);
            m.readings.push({ id: S.uid(), title: f.get('title').trim(), url: u, note: f.get('note').trim(), done: false }); commit();
          } },
            field('Title', 'title', { required: true, placeholder: 'e.g. Chapter 1, or a link title' }),
            field('Link (optional)', 'url', { placeholder: 'https://' }),
            field('Note (optional)', 'note', { multiline: true, rows: 2 }),
            h('button', { class: 'btn', type: 'submit' }, 'Add reading')))),

      syllabiSection(c, m),

      textSection(m, 'keyIdeas', 'Key ideas', 'Capture the main ideas, terms, and arguments worth remembering.'),
      m.extras.map((x) => extraSection(m, x)),

      h('section', { class: 'msec' },
        h('div', { class: 'sec-head' }, h('h3', {}, 'Assignments'), h('span', { class: 'count' }, m.assignments.filter((a) => a.done).length + ' of ' + m.assignments.length + ' done')),
        m.assignments.length ? h('ul', { class: 'items' }, m.assignments.map((a) => assignmentItem(c, m, a, { actions: true, reorder: true, work: true }))) : empty('Add practical assignments for this module. They belong to this module only.'),
        h('details', { class: 'add' }, h('summary', {}, 'New assignment'), assignmentForm(c, m, null))),

      listSection(m, 'selfCheck', 'Check your understanding', 'One question per line.'),
      textSection(m, 'reflection', 'Reflection', 'After finishing, write what you learned, what was hard, and what you would do differently.'),

      h('details', { class: 'add' }, h('summary', {}, 'Add a custom section'),
        h('form', { onsubmit: (e) => {
          e.preventDefault(); const f = new FormData(e.target);
          m.extras.push({ id: S.uid(), title: f.get('title').trim(), body: f.get('body').trim() }); commit();
        } },
          field('Section title', 'title', { required: true, placeholder: 'e.g. Discussion questions' }),
          field('Content (optional)', 'body', { multiline: true, rows: 3 }),
          h('button', { class: 'btn', type: 'submit' }, 'Add section'))),

      h('nav', { class: 'pager', 'aria-label': 'Module navigation' },
        prev ? h('a', { href: href(c, 'modules', prev.id) }, '← ' + prev.title) : h('span', {}),
        next ? h('a', { href: href(c, 'modules', next.id) }, next.title + ' →') : h('span', {})));
  }
})(window.Sovereign = window.Sovereign || {});
