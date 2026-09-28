/* Investing Learning Lab - Stage 12 (Estate Planning & Wealth Transfer) calculators, part A - V1.3 (October 2026)
   Tools for INV-084 to INV-089. Every tool computes from its stated rule in the browser.
   Federal figures are for 2026 (IRS Rev. Proc. 2025-32, as amended by Public Law 119-21):
   basic exclusion amount $15,000,000; annual gift exclusion $19,000; rate schedule of 26 U.S.C. 2001(c).
   State figures: Tax Foundation, Facts & Figures 2026 (Tables 36-37, as of January 1, 2026), except Washington,
   shown for deaths on or after July 1, 2026 from the WA Department of Revenue estate tax tables;
   Pennsylvania rates from the PA Department of Revenue and 72 P.S. 9116; Maryland exemptions from Md. Code, Tax-Gen. 7-203. General information only, not legal advice. */
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
  function chk(id, label, on) {
    return '<div class="fld"><label for="' + id + '" style="display:flex;gap:8px;align-items:flex-start;justify-content:flex-start;text-align:left;font-weight:600"><input type="checkbox" id="' + id + '"' + (on ? " checked" : "") + ' style="margin-top:2px;flex:none"><span>' + esc(label) + "</span></label></div>";
  }
  function note(t) { return '<p class="hint" style="font-size:.76rem;color:var(--muted)">' + t + "</p>"; }
  function self(el, id) { return el.querySelector("#" + el.dataset.uid + "-" + id); }
  function uid(el) { if (!el.dataset.uid) el.dataset.uid = "t" + Math.random().toString(36).slice(2, 8); return el.dataset.uid; }
  function fmtOut(input) {
    var o = input.parentNode.querySelector("output"); if (!o) return;
    var f = input.getAttribute("data-fmt"), v = Number(input.value);
    o.textContent = f === "pct" ? v.toFixed(input.step.indexOf(".") > -1 ? (input.step.split(".")[1].length) : 0) + "%" :
      f === "yr" ? v + (v === 1 ? " year" : " years") : f === "money" ? money(v) : f === "mm" ? "$" + v + " million" :
      f === "n" ? String(v) : String(v);
  }
  function wire(el, fn) {
    el.querySelectorAll("input,select").forEach(function (i) {
      i.addEventListener("input", function () { if (i.type === "range") fmtOut(i); fn(); });
      if (i.type === "checkbox" || i.tagName === "SELECT") i.addEventListener("change", fn);
      if (i.type === "range") fmtOut(i);
    });
    fn();
    document.addEventListener("inv-theme", fn);
  }
  function kpi(k, v, cls) { return '<div class="kpi"><div class="k">' + esc(k) + '</div><div class="v ' + (cls || "") + '">' + v + "</div></div>"; }
  function num(el, id) { var v = Number(self(el, id).value); return isFinite(v) && v > 0 ? v : 0; }
  function $0(v) { return money(Math.round(v), 0); }

  /* ---------- federal transfer-tax arithmetic (26 U.S.C. 2001(c)) ---------- */
  var BEA2026 = 15000000, AGE2026 = 19000;
  var SCHED = [[0, 0, 0.18], [10000, 1800, 0.20], [20000, 3800, 0.22], [40000, 8200, 0.24], [60000, 13000, 0.26], [80000, 18200, 0.28],
    [100000, 23800, 0.30], [150000, 38800, 0.32], [250000, 70800, 0.34], [500000, 155800, 0.37], [750000, 248300, 0.39], [1000000, 345800, 0.40]];
  function tentTax(x) {
    x = Math.max(0, x || 0); var b = SCHED[0];
    for (var i = 0; i < SCHED.length; i++) if (x > SCHED[i][0]) b = SCHED[i];
    return b[1] + b[2] * (x - b[0]);
  }
  INV.s12aTentTax = tentTax;
  function transferTax(base, exclusion) { return Math.max(0, tentTax(base) - tentTax(exclusion)); }

  /* ---------- 1. Intestacy: who inherits without a will (INV-084) ---------- */
  TOOLS.s12aIntestacy = function (el) {
    var u = uid(el);
    shell(el, "Who inherits if there is no will?", "Pennsylvania and Arizona law",
      sel(u + "-st", "State where the person lived", [["pa", "Pennsylvania (20 Pa.C.S. 2102-2103)"], ["az", "Arizona (A.R.S. 14-2102, 14-2103)"]], "pa") +
      numf(u + "-e", "Estate passing without a will ($)", 400000, 5000) +
      sel(u + "-sp", "Surviving spouse?", [["yes", "Yes"], ["no", "No"]], "yes") +
      sel(u + "-ch", "Surviving children or other descendants", [["none", "None"], ["all", "Yes, all are also the spouse's children"], ["some", "Yes, and at least one is not the spouse's child"]], "all") +
      sel(u + "-pa", "A parent of the person still living?", [["no", "No"], ["yes", "Yes"]], "no") +
      rng(u + "-cp", "Arizona only: share that is the person's half of community property", 0, 100, 5, 100, "pct") +
      note("Applies only to property that passes under intestacy law. Beneficiary designations, joint accounts with survivorship and trusts are not affected. Simplified: it assumes descendants are children who survive, and that at least one sibling survives if no closer relative does."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var st = self(el, "st").value, E = num(el, "e"), sp = self(el, "sp").value === "yes", ch = self(el, "ch").value, par = self(el, "pa").value === "yes";
      var cp = Number(self(el, "cp").value) / 100;
      self(el, "cp").closest(".fld").style.opacity = st === "az" ? "1" : ".45";
      var out = { spouse: 0, kids: 0, parents: 0, others: 0 }, rule = "";
      var rest = E;
      if (sp) {
        if (st === "pa") {
          if (ch === "none" && !par) { out.spouse = E; rule = "No descendants and no parent: the spouse takes the entire intestate estate (20 Pa.C.S. 2102(1))."; }
          else if (ch === "some") { out.spouse = E / 2; rule = "At least one descendant is not the spouse's: the spouse takes one-half (2102(4)); descendants share the rest."; }
          else { out.spouse = Math.min(E, 30000) + Math.max(0, E - 30000) / 2; rule = ch === "all" ? "Descendants who are all also the spouse's: the spouse takes the first $30,000 plus one-half of the balance (2102(3)); descendants share the rest." : "No descendants but a parent survives: the spouse takes the first $30,000 plus one-half of the balance (2102(2)); the parent or parents take the rest."; }
        } else {
          if (ch === "some") { out.spouse = E * (1 - cp) / 2; rule = "At least one descendant is not the spouse's: the spouse takes one-half of the separate property and none of the person's half of community property (A.R.S. 14-2102(2)). The spouse already owns their own half of community property."; }
          else { out.spouse = E; rule = "No descendants, or descendants who are all also the spouse's: the spouse takes the entire intestate estate (A.R.S. 14-2102(1)), even if a parent survives."; }
        }
        rest = E - out.spouse;
      } else rule = "No spouse: the estate passes to descendants; if none, to parents; if none, to the parents' other descendants (brothers, sisters and their children).";
      if (rest > 0) {
        if (ch !== "none") out.kids = rest; else if (par) out.parents = rest; else out.others = rest;
      }
      self(el, "k").innerHTML = kpi("Spouse", $0(out.spouse)) + kpi("Children / descendants", $0(out.kids)) + kpi("Parents", $0(out.parents)) + kpi("Siblings or more distant", $0(out.others));
      INV.barChart(self(el, "c"), { label: "Intestate shares", height: 210, allLabels: true, valueLabels: true, yFmt: ms, tipFmt: function (v) { return $0(v); },
        data: [{ label: "Spouse", y: out.spouse, color: "var(--s1)" }, { label: "Descendants", y: out.kids, color: "var(--s2)" }, { label: "Parents", y: out.parents, color: "var(--s3)" }, { label: "Siblings, others", y: out.others, color: "var(--s6)" }] });
      self(el, "n").innerHTML = rule + (out.kids > 0 && ch !== "none" ? " A child under 18 cannot manage an inheritance directly; a court-supervised guardian or conservator of the child's property is usually needed." : "") +
        " This is general information about two states' statutes, not legal advice; other states differ.";
    }
    wire(el, run);
  };

  /* ---------- 2. Estate document checkup (INV-084) ---------- */
  TOOLS.s12aDocs = function (el) {
    var u = uid(el);
    var ITEMS = [
      ["will", "A signed will, reviewed in the last five years", 3, "Without it, state intestacy law decides who inherits and who administers the estate."],
      ["guard", "A guardian named for minor children (in the will)", 3, "Without it, a court chooses who raises the children, without knowing your wishes."],
      ["fpoa", "A durable financial power of attorney", 3, "Without it, family may need a court guardianship to pay your bills if you cannot."],
      ["hcpoa", "A health care power of attorney (health care agent)", 3, "Without it, doctors turn to whoever state law ranks as your surrogate, who may not be your choice."],
      ["lw", "A living will stating treatment wishes", 2, "Without it, your agent and doctors must guess at your wishes."],
      ["hipaa", "A HIPAA authorization naming who may see your records", 1, "Without it, providers may refuse to share information with family who are not your legal representative."],
      ["bene", "Beneficiary designations checked, with contingent beneficiaries", 3, "Out-of-date forms override your will and are the most common costly mistake."],
      ["loi", "A letter of instruction: accounts, passwords, wishes", 1, "Without it, your executor has to hunt for accounts and guess at your wishes."],
      ["where", "Originals stored safely, and the right people told where", 1, "A will no one can find is almost as bad as no will."]];
    var SHORT = { will: "Will", guard: "Guardian", fpoa: "Fin. POA", hcpoa: "Health POA", lw: "Living will", hipaa: "HIPAA", bene: "Beneficiaries", loi: "Letter", where: "Storage" };
    shell(el, "Estate document checkup", "Checklist",
      sel(u + "-m", "Do you have children under 18?", [["yes", "Yes"], ["no", "No"]], "yes") +
      ITEMS.map(function (it) { return chk(u + "-" + it[0], it[1], it[0] === "bene"); }).join("") +
      note("Weights reflect how serious the consequence of a gap is (3 = major, 1 = helpful). A checklist, not legal advice: requirements for signing and witnessing each document differ by state."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var minors = self(el, "m").value === "yes", have = 0, tot = 0, pts = 0, ptsTot = 0, gaps = [], data = [];
      el.querySelector("#" + u + "-guard").closest(".fld").style.opacity = minors ? "1" : ".45";
      ITEMS.forEach(function (it) {
        if (it[0] === "guard" && !minors) return;
        var on = self(el, it[0]).checked; tot++; ptsTot += it[2];
        if (on) { have++; pts += it[2]; } else gaps.push(it);
        data.push({ label: SHORT[it[0]], tip: it[1], y: it[2], color: on ? "var(--s2)" : "var(--s5)" });
      });
      gaps.sort(function (a, b) { return b[2] - a[2]; });
      self(el, "k").innerHTML = kpi("Documents in place", have + " of " + tot) + kpi("Readiness score", pct(ptsTot ? pts / ptsTot * 100 : 0, 0), pts === ptsTot ? "good" : "") +
        kpi("Biggest gap", gaps.length ? esc(gaps[0][1].split(",")[0]) : "None", gaps.length ? "bad" : "good");
      INV.barChart(self(el, "c"), { label: "Documents by importance", height: 230, yTicks: 3, allLabels: true, yFmt: function (v) { return String(Math.round(v)); }, tipFmt: function (v) { return "weight " + v; }, data: data });
      self(el, "n").innerHTML = gaps.length ? "<b>Start with:</b> " + esc(gaps[0][1]) + ". " + esc(gaps[0][3]) + (gaps[1] ? " <b>Then:</b> " + esc(gaps[1][1]) + "." : "") : "Every item is in place. Review them after any marriage, divorce, birth, death, move to another state or large change in wealth.";
    }
    wire(el, run);
  };

  /* ---------- 3. Per stirpes vs per capita (INV-085) ---------- */
  TOOLS.s12aStirpes = function (el) {
    var u = uid(el);
    shell(el, "Per stirpes, per capita, or nothing?", "Calculator",
      numf(u + "-a", "Amount left to 'my children' ($)", 600000, 10000) +
      rng(u + "-l", "Children still living", 0, 4, 1, 1, "n") +
      rng(u + "-x", "Children of predeceased child X", 0, 4, 1, 1, "n") +
      rng(u + "-y", "Children of predeceased child Y", 0, 4, 1, 3, "n") +
      note("Two children, X and Y, died before the parent. Per stirpes divides at the children's level and passes a deceased child's share down that branch. Per capita at each generation (the Uniform Probate Code method) pools the deceased children's shares and splits them equally among all grandchildren. A beneficiary form naming only the children, with no per stirpes election, usually gives a deceased child's share to the surviving named beneficiaries."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-t"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var A = num(el, "a"), L = Number(self(el, "l").value), x = Number(self(el, "x").value), y = Number(self(el, "y").value);
      var shares = L + (x > 0 ? 1 : 0) + (y > 0 ? 1 : 0), share = shares ? A / shares : 0;
      var ps = { c: share, x: x ? share / x : 0, y: y ? share / y : 0 };
      var pooled = shares ? A * ((x > 0 ? 1 : 0) + (y > 0 ? 1 : 0)) / shares : 0, gk = x + y;
      var pc = { c: share, x: gk && x ? pooled / gk : 0, y: gk && y ? pooled / gk : 0 };
      var lp = { c: L ? A / L : 0, x: 0, y: 0 };
      self(el, "k").innerHTML = kpi("Each living child (per stirpes)", $0(ps.c)) + kpi("Each child of X (per stirpes)", $0(ps.x)) + kpi("Each child of Y (per stirpes)", $0(ps.y)) + kpi("Each living child (form, no per stirpes)", $0(lp.c));
      var row = function (t, o) { return "<tr><td>" + t + '</td><td class="r">' + $0(o.c) + '</td><td class="r">' + $0(o.x) + '</td><td class="r">' + $0(o.y) + "</td></tr>"; };
      self(el, "t").innerHTML = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Method</th><th class="r">Each living child</th><th class="r">Each child of X</th><th class="r">Each child of Y</th></tr></thead><tbody>' +
        row("Per stirpes", ps) + row("Per capita at each generation", pc) + row("Named children only (lapse)", lp) + "</tbody></table></div>";
      INV.barChart(self(el, "c"), { label: "Per-person amounts by method", height: 230, allLabels: true, valueLabels: true, yFmt: ms, tipFmt: function (v) { return $0(v); },
        data: [{ label: "Child: stirpes", y: ps.c, color: "var(--s1)" }, { label: "X's child", tip: "Child of X: per stirpes", y: ps.x, color: "var(--s1)" }, { label: "Y's child", tip: "Child of Y: per stirpes", y: ps.y, color: "var(--s1)" },
          { label: "Child: capita", y: pc.c, color: "var(--s2)" }, { label: "X's child ", tip: "Child of X: per capita at each generation", y: pc.x, color: "var(--s2)" }, { label: "Y's child ", tip: "Child of Y: per capita at each generation", y: pc.y, color: "var(--s2)" }] });
      self(el, "n").innerHTML = shares === 0 ? "No descendant survives, so none of these methods applies: the gift fails and passes under the rest of the will, the account's default rules or intestacy." :
        (L === 0 ? "No named child survives: a beneficiary form without a per stirpes election would usually pay the account to the estate. " : "") +
        "Per stirpes gives each branch an equal share: " + (x ? (x === 1 ? "X's only child takes one share" : "X's " + x + " children split one share") : "X's branch has no one to take") + " and " + (y ? (y === 1 ? "Y's only child takes another." : "Y's " + y + " children split another.") : "Y's branch has no one to take.") + " Per capita at each generation treats all " + gk + " grandchildren of deceased children equally. Check exactly which method your will, trust or account form uses; the words matter.";
    }
    wire(el, run);
  };

  /* ---------- 4. Probate sorter (INV-086) ---------- */
  TOOLS.s12aProbate = function (el) {
    var u = uid(el);
    var HOW = [["sole", "In my name only, no beneficiary"], ["bene", "Beneficiary designation (named person)"], ["estate", "Beneficiary is 'my estate'"], ["joint", "Joint with right of survivorship"], ["tod", "TOD / POD registration"], ["trust", "Titled to my living trust"]];
    var ROWS = [["h", "House (real estate)", 380000, "sole", true], ["i", "Traditional IRA", 780000, "bene", false], ["cd", "CDs and savings", 60000, "sole", false], ["ck", "Checking account", 15000, "pod", false], ["car", "Car and belongings", 20000, "sole", false]];
    shell(el, "What would go through probate?", "Sorter",
      sel(u + "-st", "State for the small-estate check", [["pa", "Pennsylvania"], ["az", "Arizona"]], "pa") +
      ROWS.map(function (r) {
        return '<div class="fld"><label for="' + u + "-v" + r[0] + '">' + esc(r[1]) + ' ($)</label><input type="number" id="' + u + "-v" + r[0] + '" value="' + r[2] + '" step="1000" min="0">' +
          '<select id="' + u + "-t" + r[0] + '" aria-label="How ' + esc(r[1]) + ' is titled" style="margin-top:4px">' + HOW.map(function (h) { var d = r[3] === "pod" ? "tod" : r[3]; return '<option value="' + h[0] + '"' + (h[0] === d ? " selected" : "") + ">" + esc(h[1]) + "</option>"; }).join("") + "</select></div>";
      }).join("") +
      note("Defaults sketch Ruth Kowalski. The California fee is shown only as a benchmark from a real statutory schedule (Cal. Prob. Code 10800 and 10810); Pennsylvania and Arizona have no such schedule, and fees there are set as 'reasonable' or by agreement."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function calFee(v) { var b = [[100000, .04], [100000, .03], [800000, .02], [9000000, .01], [15000000, .005]], f = 0, left = v; b.forEach(function (x) { var t = Math.min(left, x[0]); if (t > 0) { f += t * x[1]; left -= t; } }); return f; }
    function run() {
      var st = self(el, "st").value, prob = 0, non = 0, probReal = 0, probPers = 0, data = [];
      ROWS.forEach(function (r) {
        var v = num(el, "v" + r[0]), t = self(el, "t" + r[0]).value, inP = t === "sole" || t === "estate";
        if (inP) { prob += v; if (r[4]) probReal += v; else probPers += v; } else non += v;
        data.push({ label: { h: "House", i: "IRA", cd: "CDs", ck: "Checking", car: "Car" }[r[0]], tip: r[1] + (inP ? " (probate)" : " (outside probate)"), y: v, color: inP ? "var(--s5)" : "var(--s2)" });
      });
      var tot = prob + non, route;
      if (prob === 0) route = "Nothing to probate";
      else if (st === "pa") route = probReal > 0 ? "Probate needed for real estate" : (probPers <= 50000 ? "Small-estate petition possible" : "Full probate");
      else route = (probPers <= 200000 && probReal <= 300000) ? "Affidavit route possible" : "Probate needed";
      self(el, "k").innerHTML = kpi("Through probate", $0(prob), prob ? "bad" : "good") + kpi("Outside probate", $0(non), "good") + kpi("Share through probate", pct(tot ? prob / tot * 100 : 0, 0)) +
        kpi("Simplified route?", esc(route)) + kpi("California statutory fees, for comparison", $0(2 * calFee(prob)));
      INV.barChart(self(el, "c"), { label: "Assets by path", height: 220, allLabels: true, valueLabels: true, yFmt: ms, tipFmt: function (v) { return $0(v); }, data: data });
      self(el, "n").innerHTML = "Red bars pass under the will (or intestacy) through the court; green bars pass directly by contract or title. " +
        (st === "pa" ? "Pennsylvania's small-estate petition (20 Pa.C.S. 3102) covers personal property up to $50,000 and excludes real estate, so a house in one person's name still needs a grant of letters." :
          "Arizona allows collection by affidavit when personal property is $200,000 or less (after 30 days) and real property equity is $300,000 or less (after six months) (A.R.S. 14-3971).") +
        " If this estate were probated in California, the statutory fee schedule would allow the personal representative and the attorney " + $0(calFee(prob)) + " each for ordinary services.";
    }
    wire(el, run);
  };

  /* ---------- 5. Is a living trust worth it? (INV-087) ---------- */
  TOOLS.s12aTrustWorth = function (el) {
    var u = uid(el);
    var WHY = [["oos", "I own real estate in another state (a second probate there)", 3], ["inc", "I want someone to manage money smoothly if I become incapacitated", 2], ["priv", "I value privacy (a probated will is a public record)", 1],
      ["kids", "Heirs are minors, have special needs, or should not get money outright", 3], ["blend", "Blended family or likely disputes", 2]];
    shell(el, "Is a revocable living trust worth it for you?", "Decision aid",
      numf(u + "-p", "Probate cost you would avoid, from local quotes ($)", 12000, 500) +
      numf(u + "-t", "Trust package quote: trust, pour-over will, funding ($)", 3500, 250) +
      numf(u + "-w", "Will-based plan quote ($)", 1200, 100) +
      numf(u + "-f", "Your own time and cost to retitle assets ($)", 300, 50) +
      WHY.map(function (w) { return chk(u + "-" + w[0], w[1], w[0] === "inc"); }).join("") +
      note("Enter real quotes: attorney fees and probate costs vary widely by state and by estate. The defaults are placeholders for illustration only, not typical prices."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var P = num(el, "p"), Tt = num(el, "t"), W = num(el, "w"), F = num(el, "f");
      var extra = Tt + F - W, net = P - extra, score = 0;
      WHY.forEach(function (w) { if (self(el, w[0]).checked) score += w[2]; });
      var verdict = net > 0 && score >= 2 ? "Likely worth it" : net > 0 || score >= 4 ? "Worth a close look" : "A will may be enough";
      self(el, "k").innerHTML = kpi("Extra upfront cost of a trust", $0(Math.max(0, extra))) + kpi("Probate cost avoided", $0(P), "good") + kpi("Net dollars", (net >= 0 ? "" : "−") + $0(Math.abs(net)), net >= 0 ? "good" : "bad") +
        kpi("Non-dollar reasons (score)", score + " of 11") + kpi("Rough verdict", verdict);
      INV.barChart(self(el, "c"), { label: "Costs compared", height: 210, allLabels: true, valueLabels: true, yFmt: ms, tipFmt: function (v) { return $0(v); },
        data: [{ label: "Will-based plan", y: W, color: "var(--s6)" }, { label: "Probate later", y: P, color: "var(--s5)" }, { label: "Will + probate", y: W + P, color: "var(--s5)" }, { label: "Trust plan", y: Tt + F, color: "var(--s2)" }] });
      self(el, "n").innerHTML = "A revocable trust avoids probate only for assets actually retitled into it. It does <b>not</b> reduce estate tax or protect assets from your own creditors while you live (in Pennsylvania, 20 Pa.C.S. 7745). Its strongest cases are the non-dollar ones: another state's real estate, incapacity planning, and heirs who need money managed for them.";
    }
    wire(el, run);
  };

  /* ---------- 6. Bypass trust vs portability (INV-087 / INV-088) ---------- */
  TOOLS.s12aBypass = function (el) {
    var u = uid(el);
    shell(el, "Credit shelter trust or portability?", "Model",
      rng(u + "-a", "Couple's assets at the first death", 4, 60, 1, 30, "mm") +
      rng(u + "-s", "Share owned by the first spouse to die", 10, 90, 5, 50, "pct") +
      rng(u + "-g", "Growth of the assets per year", 0, 10, 0.5, 5, "pct") +
      rng(u + "-yrs", "Years between the two deaths", 1, 30, 1, 15, "yr") +
      rng(u + "-i", "Inflation adjustment of the exclusion per year", 0, 4, 0.25, 2.5, "pct") +
      rng(u + "-cg", "Tax heirs pay on gains when they sell (lost step-up)", 0, 30, 0.2, 23.8, "pct") +
      note("First death in 2026, with a $15,000,000 basic exclusion; the statute indexes it for inflation from 2027. Portability: everything passes to the spouse, and the unused $15,000,000 (the DSUE amount) is fixed at the first death. Bypass: the first spouse's share, up to the exclusion, funds a credit shelter trust that is not taxed at the second death, and its assets get no new basis then. No spending, gifts or state tax; the 40% top rate applies above $1,000,000 of taxable estate."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var A = Number(self(el, "a").value) * 1e6, s = Number(self(el, "s").value) / 100, g = Number(self(el, "g").value) / 100, n = Number(self(el, "yrs").value),
        inf = Number(self(el, "i").value) / 100, cg = Number(self(el, "cg").value) / 100;
      var grow = Math.pow(1 + g, n), bea2 = BEA2026 * Math.pow(1 + inf, n);
      var taxP = transferTax(A * grow, bea2 + BEA2026);
      var trust0 = Math.min(A * s, BEA2026), dsueB = BEA2026 - trust0;
      var taxB = transferTax((A - trust0) * grow, bea2 + dsueB);
      var lost = trust0 * (grow - 1) * cg, adv = taxP - (taxB + lost);
      self(el, "k").innerHTML = kpi("Estate tax, portability only", $0(taxP), taxP ? "bad" : "good") + kpi("Estate tax, with bypass trust", $0(taxB), taxB ? "bad" : "good") +
        kpi("Tax on lost step-up in the trust", $0(lost), lost ? "bad" : "") + kpi("Bypass advantage", (adv >= 0 ? "" : "−") + $0(Math.abs(adv)), adv >= 0 ? "good" : "bad");
      var pts = [], ptsB = [];
      for (var k = 1; k <= 30; k++) {
        var gk = Math.pow(1 + g, k), bk = BEA2026 * Math.pow(1 + inf, k);
        pts.push([k, transferTax(A * gk, bk + BEA2026)]); ptsB.push([k, transferTax((A - trust0) * gk, bk + dsueB) + trust0 * (gk - 1) * cg]);
      }
      INV.lineChart(self(el, "c"), { label: "Total tax cost by years between deaths", height: 240, xTitle: "Years between the two deaths", yFmt: ms, xFmt: function (v) { return String(Math.round(v)); },
        series: [{ name: "Portability only (estate tax)", color: "var(--s5)", data: pts }, { name: "Bypass trust (estate tax + lost step-up)", color: "var(--s2)", data: ptsB }], marks: [{ x: n, label: n + " yrs" }] });
      self(el, "n").innerHTML = "The trust shelters growth: " + ms(trust0) + " placed in it becomes " + ms(trust0 * grow) + " outside the survivor's estate. Portability shelters a fixed " + ms(BEA2026) + " but keeps a new cost basis on everything at the second death. " +
        (adv >= 0 ? "Here the bypass trust comes out ahead by about " + ms(adv) + "." : "Here portability comes out ahead by about " + ms(-adv) + ", mostly because the trust's assets lose their step-up.") + " Illustrative only; state estate taxes, spending and investment choices can change the answer.";
    }
    wire(el, run);
  };

  /* ---------- 7. Federal estate tax estimator (INV-088) ---------- */
  TOOLS.s12aEstateTax = function (el) {
    var u = uid(el);
    shell(el, "Federal estate tax estimator, 2026", "Calculator",
      numf(u + "-g", "Gross estate: everything owned, including life insurance you own and retirement accounts ($)", 20000000, 100000) +
      numf(u + "-d", "Debts, funeral and administration expenses ($)", 300000, 10000) +
      numf(u + "-m", "Left to a US-citizen spouse (marital deduction) ($)", 0, 100000) +
      numf(u + "-ch", "Left to charity (charitable deduction) ($)", 0, 50000) +
      numf(u + "-at", "Adjusted taxable gifts: lifetime gifts above the annual exclusions ($)", 0, 50000) +
      numf(u + "-ds", "DSUE amount received from a deceased spouse ($)", 0, 100000) +
      note("For deaths in 2026: basic exclusion amount $15,000,000 (IRS, Rev. Proc. 2025-32). Tax = tentative tax on (taxable estate + adjusted taxable gifts) under 26 U.S.C. 2001(c), minus the unified credit on the applicable exclusion amount. Assumes no gift tax was paid during life and ignores state taxes and credits such as foreign death taxes."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function calc(G, D, M, C, AT, DS) {
      var tax = Math.max(0, G - D - M - C), base = tax + AT, aea = BEA2026 + DS, tent = tentTax(base), cr = Math.min(tent, tentTax(aea));
      return { taxable: tax, base: base, aea: aea, tent: tent, credit: cr, due: Math.max(0, tent - cr) };
    }
    function run() {
      var G = num(el, "g"), D = num(el, "d"), M = num(el, "m"), C = num(el, "ch"), AT = num(el, "at"), DS = Math.min(num(el, "ds"), BEA2026);
      var r = calc(G, D, M, C, AT, DS), must = G + AT > BEA2026;
      self(el, "k").innerHTML = kpi("Taxable estate", $0(r.taxable)) + kpi("Tentative tax", $0(r.tent)) + kpi("Unified credit used", $0(r.credit)) +
        kpi("Estate tax due", $0(r.due), r.due ? "bad" : "good") + kpi("Share of gross estate", pct(G ? r.due / G * 100 : 0, 1)) + kpi("Form 706 required?", must ? "Yes" : "Only to elect portability");
      var pts = [], pts0 = [];
      for (var x = 0; x <= 50; x += 1) { var gx = x * 1e6; pts.push([x, calc(gx, D, M, C, AT, DS).due]); pts0.push([x, calc(gx, D, M, C, AT, 0).due]); }
      var ser = [{ name: "Your deductions and DSUE", color: "var(--s1)", data: pts }];
      if (DS > 0) ser.push({ name: "Same, without DSUE", color: "var(--s5)", data: pts0, dash: "5 4" });
      INV.lineChart(self(el, "c"), { label: "Estate tax by size of gross estate", height: 240, xTitle: "Gross estate ($ millions)", yFmt: ms, xFmt: function (v) { return "$" + Math.round(v) + "M"; }, series: ser,
        dots: G <= 50e6 ? [{ x: G / 1e6, y: r.due, color: "var(--s1)" }] : [] });
      self(el, "n").innerHTML = "Applicable exclusion: " + $0(r.aea) + " (" + $0(BEA2026) + " basic" + (DS ? " + " + $0(DS) + " DSUE" : "") + "). " +
        (r.due ? "Above the exclusion, each extra dollar is taxed at 40%: " + $0(r.base - r.aea) + " × 40% = " + $0((r.base - r.aea) * 0.4) + "." : "The credit covers the whole tentative tax, so no federal estate tax is due.") +
        " The executor files Form 706 within nine months of death (a six-month extension is available).";
    }
    wire(el, run);
  };

  /* ---------- 8. Gifting planner (INV-088) ---------- */
  TOOLS.s12aGifts = function (el) {
    var u = uid(el);
    shell(el, "Annual exclusion gifting planner", "Calculator",
      rng(u + "-r", "Number of people you give to each year", 1, 10, 1, 3, "n") +
      numf(u + "-g", "Gift to each person each year ($)", 25000, 1000) +
      sel(u + "-s", "Married and electing gift splitting?", [["no", "No: one donor"], ["yes", "Yes: two donors, split"]], "no") +
      rng(u + "-y", "Years of giving", 1, 20, 1, 10, "yr") +
      note("For 2026 the annual exclusion is $19,000 per recipient per donor (IRS). It is indexed for inflation, so this planner's use of $19,000 every year is conservative. Tuition paid directly to a school and medical bills paid directly to a provider are excluded without limit; gifts to a US-citizen spouse are not taxable."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var R = Number(self(el, "r").value), gft = num(el, "g"), split = self(el, "s").value === "yes", Y = Number(self(el, "y").value);
      var donors = split ? 2 : 1, exc = AGE2026 * donors, perYrEx = Math.min(gft, exc) * R, perYrTx = Math.max(0, gft - exc) * R;
      var given = gft * R * Y, excluded = perYrEx * Y, taxable = perYrTx * Y, perDonor = taxable / donors;
      var gtax = donors * transferTax(perDonor, BEA2026), left = Math.max(0, BEA2026 - perDonor);
      var need709 = perYrTx > 0 || split;
      self(el, "k").innerHTML = kpi("Total given", $0(given)) + kpi("Covered by annual exclusions", $0(excluded), "good") + kpi("Taxable gifts (use exemption)", $0(taxable), taxable ? "bad" : "") +
        kpi("Gift tax owed", $0(gtax), gtax ? "bad" : "good") + kpi("Exemption left per donor", $0(left)) + kpi("Form 709 each year?", need709 ? "Yes" : "No");
      var p1 = [[0, 0]], p2 = [[0, 0]];
      for (var y = 1; y <= Y; y++) { p1.push([y, gft * R * y]); p2.push([y, perYrTx * y]); }
      INV.lineChart(self(el, "c"), { label: "Cumulative gifts", height: 230, xTitle: "Year", yFmt: ms, xFmt: function (v) { return String(Math.round(v)); },
        series: [{ name: "Total given", color: "var(--s2)", data: p1 }, { name: "Taxable gifts reported on Form 709", color: "var(--s5)", data: p2 }] });
      self(el, "n").innerHTML = (perYrTx > 0 ? "Each year " + $0(perYrTx) + " is above the exclusion. That is not a tax bill: it is reported on Form 709 by April 15 of the next year and reduces the donor's " + $0(BEA2026) + " lifetime exemption. " :
        "Every gift fits within the annual exclusion" + (split ? ", but electing gift splitting still requires Form 709. " : ", so no gift tax return is needed. ")) +
        "Gifts of appreciated assets carry the donor's cost basis; assets held until death usually get a step-up (INV-090).";
    }
    wire(el, run);
  };

  /* ---------- 9. Pennsylvania inheritance tax (INV-089) ---------- */
  TOOLS.s12aPAInh = function (el) {
    var u = uid(el);
    shell(el, "Pennsylvania inheritance tax calculator", "Calculator",
      numf(u + "-sp", "To a surviving spouse (0%) ($)", 0, 1000) +
      numf(u + "-li", "To children, grandchildren, parents and other lineal heirs (4.5%) ($)", 1220000, 1000) +
      numf(u + "-si", "To brothers and sisters (12%) ($)", 0, 1000) +
      numf(u + "-ot", "To anyone else: nieces, nephews, friends (15%) ($)", 0, 1000) +
      numf(u + "-ch", "To charity (exempt) ($)", 0, 1000) +
      numf(u + "-de", "Debts, funeral and administration costs ($)", 30000, 500) +
      sel(u + "-e", "Tax paid within three months of death?", [["yes", "Yes: 5% discount"], ["no", "No: due within nine months"]], "yes") +
      note("Rates from the PA Department of Revenue. Also 0%: transfers to or for a child aged 21 or younger from a parent. Life insurance proceeds are exempt. A traditional IRA is taxable if the owner could withdraw without penalty (for example, after age 59½). Deductions are spread across the taxable shares in proportion to their size; in a real estate they usually come out of the residue."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var sp = num(el, "sp"), li = num(el, "li"), si = num(el, "si"), ot = num(el, "ot"), ch = num(el, "ch"), de = num(el, "de"), early = self(el, "e").value === "yes";
      var taxable = li + si + ot, f = taxable ? Math.max(0, 1 - de / taxable) : 0;
      var tl = li * f * 0.045, ts = si * f * 0.12, to = ot * f * 0.15, tax = tl + ts + to, disc = early ? tax * 0.05 : 0, due = tax - disc, total = sp + li + si + ot + ch;
      self(el, "k").innerHTML = kpi("Taxable after deductions", $0(taxable * f)) + kpi("Tax before discount", $0(tax)) + kpi("Early-payment discount", $0(disc), disc ? "good" : "") +
        kpi("Tax due", $0(due), due ? "bad" : "good") + kpi("Share of everything transferred", pct(total ? due / total * 100 : 0, 2));
      INV.barChart(self(el, "c"), { label: "Tax by class of heir", height: 210, allLabels: true, valueLabels: true, yFmt: ms, tipFmt: function (v) { return $0(v); },
        data: [{ label: "Spouse 0%", y: 0, color: "var(--s1)" }, { label: "Lineal 4.5%", y: tl, color: "var(--s2)" }, { label: "Siblings 12%", y: ts, color: "var(--s3)" }, { label: "Others 15%", y: to, color: "var(--s5)" }, { label: "Charity 0%", y: 0, color: "var(--s6)" }] });
      self(el, "n").innerHTML = "The same " + ms(taxable * f) + " would cost " + $0(taxable * f * 0.045) + " if all of it went to lineal heirs, " + $0(taxable * f * 0.12) + " if it went to siblings and " + $0(taxable * f * 0.15) +
        " if it went to anyone else. The return (REV-1500) is filed with the Register of Wills in the county where the decedent lived; tax becomes delinquent nine months after death.";
    }
    wire(el, run);
  };

  /* ---------- 10. State death-tax check (INV-089) ---------- */
  var STATES = [
    ["CT", "Connecticut", 15000000, "12%", "e"], ["HI", "Hawaii", 5490000, "10%–20%", "e"], ["IL", "Illinois", 4000000, "0.8%–16%", "e"], ["ME", "Maine", 7000000, "8%–12%", "e"],
    ["MD", "Maryland (also inheritance tax)", 5000000, "0.8%–16%", "b"], ["MA", "Massachusetts", 2000000, "0.8%–16%", "e"], ["MN", "Minnesota", 3000000, "13%–16%", "e"],
    ["NY", "New York (cliff at 105%)", 7350000, "3.06%–16%", "e"], ["OR", "Oregon", 1000000, "10%–16%", "e"], ["RI", "Rhode Island", 1838056, "0.8%–16%", "e"],
    ["VT", "Vermont", 5000000, "16%", "e"], ["WA", "Washington (deaths from July 1, 2026)", 3000000, "10%–20%", "e"], ["DC", "District of Columbia", 4988400, "11.2%–16%", "e"],
    ["PA", "Pennsylvania (inheritance tax)", 0, "0%–15% by heir", "i"], ["NJ", "New Jersey (inheritance tax)", 0, "0%–16% by heir", "i"], ["KY", "Kentucky (inheritance tax)", 0, "0%–16% by heir", "i"], ["NE", "Nebraska (inheritance tax)", 0, "1%–15% by heir", "i"],
    ["AZ", "Arizona, Colorado, North Carolina, Ohio and other states with neither tax", -1, "None", "n"]];
  TOOLS.s12aStateCheck = function (el) {
    var u = uid(el);
    shell(el, "Does a state death tax apply?", "Lookup, 2026",
      sel(u + "-s", "State of residence (or where real estate is located)", STATES.map(function (s) { return [s[0], s[1]]; }), "MA") +
      numf(u + "-v", "Taxable estate ($)", 3000000, 50000) +
      note("Exemptions and rates as of January 1, 2026, from the Tax Foundation's Facts & Figures 2026 (compiled from state statutes and Bloomberg Tax); New York checked against its Department of Taxation and Finance. Washington is shown for deaths on or after July 1, 2026, from its Department of Revenue tables: for deaths from July 1, 2025 through June 30, 2026 its top rate was 35%, and its exclusion was $3,076,000 for deaths from January 1 to June 30, 2026. Rules change often: confirm with the state before relying on a number."),
      '<div class="kpis" id="' + u + '-k"></div><div id="' + u + '-c"></div><p class="tool-note" id="' + u + '-n"></p>');
    function run() {
      var code = self(el, "s").value, v = num(el, "v"), s = STATES.filter(function (x) { return x[0] === code; })[0];
      var kind = s[4], ex = s[2], over = kind === "e" || kind === "b" ? Math.max(0, v - ex) : 0, msg;
      if (kind === "n") msg = "No state estate or inheritance tax. Only the federal estate tax can apply, and only above " + $0(BEA2026) + " in 2026.";
      else if (kind === "i") msg = "An inheritance tax: the exemption and rate depend on who inherits, not on the size of the estate. Spouses are exempt in every inheritance-tax state; in Pennsylvania, adult children pay 4.5% from the first dollar, and in Nebraska close relatives pay 1% on amounts above $100,000.";
      else if (code === "NY") { var cliff = ex * 1.05, fr = v <= ex ? 1 : v >= cliff ? 0 : 1 - (v - ex) / (ex * 0.05); msg = "New York phases out its credit between " + $0(ex) + " and " + $0(cliff) + " (105%). At " + $0(v) + ", " + pct(fr * 100, 0) + " of the exclusion still applies" + (fr === 0 ? ": the whole estate is taxed, not just the excess." : "."); }
      else msg = v > ex ? "The estate is above this state's exemption, so a state estate tax return and tax are likely. State tax is due even when no federal tax is." : "The estate is under this state's exemption.";
      if (code === "WA") msg += " Washington's rules depend on the date of death: for deaths from July 1, 2025 through June 30, 2026 the rates ran from 10% to 35%, with a $3,076,000 exclusion for deaths in the first half of 2026.";
      if (kind === "b") msg += " Maryland also levies a 10% inheritance tax on transfers to heirs other than spouses, parents, grandparents, children and other descendants, their spouses, and brothers and sisters (Md. Code, Tax–General § 7-203).";
      self(el, "k").innerHTML = kpi("Estate-tax exemption", kind === "e" || kind === "b" ? $0(ex) : kind === "i" ? "Depends on heir" : "No tax") + kpi("Amount above exemption", kind === "e" || kind === "b" ? $0(over) : "Not applicable", over ? "bad" : "good") + kpi("Rate range", esc(s[3]));
      var d = STATES.filter(function (x) { return x[4] === "e" || x[4] === "b"; }).map(function (x) { return { label: x[0], tip: x[1], y: x[2], color: x[0] === code ? "var(--s1)" : "var(--s6)" }; });
      INV.barChart(self(el, "c"), { label: "State estate-tax exemptions, 2026", height: 220, allLabels: true, yFmt: ms, tipFmt: function (v2) { return $0(v2); }, data: d });
      self(el, "n").innerHTML = msg;
    }
    wire(el, run);
  };
})();
