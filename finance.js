/* J's deck: the investor numbers. Four slides (capex-opex, numbers, scenarios, payback) built from finance.data.js,
   which finance/emit.py writes from the feasibility workbook. Loaded after app.js and before motion.js.
   One shared state: state.fin = { c: orders a day (200 | 400 | 600), p: months shown (6 | 12) }. */
(() => {
  const F = window.JS_FIN;
  if (!F || typeof slides === 'undefined') return;
  const fin = state.fin = { c: 200, p: 12 };
  const CASES = [200, 400, 600];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* hand-cut edges for the coloured panels: fixed seed, so the cut never changes between visits */
  let seed = 41; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const cut = (n = 22, d = 3.2) => { const p = [], r = () => (rand() * d).toFixed(1);
    for (let i = 0; i <= n; i++) p.push(`${(i / n * 100).toFixed(1)}% ${r()}px`);
    for (let i = 1; i < 8; i++) p.push(`calc(100% - ${r()}px) ${(i / 8 * 100).toFixed(1)}%`);
    for (let i = n; i >= 0; i--) p.push(`${(i / n * 100).toFixed(1)}% calc(100% - ${r()}px)`);
    for (let i = 7; i > 0; i--) p.push(`${r()}px ${(i / 8 * 100).toFixed(1)}%`);
    return `polygon(${p.join(',')})`; };
  document.documentElement.style.setProperty('--fin-cut-a', cut());
  document.documentElement.style.setProperty('--fin-cut-b', cut(30, 2.6));

  /* ---------- formats ---------- */
  const trim = s => s.replace(/\.0$/, '');
  const fmt = {
    m: v => { const a = Math.abs(v); return (v < 0 ? '−' : '') + 'US$' + (a >= 999500 ? (a / 1e6).toFixed(2) + 'm' : a >= 1000 ? trim((a / 1000).toFixed(a < 100000 || (a % 500 === 0 && a % 1000 !== 0) ? 1 : 0)) + 'k' : Math.round(a)); },
    d: v => 'US$' + v.toFixed(2),
    p: v => Math.round(v * 100) + '%',
    n: v => Math.round(v).toLocaleString('en-GB'),
    mo: v => 'Month ' + Math.round(v)
  };
  window.JS_FIN_FMT = (el, x) => fmt[el.dataset.f || 'm'](x);

  /* ---------- every figure on the four slides, for the current case and time frame ---------- */
  function vals(c = fin.c, p = fin.p) {
    const d = F[c], P = d.periods[p];
    const opex = P.payroll + P.housing + P.rent + P.running + P.commission + P.marketing + P.fees + P.repairs;   // food and packaging are cost of sales, not opex
    return {
      orders: d.orders, breakeven: d.breakeven, basket: d.basket, contribution: d.contribution,
      budget: d.budget, cashBefore: d.cashBefore, required: d.required, gap: d.cashBefore - d.budget, gapReserve: d.required - d.budget,
      'y1.sales': d.y1.sales, 'y1.ebitda': d.y1.ebitda, 'y1.ebitdaMargin': d.y1.ebitda / d.y1.sales, 'y1.net': d.y1.net, 'y1.roi': d.y1.net / d.cashBefore, 'y1.netMargin': d.y1.net / d.y1.sales,
      payStartup: d.payStartup, cash24: d.cash24,
      'capex.build': d.capex.build, 'capex.kitchen': d.capex.kitchen, 'capex.freight': d.capex.freight, 'capex.power': d.capex.power,
      'capex.small': d.capex.small, 'capex.contingency': d.capex.contingency, 'capex.total': d.capex.total,
      'pre.total': d.pre.total, 'wc.total': d.wc.total,
      'cogs': P.food + P.pack, 'opex.month': opex / p, 'opex.max': Math.max(P.payroll, P.running, P.commission), 'opex.fees': P.fees, 'opex.repairs': P.repairs, 'opex.payroll': P.payroll, 'opex.housing': P.housing, 'opex.rent': P.rent,
      'opex.running': P.running, 'opex.commission': P.commission, 'opex.marketing': P.marketing, 'opex.other': P.fees + P.repairs, 'opex.total': opex,
      'p.sales': P.sales, 'p.ebitda': P.ebitda, 'p.net': P.net, 'p.fcf': P.fcf, 'p.back': P.fcf / d.cashBefore, 'p.orders': P.orders
    };
  }
  const text = {
    period: () => fin.p === 6 ? 'First 6 months of trading' : 'First year of trading',
    periodShort: () => fin.p === 6 ? '6 months' : '1 year',
    caseTag: () => `At ${fin.c} orders a day`,
    gap: () => { const v = vals(), side = x => x > 500 ? `${fmt.m(x)} over the US$400k budget` : x < -500 ? `${fmt.m(-x)} under the US$400k budget` : 'exactly on the US$400k budget';
      return `Cash to open is ${side(v.gap)}. With three months of running costs held in reserve, the plan is ${side(v.gapReserve)}.`; },
    payNote: () => { const d = F[fin.c]; return `Cash to open of ${fmt.m(d.cashBefore)} is earned back in month ${d.payStartup}. Including the reserve, month ${d.payRequired}. With taxes owed set aside, month ${d.payAfterTax}.`; },
    draft: () => F.sens.margin > 0.005 ? `At that draft’s ${fmt.d(F.sens.spend)}, the margin at 200 orders would be about ${fmt.p(F.sens.margin)}.` : `At that draft’s ${fmt.d(F.sens.spend)}, 200 orders a day would not make a profit.`,
    payroll: () => `Payroll, team of ${F[fin.c].team}`
  };
  const num = (k, f = 'm', v = vals()) => `<b class="fin-n" data-k="${k}" data-f="${f}" data-v="${v[k]}">${fmt[f](v[k])}</b>`;
  const txt = k => `<span data-t="${k}">${text[k]()}</span>`;
  const caseSwitch = () => `<div class="fin-switch"><span class="field-label">Orders a day</span><div class="toggle" role="group" aria-label="Orders a day">${CASES.map(c => `<button data-action="fin-case" data-value="${c}" aria-pressed="${fin.c === c}">${c}</button>`).join('')}</div></div>`;
  const periodSwitch = () => `<div class="fin-switch"><span class="field-label">Time frame</span><div class="toggle" role="group" aria-label="Time frame">${[[6, '6 months'], [12, '1 year']].map(([p, l]) => `<button data-action="fin-period" data-value="${p}" aria-pressed="${fin.p === p}">${l}</button>`).join('')}</div></div>`;

  /* ---------- slide 1: the headline numbers ---------- */
  const tile = (label, body, note, cls = '') => `<div class="fin-tile ${cls}"><span>${label}</span>${body}<small>${note}</small></div>`;
  const FUND_MAX = 600000;
  const fundRow = (label, k, cls, v) => `<li class="${cls}"><span>${label}</span><div class="fin-track"><i data-bar="${k}" data-max="${FUND_MAX}" style="transform:scaleX(${v[k] / FUND_MAX})"></i></div>${num(k, 'm', v)}</li>`;
  function numbersSlide() {
    const v = vals();
    return `<section class="slide split fin fin-numbers"><div class="intro-copy"><h2>The numbers<br>behind<br>the chicken.</h2><p>One restaurant, one build, a team of 18. The number of orders decides what the plan gives back.</p>${caseSwitch()}${hint('Change the orders a day. Every number follows.')}</div>
<div class="fin-board"><div class="fin-tiles">
${tile('Cash to open', num('cashBefore', 'm', v), 'Build, pre-opening costs and first stock', 'red')}
${tile('Break-even', `${num('breakeven', 'n', v)}<em>orders a day</em>`, `The plan serves ${num('orders', 'n', v)}`)}
${tile('Start-up cash back', num('payStartup', 'mo', v), 'From cash the restaurant generates', 'blue')}
${tile('Year 1 sales', num('y1.sales', 'm', v), 'Net of VAT and levies')}
${tile('Year 1 profit after tax', num('y1.net', 'm', v), `${num('y1.netMargin', 'p', v)} of sales`)}
${tile('Cash made by month 24', num('cash24', 'm', v), 'After tax and all running costs')}
</div><div class="fin-fund"><h3>The funding</h3><ul>${fundRow('Budget', 'budget', 'ink', v)}${fundRow('Cash to open', 'cashBefore', 'red', v)}${fundRow('With a 3-month reserve', 'required', 'blue', v)}</ul><p class="fin-gap" data-t="gap">${text.gap()}</p></div>
<p class="image-note">Planning model in US dollars, opening provisionally in January 2027. Orders, prices and costs are targets still to be tested, not forecasts. Profit after tax is an estimate until an accountant applies Ghana’s capital allowances.</p></div></section>`;
  }

  /* ---------- slide 2: the three scenarios ---------- */
  function scenarioCard(c) {
    const v = vals(c, 12), top = F[600].y1.net;
    const row = (l, b) => `<span class="fin-line"><span>${l}</span>${b}</span>`;
    return `<button class="fin-card c${c}" data-action="fin-case" data-value="${c}" aria-pressed="${fin.c === c}"><span class="fin-card-head"><b>${c}</b><span>orders<br>a day</span></span>
<span class="fin-profit"><span>Year 1 profit after tax</span>${num('y1.net', 'm', v)}<span class="fin-track"><i style="transform:scaleX(${v['y1.net'] / top})"></i></span></span>
${row('Year 1 sales', num('y1.sales', 'm', v))}${row('EBITDA', `<span>${num('y1.ebitda', 'm', v)} · ${num('y1.ebitdaMargin', 'p', v)}</span>`)}${row('Profit margin', num('y1.netMargin', 'p', v))}${row('Year 1 return on cash to open', num('y1.roi', 'p', v))}${row('Start-up cash back', num('payStartup', 'mo', v))}${row('Cash made by month 24', num('cash24', 'm', v))}</button>`;
  }
  function scenariosSlide() {
    return `<section class="slide fin fin-scenarios"><div class="chapter-title"><h2>Three ways the year could go.</h2><div><p>One restaurant: the same US$400k build, the same team of 18, the same prices. Only the orders change.</p>${hint('Pick a scenario. It carries through the next slides.')}</div></div>
<div class="fin-cards">${CASES.map(scenarioCard).join('')}</div>
<div class="fin-foot"><p><strong>Cash to open is ${fmt.m(F[200].cashBefore)} and break-even is about ${Math.round(F[400].breakeven)} orders a day in all three.</strong> The kitchen is built once, for up to 600 orders. Each extra order adds about ${fmt.d(F[400].contribution)} before fixed costs and tax.</p><p class="image-note">Scenarios, not forecasts. Each one assumes full volume from the first month and an average spend of ${fmt.d(F[200].basket)}. By the model’s own labour standards, 18 people cover about ${fmt.p(F[200].floorCover)} of the floor work at 200 orders, ${fmt.p(F[400].floorCover)} at 400 and ${fmt.p(F[600].floorCover)} at 600.</p></div></section>`;
  }

  /* ---------- slide 3: capex and opex, 6 months or 1 year ---------- */
  function capexOpexSlide() {
    const v = vals();
    const cap = (l, k) => v[k] < 1 ? '' : `<li class="fin-row"><span>${l}</span>${num(k, 'm', v)}</li>`;
    const op = (l, k) => `<li class="fin-row"><span>${l}</span><span class="fin-track"><i data-bar="${k}" data-of="opex.max" style="transform:scaleX(${v[k] / v['opex.max']})"></i></span>${num(k, 'm', v)}</li>`;
    const strip = (l, b, cls = '') => `<div class="${cls}"><span>${l}</span>${b}</div>`;
    return `<section class="slide fin fin-costs"><div class="chapter-title"><h2>What it costs to open and to run.</h2><div class="fin-controls">${periodSwitch()}${caseSwitch()}</div></div>
<div class="fin-ledger"><article class="fin-capex"><header><div><h3>Capex</h3><p>Paid once, before opening</p></div>${num('capex.total', 'm', v)}</header><ul>
${cap('Construction and decoration', 'capex.build')}${cap('Kitchen equipment', 'capex.kitchen')}${cap('Freight, duties and installation', 'capex.freight')}${cap('Backup power, water and cold storage', 'capex.power')}${cap('Signage, smallwares, bikes and POS', 'capex.small')}${cap('Contingency', 'capex.contingency')}
</ul><ul class="fin-extra">${cap('Pre-opening: branding, licences, training', 'pre.total')}${cap('First stock, 3 months of rent paid ahead, deposits', 'wc.total')}</ul><footer><span>Cash to open</span>${num('cashBefore', 'm', v)}</footer></article>
<article class="fin-opex"><header><div><h3>Opex</h3><p data-t="period">${text.period()}</p></div>${num('opex.total', 'm', v)}</header>
<div class="fin-group"><h4>People</h4><ul>${op(txt('payroll'), 'opex.payroll')}${op('Chef and manager housing', 'opex.housing')}</ul></div>
<div class="fin-group"><h4>Place</h4><ul>${op('Rent', 'opex.rent')}${op('Utilities, gas, cleaning, delivery', 'opex.running')}</ul></div>
<div class="fin-group"><h4>Selling</h4><ul>${op('Delivery-app commission', 'opex.commission')}${op('Marketing', 'opex.marketing')}${op('Card fees', 'opex.fees')}${op('Repairs and small replacements', 'opex.repairs')}</ul></div><footer><span>Average a month</span>${num('opex.month', 'm', v)}</footer></article></div>
<div class="fin-strip">${strip('Sales', num('p.sales', 'm', v))}${strip('Food and packaging', num('cogs', 'm', v))}${strip('Opex', num('opex.total', 'm', v))}${strip('EBITDA', num('p.ebitda', 'm', v))}${strip('Profit after tax', num('p.net', 'm', v))}${strip('Cash generated', num('p.fcf', 'm', v))}${strip('Start-up cash earned back', num('p.back', 'p', v), 'stamp')}</div>
<p class="image-note">Capex is the same in both views; replacement spend only starts in month 13. Opex is the cost of running the restaurant: people, place and selling. Food and packaging are shown separately as cost of sales. Figures in US dollars from the planning model.</p></section>`;
  }

  /* ---------- slide 4: payback ---------- */
  const W = 640, H = 300, L = 58, R = 16, T = 18, B = 38, YMAX = 2400000;
  const X = m => L + m / 24 * (W - L - R), Y = v => H - B - v / YMAX * (H - T - B);
  const path = c => 'M' + [0, ...F[c].cum].map((v, m) => `${X(m).toFixed(1)} ${Y(v).toFixed(1)}`).join('L');
  function chartMarkup() {
    const d = F[fin.c], pm = d.payStartup, py = Y(d.cum[pm - 1]), ty = Y(d.cashBefore);
    const axes = `<svg class="fin-axes" viewBox="0 0 ${W} ${H}" aria-hidden="true">${[0, .5, 1, 1.5, 2].map(t => `<line x1="${L}" x2="${W - R}" y1="${Y(t * 1e6)}" y2="${Y(t * 1e6)}"/><text x="${L - 9}" y="${Y(t * 1e6) + 4}" text-anchor="end">${t ? 'US$' + t + 'm' : '0'}</text>`).join('')}${[0, 6, 12, 18, 24].map(m => `<text x="${X(m)}" y="${H - 12}" text-anchor="${m === 24 ? 'end' : m ? 'middle' : 'start'}">${m ? 'Month ' + m : 'Opening'}</text>`).join('')}</svg>`;
    const plot = `<svg id="fin-plot" viewBox="0 0 ${W} ${H}" role="img" aria-label="Cash generated after opening over 24 months at 200, 400 and 600 orders a day. ${text.payNote()}">
<line class="need" x1="${L}" x2="${W - R}" y1="${ty}" y2="${ty}"/><text class="need-label" ${pm > 12 ? `x="${L + 8}" y="${ty - 7}" text-anchor="start"` : `x="${W - R - 4}" y="${ty + 18}" text-anchor="end"`}>Cash to open ${fmt.m(d.cashBefore)}</text>
${CASES.map(c => `<path class="c${c}${c === fin.c ? ' on' : ''}" d="${path(c)}"/><text class="end${c === fin.c ? ' on' : ''}" x="${X(24) - 6}" y="${Y(F[c].cum[23]) - 9}" text-anchor="end">${c} a day</text>`).join('')}
<line class="drop" x1="${X(pm)}" x2="${X(pm)}" y1="${py}" y2="${H - B}"/><circle cx="${X(pm)}" cy="${py}" r="7"/><text class="pay" x="${X(pm) - 12}" y="${py - 12}" text-anchor="end">Month ${pm}</text></svg>`;
    return axes + plot;
  }
  function paybackSlide() {
    return `<section class="slide split fin fin-payback"><div class="intro-copy"><h2>Earning<br>it back.</h2><p>The cash the restaurant generates after opening, month by month, set against the cash it took to open.</p>${caseSwitch()}<p class="detail-line" id="fin-pay-note" data-t="payNote">${text.payNote()}</p></div>
<div class="fin-back"><div class="fin-chart" id="fin-chart">${chartMarkup()}</div>
<ul class="fin-hold"><li><strong>The price</strong>An average spend of ${fmt.d(F[200].basket)} per order, about ${fmt.p(F[200].priceUp)} above the first menu draft. ${text.draft()}</li><li><strong>The volume</strong>Every case trades at full volume from the first month. A slower start pushes payback later.</li><li><strong>The team</strong>18 people at every volume. By the model’s labour standards that covers 200 orders and is short at 400 and 600.</li></ul>
<p class="image-note">Cumulative free cash flow after tax, in US dollars. No sale value, debt or dividends are assumed.</p></div></section>`;
  }

  /* ---------- register the slides ---------- */
  insertAfter('growth', [
    { id: 'capex-opex', name: 'Capex and opex', next: 'See the numbers', render: capexOpexSlide, notes: '' },
    { id: 'numbers', name: 'The numbers', next: 'Compare the scenarios', render: numbersSlide, notes: '' },
    { id: 'scenarios', name: 'Three scenarios', next: 'See the payback', render: scenariosSlide, notes: '' },
    { id: 'payback', name: 'Earning it back', next: 'Make it real', render: paybackSlide, notes: '' }
  ]);
  slides.find(s => s.id === 'growth').next = 'Open the costs';

  /* ---------- live updates ---------- */
  function setNum(el, v, instant) {
    const from = +el.dataset.v; el.dataset.v = v;
    const put = x => { el.textContent = fmt[el.dataset.f](x); };
    el._tw && el._tw.kill();
    if (instant || reduce || !window.gsap || from === v) return put(v);
    const o = { x: from };
    el._tw = gsap.to(o, { x: v, duration: .6, ease: 'power2.out', onUpdate: () => put(o.x), onComplete: () => put(v) });
  }
  function refresh(instant) {
    const v = vals();
    $$('#stage .fin-n[data-k]').forEach(el => { if (!el.closest('.fin-card')) setNum(el, v[el.dataset.k], instant); });
    $$('#stage [data-bar]').forEach(el => { const s = v[el.dataset.bar] / (el.dataset.of ? v[el.dataset.of] : +el.dataset.max); if (instant || reduce || !window.gsap) el.style.transform = `scaleX(${s})`; else gsap.to(el, { scaleX: s, duration: .6, ease: 'power3.out', overwrite: true }); });
    $$('#stage [data-t]').forEach(el => { el.textContent = text[el.dataset.t](); });
    const chart = $('#fin-chart');
    if (chart) { chart.innerHTML = chartMarkup(); if (!instant && !reduce && window.gsap) gsap.fromTo('#fin-plot', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: .9, ease: 'power3.inOut', clearProps: 'clipPath' }); }
  }
  window.JS_FIN_REFRESH = refresh;
  document.addEventListener('click', e => {
    const b = e.target.closest('button[data-action]'); if (!b) return;
    if (b.dataset.action === 'fin-case') { fin.c = +b.dataset.value; pressed('fin-case', fin.c); refresh(); }
    if (b.dataset.action === 'fin-period') { fin.p = +b.dataset.value; pressed('fin-period', fin.p); refresh(); }
  });

  // app.js has already drawn the first slide: redraw so the counter, index and a finance deep link are right
  const at = slides.findIndex(s => s.id === location.hash.slice(1));
  if (at >= 0) state.slide = at;
  render();
})();
