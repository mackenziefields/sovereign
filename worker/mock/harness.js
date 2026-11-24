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
        { title: 'Apply: ' + title, description: 'Do the exercise described in the module.', kind: 'apply', points: 15 },
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
  };

  function install(o) {
    o = o || {};
    return (async () => {
      const code = await (await realFetch('worker/worker.js')).text();
      const internals = new Function(code.replace('export default {', 'const __worker = {') +
        '\nreturn { worker: __worker, checkUrlShape, isPrivateIPv4, isPrivateIPv6, verifyUrl, sanitizeOutline, titleSimilar, parseJson, costOf, sourceType, urlKey, DEFAULTS, safeEqual, hostIsPublic };')();
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
          if (/Open this syllabus page/.test(q)) {
            const sy = 'https://syllabi.mock-college.edu/wgs101-syllabus-2005';
            const picks2 = [
              { title: 'WGS 101 Syllabus 2005', url: sy, kind: 'document', relevance: 'the syllabus itself (must be dropped)' },
              { title: 'Mock Feminist Theory Reader', url: 'https://press.mock-press.org/feminist-reader', kind: 'book', creator: 'A. Author', access: 'paid', relevance: 'Assigned core reader.', derivedFrom: 'Syllabus of Prof. Jane Mock, WGS 101, Mock College', derivedUrl: sy },
              { title: 'The Second Mock Essay Collection', url: '', kind: 'book', creator: 'B. Writer', access: 'unknown', relevance: 'Assigned in week 3.', derivedFrom: 'Syllabus of Prof. Jane Mock, WGS 101, Mock College', derivedUrl: sy },
              { title: 'Totally Invented Book Title Here', url: '', kind: 'book', creator: 'Nobody', access: 'unknown', relevance: 'NOT IN THE SYLLABUS', derivedFrom: 'Syllabus of Prof. Jane Mock', derivedUrl: sy },
            ];
            return json({ content: [
              { type: 'web_search_tool_result', tool_use_id: 's1', content: [{ type: 'web_search_result', url: sy, title: 'WGS 101 Syllabus 2005 | Mock College' }] },
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
        return new Response('<html><head><title>' + (p.title || '') + '</title></head><body>' + 'x'.repeat(500) + '</body></html>', { status: p.status, headers: { 'content-type': 'text/html' } });
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
