import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { isAxiosError } from "axios";
import DeleteButton from "@/components/DeleteButton";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import {
  atualizarFinanceiro,
  criarFinanceiro,
  excluirFinanceiro,
  exportarFinanceiro,
  importarFinanceiro,
  listarFinanceiros,
  obterComparativoFinanceiro,
  obterKpisFinanceiros,
  type FinanceiroKpis,
  type FinanceiroMes,
  type PaginaFinanceira,
  type RegistroFinanceiro,
  type RegistroFinanceiroPayload,
  type ResultadoImportacaoFinanceiro,
  type ValorMonetario,
} from "@/api/financeiro";

const dinheiro = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const percentual = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const input = "w-full border-b border-bw-dourado/40 bg-transparent py-2 text-sm text-bw-white outline-none focus:border-bw-dourado [color-scheme:dark]";
const label = "flex flex-col gap-1 font-mono text-[10px] uppercase tracking-wider text-bw-areia";
const vazio: RegistroFinanceiroPayload = {
  descricao: "", quantidade: 1, valor: 0, frete: 0, valorTotal: 0,
  valorFinalDesconto: null, valorEntrada: null, receberEntrega: null,
  valorRecebidoFinal: null, valorTotalLiquido: null, dataPedido: "",
  dataEntrega: null, contatoCliente: "", regiaoVenda: "",
};

function moeda(valor: ValorMonetario | null | undefined) {
  return valor == null ? "—" : dinheiro.format(Number(valor));
}

function dataLocal(valor: string | null) {
  if (!valor) return "—";
  const [ano, mes, dia] = valor.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR").format(new Date(ano, mes - 1, dia));
}

function mensagemErro(erro: unknown): string {
  if (isAxiosError(erro)) {
    const mensagem = erro.response?.data?.message;
    if (typeof mensagem === "string" && mensagem) return mensagem;
    if (!erro.response) return "Não foi possível conectar à API financeira.";
  }
  return "Não foi possível concluir a operação. Tente novamente.";
}

function Cartao({ titulo, valor, detalhe, destaque = false }: { titulo: string; valor: string; detalhe?: string; destaque?: boolean }) {
  return <div className={`rounded-xl border p-5 shadow-sm sm:p-6 ${destaque ? "border-bw-madeira bg-bw-madeira text-white" : "border-bw-border bg-bw-white text-bw-preto"}`}>
    <p className={`mb-3 text-sm font-semibold ${destaque ? "text-bw-areia" : "text-bw-madeira"}`}>{titulo}</p>
    <p className="font-body text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{valor}</p>
    {detalhe && <p className={`mt-3 text-sm ${destaque ? "text-bw-areia" : "text-bw-madeira"}`}>{detalhe}</p>}
  </div>;
}

function CampoNumero({ titulo, valor, onChange, obrigatorio = false, inteiro = false }: {
  titulo: string; valor: number | string | null; onChange: (valor: number | null) => void;
  obrigatorio?: boolean; inteiro?: boolean;
}) {
  return <label className={label}>{titulo}
    <input className={input} type="number" min={inteiro ? "1" : "0"} step={inteiro ? "1" : "0.01"}
      value={valor ?? ""} required={obrigatorio}
      onChange={e => onChange(e.target.value === "" ? null : Number(e.target.value))} />
  </label>;
}

