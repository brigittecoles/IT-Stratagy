#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// ══════════════════════════════════════════════════════════════
// Benchmark Database — Gartner IT Key Metrics Data 2026
// All percentage values stored as DECIMALS (0.066 = 6.6%)
// Dollar values per employee in thousands ($K)
// ══════════════════════════════════════════════════════════════

interface PercentileDistribution {
  p10: number;
  p25: number;
  median: number;
  p75: number;
  p90: number;
}

interface SizeBreakout {
  size_band: string;
  value: number;
}

interface IndustryBenchmark {
  industry_id: string;
  display_name: string;
  source_ref: string;
  gics_mapping: string[];
  yoy_change: Record<string, number | null>;
  it_spend_pct_revenue: {
    distribution: PercentileDistribution | null;
    yoy_trend: Record<string, number | null> | null;
    by_size: SizeBreakout[];
  };
  it_spend_pct_opex: {
    distribution: PercentileDistribution;
    yoy_trend: Record<string, number | null>;
    by_size: SizeBreakout[];
  };
  it_spend_per_employee_k: {
    distribution: PercentileDistribution;
    yoy_trend: Record<string, number | null>;
    by_size: SizeBreakout[];
  };
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

const BENCHMARK_DB: IndustryBenchmark[] = [
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
        { size_band: '<$250M', value: 0.088 }, { size_band: '$250-500M', value: 0.062 },
        { size_band: '$500M-1B', value: 0.056 }, { size_band: '$1B-10B', value: 0.057 },
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
        { size_band: '<$250M', value: 32.4 }, { size_band: '$250-500M', value: 14.8 },
        { size_band: '$500M-1B', value: 31.6 }, { size_band: '$1B-10B', value: 63.7 },
        { size_band: '$10B+', value: 44.9 },
      ],
    },
    summary: { it_fte_pct_employees: 0.136, run_pct: 0.68, grow_pct: 0.21, transform_pct: 0.11, opex_pct: 0.78, capex_pct: 0.22, revenue_per_employee_k: 489.9, oi_per_employee_k: 87.2, profitability_pct: 0.179 },
  },
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
        { size_band: '$250-500M', value: 0.036 }, { size_band: '$500M-1B', value: 0.042 },
        { size_band: '$1B-10B', value: 0.034 }, { size_band: '$10B+', value: 0.027 },
      ],
    },
    it_spend_pct_opex: {
      distribution: { p10: 0.017, p25: 0.026, median: 0.042, p75: 0.060, p90: 0.074 },
      yoy_trend: { '2021': 0.034, '2022': 0.037, '2023': 0.039, '2024': 0.046, '2025': 0.042, '2026e': 0.046 },
      by_size: [{ size_band: '$500M-1B', value: 0.039 }, { size_band: '$1B-10B', value: 0.046 }, { size_band: '$10B+', value: 0.036 }],
    },
    it_spend_per_employee_k: {
      distribution: { p10: 16.9, p25: 28.2, median: 42.0, p75: 56.6, p90: 92.5 },
      yoy_trend: { '2021': 33.3, '2022': 38.2, '2023': 34.3, '2024': 42.1, '2025': 42.0, '2026e': 43.8 },
      by_size: [{ size_band: '$250-500M', value: 28.7 }, { size_band: '$500M-1B', value: 36.0 }, { size_band: '$1B-10B', value: 48.5 }, { size_band: '$10B+', value: 47.1 }],
    },
    summary: { it_fte_pct_employees: 0.101, run_pct: 0.70, grow_pct: 0.19, transform_pct: 0.11, opex_pct: 0.77, capex_pct: 0.23, revenue_per_employee_k: 556.2, oi_per_employee_k: 63.6, profitability_pct: 0.117 },
  },
  {
    industry_id: 'energy',
    display_name: 'Energy',
    source_ref: 'Gartner ITKMD 2026 (G00840334)',
    gics_mapping: ['Energy'],
    yoy_change: { '2021': 0.055, '2022': 0.096, '2023': 0.070, '2024': 0.080, '2025': 0.092, '2026e': -0.012 },
    it_spend_pct_revenue: {
      distribution: { p10: 0.006, p25: 0.007, median: 0.012, p75: 0.019, p90: 0.026 },
      yoy_trend: { '2021': 0.016, '2022': 0.013, '2023': 0.012, '2024': 0.009, '2025': 0.012, '2026e': 0.011 },
      by_size: [{ size_band: '$500M-1B', value: 0.014 }, { size_band: '$1B-10B', value: 0.012 }, { size_band: '$10B+', value: 0.009 }],
    },
    it_spend_pct_opex: {
      distribution: { p10: 0.008, p25: 0.008, median: 0.016, p75: 0.024, p90: 0.032 },
      yoy_trend: { '2021': 0.016, '2022': 0.013, '2023': 0.017, '2024': 0.011, '2025': 0.016, '2026e': 0.014 },
      by_size: [{ size_band: '$1B-10B', value: 0.017 }, { size_band: '$10B+', value: 0.016 }],
    },
    it_spend_per_employee_k: {
      distribution: { p10: 8.0, p25: 11.9, median: 25.6, p75: 36.6, p90: 56.4 },
      yoy_trend: { '2021': 16.5, '2022': 19.8, '2023': 24.1, '2024': 24.6, '2025': 25.6, '2026e': 23.3 },
      by_size: [{ size_band: '$500M-1B', value: 27.7 }, { size_band: '$1B-10B', value: 23.3 }, { size_band: '$10B+', value: 29.4 }],
    },
    summary: { it_fte_pct_employees: 0.035, run_pct: 0.70, grow_pct: 0.18, transform_pct: 0.12, opex_pct: 0.72, capex_pct: 0.28, revenue_per_employee_k: 601.9, oi_per_employee_k: 71.2, profitability_pct: 0.095 },
  },
  {
    industry_id: 'healthcare',
    display_name: 'Healthcare Providers',
    source_ref: 'Gartner ITKMD 2026 (G00840338)',
    gics_mapping: ['Health Care'],
    yoy_change: { '2021': 0.041, '2022': 0.069, '2023': 0.059, '2024': 0.042, '2025': 0.028, '2026e': 0.037 },
    it_spend_pct_revenue: {
      distribution: { p10: 0.029, p25: 0.037, median: 0.047, p75: 0.061, p90: 0.077 },
      yoy_trend: { '2021': 0.042, '2022': 0.044, '2023': 0.044, '2024': 0.047, '2025': 0.047, '2026e': 0.046 },
      by_size: [{ size_band: '<$250M', value: 0.066 }, { size_band: '$250-500M', value: 0.048 }, { size_band: '$500M-1B', value: 0.046 }, { size_band: '$1B-10B', value: 0.044 }, { size_band: '$10B+', value: 0.036 }],
    },
    it_spend_pct_opex: {
      distribution: { p10: 0.033, p25: 0.036, median: 0.050, p75: 0.082, p90: 0.092 },
      yoy_trend: { '2021': 0.044, '2022': 0.046, '2023': 0.044, '2024': 0.047, '2025': 0.050, '2026e': 0.048 },
      by_size: [{ size_band: '<$250M', value: 0.052 }, { size_band: '$500M-1B', value: 0.067 }, { size_band: '$1B-10B', value: 0.037 }, { size_band: '$10B+', value: 0.038 }],
    },
    it_spend_per_employee_k: {
      distribution: { p10: 3.9, p25: 6.5, median: 9.3, p75: 12.2, p90: 18.0 },
      yoy_trend: { '2021': 7.4, '2022': 7.7, '2023': 9.2, '2024': 8.3, '2025': 9.3, '2026e': 9.7 },
      by_size: [{ size_band: '<$250M', value: 8.6 }, { size_band: '$250-500M', value: 8.7 }, { size_band: '$500M-1B', value: 8.3 }, { size_band: '$1B-10B', value: 10.0 }, { size_band: '$10B+', value: 7.9 }],
    },
    summary: { it_fte_pct_employees: 0.033, run_pct: 0.73, grow_pct: 0.18, transform_pct: 0.09, opex_pct: 0.77, capex_pct: 0.23, revenue_per_employee_k: 299.2, oi_per_employee_k: 18.3, profitability_pct: 0.068 },
  },
  {
    industry_id: 'retail',
    display_name: 'Retail & Wholesale',
    source_ref: 'Gartner ITKMD 2026 (G00840345)',
    gics_mapping: ['Consumer Discretionary'],
    yoy_change: { '2021': 0.058, '2022': 0.062, '2023': 0.112, '2024': 0.068, '2025': 0.043, '2026e': 0.026 },
    it_spend_pct_revenue: {
      distribution: { p10: 0.006, p25: 0.010, median: 0.016, p75: 0.024, p90: 0.033 },
      yoy_trend: { '2021': 0.017, '2022': 0.015, '2023': 0.014, '2024': 0.016, '2025': 0.016, '2026e': 0.015 },
      by_size: [{ size_band: '$250-500M', value: 0.026 }, { size_band: '$500M-1B', value: 0.019 }, { size_band: '$1B-10B', value: 0.016 }, { size_band: '$10B+', value: 0.013 }],
    },
    it_spend_pct_opex: {
      distribution: { p10: 0.007, p25: 0.012, median: 0.017, p75: 0.026, p90: 0.034 },
      yoy_trend: { '2021': 0.017, '2022': 0.018, '2023': 0.016, '2024': 0.018, '2025': 0.017, '2026e': 0.017 },
      by_size: [{ size_band: '$500M-1B', value: 0.021 }, { size_band: '$1B-10B', value: 0.018 }, { size_band: '$10B+', value: 0.018 }],
    },
    it_spend_per_employee_k: {
      distribution: { p10: 2.0, p25: 3.4, median: 6.3, p75: 10.6, p90: 16.0 },
      yoy_trend: { '2021': 5.3, '2022': 4.9, '2023': 5.2, '2024': 6.0, '2025': 6.3, '2026e': 6.5 },
      by_size: [{ size_band: '$250-500M', value: 5.8 }, { size_band: '$500M-1B', value: 5.8 }, { size_band: '$1B-10B', value: 6.4 }, { size_band: '$10B+', value: 4.7 }],
    },
    summary: { it_fte_pct_employees: 0.033, run_pct: 0.62, grow_pct: 0.25, transform_pct: 0.13, opex_pct: 0.72, capex_pct: 0.28, revenue_per_employee_k: 414.5, oi_per_employee_k: 24.3, profitability_pct: 0.053 },
  },
  {
    industry_id: 'utilities',
    display_name: 'Utilities',
    source_ref: 'Gartner ITKMD 2026 (G00840349)',
    gics_mapping: ['Utilities'],
    yoy_change: { '2021': 0.041, '2022': 0.013, '2023': 0.066, '2024': 0.068, '2025': 0.093, '2026e': 0.027 },
    it_spend_pct_revenue: {
      distribution: { p10: 0.019, p25: 0.023, median: 0.037, p75: 0.068, p90: 0.072 },
      yoy_trend: { '2021': 0.036, '2022': 0.036, '2023': 0.029, '2024': 0.033, '2025': 0.037, '2026e': 0.037 },
      by_size: [{ size_band: '$250-500M', value: 0.049 }, { size_band: '$500M-1B', value: 0.049 }, { size_band: '$1B-10B', value: 0.036 }, { size_band: '$10B+', value: 0.033 }],
    },
    it_spend_pct_opex: {
      distribution: { p10: 0.018, p25: 0.030, median: 0.043, p75: 0.068, p90: 0.094 },
      yoy_trend: { '2021': 0.037, '2022': 0.037, '2023': 0.034, '2024': 0.042, '2025': 0.043, '2026e': 0.044 },
      by_size: [{ size_band: '$500M-1B', value: 0.047 }, { size_band: '$1B-10B', value: 0.043 }, { size_band: '$10B+', value: 0.036 }],
    },
    it_spend_per_employee_k: {
      distribution: { p10: 9.6, p25: 18.9, median: 29.9, p75: 42.4, p90: 60.8 },
      yoy_trend: { '2021': 24.9, '2022': 20.4, '2023': 24.6, '2024': 28.9, '2025': 29.9, '2026e': 30.7 },
      by_size: [{ size_band: '$250-500M', value: 22.1 }, { size_band: '$500M-1B', value: 29.6 }, { size_band: '$1B-10B', value: 26.8 }, { size_band: '$10B+', value: 31.9 }],
    },
    summary: { it_fte_pct_employees: 0.041, run_pct: 0.74, grow_pct: 0.16, transform_pct: 0.10, opex_pct: 0.72, capex_pct: 0.28, revenue_per_employee_k: 547.2, oi_per_employee_k: 75.2, profitability_pct: 0.141 },
  },
  {
    industry_id: 'telecom',
    display_name: 'Telecommunications',
    source_ref: 'Gartner ITKMD 2026 (G00840347)',
    gics_mapping: ['Communication Services'],
    yoy_change: { '2021': 0.089, '2022': -0.004, '2023': 0.046, '2024': -0.004, '2025': 0.071, '2026e': 0.019 },
    it_spend_pct_revenue: {
      distribution: { p10: 0.029, p25: 0.033, median: 0.041, p75: 0.059, p90: 0.081 },
      yoy_trend: { '2021': 0.042, '2022': 0.043, '2023': 0.043, '2024': 0.041, '2025': 0.041, '2026e': 0.041 },
      by_size: [{ size_band: '$1B-10B', value: 0.046 }],
    },
    it_spend_pct_opex: {
      distribution: { p10: 0.034, p25: 0.038, median: 0.048, p75: 0.071, p90: 0.109 },
      yoy_trend: { '2021': 0.060, '2022': 0.053, '2023': 0.089, '2024': 0.050, '2025': 0.048, '2026e': 0.048 },
      by_size: [{ size_band: '$1B-10B', value: 0.052 }],
    },
    it_spend_per_employee_k: {
      distribution: { p10: 12.9, p25: 17.0, median: 24.3, p75: 45.2, p90: 51.9 },
      yoy_trend: { '2021': 20.4, '2022': null, '2023': 24.6, '2024': 21.9, '2025': 24.3, '2026e': 24.8 },
      by_size: [{ size_band: '$500M-1B', value: 16.6 }, { size_band: '$1B-10B', value: 37.0 }],
    },
    summary: { it_fte_pct_employees: 0.083, run_pct: 0.65, grow_pct: 0.25, transform_pct: 0.10, opex_pct: 0.73, capex_pct: 0.27, revenue_per_employee_k: 385.2, oi_per_employee_k: 64.5, profitability_pct: 0.158 },
  },
  {
    industry_id: 'transportation',
    display_name: 'Transportation',
    source_ref: 'Gartner ITKMD 2026 (G00840348)',
    gics_mapping: ['Industrials'],
    yoy_change: { '2021': 0.041, '2022': 0.062, '2023': 0.067, '2024': 0.052, '2025': 0.079, '2026e': 0.041 },
    it_spend_pct_revenue: {
      distribution: { p10: 0.014, p25: 0.022, median: 0.033, p75: 0.044, p90: 0.073 },
      yoy_trend: { '2021': 0.033, '2022': 0.033, '2023': 0.027, '2024': 0.029, '2025': 0.033, '2026e': 0.031 },
      by_size: [{ size_band: '$250-500M', value: 0.043 }, { size_band: '$500M-1B', value: 0.035 }, { size_band: '$1B-10B', value: 0.036 }, { size_band: '$10B+', value: 0.026 }],
    },
    it_spend_pct_opex: {
      distribution: { p10: 0.017, p25: 0.026, median: 0.039, p75: 0.059, p90: 0.078 },
      yoy_trend: { '2021': 0.036, '2022': 0.037, '2023': 0.030, '2024': 0.036, '2025': 0.039, '2026e': 0.039 },
      by_size: [{ size_band: '$500M-1B', value: 0.036 }, { size_band: '$1B-10B', value: 0.037 }, { size_band: '$10B+', value: 0.036 }],
    },
    it_spend_per_employee_k: {
      distribution: { p10: 2.9, p25: 5.6, median: 8.8, p75: 15.1, p90: 26.2 },
      yoy_trend: { '2021': 8.1, '2022': 8.0, '2023': 7.4, '2024': 7.0, '2025': 8.8, '2026e': 9.2 },
      by_size: [{ size_band: '<$250M', value: 5.2 }, { size_band: '$250-500M', value: 11.7 }, { size_band: '$500M-1B', value: 7.8 }, { size_band: '$1B-10B', value: 8.7 }, { size_band: '$10B+', value: 17.8 }],
    },
    summary: { it_fte_pct_employees: 0.042, run_pct: 0.66, grow_pct: 0.22, transform_pct: 0.12, opex_pct: 0.73, capex_pct: 0.27, revenue_per_employee_k: 296.9, oi_per_employee_k: 25.1, profitability_pct: 0.091 },
  },
  {
    industry_id: 'chemicals',
    display_name: 'Chemicals',
    source_ref: 'Gartner ITKMD 2026 (G00840330)',
    gics_mapping: ['Materials'],
    yoy_change: { '2021': 0.015, '2022': 0.056, '2023': -0.006, '2024': 0.060, '2025': 0.052, '2026e': 0.010 },
    it_spend_pct_revenue: {
      distribution: { p10: 0.009, p25: 0.013, median: 0.018, p75: 0.024, p90: 0.033 },
      yoy_trend: { '2021': 0.018, '2022': 0.016, '2023': 0.013, '2024': 0.018, '2025': 0.018, '2026e': 0.018 },
      by_size: [{ size_band: '$1B-10B', value: 0.018 }],
    },
    it_spend_pct_opex: {
      distribution: { p10: 0.008, p25: 0.014, median: 0.019, p75: 0.029, p90: 0.038 },
      yoy_trend: { '2021': 0.018, '2022': 0.017, '2023': 0.018, '2024': 0.016, '2025': 0.019, '2026e': 0.019 },
      by_size: [],
    },
    it_spend_per_employee_k: {
      distribution: { p10: 6.3, p25: 7.3, median: 9.9, p75: 14.3, p90: 18.9 },
      yoy_trend: { '2021': 8.6, '2022': 8.1, '2023': 6.2, '2024': 8.7, '2025': 9.9, '2026e': 10.6 },
      by_size: [{ size_band: '$1B-10B', value: 10.5 }],
    },
    summary: { it_fte_pct_employees: 0.042, run_pct: 0.66, grow_pct: 0.22, transform_pct: 0.12, opex_pct: 0.72, capex_pct: 0.28, revenue_per_employee_k: 554.5, oi_per_employee_k: 65.3, profitability_pct: 0.119 },
  },
  {
    industry_id: 'consumer-products',
    display_name: 'Consumer Products',
    source_ref: 'Gartner ITKMD 2026 (G00840332)',
    gics_mapping: ['Consumer Staples'],
    yoy_change: { '2021': 0.068, '2022': 0.072, '2023': 0.097, '2024': 0.064, '2025': 0.039, '2026e': 0.028 },
    it_spend_pct_revenue: {
      distribution: { p10: 0.020, p25: 0.023, median: 0.030, p75: 0.037, p90: 0.058 },
      yoy_trend: { '2021': 0.026, '2022': 0.025, '2023': 0.023, '2024': 0.028, '2025': 0.030, '2026e': 0.030 },
      by_size: [{ size_band: '<$250M', value: 0.027 }, { size_band: '$250-500M', value: 0.036 }, { size_band: '$500M-1B', value: 0.034 }, { size_band: '$1B-10B', value: 0.029 }, { size_band: '$10B+', value: 0.029 }],
    },
    it_spend_pct_opex: {
      distribution: { p10: 0.022, p25: 0.027, median: 0.033, p75: 0.046, p90: 0.064 },
      yoy_trend: { '2021': 0.028, '2022': 0.028, '2023': 0.029, '2024': 0.032, '2025': 0.033, '2026e': 0.032 },
      by_size: [{ size_band: '<$250M', value: 0.032 }, { size_band: '$500M-1B', value: 0.036 }, { size_band: '$1B-10B', value: 0.032 }],
    },
    it_spend_per_employee_k: {
      distribution: { p10: 3.6, p25: 5.9, median: 10.6, p75: 15.4, p90: 25.1 },
      yoy_trend: { '2021': 9.0, '2022': 9.3, '2023': 10.0, '2024': 10.4, '2025': 10.6, '2026e': 10.9 },
      by_size: [{ size_band: '<$250M', value: 8.8 }, { size_band: '$250-500M', value: 8.3 }, { size_band: '$500M-1B', value: 10.0 }, { size_band: '$1B-10B', value: 8.9 }, { size_band: '$10B+', value: 18.3 }],
    },
    summary: { it_fte_pct_employees: 0.058, run_pct: 0.66, grow_pct: 0.21, transform_pct: 0.13, opex_pct: 0.75, capex_pct: 0.25, revenue_per_employee_k: 428.1, oi_per_employee_k: 48.1, profitability_pct: 0.121 },
  },
  {
    industry_id: 'industrial-manufacturing',
    display_name: 'Industrial Manufacturing',
    source_ref: 'Gartner ITKMD 2026 (G00840340)',
    gics_mapping: ['Industrials'],
    yoy_change: { '2021': 0.046, '2022': 0.059, '2023': 0.062, '2024': 0.075, '2025': 0.062, '2026e': 0.028 },
    it_spend_pct_revenue: {
      distribution: { p10: 0.011, p25: 0.016, median: 0.023, p75: 0.029, p90: 0.042 },
      yoy_trend: { '2021': 0.026, '2022': 0.019, '2023': 0.019, '2024': 0.020, '2025': 0.023, '2026e': 0.022 },
      by_size: [{ size_band: '$500M-1B', value: 0.026 }, { size_band: '$1B-10B', value: 0.023 }, { size_band: '$10B+', value: 0.036 }],
    },
    it_spend_pct_opex: {
      distribution: { p10: 0.012, p25: 0.018, median: 0.026, p75: 0.031, p90: 0.045 },
      yoy_trend: { '2021': 0.021, '2022': 0.021, '2023': 0.021, '2024': 0.023, '2025': 0.026, '2026e': 0.026 },
      by_size: [{ size_band: '$500M-1B', value: 0.040 }, { size_band: '$1B-10B', value: 0.026 }, { size_band: '$10B+', value: 0.026 }],
    },
    it_spend_per_employee_k: {
      distribution: { p10: 2.9, p25: 5.0, median: 7.4, p75: 10.9, p90: 15.1 },
      yoy_trend: { '2021': 5.6, '2022': 6.3, '2023': 6.5, '2024': 6.8, '2025': 7.4, '2026e': 7.7 },
      by_size: [{ size_band: '$500M-1B', value: 7.1 }, { size_band: '$1B-10B', value: 7.3 }, { size_band: '$10B+', value: 8.7 }],
    },
    summary: { it_fte_pct_employees: 0.043, run_pct: 0.64, grow_pct: 0.22, transform_pct: 0.14, opex_pct: 0.71, capex_pct: 0.29, revenue_per_employee_k: 336.1, oi_per_employee_k: 35.2, profitability_pct: 0.107 },
  },
  {
    industry_id: 'media',
    display_name: 'Media & Entertainment',
    source_ref: 'Gartner ITKMD 2026 (G00840342)',
    gics_mapping: ['Communication Services'],
    yoy_change: { '2021': -0.023, '2022': 0.037, '2023': 0.022, '2024': 0.062, '2025': 0.037, '2026e': 0.018 },
    it_spend_pct_revenue: {
      distribution: { p10: 0.021, p25: 0.034, median: 0.054, p75: 0.082, p90: 0.118 },
      yoy_trend: { '2021': 0.066, '2022': 0.055, '2023': 0.066, '2024': 0.059, '2025': 0.064, '2026e': 0.053 },
      by_size: [{ size_band: '<$250M', value: 0.066 }, { size_band: '$1B-10B', value: 0.078 }],
    },
    it_spend_pct_opex: {
      distribution: { p10: 0.024, p25: 0.036, median: 0.076, p75: 0.102, p90: 0.187 },
      yoy_trend: { '2021': 0.083, '2022': 0.065, '2023': 0.087, '2024': 0.047, '2025': 0.076, '2026e': 0.066 },
      by_size: [{ size_band: '$1B-10B', value: 0.063 }],
    },
    it_spend_per_employee_k: {
      distribution: { p10: 3.3, p25: 9.6, median: 17.8, p75: 33.8, p90: 60.8 },
      yoy_trend: { '2021': 22.9, '2022': 17.2, '2023': 18.4, '2024': 19.3, '2025': 17.8, '2026e': 16.2 },
      by_size: [{ size_band: '<$250M', value: 13.7 }, { size_band: '$1B-10B', value: 28.5 }],
    },
    summary: { it_fte_pct_employees: 0.103, run_pct: 0.60, grow_pct: 0.28, transform_pct: 0.12, opex_pct: 0.79, capex_pct: 0.21, revenue_per_employee_k: 413.3, oi_per_employee_k: 48.6, profitability_pct: 0.132 },
  },
  {
    industry_id: 'professional-services',
    display_name: 'Professional Services',
    source_ref: 'Gartner ITKMD 2026 (G00840344)',
    gics_mapping: ['Industrials'],
    yoy_change: { '2021': 0.058, '2022': -0.022, '2023': 0.068, '2024': 0.055, '2025': 0.067, '2026e': 0.036 },
    it_spend_pct_revenue: {
      distribution: { p10: 0.014, p25: 0.024, median: 0.041, p75: 0.062, p90: 0.089 },
      yoy_trend: { '2021': 0.041, '2022': 0.044, '2023': 0.046, '2024': 0.045, '2025': 0.041, '2026e': 0.046 },
      by_size: [{ size_band: '<$250M', value: 0.064 }, { size_band: '$250-500M', value: 0.056 }, { size_band: '$500M-1B', value: 0.059 }, { size_band: '$1B-10B', value: 0.032 }, { size_band: '$10B+', value: 0.021 }],
    },
    it_spend_pct_opex: {
      distribution: { p10: 0.019, p25: 0.027, median: 0.051, p75: 0.081, p90: 0.103 },
      yoy_trend: { '2021': 0.049, '2022': null, '2023': 0.051, '2024': 0.049, '2025': 0.051, '2026e': 0.050 },
      by_size: [{ size_band: '$500M-1B', value: 0.043 }, { size_band: '$1B-10B', value: 0.041 }, { size_band: '$10B+', value: 0.036 }],
    },
    it_spend_per_employee_k: {
      distribution: { p10: 4.5, p25: 6.6, median: 10.6, p75: 18.1, p90: 27.5 },
      yoy_trend: { '2021': 9.6, '2022': 9.6, '2023': 10.2, '2024': 10.6, '2025': 10.6, '2026e': 11.0 },
      by_size: [{ size_band: '<$250M', value: 11.3 }, { size_band: '$250-500M', value: 10.9 }, { size_band: '$500M-1B', value: 11.6 }, { size_band: '$1B-10B', value: 10.7 }, { size_band: '$10B+', value: 7.3 }],
    },
    summary: { it_fte_pct_employees: 0.061, run_pct: 0.63, grow_pct: 0.25, transform_pct: 0.12, opex_pct: 0.78, capex_pct: 0.22, revenue_per_employee_k: 242.0, oi_per_employee_k: 38.5, profitability_pct: 0.143 },
  },
  {
    industry_id: 'software',
    display_name: 'Software Publishing & Internet Services',
    source_ref: 'Gartner ITKMD 2026 (G00840346)',
    gics_mapping: ['Information Technology'],
    yoy_change: { '2021': 0.035, '2022': 0.066, '2023': 0.073, '2024': 0.000, '2025': 0.048, '2026e': -0.005 },
    it_spend_pct_revenue: {
      distribution: { p10: 0.039, p25: 0.049, median: 0.067, p75: 0.096, p90: 0.179 },
      yoy_trend: { '2021': 0.062, '2022': 0.048, '2023': 0.069, '2024': 0.066, '2025': 0.067, '2026e': 0.063 },
      by_size: [{ size_band: '$500M-1B', value: 0.066 }, { size_band: '$1B-10B', value: 0.066 }],
    },
    it_spend_pct_opex: {
      distribution: { p10: 0.031, p25: 0.061, median: 0.074, p75: 0.109, p90: 0.187 },
      yoy_trend: { '2021': 0.074, '2022': 0.066, '2023': 0.080, '2024': 0.046, '2025': 0.074, '2026e': 0.071 },
      by_size: [{ size_band: '$500M-1B', value: 0.076 }, { size_band: '$1B-10B', value: 0.074 }],
    },
    it_spend_per_employee_k: {
      distribution: { p10: 11.6, p25: 14.1, median: 18.8, p75: 29.5, p90: 58.1 },
      yoy_trend: { '2021': 16.1, '2022': 16.2, '2023': 18.5, '2024': 17.8, '2025': 18.8, '2026e': 16.7 },
      by_size: [{ size_band: '$500M-1B', value: 18.6 }, { size_band: '$1B-10B', value: 18.7 }],
    },
    summary: { it_fte_pct_employees: 0.233, run_pct: 0.58, grow_pct: 0.24, transform_pct: 0.18, opex_pct: 0.82, capex_pct: 0.18, revenue_per_employee_k: 451.9, oi_per_employee_k: 62.0, profitability_pct: 0.142 },
  },
  {
    industry_id: 'government',
    display_name: 'Government — National & International',
    source_ref: 'Gartner ITKMD 2026 (G00840336)',
    gics_mapping: [],
    yoy_change: { '2021': 0.061, '2022': 0.047, '2023': 0.056, '2024': 0.050, '2025': 0.026, '2026e': -0.003 },
    it_spend_pct_revenue: { distribution: null, yoy_trend: null, by_size: [] },
    it_spend_pct_opex: {
      distribution: { p10: 0.050, p25: 0.066, median: 0.113, p75: 0.193, p90: 0.256 },
      yoy_trend: { '2021': 0.112, '2022': 0.100, '2023': 0.118, '2024': 0.126, '2025': 0.113, '2026e': 0.109 },
      by_size: [{ size_band: '<$250M', value: 0.167 }, { size_band: '$250-500M', value: 0.041 }, { size_band: '$1B-10B', value: 0.051 }],
    },
    it_spend_per_employee_k: {
      distribution: { p10: 6.3, p25: 16.0, median: 27.1, p75: 51.7, p90: 76.2 },
      yoy_trend: { '2021': 28.7, '2022': 22.0, '2023': 24.4, '2024': 22.8, '2025': 27.1, '2026e': 27.1 },
      by_size: [{ size_band: '<$250M', value: 17.2 }, { size_band: '$250-500M', value: 11.7 }, { size_band: '$500M-1B', value: 34.6 }, { size_band: '$1B-10B', value: 38.1 }, { size_band: '$10B+', value: 14.9 }],
    },
    summary: { it_fte_pct_employees: 0.072, run_pct: 0.78, grow_pct: 0.13, transform_pct: 0.09, opex_pct: 0.80, capex_pct: 0.20, revenue_per_employee_k: null, oi_per_employee_k: null, profitability_pct: null },
  },
];

