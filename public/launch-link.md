# IT Strategy Diagnostic — Quick Launch

## One-Click Launch

Click the link below to open Codex with the diagnostic pre-loaded:

[Launch IT Strategy Diagnostic in Codex](codex://new?prompt=Clone%20https%3A%2F%2Fgithub.com%2Fbrigittecoles%2FIT-Stratagy.git%2C%20then%20install%20dependencies%3A%0A%0Acd%20IT-Stratagy%20%26%26%20npm%20install%20%26%26%20cd%20mcp-server%20%26%26%20npm%20install%20%26%26%20cd%20..%0A%0AThen%20connect%20the%20MCP%20server%20by%20running%3A%20codex%20mcp%20add%20it-strategy-diagnostic%20--%20npx%20tsx%20mcp-server%2Fsrc%2Findex.ts%0A%0ANow%20run%20a%20full%20IT%20strategy%20diagnostic.%20Use%20the%20MCP%20tools%20to%3A%0A1.%20Call%20create_analysis%20to%20start%20a%20new%20analysis%0A2.%20Ask%20me%20for%20my%20company%20name%2C%20industry%2C%20revenue%2C%20and%20IT%20spend%0A3.%20Call%20submit_intake%20with%20the%20data%20I%20provide%0A4.%20Call%20run_analysis%20to%20execute%20the%20benchmark%20pipeline%0A5.%20Call%20export_summary%20to%20show%20me%20the%20executive%20summary%0A6.%20Offer%20to%20generate%20the%20full%2010-sheet%20report%20via%20generate_report%0A%0AWalk%20me%20through%20it%20conversationally%20%E2%80%94%20ask%20for%20one%20piece%20of%20data%20at%20a%20time.)

---

## If the button doesn't work

Copy and paste this prompt into Codex or Claude Code:

```
Clone https://github.com/brigittecoles/IT-Stratagy.git, then install dependencies:

cd IT-Stratagy && npm install && cd mcp-server && npm install && cd ..

Then connect the MCP server by running: codex mcp add it-strategy-diagnostic -- npx tsx mcp-server/src/index.ts

Now run a full IT strategy diagnostic. Use the MCP tools to:
1. Call create_analysis to start a new analysis
2. Ask me for my company name, industry, revenue, and IT spend
3. Call submit_intake with the data I provide
4. Call run_analysis to execute the benchmark pipeline
5. Call export_summary to show me the executive summary
6. Offer to generate the full 10-sheet report via generate_report

Walk me through it conversationally — ask for one piece of data at a time.
```
