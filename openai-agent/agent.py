"""
IT Strategy Diagnostic — OpenAI Agent SDK

This agent connects to the locally-hosted IT Strategy web app
and drives IT spend benchmarking analyses conversationally.

Setup:
  1. Start the web app:  cd IT-Stratagy && npm run dev
  2. Set your OpenAI key: export OPENAI_API_KEY=sk-...
  3. Run the agent:       python agent.py

The agent calls the local API at http://localhost:3456/api/...
"""

import json
import os
from typing import Any

import httpx
from agents import Agent, Runner, function_tool

# Base URL — local by default, override with IT_STRATEGY_API_URL env var
BASE_URL = os.getenv("IT_STRATEGY_API_URL", "http://localhost:3456")


# ── HTTP helper ──

def api(method: str, path: str, body: dict | None = None) -> dict | str:
    """Call the IT Strategy API and return parsed JSON or text."""
    url = f"{BASE_URL}{path}"
    with httpx.Client(timeout=60) as client:
        if method == "GET":
            resp = client.get(url)
        else:
            resp = client.post(url, json=body or {})
    if resp.headers.get("content-type", "").startswith("text/"):
        return resp.text
    return resp.json()


# ── Tool definitions ──

@function_tool
def get_benchmarks(industry: str = "all", metric: str | None = None) -> str:
    """
    Query Gartner 2026 IT benchmarks for an industry.
    Pass industry="all" to list available industries.
    Optionally filter by a specific metric key like "it_spend_pct_revenue".
    """
    params = f"?industry={industry}"
    if metric:
        params += f"&metric={metric}"
    result = api("GET", f"/api/benchmarks{params}")
    return json.dumps(result, indent=2) if isinstance(result, dict) else result


@function_tool
def create_analysis(company_name: str, industry_gics_group: str) -> str:
    """
    Create a new IT strategy analysis.
    Returns the analysis ID to use in subsequent calls.

    Industry options: Banking, Insurance, Energy, Health Care, Retail,
    Utilities, Telecom, Transportation, Chemicals, Consumer Products,
    Industrial Manufacturing, Media, Professional Services, Software, Government
    """
    result = api("POST", "/api/analysis", {
        "company_name": company_name,
        "industry_gics_group": industry_gics_group,
    })
    return json.dumps(result, indent=2)


@function_tool
def submit_intake(
    analysis_id: str,
    revenue: float | None = None,
    total_it_spend: float | None = None,
    it_opex_spend: float | None = None,
    it_capex_spend: float | None = None,
    employee_count: int | None = None,
    it_fte_count: int | None = None,
    transformation_status: str | None = None,
    transformation_type: str | None = None,
    transformation_spend_estimate: float | None = None,
    business_model: str | None = None,
    regulatory_complexity: str | None = None,
    operating_complexity: str | None = None,
    fiscal_year_label: str = "Current Fiscal Year",
) -> str:
    """
    Submit financial, workforce, and transformation data for an analysis.
    Can be called multiple times to add data incrementally.

    Args:
        analysis_id: The analysis ID from create_analysis
        revenue: Annual revenue in dollars (e.g., 500000000)
        total_it_spend: Total IT spend in dollars
        it_opex_spend: IT operational spend
        it_capex_spend: IT capital spend
        employee_count: Total employees
        it_fte_count: IT full-time equivalents
        transformation_status: "Yes", "No", or "Unsure"
        transformation_type: Comma-separated: ERP, WMS, Cloud, Data, Cybersecurity, AI, CRM
        transformation_spend_estimate: Transformation spend in dollars
        business_model: Description of business model
        regulatory_complexity: "Low", "Moderate", or "High"
        operating_complexity: "Low", "Moderate", or "High"
        fiscal_year_label: "Current Fiscal Year" or "Last Fiscal Year" for YoY
    """
    body: dict[str, Any] = {"fiscal_year_label": fiscal_year_label}
    if revenue is not None: body["revenue"] = revenue
    if total_it_spend is not None: body["total_it_spend"] = total_it_spend
    if it_opex_spend is not None: body["it_opex_spend"] = it_opex_spend
    if it_capex_spend is not None: body["it_capex_spend"] = it_capex_spend
    if employee_count is not None: body["employee_count"] = employee_count
    if it_fte_count is not None: body["it_fte_count"] = it_fte_count
    if transformation_status is not None: body["transformation_status"] = transformation_status
    if transformation_type is not None: body["transformation_type"] = [t.strip() for t in transformation_type.split(",")]
    if transformation_spend_estimate is not None: body["transformation_spend_estimate"] = transformation_spend_estimate
    if business_model is not None: body["business_model"] = business_model
    if regulatory_complexity is not None: body["regulatory_complexity"] = regulatory_complexity
    if operating_complexity is not None: body["operating_complexity"] = operating_complexity

    result = api("POST", f"/api/analysis/{analysis_id}/intake", body)
    return json.dumps(result, indent=2)