// ── Lookup helpers ──

const GICS_TO_PRIMARY: Record<string, string> = {
  'Energy': 'energy', 'Materials': 'chemicals', 'Industrials': 'industrial-manufacturing',
  'Consumer Discretionary': 'retail', 'Consumer Staples': 'consumer-products',
  'Health Care': 'healthcare', 'Financials': 'banking',
  'Information Technology': 'software', 'Communication Services': 'telecom',
  'Utilities': 'utilities', 'Real Estate': 'banking',
};

function findBenchmark(query: string): IndustryBenchmark | null {
  const lower = query.toLowerCase();
  // Exact industry_id
  let match = BENCHMARK_DB.find(b => b.industry_id === lower);
  if (match) return match;
  // Exact display name
  match = BENCHMARK_DB.find(b => b.display_name.toLowerCase() === lower);
  if (match) return match;
  // GICS mapping
  const primaryId = GICS_TO_PRIMARY[query];
  if (primaryId) return BENCHMARK_DB.find(b => b.industry_id === primaryId) ?? null;
  // Partial match
  return BENCHMARK_DB.find(b =>
    b.display_name.toLowerCase().includes(lower) || b.industry_id.includes(lower),
  ) ?? null;
}

// ══════════════════════════════════════════════════════════════
// In-memory store
// ══════════════════════════════════════════════════════════════

