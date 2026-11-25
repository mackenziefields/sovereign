/* sovereign. — submitting work, AI feedback, the 72-hour resubmission window, the final grade, and ungraded office hours. */
(function (S) {
  'use strict';
  const { h, toast, commit, badge } = S;
  const drafts = {}; // draft key -> { text, file, agree, busy, err, material }  (never saved; nothing is sent until the person agrees)
  const dr = (key) => drafts[key] || (drafts[key] = { text: '', file: null, agree: false, busy: false, err: '', material: '' });

  const when = (iso) => { try { return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; } };
  const money = (n) => (S.ai && S.ai.money ? S.ai.money(n) : '$' + n.toFixed(2));
  const list = (items, cls) => (items && items.length ? h('ul', { class: cls || 'plain' }, items.map((x) => h('li', {}, x))) : null);

  // What the AI is told, and what is stored. Returns { payload, stored, blob? } or throws an Error with a plain message.
  async function prepare(d, fileOnly) {
    const f = d.file, L = S.FILE_LIMITS;
    if (!f) {
      if (fileOnly) throw new Error('This assignment needs a table, chart, or similar layout, so choose a PDF, Excel file, or image to submit.');
      const t = d.text.trim();
      if (!t) throw new Error('Write your answer or choose a file first.');
      if (t.length > L.text) throw new Error('That is longer than the AI can review (about ' + L.text.toLocaleString() + ' characters). Shorten it or attach a PDF.');
      return { payload: { text: t }, stored: { text: t } };
    }
    const kind = S.files.classify(f);
    if (kind === 'text') {
      if (fileOnly) throw new Error('This assignment needs a PDF, Excel file, or image, not a text file.');
      const t = (await S.files.readText(f)).trim();
      if (!t) throw new Error('That file is empty.');
      if (t.length > L.text) throw new Error('That file is longer than the AI can review (about ' + L.text.toLocaleString() + ' characters).');
      return { payload: { text: t }, stored: { text: t, fileName: f.name, fileType: f.type || 'text/plain', fileSize: f.size } };
    }
    if (kind === 'pdf') {
      if (f.size > L.pdf) throw new Error('That PDF is over the 2 MB the AI can review. Compress it, or attach it as evidence without AI feedback.');
      return { payload: { file: { mime: 'application/pdf', base64: await S.files.base64(f) } }, blob: f, stored: { fileName: f.name, fileType: 'application/pdf', fileSize: f.size } };
    }
    if (kind === 'image') {
      const r = await S.files.downscale(f);
      return { payload: { file: { mime: r.mime, base64: await S.files.base64(r.blob) } }, blob: r.blob, stored: { fileName: f.name, fileType: r.mime, fileSize: r.blob.size } };
    }
    if (kind === 'xlsx') {
      if (f.size > L.xlsx) throw new Error('That Excel file is over 5 MB. Save a smaller copy and try again.');
      const t = await S.files.xlsxToText(f); // cell values only; charts and formatting are not read
      return { payload: { text: t }, blob: f, stored: { fileName: f.name, fileType: f.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', fileSize: f.size } };
    }
    throw new Error('The AI can review text, PDF, image, and Excel (.xlsx) files. Attach this one as evidence without AI feedback instead.');
  }

  async function submit(c, m, a, round) {
    const d = dr(a.id), fileOnly = a.format === 'file';
    d.err = ''; d.busy = true; S.render(false);
    let fileId = '';
    try {
      const p = await prepare(d, fileOnly);
      const at = new Date();
      if (p.blob) { fileId = S.uid(); await S.files.put(fileId, p.blob); }
      const fb = await S.ai.review(c, m, a, p.payload, round);
      // keep the rubric the AI wrote at the first review so a second review grades the same criteria
      if (round === 1 && !(a.rubric && a.rubric.length)) a.rubric = fb.criteria.map((k) => ({ name: k.name, max: k.max }));
      const sub = { text: '', fileId, fileName: '', fileType: '', fileSize: 0, ...p.stored, at: at.toISOString(), late: round === 1 ? S.isLate(a, at.getTime()) : !!(a.work && a.work.first && a.work.first.late), feedback: fb };
      if (round === 1) a.work = { phase: 'reviewed', deadline: new Date(at.getTime() + S.REVIEW_HOURS * 3600000).toISOString(), first: sub, final: null };
      else S.finalizeWork(a, sub);
      drafts[a.id] = null; // the draft is gone once it is saved
      S.save(); toast(round === 1 ? 'Feedback is ready. Your grade comes after you resubmit or the 72 hours end.' : 'Your final grade is in.');
    } catch (e) {
      if (fileId) S.files.del(fileId);
      d.err = e && e.message ? e.message : 'Something went wrong. Please try again.';
    }
    if (drafts[a.id]) drafts[a.id].busy = false;
    S.render(false);
  }

  // Office hours: the same flow, but for material the learner chose, with no grade and no record in the Grades page or Portfolio.
  async function officeSubmit(c, m, a, round) {
    const key = 'oh:' + a.id, d = dr(key);
    d.err = ''; d.busy = true; S.render(false);
    let fileId = '';
    try {
      const material = round === 1 ? d.material.trim() : (a.office && a.office.material) || '';
      if (round === 1 && !material) throw new Error('Tell the AI which article, reading, or example you are working from.');
      const p = await prepare(d, false);
      const at = new Date();
      if (p.blob) { fileId = S.uid(); await S.files.put(fileId, p.blob); }
      const fb = await S.ai.office(c, m, a, p.payload, round, material);
      const sub = { text: '', fileId, fileName: '', fileType: '', fileSize: 0, ...p.stored, at: at.toISOString(), late: false, feedback: fb };
      a.office = { material, rounds: ((a.office && a.office.rounds) || []).concat([sub]) };
      drafts[key] = null; S.save(); toast(round === 1 ? 'Office-hours feedback is ready. It isn’t graded.' : 'Second round of feedback is ready. Nothing here is graded.');
    } catch (e) {
      if (fileId) S.files.del(fileId);
      d.err = e && e.message ? e.message : 'Something went wrong. Please try again.';
    }
    if (drafts[key]) drafts[key].busy = false;
    S.render(false);
  }

  // Attach a file as evidence only (any type, no AI review, no grade).
  async function attachOnly(c, m, a) {
    const d = dr(a.id);
    if (!d.file) { d.err = 'Choose a file first.'; return S.render(false); }
    if (d.file.size > S.FILE_LIMITS.attach) { d.err = 'That file is over 25 MB, which is more than this browser can keep.'; return S.render(false); }
    d.busy = true; d.err = ''; S.render(false);
    const id = S.uid();
    try {
      await S.files.put(id, d.file);
      const at = new Date();
      a.work = { phase: 'final', deadline: '', first: null, final: { text: '', fileId: id, fileName: d.file.name, fileType: d.file.type || '', fileSize: d.file.size, at: at.toISOString(), late: S.isLate(a, at.getTime()), feedback: null } };
      a.done = true; drafts[a.id] = null; S.save(); toast('Attached. This is kept on this device only.');
    } catch (e) { S.files.del(id); d.err = 'This browser couldn’t store that file (it may be out of space or in private mode).'; d.busy = false; }
    S.render(false);
  }

  // o: { key, label, fileOnly, onSend, attach (offer "attach without feedback"), material (ask which material) }
  function inputForm(c, m, a, o) {
    const d = dr(o.key);
    const agree = h('input', { type: 'checkbox', checked: d.agree, disabled: d.busy, onchange: (e) => { d.agree = e.target.checked; go.disabled = !d.agree || d.busy; } });
    const go = h('button', { class: 'btn', type: 'button', disabled: !d.agree || d.busy, onclick: o.onSend }, d.busy ? 'Reviewing…' : o.label);
    const fileIn = h('input', { type: 'file', disabled: d.busy, onchange: (e) => { d.file = e.target.files[0] || null; d.err = ''; S.render(false); } });
    const sending = d.file ? (S.files.classify(d.file) === 'xlsx' ? 'The cell values (as text) from “' + d.file.name + '”' : 'The file “' + d.file.name + '”') : 'The text you typed';
    return h('div', { class: 'submit-box' },
      d.err ? h('p', { class: 'banner error', role: 'alert' }, d.err) : null,
      o.material ? h('label', { class: 'field' }, h('span', {}, 'What are you working from?'),
        h('input', { type: 'text', maxlength: '300', disabled: d.busy, value: d.material, placeholder: 'e.g. the title and link of the article you chose', oninput: (e) => { d.material = e.target.value; } })) : null,
      o.fileOnly
        ? h('p', { class: 'small muted' }, 'This assignment needs a table, chart, or similar layout, so it can’t be typed in a text box. Submit a PDF, an Excel (.xlsx) file, or an image.')
        : h('label', { class: 'field' }, h('span', {}, o.textLabel || 'Your work'),
          h('textarea', { rows: 6, placeholder: 'Type or paste your answer here, or choose a file below.', disabled: d.busy || !!d.file, value: d.text, oninput: (e) => { d.text = e.target.value; } })),
      h('label', { class: 'field' }, h('span', {}, o.fileOnly ? 'Your file (PDF, Excel, or image)' : 'Or a file (text, PDF, image, or Excel get AI feedback)'), fileIn,
        h('small', {}, d.file ? 'Selected: ' + d.file.name + (o.fileOnly ? '.' : '. It will be used instead of the text above.') : 'PDFs up to 2 MB. Excel files up to 5 MB (cell values only). Photos are shrunk automatically.')),
      h('label', { class: 'consent' }, agree, h('span', {}, sending + ' will be sent to the AI service to review. It is used for this review only and is not kept by the service. Send it?')),
      h('div', { class: 'btn-row' }, go,
        o.attach && d.file ? h('button', { class: 'btn ghost', type: 'button', disabled: d.busy, onclick: () => attachOnly(c, m, a) }, 'Attach without AI feedback') : null,
        d.file ? h('button', { class: 'btn ghost', type: 'button', disabled: d.busy, onclick: () => { d.file = null; S.render(false); } }, 'Clear file') : null));
  }

  function feedbackView(f, showScore, office) {
    return h('div', { class: 'feedback' },
      f.summary ? h('p', {}, f.summary) : null,
      f.strengths.length ? h('div', {}, h('h4', { class: 'minor' }, 'What’s working'), list(f.strengths)) : null,
      f.improvements.length ? h('div', {}, h('h4', { class: 'minor' }, 'What to change'), list(f.improvements)) : null,
      f.nextSteps.length ? h('div', {}, h('h4', { class: 'minor' }, 'Next steps'), list(f.nextSteps)) : null,
      f.criteria.length ? h('div', {}, h('h4', { class: 'minor' }, showScore ? 'By criterion' : 'Criteria this was reviewed against'),
        h('ul', { class: 'plain' }, f.criteria.map((k) => h('li', {}, h('b', {}, k.name), showScore ? ' · ' + k.score + ' / ' + k.max : '', k.comment ? ' — ' + k.comment : '')))) : null,
      h('p', { class: 'small muted' }, 'Reviewed by AI on ' + when(f.at) + (f.cost ? ' · about ' + money(f.cost) : '') + (office ? '. Practice feedback only: nothing here is graded.' : '. This is an automated assessment, not a human grade.')));
  }

  function fileLine(sub) {
    if (!sub || !sub.fileId) return sub && sub.fileName ? h('p', { class: 'small muted' }, 'File: ' + sub.fileName) : null;
    const slot = h('span', { class: 'small muted' }, sub.fileName + ' · checking this device…');
    S.files.get(sub.fileId).then((blob) => {
      slot.textContent = '';
      if (!blob) { slot.textContent = sub.fileName + ' · the file is not on this device (files are not part of backups).'; return; }
      const url = URL.createObjectURL(blob);
      slot.append(h('a', { href: url, download: sub.fileName || 'file', target: '_blank', rel: 'noopener' }, sub.fileName), ' · ' + Math.max(1, Math.round(sub.fileSize / 1024)) + ' KB · kept on this device only');
    }).catch(() => { slot.textContent = sub.fileName + ' · could not be read from this device.'; });
    return h('p', {}, slot);
  }

  // Save a finished piece to this course's Portfolio (or take it out). Demonstrate work is saved by default when it is finalized.
  S.portfolioToggle = function (a) {
    return h('div', { class: 'callout' },
      h('label', { class: 'consent' }, h('input', { type: 'checkbox', checked: a.portfolio, onchange: (e) => { a.portfolio = e.target.checked; commit(); toast(a.portfolio ? 'Saved to this course’s Portfolio.' : 'Removed from the Portfolio.'); } }),
        h('span', {}, 'Show this piece in this course’s Portfolio.' + (a.kind === 'demonstrate' ? ' (Saved by default for demonstrate work.)' : ''))),
      h('p', { class: 'small muted' }, 'Portfolios stay in this browser. Files are kept on this device only and aren’t included in backups.'));
  };

  // How a saved piece appears in the Portfolio: what it shows, the work itself, and its AI-reviewed result.
  S.portfolioPiece = function (c, m, a) {
    const f = a.work && a.work.final, fb = f && f.feedback, pct = fb ? S.pctOf(a) : null;
    return h('li', { class: 'plate' },
      h('div', { class: 'plate-top' }, a.kind ? S.kindMark(a.kind) : badge('Assignment', 'soft')),
      h('h3', { class: 'plate-title' }, h('a', { href: S.href(c, 'assignments', a.id) }, a.title)),
      a.portfolioNote ? h('p', { class: 'plate-dek' }, a.portfolioNote) : null,
      fb ? h('div', { class: 'plate-score' }, h('strong', {}, pct + '%'), h('span', {}, a.score + ' / ' + a.points + ' pts · ' + S.letter(pct))) : null,
      h('div', { class: 'item-meta' }, h('span', { class: 'code' }, c.code), h('span', { class: 'due' }, 'Module: ' + m.title),
        fb ? h('span', { class: 'badge soft' }, 'AI-reviewed') : null, f && f.late ? h('span', { class: 'badge warn' }, 'Late') : null),
      h('details', { class: 'work-panel' }, h('summary', {}, 'The work' + (fb ? ' and feedback' : '')),
        h('div', { class: 'wp-body' }, f && f.text ? h('p', { class: 'pre' }, f.text) : null, fileLine(f), fb ? feedbackView(fb, true) : null)));
  };

  S.finalFeedback = (a) => h('div', {}, feedbackView(a.work.final.feedback, true), fileLine(a.work.final));

  // Optional, ungraded: practice on a real article, reading, or example the learner chose.
  S.officePanel = function (c, m, a) {
    const ready = S.ai && S.ai.ready && S.ai.ready(), o = a.office, n = o ? o.rounds.length : 0, key = 'oh:' + a.id, d = dr(key);
    const body = [
      h('p', { class: 'small muted' }, 'Want to work from a real article, reading, or example you chose yourself, instead of the one provided? Do the assignment with your own material here and get feedback in up to two rounds. This is practice: it is never graded and doesn’t change your grade or Portfolio.'),
      o && o.material ? h('p', { class: 'small' }, h('b', {}, 'Working from: '), o.material) : null,
      o ? o.rounds.map((r, i) => h('div', { class: 'oh-round' }, h('h4', { class: 'minor' }, 'Round ' + (i + 1) + ' · ' + when(r.at)), r.feedback ? feedbackView(r.feedback, false, true) : null, fileLine(r))) : null,
      n < 2 ? (ready ? inputForm(c, m, a, { key, label: n ? 'Get second-round feedback' : 'Get office-hours feedback', material: n === 0, textLabel: n ? 'Your revised work' : 'Your work', onSend: () => officeSubmit(c, m, a, n + 1) }) : h('p', { class: 'small' }, 'Office hours need the AI service. Add its address and access code under Data & Backup → AI.')) : h('p', { class: 'small muted' }, 'You’ve used both rounds. Start over to try different material.'),
      n ? h('div', { class: 'btn-row' }, h('button', { class: 'linkbtn danger', type: 'button', onclick: () => {
        if (!confirm('Clear this office-hours session, including its feedback? This cannot be undone.')) return;
        (a.office.rounds || []).forEach((r) => { if (r.fileId) S.files.del(r.fileId); });
        a.office = null; drafts[key] = null; commit();
      } }, 'Start over')) : null,
    ];
    const k = 'oh-open:' + a.id;
    const det = h('details', { class: 'work-panel', open: S.ui.open.has(k) || d.busy || !!d.err }, h('summary', {}, 'Office hours (optional, not graded)' + (n ? ' · ' + n + ' of 2 rounds' : '')), h('div', { class: 'wp-body' }, body));
    det.addEventListener('toggle', () => { if (det.open) S.ui.open.add(k); else S.ui.open.delete(k); });
    return det;
  };

  // The panel on an assignment page: submit, review, resubmit, final grade.
  S.workPanel = function (c, m, a, forceOpen) {
    const w = a.work, key = 'wp:' + a.id, d0 = dr(a.id), fileOnly = a.format === 'file';
    const ready = S.ai && S.ai.ready && S.ai.ready();
    const canReview = a.points > 0;
    const form = (round) => inputForm(c, m, a, { key: a.id, label: round === 1 ? 'Get AI feedback' : 'Submit for final review', fileOnly, attach: round === 1, onSend: () => submit(c, m, a, round) });
    let body;
    if (!w) {
      body = !canReview ? h('p', { class: 'small muted' }, 'Add points to this assignment (Edit) to turn on submissions and AI feedback.')
        : [
          h('p', { class: 'small muted' }, 'Submit once to get detailed feedback (without a grade). You then have ' + S.REVIEW_HOURS + ' hours to resubmit for your final grade. If you don’t, the first review becomes your grade.'),
          a.due ? h('p', { class: 'small muted' }, 'Due ' + S.fmtDate(a.due) + '. Late work is accepted and marked late.') : null,
          !ready ? h('p', { class: 'small' }, 'AI feedback needs the AI service. Add its address and access code under Data & Backup → AI. You can still attach a file without feedback.') : null,
          form(1)];
    } else if (w.phase === 'reviewed') {
      const left = S.hoursLeft(a);
      body = [
        h('p', {}, badge('First review', 'soft'), ' ', w.first.late ? badge('Late', 'warn') : null, ' ', h('span', { class: 'small muted' }, 'Submitted ' + when(w.first.at))),
        feedbackView(w.first.feedback, false),
        fileLine(w.first),
        h('p', { class: 'callout' }, 'Your grade is revealed after your final review. Resubmit by ' + when(w.deadline) + ' (' + (left > 1 ? Math.ceil(left) + ' hours left' : 'under an hour left') + '). If you don’t, this first review becomes your grade then.'),
        h('h4', { class: 'minor' }, 'Resubmit your revised work'),
        ready ? form(2) : h('p', { class: 'small' }, 'Reconnect the AI service under Data & Backup → AI to resubmit.'),
        h('div', { class: 'btn-row' }, h('button', { class: 'linkbtn', type: 'button', onclick: () => {
          if (!confirm('Skip resubmitting? Your first review becomes your final grade and the first submission’s feedback is replaced by the final record.')) return;
          S.finalizeWork(a); commit();
        } }, 'Skip resubmitting and see my grade')),
      ];
    } else {
      const f = w.final, fb = f.feedback, pct = fb ? S.pctOf(a) : null;
      body = fb ? [
        h('div', { class: 'grade-line' }, badge('Final', 'solid'), ' ', f.late ? badge('Late', 'warn') : null, ' ',
          h('b', {}, a.score + ' / ' + a.points + ' pts'), ' · ', pct + '%', ' · ', h('b', {}, S.letter(pct))),
        h('p', { class: 'small muted' }, 'Submitted ' + when(f.at) + '. An AI-generated assessment, not a human grade. It is also recorded on the Grades page and in your Portfolio.'),
        feedbackView(fb, true), fileLine(f),
      ] : [
        h('p', {}, badge('Attached', 'soft'), ' ', f.late ? badge('Late', 'warn') : null, ' ', h('span', { class: 'small muted' }, when(f.at))),
        h('p', { class: 'small muted' }, 'Kept as evidence without AI feedback or a grade.'), fileLine(f),
        h('button', { class: 'linkbtn danger', type: 'button', onclick: () => {
          if (!confirm('Remove this attachment? This cannot be undone.')) return;
          if (f.fileId) S.files.del(f.fileId); a.work = null; a.done = false; commit();
        } }, 'Remove attachment'),
      ];
    }
    const label = !w ? 'Submit work' : w.phase === 'reviewed' ? 'Feedback ready' : (w.final.feedback ? 'Final grade' : 'Attached');
    const det = h('details', { class: 'work-panel', open: forceOpen || S.ui.open.has(key) || d0.busy || !!d0.err }, h('summary', {}, label), h('div', { class: 'wp-body' }, body));
    det.addEventListener('toggle', () => { if (det.open) S.ui.open.add(key); else S.ui.open.delete(key); });
    return det;
  };
})(window.Sovereign);
