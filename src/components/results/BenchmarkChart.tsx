'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { BenchmarkGap } from '@/lib/engine/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface BenchmarkChartProps {
  gaps: BenchmarkGap[];
  className?: string;
}

/* WM Design System chart palette */
const COLORS = {
  actual: '#0047FF',     /* WM Blue — primary action */
  median: '#50658E',     /* WM Slate 600 — secondary text */
  p75: '#F900D3',        /* WM Magenta — accent */
  topQuartile: '#1DD566', /* WM Green — success */
};

export function BenchmarkChart({ gaps, className }: BenchmarkChartProps) {
  const chartData = gaps.map((gap) => ({
    name: formatMetricName(gap.metric_name),
    Actual: +(gap.actual_pct * 100).toFixed(2),
    Median: +(gap.benchmark_median * 100).toFixed(2),
    P75: +(gap.benchmark_p75 * 100).toFixed(2),
    'Top Quartile': +(gap.benchmark_top_quartile * 100).toFixed(2),
  }));

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle>Benchmark Comparison</CardTitle>
        <CardDescription>
          Actual spend vs. industry benchmarks (as % of revenue)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
              barCategoryGap="20%"
              barGap={2}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
              />
              <YAxis
                tickFormatter={(v: number) => `${v}%`}
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
              />
              <Tooltip
                formatter={(value) => `${value}%`}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border))',
                  backgroundColor: 'hsl(var(--card))',
                  fontSize: '13px',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
              />
              <Bar dataKey="Actual" fill={COLORS.actual} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Median" fill={COLORS.median} radius={[3, 3, 0, 0]} />
              <Bar dataKey="P75" fill={COLORS.p75} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Top Quartile" fill={COLORS.topQuartile} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function formatMetricName(name: string): string {
  const map: Record<string, string> = {
    it_spend_pct_revenue: 'IT Spend %',
    opex_pct_revenue: 'OpEx %',
    capex_pct_revenue: 'CapEx %',
  };
  return map[name] ?? name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
