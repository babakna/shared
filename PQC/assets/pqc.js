/* PQC Learning Lab shared engine - V3.0 */
(function () {
  "use strict";
  var VERSION = "V3.0 (July 2026)";
  var root = document.documentElement;

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
    openHelp.forEach(function (b) { b.addEventListener("click", function () { help.classList.add("open"); }); });
    var closeHelp = document.getElementById("closeHelp");
    if (closeHelp) closeHelp.addEventListener("click", function () { help.classList.remove("open"); });
    help.addEventListener("click", function (e) { if (e.target === help) help.classList.remove("open"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") help.classList.remove("open"); });
    var hv = help.querySelector("[data-help-version]");
    if (hv) hv.textContent = VERSION;
  }

  /* ---------- Reveal answers (labs) ---------- */
  document.querySelectorAll(".reveal").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var card = btn.closest(".case");
      if (!card) return;
      card.classList.toggle("open");
      btn.textContent = card.classList.contains("open") ? "Hide answer" : "Show recommended answer";
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

  /* ---------- Stepper widget ---------- */
  document.querySelectorAll(".pqc-stepper").forEach(function (el) {
    var dataEl = el.querySelector("script.steps");
    var steps = [];
    try { steps = JSON.parse(dataEl.textContent); } catch (e) { return; }
    if (!steps.length) return;
    var title = el.getAttribute("data-title") || "Walkthrough";
    var cur = 0, seen = {};
    var wrap = document.createElement("div");
    wrap.innerHTML =
      '<div class="st-top"><span class="st-title">' + title + '</span>' +
      '<span class="st-count"></span></div>' +
      '<div class="st-dots"></div>' +
      '<div class="st-body"></div>' +
      '<div class="st-nav"><button class="btn small st-prev">\u2190 Prev</button>' +
      '<button class="btn small primary st-next">Next \u2192</button></div>';
    el.appendChild(wrap);
    var dotsEl = wrap.querySelector(".st-dots");
    var bodyEl = wrap.querySelector(".st-body");
    var countEl = wrap.querySelector(".st-count");
    steps.forEach(function (s, i) {
      var d = document.createElement("button");
      d.className = "st-dot";
      d.setAttribute("aria-label", "Step " + (i + 1));
      d.addEventListener("click", function () { cur = i; draw(); });
      dotsEl.appendChild(d);
    });
    function draw() {
      seen[cur] = true;
      var s = steps[cur];
      bodyEl.innerHTML = "<h4>" + (cur + 1) + ". " + s.title + "</h4><p>" + s.body + "</p>" +
        (s.meta ? '<span class="st-meta">' + s.meta + "</span>" : "");
      countEl.textContent = "Step " + (cur + 1) + " of " + steps.length;
      dotsEl.querySelectorAll(".st-dot").forEach(function (d, i) {
        d.classList.toggle("on", i === cur);
        d.classList.toggle("done", !!seen[i] && i !== cur);
      });
      wrap.querySelector(".st-prev").disabled = cur === 0;
      wrap.querySelector(".st-next").disabled = cur === steps.length - 1;
    }
    wrap.querySelector(".st-prev").addEventListener("click", function () { if (cur > 0) { cur--; draw(); } });
    wrap.querySelector(".st-next").addEventListener("click", function () { if (cur < steps.length - 1) { cur++; draw(); } });
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
      // Data captured today stays sensitive until year L. If a quantum computer
      // arrives at year Q, any still-sensitive data captured now is exposed.
      var exposedYears = L - Q;
      var risky = exposedYears > 0;
      out.className = "sl-readout " + (risky ? "risk" : "safe");
      if (risky) {
        out.innerHTML = "\u26A0\uFE0F <b>Harvest-now-decrypt-later risk.</b> Data captured today is still sensitive for <span class='sl-val'>" +
          L + "</span> years, but a capable quantum computer may arrive in <span class='sl-val'>" + Q +
          "</span> years \u2014 leaving about <span class='sl-val'>" + exposedYears +
          "</span> years where captured traffic could be decrypted while it still matters. Because migration takes ~<span class='sl-val'>" +
          M + "</span> years, this system should move early.";
      } else {
        out.innerHTML = "\u2705 <b>Lower harvest-now urgency.</b> Data stops being sensitive in <span class='sl-val'>" +
          L + "</span> years, before a capable quantum computer is expected (~<span class='sl-val'>" + Q +
          "</span> years). Still inventory it and migrate on the normal ~<span class='sl-val'>" + M +
          "</span>-year refresh cycle \u2014 assumptions can change.";
      }
    }
    [life, qday, mig].forEach(function (s) { if (s) s.addEventListener("input", calcHndl); });
    calcHndl();
  }

  /* ---------- CBOM builder ---------- */
  var cbom = document.getElementById("cbomWidget");
  if (cbom) {
    var COLS = ["System", "Crypto job", "Algorithm", "Key/param", "Library/product", "Data lifetime", "Owner", "PQC status"];
    var seed = [
      ["Public API", "TLS key exchange", "ECDHE X25519", "256-bit", "nginx / OpenSSL 3.x", "1 year", "Team Web", "Plan hybrid"],
      ["Firmware signing", "Signature", "ECDSA P-256", "256-bit", "Offline HSM", "10+ years", "Team Device", "At risk"],
      ["Backups", "Data at rest", "AES-256-GCM", "256-bit", "Cloud KMS", "7 years", "Team Data", "OK (rewrap keys)"]
    ];
    var body = cbom.querySelector("tbody");
    function riskFor(status) {
      var s = (status || "").toLowerCase();
      if (s.indexOf("at risk") > -1) return { c: "var(--red)", t: "High" };
      if (s.indexOf("plan") > -1) return { c: "var(--amber)", t: "Medium" };
      return { c: "var(--green)", t: "Low" };
    }
    function addRow(vals) {
      vals = vals || COLS.map(function () { return ""; });
      var tr = document.createElement("tr");
      COLS.forEach(function (_, i) {
        var td = document.createElement("td");
        td.setAttribute("contenteditable", "true");
        td.textContent = vals[i] || "";
        if (i === COLS.length - 1) td.addEventListener("input", function () { paintRisk(tr); });
        tr.appendChild(td);
      });
      var rc = document.createElement("td");
      rc.className = "risk-cell";
      tr.appendChild(rc);
      var del = document.createElement("td");
      var b = document.createElement("button");
      b.className = "del"; b.textContent = "\u00D7"; b.title = "Delete row";
      b.addEventListener("click", function () { tr.remove(); });
      del.appendChild(b); tr.appendChild(del);
      body.appendChild(tr);
      paintRisk(tr);
    }
    function paintRisk(tr) {
      var tds = tr.querySelectorAll("td");
      var status = tds[COLS.length - 1].textContent;
      var r = riskFor(status);
      var rc = tds[COLS.length];
      rc.textContent = r.t; rc.style.color = r.c;
    }
    seed.forEach(addRow);
    var addBtn = cbom.querySelector("#cbomAdd");
    if (addBtn) addBtn.addEventListener("click", function () { addRow(); });
    function collect() {
      return [].slice.call(body.querySelectorAll("tr")).map(function (tr) {
        var tds = tr.querySelectorAll("td");
        return COLS.map(function (_, i) { return tds[i].textContent.trim(); });
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
      var rows = [COLS].concat(collect());
      var csv = rows.map(function (r) {
        return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(",");
      }).join("\n");
      download("cbom.csv", csv, "text/csv");
    });
    var jsonBtn = cbom.querySelector("#cbomJson");
    if (jsonBtn) jsonBtn.addEventListener("click", function () {
      var out = collect().map(function (r) {
        var o = {}; COLS.forEach(function (c, i) { o[c] = r[i]; }); return o;
      });
      download("cbom.json", JSON.stringify(out, null, 2), "application/json");
    });
  }

  /* ---------- Glossary popover for inline terms ---------- */
  var pop;
  function closePop() { if (pop) { pop.remove(); pop = null; } }
  document.querySelectorAll(".term[data-def]").forEach(function (t) {
    if (!t.getAttribute("title")) t.setAttribute("title", t.getAttribute("data-def"));
    t.addEventListener("click", function (e) {
      e.stopPropagation();
      closePop();
      pop = document.createElement("div");
      pop.textContent = t.getAttribute("data-def");
      pop.style.cssText = "position:absolute;z-index:70;max-width:280px;background:var(--card);color:var(--muted);border:1px solid var(--line);border-radius:10px;padding:10px 12px;box-shadow:var(--shadow);font-size:.86rem;font-weight:500";
      document.body.appendChild(pop);
      var r = t.getBoundingClientRect();
      pop.style.left = Math.min(window.scrollX + r.left, window.scrollX + window.innerWidth - 300) + "px";
      pop.style.top = (window.scrollY + r.bottom + 6) + "px";
    });
  });
  document.addEventListener("click", closePop);

  /* ---------- Index: render progress + checkmarks ---------- */
  var idx = document.getElementById("moduleGrid");
  if (idx) {
    var prog = readProgress();
    var cards = idx.querySelectorAll(".card[data-module]");
    var done = 0;
    cards.forEach(function (c) {
      var id = c.getAttribute("data-module");
      if (prog[id] && prog[id].done) { c.classList.add("done"); done++; }
      var chk = c.querySelector(".check"); if (chk) chk.textContent = "\u2713";
    });
    var pct = cards.length ? Math.round((done / cards.length) * 100) : 0;
    var fill = document.getElementById("progressFill");
    var label = document.getElementById("progressLabel");
    if (fill) fill.style.width = pct + "%";
    if (label) label.textContent = done + " of " + cards.length + " modules complete (" + pct + "%)";
    var resetAll = document.getElementById("resetProgress");
    if (resetAll) resetAll.addEventListener("click", function () {
      if (confirm("Reset your progress across all modules?")) { writeProgress({}); location.reload(); }
    });
  }
})();
