/**
 * IT Department Role Definitions & Tier Taxonomy
 *
 * Source: O*NET-SOC 30.2 — IT-relevant role groups
 * 16 role groups organized into 8 IT tiers.
 *
 * Each role group includes:
 *   - SOC minor group code and title
 *   - IT tier classification
 *   - Automability score (0-100, higher = more automatable by AI)
 *   - AI opportunity tier
 *   - Number of APQC processes touched
 *   - Rationale explaining IT relevance
 *   - Common job titles for classification matching
 */

// ── IT Tier (8 tiers) ──

export const IT_TIERS = [
  'Core IT',
  'IT Business Ops',
  'IT Compliance/Legal',
  'IT Support/Admin',
  'IT-Adjacent Engineering',
  'IT Management',
  'IT Content/Comms',
  'IT Training',
  'IT Infrastructure',
] as const;

export type ITTier = typeof IT_TIERS[number];

// ── AI Opportunity Tier ──

export const AI_TIERS = [
  'Highest AI Opp.',
  'High',
  'Moderate',
  'Lower',
] as const;

export type AITier = typeof AI_TIERS[number];

// ── Role Group Definition ──

export interface ITRoleGroup {
  /** SOC minor group code (e.g., '15-2000') */
  soc_code: string;
  /** SOC minor group title */
  soc_minor_group: string;
  /** IT tier this role group belongs to */
  tier: ITTier;
  /** Automability score (0-100). Higher = more tasks AI can handle */
  automability: number | null;
  /** AI opportunity tier classification */
  ai_tier: AITier;
  /** Number of APQC L2 processes this role touches */
  processes_touched: number;
  /** Rationale for including this SOC group in IT roles */
  rationale: string;
  /** Skill intensity score (1-5 scale) from crosswalk data */
  skill_intensity: number;
  /** Common job titles that map to this role group (for classifier) */
  common_titles: string[];
}

// ── Role Group Database (16 groups, ranked by automability) ──

