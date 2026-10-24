import Link from 'next/link';
import FichaOS, { SELECT_ORDEM } from '@/components/FichaOS';
import { CosturaTitulo, IcAgulha } from '@/components/Icones';
import { addDias, dataLonga, dinheiro, fimDoMes, hoje, horaAgora, inicioDoMes, lerMes } from '@/lib/format';
import { db, type OrdemCompleta } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function Painel() {
  const sb = db();
  const hj = hoje();
  const { ano, mes } = lerMes(undefined);
  const semana = addDias(hj, 7);

  const [abertas, movs, { data: aReceber }] = await Promise.all([
    sb.from('ordens').select(SELECT_ORDEM).eq('status', 'aberta').lte('data_entrega', semana).order('data_entrega').order('numero'),
    sb.from('movimentacoes').select('tipo, valor').gte('data', inicioDoMes(ano, mes)).lte('data', fimDoMes(ano, mes)),
    sb.from('ordens').select('total').eq('status', 'aberta'),
  ]);

  const ordens = (abertas.data ?? []) as OrdemCompleta[];
  const atrasadas = ordens.filter((o) => o.data_entrega < hj);
  const deHoje = ordens.filter((o) => o.data_entrega === hj);
  const proximas = ordens.filter((o) => o.data_entrega > hj);

  const entradas = (movs.data ?? []).filter((m) => m.tipo === 'entrada').reduce((s, m) => s + Number(m.valor), 0);
  const saidas = (movs.data ?? []).filter((m) => m.tipo === 'saida').reduce((s, m) => s + Number(m.valor), 0);
  const pendente = (aReceber ?? []).reduce((s, o) => s + Number(o.total), 0);

  const hora = horaAgora();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <>
      <header className="topo">
        <div className="sobe">
          <div className="sobre">{dataLonga(hj)}</div>
          <h1>
            {saudacao}, <em>mãos à obra.</em>
          </h1>
          <CosturaTitulo />
        </div>
        <div className="acoes sobe" style={{ '--i': 1 } as React.CSSProperties}>
          <Link href="/atendimento" className="btn alfinete"><IcAgulha /> Nova OS</Link>
        </div>
      </header>

      <section className="grade g4" style={{ marginBottom: 22 }}>
        <div className="folha indicador ameixa sobe" style={{ '--i': 1 } as React.CSSProperties}>
          <div className="rotulo">Para entregar hoje</div>
          <span className="valor">{deHoje.length}</span>
          <div className="nota">{dinheiro(deHoje.reduce((s, o) => s + Number(o.total), 0))} em serviços</div>
          <span className="carimbo">hoje</span>
        </div>
        <div className="folha indicador sobe" style={{ '--i': 2 } as React.CSSProperties}>
          <div className="rotulo">Atrasadas</div>
          <span className="valor" style={{ color: atrasadas.length ? 'var(--alfinete)' : undefined }}>{atrasadas.length}</span>
          <div className="nota">{atrasadas.length ? 'precisam de atenção' : 'nada atrasado ✓'}</div>
        </div>
        <div className="folha indicador sobe" style={{ '--i': 3 } as React.CSSProperties}>
          <div className="rotulo">A receber (OS abertas)</div>
          <span className="valor">{dinheiro(pendente)}</span>
          <div className="nota">{(aReceber ?? []).length} ordens em produção</div>
        </div>
        <div className="folha indicador sobe" style={{ '--i': 4 } as React.CSSProperties}>
          <div className="rotulo">Saldo do mês</div>
          <span className="valor" style={{ color: entradas - saidas < 0 ? 'var(--alfinete)' : 'var(--salvia)' }}>{dinheiro(entradas - saidas)}</span>
          <div className="nota">
            <span style={{ color: 'var(--salvia)' }}>+{dinheiro(entradas)}</span> · <span style={{ color: 'var(--alfinete)' }}>−{dinheiro(saidas)}</span>
          </div>
        </div>
      </section>

      <section className="grade g-lado">
        <div className="pilha">
          {atrasadas.length > 0 && (
            <div className="folha sobe" style={{ '--i': 5, borderColor: 'rgba(212,73,47,.35)' } as React.CSSProperties}>
              <header><h2>Atrasadas</h2><span className="etiqueta atrasada">{atrasadas.length}</span></header>
              <div className="pilha" style={{ gap: 8 }}>{atrasadas.map((o, i) => <FichaOS key={o.id} o={o} i={i} />)}</div>
            </div>
          )}
          <div className="folha pesponto sobe" style={{ '--i': 6 } as React.CSSProperties}>
            <header><h2>Entregas de <em>hoje</em></h2><Link href={`/agenda?dia=${hj}`}>ver na agenda →</Link></header>
            {deHoje.length ? (
              <div className="pilha" style={{ gap: 8 }}>{deHoje.map((o, i) => <FichaOS key={o.id} o={o} i={i} />)}</div>
            ) : (
              <p className="vazio">Nenhuma entrega marcada para hoje.</p>
            )}
          </div>
        </div>
        <div className="folha sobe" style={{ '--i': 7 } as React.CSSProperties}>
          <header><h2>Próximos 7 dias</h2><Link href="/agenda">agenda →</Link></header>
          {proximas.length ? (
            <div className="pilha" style={{ gap: 8 }}>{proximas.map((o, i) => <FichaOS key={o.id} o={o} i={i} />)}</div>
          ) : (
            <p className="vazio">Semana livre por enquanto.</p>
          )}
        </div>
      </section>
    </>
  );
}
