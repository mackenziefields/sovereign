# Phase 2: Evidence packets (revised spec, awaiting final approval)

Status: proposal only (revision 2). No code changed. Nothing committed, pushed, deployed or paid for.

Goal: Sovereign builds the whole exercise. When an assignment needs a case file, article, transcript, dataset or chart to be doable, Sovereign writes it, presents it as a professional evidence packet, and later reviews the learner's work against it. The learner never has to find or invent the material.

Phase names (adopting your grouping): **2A Evidence Architect** (what Sovereign creates) -> **2B Evidence Workspace** (how the learner works with it) -> **2C Evidence-Aware Review** (how Sovereign evaluates against it) -> **2D Learner import** (deliberately last, see section 9).

## 1. Principles
1. Exhibits are structured data. The app renders them from validated, bounded components. Never AI-written HTML.
2. Fictional material is stored, shown and exported verbatim. Nothing is cleaned, deduplicated, corrected or normalized behind the learner's back.
3. Nothing is invented to fill a gap. A chart skips what it cannot read and says so.
4. Supplied exhibits and learner-added exhibits are separate in the data and the interface.
5. Additive only. Old assignments have no exhibits and display their text `materials` exactly as today. Instructions, submissions, grades and feedback are never rewritten by this feature.

## 2. Schema (additive, on the assignment)

```
assignment.exhibits       = [Exhibit]     // supplied packet
assignment.packet         = { state: 'none'|'required'|'ready'|'incomplete'|'declined',
                              plan: [{ title, type, purpose }],   // what the generator said it would build
                              at, model, upgraded: bool }          // upgraded = added to an existing text-only assignment
assignment.myExhibits     = [Exhibit]     // 2D only, origin 'user'

Exhibit = {
  id:'A'..'F'  origin:'supplied'|'user'  type:'table'|'timeline'|'chart'|'document'
  title(<=120)  source(<=200 provenance label)  fictional:bool (forced true for AI-written)  purpose(<=300)

  table?:    { columns:[{key,label,kind:'text'|'number'|'date'|'percent',unit?}],
               rows:[{id:'A-1', cells:{key:string}}] }           // verbatim strings; '' = missing
  timeline?: { events:[{id:'C-1', date:string, label, detail?}] }
  document?: { kind:'article'|'memo'|'policy'|'transcript'|'correspondence'|'report'|'case-file'|'notes'|'other',
               meta:[{label,value}]        // up to 8: From, To, Date, Re, Docket no., Interviewer...
               blocks:[Block] }
  chart?:    { kind:'bar'|'line'|'share', calc: Calc, xLabel, yLabel, unit, method }
  file?:     { fileId, name, size }        // 2D only: the learner's original upload (IndexedDB)
}

Block (document body; ids assigned by code, e.g. 'B-p3'):
  { t:'heading', level:2|3, text }      { t:'paragraph', text }      { t:'list', ordered:bool, items:[text] }
  { t:'quote', text, by? }              { t:'turn', who, text }      // transcripts / correspondence threads
  { t:'note', label, text }             // stamps and marginalia, e.g. "Received 3 March", "Draft"
  { t:'rule' }
  All text is plain text. No markup, links or images in 2A. The renderer builds DOM nodes with textContent only.
```

Prototype limits (all configurable, defaults documented as prototype limits): 6 exhibits per assignment; 12 columns and 80 rows per table; 200 rows per packet; cells <=120 chars; 40 timeline events; document <=1,800 words, 60 blocks; chart series <=60 points.
Configuration: Worker env `EXHIBIT_MAX_EXHIBITS`, `EXHIBIT_MAX_ROWS`, `EXHIBIT_MAX_PACKET_ROWS`, `EXHIBIT_MAX_DOC_WORDS` (clamped to hard ceilings so a typo cannot create an unbounded call) and the same names in `js/config.js` for the app's validation and display. Over-limit content is rejected, never silently truncated.
Row ids and block ids are assigned by code, stable, and used for citations in 2C.

## 3. Charts: deterministic calculations
A chart stores a recipe, never numbers. Values are computed at render time from the source tables by `js/exhibits.js`.

