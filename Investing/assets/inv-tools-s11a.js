/* Investing Learning Lab - Stage 11 (Retirement) calculators, part A - V1.3 (October 2026)
   Tools for INV-075 to INV-079. Every tool computes from its stated formula in the browser.
   Historical tools use window.INV_RETURNS (Damodaran, NYU Stern, 1928-2025).
   Longevity uses the SSA 2023 period life table as used in the 2026 Trustees Report.
   Social Security rules follow SSA (2026 bend points, FRA tables, 20 CFR 404.409, POMS RS 00615.320)
   and the methods of Babak's Social Security Family Planner. Medicare figures are CMS 2026 amounts. */
(function () {
  "use strict";
  var INV = window.INV; if (!INV) return;
  var esc = INV.esc, money = INV.money, ms = INV.moneyShort, pct = INV.pct;
  var TOOLS = INV.tools = INV.tools || {};

  /* ---------- helpers (local copies of the inv-tools.js patterns) ---------- */
  function shell(el, title, tag, inputs, out) {
    el.classList.add("tool");
    el.innerHTML = '<div class="tool-h"><b>' + esc(title) + '</b><span class="tag">' + esc(tag || "Calculator") + '</span></div><div class="tool-b"><div class="tool-in">' +
      inputs + '</div><div class="tool-out" aria-live="polite">' + out + "</div></div>";
  }
  function rng(id, label, min, max, step, val, fmt) {
    return '<div class="fld"><label for="' + id + '">' + esc(label) + ' <output id="' + id + '-o"></output></label><input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '" data-fmt="' + (fmt || "") + '"></div>';
  }
  function numf(id, label, val, step, hint) {
    return '<div class="fld"><label for="' + id + '">' + esc(label) + '</label><input type="number" id="' + id + '" value="' + val + '" step="' + (step || 1) + '" min="0">' + (hint ? '<span class="hint">' + esc(hint) + "</span>" : "") + "</div>";
  }
  function selectf(id, label, opts, val) {
    return '<div class="fld"><label for="' + id + '">' + esc(label) + '</label><select id="' + id + '">' + opts.map(function (o) {
      return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(val) ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select></div>";
  }
  function segf(label, key, opts, val) {
    return '<div class="fld"><label>' + esc(label) + '</label><div class="seg" role="group" data-seg="' + key + '">' + opts.map(function (o) {
      return '<button type="button" data-v="' + esc(o[0]) + '" aria-pressed="' + (o[0] === val ? "true" : "false") + '">' + esc(o[1]) + "</button>"; }).join("") + "</div></div>";
  }
  function hintp(t) { return '<p class="hint" style="font-size:.76rem;color:var(--muted)">' + t + "</p>"; }
  function self(el, id) { return el.querySelector("#" + el.dataset.uid + "-" + id); }
  function uid(el) { if (!el.dataset.uid) el.dataset.uid = "t" + Math.random().toString(36).slice(2, 8); return el.dataset.uid; }
  function num(el, id) { var v = Number(self(el, id).value); return isFinite(v) && v > 0 ? v : 0; }
  function fmtOut(input) {
    var o = input.parentNode.querySelector("output"); if (!o) return;
    var f = input.getAttribute("data-fmt"), v = Number(input.value);
    var dec = input.step.indexOf(".") > -1 ? input.step.split(".")[1].length : 0;
    o.textContent = f === "pct" ? v.toFixed(dec) + "%" : f === "yr" ? v + (v === 1 ? " year" : " years") : f === "money" ? money(v) :
      f === "age" ? "age " + v : f === "stk" ? v + "% stocks / " + (100 - v) + "% bonds" : f === "mo" ? v + (v === 1 ? " month" : " months") :
      f === "by" ? "born " + v : f === "year" ? String(v) : String(v);
  }
  function wire(el, fn) {
    el.querySelectorAll("input,select").forEach(function (i) {
      i.addEventListener("input", function () { if (i.type === "range") fmtOut(i); fn(); });
      if (i.type === "range") fmtOut(i);
    });
    fn();
    document.addEventListener("inv-theme", fn);
  }
  function segWire(el, state, fn) {
    el.querySelectorAll("[data-seg]").forEach(function (g) {
      var key = g.getAttribute("data-seg");
      g.querySelectorAll("button").forEach(function (b) {
        b.addEventListener("click", function () {
          state[key] = b.getAttribute("data-v");
          g.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
          fn();
        });
      });
    });
  }
  function kpi(k, v, cls) { return '<div class="kpi"><div class="k">' + esc(k) + '</div><div class="v ' + (cls || "") + '">' + v + "</div></div>"; }
  function yearFmt(v) { return String(Math.round(v)); }
  function pctFmt(v) { return Math.round(v) + "%"; }

  /* ---------- historical data ---------- */
  var H = null;
  function hist() { if (!H) H = INV.hist(); return H; }
  function row(y) { var h = hist(); return h.rows[y - h.first]; }
  /* real (after-inflation) return, %, of a mix with stock share s (0..1) and 10-year Treasuries, rebalanced yearly */
  function realMix(r, s) { return ((1 + (s * r[1] + (1 - s) * r[3]) / 100) / (1 + r[7] / 100) - 1) * 100; }
  function nomMix(r, s) { return s * r[1] + (1 - s) * r[3]; }

  /* ---------- CORE: withdrawal simulation in real (start-year) dollars ----------
     Each year: take the withdrawal at the start of the year, then earn that year's real return.
     Working in real terms is identical to taking inflation-adjusted withdrawals in nominal dollars. */
  function fixedReal(rets, rate) {
    var B = 1, path = [1], lasted = rets.length, ok = true;
    for (var k = 0; k < rets.length; k++) {
      if (B < rate - 1e-12) { ok = false; lasted = k; B = 0; path.push(0); for (var j = k + 1; j < rets.length; j++) path.push(0); break; }
      B = (B - rate) * (1 + rets[k] / 100); path.push(B);
    }
    return { ok: ok, lasted: lasted, end: ok ? B : 0, path: path };
  }
  function windowRets(start, n, s) { var o = []; for (var k = 0; k < n; k++) { var r = row(start + k); if (!r) return null; o.push(realMix(r, s)); } return o; }
  function safeMax(rets) { var lo = 0, hi = 0.25; for (var i = 0; i < 40; i++) { var m = (lo + hi) / 2; if (fixedReal(rets, m).ok) lo = m; else hi = m; } return lo; }

  /* four spending rules on one historical window (INV-076) */
  function strategies(start, rate, s, n) {
    var out = {};
    function mk() { return { spend: [], bal: [1] }; }
    var F = mk(), G = mk(), V = mk(), C = mk();
    var bF = 1, bG = 1, bV = 1, bC = 1, wF = rate, wG = rate, prevNom = 0, cutsG = 0, raisesG = 0;
    var vr = 0.03; /* assumed real return used in the amortization (VPW-style) rule */
    for (var k = 0; k < n; k++) {
      var r = row(start + k), rr = realMix(r, s), nom = nomMix(r, s);
      /* fixed real */
      var w = Math.min(wF, bF); F.spend.push(w); bF = (bF - w) * (1 + rr / 100); F.bal.push(bF);
      /* guardrails (simplified Guyton-Klinger, 2006): no inflation raise after a year with a negative nominal
         portfolio return; cut 10% if the withdrawal rate is more than 20% above the initial rate (not in the
         final 15 years); raise 10% if it is more than 20% below. Real terms: a freeze is a real cut by that year's inflation. */
      if (k > 0) {
        if (prevNom < 0) wG = wG / (1 + rowInfl(start + k - 1) / 100);
        var wr = bG > 0 ? wG / bG : Infinity;
        if (wr > rate * 1.2 && n - k > 15) { wG *= 0.9; cutsG++; }
        else if (wr < rate * 0.8) { wG *= 1.1; raisesG++; }
      }
      var wg = Math.min(wG, bG); G.spend.push(wg); bG = (bG - wg) * (1 + rr / 100); G.bal.push(bG);
      prevNom = nom;
      /* amortization / VPW-style: withdraw the payment that would empty the balance over the remaining years at an assumed real return */
      var rem = n - k, pmt = vr === 0 ? 1 / rem : vr / (1 - Math.pow(1 + vr, -rem)) / (1 + vr);
      var wv = bV * pmt; V.spend.push(wv); bV = Math.max(0, (bV - wv) * (1 + rr / 100)); if (bV < 1e-9) bV = 0; V.bal.push(bV);
      /* constant percentage of the current balance */
      var wc = bC * rate; C.spend.push(wc); bC = (bC - wc) * (1 + rr / 100); C.bal.push(bC);
    }
    out.fixed = F; out.guard = G; out.vpw = V; out.pct = C; out.cuts = cutsG; out.raises = raisesG;
    return out;
  }
  function rowInfl(y) { var r = row(y); return r ? r[7] : 0; }

  /* seeded random numbers (mulberry32) for reproducible Monte Carlo */
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function monteCarlo(opt) {
    /* opt: bal, spend (real, per year), s, years, sims, seed, method ("boot" | "normal") */
    var h = hist(), N = h.rows.length, rand = mulberry32(opt.seed >>> 0 || 1), all = [];
    var mean = 0, sd = 0, reals = h.rows.map(function (r) { return realMix(r, opt.s); });
    reals.forEach(function (x) { mean += x; }); mean /= N; reals.forEach(function (x) { sd += (x - mean) * (x - mean); }); sd = Math.sqrt(sd / (N - 1));
    var ok = 0, ends = [], depl = [];
    for (var i = 0; i < opt.sims; i++) {
      var B = opt.bal, p = [B], failed = false;
      for (var t = 0; t < opt.years; t++) {
        var rr;
        if (opt.method === "normal") { var u1 = Math.max(rand(), 1e-12), u2 = rand(); rr = mean + sd * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); }
        else rr = reals[Math.floor(rand() * N)];
        if (!failed && B < opt.spend - 1e-9) { failed = true; depl.push(t + 1); B = 0; }
        if (!failed) B = (B - opt.spend) * (1 + rr / 100);
        p.push(failed ? 0 : B);
      }
      if (!failed) ok++;
      ends.push(p[p.length - 1]); all.push(p);
    }
    function pctl(arr, q) { var a = arr.slice().sort(function (x, y) { return x - y; }); var idx = (a.length - 1) * q, lo = Math.floor(idx), hi = Math.ceil(idx); return a[lo] + (a[hi] - a[lo]) * (idx - lo); }
    var bands = {}; [0.1, 0.25, 0.5, 0.75, 0.9].forEach(function (q) { var line = []; for (var t = 0; t <= opt.years; t++) line.push([t, pctl(all.map(function (p) { return p[t]; }), q)]); bands[q] = line; });
    return { success: ok / opt.sims, ends: ends, p10: pctl(ends, 0.1), p50: pctl(ends, 0.5), p90: pctl(ends, 0.9), bands: bands, mean: mean, sd: sd,
      medDepl: depl.length ? pctl(depl, 0.5) : null, fails: depl.length };
  }

  /* ---------- SSA 2023 period life table (2026 Trustees Report): lives out of 100,000, ages 0-119 ---------- */
  var LM = [100000,99399,99351,99319,99294,99275,99259,99246,99233,99221,99210,99197,99183,99166,99143,99111,99065,99002,98921,98822,98709,98588,98458,98322,98181,98033,97876,97711,97537,97354,97162,96960,96746,96523,96291,96051,95803,95548,95284,95011,94727,94432,94125,93803,93465,93112,92746,92369,91977,91565,91126,90659,90160,89627,89053,88436,87774,87056,86278,85440,84544,83585,82563,81473,80314,79084,77783,76416,74984,73486,71916,70269,68539,66722,64811,62797,60675,58429,56024,53477,50785,47960,44998,41922,38760,35529,32236,28901,25563,22265,19063,16023,13194,10617,8320,6333,4672,3335,2298,1534,999,633,389,232,133,74,39,20,10,4,2,1,0,0,0,0,0,0,0,0], LF = [100000,99487,99448,99426,99407,99392,99378,99367,99357,99347,99337,99327,99316,99303,99288,99270,99247,99220,99188,99151,99110,99066,99019,98968,98914,98857,98797,98733,98666,98593,98513,98427,98333,98233,98126,98013,97895,97771,97639,97499,97350,97190,97020,96841,96652,96452,96241,96019,95785,95536,95269,94981,94668,94332,93969,93577,93153,92694,92197,91661,91080,90450,89767,89029,88238,87399,86508,85567,84569,83509,82374,81158,79847,78433,76904,75248,73454,71510,69387,67087,64606,61946,59099,56068,52857,49469,45919,42223,38399,34475,30504,26564,22732,19087,15697,12612,9877,7519,5554,3977,2758,1849,1196,745,446,256,141,73,36,17,7,3,1,0,0,0,0,0,0,0];
  var EM = [75.79,75.25,74.28,73.31,72.33,71.34,70.35,69.36,68.37,67.38,66.39,65.39,64.4,63.41,62.43,61.45,60.48,59.51,58.56,57.62,56.69,55.76,54.83,53.9,52.98,52.06,51.14,50.23,49.32,48.41,47.5,46.6,45.7,44.81,43.91,43.02,42.13,41.24,40.36,39.47,38.59,37.71,36.83,35.95,35.08,34.21,33.34,32.48,31.62,30.76,29.9,29.05,28.21,27.38,26.55,25.73,24.92,24.12,23.34,22.56,21.79,21.04,20.29,19.56,18.83,18.12,17.41,16.71,16.02,15.34,14.66,14.0,13.34,12.69,12.05,11.42,10.8,10.19,9.61,9.04,8.5,7.97,7.46,6.97,6.5,6.04,5.61,5.2,4.81,4.45,4.11,3.8,3.5,3.23,2.99,2.77,2.58,2.41,2.27,2.15,2.04,1.93,1.83,1.72,1.63,1.54,1.45,1.36,1.28,1.2,1.13], EF = [81.06,80.48,79.51,78.53,77.54,76.55,75.56,74.57,73.58,72.59,71.59,70.6,69.61,68.62,67.63,66.64,65.66,64.67,63.69,62.72,61.74,60.77,59.8,58.83,57.86,56.9,55.93,54.97,54.0,53.04,52.08,51.13,50.18,49.23,48.28,47.34,46.39,45.45,44.51,43.58,42.64,41.71,40.78,39.86,38.93,38.01,37.1,36.18,35.27,34.36,33.45,32.55,31.66,30.77,29.89,29.01,28.14,27.28,26.42,25.57,24.73,23.9,23.08,22.27,21.46,20.66,19.87,19.08,18.3,17.53,16.76,16.01,15.26,14.53,13.81,13.1,12.41,11.73,11.08,10.44,9.82,9.22,8.64,8.08,7.54,7.02,6.53,6.05,5.61,5.19,4.8,4.44,4.1,3.79,3.5,3.23,2.99,2.77,2.57,2.39,2.23,2.08,1.94,1.82,1.7,1.59,1.48,1.38,1.29,1.2,1.13];
  function survive(sex, a, b) { var L = sex === "m" ? LM : LF; if (b >= L.length) return 0; return L[a] ? L[b] / L[a] : 0; }

  /* ---------- Social Security rules ---------- */
  /* Full retirement age for retirement and spousal benefits, by year of birth (SSA; 20 CFR 404.409(a)). Born Jan 1: use prior year. */
  function fra(by) {
    if (by <= 1937) return 65; if (by <= 1942) return 65 + (by - 1937) * 2 / 12; if (by <= 1954) return 66;
    if (by <= 1959) return 66 + (by - 1954) * 2 / 12; return 67;
  }
  /* Full retirement age for widow(er)'s benefits (20 CFR 404.409(b)). */
  function survFra(by) {
    if (by <= 1939) return 65; if (by <= 1944) return 65 + (by - 1939) * 2 / 12; if (by <= 1956) return 66;
    if (by <= 1961) return 66 + (by - 1956) * 2 / 12; return 67;
  }
  /* own benefit as a share of PIA at a claiming age (years, may be fractional): 5/9 of 1% a month for the first 36 months early,
     5/12 of 1% for further months; 2/3 of 1% a month (8% a year) of delayed credits for births 1943+ up to 70 */
  function ownFactor(age, F) {
    var m = Math.round((F - age) * 12);
    if (m > 0) return 1 - Math.min(m, 36) * 5 / 900 - Math.max(m - 36, 0) * 5 / 1200;
    var d = Math.round((Math.min(age, 70) - F) * 12); return 1 + Math.max(0, d) * 2 / 300;
  }
  /* spousal share of the 50% maximum: 25/36 of 1% a month for 36 months, 5/12 of 1% beyond; no delayed credits */
  function spouseFactor(age, F) { var m = Math.round((F - age) * 12); if (m <= 0) return 1; return Math.max(0, 1 - Math.min(m, 36) * 25 / 3600 - Math.max(m - 36, 0) * 5 / 1200); }
  /* survivor: 71.5% at 60 rising to 100% at the survivor FRA (SSA), linear in months */
  function survFactor(age, SF) { if (age >= SF) return 1; if (age <= 60) return 0.715; return 0.715 + (age - 60) / (SF - 60) * 0.285; }
  function fmtAge(a) { var y = Math.floor(a + 1e-9), m = Math.round((a - y) * 12); if (m === 12) { y++; m = 0; } return m ? y + " and " + m + " mo" : String(y); }
  /* 2026 PIA formula: 90% / 32% / 15% with bend points $1,286 and $7,749, rounded down to the dime */
  function pia2026(aime) {
    var a = Math.max(0, Math.floor(aime)), p1 = 0.9 * Math.min(a, 1286), p2 = 0.32 * Math.max(0, Math.min(a, 7749) - 1286), p3 = 0.15 * Math.max(0, a - 7749);
    return { p1: p1, p2: p2, p3: p3, pia: Math.floor((p1 + p2 + p3) * 10 + 1e-7) / 10 };
  }
  /* taxable Social Security benefits: IRS Publication 915, Worksheet 1 (no adjustments) */
  function ssTaxable(ss, other, exempt, joint) {
    var half = ss * 0.5, l8 = half + other + exempt, base = joint ? 32000 : 25000, add = joint ? 12000 : 9000;
    if (l8 <= base) return { ci: l8, tax: 0 };
    var l10 = l8 - base, l12 = Math.max(0, l10 - add), l15 = Math.min(half, Math.min(l10, add) * 0.5), l17 = l15 + l12 * 0.85;
    return { ci: l8, tax: Math.min(l17, ss * 0.85) };
  }

  /* ---------- Medicare 2026 (CMS fact sheet, Nov 14, 2025; SSA IRMAA page) ---------- */
  var PARTB = 202.90, PDBASE = 38.99;
  var IRMAA = [ /* upper MAGI (individual), upper MAGI (joint), Part B add-on, Part D add-on; last row open-ended */
    [109000, 218000, 0, 0], [137000, 274000, 81.20, 14.50], [171000, 342000, 202.90, 37.50], [205000, 410000, 324.60, 60.40],
    [500000, 750000, 446.30, 83.30], [Infinity, Infinity, 487.00, 91.00]];
  function irmaa(magi, status) {
    if (status === "mfs") { if (magi <= 109000) return { b: 0, d: 0, tier: 0 }; if (magi < 391000) return { b: 446.30, d: 83.30, tier: 4 }; return { b: 487.00, d: 91.00, tier: 5 }; }
    var j = status === "joint";
    for (var i = 0; i < IRMAA.length; i++) {
      var lim = j ? IRMAA[i][1] : IRMAA[i][0];
      /* the top two rows use "less than" and "equal to or above" */
      if (i === 4 ? magi < lim : magi <= lim) return { b: IRMAA[i][2], d: IRMAA[i][3], tier: i };
    }
    return { b: 487.00, d: 91.00, tier: 5 };
  }
  function round10c(v) { return Math.round(v * 10) / 10; }

  INV.s11a = { fixedReal: fixedReal, windowRets: windowRets, safeMax: safeMax, strategies: strategies, monteCarlo: monteCarlo, mulberry32: mulberry32,
    survive: survive, LM: LM, LF: LF, EM: EM, EF: EF, fra: fra, survFra: survFra, ownFactor: ownFactor, spouseFactor: spouseFactor, survFactor: survFactor,
    pia2026: pia2026, ssTaxable: ssTaxable, irmaa: irmaa, realMix: realMix, PARTB: PARTB, PDBASE: PDBASE, fmtAge: fmtAge };

  /* =====================================================================
     1. Retirement-needs calculator (INV-075)
     ===================================================================== */
  TOOLS.s11aNeeds = function (el) {
    var u = uid(el), st = { mode: "ratio" };
    shell(el, "How much will you need? A retirement-needs calculator", "Calculator",
      segf("Estimate spending from", "mode", [["ratio", "Replacement ratio"], ["budget", "A spending budget"]], "ratio") +
      '<div data-m="ratio">' + numf(u + "-inc", "Current gross household income ($)", 260000, 1000) + rng(u + "-rr", "Replacement ratio", 40, 100, 1, 75, "pct") + "</div>" +
      '<div data-m="budget" hidden>' + numf(u + "-sp", "Yearly spending in retirement, today's dollars ($)", 125000, 1000) +
      numf(u + "-tax", "Plus income tax on retirement income ($ per year)", 12000, 500, "A ratio of gross pay already includes taxes, so this field applies to budgets only.") + "</div>" +
      numf(u + "-gi", "Social Security and pensions per year, today's dollars ($)", 76000, 1000, "Use your SSA statement estimates at your planned claiming ages.") +
      rng(u + "-wr", "Withdrawal rate the plan assumes", 3, 5, 0.1, 4, "pct") +
      numf(u + "-sav", "Retirement savings today ($)", 1100000, 1000) + numf(u + "-con", "Added each year until retirement ($)", 45000, 1000) +
      rng(u + "-yrs", "Years until retirement", 0, 40, 1, 6, "yr") + rng(u + "-ret", "Real return before retirement (after inflation)", 0, 7, 0.5, 4, "pct") +
      hintp("Everything is in today's dollars. Nest egg needed = (spending + tax − guaranteed income) ÷ withdrawal rate. Savings grow at the real return with contributions at each year-end."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      el.querySelectorAll("[data-m]").forEach(function (d) { d.hidden = d.getAttribute("data-m") !== st.mode; });
      var spend = st.mode === "ratio" ? num(el, "inc") * Number(self(el, "rr").value) / 100 : num(el, "sp");
      var gi = num(el, "gi"), tax = st.mode === "budget" ? num(el, "tax") : 0, wr = Number(self(el, "wr").value) / 100, sav = num(el, "sav"), con = num(el, "con"),
        n = Number(self(el, "yrs").value), r = Number(self(el, "ret").value) / 100;
      var gap = Math.max(0, spend + tax - gi), need = gap / wr, b = sav, pts = [[0, sav]], tgt = [[0, need]];
      for (var y = 1; y <= n; y++) { b = b * (1 + r) + con; pts.push([y, b]); tgt.push([y, need]); }
      if (n === 0) { pts.push([1, sav]); tgt.push([1, need]); }
      var funded = need > 0 ? b / need * 100 : 100;
      self(el, "k").innerHTML = kpi("Spending need / yr", money(spend + tax)) + kpi("Guaranteed income covers", pct(spend + tax > 0 ? Math.min(100, gi / (spend + tax) * 100) : 100, 0)) +
        kpi("Gap from savings / yr", money(gap), gap > 0 ? "" : "good") + kpi("Nest egg needed", money(need)) + kpi("Projected savings", money(b), b >= need ? "good" : "bad") +
        kpi("Funded", pct(Math.min(funded, 999), 0), funded >= 100 ? "good" : "bad");
      INV.lineChart(self(el, "c"), { label: "Projected savings versus the target", height: 250, xTitle: "Years from now", xFmt: yearFmt, yFmt: ms,
        series: [{ name: "Projected savings (today's dollars)", color: "var(--s1)", data: pts, area: true }, { name: "Nest egg needed", color: "var(--s5)", data: tgt, dash: "5 4" }] });
      self(el, "n").innerHTML = "Multiple used: 1 ÷ " + pct(wr * 100, 1) + " = <b>" + (1 / wr).toFixed(1) + "×</b> the yearly gap. " +
        (gap === 0 ? "Guaranteed income covers the whole budget, so the portfolio is a reserve, not an income source." :
          b >= need ? "On these assumptions the plan is on track, with " + money(b - need) + " to spare." : "On these assumptions the shortfall is " + money(need - b) + ": save more, work longer, spend less, or claim Social Security later.");
    }
    segWire(el, st, run); wire(el, run);
  };

  /* =====================================================================
     2. Longevity (INV-075)
     ===================================================================== */
  TOOLS.s11aLongevity = function (el) {
    var u = uid(el), st = { who: "couple" };
    shell(el, "How long might retirement last?", "SSA life table",
      segf("Plan for", "who", [["single", "One person"], ["couple", "A couple"]], "couple") +
      selectf(u + "-s1", "Person 1", [["f", "Female"], ["m", "Male"]], "m") + rng(u + "-a1", "Person 1's age now", 40, 95, 1, 65, "age") +
      '<div data-p2>' + selectf(u + "-s2", "Person 2", [["f", "Female"], ["m", "Male"]], "f") + rng(u + "-a2", "Person 2's age now", 40, 95, 1, 65, "age") + "</div>" +
      hintp("SSA 2023 period life table, as used in the 2026 Trustees Report. For a couple, the two lives are treated as independent, a simplification."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var cpl = st.who === "couple"; el.querySelector("[data-p2]").hidden = !cpl;
      var s1 = self(el, "s1").value, a1 = Number(self(el, "a1").value), s2 = self(el, "s2").value, a2 = Number(self(el, "a2").value);
      var p1 = [], p2 = [], p3 = [], plan = null, plan1 = null;
      /* run until both people would be past 110, so a much younger spouse is not cut off at person 1's age 110 */
      var tMax = cpl ? Math.max(110 - a1, 110 - a2) : 110 - a1;
      for (var t = 0; t <= tMax; t++) {
        var q1 = survive(s1, a1, Math.min(119, a1 + t)), q2 = cpl ? survive(s2, a2, Math.min(119, a2 + t)) : 0, e = cpl ? 1 - (1 - q1) * (1 - q2) : q1;
        p1.push([a1 + t, q1 * 100]); if (cpl) { p2.push([a1 + t, q2 * 100]); p3.push([a1 + t, e * 100]); }
        if (plan1 === null && q1 < 0.25) plan1 = t; if (plan === null && e < 0.25) plan = t;
      }
      var e1 = (s1 === "m" ? EM : EF)[a1], to90 = survive(s1, a1, Math.max(90, a1)), last90 = cpl ? 1 - (1 - to90) * (1 - survive(s2, a2, Math.max(a2, a2 + 90 - a1))) : to90;
      var hz = cpl ? (plan === null ? tMax : plan) : (plan1 === null ? tMax : plan1);
      self(el, "k").innerHTML = kpi("Person 1 life expectancy", "to " + (a1 + e1).toFixed(1)) + kpi("Person 1 reaches 90", pct(to90 * 100, 0)) +
        (cpl ? kpi("Either alive when person 1 would be 90", pct(last90 * 100, 0), "good") : "") +
        (cpl && a2 !== a1 ? kpi("Plan horizon (25% chance of outliving it)", hz + " years") : kpi("Plan to age (25% chance of outliving it)", String(a1 + hz)));
      var ser = [{ name: "Person 1 alive", color: "var(--s1)", data: p1 }];
      if (cpl) { ser.push({ name: "Person 2 alive", color: "var(--s3)", data: p2 }); ser.push({ name: "At least one alive", color: "var(--s2)", data: p3, width: 3.2 }); }
      INV.lineChart(self(el, "c"), { label: "Chance of being alive at each age", height: 250, xTitle: "Person 1's age", yTitle: "Chance alive (%)", xFmt: yearFmt, yMin: 0, yMax: 100, yFmt: pctFmt, tipFmt: function (v) { return pct(v, 0); }, series: ser });
      function ageTxt(x) { return x > 110 ? "past 110" : String(x); }
      self(el, "n").innerHTML = (cpl && a2 !== a1 ? "A " + hz + "-year plan runs to person 1's age " + ageTxt(a1 + hz) + " and person 2's age " + ageTxt(a2 + hz) + ". " : "") + "Life expectancy is only the average: about half of people outlive it. A plan that ends at life expectancy fails about half the time, so planners usually pick an age with a 10–25% chance of still being alive. Period tables use one year's death rates and do not assume future improvement, so they tend to understate how long today's retirees will live.";
    }
    segWire(el, st, run); wire(el, run);
  };

  /* =====================================================================
     3. Fixed-real withdrawal backtest (INV-076)
     ===================================================================== */
  TOOLS.s11aBacktest = function (el) {
    var u = uid(el), h = hist();
    shell(el, "Every retirement since 1928: the fixed real withdrawal", "Historical data",
      rng(u + "-wr", "First-year withdrawal rate", 2, 8, 0.1, 4, "pct") + rng(u + "-s", "Mix", 0, 100, 5, 60, "stk") +
      rng(u + "-len", "Retirement length", 15, 40, 1, 30, "yr") + numf(u + "-b", "Starting balance ($)", 1000000, 10000) +
      hintp("Withdraw the first-year amount at the start of each year, raise it by inflation every year, and never cut it. Stocks are the S&amp;P 500 with dividends; bonds are 10-year Treasuries; rebalanced yearly; no fees or taxes. Balances are in start-year dollars."),
      '<div class="kpis" id="' + u + '-k"></div><div class="fig-title" style="margin-top:6px">Highest rate that would have lasted, by first year of retirement</div><div id="' + u + '-c"></div>' +
      '<div class="fig-title" style="margin-top:10px">Ending balance after inflation, by first year of retirement</div><div id="' + u + '-e"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var wr = Number(self(el, "wr").value) / 100, s = Number(self(el, "s").value) / 100, n = Number(self(el, "len").value), B0 = num(el, "b");
      var res = [];
      for (var y = h.first; y + n - 1 <= h.last; y++) { var rr = windowRets(y, n, s); var f = fixedReal(rr, wr); res.push({ y: y, f: f, sm: safeMax(rr) }); }
      var okN = res.filter(function (x) { return x.f.ok; }).length;
      var worst = res.reduce(function (a, b) { var ka = a.f.ok ? a.f.end : a.f.lasted - 1000, kb = b.f.ok ? b.f.end : b.f.lasted - 1000; return kb < ka ? b : a; });
      var ends = res.map(function (x) { return x.f.end; }).sort(function (a, b) { return a - b; }), med = ends.length % 2 ? ends[(ends.length - 1) / 2] : (ends[ends.length / 2 - 1] + ends[ends.length / 2]) / 2;
      var minSm = res.reduce(function (a, b) { return b.sm < a.sm ? b : a; });
      self(el, "k").innerHTML = kpi("Retirements tested", String(res.length)) + kpi("Money lasted", pct(okN / res.length * 100, 0), okN === res.length ? "good" : okN / res.length < 0.9 ? "bad" : "") +
        kpi("Worst start", worst.y + (worst.f.ok ? "" : " (ran out in year " + (worst.f.lasted + 1) + ")"), worst.f.ok ? "" : "bad") + kpi("Median ending balance", money(med * B0)) +
        kpi("Highest rate that never failed", pct(minSm.sm * 100, 2) + " (" + minSm.y + ")");
      INV.barChart(self(el, "c"), { label: "Maximum sustainable withdrawal rate by start year", height: 230, maxLabels: 12, yFmt: function (v) { return v + "%"; }, tipFmt: function (v) { return "lasted at up to " + pct(v, 2); },
        data: res.map(function (x) { return { label: String(x.y), tip: "Retire in " + x.y, y: x.sm * 100, color: x.sm < wr ? "var(--s5)" : "var(--s2)" }; }) });
      INV.barChart(self(el, "e"), { label: "Ending real balance by start year", height: 210, maxLabels: 12, yFmt: ms, tipFmt: function (v) { return v > 0 ? money(v) + " in start-year dollars" : "ran out"; },
        data: res.map(function (x) { return { label: String(x.y), tip: "Retire in " + x.y + (x.f.ok ? "" : " — ran out in year " + (x.f.lasted + 1)), y: x.f.end * B0, color: x.f.ok ? "var(--s1)" : "var(--s5)" }; }) });
      self(el, "n").innerHTML = "At " + pct(wr * 100, 1) + " with this mix, the money lasted " + n + " years in <b>" + okN + " of " + res.length + "</b> historical retirements (first years " + h.first + "–" + (h.last - n + 1) + "). Red bars in the first chart are start years whose maximum sustainable rate was below your rate. " +
        "Starting withdrawal: " + money(wr * B0) + " a year, then raised with inflation.";
    }
    wire(el, run);
  };

  /* =====================================================================
     4. Four spending rules on one historical retirement (INV-076)
     ===================================================================== */
  TOOLS.s11aStrategies = function (el) {
    var u = uid(el), h = hist();
    shell(el, "Four spending rules, one retirement", "Historical data",
      rng(u + "-y", "First year of retirement", h.first, h.last - 29, 1, 1966, "year") + rng(u + "-wr", "Starting withdrawal rate", 3, 6, 0.1, 5, "pct") +
      rng(u + "-s", "Mix", 20, 100, 5, 60, "stk") + numf(u + "-b", "Starting balance ($)", 1000000, 10000) +
      hintp("Thirty years, in start-year dollars. Fixed real: the 4% rule's method. Guardrails: a simplified Guyton–Klinger rule set. Amortization: a VPW-style payment that would use up the balance over the remaining years at a 3% real return. Constant %: the starting rate times each year's balance."),
      '<div class="kpis" id="' + u + '-k"></div><div class="fig-title">Spending each year, after inflation</div><div id="' + u + '-c"></div><div class="fig-title" style="margin-top:10px">Portfolio balance, after inflation</div><div id="' + u + '-d"></div><div class="tbl-wrap" id="' + u + '-t"></div>');
    function run() {
      var y0 = Number(self(el, "y").value), wr = Number(self(el, "wr").value) / 100, s = Number(self(el, "s").value) / 100, B0 = num(el, "b");
      var r = strategies(y0, wr, s, 30), keys = [["fixed", "Fixed real", "var(--s5)"], ["guard", "Guardrails", "var(--s1)"], ["vpw", "Amortization (VPW-style)", "var(--s2)"], ["pct", "Constant %", "var(--s3)"]];
      var k = "";
      keys.forEach(function (q) { var sp = r[q[0]].spend, lo = Math.min.apply(null, sp); k += kpi("Lowest year: " + q[1], money(lo * B0, 0), lo < sp[0] * 0.75 ? "bad" : ""); });
      self(el, "k").innerHTML = k;
      function ser(fn) { return keys.map(function (q) { return { name: q[1], color: q[2], data: fn(r[q[0]]).map(function (v, i) { return [y0 + i, v * B0]; }) }; }); }
      INV.lineChart(self(el, "c"), { label: "Real spending by rule", height: 240, xFmt: yearFmt, yFmt: ms, zeroBase: true, series: ser(function (x) { return x.spend; }) });
      INV.lineChart(self(el, "d"), { label: "Real balance by rule", height: 220, xFmt: yearFmt, yFmt: ms, series: ser(function (x) { return x.bal; }) });
      self(el, "t").innerHTML = '<table class="tbl"><thead><tr><th>Rule</th><th class="r">First year</th><th class="r">Lowest year</th><th class="r">Total spent, 30 years</th><th class="r">Balance left</th></tr></thead><tbody>' +
        keys.map(function (q) { var x = r[q[0]], tot = x.spend.reduce(function (a, b) { return a + b; }, 0); return "<tr><td>" + q[1] + '</td><td class="r">' + money(x.spend[0] * B0, 0) + '</td><td class="r">' + money(Math.min.apply(null, x.spend) * B0, 0) + '</td><td class="r">' + money(tot * B0, 0) + '</td><td class="r">' + money(x.bal[x.bal.length - 1] * B0, 0) + "</td></tr>"; }).join("") +
        '</tbody></table><p class="tool-note" style="padding:0 12px 10px">Guardrails made ' + r.cuts + " cut" + (r.cuts === 1 ? "" : "s") + " and " + r.raises + " raise" + (r.raises === 1 ? "" : "s") + " of 10% in this retirement. A fixed real withdrawal that runs out shows as zero spending once the money is gone.</p>";
    }
    wire(el, run);
  };

  /* =====================================================================
     5. Same returns, different order (INV-077)
     ===================================================================== */
  TOOLS.s11aOrder = function (el) {
    var u = uid(el), h = hist();
    shell(el, "Same returns, different order", "Historical data",
      rng(u + "-y", "First year of retirement", h.first, h.last - 29, 1, 1966, "year") + rng(u + "-wr", "Withdrawal rate (fixed real)", 0, 7, 0.1, 4, "pct") +
      rng(u + "-s", "Mix", 0, 100, 5, 60, "stk") + numf(u + "-b", "Starting balance ($)", 1000000, 10000) +
      hintp("The same 30 yearly real returns, applied in the order they happened and in reverse. With no withdrawals the two end at exactly the same value; with withdrawals they do not."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var y0 = Number(self(el, "y").value), wr = Number(self(el, "wr").value) / 100, s = Number(self(el, "s").value) / 100, B0 = num(el, "b");
      var rr = windowRets(y0, 30, s), rv = rr.slice().reverse(), a = fixedReal(rr, wr), b = fixedReal(rv, wr);
      var avg = rr.reduce(function (x, y) { return x + y; }, 0) / 30, g = Math.pow(rr.reduce(function (x, y) { return x * (1 + y / 100); }, 1), 1 / 30) - 1;
      self(el, "k").innerHTML = kpi("Average real return (both)", pct(avg, 2)) + kpi("Compound real return (both)", pct(g * 100, 2)) +
        kpi("As it happened: end", a.ok ? money(a.end * B0) : "ran out, year " + (a.lasted + 1), a.ok ? "" : "bad") + kpi("Reversed: end", b.ok ? money(b.end * B0) : "ran out, year " + (b.lasted + 1), b.ok ? "" : "bad");
      INV.lineChart(self(el, "c"), { label: "Balance with the same returns in two orders", height: 250, xTitle: "Years into retirement", xFmt: yearFmt, yFmt: ms,
        series: [{ name: "As it happened, from " + y0, color: "var(--s5)", data: a.path.map(function (v, i) { return [i, v * B0]; }) }, { name: "Same returns, reversed", color: "var(--s2)", data: b.path.map(function (v, i) { return [i, v * B0]; }) }] });
      self(el, "n").innerHTML = "Real returns " + y0 + "–" + (y0 + 29) + " for this mix. The first ten years as they happened compounded at " + pct((Math.pow(rr.slice(0, 10).reduce(function (x, y) { return x * (1 + y / 100); }, 1), 0.1) - 1) * 100, 1) +
        " a year after inflation; reversed, the first ten years compounded at " + pct((Math.pow(rv.slice(0, 10).reduce(function (x, y) { return x * (1 + y / 100); }, 1), 0.1) - 1) * 100, 1) + ". Withdrawals taken while the balance is down are what make the order matter.";
    }
    wire(el, run);
  };

  /* =====================================================================
     6. Monte Carlo with bootstrapped history (INV-077)
     ===================================================================== */
  TOOLS.s11aMonteCarlo = function (el) {
    var u = uid(el), st = { m: "boot" };
    shell(el, "Monte Carlo: thousands of possible retirements", "Simulation",
      numf(u + "-b", "Starting balance ($)", 1000000, 10000) + numf(u + "-w", "Spending per year, today's dollars ($)", 40000, 1000) +
      rng(u + "-s", "Mix", 0, 100, 5, 60, "stk") + rng(u + "-yrs", "Years", 10, 45, 1, 30, "yr") +
      selectf(u + "-sims", "Number of simulated retirements", [["500", "500"], ["1000", "1,000"], ["2000", "2,000"], ["5000", "5,000"]], "1000") +
      numf(u + "-seed", "Random seed (same seed, same results)", 2026, 1) +
      segf("Draw each year's return from", "m", [["boot", "A random historical year"], ["normal", "A bell curve"]], "boot") +
      hintp("Bootstrap: each simulated year copies one calendar year from 1928–2025 at random (stocks, bonds and inflation from the same year). Bell curve: a normal distribution with the same average and spread. Spending is fixed in real terms."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var o = { bal: num(el, "b"), spend: num(el, "w"), s: Number(self(el, "s").value) / 100, years: Number(self(el, "yrs").value), sims: Number(self(el, "sims").value) || 1000, seed: Math.floor(num(el, "seed")), method: st.m };
      var r = monteCarlo(o);
      self(el, "k").innerHTML = kpi("Money lasted", pct(r.success * 100, 1), r.success >= 0.9 ? "good" : r.success < 0.75 ? "bad" : "") + kpi("Median ending balance", money(r.p50)) +
        kpi("10th percentile ending", money(r.p10), r.p10 <= 0 ? "bad" : "") + kpi("90th percentile ending", money(r.p90), "good") + kpi("Initial withdrawal rate", pct(o.bal > 0 ? o.spend / o.bal * 100 : 0, 1));
      var B = r.bands;
      INV.lineChart(self(el, "c"), { label: "Percentile bands of the balance", height: 260, xTitle: "Years into retirement", xFmt: yearFmt, yFmt: ms, tipFmt: money,
        series: [{ name: "90th percentile", color: "var(--s2)", data: B[0.9], dash: "4 3", width: 1.6 }, { name: "75th", color: "var(--s2)", data: B[0.75], width: 1.8 },
          { name: "Median", color: "var(--s1)", data: B[0.5], width: 3.2 }, { name: "25th", color: "var(--s3)", data: B[0.25], width: 1.8 }, { name: "10th percentile", color: "var(--s5)", data: B[0.1], dash: "4 3", width: 1.6 }] });
      self(el, "n").innerHTML = o.sims.toLocaleString() + " simulated retirements, seed " + o.seed + ". " + (r.fails ? r.fails.toLocaleString() + " ran out of money" + (r.medDepl ? ", typically in year " + Math.round(r.medDepl) : "") + ". " : "None ran out. ") +
        "Each line shows the balance that a given share of simulations stayed above; the 10th-percentile line means 90% did better. The mix's real return averaged " + pct(r.mean, 2) + " a year with a standard deviation of " + pct(r.sd, 1) + " in 1928–2025.";
    }
    segWire(el, st, run); wire(el, run);
  };

  /* =====================================================================
     7. AIME to PIA, 2026 formula (INV-078)
     ===================================================================== */
  TOOLS.s11aPIA = function (el) {
    var u = uid(el);
    shell(el, "From average earnings to your benefit (2026 formula)", "Calculator",
      numf(u + "-a", "Average indexed monthly earnings, AIME ($)", 6000, 50, "Highest 35 years of wage-indexed earnings ÷ 420 months.") +
      hintp("For workers first eligible (turning 62) in 2026: 90% of the first $1,286 of AIME, 32% of AIME from $1,286 to $7,749, and 15% above $7,749, rounded down to the next lower dime. Later cost-of-living adjustments are added on top."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var a = num(el, "a"), p = pia2026(a);
      self(el, "k").innerHTML = kpi("90% slice", money(p.p1, 2)) + kpi("32% slice", money(p.p2, 2)) + kpi("15% slice", money(p.p3, 2)) + kpi("PIA (benefit at FRA)", money(p.pia, 2), "good") +
        kpi("PIA as % of AIME", pct(Math.floor(a) > 0 ? p.pia / Math.floor(a) * 100 : 90, 0));
      var line = [], rr = []; for (var x = 0; x <= 16000; x += 250) { var q = pia2026(x); line.push([x, q.pia]); rr.push([x, x > 0 ? q.pia / x * 100 : 90]); }
      INV.lineChart(self(el, "c"), { label: "PIA by AIME", height: 230, xTitle: "AIME ($ a month)", xFmt: ms, yFmt: ms, tipFmt: function (v) { return money(v, 0); },
        series: [{ name: "PIA", color: "var(--s1)", data: line }], marks: [{ x: 1286, label: "$1,286" }, { x: 7749, label: "$7,749" }], dots: [{ x: Math.min(a, 16000), y: pia2026(Math.min(a, 16000)).pia, color: "var(--s1)", label: money(p.pia, 0) }] });
      self(el, "n").innerHTML = "The formula is deliberately progressive: the first dollars of average earnings are replaced at 90%, later ones at 32% and then 15%. That is why Social Security replaces a larger share of a low earner's pay. An AIME of " + money(a, 0) + " gives a PIA of <b>" + money(p.pia, 2) + "</b> a month.";
    }
    wire(el, run);
  };

  /* =====================================================================
     8. Claiming calculator (INV-078) - consistent with Babak's SS Family Planner methods
     ===================================================================== */
  TOOLS.s11aClaim = function (el) {
    var u = uid(el), st = { hh: "married" };
    shell(el, "When to claim: a Social Security claiming calculator", "Calculator",
      rng(u + "-by", "Your year of birth", 1943, 2005, 1, 1969, "by") + numf(u + "-pia", "Your PIA: benefit at full retirement age ($ a month)", 3800, 10) +
      rng(u + "-ca", "You claim at age", 62, 70, 1, 67, "age") + rng(u + "-cm", "plus months", 0, 11, 1, 0, "mo") +
      segf("Household", "hh", [["single", "Single"], ["married", "Married"]], "married") +
      '<div data-sp>' + rng(u + "-sby", "Spouse's year of birth", 1943, 2005, 1, 1971, "by") + numf(u + "-spia", "Spouse's own PIA ($ a month)", 2500, 10) +
      rng(u + "-sca", "Spouse claims at age", 62, 70, 1, 67, "age") + "</div>" +
      hintp("Today's dollars, before cost-of-living adjustments, taxes and Medicare premiums. Early claiming: −5/9 of 1% a month for 36 months, −5/12 of 1% after. Delayed credits: +2/3 of 1% a month to 70. Spousal: up to 50% of your PIA, paid as a top-up over the spouse's own benefit. Survivor: your benefit, but at least 82.5% of your PIA if you claimed early."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function ben(pia, age, F) { return pia * ownFactor(age, F); }
    function run() {
      var by = Number(self(el, "by").value), pia = num(el, "pia"), ca = Number(self(el, "ca").value), cm = Number(self(el, "cm").value);
      if (ca === 70 && cm > 0) { cm = 0; self(el, "cm").value = 0; fmtOut(self(el, "cm")); }
      var age = ca + cm / 12, F = fra(by), b = ben(pia, age, F), b62 = ben(pia, 62, F), bF = pia, b70 = ben(pia, 70, F), mar = st.hh === "married";
      el.querySelector("[data-sp]").hidden = !mar;
      /* break-even with claiming at 62 (or with FRA if claiming at 62) */
      var be = null, beLbl;
      if (age > 62.0001 && b > b62) { be = (b * age - b62 * 62) / (b - b62); beLbl = "Break-even vs claiming at 62"; }
      else { be = bF > b ? (bF * F - b * age) / (bF - b) : null; beLbl = "Break-even vs claiming at FRA"; }
      var k = kpi("Your full retirement age", fmtAge(F)) + kpi("Your monthly benefit", money(b)) + kpi("Share of your PIA", pct(pia > 0 ? b / pia * 100 : ownFactor(age, F) * 100, 1)) +
        kpi(beLbl, be ? "age " + be.toFixed(1) : "none");
      var note = "";
      if (mar) {
        var sby = Number(self(el, "sby").value), spia = num(el, "spia"), sca = Number(self(el, "sca").value), SF = fra(sby), sOwn = spia * ownFactor(sca, SF);
        var workerAgeAtSpouseClaim = sca + (sby - by);
        var spStart = workerAgeAtSpouseClaim >= age ? sca : sca + (age - workerAgeAtSpouseClaim);
        var excess = Math.max(0, 0.5 * pia - spia) * spouseFactor(Math.min(spStart, SF), SF);
        var survBase = age < F ? Math.max(b, 0.825 * pia) : b, sSF = survFra(sby);
        k += kpi("Spouse's benefit (own + spousal)", money(sOwn + excess)) + kpi("Survivor gets, if you die first", money(Math.max(survBase, sOwn)), "good");
        note = "Spouse's full retirement age: " + fmtAge(SF) + "; survivor full retirement age: " + fmtAge(sSF) + ". " + (excess > 0 ? "The spousal top-up of " + money(excess) + " starts when both have claimed" + (spStart > sca + 0.001 ? " (at the spouse's age " + spStart.toFixed(1) + ")" : "") + ". " : "The spouse's own benefit is larger than half your PIA, so there is no spousal top-up. ") +
          "The survivor figure assumes the survivor claims at or after survivor full retirement age; claiming a survivor benefit at 60 pays 71.5% of it. ";
      }
      self(el, "k").innerHTML = k;
      function cum(c) { var bb = ben(pia, c, F), d = []; for (var a = 62; a <= 100; a++) d.push([a, a <= c ? 0 : bb * 12 * (a - c)]); return d; }
      var ser = [{ name: "Claim at 62", color: "var(--s5)", data: cum(62) }, { name: "Claim at FRA (" + fmtAge(F) + ")", color: "var(--s3)", data: cum(F) }, { name: "Claim at 70", color: "var(--s2)", data: cum(70) }];
      if (Math.abs(age - 62) > 0.01 && Math.abs(age - F) > 0.01 && Math.abs(age - 70) > 0.01) ser.push({ name: "Your choice (" + fmtAge(age) + ")", color: "var(--s1)", data: cum(age), width: 3.2 });
      INV.lineChart(self(el, "c"), { label: "Cumulative benefits by age", height: 250, xTitle: "Age", yTitle: "Total received, today's dollars", xFmt: yearFmt, yFmt: ms, tipFmt: money, series: ser });
      self(el, "n").innerHTML = "At 62 you would get " + money(b62) + " (" + pct(pia > 0 ? b62 / pia * 100 : ownFactor(62, F) * 100, 1) + " of PIA); at 70, " + money(b70) + " (" + pct(pia > 0 ? b70 / pia * 100 : ownFactor(70, F) * 100, 1) + "). " +
        "Break-even ignores interest, taxes and cost-of-living adjustments, and it only matters if you would otherwise spend the early checks. " + note +
        'For a full household plan with child benefits, the family maximum and taxes, use <a href="https://babakna.github.io/shared/SSFamily/" target="_blank" rel="noopener noreferrer">Babak\'s Social Security Family Planner</a>.';
    }
    segWire(el, st, run); wire(el, run);
  };

  /* =====================================================================
     9. Taxable Social Security (INV-078)
     ===================================================================== */
  TOOLS.s11aSSTax = function (el) {
    var u = uid(el), st = { fs: "single" };
    shell(el, "How much of your Social Security is taxable?", "Calculator",
      segf("Filing status", "fs", [["single", "Single / head of household"], ["joint", "Married filing jointly"]], "single") +
      numf(u + "-ss", "Social Security benefits for the year ($)", 34800, 100) + numf(u + "-o", "Other income: pensions, IRA withdrawals, wages, taxable interest ($)", 30000, 500) +
      numf(u + "-x", "Tax-exempt interest ($)", 0, 100) +
      hintp("IRS Publication 915, Worksheet 1, with no adjustments to income. The $25,000 / $32,000 and $34,000 / $44,000 thresholds are set in law and are not indexed for inflation. Married filing separately and living together: up to 85% is taxable from the first dollar."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var j = st.fs === "joint", ss = num(el, "ss"), o = num(el, "o"), x = num(el, "x"), r = ssTaxable(ss, o, x, j);
      var share = ss > 0 ? r.tax / ss * 100 : 0;
      self(el, "k").innerHTML = kpi("Combined income", money(r.ci)) + kpi("Taxable benefits", money(r.tax)) + kpi("Share of benefits taxable", pct(share, 1), share >= 84.9 ? "bad" : "") +
        kpi("Tax-free benefits", money(ss - r.tax), "good");
      var pts = []; for (var v = 0; v <= 120000; v += 2000) pts.push([v, ss > 0 ? ssTaxable(ss, v, x, j).tax / ss * 100 : 0]);
      INV.lineChart(self(el, "c"), { label: "Taxable share by other income", height: 230, xTitle: "Other income ($)", yTitle: "Share of benefits taxable (%)", xFmt: ms, yMin: 0, yMax: 100, yFmt: pctFmt, tipFmt: function (v) { return pct(v, 1); },
        series: [{ name: "Taxable share", color: "var(--s1)", data: pts, area: true }], dots: [{ x: Math.min(o, 120000), y: share, color: "var(--s5)", label: pct(share, 0) }] });
      self(el, "n").innerHTML = "Combined income = other income + tax-exempt interest + half of benefits = " + money(r.ci) + ". Taxable benefits are added to your other income and taxed at your ordinary rates; the share taxable is never more than 85%. " +
        "Each extra dollar of IRA withdrawal in the phase-in range can make 50 or 85 cents of benefits taxable too.";
    }
    segWire(el, st, run); wire(el, run);
  };

  /* =====================================================================
     10. Medicare premiums and IRMAA, 2026 (INV-079)
     ===================================================================== */
  TOOLS.s11aMedicare = function (el) {
    var u = uid(el), st = { fs: "joint" };
    shell(el, "Medicare premiums in 2026, including IRMAA", "Calculator",
      segf("2024 tax filing status", "fs", [["single", "Individual"], ["joint", "Joint"], ["mfs", "Married, separate"]], "joint") +
      numf(u + "-m", "Modified AGI on your 2024 return ($)", 250000, 1000, "For 2026 premiums SSA generally uses the return filed in 2025 for tax year 2024.") +
      rng(u + "-p", "People on Medicare in the household", 1, 2, 1, 2) + numf(u + "-d", "Part D plan premium ($ a month, per person)", 40, 1) +
      rng(u + "-lb", "Full years Part B was delayed without coverage", 0, 10, 1, 0, "yr") + rng(u + "-ld", "Months without creditable drug coverage", 0, 60, 1, 0, "mo") +
      hintp("CMS 2026 amounts: standard Part B $202.90; Part B penalty 10% of the standard premium per full 12 months late; Part D penalty 1% of the $38.99 national base beneficiary premium per month, rounded to the nearest $0.10. Penalties shown apply to one person."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var fs = st.fs, m = num(el, "m"), n = Number(self(el, "p").value), dp = num(el, "d"), lb = Number(self(el, "lb").value), ld = Number(self(el, "ld").value);
      var ir = irmaa(m, fs), penB = round10c(PARTB * 0.1 * lb), penD = round10c(PDBASE * 0.01 * ld);
      var per = PARTB + ir.b + dp + ir.d, house = per * n + penB + penD;
      self(el, "k").innerHTML = kpi("Part B per person", money(PARTB + ir.b, 2), ir.b ? "bad" : "") + kpi("Part D IRMAA per person", money(ir.d, 2), ir.d ? "bad" : "") +
        kpi("Late penalties (one person)", money(penB + penD, 2), penB + penD ? "bad" : "") + kpi("Household per month", money(house, 2)) + kpi("Household per year", money(house * 12, 0));
      var data = [], labs = fs === "mfs" ? [["≤ $109k", 0], ["$109k–391k", 4], ["≥ $391k", 5]] :
        (fs === "joint" ? [["≤ $218k", 0], ["$218k–274k", 1], ["$274k–342k", 2], ["$342k–410k", 3], ["$410k–750k", 4], ["≥ $750k", 5]] : [["≤ $109k", 0], ["$109k–137k", 1], ["$137k–171k", 2], ["$171k–205k", 3], ["$205k–500k", 4], ["≥ $500k", 5]]);
      labs.forEach(function (L) { var row2 = IRMAA[L[1]]; data.push({ label: L[0], tip: "MAGI " + L[0], y: (PARTB + row2[2] + row2[3]) * 12, color: L[1] === ir.tier ? "var(--s1)" : "var(--s6)" }); });
      INV.barChart(self(el, "c"), { label: "Yearly Part B premium plus Part D IRMAA per person, by MAGI", height: 230, allLabels: true, valueLabels: true, xTitle: "Modified AGI two years earlier", yFmt: function (v) { return "$" + Math.round(v).toLocaleString(); }, data: data });
      self(el, "n").innerHTML = "Per person, the income-related amounts add " + money(ir.b * 12 + ir.d * 12, 0) + " a year at this income. The brackets are cliffs: one dollar over a threshold triggers the whole surcharge for that tier. " +
        "If your income has dropped because of a life-changing event such as retirement, you can ask SSA to use a more recent year (Form SSA-44).";
    }
    segWire(el, st, run); wire(el, run);
  };
})();
