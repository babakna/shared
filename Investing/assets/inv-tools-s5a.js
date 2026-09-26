/* Investing Learning Lab - Stage 5 (Taxes) calculators, INV-029 to INV-035 - V1.1 (September 2026)
   Every 2026 figure below is taken from IRS Rev. Proc. 2025-32 (tax year 2026 inflation adjustments,
   reflecting Public Law 119-21), IRS Notice 2025-67 (2026 retirement plan limits), IRS Rev. Proc. 2025-19
   (2026 HSA limits), the Internal Revenue Code as amended by P.L. 119-21, and SSA (2026 wage base).
   These are simplified educational models: they ignore the AMT, state tax (except where stated),
   phase-outs not listed, and many special cases. */
(function () {
  "use strict";
  var INV = window.INV; if (!INV) return;
  var esc = INV.esc, money = INV.money, ms = INV.moneyShort, pct = INV.pct;
  var TOOLS = INV.tools = INV.tools || {};

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
  function self(el, id) { return el.querySelector("#" + el.dataset.uid + "-" + id); }
  function uid(el) { if (!el.dataset.uid) el.dataset.uid = "s5" + Math.random().toString(36).slice(2, 8); return el.dataset.uid; }
  function sel(id, label, opts, val) {
    return '<div class="fld"><label for="' + id + '">' + esc(label) + '</label><select id="' + id + '">' + opts.map(function (o) {
      return '<option value="' + o[0] + '"' + (o[0] === val ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select></div>";
  }
  function note(t) { return '<p class="hint" style="font-size:.76rem;color:var(--muted)">' + t + "</p>"; }
  function fmtOut(input) {
    var o = input.parentNode.querySelector("output"); if (!o) return;
    var f = input.getAttribute("data-fmt"), v = Number(input.value);
    o.textContent = f === "pct" ? v.toFixed(input.step.indexOf(".") > -1 ? (input.step.split(".")[1].length) : 0) + "%" :
      f === "yr" ? v + (v === 1 ? " year" : " years") : f === "money" ? money(v) : f === "age" ? "age " + v : String(v);
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
  function val(el, id) { return self(el, id).value; }
  function yr(v) { return String(Math.round(v)); }
  function m0(v, dp) { return money(v, dp == null ? 0 : dp); }
  function p0(v) { return pct(isFinite(v) ? v : 0, 0); }
  function p1(v) { return pct(isFinite(v) ? v : 0, 1); }

  /* ---------- 2026 federal parameters (Rev. Proc. 2025-32) ---------- */
  var Y = {
    br: { single: [[12400, 10], [50400, 12], [105700, 22], [201775, 24], [256225, 32], [640600, 35], [1e15, 37]],
          mfj: [[24800, 10], [100800, 12], [211400, 22], [403550, 24], [512450, 32], [768700, 35], [1e15, 37]],
          hoh: [[17700, 10], [67450, 12], [105700, 22], [201750, 24], [256200, 32], [640600, 35], [1e15, 37]] },
    sd: { single: 16100, mfj: 32200, hoh: 24150 },
    aged: { single: 2050, mfj: 1650, hoh: 2050 },
    cg0: { single: 49450, mfj: 98900, hoh: 66200 },
    cg15: { single: 545500, mfj: 613700, hoh: 579600 },
    niit: { single: 200000, mfj: 250000, hoh: 200000 },
    addMed: { single: 200000, mfj: 250000, hoh: 200000 },
    ctc: 2200, ctcRef: 1700, odc: 500, ctcPh: { single: 200000, mfj: 400000, hoh: 200000 },
    senior: 6000, seniorPh: { single: 75000, mfj: 150000, hoh: 75000 },
    ssBase: 184500
  };
  var STATUS = [["single", "Single"], ["mfj", "Married filing jointly"], ["hoh", "Head of household"]];

  function ordTax(ti, st) {
    var t = 0, lo = 0, b = Y.br[st];
    for (var i = 0; i < b.length; i++) { var hi = b[i][0]; if (ti > lo) t += (Math.min(ti, hi) - lo) * b[i][1] / 100; lo = hi; }
    return t;
  }
  function slices(ti, st) {
    var out = [], lo = 0, b = Y.br[st];
    for (var i = 0; i < b.length; i++) { var hi = b[i][0], amt = Math.max(0, Math.min(ti, hi) - lo); out.push({ rate: b[i][1], lo: lo, hi: hi, amt: amt, tax: amt * b[i][1] / 100 }); lo = hi; }
    return out;
  }
  function margOrd(ti, st) { var b = Y.br[st]; for (var i = 0; i < b.length; i++) if (ti < b[i][0]) return b[i][1]; return 37; }
  /* tax on taxable income ti of which pref (qualified dividends + net long-term gain) gets 0/15/20% rates */
  function prefSplit(ti, pref, st) {
    pref = Math.max(0, Math.min(pref, ti)); var ord = ti - pref;
    var at0 = Math.max(0, Math.min(ti, Y.cg0[st]) - ord);
    var at15 = Math.max(0, Math.min(ti, Y.cg15[st]) - Math.max(ord, Y.cg0[st]));
    var at20 = Math.max(0, pref - at0 - at15);
    return { ord: ord, at0: at0, at15: at15, at20: at20, tax: ordTax(ord, st) + at15 * 0.15 + at20 * 0.2 };
  }
  function fed(o) {
    var st = o.st, gross = o.wages + o.other + o.stcg + o.ltcg;
    var agi = Math.max(0, gross - o.pretax - o.adj);
    var std = Y.sd[st] + (o.aged || 0) * Y.aged[st];
    var ded = Math.max(std, o.itemized || 0);
    /* 26 U.S.C. 151(d)(5)(C)(iii): each qualified individual's $6,000 is reduced by 6% of MAGI above the threshold */
    var sen = (o.aged || 0) * Math.max(0, Y.senior - 0.06 * Math.max(0, agi - Y.seniorPh[st]));
    var taxable = Math.max(0, agi - ded - sen);
    var ps = prefSplit(taxable, o.ltcg, st);
    var ctcMax = o.kids * Y.ctc + (o.deps || 0) * Y.odc;
    var over = Math.max(0, agi - Y.ctcPh[st]), red = Math.ceil(over / 1000) * 50;
    var ctc = Math.max(0, ctcMax - red);
    var nonref = Math.min(ctc, ps.tax);
    var childPart = Math.max(0, Math.min(ctc, o.kids * Y.ctc) - nonref);
    var refund = Math.min(childPart, o.kids * Y.ctcRef, 0.15 * Math.max(0, o.wages - 2500));
    var niit = 0.038 * Math.max(0, Math.min(o.other + o.stcg + o.ltcg, agi - Y.niit[st]));
    var w1 = o.wages1 != null ? o.wages1 : o.wages, w2 = o.wages - w1;
    var ss = 0.062 * (Math.min(w1, Y.ssBase) + Math.min(Math.max(0, w2), Y.ssBase));
    var med = 0.0145 * o.wages + 0.009 * Math.max(0, o.wages - Y.addMed[st]);
    var incomeTax = ps.tax - nonref - refund + niit;
    return { gross: gross, agi: agi, ded: ded, sen: sen, taxable: taxable, split: ps, before: ps.tax, credits: nonref + refund, ctc: ctc, niit: niit,
      incomeTax: incomeTax, ss: ss, med: med, payroll: ss + med, marg: margOrd(ps.ord, st) };
  }
  INV.s5aEngine = { Y: Y, ordTax: ordTax, prefSplit: prefSplit, fed: fed, slices: slices };

  /* ---------- 1. Federal income tax calculator, 2026 (INV-029) ---------- */
  TOOLS.s5aTax = function (el) {
    var u = uid(el);
    shell(el, "2026 federal income tax, step by step", "Calculator · tax year 2026",
      sel(u + "-st", "Filing status", STATUS, "single") +
      numf(u + "-w", "Wages and salary, whole household ($)", 62000, 1000) +
      numf(u + "-pt", "Pre-tax 401(k)/403(b)/457 and HSA payroll contributions ($)", 3720, 100) +
      numf(u + "-adj", "Other adjustments, e.g. student loan interest, deductible IRA ($)", 1900, 100) +
      numf(u + "-o", "Interest and other ordinary income ($)", 0, 100) +
      numf(u + "-q", "Qualified dividends and long-term capital gains ($)", 0, 100) +
      rng(u + "-k", "Children under 17 (child tax credit)", 0, 5, 1, 0) +
      rng(u + "-a", "People on the return aged 65 or older", 0, 2, 1, 0) +
      numf(u + "-it", "Itemized deductions (leave 0 to take the standard deduction) ($)", 0, 500) +
      note("2026 brackets, standard deductions, child tax credit ($2,200; up to $1,700 refundable) and the $6,000 senior deduction (2025–2028) are from IRS Rev. Proc. 2025-32 and P.L. 119-21. Payroll tax shows the employee share only and assumes one earner unless married. Ignores the AMT, other credits and state tax."),
      '<div class="kpis" id="' + u + '-kp"></div><div id="' + u + '-ch"></div><div id="' + u + '-tb"></div><p class="tool-note" id="' + u + '-nt"></p>');
    function run() {
      var st = val(el, "st"), w = num(el, "w");
      var r = fed({ st: st, wages: w, wages1: st === "mfj" ? w * 0.5 : w, other: num(el, "o"), stcg: 0, ltcg: num(el, "q"), pretax: Math.min(num(el, "pt"), w), adj: num(el, "adj"),
        kids: Number(val(el, "k")), aged: st === "mfj" ? Number(val(el, "a")) : Math.min(1, Number(val(el, "a"))), itemized: num(el, "it") });
      var eff = r.gross > 0 ? Math.max(0, r.incomeTax) / r.gross * 100 : 0;
      self(el, "kp").innerHTML = kpi("Adjusted gross income", m0(r.agi)) + kpi("Deductions taken", m0(r.ded + r.sen)) + kpi("Taxable income", m0(r.taxable)) +
        kpi("Federal income tax", m0(r.incomeTax), r.incomeTax < 0 ? "good" : "") + kpi("Top marginal rate", r.marg + "%") + kpi("Effective rate on gross income", p1(eff)) +
        kpi("Payroll tax (your share)", m0(r.payroll));
      var s = slices(r.split.ord, st).filter(function (x, i) { return x.amt > 0 || i === 0; });
      var data = s.map(function (x) { return { label: x.rate + "%", tip: "Taxable income in the " + x.rate + "% bracket", y: x.amt, color: "var(--s1)" }; });
      if (r.split.at0 + r.split.at15 + r.split.at20 > 0) {
        [["0%", r.split.at0], ["15%", r.split.at15], ["20%", r.split.at20]].forEach(function (g) { if (g[1] > 0) data.push({ label: "LTCG " + g[0], tip: "Qualified dividends and long-term gains taxed at " + g[0], y: g[1], color: "var(--s2)" }); });
      }
      INV.barChart(self(el, "ch"), { label: "Taxable income in each bracket", height: 230, allLabels: true, valueLabels: true, yFmt: ms, tipFmt: function (v) { return m0(v); }, xTitle: "Rate applied to that slice of taxable income", data: data });
      var rows = s.map(function (x) { return "<tr><td>" + x.rate + "%</td><td class=\"r\">" + m0(x.lo, 0) + " – " + (x.hi > 1e14 ? "and up" : m0(x.hi, 0)) + "</td><td class=\"r\">" + m0(x.amt) + "</td><td class=\"r\">" + m0(x.tax) + "</td></tr>"; }).join("");
      self(el, "tb").innerHTML = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Rate</th><th class="r">Bracket (2026)</th><th class="r">Your income in it</th><th class="r">Tax</th></tr></thead><tbody>' + rows + "</tbody></table></div>";
      self(el, "nt").innerHTML = "Gross income " + m0(r.gross) + " − pre-tax contributions and adjustments = AGI " + m0(r.agi) + ". AGI − " + (r.ded > Y.sd[st] + 1 && num(el, "it") >= r.ded ? "itemized" : "standard") + " deduction " + m0(r.ded) +
        (r.sen > 0 ? " − senior deduction " + m0(r.sen) : "") + " = taxable income " + m0(r.taxable) + ". Tax before credits " + m0(r.before) + (r.credits > 0 ? ", minus " + m0(r.credits) + " of child and dependent credits" : "") +
        (r.niit > 0 ? ", plus " + m0(r.niit) + " of net investment income tax" : "") + ". Only the income above each threshold is taxed at the higher rate, so the effective rate (" + p1(eff) + ") is far below the top marginal rate (" + r.marg + "%).";
    }
    wire(el, run);
  };

  /* ---------- 2. Capital gains tax calculator, 2026 (INV-030) ---------- */
  TOOLS.s5aCapGains = function (el) {
    var u = uid(el);
    shell(el, "What will this sale cost in federal tax? (2026)", "Calculator · tax year 2026",
      sel(u + "-st", "Filing status", STATUS, "mfj") +
      numf(u + "-ti", "Taxable ordinary income before the sale, after deductions ($)", 170800, 1000, "Wages, interest and so on, minus the standard or itemized deduction.") +
      numf(u + "-lt", "Long-term gains and qualified dividends ($)", 61800, 500) +
      numf(u + "-sg", "Short-term gains ($)", 0, 500) +
      note("0%/15%/20% thresholds for 2026 from Rev. Proc. 2025-32. The 3.8% net investment income tax uses the fixed $200,000 / $250,000 thresholds; modified AGI is approximated as taxable income plus the 2026 standard deduction. Ignores state tax, the AMT and the 25%/28% rates for real estate depreciation and collectibles."),
      '<div class="kpis" id="' + u + '-kp"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-nt"></p>');
    function run() {
      var st = val(el, "st"), ti = num(el, "ti"), lt = num(el, "lt"), sg = num(el, "sg");
      var base = prefSplit(ti, 0, st).tax;
      var withS = ti + sg + lt, after = prefSplit(withS, lt, st);
      var magi = withS + Y.sd[st], niit = 0.038 * Math.max(0, Math.min(lt + sg, magi - Y.niit[st]));
            var inc = after.tax - base + niit;
      var allShort = prefSplit(withS, 0, st).tax - base + niit;
      var tot = lt + sg;
      self(el, "kp").innerHTML = kpi("Extra federal tax from the gains", m0(inc)) + kpi("Of which NIIT (3.8%)", m0(niit)) +
        kpi("Average rate on the gains", p1(tot > 0 ? inc / tot * 100 : 0)) + kpi("If all of it were short-term", m0(allShort), "bad") + kpi("Saved by holding over a year", m0(Math.max(0, allShort - inc)), "good");
      var sOrdBefore = Math.max(0, ti + sg), stTax = prefSplit(ti + sg, 0, st).tax - base;
      INV.barChart(self(el, "ch"), { label: "How the gains are taxed", height: 230, allLabels: true, valueLabels: true, yFmt: ms, tipFmt: function (v) { return m0(v); },
        data: [{ label: "LTCG at 0%", y: after.at0, color: "var(--s2)" }, { label: "LTCG at 15%", y: after.at15, color: "var(--s3)" }, { label: "LTCG at 20%", y: after.at20, color: "var(--s5)" },
          { label: "Short-term", tip: "Short-term gains, taxed as ordinary income", y: sg, color: "var(--s4)" }] });
      self(el, "nt").innerHTML = "Gains are stacked <i>on top of</i> ordinary income. With " + m0(sOrdBefore) + " of ordinary taxable income" + (sg > 0 ? " (including the short-term gains)" : "") + ", " + m0(after.at0) + " of long-term gain fits under the 0% ceiling (" + m0(Y.cg0[st]) + "), " +
        m0(after.at15) + " is taxed at 15% and " + m0(after.at20) + " at 20%. Short-term gains add " + m0(stTax) + " at ordinary rates. " +
        (niit > 0 ? "Modified AGI of about " + m0(magi) + " exceeds the " + m0(Y.niit[st]) + " NIIT threshold, adding " + m0(niit) + "." : "Modified AGI of about " + m0(magi) + " is below the NIIT threshold of " + m0(Y.niit[st]) + ".");
    }
    wire(el, run);
  };

  /* ---------- 3. 2026 workplace plan limit finder (INV-031) ---------- */
  TOOLS.s5aLimits = function (el) {
    var u = uid(el);
    shell(el, "How much can I put in my workplace plan in 2026?", "Calculator · 2026 limits",
      sel(u + "-p", "Plan", [["k", "401(k), 403(b), governmental 457(b) or TSP"], ["simple", "SIMPLE IRA or SIMPLE 401(k)"], ["sep", "SEP IRA (self-employed)"], ["solo", "Solo 401(k) (self-employed)"]], "k") +
      rng(u + "-age", "Age at the end of 2026", 20, 75, 1, 57, "age") +
      numf(u + "-c", "Pay, or for the self-employed net earnings after half of SE tax ($)", 170000, 1000) +
      numf(u + "-pw", "Wages from this employer in 2025 (Social Security wages) ($)", 170000, 1000, "Used for the Roth catch-up rule; self-employed earnings without W-2 wages are not counted.") +
      note("2026 limits from IRS Notice 2025-67: deferrals $24,500; catch-up $8,000 (age 50+) or $11,250 (ages 60–63); SIMPLE $17,000 with $4,000 or $5,250 catch-up (some SIMPLE plans allow $18,100 and $3,850); total additions $72,000; compensation cap $360,000. Roth catch-up required if 2025 wages from the employer exceeded $150,000. Employer amounts for the self-employed use the 20% effective rate on net earnings from IRS Publication 560."),
      '<div class="kpis" id="' + u + '-kp"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-nt"></p>');
    function run() {
      var p = val(el, "p"), age = Number(val(el, "age")), c = num(el, "c"), pw = num(el, "pw");
      var cap = Math.min(c, 360000), sup = age >= 60 && age <= 63;
      var def = 0, cu = 0, emp = 0, total = 0, rothCU = "Not applicable";
      if (p === "k") { def = Math.min(24500, c); cu = age >= 50 ? Math.min(sup ? 11250 : 8000, Math.max(0, c - def)) : 0; emp = Math.max(0, Math.min(72000, c) - def); total = def + cu; }
      if (p === "simple") { def = Math.min(17000, c); cu = age >= 50 ? Math.min(sup ? 5250 : 4000, Math.max(0, c - def)) : 0; total = def + cu; }
      if (p === "sep") { emp = Math.min(0.2 * cap, 72000); total = emp; }
      if (p === "solo") { def = Math.min(24500, c); emp = Math.min(0.2 * cap, Math.max(0, 72000 - def)); cu = age >= 50 ? Math.min(sup ? 11250 : 8000, Math.max(0, c - def - emp)) : 0; total = def + emp + cu; }
      if ((p === "k" || p === "simple" || p === "solo") && cu > 0) rothCU = pw <= 150000 ? "No" : p === "simple" ? "SIMPLE 401(k): yes; SIMPLE IRA: no" : "Yes, as Roth";
      self(el, "kp").innerHTML = kpi("Employee deferral", m0(def)) + kpi("Catch-up", m0(cu)) + kpi(p === "k" ? "Room left for employer and after-tax money" : p === "simple" ? "Employer money (set by the plan formula)" : "Employer contribution room", p === "simple" ? "Match or 2%" : m0(emp)) + kpi(p === "k" || p === "simple" ? "Your own maximum for 2026" : "Your maximum for 2026", m0(total), "good") + kpi("Catch-up must be Roth?", rothCU);
      INV.barChart(self(el, "ch"), { label: "2026 contribution room", height: 210, allLabels: true, valueLabels: true, yFmt: function (v) { return m0(v); }, tipFmt: function (v) { return m0(v); },
        data: [{ label: "Deferral", y: def, color: "var(--s1)" }, { label: "Catch-up", y: cu, color: "var(--s3)" }, { label: p === "k" ? "Employer room" : "Employer", tip: p === "k" ? "Room under the $72,000 total-additions limit for employer and after-tax money" : "Employer contribution", y: emp, color: "var(--s2)" }, { label: p === "k" || p === "simple" ? "Your total" : "Total", y: total, color: "var(--s4)" }] });
      self(el, "nt").innerHTML = (p === "k" ? "The $24,500 deferral limit is per person across all 401(k), 403(b), SIMPLE and TSP accounts, but a governmental 457(b) has its own separate limit, so someone with both a 403(b) and a 457(b) can defer in each. Employer matches do not count toward $24,500; together with your deferrals they count toward the $72,000 total-additions limit." :
        p === "sep" ? "A SEP takes only employer money: up to 25% of an employee's pay, which works out to about 20% of net self-employment earnings for the owner, capped at $72,000 for 2026. There are no catch-up contributions in a SEP." :
        p === "solo" ? "In a solo 401(k) the owner contributes as employee (up to $24,500) and as employer (about 20% of net earnings), together capped at $72,000, plus any catch-up on top." :
        "SIMPLE plans have lower limits and require the employer to match or contribute for all eligible employees.") + (sup && cu > 0 ? " Ages 60–63 get the larger SECURE 2.0 catch-up in 2026; at 64 it reverts to the regular amount." : "");
    }
    wire(el, run);
  };

  /* ---------- 4. Traditional versus Roth (INV-031) ---------- */
  TOOLS.s5aRothTrad = function (el) {
    var u = uid(el);
    shell(el, "Traditional or Roth? Compare what you actually keep", "Calculator",
      '<div class="fld"><label>Compare</label><div class="seg" role="group"><button type="button" data-v="same" aria-pressed="true">Same take-home cost</button><button type="button" data-v="max" aria-pressed="false">Both at the same dollar limit</button></div></div>' +
      numf(u + "-c", "Contribution each year, pre-tax dollars ($)", 10000, 500) +
      rng(u + "-n", "Years until you withdraw", 1, 45, 1, 30, "yr") + rng(u + "-r", "Return per year", 0, 10, 0.5, 6, "pct") +
      rng(u + "-t0", "Tax rate on this money today (federal + state)", 0, 50, 1, 22, "pct") + rng(u + "-t1", "Tax rate when you withdraw", 0, 50, 1, 15, "pct") +
      note("Same take-home cost: the traditional account gets the full contribution; the Roth gets it after today's tax. Same dollar limit: both get the full amount, and the traditional saver invests the tax saved in a taxable account that loses 15% of its growth to tax each year (a rough assumption)."),
      '<div class="kpis" id="' + u + '-kp"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-nt"></p>');
    var mode = "same";
    el.querySelectorAll(".seg button").forEach(function (b) {
      b.addEventListener("click", function () { mode = b.dataset.v; el.querySelectorAll(".seg button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); run(); });
    });
    function grow(c, r, n) { var b = 0; for (var i = 0; i < n; i++) b = (b + c) * (1 + r); return b; }
    function outcome(c, r, n, t0, t1) {
      var trad = grow(c, r, n) * (1 - t1), roth, side = 0;
      if (mode === "same") roth = grow(c * (1 - t0), r, n);
      else { roth = grow(c, r, n); var rs = r * 0.85, sb = grow(c * t0, rs, n), basis = c * t0 * n; side = sb - Math.max(0, sb - basis) * 0.15; trad += side; }
      return { trad: trad, roth: roth };
    }
    function run() {
      var c = num(el, "c"), n = Number(val(el, "n")), r = Number(val(el, "r")) / 100, t0 = Number(val(el, "t0")) / 100, t1 = Number(val(el, "t1")) / 100;
      var o = outcome(c, r, n, t0, t1), diff = o.roth - o.trad, be = null;
      for (var z = 0; z <= 60; z += 0.1) { var qq = outcome(c, r, n, t0, z / 100); if (qq.trad <= qq.roth + 1e-9) { be = z; break; } }
      if (mode === "same") be = t0 * 100;
      self(el, "kp").innerHTML = kpi("Traditional, after tax", m0(o.trad), o.trad >= o.roth ? "good" : "") + kpi("Roth, after tax", m0(o.roth), o.roth > o.trad ? "good" : "") +
        kpi(diff >= 0 ? "Roth ahead by" : "Traditional ahead by", m0(Math.abs(diff))) + kpi("Break-even withdrawal rate", be == null ? "Traditional wins at any rate up to 60%" : pct(be, 1));
      var tr = [], ro = [];
      for (var k = 0; k <= 50; k += 2) { var q = outcome(c, r, n, t0, k / 100); tr.push([k, q.trad]); ro.push([k, q.roth]); }
      INV.lineChart(self(el, "ch"), { label: "After-tax value by withdrawal tax rate", height: 240, xTitle: "Tax rate when you withdraw (%)", yFmt: ms, xFmt: function (v) { return v + "%"; }, zeroBase: false,
        series: [{ name: "Traditional", color: "var(--s1)", data: tr }, { name: "Roth", color: "var(--s2)", data: ro }], dots: [{ x: t1 * 100, y: o.trad, color: "var(--s1)" }], marks: [{ x: t0 * 100, label: "Today's rate" }] });
      self(el, "nt").innerHTML = mode === "same" ? "With the same take-home cost, the two are identical when the tax rate at withdrawal equals today's rate (" + pct(t0 * 100, 0) + "): traditional wins if your rate will be lower later, Roth if it will be higher. Taxes are paid either way; the question is only <b>which rate</b>."
        : "When you can only put in a fixed dollar amount, a Roth dollar is worth more than a traditional dollar because it carries no tax bill, so the Roth tends to win unless your withdrawal rate is well below today's. The side account's tax drag is an assumption.";
    }
    wire(el, run);
  };

  /* ---------- 5. Roth IRA eligibility and IRA deduction, 2026 (INV-032) ---------- */
  function phase(limit, magi, lo, width) {
    if (magi <= lo) return limit; if (magi >= lo + width) return 0;
    var r = limit * (lo + width - magi) / width; r = Math.ceil(r / 10) * 10; return Math.max(200, Math.min(limit, r));
  }
  TOOLS.s5aRothIRA = function (el) {
    var u = uid(el);
    shell(el, "Can I contribute to a Roth IRA, or deduct a traditional IRA, in 2026?", "Calculator · 2026 limits",
      sel(u + "-st", "Filing status", [["single", "Single or head of household"], ["mfj", "Married filing jointly"]], "mfj") +
      numf(u + "-m", "Modified AGI ($)", 205000, 1000) + rng(u + "-age", "Your age at the end of 2026", 18, 80, 1, 55, "age") +
      numf(u + "-e", "Your earned income, or the couple's for a spousal IRA ($)", 90000, 1000) +
      sel(u + "-cov", "Workplace retirement plan coverage", [["none", "Neither spouse covered"], ["me", "I am covered"], ["sp", "Only my spouse is covered"]], "me") +
      note("2026 figures from IRS Notice 2025-67: limit $7,500 plus $1,100 at 50+. Roth phase-out $153,000–$168,000 (single/HoH) and $242,000–$252,000 (joint). Traditional deduction phase-out if covered: $81,000–$91,000 single, $129,000–$149,000 joint; if only your spouse is covered, $242,000–$252,000. Reduced limits round up to the next $10 with a $200 minimum (Publication 590-A)."),
      '<div class="kpis" id="' + u + '-kp"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-nt"></p>');
    function run() {
      var st = val(el, "st"), m = num(el, "m"), age = Number(val(el, "age")), e = num(el, "e"), cov = val(el, "cov");
      var lim = Math.min(7500 + (age >= 50 ? 1100 : 0), e);
      var rLo = st === "mfj" ? 242000 : 153000, rW = st === "mfj" ? 10000 : 15000;
      var roth = Math.min(lim, phase(lim, m, rLo, rW)); if (lim <= 0) roth = 0;
      var dLo = cov === "none" ? Infinity : cov === "sp" ? 242000 : st === "mfj" ? 129000 : 81000, dW = cov === "sp" ? 10000 : st === "mfj" ? 20000 : 10000;
      if (cov === "sp" && st !== "mfj") { dLo = Infinity; }
      var ded = dLo === Infinity ? lim : Math.min(lim, phase(lim, m, dLo, dW)); if (lim <= 0) ded = 0;
      self(el, "kp").innerHTML = kpi("Your 2026 IRA limit", m0(lim)) + kpi("Direct Roth IRA contribution allowed", m0(roth), roth > 0 ? "good" : "bad") + kpi("Deductible traditional IRA amount", m0(ded)) +
        kpi("Route to a Roth", lim <= 0 ? "Needs earned income" : roth >= lim ? "Contribute directly" : roth > 0 ? "Part direct, rest by backdoor" : "Backdoor (nondeductible + convert)");
      var pts = []; for (var x = rLo - 30000; x <= rLo + rW + 20000; x += 1000) pts.push([x, phase(lim, x, rLo, rW)]);
      INV.lineChart(self(el, "ch"), { label: "Roth IRA limit by modified AGI", height: 220, xTitle: "Modified AGI", yFmt: ms, xFmt: ms,
        series: [{ name: "Direct Roth IRA contribution allowed", color: "var(--s2)", data: pts, area: true }], dots: [{ x: Math.max(rLo - 30000, Math.min(m, rLo + rW + 20000)), y: roth, label: m0(roth), color: "var(--s1)" }] });
      self(el, "nt").innerHTML = "The IRA limit is shared: " + m0(lim) + " in total across all your traditional and Roth IRAs for 2026, and never more than your (or, for a spousal IRA, the couple's) earned income. " +
        (roth < lim && lim > 0 ? "Above the Roth income range you can still make a <b>nondeductible</b> traditional IRA contribution and convert it; the pro-rata rule decides how much of that conversion is taxed." : "Contributions are due by the tax-filing deadline, not including extensions.");
    }
    wire(el, run);
  };

  /* ---------- 6. Pro-rata rule for conversions (INV-032) ---------- */
  TOOLS.s5aProRata = function (el) {
    var u = uid(el);
    shell(el, "The pro-rata rule: how much of my conversion is taxed?", "Calculator",
      numf(u + "-b", "After-tax basis: nondeductible contributions not yet recovered (Form 8606) ($)", 7500, 100) +
      numf(u + "-v", "Value of ALL traditional, SEP and SIMPLE IRAs on December 31 after the conversion ($)", 92500, 500) +
      numf(u + "-x", "Amount converted to Roth during the year ($)", 7500, 100) +
      rng(u + "-t", "Your marginal tax rate", 0, 45, 1, 24, "pct") +
      note("Simplified Form 8606 logic: nontaxable share = basis ÷ (year-end value of all traditional, SEP and SIMPLE IRAs + amounts converted or distributed during the year). Workplace 401(k) balances are not counted, which is why rolling pre-tax IRA money into a 401(k) before converting can make a backdoor Roth nearly tax-free."),
      '<div class="kpis" id="' + u + '-kp"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-nt"></p>');
    function run() {
      var b = num(el, "b"), v = num(el, "v"), x = num(el, "x"), t = Number(val(el, "t")) / 100;
      var den = v + x, share = den > 0 ? Math.min(1, b / den) : 0, nt = x * share, tx = x - nt;
      self(el, "kp").innerHTML = kpi("Nontaxable share", p1(share * 100)) + kpi("Tax-free part of conversion", m0(nt), "good") + kpi("Taxable part", m0(tx), tx > 0 ? "bad" : "") + kpi("Federal tax on it", m0(tx * t)) + kpi("Basis carried forward", m0(Math.max(0, b - nt)));
      var clean = x > 0 ? Math.min(x, b) : 0;
      INV.barChart(self(el, "ch"), { label: "Taxable versus nontaxable conversion", height: 210, allLabels: true, valueLabels: true, yFmt: ms, tipFmt: function (v2) { return m0(v2); },
        data: [{ label: "Tax-free now", y: nt, color: "var(--s2)" }, { label: "Taxable now", y: tx, color: "var(--s5)" }, { label: "Tax-free if no other IRAs", tip: "If the only IRA money were the after-tax basis", y: clean, color: "var(--s6)" }] });
      self(el, "nt").innerHTML = "You cannot choose to convert only the after-tax dollars. Every conversion is treated as coming proportionally from all pre-tax and after-tax IRA money: here " + m0(b) + " ÷ (" + m0(v) + " + " + m0(x) + ") = " + p1(share * 100) + " is tax-free.";
    }
    wire(el, run);
  };

  /* ---------- 7. HSA triple advantage (INV-033) ---------- */
  TOOLS.s5aHSA = function (el) {
    var u = uid(el);
    shell(el, "The HSA's triple tax advantage, in dollars", "Calculator",
      numf(u + "-c", "Contribution each year ($)", 4400, 100, "2026 limits: $4,400 self-only, $8,750 family, +$1,000 at 55+.") +
      rng(u + "-n", "Years invested before spending", 1, 40, 1, 25, "yr") + rng(u + "-r", "Return per year", 0, 10, 0.5, 6, "pct") +
      rng(u + "-t0", "Income tax rate today (federal + state)", 0, 45, 1, 27, "pct") + rng(u + "-t1", "Income tax rate when spent", 0, 45, 1, 20, "pct") +
      sel(u + "-pay", "How you contribute", [["pay", "Payroll: also skips 7.65% FICA"], ["own", "On your own, then deduct"]], "pay") +
      note("Taxable account: the same pre-tax pay, taxed first, invested, and taxed on growth at 15% at the end (a simplification). Traditional 401(k): contributed pre-tax, taxed at withdrawal. HSA: spent tax-free on qualified medical expenses, or taxed like a 401(k) if spent on anything else after 65."),
      '<div class="kpis" id="' + u + '-kp"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-nt"></p>');
    function grow(c, r, n) { var b = 0; for (var i = 0; i < n; i++) b = (b + c) * (1 + r); return b; }
    function run() {
      var c = num(el, "c"), n = Number(val(el, "n")), r = Number(val(el, "r")) / 100, t0 = Number(val(el, "t0")) / 100, t1 = Number(val(el, "t1")) / 100, pay = val(el, "pay") === "pay";
      var fica = pay ? 0.0765 : 0;
      var hsa = grow(c, r, n), hsaNon = hsa * (1 - t1);
      var k401 = grow(c * (1 - fica), r, n) * (1 - t1);
      var net = c * (1 - t0 - fica), tb = grow(net, r, n), taxb = tb - Math.max(0, tb - net * n) * 0.15;
      self(el, "kp").innerHTML = kpi("HSA spent on medical care", money(hsa), "good") + kpi("HSA spent on other things after 65", money(hsaNon)) + kpi("Same pay in a traditional 401(k)", money(k401)) + kpi("Same pay in a taxable account", money(taxb)) +
        kpi("HSA advantage over taxable", money(hsa - taxb), "good");
      INV.barChart(self(el, "ch"), { label: "After-tax spending power", height: 220, allLabels: true, valueLabels: true, yFmt: ms, tipFmt: function (v) { return money(v); },
        data: [{ label: "HSA, medical", y: hsa, color: "var(--s2)" }, { label: "HSA, non-medical 65+", y: hsaNon, color: "var(--s3)" }, { label: "Traditional 401(k)", y: k401, color: "var(--s1)" }, { label: "Taxable account", y: taxb, color: "var(--s6)" }] });
      self(el, "nt").innerHTML = "Each account starts from the same " + money(c) + " a year of gross pay. The HSA is the only one where the money is never taxed at all, going in, while growing, or coming out, if it is spent on qualified medical expenses. " +
        (pay ? "Payroll contributions also avoid the 7.65% Social Security and Medicare tax, which 401(k) deferrals do not." : "Contributions made on your own are deductible for income tax but do not recover the payroll tax already withheld.");
    }
    wire(el, run);
  };

  /* ---------- 8. 529 versus taxable, with state deduction (INV-034) ---------- */
  TOOLS.s5a529 = function (el) {
    var u = uid(el);
    shell(el, "529 plan versus a taxable account", "Calculator",
      numf(u + "-m", "Saved each month ($)", 350, 25) + rng(u + "-n", "Years until college starts", 1, 18, 1, 11, "yr") +
      rng(u + "-r", "Return per year", 0, 10, 0.5, 6, "pct") +
      sel(u + "-s", "State deduction", [["azj", "Arizona, joint: $4,000 at 2.5%"], ["azs", "Arizona, single/HoH: $2,000 at 2.5%"], ["oh", "Ohio (own plan): $4,000 at 2.75%"], ["none", "No state deduction"]], "azj") +
      rng(u + "-t", "Federal rate on the taxable account's gains", 0, 20, 5, 15, "pct") +
      note("Arizona subtraction: A.R.S. § 43-1022; Arizona's 2026 estimated-tax rate 2.5%. Ohio deduction: R.C. 5747.70, $4,000 per beneficiary per year with carryforward, CollegeAdvantage only; 2.75% is Ohio's 2026 rate above $26,050. One beneficiary. Taxable account gains are taxed once at the end; in reality dividends are taxed yearly."),
      '<div class="kpis" id="' + u + '-kp"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-nt"></p>');
    function run() {
      var m = num(el, "m"), n = Number(val(el, "n")), r = Number(val(el, "r")) / 100, s = val(el, "s"), t = Number(val(el, "t")) / 100;
      var cap = s === "azs" ? 2000 : s === "none" ? 0 : 4000, rate = s === "oh" ? 0.0275 : s === "none" ? 0 : 0.025;
      var rm = Math.pow(1 + r, 1 / 12) - 1, b = 0, pts = [[0, 0]], ptT = [[0, 0]], contrib = 0, stateSave = 0;
      for (var y = 1; y <= n; y++) { for (var k = 0; k < 12; k++) { b = b * (1 + rm) + m; contrib += m; } stateSave += Math.min(12 * m, cap) * rate; pts.push([y, b]); ptT.push([y, b - Math.max(0, b - contrib) * t]); }
      var gain = Math.max(0, b - contrib), taxable = b - gain * t;
      self(el, "kp").innerHTML = kpi("529 at college, tax-free for qualified costs", money(b), "good") + kpi("Taxable account after tax", money(taxable)) + kpi("Federal tax avoided", money(gain * t), "good") +
        kpi("State tax saved over " + n + (n === 1 ? " year" : " years"), money(stateSave), "good") + kpi("You contributed", money(contrib));
      INV.lineChart(self(el, "ch"), { label: "529 versus taxable account", height: 240, xTitle: "Years from now", xFmt: yr, yFmt: ms,
        series: [{ name: "529 plan", color: "var(--s2)", data: pts }, { name: "Taxable account, after tax", color: "var(--s6)", data: ptT, dash: "5 4" }] });
      self(el, "nt").innerHTML = "Earnings in a 529 are never taxed if withdrawals pay qualified education costs; in a taxable account they are. The state benefit here is " + (cap ? "up to " + money(cap) + " a year deducted at " + pct(rate * 100, 2) + ", worth at most " + money(cap * rate) + " a year." : "zero.") +
        " If the money is withdrawn for anything else, the earnings are taxed and usually hit with an additional 10% tax, and states may recapture deductions.";
    }
    wire(el, run);
  };

  /* ---------- 9. Tax lots and cost-basis methods: Jordan's ESPP shares (INV-035) ---------- */
  var LOTS = [{ id: "A", d: "Jun 2019", sh: 280, b: 24.0, lt: true }, { id: "B", d: "Dec 2021", sh: 260, b: 38.0, lt: true }, { id: "C", d: "Jun 2023", sh: 300, b: 41.0, lt: true }, { id: "D", d: "Dec 2025", sh: 280, b: 46.75, lt: false }];
  INV.s5aLots = LOTS;
  function pick(method, n, px) {
    var order = LOTS.slice();
    if (method === "hifo") order.sort(function (a, b) { return b.b - a.b; });
    var left = n, st = 0, lt = 0, used = [];
    order.forEach(function (l) { if (left <= 0) return; var q = Math.min(l.sh, left); left -= q; var g = q * (px - l.b); if (l.lt) lt += g; else st += g; used.push(l.id + " " + q); });
    return { st: st, lt: lt, used: used.join(", ") };
  }
  function lotTax(ti, st, g, status) { var base = prefSplit(ti, 0, status).tax; var tot = ti + Math.max(0, st + g); var pref = Math.max(0, g + Math.min(0, st)); return Math.max(0, prefSplit(tot, Math.min(pref, tot), status).tax - base); }
  /* Specific identification, lowest tax: try every mix of lots in 20-share steps (the lot sizes are multiples of 20)
     and keep the one with the smallest federal tax; ties go to the mix that realizes the least gain. */
  function pickMin(n, px, ti, status) {
    var L = LOTS, best = null, step = 20;
    for (var a = 0; a <= Math.min(L[0].sh, n); a += step)
      for (var b = 0; b <= Math.min(L[1].sh, n - a); b += step)
        for (var c = 0; c <= Math.min(L[2].sh, n - a - b); c += step) {
          var d = n - a - b - c; if (d < 0 || d > L[3].sh) continue;
          var q = [a, b, c, d], st = 0, lt = 0, used = [];
          for (var i = 0; i < 4; i++) if (q[i] > 0) { var g = q[i] * (px - L[i].b); if (L[i].lt) lt += g; else st += g; used.push(L[i].id + " " + q[i]); }
          var tax = lotTax(ti, st, lt, status);
          if (!best || tax < best.tax - 0.005 || (Math.abs(tax - best.tax) <= 0.005 && st + lt < best.st + best.lt)) best = { st: st, lt: lt, used: used.join(", "), tax: tax };
        }
    return best || pick("fifo", n, px);
  }
  INV.s5aLotsMin = pickMin;
  TOOLS.s5aLots = function (el) {
    var u = uid(el);
    shell(el, "Which shares should Jordan sell? Four tax lots, three methods", "Calculator · tax year 2026",
      rng(u + "-n", "Shares to sell (of 1,120)", 20, 1120, 20, 400) + numf(u + "-p", "Sale price per share ($)", 50, 0.5) +
      numf(u + "-ti", "Taxable ordinary income before the sale ($)", 58570, 500, "Jordan's 2026 estimate as head of household.") +
      sel(u + "-st", "Filing status", STATUS, "hoh") +
      note("Lots (adjusted basis per share, after the ordinary income already reported on Jordan's W-2): A Jun 2019, 280 sh, $24.00; B Dec 2021, 260 sh, $38.00; C Jun 2023, 300 sh, $41.00; D Dec 2025, 280 sh, $46.75 (held under a year in September 2026, so short-term). Illustrative. Losses offset gains in the simplified tax math; the $3,000 loss limit and state tax are ignored."),
      '<div class="kpis" id="' + u + '-kp"></div><div id="' + u + '-ch"></div><div id="' + u + '-tb"></div><p class="tool-note" id="' + u + '-nt"></p>');
    function run() {
      var n = Number(val(el, "n")), px = num(el, "p"), ti = num(el, "ti"), status = val(el, "st");
      var M = [["fifo", "First in, first out"], ["hifo", "Highest cost first"], ["min", "Specific ID, lowest tax"]].map(function (m) { var q = m[0] === "min" ? pickMin(n, px, ti, status) : pick(m[0], n, px); if (q.tax == null) q.tax = lotTax(ti, q.st, q.lt, status); q.name = m[1]; return q; });
      var f = M[0], best = M.reduce(function (a, b) { return b.tax < a.tax ? b : a; });
      self(el, "kp").innerHTML = kpi("Proceeds", money(n * px)) + kpi("Tax under FIFO (the default)", money(f.tax, 2)) + kpi("Lowest-tax choice", best.name) + kpi("Its federal tax", money(best.tax, 2), "good") + kpi("Saved versus FIFO", money(Math.max(0, f.tax - best.tax), 2), "good");
      INV.barChart(self(el, "ch"), { label: "Federal tax by lot-selection method", height: 210, allLabels: true, valueLabels: true, yFmt: function (v) { return money(v, 0); }, tipFmt: function (v) { return money(v, 2); },
        data: M.map(function (m, i) { return { label: m.name, y: m.tax, color: ["var(--s5)", "var(--s3)", "var(--s2)"][i] }; }) });
      self(el, "tb").innerHTML = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Method</th><th>Lots sold</th><th class="r">Short-term gain</th><th class="r">Long-term gain</th><th class="r">Federal tax</th></tr></thead><tbody>' +
        M.map(function (m) { return "<tr><td>" + m.name + "</td><td>" + m.used + '</td><td class="r">' + money(m.st) + '</td><td class="r">' + money(m.lt) + '</td><td class="r">' + money(m.tax, 2) + "</td></tr>"; }).join("") + "</tbody></table></div>";
      self(el, "nt").innerHTML = "If Jordan gives no instruction, the broker sells the oldest shares first (FIFO), which here realizes the largest gains. Naming the lots in writing at the time of the sale (specific identification) changes the tax without changing the shares' market value. Note that the lowest tax today is not always best: long-term gains that fit under the 0% ceiling (" + money(Y.cg0[status]) + " of taxable income for this filing status in 2026) cost nothing to realize.";
    }
    wire(el, run);
  };
})();