```
Calc = { fn: 'none'|'count'|'sum'|'mean'|'median'|'percent'|'rate',
         from: exhibitId, x: colKey (category or date), y?: colKey,
         groupBy?: colKey,
         per?: { from: exhibitId, col: colKey, join: colKey, agg: 'sum'|'count', scale: 1|100|1000|100000, label }  // denominator for 'rate'
       }
```
- `count`: rows per category. `sum`, `mean`: of y per category. `median`: middle value; even counts average the two middle values (method line says so).
- `percent`: each category's share of the total of y (or of row count); denominator = the sum shown in the method line.
- `rate`: numerator per category (sum or count of source rows) divided by the denominator exhibit's value for the same join key, times `scale`, always labelled "per 100 renter households" style from `per.label`.
- Number reading is strict and documented: thousands commas allowed; `$` and `%` accepted only when the column kind says currency or percent; everything else ("about 40", "N/A", blank, "1.2k") is unreadable.
- Unreadable values, categories with no matching denominator, and zero denominators are excluded from the chart and listed beneath it by row id. Nothing is estimated or filled.
- Charts compute on the raw data as supplied, including duplicate-looking rows. Under each chart: "Computed from the data exactly as supplied. It has not been cleaned." plus the formula, the units, the source exhibit and the count of rows used and excluded.
- Every chart has labelled axes or categories, units, a text summary, and its data table always present (screen readers) and toggleable visually.
- Kinds stay bar, line and share (horizontal proportional bars; no pie). Charts with no valid recipe fall back to their data table with a note.

## 4. Unsafe spreadsheet values: store verbatim, format only at export
- Storage never changes: a cell like `=SUM(A1)` or `-cash` is kept exactly as the AI or the learner wrote it, and displays as text.
- CSV downloads offer two clearly named choices on every table: **Download CSV (spreadsheet-safe)** and **Download CSV (exact original values)**.
  - Safe export prefixes an apostrophe to cells starting with `=`, `+`, `@`, tab, carriage return, or `-` when the cell is not a plain number, so Excel and Sheets read them as text.
  - The UI says how many cells the safe export formatted ("2 cells were written as text for spreadsheet safety. Your stored data is unchanged") and the exact-values option carries a one-line warning.
- Both: RFC 4180, UTF-8 with BOM, header row, optional `row_id` column, fictional label as a final comment-free line in the on-screen notice (not inside the file, so the data stays pure).
- A round-trip test proves the exact-values CSV parses back to the stored strings byte for byte.

## 5. Automatic generation in the course-creation workflow
Today (`js/ai-client.js`): `ai.build` makes the outline, then for each module `findMaterials` and `writeDetails` (`/details`), which writes each assignment's page, with a plain-text `materials` field for scenario and portfolio assignments.

### How Sovereign decides an assignment needs exhibits
Two layers, so it does not depend on the model remembering:
1. **Code rule (deterministic).** `needsPacket(a)`: assignment is not `learn`, not `realEvidence`, and its basis is `scenario` or `portfolio` -> a packet is required. `learn` and real-evidence assignments never get one (real-evidence tasks keep "Source needed" behaviour; nothing is invented for them).
2. **Plan (model, validated by code).** `/details` is extended to return a short `exhibitPlan` per required assignment: 1 to 6 entries `{ title, type, purpose }`. This is how a "reference document but no numbers" assignment gets exactly one Document exhibit (for example "Exhibit A: Mayor's draft memo", "Exhibit B: Interview transcript, tenant organizer"), and a data assignment gets tables plus a chart. Code checks every type is allowed and the count is within limits; an empty or invalid plan on a required assignment is "incomplete", never "none".
3. **Cross-check.** If the overview or steps mention an exhibit that the plan lacks (for example "Exhibit B" or "the attached spreadsheet"), the assignment is flagged `incomplete` rather than shipped with a dangling reference.

### Generation
- New Worker step `/exhibits`, one call per required assignment, run inside `ai.build` right after `writeDetails` for that module. Separate from `/details` so the large-output tables and documents do not crowd the assignment page, and so a failed packet never loses the assignment text.
- Input: assignment title, stage, overview, steps, rubric criteria names, the `exhibitPlan`, module key ideas, readings titles, and (for upgrades) the existing text materials. Output: the exhibits without ids; code assigns ids, forces `fictional`, validates and drops invalid exhibits with a reason.
- The existing text `materials` for new courses becomes a one-paragraph scenario framing; the packet carries the body. Existing courses keep their text untouched.
- Coherence rules in the prompt: shared names and keys across exhibits so joins work; deliberate defects exist only when the task asks the learner to find them and are findable by inspection; no exhibit contradicts the overview; documents read as the real genre (a memo has From/To/Date/Re, a transcript has timestamped turns).

### Progress and completion status (accurate, not optimistic)
- Course-build progress gets a per-module sub-step: "Exhibits: <module> (2 of 3 packets)". A step is `done` only when every required assignment in that module has a valid packet.
- `course.ai.status` becomes `partial` if any required packet is `incomplete`; the note names the count ("2 assignments still need their materials packet") and the fix ("open the assignment, Materials, Build materials packet").
- The assignment shows a visible "Materials packet incomplete" state; it is never presented as ready. The builder retries once automatically, as it does for details, and stops cleanly on limit, budget or cancel errors (same `STOP` list).
- "Add / rebuild exhibits with AI" in the Materials tab is the fallback and customization route (extra instructions such as "make the dataset messier", "add a landlord table"), always with preview before saving.

