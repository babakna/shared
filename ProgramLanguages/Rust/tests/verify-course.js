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
const course = context.window.RustCourse;
const pages = ["index.html", "rust-101.html", "rust-201.html", "rust-301.html", "rust-401.html", "rust-reference.html"];
const requiredDomains = ["Core", "Tooling", "Systems", "Web", "Data", "Quality"];
const requiredTracks = {Beginner:8, Intermediate:9, Advanced:8, Capstones:4, Reference:3};

check(course.title === "Rust Learning Lab", "course title");
check(course.version === "1.2" && course.release === "October 2026", "visible release metadata");
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
  check(/^RS-\d{3}$/.test(module.id), `${module.id} identifier`);
  check(module.summary.length >= 90, `${module.id} substantial summary`);
  check(module.outcomes.length >= 4, `${module.id} outcomes`);
  check(module.chapters.length === 4, `${module.id} four-part explanation`);
  check(module.chapters.every(chapter => chapter.title && chapter.text.length >= 2 && chapter.text.every(text => text.length >= 120)), `${module.id} substantial chapter content`);
  check(module.model?.steps?.length === 4, `${module.id} visual flow`);
  check(module.example?.language === "Rust" && module.example.source.length >= 100, `${module.id} runnable Rust example`);
  check(module.practice?.steps?.length >= 4 && module.practice.criteria.length >= 4 && module.practice.hints.length >= 3, `${module.id} guided practice`);
  check(module.diagnostic?.options?.length === 4 && Number.isInteger(module.diagnostic.answer), `${module.id} diagnostic`);
  check(module.checks.length === 3 && module.checks.every(item => item.options.length === 4 && item.why.length >= 50), `${module.id} retrieval checks`);
  check(module.project.length >= 90, `${module.id} transfer challenge`);
  check(module.domains.length >= 1 && module.domains.every(domain => requiredDomains.includes(domain)), `${module.id} valid domains`);
  check(module.resources.length >= 3 && module.resources.every(id => resourceIds.has(id)), `${module.id} valid references`);
  check(module.example.source !== module.practice.starter, `${module.id} worked example differs from practice starter`);
  check(!/fn concept_\d+\(\)/.test(module.example.source), `${module.id} is not a generic concept printer`);
  exampleSources.add(module.example.source);
  if (module.id !== "RS-001" && module.track !== "Reference") check(module.prerequisites.length >= 1, `${module.id} advisory prerequisite`);
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
  check(/assets\/rust-logo\.svg/.test(html), `${page} Rust favicon`);
  check(/assets\/rust-course\.css\?v=1\.2/.test(html), `${page} versioned CSS`);
  check(/assets\/course-core\.js\?v=1\.2/.test(html) && /assets\/data-course\.js\?v=1\.2/.test(html) && /assets\/rust-course\.js\?v=1\.2/.test(html), `${page} ordered scripts`);
}

for (const file of fs.readdirSync(path.join(root, "assets"))) {
  const full = path.join(root, "assets", file);
  if (!fs.statSync(full).isFile()) continue;
  const text = fs.readFileSync(full, "utf8");
  check(!/Python Learning Lab|TypeScript Learning Lab|Java Learning Lab|C# Learning Lab|C\+\+ Learning Lab|Go Learning Lab|PyCourse|TSCourse|JavaCourse|CSharpCourse|CppCourse|GoCourse|PY-\d{3}|TS-\d{3}|JV-\d{3}|CS-\d{3}|CPP-\d{3}|GO-\d{3}/.test(text), `${file} contains no inherited tutorial branding`);
  check(!/Prepared by|Generated by|OpenAI|ChatGPT|Codex/i.test(text), `${file} contains no generator credit`);
}

// Template wording regressions (V1.2): generated quiz and diagnostic text must read as finished prose.
for (const module of course.modules) {
  const strings = [];
  const collect = (value, key) => {
    if (key === "source" || key === "starter") return;
    if (typeof value === "string") strings.push(value.replace(/`[^`]*`/g, ""));
    else if (Array.isArray(value)) value.forEach(item => collect(item));
    else if (value && typeof value === "object") for (const [k, item] of Object.entries(value)) collect(item, k);
  };
  collect(module);
  check(!strings.some(text => /[A-Za-z0-9)\]]\.,\s/.test(text)), `${module.id} has no ".," splice`);
  check(!strings.some(text => /\b(?:correct|inspect|contradicts) between\b/.test(text)), `${module.id} names "the boundary" before "between"`);
  check(!strings.some(text => /\.[”"]\?/.test(text)), `${module.id} has no '.”?' punctuation`);
  check(!strings.some(text => /\. before patching the visible symptom\./.test(text)), `${module.id} explanation is one sentence`);
  const lowered = module.title.toLowerCase();
  if (/[A-Z]/.test(module.title.slice(1))) check(!strings.some(text => text.includes(lowered)), `${module.id} keeps proper nouns in its title`);
  for (const check_ of module.checks) {
    const correct = check_.options[check_.answer] || "";
    check(!/^between /.test(correct), `${module.id} boundary answer is a full sentence`);
    check(!/^Demonstrate this outcome\b/.test(correct), `${module.id} evidence answer does not restate the question`);
    check(!/^Which failure should a learner/.test(check_.q || check_.prompt || ""), `${module.id} failure question matches its options`);
    check(typeof check_.q === "string" && check_.q.trim().length > 10, `${module.id} quiz question uses the rendered "q" field`);
  }
  check(typeof module.diagnostic.title === "string" && module.diagnostic.title.trim().length > 0, `${module.id} diagnostic has a heading`);
  for (const list of [module.outcomes, module.practice.criteria]) {
    if (list.some(item => /[.!?]$/.test(item))) check(list.every(item => /[.!?:]$/.test(item)), `${module.id} list punctuation is consistent`);
  }
}

console.log(`PASS ${pass} FAIL ${fail}`);
process.exitCode = fail ? 1 : 0;
