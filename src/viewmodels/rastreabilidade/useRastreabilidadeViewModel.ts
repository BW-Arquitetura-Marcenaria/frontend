import { useCallback, useEffect, useState } from "react";
import type { Page } from "@/models/Referencia";
import type { Rastreabilidade, RastreabilidadeRequest } from "@/models/Rastreabilidade";
import {
  createRastreabilidade,
  deleteRastreabilidade,
  getRastreabilidades,
  getRastreabilidadesByProjeto,
  updateRastreabilidade,
} from "@/api/rastreabilidades";

type PageParams = { page?: number; size?: number; sort?: string };

function toError(err: unknown): Error {
  const e = err as any;
  const msg = e?.response?.data?.message ?? e?.message;
  return err instanceof Error && !e?.response ? err : new Error(msg ?? String(err));
}

export function useRastreabilidadeViewModel(
  initialParams: PageParams = { page: 0, size: 10, sort: "id,desc" }
) {
  const [data, setData] = useState<Page<Rastreabilidade> | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [params, setParams] = useState<PageParams>(initialParams);
  const [projetoId, setProjetoId] = useState<number | null>(null);

  const fetchPage = useCallback(
    async (p: PageParams = {}, projeto: number | null = projetoId) => {
      const merged = { ...params, ...p };
      setLoading(true);
      setError(null);
      try {
        const resp =
          projeto === null
            ? await getRastreabilidades(merged)
            : await getRastreabilidadesByProjeto(projeto, merged);
        setData(resp);
        setParams(merged);
        setProjetoId(projeto);
      } catch (err) {
        setError(toError(err));
      } finally {
        setLoading(false);
      }
    },
    [params, projetoId]
  );

  const refresh = useCallback(() => fetchPage({}), [fetchPage]);

  const filterByProjeto = useCallback(
    (id: number | null) => fetchPage({ page: 0 }, id),
    [fetchPage]
  );

  const mutate = useCallback(
    async <T,>(action: () => Promise<T>): Promise<T | undefined> => {
      setSaving(true);
      setError(null);
      try {
        const result = await action();
        await fetchPage({});
        return result;
      } catch (err) {
        setError(toError(err));
        return undefined;
      } finally {
        setSaving(false);
      }
    },
    [fetchPage]
  );

  const create = useCallback(
    (body: RastreabilidadeRequest) => mutate(() => createRastreabilidade(body)),
    [mutate]
  );
  const update = useCallback(
    (id: number, body: RastreabilidadeRequest) => mutate(() => updateRastreabilidade(id, body)),
    [mutate]
  );
  const remove = useCallback(
    (id: number) => mutate(() => deleteRastreabilidade(id)),
    [mutate]
  );

  useEffect(() => {
    fetchPage(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, loading, saving, error, projetoId, fetchPage, refresh, filterByProjeto, create, update, remove } as const;
}

