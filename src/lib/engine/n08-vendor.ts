import type { VendorResult, KPIMetric } from '@/lib/engine/types';
import type { ITSpendTower } from '@/lib/schema/value-lists';
import { IT_SPEND_TOWERS } from '@/lib/schema/value-lists';
import { classifyToTower } from '@/lib/towers/tower-classifier';

// ── Vendor input structure ──

export interface VendorData {
  vendors: {
    name: string;
    spend: number;
    category: string;
    tower: string; // User-provided or auto-classified
    description?: string;
  }[];
}

// ── Helpers ──

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function makeKPI(
  name: string,
  value: number,
  formatted: string,
  numerator: string,
  denominator: string,
  suppressed = false,
  suppressReason?: string,
): KPIMetric {
  return {
    name,
    value,
    formatted,
    numerator_field: numerator,
    denominator_field: denominator,
    suppressed,
    ...(suppressReason ? { suppress_reason: suppressReason } : {}),
  };
}

/**
 * Validate and normalize a tower name against the controlled list.
 * If the tower is not recognized, auto-classify using vendor name + category.
 */
function resolveTower(vendor: VendorData['vendors'][0]): ITSpendTower {
  // Check if the provided tower matches the controlled list
  const provided = vendor.tower?.trim();
  if (provided) {
    const matched = IT_SPEND_TOWERS.find(
      t => t.toLowerCase() === provided.toLowerCase(),
    );
    if (matched) return matched;
  }

  // Auto-classify from vendor name + category + description
  const result = classifyToTower({
    vendor_name: vendor.name,
    category: vendor.category,
    description: vendor.description,
    spend: vendor.spend,
  });

  return result.tower;
}

/**
 * N08 — Vendor + tower math.
 * Calculates top-10 concentration, unmapped tail, tower shares,
 * and overlapping categories from vendor spend data.
 *
 * Now uses the Gartner-aligned tower taxonomy for classification.
 * Vendors without a pre-assigned tower are auto-classified using
 * keyword matching against the vendor name, category, and description.
 */
export function calculateVendorMetrics(vendorData: VendorData | null): VendorResult | null {
  if (!vendorData || vendorData.vendors.length === 0) {
    return null;
  }

  const vendors = vendorData.vendors;
  const totalSpend = vendors.reduce((sum, v) => sum + v.spend, 0);

  if (totalSpend <= 0) {
    return null;
  }

  // Top-10 concentration
  const sortedBySpend = [...vendors].sort((a, b) => b.spend - a.spend);
  const top10Spend = sortedBySpend.slice(0, 10).reduce((sum, v) => sum + v.spend, 0);
  const top10Pct = top10Spend / totalSpend;

  // Unmapped tail: vendors with category = '' or 'Unknown' or 'Unmapped'
  const unmappedKeywords = ['', 'unknown', 'unmapped', 'other'];
  const unmappedSpend = vendors
    .filter((v) => unmappedKeywords.includes(v.category.toLowerCase().trim()))
    .reduce((sum, v) => sum + v.spend, 0);
  const unmappedPct = unmappedSpend / totalSpend;

  // Tower shares — use controlled taxonomy with auto-classification
  const towerMap = new Map<string, number>();
  for (const v of vendors) {
    const tower = resolveTower(v);
    towerMap.set(tower, (towerMap.get(tower) ?? 0) + v.spend);
  }
  const towerShares = Array.from(towerMap.entries())
    .map(([tower, spend]) => ({ tower, share: spend / totalSpend, spend }))
    .sort((a, b) => b.spend - a.spend);

  // Overlapping categories: categories served by 3+ vendors
  const categoryVendorCount = new Map<string, Set<string>>();
  for (const v of vendors) {
    const cat = v.category.trim();
    if (!cat || unmappedKeywords.includes(cat.toLowerCase())) continue;
    if (!categoryVendorCount.has(cat)) {
      categoryVendorCount.set(cat, new Set());
    }
    categoryVendorCount.get(cat)!.add(v.name);
  }
  const overlappingCategories = Array.from(categoryVendorCount.entries())
    .filter(([, vendorSet]) => vendorSet.size >= 3)
    .map(([cat]) => cat)
    .sort();

  return {
    top_10_concentration: makeKPI(
      'Top-10 Vendor Concentration',
      top10Pct,
      formatPct(top10Pct),
      'top_10_vendor_spend',
      'total_vendor_spend',
    ),
    unmapped_tail: makeKPI(
      'Unmapped Vendor Tail',
      unmappedPct,
      formatPct(unmappedPct),
      'unmapped_vendor_spend',
      'total_vendor_spend',
    ),
    tower_shares: towerShares,
    overlapping_categories: overlappingCategories,
    total_vendor_count: vendors.length,
  };
}
