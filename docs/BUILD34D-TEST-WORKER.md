# Build 34 step D: capped real-AI test on the test Worker (needs your approval)

Goal: check that Worker v19 writes good quizzes, reflection questions and foundational texts with the real AI, before anything reaches the production Worker (`sovereign-ai`, v18), which is not touched.
Never paste an API key or access code into chat or into any file.

## Cost (estimate, capped)

| Run | What it calls | Estimate |
|---|---|---|
| 1. One new 3-module course, with one text typed in "Texts you know you need" | outline, materials, foundational texts (modules 1–3), assignment pages, exhibits, quiz and reflections per module, capstone | about $0.60–1.10 |
| 2. "Add quiz and reflections" on one older fictional course already on the test port | quiz and reflections per module | about $0.03–0.07 per module |
| **Total** | | **about $0.70–1.30** |

Hard caps: `DAILY_BUDGET_USD = 1.5` on the test Worker (it refuses new calls past that), and a **$2 spend limit** on the Anthropic test workspace. If the cap is reached the run stops and says so; nothing is charged beyond it.

## What you do (about 10 minutes)

If the `sovereign-ai-test` Worker from the earlier real-API test still exists, reuse it (steps 2, 4 and 5 only). Otherwise follow `docs/REAL-API-TEST.md` steps 1–4 first.

1. **Anthropic Console.** In the test workspace, set the spend limit to **$2**. Use its API key (or create a new one).
2. **Cloudflare → Workers → `sovereign-ai-test` → Edit code.** Replace everything with the contents of `worker/worker.js` from this folder (`VERSION = 19`). Deploy.
3. **Secrets** (only if new): `ANTHROPIC_API_KEY` = the test key; `ACCESS_CODE` = a throwaway code you invent.
4. **Variables:**

   | Name | Value |
   |---|---|
   | `ALLOWED_ORIGINS` | `http://localhost:8779` |
   | `DAILY_BUDGET_USD` | `1.5` |
   | `MAX_MODULES` | `3` |
   | `LIMIT_GEN_PER_IP_DAY` | `2` |
   | `LIMIT_GEN_PER_IP_HOUR` | `2` |

5. Open `https://sovereign-ai-test.<your-subdomain>.workers.dev/health`. It should show `"version": 19` and `"configured": true`.
6. Tell me "test Worker ready" and approve the cost above. Then, in the browser pane on `http://localhost:8779`, you type the test Worker address and your throwaway access code into AI settings yourself.

## What I then check (and report, with the actual cost)

- Every quiz question is answerable from the reading it names (I open the reading and compare), the right answer is right, and wrong options are clearly wrong. Readings that could not be opened are listed, and a quiz from key ideas says so.
- The three reflection questions are specific to the module, one per stage, not generic.
- The typed text appears in module 1 marked "Foundational", with a checked official link or "link needed"; no Wikipedia, no invented links.
- Assignment summaries read well in the list.
- Locks: Apply opens only after the quiz is passed; the module completes only with three reflections.
- The usage table shows the real cost of each step.

Afterwards: lower `DAILY_BUDGET_USD` to 0 or delete the test Worker if you prefer. Production stays on v18 until you approve the build 34 release.

## Part 2: quizzes from PDF readings (approved plan; needs your OK for the cost)

1. **Cloudflare → `sovereign-ai-test` → Edit code**: paste the new `worker/worker.js` (still `VERSION = 19`; it now has `/fetch-pdf`). Deploy. Do **not** touch `sovereign-ai`.
2. **Variables**: set `DAILY_BUDGET_USD` to `1.65` if you run it today: the budget counts the whole UTC day, and today's first run already used about $1.12, so this leaves about $0.50. After midnight UTC, use `0.5`. Optional: `LIMIT_PDF_PER_IP_DAY` (default 150). Keep `ALLOWED_ORIGINS` = `http://localhost:8779`.
3. `/health` should still show `"version": 19`.
4. Tell me it is redeployed. In the browser pane I then click "Rewrite quiz from readings" on the 3 modules of the AML test course (each asks first). **Estimate: about $0.15–0.25, cap $0.50.** I will check every question against the PDF passage it came from, and list what could not be read and why.
