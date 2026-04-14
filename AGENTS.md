# IT Strategy Diagnostic — Agent Instructions

> This file is read automatically by AI coding agents (Codex, Claude Code, Copilot, etc.)

## What This Project Is

A full-stack IT Strategy Diagnostic platform that benchmarks a company's IT spending, staffing, and investment posture against Gartner 2026 industry benchmarks (15 industries, P10–P90 distributions).

## Setup (run these commands — no user interaction needed)

```bash
# 1. Install dependencies (both root and MCP server)
cd /Users/bcoles/IT-Stratagy || cd IT-Stratagy || true
npm install
cd mcp-server && npm install && cd ..

# 2. Start the dev server (background)
npm run dev &

# 3. The app is now running at http://localhost:3456
```

If `npm` is not available, use `bun`:
```bash
bun install
cd mcp-server && bun install && cd ..
bun run dev &
```

## How to Run an Analysis via MCP Tools

If you have MCP tools connected (Claude Code auto-connects via `.mcp.json`):

1. `create_analysis({ company_name: "Acme Corp", industry_gics_group: "Health Care" })`
2. `submit_intake({ analysis_id: "<id>", revenue: 500000000, total_it_spend: 18000000, ... })`
3. `run_analysis({ analysis_id: "<id>" })`
4. `get_results({ analysis_id: "<id>" })`
5. `export_summary({ analysis_id: "<id>" })` — markdown executive summary
6. `generate_report({ analysis_id: "<id>" })` — full 10-sheet report

## Key Files

- `mcp-server/src/index.ts` — MCP server with 14 tools (self-contained engine)
- `src/lib/engine/` — Analysis pipeline (15 computation nodes)
- `src/lib/benchmarks/` — Gartner 2026 benchmark database
- `src/lib/actions.ts` — Server actions for the Web UI
- `CLAUDE.md` — Detailed project documentation
- `SETUP.md` — User-facing setup guide

## Tech Stack

- Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- MCP server (stdio transport) with 14 tools
- Node.js v24+ or Bun
