# Review pipeline audit (stress test IJT 101, 2026-11-25)

Method: **I read the three PDFs** (your seven-page submission and the two feedback reports, as extracted text) and **inspected the code** (`js/ai-client.js`, `js/views-work.js`, `worker/worker.js` `/review`). **No code was changed and no paid call was made.** I could not render the PDFs as images in this environment, so the charts inside your submission (Figures 1 to 4) were not viewed; anything about chart labels is marked unverified.

## 1. What the reviewer actually received

Graded review (`ai.review`) sends: course title and level; assignment **title**, **overview** (clamped to 2,000 characters) and points; round; rubric names and maximums; in round 2 only the list of improvement sentences from round 1; and your submission.
Office Hours (`ai.office`) sends: course title and level; assignment title and overview; **the text you typed into "What are you working from?"**; round; your submission. No rubric.

| Item you asked about | Sent for graded review | Sent for Office Hours |
|---|---|---|
| Complete overview | Yes | Yes |
| Full numbered steps / questions (`a.parts`) | **No** | **No** |
| Required deliverable (`a.submit`) and format | **No** (only if the overview says it) | **No** |
| Supplied materials (the scenario, the Riverton rows) | **No** | **No** |
| Rubric and weights | Yes | No (ungraded) |
| Module objectives and key ideas | **No** | **No** |
| Assigned reading titles | **No** | **No** |
| Reading text | No (never retrieved) | No |
| Your submission | Yes | Yes |
| Round 1 submission and full round 1 feedback (for round 2) | **No** (only the "improve" sentences) | **No** (same) |

Your concern is confirmed: the reviewer knew what the assignment was called and its overview, not what you were told to do step by step, not the module's key ideas, not the readings, and not the supplied materials.

## 2. Findings: your submission vs the two reports

Submission facts I checked in the PDF text: 1,200 filings, 200 deleted, headline "City Records Only 1,000 Eviction Filings"; rents $1,000, $1,100, $1,200, $1,300 and a luxury unit (mean $2,000 and median $1,200 stated); table 10,000 households / 500 filings and 1,000 / 200; $1,000 at 20% inflation = $1,200, vs $1,250 = $50 or about 4.2%; the "Honest charts" row sits in a table headed "Connection to the module's key ideas".

### First review (graded Learn assignment, Explain Data Pitfalls)
| Claim in the feedback | Verdict | Why |
|---|---|---|
| Structure is consistent and easy to compare | Accurate | Seven labelled parts on every mistake |
| Mistake 3 table matches chart, 4x gap correct | Accurate | 500/10,000 = 5 per 100; 200/1,000 = 20; the caption says four times |
| Mistake 2 rents give mean $2,000, median $1,200 | Accurate | Checked by sum |
| Mistake 5 headline, permits vs completed units | Accurate | Present on page 6 |
| **"Fix the Mistake 1 arithmetic: 1,200 − 200 = 1,000 but the headline says only 1,000, which is the reporter's error"** | **Inaccurate framing** | Your arithmetic is right and the headline is *meant* to be the reporter's error. The feedback itself says "which is the reporter's error" and then still files it as an arithmetic fix. At most this is an optional clarity improvement (state 1,200 vs 1,000 next to the headline). |
| Summary: "arithmetic and logic slips (Mistake 1 and Mistake 4)" | **Overstated** | No arithmetic slip exists in either; the Mistake 4 numbers are correct. |
| Mistake 4 "How it misleads" sentence is muddled | **Partly accurate** | The sentence mixes "decline in purchasing power" with "real increase" and is hard to follow. A clarity issue, not a calculation error. Its suggested rewrite (25% headline vs about 4.2%) is correct. |
| "Add a baseline example to Mistake 4" | Accurate, optional | The explanation mentions an unusual start year but the illustration shows only inflation. |
| **"Remove the 'Honest charts' row: it is not one of the five mistakes"** | **Likely inaccurate** | That table is the module's *key ideas*, not the five mistakes. The reviewer never received the key ideas, and elsewhere says "All module key ideas appear". It contradicts itself. (I cannot see the module's key-idea list from here.) |
| "Verify and soften unsupported reading claims" (median-based measures) | **Unverifiable by the reviewer** | The reader's text was never supplied. Asking you to re-check is fair, but it should have said "I cannot verify the reading", not "unsupported". |
| Mistake 5: add a check "whether rent rose before permits were filed" | **Partly redundant** | Your corrected approach already says "examine the timing of changes". |
| Figure 2 title clipped; Figure 4 is a generic placeholder | Figure 4: supported by your caption ("general illustration... not actual housing data"). Figure 2 clip: **not verified** (image). |
| Rubric comment: Mistake 1 has "a logic slip around the deleted count... keeps this from full marks" | **Inaccurate and consequential** | If you do not resubmit, this first review becomes your grade after 72 hours, so a wrong criticism can cost points. |

