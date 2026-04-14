/**
 * IT Role × Process Crosswalk Data
 *
 * Source: O*NET-SOC 30.2 × APQC PCF v7.3 — IT Role Focus
 * 98 mappings between 16 IT role groups and 46 APQC L2 processes.
 *
 * Each mapping includes a semantic similarity score, confidence level,
 * and the role group's automability and skill intensity metrics.
 *
 * Usage:
 *   - During workforce assessment, classify employee roles → IT tiers
 *   - Look up which APQC processes each tier supports
 *   - Identify automability exposure by tier or process
 *   - Find coverage gaps (processes with no IT role mapping)
 */

import type { ITTier } from './role-definitions';

// ── Confidence Level ──

export type CrosswalkConfidence = 'High' | 'Medium' | 'Low';

// ── Crosswalk Entry ──

export type RACIType = 'R' | 'A' | 'C' | 'I';

export interface CrosswalkEntry {
  /** IT tier classification */
  tier: ITTier;
  /** SOC minor group code */
  soc_code: string;
  /** SOC minor group title */
  soc_minor_group: string;
  /** APQC L2 process code (e.g., '8.5') */
  apqc_l2_code: string;
  /** APQC L2 process name */
  apqc_l2_name: string;
  /** APQC L1 category code */
  apqc_l1_code: number;
  /** Semantic similarity score (0-1, higher = stronger fit) */
  similarity: number;
  /** Confidence of the mapping */
  confidence: CrosswalkConfidence;
  /** Role group automability score (0-100) */
  automability: number;
  /** Skill intensity score (1-5) */
  skill_intensity: number;
  /**
   * RACI type (baseline-derived).
   * R=Responsible, A=Accountable, C=Consulted, I=Informed.
   * Derived from: tier type (mgmt→A, execution→R, advisory→C),
   * confidence level (high promotes, low demotes), and
   * process domain fit (APQC cat 8 boosts IT roles).
   */
  raci_type: RACIType;
  /**
   * FTE Load % (baseline-derived, 1-100).
   * Estimated fraction of the role's total work time spent on this process.
   * Derived from: (similarity × confidence_weight) / total_weighted_sim × coverage_cap.
   * Coverage cap scales with number of processes touched (40%-80%).
   */
  fte_load_pct: number;
}

// ── 98-Row Crosswalk Database ──

