import Link from 'next/link';
import BuscaCliente from '@/components/BuscaCliente';
import FormOS from '@/components/FormOS';
import { CosturaTitulo, IcVolta } from '@/components/Icones';
import { db, type Cliente } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function Atendimento({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  const { cliente: clienteId } = await searchParams;
  const sb = db();

  // cliente escolhida → formulário da nova OS aqui mesmo
  const cliente = clienteId ? (await sb.from('clientes').select('*').eq('id', clienteId).maybeSingle<Cliente>()).data : null;
  if (cliente) {
    return (
      <>
        <header className="topo">
          <div className="sobe">
            <div className="sobre"><Link href="/atendimento" className="linha" style={{ gap: 4 }}><IcVolta width={14} /> Atendimento</Link></div>
            <h1>Nova OS — <em>o que vamos costurar?</em></h1>
            <CosturaTitulo />
          </div>
        </header>
        <FormOS cliente={cliente} />
      </>
    );
  }

  const { data } = await sb.from('ordens').select('clientes(*)').order('created_at', { ascending: false }).limit(30);
  const recentes = (data ?? [])
    .map((o) => o.clientes as unknown as Cliente)
    .filter((c, i, arr) => c && arr.findIndex((x) => x?.id === c.id) === i)
    .slice(0, 8);

  return (
    <>
      <header className="topo">
        <div className="sobe">
          <div className="sobre">Atendimento e nova OS</div>
          <h1>Quem chegou <em>no balcão?</em></h1>
          <CosturaTitulo />
        </div>
      </header>
      <BuscaCliente modo="atendimento" recentes={recentes} />
    </>
  );
}
