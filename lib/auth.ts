// Sessão assinada: cookie = "<geração>.<hmac>". Trocar a senha incrementa a geração,
// o que derruba as sessões abertas em outros aparelhos.
export const COOKIE = 'atelie_sessao';

async function hmac(texto: string) {
  const chave = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(process.env.SESSION_SECRET ?? ''),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', chave, new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function assinar(geracao: string) {
  return `${geracao}.${await hmac(`sessao:${geracao}`)}`;
}

/** Devolve a geração se a assinatura confere; senão null. */
export async function lerToken(token: string | undefined) {
  if (!token) return null;
  const i = token.indexOf('.');
  if (i < 1) return null;
  const geracao = token.slice(0, i);
  return token.slice(i + 1) === (await hmac(`sessao:${geracao}`)) ? geracao : null;
}

/** Geração atual gravada no banco (via REST, funciona no proxy). */
export async function buscarGeracao() {
  const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/configuracoes?chave=eq.sessao_gen&select=valor`, {
    headers: { apikey: process.env.SUPABASE_SECRET_KEY ?? '', Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}` },
    cache: 'no-store',
  });
  if (!r.ok) throw new Error('Falha ao ler a sessão');
  const linhas = (await r.json()) as { valor: string }[];
  return linhas[0]?.valor ?? '1';
}
