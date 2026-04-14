'use client';

import Link from 'next/link';
import { PlusCircle, BarChart3, Clock, TrendingUp } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  // TODO: fetch analyses from API once wired up
  const analyses: unknown[] = [];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="wm-overline">Overview</span>
          <h1 className="text-2xl font-bold tracking-tight mt-1">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your IT strategy diagnostic analyses
          </p>
        </div>
        <Link href="/analysis/new">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            New Analysis
          </Button>
        </Link>
      </div>

      {/* Stat callout cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="wm-overline">Total Analyses</p>
              <BarChart3 className="h-4 w-4 text-wm-slate-400" />
            </div>
            <p className="wm-stat-value wm-stat-value-md">{analyses.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="wm-overline">In Progress</p>
              <Clock className="h-4 w-4 text-wm-slate-400" />
            </div>
            <p className="wm-stat-value wm-stat-value-md">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="wm-overline">Completed</p>
              <TrendingUp className="h-4 w-4 text-wm-slate-400" />
            </div>
            <p className="wm-stat-value wm-stat-value-md">0</p>
          </CardContent>
        </Card>
      </div>

      {/* Analyses list / empty state */}
      {analyses.length === 0 ? (
        <div className="wm-key-message text-center">
          <div className="mx-auto max-w-md space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
              <BarChart3 className="h-8 w-8 text-wm-cyan" />
            </div>
            <h3 className="text-xl font-bold text-white">No analyses yet</h3>
            <p className="text-white/70 text-sm">
              Start a new IT strategy diagnostic to benchmark your IT spending,
              staffing, and investment posture against{' '}
              <span className="wm-key-message-highlight font-bold">industry peers</span>.
            </p>
            <Link href="/analysis/new">
              <Button className="mt-4 gap-2 bg-wm-magenta text-white hover:bg-wm-magenta-600">
                <PlusCircle className="h-4 w-4" />
                New Analysis
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {/* Future: render analysis cards here */}
        </div>
      )}
    </div>
  );
}
