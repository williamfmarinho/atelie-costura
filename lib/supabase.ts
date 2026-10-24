import { createClient } from '@supabase/supabase-js';

// Cliente só de servidor: usa a chave secreta, nunca vai para o navegador.
export function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SECRET_KEY não configurados');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export type Cliente = {
  id: string;
  nome: string;
  cpf: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  observacoes: string | null;
  created_at: string;
};

export type Item = { id: string; ordem_id: string; peca: string; servico: string | null; valor: number; posicao: number };

export type Ordem = {
  id: string;
  numero: number;
  cliente_id: string;
  data_entrada: string;
  data_entrega: string;
  status: 'aberta' | 'entregue' | 'cancelada';
  forma_pagamento: string | null;
  data_entrega_efetiva: string | null;
  observacoes: string | null;
  total: number;
  created_at: string;
};

export type OrdemCompleta = Ordem & { clientes: Pick<Cliente, 'id' | 'nome' | 'telefone'> | null; ordem_itens: Item[] };

export type Categoria = { id: string; nome: string; tipo: 'entrada' | 'saida'; fixa: boolean };

export type Movimentacao = {
  id: string;
  tipo: 'entrada' | 'saida';
  descricao: string;
  valor: number;
  data: string;
  categoria_id: string | null;
  forma_pagamento: string | null;
  ordem_id: string | null;
  categorias?: Categoria | null;
};

export const FORMAS_PAGAMENTO = ['Pix', 'Dinheiro', 'Cartão de débito', 'Cartão de crédito', 'Transferência', 'Outro'];
