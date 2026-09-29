(function () {
  "use strict";

  const course = window.JSCourse = {
    title: "JavaScript Learning Lab",
    version: "2.2",
    release: "October 2026",
    lastVerified: "2026-09-27",
    author: "Namiranian, Babak",
    storageKey: "javascript-learning-lab-v2",
    modules: [],
    resources: []
  };

  course.code = lines => lines.join("\n");
  course.addModule = definition => {
    const number = course.modules.length + 1;
    const module = {
      id: `JS-${String(number).padStart(3, "0")}`,
      number,
      minutes: 75,
      prerequisites: [],
      outcomes: [],
      chapters: [],
      checks: [],
      resources: [],
      ...definition
    };
    course.modules.push(module);
    return module;
  };
  course.addDeepDive = (moduleId, paragraphs) => {
    const module = course.modules.find(item => item.id === moduleId);
    if (!module || paragraphs.length !== module.chapters.length) throw new Error(`Invalid deep-dive material for ${moduleId}`);
    module.chapters.forEach((chapter, index) => chapter.text.push(paragraphs[index]));
  };

  const addResource = resource => course.resources.push({
    access: "Free",
    status: "Living documentation",
    verified: course.lastVerified,
    ...resource
  });

  [
    {id:"ecma262",title:"ECMAScript Language Specification",provider:"TC39 / Ecma",kind:"Specification",url:"https://tc39.es/ecma262/",bestFor:"The authoritative, continuously maintained definition of the JavaScript language.",scope:"Living specification; the editionless URL follows the current published draft."},
    {id:"tc39-proposals",title:"TC39 proposals",provider:"TC39",kind:"Standards tracker",url:"https://github.com/tc39/proposals",bestFor:"Checking whether proposed syntax is standardized, its stage, and its specification text.",scope:"Living repository; Stage 4 proposals are candidates for the next annual ECMAScript edition."},
    {id:"mdn-guide",title:"JavaScript Guide",provider:"MDN",kind:"Reference",url:"https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",bestFor:"Readable explanations of language features with browser-oriented examples.",scope:"Living documentation; verify runtime support on individual feature pages."},
    {id:"mdn-reference",title:"JavaScript Reference",provider:"MDN",kind:"Reference",url:"https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference",bestFor:"Precise syntax, built-ins, errors, operators, statements and compatibility data.",scope:"Living documentation."},
    {id:"node-api",title:"Node.js API documentation — latest",provider:"Node.js",kind:"Official documentation",url:"https://nodejs.org/docs/latest/api/",bestFor:"Current Node.js APIs and runtime behavior.",scope:"Tracks the latest Current release; select the learner's installed version when behavior is version-sensitive."},
    {id:"node-learn",title:"Learn Node.js",provider:"Node.js",kind:"Official learning",url:"https://nodejs.org/en/learn",bestFor:"Official conceptual explanations and practical Node.js examples.",scope:"Living documentation."},
    {id:"node-releases",title:"Node.js release schedule",provider:"Node.js",kind:"Official release policy",url:"https://nodejs.org/en/about/previous-releases",bestFor:"Choosing a supported LTS version and identifying end-of-life lines.",scope:"Living schedule; use a supported LTS for learning projects unless a feature specifically needs Current."},
    {id:"vscode-download",title:"Download Visual Studio Code",provider:"Microsoft",kind:"Official download",url:"https://code.visualstudio.com/download",bestFor:"Platform-specific installers for Windows, macOS and Linux.",scope:"Current stable release."},
    {id:"vscode-js",title:"Working with JavaScript",provider:"VS Code",kind:"Official documentation",url:"https://code.visualstudio.com/docs/nodejs/working-with-javascript",bestFor:"IntelliSense, type checking, navigation and JavaScript project support.",scope:"Living documentation."},
    {id:"vscode-node",title:"Node.js tutorial in VS Code",provider:"VS Code",kind:"Official tutorial",url:"https://code.visualstudio.com/docs/nodejs/nodejs-tutorial",bestFor:"Installing Node.js, verifying PATH and running a first application.",scope:"Living documentation."},
    {id:"vscode-debug",title:"Debugging Node.js",provider:"VS Code",kind:"Official documentation",url:"https://code.visualstudio.com/docs/nodejs/nodejs-debugging",bestFor:"Breakpoints, launch configurations, auto attach and debug consoles.",scope:"Living documentation."},
    {id:"vscode-profiles",title:"VS Code Profiles",provider:"VS Code",kind:"Official documentation",url:"https://code.visualstudio.com/docs/configure/profiles",bestFor:"Keeping JavaScript tooling separate from Python or other development setups.",scope:"Living documentation."},
    {id:"npm-docs",title:"npm documentation",provider:"npm",kind:"Official documentation",url:"https://docs.npmjs.com/",bestFor:"package.json, dependency installation, scripts, publishing and security commands.",scope:"Living documentation; behavior can depend on the npm version bundled with Node."},
    {id:"node-test",title:"Node.js test runner",provider:"Node.js",kind:"Official documentation",url:"https://nodejs.org/docs/latest/api/test.html",bestFor:"Tests, suites, hooks, mocking and coverage without an external framework.",scope:"Latest Node API; use version-matched docs for older LTS lines."},
    {id:"git-book",title:"Pro Git",provider:"Git project",kind:"Book",url:"https://git-scm.com/book/en/v2",bestFor:"Version-control fundamentals, branching, remotes and recovery.",scope:"Second book edition; check commands against current Git documentation."},
    {id:"eloquent",title:"Eloquent JavaScript — 4th edition",provider:"Marijn Haverbeke",kind:"Book",url:"https://eloquentjavascript.net/",bestFor:"Detailed language, browser and Node.js teaching reinforced by exercises and projects.",scope:"2024 fourth edition.",access:"Free online; paid print edition optional"},
    {id:"ydkjs",title:"You Don't Know JS Yet",provider:"Kyle Simpson",kind:"Book series",url:"https://github.com/getify/You-Dont-Know-JS",bestFor:"Deeper treatment of JavaScript mechanics after the beginner foundation.",scope:"Second-edition work; individual books have different completion status."},
    {id:"javascript-info",title:"The Modern JavaScript Tutorial",provider:"Ilya Kantor and contributors",kind:"Tutorial",url:"https://javascript.info/",bestFor:"Detailed language and browser lessons with tasks and solutions.",scope:"Continuously maintained tutorial."},
    {id:"exercism",title:"JavaScript track",provider:"Exercism",kind:"Practice",url:"https://exercism.org/tracks/javascript",bestFor:"Small exercises, concept practice and automated feedback.",scope:"Living curriculum."},
    {id:"freecodecamp",title:"JavaScript Algorithms and Data Structures",provider:"freeCodeCamp",kind:"Interactive course",url:"https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/",bestFor:"Additional browser-based drills and certification projects.",scope:"Versioned curriculum path; supplement rather than authority."},
    {id:"coursera-intro",title:"Introduction to JavaScript for Beginners",provider:"Coursera / SkillsBooster",kind:"Guided course",url:"https://www.coursera.org/learn/introduction-to-javascript-for-beginners",bestFor:"A structured beginner sequence spanning Node.js, the browser and a vanilla JavaScript project.",scope:"Hosted course metadata can change; recheck the syllabus, tool versions and enrollment terms before starting.",access:"Freemium/Paid — preview, subscription and certificate terms vary"},
    {id:"coursera-node",title:"Developing Back-End Apps with Node.js and Express",provider:"Coursera / IBM",kind:"Guided course",url:"https://www.coursera.org/learn/developing-backend-apps-with-nodejs-and-express",bestFor:"Hands-on Node.js, npm, asynchronous work, Express and API labs.",scope:"Living hosted course; compare commands and APIs with current official docs.",access:"Freemium/Paid — enrollment and certificate terms vary"},
    {id:"coursera-api",title:"Building Backend APIs with Node.js and Express",provider:"Coursera",kind:"Guided course",url:"https://www.coursera.org/learn/building-backend-apis-nodejs-express",bestFor:"A recent guided progression through routing, middleware, validation and API structure.",scope:"Provider reported as updated June 2026.",access:"Freemium/Paid — enrollment and certificate terms vary"},
    {id:"youtube-js",title:"JavaScript Programming — Full Course",provider:"freeCodeCamp.org",kind:"YouTube tutorial",url:"https://www.youtube.com/watch?v=PkZNo7MFNFg",bestFor:"A long-form video introduction when a visual walkthrough helps.",scope:"Older recording; use for fundamentals and verify syntax and tooling against current documentation."},
    {id:"youtube-node",title:"Getting Started with Node.js — Full Tutorial",provider:"freeCodeCamp.org",kind:"YouTube tutorial",url:"https://www.youtube.com/watch?v=gG3pytAY2MY",bestFor:"A broad Node.js overview including modules, npm, HTTP, async work, events, streams and debugging.",scope:"2019 recording; compare CommonJS and tool commands with current Node documentation."},
    {id:"youtube-node-channel",title:"OpenJS Foundation YouTube channel",provider:"OpenJS Foundation",kind:"YouTube channel",url:"https://www.youtube.com/@OpenJSFoundation",bestFor:"Node.js project talks, foundation events and maintainers' explanations.",scope:"Living channel covering Node.js and other OpenJS projects; select videos by topic, date and runtime line."},
    {id:"youtube-vscode",title:"Visual Studio Code official YouTube channel",provider:"Microsoft",kind:"YouTube channel",url:"https://www.youtube.com/@code",bestFor:"Current editor features, debugging demonstrations and release explainers.",scope:"Living channel; confirm OS-specific shortcuts in current VS Code docs."},
    {id:"web-apis",title:"Web API reference",provider:"MDN",kind:"Reference",url:"https://developer.mozilla.org/en-US/docs/Web/API",bestFor:"DOM, events, Fetch, storage, workers and browser APIs.",scope:"Living documentation with browser compatibility tables."},
    {id:"web-accessibility",title:"Learn Accessibility",provider:"web.dev",kind:"Course",url:"https://web.dev/learn/accessibility",bestFor:"Accessible HTML, keyboard behavior, focus, forms and testing.",scope:"Living course."},
    {id:"express",title:"Express documentation",provider:"Express",kind:"Official documentation",url:"https://expressjs.com/",bestFor:"Routing, middleware, error handling, security and migration guidance.",scope:"Living documentation; check the major version used by the project."},
    {id:"postgres",title:"PostgreSQL current tutorial",provider:"PostgreSQL",kind:"Official tutorial",url:"https://www.postgresql.org/docs/current/tutorial.html",bestFor:"Relational design, queries, joins, aggregates, transactions and constraints.",scope:"The /current/ alias follows the current PostgreSQL documentation."},
    {id:"typescript",title:"TypeScript Handbook",provider:"Microsoft",kind:"Official documentation",url:"https://www.typescriptlang.org/docs/handbook/",bestFor:"TypeScript's model, narrowing, generics, modules and JavaScript migration.",scope:"Living documentation."},
    {id:"react",title:"React Learn",provider:"React",kind:"Official tutorial",url:"https://react.dev/learn",bestFor:"Modern components, state, effects and application data flow.",scope:"Living documentation."},
    {id:"vite",title:"Vite Guide",provider:"Vite",kind:"Official documentation",url:"https://vite.dev/guide/",bestFor:"Creating, running, building and configuring modern browser projects.",scope:"Living documentation; note the project's Vite major version."},
    {id:"owasp-node",title:"Node.js Security Cheat Sheet",provider:"OWASP",kind:"Security guidance",url:"https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html",bestFor:"Runtime, server, error, validation and dependency safeguards.",scope:"Living community security guidance."},
    {id:"owasp-api",title:"REST Security Cheat Sheet",provider:"OWASP",kind:"Security guidance",url:"https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html",bestFor:"Transport, access control, input validation, HTTP methods and operational protections.",scope:"Living community security guidance."},
    {id:"owasp-auth",title:"Authentication Cheat Sheet",provider:"OWASP",kind:"Security guidance",url:"https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html",bestFor:"Authentication, password, session and reauthentication design.",scope:"Living community security guidance."},
    {id:"otel",title:"OpenTelemetry JavaScript",provider:"OpenTelemetry",kind:"Official documentation",url:"https://opentelemetry.io/docs/languages/js/",bestFor:"Vendor-neutral traces, metrics and log correlation.",scope:"Living documentation; individual instrumentation packages have maturity labels."},
    {id:"docker",title:"Docker Get Started",provider:"Docker",kind:"Official tutorial",url:"https://docs.docker.com/get-started/",bestFor:"Container concepts and reproducible local packaging.",scope:"Living documentation.",access:"Freemium — documentation is free; product licensing and hosted services vary"},
    {id:"github-actions",title:"GitHub Actions documentation",provider:"GitHub",kind:"Official documentation",url:"https://docs.github.com/en/actions",bestFor:"Automated tests, builds, artifacts and deployment workflows.",scope:"Living documentation.",access:"Freemium — public and account quotas vary"}
  ].forEach(addResource);
})();
