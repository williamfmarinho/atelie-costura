import { NextResponse, type NextRequest } from 'next/server';
import { buscarGeracao, COOKIE, lerToken } from '@/lib/auth';

// guarda a geração da sessão por alguns segundos para não consultar o banco a cada clique
let cache: { geracao: string; ate: number } | null = null;

async function geracaoAtual(forcar = false) {
  if (!forcar && cache && cache.ate > Date.now()) return cache.geracao;
  const geracao = await buscarGeracao();
  cache = { geracao, ate: Date.now() + 30_000 };
  return geracao;
}

export async function proxy(req: NextRequest) {
  const geracao = await lerToken(req.cookies.get(COOKIE)?.value);
  if (geracao) {
    try {
      // geração diferente do cache: confirma direto no banco (pode ter acabado de mudar)
      if (geracao === (await geracaoAtual()) || geracao === (await geracaoAtual(true))) return NextResponse.next();
    } catch {
      return new NextResponse('Banco de dados indisponível. Tente novamente em instantes.', { status: 503 });
    }
  }
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!login|_next/static|_next/image|logo.jpeg|favicon.ico).*)'],
};
