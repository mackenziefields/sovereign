# Phase 4 final refinements: audit, architecture, feasibility, steps (APPROVED 2026-11-25; Step A done)

Decisions: Option B (keep a first-review summary); PDF pages approved but reuse the PDF.js already vendored in `js/vendor/` (4.10.38, used by the Review Studio): no new dependency; per-course publication settings kept in the course record and in backups (optional, resettable, configuration only); real-data testing on a separate copy with minimum data; order A, B, D, C, E with a pause after each.


Nothing here is built. No app code, saved data, Worker or AI call was changed. The only things I ran were read-only checks of the saved data in my preview browser and one throw-away link test.

## 1. Audit

### 1a. The 94% vs 92/100 grade mismatch
- **Cause: my fictional sample data, not the app and not PDF rendering.** The generator typed "94%" into the page text and, separately, a rubric list that sums to 92 (29+21+18+14+10). Nothing compared them. The Portfolio sample repeated the same 94%, and its 80/20 table was also typed by hand (89.6 and 94 are not tied to any record).
- **How the real app derives a grade** (from `worker.js`, `store.js`):
  1. The Worker sets `feedback.score` = sum of the *assessed* criteria scores (rounded to 0.1) and `feedback.max` = sum of the assessed criteria maxima. Criteria marked "not assessed" are excluded from both.
  2. `finalizeWork` sets the Grades-page score `a.score = round(feedback.score / feedback.max * a.points, 1)` (if the points were edited after the review, the same percentage is kept).
  3. `S.courseGrade` combines the module average and the capstone 80/20 (provisional while the capstone is ungraded).
- **Reconciliation rules the publication engine will enforce (read-only):**
  R1 sum of assessed criterion scores = `feedback.score` (within 0.1); R2 sum of assessed maxima = `feedback.max`; R3 `a.score` = percentage × points (within 0.1); R4 the displayed percentage, the Grades page and the course 80/20 all come from `S.courseGrade` / the stored values, never recomputed in a template. On any failure the export **stops with a plain diagnostic** naming the assignment and the two numbers that disagree, and publishes nothing. No stored grade is ever edited.
- **Read-only scan of the saved data in my preview browser** (test courses, not your real work): 7 saved reviews; 5 reconcile; 2 do not (one mock review whose criteria sum to 5 of 6 against a score of 26 of 30, one off by 0.2). These are test records and I did not touch them; they are exactly the cases the new check must catch. Your real learner data lives in your own browser profile, which I cannot see (see section 7).

### 1b. The timeline
- **The sample dates were impossible under the app's own rules.** The app sets `work.deadline = first submission + 72 h`. A first review on Oct 28 gives a deadline of Oct 31; a Nov 1 resubmission would be too late, and `finalizeExpired` would already have made the first review the grade. "Within 72 hours" was an unsupported claim.
- **A real limit I found:** when the final grade is recorded, `finalizeWork` **discards the first review's feedback, score and file** (`first: null`). So after resubmission the app no longer holds a first-review score at all. **The "23% first review" in the samples cannot be produced from a real record.** What *is* stored: the deadline, the final submission's timestamp, the `late` flag, and the final review. The first submission time is exactly `deadline − 72 h` (by construction), when a deadline exists.
- **Rules for the engine (A, recommended):** show only stored facts: first submitted (derived, labelled "derived from the review deadline"), final submitted, and the recorded grade. Say "resubmitted within the 72-hour window" only if `final.at <= deadline`; say "recorded from the first review after the window closed" when a final equals the first submission; say nothing about the window if the deadline or a timestamp is missing, and never invent a date. Mark exactly one score as "Recorded grade".
- **Optional (B, needs your approval, small data-model addition):** from now on, keep a tiny summary `{at, score, max}` of the first review when it is replaced, so future exports can show the first-review score. Older assignments can never have it. I recommend doing A now and deciding B separately.

## 2. Architecture: one engine, four documents

