# Investing Learning Lab

V1.4 (October 2026)

A comprehensive, self-paced investing curriculum for every stage of life: new investors,
people with some experience, families, pre-retirees, retirees, and anyone planning what they
will leave behind. Static HTML with no build step, no server and no tracking. Open
`index.html` in any modern browser.

## Scope

Eight clear course groups organize 15 subject stages and **105 modules, all live**, plus a
capstone that builds complete plans for the six households. The landing page shows only the
eight course choices; each opens a new-tab course hub containing its related modules.

| Course | Focus | Modules |
|---|---|---|
| 1 | Investing Essentials | INV-001 to INV-017 |
| 2 | Money & Life Planning | INV-018 to INV-028 |
| 3 | Taxes & Accounts, including state taxes | INV-029 to INV-042 |
| 4 | Strategies & Portfolio Management | INV-043 to INV-062 |
| 5 | Real Estate Investing, including state-dependent rules | INV-063 to INV-071 |
| 6 | Financial Independence & Retirement | INV-072 to INV-083 |
| 7 | Estate, Legacy & Life Changes, including state estate/inheritance taxes | INV-084 to INV-102 |
| 8 | Advice & Complete Plans | INV-103 to INV-105 |

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
| 15 | Capstone: six households, six plans | INV-105 |

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

## The six households

Fictional households recur in every module so each idea is shown at a different life stage:
Denise Brooks (24, first job), Marcus and Elena Rivera (35 and 34, two children), Maya
Walker (58, single mother of Eli, 13, who has a disability), Tom and Rachel Harper (57 and 55, pre-retirement) and Ruth
Kowalski (68, widowed retiree). Daniel and Priya Shah (62 and 48) add a large-age-gap household
with substantial taxable, tax-deferred and Roth assets and a 14-year-old daughter, Leena, who has
lifelong support needs. Their plan spans staggered retirements and a third-party special needs
trust rather than a standard 30-year horizon. Their data lives in `assets/inv.js` (`HOUSEHOLDS`).

## Shared pages and assets

| File | What it is |
|---|---|
| `index.html` | Simple eight-card course landing page with graphics, progress and new-tab launch behavior |
| `course-*.html` | Eight course hubs that group and describe all 105 modules; every module opens in a new tab |
| `glossary.html` | 1,010 terms across the whole curriculum; each has what it is, what it is used for, and what it means for you; search, topic and level filters |
| `resources.html` | 375 curated resources: YouTube channels and podcasts, official sources, free tools, data, books, research, and Babak's tools; filter by kind, level and stage |
| `tools.html` | Stage 1's 13 calculators embedded, a directory of the other 160 by stage, Babak's planning tools and official calculators |
| `assets/inv.css` | Design system (light by default, dark mode) |
| `assets/inv-hub.css` | Landing-card and course-hub layouts, graphics and responsive behavior |
| `assets/inv.js` | Engine: course registry, tabs, journey bar, help, quiz, decisions, myths, exercises, worksheets, glossary popovers, resources, SVG charts |
| `assets/inv-hub.js` | Course-hub renderer, progress and module launch behavior |
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

The V1.4 run: **37,472 checks, 0 failures** across 117 pages (105 modules, eight course hubs, the landing page, tools,
glossary and resources) at 1440, 1024, 768 and 390 px. It clicks through every tab and
checks for `undefined`/`NaN`/`Infinity` text, page overflow, elements past the viewport, SVG
text escaping its drawing, illegibly small chart text, a figure on every tab, duplicate
element ids and console errors; then it drives every decision card, myth card, exercise
(right and wrong answers), quiz, worksheet, calculator (every slider at both extremes, every
option, blank and zero inputs, empty result areas), glossary popover, keyboard tab
navigation and theme toggle. It also verifies the Shah lens across the course, the six-household
capstone, typo-tolerant searches and abbreviations, saved-tab resume/restart, the eight-course
grouping and new-tab launch behavior, and V1.4 October release markers and cache keys on every
page. Selected revised pages were reviewed by eye at
1440 and 390 px.

