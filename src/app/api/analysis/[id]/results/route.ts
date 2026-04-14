import { NextRequest, NextResponse } from 'next/server';
import { resultsStore } from '@/lib/results-store';

// GET /api/analysis/[id]/results — Get completed analysis results
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = resultsStore.get(id);
  if (!result) {
    return NextResponse.json(
      { error: 'Results not found. Run the analysis first via POST /api/analysis/[id]/run' },
      { status: 404 },
    );
  }
  return NextResponse.json(result);
}
