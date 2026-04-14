/**
 * Tower Classifier — Auto-maps vendor, application, and service spend to IT Spend Towers
 *
 * Uses a weighted keyword matching system:
 *   1. Exact vendor name match (highest confidence)
 *   2. Category/description keyword match
 *   3. Product name pattern match
 *   4. Fallback to 'Unassigned'
 *
 * Each classification includes a confidence score so reviewers can
 * focus on low-confidence assignments during the sorting process.
 */

import type { ITSpendTower } from '@/lib/schema/value-lists';

// ── Types ──

export interface ClassificationInput {
  /** Vendor or supplier name */
  vendor_name: string;
  /** Product or service category if known */
  category?: string;
  /** Product/service description or line-item detail */
  description?: string;
  /** Spend amount (used for weighting, not classification) */
  spend?: number;
}

export interface ClassificationResult {
  /** Assigned tower */
  tower: ITSpendTower;
  /** Confidence: 'high' = strong keyword match, 'medium' = partial match, 'low' = weak/fallback */
  confidence: 'high' | 'medium' | 'low';
  /** Why this classification was chosen */
  reason: string;
  /** Alternative tower if the match was close */
  alternative?: ITSpendTower;
  /** Whether a human should review this classification */
  needs_review: boolean;
}

// ── Known Vendor → Tower Mappings ──
// High-confidence: if we recognize the vendor, we know the tower

