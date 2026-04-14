# IT Strategy Diagnostic — Setup Guide

Two components:
1. **Web UI** — visual intake forms and results dashboard (localhost)
2. **MCP Server** — how Claude runs analyses (Claude Code / Claude Desktop)

---

## 1. Web UI (localhost)

### Quick start

```bash
git clone https://github.com/brigittecoles/IT-Stratagy.git
cd IT-Stratagy
npm install
npm run dev
```

Open [http://localhost:3456](http://localhost:3456) in your browser.

### Custom port

If port 3456 is already in use:

```bash
PORT=4567 npm run dev
# → http://localhost:4567
```

### Production build (optional)

```bash
npm run launch
# Builds + serves → http://localhost:3456
```

---

## 2. MCP Server Setup (Claude Code / Claude Desktop)

### From the repo (recommended)

```bash
cd IT-Stratagy
cd mcp-server && npm install && cd ..
```

The `.mcp.json` in the repo root auto-configures Claude Code. Open a Claude Code session in this directory — the 14 MCP tools are immediately available.

Verify:
```
/mcp
# Should show: • it-strategy-diagnostic: connected (14 tools)
```

### Claude Desktop setup

Add to your config file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

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

Restart Claude Desktop after saving.

### Via npx (after npm publish)

Once published to your org's npm registry, teammates only need this config:

```json
{
  "mcpServers": {
    "it-strategy-diagnostic": {
      "command": "npx",
      "args": ["-y", "it-strategy-mcp-server"]
    }
  }
}
```

To publish: `cd mcp-server && npm publish`

---

## Guided Setup (for non-technical users)

If you're helping a teammate set up via Claude, just tell Claude:

```
Run setup_guide
```

This will automatically:
- Check if Node.js and npm are installed
- Verify the correct versions
- Test if the default port is available
- Suggest an alternative port if needed
- Provide step-by-step terminal commands

You can also check a specific port:
```
Run check_port with port 3456
```

---

## Running an Analysis (MCP Workflow)

Once the MCP server is connected, tell Claude:

```
1. create_analysis({ company_name: "Acme Corp", industry_gics_group: "Health Care" })
2. submit_intake({ analysis_id: "...", revenue: 505000000, total_it_spend: 18400000, ... })
3. run_analysis({ analysis_id: "..." })
4. generate_report({ analysis_id: "..." })
5. get_chain_of_thought({ analysis_id: "...", format: "markdown" })
```

See CLAUDE.md for the full tool reference and workflow.

---

## Requirements

| Component | Requires |
|-----------|----------|
| Web UI | Node.js v24+ |
| MCP Server | Node.js v24+ |

## MCP Tools Reference (14 tools)

| Tool | Purpose |
|------|---------|
| `setup_guide` | Interactive setup for new users — checks prereqs, ports, provides instructions |
| `check_port` | Check if a port is available, suggests alternatives if not |
| `get_benchmarks` | Query Gartner 2026 benchmarks (15 industries, P10-P90) |
| `create_analysis` | Start a new analysis |
| `submit_intake` | Add financial, workforce, transformation data |
| `check_qualification` | Check diagnostic level qualification |
| `run_analysis` | Execute the full analysis pipeline |
| `get_results` | Get completed results |
| `list_analyses` | List all analyses |
| `get_analysis_detail` | Get full analysis with intake data |
| `export_summary` | Markdown executive summary |
| `generate_report` | 10-sheet report with calculations & narrative guidance |
| `get_report_template` | Report template structure (slots, sections) |
| `get_chain_of_thought` | Full reasoning audit trail (JSON or markdown) |