export const CROSSWALK_DATA: CrosswalkEntry[] = [
  // ─── Core IT: Mathematical Science Occupations (15-2000) ───
  { tier: 'Core IT', soc_code: '15-2000', soc_minor_group: 'Mathematical Science Occupations', apqc_l2_code: '8.4', apqc_l2_name: 'Manage enterprise information', apqc_l1_code: 8, similarity: 0.0522, confidence: 'High', automability: 71.9, skill_intensity: 2.93, raci_type: 'A', fte_load_pct: 20 },
  { tier: 'Core IT', soc_code: '15-2000', soc_minor_group: 'Mathematical Science Occupations', apqc_l2_code: '8.5', apqc_l2_name: 'Develop and maintain information technology solutions', apqc_l1_code: 8, similarity: 0.0496, confidence: 'Medium', automability: 71.9, skill_intensity: 2.93, raci_type: 'R', fte_load_pct: 9 },
  { tier: 'Core IT', soc_code: '15-2000', soc_minor_group: 'Mathematical Science Occupations', apqc_l2_code: '1.2', apqc_l2_name: 'Develop business strategy', apqc_l1_code: 1, similarity: 0.0460, confidence: 'Medium', automability: 71.9, skill_intensity: 2.93, raci_type: 'R', fte_load_pct: 9 },
  { tier: 'Core IT', soc_code: '15-2000', soc_minor_group: 'Mathematical Science Occupations', apqc_l2_code: '13.2', apqc_l2_name: 'Manage portfolio, program, and project', apqc_l1_code: 13, similarity: 0.0389, confidence: 'Medium', automability: 71.9, skill_intensity: 2.93, raci_type: 'R', fte_load_pct: 7 },
  { tier: 'Core IT', soc_code: '15-2000', soc_minor_group: 'Mathematical Science Occupations', apqc_l2_code: '3.1', apqc_l2_name: 'Understand markets, customers and capabilities', apqc_l1_code: 3, similarity: 0.0376, confidence: 'Medium', automability: 71.9, skill_intensity: 2.93, raci_type: 'R', fte_load_pct: 7 },
  { tier: 'Core IT', soc_code: '15-2000', soc_minor_group: 'Mathematical Science Occupations', apqc_l2_code: '8.3', apqc_l2_name: 'Develop and implement security, privacy, and data protection controls', apqc_l1_code: 8, similarity: 0.0338, confidence: 'Low', automability: 71.9, skill_intensity: 2.93, raci_type: 'C', fte_load_pct: 3 },
  { tier: 'Core IT', soc_code: '15-2000', soc_minor_group: 'Mathematical Science Occupations', apqc_l2_code: '8.1', apqc_l2_name: 'Manage the business of information technology', apqc_l1_code: 8, similarity: 0.0327, confidence: 'Low', automability: 71.9, skill_intensity: 2.93, raci_type: 'C', fte_load_pct: 3 },
  { tier: 'Core IT', soc_code: '15-2000', soc_minor_group: 'Mathematical Science Occupations', apqc_l2_code: '13.1', apqc_l2_name: 'Manage business processes', apqc_l1_code: 13, similarity: 0.0324, confidence: 'Low', automability: 71.9, skill_intensity: 2.93, raci_type: 'C', fte_load_pct: 3 },
  { tier: 'Core IT', soc_code: '15-2000', soc_minor_group: 'Mathematical Science Occupations', apqc_l2_code: '2.2', apqc_l2_name: 'Develop products and services', apqc_l1_code: 2, similarity: 0.0287, confidence: 'Low', automability: 71.9, skill_intensity: 2.93, raci_type: 'C', fte_load_pct: 3 },
  { tier: 'Core IT', soc_code: '15-2000', soc_minor_group: 'Mathematical Science Occupations', apqc_l2_code: '7.7', apqc_l2_name: 'Manage employee information and analytics', apqc_l1_code: 7, similarity: 0.0282, confidence: 'Low', automability: 71.9, skill_intensity: 2.93, raci_type: 'C', fte_load_pct: 3 },
  { tier: 'Core IT', soc_code: '15-2000', soc_minor_group: 'Mathematical Science Occupations', apqc_l2_code: '8.7', apqc_l2_name: 'Deliver and support information technology services', apqc_l1_code: 8, similarity: 0.0277, confidence: 'Low', automability: 71.9, skill_intensity: 2.93, raci_type: 'C', fte_load_pct: 3 },

  // ─── IT Management: Top Executives (11-1000) ───
  { tier: 'IT Management', soc_code: '11-1000', soc_minor_group: 'Top Executives', apqc_l2_code: '6.3', apqc_l2_name: 'Measure and evaluate customer service operations', apqc_l1_code: 6, similarity: 0.0388, confidence: 'Medium', automability: 59.4, skill_intensity: 3.30, raci_type: 'A', fte_load_pct: 10 },
  { tier: 'IT Management', soc_code: '11-1000', soc_minor_group: 'Top Executives', apqc_l2_code: '13.4', apqc_l2_name: 'Manage change', apqc_l1_code: 13, similarity: 0.0347, confidence: 'Low', automability: 59.4, skill_intensity: 3.30, raci_type: 'R', fte_load_pct: 5 },
  { tier: 'IT Management', soc_code: '11-1000', soc_minor_group: 'Top Executives', apqc_l2_code: '13.2', apqc_l2_name: 'Manage portfolio, program, and project', apqc_l1_code: 13, similarity: 0.0337, confidence: 'Low', automability: 59.4, skill_intensity: 3.30, raci_type: 'R', fte_load_pct: 5 },
  { tier: 'IT Management', soc_code: '11-1000', soc_minor_group: 'Top Executives', apqc_l2_code: '5.1', apqc_l2_name: 'Establish and manage service delivery governance', apqc_l1_code: 5, similarity: 0.0333, confidence: 'Low', automability: 59.4, skill_intensity: 3.30, raci_type: 'R', fte_load_pct: 4 },
  { tier: 'IT Management', soc_code: '11-1000', soc_minor_group: 'Top Executives', apqc_l2_code: '7.3', apqc_l2_name: 'Develop and counsel employees', apqc_l1_code: 7, similarity: 0.0333, confidence: 'Low', automability: 59.4, skill_intensity: 3.30, raci_type: 'R', fte_load_pct: 4 },
  { tier: 'IT Management', soc_code: '11-1000', soc_minor_group: 'Top Executives', apqc_l2_code: '7.1', apqc_l2_name: 'Develop and manage HR planning, policies and strategies', apqc_l1_code: 7, similarity: 0.0332, confidence: 'Low', automability: 59.4, skill_intensity: 3.30, raci_type: 'R', fte_load_pct: 4 },
  { tier: 'IT Management', soc_code: '11-1000', soc_minor_group: 'Top Executives', apqc_l2_code: '12.2', apqc_l2_name: 'Manage government and industry relationships', apqc_l1_code: 12, similarity: 0.0330, confidence: 'Low', automability: 59.4, skill_intensity: 3.30, raci_type: 'R', fte_load_pct: 4 },
  { tier: 'IT Management', soc_code: '11-1000', soc_minor_group: 'Top Executives', apqc_l2_code: '2.2', apqc_l2_name: 'Develop products and services', apqc_l1_code: 2, similarity: 0.0321, confidence: 'Low', automability: 59.4, skill_intensity: 3.30, raci_type: 'R', fte_load_pct: 4 },
  { tier: 'IT Management', soc_code: '11-1000', soc_minor_group: 'Top Executives', apqc_l2_code: '6.2', apqc_l2_name: 'Plan and manage customer service operations', apqc_l1_code: 6, similarity: 0.0319, confidence: 'Low', automability: 59.4, skill_intensity: 3.30, raci_type: 'R', fte_load_pct: 4 },
  { tier: 'IT Management', soc_code: '11-1000', soc_minor_group: 'Top Executives', apqc_l2_code: '3.2', apqc_l2_name: 'Develop marketing strategy', apqc_l1_code: 3, similarity: 0.0313, confidence: 'Low', automability: 59.4, skill_intensity: 3.30, raci_type: 'R', fte_load_pct: 4 },
  { tier: 'IT Management', soc_code: '11-1000', soc_minor_group: 'Top Executives', apqc_l2_code: '13.7', apqc_l2_name: 'Manage Environmental Health and Safety (EHS)', apqc_l1_code: 13, similarity: 0.0293, confidence: 'Low', automability: 59.4, skill_intensity: 3.30, raci_type: 'R', fte_load_pct: 4 },
  { tier: 'IT Management', soc_code: '11-1000', soc_minor_group: 'Top Executives', apqc_l2_code: '3.3', apqc_l2_name: 'Develop and manage marketing plans', apqc_l1_code: 3, similarity: 0.0292, confidence: 'Low', automability: 59.4, skill_intensity: 3.30, raci_type: 'R', fte_load_pct: 4 },
  { tier: 'IT Management', soc_code: '11-1000', soc_minor_group: 'Top Executives', apqc_l2_code: '8.2', apqc_l2_name: 'Develop and manage IT customer relationships', apqc_l1_code: 8, similarity: 0.0292, confidence: 'Low', automability: 59.4, skill_intensity: 3.30, raci_type: 'R', fte_load_pct: 4 },
  { tier: 'IT Management', soc_code: '11-1000', soc_minor_group: 'Top Executives', apqc_l2_code: '7.6', apqc_l2_name: 'Redeploy and retire employees', apqc_l1_code: 7, similarity: 0.0283, confidence: 'Low', automability: 59.4, skill_intensity: 3.30, raci_type: 'R', fte_load_pct: 4 },
  { tier: 'IT Management', soc_code: '11-1000', soc_minor_group: 'Top Executives', apqc_l2_code: '12.4', apqc_l2_name: 'Manage public relations program', apqc_l1_code: 12, similarity: 0.0282, confidence: 'Low', automability: 59.4, skill_intensity: 3.30, raci_type: 'R', fte_load_pct: 4 },
  { tier: 'IT Management', soc_code: '11-1000', soc_minor_group: 'Top Executives', apqc_l2_code: '1.3', apqc_l2_name: 'Manage strategic initiatives', apqc_l1_code: 1, similarity: 0.0272, confidence: 'Low', automability: 59.4, skill_intensity: 3.30, raci_type: 'R', fte_load_pct: 4 },
  { tier: 'IT Management', soc_code: '11-1000', soc_minor_group: 'Top Executives', apqc_l2_code: '8.7', apqc_l2_name: 'Deliver and support information technology services', apqc_l1_code: 8, similarity: 0.0264, confidence: 'Low', automability: 59.4, skill_intensity: 3.30, raci_type: 'R', fte_load_pct: 4 },
  { tier: 'IT Management', soc_code: '11-1000', soc_minor_group: 'Top Executives', apqc_l2_code: '9.9', apqc_l2_name: 'Manage taxes', apqc_l1_code: 9, similarity: 0.0264, confidence: 'Low', automability: 59.4, skill_intensity: 3.30, raci_type: 'R', fte_load_pct: 4 },

  // ─── IT Management: Operations Specialties Managers (11-3000) ───
  { tier: 'IT Management', soc_code: '11-3000', soc_minor_group: 'Operations Specialties Managers', apqc_l2_code: '9.1', apqc_l2_name: 'Perform planning and management accounting', apqc_l1_code: 9, similarity: 0.0638, confidence: 'High', automability: 60.4, skill_intensity: 3.20, raci_type: 'A', fte_load_pct: 14 },
  { tier: 'IT Management', soc_code: '11-3000', soc_minor_group: 'Operations Specialties Managers', apqc_l2_code: '8.3', apqc_l2_name: 'Develop and implement security, privacy, and data protection controls', apqc_l1_code: 8, similarity: 0.0592, confidence: 'High', automability: 60.4, skill_intensity: 3.20, raci_type: 'A', fte_load_pct: 13 },
  { tier: 'IT Management', soc_code: '11-3000', soc_minor_group: 'Operations Specialties Managers', apqc_l2_code: '9.9', apqc_l2_name: 'Manage taxes', apqc_l1_code: 9, similarity: 0.0517, confidence: 'High', automability: 60.4, skill_intensity: 3.20, raci_type: 'A', fte_load_pct: 11 },
  { tier: 'IT Management', soc_code: '11-3000', soc_minor_group: 'Operations Specialties Managers', apqc_l2_code: '4.1', apqc_l2_name: 'Plan for and acquire necessary resources (Supply Chain Planning)', apqc_l1_code: 4, similarity: 0.0487, confidence: 'Medium', automability: 60.4, skill_intensity: 3.20, raci_type: 'A', fte_load_pct: 5 },
  { tier: 'IT Management', soc_code: '11-3000', soc_minor_group: 'Operations Specialties Managers', apqc_l2_code: '13.7', apqc_l2_name: 'Manage Environmental Health and Safety (EHS)', apqc_l1_code: 13, similarity: 0.0434, confidence: 'Medium', automability: 60.4, skill_intensity: 3.20, raci_type: 'A', fte_load_pct: 5 },
  { tier: 'IT Management', soc_code: '11-3000', soc_minor_group: 'Operations Specialties Managers', apqc_l2_code: '11.2', apqc_l2_name: 'Manage compliance', apqc_l1_code: 11, similarity: 0.0428, confidence: 'Medium', automability: 60.4, skill_intensity: 3.20, raci_type: 'A', fte_load_pct: 5 },
  { tier: 'IT Management', soc_code: '11-3000', soc_minor_group: 'Operations Specialties Managers', apqc_l2_code: '9.7', apqc_l2_name: 'Manage treasury operations', apqc_l1_code: 9, similarity: 0.0372, confidence: 'Medium', automability: 60.4, skill_intensity: 3.20, raci_type: 'A', fte_load_pct: 4 },
  { tier: 'IT Management', soc_code: '11-3000', soc_minor_group: 'Operations Specialties Managers', apqc_l2_code: '7.7', apqc_l2_name: 'Manage employee information and analytics', apqc_l1_code: 7, similarity: 0.0369, confidence: 'Medium', automability: 60.4, skill_intensity: 3.20, raci_type: 'A', fte_load_pct: 4 },
  { tier: 'IT Management', soc_code: '11-3000', soc_minor_group: 'Operations Specialties Managers', apqc_l2_code: '4.4', apqc_l2_name: 'Deliver products to customers', apqc_l1_code: 4, similarity: 0.0362, confidence: 'Medium', automability: 60.4, skill_intensity: 3.20, raci_type: 'A', fte_load_pct: 4 },
  { tier: 'IT Management', soc_code: '11-3000', soc_minor_group: 'Operations Specialties Managers', apqc_l2_code: '7.1', apqc_l2_name: 'Develop and manage HR planning, policies and strategies', apqc_l1_code: 7, similarity: 0.0340, confidence: 'Low', automability: 60.4, skill_intensity: 3.20, raci_type: 'R', fte_load_pct: 2 },
  { tier: 'IT Management', soc_code: '11-3000', soc_minor_group: 'Operations Specialties Managers', apqc_l2_code: '10.2', apqc_l2_name: 'Design and construct productive assets', apqc_l1_code: 10, similarity: 0.0308, confidence: 'Low', automability: 60.4, skill_intensity: 3.20, raci_type: 'R', fte_load_pct: 2 },
  { tier: 'IT Management', soc_code: '11-3000', soc_minor_group: 'Operations Specialties Managers', apqc_l2_code: '4.5', apqc_l2_name: 'Manage logistics and warehousing', apqc_l1_code: 4, similarity: 0.0295, confidence: 'Low', automability: 60.4, skill_intensity: 3.20, raci_type: 'R', fte_load_pct: 2 },
  { tier: 'IT Management', soc_code: '11-3000', soc_minor_group: 'Operations Specialties Managers', apqc_l2_code: '10.3', apqc_l2_name: 'Manage and operate assets', apqc_l1_code: 10, similarity: 0.0286, confidence: 'Low', automability: 60.4, skill_intensity: 3.20, raci_type: 'R', fte_load_pct: 2 },
  { tier: 'IT Management', soc_code: '11-3000', soc_minor_group: 'Operations Specialties Managers', apqc_l2_code: '2.2', apqc_l2_name: 'Develop products and services', apqc_l1_code: 2, similarity: 0.0283, confidence: 'Low', automability: 60.4, skill_intensity: 3.20, raci_type: 'R', fte_load_pct: 2 },
  { tier: 'IT Management', soc_code: '11-3000', soc_minor_group: 'Operations Specialties Managers', apqc_l2_code: '9.5', apqc_l2_name: 'Process payroll', apqc_l1_code: 9, similarity: 0.0283, confidence: 'Low', automability: 60.4, skill_intensity: 3.20, raci_type: 'R', fte_load_pct: 2 },
  { tier: 'IT Management', soc_code: '11-3000', soc_minor_group: 'Operations Specialties Managers', apqc_l2_code: '8.4', apqc_l2_name: 'Manage enterprise information', apqc_l1_code: 8, similarity: 0.0266, confidence: 'Low', automability: 60.4, skill_intensity: 3.20, raci_type: 'R', fte_load_pct: 1 },
  { tier: 'IT Management', soc_code: '11-3000', soc_minor_group: 'Operations Specialties Managers', apqc_l2_code: '7.3', apqc_l2_name: 'Develop and counsel employees', apqc_l1_code: 7, similarity: 0.0263, confidence: 'Low', automability: 60.4, skill_intensity: 3.20, raci_type: 'R', fte_load_pct: 1 },
  { tier: 'IT Management', soc_code: '11-3000', soc_minor_group: 'Operations Specialties Managers', apqc_l2_code: '8.5', apqc_l2_name: 'Develop and maintain information technology solutions', apqc_l1_code: 8, similarity: 0.0259, confidence: 'Low', automability: 60.4, skill_intensity: 3.20, raci_type: 'R', fte_load_pct: 1 },
  { tier: 'IT Management', soc_code: '11-3000', soc_minor_group: 'Operations Specialties Managers', apqc_l2_code: '4.2', apqc_l2_name: 'Procure materials and services', apqc_l1_code: 4, similarity: 0.0257, confidence: 'Low', automability: 60.4, skill_intensity: 3.20, raci_type: 'R', fte_load_pct: 1 },

  // ─── IT-Adjacent Engineering: Engineers (17-2000) ───
  { tier: 'IT-Adjacent Engineering', soc_code: '17-2000', soc_minor_group: 'Engineers', apqc_l2_code: '2.2', apqc_l2_name: 'Develop products and services', apqc_l1_code: 2, similarity: 0.0515, confidence: 'High', automability: 61.4, skill_intensity: 3.51, raci_type: 'A', fte_load_pct: 25 },
  { tier: 'IT-Adjacent Engineering', soc_code: '17-2000', soc_minor_group: 'Engineers', apqc_l2_code: '10.2', apqc_l2_name: 'Design and construct productive assets', apqc_l1_code: 10, similarity: 0.0449, confidence: 'Medium', automability: 61.4, skill_intensity: 3.51, raci_type: 'R', fte_load_pct: 11 },
  { tier: 'IT-Adjacent Engineering', soc_code: '17-2000', soc_minor_group: 'Engineers', apqc_l2_code: '4.3', apqc_l2_name: 'Produce/Manufacture/Deliver product', apqc_l1_code: 4, similarity: 0.0379, confidence: 'Medium', automability: 61.4, skill_intensity: 3.51, raci_type: 'R', fte_load_pct: 9 },
  { tier: 'IT-Adjacent Engineering', soc_code: '17-2000', soc_minor_group: 'Engineers', apqc_l2_code: '13.7', apqc_l2_name: 'Manage Environmental Health and Safety (EHS)', apqc_l1_code: 13, similarity: 0.0318, confidence: 'Low', automability: 61.4, skill_intensity: 3.51, raci_type: 'C', fte_load_pct: 4 },
  { tier: 'IT-Adjacent Engineering', soc_code: '17-2000', soc_minor_group: 'Engineers', apqc_l2_code: '8.3', apqc_l2_name: 'Develop and implement security, privacy, and data protection controls', apqc_l1_code: 8, similarity: 0.0304, confidence: 'Low', automability: 61.4, skill_intensity: 3.51, raci_type: 'C', fte_load_pct: 4 },
  { tier: 'IT-Adjacent Engineering', soc_code: '17-2000', soc_minor_group: 'Engineers', apqc_l2_code: '8.5', apqc_l2_name: 'Develop and maintain information technology solutions', apqc_l1_code: 8, similarity: 0.0299, confidence: 'Low', automability: 61.4, skill_intensity: 3.51, raci_type: 'C', fte_load_pct: 4 },
  { tier: 'IT-Adjacent Engineering', soc_code: '17-2000', soc_minor_group: 'Engineers', apqc_l2_code: '6.3', apqc_l2_name: 'Measure and evaluate customer service operations', apqc_l1_code: 6, similarity: 0.0262, confidence: 'Low', automability: 61.4, skill_intensity: 3.51, raci_type: 'C', fte_load_pct: 3 },

  // ─── IT-Adjacent Engineering: Drafters/Technicians (17-3000) ───
  { tier: 'IT-Adjacent Engineering', soc_code: '17-3000', soc_minor_group: 'Drafters, Engineering Technicians, and Mapping Technicians', apqc_l2_code: '4.3', apqc_l2_name: 'Produce/Manufacture/Deliver product', apqc_l1_code: 4, similarity: 0.0449, confidence: 'Medium', automability: 55.5, skill_intensity: 3.04, raci_type: 'R', fte_load_pct: 18 },
  { tier: 'IT-Adjacent Engineering', soc_code: '17-3000', soc_minor_group: 'Drafters, Engineering Technicians, and Mapping Technicians', apqc_l2_code: '2.2', apqc_l2_name: 'Develop products and services', apqc_l1_code: 2, similarity: 0.0402, confidence: 'Medium', automability: 55.5, skill_intensity: 3.04, raci_type: 'R', fte_load_pct: 17 },
  { tier: 'IT-Adjacent Engineering', soc_code: '17-3000', soc_minor_group: 'Drafters, Engineering Technicians, and Mapping Technicians', apqc_l2_code: '10.2', apqc_l2_name: 'Design and construct productive assets', apqc_l1_code: 10, similarity: 0.0365, confidence: 'Medium', automability: 55.5, skill_intensity: 3.04, raci_type: 'R', fte_load_pct: 15 },

  // ─── IT Business Ops: Business Operations Specialists (13-1000) ───
  { tier: 'IT Business Ops', soc_code: '13-1000', soc_minor_group: 'Business Operations Specialists', apqc_l2_code: '11.4', apqc_l2_name: 'Manage business resiliency', apqc_l1_code: 11, similarity: 0.0668, confidence: 'High', automability: 63.4, skill_intensity: 2.77, raci_type: 'A', fte_load_pct: 31 },
  { tier: 'IT Business Ops', soc_code: '13-1000', soc_minor_group: 'Business Operations Specialists', apqc_l2_code: '7.4', apqc_l2_name: 'Manage employee relations', apqc_l1_code: 7, similarity: 0.0403, confidence: 'Medium', automability: 63.4, skill_intensity: 2.77, raci_type: 'R', fte_load_pct: 9 },
  { tier: 'IT Business Ops', soc_code: '13-1000', soc_minor_group: 'Business Operations Specialists', apqc_l2_code: '1.2', apqc_l2_name: 'Develop business strategy', apqc_l1_code: 1, similarity: 0.0340, confidence: 'Low', automability: 63.4, skill_intensity: 2.77, raci_type: 'C', fte_load_pct: 4 },
  { tier: 'IT Business Ops', soc_code: '13-1000', soc_minor_group: 'Business Operations Specialists', apqc_l2_code: '8.3', apqc_l2_name: 'Develop and implement security, privacy, and data protection controls', apqc_l1_code: 8, similarity: 0.0322, confidence: 'Low', automability: 63.4, skill_intensity: 2.77, raci_type: 'C', fte_load_pct: 4 },
  { tier: 'IT Business Ops', soc_code: '13-1000', soc_minor_group: 'Business Operations Specialists', apqc_l2_code: '11.2', apqc_l2_name: 'Manage compliance', apqc_l1_code: 11, similarity: 0.0312, confidence: 'Low', automability: 63.4, skill_intensity: 2.77, raci_type: 'C', fte_load_pct: 4 },
  { tier: 'IT Business Ops', soc_code: '13-1000', soc_minor_group: 'Business Operations Specialists', apqc_l2_code: '8.4', apqc_l2_name: 'Manage enterprise information', apqc_l1_code: 8, similarity: 0.0293, confidence: 'Low', automability: 63.4, skill_intensity: 2.77, raci_type: 'C', fte_load_pct: 3 },
  { tier: 'IT Business Ops', soc_code: '13-1000', soc_minor_group: 'Business Operations Specialists', apqc_l2_code: '12.3', apqc_l2_name: 'Manage legal and ethical issues', apqc_l1_code: 12, similarity: 0.0280, confidence: 'Low', automability: 63.4, skill_intensity: 2.77, raci_type: 'C', fte_load_pct: 3 },
  { tier: 'IT Business Ops', soc_code: '13-1000', soc_minor_group: 'Business Operations Specialists', apqc_l2_code: '7.2', apqc_l2_name: 'Recruit, source and select employees', apqc_l1_code: 7, similarity: 0.0276, confidence: 'Low', automability: 63.4, skill_intensity: 2.77, raci_type: 'C', fte_load_pct: 3 },
  { tier: 'IT Business Ops', soc_code: '13-1000', soc_minor_group: 'Business Operations Specialists', apqc_l2_code: '3.1', apqc_l2_name: 'Understand markets, customers and capabilities', apqc_l1_code: 3, similarity: 0.0270, confidence: 'Low', automability: 63.4, skill_intensity: 2.77, raci_type: 'C', fte_load_pct: 3 },
  { tier: 'IT Business Ops', soc_code: '13-1000', soc_minor_group: 'Business Operations Specialists', apqc_l2_code: '3.5', apqc_l2_name: 'Develop and manage sales plans', apqc_l1_code: 3, similarity: 0.0270, confidence: 'Low', automability: 63.4, skill_intensity: 2.77, raci_type: 'C', fte_load_pct: 3 },
  { tier: 'IT Business Ops', soc_code: '13-1000', soc_minor_group: 'Business Operations Specialists', apqc_l2_code: '5.1', apqc_l2_name: 'Establish and manage service delivery governance', apqc_l1_code: 5, similarity: 0.0257, confidence: 'Low', automability: 63.4, skill_intensity: 2.77, raci_type: 'C', fte_load_pct: 3 },

  // ─── IT Business Ops: Financial Specialists (13-2000) ───
  { tier: 'IT Business Ops', soc_code: '13-2000', soc_minor_group: 'Financial Specialists', apqc_l2_code: '9.1', apqc_l2_name: 'Perform planning and management accounting', apqc_l1_code: 9, similarity: 0.0425, confidence: 'Medium', automability: 69.8, skill_intensity: 2.48, raci_type: 'R', fte_load_pct: 10 },
  { tier: 'IT Business Ops', soc_code: '13-2000', soc_minor_group: 'Financial Specialists', apqc_l2_code: '7.7', apqc_l2_name: 'Manage employee information and analytics', apqc_l1_code: 7, similarity: 0.0411, confidence: 'Medium', automability: 69.8, skill_intensity: 2.48, raci_type: 'R', fte_load_pct: 10 },
  { tier: 'IT Business Ops', soc_code: '13-2000', soc_minor_group: 'Financial Specialists', apqc_l2_code: '9.7', apqc_l2_name: 'Manage treasury operations', apqc_l1_code: 9, similarity: 0.0385, confidence: 'Medium', automability: 69.8, skill_intensity: 2.48, raci_type: 'R', fte_load_pct: 9 },
  { tier: 'IT Business Ops', soc_code: '13-2000', soc_minor_group: 'Financial Specialists', apqc_l2_code: '8.5', apqc_l2_name: 'Develop and maintain information technology solutions', apqc_l1_code: 8, similarity: 0.0360, confidence: 'Medium', automability: 69.8, skill_intensity: 2.48, raci_type: 'R', fte_load_pct: 9 },
  { tier: 'IT Business Ops', soc_code: '13-2000', soc_minor_group: 'Financial Specialists', apqc_l2_code: '2.2', apqc_l2_name: 'Develop products and services', apqc_l1_code: 2, similarity: 0.0355, confidence: 'Medium', automability: 69.8, skill_intensity: 2.48, raci_type: 'R', fte_load_pct: 9 },
  { tier: 'IT Business Ops', soc_code: '13-2000', soc_minor_group: 'Financial Specialists', apqc_l2_code: '7.1', apqc_l2_name: 'Develop and manage HR planning, policies and strategies', apqc_l1_code: 7, similarity: 0.0348, confidence: 'Low', automability: 69.8, skill_intensity: 2.48, raci_type: 'C', fte_load_pct: 4 },
  { tier: 'IT Business Ops', soc_code: '13-2000', soc_minor_group: 'Financial Specialists', apqc_l2_code: '8.1', apqc_l2_name: 'Manage the business of information technology', apqc_l1_code: 8, similarity: 0.0344, confidence: 'Low', automability: 69.8, skill_intensity: 2.48, raci_type: 'C', fte_load_pct: 4 },
  { tier: 'IT Business Ops', soc_code: '13-2000', soc_minor_group: 'Financial Specialists', apqc_l2_code: '9.9', apqc_l2_name: 'Manage taxes', apqc_l1_code: 9, similarity: 0.0343, confidence: 'Low', automability: 69.8, skill_intensity: 2.48, raci_type: 'C', fte_load_pct: 4 },
  { tier: 'IT Business Ops', soc_code: '13-2000', soc_minor_group: 'Financial Specialists', apqc_l2_code: '9.6', apqc_l2_name: 'Process accounts payable and expense reimbursements', apqc_l1_code: 9, similarity: 0.0305, confidence: 'Low', automability: 69.8, skill_intensity: 2.48, raci_type: 'C', fte_load_pct: 4 },
  { tier: 'IT Business Ops', soc_code: '13-2000', soc_minor_group: 'Financial Specialists', apqc_l2_code: '12.3', apqc_l2_name: 'Manage legal and ethical issues', apqc_l1_code: 12, similarity: 0.0284, confidence: 'Low', automability: 69.8, skill_intensity: 2.48, raci_type: 'C', fte_load_pct: 3 },
  { tier: 'IT Business Ops', soc_code: '13-2000', soc_minor_group: 'Financial Specialists', apqc_l2_code: '9.2', apqc_l2_name: 'Perform revenue accounting', apqc_l1_code: 9, similarity: 0.0252, confidence: 'Low', automability: 69.8, skill_intensity: 2.48, raci_type: 'C', fte_load_pct: 3 },

  // ─── IT Support/Admin: Information and Record Clerks (43-4000) ───
  { tier: 'IT Support/Admin', soc_code: '43-4000', soc_minor_group: 'Information and Record Clerks', apqc_l2_code: '4.4', apqc_l2_name: 'Deliver products to customers', apqc_l1_code: 4, similarity: 0.0352, confidence: 'Medium', automability: 62.9, skill_intensity: 2.09, raci_type: 'R', fte_load_pct: 28 },
  { tier: 'IT Support/Admin', soc_code: '43-4000', soc_minor_group: 'Information and Record Clerks', apqc_l2_code: '9.6', apqc_l2_name: 'Process accounts payable and expense reimbursements', apqc_l1_code: 9, similarity: 0.0270, confidence: 'Low', automability: 62.9, skill_intensity: 2.09, raci_type: 'C', fte_load_pct: 11 },
  { tier: 'IT Support/Admin', soc_code: '43-4000', soc_minor_group: 'Information and Record Clerks', apqc_l2_code: '9.5', apqc_l2_name: 'Process payroll', apqc_l1_code: 9, similarity: 0.0266, confidence: 'Low', automability: 62.9, skill_intensity: 2.09, raci_type: 'C', fte_load_pct: 11 },

  // ─── IT Support/Admin: Secretaries and Administrative Assistants (43-6000) ───
  { tier: 'IT Support/Admin', soc_code: '43-6000', soc_minor_group: 'Secretaries and Administrative Assistants', apqc_l2_code: '9.5', apqc_l2_name: 'Process payroll', apqc_l1_code: 9, similarity: 0.0466, confidence: 'Medium', automability: 59.9, skill_intensity: 2.08, raci_type: 'R', fte_load_pct: 37 },
  { tier: 'IT Support/Admin', soc_code: '43-6000', soc_minor_group: 'Secretaries and Administrative Assistants', apqc_l2_code: '8.5', apqc_l2_name: 'Develop and maintain information technology solutions', apqc_l1_code: 8, similarity: 0.0312, confidence: 'Low', automability: 59.9, skill_intensity: 2.08, raci_type: 'C', fte_load_pct: 13 },

  // ─── IT Support/Admin: Other Office/Admin Support (43-9000) ───
  { tier: 'IT Support/Admin', soc_code: '43-9000', soc_minor_group: 'Other Office and Administrative Support Workers', apqc_l2_code: '4.4', apqc_l2_name: 'Deliver products to customers', apqc_l1_code: 4, similarity: 0.0374, confidence: 'Medium', automability: 60.2, skill_intensity: 2.08, raci_type: 'R', fte_load_pct: 28 },
  { tier: 'IT Support/Admin', soc_code: '43-9000', soc_minor_group: 'Other Office and Administrative Support Workers', apqc_l2_code: '7.7', apqc_l2_name: 'Manage employee information and analytics', apqc_l1_code: 7, similarity: 0.0300, confidence: 'Low', automability: 60.2, skill_intensity: 2.08, raci_type: 'C', fte_load_pct: 11 },
  { tier: 'IT Support/Admin', soc_code: '43-9000', soc_minor_group: 'Other Office and Administrative Support Workers', apqc_l2_code: '8.4', apqc_l2_name: 'Manage enterprise information', apqc_l1_code: 8, similarity: 0.0276, confidence: 'Low', automability: 60.2, skill_intensity: 2.08, raci_type: 'C', fte_load_pct: 10 },

  // ─── IT Infrastructure: Electrical/Electronic Repair (49-2000) ───
  { tier: 'IT Infrastructure', soc_code: '49-2000', soc_minor_group: 'Electrical and Electronic Equipment Mechanics, Installers, and Repairers', apqc_l2_code: '10.3', apqc_l2_name: 'Manage and operate assets', apqc_l1_code: 10, similarity: 0.0378, confidence: 'Medium', automability: 46.1, skill_intensity: 2.98, raci_type: 'R', fte_load_pct: 40 },

  // ─── IT Infrastructure: Other Installation/Maintenance (49-9000) ───
  { tier: 'IT Infrastructure', soc_code: '49-9000', soc_minor_group: 'Other Installation, Maintenance, and Repair Occupations', apqc_l2_code: '10.3', apqc_l2_name: 'Manage and operate assets', apqc_l1_code: 10, similarity: 0.0479, confidence: 'Medium', automability: 42.8, skill_intensity: 2.74, raci_type: 'R', fte_load_pct: 37 },
  { tier: 'IT Infrastructure', soc_code: '49-9000', soc_minor_group: 'Other Installation, Maintenance, and Repair Occupations', apqc_l2_code: '10.2', apqc_l2_name: 'Design and construct productive assets', apqc_l1_code: 10, similarity: 0.0324, confidence: 'Low', automability: 42.8, skill_intensity: 2.74, raci_type: 'C', fte_load_pct: 13 },

  // ─── IT Compliance/Legal: Legal Support Workers (23-2000) ───
  { tier: 'IT Compliance/Legal', soc_code: '23-2000', soc_minor_group: 'Legal Support Workers', apqc_l2_code: '10.1', apqc_l2_name: 'Design and construct/acquire nonproductive assets', apqc_l1_code: 10, similarity: 0.0374, confidence: 'Medium', automability: 69.2, skill_intensity: 2.02, raci_type: 'C', fte_load_pct: 28 },
  { tier: 'IT Compliance/Legal', soc_code: '23-2000', soc_minor_group: 'Legal Support Workers', apqc_l2_code: '12.3', apqc_l2_name: 'Manage legal and ethical issues', apqc_l1_code: 12, similarity: 0.0305, confidence: 'Low', automability: 69.2, skill_intensity: 2.02, raci_type: 'I', fte_load_pct: 12 },
  { tier: 'IT Compliance/Legal', soc_code: '23-2000', soc_minor_group: 'Legal Support Workers', apqc_l2_code: '9.9', apqc_l2_name: 'Manage taxes', apqc_l1_code: 9, similarity: 0.0273, confidence: 'Low', automability: 69.2, skill_intensity: 2.02, raci_type: 'I', fte_load_pct: 10 },

  // ─── IT Content/Comms: Media and Communication Workers (27-3000) ───
  { tier: 'IT Content/Comms', soc_code: '27-3000', soc_minor_group: 'Media and Communication Workers', apqc_l2_code: '3.3', apqc_l2_name: 'Develop and manage marketing plans', apqc_l1_code: 3, similarity: 0.0492, confidence: 'Medium', automability: 58.5, skill_intensity: 2.24, raci_type: 'R', fte_load_pct: 29 },
  { tier: 'IT Content/Comms', soc_code: '27-3000', soc_minor_group: 'Media and Communication Workers', apqc_l2_code: '2.1', apqc_l2_name: 'Manage product and service portfolio', apqc_l1_code: 2, similarity: 0.0371, confidence: 'Medium', automability: 58.5, skill_intensity: 2.24, raci_type: 'R', fte_load_pct: 21 },

  // ─── IT Training: Other Teachers and Instructors (25-3000) ───
  { tier: 'IT Training', soc_code: '25-3000', soc_minor_group: 'Other Teachers and Instructors', apqc_l2_code: '7.3', apqc_l2_name: 'Develop and counsel employees', apqc_l1_code: 7, similarity: 0.0486, confidence: 'Medium', automability: 52.7, skill_intensity: 2.24, raci_type: 'R', fte_load_pct: 38 },
  { tier: 'IT Training', soc_code: '25-3000', soc_minor_group: 'Other Teachers and Instructors', apqc_l2_code: '8.5', apqc_l2_name: 'Develop and maintain information technology solutions', apqc_l1_code: 8, similarity: 0.0303, confidence: 'Low', automability: 52.7, skill_intensity: 2.24, raci_type: 'C', fte_load_pct: 12 },
];

