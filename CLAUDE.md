# IT Strategy Diagnostic Platform

## Project Overview
Full-stack IT Strategy Diagnostic application with MCP server. Implements the complete flow:
**Intake → Canonical Resolver → Qualification → Math Engine → Benchmarks → Narrative → Export**

The primary way to run an analysis is through the **MCP server tools** — Claude or Codex calls the tools to create, populate, and run a diagnostic.

## How to Run an IT Strategy Analysis (MCP Flow)

The MCP server at `mcp-server/src/index.ts` exposes 12 tools. Here is the standard workflow:

### Step 1: Create the analysis
Call `create_analysis` with the company name and industry:
```
create_analysis({ company_name: "Acme Corp", industry_gics_group: "Health Care" })
→ Returns { id: "uuid-here" }
```

### Step 2: Submit intake data
Call `submit_intake` with financial, workforce, and transformation data:
```
submit_intake({
  analysis_id: "uuid-here",
  revenue: 505000000,
  total_it_spend: 18400000,
  it_opex_spend: 12900000,
  it_capex_spend: 5500000,
  employee_count: 1600,
  it_fte_count: 25,
  transformation_status: "Yes",
  transformation_type: ["ERP", "Cloud"],
  transformation_spend_estimate: 4700000,
  business_model: "Healthcare delivery",
  regulatory_complexity: "High",
  operating_complexity: "Moderate"
})
→ Returns qualified level and missing fields
```

You can call submit_intake multiple times to add data incrementally.
Use `fiscal_year_label: "Last Fiscal Year"` to add prior year data for YoY analysis.

### Step 3: Check qualification (optional)
```
check_qualification({ analysis_id: "uuid-here" })
→ Returns { level: "Standard Diagnostic", missing: [...] }
```

### Step 4: Run the analysis
```
run_analysis({ analysis_id: "uuid-here" })
→ Returns full results: KPIs, benchmark gaps, opportunities, narrative, QA checks
```

### Step 5: Get results or export
```
get_results({ analysis_id: "uuid-here" })
export_summary({ analysis_id: "uuid-here" })  → markdown executive summary
```

### Step 6: Generate the deliverable report
```
generate_report({ analysis_id: "uuid-here" })
→ Returns populated sections for all 10 report sheets with data, calculations, and narrative guidance

generate_report({ analysis_id: "uuid-here", sheets: ["1", "4"] })
→ Returns only Executive Summary and Benchmark Comparison sheets
```

### Step 7: Get the chain-of-thought audit trail
```
get_chain_of_thought({ analysis_id: "uuid-here" })
→ JSON: every input validated, calculation performed, benchmark compared

get_chain_of_thought({ analysis_id: "uuid-here", format: "markdown" })
→ Readable markdown with confidence badges (🟢🟡🔴) and step-by-step reasoning
```

### Step 0 (optional): Look up industry benchmarks
```
get_benchmarks({ industry: "banking" })
get_benchmarks({ industry: "all" })  → list all 15 industries
get_benchmarks({ industry: "Health Care", metric: "it_spend_pct_revenue" })
```

### Available Industries
**Specific (15)**: banking, insurance, energy, healthcare, retail, utilities, telecom,
transportation, chemicals, consumer-products, industrial-manufacturing, media,
professional-services, software, government

**GICS Groups (11, auto-mapped to specific)**: Energy, Materials, Industrials,
Consumer Discretionary, Consumer Staples, Health Care, Financials,
Information Technology, Communication Services, Utilities, Real Estate

### Complexity Levels
Low, Moderate, High (for regulatory_complexity, operating_complexity, pricing_premium_complexity)

### Transformation Status
Yes, No, Unsure

### Transformation Types
ERP, WMS, Cloud, Data, Cybersecurity, AI, CRM, Network, Infrastructure, Other

## Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Engine**: TypeScript computation pipeline (15 nodes: N00-N14)
- **MCP Server**: TypeScript MCP server with stdio transport (8 tools)
- **Charts**: Recharts
- **Validation**: Zod
- **Node version**: v24+ (use `node node_modules/next/dist/bin/next` instead of `npx next`)

## Key Architecture

### Data Model
- **Company-level fields**: stored once per analysis (company_name, industry, complexity)
- **Year-indexed fields**: stored per fiscal year using `fiscal_year_label` + `fiscal_year_order`
- **Bare field names**: `revenue`, `total_it_spend` (not `current_fy_revenue`)

### Engine Pipeline (src/lib/engine/)
N00 Load → N01 Readiness → N02 Benchmark Select → N03 Complexity → N04 Core KPI →
N05 YoY → N06 Transformation → N07 Workforce → N08 Vendor → N09 Benchmark Compare →
N10 Gap Attribution → N11 Opportunity → N12 QA → N13 Narrative → N14 Output

### Diagnostic Levels
1. **Quick Read**: company_name + industry + revenue + IT spend + transformation status
2. **Standard Diagnostic**: + OpEx, CapEx, employee count, IT FTEs
3. **Full Diagnostic**: + at least one detailed file
4. **Full + Vendor + Roadmap**: + vendor file AND roadmap file

### MCP Server Tools
| Tool | Purpose |
|------|---------|
| `get_benchmarks` | Query Gartner 2026 benchmarks by industry (15 industries, P10-P90, YoY, size bands) |
| `create_analysis` | Create a new analysis (company name + industry required) |
| `submit_intake` | Add financial, workforce, transformation, complexity data |
| `check_qualification` | See what diagnostic level the data qualifies for |
| `run_analysis` | Execute the full analysis pipeline |
| `get_results` | Retrieve completed analysis results |
| `list_analyses` | List all analyses in the session |
| `get_analysis_detail` | Get full analysis data including all intake |
| `export_summary` | Generate markdown executive summary |
| `generate_report` | Generate structured report with populated sections, calculations, and narrative guidance for all 10 sheets |
| `get_report_template` | Get the 10-sheet report template structure (slots, sections, narrative instructions) |
| `get_chain_of_thought` | Get the full chain-of-thought reasoning trace (audit trail of every calculation) |

## Commands
```bash
npm run dev          # Start Next.js dev server (port 3000)
npm run mcp          # Start MCP server on stdio
npm run build        # Production build
```

## File Structure
```
src/
  app/                    # Next.js App Router pages
    analysis/[id]/        # Form, Wizard, Review, Results pages
    dashboard/            # Analysis list
  components/
    intake/               # Form components (Company, Financial, Workforce, etc.)
    review/               # ReviewMatrix, QualificationCard
    results/              # SummaryCard, BenchmarkChart, OpportunityTable
    ui/                   # shadcn/ui primitives
  lib/
    schema/               # Zod validation + value lists (source of truth)
    engine/               # N00-N14 computation nodes + pipeline
    benchmarks/           # Gartner 2026 benchmark database (15 industries, full distributions)
    towers/               # IT Spend Tower taxonomy, definitions, and auto-classifier
    workforce/            # IT Role/Process Crosswalk, role classifier, RACI/FTE baselines
    report/               # Report generation: 10-sheet template definitions, chain-of-thought, narrative guidance
    resolver/             # Canonical resolver + qualification logic
    store.ts              # In-memory analysis store
    actions.ts            # Server actions (form submission, pipeline execution)
mcp-server/               # Standalone MCP server
  src/index.ts            # 12 MCP tools with self-contained analysis engine + Gartner benchmarks
```

## IT Spend Towers (Gartner-aligned)
8 standard towers for classifying vendor/app/service spend:
1. **Infrastructure & Operations** — Data centers, cloud IaaS/PaaS, compute, storage, monitoring
2. **Application Development & Support** — Custom dev, app maintenance, DevOps, integration
3. **Enterprise Applications** — ERP, CRM, SCM, HCM (packaged/SaaS business software)
4. **Security & Risk** — Cybersecurity, IAM, endpoint, SIEM, GRC, compliance
5. **Data & Analytics** — BI, data warehouse/lake, AI/ML, data governance
6. **End User Services** — Help desk, devices, collaboration, VDI, productivity suites
7. **Telecommunications** — WAN, LAN, SD-WAN, voice, UCaaS, contact center
8. **IT Management & Strategy** — ITSM, PMO, vendor mgmt, EA, FinOps, advisory

