/* Investing Learning Lab - Stage 4 (Planning & You) calculators - V1.1 (September 2026)
   Tools for INV-024 to INV-028. Every tool computes from its stated formula in the browser.
   Historical tools use window.INV_RETURNS (Damodaran, NYU Stern, 1928-2025). */
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
    return '<div class="fld"><label for="' + id + '">' + esc(label) + '</label><select id="' + id + '">' + opts.map(function (o, i) {
      var v = Array.isArray(o) ? o[0] : String(i), t = Array.isArray(o) ? o[1] : o;
      return '<option value="' + esc(v) + '"' + (String(v) === String(val) ? " selected" : "") + ">" + esc(t) + "</option>";
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
      f === "stk" ? v + "% stocks / " + (100 - v) + "% bonds" : f === "mo" ? v + (v === 1 ? " month" : " months") :
      f === "pts" ? (v === 0 ? "every year" : "±" + v + " points") : String(v);
  }
  function wire(el, fn) {
    el.querySelectorAll("input,select,textarea").forEach(function (i) {
      i.addEventListener("input", function () { if (i.type === "range") fmtOut(i); fn(); });
      if (i.tagName === "SELECT") i.addEventListener("change", fn);
      if (i.type === "range") fmtOut(i);
    });
    fn();
    document.addEventListener("inv-theme", fn);
  }
  function kpi(k, v, cls) { return '<div class="kpi"><div class="k">' + esc(k) + '</div><div class="v ' + (cls || "") + '">' + v + "</div></div>"; }
  function num(el, id) { var v = Number(self(el, id).value); return isFinite(v) && v > 0 ? v : 0; }
  function segWire(el, onPick) {
    el.querySelectorAll(".seg button").forEach(function (b) {
      b.addEventListener("click", function () {
        el.querySelectorAll(".seg button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        onPick(b.dataset.v);
      });
    });
  }
  function yearFmt(v) { return String(Math.round(v)); }
  var Hh = null;
  function hist() { if (!Hh) Hh = INV.hist(); return Hh; }
  /* one mix of S&P 500 and 10-year Treasuries, rebalanced yearly: returns worst year, year of worst, 2008, 2022 */
  function mixFacts(s) {
    var h = hist(), worst = Infinity, wy = h.first;
    for (var i = 0; i < h.rows.length; i++) { var r = s * h.stocks[i] + (1 - s) * h.tbond[i]; if (r < worst) { worst = r; wy = h.year[i]; } }
    var at = function (y) { var k = y - h.first; return s * h.stocks[k] + (1 - s) * h.tbond[k]; };
    var st = INV.mixStats ? INV.mixStats(s, h.first, h.last) : { mdd: worst };
    return { worst: worst, wy: wy, y2008: at(2008), y2022: at(2022), mdd: st.mdd };
  }
  /* real (after-inflation) growth rate of each mix over the whole data set */
  function realCagr(s) {
    var h = hist(), g = 1;
    for (var i = 0; i < h.rows.length; i++) { var r = s * h.stocks[i] + (1 - s) * h.tbond[i]; g *= (1 + r / 100) / (1 + h.cpi[i] / 100); }
    return (Math.pow(g, 1 / h.rows.length) - 1) * 100;
  }
  function round10(x) { return Math.max(0, Math.min(100, Math.round(x / 10) * 10)); }

  /* ---------- 1. Goal saver (INV-024) ---------- */
  TOOLS.s4GoalSaver = function (el) {
    var u = uid(el);
    shell(el, "What must I save each month for this goal?", "Calculator",
      numf(u + "-c", "Goal cost in today's dollars ($)", 40000, 500) + numf(u + "-s", "Already saved for it ($)", 5000, 500) +
      rng(u + "-n", "Years until you need it", 1, 40, 1, 10, "yr") + rng(u + "-r", "Expected return per year", 0, 10, 0.5, 5, "pct") +
      rng(u + "-i", "Inflation for this goal", 0, 6, 0.5, 2.5, "pct") +
      '<div class="fld"><label>Deposits</label><div class="seg" role="group"><button type="button" data-v="level" aria-pressed="true">Same every month</button><button type="button" data-v="rise" aria-pressed="false">Rise with inflation</button></div></div>' +
      note("Deposits at the end of each month, compounding at the monthly equivalent of the annual return, (1 + r)<sup>1/12</sup> &minus; 1. Before taxes and fees."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-nt"></p>');
    var mode = "level";
    segWire(el, function (v) { mode = v; run(); });
    function run() {
      var C = num(el, "c"), S = num(el, "s"), n = Number(self(el, "n").value), r = Number(self(el, "r").value) / 100, inf = Number(self(el, "i").value) / 100;
      var F = C * Math.pow(1 + inf, n), Sg = S * Math.pow(1 + r, n), G = Math.max(0, F - Sg), rm = Math.pow(1 + r, 1 / 12) - 1;
      var a12 = rm > 0 ? (Math.pow(1 + rm, 12) - 1) / rm : 12, P0 = 0;
      if (G > 0) {
        if (mode === "level") { var fac = rm > 0 ? (Math.pow(1 + rm, 12 * n) - 1) / rm : 12 * n; P0 = G / fac; }
        else { var sum = 0; for (var k = 0; k < n; k++) sum += Math.pow(1 + inf, k) * a12 * Math.pow(1 + r, n - k - 1); P0 = G / sum; }
      }
      var bal = S, contrib = 0, path = [[0, S]], cost = [[0, C]];
      for (var m = 1; m <= n * 12; m++) {
        var yrk = Math.floor((m - 1) / 12), dep = mode === "level" ? P0 : P0 * Math.pow(1 + inf, yrk);
        bal = bal * (1 + rm) + dep; contrib += dep;
        if (m % 12 === 0) { path.push([m / 12, bal]); cost.push([m / 12, C * Math.pow(1 + inf, m / 12)]); }
      }
      var growth = Math.max(0, bal - S - contrib), share = bal > 0 ? growth / bal * 100 : 0;
      var last = mode === "level" ? P0 : P0 * Math.pow(1 + inf, n - 1);
      self(el, "k").innerHTML = kpi("Cost in year " + n, money(F)) + kpi(mode === "level" ? "Save each month" : "Save each month, year 1", money(P0), G > 0 ? "" : "good") +
        kpi("You put in", money(contrib)) + kpi("Growth covers", pct(share, 0), "good");
      INV.lineChart(self(el, "ch"), { label: "Savings versus goal cost", height: 250, xTitle: "Years from now", xFmt: yearFmt, yFmt: ms,
        series: [{ name: "Your savings for this goal", color: "var(--s1)", data: path, area: true }, { name: "Goal cost, rising with inflation", color: "var(--s3)", data: cost, dash: "5 4" }] });
      self(el, "nt").innerHTML = G <= 0 ? "What you have already saved, growing at " + pct(r * 100, 1) + ", reaches the goal's future cost of " + money(F) + " with nothing more added. Consider a lower-risk investment for money that is already enough."
        : "Future cost = " + money(C) + " &times; (1 + " + pct(inf * 100, 1) + ")<sup>" + n + "</sup> = <b>" + money(F) + "</b>. Your " + money(S) + " grows to " + money(Sg) + ", leaving " + money(G) + " to come from deposits. " +
          (mode === "level" ? "Level deposits of <b>" + money(P0) + "</b> a month close the gap." : "Deposits start at <b>" + money(P0) + "</b> a month and rise " + pct(inf * 100, 1) + " each year, ending at " + money(last) + " &mdash; roughly the same effort in today's dollars every year.");
    }
    wire(el, run);
  };

  /* ---------- 2. Competing goals (INV-024) ---------- */
  TOOLS.s4GoalStack = function (el) {
    var u = uid(el);
    var G = [["Goal 1 (highest priority)", 12000, 1], ["Goal 2", 25000, 5], ["Goal 3", 48000, 11], ["Goal 4 (lowest priority)", 48000, 14]];
    var inp = G.map(function (g, i) { return numf(u + "-a" + i, g[0] + ": still needed, today's $", g[1], 500) + rng(u + "-y" + i, g[0].split(" (")[0] + ": years away", 1, 30, 1, g[2], "yr"); }).join("");
    shell(el, "Four goals, one budget", "Calculator",
      numf(u + "-b", "Monthly budget for all goals ($)", 1500, 50) + inp +
      rng(u + "-rs", "Return on goals under 5 years away", 0, 8, 0.5, 3, "pct") + rng(u + "-rl", "Return on goals 5+ years away", 0, 10, 0.5, 6, "pct") +
      rng(u + "-i", "Inflation", 0, 6, 0.5, 2.5, "pct") +
      note("Each goal's cost grows with inflation to its date; level monthly deposits at the stated return. The budget funds goals strictly in priority order."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-nt"></p>');
    function run() {
      var B = num(el, "b"), rs = Number(self(el, "rs").value) / 100, rl = Number(self(el, "rl").value) / 100, inf = Number(self(el, "i").value) / 100;
      var left = B, tot = 0, full = 0, rows = [], data = [];
      for (var i = 0; i < 4; i++) {
        var A = num(el, "a" + i), n = Number(self(el, "y" + i).value), r = n < 5 ? rs : rl, rm = Math.pow(1 + r, 1 / 12) - 1;
        var F = A * Math.pow(1 + inf, n), fac = rm > 0 ? (Math.pow(1 + rm, 12 * n) - 1) / rm : 12 * n, need = F / fac;
        var got = Math.min(need, left); left -= got; tot += need;
        var status = need <= 0 ? 2 : got >= need - 0.005 ? 2 : got > 0 ? 1 : 0; if (status === 2) full++;
        rows.push("Goal " + (i + 1) + ": needs " + money(need) + "/month, funded " + money(got));
        data.push({ label: "Goal " + (i + 1), tip: "Goal " + (i + 1) + ": " + money(got) + " of " + money(need) + " funded", y: need, color: ["var(--s5)", "var(--s3)", "var(--s2)"][status] });
      }
      var gap = B - tot;
      self(el, "k").innerHTML = kpi("Needed per month", money(tot)) + kpi("Your budget", money(B)) + kpi(gap >= 0 ? "Left over" : "Shortfall", money(Math.abs(gap)), gap >= 0 ? "good" : "bad") + kpi("Goals fully funded", full + " of 4", full === 4 ? "good" : "");
      INV.barChart(self(el, "ch"), { label: "Monthly saving each goal needs", height: 220, allLabels: true, valueLabels: true, yFmt: function (v) { return "$" + Math.round(v).toLocaleString("en-US"); }, data: data });
      self(el, "nt").innerHTML = "Green: fully funded. Amber: partly funded. Red: nothing left for it. " + rows.join("; ") + ". " +
        (gap < 0 ? "To close the " + money(-gap) + " monthly gap: push a date back, shrink a goal, raise the budget, or accept that the lowest-priority goal waits." : "Everything fits. Direct the extra " + money(gap) + " to retirement, the goal most people underfund.");
    }
    wire(el, run);
  };

  /* ---------- 3. Risk profile: willingness, ability, need (INV-025) ---------- */
  var WQ = [
    ["If your investments fell 25% in a few months, you would most likely:", ["Sell everything to stop the losses", "Sell some to feel safer", "Hold and wait", "Buy more at the lower prices"], 2],
    ["Which one-year range would you pick for $10,000? (illustrative)", ["Worst −$300, best +$900", "Worst −$1,500, best +$2,200", "Worst −$2,800, best +$3,500", "Worst −$4,400, best +$5,000"], 1],
    ["Your experience holding investments through a real bear market:", ["None", "Invested, but did not watch closely", "Held through one without selling", "Held and kept buying through more than one"], 1],
    ["When you hear the word “risk” in money, you think first of:", ["Loss", "Uncertainty", "Opportunity", "Excitement"], 1],
    ["In a falling market you would check your balance:", ["Several times a day, anxiously", "Daily", "Now and then", "Rarely; it does not change my plan"], 2]
  ];
  var AQ = [
    ["Years until you start spending this money:", ["Fewer than 3", "3 to 7", "8 to 15", "More than 15"], 3],
    ["The income you live on is:", ["Uncertain or irregular", "Variable (commissions, contract work)", "A stable salary", "Very secure, or guaranteed income covers essentials"], 2],
    ["Your emergency fund covers:", ["Less than 1 month", "1 to 3 months", "3 to 6 months", "More than 6 months"], 1],
    ["If this portfolio fell 40%, your plans would:", ["Break: essentials at risk", "Force a major goal to be delayed", "Need small adjustments", "Not change"], 2],
    ["Share of this money you will withdraw in the next 5 years:", ["More than half", "20% to 50%", "5% to 20%", "Less than 5%"], 3]
  ];
  TOOLS.s4RiskQuiz = function (el) {
    var u = uid(el);
    var q = function (Q, p) { return Q.map(function (x, i) { return sel(u + "-" + p + i, (i + 1) + ". " + x[0], x[1], x[2]); }).join(""); };
    shell(el, "Willingness, ability and need: a three-part risk profile", "Self-assessment",
      '<p class="kicker" style="margin:0">Part A &middot; Willingness</p>' + q(WQ, "w") +
      '<p class="kicker" style="margin:6px 0 0">Part B &middot; Ability</p>' + q(AQ, "a") +
      '<p class="kicker" style="margin:6px 0 0">Part C &middot; Need</p>' +
      numf(u + "-p", "Invested today ($)", 200000, 5000) + numf(u + "-c", "Added each year ($)", 12000, 500) +
      rng(u + "-n", "Years until the goal", 1, 50, 1, 20, "yr") + numf(u + "-g", "Amount needed, in today's dollars ($)", 900000, 10000) +
      note("Parts A and B score 5 to 20 each and map to a stock share from 10% to 100%. Part C finds the after-inflation return that reaches the goal, then the lowest stock share (10-point steps, 10-year Treasuries for the rest) whose 1928&ndash;2025 real growth rate met it. Educational, not a recommendation."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-nt"></p>');
    var reals = null;
    function score(p, n) { var s = 0; for (var i = 0; i < n; i++) s += Number(self(el, p + i).value) + 1; return s; }
    function reqReal(P, C, n, Gl) {
      var fv = function (r) { return r === 0 ? P + C * n : P * Math.pow(1 + r, n) + C * (Math.pow(1 + r, n) - 1) / r; };
      if (Gl <= 0 || fv(0) >= Gl) return { r: 0, low: true };
      if (fv(0.3) < Gl) return { r: 30, high: true };
      var lo = 0, hi = 0.3; for (var k = 0; k < 80; k++) { var mid = (lo + hi) / 2; if (fv(mid) >= Gl) hi = mid; else lo = mid; }
      return { r: hi * 100 };
    }
    function run() {
      if (!reals) { reals = []; for (var s = 0; s <= 100; s += 10) reals.push([s, realCagr(s / 100)]); }
      var W = score("w", 5), A = score("a", 5);
      var wS = round10(10 + (W - 5) / 15 * 90), aS = round10(10 + (A - 5) / 15 * 90);
      var P = num(el, "p"), C = num(el, "c"), n = Number(self(el, "n").value), Gl = num(el, "g");
      var rq = reqReal(P, C, n, Gl), nS = null;
      for (var k = 0; k < reals.length; k++) { if (reals[k][1] >= rq.r) { nS = reals[k][0]; break; } }
      var needHigh = nS === null; if (needHigh) nS = 100; if (rq.low) nS = 0;
      var cap = Math.min(wS, aS), pick = Math.min(cap, Math.max(nS, 10));
      var mf = mixFacts(pick / 100);
      self(el, "k").innerHTML = kpi("Willingness " + W + "/20", wS + "% stocks") + kpi("Ability " + A + "/20", aS + "% stocks", aS < wS ? "bad" : "") +
        kpi("Need: real return", rq.low ? "0% or less" : rq.high ? "over 30%" : pct(rq.r, 1)) + kpi("Starting point", pick + "% stocks", "good");
      INV.barChart(self(el, "ch"), { label: "Stock share implied by each part", height: 220, allLabels: true, valueLabels: true, yFmt: function (v) { return Math.round(v) + "%"; },
        data: [{ label: "Willingness", y: wS, color: "var(--s1)" }, { label: "Ability", y: aS, color: "var(--s3)" }, { label: "Need", y: nS, color: "var(--s4)" }, { label: "Starting point", y: pick, color: "var(--s2)" }] });
      var msg = "The starting point is the <b>lower</b> of willingness and ability (" + cap + "% stocks)";
      if (needHigh) msg += ". Your need is higher than any mix has delivered after inflation since 1928, so the plan itself must change: save more, allow more time, or lower the goal. Taking more risk cannot fix it";
      else if (nS < cap) msg += ", reduced to " + pick + "% because your need is met with less risk. Taking more risk than you need adds downside without being required";
      else if (nS > cap) msg += ". Your need calls for " + nS + "% stocks, more than you can or want to hold. Close the gap with saving, time or a smaller goal, not with extra risk";
      else msg += ", which also meets your need";
      msg += ". At " + pick + "% stocks, the worst calendar year since 1928 (" + mf.wy + ") returned " + pct(mf.worst, 1) + ": about <b>" + money(P * mf.worst / 100) + "</b> on " + money(P) + ".";
      self(el, "nt").innerHTML = msg;
    }
    wire(el, run);
  };

  /* ---------- 4. Losses in dollars at each allocation (INV-025) ---------- */
  TOOLS.s4LossDollars = function (el) {
    var u = uid(el);
    shell(el, "What would the bad years have cost you, in dollars?", "Historical data",
      numf(u + "-v", "Portfolio value ($)", 500000, 5000) + rng(u + "-s", "Mix", 0, 100, 10, 60, "stk") +
      note("S&amp;P 500 with dividends and 10-year Treasuries, rebalanced yearly, calendar years 1928&ndash;2025 (Damodaran, NYU Stern). Declines inside a year were deeper than year-end figures show. No withdrawals or additions."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-nt"></p>');
    function run() {
      var V = num(el, "v"), s = Number(self(el, "s").value) / 100, f = mixFacts(s);
      var d = function (p) { return money(V * p / 100); };
      self(el, "k").innerHTML = kpi("Worst year (" + f.wy + ")", d(f.worst), "bad") + kpi("2008", d(f.y2008), f.y2008 < 0 ? "bad" : "good") +
        kpi("2022", d(f.y2022), f.y2022 < 0 ? "bad" : "good") + kpi("Deepest fall, year-ends", d(f.mdd), "bad");
      var data = []; for (var k = 0; k <= 100; k += 10) { var m = mixFacts(k / 100); data.push({ label: k + "%", tip: k + "% stocks: worst year " + m.wy, y: V * m.worst / 100, color: k === Math.round(s * 100) ? "var(--s1)" : "var(--s6)" }); }
      INV.barChart(self(el, "ch"), { label: "Worst calendar-year loss in dollars by stock share", height: 230, allLabels: true, xTitle: "Share in stocks", yFmt: ms, tipFmt: function (v) { return money(v); }, data: data });
      self(el, "nt").innerHTML = "At " + Math.round(s * 100) + "% stocks, " + money(V) + " would have lost <b>" + d(f.worst).replace("−", "") + "</b> in its worst calendar year and fallen " + pct(-f.mdd, 0) +
        " from peak to trough measured at year-ends. Ask whether you would keep investing, and keep your job-loss and spending plans intact, if that happened next year. The bars show the worst single year for every mix.";
    }
    wire(el, run);
  };

  /* ---------- 5. Net worth versus the Survey of Consumer Finances (INV-026) ---------- */
  var SCF = { ages: ["Under 35", "35–44", "45–54", "55–64", "65–74", "75+"], lo: [0, 35, 45, 55, 65, 75],
    med: [39000, 135600, 247200, 364500, 409900, 335600], mean: [183500, 549600, 975800, 1566900, 1794600, 1624100] };
  INV.scf2022 = SCF;
  TOOLS.s4NetWorth = function (el) {
    var u = uid(el);
    shell(el, "How does your net worth compare?", "Federal Reserve data",
      rng(u + "-a", "Your age (or the older partner's)", 18, 95, 1, 35, "age") + numf(u + "-as", "Everything you own ($): accounts, home, car", 250000, 1000) +
      numf(u + "-d", "Everything you owe ($): mortgage, loans, cards", 60000, 1000) +
      '<div class="fld"><label>Show survey figures in</label><div class="seg" role="group"><button type="button" data-v="pub" aria-pressed="true">2022 dollars (as published)</button><button type="button" data-v="adj" aria-pressed="false">2025 prices</button></div></div>' +
      note("Median and mean family net worth by age of the survey's reference person, 2022 Survey of Consumer Finances (Federal Reserve Board, 2023), the most recent published survey. The 2025 price option scales by CPI-U for 2023&ndash;2025 from the course dataset."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-nt"></p>');
    var mode = "pub";
    segWire(el, function (v) { mode = v; run(); });
    var h = hist(), f = 1; [2023, 2024, 2025].forEach(function (y) { f *= 1 + h.cpi[y - h.first] / 100; });
    function run() {
      var age = Number(self(el, "a").value), nw = num(el, "as") - num(el, "d"), k = 0;
      for (var i = 0; i < SCF.lo.length; i++) if (age >= SCF.lo[i]) k = i;
      var m = mode === "adj" ? f : 1, med = SCF.med[k] * m, mean = SCF.mean[k] * m;
      var ratio = med > 0 ? nw / med : 0;
      self(el, "k").innerHTML = kpi("Your net worth", money(nw), nw < 0 ? "bad" : "") + kpi("Median, " + SCF.ages[k], money(med)) + kpi("Mean, " + SCF.ages[k], money(mean)) +
        kpi("You vs median", nw <= 0 ? "below zero" : ratio.toFixed(2) + "×", ratio >= 1 ? "good" : "");
      var data = SCF.ages.map(function (a, i) { return { label: a, tip: "Median, age " + a, y: SCF.med[i] * m, color: i === k ? "var(--s1)" : "var(--s6)" }; });
      data.push({ label: "You", tip: "Your net worth", y: nw, color: nw >= med ? "var(--s2)" : "var(--s3)" });
      INV.barChart(self(el, "ch"), { label: "Median net worth by age", height: 230, allLabels: true, yFmt: ms, tipFmt: function (v) { return money(v); }, data: data });
      self(el, "nt").innerHTML = "Half of families headed by someone aged " + SCF.ages[k].replace("Under 35", "under 35") + " had more than <b>" + money(med) + "</b> and half had less. The mean, " + money(mean) +
        ", is pulled up by the wealthiest families, so it describes almost no one. " + (mode === "adj" ? "Scaled by " + ((f - 1) * 100).toFixed(1) + "% for 2023&ndash;2025 inflation; the survey's own 2025 results were not yet published. " : "") +
        "A benchmark is context, not a goal: your own plan is the test that matters.";
    }
    wire(el, run);
  };

  /* ---------- 6. Splitting shared costs (INV-027) ---------- */
  TOOLS.s4SplitBills = function (el) {
    var u = uid(el);
    shell(el, "Three ways to split shared costs", "Calculator",
      numf(u + "-a", "Partner A take-home pay per month ($)", 5300, 100) + numf(u + "-b", "Partner B take-home pay per month ($)", 3800, 100) +
      numf(u + "-s", "Shared costs per month ($)", 6000, 100) +
      note("Take-home pay is after taxes and payroll deductions. Equal-leftover solves A &minus; x = B &minus; (S &minus; x), limited so no one pays less than zero or more than the whole bill."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-nt"></p>');
    function run() {
      var A = num(el, "a"), B = num(el, "b"), S = num(el, "s"), T = A + B;
      var pa = T > 0 ? A / T : 0.5, xp = S * pa, xe = Math.max(0, Math.min(S, (A - B + S) / 2)), xh = S / 2;
      self(el, "k").innerHTML = kpi("Shared costs, share of pay", T > 0 ? pct(S / T * 100, 0) : "0%", T > 0 && S / T > 0.8 ? "bad" : "") +
        kpi("Proportional: A pays", money(xp)) + kpi("Proportional: B pays", money(S - xp)) + kpi("Equal leftover, each keeps", money(A - xe));
      var data = [["50/50", xh], ["Proportional", xp], ["Equal leftover", xe]], out = [];
      data.forEach(function (d) {
        out.push({ label: "A · " + d[0], tip: "Partner A keeps, " + d[0], y: A - d[1], color: "var(--s1)" });
        out.push({ label: "B · " + d[0], tip: "Partner B keeps, " + d[0], y: B - (S - d[1]), color: "var(--s3)" });
      });
      INV.barChart(self(el, "ch"), { label: "What each partner keeps after shared costs", height: 230, allLabels: true, yFmt: ms, tipFmt: function (v) { return money(v); }, data: out });
      self(el, "nt").innerHTML = "Proportional splitting charges each partner the same <b>share</b> of pay (" + pct(pa * 100, 0) + " and " + pct((1 - pa) * 100, 0) + "). 50/50 leaves partner B with " + money(B - xh) +
        " against A's " + money(A - xh) + ". Equal-leftover gives both the same spending money, " + money(A - xe) + (xe === 0 || xe === S ? " (capped: one partner covers everything)" : "") + ". Fully pooling all pay produces the same household result as equal-leftover, without the arithmetic.";
    }
    wire(el, run);
  };

  /* ---------- 7. Investment policy statement builder (INV-028) ---------- */
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var REB = ["Once a year, on a set date, back to target", "Check each quarter; rebalance only an asset class outside its band", "Check once a year; rebalance only if outside the band"];
  var CRASH = ["Stay the course and follow the rebalancing rule", "Stay the course and send all new contributions to whatever fell most", "Stay the course and harvest tax losses in taxable accounts"];
  TOOLS.s4IPSBuilder = function (el) {
    var u = uid(el), KEY = "inv-s4-ips";
    shell(el, "Build your investment policy statement", "Worksheet tool",
      '<div class="fld"><label for="' + u + '-nm">Name(s)</label><input type="text" id="' + u + '-nm" placeholder="Your name or names" maxlength="80"></div>' +
      '<div class="fld"><label for="' + u + '-gl">Goals this portfolio serves</label><textarea id="' + u + '-gl" rows="3" style="font:500 .88rem var(--font);padding:7px 9px;border-radius:9px;border:1px solid var(--border2);background:var(--card);color:var(--text);width:100%" placeholder="For example: retire at 65 on $70,000 a year in today\'s dollars"></textarea></div>' +
      numf(u + "-v", "Portfolio value today ($)", 250000, 1000) + rng(u + "-h", "Time horizon", 1, 50, 1, 25, "yr") +
      rng(u + "-s", "Target mix", 0, 100, 5, 60, "stk") + rng(u + "-x", "International share of the stock part", 0, 60, 5, 30, "pct") +
      rng(u + "-cm", "Cash reserve kept outside the portfolio", 0, 24, 1, 6, "mo") + numf(u + "-c", "Monthly contribution ($)", 1000, 50) +
      sel(u + "-rb", "Rebalancing rule", REB, 2) + rng(u + "-bd", "Band around each target", 1, 15, 1, 5, "pts") +
      sel(u + "-cr", "What I will do in a crash", CRASH, 0) + sel(u + "-rv", "Annual review month", MONTHS, 0),
      '<div class="kpis" id="' + u + '-k"></div><pre id="' + u + '-pre" style="white-space:pre-wrap;font:500 .8rem/1.5 var(--mono);background:var(--card2);border:1px solid var(--border);border-radius:10px;padding:12px 14px;max-height:420px;overflow:auto;margin:0"></pre>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button type="button" class="btn small primary" id="' + u + '-dl">Download my IPS (.txt)</button><button type="button" class="btn small" id="' + u + '-cp">Copy text</button><button type="button" class="btn small ghost" id="' + u + '-rs">Reset</button><span class="src" id="' + u + '-st" style="align-self:center"></span></div>');
    var ids = ["nm", "gl", "v", "h", "s", "x", "cm", "c", "rb", "bd", "cr", "rv"];
    var saved = INV.store(KEY) || {};
    ids.forEach(function (k) { if (saved[k] != null) self(el, k).value = saved[k]; });
    var text = "";
    function run() {
      var data = {}; ids.forEach(function (k) { data[k] = self(el, k).value; }); INV.store(KEY, data);
      var nm = (data.nm || "").trim() || "(your name)", gl = (data.gl || "").trim() || "(write your goals: what, how much in today's dollars, and by when)";
      var V = num(el, "v"), hz = Number(data.h), s = Number(data.s), x = Number(data.x), cm = Number(data.cm), C = num(el, "c"), bd = Number(data.bd);
      var rb = Number(data.rb), cr = Number(data.cr), rv = MONTHS[Number(data.rv)] || "January";
      var us = s * (100 - x) / 100, intl = s * x / 100, bond = 100 - s, f = mixFacts(s / 100);
      var lo = function (t) { return Math.max(0, t - bd).toFixed(0); }, hi = function (t) { return Math.min(100, t + bd).toFixed(0); };
      var r1 = function (v) { return (Math.round(v * 10) / 10).toString(); };
      var date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      self(el, "k").innerHTML = kpi("Target mix", s + " / " + bond) + kpi("US / intl stocks", r1(us) + "% / " + r1(intl) + "%") +
        kpi("Worst year at this mix", money(V * f.worst / 100), "bad") + kpi("Rebalance band", "±" + bd + " pts");
      var L = [];
      L.push("INVESTMENT POLICY STATEMENT");
      L.push("For: " + nm);
      L.push("Date adopted: " + date);
      L.push("");
      L.push("1. PURPOSE");
      L.push("This statement sets the rules I will follow for this portfolio, written in advance so that decisions in good and bad markets are made by policy, not by mood. I will change it only at a scheduled review or after a major life event, never during a market decline.");
      L.push("");
      L.push("2. GOALS AND TIME HORIZON");
      L.push(gl);
      L.push("Time horizon: about " + hz + (hz === 1 ? " year" : " years") + " until significant withdrawals begin.");
      L.push("");
      L.push("3. RISK");
      L.push("At the target mix below, the worst calendar year from 1928 to 2025 (" + f.wy + ") returned " + pct(f.worst, 1) + ", about " + money(V * f.worst / 100) + " on today's balance of " + money(V) + ". The deepest decline measured at year-ends was " + pct(f.mdd, 0) + ". I accept that losses of this size can happen again, and possibly larger ones.");
      L.push("");
      L.push("4. TARGET ASSET ALLOCATION (with rebalancing bands)");
      L.push("  US stocks:            " + r1(us) + "%   (band " + lo(us) + "% to " + hi(us) + "%)");
      L.push("  International stocks: " + r1(intl) + "%   (band " + lo(intl) + "% to " + hi(intl) + "%)");
      L.push("  Bonds:                " + bond + "%   (band " + lo(bond) + "% to " + hi(bond) + "%)");
      L.push("Funds: broad, low-cost index funds for each asset class (list them here).");
      L.push("");
      L.push("5. CASH RESERVE");
      L.push(cm === 0 ? "No separate cash reserve is held for this portfolio." : "I keep " + cm + (cm === 1 ? " month" : " months") + " of essential spending in cash outside this portfolio, so I never have to sell investments to meet an emergency.");
      L.push("");
      L.push("6. CONTRIBUTIONS");
      L.push(C > 0 ? "I invest " + money(C) + " a month automatically. New money goes first to whichever asset class is furthest below its target." : "No regular contributions are planned.");
      L.push("");
      L.push("7. REBALANCING");
      L.push(REB[rb] + (rb === 0 ? "." : ": a band of plus or minus " + bd + " percentage points around each target."));
      L.push("I rebalance first with new contributions and withdrawals, then inside tax-advantaged accounts, and only then by selling in taxable accounts.");
      L.push("");
      L.push("8. WHAT I WILL DO IN A MARKET CRASH");
      L.push("  a. " + CRASH[cr] + ".");
      L.push("  b. I will not sell because of news, forecasts or fear. A decline is expected, not a reason to change this policy.");
      L.push("  c. I will wait at least 30 days, and reread this statement, before making any change not required by the rules above.");
      L.push("  d. If I need money, I draw on the cash reserve first.");
      L.push("");
      L.push("9. REVIEW");
      L.push("I review this statement every " + rv + ", and after marriage, divorce, a birth, a death, a job change, an inheritance, or a change in health. Performance alone is not a reason to change the target mix.");
      L.push("");
      L.push("Signed: ______________________________   Date: ______________");
      text = L.join("\n");
      self(el, "pre").textContent = text;
    }
    self(el, "gl").addEventListener("input", run);
    self(el, "nm").addEventListener("input", run);
    self(el, "dl").addEventListener("click", function () {
      var a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
      a.download = "investment-policy-statement.txt";
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
      self(el, "st").textContent = "Downloaded";
    });
    self(el, "cp").addEventListener("click", function () {
      var st = self(el, "st");
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { st.textContent = "Copied"; }, function () { st.textContent = "Select the text and copy it"; });
      else st.textContent = "Select the text and copy it";
    });
    self(el, "rs").addEventListener("click", function () {
      INV.store(KEY, {}); self(el, "nm").value = ""; self(el, "gl").value = "";
      var def = { v: 250000, h: 25, s: 60, x: 30, cm: 6, c: 1000, rb: 2, bd: 5, cr: 0, rv: 0 };
      Object.keys(def).forEach(function (k) { var i = self(el, k); i.value = def[k]; if (i.type === "range") fmtOut(i); });
      run(); self(el, "st").textContent = "Reset";
    });
    wire(el, run);
  };

  /* ---------- 8. Rebalancing rule tester (INV-028) ---------- */
  TOOLS.s4Rebalance = function (el) {
    var u = uid(el), h = hist();
    shell(el, "Test a rebalancing rule on 98 years of data", "Historical data",
      rng(u + "-t", "Target stock share", 10, 90, 5, 60, "pct") + rng(u + "-b", "Band before you act", 0, 20, 1, 5, "pts") +
      sel(u + "-y", "Start", [["1928", "1928 (all data)"], ["1966", "1966 (the inflation era)"], ["1990", "1990"], ["2000", "2000 (two bear markets)"]], "1928") +
      note("$10,000 in the S&amp;P 500 and 10-year Treasuries. Checked once a year at year-end: if the stock share is further from target than the band, the whole portfolio is reset to target. A band of 0 means reset every year. Before taxes and costs."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-nt"></p>');
    function run() {
      var t = Number(self(el, "t").value) / 100, bd = Number(self(el, "b").value), y0 = Number(self(el, "y").value);
      var pS = 10000 * t, pB = 10000 * (1 - t), nS = pS, nB = pB, cnt = 0, worst = Infinity, wy = y0, maxN = t * 100, minN = t * 100;
      var wP = [[y0, t * 100]], wN = [[y0, t * 100]], tg = [[y0, t * 100]];
      for (var y = y0; y <= h.last; y++) {
        var i = y - h.first, rs = h.stocks[i] / 100, rb = h.tbond[i] / 100, v0 = pS + pB;
        pS *= 1 + rs; pB *= 1 + rb; nS *= 1 + rs; nB *= 1 + rb;
        var v1 = pS + pB, ret = (v1 / v0 - 1) * 100; if (ret < worst) { worst = ret; wy = y; }
        var w = pS / v1 * 100, wn = nS / (nS + nB) * 100;
        maxN = Math.max(maxN, wn); minN = Math.min(minN, wn);
        wP.push([y + 1, w]); wN.push([y + 1, wn]); tg.push([y + 1, t * 100]);
        if (Math.abs(w - t * 100) > bd || bd === 0) { if (Math.abs(w - t * 100) > 1e-9) cnt++; pS = v1 * t; pB = v1 * (1 - t); }
      }
      var endP = pS + pB, endN = nS + nB, yrs = h.last - y0 + 1;
      self(el, "k").innerHTML = kpi("Ending value, with rule", money(endP)) + kpi("Never rebalanced", money(endN)) + kpi("Times rebalanced", cnt + " in " + yrs + " yrs") +
        kpi("Stock share, never rebalanced", Math.round(minN) + "–" + Math.round(maxN) + "%", maxN - t * 100 > 15 ? "bad" : "");
      INV.lineChart(self(el, "ch"), { label: "Stock share at each year-end", height: 250, xFmt: yearFmt, yFmt: function (v) { return Math.round(v) + "%"; }, yMin: 0, yMax: 100, yTitle: "Stock share at year-end",
        series: [{ name: "With your rule", color: "var(--s1)", data: wP }, { name: "Never rebalanced", color: "var(--s5)", data: wN, dash: "5 4" }, { name: "Target", color: "var(--s6)", data: tg, dash: "2 3", width: 1.4 }] });
      self(el, "nt").innerHTML = "With the rule, the worst calendar year was " + wy + " (" + pct(worst, 1) + "). Left alone, the portfolio drifted between " + Math.round(minN) + "% and " + Math.round(maxN) +
        "% stocks &mdash; a different risk level from the one chosen. " + (endN > endP ? "Never rebalancing ended with more money here, because stocks usually beat bonds; it did so by quietly carrying more risk." : "Rebalancing ended with more money over this period, as well as steadier risk.") +
        " The purpose of rebalancing is to keep the risk you chose, not to raise returns.";
    }
    wire(el, run);
  };
})();
