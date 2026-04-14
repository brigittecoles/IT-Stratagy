import type {
  EngineResult,
  RecommendationCard,
  OpportunityResult,
  BenchmarkGap,
  GapAttribution,
  VendorResult,
  WorkforceResult,
} from '@/lib/engine/types';
import type { ConfidenceLevel } from '@/lib/schema/value-lists';

type PartialResult = Omit<EngineResult, 'metadata'>;

// ── Formatting helpers ──

function fmtCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function fmtPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * N14 — Output packaging.
 * Generates recommendation cards from opportunities, gaps, and analysis context.
 * Each card has title, description, value range, confidence, and priority.
 */
export function packageOutput(result: PartialResult): RecommendationCard[] {
  const cards: RecommendationCard[] = [];

  // Cards from opportunity modules
  cards.push(...cardsFromOpportunities(result.opportunities));

  // Cards from benchmark gaps
  if (result.benchmark) {
    cards.push(...cardsFromBenchmarkGaps(result.benchmark.raw_gaps));
  }

  // Card from gap attribution
  if (result.gap_attribution && result.gap_attribution.total_gap_dollars > 0) {
    cards.push(cardFromGapAttribution(result.gap_attribution));
  }

  // Card from vendor analysis
  if (result.vendor) {
    cards.push(...cardsFromVendor(result.vendor));
  }

  // Card from workforce analysis
  if (result.workforce) {
    cards.push(...cardsFromWorkforce(result.workforce));
  }

  // Sort by priority: High > Medium > Low, then by confidence
  const priorityOrder: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
  const confidenceOrder: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
  cards.sort((a, b) => {
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    return confidenceOrder[a.confidence] - confidenceOrder[b.confidence];
  });

  return cards;
}

// ── Card generators ──

function cardsFromOpportunities(opportunities: OpportunityResult[]): RecommendationCard[] {
  return opportunities
    .filter((opp) => opp.base_case > 0)
    .map((opp) => {
      const priority = determinePriority(opp.base_case, opp.confidence);
      return {
        title: opp.module_name,
        description: buildOpportunityDescription(opp),
        value_range: `${fmtCurrency(opp.low_case)} - ${fmtCurrency(opp.high_case)}`,
        confidence: opp.confidence,
        priority,
      };
    });
}

function buildOpportunityDescription(opp: OpportunityResult): string {
  const baseStr = fmtCurrency(opp.base_case);
  const assumptions = opp.assumptions.slice(0, 2).join(' ');
  return `Base-case opportunity of ${baseStr}. ${assumptions}`;
}

function cardsFromBenchmarkGaps(gaps: BenchmarkGap[]): RecommendationCard[] {
  const cards: RecommendationCard[] = [];

  // Only generate cards for significant gaps (above median by >0.5%)
  const significantGaps = gaps.filter((g) => g.gap_vs_median_pct > 0.005);

  if (significantGaps.length === 0) return cards;

  // Create a summary card for the primary gap
  const primaryGap = significantGaps.find((g) => g.metric_name === 'it_spend_pct_revenue');
  if (primaryGap) {
    cards.push({
      title: 'IT Spend Optimization',
      description: `IT spending is ${fmtPct(primaryGap.gap_vs_median_pct)} above the industry median, representing a ${fmtCurrency(primaryGap.gap_vs_median_dollars)} gap. Closing this gap to the median would require targeted spend reduction across multiple categories.`,
      value_range: `${fmtCurrency(primaryGap.gap_vs_median_dollars)} - ${fmtCurrency(primaryGap.gap_vs_p75_dollars > 0 ? primaryGap.gap_vs_p75_dollars : primaryGap.gap_vs_median_dollars)}`,
      confidence: 'Medium' as ConfidenceLevel,
      priority: 'High',
    });
  }

  return cards;
}

function cardFromGapAttribution(attr: GapAttribution): RecommendationCard {
  const addressable = attr.addressable_inefficiency;
  return {
    title: 'Address Operational Inefficiency',
    description: `Of the total ${fmtCurrency(attr.total_gap_dollars)} benchmark gap, approximately ${fmtPct(addressable.pct)} (${fmtCurrency(addressable.dollars)}) is attributed to addressable inefficiency. This represents the most actionable portion of the gap and should be the primary focus of optimization efforts.`,
    value_range: `${fmtCurrency(Math.round(addressable.dollars * 0.5))} - ${fmtCurrency(addressable.dollars)}`,
    confidence: addressable.confidence,
    priority: determinePriority(addressable.dollars, addressable.confidence),
  };
}

function cardsFromVendor(vendor: VendorResult): RecommendationCard[] {
  const cards: RecommendationCard[] = [];

  // High tail spend
  if (!vendor.unmapped_tail.suppressed && vendor.unmapped_tail.value > 0.10) {
    cards.push({
      title: 'Vendor Tail Management',
      description: `${fmtPct(vendor.unmapped_tail.value)} of vendor spend is in the unmapped tail. Categorizing and managing these vendors can reduce maverick spend and improve procurement visibility.`,
      value_range: 'Qualitative improvement',
      confidence: 'Medium',
      priority: 'Medium',
    });
  }

  // Overlapping categories
  if (vendor.overlapping_categories.length >= 3) {
    cards.push({
      title: 'Vendor Category Consolidation',
      description: `${vendor.overlapping_categories.length} vendor categories have 3 or more overlapping vendors: ${vendor.overlapping_categories.slice(0, 5).join(', ')}. Consolidating to preferred vendors in these categories can yield volume discounts and reduce management overhead.`,
      value_range: 'See Vendor Consolidation module',
      confidence: 'Medium',
      priority: 'Medium',
    });
  }

  return cards;
}

function cardsFromWorkforce(workforce: WorkforceResult): RecommendationCard[] {
  const cards: RecommendationCard[] = [];

  // High contractor ratio
  if (!workforce.contractor_ratio.suppressed && workforce.contractor_ratio.value > 0.30) {
    cards.push({
      title: 'Workforce Mix Optimization',
      description: `The contractor ratio is ${workforce.contractor_ratio.formatted}, which is above typical thresholds. Evaluating strategic insourcing of key roles can reduce costs and improve knowledge retention.`,
      value_range: 'See Strategic Insourcing module',
      confidence: 'Medium',
      priority: 'Medium',
    });
  }

  return cards;
}

// ── Priority determination ──

function determinePriority(
  dollarValue: number,
  confidence: ConfidenceLevel,
): 'High' | 'Medium' | 'Low' {
  if (dollarValue >= 1_000_000 && confidence !== 'Low') return 'High';
  if (dollarValue >= 500_000) return 'Medium';
  if (confidence === 'High' && dollarValue > 0) return 'Medium';
  return 'Low';
}
