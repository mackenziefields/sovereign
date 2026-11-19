# sovereign.

*Learn. Apply. Demonstrate.*

A self-directed learning workspace. Define a learning objective, organize resources into modules (Learn), complete practical assignments (Apply), and document a final project as proof of practice (Demonstrate).

No server, accounts, API keys, or AI service. Plain HTML, CSS, and vanilla JavaScript, with a system Helvetica font stack (no external requests).

## Run it

Open `index.html` in a browser, or serve the folder:

```
python -m http.server 8000
```

then visit http://localhost:8000. Installing to a phone home screen and offline use need `https://` (GitHub Pages provides this) or `localhost`.

## Views

- **Dashboard**: curriculum card (objective, deliverable, progress), next unfinished activity, proof-of-practice status.
- **Curriculum**: expandable modules, each with **Learn** (resources) and **Apply** (assignments). Add, edit, delete, reorder. Optional **Licenses and credentials** section at the end.
- **Practice**: every assignment across the curriculum, with a To do / Done filter and a link to its module.
- **My Work**: the intended deliverable, plus status, description, reflection, and link for the final project.
- **Data & Backup**: export/import JSON, delete the curriculum, clear all saved data.

## Your data

Saved in this browser's localStorage (key `sovereign.v2`). It is **not** synced between browsers or devices, and clearing site data erases it. Export a backup to keep a copy. Importing validates the file and asks before overwriting; deleting or clearing data asks for confirmation.

## Files

```
index.html            page shell and navigation
css/styles.css        design
js/store.js           data model, storage, validation, import/export, example curriculum
js/components.js      small DOM helpers
js/views.js           the views
js/app.js             router, mobile menu, service worker registration
manifest.webmanifest  home-screen install info
sw.js                 offline cache (bump CACHE when you change files)
icons/                app icons
```

## Deploy to GitHub Pages (later)

All paths are relative. Publish the folder contents, then set Pages to the branch root.

## Not in v0.1

Multiple curricula (data model supports it; UI shows the first), drag-and-drop, deadlines or grading, dark mode, portfolio of several projects, sync, accounts, payments, marketplace, AI features.
