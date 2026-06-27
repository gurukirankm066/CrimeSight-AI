import { useEffect, useState } from "react";

type ApiResult<T> = { data: T; error: string | null; offline: boolean };

export function useApi<T>(loader: () => Promise<ApiResult<T>>, deps: unknown[] = []) {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: string | null;
    offline: boolean;
  }>({ data: null, loading: true, error: null, offline: false });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    loader().then((res) => {
      if (cancelled) return;
      setState({ data: res.data, loading: false, error: res.error, offline: res.offline });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