export const IT_ROLE_GROUPS: ITRoleGroup[] = [
  {
    soc_code: '15-2000',
    soc_minor_group: 'Mathematical Science Occupations',
    tier: 'Core IT',
    automability: 71.9,
    ai_tier: 'Highest AI Opp.',
    processes_touched: 11,
    rationale: 'Actuaries, statisticians, data scientists, operations researchers — analytics/data roles embedded in IT',
    skill_intensity: 2.93,
    common_titles: [
      'data scientist', 'data analyst', 'statistician', 'operations researcher',
      'quantitative analyst', 'actuary', 'machine learning engineer', 'ai engineer',
      'analytics engineer', 'business intelligence analyst', 'data engineer',
    ],
  },
  {
    soc_code: '13-2000',
    soc_minor_group: 'Financial Specialists',
    tier: 'IT Business Ops',
    automability: 69.8,
    ai_tier: 'Highest AI Opp.',
    processes_touched: 11,
    rationale: 'Financial Specialists — IT financial planning, IT budget analysis, IT vendor contract management',
    skill_intensity: 2.48,
    common_titles: [
      'it financial analyst', 'it budget analyst', 'technology finance manager',
      'it procurement specialist', 'vendor contract manager', 'finops analyst',
      'it cost analyst', 'technology business analyst',
    ],
  },
  {
    soc_code: '23-2000',
    soc_minor_group: 'Legal Support Workers',
    tier: 'IT Compliance/Legal',
    automability: 69.2,
    ai_tier: 'Highest AI Opp.',
    processes_touched: 3,
    rationale: 'Legal Support — IT contract review, software licensing, data privacy compliance, IP support',
    skill_intensity: 2.02,
    common_titles: [
      'it compliance analyst', 'software licensing specialist', 'data privacy analyst',
      'it contract specialist', 'technology compliance officer', 'ip specialist',
      'it auditor', 'technology risk analyst', 'it governance analyst',
    ],
  },
  {
    soc_code: '13-1000',
    soc_minor_group: 'Business Operations Specialists',
    tier: 'IT Business Ops',
    automability: 63.4,
    ai_tier: 'High',
    processes_touched: 11,
    rationale: 'Business Operations Specialists — IT Business Analysts, IT Project Managers, Management Analysts',
    skill_intensity: 2.77,
    common_titles: [
      'it business analyst', 'it project manager', 'scrum master', 'agile coach',
      'business systems analyst', 'it management analyst', 'release manager',
      'it process analyst', 'it operations analyst', 'change manager',
    ],
  },
  {
    soc_code: '43-4000',
    soc_minor_group: 'Information and Record Clerks',
    tier: 'IT Support/Admin',
    automability: 62.9,
    ai_tier: 'High',
    processes_touched: 3,
    rationale: 'Information and Record Clerks — IT service desk, ticket management, IT asset tracking',
    skill_intensity: 2.09,
    common_titles: [
      'it service desk analyst', 'help desk technician', 'it asset clerk',
      'ticket coordinator', 'it support clerk', 'service catalog coordinator',
    ],
  },
  {
    soc_code: '17-2000',
    soc_minor_group: 'Engineers',
    tier: 'IT-Adjacent Engineering',
    automability: 61.4,
    ai_tier: 'High',
    processes_touched: 7,
    rationale: 'Engineers — Computer Hardware Engineers, Electronics Engineers, Systems Engineers',
    skill_intensity: 3.51,
    common_titles: [
      'hardware engineer', 'systems engineer', 'electronics engineer',
      'network engineer', 'infrastructure engineer', 'platform engineer',
      'site reliability engineer', 'devops engineer', 'cloud engineer',
      'solutions architect', 'enterprise architect',
    ],
  },
  {
    soc_code: '11-3000',
    soc_minor_group: 'Operations Specialties Managers',
    tier: 'IT Management',
    automability: 60.4,
    ai_tier: 'High',
    processes_touched: 19,
    rationale: 'Operations Specialties Managers — includes CIO, IT Managers, IS Directors, IT Project Managers',
    skill_intensity: 3.20,
    common_titles: [
      'it manager', 'it director', 'is director', 'it operations manager',
      'infrastructure manager', 'security manager', 'application manager',
      'it service delivery manager', 'it program manager', 'it portfolio manager',
    ],
  },
  {
    soc_code: '43-9000',
    soc_minor_group: 'Other Office and Administrative Support Workers',
    tier: 'IT Support/Admin',
    automability: 60.2,
    ai_tier: 'High',
    processes_touched: 3,
    rationale: 'Other Office/Admin Support — data entry operators, IT administrative support, help desk coordinators',
    skill_intensity: 2.08,
    common_titles: [
      'data entry operator', 'it administrative assistant', 'help desk coordinator',
      'it support specialist', 'desktop support technician', 'it coordinator',
    ],
  },
  {
    soc_code: '43-6000',
    soc_minor_group: 'Secretaries and Administrative Assistants',
    tier: 'IT Support/Admin',
    automability: 59.9,
    ai_tier: 'High',
    processes_touched: 2,
    rationale: 'Secretaries/Admin Assistants — IT department administrative support, executive assistant to CIO',
    skill_intensity: 2.08,
    common_titles: [
      'it executive assistant', 'cio assistant', 'it department secretary',
      'it administrative coordinator',
    ],
  },
  {
    soc_code: '11-1000',
    soc_minor_group: 'Top Executives',
    tier: 'IT Management',
    automability: 59.4,
    ai_tier: 'High',
    processes_touched: 18,
    rationale: 'Top Executives — CIO, CTO, CISO; strategic IT governance and digital transformation leadership',
    skill_intensity: 3.30,
    common_titles: [
      'cio', 'cto', 'ciso', 'chief information officer', 'chief technology officer',
      'chief information security officer', 'vp of it', 'vp of technology',
      'svp technology', 'head of it', 'it executive',
    ],
  },
  {
    soc_code: '27-3000',
    soc_minor_group: 'Media and Communication Workers',
    tier: 'IT Content/Comms',
    automability: 58.5,
    ai_tier: 'High',
    processes_touched: 2,
    rationale: 'Media/Communication Workers — technical writers, UX writers, IT communications specialists',
    skill_intensity: 2.24,
    common_titles: [
      'technical writer', 'ux writer', 'it communications specialist',
      'documentation specialist', 'content developer', 'it knowledge manager',
    ],
  },
  {
    soc_code: '17-3000',
    soc_minor_group: 'Drafters, Engineering Technicians, and Mapping Technicians',
    tier: 'IT-Adjacent Engineering',
    automability: 55.5,
    ai_tier: 'High',
    processes_touched: 3,
    rationale: 'Engineering Technicians — Electronics/Electrical technicians supporting IT infrastructure',
    skill_intensity: 3.04,
    common_titles: [
      'it technician', 'electronics technician', 'lab technician',
      'engineering technician', 'it test technician', 'hardware technician',
    ],
  },
  {
    soc_code: '25-3000',
    soc_minor_group: 'Other Teachers and Instructors',
    tier: 'IT Training',
    automability: 52.7,
    ai_tier: 'Moderate',
    processes_touched: 2,
    rationale: 'Other Teachers/Instructors — IT training specialists, corporate technology trainers, LMS administrators',
    skill_intensity: 2.24,
    common_titles: [
      'it trainer', 'technology trainer', 'lms administrator',
      'it training specialist', 'learning management specialist',
      'corporate technology instructor', 'it onboarding specialist',
    ],
  },
  {
    soc_code: '49-2000',
    soc_minor_group: 'Electrical and Electronic Equipment Mechanics, Installers, and Repairers',
    tier: 'IT Infrastructure',
    automability: 46.1,
    ai_tier: 'Moderate',
    processes_touched: 1,
    rationale: 'Electrical/Electronic Repair — telecom installers, computer repair technicians, network cabling',
    skill_intensity: 2.98,
    common_titles: [
      'telecom installer', 'computer repair technician', 'network cabling technician',
      'field technician', 'telecom technician', 'equipment repair technician',
    ],
  },
  {
    soc_code: '49-9000',
    soc_minor_group: 'Other Installation, Maintenance, and Repair Occupations',
    tier: 'IT Infrastructure',
    automability: 42.8,
    ai_tier: 'Lower',
    processes_touched: 2,
    rationale: 'Other Installation/Maintenance — IT equipment maintenance, data center facilities, UPS systems',
    skill_intensity: 2.74,
    common_titles: [
      'data center technician', 'facilities technician', 'ups technician',
      'it maintenance technician', 'data center engineer', 'facilities engineer',
    ],
  },
  {
    // Special entry: core IT developers/architects — no automability score in source
    soc_code: '15-1200',
    soc_minor_group: 'Computer Occupations',
    tier: 'Core IT',
    automability: null,
    ai_tier: 'Lower',
    processes_touched: 0,
    rationale: 'Software developers, sysadmins, DBAs, network architects, cybersecurity analysts, data scientists, web developers, cloud engineers',
    skill_intensity: 3.20, // estimated average for this broad group
    common_titles: [
      'software developer', 'software engineer', 'web developer', 'frontend developer',
      'backend developer', 'full stack developer', 'mobile developer',
      'systems administrator', 'sysadmin', 'database administrator', 'dba',
      'network architect', 'cloud architect', 'security analyst',
      'cybersecurity analyst', 'information security analyst', 'penetration tester',
      'qa engineer', 'test engineer', 'automation engineer',
      'devops engineer', 'cloud engineer', 'site reliability engineer',
    ],
  },
];

