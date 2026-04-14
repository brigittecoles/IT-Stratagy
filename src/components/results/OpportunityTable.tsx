'use client';

import type { OpportunityResult } from '@/lib/engine/types';
import { ConfidenceBadge } from '@/components/results/ConfidenceBadge';
import { cn } from '@/lib/utils';

interface OpportunityTableProps {
  opportunities: OpportunityResult[];
  className?: string;
}

function fmt(n: number): string {
  if (Math.abs(n) >= 1_000_000) {
    return `$${(n / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(n) >= 1_000) {
    return `$${(n / 1_000).toFixed(0)}K`;
  }
  return `$${n.toFixed(0)}`;
}

export function OpportunityTable({ opportunities, className }: OpportunityTableProps) {
  const totalLow = opportunities.reduce((s, o) => s + o.low_case, 0);
  const totalBase = opportunities.reduce((s, o) => s + o.base_case, 0);
  const totalHigh = opportunities.reduce((s, o) => s + o.high_case, 0);

  return (
    <div className={cn('overflow-x-auto rounded-xl border border-border', className)}>
      <table className="w-full text-sm">
        {/* WM Data Table: navy header, white bold text */}
        <thead>
          <tr className="wm-table-header text-left">
            <th className="px-4 py-3">Opportunity Module</th>
            <th className="px-4 py-3 text-right">Low Case</th>
            <th className="px-4 py-3 text-right">Base Case</th>
            <th className="px-4 py-3 text-right">High Case</th>
            <th className="px-4 py-3 text-center">Confidence</th>
            <th className="px-4 py-3">Key Assumptions</th>
          </tr>
        </thead>
        <tbody>
          {opportunities.map((opp, idx) => (
            <tr
              key={idx}
              className={cn(
                'transition-colors hover:bg-[rgba(0,71,255,0.03)]',
                idx % 2 === 1 ? 'bg-wm-slate-50' : 'bg-white',
              )}
            >
              <td className="whitespace-nowrap px-4 py-3 font-bold text-foreground">
                {opp.module_name}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-muted-foreground">
                {fmt(opp.low_case)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-bold text-foreground">
                {fmt(opp.base_case)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-muted-foreground">
                {fmt(opp.high_case)}
              </td>
              <td className="px-4 py-3 text-center">
                <ConfidenceBadge level={opp.confidence} />
              </td>
              <td className="max-w-[240px] truncate px-4 py-3 text-muted-foreground">
                {opp.assumptions.join('; ')}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-wm-slate-200 bg-wm-slate-50 font-bold">
            <td className="px-4 py-3 text-foreground">Total</td>
            <td className="px-4 py-3 text-right font-mono">{fmt(totalLow)}</td>
            <td className="px-4 py-3 text-right font-mono text-wm-magenta">{fmt(totalBase)}</td>
            <td className="px-4 py-3 text-right font-mono">{fmt(totalHigh)}</td>
            <td className="px-4 py-3" />
            <td className="px-4 py-3" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
