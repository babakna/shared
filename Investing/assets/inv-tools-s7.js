/* Investing Learning Lab - Stage 7 tools (Portfolio Construction & Monitoring) - V1.0 (September 2026)
   Namiranian, Babak. Every tool computes from its stated formula in the browser.
   Historical tools use window.INV_RETURNS (Damodaran, NYU Stern, 1928-2025): S&P 500 total return,
   10-year Treasury bond and 3-month T-bill, calendar years. Load after assets/inv-tools.js. */
(function () {
  "use strict";
  var INV = window.INV; if (!INV) return;
  var esc = INV.esc, money = INV.money, ms = INV.moneyShort, pct = INV.pct;
  var TOOLS = INV.tools = INV.tools || {};

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
  function sel(id, label, opts, val) {
    return '<div class="fld"><label for="' + id + '">' + esc(label) + '</label><select id="' + id + '">' + opts.map(function (o) {
      return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(val) ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select></div>";
  }
  function seg(name, label, opts) {
    return '<div class="fld"><label>' + esc(label) + '</label><div class="seg" role="group" data-seg="' + name + '">' + opts.map(function (o, i) {
      return '<button type="button" data-v="' + esc(o[0]) + '" aria-pressed="' + (i === 0 ? "true" : "false") + '">' + esc(o[1]) + "</button>"; }).join("") + "</div></div>";
  }
  function hint(t) { return '<p class="hint" style="font-size:.76rem;color:var(--muted)">' + t + "</p>"; }
  function self(el, id) { return el.querySelector("#" + el.dataset.uid + "-" + id); }
  function uid(el) { if (!el.dataset.uid) el.dataset.uid = "s7" + Math.random().toString(36).slice(2, 8); return el.dataset.uid; }
  function fmtOut(input) {
    var o = input.parentNode.querySelector("output"); if (!o) return;
    var f = input.getAttribute("data-fmt"), v = Number(input.value);
    o.textContent = f === "pct" ? v.toFixed(input.step.indexOf(".") > -1 ? (input.step.split(".")[1].length) : 0) + "%" :
      f === "spct" ? (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v) + "%" :
      f === "yr" ? v + (v === 1 ? " year" : " years") : f === "money" ? money(v) : f === "age" ? "age " + v : f === "pts" ? v + " pts" :
      f === "stk" ? v + "% stocks / " + (100 - v) + "% bonds" : String(v);
  }
  function wire(el, fn) {
    el.querySelectorAll("input,select").forEach(function (i) {
      i.addEventListener("input", function () { if (i.type === "range") fmtOut(i); fn(); });
      if (i.tagName === "SELECT") i.addEventListener("change", fn);
      if (i.type === "range") fmtOut(i);
    });
    el.querySelectorAll(".seg").forEach(function (g) {
      g.querySelectorAll("button").forEach(function (b) {
        b.addEventListener("click", function () { g.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); fn(); });
      });
    });
    fn();
    document.addEventListener("inv-theme", fn);
  }
  function segVal(el, name) { var b = el.querySelector('[data-seg="' + name + '"] button[aria-pressed="true"]'); return b ? b.getAttribute("data-v") : ""; }
  function kpi(k, v, cls) { return '<div class="kpi"><div class="k">' + esc(k) + '</div><div class="v ' + (cls || "") + '">' + v + "</div></div>"; }
  function num(el, id) { var v = Number(self(el, id).value); return isFinite(v) && v > 0 ? v : 0; }
  function yearFmt(v) { return String(Math.round(v)); }
  function signPct(v, dp) { return (v > 0 ? "+" : "") + pct(v, dp); }

  var H = null;
  function hist() { if (!H) H = INV.hist(); return H; }
  function rowsFor(y0, y1) { return hist().rows.filter(function (r) { return r[0] >= y0 && r[0] <= y1; }); }
  function mean(a) { return a.length ? a.reduce(function (s, v) { return s + v; }, 0) / a.length : 0; }
  function sdev(a) { if (a.length < 2) return 0; var m = mean(a); return Math.sqrt(a.reduce(function (s, v) { return s + (v - m) * (v - m); }, 0) / (a.length - 1)); }
  /* growth of a stock/bond mix rebalanced every year: returns {cagr, worst} */
  function mixSummary(s, y0, y1) {
    var R = rowsFor(y0, y1), g = 1, worst = Infinity;
    R.forEach(function (r) { var x = s * r[1] + (1 - s) * r[3]; g *= 1 + x / 100; if (x < worst) worst = x; });
    return { cagr: (Math.pow(g, 1 / R.length) - 1) * 100, worst: worst };
  }

  /* ======================================================================
     1. Portfolio builder (INV-055)
     ====================================================================== */
  var PRESETS = {
    maya: { p: 5580, r: 0, t: 0, s: 90, i: 30, note: "Maya's first-year 401(k) money: her 6% contribution ($3,720) plus the 50% match ($1,860). Her $3,000 of savings stays in cash as the start of an emergency fund." },
    rivera: { p: 62000, r: 15000, t: 0, s: 80, i: 30, note: "The Riveras' two 401(k)s ($62,000) plus two 2026 Roth IRA contributions of $7,500 each, funded from idle checking." },
    jordan: { p: 84000, r: 0, t: 56000, s: 70, i: 30, note: "Jordan's 401(k) and the taxable account now holding $56,000 of employer stock. Ava's $20,000 college fund is a separate, short-term goal and is not included." },
    harper: { p: 820000, r: 60000, t: 220000, s: 60, i: 30, note: "The Harpers' $1.1 million: pre-tax 401(k)s, Roth IRAs, and the taxable account of technology stocks that will be diversified over several years." },
    ruth: { p: 780000, r: 0, t: 0, s: 45, i: 30, note: "Ruth's traditional IRA. Her $60,000 of CDs and savings is a separate cash reserve and is not included." }
  };
  TOOLS.s7Builder = function (el) {
    var u = uid(el);
    shell(el, "Portfolio builder: from an allocation to funds in accounts", "Builder",
      sel(u + "-hh", "Start from a household", [["rivera", "The Riveras"], ["maya", "Maya"], ["jordan", "Jordan"], ["harper", "The Harpers"], ["ruth", "Ruth"], ["custom", "My own numbers"]], "rivera") +
      numf(u + "-p", "Pre-tax accounts: 401(k), 403(b), traditional IRA ($)", 62000, 1000) +
      numf(u + "-r", "Roth accounts: Roth IRA, Roth 401(k) ($)", 15000, 500) +
      numf(u + "-t", "Taxable brokerage account ($)", 0, 1000) +
      rng(u + "-s", "Target mix", 0, 100, 5, 80, "stk") +
      rng(u + "-i", "International share of the stocks", 0, 60, 5, 30, "pct") +
      rng(u + "-e", "Average fund expense ratio", 0, 1.5, 0.01, 0.05, "pct") +
      seg("place", "Placement", [["aware", "Tax-aware"], ["same", "Same mix in every account"]]) +
      hint("Three broad index funds: US total stock market, international stock, US bond market. Tax-aware placement fills pre-tax accounts with bonds first, puts international stock in the taxable account (foreign tax credit), and uses the rest for US stock. History uses the S&amp;P 500 and 10-year Treasuries as stand-ins, 1928–2025, rebalanced yearly."),
      '<div class="kpis" id="' + u + '-k"></div><div class="tbl-wrap" style="margin:0 0 10px"><table class="tbl" id="' + u + '-tb"></table></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    var hh = self(el, "hh");
    function applyPreset() {
      var p = PRESETS[hh.value]; if (!p) return;
      self(el, "p").value = p.p; self(el, "r").value = p.r; self(el, "t").value = p.t;
      self(el, "s").value = p.s; self(el, "i").value = p.i; fmtOut(self(el, "s")); fmtOut(self(el, "i"));
    }
    hh.addEventListener("input", applyPreset); hh.addEventListener("change", applyPreset);
    ["p", "r", "t", "s", "i"].forEach(function (k) { self(el, k).addEventListener("input", function () { if (hh.value !== "custom" && PRESETS[hh.value] && Number(self(el, k).value) !== PRESETS[hh.value][k]) hh.value = "custom"; }); });
    function run() {
      var P = num(el, "p"), R = num(el, "r"), X = num(el, "t"), s = Number(self(el, "s").value) / 100, ii = Number(self(el, "i").value) / 100, er = Number(self(el, "e").value) / 100;
      var T = P + R + X, bond = T * (1 - s), intl = T * s * ii, us = T * s * (1 - ii);
      var acct = { P: { us: 0, intl: 0, bond: 0, cap: P }, R: { us: 0, intl: 0, bond: 0, cap: R }, X: { us: 0, intl: 0, bond: 0, cap: X } };
      function put(a, k, amt) { var take = Math.min(amt, acct[a].cap); acct[a][k] += take; acct[a].cap -= take; return amt - take; }
      if (segVal(el, "place") === "same") {
        ["P", "R", "X"].forEach(function (a) { var v = acct[a].cap; acct[a].us = v * s * (1 - ii); acct[a].intl = v * s * ii; acct[a].bond = v * (1 - s); acct[a].cap = 0; });
      } else {
        var left = put("P", "bond", bond); left = put("X", "bond", left); put("R", "bond", left);
        left = put("X", "intl", intl); left = put("P", "intl", left); put("R", "intl", left);
        left = put("P", "us", us); left = put("R", "us", left); put("X", "us", left);
      }
      var names = { P: "Pre-tax", R: "Roth", X: "Taxable" };
      var rowsH = '<thead><tr><th>Account</th><th class="r">US stock index</th><th class="r">International index</th><th class="r">Bond index</th><th class="r">Total</th></tr></thead><tbody>';
      ["P", "R", "X"].forEach(function (a) {
        var t = acct[a].us + acct[a].intl + acct[a].bond; if (!t) return;
        rowsH += "<tr><td>" + names[a] + '</td><td class="r">' + money(acct[a].us, 0) + '</td><td class="r">' + money(acct[a].intl, 0) + '</td><td class="r">' + money(acct[a].bond, 0) + '</td><td class="r"><b>' + money(t, 0) + "</b></td></tr>";
      });
      rowsH += '<tr><td><b>All accounts</b></td><td class="r"><b>' + money(us, 0) + '</b></td><td class="r"><b>' + money(intl, 0) + '</b></td><td class="r"><b>' + money(bond, 0) + '</b></td><td class="r"><b>' + money(T, 0) + "</b></td></tr></tbody>";
      self(el, "tb").innerHTML = rowsH;
      var h = hist(), m = mixSummary(s, h.first, h.last);
      self(el, "k").innerHTML = kpi("Stocks", money(us + intl, 0)) + kpi("Bonds", money(bond, 0)) + kpi("Fund costs / yr", money(T * er, 0)) +
        kpi("Mix: growth / yr, 1928–" + h.last, pct(m.cagr, 1)) + kpi("Mix: worst year", pct(m.worst, 1), "bad");
      var data = [], cols = { us: "var(--s1)", intl: "var(--s4)", bond: "var(--s2)" }, lab = { us: "US", intl: "Intl", bond: "Bonds" };
      ["P", "R", "X"].forEach(function (a) { ["us", "intl", "bond"].forEach(function (k) { if (acct[a][k] > 0.5) data.push({ label: names[a] + " " + lab[k], tip: names[a] + " · " + lab[k], y: acct[a][k], color: cols[k] }); }); });
      if (!data.length) data.push({ label: "Nothing entered", y: 0, color: "var(--s6)" });
      INV.barChart(self(el, "c"), { label: "Holdings by account", height: 230, allLabels: true, yFmt: ms, tipFmt: function (v) { return money(v, 0); }, data: data });
      var p = PRESETS[hh.value];
      self(el, "n").innerHTML = (p ? p.note + " " : "") + (T > 0 ? "Stocks are " + pct(s * 100, 0) + " of the total (" + pct(ii * 100, 0) + " of them international). At a " + pct(er * 100, 2) + " average expense ratio the funds cost about <b>" + money(T * er, 0) + "</b> a year. " : "Enter account balances to build a portfolio. ") +
        (segVal(el, "place") === "same" ? "Holding the same mix everywhere is simpler to rebalance but usually less tax-efficient." : "Rebalance across all accounts as one portfolio; the mix inside any single account will look lopsided, and that is intended.");
    }
    wire(el, run);
  };

  /* ======================================================================
     2. Rebalancing backtest with bands (INV-056)
     ====================================================================== */
  function rebSim(y0, y1, tgt, pol) {
    var R = rowsFor(y0, y1), S = tgt, B = 1 - tgt, path = [[y0, 10000]], wts = [], rets = [], n = 0, peak = 1, mdd = 0, since = 0, turn = 0;
    R.forEach(function (r) {
      var v0 = S + B; S *= 1 + r[1] / 100; B *= 1 + r[3] / 100; var v = S + B; rets.push((v / v0 - 1) * 100);
      var ws = v > 0 ? S / v : 0, doR = false, dest = tgt; since++;
      if (pol.type === "cal" && since >= pol.every) doR = true;
      if (pol.type === "band") { var lo = tgt - pol.band / 100, hi = tgt + pol.band / 100; if (ws > hi + 1e-9 || ws < lo - 1e-9) { doR = true; if (pol.toEdge) dest = ws > hi ? hi : lo; } }
      wts.push([r[0], ws * 100]);
      if (doR && Math.abs(ws - dest) > 1e-9) { turn += Math.abs(ws - dest) * v; S = v * dest; B = v * (1 - dest); n++; }
      if (doR) since = 0;
      path.push([r[0] + 1, 10000 * v]); if (v > peak) peak = v; mdd = Math.min(mdd, v / peak - 1);
    });
    var g = path[path.length - 1][1] / 10000, ww = wts.map(function (x) { return x[1]; });
    return { cagr: (Math.pow(g, 1 / rets.length) - 1) * 100, end: 10000 * g, sd: sdev(rets), worst: Math.min.apply(null, rets), mdd: mdd * 100, n: n, maxW: Math.max.apply(null, ww), minW: Math.min.apply(null, ww), path: path, wts: wts, turn: turn };
  }
  INV.s7RebSim = rebSim;
  TOOLS.s7Rebal = function (el) {
    var u = uid(el), h = hist();
    shell(el, "Rebalanced versus drifting: 98 years of history", "Historical data",
      rng(u + "-s", "Target mix", 0, 100, 5, 60, "stk") +
      sel(u + "-p", "Period", [["1928", "1928–" + h.last + " (all data)"], ["1950", "1950–" + h.last], ["1976", "1976–" + h.last], ["2000", "2000–" + h.last], ["2010", "2010–" + h.last]], "1928") +
      sel(u + "-m", "Rebalancing rule", [["band", "Threshold band, checked each year-end"], ["cal1", "Calendar: every year"], ["cal2", "Calendar: every 2 years"], ["cal3", "Calendar: every 3 years"], ["cal5", "Calendar: every 5 years"], ["never", "Never rebalance (drift)"]], "band") +
      '<div data-band>' + rng(u + "-b", "Band: rebalance when stocks drift more than", 1, 25, 1, 5, "pts") +
      seg("dest", "When the band is breached, trade back", [["target", "to the target"], ["edge", "to the band edge"]]) + "</div>" +
      hint("Stocks are the S&amp;P 500 with dividends; bonds are 10-year Treasuries. Calendar-year returns, so drift is checked only at each year-end; real portfolios checked monthly would trade more often. Before taxes, fees and trading costs."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><div class="fig-title" style="margin-top:10px">Stock share at each year-end, before any trade</div><div id="' + u + '-w"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var s = Number(self(el, "s").value) / 100, y0 = Number(self(el, "p").value), m = self(el, "m").value, b = Number(self(el, "b").value);
      el.querySelector("[data-band]").hidden = m !== "band";
      var pol = m === "band" ? { type: "band", band: b, toEdge: segVal(el, "dest") === "edge" } : m === "never" ? { type: "never" } : { type: "cal", every: Number(m.slice(3)) };
      var A = rebSim(y0, h.last, s, pol), N = rebSim(y0, h.last, s, { type: "never" });
      var drift = A.maxW - s * 100;
      self(el, "k").innerHTML = kpi("Growth rate / yr", pct(A.cagr, 2)) + kpi("Volatility", pct(A.sd, 1)) + kpi("Worst year", pct(A.worst, 1), "bad") +
        kpi("Deepest fall (year-end)", pct(A.mdd, 0), "bad") + kpi("Rebalancing trades", String(A.n)) + kpi("Highest stock share", pct(A.maxW, 0), drift > 10 ? "bad" : "");
      var ser = [{ name: m === "never" ? "Never rebalanced" : "Your rule", color: "var(--s1)", data: A.path, width: 3 }];
      if (m !== "never") ser.push({ name: "Never rebalanced", color: "var(--s5)", data: N.path, dash: "5 4", width: 1.8 });
      INV.lineChart(self(el, "c"), { label: "Growth of $10,000", log: true, height: 240, yTitle: "Growth of $10,000 (log scale)", xFmt: yearFmt, yFmt: ms, series: ser });
      var tl = A.wts.map(function (p) { return [p[0], s * 100]; });
      var ws = [{ name: "Stock share, your rule", color: "var(--s1)", data: A.wts }, { name: "Target", color: "var(--s6)", data: tl, dash: "4 4", width: 1.4 }];
      if (m !== "never") ws.push({ name: "Stock share if never rebalanced", color: "var(--s5)", data: N.wts, dash: "5 4", width: 1.6 });
      if (m === "band") { ws.push({ name: "Upper band", color: "var(--s3)", data: A.wts.map(function (p) { return [p[0], Math.min(100, s * 100 + b)]; }), dash: "2 3", width: 1.2 });
        ws.push({ name: "Lower band", color: "var(--s3)", data: A.wts.map(function (p) { return [p[0], Math.max(0, s * 100 - b)]; }), dash: "2 3", width: 1.2 }); }
      INV.lineChart(self(el, "w"), { label: "Stock weight", height: 220, yMin: 0, yMax: 100, xFmt: yearFmt, yFmt: function (v) { return Math.round(v) + "%"; }, tipFmt: function (v) { return v.toFixed(1) + "%"; }, series: ws, legend: true });
      self(el, "n").innerHTML = (m === "never" ? "Left alone, a " + Math.round(s * 100) + "% stock portfolio started in " + y0 + " reached <b>" + pct(A.maxW, 0) + "</b> stocks at its highest. " :
        "Your rule traded " + A.n + " times in " + (h.last - y0 + 1) + " years and kept stocks between " + pct(A.minW, 0) + " and " + pct(A.maxW, 0) + " at year-ends. Left alone, the same portfolio drifted as high as <b>" + pct(N.maxW, 0) + "</b> stocks, with volatility of " + pct(N.sd, 1) + " versus " + pct(A.sd, 1) + " and a worst year of " + pct(N.worst, 1) + ". ") +
        "Rebalancing is mainly risk control: a drifting portfolio often earns more simply because it has become a riskier one.";
    }
    wire(el, run);
  };

  /* ======================================================================
     3. Cash-flow and tax-aware rebalancing (INV-056)
     ====================================================================== */
  TOOLS.s7Cashflow = function (el) {
    var u = uid(el);
    shell(el, "Rebalance with new money first, sell last", "Calculator",
      numf(u + "-st", "Stock funds now ($)", 70000, 1000) + numf(u + "-bd", "Bond funds now ($)", 30000, 1000) +
      rng(u + "-s", "Target mix", 0, 100, 5, 60, "stk") +
      numf(u + "-n", "New money to invest this year ($)", 10000, 500) +
      seg("acct", "If a sale is still needed, it happens in", [["tax", "a taxable account"], ["ira", "an IRA or 401(k)"]]) +
      rng(u + "-g", "Unrealized gain as a share of the stock value", 0, 90, 5, 40, "pct") +
      rng(u + "-tx", "Tax rate on long-term gains", 0, 30, 1, 15, "pct") +
      hint("Assumes the stock shares sold were held more than a year. Selling bonds is assumed to create no gain. In an IRA or 401(k) trades are not taxed."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-o"></p>');
    function run() {
      var S = num(el, "st"), B = num(el, "bd"), s = Number(self(el, "s").value) / 100, N = num(el, "n"), g = Number(self(el, "g").value) / 100, tx = Number(self(el, "tx").value) / 100, taxable = segVal(el, "acct") === "tax";
      var T = S + B + N, tS = T * s, need = tS - S; /* positive: buy stocks */
      var toS = Math.max(0, Math.min(N, need)), toB = N - toS, S1 = S + toS, B1 = B + toB;
      var sellStocks = Math.max(0, S1 - tS), sellBonds = Math.max(0, B1 - T * (1 - s));
      var tax = taxable ? sellStocks * g * tx : 0;
      var now = S + B > 0 ? S / (S + B) * 100 : 0, after = T > 0 ? S1 / T * 100 : 0;
      self(el, "k").innerHTML = kpi("Stock share now", pct(now, 1)) + kpi("After directing new money", pct(after, 1)) + kpi("New money to stocks", money(toS, 0)) +
        kpi("Still to sell", money(sellStocks + sellBonds, 0), sellStocks + sellBonds > 0 ? "bad" : "good") + kpi("Tax on that sale", money(tax, 0), tax > 0 ? "bad" : "good");
      INV.barChart(self(el, "c"), { label: "Stock share", height: 210, allLabels: true, valueLabels: true, yFmt: function (v) { return Math.round(v) + "%"; }, tipFmt: function (v) { return v.toFixed(1) + "% stocks"; },
        data: [{ label: "Now", y: now, color: "var(--s6)" }, { label: "After new money", y: after, color: "var(--s3)" }, { label: "Target", y: s * 100, color: "var(--s2)" }] });
      var msg = T <= 0 ? "Enter balances to see the trades." :
        (sellStocks + sellBonds < 0.5 ? "New money alone brings the portfolio back to target: send " + money(toS, 0) + " to stocks and " + money(toB, 0) + " to bonds. No sale, no tax." :
        "Directing all " + money(N, 0) + " of new money to the underweight asset moves the stock share from " + pct(now, 1) + " to " + pct(after, 1) + ". Reaching the target exactly would still mean selling " + money(sellStocks + sellBonds, 0) + " of " + (sellStocks > 0 ? "stocks" : "bonds") + ". " +
        (sellStocks > 0 ? (taxable ? "In a taxable account that sale realizes about " + money(sellStocks * g, 0) + " of gain and roughly <b>" + money(tax, 0) + "</b> of tax. Making the same trade inside an IRA or 401(k) costs nothing in tax." : "Inside an IRA or 401(k) the sale has no tax cost.") : "Bond sales usually carry little gain."));
      self(el, "o").innerHTML = msg;
    }
    wire(el, run);
  };

  /* ======================================================================
     4. Time-weighted versus money-weighted return (INV-057)
     ====================================================================== */
  TOOLS.s7Twr = function (el) {
    var u = uid(el), R0 = [20, -10, 15, 5], D0 = [0, 50000, 0, 0];
    var ins = numf(u + "-v0", "Starting balance ($)", 10000, 500);
    for (var k = 1; k <= 4; k++) {
      if (k > 1) ins += numf(u + "-d" + k, "Deposit at the start of year " + k + " ($)", D0[k - 1], 500);
      ins += rng(u + "-r" + k, "Return in year " + k, -50, 60, 1, R0[k - 1], "spct");
    }
    shell(el, "Two ways to measure the same four years", "Calculator", ins +
      hint("Time-weighted: link each year's return, ignoring deposits. Money-weighted: the single yearly rate (internal rate of return) that turns your actual deposits into the actual ending balance."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><div class="fig-title" style="margin-top:10px">Dollars at work during each year, and that year\'s return</div><div id="' + u + '-b"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var V = num(el, "v0"), v0 = V, dep = [0], rr = [], path = [[0, V]], cum = [[0, V]], c = V, work = [], link = 1;
      for (var k = 1; k <= 4; k++) {
        var d = k > 1 ? num(el, "d" + k) : 0, r = Number(self(el, "r" + k).value) / 100;
        dep.push(d); rr.push(r); V += d; c += d; work.push(V); V *= 1 + r; link *= 1 + r; path.push([k, V]); cum.push([k, c]);
      }
      var twr = (Math.pow(link, 1 / 4) - 1) * 100;
      function f(x) { var s = v0 * Math.pow(x, 4); for (var j = 2; j <= 4; j++) s += dep[j] * Math.pow(x, 5 - j); return s - V; }
      var mwr = null;
      if (c > 0 && V > 0) { var lo = 1e-6, hi = 20; for (var it = 0; it < 200; it++) { var mid = (lo + hi) / 2; if (f(mid) > 0) hi = mid; else lo = mid; } mwr = ((lo + hi) / 2 - 1) * 100; }
      self(el, "k").innerHTML = kpi("Ending balance", money(V, 0)) + kpi("Total put in", money(c, 0)) + kpi("Gain in dollars", money(V - c, 0), V >= c ? "good" : "bad") +
        kpi("Time-weighted / yr", signPct(twr, 2)) + kpi("Money-weighted / yr", mwr == null ? "no money in" : signPct(mwr, 2), mwr != null && mwr < 0 ? "bad" : "");
      INV.lineChart(self(el, "c"), { label: "Balance and contributions", height: 220, xTitle: "End of year", xTicks: [0, 1, 2, 3, 4], xFmt: yearFmt, yFmt: ms,
        series: [{ name: "Balance", color: "var(--s1)", data: path, area: true }, { name: "Money put in", color: "var(--s3)", data: cum, dash: "5 4" }] });
      INV.barChart(self(el, "b"), { label: "Dollars at work", height: 190, allLabels: true, valueLabels: true, yFmt: ms, tipFmt: function (v) { return money(v, 0); },
        data: work.map(function (w, i) { return { label: "Year " + (i + 1) + " (" + signPct(rr[i] * 100, 0) + ")", y: w, color: rr[i] < 0 ? "var(--s5)" : "var(--s2)" }; }) });
      self(el, "n").innerHTML = mwr == null ? "Enter a starting balance or deposits." :
        "The investments themselves earned <b>" + signPct(twr, 2) + "</b> a year: that is the fund's or manager's record. Your own dollars earned <b>" + signPct(mwr, 2) + "</b> a year, because " +
        (Math.abs(mwr - twr) < 0.05 ? "the timing of your deposits made almost no difference." : mwr < twr ? "more of your money was invested during the weaker years." : "more of your money was invested during the stronger years.") +
        " Both numbers are correct; they answer different questions.";
    }
    wire(el, run);
  };

  /* ======================================================================
     5. Risk-adjusted performance and tracking error (INV-057)
     ====================================================================== */
  TOOLS.s7Riskadj = function (el) {
    var u = uid(el), h = hist();
    shell(el, "Sharpe, Sortino and tracking error from history", "Historical data",
      rng(u + "-p", "Your portfolio", 0, 100, 5, 80, "stk") + rng(u + "-b", "Blended benchmark", 0, 100, 5, 60, "stk") +
      sel(u + "-y", "Period", [["1928", "1928–" + h.last], ["1950", "1950–" + h.last], ["1976", "1976–" + h.last], ["2000", "2000–" + h.last], ["2010", "2010–" + h.last]], "1976") +
      hint("Stocks: S&amp;P 500 with dividends. Bonds: 10-year Treasuries. Risk-free rate: 3-month T-bills. Both mixes rebalanced yearly. Sharpe = average excess return ÷ its standard deviation. Sortino = average excess return ÷ downside deviation (only years below T-bills count). Tracking error = standard deviation of the yearly gaps versus the benchmark."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function stats(s, R) {
      var ex = R.map(function (r) { return s * r[1] + (1 - s) * r[3] - r[2]; }), m = mean(ex), sd = sdev(ex);
      var dd = Math.sqrt(ex.reduce(function (a, v) { return a + Math.min(0, v) * Math.min(0, v); }, 0) / ex.length);
      var g = 1; R.forEach(function (r) { g *= 1 + (s * r[1] + (1 - s) * r[3]) / 100; });
      return { m: m, sd: sd, dd: dd, sharpe: sd > 0 ? m / sd : null, sortino: dd > 0 ? m / dd : null, cagr: (Math.pow(g, 1 / R.length) - 1) * 100, vol: sdev(R.map(function (r) { return s * r[1] + (1 - s) * r[3]; })) };
    }
    function f2(v) { return v == null ? "n/a" : v.toFixed(2); }
    function run() {
      var sp = Number(self(el, "p").value) / 100, sb = Number(self(el, "b").value) / 100, R = rowsFor(Number(self(el, "y").value), h.last);
      var P = stats(sp, R), B = stats(sb, R);
      var gap = R.map(function (r) { return (sp - sb) * (r[1] - r[3]); }), te = sdev(gap), exc = P.cagr - B.cagr;
      self(el, "k").innerHTML = kpi("Growth / yr: yours vs benchmark", pct(P.cagr, 1) + " vs " + pct(B.cagr, 1)) + kpi("Volatility: yours vs benchmark", pct(P.vol, 1) + " vs " + pct(B.vol, 1)) +
        kpi("Sharpe: yours vs benchmark", f2(P.sharpe) + " vs " + f2(B.sharpe)) + kpi("Sortino: yours vs benchmark", f2(P.sortino) + " vs " + f2(B.sortino)) +
        kpi("Tracking error", pct(te, 1)) + kpi("Growth gap / yr", signPct(exc, 2), exc >= 0 ? "good" : "bad");
      INV.barChart(self(el, "c"), { label: "Yearly gap versus benchmark", height: 220, maxLabels: 10, yFmt: function (v) { return Math.round(v) + "%"; }, tipFmt: function (v) { return signPct(v, 1) + " versus the benchmark"; },
        data: R.map(function (r, i) { return { label: String(r[0]), y: gap[i] }; }) });
      self(el, "n").innerHTML = "Each bar is one year's return of your mix minus the benchmark's. Their standard deviation, <b>" + pct(te, 1) + "</b>, is the tracking error: how far your results typically stray from the yardstick in a year. " +
        (sp === sb ? "Identical mixes have no tracking error." : "A higher Sharpe or Sortino ratio means more return per unit of risk taken; a bigger return alone does not.");
    }
    wire(el, run);
  };

  /* ======================================================================
     6. Glide-path check (INV-058)
     ====================================================================== */
  TOOLS.s7Glide = function (el) {
    var u = uid(el);
    shell(el, "Your glide path: where the plan says you should be now", "Planner",
      rng(u + "-a", "Your age now", 20, 85, 1, 57, "age") + rng(u + "-ra", "Planned retirement age", 50, 75, 1, 62, "age") +
      rng(u + "-s0", "Stock share 20+ years before retirement", 0, 100, 5, 90, "pct") +
      rng(u + "-s1", "Stock share at retirement", 0, 100, 5, 50, "pct") +
      rng(u + "-s2", "Stock share 10+ years into retirement", 0, 100, 5, 40, "pct") +
      rng(u + "-cur", "Your actual stock share today", 0, 100, 1, 66, "pct") +
      numf(u + "-v", "Portfolio value ($)", 1100000, 10000) +
      hint("A straight-line glide path between the three points you choose, level before and after. The shape is yours to set in your investment policy statement (INV-028); target-date funds publish theirs."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function plan(age, ra, s0, s1, s2) {
      if (age <= ra - 20) return s0;
      if (age <= ra) return s0 + (s1 - s0) * (age - (ra - 20)) / 20;
      if (age <= ra + 10) return s1 + (s2 - s1) * (age - ra) / 10;
      return s2;
    }
    function run() {
      var a = Number(self(el, "a").value), ra = Number(self(el, "ra").value), s0 = Number(self(el, "s0").value), s1 = Number(self(el, "s1").value), s2 = Number(self(el, "s2").value),
        cur = Number(self(el, "cur").value), V = num(el, "v");
      var p = plan(a, ra, s0, s1, s2), step = plan(a + 1, ra, s0, s1, s2) - p, gap = cur - p;
      self(el, "k").innerHTML = kpi("Plan says, at " + a, pct(p, 1) + " stocks") + kpi("You have", pct(cur, 0) + " stocks") + kpi("Gap", (gap > 0 ? "+" : gap < 0 ? "−" : "") + Math.abs(gap).toFixed(1) + " pts", Math.abs(gap) > 5 ? "bad" : "good") +
        kpi("To move", money(Math.abs(gap) / 100 * V, 0)) + kpi("Planned change next year", (step > 0 ? "+" : step < 0 ? "−" : "") + Math.abs(step).toFixed(1) + " pts");
      var pts = []; for (var g = 20; g <= 95; g++) pts.push([g, plan(g, ra, s0, s1, s2)]);
      INV.lineChart(self(el, "c"), { label: "Glide path", height: 240, yMin: 0, yMax: 100, xTitle: "Age", yTitle: "Stock share (%)", xFmt: yearFmt, yFmt: function (v) { return Math.round(v) + "%"; }, tipFmt: function (v) { return v.toFixed(1) + "% stocks"; },
        series: [{ name: "Your planned glide path", color: "var(--s1)", data: pts, area: true }], marks: [{ x: ra, label: "Retire at " + ra }],
        dots: [{ x: a, y: cur, label: "You: " + Math.round(cur) + "%", anchor: "end", dx: -8, color: Math.abs(gap) > 5 ? "var(--s5)" : "var(--s2)" }] });
      self(el, "n").innerHTML = Math.abs(gap) <= 5 ? "You are within 5 percentage points of your own plan. Nothing to do at this review except confirm the plan still fits your life." :
        "You are " + Math.abs(gap).toFixed(1) + " points " + (gap > 0 ? "above" : "below") + " your planned stock share, about <b>" + money(Math.abs(gap) / 100 * V, 0) + "</b> of " + money(V, 0) + ". That is a rebalancing decision, not a new strategy: move back toward the plan, starting with tax-free trades inside retirement accounts (INV-056).";
    }
    wire(el, run);
  };

  /* ======================================================================
     7. Direct versus 60-day rollover (INV-059)
     ====================================================================== */
  TOOLS.s7Rollover = function (el) {
    var u = uid(el);
    shell(el, "Direct rollover or a check made out to you?", "Calculator",
      numf(u + "-b", "Old 401(k) balance paid out ($)", 60000, 1000) +
      rng(u + "-a", "Your age in the year of the payout", 25, 75, 1, 45, "age") +
      rng(u + "-t", "Your marginal income tax rate (federal + state)", 10, 45, 1, 27, "pct") +
      seg("how", "How the money moves", [["ind", "Check to you (60-day)"], ["dir", "Direct rollover"]]) +
      '<div data-ind>' + rng(u + "-m", "Share of the 20% withheld you replace from savings", 0, 100, 5, 0, "pct") +
      seg("late", "Deposited within 60 days?", [["yes", "Yes"], ["no", "No, missed it"]]) + "</div>" +
      hint("A plan must withhold 20% of an eligible rollover distribution paid to you (IRS). Any amount not rolled over is taxable, and under age 59½ usually also owes a 10% additional tax. This sketch ignores exceptions, such as leaving an employer in or after the year you turn 55, and state-specific rules."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function cost(B, a, t, how, m, late) {
      if (how === "dir") return { wh: 0, rolled: B, taxed: 0, cost: 0 };
      var wh = 0.2 * B, rolled = late ? 0 : 0.8 * B + m * wh, taxed = B - rolled, extra = a < 60 ? 0.1 * taxed : 0;
      return { wh: wh, rolled: rolled, taxed: taxed, cost: taxed * t + extra, extra: extra };
    }
    function run() {
      var B = num(el, "b"), a = Number(self(el, "a").value), t = Number(self(el, "t").value) / 100, how = segVal(el, "how"), m = Number(self(el, "m").value) / 100, late = segVal(el, "late") === "no";
      el.querySelector("[data-ind]").hidden = how === "dir";
      var c = cost(B, a, t, how, m, late);
      self(el, "k").innerHTML = kpi("Withheld at payout", money(c.wh, 0), c.wh > 0 ? "bad" : "good") + kpi("Reaches the new account", money(c.rolled, 0)) +
        kpi("Becomes taxable income", money(c.taxed, 0), c.taxed > 0 ? "bad" : "good") + kpi("Tax and additional tax", money(c.cost, 0), c.cost > 0 ? "bad" : "good");
      var sc = [["Direct rollover", cost(B, a, t, "dir", 0, false), "var(--s2)"], ["60-day, replace all", cost(B, a, t, "ind", 1, false), "var(--s1)"], ["60-day, replace none", cost(B, a, t, "ind", 0, false), "var(--s3)"], ["Missed 60 days", cost(B, a, t, "ind", 0, true), "var(--s5)"]];
      INV.barChart(self(el, "c"), { label: "Tax cost by route", height: 210, allLabels: true, valueLabels: true, yFmt: ms, tipFmt: function (v) { return money(v, 0) + " of tax"; },
        data: sc.map(function (x) { return { label: x[0], y: x[1].cost, color: x[2] }; }) });
      self(el, "n").innerHTML = how === "dir" ? "The plan pays the new IRA or plan directly. Nothing is withheld and nothing is taxed; the whole " + money(B, 0) + " keeps growing tax-deferred." :
        (late ? "Missing the 60-day window turns the whole " + money(B, 0) + " into taxable income" + (a < 60 ? ", plus a 10% additional tax because you are under 59½" : "") + ". The " + money(c.wh, 0) + " withheld counts toward the bill; it is not an extra cost." :
        "You receive " + money(0.8 * B, 0) + "; " + money(c.wh, 0) + " goes to the IRS as withholding. To roll over the full " + money(B, 0) + " you must add the withheld amount from other savings within 60 days. " +
        (c.taxed > 0.5 ? "Here " + money(c.taxed, 0) + " is not rolled over, so it is taxed" + (a < 60 ? " and hit with the 10% additional tax" : "") + ": about <b>" + money(c.cost, 0) + "</b>." : "Because you replaced it all, the rollover is tax-free and the withholding comes back as a credit when you file."));
    }
    wire(el, run);
  };

  /* ======================================================================
     8. What consolidation saves (INV-059)
     ====================================================================== */
  TOOLS.s7Consol = function (el) {
    var u = uid(el);
    shell(el, "What scattered accounts cost you", "Calculator",
      numf(u + "-v", "Total across all accounts ($)", 150000, 5000) +
      rng(u + "-n0", "Accounts today", 1, 12, 1, 5) + rng(u + "-n1", "Accounts after consolidating", 1, 12, 1, 2) +
      numf(u + "-f", "Flat fee per account per year ($)", 40, 5, "Account, custodial or plan recordkeeping fees") +
      rng(u + "-e0", "Average expense ratio today", 0, 1.5, 0.01, 0.55, "pct") + rng(u + "-e1", "Expense ratio after consolidating", 0, 1.5, 0.01, 0.08, "pct") +
      rng(u + "-r", "Return before costs", 0, 10, 0.5, 6, "pct") + rng(u + "-y", "Years", 1, 40, 1, 20, "yr"),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-o"></p>');
    function grow(V, r, e, fee, n, yrs) { var b = V, pts = [[0, V]]; for (var y = 1; y <= yrs; y++) { b = Math.max(0, b * (1 + r) * (1 - e) - fee * n); pts.push([y, b]); } return pts; }
    function run() {
      var V = num(el, "v"), n0 = Number(self(el, "n0").value), n1 = Number(self(el, "n1").value), f = num(el, "f"), e0 = Number(self(el, "e0").value) / 100, e1 = Number(self(el, "e1").value) / 100, r = Number(self(el, "r").value) / 100, yrs = Number(self(el, "y").value);
      var A = grow(V, r, e0, f, n0, yrs), B = grow(V, r, e1, f, n1, yrs), a = A[A.length - 1][1], b = B[B.length - 1][1];
      var c0 = V * e0 + f * n0, c1 = V * e1 + f * n1;
      self(el, "k").innerHTML = kpi("Cost this year, today", money(c0, 0), "bad") + kpi("Cost after consolidating", money(c1, 0), "good") + kpi("Saved this year", money(c0 - c1, 0), c0 >= c1 ? "good" : "bad") +
        kpi("Difference after " + yrs + (yrs === 1 ? " year" : " years"), money(b - a, 0), b >= a ? "good" : "bad");
      INV.lineChart(self(el, "c"), { label: "Balance with and without consolidating", height: 230, xTitle: "Years", xFmt: yearFmt, yFmt: ms,
        series: [{ name: "Consolidated, " + n1 + " accounts at " + pct(e1 * 100, 2), color: "var(--s2)", data: B }, { name: "As is, " + n0 + " accounts at " + pct(e0 * 100, 2), color: "var(--s5)", data: A }] });
      self(el, "o").innerHTML = V <= 0 ? "Enter a balance." : "Each year: grow by the return, take the expense ratio, then subtract flat fees. The larger saving usually comes from moving into low-cost funds while consolidating, not from the account fees themselves. " +
        "Fewer accounts also mean fewer beneficiary forms to keep current and one clear picture of your allocation.";
    }
    wire(el, run);
  };
})();
