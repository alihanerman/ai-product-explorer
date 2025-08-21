import { useEffect, useState, useCallback } from "react";


export function useDebounce<
  F extends (...args: Parameters<F>) => ReturnType<F>
>(callback: F, delay: number): (...args: Parameters<F>) => void {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  const debouncedCallback = useCallback(
    (...args: Parameters<F>) => {

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      const newTimeoutId = setTimeout(() => {
        callback(...args);
      }, delay);
      setTimeoutId(newTimeoutId);
    },
    [callback, delay, timeoutId]
  );

  return debouncedCallback;
}
