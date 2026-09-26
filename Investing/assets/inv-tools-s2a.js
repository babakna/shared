/* Investing Learning Lab - Stage 2 calculators (INV-008 to INV-012) - V1.0 (September 2026)
   Namiranian, Babak. Every tool computes from its stated formula in the browser.
   Default rates are dated in each tool's note; change them to your own quotes. */
(function () {
  "use strict";
  var INV = window.INV; if (!INV || !INV.tools) return;
  var esc = INV.esc, money = INV.money, ms = INV.moneyShort, pct = INV.pct;
  var TOOLS = INV.tools;

  /* ---------- local copies of the inv-tools.js helpers (they are private there) ---------- */
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
  function seg(label, name, opts, val) {
    return '<div class="fld"><label>' + esc(label) + '</label><div class="seg" role="group" data-seg="' + name + '">' + opts.map(function (o) {
      return '<button type="button" data-v="' + esc(o[0]) + '" aria-pressed="' + (o[0] === val ? "true" : "false") + '">' + esc(o[1]) + "</button>"; }).join("") + "</div></div>";
  }
  function note(t) { return '<p class="hint" style="font-size:.76rem;color:var(--muted)">' + t + "</p>"; }
  function self(el, id) { return el.querySelector("#" + el.dataset.uid + "-" + id); }
  function uid(el) { if (!el.dataset.uid) el.dataset.uid = "t" + Math.random().toString(36).slice(2, 8); return el.dataset.uid; }
  function fmtOut(input) {
    var o = input.parentNode.querySelector("output"); if (!o) return;
    var f = input.getAttribute("data-fmt"), v = Number(input.value);
    var dp = input.step.indexOf(".") > -1 ? input.step.split(".")[1].length : 0;
    o.textContent = f === "pct" ? v.toFixed(dp) + "%" : f === "yr" ? v + (v === 1 ? " year" : " years") : f === "mo" ? v + (v === 1 ? " month" : " months") :
      f === "x" ? v.toFixed(dp) + "×" : f === "rung" ? v + (v === 1 ? " rung" : " rungs") : String(v);
  }
  function wire(el, fn) {
    el.querySelectorAll("input,select").forEach(function (i) {
      i.addEventListener("input", function () { if (i.type === "range") fmtOut(i); fn(); });
      i.addEventListener("change", fn);
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

  /* 2026 federal brackets, IRS Rev. Proc. 2025-32 (tops of the 10% ... 35% brackets) */
  var BR = {
    single: [12400, 50400, 105700, 201775, 256225, 640600],
    mfj: [24800, 100800, 211400, 403550, 512450, 768700],
    hoh: [17700, 67450, 105700, 201750, 256200, 640600]
  };
  var RATES = [10, 12, 22, 24, 32, 35, 37];
  function bracket(status, ti) { var b = BR[status] || BR.mfj; for (var i = 0; i < b.length; i++) if (ti <= b[i]) return RATES[i]; return 37; }

  /* ---------- 1. Where should short-term money go? (INV-008) ---------- */
  TOOLS.s2aCash = function (el) {
    var u = uid(el);
    shell(el, "Where should short-term money go?", "Calculator",
      numf(u + "-a", "Amount ($)", 20000, 500) +
      rng(u + "-m", "How long until you need it", 1, 60, 1, 12, "mo") +
      sel(u + "-f", "Your federal tax bracket (2026)", RATES.map(function (r) { return [r, r + "%"]; }), 22) +
      rng(u + "-s", "Your state income tax rate", 0, 11, 0.1, 3.5, "pct") +
      rng(u + "-r1", "Typical bank savings rate", 0, 6, 0.01, 0.37, "pct") +
      rng(u + "-r2", "High-yield savings quote", 0, 6, 0.05, 3.8, "pct") +
      rng(u + "-r3", "CD quote (for this term)", 0, 6, 0.05, 4, "pct") +
      rng(u + "-r4", "Money market fund 7-day yield", 0, 6, 0.05, 4.1, "pct") +
      rng(u + "-r5", "Treasury bill yield (this term)", 0, 6, 0.01, 4.24, "pct") +
      note("Defaults: typical savings 0.37% is the FDIC national average (published September 21, 2026); the 3-month T-bill yield was 4.24% on September 25, 2026 (U.S. Treasury). The high-yield savings, CD and fund rates are placeholders; enter real quotes. The I bond uses the 4.26% composite rate for May–October 2026, assumed unchanged. Treasury and I bond interest is free of state tax; the others are fully taxed. A CD held to its term has no penalty."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var A = num(el, "a"), m = Number(self(el, "m").value), f = Number(self(el, "f").value) / 100, s = Number(self(el, "s").value) / 100;
      var yrs = m / 12;
      function earn(rate, months) { return A * (Math.pow(1 + rate / 100, months / 12) - 1); }
      var opts = [
        { k: "Big-bank savings", r: Number(self(el, "r1").value), st: true },
        { k: "High-yield savings", r: Number(self(el, "r2").value), st: true },
        { k: "CD", r: Number(self(el, "r3").value), st: true },
        { k: "Money market fund", r: Number(self(el, "r4").value), st: true },
        { k: "Treasury bills", r: Number(self(el, "r5").value), st: false },
        { k: "I bond", r: 4.26, st: false, ibond: true, cap: 10000 }
      ];
      opts.forEach(function (o) {
        var gross, note2 = "";
        if (o.ibond) {
          var inI = Math.min(A, o.cap), extra = A - inI, tb = opts[4].r;
          var shareI = function (rate, months) { return inI * (Math.pow(1 + rate / 200, months / 6) - 1); }; /* I bonds compound every six months */
          if (m < 12) { gross = 0; note2 = "locked"; }
          else if (m < 60) { gross = shareI(o.r, m - 3); note2 = "3-month penalty"; }
          else gross = shareI(o.r, m);
          if (extra > 0 && m >= 12) { gross += extra * (Math.pow(1 + tb / 100, m / 12) - 1); note2 += (note2 ? "; " : "") + "amount above $10,000 in T-bills"; o.k = "I bond + T-bills"; }
        } else gross = earn(o.r, m);
        o.gross = gross; o.after = gross * (1 - f - (o.st ? s : 0)); o.note = note2;
      });
      var best = opts.reduce(function (a, b) { return b.after > a.after ? b : a; });
      var base = opts[0];
      self(el, "k").innerHTML = kpi("Best after tax", esc(best.k)) + kpi("It earns, after tax", money(best.after, 0), "good") +
        kpi("Big-bank savings earns", money(base.after, 0), base.after < best.after ? "bad" : "") + kpi("Difference", money(best.after - base.after, 0));
      INV.barChart(self(el, "c"), { label: "After-tax interest by option", height: 230, allLabels: true, valueLabels: true, yFmt: function (v) { return money(v, 0); },
        data: opts.map(function (o) { return { label: o.k + (o.note.indexOf("locked") === 0 ? " (locked)" : ""), tip: o.k + (o.note ? " — " + o.note : ""), y: o.after, color: o === best ? "var(--s2)" : o.ibond ? "var(--s4)" : "var(--s1)" }; }) });
      var ib = opts[5];
      self(el, "n").innerHTML = "After-tax interest on " + money(A, 0) + " over " + m + (m === 1 ? " month" : " months") + " (" + yrs.toFixed(2) + " years). " +
        (ib.note.indexOf("locked") === 0 ? "An I bond cannot be cashed in during its first 12 months, so it is not an option for money needed sooner. " : ib.note.indexOf("penalty") > -1 ? "Cashed before 5 years, an I bond gives up its last 3 months of interest; that is included. " : "") +
        (A > 10000 && m >= 12 ? "I bond purchases are limited to $10,000 per person per calendar year, so the I bond bar assumes the first $10,000 in an I bond and the rest in T-bills. " : "") +
        "Combined tax on fully taxed interest: " + pct((f + s) * 100, 1) + "; on Treasury and I bond interest: " + pct(f * 100, 0) + ". State income tax deductions and the time value of taxes are ignored.";
    }
    wire(el, run);
  };

  /* ---------- 2. Bond price, yield and duration (INV-009) ---------- */
  function bondMath(c, y, n, fq) {
    /* per $100 of face value. c, y as decimals; n years; fq payments per year */
    var N = Math.max(1, Math.round(n * fq)), cp = 100 * c / fq, i = y / fq, P = 0, D = 0, C = 0;
    for (var t = 1; t <= N; t++) {
      var cf = cp + (t === N ? 100 : 0), pv = cf / Math.pow(1 + i, t);
      P += pv; D += (t / fq) * pv; C += pv * t * (t + 1);
    }
    var mac = D / P, mod = mac / (1 + i), conv = C / (P * fq * fq * Math.pow(1 + i, 2));
    return { P: P, mac: mac, mod: mod, conv: conv };
  }
  INV.s2aBondMath = bondMath;
  TOOLS.s2aBond = function (el) {
    var u = uid(el);
    shell(el, "Bond price, yield and duration", "Calculator",
      numf(u + "-fv", "Face value ($)", 1000, 100) +
      rng(u + "-c", "Coupon rate", 0, 10, 0.25, 3, "pct") +
      rng(u + "-y", "Market yield (yield to maturity)", 0.25, 12, 0.05, 5, "pct") +
      rng(u + "-n", "Years to maturity", 1, 30, 1, 10, "yr") +
      sel(u + "-q", "Coupons paid", [[2, "Twice a year (most US bonds)"], [1, "Once a year"]], 2) +
      note("Price = the present value of every coupon and the face value, discounted at the market yield. Macaulay duration is the present-value-weighted average time to each payment; modified duration = Macaulay ÷ (1 + yield per period). Priced on a coupon date (no accrued interest)."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var F = num(el, "fv"), c = Number(self(el, "c").value) / 100, y = Number(self(el, "y").value) / 100, n = Number(self(el, "n").value), fq = Number(self(el, "q").value) || 2;
      var yDn = Math.max(0, y - 0.01), b = bondMath(c, y, n, fq), up = bondMath(c, y + 0.01, n, fq), dn = bondMath(c, yDn, n, fq);
      var price = b.P * F / 100, cy = c * 100 / b.P * 100;
      var chUp = (up.P / b.P - 1) * 100, chDn = (dn.P / b.P - 1) * 100, est = -b.mod * 1 + 0.5 * b.conv * 0.0001 * 100;
      var tag = Math.abs(b.P - 100) < 0.005 ? "At par" : b.P > 100 ? "Premium" : "Discount";
      self(el, "k").innerHTML = kpi("Price", money(price, 2)) + kpi("Price per $100", b.P.toFixed(2) + " · " + tag) + kpi("Current yield", pct(cy, 2)) +
        kpi("Macaulay duration", b.mac.toFixed(2) + " yrs") + kpi("Modified duration", b.mod.toFixed(2)) + kpi("If yields rise 1 point", pct(chUp, 1), "bad") + kpi(y - 0.01 >= -1e-9 ? "If yields fall 1 point" : "If yields fall to 0%", "+" + chDn.toFixed(1) + "%", "good");
      var pts = [], tan = [];
      for (var yy = 0.25; yy <= 12.001; yy += 0.25) { var bb = bondMath(c, yy / 100, n, fq); pts.push([yy, bb.P * F / 100]); var tv = price * (1 - b.mod * (yy / 100 - y)); tan.push([yy, tv >= 0 ? tv : NaN]); }
      INV.lineChart(self(el, "ch"), { label: "Price versus yield", height: 250, xTitle: "Market yield (%)", yTitle: "Price ($)", zeroBase: false, xFmt: function (v) { return v + "%"; }, yFmt: function (v) { return money(v, 0); }, tipFmt: function (v) { return money(v, 2); },
        yMin: Math.max(0, Math.min.apply(null, pts.concat(tan).filter(function (p) { return isFinite(p[1]); }).map(function (p) { return p[1]; }))), yMax: Math.max.apply(null, pts.concat(tan).filter(function (p) { return isFinite(p[1]); }).map(function (p) { return p[1]; })),
        series: [{ name: "Actual price", color: "var(--s1)", data: pts }, { name: "Duration's straight-line estimate", color: "var(--s3)", data: tan, dash: "5 4", width: 1.6 }],
        dots: [{ x: y * 100, y: price, label: money(price, 0), color: "var(--s1)" }] });
      self(el, "n2").innerHTML = "At a " + pct(y * 100, 2) + " yield, this " + n + "-year, " + pct(c * 100, 2) + " bond is worth <b>" + money(price, 2) + "</b>. Modified duration " + b.mod.toFixed(2) +
        " predicts a price change of about " + (b.mod).toFixed(1) + "% for each 1-point move in yields; adding convexity (" + b.conv.toFixed(1) + ") refines the estimate for a 1-point rise to " + pct(est, 1) + ", against an exact " + pct(chUp, 1) + ". The curve bends (convexity), so the straight line always underestimates the price.";
    }
    wire(el, run);
  };

  /* ---------- 3. Tax-equivalent yield (INV-010) ---------- */
  TOOLS.s2aTey = function (el) {
    var u = uid(el);
    shell(el, "Municipal bond or taxable bond?", "Calculator",
      rng(u + "-m", "Municipal bond yield", 0.5, 6, 0.05, 3.2, "pct") +
      rng(u + "-t", "Taxable bond yield you are comparing with", 0.5, 8, 0.05, 4.8, "pct") +
      sel(u + "-fs", "Filing status", [["mfj", "Married filing jointly"], ["single", "Single"], ["hoh", "Head of household"]], "mfj") +
      numf(u + "-ti", "Taxable income, 2026 ($)", 227800, 1000, "Sets your 2026 federal bracket") +
      rng(u + "-s", "State income tax rate", 0, 11, 0.05, 4, "pct") +
      seg("The municipal bond is", "muni", [["in", "From my state"], ["out", "From another state"]], "in") +
      seg("The taxable bond is", "tax", [["corp", "Corporate or CD"], ["tsy", "US Treasury"]], "corp") +
      seg("Net investment income tax (3.8%)", "niit", [["no", "Does not apply"], ["yes", "Applies"]], "no") +
      note("2026 federal brackets from IRS Rev. Proc. 2025-32. Tax-exempt interest is not net investment income. Treasury interest is exempt from state and local tax. Ignores the alternative minimum tax on private activity bonds, state deductions for federal tax, and how interest affects the taxation of Social Security benefits."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var ym = Number(self(el, "m").value), yt = Number(self(el, "t").value), fs = self(el, "fs").value, ti = num(el, "ti"), s = Number(self(el, "s").value) / 100;
      var inState = segVal(el, "muni") !== "out", tsy = segVal(el, "tax") === "tsy", niit = segVal(el, "niit") === "yes" ? 0.038 : 0;
      var fr = bracket(fs, ti) / 100;
      var taxRateTaxable = fr + niit + (tsy ? 0 : s), muniAfter = ym * (1 - (inState ? 0 : s)), taxAfter = yt * (1 - taxRateTaxable);
      var tey = muniAfter / (1 - taxRateTaxable), simple = ym / (1 - fr);
      var win = muniAfter >= taxAfter ? "Municipal, by " + (muniAfter - taxAfter).toFixed(2) + " pts" : "Taxable, by " + (taxAfter - muniAfter).toFixed(2) + " pts";
      self(el, "k").innerHTML = kpi("Federal bracket, 2026", pct(fr * 100, 0)) + kpi("Tax rate on the taxable bond", pct(taxRateTaxable * 100, 1)) +
        kpi("Tax-equivalent yield", pct(tey, 2), "good") + kpi("After tax: muni vs taxable", pct(muniAfter, 2) + " vs " + pct(taxAfter, 2)) + kpi("Higher after tax", esc(win));
      INV.barChart(self(el, "c"), { label: "Tax-equivalent yield by bracket", height: 220, allLabels: true, valueLabels: true, xTitle: "Federal bracket (2026)", yFmt: function (v) { return v.toFixed(1) + "%"; }, tipFmt: function (v) { return v.toFixed(2) + "%"; },
        data: RATES.map(function (r) { var tr = r / 100 + niit + (tsy ? 0 : s); return { label: r + "%", tip: r + "% bracket", y: muniAfter / (1 - tr), color: r / 100 === fr ? "var(--s2)" : "var(--s6)" }; }) });
      self(el, "n").innerHTML = "Tax-equivalent yield = municipal yield after any state tax ÷ (1 − tax rate the taxable bond would bear) = " + muniAfter.toFixed(2) + "% ÷ (1 − " + (taxRateTaxable * 100).toFixed(1) + "%) = <b>" + tey.toFixed(2) + "%</b>. " +
        "The quick federal-only version, " + ym.toFixed(2) + "% ÷ (1 − " + (fr * 100).toFixed(0) + "%) = " + simple.toFixed(2) + "%. A taxable bond must yield more than the tax-equivalent yield to leave you ahead.";
    }
    wire(el, run);
  };

  /* ---------- 4. Bond ladder builder (INV-010) ---------- */
  var CURVES = {
    "2026": { t: "Treasury curve, Sep 25, 2026", p: [[1, 4.50], [2, 4.81], [3, 4.94], [5, 4.98], [7, 5.06], [10, 5.17]] },
    "2023": { t: "Treasury curve, Jul 3, 2023 (inverted)", p: [[1, 5.43], [2, 4.94], [3, 4.56], [5, 4.19], [7, 4.03], [10, 3.86]] },
    "2022": { t: "Treasury curve, Jan 3, 2022 (low rates)", p: [[1, 0.40], [2, 0.78], [3, 1.04], [5, 1.37], [7, 1.55], [10, 1.63]] }
  };
  function interp(p, x) { if (x <= p[0][0]) return p[0][1]; for (var i = 1; i < p.length; i++) if (x <= p[i][0]) { var a = p[i - 1], b = p[i]; return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); } return p[p.length - 1][1]; }
  INV.s2aInterp = interp; INV.s2aCurves = CURVES;
  TOOLS.s2aLadder = function (el) {
    var u = uid(el);
    shell(el, "Build a bond ladder", "Calculator",
      numf(u + "-a", "Amount to invest ($)", 20000, 1000) +
      rng(u + "-r", "Number of rungs (one maturing each year)", 1, 10, 1, 4, "rung") +
      rng(u + "-s", "First rung matures in year", 1, 5, 1, 3) +
      sel(u + "-cv", "Yields to use", [["2026", CURVES["2026"].t], ["2023", CURVES["2023"].t], ["2022", CURVES["2022"].t]], "2026") +
      note("Equal amounts are bought at par today, one rung maturing each year starting in the year you choose; each pays a yearly coupon equal to the Treasury par yield for its maturity (interpolated between published points; U.S. Treasury Daily Par Yield Curve). Interest is shown when received, before tax; nothing is reinvested. Beyond 10 years the 10-year yield is used."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var A = num(el, "a"), n = Number(self(el, "r").value), s0 = Number(self(el, "s").value), cv = CURVES[self(el, "cv").value] || CURVES["2026"];
      var each = A / n, rungs = [], totInt = 0, wy = 0, last = s0 + n - 1;
      for (var k = 0; k < n; k++) { var m = s0 + k, y = interp(cv.p, m); rungs.push({ m: m, y: y }); wy += y; }
      var data = [], firstCash = 0;
      for (var yr = 1; yr <= last; yr++) {
        var intr = 0, prin = 0; rungs.forEach(function (r) { if (r.m >= yr) intr += each * r.y / 100; if (r.m === yr) prin = each; });
        totInt += intr; if (yr === s0) firstCash = prin + intr;
        data.push({ label: "Yr " + yr, tip: "Year " + yr + ": " + money(prin, 0) + " principal + " + money(intr, 0) + " interest", y: prin + intr, color: prin ? "var(--s2)" : "var(--s6)" });
      }
      var avg = wy / n, wam = s0 + (n - 1) / 2;
      self(el, "k").innerHTML = kpi("Each rung", money(each, 0)) + kpi("Average yield", pct(avg, 2)) + kpi("Total interest", money(totInt, 0), "good") +
        kpi("Average maturity", wam.toFixed(1) + " yrs") + kpi("Cash in year " + s0, money(firstCash, 0));
      INV.barChart(self(el, "c"), { label: "Cash received each year", height: 230, allLabels: true, valueLabels: last <= 6, yFmt: function (v) { return ms(v); }, tipFmt: function (v) { return money(v, 0) + " in total"; }, data: data });
      self(el, "n").innerHTML = "A " + n + "-rung ladder of " + money(A, 0) + ": " + money(each, 0) + " matures each year from year " + s0 + " to year " + last + ", plus interest from every rung still held (gray bars are interest-only years). " +
        "Held to maturity, each rung pays its face value whatever happens to interest rates in between. The trade-off: the yields are locked, and money freed each year is spent or reinvested at whatever rates exist then.";
    }
    wire(el, run);
  };

  /* ---------- 5. Where stock returns come from (INV-011) ---------- */
  TOOLS.s2aStock = function (el) {
    var u = uid(el);
    shell(el, "Build a stock-return estimate from its parts", "Model",
      rng(u + "-d", "Dividend yield today", 0.5, 7, 0.01, 1.16, "pct") +
      rng(u + "-g", "Real (after-inflation) earnings growth per year", 0, 5, 0.1, 2.3, "pct") +
      rng(u + "-i", "Inflation per year", 0, 6, 0.1, 2.5, "pct") +
      rng(u + "-p0", "Valuation today (CAPE)", 5, 50, 0.1, 40.6, "x") +
      rng(u + "-p1", "Valuation at the end (CAPE)", 5, 50, 0.1, 40.6, "x") +
      rng(u + "-n", "Years", 5, 30, 1, 10, "yr") +
      note("Return ≈ dividend yield + real earnings growth + inflation + change in valuation, compounded: (1 + g)(1 + i)(P₁/P₀)<sup>1/n</sup> − 1 + dividend yield. Defaults: S&amp;P Composite dividend yield 1.16% (December 2025) and CAPE 40.6 (September 2026), Shiller data; 2.3% is the December 1928 to December 2025 real earnings-per-share growth rate in the same data. A model to explore assumptions, not a forecast."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var d = Number(self(el, "d").value) / 100, g = Number(self(el, "g").value) / 100, i = Number(self(el, "i").value) / 100,
        p0 = Number(self(el, "p0").value), p1 = Number(self(el, "p1").value), n = Number(self(el, "n").value);
      var v = Math.pow(p1 / p0, 1 / n) - 1;
      var price = (1 + g) * (1 + i) * (1 + v) - 1, nom = price + d, real = (1 + nom) / (1 + i) - 1;
      var end = 10000 * Math.pow(1 + nom, n);
      self(el, "k").innerHTML = kpi("Return per year", pct(nom * 100, 1), nom >= 0 ? "good" : "bad") + kpi("After inflation", pct(real * 100, 1)) +
        kpi("Valuation effect / yr", (v >= 0 ? "+" : "") + pct(v * 100, 1), v < 0 ? "bad" : "") + kpi("$10,000 becomes", money(end, 0));
      INV.barChart(self(el, "c"), { label: "Parts of the return", height: 220, allLabels: true, valueLabels: true, yFmt: function (x) { return x.toFixed(1) + "%"; },
        data: [{ label: "Dividends", y: d * 100, color: "var(--s2)" }, { label: "Real growth", y: g * 100, color: "var(--s1)" }, { label: "Inflation", y: i * 100, color: "var(--s3)" },
          { label: "Valuation", y: v * 100, color: v < 0 ? "var(--s5)" : "var(--s4)" }, { label: "Total", y: nom * 100, color: "var(--s6)" }] });
      self(el, "n2").innerHTML = "Moving the valuation from " + p0.toFixed(1) + "× to " + p1.toFixed(1) + "× over " + n + " years " + (v >= 0 ? "adds <b>+" + pct(v * 100, 2) : "subtracts <b>" + pct(-v * 100, 2)) + "</b> a year. " +
        "Dividends and earnings growth are the business's contribution; the valuation change is what other investors decide to pay. Over long periods the first two dominate; over a decade the third can swamp them.";
    }
    wire(el, run);
  };

  /* ---------- 6. Compare two funds (INV-012) ---------- */
  TOOLS.s2aFunds = function (el) {
    var u = uid(el);
    shell(el, "Compare two funds, cost by cost", "Calculator",
      numf(u + "-a", "Amount invested ($)", 50000, 1000) +
      rng(u + "-n", "Years held", 1, 40, 1, 20, "yr") +
      rng(u + "-r", "Return of the holdings, before any costs", 0, 12, 0.5, 7, "pct") +
      rng(u + "-e1", "Fund A: expense ratio", 0, 2, 0.01, 0.04, "pct") +
      rng(u + "-l1", "Fund A: front-end sales load", 0, 5.75, 0.25, 0, "pct") +
      rng(u + "-t1", "Fund A: yearly tax cost of distributions", 0, 2, 0.05, 0.3, "pct") +
      rng(u + "-e2", "Fund B: expense ratio", 0, 2, 0.01, 0.95, "pct") +
      rng(u + "-l2", "Fund B: front-end sales load", 0, 5.75, 0.25, 5.75, "pct") +
      rng(u + "-t2", "Fund B: yearly tax cost of distributions", 0, 2, 0.05, 1, "pct") +
      seg("Account", "acct", [["tax", "Taxable brokerage"], ["def", "IRA, 401(k) or Roth"]], "tax") +
      note("Ending value = amount × (1 − load) × (1 + return − expense ratio − tax cost)<sup>years</sup>. The tax cost stands for taxes paid each year on dividends and capital-gains distributions (Morningstar calls a fund's version its tax-cost ratio); it is ignored in tax-advantaged accounts. Taxes due when you finally sell are not included."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var A = num(el, "a"), n = Number(self(el, "n").value), r = Number(self(el, "r").value) / 100, taxable = segVal(el, "acct") !== "def";
      function f(k) { var e = Number(self(el, "e" + k).value) / 100, l = Number(self(el, "l" + k).value) / 100, t = taxable ? Number(self(el, "t" + k).value) / 100 : 0; return { e: e, l: l, t: t, net: r - e - t }; }
      var a = f(1), b = f(2), pa = [[0, A * (1 - a.l)]], pb = [[0, A * (1 - b.l)]], pz = [[0, A]];
      for (var y = 1; y <= n; y++) { pa.push([y, A * (1 - a.l) * Math.pow(1 + a.net, y)]); pb.push([y, A * (1 - b.l) * Math.pow(1 + b.net, y)]); pz.push([y, A * Math.pow(1 + r, y)]); }
      var va = pa[n][1], vb = pb[n][1], vz = pz[n][1];
      self(el, "k").innerHTML = kpi("Fund A ends at", money(va, 0)) + kpi("Fund B ends at", money(vb, 0)) + kpi("A minus B", money(va - vb, 0), va >= vb ? "good" : "bad") +
        kpi("Share of the no-cost result lost by B", pct(vz ? (1 - vb / vz) * 100 : 0, 0), "bad");
      INV.lineChart(self(el, "c"), { label: "Two funds over time", height: 250, xTitle: "Years", xFmt: yearFmt, yFmt: ms, tipFmt: function (v) { return money(v, 0); },
        series: [{ name: "Fund A", color: "var(--s2)", data: pa }, { name: "Fund B", color: "var(--s5)", data: pb }, { name: "No costs at all", color: "var(--s6)", data: pz, dash: "4 4", width: 1.4 }] });
      self(el, "n2").innerHTML = "Fund A nets " + pct(a.net * 100, 2) + " a year" + (a.l ? " after a " + pct(a.l * 100, 2) + " load" : "") + "; Fund B nets " + pct(b.net * 100, 2) + (b.l ? " after a " + pct(b.l * 100, 2) + " load" : "") + ". " +
        (taxable ? "In a taxable account, distributions are taxed every year, even when reinvested." : "Inside a tax-advantaged account, yearly distributions are not taxed, so only the expense ratio and any load matter.");
    }
    wire(el, run);
  };
})();
