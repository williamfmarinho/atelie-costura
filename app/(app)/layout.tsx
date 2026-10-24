import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Doodle from '@/components/Doodle';
import LinkOpcoes from '@/components/LinkOpcoes';
import Menu from '@/components/Menu';
import { COOKIE } from '@/lib/auth';

async function sair() {
  'use server';
  (await cookies()).delete(COOKIE);
  redirect('/login');
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="casca">
      <aside className="lateral">
        <Link href="/" className="marca">
          <img src="/logo.jpeg" alt="" />
          <span>
            <b>Ateliê</b>
            <small>de costura</small>
          </span>
        </Link>
        <Menu />
        <div className="rodape">
          <LinkOpcoes />
          <form action={sair}><button style={{ width: '100%' }}>Sair</button></form>
        </div>
      </aside>
      <main className="conteudo">{children}</main>
      <Doodle />
    </div>
  );
}
