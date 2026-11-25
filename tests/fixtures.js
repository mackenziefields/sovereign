/* Fictional course used to test the publications. Built through S.normalize, so it is shaped exactly like a saved course. Never saved by the tests. */
(function (S) {
  'use strict';
  const H = 3600000, T0 = Date.parse('2026-10-28T10:12:00Z');
  const iso = (ms) => new Date(ms).toISOString();
  const para = (n, seed) => Array.from({ length: n }, (_, i) => 'Paragraph ' + (i + 1) + ' of the ' + seed + '. The tip arrived as a short message, and I treated it as something to be proven or discarded before it was allowed anywhere near a headline. I wrote what I knew on one side of a sheet and what I had been told on the other, then listed the documents that could move a line from told to known. The payment record arrived first and held the first surprise; the renewal arrived later and settled the question, although the district disputed one word of my draft and I kept that dispute in the story because it is the point of it.').join('\n\n');
  const crit = (rows) => rows.map(([name, max, score, status]) => ({ name, max, score, comment: 'Comment on ' + name + '.', status: status || 'met', assessed: true }));
  const review = (rows, at, o) => { o = o || {}; const sc = Math.round(rows.reduce((x, r) => x + r[2], 0) * 10) / 10, mx = rows.reduce((x, r) => x + r[1], 0);
    return { summary: o.summary || 'A careful piece of work with a clear evidence trail and a few things to tighten.', strengths: o.strengths || ['Clear separation of fact and claim.', 'A source log that can be audited.'], improvements: [], nextSteps: o.nextSteps || ['Correct the two verified errors.', 'Record the second contact’s outcome.'],
      criteria: crit(rows), score: sc, max: mx, model: 'fixture', at, findings: o.findings || [
        { type: 'error', criterion: 'Accuracy', claim: 'The draft gives the wrong date for the first invoice.', quote: 'invoices continued after March 4', where: 'paragraph 3', located: true, fix: 'Use the date in the payment record.' },
        { type: 'clarity', criterion: 'Structure', claim: 'The lead needs the key fact earlier.', quote: '', where: '', located: null, fix: 'Move the finding into the first sentence.' },
        { type: 'optional', criterion: '', claim: 'A short timeline would help readers.', quote: '', where: '', located: null, fix: '' }],
      inspection: { received: 'The typed submission and the rubric.', couldNotInspect: [], facts: [], limited: false }, context: { schema: 2, mode: 'graded', compared: 'none', steps: true, materials: false, keyIdeas: false, readings: 'none' } }; };
  const RUB = [['Evidence and sourcing', 30, 29], ['Accuracy', 25, 23], ['Fairness and attribution', 20, 18], ['Structure and clarity', 15, 14], ['Source log completeness', 10, 10]]; // 94
  const RUB88 = [['Evidence', 40, 36], ['Method', 30, 26], ['Clarity', 30, 26]]; // 88
  const RUB91 = [['Evidence', 50, 46], ['Clarity', 50, 45]]; // 91
  const sub = (text, atMs, fb, extra) => ({ text, at: iso(atMs), late: false, fileId: '', fileName: '', fileType: '', fileSize: 0, feedback: fb, ...(extra || {}) });
  const first = (rows, atMs) => { const fb = review(rows, iso(atMs)); return { at: iso(atMs), late: false, score: fb.score, max: fb.max, model: 'fixture', summary: 'First review.', criteria: fb.criteria, findings: fb.findings }; };

  S.fixtureCourse = function (theme, o) {
    o = o || {};
    const dl = (atMs) => iso(atMs + 72 * H);
    const asg = (id, title, kind, points, score, work, extra) => ({ id, title, kind, points, score, due: '', work, done: !!work, description: 'Fixture assignment ' + title + '.', purpose: 'Why this assignment matters: it asks for ' + title.toLowerCase() + '.', ...(extra || {}) });
    const capWork = { phase: 'final', deadline: dl(T0), first: null, final: sub(para(o.capParas || 9, 'capstone'), T0 + 53 * H, review(RUB, iso(T0 + 53 * H)), {}), firstSummary: first([['Evidence and sourcing', 30, 8], ['Accuracy', 25, 6], ['Fairness and attribution', 20, 4], ['Structure and clarity', 15, 3], ['Source log completeness', 10, 2]], T0) }; // first review 23
    const raw = {
      id: 'fx-' + theme, title: 'Independent Journalism', code: 'JOUR 101', designTheme: theme, description: 'Report, verify and publish original stories independently, with sound ethics, legal awareness and clear writing.', objective: 'Report, verify, and publish original stories independently.', duration: '6 weeks',
      outcomes: ['Distinguish a lead from a story.', 'Evaluate sources for access and motive.', 'Plan and fact-check a news story.'],
      modules: [
        { id: 'fm1', title: 'Foundations: purpose and ethics', overview: 'Why journalism exists and the rules it keeps.', objectives: ['Apply ethical standards.'], readings: [{ id: 'r1', title: 'SPJ Code of Ethics', url: 'https://www.spj.org/ethicscode.asp', done: true }], assignments: [
          asg('fa1', 'Read and note: the code of ethics', 'learn', 10, 9, null, { done: true }),
          asg('fa2', 'Trace a viral claim', 'apply', 20, 18.2, { phase: 'final', deadline: dl(T0 - 300 * H), first: null, final: sub('A short trace of a claim through four reposts.', T0 - 300 * H, review(RUB91, iso(T0 - 300 * H))) }),
        ] },
        { id: 'fm2', title: 'Public records and data', overview: 'Using open-records law to get information that is not volunteered.', objectives: ['File a request.'], readings: [], assignments: [
          asg('fd1', 'Public Records Request Packet', 'demonstrate', 100, 88, { phase: 'final', deadline: dl(T0 - 200 * H), first: null, final: sub(para(3, 'records packet'), T0 - 150 * H, review(RUB88, iso(T0 - 150 * H)), { fileName: 'request-letters.docx', fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', fileSize: 59392 }), firstSummary: first([['Evidence', 40, 18], ['Method', 30, 14], ['Clarity', 30, 12]], T0 - 200 * H) }),
          asg('fd2', 'Verify a Viral Claim: Source Log', 'demonstrate', 100, 91, { phase: 'final', deadline: dl(T0 - 100 * H), first: null, final: sub(para(3, 'source log'), T0 - 100 * H, review(RUB91, iso(T0 - 100 * H))) }),
          asg('fd3', 'Unreviewed draft', 'demonstrate', 100, null, { phase: 'reviewed', deadline: dl(T0), first: sub('A draft that has a first review only.', T0, review(RUB91, iso(T0))), final: null }),
        ] },
      ],
      credentials: [{ id: 'k1', name: 'Journalism training certificates', issuer: 'Poynter Institute', url: 'https://www.poynter.org', status: 'considering', note: '' }],
      work: { title: 'A one-page plan', description: 'I wrote a plan for a local newsletter.', reflection: 'I would validate demand earlier.', status: 'completed', url: '', criteria: [] },
    };
    const c = S.normalize({ app: 'sovereign', name: 'Sample Learner', courses: [raw] }).courses[0];
    if (o.capstone !== false) c.capstone = S.makeCapstone({ title: 'The Story Package: From Tip to Publishable Draft', status: 'ready', weight: 20, assignments: [{ id: 'fcap', title: 'The Story Package: From Tip to Publishable Draft', description: 'A complete publishable package.', purpose: 'Bring the course together in one sourced story.', points: 100, score: 94, kind: 'demonstrate', capstone: true, work: capWork, due: '', done: true }] });
    return c;
  };
})(window.Sovereign);
