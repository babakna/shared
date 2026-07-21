/* PQC Learning Lab shared engine - V6.0 */
(function () {
  "use strict";
  var VERSION = "V6.0 (July 2026)";
  var root = document.documentElement;

  var COURSE = [
    { id: "PQC-001", title: "Security & Cryptography Basics", stage: "Foundations" },
    { id: "PQC-100", title: "Quantum Computing in Plain English", stage: "Foundations" },
    { id: "PQC-101", title: "Why Quantum Changes the Threat Model", stage: "Foundations" },
    { id: "PQC-102", title: "Cryptographic Building Blocks", stage: "Foundations" },
    { id: "PQC-201", title: "PQC Standards & Algorithm Families", stage: "Standards" },
    { id: "PQC-202", title: "Protocols in Practice", stage: "Standards" },
    { id: "PQC-301", title: "Developer Implementation Engineering", stage: "Build & Migrate" },
    { id: "PQC-302", title: "Use-Case Labs", stage: "Build & Migrate" },
    { id: "PQC-401", title: "Enterprise Migration Playbook", stage: "Build & Migrate" },
    { id: "PQC-402", title: "Crypto Inventory & CBOM Workshop", stage: "Build & Migrate" },
    { id: "PQC-501", title: "Network, 5G/6G, SIM/eSIM, IoT", stage: "Ecosystems" },
    { id: "PQC-601", title: "Research, Governance & Architecture Review", stage: "Ecosystems" },
    { id: "PQC-701", title: "Capstone: Migrate Northwind Telecom", stage: "Capstone" }
  ];

  function escAttr(s) {
    return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ---------- Persistent learning journey ---------- */
  var currentModule = document.body.getAttribute("data-module") || "";
  var courseIndex = COURSE.findIndex(function (m) { return m.id === currentModule; });
  function journeyOptions() {
    return COURSE.map(function (m, i) {
      return '<option value="' + m.id + '.html"' + (i === courseIndex ? " selected" : "") + ">Module " +
        (i + 1) + ": " + escAttr(m.id) + " — " + escAttr(m.title) + "</option>";
    }).join("");
  }
  if (courseIndex > -1) {
    var top = document.querySelector(".top");
    if (top) {
      var journey = document.createElement("nav");
      journey.className = "journey";
      journey.setAttribute("aria-label", "Course journey");
      var prev = COURSE[courseIndex - 1];
      var next = COURSE[courseIndex + 1];
      journey.innerHTML = '<div class="journey-in">' +
        '<div class="journey-status"><span>' + escAttr(COURSE[courseIndex].stage) + '</span><strong>Module ' +
        (courseIndex + 1) + ' of ' + COURSE.length + '</strong></div>' +
        '<div class="journey-track" aria-hidden="true"><span style="width:' + (((courseIndex + 1) / COURSE.length) * 100) + '%"></span></div>' +
        '<div class="journey-controls">' +
        (prev ? '<a class="btn small" href="' + prev.id + '.html" aria-label="Previous module: ' + escAttr(prev.title) + '">← Previous</a>' : '<a class="btn small" href="index.html">Course home</a>') +
        '<label class="sr-only" for="journeySelect">Choose a module</label><select id="journeySelect" aria-label="Choose a module">' + journeyOptions() + '</select>' +
        (next ? '<a class="btn small primary" href="' + next.id + '.html" aria-label="Next module: ' + escAttr(next.title) + '">Next →</a>' : '<a class="btn small primary" href="index.html">Course home</a>') +
        '</div></div>';
      top.appendChild(journey);
      journey.querySelector("select").addEventListener("change", function () { window.location.href = this.value; });
    }
    var quizBlock = document.getElementById("quizBox");
    quizBlock = quizBlock ? quizBlock.closest(".block") : null;
    if (quizBlock) {
      var continuation = document.createElement("nav");
      continuation.className = "course-continuation";
      continuation.setAttribute("aria-label", "Continue course");
      var previousModule = COURSE[courseIndex - 1];
      var nextModule = COURSE[courseIndex + 1];
      continuation.innerHTML = '<div><span class="eyebrow">Your learning journey</span><strong>Module ' +
        (courseIndex + 1) + ' of ' + COURSE.length + ' complete when you pass the quiz</strong></div><div class="continuation-actions">' +
        (previousModule ? '<a class="btn" href="' + previousModule.id + '.html">← ' + escAttr(previousModule.id) + '</a>' : '') +
        '<a class="btn" href="index.html">Course home</a>' +
        (nextModule ? '<a class="btn primary" href="' + nextModule.id + '.html">Next: ' + escAttr(nextModule.id) + ' →</a>' : '<a class="btn primary" href="index.html">Finish course →</a>') +
        '</div>';
      quizBlock.insertAdjacentElement("afterend", continuation);
    }
  }
  window.PQCCourse = { version: VERSION, modules: COURSE.slice() };

  /* ---------- Theme (light default) ---------- */
  function setTheme(t) {
    root.dataset.theme = t;
    try { localStorage.setItem("pqc-theme", t); } catch (e) {}
    document.querySelectorAll("[data-theme-btn]").forEach(function (b) {
      b.textContent = t === "dark" ? "Light" : "Dark";
    });
  }
  var savedTheme = "light";
  try { savedTheme = localStorage.getItem("pqc-theme") || "light"; } catch (e) {}
  setTheme(savedTheme);
  document.querySelectorAll("[data-theme-btn]").forEach(function (b) {
    b.addEventListener("click", function () {
      setTheme(root.dataset.theme === "dark" ? "light" : "dark");
    });
  });

  /* ---------- Help modal ---------- */
  var help = document.getElementById("helpModal");
  if (help) {
    var openHelp = document.querySelectorAll("[data-help-btn]");
    var helpOpener = null;
    var focusableSelector = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
    function showHelp(opener) {
      helpOpener = opener || document.activeElement;
      help.classList.add("open");
      help.setAttribute("aria-hidden", "false");
      var first = help.querySelector(focusableSelector);
      if (first) first.focus();
    }
    function hideHelp() {
      if (!help.classList.contains("open")) return;
      help.classList.remove("open");
      help.setAttribute("aria-hidden", "true");
      if (helpOpener && helpOpener.focus) helpOpener.focus();
    }
    help.setAttribute("aria-hidden", "true");
    openHelp.forEach(function (b) { b.addEventListener("click", function () { showHelp(b); }); });
    var closeHelp = document.getElementById("closeHelp");
    if (closeHelp) closeHelp.addEventListener("click", hideHelp);
    help.addEventListener("click", function (e) { if (e.target === help) hideHelp(); });
    document.addEventListener("keydown", function (e) {
      if (!help.classList.contains("open")) return;
      if (e.key === "Escape") { e.preventDefault(); hideHelp(); return; }
      if (e.key === "Tab") {
        var items = [].slice.call(help.querySelectorAll(focusableSelector));
        if (!items.length) return;
        var first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    var hv = help.querySelector("[data-help-version]");
    if (hv) hv.textContent = VERSION;
  }

  /* ---------- Reveal answers (labs) ---------- */
  document.querySelectorAll(".reveal").forEach(function (btn) {
    btn.setAttribute("aria-expanded", "false");
    btn.addEventListener("click", function () {
      var card = btn.closest(".case");
      if (!card) return;
      card.classList.toggle("open");
      btn.setAttribute("aria-expanded", card.classList.contains("open") ? "true" : "false");
      btn.textContent = card.classList.contains("open") ? "Hide answer" : "Show recommended answer";
    });
  });

  /* ---------- Reliable Top control ---------- */
  document.querySelectorAll('a.toplink[href="#top"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      try { history.replaceState(null, "", window.location.pathname + window.location.search); } catch (err) {}
    });
  });

  /* ---------- Scrollspy + reading progress ---------- */
  var readbar = document.querySelector(".readbar");
  var navLinks = [].slice.call(document.querySelectorAll(".side a[href^='#']"));
  var secs = navLinks.map(function (a) { return document.querySelector(a.getAttribute("href")); });
  function onScroll() {
    if (readbar) {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      readbar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    }
    if (navLinks.length) {
      var idx = 0;
      secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < 140) idx = i; });
      navLinks.forEach(function (a, i) { a.classList.toggle("active", i === idx); });
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Progress store ---------- */
  function readProgress() {
    try { return JSON.parse(localStorage.getItem("pqc-progress") || "{}"); } catch (e) { return {}; }
  }
  function writeProgress(p) {
    try { localStorage.setItem("pqc-progress", JSON.stringify(p)); } catch (e) {}
  }
  function markModule(id, score, total) {
    if (!id) return;
    var p = readProgress();
    var prevBest = (p[id] && p[id].score) || 0;
    p[id] = { done: true, score: Math.max(prevBest, score), total: total, ts: Date.now() };
    writeProgress(p);
  }
  window.PQCProgress = { read: readProgress, write: writeProgress };

  /* ---------- Quiz engine ---------- */
  var quizData = document.getElementById("quizData");
  if (quizData) {
    var quiz = [];
    try { quiz = JSON.parse(quizData.textContent); } catch (e) { quiz = []; }
    var box = document.getElementById("quizBox");
    var scoreEl = document.getElementById("quizScore");
    var moduleId = document.body.getAttribute("data-module") || "";
    var PASS = 0.7;
    var answered = {};

    function renderQuiz() {
      box.innerHTML = quiz.map(function (q, i) {
        var choices = q.choices.map(function (c, j) {
          return '<button class="choice" data-q="' + i + '" data-a="' + j + '">' + c + "</button>";
        }).join("");
        return '<div class="quiz-q"><div class="q">' + (i + 1) + ". " + q.q + '</div>' +
          '<div class="choices">' + choices + '</div>' +
          '<div class="explain" id="ex' + i + '"></div></div>';
      }).join("");
      box.querySelectorAll(".choice").forEach(function (b) {
        b.addEventListener("click", onChoice);
      });
      updateScore();
    }
    function onChoice() {
      var i = Number(this.getAttribute("data-q"));
      var a = Number(this.getAttribute("data-a"));
      answered[i] = a;
      var parent = this.closest(".quiz-q");
      parent.querySelectorAll(".choice").forEach(function (x, j) {
        x.classList.remove("ok", "bad");
        x.setAttribute("disabled", "disabled");
        if (j === quiz[i].answer) x.classList.add("ok");
        else if (j === a) x.classList.add("bad");
      });
      var ex = document.getElementById("ex" + i);
      var correct = a === quiz[i].answer;
      ex.innerHTML = "<b>" + (correct ? "Correct. " : "Not quite. ") + "</b>" + quiz[i].explain;
      ex.classList.add("show");
      updateScore();
    }
    function updateScore() {
      var total = quiz.length;
      var got = Object.keys(answered).filter(function (i) { return answered[i] === quiz[i].answer; }).length;
      var done = Object.keys(answered).length;
      if (scoreEl) {
        var flag = "";
        if (done === total && total > 0) {
          var pass = got / total >= PASS;
          flag = ' <span class="pass-flag ' + (pass ? "pass" : "fail") + '">' +
            (pass ? "\u2713 Passed" : "Keep reviewing") + "</span>";
          if (pass) markModule(moduleId, got, total);
        }
        scoreEl.innerHTML = "Score: " + got + "/" + total + flag;
      }
    }
    var resetBtn = document.getElementById("quizReset");
    if (resetBtn) resetBtn.addEventListener("click", function () { answered = {}; renderQuiz(); });
    if (box) renderQuiz();
  }

  /* ---------- Stepper widget (visual pipeline) ---------- */
  function stEsc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function stWrap(t) {
    var words = String(t).split(/\s+/), lines = [], cur = "";
    for (var i = 0; i < words.length; i++) {
      var test = cur ? cur + " " + words[i] : words[i];
      if (test.length > 15 && cur) { lines.push(cur); cur = words[i]; } else { cur = test; }
    }
    if (cur) lines.push(cur);
    if (lines.length > 2) lines = [lines[0], lines.slice(1).join(" ")];
    if (lines[1] && lines[1].length > 17) lines[1] = lines[1].slice(0, 16) + "\u2026";
    return lines.slice(0, 2);
  }
  document.querySelectorAll(".pqc-stepper").forEach(function (el) {
    var dataEl = el.querySelector("script.steps");
    var steps = [];
    try { steps = JSON.parse(dataEl.textContent); } catch (e) { return; }
    if (!steps.length) return;
    var title = el.getAttribute("data-title") || "Walkthrough";
    var cur = 0, seen = {};
    var N = steps.length, W = 172, H = 148;

    var svg = '<svg viewBox="0 0 ' + (N * W) + ' ' + H + '" class="st-svg" preserveAspectRatio="xMidYMid meet" style="min-width:' + (N * 96) + 'px" role="img" aria-label="' + stEsc(title) + ' pipeline">';
    var i, cx;
    for (i = 1; i < N; i++) {
      svg += '<line class="conn" x1="' + ((i - 1) * W + W / 2 + 34) + '" y1="58" x2="' + (i * W + W / 2 - 34) + '" y2="58"/>';
    }
    for (i = 0; i < N; i++) {
      cx = i * W + W / 2;
      var icon = steps[i].icon || String(i + 1);
      var labels = stWrap(steps[i].title);
      svg += '<g class="st-node" data-node="' + i + '" role="button" tabindex="0" aria-label="Step ' + (i + 1) + ': ' + escAttr(steps[i].title) + '">';
      svg += '<circle class="pulse" cx="' + cx + '" cy="58" r="34"/>';
      svg += '<circle class="node-c" cx="' + cx + '" cy="58" r="34"/>';
      svg += '<text class="node-icon" x="' + cx + '" y="58" dy=".35em" text-anchor="middle">' + stEsc(icon) + '</text>';
      svg += '<text class="node-l" x="' + cx + '" y="106" text-anchor="middle">' + stEsc(labels[0] || "") + '</text>';
      if (labels[1]) svg += '<text class="node-l" x="' + cx + '" y="124" text-anchor="middle">' + stEsc(labels[1]) + '</text>';
      svg += '</g>';
    }
    svg += '</svg>';

    var wrap = document.createElement("div");
    wrap.className = "st-wrap";
    wrap.innerHTML =
      '<div class="st-top"><span class="st-title">' + stEsc(title) + '</span><span class="st-count" aria-live="polite"></span></div>' +
      '<div class="st-scene">' + svg + '</div>' +
      '<div class="st-body" role="status" aria-live="polite"></div>' +
      '<div class="st-nav"><button class="btn small st-prev">\u2190 Prev</button>' +
      '<button class="btn small primary st-next">Next \u2192</button>' +
      '<button class="btn small st-restart" hidden>Restart \u21bb</button></div>';
    el.appendChild(wrap);

    var bodyEl = wrap.querySelector(".st-body");
    var countEl = wrap.querySelector(".st-count");
    var nodes = wrap.querySelectorAll(".st-node");
    var conns = wrap.querySelectorAll(".conn");
    nodes.forEach(function (n, i) {
      n.style.cursor = "pointer";
      n.addEventListener("click", function () { cur = i; draw(); });
      n.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cur = i; draw(); }
      });
    });

    function draw() {
      seen[cur] = true;
      var s = steps[cur];
      bodyEl.innerHTML = "<h4>" + (s.icon ? s.icon + " " : "") + stEsc(s.title) + "</h4><p>" + s.body + "</p>" +
        (s.meta ? '<span class="st-meta">' + stEsc(s.meta) + "</span>" : "");
      countEl.textContent = "Step " + (cur + 1) + " of " + N;
      nodes.forEach(function (n, i) {
        n.classList.toggle("on", i === cur);
        n.classList.toggle("done", !!seen[i] && i !== cur);
        n.setAttribute("aria-current", i === cur ? "step" : "false");
        n.setAttribute("aria-pressed", i === cur ? "true" : "false");
      });
      conns.forEach(function (c, k) { c.classList.toggle("done", k < cur); });
      wrap.querySelector(".st-prev").disabled = cur === 0;
      var nextButton = wrap.querySelector(".st-next");
      var restartButton = wrap.querySelector(".st-restart");
      nextButton.disabled = cur === N - 1;
      nextButton.textContent = cur === N - 1 ? "Completed \u2713" : "Next \u2192";
      restartButton.hidden = cur !== N - 1;
      // keep active node visible when scene scrolls horizontally
      var active = nodes[cur];
      if (active && active.scrollIntoView) { try { active.scrollIntoView({ inline: "center", block: "nearest" }); } catch (e) {} }
    }
    wrap.querySelector(".st-prev").addEventListener("click", function () { if (cur > 0) { cur--; draw(); } });
    wrap.querySelector(".st-next").addEventListener("click", function () { if (cur < N - 1) { cur++; draw(); } });
    wrap.querySelector(".st-restart").addEventListener("click", function () { cur = 0; seen = {}; draw(); });
    draw();
  });

  /* ---------- Bar chart widget ---------- */
  document.querySelectorAll(".pqc-bars").forEach(function (el) {
    var dataEl = el.querySelector("script.data");
    var rows = [];
    try { rows = JSON.parse(dataEl.textContent); } catch (e) { return; }
    if (!rows.length) return;
    var title = el.getAttribute("data-title") || "";
    var unit = el.getAttribute("data-unit") || "";
    var max = Math.max.apply(null, rows.map(function (r) { return r.value; }));
    var html = (title ? '<div class="bars-title">' + title + "</div>" : "") +
      (unit ? '<div class="bars-unit">' + unit + "</div>" : "");
    rows.forEach(function (r) {
      html += '<div class="bar-row"><div class="bar-label">' + r.label + '</div>' +
        '<div class="bar-track"><div class="bar-fill ' + (r.kind || "") + '" data-w="' +
        (max ? (r.value / max) * 100 : 0) + '"></div></div>' +
        '<div class="bar-val">' + (r.display || r.value) + (r.note ? " " + r.note : "") + "</div></div>";
    });
    var holder = document.createElement("div");
    holder.innerHTML = html;
    el.appendChild(holder);
    var fills = el.querySelectorAll(".bar-fill");
    function animate() {
      fills.forEach(function (f) { f.style.width = f.getAttribute("data-w") + "%"; });
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { animate(); io.disconnect(); } });
      }, { threshold: 0.25 });
      io.observe(el);
    } else { animate(); }
  });

  /* ---------- Harvest-now-decrypt-later calculator ---------- */
  var hndl = document.getElementById("hndlWidget");
  if (hndl) {
    var life = hndl.querySelector("#hndlLife");
    var qday = hndl.querySelector("#hndlQday");
    var mig = hndl.querySelector("#hndlMig");
    var lifeV = hndl.querySelector("#hndlLifeV");
    var qdayV = hndl.querySelector("#hndlQdayV");
    var migV = hndl.querySelector("#hndlMigV");
    var out = hndl.querySelector("#hndlOut");
    function calcHndl() {
      var L = Number(life.value), Q = Number(qday.value), M = Number(mig.value);
      lifeV.textContent = L + " yr"; qdayV.textContent = Q + " yr"; migV.textContent = M + " yr";
      // Mosca's scheduling inequality (X + Y > Z) and HNDL exposure answer
      // different questions, so the widget reports both instead of combining them.
      var exposure = Math.max(0, L - Q);
      var scheduleDeficit = Math.max(0, L + M - Q);
      var urgent = L + M > Q;
      out.className = "sl-readout " + (urgent ? "risk" : "safe");
      out.innerHTML = (urgent ? "\u26A0\uFE0F <b>Start the migration now.</b>" : "\u2705 <b>The current schedule has margin.</b>") +
        '<span class="hndl-results"><span><b>' + exposure + ' years</b> confidentiality exposure after the assumed Q-day</span>' +
        '<span><b>' + scheduleDeficit + ' years</b> schedule deficit under X + Y &gt; Z</span></span>' +
        '<small>Inputs: data lifetime X = ' + L + ' years; migration time Y = ' + M +
        ' years; assumed Q-day Z = ' + Q + ' years. Treat Z as an uncertain planning assumption, not a forecast.</small>';
    }
    [life, qday, mig].forEach(function (s) { if (s) s.addEventListener("input", calcHndl); });
    calcHndl();
  }

  /* ---------- CBOM builder ---------- */
  var cbom = document.getElementById("cbomWidget");
  if (cbom) {
    var COLS = ["System", "Crypto job", "Algorithm", "Key/param", "Library/product", "Dependency", "Data lifetime", "Lifetime score", "Exposure score", "Public-key dependence score", "Migration difficulty score", "Confidence", "Owner", "PQC status"];
    var SCORE_START = 7;
    var seed = [
      ["Public API", "TLS key establishment", "X25519", "256-bit", "nginx / OpenSSL 3.x", "Public CA + load balancer", "1 year", "1", "3", "3", "2", "High", "Team Web", "Plan hybrid"],
      ["Firmware signing", "Signature", "ECDSA P-256", "256-bit", "Offline HSM", "Boot ROM + update service", "10+ years", "3", "2", "3", "3", "High", "Team Device", "At risk"],
      ["Backups", "Envelope encryption", "AES-256-GCM + RSA-OAEP wrap", "AES-256 / RSA-3072", "Cloud KMS", "KMS asymmetric wrapping key", "7 years", "3", "2", "3", "2", "Medium", "Team Data", "At risk"]
    ];
    var body = cbom.querySelector("tbody");
    function scoreFor(tr) {
      var controls = tr.querySelectorAll("[data-field]");
      var score = 0;
      for (var i = SCORE_START; i < SCORE_START + 4; i++) score += Number(controls[i].value || 1);
      return score;
    }
    function priorityFor(score) {
      if (score >= 10) return { c: "var(--red)", t: "Tier 1" };
      if (score >= 7) return { c: "var(--amber)", t: "Tier 2" };
      return { c: "var(--green)", t: "Tier 3" };
    }
    function makeSelect(values, selected, label) {
      var s = document.createElement("select");
      s.setAttribute("data-field", "");
      s.setAttribute("aria-label", label);
      values.forEach(function (v) {
        var o = document.createElement("option"); o.value = v; o.textContent = v;
        if (String(v) === String(selected)) o.selected = true;
        s.appendChild(o);
      });
      return s;
    }
    function addRow(vals) {
      vals = vals || COLS.map(function () { return ""; });
      var tr = document.createElement("tr");
      COLS.forEach(function (label, i) {
        var td = document.createElement("td");
        if (i >= SCORE_START && i < SCORE_START + 4) {
          td.appendChild(makeSelect(["1", "2", "3"], vals[i] || "1", label + " score"));
        } else if (i === 11) {
          td.appendChild(makeSelect(["High", "Medium", "Low"], vals[i] || "Medium", label));
        } else if (i === 13) {
          td.appendChild(makeSelect(["At risk", "Plan hybrid", "Ready", "Review"], vals[i] || "Review", label));
        } else {
          var input = document.createElement("input");
          input.type = "text"; input.value = vals[i] || ""; input.setAttribute("data-field", ""); input.setAttribute("aria-label", label);
          td.appendChild(input);
        }
        tr.appendChild(td);
      });
      var scoreCell = document.createElement("td"); scoreCell.className = "score-cell"; tr.appendChild(scoreCell);
      var priorityCell = document.createElement("td"); priorityCell.className = "risk-cell"; tr.appendChild(priorityCell);
      var del = document.createElement("td");
      var b = document.createElement("button");
      b.className = "del"; b.textContent = "\u00D7"; b.title = "Delete row"; b.setAttribute("aria-label", "Delete CBOM row");
      b.addEventListener("click", function () { tr.remove(); });
      del.appendChild(b); tr.appendChild(del);
      body.appendChild(tr);
      tr.querySelectorAll("select").forEach(function (s) { s.addEventListener("change", function () { paintScore(tr); }); });
      paintScore(tr);
    }
    function paintScore(tr) {
      var score = scoreFor(tr), p = priorityFor(score);
      tr.querySelector(".score-cell").textContent = score + "/12";
      var pc = tr.querySelector(".risk-cell"); pc.textContent = p.t; pc.style.color = p.c;
    }
    seed.forEach(addRow);
    var addBtn = cbom.querySelector("#cbomAdd");
    if (addBtn) addBtn.addEventListener("click", function () { addRow(); });
    function collect() {
      return [].slice.call(body.querySelectorAll("tr")).map(function (tr) {
        var fields = tr.querySelectorAll("[data-field]");
        var row = COLS.map(function (_, i) { return fields[i].value.trim(); });
        row.push(String(scoreFor(tr)), priorityFor(scoreFor(tr)).t);
        return row;
      });
    }
    function download(name, text, type) {
      var blob = new Blob([text], { type: type });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 200);
    }
    var csvBtn = cbom.querySelector("#cbomCsv");
    if (csvBtn) csvBtn.addEventListener("click", function () {
      var rows = [COLS.concat(["Score", "Priority"])].concat(collect());
      var csv = rows.map(function (r) {
        return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(",");
      }).join("\n");
      download("cbom.csv", csv, "text/csv");
    });
    var jsonBtn = cbom.querySelector("#cbomJson");
    if (jsonBtn) jsonBtn.addEventListener("click", function () {
      var out = collect().map(function (r) {
        var headers = COLS.concat(["Score", "Priority"]), o = {};
        headers.forEach(function (c, i) { o[c] = r[i]; }); return o;
      });
      download("cbom.json", JSON.stringify(out, null, 2), "application/json");
    });
    var sortBtn = cbom.querySelector("#cbomSort");
    if (sortBtn) sortBtn.addEventListener("click", function () {
      [].slice.call(body.querySelectorAll("tr")).sort(function (a, b) { return scoreFor(b) - scoreFor(a); })
        .forEach(function (tr) { body.appendChild(tr); });
    });
  }

  /* ---------- Glossary popover for inline terms ---------- */
  var pop, popOwner;
  function closePop() {
    if (pop) { pop.remove(); pop = null; }
    if (popOwner) { popOwner.setAttribute("aria-expanded", "false"); popOwner = null; }
  }
  function showTerm(t) {
    closePop();
    popOwner = t;
    pop = document.createElement("div");
    pop.id = "termPopover";
    pop.className = "term-popover";
    pop.setAttribute("role", "tooltip");
    pop.textContent = t.getAttribute("data-def");
    document.body.appendChild(pop);
    t.setAttribute("aria-describedby", pop.id);
    t.setAttribute("aria-expanded", "true");
    var r = t.getBoundingClientRect();
    pop.style.left = Math.max(8, Math.min(window.scrollX + r.left, window.scrollX + window.innerWidth - pop.offsetWidth - 8)) + "px";
    pop.style.top = (window.scrollY + r.bottom + 6) + "px";
  }
  document.querySelectorAll(".term[data-def]").forEach(function (t) {
    if (!t.getAttribute("title")) t.setAttribute("title", t.getAttribute("data-def"));
    t.setAttribute("tabindex", "0");
    t.setAttribute("role", "button");
    t.setAttribute("aria-expanded", "false");
    t.addEventListener("click", function (e) {
      e.stopPropagation();
      if (popOwner === t) closePop(); else showTerm(t);
    });
    t.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); if (popOwner === t) closePop(); else showTerm(t); }
      if (e.key === "Escape" && popOwner === t) { e.preventDefault(); closePop(); }
    });
  });
  document.addEventListener("click", closePop);

  /* ---------- Index: render progress + checkmarks ---------- */
  var idx = document.getElementById("moduleGrid");
  if (idx) {
    var prog = readProgress();
    var cards = idx.querySelectorAll('.card-link[href^="PQC-"]');
    var done = 0;
    cards.forEach(function (link) {
      var id = (link.getAttribute("href") || "").replace(/\.html.*$/, "");
      var card = link.querySelector(".card") || link;
      link.setAttribute("data-module", id);
      var chk = card.querySelector(".check");
      if (!chk) { chk = document.createElement("span"); chk.className = "check"; chk.setAttribute("aria-hidden", "true"); card.appendChild(chk); }
      if (prog[id] && prog[id].done) { card.classList.add("done"); done++; chk.textContent = "\u2713"; }
    });
    var pct = cards.length ? Math.round((done / cards.length) * 100) : 0;
    var fill = document.getElementById("progressFill");
    var label = document.getElementById("progressLabel");
    if (fill) fill.style.width = pct + "%";
    var progressTrack = fill ? fill.parentElement : null;
    if (progressTrack) progressTrack.setAttribute("aria-valuenow", String(pct));
    if (label) label.textContent = done + " of " + cards.length + " modules complete (" + pct + "%)";
    var resetAll = document.getElementById("resetProgress");
    if (resetAll) resetAll.addEventListener("click", function () {
      if (confirm("Reset your progress across all modules?")) { writeProgress({}); location.reload(); }
    });
  }
})();
