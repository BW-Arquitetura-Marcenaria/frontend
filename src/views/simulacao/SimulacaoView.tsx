import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  MATERIAIS,
  MODELOS,
  PUXADORES,
  TAMPOS,
  TIPOS_MODULO,
  encontrar,
  larguraLinha,
} from "@/models/Simulacao";
import type { TipoModulo } from "@/models/Simulacao";
import { gerarSvgProjeto } from "@/utils/desenhoMarcenaria";
import { useSimulacaoViewModel } from "@/viewmodels/simulacao/useSimulacaoViewModel";
import type { RascunhoRastreabilidade } from "@/views/rastreabilidade/RastreabilidadeView";

export type LeadSimulacaoOption = { id: number; nome: string; score?: number };

const LABEL_CLS =
  "block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#7C7367] mb-1";
const INPUT_CLS =
  "w-full rounded-lg border border-[#DDD6CA] bg-[#FAF8F4] px-2.5 py-2 text-xs text-[#1B1A18] focus:border-[#B08D57] focus:bg-white focus:outline-none";

function CampoMedida({
  label,
  value,
  min,
  max,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onCommit: (v: number) => void;
}) {
  const [texto, setTexto] = useState(String(value));

  useEffect(() => {
    setTexto(String(value));
  }, [value]);

  const confirmar = (bruto = texto) => {
    const num = Number(bruto);
    if (!Number.isFinite(num) || bruto.trim() === "") {
      setTexto(String(value));
      return;
    }
    const ajustado = Math.max(min, Math.min(max, Math.round(num)));
    setTexto(String(ajustado));
    if (ajustado !== value) onCommit(ajustado);
  };

  return (
    <div>
      <label className={LABEL_CLS}>{label}</label>
      <div className="flex items-center rounded-lg border border-[#DDD6CA] bg-[#FAF8F4] px-2.5 focus-within:border-[#B08D57] focus-within:bg-white">
        <input
          type="number"
          min={min}
          max={max}
          value={texto}
          onChange={(e) => {
            const val = e.target.value;
            setTexto(val);
            const n = Number(val);
            if (Number.isFinite(n) && n >= min && n <= max) {
              onCommit(Math.round(n));
            }
          }}
          onBlur={() => confirmar()}
          onKeyDown={(e) => {
            if (e.key === "Enter") confirmar();
          }}
          className="w-full bg-transparent py-2 text-xs font-medium text-[#1B1A18] focus:outline-none"
        />
        <span className="text-[11px] text-[#8C8275] ml-1">cm</span>
      </div>
    </div>
  );
}

