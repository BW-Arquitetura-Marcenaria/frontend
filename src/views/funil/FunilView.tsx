import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { isAxiosError } from "axios";
import { atualizarEtapaFunil, obterDetalheFunil, obterFunil, type CardFunil, type DetalheFunil, type EtapaFunil, type QuadroFunil } from "@/api/funil";

const etapas: EtapaFunil[] = ["QUALIFICADO", "ORCAMENTO_ENVIADO", "EM_NEGOCIACAO", "FECHADO"];
const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const dataHora = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

function mensagemErro(erro: unknown): string {
  if (isAxiosError(erro)) {
    if (erro.response?.status === 401 || erro.response?.status === 403) return "Acesso não autorizado. Entre com uma conta de administrador.";
    if (typeof erro.response?.data?.message === "string") return erro.response.data.message;
    if (!erro.response) return "Não foi possível conectar à API do funil.";
  }
  return "Não foi possível concluir a operação. Tente novamente.";
}

function recebidoEm(valor: string | null): string {
  if (!valor) return "Data não informada";
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? "Data não informada" : dataHora.format(data);
}

function orcamento(valor: number | string | null): string {
  if (valor === null || valor === "" || !Number.isFinite(Number(valor))) return "Não informado";
  return moeda.format(Number(valor));
}

