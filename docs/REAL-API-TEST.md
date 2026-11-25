# Capped real-API test: setup (approved plan)

Goal: one real course build and two real reviews, against a **separate temporary Worker**, with a hard cap of **$2.00**.
The production Worker (`sovereign-ai`) is not touched. Never paste an API key or access code into chat or into any file.

## What you do (about 10 minutes, in the Cloudflare and Anthropic dashboards)

1. **Anthropic Console.** Create a new workspace (for example "sovereign-test") with a **spend limit of $3**, and create a new API key in it. Keep it for the next step only.
2. **Cloudflare, Workers & Pages.** Create a new Worker named `sovereign-ai-test`. Replace its code with the whole contents of `worker/worker.js` from this folder (it is `VERSION = 9`). Deploy.
3. **KV.** Create a new KV namespace (for example `sovereign-test-usage`) and bind it to the Worker with the variable name **USAGE**. (A new namespace, so production counters and budget are unaffected.)
4. **Secrets** (type *Secret*): `ANTHROPIC_API_KEY` = the new test key; `ACCESS_CODE` = a new throwaway code you invent.
5. **Plain variables:**

   | Name | Value |
   |---|---|
   | `ALLOWED_ORIGINS` | `http://localhost:8765` |
   | `DAILY_BUDGET_USD` | `2` |
   | `LIMIT_GEN_PER_IP_DAY` | `2` |
   | `LIMIT_GEN_PER_IP_HOUR` | `2` |
   | `MAX_MODULES` | `3` |
   | `LIMIT_REVIEWS_PER_IP_DAY` | `3` |

6. Open `https://sovereign-ai-test.<your-subdomain>.workers.dev/health` in a browser. It should show `"ok": true`, `"version": 9`, `"configured": true`, `"maxModules": 3`.
7. Tell me the Worker URL (not the code or key). Then in the preview app (Data & Backup, AI settings) you type the URL and the access code yourself.

## What I do after you say it is ready

One build only, using the brief in the approved plan (beginner Feminist Theory, 3 modules). I will stop at the first failure and report. Then two reviews (one Learn-style text, one file-only check is skipped to save cost). I report calls, tokens and cost per step from the course's usage ledger, and you compare the total with the Anthropic console.

## Afterwards (you)

Delete the `sovereign-ai-test` Worker and its KV namespace, and delete the test API key (or the whole workspace).

## Not covered

The test Worker's usage counters are estimates (the Worker's own price table, and a search price marked unverified). The Anthropic console is the authority on cost.