## Changelog

### V1.4 (October 2026)

- Replaces the overwhelming 15-tab landing experience with eight professionally grouped,
  illustrated course cards modeled on the AI tutorial's simple course-selection pattern.
- Adds eight dedicated course hubs covering every one of the 105 modules exactly once. Landing
  cards and module cards open in new tabs so the learner's course map remains available.
- Makes estate planning and state-specific material visible in the grouping, including state
  income taxes, state estate and inheritance taxes, and state-dependent real-estate rules.
- Preserves saved progress, typo-tolerant search, the full contextual curriculum, all six
  households, dark/light mode, Help, tools, glossary and resources.

### V1.3 (October 2026)

- Adds Daniel and Priya Shah (62 and 48) and their daughter Leena (14), who has lifelong
  support needs: a large-age-gap, multigenerational plan spanning taxable, tax-deferred and
  Roth assets, a third-party special needs trust, staggered retirements, caregiver succession,
  Social Security child-in-care, disabled-child, family-maximum and survivor considerations.
- Reworks allocation and retirement-income teaching around context rather than one answer:
  competing allocation schools and seven distinct two-bucket, three-bucket, purpose-based,
  income-floor and total-return approaches are compared with advantages, limitations and fit.
- Adds typo-tolerant course search, abbreviations and synonyms; restores the last-open tab with
  a visible restart control; corrects the 2026 ABLE-to-Work amount; expands capstone comparisons,
  graphics, sources, disclaimers and rendered regression coverage for the sixth household.

### V1.2 (September 2026)

- New household: Maya Walker, 58, a divorced single mother in Columbus, Ohio, whose son Eli (13)
  has autism and an intellectual disability; $92,000 income and $400,000 saved. She replaces
  Jordan Ellis in every module, with her own numbers recomputed from each page's calculators:
  special needs trust, Ohio STABLE account, SSI at 18, childhood disability benefits, guardianship,
  term life payable to the trust, catch-up contributions and a $957,500 retirement target.
- The 24-year-old household is now named Denise Brooks (formerly Maya Brooks); nothing else
  about her changed.
- Glossary adds parental deeming and Medicaid home and community-based services waivers;
  resources add Ohio's STABLE account and the Ohio DODD waiver pages.

### V1.1 (September 2026)

- Clean addresses like the other sections: tabs no longer add `#s1`, `#s2` to the address, and a
  module always opens on its first tab.
- A Home button on every page, in the guide bar, returns to the course home.
- Wrong-case addresses such as `/shared/investing/` redirect to the right page (site 404 page).
- Asset links carry the version so browsers load new files after an update.

### V1.0 (September 2026)

- Release of the full section: landing page, all 105 modules across 15 stages (including the
  capstone), 1,008-term glossary, 373-entry resource library, tools hub with 173 calculators,
  and the verification harness.
- A household consistency pass aligned shared figures (Social Security amounts, essential
  spending, cash balances) across modules.
- Full audit of all 105 modules: facts checked line by line against primary sources (2026 IRS,
  SSA and CMS figures, statutes, research papers), every calculation recomputed with the pages'
  own tool code, calculators stress-tested at blank, zero and extreme inputs, and every tab
  reviewed on screen at 1440 and 390 px. Wrong rules, figures and cross-references corrected;
  calculator bugs fixed (senior-deduction phase-out, lowest-tax lot selection, Medicare surcharge
  timing, runway and longevity horizons, RMD and charitable-distribution caps).
- Navigation: the active tab scrolls into view, crowded axis labels thin out on narrow screens,
  formulas wrap, and on phones the module header shrinks to its title after the first tab.

## Author

Namiranian, Babak

## License

Educational use. Not financial, tax, legal or investment advice.
