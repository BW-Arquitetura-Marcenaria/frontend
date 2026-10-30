import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { enviarMensagemCliente, listarMensagensCliente, marcarMensagensClienteLidas, type MensagemChat } from "@/api/chat";
import { erroChat, horaChat, juntarMensagens } from "./chatUtils";

export default function ClienteChatView() {
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [rascunho, setRascunho] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erroLeitura, setErroLeitura] = useState("");
  const [erroEnvio, setErroEnvio] = useState("");
  const maiorIdRef = useRef(0);
  const enviandoRef = useRef(false);
  const fimRef = useRef<HTMLDivElement>(null);

  const carregar = useCallback(async (inicial = false) => {
    try {
      if (inicial) setCarregando(true);
      const novas = await listarMensagensCliente(inicial ? 0 : maiorIdRef.current);
      if (novas.length) {
        maiorIdRef.current = Math.max(maiorIdRef.current, ...novas.map(mensagem => mensagem.id));
        setMensagens(atuais => juntarMensagens(inicial ? [] : atuais, novas));
        if (novas.some(mensagem => mensagem.remetente === "ADMIN")) await marcarMensagensClienteLidas();
      }
      setErroLeitura("");
    } catch (erro) {
      setErroLeitura(erroChat(erro, "Não foi possível atualizar as mensagens."));
    } finally { if (inicial) setCarregando(false); }
  }, []);

  useEffect(() => {
    void carregar(true);
    const intervalo = window.setInterval(() => { void carregar(); }, 5000);
    return () => window.clearInterval(intervalo);
  }, [carregar]);
  useEffect(() => { fimRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [mensagens]);

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    const conteudo = rascunho.trim();
    if (!conteudo || enviandoRef.current) return;
    if (conteudo.length > 2000) { setErroEnvio("A mensagem deve ter no máximo 2.000 caracteres."); return; }
    enviandoRef.current = true;
    setEnviando(true);
    setErroEnvio("");
    try {
      const mensagem = await enviarMensagemCliente(conteudo);
      maiorIdRef.current = Math.max(maiorIdRef.current, mensagem.id);
      setMensagens(atuais => juntarMensagens(atuais, [mensagem]));
      setRascunho(atual => atual.trim() === conteudo ? "" : atual);
    } catch (erro) {
      setErroEnvio(erroChat(erro, "Não foi possível enviar a mensagem."));
    } finally { enviandoRef.current = false; setEnviando(false); }
  };

  return <div className="flex h-full w-full flex-col rounded-sm border border-white/10 bg-[#16130f]/45 shadow-xl backdrop-blur-xl">
    <div className="flex items-center gap-4 border-b border-white/10 px-6 py-5">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-bw-dourado/30 bg-bw-dourado/10 text-bw-dourado" aria-hidden="true">BW</div>
      <div><h2 className="font-display text-base tracking-wide text-white">Equipe BW Arquitetura</h2><p className="mt-0.5 font-mono text-[9px] uppercase tracking-[.18em] text-white/40">Atendimento por mensagens</p></div>
    </div>
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-6" aria-live="polite">
      {carregando && <p className="text-xs text-white/50" role="status">Carregando mensagens...</p>}
      {erroLeitura && <p className="text-xs text-red-300" role="alert">{erroLeitura} <button className="underline" onClick={() => void carregar(true)}>Tentar novamente</button></p>}
      {!carregando && !erroLeitura && !mensagens.length && <p className="text-center text-xs text-white/50">Envie uma mensagem para começar a conversa com a equipe.</p>}
      {mensagens.map(mensagem => <div key={mensagem.id} className={`flex ${mensagem.remetente === "CLIENTE" ? "justify-end" : "justify-start"}`}>
        <div className={`flex max-w-[85%] flex-col ${mensagem.remetente === "CLIENTE" ? "items-end" : "items-start"}`}>
          <p className={`whitespace-pre-wrap break-words rounded-sm px-5 py-3.5 text-[13px] leading-relaxed ${mensagem.remetente === "CLIENTE" ? "bg-bw-dourado text-white" : "border border-white/10 bg-white/5 text-white/90"}`}>{mensagem.conteudo}</p>
          <span className="mt-1 font-mono text-[9px] text-white/40">{horaChat(mensagem.criadoEm)}</span>
        </div>
      </div>)}
      <div ref={fimRef} />
    </div>
    <form onSubmit={evento => void enviar(evento)} className="border-t border-white/10 bg-white/[.02] px-5 py-5">
      {erroEnvio && <p className="mb-2 text-xs text-red-300" role="alert">{erroEnvio}</p>}
      <div className="flex items-end gap-3"><input aria-label="Mensagem para a equipe BW" value={rascunho} onChange={evento => setRascunho(evento.target.value)} maxLength={2000} placeholder="Escreva sua mensagem…" className="min-w-0 flex-1 border-0 border-b border-white/20 bg-transparent py-2.5 text-[13px] text-white placeholder-white/30 transition-colors focus:border-bw-dourado focus:outline-none" />
        <button type="submit" aria-label="Enviar mensagem" disabled={enviando || !rascunho.trim()} className="flex h-10 flex-shrink-0 items-center justify-center border border-bw-dourado/40 bg-bw-dourado/10 px-3 text-xs text-bw-dourado transition-colors hover:bg-bw-dourado hover:text-white disabled:cursor-not-allowed disabled:opacity-40">{enviando ? "Enviando..." : "Enviar"}</button></div>
      <p className="mt-1 text-right font-mono text-[9px] text-white/40">{rascunho.length}/2000</p>
    </form>
  </div>;
}
