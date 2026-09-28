/* Investing Learning Lab - rendered verification harness.
   Serve the repo root (e.g. python3 -m http.server 8732 from the Shared folder), then:
     node Investing/tests/verify-investing.js            full run, 4 viewports
     node Investing/tests/verify-investing.js --shots    also save full-page screenshots
     node Investing/tests/verify-investing.js --only=INV-003.html,INV-005.html
   Requires Playwright with Chromium (npm install playwright; npx playwright install chromium).
   Set INV_BASE to test another host. Exits non-zero on any failure.
   Mutation-tested: an injected Infinity in a calculator, a broken quiz answer, a removed figure,
   an oversized element and a disabled decision card each turn the run red. */
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright')); }
const fs = require('fs'), path = require('path');
const BASE = process.env.INV_BASE || 'http://localhost:8732/Investing/';
const OUT = process.env.INV_SHOTS || path.join(require('os').tmpdir(), 'investing-shots'); fs.mkdirSync(OUT, { recursive: true });
const ONLY = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7);
const DIR = path.join(__dirname, '..');
const HUBS = fs.readdirSync(DIR).filter(f => /^course-[a-z-]+\.html$/.test(f)).sort();
const PAGES0 = ['index.html'].concat(HUBS, fs.readdirSync(DIR).filter(f => /^INV-\d{3}\.html$/.test(f)).sort(), ['tools.html', 'glossary.html', 'resources.html']);
const PAGES = ONLY ? PAGES0.filter(p => ONLY.split(',').includes(p)) : PAGES0;
const VIEWS = ONLY ? [[1440, 900], [390, 844]] : [[1440, 900], [1024, 768], [768, 1024], [390, 844]];
const SHOTS = process.argv.includes('--shots');
let fails = [], checks = 0;
function fail(m) { fails.push(m); }
function ok(c, m) { checks++; if (!c) fail(m); }

