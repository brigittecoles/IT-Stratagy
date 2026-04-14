/**
 * IT Spend Tower Definitions & Classification Logic
 *
 * Aligned to Gartner IT Key Metrics Data framework.
 * Used by N08 (Vendor + Tower Math) to classify vendor, application,
 * and service spend into standard cost towers.
 *
 * Each tower includes:
 *   - Definition and scope
 *   - Typical cost components
 *   - Keywords for auto-classification
 *   - Gartner benchmark context (Run/Grow/Transform typical mix)
 */

import type { ITSpendTower } from '@/lib/schema/value-lists';
import { IT_SPEND_TOWERS } from '@/lib/schema/value-lists';

// ── Tower Definition ──

export interface TowerDefinition {
  /** Tower name (matches ITSpendTower enum) */
  tower: ITSpendTower;
  /** Short description for UI display */
  short_description: string;
  /** Full scope definition for analysis narrative */
  scope: string;
  /** What typically lands in this tower */
  includes: string[];
  /** What does NOT belong here (common misclassifications) */
  excludes: string[];
  /** Typical Run/Grow/Transform split for this tower */
  typical_rgt_split: { run: number; grow: number; transform: number };
  /** Typical OpEx/CapEx split */
  typical_opex_capex: { opex: number; capex: number };
  /** Common IT budget line items */
  budget_line_items: string[];
}

