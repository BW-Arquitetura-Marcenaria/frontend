import axios from "@/api/axios";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const STORAGE_KEY = "bw-mock-minha-conta-v1";

const DEFAULT_MINHA_CONTA = {
  tipoCliente: "PESSOA_FISICA",
  nome: "Juliana",
  sobrenome: "Rocha",
  cpf: "381.492.718-04",
  dataNascimento: "1992-07-18",
  email: "juliana.rocha@email.com",
  telefone: "(11) 99412-8830",
  origemContato: "instagram",
  instagramUsername: "julianarocha.arq",
  empresa: {
    cnpj: "24.819.302/0001-40",
    razaoSocial: "Rocha & Associados Consultoria Ltda.",
    nomeFantasia: "Rocha Consultoria",
    telefone: "(11) 3082-4410",
  },
};

export async function getMinhaConta() {
  if (USE_MOCK) {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return structuredClone(DEFAULT_MINHA_CONTA);
  }
  const resp = await axios.get('/v1/minha-conta');
  return resp.data;
}

export async function putMinhaConta(payload: any) {
  if (USE_MOCK) {
    const atual = await getMinhaConta();
    const atualizado = {
      ...atual,
      ...payload,
      empresa: {
        ...atual.empresa,
        razaoSocial: payload.razaoSocial ?? atual.empresa?.razaoSocial,
        nomeFantasia: payload.nomeFantasia ?? atual.empresa?.nomeFantasia,
      },
    };
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(atualizado));
    } catch {
      // ignore
    }
    return atualizado;
  }
  const resp = await axios.put('/v1/minha-conta', payload);
  return resp.data;
}
