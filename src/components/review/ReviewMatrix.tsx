'use client';

import type { ReviewMatrixRow } from '@/lib/schema/validation';
import type { ProvidedStatus } from '@/lib/schema/value-lists';
import { ConfidenceBadge } from '@/components/results/ConfidenceBadge';
import { cn } from '@/lib/utils';

const statusColor: Record<ProvidedStatus, string> = {
  Confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300',
  Missing: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300',
  'Partial / Inferred': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300',
};

interface ReviewMatrixProps {
  rows: ReviewMatrixRow[];
  className?: string;
}

export function ReviewMatrix({ rows, className }: ReviewMatrixProps) {
  return (
    <div className={cn('overflow-x-auto rounded-xl border border-border', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <th className="whitespace-nowrap px-4 py-3">Metric / Input</th>
            <th className="whitespace-nowrap px-4 py-3">Required for Level</th>
            <th className="whitespace-nowrap px-4 py-3">Provided</th>
            <th className="whitespace-nowrap px-4 py-3">Source</th>
            <th className="whitespace-nowrap px-4 py-3">Assumptions</th>
            <th className="whitespace-nowrap px-4 py-3">Confidence</th>
            <th className="whitespace-nowrap px-4 py-3">Value Preview</th>
            <th className="whitespace-nowrap px-4 py-3">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, idx) => (
            <tr
              key={`${row.metric_name}-${idx}`}
              className="transition-colors hover:bg-muted/30"
            >
              <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                {row.metric_name}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {row.required_for_level}
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                    statusColor[row.provided],
                  )}
                >
                  {row.provided}
                </span>
              </td>
              <td className="max-w-[160px] truncate px-4 py-3 text-muted-foreground">
                {row.file_source_used ?? <span className="italic text-muted-foreground/60">--</span>}
              </td>
              <td className="max-w-[180px] truncate px-4 py-3 text-muted-foreground">
                {row.mapping_assumptions ?? <span className="italic text-muted-foreground/60">--</span>}
              </td>
              <td className="px-4 py-3">
                <ConfidenceBadge level={row.confidence} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-foreground">
                {row.final_value_preview ?? <span className="italic text-muted-foreground/60">--</span>}
              </td>
              <td className="max-w-[180px] truncate px-4 py-3 text-muted-foreground">
                {row.notes_flags ?? <span className="italic text-muted-foreground/60">--</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
