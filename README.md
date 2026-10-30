# BW Arquitetura e Marcenaria

Frontend em React para uma marca de arquitetura de interiores e marcenaria sob medida. Reúne um site institucional (apresentação, serviços, portfólio e contato) e telas de um fluxo de cliente (login, cadastro e portal).

> **Status:** em desenvolvimento. Projeto acadêmico originado de um protótipo do Figma Make. Possui integração com APIs de autenticação/dados e serviços externos de localização.

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

**Mapa de descarte**
- Localiza a região pelo CEP cadastrado ou pela geolocalização atual do navegador
- Mostra ecopontos no mapa e em cards ordenados por distância
- Permite abrir a rota ou o local diretamente no Google Maps
- Usa a base oficial municipal de ecopontos de São Paulo como fallback, evitando depender apenas dos registros do Google Places

## Stack

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

## APIs e fontes externas

| Serviço | Uso no projeto | Configuração necessária |
|---|---|---|
| [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript) | Renderização do mapa e marcadores | `VITE_GOOGLE_MAPS_KEY` |
| [Google Places API](https://developers.google.com/maps/documentation/places/web-service) | Busca de ecopontos, pontos de coleta e reciclagem próximos | Habilitar na mesma chave do Google |
| [Google Geocoding API](https://developers.google.com/maps/documentation/geocoding) | Conversão de CEP/endereço em coordenadas quando necessário | Habilitar na mesma chave do Google |
| [BrasilAPI CEP v2](https://brasilapi.com.br/docs#tag/CEP-V2) | Obtém latitude e longitude do CEP brasileiro | Sem chave para o uso atual |
| [ViaCEP](https://viacep.com.br/) | Consulta de logradouro, bairro, cidade e UF a partir do CEP | Sem chave |
| [Nominatim / OpenStreetMap](https://nominatim.org/) | Fallback de geocodificação por endereço | Sem chave; sujeito à política de uso do serviço |
| [Overpass API / OpenStreetMap](https://overpass-api.de/) | Busca complementar de pontos de reciclagem fora da base municipal | Sem chave; sujeito à disponibilidade do serviço |
| [Dados Abertos da Prefeitura de São Paulo](https://dados.prefeitura.sp.gov.br/dataset/ecopontos) | Fonte da lista oficial municipal de ecopontos incluída no frontend | Base local em `src/data/ecopontosPrefeitura.ts` |

### Ordem de busca no mapa de descarte

1. Com CEP informado, consulta a BrasilAPI para obter coordenadas.
2. Se necessário, usa Google Geocoding e, depois, ViaCEP + Nominatim como fallback.
3. Sem CEP, solicita a geolocalização atual ao navegador.
4. Com as coordenadas, busca locais no Google Places.
5. Se o Google não retornar resultados, consulta a base oficial de ecopontos da Prefeitura de São Paulo.
6. Fora da cobertura da base municipal, tenta a Overpass API (OpenStreetMap).

> A base municipal está embarcada no projeto para evitar bloqueios de CORS do portal de dados abertos. Atualize `src/data/ecopontosPrefeitura.ts` periodicamente quando houver uma nova publicação oficial.

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do frontend a partir de `.env.example`:

```env
# URL da API própria
VITE_API_BASE_URL=http://localhost:8080

# Ativa dados simulados de rastreabilidade para desenvolvimento local
VITE_USE_MOCK=false

# Chave do Google Maps para mapa, Places e Geocoding
VITE_GOOGLE_MAPS_KEY=sua_chave_aqui
```

Para o mapa real, habilite **Maps JavaScript API**, **Places API** e **Geocoding API** no mesmo projeto do Google Cloud. Restrinja a chave aos domínios autorizados, como `http://localhost:5173` em desenvolvimento.

> Variáveis iniciadas por `VITE_` ficam disponíveis no navegador. Para produção, o ideal é mover chamadas sensíveis do Google para um proxy no backend e manter a chave privada no servidor.

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
│   ├── data/
│   │   └── ecopontosPrefeitura.ts
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
