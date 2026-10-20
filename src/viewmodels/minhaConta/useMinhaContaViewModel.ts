import { useCallback, useEffect, useState } from "react";
import { getMinhaConta, putMinhaConta } from "@/api/minhaConta";

type EmpresaResumo = {
  cnpj?: string | null;
  razaoSocial?: string | null;
  nomeFantasia?: string | null;
  telefone?: string | null;
};

type MinhaConta = {
  tipoCliente: string; // PESSOA_FISICA | PESSOA_JURIDICA
  nome: string;
  sobrenome: string;
  cpf?: string | null;
  dataNascimento?: string | null; // yyyy-MM-dd
  email: string;
  telefone: string;
  origemContato?: string | null;
  instagramUsername?: string | null;
  empresa?: EmpresaResumo | null;
};

export function useMinhaContaViewModel() {
  const [data, setData] = useState<MinhaConta | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await getMinhaConta();
      setData(resp as MinhaConta);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  const salvar = useCallback(async (payload: any) => {
    setSaving(true);
    setError(null);
    try {
      const resp = await putMinhaConta(payload);
      setData(resp as MinhaConta);
      return resp as MinhaConta;
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, saving, fetch, salvar } as const;
}
