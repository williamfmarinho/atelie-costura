import Link from 'next/link';
import FichaOS, { SELECT_ORDEM } from '@/components/FichaOS';
import { CosturaTitulo, IcAgulha } from '@/components/Icones';
import { hoje } from '@/lib/format';
import { db, type OrdemCompleta } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const FILTROS = [
  { id: 'abertas', rotulo: 'Em produção' },
  { id: 'atrasadas', rotulo: 'Atrasadas' },
  { id: 'entregues', rotulo: 'Entregues' },
  { id: 'canceladas', rotulo: 'Canceladas' },
  { id: 'todas', rotulo: 'Todas' },
];

export default async function Ordens({ searchParams }: { searchParams: Promise<{ f?: string; n?: string }> }) {
  const { f = 'abertas', n } = await searchParams;
  let q = db().from('ordens').select(SELECT_ORDEM).limit(200);
  if (n && /^\d+$/.test(n)) q = q.eq('numero', Number(n));
  else if (f === 'abertas') q = q.eq('status', 'aberta').order('data_entrega');
  else if (f === 'atrasadas') q = q.eq('status', 'aberta').lt('data_entrega', hoje()).order('data_entrega');
  else if (f === 'entregues') q = q.eq('status', 'entregue').order('data_entrega_efetiva', { ascending: false });
  else if (f === 'canceladas') q = q.eq('status', 'cancelada').order('created_at', { ascending: false });
  else q = q.order('numero', { ascending: false });
  const { data } = await q.order('numero');
  const ordens = (data ?? []) as OrdemCompleta[];

  return (
    <>
      <header className="topo">
        <div className="sobe">
          <div className="sobre">Produção</div>
          <h1>Ordens de <em>serviço</em></h1>
          <CosturaTitulo />
        </div>
        <div className="acoes sobe" style={{ '--i': 1 } as React.CSSProperties}>
          <form className="linha" style={{ gap: 6 }}>
            <input name="n" placeholder="Nº da OS" inputMode="numeric" defaultValue={n} style={{ width: 120 }} />
            <button className="btn fantasma">Abrir</button>
          </form>
          <Link href="/atendimento" className="btn alfinete"><IcAgulha /> Nova OS</Link>
        </div>
      </header>

      <nav className="abas sobe" style={{ '--i': 2, marginBottom: 18 } as React.CSSProperties}>
        {FILTROS.map((x) => (
          <Link key={x.id} href={`/ordens?f=${x.id}`} className={!n && f === x.id ? 'ativo' : ''}>{x.rotulo}</Link>
        ))}
      </nav>

      <div className="folha pesponto sobe" style={{ '--i': 3 } as React.CSSProperties}>
        {ordens.length ? (
          <div className="pilha" style={{ gap: 8 }}>{ordens.map((o, i) => <FichaOS key={o.id} o={o} i={Math.min(i, 12)} />)}</div>
        ) : (
          <p className="vazio">Nenhuma ordem por aqui.</p>
        )}
      </div>
    </>
  );
}
