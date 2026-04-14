# Flight Plan: IT Strategy Diagnostic Platform
**Filed**: 2026-04-14
**Destination**: Full-stack IT Strategy Diagnostic application with MCP server — intake, math engine, benchmarks, narrative, export
**Domain**: product (consulting-grade diagnostic tool)

## Architecture Decision

**Stack**: Next.js 15 (App Router) + TypeScript + Supabase (Postgres + Edge Functions) + MCP Server (TypeScript, stdio)
**Why**:
- Next.js gives us the multi-page intake flow (Form/Wizard/File Drop), server actions for processing, and API routes for the MCP server to call
- Supabase provides Postgres for the canonical data model, file storage for uploads, and edge functions for compute-heavy math
- MCP server exposes the analysis engine as tools that any AI agent can call
- Single TypeScript codebase across all layers

## Route Overview

```
M1 (Foundation) → M2 (Data Model) → M3 (Intake UI) → M4 (Canonical Resolver)
                                                              ↓
M5 (Math Engine) ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
       ↓
M6 (Benchmark Library + Comparison)
       ↓
M7 (Narrative + Results UI)
       ↓
M8 (MCP Server)
       ↓
M9 (Export + Polish)
```

## Milestone Details

---

### Milestone 1: Project Foundation
**Scope**: Scaffold Next.js 15 app, configure Supabase project, set up TypeScript, Tailwind, shadcn/ui, project structure
**Strategy**: haiku-draft (boilerplate scaffolding)
**Model**: Sonnet
**Complexity**: Low
**Token Estimate**: Small

**Creates**:
- `/package.json`, `/tsconfig.json`, `/next.config.ts`
- `/src/app/layout.tsx`, `/src/app/page.tsx`
- `/src/lib/supabase/client.ts`, `/src/lib/supabase/server.ts`
- `/src/components/ui/` (shadcn primitives)
- `/supabase/` directory structure

**Exit criteria**: `npm run dev` starts, homepage renders, Supabase client connects

---

### Milestone 2: Data Model + Schema
**Scope**: Design and create Postgres schema implementing the canonical data model from specs. Tables for analyses, fiscal_years, company_profiles, file_uploads, benchmark_families, benchmark_metrics, complexity_overlays, opportunity_results, qa_checks
**Strategy**: spec-first (schema is fully defined in the Product Dict and Math Benchmark specs)
**Model**: Opus for schema design
**Complexity**: Medium
**Token Estimate**: Medium

**Creates**:
- `/supabase/migrations/001_initial_schema.sql`
- `/src/lib/db/types.ts` (generated TypeScript types)
- `/src/lib/db/queries.ts` (typed query helpers)
- `/src/lib/schema/validation.ts` (Zod schemas matching field dictionary)
- `/src/lib/schema/value-lists.ts` (controlled value enums)

**Exit criteria**: All tables created, TypeScript types generated, Zod validation passes for all field dictionary entries

**Key design decisions**:
- `analyses` table: one row per analysis run
- `fiscal_years` table: one row per year per analysis (year-indexed fields)
- `company_profiles` table: one row per analysis (company-level fields)
- `file_uploads` table: one row per uploaded file
- `canonical_values` view: joins company_profile + fiscal_years for resolved output
- `benchmark_families` + `benchmark_metrics`: seeded with industry data
- `qa_results` table: stores per-run QA check results

---

### Milestone 3: Intake UI — Form, Wizard, File Drop
**Scope**: Build the 3 intake modes as a multi-step flow. Simple Form (direct entry), Guided Wizard (conversational), File Drop (4 zones with parsing). All write to the same backend schema.
**Strategy**: sprint-sequential (UI pages build on shared components)
**Secondary**: human-in-the-loop (UX decisions on wizard flow)
**Model**: Sonnet for components, Opus for flow logic
**Complexity**: High
**Token Estimate**: Large

**Creates**:
- `/src/app/analysis/new/page.tsx` — mode selector (S0)
- `/src/app/analysis/[id]/form/page.tsx` — Simple Form (A1-A5)
- `/src/app/analysis/[id]/wizard/page.tsx` — Guided Wizard (B1-B7)
- `/src/app/analysis/[id]/upload/page.tsx` — File Drop (C1-C4)
- `/src/components/intake/` — shared form components
  - `CompanyProfileForm.tsx`
  - `FinancialBaselineForm.tsx`
  - `WorkforceForm.tsx`
  - `TransformationForm.tsx`
  - `ComplexityForm.tsx`
  - `FileDropZone.tsx`
  - `WizardStep.tsx`
