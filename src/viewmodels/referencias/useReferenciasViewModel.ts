import { useCallback, useEffect, useState } from "react";
import type { Page, Referencia } from "@/models/Referencia";
import { getReferencias } from "@/api/referencias";

export function useReferenciasViewModel(initialParams: { page?: number; size?: number; sort?: string } = { page: 0, size: 50, sort: "id,desc" }) {
  const [data, setData] = useState<Page<Referencia> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [params, setParams] = useState(initialParams);

  const fetchPage = useCallback(async (p: { page?: number; size?: number; sort?: string } = {}) => {
    const merged = { ...params, ...p };
    setLoading(true);
    setError(null);
    try {
      const resp = await getReferencias(merged);
      setData(resp);
      setParams(merged);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [params]);

  const refresh = useCallback(() => fetchPage({}), [fetchPage]);

  useEffect(() => {
    // initial load
    fetchPage(params as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, loading, error, fetchPage, refresh } as const;
}
