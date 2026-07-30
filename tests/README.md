# Tutorial regression tests (AI, PQC, 5G-6G)

## Why this exists

An August 2026 audit of the sibling **eSIM** tutorial found an entirely fabricated SGP.22
`reasonCode` table — every one of its 14 real codes had the wrong meaning, plus 13 invented
codes that do not exist in the spec. It had survived several prior reviews because those
reviews read code and checked *self-consistency* instead of verifying values against primary
sources. A wrong value renders exactly as confidently as a right one.

These tests pin spec-verified values for the other three tutorial directories so that class
of error is caught mechanically.

## Running

```bash
npm install jsdom
node tests/verify-tutorials.js
```

Optionally pass a repo root: `node tests/verify-tutorials.js /path/to/Shared`.
Exits non-zero on any failure. `jsdom` resolves from either this directory or your cwd.

## Two traps this harness hit — preserved as warnings

**1. These pages are single-page apps.** The landing view holds only a few thousand
characters; the real content lives in JS data structures and renders per-module. The first
version of this suite asserted against the landing view and reported **266 passing
assertions while catching 1 of 8 deliberately injected bugs**. The suite must *drive the
renderer*, not just load the page.

**2. Chart data never enters the DOM.** Numbers inside
`<script type="application/json">` blocks render into SVG/canvas, so page text cannot see a
wrong chart value. Those blocks are parsed explicitly and each `display` string is
cross-checked against its numeric `value`. Version strings and prose inside JS string
literals are likewise checked against the raw source.

Corollary: assert **positively** (the correct value is present), not negatively (a
guessed-wrong value is absent). Negative checks pass as long as one correct instance
survives elsewhere on the page.

## What it covers

- **Version/date currency** — no `V7.0`, no stale July-2026 release stamps, in rendered text
  *and* raw source (including `VERSION='8.0'` constants and the shared `pqc.js` asset).
- **PQC exact sizes** — every stated byte size must be a published FIPS value; ML-KEM-768,
  ML-DSA-65 and SLH-DSA figures checked per occurrence, including chart datasets.
- **PQC standard mapping** — FIPS 203→ML-KEM, 204→ML-DSA, 205→SLH-DSA; FIPS 206/FN-DSA never
  asserted final; NIST IR 8547 always marked draft; SLH-DSA names carry SHA2/SHAKE.
- **Size multipliers must name their baseline** (ECDSA P-256 is 64 B raw, ~70–72 B DER).
- **3GPP document types** — `TR 38.843` (not TS), `TS 23.288` (not TR), TR 37.817 not Rel-18,
  TS 24.501 upper-case `SECURITY MODE COMMAND/COMPLETE`.
- **6G maturity** — Rel-20 studies 6G, Rel-21 specifies it; no published-6G-spec claims;
  AI-RAN never presented as commercially deployed.
- **AI currency** — retired models not presented as current; EU AI Act penalty figures tied
  to the right percentages; GRPO not credited to DeepSeek-R1.
- **Render hygiene** — no `undefined`, `NaN`, `[object Object]` or unrendered `${` in any view.

## Maintaining

Every assertion traces to a primary source: FIPS 203/204/205 parameter tables, 3GPP portal
spec pages, TS 24.501, ITU-R M.2410, EUR-Lex, the Federal Register.

**If an assertion fails, check the spec before "fixing" the test.** The test is usually
right; it exists because content was wrong once already.

Verified by mutation testing: each original bug was reintroduced to confirm the suite goes
red. It went from catching **1/8** to **15/15**. If you add coverage, verify it the same way
— break the thing on purpose and confirm the suite fails.

See the per-directory `Data Verification` sections of
`_local_update/TUTORIAL_UPDATE.md` for the known-correct baselines and carry-forward watch
items that still need re-verification.
