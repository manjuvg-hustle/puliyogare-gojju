/* Homemade Puliyogare Gojju — interactions. No dependencies. */
(() => {
  const root = document.documentElement;
  root.classList.add('js');

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const supportsScrollTimeline = CSS.supports('animation-timeline: scroll()');

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- Mobile navigation ---------- */
  const header = $('[data-header]');
  const toggle = $('.nav__toggle');
  const menu = $('#nav-menu');
  const scrim = document.createElement('div');
  scrim.className = 'nav-scrim';
  document.body.append(scrim);

  $$('li, .nav__cta', menu).forEach((el, i) => el.style.setProperty('--i', i));

  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('is-open', open);
    scrim.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    if (open) $('a', menu)?.focus({ preventScroll: true });
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  scrim.addEventListener('click', () => setMenu(false));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });
  matchMedia('(min-width: 960px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* ---------- Scroll: header state, FAB, progress fallback ---------- */
  const fab = $('.wa-fab');
  const hero = $('.hero');
  const progress = $('.progress span');
  const stepsList = $('[data-steps]');
  const stepsLine = $('.steps__line span');
  let ticking = false;

  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('is-scrolled', y > 8);
    fab.classList.toggle('is-visible', y > hero.offsetHeight * 0.6);

    if (!supportsScrollTimeline || reduceMotion) {
      const max = root.scrollHeight - innerHeight;
      progress.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    }
    if (!supportsScrollTimeline && !reduceMotion && stepsList) {
      const r = stepsList.getBoundingClientRect();
      const start = innerHeight * 0.75, end = innerHeight * 0.35;
      const p = Math.min(1, Math.max(0, (start - r.top) / (r.height + start - end)));
      stepsLine.style.setProperty('--p', p.toFixed(3));
    }
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll (one observer, staggered) ---------- */
  const reveals = $$('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-visible'));
  } else {
    // Stagger siblings that share a parent
    const groups = new Map();
    reveals.forEach((el) => {
      const i = groups.get(el.parentElement) ?? 0;
      el.style.setProperty('--d', `${Math.min(i, 5) * 80}ms`);
      groups.set(el.parentElement, i + 1);
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    reveals.forEach((el) => io.observe(el));
  }

  /* ---------- Active nav link ---------- */
  const navLinks = $$('.nav__menu ul a');
  const sections = navLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const navIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => {
        if (a.getAttribute('href') === `#${entry.target.id}`) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => navIO.observe(s));

  /* ---------- Card tilt + spotlight (fine pointers only) ---------- */
  if (finePointer && !reduceMotion) {
    $$('[data-tilt]').forEach((card) => {
      let raf = 0;
      card.addEventListener('pointermove', (e) => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width;
          const y = (e.clientY - r.top) / r.height;
          card.style.setProperty('--ry', `${(x - 0.5) * 10}deg`);
          card.style.setProperty('--rx', `${(0.5 - y) * 8}deg`);
          card.style.setProperty('--mx', `${x * 100}%`);
          card.style.setProperty('--my', `${y * 100}%`);
        });
      });
      card.addEventListener('pointerleave', () => {
        cancelAnimationFrame(raf);
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------- Poster lightbox ---------- */
  const dialog = $('.lightbox');
  if (dialog && typeof dialog.showModal === 'function') {
    const img = $('img', dialog);
    $$('.shot').forEach((btn) => btn.addEventListener('click', () => {
      img.src = btn.dataset.full;
      img.alt = btn.dataset.alt || '';
      dialog.showModal();
    }));
    $('.lightbox__close', dialog).addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  } else {
    $$('.shot').forEach((btn) => btn.addEventListener('click', () => window.open(btn.dataset.full, '_blank')));
  }

  /* ---------- Footer year ---------- */
  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
