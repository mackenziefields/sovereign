# Phase 5 (S5): Dashboard Learning Progress — proposal (awaiting approval)

Replaces the Dashboard's "Module library" list with a **Learning progress** section. Display only: no data shape changes, no Worker changes, no AI calls, nothing stored. It reads what is already saved (`S.courseStats`, `S.moduleStats`, `S.courseGrade`, `S.capstoneOf`, work phases).

## What the learner sees (per course, one row each)
1. **Course and modules:** "4 of 7 modules complete", with a segmented bar (one segment per module; complete / in progress / not started, distinguished by fill and label, not colour alone).
2. **Where you are:** the current module (first not-complete) with its items done (readings and assignments), linking straight to it.
3. **Work status:** counts of assignments not started / drafting / reviewed (inside the 72-hour window) / final, so open reviews are visible.
4. **Grade:** `S.courseGrade` as already defined (module average; 80/20 with a graded capstone; "provisional" label until the capstone is graded; never counts an ungraded capstone as zero). Ungraded shows "Not graded yet", never 0.
5. **Capstone:** shown as its own final step after the modules: not created / ready, not started / drafting / in review / final with score. Links to the capstone screen. Courses without a capstone show nothing extra.
6. **Totals strip (masthead):** keeps Courses, Modules complete, Assignments open; adds "Capstones finished" only when at least one course has a capstone.

## Rules
- Honest empty states ("No modules yet", "Not graded yet"); no streaks, points or gamification (roadmap rejects them).
- Same layout standards as before: full-width, themed tokens, type floors, keyboard reachable, text labels on every bar (`role="img"` with a plain-language label).
- The old list's job (jump to any module) is kept: each course row expands (`details`) to its module list with the same links and percentages, so nothing is lost.
- Works offline; builds from saved data only; no new files other than tests.

## Build and test plan
- Pure helper `S.progressOf(c)` in `js/store.js` returning the numbers above (unit-tested separately from the DOM).
- `V.dashboard` renders it; small CSS block in the existing stylesheet.
- Tests (fictional data, storage untouched): no modules; all done; mid-course; capstone each state (none, ready, drafting, reviewed, final, ungraded); grade basis combined/provisional/none; huge course (30 modules); rendering contains no `NaN`/`undefined`.
- Browser check at desktop and phone widths; then docs (ROADMAP, CHANGELOG, TESTING). Build 33; released only on your say-so.

## Questions for you (defaults if you just say "approve")
1. Keep the module list behind a per-course expand (default), or drop it entirely?
2. Show the letter grade next to the percentage (default: yes, as on Grades)?
