/* Investing Learning Lab - Stage 5 (Taxes) calculators for INV-036 to INV-042 - V1.0 (September 2026)
   Every tool computes from its stated formula in the browser. Federal figures are for tax year 2026:
   Rev. Proc. 2025-32 (brackets, standard deduction, capital-gain thresholds, AMT), P.L. 119-21
   (senior deduction, SALT cap, charitable changes, 2/37 itemized limit), IRS Notice 2025-67 (QCD limit),
   IRS Publication 915 (Social Security worksheet), CMS 2026 Part B and Part D IRMAA tables,
   IRS Publication 590-B Uniform Lifetime Table. State figures cite each state revenue department or code. */
(function () {
  "use strict";
  var INV = window.INV; if (!INV || !INV.tools) return;
  var esc = INV.esc, money = INV.money, ms = INV.moneyShort, pct = INV.pct;
  var TOOLS = INV.tools;

  /* ---------- local copies of the helper style used in inv-tools.js ---------- */
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
  function sel(id, label, opts, val) {
    return '<div class="fld"><label for="' + id + '">' + esc(label) + '</label><select id="' + id + '">' + opts.map(function (o) {
      return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(val) ? " selected" : "") + ">" + esc(o[1]) + "</option>";
    }).join("") + "</select></div>";
  }
  function note(t) { return '<p class="hint" style="font-size:.76rem;color:var(--muted)">' + t + "</p>"; }
  function self(el, id) { return el.querySelector("#" + el.dataset.uid + "-" + id); }
  function uid(el) { if (!el.dataset.uid) el.dataset.uid = "t" + Math.random().toString(36).slice(2, 8); return el.dataset.uid; }
  function fmtOut(input) {
    var o = input.parentNode.querySelector("output"); if (!o) return;
    var f = input.getAttribute("data-fmt"), v = Number(input.value);
    o.textContent = f === "pct" ? v.toFixed(input.step.indexOf(".") > -1 ? (input.step.split(".")[1].length) : 0) + "%" :
      f === "yr" ? v + (v === 1 ? " year" : " years") : f === "money" ? money(v) : f === "age" ? "age " + v :
      f === "stk" ? v + "% stocks / " + (100 - v) + "% bonds" : f === "day" ? (v === 0 ? "same day" : (v > 0 ? v + " days after" : (-v) + " days before")) : String(v);
  }
  function wire(el, fn) {
    el.querySelectorAll("input,select").forEach(function (i) {
      i.addEventListener("input", function () { if (i.type === "range") fmtOut(i); fn(); });
      if (i.tagName === "SELECT") i.addEventListener("change", fn);
      if (i.type === "range") fmtOut(i);
    });
    fn();
    document.addEventListener("inv-theme", fn);
  }
  function kpi(k, v, cls) { return '<div class="kpi"><div class="k">' + esc(k) + '</div><div class="v ' + (cls || "") + '">' + v + "</div></div>"; }
  function num(el, id) { var n = self(el, id); if (!n) return 0; var v = Number(n.value); return isFinite(v) && v > 0 ? v : 0; }
  function setv(el, id, v) { var n = self(el, id); if (n) { n.value = v; if (n.type === "range") fmtOut(n); } }
  function yearFmt(v) { return String(Math.round(v)); }
  function p1(v) { return pct(v, 1); }
  function dot(x, y, label, color, x0, x1) { var right = x1 > x0 && (x - x0) / (x1 - x0) > 0.55; return { x: x, y: y, label: label, color: color, anchor: right ? "end" : "start", dx: right ? -8 : 8 }; }

  /* =====================================================================
     2026 FEDERAL TAX ENGINE (single, married filing jointly, head of household)
     ===================================================================== */
  var TX = {
    brk: {
      single: [[12400, 0.10], [50400, 0.12], [105700, 0.22], [201775, 0.24], [256225, 0.32], [640600, 0.35], [Infinity, 0.37]],
      mfj: [[24800, 0.10], [100800, 0.12], [211400, 0.22], [403550, 0.24], [512450, 0.32], [768700, 0.35], [Infinity, 0.37]],
      hoh: [[17700, 0.10], [67450, 0.12], [105700, 0.22], [201750, 0.24], [256200, 0.32], [640600, 0.35], [Infinity, 0.37]]
    },
    std: { single: 16100, mfj: 32200, hoh: 24150 },
    add65: { single: 2050, mfj: 1650, hoh: 2050 },
    cg0: { single: 49450, mfj: 98900, hoh: 66200 },
    cg15: { single: 545500, mfj: 613700, hoh: 579600 },
    niit: { single: 200000, mfj: 250000, hoh: 200000 },
    ssBase: { single: 25000, mfj: 32000, hoh: 25000 },
    ssStep: { single: 9000, mfj: 12000, hoh: 9000 },
    senior: 6000, seniorPh: { single: 75000, mfj: 150000, hoh: 75000 },
    nonItem: { single: 1000, mfj: 2000, hoh: 1000 },
    salt: 40400, saltPh: 505000,
    amtEx: { single: 90100, mfj: 140200, hoh: 90100 }, amtPh: { single: 500000, mfj: 1000000, hoh: 500000 }, amt28: 244500
  };
  /* IRS Publication 590-B, Appendix B, Table III (Uniform Lifetime) */
  var ULT = { 72: 27.4, 73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1, 80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0, 86: 15.2, 87: 14.4, 88: 13.7, 89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1, 94: 9.5, 95: 8.9, 96: 8.4 };
  function ordTax(ti, fs) {
    var b = TX.brk[fs], t = 0, lo = 0;
    for (var i = 0; i < b.length; i++) { var hi = b[i][0]; if (ti > lo) t += (Math.min(ti, hi) - lo) * b[i][1]; lo = hi; }
    return t;
  }
  function bracketTop(fs, rate) { var b = TX.brk[fs]; for (var i = 0; i < b.length; i++) if (Math.abs(b[i][1] - rate) < 1e-9) return b[i][0]; return Infinity; }
  function taxableSS(ss, other, fs) {
    /* IRS Publication 915, Worksheet 1: 'other' = all other income in AGI plus tax-exempt interest */
    if (ss <= 0) return 0;
    var l8 = other + 0.5 * ss, base = TX.ssBase[fs];
    if (l8 <= base) return 0;
    var l10 = l8 - base, l11 = TX.ssStep[fs], l12 = Math.max(0, l10 - l11), l13 = Math.min(l10, l11);
    var l15 = Math.min(0.5 * ss, 0.5 * l13), l17 = l15 + 0.85 * l12;
    return Math.min(l17, 0.85 * ss);
  }
  /* p: fs, ord (wages, pensions, IRA withdrawals, conversions, interest, short-term gains), qd (qualified dividends
     and net long-term gains), ss (gross Social Security), exempt (tax-exempt interest), n65, year,
     salt, mort (mortgage interest), cash (cash gifts to public charities), prop (appreciated-stock gifts at value),
     daf (true if the gifts go to a donor-advised fund), itemize ('auto' | 'no') */
  function fed(p) {
    var fs = p.fs || "single", ord = p.ord || 0, qd = p.qd || 0, ss = p.ss || 0, n65 = p.n65 || 0, year = p.year || 2026;
    var tss = taxableSS(ss, ord + qd + (p.exempt || 0), fs);
    var agi = ord + qd + tss;
    var stdd = TX.std[fs] + n65 * TX.add65[fs];
    /* itemized deductions under P.L. 119-21 */
    var saltCap = Math.max(10000, TX.salt - 0.3 * Math.max(0, agi - TX.saltPh));
    var gifts = (p.cash || 0) + (p.prop || 0);
    var cashAllowed = Math.min(p.cash || 0, 0.6 * agi), propAllowed = Math.min(p.prop || 0, 0.3 * agi, Math.max(0, 0.6 * agi - cashAllowed));
    var charity = Math.max(0, cashAllowed + propAllowed - 0.005 * agi);
    var item = Math.min(p.salt || 0, saltCap) + (p.mort || 0) + charity;
    var useItem = p.itemize !== "no" && item > stdd;
    var ded = useItem ? item : stdd;
    if (!useItem && !p.daf) ded += Math.min(p.cash || 0, TX.nonItem[fs]);
    var senior = year <= 2028 ? n65 * Math.max(0, TX.senior - 0.06 * Math.max(0, agi - TX.seniorPh[fs])) : 0;
    var ti0 = Math.max(0, agi - ded - senior);
    if (useItem) { /* section 68 as amended: reduce itemized deductions by 2/37 of the lesser of the deductions or the excess over the 37% bracket start */
      var top37 = bracketTop(fs, 0.35), exc = Math.max(0, ti0 + item - top37);
      var red = (2 / 37) * Math.min(item, exc); ded -= red; ti0 = Math.max(0, agi - ded - senior);
    }
    var ti = ti0, pref = Math.min(qd, ti), ordTI = ti - pref;
    var t0 = Math.max(0, Math.min(ti, TX.cg0[fs]) - ordTI), t15 = Math.max(0, Math.min(ti, TX.cg15[fs]) - Math.max(ordTI, TX.cg0[fs])), t20 = Math.max(0, ti - Math.max(ordTI, TX.cg15[fs]));
    var incomeTax = ordTax(ordTI, fs) + 0.15 * t15 + 0.20 * t20;
    var niit = 0.038 * Math.max(0, Math.min((p.nii != null ? p.nii : qd), agi - TX.niit[fs]));
    return { agi: agi, magi: agi + (p.exempt || 0), taxableSS: tss, ded: ded, senior: senior, itemized: useItem, ti: ti, ordTI: ordTI, cg0: t0, cg15: t15, cg20: t20,
      incomeTax: incomeTax, niit: niit, total: incomeTax + niit, gifts: gifts };
  }
  function margOrd(p, d) { d = d || 100; var a = fed(p).total, q = {}; for (var k in p) q[k] = p[k]; q.ord = (p.ord || 0) + d; return (fed(q).total - a) / d; }
  function solveUp(f, target, lo, hi) { /* largest x in [lo,hi] with f(x) <= target, f increasing */
    if (f(hi) <= target) return hi; if (f(lo) > target) return lo;
    for (var i = 0; i < 60; i++) { var m = (lo + hi) / 2; if (f(m) <= target) lo = m; else hi = m; }
    return lo;
  }
  /* CMS 2026 IRMAA: Part B total monthly premium and Part D monthly adjustment by MAGI tier */
  var IRM = { single: [109000, 137000, 171000, 205000, 500000], mfj: [218000, 274000, 342000, 410000, 750000],
    B: [202.90, 284.10, 405.80, 527.50, 649.20, 689.90], D: [0, 14.50, 37.50, 60.40, 83.30, 91.00] };
  function irmaaTier(magi, fs) {
    var t = IRM[fs === "mfj" ? "mfj" : "single"];
    if (magi <= t[0]) return 0; if (magi <= t[1]) return 1; if (magi <= t[2]) return 2; if (magi <= t[3]) return 3; if (magi < t[4]) return 4; return 5;
  }
  function irmaaAnnual(magi, fs) { var k = irmaaTier(magi, fs); return 12 * (IRM.B[k] - IRM.B[0] + IRM.D[k]); }
  INV.tax2026 = { fed: fed, ordTax: ordTax, taxableSS: taxableSS, bracketTop: bracketTop, irmaaTier: irmaaTier, irmaaAnnual: irmaaAnnual, TX: TX, IRM: IRM, ULT: ULT };
  var FS3 = [["single", "Single"], ["mfj", "Married filing jointly"], ["hoh", "Head of household"]];

  /* =====================================================================
     1. Asset location (INV-036)
     ===================================================================== */
  function grow(asset, acct, X, n, a) {
    if (X <= 0) return 0;
    var g = asset === "s" ? a.rs : a.rb;
    if (acct === "trad") return X * Math.pow(1 + g, n) * (1 - a.tf);
    if (acct === "roth") return X * Math.pow(1 + g, n);
    if (asset === "b") return X * Math.pow(1 + a.rb * (1 - a.to), n);
    var V = X, B = X, pr = a.rs - a.dy; /* taxable stocks: dividends taxed yearly and reinvested, price growth taxed at the end */
    for (var t = 0; t < n; t++) { var div = V * a.dy, re = div * (1 - a.tc); V = V * (1 + pr) + re; B += re; }
    return a.liq ? V - a.tc * Math.max(0, V - B) : V;
  }
  function placements(T, D, R, s) {
    var S = (T + D + R) * s, Bd = (T + D + R) - S, out = {};
    /* A: bonds in tax-deferred first; stocks fill Roth, then taxable, then what is left of tax-deferred */
    var bD = Math.min(Bd, D), bRest = Bd - bD, sR = Math.min(S, R), sT = Math.min(S - sR, T), sD = S - sR - sT, bT = Math.min(bRest, T - sT), bR = bRest - bT;
    out.A = { T: [sT, bT], D: [sD, bD], R: [sR, bR] };
    /* B: stocks in tax-deferred first; bonds fill taxable, then Roth */
    var sD2 = Math.min(S, D), sRest = S - sD2, bD2 = D - sD2, bLeft = Bd - bD2, bT2 = Math.min(bLeft, T), bR2 = bLeft - bT2, sT2 = T - bT2, sR2 = R - bR2;
    out.B = { T: [sT2, bT2], D: [sD2, bD2], R: [sR2, bR2] };
    out.C = { T: [T * s, T * (1 - s)], D: [D * s, D * (1 - s)], R: [R * s, R * (1 - s)] };
    return out;
  }
  function afterTax(pl, n, a) { return grow("s", "tax", pl.T[0], n, a) + grow("b", "tax", pl.T[1], n, a) + grow("s", "trad", pl.D[0], n, a) + grow("b", "trad", pl.D[1], n, a) + grow("s", "roth", pl.R[0], n, a) + grow("b", "roth", pl.R[1], n, a); }
  INV.s5bLocation = { placements: placements, afterTax: afterTax };
  TOOLS.s5bLocation = function (el) {
    var u = uid(el);
    shell(el, "Asset location: the same portfolio, three ways to place it", "Calculator",
      numf(u + "-t", "Taxable account ($)", 220000, 5000) + numf(u + "-d", "Tax-deferred: 401(k), traditional IRA ($)", 820000, 5000) + numf(u + "-r", "Roth accounts ($)", 60000, 5000) +
      rng(u + "-s", "Overall mix", 0, 100, 5, 60, "stk") + rng(u + "-n", "Years until the money is used", 5, 40, 1, 20, "yr") +
      rng(u + "-rs", "Stock total return", 3, 11, 0.5, 7, "pct") + rng(u + "-dy", "  of which dividend yield", 0, 4, 0.25, 1.5, "pct") + rng(u + "-rb", "Bond interest yield", 1, 7, 0.25, 4.5, "pct") +
      rng(u + "-to", "Tax rate on interest now (ordinary)", 0, 45, 1, 24, "pct") + rng(u + "-tc", "Tax rate on dividends and gains", 0, 25, 1, 15, "pct") + rng(u + "-tf", "Tax rate on tax-deferred withdrawals later", 0, 45, 1, 22, "pct") +
      sel(u + "-liq", "At the end, the taxable account is", [["1", "Sold (gains taxed)"], ["0", "Kept or inherited (gains not taxed)"]], "1") +
      note("Defaults are the Harpers' balances. A: bonds in tax-deferred first, stocks in Roth then taxable. B: the reverse. C: the same mix in every account. Taxable bonds pay interest taxed every year; taxable stocks pay dividends taxed every year and gains taxed at the end. Illustrative, before fees and state tax."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var T = num(el, "t"), D = num(el, "d"), R = num(el, "r"), s = num(el, "s") / 100, n = Number(self(el, "n").value);
      var a = { rs: num(el, "rs") / 100, dy: Math.min(num(el, "dy"), num(el, "rs")) / 100, rb: num(el, "rb") / 100, to: num(el, "to") / 100, tc: num(el, "tc") / 100, tf: num(el, "tf") / 100, liq: self(el, "liq").value === "1" };
      var pl = placements(T, D, R, s), A = afterTax(pl.A, n, a), B = afterTax(pl.B, n, a), C = afterTax(pl.C, n, a);
      var best = Math.max(A, B, C), yrA = C > 0 ? (Math.pow(A / C, 1 / n) - 1) * 100 : 0;
      self(el, "k").innerHTML = kpi("A: bonds in tax-deferred", money(A), A === best ? "good" : "") + kpi("B: stocks in tax-deferred", money(B), B === best ? "good" : "") +
        kpi("C: same mix everywhere", money(C), C === best ? "good" : "") + kpi("A minus C", money(A - C), A >= C ? "good" : "bad") + kpi("A vs C, per year", (yrA >= 0 ? "+" : "") + yrA.toFixed(2) + "%");
      INV.barChart(self(el, "c"), { label: "After-tax wealth by placement", height: 220, allLabels: true, valueLabels: true, yFmt: ms, tipFmt: function (v) { return money(v); },
        data: [{ label: "A: bonds deferred", y: A, color: "var(--s2)" }, { label: "B: stocks deferred", y: B, color: "var(--s5)" }, { label: "C: same mix", y: C, color: "var(--s6)" }] });
      self(el, "n2").innerHTML = "Placement A holds " + money(pl.A.D[1]) + " of bonds in tax-deferred accounts, " + money(pl.A.R[0]) + " of stocks in Roth and " + money(pl.A.T[0]) + " of stocks in the taxable account. After " + n + " years and every tax, it is worth <b>" +
        money(A - C) + "</b> " + (A >= C ? "more" : "less") + " than holding the same mix everywhere, and " + money(A - B) + " " + (A >= B ? "more" : "less") + " than the reverse. Tax-deferred dollars are counted after the future tax: each $1 is worth about $" + (1 - a.tf).toFixed(2) + " to you.";
    }
    wire(el, run);
  };

  /* =====================================================================
     2. Tax-loss harvesting (INV-037)
     ===================================================================== */
  function netCap(st, lt) { /* returns net ST and net LT after cross-netting (Schedule D logic) */
    if (st < 0 && lt > 0) { var x = Math.min(-st, lt); st += x; lt -= x; } else if (lt < 0 && st > 0) { var y = Math.min(-lt, st); lt += y; st -= y; }
    return [st, lt];
  }
  INV.s5bNetCap = netCap;
  TOOLS.s5bLossHarvest = function (el) {
    var u = uid(el);
    shell(el, "What is a harvested loss worth?", "Calculator",
      numf(u + "-l", "Loss you harvest ($)", 20000, 500) + sel(u + "-lt", "The loss is", [["lt", "Long-term (held more than 1 year)"], ["st", "Short-term (1 year or less)"]], "lt") +
      numf(u + "-sg", "Other short-term gains this year ($)", 0, 500) + numf(u + "-lg", "Other long-term gains this year ($)", 5000, 500) +
      rng(u + "-or", "Your ordinary tax rate", 10, 37, 1, 22, "pct") + rng(u + "-cr", "Your long-term gains rate", 0, 23.8, 0.1, 15, "pct") +
      sel(u + "-mfs", "Filing status", [["0", "Any status except married filing separately"], ["1", "Married filing separately"]], "0") +
      note("Losses first offset gains of the same type, then the other type; up to $3,000 of any net loss ($1,500 if married filing separately) offsets ordinary income each year, and the rest carries forward with no time limit (IRC §1211, §1212; IRS Topic 409). The replacement investment's basis is lower, so part of the saving is a deferral."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var L = num(el, "l"), isLT = self(el, "lt").value === "lt", sg = num(el, "sg"), lg = num(el, "lg"), ro = num(el, "or") / 100, rc = num(el, "cr") / 100, cap = self(el, "mfs").value === "1" ? 1500 : 3000;
      var before = netCap(sg, lg), after = netCap(sg - (isLT ? 0 : L), lg - (isLT ? L : 0));
      function taxOf(n) { var st = n[0], lt = n[1], t = 0, ded = 0; if (st > 0) t += st * ro; if (lt > 0) t += lt * rc; var net = Math.min(0, st) + Math.min(0, lt); if (net < 0) { ded = Math.min(cap, -net); t -= ded * ro; } return { t: t, ded: ded, carry: Math.max(0, -net - ded) }; }
      var tb = taxOf(before), ta = taxOf(after), saved = tb.t - ta.t;
      var carry = ta.carry, yrs = 0, pts = [[0, carry]], c = carry; while (c > 0 && yrs < 40) { c = Math.max(0, c - cap); yrs++; pts.push([yrs, c]); }
      var payback = L * rc, net = saved + carry * ro - payback;
      self(el, "k").innerHTML = kpi("Tax saved this year", money(saved), "good") + kpi("Deducted from ordinary income", money(ta.ded)) + kpi("Carried forward", money(carry)) +
        kpi("Years to use carryforward at $" + cap.toLocaleString() + "/yr", carry > 0 ? String(yrs) : "—") + kpi("Future gain tax on lower basis", money(payback), "bad");
      INV.lineChart(self(el, "c"), { label: "Capital loss carryforward remaining", height: 210, xTitle: "Years from now (no other gains assumed)", xFmt: yearFmt, yFmt: ms, series: [{ name: "Carryforward left", color: "var(--s1)", data: pts.length > 1 ? pts : [[0, 0], [1, 0]], area: true }] });
      self(el, "n2").innerHTML = "This year the loss offsets " + money(Math.max(0, (before[0] > 0 ? before[0] : 0) + (before[1] > 0 ? before[1] : 0) - Math.max(0, after[0]) - Math.max(0, after[1]))) + " of gains and " + money(ta.ded) + " of ordinary income, saving <b>" + money(saved) + "</b>. " +
        (carry > 0 ? "The remaining " + money(carry) + " carries forward; used against ordinary income at your current rate it is worth up to about " + money(carry * ro) + " more over " + yrs + " years. " : "") +
        "Because the replacement investment now has a basis " + money(L) + " lower, selling it someday at your long-term rate would give back about " + money(payback) + " &mdash; unless it is donated, held until death (step-up in basis), or sold in a 0% year. The rough lifetime net, ignoring the time value of money, is <b>" + money(net) + "</b>.";
    }
    wire(el, run);
  };

  /* ---------- 3. Wash-sale checker (INV-037) ---------- */
  TOOLS.s5bWash = function (el) {
    var u = uid(el);
    shell(el, "Would this trade be a wash sale?", "Rule checker",
      rng(u + "-d", "You (or your spouse) buy again", -45, 45, 1, 20, "day") +
      sel(u + "-w", "What you buy", [["same", "The same stock or fund"], ["opt", "A call option on the same stock"], ["twin", "A different fund tracking the same index"], ["diff", "A fund tracking a different index"], ["co", "Another company's stock"]], "same") +
      sel(u + "-a", "Where the purchase happens", [["tax", "Your taxable account"], ["ira", "Your IRA or Roth IRA"], ["sp", "Your spouse's account"], ["drip", "Automatic dividend reinvestment"]], "tax") +
      note("IRC §1091 and IRS Publication 550: a loss is disallowed if, within 30 days before or after the sale, you buy substantially identical stock or securities (including through an option, your IRA or Roth IRA, or your spouse). The disallowed loss is added to the new shares' basis, except when the purchase is in an IRA."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-v"></div>');
    function run() {
      var d = Number(self(el, "d").value), w = self(el, "w").value, a = self(el, "a").value, inWin = Math.abs(d) <= 30;
      var ident = w === "same" || w === "opt" ? "yes" : w === "twin" ? "maybe" : "no";
      var verdict, cls, why;
      if (!inWin) { verdict = "Not a wash sale"; cls = "good"; why = "The purchase is " + Math.abs(d) + " days " + (d < 0 ? "before" : "after") + " the sale, outside the 61-day window (30 days before, the sale day, 30 days after)."; }
      else if (ident === "no") { verdict = "Not a wash sale"; cls = "good"; why = "Stock of a different company, or a fund tracking a different index, is ordinarily not substantially identical. This is the usual way to stay invested while harvesting."; }
      else if (ident === "maybe") { verdict = "Unsettled"; cls = ""; why = "The IRS has not said whether two funds from different sponsors that track the same index are substantially identical. Many investors avoid the question by switching to a fund that tracks a different index."; }
      else { verdict = "Wash sale"; cls = "bad"; why = "Buying the same security" + (w === "opt" ? " through a call option" : "") + " within 30 days disallows the loss."; }
      if (verdict === "Wash sale" || verdict === "Unsettled") {
        if (a === "ira") why += " Because the purchase is in an IRA, the disallowed loss is <b>not</b> added to any basis: it is lost for good.";
        else if (a === "sp") why += " A purchase by your spouse counts the same as your own.";
        else if (a === "drip") why += " Reinvested dividends are purchases too; only the loss on the number of shares bought is disallowed. Turn off reinvestment around a harvest.";
        else if (verdict === "Wash sale") why += " The disallowed loss is added to the basis of the new shares, and their holding period includes the old shares' holding period, so the loss is postponed rather than lost.";
      }
      self(el, "k").innerHTML = kpi("Verdict", verdict, cls) + kpi("Days from sale", (d > 0 ? "+" : "") + d) + kpi("Inside the 61-day window?", inWin ? "Yes" : "No", inWin ? "bad" : "good");
      self(el, "v").innerHTML = '<p class="tool-note">' + why + "</p>";
    }
    wire(el, run);
  };

  /* ---------- 4. Tax-gain harvesting at 0% (INV-037) ---------- */
  TOOLS.s5bGainHarvest = function (el) {
    var u = uid(el);
    shell(el, "How much gain can you realize at 0% in 2026?", "Calculator",
      sel(u + "-fs", "Filing status", FS3, "mfj") + numf(u + "-o", "Ordinary income: wages, pensions, IRA withdrawals, interest ($)", 60000, 1000) +
      numf(u + "-ss", "Social Security benefits received ($)", 0, 1000) + numf(u + "-q", "Qualified dividends already expected ($)", 2000, 500) +
      numf(u + "-g", "Unrealized long-term gain you could realize ($)", 40000, 1000) + sel(u + "-n65", "People on the return age 65 or older", [["0", "None"], ["1", "One"], ["2", "Two"]], "0") +
      note("2026 thresholds (Rev. Proc. 2025-32): the 0% rate applies to long-term gains and qualified dividends that fit under $49,450 of taxable income (single), $98,900 (married filing jointly) or $66,200 (head of household). The calculator uses the 2026 standard deduction, the extra deduction at 65, and the temporary $6,000 senior deduction. Federal only; states usually tax these gains."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var fs = self(el, "fs").value, o = num(el, "o"), ss = num(el, "ss"), q = num(el, "q"), g = num(el, "g"), n65 = Number(self(el, "n65").value);
      var base = { fs: fs, ord: o, ss: ss, qd: q, n65: n65 }, t0 = fed(base).total;
      function extra(x) { return fed({ fs: fs, ord: o, ss: ss, qd: q + x, n65: n65 }).total - t0; }
      var free = solveUp(extra, 0.01, 0, g), all = extra(g);
      var pts = [], step = Math.max(500, Math.round(g / 40 / 500) * 500 || 500);
      for (var x = 0; x <= g + 1; x += step) pts.push([x, extra(x)]);
      if (pts[pts.length - 1][0] < g) pts.push([g, all]);
      var reset = free * 0.15;
      self(el, "k").innerHTML = kpi("Gain you can realize tax-free", money(free), "good") + kpi("Federal tax to realize all of it", money(all), all > 0 ? "bad" : "good") +
        kpi("Average rate on the whole gain", g ? pct(all / g * 100, 1) : "—") + kpi("Future 15% tax avoided on the reset", money(reset), "good");
      INV.lineChart(self(el, "c"), { label: "Extra federal tax by gain realized", height: 220, xTitle: "Long-term gain realized", xFmt: ms, yFmt: ms, series: [{ name: "Extra federal tax", color: "var(--s5)", data: pts, area: true }],
        dots: [dot(free, 0, money(free) + " free", "var(--s2)", 0, g)] });
      var r = fed({ fs: fs, ord: o, ss: ss, qd: q + free, n65: n65 });
      self(el, "n2").innerHTML = "You can sell and immediately rebuy (there is no wash-sale rule for gains) up to <b>" + money(free) + "</b> of long-term gain with no federal tax, raising your cost basis by that much. " +
        (ss > 0 && free < Math.max(0, TX.cg0[fs] - fed(base).ti) - 1 ? "The free amount is smaller than the gap to the 0% threshold because each dollar of gain also makes more of your Social Security taxable. " : "") +
        "Taxable income after harvesting: " + money(r.ti) + " against a 0% ceiling of " + money(TX.cg0[fs]) + ". Beyond that point, gains are taxed at 15%" + (ss > 0 ? " or more" : "") + ".";
    }
    wire(el, run);
  };

  /* =====================================================================
     5. Multi-year Roth conversion simulator (INV-038)
     ===================================================================== */
  var ROTH_PRESETS = {
    harper: { fs: "mfj", a1: 57, a2: 55, trad: 820000, roth: 60000, side: 220000, wages: 220000, contrib: 40000, retire: 62, ss1: 45600, c1: 67, ss2: 30000, c2: 67, other: 0, spend: 0, rmd: 75, horizon: 92, target: "0.22", start: 62 },
    ruth: { fs: "single", a1: 68, a2: 0, trad: 780000, roth: 0, side: 60000, wages: 0, contrib: 0, retire: 68, ss1: 34800, c1: 66, ss2: 0, c2: 67, other: 2400, spend: 30000, rmd: 73, horizon: 92, target: "0.12", start: 68 }
  };
  function rothSim(P, convOn) {
    var trad = P.trad, roth = P.roth, side = P.side, r = P.r, rs = P.r - 0.005, out = { rows: [], tax: 0, irmaa: 0, conv: 0, firstRmd: 0, sideNeg: null }, magiHist = [], magiBase = [];
    for (var a = P.a1, y = 2026; a <= P.horizon; a++, y++) {
      var a2 = P.fs === "mfj" ? P.a2 + (a - P.a1) : 0;
      var working = a < P.retire, wages = working ? Math.max(0, P.wages) : 0, contrib = working ? P.contrib : 0;
      var ss = (a >= P.c1 ? P.ss1 : 0) + (P.fs === "mfj" && a2 >= P.c2 ? P.ss2 : 0);
      var n65 = (a >= 65 ? 1 : 0) + (P.fs === "mfj" && a2 >= 65 ? 1 : 0);
      trad += contrib;
      var rmd = a >= P.rmd && ULT[Math.min(96, a)] ? trad / ULT[Math.min(96, a)] : 0;
      if (a === P.rmd) out.firstRmd = rmd;
      var need = a >= P.retire ? P.spend : 0, spend = Math.min(Math.max(0, trad), need), fromIra = Math.max(rmd, spend), short = need - spend;
      var fromRoth = Math.min(Math.max(0, roth), short); roth -= fromRoth; short -= fromRoth;
      var baseOrd = wages + P.other + fromIra;
      var conv = 0;
      if (convOn && a >= P.start && a < P.stop && trad - fromIra > 0) {
        if (P.mode === "fixed") conv = Math.min(P.fixed, trad - fromIra);
        else { var top = bracketTop(P.fs, Number(P.target)); conv = solveUp(function (x) { return fed({ fs: P.fs, ord: baseOrd + x, ss: ss, n65: n65, year: y }).ti; }, top, 0, trad - fromIra); }
      }
      var noIra = fed({ fs: P.fs, ord: wages + P.other, ss: ss, n65: n65, year: y });
      var withAll = fed({ fs: P.fs, ord: baseOrd + conv, ss: ss, n65: n65, year: y });
      var incTax = withAll.total - noIra.total;
      magiHist.push(withAll.magi); magiBase.push(noIra.magi);
      var look = Math.max(0, magiHist.length - 3);
      var ir = 0; if (n65 > 0) ir = n65 * (irmaaAnnual(magiHist[look], P.fs) - irmaaAnnual(magiBase[look], P.fs));
      trad -= fromIra + conv; roth += conv;
      side += (fromIra - spend) - incTax - ir - short;
      if (side < 0 && out.sideNeg === null) out.sideNeg = a;
      out.tax += incTax; out.irmaa += ir; out.conv += conv;
      out.rows.push({ a: a, y: y, conv: conv, rmd: rmd, ti: withAll.ti, tax: incTax, ir: ir, trad: trad, roth: roth, side: side, rate: margOrd({ fs: P.fs, ord: baseOrd + conv, ss: ss, n65: n65, year: y }) });
      trad *= 1 + r; roth *= 1 + r; side *= 1 + (side >= 0 ? rs : r);
      out.rows[out.rows.length - 1].wealth = roth + side + trad * (1 - P.heir);
    }
    out.trad = trad; out.roth = roth; out.side = side; out.wealth = roth + side + trad * (1 - P.heir);
    return out;
  }
  INV.s5bRothSim = rothSim; INV.s5bRothPresets = ROTH_PRESETS;
  TOOLS.s5bRoth = function (el) {
    var u = uid(el);
    shell(el, "Multi-year Roth conversion planner", "Simulator",
      '<div class="fld"><label>Household</label><div class="seg" role="group"><button type="button" data-v="harper" aria-pressed="true">The Harpers</button><button type="button" data-v="ruth" aria-pressed="false">Ruth</button></div></div>' +
      sel(u + "-fs", "Filing status", FS3, "mfj") + numf(u + "-a1", "Age now (older spouse)", 57, 1) + numf(u + "-a2", "Spouse's age now (0 if single)", 55, 1) +
      numf(u + "-trad", "Pre-tax balance: 401(k)s and traditional IRAs ($)", 820000, 5000) + numf(u + "-roth", "Roth balance ($)", 60000, 5000) + numf(u + "-side", "Taxable account that pays the tax ($)", 220000, 5000) +
      numf(u + "-wages", "Taxable wages until retirement ($, after pre-tax savings)", 220000, 1000) + numf(u + "-contrib", "Pre-tax contributions per year until retirement ($)", 40000, 1000) + numf(u + "-retire", "Retirement age (older spouse)", 62, 1) +
      numf(u + "-ss1", "Social Security, older spouse ($ a year)", 45600, 600) + numf(u + "-c1", "  claiming age", 67, 1) + numf(u + "-ss2", "Social Security, younger spouse ($ a year)", 30000, 600) + numf(u + "-c2", "  claiming age (their own age)", 67, 1) +
      numf(u + "-other", "Other taxable income: interest, pension ($ a year)", 0, 500) + numf(u + "-spend", "IRA withdrawals for spending in retirement ($ a year)", 0, 1000) +
      numf(u + "-rmd", "RMD age (73, or 75 if born 1960 or later)", 75, 1) + numf(u + "-start", "Start converting at age", 62, 1) + numf(u + "-stop", "Stop converting at age", 75, 1) +
      sel(u + "-target", "Each year, convert enough to fill the", [["0.12", "12% bracket"], ["0.22", "22% bracket"], ["0.24", "24% bracket"], ["0.32", "32% bracket"]], "0.22") +
      rng(u + "-r", "Return after inflation", 0, 7, 0.5, 4, "pct") + rng(u + "-heir", "Heirs' tax rate on inherited pre-tax money", 0, 40, 1, 24, "pct") + numf(u + "-horizon", "Plan through age", 92, 1) +
      note("Everything is in 2026 dollars: brackets, deductions and IRMAA tiers are held at 2026 levels and returns are after inflation. Conversion taxes and IRMAA surcharges are paid from the taxable account; RMDs not spent are reinvested there after tax (its growth is reduced 0.5% a year for tax drag). The $6,000 senior deduction ends after 2028. Spending from other sources is the same in both cases and is left out. Federal tax only."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><div class="fig-title" style="margin-top:10px">Conversions and required distributions by age</div><div id="' + u + '-b"></div><p class="tool-note" id="' + u + '-n2"></p>');
    var keys = ["fs", "a1", "a2", "trad", "roth", "side", "wages", "contrib", "retire", "ss1", "c1", "ss2", "c2", "other", "spend", "rmd", "start", "horizon", "target"];
    el.querySelectorAll(".seg button").forEach(function (b) {
      b.addEventListener("click", function () {
        el.querySelectorAll(".seg button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        var p = ROTH_PRESETS[b.dataset.v]; keys.forEach(function (k) { setv(el, k, p[k]); }); setv(el, "stop", p.rmd); run();
      });
    });
    function run() {
      var fs = self(el, "fs").value;
      var P = { fs: fs, a1: num(el, "a1"), a2: num(el, "a2"), trad: num(el, "trad"), roth: num(el, "roth"), side: num(el, "side"), wages: num(el, "wages"), contrib: num(el, "contrib"), retire: num(el, "retire"),
        ss1: num(el, "ss1"), c1: num(el, "c1"), ss2: num(el, "ss2"), c2: num(el, "c2"), other: num(el, "other"), spend: num(el, "spend"), rmd: Math.max(72, num(el, "rmd")), start: num(el, "start"), stop: num(el, "stop"),
        target: self(el, "target").value, mode: "fill", r: num(el, "r") / 100, heir: num(el, "heir") / 100, horizon: Math.min(100, Math.max(num(el, "a1") + 1, num(el, "horizon"))) };
      if (!P.a1) P.a1 = 60;
      var N = rothSim(P, false), C = rothSim(P, true), gain = C.wealth - N.wealth;
      self(el, "k").innerHTML = kpi("Total converted", money(C.conv)) + kpi("After-tax wealth at " + P.horizon + ", no conversions", money(N.wealth)) + kpi("With conversions", money(C.wealth), gain >= 0 ? "good" : "bad") +
        kpi("Difference", money(gain), gain >= 0 ? "good" : "bad") + kpi("First RMD, no conversions", money(N.firstRmd, 0)) + kpi("First RMD, with conversions", money(C.firstRmd, 0)) + kpi("Extra IRMAA paid", money(C.irmaa - N.irmaa), C.irmaa - N.irmaa > 0 ? "bad" : "");
      INV.lineChart(self(el, "c"), { label: "After-tax wealth by age", height: 250, xTitle: "Age (older spouse)", xFmt: yearFmt, yFmt: ms, zeroBase: false,
        series: [{ name: "With conversions", color: "var(--s2)", data: C.rows.map(function (x) { return [x.a + 1, x.wealth]; }) }, { name: "No conversions", color: "var(--s5)", data: N.rows.map(function (x) { return [x.a + 1, x.wealth]; }), dash: "5 4" }] });
      INV.barChart(self(el, "b"), { label: "Conversions and RMDs by age", height: 200, maxLabels: 12, yFmt: ms, tipFmt: function (v) { return money(v); },
        data: C.rows.map(function (x) { return { label: String(x.a), tip: "Age " + x.a + (x.conv > 0 ? ": conversion" : x.rmd > 0 ? ": RMD" : ""), y: x.conv > 0 ? x.conv : x.rmd, color: x.conv > 0 ? "var(--s2)" : "var(--s3)" }; }) });
      var first = C.rows.find(function (x) { return x.conv > 0; });
      self(el, "n2").innerHTML = (first ? "Converting starts at " + first.a + " with " + money(first.conv) + ", filling the " + Math.round(Number(P.target) * 100) + "% bracket. " : "No conversions happen with these settings. ") +
        (C.tax - N.tax >= 0 ? "Over the plan the household pays " + money(C.tax - N.tax, 0) + " more federal tax during life, most of it up front on the conversions" : "Over the plan the household pays " + money(N.tax - C.tax, 0) + " less federal tax during life, even though the conversions are taxed up front, because later RMDs shrink") + "; the first RMD falls from " + money(N.firstRmd, 0) + " to " + money(C.firstRmd, 0) + ". " +
        "At age " + P.horizon + " the household is <b>" + money(Math.abs(gain)) + " " + (gain >= 0 ? "better" : "worse") + " off</b> after all taxes, counting pre-tax money left to heirs at " + Math.round(P.heir * 100) + "%." +
        (C.sideNeg ? " The taxable account runs out at age " + C.sideNeg + "; after that the model treats further tax as borrowed, which overstates the benefit." : "");
    }
    wire(el, run);
  };

  /* ---------- 6. IRMAA cliff (INV-038) ---------- */
  TOOLS.s5bIrmaa = function (el) {
    var u = uid(el);
    shell(el, "How close are you to a Medicare IRMAA cliff?", "Calculator",
      sel(u + "-fs", "Filing status on the tax return", [["single", "Single, head of household"], ["mfj", "Married filing jointly"]], "single") +
      numf(u + "-m", "Modified adjusted gross income ($)", 105000, 1000, "AGI plus tax-exempt interest") + sel(u + "-p", "People on Medicare", [["1", "One"], ["2", "Two"]], "1") +
      note("CMS 2026 amounts. The 2026 surcharge is based on the tax return for 2024 (two years earlier). Each tier applies in full once MAGI exceeds its threshold by even $1; a life-changing event such as the death of a spouse or retirement can be reported to Social Security on Form SSA-44."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var fs = self(el, "fs").value, m = num(el, "m"), n = Number(self(el, "p").value), t = IRM[fs], k = irmaaTier(m, fs), cost = n * irmaaAnnual(m, fs);
      var nextT = k < 5 ? t[k] : null, room = nextT != null ? nextT - m : null, nextCost = k < 5 ? n * 12 * (IRM.B[k + 1] - IRM.B[0] + IRM.D[k + 1]) : null;
      self(el, "k").innerHTML = kpi("Tier", k === 0 ? "Standard (none)" : "Tier " + k, k ? "bad" : "good") + kpi("Part B premium each / month", money(IRM.B[k], 2)) + kpi("Part D surcharge each / month", money(IRM.D[k], 2)) +
        kpi("Extra cost a year, all people", money(cost), cost > 0 ? "bad" : "good") + kpi("Room below next threshold", room != null ? money(Math.max(0, room + (k === 4 ? -1 : 0))) : "top tier");
      var data = [0, 1, 2, 3, 4, 5].map(function (i) { return { label: i === 0 ? "≤ " + ms(t[0]) : i < 5 ? "≤ " + ms(t[i]) : "≥ " + ms(t[4]), tip: "Tier " + i, y: n * 12 * (IRM.B[i] - IRM.B[0] + IRM.D[i]), color: i === k ? "var(--s5)" : "var(--s6)" }; });
      INV.barChart(self(el, "c"), { label: "Annual surcharge by tier", height: 210, allLabels: true, valueLabels: true, xTitle: "MAGI tier", yFmt: ms, tipFmt: function (v) { return money(v) + " a year"; }, data: data });
      self(el, "n2").innerHTML = room != null ? "One more dollar above " + money(nextT) + " would raise the yearly cost from " + money(cost) + " to " + money(nextCost) + " &mdash; a jump of <b>" + money(nextCost - cost) + "</b>. When sizing a Roth conversion or a capital gain, stop just below a threshold unless the extra income is worth the jump." : "You are in the top tier; more income no longer raises the surcharge.";
    }
    wire(el, run);
  };

  /* =====================================================================
     7. Charitable giving strategies (INV-039)
     ===================================================================== */
  function giveYear(b, gift, how) {
    /* b: base household; how: none | cash | stock | daf (stock into a DAF) | qcd */
    var p = { fs: b.fs, ord: b.ord, ss: b.ss, qd: b.qd, n65: b.n65, salt: b.salt, mort: b.mort, year: 2026 };
    if (how === "cash") p.cash = gift;
    if (how === "stock" || how === "daf") { p.prop = gift; p.daf = how === "daf"; }
    if (how === "qcd") p.ord = Math.max(0, b.ord - Math.min(gift, b.ira, TX_QCD));
    return fed(p).total;
  }
  var TX_QCD = 111000;
  INV.s5bGiveYear = giveYear;
  TOOLS.s5bCharity = function (el) {
    var u = uid(el);
    shell(el, "Four ways to give the same dollars", "Calculator",
      sel(u + "-fs", "Filing status", FS3, "mfj") + numf(u + "-ord", "Ordinary income: wages, pensions, IRA withdrawals ($)", 230000, 1000) + numf(u + "-ira", "  of which IRA distributions ($)", 0, 1000) +
      numf(u + "-ss", "Social Security received ($)", 0, 1000) + numf(u + "-qd", "Qualified dividends and long-term gains ($)", 6000, 500) +
      numf(u + "-salt", "State and local taxes paid ($)", 14000, 500) + numf(u + "-mort", "Mortgage interest paid ($)", 3500, 500) +
      numf(u + "-g", "Giving each year ($)", 10000, 500) + rng(u + "-y", "Years in a bunching cycle", 2, 5, 1, 3, "yr") + rng(u + "-bs", "Cost basis of the stock you would give", 0, 100, 5, 30, "pct") +
      sel(u + "-age", "Age of the IRA owner", [["y", "Under 70½"], ["o", "70½ or older (QCDs allowed)"]], "y") + sel(u + "-n65", "People age 65 or older", [["0", "None"], ["1", "One"], ["2", "Two"]], "0") +
      note("2026 federal rules: standard deduction $32,200 joint / $16,100 single; non-itemizers may deduct up to $1,000 ($2,000 joint) of cash gifts, but not gifts to a donor-advised fund; itemizers lose the first 0.5% of AGI of gifts; the SALT cap is $40,400 (phased down above $505,000); appreciated stock held more than a year is deductible at value up to 30% of AGI. QCDs up to $111,000 a person from age 70½. The stock value includes the capital-gains tax you avoid by not selling it."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var b = { fs: self(el, "fs").value, ord: num(el, "ord"), ira: Math.min(num(el, "ira"), num(el, "ord")), ss: num(el, "ss"), qd: num(el, "qd"), salt: num(el, "salt"), mort: num(el, "mort"), n65: Number(self(el, "n65").value) };
      var g = num(el, "g"), Y = Number(self(el, "y").value), bs = num(el, "bs") / 100, old = self(el, "age").value === "o";
      var none = giveYear(b, 0, "none") * Y;
      var cash = giveYear(b, g, "cash") * Y;
      /* avoided gain tax: tax if the donor instead sold that stock */
      var gainTax = fed({ fs: b.fs, ord: b.ord, ss: b.ss, qd: b.qd + g * (1 - bs), n65: b.n65, salt: b.salt, mort: b.mort }).total - fed({ fs: b.fs, ord: b.ord, ss: b.ss, qd: b.qd, n65: b.n65, salt: b.salt, mort: b.mort }).total;
      var stock = giveYear(b, g, "stock") * Y - gainTax * Y;
      var bunch = giveYear(b, g * Y, "daf") + giveYear(b, 0, "none") * (Y - 1) - fed({ fs: b.fs, ord: b.ord, ss: b.ss, qd: b.qd + g * Y * (1 - bs), n65: b.n65, salt: b.salt, mort: b.mort }).total + fed({ fs: b.fs, ord: b.ord, ss: b.ss, qd: b.qd, n65: b.n65, salt: b.salt, mort: b.mort }).total;
      var qcdOK = old && b.ira > 0, qcd = qcdOK ? giveYear(b, g, "qcd") * Y : null;
      var sv = function (x) { return none - x; };
      var rows = [["Cash each year", sv(cash)], ["Stock each year", sv(stock)], ["Bunch " + Y + " years of stock into a donor-advised fund", sv(bunch)]];
      if (qcdOK) rows.push(["QCD from the IRA each year", sv(qcd)]);
      var best = rows.reduce(function (a, r) { return r[1] > a[1] ? r : a; });
      self(el, "k").innerHTML = rows.map(function (r) { return kpi(r[0], money(r[1]), r === best ? "good" : ""); }).join("") + kpi("Given over " + Y + " years", money(g * Y));
      INV.barChart(self(el, "c"), { label: "Federal tax saved over the cycle", height: 220, allLabels: true, valueLabels: true, yFmt: ms, tipFmt: function (v) { return money(v) + " saved"; },
        data: rows.map(function (r, i) { return { label: ["Cash", "Stock", "Bunch via DAF", "QCD"][i], tip: r[0], y: r[1], color: r === best ? "var(--s2)" : "var(--s6)" }; }) });
      var itemNow = fed({ fs: b.fs, ord: b.ord, ss: b.ss, qd: b.qd, n65: b.n65, salt: b.salt, mort: b.mort, cash: g }).itemized;
      self(el, "n2").innerHTML = "Giving " + money(g) + " a year for " + Y + " years, <b>" + best[0].toLowerCase() + "</b> saves the most federal tax: " + money(best[1]) + ", or " + pct(g ? best[1] / (g * Y) * 100 : 0, 0) + " of the amount given. " +
        (itemNow ? "With these numbers you itemize even in a normal year, so bunching adds less. " : "In a normal year these deductions fall short of the standard deduction, which is why bunching several years into one helps. ") +
        (!qcdOK ? "QCDs become available once the IRA owner reaches 70½ and takes IRA distributions." : "A QCD also lowers AGI, which can reduce taxable Social Security and Medicare IRMAA surcharges.");
    }
    wire(el, run);
  };

  /* =====================================================================
     8. ESPP dispositions (INV-040)
     ===================================================================== */
  function espp(o) {
    var price = (o.look ? Math.min(o.offer, o.fmvp) : o.fmvp) * (1 - o.disc), sh = o.sh;
    var dqOrd = (o.fmvp - price) * sh, dqCap = (o.sale - o.fmvp) * sh; /* disqualifying: capital part short-term if sold within a year */
    var gain = (o.sale - price) * sh, qOrd = gain > 0 ? Math.min(o.offer * o.disc * sh, gain) : 0, qCap = gain - qOrd;
    return { price: price, cost: price * sh, dqOrd: dqOrd, dqCap: dqCap, qOrd: qOrd, qCap: qCap };
  }
  INV.s5bEspp = espp;
  TOOLS.s5bEspp = function (el) {
    var u = uid(el);
    shell(el, "Employee stock purchase plan: sell now or hold for a qualifying sale?", "Calculator",
      numf(u + "-sh", "Shares bought this period", 200, 10) + numf(u + "-offer", "Price on the offering (grant) date ($)", 50, 0.5) + numf(u + "-fmvp", "Price on the purchase date ($)", 58, 0.5) +
      rng(u + "-disc", "Plan discount", 0, 15, 1, 15, "pct") + sel(u + "-look", "Lookback to the lower of the two prices?", [["1", "Yes"], ["0", "No"]], "1") +
      numf(u + "-sale", "Price if you sell today ($)", 58, 0.5) + numf(u + "-later", "Price when a qualifying sale becomes possible ($)", 58, 0.5) +
      rng(u + "-or", "Your ordinary tax rate (federal + state)", 10, 45, 1, 26, "pct") + rng(u + "-cr", "Your long-term gains rate (federal + state)", 0, 30, 1, 18, "pct") +
      note("IRS Publication 525 and IRC §423. A qualifying disposition needs both more than 2 years from the offering date and more than 1 year from purchase. Qualifying: ordinary income is the lesser of the discount measured at the offering date or your actual gain; the rest is long-term gain. Disqualifying: ordinary income is the purchase-date price minus what you paid, even if the stock later falls; the rest is a capital gain or loss (short-term here)."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var o = { sh: num(el, "sh"), offer: num(el, "offer"), fmvp: num(el, "fmvp"), disc: num(el, "disc") / 100, look: self(el, "look").value === "1", sale: num(el, "sale") }, ro = num(el, "or") / 100, rc = num(el, "cr") / 100, later = num(el, "later");
      var now = espp(o), q = espp({ sh: o.sh, offer: o.offer, fmvp: o.fmvp, disc: o.disc, look: o.look, sale: later });
      var taxNow = now.dqOrd * ro + now.dqCap * ro, netNow = o.sale * o.sh - taxNow;
      var taxQ = q.qOrd * ro + (q.qCap >= 0 ? q.qCap * rc : q.qCap * rc), netQ = later * o.sh - taxQ;
      function netQat(p) { var z = espp({ sh: o.sh, offer: o.offer, fmvp: o.fmvp, disc: o.disc, look: o.look, sale: p }); return p * o.sh - (z.qOrd * ro + z.qCap * rc); }
      var lo = 0, hi = Math.max(o.sale, later, o.fmvp) * 2; for (var i = 0; i < 60; i++) { var m = (lo + hi) / 2; if (netQat(m) >= netNow) hi = m; else lo = m; }
      var be = hi, drop = o.sale > 0 ? (1 - be / o.sale) * 100 : 0;
      self(el, "k").innerHTML = kpi("You paid per share", money(now.price, 2)) + kpi("Sell today: ordinary income", money(now.dqOrd)) + kpi("Sell today: after-tax cash", money(netNow)) +
        kpi("Qualifying sale: after-tax cash", money(netQ), netQ > netNow ? "good" : "bad") + kpi("Break-even later price", money(be, 2)) + kpi("Room for the price to fall", drop > 0 ? pct(drop, 1) : "none: it must rise", drop < 5 ? "bad" : "");
      var pts = [], pts2 = [], ref = o.sale > 0 ? o.sale : Math.max(1, o.fmvp, later), stp = ref / 40; for (var p = ref * 0.5; p <= ref * 1.3 + 1e-9; p += stp) { pts.push([p, netQat(p)]); pts2.push([p, netNow]); }
      INV.lineChart(self(el, "c"), { label: "After-tax cash by later price", height: 220, xTitle: "Price at a later qualifying sale", xFmt: function (v) { return "$" + v.toFixed(0); }, yFmt: ms, zeroBase: false,
        series: [{ name: "Hold for a qualifying sale", color: "var(--s2)", data: pts }, { name: "Sell today", color: "var(--s5)", data: pts2, dash: "5 4" }], dots: [dot(be, netNow, "break-even " + money(be, 2), "var(--s1)", ref * 0.5, ref * 1.3)] });
      self(el, "n2").innerHTML = "Selling today locks in the discount as ordinary income (" + money(now.dqOrd) + ") and leaves " + money(netNow) + " after tax. Holding for a qualifying sale can turn part of that into long-term gain, but only pays off if the price is still above <b>" + money(be, 2) +
        "</b> when you sell" + (drop > 0 ? " &mdash; a fall of no more than " + pct(drop, 1) + "." : ", which is above today's price: at these tax rates, holding cannot win unless the stock rises.") + " Holding also keeps more of your savings in the company that pays your salary.";
    }
    wire(el, run);
  };

  /* ---------- 9. ISO exercise and the AMT (INV-040) ---------- */
  function amt(fs, ord, spread) {
    var reg = fed({ fs: fs, ord: ord }).total, amti = ord + spread; /* standard deduction is not allowed for AMT */
    var ex = Math.max(0, TX.amtEx[fs] - 0.5 * Math.max(0, amti - TX.amtPh[fs])), base = Math.max(0, amti - ex);
    var tmt = 0.26 * Math.min(base, TX.amt28) + 0.28 * Math.max(0, base - TX.amt28);
    return { reg: reg, tmt: tmt, amt: Math.max(0, tmt - reg), ex: ex };
  }
  INV.s5bAmt = amt;
  TOOLS.s5bIso = function (el) {
    var u = uid(el);
    shell(el, "Exercising incentive stock options: will the AMT apply?", "Calculator",
      sel(u + "-fs", "Filing status", FS3, "single") + numf(u + "-ord", "Wages and other ordinary income ($)", 150000, 1000) +
      numf(u + "-sh", "Shares exercised and held past year-end", 2000, 100) + numf(u + "-kin", "Exercise (strike) price ($)", 10, 0.5) + numf(u + "-f", "Share price at exercise ($)", 40, 0.5) +
      note("2026 AMT (Rev. Proc. 2025-32): exemption $90,100 single or head of household and $140,200 joint, reduced by 50 cents per dollar above $500,000 / $1,000,000; 26% on the first $244,500 above the exemption and 28% beyond. The ISO spread counts for AMT, not regular tax, when you hold the shares past year-end (Publication 525). Simplified: standard deduction, no other AMT items, no capital gains."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var fs = self(el, "fs").value, ord = num(el, "ord"), sh = num(el, "sh"), k = num(el, "kin"), f = num(el, "f"), spread = Math.max(0, (f - k) * sh);
      var r = amt(fs, ord, spread), free = solveUp(function (x) { return amt(fs, ord, x).amt; }, 1, 0, 5e6), perSh = Math.max(0, f - k);
      self(el, "k").innerHTML = kpi("Bargain element (spread)", money(spread)) + kpi("Regular federal tax", money(r.reg)) + kpi("Tentative minimum tax", money(r.tmt)) + kpi("AMT owed", money(r.amt), r.amt > 0 ? "bad" : "good") +
        kpi("Spread you could add with no AMT", money(free), "good") + kpi("≈ shares at today's spread", perSh > 0 ? Math.floor(free / perSh).toLocaleString() : "—");
      var pts = [], step = Math.max(1000, Math.round(Math.max(spread * 1.5, free * 2, 50000) / 50));
      for (var x = 0; x <= Math.max(spread * 1.5, free * 2, 50000); x += step) pts.push([x, amt(fs, ord, x).amt]);
      INV.lineChart(self(el, "c"), { label: "AMT by ISO spread", height: 220, xTitle: "ISO spread exercised and held", xFmt: ms, yFmt: ms, series: [{ name: "AMT owed", color: "var(--s5)", data: pts, area: true }], dots: [dot(spread, r.amt, money(r.amt), "var(--s1)", 0, Math.max(spread * 1.5, free * 2, 50000))] });
      self(el, "n2").innerHTML = "At this income you could exercise about <b>" + money(free) + "</b> of spread in 2026 before the AMT starts. Exercising " + money(spread) + " of spread " + (r.amt > 0 ? "creates about " + money(r.amt) + " of AMT, paid in cash now even though you sold nothing. Most of it becomes a credit you can recover in later years when regular tax exceeds the AMT." : "creates no AMT.") +
        " If the stock falls before you sell, the tax is still owed; selling in the same year removes the AMT adjustment but makes the spread ordinary income.";
    }
    wire(el, run);
  };

  /* =====================================================================
     10. State income tax on the same income (INV-041)
     ===================================================================== */
  function stateTaxes(s) {
    /* s: fs, age, wages, ira (IRA and private pension distributions), gov (government pension), ss, inv (interest and dividends), cg (long-term gains) */
    var f = fed({ fs: s.fs, ord: s.wages + s.ira + s.gov + s.inv, qd: s.cg, ss: s.ss, n65: s.age >= 65 ? (s.fs === "mfj" ? 2 : 1) : 0 });
    var agi = f.agi, joint = s.fs === "mfj", n = joint ? 2 : 1, out = {};
    /* North Carolina: 3.99% flat for 2026 (NCDOR); deduct taxable Social Security; NC standard deduction */
    var ncStd = s.fs === "mfj" ? 25500 : s.fs === "hoh" ? 19125 : 12750;
    out.NC = 0.0399 * Math.max(0, agi - f.taxableSS - ncStd);
    /* Pennsylvania: 3.07% (PA DOR); retirement distributions after retirement age and Social Security excluded; no standard deduction */
    out.PA = 0.0307 * Math.max(0, s.wages + s.inv + s.cg + (s.age < 59.5 ? s.ira + s.gov : 0));
    /* Ohio 2026 (ORC 5747.02): no tax at or below $26,050 of income after exemptions; above it, $332 plus 2.75% of the excess. Social Security deducted; personal exemptions (ORC 5747.025); retirement income credit (ORC 5747.055) */
    var ohAgi = Math.max(0, agi - f.taxableSS), ex = ohAgi <= 40000 ? 2350 : ohAgi <= 80000 ? 2100 : 1850, ohBase = Math.max(0, ohAgi - (ohAgi < 500000 ? ex * n : 0));
    var oh = ohBase > 26050 ? 332 + 0.0275 * (ohBase - 26050) : 0, ret = s.ira + s.gov;
    var cr = ohBase < 100000 ? (ret > 8000 ? 200 : ret > 5000 ? 130 : ret > 3000 ? 80 : ret > 1500 ? 50 : ret > 500 ? 25 : 0) : 0;
    out.OH = Math.max(0, oh - cr);
    /* Arizona: 2.5% (AZDOR 2026 estimated-tax booklet); Social Security excluded; up to $2,500 of government pension subtracted per recipient; 2025 standard deduction and $2,100 age-65 exemption per person (2025 Form 140 instructions) */
    var azStd = s.fs === "mfj" ? 31500 : s.fs === "hoh" ? 23625 : 15750;
    out.AZ = 0.025 * Math.max(0, agi - f.taxableSS - Math.min(s.gov, 2500 * n) - azStd - (s.age >= 65 ? 2100 * n : 0));
    /* Colorado: 4.4% for 2025 (CDOR); starts from federal taxable income; Social Security fully subtracted at 65+ (and at 55-64 if AGI <= $75,000 single / $95,000 joint); pension and annuity subtraction $24,000 at 65+ or $20,000 at 55-64, reduced by Social Security subtracted */
    var coSS = 0, cap = s.age >= 65 ? 24000 : s.age >= 55 ? 20000 : 0;
    var ssFull = s.age >= 65 || (s.age >= 55 && agi <= (joint ? 95000 : 75000));
    if (ssFull) coSS = f.taxableSS; else coSS = Math.min(f.taxableSS, cap * n);
    var coPen = Math.max(0, Math.min(s.ira + s.gov, cap * n - coSS)); /* DR 0104 booklet: the pension cap is reduced by the Social Security subtracted */
    out.CO = 0.044 * Math.max(0, f.ti - coSS - coPen);
    out.none = 0;
    out.fedAGI = agi; out.fedTax = f.total;
    return out;
  }
  INV.s5bStates = stateTaxes;
  TOOLS.s5bState = function (el) {
    var u = uid(el);
    shell(el, "The same income in five states", "Calculator",
      '<div class="fld"><label>Start from</label><div class="seg" role="group"><button type="button" data-v="ruth" aria-pressed="true">Ruth</button><button type="button" data-v="harper" aria-pressed="false">Harpers retired</button><button type="button" data-v="maya" aria-pressed="false">Maya</button></div></div>' +
      sel(u + "-fs", "Filing status", FS3, "single") + numf(u + "-age", "Age (older spouse)", 68, 1) + numf(u + "-w", "Wages ($)", 0, 1000) + numf(u + "-i", "IRA and private pension distributions ($)", 30000, 1000) +
      numf(u + "-g", "Government pension ($)", 0, 1000) + numf(u + "-s", "Social Security benefits ($)", 34800, 600) + numf(u + "-v", "Interest and dividends ($)", 2400, 500) + numf(u + "-c", "Long-term capital gains ($)", 0, 1000),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-n2"></p>' +
      note("Simplified resident tax, standard deductions only, no local income taxes or credits other than those named. NC: 3.99% for 2026 after the NC standard deduction, Social Security deducted. PA: 3.07%, retirement distributions after retirement age and Social Security not taxed. OH: 2026 schedule in ORC 5747.02 after personal exemptions, Social Security deducted, retirement income credit up to $200. AZ: 2.5%, Social Security excluded, up to $2,500 of government pension subtracted, 2025 standard deduction and $2,100 age-65 exemption. CO: 4.4% (the 2025 rate) on federal taxable income after the Social Security subtraction and the pension subtraction ($24,000 at 65 or older, $20,000 at 55 to 64, each reduced by the Social Security subtracted). Rules and amounts change; confirm with each revenue department."));
    var PRE = { ruth: ["single", 68, 0, 30000, 0, 34800, 2400, 0], harper: ["mfj", 67, 0, 60000, 0, 75600, 3000, 10000], maya: ["single", 24, 62000, 0, 0, 0, 100, 0] };
    var ids = ["fs", "age", "w", "i", "g", "s", "v", "c"];
    el.querySelectorAll(".seg button").forEach(function (b) {
      b.addEventListener("click", function () { el.querySelectorAll(".seg button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); PRE[b.dataset.v].forEach(function (v, i) { setv(el, ids[i], v); }); run(); });
    });
    function run() {
      var s = { fs: self(el, "fs").value, age: num(el, "age"), wages: num(el, "w"), ira: num(el, "i"), gov: num(el, "g"), ss: num(el, "s"), inv: num(el, "v"), cg: num(el, "c") };
      var t = stateTaxes(s), names = [["NC", "North Carolina"], ["PA", "Pennsylvania"], ["OH", "Ohio"], ["AZ", "Arizona"], ["CO", "Colorado"]];
      var lo = names.reduce(function (a, n) { return t[n[0]] < t[a[0]] ? n : a; }), hi = names.reduce(function (a, n) { return t[n[0]] > t[a[0]] ? n : a; });
      self(el, "k").innerHTML = names.map(function (n) { return kpi(n[1], money(t[n[0]]), n === lo ? "good" : n === hi ? "bad" : ""); }).join("") + kpi("Federal AGI", money(t.fedAGI));
      INV.barChart(self(el, "ch"), { label: "State income tax by state", height: 220, allLabels: true, valueLabels: true, yFmt: ms, tipFmt: function (v) { return money(v); },
        data: names.map(function (n, i) { return { label: n[0], tip: n[1], y: t[n[0]], color: ["var(--s4)", "var(--s5)", "var(--s3)", "var(--s2)", "var(--s1)"][i] }; }).concat([{ label: "No tax", tip: "A state with no income tax", y: 0, color: "var(--s6)" }]) });
      self(el, "n2").innerHTML = "On " + money(s.wages + s.ira + s.gov + s.ss + s.inv + s.cg) + " of total income, the resident income tax ranges from " + money(t[lo[0]]) + " in " + lo[1] + " to " + money(t[hi[0]]) + " in " + hi[1] + ", a difference of <b>" + money(t[hi[0]] - t[lo[0]]) + "</b> a year. " +
        "Income tax is only one of a state's taxes; property, sales and local taxes can reverse the ranking.";
    }
    wire(el, run);
  };

  /* =====================================================================
     11. Withdrawal order (INV-042)
     ===================================================================== */
  var WD_PRE = {
    ruth: { fs: "single", a1: 68, a2: 0, tax: 60000, basis: 100, trad: 780000, roth: 0, ss: 34800, need: 64000, rmd: 73, target: "0.12" },
    harper: { fs: "mfj", a1: 62, a2: 60, tax: 220000, basis: 55, trad: 820000, roth: 60000, ss: 0, ss1: 45600, ss2: 30000, need: 90000, rmd: 75, target: "0.12" }
  };
  function wdSim(P, strat) {
    var T = P.tax, Bs = P.tax * P.basis, D = P.trad, R = P.roth, r = P.r, tot = 0, last = null, rows = [];
    for (var a = P.a1, y = 2026; a <= P.horizon; a++, y++) {
      var a2 = P.fs === "mfj" ? P.a2 + (a - P.a1) : 0, n65 = (a >= 65 ? 1 : 0) + (P.fs === "mfj" && a2 >= 65 ? 1 : 0);
      var ss = P.ssFixed != null ? P.ssFixed : ((a >= P.c1 ? P.ss1 : 0) + (P.fs === "mfj" && a2 >= P.c2 ? P.ss2 : 0));
      var rmd = a >= P.rmd && ULT[Math.min(96, a)] ? D / ULT[Math.min(96, a)] : 0;
      var need = P.need;
      function tx(d, t) { var gf = T > 0 ? Math.max(0, 1 - Bs / T) : 0; return fed({ fs: P.fs, ord: d, qd: t * gf, ss: ss, n65: n65, year: y }).total; }
      function netOf(d, t, ro) { return d + t + ro + ss - tx(d, t); }
      var d = rmd, t = 0, ro = 0, conv = 0;
      if (strat === "brk") {
        var top = bracketTop(P.fs, Number(P.target));
        var fill = solveUp(function (x) { return fed({ fs: P.fs, ord: x, ss: ss, n65: n65, year: y }).ti; }, top, 0, D);
        d = Math.min(D, Math.max(rmd, fill));
      }
      if (strat === "pro") {
        var tot0 = T + D + R;
        var f = function (x) { var dd = Math.max(rmd, x * D / tot0); return netOf(Math.min(D, dd), Math.min(T, x * T / tot0), Math.min(R, x * R / tot0)); };
        if (tot0 > 0) { var lo = 0, hi = tot0; if (f(hi) < need) { d = D; t = T; ro = R; } else { for (var i = 0; i < 60; i++) { var m = (lo + hi) / 2; if (f(m) >= need) hi = m; else lo = m; } d = Math.min(D, Math.max(rmd, hi * D / tot0)); t = Math.min(T, hi * T / tot0); ro = Math.min(R, hi * R / tot0); } }
      } else {
        var net0 = netOf(d, 0, 0);
        if (net0 < need) {
          /* take from taxable first, then (conventional) more tax-deferred, then Roth; bracket strategy: taxable, then Roth, then more tax-deferred */
          var order = strat === "conv" ? ["t", "d", "r"] : ["t", "r", "d"];
          for (var k = 0; k < order.length && netOf(d, t, ro) < need - 0.5; k++) {
            var key = order[k];
            if (key === "t") t = netOf(d, T, ro) < need ? T : bis(function (x) { return netOf(d, x, ro); }, need, 0, T);
            if (key === "d") d = netOf(D, t, ro) < need ? D : bis(function (x) { return netOf(x, t, ro); }, need, d, D);
            if (key === "r") ro = netOf(d, t, R) < need ? R : bis(function (x) { return netOf(d, t, x); }, need, 0, R);
          }
        } else if (strat === "brk") { conv = Math.max(0, net0 - need); }
      }
      var taxY = tx(d, t), got = d + t + ro + ss - taxY;
      if (got < need - 1 && last === null) last = a;
      tot += taxY;
      var gfrac = T > 0 ? Bs / T : 0; Bs -= t * gfrac; T -= t; D -= d; R -= ro;
      var surplus = Math.max(0, got - need); if (strat === "brk") R += surplus; else { T += surplus; Bs += surplus; }
      T *= 1 + r; D *= 1 + r; R *= 1 + r;
      rows.push({ a: a, d: d, t: t, ro: ro, tax: taxY, total: T + D + R, after: T - Math.max(0, T - Bs) * 0.15 + D * (1 - P.heir) + R });
    }
    return { rows: rows, tax: tot, last: last, end: rows[rows.length - 1] };
  }
  function bis(f, target, lo, hi) { for (var i = 0; i < 60; i++) { var m = (lo + hi) / 2; if (f(m) >= target) hi = m; else lo = m; } return hi; }
  INV.s5bWdSim = wdSim; INV.s5bWdPresets = WD_PRE;
  TOOLS.s5bWithdraw = function (el) {
    var u = uid(el);
    shell(el, "Which account should pay the bills? Three withdrawal orders", "Simulator",
      '<div class="fld"><label>Household</label><div class="seg" role="group"><button type="button" data-v="ruth" aria-pressed="true">Ruth</button><button type="button" data-v="harper" aria-pressed="false">The Harpers, retiring now</button></div></div>' +
      sel(u + "-fs", "Filing status", FS3, "single") + numf(u + "-a1", "Age now (older spouse)", 68, 1) + numf(u + "-a2", "Spouse's age (0 if single)", 0, 1) +
      numf(u + "-tax", "Taxable account ($)", 60000, 5000) + rng(u + "-basis", "  cost basis as a share of value", 0, 100, 5, 100, "pct") + numf(u + "-trad", "Tax-deferred: IRA, 401(k) ($)", 780000, 5000) + numf(u + "-roth", "Roth ($)", 0, 5000) +
      numf(u + "-ss1", "Social Security, older spouse ($ a year)", 34800, 600) + numf(u + "-c1", "  claiming age", 66, 1) + numf(u + "-ss2", "Social Security, younger spouse ($ a year)", 0, 600) + numf(u + "-c2", "  claiming age", 67, 1) +
      numf(u + "-need", "Spending need after tax, including Social Security ($ a year)", 64000, 1000) + numf(u + "-rmd", "RMD age", 73, 1) +
      sel(u + "-target", "Bracket strategy: each year fill tax-deferred withdrawals up to the", [["0.10", "10% bracket"], ["0.12", "12% bracket"], ["0.22", "22% bracket"], ["0.24", "24% bracket"]], "0.12") +
      rng(u + "-r", "Return after inflation", 0, 6, 0.5, 3.5, "pct") + rng(u + "-heir", "Heirs' tax rate on tax-deferred money", 0, 40, 1, 24, "pct") + numf(u + "-horizon", "Plan through age", 95, 1) +
      note("In 2026 dollars; brackets and deductions held at 2026 levels. Conventional: taxable first, then tax-deferred, then Roth. Bracket-based: each year withdraw tax-deferred money up to the chosen bracket (converting any excess to Roth), then taxable, then Roth. Proportional: every account pays its share. RMDs are always taken. Gains in the taxable account are taxed when withdrawn; its dividends are ignored. Federal tax only."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    var map = { fs: "fs", a1: "a1", a2: "a2", tax: "tax", basis: "basis", trad: "trad", roth: "roth", need: "need", rmd: "rmd", target: "target" };
    el.querySelectorAll(".seg button").forEach(function (b) {
      b.addEventListener("click", function () {
        el.querySelectorAll(".seg button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        var p = WD_PRE[b.dataset.v]; Object.keys(map).forEach(function (k) { setv(el, map[k], p[k]); });
        if (b.dataset.v === "ruth") { setv(el, "ss1", 34800); setv(el, "c1", 66); setv(el, "ss2", 0); } else { setv(el, "ss1", 45600); setv(el, "c1", 67); setv(el, "ss2", 30000); setv(el, "c2", 67); }
        run();
      });
    });
    function run() {
      var P = { fs: self(el, "fs").value, a1: num(el, "a1") || 65, a2: num(el, "a2"), tax: num(el, "tax"), basis: num(el, "basis") / 100, trad: num(el, "trad"), roth: num(el, "roth"), ss1: num(el, "ss1"), c1: num(el, "c1"), ss2: num(el, "ss2"), c2: num(el, "c2"),
        need: num(el, "need"), rmd: Math.max(72, num(el, "rmd")), target: self(el, "target").value, r: num(el, "r") / 100, heir: num(el, "heir") / 100 };
      P.horizon = Math.min(100, Math.max(P.a1 + 1, num(el, "horizon")));
      var C = wdSim(P, "conv"), B = wdSim(P, "brk"), Pr = wdSim(P, "pro");
      var S = [["Conventional", C, "var(--s5)"], ["Bracket-based", B, "var(--s2)"], ["Proportional", Pr, "var(--s1)"]];
      var best = S.reduce(function (a, s) { return s[1].end.after > a[1].end.after ? s : a; });
      self(el, "k").innerHTML = S.map(function (s) { return kpi(s[0] + ": lifetime federal tax", money(s[1].tax)); }).join("") + S.map(function (s) { return kpi(s[0] + ": after-tax wealth at " + P.horizon, money(s[1].end.after), s === best ? "good" : ""); }).join("") +
        kpi("Money runs short (conventional)", C.last ? "age " + C.last : "never", C.last ? "bad" : "good");
      INV.lineChart(self(el, "c"), { label: "After-tax wealth by age", height: 250, xTitle: "Age", xFmt: yearFmt, yFmt: ms, zeroBase: false, series: S.map(function (s) { return { name: s[0], color: s[2], data: s[1].rows.map(function (x) { return [x.a + 1, Math.max(0, x.after)]; }) }; }) });
      self(el, "n2").innerHTML = "Every strategy spends the same " + money(P.need) + " a year. <b>" + best[0] + "</b> leaves the most after tax at " + P.horizon + ": " + money(best[1].end.after) + ", versus " + money(C.end.after) + " for the conventional order. " +
        "The conventional order pays little tax early and much more later, when RMDs and Social Security stack up; the bracket-based order evens taxable income out across the years.";
    }
    wire(el, run);
  };

  /* ---------- 12. The Social Security tax torpedo (INV-042) ---------- */
  TOOLS.s5bTorpedo = function (el) {
    var u = uid(el);
    shell(el, "The tax torpedo: marginal rate on each extra IRA dollar", "Calculator",
      sel(u + "-fs", "Filing status", [["single", "Single"], ["mfj", "Married filing jointly"]], "single") + numf(u + "-ss", "Social Security benefits ($ a year)", 34800, 600) +
      numf(u + "-q", "Qualified dividends and long-term gains ($)", 0, 500) + sel(u + "-n65", "People age 65 or older", [["0", "None"], ["1", "One"], ["2", "Two"]], "1") + numf(u + "-x", "IRA withdrawals and other ordinary income ($ a year)", 32400, 1000) +
      note("IRS Publication 915: up to 50% of benefits become taxable once other income plus half the benefits passes $25,000 (single) or $32,000 (joint), and up to 85% past $34,000 or $44,000. These thresholds are set in law and are not adjusted for inflation. Each extra IRA dollar can make $0.50 or $0.85 of benefits taxable too."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var fs = self(el, "fs").value, ss = num(el, "ss"), q = num(el, "q"), n65 = Number(self(el, "n65").value), x = num(el, "x");
      var pts = [], peak = { r: 0, x: 0 };
      for (var i = 0; i <= 150000; i += 1000) pts.push([i, margOrd({ fs: fs, ord: i, ss: ss, qd: q, n65: n65 }, 1000) * 100]);
      for (var j = 0; j <= 150000; j += 100) { var mm = margOrd({ fs: fs, ord: j, ss: ss, qd: q, n65: n65 }, 100) * 100; if (mm > peak.r + 0.05) peak = { r: mm, x: j }; }
      var here = fed({ fs: fs, ord: x, ss: ss, qd: q, n65: n65 }), mr = margOrd({ fs: fs, ord: x, ss: ss, qd: q, n65: n65 }, 1000) * 100;
      var br = here.ti > 0 ? TX.brk[fs].find(function (b) { return here.ordTI <= b[0]; })[1] * 100 : 0;
      self(el, "k").innerHTML = kpi("Taxable Social Security", money(here.taxableSS) + " of " + money(ss)) + kpi("Federal tax", money(here.total)) + kpi("Your bracket", br ? br + "%" : "none") + kpi("Marginal rate on the next $1,000", pct(mr, 1), mr > br + 1 ? "bad" : "") + kpi("Highest marginal rate", pct(peak.r, 1) + " near " + ms(peak.x));
      INV.lineChart(self(el, "c"), { label: "Marginal federal rate by IRA income", height: 240, xTitle: "IRA withdrawals and other ordinary income", yTitle: "Marginal rate on the next $1,000", xFmt: ms, yFmt: function (v) { return Math.round(v) + "%"; }, yMin: 0,
        series: [{ name: "Marginal rate", color: "var(--s5)", data: pts }], dots: [dot(x, mr, pct(mr, 1), "var(--s1)", 0, 150000)] });
      self(el, "n2").innerHTML = "At " + money(x) + " of IRA income the next $1,000 costs about <b>" + money(mr * 10) + "</b> of federal tax (" + pct(mr, 1) + "), though the bracket is " + (br || 0) + "%. The hump is the 'tax torpedo': while benefits are being pulled into taxable income, each dollar is taxed once for itself and again through the Social Security it drags in. Past the hump, the rate falls back to the bracket rate once 85% of benefits are already taxable.";
    }
    wire(el, run);
  };
})();