- `/src/lib/intake/actions.ts` — server actions for saving intake data
- `/src/lib/intake/file-parser.ts` — file upload parsing logic

**Exit criteria**: All 3 intake modes save data to Supabase, file uploads store to Supabase Storage, extracted values appear in staging table

---

### Milestone 4: Canonical Resolver + Review + Qualification
**Scope**: Implement the canonical resolution logic (source precedence, conflict detection), Review Matrix UI, and Qualification gate
**Strategy**: spec-first (mapping rules are defined in spec sheet 11)
**Model**: Opus
**Complexity**: Medium
**Token Estimate**: Medium

**Creates**:
- `/src/lib/resolver/canonical.ts` — resolution engine (Best Available logic)
- `/src/lib/resolver/conflicts.ts` — conflict detection and flagging
- `/src/lib/resolver/qualification.ts` — diagnostic level determination
- `/src/app/analysis/[id]/review/page.tsx` — Review Matrix (D1)
- `/src/app/analysis/[id]/qualification/page.tsx` — Qualification (D2)
- `/src/app/analysis/[id]/assumptions/page.tsx` — Assumptions Review (D3)
- `/src/app/analysis/[id]/confirm/page.tsx` — Pre-run confirmation (D4)
- `/src/components/review/ReviewMatrix.tsx`
- `/src/components/review/QualificationCard.tsx`

**Exit criteria**: Canonical resolver picks correct source per preference, conflicts flagged, qualification level calculated correctly for all 4 tiers

---

### Milestone 5: Math Engine (N04-N08)
**Scope**: Implement the core computation nodes: KPI math, YoY math, transformation attribution, workforce/sourcing math, vendor/tower math
**Strategy**: sprint-sequential (each node depends on canonical data)
**Model**: Opus (math precision matters)
**Complexity**: High
**Token Estimate**: Large

**Creates**:
- `/src/lib/engine/pipeline.ts` — orchestrator that runs N00-N14
- `/src/lib/engine/n00-load.ts` — Load canonical record
- `/src/lib/engine/n01-readiness.ts` — Math readiness gate
- `/src/lib/engine/n04-core-kpi.ts` — Core KPI math
- `/src/lib/engine/n05-yoy.ts` — Year-over-year math
- `/src/lib/engine/n06-transformation.ts` — Transformation attribution
- `/src/lib/engine/n07-workforce.ts` — Workforce + sourcing math
- `/src/lib/engine/n08-vendor.ts` — Vendor + tower math
- `/src/lib/engine/types.ts` — shared types for engine outputs

**Exit criteria**: Each engine node produces correct output for test data, suppress-if logic works (missing fields skip metrics), pipeline runs nodes in sequence

---

### Milestone 6: Benchmark Library + Comparison + Gap + Opportunity (N02-N03, N09-N11)
**Scope**: Seed benchmark data, implement benchmark comparison, complexity adjustment, gap attribution, and opportunity sizing
**Strategy**: spec-first + sprint-sequential
**Model**: Opus
**Complexity**: High
**Token Estimate**: Large

**Creates**:
- `/src/lib/engine/n02-benchmark-select.ts` — Benchmark family selector
- `/src/lib/engine/n03-complexity.ts` — Complexity weighting engine
- `/src/lib/engine/n09-benchmark-compare.ts` — Benchmark comparison
- `/src/lib/engine/n10-gap-attribution.ts` — Gap decomposition
- `/src/lib/engine/n11-opportunity.ts` — Opportunity math (5 modules)
- `/src/lib/benchmarks/seed-data.ts` — Industry benchmark seed values
- `/supabase/migrations/002_benchmark_seed.sql` — Seed data migration

**Exit criteria**: Benchmark comparison produces gap % and gap $ for each metric, complexity adjustment modifies interpretation, opportunity modules return low/base/high cases

---

### Milestone 7: QA + Narrative + Results UI (N12-N14)
**Scope**: QA engine, confidence roll-up, narrative generation, and the results display pages
**Strategy**: sprint-sequential
**Model**: Opus for narrative logic, Sonnet for UI
**Complexity**: Medium-High
**Token Estimate**: Large

