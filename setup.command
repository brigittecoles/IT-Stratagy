#!/bin/bash
# ═══════════════════════════════════════════════════════════
# IT Strategy Diagnostic — One-Click Setup
# Double-click this file on Mac to set everything up.
# ═══════════════════════════════════════════════════════════

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}${BOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}${BOLD}║   IT Strategy Diagnostic — Setup             ║${NC}"
echo -e "${BLUE}${BOLD}╚══════════════════════════════════════════════╝${NC}"
echo ""

# Navigate to the script's directory (the repo root)
cd "$(dirname "$0")"
echo -e "${BOLD}📁 Working directory:${NC} $(pwd)"
echo ""

# ── Step 1: Check for a JavaScript runtime ──
echo -e "${BOLD}Step 1: Checking for JavaScript runtime...${NC}"

RUNTIME=""
RUNNER=""

# Check for Node.js >= 24
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | sed 's/v//' | cut -d. -f1)
    if [ "$NODE_VERSION" -ge 24 ] 2>/dev/null; then
        echo -e "  ${GREEN}✅ Node.js $(node --version) found${NC}"
        RUNTIME="node"
        RUNNER="npm"
    else
        echo -e "  ${YELLOW}⚠️  Node.js $(node --version) found, but v24+ is recommended${NC}"
        RUNTIME="node"
        RUNNER="npm"
    fi
fi

# Check for Bun as alternative
if [ -z "$RUNTIME" ] && command -v bun &> /dev/null; then
    echo -e "  ${GREEN}✅ Bun $(bun --version) found${NC}"
    RUNTIME="bun"
    RUNNER="bun"
fi

# Neither found — install Bun (single command, no sudo)
if [ -z "$RUNTIME" ]; then
    echo -e "  ${YELLOW}⚠️  No JavaScript runtime found.${NC}"
    echo ""
    echo -e "  ${BOLD}Installing Bun (lightweight JavaScript runtime)...${NC}"
    echo -e "  This does NOT require admin/sudo access."
    echo ""

    curl -fsSL https://bun.sh/install | bash

    # Add Bun to PATH for this session
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"

    if command -v bun &> /dev/null; then
        echo ""
        echo -e "  ${GREEN}✅ Bun $(bun --version) installed successfully${NC}"
        RUNTIME="bun"
        RUNNER="bun"
    else
        echo -e "  ${RED}❌ Installation failed. Please install manually:${NC}"
        echo -e "     Option A: https://bun.sh"
        echo -e "     Option B: https://nodejs.org (v24+)"
        echo ""
        echo "Press any key to exit..."
        read -n 1
        exit 1
    fi
fi

echo ""

# ── Step 2: Install dependencies ──
echo -e "${BOLD}Step 2: Installing dependencies...${NC}"

if [ "$RUNNER" = "bun" ]; then
    echo -e "  Using Bun..."
    bun install
    cd mcp-server && bun install && cd ..
else
    echo -e "  Using npm..."
    npm install
    cd mcp-server && npm install && cd ..
fi

echo -e "  ${GREEN}✅ Dependencies installed${NC}"
echo ""

# ── Step 3: Find an available port ──
echo -e "${BOLD}Step 3: Finding an available port...${NC}"

PORT=3456
for TRY_PORT in 3456 3457 3458 4000 4567 5000 8080; do
    if ! lsof -i ":$TRY_PORT" &> /dev/null; then
        PORT=$TRY_PORT
        break
    fi
done

echo -e "  ${GREEN}✅ Port $PORT is available${NC}"
echo ""

# ── Step 4: Start the web UI ──
echo -e "${BOLD}Step 4: Starting the web UI...${NC}"
echo ""
echo -e "${BLUE}${BOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}${BOLD}║                                              ║${NC}"
echo -e "${BLUE}${BOLD}║   Open your browser to:                      ║${NC}"
echo -e "${BLUE}${BOLD}║   ${GREEN}http://localhost:$PORT${BLUE}                       ║${NC}"
echo -e "${BLUE}${BOLD}║                                              ║${NC}"
echo -e "${BLUE}${BOLD}║   Press Ctrl+C to stop the server.           ║${NC}"
echo -e "${BLUE}${BOLD}║                                              ║${NC}"
echo -e "${BLUE}${BOLD}╚══════════════════════════════════════════════╝${NC}"
echo ""

# Open browser after a short delay
(sleep 3 && open "http://localhost:$PORT" 2>/dev/null) &

# Start the dev server
if [ "$RUNNER" = "bun" ]; then
    PORT=$PORT bun --bun node_modules/next/dist/bin/next dev --port $PORT
else
    PORT=$PORT node node_modules/next/dist/bin/next dev --port $PORT
fi
