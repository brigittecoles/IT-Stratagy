/**
 * APQC Process Classification Framework (PCF) v7.3 — IT-Relevant Subset
 *
 * 63 APQC L2 processes organized under 13 L1 categories.
 * Only 46 of 63 L2 processes have IT role mappings in the crosswalk.
 *
 * APQC PCF is the industry standard for process benchmarking.
 * Used here to understand which business processes IT roles support.
 */

// ── APQC L1 Categories ──

export interface APQC_L1 {
  code: number;
  name: string;
}

export const APQC_L1_CATEGORIES: APQC_L1[] = [
  { code: 1, name: 'Develop Vision and Strategy' },
  { code: 2, name: 'Develop and Manage Products and Services' },
  { code: 3, name: 'Market and Sell Products and Services' },
  { code: 4, name: 'Deliver Products and Services' },
  { code: 5, name: 'Manage Customer Service' },
  { code: 6, name: 'Develop and Manage Human Capital' },
  { code: 7, name: 'Manage Information Technology' },
  { code: 8, name: 'Manage Financial Resources' },
  { code: 9, name: 'Acquire, Construct, and Manage Assets' },
  { code: 10, name: 'Manage Enterprise Risk, Compliance, Remediation, and Resiliency' },
  { code: 11, name: 'Manage External Relationships' },
  { code: 12, name: 'Develop and Manage Business Capabilities' },
  { code: 13, name: 'Manage Environmental Health and Safety' },
];

// ── APQC L2 Processes ──

export interface APQC_L2 {
  code: string;
  name: string;
  l1_code: number;
  /** Whether this L2 has IT role mappings in the crosswalk */
  has_it_mapping: boolean;
}

