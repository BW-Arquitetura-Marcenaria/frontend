import type { ProjetoSimulacao } from "@/models/Simulacao";

// Histórico local das simulações (IndexedDB): as imagens são grandes demais para o localStorage.
const DB_NOME = "bw-simulacoes";
const STORE = "projetos";
const LIMITE = 30;

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NOME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB indisponível."));
  });
}

function executar<T>(modo: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return abrir().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, modo);
        const req = fn(tx.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        tx.oncomplete = () => db.close();
      })
  );
}

export async function listarProjetos(): Promise<ProjetoSimulacao[]> {
  const todos = await executar<ProjetoSimulacao[]>("readonly", (s) => s.getAll() as IDBRequest<ProjetoSimulacao[]>);
  return todos.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

export async function salvarProjeto(projeto: ProjetoSimulacao): Promise<void> {
  await executar("readwrite", (s) => s.put(projeto));
  const todos = await listarProjetos();
  for (const antigo of todos.slice(LIMITE)) await removerProjeto(antigo.id);
}

export async function removerProjeto(id: string): Promise<void> {
  await executar("readwrite", (s) => s.delete(id));
}
