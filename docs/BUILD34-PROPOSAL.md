# Build 34 proposal: learning path, quizzes, calmer Reading Room (approved 26 Nov 2026)

Requested 26 Nov 2026 after the money-laundering (CAMS) course test. Nothing here is built yet.

## Order (each step reviewed before the next)
| Step | What | Worker change? | AI cost to test |
|---|---|---|---|
| A | Safety and known gaps: AI-off cache protection; capstone in the Portfolio "Graded record"; editable capstone weight; "In progress 100%" fix | No | $0 |
| B | Calmer screens: Reading Room cards, Key ideas as bullets, new stage icons, short assignment summaries | No (summaries for new courses come with step D) | $0 |
| C | Learning path locks: Learn → Apply → Demonstrate, module by module, capstone last; modules complete themselves | No | $0 |
| D | New generated content: multiple-choice quizzes, three reflection questions, assignment summaries, foundational texts | Yes (Worker v19, test Worker first) | about $0.50 to $1.50, capped |
| E | Review accuracy re-test (your IJT 101 cases) | No (unless the re-test shows a problem) | about $0.10 to $0.30, capped |

## A. Safety and known gaps (approved by you)
- `sw.js`: only delete caches named `sovereign-v3-*`, so a release never wipes the AI-off copy's offline cache (both live on mackenziefields.github.io).
- Capstone row in the Portfolio "Graded record" table; capstone weight editable on the Grades page (default 20%, range 0 to 50%; the grade maths already uses it).
- Dashboard: a module with every item done but not complete shows "Ready to finish", not "In progress 100%". (Step C makes this rare.)

## B. Calmer screens
1. **Reading Room cards** show: number, title (link), author/publisher line, "Why it fits", To read. Removed from view: the "By" line, "Page title", "Checked by a program…" and all tags except **AI-suggested**. The removed checks stay saved and sit behind a small "Source details" toggle (closed by default), so you can still audit a link.
2. **Key ideas** render as a real bulleted list (the saved text is unchanged; lines starting "- " become bullets).
3. **Stage icons:** moon = Learn, star = Apply, sun = Demonstrate, comet = Wrap-up. Simple line icons drawn in the app (no image files), with the word always beside them.
4. **Assignments page:** each assignment shows a one- or two-sentence summary instead of the full brief. New courses get a written summary from the AI (step D); existing courses show the brief's first sentence, cut cleanly. Full brief stays on the assignment's own page.

## C. Learning path locks (your rules)
- **Everything stays visible.** Locks stop *submitting*, never reading.
- **Inside a module:** Apply opens after Learn is done; Demonstrate opens after Apply is submitted. "Learn done" = the quiz is passed and every Learn assignment is submitted.
- **Between modules:** a module's submissions open after the previous module is complete (all assignments submitted and all three reflections written).
- **Capstone:** opens after the last module is complete.
- **Modules complete themselves.** The "Mark this module complete" box is removed; the module is marked done when everything above is submitted.
- **Each locked button says why and links to what is missing** ("Finish the Learn quiz first →").
- **Existing courses:** anything already submitted stays as is (never undone); locks apply only to what is not yet submitted. Modules you already marked complete stay complete.
- "Submitted" means sent for review or saved as final; the 72-hour revision window is unchanged.

## D. New generated content (Worker v19)
1. **Check your understanding becomes a quiz:** 3 to 5 multiple-choice questions per module, 4 options each, one correct answer, a one-sentence explanation shown after answering, written from the module's key ideas and readings. Answers are saved. Retry allowed.
2. **Three reflection questions per module** (one each on the Learn, Apply and Demonstrate work), unique to the module, each with a text box. Answers are saved and included in backups.
3. **Assignment summaries** (one or two sentences) written with the assignment details.
4. **Foundational texts** (see below).
5. **Existing courses:** an "Add quiz and reflections" button per course (one small AI call per module; shown with its estimated cost before you run it). Until then, old courses keep their current check list and single reflection, now with a text box.

### Foundational texts: how the AI can know (your question 1)
It cannot know every field's canon with certainty, but it can do much better than now, in three layers:
1. **Ask the model for the canon at course design.** The outline step (the larger model) lists 2 to 5 foundational primary texts for the field and goal: statutes and regulations, official manuals and guidance (for example the DOJ Justice Manual), standards, and, when you name an exam, the certifying body's official exam content outline or candidate handbook. Each is assigned to a module between 1 and 3, with a search phrase. Large models know the core texts of established fields well; they are weaker on new or niche fields.
2. **Find and verify the real page.** The reading search then looks for those named texts first and checks the link opens and the title matches, as today. A text whose page cannot be verified is shown as "Foundational, link needed", never invented.
3. **Let the learner name them.** A new optional box on Build with AI: "Texts you know you need (optional)", for example "DOJ Justice Manual, FATF Recommendations". These are always included and searched first. Your mom's expertise goes in here.
Foundational readings get a small "Foundational" label (the one tag besides AI-suggested that a learner sees).

## E. Review accuracy re-test (approved by you)
Re-run your two IJT 101 cases on the current reviewer: the Explain Data Pitfalls review (the 1,200 vs 1,000 records "arithmetic mistake") and the Office Hours review on the Riverton dataset (invented details). Needs from you: the seven-page PDF and, if you can, screenshots of the two assignment pages (the Riverton dataset). I run them on the test Worker with a cap, compare with your saved feedback, and report before any change. Stricter checking that Apply and Demonstrate work uses the Learn readings can be added to the reviewer here if the locks in step C are not enough.

## Decisions (26 Nov 2026)
- Approved; step A started.
- **Quiz pass mark:** 2 of 3 (or 3 of 5) correct counts as passed; unlimited retries.
- **Quiz content:** questions must come from the module's Reading Room resources, not the topic in general. The Worker will read the resources' pages (the same page reader that "Check content" uses) and write each question from a specific reading, naming it. A reading whose page cannot be read is not quizzed; if fewer than two can be read, the quiz falls back to the key ideas and says so.
- **Capstone:** submissions open only after the last module is complete.
- **Daily budget:** you set `DAILY_BUDGET_USD` to 10 and added $10 of credit.
