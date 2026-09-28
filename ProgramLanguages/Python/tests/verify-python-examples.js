"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),{spawnSync}=require("node:child_process");
const ROOT=path.resolve(__dirname,".."),context={window:{}};vm.createContext(context);for(const file of["course-core.js","data-course.js"])vm.runInContext(fs.readFileSync(path.join(ROOT,"assets",file),"utf8"),context);
const python=process.env.PYTHON_BIN||"python3";let pass=0,fail=0;
for(const module of context.window.PyCourse.modules){for(const [kind,source] of [["example",module.example.source],["starter",module.practice.starter]]){const result=spawnSync(python,["-c","import ast,sys; ast.parse(sys.stdin.read())"],{input:source,encoding:"utf8"});if(result.status===0)pass++;else{fail++;console.error(`FAIL ${module.id} ${kind}: ${result.stderr.trim()}`);}}}
console.log(`PASS ${pass} FAIL ${fail}`);if(fail)process.exitCode=1;
