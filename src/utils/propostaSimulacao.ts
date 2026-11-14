import type { ProjetoSimulacao } from "@/models/Simulacao";
import { formatarBRL, resumoProjeto } from "@/models/Simulacao";

const escapar = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Abre a proposta visual em uma nova aba, pronta para "Salvar como PDF". */
export function abrirProposta(projeto: ProjetoSimulacao, mostrarValor: boolean) {
  const resultado = projeto.resultados[projeto.escolhido] ?? projeto.resultados[0];
  if (!resultado) return;
  const janela = window.open("", "_blank");
  if (!janela) {
    alert("Permita pop-ups para gerar a proposta em PDF.");
    return;
  }
  const data = new Date(projeto.criadoEm).toLocaleDateString("pt-BR");
  const cliente = projeto.params.clienteNome.trim() || "Cliente";
  const linhas = resumoProjeto(projeto.params).map((l) => {
    const [k, ...v] = l.split(": ");
    return `<tr><th>${escapar(k)}</th><td>${escapar(v.join(": "))}</td></tr>`;
  });
  const obs = projeto.params.observacoes.trim();

  janela.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" />
<title>Proposta visual — ${escapar(cliente)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Poppins:wght@400;500&family=DM+Mono&display=swap" rel="stylesheet" />
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Poppins, sans-serif; color: #16130F; margin: 0; font-size: 12px; }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid #B08D57; padding-bottom: 10px; margin-bottom: 18px; }
  h1 { font-family: 'Cormorant Garamond', serif; font-size: 30px; font-weight: 600; margin: 0; line-height: 1; }
  .mono { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: .18em; text-transform: uppercase; color: #9C8B76; }
  .dourado { color: #B08D57; }
  .principal { width: 100%; border: 1px solid #E0D6C8; display: block; }
  .grid { display: grid; grid-template-columns: ${projeto.original ? "1fr 1fr" : "1fr"}; gap: 10px; margin-top: 10px; }
  .grid img { width: 100%; aspect-ratio: 4/3; object-fit: cover; border: 1px solid #E0D6C8; }
  table { width: 100%; border-collapse: collapse; margin-top: 18px; }
  th, td { text-align: left; padding: 7px 0; border-bottom: 1px solid #E0D6C8; vertical-align: top; }
  th { width: 34%; font-weight: 500; color: #6F4E37; }
  .valor { margin-top: 18px; padding: 14px 16px; background: #F0EBE3; border-left: 3px solid #B08D57; }
  .valor strong { font-family: 'Cormorant Garamond', serif; font-size: 24px; }
  footer { margin-top: 22px; font-size: 9px; color: #9C8B76; line-height: 1.6; }
  .acoes { position: fixed; top: 12px; right: 12px; }
  .acoes button { font-family: Poppins; background: #B08D57; color: #fff; border: 0; padding: 10px 16px; cursor: pointer; }
  @media print { .acoes { display: none; } }
</style></head><body>
<div class="acoes"><button onclick="window.print()">Salvar como PDF</button></div>
<header>
  <div><div class="mono dourado">BW Arquitetura &amp; Marcenaria</div><h1>Proposta visual</h1></div>
  <div style="text-align:right"><div class="mono">Cliente</div><div style="font-size:14px">${escapar(cliente)}</div><div class="mono" style="margin-top:4px">${data}</div></div>
</header>
<img class="principal" src="${resultado.imagem}" alt="Simulação do projeto" />
${projeto.original ? `<div class="grid"><div><div class="mono">Antes</div><img src="${projeto.original}" alt="Ambiente atual" /></div><div><div class="mono dourado">Depois · simulação</div><img src="${resultado.imagem}" alt="Simulação" /></div></div>` : ""}
<table>${linhas.join("")}${obs ? `<tr><th>Observações</th><td>${escapar(obs)}</td></tr>` : ""}</table>
${mostrarValor ? `<div class="valor"><div class="mono">Investimento estimado</div><strong>${formatarBRL(projeto.estimativa.minimo)} – ${formatarBRL(projeto.estimativa.maximo)}</strong><div style="font-size:10px;color:#6F4E37;margin-top:2px">Valor referencial para ${projeto.estimativa.areaM2.toFixed(2).replace(".", ",")} m² de frente. O orçamento final é confirmado após a medição técnica.</div></div>` : ""}
<footer>Imagem ilustrativa gerada por inteligência artificial a partir das referências do projeto. Cores, texturas e proporções podem variar em relação ao produto final, que segue o projeto executivo aprovado.</footer>
<script>window.onload = () => setTimeout(() => window.print(), 600);</script>
</body></html>`);
  janela.document.close();
}

export function textoWhatsApp(projeto: ProjetoSimulacao, mostrarValor: boolean): string {
  const cliente = projeto.params.clienteNome.trim();
  const linhas = [
    `Olá${cliente ? `, ${cliente.split(" ")[0]}` : ""}! Tudo bem?`,
    "",
    "Preparamos uma primeira simulação visual do seu projeto na BW Arquitetura & Marcenaria:",
    "",
    ...resumoProjeto(projeto.params).map((l) => `• ${l}`),
  ];
  if (mostrarValor) {
    linhas.push("", `Investimento estimado: ${formatarBRL(projeto.estimativa.minimo)} a ${formatarBRL(projeto.estimativa.maximo)} (valor referencial, confirmado após a medição).`);
  }
  linhas.push("", "Vou te enviar as imagens aqui na sequência. O que achou? Podemos ajustar cores e detalhes 😊");
  return linhas.join("\n");
}
