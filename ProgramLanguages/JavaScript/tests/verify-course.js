"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const ROOT = path.resolve(__dirname, "..");
const SHARED = path.resolve(ROOT, "..", "..");
const dataFiles = ["assets/course-core.js","assets/data-foundations.js","assets/data-intermediate.js","assets/data-advanced.js","assets/data-reference.js"];
const appFiles = [...dataFiles,"assets/js-course.js"];
const canonicalPages = ["index.html","js-101.html","js-201.html","js-301.html","js-401.html","js-reference.html"];
let passed = 0;

function read(relative) { return fs.readFileSync(path.join(ROOT, relative), "utf8"); }
function check(name, condition, detail = "") {
  assert.ok(condition, detail);
  passed += 1;
  console.log("PASS", name);
}
function wordCount(value) { return String(value).trim().split(/\s+/).filter(Boolean).length; }

for (const file of appFiles) {
  new vm.Script(read(file), {filename:file});
  console.log("PASS syntax", file);
  passed += 1;
}

const context = vm.createContext({window:{}});
for (const file of dataFiles) vm.runInContext(read(file), context, {filename:file});
const course = context.window.JSCourse;
const modules = course.modules;

check("V2.1 metadata", course.version === "2.1" && course.release === "October 2026");
check("exact author", course.author === "Namiranian, Babak");
check("33 modules", modules.length === 33, `count=${modules.length}`);
check("sequential unique IDs", modules.every((module,index) => module.id === `JS-${String(index + 1).padStart(3,"0")}`) && new Set(modules.map(module => module.id)).size === modules.length);
check("track distribution", JSON.stringify(Object.fromEntries(["Beginner","Intermediate","Advanced","Reference"].map(track => [track,modules.filter(module => module.track === track).length]))) === JSON.stringify({Beginner:11,Intermediate:10,Advanced:9,Reference:3}));
check("every lesson has teaching depth", modules.every(module => module.summary.length > 180 && module.outcomes.length >= 4 && module.chapters.length >= 4 && module.chapters.every(chapter => chapter.text.length >= 2 && wordCount(chapter.text.join(" ")) >= 90)));
check("every lesson has worked example", modules.every(module => module.example && module.example.source.length > 80 && module.example.notes.length >= 3));
check("every lesson has complete lab", modules.every(module => module.practice && module.practice.steps.length >= 5 && module.practice.criteria.length >= 3 && module.practice.hints.length >= 2 && module.practice.starter.length > 40));
check("every lesson has failure analysis", modules.every(module => module.diagnostic && module.diagnostic.options.length >= 4 && Number.isInteger(module.diagnostic.answer)));
check("every lesson has three retrieval questions", modules.every(module => module.checks.length >= 3 && module.checks.every(check => check.options.length >= 4 && Number.isInteger(check.answer) && check.why.length > 35)));
check("every lesson has project and references", modules.every(module => module.project.length > 90 && module.resources.length >= 3));
check("all resource IDs resolve", modules.every(module => module.resources.every(id => course.resources.some(resource => resource.id === id))));
check("course has more than 20,000 authored content words", dataFiles.slice(1).reduce((sum,file) => sum + wordCount(read(file)), 0) > 20000);
check("resource catalog has depth", course.resources.length >= 35, `count=${course.resources.length}`);
check("TC39 specification included", course.resources.some(resource => resource.id === "ecma262" && resource.url === "https://tc39.es/ecma262/"));
check("Node latest and release policy both included", course.resources.some(resource => resource.id === "node-api" && resource.url.includes("/latest/")) && course.resources.some(resource => resource.id === "node-releases"));
check("at least three Coursera resources", course.resources.filter(resource => /Coursera/i.test(`${resource.provider} ${resource.kind}`)).length >= 3);
check("at least four YouTube resources", course.resources.filter(resource => /YouTube/i.test(resource.kind)).length >= 4);
check("all resources label access, scope and verification", course.resources.every(resource => resource.access && resource.scope && resource.verified === "2026-09-27"));
check("paid material is not required by labs", modules.every(module => !/must (buy|purchase|subscribe)|requires? payment/i.test(`${module.summary} ${module.project} ${module.practice.brief}`)));
check("platform differences taught", /Windows/.test(read("assets/data-foundations.js")) && /macOS/.test(read("assets/data-foundations.js")) && /Linux/.test(read("assets/data-foundations.js")) && /PowerShell/.test(read("assets/data-foundations.js")));
check("VS Code setup is extensive", ["Profiles","integrated terminal","breakpoint","npm scripts","readiness"].every(term => read("assets/data-foundations.js").toLowerCase().includes(term.toLowerCase())));
check("Node primary and browser substantial", modules.filter(module => /Node|HTTP|Express|stream|file/i.test(`${module.title} ${module.summary}`)).length >= 7 && modules.filter(module => /browser|DOM|React/i.test(`${module.title} ${module.summary}`)).length >= 4);
check("future AI boundary preserved", /Ministral 3 14B/.test(read("assets/data-advanced.js")) && /frontend will never|browser never/i.test(read("assets/data-advanced.js")));
check("all canonical pages have author, favicon and V2.1 assets", canonicalPages.every(file => /name="author" content="Namiranian, Babak"/.test(read(file)) && /javascript-logo\.svg/.test(read(file)) && /v=2\.1/.test(read(file))));
const notFoundPage = fs.readFileSync(path.join(SHARED,"404.html"),"utf8");
check("404 normalizes directory and track-file case", /programlanguages\/javascript/.test(notFoundPage) && /ProgramLanguages\/JavaScript/.test(notFoundPage) && ["js-101.html","js-201.html","js-301.html","js-401.html","js-reference.html"].every(file => notFoundPage.includes(`"${file}":"${file}"`)) && /location\.search \+ location\.hash/.test(notFoundPage));
check("module links explicitly use new tabs", /target="_blank" rel="noopener noreferrer"/.test(read("assets/js-course.js")));
check("every module-entry pattern opens a protected new tab", /Resume \$\{escapeHtml\(last\.id\)\}/.test(read("assets/js-course.js")) && /href="\$\{fileFor\(last\)\}#.+target="_blank" rel="noopener noreferrer"/.test(read("assets/js-course.js")) && /Start this path<\/a>/.test(read("assets/js-course.js")) && /class="module-card.+target="_blank" rel="noopener noreferrer"/.test(read("assets/js-course.js")));
check("only the theme button can trigger theme changes", /event\.target\.closest\("button\[data-theme\]"\)/.test(read("assets/js-course.js")) && !/event\.target\.closest\("\[data-theme\]"\)/.test(read("assets/js-course.js")));
check("on-page lesson navigation cannot replace the module route", /data-scroll-target="chapter-/.test(read("assets/js-course.js")) && /preventDefault\(\)/.test(read("assets/js-course.js")));
check("floating Top control exists", /data-to-top/.test(read("assets/js-course.js")) && /\.to-top/.test(read("assets/js-course.css")));
check("syntax highlighting and copy controls exist", /function highlight/.test(read("assets/js-course.js")) && /data-copy/.test(read("assets/js-course.js")) && /tok-keyword/.test(read("assets/js-course.css")));
check("explicit completion and local reset exist", /Mark module complete/.test(read("assets/js-course.js")) && /javascript-learning-lab-v2/.test(read("assets/course-core.js")) && /data-reset/.test(read("assets/js-course.js")));
check("purposeful typography and color system", /--display:/.test(read("assets/js-course.css")) && /--body:Georgia/.test(read("assets/js-course.css")) && /--mono:/.test(read("assets/js-course.css")) && ["--teal","--blue","--violet","--rose","--amber"].every(token => read("assets/js-course.css").includes(token)));
check("light is default and dark is supported", canonicalPages.every(file => /data-theme="light"/.test(read(file))) && /\[data-theme="dark"\]/.test(read("assets/js-course.css")));
check("no stale V1 labels", !appFiles.concat(canonicalPages).some(file => /V1\.[01]|v=1\.[01]|javascript-learning-lab-v1/.test(read(file))));
check("no stale V2.0 display or asset labels", !appFiles.concat(canonicalPages).some(file => /V2\.0|v=2\.0/.test(read(file))));
check("no generator or tool credit", !appFiles.concat(canonicalPages).some(file => /(Generated by|Prepared by|OpenAI|Claude Code|Codex)/i.test(read(file))));

console.log(`\nRESULT ${passed} checks passed; 0 failures`);
