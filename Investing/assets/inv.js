/* Investing Learning Lab - shared engine - V1.3 (October 2026) */
(function () {
  "use strict";
  var VERSION = "V1.3 (October 2026)";
  var AUTHOR = "Namiranian, Babak";
  var root = document.documentElement;

  /* ---------- Course registry (flat numbering, grouped by stage) ---------- */
  var STAGES = [
    { n: 1, name: "Foundations", blurb: "How money grows, what risk really is, and what investing costs." },
    { n: 2, name: "Asset Classes & Vehicles", blurb: "Cash, bonds, stocks, funds, gold, alternatives, crypto, options and annuities." },
    { n: 3, name: "Your Financial Base", blurb: "Cash flow, emergency fund, debt, credit, employer benefits and insurance." },
    { n: 4, name: "Planning & You", blurb: "Goals, risk tolerance vs capacity, life stages, families, and your written plan." },
    { n: 5, name: "Taxes", blurb: "How tax works, every account type, and the strategies that keep more of your return." },
    { n: 6, name: "Approaches & Philosophies", blurb: "The evidence on markets, and the major schools of investing." },
    { n: 7, name: "Portfolio Construction & Monitoring", blurb: "Build it, rebalance it, measure it, review it." },
    { n: 8, name: "Behavioral Finance", blurb: "The biases, bear markets and scams that cost investors the most." },
    { n: 9, name: "Real Estate", blurb: "Your home, rentals, real estate tax rules, REITs, and securities vs property." },
    { n: 10, name: "Financial Independence", blurb: "The math of FI, FIRE variants, and reaching your money before 59½." },
    { n: 11, name: "Retirement", blurb: "How much you need, withdrawals, Social Security, Medicare, RMDs and annuities." },
    { n: 12, name: "Estate Planning & Wealth Transfer", blurb: "Documents, beneficiaries, trusts, estate and gift tax, and inherited assets." },
    { n: 13, name: "Life Events", blurb: "Marriage, divorce, children, aging parents, windfalls, job loss and more." },
    { n: 14, name: "Getting Help", blurb: "Choosing an advisor and the platforms you use." },
    { n: 15, name: "Capstone", blurb: "Six households, six contextual plans." }
  ];
  var T = [
    [1, "Why Invest at All?"], [1, "Compounding and the Time Value of Money"], [1, "Risk and Return"],
    [1, "Diversification and Correlation"], [1, "How Markets and Brokers Work"],
    [1, "Reading a Company: Statements and Valuation"], [1, "The Cost of Investing"],
    [2, "Cash and Cash Equivalents"], [2, "How Bonds Work"], [2, "Bond Types and Bond Funds"], [2, "Stocks"],
    [2, "Mutual Funds, Index Funds and ETFs"], [2, "Commodities and Gold"], [2, "Alternatives and Private Markets"],
    [2, "Crypto Assets"], [2, "Options and Derivatives Basics"], [2, "Annuities and Insurance Products"],
    [3, "Cash Flow and Savings Rate"], [3, "The Emergency Fund"], [3, "Debt vs Investing"], [3, "Credit"],
    [3, "Employer Benefits"], [3, "Insurance and Protection"],
    [4, "Goals and Time Horizons"], [4, "Risk Tolerance, Capacity and Need"], [4, "Planning by Life Stage"],
    [4, "Couples and Families"], [4, "Your Investment Policy Statement"],
    [5, "How US Income Tax Works"], [5, "How Investment Income Is Taxed"], [5, "Workplace Retirement Plans"],
    [5, "IRAs and Roth IRAs"], [5, "Health Savings Accounts"], [5, "529s and Education Accounts"],
    [5, "Taxable Accounts and Cost Basis"], [5, "Asset Location"], [5, "Tax-Loss and Tax-Gain Harvesting"],
    [5, "Roth Conversions"], [5, "Charitable Giving Strategies"], [5, "Equity Compensation"], [5, "State Taxes"],
    [5, "Tax-Aware Withdrawals"],
    [6, "Market Efficiency and the Evidence"], [6, "Index Investing and the Bogleheads"], [6, "Active Management"],
    [6, "Value, Growth and Quality"], [6, "Dividend and Income Investing"], [6, "Factor Investing"],
    [6, "Asset Allocation Models"], [6, "Target-Date Funds and Glide Paths"], [6, "Lump Sum vs Dollar-Cost Averaging"],
    [6, "Market Timing and Tactical Allocation"], [6, "ESG and Values-Based Investing"],
    [6, "International Investing and Currency"],
    [7, "Building a Portfolio"], [7, "Rebalancing"], [7, "Measuring Performance"],
    [7, "Reviewing and Adjusting Your Plan"], [7, "Record Keeping and Consolidation"],
    [8, "Biases That Cost Money"], [8, "The Behavior Gap and Bear Markets"], [8, "Scams, Fraud and Hype"],
    [9, "Rent vs Buy"], [9, "Mortgages"], [9, "Analyzing a Rental Property"], [9, "Financing and Leverage for Investors"],
    [9, "Running a Rental"], [9, "Real Estate Taxes"], [9, "REITs, Syndications and Crowdfunding"],
    [9, "Short-Term Rentals, House Hacking and BRRRR"], [9, "Securities vs Real Estate"],
    [10, "The Math of Financial Independence"], [10, "FIRE Variants"], [10, "Accessing Money Before 59½"],
    [11, "How Much You Need"], [11, "Withdrawal Strategies"], [11, "Sequence Risk and Monte Carlo"],
    [11, "Social Security"], [11, "Medicare and Retiree Health Care"], [11, "Pensions: Lump Sum vs Annuity"],
    [11, "RMDs and Retirement Taxes"], [11, "Annuities for Retirement Income"], [11, "Long-Term Care"],
    [12, "Core Estate Documents"], [12, "Beneficiaries and Titling"], [12, "Probate"], [12, "Trusts"],
    [12, "Federal Estate and Gift Tax"], [12, "State Estate and Inheritance Taxes"],
    [12, "Step-Up in Basis and Inherited Assets"], [12, "Inherited IRAs and the 10-Year Rule"],
    [12, "Gifting and Family Wealth Transfer"], [12, "Charitable Legacy"], [12, "Business Succession"],
    [13, "Marriage and Divorce"], [13, "Children and Education"], [13, "Caring for Aging Parents"],
    [13, "Widowhood and Survivor Planning"], [13, "Windfalls and Inheritance"], [13, "Job Loss and Career Change"],
    [13, "Self-Employment"], [13, "Special-Needs Planning"],
    [14, "Choosing a Financial Advisor"], [14, "Platforms, Brokerages and DIY Tools"],
    [15, "Six Households, Six Plans"]
  ];
  var LIVE = {}; for (var li = 1; li <= 105; li++) LIVE["INV-" + String(li).padStart(3, "0")] = 1;
  var COURSE = T.map(function (t, i) {
    var id = "INV-" + String(i + 1).padStart(3, "0");
    return { id: id, n: i + 1, stage: t[0], title: t[1], live: !!LIVE[id] };
  });

  /* ---------- The six recurring households ---------- */
  var HOUSEHOLDS = {
    denise: { name: "Denise Brooks", short: "Denise", age: "24", color: "var(--s1)", init: "DB",
      line: "Single, first full-time job at $62,000. $28,000 of student loans at 6.8%, $3,000 in savings, renting.",
      stage: "Starting out" },
    rivera: { name: "Marcus & Elena Rivera", short: "The Riveras", age: "35 & 34", color: "var(--s2)", init: "R",
      line: "Married, two children (4 and 7). $145,000 household income, $310,000 mortgage at 3.1%, $62,000 in 401(k)s.",
      stage: "Building a family" },
    maya: { name: "Maya Walker", short: "Maya", age: "58", color: "var(--s3)", init: "MW",
      line: "Divorced single mother of Eli, 13, who has autism and an intellectual disability. $92,000 income, $400,000 saved, $310,000 home with $95,000 left on the mortgage.",
      stage: "Late career, single parent" },
    harper: { name: "Tom & Rachel Harper", short: "The Harpers", age: "57 & 55", color: "var(--s4)", init: "H",
      line: "$260,000 income, $1.1M saved (mostly pre-tax 401(k)), home worth $650,000 with $90,000 left on the mortgage.",
      stage: "Pre-retirement" },
    ruth: { name: "Ruth Kowalski", short: "Ruth", age: "68", color: "var(--s5)", init: "RK",
      line: "Widowed and retired. $780,000 in an individual retirement account (IRA), Social Security of $2,900 a month, paid-off house, $60,000 in cash.",
      stage: "In retirement" },
    shah: { name: "Daniel & Priya Shah", short: "The Shahs", age: "62 & 48", color: "var(--s7)", init: "S",
      line: "Married with a 14-year age gap. Their daughter Leena, 14, has lifelong support needs. $3.2M invested: $1.2M taxable, $1.5M tax-deferred and $500,000 Roth; planning a third-party special needs trust.",
      stage: "Staggered retirement, lifetime caregiving" }
  };

  /* Module-specific sixth-household lens. These short applications make the age-gap,
     account-mix and lifetime-support context visible in every module without pretending
     that one recommendation fits all six households. */
  var SHAH_LENS = [
    "Their purpose is multigenerational: fund Daniel's earlier retirement, Priya's longer working and retirement years, and Leena's support for life. The portfolio cannot be judged by one 30-year horizon.",
    "Compounding runs on three clocks: Daniel's near-term withdrawals, Priya's decades of growth, and Leena's lifetime trust. Each pool needs its own horizon and assumptions.",
    "A single risk score is misleading. Daniel faces sequence risk soon; Priya still has substantial human capital; Leena's support fund must survive both parents.",
    "Diversification protects more than retirement. A concentrated loss could impair Daniel's income, Priya's future, and Leena's support at the same time.",
    "Brokerage choice must cover joint, individual, retirement and trust accounts, with clear successor access and protections. Simplicity for the future trustee matters.",
    "No individual company belongs at the center of Leena's support plan. Any stock analysis is a satellite decision after the family's diversified core is secured.",
    "At $3.2 million, every 0.50% of annual cost is about $16,000. Fees must be measured against actual planning, tax and trust work delivered.",
    "They need separate cash reserves for ordinary emergencies, Daniel's retirement transition and known trust expenses. Calling all three one bucket hides their different jobs.",
    "Bond duration should match liabilities: short bonds for Daniel's early withdrawals, inflation protection for later spending, and growth assets for Priya and Leena.",
    "A ladder, bond fund and TIPS sleeve solve different problems. Their choice depends on dates, inflation exposure, taxes and who will spend the money.",
    "Stocks fund the long horizons for Priya and Leena, but money Daniel will spend soon should not depend on recovering from a market fall.",
    "Low-cost broad funds make the family's many accounts easier to coordinate and eventually administer. Fund structure and tax location still matter.",
    "Gold may be an optional diversifier, not a substitute for Leena's funded trust or Daniel's near-term reserve. Any allocation should be small and purposeful.",
    "Illiquidity is unusually costly when one spouse is retiring and a child may need support unexpectedly. Private assets must not crowd out liquid reserves.",
    "Crypto, if held at all, belongs in a capped speculative sleeve that the retirement and special-needs plans do not rely on.",
    "Options can create obligations at the wrong time. Assets earmarked for retirement income or Leena's care should not secure speculative positions.",
    "Lifetime income may protect Daniel or Priya, but an annuity is not automatically the right vehicle for Leena's support. Beneficiary, inflation and insurer terms control.",
    "Cash flow changes twice: when Daniel retires and when Priya eventually does. The plan must also fund recurring care and trustee costs that do not end at retirement.",
    "Their reserve should exceed a generic month count because caregiving can disrupt Priya's work and Daniel is near retirement. Trust assets are not the household emergency fund.",
    "Debt payoff competes with three investment horizons. Compare the guaranteed debt return with liquidity, taxes, employer matches and the funded status of Leena's plan.",
    "Both spouses need independent credit and account access. A future trustee or agent also needs a documented path that does not depend on one spouse's memory.",
    "Daniel's retirement date, Priya's employment benefits and Leena's eligibility interact. Health, disability, life and workplace benefits must be mapped as a household system.",
    "They need term or permanent coverage only for measured needs, disability protection for Priya's remaining earnings, long-term-care planning for both spouses, and coverage coordinated with the SNT.",
    "Their goals cannot share one date: Daniel's retirement, Priya's retirement and Leena's lifetime support each require a separate amount, priority and funding source.",
    "Capacity varies within the household. Daniel's spending pool has little recovery time; Priya and Leena have long horizons but cannot absorb a failure of the near-term plan.",
    "This family spans several life stages simultaneously. Age-based guidance must be combined with caregiving, disability, survivor and account-type context.",
    "The age gap makes retirement and survivor planning joint decisions. Each spouse also needs independent legal authority, account access and a plan for caring for Leena alone.",
    "Their IPS should define separate sleeves, ranges and refill rules for near-term retirement, long-term growth and Leena's trust, plus who acts after incapacity or death.",
    "Their tax plan changes when Daniel retires, when Social Security begins, when Medicare starts, when Priya retires and when either spouse dies. One current-year bracket is not enough.",
    "Taxable income, qualified dividends and gains affect Roth conversions, Medicare premiums and trust funding. Lots should be managed across the whole household, not account by account.",
    "Daniel can use age-based catch-ups now while Priya has many contribution years left. Roth versus traditional treatment should reflect their different withdrawal dates and future survivor brackets.",
    "Their pre-tax, Roth and taxable balances create planning flexibility. Conversions and contributions should reduce lifetime tax and preserve accessible money for the staggered retirement.",
    "Medicare eligibility arrives for Daniel long before Priya. HSA contributions, reimbursements and enrollment dates must be tracked separately for each spouse.",
    "A 529 may fit education, but Leena's broader disability expenses and benefit eligibility call for an ABLE account and SNT analysis rather than a college-only answer.",
    "The $1.2 million taxable account is both a bridge and an estate asset. Specific-lot records, charitable gifts and step-up planning can materially change after-tax results.",
    "Their three account types should be located as one portfolio. Near-term spending, future Roth growth, tax-efficient equities and SNT funding may belong in different places.",
    "Losses can fund rebalancing and offset gains, but replacement investments must preserve each sleeve's risk. Priya's ongoing income may create opportunities after Daniel retires.",
    "Daniel's retirement-to-RMD years may be a conversion window, but Priya's earnings, Medicare IRMAA and survivor taxes can change the optimal amount each year.",
    "Charitable goals come after the lifetime-support plan is funded. Appreciated taxable assets and later qualified charitable distributions may be more efficient than cash.",
    "If either spouse receives employer stock, it adds household and career concentration. Leena's support assets should not depend on the same company paying the salary.",
    "State residency affects income, estate, trust and benefit planning over several decades. A move must be evaluated for both spouses and the services Leena relies on.",
    "A fixed taxable-first order is too simple. Annual withdrawals, gains, Roth conversions, Social Security, RMDs and SNT funding should be coordinated across all three tax treatments.",
    "Market efficiency supports a low-cost core, but their real planning value comes from tax, benefit and horizon coordination rather than trying to identify mispriced securities.",
    "A broad index core is easy for a surviving spouse and trustee to maintain. Simplicity is a risk control when the plan may outlive both parents.",
    "Active management must overcome fees, taxes and governance burden. Any active sleeve needs a written reason and must not complicate Leena's long-term administration.",
    "Style exposure should be intentional, diversified and measured across accounts. Their support plan should not depend on one style returning to favor on schedule.",
    "Dividends are not a separate safety system. Total return, taxes and the timing of the family's actual cash needs matter more than yield alone.",
    "Factor tilts can endure long droughts. A small, documented tilt may fit the long horizons, but not Daniel's near-term spending reserve.",
    "One age rule cannot serve them. Daniel's reserve, Priya's long horizon, guaranteed income, tax mix and Leena's lifetime need point to a purpose-based allocation across the household.",
    "One target-date fund cannot express three horizons. Separate funds may work for each spouse, while Leena's trust needs its own policy and trustee-ready allocation.",
    "A lump sum is statistically favored for long-horizon money, but staged investing may protect near-term liabilities and behavior. The answer can differ by sleeve.",
    "Tactical timing adds decision risk to an already complex plan. Written rebalancing and spending rules are more dependable than forecasts for essential support assets.",
    "Values-based choices should be measured against diversification, fees and tracking error. Fiduciary duties to Leena's trust may constrain how far preferences can narrow investments.",
    "International diversification reduces dependence on one country across multi-decade horizons. Currency exposure may be acceptable for growth but not for near-term dollar spending.",
    "Build three coordinated sleeves, not three disconnected portfolios: Daniel's transition, Priya's long-term retirement and Leena's lifetime support, then locate them tax-efficiently.",
    "Rebalance the combined household portfolio with contributions, withdrawals and taxable lots. Separate accounts do not justify six unrelated target allocations.",
    "Performance should be measured against each goal's benchmark and funding progress. Beating one market index can still leave the retirement or SNT plan short.",
    "Reviews should occur at least annually and at Daniel's retirement, Social Security claims, Medicare enrollments, Priya's retirement, Leena's adulthood, and either spouse's incapacity or death.",
    "Their family file must let Priya, Daniel, successor trustees and agents find accounts, basis, beneficiaries, benefits, care instructions and professional contacts without guesswork.",
    "Mental accounting can help if the labeled sleeves enforce a sound total allocation; it hurts if labels hide duplicated risk or idle cash.",
    "A written crash plan matters because selling could impair three lives. Near-term reserves and rebalancing rules should be agreed before Daniel retires.",
    "A large visible portfolio and concern for a disabled child make them targets for affinity and urgency scams. Both spouses and the future trustee need a verification protocol.",
    "Housing must support accessibility, school and adult services as well as finances. A purely numerical rent-versus-buy result can miss the stability Leena needs.",
    "Mortgage payoff may lower Daniel's retirement expenses, while investing preserves liquidity for Priya and Leena. Rate, taxes and reserve adequacy decide the trade-off.",
    "A rental must improve the plan after vacancies, work and concentration. It is unsuitable if it consumes the liquidity or management capacity reserved for caregiving.",
    "Leverage magnifies losses near Daniel's retirement and may burden Priya or a successor trustee. Debt must be stress-tested against one-income and care-cost scenarios.",
    "Operating property competes for time with caregiving and retirement. Professional management costs belong in the return calculation from the start.",
    "Depreciation, passive losses and sale taxes affect the family's taxable bridge. Estate and step-up consequences matter if property may fund Leena later.",
    "Public REITs offer liquidity and simple administration; private syndications add lockups and sponsor risk. Trustee usability matters as much as projected yield.",
    "House hacking or BRRRR may suit an active younger investor, but the Shahs should not add operational complexity unless it clearly advances a funded goal.",
    "Securities are easier to divide, rebalance and administer for three horizons; real estate may provide control and inflation exposure but adds concentration and work.",
    "Their FI number is not spending divided by one rate. It must model Daniel, Priya and Leena over different horizons, with Social Security, taxes and support costs.",
    "Daniel can retire while Priya continues working, so the household is neither fully retired nor conventionally FIRE. Benefits, taxes and caregiving define the transition.",
    "Priya may need accessible taxable and Roth basis before 59½ even though Daniel can use retirement accounts. The bridge should not raid Leena's trust funding.",
    "A standard 30-year target is inadequate. The plan must cover both spouses' joint and survivor years plus Leena's support after both parents are gone.",
    "Buckets, guardrails and rebalancing should be compared by purpose: essential family support permits less spending flexibility than travel or gifts.",
    "Sequence risk begins when Daniel draws from the portfolio, but Priya's earnings partly offset it. The plan must also protect Leena if a parent dies during a downturn.",
    "Daniel's claim can activate a child benefit for Leena and possibly a child-in-care spousal benefit for Priya, all subject to the family maximum. Claiming is a family decision.",
    "Daniel reaches Medicare long before Priya. The plan needs separate enrollment calendars, coverage for Priya and Leena, and MAGI control for premiums and subsidies.",
    "Any pension election must weigh Daniel's life, Priya's longer expected survivor period and Leena's needs. The largest single-life payment may be the weakest family choice.",
    "Daniel's RMDs begin years before Priya's. Coordinated conversions and charitable distributions can reduce the later survivor's tax burden and protect plan flexibility.",
    "An income floor can cover essential spending for the spouses, while liquid growth assets preserve flexibility for Leena. Compare inflation, survivor and refund features.",
    "They are planning for their own possible care while already planning Leena's. Insurance, self-funding and housing choices must not make the child's support plan fragile.",
    "Their documents need agents, successor decision-makers, guardianship or supported-decision provisions, an SNT, trustee succession and detailed care instructions for Leena.",
    "Beneficiary forms must route Leena's share to the third-party SNT, not to her directly. The spouses also need contingent beneficiaries and coordinated account titling.",
    "Avoiding probate is about continuity, not just cost. Priya and successor trustees need immediate authority over household and trust funding after death or incapacity.",
    "A revocable trust may manage family assets through incapacity; Leena's third-party SNT has a different job. Trustee powers, succession and distribution standards must be explicit.",
    "Their current $3.2 million may be below federal estate-tax exposure, but growth, life insurance and law changes matter over a lifetime. Portability and state rules still deserve review.",
    "State estate and inheritance taxes can affect where the family lives, owns property and locates trusts. Services for Leena may outweigh a tax-only relocation.",
    "Highly appreciated taxable assets may receive a step-up at death, but the survivor and SNT need liquidity too. Hold-versus-sell decisions belong in the full estate plan.",
    "Retirement-account beneficiaries require special drafting for Leena. The SNT's status, payout rules and taxes must be reviewed by a qualified special-needs attorney.",
    "Gifts for Leena should go to an ABLE account or the third-party SNT as appropriate, not directly to her. Gifts to the other family members follow different rules.",
    "A charitable legacy is appropriate only after both spouses' survivor needs and Leena's lifetime support are conservatively funded. Contingent gifts preserve flexibility.",
    "If they own a business later, succession must provide liquidity without making Priya or Leena dependent on an illiquid company or an unprepared successor.",
    "The age gap changes support, property and survivor consequences. Any agreement should preserve Leena's SNT funding and avoid leaving either spouse without resources or authority.",
    "Education savings are only one need. Leena may require therapies, supported living and lifelong services, so the 529, ABLE account and SNT must have distinct roles.",
    "They may support aging parents while caring for Leena and funding two retirements. Legal authority, time demands and boundaries belong in the financial plan.",
    "Priya is likely to manage the plan alone for years if Daniel dies first. Survivor Social Security, taxes, account access, trustee succession and Leena's care plan must work immediately.",
    "Any inheritance should be paused and assigned by purpose. A gift meant for Leena must avoid direct ownership that could disrupt means-tested benefits.",
    "Priya's job loss would affect benefits and the long runway; Daniel's late-career loss could accelerate retirement. Their reserve and health-coverage plan must handle either event.",
    "Self-employment would add irregular income, benefit and retirement-plan decisions. The family should protect predictable cash flow before accepting extra tax complexity.",
    "Their plan must fund a third-party SNT, establish an ABLE account when useful, name capable successor trustees, coordinate public benefits and document Leena's care for adulthood.",
    "They need advice across retirement income, Social Security, tax and special-needs law. Fee structure matters less than verified competence, coordination and written deliverables.",
    "The platform must support trust accounts, specific-lot tax management, strong security, successor access and simple reporting that Priya and a future trustee can actually use.",
    "Their capstone is a staggered, multigenerational plan: Daniel's retirement, Priya's longer horizon and Leena's lifetime support must remain funded under death, disability and market stress."
  ];

  /* ---------- Helpers ---------- */
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function money(v, dp) {
    if (!isFinite(v)) return "—";
    var neg = v < 0; v = Math.abs(v);
    var s;
    if (dp == null) dp = v >= 100 ? 0 : 2;
    s = v.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
    return (neg ? "−$" : "$") + s;
  }
  function moneyShort(v) {
    if (!isFinite(v)) return "—";
    var a = Math.abs(v), sgn = v < 0 ? "−" : "";
    if (a >= 1e9) return sgn + "$" + (a / 1e9).toFixed(a >= 1e10 ? 0 : 1) + "B";
    if (a >= 1e6) return sgn + "$" + (a / 1e6).toFixed(a >= 1e7 ? 1 : 2) + "M";
    if (a >= 1e4) return sgn + "$" + Math.round(a / 1e3) + "k";
    if (a >= 1e3) return sgn + "$" + (a / 1e3).toFixed(1) + "k";
    return sgn + "$" + Math.round(a);
  }
  function pct(v, dp) { if (!isFinite(v)) return "—"; return (v < 0 ? "−" : "") + Math.abs(v).toFixed(dp == null ? 1 : dp) + "%"; }
  function store(key, val) { try { if (val === undefined) return JSON.parse(localStorage.getItem(key) || "null"); localStorage.setItem(key, JSON.stringify(val)); } catch (e) { return null; } }

  var INV = window.INV = { version: VERSION, author: AUTHOR, course: COURSE, stages: STAGES, households: HOUSEHOLDS,
    esc: esc, money: money, moneyShort: moneyShort, pct: pct, store: store };
  /* Hook for page-specific scripts */
  INV.ready = function (fn) { if (document.readyState !== "loading") fn(); else document.addEventListener("DOMContentLoaded", fn); };

  /* ---------- Guide bar: where you are, one Previous/Next, course map and search ---------- */
  var currentId = document.body.getAttribute("data-module") || "";
  var idx = COURSE.findIndex(function (m) { return m.id === currentId; });
  function prevLive(i) { for (var k = i - 1; k >= 0; k--) if (COURSE[k].live) return COURSE[k]; return null; }
  function nextLive(i) { for (var k = i + 1; k < COURSE.length; k++) if (COURSE[k].live) return COURSE[k]; return null; }
  var PAGE = (location.pathname.split("/").pop() || "index.html");
  var PAGENAME = document.body.getAttribute("data-course-name") || { "index.html": "Course home", "": "Course home", "glossary.html": "Glossary", "tools.html": "Tools", "resources.html": "Resources" }[PAGE] || "";
  var guide = null;
  (function buildGuide() {
    var top = document.querySelector(".top"); if (!top) return;
    guide = document.createElement("nav");
    guide.className = "guide"; guide.setAttribute("aria-label", "Where you are in the course");
    var crumbs;
    if (idx > -1) {
      var m = COURSE[idx], st = STAGES[m.stage - 1];
      crumbs = '<a class="crumb-home" href="index.html">Course</a><span class="sep">\u203A</span><a href="index.html#s' + (m.stage + 1) + '">Stage ' + m.stage + " \u00B7 " + esc(st.name) +
        '</a><span class="sep">\u203A</span><b class="crumb-mod">' + m.id + " \u00B7 " + esc(m.title) + '</b><span class="sep">\u203A</span><span class="crumb-tab" data-crumb-tab></span>';
    } else {
      crumbs = '<a class="crumb-home" href="index.html">Course</a>' + (PAGENAME && PAGENAME !== "Course home" ? '<span class="sep">\u203A</span><b class="crumb-mod">' + PAGENAME + "</b>" : "") +
        '<span class="sep" data-crumb-sep hidden>\u203A</span><span class="crumb-tab" data-crumb-tab></span>';
    }
    guide.innerHTML = '<div class="guide-in"><a class="btn small home-btn" href="index.html" title="Investing course home: eight course groups">\u2302 Home</a><button type="button" class="btn small" data-map aria-haspopup="dialog" title="Course map and search (press /)">\u2630 Course map &amp; search</button>' +
      '<div class="crumbs">' + crumbs + '</div><div class="guide-step"><button type="button" class="btn small" data-step="-1">\u2190 <span>Previous</span></button>' +
      '<button type="button" class="btn small primary" data-step="1"><span>Next</span> \u2192</button></div></div>' +
      '<div class="guide-track" aria-hidden="true"><span></span></div>';
    top.appendChild(guide);
  })();
  function setTrack(frac) { if (!guide) return; var t = guide.querySelector(".guide-track span"); if (t) t.style.width = Math.max(0, Math.min(100, frac * 100)).toFixed(2) + "%"; }
  if (idx > -1) setTrack((idx + 1) / COURSE.length); else if (PAGENAME === "Course home") setTrack(0);

  /* ---------- Back-to-top floater ---------- */
  (function () {
    var b = document.createElement("button");
    b.type = "button"; b.className = "to-top"; b.setAttribute("aria-label", "Back to top"); b.title = "Back to top";
    b.innerHTML = "\u2191<span>Top</span>";
    document.body.appendChild(b);
    function vis() { b.classList.toggle("show", window.scrollY > 500); }
    window.addEventListener("scroll", vis, { passive: true }); vis();
    b.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); });
  })();

  /* ---------- Theme (light default) ---------- */
  function setTheme(t) {
    root.dataset.theme = t; store("inv-theme", t);
    document.querySelectorAll("[data-theme-btn]").forEach(function (b) { b.textContent = t === "dark" ? "Light" : "Dark"; b.setAttribute("aria-pressed", t === "dark" ? "true" : "false"); });
    document.dispatchEvent(new CustomEvent("inv-theme"));
  }
  setTheme(store("inv-theme") || "light");
  document.querySelectorAll("[data-theme-btn]").forEach(function (b) {
    b.addEventListener("click", function () { setTheme(root.dataset.theme === "dark" ? "light" : "dark"); });
  });

  /* ---------- Help modal (injected) ---------- */
  var helpHTML = '<div class="modal" id="helpModal" role="dialog" aria-modal="true" aria-labelledby="helpTitle"><div class="modal-card">' +
    '<h2 id="helpTitle">How this course works</h2><p>' + VERSION + ' · ' + AUTHOR + '</p>' +
    '<h3>Finding your way</h3><p>The landing page organizes all 105 modules into eight clear courses. Each course card opens a new-tab course page containing only its related modules. Inside a lesson, the bar at the top shows your module and tab; <b>Next</b> and <b>Previous</b> move through the learning sequence. <b>Course map &amp; search</b> (or press <b>/</b>) searches every module, every tab and the glossary. The round <b>Top</b> button returns to the top of a long page.</p><h3>Tabs, not a long scroll</h3><p>Each module is split into tabs. You can also click a tab, or use the left and right arrow keys on the tab bar. On a phone, the tab bar becomes a drop-down. Your place in each module is remembered.</p>' +
    '<h3>Three layers of depth</h3><ul><li><b>Start here</b> — the main text of every tab. No background needed.</li><li><b>Going further</b> — expandable panels for readers with some experience.</li><li><b>Practitioner depth</b> — the actual rules, formulas, edge cases and research.</li></ul>' +
    '<h3>Things to do, not just read</h3><ul><li><b>Calculators</b> run their formulas live in your browser.</li><li><b>What would you do?</b> — pick an option first, then see every option’s trade-offs.</li><li><b>Exercises</b> — type an answer and check it; a worked solution follows.</li><li><b>Myth or fact</b> — tap a card to test a popular claim.</li><li><b>Worksheets</b> save in your own browser and can be downloaded.</li><li><b>Dotted terms</b> open a glossary definition.</li></ul>' +
    '<h3>The six households</h3><p>Denise (24), the Riveras (35 and 34), Maya (58), the Harpers (57 and 55), Ruth (68), and Daniel and Priya Shah (62 and 48, with their daughter Leena) are fictional households who reappear throughout the course. Their different ages, family structures, assets and responsibilities show why sound recommendations are contextual rather than one-size-fits-all.</p>' +
    '<h3>Progress and privacy</h3><p>Passing a module’s knowledge check (70% or better) marks it complete. Progress, worksheets and your theme are stored only in this browser (localStorage). Nothing is sent anywhere.</p>' +
    '<h3>Not advice</h3><p>This is educational material, not financial, tax, legal or investment advice. Tax figures and rules change; confirm current numbers with the IRS, SSA and other primary sources, or a qualified professional, before acting.</p>' +
    '<p style="margin-top:14px"><button class="btn primary" id="closeHelp">Close</button></p></div></div>';
  document.body.insertAdjacentHTML("beforeend", helpHTML);
  var help = document.getElementById("helpModal"), helpOpener = null;
  function showHelp(o) { helpOpener = o; help.classList.add("open"); document.getElementById("closeHelp").focus(); }
  function hideHelp() { help.classList.remove("open"); if (helpOpener) helpOpener.focus(); }
  document.querySelectorAll("[data-help-btn]").forEach(function (b) { b.addEventListener("click", function () { showHelp(b); }); });
  document.getElementById("closeHelp").addEventListener("click", hideHelp);
  help.addEventListener("click", function (e) { if (e.target === help) hideHelp(); });
  document.addEventListener("keydown", function (e) {
    if (!help.classList.contains("open")) return;
    if (e.key === "Escape") { e.preventDefault(); hideHelp(); }
    if (e.key === "Tab") { e.preventDefault(); document.getElementById("closeHelp").focus(); }
  });

  /* ---------- Progress store ---------- */
  function readProgress() { return store("inv-progress") || {}; }
  function markModule(id, score, total) {
    if (!id) return; var p = readProgress(); var best = (p[id] && p[id].score) || 0;
    p[id] = { done: true, score: Math.max(best, score), total: total, ts: Date.now() }; store("inv-progress", p);
  }
  INV.progress = { read: readProgress, write: function (p) { store("inv-progress", p); } };

  /* ---------- Tabs ---------- */
  var shell = document.querySelector(".tabs-shell:not([hidden])");
  if (shell) {
    var panels = [].slice.call(shell.querySelectorAll(".panel"));
    var bar = document.createElement("div");
    bar.className = "tabbar"; bar.setAttribute("role", "tablist"); bar.setAttribute("aria-label", "Module sections");
    var selRow = document.createElement("div"); selRow.className = "tabsel-row";
    var selHTML = '<label class="sr-only" for="tabsel">Section</label><select id="tabsel">';
    panels.forEach(function (p, i) {
      var name = p.getAttribute("data-tab") || ("Part " + (i + 1));
      p.id = p.id || ("tab-" + (i + 1));
      p.setAttribute("role", "tabpanel"); p.setAttribute("aria-labelledby", "t-" + p.id); p.setAttribute("tabindex", "-1");
      var b = document.createElement("button");
      b.className = "tab"; b.type = "button"; b.id = "t-" + p.id; b.setAttribute("role", "tab"); b.setAttribute("aria-controls", p.id);
      b.innerHTML = '<span class="n">' + (i + 1) + "</span>" + esc(name);
      b.addEventListener("click", function () { show(i, true); });
      bar.appendChild(b);
      selHTML += '<option value="' + i + '">' + (i + 1) + ". " + esc(name) + "</option>";
    });
    selHTML += "</select>";
    selRow.innerHTML = selHTML;
    shell.insertBefore(selRow, shell.firstChild);
    shell.insertBefore(bar, shell.firstChild);
    var foot = document.createElement("div"); foot.className = "panel-foot";
    foot.innerHTML = '<button class="btn" data-prev type="button">← Previous</button><div style="display:flex;flex-direction:column;align-items:center;gap:6px"><span class="pos"></span><div class="dots" aria-hidden="true">' +
      panels.map(function () { return "<i></i>"; }).join("") + '</div></div><button class="btn primary" data-next type="button">Next →</button>';
    shell.appendChild(foot);
    var tabs = [].slice.call(bar.querySelectorAll(".tab")), dots = [].slice.call(foot.querySelectorAll(".dots i"));
    var sel = selRow.querySelector("select");
    var key = "inv-tab-" + (currentId || location.pathname);
    var seen = store(key + "-seen") || {};
    var cur = 0;
    function show(i, focusTab) {
      if (i < 0 || i >= panels.length) return;
      cur = i; seen[i] = 1; store(key + "-seen", seen); store(key, i);
      panels.forEach(function (p, k) { p.classList.toggle("active", k === i); p.hidden = k !== i; });
      tabs.forEach(function (t, k) {
        t.setAttribute("aria-selected", k === i ? "true" : "false"); t.tabIndex = k === i ? 0 : -1; t.classList.toggle("seen", !!seen[k]);
      });
      dots.forEach(function (d, k) { d.className = k === i ? "on" : (seen[k] ? "seen" : ""); });
      sel.value = String(i);
      document.body.classList.toggle("later-tab", i > 0);
      var tb = tabs[i]; if (tb && bar.scrollWidth > bar.clientWidth) { var tr = tb.getBoundingClientRect(), br = bar.getBoundingClientRect();
        if (tr.left < br.left) bar.scrollLeft += tr.left - br.left - 24; else if (tr.right > br.right) bar.scrollLeft += tr.right - br.right + 24; }
      foot.querySelector(".pos").textContent = "Tab " + (i + 1) + " of " + panels.length;
      var pb = foot.querySelector("[data-prev]"), nb = foot.querySelector("[data-next]");
      var pvm = idx > -1 ? prevLive(idx) : null, nxm = idx > -1 ? nextLive(idx) : null;
      var atFirst = i === 0, atLast = i === panels.length - 1;
      var prevLabel = atFirst ? (pvm ? "Previous module: " + pvm.id : "Previous") : "Previous";
      var nextLabel = atLast ? (nxm ? "Next module: " + nxm.id : (idx > -1 ? "Course home" : "Next")) : "Next";
      var prevOff = atFirst && !pvm, nextOff = atLast && idx === -1;
      pb.innerHTML = "\u2190 " + esc(prevLabel); pb.disabled = prevOff;
      nb.innerHTML = esc(nextLabel) + " \u2192"; nb.disabled = nextOff;
      if (guide) {
        var gp = guide.querySelector('[data-step="-1"]'), gn = guide.querySelector('[data-step="1"]');
        gp.disabled = prevOff; gn.disabled = nextOff;
        gp.querySelector("span").textContent = atFirst && pvm ? "Previous module" : "Previous";
        gn.querySelector("span").textContent = atLast && nxm ? "Next module" : atLast && idx > -1 ? "Course home" : "Next";
        gp.title = atFirst && pvm ? pvm.id + " \u00B7 " + pvm.title : "Previous tab";
        gn.title = atLast && nxm ? nxm.id + " \u00B7 " + nxm.title : "Next tab";
        var ct = guide.querySelector("[data-crumb-tab]");
        if (ct) ct.textContent = "Tab " + (i + 1) + " of " + panels.length + " \u00B7 " + (panels[i].getAttribute("data-tab") || "");
        var cs = guide.querySelector("[data-crumb-sep]"); if (cs) cs.hidden = false;
        if (idx > -1) setTrack((idx + (i + 1) / panels.length) / COURSE.length);
      }
      if (idx > -1) store("inv-last", { id: currentId, tab: i, title: COURSE[idx].title, tabName: panels[i].getAttribute("data-tab") || "" });
      if (focusTab) { tabs[i].focus(); try { tabs[i].scrollIntoView({ block: "nearest", inline: "center" }); } catch (e) {} }
      panels[i].dispatchEvent(new CustomEvent("inv-show", { bubbles: true }));
    }
    function goScroll(i) {
      show(i, false);
      var y = shell.getBoundingClientRect().top + window.scrollY - (document.querySelector(".top") ? document.querySelector(".top").offsetHeight + 8 : 8);
      if (window.scrollY > y) window.scrollTo({ top: y, behavior: "smooth" });
    }
    bar.addEventListener("keydown", function (e) {
      var k = e.key, n = null;
      if (k === "ArrowRight") n = (cur + 1) % panels.length;
      else if (k === "ArrowLeft") n = (cur - 1 + panels.length) % panels.length;
      else if (k === "Home") n = 0; else if (k === "End") n = panels.length - 1;
      if (n !== null) { e.preventDefault(); show(n, true); }
    });
    sel.addEventListener("change", function () { show(Number(sel.value), false); });
    function step(dir) {
      if (dir > 0) {
        if (cur < panels.length - 1) return goScroll(cur + 1);
        if (idx > -1) { var nx2 = nextLive(idx); location.href = nx2 ? nx2.id + ".html" : "index.html"; }
      } else {
        if (cur > 0) return goScroll(cur - 1);
        if (idx > -1) { var pv2 = prevLive(idx); if (pv2) location.href = pv2.id + ".html#last"; }
      }
    }
    INV.step = step;
    foot.querySelector("[data-prev]").addEventListener("click", function () { step(-1); });
    foot.querySelector("[data-next]").addEventListener("click", function () { step(1); });
    if (guide) guide.querySelectorAll("[data-step]").forEach(function (g) { g.addEventListener("click", function () { step(Number(g.getAttribute("data-step"))); }); });
    document.querySelectorAll("[data-goto-tab]").forEach(function (a) {
      a.addEventListener("click", function (e) { e.preventDefault(); goScroll(Number(a.getAttribute("data-goto-tab")) - 1); });
    });
    var start = 0, hm = /^#s(\d+)$/.exec(location.hash), savedTab = store(key);
    if (location.hash === "#last") start = panels.length - 1;
    else if (hm && Number(hm[1]) >= 1 && Number(hm[1]) <= panels.length) start = Number(hm[1]) - 1;
    else if (Number.isInteger(savedTab) && savedTab >= 0 && savedTab < panels.length) start = savedTab;
    show(start, false);
    if (!location.hash && start > 0) {
      var resume = document.createElement("div"); resume.className = "resume-note";
      resume.innerHTML = '<span><b>Resumed where you left off:</b> Tab ' + (start + 1) + " of " + panels.length + " · " + esc(panels[start].getAttribute("data-tab") || "") + '</span><button type="button" class="btn small ghost">Start this module again</button>';
      resume.querySelector("button").addEventListener("click", function () { show(0, true); resume.remove(); });
      shell.insertBefore(resume, bar.nextSibling);
    }
    if (location.hash) { try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {} }
    INV.showTab = function (i) { goScroll(Math.max(0, Math.min(i, panels.length - 1))); };
  }

  if (!shell && guide) guide.querySelectorAll("[data-step]").forEach(function (g) { g.hidden = true; });

  /* ---------- Course map and search ---------- */
  (function () {
    if (!guide) return;
    var modal = document.createElement("div");
    modal.className = "modal map-modal"; modal.id = "mapModal"; modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true"); modal.setAttribute("aria-labelledby", "mapTitle");
    modal.innerHTML = '<div class="modal-card map-card"><div class="map-head"><h2 id="mapTitle">Course map</h2><button type="button" class="btn small" data-map-close>Close</button></div>' +
      '<label class="sr-only" for="mapQ">Search the course</label><input type="search" id="mapQ" placeholder="Search modules, tabs and glossary terms (e.g. Roth, RMD, cap rate)" autocomplete="off">' +
      '<div class="map-hint src">Type to search every module, every tab and the glossary. Or browse by stage below. Press Esc to close.</div><div class="map-body" id="mapBody"></div></div>';
    document.body.appendChild(modal);
    var q = modal.querySelector("#mapQ"), body = modal.querySelector("#mapBody"), opener = null, loaded = !!window.INV_INDEX;
    function ensureIndex(cb) {
      if (window.INV_INDEX) return cb();
      var sc = document.createElement("script"); sc.src = "assets/inv-index.js?v=1.3"; sc.onload = function () { loaded = true; cb(); }; sc.onerror = cb; document.head.appendChild(sc);
    }
    var prog = function () { return readProgress(); };
    function outline() {
      var p = prog(), cur = idx > -1 ? COURSE[idx] : null, last = store("inv-last");
      var html = "";
      if (last && last.id && (!cur || last.id !== cur.id)) html += '<a class="map-continue" href="' + last.id + ".html#s" + (last.tab + 1) + '"><span>Continue where you left off</span><b>' + esc(last.id) + " \u00B7 " + esc(last.title || "") + "</b><small>Tab " + (last.tab + 1) + (last.tabName ? " \u00B7 " + esc(last.tabName) : "") + "</small></a>";
      html += '<div class="map-links"><a href="index.html">Course home</a><a href="glossary.html">Glossary</a><a href="tools.html">Tools</a><a href="resources.html">Resources</a></div>';
      STAGES.forEach(function (st) {
        var mods = COURSE.filter(function (m) { return m.stage === st.n; });
        var done = mods.filter(function (m) { return p[m.id] && p[m.id].done; }).length;
        var open = cur ? cur.stage === st.n : st.n === 1;
        html += '<details class="map-stage"' + (open ? " open" : "") + '><summary><span class="map-sn">' + st.n + "</span>" + esc(st.name) + '<small>' + done + " / " + mods.length + " complete</small></summary><ol>" +
          mods.map(function (m) {
            var here = cur && cur.id === m.id, ok = p[m.id] && p[m.id].done;
            return '<li' + (here ? ' class="here"' : "") + '><a href="' + m.id + '.html"><span class="map-code">' + m.id + "</span>" + esc(m.title) + (ok ? ' <span class="map-ok" title="Complete">\u2713</span>' : "") + (here ? ' <span class="map-here">You are here</span>' : "") + "</a></li>";
          }).join("") + "</ol></details>";
      });
      body.innerHTML = html;
    }
    function norm(t) {
      t = String(t || "").toLowerCase();
      if (t.normalize) t = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return t.replace(/&(?:amp|quot|#39);/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
    }
    var SEARCH_PHRASES = { snt: "special needs trust", ss: "social security", etf: "exchange traded fund",
      rmd: "required minimum distribution", dac: "disabled adult child" };
    var SEARCH_CANON = { stocks: "stock", equities: "stock", equity: "stock", bonds: "bond", buckets: "bucket",
      guardrails: "guardrail", advisers: "advisor", adviser: "advisor", disabilities: "disability", disabled: "disability" };
    function canonWord(w) { return SEARCH_CANON[w] || w; }
    function editDistance(a, b) {
      var prev = [], cur = [], i, j; for (j = 0; j <= b.length; j++) prev[j] = j;
      for (i = 1; i <= a.length; i++) { cur[0] = i; for (j = 1; j <= b.length; j++) cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur.slice(); }
      return prev[b.length];
    }
    function wordScore(w, toks) {
      var best = 99;
      toks.forEach(function (t) {
        if (t === w || (w.length >= 3 && (t.indexOf(w) === 0 || w.indexOf(t) === 0))) best = Math.min(best, 0);
        else if (w.length >= 4 && t.length >= 4) { var len = Math.max(w.length, t.length), lim = len >= 9 ? 3 : len >= 5 ? 2 : 1; if (Math.abs(w.length - t.length) <= lim && editDistance(w, t) <= lim) best = Math.min(best, 1); }
      });
      return best;
    }
    function matchScore(text, words) {
      var n = norm(text), toks = n.split(/\s+/).filter(Boolean).map(canonWord); if (!toks.length) return 99;
      var phrase = words.join(" "), total = n.indexOf(phrase) > -1 ? 0 : 1;
      for (var wi = 0; wi < words.length; wi++) { var s = wordScore(words[wi], toks); if (s > 1) return 99; total += s; }
      return total;
    }
    function search(term) {
      var entered = norm(term), words = entered.split(/\s+/).filter(Boolean); if (!words.length) return outline();
      var expanded = [];
      words.forEach(function (w) { if (SEARCH_PHRASES[w]) expanded = expanded.concat(norm(SEARCH_PHRASES[w]).split(" ")); else expanded.push(canonWord(w)); });
      words = expanded.filter(function (w, i, a) { return a.indexOf(w) === i; });
      var I = window.INV_INDEX || {}, res = [], tabsRes = [], G = window.INV_GLOSSARY || [];
      COURSE.forEach(function (m) {
        var info = I[m.id] || {};
        var ms = matchScore(m.id + " " + m.title + " " + (info.scope || "") + " " + (info.q || "") + " " + STAGES[m.stage - 1].name, words);
        if (ms < 99) res.push({ href: m.id + ".html", code: m.id, title: m.title, sub: info.scope || STAGES[m.stage - 1].name, score: ms });
        (info.tabs || []).forEach(function (t, k) { var ts = matchScore(t, words); if (ts < 99) tabsRes.push({ href: m.id + ".html#s" + (k + 1), code: m.id, title: t, sub: m.title + " \u00B7 tab " + (k + 1), score: ts }); });
      });
      res.sort(function (a, b) { return a.score - b.score; });
      tabsRes.sort(function (a, b) { return a.score - b.score; });
      var rankedG = G.map(function (g) { return { g: g, score: matchScore(g.t + " " + (g.a || []).join(" ") + " " + (g.d || ""), words) }; }).filter(function (x) { return x.score < 99; }).sort(function (a, b) { return a.score - b.score; });
      var gl = rankedG.slice(0, 12).map(function (x) { return x.g; });
      var gl2 = [];
      function list(title, arr) { return arr.length ? '<h3 class="map-sec">' + title + " (" + arr.length + ')</h3><ul class="map-res">' + arr.slice(0, 30).map(function (r) { return '<li><a href="' + r.href + '"><span class="map-code">' + esc(r.code) + "</span><b>" + esc(r.title) + "</b><small>" + esc(r.sub) + "</small></a></li>"; }).join("") + "</ul>" : ""; }
      var gItems = gl.concat(gl2).map(function (g) { return { href: "glossary.html#" + slug(g.t), code: "Glossary", title: g.t, sub: g.d.length > 110 ? g.d.slice(0, 110) + "\u2026" : g.d }; });
      var html = list("Modules", res) + list("Tabs inside modules", tabsRes) + list("Glossary", gItems);
      body.scrollTop = 0;
      body.innerHTML = html || '<p class="src">Nothing relevant found for "' + esc(term) + '". Try the idea in different words, or browse by stage after clearing the search.</p>';
    }
    function openMap(o) { opener = o || document.activeElement; ensureIndex(function () { q.value = ""; outline(); modal.classList.add("open"); setTimeout(function () { q.focus(); var h = body.querySelector(".here a"); if (h) h.scrollIntoView({ block: "center" }); }, 30); }); }
    function closeMap() { modal.classList.remove("open"); if (opener && opener.focus) opener.focus(); }
    INV.openMap = openMap;
    guide.querySelector("[data-map]").addEventListener("click", function () { openMap(this); });
    modal.querySelector("[data-map-close]").addEventListener("click", closeMap);
    modal.addEventListener("click", function (e) { if (e.target === modal) closeMap(); });
    q.addEventListener("input", function () { search(q.value); });
    q.addEventListener("keydown", function (e) { if (e.key === "Enter") { var a = body.querySelector("a"); if (a) location.href = a.getAttribute("href"); } });
    document.addEventListener("keydown", function (e) {
      if (modal.classList.contains("open")) { if (e.key === "Escape") { e.preventDefault(); closeMap(); } return; }
      var tg = e.target, typing = tg && (/^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName) || tg.isContentEditable);
      if (!typing && (e.key === "/" || ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")))) { e.preventDefault(); openMap(); }
    });
    /* hash links into other pages' tabs keep working; same-page stage links on the landing page */
    window.addEventListener("hashchange", function () { var hm2 = /^#s(\d+)$/.exec(location.hash) || (location.hash === "#last" ? [0, 999] : null); if (hm2 && INV.showTab) { INV.showTab(Number(hm2[1]) - 1); try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {} } });
  })();

  /* ---------- Tables: label cells so narrow screens can stack rows ---------- */
  document.querySelectorAll("table.tbl").forEach(function (t) {
    var hs = [].slice.call(t.querySelectorAll("thead th")).map(function (th) { return th.textContent.trim(); });
    if (!hs.length) return;
    t.classList.add("stackable");
    t.querySelectorAll("tbody tr").forEach(function (tr) { [].slice.call(tr.children).forEach(function (td, i) { if (hs[i] && !td.hasAttribute("data-label")) td.setAttribute("data-label", hs[i]); }); });
  });

  /* ---------- Households: cards and lens rows ---------- */
  function avatar(h, cls) { return '<span class="' + (cls || "av") + '" style="background:' + h.color + '">' + esc(h.init) + "</span>"; }
  document.querySelectorAll("[data-households]").forEach(function (el) {
    var keys = (el.getAttribute("data-households") || "denise,rivera,maya,harper,ruth,shah").split(",");
    el.classList.add("hh-grid");
    el.innerHTML = keys.map(function (k) {
      var h = HOUSEHOLDS[k.trim()]; if (!h) return "";
      return '<div class="hh">' + avatar(h) + '<div><div class="nm">' + esc(h.name) + ' <span class="chip gray">' + esc(h.age) + '</span></div><div class="ds">' + esc(h.line) + "</div></div></div>";
    }).join("");
  });
  if (idx > -1) {
    var householdPanel = document.querySelector('.panel[data-tab="Your household"] .lens');
    if (householdPanel && !householdPanel.querySelector('[data-hh="shah"]') && SHAH_LENS[idx]) {
      var shahRow = document.createElement("div"); shahRow.className = "lens-row"; shahRow.setAttribute("data-hh", "shah");
      shahRow.innerHTML = "<div><b>Their plan spans three lives.</b> " + esc(SHAH_LENS[idx]) + "</div>"; householdPanel.appendChild(shahRow);
    }
  }
  document.querySelectorAll(".lens-row[data-hh]").forEach(function (row) {
    var h = HOUSEHOLDS[row.getAttribute("data-hh")]; if (!h) return;
    var who = document.createElement("div"); who.className = "who";
    who.innerHTML = avatar(h) + "<div><b>" + esc(h.name) + "</b><small>" + esc(h.age) + " · " + esc(h.stage) + "</small></div>";
    row.insertBefore(who, row.firstChild);
  });

  /* ---------- Decision cards ---------- */
  document.querySelectorAll(".decide").forEach(function (d) {
    var opts = [].slice.call(d.querySelectorAll(".opt"));
    var ocs = [].slice.call(d.querySelectorAll(".oc"));
    opts.forEach(function (o, i) {
      o.type = "button";
      o.addEventListener("click", function () {
        opts.forEach(function (x) { x.classList.remove("picked"); x.setAttribute("aria-pressed", "false"); });
        o.classList.add("picked"); o.setAttribute("aria-pressed", "true");
        ocs.forEach(function (c, k) { c.classList.toggle("mine", k === i); });
        d.classList.add("done");
        var out = d.querySelector(".outcomes"); if (out) out.setAttribute("aria-live", "polite");
      });
    });
  });

  /* ---------- Myth cards ---------- */
  document.querySelectorAll(".myth").forEach(function (c) {
    c.setAttribute("aria-expanded", "false");
    if (!c.querySelector(".hint")) c.insertAdjacentHTML("beforeend", '<div class="hint">Tap to test the claim</div>');
    c.addEventListener("click", function () {
      var o = c.classList.toggle("open"); c.setAttribute("aria-expanded", o ? "true" : "false");
      c.querySelector(".mt").textContent = o ? "What the evidence says" : "Myth or fact?";
    });
  });

  /* ---------- Numeric exercises ---------- */
  document.querySelectorAll(".ex[data-answer]").forEach(function (ex) {
    var ans = Number(ex.getAttribute("data-answer"));
    var tol = Number(ex.getAttribute("data-tol") || 0.02);
    var input = ex.querySelector("input"), fb = ex.querySelector(".ex-fb");
    var check = ex.querySelector("[data-check]"), reveal = ex.querySelector("[data-reveal]");
    function parse(v) { return Number(String(v).replace(/[$,%\s]/g, "")); }
    if (check) check.addEventListener("click", function () {
      var v = parse(input.value);
      if (!isFinite(v) || input.value.trim() === "") { fb.className = "ex-fb show no"; fb.textContent = "Type a number first."; return; }
      var ok = Math.abs(v - ans) <= Math.abs(ans) * tol + 1e-9;
      fb.className = "ex-fb show " + (ok ? "ok" : "no");
      fb.innerHTML = ok ? "<b>Right.</b> " + (ex.getAttribute("data-ok") || "") : "<b>Not quite.</b> " + (v > ans ? "That is too high. " : "That is too low. ") + "Try again, or open the worked solution.";
      if (ok) ex.classList.add("solved");
    });
    if (input) input.addEventListener("keydown", function (e) { if (e.key === "Enter" && check) check.click(); });
    if (reveal) reveal.addEventListener("click", function () { ex.classList.toggle("solved"); reveal.textContent = ex.classList.contains("solved") ? "Hide worked solution" : "Show worked solution"; });
  });

  /* ---------- Worksheets (saved locally, downloadable) ---------- */
  document.querySelectorAll(".ws[data-ws]").forEach(function (ws) {
    var k = "inv-ws-" + ws.getAttribute("data-ws");
    var data = store(k) || {};
    var fields = [].slice.call(ws.querySelectorAll("textarea,input"));
    var saved = ws.querySelector(".saved");
    fields.forEach(function (f, i) {
      var id = f.getAttribute("data-key") || ("f" + i);
      if (data[id] != null) f.value = data[id];
      f.addEventListener("input", function () { data[id] = f.value; store(k, data); if (saved) saved.textContent = "Saved in this browser"; });
    });
    var dl = ws.querySelector("[data-ws-download]");
    if (dl) dl.addEventListener("click", function () {
      var title = ws.getAttribute("data-title") || "Worksheet";
      var out = title + "\n" + (currentId ? currentId + " · " : "") + "Investing Learning Lab · " + VERSION + "\n\n";
      fields.forEach(function (f) {
        var lab = ws.querySelector('label[for="' + f.id + '"]');
        out += (lab ? lab.textContent.trim() : (f.getAttribute("data-key") || "Field")) + "\n" + (f.value || "(blank)") + "\n\n";
      });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([out], { type: "text/plain" }));
      a.download = (currentId || "worksheet") + "-" + (ws.getAttribute("data-ws")) + ".txt";
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
    });
    var clr = ws.querySelector("[data-ws-clear]");
    if (clr) clr.addEventListener("click", function () {
      if (!confirm("Clear everything in this worksheet?")) return;
      data = {}; store(k, data); fields.forEach(function (f) { f.value = ""; }); if (saved) saved.textContent = "Cleared";
    });
  });

  /* ---------- Quiz ---------- */
  var quizData = document.getElementById("quizData");
  if (quizData) {
    var quiz = []; try { quiz = JSON.parse(quizData.textContent); } catch (e) { quiz = []; }
    var box = document.getElementById("quizBox"), scoreEl = document.getElementById("quizScore");
    var answered = {};
    var renderQuiz = function () {
      box.innerHTML = quiz.map(function (q, i) {
        return '<div class="quiz-q"><div class="q">' + (i + 1) + ". " + q.q + '</div><div class="choices">' +
          q.choices.map(function (c, j) { return '<button type="button" class="choice" data-q="' + i + '" data-a="' + j + '">' + c + "</button>"; }).join("") +
          '</div><div class="explain" id="ex' + i + '" aria-live="polite"></div></div>';
      }).join("");
      box.querySelectorAll(".choice").forEach(function (b) { b.addEventListener("click", onChoice); });
      updateScore();
    };
    var onChoice = function () {
      var i = Number(this.getAttribute("data-q")), a = Number(this.getAttribute("data-a"));
      answered[i] = a;
      this.closest(".quiz-q").querySelectorAll(".choice").forEach(function (x, j) {
        x.disabled = true; if (j === quiz[i].answer) x.classList.add("ok"); else if (j === a) x.classList.add("bad");
      });
      var ex = document.getElementById("ex" + i);
      ex.innerHTML = "<b>" + (a === quiz[i].answer ? "Correct. " : "Not quite. ") + "</b>" + quiz[i].explain;
      ex.classList.add("show"); updateScore();
    };
    var updateScore = function () {
      var total = quiz.length, done = Object.keys(answered).length;
      var got = Object.keys(answered).filter(function (i) { return answered[i] === quiz[i].answer; }).length;
      var flag = "";
      if (done === total && total) {
        var pass = got / total >= 0.7;
        flag = ' <span class="pass-flag ' + (pass ? "pass" : "fail") + '">' + (pass ? "✓ Passed — module complete" : "Keep reviewing (70% to pass)") + "</span>";
        if (pass) markModule(currentId, got, total);
      }
      if (scoreEl) scoreEl.innerHTML = "Score: " + got + " of " + total + " correct \u00B7 " + done + " of " + total + " answered" + flag;
    };
    var rs = document.getElementById("quizReset");
    if (rs) rs.addEventListener("click", function () { answered = {}; renderQuiz(); });
    if (box) renderQuiz();
  }

  /* ---------- Glossary popovers ---------- */
  var pop = null;
  function closePop() { if (pop) { pop.remove(); pop = null; } }
  function glossLookup(k) {
    var G = window.INV_GLOSSARY || [];
    k = k.toLowerCase();
    for (var i = 0; i < G.length; i++) { if (G[i].t.toLowerCase() === k || (G[i].a && G[i].a.some(function (x) { return x.toLowerCase() === k; }))) return G[i]; }
    return null;
  }
  INV.glossLookup = glossLookup;
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  INV.slug = slug;
  document.querySelectorAll(".term").forEach(function (t) {
    if (t.tagName !== "BUTTON") { t.setAttribute("role", "button"); t.tabIndex = 0; }
    function open(e) {
      e.preventDefault(); e.stopPropagation();
      var key = t.getAttribute("data-term") || t.textContent;
      var g = glossLookup(key);
      closePop();
      pop = document.createElement("div"); pop.className = "term-pop"; pop.setAttribute("role", "dialog");
      pop.innerHTML = g ? "<b>" + esc(g.t) + "</b>" + g.d + (g.u ? '<div class="tp-l">What it is used for</div>' + g.u : "") +
        (g.m ? '<div class="tp-l">What it means for you</div>' + g.m : "") + '<br><a href="glossary.html#' + slug(g.t) + '">Open in glossary →</a>'
        : "<b>" + esc(key) + '</b>See the <a href="glossary.html">glossary</a>.';
      document.body.appendChild(pop);
      var r = t.getBoundingClientRect(), pw = Math.min(340, window.innerWidth - 20);
      pop.style.maxWidth = pw + "px";
      var left = Math.max(10, Math.min(window.scrollX + r.left, window.scrollX + window.innerWidth - pw - 10));
      pop.style.left = left + "px"; pop.style.top = (window.scrollY + r.bottom + 8) + "px";
    }
    t.addEventListener("click", open);
    t.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") open(e); if (e.key === "Escape") closePop(); });
  });
  document.addEventListener("click", function (e) { if (pop && !pop.contains(e.target)) closePop(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePop(); });

  /* ---------- Resources (from assets/inv-resources.js) ---------- */
  var KIND = { babak: ["🧰", "Babak's tool"], video: ["▶️", "YouTube"], podcast: ["🎙️", "Podcast"], official: ["🏛️", "Official"], tool: ["🧮", "Free tool"],
    data: ["📊", "Data"], course: ["🎓", "Course"], book: ["📖", "Book"], research: ["🔬", "Research"] };
  var KORDER = ["babak", "video", "podcast", "official", "tool", "data", "course", "book", "research"];
  var LV = { 1: "New to investing", 2: "Some experience", 3: "Advanced" };
  INV.kinds = KIND; INV.levels = LV;
  INV.resourceCard = function (r) {
    var k = KIND[r.k] || ["🔗", r.k];
    var title = r.url ? '<a href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer">' + esc(r.n) + " ↗</a>" : "<b>" + esc(r.n) + "</b>";
    return '<div class="res"><div class="ri" aria-hidden="true">' + k[0] + "</div><div>" + title +
      '<div class="src">' + esc(r.by || "") + '</div><div class="why">' + esc(r.why) + '</div><div class="tags"><span>' + esc(k[1]) + "</span><span>" + esc(LV[r.lv] || "") + "</span>" +
      (r.st || []).slice(0, 3).map(function (s) { return "<span>Stage " + s + "</span>"; }).join("") + "</div></div></div>";
  };
  document.querySelectorAll("[data-resources]").forEach(function (el) {
    var id = el.getAttribute("data-resources"), R = window.INV_RESOURCES || [];
    var list = R.filter(function (r) { return (r.mods || []).indexOf(id) > -1; });
    list.sort(function (a, b) { return KORDER.indexOf(a.k) - KORDER.indexOf(b.k) || a.lv - b.lv; });
    el.className = "res-list";
    el.innerHTML = list.length ? list.map(INV.resourceCard).join("") + '<p class="src">More in the <a href="resources.html">full resource library</a>; calculators in the <a href="tools.html">tools hub</a>.</p>'
      : '<p class="src">See the <a href="resources.html">full resource library</a>.</p>';
  });

  /* ---------- Chart library (SVG, theme-aware through CSS variables) ---------- */
  function niceTicks(min, max, count) {
    if (min === max) { max = min + 1; }
    var span = max - min, step = Math.pow(10, Math.floor(Math.log10(span / count)));
    var err = span / count / step;
    if (err >= 7.5) step *= 10; else if (err >= 3.5) step *= 5; else if (err >= 1.5) step *= 2;
    var lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step, out = [];
    for (var v = lo; v <= hi + step / 2; v += step) out.push(Math.round(v / step) * step);
    return out;
  }
  function logTicks(min, max) {
    var out = [], e0 = Math.floor(Math.log10(min)), e1 = Math.ceil(Math.log10(max));
    for (var e = e0; e <= e1; e++) out.push(Math.pow(10, e));
    return out;
  }
  /* opts: series:[{name,color,data:[[x,y]],dash,area,width}], xFmt, yFmt, log, yMin, yMax, height, bands:[{x0,x1,label}], marks:[{x,label}], xTitle, yTitle, tipFmt */
  function chartWidth(el, o) { if (o.width) return o.width; var cw = el.clientWidth || (el.parentNode && el.parentNode.clientWidth) || 0; return cw > 40 ? Math.max(300, Math.min(Math.round(cw), 920)) : 720; }
  INV.lineChart = function (el, o) {
    el.__chart = ["line", o];
    var W = chartWidth(el, o), H = o.height || 300, L = o.left || 62, R = o.right || 16, Tp = o.yTitle ? 30 : 16, B = o.xTitle ? 44 : 30;
    var all = []; o.series.forEach(function (s) { s.data.forEach(function (p) { if (isFinite(p[1])) all.push(p); }); });
    if (!all.length) { el.innerHTML = ""; return; }
    var xs = all.map(function (p) { return p[0]; }), ys = all.map(function (p) { return p[1]; });
    var x0 = o.xMin != null ? o.xMin : Math.min.apply(null, xs), x1 = o.xMax != null ? o.xMax : Math.max.apply(null, xs);
    var y0 = o.yMin != null ? o.yMin : Math.min.apply(null, ys), y1 = o.yMax != null ? o.yMax : Math.max.apply(null, ys);
    var ticks;
    if (o.log) { y0 = Math.max(y0, 1e-6); ticks = logTicks(y0, y1); y0 = ticks[0]; y1 = ticks[ticks.length - 1]; }
    else { if (o.yMin == null && y0 > 0 && o.zeroBase !== false) y0 = 0; ticks = niceTicks(y0, y1, o.yTicks || 5); y0 = ticks[0]; y1 = ticks[ticks.length - 1]; }
    var sx = function (x) { return L + (x - x0) / ((x1 - x0) || 1) * (W - L - R); };
    var sy = o.log ? function (y) { return Tp + (Math.log10(y1) - Math.log10(Math.max(y, 1e-6))) / (Math.log10(y1) - Math.log10(y0)) * (H - Tp - B); }
      : function (y) { return Tp + (y1 - y) / ((y1 - y0) || 1) * (H - Tp - B); };
    var yF = o.yFmt || function (v) { return String(v); }, xF = o.xFmt || function (v) { return String(v); };
    var s = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(o.label || "Chart") + '">';
    (o.bands || []).forEach(function (b) {
      s += '<rect x="' + sx(b.x0) + '" y="' + Tp + '" width="' + Math.max(2, sx(b.x1) - sx(b.x0)) + '" height="' + (H - Tp - B) + '" style="fill:' + (b.color || "var(--red-soft)") + '" opacity=".8"/>';
      if (b.label) s += '<text x="' + ((sx(b.x0) + sx(b.x1)) / 2) + '" y="' + (Tp + 11) + '" text-anchor="middle" class="svg-m" font-size="10">' + esc(b.label) + "</text>";
    });
    s += '<g class="grid">';
    ticks.forEach(function (t) { s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + sy(t) + '" y2="' + sy(t) + '"/>'; });
    s += '</g><g class="axis">';
    ticks.forEach(function (t) { s += '<text x="' + (L - 8) + '" y="' + (sy(t) + 4) + '" text-anchor="end">' + esc(yF(t)) + "</text>"; });
    var xt = o.xTicks || niceTicks(x0, x1, Math.min(8, Math.max(3, Math.round((W - L - R) / 90))));
    if (o.xTicks) { xt = xt.filter(function (t) { return t >= x0 && t <= x1; });
      var xNeed = function (t) { return String(xF(t)).length * 6.6 + 10; }, xKeep = [];
      xt.forEach(function (t) { var pv = xKeep[xKeep.length - 1]; if (pv == null || sx(t) - sx(pv) >= (xNeed(t) + xNeed(pv)) / 2) xKeep.push(t); });
      var xLast = xt[xt.length - 1];
      if (xKeep.length && xKeep[xKeep.length - 1] !== xLast) { while (xKeep.length > 1 && sx(xLast) - sx(xKeep[xKeep.length - 1]) < (xNeed(xLast) + xNeed(xKeep[xKeep.length - 1])) / 2) xKeep.pop(); if (xKeep.length > 1 || sx(xLast) - sx(xKeep[0]) >= (xNeed(xLast) + xNeed(xKeep[0])) / 2) xKeep.push(xLast); }
      xt = xKeep; }
    xt.forEach(function (t) { if (t < x0 || t > x1) return; var px = sx(t), an = px > W - R - 24 ? "end" : px < L + 24 ? "start" : "middle"; s += '<text x="' + px + '" y="' + (H - B + 16) + '" text-anchor="' + an + '">' + esc(xF(t)) + "</text>"; });
    if (o.xTitle) s += '<text class="axis-title" x="' + ((L + W - R) / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(o.xTitle) + "</text>";
    if (o.yTitle) s += '<text class="axis-title" x="' + (L - 8) + '" y="' + (Tp - 14) + '" text-anchor="start">' + esc(o.yTitle) + "</text>";
    s += "</g>";
    if (!o.log && y0 < 0 && y1 > 0) s += '<line class="zero" x1="' + L + '" x2="' + (W - R) + '" y1="' + sy(0) + '" y2="' + sy(0) + '"/>';
    o.series.forEach(function (se) {
      var pts = se.data.filter(function (p) { return isFinite(p[1]); });
      if (!pts.length) return;
      var d = pts.map(function (p, i) { return (i ? "L" : "M") + sx(p[0]).toFixed(1) + " " + sy(p[1]).toFixed(1); }).join(" ");
      if (se.area) {
        var base = o.log ? sy(y0) : sy(Math.max(y0, 0));
        s += '<path d="' + d + " L" + sx(pts[pts.length - 1][0]).toFixed(1) + " " + base + " L" + sx(pts[0][0]).toFixed(1) + " " + base + ' Z" style="fill:' + se.color + '" opacity="' + (se.areaOpacity || 0.14) + '"/>';
      }
      s += '<path d="' + d + '" fill="none" style="stroke:' + se.color + '" stroke-width="' + (se.width || 2.4) + '" stroke-linejoin="round" stroke-linecap="round"' + (se.dash ? ' stroke-dasharray="' + se.dash + '"' : "") + "/>";
    });
    (o.marks || []).forEach(function (mk) {
      var mx = sx(mk.x);
      s += '<line x1="' + mx + '" x2="' + mx + '" y1="' + Tp + '" y2="' + (H - B) + '" style="stroke:var(--muted)" stroke-dasharray="3 3"/>';
      if (mk.label) s += '<text x="' + (mx + 4) + '" y="' + (Tp + 12 + (mk.dy || 0)) + '" class="svg-s" font-size="10.5">' + esc(mk.label) + "</text>";
    });
    (o.dots || []).forEach(function (dt) {
      s += '<circle cx="' + sx(dt.x) + '" cy="' + sy(dt.y) + '" r="' + (dt.r || 5) + '" style="fill:' + (dt.color || "var(--blue)") + ';stroke:var(--card)" stroke-width="2"/>';
      if (dt.label) s += '<text x="' + (sx(dt.x) + (dt.dx || 8)) + '" y="' + (sy(dt.y) + (dt.dy || -8)) + '" class="svg-t" font-size="11" font-weight="700"' + (dt.anchor ? ' text-anchor="' + dt.anchor + '"' : "") + ">" + esc(dt.label) + "</text>";
    });
    s += '<line class="hover-line" x1="0" x2="0" y1="' + Tp + '" y2="' + (H - B) + '" style="stroke:var(--text2)" stroke-width="1" opacity="0"/>';
    s += '<rect class="hit" x="' + L + '" y="' + Tp + '" width="' + (W - L - R) + '" height="' + (H - Tp - B) + '" fill="transparent"/></svg>';
    var legend = o.legend === false || o.series.length < 2 ? "" : '<div class="legend">' + o.series.map(function (se) {
      return '<span><i style="background:' + se.color + '"></i>' + esc(se.name) + "</span>";
    }).join("") + "</div>";
    el.classList.add("chart");
    el.innerHTML = legend + s + '<div class="tip"></div>';
    var svg = el.querySelector("svg"), tip = el.querySelector(".tip"), hl = el.querySelector(".hover-line");
    var xsAll = []; o.series[0].data.forEach(function (p) { xsAll.push(p[0]); });
    function move(ev) {
      var r = svg.getBoundingClientRect(), cx = (ev.touches ? ev.touches[0].clientX : ev.clientX);
      var vx = (cx - r.left) / r.width * W;
      var xv = x0 + (vx - L) / (W - L - R) * (x1 - x0);
      var best = xsAll[0], bd = Infinity;
      xsAll.forEach(function (x) { var dd = Math.abs(x - xv); if (dd < bd) { bd = dd; best = x; } });
      var lines = o.series.map(function (se) {
        var p = se.data.find(function (q) { return q[0] === best; });
        return p && isFinite(p[1]) ? '<span style="color:' + se.color + '">●</span> ' + esc(se.name) + ": <b>" + esc((o.tipFmt || yF)(p[1])) + "</b>" : "";
      }).filter(Boolean);
      if (!lines.length) return;
      tip.innerHTML = "<b>" + esc(xF(best)) + "</b><br>" + lines.join("<br>");
      var px = sx(best) / W * r.width;
      tip.style.left = Math.max(70, Math.min(r.width - 70, px)) + "px"; tip.style.top = ((Tp + 6) / H * r.height + (legend ? 28 : 0)) + "px";
      tip.classList.add("show"); hl.setAttribute("x1", sx(best)); hl.setAttribute("x2", sx(best)); hl.setAttribute("opacity", ".5");
    }
    var hit = el.querySelector(".hit");
    hit.addEventListener("mousemove", move); hit.addEventListener("touchstart", move, { passive: true }); hit.addEventListener("touchmove", move, { passive: true });
    hit.addEventListener("mouseleave", function () { tip.classList.remove("show"); hl.setAttribute("opacity", "0"); });
  };
  /* opts: data:[{x,label,y,color}], yFmt, height, highlight:fn */
  function barLegend(o) {
    return Array.isArray(o.legend) && o.legend.length ? '<div class="legend">' + o.legend.map(function (g) { return '<span><i style="background:' + g.color + '"></i>' + esc(g.name) + "</span>"; }).join("") + "</div>" : "";
  }
  function hBarChart(el, o, W) {
    var n = o.data.length, rowH = 30, longL = Math.max.apply(null, o.data.map(function (d) { return String(d.label || "").length; }).concat([4])), L = Math.round(Math.min(W * 0.5, Math.max(90, longL * 6.2 + 14))), R = o.valueLabels ? 64 : 16, Tp = o.yTitle ? 24 : 8, H = Tp + n * rowH + 26;
    var ys = o.data.map(function (d) { return d.y; });
    var x0 = Math.min(0, Math.min.apply(null, ys)), x1 = Math.max(0, Math.max.apply(null, ys));
    var ticks = niceTicks(x0, x1, 3); x0 = ticks[0]; x1 = ticks[ticks.length - 1];
    var sx = function (x) { return L + (x - x0) / ((x1 - x0) || 1) * (W - L - R); };
    var yF = o.yFmt || function (v) { return String(v); };
    var s = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(o.label || "Bar chart") + '"><g class="grid">';
    ticks.forEach(function (t) { s += '<line x1="' + sx(t) + '" x2="' + sx(t) + '" y1="' + Tp + '" y2="' + (H - 22) + '"/>'; });
    s += '</g><g class="axis">';
    ticks.forEach(function (t, k) { if (!(k === 0 || k === ticks.length - 1 || t === 0)) return; if (t === 0 && k > 0 && k < ticks.length - 1 && (sx(0) - sx(ticks[0]) < 46 || sx(ticks[ticks.length - 1]) - sx(0) < 46)) return; s += '<text x="' + sx(t) + '" y="' + (H - 6) + '" text-anchor="' + (k === 0 ? "start" : k === ticks.length - 1 ? "end" : "middle") + '">' + esc(yF(t)) + "</text>"; });
    if (o.yTitle) s += '<text class="axis-title" x="' + L + '" y="' + (Tp - 10) + '" text-anchor="start">' + esc(o.yTitle) + "</text>";
    var maxCh = Math.floor((L - 10) / 6.2), lastLab = "";
    o.data.forEach(function (d, i) {
      var cy = Tp + i * rowH + rowH / 2, lab = String(d.label || "");
      if (!lab && d.tip) lab = ""; if (lab) lastLab = lab;
      if (lab.length > maxCh) lab = lab.slice(0, maxCh - 1) + "\u2026";
      s += '<text x="' + (L - 8) + '" y="' + (cy + 4) + '" text-anchor="end">' + esc(lab) + "</text>";
    });
    s += "</g>";
    o.data.forEach(function (d, i) {
      var cy = Tp + i * rowH + rowH / 2, a = sx(Math.min(0, d.y)), b = sx(Math.max(0, d.y));
      var col = d.color || (d.y >= 0 ? "var(--s2)" : "var(--s5)");
      s += '<rect data-i="' + i + '" x="' + a.toFixed(1) + '" y="' + (cy - 9) + '" width="' + Math.max(1, b - a).toFixed(1) + '" height="18" rx="3" style="fill:' + col + '"' + (d.dim ? ' opacity=".35"' : "") + "/>";
      if (o.valueLabels) s += '<text x="' + (W - 4) + '" y="' + (cy + 4) + '" text-anchor="end" class="svg-t" font-size="11" font-weight="700">' + esc(yF(d.y)) + "</text>";
    });
    if (x0 < 0) s += '<line class="zero" x1="' + sx(0) + '" x2="' + sx(0) + '" y1="' + Tp + '" y2="' + (H - 22) + '"/>';
    s += "</svg>";
    el.classList.add("chart");
    el.innerHTML = barLegend(o) + s + '<div class="tip"></div>';
    var tip = el.querySelector(".tip"), svg = el.querySelector("svg");
    el.querySelectorAll("rect[data-i]").forEach(function (rc) {
      function sh() { var d = o.data[Number(rc.getAttribute("data-i"))], r = svg.getBoundingClientRect(), bb = rc.getBoundingClientRect();
        tip.innerHTML = "<b>" + esc(d.tip || d.label) + "</b><br>" + esc((o.tipFmt || yF)(d.y)); tip.style.left = Math.max(60, Math.min(r.width - 60, bb.right - r.left)) + "px"; tip.style.top = (bb.top - el.getBoundingClientRect().top) + "px"; tip.classList.add("show"); }
      rc.addEventListener("mouseenter", sh); rc.addEventListener("touchstart", sh, { passive: true }); rc.addEventListener("mouseleave", function () { tip.classList.remove("show"); });
    });
  }
  INV.barChart = function (el, o) {
    el.__chart = ["bar", o];
    var Wn = chartWidth(el, o);
    if (!o.width && Wn < 520 && o.data.length <= 16 && (o.allLabels || o.data.length <= 8)) {
      var longest = Math.max.apply(null, o.data.map(function (d) { return String(d.label || "").length; }).concat([1]));
      if (longest * 6.3 > (Wn - 56) / o.data.length * 0.92 && !o.data.some(function (d) { return d.label === ""; })) return hBarChart(el, o, Wn);
    }
    var W = Wn, H = o.height || 260, L = o.left || 56, R = 12, Tp = (o.valueLabels || o.yTitle) ? 28 : 14, B = o.xTitle ? 44 : 30;
    var ys = o.data.map(function (d) { return d.y; });
    var y0 = Math.min(0, Math.min.apply(null, ys)), y1 = Math.max(0, Math.max.apply(null, ys));
    var ticks = niceTicks(y0, y1, o.yTicks || 5);
    if (o.valueLabels && ticks[0] < 0 && ticks.length > 1) { var stp = ticks[1] - ticks[0], mn = Math.min.apply(null, ys); if (mn - ticks[0] < stp * 0.35) ticks.unshift(ticks[0] - stp); }
    y0 = ticks[0]; y1 = ticks[ticks.length - 1];
    var n = o.data.length, bw = (W - L - R) / n;
    var every = Math.max(1, Math.ceil(n / Math.min(o.maxLabels || 12, Math.max(3, Math.floor((W - L - R) / 44)))));
    var shown = o.data.filter(function (d, i) { return o.allLabels || i % every === 0; });
    var maxLen = Math.max.apply(null, shown.map(function (d) { return String(d.label).length; }).concat([1]));
    var rot = maxLen * 6.3 > (o.allLabels ? bw : bw * every) * 0.92;
    if (rot && bw * every < 20 && !o.data.some(function (d) { return d.label === ""; })) { every = Math.ceil(20 / bw); o = Object.assign({}, o, { allLabels: false }); }
    if (rot) { var extraB = Math.min(70, Math.round(maxLen * 4.6)); B += extraB; H += extraB; var needL = Math.round(maxLen * 5.1 - bw / 2); if (needL > L) { L = needL; bw = (W - L - R) / n; } }
    var sy = function (y) { return Tp + (y1 - y) / ((y1 - y0) || 1) * (H - Tp - B); };
    var yF = o.yFmt || function (v) { return String(v); };
    var s = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(o.label || "Bar chart") + '"><g class="grid">';
    ticks.forEach(function (t) { s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + sy(t) + '" y2="' + sy(t) + '"/>'; });
    s += '</g><g class="axis">';
    ticks.forEach(function (t) { s += '<text x="' + (L - 8) + '" y="' + (sy(t) + 4) + '" text-anchor="end">' + esc(yF(t)) + "</text>"; });
    o.data.forEach(function (d, i) {
      if (!(i % every === 0 || o.allLabels)) return;
      var lx = L + bw * i + bw / 2, ly = H - B + 16;
      s += rot ? '<text x="' + lx + '" y="' + (ly - 4) + '" text-anchor="end" transform="rotate(-38 ' + lx + " " + (ly - 4) + ')">' + esc(d.label) + "</text>"
        : '<text x="' + lx + '" y="' + ly + '" text-anchor="middle">' + esc(d.label) + "</text>";
    });
    if (o.xTitle) s += '<text class="axis-title" x="' + ((L + W - R) / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(o.xTitle) + "</text>";
    if (o.yTitle) s += '<text class="axis-title" x="' + (L - 8) + '" y="' + (Tp - 14) + '" text-anchor="start">' + esc(o.yTitle) + "</text>";
    s += "</g>";
    o.data.forEach(function (d, i) {
      var yA = sy(Math.max(0, d.y)), yB = sy(Math.min(0, d.y));
      var col = d.color || (d.y >= 0 ? "var(--s2)" : "var(--s5)");
      s += '<rect data-i="' + i + '" x="' + (L + bw * i + bw * 0.12).toFixed(1) + '" y="' + yA.toFixed(1) + '" width="' + (bw * 0.76).toFixed(1) + '" height="' + Math.max(1, yB - yA).toFixed(1) + '" rx="' + Math.min(3, bw * 0.2) + '" style="fill:' + col + '"' + (d.dim ? ' opacity=".35"' : "") + "/>";
      if (o.valueLabels && bw >= 22) s += '<text x="' + (L + bw * i + bw / 2) + '" y="' + (d.y >= 0 ? yA - 5 : yB + 13) + '" text-anchor="middle" class="svg-t" font-size="' + (bw >= 34 ? 11 : 9.5) + '" font-weight="700">' + esc(yF(d.y)) + "</text>";
    });
    if (y0 < 0) s += '<line class="zero" x1="' + L + '" x2="' + (W - R) + '" y1="' + sy(0) + '" y2="' + sy(0) + '"/>';
    s += "</svg>";
    el.classList.add("chart");
    el.innerHTML = barLegend(o) + s + '<div class="tip"></div>';
    var tip = el.querySelector(".tip"), svg = el.querySelector("svg");
    el.querySelectorAll("rect[data-i]").forEach(function (rc) {
      function sh() {
        var d = o.data[Number(rc.getAttribute("data-i"))], r = svg.getBoundingClientRect(), b = rc.getBoundingClientRect();
        tip.innerHTML = "<b>" + esc(d.tip || d.label) + "</b><br>" + esc((o.tipFmt || yF)(d.y));
        tip.style.left = Math.max(60, Math.min(r.width - 60, b.left - r.left + b.width / 2)) + "px"; tip.style.top = (b.top - r.top) + "px"; tip.classList.add("show");
      }
      rc.addEventListener("mouseenter", sh); rc.addEventListener("touchstart", sh, { passive: true });
      rc.addEventListener("mouseleave", function () { tip.classList.remove("show"); });
    });
  };

  /* ---------- Re-render charts at their real width when shown or resized ---------- */
  function rerender(scope) {
    (scope || document).querySelectorAll(".chart").forEach(function (el) {
      if (!el.__chart || !el.offsetParent) return;
      var w = el.clientWidth; if (Math.abs((el.__w || 0) - w) < 8) return; el.__w = w;
      (el.__chart[0] === "bar" ? INV.barChart : INV.lineChart)(el, el.__chart[1]);
    });
  }
  INV.rerender = rerender;
  document.addEventListener("inv-show", function (e) { setTimeout(function () { rerender(e.target); }, 0); });
  var rsT = null; window.addEventListener("resize", function () { clearTimeout(rsT); rsT = setTimeout(function () { rerender(document); }, 150); });
  INV.ready(function () { setTimeout(function () { rerender(document); }, 30); });
  /* narrow screens: static diagrams scroll sideways at a readable size; show a cue when they do */
  function scrollCues() { document.querySelectorAll(".fig-scroll").forEach(function (f) { f.classList.toggle("scrolls", f.scrollWidth > f.clientWidth + 4); }); }
  INV.ready(function () { setTimeout(scrollCues, 60); }); window.addEventListener("resize", function () { setTimeout(scrollCues, 160); });
  document.addEventListener("inv-show", function () { setTimeout(scrollCues, 30); });
  INV.ready(function () { document.querySelectorAll(".fig-scroll").forEach(function (f) { f.setAttribute("tabindex", "0"); f.setAttribute("role", "region"); var t = f.closest(".fig"); var ttl = t && t.querySelector(".fig-title"); f.setAttribute("aria-label", (ttl ? ttl.textContent : "Diagram") + " (scrolls sideways on small screens)"); }); });

  /* ---------- Historical data helpers ---------- */
  INV.hist = function () {
    var D = window.INV_RETURNS; if (!D) return null;
    var out = {}; D.cols.forEach(function (c, i) { out[c] = D.rows.map(function (r) { return r[i]; }); });
    out.rows = D.rows; out.first = D.rows[0][0]; out.last = D.rows[D.rows.length - 1][0];
    return out;
  };
  INV.cagr = function (rets) { var g = 1; rets.forEach(function (r) { g *= 1 + r / 100; }); return (Math.pow(g, 1 / rets.length) - 1) * 100; };

})();
