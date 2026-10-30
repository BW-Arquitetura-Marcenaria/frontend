# Padrão MVVM — Convenções e Boas Práticas (Frontend)

Objetivo
- Padronizar a organização MVVM no frontend de forma incremental e compatível com branches existentes.

Estrutura proposta
- src/models/        -> Tipos e entidades (Model)
- src/api/           -> Serviços de API (persistem)
- src/viewmodels/    -> Lógica de apresentação/estado (ViewModel). Implementar como hooks: use<X>ViewModel
- src/views/         -> Componentes de apresentação (View). Consumem apenas ViewModels e props
- src/components/    -> Reexports e componentes genéricos/legacy (compatibilidade)

Nomenclatura
- Model: Nome.ts / export type Nome
- ViewModel: src/viewmodels/<feature>/use<Feature>ViewModel.ts
- View: src/views/<feature>/<Feature>View.tsx ou <Feature>Page.tsx

Responsabilidades
- Model: apenas tipos/interfaces e helpers puros.
- API: chamadas HTTP/transformações bruto->domain.
- ViewModel: estado local, efeitos (useEffect), chamadas a API, transformações de dados, tratamento de erros, comandos (ex: reload, submit). Retornar apenas dados e ações.
- View: renderização pura, recebe o retorno do ViewModel e eventos; sem lógica de negócio.

Compatibilidade incremental
- Para migrar uma feature: crie Model + ViewModel + View e reexporte os hooks/componentes antigos para manter imports existentes.
- Evite mover ou renomear arquivos usados por outras branches sem coordenar; prefira reexports (ex.: src/hooks/useX -> export { useXViewModel as useX }).

Boas práticas de implementação
- Use nomes de hooks: use<Feature>ViewModel.
- ViewModels retornam: { data, loading, error, actions... } as const.
- Testes: unit tests no ViewModel (mock API) e testes de snapshot/integração para Views.
- Estado global: apenas quando necessário (Zustand/Redux). ViewModels devem encapsular estado local.
- Não coloque efeitos colaterais (persistência, logging cross-cutting) diretamente na View; centralize em services ou interceptors.

Pull Requests e colaboração
- PRs: seguir o padrão já existente no repositório; marque reviewers e inclua instruções de teste (mock: npm run mock:api).

Exemplo (Referências)
- Model: src/models/Referencia.ts
- API: src/api/referencias.ts
- ViewModel: src/viewmodels/referencias/useReferenciasViewModel.ts
- View: src/views/referencias/ReferenciasTable.tsx
- Compatibilidade: src/hooks/useReferencias.ts reexporta o ViewModel; src/components/ReferenciasTable.tsx reexporta a View.

Observações finais
- A abordagem favorece entendimento por feature e facilita revisão incremental. Se o projeto crescer em escala, padronizar um gerador/esqueleto para novas features acelera a adoção.
