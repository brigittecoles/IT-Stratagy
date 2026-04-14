# IT Strategy Diagnostic — Setup Guide

## Easiest: Use the Hosted Version

Visit **https://it-stratagy.vercel.app** — nothing to install.

Or deploy your own in 30 seconds: [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbrigittecoles%2FIT-Stratagy)

---

## Option 1: AI Agent Setup (No Terminal Knowledge Needed)

Paste this into **Claude Code**, **Codex**, or any AI coding agent:

> Clone https://github.com/brigittecoles/IT-Stratagy.git, install dependencies with `npm install` in both the root and the `mcp-server/` folder, then start the dev server with `npm run dev`. Open http://localhost:4321 in my browser.

The AI does everything. You never touch a terminal.

---

## Option 2: Double-Click Setup (Mac / Windows)

### Step 1: Download
Go to: **https://github.com/brigittecoles/IT-Stratagy/archive/refs/heads/main.zip**

### Step 2: Unzip
Double-click the downloaded `.zip` file to extract it.

### Step 3: Run
- **Mac**: Double-click **`setup.command`**
- **Windows**: Double-click **`setup.bat`**

### Step 4: Done
Your browser opens automatically to the diagnostic tool.

> These scripts auto-install a JavaScript runtime (Bun) if you don't have one — no admin access required.

---

## Option 3: Manual Terminal Setup

### With npm (Node.js):
```bash
git clone https://github.com/brigittecoles/IT-Stratagy.git
cd IT-Stratagy
npm install
cd mcp-server && npm install && cd ..
npm run dev
# → http://localhost:4321
```

### With Bun:
```bash
git clone https://github.com/brigittecoles/IT-Stratagy.git
cd IT-Stratagy
bun install
cd mcp-server && bun install && cd ..
bun run dev
# → http://localhost:4321
```

### Don't have npm or Bun?

**Mac**: `curl -fsSL https://bun.sh/install | bash`
**Windows** (PowerShell): `irm bun.sh/install.ps1 | iex`

Then restart your terminal and follow the instructions above.

### Custom port

```bash
PORT=4567 npm run dev       # Mac/Linux
set PORT=4567 && npm run dev  # Windows
```

---

## MCP Server Setup (AI-Powered Analysis)

The MCP server lets Claude drive analyses conversationally. The Web UI works without this — MCP is optional.

### Claude Code (auto-configures)

Open Claude Code from inside the IT-Stratagy folder. The `.mcp.json` auto-connects 14 tools.

Verify: run `/mcp` — should show `it-strategy-diagnostic: connected (14 tools)`

### Claude Desktop

Add to your config file:
- **Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
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

## Requirements

| Component | Requires |
|-----------|----------|
| Hosted (Vercel) | Nothing — just a browser |
| Web UI (local) | Node.js v24+ **or** Bun |
| MCP Server | Node.js v24+ **or** Bun |
| One-click setup | Nothing pre-installed (auto-installs Bun) |
