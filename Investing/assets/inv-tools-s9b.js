/* Investing Learning Lab - Stage 9 real estate calculators (INV-068 to INV-071) - V1.0 (September 2026)
   Load after assets/inv-tools.js. Every result is computed in the browser from the formula stated
   in the tool's note. Tax rules follow IRS Publications 527, 544, 925 and 946 (2025 editions) and
   Rev. Proc. 2025-32 (tax year 2026). Educational estimates, not tax advice. */
(function () {
  "use strict";
  var INV = window.INV; if (!INV || !INV.tools) return;
  var esc = INV.esc, money = INV.money, ms = INV.moneyShort, pct = INV.pct;
  var TOOLS = INV.tools;

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
  function sel(id, label, opts, val) {
    return '<div class="fld"><label for="' + id + '">' + esc(label) + '</label><select id="' + id + '">' + opts.map(function (o) {
      return '<option value="' + esc(String(o[0])) + '"' + (String(o[0]) === String(val) ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select></div>";
  }
  function hint(t) { return '<p class="hint" style="font-size:.76rem;color:var(--muted)">' + t + "</p>"; }
  function self(el, id) { return el.querySelector("#" + el.dataset.uid + "-" + id); }
  function uid(el) { if (!el.dataset.uid) el.dataset.uid = "s" + Math.random().toString(36).slice(2, 8); return el.dataset.uid; }
  function fmtOut(input) {
    var o = input.parentNode.querySelector("output"); if (!o) return;
    var f = input.getAttribute("data-fmt"), v = Number(input.value);
    var dec = input.step.indexOf(".") > -1 ? input.step.split(".")[1].length : 0;
    o.textContent = f === "pct" ? v.toFixed(dec) + "%" : f === "yr" ? v + (v === 1 ? " year" : " years") : f === "money" ? money(v) :
      f === "nights" ? v + (v === 1 ? " night" : " nights") : f === "mo" ? v + (v === 1 ? " month" : " months") : String(v);
  }
  function wire(el, fn) {
    el.querySelectorAll("input,select").forEach(function (i) {
      i.addEventListener("input", function () { if (i.type === "range") fmtOut(i); fn(); });
      i.addEventListener("change", fn);
      if (i.type === "range") fmtOut(i);
    });
    fn();
    document.addEventListener("inv-theme", fn);
  }
  function kpi(k, v, cls) { return '<div class="kpi"><div class="k">' + esc(k) + '</div><div class="v ' + (cls || "") + '">' + v + "</div></div>"; }
  function num(el, id) { var v = Number(self(el, id).value); return isFinite(v) && v > 0 ? v : 0; }
  function yearFmt(v) { return Math.abs(v - Math.round(v)) > 1e-9 ? "" : String(Math.round(v)); }
  function fin(x) { return isFinite(x) ? x : 0; }
  function sgnMoney(v) { return (v < 0 ? "−" : "") + money(Math.abs(v)); }
  var RATES = [[10, "10%"], [12, "12%"], [22, "22%"], [24, "24%"], [32, "32%"], [35, "35%"], [37, "37%"]];
  var CGR = [[0, "0%"], [15, "15%"], [20, "20%"]];
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function payment(P, rAnnual, years) { var r = rAnnual / 12, n = years * 12; if (P <= 0) return 0; if (r === 0) return P / n; return P * r / (1 - Math.pow(1 + r, -n)); }

  /* ---------- 1. Depreciation and sale (INV-068) ---------- */
  TOOLS.s9bDepSale = function (el) {
    var u = uid(el);
    shell(el, "Depreciation, then sale: what you keep", "Tax calculator",
      sel(u + "-cls", "Property type", [["27.5", "Residential rental (27.5 years)"], ["39", "Nonresidential, e.g. an office or store (39 years)"]], "27.5") +
      numf(u + "-p", "Purchase price including buying costs ($)", 400000, 1000) +
      rng(u + "-l", "Share of price that is land (not depreciable)", 0, 60, 1, 20, "pct") +
      sel(u + "-m", "Month placed in service (year 1)", MONTHS.map(function (m, i) { return [i + 1, m]; }), 7) +
      rng(u + "-h", "Sold in December of year", 2, 40, 1, 10) +
      numf(u + "-s", "Sale price ($)", 560000, 1000) +
      rng(u + "-c", "Selling costs (commission, transfer tax, fees)", 0, 10, 0.5, 6, "pct") +
      sel(u + "-o", "Your ordinary income tax bracket", RATES, 24) + sel(u + "-g", "Your long-term capital gain rate", CGR, 15) +
      sel(u + "-n", "Net investment income tax (3.8%) applies?", [["1", "Yes — income above the threshold"], ["0", "No"]], "1") +
      rng(u + "-st", "State income tax rate on the gain", 0, 11, 0.25, 0, "pct") +
      numf(u + "-sp", "Suspended passive losses released at sale ($)", 0, 500, "Losses you could not deduct in earlier years") +
      hint("Straight-line depreciation with the mid-month convention (IRS Pub. 946). The part of the gain equal to depreciation is unrecaptured §1250 gain, taxed at your ordinary rate but no more than 25%; the rest is long-term capital gain. Ignores any mortgage payoff, which does not change the tax."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var L = Number(self(el, "cls").value), P = num(el, "p"), land = Number(self(el, "l").value) / 100, m = Number(self(el, "m").value), H = Number(self(el, "h").value);
      var S = num(el, "s"), sc = Number(self(el, "c").value) / 100, ord = Number(self(el, "o").value) / 100, cgr = Number(self(el, "g").value) / 100;
      var niit = self(el, "n").value === "1" ? 0.038 : 0, st = Number(self(el, "st").value) / 100, susp = num(el, "sp");
      var B = P * (1 - land), annual = B / L, yrs = (12 - m + 0.5) / 12 + Math.max(0, H - 2) + 11.5 / 12;
      var dep = Math.min(B, annual * yrs), adj = P - dep, AR = S * (1 - sc), gain = AR - adj;
      var g = Math.max(0, gain), unrec = Math.min(dep, g), cap = g - unrec;
      var t1 = unrec * Math.min(ord, 0.25), t2 = cap * cgr, t3 = g * (niit + st), tax = t1 + t2 + t3, save = susp * (ord + st);
      var net = AR - tax + save;
      self(el, "k").innerHTML = kpi("Depreciation deducted", money(dep)) + kpi("Adjusted basis at sale", money(adj)) +
        kpi(gain >= 0 ? "Taxable gain" : "Loss on sale", sgnMoney(gain), gain >= 0 ? "" : "bad") + kpi("Tax on the sale", money(tax), tax > 0 ? "bad" : "") +
        kpi("Cash kept from the sale, after tax", money(net), "good") + kpi("Tax a full 1031 exchange could defer", money(tax));
      INV.barChart(self(el, "ch"), { label: "Gain and tax by piece", height: 230, allLabels: true, valueLabels: true, yFmt: ms, tipFmt: function (v) { return money(v); },
        data: [{ label: "Gain from depreciation", y: unrec, color: "var(--s3)" }, { label: "Gain from price rise", y: cap, color: "var(--s1)" },
          { label: "Tax: depreciation part", y: t1, color: "var(--s5)" }, { label: "Tax: price-rise part", y: t2, color: "var(--s5)" }, { label: "NIIT and state", y: t3, color: "var(--s6)" }] });
      self(el, "n2").innerHTML = "Building basis " + money(B) + " ÷ " + L + " years = <b>" + money(annual) + "</b> of depreciation a year (first year " + money(annual * (12 - m + 0.5) / 12) + " for a " + MONTHS[m - 1] + " start). " +
        "Amount realized " + money(S) + " − " + pct(sc * 100, 1) + " selling costs = " + money(AR) + "; minus adjusted basis " + money(adj) + " = " + (gain >= 0 ? "gain" : "loss") + " of <b>" + sgnMoney(gain) + "</b>. " +
        (gain > 0 ? money(unrec) + " is unrecaptured §1250 gain taxed at " + pct(Math.min(ord, 0.25) * 100, 0) + "; " + money(cap) + " is capital gain at " + pct(cgr * 100, 0) + ". " : "A loss on a rental sold to an unrelated buyer is generally deductible; no tax on the sale. ") +
        (susp > 0 ? "Selling your entire interest in a fully taxable sale frees the " + money(susp) + " of suspended losses, worth about " + money(save) + " at your rates. " : "") +
        "Depreciation lowers your tax each year you own the property and raises it when you sell: over " + H + " years it saved about " + money(dep * ord) + " at a " + pct(ord * 100, 0) + " rate, and the sale gives back " + money(t1) + " of that.";
    }
    wire(el, run);
  };

  /* ---------- 2. Passive loss allowance (INV-068) ---------- */
  TOOLS.s9bPassive = function (el) {
    var u = uid(el);
    shell(el, "Can you deduct your rental loss this year?", "Tax calculator",
      sel(u + "-f", "Filing status", [["std", "Single, head of household or married filing jointly"], ["mfs", "Married filing separately, lived apart all year"]], "std") +
      numf(u + "-m", "Modified adjusted gross income ($)", 145000, 1000) +
      numf(u + "-l", "Net loss from rental real estate this year ($)", 18000, 500) +
      numf(u + "-pi", "Income from other passive activities ($)", 0, 500) +
      sel(u + "-t", "Your role", [["active", "I actively participate (approve tenants, set rents, approve repairs) and own at least 10%"], ["rep", "Real estate professional who materially participates"], ["none", "Neither (for example, a limited partner in a syndication)"]], "active") +
      hint("Special $25,000 allowance ($12,500 married filing separately and living apart), reduced by 50% of MAGI above $100,000 ($50,000); gone at $150,000 ($75,000). Amounts from IRS Pub. 925; they are fixed in the statute rather than adjusted for inflation."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var mfs = self(el, "f").value === "mfs", M = num(el, "m"), loss = num(el, "l"), pi = num(el, "pi"), role = self(el, "t").value;
      var max = mfs ? 12500 : 25000, start = mfs ? 50000 : 100000;
      var allow = Math.max(0, max - 0.5 * Math.max(0, M - start));
      var viaPassive = Math.min(loss, pi), rest = loss - viaPassive, allowed, why;
      if (role === "rep") { allowed = loss; why = "As a real estate professional who materially participates, the rental is not passive: the whole loss offsets wages and other income."; }
      else if (role === "active") { var extra = Math.min(rest, allow); allowed = viaPassive + extra; why = "The loss first offsets " + money(viaPassive) + " of other passive income; the special allowance at your MAGI is <b>" + money(allow) + "</b>."; }
      else { allowed = viaPassive; why = "Without active participation the loss can offset only passive income. Limited partners generally are not treated as actively participating."; }
      var carry = loss - allowed;
      self(el, "k").innerHTML = kpi("Special allowance at this MAGI", money(role === "rep" ? max : allow)) + kpi("Loss you can deduct now", money(allowed), "good") +
        kpi("Suspended, carried forward", money(carry), carry > 0 ? "bad" : "");
      var pts = []; for (var x = 0; x <= 200000; x += 5000) pts.push([x, Math.max(0, max - 0.5 * Math.max(0, x - start))]);
      INV.lineChart(self(el, "ch"), { label: "Special allowance by income", height: 220, xTitle: "Modified adjusted gross income", yTitle: "Allowance", xFmt: ms, yFmt: ms,
        series: [{ name: "Special allowance", color: "var(--s1)", data: pts, area: true }], dots: [{ x: Math.min(M, 200000), y: Math.max(0, max - 0.5 * Math.max(0, Math.min(M, 200000) - start)), label: money(allow), color: "var(--s5)", anchor: M > 120000 ? "end" : "start", dx: M > 120000 ? -8 : 8 }] });
      self(el, "n2").innerHTML = why + (carry > 0 ? " The " + money(carry) + " left over is not lost: it carries forward, offsets future passive income, and is released in full when you sell your entire interest to an unrelated buyer in a taxable sale." : " Nothing is suspended this year.");
    }
    wire(el, run);
  };

  /* ---------- 3. Cost segregation and bonus depreciation (INV-068) ---------- */
  TOOLS.s9bCostSeg = function (el) {
    var u = uid(el);
    var T5 = [0.20, 0.32, 0.192, 0.1152, 0.1152, 0.0576];
    shell(el, "Cost segregation: moving deductions forward", "Tax calculator",
      numf(u + "-b", "Depreciable building basis ($)", 320000, 1000) +
      rng(u + "-s", "Share a study reclassifies as 5-year property", 0, 40, 1, 20, "pct") +
      sel(u + "-bo", "Bonus depreciation on that share", [["1", "100% (acquired and placed in service after Jan. 19, 2025)"], ["0", "None (elected out) — 5-year MACRS table"]], "1") +
      sel(u + "-m", "Month placed in service", MONTHS.map(function (m, i) { return [i + 1, m]; }), 7) +
      sel(u + "-r", "Your ordinary tax bracket", RATES, 24) +
      hint("The rest of the building stays on 27.5-year straight line. Real studies also find 7- and 15-year items; this model puts the whole reclassified share in 5-year property. The 5-year schedule is the half-year table in IRS Pub. 946 (20%, 32%, 19.2%, 11.52%, 11.52%, 5.76%)."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var B = num(el, "b"), s = Number(self(el, "s").value) / 100, bonus = self(el, "bo").value === "1", m = Number(self(el, "m").value), r = Number(self(el, "r").value) / 100;
      var short = B * s, long = B - short, f1 = (12 - m + 0.5) / 12;
      function slYear(base, y) { var a = base / 27.5; return y === 1 ? a * f1 : a; }
      var base = [], study = [], cb = 0, cs = 0;
      for (var y = 1; y <= 10; y++) {
        var d0 = slYear(B, y), d1 = slYear(long, y) + (bonus ? (y === 1 ? short : 0) : short * (T5[y - 1] || 0));
        cb += d0; cs += d1; base.push([y, cb]); study.push([y, cs]);
      }
      var y1b = slYear(B, 1), y1s = study[0][1];
      self(el, "k").innerHTML = kpi("Year-1 deduction, no study", money(y1b)) + kpi("Year-1 deduction, with study", money(y1s), "good") +
        kpi("Extra year-1 deduction", money(y1s - y1b)) + kpi("Tax deferred in year 1, if deductible", money((y1s - y1b) * r), "good");
      INV.lineChart(self(el, "ch"), { label: "Cumulative depreciation", height: 230, xTitle: "Year of ownership", yTitle: "Cumulative deductions", xFmt: yearFmt, yFmt: ms,
        series: [{ name: "With cost segregation", color: "var(--s2)", data: study }, { name: "Straight line only", color: "var(--s6)", data: base, dash: "5 4" }] });
      self(el, "n2").innerHTML = "Over 10 years the study adds " + money(cs - cb) + " of deductions in total, but only by pulling them forward: the lifetime total is still " + money(B) + ". " +
        "The value is the time value of the deferred tax — <b>if</b> you can use the loss. For most owners with a job, a large rental loss is passive and suspended (see the allowance calculator). " +
        "At sale, depreciation on the 5-year items is recaptured as ordinary income under §1245 at your full rate, not the 25% cap for buildings.";
    }
    wire(el, run);
  };

  /* ---------- 4. REIT dividend tax (INV-069) ---------- */
  TOOLS.s9bReitTax = function (el) {
    var u = uid(el);
    shell(el, "What a REIT dividend is worth after tax", "Tax calculator",
      numf(u + "-d", "REIT distributions received this year ($)", 10000, 100) +
      rng(u + "-o", "Share reported as ordinary / §199A dividends (Form 1099-DIV box 5)", 0, 100, 5, 80, "pct") +
      rng(u + "-c", "Share reported as capital gain distributions (box 2a)", 0, 100, 5, 5, "pct") +
      sel(u + "-r", "Your ordinary tax bracket", RATES, 24) + sel(u + "-g", "Your long-term capital gain rate", CGR, 15) +
      sel(u + "-n", "Net investment income tax (3.8%) applies?", [["0", "No"], ["1", "Yes — income above the threshold"]], "0") +
      sel(u + "-a", "Held in", [["tax", "A taxable brokerage account"], ["ira", "An IRA or 401(k)"]], "tax") +
      hint("The rest of the distribution is treated as a nondividend distribution (return of capital, box 3): not taxed now, but it lowers your cost basis. Qualified REIT dividends get the 20% §199A deduction, which P.L. 119-21 continued past 2025; it is also capped at 20% of taxable income minus net capital gain, and requires holding the shares more than 45 days around the ex-dividend date."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var D = num(el, "d"), so = Number(self(el, "o").value) / 100, sc = Math.min(Number(self(el, "c").value) / 100, 1 - so), r = Number(self(el, "r").value) / 100, g = Number(self(el, "g").value) / 100;
      var ni = self(el, "n").value === "1" ? 0.038 : 0, ira = self(el, "a").value === "ira";
      var ordA = D * so, capA = D * sc, roc = D - ordA - capA;
      var tax = ira ? 0 : ordA * 0.8 * r + capA * g + (ordA + capA) * ni;
      var qd = D * (g + ni), eff = D > 0 ? tax / D * 100 : 0;
      self(el, "k").innerHTML = kpi("Tax this year", money(tax), tax > 0 ? "bad" : "") + kpi("Effective rate on the distribution", pct(eff, 1)) +
        kpi("Tax if it were a qualified dividend", money(ira ? 0 : qd)) + kpi("Basis reduction (return of capital)", money(ira ? 0 : roc));
      var data = RATES.map(function (x) { return { label: x[1], tip: x[1] + " bracket, REIT ordinary dividend", y: x[0] * 0.8, color: x[0] === r * 100 ? "var(--s1)" : "var(--s6)" }; });
      INV.barChart(self(el, "ch"), { label: "Top rate on qualified REIT dividends by bracket", height: 210, allLabels: true, valueLabels: true, xTitle: "Ordinary bracket (after the 20% deduction)", yFmt: function (v) { return v.toFixed(1) + "%"; }, data: data });
      self(el, "n2").innerHTML = ira ? "Inside an IRA or 401(k) nothing is taxed this year. Withdrawals from a traditional account are later taxed as ordinary income, and the §199A deduction does not follow the money into the account; qualified Roth withdrawals are tax-free." :
        money(ordA) + " of ordinary REIT dividends × (1 − 20% deduction) × " + pct(r * 100, 0) + " = " + money(ordA * 0.8 * r) + "; " + money(capA) + " of capital gain distributions × " + pct(g * 100, 0) + " = " + money(capA * g) +
        (ni ? "; plus 3.8% NIIT on both" : "") + ". The bars show the top federal rate on a qualified REIT dividend in each bracket: 80% of the bracket rate.";
    }
    wire(el, run);
  };

  /* ---------- 5. Syndication fees and waterfall (INV-069) ---------- */
  TOOLS.s9bWaterfall = function (el) {
    var u = uid(el);
    shell(el, "What a private deal pays the sponsor, and you", "Model",
      numf(u + "-e", "Your investment ($)", 100000, 1000) +
      rng(u + "-g", "Return the property earns on equity, per year, before fees", 0, 20, 0.5, 12, "pct") +
      rng(u + "-t", "Years until the property is sold", 3, 10, 1, 5, "yr") +
      rng(u + "-a", "Acquisition fee, % of your equity", 0, 5, 0.25, 2, "pct") +
      rng(u + "-m", "Asset management fee, % of your equity per year", 0, 3, 0.25, 1.5, "pct") +
      rng(u + "-p", "Preferred return, compounded", 0, 10, 0.5, 8, "pct") +
      rng(u + "-s", "Sponsor's share of profit above the preferred return (promote)", 0, 40, 5, 30, "pct") +
      hint("A deliberately simple structure: all cash comes back at the sale; fees are charged on the equity you invested; you receive your capital plus the preferred return first, then profits above it split with the sponsor. Real deals add catch-ups, tiers, refinancing distributions and other fees, all spelled out in the private placement memorandum."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var E = num(el, "e"), g = Number(self(el, "g").value) / 100, T = Number(self(el, "t").value), a = Number(self(el, "a").value) / 100, am = Number(self(el, "m").value) / 100;
      var pr = Number(self(el, "p").value) / 100, ps = Number(self(el, "s").value) / 100;
      var v = E * (1 - a), gross = E, pv = [[0, E]], pg = [[0, E]], fees = E * a;
      for (var t = 1; t <= T; t++) { v = Math.max(0, v * (1 + g) - E * am); fees += E * am; gross *= 1 + g; pv.push([t, v]); pg.push([t, gross]); }
      var prefAmt = E * Math.pow(1 + pr, T), lp = v <= prefAmt ? v : prefAmt + (v - prefAmt) * (1 - ps), promote = v - lp;
      var irr = E > 0 && lp > 0 ? (Math.pow(lp / E, 1 / T) - 1) * 100 : -100;
      self(el, "k").innerHTML = kpi("Deal equity at sale, after fees", money(v)) + kpi("You receive", money(lp), lp >= E ? "good" : "bad") +
        kpi("Your return per year", E > 0 ? pct(irr, 1) : "0.0%", irr >= 0 ? "" : "bad") + kpi("Fees plus promote to sponsor", money(fees + promote), "bad");
      INV.lineChart(self(el, "ch"), { label: "Equity value through the deal", height: 230, xTitle: "Year", xFmt: yearFmt, yFmt: ms,
        series: [{ name: "Property return with no fees", color: "var(--s6)", data: pg, dash: "5 4" }, { name: "After acquisition and management fees", color: "var(--s1)", data: pv }],
        dots: [{ x: T, y: lp, label: "You: " + ms(lp), color: "var(--s5)", anchor: "end", dx: -8, dy: 16 }] });
      self(el, "n2").innerHTML = "The property earned " + pct(g * 100, 1) + " a year on equity. After fees and the sponsor's promote, you earned <b>" + (E > 0 ? pct(irr, 1) : "0.0%") + "</b> a year — a gap of " +
        pct(Math.max(0, g * 100 - irr), 1) + " points. " + (v <= prefAmt ? "The deal did not clear the preferred return, so no promote was paid; the preferred return is a priority, not a guarantee." : "The sponsor's promote was " + money(promote) + ".") +
        " Fees are paid whether or not the deal succeeds.";
    }
    wire(el, run);
  };

  /* ---------- 6. Short-term vs long-term rental (INV-070) ---------- */
  TOOLS.s9bStr = function (el) {
    var u = uid(el);
    shell(el, "Short-term rental or long-term lease?", "Calculator",
      numf(u + "-rate", "Average nightly rate ($)", 180, 5) + rng(u + "-occ", "Occupancy (share of nights booked)", 0, 100, 1, 60, "pct") +
      rng(u + "-stay", "Average stay", 1, 30, 1, 3, "nights") + numf(u + "-cf", "Cleaning fee charged per stay ($)", 90, 5) + numf(u + "-cc", "Your cleaning cost per stay ($)", 80, 5) +
      rng(u + "-pf", "Platform host fee, % of booking", 0, 20, 0.5, 3, "pct") + rng(u + "-mg", "Short-term manager, % of booking", 0, 35, 1, 0, "pct") +
      numf(u + "-fx", "Short-term extras per year: utilities, internet, supplies, furniture replacement ($)", 9000, 250) +
      numf(u + "-lr", "Long-term rent per month ($)", 2000, 25) + rng(u + "-lv", "Long-term vacancy", 0, 20, 1, 5, "pct") + rng(u + "-lm", "Long-term manager, % of rent", 0, 15, 1, 8, "pct") +
      numf(u + "-cm", "Costs either way: property tax, insurance, repairs per year ($)", 7000, 250) +
      hint("Before mortgage payments and income tax. Lodging taxes collected from guests are passed through to the city or state and are left out of both revenue and cost."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var rate = num(el, "rate"), occ = Number(self(el, "occ").value) / 100, stay = Number(self(el, "stay").value), cf = num(el, "cf"), cc = num(el, "cc");
      var pf = Number(self(el, "pf").value) / 100, mg = Number(self(el, "mg").value) / 100, fx = num(el, "fx"), lr = num(el, "lr"), lv = Number(self(el, "lv").value) / 100, lm = Number(self(el, "lm").value) / 100, cm = num(el, "cm");
      var keep = 1 - pf - mg, perNight = rate * keep + (cf * keep - cc) / stay;
      function strNoi(o) { return 365 * o * perNight - fx - cm; }
      var nights = 365 * occ, stays = nights / stay, rev = nights * rate + stays * cf, noiS = strNoi(occ);
      var noiL = lr * 12 * (1 - lv) * (1 - lm) - cm, be = perNight > 0 ? (noiL + fx + cm) / (365 * perNight) : Infinity;
      self(el, "k").innerHTML = kpi("Short-term gross bookings", money(rev)) + kpi("Short-term net operating income", sgnMoney(noiS), noiS >= noiL ? "good" : "bad") +
        kpi("Long-term net operating income", sgnMoney(noiL), noiL > noiS ? "good" : "") + kpi("Occupancy needed to match long-term", be <= 1 ? pct(be * 100, 0) : "above 100%");
      var s = [], l = []; for (var o = 0; o <= 100; o += 5) { s.push([o, strNoi(o / 100)]); l.push([o, noiL]); }
      INV.lineChart(self(el, "ch"), { label: "Net operating income by occupancy", height: 230, xTitle: "Short-term occupancy (%)", xFmt: function (v) { return v + "%"; }, yFmt: ms, zeroBase: false,
        series: [{ name: "Short-term rental", color: "var(--s1)", data: s }, { name: "Long-term lease", color: "var(--s2)", data: l, dash: "5 4" }], dots: [{ x: occ * 100, y: noiS, color: "var(--s1)" }] });
      var tax = stay <= 7 ? "With an average stay of " + stay + (stay === 1 ? " night" : " nights") + " (7 or fewer), the activity is <b>not a “rental activity”</b> under the passive-loss rules: if you materially participate, a tax loss can offset wages. If you do not, it is still passive." :
        stay <= 30 ? "An average stay of " + stay + " nights is over 7: the activity escapes rental treatment only if you also provide significant personal services (IRS Pub. 925)." : "Stays this long are ordinary rentals for tax purposes.";
      self(el, "n2").innerHTML = "Each booked night nets about " + money(perNight, 2) + " after platform, manager and cleaning costs. The short-term rental earns more than the lease only above about <b>" + (be <= 1 ? pct(be * 100, 0) : "100%") + "</b> occupancy. " + tax;
    }
    wire(el, run);
  };

  /* ---------- 7. BRRRR (INV-070) ---------- */
  TOOLS.s9bBrrrr = function (el) {
    var u = uid(el);
    shell(el, "BRRRR: buy, rehab, rent, refinance, repeat", "Calculator",
      numf(u + "-p", "Purchase price ($)", 150000, 1000) + numf(u + "-rh", "Rehab cost ($)", 45000, 1000) + numf(u + "-cc", "Closing costs on the purchase ($)", 4000, 250) +
      numf(u + "-hc", "Holding costs during rehab: interest, taxes, insurance, utilities ($)", 6000, 250) +
      numf(u + "-arv", "After-repair value (appraisal) ($)", 250000, 1000) + rng(u + "-ltv", "Cash-out refinance loan-to-value", 50, 80, 1, 75, "pct") +
      rng(u + "-rc", "Refinance closing costs, % of new loan", 0, 5, 0.25, 3, "pct") + rng(u + "-r", "Refinance interest rate", 3, 10, 0.125, 7, "pct") +
      numf(u + "-rent", "Monthly rent after rehab ($)", 2200, 25) + rng(u + "-ex", "Operating costs, % of rent (tax, insurance, repairs, vacancy, management)", 20, 60, 1, 40, "pct") +
      hint("Assumes the purchase and rehab are paid in cash, then refinanced into a 30-year fixed loan. Fannie Mae's Eligibility Matrix (August 2026) caps cash-out refinances of investment properties at 75% (one unit) and 70% (two to four units); its Selling Guide generally requires six months on title."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var P = num(el, "p"), rh = num(el, "rh"), cc = num(el, "cc"), hc = num(el, "hc"), arv = num(el, "arv"), ltv = Number(self(el, "ltv").value) / 100, rc = Number(self(el, "rc").value) / 100;
      var r = Number(self(el, "r").value) / 100, rent = num(el, "rent"), ex = Number(self(el, "ex").value) / 100;
      var cashIn = P + rh + cc + hc, loan = arv * ltv, cashOut = loan * (1 - rc), left = cashIn - cashOut;
      var pmt = payment(loan, r, 30) * 12, noi = rent * 12 * (1 - ex), cfy = noi - pmt, dscr = pmt > 0 ? noi / pmt : 0;
      var coc = left > 0 ? pct(cfy / left * 100, 1) : "no cash left in";
      var loan10 = arv * 0.9 * ltv * (1 - rc), left10 = cashIn - loan10;
      self(el, "k").innerHTML = kpi("Cash put in", money(cashIn)) + kpi("Cash back at refinance", money(cashOut), "good") +
        kpi(left >= 0 ? "Cash left in the deal" : "Cash pulled out beyond cost", money(Math.abs(left)), left <= 0 ? "good" : "") +
        kpi("Cash flow per year after the new mortgage", sgnMoney(cfy), cfy >= 0 ? "good" : "bad") + kpi("Debt service coverage", pmt > 0 ? dscr.toFixed(2) + "×" : "no loan", pmt > 0 ? (dscr >= 1.2 ? "good" : "bad") : "") + kpi("Cash-on-cash return", coc);
      INV.barChart(self(el, "ch"), { label: "Cash in and out", height: 220, allLabels: true, valueLabels: true, yFmt: ms, tipFmt: function (v) { return sgnMoney(v); },
        data: [{ label: "Purchase", y: P, color: "var(--s6)" }, { label: "Rehab", y: rh, color: "var(--s6)" }, { label: "Closing + holding", y: cc + hc, color: "var(--s6)" },
          { label: "Refi cash back", y: cashOut, color: "var(--s2)" }, { label: "Left in deal", y: left, color: left > 0 ? "var(--s5)" : "var(--s2)" }] });
      self(el, "n2").innerHTML = "New loan " + pct(ltv * 100, 0) + " × " + money(arv) + " = " + money(loan) + "; after " + pct(rc * 100, 2) + " closing costs you receive " + money(cashOut) + ". " +
        "Payment " + money(pmt / 12) + " a month at " + pct(r * 100, 3) + "; net operating income " + money(noi) + " a year. " +
        "If the appraisal comes in 10% lower (" + money(arv * 0.9) + "), you would leave <b>" + money(Math.max(0, left10)) + "</b> in the deal instead of " + money(Math.max(0, left)) + ". The appraisal, the rehab budget and the refinance rate are the three numbers that make or break the plan.";
    }
    wire(el, run);
  };

  /* ---------- 8. Stocks vs a rental, same cash (INV-071) ---------- */
  function versusModel(o) {
    var price = o.cash / (o.down + o.cc), loan = price * (1 - o.down), pm = payment(loan, o.rate, 30), bal = loan;
    var val = price, rent = price * o.yield, side = 0, stock = o.cash, reP = [[0, price * (1 - o.sell) - loan]], stP = [[0, o.cash]];
    for (var y = 1; y <= o.years; y++) {
      var paid = 0;
      for (var k = 0; k < 12; k++) { if (bal > 0) { var it = bal * o.rate / 12, pr = Math.min(bal, pm - it); bal -= pr; paid += it + pr; } }
      var cf = rent * (1 - o.exp) - paid;
      side = side * (1 + o.stk) + Math.max(0, cf);
      stock = stock * (1 + o.stk) + Math.max(0, -cf);
      val *= 1 + o.app; rent *= 1 + o.rg;
      reP.push([y, val * (1 - o.sell) - bal + side]); stP.push([y, stock]);
    }
    return { price: price, loan: loan, re: reP[reP.length - 1][1], st: stock, reP: reP, stP: stP, cf1: price * o.yield * (1 - o.exp) - pm * 12 };
  }
  INV.s9bVersus = versusModel;
  TOOLS.s9bVersus = function (el) {
    var u = uid(el);
    shell(el, "Same cash, two paths: an index fund or a rental", "Model",
      numf(u + "-c", "Cash you have to invest ($)", 100000, 1000) +
      rng(u + "-d", "Down payment (100% = no mortgage)", 20, 100, 5, 25, "pct") + rng(u + "-cc", "Buying costs, % of price", 0, 6, 0.5, 3, "pct") +
      rng(u + "-r", "Mortgage rate (30-year fixed)", 3, 10, 0.25, 6.5, "pct") +
      rng(u + "-y", "Gross rent per year, % of price", 3, 12, 0.1, 7.2, "pct") + rng(u + "-e", "Operating costs and vacancy, % of rent", 20, 60, 1, 40, "pct") +
      rng(u + "-a", "Home price growth per year", -2, 8, 0.25, 3.5, "pct") + rng(u + "-g", "Rent growth per year", 0, 6, 0.25, 3, "pct") +
      rng(u + "-s", "Stock index fund total return per year", 0, 12, 0.25, 8, "pct") + rng(u + "-n", "Years", 5, 30, 1, 20, "yr") +
      rng(u + "-sc", "Selling costs at the end, % of value", 0, 10, 0.5, 6, "pct") +
      hint("Before income tax, and it counts none of the landlord's time. Fair by construction: when the rental needs cash from its owner, the stock investor invests the same amount; when the rental throws off cash, it is invested in the same index fund."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function read() {
      return { cash: num(el, "c"), down: Number(self(el, "d").value) / 100, cc: Number(self(el, "cc").value) / 100, rate: Number(self(el, "r").value) / 100,
        yield: Number(self(el, "y").value) / 100, exp: Number(self(el, "e").value) / 100, app: Number(self(el, "a").value) / 100, rg: Number(self(el, "g").value) / 100,
        stk: Number(self(el, "s").value) / 100, years: Number(self(el, "n").value), sell: Number(self(el, "sc").value) / 100 };
    }
    function run() {
      var o = read(), M = versusModel(o), diff = M.re - M.st;
      var lo = -0.1, hi = 0.2, f = function (a) { var q = Object.assign({}, o, { app: a }); var m = versusModel(q); return m.re - m.st; };
      var be = null; if (o.cash > 0 && f(lo) < 0 && f(hi) > 0) { for (var i = 0; i < 60; i++) { var mid = (lo + hi) / 2; if (f(mid) > 0) hi = mid; else lo = mid; } be = (lo + hi) / 2; }
      self(el, "k").innerHTML = kpi("Property you can buy", money(M.price)) + kpi("Year-1 cash flow after mortgage", sgnMoney(fin(M.cf1)), M.cf1 >= 0 ? "good" : "bad") +
        kpi("Rental path after " + o.years + " years", sgnMoney(fin(M.re)), diff >= 0 ? "good" : "") + kpi("Index fund path", money(fin(M.st)), diff < 0 ? "good" : "") +
        kpi("Home price growth to break even", be == null ? "outside −10% to 20%" : pct(be * 100, 2) + "/yr");
      INV.lineChart(self(el, "ch"), { label: "Wealth on each path", height: 260, xTitle: "Years", xFmt: yearFmt, yFmt: ms,
        series: [{ name: "Rental: equity after selling costs, plus invested cash flow", color: "var(--s3)", data: M.reP }, { name: "Index fund, same cash and same top-ups", color: "var(--s1)", data: M.stP }] });
      self(el, "n2").innerHTML = "With " + pct(o.down * 100, 0) + " down, " + money(o.cash) + " controls a " + money(M.price) + " property: leverage of " + (o.down > 0 ? (1 / o.down).toFixed(1) : "0") + "× on the price. " +
        "After " + o.years + " years the rental path ends " + (diff >= 0 ? "<b>" + money(diff) + " ahead</b>" : "<b>" + money(-diff) + " behind</b>") + ". " +
        (be == null ? "" : "The two paths tie if home prices grow " + pct(be * 100, 2) + " a year; every point of appreciation matters several times over because of the mortgage. ") +
        "Try 100% down to see the same property without leverage.";
    }
    wire(el, run);
  };
})();