const VENDOR_TOWER_MAP: Record<string, ITSpendTower> = {
  // Infrastructure & Operations
  'aws': 'Infrastructure & Operations',
  'amazon web services': 'Infrastructure & Operations',
  'microsoft azure': 'Infrastructure & Operations',
  'google cloud': 'Infrastructure & Operations',
  'gcp': 'Infrastructure & Operations',
  'vmware': 'Infrastructure & Operations',
  'broadcom vmware': 'Infrastructure & Operations',
  'dell': 'Infrastructure & Operations',
  'dell technologies': 'Infrastructure & Operations',
  'dell emc': 'Infrastructure & Operations',
  'hpe': 'Infrastructure & Operations',
  'hewlett packard enterprise': 'Infrastructure & Operations',
  'nutanix': 'Infrastructure & Operations',
  'pure storage': 'Infrastructure & Operations',
  'netapp': 'Infrastructure & Operations',
  'equinix': 'Infrastructure & Operations',
  'rackspace': 'Infrastructure & Operations',
  'digital realty': 'Infrastructure & Operations',
  'veeam': 'Infrastructure & Operations',
  'commvault': 'Infrastructure & Operations',
  'veritas': 'Infrastructure & Operations',
  'red hat': 'Infrastructure & Operations',
  'suse': 'Infrastructure & Operations',
  'docker': 'Infrastructure & Operations',
  'hashicorp': 'Infrastructure & Operations',
  'terraform': 'Infrastructure & Operations',
  'datadog': 'Infrastructure & Operations',
  'dynatrace': 'Infrastructure & Operations',
  'new relic': 'Infrastructure & Operations',
  'splunk': 'Infrastructure & Operations',  // Also Security, but primarily infra monitoring
  'nagios': 'Infrastructure & Operations',
  'jenkins': 'Infrastructure & Operations',

  // Application Development & Support
  'github': 'Application Development & Support',
  'gitlab': 'Application Development & Support',
  'atlassian': 'Application Development & Support',
  'jira': 'Application Development & Support',
  'bitbucket': 'Application Development & Support',
  'mendix': 'Application Development & Support',
  'outsystems': 'Application Development & Support',
  'appian': 'Application Development & Support',
  'mulesoft': 'Application Development & Support',
  'boomi': 'Application Development & Support',
  'snaplogic': 'Application Development & Support',
  'twilio': 'Application Development & Support',
  'postman': 'Application Development & Support',
  'sonarqube': 'Application Development & Support',
  'jfrog': 'Application Development & Support',
  'jetbrains': 'Application Development & Support',
  'confluence': 'Application Development & Support',

  // Enterprise Applications
  'sap': 'Enterprise Applications',
  'oracle': 'Enterprise Applications',
  'workday': 'Enterprise Applications',
  'salesforce': 'Enterprise Applications',
  'microsoft dynamics': 'Enterprise Applications',
  'dynamics 365': 'Enterprise Applications',
  'netsuite': 'Enterprise Applications',
  'infor': 'Enterprise Applications',
  'epicor': 'Enterprise Applications',
  'sage': 'Enterprise Applications',
  'hubspot': 'Enterprise Applications',
  'adobe experience': 'Enterprise Applications',
  'coupa': 'Enterprise Applications',
  'ariba': 'Enterprise Applications',
  'jaggaer': 'Enterprise Applications',
  'concur': 'Enterprise Applications',
  'successfactors': 'Enterprise Applications',
  'adp': 'Enterprise Applications',
  'ceridian': 'Enterprise Applications',
  'dayforce': 'Enterprise Applications',
  'ukg': 'Enterprise Applications',
  'kronos': 'Enterprise Applications',
  'anaplan': 'Enterprise Applications',
  'adaptive insights': 'Enterprise Applications',
  'kinaxis': 'Enterprise Applications',
  'blue yonder': 'Enterprise Applications',
  'manhattan associates': 'Enterprise Applications',
  'epic': 'Enterprise Applications',  // Healthcare EHR
  'cerner': 'Enterprise Applications',
  'meditech': 'Enterprise Applications',
  'temenos': 'Enterprise Applications',
  'finastra': 'Enterprise Applications',
  'fis': 'Enterprise Applications',
  'fiserv': 'Enterprise Applications',
  'veeva': 'Enterprise Applications',

  // Security & Risk
  'crowdstrike': 'Security & Risk',
  'sentinelone': 'Security & Risk',
  'palo alto networks': 'Security & Risk',
  'fortinet': 'Security & Risk',
  'zscaler': 'Security & Risk',
  'okta': 'Security & Risk',
  'cyberark': 'Security & Risk',
  'ping identity': 'Security & Risk',
  'proofpoint': 'Security & Risk',
  'mimecast': 'Security & Risk',
  'qualys': 'Security & Risk',
  'tenable': 'Security & Risk',
  'rapid7': 'Security & Risk',
  'carbon black': 'Security & Risk',
  'varonis': 'Security & Risk',
  'sailpoint': 'Security & Risk',
  'beyondtrust': 'Security & Risk',
  'onetrust': 'Security & Risk',
  'rsa': 'Security & Risk',
  'checkpoint': 'Security & Risk',
  'check point': 'Security & Risk',
  'symantec': 'Security & Risk',
  'norton': 'Security & Risk',
  'mcafee': 'Security & Risk',
  'trellix': 'Security & Risk',
  'knowbe4': 'Security & Risk',
  'darktrace': 'Security & Risk',
  'wiz': 'Security & Risk',
  'snyk': 'Security & Risk',

  // Data & Analytics
  'snowflake': 'Data & Analytics',
  'databricks': 'Data & Analytics',
  'tableau': 'Data & Analytics',
  'power bi': 'Data & Analytics',
  'looker': 'Data & Analytics',
  'qlik': 'Data & Analytics',
  'informatica': 'Data & Analytics',
  'talend': 'Data & Analytics',
  'fivetran': 'Data & Analytics',
  'dbt labs': 'Data & Analytics',
  'collibra': 'Data & Analytics',
  'alation': 'Data & Analytics',
  'atlan': 'Data & Analytics',
  'palantir': 'Data & Analytics',
  'alteryx': 'Data & Analytics',
  'sas': 'Data & Analytics',
  'teradata': 'Data & Analytics',
  'cloudera': 'Data & Analytics',
  'openai': 'Data & Analytics',
  'anthropic': 'Data & Analytics',

  // End User Services
  'microsoft 365': 'End User Services',
  'office 365': 'End User Services',
  'google workspace': 'End User Services',
  'zoom': 'End User Services',
  'webex': 'End User Services',
  'slack': 'End User Services',
  'apple': 'End User Services',
  'lenovo': 'End User Services',
  'hp inc': 'End User Services',
  'logitech': 'End User Services',
  'citrix': 'End User Services',
  'freshdesk': 'End User Services',
  'freshservice': 'End User Services',
  'xerox': 'End User Services',
  'ricoh': 'End User Services',
  'canon': 'End User Services',

  // Telecommunications
  'at&t': 'Telecommunications',
  'verizon': 'Telecommunications',
  'lumen': 'Telecommunications',
  'centurylink': 'Telecommunications',
  'comcast': 'Telecommunications',
  'spectrum': 'Telecommunications',
  'cox': 'Telecommunications',
  'cato networks': 'Telecommunications',
  'cisco meraki': 'Telecommunications',
  'cisco': 'Telecommunications',  // Could be infra, but primarily network
  'aruba': 'Telecommunications',
  'juniper': 'Telecommunications',
  'juniper networks': 'Telecommunications',
  'ringcentral': 'Telecommunications',
  '8x8': 'Telecommunications',
  'vonage': 'Telecommunications',
  'genesys': 'Telecommunications',
  'five9': 'Telecommunications',
  'nice': 'Telecommunications',
  'talkdesk': 'Telecommunications',
  'cloudflare': 'Telecommunications',
  'akamai': 'Telecommunications',
  'f5': 'Telecommunications',
  'solarwinds': 'Telecommunications',

  // IT Management & Strategy
  'servicenow': 'IT Management & Strategy',
  'bmc': 'IT Management & Strategy',
  'gartner': 'IT Management & Strategy',
  'forrester': 'IT Management & Strategy',
  'idc': 'IT Management & Strategy',
  'mckinsey': 'IT Management & Strategy',
  'deloitte': 'IT Management & Strategy',
  'accenture': 'IT Management & Strategy',
  'kpmg': 'IT Management & Strategy',
  'ey': 'IT Management & Strategy',
  'pwc': 'IT Management & Strategy',
  'cognizant': 'IT Management & Strategy',
  'infosys': 'IT Management & Strategy',
  'wipro': 'IT Management & Strategy',
  'tcs': 'IT Management & Strategy',
  'hcl': 'IT Management & Strategy',
  'apptio': 'IT Management & Strategy',
  'flexera': 'IT Management & Strategy',
  'snow software': 'IT Management & Strategy',
  'planview': 'IT Management & Strategy',
};