// ── Lookup Helpers ──

const roleBySOC = new Map(IT_ROLE_GROUPS.map(r => [r.soc_code, r]));
const rolesByTier = new Map<ITTier, ITRoleGroup[]>();
for (const role of IT_ROLE_GROUPS) {
  const list = rolesByTier.get(role.tier) ?? [];
  list.push(role);
  rolesByTier.set(role.tier, list);
}

/** Get a role group by SOC code */
export function getRoleGroupBySOC(socCode: string): ITRoleGroup | undefined {
  return roleBySOC.get(socCode);
}

/** Get all role groups in a given IT tier */
export function getRoleGroupsByTier(tier: ITTier): ITRoleGroup[] {
  return rolesByTier.get(tier) ?? [];
}

/** Get all role groups sorted by automability (descending) */
export function getRoleGroupsByAutomability(): ITRoleGroup[] {
  return [...IT_ROLE_GROUPS]
    .filter(r => r.automability !== null)
    .sort((a, b) => (b.automability ?? 0) - (a.automability ?? 0));
}

/** Get tier-level summary statistics */
export function getTierSummary(): {
  tier: ITTier;
  role_count: number;
  avg_automability: number;
  total_processes: number;
  ai_tier: AITier;
}[] {
  const tiers = [...rolesByTier.entries()].map(([tier, roles]) => {
    const withScore = roles.filter(r => r.automability !== null);
    const avgAuto = withScore.length > 0
      ? withScore.reduce((sum, r) => sum + (r.automability ?? 0), 0) / withScore.length
      : 0;
    const totalProcs = roles.reduce((sum, r) => sum + r.processes_touched, 0);
    // Take the highest AI tier from the group
    const tierOrder: AITier[] = ['Highest AI Opp.', 'High', 'Moderate', 'Lower'];
    const bestTier = tierOrder.find(t => roles.some(r => r.ai_tier === t)) ?? 'Lower';

    return {
      tier,
      role_count: roles.length,
      avg_automability: Math.round(avgAuto * 10) / 10,
      total_processes: totalProcs,
      ai_tier: bestTier,
    };
  });

  return tiers.sort((a, b) => b.avg_automability - a.avg_automability);
}
