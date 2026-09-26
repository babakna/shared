/* Investing Learning Lab - Stage 11 (Retirement) calculators, set s11b - V1.1 (September 2026)
   Tools: s11bPension (INV-080), s11bRmd (INV-081), s11bAnnuity (INV-082), s11bLtc (INV-083).
   Mortality: Social Security Administration, 2023 period life table as used in the 2026 Trustees Report
   (death probabilities q(x), ages 40-119). 417(e) rates: IRS minimum present value segment rates, January 2020 - May 2026.
   Taxes: tax year 2026 single-filer brackets and deductions from IRS Rev. Proc. 2025-32; senior deduction under
   IRC 151(d)(5)(C) (2025-2028 only); Social Security taxation per IRS Publication 915. Uniform Lifetime Table: IRS Pub. 590-B, Appendix B.
   Long-term care costs: CareScout (Genworth) Cost of Care Survey, 2025 national medians. */
(function () {
  "use strict";
  var INV = window.INV; if (!INV || !INV.tools) return;
  var esc = INV.esc, money = INV.money, ms = INV.moneyShort, pct = INV.pct;
  var TOOLS = INV.tools;

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
  function sel(id, label, opts, val) {
    return '<div class="fld"><label for="' + id + '">' + esc(label) + '</label><select id="' + id + '">' + opts.map(function (o) {
      return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(val) ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select></div>";
  }
  function self(el, id) { return el.querySelector("#" + el.dataset.uid + "-" + id); }
  function uid(el) { if (!el.dataset.uid) el.dataset.uid = "t" + Math.random().toString(36).slice(2, 8); return el.dataset.uid; }
  function fmtOut(input) {
    var o = input.parentNode.querySelector("output"); if (!o) return;
    var f = input.getAttribute("data-fmt"), v = Number(input.value);
    o.textContent = f === "pct" ? v.toFixed(input.step.indexOf(".") > -1 ? (input.step.split(".")[1].length) : 0) + "%" :
      f === "yr" ? v + (v === 1 ? " year" : " years") : f === "money" ? money(v) : f === "age" ? "age " + v : f === "day" ? "$" + v + " a day" : String(v);
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
  function num(el, id) { var v = Number(self(el, id).value); return isFinite(v) && v > 0 ? v : 0; }
  function ageFmt(v) { return String(Math.round(v)); }
  function segs(el, fn) {
    el.querySelectorAll(".seg button").forEach(function (b) {
      b.addEventListener("click", function () {
        el.querySelectorAll(".seg button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        el.querySelectorAll("[data-mode]").forEach(function (d) { d.hidden = d.getAttribute("data-mode") !== b.dataset.v; });
        fn(b.dataset.v);
      });
    });
  }

  /* ---------- data ---------- */
  /* SSA 2023 period life table (2026 Trustees Report): probability of dying within one year, exact ages 40..119 */
  var QM = [0.003115,0.003253,0.003419,0.0036,0.003777,0.003931,0.004073,0.004245,0.004477,0.004795,0.005126,0.005496,0.005917,0.006404,0.006923,0.007491,0.008173,0.008938,0.009714,0.010494,0.011337,0.012232,0.013196,0.014229,0.015316,0.016455,0.017574,0.018735,0.019981,0.021366,0.022903,0.024615,0.026504,0.028648,0.031071,0.033802,0.03701,0.041158,0.045461,0.050346,0.055633,0.061757,0.068358,0.07542,0.083364,0.09268,0.103459,0.115502,0.129018,0.14381,0.159458,0.176551,0.19536,0.216286,0.238799,0.262268,0.286291,0.310944,0.332325,0.349036,0.366568,0.38496,0.404252,0.424488,0.445712,0.467998,0.491398,0.515968,0.541766,0.568854,0.597297,0.627162,0.65852,0.691446,0.726018,0.762319,0.800435,0.840457,0.88248,0.926604];
  var QF = [0.001643,0.001742,0.001845,0.001954,0.002075,0.002187,0.002306,0.002438,0.002595,0.002791,0.00303,0.003288,0.003554,0.003847,0.004172,0.004532,0.004923,0.005365,0.005815,0.006333,0.006923,0.007555,0.00822,0.008881,0.009514,0.010188,0.01088,0.011659,0.012543,0.013581,0.014769,0.016153,0.017705,0.019495,0.021533,0.023846,0.026458,0.0297,0.033135,0.036982,0.041183,0.045959,0.051282,0.057262,0.064107,0.071752,0.08049,0.090566,0.102204,0.115178,0.129176,0.144229,0.160353,0.177635,0.196502,0.216846,0.23875,0.261359,0.283899,0.306491,0.32968,0.353333,0.3773,0.401416,0.425501,0.451031,0.478092,0.506778,0.537185,0.568854,0.597297,0.627162,0.65852,0.691446,0.726018,0.762319,0.800435,0.840457,0.88248,0.926604];
  /* IRS Notice 2025-40: 2026 static mortality tables under IRC 430(h)(3)(A), ages 40..120 (males, females),
     and the unisex table for 417(e)(3) distributions with annuity starting dates in stability periods beginning in 2026 */
  var PM = [0.00073,0.00074,0.00076,0.00078,0.0008,0.00082,0.00087,0.00091,0.00096,0.00103,0.00111,0.00122,0.00135,0.00151,0.0017,0.00203,0.00249,0.00291,0.00339,0.0039,0.00451,0.00515,0.00605,0.00692,0.00762,0.00847,0.00942,0.01038,0.01144,0.01263,0.01398,0.01551,0.01722,0.01919,0.02141,0.02396,0.02687,0.03021,0.03407,0.03852,0.04373,0.04931,0.05561,0.06273,0.07081,0.08006,0.09051,0.10226,0.11542,0.12991,0.14568,0.16231,0.17934,0.19669,0.2141,0.23144,0.24977,0.26837,0.28726,0.30664,0.32616,0.34569,0.36491,0.38377,0.40229,0.41993,0.43708,0.45333,0.4689,0.4838,0.49309,0.49433,0.49557,0.49686,0.4982,0.49945,0.4997,0.49985,0.4999,0.5,1];
  var PF = [0.00036,0.00038,0.0004,0.00042,0.00045,0.00047,0.0005,0.00054,0.00058,0.00063,0.00069,0.00078,0.00089,0.00099,0.00113,0.00136,0.00167,0.00192,0.00222,0.00254,0.00294,0.00338,0.00402,0.00471,0.00528,0.0061,0.00696,0.00774,0.00857,0.00952,0.01066,0.01197,0.01347,0.01515,0.01715,0.01944,0.02206,0.02501,0.02833,0.03204,0.03657,0.04093,0.04578,0.05121,0.05732,0.06426,0.07227,0.08138,0.09183,0.10352,0.11656,0.13002,0.14406,0.15865,0.17355,0.18885,0.2052,0.22221,0.23999,0.2584,0.27739,0.2968,0.31628,0.33576,0.35515,0.37436,0.39316,0.41147,0.42899,0.44578,0.46181,0.47708,0.49146,0.49761,0.4986,0.4996,0.4998,0.4999,0.5,0.5,1];
  var QU = [0.00055,0.00056,0.00058,0.0006,0.00063,0.00065,0.00069,0.00073,0.00077,0.00083,0.0009,0.001,0.00112,0.00125,0.00142,0.0017,0.00208,0.00242,0.00281,0.00322,0.00373,0.00427,0.00504,0.00582,0.00645,0.00729,0.00819,0.00906,0.01001,0.01108,0.01232,0.01374,0.01535,0.01717,0.01928,0.0217,0.02447,0.02761,0.0312,0.03528,0.04015,0.04512,0.0507,0.05697,0.06407,0.07216,0.08139,0.09182,0.10363,0.11672,0.13112,0.14617,0.1617,0.17767,0.19383,0.21015,0.22749,0.24529,0.26363,0.28252,0.30178,0.32125,0.3406,0.35977,0.37872,0.39715,0.41512,0.4324,0.44895,0.46479,0.47745,0.48571,0.49352,0.49724,0.4984,0.49953,0.49975,0.49988,0.49995,0.5,1];
  /* IRS minimum present value segment rates under IRC 417(e)(3)(D), percent */
  var SEG = [["Jan-20",1.91,2.93,3.54],["Feb-20",1.73,2.72,3.35],["Mar-20",2.22,3.08,3.73],["Apr-20",1.58,2.88,3.24],["May-20",1.08,2.78,3.47],["Jun-20",0.74,2.57,3.32],["Jul-20",0.59,2.25,3.01],["Aug-20",0.52,2.22,3.03],["Sep-20",0.51,2.31,3.15],["Oct-20",0.54,2.38,3.28],["Nov-20",0.53,2.31,3.09],["Dec-20",0.51,2.26,3.01],["Jan-21",0.5,2.38,3.17],["Feb-21",0.51,2.54,3.45],["Mar-21",0.69,2.92,3.69],["Apr-21",0.67,2.84,3.47],["May-21",0.61,2.84,3.54],["Jun-21",0.63,2.7,3.32],["Jul-21",0.63,2.51,3.1],["Aug-21",0.66,2.5,3.12],["Sep-21",0.7,2.55,3.06],["Oct-21",0.87,2.74,3.16],["Nov-21",1.02,2.72,3.08],["Dec-21",1.16,2.72,3.1],["Jan-22",1.41,3.02,3.36],["Feb-22",1.88,3.35,3.7],["Mar-22",2.44,3.71,3.94],["Apr-22",3.0,4.22,4.17],["May-22",3.23,4.59,4.69],["Jun-22",3.64,4.8,4.78],["Jul-22",3.67,4.67,4.73],["Aug-22",3.79,4.62,4.69],["Sep-22",4.48,5.26,5.07],["Oct-22",5.1,5.83,5.68],["Nov-22",5.09,5.6,5.41],["Dec-22",4.84,5.15,4.85],["Jan-23",4.74,4.98,4.84],["Feb-23",4.99,5.12,4.96],["Mar-23",5.0,5.2,5.15],["Apr-23",4.77,4.97,5.13],["May-23",4.91,5.15,5.34],["Jun-23",5.26,5.23,5.16],["Jul-23",5.35,5.28,5.1],["Aug-23",5.45,5.52,5.43],["Sep-23",5.58,5.66,5.56],["Oct-23",5.77,6.14,6.19],["Nov-23",5.5,5.76,5.83],["Dec-23",5.01,5.13,5.15],["Jan-24",4.89,5.14,5.29],["Feb-24",4.97,5.22,5.37],["Mar-24",4.99,5.19,5.37],["Apr-24",5.24,5.48,5.61],["May-24",5.18,5.41,5.62],["Jun-24",5.09,5.28,5.52],["Jul-24",4.92,5.25,5.59],["Aug-24",4.5,4.96,5.4],["Sep-24",4.17,4.76,5.25],["Oct-24",4.42,5.04,5.46],["Nov-24",4.66,5.25,5.57],["Dec-24",4.65,5.28,5.63],["Jan-25",4.74,5.55,5.92],["Feb-25",4.65,5.38,5.81],["Mar-25",4.5,5.33,5.86],["Apr-25",4.51,5.49,6.07],["May-25",4.5,5.57,6.23],["Jun-25",4.43,5.46,6.13],["Jul-25",4.38,5.41,6.13],["Aug-25",4.2,5.29,6.08],["Sep-25",4.06,5.12,5.93],["Oct-25",4.01,5.04,5.83],["Nov-25",4.07,5.15,6.01],["Dec-25",4.03,5.17,6.11],["Jan-26",4.03,5.2,6.12],["Feb-26",3.96,5.15,6.11],["Mar-26",4.24,5.35,6.25],["Apr-26",4.27,5.34,6.22],["May-26",4.42,5.47,6.31]];
  /* IRS Pub. 590-B Appendix B, Table III (Uniform Lifetime), ages 72..120 */
  var ULT = [27.4,26.5,25.5,24.6,23.7,22.9,22.0,21.1,20.2,19.4,18.5,17.7,16.8,16.0,15.2,14.4,13.7,12.9,12.2,11.5,10.8,10.1,9.5,8.9,8.4,7.8,7.3,6.8,6.4,6.0,5.6,5.2,4.9,4.6,4.3,4.1,3.9,3.7,3.5,3.4,3.3,3.1,3.0,2.9,2.8,2.7,2.5,2.3,2.0];
  /* 2026 federal brackets, single filer (Rev. Proc. 2025-32, Table 3) */
  var BR = [[12400, 0.10], [50400, 0.12], [105700, 0.22], [201775, 0.24], [256225, 0.32], [640600, 0.35], [Infinity, 0.37]];
  /* 2026 qualified charitable distribution exclusion limit per person, IRC 408(d)(8)(A) as indexed (IRS Notice 2025-67) */
  var QCDMAX = 111000;

  /* ---------- shared math (exposed for page charts as INV.s11b) ---------- */
  /* sex codes: m, f = SSA general population; pm, pf = IRS 2026 pension table; u = IRS 2026 unisex 417(e) table */
  function q(sex, age, mult) {
    var t = sex === "m" ? QM : sex === "f" ? QF : sex === "pm" ? PM : sex === "pf" ? PF : QU;
    var a = Math.max(40, Math.min(39 + t.length, Math.floor(age)));
    return Math.min(1, t[a - 40] * (mult == null ? 1 : mult));
  }
  /* survival probabilities at each month m = 0..(120-age)*12, constant force within each year */
  function survival(sex, age, mult) {
    var out = [1], s = 1, a = Math.floor(age), months = (120 - a) * 12;
    for (var y = 0; y * 12 < months; y++) {
      var qq = q(sex, a + y, mult), p1 = Math.pow(1 - qq, 1 / 12);
      for (var k = 1; k <= 12; k++) { s *= p1; out.push(s); }
    }
    return out;
  }
  function lifeExp(sex, age, mult) { var a = Math.floor(age), l = 1, e = 0.5; for (var y = a; y < 120; y++) { l *= 1 - q(sex, y, mult); e += l; } return e; } /* SSA convention: curtate expectation + 0.5 */
  function probAlive(S, years) { var m = Math.round(years * 12); return m < S.length ? S[m] : 0; }
  /* expected PV of 1 per year, paid monthly in arrears, from month d*12 + 1, with COLA g, discount r */
  function annFactor(S, r, d, g, rateFn) {
    var pv = 0, start = Math.round((d || 0) * 12);
    for (var m = start + 1; m < S.length; m++) {
      var t = m / 12, i = rateFn ? rateFn(t) : r;
      pv += S[m] / 12 * Math.pow(1 + (g || 0), Math.max(0, Math.floor((m - 1) / 12) - (d || 0))) * Math.pow(1 + i, -t);
    }
    return pv;
  }
  function jointFactors(Sx, Sy, r, d, g) {
    var ax = 0, ay = 0, axy = 0, start = Math.round((d || 0) * 12), n = Math.max(Sx.length, Sy.length);
    for (var m = start + 1; m < n; m++) {
      var t = m / 12, v = Math.pow(1 + (g || 0), Math.max(0, Math.floor((m - 1) / 12) - (d || 0))) * Math.pow(1 + r, -t) / 12;
      var px = m < Sx.length ? Sx[m] : 0, py = m < Sy.length ? Sy[m] : 0;
      ax += px * v; ay += py * v; axy += px * py * v;
    }
    return { ax: ax, ay: ay, axy: axy };
  }
  function segRateFn(s1, s2, s3) { return function (t) { return (t <= 5 ? s1 : t <= 20 ? s2 : s3) / 100; }; }
  function ssTaxable(ss, other) {
    var pi = other + ss / 2;
    if (pi <= 25000) return 0;
    if (pi <= 34000) return Math.min(0.5 * ss, 0.5 * (pi - 25000));
    return Math.min(0.85 * ss, 0.85 * (pi - 34000) + Math.min(0.5 * ss, 4500));
  }
  function bracketRate(ti) { for (var i = 0; i < BR.length; i++) if (ti < BR[i][0]) return BR[i][1]; return 0.37; }
  function bracketTax(ti) { var t = 0, lo = 0; for (var i = 0; i < BR.length; i++) { var hi = BR[i][0]; if (ti > lo) t += (Math.min(ti, hi) - lo) * BR[i][1]; lo = hi; } return t; }
  /* federal tax for an unmarried filer age 65+, 2026 law held constant; senior deduction only in 2025-2028 */
  function fedTax(ss, ordinary, year, age) {
    var tss = ssTaxable(ss, ordinary), agi = ordinary + tss, old = age == null || age >= 65;
    var ded = 16100 + (old ? 2050 : 0) + (old && (year == null || year <= 2028) ? Math.max(0, 6000 - 0.06 * Math.max(0, agi - 75000)) : 0);
    var ti = Math.max(0, agi - ded);
    return { tax: bracketTax(ti), ti: ti, agi: agi, tss: tss, ded: ded };
  }
  function rmdAge(born) { return born >= 1960 ? 75 : born >= 1951 ? 73 : 72; }
  function ult(age) { return age < 72 ? ULT[0] : ULT[Math.min(ULT.length - 1, age - 72)]; }
  INV.s11b = { q: q, survival: survival, lifeExp: lifeExp, probAlive: probAlive, annFactor: annFactor, jointFactors: jointFactors,
    segRateFn: segRateFn, SEG: SEG, ULT: ULT, ult: ult, ssTaxable: ssTaxable, fedTax: fedTax, bracketTax: bracketTax, rmdAge: rmdAge };

  var sexOpts = [["f", "Female"], ["m", "Male"]];

  /* ---------- 1. Pension: lump sum versus lifetime income (INV-080) ---------- */
  TOOLS.s11bPension = function (el) {
    var u = uid(el);
    shell(el, "Pension: lump sum or lifetime income?", "Calculator",
      '<div class="fld"><label>Question</label><div class="seg" role="group"><button type="button" data-v="value" aria-pressed="true">Value the pension</button><button type="button" data-v="plan" aria-pressed="false">How the plan sets the lump sum</button></div></div>' +
      numf(u + "-b", "Monthly pension, single-life amount ($)", 2000, 50) +
      rng(u + "-a", "Your age today", 50, 80, 1, 65, "age") +
      rng(u + "-d", "Years until payments start", 0, 15, 1, 0, "yr") +
      sel(u + "-s", "Your sex (life table)", sexOpts, "m") +
      '<div data-mode="value">' +
      sel(u + "-lt", "Life table for valuing", [["irs", "Pension-plan participants (IRS 2026 table)"], ["ssa", "General population (SSA 2023 table)"]], "irs") +
      sel(u + "-sv", "Payment form", [["0", "Single life (stops at your death)"], ["50", "Joint and 50% survivor"], ["75", "Joint and 75% survivor"], ["100", "Joint and 100% survivor"]], "0") +
      rng(u + "-cut", "Cut to your check for the survivor option", 0, 30, 1, 10, "pct") +
      rng(u + "-sa", "Spouse's age today", 45, 85, 1, 63, "age") +
      sel(u + "-ss", "Spouse's sex", sexOpts, "f") +
      rng(u + "-g", "Yearly cost-of-living raise (COLA)", 0, 3, 0.5, 0, "pct") +
      rng(u + "-r", "Discount rate (what the lump sum could safely earn)", 1, 8, 0.25, 5, "pct") +
      numf(u + "-ls", "Lump sum offered ($)", 285000, 1000) + "</div>" +
      '<div data-mode="plan" hidden>' +
      rng(u + "-s1", "First segment rate, years 0-5", 0, 8, 0.01, 4.42, "pct") +
      rng(u + "-s2", "Second segment rate, years 5-20", 0, 8, 0.01, 5.47, "pct") +
      rng(u + "-s3", "Third segment rate, after 20 years", 0, 8, 0.01, 6.31, "pct") + "</div>" +
      '<p class="hint" style="font-size:.76rem;color:var(--muted)">The plan\'s lump sum uses the IRS 2026 unisex 417(e) table (Notice 2025-40). Valuing uses the table you pick, by sex. Plans may pay more than the minimum and use their own lookback month; results are estimates, before taxes.</p>',
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    var mode = "value";
    segs(el, function (m) { mode = m; run(); });
    function run() {
      var B = num(el, "b"), a = Number(self(el, "a").value), d = Number(self(el, "d").value), sx0 = self(el, "s").value, irs = self(el, "lt").value === "irs";
      var sx = (irs ? "p" : "") + sx0, Sx = survival(sx, a);
      if (mode === "plan") {
        var s1 = Number(self(el, "s1").value), s2 = Number(self(el, "s2").value), s3 = Number(self(el, "s3").value);
        var Su = survival("u", a), fac = annFactor(Su, 0, d, 0, segRateFn(s1, s2, s3)), lump = B * 12 * fac;
        var hist = SEG.map(function (x, i) { return [i, B * 12 * annFactor(Su, 0, d, 0, segRateFn(x[1], x[2], x[3]))]; });
        var lo = hist.reduce(function (m, p) { return p[1] < m[1] ? p : m; }), hi = hist.reduce(function (m, p) { return p[1] > m[1] ? p : m; });
        self(el, "k").innerHTML = kpi("Estimated minimum lump sum", money(lump)) + kpi("Per $1 of yearly pension", "$" + fac.toFixed(2)) +
          kpi("Highest, Jan 2020 to May 2026", money(hi[1]), "good") + kpi("Lowest in that period", money(lo[1]), "bad");
        INV.lineChart(self(el, "c"), { label: "Lump sum under each month's IRS segment rates", height: 250, yFmt: ms, zeroBase: false,
          xTicks: self(el, "c").clientWidth < 520 ? [0, 24, 48, 72] : [0, 12, 24, 36, 48, 60, 72], xFmt: function (v) { var s = SEG[Math.max(0, Math.min(SEG.length - 1, Math.round(v)))]; return s ? s[0] : ""; },
          xTitle: "IRS segment-rate month", series: [{ name: "Lump sum for this pension", color: "var(--s1)", data: hist }],
          dots: [{ x: hi[0], y: hi[1], color: "var(--s2)" }, { x: lo[0], y: lo[1], color: "var(--s5)" }] });
        self(el, "n").innerHTML = "Each future monthly payment is multiplied by the chance you are alive to receive it, then discounted at the first segment rate if it falls within 5 years, the second if within 5 to 20 years, and the third after that. " +
          "With these rates the plan's minimum lump sum is about <b>" + money(lump) + "</b>. The same pension would have been worth " + money(hi[1]) + " under " + SEG[hi[0]][0] + " rates and " + money(lo[1]) + " under " + SEG[lo[0]][0] + " rates: " +
          pct(lo[1] > 0 ? (hi[1] / lo[1] - 1) * 100 : 0, 0) + " more, for the same promise.";
        return;
      }
      var sv = Number(self(el, "sv").value) / 100, cut = sv > 0 ? Number(self(el, "cut").value) / 100 : 0, sa = Number(self(el, "sa").value), ssx = (irs ? "p" : "") + self(el, "ss").value,
        g = Number(self(el, "g").value) / 100, r = Number(self(el, "r").value) / 100, LS = num(el, "ls");
      el.querySelectorAll('[id$="-cut"],[id$="-sa"],[id$="-ss"]').forEach(function (f) { f.closest(".fld").style.opacity = sv > 0 ? "1" : ".45"; });
      var Sy = survival(ssx, sa), Bj = B * (1 - cut);
      function pvAt(rr) { if (sv === 0) return B * 12 * annFactor(Sx, rr, d, g); var j = jointFactors(Sx, Sy, rr, d, g); return Bj * 12 * (j.ax + sv * (j.ay - j.axy)); }
      var PV = pvAt(r);
      var be = null, lo2 = pvAt(0), hi2 = pvAt(0.2);
      if (LS > 0 && LS < lo2 && LS > hi2) { var x0 = 0, x1 = 0.2; for (var k = 0; k < 60; k++) { var xm = (x0 + x1) / 2; if (pvAt(xm) > LS) x0 = xm; else x1 = xm; } be = (x0 + x1) / 2; }
      var fairCut = 0;
      if (sv > 0) { var jj = jointFactors(Sx, Sy, r, d, g); var single = annFactor(Sx, r, d, g); fairCut = 1 - single / (jj.ax + sv * (jj.ay - jj.axy)); }
      var p90 = sv > 0 ? 1 - (1 - probAlive(Sx, 90 - a)) * (1 - probAlive(Sy, 90 - a)) : probAlive(Sx, 90 - a);
      self(el, "k").innerHTML = kpi("Pension worth today", money(PV), PV >= LS ? "good" : "") + kpi("Lump sum offered", money(LS), LS > PV ? "good" : "") +
        kpi("Rate that makes them equal", LS <= 0 ? "no offer entered" : be == null ? (LS >= lo2 ? "below 0%" : "above 20%") : pct(be * 100, 2)) +
        kpi(sv > 0 ? "Chance a check is paid when you would be 90" : "Chance you reach 90", pct(p90 * 100, 0));
      var pts = [], lsl = [];
      for (var x = 1; x <= 8.001; x += 0.25) { pts.push([x, pvAt(x / 100)]); lsl.push([x, LS]); }
      INV.lineChart(self(el, "c"), { label: "Value of the pension by discount rate", height: 240, xTitle: "Discount rate (%)", yFmt: ms, xFmt: function (v) { return v + "%"; }, zeroBase: false,
        series: [{ name: "Pension, valued today", color: "var(--s1)", data: pts }, { name: "Lump sum offered", color: "var(--s3)", data: lsl, dash: "5 4" }],
        dots: [{ x: r * 100, y: PV, color: "var(--s1)" }] });
      var le = lifeExp(sx, a);
      self(el, "n").innerHTML = "Life expectancy from the " + (irs ? "IRS 2026 pension" : "SSA 2023 population") + " table at " + a + ": about <b>" + le.toFixed(1) + " more years</b> (to about " + Math.round(a + le) + "). " +
        "Weighting every check by the chance someone is alive to cash it and discounting at " + pct(r * 100, 2) + ", the pension is worth <b>" + money(PV) + "</b>" +
        (LS > 0 ? (PV >= LS ? ", more than the lump sum. To beat the pension, the lump sum would have to earn about " + (be == null ? "more than the range shown" : pct(be * 100, 2)) + " a year with the same safety."
          : ", less than the lump sum at this rate" + (be == null ? "." : "; the pension wins only if safe money earns less than " + pct(be * 100, 2) + ".")) : ".") +
        (sv > 0 ? " At this discount rate, a cut of about " + pct(fairCut * 100, 1) + " would be actuarially fair for this survivor option; the plan's actual cut is " + pct(cut * 100, 0) + "." : "");
    }
    wire(el, run);
  };

  /* ---------- 2. RMD projector (INV-081) ---------- */
  TOOLS.s11bRmd = function (el) {
    var u = uid(el);
    shell(el, "Required minimum distribution projector", "Calculator",
      numf(u + "-b", "Traditional IRA balance, end of 2025 ($)", 780000, 5000) +
      rng(u + "-by", "Year of birth", 1951, 1965, 1, 1958) +
      rng(u + "-r", "Return after inflation", 0, 7, 0.5, 3, "pct") +
      numf(u + "-ss", "Social Security per year ($)", 34800, 100) +
      numf(u + "-oi", "Other taxable income per year, such as CD interest ($)", 2400, 100) +
      numf(u + "-cv", "Roth conversion each year before RMDs begin ($)", 0, 1000) +
      numf(u + "-qc", "Qualified charitable distribution each year from age 71 ($)", 0, 500, "Capped at the 2026 limit of $111,000 a year.") +
      '<p class="hint" style="font-size:.76rem;color:var(--muted)">In today\'s dollars. Federal tax for a single filer, using 2026 brackets and deductions throughout; the extra deductions for age 65+, including the $6,000 senior deduction, apply from 65, and the senior deduction only through 2028, as the law now reads. Assumes each RMD is taken by December 31 of its year.</p>',
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><div id="' + u + '-c2"></div><p class="tool-note" id="' + u + '-n"></p>');
    function project(B0, born, r, ss, oi, cv, qc) {
      var ra = rmdAge(born), b = B0, roth = 0, rows = [], tax = 0;
      for (var y = 2026; y - born <= 95; y++) {
        var age = y - born; if (age < 60) { b *= 1 + r; continue; }
        var rmd = age >= ra ? b / ult(age) : 0, qcd = age >= 71 ? Math.min(qc, QCDMAX, b) : 0, wd = Math.min(Math.max(rmd, qcd), b), conv = age < ra ? Math.min(cv, b - wd) : 0;
        var taxable = wd - Math.min(qcd, wd) + conv, t = fedTax(ss, oi + taxable, y, age);
        var mt = (fedTax(ss, oi + taxable + 100, y, age).tax - t.tax) / 100;
        rows.push({ y: y, age: age, bal: b, rmd: rmd, wd: wd, conv: conv, qcd: qcd, taxable: taxable, tax: t.tax, ti: t.ti, mt: mt, roth: roth });
        tax += t.tax; b = (b - wd - conv) * (1 + r); roth = (roth + conv) * (1 + r);
      }
      return { rows: rows, tax: tax, end: b, roth: roth, ra: ra };
    }
    function run() {
      var B0 = num(el, "b"), born = Number(self(el, "by").value), r = Number(self(el, "r").value) / 100,
        ss = num(el, "ss"), oi = num(el, "oi"), cv = num(el, "cv"), qc = num(el, "qc");
      var P = project(B0, born, r, ss, oi, cv, qc), P0 = project(B0, born, r, ss, oi, 0, qc);
      var first = P.rows.filter(function (x) { return x.rmd > 0; })[0] || { y: born + P.ra, age: P.ra, rmd: 0, mt: 0, ti: 0 };
      var at85 = P.rows.filter(function (x) { return x.age === 85; })[0] || { rmd: 0 };
      var totR = P.rows.reduce(function (s, x) { return s + x.rmd; }, 0);
      self(el, "k").innerHTML = kpi("First RMD (" + first.y + ", age " + first.age + ")", money(first.rmd)) + kpi("RMD at 85", money(at85.rmd)) +
        kpi("Effective marginal rate, first RMD year", pct(first.mt * 100, 1), first.mt > 0.2 ? "bad" : "") +
        kpi(cv > 0 ? "Federal tax to 95 vs. no conversions" : "Federal tax, age " + Math.max(60, 2026 - born) + " to 95", cv > 0 ? (P.tax <= P0.tax ? "−" : "+") + money(Math.abs(P.tax - P0.tax)) : money(P.tax), cv > 0 ? (P.tax <= P0.tax ? "good" : "bad") : "");
      var bal = P.rows.map(function (x) { return [x.age, x.bal]; }), rth = P.rows.map(function (x) { return [x.age, x.roth]; });
      INV.lineChart(self(el, "c"), { label: "IRA balance by age", height: 230, xTitle: "Age", yFmt: ms, xFmt: ageFmt,
        series: [{ name: "Traditional IRA (start of year)", color: "var(--s1)", data: bal, area: true }].concat(cv > 0 ? [{ name: "Roth IRA from conversions", color: "var(--s2)", data: rth }] : []),
        marks: [{ x: P.ra, label: "RMDs begin at " + P.ra }] });
      INV.lineChart(self(el, "c2"), { label: "Taxable IRA income and federal tax by age", height: 220, xTitle: "Age", yFmt: ms, xFmt: ageFmt,
        series: [{ name: "Taxable IRA withdrawals and conversions", color: "var(--s3)", data: P.rows.map(function (x) { return [x.age, x.taxable]; }) },
          { name: "Federal income tax", color: "var(--s5)", data: P.rows.map(function (x) { return [x.age, x.tax]; }) }] });
      self(el, "n").innerHTML = "Born in " + born + ", required distributions start at <b>" + P.ra + "</b>. Each year's RMD is the prior December 31 balance divided by the IRS Uniform Lifetime Table divisor for that age (26.5 at 73, 24.6 at 75, 16.0 at 85). " +
        "Total RMDs to age 95: " + money(totR) + ". In the first RMD year, an extra $100 of IRA income raises federal tax by about $" + (first.mt * 100).toFixed(0) +
        (first.mt > bracketRate(first.ti || 0) + 0.005 ? " — more than the " + Math.round(bracketRate(first.ti || 0) * 100) + "% bracket rate, because each extra dollar also makes more Social Security taxable." : ".") +
        (cv > 0 ? " With " + money(cv) + " converted each year before " + P.ra + ", the IRA at 95 is " + money(P.end) + " (versus " + money(P0.end) + ") and the Roth is " + money(P.roth) + "." : "");
    }
    wire(el, run);
  };

  /* ---------- 3. Income annuity pricing and income floor (INV-082) ---------- */
  TOOLS.s11bAnnuity = function (el) {
    var u = uid(el);
    shell(el, "Income annuity: what $1 buys, and why", "Calculator",
      '<div class="fld"><label>Question</label><div class="seg" role="group"><button type="button" data-v="price" aria-pressed="true">Price an annuity</button><button type="button" data-v="floor" aria-pressed="false">Build an income floor</button></div></div>' +
      numf(u + "-p", "Premium ($)", 100000, 1000) +
      rng(u + "-a", "Age at purchase", 50, 85, 1, 70, "age") +
      sel(u + "-s", "Sex (life table)", sexOpts, "f") +
      rng(u + "-d", "Years before income starts (0 = immediate)", 0, 20, 1, 0, "yr") +
      rng(u + "-r", "Interest rate the insurer earns", 1, 7, 0.25, 4.5, "pct") +
      rng(u + "-m", "Buyer's mortality vs. population average", 60, 120, 5, 85, "pct") +
      rng(u + "-l", "Insurer costs and profit (share of premium)", 0, 15, 1, 5, "pct") +
      '<div data-mode="floor" hidden>' + numf(u + "-es", "Essential spending per year ($)", 48000, 500) + numf(u + "-gi", "Social Security and pensions per year ($)", 34800, 500) + numf(u + "-pf", "Savings available ($)", 840000, 5000) + "</div>" +
      '<p class="hint" style="font-size:.76rem;color:var(--muted)">A pricing model, not a quote: level income paid monthly for life, no refund, using the SSA 2023 period life table scaled for healthier buyers. Real quotes depend on the insurer, product features, and rates on the day.</p>',
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    var mode = "price";
    segs(el, function (m) { mode = m; run(); });
    function price(age, sx, d, r, mult, load) {
      var S = survival(sx, age, mult), f = annFactor(S, r, d, 0), cf = 0, n = Math.max(1, (100 - age) * 12);
      for (var m = Math.round(d * 12) + 1; m <= n; m++) cf += Math.pow(1 + r, -m / 12) / 12;
      return { life: f > 0 ? (1 - load) / f : 0, cert: cf > 0 ? 1 / cf : 0, S: S };
    }
    function run() {
      var P = num(el, "p"), a = Number(self(el, "a").value), sx = self(el, "s").value, d = Number(self(el, "d").value), r = Number(self(el, "r").value) / 100,
        mult = Number(self(el, "m").value) / 100, load = Number(self(el, "l").value) / 100;
      var pr = price(a, sx, d, r, mult, load), inc = P * pr.life, cert = d >= 100 - a ? 0 : P * pr.cert;
      if (mode === "floor") {
        var es = num(el, "es"), gi = num(el, "gi"), pf = num(el, "pf"), gap = Math.max(0, es - gi), cost = pr.life > 0 ? gap / pr.life : 0;
        self(el, "k").innerHTML = kpi("Essential spending gap", money(gap)) + kpi("Payout per $100,000", money(100000 * pr.life)) + kpi("Premium to close the gap", money(cost)) +
          kpi("Share of savings", pf > 0 ? pct(Math.min(999, cost / pf * 100), 0) : "no savings entered", pf > 0 && cost > pf ? "bad" : "");
        INV.barChart(self(el, "c"), { label: "Income floor", height: 230, allLabels: true, valueLabels: true, yFmt: ms,
          data: [{ label: "Essential spending", y: es, color: "var(--s6)" }, { label: "Social Security and pensions", y: gi, color: "var(--s2)" }, { label: "Annuity to buy", y: gap, color: "var(--s1)" }, { label: "Left invested", y: Math.max(0, pf - cost), color: "var(--s3)", tip: "Savings left invested (not income)" }] });
        self(el, "n").innerHTML = "Guaranteed income of " + money(gi) + " covers " + pct(es > 0 ? Math.min(100, gi / es * 100) : 100, 0) + " of essential spending. Closing the " + money(gap) + " gap with a life annuity at this model's price takes about <b>" + money(cost) + "</b>" +
          (pf > 0 ? ", leaving " + money(Math.max(0, pf - cost)) + " invested for flexibility, emergencies and heirs." : ".") + " A level annuity loses buying power to inflation; the floor needs reviewing, or an inflation-adjusted product, over a long retirement.";
        return;
      }
      self(el, "k").innerHTML = kpi("Income for life, per year", money(inc)) + kpi("Payout rate", pct(P > 0 ? inc / P * 100 : pr.life * 100, 2)) +
        kpi("Same money spent evenly to 100", cert > 0 ? money(cert) : "starts after 100") + kpi("Mortality credit", cert > 0 ? (inc >= cert ? "+" : "−") + money(Math.abs(inc - cert)) : money(inc), inc >= cert ? "good" : "bad");
      var ages = [], lifeS = [], certS = [];
      for (var x = 50; x <= 85; x += 1) { var pp = price(x, sx, d, r, mult, load); ages.push(x); lifeS.push([x, pp.life * 100]); certS.push([x, d >= 100 - x ? NaN : pp.cert * 100]); }
      INV.lineChart(self(el, "c"), { label: "Payout rate by age at purchase", height: 240, xTitle: "Age at purchase", yTitle: "Income per $100 of premium, per year", xFmt: ageFmt, yFmt: function (v) { return "$" + v.toFixed(0); }, tipFmt: function (v) { return "$" + v.toFixed(2); },
        series: [{ name: "Life annuity (pools longevity)", color: "var(--s1)", data: lifeS }, { name: "Spend evenly to age 100 (no pooling)", color: "var(--s3)", data: certS, dash: "5 4" }],
        dots: [{ x: a, y: pr.life * 100, color: "var(--s1)" }] });
      var le = lifeExp(sx, a, mult);
      self(el, "n").innerHTML = "At " + a + ", life expectancy in this table is about " + le.toFixed(1) + " years, and there is a " + pct(probAlive(pr.S, 100 - a) * 100, 0) + " chance of reaching 100. " +
        "An annuity can pay <b>" + money(inc) + "</b> a year for life because the money of buyers who die early stays in the pool and pays those who live longer: the <b>mortality credit</b>. " +
        "Spending the same premium evenly to 100 at " + pct(r * 100, 2) + " gives " + (cert > 0 ? money(cert) : "nothing before 100") + " a year and stops at 100. " + (d > 0 ? "Deferring income " + d + " years raises each payment because the insurer earns interest meanwhile and some buyers will not live to collect." : "");
    }
    wire(el, run);
  };

  /* ---------- 4. Long-term care: self-funding versus insurance (INV-083) ---------- */
  var CARE = { nhp: ["Nursing home, private room", 129575, "Nursing home, private"], nhs: ["Nursing home, semi-private room", 114975, "Nursing home, shared"], al: ["Assisted living community", 74400, "Assisted living"], hc: ["Home care, 44 hours a week", 80080, "Home care, 44 h/wk"] };
  TOOLS.s11bLtc = function (el) {
    var u = uid(el);
    shell(el, "Long-term care: what a care episode costs, and who pays", "Calculator",
      sel(u + "-t", "Type of care (2025 national median cost)", Object.keys(CARE).map(function (k) { return [k, CARE[k][2] + " " + ms(CARE[k][1])]; }), "hc") +
      rng(u + "-w", "Years until care begins", 0, 30, 1, 12, "yr") +
      rng(u + "-y", "Years of care needed", 0.5, 8, 0.5, 3, "yr") +
      rng(u + "-g", "Care cost growth per year", 0, 7, 0.5, 3, "pct") +
      rng(u + "-r", "Return on money set aside", 0, 7, 0.5, 4, "pct") +
      rng(u + "-db", "Policy daily benefit today (0 = no policy)", 0, 400, 10, 0, "day") +
      rng(u + "-bp", "Policy benefit period", 1, 6, 1, 3, "yr") +
      sel(u + "-ep", "Elimination (waiting) period", [["0", "0 days"], ["30", "30 days"], ["90", "90 days"], ["180", "180 days"]], "90") +
      rng(u + "-ir", "Policy inflation protection (compound)", 0, 5, 1, 3, "pct") +
      '<p class="hint" style="font-size:.76rem;color:var(--muted)">Costs: CareScout Cost of Care Survey, 2025 national medians; your area may differ widely. Policy pays the lower of its daily benefit or the daily cost. Before taxes.</p>',
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var t = self(el, "t").value, w = Number(self(el, "w").value), yrs = Number(self(el, "y").value), g = Number(self(el, "g").value) / 100, r = Number(self(el, "r").value) / 100,
        db = Number(self(el, "db").value), bp = Number(self(el, "bp").value), ep = Number(self(el, "ep").value), ir = Number(self(el, "ir").value) / 100;
      var base = CARE[t] ? CARE[t][1] : CARE.hc[1], days = Math.round(yrs * 365), total = 0, paid = 0, pvOut = 0, cumC = [[0, 0]], cumP = [[0, 0]], maxBenDays = bp * 365;
      el.querySelectorAll('[id$="-bp"],[id$="-ep"],[id$="-ir"]').forEach(function (f) { f.closest(".fld").style.opacity = db > 0 ? "1" : ".45"; });
      for (var dd = 0; dd < days; dd++) {
        var yr = w + dd / 365, cost = base / 365 * Math.pow(1 + g, yr), ben = 0;
        if (db > 0 && dd >= ep && dd - ep < maxBenDays) ben = Math.min(cost, db * Math.pow(1 + ir, yr));
        total += cost; paid += ben; pvOut += (cost - ben) * Math.pow(1 + r, -yr);
        if ((dd + 1) % 30 === 0 || dd === days - 1) { cumC.push([(dd + 1) / 365, total]); cumP.push([(dd + 1) / 365, paid]); }
      }
      self(el, "k").innerHTML = kpi("Total cost of care", money(total)) + kpi("Paid by the policy", money(paid), paid > 0 ? "good" : "") + kpi("Paid from your own money", money(total - paid), "bad") +
        kpi("To set aside today", money(pvOut));
      INV.lineChart(self(el, "c"), { label: "Cumulative cost of the care episode", height: 240, xTitle: "Years of care", yFmt: ms, xFmt: function (v) { return v.toFixed(1); },
        series: [{ name: "Cost of care", color: "var(--s5)", data: cumC, area: true }, { name: "Paid by the policy", color: "var(--s2)", data: cumP }] });
      self(el, "n").innerHTML = (CARE[t] ? CARE[t][0] : "Care") + " costs " + money(base) + " a year at today's national median. Starting in " + w + (w === 1 ? " year" : " years") + " and lasting " + yrs + (yrs === 1 ? " year" : " years") + " with costs rising " + pct(g * 100, 1) + " a year, the episode costs <b>" + money(total) + "</b>. " +
        (db > 0 ? "A $" + db + "-a-day policy with a " + ep + "-day waiting period and a " + bp + "-year benefit period pays " + money(paid) + " (" + pct(total > 0 ? paid / total * 100 : 0, 0) + "). " : "With no policy, every dollar comes from savings, family or, after spending down, Medicaid. ") +
        "Funding the rest in advance at " + pct(r * 100, 1) + " takes about <b>" + money(pvOut) + "</b> today.";
    }
    wire(el, run);
  };
})();
