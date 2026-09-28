/* Investing Learning Lab - Stage 13 life-event calculators (INV-099 to INV-102) - V1.3 (October 2026)
   Every tool computes from its stated formula in the browser. Dollar limits are 2026 figures from
   IRS Rev. Proc. 2025-32, IRS Notice 2025-67 and SSA's 2026 COLA and SSI pages; they are labelled
   with the year wherever they appear. Historical tools use window.INV_RETURNS (Damodaran, NYU Stern). */
(function () {
  "use strict";
  var INV = window.INV; if (!INV || !INV.tools) return;
  var esc = INV.esc, money = INV.money, ms = INV.moneyShort, pct = INV.pct;
  var TOOLS = INV.tools;

  /* ---- local copies of the private helpers in inv-tools.js ---- */
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
  function sel(id, label, opts) {
    return '<div class="fld"><label for="' + id + '">' + esc(label) + '</label><select id="' + id + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[2] ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select></div>";
  }
  function hint(t) { return '<p class="hint" style="font-size:.76rem;color:var(--muted)">' + t + "</p>"; }
  function self(el, id) { return el.querySelector("#" + el.dataset.uid + "-" + id); }
  function uid(el) { if (!el.dataset.uid) el.dataset.uid = "t" + Math.random().toString(36).slice(2, 8); return el.dataset.uid; }
  function fmtOut(input) {
    var o = input.parentNode.querySelector("output"); if (!o) return;
    var f = input.getAttribute("data-fmt"), v = Number(input.value);
    o.textContent = f === "pct" ? v.toFixed(input.step.indexOf(".") > -1 ? (input.step.split(".")[1].length) : 0) + "%" :
      f === "yr" ? v + (v === 1 ? " year" : " years") : f === "mo" ? v + (v === 1 ? " month" : " months") : f === "wk" ? v + (v === 1 ? " week" : " weeks") : f === "money" ? money(v) : String(v);
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
  function yearFmt(v) { return String(Math.round(v)); }

  /* 2026 federal figures used below (sources in each module) */
  var Y26 = { ssWage: 184500, deferral: 24500, catch50: 8000, catch6063: 11250, dcLimit: 72000, compCap: 360000,
    ableLimit: 20000, ssiFbr: 994, ssiRes: 2000, ableDisregard: 100000 };

  /* ---------- 1. Lottery: cash option vs annuity (INV-099) ---------- */
  TOOLS.s13bLottery = function (el) {
    var u = uid(el);
    shell(el, "Jackpot: cash option or annuity?", "Present value",
      numf(u + "-j", "Advertised jackpot, the annuity total ($)", 100000000, 1000000) +
      numf(u + "-c", "Cash option offered today ($)", 45000000, 1000000) +
      rng(u + "-n", "Number of yearly payments", 10, 40, 1, 30) +
      rng(u + "-g", "Each payment rises by", 0, 8, 0.5, 5, "pct") +
      rng(u + "-r", "Discount rate (what the cash could earn)", 0, 10, 0.25, 4.5, "pct") +
      hint("Illustrative jackpot, not a specific game. The first payment is made now and each later payment is one year apart. Pre-tax: both options are taxed as ordinary income when received."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var J = num(el, "j"), C = num(el, "c"), n = Math.max(1, Math.round(num(el, "n"))), g = num(el, "g") / 100, r = num(el, "r") / 100;
      var P = g > 0 ? J * g / (Math.pow(1 + g, n) - 1) : J / n;
      function pv(rate) { var s = 0; for (var k = 0; k < n; k++) s += P * Math.pow(1 + g, k) / Math.pow(1 + rate, k); return s; }
      var v = pv(r), be = null;
      if (J > 0 && C > 0 && C < J) { var lo = 0, hi = 1; for (var i = 0; i < 80; i++) { var m = (lo + hi) / 2; if (pv(m) > C) lo = m; else hi = m; } be = lo * 100; }
      var better = v > C ? "Annuity" : "Cash option";
      self(el, "k").innerHTML = kpi("First payment", money(P)) + kpi("Annuity worth today", money(v), v > C ? "good" : "") +
        kpi("Cash option", money(C), C >= v ? "good" : "") + kpi("Break-even rate", be == null ? (C >= J && J > 0 ? "cash ≥ total" : "—") : be.toFixed(2) + "%");
      var pts = [], cash = [];
      for (var x = 0; x <= 10.001; x += 0.25) { pts.push([x, pv(x / 100)]); cash.push([x, C]); }
      INV.lineChart(self(el, "ch"), { label: "Annuity value by discount rate", height: 240, xTitle: "Discount rate (%)", yFmt: ms, xFmt: function (q) { return q + "%"; },
        series: [{ name: "Annuity, worth today", color: "var(--s1)", data: pts }, { name: "Cash option", color: "var(--s3)", data: cash, dash: "5 4" }],
        dots: [{ x: r * 100, y: v, label: ms(v), color: "var(--s1)" }] });
      self(el, "n2").innerHTML = "PV = Σ P(1 + g)<sup>k</sup> ÷ (1 + r)<sup>k</sup> for k = 0 to " + (n - 1) + ", with P = " + money(P) + ". At " + (r * 100).toFixed(2) + "%, the payments are worth <b>" + money(v) +
        "</b> today, so the <b>" + better.toLowerCase() + "</b> is worth more" + (be == null ? "." : "; the two are equal at about <b>" + be.toFixed(2) + "%</b>. If you are confident of earning more than that, after the same taxes, the cash wins; if not, the annuity does.");
    }
    wire(el, run);
  };

  /* ---------- 2. Lump sum vs staged investing, 1928-2025 (INV-099) ---------- */
  TOOLS.s13bStaged = function (el) {
    var u = uid(el), H = INV.hist();
    shell(el, "Invest it all now, or in stages?", "Historical data",
      rng(u + "-n", "Stage the money over", 2, 5, 1, 3, "yr") +
      sel(u + "-a", "Invest into", [["s", "100% US stocks (S&P 500)"], ["m", "60% stocks / 40% 10-year Treasuries"]]) +
      hint("Staged: an equal share of what is still waiting goes in at the start of each year; the waiting cash earns 3-month T-bill rates. Compared at the end of the staging period. Every start year from 1928. Calendar-year data (Damodaran, NYU Stern), before taxes and fees."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var N = Math.max(2, Math.round(Number(self(el, "n").value) || 3)), mix = self(el, "a").value === "m";
      var R = H.rows, data = [], wins = 0, diffs = [];
      for (var s = 0; s + N <= R.length; s++) {
        var L = 1, S = 0, C = 1;
        for (var k = 0; k < N; k++) {
          var row = R[s + k], ret = mix ? 0.6 * row[1] + 0.4 * row[3] : row[1];
          var add = C / (N - k); S += add; C -= add;
          L *= 1 + ret / 100; S *= 1 + ret / 100; C *= 1 + row[2] / 100;
        }
        var d = (L / (S + C) - 1) * 100; diffs.push(d); if (d > 0) wins++;
        data.push({ label: String(R[s][0]), tip: "Start " + R[s][0], y: d, color: d >= 0 ? "var(--s2)" : "var(--s5)" });
      }
      var sorted = diffs.slice().sort(function (a, b) { return a - b; }), n = diffs.length, med = sorted[Math.floor(n / 2)];
      self(el, "k").innerHTML = kpi("Start years tested", String(n)) + kpi("Lump sum ahead", pct(wins / n * 100, 0), "good") +
        kpi("Median lump-sum edge", pct(med, 1)) + kpi("Worst for lump sum", pct(sorted[0], 1), "bad");
      INV.barChart(self(el, "ch"), { label: "Lump-sum advantage by start year", height: 230, yFmt: function (v) { return Math.round(v) + "%"; }, tipFmt: function (v) { return pct(v, 1) + " lump sum versus staged"; }, data: data });
      self(el, "n2").innerHTML = "Each bar is one start year: how much more (green) or less (red) the lump sum had than the staged plan after " + N + " years. The lump sum was ahead in <b>" + wins + " of " + n +
        "</b> start years because " + (mix ? "a 60/40 mix" : "stocks") + " usually beat T-bills. Staging only wins when prices fall soon after the money arrives — which no one can reliably predict.";
    }
    wire(el, run);
  };

  /* ---------- 3. Windfall: pay off debt or invest? (INV-099) ---------- */
  TOOLS.s13bPayInvest = function (el) {
    var u = uid(el);
    shell(el, "Pay off the debt, or invest the windfall?", "Calculator",
      numf(u + "-w", "Windfall ($)", 50000, 1000) + numf(u + "-d", "Debt balance ($)", 28000, 1000) +
      rng(u + "-i", "Debt interest rate", 0, 25, 0.1, 6.8, "pct") + rng(u + "-t", "Years left on the debt", 1, 30, 1, 10, "yr") +
      rng(u + "-r", "Expected investment return, after tax", 0, 12, 0.5, 6, "pct") +
      hint("Both paths spend the same amount each month: the regular debt payment. Paying off frees that payment to be invested instead. Monthly compounding. The investment return is an expectation, not a promise; the debt rate is certain."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function pmtOf(D, i, m) { return D <= 0 ? 0 : i === 0 ? D / m : D * i / (1 - Math.pow(1 + i, -m)); }
    function run() {
      var W = num(el, "w"), D = num(el, "d"), i = num(el, "i") / 1200, m = Math.max(1, Math.round(num(el, "t"))) * 12, rr = num(el, "r") / 100, j = Math.pow(1 + rr, 1 / 12) - 1;
      var pay = pmtOf(D, i, m), payOff = Math.min(W, D), D2 = D - payOff, pay2 = pmtOf(D2, i, m);
      var A = W - payOff, B = W, pa = [[0, A - D2]], pb = [[0, B - D]], debtB = D, debtA = D2;
      for (var k = 1; k <= m; k++) {
        A = A * (1 + j) + (pay - pay2); B = B * (1 + j);
        debtA = Math.max(0, debtA * (1 + i) - pay2); debtB = Math.max(0, debtB * (1 + i) - pay);
        if (k % 12 === 0) { pa.push([k / 12, A - debtA]); pb.push([k / 12, B - debtB]); }
      }
      var diff = A - B;
      self(el, "k").innerHTML = kpi("Monthly debt payment", money(pay)) + kpi("Pay off first: ending net", money(A), diff >= 0 ? "good" : "") +
        kpi("Invest instead: ending net", money(B), diff < 0 ? "good" : "") + kpi("Difference", money(Math.abs(diff)) + (diff >= 0 ? " to paying off" : " to investing"));
      INV.lineChart(self(el, "ch"), { label: "Net worth from the windfall", height: 240, xTitle: "Years", xFmt: yearFmt, yFmt: ms, zeroBase: false,
        series: [{ name: "Pay off the debt, invest the freed payment", color: "var(--s2)", data: pa }, { name: "Invest the windfall, keep paying the debt", color: "var(--s1)", data: pb, dash: "5 4" }] });
      self(el, "n2").innerHTML = "Net worth here is investments minus remaining debt. Paying off a " + (i * 1200).toFixed(1) + "% debt is a guaranteed, tax-free " + (i * 1200).toFixed(1) +
        "% return. Investing wins on these assumptions only if the investments reliably earn more than that after tax — and it carries market risk the payoff does not.";
    }
    wire(el, run);
  };

  /* ---------- 4. Job-loss runway (INV-100) ---------- */
  TOOLS.s13bRunway = function (el) {
    var u = uid(el);
    shell(el, "How long will the money last?", "Runway calculator",
      numf(u + "-s", "Emergency savings available ($)", 30000, 500) + numf(u + "-v", "Severance, after tax withheld ($)", 14900, 500) +
      numf(u + "-e", "Essential spending per month ($)", 5200, 100, "Rent, food, utilities, insurance other than health, minimum debt payments") +
      numf(u + "-h", "Health coverage per month ($)", 1300, 50, "COBRA or a Marketplace plan") +
      numf(u + "-b", "Unemployment benefit per week ($)", 500, 10, "From your state's estimate; taxable income") +
      rng(u + "-w", "Weeks of unemployment benefits", 0, 26, 1, 26, "wk") + numf(u + "-o", "Other income per month ($)", 0, 100, "Part-time or freelance work") +
      rng(u + "-j", "Months until a new job (to plan around)", 1, 24, 1, 9, "mo"),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var bal = num(el, "s") + num(el, "v"), spend = num(el, "e") + num(el, "h"), wk = num(el, "b"), weeks = num(el, "w"), oth = num(el, "o"), job = Math.max(1, Math.round(num(el, "j")));
      var uiMonths = weeks * 12 / 52, pts = [[0, bal]], out = null, b = bal, horizon = 60, atJob = null;
      for (var mo = 1; mo <= horizon; mo++) {
        var uiShare = Math.max(0, Math.min(1, uiMonths - (mo - 1))), burn = spend - oth - wk * 52 / 12 * uiShare, prev = b;
        b -= burn;
        pts.push([mo, b]);
        if (out == null && b < 0) out = mo - 1 + (burn > 0 ? Math.max(0, prev) / burn : 0);
        if (mo === job) atJob = b;
      }
      var gapUI = spend - oth - wk * 52 / 12, gapAfter = spend - oth;
      /* chart only a few months past the later of the job, the end of benefits and the runway, so a shortfall is visible without a long fall below zero */
      var span = Math.min(36, Math.max(6, job, Math.ceil(uiMonths), out == null ? 36 : Math.ceil(out)) + 6);
      pts = pts.filter(function (p) { return p[0] <= span; });
      var runway = spend <= oth ? "No shortfall" : out == null ? "60+ months" : out.toFixed(1) + " months";
      self(el, "k").innerHTML = kpi("Starting cushion", money(bal)) + kpi("Monthly gap with benefits", money(Math.max(0, weeks > 0 ? gapUI : gapAfter)), "bad") +
        kpi("Runway", runway, out != null && out < job ? "bad" : "good") + kpi("Left at month " + job, money(atJob), atJob < 0 ? "bad" : "good");
      INV.lineChart(self(el, "ch"), { label: "Cash over time", height: 240, xTitle: "Months after the job ends", xFmt: yearFmt, yFmt: ms, zeroBase: false,
        series: [{ name: "Cash remaining (below zero = shortfall)", color: "var(--s1)", data: pts, area: true }], marks: [{ x: Math.min(job, span), label: "Planned new job" }].concat(weeks > 0 && uiMonths <= span ? [{ x: uiMonths, label: "Benefits end", dy: 14 }] : []) });
      self(el, "n2").innerHTML = "Benefits of " + money(wk) + " a week are about " + money(wk * 52 / 12) + " a month for " + uiMonths.toFixed(1) + " months. " +
        (out == null ? "On these numbers the cushion outlasts five years." : "The cushion runs out after about <b>" + out.toFixed(1) + " months</b>" + (out < job ? " — before the planned new job, so cut spending, add income or line up other resources now." : ", after the planned new job.")) +
        " Unemployment benefits are taxable; have tax withheld or set some aside.";
    }
    wire(el, run);
  };

  /* ---------- 5. Leaving a job: cash out or roll over the 401(k)? (INV-100) ---------- */
  TOOLS.s13bLeave401k = function (el) {
    var u = uid(el);
    shell(el, "Leaving a job: cash out or keep the 401(k) invested?", "Calculator",
      numf(u + "-b", "Vested 401(k) balance, before any loan ($)", 290000, 1000) + numf(u + "-l", "Outstanding 401(k) loan ($)", 0, 500) +
      sel(u + "-a", "Your age when you leave", [["u", "Under 55 in the year you leave"], ["r55", "55 or older in the year you leave (plan only)", true], ["o", "59½ or older"]]) +
      rng(u + "-f", "Your federal marginal tax rate", 10, 37, 1, 29, "pct") + rng(u + "-s", "Your state income tax rate", 0, 11, 0.5, 3, "pct") +
      rng(u + "-y", "Years until retirement", 1, 40, 1, 9, "yr") + rng(u + "-r", "Return if it stays invested", 0, 10, 0.5, 6, "pct") +
      hint("Cashing out: the plan withholds 20% federal tax; the rest of the tax, any state tax and any 10% additional tax are settled on your return. A loan not repaid is offset (subtracted) from the balance and taxed unless you roll the same amount over by your tax-filing deadline, including extensions."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var B = num(el, "b"), L = Math.min(num(el, "l"), B), age = self(el, "a").value, f = num(el, "f") / 100, st = num(el, "s") / 100, y = Math.max(1, Math.round(num(el, "y"))), r = num(el, "r") / 100;
      var pen = age === "u" ? 0.10 : 0, net = B - L, withheld = 0.20 * net, taxAll = B * (f + st + pen), cashNet = net - taxAll, keep = B * Math.pow(1 + r, y);
      var offsetTax = L * (f + st + pen);
      self(el, "k").innerHTML = kpi("Check you receive (after 20% withheld)", money(net - withheld)) + kpi("Cash kept after all tax", money(Math.max(0, cashNet)), "bad") +
        kpi("Tax and penalty on cashing out", money(taxAll), "bad") + kpi("Kept invested, at retirement", money(keep), "good");
      var d = [{ label: "Cash out now", y: Math.max(0, cashNet), color: "var(--s5)" }, { label: "Roll over, loan repaid", y: keep, color: "var(--s2)" },
        { label: "Roll over, loan offset", y: (B - L) * Math.pow(1 + r, y), color: "var(--s3)" }];
      INV.barChart(self(el, "ch"), { label: "What the balance becomes", height: 230, allLabels: true, valueLabels: true, yFmt: ms, tipFmt: function (v) { return money(v); }, data: d });
      self(el, "n2").innerHTML = (pen ? "Leaving before the year you turn 55 means a 10% additional tax on a cash-out, on top of income tax. " : age === "r55" ? "Leaving in or after the year you turn 55 avoids the 10% additional tax on withdrawals from <i>this employer's plan</i> — not if you first roll it to an IRA. " : "") +
        (L > 0 ? "The " + money(L) + " loan, if not repaid, becomes a plan loan offset: about <b>" + money(offsetTax) + "</b> of tax and penalty unless you deposit " + money(L) + " of your own money into an IRA or new plan by your filing deadline. " : "") +
        "Future values are in future dollars, before tax on eventual withdrawals.";
    }
    wire(el, run);
  };

  /* ---------- 6. Self-employment tax and SEP IRA vs solo 401(k), 2026 (INV-101) ---------- */
  function seCalc(profit, w2) {
    var ne = profit * 0.9235; if (ne < 400) return { ne: ne, se: 0, ss: 0, med: 0, half: 0, base: profit };
    var ss = 0.124 * Math.min(ne, Math.max(0, Y26.ssWage - w2)), med = 0.029 * ne, se = ss + med;
    return { ne: ne, se: se, ss: ss, med: med, half: se / 2, base: profit - se / 2 };
  }
  function planMax(profit, age, otherDef, w2) {
    var c = seCalc(profit, w2), base = Math.max(0, c.base);
    var employer = Math.min(0.20 * base, 0.25 * Y26.compCap, Y26.dcLimit);
    var sep = employer;
    var defRoom = Math.max(0, Y26.deferral - otherDef), def = Math.min(defRoom, Math.max(0, base - employer));
    var core = Math.min(def + employer, Y26.dcLimit);
    var cu = age === "50" || age === "64" ? Y26.catch50 : age === "60" ? Y26.catch6063 : 0;
    var catchUp = Math.min(cu, Math.max(0, base - core));
    return { c: c, base: base, sep: sep, def: def, employer: employer, solo: core + catchUp, catchUp: catchUp };
  }
  TOOLS.s13bSEP = function (el) {
    var u = uid(el);
    shell(el, "SEP IRA or solo 401(k)? Maximum contributions for 2026", "Calculator",
      numf(u + "-p", "Net profit from the business, Schedule C ($)", 90000, 1000) +
      sel(u + "-a", "Your age at the end of 2026", [["u", "Under 50"], ["50", "50 to 59"], ["60", "60 to 63"], ["64", "64 or older"]]) +
      numf(u + "-o", "401(k) deferrals already made at another job in 2026 ($)", 0, 500) +
      numf(u + "-w", "W-2 wages at another job in 2026 ($)", 0, 1000, "Counts toward the $184,500 Social Security wage base") +
      hint("2026 limits: $24,500 employee deferral; $8,000 catch-up at 50+, $11,250 at 60–63; $72,000 total excluding catch-up; $360,000 compensation cap. Sole proprietor with no employees. Employer share = 20% of net profit minus half of self-employment tax."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var P = num(el, "p"), age = self(el, "a").value, od = num(el, "o"), w2 = num(el, "w"), m = planMax(P, age, od, w2);
      self(el, "k").innerHTML = kpi("Self-employment tax", money(m.c.se), "bad") + kpi("Deductible half", money(m.c.half)) +
        kpi("SEP IRA maximum", money(m.sep)) + kpi("Solo 401(k) maximum", money(m.solo), m.solo > m.sep ? "good" : "");
      var sp = [], so = [];
      for (var x = 0; x <= 400000; x += 10000) { var q = planMax(x, age, od, w2); sp.push([x, q.sep]); so.push([x, q.solo]); }
      INV.lineChart(self(el, "ch"), { label: "Maximum contribution by net profit", height: 240, xTitle: "Net profit (Schedule C)", xFmt: ms, yFmt: ms,
        series: [{ name: "Solo 401(k)", color: "var(--s2)", data: so }, { name: "SEP IRA", color: "var(--s1)", data: sp, dash: "5 4" }],
        dots: [{ x: Math.min(P, 400000), y: m.solo, label: ms(m.solo), color: "var(--s2)" }] });
      self(el, "n2").innerHTML = "Net earnings = " + money(P) + " × 92.35% = " + money(m.c.ne) + "; self-employment tax = 12.4% (up to the wage base) + 2.9% = " + money(m.c.se) +
        ". Contribution base = profit − half of SE tax = " + money(m.base) + ". SEP = 20% of that = <b>" + money(m.sep) + "</b>. Solo 401(k) = " + money(m.def) + " employee deferral + " + money(m.employer) + " employer share" +
        (m.catchUp ? " + " + money(m.catchUp) + " catch-up" : "") + " = <b>" + money(m.solo) + "</b>." + (od > 0 ? " Deferrals at another job share the one $24,500 employee limit." : "");
    }
    wire(el, run);
  };

  /* ---------- 7. Quarterly estimated tax and the safe harbor, 2026 (INV-101) ---------- */
  TOOLS.s13bSafeHarbor = function (el) {
    var u = uid(el);
    shell(el, "Quarterly estimated tax: the safe-harbor amount", "Calculator",
      numf(u + "-p", "Total tax on last year's (2025) return ($)", 14000, 500) +
      sel(u + "-h", "Adjusted gross income on the 2025 return", [["lo", "$150,000 or less ($75,000 if married filing separately)"], ["hi", "More than $150,000 ($75,000 if married filing separately)"]]) +
      numf(u + "-e", "Expected total tax for 2026 ($)", 20000, 500, "Income tax plus self-employment tax") +
      numf(u + "-w", "Tax withheld from any paychecks in 2026 ($)", 0, 500) +
      hint("You generally avoid the underpayment penalty if withholding plus timely estimates cover the smaller of 90% of this year's tax or 100% of last year's (110% if last year's AGI was over $150,000), or if you owe less than $1,000 after withholding. 2026 due dates: April 15, June 15 and September 15, 2026, and January 15, 2027."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var p = num(el, "p"), hi = self(el, "h").value === "hi", e = num(el, "e"), w = num(el, "w");
      var prior = (hi ? 1.1 : 1) * p, cur = 0.9 * e, target = Math.min(prior, cur), need = Math.max(0, target - w), q = need / 4, owe = e - w;
      var none = owe < 1000;
      self(el, "k").innerHTML = kpi("Safe-harbor target", money(target)) + kpi("Covered by withholding", money(Math.min(w, target))) +
        kpi("Each quarterly payment", none ? money(0) : money(q), "good") + kpi("Still due in April 2027", money(Math.max(0, e - Math.max(w, none ? w : target))));
      INV.barChart(self(el, "ch"), { label: "Which safe harbor is smaller?", height: 220, allLabels: true, valueLabels: true, yFmt: ms, tipFmt: function (v) { return money(v); },
        data: [{ label: "90% of 2026 tax", y: cur, color: cur <= prior ? "var(--s2)" : "var(--s6)" }, { label: (hi ? "110%" : "100%") + " of 2025 tax", y: prior, color: prior < cur ? "var(--s2)" : "var(--s6)" }, { label: "Expected 2026 tax", y: e, color: "var(--s3)" }] });
      self(el, "n2").innerHTML = none ? "Expected tax after withholding is under $1,000, so no estimated payments are required; pay the balance with the return." :
        "Pay <b>" + money(q) + "</b> by each of the four due dates. The target uses the " + (prior < cur ? (hi ? "110%" : "100%") + "-of-last-year" : "90%-of-this-year") + " rule because it is smaller. " +
        (prior < cur ? "Last-year's rule is safest when income is rising or uncertain: it is a known number." : "") + " Any tax above the target is due by April 15, 2027, without an underpayment penalty.";
    }
    wire(el, run);
  };

  /* ---------- 8. ABLE account and the SSI resource test, 2026 (INV-102) ---------- */
  TOOLS.s13bAble = function (el) {
    var u = uid(el);
    shell(el, "ABLE account growth and the SSI $100,000 line", "Calculator",
      numf(u + "-b", "ABLE balance today ($)", 0, 500) + numf(u + "-o", "Other countable resources ($)", 500, 100, "Cash, bank accounts, investments in the person's name") +
      numf(u + "-c", "Contributions per year ($)", 4000, 500, "Standard 2026 limit: $20,000 from all contributors combined") +
      rng(u + "-r", "Annual return", 0, 8, 0.5, 5, "pct") + rng(u + "-y", "Years to project", 1, 40, 1, 20, "yr") +
      hint("SSI ignores the first $100,000 in an ABLE account; any excess counts toward the $2,000 individual resource limit. Medicaid continues if only the ABLE excess causes the overage. Withdrawals are ignored if spent on qualified disability expenses (housing counts, but housing money held past the month it is withdrawn can count)."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var b = num(el, "b"), o = num(el, "o"), c0 = num(el, "c"), c = Math.min(c0, Y26.ableLimit), r = num(el, "r") / 100, y = Math.max(1, Math.round(num(el, "y")));
      var pts = [[0, b]], line = [[0, Y26.ableDisregard]], cross = b > Y26.ableDisregard ? 0 : null, v = b;
      for (var t = 1; t <= y; t++) { v = v * (1 + r) + c; pts.push([t, v]); line.push([t, Y26.ableDisregard]); if (cross == null && v > Y26.ableDisregard) cross = t; }
      var countNow = o + Math.max(0, b - Y26.ableDisregard), countEnd = o + Math.max(0, v - Y26.ableDisregard);
      self(el, "k").innerHTML = kpi("Countable for SSI today", money(countNow), countNow > Y26.ssiRes ? "bad" : "good") + kpi("SSI resource test today", countNow > Y26.ssiRes ? "Over $2,000" : "Under $2,000", countNow > Y26.ssiRes ? "bad" : "good") +
        kpi("ABLE passes $100,000", cross == null ? "Not within " + y + " yrs" : cross === 0 ? "Already" : "Year " + cross) + kpi("ABLE balance in " + y + " yrs", money(v));
      INV.lineChart(self(el, "ch"), { label: "ABLE balance", height: 240, xTitle: "Years from now", xFmt: yearFmt, yFmt: ms,
        series: [{ name: "ABLE balance", color: "var(--s2)", data: pts, area: true }, { name: "$100,000 SSI disregard", color: "var(--s5)", data: line, dash: "5 4" }] });
      self(el, "n2").innerHTML = (c0 > Y26.ableLimit ? "Contributions are capped here at the 2026 standard limit of $20,000; more is allowed only through the ABLE to Work rule for a working beneficiary. " : "") +
        (cross == null ? "The account stays under $100,000 for the whole projection, so it never counts against SSI." : "Once the balance passes $100,000, each extra dollar counts toward the $2,000 limit; at the end of the projection countable resources would be <b>" + money(countEnd) + "</b>, " + (countEnd > Y26.ssiRes ? "which would suspend SSI cash payments (Medicaid continues if only the ABLE excess causes it). Spending on qualified expenses or directing new gifts to a special needs trust keeps it under." : "still under the limit."));
    }
    wire(el, run);
  };

  /* ---------- 9. SSI monthly payment from other income, 2026 (INV-102) ---------- */
  TOOLS.s13bSSI = function (el) {
    var u = uid(el);
    shell(el, "How other income reduces an SSI payment (2026)", "Calculator",
      numf(u + "-n", "Unearned income per month ($)", 300, 10, "Social Security benefits, pensions, cash gifts, support paid in cash") +
      numf(u + "-e", "Gross wages per month ($)", 0, 10) +
      hint("SSA's order: the first $20 of most income is not counted (unearned first); then the first $65 of wages and half of the rest are not counted. Countable income is subtracted from the 2026 federal benefit rate of $994 for an individual. State supplements, if any, are extra."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function calc(un, ea) {
      var gen = 20, cu = Math.max(0, un - gen), left = Math.max(0, gen - un), ce = Math.max(0, ea - left - 65) / 2, cnt = cu + ce;
      return { cu: cu, ce: ce, cnt: cnt, pay: Math.max(0, Y26.ssiFbr - cnt) };
    }
    function run() {
      var un = num(el, "n"), ea = num(el, "e"), x = calc(un, ea);
      self(el, "k").innerHTML = kpi("Countable unearned", money(x.cu)) + kpi("Countable wages", money(x.ce)) + kpi("Federal SSI payment", money(x.pay), x.pay > 0 ? "good" : "bad") + kpi("Total monthly income", money(x.pay + un + ea));
      var d = []; for (var w = 0; w <= 2400; w += 100) { var q = calc(un, w); d.push([w, q.pay + un + w]); }
      var d2 = []; for (var w2 = 0; w2 <= 2400; w2 += 100) d2.push([w2, calc(un, w2).pay]);
      INV.lineChart(self(el, "ch"), { label: "Income as wages rise", height: 230, xTitle: "Gross wages per month", xFmt: function (v) { return "$" + v.toLocaleString(); }, xTicks: [0, 400, 800, 1200, 1600, 2000, 2400], yFmt: function (v) { return "$" + Math.round(v).toLocaleString(); },
        series: [{ name: "Total income (wages + benefits + SSI)", color: "var(--s2)", data: d }, { name: "SSI payment", color: "var(--s1)", data: d2, dash: "5 4" }] });
      self(el, "n2").innerHTML = "$994 − " + money(x.cnt) + " countable = <b>" + money(x.pay) + "</b> a month. Because only half of wages above the exclusions count, every extra dollar earned raises total income by about 50 cents until SSI reaches zero — work nearly always leaves the person better off.";
    }
    wire(el, run);
  };
})();