interface Analysis {
  id: string;
  company_name: string;
  industry_gics_group: string;
  business_model: string | null;
  regulatory_complexity: string | null;
  operating_complexity: string | null;
  pricing_premium_complexity: string | null;
  complexity_notes: string | null;
  fiscal_years: FiscalYearData[];
  controls: {
    target_diagnostic_level: string;
    intake_preference: string;
    proceed_status: string;
  };
  files: FileUpload[];
  results: AnalysisResults | null;
  created_at: string;
  updated_at: string;
}

interface FiscalYearData {
  fiscal_year_label: string;
  fiscal_year_order: number;
  revenue: number | null;
  total_it_spend: number | null;
  it_opex_spend: number | null;
  it_capex_spend: number | null;
  it_da_spend: number | null;
  employee_count: number | null;
  it_fte_count: number | null;
  contractor_count: number | null;
  contractor_spend: number | null;
  outsourced_spend: number | null;
  internal_labor_spend: number | null;
  transformation_status: string | null;
  transformation_type: string[] | null;
  transformation_spend_estimate: number | null;
  transformation_rolloff_timing: string | null;
  roadmap_available: boolean | null;
}

interface FileUpload {
  zone: string;
  file_name: string;
  status: string;
}

interface AnalysisResults {
  qualified_level: string;
  overall_confidence: string;
  executive_summary: string;
  key_findings: string[];
  caveats: string[];
  kpis: Record<string, { value: number; formatted: string }>;
  benchmark_gaps: Record<string, { gap_pct: number; gap_dollars: number }>;
  opportunities: { module: string; low: number; base: number; high: number; confidence: string }[];
  recommendations: { title: string; description: string; value_range: string; priority: string }[];
  qa_passed: boolean;
  qa_checks: { name: string; passed: boolean; severity: string }[];
}

const store = new Map<string, Analysis>();

// ── Helper functions ──

const INDUSTRY_LIST = BENCHMARK_DB.map(b => b.display_name);
const GICS_GROUPS = [
  'Energy', 'Materials', 'Industrials', 'Consumer Discretionary',
  'Consumer Staples', 'Health Care', 'Financials',
  'Information Technology', 'Communication Services',
  'Utilities', 'Real Estate',
];
const ALL_INDUSTRIES = [...new Set([...GICS_GROUPS, ...INDUSTRY_LIST])];

const DIAGNOSTIC_LEVELS = ['Quick Read', 'Standard Diagnostic', 'Full Diagnostic', 'Full Diagnostic with Vendor + Roadmap Intelligence'];

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function safeDiv(num: number | null, den: number | null): number | null {
  if (num == null || den == null || den === 0) return null;
  return num / den;
}

function determineQualification(analysis: Analysis): { level: string; missing: string[] } {
  const currentYear = analysis.fiscal_years.find(y => y.fiscal_year_label === 'Current Fiscal Year');
  const missing: string[] = [];

  if (!analysis.company_name) missing.push('company_name');
  if (!analysis.industry_gics_group) missing.push('industry_gics_group');
  if (!currentYear?.revenue) missing.push('revenue');
  if (!currentYear?.total_it_spend) missing.push('total_it_spend');
  if (!analysis.fiscal_years.some(y => y.transformation_status)) missing.push('transformation_status');
  if (missing.length > 0) return { level: 'Insufficient Data', missing };

  const stdMissing: string[] = [];
  if (!currentYear?.it_opex_spend) stdMissing.push('it_opex_spend');
  if (!currentYear?.it_capex_spend) stdMissing.push('it_capex_spend');
  if (!currentYear?.employee_count) stdMissing.push('employee_count');
  if (!currentYear?.it_fte_count) stdMissing.push('it_fte_count');
  if (stdMissing.length > 0) return { level: 'Quick Read', missing: stdMissing };

  const hasDetailedFile = analysis.files.some(f => f.status !== 'Failed');
  if (!hasDetailedFile) return { level: 'Standard Diagnostic', missing: ['at least one detailed file'] };

  const hasVendor = analysis.files.some(f => f.zone === 'IT Vendors');
  const hasRoadmap = analysis.files.some(f => f.zone === 'Project Portfolio / Roadmap');
  if (!hasVendor || !hasRoadmap) {
    const vrMissing: string[] = [];
    if (!hasVendor) vrMissing.push('IT Vendors file');
    if (!hasRoadmap) vrMissing.push('Project Portfolio / Roadmap file');
    return { level: 'Full Diagnostic', missing: vrMissing };
  }

  return { level: 'Full Diagnostic with Vendor + Roadmap Intelligence', missing: [] };
}

