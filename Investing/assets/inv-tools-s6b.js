/* Investing Learning Lab - Stage 6 tools (INV-049 to INV-054) - V1.2 (September 2026)
   Author: Namiranian, Babak. Every tool computes in the browser from its stated formula.
   US historical series: window.INV_RETURNS (Damodaran, NYU Stern, 1928-2025).
   CAPE: window.INV_CAPE (Shiller, ie_data.xls).
   International series below: Kenneth R. French Data Library (Fama/French), annual
   returns in US dollars = annual "Mkt-RF" + "RF" from F-F_Research_Data_Factors (US,
   CRSP, file built with the 202607 CRSP database), Developed_ex_US_3_Factors and
   Emerging_5_Factors (files built with the 202608 Bloomberg database), downloaded
   September 2026 from mba.tuck.dartmouth.edu/pages/faculty/ken.french/data_library.html.
   Columns: year, US total market, developed markets excluding the US, emerging markets (% per year). */
(function () {
  "use strict";
  var INV = window.INV; if (!INV || !INV.tools) return;
  var esc = INV.esc, money = INV.money, ms = INV.moneyShort, pct = INV.pct;
  var TOOLS = INV.tools;

  window.INV_S6B_INTL = { source: "Kenneth R. French Data Library (Fama/French market returns in USD), downloaded September 2026",
    cols: ["year", "us", "dev", "em"],
    rows: [[1991,34.82,9.45,37.22],[1992,9.78,-15.37,4.03],[1993,11.16,30.19,89.27],[1994,-0.15,10.0,-11.34],[1995,36.85,8.42,-5.13],[1996,21.21,5.86,9.33],[1997,31.26,-0.49,-15.4],[1998,24.25,16.8,-20.54],[1999,25.23,36.64,64.66],[2000,-11.59,-16.44,-32.0],[2001,-11.2,-21.11,-2.3],[2002,-21.12,-11.97,-6.3],[2003,31.69,43.91,55.47],[2004,11.95,22.69,29.39],[2005,6.11,16.8,36.06],[2006,15.37,25.52,33.57],[2007,5.73,13.02,40.45],[2008,-36.65,-42.8,-53.76],[2009,28.65,33.54,81.87],[2010,17.44,11.89,22.73],[2011,0.52,-12.6,-18.74],[2012,16.36,17.29,19.33],[2013,35.18,23.02,0.06],[2014,11.76,-4.52,0.01],[2015,0.22,-0.76,-11.14],[2016,13.56,3.29,10.46],[2017,22.3,27.12,35.67],[2018,-5.01,-14.0,-13.9],[2019,30.57,21.88,16.9],[2020,24.03,10.6,18.17],[2021,23.91,12.15,2.34],[2022,-19.9,-15.04,-17.76],[2023,26.7,16.06,12.48],[2024,25.02,3.59,6.44],[2025,17.55,31.92,29.6]] };

  /* ---------- helpers (same style as inv-tools.js) ---------- */
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
    return '<div class="fld"><label for="' + id + '">' + esc(label) + '</label><select id="' + id + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(val) ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select></div>";
  }
  function seg(label, opts) {
    return '<div class="fld"><label>' + esc(label) + '</label><div class="seg" role="group">' + opts.map(function (o, i) { return '<button type="button" data-v="' + o[0] + '" aria-pressed="' + (i === 0 ? "true" : "false") + '">' + esc(o[1]) + "</button>"; }).join("") + "</div></div>";
  }
  function hint(t) { return '<p class="hint" style="font-size:.76rem;color:var(--muted)">' + t + "</p>"; }
  function self(el, id) { return el.querySelector("#" + el.dataset.uid + "-" + id); }
  function uid(el) { if (!el.dataset.uid) el.dataset.uid = "t" + Math.random().toString(36).slice(2, 8); return el.dataset.uid; }
  function fmtOut(input) {
    var o = input.parentNode.querySelector("output"); if (!o) return;
    var f = input.getAttribute("data-fmt"), v = Number(input.value);
    o.textContent = f === "pct" ? v.toFixed(input.step.indexOf(".") > -1 ? (input.step.split(".")[1].length) : 0) + "%" :
      f === "spct" ? (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(input.step.indexOf(".") > -1 ? (input.step.split(".")[1].length) : 0) + "%" :
      f === "yr" ? v + (v === 1 ? " year" : " years") : f === "age" ? "age " + v : f === "year" ? String(v) :
      f === "rel" ? (v > 0 ? v + (v === 1 ? " year to go" : " years to go") : v < 0 ? (-v) + (v === -1 ? " year after" : " years after") : "retiring now") :
      f === "stk" ? v + "% stocks / " + (100 - v) + "% bonds" : String(v);
  }
  function wire(el, fn) {
    el.querySelectorAll("input,select").forEach(function (i) {
      i.addEventListener("input", function () { if (i.type === "range") fmtOut(i); fn(); });
      i.addEventListener("change", function () { if (i.type === "range") fmtOut(i); fn(); });
      if (i.type === "range") fmtOut(i);
    });
    fn();
    document.addEventListener("inv-theme", fn);
  }
  function segWire(el, key, state, fn) {
    var g = el.querySelectorAll(".seg")[key];
    g.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () { state.v = b.dataset.v; g.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); fn(); });
    });
  }
  function kpi(k, v, cls) { return '<div class="kpi"><div class="k">' + esc(k) + '</div><div class="v ' + (cls || "") + '">' + v + "</div></div>"; }
  function yearFmt(v) { return String(Math.round(v)); }
  function num(el, id) { var v = Number(self(el, id).value); return isFinite(v) ? v : 0; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  var H = null;
  function hist() { if (!H) H = INV.hist(); return H; }
  var IX = null;
  function intl() {
    if (!IX) { IX = {}; window.INV_S6B_INTL.rows.forEach(function (r) { IX[r[0]] = { us: r[1], dev: r[2], em: r[3] }; }); }
    return IX;
  }

  /* ---------- shared portfolio statistics ----------
     rets: array of {y, r (nominal %), cpi (%)}; start value 1 at the start of the first year.
     Drawdowns and recovery are measured on year-end values (real if real=true). */
  function stats(rets, real) {
    var g = 1, gr = 1, peak = 1, mdd = 0, mddY = null, under = 0, maxUnder = 0, underStart = null, maxUnderFrom = null, open = false;
    var path = [[rets.length ? rets[0].y : 0, 1]], pathR = [[rets.length ? rets[0].y : 0, 1]], worst = Infinity, worstY = null, best = -Infinity, bestY = null, list = [];
    rets.forEach(function (o) {
      g *= 1 + o.r / 100; gr *= (1 + o.r / 100) / (1 + o.cpi / 100);
      var rr = ((1 + o.r / 100) / (1 + o.cpi / 100) - 1) * 100, v = real ? gr : g;
      list.push(o.r);
      if (o.r < worst) { worst = o.r; worstY = o.y; }
      if (o.r > best) { best = o.r; bestY = o.y; }
      path.push([o.y + 1, g]); pathR.push([o.y + 1, gr]);
      if (v >= peak) { peak = v; under = 0; underStart = null; }
      else { if (!under) underStart = o.y; under++; if (under > maxUnder) { maxUnder = under; maxUnderFrom = underStart; } }
      if (v / peak - 1 < mdd) { mdd = v / peak - 1; mddY = o.y; }
    });
    open = under > 0 && under === maxUnder;
    var n = rets.length, mean = list.reduce(function (a, b) { return a + b; }, 0) / Math.max(1, n);
    var sd = n > 1 ? Math.sqrt(list.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / (n - 1)) : 0;
    return { n: n, cagr: n ? (Math.pow(g, 1 / n) - 1) * 100 : 0, rcagr: n ? (Math.pow(gr, 1 / n) - 1) * 100 : 0, sd: sd, worst: worst, worstY: worstY, best: best, bestY: bestY,
      mdd: mdd * 100, mddY: mddY, under: maxUnder, underFrom: maxUnderFrom, open: open, end: g, endR: gr, path: path, pathR: pathR };
  }

  /* ---------- allocation models (INV-049) ---------- */
  var MODELS = [
    { k: "s100", n: "100% stocks", w: { stocks: 1 } },
    { k: "s80", n: "80/20 stocks/bonds", w: { stocks: 0.8, tbond: 0.2 } },
    { k: "s6040", n: "60/40 stocks/bonds", w: { stocks: 0.6, tbond: 0.4 } },
    { k: "s4060", n: "40/60 stocks/bonds", w: { stocks: 0.4, tbond: 0.6 } },
    { k: "three", n: "Three-fund (36/24/40), 1991+", w: { stocks: 0.36, dev: 0.24, tbond: 0.4 }, from: 1991 },
    { k: "aw", n: "All Weather-style (approx.)", w: { stocks: 0.3, tbond: 0.55, gold: 0.15 } },
    { k: "pp", n: "Permanent Portfolio", w: { stocks: 0.25, tbond: 0.25, tbill: 0.25, gold: 0.25 } },
    { k: "gb", n: "Golden Butterfly (approx.)", w: { stocks: 0.4, tbond: 0.2, tbill: 0.2, gold: 0.2 } },
    { k: "age", n: "110 minus age", age: true },
    { k: "mine", n: "Your own mix", mine: true }
  ];
  INV.s6bModels = MODELS;
  function modelReturns(m, y0, y1, opt) {
    var h = hist(), I = intl(), out = [];
    for (var y = y0; y <= y1; y++) {
      var i = y - h.first, w = m.w, r = 0;
      if (m.age) { var a = (opt.age || 40) + (y - y0), s = clamp(110 - a, 0, 100) / 100; w = { stocks: s, tbond: 1 - s }; }
      if (m.mine) w = opt.mine;
      if (w.dev && !I[y]) return null;
      Object.keys(w).forEach(function (k) { if (!w[k]) return; r += w[k] * (k === "dev" ? I[y].dev : h[k][i]); });
      out.push({ y: y, r: r, cpi: h.cpi[i] });
    }
    return out;
  }
  INV.s6bModelStats = function (key, y0, y1, opt) { var m = MODELS.find(function (x) { return x.k === key; }); var r = modelReturns(m, y0, y1, opt || {}); return r ? stats(r, !!(opt && opt.real)) : null; };

  TOOLS.s6bModels = function (el) {
    var u = uid(el), h = hist();
    shell(el, "Compare allocation models on 98 years of data", "Historical data",
      sel(u + "-m", "Model to highlight", MODELS.map(function (m) { return [m.k, m.n]; }), "s6040") +
      rng(u + "-y0", "First year", h.first, h.last - 9, 1, 1972, "year") + rng(u + "-y1", "Last year", h.first + 9, h.last, 1, h.last, "year") +
      seg("Measure drawdowns", [["nom", "Nominal"], ["real", "After inflation"]]) +
      rng(u + "-age", "110 minus age: age in the first year", 20, 80, 1, 40, "age") +
      '<div class="fld"><label>Your own mix (rescaled to 100%)</label></div>' +
      rng(u + "-ws", "Stocks", 0, 100, 5, 50, "pct") + rng(u + "-wb", "10-year Treasuries", 0, 100, 5, 30, "pct") + rng(u + "-wt", "T-bills (cash)", 0, 100, 5, 10, "pct") + rng(u + "-wg", "Gold", 0, 100, 5, 10, "pct") +
      hint("Stocks are the S&P 500 with dividends; bonds are 10-year Treasuries; cash is 3-month T-bills; gold is the gold price (fixed by the US government before the 1970s). Rebalanced every year-end. Before fees and taxes. The three-fund row uses Fama/French developed-ex-US returns, so it appears only from 1991."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><div class="tbl-wrap" id="' + u + '-t"></div><p class="tool-note" id="' + u + '-n"></p>');
    var mode = { v: "nom" };
    segWire(el, 0, mode, run);
    function run() {
      var y0 = num(el, "y0"), y1 = num(el, "y1");
      if (y1 < y0 + 9) { y1 = Math.min(h.last, y0 + 9); self(el, "y1").value = y1; fmtOut(self(el, "y1")); }
      var ws = [num(el, "ws"), num(el, "wb"), num(el, "wt"), num(el, "wg")], tot = ws[0] + ws[1] + ws[2] + ws[3];
      if (tot <= 0) { ws = [100, 0, 0, 0]; tot = 100; }
      var opt = { age: num(el, "age"), mine: { stocks: ws[0] / tot, tbond: ws[1] / tot, tbill: ws[2] / tot, gold: ws[3] / tot }, real: mode.v === "real" };
      var key = self(el, "m").value, rows = [], hi = null;
      MODELS.forEach(function (m) { var r = modelReturns(m, y0, y1, opt); var st = r ? stats(r, opt.real) : null; rows.push({ m: m, st: st }); if (m.k === key) hi = { m: m, st: st }; });
      var note = "";
      if (!hi.st) { note = "The three-fund model needs international data, which starts in 1991. Showing 60/40 instead; move the first year to 1991 or later. "; hi = rows.find(function (x) { return x.m.k === "s6040"; }); }
      var st = hi.st;
      self(el, "k").innerHTML = kpi("Growth / yr", pct(st.cagr, 1)) + kpi("After inflation / yr", pct(st.rcagr, 1), st.rcagr > 0 ? "good" : "bad") +
        kpi("Worst year", pct(st.worst, 1) + " (" + st.worstY + ")", "bad") + kpi("Deepest fall (year-end)", pct(st.mdd, 0), "bad") +
        kpi("Longest below a peak", st.under + (st.under === 1 ? " yr" : " yrs") + (st.open ? "+" : ""));
      var cols = ["var(--s1)", "var(--s5)", "var(--s2)"], ser = [{ name: hi.m.n, color: cols[0], data: (opt.real ? st.pathR : st.path).map(function (p) { return [p[0], p[1] * 10000]; }), width: 3 }];
      ["s100", "s6040"].forEach(function (k, j) { if (k === hi.m.k) return; var o = rows.find(function (x) { return x.m.k === k; }); ser.push({ name: o.m.n, color: cols[j + 1], data: (opt.real ? o.st.pathR : o.st.path).map(function (p) { return [p[0], p[1] * 10000]; }), dash: "5 4", width: 1.6 }); });
      INV.lineChart(self(el, "c"), { label: "Growth of $10,000", log: true, height: 250, yFmt: ms, xFmt: yearFmt, yTitle: "Growth of $10,000" + (opt.real ? " in first-year dollars" : "") + " (log scale)", series: ser });
      var t = '<table class="tbl"><thead><tr><th>' + y0 + "&ndash;" + y1 + '</th><th class="r">Growth / yr</th><th class="r">Real / yr</th><th class="r">Worst year</th><th class="r">Deepest fall</th><th class="r">Longest under water</th></tr></thead><tbody>';
      rows.forEach(function (o) {
        if (!o.st) { t += "<tr><td>" + esc(o.m.n) + '</td><td class="r" colspan="5">needs a first year of 1991 or later</td></tr>'; return; }
        var b = o.m.k === hi.m.k ? ' style="font-weight:800"' : "";
        t += "<tr" + b + "><td>" + esc(o.m.n) + '</td><td class="r">' + pct(o.st.cagr, 1) + '</td><td class="r">' + pct(o.st.rcagr, 1) + '</td><td class="r neg-t">' + pct(o.st.worst, 1) + '</td><td class="r neg-t">' + pct(o.st.mdd, 0) + '</td><td class="r">' + o.st.under + (o.st.open ? "+" : "") + (o.st.under === 1 ? " yr" : " yrs") + "</td></tr>";
      });
      self(el, "t").innerHTML = t + "</tbody></table>";
      self(el, "n").innerHTML = note + "<b>" + esc(hi.m.n) + "</b>: $10,000 at the start of " + y0 + " became <b>" + money(st.end * 10000) + "</b> by the end of " + y1 + " (" + money(st.endR * 10000) + " in " + y0 + " dollars). " +
        "“Longest under water” counts consecutive year-ends below the previous peak" + (opt.real ? ", after inflation" : "") + "; a + means it was still under water at the end. Year-end data hide deeper falls inside a year.";
    }
    wire(el, run);
  };

  /* ---------- glide paths (INV-050) ----------
     x = years until the target (retirement) year; negative = years after.
     Vanguard: actual fund allocations at Sept 30, 2025 (prospectus dated Jan 2026); Income fund used for 7+ years after.
     T. Rowe Price: neutral allocations at Aug 1, 2026 (summary prospectuses).
     BlackRock LifePath Index: target table effective about June 1, 2026 (prospectus supplement).
     Fidelity Freedom Index: read from the prospectus glide-path chart (May 30, 2026), approximate. */
  var GP = [
    { k: "vg", n: "Vanguard Target Retirement", s: "Vanguard", c: "var(--s1)", pts: [[44, 91.5], [39, 91.6], [34, 91.5], [29, 91.5], [24, 91.2], [19, 83.5], [14, 76.2], [9, 68.6], [4, 60.8], [-1, 50.7], [-6, 36.5], [-7, 31.4], [-30, 31.4]] },
    { k: "fid", n: "Fidelity Freedom Index (approx.)", s: "Fidelity", c: "var(--s3)", pts: [[45, 95], [30, 95], [25, 92], [20, 90], [15, 81], [10, 67], [5, 58], [0, 51], [-5, 44], [-10, 38], [-15, 32], [-18, 30], [-30, 30]] },
    { k: "trp", n: "T. Rowe Price Retirement", s: "T. Rowe Price", c: "var(--s4)", pts: [[44, 97.99], [34, 97.99], [29, 97.82], [24, 96.59], [19, 93.4], [14, 84.98], [9, 74.6], [4, 63.01], [-1, 54.22], [-6, 50.37], [-11, 47.38], [-16, 44.19], [-21, 40.01]] },
    { k: "br", n: "BlackRock LifePath Index", s: "BlackRock", c: "var(--s2)", pts: [[45, 99], [30, 99], [25, 96], [20, 90], [15, 81], [10, 71], [5, 59], [0, 40], [-30, 40]] }
  ];
  INV.s6bGlide = GP;
  function eqAt(g, x) {
    var p = g.pts; if (x >= p[0][0]) return p[0][1];
    for (var i = 1; i < p.length; i++) { if (x >= p[i][0]) { var a = p[i - 1], b = p[i]; return b[1] + (a[1] - b[1]) * (x - b[0]) / (a[0] - b[0]); } }
    return null;
  }
  INV.s6bEqAt = function (k, x) { return eqAt(GP.find(function (g) { return g.k === k; }), x); };
  TOOLS.s6bGlide = function (el) {
    var u = uid(el), h = hist();
    shell(el, "Four glide paths, and what a bad year does to each", "Fund documents",
      rng(u + "-x", "Where you are", -21, 44, 1, 2, "rel") + numf(u + "-b", "Balance in the fund ($)", 400000, 10000) +
      sel(u + "-y", "Replay one historical year", [[2008, "2008 (financial crisis)"], [2022, "2022 (stocks and bonds fell)"], [2002, "2002 (dot-com bust)"], [1974, "1974 (inflation shock)"], [1931, "1931 (Depression)"], [2013, "2013 (a strong year)"]], 2008) +
      hint("Equity shares come from each family's own documents (see the sources list); Fidelity's is read from its prospectus chart. The replay applies that year's S&amp;P 500 and 10-year Treasury returns to each fund's stock and bond shares: a rough proxy that ignores international stocks, TIPS and fund-specific holdings. T. Rowe Price data stop 21 years after the target date."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><div id="' + u + '-d"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var x = num(el, "x"), bal = Math.max(0, num(el, "b")), yr = Number(self(el, "y").value), i = yr - h.first, rs = h.stocks[i], rb = h.tbond[i];
      var ks = "", bars = [], lo = null, hiF = null;
      GP.forEach(function (g) {
        var e = eqAt(g, x); var r = e / 100 * rs + (1 - e / 100) * rb;
        ks += kpi(g.s, pct(e, 0) + " stocks");
        bars.push({ label: g.s, tip: g.n + ": " + pct(e, 0) + " stocks", y: bal * r / 100, color: g.c });
        if (!lo || r < lo.r) lo = { g: g, r: r }; if (!hiF || r > hiF.r) hiF = { g: g, r: r };
      });
      self(el, "k").innerHTML = ks;
      var ser = GP.map(function (g) { return { name: g.n, color: g.c, data: g.pts.map(function (p) { return [-p[0], p[1]]; }) }; });
      INV.lineChart(self(el, "c"), { label: "Glide paths", height: 250, zeroBase: true, yMin: 0, yMax: 100, xTitle: "Years before (−) or after (+) the target", yTitle: "Share in stocks",
        xFmt: function (v) { return v === 0 ? "target" : v < 0 ? "−" + (-v) : "+" + v; }, yFmt: function (v) { return v + "%"; }, tipFmt: function (v) { return v.toFixed(1) + "% stocks"; },
        series: ser, marks: [{ x: -x, label: "You" }] });
      INV.barChart(self(el, "d"), { label: "One-year change", height: 200, allLabels: true, valueLabels: true, yFmt: function (v) { return (v < 0 ? "−$" : "$") + Math.round(Math.abs(v) / 1000) + "k"; }, tipFmt: function (v) { return (v < 0 ? "−" : "+") + money(Math.abs(v)); }, data: bars });
      self(el, "n").innerHTML = "In " + yr + ", stocks returned " + pct(rs, 1) + " and 10-year Treasuries " + pct(rb, 1) + ". On " + money(bal) + ", the gap between the most and least exposed of these funds would have been about <b>" + money(Math.abs(hiF.r - lo.r) * bal / 100) + "</b> in that single year. " +
        "Same label, same target year, different bets.";
    }
    wire(el, run);
  };

  /* ---------- lump sum vs cost averaging, annual data (INV-051) ---------- */
  function lsVsDca(y0, k, asset, cashOn) {
    var h = hist(), ls = 1, dc = 0, cash = 1;
    for (var j = 0; j < k; j++) {
      var i = y0 - h.first + j; if (i >= h.rows.length) return null;
      var r = asset === "mix" ? 0.6 * h.stocks[i] + 0.4 * h.tbond[i] : h.stocks[i];
      dc += 1 / k; cash -= 1 / k;
      ls *= 1 + r / 100; dc *= 1 + r / 100; cash *= 1 + (cashOn ? h.tbill[i] : 0) / 100;
    }
    return { ls: ls, dca: dc + cash };
  }
  INV.s6bLsDca = function (k, asset, cashOn) {
    var h = hist(), out = [];
    for (var y = h.first; y + k - 1 <= h.last; y++) { var o = lsVsDca(y, k, asset, cashOn); out.push({ y: y, adv: (o.ls / o.dca - 1) * 100, ls: o.ls, dca: o.dca }); }
    return out;
  };
  TOOLS.s6bDca = function (el) {
    var u = uid(el), h = hist();
    shell(el, "Invest it all now, or spread it over several years?", "Historical data",
      numf(u + "-a", "Windfall to invest ($)", 100000, 1000) +
      rng(u + "-kin", "Spread over (equal yearly installments)", 2, 5, 1, 3, "yr") +
      sel(u + "-s", "Invest in", [["stocks", "100% stocks (S&P 500)"], ["mix", "60% stocks / 40% Treasuries"]], "stocks") +
      seg("Money waiting to be invested earns", [["tb", "T-bill rate"], ["zero", "Nothing"]]) +
      rng(u + "-e", "Example start year", h.first, h.last - 1, 1, 2008, "year") +
      hint("Annual data only, so installments are made at the start of each year. Once the last installment is in, both portfolios hold the same thing, so the gap measured at that point is permanent. Monthly cost averaging over 3 to 12 months cannot be tested with yearly data; see Vanguard's monthly results in the text."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    var cash = { v: "tb" };
    segWire(el, 0, cash, run);
    function run() {
      var A = Math.max(0, num(el, "a")), k = num(el, "kin"), s = self(el, "s").value, ey = num(el, "e");
      var res = INV.s6bLsDca(k, s, cash.v === "tb"), wins = res.filter(function (x) { return x.adv > 0; }).length;
      var advs = res.map(function (x) { return x.adv; }).sort(function (a, b) { return a - b; }), med = advs.length % 2 ? advs[(advs.length - 1) / 2] : (advs[advs.length / 2 - 1] + advs[advs.length / 2]) / 2;
      var worst = res.reduce(function (a, b) { return b.adv < a.adv ? b : a; }), best = res.reduce(function (a, b) { return b.adv > a.adv ? b : a; });
      self(el, "k").innerHTML = kpi("Start years tested", res.length) + kpi("Lump sum ended ahead", pct(wins / res.length * 100, 0), "good") + kpi("Median lump-sum edge", pct(med, 1)) +
        kpi("Worst for lump sum", pct(worst.adv, 1) + " (" + worst.y + ")", "bad") + kpi("Best for lump sum", "+" + pct(best.adv, 1) + " (" + best.y + ")", "good");
      INV.barChart(self(el, "c"), { label: "Lump-sum advantage by start year", height: 240, maxLabels: 10, yFmt: function (v) { return Math.round(v) + "%"; }, tipFmt: function (v) { return (v >= 0 ? "lump sum ahead by " : "lump sum behind by ") + Math.abs(v).toFixed(1) + "%"; },
        data: res.map(function (x) { return { label: String(x.y), tip: "Start " + x.y + " (" + k + " installments, to end of " + (x.y + k - 1) + ")", y: x.adv, color: x.adv >= 0 ? "var(--s2)" : "var(--s5)" }; }) });
      var ex = res.find(function (x) { return x.y === ey; }) || res[res.length - 1];
      if (ex.y !== ey) { self(el, "e").value = ex.y; fmtOut(self(el, "e")); }
      self(el, "n").innerHTML = "Bars above zero: investing everything at once ended ahead once the last installment went in. Example: starting in " + ex.y + ", " + money(A) + " invested at once was worth <b>" + money(A * ex.ls) + "</b> at the end of " + (ex.y + k - 1) +
        "; spread over " + k + " years it was worth <b>" + money(A * ex.dca) + "</b>. " + (ex.adv >= 0 ? "The lump sum was ahead." : "Spreading it out was ahead &mdash; the kind of year that makes cost averaging feel wise.");
    }
    wire(el, run);
  };

  /* ---------- market-timing tester (INV-052) ---------- */
  function capeAt(y) { var C = window.INV_CAPE; if (!C) return null; for (var i = 0; i < C.rows.length; i++) if (C.rows[i][0] === y) return C.rows[i][1]; return null; }
  INV.s6bTiming = function (rule, param, safe, y0, y1) {
    var h = hist(), idx = [1], lvl = 1, inYrs = 0, sw = 0, prev = null, out = [], bh = [], outBands = [];
    for (var i = 0; i < h.rows.length; i++) { lvl *= 1 + h.stocks[i] / 100; idx.push(lvl); } /* idx[j] = level at end of year first+j-1; idx[0] = start of first year */
    for (var y = y0; y <= y1; y++) {
      var i2 = y - h.first, inMkt = true;
      if (rule === "cape") { var c = capeAt(y - 1); inMkt = c == null ? true : c <= param; }
      else if (rule === "ma") { var e = i2; if (e - param + 1 >= 0) { var avg = 0; for (var j = e - param + 1; j <= e; j++) avg += idx[j]; avg /= param; inMkt = idx[e] >= avg; } }
      else if (rule === "mom") { if (i2 - 1 >= 0) inMkt = h.stocks[i2 - 1] >= h.tbill[i2 - 1]; }
      var r = inMkt ? h.stocks[i2] : (safe === "tbond" ? h.tbond[i2] : h.tbill[i2]);
      if (inMkt) inYrs++; if (prev !== null && prev !== inMkt) sw++; prev = inMkt;
      if (!inMkt) { var last = outBands[outBands.length - 1]; if (last && last.x1 === y) last.x1 = y + 1; else outBands.push({ x0: y, x1: y + 1 }); }
      out.push({ y: y, r: r, cpi: h.cpi[i2] }); bh.push({ y: y, r: h.stocks[i2], cpi: h.cpi[i2] });
    }
    return { t: stats(out), b: stats(bh), inPct: inYrs / out.length * 100, switches: sw, bands: outBands };
  };
  TOOLS.s6bTiming = function (el) {
    var u = uid(el), h = hist();
    shell(el, "Test a market-timing rule on history", "Historical data",
      sel(u + "-r", "Rule", [["cape", "Valuation: leave stocks when CAPE is above a level"], ["ma", "Trend: leave stocks when below their moving average"], ["mom", "Momentum: leave stocks after a year that lagged T-bills"]], "cape") +
      rng(u + "-c", "CAPE level that triggers selling", 10, 40, 1, 25) +
      rng(u + "-m", "Moving average length (year-ends)", 2, 10, 1, 5, "yr") +
      sel(u + "-s", "While out of stocks, hold", [["tbill", "T-bills"], ["tbond", "10-year Treasuries"]], "tbill") +
      rng(u + "-y0", "First year", 1929, 2006, 1, 1929, "year") +
      hint("Decisions are made once a year using only information available at the previous year-end: December CAPE (Shiller), or the S&amp;P 500 total-return index versus the average of its last N year-ends. Before taxes and trading costs, which would hurt the timing rule more than buy-and-hold."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var rule = self(el, "r").value, p = rule === "cape" ? num(el, "c") : num(el, "m"), safe = self(el, "s").value, y0 = num(el, "y0"), y1 = h.last;
      self(el, "c").closest(".fld").hidden = rule !== "cape"; self(el, "m").closest(".fld").hidden = rule !== "ma";
      var o = INV.s6bTiming(rule, p, safe, y0, y1);
      self(el, "k").innerHTML = kpi("Rule: growth / yr", pct(o.t.cagr, 1), o.t.cagr >= o.b.cagr ? "good" : "bad") + kpi("Buy and hold / yr", pct(o.b.cagr, 1)) +
        kpi("Years in stocks", pct(o.inPct, 0)) + kpi("Switches", o.switches) + kpi("Rule: deepest fall", pct(o.t.mdd, 0), "bad") + kpi("Buy and hold: deepest fall", pct(o.b.mdd, 0), "bad");
      INV.lineChart(self(el, "ch"), { label: "Timing rule versus buy and hold", log: true, height: 260, yFmt: ms, xFmt: yearFmt, yTitle: "Growth of $10,000 (log scale)",
        bands: o.bands.map(function (b) { return { x0: b.x0, x1: b.x1, color: "var(--amber-soft)" }; }),
        series: [{ name: "Timing rule", color: "var(--s3)", data: o.t.path.map(function (q) { return [q[0], q[1] * 10000]; }), width: 2.6 }, { name: "Buy and hold stocks", color: "var(--s1)", data: o.b.path.map(function (q) { return [q[0], q[1] * 10000]; }), dash: "5 4", width: 1.8 }] });
      var gap = o.t.end / o.b.end;
      self(el, "n").innerHTML = "Shaded years: the rule was out of stocks. From " + y0 + " to " + y1 + ", $10,000 became <b>" + money(o.t.end * 10000) + "</b> with the rule and <b>" + money(o.b.end * 10000) + "</b> buying and holding &mdash; the rule ended with " + pct(gap * 100, 0) + " of buy-and-hold's wealth. " +
        (o.t.mdd > o.b.mdd ? "It did soften the worst decline. " : "") + "Try other settings, and notice how much the answer depends on the threshold and start year you pick: that sensitivity is the problem.";
    }
    wire(el, run);
  };

  /* ---------- ESG fee and tracking-difference compounding (INV-053) ---------- */
  TOOLS.s6bEsgGap = function (el) {
    var u = uid(el);
    shell(el, "Small differences, compounded: an ESG fund versus a broad index fund", "Calculator",
      numf(u + "-p", "Starting amount ($)", 50000, 1000) + numf(u + "-c", "Added each year ($)", 6000, 500) +
      rng(u + "-n", "Years", 1, 45, 1, 30, "yr") + rng(u + "-r", "Broad-market return before fees", 2, 12, 0.5, 7, "pct") +
      rng(u + "-fa", "Broad index fund expense ratio", 0, 1.5, 0.01, 0.03, "pct") + rng(u + "-fb", "ESG fund expense ratio", 0, 1.5, 0.01, 0.09, "pct") +
      rng(u + "-d", "ESG portfolio's return difference before fees", -2, 2, 0.1, 0, "spct") +
      hint("The return difference is unknowable in advance: exclusions and tilts can help or hurt by a percentage point or more in a given decade. Set it to zero to see the effect of the fee alone."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function grow(P, C, r, f, n) { var b = P, pts = [[0, P]]; for (var y = 1; y <= n; y++) { b = (b + C) * (1 + r) * (1 - f); pts.push([y, b]); } return { b: b, pts: pts }; }
    function run() {
      var P = Math.max(0, num(el, "p")), C = Math.max(0, num(el, "c")), n = num(el, "n"), r = num(el, "r") / 100, fa = num(el, "fa") / 100, fb = num(el, "fb") / 100, d = num(el, "d") / 100;
      var A = grow(P, C, r, fa, n), B = grow(P, C, r + d, fb, n), gap = B.b - A.b;
      self(el, "k").innerHTML = kpi("Broad index fund", money(A.b)) + kpi("ESG fund", money(B.b)) + kpi("ESG minus broad", (gap < 0 ? "−" : "+") + money(Math.abs(gap)), gap < 0 ? "bad" : "good") +
        kpi("As % of broad", pct(A.b > 0 ? gap / A.b * 100 : 0, 1), gap < 0 ? "bad" : "good");
      INV.lineChart(self(el, "ch"), { label: "Two funds over time", height: 240, xTitle: "Years", yFmt: ms, xFmt: yearFmt,
        series: [{ name: "Broad index fund " + pct(fa * 100, 2), color: "var(--s1)", data: A.pts }, { name: "ESG fund " + pct(fb * 100, 2), color: "var(--s2)", data: B.pts }] });
      self(el, "n2").innerHTML = "Each year: balance plus contribution, grown at the return, less the expense ratio: B<sub>t</sub> = (B<sub>t−1</sub> + C)(1 + r)(1 − f). A fee gap of " + pct((fb - fa) * 100, 2) +
        " is small; a return difference of even ±0.5% a year compounds into a much bigger number, in either direction. That uncertainty, not the fee, is the real cost of a values-based portfolio.";
    }
    wire(el, run);
  };

  /* ---------- US and international mix, 1991-2025 (INV-054) ---------- */
  INV.s6bGlobal = function (intlShare, emShare, y0, y1) {
    var I = intl(), h = hist(), mix = [], us = [], xu = [];
    for (var y = y0; y <= y1; y++) {
      var d = I[y], ir = (1 - emShare) * d.dev + emShare * d.em, c = h.cpi[y - h.first];
      mix.push({ y: y, r: (1 - intlShare) * d.us + intlShare * ir, cpi: c }); us.push({ y: y, r: d.us, cpi: c }); xu.push({ y: y, r: ir, cpi: c });
    }
    return { mix: stats(mix), us: stats(us), xu: stats(xu) };
  };
  TOOLS.s6bGlobal = function (el) {
    var u = uid(el);
    shell(el, "How much international? 35 years of evidence", "Historical data",
      rng(u + "-i", "International share of your stocks", 0, 100, 5, 40, "pct") + rng(u + "-e", "Emerging markets share of the international part", 0, 50, 5, 25, "pct") +
      rng(u + "-y0", "First year", 1991, 2016, 1, 1991, "year") +
      hint("Returns in US dollars from the Kenneth R. French Data Library: US total market, developed markets outside the US, and emerging markets, value-weighted, dividends included. Rebalanced every year-end; before fees and taxes. Ends in 2025."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><div class="fig-title" style="margin-top:10px">Ten-year average return: US minus international, by ending year</div><div id="' + u + '-d"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var s = num(el, "i") / 100, e = num(el, "e") / 100, y0 = num(el, "y0"), y1 = 2025, o = INV.s6bGlobal(s, e, y0, y1);
      self(el, "k").innerHTML = kpi("Your mix / yr", pct(o.mix.cagr, 1)) + kpi("US only / yr", pct(o.us.cagr, 1)) + kpi("International only / yr", pct(o.xu.cagr, 1)) +
        kpi("Your mix: typical swing", pct(o.mix.sd, 1)) + kpi("US: typical swing", pct(o.us.sd, 1)) + kpi("Your mix: deepest fall", pct(o.mix.mdd, 0), "bad");
      var sc = function (p) { return p.map(function (q) { return [q[0], q[1] * 10000]; }); };
      INV.lineChart(self(el, "c"), { label: "Growth of $10,000", log: true, height: 240, yFmt: ms, xFmt: yearFmt, yTitle: "Growth of $10,000 (log scale)",
        series: [{ name: Math.round(s * 100) + "% international mix", color: "var(--s1)", data: sc(o.mix.path), width: 3 }, { name: "US only", color: "var(--s5)", data: sc(o.us.path), dash: "5 4", width: 1.6 }, { name: "International only", color: "var(--s2)", data: sc(o.xu.path), dash: "5 4", width: 1.6 }] });
      var I = intl(), bars = [];
      for (var y = 1991 + 9; y <= 2025; y++) { var gu = 1, gi = 1; for (var j = y - 9; j <= y; j++) { gu *= 1 + I[j].us / 100; gi *= 1 + ((1 - e) * I[j].dev + e * I[j].em) / 100; } var dd = (Math.pow(gu, 0.1) - Math.pow(gi, 0.1)) * 100; bars.push({ label: String(y), tip: (y - 9) + "–" + y, y: dd, color: dd >= 0 ? "var(--s5)" : "var(--s2)" }); }
      INV.barChart(self(el, "d"), { label: "US minus international, rolling 10 years", height: 200, maxLabels: 9, yFmt: function (v) { return Math.round(v) + "%"; }, tipFmt: function (v) { return (v >= 0 ? "US ahead by " : "international ahead by ") + Math.abs(v).toFixed(1) + " points a year"; }, data: bars });
      var lead = bars.filter(function (b) { return b.y < 0; }).map(function (b) { return Number(b.label); });
      var ahead = o.mix.end >= o.us.end;
      self(el, "n").innerHTML = "Red bars: the US led over the ten years ending that year; teal: international led. From " + y0 + " to 2025, $10,000 in your mix became <b>" + money(o.mix.end * 10000) + "</b>, versus " + money(o.us.end * 10000) + " in US stocks alone" +
        (ahead ? ", so the mix came out ahead over this window. " : ", so US stocks alone came out ahead over this window. ") +
        (lead.length ? "The teal bars (ten-year periods ending " + lead[0] + "&ndash;" + lead[lead.length - 1] + ") show that the opposite has also happened for long stretches." : "In no ten-year period ending 2000&ndash;2025 did this international mix lead the US.");
    }
    wire(el, run);
  };

  /* ---------- currency and hedging (INV-054) ---------- */
  TOOLS.s6bCurrency = function (el) {
    var u = uid(el);
    shell(el, "Where a foreign return comes from: the market and the currency", "Calculator",
      rng(u + "-l", "Foreign market's return in its own currency", -40, 60, 1, 10, "spct") + rng(u + "-f", "Change in that currency against the dollar", -40, 40, 1, -10, "spct") +
      rng(u + "-h", "Share hedged back to dollars", 0, 100, 25, 0, "pct") + rng(u + "-d", "US short-term rate minus the foreign rate", -3, 6, 0.25, 1, "spct") + numf(u + "-a", "Amount invested ($)", 10000, 1000),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var L = num(el, "l") / 100, F = num(el, "f") / 100, hgd = num(el, "h") / 100, d = num(el, "d") / 100, A = Math.max(0, num(el, "a"));
      var unh = (1 + L) * (1 + F) - 1, hed = (1 + L) * (1 + d) - 1, blend = (1 + L) * (1 + (1 - hgd) * F + hgd * d) - 1;
      self(el, "k").innerHTML = kpi("Your return in dollars", pct(blend * 100, 1), blend >= 0 ? "good" : "bad") + kpi("Fully unhedged", pct(unh * 100, 1)) + kpi("Fully hedged", pct(hed * 100, 1)) + kpi("Ending value", money(A * (1 + blend)));
      INV.barChart(self(el, "c"), { label: "Return pieces", height: 220, allLabels: true, valueLabels: true, yFmt: function (v) { return (Math.round(v * 10) / 10) + "%"; }, tipFmt: function (v) { return pct(v, 1); },
        data: [{ label: "Local market", y: L * 100, color: "var(--s1)" }, { label: "Currency", y: (unh - L) * 100, color: F >= 0 ? "var(--s2)" : "var(--s5)" }, { label: "Unhedged", y: unh * 100, color: "var(--s6)" }, { label: "Hedged", y: hed * 100, color: "var(--s4)" }, { label: "Your mix", y: blend * 100, color: "var(--s3)" }] });
      self(el, "n").innerHTML = "Unhedged: (1 + local) &times; (1 + currency) &minus; 1 = " + (1 + L).toFixed(2) + " &times; " + (1 + F).toFixed(2) + " &minus; 1 = <b>" + pct(unh * 100, 1) + "</b>. " +
        "A hedge swaps the currency's move for the difference in short-term interest rates between the two countries (covered interest parity), so hedged &asymp; (1 + local) &times; (1 + rate gap) &minus; 1. Real hedges also carry small costs this ignores.";
    }
    wire(el, run);
  };
})();
