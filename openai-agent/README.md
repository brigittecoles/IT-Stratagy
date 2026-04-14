# IT Strategy Diagnostic — OpenAI Agent

An AI agent that drives IT spending benchmark analysis conversationally using the OpenAI Agent SDK.

## How It Works

```
User ←→ OpenAI Agent ←→ Local API (localhost:3456) ←→ Analysis Engine
```

The agent calls your locally-running web app's API to create analyses, submit data, run benchmarks, and retrieve results. The user interacts conversationally — no forms needed.

## Setup

### 1. Start the web app (in one terminal)
```bash
cd IT-Stratagy
npm run dev
# Running at http://localhost:3456
```

### 2. Install the agent (in another terminal)
```bash
cd IT-Stratagy/openai-agent
pip install -r requirements.txt
```

### 3. Set your OpenAI API key
```bash
export OPENAI_API_KEY=sk-...
```

### 4. Run the agent
```bash
python agent.py
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | (required) | Your OpenAI API key |
| `IT_STRATEGY_API_URL` | `http://localhost:3456` | API base URL (change if using Vercel) |

## Using with Vercel (hosted)

To point the agent at the hosted version instead of localhost:

```bash
export IT_STRATEGY_API_URL=https://it-stratagy.vercel.app
python agent.py
```

## API Endpoints (used by the agent)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/benchmarks?industry=...` | Query Gartner benchmarks |
| POST | `/api/analysis` | Create new analysis |
| GET | `/api/analysis` | List all analyses |
| GET | `/api/analysis/[id]` | Get analysis detail |
| POST | `/api/analysis/[id]/intake` | Submit intake data |
| POST | `/api/analysis/[id]/run` | Run analysis pipeline |
| GET | `/api/analysis/[id]/results` | Get full results (JSON) |
| GET | `/api/analysis/[id]/summary` | Get executive summary (markdown) |
