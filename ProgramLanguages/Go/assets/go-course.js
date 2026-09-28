(function () {
  "use strict";

  const course = window.GoCourse;
  if (!course || !Array.isArray(course.modules)) throw new Error("Course data did not load");

  const TRACKS = {
    Beginner:{file:"go-101.html",title:"Go Foundations",range:"GO-001–GO-008",lead:"Build a trustworthy VS Code toolchain, then master packages, types, errors, collections, interfaces and testing.",accent:"teal",icon:"editor"},
    Intermediate:{file:"go-201.html",title:"Applied Go Systems",range:"GO-009–GO-017",lead:"Apply generics, goroutines, context, I/O, HTTP, PostgreSQL, modules and production-quality CLI design.",accent:"blue",icon:"server"},
    Advanced:{file:"go-301.html",title:"Production Go",range:"GO-018–GO-025",lead:"Engineer memory, profiles, architecture, security, concurrency, verification, reliability and delivery evidence.",accent:"violet",icon:"architecture"},
    Capstones:{file:"go-401.html",title:"Capstone Studio",range:"GO-026–GO-029",lead:"Deliver a CLI/package, secured API, concurrent pipeline or distributed service with inspectable evidence.",accent:"rose",icon:"capstone"},
    Reference:{file:"go-reference.html",title:"Reference and Continuing Practice",range:"GO-030–GO-032",lead:"Diagnose environments, select ecosystem responsibilities and modernize legacy Go deliberately.",accent:"amber",icon:"library"}
  };

  const body = document.body;
  const view = body.dataset.view || "track";
  const activeTrack = body.dataset.track || "";
  const STORAGE = course.storageKey;
  const state = loadState();

  renderShell();
  applyTheme(state.theme);
  bindGlobalControls();
  renderResources();
  renderPlacement();

  if (view === "home") renderHome();
  else {
    renderTrackNavigation();
    window.addEventListener("hashchange", renderRoute);
    renderRoute();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function slug(value) {
    return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function loadState() {
    const fallback = {done:{},quiz:{},drafts:{},last:"GO-001",theme:"light"};
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE) || "{}");
      return {
        done:saved.done && typeof saved.done === "object" ? saved.done : {},
        quiz:saved.quiz && typeof saved.quiz === "object" ? saved.quiz : {},
        drafts:saved.drafts && typeof saved.drafts === "object" ? saved.drafts : {},
        last:course.modules.some(module => module.id === saved.last) ? saved.last : "GO-001",
        theme:saved.theme === "dark" ? "dark" : "light"
      };
    } catch {
      return fallback;
    }
  }

  function saveState() {
    try { localStorage.setItem(STORAGE, JSON.stringify(state)); }
    catch { showToast("This browser could not save progress."); }
  }

  function renderShell() {
    const trackNav = Object.entries(TRACKS).map(([key, track], index) =>
      `${index === 3 ? '<span class="nav-divider" aria-hidden="true">•</span>' : ''}<a href="${track.file}" data-track-link="${key}">${key}</a>`
    ).join('<span class="nav-arrow" aria-hidden="true">→</span>');

    body.innerHTML = `
      <a class="skip-link" href="#mainContent">Skip to lesson content</a>
      <header class="topbar">
        <a class="home-button" href="index.html" aria-label="Go Learning Lab home">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 3l9 8.5M5.5 10v10h5v-6h3v6h5V10"/></svg><span>Home</span>
        </a>
        <a class="brand" href="index.html"><img src="assets/go-logo.svg" alt=""><span><b>Go Learning Lab</b><small>VS Code · Modules · Services</small></span></a>
        <div class="top-actions">
          <span class="version">V${course.version} · ${course.release}</span>
          ${view !== "home" ? '<button class="button quiet module-menu-button" type="button" data-menu>Modules</button>' : ''}
          <button class="button quiet" type="button" data-open="resourcesDialog">Resources</button>
          <button class="button quiet" type="button" data-open="helpDialog">Help</button>
          <button class="button icon" type="button" data-theme aria-label="Switch color theme">Dark</button>
        </div>
      </header>
      <nav class="track-nav" aria-label="Learning paths">${trackNav}</nav>
      <div class="nav-backdrop" data-close-menu></div>
      <div class="app-shell ${view === "home" ? "home-shell" : ""}">
        ${view === "home" ? "" : `
          <aside class="course-nav" aria-label="Current path modules">
            <div class="drawer-head"><b>${escapeHtml(activeTrack)} modules</b><button type="button" data-close-menu aria-label="Close module menu">×</button></div>
            <div class="nav-head"><label for="courseSearch">Find a module</label><input id="courseSearch" type="search" autocomplete="off" spellcheck="false" placeholder="Try: goroutines, context, HTTP"><p>Search titles, lessons and domain tags in this path.</p></div>
            <section class="progress-card" aria-label="Course progress"><div><b>Your progress</b><span id="progressText"></span></div><div class="progress-track" aria-hidden="true"><span id="progressBar"></span></div><button class="text-button" type="button" data-reset>Reset saved course data</button></section>
            <nav id="moduleNav" aria-label="Modules"></nav>
            <p class="privacy-note"><b>Private by default.</b> Completion and drafts remain in this browser and can be cleared.</p>
          </aside>`}
        <main id="mainContent" tabindex="-1"></main>
      </div>
      <footer><span>Namiranian, Babak</span><span>Go Learning Lab · V${course.version} (${course.release})</span><span>Local-first · No tracking</span></footer>
      <button class="to-top" type="button" data-to-top aria-label="Return to top">↑ <span>Top</span></button>
      <dialog id="helpDialog" class="modal" aria-labelledby="helpTitle">
        <form method="dialog"><button class="modal-close" aria-label="Close Help">×</button></form>
        <p class="eyebrow">Help</p><h2 id="helpTitle">Learn without losing your place</h2>
        <div class="help-grid">
          <section><h3>Choose a path</h3><p>Use Placement if you are unsure. Every path stays reachable, so advancing never locks earlier lessons.</p></section>
          <section><h3>Work in VS Code</h3><p>Predict, run, inspect and explain. Copy buttons accelerate setup; they do not replace understanding the command or code.</p></section>
          <section><h3>Open modules safely</h3><p>Module cards and sidebar links open in a new tab. Previous and Next stay inside the focused lesson tab.</p></section>
          <section><h3>Save and reset</h3><p>Only explicit “Mark module complete” actions count. Progress, quiz results and drafts use local browser storage and are not permanent backup.</p></section>
        </div>
      </dialog>
      <dialog id="resourcesDialog" class="modal resource-modal" aria-labelledby="resourcesTitle">
        <form method="dialog"><button class="modal-close" aria-label="Close Resources">×</button></form>
        <p class="eyebrow">Curated library</p><h2 id="resourcesTitle">Resources with purpose, cost and currency</h2>
        <p>Official or primary sources settle changing behavior. Books, courses and videos provide additional teaching; version-sensitive examples must be checked against current documentation.</p>
        <label class="resource-search" for="resourceSearch">Filter resources<input id="resourceSearch" type="search" placeholder="Try: Coursera, YouTube, Go, free"></label>
        <div id="resourceDirectory"></div>
      </dialog>
      <dialog id="placementDialog" class="modal" aria-labelledby="placementTitle">
        <form method="dialog"><button class="modal-close" aria-label="Close Placement guide">×</button></form>
        <p class="eyebrow">Placement guide</p><h2 id="placementTitle">Choose the earliest uncertain point</h2><div id="placementContent"></div>
      </dialog>
      <div id="toast" class="toast" role="status" aria-live="polite"></div>`;

    if (view === "home") document.querySelector(".home-button").setAttribute("aria-current", "page");
    const currentTrack = document.querySelector(`[data-track-link="${CSS.escape(activeTrack)}"]`);
    if (currentTrack) currentTrack.setAttribute("aria-current", "page");
  }

  function bindGlobalControls() {
    document.addEventListener("click", event => {
      const opener = event.target.closest("[data-open]");
      if (opener) document.getElementById(opener.dataset.open)?.showModal();
      if (event.target.closest("button[data-theme]")) {
        state.theme = state.theme === "dark" ? "light" : "dark";
        applyTheme(state.theme);
        saveState();
      }
      if (event.target.closest("[data-menu]")) body.classList.add("nav-open");
      if (event.target.closest("[data-close-menu]")) body.classList.remove("nav-open");
      if (event.target.closest("[data-to-top]")) window.scrollTo({top:0,behavior:"smooth"});
      const scroller = event.target.closest("[data-scroll-target]");
      if (scroller) {
        event.preventDefault();
        document.getElementById(scroller.dataset.scrollTarget)?.scrollIntoView({block:"start"});
      }
      const copy = event.target.closest("[data-copy]");
      if (copy) copyText(copy.dataset.copy, copy);
      if (event.target.closest("[data-reset]")) resetCourse();
    });
    window.addEventListener("scroll", () => document.querySelector("[data-to-top]")?.classList.toggle("visible", window.scrollY > 550), {passive:true});
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const button = document.querySelector("button[data-theme]");
    if (button) button.textContent = theme === "dark" ? "Light" : "Dark";
  }

  function resetCourse() {
    if (!confirm("Reset all Go Learning Lab completion, quiz and draft data stored in this browser?")) return;
    localStorage.removeItem(STORAGE);
    state.done = {}; state.quiz = {}; state.drafts = {}; state.last = "GO-001";
    updateProgress();
    renderRoute();
    showToast("Saved course data was reset.");
  }

  function renderHome() {
    const main = document.getElementById("mainContent");
    const doneCount = Object.keys(state.done).filter(id => state.done[id]).length;
    const last = course.modules.find(module => module.id === state.last) || course.modules[0];
    main.innerHTML = `
      <section class="home-hero">
        <div class="hero-copy"><p class="eyebrow">A complete, practical learning path</p><h1>Understand Go.<br><span>Build with evidence.</span></h1>
          <p class="hero-lead">Learn Go deeply from packages and modules through runtime behavior, then build reliable command-line tools, concurrent pipelines, database-backed APIs and distributed services through VS Code and free local tools.</p>
          <div class="hero-actions"><button class="button primary" type="button" data-open="placementDialog">Find my starting point</button><a class="button secondary" href="${fileFor(last)}#${last.id.toLowerCase()}" target="_blank" rel="noopener noreferrer">Resume ${escapeHtml(last.id)}</a></div>
          <div class="hero-facts"><span><b>${course.modules.length}</b> substantial modules</span><span><b>${doneCount}</b> completed locally</span><span><b>4</b> portfolio capstones</span></div>
        </div>
        <div class="hero-art" aria-hidden="true">${heroGraphic()}</div>
      </section>
      <section class="orientation-strip"><div><p class="eyebrow">Your map</p><h2>Move forward without losing the way back</h2></div><p>Each stage has its own landing page and linked module map. Module cards open in a new tab, while Home and the stage bar remain visible everywhere.</p></section>
      <section class="path-grid" aria-label="Learning paths">${Object.entries(TRACKS).map(([key, track], index) => pathCard(key, track, index)).join("")}</section>
      <section class="course-principles">
        <div><p class="eyebrow">How teaching works here</p><h2>Explanation becomes skill through action</h2></div>
        <div class="principle-grid">
          <article><span>01</span><h3>Build the mental model</h3><p>Connected explanations and visual flows show what the runtime, host and system are actually doing.</p></article>
          <article><span>02</span><h3>Predict and inspect</h3><p>Examples are annotated, syntax highlighted and runnable in VS Code—with failure cases, not only happy paths.</p></article>
          <article><span>03</span><h3>Practice progressively</h3><p>Diagnostics, quizzes, hints, partial implementations and projects increase independence in controlled steps.</p></article>
          <article><span>04</span><h3>Prove the outcome</h3><p>Completion criteria and evidence ledgers separate implemented, tested, reviewed, deployed and device-verified claims.</p></article>
        </div>
      </section>`;
  }

  function pathCard(key, track, index) {
    const modules = modulesForTrack(key);
    const done = modules.filter(module => state.done[module.id]).length;
    return `<a class="path-card tone-${track.accent}" href="${track.file}">
      <div class="path-art">${moduleArt(track.icon, track.accent)}</div>
      <div class="path-index">${String(index + 1).padStart(2, "0")}</div>
      <p class="path-range">${escapeHtml(track.range)}</p><h2>${escapeHtml(track.title)}</h2><p>${escapeHtml(track.lead)}</p>
      <div class="path-meta"><span>${key === "Capstones" ? "Project studio" : `${modules.length} modules`}</span><span>${done} complete</span><b>Explore →</b></div>
    </a>`;
  }

  function modulesForTrack(track) {
    return course.modules.filter(module => module.track === track);
  }

  function fileFor(module) {
    if (module.track === "Beginner") return TRACKS.Beginner.file;
    if (module.track === "Intermediate") return TRACKS.Intermediate.file;
    if (module.track === "Advanced") return TRACKS.Advanced.file;
    if (module.track === "Capstones") return TRACKS.Capstones.file;
    return TRACKS.Reference.file;
  }

  function renderTrackNavigation() {
    const nav = document.getElementById("moduleNav");
    if (!nav) return;
    const modules = modulesForTrack(activeTrack);
    nav.innerHTML = `<a class="nav-item group-home" href="#home"><span>Map</span><b>${escapeHtml(TRACKS[activeTrack].title)}</b></a>` + modules.map(module =>
      `<a class="nav-item" data-nav-id="${module.id}" data-search="${escapeHtml(searchText(module))}" href="${fileFor(module)}#${module.id.toLowerCase()}" target="_blank" rel="noopener noreferrer"><span>${module.id}</span><b>${escapeHtml(module.title)}</b><i aria-hidden="true">${state.done[module.id] ? "✓" : ""}</i></a>`
    ).join("");
    const input = document.getElementById("courseSearch");
    input?.addEventListener("input", () => filterModuleLinks(input.value));
    updateProgress();
  }

  function renderRoute() {
    if (view === "home") return;
    body.classList.remove("nav-open");
    const raw = location.hash.replace(/^#/, "").toUpperCase();
    const module = course.modules.find(item => item.id === raw);
    if (!module || module.track !== activeTrack) {
      renderTrackMap();
      return;
    }
    state.last = module.id;
    saveState();
    renderLesson(module);
    document.querySelectorAll("[data-nav-id]").forEach(link => link.toggleAttribute("aria-current", link.dataset.navId === module.id));
    requestAnimationFrame(() => { window.scrollTo(0, 0); document.getElementById("mainContent")?.focus({preventScroll:true}); });
  }

  function renderTrackMap() {
    const track = TRACKS[activeTrack];
    const modules = modulesForTrack(activeTrack);
    document.title = `${track.title} — ${course.title}`;
    document.getElementById("mainContent").innerHTML = `
      <section class="track-hero tone-${track.accent}">
        <div><p class="eyebrow">${escapeHtml(activeTrack)} path · ${escapeHtml(track.range)}</p><h1>${escapeHtml(track.title)}</h1><p>${escapeHtml(track.lead)}</p>
          <div class="hero-actions"><a class="button primary" href="${fileFor(modules[0])}#${modules[0].id.toLowerCase()}" target="_blank" rel="noopener noreferrer">Start this path</a><button class="button secondary" type="button" data-open="placementDialog">Placement guide</button></div>
        </div><div class="track-art">${moduleArt(track.icon, track.accent)}</div>
      </section>
      <section class="module-map-intro"><div><p class="eyebrow">Linked modules</p><h2>Choose a focused lesson</h2></div><p>Every card opens the lesson in a new tab. Return to this map at any time; your explicit completion marks remain local to this browser.</p></section>
      <div class="domain-filter" role="group" aria-label="Filter modules by domain"><button class="active" type="button" data-domain="All">All domains</button>${["Core","Tooling","Backend","Cloud","Data","Performance","Quality"].map(domain => `<button type="button" data-domain="${domain}">${domain}</button>`).join("")}</div>
      <section class="module-grid">${modules.map(module => moduleCard(module)).join("")}</section>`;
    document.querySelectorAll("[data-domain]").forEach(button => button.addEventListener("click", () => {
      document.querySelectorAll("[data-domain]").forEach(item => item.classList.toggle("active", item === button));
      document.querySelectorAll(".module-card").forEach(card => { card.hidden = button.dataset.domain !== "All" && !card.dataset.domains.split(",").includes(button.dataset.domain); });
    }));
  }

  function moduleCard(module) {
    return `<a class="module-card tone-${module.accent}" data-search-id="${module.id}" data-search="${escapeHtml(searchText(module))}" data-domains="${escapeHtml(module.domains.join(","))}" href="${fileFor(module)}#${module.id.toLowerCase()}" target="_blank" rel="noopener noreferrer">
      <div class="module-art">${moduleArt(module.icon, module.accent)}</div>
      <div class="module-card-head"><span>${module.id}</span><span>${module.minutes} min</span></div>
      <div class="domain-tags">${module.domains.map(domain => `<span>${escapeHtml(domain)}</span>`).join("")}</div><h3>${escapeHtml(module.title)}</h3><p>${escapeHtml(module.summary)}</p>
      <div class="module-card-foot"><span>${module.chapters.length} chapters · lab · ${module.checks.length + 1} checks</span><b>${state.done[module.id] ? "Completed ✓" : "Open lesson ↗"}</b></div>
    </a>`;
  }

  function renderLesson(module) {
    const main = document.getElementById("mainContent");
    const globalIndex = course.modules.findIndex(item => item.id === module.id);
    const previous = course.modules[globalIndex - 1];
    const next = course.modules[globalIndex + 1];
    document.title = `${module.id} · ${module.title}`;
    main.innerHTML = `
      <article class="lesson tone-${module.accent}">
        <header class="lesson-hero">
          <div class="lesson-identity"><p class="eyebrow">${module.id} · ${escapeHtml(module.track)} · ${module.minutes} minutes</p><div class="domain-tags inverse">${module.domains.map(domain => `<span>${escapeHtml(domain)}</span>`).join("")}</div><h1>${escapeHtml(module.title)}</h1><p>${escapeHtml(module.summary)}</p>
            <div class="lesson-status"><span>${state.done[module.id] ? "Completed locally" : "Not yet marked complete"}</span><span>${module.prerequisites.length ? `Prerequisite: ${module.prerequisites.join(", ")}` : "No prerequisite"}</span></div>
          </div><div class="lesson-art">${moduleArt(module.icon, module.accent)}</div>
        </header>
        <nav class="chapter-nav" aria-label="On this page"><b>On this page</b>${module.chapters.map((chapter,index) => `<a href="#chapter-${index + 1}" data-scroll-target="chapter-${index + 1}">${index + 1}. ${escapeHtml(chapter.title)}</a>`).join("")}<a href="#practice" data-scroll-target="practice">Practice lab</a><a href="#knowledge-check" data-scroll-target="knowledge-check">Knowledge check</a></nav>
        <section class="outcomes"><div><p class="eyebrow">Learning contract</p><h2>After this lesson, you can</h2></div><ul>${module.outcomes.map(outcome => `<li>${escapeHtml(outcome)}</li>`).join("")}</ul></section>
        <div class="lesson-body">${module.chapters.map((chapter,index) => chapterHtml(chapter,index)).join("")}</div>
        ${modelHtml(module.model)}
        ${codePanel(module.example)}
        ${practiceHtml(module)}
        ${diagnosticHtml(module)}
        ${quizHtml(module)}
        ${projectHtml(module)}
        ${resourceLinks(module)}
        <section class="completion-panel"><div><p class="eyebrow">Your evidence</p><h2>Completion is an explicit decision</h2><p>Mark complete only after you ran the example, attempted the lab and can explain the diagnostic result. The course cannot observe work performed in your VS Code.</p></div><button class="button complete-button ${state.done[module.id] ? "done" : ""}" type="button" data-complete="${module.id}">${state.done[module.id] ? "Completed ✓ — click to undo" : "Mark module complete"}</button></section>
        <nav class="lesson-pagination" aria-label="Lesson sequence">
          ${previous ? `<a href="${fileFor(previous)}#${previous.id.toLowerCase()}"><span>← Previous</span><b>${escapeHtml(previous.title)}</b></a>` : '<span></span>'}
          ${next ? `<a class="next" href="${fileFor(next)}#${next.id.toLowerCase()}"><span>Next →</span><b>${escapeHtml(next.title)}</b></a>` : '<a class="next" href="index.html"><span>Finish →</span><b>Return Home</b></a>'}
        </nav>
      </article>`;

    bindLesson(module);
  }

  function chapterHtml(chapter, index) {
    return `<section class="lesson-chapter" id="chapter-${index + 1}"><div class="chapter-number">${String(index + 1).padStart(2, "0")}</div><div><h2>${escapeHtml(chapter.title)}</h2>${chapter.text.map(paragraph => `<p>${inlineCode(paragraph)}</p>`).join("")}${chapter.callout ? `<aside class="concept-callout"><b>Key idea</b><p>${inlineCode(chapter.callout)}</p></aside>` : ""}</div></section>`;
  }

  function inlineCode(text) {
    return escapeHtml(text).replace(/`([^`]+)`/g, "<code>$1</code>");
  }

  function modelHtml(model) {
    if (!model) return "";
    return `<section class="model-section"><div class="section-heading"><p class="eyebrow">Visual model</p><h2>${escapeHtml(model.title)}</h2></div><div class="model-flow">${model.steps.map((step,index) => `<div class="model-step"><span>${index + 1}</span><b>${escapeHtml(step.name)}</b><small>${escapeHtml(step.detail)}</small></div>${index < model.steps.length - 1 ? '<i aria-hidden="true">→</i>' : ""}`).join("")}</div></section>`;
  }

  function codePanel(example) {
    if (!example) return "";
    const id = `copy-${Math.random().toString(36).slice(2)}`;
    return `<section class="example-section"><div class="section-heading"><p class="eyebrow">Worked example</p><h2>${escapeHtml(example.title)}</h2></div><div class="code-window"><div class="code-toolbar"><span><i></i><i></i><i></i></span><b>${escapeHtml(example.language)}</b><button type="button" data-copy="${id}">Copy</button></div><pre><code id="${id}" class="language-${slug(example.language)}">${highlight(example.source)}</code></pre></div><ol class="annotation-list">${example.notes.map((note,index) => `<li><span>${index + 1}</span>${escapeHtml(note)}</li>`).join("")}</ol></section>`;
  }

  function highlight(source) {
    const pattern = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`[^`]*`|\b(?:break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go|goto|if|import|interface|map|package|range|return|select|struct|switch|type|var|any|comparable|true|false|iota|nil)\b|\b\d+(?:\.\d+)?\b)/g;
    let output = "";
    let last = 0;
    for (const match of source.matchAll(pattern)) {
      output += escapeHtml(source.slice(last, match.index));
      const token = match[0];
      let kind = "number";
      if (token.startsWith("//") || token.startsWith("/*")) kind = "comment";
      else if (["'",'"',"`"].includes(token[0])) kind = "string";
      else if (/^[A-Za-z]/.test(token)) kind = "keyword";
      output += `<span class="tok-${kind}">${escapeHtml(token)}</span>`;
      last = match.index + token.length;
    }
    return output + escapeHtml(source.slice(last));
  }

  function practiceHtml(module) {
    const practice = module.practice;
    const draft = state.drafts[module.id] || "";
    const starterId = `starter-${module.id}`;
    return `<section class="practice-section" id="practice"><div class="section-heading"><p class="eyebrow">Work in VS Code</p><h2>${escapeHtml(practice.title)}</h2><p>${escapeHtml(practice.brief)}</p></div>
      <div class="practice-grid"><div class="practice-steps"><h3>Build sequence</h3><ol>${practice.steps.map(step => `<li>${escapeHtml(step)}</li>`).join("")}</ol></div><div class="criteria-card"><h3>Completion criteria</h3><ul>${practice.criteria.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div></div>
      <div class="code-window"><div class="code-toolbar"><span><i></i><i></i><i></i></span><b>Starter</b><button type="button" data-copy="${starterId}">Copy starter</button></div><pre><code id="${starterId}">${highlight(practice.starter)}</code></pre></div>
      <div class="draft-box"><label for="draft-${module.id}"><b>Your working notes or code</b><span>Saved locally in this browser</span></label><textarea id="draft-${module.id}" data-draft="${module.id}" spellcheck="false" placeholder="Record your prediction, approach, errors and correction…">${escapeHtml(draft)}</textarea></div>
      <div class="hints"><h3>Progressive hints</h3>${practice.hints.map((hint,index) => `<details><summary>Hint ${index + 1}</summary><p>${escapeHtml(hint)}</p></details>`).join("")}</div>
    </section>`;
  }

  function diagnosticHtml(module) {
    const diagnostic = module.diagnostic;
    return `<section class="diagnostic-section"><div class="section-heading"><p class="eyebrow">Failure analysis</p><h2>${escapeHtml(diagnostic.title)}</h2><p>${escapeHtml(diagnostic.prompt)}</p></div><form data-diagnostic="${module.id}"><fieldset><legend>Choose the causal explanation</legend>${diagnostic.options.map((option,index) => `<label><input type="radio" name="diagnostic" value="${index}"><span>${escapeHtml(option)}</span></label>`).join("")}</fieldset><button class="button secondary" type="submit">Check diagnosis</button><p class="feedback" role="status"></p></form></section>`;
  }

  function quizHtml(module) {
    return `<section class="quiz-section" id="knowledge-check"><div class="section-heading"><p class="eyebrow">Retrieval practice</p><h2>Knowledge check</h2><p>Answer without scrolling back first. Explanation—not the score—is the durable part.</p></div><form data-quiz="${module.id}">${module.checks.map((check,qIndex) => `<fieldset data-question="${qIndex}"><legend><span>${qIndex + 1}</span>${escapeHtml(check.q)}</legend>${check.options.map((option,oIndex) => `<label><input type="radio" name="q-${qIndex}" value="${oIndex}"><span>${escapeHtml(option)}</span></label>`).join("")}<p class="answer-note"></p></fieldset>`).join("")}<button class="button primary" type="submit">Score and explain</button><p class="quiz-summary" role="status"></p></form></section>`;
  }

  function projectHtml(module) {
    return `<section class="project-section"><div class="project-mark">◆</div><div><p class="eyebrow">Transfer challenge</p><h2>Apply the lesson beyond the example</h2><p>${escapeHtml(module.project)}</p></div></section>`;
  }

  function resourceLinks(module) {
    const resources = module.resources.map(id => course.resources.find(resource => resource.id === id)).filter(Boolean);
    return `<section class="lesson-resources"><div class="section-heading"><p class="eyebrow">Go deeper</p><h2>Selected references</h2></div><div>${resources.map(resource => `<a href="${escapeHtml(resource.url)}" target="_blank" rel="noopener noreferrer"><span>${escapeHtml(resource.kind)} · ${escapeHtml(resource.access)}</span><b>${escapeHtml(resource.title)}</b><p>${escapeHtml(resource.bestFor)}</p><small>${escapeHtml(resource.scope)}</small></a>`).join("")}</div></section>`;
  }

  function bindLesson(module) {
    document.querySelector(`[data-complete="${module.id}"]`)?.addEventListener("click", event => {
      state.done[module.id] = !state.done[module.id];
      saveState(); updateProgress();
      event.currentTarget.classList.toggle("done", state.done[module.id]);
      event.currentTarget.textContent = state.done[module.id] ? "Completed ✓ — click to undo" : "Mark module complete";
      document.querySelector(`[data-nav-id="${module.id}"] i`)?.replaceChildren(state.done[module.id] ? "✓" : "");
      showToast(state.done[module.id] ? `${module.id} marked complete.` : `${module.id} returned to incomplete.`);
    });
    document.querySelector(`[data-draft="${module.id}"]`)?.addEventListener("input", event => {
      state.drafts[module.id] = event.target.value;
      saveState();
    });
    document.querySelector(`[data-diagnostic="${module.id}"]`)?.addEventListener("submit", event => {
      event.preventDefault();
      const selected = new FormData(event.currentTarget).get("diagnostic");
      const feedback = event.currentTarget.querySelector(".feedback");
      if (selected === null) { feedback.textContent = "Choose an explanation first."; return; }
      const correct = Number(selected) === module.diagnostic.answer;
      feedback.className = `feedback ${correct ? "correct" : "incorrect"}`;
      feedback.textContent = `${correct ? "Correct. " : "Not yet. "}${module.diagnostic.explanation}`;
    });
    document.querySelector(`[data-quiz="${module.id}"]`)?.addEventListener("submit", event => {
      event.preventDefault();
      let correct = 0;
      module.checks.forEach((check,index) => {
        const selected = new FormData(event.currentTarget).get(`q-${index}`);
        const field = event.currentTarget.querySelector(`[data-question="${index}"]`);
        const note = field.querySelector(".answer-note");
        if (selected === null) { note.className = "answer-note incomplete"; note.textContent = "Choose an answer."; return; }
        const good = Number(selected) === check.answer;
        if (good) correct += 1;
        note.className = `answer-note ${good ? "correct" : "incorrect"}`;
        note.textContent = `${good ? "Correct. " : `Answer: ${check.options[check.answer]}. `}${check.why}`;
      });
      state.quiz[module.id] = {score:correct,total:module.checks.length,at:new Date().toISOString()};
      saveState();
      const summary = event.currentTarget.querySelector(".quiz-summary");
      summary.textContent = `${correct} of ${module.checks.length} correct. Review every explanation, including correct answers.`;
    });
  }

  function updateProgress() {
    const total = course.modules.length;
    const done = course.modules.filter(module => state.done[module.id]).length;
    const text = document.getElementById("progressText");
    const bar = document.getElementById("progressBar");
    if (text) text.textContent = `${done} of ${total}`;
    if (bar) bar.style.width = `${(done / total) * 100}%`;
  }

  function searchText(module) {
    return [module.id,module.title,module.summary,...module.domains,...module.outcomes,...module.chapters.map(chapter => chapter.title)].join(" ").toLowerCase();
  }

  function filterModuleLinks(query) {
    const normalized = query.trim().toLowerCase();
    document.querySelectorAll("#moduleNav [data-search]").forEach(link => {
      link.hidden = normalized && !fuzzyMatch(normalized, link.dataset.search);
    });
    document.querySelectorAll(".module-grid [data-search]").forEach(card => {
      card.hidden = normalized && !fuzzyMatch(normalized, card.dataset.search);
    });
  }

  function fuzzyMatch(query, text) {
    if (text.includes(query)) return true;
    return query.split(/\s+/).every(word => text.split(/\W+/).some(candidate => candidate.includes(word) || editDistance(word, candidate) <= (word.length > 6 ? 2 : 1)));
  }

  function editDistance(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 99;
    const row = Array.from({length:b.length + 1}, (_, index) => index);
    for (let i = 1; i <= a.length; i += 1) {
      let previous = row[0]; row[0] = i;
      for (let j = 1; j <= b.length; j += 1) {
        const old = row[j];
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
        previous = old;
      }
    }
    return row[b.length];
  }

  function renderResources() {
    const directory = document.getElementById("resourceDirectory");
    if (!directory) return;
    const render = query => {
      const normalized = query.trim().toLowerCase();
      const filtered = course.resources.filter(resource => !normalized || [resource.title,resource.provider,resource.kind,resource.access,resource.bestFor,resource.scope].join(" ").toLowerCase().includes(normalized));
      const groups = Map.groupBy ? Map.groupBy(filtered, resource => resource.kind) : filtered.reduce((map, resource) => map.set(resource.kind, [...(map.get(resource.kind) || []), resource]), new Map());
      directory.innerHTML = [...groups.entries()].map(([kind, resources]) => `<section class="resource-group"><h3>${escapeHtml(kind)}</h3><div>${resources.map(resource => `<article class="resource-card"><div><span>${escapeHtml(resource.provider)}</span><span class="access ${slug(resource.access)}">${escapeHtml(resource.access)}</span></div><h4><a href="${escapeHtml(resource.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(resource.title)} ↗</a></h4><p>${escapeHtml(resource.bestFor)}</p><small><b>Version scope:</b> ${escapeHtml(resource.scope)} <b>Verified:</b> ${escapeHtml(resource.verified)}</small></article>`).join("")}</div></section>`).join("") || '<p>No resources match that filter.</p>';
    };
    render("");
    document.getElementById("resourceSearch")?.addEventListener("input", event => render(event.target.value));
  }

  function renderPlacement() {
    const target = document.getElementById("placementContent");
    if (!target) return;
    target.innerHTML = `
      <ol class="placement-list">
        <li><b>Start at Beginner / GO-001</b><p>If you have theoretical exposure but cannot yet create, run and debug a small Go program in VS Code without following exact steps.</p></li>
        <li><b>Start at Beginner / GO-004</b><p>If setup is dependable but defer, errors, slice aliasing, interface nil values or table tests still surprise you.</p></li>
        <li><b>Start at Intermediate / GO-009</b><p>If you can build tested packages but have not yet designed generics, goroutine lifetimes, context, APIs, SQL and module graphs.</p></li>
        <li><b>Start at Advanced / GO-018</b><p>If you already deliver services and want escape analysis, profiling, architecture, security, race evidence and release discipline.</p></li>
      </ol><p class="placement-rule"><b>Rule:</b> choose the earliest statement you cannot demonstrate from a blank VS Code workspace. Advancing never hides earlier material.</p>`;
  }

  async function copyText(id, button) {
    const text = document.getElementById(id)?.textContent;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      const prior = button.textContent; button.textContent = "Copied";
      setTimeout(() => { button.textContent = prior; }, 1400);
    } catch { showToast("Clipboard access was unavailable; select the code manually."); }
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message; toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function heroGraphic() {
    return `<svg viewBox="0 0 620 470" role="img" aria-label="Go flowing from modules through compilation and goroutines into production services">
      <defs><linearGradient id="heroGradient" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f7df1e"/><stop offset="1" stop-color="#ff9f1c"/></linearGradient><filter id="shadow"><feDropShadow dx="0" dy="14" stdDeviation="16" flood-opacity=".18"/></filter></defs>
      <path d="M80 235C150 120 235 104 310 190s157 88 230-6" fill="none" stroke="#7c3aed" stroke-width="6" stroke-dasharray="10 12" opacity=".35"/>
      <g filter="url(#shadow)"><rect x="154" y="72" width="312" height="226" rx="22" fill="var(--surface)" stroke="var(--line)"/><rect x="154" y="72" width="312" height="42" rx="22" fill="#111827"/><circle cx="180" cy="93" r="6" fill="#ff5f57"/><circle cx="200" cy="93" r="6" fill="#febc2e"/><circle cx="220" cy="93" r="6" fill="#28c840"/><path d="M185 148h96M185 178h184M185 208h150M185 238h212" stroke="#2dd4bf" stroke-width="12" stroke-linecap="round"/><path d="M298 148h82M352 178h48M310 208h88M226 268h118" stroke="#8b5cf6" stroke-width="12" stroke-linecap="round"/></g>
      <g transform="translate(64 300)" filter="url(#shadow)"><rect width="142" height="104" rx="20" fill="#0f766e"/><text x="71" y="48" text-anchor="middle" fill="white" font-size="23" font-weight="800">Modules</text><text x="71" y="76" text-anchor="middle" fill="#ccfbf1" font-size="14">packages · versions</text></g>
      <g transform="translate(240 330)" filter="url(#shadow)"><rect width="142" height="104" rx="20" fill="#2563eb"/><text x="71" y="48" text-anchor="middle" fill="white" font-size="24" font-weight="800">Runtime</text><text x="71" y="76" text-anchor="middle" fill="#dbeafe" font-size="14">goroutines · GC</text></g>
      <g transform="translate(414 292)" filter="url(#shadow)"><rect width="142" height="104" rx="20" fill="#7c3aed"/><text x="71" y="48" text-anchor="middle" fill="white" font-size="24" font-weight="800">Services</text><text x="71" y="76" text-anchor="middle" fill="#ede9fe" font-size="14">HTTP · data · events</text></g>
      <g transform="translate(32 34)" filter="url(#shadow)"><rect width="92" height="92" rx="18" fill="#fff"/><text x="46" y="58" text-anchor="middle" fill="#00add8" font-size="34" font-weight="900">Go</text><path d="M18 66h54M23 75h42" stroke="#00add8" stroke-width="5" stroke-linecap="round"/></g>
    </svg>`;
  }

  function moduleArt(icon, accent) {
    const symbols = {
      compass:'<circle cx="60" cy="60" r="29"/><path d="m47 73 9-22 22-9-9 22z"/>',
      editor:'<rect x="28" y="31" width="64" height="52" rx="7"/><path d="M28 44h64M39 56h20M39 66h36"/>',
      tools:'<rect x="27" y="31" width="66" height="52" rx="7"/><circle cx="47" cy="59" r="7"/><path d="M58 59h23M37 76h44"/>',
      engine:'<circle cx="60" cy="59" r="25"/><path d="M60 23v12M60 83v12M24 59h12M84 59h12M35 34l9 9M76 76l9 9M85 34l-9 9M44 76l-9 9"/><circle cx="60" cy="59" r="8"/>',
      scope:'<circle cx="60" cy="60" r="32"/><circle cx="60" cy="60" r="21"/><circle cx="60" cy="60" r="8"/>',
      branch:'<circle cx="37" cy="34" r="8"/><circle cx="82" cy="59" r="8"/><circle cx="37" cy="86" r="8"/><path d="M45 34h10c15 0 12 25 19 25M45 86h10c15 0 12-27 19-27"/>',
      function:'<path d="M28 78c15-2 12-51 28-51 8 0 10 7 5 13M35 54h31M72 49l18 24M90 49 72 73"/>',
      data:'<path d="m60 25 28 14-28 14-28-14zM32 39v30l28 15 28-15V39M60 53v31"/>',
      module:'<rect x="26" y="27" width="28" height="28" rx="5"/><rect x="66" y="27" width="28" height="28" rx="5"/><rect x="26" y="67" width="28" height="28" rx="5"/><rect x="66" y="67" width="28" height="28" rx="5"/>',
      test:'<path d="M32 61 50 78 89 36"/><rect x="24" y="24" width="72" height="72" rx="12"/>',
      project:'<path d="M28 84V36h64v48zM39 49h42M39 61h30M39 73h36"/>',
      loop:'<path d="M35 43c14-19 48-17 57 7M92 50l-1-17-16 5M85 78c-14 19-48 17-57-7M28 71l1 17 16-5"/>',
      cancel:'<circle cx="60" cy="60" r="35"/><path d="m44 44 32 32M76 44 44 76"/>',
      files:'<path d="M32 25h36l20 20v50H32zM68 25v20h20M43 60h34M43 73h28"/>',
      stream:'<path d="M25 40h48M63 30l12 10-12 10M95 80H47M57 70 45 80l12 10M34 60h52"/>',
      http:'<path d="M26 41h68v42H26zM26 41l14-14h40l14 14M38 55h16M38 67h40"/>',
      server:'<rect x="25" y="27" width="70" height="26" rx="5"/><rect x="25" y="67" width="70" height="26" rx="5"/><circle cx="39" cy="40" r="4"/><circle cx="39" cy="80" r="4"/><path d="M50 40h31M50 80h31"/>',
      browser:'<rect x="22" y="27" width="76" height="66" rx="8"/><path d="M22 43h76M34 35h1M44 35h1M54 35h1M36 58h48M36 70h34"/>',
      exchange:'<path d="M24 43h67M78 31l14 12-14 12M96 77H29M42 65 28 77l14 12"/>',
      database:'<ellipse cx="60" cy="34" rx="34" ry="12"/><path d="M26 34v47c0 7 15 12 34 12s34-5 34-12V34M26 57c0 7 15 12 34 12s34-5 34-12"/>',
      types:'<path d="M29 33h62M60 33v54M43 87h34"/><path d="m31 60 9 9 16-19M72 54h18M72 68h18"/>',
      react:'<ellipse cx="60" cy="60" rx="42" ry="16"/><ellipse cx="60" cy="60" rx="42" ry="16" transform="rotate(60 60 60)"/><ellipse cx="60" cy="60" rx="42" ry="16" transform="rotate(120 60 60)"/><circle cx="60" cy="60" r="5"/>',
      shield:'<path d="M60 24 91 36v23c0 22-13 33-31 39-18-6-31-17-31-39V36zM45 61l10 10 21-24"/>',
      architecture:'<rect x="44" y="24" width="32" height="22" rx="4"/><rect x="22" y="75" width="30" height="22" rx="4"/><rect x="68" y="75" width="30" height="22" rx="4"/><path d="M60 46v15M37 75V62h46v13"/>',
      mechanics:'<circle cx="60" cy="60" r="18"/><path d="M60 22v13M60 85v13M22 60h13M85 60h13M33 33l10 10M77 77l10 10M87 33 77 43M43 77 33 87"/><path d="M53 60h14M60 53v14"/>',
      speed:'<path d="M29 84a38 38 0 1 1 62 0M60 60l24-17"/><circle cx="60" cy="60" r="6"/>',
      pulse:'<path d="M18 62h22l8-22 14 43 11-31 8 10h21"/>',
      deploy:'<path d="M60 22v51M43 55l17 18 17-18M30 84h60"/><circle cx="60" cy="24" r="8"/>',
      capstone:'<path d="m60 22 35 21-35 21-35-21zM25 58l35 21 35-21M25 73l35 21 35-21"/>',
      history:'<path d="M31 39a34 34 0 1 1-4 33M31 39H17M31 39V25M60 39v23l17 10"/>',
      debug:'<path d="M60 36c17 0 28 12 28 28s-11 29-28 29-28-13-28-29 11-28 28-28zM44 30l-8-10M76 30l8-10M29 53H17M91 53h12M28 76H16M92 76h12M48 52v25M72 52v25"/>',
      library:'<path d="M25 28h20v66H25zM48 28h20v66H48zM72 31l18-5 14 64-18 4z"/>'
    };
    return `<svg viewBox="0 0 120 120" aria-hidden="true" class="art-${accent}"><circle cx="60" cy="60" r="54" class="art-bg"/><g class="art-symbol">${symbols[icon] || symbols.module}</g><circle cx="96" cy="25" r="9" class="art-dot"/></svg>`;
  }
})();
