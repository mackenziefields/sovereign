/* sovereign. — small DOM helpers shared by the views. */
(function (S) {
  'use strict';

  // h('div', {class:'x', onclick: fn}, child, 'text', [more]) -> element. Text is always inserted as text, never HTML.
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'value' || k === 'checked' || k === 'disabled' || k === 'selected') el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    const add = (k) => {
      if (k == null || k === false) return;
      if (Array.isArray(k)) k.forEach(add);
      else el.append(k.nodeType ? k : document.createTextNode(String(k)));
    };
    kids.forEach(add);
    return el;
  }
  S.h = h;

  // o: value, required, placeholder, hint, multiline, rows, type ('text' | 'number' | 'date')
  S.field = function (label, name, o = {}) {
    const val = o.value == null ? '' : String(o.value);
    const control = o.multiline
      ? h('textarea', { name, value: val, required: o.required, placeholder: o.placeholder || '', rows: o.rows || 3 })
      : h('input', {
          type: o.type || 'text', name, value: val, required: o.required, placeholder: o.placeholder || '', autocomplete: 'off',
          min: o.type === 'number' ? '0' : null, step: o.type === 'number' ? 'any' : null, inputmode: o.type === 'number' ? 'decimal' : null,
        });
    return h('label', { class: 'field' }, h('span', {}, label), control, o.hint ? h('small', {}, o.hint) : null);
  };

  S.select = (label, name, options, value) =>
    h('label', { class: 'field' }, h('span', {}, label),
      h('select', { name }, options.map(([v, l]) => h('option', { value: v, selected: v === value }, l))));

  S.progressBar = (pct, label) =>
    h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': pct, 'aria-label': label || 'Progress' },
      h('span', { style: 'width:' + pct + '%' }));

  S.checkbox = (checked, label, onChange) =>
    h('label', { class: 'check' },
      h('input', { type: 'checkbox', checked, 'aria-label': label, onchange: (e) => onChange(e.target.checked) }),
      h('span', { class: 'box', 'aria-hidden': 'true' }));

  // Canvas-style picture tile: a patterned colour banner with a label, then title and progress bar.
  // o: href, color (0-5), label, title, meta, pct, badge
  S.tile = (o) =>
    h('a', { class: 'tile', href: o.href },
      h('div', { class: 'tile-art art-' + o.color, style: '--c:' + S.COLORS[o.color], 'aria-hidden': 'true' },
        h('span', { class: 'tile-label' }, o.label),
        o.num ? h('span', { class: 'tile-num' }, String(o.num).padStart(2, '0')) : null,
        o.badge ? h('span', { class: 'tile-badge' }, o.badge) : null),
      h('div', { class: 'tile-body' },
        h('h3', { class: 'tile-title' }, o.title),
        h('p', { class: 'tile-meta' }, o.meta),
        S.progressBar(o.pct, o.title + ' progress')));

  // A course as a small publication: colour, geometric mark, serif title, progress as a large numeral.
  // o: href, color (0-5), code, title, meta, pct
  S.cover = (o) =>
    h('a', { class: 'cover art-' + o.color, href: o.href, style: '--c:' + S.COLORS[o.color] },
      h('div', { class: 'cover-top' }, h('span', {}, o.code), h('span', {}, 'sovereign.')),
      h('h3', { class: 'cover-title' }, o.title),
      h('div', { class: 'cover-foot' },
        h('div', { class: 'cover-pct' }, h('strong', {}, o.pct + '%'), h('span', {}, o.meta)),
        S.progressBar(o.pct, o.title + ' progress')));

  // Learn (circle), Apply (square), Demonstrate (triangle): a shape and a word, never colour alone.
  S.KINDS = [['learn', 'Learn'], ['apply', 'Apply'], ['demonstrate', 'Demonstrate']];
  S.kindMark = (kind) => {
    const k = S.KINDS.find((x) => x[0] === kind);
    return k ? h('span', { class: 'kmark kmark-' + k[0] }, k[1]) : null;
  };

  S.badge = (text, kind) => h('span', { class: 'badge ' + (kind || '') }, text);
  S.plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
  S.trunc = (t, n) => (t.length > n ? t.slice(0, n).trimEnd() + '…' : t);

  let timer;
  S.toast = function (msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(() => t.classList.remove('show'), 3000);
  };

  // Navigate, forcing a re-render even if the hash is unchanged.
  S.go = function (hash) {
    if ((location.hash || '#/') === hash) S.render(true); else location.hash = hash;
  };

  S.commit = function () { S.save(); S.render(false); };
})(window.Sovereign = window.Sovereign || {});
