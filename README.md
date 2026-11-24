# sovereign.

*Learn. Apply. Demonstrate.*

A self-directed learning workspace modeled on the structure of an online classroom. Run your own courses, work through modules, complete assignments, grade yourself, and document a final project for each course.

Plain HTML, CSS, and vanilla JavaScript, with a system Helvetica font stack (no external requests). Everything works with no server, accounts, or API keys. **Build with AI** is optional and needs the small private service in `worker/` (see `worker/README.md`); courses you build manually never use it.

## Run it

Open `index.html` in a browser, or serve the folder:

```
python -m http.server 8000
```

then visit http://localhost:8000. Home-screen install and offline use need `https://` (GitHub Pages provides it) or `localhost`.

## How it is organized

- **Dashboard**: a picture tile for each course (code + progress bar that fills as modules are completed), a **To Do** panel (Up next, sorted by due date, with a Calendar tab), and a **Module library** listing every module from every course.
- **Inside a course** (click a tile): a **Course Menu** with Home, Announcements, Syllabus, Modules, Assignments, and Grades. Each opens its own page. Home shows a summary of all of them.
- **Modules** appear as picture tiles with progress bars; each opens its own page with Overview, Readings, Key ideas, Assignments, Reflection, and optional custom sections (such as Discussion questions or Favorite passages).
- **Assignments belong to exactly one module.** Create them on the module page, or on the course's Assignments page by choosing the module.
- **Grades**: enter Points and your Score on an assignment; the course shows your average as Current Grade.
- **Portfolio** (in each course's menu): that course's graded assignments, final project, and credentials. AI scores are automated; credentials are self-reported.
- **My Work**: each course's final deliverable, with status, description, reflection, and link. Optional licenses and credentials are tracked at the bottom of a course's Modules page.
- **Data & Backup**: export/import JSON, clear all data.

New courses (Dashboard → New course) offer **Build with AI** or **Build manually**. Manual courses get the same layout with one starter module.

## Build with AI (optional)

Answer a few plain questions (topic, starting point, goal, time) and an AI drafts a full course: syllabus, outcomes, sequenced modules (Learn → Apply → Demonstrate, adapted to the subject), assignments, self-check questions, and a final project tracked in My Work. It then searches for 1-2 learning resources per module.

* Resource searches favor higher-education materials first (universities, business/law schools, open courseware, scholarly sources), then government and professional bodies, respected practitioners and publishers, then open archives. Each link gets a source-type label (University, Government, Open / archive, Publisher) taken from its web address.
* Every resource shows whether a program checked the link (**Link responded / not reachable / Site blocks checks / Not checked**), separately from the AI's own opinion of why it fits (always labeled as the AI's opinion). If nothing verifiable is found the module says **Source needed** instead of inventing one.
* Everything is yours to edit, reorder, replace, or delete. Your edits are never overwritten; **Find materials with AI** only adds suggestions.
* Only what you type in the form is sent. No documents are uploaded. The service address and access code are kept in this browser only and are not in exports.
* For career and credential goals the AI suggests real licenses or certifications as **required** milestones for that goal (suggested for other goals). You can mark any “Not applicable”. Marking one earned is self-reported.
* Your name (optional, Dashboard or Data & Backup) greets you on the dashboard and course Home. It stays in this browser and is never sent to the AI.
* Data & Backup → AI shows the tokens and estimated cost recorded for each AI course.

## Submitting work and AI feedback

Each assignment has its own page (click its title): overview, why you're doing it, steps, what to submit, how it's graded, and the submission box. The AI writes a full page for every assignment in an AI-built course: an overview, a ready-made fictional scenario (it never asks you to find your own case), numbered steps with guiding questions, exactly what to submit and in which format, and grading criteria with points for each. The AI decides, per assignment, whether it is based on the module's readings (summaries, comparisons, critiques: no invented scenario, graded on understanding of those readings) or needs material supplied (anything that would say "find / choose / pick" gets a fictional case, article, or document written out for you). Tables, charts, and similar layouts must be submitted as a PDF, Excel file, or image; Excel files are read as cell values only. **Office hours** on each assignment lets you do the work with your own real article or example instead, with feedback in up to two rounds and no grade. Older assignments get a **Write full assignment with AI** button; manual ones can be filled in with **Edit this assignment**. To submit, the assignment needs points.

* Submit text, or a text / PDF / image file. **Nothing is sent until you tick the consent box for that submission.** Audio, video and other file types can be attached as evidence only: no AI feedback and no grade.
* **Review 1** gives detailed, action-oriented feedback with **no grade shown**. The 72-hour clock starts when that feedback appears.
* Resubmit within 72 hours for **review 2 and your final grade**. If you don't, review 1's grade becomes final after 72 hours (or choose “Skip resubmitting and see my grade”). When the grade is final, the first submission's file and feedback are deleted; only the final version stays, in the Portfolio and on the Grades page (points, percent, and a letter).
* AI-built courses start on the date you pick; assignment due dates follow from it and **can't be edited**. Manual courses keep editable due dates. Late work is accepted and marked **Late**.
* Honest limits: the AI's grade is an automated assessment, not a human grade. There are no accounts, so the 72-hour window, locked dates and "no first record" are enforced only inside the app and can be bypassed by someone who edits their own browser data. Submitted files are kept on this device only (not in backups); text, grades and feedback are in backups. Reviews cost roughly $0.02-0.15 each (shown per review).

## Your data

Saved in this browser's localStorage (key `sovereign.v3`). It is not synced between browsers or devices, and clearing site data erases it. Export a backup to keep a copy. Importing validates the file and asks before overwriting; deleting or clearing data asks for confirmation. Data saved by earlier versions is converted automatically, and older backups still import.

## Files

```
index.html             page shell and navigation
css/styles.css         base design
css/courses.css        tiles, course menu, To Do, modules, grades
css/ai.css             AI wizard and resource labels
js/config.js           public settings (optional AI service address; never secrets)
js/store.js            data model, storage, validation, import/export, starter courses
js/components.js       small DOM helpers
js/files.js            attachment storage in this browser (IndexedDB)
js/ai-client.js        talks to the AI service; turns its answers into a saved course
js/views-ai.js         Build with AI wizard, resource labels, AI settings, usage
js/views-work.js       submissions, AI feedback, 72-hour window, final grade
js/views-course.js     course pages and module pages
js/views-dash.js       first run, Dashboard, My Work, Data & Backup
js/app.js              router, mobile menu, service worker registration
manifest.webmanifest   home-screen install info
sw.js                  offline cache (bump CACHE and the file list when you change files)
icons/                 app icons
worker/                the optional AI service (Cloudflare Worker), setup guide, and mock test harness
                       (upload it if you like; it contains no secrets)
```

## Deploy to GitHub Pages

All paths are relative. Upload the files **with their folders** (`css/`, `js/`, `icons/`) next to `index.html`.

## Not in v0.1

Letter grades or weighted grading, recurring due dates, drag-and-drop, dark mode, sync, accounts, payments, marketplace. In the AI feature: uploading a syllabus or documents, AI revision of a single module or assignment, regenerating a whole course, a conversational advisor, and tutoring.
