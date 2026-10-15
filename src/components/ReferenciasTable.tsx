import React from "react";
import { useReferencias } from "@/hooks/useReferencias";

export default function ReferenciasTable() {
  const { data, loading, error, refresh } = useReferencias({ page: 0, size: 100, sort: "id,desc" });
  const items = data?.content ?? [];
  const grouped = items.reduce<Record<string, typeof items>>((acc, it) => {
    const k = it.categoria ?? "Outros";
    if (!acc[k]) acc[k] = [];
    acc[k].push(it);
    return acc;
  }, {} as Record<string, typeof items>);

  if (loading) return <div className="p-6">Carregando referências...</div>;
  if (error) return <div className="p-6">Erro: {error.message}</div>;
  if (items.length === 0) return <div className="p-6">Nenhuma referência encontrada.</div>;

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(grouped).map(([cat, list]) => (
        <div key={cat} className="rounded border p-2">
          <div className="font-semibold mb-2">{cat}</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500"><th>Descrição</th><th>Unidade</th><th>Material</th><th>Preço</th></tr>
            </thead>
            <tbody>
              {list.map(it => (
                <tr key={it.id} className="border-t"><td className="py-2">{it.descricao}</td><td>{it.unidade}</td><td>{it.materialBase}</td><td>R$ {Number(it.precoReferencia).toLocaleString()}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