// ── Query Helpers ──

/** Get all crosswalk entries for a specific IT tier */
export function getCrosswalkByTier(tier: ITTier): CrosswalkEntry[] {
  return CROSSWALK_DATA.filter(e => e.tier === tier);
}

/** Get all crosswalk entries for a specific SOC code */
export function getCrosswalkBySOC(socCode: string): CrosswalkEntry[] {
  return CROSSWALK_DATA.filter(e => e.soc_code === socCode);
}

/** Get all crosswalk entries for a specific APQC L2 process */
export function getCrosswalkByProcess(apqcL2Code: string): CrosswalkEntry[] {
  return CROSSWALK_DATA.filter(e => e.apqc_l2_code === apqcL2Code);
}

/** Get high-confidence mappings only */
export function getHighConfidenceMappings(): CrosswalkEntry[] {
  return CROSSWALK_DATA.filter(e => e.confidence === 'High');
}

/** Get crosswalk entries filtered by minimum confidence */
export function getCrosswalkByMinConfidence(
  minConfidence: CrosswalkConfidence,
): CrosswalkEntry[] {
  const levels: CrosswalkConfidence[] = ['High', 'Medium', 'Low'];
  const minIdx = levels.indexOf(minConfidence);
  return CROSSWALK_DATA.filter(e => levels.indexOf(e.confidence) <= minIdx);
}