function runAnalysis(analysis: Analysis): AnalysisResults {
  const { level } = determineQualification(analysis);
  const currentYear = analysis.fiscal_years.find(y => y.fiscal_year_label === 'Current Fiscal Year');
  const priorYear = analysis.fiscal_years.find(y => y.fiscal_year_label === 'Last Fiscal Year');

  // Core KPIs
  const kpis: Record<string, { value: number; formatted: string }> = {};
  const rev = currentYear?.revenue;
  const itSpend = currentYear?.total_it_spend;
  const opex = currentYear?.it_opex_spend;
  const capex = currentYear?.it_capex_spend;

  const itPctRev = safeDiv(itSpend ?? null, rev ?? null);
  if (itPctRev != null) kpis['it_spend_pct_revenue'] = { value: itPctRev, formatted: formatPct(itPctRev) };

  const opexPctRev = safeDiv(opex ?? null, rev ?? null);
  if (opexPctRev != null) kpis['opex_pct_revenue'] = { value: opexPctRev, formatted: formatPct(opexPctRev) };

  const capexPctRev = safeDiv(capex ?? null, rev ?? null);
  if (capexPctRev != null) kpis['capex_pct_revenue'] = { value: capexPctRev, formatted: formatPct(capexPctRev) };

  const opexMix = safeDiv(opex ?? null, itSpend ?? null);
  if (opexMix != null) kpis['opex_mix'] = { value: opexMix, formatted: formatPct(opexMix) };

  const capexMix = safeDiv(capex ?? null, itSpend ?? null);
  if (capexMix != null) kpis['capex_mix'] = { value: capexMix, formatted: formatPct(capexMix) };

  // Benchmark comparison — use real Gartner data
  const benchmark = findBenchmark(analysis.industry_gics_group);
  const median = benchmark?.it_spend_pct_revenue?.distribution?.median ?? 0.035;
  const benchmark_gaps: Record<string, { gap_pct: number; gap_dollars: number }> = {};
  if (itPctRev != null && rev) {
    const gapPct = itPctRev - median;
    benchmark_gaps['it_spend_pct_revenue'] = { gap_pct: gapPct, gap_dollars: gapPct * rev };
  }

  // Opportunities
  const opportunities: AnalysisResults['opportunities'] = [];
  if (currentYear?.transformation_status === 'Yes' && currentYear.transformation_spend_estimate) {
    opportunities.push({
      module: 'Post-Transformation Cost Normalization',
      low: currentYear.transformation_spend_estimate * 0.15,
      base: currentYear.transformation_spend_estimate * 0.30,
      high: currentYear.transformation_spend_estimate * 0.50,
      confidence: currentYear.roadmap_available ? 'High' : 'Medium',
    });
  }
  if (benchmark_gaps['it_spend_pct_revenue'] && benchmark_gaps['it_spend_pct_revenue'].gap_dollars > 0) {
    const gap = benchmark_gaps['it_spend_pct_revenue'].gap_dollars;
    opportunities.push({
      module: 'Automation Gap Closure',
      low: gap * 0.05, base: gap * 0.12, high: gap * 0.20,
      confidence: 'Medium',
    });
  }

  // QA checks
  const qa_checks = [
    { name: 'Company name present', passed: !!analysis.company_name, severity: 'Critical' },
    { name: 'Revenue > 0', passed: (rev ?? 0) > 0, severity: 'Critical' },
    { name: 'Total IT spend > 0', passed: (itSpend ?? 0) > 0, severity: 'Critical' },
    { name: 'Industry maps to benchmark', passed: benchmark != null, severity: 'Critical' },
    { name: 'Transformation status present', passed: analysis.fiscal_years.some(y => y.transformation_status != null), severity: 'Critical' },
    { name: 'OpEx + CapEx reasonable', passed: !opex || !capex || !itSpend || (opex + capex <= itSpend * 1.05), severity: 'Warning' },
    { name: 'IT FTE <= Employee count', passed: !currentYear?.it_fte_count || !currentYear?.employee_count || currentYear.it_fte_count <= currentYear.employee_count, severity: 'Warning' },
  ];
  const criticalFails = qa_checks.filter(c => c.severity === 'Critical' && !c.passed).length;
  const warnings = qa_checks.filter(c => c.severity === 'Warning' && !c.passed).length;
  const confidence = criticalFails > 0 ? 'Low' : warnings > 0 ? 'Medium' : 'High';

  // Narrative with benchmark context
  const companyName = analysis.company_name;
  const industryName = benchmark?.display_name ?? analysis.industry_gics_group;
  const executive_summary = `${companyName} operates in the ${industryName} sector${itPctRev != null ? ` with IT spending at ${formatPct(itPctRev)} of revenue` : ''}. ${
    benchmark_gaps['it_spend_pct_revenue']
      ? `This is ${benchmark_gaps['it_spend_pct_revenue'].gap_pct > 0 ? 'above' : 'below'} the Gartner 2025 industry median of ${formatPct(median)} by ${formatPct(Math.abs(benchmark_gaps['it_spend_pct_revenue'].gap_pct))}, representing a ${formatCurrency(Math.abs(benchmark_gaps['it_spend_pct_revenue'].gap_dollars))} gap.`
      : 'Benchmark comparison is available for the primary IT spend metric.'
  }${currentYear?.transformation_status === 'Yes' ? ' Active transformation investment may account for a portion of elevated spending.' : ''}`;

  const key_findings: string[] = [];
  if (itPctRev != null) key_findings.push(`IT spend represents ${formatPct(itPctRev)} of revenue (${itSpend ? formatCurrency(itSpend) : 'N/A'})`);
  if (opexMix != null) key_findings.push(`OpEx/CapEx mix is ${formatPct(opexMix)} / ${formatPct(1 - opexMix)}`);
  if (benchmark && benchmark.it_spend_pct_revenue.distribution) {
    const dist = benchmark.it_spend_pct_revenue.distribution;
    key_findings.push(`Industry benchmarks (P25/Median/P75): ${formatPct(dist.p25)} / ${formatPct(dist.median)} / ${formatPct(dist.p75)}`);
  }
  if (benchmark_gaps['it_spend_pct_revenue']) {
    const g = benchmark_gaps['it_spend_pct_revenue'];
    key_findings.push(`Benchmark gap vs median: ${g.gap_pct > 0 ? '+' : ''}${formatPct(g.gap_pct)} (${formatCurrency(g.gap_dollars)})`);
  }
  if (opportunities.length > 0) {
    const totalBase = opportunities.reduce((s, o) => s + o.base, 0);
    key_findings.push(`Total opportunity (base case): ${formatCurrency(totalBase)}`);
  }

  const caveats: string[] = [];
  if (level === 'Quick Read') caveats.push('Analysis limited to Quick Read level due to missing inputs.');
  if (warnings > 0) caveats.push(`${warnings} data quality warning(s) flagged — review recommended.`);
  if (!priorYear) caveats.push('No prior year data available — year-over-year trends cannot be calculated.');

  const recommendations = opportunities.map(o => ({
    title: o.module,
    description: `Estimated ${formatCurrency(o.base)} opportunity (base case) with ${o.confidence} confidence.`,
    value_range: `${formatCurrency(o.low)} – ${formatCurrency(o.high)}`,
    priority: o.confidence === 'High' ? 'High' : 'Medium',
  }));

  return {
    qualified_level: level,
    overall_confidence: confidence,
    executive_summary,
    key_findings,
    caveats,
    kpis,
    benchmark_gaps,
    opportunities,
    recommendations,
    qa_passed: criticalFails === 0,
    qa_checks,
  };
}

// ══════════════════════════════════════════════════════════════
// MCP Server Setup
// ══════════════════════════════════════════════════════════════

const server = new McpServer({
  name: 'it-strategy-diagnostic',
  version: '2.0.0',
});

// ── Tool: get_benchmarks ──
server.tool(
  'get_benchmarks',
  'Get IT spending benchmark data for an industry. Returns full percentile distributions (P10/P25/Median/P75/P90), YoY trends (2021-2026), breakouts by company size, and summary metrics (IT FTE %, Run/Grow/Transform, OpEx/CapEx split). Available industries: banking, insurance, energy, healthcare, retail, utilities, telecom, transportation, chemicals, consumer-products, industrial-manufacturing, media, professional-services, software, government. Also accepts GICS group names.',
  {
    industry: z.string().describe('Industry ID (e.g., "banking", "energy") or GICS group name (e.g., "Financials", "Health Care"). Use "all" to list all available industries.'),
    metric: z.enum(['all', 'it_spend_pct_revenue', 'it_spend_pct_opex', 'it_spend_per_employee', 'summary', 'yoy_change']).optional().describe('Which metric to return (default: all)'),
  },
  async ({ industry, metric }) => {
    // List all industries
    if (industry === 'all') {
      const summary = BENCHMARK_DB.map(b => ({
        industry_id: b.industry_id,
        display_name: b.display_name,
        gics_mapping: b.gics_mapping,
        it_spend_pct_revenue_median: b.it_spend_pct_revenue.distribution?.median ?? null,
        it_spend_pct_opex_median: b.it_spend_pct_opex.distribution.median,
        it_spend_per_employee_k_median: b.it_spend_per_employee_k.distribution.median,
      }));
      return { content: [{ type: 'text' as const, text: JSON.stringify(summary, null, 2) }] };
    }

    const benchmark = findBenchmark(industry);
    if (!benchmark) {
      const available = BENCHMARK_DB.map(b => `${b.industry_id} (${b.display_name})`).join(', ');
      return { content: [{ type: 'text' as const, text: JSON.stringify({ error: `Industry "${industry}" not found. Available: ${available}` }) }] };
    }

    const m = metric ?? 'all';
    let result: unknown;

    switch (m) {
      case 'it_spend_pct_revenue':
        result = { industry: benchmark.display_name, source: benchmark.source_ref, ...benchmark.it_spend_pct_revenue };
        break;
      case 'it_spend_pct_opex':
        result = { industry: benchmark.display_name, source: benchmark.source_ref, ...benchmark.it_spend_pct_opex };
        break;
      case 'it_spend_per_employee':
        result = { industry: benchmark.display_name, source: benchmark.source_ref, ...benchmark.it_spend_per_employee_k, note: 'Values in $000 USD' };
        break;
      case 'summary':
        result = { industry: benchmark.display_name, source: benchmark.source_ref, ...benchmark.summary };
        break;
      case 'yoy_change':
        result = { industry: benchmark.display_name, source: benchmark.source_ref, yoy_change: benchmark.yoy_change };
        break;
      default:
        result = benchmark;
    }

    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  }
);

