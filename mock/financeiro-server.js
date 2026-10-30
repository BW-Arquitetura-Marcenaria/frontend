import jsonServer from 'json-server';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const arquivo = path.join(path.dirname(fileURLToPath(import.meta.url)), 'financeiro.json');
const app = jsonServer.create();
const ler = () => JSON.parse(fs.readFileSync(arquivo, 'utf8'));
const gravar = dados => fs.writeFileSync(arquivo, `${JSON.stringify(dados, null, 2)}\n`);
const registros = dados => dados.financeiros;
const numero = valor => Number(valor) || 0;
const mesISO = data => data?.slice(0, 7);
const erro = (res, status, message) => res.status(status).json({ status, message });

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(jsonServer.bodyParser);

app.get('/v1/financeiros/kpis', (_req, res) => {
  const dados = registros(ler());
  const atual = new Date();
  const anterior = new Date(atual.getFullYear(), atual.getMonth() - 1, 1);
  const mesAtual = `${atual.getFullYear()}-${String(atual.getMonth() + 1).padStart(2, '0')}`;
  const mesAnterior = `${anterior.getFullYear()}-${String(anterior.getMonth() + 1).padStart(2, '0')}`;
  const somar = (mes, campo) => dados.filter(item => mesISO(item.dataPedido) === mes).reduce((soma, item) => soma + numero(item[campo]), 0);
  const receitasMes = somar(mesAtual, 'valorRecebidoFinal');
  const despesasMes = somar(mesAtual, 'frete');
  const receitasAnteriores = somar(mesAnterior, 'valorRecebidoFinal');
  const despesasAnteriores = somar(mesAnterior, 'frete');
  const variacao = (agora, antes) => antes ? Math.round((agora - antes) / antes * 1000) / 10 : 0;
  res.json({
    receitasMes, despesasMes, resultadoLiquido: receitasMes - despesasMes,
    variacaoReceitasPercentual: variacao(receitasMes, receitasAnteriores),
    variacaoDespesasPercentual: variacao(despesasMes, despesasAnteriores),
    margemPercentual: receitasMes ? Math.round((receitasMes - despesasMes) / receitasMes * 1000) / 10 : 0,
  });
});

app.get('/v1/financeiros/receitas-despesas-mensal', (req, res) => {
  const quantidade = Math.min(24, Math.max(1, Number.parseInt(req.query.meses, 10) || 6));
  const dados = registros(ler());
  const hoje = new Date();
  res.json(Array.from({ length: quantidade }, (_, indice) => {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - quantidade + 1 + indice, 1);
    const mes = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
    const itens = dados.filter(item => mesISO(item.dataPedido) === mes);
    return { mes, receitas: itens.reduce((soma, item) => soma + numero(item.valorRecebidoFinal), 0), despesas: itens.reduce((soma, item) => soma + numero(item.frete), 0) };
  }));
});

app.get('/v1/financeiros', (req, res) => {
  const itens = [...registros(ler())].sort((a, b) => b.id - a.id);
  const page = Math.max(0, Number.parseInt(req.query.page, 10) || 0);
  const size = Math.max(1, Number.parseInt(req.query.size, 10) || 10);
  res.json({ content: itens.slice(page * size, (page + 1) * size), totalElements: itens.length, totalPages: Math.ceil(itens.length / size), size, number: page });
});

app.post('/v1/financeiros', (req, res) => {
  const { quantidade, valor, frete, valorTotal } = req.body;
  if (!Number.isInteger(quantidade) || quantidade < 1 || [valor, frete, valorTotal].some(v => v == null || numero(v) < 0)) return erro(res, 400, 'Informe quantidade, valor, frete e valor total válidos.');
  const dados = ler();
  const id = Math.max(0, ...registros(dados).map(item => item.id)) + 1;
  const novo = { ...req.body, id };
  registros(dados).push(novo);
  gravar(dados);
  res.status(201).json(novo);
});

app.put('/v1/financeiros/:id', (req, res) => {
  const dados = ler();
  const indice = registros(dados).findIndex(item => item.id === Number(req.params.id));
  if (indice < 0) return erro(res, 404, 'Registro financeiro não encontrado');
  const { quantidade, valor, frete, valorTotal } = req.body;
  if (!Number.isInteger(quantidade) || quantidade < 1 || [valor, frete, valorTotal].some(v => v == null || numero(v) < 0)) return erro(res, 400, 'Informe quantidade, valor, frete e valor total válidos.');
  const atualizado = { ...req.body, id: Number(req.params.id) };
  registros(dados)[indice] = atualizado;
  gravar(dados);
  res.json(atualizado);
});

app.delete('/v1/financeiros/:id', (req, res) => {
  const dados = ler();
  const indice = registros(dados).findIndex(item => item.id === Number(req.params.id));
  if (indice < 0) return erro(res, 404, 'Registro financeiro não encontrado');
  registros(dados).splice(indice, 1);
  gravar(dados);
  res.sendStatus(204);
});

// Não gera um XLSX fictício: para testar importação/exportação, use o backend real.
app.all('/v1/financeiros/import/excel', (_req, res) => erro(res, 501, 'Importação Excel disponível apenas no backend real.'));
app.all('/v1/financeiros/export/excel', (_req, res) => erro(res, 501, 'Exportação Excel disponível apenas no backend real.'));

const porta = Number(process.env.PORT || 4000);
app.listen(porta, () => console.log(`Mock financeiro em http://localhost:${porta}`));
