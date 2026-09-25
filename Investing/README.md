# Investing Learning Lab

V1.0 (September 2026)

A comprehensive, self-paced investing curriculum for every stage of life: new investors,
people with some experience, families, pre-retirees, retirees, and anyone planning what they
will leave behind. Static HTML with no build step, no server and no tracking. Open
`index.html` in any modern browser.

## Scope

15 stages and **105 modules, all live**, plus a capstone that builds complete plans for the
five households.

| Stage | Topic | Modules |
|---|---|---|
| 1 | Foundations | INV-001 to INV-007 |
| 2 | Asset classes and vehicles | INV-008 to INV-017 |
| 3 | Your financial base | INV-018 to INV-023 |
| 4 | Planning and you | INV-024 to INV-028 |
| 5 | Taxes (2026 figures) | INV-029 to INV-042 |
| 6 | Approaches and philosophies | INV-043 to INV-054 |
| 7 | Portfolio construction and monitoring | INV-055 to INV-059 |
| 8 | Behavioral finance | INV-060 to INV-062 |
| 9 | Real estate | INV-063 to INV-071 |
| 10 | Financial independence | INV-072 to INV-074 |
| 11 | Retirement, Social Security and Medicare | INV-075 to INV-083 |
| 12 | Estate planning and wealth transfer | INV-084 to INV-094 |
| 13 | Life events | INV-095 to INV-102 |
| 14 | Getting help | INV-103 to INV-104 |
| 15 | Capstone: five households, five plans | INV-105 |

Every module is split into 12&ndash;14 tabs (one panel on screen at a time, arrow-key
navigation, deep links as `#s3`) with the same anatomy: Start here, concept tabs with
three-part definitions and three depth layers (Start here / Going further / Practitioner
depth), live calculators, case studies from real history or law, "What would you do?"
decisions with every option's trade-offs, myth-or-fact cards, a household lens and
worksheet, exercises with worked solutions, an eight-question knowledge check (70% marks the
module complete) and curated resources plus cited primary sources. Every tab has a figure.

**Tax and benefit figures** are for 2026, taken from IRS, SSA and CMS primary sources
(including Rev. Proc. 2025-32, Notice 2025-67, and pages reflecting Public Law 119-21).
Where a 2026 figure could not be confirmed, the rule is described without the number.

## The five households

Fictional households recur in every module so each idea is shown at a different life stage:
Maya Brooks (24, first job), Marcus and Elena Rivera (35 and 34, two children), Jordan
Ellis (45, single parent), Tom and Rachel Harper (57 and 55, pre-retirement) and Ruth
Kowalski (68, widowed retiree). Their data lives in `assets/inv.js` (`HOUSEHOLDS`).

## Shared pages and assets

| File | What it is |
|---|---|
| `index.html` | Landing page: start-here paths by audience, one tab per stage, progress |
| `glossary.html` | 1,014 terms across the whole curriculum; each has what it is, what it is used for, and what it means for you; search, topic and level filters |
| `resources.html` | 374 curated resources: YouTube channels and podcasts, official sources, free tools, data, books, research, and Babak's tools; filter by kind, level and stage |
| `tools.html` | Stage 1's 13 calculators embedded, a directory of the other 160 by stage, Babak's planning tools and official calculators |
| `assets/inv.css` | Design system (light by default, dark mode) |
| `assets/inv.js` | Engine: course registry, tabs, journey bar, help, quiz, decisions, myths, exercises, worksheets, glossary popovers, resources, SVG charts |
| `assets/inv-tools.js` | Stage 1's 13 calculators |
| `assets/inv-tools-s*.js` | Calculators for Stages 2&ndash;14 (160), one file per build group, each loaded only by its modules; several expose shared engines such as `INV.s5aEngine` (2026 federal tax) |
| `assets/inv-data.js` | Annual returns 1928&ndash;2025 (Damodaran, NYU Stern) |
| `assets/inv-cape.js` | Shiller CAPE 1881&ndash;2026 and CAPE versus next-10-year real returns |
| `assets/inv-glossary.js` | Glossary data |
| `assets/inv-resources.js` | Resource library data |
| `tests/verify-investing.js` | Rendered verification harness (Playwright) |

Progress, worksheets and theme are kept in the visitor's own browser (`localStorage`);
nothing is sent anywhere.

## Data and sources

- **Annual returns and CPI, 1928&ndash;2025:** Aswath Damodaran, *Historical Returns on
  Stocks, Bonds and Bills*, NYU Stern, `histretSP.xls` (last saved 24 August 2026). Inflation
  is December-to-December CPI-U (FRED `CPIAUCNS`) as carried in that workbook. The
  workbook's own small-cap geometric average is not used; the course does not rely on the
  small-cap series.
- **CAPE:** Robert J. Shiller, `ie_data.xls`, shillerdata.com (downloaded September 2026;
  latest month September 2026).
- Every other figure is cited on the tab where it appears. Primary sources include the SEC,
  FINRA, SIPC, FDIC, the Federal Reserve (G.19), the Department of Labor, the GAO, the
  Investment Company Institute and the original research papers.
- Every YouTube handle in the resource library was checked to resolve to the named channel
  in September 2026. Babak's tools are taken from the `babak-tools` registry.

Yearly dollar limits (contribution limits, brackets, exemptions) are deliberately not
hard-coded in Stage 1 or the glossary; later stages that need them must pin the tax year
and cite the IRS or SSA.

## Verification

```bash
python3 -m http.server 8732          # from the Shared folder
node Investing/tests/verify-investing.js
```

The V1.0 run: **36,424 checks, 0 failures** across 109 pages (105 modules, landing page,
tools, glossary and resources) at 1440, 1024, 768 and 390 px. It clicks through every tab and
checks for `undefined`/`NaN`/`Infinity` text, page overflow, elements past the viewport, SVG
text escaping its drawing, illegibly small chart text, a figure on every tab, duplicate
element ids and console errors; then it drives every decision card, myth card, exercise
(right and wrong answers), quiz, worksheet, calculator (every slider at both extremes, every
option, blank and zero inputs, empty result areas), glossary popover, keyboard tab
navigation and theme toggle. Deliberately injected bugs were caught before release, and
screenshots were reviewed by eye at 1440 and 390 px and in dark mode.

## Changelog

### V1.0 (September 2026)

- Release of the full section: landing page, all 105 modules across 15 stages (including the
  capstone), 1,013-term glossary, 374-entry resource library, tools hub with 173 calculators,
  and the verification harness.
- A household consistency pass aligned shared figures (Social Security amounts, essential
  spending, cash balances) across modules.

## Author

Namiranian, Babak

## License

Educational use. Not financial, tax, legal or investment advice.