## 6. Upgrading existing assignments (example: Analyze the Fictional Riverton Eviction Dataset)
Nothing is regenerated automatically. In the Materials tab of a text-only assignment: **Upgrade to an evidence packet**.
1. The app calls `/exhibits` with the assignment's current overview, steps, rubric criteria and its existing text materials, with the rule: every figure, name and date already stated in the existing materials must appear unchanged in the packet; new rows may add detail but not contradict it.
2. The result is a **draft held in memory only**. A preview screen shows every proposed exhibit as the learner would see it, the validation notes (dropped or invalid parts), the calculation recipes, and the list of figures carried over from the existing text. Nothing is saved yet.
3. Buttons: **Approve and add**, **Regenerate with notes** (a free-text customization), **Discard**. Approve writes `exhibits[]` and `packet`; it does not modify `description`, `parts` (steps), `rubric`, `materials`, `work`, `score`, feedback, revisions or Office Hours data.
4. The original text stays visible under "Original supplied text (kept)" and can be hidden but not deleted by the upgrade. "Remove packet" restores exactly the previous state because nothing else was changed.
5. If the assignment already has submitted work, the preview warns: "Your submission was written against the original text. The packet keeps its figures, but check it before relying on it. Existing feedback and grades will not change." Reviews written before the upgrade stay as written; later reviews see the packet (2C).
Acceptance includes running this flow on the Riverton fixture with a submission and a grade present, then confirming byte-identical instructions, submission, grade and feedback before and after.

## 7. The Materials tab as an evidence workspace
Design language: a case file, not a form. Shares the Review Studio's editorial system (theme display type for exhibit titles, restrained surfaces, hierarchy by spacing and type, minimal borders, >=16px body text, no tiny all-caps metadata).
- **Exhibit navigator:** a compact rail of lettered markers (A B C D) with short titles, sticky within the reference pane, keyboard-operable as tabs. On phones it becomes a horizontally scrollable strip pinned above the exhibit.
- **Exhibit plate:** each exhibit opens with its letter, title, one-line purpose, a quiet provenance line, a clear "Fictional" mark, and its actions (Download CSV, Show data).
- **Documents:** rendered as paper with a letterhead-style meta block (From/To/Date/Re), headings, readable measure (about 66 characters), transcripts as speaker turns with a hanging label, notes as marginal stamps. Genre changes presentation, not security.
- **Tables:** real `<table>` markup with scoped headers; tint rows rather than boxing cells; tabular numerals; sticky header and first column; horizontal scroll on phones; row id shown as a quiet gutter reference learners can cite.
- **Charts and timelines:** inline SVG using theme tokens, direct labels, data table underneath; timeline is a vertical rail on all sizes.
- **Four themes:** The Modernist, The Editorial, The Intellectual and The Institution change display type, signature colour and plate styling through the existing `data-theme` tokens, one implementation.
- **Never losing the work:** exhibits open in the reference pane. I will confirm in code how the workbench currently lays out the reference pane and the submission workspace; if they stack on desktop, the plan includes a side-by-side mode so the brief, exhibits and submission stay visible together. On phones the existing tab pattern is kept with a "Back to my work" return.
- **Design checkpoint (required before the visual work is called complete):** after 2A's functional rendering, I show desktop and mobile mock states of the Riverton packet (table, chart) and a document packet (memo plus transcript) in at least two themes, and wait for your approval of the art direction before the 2B polish.

## 8. Phases, files and acceptance criteria

