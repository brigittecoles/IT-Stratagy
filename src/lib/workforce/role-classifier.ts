/**
 * IT Role Classifier
 *
 * Maps real-world job titles and role descriptions to standardized
 * IT tiers using keyword matching and scoring, similar to how
 * tower-classifier.ts maps vendors to IT Spend Towers.
 *
 * Classification layers:
 *   1. Exact title match against known common_titles
 *   2. Weighted keyword scoring against tier-specific rules
 *   3. Fallback to 'Core IT' (15-1200 Computer Occupations) for unmatched IT roles
 *
 * Used by N07 (Workforce) to classify employee, outsourcing,
 * and contingent workforce data into standard IT tiers.
 */

import type { ITTier } from './role-definitions';
import { IT_ROLE_GROUPS } from './role-definitions';

// ── Classification Input/Output ──

export interface RoleClassificationInput {
  /** Job title or role name */
  title: string;
  /** Optional department or organizational unit */
  department?: string;
  /** Optional role description or responsibilities */
  description?: string;
  /** Optional: is this person an FTE, contractor, or outsourced? */
  employment_type?: 'FTE' | 'Contractor' | 'Outsourced';
}

export interface RoleClassificationResult {
  /** Matched IT tier */
  tier: ITTier;
  /** Matched SOC code (most likely role group) */
  soc_code: string;
  /** SOC minor group name */
  soc_minor_group: string;
  /** Classification confidence */
  confidence: 'high' | 'medium' | 'low';
  /** Why this classification was chosen */
  reason: string;
  /** Alternative tier if close match */
  alternative?: ITTier;
  /** Whether this should be flagged for human review */
  needs_review: boolean;
  /** Automability score for matched role group */
  automability: number | null;
}

// ── Keyword Rules ──

interface KeywordRule {
  pattern: string;
  tier: ITTier;
  soc_code: string;
  weight: number;
}

/**
 * Weighted keyword rules for role classification.
 * Higher weight = stronger signal. Weights 1-5.
 */
