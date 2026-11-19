/* sovereign. — the views: first run, Dashboard, Curriculum, Practice, My Work, Data & Backup. */
(function (S) {
  'use strict';
  const { h, field, select, progressBar, checkbox, badge, plural, trunc, toast, go, commit } = S;
  const V = (S.views = {});
  const ui = S.ui;
  const pad = (n) => String(n + 1).padStart(2, '0');
  const BAD_LINK = 'That link doesn’t look valid. Use an http(s) address.';

  /* ---------- shared bits ---------- */

  function stage(name, d, t) {
    return h('div', { class: 'stage' + (t && d === t ? ' done' : '') }, h('b', {}, name), h('span', {}, t ? d + ' of ' + t : '—'));
  }
  const stages = (s) => h('div', { class: 'stages' }, stage('Learn', s.rd, s.rl), stage('Apply', s.ad, s.al), stage('Demonstrate', s.wd, 1));
  const banner = (text, kind) => h('p', { class: 'banner ' + (kind || ''), role: kind === 'error' ? 'alert' : 'status' }, text);
  const cancelBtn = () => h('button', { class: 'btn ghost', type: 'button', onclick: () => { ui.edit = null; S.render(false); } }, 'Cancel');

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

  /* ---------- first run ---------- */

  V.firstRun = function () {
    return h('div', { class: 'narrow' },
      h('p', { class: 'eyebrow' }, 'Self-directed learning'),
      h('h1', {}, 'Learn it. Apply it. Prove it.'),
      h('p', { class: 'lede' }, 'Sovereign turns books, articles, and courses into practical skills and tangible work you can point to. Design your own curriculum, practice what you learn, and finish with something real.'),
      h('div', { class: 'trio' },
        h('div', {}, h('b', {}, 'Learn'), h('p', {}, 'Gather readings, videos, and links into modules.')),
        h('div', {}, h('b', {}, 'Apply'), h('p', {}, 'Complete practical assignments that make you use it.')),
        h('div', {}, h('b', {}, 'Demonstrate'), h('p', {}, 'Document a final project as proof of what you can do.'))),
      S.ui.dataMsg ? banner(S.ui.dataMsg.text, S.ui.dataMsg.type) : null,
      h('div', { class: 'choices' },
        h('div', { class: 'choice' },
          h('h2', {}, 'Start a blank curriculum'),
          h('p', {}, 'Define your own learning objective, modules, and final deliverable.'),
          h('button', { class: 'btn', type: 'button', onclick: () => go('#/new') }, 'Start blank curriculum')),
        h('div', { class: 'choice' },
          h('h2', {}, 'Explore the Independent Journalism example'),
          h('p', {}, 'A complete example: five modules, real readings, practical assignments, and a defined final deliverable. Everything is editable.'),
          h('button', { class: 'btn ghost', type: 'button', onclick: () => {
            S.state.curricula = [S.exampleCurriculum()]; S.save(); go('#/'); toast('Example loaded. Edit anything to make it yours.');
          } }, 'Explore the example'))),
      h('p', { class: 'small muted' }, 'Your progress is stored only in this browser. It does not sync between devices. Use Export backup to keep a copy or move it. ',
        h('button', { class: 'linkbtn', type: 'button', onclick: pickImport }, 'Have a backup? Import it.')));
  };

  V.newCurriculum = function () {
    return h('div', { class: 'narrow' },
      h('p', { class: 'crumbs' }, h('a', { href: '#/' }, '← Back')),
      h('h1', {}, 'Start a blank curriculum'),
      h('p', { class: 'lede muted' }, 'Three questions to begin. You can change any answer later.'),
      curriculumForm(null));
  };

  function curriculumForm(c) {
    return h('form', { onsubmit: (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const vals = { title: f.get('title').trim(), objective: f.get('objective').trim(), deliverable: f.get('deliverable').trim() };
      if (c) { Object.assign(c, vals); ui.edit = null; commit(); toast('Curriculum updated.'); }
      else { S.state.curricula.push(S.newCurriculum(vals)); S.save(); go('#/curriculum'); toast('Curriculum created. Add your first module.'); }
    } },
      field('Title', 'title', { value: c ? c.title : '', required: true, placeholder: 'e.g. Independent Journalism' }),
      field('Learning objective', 'objective', { value: c ? c.objective : '', multiline: true, required: true, hint: 'What do you want to be able to do when you finish?' }),
      field('Final deliverable', 'deliverable', { value: c ? c.deliverable : '', multiline: true, required: true, hint: 'What will you make to prove it?' }),
      h('div', { class: 'btn-row' }, h('button', { class: 'btn', type: 'submit' }, c ? 'Save changes' : 'Create curriculum'), c ? cancelBtn() : null));
  }

  /* ---------- dashboard ---------- */

  V.dashboard = function () {
    const c = S.active(), s = S.stats(c), nx = S.nextUp(c);
    const earned = c.credentials.filter((k) => k.status === 'earned').length;

    const card = h('article', { class: 'course-card' },
      h('p', { class: 'eyebrow' }, 'Curriculum'),
      h('h2', {}, h('a', { href: '#/curriculum' }, c.title)),
      h('p', { class: 'card-obj' }, c.objective),
      h('dl', { class: 'mini' }, h('dt', {}, 'Final deliverable'), h('dd', {}, c.deliverable)),
      h('div', { class: 'progress-row' }, h('strong', {}, s.pct + '%'), h('span', { class: 'muted' }, s.done + ' of ' + s.total + ' steps')),
      progressBar(s.pct, c.title + ' progress'),
      stages(s),
      h('div', { class: 'btn-row' },
        h('a', { class: 'btn', href: nx ? nx.href : '#/work' }, nx ? 'Continue' : 'Open My Work'),
        h('a', { class: 'btn ghost', href: '#/curriculum' }, 'Open curriculum')));

    const rail = h('aside', { class: 'rail', 'aria-label': 'Progress and next actions' },
      h('div', { class: 'rail-box' },
        h('p', { class: 'eyebrow' }, 'Next up' + (nx ? ' · ' + nx.kind : '')),
        nx ? h('p', {}, h('a', { href: nx.href }, nx.text), nx.where ? h('span', { class: 'muted small' }, ' in ' + nx.where) : null)
           : h('p', {}, 'Everything is complete. Learned, applied, demonstrated.')),
      h('div', { class: 'rail-box' },
        h('p', { class: 'eyebrow' }, 'Overall progress'),
        h('div', { class: 'big' }, s.pct + '%'),
        progressBar(s.pct, 'Overall progress'),
        h('p', { class: 'small muted', style: 'margin:.6rem 0 0' }, s.done + ' of ' + plural(s.total, 'step') + ' complete')),
      h('div', { class: 'rail-box' },
        h('p', { class: 'eyebrow' }, 'Proof of practice'),
        badge(S.label(S.WORK_STATUS, c.work.status), c.work.status === 'completed' ? 'solid' : ''),
        h('p', { class: 'small', style: 'margin:.6rem 0 0' }, h('a', { href: '#/work' }, 'Open My Work')),
        c.credentials.length ? h('p', { class: 'small muted', style: 'margin:.4rem 0 0' }, earned + ' of ' + plural(c.credentials.length, 'credential') + ' earned') : null));

    return h('div', { class: 'dash' },
      h('div', {}, h('h1', {}, 'Dashboard'), h('p', { class: 'lede muted' }, 'Where you are, and what to do next.'),
        h('div', { class: 'cards' }, card)),
      rail);
  };

  /* ---------- curriculum ---------- */

  function resourceItem(m, r) {
    if (ui.edit === r.id) {
      return h('li', { class: 'item' }, h('form', { class: 'inline-edit', onsubmit: (e) => {
        e.preventDefault();
        const f = new FormData(e.target), u = S.cleanUrl(f.get('url'));
        if (u === null) return toast(BAD_LINK);
        r.title = f.get('title').trim(); r.url = u; r.note = f.get('note').trim(); ui.edit = null; commit();
      } },
        field('Title', 'title', { value: r.title, required: true }),
        field('Link (optional)', 'url', { value: r.url, placeholder: 'https://' }),
        field('Note (optional)', 'note', { value: r.note, multiline: true, rows: 2 }),
        h('div', { class: 'btn-row' }, h('button', { class: 'btn', type: 'submit' }, 'Save'), cancelBtn())));
    }
    return h('li', { class: 'item' + (r.done ? ' is-done' : '') },
      checkbox(r.done, 'Mark studied: ' + r.title, (v) => { r.done = v; commit(); }),
      h('div', { class: 'item-body' },
        h('div', { class: 'item-title' }, r.url ? h('a', { href: r.url, target: '_blank', rel: 'noopener noreferrer' }, r.title) : r.title),
        r.note ? h('div', { class: 'item-note' }, r.note) : null,
        h('div', { class: 'item-actions' },
          h('button', { class: 'linkbtn', type: 'button', onclick: () => { ui.edit = r.id; S.render(false); } }, 'Edit'),
          moveBtns(m.resources, r), removeBtn('resource', m.resources, r))));
  }

  function assignmentItem(m, a) {
    if (ui.edit === a.id) {
      return h('li', { class: 'item' }, h('form', { class: 'inline-edit', onsubmit: (e) => {
        e.preventDefault(); a.text = new FormData(e.target).get('text').trim(); ui.edit = null; commit();
      } },
        field('Assignment', 'text', { value: a.text, multiline: true, required: true }),
        h('div', { class: 'btn-row' }, h('button', { class: 'btn', type: 'submit' }, 'Save'), cancelBtn())));
    }
    return h('li', { class: 'item' + (a.done ? ' is-done' : '') },
      checkbox(a.done, 'Mark completed: ' + a.text, (v) => { a.done = v; commit(); }),
      h('div', { class: 'item-body' },
        h('div', { class: 'item-title pre' }, a.text),
        h('div', { class: 'item-actions' },
          h('button', { class: 'linkbtn', type: 'button', onclick: () => { ui.edit = a.id; S.render(false); } }, 'Edit'),
          moveBtns(m.assignments, a), removeBtn('assignment', m.assignments, a))));
  }

  function moduleBlock(c, m, i) {
    const ms = S.modStats(m);
    const d = h('details', { class: 'module', id: 'mod-' + m.id, open: ui.open.has(m.id) });
    d.addEventListener('toggle', () => { if (d.open) ui.open.add(m.id); else ui.open.delete(m.id); });

    const head = ui.edit === m.id
      ? h('form', { class: 'inline-edit', onsubmit: (e) => {
          e.preventDefault(); const f = new FormData(e.target);
          m.title = f.get('title').trim(); m.summary = f.get('summary').trim(); ui.edit = null; commit();
        } },
          field('Module title', 'title', { value: m.title, required: true }),
          field('Summary (optional)', 'summary', { value: m.summary, multiline: true, rows: 2 }),
          h('div', { class: 'btn-row' }, h('button', { class: 'btn', type: 'submit' }, 'Save'), cancelBtn()))
      : h('div', {},
          m.summary ? h('p', { class: 'mod-summary' }, m.summary) : null,
          h('div', { class: 'tools' },
            h('button', { class: 'linkbtn', type: 'button', onclick: () => { ui.edit = m.id; S.render(false); } }, 'Edit module'),
            h('button', { class: 'linkbtn', type: 'button', disabled: i === 0, onclick: () => { c.modules.splice(i, 1); c.modules.splice(i - 1, 0, m); commit(); } }, 'Move up'),
            h('button', { class: 'linkbtn', type: 'button', disabled: i === c.modules.length - 1, onclick: () => { c.modules.splice(i, 1); c.modules.splice(i + 1, 0, m); commit(); } }, 'Move down'),
            h('button', { class: 'linkbtn danger', type: 'button', onclick: () => {
              if (!confirm('Delete “' + m.title + '” and all its resources and assignments? This cannot be undone.')) return;
              c.modules.splice(i, 1); ui.open.delete(m.id); commit();
            } }, 'Delete module')));

    d.append(
      h('summary', {},
        h('span', { class: 'num' }, pad(i)),
        h('span', { class: 'mod-title' }, h('b', {}, m.title), h('small', {}, ms.total ? ms.done + ' of ' + plural(ms.total, 'step') + ' complete' : 'No steps yet')),
        h('span', { class: 'mod-pct' }, ms.pct + '%')),
      h('div', { class: 'mod-body' }, head,
        h('div', { class: 'mod-sec learn' },
          h('div', { class: 'sec-head' }, h('h3', {}, 'Learn'), h('span', { class: 'count' }, ms.rd + ' of ' + m.resources.length + ' studied')),
          m.resources.length ? h('ul', { class: 'items' }, m.resources.map((r) => resourceItem(m, r)))
            : h('p', { class: 'empty' }, 'Add readings, videos, links, or notes to study.'),
          h('details', { class: 'add' }, h('summary', {}, 'Add a resource'),
            h('form', { onsubmit: (e) => {
              e.preventDefault(); const f = new FormData(e.target), u = S.cleanUrl(f.get('url'));
              if (u === null) return toast(BAD_LINK);
              m.resources.push({ id: S.uid(), title: f.get('title').trim(), url: u, note: f.get('note').trim(), done: false }); commit();
            } },
              field('Title', 'title', { required: true, placeholder: 'e.g. SPJ Code of Ethics' }),
              field('Link (optional)', 'url', { placeholder: 'https://' }),
              field('Note (optional)', 'note', { multiline: true, rows: 2, hint: 'Why it matters, or what to look for.' }),
              h('button', { class: 'btn', type: 'submit' }, 'Add resource')))),
        h('div', { class: 'mod-sec apply' },
          h('div', { class: 'sec-head' }, h('h3', {}, 'Apply'), h('span', { class: 'count' }, ms.ad + ' of ' + m.assignments.length + ' done')),
          m.assignments.length ? h('ul', { class: 'items' }, m.assignments.map((a) => assignmentItem(m, a)))
            : h('p', { class: 'empty' }, 'Add practical assignments or exercises that use what you learned.'),
          h('details', { class: 'add' }, h('summary', {}, 'Add an assignment'),
            h('form', { onsubmit: (e) => {
              e.preventDefault(); m.assignments.push({ id: S.uid(), text: new FormData(e.target).get('text').trim(), done: false }); commit();
            } },
              field('Assignment', 'text', { multiline: true, required: true, placeholder: 'e.g. Interview one local source and transcribe it.' }),
              h('button', { class: 'btn', type: 'submit' }, 'Add assignment'))))));
    return d;
  }

  function credentialItem(c, k) {
    if (ui.edit === k.id) return h('li', { class: 'item' }, credentialForm(c, k));
    return h('li', { class: 'item' },
      h('div', { class: 'item-body' },
        h('div', { class: 'item-title' }, k.url ? h('a', { href: k.url, target: '_blank', rel: 'noopener noreferrer' }, k.name) : k.name, ' ',
          badge(S.label(S.CRED_STATUS, k.status), k.status === 'earned' ? 'solid' : '')),
        k.issuer ? h('div', { class: 'item-note' }, k.issuer) : null,
        k.note ? h('div', { class: 'item-note' }, k.note) : null,
        h('div', { class: 'item-actions' },
          h('button', { class: 'linkbtn', type: 'button', onclick: () => { ui.edit = k.id; S.render(false); } }, 'Edit'),
          removeBtn('credential', c.credentials, k))));
  }

  function credentialForm(c, k) {
    return h('form', { class: k ? 'inline-edit' : '', onsubmit: (e) => {
      e.preventDefault(); const f = new FormData(e.target), u = S.cleanUrl(f.get('url'));
      if (u === null) return toast(BAD_LINK);
      const vals = { name: f.get('name').trim(), issuer: f.get('issuer').trim(), url: u, note: f.get('note').trim(), status: f.get('status') };
      if (k) { Object.assign(k, vals); ui.edit = null; } else c.credentials.push({ id: S.uid(), ...vals });
      commit();
    } },
      field('Credential', 'name', { value: k ? k.name : '', required: true, placeholder: 'e.g. Certificate in data journalism' }),
      field('Issued by (optional)', 'issuer', { value: k ? k.issuer : '' }),
      field('Link (optional)', 'url', { value: k ? k.url : '', placeholder: 'https://' }),
      select('Status', 'status', S.CRED_STATUS, k ? k.status : 'considering'),
      field('Note (optional)', 'note', { value: k ? k.note : '', multiline: true, rows: 2, hint: 'Requirements, cost, or why it adds credibility.' }),
      h('div', { class: 'btn-row' }, h('button', { class: 'btn', type: 'submit' }, k ? 'Save' : 'Add credential'), k ? cancelBtn() : null));
  }

  V.curriculum = function (openId) {
    const c = S.active();
    if (openId && c.modules.some((m) => m.id === openId)) ui.open.add(openId);

    const header = ui.edit === 'cur'
      ? h('div', {}, h('h1', {}, 'Edit curriculum'), curriculumForm(c))
      : h('div', {},
          h('p', { class: 'eyebrow' }, 'Curriculum'),
          h('h1', {}, c.title),
          h('dl', { class: 'brief' },
            h('div', {}, h('dt', {}, 'Objective'), h('dd', {}, c.objective)),
            h('div', {}, h('dt', {}, 'Final deliverable'), h('dd', {}, c.deliverable))),
          h('button', { class: 'linkbtn', type: 'button', onclick: () => { ui.edit = 'cur'; S.render(false); } }, 'Edit curriculum details'));

    const allOpen = c.modules.length && c.modules.every((m) => ui.open.has(m.id));
    return h('div', { class: 'narrow' }, header,
      h('section', {},
        h('div', { class: 'section-head' }, h('h2', {}, 'Modules'),
          c.modules.length ? h('button', { class: 'linkbtn', type: 'button', onclick: () => {
            c.modules.forEach((m) => (allOpen ? ui.open.delete(m.id) : ui.open.add(m.id))); S.render(false);
          } }, allOpen ? 'Collapse all' : 'Expand all') : null),
        c.modules.length ? h('div', { class: 'modules' }, c.modules.map((m, i) => moduleBlock(c, m, i)))
          : h('p', { class: 'empty' }, 'No modules yet. A module is one stage of your learning, such as “Verifying sources”. Add your first below.'),
        h('details', { class: 'add', open: !c.modules.length },
          h('summary', {}, 'Add a module'),
          h('form', { onsubmit: (e) => {
            e.preventDefault(); const f = new FormData(e.target);
            const m = { id: S.uid(), title: f.get('title').trim(), summary: f.get('summary').trim(), resources: [], assignments: [] };
            c.modules.push(m); ui.open.add(m.id); S.save(); go('#/curriculum/' + m.id);
          } },
            field('Module title', 'title', { required: true, placeholder: 'e.g. Finding and verifying sources' }),
            field('What will this module teach you? (optional)', 'summary', { multiline: true, rows: 2 }),
            h('button', { class: 'btn', type: 'submit' }, 'Add module')))),

      h('section', {},
        h('div', { class: 'section-head' }, h('h2', {}, 'Licenses and credentials'), h('span', { class: 'count' }, 'Optional')),
        h('p', { class: 'muted' }, 'Some fields offer licenses or certifications that add credibility to your portfolio. Track the ones worth pursuing, and mark them earned when you have them.'),
        c.credentials.length ? h('ul', { class: 'items' }, c.credentials.map((k) => credentialItem(c, k)))
          : h('p', { class: 'empty' }, 'None yet. Not every field has one, so skip this if it doesn’t apply.'),
        h('details', { class: 'add' }, h('summary', {}, 'Add a license or credential'), credentialForm(c, null))));
  };

  /* ---------- practice ---------- */

  V.practice = function () {
    const c = S.active();
    const all = c.modules.flatMap((m) => m.assignments.map((a) => ({ m, a })));
    const doneN = all.filter((x) => x.a.done).length;
    const chip = (key, label) => h('button', { class: 'chip', type: 'button', 'aria-pressed': String(ui.filter === key), onclick: () => { ui.filter = key; S.render(false); } }, label);
    const show = (x) => ui.filter === 'all' || (ui.filter === 'todo' ? !x.a.done : x.a.done);

    const groups = c.modules.map((m, i) => {
      const rows = m.assignments.filter((a) => show({ a }));
      if (!rows.length) return null;
      return h('section', { class: 'pgroup' },
        h('h3', {}, h('span', { class: 'num' }, pad(i)), ' ', m.title),
        h('ul', { class: 'items' }, rows.map((a) => h('li', { class: 'item' + (a.done ? ' is-done' : '') },
          checkbox(a.done, 'Mark completed: ' + a.text, (v) => { a.done = v; commit(); }),
          h('div', { class: 'item-body' },
            h('div', { class: 'item-title pre' }, a.text),
            h('div', { class: 'item-actions' }, h('a', { class: 'small', href: '#/curriculum/' + m.id }, 'Go to module →')))))));
    }).filter(Boolean);

    return h('div', { class: 'narrow' },
      h('p', { class: 'eyebrow' }, 'Apply'),
      h('h1', {}, 'Practice'),
      h('p', { class: 'lede muted' }, all.length ? doneN + ' of ' + plural(all.length, 'assignment') + ' done. Do the work, then check it off.' : 'Your assignments from every module appear here.'),
      all.length ? h('div', { class: 'chips', role: 'group', 'aria-label': 'Filter assignments' }, chip('all', 'All'), chip('todo', 'To do'), chip('done', 'Done')) : null,
      !all.length
        ? h('p', { class: 'empty' }, 'No assignments yet. Add practical tasks inside a module in ', h('a', { href: '#/curriculum' }, 'Curriculum'), '.')
        : groups.length ? groups : h('p', { class: 'empty' }, ui.filter === 'todo' ? 'Nothing left to do. Every assignment is complete.' : 'Nothing completed yet.'));
  };

  /* ---------- my work / proof of practice ---------- */

  V.work = function () {
    const c = S.active(), w = c.work;
    const earned = c.credentials.filter((k) => k.status === 'earned');
    return h('div', { class: 'narrow' },
      h('p', { class: 'eyebrow' }, 'Demonstrate'),
      h('h1', {}, 'My Work'),
      h('p', { class: 'lede muted' }, 'Proof of practice: the tangible thing you made, and what it taught you.'),
      h('div', { class: 'brief-card' },
        h('p', { class: 'eyebrow' }, 'Intended deliverable · ' + c.title),
        h('p', { class: 'deliverable' }, c.deliverable)),
      h('form', { class: 'final-card' + (w.status === 'completed' ? ' complete' : ''), onsubmit: (e) => {
        e.preventDefault(); const f = new FormData(e.target), u = S.cleanUrl(f.get('url'));
        if (u === null) return toast(BAD_LINK);
        Object.assign(w, { status: f.get('status'), description: f.get('description').trim(), reflection: f.get('reflection').trim(), url: u });
        commit(); toast('Saved.');
      } },
        w.status === 'completed' ? badge('Completed', 'solid') : null,
        select('Status', 'status', S.WORK_STATUS, w.status),
        field('What you made', 'description', { multiline: true, rows: 7, value: w.description, hint: 'Describe the finished work: what it is, who it is for, how it came together.' }),
        field('Reflection', 'reflection', { multiline: true, rows: 7, value: w.reflection, hint: 'What did you learn, what was hard, and what would you do differently?' }),
        field('Link to the work (optional)', 'url', { value: w.url, placeholder: 'https://', hint: 'A published piece, portfolio page, or shared document.' }),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn', type: 'submit' }, 'Save my work'),
          w.url ? h('a', { class: 'btn ghost', href: w.url, target: '_blank', rel: 'noopener noreferrer' }, 'Open linked work') : null)),
      h('section', {},
        h('div', { class: 'section-head' }, h('h2', {}, 'Credentials earned')),
        earned.length
          ? h('ul', { class: 'items' }, earned.map((k) => h('li', { class: 'item' }, h('div', { class: 'item-body' },
              h('div', { class: 'item-title' }, k.url ? h('a', { href: k.url, target: '_blank', rel: 'noopener noreferrer' }, k.name) : k.name),
              k.issuer ? h('div', { class: 'item-note' }, k.issuer) : null))))
          : h('p', { class: 'empty' }, 'No credentials marked earned yet. Track optional licenses and certifications at the end of your ', h('a', { href: '#/curriculum' }, 'Curriculum'), '.')));
  };

  /* ---------- data & backup ---------- */

  function exportData() {
    const blob = new Blob([S.exportText()], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: 'sovereign-backup-' + new Date().toISOString().slice(0, 10) + '.json' });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Backup downloaded.');
  }

  function importFail(text) { ui.dataMsg = { type: 'error', text }; S.render(false); }

  function pickImport() {
    const input = h('input', { type: 'file', accept: 'application/json,.json', onchange: () => {
      const file = input.files[0];
      if (!file) return;
      if (file.size > S.MAX_IMPORT_BYTES) return importFail('That file is too large to be a Sovereign backup.');
      const reader = new FileReader();
      reader.onerror = () => importFail('That file could not be read.');
      reader.onload = () => {
        let next;
        try { next = S.parseImport(reader.result); } catch (e) { return importFail(e.message); }
        const first = next.curricula[0];
        const what = first ? '“' + first.title + '”' + (next.curricula.length > 1 ? ' and ' + (next.curricula.length - 1) + ' more' : '') : 'an empty backup';
        const cur = S.active();
        if (cur && !confirm('Replace your current work (“' + cur.title + '”) with ' + what + ' from this backup? Your current work will be overwritten and cannot be recovered unless you exported it first.')) return;
        S.state = next; ui.open.clear(); ui.dataMsg = null; S.save(); go('#/'); toast('Backup imported.');
      };
      reader.readAsText(file);
    } });
    input.click();
  }
  V.pickImport = pickImport;

  V.data = function () {
    const c = S.active();
    return h('div', { class: 'narrow' },
      h('p', { class: 'eyebrow' }, 'Your data'),
      h('h1', {}, 'Data & Backup'),
      !S.storageOK ? banner('Your browser is blocking local storage, so nothing can be saved. Export a backup to keep your work.', 'error') : null,
      ui.dataMsg ? banner(ui.dataMsg.text, ui.dataMsg.type) : null,
      h('p', { class: 'lede' }, 'Sovereign has no accounts and no server. Your work is stored only in this browser on this device, and it does not sync to your other devices.'),
      h('p', { class: 'muted' }, 'Clearing your browser’s site data would erase it. To keep a copy or move to another device, export a backup file and import it there.'),
      h('section', {},
        h('div', { class: 'section-head' }, h('h2', {}, 'Backup')),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn', type: 'button', onclick: exportData }, 'Export backup'),
          h('button', { class: 'btn ghost', type: 'button', onclick: pickImport }, 'Import backup')),
        h('p', { class: 'small muted' }, 'Importing replaces your current work, and asks you to confirm first. Files are checked before anything is changed.')),
      h('section', {},
        h('div', { class: 'section-head' }, h('h2', {}, 'Remove data')),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn danger', type: 'button', onclick: () => {
            if (!confirm('Delete “' + c.title + '”, with all its modules, assignments, credentials, and your final-project record? This cannot be undone unless you exported a backup.')) return;
            S.state.curricula = S.state.curricula.filter((x) => x !== c); ui.open.clear(); S.save(); go('#/'); toast('Curriculum deleted.');
          } }, 'Delete this curriculum'),
          h('button', { class: 'btn danger', type: 'button', onclick: () => {
            if (!confirm('Clear ALL Sovereign data saved in this browser? This removes your curriculum and any leftover copies, and cannot be undone unless you exported a backup.')) return;
            S.clearAll(); go('#/'); toast('All saved data cleared.');
          } }, 'Clear all saved data'))));
  };
})(window.Sovereign = window.Sovereign || {});
