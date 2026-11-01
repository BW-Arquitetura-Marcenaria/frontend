# Validação do cadastro de clientes

A tela de cadastro consome as rotas reais do backend:

- `GET /v1/api/cadastro/validar?token=...` valida o convite e retorna dados do lead;
- `POST /v1/api/cadastro` cria uma conta de pessoa física ou jurídica;
- `POST /v1/api/auth/login` realiza o login automático após o cadastro.

O mock persiste convites e usuários em `mock/cadastro.json`. Rode `npm run mock:all` para usar o cadastro junto dos demais mocks pela porta 4000, ou `npm run mock:cadastro` para executá-lo isoladamente na porta 4105.

Em outro terminal, inicie o frontend:

```powershell
$env:VITE_API_BASE_URL='http://localhost:4000'
$env:VITE_USE_MOCK='true'
npm run dev
```

## Links para teste

- PF válido: `http://localhost:8443/cadastro?token=cadastro-pf-valido`
- PJ válido: `http://localhost:8443/cadastro?token=cadastro-pj-valido`
- Expirado: `http://localhost:8443/cadastro?token=cadastro-expirado`
- Já utilizado: `http://localhost:8443/cadastro?token=cadastro-utilizado`
- Inválido: `http://localhost:8443/cadastro?token=token-inexistente`

Após um cadastro bem-sucedido, o token é marcado como usado e não pode ser reutilizado. O mock também cria uma sessão de cliente para validar o login automático. Para repetir o cenário, restaure `usadoEm` para `null` e remova o usuário criado em `mock/cadastro.json`.

Valide os fluxos PF e PJ, senha entre 8 e 72 caracteres, e-mail ou CNPJ duplicado, token inválido/expirado/usado e redirecionamento ao portal após o login automático.