// ── Tool: create_analysis ──
server.tool(
  'create_analysis',
  'Create a new IT strategy analysis. Returns the analysis ID.',
  {
    company_name: z.string().describe('Company name'),
    industry_gics_group: z.string().describe('Industry — use a GICS group (e.g., "Financials") or specific industry (e.g., "Banking & Financial Services")'),
    target_diagnostic_level: z.enum(DIAGNOSTIC_LEVELS as unknown as [string, ...string[]]).optional().describe('Target diagnostic level'),
  },
  async ({ company_name, industry_gics_group, target_diagnostic_level }) => {
    const id = uuidv4();
    const analysis: Analysis = {
      id,
      company_name,
      industry_gics_group,
      business_model: null,
      regulatory_complexity: null,
      operating_complexity: null,
      pricing_premium_complexity: null,
      complexity_notes: null,
      fiscal_years: [{
        fiscal_year_label: 'Current Fiscal Year',
        fiscal_year_order: 1,
        revenue: null, total_it_spend: null, it_opex_spend: null,
        it_capex_spend: null, it_da_spend: null, employee_count: null,
        it_fte_count: null, contractor_count: null, contractor_spend: null,
        outsourced_spend: null, internal_labor_spend: null,
        transformation_status: null, transformation_type: null,
        transformation_spend_estimate: null, transformation_rolloff_timing: null,
        roadmap_available: null,
      }],
      controls: {
        target_diagnostic_level: target_diagnostic_level ?? 'Quick Read',
        intake_preference: 'Best Available',
        proceed_status: 'draft',
      },
      files: [],
      results: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.set(id, analysis);

    // Include benchmark preview for the selected industry
    const benchmark = findBenchmark(industry_gics_group);
    const benchmarkPreview = benchmark ? {
      matched_industry: benchmark.display_name,
      it_spend_pct_revenue_median: benchmark.it_spend_pct_revenue.distribution?.median ?? null,
      it_spend_per_employee_k_median: benchmark.it_spend_per_employee_k.distribution.median,
    } : null;

    return { content: [{ type: 'text' as const, text: JSON.stringify({
      id,
      message: `Analysis created for ${company_name}`,
      benchmark_preview: benchmarkPreview,
    }) }] };
  }
);

// ── Tool: submit_intake ──
server.tool(
  'submit_intake',
  'Submit financial, workforce, and transformation data for an analysis.',
  {
    analysis_id: z.string().uuid().describe('Analysis ID'),
    fiscal_year_label: z.enum(['Current Fiscal Year', 'Last Fiscal Year']).optional().describe('Which fiscal year'),
    revenue: z.number().positive().optional().describe('Revenue in dollars'),
    total_it_spend: z.number().positive().optional().describe('Total IT spend in dollars'),
    it_opex_spend: z.number().nonnegative().optional().describe('IT OpEx in dollars'),
    it_capex_spend: z.number().nonnegative().optional().describe('IT CapEx in dollars'),
    it_da_spend: z.number().nonnegative().optional().describe('IT D&A in dollars'),
    employee_count: z.number().int().positive().optional().describe('Total employees'),
    it_fte_count: z.number().int().positive().optional().describe('IT FTEs'),
    contractor_count: z.number().int().nonnegative().optional().describe('IT contractors'),
    contractor_spend: z.number().nonnegative().optional().describe('Contractor spend'),
    outsourced_spend: z.number().nonnegative().optional().describe('Outsourced spend'),
    internal_labor_spend: z.number().nonnegative().optional().describe('Internal labor spend'),
    transformation_status: z.enum(['Yes', 'No', 'Unsure']).optional().describe('Transformation active?'),
    transformation_type: z.array(z.string()).optional().describe('Transformation types'),
    transformation_spend_estimate: z.number().nonnegative().optional().describe('Transformation spend'),
    transformation_rolloff_timing: z.string().optional().describe('Roll-off timing'),
    roadmap_available: z.boolean().optional().describe('Roadmap file available?'),
    business_model: z.string().optional().describe('Business model'),
    regulatory_complexity: z.enum(['Low', 'Moderate', 'High']).optional(),
    operating_complexity: z.enum(['Low', 'Moderate', 'High']).optional(),
    pricing_premium_complexity: z.enum(['Low', 'Moderate', 'High']).optional(),
  },
  async (params) => {
    const analysis = store.get(params.analysis_id);
    if (!analysis) return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Analysis not found' }) }] };

    const yearLabel = params.fiscal_year_label ?? 'Current Fiscal Year';
    let year = analysis.fiscal_years.find(y => y.fiscal_year_label === yearLabel);
    if (!year) {
      year = {
        fiscal_year_label: yearLabel,
        fiscal_year_order: analysis.fiscal_years.length + 1,
        revenue: null, total_it_spend: null, it_opex_spend: null,
        it_capex_spend: null, it_da_spend: null, employee_count: null,
        it_fte_count: null, contractor_count: null, contractor_spend: null,
        outsourced_spend: null, internal_labor_spend: null,
        transformation_status: null, transformation_type: null,
        transformation_spend_estimate: null, transformation_rolloff_timing: null,
        roadmap_available: null,
      };
      analysis.fiscal_years.push(year);
    }

    if (params.revenue !== undefined) year.revenue = params.revenue;
    if (params.total_it_spend !== undefined) year.total_it_spend = params.total_it_spend;
    if (params.it_opex_spend !== undefined) year.it_opex_spend = params.it_opex_spend;
    if (params.it_capex_spend !== undefined) year.it_capex_spend = params.it_capex_spend;
    if (params.it_da_spend !== undefined) year.it_da_spend = params.it_da_spend;
    if (params.employee_count !== undefined) year.employee_count = params.employee_count;
    if (params.it_fte_count !== undefined) year.it_fte_count = params.it_fte_count;
    if (params.contractor_count !== undefined) year.contractor_count = params.contractor_count;
    if (params.contractor_spend !== undefined) year.contractor_spend = params.contractor_spend;
    if (params.outsourced_spend !== undefined) year.outsourced_spend = params.outsourced_spend;
    if (params.internal_labor_spend !== undefined) year.internal_labor_spend = params.internal_labor_spend;
    if (params.transformation_status !== undefined) year.transformation_status = params.transformation_status;
    if (params.transformation_type !== undefined) year.transformation_type = params.transformation_type;
    if (params.transformation_spend_estimate !== undefined) year.transformation_spend_estimate = params.transformation_spend_estimate;
    if (params.transformation_rolloff_timing !== undefined) year.transformation_rolloff_timing = params.transformation_rolloff_timing;
    if (params.roadmap_available !== undefined) year.roadmap_available = params.roadmap_available;

    if (params.business_model !== undefined) analysis.business_model = params.business_model;
    if (params.regulatory_complexity !== undefined) analysis.regulatory_complexity = params.regulatory_complexity;
    if (params.operating_complexity !== undefined) analysis.operating_complexity = params.operating_complexity;
    if (params.pricing_premium_complexity !== undefined) analysis.pricing_premium_complexity = params.pricing_premium_complexity;

    analysis.updated_at = new Date().toISOString();
    const qual = determineQualification(analysis);

    return { content: [{ type: 'text' as const, text: JSON.stringify({
      message: `Intake data saved for ${yearLabel}`,
      qualified_level: qual.level,
      missing_for_next: qual.missing,
    }) }] };
  }
);

// ── Tool: check_qualification ──
server.tool(
  'check_qualification',
  'Check what diagnostic level the analysis currently qualifies for.',
  { analysis_id: z.string().uuid().describe('Analysis ID') },
  async ({ analysis_id }) => {
    const analysis = store.get(analysis_id);
    if (!analysis) return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Analysis not found' }) }] };
    const qual = determineQualification(analysis);
    return { content: [{ type: 'text' as const, text: JSON.stringify(qual) }] };
  }
);

// ── Tool: run_analysis ──
server.tool(
  'run_analysis',
  'Run the full IT strategy analysis. Returns executive summary, KPIs, benchmarks, gaps, opportunities, and recommendations.',
  { analysis_id: z.string().uuid().describe('Analysis ID') },
  async ({ analysis_id }) => {
    const analysis = store.get(analysis_id);
    if (!analysis) return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Analysis not found' }) }] };

    const results = runAnalysis(analysis);
    analysis.results = results;
    analysis.controls.proceed_status = 'complete';
    analysis.updated_at = new Date().toISOString();

    return { content: [{ type: 'text' as const, text: JSON.stringify(results, null, 2) }] };
  }
);

// ── Tool: get_results ──
server.tool(
  'get_results',
  'Get the results of a completed analysis.',
  { analysis_id: z.string().uuid().describe('Analysis ID') },
  async ({ analysis_id }) => {
    const analysis = store.get(analysis_id);
    if (!analysis) return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Analysis not found' }) }] };
    if (!analysis.results) return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Analysis not yet run. Call run_analysis first.' }) }] };
    return { content: [{ type: 'text' as const, text: JSON.stringify(analysis.results, null, 2) }] };
  }
);

// ── Tool: list_analyses ──
server.tool(
  'list_analyses',
  'List all analyses.',
  {},
  async () => {
    const analyses = Array.from(store.values()).map(a => ({
      id: a.id,
      company_name: a.company_name,
      industry: a.industry_gics_group,
      status: a.controls.proceed_status,
      qualified_level: determineQualification(a).level,
      created_at: a.created_at,
    }));
    return { content: [{ type: 'text' as const, text: JSON.stringify(analyses, null, 2) }] };
  }
);

// ── Tool: get_analysis_detail ──
server.tool(
  'get_analysis_detail',
  'Get the full detail of an analysis including all intake data.',
  { analysis_id: z.string().uuid().describe('Analysis ID') },
  async ({ analysis_id }) => {
    const analysis = store.get(analysis_id);
    if (!analysis) return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Analysis not found' }) }] };
    return { content: [{ type: 'text' as const, text: JSON.stringify(analysis, null, 2) }] };
  }
);

// ── Tool: export_summary ──
server.tool(
  'export_summary',
  'Export a plain-text executive summary of the analysis results.',
  { analysis_id: z.string().uuid().describe('Analysis ID') },
  async ({ analysis_id }) => {
    const analysis = store.get(analysis_id);
    if (!analysis) return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Analysis not found' }) }] };
    if (!analysis.results) return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Analysis not yet run.' }) }] };

    const r = analysis.results;
    const lines = [
      `# IT Strategy Diagnostic: ${analysis.company_name}`,
      `**Industry**: ${analysis.industry_gics_group}`,
      `**Diagnostic Level**: ${r.qualified_level}`,
      `**Confidence**: ${r.overall_confidence}`,
      '',
      '## Executive Summary',
      r.executive_summary,
      '',
      '## Key Findings',
      ...r.key_findings.map((f, i) => `${i + 1}. ${f}`),
      '',
      '## Recommendations',
      ...r.recommendations.map(rec => `- **${rec.title}**: ${rec.description} (${rec.value_range})`),
      '',
      '## Caveats',
      ...r.caveats.map(c => `- ${c}`),
    ];
    return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
  }
);

// ══════════════════════════════════════════════════════════════
// Output & Report Generation Tools
// ══════════════════════════════════════════════════════════════

// ── Report Template Definitions (10 sheets) ──

interface ReportTemplateSheet {
  sheet_number: string;
  sheet_name: string;
  purpose: string;
  sections: {
    id: string;
    title: string;
    type: string;
    slots: { token: string; description: string; source_field: string; requires_narrative: boolean }[];
    narrative_instructions?: string;
  }[];
}

const REPORT_SHEETS: ReportTemplateSheet[] = [
  {
    sheet_number: '0', sheet_name: 'Template Guide',
    purpose: 'Instructions for populating the report and tower framework reference',
    sections: [{
      id: 'global_inputs', title: 'Global Inputs to Gather Before Drafting', type: 'table',
      slots: [
        { token: '[Company Name]', description: 'Company name', source_field: 'company_name', requires_narrative: false },
        { token: '[FY2025]', description: 'Fiscal year label', source_field: 'fiscal_year_label', requires_narrative: false },
        { token: '[Revenue $]', description: 'Current-year revenue', source_field: 'revenue', requires_narrative: false },
        { token: '[Total IT Spend $]', description: 'OPEX + CAPEX', source_field: 'total_it_spend', requires_narrative: false },
        { token: '[Spend %]', description: 'IT spend as % of revenue', source_field: 'it_spend_pct_revenue', requires_narrative: false },
        { token: '[Median %]', description: 'Peer benchmark median', source_field: 'benchmark_median', requires_narrative: false },
      ],
    }],
  },
  {
    sheet_number: '1', sheet_name: 'Executive Summary',
    purpose: 'One-page snapshot: bottom line, key metrics, top priorities, and value at stake',
    sections: [
      {
        id: 'bottom_line', title: 'The Bottom Line', type: 'narrative',
        slots: [
          { token: '[Bottom Line Narrative]', description: '3-5 sentence executive summary', source_field: 'executive_summary', requires_narrative: true },
        ],
        narrative_instructions: 'Lead with the most impactful finding. State the IT spend position relative to peers, quantify the gap, and frame the opportunity. Reference transformation investments if applicable.',
      },
      {
        id: 'key_metrics', title: 'Key Metrics at a Glance', type: 'table',
        slots: [
          { token: '[IT Spend % Rev]', description: 'IT spend as % of revenue', source_field: 'it_spend_pct_revenue', requires_narrative: false },
          { token: '[Benchmark Median]', description: 'Industry median', source_field: 'benchmark_median', requires_narrative: false },
          { token: '[Gap %]', description: 'Gap vs benchmark', source_field: 'benchmark_gap_pct', requires_narrative: false },
          { token: '[OpEx %]', description: 'OpEx as % of IT spend', source_field: 'opex_mix', requires_narrative: false },
          { token: '[CapEx %]', description: 'CapEx as % of IT spend', source_field: 'capex_mix', requires_narrative: false },
        ],
      },
      {
        id: 'priorities', title: 'Top Priorities', type: 'priority',
        slots: [
          { token: '[Priority List]', description: 'Top 3-5 prioritized recommendations', source_field: 'recommendations', requires_narrative: true },
        ],
        narrative_instructions: 'Each priority should state the issue, the opportunity value, and 1-2 specific actions. Order by impact.',
      },
      {
        id: 'value_at_stake', title: 'Value at Stake', type: 'table',
        slots: [
          { token: '[Total Opportunity Low]', description: 'Conservative estimate', source_field: 'total_opportunity_low', requires_narrative: false },
          { token: '[Total Opportunity High]', description: 'Optimistic estimate', source_field: 'total_opportunity_high', requires_narrative: false },
        ],
      },
    ],
  },
  {
    sheet_number: '2', sheet_name: 'Recommendations',
    purpose: 'Detailed recommendations with timeline, complexity, and expected value',
    sections: [{
      id: 'recommendation_table', title: 'Strategic Recommendations', type: 'table',
      slots: [
        { token: '[Recommendations]', description: 'Full recommendation details', source_field: 'recommendations', requires_narrative: true },
      ],
      narrative_instructions: 'For each recommendation: describe the issue found, quantify the opportunity (low-high range), specify timeline (Quick Win / 6-12mo / 12-18mo), rate complexity (Low/Medium/High), and list 2-3 specific actions.',
    }],
  },
  {
    sheet_number: '3', sheet_name: 'Year-over-Year Analysis',
    purpose: 'Compare current vs. prior year metrics to show trajectory',
    sections: [{
      id: 'yoy_table', title: 'Year-over-Year Metrics', type: 'table',
      slots: [
        { token: '[Prior Year Revenue]', description: 'Prior year revenue', source_field: 'prior_revenue', requires_narrative: false },
        { token: '[Current Year Revenue]', description: 'Current year revenue', source_field: 'revenue', requires_narrative: false },
        { token: '[YoY IT Spend Change %]', description: 'Change in IT spend', source_field: 'yoy_it_spend_change_pct', requires_narrative: false },
        { token: '[YoY Revenue Change %]', description: 'Change in revenue', source_field: 'yoy_revenue_change_pct', requires_narrative: false },
      ],
      narrative_instructions: 'Show whether IT spend is growing faster or slower than revenue. Flag if IT is consuming an increasing share. Note transformation spend effects on YoY trajectory.',
    }],
  },
  {
    sheet_number: '4', sheet_name: 'Benchmark Comparison',
    purpose: 'Position company against Gartner 2026 industry benchmarks with full distribution',
    sections: [
      {
        id: 'benchmark_position', title: 'Benchmark Position', type: 'distribution',
        slots: [
          { token: '[P10]', description: '10th percentile', source_field: 'benchmark_p10', requires_narrative: false },
          { token: '[P25]', description: '25th percentile', source_field: 'benchmark_p25', requires_narrative: false },
          { token: '[Median]', description: 'Median', source_field: 'benchmark_median', requires_narrative: false },
          { token: '[P75]', description: '75th percentile', source_field: 'benchmark_p75', requires_narrative: false },
          { token: '[P90]', description: '90th percentile', source_field: 'benchmark_p90', requires_narrative: false },
          { token: '[Company Position]', description: 'Where company falls in distribution', source_field: 'it_spend_pct_revenue', requires_narrative: false },
        ],
      },
      {
        id: 'gap_decomposition', title: 'Gap Decomposition', type: 'table',
        slots: [
          { token: '[Gap Components]', description: 'Breakdown of benchmark gap by cause', source_field: 'gap_components', requires_narrative: true },
        ],
        narrative_instructions: 'Decompose the gap into Structural (industry/regulatory), Temporary (transformation), and Addressable (optimization). Quantify each component. This helps the client understand what they can actually change.',
      },
    ],
  },
  {
    sheet_number: '5', sheet_name: 'Key Metrics Dashboard',
    purpose: 'All computed KPIs with benchmark comparison and assessment',
    sections: [{
      id: 'metrics_table', title: 'Key Performance Indicators', type: 'table',
      slots: [
        { token: '[All KPIs]', description: 'Full KPI table with value, benchmark, and assessment', source_field: 'kpis', requires_narrative: false },
      ],
    }],
  },
  {
    sheet_number: '6', sheet_name: 'IT Spend Tower Analysis',
    purpose: 'Spend breakdown by 8 Gartner-aligned towers',
    sections: [{
      id: 'tower_breakdown', title: 'Spend by Tower', type: 'table',
      slots: [
        { token: '[Tower Shares]', description: 'Per-tower spend amount and share', source_field: 'tower_shares', requires_narrative: true },
      ],
      narrative_instructions: 'Identify concentration risk (>30% in any tower). Compare tower mix against industry norms. Flag any towers significantly over/under-weighted. Note vendor consolidation opportunities.',
    }],
  },
  {
    sheet_number: '7', sheet_name: 'Vendor Mapping',
    purpose: 'Map vendors/apps to towers with auto-classification and spend allocation',
    sections: [{
      id: 'vendor_table', title: 'Vendor-to-Tower Mapping', type: 'table',
      slots: [
        { token: '[Vendor List]', description: 'Vendors classified by tower', source_field: 'vendor_mapping', requires_narrative: false },
        { token: '[Top 10 Concentration]', description: 'Top 10 vendors as % of total spend', source_field: 'top_10_concentration', requires_narrative: false },
      ],
    }],
  },
  {
    sheet_number: '8', sheet_name: 'Tower Summary',
    purpose: 'Per-tower narrative with findings and recommendations',
    sections: [{
      id: 'tower_narratives', title: 'Tower-by-Tower Analysis', type: 'narrative',
      slots: [
        { token: '[Tower Narratives]', description: 'Per-tower analysis and recommendations', source_field: 'tower_analysis', requires_narrative: true },
      ],
      narrative_instructions: 'For each of the 8 towers: state the spend level, % of total, key vendors, and whether it appears over/under-invested relative to company needs. Recommend specific optimization actions.',
    }],
  },
  {
    sheet_number: '9', sheet_name: 'Appendix',
    purpose: 'Data sources, methodology notes, benchmark references, and caveats',
    sections: [{
      id: 'methodology', title: 'Methodology & Data Sources', type: 'narrative',
      slots: [
        { token: '[Methodology]', description: 'Analysis methodology description', source_field: 'methodology', requires_narrative: true },
        { token: '[QA Checks]', description: 'Quality assurance results', source_field: 'qa_checks', requires_narrative: false },
        { token: '[Caveats]', description: 'Data limitations and caveats', source_field: 'caveats', requires_narrative: false },
      ],
      narrative_instructions: 'Document data sources (Gartner ITKMD 2026), calculation methodology, diagnostic level achieved, and all caveats. This is the audit trail section.',
    }],
  },
];

// ── Helper: Bridge MCP AnalysisResults → Report Data ──

function buildReportData(analysis: Analysis, results: AnalysisResults) {
  const currentYear = analysis.fiscal_years.find(y => y.fiscal_year_label === 'Current Fiscal Year');
  const priorYear = analysis.fiscal_years.find(y => y.fiscal_year_label === 'Last Fiscal Year');
  const benchmark = findBenchmark(analysis.industry_gics_group);

  const itPctRev = results.kpis['it_spend_pct_revenue']?.value;
  const opexMix = results.kpis['opex_mix']?.value;
  const capexMix = results.kpis['capex_mix']?.value;
  const gapInfo = results.benchmark_gaps['it_spend_pct_revenue'];
  const median = benchmark?.it_spend_pct_revenue?.distribution?.median;

  // Total opportunity range
  const totalOppLow = results.opportunities.reduce((s, o) => s + o.low, 0);
  const totalOppHigh = results.opportunities.reduce((s, o) => s + o.high, 0);
  const totalOppBase = results.opportunities.reduce((s, o) => s + o.base, 0);

  // YoY calculations
  const priorSpend = priorYear?.total_it_spend;
  const curSpend = currentYear?.total_it_spend;
  const yoySpendChange = (priorSpend && curSpend) ? (curSpend - priorSpend) / priorSpend : null;
  const priorRev = priorYear?.revenue;
  const curRev = currentYear?.revenue;
  const yoyRevChange = (priorRev && curRev) ? (curRev - priorRev) / priorRev : null;

  return {
    // Identifiers
    company_name: analysis.company_name,
    industry: analysis.industry_gics_group,
    fiscal_year_label: currentYear?.fiscal_year_label ?? 'Current Fiscal Year',
    qualification_level: results.qualified_level,
    prepared_date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),

    // Core financials
    revenue: currentYear?.revenue,
    total_it_spend: currentYear?.total_it_spend,
    it_opex_spend: currentYear?.it_opex_spend,
    it_capex_spend: currentYear?.it_capex_spend,
    employee_count: currentYear?.employee_count,
    it_fte_count: currentYear?.it_fte_count,
    prior_revenue: priorYear?.revenue,
    prior_it_spend: priorYear?.total_it_spend,

    // KPIs
    it_spend_pct_revenue: itPctRev,
    opex_mix: opexMix,
    capex_mix: capexMix,

    // Benchmarks
    benchmark_industry: benchmark?.display_name ?? analysis.industry_gics_group,
    benchmark_median: median,
    benchmark_p10: benchmark?.it_spend_pct_revenue?.distribution?.p10,
    benchmark_p25: benchmark?.it_spend_pct_revenue?.distribution?.p25,
    benchmark_p75: benchmark?.it_spend_pct_revenue?.distribution?.p75,
    benchmark_p90: benchmark?.it_spend_pct_revenue?.distribution?.p90,
    benchmark_gap_pct: gapInfo?.gap_pct,
    benchmark_gap_dollars: gapInfo?.gap_dollars,

    // YoY
    yoy_it_spend_change_pct: yoySpendChange,
    yoy_revenue_change_pct: yoyRevChange,

    // Transformation
    transformation_status: currentYear?.transformation_status,
    transformation_types: currentYear?.transformation_type,
    transformation_spend: currentYear?.transformation_spend_estimate,

    // Opportunities & recommendations
    opportunities: results.opportunities,
    recommendations: results.recommendations,
    total_opportunity_low: totalOppLow,
    total_opportunity_high: totalOppHigh,
    total_opportunity_base: totalOppBase,

    // QA
    qa_checks: results.qa_checks,
    qa_passed: results.qa_passed,
    overall_confidence: results.overall_confidence,
    caveats: results.caveats,

    // Narrative
    executive_summary: results.executive_summary,
    key_findings: results.key_findings,
  };
}

