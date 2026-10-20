import jsonServer from 'json-server';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const server = jsonServer.create();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults({ noCors: false });

server.use(middlewares);
server.use(jsonServer.bodyParser);

const DB_PATH = path.join(__dirname, 'db.json');

function readDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

// Explicitly expose GET/PUT for /v1/minha-conta so nested object in db.json is returned
server.get('/v1/minha-conta', (req, res) => {
  try {
    const db = readDb();
    // support both shapes: { v1: { 'minha-conta': {...} } } and { 'minha-conta': {...} }
    if (db.v1 && db.v1['minha-conta']) {
      return res.json(db.v1['minha-conta']);
    }
    if (db['minha-conta']) {
      return res.json(db['minha-conta']);
    }
    console.warn('minha-conta not found in db.json; keys:', Object.keys(db));
    return res.status(404).json({});
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

server.put('/v1/minha-conta', (req, res) => {
  try {
    const db = readDb();
    if (db.v1) {
      db.v1['minha-conta'] = req.body;
    } else {
      db['minha-conta'] = req.body;
    }
    writeDb(db);
    return res.json(db.v1 ? db.v1['minha-conta'] : db['minha-conta']);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

// Fallback to json-server router for other resources under /v1
server.use('/v1', router);

const port = process.env.PORT || 4002;
server.listen(port, () => {
  console.log(`Mock server listening on http://localhost:${port}`);
});
