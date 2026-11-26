# Build 34 step D, part 2: quizzes from PDF readings (approved and built; real run pending)

## The problem (from the capped real-AI run, 26 Nov 2026)
All three quizzes in the test course were written from the key ideas, not the readings. A content check showed why: 6 of the 8 readings were PDFs, which the Worker cannot read. Of the other two, one page needs JavaScript and one is only a landing page. For law and policy topics most of the best sources are official PDFs, so this will be the usual case, not an exception.

## Options considered

| Option | How | Cost per module | Problems |
|---|---|---|---|
| A. Send the PDF to the AI | The Worker passes the PDF to Claude (as a document, or through the AI's web-fetch tool) | About $0.30–0.90 for one 100-page PDF on Sonnet. The fetch tool's size limit does **not** apply to PDFs | Expensive and unpredictable. No code check that the PDF is the reading. Large PDFs fail outright |
| B. Read PDFs inside the Worker | A hand-written text reader in worker.js | $0 | Modern PDFs use embedded fonts and compressed objects, so a small reader would often return nonsense. Hard to get right |
| **C. Worker fetches, the app reads (recommended)** | The Worker downloads the PDF under its existing safety rules and passes the bytes to the app. The app reads the text with **PDF.js**, which is already bundled for the Review Studio. The text goes to `/study` | **$0 to read.** The quiz call grows to about $0.05–0.08 per module (now $0.02) because it sees more text | One new Worker endpoint, which must not become an open proxy (see safeguards) |

Option C adds no new library and no AI cost to read a PDF. It also keeps the check that the text really is the reading.

## Design (option C)

**Worker (stays v19, because v19 is not in production yet; redeployed to the test Worker only):**
1. New `POST /fetch-pdf {url}`. It requires the access code, like every endpoint, and calls no AI. It reuses `readPageText`'s safety rules:
   - public host only (no private or internal addresses)
   - each redirect is checked
   - blocked sites refused
   - 8-second time limit
   - **10 MB limit**
   - returns bytes only if the file really is a PDF: it must start with `%PDF-`, and a web-page content type is refused (some official sites label PDFs "application/octet-stream", so that label is accepted)

   Anything else is refused with a plain reason. It counts toward the per-IP request limits. Nothing is stored.
2. `/study` accepts `texts: [{n, text}]` for readings the Worker could not read itself. It runs the same title-word check on that text (`codeCoverage` ≥ 0.5) and treats it as untrusted. Each reading is capped at **24,000 characters** (was 6,000), and HTML pages get the same larger limit.
3. Prompt tightening:
   - wrong options must be believable (same kind of thing as the right answer, no joke options)
   - no two questions on the same point
   - at least one question per readable reading
   - ask about the substance, not the cover, contents or front matter

**App:**
4. Before `/study`, for each reading whose link is a PDF (or that the Worker reports as a PDF), the app:
   - gets the bytes through `/fetch-pdf`
   - reads up to the first 60 pages with PDF.js (`isEvalSupported: false`, in its own background thread, as the Review Studio already does)
   - drops contents-style pages (mostly dots and page numbers)
   - keeps up to 24,000 characters

   Scanned PDFs with no text are skipped with a reason. The bytes are never saved; only the text is sent to your own Worker.
5. The quiz note lists any reading not used and why (for example: "not used: needs JavaScript"; "not used: scanned PDF with no text").
6. New **"Rewrite quiz from readings"** button for modules whose quiz was written from the key ideas. It shows the cost (about $0.05–0.08 a module) and asks first. A quiz you already passed stays passed. Reflection answers are kept.

## Tests ($0, mock Worker)
- The mock harness serves `docs/pdf-samples/sample-institution.pdf` (text already known) through `/fetch-pdf`.
- Cases covered:
  - PDF text extracted, and contents pages dropped
  - title-word check passes, and fails for the wrong PDF
  - scanned or empty PDF skipped with a reason
  - over 10 MB refused
  - not-a-PDF refused
  - private host and a redirect to a private host refused
  - the 24,000-character limit holds
  - the quiz says which readings were used and which were not
  - Rewrite keeps a passed quiz and written reflections, and shows its cost first
- Regression: build34a–d, progress, publish-model, publish-docs.

## Capped real-AI check (needs your approval)
- On the test Worker (`DAILY_BUDGET_USD` set to **0.5**), rewrite the quizzes for the 3 modules of the AML test course from their readings. **Estimate: about $0.15–0.25.**
- I will check every question against the PDF page it names.
- Production stays on v18 until you approve the build 34 release.

## Not covered
- Pages that need JavaScript, and landing pages: still skipped, with the reason shown.
- Password-protected PDFs: skipped.
- PDFs over 10 MB, or only their first 60 pages: anything past that is not read.
