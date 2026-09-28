"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname,"..");
const context = vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(ROOT,"assets/course-core.js"),"utf8"),context);
const resources = context.window.RustCourse.resources;
const acceptedRestricted = new Set([401,403,405,406,429]);
let next = 0;
let ok = 0;
let restricted = 0;
const failures = [];

async function verify(resource) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(),20000);
  try {
    const response = await fetch(resource.url,{
      redirect:"follow",
      signal:controller.signal,
      headers:{"user-agent":"Mozilla/5.0 Rust-Learning-Lab-Link-Audit/2.0","accept":"text/html,application/xhtml+xml,application/json;q=0.8,*/*;q=0.5"}
    });
    const originalHost = new URL(resource.url).hostname;
    const finalHost = new URL(response.url).hostname;
    const corporateRestriction = finalHost.endsWith("t-mobile.com") && finalHost !== originalHost;
    if (corporateRestriction) {
      restricted += 1;
      console.log("REACHABLE-RESTRICTED","corporate-filter",resource.id,resource.url);
    } else if (response.ok || (response.status >= 300 && response.status < 400)) {
      ok += 1;
      console.log("PASS",response.status,resource.id,resource.url);
    } else if (acceptedRestricted.has(response.status)) {
      restricted += 1;
      console.log("REACHABLE-RESTRICTED",response.status,resource.id,response.url);
    } else {
      failures.push(`${resource.id}: HTTP ${response.status} ${resource.url}`);
      console.error("FAIL",response.status,resource.id,resource.url);
    }
  } catch (error) {
    failures.push(`${resource.id}: ${error.name} ${resource.url}`);
    console.error("FAIL",error.name,resource.id,resource.url);
  } finally { clearTimeout(timer); }
}

async function worker() {
  while (next < resources.length) {
    const index = next;
    next += 1;
    await verify(resources[index]);
  }
}

Promise.all(Array.from({length:5},worker)).then(() => {
  console.log(`\nRESULT ${ok} directly loaded; ${restricted} reachable but access-restricted; ${failures.length} broken or unreachable`);
  if (failures.length) {
    console.error(failures.join("\n"));
    process.exitCode = 1;
  }
});
