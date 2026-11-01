import jsonServer from 'json-server';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const arquivo = path.join(path.dirname(fileURLToPath(import.meta.url)), 'cadastro.json');
const app = jsonServer.create();
const ler = () => JSON.parse(fs.readFileSync(arquivo, 'utf8'));
const gravar = dados => fs.writeFileSync(arquivo, `${JSON.stringify(dados, null, 2)}\n`);
const erro = (res, status, message) => res.status(status).json({ status, message });
const somenteDigitos = valor => typeof valor === 'string' ? valor.replace(/\D/g, '') : '';
const vazio = valor => typeof valor !== 'string' || !valor.trim();

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(jsonServer.bodyParser);

function conviteValido(dados, token) {
  const convite = dados.convites.find(item => item.token === token);
  if (!convite || convite.usadoEm || !convite.expiraEm || new Date(convite.expiraEm).getTime() < Date.now()) return null;
  return convite;
}

app.get('/v1/api/cadastro/validar', (req, res) => {
  const convite = conviteValido(ler(), String(req.query.token || ''));
  if (!convite) return erro(res, 400, 'Link inválido ou expirado');
  const { nome, ambiente, movel, cor, material, orcamento, situacaoProjeto, precisaVisitaTecnica } = convite;
  res.json({ nome, ambiente, movel, cor, material, orcamento, situacaoProjeto, precisaVisitaTecnica });
});

app.post('/v1/api/cadastro', (req, res) => {
  const dados = ler();
  const convite = conviteValido(dados, req.body?.token);
  if (!convite) return erro(res, 400, 'Link inválido ou expirado');

  const tipoCliente = req.body?.tipoCliente;
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const senha = req.body?.senha;
  const camposTexto = ['nome', 'sobrenome', 'cpf', 'telefone', 'origemContato'];
  if (!['PESSOA_FISICA', 'PESSOA_JURIDICA'].includes(tipoCliente)
      || camposTexto.some(campo => vazio(req.body?.[campo]))
      || !/^\S+@\S+\.\S+$/.test(email)
      || typeof senha !== 'string' || senha.length < 8 || senha.length > 72) {
    return erro(res, 400, 'Dados de cadastro inválidos');
  }
  if (req.body.nome.trim().length > 100 || req.body.sobrenome.trim().length > 100
      || somenteDigitos(req.body.cpf).length > 20 || req.body.telefone.trim().length > 20
      || req.body.origemContato.trim().length > 30 || email.length > 150) {
    return erro(res, 400, 'Dados de cadastro inválidos');
  }
  if (dados.usuarios.some(usuario => usuario.email === email)) return erro(res, 409, 'E-mail já cadastrado');

  let cnpj = null;
  if (tipoCliente === 'PESSOA_JURIDICA') {
    cnpj = somenteDigitos(req.body.cnpj);
    if (!cnpj || vazio(req.body.razaoSocial)) return erro(res, 400, !cnpj ? 'CNPJ é obrigatório' : 'Razão social é obrigatória');
    if (dados.usuarios.some(usuario => usuario.cnpj === cnpj)) return erro(res, 409, 'CNPJ já cadastrado');
  }

  const usuario = {
    id: Math.max(0, ...dados.usuarios.map(item => item.id)) + 1,
    tipoCliente,
    nome: req.body.nome.trim(),
    sobrenome: req.body.sobrenome.trim(),
    cpf: somenteDigitos(req.body.cpf),
    dataNascimento: req.body.dataNascimento || null,
    email,
    telefone: req.body.telefone.trim(),
    origemContato: req.body.origemContato.trim(),
    // Apenas o mock usa texto puro para validar o login automático local.
    senha,
    cnpj,
    razaoSocial: tipoCliente === 'PESSOA_JURIDICA' ? req.body.razaoSocial.trim() : null,
    nomeFantasia: tipoCliente === 'PESSOA_JURIDICA' && !vazio(req.body.nomeFantasia) ? req.body.nomeFantasia.trim() : null,
    etapaFunil: convite.saoPaulo ? 'QUALIFICADO' : 'EM_QUALIFICACAO',
    dataCadastro: new Date().toISOString().slice(0, 19),
  };
  dados.usuarios.push(usuario);
  convite.usadoEm = new Date().toISOString().slice(0, 19);
  gravar(dados);
  const { id, nome, sobrenome, telefone, etapaFunil, dataCadastro } = usuario;
  res.status(201).json({ id, tipoCliente, nome, sobrenome, email, telefone, etapaFunil, dataCadastro });
});

app.post('/v1/api/auth/login', (req, res) => {
  const dados = ler();
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const usuario = dados.usuarios.find(item => item.email === email && item.senha === req.body?.senha);
  if (!usuario) return erro(res, 401, 'E-mail ou senha inválidos');
  const agora = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ sub: String(usuario.id), email, perfil: 'CLIENTE', iat: agora, exp: agora + 3600 })).toString('base64url');
  res.json({ token: `mock.${payload}.assinatura`, tipo: 'Bearer', expiraEmSegundos: 3600, usuarioId: usuario.id, nome: usuario.nome });
});

const porta = Number(process.env.PORT || 4105);
app.listen(porta, () => console.log(`Mock do cadastro em http://localhost:${porta}`));
