/* Investing Learning Lab course-hub renderer. */
(function () {
  "use strict";
  var cfg = window.INV_HUB;
  if (!cfg || !window.INV) return;
  INV.ready(function () {
    var root = document.getElementById("hubModules");
    if (!root) return;
    var modules = INV.course.filter(function (m) { return m.n >= cfg.start && m.n <= cfg.end; });
    var progress = INV.progress.read();
    var done = modules.filter(function (m) { return progress[m.id] && progress[m.id].done; }).length;
    var groups = [];
    modules.forEach(function (m) {
      var found = groups.find(function (g) { return g.stage.n === m.stage; });
      if (!found) { found = { stage: INV.stages[m.stage - 1], modules: [] }; groups.push(found); }
      found.modules.push(m);
    });
    var details = window.INV_INDEX || {};
    root.innerHTML = groups.map(function (g) {
      return '<section class="hub-stage"><div class="hub-stage-head"><span class="hub-stage-num">' + g.stage.n + '</span><div><h2>' + INV.esc(g.stage.name) + '</h2><p>' + INV.esc(g.stage.blurb) + '</p></div></div><div class="hub-modules">' +
        g.modules.map(function (m) {
          var complete = progress[m.id] && progress[m.id].done;
          var scope = details[m.id] && details[m.id].scope ? details[m.id].scope : "Open the interactive lesson, examples, tools and knowledge check.";
          return '<a class="hub-module" href="' + m.id + '.html" target="_blank" rel="noopener noreferrer"><span class="hub-code">' + m.id + '</span><span><b>' + INV.esc(m.title) + '</b><small>' + INV.esc(scope) + '</small></span><span class="hub-status' + (complete ? ' done' : '') + '">' + (complete ? '✓ Complete' : 'Open ↗') + '</span></a>';
        }).join("") + '</div></section>';
    }).join("");
    var count = document.getElementById("hubCount");
    if (count) count.textContent = modules.length + " modules · " + done + " complete";
    var fill = document.getElementById("hubFill");
    if (fill) fill.style.width = (modules.length ? done / modules.length * 100 : 0) + "%";
    var stat = document.getElementById("hubProgressText");
    if (stat) stat.textContent = done + " of " + modules.length + " complete";
    var start = document.getElementById("hubStart");
    if (start && modules.length) start.href = modules[0].id + ".html";
    var last = INV.store("inv-last");
    var resume = document.getElementById("hubResume");
    if (resume && last && modules.some(function (m) { return m.id === last.id; })) {
      resume.hidden = false;
      resume.href = last.id + ".html#s" + (last.tab + 1);
      resume.textContent = "Continue " + last.id + (last.tabName ? " · " + last.tabName : "") + " ↗";
    }
  });
})();
