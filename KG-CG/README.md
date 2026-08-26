# Knowledge &amp; Context Graphs

V2.1 (August 2026)

A self-paced introduction to knowledge graphs and context graphs, plus an interactive fault-isolation demo that puts the concepts on one screen. Static HTML with no build step, no server, and no external dependencies &mdash; open `index.html` in any modern browser.

## Contents

| File | What it is |
|------|------------|
| `index.html` | Section landing page with the module cards |
| `KG-CG-101.html` | The course &mdash; eight teaching modules plus a glossary and a reference list, eight interactive panels, 105 glossary terms, 23 cited sources |
| `KG-CG-Demo.html` | Charging assurance walkthrough &mdash; ten scenarios, seven stages each |
| `hero.png` | Landing-page hero image |

## The course

`KG-CG-101.html` builds one argument in eight parts, then adds a glossary and a cited reference list.

1. **Why Graphs at All** &mdash; when relationships are the data, and the three signals that justify a graph. Interactive join-depth comparison.
2. **Anatomy of a Graph** &mdash; nodes, edges, direction, properties. Click-to-build sandbox showing the same facts as a property graph and as RDF triples.
3. **What Makes It Knowledge** &mdash; schema, identity resolution, constraints, provenance. Schema on/off comparison and a provenance inspector.
4. **Context Graphs** &mdash; observations, confidence, expiry. An incident timeline you can scrub forward and back.
5. **How the Two Bind** &mdash; anchoring, inheritance, blame propagation. Overlay toggle above a fixed topology.
6. **Reasoning Over the Pair** &mdash; scoring, separation, and the action gate. Threshold sliders that turn a recommendation into a refusal.
7. **Building One for Real** &mdash; where nodes and edges come from, freshness, and four ways graphs quietly go bad.
8. **Where Language Models Fit** &mdash; the same question answered with the graph in hand and with it withheld.
9. **Glossary** &mdash; 105 terms across six categories, searchable and filterable.
10. **References** &mdash; 23 primary sources grouped by topic, each with a verification badge and a note on what it settles.

Each of the eight teaching modules ends with five questions; the glossary and the reference list are not graded. Four correct marks a module complete, and the completion bar is measured against those eight. Progress and theme choice are kept in `localStorage` in the visitor's own browser; nothing is sent anywhere.

## The demo

`KG-CG-Demo.html` runs ten charging-assurance scenarios against a generic operator model. Each steps through seven stages while the candidate pool narrows from the full topology toward a located fault &mdash; or stops short of naming one &mdash; showing evidence, confidence scores, and the action gate at every stage.

Five of the ten scenarios deliberately end **without** an automated action &mdash; evidence too thin to separate the candidates, a missing discriminating control, a topology edge too stale to act on, an action permanently barred from automation, and an evidence set that cannot be joined at all. That is the behaviour module 6 argues for, not a gap in the demo.

The demo is dense and built for a laptop or larger. It does not collapse to a phone layout the way the course does.

## Source and scope

Concepts are deliberately durable: graph structure, schema and ontology, identity, provenance, context modelling, and hypothesis ranking. Standards are named as pointers for further reading &mdash; W3C RDF, PROV and SHACL on the semantic side, 3GPP system architecture and charging series for the telecom examples. Confirm any specification reference against the current published document before relying on it.

The telecom material describes a **generic, vendor-neutral operator**. Element names, market codes, and identifiers are illustrative and do not describe any real network.

## Changelog

All three files share one version number, so a single label tells you whether anything in the section changed.

### V2.1 (August 2026)

A word-by-word accuracy pass over all four files. Every finding below was found, verified against the source, and fixed.

**Demo**

- **Firmware scenario reported its own evidence wrongly.** The Nchf failure rate sat at twice baseline but was tagged *baseline*, while the scenario title, the context graph and the Q&A all said the Nchf errors follow the session drops. The signal is now tagged *degraded* and shows its 90-second onset lag, and the candidate that dismissed charging capacity on the grounds of "no Nchf errors" now dismisses it on the grounds that actually hold: 2&times; rather than 200&times;, flat queueing, and an onset that trails the drops.
- **A located cause can span several entities.** A firmware regression across three sectors marked only one of them violet. Root now accepts a list, so all three are marked.
- **A candidate that cannot be scored no longer shows a zero.** In the identifier-mismatch scenario, charging-plane record loss carried a score of 0 with the note "cannot be assessed" &mdash; a zero is an elimination claim the broken join cannot support. It is now marked *unscorable* and shown with a dash.
- **Measurement window and change lookback are named separately** wherever both appear, and both are defined in Help.

**Course**

