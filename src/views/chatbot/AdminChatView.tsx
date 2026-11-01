import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  enviarMensagemAdmin, listarConversas, listarMensagensAdmin, marcarMensagensAdminLidas,
  obterResumoAtendimento, type ConversaChat, type MensagemChat, type ResumoAtendimento,
} from "@/api/chat";
import { erroChat, horaChat, juntarMensagens } from "./chatUtils";

const INTERVALO_ATUALIZACAO = 5000;
const iniciais = (nome: string) => nome.split(/\s+/).slice(0, 2).map(parte => parte[0]).join("").toUpperCase();

export default function AdminChatView() {
  const [conversas, setConversas] = useState<ConversaChat[]>([]);
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [resumo, setResumo] = useState<ResumoAtendimento | null>(null);
  const [rascunho, setRascunho] = useState("");
  const [carregandoLista, setCarregandoLista] = useState(true);
  const [carregandoChat, setCarregandoChat] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroLista, setErroLista] = useState("");
  const [erroMensagens, setErroMensagens] = useState("");
  const [erroResumo, setErroResumo] = useState("");
  const [erroEnvio, setErroEnvio] = useState("");
  const ativoRef = useRef<number | null>(null);
  const maiorIdRef = useRef(0);
  const requisicaoRef = useRef(0);
  const enviandoRef = useRef(false);
  const fimRef = useRef<HTMLDivElement>(null);

  const carregarConversas = useCallback(async (inicial = false) => {
    try {
      if (inicial) setCarregandoLista(true);
      const lista = await listarConversas();
      setConversas(lista);
      setErroLista("");
      setClienteId(atual => atual !== null && lista.some(item => item.clienteId === atual) ? atual : lista[0]?.clienteId ?? null);
    } catch (erro) {
      setErroLista(erroChat(erro, "Não foi possível carregar as conversas."));
    } finally {
      if (inicial) setCarregandoLista(false);
    }
  }, []);

  useEffect(() => {
    void carregarConversas(true);
    const intervalo = window.setInterval(() => { void carregarConversas(); }, INTERVALO_ATUALIZACAO);
    return () => { window.clearInterval(intervalo); requisicaoRef.current++; ativoRef.current = null; };
  }, [carregarConversas]);

  useEffect(() => {
    ativoRef.current = clienteId;
    const requisicao = ++requisicaoRef.current;
    maiorIdRef.current = 0;
    setMensagens([]);
    setResumo(null);
    setErroMensagens("");
    setErroResumo("");
    setErroEnvio("");
    setRascunho("");
    if (clienteId === null) { setCarregandoChat(false); return; }
    setCarregandoChat(true);

    const carregar = async () => {
      try {
        const historico = await listarMensagensAdmin(clienteId);
        if (requisicao !== requisicaoRef.current) return;
        setMensagens(historico);
        maiorIdRef.current = Math.max(0, ...historico.map(mensagem => mensagem.id));
        setErroMensagens("");
        try {
          await marcarMensagensAdminLidas(clienteId);
          if (requisicao === requisicaoRef.current) void carregarConversas();
        } catch { /* A falha de leitura não impede a exibição do histórico. */ }
      } catch (erro) {
        if (requisicao === requisicaoRef.current) setErroMensagens(erroChat(erro, "Não foi possível carregar as mensagens."));
      } finally {
        if (requisicao === requisicaoRef.current) setCarregandoChat(false);
      }
    };
    const carregarResumo = async () => {
      try {
        const dados = await obterResumoAtendimento(clienteId);
        if (requisicao === requisicaoRef.current) setResumo(dados);
      } catch (erro) {
        if (requisicao !== requisicaoRef.current) return;
        const status = (erro as { response?: { status?: number } })?.response?.status;
        if (status !== 404) setErroResumo(erroChat(erro, "Não foi possível carregar o resumo."));
      }
    };
    void carregar();
    void carregarResumo();
    return () => { requisicaoRef.current++; };
  }, [clienteId, carregarConversas]);

  useEffect(() => {
    if (clienteId === null || carregandoChat || erroMensagens) return;
    let emAndamento = false;
    const intervalo = window.setInterval(async () => {
      if (emAndamento || ativoRef.current !== clienteId) return;
      emAndamento = true;
      try {
        const novas = await listarMensagensAdmin(clienteId, maiorIdRef.current);
        if (ativoRef.current !== clienteId || !novas.length) return;
        maiorIdRef.current = Math.max(maiorIdRef.current, ...novas.map(mensagem => mensagem.id));
        setMensagens(atuais => juntarMensagens(atuais, novas));
        if (novas.some(mensagem => mensagem.remetente === "CLIENTE")) {
          await marcarMensagensAdminLidas(clienteId);
          if (ativoRef.current === clienteId) void carregarConversas();
        }
        setErroMensagens("");
      } catch (erro) {
        if (ativoRef.current === clienteId) setErroMensagens(erroChat(erro, "Falha ao atualizar as mensagens. Tente novamente."));
      } finally { emAndamento = false; }
    }, INTERVALO_ATUALIZACAO);
    return () => window.clearInterval(intervalo);
  }, [clienteId, carregandoChat, erroMensagens, carregarConversas]);

  useEffect(() => { fimRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [mensagens]);

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    const conteudo = rascunho.trim();
    if (!conteudo || enviandoRef.current || clienteId === null) return;
    if (conteudo.length > 2000) { setErroEnvio("A mensagem deve ter no máximo 2.000 caracteres."); return; }
    enviandoRef.current = true;
    setEnviando(true);
    setErroEnvio("");
    try {
      const mensagem = await enviarMensagemAdmin(clienteId, conteudo);
      if (ativoRef.current !== clienteId) return;
      maiorIdRef.current = Math.max(maiorIdRef.current, mensagem.id);
      setMensagens(atuais => juntarMensagens(atuais, [mensagem]));
      setRascunho(atual => atual.trim() === conteudo ? "" : atual);
      void carregarConversas();
    } catch (erro) {
      if (ativoRef.current === clienteId) setErroEnvio(erroChat(erro, "Não foi possível enviar a mensagem."));
    } finally { enviandoRef.current = false; setEnviando(false); }
  };

  const conversa = conversas.find(item => item.clienteId === clienteId);
  return (
    <div className="flex h-[calc(100svh-9.5rem)] min-h-[32rem] flex-col overflow-hidden rounded-lg border border-bw-border sm:h-[calc(100vh-8rem)] sm:min-h-0 sm:flex-row">
      <aside className="flex h-40 w-full flex-shrink-0 flex-col border-b border-bw-border bg-bw-areia sm:h-auto sm:w-64 sm:border-b-0 sm:border-r" aria-label="Conversas com clientes">
        <div className="border-b border-bw-border bg-bw-preto p-3">
          <h2 className="px-1 font-display text-lg text-bw-white">Mensagens</h2>
          <p className="px-1 font-mono text-[10px] uppercase tracking-wider text-bw-dourado">Leads & Clientes</p>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {carregandoLista && <p className="p-3 text-xs text-bw-muted" role="status">Carregando conversas...</p>}
          {erroLista && <div className="p-3 text-xs text-red-700" role="alert">{erroLista} <button className="underline" onClick={() => void carregarConversas(true)}>Tentar novamente</button></div>}
          {!carregandoLista && !erroLista && conversas.length === 0 && <p className="p-3 text-xs text-bw-muted">Nenhuma conversa iniciada.</p>}
          {conversas.map(item => (
            <button key={item.clienteId} type="button" onClick={() => setClienteId(item.clienteId)} aria-current={clienteId === item.clienteId ? "true" : undefined}
              className={`mb-1 w-full rounded-md px-3 py-3 text-left transition-colors ${clienteId === item.clienteId ? "bg-bw-preto text-bw-white shadow-md" : "text-bw-preto hover:bg-bw-white"}`}>
              <span className="flex items-center gap-2 text-xs font-semibold"><span className={`h-2 w-2 flex-shrink-0 rounded-full ${clienteId === item.clienteId ? "bg-bw-dourado" : "bg-bw-madeira/40"}`} /><span className="flex-1 truncate">{item.nomeCliente}</span>{item.naoLidas > 0 && <span className="rounded-full bg-bw-dourado px-1.5 font-mono text-[10px] text-bw-preto" aria-label={`${item.naoLidas} mensagens não lidas`}>{item.naoLidas}</span>}</span>
              <span className={`mt-1 block truncate text-[10px] ${clienteId === item.clienteId ? "text-bw-areia" : "text-bw-muted"}`}>{item.ultimaMensagem}</span>
              <span className="mt-1 block font-mono text-[9px] text-bw-dourado">{horaChat(item.ultimaMensagemEm)}</span>
            </button>
          ))}
        </div>
      </aside>
      <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-bw-white" aria-label="Atendimento do cliente">
        <div className="border-b border-bw-border px-4 py-3 shadow-sm sm:px-6 sm:py-4">
          <div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-bw-preto font-mono text-[10px] font-bold text-bw-white">{conversa ? iniciais(conversa.nomeCliente) : "—"}</span>
            <div><h2 className="text-sm font-semibold text-bw-preto">{conversa?.nomeCliente ?? "Selecione uma conversa"}</h2><p className="font-mono text-[10px] text-bw-dourado">Atendimento BW</p></div>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-[#faf9f8] p-3 sm:gap-6 sm:p-6" aria-live="polite">
          {carregandoChat && <p className="text-xs text-bw-muted" role="status">Carregando mensagens...</p>}
          {erroMensagens && <p className="text-xs text-red-700" role="alert">{erroMensagens} <button className="underline" onClick={() => { const id = clienteId; setClienteId(null); window.setTimeout(() => setClienteId(id), 0); }}>Tentar novamente</button></p>}
          {erroResumo && <p className="text-xs text-red-700" role="alert">{erroResumo}</p>}
          {resumo?.resumo && <div className="mb-4 w-full max-w-2xl self-center rounded-xl border border-bw-dourado/30 bg-bw-preto/95 p-4 shadow-lg">
            <h3 className="mb-2 font-mono text-[9px] uppercase tracking-widest text-bw-dourado">Resumo do atendimento</h3><p className="whitespace-pre-wrap text-xs leading-relaxed text-bw-areia">{resumo.resumo}</p>
          </div>}
          {!carregandoChat && !erroMensagens && clienteId !== null && !mensagens.length && <p className="text-center text-xs text-bw-muted">Ainda não há mensagens nesta conversa.</p>}
          {mensagens.map(mensagem => <div key={mensagem.id} className={`flex ${mensagem.remetente === "ADMIN" ? "justify-end" : "justify-start"}`}>
            {mensagem.remetente === "CLIENTE" && <span className="mr-3 mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-bw-border bg-bw-areia text-[8px] font-bold text-bw-madeira">{conversa ? iniciais(conversa.nomeCliente) : ""}</span>}
            <div className={`flex max-w-[85%] flex-col ${mensagem.remetente === "ADMIN" ? "items-end" : "items-start"}`}><p className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${mensagem.remetente === "ADMIN" ? "rounded-tr-sm bg-bw-preto text-bw-white" : "rounded-tl-sm border border-bw-border bg-bw-white text-bw-preto shadow-sm"}`}>{mensagem.conteudo}</p><span className="mx-1 mt-1 font-mono text-[9px] text-bw-muted">{horaChat(mensagem.criadoEm)}</span></div>
          </div>)}
          <div ref={fimRef} />
        </div>
        <form onSubmit={evento => void enviar(evento)} className="border-t border-bw-border bg-bw-white p-3 sm:p-4">
          {erroEnvio && <p className="mb-2 text-xs text-red-700" role="alert">{erroEnvio}</p>}
          <div className="flex items-center gap-2 rounded-lg border border-bw-dourado/40 bg-bw-white px-4 py-2 focus-within:border-bw-dourado">
            <input aria-label="Mensagem para o cliente" value={rascunho} onChange={evento => setRascunho(evento.target.value)} disabled={clienteId === null || carregandoChat} maxLength={2000} placeholder="Digite sua mensagem para o cliente..." className="min-w-0 flex-1 bg-transparent text-sm text-bw-preto placeholder-bw-ph focus:outline-none" />
            <button type="submit" aria-label="Enviar mensagem" disabled={!rascunho.trim() || enviando || clienteId === null || carregandoChat} className="rounded-md bg-bw-preto px-3 py-2 text-xs text-bw-dourado hover:bg-bw-dourado hover:text-bw-preto disabled:cursor-not-allowed disabled:opacity-40">{enviando ? "Enviando..." : "Enviar"}</button>
          </div><p className="mt-1 text-right font-mono text-[9px] text-bw-muted">{rascunho.length}/2000</p>
        </form>
      </section>
    </div>
  );
}
