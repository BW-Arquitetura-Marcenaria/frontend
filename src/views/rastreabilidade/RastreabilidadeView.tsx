import React, { useState } from "react";
import { useRastreabilidadeViewModel } from "@/viewmodels/rastreabilidade/useRastreabilidadeViewModel";
import type { Rastreabilidade as RastreabilidadeItem, RastreabilidadeRequest } from "@/models/Rastreabilidade";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";

export type ProjetoOption = { id: number; nome: string; tipo?: string };

type FormState = {
  id: number | null;
  projetoId: number | "";
  lote: string;
  tipoMadeira: string;
  fornecedor: string;
  origem: string;
  certificacoes: string;
  volume: string;
  dataRegistro: string;
};

const hojeISO = () => new Date().toISOString().slice(0, 10);
const emptyForm = (projetoId: number | ""): FormState => ({
  id: null, projetoId, lote: "", tipoMadeira: "", fornecedor: "", origem: "", certificacoes: "", volume: "", dataRegistro: hojeISO(),
});
const fmtData = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—");

const inputCls = "bg-transparent border-b border-bw-dourado/30 focus:border-bw-dourado text-bw-white text-sm py-1.5 outline-none transition-colors";
const labelCls = "font-mono text-[9px] uppercase tracking-wider text-bw-areia";

