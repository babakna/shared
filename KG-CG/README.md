# Knowledge &amp; Context Graphs

V1.1 (August 2026)

A self-paced introduction to knowledge graphs and context graphs, plus an interactive fault-isolation demo that puts the concepts on one screen. Static HTML with no build step, no server, and no external dependencies &mdash; open `index.html` in any modern browser.

## Contents

| File | What it is |
|------|------------|
| `index.html` | Section landing page with the module cards |
| `KG-CG-101.html` | The course &mdash; nine modules, eight interactive panels, 102 glossary terms |
| `KG-CG-Demo.html` | Charging assurance walkthrough &mdash; ten scenarios, seven stages each |
| `hero.png` | Landing-page hero image |

## The course

`KG-CG-101.html` builds one argument in nine parts.

1. **Why Graphs at All** &mdash; when relationships are the data, and the three signals that justify a graph. Interactive join-depth comparison.
2. **Anatomy of a Graph** &mdash; nodes, edges, direction, properties. Click-to-build sandbox showing the same facts as a property graph and as RDF triples.
3. **What Makes It Knowledge** &mdash; schema, identity resolution, constraints, provenance. Schema on/off comparison and a provenance inspector.
4. **Context Graphs** &mdash; observations, confidence, expiry. An incident timeline you can scrub forward and back.
5. **How the Two Bind** &mdash; anchoring, inheritance, blame propagation. Overlay toggle above a fixed topology.
6. **Reasoning Over the Pair** &mdash; scoring, separation, and the action gate. Threshold sliders that turn a recommendation into a refusal.
7. **Building One for Real** &mdash; where nodes and edges come from, freshness, and four ways graphs quietly go bad.
8. **Where Language Models Fit** &mdash; the same question answered with the graph in hand and with it withheld.
9. **Glossary** &mdash; 102 terms across six categories, searchable and filterable.

Each module except the glossary ends with five questions. Four correct marks a module complete. Progress and theme choice are kept in `localStorage` in the visitor's own browser; nothing is sent anywhere.

## The demo

`KG-CG-Demo.html` runs ten charging-assurance scenarios against a generic operator model. Each steps through seven stages while the candidate pool narrows from the full topology to a located fault, showing evidence, confidence scores, and the action gate at every stage.

Five of the ten scenarios deliberately end **without** an automated action &mdash; tied candidates, thin evidence, a blocked action, or a cause outside the modelled domain. That is the behaviour module 6 argues for, not a gap in the demo.

The demo is dense and built for a laptop or larger. It does not collapse to a phone layout the way the course does.

## Source and scope

Concepts are deliberately durable: graph structure, schema and ontology, identity, provenance, context modelling, and hypothesis ranking. Standards are named as pointers for further reading &mdash; W3C RDF, PROV and SHACL on the semantic side, 3GPP system architecture and charging series for the telecom examples. Confirm any specification reference against the current published document before relying on it.

The telecom material describes a **generic, vendor-neutral operator**. Element names, market codes, and identifiers are illustrative and do not describe any real network.

## Maintenance note

`KG-CG-Demo.html` is a copy of the standalone build from the `kg-cg-telecom-demo` repository, which is where that demo is developed. When the demo changes there, this copy must be refreshed or the two will drift apart.
