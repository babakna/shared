"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
let pass = 0;
let fail = 0;
function check(condition, message) {
  if (condition) pass += 1;
  else { fail += 1; console.error(`FAIL: ${message}`); }
}

const context = {window:{}};
vm.createContext(context);
for (const file of ["course-core.js", "data-course.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, "assets", file), "utf8"), context, {filename:file});
}
const course = context.window.GoCourse;
const pages = ["index.html", "go-101.html", "go-201.html", "go-301.html", "go-401.html", "go-reference.html"];
const requiredDomains = ["Core", "Tooling", "Backend", "Cloud", "Data", "Performance", "Quality"];
const requiredTracks = {Beginner:8, Intermediate:9, Advanced:8, Capstones:4, Reference:3};

check(course.title === "Go Learning Lab", "course title");
check(course.version === "1.1" && course.release === "October 2026", "visible release metadata");
check(course.author === "Namiranian, Babak", "exact author");
check(course.modules.length === 32, "32-module curriculum");
check(course.resources.length >= 25, "resource catalog breadth");
check(new Set(course.modules.map(module => module.id)).size === course.modules.length, "unique module IDs");

for (const [track, count] of Object.entries(requiredTracks)) {
  const modules = course.modules.filter(module => module.track === track);
  check(modules.length === count, `${track} module count`);
  for (const domain of requiredDomains) check(modules.some(module => module.domains.includes(domain)), `${track} exposes ${domain} path`);
}

const resourceIds = new Set(course.resources.map(resource => resource.id));
const moduleIds = new Set(course.modules.map(module => module.id));
const exampleSources = new Set();
const diagnosticSignatures = new Set();
const diagnosticAnswers = new Set();
const quizQuestions = new Set();
for (const module of course.modules) {
  check(/^GO-\d{3}$/.test(module.id), `${module.id} identifier`);
  check(module.summary.length >= 90, `${module.id} substantial summary`);
  check(module.outcomes.length >= 4, `${module.id} outcomes`);
  check(module.chapters.length === 4, `${module.id} four-part explanation`);
  check(module.chapters.every(chapter => chapter.title && chapter.text.length >= 2 && chapter.text.every(text => text.length >= 120)), `${module.id} substantial chapter content`);
  check(module.model?.steps?.length === 4, `${module.id} visual flow`);
  check(module.example?.language === "Go" && module.example.source.length >= 100, `${module.id} runnable Go example`);
  check(module.practice?.steps?.length >= 4 && module.practice.criteria.length >= 4 && module.practice.hints.length >= 3, `${module.id} guided practice`);
  check(module.diagnostic?.options?.length === 4 && Number.isInteger(module.diagnostic.answer), `${module.id} diagnostic`);
  check(module.checks.length === 3 && module.checks.every(item => item.options.length === 4 && item.why.length >= 50), `${module.id} retrieval checks`);
  check(module.project.length >= 90, `${module.id} transfer challenge`);
  check(module.domains.length >= 1 && module.domains.every(domain => requiredDomains.includes(domain)), `${module.id} valid domains`);
  check(module.resources.length >= 3 && module.resources.every(id => resourceIds.has(id)), `${module.id} valid references`);
  check(module.example.source !== module.practice.starter, `${module.id} worked example differs from practice starter`);
  check(!/func concept\d+\(\) string/.test(module.example.source), `${module.id} is not a generic concept printer`);
  exampleSources.add(module.example.source);
  if (module.id !== "GO-001" && module.track !== "Reference") check(module.prerequisites.length >= 1, `${module.id} advisory prerequisite`);
  check(module.prerequisites.every(id => moduleIds.has(id) && Number(id.slice(3)) < Number(module.id.slice(3))), `${module.id} prerequisites reference earlier modules`);
  diagnosticSignatures.add(`${module.diagnostic.prompt}|${module.diagnostic.options.join("|")}`);
  diagnosticAnswers.add(module.diagnostic.answer);
  module.checks.forEach(item => quizQuestions.add(item.q));
  const lessonWords = module.chapters.flatMap(chapter => chapter.text).join(" ").split(/\s+/).length;
  check(lessonWords >= 300, `${module.id} lesson depth (${lessonWords} words)`);
}
check(exampleSources.size === course.modules.length, "module-specific worked examples");
check(diagnosticSignatures.size === course.modules.length, "module-specific diagnostics");
check(diagnosticAnswers.size === 4, "diagnostic correct answers use every position");
check(quizQuestions.size === course.modules.length * 3, "module-specific retrieval questions");

for (const resource of course.resources) {
  check(/^https:\/\//.test(resource.url), `${resource.id} HTTPS URL`);
  check(resource.title && resource.provider && resource.kind && resource.bestFor && resource.scope && resource.access, `${resource.id} complete resource metadata`);
}
check(course.resources.some(resource => /Coursera/.test(resource.provider)), "Coursera resources included");
check(course.resources.some(resource => /YouTube/.test(resource.kind)), "YouTube resources included");
check(course.resources.some(resource => /Paid|Freemium/.test(resource.access)), "paid options clearly labeled");

for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), "utf8");
  check(/<meta name="author" content="Namiranian, Babak">/.test(html), `${page} exact author metadata`);
  check(/assets\/go-logo\.svg/.test(html), `${page} Go favicon`);
  check(/assets\/go-course\.css\?v=1\.1/.test(html), `${page} versioned CSS`);
  check(/assets\/course-core\.js\?v=1\.1/.test(html) && /assets\/data-course\.js\?v=1\.1/.test(html) && /assets\/go-course\.js\?v=1\.1/.test(html), `${page} ordered scripts`);
}

for (const file of fs.readdirSync(path.join(root, "assets"))) {
  const full = path.join(root, "assets", file);
  if (!fs.statSync(full).isFile()) continue;
  const text = fs.readFileSync(full, "utf8");
  check(!/Python Learning Lab|TypeScript Learning Lab|Java Learning Lab|PyCourse|TSCourse|JavaCourse|PY-\d{3}|TS-\d{3}|JV-\d{3}/.test(text), `${file} contains no inherited tutorial branding`);
  check(!/Prepared by|Generated by|OpenAI|ChatGPT|Codex/i.test(text), `${file} contains no generator credit`);
}

console.log(`PASS ${pass} FAIL ${fail}`);
process.exitCode = fail ? 1 : 0;