export default function RastreabilidadeView({ projetos }: { projetos: ProjetoOption[] }) {
  const { data, loading, saving, error, projetoId, filterByProjeto, create, update, remove } = useRastreabilidadeViewModel();
  const [selIndex, setSelIndex] = useState(0);
  const [form, setForm] = useState<FormState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RastreabilidadeItem | null>(null);

  const lotes = data?.content ?? [];
  const s = lotes[selIndex] ?? lotes[0];

  const openEdit = (r: RastreabilidadeItem) =>
    setForm({
      id: r.id,
      projetoId: r.projeto?.id ?? "",
      lote: r.lote,
      tipoMadeira: r.tipoMadeira,
      fornecedor: r.fornecedor,
      origem: r.origem,
      certificacoes: r.certificacoes,
      volume: r.volume,
      dataRegistro: r.dataRegistro ? r.dataRegistro.slice(0, 10) : hojeISO(),
    });

  const handleExcluir = async () => {
    if (!deleteTarget) return;
    const deleted = await remove(deleteTarget.id);
    if (deleted) {
      setDeleteTarget(null);
      setSelIndex(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || form.projetoId === "") return;
    const body: RastreabilidadeRequest = {
      lote: form.lote, tipoMadeira: form.tipoMadeira, fornecedor: form.fornecedor, origem: form.origem,
      certificacoes: form.certificacoes, volume: form.volume, dataRegistro: form.dataRegistro || undefined,
      projetoId: Number(form.projetoId),
    };
    const result = form.id === null ? await create(body) : await update(form.id, body);
    if (result) setForm(null);
  };

  const set = (patch: Partial<FormState>) => setForm(f => (f ? { ...f, ...patch } : f));
  const trashIcon = (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/></svg>
  );

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto w-full relative">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-bw-preto font-display">Rastreabilidade de Materiais</h1>
          <p className="text-[10px] font-mono text-bw-muted">Transparência da origem ao produto final</p>
        </div>
        <button onClick={() => setForm(emptyForm(projetoId ?? ""))} className="px-3 py-1.5 bg-bw-dourado text-white rounded-md text-xs hover:bg-bw-madeira transition-colors">+ Registrar Uso</button>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-bw-border bg-bw-white p-3 sm:flex-row sm:items-center sm:gap-4">
        <label className="text-[10px] font-mono uppercase tracking-wider text-bw-madeira whitespace-nowrap">Filtrar por Projeto:</label>
        <select
          value={projetoId ?? ""}
          onChange={e => { setSelIndex(0); filterByProjeto(e.target.value ? Number(e.target.value) : null); }}
          className="flex-1 bg-transparent border-b border-bw-border-sub text-bw-preto text-sm py-1.5 outline-none focus:border-bw-dourado transition-colors"
        >
          <option value="">Todos os Lotes (Estoque Geral)</option>
          {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}{p.tipo ? ` — ${p.tipo}` : ""}</option>)}
        </select>
      </div>

      {error && <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">Erro: {error.message}</div>}

      <div className="grid md:grid-cols-5 gap-5 min-h-[400px]">
        <div className="md:col-span-2 bg-bw-white border border-bw-border rounded-lg overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-bw-border bg-bw-areia flex items-center justify-between">
            <span className="text-xs font-semibold text-bw-madeira">Materiais Vinculados</span>
            <span className="text-[10px] font-mono text-bw-muted">{data?.totalElements ?? 0} reg.</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-bw-muted">Carregando...</div>
            ) : lotes.length === 0 ? (
              <div className="p-8 text-center text-sm text-bw-muted">Nenhum material registrado para este projeto.</div>
            ) : (
              lotes.map((l, i) => (
                <div key={l.id} className="flex items-stretch border-b border-bw-border-sub last:border-0">
                  <button onClick={() => setSelIndex(i)} className={`flex-1 text-left px-4 py-3 hover:bg-bw-hover transition-colors ${selIndex === i ? "border-l-2 border-l-bw-dourado pl-3.5 bg-bw-areia/30" : ""}`}>
                    <div className="font-mono text-[10px] text-bw-muted">{l.lote}</div>
                    <div className="text-xs font-medium text-bw-preto mt-0.5">{l.tipoMadeira}</div>
                    <div className="text-[10px] text-bw-muted">{l.fornecedor}</div>
                  </button>
                  <button onClick={() => setDeleteTarget(l)} disabled={saving} title="Excluir material" aria-label={`Excluir ${l.lote}`} className="px-3 text-bw-muted hover:text-red-600 hover:bg-bw-hover transition-colors disabled:opacity-40">
                    {trashIcon}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="md:col-span-3 bg-bw-white border border-bw-border rounded-lg p-6 flex flex-col gap-4">
          {s ? (
            <>
              <div className="flex items-start justify-between pb-4 border-b border-bw-border">
                <div>
                  <div className="font-mono text-[10px] text-bw-muted mb-1">{s.lote}</div>
                  <div className="text-lg font-semibold text-bw-preto font-display">{s.tipoMadeira}</div>
                  <div className="text-xs text-bw-madeira mt-1">Vinculado a: <strong>{s.projeto?.nome ?? projetos.find(p => p.id === s.projeto?.id)?.nome ?? "Não vinculado"}</strong></div>
                </div>
                <button onClick={() => openEdit(s)} className="px-3 py-1.5 border border-bw-border text-bw-madeira rounded-md text-xs hover:bg-bw-hover transition-colors">Editar</button>
              </div>
              <div className="grid gap-x-6 gap-y-4 pt-2 sm:grid-cols-2">
                {[["Origem", s.origem], ["Fornecedor", s.fornecedor], ["Certificação", s.certificacoes], ["Volume Utilizado", s.volume], ["Data de Registro", fmtData(s.dataRegistro)]].map(([l, v]) => (
                  <div key={l} className="flex flex-col gap-1">
                    <div className="text-[9px] font-mono text-bw-muted uppercase tracking-wider">{l}</div>
                    <div className="text-xs text-bw-preto font-medium">{v}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-bw-muted text-sm">Selecione um lote para visualizar os detalhes.</div>
          )}
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bw-preto/60 backdrop-blur-sm p-4">
          <div className="relative max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto border border-bw-dourado/20 bg-bw-preto/90 p-5 shadow-2xl backdrop-blur-md sm:p-8">
            <button onClick={() => setForm(null)} className="absolute top-4 right-5 text-bw-areia hover:text-white transition-colors">
              <span className="font-mono text-[10px] uppercase tracking-wider">Fechar</span>
            </button>
            <div className="mb-8">
              <h2 className="font-display text-2xl text-bw-white">{form.id === null ? "Registrar Uso de Material" : "Editar Material"}</h2>
              <p className="font-mono text-[10px] text-bw-dourado uppercase tracking-widest mt-1">Vincular lote a um projeto</p>
            </div>

            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Projeto (Cliente)</label>
                <select value={form.projetoId} onChange={e => set({ projetoId: e.target.value ? Number(e.target.value) : "" })} className={`${inputCls} appearance-none rounded-none`} required>
                  <option value="" disabled hidden className="bg-bw-preto text-bw-white">Selecione o projeto...</option>
                  {projetos.map(p => <option key={p.id} value={p.id} className="bg-bw-preto text-bw-white">{p.nome}{p.tipo ? ` — ${p.tipo}` : ""}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Lote do Fornecedor</label>
                <input type="text" maxLength={100} value={form.lote} onChange={e => set({ lote: e.target.value })} className={inputCls} required placeholder="Ex: LOT-2024-105" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Material / Madeira</label>
                <input type="text" maxLength={100} value={form.tipoMadeira} onChange={e => set({ tipoMadeira: e.target.value })} className={inputCls} required placeholder="Ex: Carvalho Maciço 20mm" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Fornecedor</label>
                  <input type="text" maxLength={150} value={form.fornecedor} onChange={e => set({ fornecedor: e.target.value })} className={inputCls} required placeholder="Ex: Pinheiro Madeiras Ltda." />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Origem</label>
                  <input type="text" maxLength={150} value={form.origem} onChange={e => set({ origem: e.target.value })} className={inputCls} required placeholder="Ex: Paraná, BR" />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Volume Utilizado</label>
                  <input type="text" maxLength={100} value={form.volume} onChange={e => set({ volume: e.target.value })} className={inputCls} required placeholder="Ex: 5 chapas" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Certificação</label>
                  <input type="text" maxLength={255} value={form.certificacoes} onChange={e => set({ certificacoes: e.target.value })} className={inputCls} required placeholder="FSC, IBAMA..." />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Data de Registro</label>
                <input type="date" value={form.dataRegistro} onChange={e => set({ dataRegistro: e.target.value })} className={`${inputCls} [color-scheme:dark]`} />
              </div>

              {error && <div className="text-xs text-red-400">{error.message}</div>}

              <div className="mt-4">
                <button type="submit" disabled={saving} className="w-full bg-bw-dourado text-bw-preto font-semibold py-3 text-xs uppercase tracking-wider hover:bg-bw-areia transition-colors disabled:opacity-60">
                  {saving ? "Salvando..." : form.id === null ? "Vincular Material" : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          title="Excluir material?"
          itemName={`${deleteTarget.lote} · ${deleteTarget.tipoMadeira}`}
          description="O vínculo deste material com o projeto e seu histórico de rastreabilidade serão removidos permanentemente."
          loading={saving}
          error={error?.message}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void handleExcluir()}
        />
      )}
    </div>
  );
}

