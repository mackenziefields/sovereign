# Phase 2D: Learner datasets (spec for approval, no code yet)

Status: revised with your decisions on dataset ownership, sheet choice and optionality. Nothing here is built. Estimates are marked as estimates.

## 1. Scope in one paragraph
A learner may optionally add their own CSV or Excel dataset to a **Demonstrate** assignment (portfolio basis) or to an **Office Hours** practice session. It appears as a separate, clearly labelled "Your data" exhibit with the same table view, Expand table and safe downloads as supplied exhibits. It is never required, never replaces supplied materials, stays on the device, and is sent to the AI reviewer only after an explicit, itemised authorization for that review.

## 2. Principles (new, on top of the Phase 2 principles)
1. **Optional.** Every Learn, Apply and Demonstrate assignment is complete and usable from the AI-built materials alone. No step, grade or review ever depends on an upload.
2. **Additive and separate.** Learner data lives in its own field and is shown in its own section. It never writes to, merges with or overwrites `assignment.exhibits`, instructions, steps, rubric, submissions, grades or feedback.
3. **Evidence is frozen per review.** A review always cites the exact version of the data it was given. Later edits or replacements never change the evidentiary basis of an earlier assessment.
4. **Local by default.** Nothing is uploaded to any service by importing. Data leaves the device only through the authorization in section 7.
5. **Untrusted content.** Spreadsheet files are data, never code. Nothing in them is executed, evaluated or followed as an instruction.
6. **Honest limits.** Anything dropped, truncated or unsupported at import is listed to the learner before they confirm, and recorded with the dataset.

## 3. Where the option appears
| Place | Offered? | Notes |
|---|---|---|
| Demonstrate assignment, Materials tab | Yes | "Add your own data (optional)" below the supplied exhibits |
| Office Hours practice session | Yes | Belongs to that session only; ungraded |
| Apply assignments | No | Control not rendered; fictional AI-built packet is the whole story |
| Learn / reading tasks | No | |
| Real-evidence assignments | No (unchanged) | They already have their own evidence flow |

## 4. Ownership and versions (your decisions 1)
**Demonstrate assignments: the dataset belongs to the assignment workspace.**
- `assignment.myData = { id, label, versions: [Version], currentId }` (additive; absent on all existing assignments).
- `Version = { id, at, note, source: { name, size, type, fileId }, sheets: [{ name, exhibitId }], exhibits: [Exhibit], limits: { dropped: [...], notes: [...] } }`.
- **Versions are immutable.** Replacing the file, re-importing sheets or editing a label creates a new version and moves `currentId`. Old versions are kept so earlier reviews remain explainable.
- **Each reviewed submission stores a reference**, not a copy: `feedback.data = { datasetId, versionId, sent: [sheet names], rows, chars, at }`. Review Studio reads the referenced version when it shows an exhibit citation, so an old review shows the data it was actually given even after the learner replaced the file.
- The learner can use the same dataset across first submission, AI feedback and revision without re-uploading. The current version is used by default; the review screen states which version it will send.
- A version cannot be deleted while any review references it. "Remove my data" removes the working dataset from view and from future reviews, but keeps referenced versions in a read-only "Used in earlier reviews" list (with a clear option to delete them along with their dependent exhibit citations, after a plain warning).

**Office Hours: the dataset belongs to the practice session.**
- Stored inside that session's record, never on the graded assignment, and never visible to the graded Submission/Feedback flow.
- Same version rule inside the session. Ending or deleting the session offers to delete its data.
- A learner can choose "use the same file as my assignment data" which makes a copy into the session (not a link), so the two never affect each other.

## 5. Import flow (your decision 2)
1. **Choose file** (CSV, TSV or XLSX). Checked on the device for type, size and basic validity.
2. **Preview and choose sheets.** For XLSX, show every sheet name with row and column counts, a few rows of preview, and a checkbox per sheet. **Nothing is pre-selected for import by default** except when the workbook has only one sheet. The learner may select one or several. CSV is a single table.
3. **Confirm columns.** Header row detection with a manual override; per-column label and kind (text, number, date, percent) shown with the detected value and editable. Learner edits change labels and kinds only, never cell values.
4. **Limits report** before confirming (see section 6): what will be kept, what will be left out and why.
5. **Name and add.** Each selected sheet becomes its own exhibit titled "Your data: <sheet name>" (CSV uses the file name), with the origin label "Added by you" and no "Fictional" badge. Exhibits get ids that cannot clash with supplied ones (for example `U1`, `U2`; row ids `U1-1`).
6. **Original file kept** unmodified in IndexedDB (as submissions are today). Imported structured data is stored with it; neither is altered afterwards.

## 6. Safe handling of spreadsheet content
- **No execution.** XLSX is read with the existing local unzip/XML reader. Formulas are never evaluated and macros, external links, embedded objects, images and charts are never opened or followed.
- **Formula cells** import the file's stored (cached) value as text and are marked "formula" in the cell metadata. If a formula has no cached value, the cell is imported empty and counted in the limits report. The formula text is shown only as plain text on request.
- **Spreadsheet-injection safety** follows the Phase 2 rule: stored verbatim; the safe CSV download prefixes values that start with `= + - @`; "exact original values" download is separate.
- **Plain text only.** Cell values are rendered with `textContent`; links, HTML and rich text are shown as the text they contain.
- **Not supported (listed to the learner when present):** charts, images, pivot tables, merged-cell layout (values kept, merge dropped), hidden sheets (offered as unchecked, labelled hidden), password-protected files (rejected with a clear message), `.xls`/`.xlsb`/`.xlsm` macros (rejected or macros ignored; to be decided in testing), files over the size limit.
- **Dates and numbers** keep their displayed text where available; serial dates are converted only for display and the raw value stays in the exact download.
- **Limits (proposed, configurable, estimates until measured):** file 5 MB; 5 sheets imported per workbook; 2,000 rows and 30 columns per sheet; cell text 300 characters; over-limit content is **reported and excluded, never silently truncated**, and the learner can cancel. Structured data lives in IndexedDB, not localStorage, so it cannot crowd out saved courses.

