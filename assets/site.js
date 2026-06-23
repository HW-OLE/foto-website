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

  const UPLOADS_ROOT = '/wp-content/uploads/';
  const IMAGE_EXT    = /\.(jpe?g|png|webp|gif)$/i;
  // WordPress generates thumbnails like photo-1024x682.jpg — skip those, keep originals
  const THUMB_RE     = /-\d+x\d+(\.\w+)$/;

  /* ── Directory scraper ─────────────────────────────── */

  // Fetch one directory listing and return { dirs: [], images: [] }
  async function scrapeDir(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Verzeichnis nicht erreichbar: ${url} (${res.status})`);
    const html = await res.text();

    const doc   = new DOMParser().parseFromString(html, 'text/html');
    const links = [...doc.querySelectorAll('a[href]')];

    const dirs   = [];
    const images = [];

    for (const a of links) {
      const href = a.getAttribute('href');
      // Skip parent links, query strings, absolute URLs, and hidden files
      if (!href || href.startsWith('?') || href.startsWith('/') || href.startsWith('http') || href.startsWith('.')) continue;

      if (href.endsWith('/')) {
        dirs.push(url + href);
      } else if (IMAGE_EXT.test(href) && !THUMB_RE.test(href)) {
        images.push(url + href);
      }
    }

    return { dirs, images };
  }

  // Recursively walk all subdirectories under UPLOADS_ROOT
  async function discoverImages(rootUrl) {
    const allImages = [];
    const queue     = [rootUrl];

    while (queue.length) {
      const dir = queue.shift();
      try {
        const { dirs, images } = await scrapeDir(dir);
        allImages.push(...images);
        queue.push(...dirs);
      } catch (e) {
        console.warn('[gallery] Skipping directory:', dir, e.message);
      }
    }

    return allImages;
  }

  /* ── Layout engine ─────────────────────────────────── */

  // Weighted pool of CSS classes that tile the 12-column grid.
  // wide = 8 cols, small = 4 cols, tall = 4 cols + 2 rows
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

  // Detect portrait orientation from filename dimensions (e.g. 680x1024)
  function isPortrait(src) {
    const m = src.match(/[-_](\d+)[x×](\d+)\.\w+$/i);
    return m ? parseInt(m[2], 10) > parseInt(m[1], 10) : false;
  }

  // Pull the best-fitting slot from the pool for this image
  function pickSlot(src, pool) {
    const portrait  = isPortrait(src);
    const preferred = portrait ? ['tall', 'small'] : ['wide', 'small'];
    for (const p of preferred) {
      const idx = pool.indexOf(p);
      if (idx !== -1) { pool.splice(idx, 1); return p; }
    }
    return pool.splice(0, 1)[0] || 'small';
  }

  // Build enough slots for n images, shuffled
  function buildPool(n) {
    let pool = [];
    while (pool.length < n) pool = pool.concat(SLOT_POOL);
    return shuffle(pool).slice(0, n);
  }

  /* ── DOM helpers ───────────────────────────────────── */

  function makePhotoEl(src, slotClass) {
    const a   = document.createElement('a');
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

  function lbClose_() {
    lightbox.hidden = true;
    document.body.style.overflow = '';
  }

  if (lightbox) {
    lbClose.addEventListener('click', lbClose_);
    lbPrev.addEventListener('click',  () => { lbIdx--; lbShow(); });
    lbNext.addEventListener('click',  () => { lbIdx++; lbShow(); });
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lbClose_(); });
    document.addEventListener('keydown', (e) => {
      if (lightbox.hidden) return;
      if (e.key === 'Escape')     lbClose_();
      if (e.key === 'ArrowLeft'  && lbIdx > 0)               { lbIdx--; lbShow(); }
      if (e.key === 'ArrowRight' && lbIdx < lbSrcs.length-1) { lbIdx++; lbShow(); }
    });
  }

  /* ── Main ──────────────────────────────────────────── */

  discoverImages(UPLOADS_ROOT)
    .then((srcs) => {
      if (srcs.length === 0) throw new Error('Keine Bilder gefunden. Ist das Verzeichnis-Listing aktiviert?');

      document.getElementById('gallery-loading')?.remove();

      // Shuffle image order too — fresh layout every visit
      const orderedSrcs = shuffle(srcs);
      const pool        = buildPool(orderedSrcs.length);

      orderedSrcs.forEach((src, i) => {
        const slot = pickSlot(src, pool);
        const el   = makePhotoEl(src, slot);

        el.addEventListener('click', (e) => {
          e.preventDefault();
          lbOpen(orderedSrcs, i);
        });

        gallery.appendChild(el);
      });
    })
    .catch((err) => {
      const ph = document.getElementById('gallery-loading');
      if (ph) ph.textContent = `Galerie konnte nicht geladen werden: ${err.message}`;
      console.error('[gallery]', err);
    });
})();
