import type { Metadata } from 'next';
import Link from 'next/link';
import { LayoutDashboard, PlusCircle } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'IT Strategy Diagnostic',
  description: 'Benchmark your IT spending, staffing, and investment posture against industry peers.',
};

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'New Analysis', href: '/analysis/new', icon: PlusCircle },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      style={{
        '--font-sans': 'Arial, Helvetica, sans-serif',
        '--font-mono': "'Courier New', Courier, monospace",
      } as React.CSSProperties}
    >
      <body className="flex h-full bg-background text-foreground font-sans">
        {/* Sidebar — WM Deep Navy */}
        <aside className="flex w-[280px] shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
          {/* App title bar */}
          <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
            {/* WM-styled logo mark */}
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-wm-blue text-white text-sm font-bold">
              IT
            </div>
            <span className="text-sm font-bold tracking-tight text-white">
              IT Strategy Diagnostic
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/8 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-sidebar-border px-6 py-4">
            <p className="text-xs text-white/40">v0.1.0 &middot; West Monroe</p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
        </main>

        <Toaster />
      </body>
    </html>
  );
}