// ── Keyword → Tower Mappings ──
// Used for category/description matching when vendor name isn't recognized

interface KeywordRule {
  keywords: string[];
  tower: ITSpendTower;
  weight: number; // Higher = stronger signal
}

const KEYWORD_RULES: KeywordRule[] = [
  // Infrastructure & Operations
  { keywords: ['cloud', 'iaas', 'paas', 'hosting', 'compute'], tower: 'Infrastructure & Operations', weight: 3 },
  { keywords: ['server', 'storage', 'backup', 'disaster recovery', 'dr'], tower: 'Infrastructure & Operations', weight: 3 },
  { keywords: ['data center', 'datacenter', 'colocation', 'colo'], tower: 'Infrastructure & Operations', weight: 4 },
  { keywords: ['virtualization', 'hypervisor', 'container', 'kubernetes', 'k8s'], tower: 'Infrastructure & Operations', weight: 3 },
  { keywords: ['monitoring', 'observability', 'apm', 'aiops'], tower: 'Infrastructure & Operations', weight: 2 },
  { keywords: ['operating system', 'linux', 'windows server'], tower: 'Infrastructure & Operations', weight: 2 },
  { keywords: ['infrastructure managed service'], tower: 'Infrastructure & Operations', weight: 4 },

  // Application Development & Support
  { keywords: ['application development', 'app dev', 'software development', 'custom development'], tower: 'Application Development & Support', weight: 4 },
  { keywords: ['application support', 'app support', 'application maintenance'], tower: 'Application Development & Support', weight: 4 },
  { keywords: ['api', 'integration', 'middleware', 'etl'], tower: 'Application Development & Support', weight: 2 },
  { keywords: ['devops', 'ci/cd', 'deployment', 'pipeline'], tower: 'Application Development & Support', weight: 3 },
  { keywords: ['low-code', 'no-code', 'rapid application'], tower: 'Application Development & Support', weight: 3 },
  { keywords: ['quality assurance', 'testing', 'qa'], tower: 'Application Development & Support', weight: 2 },
  { keywords: ['code repository', 'source control', 'version control'], tower: 'Application Development & Support', weight: 3 },

  // Enterprise Applications
  { keywords: ['erp', 'enterprise resource planning'], tower: 'Enterprise Applications', weight: 5 },
  { keywords: ['crm', 'customer relationship'], tower: 'Enterprise Applications', weight: 5 },
  { keywords: ['hcm', 'hris', 'human capital', 'payroll', 'talent management'], tower: 'Enterprise Applications', weight: 4 },
  { keywords: ['scm', 'supply chain', 'warehouse management', 'wms'], tower: 'Enterprise Applications', weight: 4 },
  { keywords: ['procurement', 'sourcing', 'purchase order'], tower: 'Enterprise Applications', weight: 3 },
  { keywords: ['financial planning', 'budgeting', 'forecasting', 'fpa'], tower: 'Enterprise Applications', weight: 3 },
  { keywords: ['ehr', 'electronic health record', 'emr', 'clinical system'], tower: 'Enterprise Applications', weight: 5 },
  { keywords: ['core banking', 'loan origination', 'policy admin'], tower: 'Enterprise Applications', weight: 5 },
  { keywords: ['saas', 'subscription', 'license'], tower: 'Enterprise Applications', weight: 1 },

  // Security & Risk
  { keywords: ['security', 'cybersecurity', 'cyber', 'infosec'], tower: 'Security & Risk', weight: 4 },
  { keywords: ['identity', 'iam', 'access management', 'authentication', 'sso', 'mfa'], tower: 'Security & Risk', weight: 4 },
  { keywords: ['endpoint protection', 'antivirus', 'edr', 'xdr'], tower: 'Security & Risk', weight: 4 },
  { keywords: ['firewall', 'ids', 'ips', 'intrusion', 'waf'], tower: 'Security & Risk', weight: 4 },
  { keywords: ['siem', 'security analytics', 'threat detection', 'threat intelligence'], tower: 'Security & Risk', weight: 5 },
  { keywords: ['vulnerability', 'penetration test', 'pen test'], tower: 'Security & Risk', weight: 4 },
  { keywords: ['grc', 'governance risk compliance', 'compliance'], tower: 'Security & Risk', weight: 3 },
  { keywords: ['dlp', 'data loss prevention', 'encryption'], tower: 'Security & Risk', weight: 3 },
  { keywords: ['zero trust', 'sase'], tower: 'Security & Risk', weight: 4 },

  // Data & Analytics
  { keywords: ['data warehouse', 'data lake', 'lakehouse', 'big data'], tower: 'Data & Analytics', weight: 5 },
  { keywords: ['business intelligence', 'bi ', 'reporting', 'dashboard'], tower: 'Data & Analytics', weight: 4 },
  { keywords: ['analytics', 'data analytics', 'advanced analytics'], tower: 'Data & Analytics', weight: 3 },
  { keywords: ['ai', 'artificial intelligence', 'machine learning', 'ml ', 'genai', 'llm'], tower: 'Data & Analytics', weight: 4 },
  { keywords: ['data governance', 'data catalog', 'data quality', 'mdm', 'master data'], tower: 'Data & Analytics', weight: 4 },
  { keywords: ['data integration', 'data pipeline', 'data engineering'], tower: 'Data & Analytics', weight: 3 },

  // End User Services
  { keywords: ['help desk', 'helpdesk', 'service desk', 'support desk'], tower: 'End User Services', weight: 5 },
  { keywords: ['desktop', 'laptop', 'workstation', 'pc ', 'endpoint device'], tower: 'End User Services', weight: 4 },
  { keywords: ['mobile device', 'mdm', 'byod', 'smartphone', 'tablet'], tower: 'End User Services', weight: 3 },
  { keywords: ['collaboration', 'productivity suite', 'office suite'], tower: 'End User Services', weight: 3 },
  { keywords: ['video conferencing', 'video call'], tower: 'End User Services', weight: 3 },
  { keywords: ['printing', 'printer', 'document management'], tower: 'End User Services', weight: 3 },
  { keywords: ['vdi', 'virtual desktop', 'daas', 'desktop as a service'], tower: 'End User Services', weight: 4 },

  // Telecommunications
  { keywords: ['wan', 'mpls', 'sd-wan', 'sdwan'], tower: 'Telecommunications', weight: 5 },
  { keywords: ['network', 'lan', 'switch', 'router', 'wireless', 'wifi', 'wi-fi'], tower: 'Telecommunications', weight: 3 },
  { keywords: ['voice', 'telephony', 'pbx', 'sip', 'voip'], tower: 'Telecommunications', weight: 4 },
  { keywords: ['ucaas', 'unified communications', 'contact center', 'ccaas', 'call center'], tower: 'Telecommunications', weight: 5 },
  { keywords: ['isp', 'internet circuit', 'broadband', 'fiber'], tower: 'Telecommunications', weight: 3 },
  { keywords: ['cdn', 'content delivery', 'load balancer', 'dns'], tower: 'Telecommunications', weight: 3 },

  // IT Management & Strategy
  { keywords: ['itsm', 'it service management', 'service management platform'], tower: 'IT Management & Strategy', weight: 5 },
  { keywords: ['pmo', 'project management', 'portfolio management'], tower: 'IT Management & Strategy', weight: 4 },
  { keywords: ['it consulting', 'advisory', 'strategy consulting'], tower: 'IT Management & Strategy', weight: 4 },
  { keywords: ['vendor management', 'contract management', 'license management'], tower: 'IT Management & Strategy', weight: 4 },
  { keywords: ['enterprise architecture', 'it architecture'], tower: 'IT Management & Strategy', weight: 4 },
  { keywords: ['finops', 'tbm', 'technology business management', 'it financial'], tower: 'IT Management & Strategy', weight: 5 },
  { keywords: ['cmdb', 'asset management', 'it asset', 'sam '], tower: 'IT Management & Strategy', weight: 3 },
  { keywords: ['it training', 'professional development', 'certification'], tower: 'IT Management & Strategy', weight: 3 },
  { keywords: ['outsourcing', 'managed services', 'staff augmentation'], tower: 'IT Management & Strategy', weight: 2 },
];