function LeadCard({ lead, ocupado, onSelect, onDragStart, onDragEnd }: {
  lead: CardFunil; ocupado: boolean; onSelect: () => void;
  onDragStart: (evento: DragEvent<HTMLButtonElement>) => void; onDragEnd: () => void;
}) {
  const scoreStyle = lead.score !== null && lead.score >= 90 ? "bg-bw-dourado text-white" : lead.score !== null && lead.score >= 75 ? "bg-bw-madeira text-white" : "bg-bw-areia text-bw-madeira";
  return <button type="button" draggable={!ocupado} disabled={ocupado} onClick={onSelect} onDragStart={onDragStart} onDragEnd={onDragEnd}
    className="group w-full cursor-grab border border-bw-border bg-bw-white p-2.5 text-left transition-all hover:border-bw-dourado hover:shadow-[0_5px_16px_rgba(111,78,55,0.08)] focus:outline-none focus:ring-2 focus:ring-bw-dourado/40 active:cursor-grabbing disabled:cursor-wait disabled:opacity-50">
    <div className="mb-2 flex items-start justify-between">
      <div className="flex min-w-0 items-center gap-2"><span className="flex h-6 w-6 shrink-0 items-center justify-center border border-bw-border bg-bw-areia font-mono text-[9px] font-medium text-bw-madeira">{lead.iniciais}</span><span className="truncate text-[11px] font-semibold leading-tight text-bw-preto">{lead.nome}</span></div>
      {lead.score !== null && <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${scoreStyle}`} aria-label={`Score ${lead.score}`}>{lead.score}</span>}
    </div>
    <div className="mb-1 font-mono text-[9px] uppercase tracking-wide text-bw-muted">{lead.origem} · {recebidoEm(lead.recebidoEm)}</div>
    <div className="mb-1.5 truncate text-[10px] text-bw-madeira">{lead.tipoProjeto || "Projeto não informado"}</div>
    <div className="flex items-center justify-between gap-2"><span className="font-mono text-[10px] text-bw-preto">{orcamento(lead.orcamento)}</span>{lead.classificacao && <span className="truncate font-mono text-[9px] text-bw-madeira">{lead.classificacao}</span>}</div>
  </button>;
}

export default function FunilView() {
  const [quadro, setQuadro] = useState<QuadroFunil | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroQuadro, setErroQuadro] = useState("");
  const [erroAcao, setErroAcao] = useState("");
  const [aviso, setAviso] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState<number | null>(null);
  const [detalhe, setDetalhe] = useState<DetalheFunil | null>(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [arrastando, setArrastando] = useState<number | null>(null);
  const [colunaDestino, setColunaDestino] = useState<EtapaFunil | null>(null);
  const requisicaoDetalhe = useRef(0);
  const salvandoRef = useRef(false);

  const carregarQuadro = useCallback(async () => {
    try {
      setCarregando(true);
      const resultado = await obterFunil();
      setQuadro(resultado);
      setErroQuadro("");
    } catch (erro) {
      setErroQuadro(mensagemErro(erro));
    } finally { setCarregando(false); }
  }, []);

  useEffect(() => { void carregarQuadro(); }, [carregarQuadro]);
  useEffect(() => {
    const requisicao = ++requisicaoDetalhe.current;
    setDetalhe(null);
    if (clienteSelecionado === null) { setCarregandoDetalhe(false); return; }
    setCarregandoDetalhe(true);
    setErroAcao("");
    void obterDetalheFunil(clienteSelecionado).then(resposta => {
      if (requisicao === requisicaoDetalhe.current) setDetalhe(resposta);
    }).catch(erro => {
      if (requisicao === requisicaoDetalhe.current) setErroAcao(mensagemErro(erro));
    }).finally(() => {
      if (requisicao === requisicaoDetalhe.current) setCarregandoDetalhe(false);
    });
    return () => { requisicaoDetalhe.current++; };
  }, [clienteSelecionado]);

  const alterarEtapa = async (clienteId: number, etapa: EtapaFunil) => {
    if (salvandoRef.current || !quadro) return;
    if (quadro.colunas.some(coluna => coluna.etapa === etapa && coluna.cards.some(card => card.clienteId === clienteId))) return;
    salvandoRef.current = true;
    setSalvando(true);
    setErroAcao("");
    setAviso("");
    try {
      const atualizado = await atualizarEtapaFunil(clienteId, etapa);
      const novoQuadro = await obterFunil();
      setQuadro(novoQuadro);
      setErroQuadro("");
      if (clienteSelecionado === clienteId) setDetalhe(atualizado);
      setAviso(`Etapa de ${atualizado.nome} atualizada com sucesso.`);
    } catch (erro) {
      setErroAcao(mensagemErro(erro));
      // O PUT pode ter sido concluído antes de uma falha na atualização do quadro.
      void carregarQuadro();
    } finally { salvandoRef.current = false; setSalvando(false); }
  };

  const colunas = quadro?.colunas ?? [];
  const total = colunas.reduce((soma, coluna) => soma + coluna.total, 0);
  return <div className="mx-auto flex min-h-[42rem] w-full max-w-[1480px] flex-col overflow-hidden sm:h-full sm:min-h-0">
    <div className="flex shrink-0 flex-col gap-4 border-b border-bw-border pb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
      <div className="flex items-end gap-5"><div><div className="mb-1 font-mono text-[9px] uppercase tracking-[.18em] text-bw-dourado">Relacionamento comercial</div><h1 className="font-display text-4xl leading-none tracking-[-.04em] text-bw-preto">Funil de clientes</h1></div><p className="hidden max-w-[250px] border-l border-bw-border pl-5 text-[11px] leading-relaxed text-bw-muted xl:block">Priorize conversas que aproximam o projeto da decisão.</p></div>
      <div className="flex flex-wrap items-center gap-3 sm:shrink-0"><div className="flex items-baseline gap-5 border-r border-bw-border pr-5"><div className="flex items-baseline gap-2 whitespace-nowrap"><span className="font-mono text-[9px] uppercase tracking-[.14em] text-bw-muted">Pipeline</span><span className="text-lg font-semibold leading-none tabular-nums text-bw-preto">{quadro ? orcamento(quadro.pipeline) : "—"}</span></div><div className="flex items-baseline gap-2 whitespace-nowrap"><span className="font-mono text-[9px] uppercase tracking-[.14em] text-bw-muted">Score médio</span><span className="text-lg font-semibold leading-none tabular-nums text-bw-preto">{quadro?.scoreMedio ?? "—"}</span></div></div><button type="button" onClick={() => void carregarQuadro()} disabled={carregando || salvando} className="border border-bw-border bg-bw-white px-3 py-2 font-mono text-[10px] text-bw-madeira hover:bg-bw-hover disabled:opacity-50">Atualizar</button></div>
    </div>
    {aviso && <p role="status" className="mt-3 border border-bw-dourado bg-bw-white p-2 text-xs text-bw-madeira">{aviso}</p>}
    {erroAcao && <p role="alert" className="mt-3 text-sm text-red-700">{erroAcao}</p>}
    {erroQuadro && <div role="alert" className="mt-3 text-sm text-red-700">{erroQuadro} <button type="button" className="underline" onClick={() => void carregarQuadro()}>Tentar novamente</button></div>}
    {carregando && !quadro && <p role="status" className="mt-5 text-sm text-bw-muted">Carregando oportunidades...</p>}
    {quadro && <div className="min-h-0 flex-1 pt-4">
      <div className="mb-3 flex items-center justify-between rounded-sm border border-bw-border-sub bg-bw-white/50 px-3 py-2"><span className="font-mono text-[9px] uppercase tracking-[.16em] text-bw-muted">{quadro.oportunidadesAtivas} oportunidades ativas · {total} no quadro</span></div>
      <div className="grid h-[32rem] gap-2.5 overflow-x-auto pb-2 sm:h-[calc(100%-38px)]" style={{ gridTemplateColumns: `repeat(${Math.max(1, colunas.length)},minmax(15rem,1fr))` }}>
        {colunas.map(coluna => <section key={coluna.etapa} aria-label={coluna.titulo} onDragOver={evento => { if (salvando) return; evento.preventDefault(); evento.dataTransfer.dropEffect = "move"; setColunaDestino(coluna.etapa); }} onDragLeave={() => setColunaDestino(null)} onDrop={evento => { evento.preventDefault(); const id = Number(evento.dataTransfer.getData("text/plain")) || arrastando; setArrastando(null); setColunaDestino(null); if (id !== null && Number.isInteger(id)) void alterarEtapa(id, coluna.etapa); }} className={`flex min-w-0 flex-col border transition-colors ${colunaDestino === coluna.etapa ? "border-bw-dourado bg-bw-dourado/10" : "border-transparent bg-bw-white/30"}`}>
          <div className="flex min-h-10 items-center justify-between border-y border-bw-border px-2"><span className="font-mono text-[9px] uppercase tracking-[.09em] text-bw-madeira">{coluna.titulo}</span><span className="flex h-4 min-w-4 items-center justify-center bg-bw-areia px-1 font-mono text-[9px] text-bw-madeira">{coluna.total}</span></div>
          <div className="flex flex-col gap-2 p-2">{coluna.cards.length ? coluna.cards.map(lead => <LeadCard key={lead.clienteId} lead={lead} ocupado={salvando} onSelect={() => setClienteSelecionado(lead.clienteId)} onDragStart={evento => { evento.dataTransfer.effectAllowed = "move"; evento.dataTransfer.setData("text/plain", String(lead.clienteId)); setArrastando(lead.clienteId); }} onDragEnd={() => { setArrastando(null); setColunaDestino(null); }} />) : <p className="p-2 text-[10px] text-bw-muted">Nenhuma oportunidade nesta etapa.</p>}</div>
        </section>)}
      </div>
    </div>}
    {clienteSelecionado !== null && <div className="fixed inset-0 z-50 flex items-center justify-center bg-bw-preto/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="titulo-detalhe-funil" onMouseDown={evento => { if (evento.target === evento.currentTarget && !salvando) setClienteSelecionado(null); }}><div className="relative max-h-[calc(100svh-2rem)] w-full max-w-lg overflow-y-auto border border-bw-dourado/20 bg-bw-preto/90 p-5 shadow-2xl backdrop-blur-md sm:p-8">
      <button type="button" disabled={salvando} onClick={() => setClienteSelecionado(null)} className="absolute right-5 top-4 font-mono text-[10px] uppercase tracking-wider text-bw-areia hover:text-white disabled:opacity-50">Fechar</button>
      <div className="mb-7 flex items-center gap-4 border-b border-bw-dourado/20 pb-6"><div className="flex h-12 w-12 shrink-0 items-center justify-center border border-bw-dourado/40 bg-bw-areia/10 font-mono text-sm text-bw-areia">{detalhe?.iniciais ?? "—"}</div><div><div className="mb-1 font-mono text-[9px] uppercase tracking-[.18em] text-bw-dourado">Detalhes da oportunidade</div><h2 id="titulo-detalhe-funil" className="font-display text-3xl leading-none text-bw-white">{detalhe?.nome ?? "Carregando..."}</h2></div></div>
      {carregandoDetalhe && <p role="status" className="text-sm text-bw-areia">Carregando detalhes...</p>}
      {erroAcao && <p role="alert" className="mb-4 text-sm text-red-300">{erroAcao} {!detalhe && <button type="button" onClick={() => { const id = clienteSelecionado; setClienteSelecionado(null); window.setTimeout(() => setClienteSelecionado(id), 0); }} className="underline">Tentar novamente</button>}</p>}
      {detalhe && <><div className="mb-7 grid gap-x-8 gap-y-5 sm:grid-cols-2">{[["Tipo de projeto", detalhe.tipoProjeto || "Não informado"], ["Orçamento", orcamento(detalhe.orcamento)], ["Origem", detalhe.origem], ["Recebido", recebidoEm(detalhe.recebidoEm)], ["Classificação", detalhe.classificacao || "Não informada"], ["Score", detalhe.score === null ? "Não informado" : String(detalhe.score)]].map(([label, valor]) => <div key={label}><div className="mb-1 font-mono text-[9px] uppercase tracking-wider text-bw-areia/60">{label}</div><div className="text-sm text-bw-white">{valor}</div></div>)}</div>
        <div className="border-t border-bw-dourado/20 pt-6"><label htmlFor="etapa-funil" className="mb-2 block font-mono text-[9px] uppercase tracking-wider text-bw-areia">Etapa do funil</label><select id="etapa-funil" value={detalhe.etapa} disabled={salvando} onChange={evento => void alterarEtapa(detalhe.clienteId, evento.target.value as EtapaFunil)} className="w-full border-b border-bw-dourado/40 bg-transparent py-2 text-sm text-bw-white outline-none transition-colors focus:border-bw-dourado disabled:opacity-50">{etapas.map(etapa => <option key={etapa} value={etapa} className="bg-bw-preto text-bw-white">{colunas.find(coluna => coluna.etapa === etapa)?.titulo ?? etapa}</option>)}</select><p className="mt-3 text-[10px] leading-relaxed text-bw-areia/60">Altere a etapa aqui ou arraste o card entre as colunas.</p></div>
      </>}
    </div></div>}
  </div>;
}
