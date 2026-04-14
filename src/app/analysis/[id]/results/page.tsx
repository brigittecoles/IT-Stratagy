'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SummaryCard } from '@/components/results/SummaryCard';
import { BenchmarkChart } from '@/components/results/BenchmarkChart';
import { OpportunityTable } from '@/components/results/OpportunityTable';
import { ConfidenceBadge } from '@/components/results/ConfidenceBadge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  getAnalysisResults,
  getAnalysisForReview,
  exportExecutiveSummary,
  exportFullReport,
  exportChainOfThought,
} from '@/lib/actions';
import type {
  EngineResult,
  BenchmarkGap,
  OpportunityResult,
  QACheck,
  RecommendationCard as RecommendationCardType,
  NarrativeResult,
} from '@/lib/engine/types';
import type { ConfidenceLevel } from '@/lib/schema/value-lists';
import {
  BarChart3, Target, Lightbulb, ShieldCheck, TrendingUp,
  AlertCircle, CheckCircle, Info, AlertTriangle, Loader2, ArrowLeft,
  Download, FileText, FileSearch, Scroll,
} from 'lucide-react';

const TABS = [
  { id: 'summary', label: 'Summary', icon: BarChart3 },
  { id: 'benchmark', label: 'Benchmark', icon: Target },
  { id: 'opportunities', label: 'Opportunities', icon: TrendingUp },
  { id: 'findings', label: 'Findings & Recommendations', icon: Lightbulb },
  { id: 'caveats', label: 'Caveats & QA', icon: ShieldCheck },
  { id: 'export', label: 'Export Reports', icon: Download },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const analysisId = params.id as string;
  const [activeTab, setActiveTab] = useState<TabId>('summary');
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<EngineResult | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [engineResult, reviewData] = await Promise.all([
          getAnalysisResults(analysisId),
          getAnalysisForReview(analysisId),
        ]);
        if (engineResult) {
          setResult(engineResult);
          setCompanyName(reviewData?.analysis.company.company_name || 'Analysis');
        } else {
          setError('No results found. Please run the analysis first.');
        }
      } catch {
        setError('Failed to load results.');
      }
      setLoading(false);
    }
    load();
  }, [analysisId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-wm-blue" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <div className="wm-alert wm-alert-error inline-block text-left">
          <p className="font-bold text-wm-red">{error || 'No results available'}</p>
        </div>
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.push(`/analysis/${analysisId}/review`)}>
            <ArrowLeft className="size-4" /> Back to Review
          </Button>
        </div>
      </div>
    );
  }

  // Extract data from engine result
  const narrative = result.narrative;
  const gaps = result.benchmark?.raw_gaps ?? [];
  const opportunities = result.opportunities;
  const qa = result.qa;
  const recommendations = result.opportunities.map(o => ({
    title: o.module_name,
    description: o.assumptions.join('. ') + '.',
    value_range: `$${fmt(o.low_case)} - $${fmt(o.high_case)}`,
    confidence: o.confidence as ConfidenceLevel,
    priority: (o.confidence === 'High' ? 'High' : o.confidence === 'Medium' ? 'Medium' : 'Low') as 'High' | 'Medium' | 'Low',
  }));

  const kpiCards = Object.values(result.core_kpis)
    .filter(k => !k.suppressed)
    .slice(0, 4)
    .map(k => {
      const matchingGap = gaps.find(g => g.metric_name === k.numerator_field.replace('_spend', '') + '_pct_' + k.denominator_field);
      return {
        label: k.name,
        value: k.formatted,
        delta: matchingGap
          ? `${matchingGap.gap_vs_median_pct > 0 ? '+' : ''}${(matchingGap.gap_vs_median_pct * 100).toFixed(1)}pp vs median`
          : '',
      };
    });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8">
        <span className="wm-overline">Results</span>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">Analysis Results</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          IT Strategy Diagnostic for {companyName} &mdash; {result.qualified_level}
        </p>
      </div>

      {/* Tab navigation — WM styled with blue active indicator */}
      <div className="mb-8 border-b border-border">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold transition-colors',
                  isActive
                    ? 'border-wm-blue text-wm-blue'
                    : 'border-transparent text-muted-foreground hover:border-wm-slate-200 hover:text-foreground',
                )}>
                <Icon className="h-4 w-4" />{tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="space-y-6">
        {/* ── Summary Tab ── */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <SummaryCard
              companyName={companyName}
              qualifiedLevel={result.qualified_level}
              overallConfidence={qa.overall_confidence}
              executiveSummary={narrative.executive_summary}
            />

            {/* KPI stat callouts — WM magenta numbers */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {kpiCards.map((kpi) => (
                <Card key={kpi.label}>
                  <CardContent className="pt-4">
                    <p className="wm-overline">{kpi.label}</p>
                    <p className="wm-stat-value wm-stat-value-md mt-1">{kpi.value}</p>
                    {kpi.delta && <p className="mt-1 text-xs text-muted-foreground">{kpi.delta}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* YoY trends */}
            {result.yoy && (
              <Card>
                <CardHeader>
                  <span className="wm-overline">Year-over-Year</span>
                  <CardTitle className="mt-1">Trend Analysis</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="wm-stat-label">IT Spend Change</p>
                    <p className="wm-stat-value text-xl mt-1">{result.yoy.it_spend_change.formatted_delta}</p>
                  </div>
                  <div>
                    <p className="wm-stat-label">Revenue Change</p>
                    <p className="wm-stat-value text-xl mt-1">{result.yoy.revenue_change.formatted_delta}</p>
                  </div>
                  <div>
                    <p className="wm-stat-label">Comparison</p>
                    <p className="text-lg font-bold text-foreground mt-1">{result.yoy.spend_vs_revenue_growth}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── Benchmark Tab ── */}
        {activeTab === 'benchmark' && (
          <div className="space-y-6">
            {gaps.length > 0 ? (
              <>
                <BenchmarkChart gaps={gaps} />
                <Card>
                  <CardHeader>
                    <span className="wm-overline">Benchmark</span>
                    <CardTitle className="mt-1">Gap Analysis Detail</CardTitle>
                    <CardDescription>Dollar and percentage gaps vs. benchmark tiers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="wm-table-header text-left">
                            <th className="px-4 py-2.5">Metric</th>
                            <th className="px-4 py-2.5 text-right">Actual</th>
                            <th className="px-4 py-2.5 text-right">Median</th>
                            <th className="px-4 py-2.5 text-right">Gap vs Median</th>
                            <th className="px-4 py-2.5 text-right">Gap ($)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gaps.map((gap, idx) => (
                            <tr
                              key={gap.metric_name}
                              className={cn(
                                'hover:bg-[rgba(0,71,255,0.03)]',
                                idx % 2 === 1 ? 'bg-wm-slate-50' : '',
                              )}
                            >
                              <td className="px-4 py-2.5 font-bold">{gap.metric_name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</td>
                              <td className="px-4 py-2.5 text-right font-mono">{(gap.actual_pct * 100).toFixed(1)}%</td>
                              <td className="px-4 py-2.5 text-right font-mono">{(gap.benchmark_median * 100).toFixed(1)}%</td>
                              <td className={cn('px-4 py-2.5 text-right font-mono font-bold', gap.gap_vs_median_pct > 0 ? 'text-wm-red' : 'text-wm-green')}>
                                {gap.gap_vs_median_pct > 0 ? '+' : ''}{(gap.gap_vs_median_pct * 100).toFixed(1)}pp
                              </td>
                              <td className={cn('px-4 py-2.5 text-right font-mono font-bold', gap.gap_vs_median_dollars > 0 ? 'text-wm-red' : 'text-wm-green')}>
                                {gap.gap_vs_median_dollars > 0 ? '' : '-'}${fmt(Math.abs(gap.gap_vs_median_dollars))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No benchmark comparison available for this analysis.</CardContent></Card>
            )}
          </div>
        )}

        {/* ── Opportunities Tab ── */}
        {activeTab === 'opportunities' && (
          <div className="space-y-6">
            {opportunities.length > 0 ? (
              <>
                {/* Total opportunity — stat callout row */}
                <Card>
                  <CardContent className="flex items-center gap-6 py-4">
                    <div>
                      <p className="wm-overline">Total Base-Case Opportunity</p>
                      <p className="wm-stat-value wm-stat-value-lg mt-1">
                        ${fmt(opportunities.reduce((s, o) => s + o.base_case, 0))}
                      </p>
                    </div>
                    <div className="h-12 w-px bg-wm-slate-200" />
                    <div>
                      <p className="wm-stat-label">Range</p>
                      <p className="text-lg font-bold text-muted-foreground mt-1">
                        ${fmt(opportunities.reduce((s, o) => s + o.low_case, 0))} &ndash; ${fmt(opportunities.reduce((s, o) => s + o.high_case, 0))}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <OpportunityTable opportunities={opportunities} />
              </>
            ) : (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No opportunity modules ran for this analysis level.</CardContent></Card>
            )}
          </div>
        )}

        {/* ── Findings & Recommendations Tab ── */}
        {activeTab === 'findings' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <span className="wm-overline">Analysis</span>
                <CardTitle className="mt-1">Key Findings</CardTitle>
              </CardHeader>
              <CardContent><ul className="space-y-3">
                {narrative.key_findings.map((finding, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-foreground">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-wm-blue-50 text-xs font-bold text-wm-blue">{idx + 1}</span>
                    {finding}
                  </li>
                ))}
              </ul></CardContent>
            </Card>

            {/* Why It Matters — Key Message Block */}
            <div className="wm-key-message">
              <span className="wm-phase-overline">Why It Matters</span>
              <p className="leading-relaxed text-white/90 mt-2">{narrative.why_it_matters}</p>
            </div>

            {recommendations.length > 0 && (
              <div>
                <span className="wm-overline">Priorities</span>
                <h3 className="mt-1 mb-4 text-lg font-bold text-foreground">Recommendations</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {recommendations.map((rec, idx) => (
                    <Card
                      key={idx}
                      className={cn(
                        'wm-card-accent',
                        rec.priority === 'High'
                          ? 'border-l-wm-red'
                          : rec.priority === 'Medium'
                            ? 'border-l-wm-gold'
                            : 'border-l-wm-blue',
                      )}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base">{rec.title}</CardTitle>
                          <ConfidenceBadge level={rec.confidence} />
                        </div>
                        <CardDescription>
                          <span className="font-bold">Priority:</span> {rec.priority} | <span className="font-bold">Value:</span> {rec.value_range}
                        </CardDescription>
                      </CardHeader>
                      <CardContent><p className="text-sm leading-relaxed text-muted-foreground">{rec.description}</p></CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Caveats & QA Tab ── */}
        {activeTab === 'caveats' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <span className="wm-overline">Quality</span>
                <CardTitle className="mt-1 flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Overall Confidence</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3"><div className="flex items-center gap-3">
                <ConfidenceBadge level={qa.overall_confidence} />
                <p className="text-sm text-foreground">{narrative.confidence_statement}</p>
              </div></CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quality Assurance Checks</CardTitle>
                <CardDescription>{qa.checks.filter(c => c.passed).length} of {qa.checks.length} checks passed</CardDescription>
              </CardHeader>
              <CardContent><div className="space-y-2">
                {qa.checks.map((check) => (
                  <div key={check.check_id} className={cn(
                    'wm-alert flex items-center gap-3 text-sm',
                    check.passed ? 'wm-alert-success'
                    : check.severity === 'Warning' ? 'wm-alert-warning'
                    : check.severity === 'Critical' ? 'wm-alert-error'
                    : 'wm-alert-info',
                  )}>
                    {check.passed ? <CheckCircle className="h-4 w-4 shrink-0 text-wm-green" />
                    : check.severity === 'Critical' ? <AlertCircle className="h-4 w-4 shrink-0 text-wm-red" />
                    : check.severity === 'Warning' ? <AlertTriangle className="h-4 w-4 shrink-0 text-wm-gold" />
                    : <Info className="h-4 w-4 shrink-0 text-wm-cyan" />}
                    <div className="flex-1">
                      <span className="font-bold">{check.check_name}</span>
                      <span className="ml-2 text-muted-foreground">{check.message}</span>
                    </div>
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                      check.severity === 'Critical' ? 'wm-badge-error' : check.severity === 'Warning' ? 'wm-badge-warning' : 'wm-badge-info',
                    )}>{check.severity}</span>
                  </div>
                ))}
              </div></CardContent>
            </Card>

            <Card>
              <CardHeader>
                <span className="wm-overline">Limitations</span>
                <CardTitle className="mt-1">Caveats</CardTitle>
              </CardHeader>
              <CardContent><ul className="space-y-2">
                {narrative.caveats.map((caveat, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-wm-gold" />{caveat}
                  </li>
                ))}
              </ul></CardContent>
            </Card>
          </div>
        )}

        {/* ── Export Reports Tab ── */}
        {activeTab === 'export' && (
          <ExportPanel analysisId={analysisId} companyName={companyName} />
        )}
      </div>
    </div>
  );
}

// ── Export Panel Component ──

function ExportPanel({ analysisId, companyName }: { analysisId: string; companyName: string }) {
  const [generating, setGenerating] = useState<string | null>(null);

  const downloadMarkdown = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (type: 'summary' | 'full' | 'cot') => {
    setGenerating(type);
    try {
      let content: string | null = null;
      let filename: string;
      const slug = companyName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');

      switch (type) {
        case 'summary':
          content = await exportExecutiveSummary(analysisId);
          filename = `${slug}_Executive_Summary.md`;
          break;
        case 'full':
          content = await exportFullReport(analysisId);
          filename = `${slug}_Full_Report.md`;
          break;
        case 'cot':
          content = await exportChainOfThought(analysisId);
          filename = `${slug}_Chain_of_Thought.md`;
          break;
      }

      if (content) {
        downloadMarkdown(content, filename);
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
    setGenerating(null);
  };

  const EXPORTS = [
    {
      key: 'summary' as const,
      title: 'Executive Summary',
      description: 'One-page markdown with key metrics, benchmark gaps, opportunities, and findings. Perfect for sharing with leadership.',
      icon: FileText,
      badge: 'Quick share',
    },
    {
      key: 'full' as const,
      title: 'Full Report (10 Sheets)',
      description: 'Complete structured report with all 10 diagnostic sheets — financials, benchmarks, gap analysis, opportunities, workforce, and recommendations.',
      icon: Scroll,
      badge: 'Comprehensive',
    },
    {
      key: 'cot' as const,
      title: 'Chain of Thought',
      description: 'Full audit trail showing every calculation, benchmark comparison, and confidence assessment. Essential for client review and validation.',
      icon: FileSearch,
      badge: 'Audit trail',
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <span className="wm-overline">Deliverables</span>
          <CardTitle className="mt-1">Export Reports</CardTitle>
          <CardDescription>
            Download diagnostic reports as markdown files. Each report contains the full analysis with all data, calculations, and narrative.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {EXPORTS.map((exp) => {
            const Icon = exp.icon;
            const isGenerating = generating === exp.key;
            return (
              <div
                key={exp.key}
                className="flex items-center gap-4 rounded-lg border border-border p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="rounded-lg bg-wm-navy-50 p-3">
                  <Icon className="size-6 text-wm-navy" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm">{exp.title}</h4>
                    <span className="wm-badge-neutral rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
                      {exp.badge}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {exp.description}
                  </p>
                </div>
                <Button
                  onClick={() => handleExport(exp.key)}
                  disabled={generating !== null}
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-1" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="size-4 mr-1" />
                      Download .md
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="wm-key-message">
        <span className="wm-phase-overline">Tip</span>
        <p className="leading-relaxed text-white/90 mt-2">
          These markdown reports render beautifully in Notion, Confluence, or any markdown viewer.
          For a polished slide deck, paste the Executive Summary into your preferred presentation tool.
        </p>
      </div>
    </div>
  );
}

function fmt(n: number): string {
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return n.toFixed(0);
}
