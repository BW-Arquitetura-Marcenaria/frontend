import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const services = [
  { name: 'referências', script: 'server.js', port: 4101 },
  { name: 'financeiro', script: 'financeiro-server.js', port: 4102 },
  { name: 'chat', script: 'chat-server.js', port: 4103 },
  { name: 'funil', script: 'funil-server.js', port: 4104 },
];
const children = services.map(service => {
  const child = spawn(process.execPath, [fileURLToPath(new URL(service.script, import.meta.url))], {
    env: { ...process.env, PORT: String(service.port) }, stdio: 'inherit', windowsHide: true,
  });
  child.on('exit', (code, signal) => {
    if (!stopping) console.error(`Mock ${service.name} encerrado (${signal ?? code}). Reinicie o servidor unificado.`);
  });
  return child;
});
let stopping = false;

const porta = Number(process.env.PORT || 4000);
const proxy = http.createServer((req, res) => {
  const service = req.url?.startsWith('/v1/admin/funil') ? services[3]
    : req.url?.startsWith('/v1/admin/chat') || req.url?.startsWith('/v1/chat/') ? services[2]
    : req.url?.startsWith('/v1/financeiros') ? services[1]
      : services[0];
  const forwarded = http.request({ hostname: '127.0.0.1', port: service.port, path: req.url, method: req.method, headers: req.headers }, response => {
    res.writeHead(response.statusCode ?? 502, response.headers);
    response.pipe(res);
  });
  forwarded.on('error', error => {
    if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: `Mock ${service.name} indisponível: ${error.message}` }));
  });
  req.pipe(forwarded);
});

function stop() {
  if (stopping) return;
  stopping = true;
  proxy.close();
  children.forEach(child => { if (!child.killed) child.kill(); });
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
proxy.listen(porta, () => console.log(`Mocks unificados em http://localhost:${porta} (referências, financeiro, chat e funil)`));
