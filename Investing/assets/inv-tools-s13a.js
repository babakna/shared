/* Investing Learning Lab - Stage 13 (Life Events) calculators, part A - V1.2 (September 2026)
   Tools for INV-095 to INV-098. Every figure is computed in the browser from the stated rule.
   Tax year 2026 federal figures: Rev. Proc. 2025-32 (tax rate tables, standard deductions,
   additional standard deduction for age 65+), P.L. 119-21 (senior deduction, 2025-2028;
   child and dependent care credit, 26 U.S.C. 21 as amended; dependent care FSA limit of $7,500,
   IRS Publication 15-B for 2026), 26 U.S.C. 86 (taxation of Social Security benefits),
   CMS 2026 Part B premium and IRMAA tables. Long-term care prices: CareScout 2025 Cost of Care Survey. */
(function () {
  "use strict";
  var INV = window.INV; if (!INV) return;
  var esc = INV.esc, money = INV.money, m0 = function (v) { return INV.money(v, 0); }, ms = INV.moneyShort, pct = INV.pct;
  var TOOLS = INV.tools = INV.tools || {};

  /* ---------- helpers (local copies of the inv-tools.js pattern) ---------- */
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
    return '<div class="fld"><label for="' + id + '">' + esc(label) + '</label><select id="' + id + '">' +
      opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[2] ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select></div>";
  }
  function uid(el) { if (!el.dataset.uid) el.dataset.uid = "t" + Math.random().toString(36).slice(2, 8); return el.dataset.uid; }
  function self(el, id) { return el.querySelector("#" + el.dataset.uid + "-" + id); }
  function num(el, id) { var v = Number(self(el, id).value); return isFinite(v) && v > 0 ? v : 0; }
  function fmtOut(input) {
    var o = input.parentNode.querySelector("output"); if (!o) return;
    var f = input.getAttribute("data-fmt"), v = Number(input.value);
    o.textContent = f === "pct" ? v.toFixed(input.step.indexOf(".") > -1 ? (input.step.split(".")[1].length) : 0) + "%" :
      f === "yr" ? v + (v === 1 ? " year" : " years") : f === "money" ? money(v) : f === "age" ? "age " + v : f === "hrs" ? v + " hours a week" : String(v);
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
  var note = '<p class="hint" style="font-size:.76rem;color:var(--muted)">';

  /* ---------- 2026 federal tax engine (ordinary income only) ---------- */
  var BR = { /* upper bounds of the 10, 12, 22, 24, 32, 35% brackets; 37% above. Rev. Proc. 2025-32, section 4.01 */
    mfj: [24800, 100800, 211400, 403550, 512450, 768700],
    single: [12400, 50400, 105700, 201775, 256225, 640600],
    hoh: [17700, 67450, 105700, 201750, 256200, 640600],
    mfs: [12400, 50400, 105700, 201775, 256225, 384350]
  };
  var RATES = [0.10, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37];
  var STD = { mfj: 32200, single: 16100, hoh: 24150, mfs: 16100 }; /* section 4.14(1) */
  var AGED = { mfj: 1650, mfs: 1650, single: 2050, hoh: 2050 };   /* section 4.14(3), per person age 65+ */
  function taxOn(ti, st) {
    var b = BR[st], t = 0, lo = 0; ti = Math.max(0, ti);
    for (var i = 0; i < RATES.length; i++) { var hi = i < b.length ? b[i] : Infinity; if (ti > lo) t += (Math.min(ti, hi) - lo) * RATES[i]; lo = hi; }
    return t;
  }
  function margRate(ti, st) { if (!(ti > 0)) return 0; var b = BR[st]; for (var i = 0; i < b.length; i++) if (ti <= b[i]) return RATES[i]; return 0.37; }
  /* Taxable part of Social Security, 26 U.S.C. 86 (joint: $32,000 / $44,000; others: $25,000 / $34,000) */
  function ssTaxable(ss, otherAgi, joint) {
    var base = joint ? 32000 : 25000, adj = joint ? 44000 : 34000, pi = otherAgi + ss / 2;
    if (pi <= base) return 0;
    if (pi <= adj) return Math.min(ss / 2, (pi - base) / 2);
    return Math.min(0.85 * ss, 0.85 * (pi - adj) + Math.min(ss / 2, (adj - base) / 2));
  }
  /* Senior deduction, P.L. 119-21 (tax years 2025-2028): $6,000 per person 65+, reduced by 6% of MAGI over $75,000 ($150,000 joint) */
  function seniorDed(nOld, magi, joint) { if (!nOld) return 0; var cut = 0.06 * Math.max(0, magi - (joint ? 150000 : 75000)); return Math.max(0, 6000 - cut) * nOld; }
  /* Retiree return: Social Security plus other ordinary income, standard deduction, age 65+ extras */
  function retireeTax(ss, other, st, nOld) {
    var joint = st === "mfj", taxSS = ssTaxable(ss, other, joint), agi = other + taxSS;
    var ded = STD[st] + AGED[st] * nOld + seniorDed(nOld, agi, joint);
    var ti = Math.max(0, agi - ded);
    return { agi: agi, taxSS: taxSS, ded: ded, ti: ti, tax: taxOn(ti, st), marg: margRate(ti, st) };
  }
  /* 2026 Part B premium with IRMAA (CMS fact sheet); MAGI from the return two years earlier */
  function partB(magi, joint) {
    var s = [[109000, 202.90], [137000, 284.10], [171000, 405.80], [205000, 527.50], [500000, 649.20], [Infinity, 689.90]],
      j = [[218000, 202.90], [274000, 284.10], [342000, 405.80], [410000, 527.50], [750000, 649.20], [Infinity, 689.90]], t = joint ? j : s;
    for (var i = 0; i < t.length; i++) { if (i === t.length - 2 ? magi < t[i][0] : magi <= t[i][0]) return t[i][1]; }
    return 689.90;
  }
  /* Child and dependent care credit rate, 26 U.S.C. 21(a)(2) as amended by P.L. 119-21, tax years after 2025 */
  function careRate(agi, joint) {
    var r = 50;
    if (agi > 15000) r = Math.max(35, 50 - Math.ceil((agi - 15000) / 2000));
    var t2 = joint ? 150000 : 75000, step = joint ? 4000 : 2000;
    if (agi > t2) r = Math.max(20, r - Math.ceil((agi - t2) / step));
    return r / 100;
  }
  INV.s13a = { taxOn: taxOn, margRate: margRate, ssTaxable: ssTaxable, seniorDed: seniorDed, retireeTax: retireeTax, partB: partB, careRate: careRate, STD: STD, BR: BR };

  /* ---------- 1. Marriage penalty or bonus (INV-095) ---------- */
  TOOLS.s13aMarriage = function (el) {
    var u = uid(el);
    shell(el, "Marriage penalty or bonus, 2026 federal income tax", "Calculator",
      numf(u + "-a", "Partner A's income ($)", 62000, 1000) + numf(u + "-b", "Partner B's income ($)", 62000, 1000) +
      sel(u + "-s", "Partner A files today as", [["single", "Single", true], ["hoh", "Head of household (has a qualifying child)"]]) +
      note + "Wages or other ordinary income, standard deduction, 2026 brackets and deductions from IRS Rev. Proc. 2025-32. Ignores credits, capital gains, state tax and other thresholds that also differ by filing status.</p>",
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var a = num(el, "a"), b = num(el, "b"), sa = self(el, "s").value;
      var tA = taxOn(a - STD[sa], sa), tB = taxOn(b - STD.single, "single"), apart = tA + tB, tot = a + b;
      var joint = taxOn(tot - STD.mfj, "mfj"), diff = joint - apart;
      self(el, "k").innerHTML = kpi("Tax filing separately as unmarried", m0(apart)) + kpi("Tax married filing jointly", m0(joint)) +
        kpi(diff > 0.5 ? "Marriage penalty" : diff < -0.5 ? "Marriage bonus" : "Difference", m0(Math.abs(diff)), diff > 0.5 ? "bad" : diff < -0.5 ? "good" : "") +
        kpi("Joint marginal rate", Math.round(margRate(tot - STD.mfj, "mfj") * 100) + "%");
      var data = [];
      for (var k = 0; k <= 100; k += 10) {
        var xa = tot * k / 100, xb = tot - xa, sep = taxOn(xa - STD[sa], sa) + taxOn(xb - STD.single, "single");
        data.push({ label: k + "%", tip: "Partner A earns " + k + "% of " + money(tot), y: joint - sep, color: joint - sep > 0.5 ? "var(--s5)" : "var(--s2)" });
      }
      INV.barChart(self(el, "c"), { label: "Penalty or bonus by how income is split", height: 220, allLabels: true, xTitle: "Partner A's share of the couple's " + money(tot),
        yFmt: function (v) { return ms(v); }, tipFmt: function (v) { return (v > 0.5 ? "Penalty " : v < -0.5 ? "Bonus " : "") + money(Math.abs(v)); }, data: data });
      self(el, "n").innerHTML = "Same " + money(tot) + " of household income in every bar; only the split changes. Bars above zero are a penalty (marrying raises the tax), below zero a bonus. " +
        (sa === "hoh" ? "Because partner A gives up head-of-household status, the joint return can cost more even when incomes are equal." :
          "For 2026, the joint brackets are exactly twice the single brackets up to the 35% bracket, so two unmarried single filers with equal incomes pay the same as one joint return unless income reaches the top bracket.");
    }
    wire(el, run);
  };

  /* ---------- 2. College savings target (INV-096) ---------- */
  TOOLS.s13aCollege = function (el) {
    var u = uid(el);
    shell(el, "How much to save for one child's college", "Calculator",
      rng(u + "-age", "Child's age today", 0, 17, 1, 7, "age") +
      numf(u + "-cost", "One year of college in today's dollars ($)", 25850, 500, "College Board 2025-26 averages: public four-year in-state tuition, fees, housing and food $25,850; private nonprofit $60,920") +
      rng(u + "-cov", "Share you aim to cover from savings", 10, 100, 5, 50, "pct") +
      numf(u + "-have", "Already saved for this child ($)", 0, 500) +
      rng(u + "-inf", "College price growth per year", 0, 6, 0.5, 3, "pct") +
      rng(u + "-r", "Investment return per year", 0, 10, 0.5, 6, "pct"),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var age = Number(self(el, "age").value), cost = num(el, "cost"), cov = Number(self(el, "cov").value) / 100, have = num(el, "have"),
        inf = Number(self(el, "inf").value) / 100, r = Number(self(el, "r").value) / 100;
      var n = Math.max(1, 18 - age), need = 0;
      for (var y = 0; y < 4; y++) need += cost * cov * Math.pow(1 + inf, n + y) / Math.pow(1 + r, y); /* value at the first college year */
      var rm = Math.pow(1 + r, 1 / 12) - 1, m = n * 12, fvHave = have * Math.pow(1 + r, n);
      var gap = Math.max(0, need - fvHave), fac = rm > 0 ? (Math.pow(1 + rm, m) - 1) / rm : m, monthly = gap / fac;
      var pts = [[age, have]], bal = have, cont = [[age, have]], put = have;
      for (var k = 1; k <= m; k++) { bal = bal * (1 + rm) + monthly; put += monthly; if (k % 12 === 0) { pts.push([age + k / 12, bal]); cont.push([age + k / 12, put]); } }
      var totalCost = 0; for (var y2 = 0; y2 < 4; y2++) totalCost += cost * Math.pow(1 + inf, n + y2);
      self(el, "k").innerHTML = kpi("Four years, full price, future dollars", m0(totalCost)) + kpi("Savings needed at 18", m0(need)) +
        kpi("Monthly saving needed", m0(monthly), "good") + kpi("Years to save", String(n));
      INV.lineChart(self(el, "c"), { label: "College fund balance", height: 250, xTitle: "Child's age", yFmt: ms, xFmt: function (v) { return String(Math.round(v)); },
        series: [{ name: "Fund balance", color: "var(--s2)", data: pts, area: true }, { name: "Money you put in", color: "var(--s3)", data: cont, dash: "5 4" }] });
      self(el, "n").innerHTML = (gap > 0 ? "Saving " + money(monthly) + " a month from age " + age + " to 18 builds the " + money(need) :
          "The " + money(have) + " already saved, invested at " + pct(r * 100, 1) + " a year, grows to about " + money(fvHave) + " by 18 and already covers the " + money(need)) +
        " needed to pay " + Math.round(cov * 100) + "% of four years of costs, with the unspent balance still invested during college. Grants, scholarships, income during college and loans cover the rest. Assumptions are yours; results are not predictions.";
    }
    wire(el, run);
  };

  /* ---------- 3. Dependent care FSA versus the care credit (INV-096, INV-097) ---------- */
  TOOLS.s13aCare = function (el) {
    var u = uid(el);
    shell(el, "Dependent care FSA or the child and dependent care credit? (2026)", "Calculator",
      numf(u + "-e", "Work-related care costs this year ($)", 12000, 500) +
      sel(u + "-q", "Qualifying persons (children under 13, or a dependent who cannot care for themselves)", [["1", "One"], ["2", "Two or more", true]]) +
      numf(u + "-agi", "Adjusted gross income ($)", 145000, 1000) +
      sel(u + "-j", "Filing status", [["mfj", "Married filing jointly", true], ["single", "Single or head of household"]]) +
      rng(u + "-m", "Your federal marginal tax rate", 10, 37, 1, 22, "pct") +
      rng(u + "-st", "State income tax rate (enter yours)", 0, 10, 0.1, 0, "pct") +
      note + "FSA limit $7,500 a household for 2026 (IRS Publication 15-B). Credit: 26 U.S.C. 21 as amended by P.L. 119-21, on up to $3,000 of costs for one person or $6,000 for two or more, reduced dollar for dollar by FSA money. FSA money also avoids the 7.65% payroll tax (below the Social Security wage base). The credit is nonrefundable: it cannot exceed your income tax.</p>",
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var e = num(el, "e"), q = Number(self(el, "q").value), agi = num(el, "agi"), joint = self(el, "j").value === "mfj",
        mr = Number(self(el, "m").value) / 100, sr = Number(self(el, "st").value) / 100;
      var cap = q >= 2 ? 6000 : 3000, rate = careRate(agi, joint), fsaRate = mr + sr + 0.0765;
      function combo(f) { f = Math.min(f, 7500, e); var credBase = Math.max(0, Math.min(e - f, cap - f)); return { fsa: f, save: f * fsaRate, cred: credBase * rate, total: f * fsaRate + credBase * rate }; }
      var c0 = combo(0), cF = combo(7500), best = c0.total >= cF.total ? c0 : cF;
      self(el, "k").innerHTML = kpi("Credit rate at this income", Math.round(rate * 100) + "%") + kpi("Credit only", m0(c0.total)) +
        kpi("FSA (" + m0(cF.fsa) + ") plus any credit", m0(cF.total)) + kpi("Better choice", best === cF ? "FSA" : "Credit", "good");
      INV.barChart(self(el, "c"), { label: "Tax saved by each approach", height: 210, allLabels: true, valueLabels: true, yFmt: function (v) { return money(v, 0); },
        data: [{ label: "Credit only", y: c0.total, color: "var(--s3)" }, { label: "FSA tax savings", y: cF.save, color: "var(--s2)" }, { label: "Credit on top of FSA", y: cF.cred, color: "var(--s6)" }, { label: "FSA route total", y: cF.total, color: "var(--s1)" }] });
      self(el, "n").innerHTML = "Each FSA dollar escapes tax at about " + pct(fsaRate * 100, 1) + " (federal, state and payroll), while each credit-eligible dollar is worth " + Math.round(rate * 100) +
        "%. Because FSA money reduces the costs that can count for the credit, " + (cF.cred > 0 ? "some credit remains alongside the FSA here." : "the FSA route leaves no room for the credit here.") + " Check your plan's rules and the credit's earned-income limits before choosing.";
    }
    wire(el, run);
  };

  /* ---------- 4. Long-term care cost runway (INV-097) ---------- */
  TOOLS.s13aCareCost = function (el) {
    var u = uid(el);
    var PRICE = { home: 35 * 52, al: 74400, nh: 129575, nhs: 114975 };
    shell(el, "What paid care costs, and how long savings last", "Calculator",
      sel(u + "-t", "Type of care", [["home", "Paid caregiver at home (hourly)", true], ["al", "Assisted living community"], ["nhs", "Nursing home, semi-private room"], ["nh", "Nursing home, private room"]]) +
      '<div class="fld" data-h>' + rng(u + "-h", "Hours of paid help", 5, 168, 1, 30, "hrs").replace('<div class="fld">', "").replace(/<\/div>$/, "") + "</div>" +
      numf(u + "-sv", "Savings available for care ($)", 250000, 5000) +
      numf(u + "-in", "Income available for care, per year ($)", 24000, 1000, "Social Security, pension or other income left after other bills") +
      rng(u + "-g", "Care price growth per year", 0, 8, 0.5, 3, "pct") +
      note + "Starting prices are 2025 national medians from the CareScout Cost of Care Survey (March 2026): $35 an hour for a non-medical caregiver at home, $74,400 a year for assisted living, $114,975 for a semi-private and $129,575 for a private nursing home room. Local prices vary widely. Savings are assumed to earn nothing after inflation.</p>",
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var t = self(el, "t").value, h = Number(self(el, "h").value), sv = num(el, "sv"), inc = num(el, "in"), g = Number(self(el, "g").value) / 100;
      el.querySelector("[data-h]").hidden = t !== "home";
      var c0 = t === "home" ? PRICE.home * h : PRICE[t], bal = sv, yrs = 0, pts = [[0, sv]], done = false, frac = 0;
      for (var y = 1; y <= 30; y++) {
        var cost = c0 * Math.pow(1 + g, y - 1), gap = Math.max(0, cost - inc);
        if (!done) { if (gap > bal) { frac = gap > 0 ? bal / gap : 0; yrs = y - 1 + frac; bal = 0; done = true; } else { bal -= gap; yrs = y; } }
        pts.push([y, bal]);
      }
      var gap1 = Math.max(0, c0 - inc);
      self(el, "k").innerHTML = kpi("First-year cost", m0(c0)) + kpi("Paid from savings, year 1", m0(gap1), gap1 > 0 ? "bad" : "good") + kpi("Monthly shortfall", m0(gap1 / 12)) +
        kpi("Savings last", done ? yrs.toFixed(1) + " years" : "30+ years", done ? "bad" : "good");
      INV.lineChart(self(el, "c"), { label: "Savings remaining", height: 230, xTitle: "Years of care", yFmt: ms, xFmt: function (v) { return String(Math.round(v)); },
        series: [{ name: "Savings left", color: "var(--s5)", data: pts, area: true }] });
      self(el, "n").innerHTML = (t === "home" ? h + " hours a week at $35 an hour is " : "This setting costs ") + money(c0) + " in the first year. " +
        (done ? "With " + money(inc) + " a year of income toward care, " + money(sv) + " of savings runs out after about " + yrs.toFixed(1) + " years. Medicare does not pay for this kind of long-term custodial care; Medicaid may, once savings are spent down to your state's limit." :
          "At these inputs, income and savings together cover more than 30 years of care.");
    }
    wire(el, run);
  };

  /* ---------- 5. Can I claim my parent? (INV-097) ---------- */
  TOOLS.s13aDependent = function (el) {
    var u = uid(el);
    shell(el, "Can I claim my parent as a dependent? (2026)", "Checklist",
      numf(u + "-gi", "Parent's taxable gross income for the year ($)", 3000, 100, "Do not count tax-exempt income, such as Social Security benefits that are not taxable to the parent") +
      numf(u + "-tot", "Total cost of the parent's support for the year ($)", 30000, 500) +
      numf(u + "-you", "Support you provided ($)", 18000, 500) +
      sel(u + "-fs", "Your filing status if not claiming", [["single", "Single", true], ["mfj", "Married filing jointly"]]) +
      sel(u + "-home", "Did you pay more than half the cost of the parent's main home all year (theirs, yours, or a care facility)?", [["y", "Yes", true], ["n", "No"]]) +
      note + "Qualifying relative tests, 26 U.S.C. 152(d): relationship (a parent qualifies without living with you), gross income under $5,300 for 2026 (Rev. Proc. 2025-32), and more than half of total support. The parent also cannot be anyone's qualifying child, and a married parent generally cannot file a joint return. A multiple support agreement (Form 2120) can help when siblings share support.</p>",
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var gi = num(el, "gi"), tot = num(el, "tot"), you = num(el, "you"), fs = self(el, "fs").value, home = self(el, "home").value === "y";
      var badSup = you > tot, incOk = gi < 5300, supOk = tot > 0 && you > tot / 2 && !badSup, share = tot > 0 ? you / tot * 100 : 0, ok = incOk && supOk;
      var hoh = ok && fs === "single" && home;
      self(el, "k").innerHTML = kpi("Gross income test", incOk ? "Passes" : "Fails", incOk ? "good" : "bad") + kpi("Your share of support", pct(share, 0), supOk ? "good" : "bad") +
        kpi("Dependent?", ok ? "Likely yes" : "No", ok ? "good" : "bad") + kpi("Credit for other dependents", ok ? "$500" : "$0");
      INV.barChart(self(el, "c"), { label: "Support test", height: 190, allLabels: true, valueLabels: true, yFmt: function (v) { return money(v, 0); },
        data: [{ label: "You provided", y: you, color: supOk ? "var(--s2)" : "var(--s5)" }, { label: "Half of total support", y: tot / 2, color: "var(--s6)" }, { label: "Parent's gross income", y: gi, color: incOk ? "var(--s1)" : "var(--s5)" }, { label: "Income limit", y: 5300, color: "var(--s6)" }] });
      self(el, "n").innerHTML = ok ? "The parent appears to be your qualifying relative, which can bring the $500 credit for other dependents (subject to income limits)" + (hoh ? " and, because you are unmarried and paid more than half the cost of the parent's main home, head-of-household filing status, with its larger standard deduction ($24,150 versus $16,100 for 2026) and wider brackets." : ".") +
        " You may also count the parent's medical costs you paid if you itemize." :
        (!incOk ? "The parent's taxable gross income is at or above $5,300, so they cannot be your dependent this year. " : "") + (badSup ? "The support you provided cannot be more than the parent's total support; enter the total from every source, including the parent's own money." : !supOk ? "You provided half or less of their total support. If siblings together provide more than half, a multiple support agreement can let one of you claim the parent." : "");
    }
    wire(el, run);
  };

  /* ---------- 6. The widow's tax squeeze (INV-098) ---------- */
  TOOLS.s13aWidow = function (el) {
    var u = uid(el);
    shell(el, "Before and after: taxes when a spouse dies (2026 rules)", "Calculator",
      numf(u + "-ss2", "Social Security while both were alive, per year ($)", 55800, 500) +
      numf(u + "-ss1", "Social Security for the survivor alone, per year ($)", 34800, 500, "The survivor keeps the larger of the two benefits") +
      numf(u + "-ira", "IRA withdrawals, pension and other taxable income ($)", 36000, 1000) +
      numf(u + "-int", "Interest and dividends ($)", 2400, 100) +
      sel(u + "-old", "Ages", [["2", "Both 65 or older", true], ["0", "Under 65"]]) +
      note + "Federal income tax only. Brackets, standard deductions and the extra deduction for age 65+ from Rev. Proc. 2025-32; senior deduction of $6,000 per person 65+ (2025-2028) from P.L. 119-21; taxable Social Security from 26 U.S.C. 86. Part B premiums from the 2026 CMS tables. Assumes the survivor does not qualify as a qualifying surviving spouse (no dependent child).</p>",
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var ss2 = num(el, "ss2"), ss1 = num(el, "ss1"), ira = num(el, "ira"), it = num(el, "int"), old = Number(self(el, "old").value) > 0;
      var other = ira + it;
      var before = retireeTax(ss2, other, "mfj", old ? 2 : 0), after = retireeTax(ss1, other, "single", old ? 1 : 0), sameJoint = retireeTax(ss1, other, "mfj", old ? 2 : 0);
      var incB = ss2 + other, incA = ss1 + other;
      var pA = old ? partB(after.agi, false) * 12 : 0;
      self(el, "k").innerHTML = kpi("Tax as a couple", m0(before.tax)) + kpi("Tax as a survivor", m0(after.tax), after.tax > before.tax ? "bad" : "") +
        kpi("Income change", pct(incB ? (incA / incB - 1) * 100 : 0, 0)) + kpi("Tax change", before.tax > 0 ? (after.tax > before.tax ? "+" : "") + pct((after.tax / before.tax - 1) * 100, 0) : (after.tax > 0 ? "+" + m0(after.tax) : "$0"), after.tax > before.tax ? "bad" : "good") +
        kpi("Survivor's marginal rate", Math.round(after.marg * 100) + "%");
      INV.barChart(self(el, "c"), { label: "Income and tax before and after", height: 220, allLabels: true, valueLabels: true, yFmt: function (v) { return ms(v); }, tipFmt: function (v) { return money(v); },
        data: [{ label: "Income, couple", y: incB, color: "var(--s1)" }, { label: "Income, survivor", y: incA, color: "var(--s1)", dim: true }, { label: "Tax, couple", y: before.tax, color: "var(--s5)" },
          { label: "Tax, survivor", y: after.tax, color: "var(--s5)", dim: true }, { label: "Survivor's tax if joint", y: sameJoint.tax, color: "var(--s6)" }] });
      var incDrop = incB ? 1 - incA / incB : 0, taxDrop = before.tax > 0 ? 1 - after.tax / before.tax : 0;
      self(el, "n").innerHTML = "The household's income " + (incDrop >= 0 ? "falls " : "rises ") + pct(Math.abs(incDrop) * 100, 0) + (Math.abs(after.tax - before.tax) < 0.5 ? ", and tax stays at " + money(after.tax) : (after.tax > before.tax ? ", but tax rises" : taxDrop < incDrop ? ", but tax falls only" : ", and tax falls") + " from " + money(before.tax) + " to " + money(after.tax)) +
        ". On the very same survivor income, a joint return would owe " + money(sameJoint.tax) + ": the single brackets, the smaller standard deduction and the lower Social Security thresholds explain the difference of " + money(after.tax - sameJoint.tax) + ". " +
        (old ? "Medicare Part B for 2026: " + money(pA / 12, 2) + " a month for the survivor on this income (" + (partB(after.agi, false) > 202.9 ? "includes an income-related surcharge" : "standard premium") + "). IRMAA uses the tax return from two years earlier; the death of a spouse is a life-changing event you can report on Form SSA-44." : "");
    }
    wire(el, run);
  };
})();