Auto-classifier in `src/lib/towers/tower-classifier.ts` maps vendors by:
- Known vendor name (150+ vendors pre-mapped, high confidence)
- Keyword matching on category/description (medium confidence)
- Fallback to Unassigned (low confidence, flagged for review)

## IT Role/Process Crosswalk (O*NET × APQC)
Source: **O*NET-SOC 30.2 × APQC PCF v7.3** (IT_Department_Role_Process_Crosswalk.xlsx)
- 16 IT role groups across 9 tiers mapped to 63 APQC L2 processes
- 98 role→process mappings with similarity scores, confidence, automability
- Automability range: 42.8 (IT Infrastructure) to 71.9 (Core IT Data/Analytics)

### IT Tiers (9 tiers)
1. **Core IT** — Software devs, DBAs, architects, data scientists, security analysts (SOC 15-1200, 15-2000)
2. **IT Management** — CIO/CTO/CISO, IT Directors, Operations Managers (SOC 11-1000, 11-3000)
3. **IT Business Ops** — Business Analysts, Project Managers, Financial Specialists (SOC 13-1000, 13-2000)
4. **IT Support/Admin** — Help desk, service desk, data entry, admin assistants (SOC 43-4000, 43-6000, 43-9000)
5. **IT-Adjacent Engineering** — Hardware/Systems/Network Engineers, Technicians (SOC 17-2000, 17-3000)
6. **IT Compliance/Legal** — IT audit, licensing, data privacy, contracts (SOC 23-2000)
7. **IT Content/Comms** — Technical writers, UX writers, IT communications (SOC 27-3000)
8. **IT Training** — IT trainers, LMS administrators (SOC 25-3000)
9. **IT Infrastructure** — Telecom installers, data center technicians, equipment repair (SOC 49-2000, 49-9000)

### Baseline RACI & FTE Load
All 98 crosswalk entries have derived RACI types and FTE Load % baselines:
- **RACI** derived from: tier type (mgmt→A, execution→R, advisory→C) + confidence adjustment + IT domain boost
- **FTE Load %** derived from: (similarity × confidence_weight) / total × coverage_cap
- Coverage caps: 40% (1 process) → 80% (12+ processes)
- Derivation logic in `src/lib/workforce/baseline-derivation.ts`

Auto-classifier in `src/lib/workforce/role-classifier.ts` maps job titles by:
- Exact title match against 100+ known IT titles (high confidence)
- Keyword scoring with 120+ weighted rules (medium confidence)
- Fallback to Core IT / Computer Occupations (low confidence, flagged for review)

## Benchmark Data
Source: **Gartner IT Key Metrics Data 2026** (IT_Spend_Benchmark_Database_2026_v5.xlsx)
- 15 industries with full percentile distributions (P10/P25/Median/P75/P90)
- YoY trends 2021-2026 for IT spend % revenue, % OpEx, and per employee
- Company size breakouts (<$250M to $10B+)
- Summary metrics: IT FTE %, Run/Grow/Transform split, OpEx/CapEx split
- All values stored as DECIMALS (0.066 = 6.6%) — no unit conversion needed

## Specs
Source specs are in ~/Downloads/:
- IT_Intake_Workbook_MCP_Flow_Spec_v2.md
- IT_Math_Benchmark_MCP_Flow_Spec_v2.md
- Product_Ready_Input_Dictionary_v2.xlsx
- IT_Intake_Workbook_MCP_Flow_v2.xlsx
- IT_Math_Benchmark_MCP_Flow_v2.xlsx