```
saved course data ──► publication model (read-only, reconciled) ──► document builder ──► shared components ──► theme CSS ──► print
```
- **Publication model** (new, `js/publish-model.js`): the only place numbers and dates are read. It returns, for a course: assignments by stage, graded scores, capstone, the course grade object from `S.courseGrade`, reconciled review facts (section 1), timeline facts, attachments with their embed status, and credentials with their labels. Templates only display what it returns.
- **Builders** on the existing `S.publish`: `syllabus` (done), `feedback`, `academic` and `portfolio` (the Professional Portfolio). They share the components already in `css/publish.css`; each theme only restyles them.
- **One export dialog** (no multi-page wizard): a left panel with
  1. **Type**: Academic Record / Professional Portfolio (two cards with one-line audiences).
  2. **Projects**: a list of eligible finished work (completed Demonstrate projects and a ready capstone) with a checkbox and up/down buttons for order. Default for Professional: capstone first, then Demonstrate projects by recorded score (grade is used only to pre-order; it is not shown). The Academic Record also lets you tick Learn/Apply items.
  3. **Grades**: Academic: always on. Professional: off by default; one checkbox "Include grades and assessment information (AI-generated)".
  4. **Text**: optional introduction/statement, optional closing/contact, optional process note per project.
  5. **Paper** (Letter default, A4), **Design** (shows the course theme; change it for this export only).
  6. A live preview on the right and **Save as PDF**.
  Your choices are kept per course on this device (browser storage; no change to the saved course format).

| | Academic Record | Professional Portfolio |
|---|---|---|
| Audience | learner, advisers, admissions | employers, clients, collaborators |
| Opens with | learner, course, description, outcomes | cover, learner, your statement |
| Structure | Learn → Apply → Demonstrate by module, then capstone | a curated exhibition: capstone first (if selected), then chosen projects |
| Work shown | selected submissions, with assessment history | the work itself, introduction, skills, process note |
| Grades / rubric / first review / revision history | shown, labelled AI-generated | hidden by default; optional, labelled AI-generated |
| 80/20 course grade | yes, provisional vs final | no (unless grades are included) |
| Skills | from stored criteria and module objectives | "Assessed against" list from rubric criteria, editable by you |
| Credentials | listed, always "self-reported, not verified" | optional closing line only |
| Standing disclaimer | not accredited, not human-verified | no implication of an accredited qualification or certification |

Skills lines come from data you already have (rubric criterion names, module objectives, capstone `prepares.skills`); no AI call is made.

## 3. Attachment embedding: what is feasible

Every option below works on your device only; originals are read-only (never rewritten); nothing is sent to any service; untrusted content is never executed (documents are parsed into plain elements we build, never injected as HTML; scripts and macros are ignored).

| Material | Feasibility | New dependency | Recommendation |
|---|---|---|---|
| Typed text | Already works | none | now |
| Images (JPEG, PNG, GIF, WebP) | Easy: downscaled copy for the PDF, original untouched | none | now (C-1) |
| SVG | Only as a flattened image, never inline (can contain scripts) | none | C-1, rasterised |
| Learner-dataset charts and tables | Already works | none | now |
| Excel tables and ranges | Reader already exists (`dataset-import.js`) | none | C-1 |
| **Excel workbook charts** | Possible for simple bar, line and pie charts by reading the chart definition and redrawing it from the workbook's stored values; will not match Excel pixel for pixel | none | C-2, labelled "redrawn from workbook data"; combo, 3-D and exotic charts fall back to a reference |
| **Word (.docx)** | Text, headings, lists, tables and embedded pictures can be read from the file (zip + XML reader exists) and re-flowed; layout, headers/footers, text boxes, equations and tracked changes are not reproduced | none | C-2, labelled "text and tables from your Word document; original layout not preserved". Old .doc is not supported |
| **PDF pages** | The browser cannot print a PDF's pages inside another document. Real page inclusion needs a PDF renderer in the page | **pdf.js (Apache-2.0)**, vendored and cached for offline use, about 1.3 MB (reader plus worker); scripts inside PDFs are disabled | **C-3, only with your approval of the dependency.** Pages are drawn to images (no selectable text or links inside them). Default cap about 25 pages per file |
| Other files, or too large | Cannot embed | none | Reference page |

**Honest status labels** (always printed, one per attachment): *Embedded in full* · *Pages 1 to N of M embedded* · *Text and tables extracted (layout not preserved)* · *Chart redrawn from data* · *Not embedded: reason* (unsupported type, too large, or you excluded it). The previous "not embedded" cards become a deliberate, explained fallback. **Per-attachment checkbox** in the dialog lets you leave out anything sensitive. If pdf.js is not approved, PDFs stay reference-only (name, size, date, and a "supplied separately" note). A "download the original file alongside" button is also possible later (saves the unchanged file next to the PDF); I'd defer it.

