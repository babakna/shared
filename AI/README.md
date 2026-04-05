# AI Learning Tools

A progressive five-course AI learning series — from foundational concepts to the bleeding edge. Each course is a fully self-contained, single-file HTML application with interactive modules, quizzes, visual diagrams, searchable glossaries, and curated resources. No installation, no dependencies, no server required.

## The Learning Path

| Course | Title | Audience | What You'll Learn |
|--------|-------|----------|-------------------|
| **AI-101** | AI Essentials | Content editors, non-technical professionals | What AI is, how it works, prompt engineering, workflow integration, ethics, and responsible use |
| **AI-102** | AI Deep Dive | Intermediate practitioners | RAG, embeddings, MCP, agentic AI, Constitutional AI, advanced prompting, red-teaming |
| **AI-103** | Models & Algorithms Explorer | All levels (reference tool) | Interactive reference to 35 AI/ML models with architecture diagrams, comparisons, decision helper, and timeline |
| **AI-104** | Building with AI | Engineers, technical implementers | API implementation, RAG engineering (naive to agentic to graph), MCP servers, MoE/distillation/quantization, evaluation, security |
| **AI-105** | The AI Frontier | Pioneers, researchers, strategists | Reasoning models, agentic economy, TinyML, Kinetic Token, interpretability, AI safety, business strategy, economic impact |

Courses 101 and 102 are sequential and designed for progressive completion. Course 103 is a standalone reference tool. Courses 104 and 105 build on all prior material and assume familiarity with earlier concepts.

## Features

- **Fully self-contained** — Each file is a single HTML document. No external dependencies, no build tools, no frameworks. Open in any browser.
- **Cross-navigation** — A course navigator bar links all five courses. Each file maintains its own COURSES array for full independence.
- **Interactive learning** — Quizzes with randomized question pools, flow simulators, decision trees, interactive comparators, and hands-on demos.
- **Visual-first design** — SVG architecture diagrams, flow charts, comparison matrices, and data visualizations throughout.
- **Comprehensive glossaries** — 106 terms (AI-101/102), 125 terms (AI-103), approximately 150 terms (AI-104), approximately 190 terms (AI-105). Searchable, filterable, and cross-linked.
- **Curated resources** — Hand-picked documentation, courses, visual explainers, tools, seminal papers, and staying-current feeds. Every resource annotated with why it was chosen and estimated time commitment.
- **Mobile responsive** — Full breakpoints at 1024px, 768px, and 480px. Mobile drawer navigation with touch-friendly targets.
- **Accessible** — Keyboard navigation, focus-visible styles, Ctrl+K search, and print-friendly output.
- **Light mode** — Clean blue/purple palette designed for readability.

## Live Versions

- [AI-101: AI Essentials](https://babakna.github.io/shared/AI/AI-101.html)
- [AI-102: AI Deep Dive](https://babakna.github.io/shared/AI/AI-102.html)
- [AI-103: Models & Algorithms Explorer](https://babakna.github.io/shared/AI/AI-103.html)
- [AI-104: Building with AI](https://babakna.github.io/shared/AI/AI-104.html)
- [AI-105: The AI Frontier](https://babakna.github.io/shared/AI/AI-105.html)

## File Structure

```
AI/
├── AI-101.html          AI Essentials (beginner)
├── AI-102.html          AI Deep Dive (intermediate)
├── AI-103.html          Models & Algorithms Explorer (reference)
├── AI-104.html          Building with AI (advanced / engineering)
├── AI-105.html          The AI Frontier (pioneer)
└── README.md            This file
```

No shared assets, no CSS files, no JavaScript bundles. Each HTML file contains all its own styles, scripts, data, and content. Download any single file and it works standalone.

## Design Principles

- **Single-file architecture** — Every course is one HTML file. Portable, downloadable, hostable anywhere.
- **Data-driven content** — Modules, glossaries, quizzes, and resources are defined as JavaScript data arrays. Adding content means adding an object to an array.
- **Progressive complexity** — The series ramps from "what is AI" to frontier research. Each course assumes familiarity with prior ones, except AI-103 which stands alone as a reference.
- **Visual learning** — SVG diagrams, flow simulators, and interactive elements are first-class content, not decoration.
- **Evergreen plus current** — Foundational concepts are stable. Staying Current resources (newsletters, podcasts, live trackers) keep the content pipeline fresh without requiring page updates.
- **Collapsible content** — Learning roadmaps, deeper-dive sections, and resource groups use collapsible sections to keep pages scannable while allowing unlimited depth.

## Content Currency

Content as of **April 2026**. Model data, timeline entries, and resource links reflect the state of the field at that date. Staying Current resources (The Batch, Import AI, Chatbot Arena, Artificial Analysis, and others) are self-updating feeds that remain relevant beyond the content date.

## Adding a New Course

The cross-navigation uses a COURSES array duplicated in each file:

```javascript
const COURSES = [
  {id:'101', label:'AI Essentials', file:'AI-101.html'},
  {id:'102', label:'AI Deep Dive', file:'AI-102.html'},
  {id:'103', label:'Models Explorer', file:'AI-103.html'},
  {id:'104', label:'Building with AI', file:'AI-104.html'},
  {id:'105', label:'The AI Frontier', file:'AI-105.html'}
];
const THIS_COURSE = '101'; // differs per file
```

To add a new course (e.g., AI-106):
1. Add the new entry to the COURSES array in all existing files
2. Create the new HTML file with the appropriate THIS_COURSE value
3. Update this README

## Author

Brought to you by **Babak**

## License

Educational use. All content is original unless cited. External resources link to their respective providers.