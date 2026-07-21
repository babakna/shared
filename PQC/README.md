# Post-Quantum Cryptography Learning Lab

V6.0 (July 2026)

A free, self-paced, static HTML course that takes a learner from **zero cryptography background** to planning a real post-quantum migration. No build step, no server required &mdash; open `index.html` in any modern browser.

## What changed in V6.0

- Added a persistent 13-module journey bar, direct module selector, previous/next links, end-of-module continuation controls, and landing-page completion tracking.
- Rebuilt steppers for keyboard operation, explicit disabled/completed states, and a visible Restart action after the final step.
- Replaced unreliable inline Top handlers, added modal focus management and keyboard term popovers, improved contrast, and removed narrow-screen page overflow.
- Corrected TLS 1.3 sequencing and ML-KEM wire roles; distinguished KEM output from KDF-derived traffic/wrapping keys; corrected SLH-DSA state and certificate-pinning explanations.
- Separated harvest-now confidentiality exposure from Mosca schedule urgency, replaced blanket symmetric-key rules with parameter/policy guidance, and scoped dynamic deployment claims with dates and primary sources.
- Rebuilt the CBOM workshop with complete fields, a visible four-factor 1&ndash;3 rubric, calculated 4&ndash;12 scores, Tier 1/2/3 priorities, sorting, and complete CSV/JSON exports.
- Corrected U.S. agency versus contractor mandate scope, consumer eSIM/RSP actor flow, eUICC packaging/capacity claims, and 3GPP quantum-safe study status.
- Updated protocol and governance sources, including RFC 9846, active IETF hybrid TLS work, NIST SP 800-227, GSMA architecture, 3GPP Release 20 study work, Signal SPQR, and dated deployment measurements.

## What changed in V5.1

- Refreshed U.S. federal PQC migration mandate coverage for EO 14412 and OMB M-26-15.
- Added NIST CSWP 39upd1 crypto-agility guidance to governance and source alignment.
- Upversioned the curriculum after the July 2026 tutorial audit.
- **Steppers are now visual pipelines, not text pages.** Every "click Next" walkthrough now renders an SVG pipeline with an icon per stage; the current stage highlights and the connectors fill in as you advance, so you *see* where you are instead of just reading paragraphs.
- **Deeper step content.** Each step was rewritten with concrete detail, real examples, and inline code/labels (e.g. `X25519+ML-KEM-768`), and several walkthroughs gained extra steps.
- **More media throughout.** Icon-driven pipelines add colour and visual structure to the previously text-heavy explore sections.

## What changed in V3.1

- Home page module list is now a vertical, single-column layout matching the other apps in the collection.
- Each module opens in a new browser tab.

## What changed in V3.0

Rebuilt from high-level, text-only pages into an engaging, detail-rich course:

- **Interactive widgets:** step-through walkthroughs (TLS handshake, KEM flow, eSIM provisioning, migration waves), a harvest-now-decrypt-later risk calculator, size/performance comparison charts, and an editable CBOM builder with CSV/JSON export.
- **Real detail:** actual key/ciphertext/signature sizes, sample code and commands, comparison tables, and "Go deeper" expandable panels.
- **Beginner-first:** plain-language explanations and analogies before any jargon; a new quantum-computing primer and an inline glossary.
- **Stronger assessment:** quizzes with per-answer explanations, a passing threshold, and cross-module progress tracking saved in the browser.
- **Shared design system:** `assets/pqc.css` + `assets/pqc.js` (light default, dark mode, Help with version), replacing duplicated inline code in every file.

## Structure

- `index.html` &mdash; learning path, progress tracking, and module cards.
- `glossary.html` &mdash; searchable plain-English definitions.
- `assets/` &mdash; shared stylesheet and JavaScript engine.
- `diagrams/` &mdash; hero/illustration SVGs.

## Modules

Stage 1 &mdash; Foundations (no background needed)
- `PQC-001.html`: Security & Cryptography Basics
- `PQC-100.html`: Quantum Computing in Plain English
- `PQC-101.html`: Why Quantum Computing Changes the Threat Model
- `PQC-102.html`: Cryptographic Building Blocks Deep Dive

Stage 2 &mdash; Standards & Protocols
- `PQC-201.html`: PQC Standards and Algorithm Families
- `PQC-202.html`: Protocols in Practice (TLS, SSH, VPN, PKI, email, code signing)

Stage 3 &mdash; Build & Migrate
- `PQC-301.html`: Developer Implementation Engineering
- `PQC-302.html`: Use-Case Labs
- `PQC-401.html`: Enterprise Migration Playbook
- `PQC-402.html`: Crypto Inventory and CBOM Workshop

Stage 4 &mdash; Ecosystems & Advanced
- `PQC-501.html`: Network, 5G/6G, SIM/eSIM, IoT, and Device Ecosystems
- `PQC-601.html`: Research Watch, Governance, and Architecture Review

Stage 5 &mdash; Capstone
- `PQC-701.html`: Capstone: Migrate "Northwind Telecom"

## Source alignment

Content is aligned to NIST PQC standards and guidance including FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), the HQC selection, NCCoE migration guidance, NIST CSWP 39upd1 crypto-agility guidance, White House EO 14412, OMB M-26-15, and NSA CNSA 2.0. Algorithm sizes are representative values from the FIPS parameter sets. This is educational reference material, not production cryptographic approval; verify against current primary sources and your security team before any deployment.
