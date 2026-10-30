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

Abra `http://localhost:8443` e use “Acesso interno — Equipe BW” para abrir o atendimento. O mock simula o cliente de ID `1` no portal. Para simular outro cliente, inicie o servidor com `$env:MOCK_CLIENTE_ID='2'`. Não rode dois mocks simultaneamente na porta 4000; `PORT` permite alterá-la, desde que `VITE_API_BASE_URL` use a mesma porta.

Testes rápidos: listar conversas (`GET /v1/admin/chat/conversas`), abrir histórico (`GET /v1/admin/chat/conversas/1/mensagens`), enviar (`POST` na mesma rota com JSON `{ "conteudo": "Olá" }`), buscar novidades com `?depois=<id>`, consultar resumo (`GET /v1/admin/chat/conversas/1/resumo`) e marcar lidas (`PUT /v1/admin/chat/conversas/1/lidas`). O cliente 3 não possui resumo: 404 é esperado. As mensagens enviadas ficam gravadas em `mock/chat.json`.

Para testar importação/exportação Excel e o financeiro, use o backend real ou o mock financeiro separado. O mock financeiro não fornece o chat; o mock do chat não fornece o financeiro.
