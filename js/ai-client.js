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

  function courseFromOutline(o, brief) {
    const fp = o.finalProject || {};
    const raw = {
      id: S.uid(), code: S.codeFor(o.title), title: o.title, description: o.description, objective: o.pathway,
      deliverable: [fp.title, fp.description].filter(Boolean).join(': '), syllabus: o.syllabus, outcomes: o.outcomes, duration: o.duration, pathway: o.pathway,
      licensureNote: o.licensureNote, color: S.state.courses.length % S.COLORS.length,
      announcements: [{ id: S.uid(), title: 'Welcome' + (S.state.name ? ', ' + S.state.name : '') + ': ' + o.title, date: S.todayISO(), body: 'This course was drafted by AI from what you told it. Treat it as a first draft: rename, reorder, replace, or delete anything. Check every resource yourself, because links are checked by a program, not reviewed by a person.' }],
      credentials: (o.credentials || []).map((k) => ({ id: S.uid(), name: k.name, issuer: k.issuer, note: k.note, status: 'considering', requirement: k.requirement, origin: 'ai' })),
      modules: o.modules.map((m) => ({
        id: S.uid(), title: m.title, overview: m.overview, keyIdeas: m.keyIdeas, reflection: m.reflection, objectives: m.objectives, selfCheck: m.selfCheck,
        duration: m.duration, origin: 'ai', edited: false, readings: [],
        assignments: m.assignments.map((a) => ({ id: S.uid(), title: a.title, description: a.description, kind: a.kind, points: a.points, origin: 'ai' })),
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
    if (!found && !mod.readings.length) mod.readings.push(S.makeReading(placeholder(mod, r.missingNote)));
    if (course.ai && course.ai.generated) course.ai.usage.push(usageRow(r.usage));
    S.save();
    return { added, missing: !found };
  };

  // Phase 1: outline (saved immediately as a partial course). Phase 2: materials, one module at a time.
  ai.build = async function (brief, run) {
    const set = (patch) => { Object.assign(run, patch); S.render(false); };
    set({ phase: 'running', steps: [{ label: 'Designing your course outline', state: 'active' }], msg: '', courseId: null });
    const out = await ai.call('/outline', brief, { signal: run.ctl.signal });
    const course = courseFromOutline(out.outline, out.brief || brief);
    course.ai.usage.push(usageRow(out.usage));
    S.state.courses.push(course); S.state.setup = true; S.save();
    run.courseId = course.id;
    const queries = out.outline.modules.map((m) => m.searchQueries || []);
    set({ steps: [{ label: 'Course outline saved', state: 'done' }].concat(course.modules.map((m, i) => ({ label: 'Finding materials: ' + m.title, state: i === 0 ? 'active' : 'todo' }))) });

    const STOP = ['budget', 'global_limit', 'ip_limit', 'hour_limit', 'day_limit', 'bad_code', 'locked', 'not_configured', 'no_code', 'cancelled', 'upstream_auth', 'bad_model'];
    let problem = '', missing = 0;
    for (let i = 0; i < course.modules.length; i++) {
      run.steps[i + 1].state = 'active'; set({});
      try {
        let r = await ai.findMaterials(course, course.modules[i], { queries: queries[i], signal: run.ctl.signal });
        if (r.missing) r = await ai.findMaterials(course, course.modules[i], { queries: queries[i], signal: run.ctl.signal }); // one automatic second try
        run.steps[i + 1].state = r.missing ? 'warn' : 'done'; if (r.missing) missing++;
      } catch (e) {
        run.steps[i + 1].state = 'fail'; problem = e.message;
        if (STOP.includes(e.code)) { for (let j = i + 1; j < course.modules.length; j++) run.steps[j + 1].state = 'skipped'; break; }
      }
      set({});
    }
    const failed = run.steps.slice(1).filter((s) => s.state === 'fail' || s.state === 'skipped').length;
    course.ai.status = failed ? 'partial' : 'complete';
    course.ai.note = failed
      ? failed + ' of ' + course.modules.length + ' modules still need learning materials (' + problem + ') Open a module and choose “Find materials with AI” to try again, or add your own.'
      : (missing ? missing + ' module' + (missing === 1 ? '' : 's') + ' had no verifiable source; they are marked “Source needed”.' : '');
    S.save();
    set({ phase: 'done', courseId: course.id, problem: failed ? course.ai.note : '' });
    return course;
  };

  ai.clarify = async function (brief, signal) {
    const r = await ai.call('/clarify', { topic: brief.topic, level: brief.level, goal: brief.goal }, { signal });
    return r.questions || [];
  };
})(window.Sovereign = window.Sovereign || {});