- **Telecom corrections.** The charging function meters the session, not the transport link &mdash; corrected in module 1 prose and in the join-depth widget's SQL, which had the charging function hanging off `transport_link` and the account off the charging function.
- **The sandbox was missing the SMF**, the one element every charging scenario turns on. Added, along with the Nchf relationship, and node abbreviations now read CHF and SMF rather than CHA.
- **The RDF view did not do what the comparison table promised.** The table says RDF expresses attributes as further triples; the panel emitted only type and relationship triples. It now emits `net:id` and `net:confirmedAt`, declares the `xsd` prefix it uses, and its closing note names named graphs and RDF 1.2 triple terms alongside reification.
- **The theme toggle re-ran each widget's initialiser**, binding a second set of listeners to the same buttons. In the sandbox that meant one click adding two nodes from two competing states. Widgets now return a repaint function and the toggle calls that.
- **The decay timeline contradicted its own caption.** The final step read "Expired" while the panel still showed confidence between 0.54 and 0.74, with the newest observation at its peak. Decay now lands the two original observations at 0.12 and 0.08 while the third holds at 0.34, and the caption makes the per-element point that difference demonstrates.
- **The action gate could be set to require zero separation**, which would have permitted action on a 0.03 gap the module calls undecidable. Minimum separation is now 0.05, and a permissive gate that passes on weak evidence says so.
- **Clocks reconciled.** The stalled-investigation example, its quiz question and the widget's own timeline disagreed; all three now read 14:47.
- **Glossary: 105 terms, up from 102.** Added Nchf, UPF and CDR. Corrected Label (a node may carry several), Triple (literals as well as resources), IRI (defined properly, and not RDF-exclusive), Reification (named graphs and RDF 1.2 as successors), Charging function (named as the CHF reached over Nchf), and made Staleness and Freshness cross-reference rather than near-duplicate.
- **References reorganised.** GQL moved from Graph data models to Query languages, where it belongs; the two groups that had no note now have one; the Diameter charging entry no longer overstates deployment.
- **Superlatives that could not be supported** were softened throughout: identity resolution as "a leading reason" rather than "the most common", supernodes as "often" rather than "both the most", reconciliation as the only thing looking for drift rather than "the only reliable defence".
- **Two quiz answers contradicted the revised prose** &mdash; the translation-risk question and the model-behaviour question &mdash; and were rewritten with the nuance the modules now carry.
- **Section labels.** The glossary and references were headed "Module 09 of 10" and "Module 10 of 10"; they are reference sections and are now labelled as such, with the eight teaching modules numbered out of eight.
- **Help corrected**: quizzes and interactive panels belong to the eight teaching modules, one attempt per question, and the failing score now names the threshold instead of saying "four correct marks this module complete".

**Landing page and README**

- Counts reconciled: eight teaching modules plus a glossary and a reference list, 105 glossary terms, 23 cited sources.

### V2.0 (August 2026)

- **Course — new module 10, References.** 23 primary sources grouped by what they settle, each with a note on why it is worth opening. Every entry carries a verification badge: 13 were fetched from the publisher and had their title and date confirmed, 10 are marked *confirm* because the publisher blocks this network.
- **Course — inline citations.** Six modules now end with a Further Reading pointer naming the specific standards behind their claims (RDF, SHACL, PROV-O, OWL 2, RFC 8345, 3GPP charging and management series, RAG and GraphRAG papers) and linking into module 10.
- **Course — progress bug fixed.** The completion bar counted all modules but only quiz-bearing ones can be completed, so it could never reach 100%. It now counts the eight gradable modules.

### V1.2 (August 2026)

- **Demo — Ask the case file is live.** Three pre-written questions per scenario, answered from the case file with a source and confidence line, plus an evidence-withheld toggle that answers the same question from the incident text alone.
- **Demo — questions unlock by stage.** Answers are no longer readable at stage 0. The first two unlock at stage 5 with the ranked candidates, the third at stage 6 with the action gate, matching the stages the panels themselves appear at.
- **Demo — back-to-top button**, bottom-right, appears once you scroll.
- **All three files — visual pass.** Buttons and dropdowns moved onto a tinted surface with real borders, hover states and shadows; the scenario picker reads as a picker rather than an error state; card headers gained a tinted strip; un-reached stages in the narrowing rail now say "not yet revealed" instead of sitting empty.

### V1.1 (August 2026)

- Initial release of the section: landing page, the course with eight teaching modules, eight interactive panels and a glossary, and the ten-scenario demo copied in as a static artifact.

## Maintenance note

`KG-CG-Demo.html` began as a copy of the standalone build from the `kg-cg-telecom-demo` repository. **The two have since diverged:** everything listed under V2.0 and V2.1 above was made to this copy only, and the source repository is still at its own V1.0. Refreshing this copy from that repository would undo those changes &mdash; the demo needs to be brought forward there first.