### Office Hours (same PDF against the Apply assignment)
| Claim | Verdict | Why |
|---|---|---|
| The file is a seven-page explainer, not the spreadsheet and memo the assignment asks for | **Accurate** | It is the right finding for this mismatch |
| Figure 2 and inflation arithmetic correct | Accurate | Verified |
| "Check case numbers, unit and filing date before removing any row" | **Not grounded** | The Riverton table has only an ID, landlord, neighborhood, date and rent. There are no case numbers or units. This echoes your own Mistake 1 text, not the data. |
| **"Row 14: 'Oakvale Props LLC' changed to 'Oakvale Properties LLC' to match rows 3 and 9"** | **Invented** | The data has 12 rows, the landlord is Oakline (row 3 is "Oakline Prop."), and there is no Oakvale. |
| "If the table lacks a unit count for a landlord, state that you cannot compute it" | **Reveals missing context** | The table *does* give units; the reviewer hedged because it never saw it. |
| Contradicts the first review | **Inconsistent** | First review: Mistake 1 and 4 "slips". Office Hours: Mistake 1 "describes the right cleaning discipline", Mistake 4 "accurate". The second reading is closer to correct. |

## 3. Root causes (code level)
1. **The supplied materials are never sent**, so the reviewer cannot ground examples in them and invents specifics (`Row 14: Oakvale`).
2. **Steps, deliverable, module key ideas, objectives and readings are never sent** (`js/ai-client.js` lines 295 to 306 and 283 to 294), so it infers what you were asked to do from the title and overview, and misjudges key-ideas content.
3. **"Office Hours" is defined as "your own material"**. You typed "Fictional Scenario"; the reviewer was told you chose your own material called that. It was never told "this is the Riverton exercise".
4. **The prompt forces every comment into the shape "an action verb telling you to fix something"** (`worker.js` /review: "improvements (each starts with an action verb and says how)") and says "Grade honestly and do not inflate". There is no category for "optional", "already correct" or "cannot verify", so an optional clarity idea is written as "Fix the arithmetic".
5. **No evidence requirement.** Findings are free-text sentences. Nothing asks for a quote, and nothing checks that what is called "missing" is not already on the page.
6. **Round 2 sees only the revised work** plus the old improvement sentences, not the first version, so "was this addressed?" is a guess.
7. Consistency: one unconstrained pass, free-text output, no anchored scoring guide. The two reports disagreed on the same facts because they were judging with different, incomplete context.

## 4. Smallest reliable changes (Phase 1A, in order of value per risk)
1. **Send the full context** (app side, additive): steps with their questions, deliverable and format, supplied materials (as text for now), module title, objectives and key ideas, reading titles (marked "title only: the reader has not seen the text"), the assignment stage. About +1,500 to 3,000 input tokens.
2. **Rewrite the review prompt and schema** (Worker v14, additive): findings become objects `{ type: error | partial | developable | missing | optional | strength, claim, evidence (a verbatim quote from the work, or "none: not present"), alreadyPresent (a quote if the thing the critique says is missing actually appears, else "none found"), fix, example }`. Rules: no minimum count; an `error` needs a quote and a stated reason; if `alreadyPresent` is not "none found" it cannot be an `error` or `missing`; examples must come from the supplied materials or be labelled "illustrative, not from the data"; never cite a reading's content as verified.
3. **Code checks before showing feedback** (Worker): verify every quoted `evidence` string exists in the submission when the work is text (normalised whitespace); mark each finding `located: true|false`; downgrade an `error` whose evidence is not found; scan quoted strings in suggestions against materials + submission + assignment and relabel unmatched ones "illustrative". Recompute rubric totals as now.
4. **Office Hours gets two modes**: *Practice this assignment* (full context, the real rubric as a guide, ungraded, never touches `a.work`) and *Explore with my own material* (stated alternative context, ungraded). The page says which task is being evaluated.
5. **Round 2** also sends the first review's findings and, for text work, the first version.
6. **Keep the old fields** (`summary`, `strengths`, `improvements`, `nextSteps`, `criteria`) so saved feedback, backups, the Feedback tab and Office Hours histories still display. New `findings` is additive and optional.
7. **Optional second pass** (an auditor call that re-checks each `error`/`missing` finding against the work) only if the eval shows the single pass is not enough; it roughly doubles cost.

