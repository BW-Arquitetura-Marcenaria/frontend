# Mock financeiro

A massa de teste isolada fica em `mock/financeiro.json` (12 pedidos, incluindo dados de vários meses e paginação). Não altera `mock/db.json` nem os mocks das outras telas.

```bash
npm run mock:financeiro
```

Em outro terminal:

```bash
# A API do mock usa a porta 4000; o frontend usa a porta configurada pelo Vite.
# PowerShell:
$env:VITE_API_BASE_URL="http://localhost:4000"
npm run dev
```

Entre como administrador e abra **Financeiro**. O mock implementa listagem paginada (`size=10`), criação, atualização, exclusão, KPIs do mês corrente e comparativo mensal com as mesmas regras de soma do backend (`valorRecebidoFinal` e `frete` por `dataPedido`). As alterações feitas pelo mock são gravadas em `mock/financeiro.json`; para reiniciar o teste, restaure esse arquivo via Git.

**Importante:** importação e exportação Excel respondem `501` no mock. Para validar o fluxo real de `.xlsx`, aponte `VITE_API_BASE_URL` para o backend Java. O mock não retorna planilhas falsas nem suporta login; a autenticação da aplicação deve estar disponível separadamente.
