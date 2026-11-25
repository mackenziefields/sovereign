# Changelog

Reconstructed from the repository history (`git log`). Dates are all 2026-11-24 for the build session unless noted. "Tested" is described in `TESTING.md`.

## Unreleased · Check content (build 22, Worker v13, not committed)
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
