# BW Arquitetura e Marcenaria

Frontend em React para uma marca de arquitetura de interiores e marcenaria sob medida. Reúne um site institucional (apresentação, serviços, portfólio e contato) e telas de um fluxo de cliente (login, cadastro e portal).

> **Status:** em desenvolvimento. Projeto acadêmico originado de um protótipo do Figma Make. Atualmente não há integração com backend.

## Funcionalidades

**Site institucional**
- Apresentação da empresa e dos fundadores
- Serviços e diferenciais
- Portfólio em cards visuais
- Depoimentos
- CTA para contato e solicitação de orçamento
- Layout responsivo (desktop e mobile)

**Fluxo do cliente (interface)**
- Telas de login e cadastro
- Estrutura do portal do cliente e do dashboard

## Stack

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

## Pré-requisitos

- Node.js 18 ou superior
- npm

## Como executar

```bash
# instalar dependências
npm install

# iniciar em modo de desenvolvimento
npm run dev
```

A aplicação fica disponível em `http://localhost:5173`.

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera a build de produção |
| `npm run preview` | Serve a build localmente para conferência |
| `npm run format` | Formata o código |

## Estrutura

```
frontend/
├── public/
├── src/
│   ├── assets/
│   │   ├── backgrounds/
│   │   ├── brand/
│   │   ├── portfolio/
│   │   ├── references/
│   │   └── team/
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Licença

Sem licença pública definida. Uso restrito a fins acadêmicos e de demonstração.