/**
 * IT Spend Benchmark Database 2026
 * Source: Gartner IT Key Metrics Data 2026
 *
 * All percentage values stored as DECIMALS (0.066 = 6.6%).
 * Dollar values per employee in thousands ($K).
 * This is the single source of truth for all benchmark data.
 */

// ── Types ──

export interface PercentileDistribution {
  p10: number;
  p25: number;
  median: number;
  p75: number;
  p90: number;
}

export interface YoYTrend {
  '2021': number;
  '2022': number | null;
  '2023': number;
  '2024': number;
  '2025': number;
  '2026e': number;
}

export interface SizeBreakout {
  size_band: string;
  value: number;
}

export interface IndustryBenchmark {
  /** Unique industry identifier matching the Excel sheet */
  industry_id: string;
  /** Display name from the Excel */
  display_name: string;
  /** Gartner source reference */
  source_ref: string;
  /** Which GICS group(s) this maps to */
  gics_mapping: string[];

  /** IT Spending % Change Year-over-Year */
  yoy_change: YoYTrend;

  /** IT Spending as % of Revenue (null for Government which uses OpEx only) */
  it_spend_pct_revenue: {
    distribution: PercentileDistribution | null;
    yoy_trend: YoYTrend | null;
    by_size: SizeBreakout[];
  };

  /** IT Spending as % of Operating Expense */
  it_spend_pct_opex: {
    distribution: PercentileDistribution;
    yoy_trend: YoYTrend;
    by_size: SizeBreakout[];
  };

  /** IT Spending per Employee ($000 USD) */
  it_spend_per_employee_k: {
    distribution: PercentileDistribution;
    yoy_trend: YoYTrend;
    by_size: SizeBreakout[];
  };

  /** Summary metrics for 2025 */
  summary: {
    it_fte_pct_employees: number;
    run_pct: number;
    grow_pct: number;
    transform_pct: number;
    opex_pct: number;
    capex_pct: number;
    revenue_per_employee_k: number | null;
    oi_per_employee_k: number | null;
    profitability_pct: number | null;
  };
}

// ── Industry Data ──

