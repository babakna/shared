"use strict";
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const assert = require("node:assert/strict");
const {chromium} = require("playwright");

const SHARED = path.resolve(__dirname,"..","..","..");
const ROOT = path.join(SHARED,"ProgramLanguages","JavaScript");
const SHOTS = "/private/tmp/javascript-learning-lab-v2-screenshots";
let passed = 0;
let failed = 0;

function check(name, condition, detail = "") {
  try { assert.ok(condition, detail); passed += 1; console.log("PASS", name); }
  catch (error) { failed += 1; console.error("FAIL", name, detail || error.message); }
}

function server() {
  const types = {".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".svg":"image/svg+xml",".md":"text/markdown; charset=utf-8"};
  function exactCaseExists(relative) {
    let current = SHARED;
    for (const part of relative.split("/").filter(Boolean)) {
      try {
        if (!fs.readdirSync(current).includes(part)) return false;
        current = path.join(current, part);
      } catch { return false; }
    }
    return true;
  }
  return http.createServer((request,response) => {
    const pathname = decodeURIComponent(new URL(request.url,"http://local").pathname);
    let relative = pathname.replace(/^\/+/,"");
    if (relative === "shared") relative = "";
    if (relative.startsWith("shared/")) relative = relative.slice("shared/".length);
    if (relative === "") relative = "index.html";
    let target = path.resolve(SHARED,relative);
    if (pathname.endsWith("/")) target = path.join(target,"index.html");
    if (!target.startsWith(SHARED + path.sep)) { response.writeHead(403).end("Forbidden"); return; }
    fs.readFile(target,(error,data) => {
      if (error || !exactCaseExists(relative)) {
        fs.readFile(path.join(SHARED,"404.html"),(notFoundError,notFound) => {
          response.writeHead(404,{"content-type":"text/html; charset=utf-8","cache-control":"no-store"});
          response.end(notFoundError ? "Not found" : notFound);
        });
        return;
      }
      response.writeHead(200,{"content-type":types[path.extname(target)] || "application/octet-stream","cache-control":"no-store"});
      response.end(data);
    });
  });
}

async function noOverflow(page) { return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1); }
async function uniqueIds(page) { return page.evaluate(() => { const ids=[...document.querySelectorAll("[id]")].map(node=>node.id); return ids.length === new Set(ids).size; }); }
async function namedControls(page) { return page.evaluate(() => [...document.querySelectorAll("a,button,input,textarea,select")].filter(node => !node.hidden && getComputedStyle(node).display !== "none").every(node => Boolean(node.getAttribute("aria-label") || node.getAttribute("aria-labelledby") || node.labels?.length || node.textContent.trim() || node.querySelector("img[alt]")))); }

