'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, type Cliente, type OrdemCompleta } from '@/lib/supabase';
import { addDias, hoje } from '@/lib/format';
import { definirSenha, senhaConfere } from '@/lib/senha';

const txt = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? '').trim();
  return v === '' ? null : v;
};
const soDigitos = (v: string | null) => (v ? v.replace(/\D/g, '') || null : null);
const valorBR = (v: unknown) => {
  const s = String(v ?? '').trim();
  if (!s) return 0;
  // aceita "1.234,56", "1234,56" e "1234.56"
  const n = s.includes(',') ? Number(s.replace(/\./g, '').replace(',', '.')) : Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
};

/* ———————————————— Clientes ———————————————— */

// CPF e telefone são guardados só com dígitos
const dadosCliente = (f: FormData) => ({
  nome: txt(f, 'nome') ?? '',
  cpf: soDigitos(txt(f, 'cpf')),
  telefone: soDigitos(txt(f, 'telefone')),
  email: txt(f, 'email'),
  endereco: txt(f, 'endereco'),
  observacoes: txt(f, 'observacoes'),
});

export async function salvarCliente(formData: FormData) {
  const id = String(formData.get('id'));
  const dados = dadosCliente(formData);
  if (!dados.nome) redirect(`/clientes/${id}?editar=1&erro=nome`);
  const { error } = await db().from('clientes').update(dados).eq('id', id);
  if (error) redirect(`/clientes/${id}?editar=1&erro=${error.code === '23505' ? 'cpf' : 'geral'}`);
  revalidatePath('/', 'layout');
  redirect(`/clientes/${id}`);
}

export async function criarCliente(formData: FormData): Promise<{ cliente?: Cliente; erro?: string }> {
  const dados = dadosCliente(formData);
  if (!dados.nome) return { erro: 'Informe o nome.' };
  if (dados.cpf && dados.cpf.length !== 11) return { erro: 'CPF incompleto — confira os 11 dígitos ou deixe em branco.' };
  const { data, error } = await db().from('clientes').insert(dados).select('*').single();
  if (error) return { erro: error.code === '23505' ? 'Já existe uma cliente com esse CPF.' : 'Não foi possível cadastrar. Tente novamente.' };
  revalidatePath('/atendimento');
  return { cliente: data as Cliente };
}

export async function buscarClientes(q: string): Promise<Cliente[]> {
  const termo = q.trim();
  if (termo.length < 2) return [];
  const digitos = termo.replace(/\D/g, '');
  let query = db().from('clientes').select('*').order('nome').limit(8);
  if (digitos.length >= 3 && digitos.length === termo.replace(/[.\-\s()]/g, '').length)
    query = query.or(`cpf.ilike.%${digitos}%,telefone.ilike.%${digitos}%`);
  else query = query.ilike('nome', `%${termo.replace(/[%_,()]/g, ' ')}%`);
  const { data } = await query;
  return (data ?? []) as Cliente[];
}

export async function ultimasOrdens(clienteId: string, limite = 5): Promise<OrdemCompleta[]> {
  const { data } = await db()
    .from('ordens')
    .select('*, ordem_itens(*)')
    .eq('cliente_id', clienteId)
    .order('data_entrada', { ascending: false })
    .order('numero', { ascending: false })
    .limit(limite);
  return (data ?? []) as OrdemCompleta[];
}

/* ———————————————— Ordens de serviço ———————————————— */

type ItemEntrada = { peca: string; servico: string; valor: string | number };
export type OrdemEntrada = {
  id?: string;
  cliente_id?: string;
  data_entrada: string;
  data_entrega: string;
  observacoes?: string;
  itens: ItemEntrada[];
};

