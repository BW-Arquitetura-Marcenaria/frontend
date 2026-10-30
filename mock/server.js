import jsonServer from 'json-server';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const server = jsonServer.create();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'db.json');
const middlewares = jsonServer.defaults({ noCors: true });

function readDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

function referencias(db) {
  if (!Array.isArray(db?.v1?.referencias?.content)) {
    throw new Error('Estrutura de referências inválida no mock/db.json.');
  }
  return db.v1.referencias.content;
}

function pageResponse(items, page, size) {
  const safePage = Math.max(Number.parseInt(page, 10) || 0, 0);
  const safeSize = Math.max(Number.parseInt(size, 10) || 100, 1);
  return {
    content: items.slice(safePage * safeSize, (safePage + 1) * safeSize),
    totalElements: items.length,
    totalPages: Math.max(Math.ceil(items.length / safeSize), 1),
    size: safeSize,
    number: safePage,
  };
}

// The Axios client sends credentials. A concrete origin is required; '*' is invalid.
server.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin === 'http://localhost:8443') {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
server.use(middlewares);
server.use(jsonServer.bodyParser);

server.get('/v1/referencias', (req, res) => {
  try {
    const items = referencias(readDb());
    return res.json(pageResponse(items, req.query.page, req.query.size));
  } catch (error) {
    return res.status(500).json({ error: String(error) });
  }
});

server.get('/v1/referencias/:id', (req, res) => {
  try {
    const item = referencias(readDb()).find(({ id }) => id === Number(req.params.id));
    return item ? res.json(item) : res.status(404).json({ message: 'Referência não encontrada.' });
  } catch (error) {
    return res.status(500).json({ error: String(error) });
  }
});

server.post('/v1/referencias', (req, res) => {
  try {
    const db = readDb();
    const items = referencias(db);
    const id = Math.max(0, ...items.map(({ id: itemId }) => Number(itemId) || 0)) + 1;
    const item = { ...req.body, id, dataAtualizacao: new Date().toISOString() };
    items.push(item);
    writeDb(db);
    return res.status(201).json(item);
  } catch (error) {
    return res.status(500).json({ error: String(error) });
  }
});

server.put('/v1/referencias/:id', (req, res) => {
  try {
    const db = readDb();
    const items = referencias(db);
    const index = items.findIndex(({ id }) => id === Number(req.params.id));
    if (index === -1) return res.status(404).json({ message: 'Referência não encontrada.' });
    const item = { ...items[index], ...req.body, id: items[index].id, dataAtualizacao: new Date().toISOString() };
    items[index] = item;
    writeDb(db);
    return res.json(item);
  } catch (error) {
    return res.status(500).json({ error: String(error) });
  }
});

server.delete('/v1/referencias/:id', (req, res) => {
  try {
    const db = readDb();
    const items = referencias(db);
    const index = items.findIndex(({ id }) => id === Number(req.params.id));
    if (index === -1) return res.status(404).json({ message: 'Referência não encontrada.' });
    items.splice(index, 1);
    writeDb(db);
    return res.sendStatus(204);
  } catch (error) {
    return res.status(500).json({ error: String(error) });
  }
});

server.get('/v1/minha-conta', (_req, res) => {
  const db = readDb();
  return db.v1?.['minha-conta'] ? res.json(db.v1['minha-conta']) : res.sendStatus(404);
});

server.put('/v1/minha-conta', (req, res) => {
  const db = readDb();
  db.v1['minha-conta'] = req.body;
  writeDb(db);
  return res.json(db.v1['minha-conta']);
});

const port = Number(process.env.PORT || 4000);
server.listen(port, () => console.log(`Mock server listening on http://localhost:${port}`));
