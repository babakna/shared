"use strict";
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const vm = require("node:vm");
const {chromium} = require("playwright");

const SHARED = path.resolve(__dirname,"..","..","..");
const ROOT = path.join(SHARED,"ProgramLanguages","JavaScript");
const SHOTS = "/private/tmp/javascript-learning-lab-v2-complete-renditions";
const STORAGE = "javascript-learning-lab-v2";
const dataContext = vm.createContext({window:{}});
for (const file of ["course-core.js","data-foundations.js","data-intermediate.js","data-advanced.js","data-reference.js"]) {
  vm.runInContext(fs.readFileSync(path.join(ROOT,"assets",file),"utf8"),dataContext,{filename:file});
}
const course = dataContext.window.JSCourse;
const modules = course.modules;
const trackPages = [
  {name:"home",file:"",cards:5},
  {name:"beginner",file:"js-101.html",cards:11},
  {name:"intermediate",file:"js-201.html",cards:10},
  {name:"advanced",file:"js-301.html",cards:9},
  {name:"capstones",file:"js-401.html",cards:3},
  {name:"reference",file:"js-reference.html",cards:3}
];
const viewports = [
  {name:"desktop",width:1440,height:1000},
  {name:"laptop",width:1024,height:900},
  {name:"tablet",width:768,height:900},
  {name:"mobile",width:390,height:844}
];
let checked = 0;
const failures = [];

function check(condition,label,detail="") {
  checked += 1;
  if (!condition) {
    const message = `${label}${detail ? ` — ${detail}` : ""}`;
    failures.push(message);
    console.error("FAIL",message);
  }
}

function fileFor(module) {
  if (module.track === "Beginner") return "js-101.html";
  if (module.track === "Intermediate") return "js-201.html";
  if (module.track === "Advanced") return "js-301.html";
  return "js-reference.html";
}

function exactCaseExists(relative) {
  let current = SHARED;
  for (const part of relative.split("/").filter(Boolean)) {
    try {
      if (!fs.readdirSync(current).includes(part)) return false;
      current = path.join(current,part);
    } catch { return false; }
  }
  return true;
}