async function main() {
  fs.mkdirSync(SHOTS,{recursive:true});
  const site = server();
  await new Promise((resolve,reject) => site.listen(0,"127.0.0.1",error => error ? reject(error) : resolve()));
  const base = `http://127.0.0.1:${site.address().port}/shared/`;
  const browser = await chromium.launch({headless:true});
  const context = await browser.newContext({viewport:{width:1440,height:1000},colorScheme:"light",permissions:["clipboard-read","clipboard-write"]});
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.stack || String(error)));
  page.on("console", message => { if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) errors.push(`console: ${message.text()}`); });
  page.on("response", response => {
    if (response.status() < 400) return;
    const request = response.request();
    const pathname = new URL(response.url()).pathname;
    const expectedCaseRedirect = response.status() === 404 && request.resourceType() === "document" && pathname.toLowerCase().startsWith("/shared/programlanguages/javascript");
    if (!expectedCaseRedirect) errors.push(`HTTP ${response.status()}: ${pathname}`);
  });

  const homeResponse = await page.goto(base + "ProgramLanguages/JavaScript/",{waitUntil:"networkidle"});
  const homeCardCount = await page.locator(".path-card").count();
  if (homeCardCount !== 5) { const html = await page.content(); console.error("HOME DIAGNOSTIC", {status:homeResponse?.status(),url:page.url(),closed:page.isClosed(),contentLength:html.length,html,errors}); }
  check("home renders five grouped paths", homeCardCount === 5);
  check("home keeps visible Home control", await page.locator(".home-button").isVisible());
  check("home displays V2.2 October 2026", (await page.locator("body").innerText()).includes("V2.2 · October 2026"));
  check("JavaScript favicon configured", (await page.locator('link[rel="icon"]').getAttribute("href")) === "assets/javascript-logo.svg");
  check("home has purposeful graphics", await page.locator(".hero-art svg").count() === 1 && await page.locator(".path-art svg").count() === 5);
  check("placement, Help and Resources are visible", await page.getByRole("button",{name:"Find my starting point"}).isVisible() && await page.getByRole("button",{name:"Help"}).isVisible() && await page.getByRole("button",{name:"Resources"}).isVisible());
  check("home has no horizontal overflow", await noOverflow(page));
  const homeScale = await page.evaluate(() => ({
    topbar: document.querySelector(".topbar").getBoundingClientRect().height,
    title: parseFloat(getComputedStyle(document.querySelector(".home-hero h1")).fontSize),
    hero: document.querySelector(".home-hero").getBoundingClientRect().height,
    lead: parseFloat(getComputedStyle(document.querySelector(".hero-lead")).fontSize)
  }));
  check("desktop landing typography and hero are normalized", homeScale.topbar <= 68 && homeScale.title <= 58 && homeScale.hero <= 500 && homeScale.lead <= 19, JSON.stringify(homeScale));
  check("home has semantic landmark and heading structure", await page.locator("main").count() === 1 && await page.locator("h1").count() === 1 && await page.locator('nav[aria-label="Learning paths"]').count() === 1);
  check("home IDs are unique and controls are named", await uniqueIds(page) && await namedControls(page));
  check("desktop does not show a nonfunctional Modules drawer control", !(await page.getByRole("button",{name:"Modules"}).isVisible()));
  await page.keyboard.press("Tab");
  check("skip link is the first keyboard stop", await page.evaluate(() => document.activeElement?.classList.contains("skip-link")));
  await page.screenshot({path:path.join(SHOTS,"home-1440.png"),fullPage:true});

  const resumeLink = page.getByRole("link",{name:"Resume JS-001"});
  const resumeProtected = await resumeLink.evaluate(link => link.target === "_blank" && link.rel.includes("noopener") && link.rel.includes("noreferrer"));
  check("Home Resume declares a protected new tab", resumeProtected);
  if (resumeProtected) {
    const resumePopupPromise = page.waitForEvent("popup");
    await resumeLink.click();
    const resumePopup = await resumePopupPromise;
    await resumePopup.waitForLoadState("networkidle");
    check("Home Resume opens the lesson in a separate tab", resumePopup !== page && resumePopup.url().endsWith("js-101.html#js-001"));
    await resumePopup.close();
  }

  await page.getByRole("button",{name:"Resources"}).click();
  check("resource dialog has an accessible name", await page.getByRole("dialog",{name:"Resources with purpose, cost and currency"}).isVisible());
  const resourceText = await page.locator("#resourceDirectory").innerText();
  check("resources include Coursera", (resourceText.match(/Coursera/g) || []).length >= 3);
  check("resources include YouTube", (resourceText.match(/YouTube/g) || []).length >= 4);
  check("resources include official TC39 specification", resourceText.includes("ECMAScript Language Specification"));
  check("resources display access and version scope", resourceText.includes("Freemium/Paid") && resourceText.includes("Version scope:"));
  await page.locator("#resourcesDialog .modal-close").click();

  await page.goto(base + "ProgramLanguages/JavaScript/js-101.html",{waitUntil:"networkidle"});
  check("Beginner map renders 11 modules", await page.locator(".module-card").count() === 11);
  check("every Beginner module opens a new tab", await page.locator(".module-card").evaluateAll(cards => cards.every(card => card.target === "_blank" && card.rel.includes("noopener") && card.rel.includes("noreferrer"))));
  check("sidebar modules open new tabs", await page.locator("#moduleNav [data-nav-id]").evaluateAll(links => links.every(link => link.target === "_blank")));
  check("module cards have graphics", await page.locator(".module-card .module-art svg").count() === 11);
  const mapScale = await page.evaluate(() => ({
    title: parseFloat(getComputedStyle(document.querySelector(".track-hero h1")).fontSize),
    hero: document.querySelector(".track-hero").getBoundingClientRect().height,
    card: Math.max(...[...document.querySelectorAll(".module-card")].map(node => node.getBoundingClientRect().height))
  }));
  check("desktop path typography and cards are normalized", mapScale.title <= 53 && mapScale.hero <= 330 && mapScale.card <= 390, JSON.stringify(mapScale));
  await page.screenshot({path:path.join(SHOTS,"beginner-map-1440.png"),fullPage:true});

  const popupPromise = page.waitForEvent("popup");
  await page.locator(".module-card").first().click();
  const popup = await popupPromise;
  await popup.waitForLoadState("networkidle");
  check("module card opens a separate tab", popup !== page && popup.url().endsWith("js-101.html#js-001"));
  check("lesson has four substantive chapters", await popup.locator(".lesson-chapter").count() === 4 && (await popup.locator(".lesson-chapter").first().innerText()).length > 700);
  check("lesson has visual model and module art", await popup.locator(".model-flow .model-step").count() >= 5 && await popup.locator(".lesson-art svg").count() === 1);
  check("lesson has syntax-highlighted code and copy", await popup.locator(".code-window .tok-keyword").count() > 0 && await popup.getByRole("button",{name:/Copy/}).count() >= 2);
  check("lesson has practice, hints, diagnostic and three quiz questions", await popup.locator(".practice-section").count() === 1 && await popup.locator(".hints details").count() >= 2 && await popup.locator("[data-diagnostic]").count() === 1 && await popup.locator("[data-quiz] fieldset").count() === 3);
  check("lesson has floating Top control", await popup.locator("[data-to-top]").count() === 1);
  check("lesson IDs are unique and controls are named", await uniqueIds(popup) && await namedControls(popup));
  const lessonScale = await popup.evaluate(() => ({
    title: parseFloat(getComputedStyle(document.querySelector(".lesson-hero h1")).fontSize),
    hero: document.querySelector(".lesson-hero").getBoundingClientRect().height,
    body: parseFloat(getComputedStyle(document.querySelector(".lesson-chapter p")).fontSize)
  }));
  check("desktop lesson typography and hero are normalized", lessonScale.title <= 53 && lessonScale.hero <= 410 && lessonScale.body <= 17, JSON.stringify(lessonScale));
  check("lesson starts incomplete", (await popup.locator(".completion-panel").innerText()).includes("Mark module complete"));
  await popup.locator('[data-complete="JS-001"]').click();
  check("explicit completion persists", await popup.evaluate(() => JSON.parse(localStorage.getItem("javascript-learning-lab-v2")).done["JS-001"] === true));
  check("progress counter updates", (await popup.locator("#progressText").innerText()).startsWith("1 of 33"));

  const quiz = popup.locator('[data-quiz="JS-001"]');
  await quiz.locator('input[name="q-0"][value="0"]').check();
  await quiz.locator('input[name="q-1"][value="0"]').check();
  await quiz.locator('input[name="q-2"][value="1"]').check();
  await quiz.getByRole("button",{name:"Score and explain"}).click();
  check("quiz scores and explains all answers", (await quiz.locator(".quiz-summary").innerText()).includes("3 of 3") && await quiz.locator(".answer-note.correct").count() === 3);
  const copyButton = popup.locator("button[data-copy]").first();
  const copiedCode = await popup.locator(`#${await copyButton.getAttribute("data-copy")}`).textContent();
  const themeBeforeCopy = await popup.evaluate(() => document.documentElement.dataset.theme);
  await copyButton.click();
  await popup.waitForFunction(() => document.querySelector("button[data-copy]")?.textContent === "Copied");
  check("Copy confirms success and writes exact displayed code", (await copyButton.innerText()) === "Copied" && await popup.evaluate(() => navigator.clipboard.readText()) === copiedCode);
  check("Copy does not change the theme", await popup.evaluate(() => document.documentElement.dataset.theme) === themeBeforeCopy);
  await popup.locator("button[data-theme]").click();
  check("theme toggles and persists", await popup.evaluate(() => document.documentElement.dataset.theme === "dark" && JSON.parse(localStorage.getItem("javascript-learning-lab-v2")).theme === "dark"));
  await popup.screenshot({path:path.join(SHOTS,"lesson-js-001-1440.png"),fullPage:true});
  await popup.close();

  await page.goto(base + "ProgramLanguages/JavaScript/js-201.html",{waitUntil:"networkidle"});
  check("Intermediate map renders 10 modules", await page.locator(".module-card").count() === 10);
  await page.locator("#courseSearch").fill("promisses");
  check("typo-tolerant search finds async lesson", await page.locator('[data-nav-id="JS-012"]').isVisible());
  check("typo search narrows results", await page.locator("#moduleNav [data-nav-id]:visible").count() < 5);
  await page.goto(base + "ProgramLanguages/JavaScript/js-301.html",{waitUntil:"networkidle"});
  check("Advanced map renders 9 modules", await page.locator(".module-card").count() === 9);
  await page.goto(base + "ProgramLanguages/JavaScript/js-401.html",{waitUntil:"networkidle"});
  check("Capstone Studio renders three projects", await page.locator(".module-card").count() === 3);
  check("capstones link to JS-011, JS-021 and JS-030", (await page.locator(".module-card").evaluateAll(cards => cards.map(card => card.hash).join("|"))) === "#js-011|#js-021|#js-030");
  await page.goto(base + "ProgramLanguages/JavaScript/js-reference.html",{waitUntil:"networkidle"});
  check("Reference map renders 3 modules", await page.locator(".module-card").count() === 3);

  await page.goto(base + "ProgramLanguages/JavaScript/JS-101.html#js-004",{waitUntil:"networkidle"});
  check("uppercase compatibility file redirects with hash", page.url().endsWith("js-101.html#js-004") && (await page.title()).startsWith("JS-004"));
  await page.goto(base + "programlanguages/javascript/",{waitUntil:"networkidle"});
  check("mixed-case directory route normalizes", page.url() === base + "ProgramLanguages/JavaScript/");

  for (const width of [1024,768,390]) {
    const mobile = await browser.newContext({viewport:{width,height:width === 390 ? 844 : 900},colorScheme:"light"});
    const p = await mobile.newPage();
    const mobileErrors = [];
    p.on("pageerror", error => mobileErrors.push(String(error)));
    await p.goto(base + "ProgramLanguages/JavaScript/",{waitUntil:"networkidle"});
    check(`${width}px home has no horizontal overflow`, await noOverflow(p));
    check(`${width}px home shows all paths`, await p.locator(".path-card").count() === 5);
    const mobileHomeScale = await p.evaluate(() => ({
      title: parseFloat(getComputedStyle(document.querySelector(".home-hero h1")).fontSize),
      topbar: document.querySelector(".topbar").getBoundingClientRect().height
    }));
    check(`${width}px home scale is normalized`, mobileHomeScale.title <= (width <= 768 ? 45 : 58) && mobileHomeScale.topbar <= 68, JSON.stringify(mobileHomeScale));
    if (width <= 768) check(`${width}px keeps Help and Resources visible`, await p.getByRole("button",{name:"Help"}).isVisible() && await p.getByRole("button",{name:"Resources"}).isVisible());
    await p.goto(base + "ProgramLanguages/JavaScript/js-101.html",{waitUntil:"networkidle"});
    check(`${width}px path has no horizontal overflow`, await noOverflow(p));
    if (width <= 768) {
      await p.getByRole("button",{name:"Modules"}).click();
      check(`${width}px module drawer opens visibly`, await p.evaluate(() => document.body.classList.contains("nav-open")) && await p.locator(".course-nav").isVisible());
    }
    await p.goto(base + "ProgramLanguages/JavaScript/js-101.html#js-002",{waitUntil:"networkidle"});
    check(`${width}px lesson has no horizontal overflow`, await noOverflow(p));
    check(`${width}px lesson keeps Home visible`, await p.locator(".home-button").isVisible());
    const mobileLessonTitle = await p.locator(".lesson-hero h1").evaluate(node => parseFloat(getComputedStyle(node).fontSize));
    check(`${width}px lesson title is normalized`, mobileLessonTitle <= (width <= 768 ? 35 : 53), `font-size=${mobileLessonTitle}px`);
    check(`${width}px has no runtime errors`, mobileErrors.length === 0, mobileErrors.join(" | "));
    if (width === 390) await p.screenshot({path:path.join(SHOTS,"lesson-js-002-390.png"),fullPage:true});
    await mobile.close();
  }

  const bodyText = await page.locator("body").innerText();
  check("no undefined or object leak", !bodyText.includes("undefined") && !bodyText.includes("[object Object]"));
  check("no browser runtime errors", errors.length === 0, errors.join(" | "));
  await context.close();
  await browser.close();
  await new Promise(resolve => site.close(resolve));
  console.log(`\nRESULT ${passed} checks passed; ${failed} failures`);
  console.log("SCREENSHOTS", SHOTS);
  if (failed) process.exitCode = 1;
}

main().catch(error => { console.error(error); process.exit(1); });
