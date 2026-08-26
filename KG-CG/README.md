# Knowledge &amp; Context Graphs

V3.0 (September 2026)

A self-paced introduction to knowledge graphs and context graphs, plus an interactive fault-isolation demo that puts the concepts on one screen. Static HTML with no build step, no server, and no external dependencies &mdash; open `index.html` in any modern browser.

## Contents

| File | What it is |
|------|------------|
| `index.html` | Section landing page with the module cards |
| `KG-CG-101.html` | The course &mdash; eight teaching modules plus a glossary and a reference list, eight interactive panels, 17 diagrams, 43 formal definitions, 132 glossary terms, 23 cited sources |
| `KG-CG-Demo.html` | Charging assurance walkthrough &mdash; ten scenarios, seven stages each |
| `hero.png` | Landing-page hero image |

## The course

`KG-CG-101.html` builds one argument in eight parts, then adds a glossary and a cited reference list.

1. **Why Graphs at All** &mdash; when relationships are the data, and the three signals that justify a graph. Graph, node, edge and traversal defined formally; the same five-hop question drawn as joins and as a traversal; SQL and Cypher written out side by side; a relational/property-graph/RDF comparison; the traversal cost model and why supernodes break it. Interactive join-depth comparison.
2. **Anatomy of a Graph** &mdash; nodes, edges, direction, properties. Label, property, directed edge, triple, IRI and reification defined; one annotated node and edge; multigraphs and why a relationship that changed needs two edges; one qualified fact written in Cypher, Turtle with reification, TriG named graphs and RDF 1.2 triple terms. Click-to-build sandbox.
3. **What Makes It Knowledge** &mdash; schema, identity resolution, constraints, provenance. Three levels of schema commitment; SHACL against OWL 2 and why an OWL cardinality does not reject anything; the same rule as a database constraint, a SHACL shape and an OWL axiom; the identity-resolution pipeline and its asymmetric failure modes; provenance in PROV-O. Schema on/off comparison and a provenance inspector.
4. **Context Graphs** &mdash; observations, confidence, expiry. Anchors, half-life and TTL defined; anchored against copied, side by side; the decay formula with its curves plotted from the formula; half-lives per evidence class; the five-state lifecycle including refusal; a complete context graph in JSON, mid-investigation. An incident timeline you can scrub.
5. **How the Two Bind** &mdash; anchoring, inheritance, blame propagation. What one anchor makes available for free; the propagation algorithm written out with attenuation and degree normalisation; a confluence score computed step by step; propagation compared with rules engines and statistical correlation. Overlay toggle above a fixed topology.
6. **Reasoning Over the Pair** &mdash; scoring, separation, and the action gate. Abduction and why the output is a ranking, not a probability; the scoring function with its weights and its temporal veto; why 0.82 over 0.79 is worse than 0.71 over 0.31; the coverage-versus-specificity trap; five distinct reasons to refuse and what each must say; a refusal written out in full. Threshold sliders that turn a recommendation into a refusal.
7. **Building One for Real** &mdash; where nodes and edges come from, freshness, and four ways graphs quietly go bad. The six ingestion stages and which failure each one introduces, with the cheapest detector for each; edge sources ranked by trust with confidence bands; one edge ingested properly, and the MERGE trap; one traversal crossing four feeds of different ages; a first scope named concretely.
8. **Where Language Models Fit** &mdash; the same question answered with the graph in hand and with it withheld. Grounding, RAG, GraphRAG and hallucination defined; vector retrieval against graph retrieval on the same question; four boundaries that have to be enforced and the failure each prevents; a grounded narration prompt in full, including how to check its output mechanically.
9. **Glossary** &mdash; 132 terms across six categories, searchable and filterable.
10. **References** &mdash; 23 primary sources grouped by topic, each with a verification badge and a note on what it settles.

Each module closes with an **onward-reading** block naming specific clauses or sections rather than whole documents, each with the reason to open it. Each of the eight teaching modules then ends with five questions; the glossary and the reference list are not graded. Four correct marks a module complete, and the completion bar is measured against those eight. Progress and theme choice are kept in `localStorage` in the visitor's own browser; nothing is sent anywhere.

## The demo

`KG-CG-Demo.html` runs ten charging-assurance scenarios against a generic operator model. Each steps through seven stages while the candidate pool narrows from the full topology toward a located fault &mdash; or stops short of naming one &mdash; showing evidence, confidence scores, and the action gate at every stage.

