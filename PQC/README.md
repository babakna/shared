# Post-Quantum Cryptography Learning Lab

V3.1 (July 2026)

A free, self-paced, static HTML course that takes a learner from **zero cryptography background** to planning a real post-quantum migration. No build step, no server required &mdash; open `index.html` in any modern browser.

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

Content is aligned to NIST PQC standards and guidance including FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), the HQC selection, NCCoE migration guidance, and NSA CNSA 2.0. Algorithm sizes are representative values from the FIPS parameter sets. This is educational reference material, not production cryptographic approval; verify against current primary sources and your security team before any deployment.
