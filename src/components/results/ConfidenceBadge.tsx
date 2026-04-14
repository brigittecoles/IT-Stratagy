'use client';

import type { ConfidenceLevel } from '@/lib/schema/value-lists';
import { cn } from '@/lib/utils';

/* WM Design System badge variants for confidence levels */
const colorMap: Record<ConfidenceLevel, string> = {
  High: 'wm-badge-success',
  Medium: 'wm-badge-warning',
  Low: 'wm-badge-error',
};

const dotColor: Record<ConfidenceLevel, string> = {
  High: 'bg-wm-green',
  Medium: 'bg-wm-gold',
  Low: 'bg-wm-red',
};

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  showDot?: boolean;
  className?: string;
}

export function ConfidenceBadge({ level, showDot = true, className }: ConfidenceBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold',
        colorMap[level],
        className,
      )}
    >
      {showDot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', dotColor[level])} />
      )}
      {level}
    </span>
  );
}
