import { useState, useEffect, useRef, useCallback } from 'react';

export function useDebouncedSearch<T>(
  fetchFn: (query: string, signal: AbortSignal) => Promise<T>,
  delay: number = 300,
  minChars: number = 2
) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (activeQuery: string = query) => {
    if (activeQuery.length > 0 && activeQuery.length < minChars) {
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchFn(activeQuery, controller.signal);
      if (!controller.signal.aborted) {
        setResults(data);
      }
    } catch (err: any) {
      if (!controller.signal.aborted && err.name !== 'AbortError') {
        setError(err);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [query, minChars, fetchFn]);

  useEffect(() => {
    if (query.length > 0 && query.length < minChars) {
      return;
    }

    const timeoutId = setTimeout(() => {
      execute(query);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [query, delay, minChars, execute]);

  return {
    query,
    setQuery,
    results,
    setResults,
    loading,
    error,
    execute,
  };
}
