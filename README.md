# IT Strategy Diagnostic

Benchmark your IT spending, staffing, and investment posture against **Gartner 2026 industry peers** across 15 industries with full percentile distributions (P10–P90).

## Use It Now (No Install)

**Hosted version**: **https://it-stratagy.vercel.app**

To deploy your own: click the button below, or see [Vercel Deploy](#deploy-to-vercel).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbrigittecoles%2FIT-Stratagy)

---

## Quick Start Options

### Option 1: AI Agent Setup (Recommended)

Paste this prompt into **Claude Code**, **Codex**, or any AI coding agent:

> Clone https://github.com/brigittecoles/IT-Stratagy.git, install dependencies with `npm install` in both the root and the `mcp-server/` folder, then start the dev server with `npm run dev`. Open http://localhost:3456 in my browser.

That's it. The AI handles everything.

### Option 2: Double-Click Setup (Mac/Windows)

1. **Download**: [Download ZIP](https://github.com/brigittecoles/IT-Stratagy/archive/refs/heads/main.zip)
2. **Unzip** the folder
3. **Double-click**:
   - **Mac**: `setup.command`
   - **Windows**: `setup.bat`
4. Your browser opens automatically

> The scripts auto-install [Bun](https://bun.sh) (a fast JavaScript runtime) if you don't have Node.js — no admin access required.

### Option 3: Manual Terminal Setup

```bash
git clone https://github.com/brigittecoles/IT-Stratagy.git
cd IT-Stratagy
npm install
cd mcp-server && npm install && cd ..
npm run dev
# Open http://localhost:3456
```

---

## What It Does

| Step | What Happens |
|------|-------------|
| **Intake** | Enter company data via Form, Wizard, or Spreadsheet Upload |
| **Resolve** | Canonicalizes inputs, detects diagnostic level |
| **Benchmark** | Matches against Gartner 2026 data (15 industries, size bands) |
| **Analyze** | Computes KPIs, gaps, workforce metrics, transformation impact |
| **Narrate** | Generates executive narrative with confidence scores |
| **Export** | Executive Summary, Full 10-Sheet Report, Chain of Thought audit |

### Diagnostic Levels

| Level | Data Required |
|-------|--------------|
| Quick Read | Company name, industry, revenue, IT spend |
| Standard | + OpEx/CapEx split, headcount, IT FTEs |
| Full Diagnostic | + detailed spreadsheet upload |
| Full + Vendor + Roadmap | + vendor file AND roadmap file |

---

## AI-Powered Analysis (MCP)

For conversational AI analysis, connect the **MCP server** to Claude:

### Claude Code (auto-configures)

Open Claude Code from inside the repo folder. The `.mcp.json` auto-connects 14 tools.

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "it-strategy-diagnostic": {
      "command": "npx",
      "args": ["tsx", "/FULL/PATH/TO/IT-Stratagy/mcp-server/src/index.ts"]
    }
  }
}
```

### MCP Tools (14)

| Tool | Purpose |
|------|---------|
| `setup_guide` | Interactive setup walkthrough |
| `check_port` | Find available ports |
| `get_benchmarks` | Query Gartner 2026 benchmarks |
| `create_analysis` | Start a new analysis |
| `submit_intake` | Add financial/workforce/transformation data |
| `check_qualification` | Check diagnostic level qualification |
| `run_analysis` | Execute the full analysis pipeline |
| `get_results` | Get completed results |
| `list_analyses` | List all analyses |
| `get_analysis_detail` | Full analysis with intake data |
| `export_summary` | Markdown executive summary |
| `generate_report` | 10-sheet report with calculations |
| `get_report_template` | Report template structure |
| `get_chain_of_thought` | Full reasoning audit trail |

---

## Deploy to Vercel

The fastest way to get a hosted version:

1. Fork this repo
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your fork
4. Click Deploy

Or use the CLI:
```bash
npx vercel
```

---

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Engine**: 15-node computation pipeline (Gartner benchmarks, gap analysis, narrative)
- **MCP Server**: 14 tools via stdio transport
- **Charts**: Recharts
- **Validation**: Zod

## Requirements

| Component | Requires |
|-----------|----------|
| Web UI | Node.js v24+ **or** Bun |
| MCP Server | Node.js v24+ **or** Bun |
| One-click setup | Nothing pre-installed |
| Vercel deploy | Nothing (cloud-hosted) |

## License

Private — Brigitte Coles
