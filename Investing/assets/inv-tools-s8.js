/* Investing Learning Lab - Stage 8 (Behavioral Finance) tools - V1.1 (September 2026)
   Tools for INV-060, INV-061 and INV-062. Each tool computes from its stated formula in the
   browser. Historical tools use window.INV_RETURNS (Damodaran, NYU Stern, 1928-2025).
   Load after assets/inv-tools.js. */
(function () {
  "use strict";
  var INV = window.INV; if (!INV) return;
  var esc = INV.esc, money = INV.money, ms = INV.moneyShort, pct = INV.pct;
  var TOOLS = INV.tools = INV.tools || {};

  /* ---------- local copies of the shared helper style ---------- */
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
  function self(el, id) { return el.querySelector("#" + el.dataset.uid + "-" + id); }
  function uid(el) { if (!el.dataset.uid) el.dataset.uid = "t" + Math.random().toString(36).slice(2, 8); return el.dataset.uid; }
  function dec(step) { return String(step).indexOf(".") > -1 ? String(step).split(".")[1].length : 0; }
  function fmtOut(input) {
    var o = input.parentNode.querySelector("output"); if (!o) return;
    var f = input.getAttribute("data-fmt"), v = Number(input.value), d = dec(input.step);
    o.textContent = f === "pct" ? v.toFixed(d) + "%" : f === "npct" ? "−" + Math.abs(v).toFixed(d) + "%" : f === "spct" ? (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(d) + "%" :
      f === "yr" ? v + (v === 1 ? " year" : " years") : f === "money" ? money(v) : f === "x" ? v.toFixed(d) + "×" :
      f === "stk" ? v + "% stocks / " + (100 - v) + "% bonds" : f === "mm" ? "$" + v + " million" : String(v);
  }
  function wire(el, fn) {
    el.querySelectorAll("input,select").forEach(function (i) {
      var ev = i.type === "checkbox" ? "change" : "input";
      i.addEventListener(ev, function () { if (i.type === "range") fmtOut(i); fn(); });
      if (i.type === "range") fmtOut(i);
    });
    fn();
    document.addEventListener("inv-theme", fn);
  }
  function kpi(k, v, cls) { return '<div class="kpi"><div class="k">' + esc(k) + '</div><div class="v ' + (cls || "") + '">' + v + "</div></div>"; }
  function num(x, d) { x = Number(x); return isFinite(x) ? x : (d || 0); }
  function yearFmt(v) { return String(Math.round(v)); }
  function note(t) { return '<p class="hint" style="font-size:.76rem;color:var(--muted)">' + t + "</p>"; }
  var H = null;
  function hist() { if (!H) H = INV.hist(); return H; }
  /* standard normal cumulative distribution (Abramowitz and Stegun 26.2.17) */
  function ncdf(z) {
    var t = 1 / (1 + 0.2316419 * Math.abs(z)), d = 0.3989422804014327 * Math.exp(-z * z / 2);
    var p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    return z >= 0 ? 1 - p : p;
  }
  INV.s8 = { ncdf: ncdf };

  /* ======================= INV-060 ======================= */

  /* ---------- 1. Bias self-test ---------- */
  var BQ = [
    { b: "Loss aversion", q: "Your diversified fund is down 15% this year and the news is grim. What do you most feel like doing?",
      o: [["Sell now so it cannot get any worse, and buy back when things calm down.", 1, "This is the pull of loss aversion: the pain of watching a loss makes selling feel like relief. It also turns a paper loss into a real one and leaves you guessing when to get back in (INV-061)."],
          ["Nothing different: keep contributing as planned and rebalance if my mix has drifted.", 0, "This follows a plan made in calm conditions. Rebalancing after a fall means buying what has become cheaper, the opposite of the instinct."]] },
    { b: "Disposition effect", q: "You need $10,000 from a taxable account. Stock A is up 40% since you bought it; Stock B is down 30%. You think their prospects are similar. Which do you sell?",
      o: [["Stock A: lock in the gain while I have it.", 1, "Selling winners and keeping losers is the disposition effect. Odean (1998) found investors did this, and the winners they sold went on to beat the losers they kept by 3.4 percentage points over the next year."],
          ["Stock B: realize the loss, which can offset gains on my tax return.", 0, "In a taxable account, selling the loser usually produces a capital loss you can deduct, while selling the winner produces a taxable gain (INV-037)."]] },
    { b: "Anchoring", q: "You bought a stock at $50. It is now $35 and the company's outlook has weakened. What is your rule?",
      o: [["Hold until it gets back to $50, then sell.", 1, "$50 is an anchor: a number that matters to you and not at all to the market. The question is only whether $35 of this stock is the best place for $35 of your money today."],
          ["Decide as if I did not own it: would I buy it today at $35?", 0, "This question removes the anchor. If the answer is no, the purchase price is a sunk cost."]] },
    { b: "Recency bias", q: "A fund returned about 30% a year for the last three years. What do you expect for the next three?",
      o: [["Probably more of the same; it has a hot hand.", 1, "Extrapolating a recent streak is recency bias. Morningstar's 2026 Mind the Gap study found that investors in volatile funds, where streaks are most dramatic, captured the smallest share of the funds' returns."],
          ["Something closer to a long-run average, with a wide range around it.", 0, "Long-run averages and wide uncertainty bands are a better starting point than the last three years."]] },
    { b: "Overconfidence", q: "Your five stock picks beat the market last year. What is the most reasonable conclusion?",
      o: [["I have a knack for this; I should trade more and bet bigger.", 1, "One good year with five stocks is mostly noise. Barber and Odean (2000) found the households that traded most earned 11.4% a year against the market's 17.9%."],
          ["It could be skill or luck; one year of five stocks cannot tell me which.", 0, "Correct. It takes many years of results to separate skill from luck, and trading costs are certain while skill is not."]] },
    { b: "Herding", q: "Everyone at work is buying a new token that has tripled in two months. What do you do?",
      o: [["Buy some before I miss out; that many people cannot all be wrong.", 1, "This is herding, often called fear of missing out. By the time a price move is common knowledge, it is already in the price. Morningstar found the biggest inflows into bitcoin funds came after prices had risen."],
          ["Ask what the price already assumes, and cap any speculative stake at an amount I can lose.", 0, "Sizing speculation so a total loss would not change your plan keeps curiosity from becoming a hazard."]] },
    { b: "Mental accounting", q: "You get a $3,000 tax refund while carrying a $3,000 credit card balance at 22% interest. What do you do with the refund?",
      o: [["It is found money, so it goes into my fun account or a trade I have been wanting to make.", 1, "Money has no label. Paying off a 22% card is a guaranteed 22% return; few investments promise anything close (INV-020)."],
          ["Pay off the card first; then decide what to do with future savings.", 0, "Treating every dollar as interchangeable, whatever its source, is the cure for mental accounting."]] },
    { b: "Risk seeking to avoid a sure loss", q: "Choose one: (A) a sure loss of $3,000, or (B) an 80% chance of losing $4,000 and a 20% chance of losing nothing.",
      o: [["B: at least there is a chance to lose nothing.", 1, "Most people choose B. Kahneman and Tversky (1979) found 92% did in the loss version of this problem, even though B's expected loss is $3,200, more than A's. Gambling to get even is how small losses become large ones."],
          ["A: the sure $3,000 is smaller than the $3,200 expected loss from B.", 0, "Right. In the gain version of the same problem, 80% of Kahneman and Tversky's respondents took the sure thing; with losses, 92% gambled. Same numbers, opposite choices."]] }
  ];
  /* vary the position of the bias-prone answer */
  [1, 3, 5, 7].forEach(function (i) { BQ[i].o.reverse(); });
  TOOLS.s8BiasQuiz = function (el) {
    var u = uid(el), picks = {};
    el.classList.add("tool");
    el.innerHTML = '<div class="tool-h"><b>Bias self-test: eight quick scenarios</b><span class="tag">Self-test</span></div><div class="tool-b" style="grid-template-columns:1fr"><div class="tool-out" aria-live="polite">' +
      '<div class="kpis" id="' + u + '-k"></div>' +
      BQ.map(function (it, i) {
        return '<div class="bq" style="border:1px solid var(--border);border-radius:12px;padding:10px 12px;margin:8px 0;background:var(--card2)"><div style="font-weight:700;margin-bottom:6px">' + (i + 1) + ". " + esc(it.q) + "</div>" +
          it.o.map(function (o, j) { return '<button type="button" class="btn small bq-opt" data-i="' + i + '" data-j="' + j + '" style="display:block;width:100%;text-align:left;white-space:normal;margin:4px 0">' + esc(o[0]) + "</button>"; }).join("") +
          '<div class="bq-fb" id="' + u + "-f" + i + '" style="display:none;margin-top:6px;font-size:.88rem"></div></div>';
      }).join("") +
      '<p class="tool-note" id="' + u + '-n"></p><button type="button" class="btn small ghost" id="' + u + '-r">Start again</button></div></div>';
    function run() {
      var n = Object.keys(picks).length, prone = 0, tally = {};
      Object.keys(picks).forEach(function (i) { if (BQ[i].o[picks[i]][1]) { prone++; tally[BQ[i].b] = 1; } });
      var names = Object.keys(tally);
      self(el, "k").innerHTML = kpi("Answered", n + " of " + BQ.length) + kpi("Bias-prone choices", String(prone), prone ? "bad" : "good") +
        kpi("Tendencies spotted", names.length ? String(names.length) : "None yet");
      self(el, "n").innerHTML = n < BQ.length ? "Pick the answer closest to what you would honestly do, not what you think is correct. Each answer shows which bias the scenario tests." :
        (prone === 0 ? "No bias-prone answers. Most people pick several; the test is whether you would choose the same way with real money in a falling market." :
          "Your answers leaned toward: <b>" + esc(names.join(", ")) + "</b>. Knowing your tendencies is the point: the remedy for each is a rule decided in advance (see the Defenses tab).");
    }
    el.querySelectorAll(".bq-opt").forEach(function (b) {
      b.addEventListener("click", function () {
        var i = Number(b.dataset.i), j = Number(b.dataset.j), it = BQ[i], o = it.o[j];
        picks[i] = j;
        el.querySelectorAll('.bq-opt[data-i="' + i + '"]').forEach(function (x) { x.classList.toggle("primary", x === b); x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        var fb = self(el, "f" + i); fb.style.display = "block";
        fb.innerHTML = "<b>" + esc(it.b) + (o[1] ? ": bias-prone answer." : ": plan-based answer.") + "</b> " + esc(o[2]);
        run();
      });
    });
    self(el, "r").addEventListener("click", function () {
      picks = {}; el.querySelectorAll(".bq-opt").forEach(function (x) { x.classList.remove("primary"); x.setAttribute("aria-pressed", "false"); });
      el.querySelectorAll(".bq-fb").forEach(function (f) { f.style.display = "none"; f.innerHTML = ""; }); run();
    });
    run();
  };

  /* ---------- 2. Prospect-theory value function ---------- */
  function pv(x, a, l) { return x >= 0 ? Math.pow(x, a) : -l * Math.pow(-x, a); }
  INV.s8.pv = pv;
  TOOLS.s8ValueFn = function (el) {
    var u = uid(el);
    shell(el, "How a gain and a loss feel: the prospect-theory value function", "Model",
      rng(u + "-g", "Possible gain", 100, 10000, 100, 1000, "money") + rng(u + "-l", "Possible loss", 100, 10000, 100, 1000, "money") +
      rng(u + "-lam", "Loss aversion (λ)", 1, 3, 0.05, 2.25, "x") + rng(u + "-a", "Sensitivity (α)", 0.5, 1, 0.01, 0.88) +
      note("v(x) = x<sup>α</sup> for gains and −λ(−x)<sup>α</sup> for losses. Defaults are Tversky and Kahneman's (1992) median estimates: λ = 2.25, α = 0.88. Values are in arbitrary 'felt' units."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var G = num(self(el, "g").value), L = num(self(el, "l").value), lam = num(self(el, "lam").value, 1), a = num(self(el, "a").value, 1);
      var vg = pv(G, a, lam), vl = pv(-L, a, lam), need = L * Math.pow(lam, 1 / a), net = vg + vl;
      self(el, "k").innerHTML = kpi("Felt value of the gain", "+" + vg.toFixed(0), "good") + kpi("Felt value of the loss", "−" + Math.abs(vl).toFixed(0), "bad") +
        kpi("Gain needed to offset the loss", money(need)) + kpi("50/50 coin flip", net >= 0 ? "Accept" : "Reject", net >= 0 ? "good" : "bad");
      var M = Math.max(G, L) * 1.15, pts = [], ref = [];
      for (var k = 0; k <= 60; k++) { var x = -M + 2 * M * k / 60; pts.push([x, pv(x, a, lam)]); ref.push([x, pv(x, a, 1)]); }
      INV.lineChart(self(el, "c"), { label: "Prospect-theory value function", height: 260, zeroBase: false, xTitle: "Change in wealth", yTitle: "Felt value",
        xFmt: function (v) { return (v < 0 ? "−" : "") + ms(Math.abs(v)); }, yFmt: function (v) { return Math.round(v); },
        series: [{ name: "With loss aversion λ = " + lam.toFixed(2), color: "var(--s5)", data: pts }, { name: "No loss aversion (λ = 1)", color: "var(--s6)", data: ref, dash: "5 4", width: 1.6 }],
        dots: [{ x: G, y: vg, color: "var(--s2)", label: "gain", anchor: "end", dx: -8 }, { x: -L, y: vl, color: "var(--s5)", label: "loss", dx: 8, dy: 14 }] });
      self(el, "n").innerHTML = "A coin flip that wins " + money(G) + " or loses " + money(L) + " has an expected value of " + (G - L >= 0 ? "" : "−") + money(Math.abs(G - L), 0) +
        ". With these settings it feels like <b>" + (net >= 0 ? "+" : "−") + Math.abs(net).toFixed(0) + "</b> units, so a typical person would " + (net >= 0 ? "take it" : "turn it down") +
        ". To accept a 50/50 chance of losing " + money(L) + ", the possible gain would need to be about <b>" + money(need) + "</b> (L × λ<sup>1/α</sup>).";
    }
    wire(el, run);
  };

  /* ---------- 3. How often you look: chance of seeing a loss ---------- */
  var FREQ = [["252", "Every trading day"], ["52", "Every week"], ["12", "Every month"], ["4", "Every quarter"], ["1", "Once a year"], ["0.2", "Once every five years"]];
  function lossChance(mu, sd, n) { if (sd <= 0) return mu < 0 ? 1 : 0; return ncdf(-(mu / n) / (sd / Math.sqrt(n))); }
  INV.s8.lossChance = lossChance;
  TOOLS.s8Checking = function (el) {
    var u = uid(el);
    shell(el, "How often you look changes what you see", "Model",
      sel(u + "-f", "How often you check your balance", FREQ, "12") +
      rng(u + "-m", "Expected return per year", 0, 12, 0.5, 7, "pct") + rng(u + "-s", "Volatility per year (standard deviation)", 4, 30, 1, 16, "pct") +
      rng(u + "-lam", "How much worse a loss feels (λ)", 1, 3, 0.05, 2.25, "x") +
      note("Simplified model: returns over each checking period are normally distributed with mean r ÷ n and standard deviation σ ÷ √n, where n is checks per year. Illustrative, not a forecast."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var n = num(self(el, "f").value, 12), mu = num(self(el, "m").value), sd = num(self(el, "s").value, 16), lam = num(self(el, "lam").value, 1);
      var p = lossChance(mu, sd, n), feel = (1 - p) - lam * p, per = n >= 1 ? n * 10 : 2;
      self(el, "k").innerHTML = kpi("Chance a check shows a loss", pct(p * 100, 0), p >= 0.4 ? "bad" : "") + kpi("Loss views per decade", Math.round(p * per).toLocaleString()) +
        kpi("Net feeling per check", (feel >= 0 ? "+" : "−") + Math.abs(feel).toFixed(2), feel >= 0 ? "good" : "bad");
      var lab = { "252": "Daily", "52": "Weekly", "12": "Monthly", "4": "Quarterly", "1": "Yearly", "0.2": "5 years" };
      INV.barChart(self(el, "c"), { label: "Chance of seeing a loss by checking frequency", height: 230, allLabels: true, valueLabels: true, yFmt: function (v) { return Math.round(v) + "%"; },
        data: FREQ.map(function (f) { var q = lossChance(mu, sd, Number(f[0])) * 100; return { label: lab[f[0]], tip: f[1], y: q, color: String(n) === f[0] ? "var(--s5)" : "var(--s6)" }; }) });
      self(el, "n").innerHTML = "Checking " + FREQ.filter(function (f) { return Number(f[0]) === n; })[0][1].toLowerCase() + ", about <b>" + pct(p * 100, 0) + "</b> of your looks show a loss. " +
        "If each loss stings " + lam.toFixed(2) + " times as much as an equal gain pleases, the average look feels " + (feel >= 0 ? "slightly good" : "bad") +
        " (gains count +1, losses −λ). The investment is identical in every row; only the viewing frequency changes.";
    }
    wire(el, run);
  };

  /* ---------- 4. The cost of trading ---------- */
  TOOLS.s8Trading = function (el) {
    var u = uid(el);
    shell(el, "What frequent trading costs over time", "Calculator",
      numf(u + "-p", "Portfolio today ($)", 50000, 1000) +
      rng(u + "-t", "Turnover per year (share of portfolio replaced)", 0, 300, 5, 75, "pct") +
      rng(u + "-c", "Round-trip cost per trade (spread, commission, slippage)", 0, 4, 0.1, 1, "pct") +
      rng(u + "-r", "Return before trading costs", 0, 12, 0.5, 7, "pct") + rng(u + "-n", "Years", 1, 40, 1, 20, "yr") +
      note("Annual drag = turnover × round-trip cost. Barber and Odean (2000) measured average turnover of about 75% a year and round-trip costs of about 4% on trades over $1,000 at a 1990s discount broker. Commissions are far lower today; spreads, taxes and mistimed trades are not zero."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c2"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var P = Math.max(0, num(self(el, "p").value)), T = num(self(el, "t").value) / 100, c = num(self(el, "c").value) / 100, r = num(self(el, "r").value) / 100, n = num(self(el, "n").value, 1);
      var drag = T * c, a = [[0, P]], b = [[0, P]], va = P, vb = P;
      for (var y = 1; y <= n; y++) { va *= 1 + r; vb *= (1 + r) * (1 - drag); a.push([y, va]); b.push([y, vb]); }
      self(el, "k").innerHTML = kpi("Annual drag", pct(drag * 100, 2), drag > 0.01 ? "bad" : "") + kpi("Buy and hold", money(va)) + kpi("With this trading", money(vb)) +
        kpi("Given up", money(va - vb), va - vb > 0 ? "bad" : "");
      INV.lineChart(self(el, "c2"), { label: "Buy and hold versus active trading", height: 240, xTitle: "Years", xFmt: yearFmt, yFmt: ms,
        series: [{ name: "Buy and hold", color: "var(--s2)", data: a }, { name: "Turnover " + Math.round(T * 100) + "% at " + (c * 100).toFixed(1) + "% per round trip", color: "var(--s5)", data: b }] });
      self(el, "n2").innerHTML = "Each year the trader pays " + pct(drag * 100, 2) + " of the portfolio in costs, so the balance grows by (1 + r)(1 − " + (drag * 100).toFixed(2) + "%). Over " + n + " years that gives up <b>" +
        pct(va > 0 ? (1 - vb / va) * 100 : 0, 1) + "</b> of the buy-and-hold result, before any taxes on short-term gains and before the cost of trades that turn out badly.";
    }
    wire(el, run);
  };

  /* ======================= INV-061 ======================= */

  /* ---------- 5. Gain needed to recover ---------- */
  TOOLS.s8Recovery = function (el) {
    var u = uid(el);
    shell(el, "Down 50% needs up 100%: the arithmetic of recovery", "Calculator",
      rng(u + "-d", "Fall from the peak", 5, 90, 1, 50, "npct") + rng(u + "-r", "Annual return during the recovery", 1, 15, 0.5, 8, "pct") +
      numf(u + "-v", "Portfolio at the peak ($)", 100000, 1000) +
      note("Gain needed = D ÷ (1 − D). Years to recover = ln[1 ÷ (1 − D)] ÷ ln(1 + r), with no contributions or withdrawals."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var D = num(self(el, "d").value, 50) / 100, r = num(self(el, "r").value, 8) / 100, V = Math.max(0, num(self(el, "v").value));
      var need = D / (1 - D), yrs = Math.log(1 / (1 - D)) / Math.log(1 + r);
      self(el, "k").innerHTML = kpi("Value after the fall", money(V * (1 - D)), "bad") + kpi("Gain needed to break even", pct(need * 100, 0), "bad") + kpi("Years to recover at " + pct(r * 100, 1), yrs.toFixed(1));
      var pts = []; for (var k = 5; k <= 90; k += 1) pts.push([k, k / (100 - k) * 100]);
      INV.lineChart(self(el, "c"), { label: "Gain needed to recover from a fall", height: 240, log: true, xTitle: "Fall from peak (%)", yTitle: "Gain needed (%, log scale)",
        xFmt: function (v) { return Math.round(v) + "%"; }, yFmt: function (v) { return v >= 1000 ? (v / 1000) + "k%" : v + "%"; },
        series: [{ name: "Gain needed", color: "var(--s5)", data: pts }], dots: [{ x: D * 100, y: need * 100, label: pct(need * 100, 0), color: "var(--s5)", anchor: D > 0.6 ? "end" : null, dx: D > 0.6 ? -8 : 8 }] });
      self(el, "n").innerHTML = "A " + pct(D * 100, 0) + " fall turns " + money(V) + " into " + money(V * (1 - D)) + ". Getting back needs a <b>" + pct(need * 100, 0) + "</b> gain: about " + yrs.toFixed(1) +
        " years at " + pct(r * 100, 1) + " a year. Adding new money during the recovery, as most savers do, shortens this; withdrawing lengthens it (INV-077).";
    }
    wire(el, run);
  };

  /* ---------- 6. What a behavior gap costs ---------- */
  TOOLS.s8Gap = function (el) {
    var u = uid(el);
    shell(el, "What a behavior gap costs over a lifetime", "Calculator",
      numf(u + "-p", "Invested today ($)", 100000, 1000) + numf(u + "-m", "Added each year ($)", 6000, 500) +
      rng(u + "-r", "The funds' own return per year", 0, 12, 0.1, 9.9, "pct") + rng(u + "-g", "Behavior gap per year", 0, 4, 0.1, 1.2, "pct") + rng(u + "-n", "Years", 1, 40, 1, 30, "yr") +
      note("Illustration: the investor's own result is modeled as the fund return minus the gap. Defaults: Morningstar's Mind the Gap 2026, 10 years to December 31, 2025 (9.9% fund return, 1.2-point gap)."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n2"></p>');
    function run() {
      var P = Math.max(0, num(self(el, "p").value)), M = Math.max(0, num(self(el, "m").value)), r = num(self(el, "r").value) / 100, g = num(self(el, "g").value) / 100, n = num(self(el, "n").value, 1);
      var va = P, vb = P, a = [[0, P]], b = [[0, P]];
      for (var y = 1; y <= n; y++) { va = (va + M) * (1 + r); vb = (vb + M) * (1 + r - g); a.push([y, va]); b.push([y, vb]); }
      self(el, "k").innerHTML = kpi("At the funds' return", money(va)) + kpi("With the gap", money(vb)) + kpi("Cost of the gap", money(va - vb), va > vb ? "bad" : "") +
        kpi("Share of wealth lost", pct(va > 0 ? (1 - vb / va) * 100 : 0, 0), va > vb ? "bad" : "");
      INV.lineChart(self(el, "c"), { label: "Fund return versus investor return", height: 240, xTitle: "Years", xFmt: yearFmt, yFmt: ms,
        series: [{ name: "Fund return " + pct(r * 100, 1), color: "var(--s2)", data: a }, { name: "Investor return " + pct((r - g) * 100, 1), color: "var(--s5)", data: b }] });
      self(el, "n2").innerHTML = "Contributions are added at the start of each year. A gap of " + pct(g * 100, 1) + " a year sounds small; over " + n + " years it costs <b>" + money(va - vb) +
        "</b>. Unlike fees, this cost is not on any statement: it comes from buying after rises and selling after falls.";
    }
    wire(el, run);
  };

  /* ---------- 7. Stay the course: selling after a fall versus holding ---------- */
  function stayCourse(o) {
    var h = hist(), first = h.first, rows = [], hold = o.amt, v = o.amt, inv = true, out = 0, sells = [], yrsOut = 0;
    var ph = [[o.y0, hold]], pv2 = [[o.y0, v]];
    for (var y = o.y0; y <= o.y1; y++) {
      var i = y - first, mix = o.s * h.stocks[i] + (1 - o.s) * h.tbond[i], tb = h.tbill[i];
      hold *= 1 + mix / 100;
      if (inv) {
        v *= 1 + mix / 100;
        if (mix <= o.trig) { inv = false; out = 0; sells.push({ sold: y, ret: mix, back: null }); }
      } else {
        v *= 1 + tb / 100; out++; yrsOut++;
        if (out >= o.wait) { inv = true; sells[sells.length - 1].back = y; }
      }
      ph.push([y + 1, hold]); pv2.push([y + 1, v]);
    }
    return { hold: hold, v: v, sells: sells, yrsOut: yrsOut, ph: ph, pv: pv2 };
  }
  INV.s8.stayCourse = stayCourse;
  TOOLS.s8StayCourse = function (el) {
    var u = uid(el), h = hist();
    shell(el, "Stay the course: sell after a bad year, or hold?", "Historical data",
      numf(u + "-amt", "Invested at the start ($)", 100000, 1000) +
      rng(u + "-y0", "Start of year", h.first, h.last - 1, 1, 2007) + rng(u + "-y1", "End of year", h.first + 1, h.last, 1, h.last) +
      rng(u + "-s", "Mix", 0, 100, 10, 100, "stk") +
      sel(u + "-tr", "The seller sells after a calendar year worse than", [["-10", "−10%"], ["-15", "−15%"], ["-20", "−20%"], ["-25", "−25%"], ["-30", "−30%"]], "-20") +
      rng(u + "-w", "Years the seller waits in Treasury bills before buying back", 1, 10, 1, 3, "yr") +
      note("Calendar-year returns (Damodaran, NYU Stern), S&amp;P 500 with dividends and 10-year Treasuries, rebalanced yearly; waiting money earns 3-month T-bill rates. Sales happen at year-end, after the loss is already taken. Before taxes and fees."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    var y0i = self(el, "y0"), y1i = self(el, "y1");
    function run() {
      var amt = Math.max(0, num(self(el, "amt").value)), y0 = Number(y0i.value), y1 = Number(y1i.value);
      if (y1 <= y0) { y1 = y0 + 1; y1i.value = y1; fmtOut(y1i); }
      var r = stayCourse({ amt: amt, y0: y0, y1: y1, s: num(self(el, "s").value) / 100, trig: num(self(el, "tr").value, -20), wait: num(self(el, "w").value, 3) });
      var diff = r.hold - r.v;
      self(el, "k").innerHTML = kpi("Held throughout", money(r.hold)) + kpi("Sold after the fall", money(r.v)) +
        kpi(diff >= 0 ? "Cost of selling" : "Selling came out ahead by", money(Math.abs(diff)), diff > 0 ? "bad" : diff < 0 ? "good" : "") + kpi("Times sold", String(r.sells.length));
      var mk = r.sells.map(function (s) { return { x: s.sold + 1, label: "sold" }; });
      INV.lineChart(self(el, "c"), { label: "Holding versus selling after a bad year", height: 260, xFmt: yearFmt, yFmt: ms, zeroBase: false, log: y1 - y0 > 30,
        series: [{ name: "Held throughout", color: "var(--s2)", data: r.ph }, { name: "Sold after a bad year, bought back later", color: "var(--s5)", data: r.pv }], marks: mk.slice(0, 6) });
      var txt = r.sells.length ? r.sells.map(function (s) { return "sold at the end of " + s.sold + " after a " + pct((s.ret < 0 ? -1 : 1) * Math.round(Math.abs(s.ret) * 10) / 10, 1) + " year" + (s.back ? " and bought back at the end of " + s.back : " and was still out at the end"); }).join("; ") + "." : "";
      self(el, "n").innerHTML = (r.sells.length ? "The seller " + txt + " Years spent out of the market: " + r.yrsOut + ". " : "No calendar year in this window fell far enough to trigger a sale, so the two paths are identical. Try an earlier start, such as 1929, 1973 or 2000. ") +
        (r.sells.length ? (diff > 0 ? "Holding ended <b>" + pct(r.v > 0 ? (r.hold / r.v - 1) * 100 : 0, 0) + "</b> ahead." : diff < 0 ? "Here selling happened to help: the market kept falling after the sale. Such windows exist, but the seller could not have known in advance." : "") : "");
    }
    wire(el, run);
  };

  /* ======================= INV-062 ======================= */

  /* ---------- 8. Red-flag checker ---------- */
  var FLAGS = [
    ["Promises high returns with little or no risk, or a guarantee", "Every investment carries risk; 'guaranteed' high returns are the classic warning sign (SEC)."],
    ["Returns are unusually steady, month after month, whatever markets do", "Real investments go up and down. The SEC's Inspector General found complaints about Madoff's unusually consistent returns from 1992 on."],
    ["The seller is not registered (not found on BrokerCheck or IAPD)", "Unlicensed sellers commit much of US investment fraud (Investor.gov)."],
    ["The investment itself is not registered, and no one can show an exemption", "Registration gives you disclosure about the business, management and finances."],
    ["Pressure to act now: a deadline, a limited spot, a secret", "Urgency is designed to stop you from checking."],
    ["The strategy is secret or too complex to explain", "If you cannot explain how it makes money, you cannot judge it."],
    ["Someone you met online, on a dating app or by 'wrong number' text brings up investing", "This is how cryptocurrency investment scams (pig butchering) usually begin (FBI)."],
    ["You are asked to pay in cryptocurrency, gift cards, wire or cash courier", "Payments that are hard to reverse are preferred by fraudsters."],
    ["An app or website shows big profits, but withdrawing requires a 'tax' or 'fee' first", "Fake platforms show fake gains, then charge fees to release money that is already gone (FBI)."],
    ["It comes through your group: church, community, club or a friend of a friend", "Affinity fraud exploits trust; leaders are often unwitting victims (Investor.gov)."],
    ["A stock tip urges you to buy a little-known company before it 'explodes'", "The typical pitch of a pump-and-dump (SEC)."],
    ["Someone offers to recover money you already lost, for an up-front fee", "Recovery scams target people who have already been defrauded (FBI)."]
  ];
  TOOLS.s8RedFlags = function (el) {
    var u = uid(el);
    shell(el, "Red-flag checker for any offer", "Checklist",
      '<div class="fld"><label>Tick every statement that is true of the offer</label>' + FLAGS.map(function (f, i) {
        return '<label style="display:flex;gap:8px;align-items:flex-start;font-weight:500;margin:5px 0;font-size:.86rem"><input type="checkbox" id="' + u + "-x" + i + '" style="margin-top:3px">' + esc(f[0]) + "</label>";
      }).join("") + "</div>",
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-l"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var on = FLAGS.map(function (f, i) { return self(el, "x" + i).checked; }), n = on.filter(Boolean).length;
      var level = n === 0 ? "No flags ticked" : n === 1 ? "Stop and verify" : n <= 3 ? "Serious warning" : "Walk away";
      self(el, "k").innerHTML = kpi("Red flags", n + " of " + FLAGS.length, n ? "bad" : "good") + kpi("Assessment", level, n > 1 ? "bad" : n ? "" : "good");
      self(el, "l").innerHTML = n ? '<ul style="margin:6px 0 0 18px;font-size:.86rem">' + FLAGS.map(function (f, i) { return on[i] ? "<li><b>" + esc(f[0]) + ".</b> " + esc(f[1]) + "</li>" : ""; }).join("") + "</ul>" : "";
      self(el, "n").innerHTML = n === 0 ? "Tick any statement that fits. Even with no flags, check the seller on BrokerCheck and IAPD before sending money." :
        "Do not send money yet. Verify the seller and the investment independently (not through links or numbers the seller gives you), talk to someone you trust, and report suspected fraud to the SEC, your state securities regulator or the FBI's IC3.";
    }
    wire(el, run);
  };

  /* ---------- 9. Ponzi-scheme arithmetic ---------- */
  function ponzi(o) {
    var B = o.seed, C = o.seed, D = o.seed * o.d1, rep = [[0, B]], cash = [[0, C]], fail = null, paid = 0, skimT = 0;
    for (var y = 1; y <= 40; y++) {
      var W = o.w * B, sk = o.skim * Math.max(C, 0);
      B = B * (1 + o.p) + D - W;
      C = C * (1 + o.r) + D - W - sk;
      paid += W; skimT += sk;
      rep.push([y, B]); cash.push([y, Math.max(C, 0)]);
      if (C < 0) { fail = y; break; }
      D *= 1 + o.g;
    }
    return { fail: fail, B: B, C: C, rep: rep, cash: cash, paid: paid, skim: skimT };
  }
  INV.s8.ponzi = ponzi;
  TOOLS.s8Ponzi = function (el) {
    var u = uid(el);
    shell(el, "Why every Ponzi scheme collapses", "Model",
      rng(u + "-p", "Return promised to investors", 4, 40, 1, 12, "pct") + rng(u + "-s", "Money raised at the start", 1, 100, 1, 10, "mm") +
      rng(u + "-d", "New money in year 1, as a share of the start", 0, 100, 5, 50, "pct") + rng(u + "-g", "Growth of new money each year", -50, 50, 5, 0, "spct") +
      rng(u + "-w", "Share of reported balances withdrawn each year", 0, 30, 1, 8, "pct") + rng(u + "-kin", "Operator's take each year (share of cash)", 0, 20, 1, 3, "pct") +
      note("Nothing is actually invested: cash earns 0%. Reported balances grow at the promised rate; cash is what really exists. The scheme fails in the year withdrawals exceed the cash on hand. Simplified illustration."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var o = { p: num(self(el, "p").value) / 100, seed: num(self(el, "s").value, 10) * 1e6, d1: num(self(el, "d").value) / 100, g: num(self(el, "g").value) / 100,
        w: num(self(el, "w").value) / 100, skim: num(self(el, "kin").value) / 100, r: 0 };
      var r = ponzi(o), last = r.rep[r.rep.length - 1][1], cashNow = Math.max(r.C, 0);
      var hole = r.fail ? r.rep[r.rep.length - 1][1] : last - cashNow;
      self(el, "k").innerHTML = kpi("Collapses in", r.fail ? "Year " + r.fail : "Not within 40 years", r.fail ? "bad" : "") +
        kpi(r.fail ? "Balances investors think they have" : "Reported balances, year 40", ms(last)) +
        kpi(r.fail ? "Cash left" : "Cash actually held", ms(cashNow)) + kpi("Operator's take", ms(r.skim), "bad");
      INV.lineChart(self(el, "c"), { label: "Reported balances versus real cash", height: 250, xTitle: "Year", xFmt: yearFmt, yFmt: ms,
        series: [{ name: "What statements show", color: "var(--s3)", data: r.rep }, { name: "Cash that actually exists", color: "var(--s5)", data: r.cash }], marks: r.fail ? [{ x: r.fail }] : [], dots: r.fail ? [{ x: r.fail, y: 0, color: "var(--s5)", label: "collapse, year " + r.fail, anchor: r.fail < 10 ? null : "end", dx: r.fail < 10 ? 8 : -8, dy: -8 }] : [] });
      self(el, "n").innerHTML = (r.fail ? "In year " + r.fail + " withdrawals exceed the cash on hand and the scheme can no longer pay. Statements show <b>" + ms(hole) + "</b> that does not exist. " :
        (o.p <= 0 ? "" : "It survives the 40 years shown only because new money keeps arriving fast enough; push new-money growth lower to see what happens when recruiting slows. ")) +
        "Earlier investors who withdrew were paid " + ms(r.paid) + " in total, all from other investors' deposits. Promising " + pct(o.p * 100, 0) + " while earning nothing opens a gap that grows every year.";
    }
    wire(el, run);
  };
})();
