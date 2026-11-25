# Phase 4: Designed PDFs (S4) - Approach A approved; 4-1 (engine + Syllabus) built, awaiting design review

Status: **nothing built in the app.** Only this spec and two sample PDFs exist (`docs/pdf-samples/`). No Worker change, no AI call, no new library.

## What you asked for
Three designed PDFs on one shared engine: the **Syllabus**, the **Portfolio** (now including the capstone) and the **Feedback Report**. Rename "Course sheet" to "Syllabus" (the only visible place is the heading at `js/academic.js:46`; the tab is already called Syllabus).

## The samples (open these first)
- `docs/pdf-samples/sample-modernist.pdf` (The Modernist) and `sample-institution.pdf` (The Institution): four pages each: cover, Syllabus (schedule and the 80/20 grade rule), Portfolio (capstone card, graded record, separate self-reported project), Feedback Report (rubric table, findings with quoted passages, AI disclaimer).
- Content is fictional sample data. They were made by printing HTML with the app's own self-hosted fonts and theme colours through Microsoft Edge's print-to-PDF, which is exactly the method recommended below, so what you see is what the app would produce.
- Body text is a plain system font in both (like the app); only covers and headings take the theme. The two other themes (Editorial, Intellectual) follow the same pattern with their own fonts and colours.

## Two ways to build it
**A. Print engine (recommended).** A dedicated print layout (`css/print.css` + `js/print-engine.js`) renders a document into a hidden frame and opens the browser's print dialog; the learner chooses "Save as PDF". 
- For: no new library, works offline, tiny, real selectable and searchable text, accessible structure, uses the existing themes and fonts, the same code serves all three documents.
- Against: it is the browser's dialog, not a one-click download; page numbers in the footer use a newer CSS feature (works in current Chrome and Edge, not Safari or Firefox, which would print without page numbers); the learner may need to untick "Headers and footers" (the page margins are set to hide them where the browser allows).

**B. A bundled PDF library (jsPDF or pdf-lib, MIT).** One-click download with a fixed filename.
- For: no dialog, same file everywhere.
- Against: 0.3 to 0.9 MB of new code to cache, every table and page break has to be laid out by hand, the self-hosted web fonts must be converted and embedded, text accessibility is weaker, and three documents means a lot of new layout code to test. The result would look plainer than the samples.

(A server-side PDF through the Worker is rejected: it would send the learner's work and grades to a service for no benefit.)

## Scope (recommended A)
1. `js/print-engine.js`: builds a themed, paginated document from existing data only; never changes saved data.
2. Syllabus PDF: cover, description, outcomes, module schedule (with the capstone row), grading rule including 80/20 and the provisional note, credentials with the self-reported disclaimer.
3. Portfolio PDF: cover, capstone as a major culminating project, selected module work, graded record with the module / capstone / course-grade table, the self-reported final project kept separate, credentials. Only final versions.
4. Feedback Report PDF (one assignment, one review): summary, rubric table, findings by type with the quoted passage only where the app located it, what the reviewer could see, the AI-assessment disclaimer. **Option to include or leave out the learner's own submitted text** (default: left out, so a shared report does not expose the work).
5. A "Save as PDF" button on the Syllabus, Portfolio and the review screen; uses the course's own theme; Letter by default with an A4 choice.
6. Rename the "Course sheet" heading to "Syllabus".

## Acceptance criteria
- No data changes anywhere; courses without a capstone produce correct documents without capstone sections.
- Each document opens at the right page size, no clipped or overflowing content, no orphaned headings, tables do not split a row across pages, long text wraps.
- All four themes tested (two shown in the samples); dark theme covers print their background (the browser setting "background graphics" is forced on in the print layout).
- Provisional grades are labelled provisional; AI scores are labelled automated; self-reported items are labelled self-reported; nothing says "verified".
- Works with no network. Plain text is selectable in the saved PDF.
- Mock/automated checks plus a human look at each document in Edge/Chrome; Safari and Firefox noted as untested unless you test them.

## Steps (each stops for your OK)
4-1 engine and shared layout + Syllabus PDF and the rename; 4-2 Portfolio PDF; 4-3 Feedback Report PDF; 4-4 all four themes and A4; 4-5 release.

## Decisions I need from you
1. Approach **A (print engine)** or B (library)?
2. Do the sample designs look right (cover, headings, tables)? Anything to change before I build?
3. Feedback Report: leave the learner's submitted text **out by default** (with a checkbox to include it)?
4. Letter by default with an A4 option, or A4 by default?

## Design refinements requested after the 4-1 review (2026-11-25) - to be shown as new samples before 4-2/4-3 are built
1. **Portfolio = a curated collection of work**, not summaries. The learner picks which Demonstrate projects and the capstone appear and their order. Each project: an editorial introduction, then the actual work across as many pages as needed. Included where supported: typed submission text (stored in full), images (from the saved file), learner-dataset charts and tables. Files that cannot be rendered (PDF, Word, other): say exactly what is included and give a reference (name, type, size, date) and any preview; never imply the whole file is present.
2. **Feedback Report = an editorial assessment**: overall evaluation, strengths, corrections and next steps with a deliberate hierarchy; rubric table kept; verified quotations and passage locations kept; first review and final graded review shown as stages of one assessment history, each labelled (first review is automated feedback with no grade; the final grade is the one recorded).
3. **Four genuinely different interior art directions** (chapter openers, composition, graphic treatment, section organisation), on one shared engine of reusable components with per-theme presentation. Readability first, little ornament.
4. Test long-form: several projects, long feedback, variable page counts, no clipping or large empty gaps.
