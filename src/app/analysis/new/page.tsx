'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ClipboardList,
  MessageSquareText,
  Upload,
  Gauge,
  Loader2,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DIAGNOSTIC_LEVELS } from '@/lib/schema/value-lists';
import { createNewAnalysis } from '@/lib/actions';

const INTAKE_MODES = [
  {
    key: 'form' as const,
    title: 'Simple Form',
    description: 'Enter your numbers directly',
    detail:
      'Best when you have IT spend figures, headcounts, and revenue numbers ready. Fastest path to a diagnostic.',
    icon: ClipboardList,
    badge: 'Fastest',
  },
  {
    key: 'wizard' as const,
    title: 'Guided Wizard',
    description: 'Answer plain-language questions',
    detail:
      'We walk you through each data point with context and guidance. Great if you are unsure what numbers to provide.',
    icon: MessageSquareText,
    badge: 'Recommended',
  },
  {
    key: 'file-drop' as const,
    title: 'File Drop',
    description: 'Upload your data files',
    detail:
      'Upload IT budgets, vendor lists, org charts, or project portfolios. Our parser will extract the key data points.',
    icon: Upload,
    badge: 'Most data',
  },
] as const;

const LEVEL_DESCRIPTIONS: Record<string, string> = {
  'Quick Read':
    'High-level IT spend benchmarks. Requires minimal data.',
  'Standard Diagnostic':
    'Spend, staffing, and transformation benchmarks with peer comparisons.',
  'Full Diagnostic':
    'Comprehensive analysis including vendor concentration and roadmap assessment.',
  'Full Diagnostic with Vendor + Roadmap Intelligence':
    'Everything plus detailed vendor and project portfolio intelligence.',
};

export default function NewAnalysisPage() {
  const [selectedLevel, setSelectedLevel] = useState<string>('Standard Diagnostic');
  const [isPending, startTransition] = useTransition();
  const [pendingMode, setPendingMode] = useState<string | null>(null);

  const handleSelectMode = (mode: 'form' | 'wizard' | 'file-drop') => {
    setPendingMode(mode);
    startTransition(async () => {
      await createNewAnalysis(mode, selectedLevel);
    });
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Page title */}
      <div>
        <span className="wm-overline">New</span>
        <h1 className="text-2xl font-bold tracking-tight mt-1">New Analysis</h1>
        <p className="text-muted-foreground mt-1">
          Choose your diagnostic depth and preferred data intake method.
        </p>
      </div>

      {/* Set Expectations */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-wm-magenta" />
          <h2 className="text-lg font-bold">Set Expectations</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Select the diagnostic level that matches the depth of insight you need.
          Higher levels require more data.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {DIAGNOSTIC_LEVELS.map((level) => {
            const isSelected = selectedLevel === level;
            return (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`rounded-lg border p-4 text-left transition-all hover:shadow-[0_4px_12px_rgba(7,1,84,0.10)] ${
                  isSelected
                    ? 'border-wm-blue bg-wm-blue-50 ring-1 ring-wm-blue'
                    : 'border-border hover:border-wm-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">{level}</span>
                  {isSelected && (
                    <span className="wm-badge-primary rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {LEVEL_DESCRIPTIONS[level]}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Intake mode selector */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold">Choose Intake Method</h2>
        <p className="text-sm text-muted-foreground">
          Pick the way you would like to provide your data. You can combine
          methods later.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {INTAKE_MODES.map((mode) => {
            const Icon = mode.icon;
            const isLoading = isPending && pendingMode === mode.key;
            return (
              <button
                key={mode.key}
                onClick={() => handleSelectMode(mode.key)}
                disabled={isPending}
                className="text-left"
              >
                <Card className={`group h-full cursor-pointer transition-all hover:shadow-[0_4px_12px_rgba(7,1,84,0.10)] ${
                  isLoading ? 'opacity-70' : ''
                } ${isPending && !isLoading ? 'opacity-50' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="rounded-md bg-wm-navy-50 p-2">
                        {isLoading ? (
                          <Loader2 className="h-5 w-5 text-wm-navy animate-spin" />
                        ) : (
                          <Icon className="h-5 w-5 text-wm-navy" />
                        )}
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                        mode.badge === 'Recommended' ? 'wm-badge-accent' : 'wm-badge-neutral'
                      }`}>
                        {mode.badge}
                      </span>
                    </div>
                    <CardTitle className="text-base mt-3">{mode.title}</CardTitle>
                    <CardDescription>{mode.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {mode.detail}
                    </p>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
