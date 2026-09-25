# Investing Learning Lab

V1.0 (September 2026)

A comprehensive, self-paced investing curriculum for every stage of life: new investors,
people with some experience, families, pre-retirees, retirees, and anyone planning what they
will leave behind. Static HTML with no build step, no server and no tracking. Open
`index.html` in any modern browser.

## Scope

15 stages and 105 planned modules. **Stage 1, Foundations (INV-001 to INV-007), is live.**
The landing page lists every planned module with its intended scope; the rest are marked
"In development" and will be written to the same standard.

| Stage | Topic | Modules |
|---|---|---|
| 1 | Foundations | INV-001 to INV-007 (live) |
| 2 | Asset classes and vehicles | INV-008 to INV-017 |
| 3 | Your financial base | INV-018 to INV-023 |
| 4 | Planning and you | INV-024 to INV-028 |
| 5 | Taxes | INV-029 to INV-042 |
| 6 | Approaches and philosophies | INV-043 to INV-054 |
| 7 | Portfolio construction and monitoring | INV-055 to INV-059 |
| 8 | Behavioral finance | INV-060 to INV-062 |
| 9 | Real estate | INV-063 to INV-071 |
| 10 | Financial independence | INV-072 to INV-074 |
| 11 | Retirement (including Social Security) | INV-075 to INV-083 |
| 12 | Estate planning and wealth transfer | INV-084 to INV-094 |
| 13 | Life events | INV-095 to INV-102 |
| 14 | Getting help | INV-103 to INV-104 |
| 15 | Capstone | INV-105 |

## Stage 1 modules

| File | Module | Interactive pieces |
|---|---|---|
| `INV-001.html` | Why Invest at All? | Purchasing-power calculator on 1928&ndash;2025 CPI data; growth of $1 across six assets |
| `INV-002.html` | Compounding and the Time Value of Money | Compound growth, early-versus-late saver, Rule of 72, present value |
| `INV-003.html` | Risk and Return | Rolling holding-period explorer; crash replay (1929, 1973, 2000, 2008, 2022) |
| `INV-004.html` | Diversification and Correlation | Stock/bond mixer on 98 years of data; diversification model; concentration calculator |
| `INV-005.html` | How Markets and Brokers Work | Order-type simulator (market, limit, stop, stop-limit) |
| `INV-006.html` | Reading a Company: Statements and Valuation | Valuation calculator; Shiller CAPE 1881&ndash;2026 and CAPE versus next-decade returns |
| `INV-007.html` | The Cost of Investing | Fee-drag calculator; advice-fee comparison |

Every module is split into tabs (one panel on screen at a time, arrow-key navigation,
deep links as `#s3`) and follows the same anatomy: Start here, concepts with three depth
layers (Start here / Going further / Practitioner depth), live tools, case studies from
real history, "What would you do?" decisions with every option's trade-offs, myth-or-fact
cards, a household lens and worksheet, numeric exercises with worked solutions, an
eight-question knowledge check (70% marks the module complete), and curated resources
plus cited sources. Every tab carries at least one figure.

## The five households

Fictional households recur in every module so each idea is shown at a different life stage:
Maya Brooks (24, first job), Marcus and Elena Rivera (35 and 34, two children), Jordan
Ellis (45, single parent), Tom and Rachel Harper (57 and 55, pre-retirement) and Ruth
Kowalski (68, widowed retiree). Their data lives in `assets/inv.js` (`HOUSEHOLDS`).

## Shared pages and assets

| File | What it is |
|---|---|
| `index.html` | Landing page: start-here paths by audience, one tab per stage, progress |
| `glossary.html` | 373 terms across the whole curriculum; each has what it is, what it is used for, and what it means for you; search, topic and level filters |
| `resources.html` | 66 curated resources: YouTube channels and podcasts, official sources, free tools, data, books, research, and Babak's tools; filter by kind, level and stage |
| `tools.html` | All 13 calculators in one place, plus Babak's planning tools and official calculators |
| `assets/inv.css` | Design system (light by default, dark mode) |
| `assets/inv.js` | Engine: course registry, tabs, journey bar, help, quiz, decisions, myths, exercises, worksheets, glossary popovers, resources, SVG charts |
| `assets/inv-tools.js` | The 13 calculators |
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

The V1.0 run: **3,004 checks, 0 failures** across 11 pages at 1440, 1024, 768 and 390 px.
It clicks through every tab and checks for `undefined`/`NaN`/`Infinity` text, page
overflow, elements past the viewport, SVG text escaping its drawing, illegibly small chart
text, a figure on every tab and console errors; then it drives every decision card, myth
card, exercise (right and wrong answers), quiz, worksheet, calculator (every slider at both
extremes, every option, blank and zero inputs), glossary popover, keyboard tab navigation
and theme toggle. Five deliberately injected bugs were each caught before release.
Screenshots of every tab were reviewed by eye at 1440 and 390 px, and in dark mode.

## Changelog

### V1.0 (September 2026)

- Initial release of the section: landing page, the full 105-module plan, Stage 1
  (seven modules), glossary, resource library, tools hub and verification harness.

## Author

Namiranian, Babak

## License

Educational use. Not financial, tax, legal or investment advice.
