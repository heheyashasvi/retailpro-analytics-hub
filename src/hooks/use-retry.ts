import { useState, useCallback } from 'react';
import { withRetry, isRetryableError } from '@/lib/error-utils';

interface UseRetryOptions {
  maxRetries?: number;
  delay?: number;
  onError?: (error: unknown) => void;
  onSuccess?: () => void;
}

interface UseRetryReturn<T> {
  execute: () => Promise<T | undefined>;
  isLoading: boolean;
  error: unknown;
  retryCount: number;
  canRetry: boolean;
  reset: () => void;
}

export function useRetry<T>(
  fn: () => Promise<T>,
  options: UseRetryOptions = {}
): UseRetryReturn<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    onError,
    onSuccess,
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [retryCount, setRetryCount] = useState(0);

  const execute = useCallback(async (): Promise<T | undefined> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await withRetry(fn, maxRetries, delay);
      setRetryCount(0);
      onSuccess?.();
      return result;
    } catch (err) {
      setError(err);
      setRetryCount(prev => prev + 1);
      onError?.(err);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [fn, maxRetries, delay, onError, onSuccess]);

  const reset = useCallback(() => {
    setError(null);
    setRetryCount(0);
    setIsLoading(false);
  }, []);

const canRetry = Boolean(error) && isRetryableError(error) && retryCount < maxRetries;

  return {
    execute,
    isLoading,
    error,
    retryCount,
    canRetry,
    reset,
  };

}