Five of the ten scenarios deliberately end **without** an automated action &mdash; evidence too thin to separate the candidates, a missing discriminating control, a topology edge too stale to act on, an action permanently barred from automation, and an evidence set that cannot be joined at all. That is the behaviour module 6 argues for, not a gap in the demo.

The demo is dense and built for a laptop or larger. It does not collapse to a phone layout the way the course does.

## Source and scope

Concepts are deliberately durable: graph structure, schema and ontology, identity, provenance, context modelling, and hypothesis ranking. Standards are named as pointers for further reading &mdash; W3C RDF, PROV and SHACL on the semantic side, 3GPP system architecture and charging series for the telecom examples. Confirm any specification reference against the current published document before relying on it.

The telecom material describes a **generic, vendor-neutral operator**. Element names, market codes, and identifiers are illustrative and do not describe any real network.

## Changelog

All three files share one version number, so a single label tells you whether anything in the section changed.

### V3.0 (September 2026)

A content pass across all eight modules, prompted by a fair complaint: the modules were
too thin for the audience they are written for. Someone who wants a paragraph can use a
search engine; this is meant to be enough to work from. The written material roughly
doubled, to about 17,900 words across the eight modules, and the additions are
structural rather than more prose.

- **43 formal definitions**, one block near the top of each module. Every term is given
  three ways &mdash; the formal statement, the plain-language reading, and the instance
  used in the running telecom example &mdash; so a reader can take whichever they need.
  Several also carry an *honest* or *caveat* line: `context graph` says outright that it
  is not a standardised term, `confidence` says the scale is ordinal rather than
  probabilistic, and `GraphRAG` says it is an umbrella for several distinct techniques.