**Creates**:
- `/src/lib/engine/n12-qa.ts` — QA checks + confidence roll-up
- `/src/lib/engine/n13-narrative.ts` — Narrative generator
- `/src/lib/engine/n14-output.ts` — Output packager
- `/src/app/analysis/[id]/results/page.tsx` — Results overview (F1)
- `/src/app/analysis/[id]/results/findings/page.tsx` — Key findings (F2)
- `/src/app/analysis/[id]/results/recommendations/page.tsx` — Recommendations (F3)
- `/src/app/analysis/[id]/results/caveats/page.tsx` — Caveats (F4)
- `/src/components/results/SummaryCard.tsx`
- `/src/components/results/BenchmarkChart.tsx`
- `/src/components/results/OpportunityTable.tsx`
- `/src/components/results/ConfidenceBadge.tsx`

**Exit criteria**: Full analysis pipeline runs end-to-end, results pages display summary, findings, recommendations, caveats with confidence levels

---

### Milestone 8: MCP Server
**Scope**: Build a TypeScript MCP server that exposes the analysis engine as tools: create_analysis, submit_intake, resolve_canonical, run_analysis, get_results, export_report
**Strategy**: spec-first (MCP protocol is well-defined)
**Model**: Sonnet
**Complexity**: Medium
**Token Estimate**: Medium

**Creates**:
- `/mcp-server/package.json`
- `/mcp-server/src/index.ts` — MCP server entry point
- `/mcp-server/src/tools/create-analysis.ts`
- `/mcp-server/src/tools/submit-intake.ts`
- `/mcp-server/src/tools/resolve-canonical.ts`
- `/mcp-server/src/tools/run-analysis.ts`
- `/mcp-server/src/tools/get-results.ts`
- `/mcp-server/src/tools/export-report.ts`
- `/mcp-server/src/tools/list-analyses.ts`

**Exit criteria**: MCP server starts, tools are discoverable, full analysis can be run through MCP tool calls alone

---

### Milestone 9: Export + Polish
**Scope**: PDF/Excel export, dashboard polish, responsive design, error states, loading states
**Strategy**: sprint-sequential
**Model**: Sonnet
**Complexity**: Medium
**Token Estimate**: Medium

**Creates**:
- `/src/lib/export/pdf.ts` — PDF generation
- `/src/lib/export/excel.ts` — Excel workbook export
- `/src/app/analysis/[id]/export/page.tsx` — Export center (F5)
- `/src/app/dashboard/page.tsx` — Analysis list/dashboard
- Various UI polish across all pages

**Exit criteria**: PDF and Excel exports generate correctly, dashboard lists analyses, all pages handle loading/error/empty states

---

## Parallel Groups

**Group A** (can run in parallel after M2):
- None — this is a sequential build where each milestone depends on the previous

**Sequential Chain** (primary path):
M1 → M2 → M3 → M4 → M5 → M6 → M7 → M8 → M9

Note: M8 (MCP Server) could potentially start after M5 with stub data, but for clean integration it should follow M7.

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Benchmark seed data quality | High — bad benchmarks = bad analysis | Use well-documented industry sources; mark all benchmarks with source and version |
| File parsing complexity | Medium — Excel/CSV parsing is error-prone | Start with structured format support; add AI-assisted parsing later |
| Supabase cold starts | Low — edge functions may be slow | Use server actions for critical path; edge functions for compute-heavy math |
| Narrative quality | Medium — template-based narratives can feel robotic | Design modular narrative blocks; allow AI enhancement via MCP |
| Scope creep on UI | High — intake flow is complex | Stay faithful to the 08_MCP_AI_Flow screen map; don't add screens |

## Optimization Summary

| Milestone | Strategy | Model | Complexity | Token Estimate |
|-----------|----------|-------|------------|----------------|
| M1: Foundation | haiku-draft | Sonnet | Low | Small |
| M2: Data Model | spec-first | Opus | Medium | Medium |
| M3: Intake UI | sprint-sequential | Sonnet/Opus | High | Large |
| M4: Resolver + Review | spec-first | Opus | Medium | Medium |
| M5: Math Engine | sprint-sequential | Opus | High | Large |
| M6: Benchmarks + Gaps | spec-first | Opus | High | Large |
| M7: QA + Narrative + Results | sprint-sequential | Opus/Sonnet | Medium-High | Large |
| M8: MCP Server | spec-first | Sonnet | Medium | Medium |
| M9: Export + Polish | sprint-sequential | Sonnet | Medium | Medium |

**Total estimated sessions**: 4-6 focused `/takeoff` sessions
- Session 1: M1 + M2
- Session 2: M3 + M4
- Session 3: M5 + M6
- Session 4: M7
- Session 5: M8 + M9
- Session 6: Integration testing + fixes