// ── Classification Engine ──

/**
 * Classify a single vendor/line-item into an IT Spend Tower.
 *
 * Resolution order:
 *   1. Exact vendor name match (high confidence)
 *   2. Keyword scoring across vendor name + category + description
 *   3. Fallback to 'Unassigned' (low confidence, needs review)
 */
export function classifyToTower(input: ClassificationInput): ClassificationResult {
  const vendorLower = input.vendor_name.toLowerCase().trim();
  const categoryLower = (input.category ?? '').toLowerCase().trim();
  const descLower = (input.description ?? '').toLowerCase().trim();
  const combined = `${vendorLower} ${categoryLower} ${descLower}`;

  // 1. Try exact vendor name match
  for (const [vendor, tower] of Object.entries(VENDOR_TOWER_MAP)) {
    if (vendorLower === vendor || vendorLower.includes(vendor) || vendor.includes(vendorLower)) {
      return {
        tower,
        confidence: 'high',
        reason: `Known vendor: ${input.vendor_name} → ${tower}`,
        needs_review: false,
      };
    }
  }

  // 2. Keyword scoring
  const scores = new Map<ITSpendTower, { total: number; bestReason: string }>();

  for (const rule of KEYWORD_RULES) {
    for (const kw of rule.keywords) {
      if (combined.includes(kw)) {
        const existing = scores.get(rule.tower) ?? { total: 0, bestReason: '' };
        existing.total += rule.weight;
        if (rule.weight > (scores.get(rule.tower)?.total ?? 0) - existing.total + rule.weight) {
          existing.bestReason = `Matched keyword "${kw}" in ${vendorLower.includes(kw) ? 'vendor name' : categoryLower.includes(kw) ? 'category' : 'description'}`;
        }
        scores.set(rule.tower, existing);
      }
    }
  }

  if (scores.size > 0) {
    // Sort by score descending
    const ranked = Array.from(scores.entries()).sort((a, b) => b[1].total - a[1].total);
    const [bestTower, bestScore] = ranked[0];
    const alternative = ranked.length > 1 ? ranked[1][0] : undefined;

    // Determine confidence based on score gap
    const scoreDiff = ranked.length > 1 ? bestScore.total - ranked[1][1].total : bestScore.total;
    const confidence = bestScore.total >= 5 && scoreDiff >= 2 ? 'high'
      : bestScore.total >= 3 ? 'medium'
      : 'low';

    return {
      tower: bestTower,
      confidence,
      reason: bestScore.bestReason,
      alternative: confidence !== 'high' ? alternative : undefined,
      needs_review: confidence === 'low' || (confidence === 'medium' && alternative !== undefined),
    };
  }

  // 3. Fallback
  return {
    tower: 'Unassigned',
    confidence: 'low',
    reason: `No keyword matches for "${input.vendor_name}"`,
    needs_review: true,
  };
}

