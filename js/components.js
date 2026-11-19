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

  S.field = function (label, name, o = {}) {
    const control = o.multiline
      ? h('textarea', { name, value: o.value || '', required: o.required, placeholder: o.placeholder || '', rows: o.rows || 3 })
      : h('input', { type: 'text', name, value: o.value || '', required: o.required, placeholder: o.placeholder || '', autocomplete: 'off' });
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
