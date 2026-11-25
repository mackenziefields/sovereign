# Changelog

Reconstructed from the repository history (`git log`). Dates are all 2026-11-24 for the build session unless noted. "Tested" is described in `TESTING.md`.

## Unreleased · Overlay navigation, G1 (build 27, not committed)
- **Sidebar floats instead of pushing.** On desktop the global menu is hidden by default behind a slim edge handle. Hovering the handle (after a short delay) or pressing Enter on it opens the full menu over the page; the page never resizes or reflows. It closes about half a second after the pointer leaves, on Escape (focus returns to the handle), or when Tab leaves it, and after you choose a link.
- **Pin menu open** (first control in the menu) restores the persistent sidebar. The choice is kept in this browser only (`sovereign.navPinned`).
- **Touch and phones:** unchanged Menu button and drawer; touch-only large screens (no hover) also keep the Menu button.
- **Assignment Workbench:** with the menu hidden the two panes use the full width (about 1330px of a 1440px window). With the menu pinned in a window under 1380px wide, it switches to the one-pane switcher instead of squeezing two cramped panes. Reading text keeps its readable line length. Course menus inside a course are untouched.
- **Workbench widening follow-up:** the assignment page may now grow to 120rem (was 90rem) with 2rem side margins (3rem on very wide screens); panes split 55% Reference / 45% Your Work with a 1.5rem gutter. Table cells keep identifiers and dates on one line, and tables have an **Expand table** button that opens the dataset in a large dialog (Escape or Close returns). Reading text keeps its 40rem measure.
- **Evidence workspace polish (2B, first pass):** exhibit tabs wrap (two per row on phones) instead of scrolling sideways; bar and share charts are now real text bars with readable 16px labels on any width (line charts scroll sideways on phones); phone tables keep the row id and first column pinned; fixed a page-wide sideways scroll on phones caused by the hidden chart data table.
- **Evidence-aware review (2C, Worker v16):** the reviewer receives the evidence packet as its own field (up to 14,000 characters, shared fairly between exhibits: small exhibits stay whole, large ones show their first rows with an explicit "N of M shown" note). Findings can carry a `ref` (exhibit, row or paragraph id, column). The Worker keeps a ref only if that id, exhibit and column exist in what was shown; otherwise the finding stays and its location is dropped with a note. Feedback and Review Studio show "Related exhibit location: Exhibit A, row A-12, Case no.". Examples may now only use names and figures from the work, materials or exhibits. An older Worker (below 16) still gets the packet squeezed into the 7,000-character materials field as before. Nothing else in 1A-1C changed.
- **Reviews now see exhibits** (Phase 2 bridge): the AI reviewer gets the evidence packet as plain text with row ids, within the Worker's current 7000-character limit and with a note when only part could be shown. Full cell-level review is still Phase 2C.

## Unreleased · Evidence packets, Phase 2A (build 26, Worker v15, not committed)
- **Exhibits:** an assignment can carry a packet of exhibits (`exhibits[]`): tables, documents (article, memo, policy, transcript, correspondence, report, case file), timelines and charts. Old assignments are unchanged; their text materials still show exactly as before.
- **Automatic generation:** the course builder decides which assignments need a packet (AI-built, not reading tasks, not real-evidence), takes the model's exhibit plan from `/details`, and builds the packet with the new `/exhibits` call right after each module's assignments. Progress shows "Exhibits for ..." and the course is marked partial, with a specific note, if any required packet is missing. "Build the exhibits with AI" is the fallback.
- **Charts** are recipes computed from table data at render time (count, sum, mean, median, percent, rate). Unreadable or unmatched values are excluded and listed; nothing is estimated. Each chart shows its formula, units, source rows and a data table.
- **Downloads:** every table has Download CSV (spreadsheet-safe) and Download exact original values. Stored data is never altered; the safe file only prefixes risky cells.
- **Upgrade with preview:** an existing text-only assignment can get a packet. The draft is shown first; nothing is saved until Approve. Instructions, steps, rubric, text, submissions, grades and feedback are not touched. Remove restores the previous state.
- **Prototype limits** (configurable): 6 exhibits, 12 columns, 80 rows, 200 rows per packet, 120 characters per cell, 40 events, 1,800 words and 60 blocks per document. Worker: `EXHIBIT_MAX_*`; app: `S.config.exhibitLimits`. Over-limit content is rejected, not cut.
- Needs Worker v15. Older Workers return no exhibits; the app says so.

