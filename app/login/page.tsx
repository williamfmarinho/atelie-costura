import { redirect } from 'next/navigation';
import Doodle from '@/components/Doodle';
import InputSenha from '@/components/InputSenha';
import { abrirSessao, senhaConfere } from '@/lib/senha';

async function entrar(formData: FormData) {
  'use server';
  if (!(await senhaConfere(String(formData.get('senha') ?? '')))) {
    await new Promise((r) => setTimeout(r, 1200)); // freia tentativas em sequência
    redirect('/login?erro=1');
  }
  await abrirSessao();
  redirect('/');
}

export default async function Login({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <main className="login">
      <form action={entrar} className="folha pesponto" style={{ marginTop: 90 }}>
        <img src="/logo.jpeg" alt="Ateliê de Costura — Ajustes e Reformas" />
        <h1 style={{ fontSize: '2.2rem' }}>
          Bem-vinda ao <em>ateliê</em>
        </h1>
        <div style={{ height: 22 }} />
        {erro && <div className="aviso">Senha incorreta. Tente de novo.</div>}
        <label className="campo" style={{ textAlign: 'left' }}>
          <span>Senha</span>
          <InputSenha name="senha" autoFocus required autoComplete="current-password" />
        </label>
        <button className="btn alfinete" style={{ width: '100%', marginTop: 18 }}>
          Entrar
        </button>
      </form>
      <Doodle />
    </main>
  );
}