@function_tool
def run_analysis(analysis_id: str) -> str:
    """
    Execute the full analysis pipeline: KPIs, benchmarks, gaps, opportunities, narrative.
    Call this after submitting intake data.
    """
    result = api("POST", f"/api/analysis/{analysis_id}/run")
    return json.dumps(result, indent=2)


@function_tool
def get_results(analysis_id: str) -> str:
    """
    Get the full analysis results as structured JSON.
    Includes KPIs, benchmark gaps, opportunities, narrative, and QA checks.
    """
    result = api("GET", f"/api/analysis/{analysis_id}/results")
    return json.dumps(result, indent=2) if isinstance(result, dict) else result


@function_tool
def get_executive_summary(analysis_id: str) -> str:
    """
    Get a formatted executive summary in markdown.
    Includes key metrics, benchmark comparison, opportunities, and findings.
    """
    result = api("GET", f"/api/analysis/{analysis_id}/summary")
    return result if isinstance(result, str) else json.dumps(result, indent=2)


@function_tool
def list_analyses() -> str:
    """List all analyses in the current session."""
    result = api("GET", "/api/analysis")
    return json.dumps(result, indent=2)


# ── Agent definition ──

INSTRUCTIONS = """You are an expert IT Strategy Consultant powered by Gartner 2026 benchmark data.

You help CIOs, CFOs, and IT leaders understand how their IT spending, staffing, and investment
posture compares to industry peers. You drive the full diagnostic workflow:

1. **Gather context** — Ask about the company: name, industry, revenue, IT spend, headcount
2. **Create the analysis** — Use create_analysis to start
3. **Submit data** — Use submit_intake to enter financial, workforce, and transformation data
4. **Run the analysis** — Use run_analysis to execute the full benchmark pipeline
5. **Present findings** — Use get_results or get_executive_summary to get the results
6. **Interpret** — Explain what the numbers mean in plain business language

Key behaviors:
- Ask for data conversationally — don't overwhelm with a form
- Start with the basics (company, industry, revenue, IT spend) and ask for more detail gradually
- Explain what each metric means and why it matters
- Compare against industry benchmarks and highlight significant gaps
- Identify specific optimization opportunities with dollar estimates
- Be direct and actionable — this is for C-suite audiences
- Use get_benchmarks to look up industry benchmarks when the user asks about peer data

Available industries: Banking, Insurance, Energy, Health Care, Retail, Utilities, Telecom,
Transportation, Chemicals, Consumer Products, Industrial Manufacturing, Media, Professional
Services, Software, Government

Complexity levels: Low, Moderate, High
Transformation types: ERP, WMS, Cloud, Data, Cybersecurity, AI, CRM, Network, Infrastructure"""


agent = Agent(
    name="IT Strategy Diagnostic",
    instructions=INSTRUCTIONS,
    tools=[
        get_benchmarks,
        create_analysis,
        submit_intake,
        run_analysis,
        get_results,
        get_executive_summary,
        list_analyses,
    ],
)


async def main():
    """Run the agent interactively."""
    print("=" * 60)
    print("  IT Strategy Diagnostic Agent")
    print("  Powered by Gartner 2026 Benchmarks")
    print(f"  API: {BASE_URL}")
    print("=" * 60)
    print()
    print("Tell me about your company and I'll benchmark your IT spending.\n")

    result = await Runner.run(agent, input="Hello! I'm ready to help benchmark your IT spending against industry peers. Tell me about your company — what's the company name and industry?")
    print(f"Agent: {result.final_output}")

    while True:
        user_input = input("\nYou: ").strip()
        if not user_input or user_input.lower() in ("quit", "exit", "bye"):
            print("Goodbye!")
            break
        result = await Runner.run(agent, input=user_input)
        print(f"\nAgent: {result.final_output}")


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