function createServer() {
  const types = {".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".svg":"image/svg+xml",".md":"text/markdown; charset=utf-8"};
  return http.createServer((request,response) => {
    const pathname = decodeURIComponent(new URL(request.url,"http://local").pathname);
    let relative = pathname.replace(/^\/+/,"");
    if (relative === "shared") relative = "";
    if (relative.startsWith("shared/")) relative = relative.slice(7);
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

function installTheme(context,theme) {
  return context.addInitScript(({key,value}) => {
    localStorage.setItem(key,JSON.stringify({done:{},quiz:{},drafts:{},last:"JS-001",theme:value}));
  },{key:STORAGE,value:theme});
}

function monitor(page) {
  const errors = [];
  page.on("pageerror",error => errors.push(error.stack || String(error)));
  page.on("console",message => {
    if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) errors.push(`console: ${message.text()}`);
  });
  page.on("response",response => {
    if (response.status() < 400) return;
    const request = response.request();
    const pathname = new URL(response.url()).pathname;
    const expectedCaseRedirect = response.status() === 404 && request.resourceType() === "document" && pathname.toLowerCase().startsWith("/shared/programlanguages/javascript");
    if (!expectedCaseRedirect) errors.push(`HTTP ${response.status()}: ${pathname}`);
  });
  page.on("requestfailed",request => errors.push(`request failed: ${request.url()} ${request.failure()?.errorText || ""}`));
  return errors;
}

async function auditDom(page,label) {
  const result = await page.evaluate(() => {
    const ids = [...document.querySelectorAll("[id]")].map(node => node.id);
    const unnamed = [...document.querySelectorAll("a,button,input,textarea,select,summary")].filter(node => {
      if (node.hidden || getComputedStyle(node).display === "none") return false;
      return !(node.getAttribute("aria-label") || node.getAttribute("aria-labelledby") || node.labels?.length || node.textContent.trim() || node.querySelector("img[alt]"));
    }).length;
    const brokenImages = [...document.images].filter(image => image.complete && image.naturalWidth === 0).length;
    const zeroSections = [...document.querySelectorAll("main section,main article")].filter(node => {
      const box = node.getBoundingClientRect();
      return box.width < 1 || box.height < 1;
    }).length;
    const criticalValues = [...document.querySelectorAll("h1,h2,h3,h4,.module-card-head,.module-card-foot,.path-meta,.lesson-status,.progress-card,.version")].map(node => node.textContent.trim());
    const h1 = document.querySelector("h1");
    const topbar = document.querySelector(".topbar");
    return {
      uniqueIds:ids.length === new Set(ids).size,
      unnamed,
      brokenImages,
      zeroSections,
      overflow:document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      leaks:criticalValues.some(value => value === "undefined" || value === "NaN" || value.includes("[object Object]")),
      main:document.querySelectorAll("main").length,
      h1:document.querySelectorAll("h1").length,
      h1Font:h1 ? parseFloat(getComputedStyle(h1).fontSize) : 0,
      topbarHeight:topbar ? topbar.getBoundingClientRect().height : 0,
      compactWidth:innerWidth <= 820
    };
  });
  check(result.uniqueIds,`${label}: unique IDs`);
  check(result.unnamed === 0,`${label}: every visible interactive control has a name`,`unnamed=${result.unnamed}`);
  check(result.brokenImages === 0,`${label}: no broken images`,`broken=${result.brokenImages}`);
  check(result.zeroSections === 0,`${label}: every rendered section has dimensions`,`zero=${result.zeroSections}`);
  check(!result.overflow,`${label}: no horizontal page overflow`);
  check(!result.leaks,`${label}: no undefined/object/NaN rendering leak`);
  check(result.main === 1 && result.h1 === 1,`${label}: one main landmark and one H1`,`main=${result.main},h1=${result.h1}`);
  check(result.h1Font <= (result.compactWidth ? 45 : 58),`${label}: H1 scale stays normalized`,`font-size=${result.h1Font}px`);
  check(result.topbarHeight <= 68,`${label}: top bar scale stays normalized`,`height=${result.topbarHeight}px`);
}

async function currentTheme(page) { return page.evaluate(() => document.documentElement.dataset.theme); }
async function expectStableTheme(page,theme,label,action) {
  await action();
  check(await currentTheme(page) === theme,`${label}: click preserves ${theme} theme`);
}

async function auditAllRenditions(browser,base) {
  for (const viewport of viewports) {
    for (const theme of ["light","dark"]) {
      const context = await browser.newContext({viewport:{width:viewport.width,height:viewport.height},colorScheme:theme,reducedMotion:"reduce"});
      await installTheme(context,theme);
      const page = await context.newPage();
      const errors = monitor(page);
      for (const route of trackPages) {
        const label = `${route.name}/${viewport.name}/${theme}`;
        await page.goto(`${base}ProgramLanguages/JavaScript/${route.file}`,{waitUntil:"networkidle"});
        check(await currentTheme(page) === theme,`${label}: requested theme rendered`);
        check(await page.locator(".home-button").isVisible(),`${label}: Home visible`);
        check(await page.locator(".path-card,.module-card").count() === route.cards,`${label}: every expected card rendered`);
        if (route.name === "home") {
          const resume = page.locator('.hero-actions a[href*="#js-"]');
          check(await resume.getAttribute("target") === "_blank" && (await resume.getAttribute("rel") || "").includes("noopener"),`${label}: Resume opens a protected new tab`);
        } else {
          check(await page.locator(".module-card").evaluateAll(cards => cards.every(card => card.target === "_blank" && card.rel.includes("noopener") && card.rel.includes("noreferrer"))),`${label}: every module card opens a protected new tab`);
          check(await page.locator("#moduleNav [data-nav-id]").evaluateAll(links => links.every(link => link.target === "_blank" && link.rel.includes("noopener") && link.rel.includes("noreferrer"))),`${label}: every sidebar module opens a protected new tab`);
        }
        await auditDom(page,label);
        const dir = path.join(SHOTS,"maps",viewport.name,theme);
        fs.mkdirSync(dir,{recursive:true});
        await page.screenshot({path:path.join(dir,`${route.name}.png`),fullPage:true});
      }
      check(errors.length === 0,`${viewport.name}/${theme}: map rendition runtime/network errors`,errors.join(" | "));
      await context.close();
    }
  }

  for (const viewport of viewports) {
    for (const theme of ["light","dark"]) {
      const context = await browser.newContext({viewport:{width:viewport.width,height:viewport.height},colorScheme:theme,reducedMotion:"reduce"});
      await installTheme(context,theme);
      const page = await context.newPage();
      const errors = monitor(page);
      for (const module of modules) {
        const label = `${module.id}/${viewport.name}/${theme}`;
        await page.goto(`${base}ProgramLanguages/JavaScript/${fileFor(module)}#${module.id.toLowerCase()}`,{waitUntil:"networkidle"});
        check((await page.locator("h1").innerText()) === module.title,`${label}: correct lesson title`);
        check(await page.locator(".lesson-chapter").count() === module.chapters.length,`${label}: all chapters rendered`);
        check(await page.locator(".model-step").count() === module.model.steps.length,`${label}: complete visual model rendered`);
        check(await page.locator(".code-window").count() === 2 && await page.locator("button[data-copy]").count() === 2,`${label}: worked and starter code with copy controls rendered`);
        check(await page.locator(".hints details").count() === module.practice.hints.length,`${label}: every progressive hint rendered`);
        check(await page.locator("[data-diagnostic] input").count() === module.diagnostic.options.length,`${label}: every diagnostic choice rendered`);
        check(await page.locator("[data-quiz] fieldset").count() === module.checks.length,`${label}: every quiz question rendered`);
        check(await page.locator(".lesson-resources a").count() === module.resources.length,`${label}: every selected resource rendered`);
        check(await currentTheme(page) === theme,`${label}: theme rendered without mutation`);
        await auditDom(page,label);
        if ((viewport.name === "desktop" && theme === "light") || (viewport.name === "mobile" && theme === "dark")) {
          const dir = path.join(SHOTS,"lessons",viewport.name,theme);
          fs.mkdirSync(dir,{recursive:true});
          await page.screenshot({path:path.join(dir,`${module.id}.png`),fullPage:true});
        }
      }
      check(errors.length === 0,`${viewport.name}/${theme}: lesson rendition runtime/network errors`,errors.join(" | "));
      await context.close();
    }
  }
}

async function auditHomeAndMaps(browser,base) {
  for (const theme of ["light","dark"]) {
    const context = await browser.newContext({viewport:{width:1280,height:900},reducedMotion:"reduce",permissions:["clipboard-read","clipboard-write"]});
    await installTheme(context,theme);
    const page = await context.newPage();
    const errors = monitor(page);
    await page.goto(`${base}ProgramLanguages/JavaScript/`,{waitUntil:"networkidle"});
    const stable = (label,action) => expectStableTheme(page,theme,`home/${theme}/${label}`,action);
    await stable("Help open",() => page.getByRole("button",{name:"Help"}).click());
    check(await page.getByRole("dialog",{name:"Learn without losing your place"}).isVisible(),`home/${theme}: Help dialog opens`);
    await stable("Help close",() => page.locator("#helpDialog .modal-close").click());
    await stable("Resources open",() => page.getByRole("button",{name:"Resources"}).click());
    await stable("resource filter",() => page.locator("#resourceSearch").fill("Coursera"));
    check(await page.locator("#resourceDirectory .resource-card").count() >= 3,`home/${theme}: resource filter works`);
    await stable("resource clear",() => page.locator("#resourceSearch").fill(""));
    check(await page.locator("#resourceDirectory .resource-card a").evaluateAll((links,count) => links.length === count && links.every(link => link.target === "_blank" && link.rel.includes("noopener") && link.rel.includes("noreferrer")),course.resources.length),`home/${theme}: every catalog resource is a protected new-tab link`);
    await stable("Resources close",() => page.locator("#resourcesDialog .modal-close").click());
    await stable("Placement open",() => page.getByRole("button",{name:"Find my starting point"}).click());
    check(await page.getByRole("dialog",{name:"Choose the earliest uncertain point"}).isVisible(),`home/${theme}: Placement dialog opens`);
    await stable("Placement close",() => page.locator("#placementDialog .modal-close").click());

    const resumePromise = page.waitForEvent("popup");
    await stable("Resume",() => page.locator('.hero-actions a[target="_blank"]').click());
    const resume = await resumePromise;
    await resume.waitForLoadState("networkidle");
    check(resume !== page && resume.url().endsWith("js-101.html#js-001"),`home/${theme}: Resume opens JS-001 in a new tab`);
    check(await currentTheme(resume) === theme,`home/${theme}: Resume popup preserves theme`);
    await resume.close();
    check(page.url().endsWith("/ProgramLanguages/JavaScript/"),`home/${theme}: Resume leaves Home tab in place`);

    for (let index = 0; index < trackPages.length - 1; index += 1) {
      const navigation = await context.newPage();
      monitor(navigation);
      await navigation.goto(`${base}ProgramLanguages/JavaScript/`,{waitUntil:"networkidle"});
      await navigation.locator(".path-card").nth(index).click();
      await navigation.waitForLoadState("networkidle");
      check(navigation.url().endsWith(trackPages[index + 1].file),`home/${theme}: path card ${index + 1} navigates to its map`);
      check(await currentTheme(navigation) === theme,`home/${theme}: path card ${index + 1} preserves theme`);
      await navigation.close();
    }

    for (let index = 0; index < trackPages.length - 1; index += 1) {
      const navigation = await context.newPage();
      monitor(navigation);
      await navigation.goto(`${base}ProgramLanguages/JavaScript/`,{waitUntil:"networkidle"});
      await navigation.locator(".track-nav a").nth(index).click();
      await navigation.waitForLoadState("networkidle");
      check(navigation.url().endsWith(trackPages[index + 1].file),`home/${theme}: track navigation ${index + 1} opens its map`);
      check(await currentTheme(navigation) === theme,`home/${theme}: track navigation ${index + 1} preserves theme`);
      await navigation.close();
    }

    for (const route of trackPages.slice(1)) {
      await page.goto(`${base}ProgramLanguages/JavaScript/${route.file}`,{waitUntil:"networkidle"});
      const startPromise = page.waitForEvent("popup");
      await expectStableTheme(page,theme,`${route.name}/${theme}/Start this path`,() => page.locator(".track-hero .button.primary").click());
      const startPopup = await startPromise;
      await startPopup.waitForLoadState("networkidle");
      check(startPopup !== page && /#js-\d{3}$/.test(startPopup.url()),`${route.name}/${theme}: Start this path opens a new tab`);
      await startPopup.close();

      const cards = page.locator(".module-card");
      for (let index = 0; index < await cards.count(); index += 1) {
        const popupPromise = page.waitForEvent("popup");
        await expectStableTheme(page,theme,`${route.name}/${theme}/card-${index + 1}`,() => cards.nth(index).click());
        const popup = await popupPromise;
        await popup.waitForLoadState("networkidle");
        check(popup !== page && /#js-\d{3}$/.test(popup.url()),`${route.name}/${theme}: module card ${index + 1} opens a new tab`);
        check(await popup.locator(".lesson").count() === 1,`${route.name}/${theme}: module card ${index + 1} renders its lesson`);
        await popup.close();
      }

      const sideLinks = page.locator("#moduleNav [data-nav-id]");
      for (let index = 0; index < await sideLinks.count(); index += 1) {
        const popupPromise = page.waitForEvent("popup");
        await expectStableTheme(page,theme,`${route.name}/${theme}/sidebar-${index + 1}`,() => sideLinks.nth(index).click());
        const popup = await popupPromise;
        await popup.waitForLoadState("networkidle");
        check(popup !== page && await popup.locator(".lesson").count() === 1,`${route.name}/${theme}: sidebar module ${index + 1} opens its lesson in a new tab`);
        await popup.close();
      }

      await expectStableTheme(page,theme,`${route.name}/${theme}/search`,() => page.locator("#courseSearch").fill("security"));
      check(await page.locator("#moduleNav [data-nav-id]:visible").count() <= await sideLinks.count(),`${route.name}/${theme}: search filters without failure`);
      await page.locator("#courseSearch").fill("");
      await expectStableTheme(page,theme,`${route.name}/${theme}/Map link`,() => page.locator("#moduleNav .group-home").click());
      check(await page.locator(".module-card").count() === route.cards,`${route.name}/${theme}: Map link keeps the track map visible`);

      for (const selector of [".home-button",".brand"]) {
        const navigation = await context.newPage();
        monitor(navigation);
        await navigation.goto(`${base}ProgramLanguages/JavaScript/${route.file}`,{waitUntil:"networkidle"});
        await navigation.locator(selector).click();
        await navigation.waitForLoadState("networkidle");
        check(navigation.url().endsWith("/ProgramLanguages/JavaScript/index.html"),`${route.name}/${theme}: ${selector} returns Home`);
        check(await currentTheme(navigation) === theme,`${route.name}/${theme}: ${selector} preserves theme`);
        await navigation.close();
      }
    }
    check(errors.length === 0,`home/maps/${theme}: no runtime or resource errors`,errors.join(" | "));
    await context.close();
  }
}

async function auditMobileControls(browser,base) {
  for (const width of [768,390]) {
    for (const theme of ["light","dark"]) {
      const context = await browser.newContext({viewport:{width,height:width === 390 ? 844 : 900},reducedMotion:"reduce"});
      await installTheme(context,theme);
      const page = await context.newPage();
      const errors = monitor(page);
      await page.goto(`${base}ProgramLanguages/JavaScript/`,{waitUntil:"networkidle"});
      check(await page.getByRole("button",{name:"Help"}).isVisible(),`mobile ${width}/${theme}: Help remains visible`);
      check(await page.getByRole("button",{name:"Resources"}).isVisible(),`mobile ${width}/${theme}: Resources remains visible`);
      await expectStableTheme(page,theme,`mobile ${width}/${theme}/Help`,() => page.getByRole("button",{name:"Help"}).click());
      await page.locator("#helpDialog .modal-close").click();
      await expectStableTheme(page,theme,`mobile ${width}/${theme}/Resources`,() => page.getByRole("button",{name:"Resources"}).click());
      await page.locator("#resourcesDialog .modal-close").click();
      for (const route of trackPages.slice(1)) {
        await page.goto(`${base}ProgramLanguages/JavaScript/${route.file}`,{waitUntil:"networkidle"});
        check(await page.locator(".module-menu-button").isVisible(),`mobile ${width}/${theme}/${route.name}: Modules control visible`);
        await expectStableTheme(page,theme,`mobile ${width}/${theme}/${route.name}/menu open`,() => page.locator(".module-menu-button").click());
        check(await page.evaluate(() => document.body.classList.contains("nav-open")) && await page.locator(".course-nav").isVisible(),`mobile ${width}/${theme}/${route.name}: drawer opens`);
        await expectStableTheme(page,theme,`mobile ${width}/${theme}/${route.name}/close button`,() => page.locator(".drawer-head [data-close-menu]").click());
        check(!await page.evaluate(() => document.body.classList.contains("nav-open")),`mobile ${width}/${theme}/${route.name}: drawer close button works`);
        await page.locator(".module-menu-button").click();
        await expectStableTheme(page,theme,`mobile ${width}/${theme}/${route.name}/backdrop close`,() => page.locator(".nav-backdrop").click({position:{x:width - 10,y:200}}));
        check(!await page.evaluate(() => document.body.classList.contains("nav-open")),`mobile ${width}/${theme}/${route.name}: drawer backdrop closes`);
        check(await page.getByRole("button",{name:"Help"}).isVisible() && await page.getByRole("button",{name:"Resources"}).isVisible(),`mobile ${width}/${theme}/${route.name}: Help and Resources remain visible on maps`);
        await auditDom(page,`mobile-controls/${width}/${theme}/${route.name}`);
      }
      check(errors.length === 0,`mobile controls/${width}/${theme}: no runtime/resource errors`,errors.join(" | "));
      await context.close();
    }
  }
}

async function auditEveryModuleInteraction(browser,base) {
  for (const theme of ["light","dark"]) {
    const context = await browser.newContext({viewport:{width:1280,height:900},reducedMotion:"reduce",permissions:["clipboard-read","clipboard-write"]});
    await installTheme(context,theme);
    const page = await context.newPage();
    const errors = monitor(page);
    for (const module of modules) {
      const prefix = `${module.id}/${theme}`;
      const url = `${base}ProgramLanguages/JavaScript/${fileFor(module)}#${module.id.toLowerCase()}`;
      await page.goto(url,{waitUntil:"networkidle"});
      const stable = (label,action) => expectStableTheme(page,theme,`${prefix}/${label}`,action);
      check(await currentTheme(page) === theme,`${prefix}: opens in requested theme`);

      const chapterLinks = page.locator(".chapter-nav [data-scroll-target]");
      for (let index = 0; index < await chapterLinks.count(); index += 1) {
        const target = await chapterLinks.nth(index).getAttribute("data-scroll-target");
        await stable(`on-page link ${target}`,() => chapterLinks.nth(index).click());
        check(await page.locator(".lesson").count() === 1 && page.url().endsWith(`#${module.id.toLowerCase()}`),`${prefix}: on-page link ${target} keeps lesson route`);
        check(await page.locator(`#${target}`).count() === 1,`${prefix}: on-page target ${target} exists`);
      }

      const copyButtons = page.locator("button[data-copy]");
      for (let index = 0; index < await copyButtons.count(); index += 1) {
        const id = await copyButtons.nth(index).getAttribute("data-copy");
        const expected = await page.locator(`#${id}`).textContent();
        await stable(`copy ${index + 1}`,() => copyButtons.nth(index).click());
        await page.waitForFunction(
          ({buttonIndex}) => document.querySelectorAll("button[data-copy]")[buttonIndex]?.textContent === "Copied",
          {buttonIndex:index}
        );
        check((await copyButtons.nth(index).innerText()) === "Copied",`${prefix}: copy ${index + 1} confirms success`);
        const clipboard = await page.evaluate(() => navigator.clipboard.readText());
        check(clipboard === expected,`${prefix}: copy ${index + 1} writes exact displayed code`);
      }

      const hints = page.locator(".hints summary");
      for (let index = 0; index < await hints.count(); index += 1) {
        await stable(`hint ${index + 1}`,() => hints.nth(index).click());
        check(await hints.nth(index).evaluate(node => node.parentElement.open),`${prefix}: hint ${index + 1} opens`);
      }

      await stable("diagnostic empty submit",() => page.locator("[data-diagnostic] button").click());
      check((await page.locator("[data-diagnostic] .feedback").innerText()) === "Choose an explanation first.",`${prefix}: diagnostic requires an answer`);
      const wrong = (module.diagnostic.answer + 1) % module.diagnostic.options.length;
      await stable("diagnostic wrong choice",() => page.locator(`[data-diagnostic] input[value="${wrong}"]`).check());
      await stable("diagnostic wrong submit",() => page.locator("[data-diagnostic] button").click());
      check((await page.locator("[data-diagnostic] .feedback").innerText()).startsWith("Not yet."),`${prefix}: diagnostic explains wrong answer`);
      await stable("diagnostic correct choice",() => page.locator(`[data-diagnostic] input[value="${module.diagnostic.answer}"]`).check());
      await stable("diagnostic correct submit",() => page.locator("[data-diagnostic] button").click());
      check((await page.locator("[data-diagnostic] .feedback").innerText()).startsWith("Correct."),`${prefix}: diagnostic explains correct answer`);

      await stable("quiz empty submit",() => page.locator("[data-quiz] button").click());
      check(await page.locator("[data-quiz] .answer-note.incomplete").count() === module.checks.length,`${prefix}: quiz requires every answer`);
      for (let index = 0; index < module.checks.length; index += 1) {
        await stable(`quiz answer ${index + 1}`,() => page.locator(`[data-quiz] input[name="q-${index}"][value="${module.checks[index].answer}"]`).check());
      }
      await stable("quiz score",() => page.locator("[data-quiz] button").click());
      check((await page.locator("[data-quiz] .quiz-summary").innerText()).startsWith(`${module.checks.length} of ${module.checks.length}`),`${prefix}: quiz scores all correct answers`);
      check(await page.locator("[data-quiz] .answer-note.correct").count() === module.checks.length,`${prefix}: quiz shows every explanation`);

      const draftValue = `${module.id} ${theme} audit draft`;
      await page.locator("[data-draft]").fill(draftValue);
      check(await currentTheme(page) === theme,`${prefix}: typing a draft preserves theme`);
      check(await page.evaluate(({key,id,value}) => JSON.parse(localStorage.getItem(key)).drafts[id] === value,{key:STORAGE,id:module.id,value:draftValue}),`${prefix}: draft persists locally`);

      await stable("mark complete",() => page.locator("[data-complete]").click());
      check(await page.evaluate(({key,id}) => JSON.parse(localStorage.getItem(key)).done[id] === true,{key:STORAGE,id:module.id}),`${prefix}: explicit completion persists`);
      await stable("undo complete",() => page.locator("[data-complete]").click());
      check(await page.evaluate(({key,id}) => JSON.parse(localStorage.getItem(key)).done[id] === false,{key:STORAGE,id:module.id}),`${prefix}: completion undo persists`);

      await stable("Help open",() => page.getByRole("button",{name:"Help"}).click());
      check(await page.locator("#helpDialog").getAttribute("open") !== null,`${prefix}: Help opens`);
      await stable("Help close",() => page.locator("#helpDialog .modal-close").click());
      await stable("Resources open",() => page.getByRole("button",{name:"Resources"}).click());
      check(await page.locator("#resourcesDialog").getAttribute("open") !== null,`${prefix}: Resources opens`);
      await stable("Resources close",() => page.locator("#resourcesDialog .modal-close").click());
      await page.evaluate(() => window.scrollTo(0,document.body.scrollHeight));
      await page.waitForFunction(() => document.querySelector("[data-to-top]")?.classList.contains("visible"));
      await stable("Top",() => page.locator("[data-to-top]").click());
      await page.waitForFunction(() => window.scrollY < 10);
      check(await page.evaluate(() => window.scrollY < 10),`${prefix}: Top returns to page start`);

      await page.locator("button[data-theme]").click();
      check(await currentTheme(page) !== theme,`${prefix}: theme button changes theme`);
      await page.locator("button[data-theme]").click();
      check(await currentTheme(page) === theme,`${prefix}: theme button returns to starting theme`);

      for (const direction of ["a:not(.next)","a.next"]) {
        const link = page.locator(`.lesson-pagination ${direction}`);
        if (!await link.count()) continue;
        const navigation = await context.newPage();
        const navigationErrors = monitor(navigation);
        await navigation.goto(url,{waitUntil:"networkidle"});
        const before = navigation.url();
        await navigation.locator(`.lesson-pagination ${direction}`).click();
        await navigation.waitForLoadState("networkidle");
        check(navigation.url() !== before && await navigation.locator("h1").count() === 1,`${prefix}: ${direction.includes("next") ? "Next" : "Previous"} navigates in the same tab`);
        check(await currentTheme(navigation) === theme,`${prefix}: pagination preserves theme`);
        check(navigationErrors.length === 0,`${prefix}: pagination has no runtime/resource errors`,navigationErrors.join(" | "));
        await navigation.close();
      }
    }

    await page.goto(`${base}ProgramLanguages/JavaScript/js-101.html#js-001`,{waitUntil:"networkidle"});
    await page.locator("[data-complete]").click();
    page.once("dialog",dialog => dialog.accept());
    await expectStableTheme(page,theme,`reset/${theme}`,() => page.locator("[data-reset]").click());
    check(await page.evaluate(key => {
      const saved = JSON.parse(localStorage.getItem(key));
      return Object.keys(saved.done).length === 0 && Object.keys(saved.quiz).length === 0 &&
        Object.keys(saved.drafts).length === 0 && saved.last === "JS-001";
    },STORAGE),`reset/${theme}: reset clears progress, quiz answers, drafts, and resume position`);
    check(errors.length === 0,`all-module interactions/${theme}: no runtime/resource errors`,errors.join(" | "));
    await context.close();
  }
}

async function auditCaseRouting(browser,base) {
  const context = await browser.newContext({viewport:{width:1280,height:900}});
  const page = await context.newPage();
  const errors = monitor(page);
  const variants = [
    ["PROGRAMLANGUAGES/JAVASCRIPT/","ProgramLanguages/JavaScript/"],
    ["programlanguages/javascript/JS-101.HTML#js-004","ProgramLanguages/JavaScript/js-101.html#js-004"],
    ["ProgramLanguages/javascript/Js-201.Html#js-012","ProgramLanguages/JavaScript/js-201.html#js-012"],
    ["programlanguages/JavaScript/JS-301.html#js-022","ProgramLanguages/JavaScript/js-301.html#js-022"],
    ["PROGRAMLANGUAGES/javascript/js-401.HTML","ProgramLanguages/JavaScript/js-401.html"],
    ["programlanguages/JAVASCRIPT/JS-REFERENCE.HTML#js-031","ProgramLanguages/JavaScript/js-reference.html#js-031"]
  ];
  for (const [variant,canonical] of variants) {
    await page.goto(`${base}${variant}`,{waitUntil:"networkidle"});
    check(page.url() === `${base}${canonical}`,`case routing: ${variant} -> ${canonical}`,page.url());
    check(await page.locator("h1").count() === 1,`case routing: ${variant} renders destination`);
  }
  check(errors.length === 0,"case routing: no unexpected runtime/resource errors",errors.join(" | "));
  await context.close();
}

async function main() {
  fs.mkdirSync(SHOTS,{recursive:true});
  const server = createServer();
  await new Promise((resolve,reject) => server.listen(0,"127.0.0.1",error => error ? reject(error) : resolve()));
  const base = `http://127.0.0.1:${server.address().port}/shared/`;
  const browser = await chromium.launch({headless:true});
  try {
    await auditAllRenditions(browser,base);
    await auditHomeAndMaps(browser,base);
    await auditMobileControls(browser,base);
    await auditEveryModuleInteraction(browser,base);
    await auditCaseRouting(browser,base);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
  const screenshotCount = fs.readdirSync(path.join(SHOTS,"lessons","desktop","light")).length + fs.readdirSync(path.join(SHOTS,"lessons","mobile","dark")).length + viewports.length * 2 * trackPages.length;
  check(screenshotCount === 114,"complete rendition screenshot count","expected=114 actual=" + screenshotCount);
  console.log(`\nRESULT ${checked} checks; ${failures.length} failures; ${screenshotCount} full-page renditions`);
  console.log("RENDITIONS",SHOTS);
  if (failures.length) process.exitCode = 1;
}

main().catch(error => { console.error(error); process.exit(1); });