const KEYWORD_RULES: KeywordRule[] = [
  // ── Core IT: Computer Occupations (15-1200) — weight 5 for very specific ──
  { pattern: 'software developer', tier: 'Core IT', soc_code: '15-1200', weight: 5 },
  { pattern: 'software engineer', tier: 'Core IT', soc_code: '15-1200', weight: 5 },
  { pattern: 'web developer', tier: 'Core IT', soc_code: '15-1200', weight: 5 },
  { pattern: 'frontend developer', tier: 'Core IT', soc_code: '15-1200', weight: 5 },
  { pattern: 'backend developer', tier: 'Core IT', soc_code: '15-1200', weight: 5 },
  { pattern: 'full stack', tier: 'Core IT', soc_code: '15-1200', weight: 5 },
  { pattern: 'mobile developer', tier: 'Core IT', soc_code: '15-1200', weight: 5 },
  { pattern: 'systems administrator', tier: 'Core IT', soc_code: '15-1200', weight: 5 },
  { pattern: 'sysadmin', tier: 'Core IT', soc_code: '15-1200', weight: 5 },
  { pattern: 'database administrator', tier: 'Core IT', soc_code: '15-1200', weight: 5 },
  { pattern: 'dba', tier: 'Core IT', soc_code: '15-1200', weight: 4 },
  { pattern: 'network architect', tier: 'Core IT', soc_code: '15-1200', weight: 5 },
  { pattern: 'cloud architect', tier: 'Core IT', soc_code: '15-1200', weight: 5 },
  { pattern: 'security analyst', tier: 'Core IT', soc_code: '15-1200', weight: 5 },
  { pattern: 'cybersecurity', tier: 'Core IT', soc_code: '15-1200', weight: 4 },
  { pattern: 'penetration test', tier: 'Core IT', soc_code: '15-1200', weight: 5 },
  { pattern: 'qa engineer', tier: 'Core IT', soc_code: '15-1200', weight: 5 },
  { pattern: 'test engineer', tier: 'Core IT', soc_code: '15-1200', weight: 4 },
  { pattern: 'automation engineer', tier: 'Core IT', soc_code: '15-1200', weight: 4 },
  { pattern: 'devops', tier: 'Core IT', soc_code: '15-1200', weight: 4 },
  { pattern: 'site reliability', tier: 'Core IT', soc_code: '15-1200', weight: 5 },
  { pattern: 'sre', tier: 'Core IT', soc_code: '15-1200', weight: 4 },
  { pattern: 'cloud engineer', tier: 'Core IT', soc_code: '15-1200', weight: 4 },
  { pattern: 'programmer', tier: 'Core IT', soc_code: '15-1200', weight: 3 },

  // ── Core IT: Data/Analytics Occupations (15-2000) ──
  { pattern: 'data scientist', tier: 'Core IT', soc_code: '15-2000', weight: 5 },
  { pattern: 'data analyst', tier: 'Core IT', soc_code: '15-2000', weight: 4 },
  { pattern: 'data engineer', tier: 'Core IT', soc_code: '15-2000', weight: 4 },
  { pattern: 'machine learning', tier: 'Core IT', soc_code: '15-2000', weight: 5 },
  { pattern: 'ml engineer', tier: 'Core IT', soc_code: '15-2000', weight: 5 },
  { pattern: 'ai engineer', tier: 'Core IT', soc_code: '15-2000', weight: 5 },
  { pattern: 'statistician', tier: 'Core IT', soc_code: '15-2000', weight: 5 },
  { pattern: 'analytics engineer', tier: 'Core IT', soc_code: '15-2000', weight: 4 },
  { pattern: 'bi analyst', tier: 'Core IT', soc_code: '15-2000', weight: 4 },
  { pattern: 'business intelligence', tier: 'Core IT', soc_code: '15-2000', weight: 3 },
  { pattern: 'operations research', tier: 'Core IT', soc_code: '15-2000', weight: 5 },

  // ── IT Management: Top Executives (11-1000) ──
  { pattern: 'cio', tier: 'IT Management', soc_code: '11-1000', weight: 5 },
  { pattern: 'cto', tier: 'IT Management', soc_code: '11-1000', weight: 5 },
  { pattern: 'ciso', tier: 'IT Management', soc_code: '11-1000', weight: 5 },
  { pattern: 'chief information officer', tier: 'IT Management', soc_code: '11-1000', weight: 5 },
  { pattern: 'chief technology officer', tier: 'IT Management', soc_code: '11-1000', weight: 5 },
  { pattern: 'chief information security', tier: 'IT Management', soc_code: '11-1000', weight: 5 },
  { pattern: 'vp of it', tier: 'IT Management', soc_code: '11-1000', weight: 5 },
  { pattern: 'vp of technology', tier: 'IT Management', soc_code: '11-1000', weight: 5 },
  { pattern: 'vp technology', tier: 'IT Management', soc_code: '11-1000', weight: 5 },
  { pattern: 'head of it', tier: 'IT Management', soc_code: '11-1000', weight: 5 },
  { pattern: 'svp technology', tier: 'IT Management', soc_code: '11-1000', weight: 5 },

  // ── IT Management: Operations Managers (11-3000) ──
  { pattern: 'it manager', tier: 'IT Management', soc_code: '11-3000', weight: 5 },
  { pattern: 'it director', tier: 'IT Management', soc_code: '11-3000', weight: 5 },
  { pattern: 'is director', tier: 'IT Management', soc_code: '11-3000', weight: 5 },
  { pattern: 'it operations manager', tier: 'IT Management', soc_code: '11-3000', weight: 5 },
  { pattern: 'infrastructure manager', tier: 'IT Management', soc_code: '11-3000', weight: 5 },
  { pattern: 'security manager', tier: 'IT Management', soc_code: '11-3000', weight: 4 },
  { pattern: 'application manager', tier: 'IT Management', soc_code: '11-3000', weight: 5 },
  { pattern: 'it service delivery', tier: 'IT Management', soc_code: '11-3000', weight: 4 },
  { pattern: 'it program manager', tier: 'IT Management', soc_code: '11-3000', weight: 5 },
  { pattern: 'it portfolio manager', tier: 'IT Management', soc_code: '11-3000', weight: 5 },

  // ── IT Business Ops: Business Operations (13-1000) ──
  { pattern: 'it business analyst', tier: 'IT Business Ops', soc_code: '13-1000', weight: 5 },
  { pattern: 'business systems analyst', tier: 'IT Business Ops', soc_code: '13-1000', weight: 5 },
  { pattern: 'it project manager', tier: 'IT Business Ops', soc_code: '13-1000', weight: 5 },
  { pattern: 'scrum master', tier: 'IT Business Ops', soc_code: '13-1000', weight: 5 },
  { pattern: 'agile coach', tier: 'IT Business Ops', soc_code: '13-1000', weight: 5 },
  { pattern: 'release manager', tier: 'IT Business Ops', soc_code: '13-1000', weight: 5 },
  { pattern: 'it process analyst', tier: 'IT Business Ops', soc_code: '13-1000', weight: 5 },
  { pattern: 'change manager', tier: 'IT Business Ops', soc_code: '13-1000', weight: 4 },
  { pattern: 'business analyst', tier: 'IT Business Ops', soc_code: '13-1000', weight: 3 },
  { pattern: 'project manager', tier: 'IT Business Ops', soc_code: '13-1000', weight: 2 },

  // ── IT Business Ops: Financial Specialists (13-2000) ──
  { pattern: 'it financial analyst', tier: 'IT Business Ops', soc_code: '13-2000', weight: 5 },
  { pattern: 'it budget analyst', tier: 'IT Business Ops', soc_code: '13-2000', weight: 5 },
  { pattern: 'technology finance', tier: 'IT Business Ops', soc_code: '13-2000', weight: 5 },
  { pattern: 'it procurement', tier: 'IT Business Ops', soc_code: '13-2000', weight: 5 },
  { pattern: 'finops', tier: 'IT Business Ops', soc_code: '13-2000', weight: 5 },
  { pattern: 'it cost analyst', tier: 'IT Business Ops', soc_code: '13-2000', weight: 5 },
  { pattern: 'vendor contract manager', tier: 'IT Business Ops', soc_code: '13-2000', weight: 4 },

  // ── IT Support/Admin (43-4000, 43-6000, 43-9000) ──
  { pattern: 'help desk', tier: 'IT Support/Admin', soc_code: '43-4000', weight: 5 },
  { pattern: 'service desk', tier: 'IT Support/Admin', soc_code: '43-4000', weight: 5 },
  { pattern: 'it support', tier: 'IT Support/Admin', soc_code: '43-9000', weight: 4 },
  { pattern: 'desktop support', tier: 'IT Support/Admin', soc_code: '43-9000', weight: 5 },
  { pattern: 'it coordinator', tier: 'IT Support/Admin', soc_code: '43-9000', weight: 4 },
  { pattern: 'it asset', tier: 'IT Support/Admin', soc_code: '43-4000', weight: 4 },
  { pattern: 'data entry', tier: 'IT Support/Admin', soc_code: '43-9000', weight: 4 },
  { pattern: 'it admin', tier: 'IT Support/Admin', soc_code: '43-9000', weight: 4 },
  { pattern: 'it executive assistant', tier: 'IT Support/Admin', soc_code: '43-6000', weight: 5 },
  { pattern: 'cio assistant', tier: 'IT Support/Admin', soc_code: '43-6000', weight: 5 },

  // ── IT-Adjacent Engineering (17-2000, 17-3000) ──
  { pattern: 'hardware engineer', tier: 'IT-Adjacent Engineering', soc_code: '17-2000', weight: 5 },
  { pattern: 'systems engineer', tier: 'IT-Adjacent Engineering', soc_code: '17-2000', weight: 4 },
  { pattern: 'electronics engineer', tier: 'IT-Adjacent Engineering', soc_code: '17-2000', weight: 5 },
  { pattern: 'network engineer', tier: 'IT-Adjacent Engineering', soc_code: '17-2000', weight: 4 },
  { pattern: 'infrastructure engineer', tier: 'IT-Adjacent Engineering', soc_code: '17-2000', weight: 4 },
  { pattern: 'platform engineer', tier: 'IT-Adjacent Engineering', soc_code: '17-2000', weight: 4 },
  { pattern: 'solutions architect', tier: 'IT-Adjacent Engineering', soc_code: '17-2000', weight: 4 },
  { pattern: 'enterprise architect', tier: 'IT-Adjacent Engineering', soc_code: '17-2000', weight: 5 },
  { pattern: 'it technician', tier: 'IT-Adjacent Engineering', soc_code: '17-3000', weight: 5 },
  { pattern: 'lab technician', tier: 'IT-Adjacent Engineering', soc_code: '17-3000', weight: 3 },

  // ── IT Compliance/Legal (23-2000) ──
  { pattern: 'it compliance', tier: 'IT Compliance/Legal', soc_code: '23-2000', weight: 5 },
  { pattern: 'it audit', tier: 'IT Compliance/Legal', soc_code: '23-2000', weight: 5 },
  { pattern: 'software licensing', tier: 'IT Compliance/Legal', soc_code: '23-2000', weight: 5 },
  { pattern: 'data privacy', tier: 'IT Compliance/Legal', soc_code: '23-2000', weight: 5 },
  { pattern: 'it governance', tier: 'IT Compliance/Legal', soc_code: '23-2000', weight: 4 },
  { pattern: 'technology risk', tier: 'IT Compliance/Legal', soc_code: '23-2000', weight: 4 },
  { pattern: 'it contract', tier: 'IT Compliance/Legal', soc_code: '23-2000', weight: 4 },

  // ── IT Content/Comms (27-3000) ──
  { pattern: 'technical writer', tier: 'IT Content/Comms', soc_code: '27-3000', weight: 5 },
  { pattern: 'ux writer', tier: 'IT Content/Comms', soc_code: '27-3000', weight: 5 },
  { pattern: 'it communications', tier: 'IT Content/Comms', soc_code: '27-3000', weight: 5 },
  { pattern: 'documentation specialist', tier: 'IT Content/Comms', soc_code: '27-3000', weight: 5 },
  { pattern: 'it knowledge manager', tier: 'IT Content/Comms', soc_code: '27-3000', weight: 5 },

  // ── IT Training (25-3000) ──
  { pattern: 'it trainer', tier: 'IT Training', soc_code: '25-3000', weight: 5 },
  { pattern: 'technology trainer', tier: 'IT Training', soc_code: '25-3000', weight: 5 },
  { pattern: 'lms administrator', tier: 'IT Training', soc_code: '25-3000', weight: 5 },
  { pattern: 'it training', tier: 'IT Training', soc_code: '25-3000', weight: 4 },
  { pattern: 'learning management', tier: 'IT Training', soc_code: '25-3000', weight: 4 },

  // ── IT Infrastructure (49-2000, 49-9000) ──
  { pattern: 'telecom installer', tier: 'IT Infrastructure', soc_code: '49-2000', weight: 5 },
  { pattern: 'computer repair', tier: 'IT Infrastructure', soc_code: '49-2000', weight: 5 },
  { pattern: 'network cabling', tier: 'IT Infrastructure', soc_code: '49-2000', weight: 5 },
  { pattern: 'field technician', tier: 'IT Infrastructure', soc_code: '49-2000', weight: 4 },
  { pattern: 'data center technician', tier: 'IT Infrastructure', soc_code: '49-9000', weight: 5 },
  { pattern: 'facilities technician', tier: 'IT Infrastructure', soc_code: '49-9000', weight: 4 },
  { pattern: 'data center engineer', tier: 'IT Infrastructure', soc_code: '49-9000', weight: 5 },
  { pattern: 'equipment maintenance', tier: 'IT Infrastructure', soc_code: '49-9000', weight: 4 },
];