// ── Helper: Generate populated report sections ──

function generateReportSections(analysis: Analysis, results: AnalysisResults) {
  const data = buildReportData(analysis, results);
  const sections: Record<string, unknown>[] = [];

  // Sheet 1: Executive Summary
  sections.push({
    sheet: '1 - Executive Summary',
    bottom_line: {
      narrative: data.executive_summary,
      narrative_guidance: 'Lead with the most impactful finding. State IT spend position relative to peers, quantify the gap, and frame the opportunity.',
    },
    key_metrics: {
      it_spend_pct_revenue: data.it_spend_pct_revenue != null ? formatPct(data.it_spend_pct_revenue) : 'N/A',
      benchmark_median: data.benchmark_median != null ? formatPct(data.benchmark_median) : 'N/A',
      benchmark_gap: data.benchmark_gap_pct != null ? `${data.benchmark_gap_pct > 0 ? '+' : ''}${formatPct(data.benchmark_gap_pct)}` : 'N/A',
      benchmark_gap_dollars: data.benchmark_gap_dollars != null ? formatCurrency(Math.abs(data.benchmark_gap_dollars)) : 'N/A',
      opex_mix: data.opex_mix != null ? formatPct(data.opex_mix) : 'N/A',
      capex_mix: data.capex_mix != null ? formatPct(data.capex_mix) : 'N/A',
      total_it_spend: data.total_it_spend != null ? formatCurrency(data.total_it_spend) : 'N/A',
      revenue: data.revenue != null ? formatCurrency(data.revenue) : 'N/A',
    },
    priorities: data.recommendations.map((r, i) => ({
      rank: i + 1,
      title: r.title,
      description: r.description,
      value_range: r.value_range,
      priority: r.priority,
    })),
    value_at_stake: {
      total_low: formatCurrency(data.total_opportunity_low),
      total_base: formatCurrency(data.total_opportunity_base),
      total_high: formatCurrency(data.total_opportunity_high),
      opportunity_count: data.opportunities.length,
    },
    calculations: [
      `IT Spend % Revenue: ${data.total_it_spend != null && data.revenue ? `${formatCurrency(data.total_it_spend)} / ${formatCurrency(data.revenue)} = ${data.it_spend_pct_revenue != null ? formatPct(data.it_spend_pct_revenue) : 'N/A'}` : 'Insufficient data'}`,
      `Benchmark Gap: ${data.it_spend_pct_revenue != null && data.benchmark_median != null ? `${formatPct(data.it_spend_pct_revenue)} - ${formatPct(data.benchmark_median)} = ${data.benchmark_gap_pct != null ? formatPct(data.benchmark_gap_pct) : 'N/A'}` : 'Insufficient data'}`,
      `Gap in Dollars: ${data.benchmark_gap_pct != null && data.revenue ? `${formatPct(data.benchmark_gap_pct)} × ${formatCurrency(data.revenue)} = ${formatCurrency(data.benchmark_gap_dollars ?? 0)}` : 'N/A'}`,
    ],
  });

  // Sheet 2: Recommendations
  sections.push({
    sheet: '2 - Recommendations',
    recommendations: data.recommendations.map(r => ({
      title: r.title,
      description: r.description,
      value_range: r.value_range,
      priority: r.priority,
    })),
    opportunities: data.opportunities.map(o => ({
      module: o.module,
      low: formatCurrency(o.low),
      base: formatCurrency(o.base),
      high: formatCurrency(o.high),
      confidence: o.confidence,
    })),
    narrative_guidance: 'For each recommendation: state the issue, quantify the opportunity (low-base-high), specify timeline, and list 2-3 actions.',
  });

  // Sheet 3: Year-over-Year Analysis
  sections.push({
    sheet: '3 - Year-over-Year Analysis',
    has_prior_year: data.prior_revenue != null,
    metrics: {
      current_revenue: data.revenue != null ? formatCurrency(data.revenue) : 'N/A',
      prior_revenue: data.prior_revenue != null ? formatCurrency(data.prior_revenue) : 'N/A',
      revenue_change: data.yoy_revenue_change_pct != null ? formatPct(data.yoy_revenue_change_pct) : 'N/A',
      current_it_spend: data.total_it_spend != null ? formatCurrency(data.total_it_spend) : 'N/A',
      prior_it_spend: data.prior_it_spend != null ? formatCurrency(data.prior_it_spend) : 'N/A',
      it_spend_change: data.yoy_it_spend_change_pct != null ? formatPct(data.yoy_it_spend_change_pct) : 'N/A',
    },
    narrative_guidance: data.prior_revenue
      ? 'Compare IT spend growth vs revenue growth. Flag if IT is consuming an increasing revenue share.'
      : 'No prior year data submitted. Recommend collecting prior year financials for YoY trend analysis.',
  });

  // Sheet 4: Benchmark Comparison
  sections.push({
    sheet: '4 - Benchmark Comparison',
    distribution: {
      industry: data.benchmark_industry,
      p10: data.benchmark_p10 != null ? formatPct(data.benchmark_p10) : 'N/A',
      p25: data.benchmark_p25 != null ? formatPct(data.benchmark_p25) : 'N/A',
      median: data.benchmark_median != null ? formatPct(data.benchmark_median) : 'N/A',
      p75: data.benchmark_p75 != null ? formatPct(data.benchmark_p75) : 'N/A',
      p90: data.benchmark_p90 != null ? formatPct(data.benchmark_p90) : 'N/A',
      company_position: data.it_spend_pct_revenue != null ? formatPct(data.it_spend_pct_revenue) : 'N/A',
    },
    gap: {
      total_gap_pct: data.benchmark_gap_pct != null ? formatPct(data.benchmark_gap_pct) : 'N/A',
      total_gap_dollars: data.benchmark_gap_dollars != null ? formatCurrency(Math.abs(data.benchmark_gap_dollars)) : 'N/A',
      direction: data.benchmark_gap_pct != null ? (data.benchmark_gap_pct > 0 ? 'Above median (spending more)' : 'Below median (spending less)') : 'N/A',
    },
    narrative_guidance: 'Position the company within the industry distribution. Decompose the gap into Structural, Temporary, and Addressable components. Quantify what can be changed.',
    calculations: [
      `Company IT Spend % Revenue: ${data.it_spend_pct_revenue != null ? formatPct(data.it_spend_pct_revenue) : 'N/A'}`,
      `Industry Median: ${data.benchmark_median != null ? formatPct(data.benchmark_median) : 'N/A'}`,
      `Gap: ${data.benchmark_gap_pct != null ? `${formatPct(data.benchmark_gap_pct)} = ${formatCurrency(Math.abs(data.benchmark_gap_dollars ?? 0))}` : 'N/A'}`,
      data.transformation_spend ? `Transformation component: ${formatCurrency(data.transformation_spend)} (${data.transformation_types?.join(', ') ?? 'unspecified'})` : null,
    ].filter(Boolean),
  });

  // Sheet 5: Key Metrics Dashboard
  const kpiRows = Object.entries(data.it_spend_pct_revenue != null ? results.kpis : {}).map(([key, val]) => ({
    metric: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    value: val.formatted,
    raw_value: val.value,
  }));
  sections.push({
    sheet: '5 - Key Metrics Dashboard',
    kpis: kpiRows,
    overall_confidence: data.overall_confidence,
    qualification_level: data.qualification_level,
  });

  // Sheet 9: Appendix
  sections.push({
    sheet: '9 - Appendix',
    methodology: {
      source: 'Gartner IT Key Metrics Data 2026 (ITKMD)',
      diagnostic_level: data.qualification_level,
      confidence: data.overall_confidence,
      data_completeness: `${results.qa_checks.filter(c => c.passed).length}/${results.qa_checks.length} checks passed`,
    },
    qa_results: results.qa_checks.map(c => ({
      check: c.name,
      passed: c.passed,
      severity: c.severity,
    })),
    caveats: data.caveats,
    narrative_guidance: 'Document all data sources, methodology, diagnostic level, and caveats for audit trail.',
  });

  return {
    meta: {
      company_name: data.company_name,
      industry: data.industry,
      fiscal_year: data.fiscal_year_label,
      qualification_level: data.qualification_level,
      overall_confidence: data.overall_confidence,
      prepared_date: data.prepared_date,
      timestamp: new Date().toISOString(),
    },
    sections,
    qa_flags: results.qa_checks.filter(c => !c.passed).map(c => `[${c.severity}] ${c.name}`),
  };
}