Limits: each file is also bounded by the existing storage limits (25 MB per attachment, 2 MB PDF / 5 MB Excel for AI review); a page budget and a progress indicator protect memory; Safari and Firefox are untested.

## 4. Clickable navigation: tested
I printed a small test document with Microsoft Edge and inspected the file: **2 internal links and 1 external link all survived as real PDF link annotations.** The existing Syllabus PDF already carries 6 working reading links. So the current print engine supports clickable contents (`<a href="#section-id">`) with **no change of architecture**. Limit: Chromium cannot print the page number next to a contents entry, so the contents will be clickable and the running footer carries page numbers; Safari/Firefox link retention is untested and will be documented.

## 5. Institution spacing and 6. typography (Step D plan, CSS only)
- Institution: tighter chapter-opener padding, no forced page break between a project opener and its first work page when they fit, smaller section heads, keep margins and type. Keep full-page openers only for the capstone and each project.
- Typography audit targets: body 10 pt or more, captions and metadata 8.5 pt or more, uppercase labels 7.5 pt or more with tracking at most .12em, running headers and footers 8 pt or more (Institution's is 7 pt Cinzel with wide tracking, and the Cinzel "seal" text is 5.5 pt: both will rise), line height 1.45 to 1.6, text contrast at least 4.5:1 (checked per theme, including light text on the dark Institution cover), table text 9 pt or more. Display typography stays. I will measure both Letter and A4.

## 7. Testing with actual work
Attachments are **never in the backup file** (`files.js`), and the live-site data is in your own browser, which I cannot reach. Proposed, with your permission: (a) you export a backup and I import it into a separate **copy** in my preview browser, never touching the live site; (b) for attachments you give me 2 to 3 files from disk (an image, a PDF, a Word file) to re-attach to the copy, or you choose to run the final check yourself in your own browser. Also tested: missing attachments, a partly finished course, an empty portfolio, an over-size file, long submissions, all four themes, Letter and A4, and a reconciliation failure.

## 8. Steps and acceptance criteria
Recommended order: **A, B, D, C-1, C-2, C-3 (if approved), E.** I'd move the CSS-only Step D before C so attachment pages inherit the final layouts.

| Step | Scope | Done when |
|---|---|---|
| A Data integrity | publication model + reconciliation + timeline rules; the samples' data corrected | Regression tests pass: a matching record passes; a criteria-sum mismatch, a score/points mismatch and a missing timestamp each produce the diagnostic and no PDF; first review vs final correctly distinguished; "within 72 hours" printed only when proven; the course 80/20 equals `S.courseGrade` and keeps the provisional label; no stored value changed (checked by comparing the data before and after) |
| B Two modes | dialog, selection, order, grades toggle, text fields, Academic and Professional builders, Feedback Report builder | Selection and order respected; Professional shows no grades or review history by default; Academic labels all assessments AI-generated and self-reported items; the two PDFs differ meaningfully; four themes; Letter and A4 |
| D Visual | Institution spacing, typography floors | No text below the floors; no near-empty pages in the long fixtures; no display-type change |
| C-1 | images, Excel ranges, per-attachment include box, honest labels | Embedded images match the originals; the originals unchanged byte for byte |
| C-2 | Word text and Excel charts | Rendered content matches the source text; unsupported items fall back with a reason |
| C-3 | PDF pages (pdf.js), only if approved | Pages appear in order, capped, with a clear status |
| E | clickable contents, real-data and edge-case tests, docs | Links verified in the exported files; all tests in section 7 pass; ROADMAP, TESTING, CHANGELOG updated |

## Decisions I need from you
1. Timeline: **A only** (show what is stored, no first-review score) or also **B** (keep a small first-review summary from now on)?
2. **pdf.js** as the one new dependency for PDF pages, or reference-only for PDFs?
3. Where to keep your export choices: this device only (recommended) or in the course record?
4. Real-data testing: export a backup for me to copy into the preview, plus a few files for attachments?
5. Order A, B, D, C, E (my recommendation) or your original A, B, C, D, E?
