import {
  MATERIAIS,
  PUXADORES,
  TAMPOS,
  encontrar,
  ehLinhaSuperior,
  ehVao,
  larguraLinha,
  materialFrenteDaLinha,
  refModulo,
  type Linha,
  type Modulo,
  type ProjetoParams,
} from "@/models/Simulacao";

// Desenho técnico/ilustrativo da marcenaria gerado 100% no navegador (SVG puro, sem IA).
// O mesmo SVG é usado na tela, na proposta em PDF e na ficha de produção.

export type ElementoSelecionado = { linhaIdx: number; modIdx: number };

export type OpcoesDesenho = {
  modo: "elevacao" | "perspectiva";
  cotas: boolean;
  interativo?: boolean;
  selecionado?: ElementoSelecionado | null;
};

const fmt = (v: number) => (Math.abs(v % 1) > 0.01 ? v.toFixed(1).replace(".", ",") : String(Math.round(v)));

function rgb(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function shade(hex: string, f: number) {
  const { r, g, b } = rgb(hex);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${c(r)},${c(g)},${c(b)})`;
}
const escuro = (hex: string) => {
  const { r, g, b } = rgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b < 140;
};

export function gerarSvgProjeto(p: ProjetoParams, o: OpcoesDesenho): string {
  const L = Math.max(60, p.larguraParedeCm);
  const maxLinhaW = Math.max(L, ...p.linhas.map((l) => (l.inicioCm ?? 0) + larguraLinha(l)));
  const pd = Math.max(200, p.peDireitoCm);
  const persp = o.modo === "perspectiva";
  const c = persp ? 0.42 : 0;
  const f = Math.max(L, pd) / 55;
  const sw = f * 0.06;
  const maxD = Math.min(80, Math.max(0, ...p.linhas.map((l) => l.profundidadeCm)));

  const mL = (o.cotas ? f * 5.5 : f) + maxD * c;
  const mR = o.cotas ? f * 6.5 : f;
  const mT = o.cotas ? f * 4.5 : f;
  const mB = (o.cotas ? f * 8 : f * 1.5) + maxD * c;
  const W = mL + maxLinhaW + mR;
  const H = mT + pd + mB;

  const sx = (x: number, z = 0) => mL + x - z * c;
  const sy = (y: number, z = 0) => mT + (pd - y) + z * c;
  const poly = (pts: [number, number, number][], fill: string, extra = "") => {
    const strokeAttr = extra.includes("stroke=") ? "" : `stroke="#2B2620" `;
    return `<polygon points="${pts.map(([x, y, z]) => `${sx(x, z).toFixed(2)},${sy(y, z).toFixed(2)}`).join(" ")}" fill="${fill}" ${strokeAttr}stroke-width="${sw}" stroke-linejoin="round" ${extra}/>`;
  };
  const rect = (x: number, y: number, w: number, h: number, z: number, fill: string, extra = "") =>
    w > 0 && h > 0
      ? `<rect x="${sx(x, z).toFixed(2)}" y="${sy(y + h, z).toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" fill="${fill}" ${extra}/>`
      : "";
  const texto = (x: number, y: number, s: string, size: number, fill = "#2B2620", anchor = "middle", extra = "") =>
    `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" font-size="${size.toFixed(2)}" fill="${fill}" text-anchor="${anchor}" ${extra}>${s}</text>`;

  const led = p.extras.includes("led");
  const puxador = encontrar(PUXADORES, p.puxador) ?? PUXADORES[0];
  const caixaCor = encontrar(MATERIAIS, p.materialCaixa)?.cor ?? "#F2F0EB";

  const defs: string[] = [
    `<linearGradient id="g-led" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE7A3" stop-opacity=".95"/><stop offset=".35" stop-color="#F7C66A" stop-opacity=".45"/><stop offset="1" stop-color="#F7C66A" stop-opacity="0"/></linearGradient>`,
    `<linearGradient id="g-led-up" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FFE7A3" stop-opacity=".8"/><stop offset="1" stop-color="#F7C66A" stop-opacity="0"/></linearGradient>`,
    `<linearGradient id="g-espelho" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D5DFE6"/><stop offset=".45" stop-color="#F4F8FA"/><stop offset=".55" stop-color="#C3D0DA"/><stop offset="1" stop-color="#DCE5EC"/></linearGradient>`,
    `<linearGradient id="g-inox" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C9CDD0"/><stop offset=".5" stop-color="#E6E8EA"/><stop offset="1" stop-color="#B9BEC2"/></linearGradient>`,
    `<linearGradient id="g-tv" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#15171A"/><stop offset=".5" stop-color="#2A2E34"/><stop offset="1" stop-color="#0F1012"/></linearGradient>`,
    `<linearGradient id="g-sombra" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>`,
    `<linearGradient id="g-parede" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7F5F0"/><stop offset="1" stop-color="#ECE8E0"/></linearGradient>`,
  ];
  for (const m of MATERIAIS.filter((x) => x.madeirado)) {
    defs.push(
      `<pattern id="wood-${m.id}" width="7" height="60" patternUnits="userSpaceOnUse"><rect width="7" height="60" fill="${m.cor}"/><path d="M1.2 0 Q2.4 30 1.2 60 M3.6 0 Q2.8 30 3.8 60 M5.8 0 L5.6 60" stroke="${shade(m.cor, 0.78)}" stroke-width=".35" fill="none" opacity=".7"/><path d="M2.5 0 Q3.2 30 2.4 60" stroke="${shade(m.cor, 1.12)}" stroke-width=".5" fill="none" opacity=".5"/></pattern>`
    );
  }
  const fillMat = (id: string) => {
    const m = encontrar(MATERIAIS, id);
    if (!m) return "#E6DCCB";
    return m.madeirado ? `url(#wood-${m.id})` : m.cor;
  };
  const corMat = (id: string) => encontrar(MATERIAIS, id)?.cor ?? "#E6DCCB";

  const parede: string[] = [];
  const corpo: string[] = [];
  const cotas: string[] = [];

  // ─── Parede, teto e piso ───
  parede.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="#FBFAF7"/>`);
  parede.push(rect(0, 0, L, pd, 0, "url(#g-parede)", `stroke="#CFC6B8" stroke-width="${sw}"`));
  if (persp) {
    const profPiso = maxD + 35;
    parede.push(poly([[0, 0, 0], [L, 0, 0], [L, 0, profPiso], [0, 0, profPiso]], "#E4DED4", `stroke="#CFC6B8"`));
    for (let x = 0; x <= L; x += 60) {
      parede.push(`<line x1="${sx(x, 0)}" y1="${sy(0, 0)}" x2="${sx(x, profPiso)}" y2="${sy(0, profPiso)}" stroke="#D3CBBF" stroke-width="${sw}"/>`);
    }
  } else {
    parede.push(`<line x1="${sx(-f * 0.6)}" y1="${sy(0)}" x2="${sx(L + f * 0.6)}" y2="${sy(0)}" stroke="#3B352E" stroke-width="${sw * 3}"/>`);
    parede.push(`<line x1="${sx(-f * 0.6)}" y1="${sy(pd)}" x2="${sx(L + f * 0.6)}" y2="${sy(pd)}" stroke="#9A9083" stroke-width="${sw}" stroke-dasharray="${f * 0.5} ${f * 0.35}"/>`);
  }

  // ─── Componentes de frente ───
  const alcaH = (x: number, y: number, comp: number, z: number) =>
    rect(x - comp / 2, y - 0.6, comp, 1.2, z, puxador.cor, `rx="0.5"`);
  const alcaV = (x: number, y: number, comp: number, z: number) =>
    rect(x - 0.6, y - comp / 2, 1.2, comp, z, puxador.cor, `rx="0.5"`);

  /** Porta/frente com fresta, borda e puxador. `abertura`: lado do puxador. */
  const frente = (
    x: number, y: number, w: number, h: number, z: number, fill: string, corBase: string,
    abertura: "esq" | "dir" | "cima" | "baixo"
  ) => {
    const g = 0.35;
    const out: string[] = [];
    out.push(rect(x, y, w, h, z, "#1E1A16"));
    out.push(rect(x + g, y + g, w - 2 * g, h - 2 * g, z, fill, `stroke="${shade(corBase, 0.72)}" stroke-width="${sw}"`));
    if (puxador.tipo === "cava") {
      if (abertura === "cima") out.push(rect(x + g, y + h - g - 1.4, w - 2 * g, 1.4, z, puxador.cor));
      else if (abertura === "baixo") out.push(rect(x + g, y + g, w - 2 * g, 1.4, z, puxador.cor));
      else {
        const xx = abertura === "dir" ? x + w - g - 1.4 : x + g;
        out.push(rect(xx, y + g, 1.4, h - 2 * g, z, puxador.cor));
      }
    } else if (puxador.tipo === "alca") {
      if (abertura === "cima") out.push(alcaH(x + w / 2, y + h - 5, Math.min(w * 0.45, 18), z));
      else if (abertura === "baixo") out.push(alcaH(x + w / 2, y + 5, Math.min(w * 0.45, 18), z));
      else {
        const xx = abertura === "dir" ? x + w - 4 : x + 4;
        const yc = Math.min(y + h - 18, Math.max(y + 18, 105));
        out.push(alcaV(xx, yc, Math.min(h * 0.35, 30), z));
      }
    }
    return out.join("");
  };

  const interior = (x: number, y: number, w: number, h: number, z: number) => {
    const out: string[] = [];
    out.push(rect(x, y, w, h, z, shade(caixaCor, 0.62)));
    out.push(rect(x + 1.8, y + 1.8, w - 3.6, h - 3.6, z, shade(caixaCor, 0.9)));
    out.push(rect(x + 1.8, y + h - 1.8 - Math.min(10, h * 0.25), w - 3.6, Math.min(10, h * 0.25), z, "url(#g-sombra)"));
    if (led) out.push(rect(x + 1.8, y + h - 1.8 - Math.min(14, h * 0.35), w - 3.6, Math.min(14, h * 0.35), z, "url(#g-led)"));
    return out.join("");
  };
  const prateleira = (x: number, y: number, w: number, z: number) =>
    rect(x + 1.8, y, w - 3.6, 1.8, z, caixaCor, `stroke="${shade(caixaCor, 0.7)}" stroke-width="${sw}"`) +
    rect(x + 1.8, y - 3, w - 3.6, 3, z, "url(#g-sombra)", `transform="scale(1,1)" opacity=".6"`);

  const desenharModulo = (l: Linha, m: Modulo, x: number, mi: number, superior: boolean, fillF: string, corF: string, li: number) => {
    const z = l.profundidadeCm;
    const h = m.alturaCm || l.alturaCm;
    const y = l.elevacaoCm + l.alturaCm - h;
    const w = m.larguraCm;
    const out: string[] = [];
    const vert = superior ? "baixo" : "cima";
    const alto = h > 120;

    switch (m.tipo) {
      case "porta":
        out.push(frente(x, y, w, h, z, fillF, corF, alto ? (mi % 2 ? "esq" : "dir") : l.elevacaoCm > 120 ? "baixo" : alto ? "dir" : vert));
        break;
      case "duas-portas":
        if (alto) {
          out.push(frente(x, y, w / 2, h, z, fillF, corF, "dir"));
          out.push(frente(x + w / 2, y, w / 2, h, z, fillF, corF, "esq"));
        } else {
          out.push(frente(x, y, w / 2, h, z, fillF, corF, vert));
          out.push(frente(x + w / 2, y, w / 2, h, z, fillF, corF, vert));
        }
        break;
      case "basculante":
        out.push(frente(x, y, w, h, z, fillF, corF, superior ? "baixo" : "cima"));
        break;
      case "gaveteiro": {
        const hg = alto ? 80 : h;
        if (alto) {
          out.push(interior(x, y + hg, w, h - hg, z));
          const n = Math.max(1, Math.floor((h - hg) / 38));
          for (let i = 1; i <= n; i++) out.push(prateleira(x, y + hg + ((h - hg) / (n + 1)) * i, w, z));
        }
        let yy = y + hg;
        for (const fr of [0.25, 0.35, 0.4]) {
          const hh = hg * fr;
          yy -= hh;
          out.push(frente(x, yy, w, hh, z, fillF, corF, "cima"));
        }
        break;
      }
      case "vidro":
      case "espelho": {
        const n = w > 60 ? 2 : 1;
        const wp = w / n;
        for (let i = 0; i < n; i++) {
          const xx = x + i * wp;
          out.push(rect(xx, y, wp, h, z, "#1E1A16"));
          if (m.tipo === "vidro") {
            out.push(rect(xx + 0.35, y + 0.35, wp - 0.7, h - 0.7, z, "#2A2826"));
            out.push(rect(xx + 2, y + 2, wp - 4, h - 4, z, "#C3D1D7", `opacity=".85"`));
            if (led) out.push(rect(xx + 2, y + h - 2 - Math.min(18, h * 0.4), wp - 4, Math.min(18, h * 0.4), z, "url(#g-led)", `opacity=".7"`));
            for (let fx = xx + 3; fx < xx + wp - 3; fx += 1.6) {
              out.push(rect(fx, y + 2, 0.5, h - 4, z, "#FFFFFF", `opacity=".35"`));
            }
            const nPrat = Math.max(1, Math.floor(h / 35));
            for (let k = 1; k <= nPrat; k++) out.push(rect(xx + 2, y + (h / (nPrat + 1)) * k, wp - 4, 0.8, z, "#7E8C92", `opacity=".5"`));
          } else {
            out.push(rect(xx + 0.35, y + 0.35, wp - 0.7, h - 0.7, z, "url(#g-espelho)", `stroke="#9AA6AE" stroke-width="${sw}"`));
            out.push(`<line x1="${sx(xx + wp * 0.2, z)}" y1="${sy(y + h * 0.8, z)}" x2="${sx(xx + wp * 0.55, z)}" y2="${sy(y + h * 0.35, z)}" stroke="#fff" stroke-width="${f * 0.25}" opacity=".6"/>`);
          }
          if (puxador.tipo === "alca" && m.tipo === "vidro") {
            out.push(alcaH(xx + wp / 2, superior ? y + 5 : y + h - 5, Math.min(wp * 0.4, 16), z));
          }
        }
        break;
      }
      case "nicho":
        out.push(interior(x, y, w, h, z));
        if (h > 60) out.push(prateleira(x, y + h / 2, w, z));
        break;
      case "prateleiras": {
        out.push(interior(x, y, w, h, z));
        const n = Math.max(2, Math.floor(h / 35));
        for (let i = 1; i <= n; i++) out.push(prateleira(x, y + (h / (n + 1)) * i, w, z));
        break;
      }
      case "cabideiro": {
        out.push(interior(x, y, w, h, z));
        const yPrat = y + h * 0.86;
        out.push(prateleira(x, yPrat, w, z));
        const yTubo = yPrat - 6;
        const roupas = Math.max(2, Math.floor((w - 6) / 5));
        const cores = ["#D8D2C7", "#B9AFA0", "#8C8172", "#E9E4DA", "#A7B0B5"];
        for (let i = 0; i < roupas; i++) {
          const rx = x + 3 + i * ((w - 6) / roupas);
          const comp = Math.min(h * 0.5, 75 + ((i * 17) % 30));
          out.push(rect(rx + 0.4, yTubo - comp, (w - 6) / roupas - 0.8, comp, z, cores[i % cores.length], `rx="1" opacity=".9"`));
        }
        out.push(rect(x + 1.8, yTubo - 0.5, w - 3.6, 1.2, z, "#8E9499"));
        break;
      }
      case "adega": {
        out.push(interior(x, y, w, h, z));
        const cols = Math.max(2, Math.min(8, Math.floor((w - 4) / 14)));
        const rows = Math.max(2, Math.min(8, Math.floor((h - 4) / 14)));
        const cw = (w - 3.6) / cols;
        const ch = (h - 3.6) / rows;
        for (let r = 1; r < rows; r++) {
          out.push(rect(x + 1.8, y + 1.8 + r * ch - 0.5, w - 3.6, 1.0, z, corF, `stroke="${shade(corF, 0.7)}" stroke-width="${sw}"`));
        }
        for (let col = 1; col < cols; col++) {
          out.push(rect(x + 1.8 + col * cw - 0.5, y + 1.8, 1.0, h - 3.6, z, corF, `stroke="${shade(corF, 0.7)}" stroke-width="${sw}"`));
        }
        const rad = Math.min(cw, ch) * 0.27;
        for (let r = 0; r < rows; r++) {
          for (let col = 0; col < cols; col++) {
            if ((r + col) % 4 === 1) continue;
            const cx = sx(x + 1.8 + (col + 0.5) * cw, z);
            const cy = sy(y + 1.8 + (r + 0.5) * ch, z);
            const corGarrafa = (r + col) % 2 === 0 ? "#243728" : "#441E24";
            out.push(`<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${rad.toFixed(2)}" fill="${corGarrafa}" stroke="#171411" stroke-width="${sw}"/>`);
            out.push(`<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${(rad * 0.36).toFixed(2)}" fill="#C69D5C"/>`);
          }
        }
        break;
      }
      case "vao":
        out.push(rect(x + 0.5, y + 0.5, w - 1, h - 1, z, "transparent", `stroke="#9A9083" stroke-width="${sw}" stroke-dasharray="${f * 0.4} ${f * 0.3}"`));
        out.push(texto(sx(x + w / 2, z), sy(y + h / 2, z), "VÃO LIVRE", f * 0.55, "#9A9083"));
        break;
      case "vao-geladeira": {
        const hg = Math.min(176, pd - 48);
        const zg = Math.min(70, z + 8);
        if (persp) {
          out.push(poly([[x + w - 2, 0, zg], [x + w - 2, 0, 0], [x + w - 2, hg, 0], [x + w - 2, hg, zg]], "#AEB3B7"));
          out.push(poly([[x + 2, hg, zg], [x + w - 2, hg, zg], [x + w - 2, hg, 0], [x + 2, hg, 0]], "#D9DCDE"));
        }
        out.push(rect(x + 2, 0, w - 4, hg, zg, "url(#g-inox)", `stroke="#8E9499" stroke-width="${sw}" rx="1.5"`));
        out.push(`<line x1="${sx(x + 2, zg)}" y1="${sy(hg * 0.68, zg)}" x2="${sx(x + w - 2, zg)}" y2="${sy(hg * 0.68, zg)}" stroke="#8E9499" stroke-width="${sw * 2}"/>`);
        out.push(rect(x + 6, hg * 0.74, 1.2, 18, zg, "#7D8388", `rx=".5"`));
        out.push(rect(x + 6, hg * 0.38, 1.2, 26, zg, "#7D8388", `rx=".5"`));
        if (o.cotas) out.push(texto(sx(x + w / 2, zg), sy(hg * 0.5, zg), "GELADEIRA", f * 0.5, "#6E757A"));
        break;
      }
    }

    if (o.cotas && !ehVao(m.tipo)) {
      const ref = refModulo(li, mi, l);
      const cor = escuro(corF) ? "#F5F0E8" : "#3B352E";
      out.push(texto(sx(x + 1.5, z), sy(y + 1.6, z), ref, f * 0.45, cor, "start", `font-weight="bold" opacity=".75"`));
    }
    return out.join("");
  };

  // ─── Efeitos na parede (LED sob aéreos, sombras de móveis suspensos) ───
  for (const l of p.linhas) {
    if (l.tipo !== "caixa") continue;
    const x0 = l.inicioCm ?? 0;
    const largura = larguraLinha(l);
    if (led && ehLinhaSuperior(l) && l.elevacaoCm > 100) {
      parede.push(rect(x0, Math.max(0, l.elevacaoCm - 40), largura, Math.min(40, l.elevacaoCm), 0, "url(#g-led)"));
    }
    if (l.elevacaoCm > 15 && !ehLinhaSuperior(l)) {
      parede.push(rect(x0 + 2, l.elevacaoCm - 6, Math.max(0, largura - 4), 6, 0, "url(#g-sombra)"));
    }
  }

  // ─── Corpo dos móveis ───
  const desenharFaces3D = (l: Linha, m: Modulo, mi: number, x: number, corF: string) => {
    if (!persp || ehVao(m.tipo)) return "";
    const z = l.profundidadeCm;
    const h = m.alturaCm || l.alturaCm;
    const y0 = l.elevacaoCm + l.alturaCm - h;
    const y1 = l.elevacaoCm + l.alturaCm;
    const w = m.larguraCm;
    const out: string[] = [];
    const prox = l.modulos[mi + 1];
    if (!prox || ehVao(prox.tipo)) {
      out.push(poly([[x + w, y0, z], [x + w, y0, 0], [x + w, y1, 0], [x + w, y1, z]], shade(corF, 0.68)));
    } else {
      const proxH = prox.alturaCm || l.alturaCm;
      const proxY0 = l.elevacaoCm + l.alturaCm - proxH;
      const proxY1 = l.elevacaoCm + l.alturaCm;
      if (proxY0 > y0) {
        out.push(poly([[x + w, y0, z], [x + w, y0, 0], [x + w, proxY0, 0], [x + w, proxY0, z]], shade(corF, 0.68)));
      }
      if (proxY1 < y1) {
        out.push(poly([[x + w, proxY1, z], [x + w, proxY1, 0], [x + w, y1, 0], [x + w, y1, z]], shade(corF, 0.68)));
      }
    }
    out.push(poly([[x, y1, z], [x + w, y1, z], [x + w, y1, 0], [x, y1, 0]], shade(corF, 1.08)));
    return out.join("");
  };

  const ordenadas = [...p.linhas.entries()].sort((a, b) => a[1].profundidadeCm - b[1].profundidadeCm);
  const geladeiras: { l: Linha; m: Modulo; x: number; mi: number; superior: boolean; fillF: string; corF: string; li: number }[] = [];
  const sobreGeladeira: { l: Linha; m: Modulo; x: number; mi: number; superior: boolean; fillF: string; corF: string; li: number }[] = [];

  const envolver = (li: number, mi: number, conteudo: string) =>
    o.interativo ? `<g data-elemento="modulo" data-linha="${li}" data-modulo="${mi}">${conteudo}</g>` : conteudo;
  const noPtr = o.interativo ? `pointer-events="none"` : "";

  for (const [li, l] of ordenadas) {
    const matF = materialFrenteDaLinha(p, l);
    const fillF = fillMat(matF);
    const corF = corMat(matF);
    const superior = ehLinhaSuperior(l);
    const z = l.profundidadeCm;
    const x0 = l.inicioCm ?? 0;

    if (l.tipo === "painel") {
      const largura = larguraLinha(l);
      const painelOut: string[] = [];
      if (persp) {
        painelOut.push(poly([[x0 + largura, l.elevacaoCm, z], [x0 + largura, l.elevacaoCm, 0], [x0 + largura, l.elevacaoCm + l.alturaCm, 0], [x0 + largura, l.elevacaoCm + l.alturaCm, z]], shade(corF, 0.7)));
        painelOut.push(poly([[x0, l.elevacaoCm + l.alturaCm, z], [x0 + largura, l.elevacaoCm + l.alturaCm, z], [x0 + largura, l.elevacaoCm + l.alturaCm, 0], [x0, l.elevacaoCm + l.alturaCm, 0]], shade(corF, 1.08)));
      }
      painelOut.push(rect(x0, l.elevacaoCm, largura, l.alturaCm, z, fillF, `stroke="#2B2620" stroke-width="${sw}"`));
      if (p.extras.includes("ripado")) {
        for (let x = x0 + 2; x < x0 + largura - 1; x += 4) painelOut.push(rect(x, l.elevacaoCm, 1.4, l.alturaCm, z, "#1E1A16", `opacity=".38" ${noPtr}`));
      }
      if (led) painelOut.push(rect(x0 + 1, l.elevacaoCm + l.alturaCm - 22, Math.max(0, largura - 2), 22, z, "url(#g-led)", `opacity=".8" ${noPtr}`));
      if (p.modelo === "painel-tv") {
        const tvW = Math.min(largura * 0.55, 165);
        const tvH = tvW * 0.5625;
        const rack = p.linhas.find((x) => x.tipo === "caixa");
        const base = (rack ? rack.elevacaoCm + rack.alturaCm : 70) + 22;
        painelOut.push(rect(x0 + (largura - tvW) / 2 + 1.2, base - 1.5, tvW, tvH, z + 4, "#000", `opacity=".25" ${noPtr}`));
        painelOut.push(rect(x0 + (largura - tvW) / 2, base, tvW, tvH, z + 4, "url(#g-tv)", `stroke="#444" stroke-width="${sw * 2}" rx="0.8" ${noPtr}`));
      }
      corpo.push(envolver(li, 0, painelOut.join("")));
      continue;
    }

    // Rodapé recuado
    let x = x0;
    const segmentosRodape: [number, number][] = [];
    for (const m of l.modulos) {
      if (!ehVao(m.tipo)) segmentosRodape.push([x, m.larguraCm]);
      x += m.larguraCm;
    }
    if (l.elevacaoCm > 0 && l.elevacaoCm <= 20) {
      for (const [sx0, w] of segmentosRodape) corpo.push(rect(sx0 + 1, 0, w - 2, l.elevacaoCm, z - 5, "#24201C", noPtr));
    }

    const hgRef = Math.min(176, pd - 48);
    x = x0;
    l.modulos.forEach((m, mi) => {
      const h = m.alturaCm || l.alturaCm;
      const y0 = l.elevacaoCm + l.alturaCm - h;
      if (m.tipo === "vao-geladeira") {
        geladeiras.push({ l, m, x, mi, superior, fillF, corF, li });
      } else if (persp && y0 >= hgRef) {
        sobreGeladeira.push({ l, m, x, mi, superior, fillF, corF, li });
      } else {
        corpo.push(envolver(li, mi, desenharFaces3D(l, m, mi, x, corF) + desenharModulo(l, m, x, mi, superior, fillF, corF, li)));
      }
      x += m.larguraCm;
    });

    // Tampo (desenhado antes da geladeira para não cortar a porta em perspectiva)
    if (l.tampo) {
      const t = encontrar(TAMPOS, p.tampo);
      const corT = t?.cor || corF;
      const yT = l.elevacaoCm + l.alturaCm;
      let xs = x0;
      const blocos: [number, number][] = [];
      for (const m of l.modulos) {
        if (m.tipo !== "vao-geladeira") {
          const ult = blocos[blocos.length - 1];
          if (ult && ult[0] + ult[1] === xs) ult[1] += m.larguraCm;
          else blocos.push([xs, m.larguraCm]);
        }
        xs += m.larguraCm;
      }
      for (const [bx, bw] of blocos) {
        if (persp) {
          corpo.push(poly([[bx, yT + 3, z + 2], [bx + bw, yT + 3, z + 2], [bx + bw, yT + 3, 0], [bx, yT + 3, 0]], shade(corT, 1.04), noPtr));
          corpo.push(poly([[bx + bw, yT, z + 2], [bx + bw, yT, 0], [bx + bw, yT + 3, 0], [bx + bw, yT + 3, z + 2]], shade(corT, 0.75), noPtr));
        }
        corpo.push(rect(bx, yT, bw, 3, z + 2, corT, `stroke="#2B2620" stroke-width="${sw}" ${noPtr}`));
      }
    }
  }

  // Geladeiras (frente de balcões/tampos) e módulos altos acima delas (>= 180 cm)
  for (const g of geladeiras) {
    corpo.push(envolver(g.li, g.mi, desenharModulo(g.l, g.m, g.x, g.mi, g.superior, g.fillF, g.corF, g.li)));
  }
  for (const s of sobreGeladeira) {
    corpo.push(envolver(s.li, s.mi, desenharFaces3D(s.l, s.m, s.mi, s.x, s.corF) + desenharModulo(s.l, s.m, s.x, s.mi, s.superior, s.fillF, s.corF, s.li)));
  }

  // ─── Cotas ───
  if (o.cotas) {
    const corCota = "#8C6D3F";
    const linhaH = (x1: number, x2: number, yScr: number, label: string, size = f * 0.62) => {
      cotas.push(`<line x1="${x1}" y1="${yScr}" x2="${x2}" y2="${yScr}" stroke="${corCota}" stroke-width="${sw * 1.4}"/>`);
      for (const xx of [x1, x2]) cotas.push(`<line x1="${xx - f * 0.25}" y1="${yScr + f * 0.25}" x2="${xx + f * 0.25}" y2="${yScr - f * 0.25}" stroke="${corCota}" stroke-width="${sw * 2}"/>`);
      cotas.push(texto((x1 + x2) / 2, yScr - f * 0.3, label, size, "#2B2620", "middle", `font-weight="bold"`));
    };
    const linhaV = (xScr: number, y1: number, y2: number, label: string) => {
      cotas.push(`<line x1="${xScr}" y1="${y1}" x2="${xScr}" y2="${y2}" stroke="${corCota}" stroke-width="${sw * 1.4}"/>`);
      for (const yy of [y1, y2]) cotas.push(`<line x1="${xScr - f * 0.25}" y1="${yy + f * 0.25}" x2="${xScr + f * 0.25}" y2="${yy - f * 0.25}" stroke="${corCota}" stroke-width="${sw * 2}"/>`);
      const ym = (y1 + y2) / 2;
      if (Math.abs(y2 - y1) > f * 1.4) cotas.push(texto(xScr - f * 0.35, ym, label, f * 0.6, "#2B2620", "middle", `font-weight="bold" transform="rotate(-90 ${xScr - f * 0.35} ${ym})"`));
    };

    const caixas = p.linhas.filter((l) => l.modulos.length > 0);
    const baixa = [...caixas].sort((a, b) => a.elevacaoCm - b.elevacaoCm)[0];
    const alta = [...caixas].sort((a, b) => b.elevacaoCm + b.alturaCm - (a.elevacaoCm + a.alturaCm))[0];

    if (baixa) {
      const z = baixa.profundidadeCm;
      const y = sy(0, z) + f * 2;
      let x = baixa.inicioCm ?? 0;
      for (const m of baixa.modulos) {
        linhaH(sx(x, z), sx(x + m.larguraCm, z), y, fmt(m.larguraCm), f * 0.55);
        x += m.larguraCm;
      }
    }
    if (alta && alta !== baixa && alta.tipo === "caixa") {
      const z = alta.profundidadeCm;
      const y = sy(alta.elevacaoCm + alta.alturaCm, z) - f * 1.4;
      let x = alta.inicioCm ?? 0;
      for (const m of alta.modulos) {
        linhaH(sx(x, z), sx(x + m.larguraCm, z), y, fmt(m.larguraCm), f * 0.55);
        x += m.larguraCm;
      }
    }
    linhaH(sx(0, maxD), sx(L, maxD), sy(0, maxD) + f * 4.6, `${fmt(L)} cm`, f * 0.75);

    const quebras = new Set<number>([0, pd]);
    for (const l of p.linhas) {
      quebras.add(l.elevacaoCm);
      quebras.add(l.elevacaoCm + l.alturaCm + (l.tampo ? 3 : 0));
    }
    const ys = [...quebras].filter((v) => v >= 0 && v <= pd).sort((a, b) => a - b);
    const xV = sx(maxLinhaW) + f * 2.6;
    for (let i = 0; i < ys.length - 1; i++) linhaV(xV, sy(ys[i]), sy(ys[i + 1]), fmt(ys[i + 1] - ys[i]));
    linhaV(mL - maxD * c - f * 2.6, sy(0), sy(pd), `${fmt(pd)} cm`);
  }

  // ─── Destaque de seleção e alças diretas na imagem ───
  const selecao: string[] = [];
  if (o.interativo && o.selecionado) {
    const { linhaIdx, modIdx } = o.selecionado;
    const l = p.linhas[linhaIdx];
    const m = l?.modulos[modIdx];
    if (l && m) {
      const zBase = l.profundidadeCm;
      let x = l.inicioCm ?? 0;
      let y = l.elevacaoCm;
      let w = m.larguraCm;
      let h = m.alturaCm || l.alturaCm;
      let z = zBase;

      if (l.tipo === "painel") {
        w = larguraLinha(l);
      } else {
        for (let i = 0; i < modIdx; i++) x += l.modulos[i].larguraCm;
        y = l.elevacaoCm + l.alturaCm - h;
        if (m.tipo === "vao-geladeira") {
          h = Math.min(176, pd - 48);
          y = 0;
          z = Math.min(70, zBase + 8);
        }
      }

      selecao.push(
        rect(
          x + 0.4,
          y + 0.4,
          Math.max(2, w - 0.8),
          Math.max(2, h - 0.8),
          z,
          "rgba(176,141,87,0.12)",
          `stroke="#B08D57" stroke-width="${(sw * 4).toFixed(2)}" pointer-events="none"`
        )
      );

      // Alça direita para alterar largura arrastando na imagem
      const rx = sx(x + w, z);
      const ry = sy(y + h / 2, z);
      const hr = Math.max(2.2, f * 0.55);
      selecao.push(`<g data-handle="largura" data-linha="${linhaIdx}" data-modulo="${modIdx}" style="cursor:ew-resize">`);
      selecao.push(`<circle cx="${rx.toFixed(2)}" cy="${ry.toFixed(2)}" r="${(hr * 2.3).toFixed(2)}" fill="transparent"/>`);
      selecao.push(`<rect x="${(rx - hr * 0.65).toFixed(2)}" y="${(ry - hr * 1.6).toFixed(2)}" width="${(hr * 1.3).toFixed(2)}" height="${(hr * 3.2).toFixed(2)}" rx="${(hr * 0.55).toFixed(2)}" fill="#1B1A18" stroke="#B08D57" stroke-width="${(sw * 2.2).toFixed(2)}"/>`);
      selecao.push(`<line x1="${rx.toFixed(2)}" y1="${(ry - hr * 0.8).toFixed(2)}" x2="${rx.toFixed(2)}" y2="${(ry + hr * 0.8).toFixed(2)}" stroke="#FAF8F4" stroke-width="${(sw * 1.6).toFixed(2)}" stroke-linecap="round" pointer-events="none"/>`);
      selecao.push(`</g>`);

      // Alça superior para alterar altura arrastando na imagem
      if (m.tipo !== "vao-geladeira") {
        const tx = sx(x + w / 2, z);
        const ty = sy(y + h, z);
        selecao.push(`<g data-handle="altura" data-linha="${linhaIdx}" data-modulo="${modIdx}" style="cursor:ns-resize">`);
        selecao.push(`<circle cx="${tx.toFixed(2)}" cy="${ty.toFixed(2)}" r="${(hr * 2.3).toFixed(2)}" fill="transparent"/>`);
        selecao.push(`<rect x="${(tx - hr * 1.6).toFixed(2)}" y="${(ty - hr * 0.65).toFixed(2)}" width="${(hr * 3.2).toFixed(2)}" height="${(hr * 1.3).toFixed(2)}" rx="${(hr * 0.55).toFixed(2)}" fill="#1B1A18" stroke="#B08D57" stroke-width="${(sw * 2.2).toFixed(2)}"/>`);
        selecao.push(`<line x1="${(tx - hr * 0.8).toFixed(2)}" y1="${ty.toFixed(2)}" x2="${(tx + hr * 0.8).toFixed(2)}" y2="${ty.toFixed(2)}" stroke="#FAF8F4" stroke-width="${(sw * 1.6).toFixed(2)}" stroke-linecap="round" pointer-events="none"/>`);
        selecao.push(`</g>`);
      }

      // Alça no canto superior esquerdo para mover o bloco inteiro livremente em X e Y
      const mx = sx(x, z);
      const my = sy(y + h, z);
      selecao.push(`<g data-handle="mover" data-linha="${linhaIdx}" data-modulo="${modIdx}" style="cursor:move">`);
      selecao.push(`<circle cx="${mx.toFixed(2)}" cy="${my.toFixed(2)}" r="${(hr * 2.3).toFixed(2)}" fill="transparent"/>`);
      selecao.push(`<circle cx="${mx.toFixed(2)}" cy="${my.toFixed(2)}" r="${(hr * 1.25).toFixed(2)}" fill="#B08D57" stroke="#FFFFFF" stroke-width="${(sw * 2).toFixed(2)}"/>`);
      selecao.push(`<line x1="${(mx - hr * 0.65).toFixed(2)}" y1="${my.toFixed(2)}" x2="${(mx + hr * 0.65).toFixed(2)}" y2="${my.toFixed(2)}" stroke="#FFFFFF" stroke-width="${(sw * 1.5).toFixed(2)}" pointer-events="none"/>`);
      selecao.push(`<line x1="${mx.toFixed(2)}" y1="${(my - hr * 0.65).toFixed(2)}" x2="${mx.toFixed(2)}" y2="${(my + hr * 0.65).toFixed(2)}" stroke="#FFFFFF" stroke-width="${(sw * 1.5).toFixed(2)}" pointer-events="none"/>`);
      selecao.push(`</g>`);
    }
  }

  const estiloInterativo = o.interativo
    ? `<style>[data-elemento]{cursor:grab;transition:opacity .12s ease}[data-elemento]:hover{opacity:.88}</style>`
    : "";
  const cotasXml = o.interativo && cotas.length > 0 ? `<g pointer-events="none">${cotas.join("")}</g>` : cotas.join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W.toFixed(1)} ${H.toFixed(1)}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" font-family="'DM Mono', ui-monospace, monospace"><defs>${estiloInterativo}${defs.join("")}</defs>${parede.join("")}${corpo.join("")}${cotasXml}${selecao.join("")}</svg>`;
}

