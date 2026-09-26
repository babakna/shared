/* Investing Learning Lab - calculators and interactive tools - V1.1 (September 2026)
   Every tool computes from its stated formula in the browser. Historical tools use
   window.INV_RETURNS (Damodaran, NYU Stern, 1928-2025). */
(function () {
  "use strict";
  var INV = window.INV; if (!INV) return;
  var esc = INV.esc, money = INV.money, ms = INV.moneyShort, pct = INV.pct;
  var TOOLS = INV.tools = {};

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
      f === "yr" ? v + (v === 1 ? " year" : " years") : f === "money" ? money(v) : f === "age" ? "age " + v : f === "stk" ? v + "% stocks / " + (100 - v) + "% bonds" : String(v);
  }
  function wire(el, fn) {
    el.querySelectorAll("input,select").forEach(function (i) {
      i.addEventListener("input", function () { if (i.type === "range") fmtOut(i); fn(); });
      if (i.type === "range") fmtOut(i);
    });
    fn();
    document.addEventListener("inv-theme", fn);
  }
  function kpi(k, v, cls) { return '<div class="kpi"><div class="k">' + esc(k) + '</div><div class="v ' + (cls || "") + '">' + v + "</div></div>"; }
  function yearFmt(v) { return String(Math.round(v)); }

  var H = null;
  function hist() { if (!H) H = INV.hist(); return H; }
  function yIndex(y) { return y - hist().first; }
  /* annual portfolio returns (%) for a stock share s (0..1), rest in 10-yr Treasuries, rebalanced yearly */
  function mixRet(i, s) { var h = hist(); return s * h.stocks[i] + (1 - s) * h.tbond[i]; }
  function seriesFor(key, i, s) {
    var h = hist();
    if (key === "mix") return mixRet(i, s);
    if (key === "cash") return 0;
    return h[key][i];
  }
  function realize(nom, infl) { return ((1 + nom / 100) / (1 + infl / 100) - 1) * 100; }

  /* ---------- 1. Purchasing power (INV-001) ---------- */
  TOOLS.purchasing = function (el) {
    var u = uid(el), h = hist();
    shell(el, "What happened to $1 of spending power?", "Historical data",
      numf(u + "-amt", "Amount ($)", 10000, 100) +
      rng(u + "-y0", "Start of year", h.first, h.last - 1, 1, 1996) +
      rng(u + "-y1", "End of year", h.first + 1, h.last, 1, h.last) +
      '<div class="fld"><label>Show values in</label><div class="seg" role="group"><button type="button" data-v="real" aria-pressed="true">Start-year dollars</button><button type="button" data-v="nom" aria-pressed="false">Dollars of the day</button></div></div>' +
      '<p class="hint" style="font-size:.76rem;color:var(--muted)">Returns and inflation are calendar-year figures (Damodaran, NYU Stern; CPI-U December to December). Before taxes and fees.</p>',
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    var mode = "real";
    el.querySelectorAll(".seg button").forEach(function (b) {
      b.addEventListener("click", function () { mode = b.dataset.v; el.querySelectorAll(".seg button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); run(); });
    });
    var y0i = self(el, "y0"), y1i = self(el, "y1");
    function run() {
      var amt0 = Math.max(0, Number(self(el, "amt").value) || 0), amt = amt0 > 0 ? amt0 : 10000, y0 = Number(y0i.value), y1 = Number(y1i.value);
      if (y1 <= y0) { y1 = y0 + 1; y1i.value = y1; fmtOut(y1i); }
      var cpi = 1, vals = { cash: amt, tbill: amt, tbond: amt, stocks: amt }, pts = { cash: [], tbill: [], tbond: [], stocks: [] };
      Object.keys(pts).forEach(function (k) { pts[k].push([y0, amt]); });
      for (var y = y0; y <= y1; y++) {
        var i = yIndex(y); cpi *= 1 + h.cpi[i] / 100;
        vals.tbill *= 1 + h.tbill[i] / 100; vals.tbond *= 1 + h.tbond[i] / 100; vals.stocks *= 1 + h.stocks[i] / 100;
        Object.keys(pts).forEach(function (k) { pts[k].push([y + 1, mode === "real" ? vals[k] / cpi : vals[k]]); });
      }
      var yrs = y1 - y0 + 1, avgInf = (Math.pow(cpi, 1 / yrs) - 1) * 100;
      self(el, "k").innerHTML = kpi(cpi >= 1 ? "Prices rose" : "Prices fell", pct(Math.abs(cpi - 1) * 100, 0)) + kpi("Avg inflation / yr", pct(avgInf, 2)) +
        kpi("Cash under the mattress", money(amt / cpi), "bad") + kpi("Needed to keep pace", money(amt * cpi));
      var label = mode === "real" ? "Value in start-of-" + y0 + " dollars" : "Value in dollars of each year";
      INV.lineChart(self(el, "c"), { label: label, log: true, height: 290, yTitle: label, xFmt: yearFmt, yFmt: ms,
        series: [
          { name: "Stocks (S&P 500)", color: "var(--s1)", data: pts.stocks },
          { name: "10-yr Treasury bonds", color: "var(--s2)", data: pts.tbond },
          { name: "3-month T-bills", color: "var(--s3)", data: pts.tbill },
          { name: "Cash, no interest", color: "var(--s5)", data: pts.cash, dash: "5 4" }] });
      self(el, "n").innerHTML = (amt0 > 0 ? "" : "No amount entered, so $10,000 is shown. ") + "Over " + yrs + " calendar years (start of " + y0 + " to end of " + y1 + "), " + money(amt) + " left in cash buys what " +
        "<b>" + money(amt / cpi) + "</b> bought at the start. In stocks it became " + money(vals.stocks) + " (" + money(vals.stocks / cpi) + " in start-year dollars); in T-bills, " +
        money(vals.tbill) + " (" + money(vals.tbill / cpi) + ").";
    }
    wire(el, run);
  };

  /* ---------- 2. Compound growth (INV-002) ---------- */
  TOOLS.compound = function (el) {
    var u = uid(el);
    shell(el, "Compound growth with regular saving", "Calculator",
      numf(u + "-p", "Starting amount ($)", 5000, 100) + numf(u + "-m", "Added every month ($)", 300, 25) +
      rng(u + "-r", "Annual return", 0, 12, 0.5, 7, "pct") + rng(u + "-n", "Years", 1, 50, 1, 30, "yr") +
      rng(u + "-i", "Inflation (for today's-dollar view)", 0, 6, 0.5, 2.5, "pct"),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var P = Math.max(0, Number(self(el, "p").value) || 0), M = Math.max(0, Number(self(el, "m").value) || 0), r = Number(self(el, "r").value) / 100,
        n = Number(self(el, "n").value), inf = Number(self(el, "i").value) / 100;
      var rm = Math.pow(1 + r, 1 / 12) - 1, bal = P, contrib = P, pB = [[0, P]], pC = [[0, P]], pR = [[0, P]];
      for (var mth = 1; mth <= n * 12; mth++) {
        bal = bal * (1 + rm) + M; contrib += M;
        if (mth % 12 === 0) { var yr = mth / 12; pB.push([yr, bal]); pC.push([yr, contrib]); pR.push([yr, bal / Math.pow(1 + inf, yr)]); }
      }
      var growth = bal - contrib;
      self(el, "k").innerHTML = kpi("Ending balance", money(bal)) + kpi("You put in", money(contrib)) + kpi("Growth earned", money(growth), "good") +
        kpi("In today's dollars", money(bal / Math.pow(1 + inf, n)));
      INV.lineChart(self(el, "c"), { label: "Balance over time", height: 280, xTitle: "Years from now", yFmt: ms, xFmt: yearFmt,
        series: [{ name: "Balance", color: "var(--s1)", data: pB, area: true },
          { name: "Money you contributed", color: "var(--s3)", data: pC, dash: "5 4" },
          { name: "Balance in today's dollars", color: "var(--s2)", data: pR }] });
      var cross = null;
      for (var k = 1; k < pB.length; k++) { if (pB[k][1] - pC[k][1] > pC[k][1]) { cross = k; break; } }
      self(el, "n2").innerHTML = "Growth makes up <b>" + pct(bal > 0 ? growth / bal * 100 : 0, 0) + "</b> of the ending balance." +
        (cross ? " From year " + cross + " on, the growth you have earned is larger than everything you have put in." : "") +
        " Monthly compounding at the monthly equivalent of the annual rate: (1 + r)<sup>1/12</sup> − 1.";
    }
    wire(el, run);
  };

  /* ---------- 3. Early vs late saver (INV-002) ---------- */
  TOOLS.earlylate = function (el) {
    var u = uid(el);
    shell(el, "The early saver and the late saver", "Calculator",
      numf(u + "-amt", "Each saver invests per year ($)", 6000, 500) +
      rng(u + "-a0", "Saver A starts at", 18, 40, 1, 25, "age") + rng(u + "-an", "Saver A stops after", 1, 20, 1, 10, "yr") +
      rng(u + "-b0", "Saver B starts at", 20, 55, 1, 35, "age") + rng(u + "-r", "Annual return", 1, 12, 0.5, 7, "pct") +
      '<p class="hint" style="font-size:.76rem;color:var(--muted)">Saver B keeps investing every year until 65. Contributions are made at the start of each year.</p>',
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var A = Math.max(0, Number(self(el, "amt").value) || 0), a0 = Number(self(el, "a0").value), an = Number(self(el, "an").value),
        b0 = Number(self(el, "b0").value), r = Number(self(el, "r").value) / 100;
      var ba = 0, bb = 0, ca = 0, cb = 0, pa = [], pb = [];
      for (var age = 18; age <= 65; age++) {
        if (age >= a0 && age < a0 + an && age < 65) { ba += A; ca += A; }
        if (age >= b0 && age < 65) { bb += A; cb += A; }
        pa.push([age, ba]); pb.push([age, bb]);
        ba *= 1 + r; bb *= 1 + r;
      }
      var fa = pa[pa.length - 1][1], fb = pb[pb.length - 1][1];
      self(el, "k").innerHTML = kpi("A invested", money(ca)) + kpi("A at 65", money(fa), fa >= fb ? "good" : "") + kpi("B invested", money(cb)) + kpi("B at 65", money(fb), fb > fa ? "good" : "");
      INV.lineChart(self(el, "c"), { label: "Early versus late saver", height: 270, xTitle: "Age", yFmt: ms, xFmt: yearFmt,
        series: [{ name: "Saver A (early, then stops)", color: "var(--s1)", data: pa }, { name: "Saver B (later, never stops)", color: "var(--s3)", data: pb }] });
      self(el, "n").innerHTML = A <= 0 ? "Enter a yearly amount above zero to compare the two savers." : fa >= fb ? "Saver A put in <b>" + money(ca) + "</b> and still ends ahead of Saver B, who put in " + money(cb) + ". The early years had longer to compound."
        : "Saver B ends ahead — but needed <b>" + money(cb - ca) + "</b> more of their own money to get there. Try moving Saver B's start later, or raising the return.";
    }
    wire(el, run);
  };

  /* ---------- 4. Rule of 72 (INV-002) ---------- */
  TOOLS.rule72 = function (el) {
    var u = uid(el);
    shell(el, "Rule of 72: how fast does money double?", "Calculator",
      rng(u + "-r", "Annual growth rate", 1, 20, 0.5, 8, "pct") +
      '<p class="hint" style="font-size:.76rem;color:var(--muted)">Exact doubling time is ln 2 ÷ ln(1 + r). The Rule of 72 approximates it as 72 ÷ (r in percent).</p>',
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div>');
    function run() {
      var r = Number(self(el, "r").value), ex = Math.log(2) / Math.log(1 + r / 100), est = 72 / r;
      self(el, "k").innerHTML = kpi("Exact doubling time", ex.toFixed(2) + " yrs") + kpi("Rule of 72 says", est.toFixed(2) + " yrs") +
        kpi("Error", (est - ex >= 0 ? "+" : "−") + Math.abs(est - ex).toFixed(2) + " yrs");
      var e = [], a = [];
      for (var x = 1; x <= 20; x += 0.5) { e.push([x, Math.log(2) / Math.log(1 + x / 100)]); a.push([x, 72 / x]); }
      INV.lineChart(self(el, "c"), { label: "Doubling time by growth rate", height: 250, xTitle: "Annual growth rate (%)", yTitle: "Years to double", log: false, xFmt: function (v) { return v + "%"; }, yFmt: function (v) { return Math.round(v * 10) / 10; },
        series: [{ name: "Exact", color: "var(--s1)", data: e }, { name: "Rule of 72", color: "var(--s3)", data: a, dash: "5 4" }],
        dots: [{ x: r, y: ex, label: ex.toFixed(1) + " years", color: "var(--s1)" }] });
    }
    wire(el, run);
  };

  /* ---------- 5. Present value (INV-002) ---------- */
  TOOLS.pv = function (el) {
    var u = uid(el);
    shell(el, "What is future money worth today?", "Calculator",
      '<div class="fld"><label>Question</label><div class="seg" role="group"><button type="button" data-v="lump" aria-pressed="true">One future amount</button><button type="button" data-v="stream" aria-pressed="false">Lump sum vs payments</button></div></div>' +
      '<div data-mode="lump">' + numf(u + "-fv", "Amount you will receive ($)", 50000, 1000) + rng(u + "-n", "Years until you receive it", 1, 40, 1, 10, "yr") + "</div>" +
      '<div data-mode="stream" hidden>' + numf(u + "-ls", "Lump sum offered today ($)", 250000, 1000) + numf(u + "-pmt", "Or: payment each year ($)", 18000, 500) + rng(u + "-np", "Number of yearly payments", 1, 40, 1, 20, "yr") + "</div>" +
      rng(u + "-r", "Discount rate (what your money could earn)", 0, 12, 0.25, 5, "pct"),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    var mode = "lump";
    el.querySelectorAll(".seg button").forEach(function (b) {
      b.addEventListener("click", function () {
        mode = b.dataset.v; el.querySelectorAll(".seg button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        el.querySelectorAll("[data-mode]").forEach(function (d) { d.hidden = d.getAttribute("data-mode") !== mode; }); run();
      });
    });
    function run() {
      var r = Number(self(el, "r").value) / 100;
      if (mode === "lump") {
        var fv = Math.max(0, Number(self(el, "fv").value) || 0), n = Number(self(el, "n").value), pv = fv / Math.pow(1 + r, n);
        self(el, "k").innerHTML = kpi("Worth today", money(pv)) + kpi("Discount", pct(fv ? (1 - pv / fv) * 100 : 0, 0), "bad");
        var pts = []; for (var t = 0; t <= 40; t++) pts.push([t, fv / Math.pow(1 + r, t)]);
        INV.lineChart(self(el, "c"), { label: "Present value by delay", height: 240, xTitle: "Years until received", yFmt: ms, xFmt: yearFmt,
          series: [{ name: "Value today", color: "var(--s1)", data: pts, area: true }], dots: [{ x: n, y: pv, label: money(pv), color: "var(--s1)" }] });
        self(el, "n2").innerHTML = "PV = FV ÷ (1 + r)<sup>n</sup> = " + money(fv) + " ÷ (1 + " + (r * 100).toFixed(2) + "%)<sup>" + n + "</sup> = <b>" + money(pv) + "</b>.";
      } else {
        var ls = Math.max(0, Number(self(el, "ls").value) || 0), p = Math.max(0, Number(self(el, "pmt").value) || 0), np = Number(self(el, "np").value);
        var ann = function (q) { return q === 0 ? p * np : p * (1 - Math.pow(1 + q, -np)) / q; };
        var pvs = ann(r);
        /* break-even discount rate: payments' present value equals the lump sum (bisection; value falls as the rate rises) */
        var be = null;
        if (ann(0) <= ls) be = 0; else if (ann(0.3) <= ls) { var lo = 0, hi = 0.3; for (var it = 0; it < 60; it++) { var mid = (lo + hi) / 2; if (ann(mid) > ls) lo = mid; else hi = mid; } be = (lo + hi) / 2; }
        self(el, "k").innerHTML = kpi("Payments worth today", money(pvs), pvs > ls ? "good" : "") + kpi("Lump sum", money(ls), ls >= pvs ? "good" : "") +
          kpi("Break-even rate", be == null ? "> 30%" : pct(be * 100, 2));
        var pts2 = [], lsl = []; for (var x = 0; x <= 12; x += 0.25) { var q = x / 100; pts2.push([x, q === 0 ? p * np : p * (1 - Math.pow(1 + q, -np)) / q]); lsl.push([x, ls]); }
        INV.lineChart(self(el, "c"), { label: "Value of the payments by discount rate", height: 240, xTitle: "Discount rate (%)", yFmt: ms, xFmt: function (v) { return v + "%"; }, zeroBase: false,
          series: [{ name: "Payments, valued today", color: "var(--s1)", data: pts2 }, { name: "Lump sum", color: "var(--s3)", data: lsl, dash: "5 4" }],
          dots: [{ x: r * 100, y: pvs, color: "var(--s1)" }] });
        self(el, "n2").innerHTML = "At a " + pct(r * 100, 2) + " discount rate, " + np + " payments of " + money(p) + " are worth <b>" + money(pvs) + "</b> today, versus a lump sum of " + money(ls) + ". " +
          (be == null ? "Even at a 30% discount rate the payments are worth more than the lump sum." : be === 0 ? "Even at a 0% discount rate the payments add up to no more than the lump sum, so the lump sum is worth at least as much at any rate." : "Below a " + pct(be * 100, 2) + " rate the payments are worth more; above it, the lump sum is.") + " This ignores taxes, inflation adjustments on the payments, and how long you actually live — each covered in the retirement stage.";
      }
    }
    wire(el, run);
  };

  /* ---------- 6. Holding-period explorer (INV-003) ---------- */
  TOOLS.holding = function (el) {
    var u = uid(el), h = hist();
    shell(el, "How often did investors lose money?", "Historical data",
      '<div class="fld"><label for="' + u + '-a">Investment</label><select id="' + u + '-a"><option value="stocks">US stocks (S&P 500)</option><option value="mix">60% stocks / 40% bonds</option><option value="tbond">10-yr Treasury bonds</option><option value="tbill">3-month T-bills</option></select></div>' +
      rng(u + "-n", "Holding period", 1, 30, 1, 1, "yr") +
      '<div class="fld"><label>Measure returns</label><div class="seg" role="group"><button type="button" data-v="nom" aria-pressed="true">Nominal</button><button type="button" data-v="real" aria-pressed="false">After inflation</button></div></div>' +
      '<p class="hint" style="font-size:.76rem;color:var(--muted)">Every rolling window of calendar years from 1928 to ' + h.last + '. Each bar is the average annual return for the window starting that year.</p>',
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    var mode = "nom";
    el.querySelectorAll(".seg button").forEach(function (b) {
      b.addEventListener("click", function () { mode = b.dataset.v; el.querySelectorAll(".seg button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); run(); });
    });
    function run() {
      var key = self(el, "a").value, n = Number(self(el, "n").value), N = h.rows.length, res = [];
      for (var s = 0; s + n <= N; s++) {
        var g = 1;
        for (var k = s; k < s + n; k++) { var r = seriesFor(key, k, 0.6); if (mode === "real") r = realize(r, h.cpi[k]); g *= 1 + r / 100; }
        res.push({ y: h.year[s], v: (Math.pow(g, 1 / n) - 1) * 100 });
      }
      var vs = res.map(function (x) { return x.v; }).sort(function (a, b) { return a - b; });
      var neg = res.filter(function (x) { return x.v < 0; }).length;
      var best = res.reduce(function (a, b) { return b.v > a.v ? b : a; }), worst = res.reduce(function (a, b) { return b.v < a.v ? b : a; });
      var med = vs.length % 2 ? vs[(vs.length - 1) / 2] : (vs[vs.length / 2 - 1] + vs[vs.length / 2]) / 2;
      self(el, "k").innerHTML = kpi("Windows", res.length) + kpi("Lost money", pct(neg / res.length * 100, 0), neg ? "bad" : "good") +
        kpi("Worst (avg/yr)", pct(worst.v, 1), "bad") + kpi("Median (avg/yr)", pct(med, 1)) + kpi("Best (avg/yr)", pct(best.v, 1), "good");
      INV.barChart(self(el, "c"), { label: "Rolling returns", height: 250, yFmt: function (v) { return v + "%"; }, tipFmt: function (v) { return pct(v, 1) + " a year"; }, maxLabels: 10,
        data: res.map(function (x) { return { label: String(x.y), tip: n === 1 ? String(x.y) : x.y + "–" + (x.y + n - 1), y: x.v }; }) });
      self(el, "n2").innerHTML = "Worst window: " + (n === 1 ? worst.y : worst.y + "–" + (worst.y + n - 1)) + ". Best: " + (n === 1 ? best.y : best.y + "–" + (best.y + n - 1)) + ". " +
        (mode === "real" ? "Figures are after inflation (real). " : "Figures are before inflation (nominal). ") + "Before taxes and fees; the 60/40 mix is rebalanced every year.";
    }
    wire(el, run);
  };

  /* ---------- 7. Crash replay (INV-003) ---------- */
  TOOLS.replay = function (el) {
    var u = uid(el), h = hist();
    var EP = [{ k: "1929", y0: 1929, y1: 1945, t: "The Great Depression" }, { k: "1973", y0: 1973, y1: 1985, t: "1973–74 and the inflation decade" },
      { k: "2000", y0: 2000, y1: 2012, t: "Dot-com bust and 2008" }, { k: "2008", y0: 2008, y1: 2016, t: "Global financial crisis" }, { k: "2022", y0: 2022, y1: h.last, t: "2022: stocks and bonds fall together" }];
    shell(el, "Replay a market crash", "Historical data",
      '<div class="fld"><label for="' + u + '-e">Episode</label><select id="' + u + '-e">' + EP.map(function (e) { return '<option value="' + e.k + '">' + esc(e.t) + "</option>"; }).join("") + "</select></div>" +
      numf(u + "-amt", "Invested at the start ($)", 100000, 1000) +
      rng(u + "-s", "Mix", 0, 100, 10, 100, "stk") +
      '<div class="fld"><label>Measure</label><div class="seg" role="group"><button type="button" data-v="nom" aria-pressed="true">Nominal</button><button type="button" data-v="real" aria-pressed="false">After inflation</button></div></div>' +
      '<p class="hint" style="font-size:.76rem;color:var(--muted)">Calendar-year data. Declines inside a year were deeper than year-end figures show.</p>',
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    var mode = "nom";
    el.querySelectorAll(".seg button").forEach(function (b) {
      b.addEventListener("click", function () { mode = b.dataset.v; el.querySelectorAll(".seg button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); run(); });
    });
    function run() {
      var e = EP.find(function (x) { return x.k === self(el, "e").value; }), amt0 = Math.max(0, Number(self(el, "amt").value) || 0), amt = amt0 > 0 ? amt0 : 100000, s = Number(self(el, "s").value) / 100;
      var v = amt, vs = amt, pts = [[e.y0, amt]], ptsS = [[e.y0, amt]], low = amt, lowY = e.y0, rec = null, cpi = 1;
      for (var y = e.y0; y <= e.y1; y++) {
        var i = yIndex(y), r = mixRet(i, s), rs = h.stocks[i];
        cpi *= 1 + h.cpi[i] / 100;
        v *= 1 + r / 100; vs *= 1 + rs / 100;
        var vv = mode === "real" ? v / cpi : v, vvs = mode === "real" ? vs / cpi : vs;
        pts.push([y + 1, vv]); ptsS.push([y + 1, vvs]);
        if (vv < low) { low = vv; lowY = y + 1; }
        if (rec === null && lowY < y + 1 && vv >= amt && low < amt) rec = y + 1;
      }
      var endV = pts[pts.length - 1][1];
      self(el, "k").innerHTML = kpi("Low point", money(low), low < amt ? "bad" : "") + kpi("Fall from start", pct((low / amt - 1) * 100, 0), low < amt ? "bad" : "") +
        kpi("Back to start", low >= amt ? "Never below" : (rec ? "start of " + rec : "not by " + (e.y1 + 1))) + kpi("End of " + e.y1, money(endV));
      var ser = [{ name: Math.round(s * 100) + "% stocks mix", color: "var(--s1)", data: pts }];
      if (s < 1) ser.push({ name: "100% stocks", color: "var(--s5)", data: ptsS, dash: "5 4" });
      INV.lineChart(self(el, "c"), { label: "Value through the episode", height: 260, yFmt: ms, xFmt: yearFmt, zeroBase: false,
        series: ser, marks: [{ x: e.y0, label: "Invest" }] });
      self(el, "n2").innerHTML = (amt0 > 0 ? "" : "No amount entered, so $100,000 is shown. ") + "Values shown at the start of each year (after the prior year's return). " + (mode === "real" ? "Adjusted for inflation. " : "") +
        (rec ? "It took until the start of " + rec + " to get back to the starting amount — " + (rec - e.y0) + " years." : low < amt ? "It had not recovered by the end of the episode shown." : "This mix never fell below its starting value at a year-end.");
    }
    wire(el, run);
  };

  /* ---------- 8. Stock / bond mixer (INV-004) ---------- */
  function mixStats(s, y0, y1) {
    var h = hist(), rets = [], g = 1, peak = 1, mdd = 0, under = 0, maxUnder = 0, path = [[y0, 10000]];
    for (var y = y0; y <= y1; y++) {
      var r = mixRet(yIndex(y), s); rets.push(r); g *= 1 + r / 100;
      path.push([y + 1, 10000 * g]);
      if (g > peak) { peak = g; under = 0; } else { under++; maxUnder = Math.max(maxUnder, under); }
      mdd = Math.min(mdd, g / peak - 1);
    }
    var mean = rets.reduce(function (a, b) { return a + b; }, 0) / rets.length;
    var sd = Math.sqrt(rets.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / (rets.length - 1));
    return { cagr: (Math.pow(g, 1 / rets.length) - 1) * 100, mean: mean, sd: sd, worst: Math.min.apply(null, rets), mdd: mdd * 100, under: maxUnder, path: path, n: rets.length };
  }
  INV.mixStats = mixStats;
  TOOLS.mixer = function (el) {
    var u = uid(el), h = hist();
    shell(el, "Mix stocks and bonds, see what history did", "Historical data",
      rng(u + "-s", "Mix", 0, 100, 5, 60, "stk") +
      '<div class="fld"><label for="' + u + '-p">Period</label><select id="' + u + '-p"><option value="1928">1928–' + h.last + ' (all data)</option><option value="1976">1976–' + h.last + '</option><option value="2000">2000–' + h.last + '</option><option value="2010">2010–' + h.last + "</option></select></div>" +
      '<p class="hint" style="font-size:.76rem;color:var(--muted)">Bonds are 10-year US Treasuries. The mix is rebalanced back to target at each year-end. Calendar-year returns, before taxes and fees.</p>',
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><div class="fig-title" style="margin-top:10px">Every mix from 0% to 100% stocks over the same period</div><div id="' + u + '-f"></div>');
    function run() {
      var s = Number(self(el, "s").value) / 100, y0 = Number(self(el, "p").value), y1 = h.last;
      var st = mixStats(s, y0, y1), a = mixStats(1, y0, y1), b = mixStats(0, y0, y1);
      self(el, "k").innerHTML = kpi("Growth rate / yr", pct(st.cagr, 1)) + kpi("Typical swing (std. dev.)", pct(st.sd, 1)) +
        kpi("Worst year", pct(st.worst, 1), "bad") + kpi("Deepest fall (year-end)", pct(st.mdd, 0), "bad") + kpi("Longest below a prior peak", st.under + " yrs");
      INV.lineChart(self(el, "c"), { label: "Growth of $10,000", log: true, height: 250, yFmt: ms, xFmt: yearFmt, yTitle: "Growth of $10,000 (log scale)",
        series: [{ name: Math.round(s * 100) + "/" + Math.round(100 - s * 100) + " mix", color: "var(--s1)", data: st.path, width: 3 },
          { name: "100% stocks", color: "var(--s5)", data: a.path, dash: "5 4", width: 1.6 }, { name: "100% bonds", color: "var(--s2)", data: b.path, dash: "5 4", width: 1.6 }] });
      var curve = [], dots = [];
      for (var k = 0; k <= 100; k += 10) { var m = mixStats(k / 100, y0, y1); curve.push([m.sd, m.cagr]); }
      dots.push({ x: st.sd, y: st.cagr, label: Math.round(s * 100) + "% stocks", color: "var(--s1)" });
      INV.lineChart(self(el, "f"), { label: "Risk versus return for every mix", height: 220, xTitle: "Typical yearly swing — standard deviation (%)", yTitle: "Growth / yr (%)", zeroBase: false,
        xFmt: function (v) { return v.toFixed(0) + "%"; }, yFmt: function (v) { return v.toFixed(1) + "%"; }, legend: false,
        series: [{ name: "Mixes 0–100% stocks, in 10-point steps", color: "var(--s6)", data: curve }], dots: dots });
    }
    wire(el, run);
  };

  /* ---------- 9. Diversification curve (INV-004) ---------- */
  TOOLS.divcurve = function (el) {
    var u = uid(el);
    shell(el, "How many stocks does it take?", "Model",
      rng(u + "-v", "Volatility of a typical single stock", 15, 60, 1, 35, "pct") +
      rng(u + "-c", "Average correlation between stocks", 0, 0.9, 0.05, 0.3) +
      rng(u + "-n", "Stocks in the portfolio", 1, 100, 1, 20) +
      '<p class="hint" style="font-size:.76rem;color:var(--muted)">Equal-weighted portfolio of stocks with identical volatility σ and pairwise correlation ρ: portfolio σₚ = σ √(1/n + (1 − 1/n)ρ). An idealized model, not a forecast.</p>',
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function sp(sig, rho, n) { return sig * Math.sqrt(1 / n + (1 - 1 / n) * rho); }
    function run() {
      var sig = Number(self(el, "v").value), rho = Number(self(el, "c").value), n = Number(self(el, "n").value);
      var one = sp(sig, rho, 1), now = sp(sig, rho, n), floor = sig * Math.sqrt(rho);
      self(el, "k").innerHTML = kpi("One stock", pct(one, 0)) + kpi(n + " stocks", pct(now, 1)) + kpi("Floor (∞ stocks)", pct(floor, 1)) +
        kpi("Risk removed", pct(one > floor ? (one - now) / (one - floor) * 100 : 100, 0), "good");
      var pts = [], fl = []; for (var k = 1; k <= 100; k++) { pts.push([k, sp(sig, rho, k)]); fl.push([k, floor]); }
      INV.lineChart(self(el, "ch"), { label: "Portfolio volatility by number of stocks", height: 240, xTitle: "Number of stocks", yTitle: "Portfolio volatility (%)",
        xFmt: yearFmt, yFmt: function (v) { return v + "%"; }, series: [{ name: "Portfolio volatility", color: "var(--s1)", data: pts, area: true }, { name: "Market-risk floor", color: "var(--s5)", data: fl, dash: "5 4" }],
        dots: [{ x: n, y: now, label: pct(now, 1), color: "var(--s1)" }] });
      self(el, "n2").innerHTML = "The part that disappears is <b>company-specific</b> risk. What remains — the floor, σ√ρ = " + pct(floor, 1) + " — is <b>market</b> risk that more stocks of the same kind cannot remove. Adding assets that are less correlated (bonds, other countries) lowers the floor itself.";
    }
    wire(el, run);
  };

  /* ---------- 10. Concentration (INV-004) ---------- */
  TOOLS.concentration = function (el) {
    var u = uid(el);
    shell(el, "What if your employer's stock collapses?", "Calculator",
      numf(u + "-t", "Total retirement savings ($)", 200000, 5000) + rng(u + "-w", "Share in one company's stock", 0, 100, 1, 63, "pct") +
      rng(u + "-d", "That stock falls by", 0, 100, 1, 99, "pct") + rng(u + "-o", "Everything else returns", -40, 30, 1, -10, "pct"),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div>');
    function run() {
      var t = Math.max(0, Number(self(el, "t").value) || 0), w = Number(self(el, "w").value) / 100, d = Number(self(el, "d").value) / 100, o = Number(self(el, "o").value) / 100;
      /* the percentage change does not depend on the amount, so it is computed per dollar */
      var chg = w * (1 - d) + (1 - w) * (1 + o) - 1, after = t * (1 + chg);
      self(el, "k").innerHTML = kpi("Before", money(t)) + kpi("After", money(after), chg < 0 ? "bad" : "good") + kpi("Change", pct(chg * 100, 0), chg < 0 ? "bad" : "good");
      var data = []; for (var k = 0; k <= 100; k += 10) { var c2 = (k / 100) * (1 - d) + (1 - k / 100) * (1 + o) - 1; data.push({ label: k + "%", tip: k + "% in the one stock", y: c2 * 100, color: k === Math.round(w * 10) * 10 ? "var(--s1)" : undefined }); }
      INV.barChart(self(el, "c"), { label: "Portfolio change by concentration", height: 220, xTitle: "Share of savings in the single stock", yFmt: function (v) { return Math.round(v) + "%"; }, tipFmt: function (v) { return pct(v, 0) + " for the whole portfolio"; }, data: data, allLabels: true });
    }
    wire(el, run);
  };

  /* ---------- 11. Valuation basics (INV-006) ---------- */
  TOOLS.valuation = function (el) {
    var u = uid(el);
    shell(el, "Price, earnings and what the price implies", "Calculator",
      numf(u + "-p", "Share price ($)", 48, 0.5) + numf(u + "-e", "Earnings per share, last 12 months ($)", 2.4, 0.05) +
      numf(u + "-d", "Dividend per share, yearly ($)", 0.96, 0.02) +
      rng(u + "-r", "Return you require from this stock", 4, 14, 0.5, 9, "pct"),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var P = Number(self(el, "p").value) || 0, E = Number(self(el, "e").value) || 0, D = Number(self(el, "d").value) || 0, r = Number(self(el, "r").value) / 100;
      var pe = E > 0 ? P / E : NaN, ey = P > 0 ? E / P * 100 : NaN, dy = P > 0 ? D / P * 100 : NaN, po = E > 0 ? D / E * 100 : NaN;
      var g = P > 0 && D > 0 ? (r - D / P) * 100 : NaN;
      self(el, "k").innerHTML = kpi("P/E ratio", isFinite(pe) ? pe.toFixed(1) + "×" : "n/a") + kpi("Earnings yield", isFinite(ey) ? pct(ey, 2) : "n/a") +
        kpi("Dividend yield", isFinite(dy) ? pct(dy, 2) : "n/a") + kpi("Payout ratio", isFinite(po) ? pct(po, 0) : "n/a") + kpi("Growth the price implies", isFinite(g) ? pct(g, 1) + "/yr" : "n/a");
      var data = [];
      [10, 15, 20, 25, 30, 40, 50].forEach(function (m) { data.push({ label: m + "×", tip: "P/E of " + m, y: 100 / m, color: isFinite(pe) && Math.abs(pe - m) < 2.5 ? "var(--s1)" : "var(--s6)" }); });
      INV.barChart(self(el, "c"), { label: "Earnings yield at different P/E ratios", height: 200, xTitle: "P/E ratio", yFmt: function (v) { return v.toFixed(0) + "%"; }, tipFmt: function (v) { return "earnings yield " + v.toFixed(1) + "%"; }, data: data, allLabels: true, valueLabels: true });
      self(el, "n2").innerHTML = "Implied growth uses the constant-growth (Gordon) model, P = D<sub>1</sub> ÷ (r − g), rearranged to g ≈ r − D ÷ P, using this year's dividend as an approximation for next year's. " +
        (isFinite(g) ? "At " + money(P) + " a share and a " + pct(r * 100, 1) + " required return, the dividend must grow about <b>" + pct(g, 1) + "</b> a year forever to justify the price." : "The implied-growth figure needs a share price and a dividend above zero; the model does not apply to a company that pays no dividend.");
    }
    wire(el, run);
  };

  /* ---------- 12. Fee drag (INV-007) ---------- */
  TOOLS.fees = function (el) {
    var u = uid(el);
    shell(el, "What fees really cost over time", "Calculator",
      numf(u + "-p", "Starting amount ($)", 100000, 1000) + numf(u + "-c", "Added each year ($)", 6000, 500) +
      rng(u + "-r", "Return before fees", 1, 12, 0.5, 7, "pct") + rng(u + "-n", "Years", 1, 50, 1, 30, "yr") +
      rng(u + "-a", "Fee A (e.g. index fund)", 0, 3, 0.01, 0.05, "pct") + rng(u + "-b", "Fee B (e.g. advisor + funds)", 0, 3, 0.01, 1.25, "pct"),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function grow(P, C, r, f, n) { var b = P, pts = [[0, P]], paid = 0; for (var y = 1; y <= n; y++) { b += C; var fee = b * (1 + r) * f; b = b * (1 + r) - fee; paid += fee; pts.push([y, b]); } return { b: b, pts: pts, paid: paid }; }
    function run() {
      var P = Number(self(el, "p").value) || 0, C = Number(self(el, "c").value) || 0, r = Number(self(el, "r").value) / 100, n = Number(self(el, "n").value),
        fa = Number(self(el, "a").value) / 100, fb = Number(self(el, "b").value) / 100;
      var A = grow(P, C, r, fa, n), B = grow(P, C, r, fb, n), Z = grow(P, C, r, 0, n);
      var gap = A.b - B.b;
      self(el, "k").innerHTML = kpi("With fee A", money(A.b)) + kpi("With fee B", money(B.b)) + kpi("Difference", money(gap), gap > 0 ? "bad" : "") + kpi("Share of no-fee result lost to B", pct(Z.b ? (1 - B.b / Z.b) * 100 : 0, 0), "bad");
      INV.lineChart(self(el, "ch"), { label: "Balance with two fee levels", height: 260, xTitle: "Years", yFmt: ms, xFmt: yearFmt,
        series: [{ name: "Fee A " + pct(fa * 100, 2), color: "var(--s2)", data: A.pts }, { name: "Fee B " + pct(fb * 100, 2), color: "var(--s5)", data: B.pts }, { name: "No fees", color: "var(--s6)", data: Z.pts, dash: "4 4", width: 1.4 }] });
      self(el, "n2").innerHTML = gap > 0 ? "Fee B's " + pct(fb * 100, 2) + " a year looks small, but it is charged on the <i>whole balance</i> every year, and the money taken can no longer compound. After " + n +
        " years it leaves you with <b>" + money(gap) + "</b> less than fee A. Compared with no fees at all, fee B costs " + money(Z.b - B.b) + " — more than the " + money(B.paid) + " actually deducted, because the deducted dollars also lost their future growth."
        : gap < 0 ? "Fee A is the higher fee here, so fee B ends " + money(-gap) + " ahead after " + n + " years." : "The two fees are equal, so the balances match.";
    }
    wire(el, run);
  };

  /* ---------- 13. Order-type lab (INV-005) ---------- */
  TOOLS.orders = function (el) {
    var u = uid(el);
    /* A fictional trading day for "Lakeside Coffee Co." (LKSD). Prices are illustrative. */
    var path = [40.00, 40.10, 40.25, 40.05, 39.80, 39.60, 39.75, 39.40, 38.90, 38.60, 38.95, 39.30, 39.10, 38.70, 38.20, 37.60, 37.90, 38.40, 38.80, 39.20, 39.60, 39.45, 39.90, 40.30, 40.60, 40.45, 40.80, 41.10, 40.90, 41.25];
    var spread = 0.04;
    shell(el, "Order-type lab: one trading day for LKSD", "Simulation",
      '<div class="fld"><label for="' + u + '-t">Order</label><select id="' + u + '-t"><option value="mkt">Market buy, 100 shares, at the open</option><option value="lim">Limit buy, 100 shares, good for the day</option><option value="stop">Stop (stop-loss) sell of 100 shares you own</option><option value="stoplim">Stop-limit sell of 100 shares you own</option></select></div>' +
      '<div class="fld" data-p><label for="' + u + '-px">Your price ($) <output id="' + u + '-px-o"></output></label><input type="range" id="' + u + '-px" min="37" max="41" step="0.1" value="38.5" data-fmt="money"></div>' +
      '<div class="fld" data-l><label for="' + u + '-lx">Limit price for the stop-limit ($) <output id="' + u + '-lx-o"></output></label><input type="range" id="' + u + '-lx" min="36.5" max="40.5" step="0.1" value="38.0" data-fmt="money"></div>' +
      '<p class="hint" style="font-size:.76rem;color:var(--muted)">A fictional company and a made-up day. Buyers pay the ask and sellers receive the bid; the spread here is $0.04.</p>',
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var t = self(el, "t").value, px = Number(self(el, "px").value), lx = Number(self(el, "lx").value);
      el.querySelector("[data-p]").hidden = t === "mkt"; el.querySelector("[data-l]").hidden = t !== "stoplim";
      var fill = null, fillPx = null, note = "", trig = null;
      if (t === "mkt") { fill = 0; fillPx = path[0] + spread / 2; note = "A market order fills right away at the best available ask. You are guaranteed a fill, not a price."; }
      if (t === "lim") {
        for (var i = 0; i < path.length; i++) { var ask = path[i] + spread / 2; if (ask <= px) { fill = i; fillPx = Math.min(px, ask); break; } }
        note = fill == null ? "The price never fell to your limit, so nothing happened. A limit order guarantees the price, not the fill." : "Your limit order waited until the ask reached your price, then filled. You bought no higher than your limit.";
      }
      if (t === "stop" || t === "stoplim") {
        for (var k = 0; k < path.length; k++) { var bid = path[k] - spread / 2; if (bid <= px) { trig = k; break; } }
        if (trig == null) note = "The price never fell to your stop, so the order never triggered.";
        else if (t === "stop") { fill = trig; fillPx = Math.min(px, path[trig] - spread / 2); note = "At your stop price the order became a market sell and filled at the next bid. In a fast fall that can be well below the stop."; }
        else {
          for (var m = trig; m < path.length; m++) { if (path[m] - spread / 2 >= lx) { fill = m; fillPx = Math.max(lx, path[m] - spread / 2); break; } }
          note = fill == null ? "The stop triggered, but the bid stayed below your limit, so the sell never filled — you still own the shares as the price kept moving." : "The stop triggered and became a limit sell; it filled at or above your limit.";
        }
      }
      var buy = t === "mkt" || t === "lim";
      self(el, "k").innerHTML = kpi("Filled?", fill == null ? "No" : "Yes", fill == null ? "bad" : "good") + kpi("Fill price", fillPx == null ? "—" : money(fillPx, 2)) +
        kpi(buy ? "Cost of 100 shares" : "Proceeds of 100 shares", fillPx == null ? "—" : money(fillPx * 100, 2)) + kpi("Close", money(path[path.length - 1], 2));
      var pts = path.map(function (p, i) { return [i, p]; });
      var dots = [], mk = [];
      if (fill != null) dots.push({ x: fill, y: path[fill], label: "Filled " + money(fillPx, 2), color: "var(--s1)" });
      if (trig != null && t !== "stop") mk.push({ x: trig, label: "Stop triggered" });
      var lines = [{ name: "LKSD price", color: "var(--s6)", data: pts }];
      if (t !== "mkt") lines.push({ name: (t === "lim" ? "Limit" : "Stop") + " " + money(px, 2), color: "var(--s3)", data: pts.map(function (p) { return [p[0], px]; }), dash: "5 4", width: 1.6 });
      if (t === "stoplim") lines.push({ name: "Limit " + money(lx, 2), color: "var(--s5)", data: pts.map(function (p) { return [p[0], lx]; }), dash: "2 3", width: 1.6 });
      INV.lineChart(self(el, "c"), { label: "Intraday price", height: 240, zeroBase: false, yMin: 36.5, yMax: 41.5, xTitle: "Time of day",
        xTicks: [0, 6, 12, 18, 24, 29], xFmt: function (v) { var mins = 570 + Math.round(v * 390 / 29); var hh = Math.floor(mins / 60), mm = mins % 60; return (hh > 12 ? hh - 12 : hh) + ":" + (mm < 10 ? "0" : "") + mm; },
        yFmt: function (v) { return "$" + v.toFixed(2); }, series: lines, dots: dots, marks: mk });
      self(el, "n2").innerHTML = note;
    }
    wire(el, run);
  };

  /* ---------- Auto-init ---------- */
  INV.ready(function () {
    document.querySelectorAll("[data-tool]").forEach(function (el) {
      var f = TOOLS[el.getAttribute("data-tool")];
      if (f) { try { f(el); } catch (e) { el.innerHTML = '<div class="callout bad"><div>This tool could not start: ' + esc(e.message) + "</div></div>"; } }
    });
  });
})();