/** Get unique APQC L2 codes that a tier touches */
export function getProcessesTouchedByTier(tier: ITTier): string[] {
  const codes = new Set(
    CROSSWALK_DATA.filter(e => e.tier === tier).map(e => e.apqc_l2_code),
  );
  return [...codes].sort();
}

/** Get tier-level automability exposure summary */
export function getAutomabilityByTier(): {
  tier: ITTier;
  avg_automability: number;
  max_automability: number;
  min_automability: number;
  role_count: number;
}[] {
  const tierMap = new Map<ITTier, Set<string>>();
  const tierAuto = new Map<ITTier, number[]>();

  for (const entry of CROSSWALK_DATA) {
    if (!tierMap.has(entry.tier)) {
      tierMap.set(entry.tier, new Set());
      tierAuto.set(entry.tier, []);
    }
    const socSet = tierMap.get(entry.tier)!;
    if (!socSet.has(entry.soc_code)) {
      socSet.add(entry.soc_code);
      tierAuto.get(entry.tier)!.push(entry.automability);
    }
  }

  return [...tierMap.entries()].map(([tier, socSet]) => {
    const scores = tierAuto.get(tier)!;
    return {
      tier,
      avg_automability: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
      max_automability: Math.max(...scores),
      min_automability: Math.min(...scores),
      role_count: socSet.size,
    };
  }).sort((a, b) => b.avg_automability - a.avg_automability);
}