## Unreleased · Review Studio (build 25, Phase 1C, not committed)
- **Visual refinement (proposal, awaiting approval):** editorial masthead instead of a toolbar, manuscript "paper" for typed work, numbered footnote markers on highlights, annotation rail with grouped, numbered comments, theme-aware display type (one implementation for all four course themes), and on phones a bottom dock showing the selected comment beside its highlighted passage. No scoring, evidence-verification or Office Hours logic changed.
- **Review Studio:** an "Open Review Studio" button on the Feedback tab (graded reviews, first reviews and Office Hours rounds) opens your submitted work beside its feedback. Desktop shows two panes; on a phone it is two tabs (Your work / Feedback) with a "Back to feedback" button.
- **Evidence-linked:** selecting a point (or its "Show in your work" button) scrolls to the passage and highlights it; selecting a highlight in typed text selects its point. Strengths are highlighted in restrained blue and suggested changes in yellow. A highlight appears **only when this app itself finds the passage** in the submission (letters and digits compared, so quote marks and line breaks don't matter); otherwise the point stays and says "Sovereign could not find this passage in your submission, so it is not highlighted." Missing-element points say there is nothing to highlight. Repeated phrases highlight the first match and say how many there are.
- **Structure:** an "Overall" note, a Previous/Next stepper ("Point 3 of 8"), then sections for what's working, verified errors, missing requirements, partly achieved, clarity, optional improvements, could not be verified, earlier points, rubric assessment and next steps. Each point is a short card that expands when selected.
- **Documents on this device:** typed work and text files are shown as text; PDFs are drawn locally with PDF.js and their text layer is searched to place highlights (page number shown); images are shown but cannot be searched; Excel files show their cell values as the reviewer received them. Nothing is uploaded to show or highlight anything.
- **Vendored PDF.js (pdfjs-dist 4.10.38, Apache-2.0):** `js/vendor/pdf.min.mjs` (353 KB) and `pdf.worker.min.mjs` (1.38 MB), unmodified, integrity-checked against npm's published SHA-512 (`js/vendor/README.md`). Loaded only when a PDF is opened, then cached by the service worker. It is not in the start-up cache list, so a PDF opened for the first time while offline shows the feedback without highlights and a link to open the PDF in the browser.
- **Older saved feedback** (before Phase 1A) opens in the studio with a note that it has no passage references, next to the work, in its original layout.
- **Accessibility:** native modal dialog (Escape closes, focus returns to the button that opened it), tabs and cards are real buttons with `aria-expanded`, selections are announced in a live region, visible focus rings, reduced-motion respected, highlight colours also differ in underline/outline (not colour alone).
- **Unchanged:** grades, final scoring, the 72-hour revision window, Office Hours histories and stored submissions. The studio only reads them (verified: saved data identical before and after).
- Cache `sovereign-v3-25`.

## Unreleased · Evidence-based reviews (build 24, Worker v14, not committed): Phase 1A
- **The reviewer now receives the assignment's real context:** steps, supplied materials, module key ideas and reading titles (titles only; the text of a reading is never sent and the reviewer is told not to say what a reading contains). Nothing extra is sent automatically.
- **Findings are typed and evidence-linked:** working well, verified error, missing required element, partly supported, clarity, optional, could not verify. Correct work comes first. Clarity and optional points never cost points.
- **Checked in code, not trusted:** for typed or text-file work a quoted passage must exist in the work, otherwise a claimed error becomes "could not verify"; a "missing" element that is in fact present becomes a clarity note; locations are shown only when verified; examples not drawn from the supplied materials are labelled as illustrations; a deduction is kept only when a verified error, missing or partial finding on that criterion backs it, otherwise full credit with a note.
- **Transparency about what could be read:** a "What the reviewer could see" panel (text, PDF, image, Excel) and a review-limitation banner. A criterion that could not be assessed is left out (not scored low), the score is labelled provisional, and the learner is told to resubmit in a supported format. If nothing could be assessed the Worker answers 422 and nothing is graded or saved.
- **Round 2:** uses the earlier findings; the first version is sent again only if the learner ticks "Also send my first version". The panel says whether versions were actually compared.
- **Office Hours has two modes:** practise this assignment (its real instructions, materials and criteria as a guide, ungraded) or explore with your own material. Older sessions open as "own material".
- **Nothing is lost:** older feedback, grades, submissions and Office Hours sessions are unchanged and display as before. An older Worker (below v14) still works; its reviews carry a banner saying they used the older method.
- **Post-evaluation fixes (still build 24, Worker v14 file changed, needs redeploy to the test Worker):** a real test found the same findings scored differently and a possible leniency. Now: score bands enforced in code (met = full, partly 40-80%, not-met 0-25%, so status and score always agree); prompt rules that an element with no attempt at all is "missing" (never partial or clarity) and that a stated length or required component the work lacks counts against its criterion; no "readings not read" note unless the work or assignment uses a reading; and when a deduction is overridden for lack of a verified finding, the learner now sees "Adjusted: ..." beside that criterion.
- Needs a v14 Worker deployed (test Worker first). Cache `sovereign-v3-24`. No paid test has been run for this build.

## Unreleased · Linked readings only (build 23, not committed)
- **Every reading taken from a syllabus must have an online link.** A reading the syllabus lists but that has no link is left out completely: not listed, not ticked, not added. The review panel says how many were left out. If none has a link, it says so and lists nothing. Adoption also refuses a reading without a link. This is enforced in the app, so it works with the Worker you already have deployed (v12 or v13). Readings you add yourself are unaffected.
- Course creation already searches for syllabi per module and saves them; that is unchanged.
- **Data & Backup shows "Readings without a link"** when earlier versions left citation-only syllabus readings in your courses: it lists them and has one button to remove them after a confirmation. Your own readings and "Source needed" placeholders are never included, and nothing is removed automatically. Also removed a line there that suggested clearing site data.

## Released (build 22) · Check content (build 22, Worker v13, not committed)
- **"Check content"** shows whether the page behind a reading's link actually holds that reading. Two buttons: on the review list of a syllabus read (before adopting) and next to "Find materials with AI" on a module's readings. Up to 5 readings per press, unchecked first.
- **Labels:** Content matched, About the work not the work (abstract, listing or review), Doesn't match (the reading is unticked in the review list; tick again to override), Couldn't check content (paywall, login, PDF, no readable text, or the code check and the AI disagreed; nothing is claimed). Stored on the reading, shown with the date.
- **How it works (Worker `/check-content`):** the Worker opens each public page itself (same address safety rules as the link check), strips it to text, and checks in code that the title's words and the author's surname appear. A light model then reads the first ~4,500 characters and says what kind of page it is. "Matched" needs both to agree. PDFs are not read. Only titles, authors and links are sent.
- **Real test (test Worker v13):** 5 of 5 correct on five real links (full text matched, repository record as about, bot wall as could not check, wrong page as mismatch, dead link as could not check); cost $0.006. See TESTING.md.
- Needs Worker v13 (the app shows the usual "update needed" message otherwise). The rest of the app still needs only v9. The "Update assignments to use these readings?" step is unchanged.

## Released (build 21) · Visual refresh and course Home (build 21, not committed)
- **Palette as tokens** (`css/refresh.css`, loaded last, and recoloured values in the other sheets): midnight navy `#101b32`, deep pine `#073e35`, electric indigo `#2643d8`, cool ivory `#f5f6f7`, steel `#6687a1`, oxblood `#681632`. Cream and burgundy are gone from the base; module colours updated (`S.COLORS`).
- **Course designs recoloured, not redesigned:** Modernist navy + indigo, Editorial oxblood, Intellectual indigo tint, Institution pine. Typography and composition are unchanged.
- **Shell:** navy sidebar and top bar, wider workspace (up to 90 rem), buttons in indigo with a darker hover, surfaces instead of rule lines, larger body text (17 px) and darker secondary text, white panes for the Workbench with the work pane marked.
- **Course Home** is a landing page: a "Your next assignments" panel (current and next, no duplicates, no invented dates, link to all assignments), progress, Announcements and Syllabus preview in a side column, Modules below. The Grades section and the full assignment list are removed from Home only; the Grades and Assignments pages are unchanged.
- **Reading Room:** resources in the main column, key ideas, syllabi and the self-check in a study column beside it on wide screens. Course menu becomes a vertical sticky menu on wide screens.
- **Workbench: Steps is its own tab**, order Brief, Materials, Steps, Rubric (seven-way switcher on phones). Overview, readings and "What to submit" stay in the Brief.
- **Feedback criterion names no longer cut off.** The Worker clamped a criterion name at 120 characters (`worker.js` review, and `store.js`), while assignment criteria run to 200, so a long criterion showed as a half sentence. The app now shows the full rubric wording when a saved name is a cut-off start of it, and keeps 200 characters going forward. Saved feedback is not rewritten. Worker `VERSION` 10 raises the clamp to 200 (needs redeploy; the app still only requires v9, so nothing breaks before you deploy).
- **Track B: syllabus sourcing, repaired and reviewed (build 21; Worker `VERSION` 11, needs a redeploy for these features).**
  - **Worker (`worker.js`):** a failed page fetch is no longer counted as an opened page. A syllabus that could not be opened returns stage `not-accessible` with the reason, and whatever the model found by searching alone is discarded. Every result carries a stage: `not-accessible`, `no-readings`, `readings-found`, `verified` (at least one link opened and its title matched), `manual-review`. Each reading carries its own status: link checked, link not confirmed, listed in the syllabus, check manually. A PDF the AI read itself yields citations marked "check manually" because their text cannot be confirmed in code. New: syllabus text can be sent instead of a link (`text`, up to 30,000 characters); the model is told it is data, and a citation is kept only if its words appear in that text. New `/revise` endpoint writes PROPOSED new wording for up to three assignments around newly added readings. It cannot change title, kind, points, criteria or format, never quotes or describes a reading beyond what is written about it, keeps AI scenarios labelled fictional and writes no scenario or sources for real-evidence assignments.
  - **App:** "Read this syllabus" (new `js/syllabus.js`) shows the stage and every candidate reading with its status; nothing is added until it is ticked (only readings listed in the text or with a checked link start ticked). "Paste a syllabus instead" asks for consent before sending, is not stored, and creates a syllabus entry with no link. After adding readings, an optional step lets you pick up to three assignments and ask for proposed revisions, shown before and after. Applying is per assignment; assignments with submitted work or marked complete start unticked. Only wording changes (overview, steps, and supplied material for Apply and Demonstrate). Points, criteria, submissions, scores and history are untouched, the earlier wording is kept (new optional field `revisions`, up to five) and "Restore the earlier wording" appears in the assignment Brief.
  - **Worker v12 (after the first real test):** a reading with a link whose title is not found in the syllabus text is labelled "Not found in the syllabus text" and starts unticked, and results carry a content-free `diag` (page opens, errors, text size) for auditing. Mock-tested only.
  - The app asks for Worker 11 only when you use these features (a message says to update); building courses still works on version 9 or later.
- Build 21, cache `sovereign-v3-21`. No data-format or AI change.

## Unreleased · Phase 2: Academic Experience (build 20, not committed)
- **Syllabus as a course sheet** (`js/academic.js`): description as a standfirst, a facts strip (length, modules, assignments, points, final deliverable), outcomes, a **Course map** (each module with its Learn / Apply / Demonstrate counts, points and due dates, linking into the studio rooms), **How you are assessed** (points by stage, the weighted-rubric, 72-hour and late-work rules), final project, syllabus notes. The AI usage block and Delete course are folded away at the bottom. "Edit course details" is unchanged.
- **Grades as a transcript:** Current Grade with letter, a bar per stage, a bar per module group, a status for every assignment (AI-graded, Feedback ready with the latest date its first review becomes the grade, Self-scored, Attached as evidence, Not graded), links to the workbench, and a notice listing assignments with feedback but no grade yet. Manual points and score entry is kept; AI-graded rows stay read-only. On phones the table becomes cards; on wide screens it stays a real table.
- **Portfolio as an exhibition:** themed cover, numbered plates with "What it shows", module, date, AI-reviewed label, grade, an excerpt and the full work and feedback on request; the **course capstone** (description, reflection, link) in its own section; a compact graded record; credentials as before. New **Print or save as PDF** button with a print layout.
- New `css/academic.css` (shared components, four design treatments, print rules). New helpers `S.fileLine` and `S.finalFeedbackOnly` exported from `views-work.js`. Build 20, cache `sovereign-v3-20`. No data-format, Worker or AI change.

## Released (build 19, `d858ce0`) · Phase 1A 
- **Module Studio.** A module is now four rooms at `#/course/<id>/modules/<moduleId>/<learn|apply|demonstrate|wrap>`: Reading Room (resource cards, key ideas, syllabi, self-check, study tasks), Case Lab (case-file cards with status), Portfolio Studio (project cards with deliverable, skills, Portfolio link), Wrap-up (reflection, custom sections, complete). Stage rail with counts, Next Up bar, keyboard arrows between stages. With no stage in the link, it opens where the work is.
- Assignments with no kind appear under Apply as "Practice". New optional **Stage** selector on manual assignments (AI-written assignments keep theirs). Nothing is reclassified or rewritten.
- Four design treatments of the module opening, rail, and cards in `css/studio.css`.
- Files: new `js/studio.js`, `css/studio.css`; edited `js/views-course.js` (old `pageModule` removed, helpers exported as `S.vc`, Stage selector), `js/app.js` (fifth route segment), `index.html`, `sw.js` (cache `sovereign-v3-18`), `js/store.js` (`BUILD` 18). No data-format or Worker change.

## Released (build 19, `d858ce0`) · Phase 1B 
- **Assignment Workbench.** One assignment is now a full-width two-pane workspace at `#/course/<id>/assignments/<assignmentId>[/<tab>]`. Left: Brief, Materials, Rubric. Right: Submission, Feedback, Office hours. On phones a six-way switcher shows one pane at a time. Tabs are links, so Back, Forward, deep links and reload work.
- Older or hand-made assignments show an honest "A short entry" notice listing only what is missing, with "Add details yourself" (opens the existing edit form). Nothing is invented. Assignments without points can be marked completed manually.
- Typed drafts are kept in this browser (`sovereign.drafts.v1`; text only, never consent or files, cleared on submit) so a reload or tab switch can't lose them.
- Submission logic is unchanged: the old single panel is split into `S.workParts` (submit and feedback) with the same review, 72-hour resubmit, finalize, attach, consent and Portfolio behaviour.
- Files: new `js/workbench.js`, `css/workbench.css`; edited `js/views-work.js`, `js/views-course.js` (old `pageAssignment` removed), `index.html`, `sw.js`. No data-format or Worker change.

## Released (build 19, `d858ce0`) · Phase 1C 
- **Navigation refinement** (`css/nav.css`, `S.icon` in `js/components.js`): small line icons, muted inactive text, soft filled active row, taller rows, in both the sidebar and the course menu.
- **Courses in the sidebar** with a small mark per design (square, ring, circle, diamond); the current course is marked and the sidebar takes its accent. The Dashboard link no longer stays highlighted inside a course.
- **Contextual controls:** Edit, move and Remove on resource, case and project cards appear on hover or keyboard focus; always visible on touch.
- Tablet switcher on the workbench; My Work cards no longer overflow phones by 4 px.
- Dropped from the file-type label: "get AI feedback". The upload label now lists the accepted types (TXT, MD, CSV, PDF, PNG, JPG, WEBP, GIF, XLSX).
- Files: new `css/nav.css`; edited `js/app.js`, `js/components.js`, `js/views-course.js`, `index.html`, `sw.js`.

## Released (build 19, `d858ce0`) · Phase 1 audit fixes 
- A course whose assignment pages failed to generate is now saved as "partial" with a note, a toast and a banner, instead of "complete" (`js/ai-client.js`, `js/views-ai.js`).
- AI-written materials carry a caption saying the people and sources in them are fictional; the incomplete notice for AI assignments says the full page didn't finish (`js/workbench.js`).
- Learn study tasks regain their reorder buttons (`js/studio.js`).

## Released (build 19, `d858ce0`) · Phase 1 content-integrity fixes 
- **Fictional labelling enforced in code.** The Worker (`worker.js` `/details`) puts a fixed "FICTIONAL: written by AI for this exercise…" line first on every AI-written scenario or material unless the model already opened with "fictional/hypothetical". The app repeats the check (`S.labelFiction`) and the Materials tab shows a Fictional note. Old courses are not rewritten.
- **Real-evidence assignments.** The outline can mark an apply or demonstrate assignment `realEvidence` when its objective needs authentic real-world material. For those, the Worker writes no scenario and no materials (enforced in code). The app lists only module readings whose link responded and whose page title matched (`S.setEvidence`); if there are none, the assignment shows "Source needed" and nothing is invented. Learn assignments never get materials. New optional fields `realEvidence` and `evidence` (older backups load unchanged).
- **File pre-check.** `S.files.check` runs when a file is chosen: unsupported types (DOCX, HEIC, etc.), PDFs over 2 MB, Excel over 5 MB and text files on file-only assignments show the reason and disable "Get AI feedback"; "Attach without AI feedback" stays available. The same check runs again at submit. Excel notes that only cell values are read.
- Worker `VERSION` 8, app `NEEDS_VERSION` 8 (**the production Worker must be updated to v8 with the release, or course building will report "outdated"**), build 19, cache `sovereign-v3-19`.

## Released (build 19, `d858ce0`) · Phase 1 real-test quality fixes 
- **Reading titles.** When a search result's page title is a number, file name, shouting capitals or contains "*" (for example "2024"), the model's own title is shown instead; the link check still uses the page's real title (`weakTitle` in `worker.js`).
- **Modules with no readings.** Course building makes a third and last search with different words. If it still finds nothing, the Learn assignment is told so (`readingsMissing`), is based on the module's key ideas, says plainly that readings still need adding, and no longer asks the learner to find their own sources.
- **Demonstrate assignments supply their own reference material** (a fictional case file, data or brief, labelled FICTIONAL) unless marked real evidence, in which case the real-evidence rules apply. Older AI-written Demonstrate pages without material show it as a gap in the workbench notice.
- Worker `VERSION` 9, app `NEEDS_VERSION` 9.

## Phase 0
- Added `ROADMAP.md`, `CHANGELOG.md`, `TESTING.md`, `docs/PHASE-0-AUDIT.md`. No application code changed.

## Build 17 · `7e66e88` · Four course designs
- Course design templates: The Modernist, The Editorial, The Intellectual, The Institution. Saved per course as `designTheme`, assigned at random on creation, switchable from "Customize appearance".
- Self-hosted fonts (SIL OFL): Inter Tight, Playfair Display, Instrument Serif, Cinzel, Cormorant Garamond. Added to the service-worker cache.
- Covers, course headers, module tiles, major headings and the Portfolio cover follow the course's design.

## Build 16 · `3ca093f` · Visual redesign
- Swiss-modernist / editorial identity: `css/design.css`. Course covers, masthead, stats, assignment page grid, rubric bars, Portfolio plates.
- Learn / Apply / Demonstrate markers (circle, square, triangle plus a word).

## Build 15 · `2a427cc`
- Assignment kinds drive the pedagogy: Learn uses readings, Apply uses a fictional scenario, Demonstrate is a portfolio-grade artifact. Finished Demonstrate work is saved to the course Portfolio. Worker `VERSION` 7.

## `7e43a14`
- Readings vs scenario assignments, file-only formats with Excel reading, ungraded office hours.

## `585dce2`
- Service worker revalidates files; build number shown on Data & Backup.

## `94e3b7e`, `fd5085e`, `6ec76ef`
- Full assignment pages written per module by the Worker (`/details`): overviews, steps, format line, weighted criteria. Worker version check. Per-course Portfolio moved into each course menu.

## `17ae388` · Round B
- Submissions (text or file) with per-submission consent, AI feedback and grading, the 72-hour revision window, locked due dates for AI courses, local file storage (IndexedDB).

## `9aef5db`, `fc01c6a`, `e406114`
- Syllabi section with on-demand sourcing; Wikipedia and shadow libraries blocked; readings derived from syllabi; higher-ed resource priority; credentials and milestones.

## `6f32083`
- First version of Sovereign with the optional "Build with AI" feature (Cloudflare Worker).

## Earlier (2026-11-18)
- `984ddf4` Initial commit; `a5d57a7` uploaded the first static app.
