export type RastreabilidadeProjeto = {
  id: number;
  nome?: string;
  [key: string]: unknown;
};

// Espelha RastreabilidadeGetResponseDTO
export type Rastreabilidade = {
  id: number;
  lote: string;
  tipoMadeira: string;
  fornecedor: string;
  origem: string;
  certificacoes: string;
  volume: string;
  dataRegistro: string; // ISO datetime
  projeto: RastreabilidadeProjeto | null;
};

// Espelha RastreabilidadePostRequestDTO / RastreabilidadePutRequestDTO
export type RastreabilidadeRequest = {
  lote: string;
  tipoMadeira: string;
  fornecedor: string;
  origem: string;
  certificacoes: string;
  volume: string;
  dataRegistro?: string; // ISO date (yyyy-MM-dd)
  projetoId: number;
};

