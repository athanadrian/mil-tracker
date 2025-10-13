'use client';

import { useState } from 'react';
import { toast } from 'sonner';

type AsyncFn<T, A extends any[]> = (...args: A) => Promise<T>;

function useFetch<T, A extends any[]>(cb: AsyncFn<T, A>) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const fn = async (...args: A): Promise<T | undefined> => {
    setLoading(true);
    setError(null);

    try {
      const response = await cb(...args);
      setData(response);
      return response;
    } catch (err) {
      setError(err);
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
          ? err
          : 'Κάτι πήγε στραβά';
      toast.error(msg);
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fn, setData };
}

export default useFetch;