export default function SimulacaoView({
  leads = [],
  onRegistrarRastreabilidade,
}: {
  leads?: LeadSimulacaoOption[];
  onRegistrarRastreabilidade?: (dados: RascunhoRastreabilidade) => void;
}) {
  const vm = useSimulacaoViewModel();
  const [aba, setAba] = useState<"projeto" | "salvos">("projeto");
  const [indicadorArrasto, setIndicadorArrasto] = useState<string | null>(null);
  const [editandoNome, setEditandoNome] = useState(false);
  const [nomeTemp, setNomeTemp] = useState("");
  const palcoRef = useRef<HTMLDivElement | null>(null);
  const paramsRef = useRef(vm.params);
  paramsRef.current = vm.params;

  const sel = vm.selecionado;
  const linhaSel = sel ? vm.params.linhas[sel.linhaIdx] : undefined;
  const modSel = linhaSel && sel ? linhaSel.modulos[sel.modIdx] : undefined;

  useEffect(() => {
    if (!sel || !linhaSel || !modSel || aba !== "projeto") return;
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.key === "Escape") {
        vm.setSelecionado(null);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        vm.removerModulo(sel.linhaIdx, sel.modIdx);
      } else if (e.key === "ArrowLeft" && linhaSel.tipo === "caixa") {
        e.preventDefault();
        vm.moverModulo(sel.linhaIdx, sel.modIdx, -1);
      } else if (e.key === "ArrowRight" && linhaSel.tipo === "caixa") {
        e.preventDefault();
        vm.moverModulo(sel.linhaIdx, sel.modIdx, 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [aba, linhaSel, modSel, sel, vm]);

  const iniciarInteracaoSvg = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || vm.modoVisualizacao === "foto") return;
    const target = e.target as Element | null;
    const svgEl = palcoRef.current?.querySelector("svg");
    if (!target || !svgEl) return;

    const vb = svgEl.viewBox.baseVal;
    const rect = svgEl.getBoundingClientRect();
    const pxPerCm =
      vb.width > 0 && vb.height > 0
        ? Math.min(rect.width / vb.width, rect.height / vb.height)
        : 1;
    if (pxPerCm <= 0) return;

    const handleEl = target.closest("[data-handle]");
    const modEl = target.closest("[data-elemento]");
    const startX = e.clientX;
    const startY = e.clientY;
    let moveu = false;

    if (handleEl) {
      e.preventDefault();
      const tipoHandle = handleEl.getAttribute("data-handle") as
        | "largura"
        | "altura"
        | "mover";
      const linhaIdx = Number(handleEl.getAttribute("data-linha"));
      const modIdx = Number(handleEl.getAttribute("data-modulo"));
      const lIni = paramsRef.current.linhas[linhaIdx];
      const mIni = lIni?.modulos[modIdx];
      if (!lIni || !mIni) return;
      const origLargura = mIni.larguraCm;
      const origAltura = mIni.alturaCm || lIni.alturaCm;
      const origInicio = lIni.inicioCm ?? 0;
      const origElev = lIni.elevacaoCm;

      const onMove = (ev: PointerEvent) => {
        if (!moveu && Math.hypot(ev.clientX - startX, ev.clientY - startY) < 3) return;
        moveu = true;
        const step = ev.shiftKey ? 1 : 5;
        const atual = paramsRef.current;
        const lCur = atual.linhas[linhaIdx];
        if (!lCur) return;

        if (tipoHandle === "mover") {
          const deltaXCm = (ev.clientX - startX) / pxPerCm;
          const deltaYCm = (startY - ev.clientY) / pxPerCm;
          const maxX = Math.max(0, atual.larguraParedeCm - larguraLinha(lCur));
          const maxY = Math.max(
            0,
            atual.peDireitoCm - lCur.alturaCm - (lCur.tampo ? 3 : 0)
          );
          const novoX = Math.max(
            0,
            Math.min(maxX, Math.round((origInicio + deltaXCm) / step) * step)
          );
          const novoY = Math.max(
            0,
            Math.min(maxY, Math.round((origElev + deltaYCm) / step) * step)
          );
          vm.moverBloco2D(linhaIdx, novoX, novoY);
          setIndicadorArrasto(`Posição: X ${novoX} cm · Y ${novoY} cm`);
        } else if (tipoHandle === "largura") {
          const deltaCm = (ev.clientX - startX) / pxPerCm;
          const maxW = lCur.tipo === "painel" ? 650 : 350;
          const novaLarg = Math.max(
            20,
            Math.min(maxW, Math.round((origLargura + deltaCm) / step) * step)
          );
          vm.atualizarModulo(linhaIdx, modIdx, { larguraCm: novaLarg });
          setIndicadorArrasto(`Largura: ${novaLarg} cm`);
        } else {
          const deltaUpCm = (startY - ev.clientY) / pxPerCm;
          const bruta = Math.round((origAltura + deltaUpCm) / step) * step;
          const mCur = lCur.modulos[modIdx];
          const altVis =
            lCur.tipo === "caixa" && mCur?.alturaCm !== undefined
              ? Math.max(25, Math.min(lCur.alturaCm, bruta))
              : Math.max(
                  lCur.tipo === "painel" ? 40 : 25,
                  Math.min(atual.peDireitoCm - lCur.elevacaoCm, bruta)
                );
          vm.redimensionarAlturaElemento(linhaIdx, modIdx, altVis);
          setIndicadorArrasto(`Altura: ${altVis} cm`);
        }
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        setIndicadorArrasto(null);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      return;
    }

    if (modEl) {
      e.preventDefault();
      const linhaIdx = Number(modEl.getAttribute("data-linha"));
      const modIdx = Number(modEl.getAttribute("data-modulo"));
      const lIni = paramsRef.current.linhas[linhaIdx];
      if (!lIni) return;
      let curModIdx = modIdx;
      let anchorX = startX;
      const origInicio = lIni.inicioCm ?? 0;
      const origElevacao = lIni.elevacaoCm;
      let axis: "reorder-x" | "move-x" | "move-y" | null = null;

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        if (!axis) {
          if (Math.hypot(dx, dy) < 7) return;
          const lNow = paramsRef.current.linhas[linhaIdx];
          if (!lNow) return;
          if (Math.abs(dy) > Math.abs(dx)) {
            axis = "move-y";
          } else {
            axis = lNow.modulos.length > 1 && lNow.tipo === "caixa" ? "reorder-x" : "move-x";
          }
          moveu = true;
          vm.setSelecionado({ linhaIdx, modIdx: curModIdx });
        }

        const atual = paramsRef.current;
        const lCur = atual.linhas[linhaIdx];
        if (!lCur) return;

        if (axis === "move-x") {
          const step = ev.shiftKey ? 1 : 5;
          const deltaXCm = (ev.clientX - startX) / pxPerCm;
          const maxX = Math.max(0, atual.larguraParedeCm - larguraLinha(lCur));
          const xVis = Math.max(
            0,
            Math.min(maxX, Math.round((origInicio + deltaXCm) / step) * step)
          );
          vm.moverBloco2D(linhaIdx, xVis, lCur.elevacaoCm);
          setIndicadorArrasto(`Posição lateral: ${xVis} cm`);
        } else if (axis === "reorder-x") {
          const lista = [...(paramsRef.current.linhas[linhaIdx]?.modulos ?? [])];
          let steps = 0;
          while (steps < 12 && lista.length > 1) {
            const deltaCm = (ev.clientX - anchorX) / pxPerCm;
            if (deltaCm > 0 && curModIdx < lista.length - 1) {
              const viz = lista[curModIdx + 1];
              if (deltaCm >= Math.max(12, viz.larguraCm * 0.55)) {
                vm.moverModulo(linhaIdx, curModIdx, 1);
                [lista[curModIdx], lista[curModIdx + 1]] = [lista[curModIdx + 1], lista[curModIdx]];
                curModIdx += 1;
                anchorX += viz.larguraCm * pxPerCm;
                steps++;
                continue;
              }
            } else if (deltaCm < 0 && curModIdx > 0) {
              const viz = lista[curModIdx - 1];
              if (-deltaCm >= Math.max(12, viz.larguraCm * 0.55)) {
                vm.moverModulo(linhaIdx, curModIdx, -1);
                [lista[curModIdx], lista[curModIdx - 1]] = [lista[curModIdx - 1], lista[curModIdx]];
                curModIdx -= 1;
                anchorX -= viz.larguraCm * pxPerCm;
                steps++;
                continue;
              }
            }
            break;
          }
          setIndicadorArrasto("Movendo posição na linha");
        } else {
          const step = ev.shiftKey ? 1 : 5;
          const deltaUpCm = (startY - ev.clientY) / pxPerCm;
          const maxElev = Math.max(
            0,
            atual.peDireitoCm - lCur.alturaCm - (lCur.tampo ? 3 : 0)
          );
          const elevVis = Math.max(
            0,
            Math.min(maxElev, Math.round((origElevacao + deltaUpCm) / step) * step)
          );
          vm.moverElevacaoLinha(linhaIdx, elevVis);
          setIndicadorArrasto(`Altura do piso: ${elevVis} cm`);
        }
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        setIndicadorArrasto(null);
        if (!moveu) {
          vm.setSelecionado({ linhaIdx, modIdx });
        }
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      return;
    }

    const onUpVazio = (ev: PointerEvent) => {
      window.removeEventListener("pointerup", onUpVazio);
      if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < 6) {
        vm.setSelecionado(null);
      }
    };
    window.addEventListener("pointerup", onUpVazio);
  };

  const frenteAtual = encontrar(MATERIAIS, vm.params.materialFrente);
  const puxadorAtual = encontrar(PUXADORES, vm.params.puxador);
  const temTampo = vm.params.linhas.some((l) => l.tampo);
  const temPainel = vm.params.linhas.some((l) => l.tipo === "painel");
  const temLed = vm.params.extras.includes("led");
  const temRipado = vm.params.extras.includes("ripado");

  const modelosLivres = MODELOS.filter((m) => m.grupo === "livre");
  const modelosComerciais = MODELOS.filter((m) => m.grupo === "comercial");
  const modelosResidenciais = MODELOS.filter((m) => m.grupo === "residencial");

  return (
    <div className="flex flex-col gap-3 sm:h-full sm:min-h-0">
      {/* Cabeçalho simples */}
      <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-[#1B1A18] leading-tight">
            Simulação de Ambiente
          </h2>
          <p className="text-xs text-[#7C7367]">
            Configure medidas e acabamentos ou clique no desenho para editar cada peça.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-[#DDD6CA] bg-[#F4F0E8] p-1">
          <button
            type="button"
            onClick={() => setAba("projeto")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
              aba === "projeto"
                ? "bg-[#1B1A18] text-[#FAF8F4] shadow-sm"
                : "text-[#5C5449] hover:text-[#1B1A18]"
            }`}
          >
            Projeto
          </button>
          <button
            type="button"
            onClick={() => setAba("salvos")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
              aba === "salvos"
                ? "bg-[#1B1A18] text-[#FAF8F4] shadow-sm"
                : "text-[#5C5449] hover:text-[#1B1A18]"
            }`}
          >
            Salvos ({vm.historico.length})
          </button>
        </div>
      </div>

      {/* Aviso discreto */}
      {(vm.erro || vm.feedback) && (
        <div
          className={`flex items-center justify-between rounded-lg border px-3 py-1.5 text-xs shrink-0 ${
            vm.erro
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          <span>{vm.erro ?? vm.feedback}</span>
          <button
            type="button"
            onClick={() => {
              vm.setErro(null);
              vm.setFeedback(null);
            }}
            className="ml-3 text-[11px] font-semibold opacity-70 hover:opacity-100"
          >
            Fechar
          </button>
        </div>
      )}

      {aba === "projeto" ? (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-3">
          {/* Painel de configuração */}
          <aside className="rounded-xl border border-[#E5DEC9] bg-white p-4 overflow-y-auto space-y-3.5 sm:min-h-0">
            {/* Cliente */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={LABEL_CLS}>Cliente do funil</label>
                <select
                  className={INPUT_CLS}
                  value={vm.params.leadId}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                      vm.updateParams({ leadId: "" });
                      return;
                    }
                    const id = Number(val);
                    const lead = leads.find((l) => l.id === id);
                    vm.updateParams({
                      leadId: id,
                      clienteNome: lead?.nome ?? vm.params.clienteNome,
                    });
                  }}
                >
                  <option value="">Opcional...</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL_CLS}>Nome do cliente</label>
                <input
                  type="text"
                  placeholder="Ex.: Vinícola Serra"
                  className={INPUT_CLS}
                  value={vm.params.clienteNome}
                  onChange={(e) =>
                    vm.updateParams({ clienteNome: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Modelo comercial ou residencial */}
            <div>
              <label className={LABEL_CLS}>Tipo de móvel</label>
              <select
                className={INPUT_CLS}
                value={vm.params.modelo}
                onChange={(e) => vm.selecionarModelo(e.target.value)}
              >
                <optgroup label="Livre / Criação do Zero">
                  {modelosLivres.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Comércio, Varejo & Vinícolas">
                  {modelosComerciais.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Residencial">
                  {modelosResidenciais.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Medidas */}
            <div className="grid grid-cols-2 gap-2">
              <CampoMedida
                label="Largura da parede"
                value={vm.params.larguraParedeCm}
                min={80}
                max={650}
                onCommit={(v) => vm.atualizarDimensoes(v, vm.params.peDireitoCm)}
              />
              <CampoMedida
                label="Altura (pé-direito)"
                value={vm.params.peDireitoCm}
                min={180}
                max={360}
                onCommit={(v) =>
                  vm.atualizarDimensoes(vm.params.larguraParedeCm, v)
                }
              />
            </div>

            {/* Cor principal visual */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={LABEL_CLS + " mb-0"}>Acabamento principal</label>
                <span className="text-[11px] font-medium text-[#1B1A18]">
                  {frenteAtual?.label}
                </span>
              </div>
              <div className="grid grid-cols-9 gap-1.5">
                {MATERIAIS.map((m) => {
                  const ativo = vm.params.materialFrente === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      title={m.label}
                      onClick={() => vm.updateParams({ materialFrente: m.id })}
                      className={`h-7 w-full rounded-md border transition ${
                        ativo
                          ? "border-[#1B1A18] ring-2 ring-[#B08D57] ring-offset-1 scale-105"
                          : "border-[#CFC6B8] hover:scale-105"
                      }`}
                      style={{ backgroundColor: m.cor }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Cor superior / contraste */}
            <div>
              <label className={LABEL_CLS}>Cor superior / detalhe</label>
              <select
                className={INPUT_CLS}
                value={vm.params.materialFrenteSuperior}
                onChange={(e) =>
                  vm.updateParams({ materialFrenteSuperior: e.target.value })
                }
              >
                <option value="">Igual à cor principal</option>
                {MATERIAIS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Puxador e Tampo */}
            <div className={`grid gap-2 ${temTampo ? "grid-cols-2" : "grid-cols-1"}`}>
              <div>
                <label className={LABEL_CLS}>Puxador</label>
                <select
                  className={INPUT_CLS}
                  value={vm.params.puxador}
                  onChange={(e) => vm.updateParams({ puxador: e.target.value })}
                >
                  {PUXADORES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              {temTampo && (
                <div>
                  <label className={LABEL_CLS}>Tampo / Bancada</label>
                  <select
                    className={INPUT_CLS}
                    value={vm.params.tampo}
                    onChange={(e) => vm.updateParams({ tampo: e.target.value })}
                  >
                    {TAMPOS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Adicionais simples */}
            <div className="flex flex-wrap gap-3 pt-0.5">
              <label className="flex items-center gap-1.5 text-xs text-[#3D3831] cursor-pointer">
                <input
                  type="checkbox"
                  checked={temLed}
                  onChange={() => vm.toggleExtra("led")}
                  className="accent-[#8A6B3E]"
                />
                Iluminação LED
              </label>
              {temPainel && (
                <label className="flex items-center gap-1.5 text-xs text-[#3D3831] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={temRipado}
                    onChange={() => vm.toggleExtra("ripado")}
                    className="accent-[#8A6B3E]"
                  />
                  Painel ripado
                </label>
              )}
            </div>

            {/* Foto opcional do local */}
            <div className="border-t border-[#EFEAE0] pt-3">
              {vm.foto ? (
                <div className="flex items-center gap-2.5 rounded-lg border border-[#E5DEC9] bg-[#FAF8F4] p-2">
                  <img
                    src={vm.foto}
                    alt="Foto do local"
                    className="h-11 w-16 rounded object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-[#1B1A18] truncate">
                      Foto / esboço anexado
                    </div>
                    <button
                      type="button"
                      onClick={vm.removerFoto}
                      className="text-[11px] font-semibold text-red-700 hover:underline"
                    >
                      Remover imagem
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex items-center justify-center rounded-lg border border-dashed border-[#CFC6B8] bg-[#FAF8F4] py-2 px-3 text-xs font-medium text-[#5C5449] cursor-pointer hover:border-[#B08D57] hover:text-[#1B1A18] transition">
                  + Foto do local ou esboço (opcional)
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void vm.handleUploadFoto(f);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>

            {/* Observações recolhidas por padrão */}
            <details className="border-t border-[#EFEAE0] pt-2.5 text-xs">
              <summary className="cursor-pointer font-medium text-[#7C7367] hover:text-[#1B1A18] select-none">
                Observação e prazo no PDF
              </summary>
              <div className="mt-2.5 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={LABEL_CLS}>Prazo (dias úteis)</label>
                    <input
                      type="number"
                      min={1}
                      className={INPUT_CLS}
                      value={vm.params.prazoDias}
                      onChange={(e) =>
                        vm.updateParams({
                          prazoDias: Math.max(1, Number(e.target.value) || 35),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Validade (dias)</label>
                    <input
                      type="number"
                      min={1}
                      className={INPUT_CLS}
                      value={vm.params.validadeDias}
                      onChange={(e) =>
                        vm.updateParams({
                          validadeDias: Math.max(1, Number(e.target.value) || 15),
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLS}>Observações</label>
                  <textarea
                    rows={2}
                    placeholder="Detalhes adicionais para o PDF..."
                    className={INPUT_CLS + " resize-none"}
                    value={vm.params.observacoes}
                    onChange={(e) =>
                      vm.updateParams({ observacoes: e.target.value })
                    }
                  />
                </div>
              </div>
            </details>
          </aside>

          {/* Palco visual + barra de ações */}
          <section className="flex flex-col gap-2.5 sm:min-h-0">
            <div className="flex-1 min-h-[340px] sm:min-h-0 flex flex-col rounded-xl border border-[#E5DEC9] bg-white overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFEAE0] bg-[#FAF8F4] px-3.5 py-2 shrink-0">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => vm.setModoVisualizacao("3d")}
                    className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                      vm.modoVisualizacao === "3d"
                        ? "bg-[#1B1A18] text-white"
                        : "bg-white border border-[#DDD6CA] text-[#4A443B] hover:border-[#B08D57]"
                    }`}
                  >
                    Visão 3D
                  </button>
                  <button
                    type="button"
                    onClick={() => vm.setModoVisualizacao("tecnico")}
                    className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                      vm.modoVisualizacao === "tecnico"
                        ? "bg-[#1B1A18] text-white"
                        : "bg-white border border-[#DDD6CA] text-[#4A443B] hover:border-[#B08D57]"
                    }`}
                  >
                    Medidas (Técnico)
                  </button>
                  {vm.foto && (
                    <button
                      type="button"
                      onClick={() => vm.setModoVisualizacao("foto")}
                      className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                        vm.modoVisualizacao === "foto"
                          ? "bg-[#1B1A18] text-white"
                          : "bg-white border border-[#DDD6CA] text-[#4A443B] hover:border-[#B08D57]"
                      }`}
                    >
                      Foto / Esboço
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => vm.adicionarBloco("superior")}
                    className="rounded-md border border-[#DDD6CA] bg-white px-2 py-1 text-[11px] font-medium text-[#4A443B] hover:border-[#B08D57] hover:text-[#1B1A18] transition"
                  >
                    + Aéreo
                  </button>
                  <button
                    type="button"
                    onClick={() => vm.adicionarBloco("balcao")}
                    className="rounded-md border border-[#DDD6CA] bg-white px-2 py-1 text-[11px] font-medium text-[#4A443B] hover:border-[#B08D57] hover:text-[#1B1A18] transition"
                  >
                    + Balcão
                  </button>
                  <button
                    type="button"
                    onClick={() => vm.adicionarBloco("torre")}
                    className="rounded-md border border-[#DDD6CA] bg-white px-2 py-1 text-[11px] font-medium text-[#4A443B] hover:border-[#B08D57] hover:text-[#1B1A18] transition"
                  >
                    + Torre
                  </button>
                  {!temPainel && (
                    <button
                      type="button"
                      onClick={() => vm.adicionarBloco("painel")}
                      className="rounded-md border border-[#DDD6CA] bg-white px-2 py-1 text-[11px] font-medium text-[#4A443B] hover:border-[#B08D57] hover:text-[#1B1A18] transition"
                    >
                      + Painel
                    </button>
                  )}
                  {(vm.personalizado ||
                    (vm.params.modelo === "sob-medida" && vm.params.linhas.length > 0)) && (
                    <button
                      type="button"
                      onClick={vm.restaurarLayoutModelo}
                      className="rounded-md border border-[#E5DEC9] bg-[#FAF8F4] px-2 py-1 text-[11px] font-semibold text-[#8A6B3E] hover:border-[#B08D57] transition"
                    >
                      {vm.params.modelo === "sob-medida"
                        ? "Limpar parede"
                        : "Restaurar modelo"}
                    </button>
                  )}
                  <span className="hidden sm:inline text-xs font-medium text-[#7C7367] ml-1">
                    {vm.params.larguraParedeCm} × {vm.params.peDireitoCm} cm
                  </span>
                </div>
              </div>

              <div className="relative flex-1 min-h-0 bg-[#FBFAF7] p-3 flex items-center justify-center overflow-hidden select-none">
                {vm.modoVisualizacao === "foto" && vm.foto ? (
                  <img
                    src={vm.foto}
                    alt="Foto do local"
                    className="max-h-full max-w-full rounded-lg object-contain shadow-md"
                  />
                ) : (
                  <>
                    <div
                      ref={palcoRef}
                      onPointerDown={iniciarInteracaoSvg}
                      className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full touch-none"
                      dangerouslySetInnerHTML={{ __html: vm.svgInterativo }}
                    />

                    {vm.params.linhas.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
                        <div className="pointer-events-auto max-w-md rounded-2xl border border-[#DDD6CA] bg-white/95 backdrop-blur p-5 text-center shadow-lg space-y-3">
                          <div>
                            <h3 className="text-sm font-semibold text-[#1B1A18]">
                              Monte o ambiente livremente do zero
                            </h3>
                            <p className="mt-1 text-xs text-[#7C7367]">
                              Adicione blocos abaixo e arraste na parede pela alça dourada, ou anexe um esboço para formatos especiais.
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => vm.adicionarBloco("balcao")}
                              className="rounded-lg bg-[#1B1A18] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#32302C]"
                            >
                              + Balcão
                            </button>
                            <button
                              type="button"
                              onClick={() => vm.adicionarBloco("superior")}
                              className="rounded-lg border border-[#DDD6CA] bg-[#FAF8F4] px-3 py-1.5 text-xs font-medium text-[#1B1A18] hover:border-[#B08D57]"
                            >
                              + Aéreo
                            </button>
                            <button
                              type="button"
                              onClick={() => vm.adicionarBloco("torre")}
                              className="rounded-lg border border-[#DDD6CA] bg-[#FAF8F4] px-3 py-1.5 text-xs font-medium text-[#1B1A18] hover:border-[#B08D57]"
                            >
                              + Torre alta
                            </button>
                            <button
                              type="button"
                              onClick={() => vm.adicionarBloco("painel")}
                              className="rounded-lg border border-[#DDD6CA] bg-[#FAF8F4] px-3 py-1.5 text-xs font-medium text-[#1B1A18] hover:border-[#B08D57]"
                            >
                              + Painel fundo
                            </button>
                          </div>
                          <div className="pt-1 border-t border-[#EFEAE0]">
                            <label className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8A6B3E] hover:underline cursor-pointer">
                              + Anexar esboço ou foto de referência
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) {
                                    void vm.handleUploadFoto(f).then(() =>
                                      vm.setModoVisualizacao("foto")
                                    );
                                  }
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {indicadorArrasto && (
                      <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#1B1A18] px-3 py-1 text-[11px] font-medium text-[#FAF8F4] shadow-md">
                        {indicadorArrasto}
                      </div>
                    )}

                    {!indicadorArrasto && sel && linhaSel && modSel ? (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 max-w-[96%] flex flex-wrap items-center gap-1.5 rounded-xl border border-[#DDD6CA] bg-white/95 backdrop-blur px-2.5 py-1.5 shadow-lg text-xs">
                        {linhaSel.tipo === "painel" ? (
                          <>
                            <span className="font-semibold text-[#1B1A18] px-1">
                              {linhaSel.nome}
                            </span>
                            <span className="text-[11px] font-mono text-[#7C7367]">
                              {larguraLinha(linhaSel)}×{linhaSel.alturaCm} cm
                            </span>
                            <button
                              type="button"
                              onClick={() => vm.toggleExtra("ripado")}
                              className={`rounded-md border px-2 py-1 text-[11px] font-medium transition ${
                                temRipado
                                  ? "border-[#1B1A18] bg-[#1B1A18] text-white"
                                  : "border-[#DDD6CA] bg-[#FAF8F4] text-[#4A443B] hover:border-[#B08D57]"
                              }`}
                            >
                              {temRipado ? "Ripado ✓" : "Ripado"}
                            </button>
                            {larguraLinha(linhaSel) !== vm.params.larguraParedeCm && (
                              <button
                                type="button"
                                onClick={() => {
                                  vm.moverBloco2D(sel.linhaIdx, 0, linhaSel.elevacaoCm);
                                  vm.atualizarModulo(sel.linhaIdx, 0, {
                                    larguraCm: vm.params.larguraParedeCm,
                                  });
                                }}
                                className="rounded-md border border-[#E5DEC9] bg-[#FAF8F4] px-2 py-1 text-[11px] font-semibold text-[#8A6B3E] hover:border-[#B08D57]"
                              >
                                Ajustar ({vm.params.larguraParedeCm}cm)
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => vm.removerLinha(sel.linhaIdx)}
                              className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                            >
                              Remover
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="text-[11px] font-semibold text-[#7C7367] px-1">
                              {linhaSel.nome}:
                            </span>
                            <select
                              value={modSel.tipo}
                              onChange={(e) =>
                                vm.atualizarModulo(sel.linhaIdx, sel.modIdx, {
                                  tipo: e.target.value as TipoModulo,
                                })
                              }
                              className="rounded-md border border-[#DDD6CA] bg-[#FAF8F4] px-2 py-1 text-[11px] font-medium text-[#1B1A18] focus:border-[#B08D57] focus:outline-none"
                            >
                              {TIPOS_MODULO.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.label}
                                </option>
                              ))}
                            </select>
                            <span className="text-[11px] font-mono text-[#7C7367] px-1">
                              {modSel.larguraCm}×{modSel.alturaCm || linhaSel.alturaCm} cm
                            </span>
                            <button
                              type="button"
                              disabled={sel.modIdx === 0}
                              onClick={() =>
                                vm.moverModulo(sel.linhaIdx, sel.modIdx, -1)
                              }
                              title="Mover à esquerda"
                              className="rounded border border-[#DDD6CA] bg-[#FAF8F4] px-1.5 py-0.5 text-[11px] text-[#3D3831] disabled:opacity-30 hover:border-[#B08D57]"
                            >
                              ←
                            </button>
                            <button
                              type="button"
                              disabled={sel.modIdx === linhaSel.modulos.length - 1}
                              onClick={() =>
                                vm.moverModulo(sel.linhaIdx, sel.modIdx, 1)
                              }
                              title="Mover à direita"
                              className="rounded border border-[#DDD6CA] bg-[#FAF8F4] px-1.5 py-0.5 text-[11px] text-[#3D3831] disabled:opacity-30 hover:border-[#B08D57]"
                            >
                              →
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                vm.adicionarModulo(
                                  sel.linhaIdx,
                                  modSel.tipo === "vao-geladeira"
                                    ? "porta"
                                    : modSel.tipo,
                                  sel.modIdx
                                )
                              }
                              title="Adicionar peça ao lado"
                              className="rounded-md border border-[#E5DEC9] bg-[#FAF8F4] px-2 py-1 text-[11px] font-semibold text-[#8A6B3E] hover:border-[#B08D57]"
                            >
                              + Peça
                            </button>
                            <button
                              type="button"
                              onClick={() => vm.alternarTampoLinha(sel.linhaIdx)}
                              title="Ativar/remover tampo neste bloco"
                              className={`rounded-md border px-2 py-1 text-[11px] font-medium transition ${
                                linhaSel.tampo
                                  ? "border-[#1B1A18] bg-[#1B1A18] text-white"
                                  : "border-[#DDD6CA] bg-[#FAF8F4] text-[#4A443B] hover:border-[#B08D57]"
                              }`}
                            >
                              {linhaSel.tampo ? "Tampo ✓" : "Tampo"}
                            </button>
                            <button
                              type="button"
                              onClick={() => vm.alternarProfundidadeLinha(sel.linhaIdx)}
                              title="Alternar profundidade do bloco (35 / 45 / 58 cm)"
                              className="rounded-md border border-[#DDD6CA] bg-[#FAF8F4] px-2 py-1 text-[11px] font-medium text-[#4A443B] hover:border-[#B08D57]"
                            >
                              Prof. {linhaSel.profundidadeCm}cm
                            </button>
                            <button
                              type="button"
                              onClick={() => vm.duplicarBloco(sel.linhaIdx)}
                              title="Duplicar este bloco"
                              className="rounded-md border border-[#DDD6CA] bg-[#FAF8F4] px-2 py-1 text-[11px] font-medium text-[#4A443B] hover:border-[#B08D57]"
                            >
                              Duplicar
                            </button>
                            {(larguraLinha(linhaSel) !== vm.params.larguraParedeCm ||
                              (linhaSel.inicioCm ?? 0) !== 0) && (
                              <button
                                type="button"
                                onClick={() => vm.ajustarLinhaNaParede(sel.linhaIdx)}
                                className="rounded-md border border-[#E5DEC9] bg-[#FAF8F4] px-2 py-1 text-[11px] font-medium text-[#5C5449] hover:border-[#B08D57]"
                              >
                                Fechar parede
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                vm.removerModulo(sel.linhaIdx, sel.modIdx)
                              }
                              className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                            >
                              Remover
                            </button>
                            {linhaSel.modulos.length > 1 && (
                              <button
                                type="button"
                                onClick={() => vm.removerLinha(sel.linhaIdx)}
                                title="Remover este bloco inteiro"
                                className="text-[11px] font-medium text-red-700 hover:underline px-1"
                              >
                                Bloco ×
                              </button>
                            )}
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => vm.setSelecionado(null)}
                          title="Fechar seleção"
                          className="ml-0.5 rounded px-1.5 py-0.5 text-xs font-semibold text-[#7C7367] hover:bg-[#FAF8F4] hover:text-[#1B1A18]"
                        >
                          ×
                        </button>
                      </div>
                    ) : !indicadorArrasto && vm.params.linhas.length > 0 ? (
                      <div className="pointer-events-none absolute bottom-2.5 left-1/2 -translate-x-1/2 rounded-full bg-white/85 border border-[#E5DEC9] px-3 py-1 text-[11px] text-[#7C7367]">
                        Clique em qualquer peça para alterar, arrastar medidas ou mover na parede
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>

            {/* Barra de ações técnica (sem preço) */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-[#E5DEC9] bg-white px-4 py-2.5 shrink-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#5C5449]">
                {editandoNome ? (
                  <input
                    type="text"
                    autoFocus
                    value={nomeTemp}
                    onChange={(e) => setNomeTemp(e.target.value)}
                    onBlur={() => {
                      const limpo = nomeTemp.trim();
                      if (limpo) vm.updateParams({ ambienteNome: limpo });
                      setEditandoNome(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const limpo = nomeTemp.trim();
                        if (limpo) vm.updateParams({ ambienteNome: limpo });
                        setEditandoNome(false);
                      } else if (e.key === "Escape") {
                        setEditandoNome(false);
                      }
                    }}
                    className="rounded border border-[#B08D57] bg-[#FAF8F4] px-2 py-0.5 text-xs font-semibold text-[#1B1A18] focus:outline-none"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setNomeTemp(vm.params.ambienteNome);
                      setEditandoNome(true);
                    }}
                    title="Clique para renomear este ambiente"
                    className="font-semibold text-[#1B1A18] hover:text-[#8A6B3E] transition"
                  >
                    {vm.params.ambienteNome || "Projeto sob medida"} ✎
                  </button>
                )}
                <span className="text-[#CFC6B8]">·</span>
                <span>
                  {vm.totalModulos > 0 ? `${vm.totalModulos} módulos` : "Sob medida"}
                </span>
                <span className="text-[#CFC6B8]">·</span>
                <span>{puxadorAtual?.label}</span>
                {onRegistrarRastreabilidade && (
                  <button
                    type="button"
                    onClick={() =>
                      onRegistrarRastreabilidade({
                        projetoId: vm.params.leadId,
                        materiais: vm.sugestoesRastreabilidade,
                      })
                    }
                    className={`ml-1 rounded-md border px-2 py-0.5 text-[11px] font-medium transition ${
                      vm.lotesProjeto.length > 0
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                        : "border-[#DDD6CA] bg-[#FAF8F4] text-[#8A6B3E] hover:border-[#B08D57]"
                    }`}
                  >
                    {vm.lotesProjeto.length > 0
                      ? `${vm.lotesProjeto.length} lote(s) rastreado(s)`
                      : "Registrar na Rastreabilidade →"}
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={vm.exportarPropostaPdf}
                  className="rounded-lg bg-[#B08D57] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#997845] transition"
                >
                  Ficha PDF
                </button>
                <button
                  type="button"
                  onClick={() => void vm.copiarWhatsApp()}
                  className="rounded-lg bg-[#1B1A18] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#32302C] transition"
                >
                  WhatsApp
                </button>
                <button
                  type="button"
                  disabled={vm.exportando}
                  onClick={() => void vm.baixarProjetoPng()}
                  className="rounded-lg border border-[#DDD6CA] bg-[#FAF8F4] px-3 py-2 text-xs font-semibold text-[#1B1A18] hover:border-[#B08D57] disabled:opacity-50 transition"
                >
                  {vm.exportando ? "Gerando..." : "Baixar PNG"}
                </button>
                <button
                  type="button"
                  onClick={() => void vm.salvarNoHistorico()}
                  className="rounded-lg border border-[#DDD6CA] bg-[#FAF8F4] px-3 py-2 text-xs font-semibold text-[#1B1A18] hover:border-[#B08D57] transition"
                >
                  Salvar
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div className="flex-1 min-h-0 rounded-xl border border-[#E5DEC9] bg-white p-4 overflow-y-auto">
          {vm.historico.length === 0 ? (
            <div className="flex h-full min-h-[260px] flex-col items-center justify-center text-center text-xs text-[#7C7367]">
              <p className="text-sm font-semibold text-[#1B1A18]">
                Nenhum projeto salvo ainda
              </p>
              <p className="mt-1">
                Configure um projeto na aba &ldquo;Projeto&rdquo; e clique em Salvar.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {vm.historico.map((proj) => {
                const thumb = gerarSvgProjeto(proj.params, {
                  modo: "perspectiva",
                  cotas: false,
                });
                return (
                  <div
                    key={proj.id}
                    className="flex flex-col rounded-xl border border-[#E5DEC9] bg-[#FAF8F4] overflow-hidden"
                  >
                    <div
                      className="h-44 bg-[#FBFAF7] border-b border-[#EFEAE0] p-2 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                      dangerouslySetInnerHTML={{ __html: thumb }}
                    />
                    <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs font-semibold text-[#1B1A18]">
                          {proj.params.ambienteNome || proj.params.modelo}
                        </h3>
                        <div className="text-[11px] text-[#7C7367] mt-0.5">
                          {proj.params.clienteNome || "Sem cliente"} ·{" "}
                          {proj.params.larguraParedeCm}×{proj.params.peDireitoCm} cm ·{" "}
                          {new Date(proj.criadoEm).toLocaleDateString("pt-BR")}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            vm.carregarDoHistorico(proj);
                            setAba("projeto");
                          }}
                          className="flex-1 rounded-lg bg-[#1B1A18] py-1.5 text-xs font-semibold text-white hover:bg-[#32302C]"
                        >
                          Abrir
                        </button>
                        <button
                          type="button"
                          onClick={() => void vm.excluirDoHistorico(proj.id)}
                          className="rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
