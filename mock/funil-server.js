import jsonServer from 'json-server';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const arquivo = path.join(path.dirname(fileURLToPath(import.meta.url)), 'funil.json');
const etapas = [
  ['QUALIFICADO', 'Qualificado'],
  ['ORCAMENTO_ENVIADO', 'Orçamento Enviado'],
  ['EM_NEGOCIACAO', 'Em Negociação'],
  ['FECHADO', 'Fechado'],
];
const app = jsonServer.create();
const ler = () => JSON.parse(fs.readFileSync(arquivo, 'utf8'));
const gravar = dados => fs.writeFileSync(arquivo, `${JSON.stringify(dados, null, 2)}\n`);
const erro = (res, status, message) => res.status(status).json({ status, message });
const detalhe = oportunidade => ({ ...oportunidade });
const card = ({ etapa, ...restante }) => restante;

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(jsonServer.bodyParser);

app.get('/v1/admin/funil', (_req, res) => {
  const oportunidades = ler().oportunidades;
  const ativas = oportunidades.filter(item => item.etapa !== 'FECHADO');
  const pontuadas = ativas.filter(item => item.score !== null);
  res.json({
    oportunidadesAtivas: ativas.length,
    pipeline: ativas.reduce((total, item) => total + (Number(item.orcamento) || 0), 0),
    scoreMedio: pontuadas.length ? Math.round(pontuadas.reduce((total, item) => total + item.score, 0) / pontuadas.length) : 0,
    colunas: etapas.map(([etapa, titulo]) => {
      const cards = oportunidades.filter(item => item.etapa === etapa).map(card);
      return { etapa, titulo, total: cards.length, cards };
    }),
  });
});
app.get('/v1/admin/funil/:clienteId', (req, res) => {
  const oportunidade = ler().oportunidades.find(item => item.clienteId === Number(req.params.clienteId));
  return oportunidade ? res.json(detalhe(oportunidade)) : erro(res, 404, 'Oportunidade não encontrada');
});
app.put('/v1/admin/funil/:clienteId/etapa', (req, res) => {
  if (!etapas.some(([etapa]) => etapa === req.body?.etapa)) return erro(res, 400, 'Etapa inválida para o funil');
  const dados = ler();
  const oportunidade = dados.oportunidades.find(item => item.clienteId === Number(req.params.clienteId));
  if (!oportunidade) return erro(res, 404, 'Oportunidade não encontrada');
  oportunidade.etapa = req.body.etapa;
  gravar(dados);
  res.json(detalhe(oportunidade));
});

const porta = Number(process.env.PORT || 4000);
app.listen(porta, () => console.log(`Mock do funil em http://localhost:${porta}`));
