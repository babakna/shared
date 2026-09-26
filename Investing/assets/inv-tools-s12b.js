/* Investing Learning Lab - Stage 12 (Estate Planning & Wealth Transfer) calculators, INV-090 to INV-094 - V1.1 (September 2026)
   Every tool computes from its stated formula in the browser. Tax figures are for 2026 from IRS
   Rev. Proc. 2025-32 (brackets, standard deduction, gift exclusion, estate exemption, section 2032A and
   6166 amounts), Rev. Rul. 2026-19 (October 2026 applicable federal rates) and the Single Life Table in
   IRS Publication 590-B. Simplified models for learning; not tax advice. */
(function () {
  "use strict";
  var INV = window.INV; if (!INV || !INV.tools) return;
  var esc = INV.esc, ms = INV.moneyShort, pct = INV.pct;
  function money(v, dp) { return INV.money(v, dp == null ? 0 : dp); }
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
  function yearFmt(v) { return String(Math.round(v)); }
  function pctFmt(v) { return (Math.round(v * 10) / 10) + "%"; }

  /* ---------- 2026 federal income tax (Rev. Proc. 2025-32, section 4.01 and 4.14) ---------- */
  var BR = {
    single: [[12400, 0.10], [50400, 0.12], [105700, 0.22], [201775, 0.24], [256225, 0.32], [640600, 0.35], [Infinity, 0.37]],
    mfj: [[24800, 0.10], [100800, 0.12], [211400, 0.22], [403550, 0.24], [512450, 0.32], [768700, 0.35], [Infinity, 0.37]]
  };
  var SD = { single: 16100, mfj: 32200 };
  function incomeTax(ti, st) { var t = 0, lo = 0; BR[st].forEach(function (b) { if (ti > lo) t += (Math.min(ti, b[0]) - lo) * b[1]; lo = b[0]; }); return t; }
  function bracketTop(st, rate) { var b = BR[st].filter(function (x) { return Math.abs(x[1] - rate) < 1e-9; })[0]; return b ? b[0] : 0; }

  /* IRS Single Life Table (Treas. Reg. 1.401(a)(9)-9(b); IRS Publication 590-B, Table I), ages 0-120 */
  var SLT = [84.6, 83.7, 82.8, 81.8, 80.8, 79.8, 78.8, 77.9, 76.9, 75.9, 74.9, 73.9, 72.9, 71.9, 70.9, 69.9, 69.0, 68.0, 67.0, 66.0,
    65.0, 64.1, 63.1, 62.1, 61.1, 60.2, 59.2, 58.2, 57.3, 56.3, 55.3, 54.4, 53.4, 52.5, 51.5, 50.5, 49.6, 48.6, 47.7, 46.7,
    45.7, 44.8, 43.8, 42.9, 41.9, 41.0, 40.0, 39.0, 38.1, 37.1, 36.2, 35.3, 34.3, 33.4, 32.5, 31.6, 30.6, 29.8, 28.9, 28.0,
    27.1, 26.2, 25.4, 24.5, 23.7, 22.9, 22.0, 21.2, 20.4, 19.6, 18.8, 18.0, 17.2, 16.4, 15.6, 14.8, 14.1, 13.3, 12.6, 11.9,
    11.2, 10.5, 9.9, 9.3, 8.7, 8.1, 7.6, 7.1, 6.6, 6.1, 5.7, 5.3, 4.9, 4.6, 4.3, 4.0, 3.7, 3.4, 3.2, 3.0,
    2.8, 2.6, 2.5, 2.3, 2.2, 2.1, 2.1, 2.1, 2.0, 2.0, 2.0, 2.0, 2.0, 1.9, 1.9, 1.8, 1.8, 1.6, 1.4, 1.1, 1.0];
  function slt(age) { age = Math.max(0, Math.min(120, Math.round(age))); return SLT[age]; }
  INV.s12bSLT = slt;

  /* ---------- 1. Gift now or inherit later? (INV-090) ---------- */
  TOOLS.s12bGiftVsInherit = function (el) {
    var u = uid(el);
    shell(el, "Give it now or leave it at death?", "Calculator",
      numf(u + "-v", "Value of the asset today ($)", 100000, 1000) +
      numf(u + "-b", "Owner's cost basis ($)", 20000, 1000) +
      rng(u + "-g", "Growth per year until the heir sells", 0, 12, 0.5, 6, "pct") +
      rng(u + "-n", "Years until the owner's death (heir sells then)", 1, 40, 1, 15, "yr") +
      rng(u + "-t", "Heir's tax rate on long-term gains", 0, 33.8, 0.1, 15, "pct") +
      '<div class="fld"><label>Is the owner\'s estate above the federal exemption?</label><div class="seg" role="group"><button type="button" data-v="no" aria-pressed="true">No</button><button type="button" data-v="yes" aria-pressed="false">Yes (40% at the margin)</button></div></div>' +
      hint("Gift: the heir keeps the owner's basis (carryover basis, IRC 1015). Inherit: basis resets to value at death (IRC 1014). \"Yes\" assumes every extra dollar of estate or taxable gift is taxed at the 40% top rate; the gift is taxed at its value on the gift date, so only the growth escapes."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    var est = "no";
    el.querySelectorAll(".seg button").forEach(function (b) {
      b.addEventListener("click", function () { est = b.dataset.v; el.querySelectorAll(".seg button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); run(); });
    });
    function run() {
      var V = num(el, "v"), B = num(el, "b"), g = Number(self(el, "g").value) / 100, n = Number(self(el, "n").value), t = Number(self(el, "t").value) / 100;
      var Vn = V * Math.pow(1 + g, n);
      var gain = Math.max(0, Vn - B), underwater = V < B;
      var cgGift = gain * t, cgInh = 0;
      var ttGift = est === "yes" ? 0.4 * V : 0, ttInh = est === "yes" ? 0.4 * Vn : 0;
      var totG = cgGift + ttGift, totI = cgInh + ttInh, better = totI <= totG ? "Inherit" : "Gift now";
      self(el, "k").innerHTML = kpi("Value when sold", money(Vn)) + kpi("Heir's basis if gifted", money(B)) + kpi("Heir's basis if inherited", money(Vn)) +
        kpi("Total tax, gift path", money(totG), totG > totI ? "bad" : "good") + kpi("Total tax, inherit path", money(totI), totI > totG ? "bad" : "good") + kpi("Cheaper route", better);
      INV.barChart(self(el, "c"), { label: "Taxes under each route", height: 230, allLabels: true, valueLabels: true, yFmt: ms, tipFmt: function (v) { return money(v); },
        data: [{ label: "Gift: gains tax", y: cgGift, color: "var(--s3)" }, { label: "Gift: gift tax", y: ttGift, color: "var(--s5)" },
          { label: "Inherit: gains tax", y: cgInh, color: "var(--s2)" }, { label: "Inherit: estate tax", y: ttInh, color: "var(--s4)" }] });
      var note = "If the heir receives the asset as a gift and sells it after " + n + " years for " + money(Vn) + ", the taxable gain is " + money(gain) + " and the tax at " + pct(t * 100, 1) + " is <b>" + money(cgGift) + "</b>. Inherited at death, the basis resets to " + money(Vn) + " and a prompt sale owes <b>no</b> capital gains tax.";
      if (underwater) note += " Here the asset is already worth less than the owner's " + money(B) + " basis. The owner's unrealized loss of " + money(B - V) + " cannot pass to anyone: a gift gives the heir a loss basis of only " + money(V) + " (the value on the gift date), and at death the basis steps <i>down</i> to the value then. Selling a loser during life and deducting the loss is usually better.";
      if (est === "yes") note += " With a taxable estate, keeping the asset exposes all of its growth (" + money(Vn - V) + ") to the 40% estate tax, which is why large estates sometimes give appreciating assets away early even at the cost of a lost step-up.";
      self(el, "n2").innerHTML = note;
    }
    wire(el, run);
  };

  /* ---------- 2. How titling changes the step-up (INV-090) ---------- */
  TOOLS.s12bCommunity = function (el) {
    var u = uid(el);
    shell(el, "The surviving spouse's new basis, by how the asset was titled", "Calculator",
      numf(u + "-v", "Value at the first spouse's death ($)", 220000, 1000) +
      numf(u + "-b", "Couple's original cost basis ($)", 70000, 1000) +
      rng(u + "-t", "Tax rate if the survivor sells (long-term gains)", 0, 33.8, 0.1, 18.8, "pct") +
      hint("Joint tenancy or tenancy by the entirety between spouses: half the value is included in the estate, so half steps up (IRS Pub. 551, qualified joint interest). Community property: the whole asset steps up if at least half was included (IRC 1014(b)(6)). Assumes no depreciation and a sale at the date-of-death value."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var V = num(el, "v"), B = num(el, "b"), t = Number(self(el, "t").value) / 100;
      var cases = [
        ["Community", V, "var(--s2)", "Community property"],
        ["Joint", B / 2 + V / 2, "var(--s1)", "Joint tenancy between spouses"],
        ["Decedent's", V, "var(--s6)", "Owned only by the spouse who died"],
        ["Survivor's", B, "var(--s5)", "Owned only by the surviving spouse"]];
      var jt = B / 2 + V / 2, taxJ = Math.max(0, V - jt) * t, taxCP = 0;
      self(el, "k").innerHTML = kpi("Basis if community property", money(V), "good") + kpi("Basis if joint tenancy", money(jt)) +
        kpi("Tax on sale, joint", money(taxJ), taxJ > 0 ? "bad" : "") + kpi("Tax on sale, community", money(taxCP), "good") + kpi("Community-property advantage", money(taxJ - taxCP));
      INV.barChart(self(el, "c"), { label: "Surviving spouse's basis by titling", height: 230, allLabels: true, valueLabels: true, yFmt: ms, tipFmt: function (v) { return "basis " + money(v) + "; tax on sale " + money(Math.max(0, V - v) * t); },
        data: cases.map(function (c) { return { label: c[0], tip: c[3], y: c[1], color: c[2] }; }) });
      self(el, "n2").innerHTML = "Selling for " + money(V) + " right after the first death, the survivor owes nothing on community property, <b>" + money(taxJ) + "</b> on a joint account, and " + money(Math.max(0, V - B) * t) +
        " on property that was already the survivor's alone. Nine states are community-property states: Arizona, California, Idaho, Louisiana, Nevada, New Mexico, Texas, Washington and Wisconsin (IRS Pub. 555).";
    }
    wire(el, run);
  };

  /* ---------- 3. Inherited IRA withdrawal plans (INV-091) ---------- */
  var PLANS = [["even", "Equal slices over 10 years"], ["fill", "Fill a tax bracket each year"], ["min", "Minimum, then the rest in year 10"], ["lump", "All in year 1"]];
  function iraSim(o, plan) {
    var st = o.st, base = Math.max(0, o.other - SD[st]), bt = incomeTax(base, st), top = bracketTop(st, o.fill);
    var b = o.bal, den = Math.max(slt(o.age), o.after ? slt(o.ownerAge) - 1 : 0), tot = 0, wealth = 0, rows = [], rmd1 = 0;
    for (var y = 1; y <= 10; y++) {
      var rmd = o.after ? b / Math.max(1, den - (y - 1)) : 0, w;
      if (y === 1) rmd1 = rmd;
      if (y === 10) w = b;
      else if (plan === "lump") w = y === 1 ? b : 0;
      else if (plan === "min") w = rmd;
      else if (plan === "even") w = b / (11 - y);
      else w = Math.max(0, top - base);
      w = Math.min(b, Math.max(w, rmd));
      var tx = o.roth ? 0 : incomeTax(base + w, st) - bt;
      tot += tx; wealth += (w - tx) * Math.pow(1 + o.g - o.drag, 10 - y);
      rows.push({ y: y, w: w, t: tx });
      b = (b - w) * (1 + o.g);
    }
    return { tot: tot, wealth: wealth, rows: rows, rmd1: rmd1 };
  }
  INV.s12bIraSim = iraSim;
  TOOLS.s12bInheritedIRA = function (el) {
    var u = uid(el);
    shell(el, "Inherited IRA: compare four withdrawal plans", "Calculator",
      numf(u + "-bal", "IRA balance at the end of the year of death ($)", 650000, 5000) +
      sel(u + "-acct", "Account type", [["trad", "Traditional IRA (withdrawals taxed)", 1], ["roth", "Roth IRA (qualified withdrawals tax-free)"]]) +
      sel(u + "-rbd", "When did the owner die?", [["after", "On or after the required beginning date", 1], ["before", "Before the required beginning date"]]) +
      rng(u + "-age", "Beneficiary's age in the first year after death", 20, 80, 1, 51, "age") +
      rng(u + "-oa", "Owner's age in the year of death", 60, 100, 1, 78, "age") +
      numf(u + "-oth", "Beneficiary's other income, before the standard deduction ($)", 90000, 1000) +
      sel(u + "-st", "Filing status", [["single", "Single", 1], ["mfj", "Married filing jointly"]]) +
      sel(u + "-fb", "Bracket to fill (for the bracket plan)", [["0.22", "Top of the 22% bracket"], ["0.24", "Top of the 24% bracket", 1], ["0.32", "Top of the 32% bracket"]]) +
      rng(u + "-g", "Growth after inflation", 0, 8, 0.5, 3, "pct") +
      rng(u + "-d", "Tax drag on money reinvested outside the IRA", 0, 2, 0.1, 0.5, "pct") +
      sel(u + "-sh", "Show the year-by-year plan for", PLANS.map(function (p, i) { return [p[0], p[1], i === 0]; })) +
      hint("2026 federal brackets and standard deduction held constant, so read results in today's dollars. Annual minimums in years 1&ndash;9 apply only if a traditional IRA owner died on or after the required beginning date (final regulations, T.D. 10001, for 2025 and later); the divisor is the longer of the beneficiary's and the owner's single life expectancy, reduced by one each year. State tax ignored."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><div class="fig-title" style="margin-top:10px" id="' + u + '-t2"></div><div id="' + u + '-c2"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var roth = self(el, "acct").value === "roth";
      var o = { bal: num(el, "bal"), roth: roth, after: !roth && self(el, "rbd").value === "after", age: Number(self(el, "age").value), ownerAge: Number(self(el, "oa").value),
        other: num(el, "oth"), st: self(el, "st").value, fill: Number(self(el, "fb").value), g: Number(self(el, "g").value) / 100, drag: Number(self(el, "d").value) / 100 };
      var res = PLANS.map(function (p) { var r = iraSim(o, p[0]); r.key = p[0]; r.name = p[1]; return r; });
      var best = res.reduce(function (a, b) { return b.wealth > a.wealth + 0.5 ? b : a; });
      var minP = res.filter(function (r) { return r.key === "min"; })[0];
      self(el, "k").innerHTML = kpi("Year-1 required minimum", o.after ? money(minP.rmd1) : "None required") +
        kpi("Best plan here", esc(best.name)) + kpi("After-tax money, best plan", money(best.wealth), "good") +
        kpi("Tax, best plan", money(best.tot)) + kpi("Waiting (minimum plan) costs", money(Math.max(0, best.wealth - minP.wealth)), best.wealth - minP.wealth > 1 ? "bad" : "");
      INV.barChart(self(el, "c"), { label: "After-tax money at the end of year 10 by plan", height: 220, allLabels: true, valueLabels: true, yFmt: ms, tipFmt: function (v) { return money(v) + " after tax"; },
        data: res.map(function (r) { return { label: r.name.replace("Fill a tax bracket each year", "Fill a bracket").replace("Minimum, then the rest in year 10", "Minimum, then year 10").replace("Equal slices over 10 years", "Equal slices"), tip: r.name + " (tax " + money(r.tot) + ")", y: r.wealth, color: r === best ? "var(--s2)" : "var(--s6)" }; }) });
      var shown = res.filter(function (r) { return r.key === self(el, "sh").value; })[0];
      self(el, "t2").textContent = "Withdrawals by year: " + shown.name;
      INV.barChart(self(el, "c2"), { label: "Withdrawals by year", height: 200, allLabels: true, yFmt: ms, xTitle: "Year after the year of death", tipFmt: function (v) { return money(v); },
        data: shown.rows.map(function (r) { return { label: String(r.y), tip: "Year " + r.y + ": withdraw " + money(r.w) + ", federal tax " + money(r.t), y: r.w, color: "var(--s1)" }; }) });
      self(el, "n2").innerHTML = (roth ? "A Roth IRA owner is treated as dying before the required beginning date, so there are no annual minimums; qualified withdrawals are tax-free, and leaving money inside the Roth avoids the tax drag it would face outside. " :
        "Taking income in large lumps pushes it into higher brackets; spreading it keeps more at lower rates. ") +
        "After-tax money counts each withdrawal, less its federal tax, reinvested at the growth rate minus the tax drag until the end of year 10. " +
        (o.after ? "Because the owner died on or after the required beginning date, every plan must take at least the annual minimum in years 1&ndash;9; skipping one triggers a 25% excise tax (10% if corrected in time)." + (o.ownerAge < 73 ? " Check the owner's age: required distributions now start at 73 (75 for people born in 1960 or later), so an owner who died younger than 73 had usually not reached the required beginning date." : "") : "No annual minimum applies, but the account must be empty by December 31 of the tenth year after the year of death.");
    }
    wire(el, run);
  };

  /* ---------- 4. Which rule applies to my beneficiary? (INV-091) ---------- */
  TOOLS.s12bBeneficiary = function (el) {
    var u = uid(el);
    shell(el, "Which post-death rule applies?", "Rule finder",
      sel(u + "-who", "Who inherits?", [["spouse", "Surviving spouse (sole beneficiary)"], ["minor", "Owner's child under 21"], ["dis", "Disabled or chronically ill individual"], ["ten", "Individual not more than 10 years younger than the owner"], ["other", "Any other individual (adult child, grandchild, friend)", 1], ["none", "Estate, charity, or a trust that does not qualify as see-through"]]) +
      sel(u + "-rbd", "When did the owner die?", [["before", "Before the required beginning date"], ["after", "On or after the required beginning date", 1]]) +
      sel(u + "-acct", "Account", [["trad", "Traditional IRA or pre-tax 401(k)", 1], ["roth", "Roth IRA"]]) +
      hint("Rules for owners who died after 2019 (SECURE Act, IRC 401(a)(9)(H)) as described in IRS Publication 590-B and the final regulations (T.D. 10001). A Roth IRA owner is always treated as dying before the required beginning date. Plans and trusts have extra rules; check the account documents."),
      '<div class="kpis" id="' + u + '-k"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var who = self(el, "who").value, roth = self(el, "acct").value === "roth", after = !roth && self(el, "rbd").value === "after";
      var cat, deadline, annual, note;
      if (who === "none") {
        cat = "Not a designated beneficiary";
        deadline = after ? "Over the owner's remaining life expectancy" : "End of the 5th year after death";
        annual = after ? "Yes, over the owner's remaining life expectancy" : "No";
        note = after ? "With no designated beneficiary, distributions continue over the owner's own remaining single life expectancy, reduced by one each year." : "The 5-year rule applies: the account must be emptied by December 31 of the year containing the fifth anniversary of the death.";
      } else if (who === "other") {
        cat = "Designated beneficiary (not eligible)";
        deadline = "Dec. 31 of the 10th year after death";
        annual = after ? "Yes, in years 1–9" : "No";
        note = after ? "The 10-year rule applies and, because the owner had reached the required beginning date, annual minimums based on the longer of the two life expectancies are required in years 1–9." : "The 10-year rule applies with no annual minimum. Timing is your choice, but waiting until year 10 can bunch a large amount of income into one year.";
      } else if (who === "spouse") {
        cat = "Eligible designated beneficiary";
        deadline = "Can treat the account as their own";
        annual = roth ? "None during the spouse's life if treated as own" : "Depends on the option chosen";
        note = "A sole spouse beneficiary can treat the IRA as their own (their own required-distribution age and Uniform Lifetime Table), remain a beneficiary using the Single Life Table, or, if the owner died before the required beginning date, delay distributions until the year the owner would have reached that age. The 10-year rule is also available as an election in that case.";
      } else if (who === "minor") {
        cat = "Eligible designated beneficiary";
        deadline = "10 years after the child turns 21";
        annual = roth ? "Life-expectancy payments, tax-free" : "Yes, life-expectancy payments";
        note = "A child of the owner who has not reached 21 takes annual payments over their single life expectancy. At 21 the 10-year clock starts, and annual payments continue until the account is empty by the end of the tenth year.";
      } else {
        cat = "Eligible designated beneficiary";
        deadline = "Can stretch over life expectancy";
        annual = "Yes, life-expectancy payments";
        note = (who === "ten" ? "Someone not more than 10 years younger than the owner (for example a sibling or partner of similar age)" : "A disabled or chronically ill beneficiary, with the documentation the regulations require,") + " may take payments over their own single life expectancy. At their death, their own beneficiary must finish within 10 years.";
      }
      self(el, "k").innerHTML = kpi("Category", esc(cat)) + kpi("Must be empty by", esc(deadline)) + kpi("Annual minimums before then?", esc(annual)) + kpi("Withdrawals taxed?", roth ? "Qualified: no" : "Yes, as ordinary income");
      self(el, "n2").innerHTML = note + (roth ? " Roth withdrawals are tax-free once the account has met the five-year holding rule; earnings withdrawn earlier can be taxable." : "");
    }
    wire(el, run);
  };

  /* ---------- 5. Annual-exclusion gift planner (INV-092) ---------- */
  TOOLS.s12bGiftPlanner = function (el) {
    var u = uid(el);
    shell(el, "How much can annual-exclusion gifts move out of an estate?", "Calculator",
      sel(u + "-don", "Who is giving?", [["1", "One person"], ["2", "A married couple (each gives, or they split gifts)", 1]]) +
      rng(u + "-r", "Number of recipients", 1, 12, 1, 3) +
      rng(u + "-s", "Of these, 529 recipients superfunded in year 1", 0, 12, 1, 0) +
      rng(u + "-n", "Years of giving", 1, 30, 1, 10, "yr") +
      rng(u + "-g", "Growth of the gifted money", 0, 10, 0.5, 6, "pct") +
      sel(u + "-e", "Would the money otherwise face estate tax?", [["0", "No: estate below the exemption", 1], ["0.4", "Yes: 40% at the margin"]]) +
      hint("Annual exclusion $19,000 per donor per recipient for 2026 (Rev. Proc. 2025-32), held flat here although it is indexed. A 529 superfund uses the five-year election of IRC 529(c)(2)(B): $95,000 per donor per beneficiary in year 1, then no more exclusion gifts to that person for years 2&ndash;5. Gifts are made at the start of each year."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var D = Number(self(el, "don").value), R = Number(self(el, "r").value), S = Math.min(R, Number(self(el, "s").value)), n = Number(self(el, "n").value), g = Number(self(el, "g").value) / 100, et = Number(self(el, "e").value);
      var EX = 19000, given = 0, val = 0, pG = [[0, 0]], pV = [[0, 0]];
      for (var y = 1; y <= n; y++) {
        var gift = (R - S) * EX * D + (y === 1 ? S * 5 * EX * D : (y > 5 ? S * EX * D : 0));
        given += gift; val = (val + gift) * (1 + g);
        pG.push([y, given]); pV.push([y, val]);
      }
      self(el, "k").innerHTML = kpi("Given, no exemption used", money(given), "good") + kpi("Worth after " + n + " years", money(val)) +
        kpi("Growth kept out of the estate", money(val - given)) + kpi("Estate tax avoided", money(val * et), et ? "good" : "");
      INV.lineChart(self(el, "c"), { label: "Gifts and their growth", height: 240, xTitle: "Years of giving", xFmt: yearFmt, yFmt: ms,
        series: [{ name: "Value of the gifts, grown", color: "var(--s2)", data: pV, area: true }, { name: "Total given", color: "var(--s3)", data: pG, dash: "5 4" }] });
      self(el, "n2").innerHTML = (D === 2 ? "Two donors" : "One donor") + " giving to " + R + (R === 1 ? " person" : " people") + " for " + n + " years moves <b>" + money(given) + "</b> without touching the lifetime exemption ($15 million per person for 2026). " +
        (S ? "Superfunding front-loads " + money(S * 5 * EX * D) + " into 529s in year 1, so more of it grows inside the family's accounts. Each donor files Form 709 to make the five-year election. " : "") +
        (et ? "If the estate would be taxed, every dollar removed, including growth, saves 40 cents." : "Below the exemption there is no estate tax to save; gifting is then about helping people sooner, and income-tax basis matters more (INV-090).");
    }
    wire(el, run);
  };

  /* ---------- 6. Family loan at the applicable federal rate (INV-092) ---------- */
  var AFR = { s: 4.17, m: 4.52, l: 5.10 }; /* Rev. Rul. 2026-19, October 2026, monthly compounding */
  TOOLS.s12bFamilyLoan = function (el) {
    var u = uid(el);
    shell(el, "A family loan at the applicable federal rate", "Calculator",
      numf(u + "-p", "Loan amount ($)", 60000, 1000) +
      rng(u + "-n", "Term", 1, 30, 1, 9, "yr") +
      rng(u + "-r", "Interest rate the family charges", 0, 10, 0.01, 4.52, "pct") +
      rng(u + "-b", "Rate a lender would charge (your estimate)", 0, 12, 0.25, 6.5, "pct") +
      hint("Applicable federal rates for October 2026, monthly compounding (Rev. Rul. 2026-19): short-term (3 years or less) 4.17%, mid-term (over 3 to 9 years) 4.52%, long-term (over 9 years) 5.10%. Monthly payments, fully amortized. Charging less than the AFR makes the loan a below-market gift loan under IRC 7872 unless an exception applies; the up-front gift discounts the payments at the monthly-compounded AFR."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function pay(P, a, n) { var i = a / 100 / 12, m = n * 12; return i === 0 ? P / m : P * i / (1 - Math.pow(1 + i, -m)); }
    function run() {
      var P = num(el, "p"), n = Number(self(el, "n").value), r = Number(self(el, "r").value), bk = Number(self(el, "b").value);
      var afr = n <= 3 ? AFR.s : n <= 9 ? AFR.m : AFR.l, tier = n <= 3 ? "short-term" : n <= 9 ? "mid-term" : "long-term";
      var pm = pay(P, r, n), pmB = pay(P, bk, n), pmA = pay(P, afr, n);
      var intR = pm * n * 12 - P, intB = pmB * n * 12 - P, intA = pmA * n * 12 - P;
      var forgone = Math.max(0, afr - r) / 100 * P;
      var ia = afr / 100 / 12, pvA = pm * (1 - Math.pow(1 + ia, -n * 12)) / ia, giftUp = r < afr ? Math.max(0, P - pvA) : 0;
      self(el, "k").innerHTML = kpi("AFR for this term", afr.toFixed(2) + "% (" + tier + ")") + kpi("Monthly payment", money(pm, 2)) +
        kpi("Interest paid to the family", money(intR)) + kpi("Saved versus the lender", money(intB - intR), intB >= intR ? "good" : "bad") +
        kpi("Below-AFR shortfall, year 1", money(forgone), forgone > 0 ? "bad" : "good") + kpi("Gift at the start (term loan)", money(giftUp), giftUp > 0 ? "bad" : "good");
      INV.barChart(self(el, "c"), { label: "Total interest over the loan", height: 220, allLabels: true, valueLabels: true, yFmt: ms, tipFmt: function (v) { return money(v); },
        data: [{ label: "Lender at " + bk.toFixed(2) + "%", y: intB, color: "var(--s5)" }, { label: "AFR " + afr.toFixed(2) + "%", y: intA, color: "var(--s2)" }, { label: "Family at " + r.toFixed(2) + "%", y: intR, color: "var(--s1)" }] });
      self(el, "n2").innerHTML = "At the AFR, the interest stays in the family instead of going to a bank, and the loan is not a gift. " +
        (forgone > 0 ? "At " + r.toFixed(2) + "%, roughly <b>" + money(forgone) + "</b> of interest is forgone in the first year. For income tax, forgone interest is treated as interest the lender receives each year. For gift tax, because this is a term loan, the gift is counted once, when the loan is made: the amount lent minus the present value of the payments at the AFR, about <b>" + money(giftUp) + "</b> here (IRC 7872(b) and (d)(2)); a demand loan instead makes the forgone interest a gift each year. Exceptions: total loans between the two of $10,000 or less (not used to buy income-producing assets), and, for income tax only, loans of $100,000 or less, where the imputed interest is capped at the borrower's net investment income and treated as zero if that is $1,000 or less. " : "") +
        "Put it in writing, set a payment schedule and actually collect: loans that are never enforced tend to be treated as gifts.";
    }
    wire(el, run);
  };

  /* ---------- 7. Charitable remainder unitrust (INV-093) ---------- */
  TOOLS.s12bCRUT = function (el) {
    var u = uid(el);
    shell(el, "Charitable remainder unitrust versus selling and reinvesting", "Calculator",
      numf(u + "-v", "Value of appreciated stock ($)", 220000, 1000) +
      numf(u + "-b", "Cost basis ($)", 70000, 1000) +
      rng(u + "-p", "Payout rate (5% to 50% by law)", 5, 50, 1, 5, "pct") +
      rng(u + "-n", "Term (up to 20 years)", 1, 20, 1, 20, "yr") +
      rng(u + "-g", "Total return of the investments", 0, 12, 0.5, 7, "pct") +
      rng(u + "-t", "Tax rate on the gain if sold outside the trust", 0, 33.8, 0.1, 18.8, "pct") +
      hint("Term-of-years unitrust paying at the start of each year. The remainder factor is (1 &minus; payout)<sup>n</sup>; the IRS computation adjusts for payment timing (Treas. Reg. 1.664-4). The remainder must be worth at least 10% of the initial value (IRC 664(d)(2)(D)). Payouts are taxed to you as the trust's income and gains are carried out, so the deferred gain is taxed over time."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var V = num(el, "v"), B = num(el, "b"), p = Number(self(el, "p").value) / 100, n = Number(self(el, "n").value), g = Number(self(el, "g").value) / 100, t = Number(self(el, "t").value) / 100;
      var rf = Math.pow(1 - p, n), ded = V * rf, pass = rf >= 0.1;
      var tv = V, alt = V - t * Math.max(0, V - B), alt0 = alt, pay = 0, ap = 0, pT = [], pA = [];
      for (var y = 1; y <= n; y++) { var pp = tv * p, aa = alt * p; pay += pp; ap += aa; pT.push([y, pp]); pA.push([y, aa]); tv = (tv - pp) * (1 + g); alt = (alt - aa) * (1 + g); }
      self(el, "k").innerHTML = kpi("Charitable deduction (approx.)", money(ded)) + kpi("10% remainder test", pass ? "Passes (" + pct(rf * 100, 1) + ")" : "Fails (" + pct(rf * 100, 1) + ")", pass ? "good" : "bad") +
        kpi("Payments from the trust", money(pay), "good") + kpi("Payments if sold first", money(ap)) + kpi("Left for charity at the end", money(tv));
      INV.lineChart(self(el, "c"), { label: "Yearly payments", height: 240, xTitle: "Year", xFmt: yearFmt, yFmt: ms,
        series: [{ name: "Unitrust payout (whole value invested)", color: "var(--s2)", data: pT }, { name: "Sell, pay tax, reinvest, same payout rate", color: "var(--s3)", data: pA, dash: "5 4" }] });
      self(el, "n2").innerHTML = "Selling first costs " + money(V - alt0) + " of capital gains tax, so only " + money(alt0) + " is reinvested. Inside the trust the whole " + money(V) + " stays invested, so every payment is larger. In exchange, the " +
        money(tv) + " left after " + n + " years goes to charity instead of heirs (the other path leaves " + money(alt) + " for the family). " + (pass ? "" : "<b>This design fails the 10% test</b>; lower the payout or shorten the term.");
    }
    wire(el, run);
  };

  /* ---------- 8. Which asset should fund the bequest? (INV-093) ---------- */
  TOOLS.s12bLegacyMix = function (el) {
    var u = uid(el);
    shell(el, "Leave charity the IRA or the other assets?", "Calculator",
      numf(u + "-ira", "Traditional IRA at death ($)", 500000, 5000) +
      numf(u + "-oth", "Other assets: home, stock, cash ($)", 300000, 5000) +
      numf(u + "-beq", "Charitable bequest ($)", 100000, 1000) +
      rng(u + "-t", "Heir's income-tax rate on IRA withdrawals", 0, 37, 1, 24, "pct") +
      hint("Charities pay no income tax on IRA money. Heirs pay ordinary income tax on inherited traditional IRA withdrawals (income in respect of a decedent), but inherited stock and a home get a stepped-up basis. Estate tax ignored (below the exemption)."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var I = num(el, "ira"), O = num(el, "oth"), Bq = num(el, "beq"), t = Number(self(el, "t").value) / 100;
      var fromIra = Math.min(Bq, I), fromOth = Math.min(Bq, O);
      var a = (I - fromIra) * (1 - t) + O + (Bq - fromIra > 0 ? -Math.min(O, Bq - fromIra) : 0);
      var b = I * (1 - t) + O - fromOth - (Bq - fromOth > 0 ? Math.min(I, Bq - fromOth) * (1 - t) : 0);
      self(el, "k").innerHTML = kpi("Heirs keep: charity gets IRA", money(a), a >= b ? "good" : "") + kpi("Heirs keep: charity gets other assets", money(b), b > a ? "good" : "") +
        kpi("Difference", money(Math.abs(a - b)), "good") + kpi("Charity receives either way", money(Math.min(Bq, I + O)));
      INV.barChart(self(el, "c"), { label: "What heirs keep after income tax", height: 220, allLabels: true, valueLabels: true, yFmt: ms, tipFmt: function (v) { return money(v); },
        data: [{ label: "IRA to charity", tip: "Charity named on the IRA", y: a, color: "var(--s2)" }, { label: "Other assets to charity", tip: "Charity paid from other assets", y: b, color: "var(--s6)" }] });
      self(el, "n2").innerHTML = "The charity receives the same gift either way. Naming it as beneficiary of " + money(fromIra) + " of the IRA means that money is never taxed, while the heirs receive assets with a stepped-up basis. The family keeps about <b>" + money(Math.abs(a - b)) + "</b> more, roughly the bequest times the heir's tax rate.";
    }
    wire(el, run);
  };

  /* ---------- 9. Buy-sell funding after Connelly (INV-094) ---------- */
  TOOLS.s12bBuySell = function (el) {
    var u = uid(el);
    shell(el, "Buy-sell agreements: who should own the life insurance?", "Calculator",
      numf(u + "-v", "Company value, excluding the insurance ($)", 3860000, 10000) +
      numf(u + "-i", "Life insurance paid at the owner's death ($)", 3000000, 10000) +
      numf(u + "-p", "Deceased owner's share of the company (%)", 77.18, 0.01) +
      rng(u + "-t", "Estate tax rate at the margin", 0, 40, 1, 40, "pct") +
      hint("Defaults are the facts in Connelly v. United States, 602 U.S. 257 (2024). Entity redemption: the company owns the policy, so the proceeds are a company asset when the shares are valued. Cross-purchase: the other owner holds the policy, so the proceeds never sit in the company. Set the rate to 0% if the estate is below the exemption."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var V = num(el, "v"), I = num(el, "i"), s = Math.min(100, num(el, "p")) / 100, t = Number(self(el, "t").value) / 100;
      var ent = s * (V + I), cross = s * V, diff = ent - cross;
      self(el, "k").innerHTML = kpi("Shares' value, company owns policy", money(ent), "bad") + kpi("Shares' value, cross-purchase", money(cross), "good") +
        kpi("Extra value in the estate", money(diff), "bad") + kpi("Extra estate tax at " + pct(t * 100, 0), money(diff * t), diff * t > 0 ? "bad" : "");
      INV.barChart(self(el, "c"), { label: "Value of the deceased owner's shares", height: 220, allLabels: true, valueLabels: true, yFmt: ms, tipFmt: function (v) { return money(v); },
        data: [{ label: "Entity redemption", y: ent, color: "var(--s5)" }, { label: "Cross-purchase", y: cross, color: "var(--s2)" }] });
      self(el, "n2").innerHTML = "In <i>Connelly</i> the Supreme Court held, unanimously, that the company's duty to redeem the shares did not offset the insurance proceeds. At these inputs the estate is valued at " + money(ent) + " instead of " + money(cross) +
        ". The Court noted a cross-purchase agreement would have avoided this, at the cost of each owner paying premiums on the other. Any restructuring of an existing agreement needs a lawyer.";
    }
    wire(el, run);
  };

  /* ---------- 10. Installment sale of a business (INV-094) ---------- */
  TOOLS.s12bInstallment = function (el) {
    var u = uid(el);
    shell(el, "Selling a business on an installment note", "Calculator",
      numf(u + "-pr", "Sale price ($)", 1200000, 10000) +
      numf(u + "-b", "Seller's basis in the business ($)", 200000, 10000) +
      rng(u + "-d", "Down payment", 0, 50, 5, 10, "pct") +
      rng(u + "-n", "Years of payments", 1, 20, 1, 9, "yr") +
      rng(u + "-r", "Interest rate on the note", 0, 10, 0.01, 4.61, "pct") +
      rng(u + "-t", "Seller's tax rate on the gain", 0, 33.8, 0.1, 18.8, "pct") +
      hint("Installment method, IRC 453(c): each year's gain = principal received &times; gross profit ratio (gain &divide; price). Annual payments on an amortizing note. The mid-term AFR for October 2026 is 4.61% with annual compounding (Rev. Rul. 2026-19). Ignores depreciation recapture and inventory, which cannot be deferred, and interest-charge rules for very large notes."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var P = num(el, "pr"), B = num(el, "b"), d = Number(self(el, "d").value) / 100, n = Number(self(el, "n").value), r = Number(self(el, "r").value) / 100, t = Number(self(el, "t").value) / 100;
      var gain = Math.max(0, P - B), gpr = P > 0 ? gain / P : 0, note = P * (1 - d);
      var pmt = r === 0 ? note / n : note * r / (1 - Math.pow(1 + r, -n)), bal = note, totInt = 0, rows = [{ label: "Sale", y: P * d * gpr }];
      for (var y = 1; y <= n; y++) { var it = bal * r, pr = pmt - it; bal -= pr; totInt += it; rows.push({ label: String(y), y: pr * gpr }); }
      self(el, "k").innerHTML = kpi("Gross profit ratio", pct(gpr * 100, 1)) + kpi("Gain taxed in the year of sale", money(P * d * gpr)) + kpi("Tax if paid all at once", money(gain * t), "bad") +
        kpi("Tax in the year of sale", money(P * d * gpr * t), "good") + kpi("Annual payment", money(pmt)) + kpi("Interest earned (taxed as income)", money(totInt));
      INV.barChart(self(el, "c"), { label: "Gain recognized each year", height: 220, allLabels: true, yFmt: ms, xTitle: "Year", tipFmt: function (v) { return money(v) + " of gain; tax " + money(v * t); },
        data: rows.map(function (x, i) { return { label: x.label, y: x.y, color: i === 0 ? "var(--s3)" : "var(--s1)" }; }) });
      self(el, "n2").innerHTML = "Instead of " + money(gain * t) + " of tax in one year, the seller pays about " + money(P * d * gpr * t) + " now and the rest as principal arrives. The risk is the buyer: the note is only as good as the business's ability to pay. " +
        "If the buyer is a related person who resells within two years, the seller is treated as receiving the resale proceeds (IRC 453(e)).";
    }
    wire(el, run);
  };

  /* ---------- 11. Paying estate tax over time under section 6166 (INV-094) ---------- */
  TOOLS.s12b6166 = function (el) {
    var u = uid(el);
    shell(el, "Deferring estate tax on a family business (section 6166)", "Calculator",
      numf(u + "-e", "Adjusted gross estate ($)", 20000000, 100000) +
      numf(u + "-b", "Closely held business in the estate ($)", 12000000, 100000) +
      rng(u + "-d", "First installment, years after the due date (up to 5)", 1, 5, 1, 5) +
      rng(u + "-kin", "Number of installments (up to 10)", 2, 10, 1, 10) +
      rng(u + "-u", "IRS underpayment rate", 3, 12, 1, 7, "pct") +
      hint("Simplified: taxable estate = adjusted gross estate, no marital or charitable deduction, 2026 exemption $15,000,000, 40% rate above it. Qualifies if the business is more than 35% of the adjusted gross estate. Interest: 2% on the \"2-percent portion\" (40% of $1,940,000 = $776,000 for 2026 deaths) and 45% of the underpayment rate on the rest (7% for October&ndash;December 2026). Interest is paid every year."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var E = num(el, "e"), Bz = Math.min(num(el, "b"), E), dly = Number(self(el, "d").value), k = Number(self(el, "kin").value), ur = Number(self(el, "u").value) / 100;
      var tax = 0.4 * Math.max(0, E - 15000000), share = E > 0 ? Bz / E : 0, ok = share > 0.35, def = ok ? tax * share : 0;
      var two = Math.min(776000, def), hi = 0.45 * ur, bal = def, totI = 0, rows = [];
      for (var y = 1; y < dly + k; y++) {
        var f = bal > 0 && def > 0 ? bal / def : 0, it = two * f * 0.02 + (def - two) * f * hi, pr = y >= dly ? def / k : 0;
        totI += it; bal = Math.max(0, bal - pr); rows.push({ label: String(y), y: it + pr, tip: "Year " + y + ": interest " + money(it) + ", tax " + money(pr) });
      }
      self(el, "k").innerHTML = kpi("Estate tax (simplified)", money(tax)) + kpi("Business share of estate", pct(share * 100, 1)) + kpi("Qualifies (over 35%)?", ok ? "Yes" : "No", ok ? "good" : "bad") +
        kpi("Tax that can be deferred", money(def)) + kpi("Blended interest rate", def > 0 ? pct((two * 0.02 + (def - two) * hi) / def * 100, 2) : pct(0, 2)) + kpi("Total interest", money(totI));
      INV.barChart(self(el, "c"), { label: "Payments on the deferred tax", height: 220, allLabels: true, yFmt: ms, xTitle: "Year after the estate tax due date", tipFmt: function (v) { return money(v); },
        data: rows.map(function (x) { return { label: x.label, tip: x.tip, y: x.y, color: "var(--s1)" }; }) });
      self(el, "n2").innerHTML = ok ? "Instead of raising " + money(def) + " within nine months of death, perhaps by selling the business, the estate pays " + (dly > 1 ? "only interest for " + (dly - 1) + (dly === 2 ? " year" : " years") + ", then " : "") + k + " annual installments of " + money(def / k) + " starting in year " + dly + ", with interest on the unpaid balance each year. Selling or withdrawing a large part of the business can speed up the remaining tax (IRC 6166(g))."
        : "The business must be worth more than 35% of the adjusted gross estate. Here it is " + pct(share * 100, 1) + ", so the estate tax is due in full nine months after death.";
    }
    wire(el, run);
  };
})();