// ── Helper: Generate chain-of-thought reasoning trace ──

function generateChainOfThought(analysis: Analysis, results: AnalysisResults) {
  const currentYear = analysis.fiscal_years.find(y => y.fiscal_year_label === 'Current Fiscal Year');
  const priorYear = analysis.fiscal_years.find(y => y.fiscal_year_label === 'Last Fiscal Year');
  const benchmark = findBenchmark(analysis.industry_gics_group);
  const data = buildReportData(analysis, results);

  const sections: { title: string; source: string; steps: { step: string; detail: string; result: string; confidence: string }[] }[] = [];

  // Section 1: Input Validation
  sections.push({
    title: '1. Input Validation & Data Quality',
    source: 'QA Engine (N12)',
    steps: [
      {
        step: 'Validate required fields',
        detail: `Checked: company_name="${analysis.company_name}", industry="${analysis.industry_gics_group}", revenue=${currentYear?.revenue ?? 'MISSING'}, it_spend=${currentYear?.total_it_spend ?? 'MISSING'}`,
        result: `${results.qa_checks.filter(c => c.passed).length}/${results.qa_checks.length} checks passed`,
        confidence: results.qa_passed ? 'High' : 'Low',
      },
      {
        step: 'Determine diagnostic level',
        detail: `Available data: revenue=${!!currentYear?.revenue}, opex=${!!currentYear?.it_opex_spend}, capex=${!!currentYear?.it_capex_spend}, employees=${!!currentYear?.employee_count}, it_ftes=${!!currentYear?.it_fte_count}`,
        result: `Qualified for: ${results.qualified_level}`,
        confidence: 'High',
      },
      ...results.qa_checks.filter(c => !c.passed).map(c => ({
        step: `⚠️ Failed: ${c.name}`,
        detail: `Severity: ${c.severity}`,
        result: 'Action required — review data input',
        confidence: 'Low' as const,
      })),
    ],
  });

  // Section 2: Benchmark Selection
  sections.push({
    title: '2. Benchmark Selection & Matching',
    source: 'Benchmark Engine (N02/N09)',
    steps: [
      {
        step: 'Match industry to benchmark',
        detail: `Input: "${analysis.industry_gics_group}" → Searched GICS mappings and industry IDs`,
        result: benchmark ? `Matched: ${benchmark.display_name} (${benchmark.source_ref})` : 'No exact match — using closest available',
        confidence: benchmark ? 'High' : 'Medium',
      },
      ...(benchmark ? [{
        step: 'Load distribution data',
        detail: `IT Spend % Revenue: P10=${benchmark.it_spend_pct_revenue.distribution ? formatPct(benchmark.it_spend_pct_revenue.distribution.p10) : 'N/A'}, P25=${benchmark.it_spend_pct_revenue.distribution ? formatPct(benchmark.it_spend_pct_revenue.distribution.p25) : 'N/A'}, Median=${benchmark.it_spend_pct_revenue.distribution ? formatPct(benchmark.it_spend_pct_revenue.distribution.median) : 'N/A'}, P75=${benchmark.it_spend_pct_revenue.distribution ? formatPct(benchmark.it_spend_pct_revenue.distribution.p75) : 'N/A'}, P90=${benchmark.it_spend_pct_revenue.distribution ? formatPct(benchmark.it_spend_pct_revenue.distribution.p90) : 'N/A'}`,
        result: `Full percentile distribution loaded from Gartner ITKMD 2026`,
        confidence: 'High' as const,
      }] : []),
    ],
  });

  // Section 3: Core KPI Calculations
  const kpiSteps: { step: string; detail: string; result: string; confidence: string }[] = [];
  if (data.it_spend_pct_revenue != null) {
    kpiSteps.push({
      step: 'IT Spend % Revenue',
      detail: `${formatCurrency(data.total_it_spend ?? 0)} ÷ ${formatCurrency(data.revenue ?? 0)}`,
      result: formatPct(data.it_spend_pct_revenue),
      confidence: 'High',
    });
  }
  if (data.opex_mix != null) {
    kpiSteps.push({
      step: 'OpEx Mix',
      detail: `${formatCurrency(data.it_opex_spend ?? 0)} ÷ ${formatCurrency(data.total_it_spend ?? 0)}`,
      result: formatPct(data.opex_mix),
      confidence: 'High',
    });
  }
  if (data.capex_mix != null) {
    kpiSteps.push({
      step: 'CapEx Mix',
      detail: `${formatCurrency(data.it_capex_spend ?? 0)} ÷ ${formatCurrency(data.total_it_spend ?? 0)}`,
      result: formatPct(data.capex_mix),
      confidence: 'High',
    });
  }
  if (data.employee_count && data.total_it_spend) {
    kpiSteps.push({
      step: 'IT Spend per Employee',
      detail: `${formatCurrency(data.total_it_spend)} ÷ ${data.employee_count.toLocaleString()} employees`,
      result: formatCurrency(data.total_it_spend / data.employee_count),
      confidence: 'High',
    });
  }
  if (data.it_fte_count && data.employee_count) {
    kpiSteps.push({
      step: 'IT FTE Ratio',
      detail: `${data.it_fte_count} IT FTEs ÷ ${data.employee_count} total employees`,
      result: formatPct(data.it_fte_count / data.employee_count),
      confidence: 'High',
    });
  }
  sections.push({ title: '3. Core KPI Calculations', source: 'KPI Engine (N04)', steps: kpiSteps });

  // Section 4: Benchmark Comparison
  if (data.benchmark_gap_pct != null) {
    sections.push({
      title: '4. Benchmark Gap Analysis',
      source: 'Benchmark Compare (N09/N10)',
      steps: [
        {
          step: 'Calculate gap vs median',
          detail: `Company: ${formatPct(data.it_spend_pct_revenue!)} - Median: ${formatPct(data.benchmark_median!)}`,
          result: `Gap: ${data.benchmark_gap_pct > 0 ? '+' : ''}${formatPct(data.benchmark_gap_pct)} (${formatCurrency(Math.abs(data.benchmark_gap_dollars ?? 0))})`,
          confidence: 'High',
        },
        {
          step: 'Assess position in distribution',
          detail: `P25=${data.benchmark_p25 != null ? formatPct(data.benchmark_p25) : 'N/A'}, Median=${data.benchmark_median != null ? formatPct(data.benchmark_median) : 'N/A'}, P75=${data.benchmark_p75 != null ? formatPct(data.benchmark_p75) : 'N/A'}`,
          result: data.it_spend_pct_revenue != null && data.benchmark_p75 != null && data.it_spend_pct_revenue > data.benchmark_p75
            ? 'Above P75 — significantly above peers'
            : data.it_spend_pct_revenue != null && data.benchmark_p25 != null && data.it_spend_pct_revenue < data.benchmark_p25
              ? 'Below P25 — significantly below peers'
              : 'Within interquartile range',
          confidence: 'High',
        },
        ...(data.transformation_spend ? [{
          step: 'Transformation adjustment',
          detail: `Active transformation: ${data.transformation_types?.join(', ') ?? 'unspecified'} at ${formatCurrency(data.transformation_spend)}`,
          result: `${formatPct(data.transformation_spend / (data.revenue ?? 1))} of revenue is temporary transformation spend`,
          confidence: 'Medium' as const,
        }] : []),
      ],
    });
  }

  // Section 5: Opportunity Sizing
  if (results.opportunities.length > 0) {
    sections.push({
      title: '5. Opportunity Identification & Sizing',
      source: 'Opportunity Engine (N11)',
      steps: results.opportunities.map(o => ({
        step: o.module,
        detail: `Low: ${formatCurrency(o.low)}, Base: ${formatCurrency(o.base)}, High: ${formatCurrency(o.high)}`,
        result: `Base case: ${formatCurrency(o.base)} (${o.confidence} confidence)`,
        confidence: o.confidence,
      })),
    });
  }

  // Section 6: YoY (if available)
  if (data.yoy_it_spend_change_pct != null) {
    sections.push({
      title: '6. Year-over-Year Trend Analysis',
      source: 'YoY Engine (N05)',
      steps: [
        {
          step: 'IT Spend YoY Change',
          detail: `Prior: ${formatCurrency(data.prior_it_spend ?? 0)} → Current: ${formatCurrency(data.total_it_spend ?? 0)}`,
          result: `${data.yoy_it_spend_change_pct > 0 ? '+' : ''}${formatPct(data.yoy_it_spend_change_pct)}`,
          confidence: 'High',
        },
        ...(data.yoy_revenue_change_pct != null ? [{
          step: 'Revenue YoY Change',
          detail: `Prior: ${formatCurrency(data.prior_revenue ?? 0)} → Current: ${formatCurrency(data.revenue ?? 0)}`,
          result: `${data.yoy_revenue_change_pct > 0 ? '+' : ''}${formatPct(data.yoy_revenue_change_pct)}`,
          confidence: 'High' as const,
        }] : []),
      ],
    });
  }

  // Summary
  const allSteps = sections.flatMap(s => s.steps);
  const highConf = allSteps.filter(s => s.confidence === 'High').length;
  const medConf = allSteps.filter(s => s.confidence === 'Medium').length;
  const lowConf = allSteps.filter(s => s.confidence === 'Low').length;

  return {
    meta: {
      company_name: analysis.company_name,
      analysis_id: analysis.id,
      generated_at: new Date().toISOString(),
      diagnostic_level: results.qualified_level,
      overall_confidence: results.overall_confidence,
    },
    summary: {
      total_calculations: allSteps.length,
      confidence_distribution: { high: highConf, medium: medConf, low: lowConf },
      qa_flags: results.qa_checks.filter(c => !c.passed).length,
      sections_count: sections.length,
    },
    sections,
  };
}

