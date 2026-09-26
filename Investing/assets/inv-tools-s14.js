/* Investing Learning Lab - Stage 14 calculators (INV-103, INV-104) - V1.1 (September 2026)
   Every figure is computed in the browser from the formula stated in each tool.
   All fee levels and rates in the defaults are hypothetical inputs, not quotes from any firm. */
(function () {
  "use strict";
  var INV = window.INV; if (!INV || !INV.tools) return;
  var esc = INV.esc, money = INV.money, ms = INV.moneyShort, pct = INV.pct;
  var TOOLS = INV.tools;

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
      return '<option value="' + esc(o[0]) + '"' + (o[0] === val ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select></div>";
  }
  function self(el, id) { return el.querySelector("#" + el.dataset.uid + "-" + id); }
  function uid(el) { if (!el.dataset.uid) el.dataset.uid = "s" + Math.random().toString(36).slice(2, 8); return el.dataset.uid; }
  function num(el, id) { var v = Number(self(el, id).value); return isFinite(v) && v > 0 ? v : 0; }
  function fmtOut(input) {
    var o = input.parentNode.querySelector("output"); if (!o) return;
    var f = input.getAttribute("data-fmt"), v = Number(input.value);
    var dp = input.step.indexOf(".") > -1 ? input.step.split(".")[1].length : 0;
    o.textContent = f === "pct" ? v.toFixed(dp) + "%" : f === "yr" ? v + (v === 1 ? " year" : " years") : f === "money" ? money(v) :
      f === "hrs" ? v + (v === 1 ? " hour" : " hours") : f === "rate" ? money(v) + " an hour" : String(v);
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

  /* ---------- 1. Advisor cost comparison: AUM vs flat vs hourly (INV-103) ----------
     Each year t = 1..n:  B = (B + C) x (1 + r - e);  then the advice fee is deducted from B.
     AUM fee = a x B.  Flat fee = F x (1 + g)^(t-1).  Hourly fee = h x R x (1 + g)^(t-1).
     "No advisor" deducts only fund expenses e. Balances are floored at zero. */
  function advPath(P, C, r, e, n, kind, a, F, h, R, g) {
    var B = P, pts = [[0, P]], paid = 0, first = 0;
    for (var t = 1; t <= n; t++) {
      B = (B + C) * (1 + r - e);
      var fee = 0;
      if (kind === "aum") fee = a * B;
      else if (kind === "flat") fee = F * Math.pow(1 + g, t - 1);
      else if (kind === "hourly") fee = h * R * Math.pow(1 + g, t - 1);
      fee = Math.min(Math.max(fee, 0), Math.max(B, 0));
      B -= fee; paid += fee; if (t === 1) first = fee;
      pts.push([t, B]);
    }
    return { b: B, pts: pts, paid: paid, first: first };
  }
  INV.s14advPath = advPath;
  TOOLS.s14AdvisorCost = function (el) {
    var u = uid(el);
    shell(el, "What will advice cost over 20 years? AUM vs flat vs hourly", "Calculator",
      numf(u + "-p", "Portfolio today ($)", 1100000, 10000) + numf(u + "-c", "Added each year ($)", 0, 1000) +
      rng(u + "-r", "Return before any costs", 0, 10, 0.25, 6, "pct") + rng(u + "-e", "Fund expenses (all options)", 0, 1, 0.01, 0.05, "pct") +
      rng(u + "-n", "Years", 1, 40, 1, 20, "yr") +
      rng(u + "-a", "Option A: percentage of assets (AUM)", 0, 2.5, 0.05, 1.25, "pct") +
      numf(u + "-f", "Option B: flat fee, first year ($)", 6000, 250) +
      rng(u + "-h", "Option C: hours of planning a year", 0, 40, 1, 10, "hrs") + numf(u + "-hr", "Option C: hourly rate ($)", 300, 25) +
      rng(u + "-g", "Flat and hourly fees rise each year by", 0, 6, 0.5, 3, "pct") +
      '<p class="hint" style="font-size:.76rem;color:var(--muted)">Hypothetical fees. All three options are assumed to deliver the same advice and the same investment return; every fee is paid out of the portfolio at each year-end.</p>',
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><div class="fig-title" style="margin-top:10px">Total fees paid over the period</div><div id="' + u + '-b"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var P = num(el, "p"), C = num(el, "c"), r = Number(self(el, "r").value) / 100, e = Number(self(el, "e").value) / 100, n = Number(self(el, "n").value),
        a = Number(self(el, "a").value) / 100, F = num(el, "f"), h = Number(self(el, "h").value), R = num(el, "hr"), g = Number(self(el, "g").value) / 100;
      var Z = advPath(P, C, r, e, n, "none"), A = advPath(P, C, r, e, n, "aum", a), B = advPath(P, C, r, e, n, "flat", 0, F, 0, 0, g), H = advPath(P, C, r, e, n, "hourly", 0, 0, h, R, g);
      var best = Math.max(A.b, B.b, H.b);
      self(el, "k").innerHTML = kpi("A: AUM, first-year fee", money(A.first)) + kpi("A: ends at", money(A.b), A.b === best ? "good" : "") +
        kpi("B: flat, ends at", money(B.b), B.b === best ? "good" : "") + kpi("C: hourly, ends at", money(H.b), H.b === best ? "good" : "") +
        kpi("Gap, A vs cheapest", money(best - A.b), best - A.b > 0 ? "bad" : "");
      INV.lineChart(self(el, "ch"), { label: "Portfolio value under three fee models", height: 260, xTitle: "Years", yFmt: ms, xFmt: yearFmt, zeroBase: false,
        series: [{ name: "No advice fee", color: "var(--s6)", data: Z.pts, dash: "4 4", width: 1.4 },
          { name: "A: " + pct(a * 100, 2) + " of assets", color: "var(--s5)", data: A.pts },
          { name: "B: flat fee", color: "var(--s1)", data: B.pts },
          { name: "C: hourly", color: "var(--s2)", data: H.pts }] });
      INV.barChart(self(el, "b"), { label: "Total fees paid", height: 190, allLabels: true, valueLabels: true, yFmt: ms, tipFmt: function (v) { return money(v); },
        data: [{ label: "A: AUM", y: A.paid, color: "var(--s5)" }, { label: "B: flat", y: B.paid, color: "var(--s1)" }, { label: "C: hourly", y: H.paid, color: "var(--s2)" }] });
      var lostA = Z.b - A.b;
      self(el, "n2").innerHTML = "Over " + n + " years the percentage fee takes <b>" + money(A.paid) + "</b> in fees and leaves the portfolio <b>" + money(lostA) +
        "</b> below the no-advice-fee path, because each fee dollar also loses its future growth. The flat fee totals " + money(B.paid) + " and the hourly plan " + money(H.paid) +
        ". A percentage fee rises automatically as the balance grows; the other two rise only if the adviser raises the price. Formula: B<sub>t</sub> = (B<sub>t&minus;1</sub> + C)(1 + r &minus; e) &minus; fee<sub>t</sub>.";
    }
    wire(el, run);
  };

  /* ---------- 2. Advisor interview scorecard (INV-103) ---------- */
  var QS = [
    ["fid", "Will you act as a fiduciary at all times, for every account, and put that in writing?", "yes", "A written, all-the-time fiduciary commitment covers every account and every recommendation."],
    ["pay", "Are you paid only by me (no commissions, no product payments)?", "yes", "Commissions and product payments are conflicts the adviser must disclose and manage."],
    ["crs", "Did you give me your Form CRS and, for advisers, the Form ADV Part 2 brochure?", "yes", "Firms that serve retail investors must deliver a Form CRS relationship summary."],
    ["disc", "Is BrokerCheck or IAPD clean for both the person and the firm?", "yes", "Search both the individual and the firm; read every disclosure, not just the count."],
    ["cust", "Will an independent custodian hold my money and send statements directly to me?", "yes", "An adviser who holds your money personally, or sends the only statements, is a classic fraud setup."],
    ["cost", "Can you state my total yearly cost in dollars, including fund expenses?", "yes", "Form CRS tells you to ask: if I give you $10,000, how much goes to fees?"],
    ["cred", "Can I verify each credential with the body that issued it?", "yes", "CFP Board, and FINRA's designation database, let you check credentials."],
    ["press", "Did you feel pressured, promised guaranteed or unusually high returns, or told to act fast?", "no", "Pressure, guarantees and urgency are classic signs of a bad actor."]
  ];
  TOOLS.s14Scorecard = function (el) {
    var u = uid(el);
    var ins = QS.map(function (q, i) { return sel(u + "-" + q[0], (i + 1) + ". " + q[1], [["yes", "Yes"], ["no", "No"], ["unk", "Not sure yet"]], i === 1 ? "unk" : i === 7 ? "no" : "yes"); }).join("") +
      '<p class="hint" style="font-size:.76rem;color:var(--muted)">A checklist, not a rating of any real firm. One serious red flag can outweigh every green light.</p>';
    shell(el, "Advisor interview scorecard", "Checklist", ins, '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><div class="tool-note" id="' + u + '-n2"></div>');
    function run() {
      var good = 0, bad = 0, unk = 0, notes = [];
      QS.forEach(function (q) {
        var v = self(el, q[0]).value;
        if (v === "unk") { unk++; notes.push("<li><b>Ask:</b> " + esc(q[1]) + "</li>"); }
        else if (v === q[2]) good++;
        else { bad++; notes.push('<li><b class="neg-t">Red flag:</b> ' + esc(q[3]) + "</li>"); }
      });
      var serious = self(el, "cust").value === "no" || self(el, "press").value === "yes";
      var verdict = serious ? "Stop" : bad >= 2 ? "Keep looking" : bad === 1 || unk > 2 ? "Get answers first" : unk ? "Nearly there" : "Worth a second meeting";
      self(el, "k").innerHTML = kpi("Green lights", good + " of " + QS.length, "good") + kpi("Red flags", String(bad), bad ? "bad" : "good") + kpi("Still unknown", String(unk)) +
        kpi("Suggested next step", verdict, serious || bad >= 2 ? "bad" : bad || unk > 2 ? "" : "good");
      INV.barChart(self(el, "ch"), { label: "Scorecard summary", height: 170, allLabels: true, valueLabels: true, yFmt: function (v) { return String(Math.round(v)); },
        data: [{ label: "Green lights", y: good, color: "var(--s2)" }, { label: "Unknown", y: unk, color: "var(--s6)" }, { label: "Red flags", y: bad, color: "var(--s5)" }] });
      self(el, "n2").innerHTML = (serious ? "<p><b>Custody or pressure problems are deal-breakers.</b> Do not send money; check the person on BrokerCheck and IAPD and consider reporting to the SEC, FINRA or your state securities regulator.</p>" : "") +
        (notes.length ? "<ul style=\"margin:6px 0 0 18px\">" + notes.join("") + "</ul>" : "<p>Every answer is what you would want to hear. Confirm it in writing and in the firm's Form CRS and Form ADV.</p>");
    }
    wire(el, run);
  };

  /* ---------- 3. Three ways to invest the same money (INV-104) ----------
     Invested share earns r - e (fund expenses). A robo's cash allocation k earns the cash yield y.
     Robo and advisor fees are charged on the whole balance at year-end.
     DIY:     B = (B + C)(1 + r - e)
     Robo:    B = (B + C)[(1 - k)(1 + r - e) + k(1 + y)](1 - f_robo)
     Advisor: B = (B + C)(1 + r - e)(1 - f_adv) */
  function platPath(P, C, r, e, n, k, y, fee) {
    var B = P, pts = [[0, P]], paid = 0, drag = 0;
    for (var t = 1; t <= n; t++) {
      var base = B + C, gross = base * ((1 - k) * (1 + r - e) + k * (1 + y)), full = base * (1 + r - e);
      drag += full - gross;
      var f = gross * fee; B = gross - f; paid += f; pts.push([t, B]);
    }
    return { b: B, pts: pts, paid: paid, drag: drag };
  }
  INV.s14platPath = platPath;
  TOOLS.s14PlatformCost = function (el) {
    var u = uid(el);
    shell(el, "Do it yourself, use a robo-advisor, or hire an adviser?", "Calculator",
      numf(u + "-p", "Starting amount ($)", 3000, 500) + numf(u + "-c", "Added each year ($)", 6000, 500) +
      rng(u + "-n", "Years", 1, 45, 1, 40, "yr") + rng(u + "-r", "Return on invested money, before costs", 0, 10, 0.25, 6, "pct") +
      rng(u + "-e", "Fund expense ratio (all three)", 0, 1, 0.01, 0.06, "pct") +
      rng(u + "-f", "Robo-advisor fee", 0, 1, 0.05, 0.25, "pct") + rng(u + "-kin", "Robo portfolio held in cash", 0, 30, 1, 0, "pct") + rng(u + "-y", "Interest earned on that cash", 0, 6, 0.25, 2, "pct") +
      rng(u + "-a", "Human adviser fee", 0, 2.5, 0.05, 1, "pct") +
      '<p class="hint" style="font-size:.76rem;color:var(--muted)">Hypothetical fees. Set the cash share above zero to see what a cash allocation costs when cash earns less than the invested portfolio.</p>',
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var P = num(el, "p"), C = num(el, "c"), n = Number(self(el, "n").value), r = Number(self(el, "r").value) / 100, e = Number(self(el, "e").value) / 100,
        f = Number(self(el, "f").value) / 100, k = Number(self(el, "kin").value) / 100, y = Number(self(el, "y").value) / 100, a = Number(self(el, "a").value) / 100;
      var D = platPath(P, C, r, e, n, 0, 0, 0), R = platPath(P, C, r, e, n, k, y, f), A = platPath(P, C, r, e, n, 0, 0, a);
      self(el, "k").innerHTML = kpi("Do it yourself", money(D.b), "good") + kpi("Robo-advisor", money(R.b)) + kpi("Human adviser", money(A.b)) +
        kpi("Robo costs you", money(D.b - R.b), D.b - R.b > 0 ? "bad" : "") + kpi("Adviser costs you", money(D.b - A.b), D.b - A.b > 0 ? "bad" : "");
      INV.lineChart(self(el, "ch"), { label: "Balance under three approaches", height: 260, xTitle: "Years", yFmt: ms, xFmt: yearFmt,
        series: [{ name: "Do it yourself (" + pct(e * 100, 2) + " funds)", color: "var(--s2)", data: D.pts },
          { name: "Robo (" + pct(f * 100, 2) + " + " + Math.round(k * 100) + "% cash)", color: "var(--s1)", data: R.pts },
          { name: "Adviser (" + pct(a * 100, 2) + ")", color: "var(--s5)", data: A.pts }] });
      self(el, "n2").innerHTML = "After " + n + " years the robo-advisor's fee takes " + money(R.paid) + (k > 0 ? " and its " + Math.round(k * 100) + "% cash allocation gives up another " + money(R.drag) + " of growth in the years it applies" : "") +
        "; the adviser's fee takes " + money(A.paid) + ". Those are the prices of automation and of human help. They are worth paying only if they change what you do: saving more, rebalancing, harvesting losses correctly, or holding on in a crash.";
    }
    wire(el, run);
  };

  /* ---------- 4. Cash sweep: what idle cash costs (INV-104) ----------
     Yearly gap = cash x (alternative yield - sweep yield). Over n years both balances compound at their own rate. */
  TOOLS.s14CashSweep = function (el) {
    var u = uid(el);
    shell(el, "What is your idle cash earning?", "Calculator",
      numf(u + "-c", "Cash sitting in the account ($)", 41000, 500) +
      rng(u + "-s", "Rate your sweep or checking pays", 0, 5, 0.05, 0.1, "pct") +
      rng(u + "-m", "Rate a money market fund or high-yield savings pays", 0, 6, 0.05, 3.5, "pct") +
      rng(u + "-n", "Years left like this", 1, 10, 1, 3, "yr") +
      '<p class="hint" style="font-size:.76rem;color:var(--muted)">Enter the rates from your own statements; both defaults are hypothetical. Before tax. Money market funds are not FDIC-insured; bank deposits are, within the limits.</p>',
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-ch"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var c = num(el, "c"), s = Number(self(el, "s").value) / 100, m = Number(self(el, "m").value) / 100, n = Number(self(el, "n").value);
      var a1 = c * s, b1 = c * m, ps = [[0, c]], pm = [[0, c]], vs = c, vm = c;
      for (var t = 1; t <= n; t++) { vs *= 1 + s; vm *= 1 + m; ps.push([t, vs]); pm.push([t, vm]); }
      self(el, "k").innerHTML = kpi("Earned in a year now", money(a1)) + kpi("Could earn in a year", money(b1), "good") + kpi("Gap per year", money(b1 - a1), b1 > a1 ? "bad" : "") +
        kpi("Gap after " + n + (n === 1 ? " year" : " years"), money(vm - vs), vm > vs ? "bad" : "");
      var data = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(function (x) { return { label: x + "%", tip: "Rate gap of " + x + " points", y: c * x / 100, color: Math.abs(x - (m - s) * 100) < 0.26 ? "var(--s5)" : "var(--s6)" }; });
      INV.barChart(self(el, "ch"), { label: "Yearly interest lost by rate gap", height: 210, allLabels: true, xTitle: "Gap between the two rates (percentage points)", yFmt: ms, tipFmt: function (v) { return money(v) + " a year"; }, data: data });
      self(el, "n2").innerHTML = "At a gap of " + pct((m - s) * 100, 2) + ", " + money(c) + " of idle cash gives up about <b>" + money(b1 - a1) + "</b> a year: cash &times; (alternative rate &minus; sweep rate). " +
        "The SEC found that at two large firms the gap between bank sweep rates and other sweep options at times reached almost 4 percentage points (2025).";
    }
    wire(el, run);
  };
})();