export async function salvarOrdem(e: OrdemEntrada): Promise<{ id?: string; erro?: string }> {
  const itens = e.itens
    .map((i, posicao) => ({ peca: i.peca.trim(), servico: i.servico.trim() || null, valor: valorBR(i.valor), posicao }))
    .filter((i) => i.peca);
  if (!itens.length) return { erro: 'Adicione pelo menos uma peça.' };
  if (!e.cliente_id) return { erro: 'Escolha ou cadastre a cliente.' };
  if (!e.data_entrega) return { erro: 'Defina a data de entrega.' };

  const sb = db();
  const entrada = e.data_entrada || hoje();
  if (e.data_entrega < entrada) return { erro: 'A entrega não pode ser antes da entrada.' };
  if (e.data_entrega < hoje()) {
    // ao editar, uma OS já atrasada pode manter a data original
    const original = e.id ? (await sb.from('ordens').select('data_entrega').eq('id', e.id).single()).data?.data_entrega : null;
    if (original !== e.data_entrega) return { erro: 'A data de entrega não pode estar no passado.' };
  }

  const cab = { cliente_id: e.cliente_id, data_entrada: entrada, data_entrega: e.data_entrega, observacoes: e.observacoes?.trim() || null };
  let ordemId = e.id;
  if (ordemId) {
    const { error } = await sb.from('ordens').update(cab).eq('id', ordemId);
    if (error) return { erro: error.message };
    await sb.from('ordem_itens').delete().eq('ordem_id', ordemId);
  } else {
    const { data, error } = await sb.from('ordens').insert(cab).select('id').single();
    if (error) return { erro: error.message };
    ordemId = data.id;
  }
  const { error } = await sb.from('ordem_itens').insert(itens.map((i) => ({ ...i, ordem_id: ordemId })));
  if (error) return { erro: error.message };

  revalidatePath('/', 'layout');
  return { id: ordemId };
}

/** Tudo que já está agendado para um dia — alimenta a janela da Nova OS. */
export async function filaDoDia(data: string, excluirId?: string) {
  let q = db()
    .from('ordens')
    .select('id, numero, status, total, clientes(nome), ordem_itens(peca, servico, valor)')
    .eq('data_entrega', data)
    .neq('status', 'cancelada')
    .order('numero');
  if (excluirId) q = q.neq('id', excluirId);
  const { data: ordens } = await q;
  return (ordens ?? []) as unknown as FilaItem[];
}

/** Quantidade e soma de serviços por dia num intervalo (inclusive). */
export async function cargaDosDias(inicio: string, fim: string, excluirId?: string) {
  let q = db().from('ordens').select('data_entrega, total').gte('data_entrega', inicio).lte('data_entrega', fim).neq('status', 'cancelada');
  if (excluirId) q = q.neq('id', excluirId);
  const { data } = await q;
  const dias: { data: string; qtd: number; total: number }[] = [];
  for (let d = inicio; d <= fim; d = addDias(d, 1)) {
    const doDia = (data ?? []).filter((o) => o.data_entrega === d);
    dias.push({ data: d, qtd: doDia.length, total: doDia.reduce((s, o) => s + Number(o.total), 0) });
  }
  return dias;
}

export type FilaItem =Pick<OrdemCompleta, 'id' | 'numero' | 'status' | 'total'> & {
  clientes: { nome: string } | null;
  ordem_itens: { peca: string; servico: string | null; valor: number }[];
};

export async function darBaixa(formData: FormData) {
  const id = String(formData.get('id'));
  const forma = txt(formData, 'forma_pagamento');
  const dataEfetiva = txt(formData, 'data_entrega_efetiva');
  if (!forma || !dataEfetiva) redirect(`/ordens/${id}?baixa=1&erro=baixa`);
  const sb = db();
  const { data: ordem } = await sb.from('ordens').select('numero, total, clientes(nome)').eq('id', id).single();
  await sb.from('ordens').update({ status: 'entregue', forma_pagamento: forma, data_entrega_efetiva: dataEfetiva }).eq('id', id);

  if (formData.get('lancar_caixa') && ordem && Number(ordem.total) > 0) {
    const { data: cat } = await sb.from('categorias').select('id').eq('tipo', 'entrada').eq('nome', 'Serviços de costura').maybeSingle();
    const nome = (ordem.clientes as unknown as { nome: string } | null)?.nome ?? '';
    await sb.from('movimentacoes').delete().eq('ordem_id', id);
    await sb.from('movimentacoes').insert({
      tipo: 'entrada',
      descricao: `OS nº ${ordem.numero} — ${nome}`,
      valor: ordem.total,
      data: dataEfetiva,
      categoria_id: cat?.id ?? null,
      forma_pagamento: forma,
      ordem_id: id,
    });
  }
  revalidatePath('/', 'layout');
  redirect(`/ordens/${id}?ok=baixa`);
}

