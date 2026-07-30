# eSIM tool regression tests

## Why this exists

A July 2026 audit of `GSMA-eSIM-Flow-01.html` found that most of its factual lookup tables
were wrong while every page still looked polished and internally consistent:

- the **entire** SGP.22 `reasonCode` table had incorrect meanings (all 14 real codes), plus
  13 invented codes that do not exist in the spec
- `subjectCode` had 8.2 (Profile) and 8.8 (SM-DP+) reversed
- the EID field layout was mis-partitioned (3-digit platform + 19-digit serial instead of
  the spec's 5-digit platform + 12-digit individual id)
- every Profile Policy Rule bit position was off by one
- SGP.32 interface names (`ESeim.*`) and `ES10a.GetEUICCInfo1` did not exist at all
- EID-to-device "Google SM-DS pattern" matching was fabricated outright

The lesson: **reading the code proves nothing about whether the data is true.** A wrong
value renders exactly as confidently as a right one. These tests pin the spec-verified
values so regressions are caught mechanically.

## Running

```bash
npm install jsdom
node tests/verify-esim-tables.js
```

Optionally pass an explicit path to the HTML file:

```bash
node tests/verify-esim-tables.js /path/to/GSMA-eSIM-Flow-01.html
```

Exits non-zero on any failure. `jsdom` is resolved from either this directory or the
directory you run from.

## What it covers

The harness loads the real page in jsdom and drives the actual DOM widgets — it does not
reimplement any tool logic. It asserts on rendered output for:

- **SGP.22 error decoder** — three-level subject codes, parent-prefix fallback, codes
  outside the spec, spec-tabulated subject+reason pair descriptions, input validation, XSS
- **EID decoder** — SGP.02 §2.2.2 field widths, MOD 97-10 check digits, ITU IIN issuer
  attribution, the separate SGP.29 (non-`89`) scheme
- **ICCID decoder** — Luhn-passing, Luhn-failing (legitimate per SGP.22), `F` padding
- **IMSI decoder** — 2- vs 3-digit MNC resolution driven by MCC
- **APDU status words** — corrected and command-dependent codes, chaining warnings
- **Data-table invariants** — every spec code present, every fabricated code absent, PPR bit
  positions, interface naming, CI PKID production/test split, version string

## Maintaining

Every assertion encodes a value traceable to a primary source: GSMA SGP.22 v2.6/v3.1,
SGP.02 v4.0, SGP.29, SGP.32 v1.1, ITU-T E.118, ETSI TS 102 221, GlobalPlatform 2.2.1.

**If an assertion fails, check the spec before "fixing" the test.** The test is usually
right; it exists because the content was wrong once already.

The suite was mutation-tested across three rounds (reintroducing each original bug) to
confirm it actually detects regressions rather than passing vacuously. If you add coverage,
verify it the same way: break the thing on purpose and confirm the suite goes red.

See the `eSIM Data-Table Verification` section of `_local_update/TUTORIAL_UPDATE.md` for the
known-correct baselines and the carry-forward watch items that still need re-verification.
