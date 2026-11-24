/* sovereign. — files people attach to assignments. They are kept in this browser only (IndexedDB), never in the backup file,
   and are sent to the AI service only when the person agrees for that one submission. */
(function (S) {
  'use strict';

  const DB = 'sovereign-files', STORE = 'files';
  S.FILE_LIMITS = { pdf: 2 * 1024 * 1024, attach: 25 * 1024 * 1024, text: 30000, imageEdge: 1600 };
  const f = S.files = {};

  function open() {
    return new Promise((res, rej) => {
      let q; try { q = indexedDB.open(DB, 1); } catch (e) { return rej(e); }
      q.onupgradeneeded = () => q.result.createObjectStore(STORE);
      q.onsuccess = () => res(q.result);
      q.onerror = () => rej(q.error || new Error('Storage unavailable'));
    });
  }
  const tx = (mode, fn) => open().then((db) => new Promise((res, rej) => {
    const t = db.transaction(STORE, mode), r = fn(t.objectStore(STORE));
    t.oncomplete = () => { db.close(); res(r && r.result); };
    t.onerror = t.onabort = () => { db.close(); rej(t.error || new Error('Storage failed')); };
  }));

  f.put = (id, blob) => tx('readwrite', (s) => s.put(blob, id));
  f.get = (id) => tx('readonly', (s) => s.get(id)).then((b) => b || null);
  f.del = (id) => tx('readwrite', (s) => s.delete(id)).catch(() => {}); // best effort; a leftover blob is never shown

  const ext = (n) => (String(n).split('.').pop() || '').toLowerCase();
  const TEXT_EXT = ['txt', 'md', 'markdown', 'csv'];

  // What can the AI review? text, PDF (within the size limit) and images. Everything else can be attached as evidence only.
  f.classify = function (file) {
    const t = (file.type || '').toLowerCase(), e = ext(file.name);
    if (t === 'application/pdf' || e === 'pdf') return 'pdf';
    if (/^image\/(png|jpeg|webp|gif)$/.test(t)) return 'image';
    if (t.startsWith('text/') || TEXT_EXT.includes(e)) return 'text';
    return 'other';
  };

  f.readText = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result || '')); r.onerror = () => rej(r.error); r.readAsText(file); });

  const toB64 = (blob) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(',')[1] || '');
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
  });

  // Shrinks large photos so they upload quickly and stay within the service's limits. Returns {blob, mime}.
  f.downscale = (file) => new Promise((res, rej) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const edge = S.FILE_LIMITS.imageEdge, k = Math.min(1, edge / Math.max(img.width, img.height));
      if (k === 1 && file.size <= 1.5 * 1024 * 1024 && /jpeg|png|webp/.test(file.type)) return res({ blob: file, mime: file.type });
      const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((b) => (b ? res({ blob: b, mime: 'image/jpeg' }) : rej(new Error('That image could not be read.'))), 'image/jpeg', 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('That image could not be read.')); };
    img.src = url;
  });

  f.base64 = toB64;
})(window.Sovereign);