// ── Pre-compute exact title → role group map ──

const TITLE_MAP = new Map<string, { tier: ITTier; soc_code: string; soc_minor_group: string }>();
for (const group of IT_ROLE_GROUPS) {
  for (const title of group.common_titles) {
    TITLE_MAP.set(title.toLowerCase(), {
      tier: group.tier,
      soc_code: group.soc_code,
      soc_minor_group: group.soc_minor_group,
    });
  }
}

// ── Classification Functions ──

/**
 * Classify a job title/role into an IT tier.
 *
 * Classification layers:
 * 1. Exact title match against known common_titles from role definitions
 * 2. Weighted keyword scoring — accumulates scores per tier/SOC, picks highest
 * 3. Fallback to Core IT (15-1200) for unmatched roles
 */
export function classifyRole(input: RoleClassificationInput): RoleClassificationResult {
  const titleLower = input.title.toLowerCase().trim();
  const deptLower = (input.department ?? '').toLowerCase().trim();
  const descLower = (input.description ?? '').toLowerCase().trim();
  const searchText = `${titleLower} ${deptLower} ${descLower}`;

  // Layer 1: Exact title match
  const exact = TITLE_MAP.get(titleLower);
  if (exact) {
    const group = IT_ROLE_GROUPS.find(g => g.soc_code === exact.soc_code);
    return {
      tier: exact.tier,
      soc_code: exact.soc_code,
      soc_minor_group: exact.soc_minor_group,
      confidence: 'high',
      reason: `Exact title match: "${input.title}"`,
      needs_review: false,
      automability: group?.automability ?? null,
    };
  }

  // Layer 2: Keyword scoring
  const scores = new Map<string, { tier: ITTier; soc_code: string; score: number }>();

  for (const rule of KEYWORD_RULES) {
    if (searchText.includes(rule.pattern)) {
      const key = `${rule.tier}|${rule.soc_code}`;
      const current = scores.get(key);
      if (current) {
        current.score += rule.weight;
      } else {
        scores.set(key, { tier: rule.tier, soc_code: rule.soc_code, score: rule.weight });
      }
    }
  }

  if (scores.size > 0) {
    const ranked = [...scores.values()].sort((a, b) => b.score - a.score);
    const best = ranked[0];
    const runner = ranked.length > 1 ? ranked[1] : null;
    const gap = runner ? best.score - runner.score : best.score;
    const group = IT_ROLE_GROUPS.find(g => g.soc_code === best.soc_code);

    let confidence: 'high' | 'medium' | 'low';
    if (best.score >= 5 && gap >= 2) {
      confidence = 'high';
    } else if (best.score >= 3) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    return {
      tier: best.tier,
      soc_code: best.soc_code,
      soc_minor_group: group?.soc_minor_group ?? 'Unknown',
      confidence,
      reason: `Keyword match (score: ${best.score}, gap: ${gap})`,
      alternative: runner && gap < 2 ? runner.tier : undefined,
      needs_review: confidence === 'low' || (runner !== null && gap < 2),
      automability: group?.automability ?? null,
    };
  }

  // Layer 3: Fallback to Core IT (15-1200)
  const fallback = IT_ROLE_GROUPS.find(g => g.soc_code === '15-1200')!;
  return {
    tier: 'Core IT',
    soc_code: '15-1200',
    soc_minor_group: fallback.soc_minor_group,
    confidence: 'low',
    reason: `No keyword match — defaulted to Core IT (Computer Occupations)`,
    needs_review: true,
    automability: fallback.automability,
  };
}

