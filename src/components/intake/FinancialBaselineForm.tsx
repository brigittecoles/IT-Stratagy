'use client';

import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FISCAL_YEAR_LABELS } from '@/lib/schema/value-lists';
import type { FiscalYear } from '@/lib/schema/validation';

interface FinancialBaselineFormProps {
  data: Partial<FiscalYear>;
  yearIndex: number;
  onChange: (data: Partial<FiscalYear>) => void;
}

function parseCurrency(value: string): number | null {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function FinancialBaselineForm({
  data,
  yearIndex,
  onChange,
}: FinancialBaselineFormProps) {
  const update = useCallback(
    (field: keyof FiscalYear, value: unknown) => {
      onChange({ ...data, [field]: value });
    },
    [data, onChange]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">
          Financial Baseline {yearIndex > 0 ? `(Year ${yearIndex + 1})` : ''}
        </h3>
        <p className="text-sm text-muted-foreground">
          IT financial data for benchmarking. Enter values in thousands (USD).
        </p>
      </div>

      {/* Fiscal Year Label */}
      <div className="space-y-2">
        <Label>
          Fiscal Year <span className="text-destructive">*</span>
        </Label>
        <Select
          value={data.fiscal_year_label ?? ''}
          onValueChange={(val) => update('fiscal_year_label', val)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select fiscal year" />
          </SelectTrigger>
          <SelectContent>
            {FISCAL_YEAR_LABELS.map((label) => (
              <SelectItem key={label} value={label}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Revenue & Total IT Spend */}
      <div className="grid gap-4 sm:grid-cols-2">
        <CurrencyInput
          label="Revenue"
          required
          value={data.revenue}
          onChange={(val) => update('revenue', val)}
        />
        <CurrencyInput
          label="Total IT Spend"
          required
          value={data.total_it_spend}
          onChange={(val) => update('total_it_spend', val)}
        />
      </div>

      {/* IT Spend Breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">
          IT Spend Breakdown
        </h4>
        <div className="grid gap-4 sm:grid-cols-3">
          <CurrencyInput
            label="IT OpEx"
            value={data.it_opex_spend}
            onChange={(val) => update('it_opex_spend', val)}
          />
          <CurrencyInput
            label="IT CapEx"
            value={data.it_capex_spend}
            onChange={(val) => update('it_capex_spend', val)}
          />
          <CurrencyInput
            label="IT D&A"
            value={data.it_da_spend}
            onChange={(val) => update('it_da_spend', val)}
          />
        </div>
      </div>
    </div>
  );
}

function CurrencyInput({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          $
        </span>
        <Input
          type="text"
          inputMode="numeric"
          className="pl-6"
          placeholder="0"
          value={formatCurrency(value)}
          onChange={(e) => onChange(parseCurrency(e.target.value))}
        />
      </div>
    </div>
  );
}
