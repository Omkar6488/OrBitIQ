import { useCallback, useEffect, useRef, useState } from 'react';

export default function useFetch(fetcher, options = {}) {
  const { initialData = null, auto = true, intervalMs } = options;
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(auto);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const isMountedRef = useRef(true);

  const execute = useCallback(
    async ({ showLoader = true, asRefresh = false } = {}) => {
      if (showLoader && isMountedRef.current) {
        setLoading(true);
      }

      if (asRefresh && isMountedRef.current) {
        setRefreshing(true);
      }

      try {
        const response = await fetcher();
        if (isMountedRef.current) {
          setData(response);
          setError(null);
          setLastUpdated(Date.now());
        }
        return response;
      } catch (fetchError) {
        if (isMountedRef.current) {
          setError(fetchError || { message: 'Request failed' });
        }
        return null;
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [fetcher]
  );

  useEffect(() => {
    isMountedRef.current = true;

    if (auto) {
      execute();
    } else {
      setLoading(false);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [auto, execute]);

  useEffect(() => {
    if (!intervalMs) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      execute({ showLoader: false });
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [intervalMs, execute]);

  const refetch = useCallback(() => execute({ showLoader: true, asRefresh: true }), [execute]);

  return {
    data,
    loading,
    refreshing,
    error,
    lastUpdated,
    refetch,
    setData,
  };
}
