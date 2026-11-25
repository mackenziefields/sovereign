# Phase 0: audit, preservation and Phase 1 plan

Status: complete, awaiting your review. No application file was changed in Phase 0.
Method for everything below: **code inspection** unless marked otherwise.

## 1. What exists (build 17)

About 4,600 lines, no build step, no framework. Static files on GitHub Pages plus an optional private Cloudflare Worker.

| Layer | Files | Role |
|---|---|---|
| Shell | `index.html`, `js/app.js`, `sw.js`, `manifest.webmanifest` | Hash router and `S.render` (rebuilds the whole view on every change), mobile drawer, service worker (network-first with revalidation, precache list) |
| Data | `js/store.js` | Saved state (`localStorage` key `sovereign.v3`), `normalize` (every load and import passes through it), selectors (`courseStats`, `moduleStats`, `grade`, `upNext`), review lifecycle (`finalizeWork`, `finalizeExpired`), starter and example courses, `S.THEMES` |
| Files | `js/files.js` | IndexedDB for uploaded files (kept out of backups), file classification, image downscale, `.xlsx` to text |
| Components | `js/components.js` | `h()` DOM helper, `field`, `select`, `progressBar`, `checkbox`, `tile`, `cover`, `titleEl`, `kindMark` |
| Views | `views-dash.js` (first run, dashboard, Portfolio, My Work, Data) · `views-course.js` (course shell, Home, Announcements, Syllabus, Modules, Module page, Assignments, Assignment page, Grades) · `views-work.js` (submit, AI review, 72-hour flow, office hours) · `views-ai.js` (course-building wizard, AI settings) | |
| AI client | `js/ai-client.js` | Calls the Worker: outline, resources, details, review. `courseFromOutline`, `writeDetails`, version check |
| Styles | `styles.css` (base) → `courses.css` → `ai.css` → `design.css` (identity) → `themes.css` (four course designs) | Later sheets override earlier ones |
| Worker | `worker/worker.js` (786 lines, `VERSION` 7), `worker/mock/harness.js` | Private. Models Sonnet 5.5 and Haiku 5.5. Not touched by Phase 1 |

**Routes:** `#/`, `#/work`, `#/data`, `#/new-ai`, `#/course/<id>[/announcements|syllabus|modules[/<moduleId>]|assignments[/<assignmentId>]|grades|portfolio]`.

**Data shape that Phase 1 reads (all existing):**
- Course: `designTheme`, `color`, `modules[]`, `startDate`, `ai`, `work`, `credentials`.
- Module: `title`, `overview`, `objectives[]`, `readings[]`, `syllabi[]`, `keyIdeas`, `selfCheck[]`, `reflection`, `extras[]`, `assignments[]`, `complete`, `duration`.
- Reading: `title`, `url`, `note`, `done`, plus AI labels (`source`, `kind`, `creator`, `access`, `sourceType`, `relevance`, `verification`).
- Assignment: `kind` (`learn|apply|demonstrate|''`), `basis`, `description`, `purpose`, `materials`, `parts[]`, `steps[]`, `format`, `submit`, `rubric[]`, `criteria[]`, `estimate`, `due`, `locked`, `points`, `score`, `done`, `portfolio`, `portfolioNote`, `work{phase,deadline,first,final}`, `office`.

**Verified baseline** (browser, 2026-11-24): all 47 routes render, export/import is stable, service-worker precache is reachable, no horizontal overflow at 375 px. See `TESTING.md`.

## 2. Dependencies and constraints that shape Phase 1

1. **Whole-view re-render.** `S.render` replaces the entire page on each state change. Anything stateful on screen must live in `S.ui` (in-memory UI state) or the existing `drafts` map in `views-work.js`. This is how drafts and open panels already survive. Tabs and the current stage must do the same.
2. **Pages are built by functions returning DOM** (`h(...)`). The sections of the current Module and Assignment pages are already separate builders, so they can be re-homed without rewriting their logic.
3. **Everything passes through `normalize`.** Phase 1 needs no new fields, so no migration.
4. **Offline:** every new file must be added to the service-worker precache list and the cache name bumped.
5. **The Worker only accepts requests from the GitHub Pages origin.** Real AI testing of new pages needs either your live site or `http://localhost:8765` added to `ALLOWED_ORIGINS` for the duration of testing (your Cloudflare setting, your choice). Without it I can only test with the mock harness.
6. **Themes** are CSS tokens on `[data-theme]`, so a page placed inside `.course[data-theme=…]` inherits them for free.

