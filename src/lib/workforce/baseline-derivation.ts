/**
 * Baseline RACI Type and FTE Load % Derivation
 *
 * Computes baseline values for the two unpopulated crosswalk columns
 * using systematic rules derived from the crosswalk data itself.
 *
 * ═══════════════════════════════════════════════════════════════════
 * RACI DERIVATION LOGIC
 * ═══════════════════════════════════════════════════════════════════
 *
 * The RACI model defines four responsibility levels:
 *   R (Responsible)  — Does the work. Performs the process activities.
 *   A (Accountable)  — Owns the outcome. Makes decisions, signs off.
 *   C (Consulted)    — Provides expertise. Two-way communication.
 *   I (Informed)     — Kept aware. One-way communication.
 *
 * Our derivation uses three signals:
 *
 * 1. TIER TYPE determines the base RACI level:
 *    ┌────────────────────────────┬───────────────────────────────────┐
 *    │ Tier                       │ Base Role                         │
 *    ├────────────────────────────┼───────────────────────────────────┤
 *    │ IT Management (11-1000)    │ Accountable (strategic oversight) │
 *    │ IT Management (11-3000)    │ Accountable (operational owner)   │
 *    │ Core IT (15-2000)          │ Responsible (does the work)       │
 *    │ Core IT (15-1200)          │ Responsible (does the work)       │
 *    │ IT Business Ops            │ Responsible or Consulted          │
 *    │ IT-Adjacent Engineering    │ Responsible (builds/designs)      │
 *    │ IT Support/Admin           │ Responsible (operational tasks)   │
 *    │ IT Infrastructure          │ Responsible (physical execution)  │
 *    │ IT Compliance/Legal        │ Consulted (advisory by nature)    │
 *    │ IT Content/Comms           │ Responsible (creates content)     │
 *    │ IT Training                │ Responsible (delivers training)   │
 *    └────────────────────────────┴───────────────────────────────────┘
 *
 *    Rationale: Executives own outcomes (A), practitioners do work (R).
 *    IT Compliance/Legal defaults to C because they advise on processes
 *    rather than owning them directly.
 *
 * 2. CONFIDENCE adjusts the level:
 *    - High confidence → keeps or promotes: C→R, R stays R, A stays A
 *    - Medium confidence → keeps base level
 *    - Low confidence → demotes: R→C, C→I, A→C
 *
 *    Rationale: Low confidence means the role-process link is weaker,
 *    so the role is more peripheral (consulted/informed) rather than
 *    driving the process.
 *
 * 3. PROCESS DOMAIN FIT provides a final adjustment:
 *    - APQC Category 8 (Manage IT) → boost for all IT roles
 *      These are "home turf" processes; even low-confidence mappings
 *      get promoted from I→C (IT roles should at least be consulted
 *      on IT processes)
 *    - APQC categories outside IT (1-7, 9-13) → no boost
 *      IT roles touching HR, Finance, or Marketing processes are
 *      typically advisory, not primary executors
 *
 * ═══════════════════════════════════════════════════════════════════
 * FTE LOAD % DERIVATION LOGIC
 * ═══════════════════════════════════════════════════════════════════
 *
 * FTE Load % estimates what fraction of a role's total work time is
 * spent on each mapped APQC process. Constraints:
 *
 *   - Sum across all processes for a SOC group ≤ 100%
 *   - Not all time is process-mapped (meetings, admin, context-switching)
 *   - "Unmapped overhead" is higher for focused roles (fewer processes)
 *     and lower for broad roles (more processes = more of their time
 *     is captured by the APQC framework)
 *
 * Formula:
 *
 *   fte_load_i = (sim_i × conf_weight_i) / Σ(sim_j × conf_weight_j) × coverage_cap
 *
 * Where:
 *   - sim_i: similarity score for this mapping
 *   - conf_weight_i: confidence multiplier (High=2.0, Medium=1.0, Low=0.5)
 *     High-confidence mappings represent core process involvement and
 *     should carry more FTE weight. Low-confidence mappings are peripheral.
 *   - coverage_cap: total process-mapped time as % of FTE, varies by
 *     number of processes touched:
 *
 *     ┌─────────────────┬──────────────┬───────────────────────────────┐
 *     │ Processes Touched│ Coverage Cap │ Rationale                     │
 *     ├─────────────────┼──────────────┼───────────────────────────────┤
 *     │ 1               │ 40%          │ Very focused; most time is    │
 *     │                 │              │ hands-on work not in APQC     │
 *     │ 2-3             │ 50%          │ Focused role, some overhead   │
 *     │ 4-7             │ 60%          │ Moderate breadth              │
 *     │ 8-11            │ 70%          │ Broad role, well-captured     │
 *     │ 12-19           │ 80%          │ Management roles; APQC covers │
 *     │                 │              │ most of their activity scope  │
 *     └─────────────────┴──────────────┴───────────────────────────────┘
 *
 *     Management roles (11-1000 with 18 processes, 11-3000 with 19)
 *     have the highest coverage because their work IS managing across
 *     multiple business processes. Infrastructure roles (49-2000 with
 *     1 process) have low coverage because most of their time is
 *     hands-on physical work not well-captured by APQC categories.
 *
 * Final step: round to nearest whole percent, enforce minimum 1%.
 */

