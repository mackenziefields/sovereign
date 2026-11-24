# Sovereign AI service: setup guide (beginner friendly)

This folder holds the small private "backend" that lets Sovereign's **Build with AI** feature work. Your Anthropic key lives here, never in the public app. Nothing in this folder contains a secret, so it is safe to upload with the rest of the project.

You do these steps yourself in your browser. Nothing here is deployed for you, and nothing runs until you do it. Plan on 30-45 minutes. Do the steps in order.

## What you will create

1. An **Anthropic account + API key + monthly spend limit** (the AI itself).
2. A **Cloudflare account** with one **Worker** (a tiny program that guards your key) and one **KV namespace** (a small storage box used to count usage).
3. Two **secrets** (your API key and an access code you invent) stored in Cloudflare.
4. The Worker's web address pasted into the app.

Cost: Cloudflare's free plan is enough for a private beta. Anthropic charges per use. A first course is estimated to cost well under a few dollars, but **that is an estimate; the app records what each course actually used so you can see the real number** (Data & Backup → AI).

---

## Step 1. Anthropic: key and spending limit

1. Go to **console.anthropic.com** and sign in or create an account.
2. Add a payment method / credits under **Billing**.
3. **Set a spend limit first** (Billing or Limits → set a monthly limit, for example $10). This is your real safety net: even if something goes wrong, spending stops there.
4. Go to **API keys → Create key**. Name it `sovereign-worker`. **Copy the key now** (it starts with `sk-ant-`) and keep it somewhere private for the next steps. You cannot view it again later. Never paste it into the app, a chat, or a file in this project.

## Step 2. Cloudflare: account and Worker

1. Go to **dash.cloudflare.com** and create a free account.
2. In the left menu choose **Workers & Pages → Create → Create Worker** (wording may vary slightly). Name it `sovereign-ai`. Click **Deploy** (this deploys a placeholder, which is expected).
3. Click **Edit code**. Delete everything in the editor. Open `worker/worker.js` from this project, copy **all** of it, paste it into the editor, and click **Deploy** (top right).

## Step 3. Create the usage counter (KV)

1. Left menu: **Storage & Databases → KV → Create a namespace**. Name it `sovereign-usage`.
2. Open your Worker → **Settings → Bindings → Add → KV namespace**.
   * **Variable name:** `USAGE` (exactly, capital letters)
   * **KV namespace:** `sovereign-usage`
   * Save / Deploy.

## Step 4. Add the two secrets

Worker → **Settings → Variables and Secrets → Add**. Choose type **Secret** for both (so they are hidden):

| Name | Value |
|---|---|
| `ANTHROPIC_API_KEY` | the `sk-ant-...` key from Step 1 |
| `ACCESS_CODE` | a long passphrase you invent, such as four random words and a number. This is the shared code you give to beta testers. |

Deploy again if the page asks.

## Step 5. Allow your website

Add one more variable, type **Text** (not secret):

| Name | Value |
|---|---|
| `ALLOWED_ORIGINS` | `https://mackenziefields.github.io` (add other addresses separated by commas, e.g. `,http://localhost:8765` if you test locally) |

This only stops *other websites* from using your service in a browser. It is **not** a password. The access code is what protects you.

## Step 6. Check it is alive

