import jsonServer from 'json-server';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const arquivo = path.join(path.dirname(fileURLToPath(import.meta.url)), 'chat.json');
const app = jsonServer.create();
const ler = () => JSON.parse(fs.readFileSync(arquivo, 'utf8'));
const gravar = dados => fs.writeFileSync(arquivo, `${JSON.stringify(dados, null, 2)}\n`);
const mensagemPublica = ({ id, remetente, conteudo, criadoEm }) => ({ id, remetente, conteudo, criadoEm });
const erro = (res, status, message) => res.status(status).json({ status, message });
const clienteAtual = () => Number(process.env.MOCK_CLIENTE_ID || 1);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(jsonServer.bodyParser);

function validarCliente(req, res, next) {
  const id = Number(req.params.clienteId);
  if (!ler().clientes.some(cliente => cliente.id === id)) return erro(res, 404, 'Cliente não encontrado.');
  next();
}
function validarMensagem(req, res, next) {
  const conteudo = req.body?.conteudo;
  if (typeof conteudo !== 'string' || !conteudo.trim() || conteudo.trim().length > 2000) {
    return erro(res, 400, 'A mensagem deve ter entre 1 e 2.000 caracteres.');
  }
  next();
}
function listarMensagens(clienteId, depois) {
  return ler().mensagens.filter(item => item.clienteId === clienteId && item.id > depois).sort((a, b) => a.id - b.id).map(mensagemPublica);
}
function enviarMensagem(clienteId, remetente, conteudo) {
  const dados = ler();
  const mensagem = {
    id: Math.max(0, ...dados.mensagens.map(item => item.id)) + 1,
    clienteId, remetente, conteudo: conteudo.trim(),
    criadoEm: new Date().toISOString().slice(0, 19), lida: false,
  };
  dados.mensagens.push(mensagem);
  gravar(dados);
  return mensagemPublica(mensagem);
}
function marcarLidas(clienteId, remetente) {
  const dados = ler();
  for (const mensagem of dados.mensagens) {
    if (mensagem.clienteId === clienteId && mensagem.remetente === remetente) mensagem.lida = true;
  }
  gravar(dados);
}

app.get('/v1/admin/chat/conversas', (_req, res) => {
  const dados = ler();
  const conversas = dados.clientes.map(cliente => {
    const mensagens = dados.mensagens.filter(item => item.clienteId === cliente.id).sort((a, b) => b.id - a.id);
    if (!mensagens.length) return null;
    const ultima = mensagens[0];
    return { clienteId: cliente.id, nomeCliente: cliente.nome, ultimaMensagem: ultima.conteudo,
      ultimoRemetente: ultima.remetente, ultimaMensagemEm: ultima.criadoEm,
      naoLidas: mensagens.filter(item => item.remetente === 'CLIENTE' && !item.lida).length, ultimoId: ultima.id };
  }).filter(Boolean).sort((a, b) => b.ultimoId - a.ultimoId).map(({ ultimoId, ...conversa }) => conversa);
  res.json(conversas);
});
app.get('/v1/admin/chat/nao-lidas', (_req, res) => res.json({ total: ler().mensagens.filter(item => item.remetente === 'CLIENTE' && !item.lida).length }));
app.get('/v1/admin/chat/conversas/:clienteId/mensagens', validarCliente, (req, res) => {
  res.json(listarMensagens(Number(req.params.clienteId), Number(req.query.depois) || 0));
});
app.post('/v1/admin/chat/conversas/:clienteId/mensagens', validarCliente, validarMensagem, (req, res) => {
  res.status(201).json(enviarMensagem(Number(req.params.clienteId), 'ADMIN', req.body.conteudo));
});
app.get('/v1/admin/chat/conversas/:clienteId/resumo', validarCliente, (req, res) => {
  const resumo = ler().resumos[req.params.clienteId];
  return resumo ? res.json(resumo) : erro(res, 404, 'Resumo não encontrado para o cliente.');
});
app.put('/v1/admin/chat/conversas/:clienteId/lidas', validarCliente, (req, res) => {
  marcarLidas(Number(req.params.clienteId), 'CLIENTE');
  res.sendStatus(204);
});

app.get('/v1/chat/mensagens', (req, res) => res.json(listarMensagens(clienteAtual(), Number(req.query.depois) || 0)));
app.post('/v1/chat/mensagens', validarMensagem, (req, res) => {
  res.status(201).json(enviarMensagem(clienteAtual(), 'CLIENTE', req.body.conteudo));
});
app.get('/v1/chat/nao-lidas', (_req, res) => res.json({ total: ler().mensagens.filter(item => item.clienteId === clienteAtual() && item.remetente === 'ADMIN' && !item.lida).length }));
app.put('/v1/chat/mensagens/lidas', (_req, res) => { marcarLidas(clienteAtual(), 'ADMIN'); res.sendStatus(204); });

const porta = Number(process.env.PORT || 4000);
app.listen(porta, () => console.log(`Mock do chat em http://localhost:${porta} (cliente simulado: ${clienteAtual()})`));
