# Validação do funil de clientes

A tela do funil usa as rotas reais do backend: `GET /v1/admin/funil` (quadro, métricas e cards), `GET /v1/admin/funil/{clienteId}` (detalhe) e `PUT /v1/admin/funil/{clienteId}/etapa` com `{ "etapa": "EM_NEGOCIACAO" }` (mudança de etapa). As etapas aceitas são `QUALIFICADO`, `ORCAMENTO_ENVIADO`, `EM_NEGOCIACAO` e `FECHADO`. Não há rota de cadastro/exclusão de oportunidades nesse controller; o botão fictício de novo lead não aparece na interface.

O mock lê e grava `mock/funil.json`. Rode `npm run mock:all` para acessar funil, chat, financeiro e referências pela mesma porta 4000; ou `npm run mock:funil` para testar apenas o funil. Em outro terminal, inicie o frontend:

```powershell
$env:VITE_API_BASE_URL='http://localhost:4000'
$env:VITE_USE_MOCK='true'
npm run dev
```

Acesse `http://localhost:8443`, entre por “Acesso interno — Equipe BW” e abra **Funil de Clientes**. Teste abrir detalhes, selecionar outra etapa e arrastar um card; recarregue a página para confirmar a persistência. O mock não simula autenticação. Os valores de pipeline e score médio são calculados apenas para oportunidades não fechadas, como no backend. As opções de calendário e rastreabilidade usam os cards retornados pelo funil, mas suas APIs próprias são independentes.