export const BENCHMARK_DATABASE: IndustryBenchmark[] = [
  // ───── Banking & Financial Services ─────
  {
    industry_id: 'banking',
    display_name: 'Banking & Financial Services',
    source_ref: 'Gartner ITKMD 2026 (G00840329)',
    gics_mapping: ['Financials'],
    yoy_change: { '2021': 0.059, '2022': 0.071, '2023': 0.062, '2024': 0.092, '2025': 0.048, '2026e': 0.046 },
    it_spend_pct_revenue: {
      distribution: { p10: 0.036, p25: 0.046, median: 0.066, p75: 0.096, p90: 0.127 },
      yoy_trend: { '2021': 0.078, '2022': 0.062, '2023': 0.061, '2024': 0.068, '2025': 0.066, '2026e': 0.067 },
      by_size: [
        { size_band: '<$250M', value: 0.088 },
        { size_band: '$250-500M', value: 0.062 },
        { size_band: '$500M-1B', value: 0.056 },
        { size_band: '$1B-10B', value: 0.057 },
        { size_band: '$10B+', value: 0.082 },
      ],
    },
    it_spend_pct_opex: {
      distribution: { p10: 0.049, p25: 0.059, median: 0.084, p75: 0.123, p90: 0.188 },
      yoy_trend: { '2021': 0.100, '2022': 0.122, '2023': 0.114, '2024': 0.089, '2025': 0.084, '2026e': 0.093 },
      by_size: [],
    },
    it_spend_per_employee_k: {
      distribution: { p10: 19.8, p25: 24.2, median: 35.9, p75: 51.0, p90: 73.2 },
      yoy_trend: { '2021': 26.9, '2022': 26.4, '2023': 32.6, '2024': 38.7, '2025': 35.9, '2026e': 37.4 },
      by_size: [
        { size_band: '<$250M', value: 32.4 },
        { size_band: '$250-500M', value: 14.8 },
        { size_band: '$500M-1B', value: 31.6 },
        { size_band: '$1B-10B', value: 63.7 },
        { size_band: '$10B+', value: 44.9 },
      ],
    },
    summary: {
      it_fte_pct_employees: 0.136,
      run_pct: 0.68, grow_pct: 0.21, transform_pct: 0.11,
      opex_pct: 0.78, capex_pct: 0.22,
      revenue_per_employee_k: 489.9,
      oi_per_employee_k: 87.2,
      profitability_pct: 0.179,
    },
  },

  // ───── Insurance ─────
  {
    industry_id: 'insurance',
    display_name: 'Insurance',
    source_ref: 'Gartner ITKMD 2026 (G00840341)',
    gics_mapping: ['Financials'],
    yoy_change: { '2021': 0.035, '2022': 0.047, '2023': 0.046, '2024': 0.063, '2025': 0.072, '2026e': 0.034 },
    it_spend_pct_revenue: {
      distribution: { p10: 0.014, p25: 0.021, median: 0.036, p75: 0.062, p90: 0.069 },
      yoy_trend: { '2021': 0.036, '2022': 0.030, '2023': 0.033, '2024': 0.039, '2025': 0.036, '2026e': 0.034 },
      by_size: [
        { size_band: '$250-500M', value: 0.036 },
        { size_band: '$500M-1B', value: 0.042 },
        { size_band: '$1B-10B', value: 0.034 },
        { size_band: '$10B+', value: 0.027 },
      ],
    },
    it_spend_pct_opex: {
      distribution: { p10: 0.017, p25: 0.026, median: 0.042, p75: 0.060, p90: 0.074 },
      yoy_trend: { '2021': 0.034, '2022': 0.037, '2023': 0.039, '2024': 0.046, '2025': 0.042, '2026e': 0.046 },
      by_size: [
        { size_band: '$500M-1B', value: 0.039 },
        { size_band: '$1B-10B', value: 0.046 },
        { size_band: '$10B+', value: 0.036 },
      ],
    },
    it_spend_per_employee_k: {
      distribution: { p10: 16.9, p25: 28.2, median: 42.0, p75: 56.6, p90: 92.5 },
      yoy_trend: { '2021': 33.3, '2022': 38.2, '2023': 34.3, '2024': 42.1, '2025': 42.0, '2026e': 43.8 },
      by_size: [
        { size_band: '$250-500M', value: 28.7 },
        { size_band: '$500M-1B', value: 36.0 },
        { size_band: '$1B-10B', value: 48.5 },
        { size_band: '$10B+', value: 47.1 },
      ],
    },
    summary: {
      it_fte_pct_employees: 0.101,
      run_pct: 0.70, grow_pct: 0.19, transform_pct: 0.11,
      opex_pct: 0.77, capex_pct: 0.23,
      revenue_per_employee_k: 556.2,
      oi_per_employee_k: 63.6,
      profitability_pct: 0.117,
    },
  },

  // ───── Energy ─────
  {
    industry_id: 'energy',
    display_name: 'Energy',
    source_ref: 'Gartner ITKMD 2026 (G00840334)',
    gics_mapping: ['Energy'],
    yoy_change: { '2021': 0.055, '2022': 0.096, '2023': 0.070, '2024': 0.080, '2025': 0.092, '2026e': -0.012 },
    it_spend_pct_revenue: {
      distribution: { p10: 0.006, p25: 0.007, median: 0.012, p75: 0.019, p90: 0.026 },
      yoy_trend: { '2021': 0.016, '2022': 0.013, '2023': 0.012, '2024': 0.009, '2025': 0.012, '2026e': 0.011 },
      by_size: [
        { size_band: '$500M-1B', value: 0.014 },
        { size_band: '$1B-10B', value: 0.012 },
        { size_band: '$10B+', value: 0.009 },
      ],
    },
    it_spend_pct_opex: {
      distribution: { p10: 0.008, p25: 0.008, median: 0.016, p75: 0.024, p90: 0.032 },
      yoy_trend: { '2021': 0.016, '2022': 0.013, '2023': 0.017, '2024': 0.011, '2025': 0.016, '2026e': 0.014 },
      by_size: [
        { size_band: '$1B-10B', value: 0.017 },
        { size_band: '$10B+', value: 0.016 },
      ],
    },
    it_spend_per_employee_k: {
      distribution: { p10: 8.0, p25: 11.9, median: 25.6, p75: 36.6, p90: 56.4 },
      yoy_trend: { '2021': 16.5, '2022': 19.8, '2023': 24.1, '2024': 24.6, '2025': 25.6, '2026e': 23.3 },
      by_size: [
        { size_band: '$500M-1B', value: 27.7 },
        { size_band: '$1B-10B', value: 23.3 },
        { size_band: '$10B+', value: 29.4 },
      ],
    },
    summary: {
      it_fte_pct_employees: 0.035,
      run_pct: 0.70, grow_pct: 0.18, transform_pct: 0.12,
      opex_pct: 0.72, capex_pct: 0.28,
      revenue_per_employee_k: 601.9,
      oi_per_employee_k: 71.2,
      profitability_pct: 0.095,
    },
  },

  // ───── Healthcare Providers ─────
  {
    industry_id: 'healthcare',
    display_name: 'Healthcare Providers',
    source_ref: 'Gartner ITKMD 2026 (G00840338)',
    gics_mapping: ['Health Care'],
    yoy_change: { '2021': 0.041, '2022': 0.069, '2023': 0.059, '2024': 0.042, '2025': 0.028, '2026e': 0.037 },
    it_spend_pct_revenue: {
      distribution: { p10: 0.029, p25: 0.037, median: 0.047, p75: 0.061, p90: 0.077 },
      yoy_trend: { '2021': 0.042, '2022': 0.044, '2023': 0.044, '2024': 0.047, '2025': 0.047, '2026e': 0.046 },
      by_size: [
        { size_band: '<$250M', value: 0.066 },
        { size_band: '$250-500M', value: 0.048 },
        { size_band: '$500M-1B', value: 0.046 },
        { size_band: '$1B-10B', value: 0.044 },
        { size_band: '$10B+', value: 0.036 },
      ],
    },
    it_spend_pct_opex: {
      distribution: { p10: 0.033, p25: 0.036, median: 0.050, p75: 0.082, p90: 0.092 },
      yoy_trend: { '2021': 0.044, '2022': 0.046, '2023': 0.044, '2024': 0.047, '2025': 0.050, '2026e': 0.048 },
      by_size: [
        { size_band: '<$250M', value: 0.052 },
        { size_band: '$500M-1B', value: 0.067 },
        { size_band: '$1B-10B', value: 0.037 },
        { size_band: '$10B+', value: 0.038 },
      ],
    },
    it_spend_per_employee_k: {
      distribution: { p10: 3.9, p25: 6.5, median: 9.3, p75: 12.2, p90: 18.0 },
      yoy_trend: { '2021': 7.4, '2022': 7.7, '2023': 9.2, '2024': 8.3, '2025': 9.3, '2026e': 9.7 },
      by_size: [
        { size_band: '<$250M', value: 8.6 },
        { size_band: '$250-500M', value: 8.7 },
        { size_band: '$500M-1B', value: 8.3 },
        { size_band: '$1B-10B', value: 10.0 },
        { size_band: '$10B+', value: 7.9 },
      ],
    },
    summary: {
      it_fte_pct_employees: 0.033,
      run_pct: 0.73, grow_pct: 0.18, transform_pct: 0.09,
      opex_pct: 0.77, capex_pct: 0.23,
      revenue_per_employee_k: 299.2,
      oi_per_employee_k: 18.3,
      profitability_pct: 0.068,
    },
  },

  // ───── Retail & Wholesale ─────
  {
    industry_id: 'retail',
    display_name: 'Retail & Wholesale',
    source_ref: 'Gartner ITKMD 2026 (G00840345)',
    gics_mapping: ['Consumer Discretionary'],
    yoy_change: { '2021': 0.058, '2022': 0.062, '2023': 0.112, '2024': 0.068, '2025': 0.043, '2026e': 0.026 },
    it_spend_pct_revenue: {
      distribution: { p10: 0.006, p25: 0.010, median: 0.016, p75: 0.024, p90: 0.033 },
      yoy_trend: { '2021': 0.017, '2022': 0.015, '2023': 0.014, '2024': 0.016, '2025': 0.016, '2026e': 0.015 },
      by_size: [
        { size_band: '$250-500M', value: 0.026 },
        { size_band: '$500M-1B', value: 0.019 },
        { size_band: '$1B-10B', value: 0.016 },
        { size_band: '$10B+', value: 0.013 },
      ],
    },
    it_spend_pct_opex: {
      distribution: { p10: 0.007, p25: 0.012, median: 0.017, p75: 0.026, p90: 0.034 },
      yoy_trend: { '2021': 0.017, '2022': 0.018, '2023': 0.016, '2024': 0.018, '2025': 0.017, '2026e': 0.017 },
      by_size: [
        { size_band: '$500M-1B', value: 0.021 },
        { size_band: '$1B-10B', value: 0.018 },
        { size_band: '$10B+', value: 0.018 },
      ],
    },
    it_spend_per_employee_k: {
      distribution: { p10: 2.0, p25: 3.4, median: 6.3, p75: 10.6, p90: 16.0 },
      yoy_trend: { '2021': 5.3, '2022': 4.9, '2023': 5.2, '2024': 6.0, '2025': 6.3, '2026e': 6.5 },
      by_size: [
        { size_band: '$250-500M', value: 5.8 },
        { size_band: '$500M-1B', value: 5.8 },
        { size_band: '$1B-10B', value: 6.4 },
        { size_band: '$10B+', value: 4.7 },
      ],
    },
    summary: {
      it_fte_pct_employees: 0.033,
      run_pct: 0.62, grow_pct: 0.25, transform_pct: 0.13,
      opex_pct: 0.72, capex_pct: 0.28,
      revenue_per_employee_k: 414.5,
      oi_per_employee_k: 24.3,
      profitability_pct: 0.053,
    },
  },

  // ───── Utilities ─────
  {
    industry_id: 'utilities',
    display_name: 'Utilities',
    source_ref: 'Gartner ITKMD 2026 (G00840349)',
    gics_mapping: ['Utilities'],
    yoy_change: { '2021': 0.041, '2022': 0.013, '2023': 0.066, '2024': 0.068, '2025': 0.093, '2026e': 0.027 },
    it_spend_pct_revenue: {
      distribution: { p10: 0.019, p25: 0.023, median: 0.037, p75: 0.068, p90: 0.072 },
      yoy_trend: { '2021': 0.036, '2022': 0.036, '2023': 0.029, '2024': 0.033, '2025': 0.037, '2026e': 0.037 },
      by_size: [
        { size_band: '$250-500M', value: 0.049 },
        { size_band: '$500M-1B', value: 0.049 },
        { size_band: '$1B-10B', value: 0.036 },
        { size_band: '$10B+', value: 0.033 },
      ],
    },
    it_spend_pct_opex: {
      distribution: { p10: 0.018, p25: 0.030, median: 0.043, p75: 0.068, p90: 0.094 },
      yoy_trend: { '2021': 0.037, '2022': 0.037, '2023': 0.034, '2024': 0.042, '2025': 0.043, '2026e': 0.044 },
      by_size: [
        { size_band: '$500M-1B', value: 0.047 },
        { size_band: '$1B-10B', value: 0.043 },
        { size_band: '$10B+', value: 0.036 },
      ],
    },
    it_spend_per_employee_k: {
      distribution: { p10: 9.6, p25: 18.9, median: 29.9, p75: 42.4, p90: 60.8 },
      yoy_trend: { '2021': 24.9, '2022': 20.4, '2023': 24.6, '2024': 28.9, '2025': 29.9, '2026e': 30.7 },
      by_size: [
        { size_band: '$250-500M', value: 22.1 },
        { size_band: '$500M-1B', value: 29.6 },
        { size_band: '$1B-10B', value: 26.8 },
        { size_band: '$10B+', value: 31.9 },
      ],
    },
    summary: {
      it_fte_pct_employees: 0.041,
      run_pct: 0.74, grow_pct: 0.16, transform_pct: 0.10,
      opex_pct: 0.72, capex_pct: 0.28,
      revenue_per_employee_k: 547.2,
      oi_per_employee_k: 75.2,
      profitability_pct: 0.141,
    },
  },

  // ───── Telecommunications ─────
  {
    industry_id: 'telecom',
    display_name: 'Telecommunications',
    source_ref: 'Gartner ITKMD 2026 (G00840347)',
    gics_mapping: ['Communication Services'],
    yoy_change: { '2021': 0.089, '2022': -0.004, '2023': 0.046, '2024': -0.004, '2025': 0.071, '2026e': 0.019 },
    it_spend_pct_revenue: {
      distribution: { p10: 0.029, p25: 0.033, median: 0.041, p75: 0.059, p90: 0.081 },
      yoy_trend: { '2021': 0.042, '2022': 0.043, '2023': 0.043, '2024': 0.041, '2025': 0.041, '2026e': 0.041 },
      by_size: [
        { size_band: '$1B-10B', value: 0.046 },
      ],
    },
    it_spend_pct_opex: {
      distribution: { p10: 0.034, p25: 0.038, median: 0.048, p75: 0.071, p90: 0.109 },
      yoy_trend: { '2021': 0.060, '2022': 0.053, '2023': 0.089, '2024': 0.050, '2025': 0.048, '2026e': 0.048 },
      by_size: [
        { size_band: '$1B-10B', value: 0.052 },
      ],
    },
    it_spend_per_employee_k: {
      distribution: { p10: 12.9, p25: 17.0, median: 24.3, p75: 45.2, p90: 51.9 },
      yoy_trend: { '2021': 20.4, '2022': null, '2023': 24.6, '2024': 21.9, '2025': 24.3, '2026e': 24.8 },
      by_size: [
        { size_band: '$500M-1B', value: 16.6 },
        { size_band: '$1B-10B', value: 37.0 },
      ],
    },
    summary: {
      it_fte_pct_employees: 0.083,
      run_pct: 0.65, grow_pct: 0.25, transform_pct: 0.10,
      opex_pct: 0.73, capex_pct: 0.27,
      revenue_per_employee_k: 385.2,
      oi_per_employee_k: 64.5,
      profitability_pct: 0.158,
    },
  },

  // ───── Transportation ─────
  {
    industry_id: 'transportation',
    display_name: 'Transportation',
    source_ref: 'Gartner ITKMD 2026 (G00840348)',
    gics_mapping: ['Industrials'],
    yoy_change: { '2021': 0.041, '2022': 0.062, '2023': 0.067, '2024': 0.052, '2025': 0.079, '2026e': 0.041 },
    it_spend_pct_revenue: {
      distribution: { p10: 0.014, p25: 0.022, median: 0.033, p75: 0.044, p90: 0.073 },
      yoy_trend: { '2021': 0.033, '2022': 0.033, '2023': 0.027, '2024': 0.029, '2025': 0.033, '2026e': 0.031 },
      by_size: [
        { size_band: '$250-500M', value: 0.043 },
        { size_band: '$500M-1B', value: 0.035 },
        { size_band: '$1B-10B', value: 0.036 },
        { size_band: '$10B+', value: 0.026 },
      ],
    },
    it_spend_pct_opex: {
      distribution: { p10: 0.017, p25: 0.026, median: 0.039, p75: 0.059, p90: 0.078 },
      yoy_trend: { '2021': 0.036, '2022': 0.037, '2023': 0.030, '2024': 0.036, '2025': 0.039, '2026e': 0.039 },
      by_size: [
        { size_band: '$500M-1B', value: 0.036 },
        { size_band: '$1B-10B', value: 0.037 },
        { size_band: '$10B+', value: 0.036 },
      ],
    },
    it_spend_per_employee_k: {
      distribution: { p10: 2.9, p25: 5.6, median: 8.8, p75: 15.1, p90: 26.2 },
      yoy_trend: { '2021': 8.1, '2022': 8.0, '2023': 7.4, '2024': 7.0, '2025': 8.8, '2026e': 9.2 },
      by_size: [
        { size_band: '<$250M', value: 5.2 },
        { size_band: '$250-500M', value: 11.7 },
        { size_band: '$500M-1B', value: 7.8 },
        { size_band: '$1B-10B', value: 8.7 },
        { size_band: '$10B+', value: 17.8 },
      ],
    },
    summary: {
      it_fte_pct_employees: 0.042,
      run_pct: 0.66, grow_pct: 0.22, transform_pct: 0.12,
      opex_pct: 0.73, capex_pct: 0.27,
      revenue_per_employee_k: 296.9,
      oi_per_employee_k: 25.1,
      profitability_pct: 0.091,
    },
  },

  // ───── Chemicals ─────
  {
    industry_id: 'chemicals',
    display_name: 'Chemicals',
    source_ref: 'Gartner ITKMD 2026 (G00840330)',
    gics_mapping: ['Materials'],
    yoy_change: { '2021': 0.015, '2022': 0.056, '2023': -0.006, '2024': 0.060, '2025': 0.052, '2026e': 0.010 },
    it_spend_pct_revenue: {
      distribution: { p10: 0.009, p25: 0.013, median: 0.018, p75: 0.024, p90: 0.033 },
      yoy_trend: { '2021': 0.018, '2022': 0.016, '2023': 0.013, '2024': 0.018, '2025': 0.018, '2026e': 0.018 },
      by_size: [
        { size_band: '$1B-10B', value: 0.018 },
      ],
    },
    it_spend_pct_opex: {
      distribution: { p10: 0.008, p25: 0.014, median: 0.019, p75: 0.029, p90: 0.038 },
      yoy_trend: { '2021': 0.018, '2022': 0.017, '2023': 0.018, '2024': 0.016, '2025': 0.019, '2026e': 0.019 },
      by_size: [],
    },
    it_spend_per_employee_k: {
      distribution: { p10: 6.3, p25: 7.3, median: 9.9, p75: 14.3, p90: 18.9 },
      yoy_trend: { '2021': 8.6, '2022': 8.1, '2023': 6.2, '2024': 8.7, '2025': 9.9, '2026e': 10.6 },
      by_size: [
        { size_band: '$1B-10B', value: 10.5 },
      ],
    },
    summary: {
      it_fte_pct_employees: 0.042,
      run_pct: 0.66, grow_pct: 0.22, transform_pct: 0.12,
      opex_pct: 0.72, capex_pct: 0.28,
      revenue_per_employee_k: 554.5,
      oi_per_employee_k: 65.3,
      profitability_pct: 0.119,
    },
  },

  // ───── Consumer Products ─────
  {
    industry_id: 'consumer-products',
    display_name: 'Consumer Products',
    source_ref: 'Gartner ITKMD 2026 (G00840332)',
    gics_mapping: ['Consumer Staples'],
    yoy_change: { '2021': 0.068, '2022': 0.072, '2023': 0.097, '2024': 0.064, '2025': 0.039, '2026e': 0.028 },
    it_spend_pct_revenue: {
      distribution: { p10: 0.020, p25: 0.023, median: 0.030, p75: 0.037, p90: 0.058 },
      yoy_trend: { '2021': 0.026, '2022': 0.025, '2023': 0.023, '2024': 0.028, '2025': 0.030, '2026e': 0.030 },
      by_size: [
        { size_band: '<$250M', value: 0.027 },
        { size_band: '$250-500M', value: 0.036 },
        { size_band: '$500M-1B', value: 0.034 },
        { size_band: '$1B-10B', value: 0.029 },
        { size_band: '$10B+', value: 0.029 },
      ],
    },
    it_spend_pct_opex: {
      distribution: { p10: 0.022, p25: 0.027, median: 0.033, p75: 0.046, p90: 0.064 },
      yoy_trend: { '2021': 0.028, '2022': 0.028, '2023': 0.029, '2024': 0.032, '2025': 0.033, '2026e': 0.032 },
      by_size: [
        { size_band: '<$250M', value: 0.032 },
        { size_band: '$500M-1B', value: 0.036 },
        { size_band: '$1B-10B', value: 0.032 },
      ],
    },
    it_spend_per_employee_k: {
      distribution: { p10: 3.6, p25: 5.9, median: 10.6, p75: 15.4, p90: 25.1 },
      yoy_trend: { '2021': 9.0, '2022': 9.3, '2023': 10.0, '2024': 10.4, '2025': 10.6, '2026e': 10.9 },
      by_size: [
        { size_band: '<$250M', value: 8.8 },
        { size_band: '$250-500M', value: 8.3 },
        { size_band: '$500M-1B', value: 10.0 },
        { size_band: '$1B-10B', value: 8.9 },
        { size_band: '$10B+', value: 18.3 },
      ],
    },
    summary: {
      it_fte_pct_employees: 0.058,
      run_pct: 0.66, grow_pct: 0.21, transform_pct: 0.13,
      opex_pct: 0.75, capex_pct: 0.25,
      revenue_per_employee_k: 428.1,
      oi_per_employee_k: 48.1,
      profitability_pct: 0.121,
    },
  },

  // ───── Industrial Manufacturing ─────
  {
    industry_id: 'industrial-manufacturing',
    display_name: 'Industrial Manufacturing',
    source_ref: 'Gartner ITKMD 2026 (G00840340)',
    gics_mapping: ['Industrials'],
    yoy_change: { '2021': 0.046, '2022': 0.059, '2023': 0.062, '2024': 0.075, '2025': 0.062, '2026e': 0.028 },
    it_spend_pct_revenue: {
      distribution: { p10: 0.011, p25: 0.016, median: 0.023, p75: 0.029, p90: 0.042 },
      yoy_trend: { '2021': 0.026, '2022': 0.019, '2023': 0.019, '2024': 0.020, '2025': 0.023, '2026e': 0.022 },
      by_size: [
        { size_band: '$500M-1B', value: 0.026 },
        { size_band: '$1B-10B', value: 0.023 },
        { size_band: '$10B+', value: 0.036 },
      ],
    },
    it_spend_pct_opex: {
      distribution: { p10: 0.012, p25: 0.018, median: 0.026, p75: 0.031, p90: 0.045 },
      yoy_trend: { '2021': 0.021, '2022': 0.021, '2023': 0.021, '2024': 0.023, '2025': 0.026, '2026e': 0.026 },
      by_size: [
        { size_band: '$500M-1B', value: 0.040 },
        { size_band: '$1B-10B', value: 0.026 },
        { size_band: '$10B+', value: 0.026 },
      ],
    },
    it_spend_per_employee_k: {
      distribution: { p10: 2.9, p25: 5.0, median: 7.4, p75: 10.9, p90: 15.1 },
      yoy_trend: { '2021': 5.6, '2022': 6.3, '2023': 6.5, '2024': 6.8, '2025': 7.4, '2026e': 7.7 },
      by_size: [
        { size_band: '$500M-1B', value: 7.1 },
        { size_band: '$1B-10B', value: 7.3 },
        { size_band: '$10B+', value: 8.7 },
      ],
    },
    summary: {
      it_fte_pct_employees: 0.043,
      run_pct: 0.64, grow_pct: 0.22, transform_pct: 0.14,
      opex_pct: 0.71, capex_pct: 0.29,
      revenue_per_employee_k: 336.1,
      oi_per_employee_k: 35.2,
      profitability_pct: 0.107,
    },
  },

  // ───── Media & Entertainment ─────
  {
    industry_id: 'media',
    display_name: 'Media & Entertainment',
    source_ref: 'Gartner ITKMD 2026 (G00840342)',
    gics_mapping: ['Communication Services'],
    yoy_change: { '2021': -0.023, '2022': 0.037, '2023': 0.022, '2024': 0.062, '2025': 0.037, '2026e': 0.018 },
    it_spend_pct_revenue: {
      distribution: { p10: 0.021, p25: 0.034, median: 0.054, p75: 0.082, p90: 0.118 },
      yoy_trend: { '2021': 0.066, '2022': 0.055, '2023': 0.066, '2024': 0.059, '2025': 0.064, '2026e': 0.053 },
      by_size: [
        { size_band: '<$250M', value: 0.066 },
        { size_band: '$1B-10B', value: 0.078 },
      ],
    },
    it_spend_pct_opex: {
      distribution: { p10: 0.024, p25: 0.036, median: 0.076, p75: 0.102, p90: 0.187 },
      yoy_trend: { '2021': 0.083, '2022': 0.065, '2023': 0.087, '2024': 0.047, '2025': 0.076, '2026e': 0.066 },
      by_size: [
        { size_band: '$1B-10B', value: 0.063 },
      ],
    },
    it_spend_per_employee_k: {
      distribution: { p10: 3.3, p25: 9.6, median: 17.8, p75: 33.8, p90: 60.8 },
      yoy_trend: { '2021': 22.9, '2022': 17.2, '2023': 18.4, '2024': 19.3, '2025': 17.8, '2026e': 16.2 },
      by_size: [
        { size_band: '<$250M', value: 13.7 },
        { size_band: '$1B-10B', value: 28.5 },
      ],
    },
    summary: {
      it_fte_pct_employees: 0.103,
      run_pct: 0.60, grow_pct: 0.28, transform_pct: 0.12,
      opex_pct: 0.79, capex_pct: 0.21,
      revenue_per_employee_k: 413.3,
      oi_per_employee_k: 48.6,
      profitability_pct: 0.132,
    },
  },

  // ───── Professional Services ─────
  {
    industry_id: 'professional-services',
    display_name: 'Professional Services',
    source_ref: 'Gartner ITKMD 2026 (G00840344)',
    gics_mapping: ['Industrials'],
    yoy_change: { '2021': 0.058, '2022': -0.022, '2023': 0.068, '2024': 0.055, '2025': 0.067, '2026e': 0.036 },
    it_spend_pct_revenue: {
      distribution: { p10: 0.014, p25: 0.024, median: 0.041, p75: 0.062, p90: 0.089 },
      yoy_trend: { '2021': 0.041, '2022': 0.044, '2023': 0.046, '2024': 0.045, '2025': 0.041, '2026e': 0.046 },
      by_size: [
        { size_band: '<$250M', value: 0.064 },
        { size_band: '$250-500M', value: 0.056 },
        { size_band: '$500M-1B', value: 0.059 },
        { size_band: '$1B-10B', value: 0.032 },
        { size_band: '$10B+', value: 0.021 },
      ],
    },
    it_spend_pct_opex: {
      distribution: { p10: 0.019, p25: 0.027, median: 0.051, p75: 0.081, p90: 0.103 },
      yoy_trend: { '2021': 0.049, '2022': null, '2023': 0.051, '2024': 0.049, '2025': 0.051, '2026e': 0.050 },
      by_size: [
        { size_band: '$500M-1B', value: 0.043 },
        { size_band: '$1B-10B', value: 0.041 },
        { size_band: '$10B+', value: 0.036 },
      ],
    },
    it_spend_per_employee_k: {
      distribution: { p10: 4.5, p25: 6.6, median: 10.6, p75: 18.1, p90: 27.5 },
      yoy_trend: { '2021': 9.6, '2022': 9.6, '2023': 10.2, '2024': 10.6, '2025': 10.6, '2026e': 11.0 },
      by_size: [
        { size_band: '<$250M', value: 11.3 },
        { size_band: '$250-500M', value: 10.9 },
        { size_band: '$500M-1B', value: 11.6 },
        { size_band: '$1B-10B', value: 10.7 },
        { size_band: '$10B+', value: 7.3 },
      ],
    },
    summary: {
      it_fte_pct_employees: 0.061,
      run_pct: 0.63, grow_pct: 0.25, transform_pct: 0.12,
      opex_pct: 0.78, capex_pct: 0.22,
      revenue_per_employee_k: 242.0,
      oi_per_employee_k: 38.5,
      profitability_pct: 0.143,
    },
  },

  // ───── Software Publishing & Internet Services ─────
  {
    industry_id: 'software',
    display_name: 'Software Publishing & Internet Services',
    source_ref: 'Gartner ITKMD 2026 (G00840346)',
    gics_mapping: ['Information Technology'],
    yoy_change: { '2021': 0.035, '2022': 0.066, '2023': 0.073, '2024': 0.000, '2025': 0.048, '2026e': -0.005 },
    it_spend_pct_revenue: {
      distribution: { p10: 0.039, p25: 0.049, median: 0.067, p75: 0.096, p90: 0.179 },
      yoy_trend: { '2021': 0.062, '2022': 0.048, '2023': 0.069, '2024': 0.066, '2025': 0.067, '2026e': 0.063 },
      by_size: [
        { size_band: '$500M-1B', value: 0.066 },
        { size_band: '$1B-10B', value: 0.066 },
      ],
    },
    it_spend_pct_opex: {
      distribution: { p10: 0.031, p25: 0.061, median: 0.074, p75: 0.109, p90: 0.187 },
      yoy_trend: { '2021': 0.074, '2022': 0.066, '2023': 0.080, '2024': 0.046, '2025': 0.074, '2026e': 0.071 },
      by_size: [
        { size_band: '$500M-1B', value: 0.076 },
        { size_band: '$1B-10B', value: 0.074 },
      ],
    },
    it_spend_per_employee_k: {
      distribution: { p10: 11.6, p25: 14.1, median: 18.8, p75: 29.5, p90: 58.1 },
      yoy_trend: { '2021': 16.1, '2022': 16.2, '2023': 18.5, '2024': 17.8, '2025': 18.8, '2026e': 16.7 },
      by_size: [
        { size_band: '$500M-1B', value: 18.6 },
        { size_band: '$1B-10B', value: 18.7 },
      ],
    },
    summary: {
      it_fte_pct_employees: 0.233,
      run_pct: 0.58, grow_pct: 0.24, transform_pct: 0.18,
      opex_pct: 0.82, capex_pct: 0.18,
      revenue_per_employee_k: 451.9,
      oi_per_employee_k: 62.0,
      profitability_pct: 0.142,
    },
  },

  // ───── Government — National & International ─────
  {
    industry_id: 'government',
    display_name: 'Government — National & International',
    source_ref: 'Gartner ITKMD 2026 (G00840336)',
    gics_mapping: [],  // No standard GICS mapping
    yoy_change: { '2021': 0.061, '2022': 0.047, '2023': 0.056, '2024': 0.050, '2025': 0.026, '2026e': -0.003 },
    it_spend_pct_revenue: {
      distribution: null,  // Government uses OpEx instead of Revenue
      yoy_trend: null,
      by_size: [],
    },
    it_spend_pct_opex: {
      distribution: { p10: 0.050, p25: 0.066, median: 0.113, p75: 0.193, p90: 0.256 },
      yoy_trend: { '2021': 0.112, '2022': 0.100, '2023': 0.118, '2024': 0.126, '2025': 0.113, '2026e': 0.109 },
      by_size: [
        { size_band: '<$250M', value: 0.167 },
        { size_band: '$250-500M', value: 0.041 },
        { size_band: '$1B-10B', value: 0.051 },
      ],
    },
    it_spend_per_employee_k: {
      distribution: { p10: 6.3, p25: 16.0, median: 27.1, p75: 51.7, p90: 76.2 },
      yoy_trend: { '2021': 28.7, '2022': 22.0, '2023': 24.4, '2024': 22.8, '2025': 27.1, '2026e': 27.1 },
      by_size: [
        { size_band: '<$250M', value: 17.2 },
        { size_band: '$250-500M', value: 11.7 },
        { size_band: '$500M-1B', value: 34.6 },
        { size_band: '$1B-10B', value: 38.1 },
        { size_band: '$10B+', value: 14.9 },
      ],
    },
    summary: {
      it_fte_pct_employees: 0.072,
      run_pct: 0.78, grow_pct: 0.13, transform_pct: 0.09,
      opex_pct: 0.80, capex_pct: 0.20,
      revenue_per_employee_k: null,
      oi_per_employee_k: null,
      profitability_pct: null,
    },
  },
];

