# IT Strategy Diagnostic — Setup Guide

## Quickest Start (no technical knowledge needed)

### Mac
1. Download/clone the IT-Stratagy folder
2. In **Finder**, double-click **`setup.command`**
3. Your browser will open automatically

### Windows
1. Download/clone the IT-Stratagy folder
2. In **File Explorer**, double-click **`setup.bat`**
3. Your browser will open automatically

> These scripts automatically install a JavaScript runtime (Bun) if you don't have one — no admin access required.

---

## Manual Setup (Terminal)

### If you have npm (Node.js):
```bash
git clone https://github.com/brigittecoles/IT-Stratagy.git
cd IT-Stratagy
npm install
cd mcp-server && npm install && cd ..
npm run dev
# → http://localhost:3456
```

### If you have Bun:
```bash
git clone https://github.com/brigittecoles/IT-Stratagy.git
cd IT-Stratagy
bun install
cd mcp-server && bun install && cd ..
bun run dev
# → http://localhost:3456
```

### Don't have npm or Bun?

**Mac** — install Bun with one command:
```bash
curl -fsSL https://bun.sh/install | bash
```

**Windows** — install Bun in PowerShell:
```powershell
irm bun.sh/install.ps1 | iex
```

Then restart your terminal and follow the Bun instructions above.

### Custom port

If port 3456 is already in use:

```bash
PORT=4567 npm run dev       # Mac/Linux
set PORT=4567 && npm run dev  # Windows
```

---

## MCP Server Setup (Claude Code / Claude Desktop)

### Claude Code (recommended)

The `.mcp.json` in the repo root auto-configures Claude Code. Open Claude Code from inside the IT-Stratagy folder — the 14 MCP tools connect automatically.

Verify:
```
/mcp
# Should show: • it-strategy-diagnostic: connected (14 tools)
```

### Claude Desktop

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

---

## Guided Setup (via Claude)

If you're using Claude Code or Claude Desktop with the MCP connected, just say:

```
Run setup_guide
```

This will check your system, find an available port, and give step-by-step instructions.

---

## Requirements

| Component | Requires |
|-----------|----------|
| Web UI | Node.js v24+ **or** Bun |
| MCP Server | Node.js v24+ **or** Bun |
| One-click setup | Nothing pre-installed (auto-installs Bun) |

## MCP Tools Reference (14 tools)

| Tool | Purpose |
|------|---------|
| `setup_guide` | Interactive setup — checks prereqs, ports, provides instructions |
| `check_port` | Check if a port is available, suggests alternatives |
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
