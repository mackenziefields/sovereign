# Testing record

Every entry says **how** it was tested, because the methods differ in strength.

| Label | Meaning |
|---|---|
| **Browser** | Run in the built-in browser against a local copy, with seeded browser storage. Real rendering and real DOM events. |
| **Mock** | Run against `worker/mock/harness.js`, which runs the real `worker.js` in the page with a canned Anthropic reply. Proves plumbing and validation, **not** AI quality. |
| **Inspection** | Read the code or output. Proves nothing about behaviour. |
| **Real API** | Real Cloudflare Worker and real Anthropic calls. |
| **User-reported** | The product owner tested on the live site and told me the result. I did not observe it. |

Not yet done anywhere: **automated test suite** (there is none), **real-device phone testing**, **accessibility audit with a screen reader**, **real-API testing by me** (the Worker's `ALLOWED_ORIGINS` allows only the GitHub Pages site, so local pages cannot call it).

## Baseline for Phase 1 (build 17, run 2026-11-24)

| # | Check | Method | Result |
|---|---|---|---|
| B1 | Export, import and normalize leave data unchanged (4 courses, 9 modules, 10 assignments) | Browser | Pass |
| B2 | All 47 routes render for every course, module and assignment with no uncaught errors | Browser | Pass |
| B3 | All 31 service-worker precache entries are reachable | Browser | Pass |
| B4 | No horizontal overflow across 4 designs × 7 routes at 375 px width | Browser | Pass |
| B5 | New courses get a random design (4,000 draws ≈ 25% each); manual creation gets one; old backups default deterministically; invalid values fall back | Browser | Pass |
| B6 | Changing a course design alters no other course data | Browser | Pass |
| B7 | Submissions, 72-hour review, grading and finalization | Mock | Pass (earlier sessions) |
| B8 | Submissions and review with real AI, real PDFs and images | User-reported | Reported working; I have not observed it |
| B9 | Course building with the real Worker and real AI | User-reported | Reported working ("so much better and 10x more functional") |
| B10 | Offline use after first load | Not tested | Service worker present; offline behaviour not exercised by me |
| B11 | Phone layouts | Browser at 375 × 812 emulation | Looked correct; not a real device |

## Phase 1A: Module Studio (build 18, run 2026-11-24, seeded test course "Independent Journalism")

| # | Check | Method | Result |
|---|---|---|---|
| A1 | No overflow at 375 px: 4 designs × 5 modules × 5 routes (default, learn, apply, demonstrate, wrap) = 100 pages | Browser | Pass |
| A2 | Back, Forward, deep link, refresh-style reload keep the chosen stage; unknown stage falls back to where the work is | Browser | Pass |
| A3 | Default stage follows Next Up (reading, then study task, then apply…) | Browser | Pass |
| A4 | Stage selector: Practice assignment (kind "") shows under Apply with selector on Practice; changing to Demonstrate moves it; other assignments' kind, work and score untouched; new assignment from a room starts in that room's stage | Browser | Pass |
| A5 | Arrow, Home, End keys move focus along the stage rail | Browser (synthetic key events) | Pass |
| A6 | Self-check ticks, Next Up, counts update after marking items | Browser | Pass |
| A7 | Visual review of all four designs on desktop (Learn, Apply, Demonstrate) and phone (Apply) | Browser, screenshots viewed by me | Looks as intended; one fix made (rail not sticky on phones) |
| A8 | No console errors during the above | Browser | Pass |

Not tested: real-AI "Find materials", Source readings, and writing assignment details from inside the studio (code paths unchanged, called from the same buttons); screen reader; real phone; colour contrast measured with a tool (designs follow the existing palette; Institution's gold-on-oxblood text is **not** measured); offline after first load.

## Phase 1B: Assignment Workbench (build 18, run 2026-11-24)

| # | Check | Method | Result |
|---|---|---|---|
| B1 | Why Independent Journalism has an empty Portfolio Studio and bare assignments: it is a manual example course (`ai.generated` false, every assignment `origin: user`, no kinds, no points) | Browser (data inspection) | Confirmed |
| B2 | Worker outline prompt requires a demonstrate assignment in every module; `courseFromOutline` keeps `kind`; the module-level Demonstrate assignment is separate from the course capstone stored in `work` | Inspection of `worker.js` and `ai-client.js` | Confirmed |
| B3 | Real client pipeline (`S.ai.build`: outline, resources, details) with the network call replaced by canned replies in the Worker's real output shape: every module gets learn, apply and demonstrate with full parts, materials, weighted rubric; Portfolio Studio lists them; capstone kept apart | **Mock** (schema-based, not a real Worker) | Pass |
| B4 | Older assignment ("Write an editorial charter"): notice names missing parts only; "Add details yourself" saves points, criteria and materials; title, description, kind and work unchanged; submission form appears once it has points | Browser | Pass |
| B5 | Full AI-shaped assignment: brief, steps, supplied material, weighted rubric, deliverable all shown on the right tabs | Browser | Pass |
| B6 | Draft survives tab switch and a full reload; consent is not restored; draft cleared on submit | Browser | Pass |
| B7 | Submit, first review (no grade shown), resubmit, final grade, Portfolio flag set, Studio shows Complete | **Mock** AI replies | Pass |
| B8 | 504 workbench pages (2 courses × 4 designs × all assignments × 7 tab routes) at 375 px: no overflow, workbench always rendered, no errors | Browser | Pass |
| B9 | Visual review: desktop (Intellectual, Institution) and phone | Browser, screenshots viewed by me | Looks as intended; fixed cramped step lists and phone spacing |

Still needs live verification: a **real Worker-generated course** (that Portfolio Studio fills from real AI output, and that real reviews return a `score` and `max` that finalize correctly); real file submissions (PDF, image, Excel) through the new tabs; Modernist and Editorial desktop screenshots were not separately inspected; screen reader; real phone; measured colour contrast; sticky submission pane on short laptop screens.

## Phase 1C: navigation and polish (build 18, run 2026-11-24)

| # | Check | Method | Result |
|---|---|---|---|
| C1 | No horizontal overflow on 131 to 136 routes (dashboard, My Work, Data, every course section, every module stage, assignment tabs) at 375, 768 and 1024 px | Browser | Pass (after fixing a 4 px overflow on My Work at 375) |
| C2 | Sidebar lists courses, marks the current one, takes its design accent; phone drawer opens and closes on a course link | Browser | Pass |
| C3 | Card controls hidden at rest, shown on keyboard focus (transitions are paused in the unfocused preview, so checked with transitions off); always visible with no hover (touch emulation) | Browser | Pass |
| C4 | Visual review: desktop course page (Institution), phone drawer | Browser, screenshots viewed by me | Looks as intended |

Not tested: real hover with a mouse, screen reader, real phone, measured contrast of the muted nav text (#6a6354 on cream), the other three designs' sidebar accents by eye.

## Phase 1 functionality audit (build 18, run 2026-11-24)

Goal: confirm the redesign (1A/1B/1C) removed or bypassed nothing. Statuses: **VW** Verified Working · **INL** Implemented but Not Live-Tested · **PW** Partially Working · **BM** Broken/Missing.
**No real Anthropic call was made.** Everything marked Mock ran the real `worker.js` in the page against canned model replies (`worker/mock/harness.js`). That proves plumbing, validation and enforcement, **not** that the real model writes complete assignments.

| # | Feature | Source | Implemented | Tested | Method / result | Status | Remaining issue |
|---|---|---|---|---|---|---|---|
| 1 | Full assignment pages written automatically at course build (overview, purpose, steps, materials, deliverable, format, weighted rubric, connections) | `ai-client.js` `build`/`writeDetails`, `worker.js` `/details` | Yes | Yes | Mock + Browser: Feminist Theory test course built; every module's learn/apply/demonstrate got full pages; saved; survived reload and stage navigation | VW (plumbing) / INL (real AI quality) | Real model output unverified by me; owner reported it works (User-reported) |
| 2 | "Write full assignment with AI" only as fallback | `views-course.js` `writeBtn`, `workbench.js` `gaps` | Yes | Yes | Browser: button appears only on thin/legacy/failed pages | VW | none |
| 3 | Failure is reported accurately, with recovery | `ai-client.js`, `views-ai.js` | Yes, **fixed in audit** | Yes | Mock failure injection. Found a pre-existing bug: a build whose assignment pages failed was labelled "complete"/"ready". Now `partial`, with a note, a toast and a banner; fallback button recovers | VW after fix | none |
| 4 | Worker keeps Learn / Apply / Demonstrate distinct | `worker.js` `/details` (basis per kind) | Yes | Yes | Mock with deliberately wrong replies: Learn materials stripped, Apply gets scenario, Demonstrate gets portfolio flag and note | VW (enforcement) | Fictional labelling is prompt-level only; added a UI caption for AI-written materials. "Real sources only if verified" is **not** in the Worker prompt (gap) |
| 5 | Demonstrate in every module, in Portfolio Studio, finalized work eligible for Portfolio, separate from capstone | `worker.js` outline, `studio.js`, `views-work.js` | Yes | Yes | Mock + Browser | VW | none |
| 6 | Office Hours: own material, round 1, feedback, round 2, feedback, no grade | `views-work.js` `officePanel`, `worker.js` office branch | Yes | Yes | Mock + Browser: two rounds, third blocked, graded record and `S.grade` unchanged, graded path still open. Worker office branch returns `score:0,max:0,criteria:[]` (**Inspection**, `worker.js:613-617`); UI hides scores | VW | none |
| 7 | Submission formats: text, CSV/MD, PDF ≤2 MB, image (downscaled to 1600 px), XLSX ≤5 MB, file-only for tables/charts | `views-work.js` `prepare`, `files.js` | Yes | Partly | Browser: `classify` for pdf/png/xlsx/csv/docx/heic; 3000×1500 PNG downscaled to 1600×800 JPEG; invalid xlsx gives a clear error. Limits and messages read by **Inspection** (`prepare`). Not driven through the upload dialog; real PDF and real xlsx files not tried | PW (helpers VW, UI path INL) | HEIC and DOCX are rejected for AI review with a message; they can be attached as evidence |
| 8 | AI-chosen format reflected in Workbench | `workbench.js`, `FORMAT_SENTENCE` | Yes | Yes | Browser: file-only Apply assignment shows the PDF/Excel/image requirement and the limits | VW | none |
| 9 | Graded workflow: review, 72-hour revision, weighted final grade, Grades page, Portfolio | `views-work.js`, `worker.js` `/review` | Yes | Yes | Mock + Browser (Worker recomputes score from criteria) | VW (plumbing) / INL (real model) | none |
| 10 | Existing data, themes, manual creation, saved courses | `store.js`, `views-course.js` | Yes | Yes | Browser: export/import round trip; 504 workbench pages and 131 routes, no overflow or errors | VW | none |
| 11 | Real Worker end to end | `worker.js` | Yes | **No** | Blocked: `ALLOWED_ORIGINS` allows only GitHub Pages | INL | Needs approved test plan (see report) |

**Did 1A/1B/1C remove, bypass or alter anything?** No feature was removed. The long module and assignment pages were replaced by the studio and workbench, and every action was carried over. One regression found and fixed (Learn study tasks lost their reorder buttons). `S.workPanel` is retained but unused. Two pre-existing issues fixed (item 3, and a missing fictional-material caption).

Not tested anywhere: screen reader, real phone, measured contrast, offline use, Windows/LF line endings versus the stable copy (check before commit).

## Content-integrity fixes (build 19, Mock + Browser, run 2026-11-24)

| # | Check | Method | Result |
|---|---|---|---|
| F1 | Mock build of a 2-module course through the real client and real `worker.js` v8: AI scenario/demonstrate materials start with the FICTIONAL line even though the canned model reply did not include it | Mock | Pass |
| F2 | Learn assignments get no materials; a `realEvidence` apply assignment gets no materials even though the canned reply supplied some | Mock | Pass |
| F3 | `realEvidence` assignment gets `evidence.status: verified` with 2 sources (links that responded, title matched); with no verified readings it becomes `needed` and the Materials tab shows "Source needed", no scenario | Mock + Browser | Pass |
| F4 | Rubric points still equal assignment points (5, 15, 15, 30) | Mock | Pass |
| F5 | File check messages for DOCX, HEIC, 3 MB PDF, 6 MB XLSX, text on a file-only assignment; PDF and PNG accepted | Browser | Pass |
| F6 | Choosing a .docx on the submit tab shows the reason, disables "Get AI feedback", keeps "Attach without AI feedback" | Browser | Pass |

These prove plumbing and enforcement only. Whether the real model sets `realEvidence` sensibly, and what the real search finds, is for the capped real-API test (`docs/REAL-API-TEST.md`).

## Capped real-API test (build 19, Worker v8 on a separate temporary Worker, run 2026-11-24)

Method: **Real API.** One course build and two reviews against `sovereign-ai-test` (origin `http://localhost:8765` only, $2 daily budget, throwaway key). Brief: beginner Feminist Theory, 3 modules, 6 weeks, 3 h/week, goal "understand". Test data lives only in the preview browser (course "Feminist Theory: A Beginner's Map of Ideas", FTA 101).

| # | Check | Result |
|---|---|---|
| R1 | Build ran end to end with no clicks on "Write full assignment with AI" | Pass: 231 s, status `complete`, note "1 module had no verifiable source" |
| R2 | 9 assignments, every one with overview (1,000-1,450 chars), 3-4 numbered steps, submission line, format, weighted rubric summing to the assignment's points | Pass (8+15+25, 8+15+25, 8+18+35) |
| R3 | Saved and persisted after a full page reload (read back from browser storage) | Pass |
| R4 | Learn (M1): works from the module reading, no materials | Pass |
| R5 | Apply (M1): three fully written fictional scenarios (1,736 chars), labelled FICTIONAL by the model itself | Pass (strong) |
| R6 | Demonstrate (M1): comparative chart plus explainer, format `file` (so PDF/Excel/image), portfolio note, distinct from the course capstone ("A Personal Guide to Feminist Theory") | Pass |
| R7 | Stages: all three appear in Reading Room, Case Lab and Portfolio Studio | Pass (screenshots viewed) |
| R8 | Real-evidence handling: the model set `realEvidence` on 2 assignments in Module 3; with no verified readings they show "Source needed" and no scenario was invented | Pass |
| R9 | Real graded review (round 1) of a 4-sentence summary: 4.5 / 8 with four rubric-weighted criteria, grade recomputed by the Worker; stored work untouched | Pass |
| R10 | Real Office Hours review: feedback returned, `score` 0, `max` 0, no criteria, stored office and grade data untouched | Pass |
| R11 | Usage: 9 build calls (1 outline, 5 resources including 2 automatic retries, 3 details; no details retries), 6 web searches, **$0.53** by the Worker's estimate; with the 2 reviews $0.58 total, against an estimate of $0.70 and a cap of $2.00. Anthropic console not yet compared | Pass (estimate) |

Problems found (not fixed yet; each needs a decision):
1. **Garbled reading titles.** Module 1's readings are titled "85 Feminist Perspective UNIT 7 FEMINIST PERSPECTIVES* Structure 7.0" and "2024" (page titles of a PDF and a news page). The assignments then cite them awkwardly ("Unit 7 reading (2024)").
2. **Module 3 had no readings** after two searches. Its Learn assignment honestly says "No readings are listed", then asks the learner to choose their own two sources, which departs from the Learn rule (work from the module's readings).
3. **Demonstrate assignments in Modules 1 and 2 supply no reference material.** They ask the learner to find two or more sources, because the current prompt allows that path. You asked for Demonstrate work that applies supplied reference materials.
4. Syllabus sources were found for Module 1 only (2), none for Modules 2 and 3.
5. Real-evidence assignments keep `basis: scenario` internally although no scenario exists (cosmetic).
6. Not tested live: file upload through the dialog with real PDF/XLSX/image files, a full two-round graded flow and Office Hours through the UI with real replies, offline use.

## Quality fixes (build 19, Worker v9, Mock, run 2026-11-24)

| # | Check | Method | Result |
|---|---|---|---|
| Q1 | `weakTitle` flags "2024", "85 Feminist Perspective UNIT 7 …*", "Unit-7.pdf" and all-caps titles; keeps normal titles | Browser (function copied into the page) | Pass |
| Q2 | Mock build with no search results: three resource searches per module (third with different words), then details; prompt carries the readings-missing instruction and the key ideas | Mock | Pass |
| Q3 | Details prompt carries the "MUST supply the reference material" rule for non-real-evidence Demonstrate; materials come back labelled FICTIONAL | Mock | Pass |
| Q4 | Second real build on Worker v9 ("Feminist Theory: A Beginner's Foundation", 229 s, status complete, 10 calls, 6 searches, **$0.54** by the Worker's estimate; running total for the test about $1.12): reading titles clean; Demonstrate in Modules 1 and 2 supplies a labelled fictional dossier (1,744 and 1,628 characters); Module 3's Apply and Demonstrate are real-evidence with 2 verified sources each; the module with no readings got a Learn task that says readings still need adding and does not ask the learner to find sources; all 9 pages persisted after reload | Real API | Pass |

## Phase 2: Academic Experience (build 20, run 2026-11-25; seeded test courses in the preview browser)

| # | Check | Method | Result |
|---|---|---|---|
| P1 | Syllabus, Grades and Portfolio for 3 courses (AI-built with data, a legacy manual course, a second AI course) × 4 designs × 375, 768 and 1024 px (108 renders): no horizontal overflow in the page body | Browser | Pass |
| P2 | 664 routes (every course section, module stage, assignment tab, plus Dashboard, My Work, Data) render with no uncaught errors | Browser | Pass |
| P3 | Grades: AI-graded rows have no inputs; a manual score typed into a row updates the assignment and Current Grade; restoring it leaves stored data byte-identical | Browser | Pass |
| P4 | Grades statuses (AI-graded, Feedback ready with the final-grade timing, Self-scored, Not graded), per-stage bars, per-module totals and the "feedback, not graded yet" notice | Browser, with seeded **mock** review data (not real AI) | Pass |
| P5 | Portfolio: a finalized Demonstrate piece appears as a plate with note, score, excerpt and expandable work and feedback; capstone, graded record and credentials sections render; empty states for a legacy course | Browser, mock review data | Pass |
| P6 | Syllabus: Course map, assessment split bar, Edit course details opens and cancels, Delete course is behind a fold | Browser | Pass |
| P7 | Visual review: desktop (Institution) of all three pages and the phone Grades cards, screenshots viewed by me; fixed print button contrast on the dark cover and the status note column on phones | Browser | Pass |
| P8 | Normalizing the full saved state changes nothing except one seeded mock criterion name longer than the existing 120-character limit | Browser | Pass |

Not tested: the print layout itself (rules read by **Inspection** only; the browser print dialog was not exercised), Modernist and Editorial desktop screenshots by eye (overflow-tested only), screen reader, real phone, measured colour contrast of the new status chips, real AI (no AI code changed).

## Phase 1 test plan
See the acceptance criteria in `docs/PHASE-0-AUDIT.md`.

## Known limitations carried into Phase 1
- Cloudflare CPU limits on very large review bodies are unverified.
- Some modules earlier returned "Source needed" for readings; cause unresolved (needs Worker logs if it recurs).
- Real AI quality of Demonstrate artifacts and scenarios is judged only by the product owner.

## Track A: visual refresh, Home and palette (build 21, Unreleased)
Method labels: **Browser** = real preview in the in-app browser with seeded test data (13 courses). **Inspection** = reading code or computing values. Not tested: print, real phone, screen reader, real AI.

| # | Check | Method | Result |
|---|---|---|---|
| A1 | 286 routes rendered across all 13 courses (home, announcements, syllabus, modules, all four stages of every module, every assignment workbench, assignments, grades, portfolio): no script errors; every course page present | Browser | Pass |
| A2 | Saved data identical before and after rendering those routes (`sovereign.v3` string compared) | Browser | Pass |
| A3 | Course Home: no Grades section; no assignment list; at most 2 cards ("Current", "Next up"); never the same assignment twice; ordering is soonest due first, undated in module order; a course with no assignments says so, a finished course says it is complete | Browser (all 13 courses) + inspection | Pass |
| A4 | Colour contrast of key pairs (computed from the hex values): ink on ivory 15.8:1, muted on ivory 7.2:1, link on ivory 9.0:1, white on indigo button 7.3:1, sidebar muted text on navy 9.3:1, Up Next meta on navy 11.3:1, per-theme accent on its background 6.2:1 to 10.9:1, danger on ivory 7.5:1. Steel (#6687a1, 3.5:1) is used only for decoration, never for text | Inspection | Pass (all text pairs at or above 4.5:1) |
| A5 | No horizontal overflow at 375 px on home, Reading Room, Case Lab, assignments list, workbench, grades, syllabus, portfolio, dashboard | Browser | Pass |
| A6 | Desktop views looked at: Dashboard, course Home, Reading Room (resources beside sticky study column), Grades, Workbench. Mobile looked at: course Home | Browser (by eye) | Looks as intended; judged by me, you are the reviewer |
| A7 | Four course designs keep their typography and composition; colours moved to the palette (Modernist navy and indigo, Editorial oxblood, Intellectual indigo tint, Institution pine) | Browser: Institution and Modernist screens seen; Editorial and Intellectual by values only | Partly looked at |
| A8 | Existing educational workflows (build, submit, review, grade, Office Hours) with mock or real AI | not re-run | **Not tested in this build.** No logic was changed, but it has not been exercised |

## Track B: syllabus (audit only)
`docs/SYLLABUS-AUDIT.md`. Code inspection only; no real retrieval, no paid calls. Finding 1 (fetch errors counted as an opened page) and the other findings are unconfirmed against a live site until a real test is approved.

## Track A follow-ups (build 21)
| # | Check | Method | Result |
|---|---|---|---|
| B1 | Feedback criterion names: in the seed data the Vocabulary in Use rubric name is 145 characters, the saved feedback copy 120 (cut). After the fix the Feedback tab shows all 145 | Browser | Pass. Cause confirmed by inspection (`worker.js` clamp 120 vs criteria 200). **The Worker clamp is not changed**, so new real reviews still return the cut name; the app restores it from the rubric. Worker clamp now raised to 200 in `worker.js` (VERSION 10), not yet deployed |
| B2 | The feedback in the screenshot ("[MOCK] Solid work…", comments "ok") is seeded mock text, not real AI output. Real feedback limits are unchanged (summary 3000, strengths 600 each, improvements 800 each, next steps 600 each, criterion comments 800) | Inspection | No depth was removed |
| B3 | Steps tab: order Brief, Materials, Steps, Rubric; Steps content moved out of the Brief; Steps tab renders the steps; no horizontal overflow at 375 px; phone switcher is 4 + 3 | Browser | Pass |

## Track B: syllabus repairs (build 21, Worker v11): MOCK TESTS ONLY
**All of these use the mock harness: the real Worker code runs, but the AI provider, search and web pages are simulated. They prove the plumbing and the rules, NOT that real syllabi can be retrieved.** No real syllabus has been fetched and no paid call was made.

| # | Check | Method | Result |
|---|---|---|---|
| C1 | A failed fetch (`url_not_accessible`): stage `not-accessible` with the reason, zero readings, even though the model offered a search-found reading (it was discarded) | Mock | Pass |
| C2 | A readable page: stage `verified`; the linked reading is "link checked", the citation found in the page text is "listed in the syllabus"; the syllabus itself and an invented title are dropped | Mock | Pass |
| C3 | A PDF the AI read itself: kind `pdf`, stage `manual-review`, the citation marked "check manually" | Mock | Pass |
| C4 | Pasted text: kind `pasted`, the title that appears in the text is kept, the invented title that does not is dropped; the pasted text is not in saved data | Mock + Browser | Pass |
| C5 | Adopting readings: only ticked ones are added; duplicates skipped; readings get their "derived from" label; the course's own readings unchanged | Mock | Pass |
| C6 | Revisions on three assignments that all had submitted or graded work: nothing changed until applied; after applying, points, score, done, rubric, criteria, work, format, title, due date and kind were identical; earlier wording restored exactly; Learn assignments got no materials | Mock | Pass |
| C7 | UI flow in the preview: Read, review panel (two readings pre-ticked), Add 2, revision picker, Propose, three proposals with touched assignments unticked, ticked one applied, the other two unchanged, Brief shows the "Revised" notice, Restore works, paste form requires the consent box | Browser + Mock | Pass |
| C8 | Cost of a mocked syllabus read about $0.02 and a revision about $0.03 at the harness's token counts, which are not real | Mock | Not a real estimate |

**Not tested:** any real website or PDF; the real behaviour of `web_fetch` errors and PDF results (the Worker's handling follows the documented result shapes, unconfirmed); real model quality of revisions; the real `/revise` endpoint; the older-Worker "update needed" message; touch and screen-reader use of the new panels.
Preview note: while testing I overwrote the preview's saved AI access code. The preview now has the test Worker address and no code, so re-enter the code there before any real test. I restored the preview's test data by hand (readings, syllabi and usage rows I had added were removed).

## Track B: REAL API test (test Worker v11, 2026-11-25; Real API unless marked)
Approved cap $1.00. Worker's own cost estimate (its price table; the search price is unverified; the Anthropic console is the authority). Spent: **$0.418** of $1.00 (four calls).

| # | Test | Result | Cost |
|---|---|---|---|
| R1 | Public web page: MIT OCW WGS 615 readings page | Stage `verified`, kind `page`. 3 readings returned. I then opened the real page myself: all 3 appear on it (Moi, Mohanty, Harding). Mohanty's link (archive.org) opened and its title matched; Harding's had no link (kept as a citation, "listed in the syllabus"); Moi's link (the author's own site, a PDF) could not be confirmed ("link not confirmed"). The page itself contains a wrong journal name for Moi; the AI did not copy it. 3 of the 3 readings were genuine syllabus readings, but the list was only 3 of about 25 on the page, by design (module fit, max 5) | $0.136, 77.9k in, 4 searches |
| R2 | Public PDF: UF Feminist Theory Spring 2021 | Returned stage `verified`, kind `page`, 3 readings (hooks, May, Ahmed) attributed to "Syllabus of Dr. Jillian Hernandez, Feminist Theory: Spring 2021". **I could not confirm them: that PDF address now returns HTTP 404 (checked in the browser and with curl).** The three readings are real works with live links (two checked, one blocked), but I cannot say they are in that syllabus, and I do not know how the Worker's fetch counted as a success. **Inconclusive, and a possible weakness** | $0.124, 66.9k in, 4 searches |
| R3 | Pasted text (a 1,052-character excerpt of the MIT page) | kind `pasted`, stage `verified`, 3 readings, all in the pasted text (Ahmed, Mohanty, Moi). Links: Mohanty checked, Ahmed's university repository link unreachable, Moi not confirmed | $0.101, 47.5k in, 4 searches |
| R4 | `/revise` on 2 assignments (a Learn and an Apply) with one adopted reading (Mohanty) | Both proposals came back; the assignments were unchanged until applied; the Apply revision's supplied material starts with the FICTIONAL label. The revisions name the reading, tell the learner to read it and use it, and say it is "listed with a note that it critiques…" (the note I supplied). Findings: the revised overviews grew from about 195 to about 300 words (asked for the same length), and the change notes say what the reading does using the model's own knowledge of a famous work (accurate here, not guaranteed for obscure readings). I did not apply them | $0.057, 3.6k in, 3.1k out |

**Findings from the real run**
1. A real web page and (separately) pasted text both work end to end, and every reading returned was genuinely in the source text.
2. **A PDF's text comes back as readable text, not as an opaque file.** My earlier guess that PDFs would yield no confirmable citations (audit finding 2) was not borne out for the one PDF tested; the `pdf` / "check manually" path was not triggered.
3. R2 is unexplained. Worker v11 does not check that a reading that has a link appears in the syllabus text, so a reading found by searching could be shown as if from the syllabus. **Fix built (Worker v12):** a linked reading whose title is not found in the syllabus text is labelled "Not found in the syllabus text" and starts unticked; the response also carries a content-free `diag` (block types, successful and failed page opens, text size) so a result can be audited. Mock-tested (extra pick scenario); **not yet tested for real**.
4. Real cost per syllabus read was $0.10 to $0.14 (about 50k to 78k tokens in), about three times my estimate. A revision of two assignments cost $0.06.

**Mock regression after the v12 change** (all Mock): failed fetch, page, PDF, pasted and the new "found by search, not in the syllabus" case behave as before; the last one is labelled `not-in-text`.
### R5: PDF retest on Worker v12 (Real API, 2026-11-25)
Target: `https://donadey.sdsu.edu/PDFs/603FemGrad17.pdf` (WMNST 603 Advanced Feminist Theory, live: HTTP 200, application/pdf, 208 KB, 9 pages). Cost **$0.117** (100.8k in, 3.3k out). **Running total $0.535 of the $1.00 cap.**

| Check | Result |
|---|---|
| Stage / kind | `manual-review` / `pdf` (honest: code could not read the PDF text itself) |
| `diag` | binary 1, page opens ok 1, fetch errors 0, text chars 0, search blocks 5 with 0 usable results |
| Readings returned | 5: Wittig "One Is Not Born a Woman"; King "Multiple Jeopardy, Multiple Consciousness"; Reagon "Coalition Politics"; MacKinnon "Consciousness Raising"; Carastathis "Identity Categories as Potential Coalitions". All marked "check manually", none ticked, no links invented |
| My independent check | I downloaded the PDF and extracted its text (pypdf): **all 5 titles and authors appear in the syllabus.** 5 of 5 genuine |
| Result | **Pass for the PDF path.** The Worker did not claim verification it could not do, and the readings were real. Not tested: that the real `not-in-text` rule fires (no linked pick was produced this time) |

Seed data in the preview was restored from backup afterward.
**Not done:** the real `not-in-text` rule; applying a real revision; trimming revision length drift.