// ── Tool: generate_report ──
server.tool(
  'generate_report',
  'Generate the full structured report from a completed analysis. Returns populated sections for all 10 report sheets with data, calculations, narrative guidance, and formatting instructions. Use this to build the final IT Strategy Diagnostic deliverable.',
  {
    analysis_id: z.string().uuid().describe('Analysis ID'),
    sheets: z.array(z.string()).optional().describe('Optional: specific sheet numbers to generate (e.g., ["1", "4"]). Omit for all sheets.'),
  },
  async ({ analysis_id, sheets }) => {
    const analysis = store.get(analysis_id);
    if (!analysis) return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Analysis not found' }) }] };
    if (!analysis.results) return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Analysis not yet run. Call run_analysis first.' }) }] };

    const report = generateReportSections(analysis, analysis.results);

    // Filter to requested sheets if specified
    if (sheets && sheets.length > 0) {
      report.sections = report.sections.filter(s => {
        const sectionSheet = (s as { sheet: string }).sheet;
        return sheets.some(sh => sectionSheet.startsWith(sh));
      });
    }

    return { content: [{ type: 'text' as const, text: JSON.stringify(report, null, 2) }] };
  }
);

// ── Tool: get_report_template ──
server.tool(
  'get_report_template',
  'Get the report template structure showing all 10 sheets, their sections, data slots, and narrative instructions. Use this to understand what data goes where before generating the report.',
  {
    sheet_number: z.string().optional().describe('Optional: specific sheet number (0-9). Omit for all sheets.'),
  },
  async ({ sheet_number }) => {
    if (sheet_number) {
      const sheet = REPORT_SHEETS.find(s => s.sheet_number === sheet_number);
      if (!sheet) {
        return { content: [{ type: 'text' as const, text: JSON.stringify({ error: `Sheet ${sheet_number} not found. Available: 0-9.` }) }] };
      }
      return { content: [{ type: 'text' as const, text: JSON.stringify(sheet, null, 2) }] };
    }

    // Return summary of all sheets
    const summary = REPORT_SHEETS.map(s => ({
      sheet_number: s.sheet_number,
      sheet_name: s.sheet_name,
      purpose: s.purpose,
      section_count: s.sections.length,
      slot_count: s.sections.reduce((sum, sec) => sum + sec.slots.length, 0),
      has_narrative: s.sections.some(sec => sec.narrative_instructions),
    }));
    return { content: [{ type: 'text' as const, text: JSON.stringify(summary, null, 2) }] };
  }
);

// ── Tool: get_chain_of_thought ──
server.tool(
  'get_chain_of_thought',
  'Get the chain-of-thought reasoning trace for a completed analysis. Shows every input validated, calculation performed, benchmark compared, and opportunity sized — the complete audit trail.',
  {
    analysis_id: z.string().uuid().describe('Analysis ID'),
    format: z.enum(['json', 'markdown']).optional().describe('Output format: json (structured) or markdown (readable). Default: json'),
  },
  async ({ analysis_id, format }) => {
    const analysis = store.get(analysis_id);
    if (!analysis) return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Analysis not found' }) }] };
    if (!analysis.results) return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Analysis not yet run. Call run_analysis first.' }) }] };

    const cot = generateChainOfThought(analysis, analysis.results);
    const fmt = format ?? 'json';

    if (fmt === 'markdown') {
      const lines: string[] = [
        `# Chain of Thought: ${cot.meta.company_name}`,
        `**Diagnostic Level**: ${cot.meta.diagnostic_level} | **Confidence**: ${cot.meta.overall_confidence} | **Generated**: ${cot.meta.generated_at}`,
        '',
        `## Summary`,
        `- **Total calculations**: ${cot.summary.total_calculations}`,
        `- **Confidence**: ${cot.summary.confidence_distribution.high} High, ${cot.summary.confidence_distribution.medium} Medium, ${cot.summary.confidence_distribution.low} Low`,
        `- **QA flags**: ${cot.summary.qa_flags}`,
        '',
      ];

      for (const section of cot.sections) {
        lines.push(`## ${section.title}`);
        lines.push(`*Source: ${section.source}*`);
        lines.push('');
        for (const step of section.steps) {
          const badge = step.confidence === 'High' ? '🟢' : step.confidence === 'Medium' ? '🟡' : '🔴';
          lines.push(`### ${badge} ${step.step}`);
          lines.push(`- **Detail**: ${step.detail}`);
          lines.push(`- **Result**: ${step.result}`);
          lines.push('');
        }
      }

      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    }

    return { content: [{ type: 'text' as const, text: JSON.stringify(cot, null, 2) }] };
  }
);

// ── Tool: setup_guide ──
server.tool(
  'setup_guide',
  'Interactive setup guide for non-technical users. Checks prerequisites (Node.js, npm), verifies the project is installed correctly, tests port availability, and provides step-by-step instructions. Run this FIRST when helping a new user get started.',
  {
    check_port: z.number().optional().describe('Port to check availability for (default: 3456)'),
    step: z.enum(['full', 'prerequisites', 'install', 'port_check', 'start', 'troubleshoot']).optional().describe('Which setup step to run (default: full)'),
  },
  async ({ check_port, step }) => {
    const port = check_port ?? 3456;
    const requestedStep = step ?? 'full';
    const sections: string[] = [];

    // ── Prerequisites check ──
    if (requestedStep === 'full' || requestedStep === 'prerequisites') {
      sections.push('## ✅ Prerequisites Check\n');

      // Check Node.js
      try {
        const { execSync } = await import('child_process');
        const nodeVersion = execSync('node --version', { encoding: 'utf-8' }).trim();
        const major = parseInt(nodeVersion.replace('v', '').split('.')[0]);
        if (major >= 24) {
          sections.push(`- ✅ **Node.js**: ${nodeVersion} (meets v24+ requirement)`);
        } else {
          sections.push(`- ⚠️ **Node.js**: ${nodeVersion} — v24+ is required. Please update: https://nodejs.org/`);
        }
      } catch {
        sections.push('- ❌ **Node.js**: Not found. Please install from https://nodejs.org/ (v24 or later)');
      }

      // Check npm
      try {
        const { execSync } = await import('child_process');
        const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();
        sections.push(`- ✅ **npm**: v${npmVersion}`);
      } catch {
        sections.push('- ❌ **npm**: Not found. It should come bundled with Node.js.');
      }

      sections.push('');
    }

    // ── Install check ──
    if (requestedStep === 'full' || requestedStep === 'install') {
      sections.push('## 📦 Installation\n');
      sections.push('Run these commands in your terminal:\n');
      sections.push('```bash');
      sections.push('# 1. Clone the repository (skip if already done)');
      sections.push('git clone https://github.com/brigittecoles/IT-Stratagy.git');
      sections.push('cd IT-Stratagy');
      sections.push('');
      sections.push('# 2. Install web app dependencies');
      sections.push('npm install');
      sections.push('');
      sections.push('# 3. Install MCP server dependencies');
      sections.push('cd mcp-server && npm install && cd ..');
      sections.push('```\n');
    }

    // ── Port check ──
    if (requestedStep === 'full' || requestedStep === 'port_check') {
      sections.push('## 🔌 Port Availability\n');

      try {
        const net = await import('net');
        const isAvailable = await new Promise<boolean>((resolve) => {
          const tester = net.createServer();
          tester.once('error', () => resolve(false));
          tester.once('listening', () => {
            tester.close();
            resolve(true);
          });
          tester.listen(port);
        });

        if (isAvailable) {
          sections.push(`- ✅ **Port ${port}** is available and ready to use`);
          sections.push(`- The web UI will open at: **http://localhost:${port}**`);
        } else {
          sections.push(`- ⚠️ **Port ${port}** is already in use by another application`);
          sections.push(`- **Option 1**: Close the other application using port ${port}`);
          sections.push(`- **Option 2**: Use a different port: \`PORT=${port + 100} npm run dev\``);

          // Try to find an available alternative
          const alternatives = [3456, 3457, 3458, 4000, 4567, 5000, 8080];
          for (const alt of alternatives) {
            if (alt === port) continue;
            const altAvailable = await new Promise<boolean>((resolve) => {
              const t = net.createServer();
              t.once('error', () => resolve(false));
              t.once('listening', () => { t.close(); resolve(true); });
              t.listen(alt);
            });
            if (altAvailable) {
              sections.push(`- 💡 **Suggested alternative**: Port ${alt} is available → \`PORT=${alt} npm run dev\``);
              break;
            }
          }
        }
      } catch {
        sections.push(`- ℹ️ Could not check port ${port}. It will be tested when you start the app.`);
      }

      sections.push('');
    }

    // ── Start instructions ──
    if (requestedStep === 'full' || requestedStep === 'start') {
      sections.push('## 🚀 Starting the Web UI\n');
      sections.push('From the IT-Stratagy folder, run:\n');
      sections.push('```bash');
      sections.push('npm run dev');
      sections.push('```\n');
      sections.push(`Then open your browser to: **http://localhost:${port}**\n`);
      sections.push('To use a custom port:\n');
      sections.push('```bash');
      sections.push(`PORT=${port === 3456 ? 8080 : 3456} npm run dev`);
      sections.push('```\n');
      sections.push('To stop the server: Press **Ctrl+C** in the terminal.\n');
    }

    // ── Troubleshooting ──
    if (requestedStep === 'full' || requestedStep === 'troubleshoot') {
      sections.push('## 🔧 Troubleshooting\n');
      sections.push('| Problem | Solution |');
      sections.push('|---------|----------|');
      sections.push('| "command not found: node" | Install Node.js v24+ from https://nodejs.org/ |');
      sections.push('| "EACCES permission denied" | Don\'t use `sudo`. Reinstall Node.js via the official installer. |');
      sections.push(`| "Port ${port} already in use" | Use a different port: \`PORT=4567 npm run dev\` |`);
      sections.push('| "Module not found" | Run `npm install` in the IT-Stratagy folder |');
      sections.push('| Page won\'t load in browser | Make sure the terminal shows "Ready" before opening the URL |');
      sections.push('| MCP tools not connecting | Open Claude Code from inside the IT-Stratagy folder |');
      sections.push('');
    }

    // Summary banner
    if (requestedStep === 'full') {
      sections.unshift('# 🏥 IT Strategy Diagnostic — Setup Guide\n');
      sections.push('---');
      sections.push('**Quick reference**: `cd IT-Stratagy && npm install && npm run dev` → http://localhost:' + port);
      sections.push('');
      sections.push('Once the web UI is running, you can also use the MCP tools right here in Claude:');
      sections.push('1. `create_analysis` → start a new diagnostic');
      sections.push('2. `submit_intake` → add your company data');
      sections.push('3. `run_analysis` → generate the full diagnostic');
      sections.push('4. `generate_report` → get the deliverable report');
    }

    return { content: [{ type: 'text' as const, text: sections.join('\n') }] };
  }
);

// ── Tool: check_port ──
server.tool(
  'check_port',
  'Check if a specific port is available on localhost. Useful before starting the web UI to avoid conflicts.',
  {
    port: z.number().describe('Port number to check (e.g., 3456, 3000, 8080)'),
  },
  async ({ port }) => {
    try {
      const net = await import('net');
      const isAvailable = await new Promise<boolean>((resolve) => {
        const tester = net.createServer();
        tester.once('error', () => resolve(false));
        tester.once('listening', () => {
          tester.close();
          resolve(true);
        });
        tester.listen(port);
      });

      if (isAvailable) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({
            port,
            available: true,
            message: `Port ${port} is available. Start the web UI with: npm run dev`,
            url: `http://localhost:${port}`,
          }) }],
        };
      }

      // Find an alternative
      const alternatives = [3456, 3457, 3458, 4000, 4567, 5000, 8080, 8888, 9000];
      let suggestion: number | null = null;
      for (const alt of alternatives) {
        if (alt === port) continue;
        const altAvailable = await new Promise<boolean>((resolve) => {
          const t = net.createServer();
          t.once('error', () => resolve(false));
          t.once('listening', () => { t.close(); resolve(true); });
          t.listen(alt);
        });
        if (altAvailable) { suggestion = alt; break; }
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify({
          port,
          available: false,
          message: `Port ${port} is in use by another application.`,
          suggestion: suggestion ? `Use port ${suggestion} instead: PORT=${suggestion} npm run dev` : 'Try closing the other application first.',
          suggested_port: suggestion,
        }) }],
      };
    } catch (err) {
      return { content: [{ type: 'text' as const, text: `Error checking port: ${err}` }] };
    }
  }
);

// ── Start server ──
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('IT Strategy Diagnostic MCP Server v2.2 running on stdio (15 industry benchmarks, 14 tools loaded)');
}

main().catch(console.error);
