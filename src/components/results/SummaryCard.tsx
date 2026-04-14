'use client';

import type { DiagnosticLevel, ConfidenceLevel } from '@/lib/schema/value-lists';
import { Card, CardContent } from '@/components/ui/card';
import { ConfidenceBadge } from '@/components/results/ConfidenceBadge';
import { cn } from '@/lib/utils';
import { Building2 } from 'lucide-react';

interface SummaryCardProps {
  companyName: string;
  qualifiedLevel: DiagnosticLevel;
  overallConfidence: ConfidenceLevel;
  executiveSummary: string;
  className?: string;
}

export function SummaryCard({
  companyName,
  qualifiedLevel,
  overallConfidence,
  executiveSummary,
  className,
}: SummaryCardProps) {
  return (
    <Card className={cn('w-full overflow-hidden', className)}>
      {/* Navy header bar — WM Key Message Block pattern */}
      <div className="bg-wm-navy px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
              <Building2 className="h-5 w-5 text-wm-cyan" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{companyName}</h3>
              <p className="mt-0.5 text-sm text-white/60">{qualifiedLevel}</p>
            </div>
          </div>
          <ConfidenceBadge level={overallConfidence} className="mt-1" />
        </div>
      </div>
      <CardContent className="pt-5">
        <span className="wm-overline">Executive Summary</span>
        <p className="mt-2 leading-relaxed text-foreground">{executiveSummary}</p>
      </CardContent>
    </Card>
  );
}
