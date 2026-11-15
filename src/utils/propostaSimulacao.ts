import type { ProjetoParams, ProjetoSimulacao } from "@/models/Simulacao";
import type { Rastreabilidade } from "@/models/Rastreabilidade";
import {
  MATERIAIS,
  MATERIAL_FUNDO,
  MODELOS,
  PUXADORES,
  TAMPOS,
  TIPOS_MODULO,
  ehVao,
  encontrar,
  refModulo,
  resumoProjeto,
} from "@/models/Simulacao";
import { gerarSvgProjeto } from "@/utils/desenhoMarcenaria";

function esc(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nomeMaterial(id: string): string {
  if (id === MATERIAL_FUNDO.id) return MATERIAL_FUNDO.label;
  return encontrar(MATERIAIS, id)?.label ?? id;
}

export function abrirProposta(
  projeto: ProjetoSimulacao,
  rastreabilidades: Rastreabilidade[] = []
): void {
  const { params } = projeto;
  const popup = window.open("", "_blank", "width=1020,height=840");
  if (!popup) return;

  const dataFmt = new Date(projeto.criadoEm).toLocaleDateString("pt-BR");
  const modeloLabel = encontrar(MODELOS, params.modelo)?.label ?? params.modelo;
  const caixaLabel = nomeMaterial(params.materialCaixa);
  const frenteLabel = nomeMaterial(params.materialFrente);
  const frenteSupLabel = params.materialFrenteSuperior
    ? nomeMaterial(params.materialFrenteSuperior)
    : frenteLabel;
  const puxadorLabel = encontrar(PUXADORES, params.puxador)?.label ?? params.puxador;
  const tampoLabel = encontrar(TAMPOS, params.tampo)?.label ?? params.tampo;
  const temTampo = params.linhas.some((l) => l.tampo);
  const totalModulos = params.linhas.reduce(
    (s, l) => s + l.modulos.filter((m) => !ehVao(m.tipo)).length,
    0
  );

  const svgPerspectiva = gerarSvgProjeto(params, { modo: "perspectiva", cotas: false });
  const svgElevacao = gerarSvgProjeto(params, { modo: "elevacao", cotas: true });

  const specs = resumoProjeto(params)
    .map((s) => `<span class="tag">${esc(s)}</span>`)
    .join("");

  const modulosLista = params.linhas
    .map((linha, li) =>
      linha.modulos
        .map((m, mi) => {
          const ref = refModulo(li, mi, linha);
          const lbl = encontrar(TIPOS_MODULO, m.tipo)?.label ?? m.tipo;
          const alt = m.alturaCm ?? linha.alturaCm;
          return `<tr>
            <td class="mono">${esc(ref)}</td>
            <td>${esc(linha.nome)}</td>
            <td>${esc(lbl)}</td>
            <td class="mono num">${m.larguraCm} × ${alt} × ${linha.profundidadeCm} cm</td>
          </tr>`;
        })
        .join("")
    )
    .join("");

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Projeto BW — ${esc(params.clienteNome || params.ambienteNome || "Simulação")}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: "Inter", system-ui, -apple-system, sans-serif; color: #1B1A18; margin: 0; font-size: 11px; line-height: 1.45; }
  .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #1B1A18; padding-bottom: 8px; margin-bottom: 12px; }
  .brand { font-size: 9px; letter-spacing: .2em; color: #8A6B3E; font-weight: 700; text-transform: uppercase; }
  h1 { font-size: 18px; margin: 2px 0 3px; font-weight: 600; }
  .meta { font-size: 10.5px; color: #57524A; }
  .date { font-size: 10px; color: #7C7367; text-align: right; }
  .drawings { display: grid; grid-template-columns: 1fr; gap: 10px; margin-bottom: 10px; }
  .drawings.two { grid-template-columns: 1.15fr .85fr; align-items: stretch; }
  .card { border: 1px solid #DDD6CA; border-radius: 6px; padding: 8px; background: #FAF8F4; }
  .card-title { font-size: 9px; letter-spacing: .12em; text-transform: uppercase; color: #7C7367; font-weight: 600; margin-bottom: 6px; }
  .svg-wrap svg { width: 100%; height: auto; max-height: 250px; display: block; border-radius: 4px; }
  .photo-wrap img { width: 100%; height: 220px; object-fit: cover; border-radius: 4px; display: block; }
  .specs { display: flex; flex-wrap: wrap; gap: 5px; margin: 8px 0 10px; }
  .tag { font-size: 9.5px; padding: 3px 7px; border-radius: 4px; background: #F1ECE3; border: 1px solid #E2D9CB; color: #3D3831; }
  .grid-info { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 10px; }
  .info-cell { border: 1px solid #E5DEC9; border-radius: 5px; padding: 6px 8px; background: #fff; }
  .lbl { font-size: 8.5px; letter-spacing: .1em; text-transform: uppercase; color: #8C8275; font-weight: 600; }
  .val { font-size: 11px; font-weight: 600; color: #1B1A18; margin-top: 1px; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 10px; }
  th { text-align: left; font-size: 8.5px; text-transform: uppercase; letter-spacing: .08em; color: #7C7367; border-bottom: 1px solid #D5CEC2; padding: 4px 6px; background: #F5F1EA; }
  td { border-bottom: 1px solid #EFEAE0; padding: 4px 6px; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  .num { text-align: right; }
  .meta-box { border: 1px solid #DDD6CA; border-radius: 6px; padding: 8px 10px; background: #FAF8F4; margin-top: 8px; font-size: 10px; color: #4A443B; display: flex; flex-wrap: wrap; gap: 10px; }
  .obs { font-size: 10px; color: #4A443B; border-left: 3px solid #B08D57; padding-left: 8px; margin: 8px 0; }
  .sign { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-top: 22px; font-size: 10px; color: #57524A; }
  .sign div { border-top: 1px solid #BFB7AA; padding-top: 4px; text-align: center; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">BW Marcenaria · Estudo de Ambiente</div>
      <h1>${esc(params.ambienteNome || modeloLabel)}</h1>
      <div class="meta">
        Cliente: <strong>${esc(params.clienteNome || "A definir")}</strong>
        · Ambiente: ${params.larguraParedeCm} × ${params.peDireitoCm} cm
        · ${totalModulos > 0 ? `${totalModulos} módulo(s)` : "Projeto sob medida"}
      </div>
    </div>
    <div class="date">
      Emissão: ${dataFmt}<br/>
      Ref.: ${esc(projeto.id.slice(0, 8))}
    </div>
  </div>

  ${
    params.linhas.length === 0 && projeto.foto
      ? `<div class="card" style="margin-bottom:10px">
          <div class="card-title">Referência / Esboço do Projeto</div>
          <div class="photo-wrap"><img src="${projeto.foto}" alt="Referência do projeto" style="height:auto;max-height:360px;object-fit:contain;background:#fff" /></div>
        </div>`
      : `<div class="drawings ${projeto.foto ? "two" : ""}">
          <div class="card">
            <div class="card-title">Visualização 3D do Projeto</div>
            <div class="svg-wrap">${svgPerspectiva}</div>
          </div>
          ${
            projeto.foto
              ? `<div class="card">
                  <div class="card-title">Foto / Referência do Local</div>
                  <div class="photo-wrap"><img src="${projeto.foto}" alt="Local do cliente" /></div>
                </div>`
              : ""
          }
        </div>
        <div class="card" style="margin-bottom:10px">
          <div class="card-title">Elevação Técnica Cotada</div>
          <div class="svg-wrap">${svgElevacao}</div>
        </div>`
  }

  <div class="specs">${specs}</div>

  <div class="grid-info">
    <div class="info-cell"><div class="lbl">Caixaria (18 mm)</div><div class="val">${esc(caixaLabel)}</div></div>
    <div class="info-cell"><div class="lbl">Frentes principais</div><div class="val">${esc(frenteLabel)}</div></div>
    <div class="info-cell"><div class="lbl">Frentes superiores</div><div class="val">${esc(frenteSupLabel)}</div></div>
    <div class="info-cell"><div class="lbl">Puxadores</div><div class="val">${esc(puxadorLabel)}</div></div>
    ${
      temTampo
        ? `<div class="info-cell"><div class="lbl">Tampo / Bancada</div><div class="val">${esc(tampoLabel)}</div></div>`
        : ""
    }
  </div>

  ${
    params.linhas.length > 0
      ? `<table>
          <thead>
            <tr><th>Ref.</th><th>Conjunto</th><th>Módulo</th><th class="num">Dimensões (L × A × P)</th></tr>
          </thead>
          <tbody>${modulosLista}</tbody>
        </table>`
      : ""
  }

  ${
    rastreabilidades.length > 0
      ? `<div class="card" style="margin-bottom:10px">
          <div class="card-title">Rastreabilidade e Origem Certificada da Madeira</div>
          <table style="margin-bottom:0">
            <thead>
              <tr><th>Lote</th><th>Material</th><th>Fornecedor</th><th>Origem</th><th>Certificação</th><th class="num">Volume</th></tr>
            </thead>
            <tbody>
              ${rastreabilidades
                .map(
                  (r) => `<tr>
                    <td class="mono">${esc(r.lote)}</td>
                    <td>${esc(r.tipoMadeira)}</td>
                    <td>${esc(r.fornecedor)}</td>
                    <td>${esc(r.origem)}</td>
                    <td>${esc(r.certificacoes)}</td>
                    <td class="num">${esc(r.volume)}</td>
                  </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>`
      : ""
  }

  ${params.observacoes ? `<div class="obs"><strong>Observações:</strong> ${esc(params.observacoes)}</div>` : ""}

  <div class="meta-box">
    <span>Prazo estimado de entrega: <strong>${params.prazoDias} dias úteis</strong></span>
    <span>•</span>
    <span>Validade do estudo: <strong>${params.validadeDias} dias</strong></span>
  </div>

  <div class="sign">
    <div>BW Marcenaria — Responsável Técnico</div>
    <div>De acordo — ${esc(params.clienteNome || "Cliente")}</div>
  </div>

  <script>window.onload = () => setTimeout(() => window.print(), 280);</script>
</body>
</html>`;

  popup.document.open();
  popup.document.write(html);
  popup.document.close();
}

export function textoWhatsApp(
  params: ProjetoParams,
  rastreabilidades: Rastreabilidade[] = []
): string {
  const modeloLabel = encontrar(MODELOS, params.modelo)?.label ?? params.modelo;
  const frente = nomeMaterial(params.materialFrente);
  const frenteSup = params.materialFrenteSuperior
    ? nomeMaterial(params.materialFrenteSuperior)
    : null;
  const puxador = encontrar(PUXADORES, params.puxador)?.label ?? params.puxador;
  const temTampo = params.linhas.some((l) => l.tampo);
  const tampo = encontrar(TAMPOS, params.tampo)?.label ?? params.tampo;
  const totalModulos = params.linhas.reduce(
    (s, l) => s + l.modulos.filter((m) => !ehVao(m.tipo)).length,
    0
  );

  const seloOrigem =
    rastreabilidades.length > 0
      ? `Origem certificada: ${rastreabilidades
          .map((r) => `${r.tipoMadeira} (${r.lote} · ${r.certificacoes})`)
          .join("; ")}`
      : null;

  const linhas = [
    `*BW Marcenaria — Projeto ${params.ambienteNome || modeloLabel}*`,
    params.clienteNome ? `Cliente: ${params.clienteNome}` : null,
    `Medidas da parede: ${params.larguraParedeCm} × ${params.peDireitoCm} cm (${totalModulos > 0 ? `${totalModulos} módulos` : "sob medida"})`,
    `Acabamento: ${frente}${frenteSup ? ` + ${frenteSup} (sup.)` : ""}`,
    `Puxador: ${puxador}${temTampo ? ` | Tampo: ${tampo}` : ""}`,
    seloOrigem,
    `Prazo estimado: ${params.prazoDias} dias úteis`,
    params.observacoes ? `Obs.: ${params.observacoes}` : null,
  ].filter(Boolean);

  return linhas.join("\n");
}