/**
 * Classify a batch of vendors/line-items and return tower-level aggregations.
 */
export function classifyBatch(inputs: ClassificationInput[]): {
  classifications: (ClassificationInput & ClassificationResult)[];
  tower_summary: {
    tower: ITSpendTower;
    total_spend: number;
    vendor_count: number;
    avg_confidence: string;
    items_needing_review: number;
  }[];
  needs_review_count: number;
  classification_rate: number;
} {
  const classifications = inputs.map(input => ({
    ...input,
    ...classifyToTower(input),
  }));

  // Aggregate by tower
  const towerAgg = new Map<ITSpendTower, {
    spend: number;
    count: number;
    confidences: string[];
    reviewCount: number;
  }>();

  for (const c of classifications) {
    const existing = towerAgg.get(c.tower) ?? { spend: 0, count: 0, confidences: [], reviewCount: 0 };
    existing.spend += c.spend ?? 0;
    existing.count += 1;
    existing.confidences.push(c.confidence);
    if (c.needs_review) existing.reviewCount += 1;
    towerAgg.set(c.tower, existing);
  }

  const tower_summary = Array.from(towerAgg.entries())
    .map(([tower, agg]) => ({
      tower,
      total_spend: agg.spend,
      vendor_count: agg.count,
      avg_confidence: agg.confidences.filter(c => c === 'high').length > agg.count / 2 ? 'high'
        : agg.confidences.filter(c => c !== 'low').length > agg.count / 2 ? 'medium'
        : 'low',
      items_needing_review: agg.reviewCount,
    }))
    .sort((a, b) => b.total_spend - a.total_spend);

  const needs_review_count = classifications.filter(c => c.needs_review).length;
  const classified_count = classifications.filter(c => c.tower !== 'Unassigned').length;

  return {
    classifications,
    tower_summary,
    needs_review_count,
    classification_rate: inputs.length > 0 ? classified_count / inputs.length : 0,
  };
}

/**
 * Suggest a tower for a free-text description.
 * Useful for the guided wizard or AI-assisted intake.
 */
export function suggestTower(text: string): { tower: ITSpendTower; confidence: string }[] {
  const result = classifyToTower({
    vendor_name: '',
    category: '',
    description: text,
  });

  const suggestions = [{ tower: result.tower, confidence: result.confidence }];
  if (result.alternative) {
    suggestions.push({ tower: result.alternative, confidence: 'low' });
  }
  return suggestions;
}