export const TOWER_DEFINITIONS: TowerDefinition[] = [
  {
    tower: 'Infrastructure & Operations',
    short_description: 'Data centers, cloud hosting, compute, storage, and network infrastructure',
    scope: 'All spend related to running and maintaining the foundational technology environment, including physical and virtual infrastructure, cloud IaaS/PaaS, server and storage hardware, operating systems, monitoring, backup and DR, and facilities costs for data centers.',
    includes: [
      'Data center facilities and colocation',
      'Cloud IaaS and PaaS (AWS, Azure, GCP compute/storage)',
      'Server hardware and virtualization (VMware, Hyper-V)',
      'Storage systems (SAN, NAS, object storage)',
      'Database hosting and administration (not BI/analytics)',
      'Backup, disaster recovery, and business continuity',
      'Infrastructure monitoring and AIOps',
      'Operating system licenses (Windows Server, Linux)',
      'Container orchestration (Kubernetes, Docker)',
      'DevOps infrastructure (CI/CD pipelines, build systems)',
    ],
    excludes: [
      'Network switches and WAN links (→ Telecommunications)',
      'Cybersecurity tools (→ Security & Risk)',
      'End-user devices and desktop support (→ End User Services)',
      'Custom application development (→ Application Development & Support)',
    ],
    typical_rgt_split: { run: 0.80, grow: 0.12, transform: 0.08 },
    typical_opex_capex: { opex: 0.55, capex: 0.45 },
    budget_line_items: [
      'Cloud hosting (IaaS/PaaS)', 'Data center lease/power/cooling',
      'Server hardware refresh', 'Storage refresh', 'Virtualization licenses',
      'Backup/DR services', 'Database licenses (operational)', 'OS licenses',
      'Infrastructure managed services', 'Monitoring/observability tools',
    ],
  },
  {
    tower: 'Application Development & Support',
    short_description: 'Custom software development, application maintenance, and DevOps',
    scope: 'All spend on building, maintaining, and enhancing custom or bespoke applications. Includes internal and external development teams, application support and maintenance contracts, QA/testing, and application lifecycle management. Does NOT include packaged enterprise software (that is Enterprise Applications).',
    includes: [
      'Custom application development (internal teams)',
      'Outsourced/contracted application development',
      'Application maintenance and support agreements',
      'Quality assurance and testing tools',
      'Application performance monitoring (APM)',
      'Low-code/no-code platform development (Mendix, OutSystems)',
      'API management and integration platforms (MuleSoft, Boomi)',
      'Software development tools and IDEs',
      'Version control and code repositories (GitHub, GitLab)',
      'Technical debt remediation',
    ],
    excludes: [
      'ERP/CRM/SCM license and implementation (→ Enterprise Applications)',
      'Infrastructure for hosting apps (→ Infrastructure & Operations)',
      'Data/BI platform build (→ Data & Analytics)',
    ],
    typical_rgt_split: { run: 0.45, grow: 0.35, transform: 0.20 },
    typical_opex_capex: { opex: 0.70, capex: 0.30 },
    budget_line_items: [
      'Development staff costs', 'Contracted developers',
      'Application support contracts', 'Testing tools/services',
      'APM tools (Datadog, Dynatrace, New Relic)', 'Low-code platforms',
      'Integration middleware', 'API management', 'Dev tools/licenses',
    ],
  },
  {
    tower: 'Enterprise Applications',
    short_description: 'ERP, CRM, SCM, HCM, and other packaged business software',
    scope: 'All spend on licensed, packaged, or SaaS business applications that support core business processes. Includes license/subscription fees, implementation projects, configuration, upgrades, and vendor support. The boundary is: if you bought it as a product (not built it), it belongs here.',
    includes: [
      'ERP systems (SAP, Oracle, Workday, NetSuite, Dynamics 365)',
      'CRM systems (Salesforce, HubSpot, Dynamics CRM)',
      'Supply chain management (Blue Yonder, Kinaxis, Manhattan)',
      'Human capital management / HRIS (Workday HCM, ADP, SuccessFactors)',
      'Financial planning and analysis (Anaplan, Adaptive)',
      'Procurement platforms (Ariba, Coupa, Jaggaer)',
      'Industry-specific applications (Epic, Cerner for healthcare; Temenos for banking)',
      'Enterprise application implementation projects',
      'ERP/CRM upgrade and migration projects',
      'Vendor support and maintenance agreements',
    ],
    excludes: [
      'Custom-built applications (→ Application Development & Support)',
      'BI and analytics platforms (→ Data & Analytics)',
      'Security tools (→ Security & Risk)',
      'Collaboration tools like Teams/Slack (→ End User Services)',
    ],
    typical_rgt_split: { run: 0.55, grow: 0.20, transform: 0.25 },
    typical_opex_capex: { opex: 0.65, capex: 0.35 },
    budget_line_items: [
      'ERP licenses/subscriptions', 'CRM licenses/subscriptions',
      'HCM/HRIS platforms', 'SCM platforms', 'ERP implementation consulting',
      'Application upgrade projects', 'Vendor support/maintenance fees',
      'Industry application licenses', 'SaaS business application subscriptions',
    ],
  },
  {
    tower: 'Security & Risk',
    short_description: 'Cybersecurity, identity management, compliance, and risk tools',
    scope: 'All spend on protecting the organization from cyber threats and ensuring compliance with regulatory requirements. Includes security operations, identity and access management, vulnerability management, compliance tooling, security consulting, and insurance.',
    includes: [
      'Security operations center (SOC) — internal or MSSP',
      'Identity and access management (IAM, PAM — Okta, CyberArk, Ping)',
      'Endpoint security (CrowdStrike, SentinelOne, Carbon Black)',
      'Network security (firewalls, IDS/IPS, WAF — Palo Alto, Fortinet, Zscaler)',
      'SIEM and security analytics (Splunk, Sentinel, QRadar)',
      'Vulnerability management and pen testing',
      'Email security and anti-phishing',
      'Data loss prevention (DLP)',
      'GRC platforms (ServiceNow GRC, RSA Archer, OneTrust)',
      'Cyber insurance premiums',
      'Security awareness training',
      'Zero trust architecture implementation',
    ],
    excludes: [
      'Physical security / building access (not IT)',
      'Backup and DR (→ Infrastructure & Operations)',
      'Network switches and WAN (→ Telecommunications)',
    ],
    typical_rgt_split: { run: 0.65, grow: 0.25, transform: 0.10 },
    typical_opex_capex: { opex: 0.85, capex: 0.15 },
    budget_line_items: [
      'MSSP/SOC services', 'IAM platform licenses', 'Endpoint protection',
      'Firewall/network security', 'SIEM platform', 'Pen testing services',
      'GRC/compliance tools', 'Security consulting', 'Cyber insurance',
      'Security training platforms', 'DLP tools',
    ],
  },
  {
    tower: 'Data & Analytics',
    short_description: 'Business intelligence, data platforms, AI/ML, and analytics',
    scope: 'All spend on data infrastructure, business intelligence, reporting, advanced analytics, and AI/ML initiatives. Includes data warehousing, data lakes, ETL/ELT, BI tools, data governance, and data science platforms.',
    includes: [
      'Data warehouse and data lake platforms (Snowflake, Databricks, BigQuery, Redshift)',
      'Business intelligence tools (Tableau, Power BI, Looker, Qlik)',
      'ETL/ELT and data integration (Informatica, Fivetran, dbt)',
      'AI/ML platforms and compute (SageMaker, Azure ML, Vertex AI)',
      'Data governance and cataloging (Collibra, Alation, Atlan)',
      'Master data management (MDM)',
      'Reporting and dashboarding',
      'Data quality tools',
      'Data science team costs',
      'GenAI/LLM platform costs',
    ],
    excludes: [
      'Operational database hosting (→ Infrastructure & Operations)',
      'ERP reporting modules (→ Enterprise Applications)',
      'Security analytics / SIEM (→ Security & Risk)',
    ],
    typical_rgt_split: { run: 0.40, grow: 0.35, transform: 0.25 },
    typical_opex_capex: { opex: 0.75, capex: 0.25 },
    budget_line_items: [
      'Data warehouse/lake platform', 'BI tool licenses', 'ETL/integration tools',
      'AI/ML platform costs', 'Data governance platform', 'Data engineering staff',
      'Data science team', 'MDM tools', 'Reporting tools',
    ],
  },
  {
    tower: 'End User Services',
    short_description: 'Help desk, devices, collaboration tools, and desktop management',
    scope: 'All spend on equipping and supporting end users. Includes service desk operations, endpoint devices (laptops, desktops, phones), device management, collaboration platforms, and productivity suites.',
    includes: [
      'Service desk / help desk (internal or outsourced)',
      'Desktop and laptop procurement',
      'Mobile device procurement and MDM',
      'Collaboration platforms (Microsoft 365, Google Workspace)',
      'Video conferencing (Zoom, Teams, Webex)',
      'Chat/messaging (Slack, Teams)',
      'Printing and peripherals',
      'Virtual desktop infrastructure (VDI / AVD / Citrix)',
      'Digital workplace platforms',
      'Employee onboarding/offboarding IT services',
    ],
    excludes: [
      'Network infrastructure connecting users (→ Telecommunications)',
      'Identity and access management (→ Security & Risk)',
      'ERP/CRM end-user licenses (→ Enterprise Applications)',
    ],
    typical_rgt_split: { run: 0.80, grow: 0.15, transform: 0.05 },
    typical_opex_capex: { opex: 0.60, capex: 0.40 },
    budget_line_items: [
      'Service desk staff/contract', 'PC/laptop refresh', 'Mobile devices',
      'Microsoft 365 / Google Workspace', 'Zoom/Teams/Webex licenses',
      'Printing services', 'VDI/DaaS platform', 'MDM platform',
      'Peripheral equipment', 'Digital workplace tools',
    ],
  },
  {
    tower: 'Telecommunications',
    short_description: 'WAN, LAN, voice, and unified communications networks',
    scope: 'All spend on network connectivity, voice services, and unified communications infrastructure. Includes WAN circuits, SD-WAN, LAN switches, wireless infrastructure, MPLS, internet circuits, and telephony.',
    includes: [
      'WAN circuits and MPLS (AT&T, Verizon, Lumen)',
      'SD-WAN platforms (Cato, Meraki, Fortinet SD-WAN)',
      'Internet connectivity (ISP circuits, DIA)',
      'LAN switches and wireless access points',
      'Voice and telephony (PBX, SIP trunking)',
      'Unified communications as a service (UCaaS — RingCentral, 8x8)',
      'Contact center platforms (CCaaS — Genesys, Five9, NICE)',
      'Network management and monitoring (SolarWinds, PRTG)',
      'Load balancers (F5, Citrix ADC)',
      'DNS and CDN services (Cloudflare, Akamai)',
    ],
    excludes: [
      'Cloud hosting network (→ Infrastructure & Operations)',
      'Firewalls and network security (→ Security & Risk)',
      'Video conferencing software (→ End User Services)',
    ],
    typical_rgt_split: { run: 0.85, grow: 0.10, transform: 0.05 },
    typical_opex_capex: { opex: 0.70, capex: 0.30 },
    budget_line_items: [
      'WAN/MPLS circuits', 'Internet circuits', 'SD-WAN platform',
      'LAN switches', 'Wireless infrastructure', 'Voice/telephony',
      'UCaaS subscriptions', 'Contact center platform', 'Network monitoring',
      'CDN/DNS services', 'Load balancers',
    ],
  },
  {
    tower: 'IT Management & Strategy',
    short_description: 'IT leadership, PMO, vendor management, ITSM, and governance',
    scope: 'All spend on managing the IT function itself. Includes IT leadership, project management office, vendor and contract management, enterprise architecture, IT service management, IT financial management, and strategic consulting.',
    includes: [
      'CIO/CTO office and IT leadership staff',
      'Project management office (PMO)',
      'IT service management platform (ServiceNow, BMC, Jira Service Management)',
      'Enterprise architecture practice',
      'IT vendor and contract management',
      'IT financial management (TBM / FinOps)',
      'IT strategy and advisory consulting (Gartner, McKinsey, etc.)',
      'IT training and professional development',
      'IT governance, standards, and policy',
      'Configuration management database (CMDB)',
    ],
    excludes: [
      'Security governance/GRC (→ Security & Risk)',
      'Data governance (→ Data & Analytics)',
      'Development project management (→ Application Development & Support)',
    ],
    typical_rgt_split: { run: 0.70, grow: 0.20, transform: 0.10 },
    typical_opex_capex: { opex: 0.90, capex: 0.10 },
    budget_line_items: [
      'IT leadership salaries', 'PMO staff/tools', 'ITSM platform (ServiceNow)',
      'Gartner/advisory subscriptions', 'Enterprise architecture tools',
      'Vendor management staff', 'FinOps/TBM tools', 'IT training budget',
      'Strategic consulting fees', 'CMDB/asset management',
    ],
  },
  {
    tower: 'Unassigned',
    short_description: 'Spend not yet classified into a tower',
    scope: 'Catch-all for vendor, application, or service spend that has not been mapped to a specific tower. High unassigned percentages indicate classification gaps that reduce analysis confidence.',
    includes: [
      'Vendors with no category or description',
      'Ambiguous line items',
      'Shared services allocations without detail',
      'Catch-all budget codes',
    ],
    excludes: [],
    typical_rgt_split: { run: 0.70, grow: 0.20, transform: 0.10 },
    typical_opex_capex: { opex: 0.70, capex: 0.30 },
    budget_line_items: [],
  },
];

// ── Tower Lookup ──

const towerMap = new Map(TOWER_DEFINITIONS.map(t => [t.tower, t]));

export function getTowerDefinition(tower: ITSpendTower): TowerDefinition | undefined {
  return towerMap.get(tower);
}

export function getAllTowerDefinitions(): TowerDefinition[] {
  return TOWER_DEFINITIONS.filter(t => t.tower !== 'Unassigned');
}
