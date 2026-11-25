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

## Phase 1 test plan
See the acceptance criteria in `docs/PHASE-0-AUDIT.md`.

## Known limitations carried into Phase 1
- Cloudflare CPU limits on very large review bodies are unverified.
- Some modules earlier returned "Source needed" for readings; cause unresolved (needs Worker logs if it recurs).
- Real AI quality of Demonstrate artifacts and scenarios is judged only by the product owner.
