'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  GICS_GROUPS,
  BUSINESS_MODELS,
  COMPLEXITY_LEVELS,
} from '@/lib/schema/value-lists';
import type { CompanyProfile } from '@/lib/schema/validation';

interface CompanyProfileFormProps {
  data: Partial<CompanyProfile>;
  onChange: (data: Partial<CompanyProfile>) => void;
}

export function CompanyProfileForm({ data, onChange }: CompanyProfileFormProps) {
  const update = (field: keyof CompanyProfile, value: unknown) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">
          Company Profile
        </h3>
        <p className="text-sm text-muted-foreground">
          Basic information about the company being assessed.
        </p>
      </div>

      {/* Company Name */}
      <div className="space-y-2">
        <Label htmlFor="company_name">
          Company Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="company_name"
          placeholder="Enter company name"
          value={data.company_name ?? ''}
          onChange={(e) => update('company_name', e.target.value)}
        />
      </div>

      {/* Industry GICS Group */}
      <div className="space-y-2">
        <Label>
          Industry (GICS Sector) <span className="text-destructive">*</span>
        </Label>
        <Select
          value={data.industry_gics_group ?? ''}
          onValueChange={(val) => update('industry_gics_group', val)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select industry sector" />
          </SelectTrigger>
          <SelectContent>
            {GICS_GROUPS.map((group) => (
              <SelectItem key={group} value={group}>
                {group}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Business Model */}
      <div className="space-y-2">
        <Label>Business Model</Label>
        <Select
          value={data.business_model ?? ''}
          onValueChange={(val) =>
            update('business_model', val || null)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select business model (optional)" />
          </SelectTrigger>
          <SelectContent>
            {BUSINESS_MODELS.map((model) => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Complexity Selectors */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-foreground">
          Complexity Assessment
        </h4>
        <div className="grid gap-4 sm:grid-cols-3">
          <ComplexitySelect
            label="Regulatory Complexity"
            value={data.regulatory_complexity}
            onChange={(val) => update('regulatory_complexity', val)}
          />
          <ComplexitySelect
            label="Operating Complexity"
            value={data.operating_complexity}
            onChange={(val) => update('operating_complexity', val)}
          />
          <ComplexitySelect
            label="Pricing Complexity"
            value={data.pricing_premium_complexity}
            onChange={(val) => update('pricing_premium_complexity', val)}
          />
        </div>
      </div>

      {/* Complexity Notes */}
      <div className="space-y-2">
        <Label htmlFor="complexity_notes">Complexity Notes</Label>
        <Textarea
          id="complexity_notes"
          placeholder="Any additional context on complexity drivers (optional)"
          value={data.complexity_notes ?? ''}
          onChange={(e) => update('complexity_notes', e.target.value || null)}
          rows={3}
        />
      </div>
    </div>
  );
}

function ComplexitySelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (value: string | null) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <Select
        value={value ?? ''}
        onValueChange={(val) => onChange(val || null)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          {COMPLEXITY_LEVELS.map((level) => (
            <SelectItem key={level} value={level}>
              {level}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