export async function reabrirOrdem(formData: FormData) {
  const id = String(formData.get('id'));
  const sb = db();
  await sb.from('movimentacoes').delete().eq('ordem_id', id);
  await sb.from('ordens').update({ status: 'aberta', forma_pagamento: null, data_entrega_efetiva: null }).eq('id', id);
  revalidatePath('/', 'layout');
  redirect(`/ordens/${id}`);
}

export async function cancelarOrdem(formData: FormData) {
  const id = String(formData.get('id'));
  const sb = db();
  await sb.from('movimentacoes').delete().eq('ordem_id', id);
  await sb.from('ordens').update({ status: 'cancelada' }).eq('id', id);
  revalidatePath('/', 'layout');
  redirect(`/ordens/${id}`);
}

/* ———————————————— Financeiro ———————————————— */

export async function salvarMovimentacao(formData: FormData) {
  const id = txt(formData, 'id');
  const volta = txt(formData, 'volta') ?? '/financeiro';
  const dados = {
    tipo: txt(formData, 'tipo') === 'entrada' ? 'entrada' : 'saida',
    descricao: txt(formData, 'descricao') ?? '',
    valor: valorBR(formData.get('valor')),
    data: txt(formData, 'data') ?? hoje(),
    categoria_id: txt(formData, 'categoria_id'),
    forma_pagamento: txt(formData, 'forma_pagamento'),
  };
  const sep = volta.includes('?') ? '&' : '?';
  if (!dados.descricao || dados.valor <= 0) redirect(`${volta}${sep}erro=mov`);
  const sb = db();
  const { error } = id ? await sb.from('movimentacoes').update(dados).eq('id', id) : await sb.from('movimentacoes').insert(dados);
  if (error) redirect(`${volta}${sep}erro=mov`);
  revalidatePath('/', 'layout');
  redirect(volta);
}

export async function excluirMovimentacao(formData: FormData) {
  const id = String(formData.get('id'));
  const volta = txt(formData, 'volta') ?? '/financeiro';
  await db().from('movimentacoes').delete().eq('id', id);
  revalidatePath('/', 'layout');
  redirect(volta);
}

export async function salvarCategoria(formData: FormData) {
  const id = txt(formData, 'id');
  const dados = {
    nome: txt(formData, 'nome') ?? '',
    tipo: txt(formData, 'tipo') === 'entrada' ? 'entrada' : 'saida',
    fixa: formData.get('fixa') === 'on',
  };
  if (!dados.nome) redirect('/opcoes/categorias?erro=nome');
  const sb = db();
  const { error } = id ? await sb.from('categorias').update(dados).eq('id', id) : await sb.from('categorias').insert(dados);
  if (error) redirect(`/opcoes/categorias?erro=${error.code === '23505' ? 'dup' : 'geral'}`);
  revalidatePath('/financeiro', 'layout');
  redirect('/opcoes/categorias');
}

export async function excluirCategoria(formData: FormData) {
  await db().from('categorias').delete().eq('id', String(formData.get('id')));
  revalidatePath('/financeiro', 'layout');
  redirect('/opcoes/categorias');
}

/* ———————————————— Opções ———————————————— */

export async function alterarSenha(_: unknown, formData: FormData): Promise<{ ok?: boolean; erro?: string }> {
  const atual = String(formData.get('atual') ?? '');
  const nova = String(formData.get('nova') ?? '');
  const confirmacao = String(formData.get('confirmacao') ?? '');
  if (!(await senhaConfere(atual))) return { erro: 'A senha atual não confere.' };
  if (nova.length < 6) return { erro: 'A nova senha precisa ter pelo menos 6 caracteres.' };
  if (nova !== confirmacao) return { erro: 'A confirmação não é igual à nova senha.' };
  if (nova === atual) return { erro: 'A nova senha é igual à atual.' };
  await definirSenha(nova);
  return { ok: true };
}