import type { ITTier } from './role-definitions';
import type { CrosswalkConfidence } from './crosswalk-data';
import { CROSSWALK_DATA } from './crosswalk-data';

// ── RACI Types ──

export type RACIType = 'R' | 'A' | 'C' | 'I';

// ── Derived Entry ──

export interface DerivedCrosswalkEntry {
  /** SOC code of the role group */
  soc_code: string;
  /** APQC L2 process code */
  apqc_l2_code: string;
  /** Derived RACI type */
  raci_type: RACIType;
  /** Derived FTE Load % (0-100) */
  fte_load_pct: number;
  /** Explanation of RACI derivation */
  raci_reason: string;
}

// ── RACI Derivation ──

const RACI_ORDER: RACIType[] = ['A', 'R', 'C', 'I'];

function promoteRaci(current: RACIType): RACIType {
  const idx = RACI_ORDER.indexOf(current);
  return idx > 0 ? RACI_ORDER[idx - 1] : current;
}

function demoteRaci(current: RACIType): RACIType {
  const idx = RACI_ORDER.indexOf(current);
  return idx < RACI_ORDER.length - 1 ? RACI_ORDER[idx + 1] : current;
}

function getBaseRaci(tier: ITTier, socCode: string): RACIType {
  // Management tiers → Accountable (they own outcomes)
  if (tier === 'IT Management') return 'A';

  // Advisory roles → Consulted (they advise, don't own)
  if (tier === 'IT Compliance/Legal') return 'C';

  // All execution tiers → Responsible (they do the work)
  return 'R';
}

function isITProcess(apqcL1Code: number): boolean {
  return apqcL1Code === 8;
}

function deriveRaci(
  tier: ITTier,
  socCode: string,
  confidence: CrosswalkConfidence,
  apqcL1Code: number,
): { raci: RACIType; reason: string } {
  let raci = getBaseRaci(tier, socCode);
  const reasons: string[] = [`Base: ${raci} (${tier})`];

  // Confidence adjustment
  if (confidence === 'High') {
    const before = raci;
    raci = promoteRaci(raci);
    if (raci !== before) reasons.push(`High conf: ${before}→${raci}`);
    else reasons.push('High conf: kept');
  } else if (confidence === 'Low') {
    const before = raci;
    raci = demoteRaci(raci);
    reasons.push(`Low conf: ${before}→${raci}`);
  }

  // IT process domain boost: IT roles should be at least Consulted on IT processes
  if (isITProcess(apqcL1Code) && raci === 'I') {
    raci = 'C';
    reasons.push('IT domain boost: I→C');
  }

  return { raci, reason: reasons.join('; ') };
}

// ── FTE Load Derivation ──

