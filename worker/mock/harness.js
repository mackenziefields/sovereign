/* sovereign. — MOCK TEST HARNESS (developer tool; not loaded by the app and not needed in production).
 *
 * What it does: loads the REAL worker/worker.js into the browser page, gives it a fake KV store and fake secrets, and
 * replaces window.fetch so that:
 *   - calls to https://mock-worker.invalid/... run through the real Worker code,
 *   - the Worker's calls to api.anthropic.com get CANNED answers (no real AI, no cost, no network),
 *   - the Worker's DNS and link-check requests get canned answers too.
 * So it exercises the Worker's validation, limits, link checking and the app's UI/saving, but it says NOTHING about the
 * real quality of Claude's output or real web-search results. Anything it shows is MOCK data.
 *
 * Use (browser console, app open):  await (await fetch('worker/mock/harness.js')).text()  ->  eval it, then
 *   const H = await SovereignMock.install({ ... });   H.env, H.calls, H.worker, H.internals
 */
(function () {
  const realFetch = window.fetch.bind(window);

  const MODULES = [
    ['Seeing opportunities', 'Week 1', ['Explain what makes an idea an opportunity', 'List three problems you personally know well']],
    ['Talking to customers', 'Week 2', ['Run five customer-discovery conversations', 'Summarize what you learned without selling']],
    ['Testing the idea cheaply', 'Week 3', ['Design a low-cost experiment', 'Decide what result would change your mind']],
    ['How a business makes money', 'Week 4', ['Describe a simple revenue model', 'Estimate start-up costs and break-even']],
    ['Legal basics and structure', 'Week 5', ['Compare common business structures', 'List licences and registrations to check locally']],
    ['Planning your first launch', 'Week 6', ['Write a one-page plan', 'Define a 30-day launch checklist']],
  ];
  const outline = () => ({
    title: 'Entrepreneurship: From Idea to First Customers',
    description: '[MOCK] A beginner-friendly path from noticing a problem worth solving to a tested idea and a simple launch plan.',
    outcomes: ['Judge whether an idea is worth pursuing', 'Learn from real customers', 'Build a simple financial picture', 'Write a one-page launch plan'],
    duration: '6 weeks, about 4 hours per week',
    pathway: 'Prepares you to test a first small business idea.',
    syllabus: '[MOCK] This course is self-paced. Each module has a learn step, an apply step and a short check. You finish by producing a one-page business plan and a first customer test.',
    licensureNote: '',
    credentials: [{ name: '[MOCK] Certified Small Business Foundations', issuer: 'Mock Institute', note: 'Check cost and eligibility with the issuer.' }, { name: '', issuer: 'x', note: '' }],
    modules: MODULES.map(([title, duration, objectives], i) => ({
      title, duration, overview: '[MOCK] ' + title + ' overview.', objectives,
      keyIdeas: '- Idea one for ' + title + '\n- Idea two\n- Idea three', searchQueries: [title.toLowerCase() + ' for beginners'],
      assignments: [
        { title: 'Read and note: ' + title, description: 'Write five notes on what surprised you.', kind: 'learn', points: 5 },
        { title: 'Demonstrate: ' + title, description: 'Produce a brief.', kind: 'demonstrate', points: 30 },
        { title: 'Apply: ' + title, description: 'Do the exercise described in the module.', purposeX: '[MOCK] This builds the skill of applying ' + title + '.', parts: [{ title: 'Hypothesis', questions: ['What do you expect to find, and why?', 'How will you decide what to examine?'] }, { title: 'Audit', questions: ['What did you choose and why?', 'What do you notice?'] }, { title: 'Reflection', questions: ['What surprised you?'] }], format: 'pdf', submit: 'One page of text (about 300 words).', criteria: ['Uses the module concepts correctly', 'Gives a concrete example', 'Is clear and organized'], estimate: '45 minutes', kind: 'apply', points: 15 },
      ],
      selfCheck: ['In your own words, what is the main idea of "' + title + '"?', 'What would you do differently now?'],
      reflection: 'What changed in how you think about starting a business after this module?',
    })),
    finalProject: { title: 'One-page business plan and first customer test', description: 'Produce a one-page plan for a small business idea and report the result of one real customer test.', criteria: ['Names a specific customer and problem', 'Shows evidence from at least five conversations', 'Includes a simple cost and price estimate', 'States the next three actions'] },
  });

  const PAGES = { // host -> behaviour of the canned "web"
    'mockuni.edu': { status: 200, title: 'Entrepreneurship course | Mock University (.edu)' },
    'learn.mock-university.org': { status: 200, title: 'Seeing opportunities | Mock University Learning' },
    'www.learn.mock-university.org': { status: 200, title: 'Seeing opportunities | Mock University Learning' },
    'guide.mock-agency.gov': { status: 200, title: 'Plan your business | Mock Agency' },
    'gone.mock-site.org': { status: 404 },
    'walled.mock-site.org': { status: 403 },
    'slow.mock-site.org': { hang: true },
    'redirect.mock-site.org': { redirect: 'https://learn.mock-university.org/final' },
    'syllabi.mock-college.edu': { status: 200, title: 'WGS 101 Syllabus 2005 | Mock College' },
    'press.mock-press.org': { status: 200, title: 'Mock Feminist Theory Reader | Mock Press' },
    'sneaky.mock-site.org': { ip: '10.0.0.5', status: 200, title: 'internal page' },
    // Build 22 "Check content" pages (mock). The marker words tell the canned AI what kind of page it is; the real Worker still runs its own word check.
    'full.mock-journal.org': { status: 200, title: 'Mock Feminist Theory Reader', body: 'FULLTEXT-MARK Mock Feminist Theory Reader by A. Author. ' + 'In this chapter the author argues that theory must start from lived experience. '.repeat(12) },
    'listing.mock-repo.edu': { status: 200, title: 'Mock Feminist Theory Reader | Repository', body: 'ABSTRACT-MARK Mock Feminist Theory Reader. A. Author. Abstract and download page. ' + 'Record created in the repository catalog with subject headings and rights information. '.repeat(8) },
    'review.mock-blog.com': { status: 200, title: 'A review of the Reader', body: 'REVIEW-MARK A review of Mock Feminist Theory Reader by A. Author. ' + 'The reviewer found the second half stronger than the first. '.repeat(10) },
    'wrong.mock-site.com': { status: 200, title: 'Cooking pasta', body: 'OTHER-MARK Boil the water, add salt, cook the pasta for ten minutes. ' + 'Serve with olive oil and fresh basil from the garden. '.repeat(12) },
    'trick.mock-site.com': { status: 200, title: 'Cooking pasta', body: 'FULLTEXT-MARK Boil the water, add salt, cook the pasta for ten minutes. ' + 'Serve with olive oil and fresh basil from the garden. '.repeat(12) },
    'pdf.mock-site.org': { status: 200, title: '', ctype: 'application/pdf', body: '%PDF-1.4 binary' },
    'login.mock-site.org': { status: 403, title: '' },
    'jsonly.mock-site.org': { status: 200, title: 'App', body: 'Loading...' },
  };

  function install(o) {
    o = o || {};
    return (async () => {
      const code = await (await realFetch('worker/worker.js')).text();
      const internals = new Function(code.replace('export default {', 'const __worker = {') +
        '\nreturn { worker: __worker, checkUrlShape, isPrivateIPv4, isPrivateIPv6, verifyUrl, sanitizeOutline, titleSimilar, parseJson, costOf, sourceType, urlKey, DEFAULTS, safeEqual, hostIsPublic, processReview, readReviewContext, buildExhibits, exhLimits };')();
      const store = new Map();
      const env = Object.assign({
        ANTHROPIC_API_KEY: 'sk-ant-MOCK', ACCESS_CODE: 'mock-code', ALLOWED_ORIGINS: location.origin,
        USAGE: { get: async (k) => (store.has(k) ? store.get(k) : null), put: async (k, v) => { store.set(k, v); } },
      }, o.env || {});
      const calls = { anthropic: [], dns: [], pages: [], worker: [] };
      const pending = [];

      const anthropic = (req) => {
        const b = JSON.parse(req.body);
        calls.anthropic.push(b);
        if (o.upstreamStatus) return new Response(JSON.stringify({ error: { message: 'mock failure' } }), { status: o.upstreamStatus });
        if (b.tools) { // resources
          const q = b.messages[0].content;
          const results = [
            { type: 'web_search_result', url: 'https://www.learn.mock-university.org/seeing-opportunities/?utm_source=x#top', title: 'Seeing opportunities | Mock University Learning', page_age: '2 months ago' },
            { type: 'web_search_result', url: 'https://mockuni.edu/ocw/entrepreneurship', title: 'Entrepreneurship course | Mock University (.edu)' },
            { type: 'web_search_result', url: 'https://guide.mock-agency.gov/plan', title: 'Plan your business | Mock Agency' },
            { type: 'web_search_result', url: 'https://en.wikipedia.org/wiki/Entrepreneurship', title: 'Entrepreneurship - Wikipedia' },
            { type: 'web_search_result', url: 'https://annas-archive.org/md5/abc', title: 'A pirated book' },
            { type: 'web_search_result', url: 'https://syllabi.mock-college.edu/wgs101-syllabus-2005', title: 'WGS 101 Syllabus 2005 | Mock College' },
            { type: 'web_search_result', url: 'https://gone.mock-site.org/old', title: 'An old guide' },
            { type: 'web_search_result', url: 'https://walled.mock-site.org/paywalled', title: 'Premium course' },
          ];
          const picks = o.picks || [
            { url: 'https://learn.mock-university.org/seeing-opportunities', kind: 'article', creator: 'Mock University', access: 'free', relevance: 'Introduces how to spot problems worth solving.' },
            { url: 'https://mockuni.edu/ocw/entrepreneurship/', kind: 'course', creator: 'Mock University', access: 'free', relevance: 'Open courseware.' },
            { url: 'https://en.wikipedia.org/wiki/Entrepreneurship', kind: 'article', creator: 'crowd', access: 'free', relevance: 'MUST BE BLOCKED' },
            { url: 'https://annas-archive.org/md5/abc', kind: 'book', creator: 'x', access: 'free', relevance: 'MUST BE BLOCKED' },
            { title: 'WGS 101 Syllabus 2005', url: 'https://syllabi.mock-college.edu/wgs101-syllabus-2005', kind: 'document', relevance: 'syllabus as a pick: must move to syllabi' },
            { url: 'https://invented.example-fake.com/never-searched', kind: 'book', creator: 'Nobody', access: 'free', relevance: 'MADE UP BY THE MODEL' },
            { url: 'https://gone.mock-site.org/old', kind: 'article', creator: '', access: 'free', relevance: 'dead link' },
            { url: 'https://walled.mock-site.org/paywalled', kind: 'course', creator: 'Mock', access: 'paid', relevance: 'Full course.' },
          ];
          // Build 21 syllabus scenarios (mock): pasted text, a failed fetch (o.fetchError), a PDF the AI read itself (o.pdf)
          const spy = 'https://syllabi.mock-college.edu/wgs101-syllabus-2005', usage0 = { input_tokens: 3000, output_tokens: 300, server_tool_use: { web_search_requests: 1 } };
          if (/Syllabus text supplied by the learner/.test(q)) return json({ content: [{ type: 'text', text: JSON.stringify({ picks: [
            { title: 'Mock Feminist Theory Reader', url: '', kind: 'book', creator: 'A. Author', access: 'unknown', relevance: 'Assigned core reader.' },
            { title: 'Totally Invented Book Title Here', url: '', kind: 'book', creator: 'Nobody', access: 'unknown', relevance: 'NOT IN THE TEXT' }] }) }], stop_reason: 'end_turn', usage: usage0 });
          if (/Open this syllabus page/.test(q) && o.fetchError) return json({ content: [
            { type: 'web_search_tool_result', tool_use_id: 's1', content: [{ type: 'web_search_result', url: 'https://press.mock-press.org/feminist-reader', title: 'Mock Feminist Theory Reader | Mock Press' }] },
            { type: 'web_fetch_tool_result', tool_use_id: 'f1', content: { type: 'web_fetch_tool_error', error_code: o.fetchError } },
            { type: 'text', text: JSON.stringify({ picks: [{ title: 'Mock Feminist Theory Reader', url: 'https://press.mock-press.org/feminist-reader', kind: 'book', creator: 'A. Author', derivedFrom: 'x' }] }) }], stop_reason: 'end_turn', usage: usage0 });
          if (/Open this syllabus page/.test(q) && o.pdf) return json({ content: [
            { type: 'web_search_tool_result', tool_use_id: 's1', content: [{ type: 'web_search_result', url: 'https://press.mock-press.org/feminist-reader', title: 'Mock Feminist Theory Reader | Mock Press' }] },
            { type: 'web_fetch_tool_result', tool_use_id: 'f1', content: { type: 'web_fetch_result', url: spy, content: { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: 'JVBERi0xLjQK' } } } },
            { type: 'text', text: JSON.stringify({ picks: [{ title: 'The Second Mock Essay Collection', url: '', kind: 'book', creator: 'B. Writer', derivedFrom: 'Syllabus PDF', derivedUrl: spy }] }) }], stop_reason: 'end_turn', usage: usage0 });
          if (/Open this syllabus page/.test(q)) {
            const sy = 'https://syllabi.mock-college.edu/wgs101-syllabus-2005';
            const picks2 = [
              { title: 'WGS 101 Syllabus 2005', url: sy, kind: 'document', relevance: 'the syllabus itself (must be dropped)' },
              { title: 'Mock Feminist Theory Reader', url: 'https://press.mock-press.org/feminist-reader', kind: 'book', creator: 'A. Author', access: 'paid', relevance: 'Assigned core reader.', derivedFrom: 'Syllabus of Prof. Jane Mock, WGS 101, Mock College', derivedUrl: sy },
              { title: 'The Second Mock Essay Collection', url: '', kind: 'book', creator: 'B. Writer', access: 'unknown', relevance: 'Assigned in week 3.', derivedFrom: 'Syllabus of Prof. Jane Mock, WGS 101, Mock College', derivedUrl: sy },
              { title: 'Totally Invented Book Title Here', url: '', kind: 'book', creator: 'Nobody', access: 'unknown', relevance: 'NOT IN THE SYLLABUS', derivedFrom: 'Syllabus of Prof. Jane Mock', derivedUrl: sy },
            ];
            if (o.extraPick) picks2.push({ title: 'Seeing Opportunities', url: 'https://learn.mock-university.org/seeing-opportunities', kind: 'article', creator: 'Mock University', access: 'free', relevance: 'found by searching, not in the syllabus', derivedFrom: 'x', derivedUrl: sy });
            return json({ content: [
              { type: 'web_search_tool_result', tool_use_id: 's1', content: [{ type: 'web_search_result', url: sy, title: 'WGS 101 Syllabus 2005 | Mock College' }].concat(o.extraPick ? [{ type: 'web_search_result', url: 'https://learn.mock-university.org/seeing-opportunities', title: 'Seeing opportunities | Mock University Learning' }] : []) },
              { type: 'web_fetch_tool_result', tool_use_id: 'f1', content: { type: 'web_fetch_result', url: sy, content: { type: 'document', source: { type: 'text', data: 'Week 1: Mock Feminist Theory Reader (https://press.mock-press.org/feminist-reader). Week 3: The Second Mock Essay Collection, B. Writer.' } } } },
              { type: 'text', text: JSON.stringify({ picks: picks2 }) }], stop_reason: 'end_turn', usage: { input_tokens: 6000, output_tokens: 500, server_tool_use: { web_search_requests: 1 } } });
          }
          if (o.noResults) return json({ content: [{ type: 'text', text: '{"picks":[]}' }], stop_reason: 'end_turn', usage: { input_tokens: 900, output_tokens: 80, server_tool_use: { web_search_requests: 1 } } });
          return json({
            content: [{ type: 'server_tool_use', id: 's1', name: 'web_search', input: { query: 'x' } }, { type: 'web_search_tool_result', tool_use_id: 's1', content: results },
              { type: 'text', text: '```json\n' + JSON.stringify({ picks, syllabi: [{ title: 'WGS 101 Syllabus 2005 | Mock College', url: 'https://syllabi.mock-college.edu/wgs101-syllabus-2005', description: 'Prof. Jane Mock, WGS 101, Mock College' }] }) + '\n```' }],
            stop_reason: 'end_turn', usage: { input_tokens: 4200, output_tokens: 350, server_tool_use: { web_search_requests: 2 } },
          });
        }
        if (Array.isArray(b.messages[0].content) && /HOW TO REVIEW/.test(b.messages[0].content[0].text)) { // /review (v14, canned scenarios chosen with o.review)
          const t = b.messages[0].content[0].text; (globalThis.__reviewPrompts = globalThis.__reviewPrompts || []).push(t); const last = b.messages[0].content[b.messages[0].content.length - 1];
          const subText = last.type === 'text' ? last.text.replace(/<\/?submission>/g, '').trim() : '';
          const rub = ((t.match(/RUBRIC\. Use exactly[^\n]*\n([\s\S]*?)\n(?:Points available|The assignment's grading|This is the learner)/) || [])[1] || '').split('\n').map((l) => l.match(/^\d+\. (.+) \((\d+(?:\.\d+)?)\)$/)).filter(Boolean).map((m) => ({ name: m[1], max: Number(m[2]) }));
          const practice = /OFFICE HOURS/.test(t), sc = o.review || 'good', first = subText.slice(0, 45), second = subText.slice(60, 110);
          const mk = (type, extra) => Object.assign({ type, criterion: rub[0] ? rub[0].name : '', claim: 'Claim (' + type + ')', quote: '', where: '', alreadyPresent: 'none found', fix: '', example: '', exampleSource: 'none' }, extra || {});
          let findings = [mk('strength', { claim: 'Clear opening.', quote: first }), mk('clarity', { claim: 'State the totals next to the headline.', quote: second, fix: 'Add one sentence.' })];
          let crit = rub.map((r, i) => ({ name: r.name, max: r.max, score: i === 0 ? r.max - 1 : r.max, status: i === 0 ? 'partly' : 'met', reason: 'Reason ' + (i + 1) }));
          let insp = { received: 'Typed text, fully readable.', couldNotInspect: [] };
          if (sc === 'good') findings.push(mk('partial', { claim: 'The comparison needs a stated baseline.', quote: second, fix: 'Name the baseline year.' }));
          if (sc === 'badquote') findings = [mk('error', { claim: 'Arithmetic is wrong.', quote: 'this exact sentence is not anywhere in the work' })];
          if (sc === 'refs') findings = [mk('error', { claim: 'The count includes a duplicate.', quote: first, ref: { exhibit: 'A', row: 'A-12', column: 'Case no.' } }), mk('partial', { claim: 'Cites a row that does not exist.', quote: second, ref: { exhibit: 'A', row: 'A-99', column: '' } }), mk('partial', { claim: 'Names a wrong column.', quote: first, ref: { exhibit: 'A', row: 'A-7', column: 'Favourite colour' } }), mk('clarity', { claim: 'Cites a hidden exhibit.', quote: first, ref: { exhibit: 'Z', row: 'Z-1', column: '' } })];
          if (sc === 'learnerrefs') findings = [mk('error', { claim: 'The count ignores a repeated row in your own data.', quote: first, ref: { exhibit: 'U1', row: 'U1-2', column: 'Case no.' } }), mk('partial', { claim: 'Cites a learner row that does not exist.', quote: second, ref: { exhibit: 'U1', row: 'U1-99', column: '' } }), mk('partial', { claim: 'Cites a sheet that was not sent.', quote: first, ref: { exhibit: 'U2', row: 'U2-1', column: '' } }), mk('clarity', { claim: 'Names a wrong column.', quote: first, ref: { exhibit: 'U1', row: 'U1-1', column: 'Favourite colour' } })];
          if (sc === 'nodeduct') findings = [mk('optional', { claim: 'Consider a chart.' })];
          if (sc === 'missingPresent') findings = [mk('missing', { claim: 'No headline is given.', alreadyPresent: first })];
          if (sc === 'invented') findings = [mk('partial', { claim: 'Cleaning log needed.', quote: first, fix: 'Log it, for example: Row 14: “Oakvale Props LLC” changed to “Oakvale Properties LLC”.', example: 'Row 14: “Oakvale Props LLC”', exampleSource: 'supplied' })];
          if (sc === 'limited') { insp = { received: 'A PDF with charts as images.', couldNotInspect: ['Figure 2 is a chart image that could not be read'] }; findings = [mk('missing', { claim: 'No chart for the denominator.', criterion: rub[1] ? rub[1].name : '' })]; crit = crit.map((k, i) => (i === 1 ? { ...k, status: 'not-assessed', score: 0, reason: 'The chart could not be read.' } : k)); }
          if (sc === 'allunread') { insp = { received: 'A scanned image.', couldNotInspect: ['All text was unreadable'] }; findings = []; crit = crit.map((k) => ({ ...k, status: 'not-assessed', score: 0, reason: 'Unreadable.' })); }
          if (practice) crit = crit.map((k) => ({ ...k, max: 0, score: 0 }));
          const prev = [...t.matchAll(/^\d+\. \[(\w+)\] (.+)$/gm)].map((m) => ({ claim: m[2], status: 'addressed', note: 'Now present.' }));
          return json({ content: [{ type: 'text', text: JSON.stringify({ inspection: insp, summary: 'Mock summary.', criteria: crit, findings, followUp: prev, nextSteps: ['Optional next step.'] }) }], stop_reason: 'end_turn', usage: { input_tokens: 4200, output_tokens: 1800 } });
        }
        if (Array.isArray(b.messages[0].content)) { // /review: round 1 scores 70%, round 2 scores 90% (canned)
          const txt = b.messages[0].content[0].text, r2 = /review 2 of 2/.test(txt), sc = r2 ? [9, 9, 9] : [6, 7, 8];
          return json({ content: [{ type: 'text', text: JSON.stringify({ summary: r2 ? 'Much stronger. The argument is now supported.' : 'A solid start with a thin argument.', strengths: ['Clear thesis in paragraph 1'], improvements: r2 ? [] : ['Add one source to support the claim in paragraph 2', 'Cut the repeated point in paragraph 3'], nextSteps: ['Proofread once more'], criteria: ['Argument', 'Evidence', 'Clarity'].map((n, i) => ({ name: n, max: 10, score: sc[i], comment: 'Comment on ' + n })), score: 999 }) }], stop_reason: 'end_turn', usage: { input_tokens: 2500, output_tokens: 900 } });
        }
        if (/For each numbered reading below/.test(b.messages[0].content)) { // /check-content (canned): the kind comes from marker words in the mock pages
          const blocks = b.messages[0].content.split('<reading n="').slice(1);
          const checks = blocks.map((t) => ({ n: Number(t.split('"')[0]), kind: /FULLTEXT-MARK/.test(t) ? 'full-text' : /ABSTRACT-MARK/.test(t) ? 'listing' : /REVIEW-MARK/.test(t) ? 'about' : 'other', note: /FULLTEXT-MARK/.test(t) ? 'The page holds the text of the work.' : /ABSTRACT-MARK/.test(t) ? 'A repository record with an abstract.' : /REVIEW-MARK/.test(t) ? 'A review of the work.' : 'A page about something else.' }));
          return json({ content: [{ type: 'text', text: JSON.stringify({ checks }) }], stop_reason: 'end_turn', usage: { input_tokens: 700 * blocks.length, output_tokens: 60 * blocks.length } });
        }
        if (/Revise each assignment above/.test(b.messages[0].content)) { // /revise (canned): one revision per listed assignment
          const n = (b.messages[0].content.match(/^\d+\. .*\[(learn|apply|demonstrate)/gm) || []).length;
          return json({ content: [{ type: 'text', text: JSON.stringify({ assignments: Array.from({ length: n }, () => ({ description: '[MOCK REVISED] This task now draws on the Mock Feminist Theory Reader.', materials: 'Northwind Ltd, adjusted for the new reading.', changeNote: 'Added the new reading to step one.', steps: [{ title: 'Read the new reading', questions: ['What is its main claim?'] }, { title: 'Apply it', questions: ['How does it change the case?'] }] })) }) }], stop_reason: 'end_turn', usage: { input_tokens: 1800, output_tokens: 1500 } });
        }
        if (/Write the complete packet of supplied exhibits/.test(b.messages[0].content)) { // /exhibits (canned; MOCK data)
          const txt = b.messages[0].content; o.exhibitCalls = (o.exhibitCalls || 0) + 1;
          if (o.exhibitsFail === 'error') return new Response(JSON.stringify({ type: 'error', error: { type: 'api_error', message: 'mock failure' } }), { status: 500, headers: { 'content-type': 'application/json' } });
          const empty = { chartKind: 'none', fn: 'none', from: '', x: '', y: '', numAgg: 'sum', perFrom: '', perCol: '', perJoin: '', perAgg: 'sum', perScale: 100, perLabel: '', xLabel: '', yLabel: '', unit: '', method: '', columns: [], rows: [], events: [], docKind: 'other', meta: [], blocks: [] };
          const col = (key, label, kind, unit) => ({ key, label, kind, unit: unit || '' });
          const doc = /\(document\)/.test(txt) && !/\(table\)/.test(txt);
          const A = { ...empty, id: 'A', type: 'table', title: 'Raw eviction filings', source: 'Fictional Riverton County court records (MOCK)', purpose: 'Find and document the problems before analyzing.', columns: [col('case_no', 'Case no.', 'text'), col('hood', 'Neighborhood', 'text'), col('landlord', 'Landlord', 'text'), col('amount', 'Amount owed', 'currency')],
            rows: [['RV-001', 'Eastside', 'Oak Properties', '$1,200'], ['RV-002', 'Eastside', 'Oak Properties', '$1,200'], ['RV-002', 'Eastside', 'Oak Properties', '$1,200'], ['RV-003', 'Westside', 'Oakk Properties', 'about 900'], ['RV-004', 'Westside', 'Hill LLC', '-50'], ['RV-005', 'Northgate', 'Hill LLC', '450000'], ['RV-006', '', 'Hill LLC', '800'], ['RV-007', 'Eastside', '=SUM(A1:A3)', '650']] };
          const B = { ...empty, id: 'B', type: 'table', title: 'Renter households by neighborhood', source: 'Fictional Riverton Housing Office (MOCK)', purpose: 'The denominator for rates.', columns: [col('hood', 'Neighborhood', 'text'), col('households', 'Renter households', 'number')], rows: [['Eastside', '1,000'], ['Westside', '500'], ['Northgate', '0']] };
          const C = { ...empty, id: 'C', type: 'chart', title: 'Filings per 100 renter households', source: 'Computed from Exhibits A and B', purpose: 'Compare neighborhoods fairly.', chartKind: 'bar', fn: 'rate', from: 'A', x: 'hood', y: '', numAgg: 'count', perFrom: 'B', perCol: 'households', perJoin: 'hood', perAgg: 'sum', perScale: 100, perLabel: 'per 100 renter households', xLabel: 'Neighborhood', yLabel: 'Filings', unit: 'per 100 renter households', method: 'Filings divided by renter households.' };
          const memo = { ...empty, id: 'A', type: 'document', title: 'Draft memo from the housing director', source: 'Fictional Riverton Housing Office (MOCK)', purpose: 'The text you will critique.', docKind: 'memo', meta: [{ label: 'From', value: 'Dana Whitfield, Director' }, { label: 'To', value: 'City Council' }, { label: 'Re', value: 'Rising filings' }], blocks: [{ t: 'note', level: 2, text: 'Draft, not for release', who: '', by: '', label: 'Status', ordered: false, items: [] }, { t: 'paragraph', level: 2, text: '[MOCK] Filings rose sharply this year. We recommend the council act at once.', who: '', by: '', label: '', ordered: false, items: [] }, { t: 'paragraph', level: 2, text: '<script>alert(1)</script> is shown as plain text.', who: '', by: '', label: '', ordered: false, items: [] }] };
          const talk = { ...empty, id: 'B', type: 'document', title: 'Interview with a tenant organizer', source: 'Fictional (MOCK)', purpose: 'A second perspective.', docKind: 'transcript', meta: [{ label: 'Interviewer', value: 'R. Alvarez' }], blocks: [{ t: 'turn', level: 2, text: 'Tell me what you saw this winter.', who: 'Interviewer', by: '', label: '', ordered: false, items: [] }, { t: 'turn', level: 2, text: 'Notices came faster than before.', who: 'Organizer', by: '', label: '', ordered: false, items: [] }] };
          let list = doc ? [memo, talk] : [A, B, C];
          if (/Riverton Eviction/.test(txt)) { // a fuller, Riverton-specific packet (MOCK data) for the demonstration of a complete AI-built assignment
            const fl = [['RV-2023-0401', '2023-01-09', 'Eastside', 'Oak Park Properties', '$1,150', 'Filed'], ['RV-2023-0402', '2023-01-11', 'Eastside', 'Oak Park Properties', '$1,150', 'Filed'], ['RV-2023-0403', '2023-01-12', 'Westside', 'Hill Street LLC', '$980', 'Dismissed'], ['RV-2023-0404', '2023-01-17', 'East side', 'Oak Park Properties', '$1,300', 'Filed'], ['RV-2023-0405', '2023-01-20', 'Northgate', 'Northgate Holdings', '$640', 'Judgment'], ['RV-2023-0406', '2023-01-23', 'Westside', 'Hill St. LLC', '$1,020', 'Filed'], ['RV-2023-0407', '2023-02-01', 'Southend', 'Riverbend Rentals', '$0', 'Filed'], ['RV-2023-0408', '2023-02-03', 'Eastside', 'Oakpark Properties', '$1,200', 'Judgment'], ['RV-2023-0409', '2023-02-06', 'Westside', 'Hill Street LLC', '', 'Filed'], ['RV-2023-0410', '2023-02-08', 'Northgate', 'Northgate Holdings', '$700', 'Dismissed'], ['RV-2023-0411', '2023-02-10', 'Eastside', 'Oak Park Properties', '$1,150', 'Filed'], ['RV-2023-0412', '2023-02-14', 'Southend', 'Riverbend Rentals', '$870', 'Filed'], ['RV-2023-0412', '2023-02-14', 'Southend', 'Riverbend Rentals', '$870', 'Filed'], ['RV-2023-0413', '2023-02-16', 'Westside', 'Hill Street LLC', '$1,010', 'Judgment'], ['RV-2023-0414', '2023-02-21', 'Northgate', 'Northgate Holdings', '$450,000', 'Filed'], ['RV-2023-0415', '2023-02-22', 'Eastside', 'Oak Park Properties', '$1,175', 'Dismissed'], ['RV-2023-TEST', '2023-02-24', 'Eastside', 'TEST ENTRY', '$1', 'Filed'], ['RV-2023-0417', '2023-03-02', 'Southend', 'Riverbend Rentals', '$905', 'Filed'], ['RV-2023-0418', '2023-03-03', 'Westside', 'Hill Street LLC', '$990', 'Filed'], ['RV-2023-0419', '2023-03-07', 'Eastside', 'Oak Park Properties', '$1,225', 'Filed']];
            const fx = { ...empty, id: 'A', type: 'table', title: 'Raw eviction filings, January to March', source: 'Fictional Riverton County Court clerk export (MOCK)', purpose: 'The raw export. Find the problems before you count anything.', columns: [col('case_no', 'Case no.', 'text'), col('filed', 'Date filed', 'date'), col('hood', 'Neighborhood', 'text'), col('landlord', 'Landlord', 'text'), col('owed', 'Amount owed', 'currency'), col('status', 'Status', 'text')], rows: fl };
            const bx = { ...empty, id: 'B', type: 'table', title: 'Renter households by neighborhood', source: 'Fictional Riverton Housing Office, 2022 estimate (MOCK)', purpose: 'The denominator for any rate you report.', columns: [col('hood', 'Neighborhood', 'text'), col('households', 'Renter households', 'number')], rows: [['Eastside', '6,200'], ['Westside', '4,100'], ['Northgate', '3,300'], ['Southend', '4,400']] };
            const cx = { ...empty, id: 'C', type: 'table', title: 'Rental units by landlord', source: 'Fictional Riverton Rental Registry (MOCK)', purpose: 'Who owns how much, and what that does to the filing counts.', columns: [col('landlord', 'Landlord', 'text'), col('units', 'Registered units', 'number'), col('hood', 'Main neighborhood', 'text')], rows: [['Oak Park Properties', '2,400', 'Eastside'], ['Hill Street LLC', '1,350', 'Westside'], ['Northgate Holdings', '900', 'Northgate'], ['Riverbend Rentals', '1,100', 'Southend']] };
            const dx = { ...empty, id: 'D', type: 'chart', title: 'Filings per 100 renter households, by neighborhood', source: 'Computed from Exhibits A and B (MOCK)', purpose: 'A starting comparison. Check what it leaves out.', chartKind: 'bar', fn: 'rate', from: 'A', x: 'hood', y: '', numAgg: 'count', perFrom: 'B', perCol: 'households', perJoin: 'hood', perAgg: 'sum', perScale: 100, perLabel: 'filings per 100 renter households', xLabel: 'Neighborhood', yLabel: 'Filings', unit: 'filings per 100 renter households', method: 'Number of filings divided by renter households, times 100.' };
            list = [fx, bx, cx, dx];
          }
          if (o.exhibitsFail === 'invalid') list = [A, { ...C, from: 'Z' }];
          if (o.exhibitsFail === 'empty') list = [];
          return json({ content: [{ type: 'text', text: JSON.stringify({ exhibits: list }) }], stop_reason: 'end_turn', usage: { input_tokens: 1200, output_tokens: 4000 } });
        }
        if (/Write the complete assignment page/.test(b.messages[0].content)) { // /details (canned)
          const n = (b.messages[0].content.match(/^\d+\. /gm) || []).length;
          const plan = (i) => o.exhibitPlan === 'none' ? [] : i % 3 === 1 ? [{ title: 'Draft memo from the housing director', type: 'document', purpose: 'The text you critique.' }, { title: 'Interview with a tenant organizer', type: 'document', purpose: 'A second perspective.' }] : [{ title: 'Raw eviction filings', type: 'table', purpose: 'Clean and analyze.' }, { title: 'Renter households by neighborhood', type: 'table', purpose: 'Denominator.' }, { title: 'Filings per 100 renter households', type: 'chart', purpose: 'Compare.' }];
          if (/Analyze the Fictional Riverton Eviction Dataset/.test(b.messages[0].content)) { // a complete Riverton assignment page (MOCK content) for the demonstration
            const riv = { title: 'Analyze the Fictional Riverton Eviction Dataset', basis: 'scenario', portfolioNote: '', exhibitPlan: [{ title: 'Raw eviction filings, January to March', type: 'table', purpose: 'The raw export.' }, { title: 'Renter households by neighborhood', type: 'table', purpose: 'The denominator.' }, { title: 'Rental units by landlord', type: 'table', purpose: 'Ownership.' }, { title: 'Filings per 100 renter households, by neighborhood', type: 'chart', purpose: 'A starting comparison.' }],
              overview: '[MOCK] Eviction numbers make headlines, and they are easy to get wrong. A reporter who counts filings without asking who filed them, how often, and against how many households can publish a figure that sounds alarming and means very little. This task builds the habit of checking a dataset before you trust it.\n\nYou are an investigative reporter at the Riverton Ledger. The county court clerk has sent a raw export of eviction filings (Exhibit A), the housing office has sent renter household counts (Exhibit B), and the rental registry lists units by landlord (Exhibit C). Exhibit D is a first-pass chart a colleague drew from A and B. Your editor wants to know whether the story is real.\n\nYou will document the problems in the raw data, decide what you can and cannot safely count, compare neighborhoods fairly, and write a short methods note and findings summary that an editor could publish alongside the story.',
              materials: '[MOCK] Riverton is a fictional mid-sized county. The Ledger received three data files and one draft chart this week. Exhibits A to D hold them exactly as received. Nothing in them has been cleaned.',
              steps: [{ title: 'Inspect the raw filings', questions: ['What looks duplicated, inconsistent, missing or implausible in Exhibit A?', 'List each problem with its row reference (for example A-13).'] }, { title: 'Decide what to count', questions: ['Which rows would you keep, change or exclude, and why?', 'What would you ask the clerk before publishing?'] }, { title: 'Compare fairly', questions: ['Why is a raw count misleading across neighborhoods?', 'Which exhibit gives the denominator, and what does Exhibit D leave out?'] }, { title: 'Write it up', questions: ['State your finding in two sentences an editor could print.', 'Write a methods note that discloses every choice you made.'] }],
              format: 'text', submit: 'A findings summary and methods note of 450 to 600 words that cites exhibit rows.', estimate: '90 minutes',
              criteria: [{ text: 'Finds and documents the data problems with row references', points: 7 }, { text: 'Chooses a defensible counting method and discloses it', points: 5 }, { text: 'Uses the correct denominator and compares neighborhoods fairly', points: 5 }, { text: 'Clear methods note and findings summary', points: 3 }] };
            return json({ content: [{ type: 'text', text: JSON.stringify({ assignments: [riv] }) }], stop_reason: 'end_turn', usage: { input_tokens: 1100, output_tokens: 3200 } });
          }
          const mk = (i) => ({ title: 'T' + i, basis: 'scenario', exhibitPlan: plan(i), portfolioNote: 'A policy brief you could show to advocacy employers.', overview: '[MOCK] Para one why it matters.\n\nPara two the situation and what you produce.', materials: '[MOCK] Fictional company Northwind Ltd has a flexible-work policy: ...', steps: [{ title: 'Hypothesis', questions: ['What do you expect?', 'Why?'] }, { title: 'Analysis', questions: ['Who benefits?'] }], format: i % 3 === 2 ? 'file' : i % 2 ? 'any' : 'text', submit: 'A 450-word analysis with two recommendations.', estimate: '60 minutes', criteria: [{ text: 'Considers gender with two other factors', points: 6 }, { text: 'Avoids stereotyping', points: 4 }, { text: 'Recommendations follow', points: 5 }] });
          const _unused = (i) => ({ title: 'T' + i, basis: 'scenario', portfolioNote: 'A policy brief you could show to advocacy employers.', overview: '[MOCK] Para one why it matters.\n\nPara two the situation and what you produce.', materials: '[MOCK] Fictional company Northwind Ltd has a flexible-work policy: ...', steps: [{ title: 'Hypothesis', questions: ['What do you expect?', 'Why?'] }, { title: 'Analysis', questions: ['Who benefits?'] }], format: i % 3 === 2 ? 'file' : i % 2 ? 'any' : 'text', submit: 'A 450-word analysis with two recommendations.', estimate: '60 minutes', criteria: [{ text: 'Considers gender with two other factors', points: 6 }, { text: 'Avoids stereotyping', points: 4 }, { text: 'Recommendations follow', points: 5 }] });
          if (o.detailsFail) return json({ content: [{ type: 'text', text: JSON.stringify({ assignments: [] }) }], stop_reason: 'end_turn', usage: { input_tokens: 500, output_tokens: 20 } });
          return json({ content: [{ type: 'text', text: JSON.stringify({ assignments: Array.from({ length: n }, (_, i) => mk(i)) }) }], stop_reason: 'end_turn', usage: { input_tokens: 900, output_tokens: 3000 } });
        }
        if (/Ask at most 2 short/.test(b.messages[0].content)) {
          return json({ content: [{ type: 'text', text: JSON.stringify({ questions: [{ id: 'a', text: 'What kind of business are you curious about?', choices: ['Online', 'Local service', 'Not sure'] }, { id: 'b', text: 'Any experience with money or sales?', choices: [] }] }) }], stop_reason: 'end_turn', usage: { input_tokens: 300, output_tokens: 120 } });
        }
        if (o.outlineText) return json({ content: [{ type: 'text', text: o.outlineText }], stop_reason: 'end_turn', usage: { input_tokens: 1000, output_tokens: 100 } });
        if (o.refusal) return json({ content: [], stop_reason: 'refusal', usage: { input_tokens: 100, output_tokens: 0 } });
        return json({ content: [{ type: 'text', text: JSON.stringify(outline()) }], stop_reason: 'end_turn', usage: { input_tokens: 1500, output_tokens: 7600 } });
      };
      const json = (x) => new Response(JSON.stringify(x), { status: 200, headers: { 'content-type': 'application/json' } });

      const dns = (u) => {
        const name = new URL(u).searchParams.get('name'), type = new URL(u).searchParams.get('type');
        calls.dns.push(name + ' ' + type);
        const ip = (PAGES[name] && PAGES[name].ip) || '93.184.216.34';
        return json({ Answer: type === 'A' ? [{ type: 1, data: ip }] : [] });
      };
      const page = (u, init) => {
        const x = new URL(u); calls.pages.push(u);
        const p = PAGES[x.hostname]; if (!p) return new Response('', { status: 404 });
        if (p.hang) return new Promise((_, rej) => { (init && init.signal) && init.signal.addEventListener('abort', () => rej(new Error('aborted'))); });
        if (p.redirect) return new Response(null, { status: 302, headers: { location: p.redirect } });
        if (p.ctype) return new Response(p.body || '', { status: p.status, headers: { 'content-type': p.ctype } });
        return new Response('<html><head><title>' + (p.title || '') + '</title></head><body>' + (p.body || 'x'.repeat(500)) + '</body></html>', { status: p.status, headers: { 'content-type': 'text/html' } });
      };

      window.fetch = async function (input, init) {
        const url = typeof input === 'string' ? input : input.url;
        if (url.startsWith('https://mock-worker.invalid')) {
          calls.worker.push(url);
          const req = new Request(url, init);
          const ctx = { waitUntil: (p) => pending.push(p) };
          return internals.worker.fetch(req, env, ctx);
        }
        if (url.startsWith('https://api.anthropic.com/')) return anthropic(init);
        if (url.startsWith('https://cloudflare-dns.com/')) return dns(url);
        if (/^https:\/\/[^/]*\.(org|gov|com|edu)\//.test(url) && !url.includes(location.host)) return page(url, init);
        return realFetch(input, init);
      };
      return { env, calls, store, internals, settle: () => Promise.all(pending), restore: () => { window.fetch = realFetch; } };
    })();
  }
  window.SovereignMock = { install };
})();
