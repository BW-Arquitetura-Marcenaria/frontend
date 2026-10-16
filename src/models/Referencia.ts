export type Referencia = {
  id: number;
  categoria: string;
  precoReferencia: string; // BigDecimal serialized as string
  descricao: string;
  materialBase: string;
  unidade: string;
  dataAtualizacao: string; // ISO datetime
};

export type Page<T> = {
  content: T[];
  pageable?: any;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};