const CONFIDENCE_WEIGHTS: Record<CrosswalkConfidence, number> = {
  High: 2.0,
  Medium: 1.0,
  Low: 0.5,
};

function getCoverageCap(processCount: number): number {
  if (processCount <= 1) return 40;
  if (processCount <= 3) return 50;
  if (processCount <= 7) return 60;
  if (processCount <= 11) return 70;
  return 80; // 12-19 processes (management roles)
}

// ── Main Derivation Function ──

/**
 * Derive baseline RACI and FTE Load % for all 98 crosswalk entries.
 * Returns the derived values alongside the original data keys.
 */
export function deriveBaselines(): DerivedCrosswalkEntry[] {
  // Step 1: Group entries by SOC code for FTE Load normalization
  const bySoc = new Map<string, typeof CROSSWALK_DATA>();
  for (const entry of CROSSWALK_DATA) {
    const group = bySoc.get(entry.soc_code) ?? [];
    group.push(entry);
    bySoc.set(entry.soc_code, group);
  }

  const results: DerivedCrosswalkEntry[] = [];

  for (const [socCode, entries] of bySoc) {
    // Compute weighted similarity sum for this SOC group
    const weightedSims = entries.map(e => ({
      entry: e,
      weightedSim: e.similarity * CONFIDENCE_WEIGHTS[e.confidence],
    }));
    const totalWeightedSim = weightedSims.reduce((sum, ws) => sum + ws.weightedSim, 0);
    const coverageCap = getCoverageCap(entries.length);

    for (const { entry, weightedSim } of weightedSims) {
      // Derive RACI
      const { raci, reason } = deriveRaci(
        entry.tier,
        entry.soc_code,
        entry.confidence,
        entry.apqc_l1_code,
      );

      // Derive FTE Load %
      const rawPct = totalWeightedSim > 0
        ? (weightedSim / totalWeightedSim) * coverageCap
        : 0;
      const ftePct = Math.max(1, Math.round(rawPct)); // minimum 1%

      results.push({
        soc_code: entry.soc_code,
        apqc_l2_code: entry.apqc_l2_code,
        raci_type: raci,
        fte_load_pct: ftePct,
        raci_reason: reason,
      });
    }
  }

  return results;
}

/**
 * Get derived baseline values as a lookup map.
 * Key: `${soc_code}|${apqc_l2_code}`
 */
export function getBaselineLookup(): Map<string, { raci_type: RACIType; fte_load_pct: number }> {
  const baselines = deriveBaselines();
  const map = new Map<string, { raci_type: RACIType; fte_load_pct: number }>();
  for (const b of baselines) {
    map.set(`${b.soc_code}|${b.apqc_l2_code}`, {
      raci_type: b.raci_type,
      fte_load_pct: b.fte_load_pct,
    });
  }
  return map;
}

/**
 * Get a summary of FTE load distribution per SOC code.
 * Useful for validating that loads sum to reasonable totals.
 */
export function getFTELoadSummary(): {
  soc_code: string;
  tier: string;
  process_count: number;
  coverage_cap: number;
  total_fte_load: number;
  entries: { apqc_l2: string; raci: RACIType; fte_pct: number }[];
}[] {
  const baselines = deriveBaselines();
  const bySoc = new Map<string, DerivedCrosswalkEntry[]>();
  for (const b of baselines) {
    const group = bySoc.get(b.soc_code) ?? [];
    group.push(b);
    bySoc.set(b.soc_code, group);
  }

  const socTier = new Map(CROSSWALK_DATA.map(e => [e.soc_code, e.tier]));

  return [...bySoc.entries()].map(([soc, entries]) => ({
    soc_code: soc,
    tier: socTier.get(soc) ?? 'Unknown',
    process_count: entries.length,
    coverage_cap: getCoverageCap(entries.length),
    total_fte_load: entries.reduce((sum, e) => sum + e.fte_load_pct, 0),
    entries: entries.map(e => ({
      apqc_l2: e.apqc_l2_code,
      raci: e.raci_type,
      fte_pct: e.fte_load_pct,
    })),
  }));
}
