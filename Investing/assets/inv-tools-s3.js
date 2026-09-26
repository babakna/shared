/* Investing Learning Lab - Stage 3 (Your Financial Base) calculators - V1.0 (September 2026)
   Tools for INV-018 to INV-023. Every tool computes from its stated formula in the browser.
   Pure calculation functions are exposed on INV.s3 so the numbers quoted in the modules can be
   reproduced exactly. */
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
      f === "yr" ? v + (v === 1 ? " year" : " years") : f === "money" ? money(v) : f === "mo" ? v + (v === 1 ? " month" : " months") : String(v);
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
  function rv(el, id) { var v = Number(self(el, id).value); return isFinite(v) ? v : 0; }
  function yrs(m) { if (m >= 600) return "50+ years"; var y = Math.floor(m / 12), r = m % 12; return (y ? y + (y === 1 ? " yr " : " yrs ") : "") + (r || !y ? r + " mo" : "").trim(); }

  /* ---------- pure calculations (also used to check the module text) ---------- */
  var S3 = INV.s3 = {};
  /* years to reach 25x (or 1/w x) annual spending, starting from nothing, saving share s of take-home, real return r */
  S3.yearsToFI = function (s, r, w) {
    if (s <= 0) return Infinity; if (s >= 1) return 0;
    var target = (1 - s) / w; /* in units of take-home pay */
    if (r <= 0) return target / s;
    return Math.log(1 + target * r / s) / Math.log(1 + r);
  };
  /* emergency-fund months from household factors */
  S3.efMonths = function (income, stability, deps, home) {
    var base = { two: 3, one: 4, variable: 6, retired: 3 }[income] || 4;
    var st = income === "retired" ? 0 : ({ stable: 0, typical: 1, risky: 2 }[stability] || 0); /* no job to lose in retirement */
    return base + st + (deps === "yes" ? 1 : 0) + (home === "own" ? 1 : 0);
  };
  /* debts: [{b, apr, min}], extra per month, order "avalanche"|"snowball" */
  S3.payoff = function (debts, extra, order) {
    var d = debts.filter(function (x) { return x.b > 0; }).map(function (x, i) { return { b: x.b, r: x.apr / 1200, min: x.min, i: i, paidAt: null }; });
    var budget = d.reduce(function (s, x) { return s + x.min; }, 0) + extra;
    var month = 0, interest = 0, path = [[0, d.reduce(function (s, x) { return s + x.b; }, 0)]], first = null;
    while (d.some(function (x) { return x.b > 0.005; }) && month < 600) {
      month++;
      d.forEach(function (x) { if (x.b > 0) { var it = x.b * x.r; x.b += it; interest += it; } });
      var left = budget;
      d.forEach(function (x) { if (x.b > 0) { var p = Math.min(x.min, x.b); x.b -= p; left -= p; } });
      var open = d.filter(function (x) { return x.b > 0.005; });
      open.sort(order === "snowball" ? function (a, b) { return a.b - b.b || b.r - a.r; } : function (a, b) { return b.r - a.r || a.b - b.b; });
      for (var k = 0; k < open.length && left > 0.005; k++) { var q = Math.min(left, open[k].b); open[k].b -= q; left -= q; }
      d.forEach(function (x) { if (x.b <= 0.005 && x.paidAt === null) { x.b = 0; x.paidAt = month; if (first === null) first = { i: x.i, m: month }; } });
      path.push([month, d.reduce(function (s, x) { return s + Math.max(0, x.b); }, 0)]);
    }
    return { months: month, interest: interest, path: path, first: first, done: !d.some(function (x) { return x.b > 0.005; }), order: d.slice().sort(function (a, b) { return (a.paidAt || 999) - (b.paidAt || 999); }).map(function (x) { return x.i; }), paid: d.map(function (x) { return [x.i, x.paidAt]; }) };
  };
  S3.fvMonthly = function (pmt, annual, years) { var i = Math.pow(1 + annual, 1 / 12) - 1, n = years * 12; return i === 0 ? pmt * n : pmt * (Math.pow(1 + i, n) - 1) / i; };
  /* same, for a loan quoted as an APR: interest accrues at APR / 12 a month (as in S3.payoff) */
  S3.fvMonthlyApr = function (pmt, apr, years) { var i = apr / 12, n = years * 12; return i === 0 ? pmt * n : pmt * (Math.pow(1 + i, n) - 1) / i; };
  S3.match = function (salary, contribPct, matchRate, capPct, limit) {
    var mine = Math.min(salary * contribPct / 100, limit), eff = salary > 0 ? mine / salary * 100 : 0;
    var match = salary * Math.min(eff, capPct) / 100 * matchRate / 100, full = salary * capPct / 100 * matchRate / 100;
    return { mine: mine, match: match, full: full, missed: Math.max(0, full - match) };
  };
  S3.vested = function (schedule, years) {
    if (schedule === "cliff3") return years >= 3 ? 1 : 0;
    if (schedule === "graded6") return Math.max(0, Math.min(1, (years - 1) * 0.2));
    return 1;
  };
  S3.pvAnnuity = function (amt, r, n) { return r === 0 ? amt * n : amt * (1 - Math.pow(1 + r, -n)) / r; };
  S3.lifeNeed = function (o) {
    var r = o.rate / 100, need = o.income * o.share / 100, gap = Math.max(0, need - o.ss * 12);
    var replace = S3.pvAnnuity(need, r, o.years);
    var needs = S3.pvAnnuity(gap, r, o.years) + o.debts + o.edu + o.final - o.savings;
    return { replace: Math.max(0, replace - o.existing), needs: Math.max(0, needs - o.existing), rule: Math.max(0, o.income * 10 - o.existing), pvGap: S3.pvAnnuity(gap, r, o.years), pvNeed: replace };
  };

  /* ---------- 1. Cash-flow and savings-rate check (INV-018) ---------- */
  TOOLS.s3CashFlow = function (el) {
    var u = uid(el);
    shell(el, "Your monthly cash flow and savings rate", "Calculator",
      numf(u + "-g", "Gross pay per month ($)", 5167, 50, "Before any taxes or deductions") +
      numf(u + "-t", "Take-home pay per month ($)", 3822, 50, "What actually reaches your bank account") +
      numf(u + "-n", "Needs ($/month)", 2737, 25, "Housing, utilities, groceries, transport, insurance, minimum debt payments") +
      numf(u + "-w", "Wants ($/month)", 685, 25, "Dining out, subscriptions, travel, hobbies") +
      numf(u + "-s", "Saved from take-home ($/month)", 400, 25, "Transfers to savings or investments, extra debt payments") +
      numf(u + "-k", "Pre-tax retirement contribution ($/month)", 310, 10, "Already taken out before take-home") +
      numf(u + "-m", "Employer match ($/month)", 155, 5) +
      note("Defaults are Maya's plan from this module. The 50/30/20 split is a rule of thumb applied to take-home pay, not a law of nature."),
      '<div class="kpis" id="' + u + '-k2"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var g = num(el, "g"), t = num(el, "t"), n = num(el, "n"), w = num(el, "w"), s = num(el, "s"), k = num(el, "k"), m = num(el, "m");
      var left = t - n - w - s, saved = s + k + m, rate = g > 0 ? saved / g * 100 : 0, rateT = t > 0 ? s / t * 100 : 0;
      var sh = function (x) { return t > 0 ? x / t * 100 : 0; };
      self(el, "k2").innerHTML = kpi("Not yet assigned", money(left), left < -0.5 ? "bad" : "") + kpi("Needs, share of take-home", pct(sh(n), 0), sh(n) > 50 ? "bad" : "good") +
        kpi("Savings rate (of gross)", pct(rate, 1), rate >= 15 ? "good" : "") + kpi("Saved per year, all sources", money(saved * 12));
      INV.barChart(self(el, "c"), { label: "Your split versus 50/30/20", height: 230, allLabels: true, valueLabels: true, yFmt: function (v) { return Math.round(v) + "%"; },
        data: [{ label: "Needs: you", y: sh(n), color: "var(--s1)" }, { label: "Needs: guide", y: 50, color: "var(--s6)", dim: true },
          { label: "Wants: you", y: sh(w), color: "var(--s3)" }, { label: "Wants: guide", y: 30, color: "var(--s6)", dim: true },
          { label: "Saving: you", y: sh(s), color: "var(--s2)" }, { label: "Saving: guide", y: 20, color: "var(--s6)", dim: true }] });
      self(el, "n2").innerHTML = (left < -0.5 ? "You have planned <b>" + money(-left) + "</b> more than you take home each month. Something has to give: trim wants first, then look at the largest needs." :
        left > 0.5 ? "<b>" + money(left) + "</b> a month has no job yet. Give it one (savings, debt or a sinking fund) before it disappears into spending." : "Every dollar has a job: a zero-based plan.") +
        " Counting pre-tax contributions and the match, you save <b>" + pct(rate, 1) + "</b> of gross pay; the saving from take-home alone is " + pct(rateT, 1) + " of take-home.";
    }
    wire(el, run);
  };

  /* ---------- 2. Savings rate and years to financial independence (INV-018) ---------- */
  TOOLS.s3SavingsRate = function (el) {
    var u = uid(el);
    shell(el, "Savings rate and the years to financial independence", "Model",
      rng(u + "-s", "Savings rate (share of take-home pay)", 5, 70, 1, 20, "pct") +
      rng(u + "-r", "Real return after inflation", 0, 8, 0.5, 5, "pct") +
      rng(u + "-w", "Withdrawal rate you will live on", 3, 5, 0.25, 4, "pct") +
      note("Starts from zero savings. You spend everything you do not save, and must later replace that spending from the portfolio. A model with fixed assumptions, not a forecast; INV-072 covers financial independence in depth."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var s = rv(el, "s") / 100, r = rv(el, "r") / 100, w = rv(el, "w") / 100;
      var n = S3.yearsToFI(s, r, w), mult = 1 / w;
      self(el, "k").innerHTML = kpi("Years to independence", isFinite(n) ? n.toFixed(1) : "Never") + kpi("Target", mult.toFixed(1) + "× spending") +
        kpi("You live on", pct((1 - s) * 100, 0) + " of pay") + kpi("One extra point of savings", isFinite(n) ? "−" + Math.max(0, n - S3.yearsToFI(Math.min(0.99, s + 0.01), r, w)).toFixed(1) + " yrs" : "Never");
      var pts = []; for (var x = 5; x <= 70; x += 1) pts.push([x, S3.yearsToFI(x / 100, r, w)]);
      INV.lineChart(self(el, "c"), { label: "Years to financial independence by savings rate", height: 250, xTitle: "Savings rate (% of take-home pay)", yTitle: "Years", xFmt: function (v) { return v + "%"; }, yFmt: function (v) { return Math.round(v); },
        series: [{ name: "Years to independence", color: "var(--s1)", data: pts }], dots: [{ x: s * 100, y: n, label: n.toFixed(1) + " years", color: "var(--s5)" }] });
      self(el, "n").innerHTML = "A higher savings rate works twice: more goes in <i>and</i> the spending you must eventually replace is smaller. Formula: n = ln(1 + T·r / s) ÷ ln(1 + r), where T = (1 − s) ÷ w is the target in years of pay.";
    }
    wire(el, run);
  };

  /* ---------- 3. Emergency-fund sizing (INV-019) ---------- */
  TOOLS.s3EmergencyFund = function (el) {
    var u = uid(el);
    shell(el, "How big should your emergency fund be?", "Calculator",
      numf(u + "-e", "Essential spending per month ($)", 2737, 50, "What you must pay even in a bad month") +
      sel(u + "-i", "Household income", [["two", "Two steady incomes"], ["one", "One steady income"], ["variable", "Variable, commission or self-employed"], ["retired", "Retired, with Social Security or a pension"]], "one") +
      sel(u + "-j", "Job and industry", [["stable", "Very stable (in-demand skills, secure employer)"], ["typical", "Typical"], ["risky", "Cyclical, at risk, or hard to replace"]], "typical") +
      sel(u + "-d", "Anyone depending on you?", [["no", "No"], ["yes", "Yes: children or others"]], "no") +
      sel(u + "-h", "Housing", [["rent", "Rent"], ["own", "Own (repairs are yours)"]], "rent") +
      numf(u + "-x", "Plus deductibles you could owe at once ($)", 1000, 100, "Health, car or home insurance") +
      numf(u + "-c0", "Cash already set aside ($)", 3000, 100) + numf(u + "-a", "You can add each month ($)", 400, 25) +
      note("A heuristic: 3 months for two steady incomes (or a retiree with Social Security or a pension), 4 for one steady income, 6 if income varies; add 1 month for a typical job (2 if cyclical or at risk, 0 if very stable; ignored for retirees), 1 for dependents and 1 for home ownership. Defaults are Maya's."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var e = num(el, "e"), x = num(el, "x"), c0 = num(el, "c0"), a = num(el, "a");
      var mo = S3.efMonths(self(el, "i").value, self(el, "j").value, self(el, "d").value, self(el, "h").value);
      var target = e * mo + x, gap = Math.max(0, target - c0), have = e > 0 ? c0 / e : 0;
      var months = gap === 0 ? 0 : a > 0 ? Math.ceil(gap / a) : null;
      self(el, "k").innerHTML = kpi("Suggested cushion", mo + " months") + kpi("Target", money(target)) + kpi("You cover now", have.toFixed(1) + " months", have >= mo ? "good" : "bad") +
        kpi("Time to reach target", months === null ? "Not at $0/month" : months === 0 ? "Reached" : yrs(months), months === 0 ? "good" : "");
      var H = Math.min(120, months === null ? 36 : Math.max(12, months + 3)), pts = [], tl = [];
      for (var m = 0; m <= H; m++) { pts.push([m, Math.min(target, c0 + a * m)]); tl.push([m, target]); }
      INV.lineChart(self(el, "ch"), { label: "Building the emergency fund", height: 230, xTitle: "Months from now", xFmt: function (v) { return String(Math.round(v)); }, yFmt: ms,
        series: [{ name: "Your emergency fund", color: "var(--s2)", data: pts, area: true }, { name: "Target", color: "var(--s5)", data: tl, dash: "5 4", width: 1.6 }] });
      self(el, "n").innerHTML = "Target = " + money(e) + " × " + mo + " months + " + money(x) + " of deductibles = <b>" + money(target) + "</b>." +
        (gap > 0 ? " You are " + money(gap) + " short" + (months ? "; at " + money(a) + " a month you close the gap in about " + yrs(months) + "." : ".") : " You are fully funded: new savings can go to other goals.");
    }
    wire(el, run);
  };

  /* ---------- 4. Avalanche versus snowball (INV-020) ---------- */
  TOOLS.s3Payoff = function (el) {
    var u = uid(el);
    var D = [["Card A", 6500, 24.9, 160], ["Store card", 1200, 19.9, 40], ["Medical plan", 600, 0, 50], ["Car loan", 9800, 7.4, 245]];
    var rows = D.map(function (d, i) {
      return '<div class="fld"><label>' + esc(d[0]) + '</label><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">' +
        '<input type="number" aria-label="' + esc(d[0]) + ' balance ($)" id="' + u + "-b" + i + '" value="' + d[1] + '" step="100" min="0" title="Balance ($)">' +
        '<input type="number" aria-label="' + esc(d[0]) + ' interest rate (APR %)" id="' + u + "-r" + i + '" value="' + d[2] + '" step="0.1" min="0" title="APR (%)">' +
        '<input type="number" aria-label="' + esc(d[0]) + ' minimum payment ($)" id="' + u + "-m" + i + '" value="' + d[3] + '" step="5" min="0" title="Minimum ($/month)">' + "</div></div>";
    }).join("");
    shell(el, "Avalanche or snowball: pay off four debts", "Calculator",
      note("For each debt: balance ($) · APR (%) · minimum payment ($/month). Illustrative debts; type your own.") + rows +
      rng(u + "-x", "Extra paid each month beyond the minimums", 0, 1500, 25, 250, "money") +
      note("Each month: interest is added, every minimum is paid, then the extra (plus minimums freed by paid-off debts) goes to the target debt: highest rate first (avalanche) or smallest balance first (snowball). Minimums are held fixed, a simplification."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var debts = D.map(function (d, i) { return { b: num(el, "b" + i), apr: num(el, "r" + i), min: num(el, "m" + i) }; });
      var x = num(el, "x"), A = S3.payoff(debts, x, "avalanche"), S = S3.payoff(debts, x, "snowball");
      var name = function (r) { return r.first ? D[r.first.i][0] + " (month " + r.first.m + ")" : "None"; };
      self(el, "k").innerHTML = kpi("Avalanche: debt-free in", A.done ? yrs(A.months) : "50+ years", "good") + kpi("Avalanche interest", money(A.interest)) +
        kpi("Snowball: debt-free in", S.done ? yrs(S.months) : "50+ years") + kpi("Snowball costs extra", money(S.interest - A.interest), S.interest - A.interest > 1 ? "bad" : "good");
      INV.lineChart(self(el, "c"), { label: "Total debt over time", height: 240, xTitle: "Months from now", xFmt: function (v) { return String(Math.round(v)); }, yFmt: ms,
        series: [{ name: "Avalanche (highest rate first)", color: "var(--s2)", data: A.path }, { name: "Snowball (smallest balance first)", color: "var(--s3)", data: S.path, dash: "5 4" }] });
      self(el, "n").innerHTML = (A.done && S.done ? "First debt gone: avalanche, " + name(A) + "; snowball, " + name(S) + ". " : "At these payments some debt is never repaid within 50 years: the payments do not keep up with the interest. ") +
        "The avalanche always costs the least interest; the snowball buys earlier wins, which research finds can keep people paying.";
    }
    wire(el, run);
  };

  /* ---------- 5. Invest or repay (INV-020) ---------- */
  TOOLS.s3InvestRepay = function (el) {
    var u = uid(el);
    shell(el, "Extra money: pay down debt or invest?", "Calculator",
      numf(u + "-p", "Extra money each month ($)", 300, 25) +
      rng(u + "-d", "Debt interest rate (APR)", 0, 30, 0.1, 6.8, "pct") +
      rng(u + "-t", "Tax rate at which the interest is deductible (0 if not)", 0, 37, 1, 12, "pct") +
      rng(u + "-i", "Expected investment return (not guaranteed)", 0, 10, 0.5, 6, "pct") +
      rng(u + "-y", "Years", 1, 30, 1, 10, "yr") +
      note("Paying a debt early 'earns' its after-tax interest rate with certainty; interest is taken as accruing monthly at APR ÷ 12. Investing earns an uncertain return, entered as a yearly compound rate. Assumes the debt is large enough to absorb every extra payment, and ignores taxes on investment gains (as in a Roth or 401(k))."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var p = num(el, "p"), d = rv(el, "d") / 100, t = rv(el, "t") / 100, i = rv(el, "i") / 100, y = rv(el, "y");
      var dAfter = d * (1 - t), R = S3.fvMonthlyApr(p, dAfter, y), I = S3.fvMonthly(p, i, y);
      self(el, "k").innerHTML = kpi("Repaying earns (after tax)", pct(dAfter * 100, 2), "good") + kpi("Investing hopes to earn", pct(i * 100, 1)) +
        kpi("Value of repaying after " + y + " yrs", money(R)) + kpi("Value of investing", money(I), I > R ? "good" : "");
      var a = [], b = []; for (var k = 0; k <= y; k++) { a.push([k, S3.fvMonthlyApr(p, dAfter, k)]); b.push([k, S3.fvMonthly(p, i, k)]); }
      INV.lineChart(self(el, "c"), { label: "Repay versus invest", height: 230, xTitle: "Years", xFmt: function (v) { return String(Math.round(v)); }, yFmt: ms,
        series: [{ name: "Repay debt (certain)", color: "var(--s2)", data: a }, { name: "Invest (expected, uncertain)", color: "var(--s1)", data: b, dash: "5 4" }] });
      self(el, "n").innerHTML = "The debt's after-tax cost is " + pct(d * 100, 1) + " × (1 − " + pct(t * 100, 0) + ") = <b>" + pct(dAfter * 100, 2) + "</b>. " +
        "Charged monthly (APR ÷ 12), that compounds to " + pct((Math.pow(1 + dAfter / 12, 12) - 1) * 100, 2) + " a year, the certain return on every extra dollar you repay. " +
        (I > R ? "Investing comes out ahead <i>on average</i> by " + money(I - R) + ", but only if the return arrives; a bad decade can reverse it." : "Repaying wins even before counting risk: the certain return is at least as high as the hoped-for one.");
    }
    wire(el, run);
  };

  /* ---------- 6. Credit utilization (INV-021) ---------- */
  TOOLS.s3Utilization = function (el) {
    var u = uid(el);
    var C = [["Everyday card", 3000, 1800], ["Travel card", 5000, 0], ["Store card", 2000, 200]];
    var rows = C.map(function (c, i) {
      return '<div class="fld"><label>' + esc(c[0]) + ': limit and statement balance ($)</label><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">' +
        '<input type="number" aria-label="' + esc(c[0]) + ' credit limit ($)" id="' + u + "-l" + i + '" value="' + c[1] + '" step="100" min="0">' +
        '<input type="number" aria-label="' + esc(c[0]) + ' statement balance ($)" id="' + u + "-b" + i + '" value="' + c[2] + '" step="50" min="0"></div></div>';
    }).join("");
    shell(el, "Credit utilization: what the scoring models see", "Calculator",
      rows + sel(u + "-x", "What if…", [["none", "No change"], ["close", "I close the card with the most unused credit"], ["early", "I pay the everyday card before the statement closes"]], "none") +
      note("Utilization = balances reported ÷ credit limits, usually the statement balance, even if you pay in full afterward. Scores look at each card and at the total."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var cs = C.map(function (c, i) { return { n: c[0], l: num(el, "l" + i), b: num(el, "b" + i) }; });
      var what = self(el, "x").value, msg = "";
      if (what === "close") {
        var best = -1, un = -1; cs.forEach(function (c, i) { if (c.l - c.b > un && c.l > 0) { un = c.l - c.b; best = i; } });
        if (best > -1) { msg = "Closing the " + cs[best].n.toLowerCase() + " removes " + money(cs[best].l) + " of limit" + (cs[best].b > 0 ? "; its " + money(cs[best].b) + " balance still has to be paid, so it stays in the total below" : "") + ". "; cs[best].l = 0; }
      }
      if (what === "early") { msg = "Paying the everyday card down to about 10% of its limit before the statement date lowers the reported balance, with no change in spending. "; cs[0].b = Math.min(cs[0].b, cs[0].l * 0.1); }
      var L = cs.reduce(function (s, c) { return s + c.l; }, 0), B = cs.reduce(function (s, c) { return s + c.b; }, 0);
      var overall = L > 0 ? B / L * 100 : 0, hi = 0; cs.forEach(function (c) { if (c.l > 0) hi = Math.max(hi, c.b / c.l * 100); });
      self(el, "k").innerHTML = kpi("Overall utilization", pct(overall, 0), overall > 30 ? "bad" : overall <= 10 ? "good" : "") + kpi("Highest single card", pct(hi, 0), hi > 30 ? "bad" : "") +
        kpi("Total limits", money(L)) + kpi("Unused credit", money(Math.max(0, L - B)));
      INV.barChart(self(el, "c"), { label: "Utilization by card", height: 220, allLabels: true, valueLabels: true, yFmt: function (v) { return Math.round(v) + "%"; },
        data: cs.map(function (c, i) { return { label: c.n, y: c.l > 0 ? c.b / c.l * 100 : 0, color: ["var(--s1)", "var(--s3)", "var(--s4)"][i], dim: c.l === 0 }; }).concat([{ label: "All cards", y: overall, color: "var(--s5)" }]) });
      self(el, "n").innerHTML = msg + "Overall: " + money(B) + " ÷ " + money(L) + " = <b>" + pct(overall, 0) + "</b>. Utilization has no memory in most scoring models: once balances fall, the score usually recovers with the next report.";
    }
    wire(el, run);
  };

  /* ---------- 7. Employer match and vesting (INV-022) ---------- */
  TOOLS.s3Match = function (el) {
    var u = uid(el);
    shell(el, "Your 401(k) match and vesting", "Calculator",
      numf(u + "-sal", "Salary ($)", 62000, 1000) +
      rng(u + "-c", "You contribute (% of pay)", 0, 25, 0.5, 6, "pct") +
      rng(u + "-mr", "Employer matches (% of your contribution)", 0, 200, 5, 50, "pct") +
      rng(u + "-cap", "…on contributions up to (% of pay)", 0, 10, 0.5, 6, "pct") +
      sel(u + "-v", "Vesting schedule for the match", [["now", "Immediate"], ["cliff3", "3-year cliff"], ["graded6", "Graded: 20% a year, years 2 to 6"]], "graded6") +
      rng(u + "-y", "Years of service so far", 0, 7, 1, 1, "yr") +
      note("Your own contributions are always 100% yours. The 2026 limit on employee deferrals is $24,500 (plus $8,000 catch-up at 50+, or $11,250 at 60–63). Defaults are Maya's plan."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var sal = num(el, "sal"), c = rv(el, "c"), mr = rv(el, "mr"), cap = rv(el, "cap"), y = rv(el, "y"), v = self(el, "v").value;
      var M = S3.match(sal, c, mr, cap, 24500), vs = S3.vested(v, y);
      self(el, "k").innerHTML = kpi("You put in per year", money(M.mine)) + kpi("Employer adds", money(M.match), "good") +
        kpi("Match left on the table", money(M.missed), M.missed > 0.5 ? "bad" : "good") + kpi("Share of match you would keep today", pct(vs * 100, 0), vs < 1 ? "bad" : "good");
      var pts = []; for (var k = 0; k <= 15; k++) pts.push({ label: k + "%", y: S3.match(sal, k, mr, cap, 24500).match, color: k <= c ? "var(--s2)" : "var(--s6)", dim: k > c });
      INV.barChart(self(el, "ch"), { label: "Employer match at each contribution rate", height: 220, allLabels: false, valueLabels: false, xTitle: "Your contribution (% of pay)", yFmt: ms, tipFmt: function (v) { return money(v); }, data: pts });
      self(el, "n").innerHTML = "Match = salary × min(your %, " + pct(cap, 1) + ") × " + pct(mr, 0) + " = <b>" + money(M.match) + "</b> a year. " +
        (M.missed > 0.5 ? "Raising your contribution to " + pct(cap, 1) + " would add " + money(M.missed) + " of employer money each year. " : "You capture the full match. ") +
        (vs < 1 ? "If you left now you would keep " + pct(vs * 100, 0) + " of the matching money under this schedule." : "Under this schedule, all of the match is yours.");
    }
    wire(el, run);
  };

  /* ---------- 8. ESPP discount and lookback (INV-022) ---------- */
  TOOLS.s3Espp = function (el) {
    var u = uid(el);
    shell(el, "Employee stock purchase plan: what the discount is worth", "Calculator",
      numf(u + "-c", "Payroll deductions this offering period ($)", 3000, 100) +
      rng(u + "-d", "Discount", 0, 15, 1, 15, "pct") +
      sel(u + "-l", "Lookback provision?", [["yes", "Yes: lower of start or purchase price"], ["no", "No: purchase-date price only"]], "yes") +
      numf(u + "-p0", "Share price at the start of the period ($)", 40, 0.5) + numf(u + "-p1", "Share price on the purchase date ($)", 46, 0.5) +
      note("Assumes you sell right after purchase at the purchase-date price. Selling that early is a 'disqualifying disposition': the whole spread between the purchase-date price and the price you paid is taxed as ordinary wages. Holding 2 years from the start of the offering and 1 year from purchase changes the tax, not the concentration risk."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c2"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var c = num(el, "c"), d = rv(el, "d") / 100, p0 = num(el, "p0"), p1 = num(el, "p1"), lb = self(el, "l").value === "yes";
      if (!(p1 > 0) || (lb && !(p0 > 0))) {
        self(el, "k").innerHTML = kpi("Your purchase price", "—") + kpi("Shares bought", "—") + kpi("Value at purchase", "—") + kpi("Gain on your money", "—");
        self(el, "c2").innerHTML = ""; self(el, "n").innerHTML = "Enter the share price " + (lb ? "at the start of the period and " : "") + "on the purchase date to see the result.";
        return;
      }
      var base = lb ? Math.min(p0, p1) : p1, price = base * (1 - d), sh = price > 0 ? c / price : 0, val = sh * p1, gain = val - c;
      self(el, "k").innerHTML = kpi("Your purchase price", money(price, 2)) + kpi("Shares bought", sh.toFixed(2)) + kpi("Value at purchase", money(val)) +
        kpi("Gain on your money", pct(c > 0 ? gain / c * 100 : 0, 1), gain > 0 ? "good" : "bad");
      INV.barChart(self(el, "c2"), { label: "Money in versus value at purchase", height: 200, allLabels: true, valueLabels: true, yFmt: ms, tipFmt: function (v) { return money(v); },
        data: [{ label: "Payroll deductions", y: c, color: "var(--s6)" }, { label: "Shares worth", y: val, color: "var(--s2)" }, { label: "Taxed as wages if sold now", y: Math.max(0, gain), color: "var(--s3)" }] });
      self(el, "n").innerHTML = "Price = " + (lb ? "min(" + money(p0, 2) + ", " + money(p1, 2) + ")" : money(p1, 2)) + " × (1 − " + pct(d * 100, 0) + ") = " + money(price, 2) + ". " +
        "Sold at once, the " + money(Math.max(0, gain)) + " gain is ordinary income; the rest of the risk is gone the day you sell.";
    }
    wire(el, run);
  };

  /* ---------- 9. Life insurance need (INV-023) ---------- */
  TOOLS.s3LifeNeed = function (el) {
    var u = uid(el);
    shell(el, "How much life insurance? Three methods", "Calculator",
      numf(u + "-inc", "Income of the person to insure ($/year)", 85000, 1000) +
      rng(u + "-sh", "Share of that income the family would need", 40, 100, 5, 60, "pct") +
      rng(u + "-yr", "Years the family needs support", 0, 30, 1, 18, "yr") +
      numf(u + "-ss", "Expected survivor benefits ($/month, average)", 1500, 100, "From your Social Security statement") +
      numf(u + "-db", "Debts to pay off, including the mortgage ($)", 310000, 1000) +
      numf(u + "-ed", "Education fund for children ($)", 100000, 5000) +
      numf(u + "-fe", "Final expenses ($)", 15000, 1000) +
      numf(u + "-sv", "Savings the family could use ($)", 50000, 1000, "Not retirement accounts") +
      numf(u + "-ex", "Life insurance already in place ($)", 85000, 5000) +
      rng(u + "-r", "Real return on the payout", 0, 5, 0.5, 2, "pct") +
      note("Defaults: Marcus Rivera. Present values discount each year's need at the real (after-inflation) rate. All three methods are estimates; the needs method is the most complete."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var o = { income: num(el, "inc"), share: rv(el, "sh"), years: rv(el, "yr"), ss: num(el, "ss"), debts: num(el, "db"), edu: num(el, "ed"), final: num(el, "fe"), savings: num(el, "sv"), existing: num(el, "ex"), rate: rv(el, "r") };
      var L = S3.lifeNeed(o);
      self(el, "k").innerHTML = kpi("10× income rule of thumb", money(L.rule)) + kpi("Income replacement", money(L.replace)) + kpi("Needs analysis", money(L.needs), "good") + kpi("Already covered", money(o.existing));
      INV.barChart(self(el, "c"), { label: "Additional coverage by method", height: 220, allLabels: true, valueLabels: true, yFmt: ms, tipFmt: function (v) { return money(v); },
        data: [{ label: "10× income", y: L.rule, color: "var(--s6)" }, { label: "Income replacement", y: L.replace, color: "var(--s1)" }, { label: "Needs analysis", y: L.needs, color: "var(--s2)" }] });
      self(el, "n").innerHTML = "Needs = present value of the yearly gap (" + money(o.income * o.share / 100) + " − " + money(o.ss * 12) + " of survivor benefits, for " + o.years + " years at " + pct(o.rate, 1) + ": " + money(L.pvGap) + ") + " +
        money(o.debts) + " debts + " + money(o.edu) + " education + " + money(o.final) + " final expenses − " + money(o.savings) + " savings − " + money(o.existing) + " existing cover = <b>" + money(L.needs) + "</b>.";
    }
    wire(el, run);
  };
})();
