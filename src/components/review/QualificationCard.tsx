'use client';

import type { DiagnosticLevel, ConfidenceLevel } from '@/lib/schema/value-lists';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfidenceBadge } from '@/components/results/ConfidenceBadge';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertTriangle, ArrowRight, Plus, Pencil } from 'lucide-react';

interface QualificationCardProps {
  qualifiedLevel: DiagnosticLevel;
  targetLevel: DiagnosticLevel;
  confidence: ConfidenceLevel;
  missingForNextLevel: string[];
  onProceed?: () => void;
  onAddMore?: () => void;
  onEditAssumptions?: () => void;
  className?: string;
}

const levelOrder: DiagnosticLevel[] = [
  'Quick Read',
  'Standard Diagnostic',
  'Full Diagnostic',
  'Full Diagnostic with Vendor + Roadmap Intelligence',
];

export function QualificationCard({
  qualifiedLevel,
  targetLevel,
  confidence,
  missingForNextLevel,
  onProceed,
  onAddMore,
  onEditAssumptions,
  className,
}: QualificationCardProps) {
  const qualifiedIdx = levelOrder.indexOf(qualifiedLevel);
  const targetIdx = levelOrder.indexOf(targetLevel);
  const meetsTarget = qualifiedIdx >= targetIdx;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {meetsTarget ? (
            <CheckCircle className="h-5 w-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          )}
          Qualified Diagnostic Level
        </CardTitle>
        <CardDescription>
          {meetsTarget
            ? 'Data meets the requirements for your target diagnostic level.'
            : 'Data qualifies for a lower level than targeted. See what is missing below.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Qualified level display */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Qualified Level
            </p>
            <p className="mt-0.5 text-xl font-semibold text-foreground">{qualifiedLevel}</p>
          </div>
          <ConfidenceBadge level={confidence} />
        </div>

        {/* Target vs Qualified */}
        {!meetsTarget && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              Target was <span className="font-semibold">{targetLevel}</span>. You qualified for{' '}
              <span className="font-semibold">{qualifiedLevel}</span>.
            </p>
          </div>
        )}

        {/* Missing for next level */}
        {missingForNextLevel.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium text-foreground">
              Missing for next level:
            </h4>
            <ul className="space-y-1.5">
              {missingForNextLevel.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        <Button variant="default" onClick={onProceed} className="gap-1.5">
          Proceed
          <ArrowRight className="h-3.5 w-3.5" data-icon="inline-end" />
        </Button>
        <Button variant="outline" onClick={onAddMore} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" data-icon="inline-start" />
          Add More Data
        </Button>
        <Button variant="ghost" onClick={onEditAssumptions} className="gap-1.5">
          <Pencil className="h-3.5 w-3.5" data-icon="inline-start" />
          Edit Assumptions
        </Button>
      </CardFooter>
    </Card>
  );
}
