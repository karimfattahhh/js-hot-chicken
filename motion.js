/* J's deck motion layer. Loaded after app.js; wraps go() with a paper wipe and gives every slide its own entrance.
   Only transform, opacity and clip-path are animated. window.__motion exposes the live timelines for checking. */
(() => {
  if (!window.gsap || typeof go !== 'function') return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stageEl = document.getElementById('stage');
  const q = (s, r = stageEl) => r.querySelector(s), qa = (s, r = stageEl) => [...r.querySelectorAll(s)];
  const M = window.__motion = { enter: null, wipe: null };
  const rnd = gsap.utils.random;
  let busy = false;

  /* ---------- helpers ---------- */
  const splitLines = h => {
    if (!h || h.dataset.split || /<(?!br)/i.test(h.innerHTML)) return h ? qa('.ln-i', h) : [];
    h.dataset.split = 1; h.setAttribute('aria-label', h.textContent);
    h.innerHTML = h.innerHTML.split(/<br\s*\/?>/i).map(l => `<span class="ln" aria-hidden="true"><span class="ln-i">${l}</span></span>`).join('');
    return qa('.ln-i', h);
  };
  const splitWords = el => {
    if (!el) return [];
    const t = el.textContent; el.setAttribute('aria-label', t);
    el.innerHTML = t.split(/(\s+)/).map(w => /^\s+$/.test(w) ? w : `<span class="wd" aria-hidden="true">${w}</span>`).join('');
    return qa('.wd', el);
  };
  const STAMPS = '.actions .action,.toggle button,.heat-buttons button,.swatch,.category-buttons button,.room-tabs button,.pack-format-tabs button,.menu-controls button,.treatment-controls>.action,.billboard-controls .action,.billboard-controls input,.location-list button';
  const stamp = (tl, els, at, each = .045) => els.length && tl.from(els, { scale: 1.35, opacity: 0, rotation: () => rnd(-7, 7), duration: .34, ease: 'back.out(2.4)', stagger: each }, at);
  const layDown = (tl, el, at, o = {}) => el && tl.from(el, { y: -46, rotation: o.r ?? -3.5, scale: 1.05, opacity: 0, duration: .75, ease: 'back.out(1.25)', ...o.v }, at);
  const wipeIn = (tl, el, at, from = 'inset(0 100% 0 0)', d = .8) => el && tl.fromTo(el, { clipPath: from }, { clipPath: 'inset(0 0% 0 0)', duration: d, ease: 'power3.inOut', clearProps: 'clipPath' }, at);
  const circle = (tl, el, at, d = .9) => el && tl.fromTo(el, { clipPath: 'circle(0% at 50% 55%)' }, { clipPath: 'circle(78% at 50% 55%)', duration: d, ease: 'power3.out', clearProps: 'clipPath' }, at);
  const pop = (tl, els, at, each = .1) => els.length && tl.from(els, { scale: 0, duration: .7, ease: 'elastic.out(1,.5)', stagger: each }, at);
  const rise = (tl, els, at, each = .06, y = 18) => els.length && tl.from(els, { y, opacity: 0, duration: .5, ease: 'power3.out', stagger: each }, at);
  const count = (tl, els, at, d = .9) => els.forEach(el => { const o = { x: 0 }, v = +el.dataset.v, put = x => { el.textContent = window.JS_FIN_FMT(el, x); };
    tl.to(o, { x: v, duration: d, ease: 'power2.out', onUpdate: () => put(o.x), onComplete: () => put(v) }, at); });
  const slam = el => el && gsap.timeline().fromTo(el, { scale: 2.6, rotation: -16, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: .22, ease: 'power4.in', overwrite: true })
    .to(el, { x: 3, duration: .04, repeat: 3, yoyo: true, ease: 'none' }).set(el, { x: 0 });

  /* ---------- one entrance per slide ---------- */
  const V = {
    land(tl) { tl.from(q('.scene img'), { yPercent: 16, scale: .9, opacity: 0, duration: 1.1, ease: 'power3.out' }, 'v'); pop(tl, qa('.build-marker'), 'v+=.75'); },
    place(tl) { build(tl, q('.world-shell'), 'v+=.15'); rise(tl, qa('.scene-caption'), 'v+=1.2'); },
    restaurant(tl) { tl.fromTo(q('.world-full'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.25, ease: 'power2.inOut', clearProps: 'clipPath' }, 'v'); pop(tl, qa('.hotspot'), 'v+=1.05', .14); rise(tl, qa('.scene-caption'), 'v+=1.2'); },
    interior(tl) { tl.fromTo(q('.room-photo'), { clipPath: 'inset(0 50% 0 50%)' }, { clipPath: 'inset(0 0% 0 0%)', duration: 1.05, ease: 'power3.inOut', clearProps: 'clipPath' }, 'v'); tl.from(q('.room-photo img'), { scale: 1.14, duration: 1.5, ease: 'power2.out' }, 'v'); pop(tl, qa('.hotspot'), 'v+=.85', .12); rise(tl, qa('.room-description>*:not(.image-note)'), 'v+=.4', .08); },
    marks(tl) { layDown(tl, q('.logo-playground'), 'v'); tl.from(q('.logo-playground .mark'), { scale: .55, rotation: -9, opacity: 0, duration: .7, ease: 'back.out(1.8)' }, 'v+=.4'); },
    colour(tl) { tl.from(qa('.swatch'), { y: 46, rotation: () => rnd(-14, 14), opacity: 0, duration: .5, ease: 'back.out(1.7)', stagger: .07 }, 'v-=.1'); wipeIn(tl, q('.palette-display'), 'v', 'inset(0 0 100% 0)', .9); tl.from(qa('.palette-display>*'), { scale: 1.3, opacity: 0, duration: .4, ease: 'back.out(2)', stagger: .1 }, 'v+=.65'); },
    type(tl) { wipeIn(tl, q('.type-canvas'), 'v'); tl.from(q('.type-preview'), { yPercent: 60, opacity: 0, duration: .7, ease: 'power4.out' }, 'v+=.5'); tl.from(qa('.range'), { scaleX: 0, transformOrigin: '0 50%', duration: .7, ease: 'power3.out' }, 'v+=.3'); },
    food(tl) { circle(tl, q('.food-image'), 'v'); tl.from(q('#heat-fill'), { scaleX: 0, transformOrigin: '0 50%', duration: .6, ease: 'power3.out' }, 'v+=.5'); q('.heat-badge') && tl.add(slam(q('.heat-badge')), 'v+=.8'); },
    offerings(tl) { circle(tl, q('.offering-photo'), 'v'); rise(tl, qa('#offering-detail>*,#offering-detail li'), 'v+=.45', .05); },
    menu(tl) { tl.from(q('.menu-masthead'), { yPercent: -110, duration: .6, ease: 'power4.out' }, 'v'); tl.from(q('.menu-feature'), { xPercent: -105, duration: .75, ease: 'power4.out' }, 'v+=.15'); rise(tl, qa('.menu-columns>*'), 'v+=.4', .12, 26); tl.from(qa('.menu-heat'), { yPercent: 110, duration: .6, ease: 'power4.out' }, 'v+=.55'); },
    voice(tl) { tl.from(q('.quote-stage'), { rotationX: -88, transformOrigin: '50% 0', transformPerspective: 1200, opacity: 0, duration: .85, ease: 'back.out(1.3)' }, 'v'); tl.from(splitWords(q('#voice-quote')), { yPercent: 90, opacity: 0, rotation: 5, duration: .45, ease: 'back.out(1.6)', stagger: .09 }, 'v+=.5'); rise(tl, qa('#voice-context'), 'v+=1'); },
    bags(tl) { tl.from(q('.bag-interactive'), { rotation: -16, y: -70, opacity: 0, transformOrigin: '50% 0', duration: 1.3, ease: 'elastic.out(1,.45)' }, 'v'); rise(tl, qa('.bag-caption'), 'v+=.7'); },
    packaging(tl) { layDown(tl, q('.photo-frame'), 'v', { r: 3 }); rise(tl, qa('#pack-title,.pack-details>*'), 'v+=.4', .09); },
    'product-packs'(tl) { wipeIn(tl, q('.filled-pack-photo'), 'v', 'inset(100% 0 0 0)', .9); tl.from(q('.pack-pointer'), { y: -160, opacity: 0, duration: .8, ease: 'bounce.out' }, 'v+=.75'); },
    cards(tl) { wipeIn(tl, q('.card-stage'), 'v'); tl.from(q('.business-card-wrap'), { x: 260, y: -90, rotation: 28, opacity: 0, duration: .9, ease: 'back.out(1.15)' }, 'v+=.45'); tl.from(qa('.range'), { scaleX: 0, transformOrigin: '0 50%', duration: .7, ease: 'power3.out' }, 'v+=.3'); },
    billboard(tl) { wipeIn(tl, q('.billboard-stage'), 'v', 'inset(0 0 100% 0)', 1.1); tl.from(qa('.billboard-stage>*'), { scale: 1.08, duration: 1.4, ease: 'power2.out' }, 'v'); },
    delivery(tl) { layDown(tl, q('.delivery-stage'), 'v', { r: 2.5 }); tl.from(qa('.route>span'), { y: 14, opacity: 0, duration: .4, ease: 'back.out(2)', stagger: .12 }, 'v+=.5'); },
    photography(tl) { tl.from(qa('.photo-tile'), { scale: .4, rotation: () => rnd(-25, 25), x: () => rnd(-90, 90), y: () => rnd(-90, 90), opacity: 0, duration: .65, ease: 'back.out(1.5)', stagger: { each: .06, from: 'random' } }, 'v'); },
    social(tl) { tl.from(q('.social-preview'), { y: 90, rotation: 7, opacity: 0, duration: .85, ease: 'back.out(1.35)' }, 'v'); q('.social-headline') && tl.add(slam(q('.social-headline')), 'v+=.7'); },
    calendar(tl) { rise(tl, qa('.gantt .week'), 'v', .07, 12); tl.from(qa('.lane-label'), { x: -24, opacity: 0, duration: .4, ease: 'power3.out', stagger: .08 }, 'v+=.1'); tl.from(qa('.gantt-bar'), { scaleX: 0, duration: .5, ease: 'back.out(1.6)', stagger: .06 }, 'v+=.3'); rise(tl, qa('.gantt-detail>*'), 'v+=.9', .06); },
    growth(tl) { tl.from(qa('.location-list button'), { x: -60, opacity: 0, duration: .5, ease: 'power4.out', stagger: .09 }, 'v-=.1'); wipeIn(tl, q('.growth-statement'), 'v', 'inset(0 0 0 100%)', .9); rise(tl, qa('.growth-statement>*'), 'v+=.55', .1, 30); },
    numbers(tl) { tl.from(qa('.fin-tile'), { y: -34, scale: 1.06, opacity: 0, duration: .55, ease: 'back.out(1.5)', stagger: .09 }, 'v'); count(tl, qa('.fin-tile>.fin-n'), 'v'); rise(tl, qa('.fin-fund h3,.fin-fund li,.fin-gap'), 'v+=.6', .08); tl.from(qa('.fin-fund i'), { scaleX: 0, duration: .9, ease: 'power3.out', stagger: .12 }, 'v+=.75'); },
    scenarios(tl) { tl.from(qa('.fin-card'), { y: -60, rotation: () => rnd(-5, 5), scale: 1.06, opacity: 0, duration: .75, ease: 'back.out(1.3)', stagger: .16 }, 'v'); count(tl, qa('.fin-profit .fin-n'), 'v+=.15', 1.1); tl.from(qa('.fin-profit i'), { scaleX: 0, duration: .9, ease: 'power3.out', stagger: .16 }, 'v+=.35'); rise(tl, qa('.fin-foot p'), 'v+=.9', .1); },
    'capex-opex'(tl) { layDown(tl, q('.fin-capex'), 'v', { r: -2.5 }); layDown(tl, q('.fin-opex'), 'v+=.18', { r: 2.5 }); tl.from(qa('.fin-ledger .fin-row,.fin-opex h4,.fin-ledger footer'), { x: -16, opacity: 0, duration: .35, ease: 'power3.out', stagger: .025 }, 'v+=.5'); tl.from(qa('.fin-opex .fin-track i'), { scaleX: 0, duration: .7, ease: 'power3.out', stagger: .04 }, 'v+=.7'); count(tl, qa('.fin-ledger header>.fin-n'), 'v+=.3'); wipeIn(tl, q('.fin-strip'), 'v+=.9', 'inset(0 100% 0 0)', .8); rise(tl, qa('.fin-strip>div>*'), 'v+=1.15', .03, 12); },
    payback(tl) { layDown(tl, q('.fin-chart'), 'v', { r: 2.5 }); wipeIn(tl, q('#fin-plot'), 'v+=.55', 'inset(0 100% 0 0)', 1.3); rise(tl, qa('.fin-hold li'), 'v+=1', .1); },
    launch(tl) { tl.from(qa('.launch-item'), { x: 70, opacity: 0, duration: .55, ease: 'power4.out', stagger: .11 }, 'v'); },
    'meet-js'(tl) { layDown(tl, q('.photo-frame'), 'v', { r: 4, v: { y: -80, duration: .95 } }); stamp(tl, qa('.end-tabs button'), 'v+=.5'); },
  };
  function build(tl, el, at) {
    if (!el) return;
    tl.fromTo(el, { clipPath: 'inset(100% 0 0 0)', y: 26 }, { clipPath: 'inset(0% 0 0 0)', y: 0, duration: 1.5, ease: 'power2.inOut', clearProps: 'clipPath' }, at);
  }

  function enter(delay = 0) {
    M.enter && M.enter.kill();
    const id = slides[state.slide].id, tl = M.enter = gsap.timeline({ delay, defaults: { overwrite: 'auto' } });
    busy = true;
    const heads = qa('.slide h1,.slide h2').filter(h => !h.closest('.menu-sheet,.quote-stage'));
    const lines = heads.flatMap(splitLines);
    busy = false;
    if (reduce) { tl.from(q('.slide'), { opacity: 0, duration: .3 }); return tl; }
    tl.addLabel('v', .28);
    lines.length && tl.from(lines, { yPercent: 115, rotation: 4, duration: .75, ease: 'power4.out', stagger: .09 }, 0);
    rise(tl, qa('.intro-copy>p:not(.detail-line),.chapter-title>p,.chapter-title>div>p,.field-label,.range-label,.text-input,.interaction-hint,.image-note,.small-note,.colour-values'), .22, .05);
    stamp(tl, qa(STAMPS).filter(e => !(id === 'colour' && e.matches('.swatch')) && !(id === 'growth' && e.matches('.location-list button')) && !(id === 'meet-js' && e.closest('.end-tabs'))), .38);
    const lines2 = qa('.detail-line');
    lines2.length && tl.fromTo(lines2, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: .7, ease: 'power3.inOut', clearProps: 'clipPath', stagger: .08 }, .5);
    (V[id] || (t => layDown(t, q('.visual-panel,.scene,.photo-frame'), 'v')))(tl);
    return tl;
  }

  /* ---------- the paper wipe between slides ---------- */
  const wipe = document.createElement('div'); wipe.id = 'wipe'; wipe.setAttribute('aria-hidden', 'true');
  const edge = () => { const p = []; for (let i = 0; i <= 26; i++) p.push(`${rnd(0, 2.4).toFixed(2)}% ${(i / 26 * 100).toFixed(1)}%`); for (let i = 26; i >= 0; i--) p.push(`${(100 - rnd(0, 2.4)).toFixed(2)}% ${(i / 26 * 100).toFixed(1)}%`); return `polygon(${p.join(',')})`; };
  wipe.innerHTML = `<div class="sheet"></div>`; document.body.appendChild(wipe);
  const sheet = wipe.firstChild, STOCK = ['red', 'blue', 'ink'];
  const PACE = { cover: .95, hold: .45, reveal: 1.0 };   // seconds: sheet comes in, title is readable, sheet leaves
  const origGo = go;
  go = function (n) {                                     // eslint-disable-line no-global-assign
    n = Math.max(0, Math.min(slides.length - 1, n));
    if (n === state.slide) return;
    if (reduce) { origGo(n); enter(); return; }
    if (M.wipe && M.wipe.isActive()) M.wipe.progress(1);   // a second key press never queues up behind the first
    const dir = n > state.slide ? 1 : -1, s = slides[n];
    sheet.style.backgroundImage = `url(assets/paper-${STOCK[n % 3]}.webp)`; sheet.style.clipPath = edge();
    sheet.innerHTML = `<b>${String(n + 1).padStart(2, '0')}</b><span>${s.name}</span>` + (n % 3 === 1 ? '<img src="assets/hen-cream.png" alt="">' : '');
    M.enter && M.enter.kill();
    M.wipe = gsap.timeline()
      .set(wipe, { visibility: 'visible' })
      .fromTo(sheet, { xPercent: 104 * dir, rotation: 1.5 * dir }, { xPercent: 0, rotation: 0, duration: PACE.cover, ease: 'power2.inOut' })
      .from(sheet.children, { scale: 1.6, opacity: 0, rotation: () => rnd(-6, 6), duration: .45, ease: 'back.out(1.6)', stagger: .1 }, '-=.6')
      .to(qa('.slide'), { x: -90 * dir, duration: PACE.cover, ease: 'power2.inOut' }, 0)
      .add(() => { origGo(n); enter(PACE.hold + PACE.reveal * .35); gsap.fromTo('#slide-number,#chapter-name', { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .4, ease: 'power3.out', stagger: .05 }); })
      .to(sheet, { xPercent: -104 * dir, rotation: -1.5 * dir, duration: PACE.reveal, ease: 'power3.inOut' }, '+=' + PACE.hold)
      .set(wipe, { visibility: 'hidden' });
  };

  /* ---------- reactions inside a slide ---------- */
  document.addEventListener('click', e => {
    const b = e.target.closest('#stage button[data-action]'); if (!b || reduce) return;
    const a = b.dataset.action;
    gsap.fromTo(b, { scale: .9 }, { scale: 1, duration: .35, ease: 'back.out(3)', overwrite: 'auto' });
    if (a === 'heat') slam(q('#heat-badge'));
    if (a === 'food') circle(gsap.timeline(), q('#food-image'), 0, .6);
    if (a === 'offering') circle(gsap.timeline(), q('#offering-photo'), 0, .6);
    if (a === 'voice') gsap.from(splitWords(q('#voice-quote')), { yPercent: 90, opacity: 0, rotation: 5, duration: .4, ease: 'back.out(1.6)', stagger: .07 });
    if (a === 'colour') { wipeIn(gsap.timeline(), q('#palette-display'), 0, 'inset(0 0 100% 0)', .5); gsap.from(qa('#palette-display>*'), { scale: 1.3, opacity: 0, duration: .35, ease: 'back.out(2)', stagger: .08, delay: .25 }); }
    if (a === 'logo' || a === 'treatment') gsap.from(q('#logo-playground .mark'), { scale: .6, rotation: -8, opacity: 0, duration: .5, ease: 'back.out(1.8)' });
    if (a === 'replay') { const t = gsap.timeline(); build(t, q('.world-shell'), 0); }
    if (a === 'menu-page') { const t = gsap.timeline(); t.addLabel('v', 0); V.menu(t); }
    if (a === 'social') gsap.from(q('.social-preview'), { rotation: 5, scale: .94, duration: .5, ease: 'back.out(2)' });
  });
  // any detail text the app swaps in rises into place
  new MutationObserver(ms => {
    if (busy) return;
    const seen = new Set();
    ms.forEach(m => { const t = m.target.nodeType === 1 ? m.target : m.target.parentElement; if (t && t !== stageEl && t.matches('.detail-line,.colour-values,#offering-detail,#gantt-detail,#pack-title,.pack-details,#location-statement,#food-copy,#pack-copy,#voice-detail,#room-detail,#world-detail,#photo-detail,#delivery-detail,#bag-detail,#filled-pack-detail,#logo-detail,#heat-detail')) seen.add(t); });
    seen.forEach(t => gsap.fromTo(t, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: .4, ease: 'power3.out', overwrite: 'auto' }));
  }).observe(stageEl, { childList: true, subtree: true, characterData: true });

  enter(.15);
})();
