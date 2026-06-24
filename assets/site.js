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

  /* ── Bildliste ─────────────────────────────────────────
     Hier einfach Pfade ergänzen oder entfernen.          */
  const PHOTOS = [
    '/wp-content/uploads/2022/08/DSC00295.jpg',
    '/wp-content/uploads/2022/08/DSC00333.jpg',
    '/wp-content/uploads/2022/08/DSC0367.jpg',
    '/wp-content/uploads/2022/08/DSC6709.jpg',
    '/wp-content/uploads/2022/08/wiesenentwaesserung.jpg',
    '/wp-content/uploads/auswahl_neu/Kursfahrt_147_151025.jpg',
    '/wp-content/uploads/auswahl_neu/Kursfahrt_154_151025.jpg',
    '/wp-content/uploads/auswahl_neu/Kursfahrt_169_151025.jpg',
    '/wp-content/uploads/auswahl_neu/Kursfahrt_186_171025.jpg',
    '/wp-content/uploads/auswahl_neu/Kursfahrt_28_131025.jpg',
    '/wp-content/uploads/auswahl_neu/Kursfahrt_30_131025.jpg',
    '/wp-content/uploads/auswahl_neu/Kursfahrt_45_131025.jpg',
    '/wp-content/uploads/auswahl_neu/Kursfahrt_56_131025.jpg',
    '/wp-content/uploads/auswahl_neu/Kursfahrt_6_131025.jpg',
    '/wp-content/uploads/auswahl_neu/_DSC0128.jpg',
    '/wp-content/uploads/auswahl_neu/_DSC5749.jpg',
    '/wp-content/uploads/auswahl_neu/_DSC5768.jpg',
    '/wp-content/uploads/auswahl_neu/_DSC6503.jpg',
  ];

  /* ── Layout ────────────────────────────────────────── */

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

  /* ── DOM ───────────────────────────────────────────── */

  function makePhotoEl(src, slotClass) {
    const a     = document.createElement('a');
    a.className = 'photo ' + slotClass;
    a.href      = src;
    const img   = document.createElement('img');
    img.src     = src;
    img.alt     = 'Foto von Ole B';
    img.loading = 'lazy';
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
    lbImg.alt     = 'Foto ' + (lbIdx + 1) + ' von ' + lbSrcs.length;
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
    lbPrev.addEventListener('click',  function() { lbIdx--; lbShow(); });
    lbNext.addEventListener('click',  function() { lbIdx++; lbShow(); });
    lightbox.addEventListener('click', function(e) { if (e.target === lightbox) lbCloseAll(); });
    document.addEventListener('keydown', function(e) {
      if (lightbox.hidden) return;
      if (e.key === 'Escape')                                   lbCloseAll();
      if (e.key === 'ArrowLeft'  && lbIdx > 0)                 { lbIdx--; lbShow(); }
      if (e.key === 'ArrowRight' && lbIdx < lbSrcs.length - 1) { lbIdx++; lbShow(); }
    });
  }

  /* ── Render ────────────────────────────────────────── */

  document.getElementById('gallery-loading') &&
    document.getElementById('gallery-loading').remove();

  const ordered = shuffle(PHOTOS);
  const pool    = buildPool(ordered.length);

  ordered.forEach(function(src, i) {
    const el = makePhotoEl(src, pickSlot(src, pool));
    el.addEventListener('click', function(e) {
      e.preventDefault();
      lbOpen(ordered, i);
    });
    gallery.appendChild(el);
  });

})();
