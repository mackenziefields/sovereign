/* sovereign. — talks to the Worker (never to Anthropic directly) and turns its answers into a saved course.
   Only what the person typed in the "Build with AI" form (plus module titles when finding materials) is ever sent.
   No documents, no other courses, no progress data. */
(function (S) {
  'use strict';
  const KEY = 'sovereign.ai'; // this browser only; not part of exports or backups
  const ai = (S.ai = {});

  class AIError extends Error { constructor(code, message) { super(message); this.code = code; } }
  ai.Error = AIError;

  /* ----- settings (Worker address + access code), kept in this browser only ----- */

  function readSaved() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  ai.cleanBase = function (u) {
    const t = String(u || '').trim().replace(/\/+$/, '');
    if (!t) return '';
    try {
      const x = new URL(t);
      const local = ['localhost', '127.0.0.1', '[::1]'].includes(x.hostname);
      if (x.protocol === 'https:' || (x.protocol === 'http:' && local)) return x.origin + x.pathname.replace(/\/+$/, '');
    } catch (e) { /* invalid */ }
    return null;
  };
  ai.settings = function () {
    const s = readSaved();
    const url = ai.cleanBase(s.url) || ai.cleanBase(S.config && S.config.aiUrl) || '';
    return { url, code: typeof s.code === 'string' ? s.code : '' };
  };
  ai.saveSettings = function (o) {
    const s = readSaved();
    if ('url' in o) { if (o.url) s.url = o.url; else delete s.url; }
    if ('code' in o) { if (o.code) s.code = o.code; else delete s.code; }
    try { localStorage.setItem(KEY, JSON.stringify(s)); return true; } catch (e) { return false; }
  };
  ai.ready = () => { const s = ai.settings(); return !!(s.url && s.code); };

  /* ----- one request to the Worker (reads its line-by-line stream; "ping" lines keep it alive) ----- */

  const NO_SERVICE = 'The AI service isn’t set up in this app yet. Add its address and access code under AI settings.';

  ai.call = async function (path, body, opts) {
    opts = opts || {};
    const s = ai.settings();
    if (!s.url) throw new AIError('not_configured', NO_SERVICE);
    if (!s.code) throw new AIError('no_code', 'Enter your access code under AI settings first.');
    const ctl = new AbortController();
    let idle, timedOut = false;
    const bump = () => { clearTimeout(idle); idle = setTimeout(() => { timedOut = true; ctl.abort(); }, 70000); };
    if (opts.signal) opts.signal.addEventListener('abort', () => ctl.abort());
    bump();
    const fail = (e) => {
      if (opts.signal && opts.signal.aborted) return new AIError('cancelled', 'Cancelled.');
      if (timedOut) return new AIError('timeout', 'The AI service took too long to answer. Please try again.');
      return new AIError('network', 'Couldn’t reach the AI service. Check your connection and the service address, then try again.');
    };
    try {
      let res;
      try {
        res = await fetch(s.url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Access-Code': s.code }, body: JSON.stringify(body), signal: ctl.signal, cache: 'no-store' });
      } catch (e) { throw fail(e); }
      if (!res.ok) {
        let m = null; try { m = (await res.json()).error; } catch (e) { /* not JSON */ }
        throw new AIError((m && m.code) || 'http_' + res.status, (m && m.message) || 'The AI service returned an error (' + res.status + ').');
      }
      let result = null;
      const handle = (line) => {
        line = line.trim(); if (!line) return;
        let m; try { m = JSON.parse(line); } catch (e) { return; }
        if (m.t === 'error') throw new AIError(m.code || 'error', m.message || 'The AI service reported an error.');
        if (m.t === 'result') result = m;
      };
      try {
        if (res.body && res.body.getReader) {
          const reader = res.body.getReader(), dec = new TextDecoder();
          let buf = '';
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            bump(); buf += dec.decode(value, { stream: true });
            let i; while ((i = buf.indexOf('\n')) >= 0) { handle(buf.slice(0, i)); buf = buf.slice(i + 1); }
          }
          handle(buf);
        } else (await res.text()).split('\n').forEach(handle);
      } catch (e) { if (e instanceof AIError) throw e; throw fail(e); }
      if (!result) throw new AIError('no_result', 'The AI service stopped before finishing. Please try again.');
      return result;
    } finally { clearTimeout(idle); }
  };

  ai.health = async function () {
    const s = ai.settings();
    if (!s.url) throw new AIError('not_configured', NO_SERVICE);
    let res;
    try { res = await fetch(s.url + '/health', { cache: 'no-store' }); } catch (e) { throw new AIError('network', 'Couldn’t reach that address. Check it and try again.'); }
    if (!res.ok) throw new AIError('http_' + res.status, 'That address answered, but it doesn’t look like the Sovereign service.');
    try { return await res.json(); } catch (e) { throw new AIError('bad', 'That address answered, but it doesn’t look like the Sovereign service.'); }
  };

  /* ----- turning the Worker's answers into course data ----- */

  const now = () => new Date().toISOString();
  const usageRow = (u) => ({ step: u.step, model: u.model, inTok: u.inTok || 0, outTok: u.outTok || 0, searches: u.searches || 0, cost: u.cost || 0, at: now() });

  ai.totals = function (c) {
    const rows = (c.ai && c.ai.usage) || [];
    return rows.reduce((t, u) => ({ inTok: t.inTok + u.inTok, outTok: t.outTok + u.outTok, searches: t.searches + u.searches, cost: t.cost + u.cost, calls: t.calls + 1 }), { inTok: 0, outTok: 0, searches: 0, cost: 0, calls: 0 });
  };
  ai.money = (n) => '$' + (n < 0.01 && n > 0 ? n.toFixed(4) : n.toFixed(2));

  function readingFrom(r) {
    return { id: S.uid(), title: r.title, url: r.url, note: '', done: false, source: 'ai', kind: r.kind, creator: r.creator, access: r.access, sourceType: r.sourceType, derivedFrom: r.derivedFrom, derivedUrl: r.derivedUrl, relevance: r.relevance, verification: r.verification };
  }
  const placeholder = (mod, note) => ({ id: S.uid(), title: 'Source needed: ' + mod.title, url: '', note: note || 'No verifiable source was found. Add your own.', done: false, source: 'placeholder' });

  const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  ai.addDays = addDays;
  // Due dates follow the timeline chosen at the start: modules share the weeks evenly, and each module's assignments are spread across its slice.
  function dueFor(start, weeks, nMods, mi, ai_, nAs) {
    const total = Math.max(1, (weeks || 6) * 7), slice = total / Math.max(1, nMods);
    return addDays(start, Math.max(1, Math.round(slice * mi + (slice * (ai_ + 1)) / Math.max(1, nAs))));
  }

  function courseFromOutline(o, brief) {
    const fp = o.finalProject || {};
    const start = S.validDate(brief && brief.startDate) || S.todayISO();
    const raw = {
      id: S.uid(), code: S.codeFor(o.title), title: o.title, description: o.description, objective: o.pathway,
      deliverable: [fp.title, fp.description].filter(Boolean).join(': '), syllabus: o.syllabus, outcomes: o.outcomes, duration: o.duration, pathway: o.pathway,
      licensureNote: o.licensureNote, startDate: start, color: S.state.courses.length % S.COLORS.length, designTheme: S.randomTheme(),
      announcements: [{ id: S.uid(), title: 'Welcome' + (S.state.name ? ', ' + S.state.name : '') + ': ' + o.title, date: S.todayISO(), body: 'This course was drafted by AI from what you told it. Treat it as a first draft: rename, reorder, replace, or delete anything. Check every resource yourself, because links are checked by a program, not reviewed by a person.' }],
      credentials: (o.credentials || []).map((k) => ({ id: S.uid(), name: k.name, issuer: k.issuer, note: k.note, status: 'considering', requirement: k.requirement, origin: 'ai' })),
      modules: o.modules.map((m, mi) => ({
        id: S.uid(), title: m.title, overview: m.overview, keyIdeas: m.keyIdeas, reflection: m.reflection, objectives: m.objectives, selfCheck: m.selfCheck,
        duration: m.duration, origin: 'ai', edited: false, readings: [],
        assignments: m.assignments.map((a, ai_) => ({ id: S.uid(), title: a.title, description: a.description, kind: a.kind, points: a.points, realEvidence: a.realEvidence === true && a.kind !== 'learn', origin: 'ai', due: dueFor(start, brief && brief.weeks, o.modules.length, mi, ai_, m.assignments.length), locked: true })),
      })),
      work: { title: fp.title, criteria: fp.criteria },
      ai: { generated: true, createdAt: now(), status: 'partial', note: 'Course outline saved. Learning materials are still being found.', brief, usage: [] },
    };
    return S.normalize({ courses: [raw] }).courses[0];
  }

  // Finds 1-2 resources for one module. Adds them; never removes anything the person wrote. Throws AIError on failure.
  ai.findMaterials = async function (course, mod, opts) {
    const r = await ai.call('/resources', {
      topic: course.title, level: (course.ai && course.ai.brief && course.ai.brief.level) || '',
      module: { title: mod.title, overview: mod.overview, objectives: mod.objectives, searchQueries: (opts && opts.queries) || [] }, count: 2,
    }, opts);
    if (!S.state.courses.includes(course) || !course.modules.includes(mod)) throw new AIError('gone', 'That module was removed while searching.');
    mod.readings = mod.readings.filter((x) => x.source !== 'placeholder'); // an older "source needed" marker is replaced; nothing else is touched
    const have = new Set(mod.readings.map((x) => x.url || 'c:' + x.title.toLowerCase()).filter(Boolean));
    let added = 0;
    (r.resources || []).forEach((x) => { if (!have.has(x.url || 'c:' + x.title.toLowerCase())) { mod.readings.push(S.makeReading(readingFrom(x))); added++; } });
    const found = (r.resources || []).length; // 0 means the search found nothing verifiable; duplicates of existing links are not a failure
    let sylAdded = 0;
    (r.syllabi || []).forEach((x) => { if (!mod.syllabi.some((y) => y.url === x.url)) { mod.syllabi.push(S.makeSyllabus({ ...x, source: 'ai' })); sylAdded++; } });
    if (!found && !mod.readings.length && !mod.syllabi.length) mod.readings.push(S.makeReading(placeholder(mod, r.missingNote)));
    if (course.ai && course.ai.generated) course.ai.usage.push(usageRow(r.usage));
    S.save();
    return { added, missing: !found, syllabi: sylAdded };
  };

  // The person chose to "source" one syllabus: the AI opens it and adds the readings it assigns (each with its own link where one exists).
  ai.sourceSyllabus = async function (course, mod, syl, opts) {
    const r = await ai.call('/syllabus', {
      url: syl.url, topic: course.title, level: (course.ai && course.ai.brief && course.ai.brief.level) || '',
      module: { title: mod.title, overview: mod.overview, objectives: mod.objectives },
    }, opts || {});
    if (!S.state.courses.includes(course) || !course.modules.includes(mod) || !mod.syllabi.includes(syl)) throw new AIError('gone', 'That syllabus was removed while it was being read.');
    const have = new Set(mod.readings.map((x) => x.url || 'c:' + x.title.toLowerCase()));
    let added = 0;
    (r.resources || []).forEach((x) => {
      const key = x.url || 'c:' + x.title.toLowerCase();
      if (!have.has(key)) { have.add(key); mod.readings.push(S.makeReading(readingFrom({ ...x, derivedFrom: x.derivedFrom || syl.note || 'Syllabus', derivedUrl: syl.url }))); added++; }
    });
    syl.sourcedAt = now(); syl.sourcedCount = (syl.sourcedCount || 0) + added;
    if (course.ai && course.ai.generated) course.ai.usage.push(usageRow(r.usage));
    S.save();
    return { added, missing: !(r.resources || []).length };
  };

  /* ----- Syllabus sourcing (build 21): read, REVIEW, adopt, then optionally revise assignments. Nothing here changes a course by itself. ----- */

  // The newer features need Worker version 11; building courses and everything else keep working on older Workers.
  ai.requireVersion = async function (n, what) {
    let hl; try { hl = await ai.health(); } catch (e) { return; }
    if (!(hl && hl.version >= n)) throw new AIError('outdated', what + ' needs a newer AI service (version ' + n + '). Paste the latest worker.js into your Cloudflare Worker and deploy it. Everything else still works.');
  };
  const briefOf = (course, mod) => ({ topic: course.title, level: (course.ai && course.ai.brief && course.ai.brief.level) || '', module: { title: mod.title, overview: mod.overview, objectives: mod.objectives, keyIdeas: mod.keyIdeas } });
  const readingKey = (x) => x.url || 'c:' + x.title.toLowerCase();

  // Reads a syllabus from its link, or from text the person pasted (sent only after they agreed; the text is not kept anywhere in the app).
  // Returns { stage, kind, reason, items } for REVIEW: stage is not-accessible | no-readings | readings-found | verified | manual-review.
  ai.readSyllabus = async function (course, mod, syl, text, opts) {
    await ai.requireVersion(12, 'Reading a syllabus with these checks');
    const body = briefOf(course, mod);
    if (text) body.text = text; else body.url = syl.url;
    const r = await ai.call('/syllabus', body, opts || {});
    if (!S.state.courses.includes(course) || !course.modules.includes(mod)) throw new AIError('gone', 'That course changed while the syllabus was being read.');
    if (course.ai && course.ai.generated) course.ai.usage.push(usageRow(r.usage));
    const have = new Set(mod.readings.map(readingKey));
    S.save();
    return { stage: r.stage || (r.missing ? 'no-readings' : 'readings-found'), kind: r.kind || 'page', reason: r.reason || '', errorCode: r.errorCode || '', diag: r.diag || null, at: now(),
      items: (r.resources || []).map((x) => ({ ...x, dup: have.has(readingKey(x)) })) };
  };

  // Adds ONLY the readings the person ticked. Duplicates are skipped. Returns the readings added.
  ai.adoptReadings = function (course, mod, syl, items) {
    const have = new Set(mod.readings.map(readingKey)), added = [];
    items.forEach((x) => {
      if (have.has(readingKey(x))) return;
      have.add(readingKey(x));
      const rd = S.makeReading(readingFrom({ ...x, derivedFrom: x.derivedFrom || (syl && (syl.note || syl.title)) || 'Syllabus', derivedUrl: (syl && syl.url) || '' }));
      if (x.review === 'manual-review') rd.note = 'Check this against the syllabus: the AI read it from a document this service could not search.';
      mod.readings.push(rd); added.push(rd);
    });
    if (syl) { syl.sourcedAt = now(); syl.sourcedCount = (syl.sourcedCount || 0) + added.length; }
    S.save();
    return added;
  };

  // Asks for PROPOSED revisions of up to three assignments around newly adopted readings. Returns [{ a, rev }]; rev is null when the AI could not write one.
  ai.proposeRevisions = async function (course, mod, readings, assignments, opts) {
    await ai.requireVersion(11, 'Revising assignments');
    const body = briefOf(course, mod);
    body.newReadings = readings.map((x) => ({ title: x.title, creator: x.creator, note: x.relevance || x.note || '' }));
    body.assignments = assignments.map((a) => ({ title: a.title, kind: S.stageOf(a), description: a.description, materials: a.materials, realEvidence: a.realEvidence, steps: a.parts }));
    const r = await ai.call('/revise', body, opts || {});
    if (course.ai && course.ai.generated) course.ai.usage.push(usageRow(r.usage));
    S.save();
    return assignments.map((a, i) => ({ a, rev: (r.revisions || [])[i] || null }));
  };

  // Applies one approved revision. The earlier wording is kept on the assignment (restorable); points, rubric, submissions and grades are not touched.
  ai.applyRevision = function (a, rev, readings) {
    a.revisions = a.revisions || [];
    a.revisions.push({ at: now(), note: rev.changeNote || '', readings: readings.map((x) => x.title).slice(0, 5), before: { description: a.description, parts: JSON.parse(JSON.stringify(a.parts)), materials: a.materials } });
    if (a.revisions.length > 5) a.revisions.shift();
    a.description = rev.description; a.parts = rev.parts;
    if (S.stageOf(a) !== 'learn' && !a.realEvidence && rev.materials) a.materials = rev.materials;
    S.save();
  };
  ai.restoreRevision = function (a) {
    const v = a.revisions && a.revisions.pop(); if (!v) return false;
    a.description = v.before.description; a.parts = v.before.parts; a.materials = v.before.materials;
    S.save(); return true;
  };

  // Reviews one submission. Only call this after the person has agreed to send it. The work is passed along and not kept by the service.
  // payload: { text } or { file: { mime, base64 } }. Round 2 also sends what round 1 asked to change.
  // The criteria shown on the assignment page become the rubric (points split evenly) unless a rubric already exists.
  function rubricFor(a) {
    if (a.rubric && a.rubric.length) return a.rubric;
    const cr = (a.criteria || []).slice(0, 8), n = cr.length;
    if (!n || !(a.points > 0)) return [];
    const each = Math.floor((a.points / n) * 10) / 10;
    return cr.map((t, i) => ({ name: t.slice(0, 120), max: i === n - 1 ? Math.round((a.points - each * (n - 1)) * 10) / 10 : each }));
  }
  // Office hours: practice feedback on the person's own material, up to two rounds, never graded.
  ai.office = async function (course, mod, a, payload, round, material, opts) {
    const prior = a.office && a.office.rounds[0] && a.office.rounds[0].feedback;
    const r = await ai.call('/review', {
      mode: 'office', context: material,
      course: { title: course.title, level: (course.ai && course.ai.brief && course.ai.brief.level) || '' },
      assignment: { title: a.title, description: a.description },
      round: round === 2 ? 2 : 1, previousImprovements: round === 2 && prior ? prior.improvements : [], submission: payload,
    }, opts || {});
    if (!S.state.courses.includes(course) || !mod.assignments.includes(a)) throw new AIError('gone', 'That assignment was removed while it was being reviewed.');
    if (course.ai && course.ai.generated) course.ai.usage.push(usageRow(r.usage));
    return { ...r.feedback, cost: (r.usage && r.usage.cost) || 0 };
  };
  ai.review = async function (course, mod, a, payload, round, opts) {
    const first = a.work && a.work.first && a.work.first.feedback;
    const r = await ai.call('/review', {
      course: { title: course.title, level: (course.ai && course.ai.brief && course.ai.brief.level) || '' },
      assignment: { title: a.title, description: a.description, points: a.points },
      round: round === 2 ? 2 : 1, rubric: rubricFor(a), previousImprovements: round === 2 && first ? first.improvements : [],
      submission: payload,
    }, opts || {});
    if (!S.state.courses.includes(course) || !mod.assignments.includes(a)) throw new AIError('gone', 'That assignment was removed while it was being reviewed.');
    if (course.ai && course.ai.generated) course.ai.usage.push(usageRow(r.usage));
    return { ...r.feedback, cost: (r.usage && r.usage.cost) || 0 };
  };

  // Refuses to start AI work against an older copy of the Worker that doesn't have the newest features.
  ai.NEEDS_VERSION = 9;
  ai.requireCurrent = async function () {
    let hl = null;
    try { hl = await ai.health(); } catch (e) { return; } // unreachable: the real call will report it
    if (!(hl && hl.version >= ai.NEEDS_VERSION)) throw new AIError('outdated', 'The AI service is an older version than this app needs. Paste the latest worker.js into your Cloudflare Worker (Edit code, replace everything, Deploy), then try again.');
  };

  // Writes the full one-stop page for assignments in one module: overview, scenario, steps, format, weighted grading. Never touches work already submitted.
  ai.writeDetails = async function (course, mod, targets, opts) {
    const list = targets.filter((a) => a.points > 0 && !a.work && mod.assignments.includes(a)); // work already submitted is never rewritten
    if (!list.length) throw new AIError('bad_input', 'Assignments need points, and ones you have already submitted work for are never rewritten.');
    await ai.requireCurrent();
    const r = await ai.call('/details', {
      topic: course.title, level: (course.ai && course.ai.brief && course.ai.brief.level) || '',
      module: { title: mod.title, overview: mod.overview, objectives: mod.objectives, keyIdeas: mod.keyIdeas },
      readingsMissing: !mod.readings.some((x) => x.source !== 'placeholder'),
      goal: [(course.ai && course.ai.brief && course.ai.brief.goal) || '', (course.ai && course.ai.brief && course.ai.brief.goalText) || ''].filter(Boolean).join(': '),
      assignments: list.map((a) => ({ title: a.title, description: a.description, kind: a.kind, points: a.points, realEvidence: a.realEvidence === true })),
      readings: mod.readings.filter((x) => x.source !== 'placeholder').slice(0, 6).map((x) => ({ title: x.title })),
    }, opts || {});
    if (!S.state.courses.includes(course) || !course.modules.includes(mod)) throw new AIError('gone', 'That module was removed while its assignments were being written.');
    let done = 0;
    (r.details || []).forEach((d, i) => {
      const a = list[i];
      if (!d || !a || !mod.assignments.includes(a)) return;
      if (a.origin === 'ai' || !a.description) { a.description = d.description; a.purpose = ''; } // a person's own wording is kept
      a.materials = a.realEvidence ? '' : S.labelFiction(d.materials); a.basis = d.basis; a.portfolioNote = d.portfolioNote || ''; a.parts = d.parts; a.format = d.format; a.submit = d.submit; a.estimate = d.estimate; a.steps = [];
      if (a.realEvidence) S.setEvidence(mod, a); // real-evidence tasks get only sources whose links were checked; if none, they are marked "Source needed", never given an invented scenario
      if (!a.work) { a.rubric = d.rubric; a.criteria = []; } // the grading criteria can't change once work has been submitted
      done++;
    });
    if (course.ai && course.ai.generated) course.ai.usage.push(usageRow(r.usage));
    S.save();
    return { done, total: list.length };
  };

  // Phase 1: outline (saved immediately as a partial course). Phase 2: materials, one module at a time.
  ai.build = async function (brief, run) {
    const set = (patch) => { Object.assign(run, patch); S.render(false); };
    set({ phase: 'running', steps: [{ label: 'Designing your course outline', state: 'active' }], msg: '', courseId: null });
    await ai.requireCurrent();
    const out = await ai.call('/outline', brief, { signal: run.ctl.signal });
    const course = courseFromOutline(out.outline, { ...(out.brief || brief), startDate: brief.startDate });
    course.ai.usage.push(usageRow(out.usage));
    S.state.courses.push(course); S.state.setup = true; S.save();
    run.courseId = course.id;
    const queries = out.outline.modules.map((m) => m.searchQueries || []);
    set({ steps: [{ label: 'Course outline saved', state: 'done' }].concat(course.modules.map((m, i) => ({ label: 'Materials and assignments: ' + m.title, state: i === 0 ? 'active' : 'todo' }))) });

    const STOP = ['budget', 'global_limit', 'ip_limit', 'hour_limit', 'day_limit', 'bad_code', 'locked', 'not_configured', 'no_code', 'cancelled', 'upstream_auth', 'bad_model'];
    let problem = '', missing = 0, detailsMissing = 0;
    for (let i = 0; i < course.modules.length; i++) {
      run.steps[i + 1].state = 'active'; set({});
      try {
        let r = await ai.findMaterials(course, course.modules[i], { queries: queries[i], signal: run.ctl.signal });
        if (r.missing) r = await ai.findMaterials(course, course.modules[i], { queries: queries[i], signal: run.ctl.signal }); // one automatic second try
        if (r.missing) r = await ai.findMaterials(course, course.modules[i], { queries: [course.title + ' ' + course.modules[i].title + ' introduction university', course.modules[i].title + ' open access reading'], signal: run.ctl.signal }); // third and last try, with different search words
        run.steps[i + 1].state = r.missing ? 'warn' : 'done'; if (r.missing) missing++;
        for (let tryN = 0; tryN < 2; tryN++) { // one automatic second try if the first answer was incomplete
          try { const d = await ai.writeDetails(course, course.modules[i], course.modules[i].assignments.filter((a) => !a.parts.length), { signal: run.ctl.signal }); if (d.done >= d.total) break; if (tryN) detailsMissing++; }
          catch (e) { if (STOP.includes(e.code)) throw e; if (tryN) detailsMissing++; }
        }
      } catch (e) {
        run.steps[i + 1].state = 'fail'; problem = e.message;
        if (STOP.includes(e.code)) { for (let j = i + 1; j < course.modules.length; j++) run.steps[j + 1].state = 'skipped'; break; }
      }
      set({});
    }
    const failed = run.steps.slice(1).filter((s) => s.state === 'fail' || s.state === 'skipped').length;
    course.ai.status = failed || detailsMissing ? 'partial' : 'complete'; // missing assignment pages count as incomplete, so the person is told rather than shown "ready"
    course.ai.note = failed
      ? failed + ' of ' + course.modules.length + ' modules still need learning materials (' + problem + ') Open a module and choose “Find materials with AI” to try again, or add your own.'
      : [missing ? missing + ' module' + (missing === 1 ? '' : 's') + ' had no verifiable source; they are marked “Source needed”.' : '', detailsMissing ? detailsMissing + ' module' + (detailsMissing === 1 ? '' : 's') + ' still need their assignment details: open the assignment and choose “Write full assignment with AI”.' : ''].filter(Boolean).join(' ');
    S.save();
    set({ phase: 'done', courseId: course.id, problem: course.ai.status === 'partial' ? course.ai.note : '' });
    return course;
  };

  ai.clarify = async function (brief, signal) {
    const r = await ai.call('/clarify', { topic: brief.topic, level: brief.level, goal: brief.goal }, { signal });
    return r.questions || [];
  };
})(window.Sovereign = window.Sovereign || {});
