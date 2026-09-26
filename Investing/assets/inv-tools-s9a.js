/* Investing Learning Lab - Stage 9 (Real Estate) calculators, INV-063 to INV-067 - V1.0 (September 2026)
   Every tool computes from its stated formula in the browser. Nothing is sent anywhere.
   Load after assets/inv-tools.js. Tool names carry the s9a prefix. */
(function () {
  "use strict";
  var INV = window.INV; if (!INV || !INV.tools) return;
  var esc = INV.esc, money = INV.money, ms = INV.moneyShort, pct = INV.pct;
  var TOOLS = INV.tools;

  /* ---------- local copies of the shared helpers (those in inv-tools.js are private) ---------- */
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
  function uid(el) { if (!el.dataset.uid) el.dataset.uid = "s9" + Math.random().toString(36).slice(2, 8); return el.dataset.uid; }
  function dec(step) { var s = String(step); return s.indexOf(".") > -1 ? s.split(".")[1].length : 0; }
  function fmtOut(input) {
    var o = input.parentNode.querySelector("output"); if (!o) return;
    var f = input.getAttribute("data-fmt"), v = Number(input.value);
    o.textContent = f === "pct" ? v.toFixed(dec(input.step)) + "%" : f === "yr" ? v + (v === 1 ? " year" : " years") :
      f === "money" ? money(v) : f === "mo" ? v + (v === 1 ? " month" : " months") : f === "x" ? v.toFixed(2) + "×" :
      f === "hr" ? v + (v === 1 ? " hour" : " hours") : f === "pts" ? v.toFixed(dec(input.step)) + (v === 1 ? " point" : " points") : String(v);
  }
  function wire(el, fn) {
    el.querySelectorAll("input,select").forEach(function (i) {
      i.addEventListener("input", function () { if (i.type === "range") fmtOut(i); fn(); });
      i.addEventListener("change", function () { fn(); });
      if (i.type === "range") fmtOut(i);
    });
    fn();
    document.addEventListener("inv-theme", fn);
  }
  function kpi(k, v, cls) { return '<div class="kpi"><div class="k">' + esc(k) + '</div><div class="v ' + (cls || "") + '">' + v + "</div></div>"; }
  function yearFmt(v) { return String(Math.round(v)); }
  function yearTick(v) { return Math.abs(v - Math.round(v)) > 1e-9 ? "" : String(Math.round(v)); }
  function num(el, id) { var v = Number(self(el, id).value); return isFinite(v) && v > 0 ? v : 0; }
  function rv(el, id) { return Number(self(el, id).value); }
  function note(t) { return '<p class="hint" style="font-size:.76rem;color:var(--muted)">' + t + "</p>"; }
  function selHTML(id, label, opts, val) {
    return '<div class="fld"><label for="' + id + '">' + esc(label) + '</label><select id="' + id + '">' + opts.map(function (o) {
      return '<option value="' + o[0] + '"' + (String(o[0]) === String(val) ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select></div>";
  }
  function yrsMo(m) { if (!isFinite(m)) return "—"; m = Math.round(m); var y = Math.floor(m / 12), r = m % 12; return y + " yr" + (r ? " " + r + " mo" : ""); }

  /* ---------- mortgage math ---------- */
  function payment(P, annualRate, months) {
    if (!(P > 0) || !(months > 0)) return 0;
    var r = annualRate / 12;
    return r === 0 ? P / months : P * r / (1 - Math.pow(1 + r, -months));
  }
  /* balance after k monthly payments of pmt */
  function balanceAfter(P, annualRate, pmt, k) {
    var r = annualRate / 12, b = P;
    for (var i = 0; i < k && b > 0; i++) b = Math.max(0, b * (1 + r) - pmt);
    return b;
  }
  /* full schedule with optional extra principal each month and a yearly lump */
  function schedule(P, annualRate, months, extraM, extraY) {
    var r = annualRate / 12, pmt = payment(P, annualRate, months), b = P, interest = 0, m = 0, pts = [[0, P]], cumI = [[0, 0]];
    while (b > 0.005 && m < 1200) {
      m++;
      var i = b * r; interest += i;
      var pr = Math.min(b, pmt - i + (extraM || 0) + (m % 12 === 0 ? (extraY || 0) : 0));
      if (pr <= 0 && r > 0) { b = Infinity; break; }
      b -= pr;
      if (m % 12 === 0 || b <= 0.005) { pts.push([m / 12, Math.max(0, b)]); cumI.push([m / 12, interest]); }
    }
    return { pmt: pmt, months: m, interest: interest, pts: pts, cumI: cumI };
  }
  INV.s9aMath = { payment: payment, balanceAfter: balanceAfter, schedule: schedule };

  /* IRR by bisection on annual cash flows (cf[0] negative) */
  function irr(cf) {
    function npv(r) { var s = 0; for (var i = 0; i < cf.length; i++) s += cf[i] / Math.pow(1 + r, i); return s; }
    var lo = -0.99, hi = 1.5, flo = npv(lo), fhi = npv(hi);
    if (!isFinite(flo) || !isFinite(fhi) || !(flo * fhi < 0)) return NaN; /* no sign change (e.g. all flows zero): no IRR */
    for (var k = 0; k < 200; k++) { var mid = (lo + hi) / 2, fm = npv(mid); if (flo * fm <= 0) { hi = mid; fhi = fm; } else { lo = mid; flo = fm; } }
    return (lo + hi) / 2;
  }
  INV.s9aIrr = irr;

  /* ======================================================================
     1. Rent versus buy (INV-063)
     ====================================================================== */
  function rentBuyModel(p) {
    var price = p.price, loan = price * (1 - p.down), n = 360, pmt = payment(loan, p.rate, n);
    var r = p.rate / 12, ret = Math.pow(1 + p.ret, 1 / 12) - 1, app = Math.pow(1 + p.app, 1 / 12) - 1;
    var bal = loan, value = price, rent = p.rent, rins = p.rins, ins = p.ins, hoa = p.hoa;
    var ownPort = 0, rentPort = price * p.down + price * p.close;
    var own = [[0, price - loan - price * p.sell]], ren = [[0, rentPort]], be = null, y1own = 0, y1rent = 0;
    for (var m = 1; m <= p.horizon * 12; m++) {
      var interest = bal * r, prin = m <= n ? Math.min(bal, pmt - interest) : 0;
      var pmi = bal > 0.8 * price ? loan * p.pmi / 12 : 0;
      var ownCost = (m <= n && bal > 0 ? interest + prin : 0) + value * p.tax / 12 + ins / 12 + value * p.maint / 12 + hoa + pmi;
      var rentCost = rent + rins / 12;
      if (m <= 12) { y1own += ownCost; y1rent += rentCost; }
      bal = Math.max(0, bal - prin);
      ownPort *= 1 + ret; rentPort *= 1 + ret;
      var diff = ownCost - rentCost;
      if (diff > 0) rentPort += diff; else ownPort -= diff;
      value *= 1 + app;
      if (m % 12 === 0) {
        rent *= 1 + p.rg; rins *= 1 + p.rg; ins *= 1 + p.rg; hoa *= 1 + p.rg;
        var ow = value - bal - value * p.sell + ownPort, rw = rentPort, yr = m / 12;
        own.push([yr, ow]); ren.push([yr, rw]);
        if (be === null && ow >= rw) be = yr;
      }
    }
    return { own: own, ren: ren, be: be, y1own: y1own / 12, y1rent: y1rent / 12, pmt: pmt, loan: loan };
  }
  INV.s9aRentBuyModel = rentBuyModel;
  TOOLS.s9aRentBuy = function (el) {
    var u = uid(el);
    shell(el, "Rent versus buy: total wealth after each year", "Calculator",
      numf(u + "-price", "Home price ($)", 325000, 5000) + rng(u + "-down", "Down payment", 3, 50, 1, 10, "pct") +
      rng(u + "-rate", "Mortgage rate (30-year fixed)", 2, 10, 0.05, 7, "pct") + rng(u + "-tax", "Property tax (% of value per year)", 0, 3, 0.05, 1.5, "pct") +
      numf(u + "-ins", "Homeowners insurance ($ per year)", 1800, 100) + rng(u + "-maint", "Maintenance (% of value per year)", 0, 4, 0.1, 1, "pct") +
      numf(u + "-hoa", "HOA dues ($ per month)", 0, 25) + rng(u + "-pmi", "PMI while the loan is above 80% of price (% of loan per year)", 0, 1.5, 0.05, 0.5, "pct") +
      rng(u + "-close", "Buyer closing costs (% of price)", 0, 6, 0.25, 3, "pct") + rng(u + "-sell", "Cost to sell (% of value)", 0, 10, 0.5, 6, "pct") +
      rng(u + "-app", "Home price growth per year", -3, 8, 0.25, 3, "pct") +
      numf(u + "-rent", "Rent for a comparable home ($ per month)", 1850, 25) + numf(u + "-rins", "Renters insurance ($ per year)", 200, 25) +
      rng(u + "-rg", "Rent and cost inflation per year", 0, 8, 0.25, 3, "pct") + rng(u + "-ret", "Return on invested savings per year", 0, 12, 0.25, 6, "pct") +
      rng(u + "-n", "Years you stay", 1, 30, 1, 10, "yr") +
      note("Whoever has the lower monthly housing cost invests the difference each month; the renter also invests the down payment and closing costs on day one. Owner wealth = home value − loan balance − cost to sell + investments. Before income taxes on either side."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var p = { price: num(el, "price"), down: rv(el, "down") / 100, rate: rv(el, "rate") / 100, tax: rv(el, "tax") / 100, ins: num(el, "ins"),
        maint: rv(el, "maint") / 100, hoa: num(el, "hoa"), pmi: rv(el, "pmi") / 100, close: rv(el, "close") / 100, sell: rv(el, "sell") / 100,
        app: rv(el, "app") / 100, rent: num(el, "rent"), rins: num(el, "rins"), rg: rv(el, "rg") / 100, ret: rv(el, "ret") / 100, horizon: 30 };
      if (!(p.price > 0)) { self(el, "k").innerHTML = kpi("Home price", "enter a price above $0"); self(el, "c").innerHTML = ""; self(el, "n2").innerHTML = "Enter the price of the home you are considering to compare buying with renting."; return; }
      var n = rv(el, "n"), M = rentBuyModel(p);
      var ow = M.own[n][1], rw = M.ren[n][1], pr = p.rent > 0 ? p.price / (p.rent * 12) : NaN;
      self(el, "k").innerHTML = kpi("Owning per month, year 1 (all costs)", money(M.y1own)) + kpi("Renting per month, year 1", money(M.y1rent)) +
        kpi("Price-to-rent ratio", isFinite(pr) ? pr.toFixed(1) : "no rent entered") +
        kpi("Owner's wealth, year " + n, money(ow), ow >= rw ? "good" : "") + kpi("Renter's wealth, year " + n, money(rw), rw > ow ? "good" : "") +
        kpi("Buying pulls ahead in", M.be === null ? "not within 30 years" : "year " + M.be, M.be !== null && M.be <= n ? "good" : "bad");
      INV.lineChart(self(el, "c"), { label: "Wealth of the owner and the renter", height: 270, xTitle: "Years from purchase", yFmt: ms, xFmt: yearFmt, zeroBase: false,
        series: [{ name: "Buy", color: "var(--s1)", data: M.own.slice(0, n + 1) }, { name: "Rent and invest the difference", color: "var(--s3)", data: M.ren.slice(0, n + 1) }],
        marks: M.be !== null && M.be <= n ? [{ x: M.be, label: "Break-even" }] : [] });
      self(el, "n2").innerHTML = "Mortgage principal and interest: <b>" + money(M.pmt) + "</b> a month on a " + money(M.loan) + " loan. After " + n + (n === 1 ? " year" : " years") + ", the " +
        (ow >= rw ? "buyer is ahead by <b>" + money(ow - rw) + "</b>." : "renter is ahead by <b>" + money(rw - ow) + "</b>.") +
        (M.be === null ? " At these inputs the buyer never recovers the costs of buying and selling, and any higher monthly costs, within 30 years." :
          " Buying and selling costs put the renter ahead at first; the buyer catches up in year " + M.be + ".") +
        " Try a longer stay, a different rate or a different price growth assumption to see how the answer moves.";
    }
    wire(el, run);
  };

  /* ======================================================================
     2. Unrecoverable cost of owning (INV-063)
     ====================================================================== */
  TOOLS.s9aUnrecov = function (el) {
    var u = uid(el);
    shell(el, "The unrecoverable cost of owning versus rent", "Calculator",
      numf(u + "-price", "Home price ($)", 325000, 5000) + rng(u + "-down", "Down payment", 0, 100, 1, 10, "pct") +
      rng(u + "-rate", "Mortgage rate", 0, 10, 0.05, 7, "pct") + rng(u + "-tax", "Property tax (% of value)", 0, 3, 0.05, 1.5, "pct") +
      rng(u + "-maint", "Maintenance (% of value)", 0, 4, 0.1, 1, "pct") + numf(u + "-ins", "Insurance ($ per year)", 1800, 100) +
      rng(u + "-ret", "Return you would expect on the down payment elsewhere", 0, 10, 0.25, 6, "pct") +
      rng(u + "-app", "Expected home price growth", -2, 6, 0.25, 3, "pct") + numf(u + "-rent", "Rent for a comparable home ($ per month)", 1850, 25) +
      note("Unrecoverable costs are money that does not come back as equity: property tax, maintenance, insurance, mortgage interest and the return the down payment gives up, minus expected price growth. Principal repayment is not counted; it is your own savings."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var P = num(el, "price"), d = rv(el, "down") / 100, rate = rv(el, "rate") / 100, tax = rv(el, "tax") / 100, mt = rv(el, "maint") / 100,
        ins = num(el, "ins"), ret = rv(el, "ret") / 100, app = rv(el, "app") / 100, rent = num(el, "rent");
      var parts = [["Property tax", P * tax, "var(--s5)"], ["Maintenance", P * mt, "var(--s3)"], ["Insurance", ins, "var(--s4)"],
        ["Mortgage interest", P * (1 - d) * rate, "var(--s1)"], ["Lost return on down pmt", P * d * ret, "var(--s6)"], ["Less price growth", -P * app, "var(--s2)"]];
      var tot = parts.reduce(function (s, x) { return s + x[1]; }, 0), rentY = rent * 12;
      self(el, "k").innerHTML = kpi("Unrecoverable cost / year", money(tot), tot > rentY ? "bad" : "good") + kpi("As % of price", P > 0 ? pct(tot / P * 100, 1) : "—") +
        kpi("Per month", money(tot / 12)) + kpi("Rent per month", money(rent)) + kpi(tot > rentY ? "Renting is cheaper by" : "Owning is cheaper by", money(Math.abs(tot - rentY) / 12, 0) + "/mo", tot > rentY ? "bad" : "good");
      /* all bars drawn upward: expected price growth is shown as an offset (subtracted), a price decline as an added cost */
      var bars = parts.slice(0, 5).map(function (x) { return { label: x[0], y: x[1], color: x[2] }; });
      bars.push(app >= 0 ? { label: "Minus: price growth", y: P * app, color: "var(--s2)" } : { label: "Plus: price decline", y: -P * app, color: "var(--s5)" });
      bars.push({ label: "Rent", y: rentY, color: "var(--s7)" });
      INV.barChart(self(el, "c"), { label: "Components of the unrecoverable cost", height: 230, allLabels: true, valueLabels: true, yFmt: ms, tipFmt: function (v) { return money(v) + " a year"; }, data: bars });
      self(el, "n2").innerHTML = "Unrecoverable cost ≈ tax + maintenance + insurance + interest + (expected return × down payment) − (price growth × price) = <b>" + money(tot) + "</b> a year, or " +
        (P > 0 ? pct(tot / P * 100, 1) : "—") + " of the price, against " + money(rentY) + " of rent. This is a first-year snapshot; it leaves out buying and selling costs, which make short stays more expensive still.";
    }
    wire(el, run);
  };

  /* ======================================================================
     3. Amortization and extra payments (INV-064)
     ====================================================================== */
  TOOLS.s9aAmort = function (el) {
    var u = uid(el);
    shell(el, "Amortization and extra payments", "Calculator",
      numf(u + "-bal", "Loan balance today ($)", 310000, 1000) + rng(u + "-rate", "Interest rate", 0, 12, 0.05, 3.1, "pct") +
      rng(u + "-yrs", "Years left on the loan", 1, 30, 1, 25, "yr") + numf(u + "-xm", "Extra principal every month ($)", 500, 50) +
      numf(u + "-xy", "Extra lump sum once a year ($)", 0, 500) +
      note("Monthly payment M = P × r ÷ (1 − (1 + r)<sup>−n</sup>), with r the monthly rate and n the number of months left. Extra payments go straight to principal."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var P = num(el, "bal"), r = rv(el, "rate") / 100, n = rv(el, "yrs") * 12, xm = num(el, "xm"), xy = num(el, "xy");
      if (!(P > 0)) { self(el, "k").innerHTML = kpi("Loan balance", "enter a balance above $0"); self(el, "c").innerHTML = ""; self(el, "n2").innerHTML = "Enter the balance you still owe to see the schedule."; return; }
      var A = schedule(P, r, n, 0, 0), B = schedule(P, r, n, xm, xy);
      var saved = A.interest - B.interest, cut = A.months - B.months;
      self(el, "k").innerHTML = kpi("Monthly principal + interest", money(A.pmt)) + kpi("Interest left to pay", money(A.interest)) +
        kpi("With extra payments", money(B.interest)) + kpi("Interest saved", money(saved), saved > 0 ? "good" : "") +
        kpi("Paid off in", yrsMo(B.months)) + kpi("Time saved", yrsMo(cut), cut > 0 ? "good" : "");
      INV.lineChart(self(el, "c"), { label: "Loan balance with and without extra payments", height: 260, xTitle: "Years from now", yFmt: ms, xFmt: yearFmt,
        series: [{ name: "Scheduled payments only", color: "var(--s6)", data: A.pts }, { name: "With extra payments", color: "var(--s2)", data: B.pts },
          { name: "Cumulative interest, scheduled", color: "var(--s5)", data: A.cumI, dash: "5 4", width: 1.6 }] });
      var i1 = P * r / 12;
      self(el, "n2").innerHTML = "This month, " + money(i1) + " of the " + money(A.pmt) + " payment is interest and " + money(Math.max(0, A.pmt - i1)) + " repays principal. " +
        (xm + xy > 0 ? "Every extra dollar of principal earns exactly the loan's rate, " + pct(r * 100, 2) + ", risk-free, because it stops that interest from being charged." : "Add an extra payment to see its effect.");
    }
    wire(el, run);
  };

  /* ======================================================================
     4. Discount points break-even (INV-064)
     ====================================================================== */
  TOOLS.s9aPoints = function (el) {
    var u = uid(el);
    shell(el, "Should you pay points? Break-even calculator", "Calculator",
      numf(u + "-loan", "Loan amount ($)", 300000, 5000) + rng(u + "-rate", "Rate with no points", 2, 10, 0.05, 7, "pct") +
      rng(u + "-pts", "Points paid", 0, 3, 0.25, 1, "pts") + rng(u + "-cut", "Rate reduction per point (lender quote)", 0.05, 0.5, 0.005, 0.25, "pct") +
      rng(u + "-keep", "Years you expect to keep the loan", 1, 30, 1, 7, "yr") +
      note("One point costs 1% of the loan amount. The benefit is a lower payment and a slightly faster-falling balance. Net gain at your horizon = payments saved + lower remaining balance − cost of the points (no discounting)."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var L = num(el, "loan"), r0 = rv(el, "rate") / 100, pts = rv(el, "pts"), cut = rv(el, "cut") / 100 * pts, keep = rv(el, "keep");
      if (!(L > 0)) { self(el, "k").innerHTML = kpi("Loan amount", "enter an amount above $0"); self(el, "c").innerHTML = ""; self(el, "n2").innerHTML = "Enter the loan amount the lender quoted."; return; }
      var r1 = Math.max(0, r0 - cut), cost = L * pts / 100, p0 = payment(L, r0, 360), p1 = payment(L, r1, 360), sav = p0 - p1;
      var cum = [], be = null;
      for (var m = 0; m <= 360; m += 1) {
        var net = sav * m + (balanceAfter(L, r0, p0, m) - balanceAfter(L, r1, p1, m)) - cost;
        if (m % 6 === 0) cum.push([m / 12, net]);
        if (be === null && m > 0 && net >= 0) be = m;
      }
      var atKeep = sav * keep * 12 + (balanceAfter(L, r0, p0, keep * 12) - balanceAfter(L, r1, p1, keep * 12)) - cost;
      var simple = sav > 0 ? cost / sav : NaN;
      self(el, "k").innerHTML = kpi("Cost of the points", money(cost)) + kpi("New rate", pct(r1 * 100, 3)) + kpi("Monthly saving", money(sav)) +
        kpi("Simple break-even", pts === 0 ? "no points" : isFinite(simple) ? yrsMo(simple) : "never") +
        kpi("Net gain after " + keep + (keep === 1 ? " year" : " years"), money(atKeep), atKeep >= 0 ? "good" : "bad");
      INV.lineChart(self(el, "c"), { label: "Cumulative net gain from paying points", height: 240, xTitle: "Years you keep the loan", yFmt: ms, xFmt: yearFmt, zeroBase: false,
        series: [{ name: "Net gain", color: "var(--s1)", data: cum, area: true }], marks: [{ x: keep, label: "Your horizon" }] });
      self(el, "n2").innerHTML = pts === 0 ? "Choose a number of points to compare." : "Simple break-even = cost ÷ monthly saving = " + money(cost) + " ÷ " + money(sav) + (isFinite(simple) ? " ≈ " + Math.round(simple) + " months" : "") + ". " +
        (be === null ? "At these inputs the points never pay back within 30 years." : "Counting the faster-falling balance too, the points pay back after about <b>" + yrsMo(be) + "</b>.") +
        " If you are likely to sell or refinance sooner, the points are money lost.";
    }
    wire(el, run);
  };

  /* ======================================================================
     5. Refinance break-even (INV-064)
     ====================================================================== */
  TOOLS.s9aRefi = function (el) {
    var u = uid(el);
    shell(el, "Refinancing: savings, break-even and the term reset", "Calculator",
      numf(u + "-bal", "Current loan balance ($)", 380000, 5000) + rng(u + "-r0", "Current rate", 1, 12, 0.05, 7.75, "pct") +
      rng(u + "-y0", "Years left on current loan", 1, 30, 1, 28, "yr") + rng(u + "-r1", "New rate", 1, 12, 0.05, 6.75, "pct") +
      selHTML(u + "-t1", "New loan term", [[30, "30 years"], [20, "20 years"], [15, "15 years"]], 30) +
      numf(u + "-cost", "Closing costs ($)", 6000, 250) + rng(u + "-keep", "Years you expect to keep the new loan", 1, 30, 1, 10, "yr") +
      note("Net gain at your horizon = payments saved + (old balance − new balance) − closing costs, with closing costs paid in cash. Resetting to a longer term lowers the payment partly by stretching the debt."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var B = num(el, "bal"), r0 = rv(el, "r0") / 100, n0 = rv(el, "y0") * 12, r1 = rv(el, "r1") / 100, n1 = Number(self(el, "t1").value) * 12, c = num(el, "cost"), keep = rv(el, "keep");
      if (!(B > 0)) { self(el, "k").innerHTML = kpi("Loan balance", "enter a balance above $0"); self(el, "c").innerHTML = ""; self(el, "n2").innerHTML = "Enter the balance you still owe on the current loan."; return; }
      var p0 = payment(B, r0, n0), p1 = payment(B, r1, n1), sav = p0 - p1;
      var I0 = p0 * n0 - B, I1 = p1 * n1 - B, cum = [], be = null;
      for (var m = 0; m <= 360; m++) {
        var net = (Math.min(m, n0) * p0 - Math.min(m, n1) * p1) + (balanceAfter(B, r0, p0, m) - balanceAfter(B, r1, p1, m)) - c;
        if (m % 6 === 0) cum.push([m / 12, net]);
        if (be === null && m > 0 && net >= 0) be = m;
      }
      var km = keep * 12, atKeep = (Math.min(km, n0) * p0 - Math.min(km, n1) * p1) + (balanceAfter(B, r0, p0, km) - balanceAfter(B, r1, p1, km)) - c;
      self(el, "k").innerHTML = kpi("Payment now", money(p0)) + kpi("New payment", money(p1)) + kpi("Monthly change", (sav >= 0 ? "−" : "+") + money(Math.abs(sav)), sav >= 0 ? "good" : "bad") +
        kpi("Break-even", be === null ? "not within 30 years" : yrsMo(be), be !== null && be <= km ? "good" : "bad") +
        kpi("Total interest left: old / new", ms(I0) + " / " + ms(I1)) + kpi("Net gain after " + keep + (keep === 1 ? " year" : " years"), money(atKeep), atKeep >= 0 ? "good" : "bad");
      INV.lineChart(self(el, "c"), { label: "Cumulative net gain from refinancing", height: 240, xTitle: "Years after refinancing", yFmt: ms, xFmt: yearFmt, zeroBase: false,
        series: [{ name: "Net gain", color: "var(--s2)", data: cum, area: true }], marks: [{ x: keep, label: "Your horizon" }] });
      self(el, "n2").innerHTML = "Simple break-even = closing costs ÷ monthly saving" + (sav > 0 ? " = " + money(c) + " ÷ " + money(sav) + " ≈ " + Math.round(c / sav) + " months" : " (no monthly saving here)") + ". " +
        (be === null ? "Counting the difference in loan balances too, the refinance does not pay back within 30 years. " : "Counting the difference in loan balances too, it pays back after about <b>" + yrsMo(be) + "</b> (the break-even shown above). ") +
        (n1 > n0 ? "The new loan runs " + ((n1 - n0) / 12) + " years longer than the old one, so compare total interest, not just the payment." : "The new term is no longer than the old one, so the saving is not bought by stretching the debt.");
    }
    wire(el, run);
  };

  /* ======================================================================
     6. Prepay the mortgage or invest (INV-064)
     ====================================================================== */
  TOOLS.s9aPrepay = function (el) {
    var u = uid(el);
    shell(el, "Pay down the mortgage or invest the extra?", "Calculator",
      numf(u + "-bal", "Loan balance ($)", 310000, 1000) + rng(u + "-rate", "Mortgage rate", 0, 10, 0.05, 3.1, "pct") +
      rng(u + "-yrs", "Years left on the loan", 1, 30, 1, 25, "yr") + numf(u + "-x", "Extra money each month ($)", 500, 50) +
      rng(u + "-ret", "After-tax return on the investment alternative", 0, 10, 0.25, 4, "pct") +
      note("Plan A sends the extra to principal; once the loan is gone it invests the old payment plus the extra. Plan B invests the extra from day one and pays the loan on schedule. Both are compared at the end of the original term. A guaranteed saving at the mortgage rate is compared with an uncertain investment return."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var P = num(el, "bal"), r = rv(el, "rate") / 100, n = rv(el, "yrs") * 12, x = num(el, "x"), g = Math.pow(1 + rv(el, "ret") / 100, 1 / 12) - 1;
      if (!(P > 0)) { self(el, "k").innerHTML = kpi("Loan balance", "enter a balance above $0"); self(el, "c").innerHTML = ""; self(el, "n2").innerHTML = "Enter the balance you still owe to compare prepaying with investing."; return; }
      var pmt = payment(P, r, n), bA = P, bB = P, pA = 0, pB = 0, payoff = null, A = [[0, -P]], B = [[0, -P]];
      for (var m = 1; m <= n; m++) {
        pA *= 1 + g; pB *= 1 + g;
        if (bA > 0) { var i = bA * r / 12, pr = Math.min(bA, pmt - i + x); var left = pmt + x - (i + pr); bA -= pr; if (bA <= 0.005) { bA = 0; if (payoff === null) payoff = m; } pA += Math.max(0, left); }
        else pA += pmt + x;
        var iB = bB * r / 12; bB = Math.max(0, bB - (pmt - iB)); pB += x;
        if (m % 12 === 0 || m === n) { A.push([m / 12, pA - bA]); B.push([m / 12, pB - bB]); }
      }
      var wA = pA - bA, wB = pB - bB, diff = wB - wA;
      self(el, "k").innerHTML = kpi("Plan A: loan paid off in", payoff ? yrsMo(payoff) : yrsMo(n)) + kpi("Plan A wealth at year " + (n / 12), money(wA), wA >= wB ? "good" : "") +
        kpi("Plan B wealth at year " + (n / 12), money(wB), wB > wA ? "good" : "") + kpi(diff >= 0 ? "Investing ahead by" : "Prepaying ahead by", money(Math.abs(diff)));
      INV.lineChart(self(el, "c"), { label: "Net position: investments minus mortgage balance", height: 250, xTitle: "Years from now", yFmt: ms, xFmt: yearFmt, zeroBase: false,
        series: [{ name: "A: prepay, then invest", color: "var(--s2)", data: A }, { name: "B: invest the extra", color: "var(--s1)", data: B }] });
      self(el, "n2").innerHTML = "The break-even return is close to the mortgage rate itself, " + pct(r * 100, 2) + ". Above it (after tax), investing wins on average; below it, prepaying wins — and prepaying is certain while investing is not. " +
        "Prepaid principal is also illiquid: you cannot get it back without selling or borrowing.";
    }
    wire(el, run);
  };

  /* ======================================================================
     7. Rental property analyzer with a projection (INV-065)
     ====================================================================== */
  function rentalModel(p) {
    var loan = p.price * (1 - p.down), pmt = payment(loan, p.rate, p.term * 12), ds = pmt * 12;
    var cash0 = p.price * p.down + p.price * p.close + p.rehab;
    var rows = [], cf = [-cash0], value = p.price, rent = p.rent, fixed = p.tax + p.ins + p.hoa * 12, bal = loan;
    for (var y = 1; y <= p.hold; y++) {
      var gpr = rent * 12, egi = gpr * (1 - p.vac), varx = gpr * (p.maint + p.capex) + egi * p.mgmt;
      var opx = fixed + varx, noi = egi - opx;
      var dsy = y <= p.term ? ds : 0;
      bal = balanceAfter(loan, p.rate, pmt, Math.min(y, p.term) * 12);
      value *= 1 + p.app;
      var cfy = noi - dsy;
      rows.push({ y: y, gpr: gpr, egi: egi, opx: opx, noi: noi, ds: dsy, cf: cfy, bal: bal, value: value, eq: value - bal });
      cf.push(cfy + (y === p.hold ? value * (1 - p.sell) - bal : 0));
      rent *= 1 + p.rg; fixed *= 1 + p.eg;
    }
    var r1 = rows[0];
    var total = cf.slice(1).reduce(function (s, v) { return s + v; }, 0);
    return { loan: loan, pmt: pmt, ds: ds, cash0: cash0, rows: rows, cf: cf, irr: irr(cf), mult: cash0 > 0 ? total / cash0 : NaN,
      noi1: r1.noi, cap: p.price > 0 ? r1.noi / p.price : NaN, coc: cash0 > 0 ? r1.cf / cash0 : NaN, dscr: ds > 0 ? r1.noi / ds : NaN,
      one: p.price > 0 ? p.rent / p.price : NaN, opx1: r1.opx, egi1: r1.egi };
  }
  INV.s9aRentalModel = rentalModel;
  TOOLS.s9aRental = function (el) {
    var u = uid(el);
    shell(el, "Rental property analyzer with a multi-year projection", "Calculator",
      numf(u + "-price", "Purchase price ($)", 300000, 5000) + rng(u + "-down", "Down payment", 0, 100, 1, 25, "pct") +
      rng(u + "-close", "Closing costs (% of price)", 0, 6, 0.25, 3, "pct") + numf(u + "-rehab", "Repairs before renting ($)", 0, 500) +
      rng(u + "-rate", "Loan rate", 2, 12, 0.05, 7.5, "pct") + selHTML(u + "-term", "Loan term", [[30, "30 years"], [20, "20 years"], [15, "15 years"]], 30) +
      numf(u + "-rent", "Monthly rent ($)", 2100, 25) + rng(u + "-vac", "Vacancy and unpaid rent", 0, 20, 0.5, 7, "pct") +
      numf(u + "-tax", "Property tax ($ per year)", 1800, 100) + numf(u + "-ins", "Landlord insurance ($ per year)", 1500, 100) +
      rng(u + "-maint", "Repairs and maintenance (% of rent)", 0, 20, 0.5, 8, "pct") + rng(u + "-capex", "Capital reserves (% of rent)", 0, 20, 0.5, 8, "pct") +
      rng(u + "-mgmt", "Property management (% of collected rent)", 0, 15, 0.5, 10, "pct") + numf(u + "-hoa", "HOA, utilities, other ($ per month)", 0, 25) +
      rng(u + "-rg", "Rent growth per year", -2, 8, 0.25, 3, "pct") + rng(u + "-eg", "Tax and insurance growth per year", 0, 10, 0.25, 3, "pct") +
      rng(u + "-app", "Property value growth per year", -5, 8, 0.25, 3, "pct") + rng(u + "-sell", "Cost to sell (% of value)", 0, 10, 0.5, 6, "pct") +
      rng(u + "-hold", "Years you hold", 1, 30, 1, 10, "yr") +
      note("NOI = rent × (1 − vacancy) − operating expenses; debt service is not an operating expense. Cash flow = NOI − loan payments. IRR uses your cash in, each year's cash flow and the sale proceeds after the loan payoff. Before income taxes (see INV-068)."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><div class="tbl-wrap" id="' + u + '-t"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var p = { price: num(el, "price"), down: rv(el, "down") / 100, close: rv(el, "close") / 100, rehab: num(el, "rehab"), rate: rv(el, "rate") / 100,
        term: Number(self(el, "term").value), rent: num(el, "rent"), vac: rv(el, "vac") / 100, tax: num(el, "tax"), ins: num(el, "ins"),
        maint: rv(el, "maint") / 100, capex: rv(el, "capex") / 100, mgmt: rv(el, "mgmt") / 100, hoa: num(el, "hoa"), rg: rv(el, "rg") / 100, eg: rv(el, "eg") / 100,
        app: rv(el, "app") / 100, sell: rv(el, "sell") / 100, hold: rv(el, "hold") };
      var M = rentalModel(p), f = function (v, d) { return isFinite(v) ? pct(v * 100, d == null ? 1 : d) : "n/a"; };
      self(el, "k").innerHTML = kpi("Net operating income, year 1", money(M.noi1)) + kpi("Cap rate", f(M.cap, 2)) +
        kpi("Cash flow per month, year 1", money(M.rows[0].cf / 12), M.rows[0].cf >= 0 ? "good" : "bad") + kpi("Cash-on-cash return", M.cash0 > 0 ? f(M.coc, 1) : "no cash in", M.coc >= 0 ? "" : "bad") +
        kpi("Debt service coverage", M.ds > 0 ? (isFinite(M.dscr) ? M.dscr.toFixed(2) + "×" : "n/a") : "no loan", M.ds > 0 && M.dscr < 1 ? "bad" : "") +
        kpi("Rent ÷ price (the 1% rule)", f(M.one, 2)) + kpi("IRR over " + p.hold + (p.hold === 1 ? " year" : " years"), f(M.irr, 1)) + kpi("Cash back per $1 invested", isFinite(M.mult) ? "$" + M.mult.toFixed(2) : "n/a");
      INV.lineChart(self(el, "c"), { label: "Equity and cumulative cash flow", height: 250, xTitle: "Year", yFmt: ms, xFmt: yearTick, zeroBase: false,
        series: [{ name: "Equity (value − loan)", color: "var(--s1)", data: [[0, p.price - M.loan]].concat(M.rows.map(function (r) { return [r.y, r.eq]; })) },
          { name: "Cumulative cash flow", color: "var(--s3)", data: (function () { var c = 0, d = [[0, 0]]; M.rows.forEach(function (r) { c += r.cf; d.push([r.y, c]); }); return d; })() }] });
      var h = '<table class="tbl" style="white-space:nowrap"><thead><tr><th>Year</th><th class="r">Effective rent</th><th class="r">Operating costs</th><th class="r">NOI</th><th class="r">Loan payments</th><th class="r">Cash flow</th><th class="r">Loan balance</th><th class="r">Value</th></tr></thead><tbody>';
      M.rows.forEach(function (r) { h += "<tr><td>" + r.y + '</td><td class="r">' + money(r.egi) + '</td><td class="r">' + money(r.opx) + '</td><td class="r">' + money(r.noi) + '</td><td class="r">' + money(r.ds) + '</td><td class="r ' + (r.cf < 0 ? "neg-t" : "") + '">' + money(r.cf) + '</td><td class="r">' + money(r.bal) + '</td><td class="r">' + money(r.value) + "</td></tr>"; });
      self(el, "t").innerHTML = h + "</tbody></table>";
      var last = M.rows[M.rows.length - 1];
      self(el, "n2").innerHTML = "Cash in at purchase: <b>" + money(M.cash0) + "</b> (down payment, closing costs, repairs). Year-1 operating costs are " + (M.egi1 > 0 ? pct(M.opx1 / M.egi1 * 100, 0) : "—") +
        " of effective rent. Selling after year " + p.hold + " at " + money(last.value) + " less " + pct(p.sell * 100, 1) + " costs and the " + money(last.bal) + " loan payoff returns " + money(last.value * (1 - p.sell) - last.bal) + ".";
    }
    wire(el, run);
  };

  /* ======================================================================
     8. Leverage amplifier (INV-066)
     ====================================================================== */
  function levReturn(price, down, rate, cap, app, years) {
    var loan = price * (1 - down), pmt = payment(loan, rate, 360), cf = [-price * down], v = price;
    for (var y = 1; y <= years; y++) {
      var noi = v * cap; v *= 1 + app;
      var bal = balanceAfter(loan, rate, pmt, y * 12);
      cf.push(noi - pmt * 12 + (y === years ? v - bal : 0));
    }
    return { irr: irr(cf), eq: v - balanceAfter(loan, rate, pmt, years * 12), cf1: price * cap - pmt * 12, pmt: pmt };
  }
  INV.s9aLevReturn = levReturn;
  TOOLS.s9aLeverage = function (el) {
    var u = uid(el);
    shell(el, "How leverage amplifies gains and losses", "Model",
      numf(u + "-price", "Property price ($)", 300000, 5000) + rng(u + "-down", "Down payment (your equity)", 5, 100, 5, 25, "pct") +
      rng(u + "-rate", "Loan rate", 2, 12, 0.05, 7.5, "pct") + rng(u + "-cap", "Net operating income as % of value (cap rate)", 2, 10, 0.25, 6, "pct") +
      rng(u + "-app", "Property value change per year", -10, 10, 0.5, 3, "pct") + rng(u + "-yrs", "Years held", 1, 30, 1, 5, "yr") +
      note("Annual return on your equity is the IRR of: down payment out; each year NOI minus loan payments; at the end, value minus loan balance. No buying or selling costs or taxes, so the effect of leverage alone is visible."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var P = num(el, "price"), d = rv(el, "down") / 100, r = rv(el, "rate") / 100, cap = rv(el, "cap") / 100, app = rv(el, "app") / 100, n = rv(el, "yrs");
      if (!(P > 0)) { self(el, "k").innerHTML = kpi("Return on equity per year", "enter a price"); self(el, "c").innerHTML = ""; self(el, "n2").innerHTML = "Enter a property price above zero."; return; }
      var L = levReturn(P, d, r, cap, app, n), C = levReturn(P, 1, r, cap, app, n);
      var f = function (v) { return isFinite(v) ? pct(v * 100, 1) : "lost it all"; };
      self(el, "k").innerHTML = kpi("Return on equity per year, " + Math.round(d * 100) + "% down", f(L.irr), L.irr >= C.irr ? "good" : "bad") +
        kpi("All-cash return per year", f(C.irr)) + kpi("Year-1 cash flow", money(L.cf1), L.cf1 >= 0 ? "" : "bad") +
        kpi("Your equity after " + n + (n === 1 ? " year" : " years"), money(L.eq), L.eq > P * d ? "good" : "bad") + kpi("Price fall that erases the down payment", d < 1 ? pct(d * 100, 0) : "none: no loan");
      var sA = [], sB = [], sC = [];
      for (var a = -10; a <= 10; a += 1) {
        var x = levReturn(P, d, r, cap, a / 100, n).irr, y = levReturn(P, 1, r, cap, a / 100, n).irr, z = levReturn(P, 0.1, r, cap, a / 100, n).irr;
        sA.push([a, isFinite(x) ? Math.max(-100, x * 100) : -100]); sB.push([a, isFinite(y) ? y * 100 : NaN]); sC.push([a, isFinite(z) ? Math.max(-100, z * 100) : -100]);
      }
      INV.lineChart(self(el, "c"), { label: "Annual return on equity by value change", height: 260, xTitle: "Property value change per year (%)", yTitle: "Return on equity per year (%)", zeroBase: false,
        xFmt: function (v) { return v + "%"; }, yFmt: function (v) { return Math.round(v) + "%"; }, tipFmt: function (v) { return pct(v, 1); },
        series: [{ name: "All cash", color: "var(--s6)", data: sB }, { name: Math.round(d * 100) + "% down", color: "var(--s1)", data: sA }, { name: "10% down", color: "var(--s5)", data: sC, dash: "5 4" }],
        dots: [{ x: app * 100, y: isFinite(L.irr) ? Math.max(-100, L.irr * 100) : -100, color: "var(--s1)" }] });
      var spread = cap - r;
      self(el, "n2").innerHTML = "Leverage helps only when the property earns more than the loan costs. Here the cap rate is " + pct(cap * 100, 2) + " and the loan rate " + pct(r * 100, 2) +
        (spread >= 0 ? ", so borrowing adds to the return from income." : ": the loan costs more than the property's income yield, so borrowing <b>subtracts</b> from income and the whole bet rests on price growth.") +
        " Returns below −100% are shown at −100%: you cannot lose more than your equity in this model, but with a recourse loan a lender can pursue you for a shortfall.";
    }
    wire(el, run);
  };

  /* ======================================================================
     9. DSCR loan sizing and rate risk (INV-066)
     ====================================================================== */
  TOOLS.s9aDscr = function (el) {
    var u = uid(el);
    shell(el, "How big a loan will the rent support?", "Calculator",
      numf(u + "-price", "Purchase price ($)", 300000, 5000) + numf(u + "-noi", "Net operating income ($ per year)", 18000, 250) +
      rng(u + "-rate", "Loan rate", 2, 12, 0.05, 7.5, "pct") + rng(u + "-dscr", "Lender's minimum coverage (DSCR)", 1, 1.5, 0.05, 1.25, "x") +
      rng(u + "-ltv", "Lender's maximum loan-to-value", 50, 90, 5, 75, "pct") +
      note("Largest loan whose 30-year payment fits: payment ≤ NOI ÷ DSCR. The lender lends the smaller of that amount and the loan-to-value limit. Many lenders use gross rent less some expenses rather than full NOI; check the lender's own definition."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function pvLoan(pay, r) { var m = r / 12; return m === 0 ? pay * 360 : pay * (1 - Math.pow(1 + m, -360)) / m; }
    function run() {
      var P = num(el, "price"), noi = num(el, "noi"), r = rv(el, "rate") / 100, dscr = rv(el, "dscr"), ltv = rv(el, "ltv") / 100;
      var byIncome = pvLoan(noi / dscr / 12, r), byValue = P * ltv, loan = Math.min(byIncome, byValue);
      self(el, "k").innerHTML = kpi("Loan the income supports", money(byIncome)) + kpi("Loan the LTV limit allows", money(byValue)) +
        kpi("Loan you can get", money(loan)) + kpi("Cash needed as down payment", money(Math.max(0, P - loan))) + kpi("Down payment as % of price", P > 0 ? pct(Math.max(0, P - loan) / P * 100, 0) : "—");
      var s1 = [], s2 = [];
      for (var x = 3; x <= 11; x += 0.25) { s1.push([x, pvLoan(noi / dscr / 12, x / 100)]); s2.push([x, byValue]); }
      INV.lineChart(self(el, "c"), { label: "Maximum loan by interest rate", height: 240, xTitle: "Loan rate (%)", yFmt: ms, xFmt: function (v) { return v + "%"; },
        series: [{ name: "Supported by the income", color: "var(--s1)", data: s1 }, { name: "LTV limit", color: "var(--s6)", data: s2, dash: "5 4" }], dots: [{ x: r * 100, y: byIncome, color: "var(--s1)" }] });
      var at5 = pvLoan(noi / dscr / 12, 0.05);
      self(el, "n2").innerHTML = "With " + money(noi) + " of NOI and a " + dscr.toFixed(2) + "× coverage test, the income supports " + money(byIncome) + " at " + pct(r * 100, 2) + ", versus " + money(at5) +
        " at 5%. When rates rise, the same building supports a smaller loan: buyers must bring more cash, or pay less, which is one way higher rates push property values down.";
    }
    wire(el, run);
  };

  /* ======================================================================
     10. Self-manage or hire a property manager (INV-067)
     ====================================================================== */
  TOOLS.s9aManage = function (el) {
    var u = uid(el);
    shell(el, "Self-manage or hire a property manager?", "Calculator",
      numf(u + "-rent", "Monthly rent ($)", 2100, 25) + rng(u + "-fee", "Management fee (% of collected rent)", 0, 15, 0.5, 10, "pct") +
      rng(u + "-lease", "Leasing fee per new tenant (% of one month's rent)", 0, 100, 5, 50, "pct") +
      rng(u + "-turn", "New tenants per year (0.5 = every two years)", 0, 2, 0.25, 0.5) + rng(u + "-vac", "Vacancy", 0, 20, 0.5, 7, "pct") +
      rng(u + "-hm", "Your hours per month, routine", 0, 20, 0.5, 4, "hr") + rng(u + "-ht", "Your hours per tenant turnover", 0, 60, 1, 20, "hr") +
      numf(u + "-wage", "What an hour of your time is worth ($)", 40, 5) +
      note("Fees are illustrative; managers quote many structures (a percentage of rent, flat monthly fees, leasing and renewal fees, markups on repairs). Put in real quotes. The calculator ignores the value of a manager's legal knowledge and the risk of your own mistakes, which can matter more than the fee."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var rent = num(el, "rent"), fee = rv(el, "fee") / 100, lease = rv(el, "lease") / 100, turn = rv(el, "turn"), vac = rv(el, "vac") / 100,
        hm = rv(el, "hm"), ht = rv(el, "ht"), wage = num(el, "wage");
      var collected = rent * 12 * (1 - vac), mgr = collected * fee + rent * lease * turn, hours = hm * 12 + ht * turn, you = hours * wage;
      var per = hours > 0 ? mgr / hours : NaN;
      self(el, "k").innerHTML = kpi("Manager's cost per year", money(mgr)) + kpi("Your hours per year", hours.toFixed(0)) + kpi("Your time, valued", money(you)) +
        kpi("Self-managing pays you", isFinite(per) ? money(per, 2) + "/hr" : "no hours entered") + kpi("Manager as % of collected rent", collected > 0 ? pct(mgr / collected * 100, 1) : "—");
      INV.barChart(self(el, "c"), { label: "Cost of management per year", height: 220, allLabels: true, valueLabels: true, yFmt: ms, tipFmt: function (v) { return money(v); },
        data: [{ label: "Manager's fees", y: mgr, color: "var(--s5)" }, { label: "Your time at your rate", y: you, color: "var(--s1)" }] });
      self(el, "n2").innerHTML = "Self-managing saves " + money(mgr) + " a year in fees and costs you about " + hours.toFixed(0) + " hours — an effective pay of " + (isFinite(per) ? "<b>" + money(per, 2) + " an hour</b>" : "—") +
        ", before taxes. Emergencies, evictions and a bad tenant can multiply the hours in a single year.";
    }
    wire(el, run);
  };
})();
