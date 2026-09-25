/* Investing Learning Lab - Stage 2 calculators (INV-013 to INV-017) - V1.0 (September 2026)
   Namiranian, Babak. Every tool computes from its stated formula in the browser.
   Mortality in the income-annuity tool: Social Security Administration, 2023 period life table
   (as used in the 2026 Trustees Report), qx for ages 55-119. Historical returns: window.INV_RETURNS
   (Damodaran, NYU Stern, 1928-2025). Load after assets/inv-tools.js. */
(function () {
  "use strict";
  var INV = window.INV; if (!INV) return;
  var esc = INV.esc, money = INV.money, ms = INV.moneyShort, pct = INV.pct;
  var TOOLS = INV.tools = INV.tools || {};

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
    return '<div class="fld"><label for="' + id + '">' + esc(label) + '</label><select id="' + id + '">' +
      opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[2] ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select></div>";
  }
  function seg(label, name, opts) {
    return '<div class="fld"><label>' + esc(label) + '</label><div class="seg" role="group" data-seg="' + name + '">' +
      opts.map(function (o, i) { return '<button type="button" data-v="' + esc(o[0]) + '" aria-pressed="' + (i === 0 ? "true" : "false") + '">' + esc(o[1]) + "</button>"; }).join("") + "</div></div>";
  }
  function note(t) { return '<p class="hint" style="font-size:.76rem;color:var(--muted)">' + t + "</p>"; }
  function self(el, id) { return el.querySelector("#" + el.dataset.uid + "-" + id); }
  function uid(el) { if (!el.dataset.uid) el.dataset.uid = "s" + Math.random().toString(36).slice(2, 8); return el.dataset.uid; }
  function fmtOut(input) {
    var o = input.parentNode.querySelector("output"); if (!o) return;
    var f = input.getAttribute("data-fmt"), v = Number(input.value);
    var dp = input.step.indexOf(".") > -1 ? input.step.split(".")[1].length : 0;
    o.textContent = f === "pct" ? v.toFixed(dp) + "%" : f === "spct" ? (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(dp) + "%" :
      f === "yr" ? v + (v === 1 ? " year" : " years") : f === "age" ? "age " + v : f === "n" ? String(v) : f === "ctr" ? v + (v === 1 ? " contract" : " contracts") :
      f === "day" ? v + (v === 1 ? " day" : " days") : f === "rho" ? v.toFixed(2) : String(v);
  }
  function wire(el, fn) {
    el.querySelectorAll("input,select").forEach(function (i) {
      i.addEventListener("input", function () { if (i.type === "range") fmtOut(i); fn(); });
      i.addEventListener("change", function () { fn(); });
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
  function segVal(el, name) { var b = el.querySelector('.seg[data-seg="' + name + '"] button[aria-pressed="true"]'); return b ? b.getAttribute("data-v") : ""; }
  function kpi(k, v, cls) { return '<div class="kpi"><div class="k">' + esc(k) + '</div><div class="v ' + (cls || "") + '">' + v + "</div></div>"; }
  function num(el, id, dflt) { var v = Number(self(el, id).value); return isFinite(v) && self(el, id).value !== "" ? v : (dflt || 0); }
  function yearFmt(v) { return String(Math.round(v)); }
  function sgn(v, dp) { return (v > 0 ? "+" : "") + pct(v, dp == null ? 1 : dp); }
  function sd(a) { if (a.length < 2) return 0; var m = a.reduce(function (s, x) { return s + x; }, 0) / a.length; return Math.sqrt(a.reduce(function (s, x) { return s + (x - m) * (x - m); }, 0) / (a.length - 1)); }

  /* ---------- 1. Roll yield and the futures fund (INV-013) ---------- */
  TOOLS.s2bRoll = function (el) {
    var u = uid(el);
    shell(el, "Why a commodity fund can trail the commodity", "Model",
      numf(u + "-a", "Amount invested ($)", 10000, 500) +
      rng(u + "-s", "Change in the spot price, per year", -10, 15, 0.5, 2, "spct") +
      rng(u + "-r", "Roll yield per year (negative = contango)", -15, 10, 0.5, -4, "spct") +
      rng(u + "-c", "Interest on the fund's cash collateral", 0, 6, 0.25, 3.5, "pct") +
      rng(u + "-e", "Fund expense ratio", 0, 1.5, 0.05, 0.75, "pct") +
      rng(u + "-n", "Years held", 1, 30, 1, 10, "yr") +
      note("Model: each year the fund earns (1 + spot change) × (1 + roll yield) × (1 + collateral interest) × (1 − expense ratio) − 1. The spot line ignores the storage and insurance cost of holding the physical commodity. An idealized model, not a forecast."),
      '<div class="kpis" id="' + u + '-kp"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-nt"></p>');
    function run() {
      var A = num(el, "a"), s = num(el, "s") / 100, r = num(el, "r") / 100, c = num(el, "c") / 100, e = num(el, "e") / 100, n = num(el, "n", 1);
      var fy = (1 + s) * (1 + r) * (1 + c) * (1 - e) - 1;
      var ps = [[0, A]], pf = [[0, A]], pz = [[0, A]];
      var fz = (1 + s) * (1 + c) * (1 - e) - 1;
      for (var t = 1; t <= n; t++) { ps.push([t, A * Math.pow(1 + s, t)]); pf.push([t, A * Math.pow(1 + fy, t)]); pz.push([t, A * Math.pow(1 + fz, t)]); }
      var endS = A * Math.pow(1 + s, n), endF = A * Math.pow(1 + fy, n);
      self(el, "kp").innerHTML = kpi("Spot price, total change", sgn((Math.pow(1 + s, n) - 1) * 100, 0)) + kpi("Fund value at the end", money(endF), endF < A ? "bad" : "good") +
        kpi("Fund return / yr", sgn(fy * 100, 2), fy < 0 ? "bad" : "good") + kpi("Fund minus spot, per year", sgn((fy - s) * 100, 2), fy < s ? "bad" : "good");
      INV.lineChart(self(el, "ch"), { label: "Spot price versus a futures-based fund", height: 250, xTitle: "Years", yFmt: ms, xFmt: yearFmt, zeroBase: false,
        series: [{ name: "Spot price (no storage cost)", color: "var(--s7)", data: ps, dash: "5 4" }, { name: "Futures fund, your roll yield", color: "var(--s5)", data: pf, width: 3 }, { name: "Futures fund if roll yield were zero", color: "var(--s6)", data: pz, width: 1.4 }] });
      self(el, "nt").innerHTML = "Over " + n + (n === 1 ? " year" : " years") + " the spot price turns " + money(A) + " into " + money(endS) + ", while the fund ends at <b>" + money(endF) + "</b>. " +
        (r < 0 ? "In <b>contango</b> the fund sells each expiring contract and buys the next one at a higher price, so it loses about " + pct(-r * 100, 1) + " a year even when the spot price is flat." :
          r > 0 ? "In <b>backwardation</b> the next contract is cheaper than the one being sold, so rolling adds about " + pct(r * 100, 1) + " a year." : "With a flat futures curve, rolling neither adds nor subtracts.") +
        " The interest earned on the cash collateral is part of the fund's return, which is why a fully collateralized futures fund can beat the spot price when rates are high and the curve is flat.";
    }
    wire(el, run);
  };

  /* ---------- 2. Two-and-twenty fees (INV-014) ---------- */
  TOOLS.s2bFees = function (el) {
    var u = uid(el);
    shell(el, "What 2-and-20 takes from a fund's return", "Calculator",
      numf(u + "-a", "Amount invested ($)", 250000, 5000) +
      rng(u + "-g", "Fund return before fees, per year", -10, 25, 0.5, 10, "spct") +
      rng(u + "-m", "Management fee (% of assets)", 0, 3, 0.25, 2, "pct") +
      rng(u + "-p", "Performance fee (% of profits)", 0, 30, 1, 20, "pct") +
      rng(u + "-h", "Hurdle rate before the performance fee applies", 0, 10, 0.5, 0, "pct") +
      rng(u + "-n", "Years", 1, 30, 1, 10, "yr") +
      note("Each year: management fee = assets × fee; performance fee = share × (value after the management fee − the higher of the high-water mark and last year's value grown at the hurdle), if positive. The index-fund line earns the same return before fees and pays 0.05% a year."),
      '<div class="kpis" id="' + u + '-kp"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-nt"></p>');
    function run() {
      var A = num(el, "a"), g = num(el, "g") / 100, m = num(el, "m") / 100, p = num(el, "p") / 100, h = num(el, "h") / 100, n = num(el, "n", 1);
      var B = A, hwm = A, fees = 0, I = A, G = A, pb = [[0, A]], pi = [[0, A]], pg = [[0, A]];
      for (var t = 1; t <= n; t++) {
        var mf = B * m, after = B * (1 + g) - mf, bar = Math.max(hwm, B * (1 + h));
        var pf = p * Math.max(0, after - bar);
        B = after - pf; fees += mf + pf; hwm = Math.max(hwm, B);
        I = I * (1 + g) * (1 - 0.0005); G = G * (1 + g);
        pb.push([t, B]); pi.push([t, I]); pg.push([t, G]);
      }
      var net = A > 0 && B > 0 ? (Math.pow(B / A, 1 / n) - 1) * 100 : (A > 0 ? -100 : 0);
      var grossProfit = G - A, share = grossProfit > 0 ? (G - B) / grossProfit * 100 : NaN;
      self(el, "kp").innerHTML = kpi("Fund return after fees / yr", sgn(net, 2), net < g * 100 ? "bad" : "") + kpi("Fees paid, total", money(fees), "bad") +
        kpi("Share of the gross gain lost to fees", isFinite(share) ? pct(Math.min(share, 999), 0) : "no gain", "bad") + kpi("Index fund at the end", money(I), "good");
      INV.lineChart(self(el, "ch"), { label: "Fund after fees versus index fund", height: 250, xTitle: "Years", yFmt: ms, xFmt: yearFmt, zeroBase: false,
        series: [{ name: "Before any fees", color: "var(--s6)", data: pg, dash: "4 4", width: 1.4 }, { name: "Index fund, 0.05%", color: "var(--s2)", data: pi }, { name: "Fund after its fees", color: "var(--s5)", data: pb, width: 3 }] });
      self(el, "nt").innerHTML = "With these inputs the fund must earn " + pct(g * 100, 1) + " a year before fees for its investors to earn about <b>" + pct(net, 2) + "</b>. " +
        "To match the index fund after fees, the manager has to beat the market by roughly the fee gap every year. " +
        (isFinite(share) ? "Over " + n + (n === 1 ? " year" : " years") + ", fees absorb about <b>" + pct(Math.min(share, 999), 0) + "</b> of the gain the underlying investments produced." : "When the fund loses money, the performance fee is zero but the management fee is still charged.");
    }
    wire(el, run);
  };

  /* ---------- 3. Smoothed valuations (INV-014) ---------- */
  TOOLS.s2bSmooth = function (el) {
    var u = uid(el), H = INV.hist();
    shell(el, "How appraisal-based pricing hides risk", "Historical data",
      rng(u + "-a", "Smoothing: weight on last period's reported return", 0, 0.9, 0.05, 0.6, "rho") +
      sel(u + "-p", "Period", [["2000", "2000–" + H.last, 1], ["1928", "1928–" + H.last], ["2005", "2005–2012 (the 2008 crisis)"]]) +
      note("The underlying (true) returns are the S&P 500's calendar-year returns. Reported return = (1 − w) × true return + w × last year's reported return, a simple one-lag smoothing model in the spirit of research on hedge fund returns (Getmansky, Lo and Makarov, 2004). Illustration, not the record of any real fund."),
      '<div class="kpis" id="' + u + '-kp"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-nt"></p>');
    function run() {
      var w = num(el, "a"), y0 = Number(self(el, "p").value), y1 = y0 === 2005 ? 2012 : H.last;
      var tr = [], rp = [], pt = [], pr = [], prev = null, bt = 1, br = 1, tb = [];
      for (var y = y0; y <= y1; y++) {
        var i = y - H.first, x = H.stocks[i];
        var r = prev == null ? x : (1 - w) * x + w * prev; prev = r;
        tr.push(x); rp.push(r); tb.push(H.tbill[i]); pt.push([y, x]); pr.push([y, r]); bt *= 1 + x / 100; br *= 1 + r / 100;
      }
      var n = tr.length, ct = (Math.pow(bt, 1 / n) - 1) * 100, cr = (Math.pow(br, 1 / n) - 1) * 100;
      var mean = function (a) { return a.reduce(function (s, v) { return s + v; }, 0) / a.length; };
      var st = sd(tr), sr = sd(rp), rf = mean(tb);
      var shT = st > 0 ? (mean(tr) - rf) / st : 0, shR = sr > 0 ? (mean(rp) - rf) / sr : 0;
      self(el, "kp").innerHTML = kpi("True volatility", pct(st, 1)) + kpi("Reported volatility", pct(sr, 1), sr < st ? "good" : "") +
        kpi("True worst year", pct(Math.min.apply(null, tr), 1), "bad") + kpi("Reported worst year", pct(Math.min.apply(null, rp), 1)) +
        kpi("Sharpe ratio, true → reported", shT.toFixed(2) + " → " + shR.toFixed(2));
      INV.lineChart(self(el, "ch"), { label: "True versus reported annual returns", height: 250, xFmt: yearFmt, yFmt: function (v) { return Math.round(v) + "%"; }, tipFmt: function (v) { return pct(v, 1); }, zeroBase: false,
        series: [{ name: "True (market) return", color: "var(--s6)", data: pt, width: 1.6 }, { name: "Reported (smoothed) return", color: "var(--s4)", data: pr, width: 3 }] });
      self(el, "nt").innerHTML = "The same investments, reported two ways. The long-run growth rate barely changes (" + pct(ct, 1) + " true, " + pct(cr, 1) + " reported), but smoothing cuts the measured volatility from " +
        pct(st, 1) + " to <b>" + pct(sr, 1) + "</b> and pushes the worst year into later years. A portfolio model that trusts the reported figures will think the asset is far safer, and far less correlated with stocks, than it is.";
    }
    wire(el, run);
  };

  /* ---------- 4. Crypto position sizing (INV-015) ---------- */
  TOOLS.s2bCryptoSize = function (el) {
    var u = uid(el);
    shell(el, "How big a crypto position can you live with?", "Calculator",
      numf(u + "-t", "Total investment portfolio ($)", 100000, 1000) +
      rng(u + "-w", "Share in crypto assets", 0, 25, 1, 5, "pct") +
      rng(u + "-d", "Crypto falls by", 0, 95, 1, 75, "pct") +
      rng(u + "-o", "The rest of the portfolio returns", -40, 20, 1, -10, "spct") +
      rng(u + "-vc", "Crypto volatility (yearly)", 20, 100, 5, 60, "pct") +
      rng(u + "-vr", "Volatility of the rest", 5, 25, 1, 12, "pct") +
      rng(u + "-r", "Correlation between them", -0.5, 1, 0.05, 0.3, "rho") +
      note("Risk share = (w² σc² + w(1 − w) ρ σc σr) ÷ σp², where σp² = w² σc² + (1 − w)² σr² + 2 w(1 − w) ρ σc σr. Bitcoin's month-end prices on FRED (2015–2026) imply yearly volatility of about 66%."),
      '<div class="kpis" id="' + u + '-kp"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-nt"></p>');
    function risk(w, sc, sr, rho) {
      var v = w * w * sc * sc + (1 - w) * (1 - w) * sr * sr + 2 * w * (1 - w) * rho * sc * sr;
      var c = w * w * sc * sc + w * (1 - w) * rho * sc * sr;
      return { vol: Math.sqrt(Math.max(v, 0)), share: v > 0 ? c / v * 100 : 0 };
    }
    function run() {
      var T = num(el, "t"), w = num(el, "w") / 100, d = num(el, "d") / 100, o = num(el, "o") / 100, sc = num(el, "vc") / 100, sr = num(el, "vr") / 100, rho = num(el, "r");
      var lossC = T * w * d, after = T * w * (1 - d) + T * (1 - w) * (1 + o), chg = T > 0 ? (after / T - 1) * 100 : 0;
      var rk = risk(w, sc, sr, rho);
      self(el, "kp").innerHTML = kpi("Dollars lost on the crypto", money(lossC), lossC > 0 ? "bad" : "") + kpi("Whole portfolio change", sgn(chg, 1), chg < 0 ? "bad" : "good") +
        kpi("Portfolio volatility", pct(rk.vol * 100, 1)) + kpi("Crypto's share of total risk", pct(rk.share, 0), rk.share > 30 ? "bad" : "");
      var data = [0, 1, 2, 3, 5, 7, 10, 15, 20, 25].map(function (k) {
        var z = risk(k / 100, sc, sr, rho);
        return { label: k + "%", tip: k + "% in crypto", y: z.share, color: Math.round(w * 100) === k ? "var(--s5)" : "var(--s3)" };
      });
      INV.barChart(self(el, "ch"), { label: "Crypto's share of portfolio risk by allocation", height: 220, allLabels: true, valueLabels: true, xTitle: "Share of the portfolio in crypto", yFmt: function (v) { return Math.round(v) + "%"; }, tipFmt: function (v) { return pct(v, 0) + " of total risk"; }, data: data });
      self(el, "nt").innerHTML = "A " + pct(w * 100, 0) + " position looks small on a statement, but at these volatilities it supplies about <b>" + pct(rk.share, 0) + "</b> of the portfolio's total risk. " +
        "Size the position by the loss you could watch without selling everything else in a panic: here a " + pct(d * 100, 0) + " fall costs " + money(lossC) + ".";
    }
    wire(el, run);
  };

  /* ---------- 5. Option payoff at expiration (INV-016) ---------- */
  var STRATS = [["lc", "Buy a call", 1], ["lp", "Buy a put"], ["cc", "Covered call (own 100 shares, sell a call)"], ["pp", "Protective put (own 100 shares, buy a put)"], ["sp", "Sell a put (cash-secured)"], ["sc", "Sell a call without owning the shares"]];
  function payoff(k, P, S, K, c) {
    if (k === "lc") return Math.max(P - K, 0) - c;
    if (k === "lp") return Math.max(K - P, 0) - c;
    if (k === "sc") return c - Math.max(P - K, 0);
    if (k === "sp") return c - Math.max(K - P, 0);
    if (k === "cc") return (P - S) + c - Math.max(P - K, 0);
    return (P - S) - c + Math.max(K - P, 0); /* pp */
  }
  TOOLS.s2bPayoff = function (el) {
    var u = uid(el);
    shell(el, "Option payoff at expiration", "Calculator",
      sel(u + "-k", "Strategy", STRATS) +
      numf(u + "-s", "Stock price today ($)", 50, 0.5) + numf(u + "-x", "Strike price ($)", 55, 0.5) + numf(u + "-c", "Option premium per share ($)", 2, 0.05) +
      rng(u + "-q", "Number of contracts (100 shares each)", 1, 10, 1, 1, "ctr") +
      rng(u + "-m", "Stock price move by expiration", -100, 100, 1, 10, "spct") +
      note("Profit or loss at expiration = payoff per share × 100 × contracts. Ignores commissions, the bid-ask spread, dividends, taxes and early exercise. Covered call and protective put include the gain or loss on the shares."),
      '<div class="kpis" id="' + u + '-kp"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-nt"></p>');
    function run() {
      var k = self(el, "k").value, S = num(el, "s"), K = num(el, "x"), c = num(el, "c"), q = num(el, "q", 1), mv = num(el, "m") / 100;
      var mult = 100 * q, P = Math.max(0, S * (1 + mv));
      var pl = payoff(k, P, S, K, c) * mult;
      var be = { lc: K + c, lp: K - c, sc: K + c, sp: K - c, cc: S - c, pp: S + c }[k];
      var maxG, maxL;
      if (k === "lc") { maxG = "Unlimited"; maxL = money(-c * mult); }
      else if (k === "lp") { maxG = money(Math.max(K - c, 0) * mult); maxL = money(-c * mult); }
      else if (k === "sc") { maxG = money(c * mult); maxL = "Unlimited"; }
      else if (k === "sp") { maxG = money(c * mult); maxL = money(Math.min(0, c - K) * mult); }
      else if (k === "cc") { maxG = money((K - S + c) * mult); maxL = money(Math.min(0, c - S) * mult); }
      else { maxG = "Unlimited"; maxL = money(Math.min(0, K - S - c) * mult); }
      self(el, "kp").innerHTML = kpi("Profit or loss at " + money(P, 2), money(pl), pl < 0 ? "bad" : "good") + kpi("Best case", maxG, "good") + kpi("Worst case", maxL, "bad") +
        kpi("Breakeven stock price", be >= 0 ? money(be, 2) : "none");
      var hi = Math.max(S, K, 1) * 2, pts = [], stk = [];
      for (var z = 0; z <= 80; z++) { var px = hi * z / 80; pts.push([px, payoff(k, px, S, K, c) * mult]); stk.push([px, (px - S) * mult]); }
      var ser = [{ name: STRATS.filter(function (s) { return s[0] === k; })[0][1], color: "var(--s1)", data: pts, width: 3 }];
      if (S > 0) ser.push({ name: "Just owning " + (100 * q) + " shares", color: "var(--s6)", data: stk, dash: "5 4", width: 1.4 });
      INV.lineChart(self(el, "ch"), { label: "Profit or loss at expiration", height: 260, xTitle: "Stock price at expiration", xFmt: function (v) { return "$" + Math.round(v); }, yFmt: ms, tipFmt: function (v) { return money(v); }, zeroBase: false, series: ser,
        dots: [{ x: P, y: pl, color: pl < 0 ? "var(--s5)" : "var(--s2)" }] });
      var txt = { lc: "You paid " + money(c * mult) + " for the right to buy at " + money(K, 2) + ". Below the strike the call expires worthless and the whole premium is lost; above the breakeven every dollar of price rise is profit.",
        lp: "You paid " + money(c * mult) + " for the right to sell at " + money(K, 2) + ". The put gains as the price falls below the breakeven; if the price stays above the strike it expires worthless.",
        sc: "You collected " + money(c * mult) + " but promised to deliver shares you do not own at " + money(K, 2) + ". If the price soars you must buy them at the market price: the loss has no ceiling. Brokers restrict this strategy to their most experienced option accounts.",
        sp: "You collected " + money(c * mult) + " and promised to buy " + (100 * q) + " shares at " + money(K, 2) + " if assigned. Keep " + money(K * mult) + " of cash set aside for that. The most you can make is the premium; the most you can lose is the strike minus the premium, if the stock goes to zero.",
        cc: "You own the shares and sold someone the right to buy them at " + money(K, 2) + ". The premium cushions small falls and adds income, but your gain stops at the strike while almost all of the downside remains.",
        pp: "You own the shares and bought the right to sell them at " + money(K, 2) + ". Like insurance, the premium is a certain cost; in return your loss below the strike is capped." }[k];
      self(el, "nt").innerHTML = txt;
    }
    wire(el, run);
  };

  /* ---------- 6. Time decay (Black-Scholes) (INV-016) ---------- */
  function ncdf(x) { var t = 1 / (1 + 0.2316419 * Math.abs(x)), d = 0.3989422804014327 * Math.exp(-x * x / 2); var p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429)))); return x >= 0 ? 1 - p : p; }
  function bs(type, S, K, sig, r, T) {
    if (T <= 0 || sig <= 0 || S <= 0 || K <= 0) return type === "call" ? Math.max(S - K * Math.exp(-r * Math.max(T, 0)), 0) : Math.max(K * Math.exp(-r * Math.max(T, 0)) - S, 0);
    var d1 = (Math.log(S / K) + (r + sig * sig / 2) * T) / (sig * Math.sqrt(T)), d2 = d1 - sig * Math.sqrt(T);
    return type === "call" ? S * ncdf(d1) - K * Math.exp(-r * T) * ncdf(d2) : K * Math.exp(-r * T) * ncdf(-d2) - S * ncdf(-d1);
  }
  INV.s2bBlackScholes = bs;
  TOOLS.s2bDecay = function (el) {
    var u = uid(el);
    shell(el, "Time decay: what an option is worth as expiration nears", "Model",
      seg("Option type", "type", [["call", "Call"], ["put", "Put"]]) +
      numf(u + "-s", "Stock price ($)", 100, 1) + numf(u + "-k", "Strike price ($)", 100, 1) +
      rng(u + "-v", "Implied volatility (yearly)", 5, 100, 1, 30, "pct") +
      rng(u + "-r", "Interest rate", 0, 8, 0.25, 4, "pct") +
      rng(u + "-d", "Days until expiration", 1, 365, 1, 60, "day") +
      note("Black–Scholes value with the stock price held constant, no dividends, calendar days ÷ 365. Shows how the time value of an option drains away, fastest in the final weeks."),
      '<div class="kpis" id="' + u + '-kp"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-nt"></p>');
    function run() {
      var type = segVal(el, "type") || "call", S = num(el, "s"), K = num(el, "k"), v = num(el, "v") / 100, r = num(el, "r") / 100, D = num(el, "d", 1);
      var val = bs(type, S, K, v, r, D / 365), intr = type === "call" ? Math.max(S - K, 0) : Math.max(K - S, 0);
      var tomorrow = bs(type, S, K, v, r, (D - 1) / 365), theta = val - tomorrow;
      self(el, "kp").innerHTML = kpi("Value per share", money(val, 2)) + kpi("Intrinsic value", money(intr, 2)) + kpi("Time value", money(Math.max(val - intr, 0), 2)) +
        kpi("Lost by tomorrow (one contract)", money(theta * 100, 2), theta > 0 ? "bad" : "");
      var pts = [], ins = [];
      for (var i = 0; i <= 60; i++) { var el2 = D * i / 60, left = D - el2; pts.push([el2, bs(type, S, K, v, r, left / 365) * 100]); ins.push([el2, intr * 100]); }
      INV.lineChart(self(el, "ch"), { label: "Option value as time passes", height: 240, xTitle: "Days elapsed (stock price unchanged)", xFmt: function (x) { return Math.round(x) + "d"; }, yFmt: function (y) { return "$" + Math.round(y); }, tipFmt: function (y) { return money(y, 2) + " per contract"; },
        series: [{ name: "Value of one contract", color: "var(--s1)", data: pts, width: 3 }, { name: "Intrinsic value", color: "var(--s6)", data: ins, dash: "5 4", width: 1.4 }] });
      var half = bs(type, S, K, v, r, D / 2 / 365);
      self(el, "nt").innerHTML = "If the stock price does not move, this " + type + " loses " + money((val - half) * 100, 2) + " per contract in the first half of its remaining life and " + money((half - intr > 0 ? half - Math.min(intr, half) : 0) * 100, 2) +
        " in the second half. Buyers need the stock to move far enough, and soon enough, to outrun that decay; sellers collect it and carry the risk of a large move.";
    }
    wire(el, run);
  };

  /* ---------- 7. Buy term and invest the difference (INV-017) ---------- */
  TOOLS.s2bBuyTerm = function (el) {
    var u = uid(el);
    shell(el, "Cash-value policy or term insurance plus investing", "Calculator",
      numf(u + "-w", "Cash-value (whole life) premium per year ($)", 6000, 100, "From a real illustration, for the same death benefit") +
      numf(u + "-t", "Term premium per year, level for the term ($)", 450, 10) +
      rng(u + "-n", "Years (length of the term)", 5, 40, 1, 30, "yr") +
      rng(u + "-g", "Rate the policy's cash value earns on your premiums, net of all costs", -2, 6, 0.25, 2.5, "pct") +
      rng(u + "-r", "Return on the invested difference", 0, 10, 0.25, 6, "pct") +
      rng(u + "-d", "Yearly tax drag on those investments", 0, 2, 0.1, 0.5, "pct") +
      note("Cash value = premiums compounded at the policy's net rate. Investing side = (cash-value premium − term premium) invested at the start of each year, growing at (return − tax drag). Illustrative: early-year cash values in real policies are usually far lower than this smooth model implies, so the policy's net rate is lowest for people who surrender early. Use rates from the in-force illustration of a policy you are actually offered."),
      '<div class="kpis" id="' + u + '-kp"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-nt"></p>');
    function cv(W, g, n) { var b = 0; for (var t = 1; t <= n; t++) b = (b + W) * (1 + g); return b; }
    function run() {
      var W = num(el, "w"), T = num(el, "t"), n = num(el, "n", 1), g = num(el, "g") / 100, r = num(el, "r") / 100, d = num(el, "d") / 100;
      var diff = Math.max(0, W - T), c = 0, inv = 0, pc = [[0, 0]], pi = [[0, 0]];
      for (var t = 1; t <= n; t++) { c = (c + W) * (1 + g); inv = (inv + diff) * (1 + r - d); pc.push([t, c]); pi.push([t, inv]); }
      var lo = -0.5, hi = 0.5, beTxt;
      if (W <= 0) beTxt = "n/a (no premium)";
      else if (cv(W, lo, n) > inv) beTxt = "below −50%";
      else if (cv(W, hi, n) < inv) beTxt = "above 50%";
      else { for (var k = 0; k < 60; k++) { var mid = (lo + hi) / 2; if (cv(W, mid, n) < inv) lo = mid; else hi = mid; } beTxt = pct(hi * 100, 2) + " a year"; }
      self(el, "kp").innerHTML = kpi("Cash value after " + n + " years", money(c)) + kpi("Invested difference after " + n + " years", money(inv)) +
        kpi(inv >= c ? "Term + invest ahead by" : "Policy ahead by", money(Math.abs(inv - c)), inv >= c ? "good" : "bad") + kpi("Policy rate needed to break even", beTxt);
      INV.lineChart(self(el, "ch"), { label: "Cash value versus invested difference", height: 250, xTitle: "Years", yFmt: ms, xFmt: yearFmt,
        series: [{ name: "Term + invest the difference", color: "var(--s2)", data: pi, width: 3 }, { name: "Cash value of the policy", color: "var(--s4)", data: pc, width: 3 }] });
      self(el, "nt").innerHTML = "Both paths pay the same " + money(W) + " a year and carry a death benefit for " + n + " years. You paid " + money(W * n) + " of premiums in total. " +
        "At the end, the term buyer's coverage stops but the " + money(inv) + " portfolio remains; the policyholder keeps permanent coverage and " + money(c) + " of cash value. " +
        "The comparison turns on the policy's true net rate and on whether you actually invest the difference every year.";
    }
    wire(el, run);
  };

  /* ---------- 8. Income annuity estimator (INV-017) ---------- */
  /* SSA 2023 period life table (2026 Trustees Report), probability of death within one year, ages 55-119 */
  var QM = [0.007491, 0.008173, 0.008938, 0.009714, 0.010494, 0.011337, 0.012232, 0.013196, 0.014229, 0.015316, 0.016455, 0.017574, 0.018735, 0.019981, 0.021366, 0.022903, 0.024615, 0.026504, 0.028648, 0.031071, 0.033802, 0.03701, 0.041158, 0.045461, 0.050346, 0.055633, 0.061757, 0.068358, 0.07542, 0.083364, 0.09268, 0.103459, 0.115502, 0.129018, 0.14381, 0.159458, 0.176551, 0.19536, 0.216286, 0.238799, 0.262268, 0.286291, 0.310944, 0.332325, 0.349036, 0.366568, 0.38496, 0.404252, 0.424488, 0.445712, 0.467998, 0.491398, 0.515968, 0.541766, 0.568854, 0.597297, 0.627162, 0.65852, 0.691446, 0.726018, 0.762319, 0.800435, 0.840457, 0.88248, 0.926604];
  var QF = [0.004532, 0.004923, 0.005365, 0.005815, 0.006333, 0.006923, 0.007555, 0.00822, 0.008881, 0.009514, 0.010188, 0.01088, 0.011659, 0.012543, 0.013581, 0.014769, 0.016153, 0.017705, 0.019495, 0.021533, 0.023846, 0.026458, 0.0297, 0.033135, 0.036982, 0.041183, 0.045959, 0.051282, 0.057262, 0.064107, 0.071752, 0.08049, 0.090566, 0.102204, 0.115178, 0.129176, 0.144229, 0.160353, 0.177635, 0.196502, 0.216846, 0.23875, 0.261359, 0.283899, 0.306491, 0.32968, 0.353333, 0.3773, 0.401416, 0.425501, 0.451031, 0.478092, 0.506778, 0.537185, 0.568854, 0.597297, 0.627162, 0.65852, 0.691446, 0.726018, 0.762319, 0.800435, 0.840457, 0.88248, 0.926604];
  function surv(sex, age) { /* survival probabilities p[t] of living t more years, t = 0.. until age 120 */
    var q = sex === "m" ? QM : QF, p = [1], x = age;
    while (x < 120) { var qx = x >= 55 ? q[x - 55] : q[0]; p.push(p[p.length - 1] * (1 - qx)); x++; }
    return p;
  }
  INV.s2bSurvival = surv;
  TOOLS.s2bSpia = function (el) {
    var u = uid(el);
    shell(el, "Income annuity estimator", "Model",
      seg("Annuitant", "sex", [["f", "Female"], ["m", "Male"]]) +
      rng(u + "-a", "Age at purchase", 55, 90, 1, 68, "age") +
      numf(u + "-p", "Premium paid to the insurer ($)", 100000, 1000) +
      rng(u + "-i", "Interest rate the insurer credits", 0, 7, 0.25, 4.5, "pct") +
      rng(u + "-l", "Insurer's costs and profit (share of premium)", 0, 15, 1, 5, "pct") +
      rng(u + "-d", "Years before income starts (0 = immediate)", 0, 20, 1, 0, "yr") +
      note("Payment = premium × (1 − costs) ÷ Σ p(t) ÷ (1 + i)<sup>t</sup>, summed over each year t after income starts, where p(t) is the chance of being alive, from the Social Security Administration's 2023 period life table. One payment a year, at each year-end. Insurers price with mortality tables for annuity buyers, who live longer than the population, so real quotes are usually lower. For learning only: compare real quotes."),
      '<div class="kpis" id="' + u + '-kp"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-nt"></p>');
    function run() {
      var sex = segVal(el, "sex") || "f", age = num(el, "a", 68), P = num(el, "p"), i = num(el, "i") / 100, L = num(el, "l") / 100, D = num(el, "d");
      var p = surv(sex, age), A = 0;
      for (var t = D + 1; t < p.length; t++) A += p[t] / Math.pow(1 + i, t);
      var pay = A > 0 ? P * (1 - L) / A : 0;
      var cum = 0, beAge = null, beP = 0, ps = [], pc = [], le = 0, lim = Math.min(119, Math.max(100, age + D + 10));
      for (var t2 = 1; t2 < p.length; t2++) le += p[t2]; le += 0.5;
      for (var t3 = 0; t3 < p.length; t3++) {
        if (t3 > D) cum += pay;
        if (beAge == null && P > 0 && cum >= P) { beAge = age + t3; beP = p[t3]; }
        if (age + t3 <= lim) { ps.push([age + t3, p[t3] * 100]); pc.push([age + t3, P > 0 ? Math.min(cum / P * 100, 400) : 0]); }
      }
      self(el, "kp").innerHTML = kpi("Income per year", money(pay)) + kpi("Per month (≈ ÷ 12)", money(pay / 12)) + kpi("Payout rate", pct(P > 0 ? pay / P * 100 : 0, 2)) +
        kpi("Payments pass the premium at", beAge != null ? "age " + beAge : (P > 0 ? "never" : "n/a")) + kpi("Chance of living that long", beAge != null ? pct(beP * 100, 0) : "—");
      INV.lineChart(self(el, "ch"), { label: "Survival and cumulative income", height: 250, xTitle: "Age", xFmt: yearFmt, yFmt: function (v) { return Math.round(v) + "%"; }, tipFmt: function (v) { return pct(v, 0); }, yMin: 0,
        series: [{ name: "Chance of being alive", color: "var(--s1)", data: ps, width: 3 }, { name: "Income received, % of premium (if alive)", color: "var(--s2)", data: pc }] });
      self(el, "nt").innerHTML = "Average remaining lifetime at " + age + " in this table: about <b>" + le.toFixed(1) + " years</b>. " +
        "An income annuity pays more than a bond of the same rate could safely pay because people who die early leave their premiums in the pool for those who live long: these are <b>mortality credits</b>. " +
        "The price is that the premium is gone: a plain life-only annuity pays nothing to heirs, however early the buyer dies.";
    }
    wire(el, run);
  };
})();
