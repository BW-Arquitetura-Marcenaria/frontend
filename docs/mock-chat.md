# Validação do atendimento com mock

O mock `mock/chat-server.js` lê e grava `mock/chat.json`, implementando as rotas REST do chat administrativo e do portal do cliente. Ele não simula autenticação nem WebSocket: a tela consulta mensagens novas a cada cinco segundos. As rotas de integração com Instagram/IA não expõem histórico ao navegador e não são parte deste mock.

```powershell
npm run mock:chat
```

Em outro terminal, na pasta `frontend`:

```powershell
$env:VITE_API_BASE_URL='http://localhost:4000'
$env:VITE_USE_MOCK='true'
npm run dev
```

Abra `http://localhost:8443` e use “Acesso interno — Equipe BW” para abrir o atendimento. O mock simula o cliente de ID `1` no portal. Para simular outro cliente, inicie o servidor com `$env:MOCK_CLIENTE_ID='2'`. Para rodar chat, financeiro e referências na mesma API, use `npm run mock:all` em vez de `npm run mock:chat`. O frontend continua apontando para `http://localhost:4000`. Não rode outro mock na porta 4000 simultaneamente.

Testes rápidos: listar conversas (`GET /v1/admin/chat/conversas`), abrir histórico (`GET /v1/admin/chat/conversas/1/mensagens`), enviar (`POST` na mesma rota com JSON `{ "conteudo": "Olá" }`), buscar novidades com `?depois=<id>`, consultar resumo (`GET /v1/admin/chat/conversas/1/resumo`) e marcar lidas (`PUT /v1/admin/chat/conversas/1/lidas`). O cliente 3 não possui resumo: 404 é esperado. As mensagens enviadas ficam gravadas em `mock/chat.json`.

Importação/exportação Excel requer o backend real: o mock financeiro devolve 501 nessas rotas. Cada mock isolado atende apenas seu domínio; `mock:all` reúne os três em uma única porta.