Presentation (side-by-side, highlights, report PDF) waits until the substance is reliable.

## 5. Feasibility of locating passages
| Work type | Locating a quote | Notes |
|---|---|---|
| Typed text | **Reliable** (exact match after whitespace normalisation) | Highlight in place |
| PDF | Feasible with a bundled viewer (pdf.js: Apache-2.0, runs on the device, cacheable for offline; weight on the order of a megabyte, to confirm before adopting). Text-layer match gives page and position. Your PDF's text extracts with odd line breaks, which normalisation handles. | **Charts and images inside a PDF cannot be matched by quote**: page-level only |
| Spreadsheet | **Reliable if the model cites sheet and cell** (the app already reads cell values) | Needs the cell addresses sent with the values |
| Image | **Not reliable**; no text to match | Show the feedback, point to "the whole image", no highlight |
Rule: never show a highlight or page number unless the code located it; otherwise show "no exact passage match was found".

## 6. Eval set v1 (repeatable; uses your real PDF and records)
Fixtures (kept in `test-data/`, not released): your PDF; the real assignment records (Explain Data Pitfalls and Riverton: overview, steps, materials, rubric); a text version of the PDF; two edited text versions (A: a real arithmetic error, 1,200 − 200 = 1,100; B: the denominators removed from Mistake 3).
| # | Case | Expected |
|---|---|---|
| E1 | PDF vs Learn assignment, graded | No `error` on Mistake 1 arithmetic; Mistake 4 numbers recognised as correct; Mistake 4 wording a `partial`/`optional`; reading content "cannot verify" |
| E2 | PDF vs Apply (Riverton), Practice mode | "Not the deliverable" as `missing`; every example row and name exists in the 12 rows or is labelled illustrative |
| E3 | PDF in Explore mode with a stated own material | Judged against the stated material, ungraded |
| E4 | Text version A (planted error) | The planted error **is** found (guards against over-correcting) |
| E5 | Text version B (missing denominators) | Flagged as `missing`, with a quote showing the gap |
| E6 | E1 repeated 3 times | Same `error`/`missing` set each time; wording may vary |
| E7 | Office Hours then check grades | `a.work`, score, final and Grades/Portfolio unchanged |
Mock tests cover plumbing: schema validation, quote location, relabelling, old feedback still displays, Office Hours never touches the grade, 72-hour finalisation unchanged. **Real-API estimate** (not approved, nothing run): single pass about $0.07 to $0.10 per review (today about $0.05 to $0.06); E1 to E5 plus two repeats of E1 is 7 reviews, about $0.50 to $0.70. A cap of **$0.75** is my proposal. Your original reports are the free baseline.

## 7. Proposed development sequence
| Phase | Scope | Why this order | Worker |
|---|---|---|---|
| **1A** | Context + evidence schema + code checks + Office Hours modes (build 24) | The trust problem; additive and reversible | v14 |
| **1B** | Eval set, mock tests, capped real test, then your review | Proves 1A actually fixed the substance | none |
| **1C** | Review Studio: side by side, then highlights where located (text, spreadsheets, then PDFs with a bundled viewer after a licence and size check) | Needs 1A's evidence data | none |
| **2** | Structured materials: typed blocks (paragraph, table, dataset, document, timeline, transcript, simple chart from supplied data), sanitised rendering, CSV download; old text materials unchanged | Phase 1A already sends materials as text, so no dependency; 2 later improves what the reviewer sees | v15 |
| **3** | Standalone capstone: course-level record, full generation, workbench, Portfolio link. Grade policy explained and approved **before** any grade maths changes | Needs the review system | v16 |
| **4** | Syllabus PDF, Portfolio PDF, and the Feedback Report PDF **on one shared PDF engine** (rename "Course Sheet" to "Syllabus" here); two sample PDFs in different themes for your approval first | One engine instead of three; includes the capstone from 3 | none |
| **5** | Dashboard Learning Progress: stage completion per course, upcoming milestones, capstone progress, recent completions (only values computable from course data) | Needs the capstone; low risk | none |
Change from your order: the Feedback Report PDF moves into Phase 4 so there is one PDF engine.

## 8. Open risks
- The eval measures consistency and grounding, not whether the grading is "right"; a human check of the first real results is part of the plan.
- A model may still misjudge a chart image. The code cannot verify chart contents.
- I could not view the charts or the module's key-idea list, so two findings above are marked unverified.