### 2A Evidence Architect (build 26)
Files: `js/store.js` (defaults, `normExhibits`, backups, revision snapshots), `js/exhibits.js` (new: validation, limits, calc engine, CSV, safe/exact export, renderers), `css/exhibits.css` (new), `js/config.js` (limits), `js/workbench.js` (Materials tab rendering, status chips), `js/ai-client.js` (`needsPacket`, `/exhibits` call inside `ai.build`, progress steps, status/notes, upgrade and rebuild flows with preview), `js/views-ai.js` (progress labels), `worker/worker.js` (v15: `/exhibits`, `exhibitPlan` in `/details`, validation, env limits), `worker/mock/harness.js`, `sw.js`, `index.html`, `ROADMAP/CHANGELOG/TESTING`.
Acceptance:
1. Old assignments, backups, grades, submissions and feedback unchanged (before/after snapshot compare).
2. Course build (mock) produces packets for scenario/portfolio assignments, none for learn and real-evidence ones; a document-only assignment gets Document exhibits and no table; a data assignment gets tables and a chart.
3. Progress and final status are accurate: forced failures (invalid plan, invalid exhibit, API limit, cancel) leave the course `partial` with a specific note and a working retry; no "ready" message while a required packet is missing.
4. Riverton fixture: Exhibit A raw filings with intentional duplicates, a misspelled name, blanks and an implausible figure; B renter households; C rental units by landlord; D a rate chart. Every value the AI wrote is in storage and in the exact-values CSV byte for byte (automated round trip). Chart D values match a hand calculation, list excluded rows, show the formula, units and denominator.
5. All calc functions (count, sum, mean, median, percent, rate) have deterministic unit tests including empty, unreadable, zero-denominator and unmatched-key cases.
6. Safe CSV formats only the risky cells, reports how many, and leaves stored data untouched; exact CSV is byte-identical.
7. Document rendering uses only the block types; hostile strings (`<script>`, `javascript:` text, very long words) render inert.
8. Upgrade flow on Riverton with a submission and grade present: preview first, nothing saved until Approve, Discard leaves everything identical, Remove packet restores the prior state.
9. Limits are configurable and enforced (over-limit rejected with a reason, not truncated); documented as prototype limits.
10. Basic accessibility: tab order, table scopes, chart summary and data table, contrast, reduced motion. Functional layout at 375px and desktop.
11. Design checkpoint screens delivered and approved before 2B.

### 2B Evidence Workspace
Navigator, plates, document/table/chart/timeline polish, theme art direction, side-by-side reference layout, mobile refinement, screen-reader pass. Acceptance: approved designs implemented, all four themes, no loss of brief/submission context, keyboard and contrast audited.

### 2C Evidence-Aware Review
Worker `/review` receives exhibits as compact addressable rows and blocks (`[A-3] landlord=... | filed=...`, `[B-p2] paragraph text`) inside its size budget; oversized exhibits are sampled with a stated "first N of M rows" so the reviewer never claims to have seen the rest. Findings gain optional `ref {exhibit, row|block, column}`; code verifies the exhibit, id and column exist, otherwise drops the ref and keeps the finding as unlocated (as for quotes). Review Studio shows "Exhibit A, row A-7, Landlord" under the quote. 1A-1C rules unchanged. Real-AI test only with your approved estimate and cap.

### 2D Learner import (last)
CSV/XLSX import on the device with preview, column confirmation, original file kept, stored in `myExhibits`, labelled "Added by you", local unless a per-review consent names it and shows its size. Never overwrites supplied exhibits or submissions. Starts only after 2A to 2C are stable.

## 9. Changes from the previous revision
- Added the Document exhibit type, the calc engine (median, percent, rate), automatic course-creation generation with detection and honest progress, an upgrade-with-preview flow, configurable limits, and the safe/exact export split (previously unsafe cells were rejected, which would have altered data).
- Moved learner import from 2B to a new 2D after review integration, following your priority on AI-supplied materials. 2B is now the workspace and design phase. Say if you would rather keep import in 2B.

## 10. Technical and cost implications (estimates, not measurements)
- **More calls per course.** One `/exhibits` call per required assignment, plus one per module in the existing flow. The only real course build measured so far (TESTING.md, R11) was 9 calls and about $0.53 for a three-module course. A packet is mostly output tokens (tables and documents), so I expect roughly $0.05 to $0.12 per packet; with 1 to 2 packets per module that adds about $0.15 to $0.70 to a three-module course. This is a guess to be replaced by a measured number in a capped test, and I will give you a dollar estimate and cap before any paid call.
- **Limits will bind sooner.** Per-IP request limits (120/day), the generation limits and the shared daily budget ($5) all count these calls. The course builder already stops cleanly on limit errors; the new status wording must say "packets pending" rather than "failed". You may want to raise `LIMIT_REQ_PER_IP_DAY` on the test Worker.
- **Latency.** A course build takes longer (one extra sequential call per module at least). Progress shows the sub-steps.
- **Worker v15 is required** for exhibits. Older Workers return none; the app says so plainly and the assignment keeps its text materials.
- **Storage.** About 200 rows plus documents per assignment is small against the localStorage limit; I will measure on the seeded course. Learner uploads (2D) live in IndexedDB and are not in backups, as now.
- **Review cost.** Exhibits add input tokens to each review (bounded by the size budget); expect a modest per-review increase to be measured in 2C.
- **Risk:** model-written packets can be inconsistent with their instructions. Mitigation: the plan-versus-overview cross-check, validation, the preview-and-approve path for existing assignments, and the real-AI test in 2C before this is relied on.
