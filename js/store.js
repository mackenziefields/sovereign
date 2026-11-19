/* sovereign. — data layer: model, localStorage, validation, import/export, example. */
(function (S) {
  'use strict';

  const KEY = 'sovereign.v2';
  const OLD_KEY = 'sovereign.v1'; // first prototype; migrated, never deleted automatically
  const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

  S.WORK_STATUS = [['not-started', 'Not started'], ['in-progress', 'In progress'], ['completed', 'Completed']];
  S.CRED_STATUS = [['considering', 'Considering'], ['in-progress', 'In progress'], ['earned', 'Earned']];
  S.label = (list, v) => (list.find((x) => x[0] === v) || [, v])[1];

  S.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  S.storageOK = true;
  S.loadWarning = '';
  S.ui = { edit: null, filter: 'all', open: new Set(), dataMsg: null };

  // Returns a clean http(s) URL, '' for empty input, or null if invalid.
  S.cleanUrl = function (input) {
    const t = String(input || '').trim();
    if (!t) return '';
    try {
      const u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(t) ? t : 'https://' + t);
      return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null;
    } catch (e) { return null; }
  };

  /* ----- validation / normalisation (used for stored data AND imported files) ----- */

  const str = (v, max = 20000) => (typeof v === 'string' ? v.slice(0, max) : '');
  const arr = (v, max = 500) => (Array.isArray(v) ? v.slice(0, max) : []);
  const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
  const oneOf = (v, list, d) => (list.some((x) => x[0] === v) ? v : d);

  function normCurriculum(c) {
    c = obj(c);
    const seen = new Set();
    const id = (v) => { let x = str(v, 60); if (!x || seen.has(x)) x = S.uid(); seen.add(x); return x; };
    const url = (v) => S.cleanUrl(str(v, 2000)) || '';
    const w = obj(c.work);
    return {
      id: id(c.id),
      title: str(c.title, 200) || 'Untitled curriculum',
      objective: str(c.objective),
      deliverable: str(c.deliverable),
      modules: arr(c.modules).map((m) => {
        m = obj(m);
        return {
          id: id(m.id), title: str(m.title, 200) || 'Untitled module', summary: str(m.summary),
          resources: arr(m.resources).map((r) => { r = obj(r); return { id: id(r.id), title: str(r.title, 300) || 'Untitled resource', url: url(r.url), note: str(r.note), done: r.done === true }; }),
          assignments: arr(m.assignments).map((a) => { a = obj(a); return { id: id(a.id), text: str(a.text) || 'Untitled assignment', done: a.done === true }; }),
        };
      }),
      credentials: arr(c.credentials, 100).map((k) => {
        k = obj(k);
        return { id: id(k.id), name: str(k.name, 300) || 'Untitled credential', issuer: str(k.issuer, 300), url: url(k.url), note: str(k.note), status: oneOf(k.status, S.CRED_STATUS, 'considering') };
      }),
      work: { description: str(w.description), reflection: str(w.reflection), status: oneOf(w.status, S.WORK_STATUS, 'not-started'), url: url(w.url) },
    };
  }

  // Accepts v2 files ({curricula}) and v1 prototype files ({curriculum, modules, finalProject}).
  S.normalize = function (d) {
    d = obj(d);
    if (d.app && d.app !== 'sovereign') throw new Error('This file was not created by Sovereign.');
    let list;
    if (Array.isArray(d.curricula)) list = d.curricula;
    else if (Array.isArray(d.modules)) {
      const fp = obj(d.finalProject);
      list = d.curriculum ? [{
        title: obj(d.curriculum).title, objective: obj(d.curriculum).objective, deliverable: obj(d.curriculum).deliverable,
        modules: d.modules,
        work: { description: fp.description, url: fp.url, status: fp.done === true ? 'completed' : (fp.description ? 'in-progress' : 'not-started') },
      }] : [];
    } else throw new Error('This file doesn’t look like a Sovereign backup.');
    return { version: 2, curricula: list.slice(0, 20).map(normCurriculum) };
  };

  /* ----- storage ----- */

  S.state = { version: 2, curricula: [] };

  S.load = function () {
    let raw = null, fromOld = false;
    try {
      raw = localStorage.getItem(KEY);
      if (!raw) { raw = localStorage.getItem(OLD_KEY); fromOld = !!raw; }
    } catch (e) { S.storageOK = false; return; }
    if (!raw) return;
    try { S.state = S.normalize(JSON.parse(raw)); if (fromOld) S.save(); }
    catch (e) {
      try { localStorage.setItem(KEY + '.unreadable', raw); } catch (_) { /* ignore */ }
      S.loadWarning = 'Your saved data could not be read, so Sovereign started fresh. A copy of the unreadable data was kept in this browser.';
    }
  };

  S.save = function () {
    try { localStorage.setItem(KEY, JSON.stringify(S.state)); S.storageOK = true; }
    catch (e) { S.storageOK = false; }
  };

  S.clearAll = function () {
    try { [KEY, OLD_KEY, KEY + '.unreadable'].forEach((k) => localStorage.removeItem(k)); } catch (e) { /* ignore */ }
    S.state = { version: 2, curricula: [] };
    S.loadWarning = '';
    S.ui.open.clear();
  };

  /* ----- import / export ----- */

  S.exportText = () => JSON.stringify({ app: 'sovereign', exportedAt: new Date().toISOString(), ...S.state }, null, 2);

  // Throws an Error with a friendly message if the text is not a usable backup.
  S.parseImport = function (text) {
    let data;
    try { data = JSON.parse(text); } catch (e) { throw new Error('That file isn’t valid JSON, so it can’t be a Sovereign backup.'); }
    return S.normalize(data);
  };
  S.MAX_IMPORT_BYTES = MAX_IMPORT_BYTES;

  /* ----- curricula ----- */

  S.active = () => S.state.curricula[0] || null;

  S.newCurriculum = (f) => ({
    id: S.uid(), title: f.title, objective: f.objective, deliverable: f.deliverable,
    modules: [], credentials: [],
    work: { description: '', reflection: '', status: 'not-started', url: '' },
  });

  S.exampleCurriculum = function () {
    const R = (title, url, note) => ({ id: S.uid(), title, url: url || '', note: note || '', done: false });
    const A = (text) => ({ id: S.uid(), text, done: false });
    const M = (title, summary, resources, assignments) => ({ id: S.uid(), title, summary, resources, assignments });
    return {
      id: S.uid(),
      title: 'Independent Journalism',
      objective: 'Report, verify, and publish original stories independently, with sound ethics, legal awareness, and clear writing.',
      deliverable: 'A fully sourced, 1,500-word original investigative article, published online, with a source log and a short reflection on the process.',
      modules: [
        M('Foundations: purpose and ethics', 'What journalism is for, and the standards that make it credible.', [
          R('SPJ Code of Ethics', 'https://www.spj.org/ethicscode.asp', 'Note the four principles and how each applies to a one-person newsroom.'),
          R('The Elements of Journalism, Kovach and Rosenstiel', '', 'Book. Start with the chapters on truth and loyalty to citizens.'),
        ], [A('Write a one-page editorial charter: what you cover, for whom, and the standards you hold yourself to.')]),
        M('Finding stories and sourcing', 'Choosing a story worth telling, and finding the people and documents behind it.', [
          R('Verification Handbook', 'https://verificationhandbook.com', 'Free guide to verifying people, content and events.'),
          R('Story-Based Inquiry, UNESCO (Mark Lee Hunter)', '', 'Manual for investigative reporters. Search for the free PDF.'),
        ], [A('Build a source map for a local topic: list at least 10 people, documents, or datasets you could use.'), A('Pick a viral claim and trace it to its primary source. Record each step you took.')]),
        M('Public records and data', 'Using open-records laws to get information that is not volunteered.', [
          R('FOIA.gov: how to make a request', 'https://www.foia.gov', 'Federal process. Your state has its own open-records statute.'),
          R('MuckRock', 'https://www.muckrock.com', 'Browse public requests to see how others word them.'),
        ], [A('File one public-records request, federal or state, and keep a copy.'), A('Summarize the response (or denial) in 300 words, including what you would do next.')]),
        M('Reporting and interviewing', 'Getting reliable information from people, on the record and off.', [
          R('Press law guide for your state (Reporters Committee)', 'https://www.rcfp.org', 'Know your rights and risks around recording, access and defamation.'),
          R('Notes on interview technique', '', 'Add a reading or video of your choice: open questions, silence, follow-ups.'),
        ], [A('Conduct a 20-minute interview with a real source and transcribe it.'), A('Mark every claim in the transcript as on-record, background, or needs a second source.')]),
        M('Writing, editing, and publishing', 'Structure, self-editing, fact-checking, and putting your work in front of readers.', [
          R('On Writing Well, William Zinsser', '', 'Book. Read the sections on simplicity and clutter.'),
          R('A newsroom style guide (such as AP)', '', 'Choose one and apply it consistently.'),
        ], [A('Draft your 1,500-word article.'), A('Self-edit, then fact-check: link every factual claim to a source in your source log.'), A('Publish the piece on a platform you control and save the link.')]),
      ],
      credentials: [
        { id: S.uid(), name: 'Journalism training certificates', issuer: 'Poynter Institute (News University)', url: 'https://www.poynter.org', note: 'Optional. Check current course offerings and what each certificate involves before committing.', status: 'considering' },
      ],
      work: { description: '', reflection: '', status: 'not-started', url: '' },
    };
  };

  /* ----- progress ----- */

  S.modStats = function (m) {
    const rd = m.resources.filter((r) => r.done).length, ad = m.assignments.filter((a) => a.done).length;
    const total = m.resources.length + m.assignments.length;
    return { rd, ad, total, done: rd + ad, pct: total ? Math.round(((rd + ad) / total) * 100) : 0 };
  };

  S.stats = function (c) {
    let rl = 0, rd = 0, al = 0, ad = 0;
    c.modules.forEach((m) => {
      rl += m.resources.length; al += m.assignments.length;
      rd += m.resources.filter((r) => r.done).length;
      ad += m.assignments.filter((a) => a.done).length;
    });
    const wd = c.work.status === 'completed' ? 1 : 0;
    const total = rl + al + 1, done = rd + ad + wd;
    return { rl, rd, al, ad, wd, total, done, pct: Math.round((done / total) * 100) };
  };

  S.nextUp = function (c) {
    for (const m of c.modules) {
      const r = m.resources.find((x) => !x.done);
      if (r) return { kind: 'Learn', text: r.title, where: m.title, href: '#/curriculum/' + m.id };
      const a = m.assignments.find((x) => !x.done);
      if (a) return { kind: 'Apply', text: a.text, where: m.title, href: '#/curriculum/' + m.id };
    }
    if (c.work.status !== 'completed') return { kind: 'Demonstrate', text: 'Document your final project', where: '', href: '#/work' };
    return null;
  };
})(window.Sovereign = window.Sovereign || {});