- **17 numbered diagrams**, up from none. Each is drawn to carry an argument the prose
  cannot, and each caption states that argument rather than describing what is already
  visible. Two are drawn from their own formulas rather than sketched: the decay curves
  in module 4 are plotted from 2^(&minus;&Delta;t/t&#189;) at the stated half-lives, and
  the confluence score in module 5 is the arithmetic worked out on the page.
- **12 comparison tables**, including relational against property graph against RDF,
  SHACL against OWL 2, half-lives per evidence class, propagation against rules engines
  and statistical correlation, the five reasons to refuse, edge sources ranked by trust,
  and the four boundaries around a language model.
- **16 worked fragments** in Cypher, SQL, Turtle, TriG, SHACL, OWL, PROV-O and JSON &mdash;
  including one qualified fact written four ways, the same constraint written three ways,
  a complete context graph mid-investigation, a full refusal, and a grounded prompt.
- **Onward reading per module.** Eight blocks pointing at specific clauses or sections
  &mdash; SPARQL 1.1 &sect;9, OWL 2 Primer, SHACL &sect;2&ndash;4, PROV-O &sect;2, RFC 8345
  &sect;4, the 3GPP NRM classes, ETSI ZSM's closed-loop clauses &mdash; each with the
  reason to open it and roughly what it costs to read.

Things that were previously asserted and are now made precise: the traversal cost model
and its dependence on **degree** rather than dataset size, with index-free adjacency
correctly described as an implementation choice rather than a property of the model; why
an `owl:cardinality` of one **does not reject** a second value under open-world semantics
but instead concludes the two values are the same thing; the decay model's separation of
a **base** from source trust and a **freshness factor** from age, and the difference
between decay and a hard TTL; propagation's **attenuation** and **degree normalisation**,
and what goes wrong when either is omitted; the scoring function's weights and its
**temporal veto**, which is a veto rather than a penalty because an effect preceding its
cause is impossible rather than unlikely; and the difference between *"I do not know what
is wrong"* and *"I know and am not allowed to fix it"*, which are separate refusals with
separate next actions.

Glossary: **132 terms, up from 111.** Twenty-one additions, all of them terms the expanded
modules now use: abduction, entailment, the closed- and open-world assumptions,
descriptive and prescriptive schema, multigraph, named graph, triple term, half-life,
TTL, confluence, attenuation, degree normalisation, dependency direction, upsert,
ingestion pipeline, blocking, grounding and hallucination.

Also: per-module time estimates were recomputed from actual length, so the course now
reads as roughly 3 hours 35 minutes rather than the 2 hours 25 minutes it claimed.

Rendering defects found and fixed while drawing the figures, all of them caught by
screenshotting each diagram rather than by reading its markup:

- An HTML `<b>` element inside an SVG `<text>`, which broke out of the drawing and dumped
  a line of markup into the page.
- Three text overflows past a diagram's own edge, in modules 4 and 5.
- Four places where a line crossed a label instead of pointing at it &mdash; the leader
  lines in Figure 2.1, the anchor label in Figure 4.1, the separation arrow in Figure 6.1,
  the candidate labels and arc in Figure 6.2, and the axis gridlines in Figure 7.2, which
  were painting over the pills they were meant to sit behind.
- **Figures were illegible on a phone.** An SVG scaled to a 358px column rendered its
  7.5-unit labels at about 4.3 CSS pixels. Each figure now sits in its own labelled,
  keyboard-focusable scroll region and holds a 720px minimum width below 820px, so a
  narrow screen scrolls the diagram sideways instead of shrinking it past reading.
  Printing restores the full width. Verified at 390, 520, 768, 1024 and 1440 pixels:
  no figure overflows the page at any of them, and no figure label falls below 6.5px.
  Making the diagrams focusable introduced a second bug in the same pass &mdash; the
  global left/right arrow handler was moving between modules while a diagram had focus,
  so the arrows could not scroll it. The handler now yields to a focused diagram, and
  both behaviours are asserted.

**The demo is unchanged in V3.0**; its version moved only to keep the section's three
files in step.

### V2.3 (August 2026)

A reference-verification pass, prompted by a fair complaint: ten of the twenty-three
citations carried a *confirm* badge, meaning their title and date had never been read
from the publisher.

- **Nine of those ten are now verified.** The seven 3GPP entries linked to the bare
  `portal.3gpp.org` home page because that host exposes specifications only by numeric
  id and offers no way to search for one. The id map already existed in this repo's
  5G-6G section; it seeded a lookup that resolved the rest against the portal, so
  TS 23.501, 28.541, 28.552, 28.554, 32.255, 32.290 and 32.291 now deep-link to their
  own specification pages with the publisher's own titles.
- **ETSI ZSM** pointed at a technology overview page that redirects to a generic
  landing page. It now opens **ETSI GS ZSM 002, Reference Architecture, V1.1.1
  (2019-08)** &mdash; the specification itself, with the title and version read off its
  cover page.
- **TM Forum** pointed at the site root and now points at the Open Digital
  Architecture page. This is the one entry still linking a page rather than a document:
  every TM Forum specification URL returns a bot challenge, which the entry now says
  outright.
- **ISO/IEC 39075 (GQL) remains the single unverified entry.** `iso.org` returns 403 to
  the network this was checked on. The link is correct and resolves normally elsewhere;
  only the title-and-date confirmation is missing, and the badge says so.
- The badge legend no longer claims that unreachable publishers are linked by portal
  &mdash; every entry now points at a document &mdash; and it reads correctly in the
  singular.
- **Demo:** three entities named in the panels but never drawn (a UPF and an alternate
  SMF in the capacity scenario, the slice in the entitlement-drift scenario) now appear
  at the stage where they are first named.

### V2.2 (August 2026)

A second accuracy pass. V2.1 reviewed the wording; this one reviewed the reasoning, the telecom model and the interactions. Two independent read-only reviews were run against the files and every finding was triaged against the current state before anything was changed.

**Course &mdash; telecom model**

- **The 5G charging path was wrong in four places.** Usage reaches the CHF via the SMF over Nchf; the CHF never meters a UPF and has no interface to one. The module 7 source table, the module 3 provenance fact and the module 1 join chain all routed it directly. The module 4 timeline anchored a rise in Nchf failures to a UPF, which has no Nchf reference point at all &mdash; it now anchors to an SMF, which is the interface's consumer.
- **Module 5 was redrawn.** The prose, the glossary and the module itself all describe transport as sitting *beneath* the network functions with impact travelling up; the widget drew the link on top and then said symptoms trace "upward" to it. The link is now at the bottom, an SMF was added so the Nchf symptom has somewhere legitimate to sit, and the completeness symptom moved from a cell to the charging function &mdash; charging completeness is not a property of a radio cell, which is what the module 5 prose already said.
- **Sandbox relationship types.** `ANCHORED_AT` collides with the 3GPP PDU Session Anchor, which is a UPF role rather than a cell one; cells are not served by UPFs; and the CHF does not bill anyone. Replaced with `USES_CELL` and `CHARGED_BY`, and the cell-to-UPF edge was dropped.
- **The charging function no longer "meters".** Metering happens in the charging trigger function inside the SMF, on usage the UPF reports; the CHF authorises quota and accounts for it.

**Course &mdash; claims and counts**

- **Glossary: 111 terms, up from 105.** Added Gremlin, OWL, SHACL, PROV-O, RAG and GraphRAG &mdash; all six were named in the modules with no entry to look up. Expanded RDF, SPARQL and GQL, which were defined by acronym in a glossary whose stated purpose is plain language. Corrected Node (a node may carry several labels), Triple (RDF 1.1 datasets and quads), Degree and Ingestion, the last of which claimed to be the largest part of the build effort while module 7 and its own quiz both award that to edge derivation.
- **Overclaims removed.** GQL is a query-language standard and does not define the property-graph model; SHACL is an alternative to misusing OWL as a constraint language, not to inference; TS 28.554 defines KPIs, not SLAs; charging is a domain spanning both planes, not a third plane. The glossary lede no longer claims to hold every term the course uses.
- **Two quiz distractors were arguably true** &mdash; "be queried without an index" is what the glossary's own index-free adjacency entry describes, and doubling edge storage really is a consequence of bidirectional edges. One was replaced, the other's stem now asks for the *most damaging* consequence.
- **Reference honesty.** Seven entries link to a publisher portal rather than a document, which the intro now says. "The publisher refuses this network" became the accurate "was not reachable from this network".

**Demo &mdash; reasoning**

- **Scenario 1 approved a failover along a route it also called unconfigured.** The missing control is observational &mdash; no live traffic runs that pairing &mdash; which is not the same as the path being unavailable. It also held a trigger-side candidate open at 61 on "the same observable signature": charging events that are never generated show a *fall* in request volume and no errors, which is the opposite of this scenario's 200&times; failures and 4.7 s queue. Now dismissed on its fingerprint at 34.
- **Scenario 3 said both things at once** &mdash; that a route-side cause would show errors and there are none, and that route-side and trigger-side cannot be separated. The request count is measured at the sender, so the shortfall is in requests never sent. The candidate is now inferred rather than demonstrated, and the queued test confirms it rather than separating two live possibilities.
- **Four scenarios reported zero at the final stage** while naming concrete open items in the same panel. They now count them. The stage-one failure catalogue is one number across all ten scenarios, because a catalogue does not vary with the incident.
- **Arithmetic and units.** A p95 measured in seconds is a wait, not a depth, so the counter is renamed `queue_wait_seconds_p95`. A 0.9% duplicate rate on a 99.97% baseline reports as 100.9%, not the 100.8% shown. Scenario 1's window was 12 minutes while quoting a 15-minute credit trigger. `S-NSSAI 1 &middot; 0x000A21` is an SST and an SD. A 38-hour-old edge against a one-hour expectation is as anomalous as scenario 9's 6.1 hours, not merely degraded.
- **Model gaps closed.** The second SMF had no session-bearing path, so every cross-SMF control was unsupported by the graph; the data network name was modelled and never used; two scenarios cited change records they never revealed; and scenario 8 offered "sessions on unaffected cells" of an SMF whose every cell was affected.
- **Hard-coded plan names** in eleven places now use the rename token, so renaming the plan no longer leaves stale copies in the evidence prose.
- **Three entities were named in prose but never drawn.** Scenario 1 cited a UPF in its signal table and an alternate SMF in its control comparison, and scenario 6 scoped the incident to a slice; none of the three appeared at any stage, so the reader was asked to weigh evidence about elements that were not on screen. All three are now revealed at the stage where they are first named.

**Demo &mdash; interaction**

- An arrow key on the focused split handle both resized the pane and stepped the run, because the document handler saw the same event.
- The space bar could not activate a focused rail segment or toolbar button: it was suppressed for every non-input target.
- The evidence-withheld toggle survived a scenario change, so the next scenario opened on the ungrounded answer.
- The narrowing rail set seven inline columns, overriding its own responsive auto-fit rule and crushing the segments on a phone.
- The anchor panel showed the incident figures &mdash; and in one scenario a stage-5 candidate score &mdash; while its header still read "not yet fired".
- A candidate shown without a score is no longer also given a rank number.

**Help text corrected**

- "Fit width" and "Fit all" had their tracking behaviour described the wrong way round. The graph has two faded levels, not one. Only some answers carry a confidence figure, so the claim that all of them do was dropped.

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
