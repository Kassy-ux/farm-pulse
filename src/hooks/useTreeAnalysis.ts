import { useState, useCallback } from 'react';
import { weatherClient } from '../utils/api';
import type { TreeAnalysisResponse, LoadingState, AppError } from '../types';

interface UseTreeAnalysisReturn {
  result: TreeAnalysisResponse | null;
  state: LoadingState;
  error: AppError | null;
  analyze: (
    file: File,
    options?: {
      farmerId?: string;
      county?: string;
      landAcres?: number;
      location?: string;
      notes?: string;
    }
  ) => Promise<void>;
  reset: () => void;
}

export function useTreeAnalysis(): UseTreeAnalysisReturn {
  const [result, setResult] = useState<TreeAnalysisResponse | null>(null);
  const [state, setState] = useState<LoadingState>('idle');
  const [error, setError] = useState<AppError | null>(null);

  const analyze = useCallback(
    async (
      file: File,
      options?: {
        farmerId?: string;
        county?: string;
        landAcres?: number;
        location?: string;
        notes?: string;
      }
    ) => {
      setState('loading');
      setError(null);
      setResult(null);
      try {
        const data = await weatherClient.analyzeTrees(file, options);
        setResult(data);
        setState('success');
      } catch (err) {
        setError({ message: (err as Error).message });
        setState('error');
      }
    },
    []
  );

  const reset = useCallback(() => {
    setResult(null);
    setState('idle');
    setError(null);
  }, []);

  return { result, state, error, analyze, reset };
}
