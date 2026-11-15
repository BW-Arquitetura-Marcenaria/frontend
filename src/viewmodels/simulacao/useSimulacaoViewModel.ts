import { useCallback, useEffect, useMemo, useState } from "react";
import { getRastreabilidadesByProjeto } from "@/api/rastreabilidades";
import type { Rastreabilidade } from "@/models/Rastreabilidade";
import type { Linha, Modulo, ProjetoParams, ProjetoSimulacao, TipoModulo } from "@/models/Simulacao";
import {
  MATERIAIS,
  MATERIAL_FUNDO,
  MODELOS,
  ehVao,
  encontrar,
  gerarLinhas,
  larguraLinha,
  paramsPadrao,
  redistribuirLinha,
  resumirMateriais,
  uid,
} from "@/models/Simulacao";
import {
  gerarSvgProjeto,
  svgParaPng,
  type ElementoSelecionado,
} from "@/utils/desenhoMarcenaria";
import { listarProjetos, removerProjeto, salvarProjeto } from "@/utils/historicoSimulacao";
import { baixarImagem, carregarFoto, imagemParaPngDataUrl } from "@/utils/imagem";
import { abrirProposta, textoWhatsApp } from "@/utils/propostaSimulacao";

function slugArquivo(texto: string): string {
  return (
    texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "projeto-bw"
  );
}

