import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { assinar, buscarGeracao, COOKIE } from './auth';
import { db } from './supabase';

async function lerConfig(chave: string) {
  const { data } = await db().from('configuracoes').select('valor').eq('chave', chave).maybeSingle();
  return data?.valor as string | undefined;
}

async function gravarConfig(chave: string, valor: string) {
  const { error } = await db().from('configuracoes').upsert({ chave, valor, updated_at: new Date().toISOString() });
  if (error) throw error;
}

/** Confere a senha: a gravada no banco (hash) ou, se nunca foi trocada, a ATELIE_SENHA do ambiente. */
export async function senhaConfere(senha: string) {
  const hash = await lerConfig('senha_hash');
  if (!hash) return !!process.env.ATELIE_SENHA && senha === process.env.ATELIE_SENHA;
  const [sal, esperado] = hash.split(':');
  const calculado = scryptSync(senha, Buffer.from(sal, 'hex'), 32);
  return timingSafeEqual(calculado, Buffer.from(esperado, 'hex'));
}

/** Grava a nova senha e invalida as outras sessões; mantém este aparelho logado. */
export async function definirSenha(nova: string) {
  const sal = randomBytes(16);
  await gravarConfig('senha_hash', `${sal.toString('hex')}:${scryptSync(nova, sal, 32).toString('hex')}`);
  const geracao = String(Number(await buscarGeracao()) + 1);
  await gravarConfig('sessao_gen', geracao);
  await abrirSessao(geracao);
}

export async function abrirSessao(geracao?: string) {
  (await cookies()).set(COOKIE, await assinar(geracao ?? (await buscarGeracao())), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}