export const APQC_L2_PROCESSES: APQC_L2[] = [
  // 1 — Develop Vision and Strategy
  { code: '1.1', name: 'Define the business concept and long-range vision', l1_code: 1, has_it_mapping: false },
  { code: '1.2', name: 'Develop business strategy', l1_code: 1, has_it_mapping: true },
  { code: '1.3', name: 'Manage strategic initiatives', l1_code: 1, has_it_mapping: true },

  // 2 — Develop and Manage Products and Services
  { code: '2.1', name: 'Manage product and service portfolio', l1_code: 2, has_it_mapping: true },
  { code: '2.2', name: 'Develop products and services', l1_code: 2, has_it_mapping: true },

  // 3 — Market and Sell Products and Services
  { code: '3.1', name: 'Understand markets, customers and capabilities', l1_code: 3, has_it_mapping: true },
  { code: '3.2', name: 'Develop marketing strategy', l1_code: 3, has_it_mapping: true },
  { code: '3.3', name: 'Develop and manage marketing plans', l1_code: 3, has_it_mapping: true },
  { code: '3.4', name: 'Manage sales', l1_code: 3, has_it_mapping: true },
  { code: '3.5', name: 'Develop and manage sales plans', l1_code: 3, has_it_mapping: true },

  // 4 — Deliver Products and Services
  { code: '4.1', name: 'Plan for and acquire necessary resources (Supply Chain Planning)', l1_code: 4, has_it_mapping: true },
  { code: '4.2', name: 'Procure materials and services', l1_code: 4, has_it_mapping: true },
  { code: '4.3', name: 'Produce/Manufacture/Deliver product', l1_code: 4, has_it_mapping: true },
  { code: '4.4', name: 'Deliver products to customers', l1_code: 4, has_it_mapping: true },
  { code: '4.5', name: 'Manage logistics and warehousing', l1_code: 4, has_it_mapping: true },

  // 5 — Manage Customer Service
  { code: '5.1', name: 'Establish and manage service delivery governance', l1_code: 5, has_it_mapping: true },
  { code: '5.2', name: 'Manage customer service operations', l1_code: 5, has_it_mapping: true },
  { code: '5.3', name: 'Measure and evaluate customer service operations', l1_code: 5, has_it_mapping: true },

  // 6 — Develop and Manage Human Capital
  { code: '6.1', name: 'Manage customer interactions', l1_code: 6, has_it_mapping: true },
  { code: '6.2', name: 'Plan and manage customer service operations', l1_code: 6, has_it_mapping: true },
  { code: '6.3', name: 'Measure and evaluate customer service operations', l1_code: 6, has_it_mapping: true },

  // 7 — Manage Human Capital
  { code: '7.1', name: 'Develop and manage HR planning, policies and strategies', l1_code: 7, has_it_mapping: true },
  { code: '7.2', name: 'Recruit, source and select employees', l1_code: 7, has_it_mapping: true },
  { code: '7.3', name: 'Develop and counsel employees', l1_code: 7, has_it_mapping: true },
  { code: '7.4', name: 'Manage employee relations', l1_code: 7, has_it_mapping: true },
  { code: '7.5', name: 'Reward and retain employees', l1_code: 7, has_it_mapping: true },
  { code: '7.6', name: 'Redeploy and retire employees', l1_code: 7, has_it_mapping: true },
  { code: '7.7', name: 'Manage employee information and analytics', l1_code: 7, has_it_mapping: true },

  // 8 — Manage Information Technology
  { code: '8.1', name: 'Manage the business of information technology', l1_code: 8, has_it_mapping: true },
  { code: '8.2', name: 'Develop and manage IT customer relationships', l1_code: 8, has_it_mapping: true },
  { code: '8.3', name: 'Develop and implement security, privacy, and data protection controls', l1_code: 8, has_it_mapping: true },
  { code: '8.4', name: 'Manage enterprise information', l1_code: 8, has_it_mapping: true },
  { code: '8.5', name: 'Develop and maintain information technology solutions', l1_code: 8, has_it_mapping: true },
  { code: '8.6', name: 'Deploy information technology solutions', l1_code: 8, has_it_mapping: false },
  { code: '8.7', name: 'Deliver and support information technology services', l1_code: 8, has_it_mapping: true },

  // 9 — Manage Financial Resources
  { code: '9.1', name: 'Perform planning and management accounting', l1_code: 9, has_it_mapping: true },
  { code: '9.2', name: 'Perform revenue accounting', l1_code: 9, has_it_mapping: true },
  { code: '9.3', name: 'Perform general accounting and reporting', l1_code: 9, has_it_mapping: true },
  { code: '9.4', name: 'Manage fixed-asset project accounting', l1_code: 9, has_it_mapping: true },
  { code: '9.5', name: 'Process payroll', l1_code: 9, has_it_mapping: true },
  { code: '9.6', name: 'Process accounts payable and expense reimbursements', l1_code: 9, has_it_mapping: true },
  { code: '9.7', name: 'Manage treasury operations', l1_code: 9, has_it_mapping: true },
  { code: '9.8', name: 'Manage internal controls', l1_code: 9, has_it_mapping: true },
  { code: '9.9', name: 'Manage taxes', l1_code: 9, has_it_mapping: true },

  // 10 — Acquire, Construct, and Manage Assets
  { code: '10.1', name: 'Design and construct/acquire nonproductive assets', l1_code: 10, has_it_mapping: true },
  { code: '10.2', name: 'Design and construct productive assets', l1_code: 10, has_it_mapping: true },
  { code: '10.3', name: 'Manage and operate assets', l1_code: 10, has_it_mapping: true },
  { code: '10.4', name: 'Dispose of assets', l1_code: 10, has_it_mapping: true },

  // 11 — Manage Enterprise Risk, Compliance, and Resiliency
  { code: '11.1', name: 'Manage enterprise risk', l1_code: 11, has_it_mapping: true },
  { code: '11.2', name: 'Manage compliance', l1_code: 11, has_it_mapping: true },
  { code: '11.3', name: 'Manage remediation efforts', l1_code: 11, has_it_mapping: true },
  { code: '11.4', name: 'Manage business resiliency', l1_code: 11, has_it_mapping: true },

  // 12 — Manage External Relationships
  { code: '12.1', name: 'Build investor relationships', l1_code: 12, has_it_mapping: true },
  { code: '12.2', name: 'Manage government and industry relationships', l1_code: 12, has_it_mapping: true },
  { code: '12.3', name: 'Manage legal and ethical issues', l1_code: 12, has_it_mapping: true },
  { code: '12.4', name: 'Manage public relations program', l1_code: 12, has_it_mapping: true },

  // 13 — Develop and Manage Business Capabilities
  { code: '13.1', name: 'Manage business processes', l1_code: 13, has_it_mapping: true },
  { code: '13.2', name: 'Manage portfolio, program, and project', l1_code: 13, has_it_mapping: true },
  { code: '13.3', name: 'Manage enterprise quality', l1_code: 13, has_it_mapping: true },
  { code: '13.4', name: 'Manage change', l1_code: 13, has_it_mapping: true },
  { code: '13.5', name: 'Benchmark and measure performance', l1_code: 13, has_it_mapping: true },
  { code: '13.6', name: 'Manage knowledge', l1_code: 13, has_it_mapping: true },
  { code: '13.7', name: 'Manage Environmental Health and Safety (EHS)', l1_code: 13, has_it_mapping: true },
];

// ── Lookup Helpers ──

const l2ByCode = new Map(APQC_L2_PROCESSES.map(p => [p.code, p]));

/** Get an APQC L2 process by code (e.g., '8.5') */
export function getAPQC_L2(code: string): APQC_L2 | undefined {
  return l2ByCode.get(code);
}

/** Get all APQC L2 processes that have IT role mappings */
export function getITMappedProcesses(): APQC_L2[] {
  return APQC_L2_PROCESSES.filter(p => p.has_it_mapping);
}

/** Get all L2 processes under a given L1 category */
export function getProcessesByL1(l1Code: number): APQC_L2[] {
  return APQC_L2_PROCESSES.filter(p => p.l1_code === l1Code);
}

/** Get the L1 category for a given L2 code */
export function getL1ForL2(l2Code: string): APQC_L1 | undefined {
  const l2 = l2ByCode.get(l2Code);
  if (!l2) return undefined;
  return APQC_L1_CATEGORIES.find(c => c.code === l2.l1_code);
}