export function useSimulacaoViewModel() {
  const [params, setParams] = useState<ProjetoParams>(() => paramsPadrao("cozinha"));
  const [personalizado, setPersonalizado] = useState(false);
  const [selecionado, setSelecionado] = useState<ElementoSelecionado | null>(null);
  const [foto, setFoto] = useState<string | null>(null);
  const [modoVisualizacao, setModoVisualizacao] = useState<"3d" | "tecnico" | "foto">("3d");
  const [projetoAtualId, setProjetoAtualId] = useState<string | null>(null);
  const [historico, setHistorico] = useState<ProjetoSimulacao[]>([]);
  const [lotesProjeto, setLotesProjeto] = useState<Rastreabilidade[]>([]);
  const [rastreabilidadeRev, setRastreabilidadeRev] = useState(0);
  const [exportando, setExportando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    listarProjetos()
      .then((lista) => {
        setHistorico(
          lista.filter((item) => Boolean(item?.params?.linhas && Array.isArray(item.params.linhas)))
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof params.leadId !== "number") {
      setLotesProjeto([]);
      return;
    }
    let ativo = true;
    void getRastreabilidadesByProjeto(params.leadId, { page: 0, size: 50 })
      .then((resp) => {
        if (ativo) setLotesProjeto(resp.content ?? []);
      })
      .catch(() => {
        if (ativo) setLotesProjeto([]);
      });
    return () => {
      ativo = false;
    };
  }, [params.leadId, rastreabilidadeRev]);

  const recarregarRastreabilidade = useCallback(() => {
    setRastreabilidadeRev((v) => v + 1);
  }, []);

  const avisar = useCallback((msg: string) => {
    setFeedback(msg);
    setErro(null);
  }, []);

  const totalModulos = useMemo(
    () =>
      params.linhas.reduce(
        (total, linha) => total + linha.modulos.filter((m) => !ehVao(m.tipo)).length,
        0
      ),
    [params.linhas]
  );

  const sugestoesRastreabilidade = useMemo(() => {
    const prioridade = (id: string) => {
      if (id === params.materialFrente) return 0;
      if (id === params.materialFrenteSuperior) return 1;
      if (id === MATERIAL_FUNDO.id) return 3;
      return 2;
    };
    const resumidos = resumirMateriais(params)
      .sort((a, b) => prioridade(a.materialId) - prioridade(b.materialId))
      .filter((r) => r.materialId !== MATERIAL_FUNDO.id);
    if (resumidos.length > 0) {
      return resumidos.map((r) => ({
        tipoMadeira: r.label,
        volume: `${r.chapas} ${r.chapas === 1 ? "chapa" : "chapas"} (${r.areaM2
          .toFixed(1)
          .replace(".", ",")} m²)`,
      }));
    }
    const lista: { tipoMadeira: string; volume: string }[] = [];
    const frente = encontrar(MATERIAIS, params.materialFrente);
    if (frente) lista.push({ tipoMadeira: `MDF ${frente.label} 18 mm`, volume: "" });
    if (params.materialFrenteSuperior && params.materialFrenteSuperior !== params.materialFrente) {
      const sup = encontrar(MATERIAIS, params.materialFrenteSuperior);
      if (sup) lista.push({ tipoMadeira: `MDF ${sup.label} 18 mm`, volume: "" });
    }
    return lista;
  }, [params]);

  const svgAtivo = useMemo(
    () =>
      gerarSvgProjeto(params, {
        modo: modoVisualizacao === "tecnico" ? "elevacao" : "perspectiva",
        cotas: modoVisualizacao === "tecnico",
      }),
    [params, modoVisualizacao]
  );

  const svgInterativo = useMemo(
    () =>
      gerarSvgProjeto(params, {
        modo: modoVisualizacao === "tecnico" ? "elevacao" : "perspectiva",
        cotas: modoVisualizacao === "tecnico",
        interativo: true,
        selecionado,
      }),
    [params, modoVisualizacao, selecionado]
  );

  const updateParams = useCallback((patch: Partial<ProjetoParams>) => {
    setParams((prev) => ({ ...prev, ...patch }));
  }, []);

  const atualizarDimensoes = useCallback(
    (larguraCm: number, peDireitoCm: number) => {
      const L = Math.max(80, Math.min(650, Math.round(larguraCm)));
      const pd = Math.max(180, Math.min(360, Math.round(peDireitoCm)));
      setParams((prev) => ({
        ...prev,
        larguraParedeCm: L,
        peDireitoCm: pd,
        linhas: personalizado
          ? prev.linhas.map((l) => {
              const larg = larguraLinha(l);
              const x0 = l.inicioCm ?? 0;
              const cobreParedeAnterior =
                x0 === 0 && Math.abs(larg - prev.larguraParedeCm) <= 2;
              if (l.tipo === "painel") {
                return cobreParedeAnterior
                  ? {
                      ...l,
                      alturaCm: Math.min(l.alturaCm, pd - 10),
                      modulos: [{ id: l.modulos[0]?.id ?? uid(), tipo: "nicho", larguraCm: L }],
                    }
                  : {
                      ...l,
                      alturaCm: Math.min(l.alturaCm, pd - l.elevacaoCm),
                      inicioCm: Math.min(x0, Math.max(0, L - larg)),
                    };
              }
              return cobreParedeAnterior
                ? redistribuirLinha(l, L)
                : { ...l, inicioCm: Math.min(x0, Math.max(0, L - larg)) };
            })
          : gerarLinhas(prev.modelo, L, pd),
      }));
      if (!personalizado) setSelecionado(null);
    },
    [personalizado]
  );

  const selecionarModelo = useCallback((modeloId: string) => {
    const base = paramsPadrao(modeloId);
    const info = encontrar(MODELOS, modeloId);
    const novaLargura = info?.largura ?? base.larguraParedeCm;
    setParams((prev) => ({
      ...base,
      clienteNome: prev.clienteNome,
      leadId: prev.leadId,
      materialCaixa: prev.materialCaixa,
      materialFrente: prev.materialFrente,
      materialFrenteSuperior: prev.materialFrenteSuperior,
      puxador: prev.puxador,
      tampo: prev.tampo,
      extras: prev.extras,
      peDireitoCm: prev.peDireitoCm,
      larguraParedeCm: novaLargura,
      linhas: gerarLinhas(modeloId, novaLargura, prev.peDireitoCm),
    }));
    setPersonalizado(false);
    setSelecionado(null);
    setProjetoAtualId(null);
  }, []);

  const restaurarLayoutModelo = useCallback(() => {
    setParams((prev) => ({
      ...prev,
      linhas: gerarLinhas(prev.modelo, prev.larguraParedeCm, prev.peDireitoCm),
    }));
    setPersonalizado(false);
    setSelecionado(null);
  }, []);

  const toggleExtra = useCallback((extraId: string) => {
    setParams((prev) => ({
      ...prev,
      extras: prev.extras.includes(extraId)
        ? prev.extras.filter((id) => id !== extraId)
        : [...prev.extras, extraId],
    }));
  }, []);

  const removerLinha = useCallback((linhaIdx: number) => {
    setErro(null);
    setParams((prev) => ({
      ...prev,
      linhas: prev.linhas.filter((_, i) => i !== linhaIdx),
    }));
    setSelecionado(null);
    setPersonalizado(true);
  }, []);

  const adicionarBloco = useCallback(
    (tipo: "superior" | "balcao" | "torre" | "painel") => {
      const novoIndice = tipo === "painel" ? 0 : params.linhas.length;
      setParams((prev) => {
        const L = prev.larguraParedeCm;
        const posLivre = (elev: number, alt: number, larg: number) => {
          const sobrepostos = prev.linhas.filter(
            (l) =>
              l.tipo === "caixa" &&
              l.elevacaoCm < elev + alt &&
              l.elevacaoCm + l.alturaCm > elev
          );
          if (sobrepostos.length === 0) return 0;
          const maiorFim = Math.max(
            0,
            ...sobrepostos.map((l) => (l.inicioCm ?? 0) + larguraLinha(l))
          );
          return maiorFim + larg <= L ? maiorFim : 0;
        };

        let nova: Linha;
        if (tipo === "painel") {
          nova = {
            id: uid(),
            nome: "Painel fundo",
            tipo: "painel",
            alturaCm: Math.min(240, prev.peDireitoCm - 10),
            profundidadeCm: 2,
            inicioCm: 0,
            elevacaoCm: 0,
            tampo: false,
            modulos: [{ id: uid(), tipo: "nicho", larguraCm: L }],
          };
        } else if (tipo === "superior") {
          const larg = Math.min(120, L);
          const alt = 70;
          const elev = Math.min(150, prev.peDireitoCm - 75);
          nova = {
            id: uid(),
            nome: "Aéreo",
            tipo: "caixa",
            alturaCm: alt,
            profundidadeCm: 35,
            inicioCm: posLivre(elev, alt, larg),
            elevacaoCm: elev,
            tampo: false,
            modulos: [{ id: uid(), tipo: "duas-portas", larguraCm: larg }],
          };
        } else if (tipo === "torre") {
          const larg = Math.min(80, L);
          const alt = Math.min(210, prev.peDireitoCm - 15);
          const elev = 10;
          nova = {
            id: uid(),
            nome: "Torre / Armário",
            tipo: "caixa",
            alturaCm: alt,
            profundidadeCm: 48,
            inicioCm: posLivre(elev, alt, larg),
            elevacaoCm: elev,
            tampo: false,
            modulos: [{ id: uid(), tipo: "duas-portas", larguraCm: larg }],
          };
        } else {
          const larg = Math.min(120, L);
          const alt = 72;
          const elev = 10;
          nova = {
            id: uid(),
            nome: "Balcão",
            tipo: "caixa",
            alturaCm: alt,
            profundidadeCm: 55,
            inicioCm: posLivre(elev, alt, larg),
            elevacaoCm: elev,
            tampo: true,
            modulos: [{ id: uid(), tipo: "duas-portas", larguraCm: larg }],
          };
        }

        const linhas =
          tipo === "painel" ? [nova, ...prev.linhas] : [...prev.linhas, nova];
        return { ...prev, linhas };
      });
      setSelecionado({ linhaIdx: novoIndice, modIdx: 0 });
      setPersonalizado(true);
    },
    [params.linhas.length]
  );

  const duplicarBloco = useCallback(
    (linhaIdx: number) => {
      const orig = params.linhas[linhaIdx];
      if (!orig) return;
      const novoIndice = params.linhas.length;
      setParams((prev) => {
        const lOrig = prev.linhas[linhaIdx];
        if (!lOrig) return prev;
        const larg = larguraLinha(lOrig);
        const xOrig = lOrig.inicioCm ?? 0;
        const xDir = xOrig + larg;
        const novoInicio =
          xDir + larg <= prev.larguraParedeCm
            ? xDir
            : Math.max(0, xOrig - larg);
        const copia: Linha = {
          ...lOrig,
          id: uid(),
          inicioCm: lOrig.tipo === "painel" ? 0 : novoInicio,
          modulos: lOrig.modulos.map((m) => ({ ...m, id: uid() })),
        };
        return { ...prev, linhas: [...prev.linhas, copia] };
      });
      setSelecionado({ linhaIdx: novoIndice, modIdx: 0 });
      setPersonalizado(true);
    },
    [params.linhas]
  );

  const alternarTampoLinha = useCallback((linhaIdx: number) => {
    setParams((prev) => ({
      ...prev,
      linhas: prev.linhas.map((l, i) =>
        i === linhaIdx && l.tipo === "caixa" ? { ...l, tampo: !l.tampo } : l
      ),
    }));
    setPersonalizado(true);
  }, []);

  const alternarProfundidadeLinha = useCallback((linhaIdx: number) => {
    const niveis = [35, 45, 58];
    setParams((prev) => ({
      ...prev,
      linhas: prev.linhas.map((l, i) => {
        if (i !== linhaIdx || l.tipo !== "caixa") return l;
        const prox = niveis.find((n) => n > l.profundidadeCm) ?? niveis[0];
        return { ...l, profundidadeCm: prox };
      }),
    }));
    setPersonalizado(true);
  }, []);

  const moverBloco2D = useCallback(
    (linhaIdx: number, novaInicioCm: number, novaElevacaoCm: number) => {
      setParams((prev) => ({
        ...prev,
        linhas: prev.linhas.map((l, i) => {
          if (i !== linhaIdx) return l;
          const larg = larguraLinha(l);
          const maxX = Math.max(0, prev.larguraParedeCm - larg);
          const maxY = Math.max(
            0,
            prev.peDireitoCm - l.alturaCm - (l.tampo ? 3 : 0)
          );
          return {
            ...l,
            inicioCm: Math.max(0, Math.min(maxX, Math.round(novaInicioCm))),
            elevacaoCm: Math.max(0, Math.min(maxY, Math.round(novaElevacaoCm))),
          };
        }),
      }));
      setPersonalizado(true);
    },
    []
  );

  const ajustarLinhaNaParede = useCallback((linhaIdx: number) => {
    setParams((prev) => ({
      ...prev,
      linhas: prev.linhas.map((l, i) =>
        i === linhaIdx ? redistribuirLinha(l, prev.larguraParedeCm) : l
      ),
    }));
    setPersonalizado(true);
  }, []);

  const adicionarModulo = useCallback(
    (linhaIdx: number, tipo: TipoModulo = "duas-portas", depoisDeIdx?: number) => {
      let inseridoIdx = 0;
      setParams((prev) => ({
        ...prev,
        linhas: prev.linhas.map((l, i) => {
          if (i !== linhaIdx) return l;
          const pos =
            depoisDeIdx !== undefined
              ? Math.min(l.modulos.length, Math.max(0, depoisDeIdx + 1))
              : l.modulos.length;
          inseridoIdx = pos;
          const copia = [...l.modulos];
          copia.splice(pos, 0, { id: uid(), tipo, larguraCm: 60 });
          return { ...l, modulos: copia };
        }),
      }));
      setSelecionado({ linhaIdx, modIdx: inseridoIdx });
      setPersonalizado(true);
    },
    []
  );

  const atualizarModulo = useCallback(
    (linhaIdx: number, modIdx: number, patch: Partial<Modulo>) => {
      setParams((prev) => ({
        ...prev,
        linhas: prev.linhas.map((l, i) =>
          i === linhaIdx
            ? {
                ...l,
                modulos: l.modulos.map((m, j) => (j === modIdx ? { ...m, ...patch } : m)),
              }
            : l
        ),
      }));
      setPersonalizado(true);
    },
    []
  );

  const redimensionarAlturaElemento = useCallback(
    (linhaIdx: number, modIdx: number, novaAlturaCm: number) => {
      setParams((prev) => ({
        ...prev,
        linhas: prev.linhas.map((l, i) => {
          if (i !== linhaIdx) return l;
          const pd = prev.peDireitoCm;
          const m = l.modulos[modIdx];
          if (!m) return l;
          if (l.tipo === "caixa" && m.alturaCm !== undefined) {
            const alt = Math.max(25, Math.min(l.alturaCm, Math.round(novaAlturaCm)));
            return {
              ...l,
              modulos: l.modulos.map((mod, j) =>
                j === modIdx ? { ...mod, alturaCm: alt } : mod
              ),
            };
          }
          const minAlt = l.tipo === "painel" ? 40 : 25;
          const alt = Math.max(minAlt, Math.min(pd - l.elevacaoCm, Math.round(novaAlturaCm)));
          return { ...l, alturaCm: alt };
        }),
      }));
      setPersonalizado(true);
    },
    []
  );

  const moverElevacaoLinha = useCallback((linhaIdx: number, novaElevacaoCm: number) => {
    setParams((prev) => ({
      ...prev,
      linhas: prev.linhas.map((l, i) => {
        if (i !== linhaIdx) return l;
        const maxElev = Math.max(0, prev.peDireitoCm - l.alturaCm - (l.tampo ? 3 : 0));
        const elev = Math.max(0, Math.min(maxElev, Math.round(novaElevacaoCm)));
        return { ...l, elevacaoCm: elev };
      }),
    }));
    setPersonalizado(true);
  }, []);

  const removerModulo = useCallback(
    (linhaIdx: number, modIdx: number) => {
      const linhaAtual = params.linhas[linhaIdx];
      if (!linhaAtual) return;
      setErro(null);
      const novaQtdModulos = linhaAtual.modulos.length - 1;
      setParams((prev) => {
        const linhaAlvo = prev.linhas[linhaIdx];
        if (!linhaAlvo) return prev;
        if (linhaAlvo.modulos.length <= 1) {
          return { ...prev, linhas: prev.linhas.filter((_, i) => i !== linhaIdx) };
        }
        return {
          ...prev,
          linhas: prev.linhas.map((l, i) =>
            i === linhaIdx
              ? { ...l, modulos: l.modulos.filter((_, j) => j !== modIdx) }
              : l
          ),
        };
      });
      if (novaQtdModulos <= 0) {
        setSelecionado(null);
      } else {
        setSelecionado({
          linhaIdx,
          modIdx: Math.min(modIdx, novaQtdModulos - 1),
        });
      }
      setPersonalizado(true);
    },
    [params.linhas]
  );

  const moverModulo = useCallback((linhaIdx: number, modIdx: number, dir: -1 | 1) => {
    let moveu = false;
    setParams((prev) => ({
      ...prev,
      linhas: prev.linhas.map((l, i) => {
        if (i !== linhaIdx) return l;
        const destino = modIdx + dir;
        if (destino < 0 || destino >= l.modulos.length) return l;
        const copia = [...l.modulos];
        const [item] = copia.splice(modIdx, 1);
        copia.splice(destino, 0, item);
        moveu = true;
        return { ...l, modulos: copia };
      }),
    }));
    if (moveu) {
      setSelecionado((sel) =>
        sel && sel.linhaIdx === linhaIdx && sel.modIdx === modIdx
          ? { linhaIdx, modIdx: modIdx + dir }
          : sel
      );
      setPersonalizado(true);
    }
  }, []);

  const handleUploadFoto = useCallback(
    async (file: File) => {
      setErro(null);
      try {
        const img = await carregarFoto(file);
        setFoto(img.dataUrl);
        avisar("Foto do local anexada à ficha.");
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Erro ao carregar foto.");
      }
    },
    [avisar]
  );

  const removerFoto = useCallback(() => {
    setFoto(null);
    setModoVisualizacao((m) => (m === "foto" ? "3d" : m));
  }, []);

  const construirProjetoAtual = useCallback(
    (): ProjetoSimulacao => ({
      id: projetoAtualId ?? crypto.randomUUID?.() ?? `${Date.now()}`,
      criadoEm: new Date().toISOString(),
      params,
      foto,
      precoFinal: 0,
    }),
    [foto, params, projetoAtualId]
  );

  const salvarNoHistorico = useCallback(async () => {
    const projeto = construirProjetoAtual();
    await salvarProjeto(projeto);
    setProjetoAtualId(projeto.id);
    const lista = await listarProjetos();
    setHistorico(
      lista.filter((item) => Boolean(item?.params?.linhas && Array.isArray(item.params.linhas)))
    );
    avisar("Projeto salvo com sucesso.");
  }, [avisar, construirProjetoAtual]);

  const carregarDoHistorico = useCallback(
    (projeto: ProjetoSimulacao) => {
      setParams(projeto.params);
      setFoto(projeto.foto ?? null);
      setProjetoAtualId(projeto.id);
      setPersonalizado(true);
      setSelecionado(null);
      setModoVisualizacao("3d");
      avisar(`Projeto "${projeto.params.ambienteNome || projeto.params.clienteNome || "BW"}" aberto.`);
    },
    [avisar]
  );

  const excluirDoHistorico = useCallback(async (id: string) => {
    await removerProjeto(id);
    setHistorico((prev) => prev.filter((item) => item.id !== id));
    setProjetoAtualId((prevId) => (prevId === id ? null : prevId));
  }, []);

  const baixarProjetoPng = useCallback(async () => {
    setExportando(true);
    setErro(null);
    try {
      const usarFoto =
        Boolean(foto) &&
        (modoVisualizacao === "foto" || params.linhas.length === 0);
      const png = usarFoto
        ? await imagemParaPngDataUrl(foto!)
        : await svgParaPng(
            gerarSvgProjeto(params, {
              modo: modoVisualizacao === "tecnico" ? "elevacao" : "perspectiva",
              cotas: modoVisualizacao === "tecnico",
            }),
            1800
          );
      const nome = slugArquivo(`${params.clienteNome || params.ambienteNome}-${modoVisualizacao}`);
      await baixarImagem(png, `${nome}.png`);
      avisar("Imagem PNG baixada.");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao exportar PNG.");
    } finally {
      setExportando(false);
    }
  }, [avisar, foto, modoVisualizacao, params]);

  const copiarWhatsApp = useCallback(async () => {
    const texto = textoWhatsApp(params, lotesProjeto);
    try {
      await navigator.clipboard.writeText(texto);
      avisar("Resumo copiado para o WhatsApp.");
    } catch {
      setErro("Não foi possível copiar automaticamente.");
    }
  }, [avisar, lotesProjeto, params]);

  const exportarPropostaPdf = useCallback(() => {
    abrirProposta(construirProjetoAtual(), lotesProjeto);
  }, [construirProjetoAtual, lotesProjeto]);

  return {
    params,
    personalizado,
    selecionado,
    foto,
    modoVisualizacao,
    historico,
    lotesProjeto,
    totalModulos,
    sugestoesRastreabilidade,
    svgAtivo,
    svgInterativo,
    exportando,
    erro,
    feedback,
    setSelecionado,
    setModoVisualizacao,
    setErro,
    setFeedback,
    updateParams,
    atualizarDimensoes,
    selecionarModelo,
    restaurarLayoutModelo,
    toggleExtra,
    removerLinha,
    adicionarBloco,
    duplicarBloco,
    alternarTampoLinha,
    alternarProfundidadeLinha,
    moverBloco2D,
    ajustarLinhaNaParede,
    adicionarModulo,
    atualizarModulo,
    redimensionarAlturaElemento,
    moverElevacaoLinha,
    removerModulo,
    moverModulo,
    handleUploadFoto,
    removerFoto,
    recarregarRastreabilidade,
    salvarNoHistorico,
    carregarDoHistorico,
    excluirDoHistorico,
    baixarProjetoPng,
    copiarWhatsApp,
    exportarPropostaPdf,
  };
}
