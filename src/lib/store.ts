import { v4 as uuidv4 } from 'uuid';
import type { CanonicalAnalysis } from '@/lib/schema/validation';

// ── In-memory analysis store (singleton) ──
// Temporary pattern for local development until Supabase is connected.

const store = new Map<string, CanonicalAnalysis>();

export function createAnalysis(options?: {
  target_diagnostic_level?: string;
}): CanonicalAnalysis {
  const id = uuidv4();

  const analysis: CanonicalAnalysis = {
    id,
    company: {
      company_name: '',
      industry_gics_group: 'Information Technology',
    },
    fiscal_years: [],
    controls: {
      target_diagnostic_level: (options?.target_diagnostic_level as CanonicalAnalysis['controls']['target_diagnostic_level']) ?? 'Quick Read',
      intake_preference: 'Best Available',
      proceed_status: 'draft',
      analysis_name: null,
      analysis_owner: null,
    },
    file_uploads: [],
    vendor_detail_available: false,
    project_portfolio_file_available: false,
    detailed_file_available: false,
  };

  store.set(id, analysis);
  return analysis;
}

export function getAnalysis(id: string): CanonicalAnalysis | null {
  return store.get(id) ?? null;
}

export function updateAnalysis(
  id: string,
  data: Partial<CanonicalAnalysis>,
): CanonicalAnalysis {
  const existing = store.get(id);
  if (!existing) {
    throw new Error(`Analysis not found: ${id}`);
  }
  const updated: CanonicalAnalysis = { ...existing, ...data, id: existing.id };
  store.set(id, updated);
  return updated;
}

export function listAnalyses(): CanonicalAnalysis[] {
  return Array.from(store.values());
}

export function deleteAnalysis(id: string): void {
  store.delete(id);
}
