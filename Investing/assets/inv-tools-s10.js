/* Investing Learning Lab - Stage 10 (Financial Independence) calculators - V1.0 (September 2026)
   Tools for INV-072, INV-073 and INV-074. Each tool computes from its stated formula in the browser.
   Sources: IRS Notice 2022-6 and 26 CFR 1.401(a)(9)-9 (72(t) tables and mortality rates);
   Rev. Rul. 2026-17 (September 2026 federal mid-term rate); Rev. Proc. 2025-25 (2026 applicable
   percentage table); HHS 2025 poverty guidelines (used for 2026 marketplace coverage);
   Damodaran, NYU Stern (historical returns, window.INV_RETURNS). */
(function () {
  "use strict";
  var INV = window.INV; if (!INV || !INV.tools) return;
  var esc = INV.esc, money = INV.money, ms = INV.moneyShort, pct = INV.pct;
  var TOOLS = INV.tools;

  /* ---------- local copies of the shared helper style ---------- */
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
  function self(el, id) { return el.querySelector("#" + el.dataset.uid + "-" + id); }
  function uid(el) { if (!el.dataset.uid) el.dataset.uid = "t" + Math.random().toString(36).slice(2, 8); return el.dataset.uid; }
  function fmtOut(input) {
    var o = input.parentNode.querySelector("output"); if (!o) return;
    var f = input.getAttribute("data-fmt"), v = Number(input.value);
    o.textContent = f === "pct" ? v.toFixed(input.step.indexOf(".") > -1 ? (input.step.split(".")[1].length) : 0) + "%" :
      f === "yr" ? v + (v === 1 ? " year" : " years") : f === "money" ? money(v) : f === "age" ? "age " + v : f === "stk" ? v + "% stocks / " + (100 - v) + "% bonds" : f === "hh" ? v + (v === 1 ? " person" : " people") : String(v);
  }
  function wire(el, fn) {
    el.querySelectorAll("input,select").forEach(function (i) {
      i.addEventListener("input", function () { if (i.type === "range") fmtOut(i); fn(); });
      i.addEventListener("change", function () { fn(); });
      if (i.type === "range") fmtOut(i);
    });
    fn();
    document.addEventListener("inv-theme", fn);
  }
  function kpi(k, v, cls) { return '<div class="kpi"><div class="k">' + esc(k) + '</div><div class="v ' + (cls || "") + '">' + v + "</div></div>"; }
  function num(el, id) { var v = Number(self(el, id).value); return isFinite(v) && v > 0 ? v : 0; }
  function yearFmt(v) { return Math.abs(v - Math.round(v)) > 1e-9 ? "" : String(Math.round(v)); }
  function hint(t) { return '<p class="hint" style="font-size:.76rem;color:var(--muted)">' + t + "</p>"; }
  function seg(el, cb) {
    el.querySelectorAll(".seg button").forEach(function (b) {
      b.addEventListener("click", function () { el.querySelectorAll(".seg button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); cb(b.dataset.v); });
    });
  }

  /* ---------- shared math ---------- */
  /* Years to reach target T from P0, adding S at the end of each year, at real return r. */
  function yearsTo(T, P0, S, r) {
    if (P0 >= T) return 0;
    if (S <= 0 && P0 <= 0) return null;
    if (r <= 0) return S > 0 ? (T - P0) / S : null;
    var n = Math.log((T * r + S) / (P0 * r + S)) / Math.log(1 + r);
    return isFinite(n) ? n : null;
  }
  INV.s10yearsTo = yearsTo;
  function yrsTxt(n) { return n == null ? "Not reached" : n === 0 ? "Already there" : n > 100 ? "Over 100 years" : n.toFixed(1) + " years"; }

  /* ---------- 1. Savings rate to years to FI (INV-072) ---------- */
  TOOLS.s10YearsFI = function (el) {
    var u = uid(el);
    shell(el, "Savings rate to years to financial independence", "Calculator",
      numf(u + "-i", "Take-home pay per year ($)", 60000, 1000, "After taxes; the base for the savings rate") +
      rng(u + "-s", "Savings rate (share of take-home pay)", 5, 90, 1, 25, "pct") +
      numf(u + "-p", "Already invested ($)", 0, 1000) +
      rng(u + "-r", "Real return (after inflation)", 0, 10, 0.5, 5, "pct") +
      rng(u + "-w", "Withdrawal rate at FI", 2.5, 6, 0.25, 4, "pct") +
      hint("Spending = (1 − savings rate) × pay. FI number = spending ÷ withdrawal rate. Savings are added at each year-end and grow at the real return; everything is in today's dollars."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><div class="fig-title" style="margin-top:10px">Your portfolio on the way to the FI number</div><div id="' + u + '-f"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var I = num(el, "i"), s = Number(self(el, "s").value) / 100, P0 = num(el, "p"), r = Number(self(el, "r").value) / 100, w = Number(self(el, "w").value) / 100;
      var spend = (1 - s) * I, S = s * I, T = spend / w, n = yearsTo(T, P0, S, r);
      self(el, "k").innerHTML = kpi("Spending per year", money(spend)) + kpi("Saved per year", money(S)) + kpi("FI number", money(T)) + kpi("Years to FI", I > 0 ? yrsTxt(n) : "—", I > 0 && n != null && n <= 20 ? "good" : "");
      var curve = [];
      for (var k = 5; k <= 90; k += 1) { var nk = yearsTo((1 - k / 100) * I / w, P0, k / 100 * I, r); if (nk != null && nk <= 70) curve.push([k, nk]); }
      var dots = n != null && n <= 70 ? [{ x: s * 100, y: n, label: n.toFixed(1) + " years", color: "var(--s1)" }] : [];
      if (curve.length) INV.lineChart(self(el, "c"), { label: "Years to FI by savings rate", height: 240, xTitle: "Savings rate (% of take-home pay)", yTitle: "Years to FI", xFmt: function (v) { return v + "%"; }, yFmt: function (v) { return String(Math.round(v)); }, tipFmt: function (v) { return v.toFixed(1) + " years"; },
        series: [{ name: "Years to FI", color: "var(--s1)", data: curve, area: true }], dots: dots });
      else self(el, "c").innerHTML = '<p class="tool-note">Enter a take-home pay above zero to draw the curve.</p>';
      var path = [[0, P0]], tl = [[0, T]], b = P0, lim = n == null ? 50 : Math.min(60, Math.max(5, Math.ceil(n) + 3));
      for (var y = 1; y <= lim; y++) { b = b * (1 + r) + S; path.push([y, b]); tl.push([y, T]); }
      INV.lineChart(self(el, "f"), { label: "Portfolio path", height: 220, xTitle: "Years from now", xFmt: yearFmt, yFmt: ms,
        series: [{ name: "Portfolio (today's dollars)", color: "var(--s2)", data: path }, { name: "FI number", color: "var(--s5)", data: tl, dash: "5 4" }] });
      self(el, "n").innerHTML = I <= 0 ? "Enter your take-home pay." : "At a " + pct(s * 100, 0) + " savings rate you live on " + money(spend) + " and need " + money(T) + " (" + (1 / w).toFixed(1) + " × spending). " +
        (n == null ? "With no savings and no return, the target is never reached." : n === 0 ? "Your current portfolio already covers the target." : "Years to FI: n = ln[(T·r + S) ÷ (P₀·r + S)] ÷ ln(1 + r) = <b>" + n.toFixed(1) + "</b>.") +
        " Notice that pay itself cancels out when you start from zero: only the savings rate, the return and the withdrawal rate matter.";
    }
    wire(el, run);
  };

  /* ---------- 2. Sensitivity grid (INV-072) ---------- */
  TOOLS.s10Sens = function (el) {
    var u = uid(el), RS = [2, 3, 4, 5, 6, 7], WS = [3, 3.5, 4, 4.5, 5];
    shell(el, "How sensitive is the answer? Return versus withdrawal rate", "Model",
      rng(u + "-s", "Savings rate", 5, 80, 1, 50, "pct") +
      hint("Years to FI starting from zero, for each pair of real return (rows) and withdrawal rate (columns). Pay cancels out, so the grid holds for any income."),
      '<div class="kpis" id="' + u + '-k"></div><div class="tbl-wrap"><table class="tbl" id="' + u + '-t"></table></div><div id="' + u + '-c"></div>');
    function run() {
      var s = Number(self(el, "s").value) / 100, all = [];
      function n(r, w) { return yearsTo((1 - s) / (w / 100), 0, s, r / 100); }
      var h = '<thead><tr><th>Real return</th>' + WS.map(function (w) { return '<th class="r">' + w + "% withdrawal</th>"; }).join("") + "</tr></thead><tbody>";
      RS.forEach(function (r) {
        h += "<tr><td><b>" + r + "%</b></td>" + WS.map(function (w) { var v = n(r, w); all.push(v); var base = r === 5 && w === 4; return '<td class="r"' + (base ? ' style="background:var(--blue-soft);font-weight:800"' : "") + ">" + v.toFixed(1) + "</td>"; }).join("") + "</tr>";
      });
      self(el, "t").innerHTML = h + "</tbody>";
      var lo = Math.min.apply(null, all), hi = Math.max.apply(null, all), base = n(5, 4);
      self(el, "k").innerHTML = kpi("Base case (5%, 4%)", base.toFixed(1) + " yrs") + kpi("Most favorable in grid", lo.toFixed(1) + " yrs", "good") + kpi("Least favorable in grid", hi.toFixed(1) + " yrs", "bad") + kpi("Spread", (hi - lo).toFixed(1) + " yrs");
      var ser = [[3, "3% withdrawal", "var(--s5)"], [4, "4% withdrawal", "var(--s1)"], [5, "5% withdrawal", "var(--s2)"]].map(function (k) {
        var d = []; for (var r = 1; r <= 8; r += 0.5) d.push([r, n(r, k[0])]); return { name: k[1], color: k[2], data: d }; });
      INV.lineChart(self(el, "c"), { label: "Years to FI by return", height: 230, xTitle: "Real return (%)", yTitle: "Years to FI", xFmt: function (v) { return v + "%"; }, yFmt: function (v) { return String(Math.round(v)); }, tipFmt: function (v) { return v.toFixed(1) + " years"; }, series: ser });
    }
    wire(el, run);
  };

  /* ---------- 3. Coast FI (INV-073) ---------- */
  TOOLS.s10Coast = function (el) {
    var u = uid(el);
    shell(el, "Coast FI calculator", "Calculator",
      rng(u + "-a", "Your age now", 20, 60, 1, 45, "age") + rng(u + "-t", "Age you want to be financially independent", 50, 70, 1, 65, "age") +
      numf(u + "-sp", "Yearly spending the portfolio must cover then ($, today's dollars)", 30000, 1000, "After Social Security or a pension") +
      numf(u + "-p", "Invested for this goal today ($)", 140000, 1000) +
      rng(u + "-r", "Real return (after inflation)", 1, 8, 0.5, 5, "pct") + rng(u + "-w", "Withdrawal rate at FI", 3, 5, 0.25, 4, "pct") +
      hint("Coast number = FI number ÷ (1 + r)<sup>years left</sup>. If you already have it, growth alone should carry you to the FI number with no new saving — provided you keep covering today's spending from work."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var a = Number(self(el, "a").value), t = Number(self(el, "t").value), sp = num(el, "sp"), P = num(el, "p"), r = Number(self(el, "r").value) / 100, w = Number(self(el, "w").value) / 100;
      var yl = Math.max(0, t - a), T = sp / w, C = T / Math.pow(1 + r, yl), atT = P * Math.pow(1 + r, yl);
      var arrive = P >= T ? a : P > 0 ? a + Math.log(T / P) / Math.log(1 + r) : null;
      var gap = Math.max(0, T - atT), af = yl > 0 ? (Math.pow(1 + r, yl) - 1) / r : 0, need = gap > 0 ? (af > 0 ? gap / af : gap) : 0;
      self(el, "k").innerHTML = kpi("FI number", money(T)) + kpi("Coast number today", money(C)) + kpi(P >= C ? "Ahead of coast by" : "Short of coast by", money(Math.abs(P - C)), P >= C ? "good" : "bad") +
        kpi("Age growth alone gets you there", arrive == null ? "Not without saving" : arrive <= a ? "Already there" : arrive > 110 ? "Not in a lifetime" : "age " + arrive.toFixed(1)) + kpi("Saving needed per year to hit it by " + t, t > a ? money(need) : "choose a later age", t > a && need <= 0 ? "good" : "");
      var cn = [], pr = [];
      for (var x = a; x <= Math.max(t, a + 1); x++) { var left = Math.max(0, t - x); cn.push([x, T / Math.pow(1 + r, left)]); pr.push([x, P * Math.pow(1 + r, x - a)]); }
      INV.lineChart(self(el, "c"), { label: "Coast number versus your portfolio", height: 240, xTitle: "Age", xFmt: yearFmt, yFmt: ms,
        series: [{ name: "Coast number at each age", color: "var(--s5)", data: cn, dash: "5 4" }, { name: "Your portfolio, no new saving", color: "var(--s2)", data: pr }],
        marks: [{ x: Math.max(t, a + 1) }] });
      self(el, "n").innerHTML = (t <= a ? "<b>The FI age must be later than your age now.</b> " : "") + "FI number = " + money(sp) + " ÷ " + pct(w * 100, 2) + " = " + money(T) + ". Coast number = " + money(T) + " ÷ " + (1 + r).toFixed(3) + "<sup>" + yl + "</sup> = <b>" + money(C) + "</b>. " +
        (P >= C ? "You could stop saving for this goal and, if returns match the assumption, still arrive on time. " : "Growth alone would turn " + money(P) + " into " + money(atT) + " by age " + t + ". ") +
        "A 1-point lower return raises today's coast number to " + money(T / Math.pow(1 + Math.max(0.001, r - 0.01), yl)) + ".";
    }
    wire(el, run);
  };

  /* ---------- 4. Historical withdrawal-rate tester (INV-073) ---------- */
  TOOLS.s10Swr = function (el) {
    var u = uid(el), h = INV.hist();
    shell(el, "Would this withdrawal rate have lasted? US history, 1928–" + h.last, "Historical data",
      rng(u + "-n", "Retirement length", 20, 60, 5, 50, "yr") + rng(u + "-s", "Mix", 0, 100, 5, 75, "stk") + rng(u + "-w", "First-year withdrawal rate", 2, 7, 0.05, 4, "pct") +
      '<div class="fld"><label>Withdrawals taken</label><div class="seg" role="group"><button type="button" data-v="end" aria-pressed="true">At each year-end</button><button type="button" data-v="start" aria-pressed="false">At each year-start</button></div></div>' +
      hint("The first withdrawal is a percentage of the starting balance; later withdrawals rise with CPI inflation. Stocks are the S&amp;P 500 with dividends, bonds are 10-year Treasuries, rebalanced yearly. Before taxes and fees. Every start year with a complete window is tested."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    var mode = "end";
    seg(el, function (v) { mode = v; run(); });
    function surv(st, n, wr, s) {
      var b = 1, w = wr;
      for (var k = 0; k < n; k++) { var i = st + k, g = 1 + (s * h.stocks[i] + (1 - s) * h.tbond[i]) / 100;
        if (mode === "end") { b *= g; b -= w; } else { b -= w; if (b < -1e-12) return false; b *= g; }
        if (b < -1e-12) return false; w *= 1 + h.cpi[i] / 100; }
      return true;
    }
    function smax(st, n, s) { var lo = 0, hi = 0.3; for (var it = 0; it < 32; it++) { var m = (lo + hi) / 2; if (surv(st, n, m, s)) lo = m; else hi = m; } return lo; }
    function run() {
      var n = Number(self(el, "n").value), s = Number(self(el, "s").value) / 100, wr = Number(self(el, "w").value) / 100, N = h.rows.length, res = [];
      for (var st = 0; st + n <= N; st++) res.push({ y: h.year[st], m: smax(st, n, s) });
      var ok = res.filter(function (x) { return x.m >= wr - 1e-9; }).length, worst = res.reduce(function (a, b) { return b.m < a.m ? b : a; });
      self(el, "k").innerHTML = kpi("Start years tested", res.length + " (" + h.year[0] + "–" + res[res.length - 1].y + ")") + kpi("Lasted the full " + n + " years", pct(ok / res.length * 100, 0), ok === res.length ? "good" : ok / res.length < 0.8 ? "bad" : "") +
        kpi("Worst start year", String(worst.y), "bad") + kpi("Highest rate that always lasted", pct(worst.m * 100, 2));
      INV.barChart(self(el, "c"), { label: "Highest sustainable withdrawal rate by start year", height: 240, maxLabels: 10, yFmt: function (v) { return v.toFixed(0) + "%"; }, tipFmt: function (v) { return "highest rate that lasted: " + v.toFixed(2) + "%"; },
        data: res.map(function (x) { return { label: String(x.y), tip: "Retire at start of " + x.y, y: x.m * 100, color: x.m < wr - 1e-9 ? "var(--s5)" : "var(--s2)" }; }) });
      self(el, "n2").innerHTML = "Each bar is the highest first-year rate that would have lasted " + n + " years for someone retiring at the start of that year. <b>Red bars</b> are start years in which " + pct(wr * 100, 2) + " ran out. " +
        (ok === res.length ? "This rate survived every start year tested. " : (res.length - ok) + " of " + res.length + " start years failed. ") +
        "Windows overlap heavily and there are only about " + Math.round(N / n * 10) / 10 + " independent " + n + "-year periods in " + N + " years of data, so treat the result as one country's history, not a probability.";
    }
    wire(el, run);
  };

  /* ---------- 5. 72(t) SEPP calculator (INV-074) ---------- */
  var SL = [84.6,83.7,82.8,81.8,80.8,79.8,78.8,77.9,76.9,75.9,74.9,73.9,72.9,71.9,70.9,69.9,69.0,68.0,67.0,66.0,65.0,64.1,63.1,62.1,61.1,60.2,59.2,58.2,57.3,56.3,55.3,54.4,53.4,52.5,51.5,50.5,49.6,48.6,47.7,46.7,45.7,44.8,43.8,42.9,41.9,41.0,40.0,39.0,38.1,37.1,36.2,35.3,34.3,33.4,32.5,31.6,30.6,29.8,28.9,28.0,27.1,26.2,25.4,24.5,23.7,22.9,22.0,21.2,20.4,19.6,18.8,18.0,17.2,16.4,15.6,14.8,14.1,13.3,12.6,11.9,11.2,10.5,9.9,9.3,8.7,8.1,7.6,7.1,6.6,6.1,5.7,5.3,4.9,4.6,4.3,4.0,3.7,3.4,3.2,3.0,2.8,2.6,2.5,2.3,2.2,2.1,2.1,2.1,2.0,2.0,2.0,2.0,2.0,1.9,1.9,1.8,1.8,1.6,1.4,1.1,1.0];
  var QX = [0.001762,0.000441,0.000292,0.000232,0.000177,0.000161,0.000153,0.000145,0.000132,0.000127,0.000128,0.000135,0.000146,0.000164,0.000192,0.000223,0.000253,0.000276,0.000293,0.000304,0.000313,0.000343,0.000377,0.000421,0.000466,0.00052,0.000581,0.00063,0.000677,0.00072,0.000763,0.000799,0.000824,0.000833,0.00083,0.000823,0.000819,0.000824,0.000836,0.000853,0.000879,0.000909,0.000945,0.00098,0.001019,0.001065,0.001132,0.001225,0.001345,0.001485,0.001656,0.001874,0.002121,0.002397,0.002701,0.003032,0.00339,0.003774,0.004181,0.004613,0.005071,0.005554,0.006071,0.006624,0.007225,0.007884,0.008238,0.008659,0.009163,0.009767,0.010491,0.011358,0.012385,0.013598,0.015014,0.01667,0.018587,0.020815,0.023391,0.026387,0.02985,0.033883,0.038544,0.04388,0.049956,0.056799,0.064436,0.072882,0.082137,0.092172,0.102919,0.114344,0.126605,0.139936,0.154844,0.171902,0.18721,0.204659,0.222921,0.241884,0.261476,0.281536,0.301847,0.322371,0.34294,0.361261,0.372886,0.381098,0.383358,0.385709,0.388092,0.390353,0.392822,0.395188,0.397567,0.4,0.4,0.4,0.4,0.4,0.4];
  var ULT = { 40: 58.4, 41: 57.4, 42: 56.4, 43: 55.4, 44: 54.4, 45: 53.4, 46: 52.4, 47: 51.5, 48: 50.5, 49: 49.5, 50: 48.5, 51: 47.5, 52: 46.5, 53: 45.6, 54: 44.6, 55: 43.6, 56: 42.6, 57: 41.6, 58: 40.7, 59: 39.7 };
  function amortFactor(n, i) { return i <= 0 ? n : (1 - Math.pow(1 + i, -n)) / i; }
  function annuityFactor(age, i) { var s = 0, p = 1; for (var t = 1; age + t - 1 <= 120; t++) { p *= 1 - QX[Math.min(120, age + t - 1)]; s += p / Math.pow(1 + i, t); } return s; }
  INV.s10sepp = { amort: amortFactor, annuity: annuityFactor, single: SL, uniform: ULT };
  TOOLS.s10Sepp = function (el) {
    var u = uid(el);
    shell(el, "72(t) substantially equal periodic payments", "Calculator",
      numf(u + "-b", "Account balance ($)", 600000, 1000, "One account; balances cannot be combined") + rng(u + "-a", "Your age on your birthday in the first year", 40, 59, 1, 50, "age") +
      rng(u + "-f", "120% of the federal mid-term rate (either of the 2 prior months)", 1, 8, 0.01, 5.4, "pct") +
      rng(u + "-i", "Interest rate you choose", 0.5, 8, 0.05, 5, "pct") +
      '<div class="fld"><label for="' + u + '-tb">Life expectancy table</label><select id="' + u + '-tb"><option value="single">Single Life Table</option><option value="uniform">Uniform Lifetime Table</option></select></div>' +
      hint("Rules from IRS Notice 2022-6. The rate may not exceed the greater of 5% or 120% of the federal mid-term rate; for September 2026 that rate was 5.40% (Rev. Rul. 2026-17). The annuitization factor uses the mortality rates in 26 CFR 1.401(a)(9)-9(e). Joint tables are not modeled."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var B = num(el, "b"), a = Number(self(el, "a").value), f = Number(self(el, "f").value) / 100, i0 = Number(self(el, "i").value) / 100, tb = self(el, "tb").value;
      var cap = Math.max(0.05, f), i = Math.min(i0, cap), le = tb === "uniform" ? ULT[a] : SL[a];
      var rmd = B / le, am = B / amortFactor(le, i), an = B / annuityFactor(a, i), until = Math.max(a + 5, 59.5);
      self(el, "k").innerHTML = kpi("Highest rate allowed", pct(cap * 100, 2)) + kpi("RMD method, year 1", money(rmd)) + kpi("Fixed amortization", money(am)) + kpi("Fixed annuitization", money(an)) +
        kpi("Locked in until", "age " + (until % 1 ? until.toFixed(1) : until) + " (" + (until - a).toFixed(1) + " yrs)");
      INV.barChart(self(el, "c"), { label: "Annual payment by method", height: 220, allLabels: true, valueLabels: true, yFmt: function (v) { return ms(v); }, tipFmt: function (v) { return money(v) + " a year"; },
        data: [{ label: "RMD method", y: rmd, color: "var(--s3)" }, { label: "Fixed amortization", y: am, color: "var(--s1)" }, { label: "Fixed annuitization", y: an, color: "var(--s2)" }] });
      self(el, "n").innerHTML = (i0 > cap + 1e-9 ? "<b>Your chosen rate exceeds the cap, so " + pct(cap * 100, 2) + " is used.</b> " : "") +
        "Life expectancy at " + a + " (" + (tb === "uniform" ? "Uniform Lifetime" : "Single Life") + " Table): " + le.toFixed(1) + " years. RMD method: " + money(B) + " ÷ " + le.toFixed(1) + " = " + money(rmd) + ", recomputed every year. " +
        "Amortization: " + money(B) + " ÷ [(1 − (1 + i)<sup>−" + le.toFixed(1) + "</sup>) ÷ i] = " + money(am) + ". Annuitization factor " + annuityFactor(a, i).toFixed(4) + " gives " + money(an) + ". Both fixed amounts stay the same every year. " +
        "Changing the series before age " + (until % 1 ? until.toFixed(1) : until) + " (the later of five years or 59½) triggers the 10% tax on every payment taken so far, plus interest.";
    }
    wire(el, run);
  };

  /* ---------- 6. Premium tax credit estimator, 2026 rules (INV-074) ---------- */
  var FPL25 = [0, 15650, 21150, 26650, 32150, 37650, 43150, 48650, 54150];
  var APT = [[0, 133, 2.10, 2.10], [133, 150, 3.14, 4.19], [150, 200, 4.19, 6.60], [200, 250, 6.60, 8.44], [250, 300, 8.44, 9.96], [300, 400.0001, 9.96, 9.96]];
  function applicable(p) { for (var k = 0; k < APT.length; k++) { var b = APT[k]; if (p < b[1]) return b[0] === 0 ? b[2] : b[2] + (p - b[0]) / (b[1] - b[0]) * (b[3] - b[2]); } return null; }
  function ptc(magi, hh, bench) {
    var fpl = FPL25[hh], p = magi / fpl * 100;
    if (p < 100 || p > 400) return { p: p, fpl: fpl, ap: null, contrib: null, credit: 0 };
    var ap = applicable(p), c = magi * ap / 100; return { p: p, fpl: fpl, ap: ap, contrib: c, credit: Math.max(0, bench - c) };
  }
  INV.s10ptc = ptc;
  TOOLS.s10Aca = function (el) {
    var u = uid(el);
    shell(el, "Marketplace premium tax credit, 2026 rules", "Calculator",
      rng(u + "-h", "Household size", 1, 6, 1, 2, "hh") + numf(u + "-m", "Household income for the year — marketplace MAGI ($)", 84000, 500) +
      numf(u + "-b", "Benchmark (second-lowest-cost silver) premium per month ($)", 1800, 25, "Get your real figure at HealthCare.gov or your state marketplace") +
      hint("2026 law after the enhanced credits expired: credit = benchmark premium − (applicable percentage × income), and no credit above 400% of the poverty line. Uses the 2025 HHS guidelines for the 48 contiguous states and DC, which apply to 2026 coverage. Alaska and Hawaii use higher guidelines."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var hh = Number(self(el, "h").value), m = num(el, "m"), bm = num(el, "b") * 12, R = ptc(m, hh, bm);
      self(el, "k").innerHTML = kpi("Poverty line used", money(R.fpl)) + kpi("Income as % of poverty line", pct(R.p, 0)) +
        kpi("Expected contribution / yr", R.contrib == null ? "No credit" : money(R.contrib) + " (" + R.ap.toFixed(2) + "%)") + kpi("Premium tax credit / yr", money(R.credit), R.credit > 0 ? "good" : "bad") +
        kpi("You pay for the benchmark / yr", money(Math.max(0, bm - R.credit)));
      var d = [], d2 = [];
      for (var q = 100; q <= 500; q += 2.5) { var inc = R.fpl * q / 100, x = ptc(inc, hh, bm); d.push([q, Math.max(0, bm - x.credit)]); d2.push([q, x.credit]); }
      INV.lineChart(self(el, "c"), { label: "Net premium by income", height: 240, xTitle: "Income as % of the poverty line", xFmt: function (v) { return Math.round(v) + "%"; }, yFmt: ms, tipFmt: function (v) { return money(v); },
        series: [{ name: "You pay for the benchmark plan", color: "var(--s5)", data: d }, { name: "Premium tax credit", color: "var(--s2)", data: d2, dash: "5 4" }],
        marks: [{ x: 400, label: "400% cliff" }], dots: R.p >= 100 && R.p <= 500 ? [{ x: R.p, y: Math.max(0, bm - R.credit), color: "var(--s1)" }] : [] });
      var at400 = R.fpl * 4;
      self(el, "n").innerHTML = "For a household of " + hh + ", 400% of the poverty line is <b>" + money(at400) + "</b>. " +
        (R.p < 100 ? "Below 100% of the poverty line there is no marketplace credit; in states that expanded Medicaid, adults below about 138% usually qualify for Medicaid instead. " :
          R.p > 400 ? "Above 400%, the 2026 rules give no credit at all, so you pay the full premium. " :
          "Your expected contribution is " + R.ap.toFixed(2) + "% of income. " + (R.p < 138 ? "In a Medicaid expansion state you may qualify for Medicaid instead. " : "")) +
        "Since 2026, any excess advance credit must be repaid in full at tax time, so estimate income carefully.";
    }
    wire(el, run);
  };

  /* ---------- 7. Bridge-years planner (INV-074) ---------- */
  TOOLS.s10Bridge = function (el) {
    var u = uid(el);
    shell(el, "Bridge-years planner: from early retirement to 59½", "Planner",
      rng(u + "-ra", "Age you stop working", 40, 59, 1, 50, "age") + numf(u + "-sp", "Spending per year ($, today's dollars)", 60000, 1000) +
      numf(u + "-ca", "Cash and savings ($)", 30000, 1000) + numf(u + "-tx", "Taxable brokerage account ($)", 150000, 1000) +
      numf(u + "-rb", "Roth IRA contributions (not earnings) ($)", 40000, 1000) + numf(u + "-pt", "Pre-tax 401(k) and IRA ($)", 700000, 1000) +
      numf(u + "-cv", "Roth conversion each year ($)", 60000, 1000, "Each conversion can be withdrawn penalty-free after 5 tax years") +
      numf(u + "-sp72", "72(t) payment per year ($)", 0, 1000, "0 = none. Runs until the later of 5 years or 59½") +
      '<div class="fld"><label for="' + u + '-r55">Rule of 55 on the 401(k)?</label><select id="' + u + '-r55"><option value="no">No</option><option value="yes">Yes: leaving that employer in or after the year I turn 55</option></select></div>' +
      rng(u + "-r", "Real return on investments", 0, 7, 0.5, 4, "pct") +
      hint("Order of use each year: cash, taxable account, Roth contributions, conversions at least 5 tax years old, 72(t) payments, then the 401(k) under the Rule of 55. Taxes on conversions, withdrawals and gains are not modeled; cash earns nothing after inflation."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><div class="fig-title" style="margin-top:10px">What is left in each bucket</div><div id="' + u + '-f"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var ra = Number(self(el, "ra").value), sp = num(el, "sp"), cash = num(el, "ca"), tx = num(el, "tx"), rb = num(el, "rb"), pt = num(el, "pt"), cv = num(el, "cv"), s72 = num(el, "sp72"),
        r55 = self(el, "r55").value === "yes" && ra >= 55, r = Number(self(el, "r").value) / 100;
      var conv = {}, bars = [], lTx = [], lRoth = [], lPt = [], shortTot = 0, firstShort = null, full = 0, end72 = Math.max(ra + 5, 60);
      for (var a = ra; a <= 59; a++) {
        var cvt = Math.min(cv, pt); pt -= cvt; conv[a] = cvt;
        var need = sp, use = { cash: 0, taxable: 0, roth: 0, seasoned: 0, sepp: 0, r55: 0 }, take;
        take = Math.min(need, cash); cash -= take; need -= take; use.cash = take;
        take = Math.min(need, tx); tx -= take; need -= take; use.taxable = take;
        take = Math.min(need, rb); rb -= take; need -= take; use.roth = take;
        for (var c = ra; c <= a - 5; c++) { take = Math.min(need, conv[c]); conv[c] -= take; need -= take; use.seasoned += take; }
        if (s72 > 0 && a < end72) { take = Math.min(s72, pt); pt -= take; var usedS = Math.min(need, take); need -= usedS; use.sepp = usedS; tx += take - usedS; }
        if (r55 && need > 0) { take = Math.min(need, pt); pt -= take; need -= take; use.r55 = take; }
        var short = need;
        if (short > 0.5) { shortTot += short; if (firstShort == null) firstShort = a; } else full++;
        var top = Object.keys(use).reduce(function (x, y) { return use[y] > use[x] ? y : x; }, "cash");
        var col = { cash: "var(--s6)", taxable: "var(--s3)", roth: "var(--s4)", seasoned: "var(--s1)", sepp: "var(--s2)", r55: "var(--s2)" }[top];
        var nm = { cash: "cash", taxable: "taxable", roth: "Roth contributions", seasoned: "seasoned conversions", sepp: "72(t)", r55: "Rule of 55" };
        var tipTxt = "Age " + a + ": " + Object.keys(use).filter(function (k) { return use[k] > 0.5; }).map(function (k) { return nm[k] + " " + ms(use[k]); }).join(", ") + (short > 0.5 ? "; shortfall " + ms(short) : "");
        bars.push({ label: String(a), tip: tipTxt, y: short > 0.5 ? -short : sp - short, color: short > 0.5 ? "var(--s5)" : col });
        tx *= 1 + r; pt *= 1 + r;
        var seasonedLeft = 0; for (var c2 = ra; c2 <= a; c2++) seasonedLeft += conv[c2];
        lTx.push([a + 1, tx + cash]); lRoth.push([a + 1, rb + seasonedLeft]); lPt.push([a + 1, pt]);
      }
      var yrs = 60 - ra;
      self(el, "k").innerHTML = kpi("Bridge years to 59½", String(yrs)) + kpi("Years fully funded", full + " of " + yrs, full === yrs ? "good" : "bad") +
        kpi("First shortfall", firstShort == null ? "None" : "age " + firstShort, firstShort == null ? "good" : "bad") + kpi("Total shortfall", money(shortTot), shortTot > 0 ? "bad" : "good") + kpi("Pre-tax left at 60", money(pt));
      INV.barChart(self(el, "c"), { label: "Spending funded each year, by main source", height: 230, allLabels: yrs <= 12, yFmt: ms, tipFmt: function (v) { return v < 0 ? "shortfall " + money(-v) : "funded " + money(v); }, data: bars, xTitle: "Age" });
      INV.lineChart(self(el, "f"), { label: "Bucket balances", height: 220, xTitle: "Age (start of year)", xFmt: yearFmt, yFmt: ms,
        series: [{ name: "Cash + taxable", color: "var(--s3)", data: lTx }, { name: "Roth contributions + conversions", color: "var(--s1)", data: lRoth }, { name: "Pre-tax 401(k)/IRA", color: "var(--s2)", data: lPt }] });
      self(el, "n").innerHTML = (self(el, "r55").value === "yes" && ra < 55 ? "<b>The Rule of 55 does not apply if you leave before the year you turn 55,</b> so it is ignored here. " : "") +
        (firstShort == null ? "Every bridge year is funded before 59½. " : "Money runs short starting at age " + firstShort + ": " + money(shortTot) + " in total. Conversions made at " + ra + " become usable at " + (ra + 5) + "; try a larger taxable account, a 72(t) payment, or starting conversions before you stop working. ") +
        "Bar colors show the main source each year: gray cash, amber taxable, purple Roth contributions, blue seasoned conversions, teal 72(t) or Rule of 55; red bars are shortfalls.";
    }
    wire(el, run);
  };
})();
