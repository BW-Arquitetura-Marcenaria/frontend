import {
  EXTRAS,
  MATERIAIS,
  MODELOS,
  PUXADORES,
  TAMPOS,
  encontrar,
} from "@/models/Simulacao";
import type { ProjetoParams } from "@/models/Simulacao";

function cm(valor: number): string {
  return `${Math.round(valor)} cm`;
}

/**
 * Converte os parâmetros do projeto em frases descritivas (pt-BR) para compor
 * o prompt enviado à IA. Não gera texto imperativo — apenas descreve o móvel.
 */
function descreverProjeto(params: ProjetoParams): string[] {
  const partes: string[] = [];

  const ambiente = params.ambienteNome?.trim();
  if (ambiente) partes.push(`Ambiente: ${ambiente}`);

  const modelo = encontrar(MODELOS, params.modelo);
  partes.push(
    `Móvel planejado: ${modelo?.label ?? "projeto sob medida"} em marcenaria sob medida`
  );

  partes.push(
    `Parede de ${cm(params.larguraParedeCm)} de largura com pé-direito de ${cm(
      params.peDireitoCm
    )}`
  );

  const frente = encontrar(MATERIAIS, params.materialFrente);
  if (frente) partes.push(`Acabamento principal em MDF ${frente.label}`);

  if (
    params.materialFrenteSuperior &&
    params.materialFrenteSuperior !== params.materialFrente
  ) {
    const sup = encontrar(MATERIAIS, params.materialFrenteSuperior);
    if (sup) partes.push(`Peças superiores em MDF ${sup.label}`);
  }

  const puxador = encontrar(PUXADORES, params.puxador);
  if (puxador) partes.push(`Puxadores: ${puxador.label}`);

  const temTampo = params.linhas.some((l) => l.tampo);
  if (temTampo) {
    const tampo = encontrar(TAMPOS, params.tampo);
    if (tampo) partes.push(`Tampo/bancada em ${tampo.label}`);
  }

  const extras = params.extras
    .map((id) => encontrar(EXTRAS, id)?.label)
    .filter((v): v is string => Boolean(v));
  if (extras.length > 0) partes.push(`Detalhes: ${extras.join(", ")}`);

  return partes;
}

/**
 * Monta o prompt final em pt-BR para a FLUX.2 [flex] a partir da foto do
 * ambiente, dos parâmetros do projeto e da descrição livre do cliente.
 */
export function montarPromptSimulacao(
  params: ProjetoParams,
  descricaoLivre: string
): string {
  const linhas: string[] = [
    "Redesenhe o ambiente da foto anexada aplicando um projeto de marcenaria",
    "sob medida da BW Arquitetura e Marcenaria, mantendo a perspectiva, a",
    "iluminação e a estrutura do cômodo original e inserindo os móveis descritos",
    "abaixo de forma realista e integrada ao espaço.",
    "",
    "Características do projeto:",
    ...descreverProjeto(params).map((p) => `- ${p}`),
  ];

  const observacoes = params.observacoes?.trim();
  if (observacoes) {
    linhas.push(`- Observações do projeto: ${observacoes}`);
  }

  const desejo = descricaoLivre?.trim();
  if (desejo) {
    linhas.push("", "O que o cliente gostaria de ver:", desejo);
  }

  linhas.push(
    "",
    "Resultado esperado: fotorrealista, alta qualidade, materiais e acabamentos",
    "condizentes com o descrito, sem textos ou marca d'água na imagem."
  );

  return linhas.join("\n");
}