# JavaScript Learning Lab

**Version:** 2.1<br>
**Release:** October 2026<br>
**Author:** Namiranian, Babak

JavaScript Learning Lab is a local-first, static tutorial for learners who understand some programming ideas but may have little hands-on JavaScript experience. It teaches through connected explanations, runnable examples, failure analysis, progressive hints, quizzes and three substantial capstones. Node.js is the primary runtime; browser development is covered as a distinct host environment.

## Learning paths

- **Beginner — JS-001 to JS-011:** orientation, complete VS Code setup on Windows/macOS/Linux, language mechanics, modules, npm, debugging, testing and a CLI capstone.
- **Intermediate — JS-012 to JS-021:** async behavior, cancellation, Node files/processes/streams, HTTP, Express, browser DOM/fetch/storage, PostgreSQL and a service capstone.
- **Advanced — JS-022 to JS-030:** object protocols, TypeScript, React/Vite, security, architecture, performance, reliability, CI/containers and a production-shaped capstone.
- **Reference — JS-031 to JS-033:** legacy/CommonJS literacy, debugging playbooks, glossary and a curated resource/practice library.

The landing page explains the paths and placement options. Module cards and sidebar module links open lessons in a new tab. Previous and Next stay in the current lesson tab. Progress counts only when the learner explicitly selects **Mark module complete**. Completion, quiz results, drafts, theme and resume position are stored only in the current browser and can be reset.

## Run locally

No install or build is required. From the `Shared` repository root, serve the files over HTTP so browser module, storage and navigation behavior match hosting more closely.

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/ProgramLanguages/JavaScript/`. On Windows, `py -m http.server 8000` may be the available launcher; on macOS and Linux, `python3` is typical. The tutorial itself contains full VS Code and platform-specific setup guidance.

## Verification

From this directory:

```bash
node tests/verify-course.js
NODE_PATH=/path/to/node_modules node tests/verify-browser.js
NODE_PATH=/path/to/node_modules node tests/verify-complete-browser.js
node tests/verify-external-links.js
```

The structural audit validates curriculum depth, resource coverage, authorship, platform guidance, page shells, case routing, interaction features and stale-version absence. The browser audit exercises navigation, new-tab modules, local completion, quizzes, syntax highlighting, copy controls, search, theme, mixed-case redirects and responsive layouts. The complete browser audit renders every page in both themes at four viewport sizes, exercises every module interaction, and retains 114 full-page screenshots for visual review. The external-link audit checks every curated resource and distinguishes direct success from provider access restrictions.

## Hosting and URL compatibility

The canonical GitHub Pages path is `/shared/ProgramLanguages/JavaScript/`. Repository-level `404.html` normalization supports common upper/lower-case variants of the JavaScript directory and track filenames while preserving query strings and lesson hashes. Canonical internal links stay consistent because GitHub Pages paths are case-sensitive.

## Optional future companion

The current tutorial is complete without AI. A future optional companion may use Ministral 3 14B only through Babak's backend path: frontend to backend, n8n/PostgreSQL to the model, then a validated response back to the frontend. The frontend will not receive model credentials or call the model directly. The companion will remain advisory and will not own course rules, completion or project evaluation.
