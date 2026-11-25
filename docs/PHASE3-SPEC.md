# Phase 3: Standalone course capstone (S3)

## DECISIONS (approved by you)
1. **Grade: fixed weight 20%** (default; adjustable before grading is a LATER feature). Course grade = 80% module average (the existing points-weighted average, unchanged) + 20% capstone. The capstone never counts as zero: until it has a final grade the course grade is the module average labelled **provisional**. The Grades page shows module average, capstone grade and combined grade separately. Courses with no capstone are exactly as before. No existing earned grade changes without an explicit user action (adding a capstone) and a plain explanation first.
2. **Existing courses: opt-in** "Create a Capstone" with a preview. **New AI courses generate a complete capstone during the build**; if that fails, the course is marked incomplete with a recovery action.
3. **Self-reported final project (`course.work`) is kept untouched**; the capstone is a separate record, shown separately in the Portfolio.
4. **Open from the start**; the capstone page lists recommended (not required) modules, objectives and skills that prepare for it.
Also: its own section beneath the module grid on the Modules page; full instructions, supplied exhibits, deliverable, weighted rubric, submission; reuses the Assignment Workbench, Review Studio and the 72-hour revision process; cumulative across modules; major culminating item in the Portfolio.

## Data model (3-1, built)
`course.capstone` (absent until created) is a module-shaped record kept OUTSIDE `course.modules`, with `status` ready|incomplete, `weight` (default 20), `prepares {modules[{id,why}], objectives[], skills[]}`, `assignments: [exactly one]` (kind demonstrate, `capstone: true`). `S.courseGrade(c)` holds the 80/20 maths; `S.grade(c)` (module average) is unchanged.

## Original draft below (kept for the record)
## (draft) awaiting your decisions

Status: not started. No code written. Worker v18 would be needed (v17 is deployed).

## What exists today
- `course.work` is a **self-reported final project**: title, criteria (3-5, from the outline's `finalProject`), status (not started / in progress / completed), description, reflection, optional link. Edited in My Work; shown on the Portfolio as "Course capstone".
- It has **no AI review, no workbench, no exhibits, no score**. The Grades page averages only scored assignments (`S.courseStats`: points earned / points possible).
- The outline already generates the project (title, description, criteria) but only one line of it is kept in `course.deliverable`.

## Proposed scope
1. **A course-level capstone record** (`course.capstone`, additive; `course.work` is left exactly as is and migrated by copy, never moved): brief, a staged plan, criteria/rubric, supplied exhibits (same Phase 2 packets), learner submission, reviews, final result.
2. **Full generation** at course build (Worker v18): a capstone that draws on the whole course (all modules' objectives), with a rubric, milestones and exhibits where it needs data. Generated for new courses; existing courses get a "Create a capstone" action with a preview, never silently.
3. **Workbench**: the same two-pane Assignment workbench and Review Studio, reused. Submit for feedback, then final review (same 72-hour rule), Office Hours allowed. Optional own data only if it is a Demonstrate-type capstone (same Phase 2D rules).
4. **Portfolio link**: the finished capstone appears in the Portfolio (replacing the self-reported block when a capstone exists; the old block stays when it does not).

## Decisions I need from you (grade policy approved BEFORE any grade maths changes)
**D1. Does the capstone count in the course grade?**
- A. **Not graded** (recommended default): feedback and a rubric result are shown, but the Grades percentage is unchanged. Zero risk to existing grades.
- B. **Graded as one assignment**: its points join the existing points-weighted average (no new maths; it just adds points).
- C. **Fixed weight** (e.g. 20% of the course): new maths, so a weighted grade; needs a stated rule and a Grades-page explanation.
**D2. Existing courses**: opt in per course (recommended), or offered automatically?
**D3. Self-reported project**: keep it available alongside the capstone (recommended), or retire it once a capstone exists?
**D4. Lock until ready?** Free to start any time (recommended; matches the rest of the app), or only after a share of assignments are done?

## Acceptance criteria
- Existing courses, grades, saved reviews and backups are byte-identical until the learner creates a capstone (verified by a before/after snapshot).
- Under D1-A the course percentage never changes when a capstone is added, scored or deleted.
- Capstone generation fails safe: bad output is rejected by the same validators as assignments; nothing is stored on error.
- The review uses the existing evidence-linked schema; Office Hours never touches the capstone result.
- Works with a Worker older than v18 (option hidden with a plain explanation).
- Mock tests first ($0); then **one capped real-AI generation plus one review**. Estimate about $0.15-$0.25 total; I will give a firm figure and ask approval and a cap before any paid call.
- ROADMAP, CHANGELOG, TESTING updated; no commit, push or deploy without your approval.

## Proposed steps
3-1 data model + store normalizer + migration-by-copy; 3-2 Worker v18 generation (mock-tested); 3-3 create/preview/approve UI; 3-4 workbench + review reuse; 3-5 Portfolio link and (if chosen) grade rule; 3-6 capped real test; then release.
