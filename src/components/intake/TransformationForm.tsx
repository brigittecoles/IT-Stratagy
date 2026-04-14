'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TRANSFORMATION_STATUS,
  TRANSFORMATION_TYPES,
} from '@/lib/schema/value-lists';
import type { FiscalYear } from '@/lib/schema/validation';

type TransformationFields = Pick<
  FiscalYear,
  | 'transformation_status'
  | 'transformation_type'
  | 'transformation_spend_estimate'
  | 'transformation_rolloff_timing'
  | 'roadmap_available'
>;

interface TransformationFormProps {
  data: Partial<TransformationFields>;
  onChange: (data: Partial<TransformationFields>) => void;
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

export function TransformationForm({
  data,
  onChange,
}: TransformationFormProps) {
  const update = (field: keyof TransformationFields, value: unknown) => {
    onChange({ ...data, [field]: value });
  };

  const toggleType = (type: string) => {
    const current = data.transformation_type ?? [];
    const next = current.includes(type as typeof current[number])
      ? current.filter((t) => t !== type)
      : [...current, type as typeof current[number]];
    update('transformation_type', next.length > 0 ? next : null);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">
          Transformation Context
        </h3>
        <p className="text-sm text-muted-foreground">
          Active or planned transformation programs that impact IT spend.
        </p>
      </div>

      {/* Transformation Active */}
      <div className="space-y-2">
        <Label>Is a transformation currently active?</Label>
        <Select
          value={data.transformation_status ?? ''}
          onValueChange={(val) =>
            update('transformation_status', val || null)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {TRANSFORMATION_STATUS.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Transformation Types */}
      <div className="space-y-3">
        <Label>Transformation Types</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {TRANSFORMATION_TYPES.map((type) => {
            const checked =
              data.transformation_type?.includes(type) ?? false;
            return (
              <label
                key={type}
                className="flex items-center gap-2 cursor-pointer rounded-md border border-input px-3 py-2 text-sm transition-colors hover:bg-muted data-[checked=true]:border-primary data-[checked=true]:bg-primary/5"
                data-checked={checked}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggleType(type)}
                />
                {type}
              </label>
            );
          })}
        </div>
      </div>

      {/* Spend Estimate */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="transformation_spend">
            Transformation Spend Estimate
          </Label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <Input
              id="transformation_spend"
              type="text"
              inputMode="numeric"
              className="pl-6"
              placeholder="0"
              value={formatCurrency(data.transformation_spend_estimate)}
              onChange={(e) =>
                update(
                  'transformation_spend_estimate',
                  parseCurrency(e.target.value)
                )
              }
            />
          </div>
        </div>

        {/* Roll-off Timing */}
        <div className="space-y-2">
          <Label htmlFor="rolloff_timing">Roll-off Timing</Label>
          <Input
            id="rolloff_timing"
            type="text"
            placeholder='e.g. "Q4 2026" or "18 months"'
            value={data.transformation_rolloff_timing ?? ''}
            onChange={(e) =>
              update(
                'transformation_rolloff_timing',
                e.target.value || null
              )
            }
          />
        </div>
      </div>

      {/* Roadmap Available */}
      <div className="space-y-2">
        <Label>Roadmap Available?</Label>
        <Select
          value={
            data.roadmap_available == null
              ? ''
              : data.roadmap_available
                ? 'yes'
                : 'no'
          }
          onValueChange={(val) => {
            if (val === 'yes') update('roadmap_available', true);
            else if (val === 'no') update('roadmap_available', false);
            else update('roadmap_available', null);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