/**
 * Classify a batch of roles and return per-tier aggregation.
 */
export function classifyRoleBatch(
  roles: (RoleClassificationInput & { headcount?: number; cost?: number })[],
): {
  classifications: (RoleClassificationResult & { original_title: string; headcount: number; cost: number })[];
  tier_summary: {
    tier: ITTier;
    headcount: number;
    cost: number;
    avg_automability: number;
    needs_review_count: number;
  }[];
  total_headcount: number;
  total_cost: number;
  needs_review_count: number;
} {
  const classifications = roles.map(role => {
    const result = classifyRole(role);
    return {
      ...result,
      original_title: role.title,
      headcount: role.headcount ?? 1,
      cost: role.cost ?? 0,
    };
  });

  // Aggregate by tier
  const tierAgg = new Map<ITTier, {
    headcount: number;
    cost: number;
    automability_sum: number;
    automability_count: number;
    needs_review_count: number;
  }>();

  for (const c of classifications) {
    const agg = tierAgg.get(c.tier) ?? {
      headcount: 0, cost: 0, automability_sum: 0, automability_count: 0, needs_review_count: 0,
    };
    agg.headcount += c.headcount;
    agg.cost += c.cost;
    if (c.automability !== null) {
      agg.automability_sum += c.automability * c.headcount;
      agg.automability_count += c.headcount;
    }
    if (c.needs_review) agg.needs_review_count += 1;
    tierAgg.set(c.tier, agg);
  }

  const tier_summary = [...tierAgg.entries()]
    .map(([tier, agg]) => ({
      tier,
      headcount: agg.headcount,
      cost: agg.cost,
      avg_automability: agg.automability_count > 0
        ? Math.round((agg.automability_sum / agg.automability_count) * 10) / 10
        : 0,
      needs_review_count: agg.needs_review_count,
    }))
    .sort((a, b) => b.headcount - a.headcount);

  return {
    classifications,
    tier_summary,
    total_headcount: classifications.reduce((sum, c) => sum + c.headcount, 0),
    total_cost: classifications.reduce((sum, c) => sum + c.cost, 0),
    needs_review_count: classifications.filter(c => c.needs_review).length,
  };
}

/**
 * Suggest IT tiers for a free-text role description.
 * Returns top 3 matching tiers with scores.
 */
export function suggestTier(text: string): { tier: ITTier; soc_code: string; score: number }[] {
  const lower = text.toLowerCase().trim();
  const scores = new Map<string, { tier: ITTier; soc_code: string; score: number }>();

  for (const rule of KEYWORD_RULES) {
    if (lower.includes(rule.pattern)) {
      const key = `${rule.tier}|${rule.soc_code}`;
      const current = scores.get(key);
      if (current) {
        current.score += rule.weight;
      } else {
        scores.set(key, { tier: rule.tier, soc_code: rule.soc_code, score: rule.weight });
      }
    }
  }

  return [...scores.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
