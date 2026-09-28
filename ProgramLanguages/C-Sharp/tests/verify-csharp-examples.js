"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),cp=require("node:child_process");
const ROOT=path.resolve(__dirname,".."),context={window:{}};vm.createContext(context);for(const file of["course-core.js","data-course.js"])vm.runInContext(fs.readFileSync(path.join(ROOT,"assets",file),"utf8"),context);
const dotnet=cp.spawnSync("dotnet",["--version"],{encoding:"utf8"}),available=!dotnet.error&&dotnet.status===0;let pass=0,fail=0;
for(const module of context.window.CSharpCourse.modules){for(const [kind,source]of[["example",module.example.source],["starter",module.practice.starter]]){const pairs=[["{","}"],["(",")"],["[","]"]],balanced=pairs.every(([a,b])=>source.split(a).length===source.split(b).length),valid=/using System;/.test(source)&&/internal static class Lesson\d+/.test(source)&&/static void Main\(\)/.test(source)&&/Console\.WriteLine\(/.test(source)&&balanced&&!/\bJAVA\b|javac|JVM/.test(source);if(valid)pass++;else{fail++;console.error(`FAIL ${module.id} ${kind}: static C# source contract`);}}}
console.log(`PASS ${pass} FAIL ${fail} DOTNET ${available?(dotnet.stdout||"").trim():"UNAVAILABLE_STATIC_ONLY"}`);if(fail)process.exitCode=1;
