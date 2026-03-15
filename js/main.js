/* ================================================================
   EVAN CUTTIC — PORTFOLIO
   JavaScript: Cursor · Sidebar · Transitions · Scroll Reveal
================================================================ */

'use strict';

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];


/* ----------------------------------------------------------------
   1. PAGE LOAD FADE-IN
---------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {

  requestAnimationFrame(() => {
    document.body.classList.add('loaded');
  });


  /* --------------------------------------------------------------
     2. CUSTOM CURSOR
  -------------------------------------------------------------- */
  const cursor = document.getElementById('cursor');

  if (cursor && !window.matchMedia('(hover: none)').matches) {

    document.addEventListener('mousemove', e => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top  = e.clientY + 'px';
    });

    $$('a, button').forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
  }


  /* --------------------------------------------------------------
     4. PAGE TRANSITIONS
     Fade body out before navigating to a new page.
  -------------------------------------------------------------- */
  $$('a[href]').forEach(link => {
    const href = link.getAttribute('href');

    if (
      !href ||
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('http') ||
      href.startsWith('//') ||
      link.target === '_blank'
    ) return;

    link.addEventListener('click', e => {
      e.preventDefault();
      document.body.classList.remove('loaded');
      setTimeout(() => { window.location.href = href; }, 500);
    });
  });


  /* --------------------------------------------------------------
     5. COMPANY TAB WIDTH EQUALIZATION
     Make all [data-company] tabs exactly as wide as the widest one.
     Pure CSS can't equalize sibling widths to the largest; JS measures
     and applies a shared min-width so all tabs match the longest label.
  -------------------------------------------------------------- */
  const companyTabs = $$('.kac-tab[data-company]');
  if (companyTabs.length > 1) {
    companyTabs.forEach(t => { t.style.minWidth = ''; });
    const maxW = Math.max(...companyTabs.map(t => t.getBoundingClientRect().width));
    companyTabs.forEach(t => { t.style.minWidth = maxW + 'px'; });
  }


  /* --------------------------------------------------------------
     7. PLACEHOLDER AUTO-SWAP
     On load, test each .img-placeholder's image path. If the file
     exists, replace the placeholder div with a real <img>.
     Drop an image with the matching filename → refresh to see it.
  -------------------------------------------------------------- */
  $$('.img-placeholder').forEach(ph => {
    const fnEl = ph.querySelector('.ph-filename');
    if (!fnEl) return;

    const src = fnEl.textContent.trim();
    if (!src) return;

    const test = new Image();
    test.onload = () => {
      const img    = document.createElement('img');
      img.src      = src;
      img.alt      = src.split('/').pop().replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      img.decoding = 'async';

      const parent = ph.parentNode;

      // If the placeholder is inside a pc-img-wrap, set its aspect-ratio
      // so the wrapper maintains the correct proportions with a real image.
      if (parent && parent.classList.contains('pc-img-wrap')) {
        const ar = ph.style.getPropertyValue('--ar').trim();
        if (ar) parent.style.aspectRatio = ar;
      }

      parent.replaceChild(img, ph);
    };
    test.src = src;
  });


  /* --------------------------------------------------------------
     8. DYNAMIC GALLERY
     .project-images[data-gallery-path] fetches manifest.json from
     the specified path, then renders <img> or <video> for each file.
     Run scripts/build-manifests.js after adding/removing media files.
  -------------------------------------------------------------- */
  const IMAGE_EXTS = new Set(['webp', 'jpg', 'jpeg', 'png', 'gif']);
  const VIDEO_EXTS = new Set(['mp4', 'mov', 'webm']);

  $$('.project-images[data-gallery-path]').forEach(container => {
    const base       = container.dataset.galleryPath;
    const imagesOnly = container.hasAttribute('data-images-only');

    fetch(base + 'manifest.json')
      .then(r => {
        if (!r.ok) throw new Error('no manifest');
        return r.json();
      })
      .then(files => {
        // Clear any placeholder fallback content
        container.innerHTML = '';

        files.forEach(filename => {
          const ext = filename.split('.').pop().toLowerCase();
          let el;

          if (IMAGE_EXTS.has(ext)) {
            el = document.createElement('img');
            el.src      = base + filename;
            el.alt      = filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
            el.decoding = 'async';
            el.loading  = 'lazy';
          } else if (VIDEO_EXTS.has(ext) && !imagesOnly) {
            el = document.createElement('video');
            el.src         = base + filename;
            el.controls    = true;
            el.playsInline = true;
            el.preload     = 'metadata';
            el.className   = 'gallery-video';
          }

          if (el) container.appendChild(el);
        });
      })
      .catch(() => {
        // No manifest yet — placeholder content remains visible
      });
  });


  /* --------------------------------------------------------------
     9. SCROLL REVEAL
     Elements with .reveal get .visible when in viewport.
  -------------------------------------------------------------- */
  const revealEls = $$('.reveal');

  if (revealEls.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -32px 0px'
    });

    revealEls.forEach(el => observer.observe(el));
  }


  /* --------------------------------------------------------------
     9. GLOBAL LIGHTBOX
     Click any <img> inside .project-images (except .kac-img carousel
     frames) to open a fullscreen overlay. Sibling images in the same
     .project-images container form a navigable group.
  -------------------------------------------------------------- */
  (function () {
    const lb = document.createElement('div');
    lb.id        = 'site-lightbox';
    lb.className = 'site-lightbox';
    lb.setAttribute('hidden', '');
    lb.innerHTML =
      '<button class="lb-close" aria-label="Close">✕</button>' +
      '<button class="lb-prev"  aria-label="Previous">←</button>' +
      '<img class="lb-img" src="" alt="">' +
      '<video class="lb-video" controls playsinline loop hidden></video>' +
      '<button class="lb-next"  aria-label="Next">→</button>';
    document.body.appendChild(lb);

    const lbImg   = lb.querySelector('.lb-img');
    const lbVideo = lb.querySelector('.lb-video');
    const lbClose = lb.querySelector('.lb-close');
    const lbPrev  = lb.querySelector('.lb-prev');
    const lbNext  = lb.querySelector('.lb-next');
    let group   = [];
    let idx     = 0;
    let showGen = 0;

    function show(i) {
      idx = i;
      lbPrev.disabled = i === 0;
      lbNext.disabled = i === group.length - 1;

      const el      = group[i];
      const isVideo = el.tagName === 'VIDEO';

      if (isVideo) {
        lbImg.hidden   = true;
        lbVideo.hidden = false;
        lbVideo.src    = el.src;
        lbVideo.play();
      } else {
        lbVideo.pause();
        lbVideo.src    = '';
        lbVideo.hidden = true;
        lbImg.hidden   = false;

        const src = el.src;
        const alt = el.alt || '';
        const gen = ++showGen;

        // Preload the target image, then cross-fade in
        const tmp = new Image();
        tmp.onload = function () {
          if (gen !== showGen) return;            // superseded by a newer call
          lbImg.style.opacity = '0';
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {   // two rAFs ensure fade-out paints first
              if (gen !== showGen) return;
              lbImg.src = src;
              lbImg.alt = alt;
              lbImg.style.opacity = '';
            });
          });
        };
        tmp.src = src;

        // Speculatively preload neighbouring images
        if (i + 1 < group.length && group[i + 1].tagName !== 'VIDEO') new Image().src = group[i + 1].src;
        if (i - 1 >= 0           && group[i - 1].tagName !== 'VIDEO') new Image().src = group[i - 1].src;
      }
    }

    function open(els, i) {
      group = els;
      lb.removeAttribute('hidden');
      document.body.style.overflow = 'hidden';
      show(i);
    }

    function close() {
      lb.setAttribute('hidden', '');
      document.body.style.overflow = '';
      lbVideo.pause();
      lbVideo.src = '';
    }

    lbClose.addEventListener('click', close);
    lbPrev.addEventListener('click', () => { if (idx > 0) show(idx - 1); });
    lbNext.addEventListener('click', () => { if (idx < group.length - 1) show(idx + 1); });
    lb.addEventListener('click', e => { if (e.target === lb) close(); });

    document.addEventListener('keydown', e => {
      if (lb.hasAttribute('hidden')) return;
      e.stopImmediatePropagation();
      if (e.key === 'Escape')                              close();
      if (e.key === 'ArrowLeft'  && idx > 0)              show(idx - 1);
      if (e.key === 'ArrowRight' && idx < group.length - 1) show(idx + 1);
    });

    // Event delegation — works with images and videos, including dynamically loaded ones
    $$('.project-images').forEach(wrap => {
      wrap.addEventListener('click', e => {
        const img = e.target.closest('img:not(.kac-img)');
        const vid = e.target.closest('video');
        const target = img || vid;
        if (!target) return;
        const els = Array.from(wrap.querySelectorAll('img:not(.kac-img), video'));
        open(els, els.indexOf(target));
      });
    });
  }());

});