## 3. Recommended Phase 1 interface architecture

### Module page: "the studio"
```
┌ Module header: chapter marker (theme-styled) · title · progress ───────┐
│ Stage rail:  ○ Learn 3/5   □ Apply 0/2   ▲ Demonstrate 0/1             │
├────────────────────────────────────────────────────────────────────────┤
│  Stage panel (one at a time)                                           │
│                                                                        │
├ Next up bar: "Next: Read <title>"  ·  Previous / Next module ──────────┤
```
- **Route:** `#/course/<id>/modules/<moduleId>/<stage>` with `stage` = `learn | apply | demonstrate`. The stage is in the URL so the back button and links work. With no stage given, the page opens the first stage that has unfinished work (otherwise Learn).
- **Learn: the Reading Room.** Objectives; readings as resource cards (type tile, title, creator, source label, access and verification badges already stored, a done checkbox, Open link, edit and move controls); syllabi; Key ideas (your existing note field, now framed as notes); "Check your understanding" (existing `selfCheck`); and any `learn` assignments as reading checks.
- **Apply: the Case Lab.** `apply` assignments as cards (title, due, points, status) that open the workbench. Each shows its scenario preview line. Assignments with no kind go here and are labelled "Practice".
- **Demonstrate: the Portfolio Studio.** `demonstrate` assignments as larger cards with the deliverable, format, status and "saved to Portfolio" state.
- **Wrap-up** (below the stage panel, not a fourth stage): Reflection, custom sections, mark module complete, previous and next module.
- **No AI shown.** The Reading Room reserves layout space only. No button, label or placeholder for the Notebook or Reading Assistant appears until those features work (acceptance criterion 8).

### Assignment page: "the workbench"
Desktop (≥ 1100 px), two panes:
- **Left, Reference** with tabs: *Brief* (overview, purpose, steps, what to submit) · *Materials* (scenario, or readings for Learn tasks) · *Rubric* (weighted criteria).
- **Right, Workspace** with tabs: *Submit* · *Feedback* · *Office hours*. Opens on Feedback when feedback exists and on Submit otherwise.
- Both panes scroll independently, so a learner can read the scenario while writing.
- A slim header carries the stage marker, title, due, points, status, a breadcrumb (Module › Stage) and Previous / Next activity.

Mobile and tablet (< 1100 px): one column with a segmented control, in this order: Brief · Materials · Work · Rubric. The Work tab contains Submit, Feedback and Office hours as stacked sections. The active tab is remembered while you stay on the page.

### Navigation (Linear-inspired refinement)
- Left sidebar and course menu: smaller type, muted inactive items, a thin accent marker for the active item, tidy small inline-SVG icons (about 16 px, hand-drawn in the code, no icon library). Inactive text stays at 4.5:1 contrast or better.
- Contextual toolbar on cards: edit, move and remove appear on hover and focus, and always on touch devices (so nothing is hidden from keyboard or touch users).
- Surface layers: paper (page) → card → raised panel, using 1 px rules rather than shadows.

### Theme extension (presentation only)
Same DOM for all four designs. Each design sets: the module chapter marker and opening composition, section-title treatment, stage-rail accent, workspace surface tint, and resource-card treatment (all via the existing `--t-*` tokens plus a few new ones). Controls, tabs, forms and instructional text do not change between designs.

## 4. Reusable pieces

Reused unchanged (logic): `readingItem`, `assignmentItem`, `textSection`, `listSection`, `extraSection`, `syllabiSection`, `findMaterialsBtn`, `assignmentForm`, `writeBtn`, `S.workPanel`, `S.officePanel`, `S.portfolioToggle`, `feedbackView`, `S.kindMark`, `S.cover`/`titleEl`, `S.moduleStats`, `S.courseStats`, the `drafts` map, and every selector in `store.js`.

New (small, reusable across subjects): `S.tabs` (accessible tablist with arrow-key navigation), `S.resourceCard`, `S.stageRail`, `S.nextActivity(course, module, assignment?)` (a pure function over saved state), a few inline SVG icons.

## 5. How much JavaScript changes