(async () => {
  const browser = await chromium.launch();
  for (const [w, h] of VIEWS) {
    for (const pg of PAGES) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      const page = await ctx.newPage();
      const errs = [];
      page.on('pageerror', e => errs.push('pageerror: ' + e.message));
      page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
      await page.goto(BASE + pg, { waitUntil: 'load' });
      await page.waitForTimeout(250);
      const release = await page.evaluate(() => ({
        current: document.body.innerText.includes('V1.4 (October 2026)'),
        stale: /V1\.[23] \((?:September|October) 2026\)/.test(document.body.innerText),
        oldAssets: [...document.querySelectorAll('link[href*="assets/"],script[src*="assets/"]')].map(e => e.href || e.src).filter(u => /[?&]v=1\.[23](?:&|$)/.test(u))
      }));
      ok(release.current && !release.stale && !release.oldAssets.length, `${pg} @${w}: release marker ${JSON.stringify(release)}`);
      const tabCount = await page.$$eval('.tabs-shell:not([hidden]) .panel', p => p.length);
      const n = Math.max(1, tabCount);
      for (let i = 0; i < n; i++) {
        if (tabCount) {
          await page.evaluate(i => { const sel = document.querySelector('#tabsel'); if (sel) { sel.value = String(i); sel.dispatchEvent(new Event('change')); } }, i);
          await page.waitForTimeout(120);
        }
        const r = await page.evaluate(() => {
          const act = document.querySelector('.tabs-shell:not([hidden]) .panel.active') || document.body;
          const txt = act.innerText;
          const bad = ['undefined', 'NaN', '[object', 'Infinity'].filter(x => txt.includes(x));
          const overflowX = document.documentElement.scrollWidth - window.innerWidth;
          const hasFig = !!act.querySelector('.fig, .tool, .chart, figure, .hh-grid, .mods, .res-list, .paths');
          // SVG text escaping its own viewBox
          const svgOver = [], tiny = [];
          act.querySelectorAll('svg').forEach((s, si) => {
            const vb = s.viewBox && s.viewBox.baseVal; if (!vb || !vb.width) return;
            const sr = s.getBoundingClientRect(); if (!sr.width) return;
            if (!s.closest('.art')) { const scale = sr.width / vb.width; s.querySelectorAll('text').forEach(t => { const fs = parseFloat(getComputedStyle(t).fontSize) * scale; if (fs < 7.5 && t.textContent.trim()) tiny.push((t.textContent || '').slice(0, 24) + '@' + fs.toFixed(1)); }); }
            s.querySelectorAll('text').forEach(t => {
              const b = t.getBoundingClientRect(); if (!b.width) return;
              if (b.left < sr.left - 2 || b.right > sr.right + 2 || b.top < sr.top - 2 || b.bottom > sr.bottom + 2) svgOver.push((t.textContent || '').slice(0, 40));
            });
          });
          // elements wider than viewport not inside a scroll container
          const wide = [];
          act.querySelectorAll('*').forEach(el => {
            const rc = el.getBoundingClientRect();
            if (rc.width > 0 && rc.right > window.innerWidth + 1) {
              let p = el.parentElement, scroll = false;
              while (p) { const cs = getComputedStyle(p); if (/(auto|scroll)/.test(cs.overflowX)) { scroll = true; break; } p = p.parentElement; }
              if (!scroll) wide.push(el.tagName + '.' + (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className));
            }
          });
          return { tab: act.getAttribute && act.getAttribute('data-tab'), bad, overflowX, hasFig, svgOver: svgOver.slice(0, 5), wide: [...new Set(wide)].slice(0, 5), tiny: tiny.slice(0, 4) };
        });
        const tag = `${pg} @${w} tab ${i + 1} (${r.tab})`;
        ok(!r.bad.length, `${tag}: bad text ${r.bad}`);
        ok(r.overflowX <= 1, `${tag}: page overflows horizontally by ${r.overflowX}px`);
        if (tabCount) ok(r.hasFig, `${tag}: no figure/tool on tab`);
        ok(!r.svgOver.length, `${tag}: SVG text outside viewBox: ${r.svgOver.join(' | ')}`);
        ok(!r.wide.length, `${tag}: elements past viewport: ${r.wide.join(', ')}`);
        ok(!r.tiny.length, `${tag}: illegible SVG text: ${r.tiny.join(', ')}`);
        if (SHOTS && (w === 1440 || w === 390)) await page.screenshot({ path: path.join(OUT, `${pg.replace('.html', '')}-${w}-t${String(i + 1).padStart(2, '0')}.png`), fullPage: true });
      }
      const crashed = await page.evaluate(() => [...document.querySelectorAll('[data-tool]')].filter(t => /could not start/i.test(t.innerText)).map(t => t.dataset.tool));
      ok(!crashed.length, `${pg} @${w}: calculator crashed on load: ${crashed.join(', ')}`);
      const dup = await page.evaluate(() => { const c = {}; document.querySelectorAll('[id]').forEach(e => { c[e.id] = (c[e.id] || 0) + 1; }); return Object.keys(c).filter(k => c[k] > 1); });
      ok(!dup.length, `${pg} @${w}: duplicate element ids (a tool may be writing into the wrong element): ${dup.slice(0, 5).join(', ')}`);
      ok(!errs.length, `${pg} @${w}: errors: ${errs.join(' || ')}`);
      await ctx.close();
    }
  }
  /* ---------- Interaction tests at desktop width ---------- */
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  for (const pg of PAGES.filter(p => /^INV-/.test(p))) {
    await page.goto(BASE + pg); await page.waitForTimeout(200);
    const res = await page.evaluate(async () => {
      const out = {};
      const sel = document.querySelector('#tabsel');
      const show = i => { sel.value = String(i); sel.dispatchEvent(new Event('change')); };
      const panels = [...document.querySelectorAll('.panel')];
      // decisions
      let dOk = 0, dN = 0;
      panels.forEach((p, i) => { p.querySelectorAll('.decide').forEach(d => { show(i); dN++; d.querySelector('.opt').click(); const oc = d.querySelector('.outcomes'); if (getComputedStyle(oc).display !== 'none' && d.querySelector('.oc.mine')) dOk++; }); });
      out.decide = [dOk, dN];
      // myths
      let mOk = 0, mN = 0;
      panels.forEach((p, i) => { p.querySelectorAll('.myth').forEach(m => { show(i); mN++; m.click(); if (getComputedStyle(m.querySelector('.ma')).display !== 'none') mOk++; }); });
      out.myth = [mOk, mN];
      // exercises: correct answer passes, wrong answer fails
      let eOk = 0, eN = 0;
      panels.forEach((p, i) => { p.querySelectorAll('.ex[data-answer]').forEach(ex => { show(i); eN++; const inp = ex.querySelector('input'); inp.value = '999999999'; ex.querySelector('[data-check]').click(); const wrong = ex.querySelector('.ex-fb').classList.contains('no'); inp.value = ex.getAttribute('data-answer'); ex.querySelector('[data-check]').click(); const right = ex.querySelector('.ex-fb').classList.contains('ok'); if (wrong && right) eOk++; }); });
      out.ex = [eOk, eN];
      // quiz: answer all correctly
      const qd = JSON.parse(document.getElementById('quizData').textContent);
      const qi = panels.findIndex(p => p.querySelector('#quizBox')); show(qi);
      qd.forEach((q, i) => { const b = document.querySelector(`.choice[data-q="${i}"][data-a="${q.answer}"]`); if (b) b.click(); else out.quizMissing = true; });
      out.quizPass = !!document.querySelector('.pass-flag.pass');
      out.quizN = qd.length;
      out.quizAnswersValid = qd.every(q => q.answer >= 0 && q.answer < q.choices.length && q.explain);
      const prog = JSON.parse(localStorage.getItem('inv-progress') || '{}');
      out.progress = !!(prog[document.body.dataset.module] && prog[document.body.dataset.module].done);
      // worksheets persist
      const ws = document.querySelector('.ws[data-ws] textarea');
      if (ws) { ws.value = 'test entry'; ws.dispatchEvent(new Event('input')); out.ws = (localStorage.getItem('inv-ws-' + ws.closest('.ws').dataset.ws) || '').includes('test entry'); }
      // tools at default inputs: every KPI must show a real value
      let kBlank = [];
      panels.forEach((p, i) => { p.querySelectorAll('[data-tool]').forEach(t => { show(i); t.querySelectorAll('.kpi .v').forEach(v => { const x = v.textContent.trim(); if ((x === '\u2014' || x === 'n/a' || x === '') && t.dataset.tool !== 'orders') kBlank.push(t.dataset.tool + ':' + v.previousElementSibling.textContent); }); }); });
      out.kBlank = kBlank;
      // tools must actually render results (catches id clashes that leave result areas empty)
      panels.forEach((p, i) => { p.querySelectorAll('[data-tool]').forEach(t => { show(i);
        const o = t.querySelector('.tool-out'); if (o && !o.querySelector('svg, table, .kpi') && o.innerText.trim().length < 20) kBlank.push(t.dataset.tool + ':empty results');
        t.querySelectorAll('.kpis').forEach(k => { if (!k.children.length) kBlank.push(t.dataset.tool + ':empty kpis'); });
        t.querySelectorAll('.chart').forEach(c => { if (!c.querySelector('svg')) kBlank.push(t.dataset.tool + ':empty chart'); });
        if (!t.children.length) kBlank.push(t.dataset.tool + ':tool did not render');
        if (/could not start/i.test(t.innerText)) kBlank.push(t.dataset.tool + ':tool crashed on load'); }); });
      // tools: push every range to min and max, check for bad output
      let tBad = [];
      panels.forEach((p, i) => { p.querySelectorAll('[data-tool]').forEach(t => { show(i); t.querySelectorAll('input[type=range]').forEach(r => { [r.min, r.max].forEach(v => { r.value = v; r.dispatchEvent(new Event('input')); const tx = t.innerText; if (/NaN|undefined|Infinity/.test(tx)) tBad.push(t.dataset.tool + ':' + r.id + '=' + v); }); }); t.querySelectorAll('select').forEach(s => { [...s.options].forEach(o => { s.value = o.value; s.dispatchEvent(new Event('input')); if (/NaN|undefined|Infinity/.test(t.innerText)) tBad.push(t.dataset.tool + ':' + s.id + '=' + o.value); }); }); t.querySelectorAll('.seg button').forEach(b => { b.click(); if (/NaN|undefined|Infinity/.test(t.innerText)) tBad.push(t.dataset.tool + ':seg'); }); t.querySelectorAll('input[type=number]').forEach(n => { n.value = '0'; n.dispatchEvent(new Event('input')); if (/NaN|undefined|Infinity/.test(t.innerText)) tBad.push(t.dataset.tool + ':' + n.id + '=0'); n.value = ''; n.dispatchEvent(new Event('input')); if (/NaN|undefined|Infinity/.test(t.innerText)) tBad.push(t.dataset.tool + ':' + n.id + '=blank'); }); }); });
      out.toolBad = tBad.slice(0, 8);
      // glossary popover
      const term = document.querySelector('.term');
      if (term) { const i = panels.findIndex(p => p.contains(term)); show(i); term.click(); const pop = document.querySelector('.term-pop'); out.pop = !!(pop && /what it means for you/i.test(pop.innerText)); }
      // keyboard tab navigation
      show(0); const tb = document.querySelector('.tab'); tb.focus(); tb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      out.arrow = document.querySelectorAll('.tab')[1].getAttribute('aria-selected') === 'true';
      tb.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      out.end = document.querySelectorAll('.tab')[panels.length - 1].getAttribute('aria-selected') === 'true';
      // resources rendered
      out.res = document.querySelectorAll('[data-resources] .res').length;
      // every standard household application includes the sixth persona exactly once
      const hp = document.querySelector('.panel[data-tab="Your household"]');
      out.shah = !hp || hp.querySelectorAll('[data-hh="shah"]').length === 1;
      // navigation guide: breadcrumb, unified Previous/Next, map search, back-to-top floater
      show(panels.length - 1);
      out.navLast = /Next module|Course home/.test(document.querySelector('.guide [data-step="1"]').textContent);
      out.navCrumb = /Tab \d+ of \d+/.test(document.querySelector('.guide [data-crumb-tab]').textContent);
      show(0);
      out.navFirst = /Previous module|Previous/.test(document.querySelector('.guide [data-step="-1"]').textContent);
      out.floater = !!document.querySelector('.to-top');
      // theme
      document.querySelector('[data-theme-btn]').click(); out.dark = document.documentElement.dataset.theme === 'dark'; document.querySelector('[data-theme-btn]').click();
      return out;
    });
    const tag = pg + ' interactions';
    ok(res.decide[0] === res.decide[1] && res.decide[1] > 0, `${tag}: decisions ${res.decide}`);
    ok(res.myth[0] === res.myth[1] && res.myth[1] > 0, `${tag}: myths ${res.myth}`);
    ok(res.ex[0] === res.ex[1] && res.ex[1] > 0, `${tag}: exercises ${res.ex}`);
    ok(res.quizPass && res.quizN >= 8 && res.quizAnswersValid, `${tag}: quiz pass=${res.quizPass} n=${res.quizN} valid=${res.quizAnswersValid}`);
    ok(res.progress, `${tag}: progress not stored`);
    ok(res.ws, `${tag}: worksheet not persisted`);
    ok(!res.toolBad.length, `${tag}: tool bad output ${res.toolBad}`);
    ok(!res.kBlank.length, `${tag}: tool KPI blank at defaults ${res.kBlank}`);
    ok(res.pop !== false, `${tag}: glossary popover`);
    ok(res.arrow && res.end, `${tag}: keyboard tabs arrow=${res.arrow} end=${res.end}`);
    ok(res.res > 0, `${tag}: no resources rendered`);
    ok(res.shah, `${tag}: Shah household lens missing or duplicated`);
    ok(res.dark, `${tag}: theme toggle`);
    ok(res.navLast && res.navCrumb && res.navFirst && res.floater, `${tag}: navigation guide last=${res.navLast} crumb=${res.navCrumb} first=${res.navFirst} floater=${res.floater}`);
  }
  // glossary search and resources filters
  if (!ONLY) {
  await page.goto(BASE + 'glossary.html'); await page.waitForTimeout(200);
  const gl = await page.evaluate(() => { const q = document.getElementById('q'); const all = document.querySelectorAll('.g').length; q.value = 'roth'; q.dispatchEvent(new Event('input')); const roth = document.querySelectorAll('.g').length; q.value = 'zzzzqq'; q.dispatchEvent(new Event('input')); const none = document.querySelectorAll('.g').length; return { all, roth, none }; });
  ok(gl.all > 300 && gl.roth > 3 && gl.none === 0, `glossary search ${JSON.stringify(gl)}`);
  await page.goto(BASE + 'resources.html'); await page.waitForTimeout(200);
  const rs = await page.evaluate(() => { const all = document.querySelectorAll('.res').length; document.querySelector('#rk button[data-k="video"]').click(); const vid = document.querySelectorAll('.res').length; return { all, vid }; });
  ok(rs.all > 50 && rs.vid > 10 && rs.vid < rs.all, `resources filter ${JSON.stringify(rs)}`);
  await page.goto(BASE + 'index.html'); await page.waitForTimeout(200);
  const ix = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.course-grid a.course-card')];
    return { cards: cards.length, targets: cards.filter(a => a.target === '_blank' && a.rel.includes('noopener')).length,
      hrefs: new Set(cards.map(a => a.getAttribute('href'))).size, graphics: cards.filter(a => a.querySelector('svg')).length,
      legacyHidden: [...document.querySelectorAll('.legacy-landing')].every(e => e.hidden || getComputedStyle(e).display === 'none') };
  });
  ok(ix.cards === 8 && ix.targets === 8 && ix.hrefs === 8 && ix.graphics === 8 && ix.legacyHidden, `landing courses ${JSON.stringify(ix)}`);
  const popupPromise = page.waitForEvent('popup');
  await page.click('.course-grid a.course-card');
  const popup = await popupPromise; await popup.waitForLoadState('load');
  ok(/course-investing-essentials\.html$/.test(new URL(popup.url()).pathname), `landing card did not open expected new-tab course: ${popup.url()}`);
  await popup.close();

  let hubTotal = 0, hubIds = [];
  for (const hub of HUBS) {
    await page.goto(BASE + hub); await page.waitForTimeout(250);
    const h = await page.evaluate(() => ({ modules: document.querySelectorAll('a.hub-module').length,
      targets: [...document.querySelectorAll('a.hub-module')].filter(a => a.target === '_blank' && a.rel.includes('noopener')).length,
      ids: [...document.querySelectorAll('a.hub-module')].map(a => a.getAttribute('href')),
      stages: document.querySelectorAll('.hub-stage').length, graphic: !!document.querySelector('.hub-hero svg') }));
    hubTotal += h.modules; hubIds = hubIds.concat(h.ids);
    ok(h.modules > 0 && h.targets === h.modules && h.stages > 0 && h.graphic, `${hub} structure ${JSON.stringify(h)}`);
  }
  ok(hubTotal === 105 && new Set(hubIds).size === 105, `course hubs cover ${hubTotal} modules with ${new Set(hubIds).size} unique links`);

  // typo-tolerant course-map search, abbreviations and sixth-persona capstone
  await page.goto(BASE + 'INV-001.html'); await page.waitForTimeout(200);
  const srch = await page.evaluate(async () => {
    document.querySelector('[data-map]').click();
    await new Promise(r => setTimeout(r, 180));
    const q = document.getElementById('mapQ'), body = document.getElementById('mapBody'), out = {};
    for (const term of ['bukets', 'socail securty', 'guradrails', 'snt']) {
      q.value = term; q.dispatchEvent(new Event('input')); out[term] = body.innerText;
    }
    q.value = 'six households'; q.dispatchEvent(new Event('input')); out.six = body.innerText;
    return out;
  });
  ok(/INV-076/.test(srch.bukets), `fuzzy search bukets missed INV-076`);
  ok(/INV-078/.test(srch['socail securty']), `fuzzy search socail securty missed INV-078`);
  ok(/INV-076/.test(srch.guradrails), `fuzzy search guradrails missed INV-076`);
  ok(/INV-102/.test(srch.snt), `abbreviation search SNT missed INV-102`);
  ok(/INV-105/.test(srch.six) && /Shah/i.test(srch.six), `six-household search missed INV-105`);

  // returning learners resume the saved tab and can restart the module
  await page.goto(BASE + 'INV-049.html');
  await page.evaluate(() => localStorage.setItem('inv-tab-INV-049', JSON.stringify(3)));
  await page.reload(); await page.waitForTimeout(200);
  const resumed = await page.evaluate(() => ({ tab: document.querySelector('.panel.active').getAttribute('data-tab'), note: document.querySelector('.resume-note') && document.querySelector('.resume-note').innerText }));
  ok(resumed.tab === 'Age-based rules' && /Resumed where you left off/.test(resumed.note || ''), `resume state ${JSON.stringify(resumed)}`);
  await page.click('.resume-note button');
  ok(await page.evaluate(() => document.querySelector('.panel.active').getAttribute('data-tab') === 'Start here' && !document.querySelector('.resume-note')), 'resume restart button');

  await page.goto(BASE + 'INV-105.html'); await page.waitForTimeout(200);
  const cap = await page.evaluate(() => ({ shahTab: [...document.querySelectorAll('.panel')].filter(p => p.dataset.tab === 'The Shahs').length, cards: document.querySelectorAll('[data-households] .hh').length, title: document.title }));
  ok(cap.shahTab === 1 && cap.cards === 6 && /Six Households/.test(cap.title), `capstone sixth persona ${JSON.stringify(cap)}`);
  }
  ok(!errs.length, 'interaction page errors: ' + errs.join(' | '));
  await browser.close();
  console.log(`checks: ${checks}, failures: ${fails.length}`);
  fails.slice(0, 80).forEach(f => console.log(' - ' + f));
  process.exit(fails.length ? 1 : 0);
})();
