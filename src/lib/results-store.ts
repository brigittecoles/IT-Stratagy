import type { EngineResult } from '@/lib/engine/types';

// Shared results cache — used by both server actions and API routes.
// Singleton Map that persists for the lifetime of the Node.js process.
export const resultsStore = new Map<string, EngineResult>();