// ── Lookup Helpers ──

/** All available industry IDs */
export const INDUSTRY_IDS = BENCHMARK_DATABASE.map(b => b.industry_id);

/** Look up benchmark by industry_id (e.g., 'banking', 'energy') */
export function getIndustryBenchmark(industryId: string): IndustryBenchmark | null {
  return BENCHMARK_DATABASE.find(b => b.industry_id === industryId) ?? null;
}

/** Look up benchmark by display name (case-insensitive partial match) */
export function findIndustryByName(name: string): IndustryBenchmark | null {
  const lower = name.toLowerCase();
  return BENCHMARK_DATABASE.find(
    b => b.display_name.toLowerCase() === lower
      || b.display_name.toLowerCase().includes(lower)
      || b.industry_id === lower,
  ) ?? null;
}

/**
 * GICS group → best matching industry benchmark.
 * Some GICS groups map to multiple industries (e.g., Financials → Banking + Insurance).
 * Returns the primary match (first one found).
 */
const GICS_TO_PRIMARY: Record<string, string> = {
  'Energy': 'energy',
  'Materials': 'chemicals',
  'Industrials': 'industrial-manufacturing',
  'Consumer Discretionary': 'retail',
  'Consumer Staples': 'consumer-products',
  'Health Care': 'healthcare',
  'Financials': 'banking',
  'Information Technology': 'software',
  'Communication Services': 'telecom',
  'Utilities': 'utilities',
  'Real Estate': 'banking',  // Closest proxy — high IT intensity, property tech
};

/** Look up primary industry benchmark by GICS group name */
export function getIndustryByGics(gicsGroup: string): IndustryBenchmark | null {
  const id = GICS_TO_PRIMARY[gicsGroup];
  if (!id) return null;
  return getIndustryBenchmark(id);
}

/** Get all industries that map to a given GICS group */
export function getIndustriesByGics(gicsGroup: string): IndustryBenchmark[] {
  return BENCHMARK_DATABASE.filter(b => b.gics_mapping.includes(gicsGroup));
}
