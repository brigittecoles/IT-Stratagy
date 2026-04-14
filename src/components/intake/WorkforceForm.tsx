'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FiscalYear } from '@/lib/schema/validation';

type WorkforceFields = Pick<
  FiscalYear,
  | 'employee_count'
  | 'it_fte_count'
  | 'contractor_count'
  | 'contractor_spend'
  | 'outsourced_spend'
  | 'internal_labor_spend'
>;

interface WorkforceFormProps {
  data: Partial<WorkforceFields>;
  onChange: (data: Partial<WorkforceFields>) => void;
}

function parseInteger(value: string): number | null {
  const cleaned = value.replace(/[^0-9]/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? null : num;
}

function parseCurrency(value: string): number | null {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function formatNumber(value: number | null | undefined): string {
  if (value == null) return '';
  return value.toLocaleString('en-US');
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function WorkforceForm({ data, onChange }: WorkforceFormProps) {
  const update = (field: keyof WorkforceFields, value: unknown) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">
          Workforce & Labor
        </h3>
        <p className="text-sm text-muted-foreground">
          Headcount and labor cost data for IT benchmarking.
        </p>
      </div>

      {/* Primary counts */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="employee_count">
            Total Employee Count <span className="text-destructive">*</span>
          </Label>
          <Input
            id="employee_count"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 5,000"
            value={formatNumber(data.employee_count)}
            onChange={(e) =>
              update('employee_count', parseInteger(e.target.value))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="it_fte_count">
            IT FTE Count <span className="text-destructive">*</span>
          </Label>
          <Input
            id="it_fte_count"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 250"
            value={formatNumber(data.it_fte_count)}
            onChange={(e) =>
              update('it_fte_count', parseInteger(e.target.value))
            }
          />
        </div>
      </div>

      {/* Optional contractor details */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">
          Contractor & Outsourcing Detail
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            (optional)
          </span>
        </h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contractor_count" className="text-xs">
              Contractor Count
            </Label>
            <Input
              id="contractor_count"
              type="text"
              inputMode="numeric"
              placeholder="e.g. 100"
              value={formatNumber(data.contractor_count)}
              onChange={(e) =>
                update('contractor_count', parseInteger(e.target.value))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contractor_spend" className="text-xs">
              Contractor Spend
            </Label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="contractor_spend"
                type="text"
                inputMode="numeric"
                className="pl-6"
                placeholder="0"
                value={formatCurrency(data.contractor_spend)}
                onChange={(e) =>
                  update('contractor_spend', parseCurrency(e.target.value))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="outsourced_spend" className="text-xs">
              Outsourced Spend
            </Label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="outsourced_spend"
                type="text"
                inputMode="numeric"
                className="pl-6"
                placeholder="0"
                value={formatCurrency(data.outsourced_spend)}
                onChange={(e) =>
                  update('outsourced_spend', parseCurrency(e.target.value))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="internal_labor_spend" className="text-xs">
              Internal Labor Spend
            </Label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="internal_labor_spend"
                type="text"
                inputMode="numeric"
                className="pl-6"
                placeholder="0"
                value={formatCurrency(data.internal_labor_spend)}
                onChange={(e) =>
                  update('internal_labor_spend', parseCurrency(e.target.value))
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