export default function FinanceiroView() {
  const [aba, setAba] = useState<"resumo" | "registros" | "metricas">("resumo");
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [pagina, setPagina] = useState<PaginaFinanceira | null>(null);
  const [kpis, setKpis] = useState<FinanceiroKpis | null>(null);
  const [comparativo, setComparativo] = useState<FinanceiroMes[] | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [carregandoPainel, setCarregandoPainel] = useState(false);
  const [erroLista, setErroLista] = useState("");
  const [erroPainel, setErroPainel] = useState("");
  const [aviso, setAviso] = useState("");
  const [erroAcao, setErroAcao] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [editando, setEditando] = useState<number | null>(null);
  const [formulario, setFormulario] = useState<RegistroFinanceiroPayload>({ ...vazio });
  const [modalRegistro, setModalRegistro] = useState(false);
  const [modalImportacao, setModalImportacao] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [resultadoImportacao, setResultadoImportacao] = useState<ResultadoImportacaoFinanceiro | null>(null);
  const [excluindo, setExcluindo] = useState<RegistroFinanceiro | null>(null);

  const carregarLista = useCallback(async (numero: number) => {
    setCarregando(true);
    setErroLista("");
    try {
      const resposta = await listarFinanceiros(numero);
      setPagina(resposta);
      // A última página pode desaparecer após uma exclusão.
      if (numero > 0 && numero >= resposta.totalPages) setPaginaAtual(Math.max(0, resposta.totalPages - 1));
    } catch (erro) {
      setPagina(null);
      setErroLista(mensagemErro(erro));
    } finally {
      setCarregando(false);
    }
  }, []);

  const carregarPainel = useCallback(async () => {
    setCarregandoPainel(true);
    setErroPainel("");
    const [resultadoKpis, resultadoComparativo] = await Promise.allSettled([
      obterKpisFinanceiros(), obterComparativoFinanceiro(6),
    ]);
    setKpis(resultadoKpis.status === "fulfilled" ? resultadoKpis.value : null);
    setComparativo(resultadoComparativo.status === "fulfilled" ? resultadoComparativo.value : null);
    if (resultadoKpis.status === "rejected" || resultadoComparativo.status === "rejected") {
      setErroPainel(mensagemErro(resultadoKpis.status === "rejected" ? resultadoKpis.reason : resultadoComparativo.status === "rejected" ? resultadoComparativo.reason : null));
    }
    setCarregandoPainel(false);
  }, []);

  useEffect(() => { void carregarPainel(); }, [carregarPainel]);
  useEffect(() => { void carregarLista(paginaAtual); }, [carregarLista, paginaAtual]);

  function alterar<K extends keyof RegistroFinanceiroPayload>(chave: K, valor: RegistroFinanceiroPayload[K]) {
    setFormulario(atual => ({ ...atual, [chave]: valor }));
  }

  function abrirRegistro(registro?: RegistroFinanceiro) {
    setEditando(registro?.id ?? null);
    setFormulario(registro ? {
      descricao: registro.descricao ?? "", quantidade: registro.quantidade, valor: registro.valor,
      frete: registro.frete, valorTotal: registro.valorTotal, valorFinalDesconto: registro.valorFinalDesconto,
      valorEntrada: registro.valorEntrada, receberEntrega: registro.receberEntrega,
      valorRecebidoFinal: registro.valorRecebidoFinal, valorTotalLiquido: registro.valorTotalLiquido,
      dataPedido: registro.dataPedido, dataEntrega: registro.dataEntrega,
      contatoCliente: registro.contatoCliente, regiaoVenda: registro.regiaoVenda,
    } : { ...vazio, dataPedido: new Date().toLocaleDateString("en-CA") });
    setErroAcao("");
    setModalRegistro(true);
  }

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setOcupado(true);
    setErroAcao("");
    try {
      const dados = { ...formulario, dataPedido: formulario.dataPedido || null };
      if (editando !== null) await atualizarFinanceiro(editando, dados);
      else await criarFinanceiro(dados);
      setModalRegistro(false);
      setAviso(editando !== null ? "Registro atualizado com sucesso." : "Registro criado com sucesso.");
      if (paginaAtual !== 0) setPaginaAtual(0);
      else void carregarLista(0);
      void carregarPainel();
    } catch (erro) {
      setErroAcao(mensagemErro(erro));
    } finally {
      setOcupado(false);
    }
  }

  async function confirmarExclusao() {
    if (!excluindo) return;
    setOcupado(true);
    setErroAcao("");
    try {
      await excluirFinanceiro(excluindo.id);
      setExcluindo(null);
      setAviso("Registro excluído com sucesso.");
      void carregarLista(paginaAtual);
      void carregarPainel();
    } catch (erro) {
      setErroAcao(mensagemErro(erro));
    } finally {
      setOcupado(false);
    }
  }

  async function exportar() {
    setOcupado(true);
    setErroAcao("");
    try { await exportarFinanceiro(); }
    catch (erro) { setErroAcao(mensagemErro(erro)); }
    finally { setOcupado(false); }
  }

  async function importar(evento: FormEvent) {
    evento.preventDefault();
    if (!arquivo) return;
    if (!arquivo.name.toLowerCase().endsWith(".xlsx")) {
      setErroAcao("Selecione uma planilha .xlsx.");
      return;
    }
    setOcupado(true);
    setErroAcao("");
    try {
      const resultado = await importarFinanceiro(arquivo);
      setResultadoImportacao(resultado);
      setAviso(`Importação concluída: ${resultado.totalImportado} de ${resultado.totalLinhasProcessadas} linhas importadas.`);
      if (paginaAtual !== 0) setPaginaAtual(0);
      else void carregarLista(0);
      void carregarPainel();
    } catch (erro) {
      setErroAcao(mensagemErro(erro));
    } finally {
      setOcupado(false);
    }
  }

  const maximo = Math.max(1, ...(comparativo ?? []).flatMap(mes => [Number(mes.receitas), Number(mes.despesas)].filter(Number.isFinite)));
  const mesAtual = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date());
  const soma = (chave: "receitas" | "despesas") => (comparativo ?? []).reduce((total, mes) => total + (Number(mes[chave]) || 0), 0);
  const mesAnterior = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1));
  const variacao = (valor: ValorMonetario) => `${Number(valor) > 0 ? "+" : ""}${percentual.format(Number(valor))}% vs. ${mesAnterior}`;
  const ticks = Array.from({ length: 5 }, (_, indice) => maximo * (4 - indice) / 4);

  return <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="font-display text-2xl font-semibold text-bw-preto">Controle Financeiro</h1>
        <p className="mt-1 text-sm text-bw-madeira">Visão de {mesAtual} · pedidos e recebimentos</p></div>
      <div className="flex flex-wrap gap-2">
        <button className="rounded border border-bw-border px-3 py-2 text-xs text-bw-preto hover:bg-bw-white disabled:opacity-50" disabled={ocupado} onClick={() => { void carregarPainel(); void carregarLista(paginaAtual); }}>Atualizar</button>
        <button className="rounded border border-bw-dourado px-3 py-2 text-xs text-bw-madeira hover:bg-bw-white disabled:opacity-50" disabled={ocupado} onClick={() => void exportar()}>Exportar Excel</button>
        <button className="rounded border border-bw-dourado px-3 py-2 text-xs text-bw-madeira hover:bg-bw-white" onClick={() => { setArquivo(null); setResultadoImportacao(null); setErroAcao(""); setModalImportacao(true); }}>Importar Excel</button>
        <button className="rounded bg-bw-dourado px-3 py-2 text-xs text-white hover:bg-bw-madeira" onClick={() => abrirRegistro()}>+ Novo registro</button>
      </div>
    </div>

    {aviso && <div role="status" className="rounded border border-bw-dourado bg-bw-white p-3 text-xs text-bw-madeira">{aviso} <button className="ml-2 underline" onClick={() => setAviso("")}>Dispensar</button></div>}
    {erroAcao && !modalRegistro && !modalImportacao && !excluindo && <p role="alert" className="text-sm text-red-700">{erroAcao}</p>}
    {erroPainel && <div role="alert" className="text-sm text-red-700">{erroPainel} <button className="underline" onClick={() => void carregarPainel()}>Tentar novamente</button></div>}
    <div className="grid gap-4 sm:grid-cols-3">
      <Cartao titulo="Recebido no mês" valor={kpis ? moeda(kpis.receitasMes) : carregandoPainel ? "Carregando..." : "—"} detalhe={kpis ? variacao(kpis.variacaoReceitasPercentual) : undefined} />
      <Cartao titulo="Frete no mês" valor={kpis ? moeda(kpis.despesasMes) : carregandoPainel ? "Carregando..." : "—"} detalhe={kpis ? variacao(kpis.variacaoDespesasPercentual) : undefined} />
      <Cartao titulo="Recebido menos frete" valor={kpis ? moeda(kpis.resultadoLiquido) : carregandoPainel ? "Carregando..." : "—"} detalhe={kpis ? `Margem sobre recebimentos: ${percentual.format(Number(kpis.margemPercentual))}%` : undefined} destaque />
    </div>
    <p className="rounded-lg border border-bw-border-sub bg-bw-white/70 px-4 py-3 text-sm leading-relaxed text-bw-madeira"><strong>Como ler:</strong> recebido é a soma do valor recebido final; frete é o único custo considerado. Os números usam a data do pedido. O saldo não representa o lucro total.</p>
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Seções financeiras">
      {([ ["resumo", "Resumo"], ["registros", "Registros"], ["metricas", "Métricas"] ] as const).map(([valor, texto]) =>
        <button key={valor} role="tab" aria-selected={aba === valor} className={`rounded border px-3 py-1.5 text-xs ${aba === valor ? "border-bw-dourado bg-bw-dourado text-white" : "border-bw-border text-bw-madeira hover:bg-bw-white"}`} onClick={() => setAba(valor)}>{texto}</button>
      )}
    </div>

    {aba === "resumo" && <section className="rounded-xl border border-bw-border bg-bw-white p-5 shadow-sm sm:p-7" aria-label="Comparativo financeiro mensal">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="font-display text-2xl font-semibold text-bw-preto">Evolução dos recebimentos</h2>
          <p className="mt-1 text-sm text-bw-madeira">Comparativo com frete nos últimos seis meses</p></div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-bw-preto">
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-bw-dourado" />Recebido</span>
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-bw-madeira" />Frete</span>
        </div>
      </div>
      {carregandoPainel && !comparativo ? <p className="text-sm text-bw-muted">Carregando gráfico...</p> : comparativo?.length ? <>
        <div className="grid min-w-0 grid-cols-[44px_minmax(0,1fr)] gap-2 sm:grid-cols-[76px_minmax(0,1fr)] sm:gap-3">
            <div className="flex h-52 flex-col justify-between pb-1 text-right text-[10px] text-bw-madeira sm:h-72 sm:text-xs" aria-hidden="true">
              {ticks.map((tick, indice) => <span key={indice}>{new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(tick)}</span>)}
            </div>
            <div className="relative h-52 min-w-0 border-b border-bw-border sm:h-72">
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between" aria-hidden="true">
                {ticks.map((_, indice) => <div key={indice} className="border-t border-dashed border-bw-border-sub" />)}
              </div>
              <div className="relative z-10 flex h-full items-end">
                {comparativo.map(mes => <div key={mes.mes} className="flex h-full min-w-0 flex-1 items-end justify-center gap-0.5 px-0.5 sm:gap-2 sm:px-3">
                  {([ ["receitas", "bg-bw-dourado", "Recebido"], ["despesas", "bg-bw-madeira", "Frete"] ] as const).map(([chave, cor, nome]) => <div key={chave} tabIndex={0} role="img" aria-label={`${nome} em ${mes.mes}: ${moeda(mes[chave])}`} title={`${nome}: ${moeda(mes[chave])}`} className={`group relative w-full max-w-12 rounded-t-md ${cor} outline-offset-2 hover:brightness-90 focus:outline-2 focus:outline-bw-preto`} style={{ height: `${Math.max(Number(mes[chave]) > 0 ? 2 : 0, Math.min(100, Number(mes[chave]) / maximo * 100))}%` }}>
                    <span aria-hidden="true" className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-bw-preto px-2 py-1 text-xs text-white shadow-lg group-hover:block group-focus:block">{nome}: {moeda(mes[chave])}</span>
                  </div>)}
                </div>)}
              </div>
            </div>
            <div />
            <div className="flex">{comparativo.map(mes => <span key={mes.mes} className="min-w-0 flex-1 text-center text-[10px] font-medium capitalize text-bw-madeira sm:text-xs">{new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(new Date(`${mes.mes}-01T12:00:00`)).replace(".", "")}</span>)}</div>
        </div>
        <div className="mt-5 grid gap-3 border-t border-bw-border-sub pt-5 sm:grid-cols-3">
          <div><p className="text-sm text-bw-madeira">Recebido no período</p><p className="mt-1 text-xl font-semibold tabular-nums text-bw-preto">{moeda(soma("receitas"))}</p></div>
          <div><p className="text-sm text-bw-madeira">Frete no período</p><p className="mt-1 text-xl font-semibold tabular-nums text-bw-preto">{moeda(soma("despesas"))}</p></div>
          <div><p className="text-sm text-bw-madeira">Recebido menos frete</p><p className="mt-1 text-xl font-semibold tabular-nums text-bw-preto">{moeda(soma("receitas") - soma("despesas"))}</p></div>
        </div>
      </> : !erroPainel && <p className="text-sm text-bw-muted">Não há dados para o comparativo.</p>}
    </section>}

    {aba === "metricas" && <div className="grid gap-3 sm:grid-cols-2">
      <Cartao titulo="Margem do mês" valor={kpis ? `${percentual.format(Number(kpis.margemPercentual))}%` : "—"} detalhe="Resultado líquido ÷ receitas" />
      <Cartao titulo="Variação das receitas" valor={kpis ? `${percentual.format(Number(kpis.variacaoReceitasPercentual))}%` : "—"} detalhe="Em relação ao mês anterior" />
      <Cartao titulo="Variação do frete" valor={kpis ? `${percentual.format(Number(kpis.variacaoDespesasPercentual))}%` : "—"} detalhe="Em relação ao mês anterior" />
      <Cartao titulo="Saldo no período" valor={comparativo ? moeda(soma("receitas") - soma("despesas")) : "—"} detalhe="Receitas menos frete nos últimos 6 meses" />
    </div>}

    {aba === "registros" && <section className="rounded-lg border border-bw-border bg-bw-white" aria-label="Registros financeiros">
      <div className="flex flex-wrap justify-between gap-2 p-4"><h2 className="font-display text-lg font-semibold">Pedidos financeiros</h2><span className="font-mono text-xs text-bw-muted">{pagina?.totalElements ?? 0} registros</span></div>
      {erroLista && <p role="alert" className="px-4 pb-3 text-sm text-red-700">{erroLista} <button className="underline" onClick={() => void carregarLista(paginaAtual)}>Tentar novamente</button></p>}
      {carregando ? <p className="p-4 text-sm text-bw-muted">Carregando registros...</p> : pagina?.content.length ? <div className="overflow-x-auto"><table className="w-full min-w-[750px] text-left text-xs">
        <thead className="bg-bw-areia font-mono uppercase tracking-wider text-bw-muted"><tr>{["Descrição / cliente", "Pedido", "Qtd.", "Valor total", "Recebido", "Frete", "Ações"].map(t => <th key={t} className="px-3 py-3">{t}</th>)}</tr></thead>
        <tbody>{pagina.content.map(registro => <tr key={registro.id} className="border-t border-bw-border hover:bg-bw-areia/50">
          <td className="px-3 py-3"><strong className="font-medium text-bw-preto">{registro.descricao || "Sem descrição"}</strong><span className="block text-bw-muted">{registro.contatoCliente || "Cliente não informado"}</span></td>
          <td className="px-3 py-3 font-mono">{dataLocal(registro.dataPedido)}</td><td className="px-3 py-3 font-mono">{registro.quantidade}</td>
          <td className="px-3 py-3 font-mono">{moeda(registro.valorTotal)}</td><td className="px-3 py-3 font-mono">{moeda(registro.valorRecebidoFinal)}</td><td className="px-3 py-3 font-mono">{moeda(registro.frete)}</td>
          <td className="whitespace-nowrap px-3 py-3"><div className="flex items-center gap-2"><button type="button" className="text-bw-madeira underline disabled:opacity-40" disabled={ocupado} onClick={() => abrirRegistro(registro)}>Editar</button><DeleteButton onClick={() => { setErroAcao(""); setExcluindo(registro); }} disabled={ocupado} title="Excluir registro" aria-label={`Excluir ${registro.descricao || `registro #${registro.id}`}`} /></div></td>
        </tr>)}</tbody>
      </table></div> : !erroLista && <p className="p-4 text-sm text-bw-muted">Nenhum registro encontrado. Cadastre um pedido ou importe uma planilha.</p>}
      {pagina && pagina.totalPages > 1 && <div className="flex items-center justify-between gap-3 border-t border-bw-border p-4 font-mono text-xs text-bw-madeira">
        <button className="underline disabled:opacity-40" disabled={carregando || paginaAtual === 0} onClick={() => setPaginaAtual(p => p - 1)}>Anterior</button>
        <span>Página {pagina.number + 1} de {pagina.totalPages}</span>
        <button className="underline disabled:opacity-40" disabled={carregando || paginaAtual >= pagina.totalPages - 1} onClick={() => setPaginaAtual(p => p + 1)}>Próxima</button>
      </div>}
    </section>}

    {modalRegistro && <div className="fixed inset-0 z-50 flex items-center justify-center bg-bw-preto/70 p-4"><div role="dialog" aria-modal="true" aria-labelledby="titulo-registro" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-bw-dourado/30 bg-bw-preto p-6 shadow-2xl">
      <div className="mb-5 flex items-start justify-between"><div><h2 id="titulo-registro" className="font-display text-2xl text-bw-white">{editando !== null ? "Editar pedido" : "Novo pedido financeiro"}</h2><p className="font-mono text-xs text-bw-areia">Valores de pedidos e recebimentos</p></div><button className="text-xs text-bw-areia underline" disabled={ocupado} onClick={() => setModalRegistro(false)}>Fechar</button></div>
      <form onSubmit={e => void salvar(e)} className="grid gap-5 sm:grid-cols-2">
        <label className={`${label} sm:col-span-2`}>Descrição<input className={input} value={formulario.descricao ?? ""} onChange={e => alterar("descricao", e.target.value)} placeholder="Ex.: Projeto cozinha planejada" /></label>
        <CampoNumero titulo="Quantidade *" inteiro obrigatorio valor={formulario.quantidade} onChange={v => alterar("quantidade", v ?? 0)} />
        <CampoNumero titulo="Valor unitário (R$) *" obrigatorio valor={formulario.valor} onChange={v => alterar("valor", v ?? 0)} />
        <CampoNumero titulo="Frete (R$) *" obrigatorio valor={formulario.frete} onChange={v => alterar("frete", v ?? 0)} />
        <CampoNumero titulo="Valor total (R$) *" obrigatorio valor={formulario.valorTotal} onChange={v => alterar("valorTotal", v ?? 0)} />
        <CampoNumero titulo="Valor final com desconto (R$)" valor={formulario.valorFinalDesconto} onChange={v => alterar("valorFinalDesconto", v)} />
        <CampoNumero titulo="Valor de entrada (R$)" valor={formulario.valorEntrada} onChange={v => alterar("valorEntrada", v)} />
        <CampoNumero titulo="A receber na entrega (R$)" valor={formulario.receberEntrega} onChange={v => alterar("receberEntrega", v)} />
        <CampoNumero titulo="Valor recebido final (R$)" valor={formulario.valorRecebidoFinal} onChange={v => alterar("valorRecebidoFinal", v)} />
        <CampoNumero titulo="Valor total líquido (R$)" valor={formulario.valorTotalLiquido} onChange={v => alterar("valorTotalLiquido", v)} />
        <label className={label}>Data do pedido<input type="date" className={input} value={formulario.dataPedido ?? ""} onChange={e => alterar("dataPedido", e.target.value || null)} /></label>
        <label className={label}>Data da entrega<input type="date" className={input} value={formulario.dataEntrega ?? ""} onChange={e => alterar("dataEntrega", e.target.value || null)} /></label>
        <label className={label}>Contato do cliente<input maxLength={100} className={input} value={formulario.contatoCliente ?? ""} onChange={e => alterar("contatoCliente", e.target.value)} /></label>
        <label className={label}>Região da venda<input maxLength={100} className={input} value={formulario.regiaoVenda ?? ""} onChange={e => alterar("regiaoVenda", e.target.value)} /></label>
        <p className="text-xs text-bw-areia sm:col-span-2">* Campos obrigatórios. Os totais não são calculados automaticamente pelo backend. Apenas pedidos com data e valor recebido final entram na receita dos indicadores.</p>
        {erroAcao && <p role="alert" className="text-sm text-red-300 sm:col-span-2">{erroAcao}</p>}
        <button className="bg-bw-dourado px-4 py-3 text-xs font-semibold uppercase text-bw-preto disabled:opacity-50 sm:col-span-2" disabled={ocupado} type="submit">{ocupado ? "Salvando..." : "Salvar registro"}</button>
      </form>
    </div></div>}

    {modalImportacao && <div className="fixed inset-0 z-50 flex items-center justify-center bg-bw-preto/70 p-4"><div role="dialog" aria-modal="true" aria-labelledby="titulo-importar" className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-bw-dourado/30 bg-bw-preto p-6 shadow-2xl">
      <div className="flex justify-between"><h2 id="titulo-importar" className="font-display text-2xl text-bw-white">Importar Excel</h2><button className="text-xs text-bw-areia underline" disabled={ocupado} onClick={() => setModalImportacao(false)}>Fechar</button></div>
      <p className="my-4 text-xs text-bw-areia">Selecione uma planilha .xlsx no formato da exportação financeira. Obrigatórios por linha: Quantidade, Valor, Frete e Valor Total. A importação cria novos registros; linhas inválidas são informadas abaixo.</p>
      <form onSubmit={e => void importar(e)} className="flex flex-col gap-4"><label className={label}>Planilha Excel<input className={`${input} file:mr-3 file:border-0 file:bg-bw-areia file:p-2 file:text-bw-preto`} type="file" accept=".xlsx" required onChange={(e: ChangeEvent<HTMLInputElement>) => { setArquivo(e.target.files?.[0] ?? null); setResultadoImportacao(null); }} /></label>
        {erroAcao && <p role="alert" className="text-sm text-red-300">{erroAcao}</p>}
        <button type="submit" disabled={ocupado || !arquivo} className="bg-bw-dourado px-4 py-3 text-xs font-semibold uppercase text-bw-preto disabled:opacity-50">{ocupado ? "Importando..." : "Iniciar importação"}</button></form>
      {resultadoImportacao && <div role="status" className="mt-4 border-t border-bw-dourado/30 pt-3 text-xs text-bw-white"><p>{resultadoImportacao.totalImportado} de {resultadoImportacao.totalLinhasProcessadas} linhas importadas.</p>{resultadoImportacao.erros.length > 0 && <><p className="mt-2 text-bw-areia">Erros por linha:</p><ul className="list-inside list-disc">{resultadoImportacao.erros.map((erro, indice) => <li key={indice}>{erro}</li>)}</ul></>}</div>}
    </div></div>}

    {excluindo && <ConfirmDeleteModal
      title="Excluir registro financeiro?"
      itemName={excluindo.descricao || `Registro #${excluindo.id}`}
      description="O pedido financeiro será excluído permanentemente. Esta ação não pode ser desfeita."
      loading={ocupado}
      error={erroAcao}
      onCancel={() => { setExcluindo(null); setErroAcao(""); }}
      onConfirm={() => void confirmarExclusao()}
    />}
  </div>;
}
