# Syllabus sourcing: audit (Track B, step 1)

Method: **code inspection** of `worker/worker.js` (`handleResources`, `handleSyllabus`, `callClaude`, `rankAndVerify`) and `js/ai-client.js`, `js/views-course.js`, `js/store.js`. **No real syllabus has been fetched, no paid call was made, and no Worker change has been made.** Everything below marked *Hypothesis* needs a real test to confirm.

## The workflow as built

1. **Find.** "Find materials" (`/resources`) searches the web and may return up to 2 pages it believes are course syllabi. They are filtered by a title/URL pattern (`SYLLABUS_RE`), link-checked (`verifyUrl`, status only) and saved to `module.syllabi`. The student can also add a syllabus link by hand.
2. **Retrieve.** "Source readings" (`/syllabus`) asks the model to open the page with the `web_fetch` tool (max 2 uses) and to search for each reading's own page (max 4 searches).
3. **Extract.** The model returns JSON picks. `rankAndVerify` keeps a pick only if its URL was seen in search results or inside the fetched page; a citation with no link is kept only if 80% of its words appear in the fetched text; links are checked; dead ones are dropped.
4. **Present.** Surviving readings are added straight to the module's reading list with an "derived from syllabus" label.
5. **Integrate.** There is no review step and no assignment revision.

## Findings

| # | Finding | Evidence | Status |
|---|---|---|---|
| 1 | **A failed page fetch is counted as an opened page.** `callClaude` appends the JSON of every `web_fetch_tool_result` to `fetched.text`, including error results (inaccessible, blocked, unsupported type, rate limit). The "page couldn't be opened" check is `!fetched.text.trim()`, which an error object satisfies. So a blocked site does not produce the clear "unreadable" message; the run continues and ends as "No readings could be sourced", which is indistinguishable from "page opened but lists no readings". | `worker.js:187-195`, `:492` | Code inspection. Likely contributor to three identical failures. |
| 2 | **PDF syllabi probably yield no citations.** The fetch result for a PDF is a document block; its text is not plain text in the JSON the Worker stores, so the 80%-of-words check for a citation without a link cannot succeed. Only readings the model also found on a web page survive. | `worker.js:385`, `:410-413` | *Hypothesis.* Needs a real PDF test. |
| 3 | **Discovery proves a link works, not that the syllabus can be read.** `verifyUrl` checks HTTP status and title only. A discovered syllabus can be a login-gated LMS page, a JavaScript-only page or a PDF that cannot be parsed. | `worker.js:429-432` | Code inspection. |
| 4 | **No stages and no diagnosis in the app.** The student sees one generic result. "Not accessible", "opened but no readings", "readings found, none verified" and "needs manual review" are not distinguished. The useful detail exists only in Worker logs. | `ai-client.js:165-181`, `worker.js:434` | Code inspection. |
| 5 | **No way to give Sovereign a syllabus directly.** There is no paste-text or file path for a syllabus. | whole workflow | Code inspection. |
| 6 | **Limits that can starve a long syllabus:** 2 fetches, 5 readings, 4 verified, one 8000-token answer, one module at a time. | `worker.js:482-493` | Code inspection. |
| 7 | **Readings are added without review, and nothing revises assignments.** Sourced readings go straight into the module (duplicates by URL or title are skipped). Nothing offers to rewrite a Learn, Apply or Demonstrate assignment to use them. | `ai-client.js:171-181` | Code inspection. |

What works as designed: provenance (a URL must have been seen in search results or a fetched page), blocked-site and shadow-library filtering, link verification, and the "never invent a citation" rule.

## Proposed repairs (not started; need your approval)

**App only (free to build and test with mocks):**
- Add a **pasted-text and file path**: the student pastes syllabus text or attaches a PDF/TXT. It is only sent to the Worker after the same consent step as submissions. (Worker side: a new request type that reads supplied text instead of fetching.)
- Add a **review screen** listing every candidate reading with its status; the student ticks which to adopt. Nothing is added automatically.
- Add an **optional "Propose assignment revisions"** step after adoption: draft changes for relevant assignments only, show before/after, apply only on approval; completed or graded assignments are not touched unless the student confirms, and the original text is kept on the assignment so it can be restored.

**Worker (needs a Worker update and your deploy):**
- Treat a fetch **error result** as "not accessible" and report the reason.
- Return a **stage** with every result: `not-accessible`, `read`, `no-readings`, `readings-found`, `verified`, `manual-review`.
- Handle PDF fetch results explicitly; extract citations with the model, but only keep one if the Worker can confirm it from the fetched document.
- A separate `/revise` endpoint for assignment revisions.

## Test plan (needs your approval of cost first)
1. Free: mock-harness tests of the new stages, review screen and revision approval, labelled **Mock**.
2. Paid: one public university syllabus page and one public PDF syllabus, against the **test Worker**, capped. I will give a cost estimate before running and report which materials were actually retrieved and parsed, not which URLs a search returned. Sites that cannot be read will be reported as limitations.

## Status after implementation (build 21, Worker v11)
Findings 1, 3 (partly), 4, 5 and 7 are addressed in code and mock-tested (see `TESTING.md` C1 to C7). Finding 2 (PDFs) is handled honestly rather than solved: PDF readings are marked "check manually". Finding 6 (limits): page opens raised from 2 to 3. **None of this is confirmed against a real site yet.**

## Proposed real test (needs your approval; nothing has run)
Against the test Worker, after you deploy `worker.js` (v11) to it and re-enter the access code in the preview:
1. One public university syllabus **web page** with a reading list.
2. One public **PDF** syllabus.
3. The same page's text pasted in.
4. One revision of two or three assignments with one adopted reading.
Estimated cost: about $0.30 to $0.60 for the set (each syllabus read is a light-model call with up to 3 page opens and 4 searches; the revision is one outline-model call). With one retry per step I would cap it at **$1.00**. The estimate rests on the Worker's own price table, and its search price is marked unverified; the Anthropic console is the authority. I would report which readings were actually retrieved and parsed, which were only found by search, and every failure.
