/* sovereign. — data layer: courses/modules/assignments, localStorage, validation, import/export, starter content. */
(function (S) {
  'use strict';

  const KEY = 'sovereign.v3';
  const OLD_KEYS = ['sovereign.v2', 'sovereign.v1']; // earlier versions; migrated, never deleted automatically
  S.MAX_IMPORT_BYTES = 2 * 1024 * 1024;

  S.COLORS = ['#7a1f2b', '#1f4e52', '#2b3a55', '#5a5a2a', '#4d2c4f', '#8a5a1c'];
  S.READING_KINDS = [['', 'Other'], ['article', 'Article'], ['book', 'Book'], ['video', 'Video'], ['course', 'Course'], ['tool', 'Tool'], ['document', 'Document'], ['podcast', 'Podcast']];
  S.ACCESS = [['unknown', 'Access unknown'], ['free', 'Free'], ['paid', 'Paid']];
  S.VERIFY = ['not-checked', 'reachable', 'unreachable', 'blocked', 'broken'];
  S.WORK_STATUS = [['not-started', 'Not started'], ['in-progress', 'In progress'], ['completed', 'Completed']];
  S.CRED_STATUS = [['considering', 'Considering'], ['in-progress', 'In progress'], ['earned', 'Earned'], ['not-applicable', 'Not applicable']];
  S.SOURCE_TYPES = [['', ''], ['university', 'University'], ['government', 'Government'], ['open', 'Open / archive'], ['publisher', 'Publisher'], ['web', 'Web']];
  S.label = (list, v) => (list.find((x) => x[0] === v) || [, v])[1];

  S.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  S.storageOK = true;
  S.loadWarning = '';
  S.ui = { edit: null, tab: 'next', cal: '', open: new Set(), dataMsg: null };
  S.state = { version: 3, setup: false, courses: [], name: '' };

  /* ----- small helpers ----- */

  // Returns a clean http(s) URL, '' for empty input, or null if invalid.
  S.cleanUrl = function (input) {
    const t = String(input || '').trim();
    if (!t) return '';
    try {
      const u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(t) ? t : 'https://' + t);
      return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null;
    } catch (e) { return null; }
  };

  const pad2 = (n) => String(n).padStart(2, '0');
  S.todayISO = () => { const d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); };
  S.validDate = function (s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return '';
    const d = new Date(s + 'T00:00:00');
    return !isNaN(d) && pad2(d.getMonth() + 1) === s.slice(5, 7) ? s : '';
  };
  S.fmtDate = function (s) {
    const d = new Date(s + 'T00:00:00');
    const opts = { month: 'short', day: 'numeric' };
    if (s.slice(0, 4) !== String(new Date().getFullYear())) opts.year = 'numeric';
    return d.toLocaleDateString(undefined, opts);
  };

  const str = (v, max = 20000) => (typeof v === 'string' ? v.slice(0, max) : '');
  const arr = (v, max = 500) => (Array.isArray(v) ? v.slice(0, max) : []);
  const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
  const oneOf = (v, list, d) => (list.some((x) => x[0] === v) ? v : d);
  const strs = (v, n, max) => arr(v, n).map((x) => str(x, max).trim()).filter(Boolean);
  const num = (v) => { const n = typeof v === 'number' ? v : parseFloat(v); return Number.isFinite(n) && n >= 0 && n <= 1e6 ? n : null; };

  /* ----- validation / normalisation (used for stored data AND imported files) ----- */

  // Readings keep the original fields; AI-found ones add provenance. Verification (did a check run?) is stored
  // separately from relevance (an AI opinion about fit), and neither is ever shown as human review.
  function normReading(r, id, url) {
    const v = obj(r.verification);
    const out = { id: id(r.id), title: str(r.title, 300) || 'Untitled reading', url: url(r.url), note: str(r.note), done: r.done === true };
    if (r.source === 'ai' || r.source === 'placeholder') {
      out.source = r.source;
      out.kind = oneOf(r.kind, S.READING_KINDS, '');
      out.creator = str(r.creator, 300);
      out.access = oneOf(r.access, S.ACCESS, 'unknown');
      out.sourceType = oneOf(r.sourceType, S.SOURCE_TYPES, '');
      out.derivedFrom = str(r.derivedFrom, 300);
      out.derivedUrl = url(r.derivedUrl);
      out.relevance = str(r.relevance, 1000);
      out.verification = {
        status: S.VERIFY.includes(v.status) ? v.status : 'not-checked',
        checkedAt: str(v.checkedAt, 40), pageTitle: str(v.pageTitle, 300),
        titleMatch: v.titleMatch === true ? true : v.titleMatch === false ? false : null,
        finalUrl: url(v.finalUrl), detail: str(v.detail, 300),
      };
      if (r.source === 'placeholder') out.url = '';
    }
    return out;
  }

  // Validate one reading object on its own (used when AI-found materials are added to an existing module).
  S.makeReading = (r) => normReading(obj(r), (v) => str(v, 60) || S.uid(), (v) => S.cleanUrl(str(v, 2000)) || '');

  // A syllabus from another course, kept apart from readings. The AI can later source its assigned readings into the module.
  function normSyllabus(y, id, url) {
    y = obj(y); const v = obj(y.verification);
    return {
      id: id(y.id), title: str(y.title, 300) || 'Untitled syllabus', url: url(y.url), note: str(y.note, 300), source: y.source === 'ai' ? 'ai' : 'user',
      sourceType: oneOf(y.sourceType, S.SOURCE_TYPES, ''),
      verification: { status: S.VERIFY.includes(v.status) ? v.status : 'not-checked', checkedAt: str(v.checkedAt, 40), pageTitle: str(v.pageTitle, 300), titleMatch: v.titleMatch === true ? true : v.titleMatch === false ? false : null, finalUrl: url(v.finalUrl), detail: str(v.detail, 300) },
      sourcedAt: str(y.sourcedAt, 40), sourcedCount: num(y.sourcedCount) || 0,
    };
  }
  S.makeSyllabus = (y) => normSyllabus(y, (v) => str(v, 60) || S.uid(), (v) => S.cleanUrl(str(v, 2000)) || '');

  // Feedback from an AI review of submitted work. The score is an automated assessment, not a human grade.
  function normFeedback(f) {
    f = obj(f);
    if (!f.at && !f.summary) return null;
    return {
      summary: str(f.summary, 3000), strengths: strs(f.strengths, 8, 600), improvements: strs(f.improvements, 8, 800), nextSteps: strs(f.nextSteps, 8, 600),
      criteria: arr(f.criteria, 10).map((k) => { k = obj(k); return { name: str(k.name, 120) || 'Criterion', max: num(k.max) || 0, score: num(k.score) || 0, comment: str(k.comment, 800) }; }),
      score: num(f.score) || 0, max: num(f.max) || 0, model: str(f.model, 60), at: str(f.at, 40), cost: num(f.cost) || 0,
    };
  }
  // One submission: typed text and/or a file. The file itself lives in IndexedDB (device only); only its details are kept here.
  function normSub(x) {
    x = obj(x);
    if (!x.at) return null;
    return { text: str(x.text, 30000), fileId: str(x.fileId, 60), fileName: str(x.fileName, 200), fileType: str(x.fileType, 100), fileSize: num(x.fileSize) || 0, at: str(x.at, 40), late: x.late === true, feedback: normFeedback(x.feedback) };
  }
  function normWork(w) {
    w = obj(w);
    const first = normSub(w.first), final = normSub(w.final);
    if (!first && !final) return null;
    const phase = final ? 'final' : 'reviewed';
    return { phase, deadline: str(w.deadline, 40), first: final ? null : first, final };
  }
  function normRubric(r) {
    return arr(r, 10).map((k) => { k = obj(k); return { name: str(k.name, 120), max: num(k.max) || 0 }; }).filter((k) => k.name && k.max > 0);
  }

  function normAI(a) {
    a = obj(a);
    if (a.generated !== true) return null;
    const b = obj(a.brief);
    return {
      generated: true, createdAt: str(a.createdAt, 40), status: a.status === 'partial' ? 'partial' : 'complete',
      note: str(a.note, 500),
      brief: { topic: str(b.topic, 200), level: str(b.level, 40), goal: str(b.goal, 60), goalText: str(b.goalText, 300), hours: num(b.hours), weeks: num(b.weeks), extra: str(b.extra, 600) },
      usage: arr(a.usage, 200).map((u) => { u = obj(u); return { step: str(u.step, 40), model: str(u.model, 60), inTok: num(u.inTok) || 0, outTok: num(u.outTok) || 0, searches: num(u.searches) || 0, cost: num(u.cost) || 0, at: str(u.at, 40) }; }),
    };
  }

  function normCourse(c, i) {
    c = obj(c);
    const seen = new Set();
    const id = (v) => { let x = str(v, 60); if (!x || seen.has(x)) x = S.uid(); seen.add(x); return x; };
    const url = (v) => S.cleanUrl(str(v, 2000)) || '';
    const w = obj(c.work);
    return {
      id: id(c.id),
      code: str(c.code, 20).trim() || 'COURSE',
      title: str(c.title, 200) || 'Untitled course',
      description: str(c.description),
      objective: str(c.objective),
      deliverable: str(c.deliverable),
      syllabus: str(c.syllabus),
      outcomes: strs(c.outcomes, 12, 400), duration: str(c.duration, 80), pathway: str(c.pathway, 300),
      licensureNote: str(c.licensureNote, 1000), ai: normAI(c.ai), startDate: S.validDate(str(c.startDate, 10)),
      color: Number.isInteger(c.color) && c.color >= 0 && c.color < S.COLORS.length ? c.color : (i || 0) % S.COLORS.length,
      announcements: arr(c.announcements, 200).map((a) => { a = obj(a); return { id: id(a.id), title: str(a.title, 300) || 'Untitled announcement', body: str(a.body), date: S.validDate(str(a.date, 10)) || S.todayISO() }; }),
      modules: arr(c.modules, 100).map((m) => {
        m = obj(m);
        return {
          id: id(m.id), title: str(m.title, 200) || 'Untitled module', overview: str(m.overview),
          keyIdeas: str(m.keyIdeas), reflection: str(m.reflection), complete: m.complete === true,
          syllabi: arr(m.syllabi, 10).map((y) => normSyllabus(y, id, url)),
          objectives: strs(m.objectives, 12, 400), selfCheck: strs(m.selfCheck, 12, 400), duration: str(m.duration, 60),
          origin: m.origin === 'ai' ? 'ai' : 'user', edited: m.edited === true,
          readings: arr(m.readings).map((r) => { r = obj(r); return normReading(r, id, url); }),
          extras: arr(m.extras, 50).map((x) => { x = obj(x); return { id: id(x.id), title: str(x.title, 200) || 'Untitled section', body: str(x.body) }; }),
          assignments: arr(m.assignments).map((a) => {
            a = obj(a);
            return { id: id(a.id), title: str(a.title, 300) || 'Untitled assignment', description: str(a.description), due: S.validDate(str(a.due, 10)), points: num(a.points), score: num(a.score), done: a.done === true, kind: ['learn', 'apply', 'demonstrate'].includes(a.kind) ? a.kind : '', origin: a.origin === 'ai' ? 'ai' : 'user', locked: a.locked === true && !!S.validDate(str(a.due, 10)), rubric: normRubric(a.rubric), work: normWork(a.work),
              purpose: str(a.purpose, 2000), steps: strs(a.steps, 12, 500), submit: str(a.submit, 1000), criteria: strs(a.criteria, 8, 300), estimate: str(a.estimate, 60) };
          }),
        };
      }),
      credentials: arr(c.credentials, 100).map((k) => {
        k = obj(k);
        return { id: id(k.id), name: str(k.name, 300) || 'Untitled credential', issuer: str(k.issuer, 300), url: url(k.url), note: str(k.note), status: oneOf(k.status, S.CRED_STATUS, 'considering'), requirement: k.requirement === 'required' || k.requirement === 'suggested' ? k.requirement : '', origin: k.origin === 'ai' ? 'ai' : 'user' };
      }),
      work: { title: str(w.title, 200), criteria: strs(w.criteria, 12, 400), description: str(w.description), reflection: str(w.reflection), status: oneOf(w.status, S.WORK_STATUS, 'not-started'), url: url(w.url) },
    };
  }

  // Convert a v1/v2 "curriculum" into the v3 course shape (before normCourse cleans it).
  function fromV2(c) {
    c = obj(c);
    const words = str(c.title, 200).split(/\s+/).filter(Boolean);
    const initials = (words.length > 1 ? words.slice(0, 3).map((w) => w[0]).join('') : str(c.title, 4)).toUpperCase().replace(/[^A-Z0-9]/g, '');
    return {
      id: c.id, code: (initials || 'COURSE') + ' 101', title: c.title, description: c.objective, objective: c.objective, deliverable: c.deliverable,
      modules: arr(c.modules).map((m) => {
        m = obj(m);
        return {
          id: m.id, title: m.title, overview: m.summary, readings: arr(m.resources),
          assignments: arr(m.assignments).map((a) => {
            a = obj(a);
            const t = str(a.text).trim(), first = t.split('\n')[0];
            return { id: a.id, title: first.length > 90 ? first.slice(0, 87) + '…' : first, description: t.length > first.length || first.length > 90 ? t : '', done: a.done };
          }),
        };
      }),
      credentials: c.credentials, work: c.work,
    };
  }

  // Accepts v3 files ({courses}), v2 files ({curricula}) and v1 prototype files ({curriculum, modules, finalProject}).
  S.normalize = function (d) {
    d = obj(d);
    if (d.app && d.app !== 'sovereign') throw new Error('This file was not created by Sovereign.');
    let list;
    if (Array.isArray(d.courses)) list = d.courses;
    else if (Array.isArray(d.curricula)) list = d.curricula.map(fromV2);
    else if (Array.isArray(d.modules)) {
      const fp = obj(d.finalProject);
      list = d.curriculum ? [fromV2({
        ...obj(d.curriculum), modules: d.modules,
        work: { description: fp.description, url: fp.url, status: fp.done === true ? 'completed' : (fp.description ? 'in-progress' : 'not-started') },
      })] : [];
    } else throw new Error('This file doesn’t look like a Sovereign backup.');
    const courses = list.slice(0, 30).map(normCourse);
    return { version: 3, setup: courses.length > 0 || d.setup === true, courses, name: str(d.name, 60).trim() };
  };

  /* ----- storage ----- */

  S.load = function () {
    let raw = null, old = false;
    try {
      raw = localStorage.getItem(KEY);
      for (let i = 0; !raw && i < OLD_KEYS.length; i++) { raw = localStorage.getItem(OLD_KEYS[i]); old = !!raw; }
    } catch (e) { S.storageOK = false; return; }
    if (!raw) return;
    try { S.state = S.normalize(JSON.parse(raw)); if (old) S.save(); }
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
    try { [KEY, ...OLD_KEYS, KEY + '.unreadable'].forEach((k) => localStorage.removeItem(k)); } catch (e) { /* ignore */ }
    S.state = { version: 3, setup: false, courses: [], name: '' };
    S.loadWarning = '';
    S.ui.open.clear();
  };

  S.exportText = () => JSON.stringify({ app: 'sovereign', exportedAt: new Date().toISOString(), ...S.state }, null, 2);

  S.parseImport = function (text) {
    let data;
    try { data = JSON.parse(text); } catch (e) { throw new Error('That file isn’t valid JSON, so it can’t be a Sovereign backup.'); }
    return S.normalize(data);
  };

  /* ----- lookups ----- */

  S.course = (id) => S.state.courses.find((c) => c.id === id) || null;
  S.allModules = () => S.state.courses.flatMap((c) => c.modules.map((m) => ({ c, m })));
  S.allAssignments = () => S.allModules().flatMap(({ c, m }) => m.assignments.map((a) => ({ c, m, a })));

  // Unfinished assignments, soonest due date first; undated ones last.
  S.upNext = function () {
    return S.allAssignments().filter((x) => !x.a.done).map((x, i) => ({ ...x, i }))
      .sort((p, q) => (p.a.due && q.a.due ? p.a.due.localeCompare(q.a.due) : p.a.due ? -1 : q.a.due ? 1 : 0) || p.i - q.i);
  };

  /* ----- stats ----- */

  S.moduleStats = function (m) {
    const items = m.readings.length + m.assignments.length;
    const done = m.readings.filter((r) => r.done).length + m.assignments.filter((a) => a.done).length;
    return { items, done, pct: m.complete ? 100 : items ? Math.round((done / items) * 100) : 0 };
  };
  S.courseStats = function (c) {
    const mods = c.modules.length, done = c.modules.filter((m) => m.complete).length;
    return { mods, done, pct: mods ? Math.round((done / mods) * 100) : 0 };
  };
  S.pctOf = (a) => (a.points > 0 && a.score != null ? Math.round((a.score / a.points) * 1000) / 10 : null);
  // Letter equivalent of a percentage (a plain, common scale; shown next to the points, never instead of them).
  S.letter = function (pct) {
    if (pct == null) return '';
    const t = [[93, 'A'], [90, 'A−'], [87, 'B+'], [83, 'B'], [80, 'B−'], [77, 'C+'], [73, 'C'], [70, 'C−'], [67, 'D+'], [63, 'D'], [60, 'D−']];
    return (t.find((x) => pct >= x[0]) || [0, 'F'])[1];
  };

  /* ----- submissions: review rounds, the 72-hour window, and finalizing ----- */

  S.REVIEW_HOURS = 72;
  S.dueEnd = (a) => (a.due ? new Date(a.due + 'T23:59:59').getTime() : null); // due at the end of the due day, local time
  S.isLate = (a, atMs) => { const d = S.dueEnd(a); return d != null && atMs > d; };
  S.hoursLeft = (a, nowMs) => (a.work && a.work.deadline ? (new Date(a.work.deadline).getTime() - (nowMs || Date.now())) / 3600000 : null);

  // Makes this submission the final one: records the points on the Grades page and removes the first round's file and feedback.
  S.finalizeWork = function (a, sub) {
    const old = a.work && a.work.first, keep = sub || (a.work && a.work.first);
    if (!keep || !keep.feedback) return false;
    a.work = { phase: 'final', deadline: a.work ? a.work.deadline : '', first: null, final: keep };
    const fb = keep.feedback; // if the points were changed after the review, keep the same percentage
    a.score = a.points > 0 && fb.max > 0 ? Math.round((fb.score / fb.max) * a.points * 10) / 10 : fb.score;
    a.done = true;
    if (old && old !== keep && old.fileId && S.files) S.files.del(old.fileId);
    return true;
  };
  // Anything past its 72 hours is finalized from its first review. Safe to call often.
  S.finalizeExpired = function (nowMs) {
    let n = 0;
    S.allAssignments().forEach(({ a }) => {
      if (a.work && a.work.phase === 'reviewed' && a.work.deadline && new Date(a.work.deadline).getTime() <= (nowMs || Date.now())) { if (S.finalizeWork(a)) n++; }
    });
    if (n) S.save();
    return n;
  };

  S.grade = function (c) {
    let earned = 0, possible = 0, n = 0;
    c.modules.forEach((m) => m.assignments.forEach((a) => {
      if (a.points > 0 && a.score != null) { earned += a.score; possible += a.points; n++; }
    }));
    return n ? { n, earned, possible, pct: Math.round((earned / possible) * 1000) / 10 } : null;
  };

  /* ----- builders and starter content ----- */

  const R = (title, url, note) => ({ id: S.uid(), title, url: url || '', note: note || '', done: false });
  const A = (title, description, o) => ({ id: S.uid(), title, description: description || '', due: '', points: null, score: null, done: false, kind: '', origin: 'user', locked: false, rubric: [], work: null, purpose: '', steps: [], submit: '', criteria: [], estimate: '', ...o });
  const M = (title, o) => ({ id: S.uid(), title, overview: '', readings: [], keyIdeas: '', reflection: '', extras: [], assignments: [], complete: false, syllabi: [], objectives: [], selfCheck: [], duration: '', origin: 'user', edited: false, ...o });
  const C = (code, title, color, description, modules, o) => ({
    id: S.uid(), code, title, color, description, objective: '', deliverable: '', syllabus: '', outcomes: [], duration: '', pathway: '', licensureNote: '', ai: null, startDate: '', announcements: [], modules, credentials: [],
    work: { title: '', criteria: [], description: '', reflection: '', status: 'not-started', url: '' }, ...o,
  });

  // Short unique course code from a title, e.g. "Entrepreneurship" -> "ENTR 101".
  S.codeFor = function (title) {
    const w = String(title || '').toUpperCase().replace(/[^A-Z0-9 ]/g, '').split(/\s+/).filter(Boolean);
    const base = w.length > 1 ? w.slice(0, 3).map((x) => x[0]).join('') : (w[0] || 'COURSE').slice(0, 4);
    return base + ' 101';
  };
  S.newModule = (title) => M(title);
  S.newCourse = (f) => C(f.code, f.title, S.state.courses.length % S.COLORS.length, f.description, [M('Foundations')], { objective: f.objective || '', deliverable: f.deliverable || '' });

  S.starterCourses = () => [
    C('ANTH 101', 'Cultural Anthropology', 5,
      'An introduction to how culture shapes human life, and how anthropologists study and write about difference.',
      [M('Critical Visions', { overview: 'Describe what this module covers and why it matters to your study of culture.' })]),
    C('FIN 101', 'Financial Freedom', 3,
      'Build the knowledge and habits to create, protect, and grow your own financial independence.',
      [M('Asset Creation', { overview: 'How assets are created, and the first moves toward owning them.' }),
        M('Asset Maintenance', { overview: 'How to protect, maintain, and grow what you have built.' })]),
    C('ENT 201', 'Entrepreneurship', 2,
      'Learn to turn ideas into viable ventures, from first customer conversations to a working plan.',
      [M('Foundations', { overview: 'Rename this module and describe what it covers.' })]),
    C('WGS 101', 'Feminism', 4,
      'A study of feminist thought, history, and practice.',
      [M('Foundations', { overview: 'Rename this module and describe what it covers.' })]),
    C('LIT 101', 'Literature & Writing', 1,
      'Read closely, write in response, and build a record of your thinking. Each module is one book or theme.',
      [M('First Book or Theme', {
        overview: 'Name the book or theme this module is built around, and why you chose it.',
        readings: [R('The reading', '', 'Replace with the title and author, plus the pages or chapters for this module.')],
        extras: [{ id: S.uid(), title: 'Discussion questions', body: '' }, { id: S.uid(), title: 'Favorite passages', body: '' }],
        assignments: [A('Writing Exercise 1: Response to the Reading', 'Write a short response to this module’s reading: what struck you, what you question, and a passage that supports your view.')],
      })]),
  ];

  S.exampleCourse = () => C('JOUR 101', 'Independent Journalism', 0,
    'Report, verify, and publish original stories independently, with sound ethics, legal awareness, and clear writing.', [
      M('Foundations: purpose and ethics', {
        overview: 'What journalism is for, and the standards that make it credible.',
        readings: [R('SPJ Code of Ethics', 'https://www.spj.org/ethicscode.asp', 'Note the four principles and how each applies to a one-person newsroom.'),
          R('The Elements of Journalism, Kovach and Rosenstiel', '', 'Book. Start with the chapters on truth and loyalty to citizens.')],
        assignments: [A('Write an editorial charter', 'One page: what you cover, for whom, and the standards you hold yourself to.')],
      }),
      M('Finding stories and sourcing', {
        overview: 'Choosing a story worth telling, and finding the people and documents behind it.',
        readings: [R('Verification Handbook', 'https://verificationhandbook.com', 'Free guide to verifying people, content and events.'),
          R('Story-Based Inquiry, UNESCO (Mark Lee Hunter)', '', 'Manual for investigative reporters. Search for the free PDF.')],
        assignments: [A('Build a source map', 'For a local topic, list at least 10 people, documents, or datasets you could use.'),
          A('Trace a viral claim', 'Pick a viral claim and trace it to its primary source. Record each step you took.')],
      }),
      M('Public records and data', {
        overview: 'Using open-records laws to get information that is not volunteered.',
        readings: [R('FOIA.gov: how to make a request', 'https://www.foia.gov', 'Federal process. Your state has its own open-records statute.'),
          R('MuckRock', 'https://www.muckrock.com', 'Browse public requests to see how others word them.')],
        assignments: [A('File a public-records request', 'Federal or state. Keep a copy.'),
          A('Summarize the response', 'In 300 words, summarize the response (or denial) and what you would do next.')],
      }),
      M('Reporting and interviewing', {
        overview: 'Getting reliable information from people, on the record and off.',
        readings: [R('Press law guide for your state (Reporters Committee)', 'https://www.rcfp.org', 'Know your rights and risks around recording, access and defamation.')],
        assignments: [A('Conduct and transcribe an interview', 'A 20-minute interview with a real source.'),
          A('Mark every claim', 'In the transcript, label each claim on-record, background, or needs a second source.')],
      }),
      M('Writing, editing, and publishing', {
        overview: 'Structure, self-editing, fact-checking, and putting your work in front of readers.',
        readings: [R('On Writing Well, William Zinsser', '', 'Book. Read the sections on simplicity and clutter.'),
          R('A newsroom style guide (such as AP)', '', 'Choose one and apply it consistently.')],
        assignments: [A('Draft your 1,500-word article'),
          A('Self-edit and fact-check', 'Link every factual claim to a source in your source log.'),
          A('Publish the piece', 'Publish on a platform you control and save the link.')],
      }),
    ], {
      objective: 'Report, verify, and publish original stories independently.',
      deliverable: 'A fully sourced, 1,500-word original investigative article, published online, with a source log and a short reflection on the process.',
      credentials: [{ id: S.uid(), name: 'Journalism training certificates', issuer: 'Poynter Institute (News University)', url: 'https://www.poynter.org', note: 'Optional. Check current course offerings and what each certificate involves before committing.', status: 'considering' }],
    });
})(window.Sovereign = window.Sovereign || {});