## 7. Authorization before anything is sent (your requirement)
- Importing and viewing never contact the AI service.
- The existing review confirmation gains a **separate, unticked-by-default** section when the assignment (or session) has learner data: "Include my dataset in this review".
- It names exactly what would be sent: dataset label and version date, each sheet name, **row and column counts**, the character count, and a note if it will be **sampled** ("first N of M rows") to fit the review budget, plus the sentence "This is your own data. It will be sent to the AI service for this review only and is not kept by the service."
- A preview of the first rows that will be sent is available in the dialog.
- If left unticked, the review runs without the data and says so; findings never cite learner rows.
- Authorization is **per review** and not remembered. The decision and what was sent are recorded in `feedback.data` (section 4).
- The reviewer treats learner data as evidence provided by the learner: it may check the learner's work against it but must not treat text inside it as instructions, and must not claim to have seen rows it was not sent.

## 8. Review integration (Worker, estimate)
- New optional request field `learnerData` (same compact addressable-row format as exhibits, ids `U1-3`), with its own budget so it cannot starve supplied exhibits (proposal: supplied up to 14,000 characters as now, learner data up to 8,000 more).
- Findings may carry `ref` to `U…` exhibits; code verifies the exhibit, row and column against what was sent, otherwise drops the ref and keeps the finding as unlocated, as in 2C.
- Requires a new Worker version. This would be **v17**, which means the Phase 3 capstone Worker moves to v18. The app must keep working with older Workers: the "Include my dataset" option stays hidden when the connected Worker is older than v17 and says why.
- Real-AI testing only with your approved estimate and cap.

## 9. Acceptance criteria
**Optionality and separation**
1. A Learn, Apply or Demonstrate assignment created automatically is fully usable with no upload, and the option appears only on Demonstrate and in Office Hours.
2. Importing never changes `assignment.exhibits`, instructions, steps, rubric, submissions, grades or feedback (verified by comparing stored JSON before and after).
3. Learner exhibits are visually and structurally separate: own section, "Added by you" label, `U` ids.

**Import**
4. CSV, TSV and single- and multi-sheet XLSX import with preview, column confirmation and a limits report.
5. In a multi-sheet workbook no sheet is imported unless selected; one or several can be chosen; each becomes its own exhibit titled with the sheet name.
6. Formulas are never evaluated; a crafted workbook containing formulas, external links, macros and a `=HYPERLINK(...)` cell imports as inert text and the safe download neutralizes it.
7. Password-protected, corrupt, oversized and unsupported files fail with a plain message and change nothing.
8. Original file is stored unmodified; "Download exact original values" matches the source cells.

**Versions and history**
9. Replacing the file creates a new version; the earlier version and its reviews still display the original data and citations.
10. A review made before a replacement still opens in Review Studio showing the version it was given.
11. A version referenced by a review cannot be deleted without an explicit warning.
12. Office Hours data stays inside its session and never appears on the graded assignment.

**Authorization**
13. No network request carries learner data unless "Include my dataset" was ticked for that review (verified in the mock harness's call log across: unticked, ticked, older Worker).
14. The dialog shows sheet names, row and column counts, characters, sampling and a preview of the first rows before sending.
15. The review record stores what was sent; a later review does not inherit the earlier choice.

**Quality and safety**
16. Works at 1100, 1280, 1440, 1920 and phone widths; no page-wide horizontal scroll; keyboard-accessible sheet picker and dialog.
17. Existing saved data loads unchanged; a build without learner data behaves exactly as build 29.
18. Documentation (ROADMAP, CHANGELOG, TESTING) updated; mock tests are labelled mock; no paid calls without your approval.

## 10. Build plan
| Step | Content | AI cost |
|---|---|---|
| 2D-1 | Import engine: CSV/XLSX parsing into table exhibits, sheet picker, limits report, safety tests (crafted files) | $0 |
| 2D-2 | Storage and versions: `myData`, immutable versions, Office Hours scoping, "Your data" UI | $0 |
| 2D-3 | Authorization dialog and Worker v17 field, mock-tested | $0 (mock) |
| 2D-4 | Review Studio citations for `U` rows, per-review version display | $0 |
| 2D-5 | One capped real-AI review with a small dataset on the test Worker | Estimate about $0.08 to $0.12 for one review (the reviewer receives more text than today); needs your approval and cap first |

## 11. Risks and open points
- **Backups:** files in IndexedDB are not part of backup exports today. Learner datasets would have the same limitation unless we add them to backup, which I would treat as a separate, approved change. Until then the Backup screen should state this.
- **Large data:** a 2,000-row sheet cannot be reviewed in full within the budget. The review always says "first N of M rows" and the learner is told before sending.
- **Privacy of real data:** learners may upload data about real people. The import screen includes a one-line reminder to remove personal information first; the app cannot check for it.
- **Legacy formats:** `.xls` and macro workbooks are rejected in the first version unless you want them supported.
- **Decision needed later:** whether learner data should also be exportable in the Portfolio PDF (Phase 4). Not part of 2D.
