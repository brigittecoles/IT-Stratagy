'use client';

import { Gauge, CheckCircle2, Circle } from 'lucide-react';

// Field requirements per diagnostic level (mirrors resolver/qualification.ts)
const LEVEL_REQUIREMENTS: Record<string, { label: string; fields: { name: string; key: string }[] }[]> = {
  'Quick Read': [
    {
      label: 'Quick Read',
      fields: [
        { name: 'Company Name', key: 'company_name' },
        { name: 'Industry', key: 'industry_gics_group' },
        { name: 'Revenue', key: 'revenue' },
        { name: 'Total IT Spend', key: 'total_it_spend' },
        { name: 'Transformation Status', key: 'transformation_status' },
      ],
    },
  ],
  'Standard Diagnostic': [
    {
      label: 'Quick Read fields',
      fields: [
        { name: 'Company Name', key: 'company_name' },
        { name: 'Industry', key: 'industry_gics_group' },
        { name: 'Revenue', key: 'revenue' },
        { name: 'Total IT Spend', key: 'total_it_spend' },
        { name: 'Transformation Status', key: 'transformation_status' },
      ],
    },
    {
      label: 'Standard Diagnostic fields',
      fields: [
        { name: 'IT OpEx Spend', key: 'it_opex_spend' },
        { name: 'IT CapEx Spend', key: 'it_capex_spend' },
        { name: 'Employee Count', key: 'employee_count' },
        { name: 'IT FTE Count', key: 'it_fte_count' },
      ],
    },
  ],
  'Full Diagnostic': [
    {
      label: 'Quick Read + Standard fields',
      fields: [
        { name: 'Company Name', key: 'company_name' },
        { name: 'Industry', key: 'industry_gics_group' },
        { name: 'Revenue', key: 'revenue' },
        { name: 'Total IT Spend', key: 'total_it_spend' },
        { name: 'Transformation Status', key: 'transformation_status' },
        { name: 'IT OpEx Spend', key: 'it_opex_spend' },
        { name: 'IT CapEx Spend', key: 'it_capex_spend' },
        { name: 'Employee Count', key: 'employee_count' },
        { name: 'IT FTE Count', key: 'it_fte_count' },
      ],
    },
    {
      label: 'Full Diagnostic fields',
      fields: [
        { name: 'Detailed File Upload', key: 'detailed_file_available' },
      ],
    },
  ],
  'Full Diagnostic with Vendor + Roadmap Intelligence': [
    {
      label: 'All prior fields',
      fields: [
        { name: 'Company Name', key: 'company_name' },
        { name: 'Industry', key: 'industry_gics_group' },
        { name: 'Revenue', key: 'revenue' },
        { name: 'Total IT Spend', key: 'total_it_spend' },
        { name: 'Transformation Status', key: 'transformation_status' },
        { name: 'IT OpEx Spend', key: 'it_opex_spend' },
        { name: 'IT CapEx Spend', key: 'it_capex_spend' },
        { name: 'Employee Count', key: 'employee_count' },
        { name: 'IT FTE Count', key: 'it_fte_count' },
        { name: 'Detailed File Upload', key: 'detailed_file_available' },
      ],
    },
    {
      label: 'Vendor + Roadmap fields',
      fields: [
        { name: 'Vendor Detail File', key: 'vendor_detail_available' },
        { name: 'Project Portfolio / Roadmap File', key: 'project_portfolio_file_available' },
      ],
    },
  ],
};

interface DiagnosticLevelBannerProps {
  targetLevel: string;
  /** Keys of fields that have been provided (e.g. ['company_name', 'revenue']) */
  providedFields?: string[];
  /** Compact mode shows just the level and progress, not all field details */
  compact?: boolean;
}

export function DiagnosticLevelBanner({
  targetLevel,
  providedFields = [],
  compact = false,
}: DiagnosticLevelBannerProps) {
  const requirements = LEVEL_REQUIREMENTS[targetLevel] ?? LEVEL_REQUIREMENTS['Quick Read'];

  // Flatten all required fields
  const allFields = requirements.flatMap((group) => group.fields);
  const totalRequired = allFields.length;
  const providedCount = allFields.filter((f) => providedFields.includes(f.key)).length;
  const progressPct = totalRequired > 0 ? Math.round((providedCount / totalRequired) * 100) : 0;

  return (
    <div className="rounded-lg border border-wm-blue/20 bg-wm-blue-50/50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Gauge className="size-4 text-wm-blue" />
        <span className="text-sm font-bold text-wm-navy">
          Target: {targetLevel}
        </span>
        <span className="ml-auto text-xs font-medium text-wm-blue tabular-nums">
          {providedCount}/{totalRequired} fields
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-wm-blue/10 mb-2">
        <div
          className="h-full rounded-full bg-wm-blue transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {!compact && (
        <div className="space-y-2 mt-3">
          {requirements.map((group) => (
            <div key={group.label}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-wm-slate-600 mb-1">
                {group.label}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {group.fields.map((field) => {
                  const provided = providedFields.includes(field.key);
                  return (
                    <span
                      key={field.key}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${
                        provided
                          ? 'bg-wm-green/10 text-wm-green-700 border border-wm-green/20'
                          : 'bg-white text-muted-foreground border border-border'
                      }`}
                    >
                      {provided ? (
                        <CheckCircle2 className="size-3" />
                      ) : (
                        <Circle className="size-3" />
                      )}
                      {field.name}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