Open `https://sovereign-ai.YOUR-NAME.workers.dev/health` in a browser (your Worker's address is shown on its overview page). You should see something like:

```
{"ok":true,"configured":true,"maxModules":8,"models":{"outline":"claude-sonnet-5-5","light":"claude-haiku-5-5"}}
```

`"configured":false` means the key, code, or `USAGE` binding is missing.

## Step 7. Connect the app

Easiest: open Sovereign → **Data & Backup → AI**, paste the Worker address and your access code, press **Save**, then **Test connection**. These are kept only in that browser.

Optional: put the address in `js/config.js` (`aiUrl`) so you don't have to paste it on each device. The access code is never put in a file.

## Step 8. Your first real test (this is where real money is first spent)

In the app: Dashboard → New course → **Build with AI** → type `Entrepreneurship`, level "Brand new", goal "Prepare for a job or career move" → **Build my course**. Wait a few minutes. Then open the course's **Syllabus** page → "How this course was built" for the real token counts and estimated cost, and compare with Anthropic Console → Usage.

---

## Settings you can change (Worker → Settings → Variables, Text type)

Everything has a safe default. Change only when you want to.

| Name | Default | Meaning |
|---|---|---|
| `MODEL_OUTLINE` | `claude-sonnet-5-5` | Model that writes the syllabus, modules, assignments. Try a stronger model here later with no code changes. |
| `MODEL_LIGHT` | `claude-haiku-5-5` | Model for follow-up questions and finding resources. |
| `MAX_MODULES` | `8` | Hard ceiling on modules per course (2-12). The app cannot exceed it. |
| `MODEL_REVIEW` | *(blank: same as `MODEL_OUTLINE`)* | Model that reviews and grades submitted work. |
| `LIMIT_REVIEWS_PER_IP_DAY` | `20` | AI reviews of submitted work from one network per day. |
| `LIMIT_GEN_PER_IP_HOUR` / `_DAY` | `3` / `8` | Courses one network can start. |
| `LIMIT_REQ_PER_IP_DAY` | `120` | All AI calls from one network per day (a course uses roughly 1 + one per module). |
| `LIMIT_REQ_GLOBAL_DAY` | `400` | All AI calls from everyone per day. |
| `DAILY_BUDGET_USD` | `5` | Estimated spend per day (UTC) across everyone; new calls are refused once reached. |
| `PRICES` | JSON | **Placeholder prices.** Set the real per-million-token prices from Anthropic's pricing page, e.g. `{"claude-sonnet-5-5":[3,15],"claude-haiku-5-5":[1,5]}` as `[input, output]`. |
| `SEARCH_COST_USD` | `0.01` | **Placeholder** cost per web search. Check Anthropic's pricing page. |
| `WEB_SEARCH_TOOL` | `web_search_20260209` | If Haiku rejects this version, try `web_search_20250305`. |
| `EFFORT_OUTLINE` | `medium` | `low`, `medium`, or `high` (quality vs. cost). Blank to omit. |
| `ANTHROPIC_VERSION` | `2023-06-01` | API version header. |
| `OUTPUT_FORMAT` | `on` | `off` if schema-constrained output is ever rejected (the Worker also retries without it automatically). |

## How the protections work (and their limits)

* **Access code:** compared in constant time; 10 wrong guesses per hour per network locks that network out for the hour.
* **Limits** are enforced inside the Worker, not by the app. They use KV, which is *eventually consistent*, so a burst of simultaneous requests can exceed a limit slightly. **The Anthropic spend limit from Step 1 is the hard cap.**
* KV's free plan allows 1,000 writes/day; each AI call uses two. That's roughly 500 calls a day, which fits a small beta.
* **Link checking** only contacts `https` addresses on port 443, never IP addresses, `localhost`, or private/internal names, re-checks each redirect, resolves the host through DNS-over-HTTPS and refuses private ranges, times out in 5 seconds, and reads at most 64 KB. A residual risk is DNS changing between the check and the request; Cloudflare's own network also blocks Workers from internal addresses.
* **Resource honesty:** every link shown comes from the search tool's actual results (the Worker discards any link the AI "remembers"). "Link responded" only means a page loaded; it does **not** mean the page teaches what is described. The AI's reason it fits is labeled as the AI's opinion.
* **Privacy:** only what the person types into the Build with AI form (and module titles/objectives when finding materials) is sent. No uploaded documents are supported in this version.
* A shared access code is fine for a private beta. A public launch needs real sign-in and per-person quotas.

## Moving to a normal developer workflow later

`worker/worker.js` is one file with numbered sections (`=== 1. CONFIG ===` … `=== 11. ROUTER ===`) so it can be split into modules. `wrangler.example.toml` shows the equivalent configuration for the `wrangler` command-line tool (`wrangler secret put ANTHROPIC_API_KEY`, `wrangler deploy`).

## Testing without any accounts

`worker/mock/harness.js` runs the real Worker code inside a browser page with fake storage and **canned** AI/web answers. It tests the Worker's rules and the app's screens. It does **not** test real AI quality or real web search. See the project README.

## Reviews of submitted work (`/review`)

Added for assignment feedback. Text up to 30,000 characters, or one PDF/image (about 2 MB; the Worker rejects more than ~3 MB of base64). The work is passed to Claude and is not stored or logged by the Worker. The score is recomputed by the Worker from the per-criterion scores, never taken from the model's own total. Large uploads cost more Worker CPU than the free plan's 10 ms allows if a request is slow to parse; if real PDF reviews fail with a Cloudflare error (1102 or similar), tell the developer. After pasting the new `worker.js`, nothing else needs to change.