/** Converte o SVG em PNG (dataURL) — usado para baixar a imagem. */
export function svgParaPng(svg: string, larguraPx = 1800): Promise<string> {
  return new Promise((resolve, reject) => {
    const vb = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
    const ratio = vb ? Number(vb[2]) / Number(vb[1]) : 0.6;
    const alturaPx = Math.max(1, Math.round(larguraPx * ratio));
    const svgComTamanho = svg.replace(
      /width="100%"\s+height="100%"/,
      `width="${larguraPx}" height="${alturaPx}"`
    );

    const renderizar = (src: string, revogarUrl: string | null, permiteFallback: boolean) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = larguraPx;
          canvas.height = alturaPx;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Contexto de canvas indisponível.");
          ctx.fillStyle = "#FBFAF7";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          if (revogarUrl) URL.revokeObjectURL(revogarUrl);
          resolve(canvas.toDataURL("image/png"));
        } catch {
          if (revogarUrl) URL.revokeObjectURL(revogarUrl);
          reject(new Error("Não foi possível gerar o PNG."));
        }
      };
      img.onerror = () => {
        if (revogarUrl) URL.revokeObjectURL(revogarUrl);
        if (permiteFallback) {
          renderizar(
            `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgComTamanho)}`,
            null,
            false
          );
          return;
        }
        reject(new Error("Não foi possível converter o desenho."));
      };
      img.src = src;
    };

    const blob = new Blob([svgComTamanho], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    renderizar(url, url, true);
  });
}
