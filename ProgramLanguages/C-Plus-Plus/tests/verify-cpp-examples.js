"use strict";
const fs=require("node:fs"),path=require("node:path"),os=require("node:os"),vm=require("node:vm"),cp=require("node:child_process");
const ROOT=path.resolve(__dirname,".."),context={window:{}};vm.createContext(context);for(const file of["course-core.js","data-course.js"])vm.runInContext(fs.readFileSync(path.join(ROOT,"assets",file),"utf8"),context);
const temp=fs.mkdtempSync(path.join(os.tmpdir(),"cpp-learning-lab-"));let pass=0,fail=0;
try{for(const module of context.window.CppCourse.modules){for(const [kind,source]of[["example",module.example.source],["starter",module.practice.starter]]){const dir=path.join(temp,module.id,kind);fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,"lesson.cpp"),output=path.join(dir,"lesson");fs.writeFileSync(file,source);const result=cp.spawnSync("clang++",["-std=c++17","-Wall","-Wextra","-Wpedantic","-Werror",file,"-o",output],{encoding:"utf8"});if(result.status===0)pass++;else{fail++;console.error(`FAIL ${module.id} ${kind}: ${(result.stderr||result.stdout).trim()}`);}}}}
finally{fs.rmSync(temp,{recursive:true,force:true});}
console.log(`PASS ${pass} FAIL ${fail}`);if(fail)process.exitCode=1;
