# AI Learning Tools

A progressive six-course AI learning series -- from foundational concepts to operating-model strategy. Each course is a fully self-contained HTML application with interactive modules, quizzes, visual diagrams, searchable glossaries, and curated resources. No installation, no dependencies, no server required.

## The Learning Path

| Course | Title | Audience | What You'll Learn |
|--------|-------|----------|-------------------|
| **AI-101** | AI Essentials | Content editors, non-technical professionals | What AI is, how it works, prompt engineering, workflow integration, ethics, and responsible use |
| **AI-102** | AI Deep Dive | Intermediate practitioners | RAG, embeddings, MCP, agentic AI, Constitutional AI, advanced prompting, red-teaming |
| **AI-103** | Models & Algorithms Explorer | All levels (reference tool) | Interactive reference to 48 AI/ML models with architecture diagrams, comparisons, decision helper, and timeline |
| **AI-104** | Building with AI | Engineers, technical implementers | API implementation, RAG engineering, MCP servers, MoE/distillation/quantization, evaluation, security, and production patterns |
| **AI-105** | The AI Frontier | Pioneers, researchers, strategists | Reasoning models, agentic workflows, efficient AI, interpretability, safety, business strategy, and economic impact |
| **AI-106** | AI Strategy & Operating Model | Leaders, product owners, governance, platform, and risk teams | AI operating models, portfolio governance, evaluation, risk controls, economics, adoption, and rollout planning |

Courses 101 and 102 are sequential and designed for progressive completion. Course 103 is a standalone reference tool. Courses 104 and 105 build on the earlier material. Course 106 is the capstone for turning AI fluency into repeatable operating practice.

## Features

- **Self-contained delivery** -- Each course is a standalone HTML document. The landing page uses two local PNG assets. No external dependencies, no build tools, no frameworks.
- **Cross-navigation** -- A course navigator bar links all six courses. Each file maintains its own COURSES array for full independence.
- **Interactive learning** -- Quizzes with randomized question pools, flow simulators, decision trees, interactive comparators, and hands-on demos.
- **Visual-first design** -- SVG architecture diagrams, flow charts, comparison matrices, and data visualizations throughout.
- **Comprehensive glossaries** -- 117 terms in AI-101, 112 in AI-102, 132 in AI-103, 152 in AI-104, 198 in AI-105, and 28 in AI-106.
- **Curated resources** -- Hand-picked documentation, courses, visual explainers, tools, seminal papers, standards, and staying-current feeds. Every resource is annotated with why it was chosen and estimated time commitment where appropriate.
- **Mobile responsive** -- Breakpoints at tablet and phone widths, mobile drawer navigation where needed, and touch-friendly controls.
- **Accessible** -- Keyboard navigation, focus-visible styles, search shortcuts where supported, semantic labels, and print-friendly output.
- **Light/dark support** -- Courses use readable palettes with persisted theme choices where implemented.

## Live Versions

- [AI-101: AI Essentials](https://babakna.github.io/shared/AI/AI-101.html)
- [AI-102: AI Deep Dive](https://babakna.github.io/shared/AI/AI-102.html)
- [AI-103: Models & Algorithms Explorer](https://babakna.github.io/shared/AI/AI-103.html)
- [AI-104: Building with AI](https://babakna.github.io/shared/AI/AI-104.html)
- [AI-105: The AI Frontier](https://babakna.github.io/shared/AI/AI-105.html)
- [AI-106: AI Strategy & Operating Model](https://babakna.github.io/shared/AI/AI-106.html)

## File Structure

```text
AI/
|-- index.html           AI learning path landing page
|-- 1.png                Landing page visual asset
|-- 2.png                Landing page visual asset
|-- AI-101.html          AI Essentials (beginner)
|-- AI-102.html          AI Deep Dive (intermediate)
|-- AI-103.html          Models & Algorithms Explorer (reference)
|-- AI-104.html          Building with AI (advanced / engineering)
|-- AI-105.html          The AI Frontier (pioneer)
|-- AI-106.html          AI Strategy & Operating Model (capstone)
`-- README.md            This file
```

Each course keeps its own styles, scripts, data, and content. The course files are portable as standalone HTML pages; the landing page expects `1.png` and `2.png` to remain beside it.

## Design Principles

- **Single-file course architecture** -- Every course is one HTML file so it can be hosted, downloaded, or opened locally.
- **Data-driven content** -- Modules, glossaries, quizzes, and resources are defined as JavaScript data arrays. Adding content means adding an object to an array.
- **Progressive complexity** -- The series ramps from "what is AI" to frontier research and operational governance. Each course assumes familiarity with prior ones except AI-103, which stands alone as a reference.
- **Visual learning** -- Diagrams, flow simulators, and interactive elements are first-class content, not decoration.
- **Evergreen plus current** -- Foundational concepts are stable. Staying-current resources and official provider pages should be used to verify model names, pricing, policy timelines, and access terms.
- **Collapsible content** -- Learning roadmaps, deeper-dive sections, and resource groups use collapsible sections to keep pages scannable while allowing depth.

## Content Currency

Version: **v2.3**. Content reviewed on **July 13, 2026**. Foundational explanations are designed to age slowly, but model/provider lineups, pricing, benchmarks, regulatory dates, and resource availability move quickly. Verify live operational decisions against official provider docs, NIST, ISO, the European Commission, and other primary sources before relying on them.

## Adding a New Course

The cross-navigation uses a COURSES array duplicated in each course file:

```javascript
const COURSES = [
  {id:'101', label:'AI Essentials', file:'AI-101.html'},
  {id:'102', label:'AI Deep Dive', file:'AI-102.html'},
  {id:'103', label:'Models Explorer', file:'AI-103.html'},
  {id:'104', label:'Building with AI', file:'AI-104.html'},
  {id:'105', label:'The AI Frontier', file:'AI-105.html'},
  {id:'106', label:'AI Strategy', file:'AI-106.html'}
];
const THIS_COURSE = '101'; // differs per file
```

To add another course:

1. Add the new entry to the COURSES array in all existing course files.
2. Create the new HTML file with the appropriate THIS_COURSE value.
3. Add the course card to `index.html`.
4. Update this README and the live-version list.

## Author

Brought to you by **Babak**

## License

Educational use. All content is original unless cited. External resources link to their respective providers.
