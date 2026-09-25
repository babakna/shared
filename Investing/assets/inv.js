/* Investing Learning Lab - shared engine - V1.0 (September 2026) */
(function () {
  "use strict";
  var VERSION = "V1.0 (September 2026)";
  var AUTHOR = "Namiranian, Babak";
  var root = document.documentElement;

  /* ---------- Course registry (flat numbering, grouped by stage) ---------- */
  var STAGES = [
    { n: 1, name: "Foundations", blurb: "How money grows, what risk really is, and what investing costs." },
    { n: 2, name: "Asset Classes & Vehicles", blurb: "Cash, bonds, stocks, funds, gold, alternatives, crypto, options and annuities." },
    { n: 3, name: "Your Financial Base", blurb: "Cash flow, emergency fund, debt, credit, employer benefits and insurance." },
    { n: 4, name: "Planning & You", blurb: "Goals, risk tolerance vs capacity, life stages, families, and your written plan." },
    { n: 5, name: "Taxes", blurb: "How tax works, every account type, and the strategies that keep more of your return." },
    { n: 6, name: "Approaches & Philosophies", blurb: "The evidence on markets, and the major schools of investing." },
    { n: 7, name: "Portfolio Construction & Monitoring", blurb: "Build it, rebalance it, measure it, review it." },
    { n: 8, name: "Behavioral Finance", blurb: "The biases, bear markets and scams that cost investors the most." },
    { n: 9, name: "Real Estate", blurb: "Your home, rentals, real estate tax rules, REITs, and securities vs property." },
    { n: 10, name: "Financial Independence", blurb: "The math of FI, FIRE variants, and reaching your money before 59½." },
    { n: 11, name: "Retirement", blurb: "How much you need, withdrawals, Social Security, Medicare, RMDs and annuities." },
    { n: 12, name: "Estate Planning & Wealth Transfer", blurb: "Documents, beneficiaries, trusts, estate and gift tax, and inherited assets." },
    { n: 13, name: "Life Events", blurb: "Marriage, divorce, children, aging parents, windfalls, job loss and more." },
    { n: 14, name: "Getting Help", blurb: "Choosing an advisor and the platforms you use." },
    { n: 15, name: "Capstone", blurb: "Five households, five complete plans." }
  ];
  var T = [
    [1, "Why Invest at All?"], [1, "Compounding and the Time Value of Money"], [1, "Risk and Return"],
    [1, "Diversification and Correlation"], [1, "How Markets and Brokers Work"],
    [1, "Reading a Company: Statements and Valuation"], [1, "The Cost of Investing"],
    [2, "Cash and Cash Equivalents"], [2, "How Bonds Work"], [2, "Bond Types and Bond Funds"], [2, "Stocks"],
    [2, "Mutual Funds, Index Funds and ETFs"], [2, "Commodities and Gold"], [2, "Alternatives and Private Markets"],
    [2, "Crypto Assets"], [2, "Options and Derivatives Basics"], [2, "Annuities and Insurance Products"],
    [3, "Cash Flow and Savings Rate"], [3, "The Emergency Fund"], [3, "Debt vs Investing"], [3, "Credit"],
    [3, "Employer Benefits"], [3, "Insurance and Protection"],
    [4, "Goals and Time Horizons"], [4, "Risk Tolerance, Capacity and Need"], [4, "Planning by Life Stage"],
    [4, "Couples and Families"], [4, "Your Investment Policy Statement"],
    [5, "How US Income Tax Works"], [5, "How Investment Income Is Taxed"], [5, "Workplace Retirement Plans"],
    [5, "IRAs and Roth IRAs"], [5, "Health Savings Accounts"], [5, "529s and Education Accounts"],
    [5, "Taxable Accounts and Cost Basis"], [5, "Asset Location"], [5, "Tax-Loss and Tax-Gain Harvesting"],
    [5, "Roth Conversions"], [5, "Charitable Giving Strategies"], [5, "Equity Compensation"], [5, "State Taxes"],
    [5, "Tax-Aware Withdrawals"],
    [6, "Market Efficiency and the Evidence"], [6, "Index Investing and the Bogleheads"], [6, "Active Management"],
    [6, "Value, Growth and Quality"], [6, "Dividend and Income Investing"], [6, "Factor Investing"],
    [6, "Asset Allocation Models"], [6, "Target-Date Funds and Glide Paths"], [6, "Lump Sum vs Dollar-Cost Averaging"],
    [6, "Market Timing and Tactical Allocation"], [6, "ESG and Values-Based Investing"],
    [6, "International Investing and Currency"],
    [7, "Building a Portfolio"], [7, "Rebalancing"], [7, "Measuring Performance"],
    [7, "Reviewing and Adjusting Your Plan"], [7, "Record Keeping and Consolidation"],
    [8, "Biases That Cost Money"], [8, "The Behavior Gap and Bear Markets"], [8, "Scams, Fraud and Hype"],
    [9, "Rent vs Buy"], [9, "Mortgages"], [9, "Analyzing a Rental Property"], [9, "Financing and Leverage for Investors"],
    [9, "Running a Rental"], [9, "Real Estate Taxes"], [9, "REITs, Syndications and Crowdfunding"],
    [9, "Short-Term Rentals, House Hacking and BRRRR"], [9, "Securities vs Real Estate"],
    [10, "The Math of Financial Independence"], [10, "FIRE Variants"], [10, "Accessing Money Before 59½"],
    [11, "How Much You Need"], [11, "Withdrawal Strategies"], [11, "Sequence Risk and Monte Carlo"],
    [11, "Social Security"], [11, "Medicare and Retiree Health Care"], [11, "Pensions: Lump Sum vs Annuity"],
    [11, "RMDs and Retirement Taxes"], [11, "Annuities for Retirement Income"], [11, "Long-Term Care"],
    [12, "Core Estate Documents"], [12, "Beneficiaries and Titling"], [12, "Probate"], [12, "Trusts"],
    [12, "Federal Estate and Gift Tax"], [12, "State Estate and Inheritance Taxes"],
    [12, "Step-Up in Basis and Inherited Assets"], [12, "Inherited IRAs and the 10-Year Rule"],
    [12, "Gifting and Family Wealth Transfer"], [12, "Charitable Legacy"], [12, "Business Succession"],
    [13, "Marriage and Divorce"], [13, "Children and Education"], [13, "Caring for Aging Parents"],
    [13, "Widowhood and Survivor Planning"], [13, "Windfalls and Inheritance"], [13, "Job Loss and Career Change"],
    [13, "Self-Employment"], [13, "Special-Needs Planning"],
    [14, "Choosing a Financial Advisor"], [14, "Platforms, Brokerages and DIY Tools"],
    [15, "Five Households, Five Plans"]
  ];
  var LIVE = { "INV-001": 1, "INV-002": 1, "INV-003": 1, "INV-004": 1, "INV-005": 1, "INV-006": 1, "INV-007": 1 };
  var COURSE = T.map(function (t, i) {
    var id = "INV-" + String(i + 1).padStart(3, "0");
    return { id: id, n: i + 1, stage: t[0], title: t[1], live: !!LIVE[id] };
  });

  /* ---------- The five recurring households ---------- */
  var HOUSEHOLDS = {
    maya: { name: "Maya Brooks", short: "Maya", age: "24", color: "var(--s1)", init: "MB",
      line: "Single, first full-time job at $62,000. $28,000 of student loans at 6.8%, $3,000 in savings, renting.",
      stage: "Starting out" },
    rivera: { name: "Marcus & Elena Rivera", short: "The Riveras", age: "35 & 34", color: "var(--s2)", init: "R",
      line: "Married, two children (4 and 7). $145,000 household income, $310,000 mortgage at 3.1%, $62,000 in 401(k)s.",
      stage: "Building a family" },
    jordan: { name: "Jordan Ellis", short: "Jordan", age: "45", color: "var(--s3)", init: "JE",
      line: "Single parent of a 15-year-old. $88,000 income, $140,000 saved for retirement, renting, no college fund yet.",
      stage: "Mid-career, one income" },
    harper: { name: "Tom & Rachel Harper", short: "The Harpers", age: "57 & 55", color: "var(--s4)", init: "H",
      line: "$260,000 income, $1.1M saved (mostly pre-tax 401(k)), home worth $650,000 with $90,000 left on the mortgage.",
      stage: "Pre-retirement" },
    ruth: { name: "Ruth Kowalski", short: "Ruth", age: "68", color: "var(--s5)", init: "RK",
      line: "Widowed and retired. $780,000 in an IRA, Social Security of $2,900 a month, paid-off house, $60,000 in cash.",
      stage: "In retirement" }
  };

  /* ---------- Helpers ---------- */
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function money(v, dp) {
    if (!isFinite(v)) return "—";
    var neg = v < 0; v = Math.abs(v);
    var s;
    if (dp == null) dp = v >= 100 ? 0 : 2;
    s = v.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
    return (neg ? "−$" : "$") + s;
  }
  function moneyShort(v) {
    if (!isFinite(v)) return "—";
    var a = Math.abs(v), sgn = v < 0 ? "−" : "";
    if (a >= 1e9) return sgn + "$" + (a / 1e9).toFixed(a >= 1e10 ? 0 : 1) + "B";
    if (a >= 1e6) return sgn + "$" + (a / 1e6).toFixed(a >= 1e7 ? 1 : 2) + "M";
    if (a >= 1e4) return sgn + "$" + Math.round(a / 1e3) + "k";
    if (a >= 1e3) return sgn + "$" + (a / 1e3).toFixed(1) + "k";
    return sgn + "$" + Math.round(a);
  }
  function pct(v, dp) { if (!isFinite(v)) return "—"; return (v < 0 ? "−" : "") + Math.abs(v).toFixed(dp == null ? 1 : dp) + "%"; }
  function store(key, val) { try { if (val === undefined) return JSON.parse(localStorage.getItem(key) || "null"); localStorage.setItem(key, JSON.stringify(val)); } catch (e) { return null; } }

  var INV = window.INV = { version: VERSION, author: AUTHOR, course: COURSE, stages: STAGES, households: HOUSEHOLDS,
    esc: esc, money: money, moneyShort: moneyShort, pct: pct, store: store };
  /* Hook for page-specific scripts */
  INV.ready = function (fn) { if (document.readyState !== "loading") fn(); else document.addEventListener("DOMContentLoaded", fn); };

  /* ---------- Journey bar ---------- */
  var currentId = document.body.getAttribute("data-module") || "";
  var idx = COURSE.findIndex(function (m) { return m.id === currentId; });
  function prevLive(i) { for (var k = i - 1; k >= 0; k--) if (COURSE[k].live) return COURSE[k]; return null; }
  function nextLive(i) { for (var k = i + 1; k < COURSE.length; k++) if (COURSE[k].live) return COURSE[k]; return null; }
  if (idx > -1) {
    var top = document.querySelector(".top");
    var m = COURSE[idx], pv = prevLive(idx), nx = nextLive(idx);
    var opts = COURSE.filter(function (c) { return c.live; }).map(function (c) {
      return '<option value="' + c.id + '.html"' + (c.id === currentId ? " selected" : "") + ">" + c.id + " — " + esc(c.title) + "</option>";
    }).join("");
    if (top) {
      var j = document.createElement("nav");
      j.className = "journey"; j.setAttribute("aria-label", "Course journey");
      j.innerHTML = '<div class="journey-in"><div class="journey-status"><span>Stage ' + m.stage + " · " + esc(STAGES[m.stage - 1].name) +
        "</span><strong>Module " + m.n + " of " + COURSE.length + '</strong></div><div class="journey-track" aria-hidden="true"><span style="width:' +
        (m.n / COURSE.length * 100).toFixed(1) + '%"></span></div><div class="journey-controls">' +
        (pv ? '<a class="btn small" href="' + pv.id + '.html">← ' + pv.id + "</a>" : '<a class="btn small" href="index.html">Course home</a>') +
        '<label class="sr-only" for="jsel">Jump to a module</label><select id="jsel">' + opts + "</select>" +
        (nx ? '<a class="btn small primary" href="' + nx.id + '.html">' + nx.id + " →</a>" : '<a class="btn small primary" href="index.html">Course home</a>') +
        "</div></div>";
      top.appendChild(j);
      j.querySelector("select").addEventListener("change", function () { location.href = this.value; });
    }
  }

  /* ---------- Theme (light default) ---------- */
  function setTheme(t) {
    root.dataset.theme = t; store("inv-theme", t);
    document.querySelectorAll("[data-theme-btn]").forEach(function (b) { b.textContent = t === "dark" ? "Light" : "Dark"; b.setAttribute("aria-pressed", t === "dark" ? "true" : "false"); });
    document.dispatchEvent(new CustomEvent("inv-theme"));
  }
  setTheme(store("inv-theme") || "light");
  document.querySelectorAll("[data-theme-btn]").forEach(function (b) {
    b.addEventListener("click", function () { setTheme(root.dataset.theme === "dark" ? "light" : "dark"); });
  });

  /* ---------- Help modal (injected) ---------- */
  var helpHTML = '<div class="modal" id="helpModal" role="dialog" aria-modal="true" aria-labelledby="helpTitle"><div class="modal-card">' +
    '<h2 id="helpTitle">How this course works</h2><p>' + VERSION + ' · ' + AUTHOR + '</p>' +
    '<h3>Tabs, not a long scroll</h3><p>Each module is split into tabs. Use the tab bar, the Previous / Next buttons, or the left and right arrow keys (Home and End jump to the first and last tab). On a phone, the tab bar becomes a drop-down. Your place in each module is remembered.</p>' +
    '<h3>Three layers of depth</h3><ul><li><b>Start here</b> — the main text of every tab. No background needed.</li><li><b>Going further</b> — expandable panels for readers with some experience.</li><li><b>Practitioner depth</b> — the actual rules, formulas, edge cases and research.</li></ul>' +
    '<h3>Things to do, not just read</h3><ul><li><b>Calculators</b> run their formulas live in your browser.</li><li><b>What would you do?</b> — pick an option first, then see every option’s trade-offs.</li><li><b>Exercises</b> — type an answer and check it; a worked solution follows.</li><li><b>Myth or fact</b> — tap a card to test a popular claim.</li><li><b>Worksheets</b> save in your own browser and can be downloaded.</li><li><b>Dotted terms</b> open a glossary definition.</li></ul>' +
    '<h3>The five households</h3><p>Maya (24), the Riveras (35 and 34), Jordan (45), the Harpers (57 and 55) and Ruth (68) are fictional households who reappear in every module, so each idea is shown at different ages and stages of life.</p>' +
    '<h3>Progress and privacy</h3><p>Passing a module’s knowledge check (70% or better) marks it complete. Progress, worksheets and your theme are stored only in this browser (localStorage). Nothing is sent anywhere.</p>' +
    '<h3>Not advice</h3><p>This is educational material, not financial, tax, legal or investment advice. Tax figures and rules change; confirm current numbers with the IRS, SSA and other primary sources, or a qualified professional, before acting.</p>' +
    '<p style="margin-top:14px"><button class="btn primary" id="closeHelp">Close</button></p></div></div>';
  document.body.insertAdjacentHTML("beforeend", helpHTML);
  var help = document.getElementById("helpModal"), helpOpener = null;
  function showHelp(o) { helpOpener = o; help.classList.add("open"); document.getElementById("closeHelp").focus(); }
  function hideHelp() { help.classList.remove("open"); if (helpOpener) helpOpener.focus(); }
  document.querySelectorAll("[data-help-btn]").forEach(function (b) { b.addEventListener("click", function () { showHelp(b); }); });
  document.getElementById("closeHelp").addEventListener("click", hideHelp);
  help.addEventListener("click", function (e) { if (e.target === help) hideHelp(); });
  document.addEventListener("keydown", function (e) {
    if (!help.classList.contains("open")) return;
    if (e.key === "Escape") { e.preventDefault(); hideHelp(); }
    if (e.key === "Tab") { e.preventDefault(); document.getElementById("closeHelp").focus(); }
  });

  /* ---------- Progress store ---------- */
  function readProgress() { return store("inv-progress") || {}; }
  function markModule(id, score, total) {
    if (!id) return; var p = readProgress(); var best = (p[id] && p[id].score) || 0;
    p[id] = { done: true, score: Math.max(best, score), total: total, ts: Date.now() }; store("inv-progress", p);
  }
  INV.progress = { read: readProgress, write: function (p) { store("inv-progress", p); } };

  /* ---------- Tabs ---------- */
  var shell = document.querySelector(".tabs-shell");
  if (shell) {
    var panels = [].slice.call(shell.querySelectorAll(".panel"));
    var bar = document.createElement("div");
    bar.className = "tabbar"; bar.setAttribute("role", "tablist"); bar.setAttribute("aria-label", "Module sections");
    var selRow = document.createElement("div"); selRow.className = "tabsel-row";
    var selHTML = '<label class="sr-only" for="tabsel">Section</label><select id="tabsel">';
    panels.forEach(function (p, i) {
      var name = p.getAttribute("data-tab") || ("Part " + (i + 1));
      p.id = p.id || ("tab-" + (i + 1));
      p.setAttribute("role", "tabpanel"); p.setAttribute("aria-labelledby", "t-" + p.id); p.setAttribute("tabindex", "-1");
      var b = document.createElement("button");
      b.className = "tab"; b.type = "button"; b.id = "t-" + p.id; b.setAttribute("role", "tab"); b.setAttribute("aria-controls", p.id);
      b.innerHTML = '<span class="n">' + (i + 1) + "</span>" + esc(name);
      b.addEventListener("click", function () { show(i, true); });
      bar.appendChild(b);
      selHTML += '<option value="' + i + '">' + (i + 1) + ". " + esc(name) + "</option>";
    });
    selHTML += "</select>";
    selRow.innerHTML = selHTML;
    shell.insertBefore(selRow, shell.firstChild);
    shell.insertBefore(bar, shell.firstChild);
    var foot = document.createElement("div"); foot.className = "panel-foot";
    foot.innerHTML = '<button class="btn" data-prev type="button">← Previous</button><div style="display:flex;flex-direction:column;align-items:center;gap:6px"><span class="pos"></span><div class="dots" aria-hidden="true">' +
      panels.map(function () { return "<i></i>"; }).join("") + '</div></div><button class="btn primary" data-next type="button">Next →</button>';
    shell.appendChild(foot);
    var tabs = [].slice.call(bar.querySelectorAll(".tab")), dots = [].slice.call(foot.querySelectorAll(".dots i"));
    var sel = selRow.querySelector("select");
    var key = "inv-tab-" + (currentId || location.pathname);
    var seen = store(key + "-seen") || {};
    var cur = 0;
    function show(i, focusTab) {
      if (i < 0 || i >= panels.length) return;
      cur = i; seen[i] = 1; store(key + "-seen", seen); store(key, i);
      panels.forEach(function (p, k) { p.classList.toggle("active", k === i); p.hidden = k !== i; });
      tabs.forEach(function (t, k) {
        t.setAttribute("aria-selected", k === i ? "true" : "false"); t.tabIndex = k === i ? 0 : -1; t.classList.toggle("seen", !!seen[k]);
      });
      dots.forEach(function (d, k) { d.className = k === i ? "on" : (seen[k] ? "seen" : ""); });
      sel.value = String(i);
      foot.querySelector(".pos").textContent = "Tab " + (i + 1) + " of " + panels.length;
      var pb = foot.querySelector("[data-prev]"), nb = foot.querySelector("[data-next]");
      pb.disabled = i === 0;
      nb.disabled = false;
      if (i === panels.length - 1 && idx === -1) { nb.textContent = "Next →"; nb.disabled = true; delete nb.dataset.href; }
      else if (i === panels.length - 1) {
        var nxm = idx > -1 ? nextLive(idx) : null;
        nb.textContent = nxm ? "Next module: " + nxm.id + " →" : "Course home →";
        nb.dataset.href = nxm ? nxm.id + ".html" : "index.html";
      } else { nb.textContent = "Next →"; delete nb.dataset.href; }
      if (focusTab) { tabs[i].focus(); try { tabs[i].scrollIntoView({ block: "nearest", inline: "center" }); } catch (e) {} }
      try { history.replaceState(null, "", "#s" + (i + 1)); } catch (e) {}
      panels[i].dispatchEvent(new CustomEvent("inv-show", { bubbles: true }));
    }
    function goScroll(i) {
      show(i, false);
      var y = shell.getBoundingClientRect().top + window.scrollY - (document.querySelector(".top") ? document.querySelector(".top").offsetHeight + 8 : 8);
      if (window.scrollY > y) window.scrollTo({ top: y, behavior: "smooth" });
    }
    bar.addEventListener("keydown", function (e) {
      var k = e.key, n = null;
      if (k === "ArrowRight") n = (cur + 1) % panels.length;
      else if (k === "ArrowLeft") n = (cur - 1 + panels.length) % panels.length;
      else if (k === "Home") n = 0; else if (k === "End") n = panels.length - 1;
      if (n !== null) { e.preventDefault(); show(n, true); }
    });
    sel.addEventListener("change", function () { show(Number(sel.value), false); });
    foot.querySelector("[data-prev]").addEventListener("click", function () { goScroll(cur - 1); });
    foot.querySelector("[data-next]").addEventListener("click", function () {
      if (this.dataset.href) { location.href = this.dataset.href; return; } goScroll(cur + 1);
    });
    document.querySelectorAll("[data-goto-tab]").forEach(function (a) {
      a.addEventListener("click", function (e) { e.preventDefault(); goScroll(Number(a.getAttribute("data-goto-tab")) - 1); });
    });
    var start = 0, hm = /^#s(\d+)$/.exec(location.hash);
    if (hm && Number(hm[1]) >= 1 && Number(hm[1]) <= panels.length) start = Number(hm[1]) - 1;
    else if (store(key) != null) start = Math.min(store(key), panels.length - 1);
    show(start, false);
    INV.showTab = function (i) { goScroll(i); };
  }

  /* ---------- Households: cards and lens rows ---------- */
  function avatar(h, cls) { return '<span class="' + (cls || "av") + '" style="background:' + h.color + '">' + esc(h.init) + "</span>"; }
  document.querySelectorAll("[data-households]").forEach(function (el) {
    var keys = (el.getAttribute("data-households") || "maya,rivera,jordan,harper,ruth").split(",");
    el.classList.add("hh-grid");
    el.innerHTML = keys.map(function (k) {
      var h = HOUSEHOLDS[k.trim()]; if (!h) return "";
      return '<div class="hh">' + avatar(h) + '<div><div class="nm">' + esc(h.name) + ' <span class="chip gray">' + esc(h.age) + '</span></div><div class="ds">' + esc(h.line) + "</div></div></div>";
    }).join("");
  });
  document.querySelectorAll(".lens-row[data-hh]").forEach(function (row) {
    var h = HOUSEHOLDS[row.getAttribute("data-hh")]; if (!h) return;
    var who = document.createElement("div"); who.className = "who";
    who.innerHTML = avatar(h) + "<div><b>" + esc(h.name) + "</b><small>" + esc(h.age) + " · " + esc(h.stage) + "</small></div>";
    row.insertBefore(who, row.firstChild);
  });

  /* ---------- Decision cards ---------- */
  document.querySelectorAll(".decide").forEach(function (d) {
    var opts = [].slice.call(d.querySelectorAll(".opt"));
    var ocs = [].slice.call(d.querySelectorAll(".oc"));
    opts.forEach(function (o, i) {
      o.type = "button";
      o.addEventListener("click", function () {
        opts.forEach(function (x) { x.classList.remove("picked"); x.setAttribute("aria-pressed", "false"); });
        o.classList.add("picked"); o.setAttribute("aria-pressed", "true");
        ocs.forEach(function (c, k) { c.classList.toggle("mine", k === i); });
        d.classList.add("done");
        var out = d.querySelector(".outcomes"); if (out) out.setAttribute("aria-live", "polite");
      });
    });
  });

  /* ---------- Myth cards ---------- */
  document.querySelectorAll(".myth").forEach(function (c) {
    c.setAttribute("aria-expanded", "false");
    if (!c.querySelector(".hint")) c.insertAdjacentHTML("beforeend", '<div class="hint">Tap to test the claim</div>');
    c.addEventListener("click", function () {
      var o = c.classList.toggle("open"); c.setAttribute("aria-expanded", o ? "true" : "false");
      c.querySelector(".mt").textContent = o ? "What the evidence says" : "Myth or fact?";
    });
  });

  /* ---------- Numeric exercises ---------- */
  document.querySelectorAll(".ex[data-answer]").forEach(function (ex) {
    var ans = Number(ex.getAttribute("data-answer"));
    var tol = Number(ex.getAttribute("data-tol") || 0.02);
    var input = ex.querySelector("input"), fb = ex.querySelector(".ex-fb");
    var check = ex.querySelector("[data-check]"), reveal = ex.querySelector("[data-reveal]");
    function parse(v) { return Number(String(v).replace(/[$,%\s]/g, "")); }
    if (check) check.addEventListener("click", function () {
      var v = parse(input.value);
      if (!isFinite(v) || input.value.trim() === "") { fb.className = "ex-fb show no"; fb.textContent = "Type a number first."; return; }
      var ok = Math.abs(v - ans) <= Math.abs(ans) * tol + 1e-9;
      fb.className = "ex-fb show " + (ok ? "ok" : "no");
      fb.innerHTML = ok ? "<b>Right.</b> " + (ex.getAttribute("data-ok") || "") : "<b>Not quite.</b> " + (v > ans ? "That is too high. " : "That is too low. ") + "Try again, or open the worked solution.";
      if (ok) ex.classList.add("solved");
    });
    if (input) input.addEventListener("keydown", function (e) { if (e.key === "Enter" && check) check.click(); });
    if (reveal) reveal.addEventListener("click", function () { ex.classList.toggle("solved"); reveal.textContent = ex.classList.contains("solved") ? "Hide worked solution" : "Show worked solution"; });
  });

  /* ---------- Worksheets (saved locally, downloadable) ---------- */
  document.querySelectorAll(".ws[data-ws]").forEach(function (ws) {
    var k = "inv-ws-" + ws.getAttribute("data-ws");
    var data = store(k) || {};
    var fields = [].slice.call(ws.querySelectorAll("textarea,input"));
    var saved = ws.querySelector(".saved");
    fields.forEach(function (f, i) {
      var id = f.getAttribute("data-key") || ("f" + i);
      if (data[id] != null) f.value = data[id];
      f.addEventListener("input", function () { data[id] = f.value; store(k, data); if (saved) saved.textContent = "Saved in this browser"; });
    });
    var dl = ws.querySelector("[data-ws-download]");
    if (dl) dl.addEventListener("click", function () {
      var title = ws.getAttribute("data-title") || "Worksheet";
      var out = title + "\n" + (currentId ? currentId + " · " : "") + "Investing Learning Lab · " + VERSION + "\n\n";
      fields.forEach(function (f) {
        var lab = ws.querySelector('label[for="' + f.id + '"]');
        out += (lab ? lab.textContent.trim() : (f.getAttribute("data-key") || "Field")) + "\n" + (f.value || "(blank)") + "\n\n";
      });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([out], { type: "text/plain" }));
      a.download = (currentId || "worksheet") + "-" + (ws.getAttribute("data-ws")) + ".txt";
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
    });
    var clr = ws.querySelector("[data-ws-clear]");
    if (clr) clr.addEventListener("click", function () {
      if (!confirm("Clear everything in this worksheet?")) return;
      data = {}; store(k, data); fields.forEach(function (f) { f.value = ""; }); if (saved) saved.textContent = "Cleared";
    });
  });

  /* ---------- Quiz ---------- */
  var quizData = document.getElementById("quizData");
  if (quizData) {
    var quiz = []; try { quiz = JSON.parse(quizData.textContent); } catch (e) { quiz = []; }
    var box = document.getElementById("quizBox"), scoreEl = document.getElementById("quizScore");
    var answered = {};
    var renderQuiz = function () {
      box.innerHTML = quiz.map(function (q, i) {
        return '<div class="quiz-q"><div class="q">' + (i + 1) + ". " + q.q + '</div><div class="choices">' +
          q.choices.map(function (c, j) { return '<button type="button" class="choice" data-q="' + i + '" data-a="' + j + '">' + c + "</button>"; }).join("") +
          '</div><div class="explain" id="ex' + i + '" aria-live="polite"></div></div>';
      }).join("");
      box.querySelectorAll(".choice").forEach(function (b) { b.addEventListener("click", onChoice); });
      updateScore();
    };
    var onChoice = function () {
      var i = Number(this.getAttribute("data-q")), a = Number(this.getAttribute("data-a"));
      answered[i] = a;
      this.closest(".quiz-q").querySelectorAll(".choice").forEach(function (x, j) {
        x.disabled = true; if (j === quiz[i].answer) x.classList.add("ok"); else if (j === a) x.classList.add("bad");
      });
      var ex = document.getElementById("ex" + i);
      ex.innerHTML = "<b>" + (a === quiz[i].answer ? "Correct. " : "Not quite. ") + "</b>" + quiz[i].explain;
      ex.classList.add("show"); updateScore();
    };
    var updateScore = function () {
      var total = quiz.length, done = Object.keys(answered).length;
      var got = Object.keys(answered).filter(function (i) { return answered[i] === quiz[i].answer; }).length;
      var flag = "";
      if (done === total && total) {
        var pass = got / total >= 0.7;
        flag = ' <span class="pass-flag ' + (pass ? "pass" : "fail") + '">' + (pass ? "✓ Passed — module complete" : "Keep reviewing (70% to pass)") + "</span>";
        if (pass) markModule(currentId, got, total);
      }
      if (scoreEl) scoreEl.innerHTML = "Score: " + got + " / " + total + " answered " + done + flag;
    };
    var rs = document.getElementById("quizReset");
    if (rs) rs.addEventListener("click", function () { answered = {}; renderQuiz(); });
    if (box) renderQuiz();
  }

  /* ---------- Glossary popovers ---------- */
  var pop = null;
  function closePop() { if (pop) { pop.remove(); pop = null; } }
  function glossLookup(k) {
    var G = window.INV_GLOSSARY || [];
    k = k.toLowerCase();
    for (var i = 0; i < G.length; i++) { if (G[i].t.toLowerCase() === k || (G[i].a && G[i].a.some(function (x) { return x.toLowerCase() === k; }))) return G[i]; }
    return null;
  }
  INV.glossLookup = glossLookup;
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  INV.slug = slug;
  document.querySelectorAll(".term").forEach(function (t) {
    if (t.tagName !== "BUTTON") { t.setAttribute("role", "button"); t.tabIndex = 0; }
    function open(e) {
      e.preventDefault(); e.stopPropagation();
      var key = t.getAttribute("data-term") || t.textContent;
      var g = glossLookup(key);
      closePop();
      pop = document.createElement("div"); pop.className = "term-pop"; pop.setAttribute("role", "dialog");
      pop.innerHTML = g ? "<b>" + esc(g.t) + "</b>" + g.d + (g.u ? '<div class="tp-l">What it is used for</div>' + g.u : "") +
        (g.m ? '<div class="tp-l">What it means for you</div>' + g.m : "") + '<br><a href="glossary.html#' + slug(g.t) + '">Open in glossary →</a>'
        : "<b>" + esc(key) + '</b>See the <a href="glossary.html">glossary</a>.';
      document.body.appendChild(pop);
      var r = t.getBoundingClientRect(), pw = Math.min(340, window.innerWidth - 20);
      pop.style.maxWidth = pw + "px";
      var left = Math.max(10, Math.min(window.scrollX + r.left, window.scrollX + window.innerWidth - pw - 10));
      pop.style.left = left + "px"; pop.style.top = (window.scrollY + r.bottom + 8) + "px";
    }
    t.addEventListener("click", open);
    t.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") open(e); if (e.key === "Escape") closePop(); });
  });
  document.addEventListener("click", function (e) { if (pop && !pop.contains(e.target)) closePop(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePop(); });

  /* ---------- Resources (from assets/inv-resources.js) ---------- */
  var KIND = { babak: ["🧰", "Babak's tool"], video: ["▶️", "YouTube"], podcast: ["🎙️", "Podcast"], official: ["🏛️", "Official"], tool: ["🧮", "Free tool"],
    data: ["📊", "Data"], course: ["🎓", "Course"], book: ["📖", "Book"], research: ["🔬", "Research"] };
  var KORDER = ["babak", "video", "podcast", "official", "tool", "data", "course", "book", "research"];
  var LV = { 1: "New to investing", 2: "Some experience", 3: "Advanced" };
  INV.kinds = KIND; INV.levels = LV;
  INV.resourceCard = function (r) {
    var k = KIND[r.k] || ["🔗", r.k];
    var title = r.url ? '<a href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">' + esc(r.n) + " ↗</a>" : "<b>" + esc(r.n) + "</b>";
    return '<div class="res"><div class="ri" aria-hidden="true">' + k[0] + "</div><div>" + title +
      '<div class="src">' + esc(r.by || "") + '</div><div class="why">' + esc(r.why) + '</div><div class="tags"><span>' + esc(k[1]) + "</span><span>" + esc(LV[r.lv] || "") + "</span>" +
      (r.st || []).slice(0, 3).map(function (s) { return "<span>Stage " + s + "</span>"; }).join("") + "</div></div></div>";
  };
  document.querySelectorAll("[data-resources]").forEach(function (el) {
    var id = el.getAttribute("data-resources"), R = window.INV_RESOURCES || [];
    var list = R.filter(function (r) { return (r.mods || []).indexOf(id) > -1; });
    list.sort(function (a, b) { return KORDER.indexOf(a.k) - KORDER.indexOf(b.k) || a.lv - b.lv; });
    el.className = "res-list";
    el.innerHTML = list.length ? list.map(INV.resourceCard).join("") + '<p class="src">More in the <a href="resources.html">full resource library</a>; calculators in the <a href="tools.html">tools hub</a>.</p>'
      : '<p class="src">See the <a href="resources.html">full resource library</a>.</p>';
  });

  /* ---------- Chart library (SVG, theme-aware through CSS variables) ---------- */
  function niceTicks(min, max, count) {
    if (min === max) { max = min + 1; }
    var span = max - min, step = Math.pow(10, Math.floor(Math.log10(span / count)));
    var err = span / count / step;
    if (err >= 7.5) step *= 10; else if (err >= 3.5) step *= 5; else if (err >= 1.5) step *= 2;
    var lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step, out = [];
    for (var v = lo; v <= hi + step / 2; v += step) out.push(Math.round(v / step) * step);
    return out;
  }
  function logTicks(min, max) {
    var out = [], e0 = Math.floor(Math.log10(min)), e1 = Math.ceil(Math.log10(max));
    for (var e = e0; e <= e1; e++) out.push(Math.pow(10, e));
    return out;
  }
  /* opts: series:[{name,color,data:[[x,y]],dash,area,width}], xFmt, yFmt, log, yMin, yMax, height, bands:[{x0,x1,label}], marks:[{x,label}], xTitle, yTitle, tipFmt */
  function chartWidth(el, o) { if (o.width) return o.width; var cw = el.clientWidth || (el.parentNode && el.parentNode.clientWidth) || 0; return cw > 40 ? Math.max(300, Math.min(Math.round(cw), 920)) : 720; }
  INV.lineChart = function (el, o) {
    el.__chart = ["line", o];
    var W = chartWidth(el, o), H = o.height || 300, L = o.left || 62, R = o.right || 16, Tp = o.yTitle ? 30 : 16, B = o.xTitle ? 44 : 30;
    var all = []; o.series.forEach(function (s) { s.data.forEach(function (p) { if (isFinite(p[1])) all.push(p); }); });
    if (!all.length) { el.innerHTML = ""; return; }
    var xs = all.map(function (p) { return p[0]; }), ys = all.map(function (p) { return p[1]; });
    var x0 = o.xMin != null ? o.xMin : Math.min.apply(null, xs), x1 = o.xMax != null ? o.xMax : Math.max.apply(null, xs);
    var y0 = o.yMin != null ? o.yMin : Math.min.apply(null, ys), y1 = o.yMax != null ? o.yMax : Math.max.apply(null, ys);
    var ticks;
    if (o.log) { y0 = Math.max(y0, 1e-6); ticks = logTicks(y0, y1); y0 = ticks[0]; y1 = ticks[ticks.length - 1]; }
    else { if (o.yMin == null && y0 > 0 && o.zeroBase !== false) y0 = 0; ticks = niceTicks(y0, y1, o.yTicks || 5); y0 = ticks[0]; y1 = ticks[ticks.length - 1]; }
    var sx = function (x) { return L + (x - x0) / ((x1 - x0) || 1) * (W - L - R); };
    var sy = o.log ? function (y) { return Tp + (Math.log10(y1) - Math.log10(Math.max(y, 1e-6))) / (Math.log10(y1) - Math.log10(y0)) * (H - Tp - B); }
      : function (y) { return Tp + (y1 - y) / ((y1 - y0) || 1) * (H - Tp - B); };
    var yF = o.yFmt || function (v) { return String(v); }, xF = o.xFmt || function (v) { return String(v); };
    var s = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(o.label || "Chart") + '">';
    (o.bands || []).forEach(function (b) {
      s += '<rect x="' + sx(b.x0) + '" y="' + Tp + '" width="' + Math.max(2, sx(b.x1) - sx(b.x0)) + '" height="' + (H - Tp - B) + '" style="fill:' + (b.color || "var(--red-soft)") + '" opacity=".8"/>';
      if (b.label) s += '<text x="' + ((sx(b.x0) + sx(b.x1)) / 2) + '" y="' + (Tp + 11) + '" text-anchor="middle" class="svg-m" font-size="10">' + esc(b.label) + "</text>";
    });
    s += '<g class="grid">';
    ticks.forEach(function (t) { s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + sy(t) + '" y2="' + sy(t) + '"/>'; });
    s += '</g><g class="axis">';
    ticks.forEach(function (t) { s += '<text x="' + (L - 8) + '" y="' + (sy(t) + 4) + '" text-anchor="end">' + esc(yF(t)) + "</text>"; });
    var xt = o.xTicks || niceTicks(x0, x1, Math.min(8, Math.max(3, Math.round((W - L - R) / 90))));
    xt.forEach(function (t) { if (t < x0 || t > x1) return; var px = sx(t), an = px > W - R - 24 ? "end" : px < L + 24 ? "start" : "middle"; s += '<text x="' + px + '" y="' + (H - B + 16) + '" text-anchor="' + an + '">' + esc(xF(t)) + "</text>"; });
    if (o.xTitle) s += '<text class="axis-title" x="' + ((L + W - R) / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(o.xTitle) + "</text>";
    if (o.yTitle) s += '<text class="axis-title" x="' + (L - 8) + '" y="' + (Tp - 14) + '" text-anchor="start">' + esc(o.yTitle) + "</text>";
    s += "</g>";
    if (!o.log && y0 < 0 && y1 > 0) s += '<line class="zero" x1="' + L + '" x2="' + (W - R) + '" y1="' + sy(0) + '" y2="' + sy(0) + '"/>';
    o.series.forEach(function (se) {
      var pts = se.data.filter(function (p) { return isFinite(p[1]); });
      if (!pts.length) return;
      var d = pts.map(function (p, i) { return (i ? "L" : "M") + sx(p[0]).toFixed(1) + " " + sy(p[1]).toFixed(1); }).join(" ");
      if (se.area) {
        var base = o.log ? sy(y0) : sy(Math.max(y0, 0));
        s += '<path d="' + d + " L" + sx(pts[pts.length - 1][0]).toFixed(1) + " " + base + " L" + sx(pts[0][0]).toFixed(1) + " " + base + ' Z" style="fill:' + se.color + '" opacity="' + (se.areaOpacity || 0.14) + '"/>';
      }
      s += '<path d="' + d + '" fill="none" style="stroke:' + se.color + '" stroke-width="' + (se.width || 2.4) + '" stroke-linejoin="round" stroke-linecap="round"' + (se.dash ? ' stroke-dasharray="' + se.dash + '"' : "") + "/>";
    });
    (o.marks || []).forEach(function (mk) {
      var mx = sx(mk.x);
      s += '<line x1="' + mx + '" x2="' + mx + '" y1="' + Tp + '" y2="' + (H - B) + '" style="stroke:var(--muted)" stroke-dasharray="3 3"/>';
      if (mk.label) s += '<text x="' + (mx + 4) + '" y="' + (Tp + 12 + (mk.dy || 0)) + '" class="svg-s" font-size="10.5">' + esc(mk.label) + "</text>";
    });
    (o.dots || []).forEach(function (dt) {
      s += '<circle cx="' + sx(dt.x) + '" cy="' + sy(dt.y) + '" r="' + (dt.r || 5) + '" style="fill:' + (dt.color || "var(--blue)") + ';stroke:var(--card)" stroke-width="2"/>';
      if (dt.label) s += '<text x="' + (sx(dt.x) + (dt.dx || 8)) + '" y="' + (sy(dt.y) + (dt.dy || -8)) + '" class="svg-t" font-size="11" font-weight="700"' + (dt.anchor ? ' text-anchor="' + dt.anchor + '"' : "") + ">" + esc(dt.label) + "</text>";
    });
    s += '<line class="hover-line" x1="0" x2="0" y1="' + Tp + '" y2="' + (H - B) + '" style="stroke:var(--text2)" stroke-width="1" opacity="0"/>';
    s += '<rect class="hit" x="' + L + '" y="' + Tp + '" width="' + (W - L - R) + '" height="' + (H - Tp - B) + '" fill="transparent"/></svg>';
    var legend = o.legend === false || o.series.length < 2 ? "" : '<div class="legend">' + o.series.map(function (se) {
      return '<span><i style="background:' + se.color + '"></i>' + esc(se.name) + "</span>";
    }).join("") + "</div>";
    el.classList.add("chart");
    el.innerHTML = legend + s + '<div class="tip"></div>';
    var svg = el.querySelector("svg"), tip = el.querySelector(".tip"), hl = el.querySelector(".hover-line");
    var xsAll = []; o.series[0].data.forEach(function (p) { xsAll.push(p[0]); });
    function move(ev) {
      var r = svg.getBoundingClientRect(), cx = (ev.touches ? ev.touches[0].clientX : ev.clientX);
      var vx = (cx - r.left) / r.width * W;
      var xv = x0 + (vx - L) / (W - L - R) * (x1 - x0);
      var best = xsAll[0], bd = Infinity;
      xsAll.forEach(function (x) { var dd = Math.abs(x - xv); if (dd < bd) { bd = dd; best = x; } });
      var lines = o.series.map(function (se) {
        var p = se.data.find(function (q) { return q[0] === best; });
        return p && isFinite(p[1]) ? '<span style="color:' + se.color + '">●</span> ' + esc(se.name) + ": <b>" + esc((o.tipFmt || yF)(p[1])) + "</b>" : "";
      }).filter(Boolean);
      if (!lines.length) return;
      tip.innerHTML = "<b>" + esc(xF(best)) + "</b><br>" + lines.join("<br>");
      var px = sx(best) / W * r.width;
      tip.style.left = Math.max(70, Math.min(r.width - 70, px)) + "px"; tip.style.top = ((Tp + 6) / H * r.height + (legend ? 28 : 0)) + "px";
      tip.classList.add("show"); hl.setAttribute("x1", sx(best)); hl.setAttribute("x2", sx(best)); hl.setAttribute("opacity", ".5");
    }
    var hit = el.querySelector(".hit");
    hit.addEventListener("mousemove", move); hit.addEventListener("touchstart", move, { passive: true }); hit.addEventListener("touchmove", move, { passive: true });
    hit.addEventListener("mouseleave", function () { tip.classList.remove("show"); hl.setAttribute("opacity", "0"); });
  };
  /* opts: data:[{x,label,y,color}], yFmt, height, highlight:fn */
  INV.barChart = function (el, o) {
    el.__chart = ["bar", o];
    var W = chartWidth(el, o), H = o.height || 260, L = o.left || 56, R = 12, Tp = (o.valueLabels || o.yTitle) ? 28 : 14, B = o.xTitle ? 44 : 30;
    var ys = o.data.map(function (d) { return d.y; });
    var y0 = Math.min(0, Math.min.apply(null, ys)), y1 = Math.max(0, Math.max.apply(null, ys));
    var ticks = niceTicks(y0, y1, o.yTicks || 5); y0 = ticks[0]; y1 = ticks[ticks.length - 1];
    var n = o.data.length, bw = (W - L - R) / n;
    var every = Math.max(1, Math.ceil(n / Math.min(o.maxLabels || 12, Math.max(3, Math.floor((W - L - R) / 44)))));
    var shown = o.data.filter(function (d, i) { return o.allLabels || i % every === 0; });
    var maxLen = Math.max.apply(null, shown.map(function (d) { return String(d.label).length; }).concat([1]));
    var rot = maxLen * 6.3 > (o.allLabels ? bw : bw * every) * 0.92;
    if (rot) { var extraB = Math.min(70, Math.round(maxLen * 4.6)); B += extraB; H += extraB; var needL = Math.round(maxLen * 5.1 - bw / 2); if (needL > L) { L = needL; bw = (W - L - R) / n; } }
    var sy = function (y) { return Tp + (y1 - y) / ((y1 - y0) || 1) * (H - Tp - B); };
    var yF = o.yFmt || function (v) { return String(v); };
    var s = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(o.label || "Bar chart") + '"><g class="grid">';
    ticks.forEach(function (t) { s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + sy(t) + '" y2="' + sy(t) + '"/>'; });
    s += '</g><g class="axis">';
    ticks.forEach(function (t) { s += '<text x="' + (L - 8) + '" y="' + (sy(t) + 4) + '" text-anchor="end">' + esc(yF(t)) + "</text>"; });
    o.data.forEach(function (d, i) {
      if (!(i % every === 0 || o.allLabels)) return;
      var lx = L + bw * i + bw / 2, ly = H - B + 16;
      s += rot ? '<text x="' + lx + '" y="' + (ly - 4) + '" text-anchor="end" transform="rotate(-38 ' + lx + " " + (ly - 4) + ')">' + esc(d.label) + "</text>"
        : '<text x="' + lx + '" y="' + ly + '" text-anchor="middle">' + esc(d.label) + "</text>";
    });
    if (o.xTitle) s += '<text class="axis-title" x="' + ((L + W - R) / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(o.xTitle) + "</text>";
    if (o.yTitle) s += '<text class="axis-title" x="' + (L - 8) + '" y="' + (Tp - 14) + '" text-anchor="start">' + esc(o.yTitle) + "</text>";
    s += "</g>";
    o.data.forEach(function (d, i) {
      var yA = sy(Math.max(0, d.y)), yB = sy(Math.min(0, d.y));
      var col = d.color || (d.y >= 0 ? "var(--s2)" : "var(--s5)");
      s += '<rect data-i="' + i + '" x="' + (L + bw * i + bw * 0.12).toFixed(1) + '" y="' + yA.toFixed(1) + '" width="' + (bw * 0.76).toFixed(1) + '" height="' + Math.max(1, yB - yA).toFixed(1) + '" rx="' + Math.min(3, bw * 0.2) + '" style="fill:' + col + '"' + (d.dim ? ' opacity=".35"' : "") + "/>";
      if (o.valueLabels && bw >= 34) s += '<text x="' + (L + bw * i + bw / 2) + '" y="' + (d.y >= 0 ? yA - 5 : yB + 13) + '" text-anchor="middle" class="svg-t" font-size="11" font-weight="700">' + esc(yF(d.y)) + "</text>";
    });
    if (y0 < 0) s += '<line class="zero" x1="' + L + '" x2="' + (W - R) + '" y1="' + sy(0) + '" y2="' + sy(0) + '"/>';
    s += "</svg>";
    el.classList.add("chart");
    el.innerHTML = s + '<div class="tip"></div>';
    var tip = el.querySelector(".tip"), svg = el.querySelector("svg");
    el.querySelectorAll("rect[data-i]").forEach(function (rc) {
      function sh() {
        var d = o.data[Number(rc.getAttribute("data-i"))], r = svg.getBoundingClientRect(), b = rc.getBoundingClientRect();
        tip.innerHTML = "<b>" + esc(d.tip || d.label) + "</b><br>" + esc((o.tipFmt || yF)(d.y));
        tip.style.left = Math.max(60, Math.min(r.width - 60, b.left - r.left + b.width / 2)) + "px"; tip.style.top = (b.top - r.top) + "px"; tip.classList.add("show");
      }
      rc.addEventListener("mouseenter", sh); rc.addEventListener("touchstart", sh, { passive: true });
      rc.addEventListener("mouseleave", function () { tip.classList.remove("show"); });
    });
  };

  /* ---------- Re-render charts at their real width when shown or resized ---------- */
  function rerender(scope) {
    (scope || document).querySelectorAll(".chart").forEach(function (el) {
      if (!el.__chart || !el.offsetParent) return;
      var w = el.clientWidth; if (Math.abs((el.__w || 0) - w) < 8) return; el.__w = w;
      (el.__chart[0] === "bar" ? INV.barChart : INV.lineChart)(el, el.__chart[1]);
    });
  }
  INV.rerender = rerender;
  document.addEventListener("inv-show", function (e) { setTimeout(function () { rerender(e.target); }, 0); });
  var rsT = null; window.addEventListener("resize", function () { clearTimeout(rsT); rsT = setTimeout(function () { rerender(document); }, 150); });
  INV.ready(function () { setTimeout(function () { rerender(document); }, 30); });
  /* narrow screens: static diagrams scroll sideways at a readable size */
  INV.ready(function () { document.querySelectorAll(".fig-scroll").forEach(function (f) { f.setAttribute("tabindex", "0"); f.setAttribute("role", "region"); var t = f.closest(".fig"); var ttl = t && t.querySelector(".fig-title"); f.setAttribute("aria-label", (ttl ? ttl.textContent : "Diagram") + " (scrolls sideways on small screens)"); }); });

  /* ---------- Historical data helpers ---------- */
  INV.hist = function () {
    var D = window.INV_RETURNS; if (!D) return null;
    var out = {}; D.cols.forEach(function (c, i) { out[c] = D.rows.map(function (r) { return r[i]; }); });
    out.rows = D.rows; out.first = D.rows[0][0]; out.last = D.rows[D.rows.length - 1][0];
    return out;
  };
  INV.cagr = function (rets) { var g = 1; rets.forEach(function (r) { g *= 1 + r / 100; }); return (Math.pow(g, 1 / rets.length) - 1) * 100; };

})();