Moderate, mostly re-arrangement.
- **No change:** `store.js` (schema and logic), `files.js`, `ai-client.js`, `views-work.js` (one optional parameter so the work panel can render without its collapsible wrapper; default behaviour unchanged), the Worker.
- **Rewritten:** `pageModule` and `pageAssignment` in `views-course.js` (about 250 of its 600 lines), changing layout only; they call the same builders.
- **New files:** `js/studio.js` (components), `css/studio.css`.
- **Small edits:** `app.js` (accept a stage segment in the route), `sw.js`, `index.html`, `design.css` and `themes.css` (navigation refinement and per-design tokens).
- **Optional, small:** a "Stage" selector on the assignment edit form so manual assignments can be placed in Learn, Apply or Demonstrate. It writes the existing `kind` field.

## 6. Risks and deferrals

| Risk | Mitigation |
|---|---|
| Re-render wipes tab state or textarea focus | Tab and stage state in `S.ui` and the route; drafts already persist in `drafts`; tab switches toggle visibility without re-rendering where possible. Test typing, switching and resubmitting. |
| Two scrolling panes plus sticky bars on phones (keyboard, safe areas) | Two panes only at ≥ 1100 px; single column below. Test at 375 and 768. |
| Assignments with no `kind` (manual courses) | Default to Apply, labelled "Practice"; optional Stage selector. |
| Your real Feminist Theory course exists only in your browser | I cannot see it. Please export a backup from Data & Backup and save it in the project folder as `test-data/` (kept out of any push). I will test with it locally. Otherwise I use the example and starter courses. |
| Real-AI review cannot be tested from localhost | Add `http://localhost:8765` to `ALLOWED_ORIGINS` while testing, or I test with the mock harness and say so. |
| Accessibility of tabs and the stage rail | Standard tab pattern, visible focus, 4.5:1 text contrast, no information by colour alone. Screen-reader testing is not something I can do; I will say so. |
| Production stability for your deadline | Frozen copy `Documents-Sovereign-STABLE-build17`; work on a local `phase-1` branch; `main` unchanged until you approve. |

**Deferred out of Phase 1:** Study Notebook, Reading Assistant, Discover, adaptive practice and knowledge checks, any Worker change, new stored fields, and any AI-related control.

## 7. Proposed Phase 1 scope and acceptance criteria

**In scope:** the Module studio (stages, resource cards, next-activity bar, wrap-up), the Assignment workbench (two panes, tabs, mobile segmented view), contextual navigation (breadcrumb, Previous/Next activity, stage rail), Linear-style refinement of the sidebar and course menu, and per-design module openings and surfaces.

**Acceptance criteria** (each will be recorded in `TESTING.md` with its method):
1. Open a module and move between Learn, Apply and Demonstrate with mouse and keyboard; the URL reflects the stage and Back works.
2. Every existing resource, objective, key-ideas note, self-check, reflection, syllabus, assignment and progress figure appears in the right place, with nothing lost.
3. Assignment brief, supplied materials, rubric, submission tools, office hours and feedback are all present and work (submit, review, resubmit, skip, attach, remove), checked with the mock harness and, if enabled, the real Worker.
4. Desktop (≥ 1100), tablet (768) and phone (375) layouts have no horizontal overflow and no unreachable control.
5. All four designs change the surrounding identity; the interface structure and controls are identical.
6. Data saved before Phase 1 loads unchanged: export, import and normalize are stable; no schema change.
7. Course creation (manual and AI), grades, submissions, the 72-hour process, due dates, Portfolio pieces, progress and file storage behave as in the baseline (`TESTING.md` B1 to B7).
8. Nothing is decorative or misleading: no control for a feature that does not exist.
9. Offline: new files are precached and the app loads with the network off.
10. Keyboard: all tabs and cards are reachable, with visible focus; text contrast at least 4.5:1.

**Estimate:** one focused phase, delivered in three reviewable steps: (a) components and the Module studio, (b) the Assignment workbench, (c) navigation refinement and per-design treatment. I would pause for your review after (a) and (b).

## 8. What I could not do in Phase 0
- **I cannot see your four reference screenshots or the Brilliant PDF.** Only the written text of your message reached me. Please re-attach them: the Linear and Brilliant references directly shape Phase 1.
- I cannot inspect your live Feminist Theory course (see risks).
- No automated test suite exists; baseline checks were scripted in the browser and are listed in `TESTING.md`.
