/* -------------------------------------------------------
   site.js  –  Ole B Fotografie
   ------------------------------------------------------- */

/* ---------- Shared helpers ---------- */

const birthDate = new Date('2008-09-18T00:00:00');

function ageOn(date) {
  let age = date.getFullYear() - birthDate.getFullYear();
  const birthdayPassed =
    date.getMonth() > birthDate.getMonth() ||
    (date.getMonth() === birthDate.getMonth() && date.getDate() >= birthDate.getDate());
  return birthdayPassed ? age : age - 1;
}

document.querySelectorAll('[data-age]').forEach(
  (t) => { t.textContent = ageOn(new Date()); }
);
document.querySelectorAll('[data-year]').forEach(
  (t) => { t.textContent = new Date().getFullYear(); }
);

/* ---------- Dynamic gallery ---------- */

(function () {
  const gallery = document.getElementById('gallery');
  if (!gallery) return;

  /* ── Layout engine ─────────────────────────────────── */

  const SLOT_POOL = [
    'wide', 'wide', 'small',
    'tall', 'small', 'small',
    'wide', 'small', 'small',
    'wide', 'small', 'tall',
  ];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function isPortrait(src) {
    const m = src.match(/[-_](\d+)[x×](\d+)\.\w+$/i);
    return m ? parseInt(m[2], 10) > parseInt(m[1], 10) : false;
  }

  function pickSlot(src, pool) {
    const preferred = isPortrait(src) ? ['tall', 'small'] : ['wide', 'small'];
    for (const p of preferred) {
      const idx = pool.indexOf(p);
      if (idx !== -1) { pool.splice(idx, 1); return p; }
    }
    return pool.splice(0, 1)[0] || 'small';
  }

  function buildPool(n) {
    let pool = [];
    while (pool.length < n) pool = pool.concat(SLOT_POOL);
    return shuffle(pool).slice(0, n);
  }

  /* ── DOM helpers ───────────────────────────────────── */

  function makePhotoEl(src, slotClass) {
    const a      = document.createElement('a');
    a.className  = `photo ${slotClass}`;
    a.href       = src;
    const img    = document.createElement('img');
    img.src      = src;
    img.alt      = 'Foto von Ole B';
    img.loading  = 'lazy';
    img.decoding = 'async';
    a.appendChild(img);
    return a;
  }

  /* ── Lightbox ──────────────────────────────────────── */

  const lightbox = document.getElementById('lightbox');
  const lbImg    = document.getElementById('lightbox-img');
  const lbClose  = document.getElementById('lightbox-close');
  const lbPrev   = document.getElementById('lightbox-prev');
  const lbNext   = document.getElementById('lightbox-next');
  let   lbSrcs   = [];
  let   lbIdx    = 0;

  function lbShow() {
    lbImg.src     = lbSrcs[lbIdx];
    lbImg.alt     = `Foto ${lbIdx + 1} von ${lbSrcs.length}`;
    lbPrev.hidden = lbIdx === 0;
    lbNext.hidden = lbIdx === lbSrcs.length - 1;
  }

  function lbOpen(srcs, idx) {
    lbSrcs = srcs; lbIdx = idx;
    lbShow();
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }

  function lbCloseAll() {
    lightbox.hidden = true;
    document.body.style.overflow = '';
  }

  if (lightbox) {
    lbClose.addEventListener('click', lbCloseAll);
    lbPrev.addEventListener('click',  () => { lbIdx--; lbShow(); });
    lbNext.addEventListener('click',  () => { lbIdx++; lbShow(); });
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lbCloseAll(); });
    document.addEventListener('keydown', (e) => {
      if (lightbox.hidden) return;
      if (e.key === 'Escape')                                   lbCloseAll();
      if (e.key === 'ArrowLeft'  && lbIdx > 0)                 { lbIdx--; lbShow(); }
      if (e.key === 'ArrowRight' && lbIdx < lbSrcs.length - 1) { lbIdx++; lbShow(); }
    });
  }

  /* ── Fetch & render ────────────────────────────────── */

  function showError(msg) {
    const ph = document.getElementById('gallery-loading');
    if (ph) ph.textContent = 'Galerie-Fehler: ' + msg;
    console.error('[gallery]', msg);
  }

  fetch('/wp-content/uploads/photos.php')
    .then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' – photos.php nicht erreichbar');
      return r.text();
    })
    .then(function(text) {
      var srcs;
      try { srcs = JSON.parse(text); }
      catch(e) { throw new Error('Ungültiges JSON von photos.php: ' + text.slice(0, 200)); }

      if (!Array.isArray(srcs) || srcs.length === 0)
        throw new Error('Keine Bilder gefunden.');

      document.getElementById('gallery-loading') &&
        document.getElementById('gallery-loading').remove();

      var ordered = shuffle(srcs);
      var pool    = buildPool(ordered.length);

      ordered.forEach(function(src, i) {
        var el = makePhotoEl(src, pickSlot(src, pool));
        el.addEventListener('click', function(e) {
          e.preventDefault();
          lbOpen(ordered, i);
        });
        gallery.appendChild(el);
      });
    })
    .catch(function(err) { showError(err.message); });

})();
