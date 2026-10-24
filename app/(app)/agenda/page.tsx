import Link from 'next/link';
import FichaOS, { SELECT_ORDEM } from '@/components/FichaOS';
import { CosturaTitulo, IcAgulha } from '@/components/Icones';
import { addDias, dataLonga, dinheiro, fimDoMes, hoje, inicioDoMes, lerMes, maiuscula, MESES, mesParam, parseISO } from '@/lib/format';
import { db, type OrdemCompleta } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export default async function Agenda({ searchParams }: { searchParams: Promise<{ mes?: string; dia?: string }> }) {
  const sp = await searchParams;
  const hj = hoje();
  const diaParam = sp.dia && /^\d{4}-\d{2}-\d{2}$/.test(sp.dia) ? sp.dia : null;
  const { ano, mes } = lerMes(sp.mes ?? diaParam?.slice(0, 7));
  const ini = inicioDoMes(ano, mes);
  const fim = fimDoMes(ano, mes);
  // por padrão: hoje (no mês atual) ou o dia 1 do mês visto
  const diaSel = diaParam ?? (hj >= ini && hj <= fim ? hj : ini);
  const gradeIni = addDias(ini, -parseISO(ini).getUTCDay());
  const gradeFim = addDias(fim, 6 - parseISO(fim).getUTCDay());

  const { data } = await db()
    .from('ordens')
    .select(SELECT_ORDEM)
    .gte('data_entrega', gradeIni)
    .lte('data_entrega', gradeFim)
    .neq('status', 'cancelada')
    .order('numero');
  const ordens = (data ?? []) as OrdemCompleta[];

  const porDia = new Map<string, OrdemCompleta[]>();
  for (const o of ordens) porDia.set(o.data_entrega, [...(porDia.get(o.data_entrega) ?? []), o]);
  const somaDe = (d: string) => (porDia.get(d) ?? []).reduce((s, o) => s + Number(o.total), 0);
  const dias: string[] = [];
  for (let d = gradeIni; d <= gradeFim; d = addDias(d, 1)) dias.push(d);
  const maior = Math.max(1, ...dias.map(somaDe));

  const doMes = ordens.filter((o) => o.data_entrega >= ini && o.data_entrega <= fim);
  const entregues = doMes.filter((o) => o.status === 'entregue');
  const faltam = doMes.filter((o) => o.status === 'aberta');
  const sel = diaSel ? porDia.get(diaSel) ?? [] : [];
  const mesQs = `${ano}-${String(mes).padStart(2, '0')}`;

  return (
    <>
      <header className="topo">
        <div className="sobe">
          <div className="sobre">Agenda de entregas</div>
          <h1>{maiuscula(MESES[mes - 1])} <em>{ano}</em></h1>
          <CosturaTitulo />
        </div>
        <div className="acoes sobe" style={{ '--i': 1 } as React.CSSProperties}>
          <Link href={`/agenda?mes=${mesParam(ano, mes, -1)}`} className="btn fantasma" aria-label="Mês anterior">←</Link>
          <span className="mes-atual">{MESES[mes - 1].slice(0, 3)}/{ano}</span>
          <Link href={`/agenda?mes=${mesParam(ano, mes, 1)}`} className="btn fantasma" aria-label="Próximo mês">→</Link>
          {mesQs !== hj.slice(0, 7) && <Link href="/agenda" className="btn fantasma pequeno">voltar para hoje</Link>}
        </div>
      </header>

      <section className="grade g3" style={{ marginBottom: 20 }}>
        <div className="folha indicador sobe" style={{ '--i': 1 } as React.CSSProperties}>
          <div className="rotulo">Faltam entregar no mês</div>
          <span className="valor">{faltam.length}</span>
          <div className="nota">{dinheiro(faltam.reduce((s, o) => s + Number(o.total), 0))}</div>
        </div>
        <div className="folha indicador sobe" style={{ '--i': 2 } as React.CSSProperties}>
          <div className="rotulo">Já entregues</div>
          <span className="valor" style={{ color: 'var(--salvia)' }}>{entregues.length}</span>
          <div className="nota">{dinheiro(entregues.reduce((s, o) => s + Number(o.total), 0))}</div>
        </div>
        <div className="folha indicador ameixa sobe" style={{ '--i': 3 } as React.CSSProperties}>
          <div className="rotulo">Previsão do mês</div>
          <span className="valor">{dinheiro(doMes.reduce((s, o) => s + Number(o.total), 0))}</span>
          <div className="nota">{doMes.length} {doMes.length === 1 ? 'ordem agendada' : 'ordens agendadas'}</div>
        </div>
      </section>

      <section className="grade g-lado">
        <div className="folha sobe" style={{ '--i': 4, padding: 14 } as React.CSSProperties}>
          <div className="cal-cab">{SEMANA.map((s) => <div key={s}>{s}</div>)}</div>
          <div className="cal">
            {dias.map((d) => {
              const os = porDia.get(d) ?? [];
              const soma = somaDe(d);
              const cls = ['dia', d.slice(0, 7) !== mesQs && 'fora', d === hj && 'hoje', d === diaSel && 'sel'].filter(Boolean).join(' ');
              return (
                <Link key={d} href={`/agenda?mes=${mesQs}&dia=${d}`} className={cls} scroll={false}>
                  <span className="d">{Number(d.slice(8))}</span>
                  <span className="pts">
                    {os.slice(0, 3).map((o) => (
                      <span key={o.id} className={`pt ${o.status === 'entregue' ? 'ok' : d < hj ? 'atr' : ''}`}>{o.clientes?.nome.split(' ')[0]}</span>
                    ))}
                    {os.length > 3 && <span className="pt">+{os.length - 3}</span>}
                  </span>
                  {soma > 0 && <span className="soma">{dinheiro(soma)}</span>}
                  {soma > 0 && <span className="carga" style={{ width: `${(soma / maior) * 100}%` }} />}
                </Link>
              );
            })}
          </div>
          <div className="linha pequeno suave" style={{ marginTop: 12, gap: 16 }}>
            <span className="linha" style={{ gap: 6 }}><span className="etiqueta">a entregar</span></span>
            <span className="linha" style={{ gap: 6 }}><span className="etiqueta entregue">entregue</span></span>
            <span className="linha" style={{ gap: 6 }}><span className="etiqueta atrasada">atrasada</span></span>
            <span>A barrinha embaixo de cada dia mostra a carga em R$.</span>
          </div>
        </div>

          <div className="folha pesponto sobe painel-dia" style={{ '--i': 5, position: 'sticky', top: 24 } as React.CSSProperties}>
            <header>
              <h2>{dataLonga(diaSel)}</h2>
            </header>
            <div className="soma-os" style={{ marginTop: 0, marginBottom: 14 }}>
              <span>{sel.length} {sel.length === 1 ? 'serviço' : 'serviços'}</span>
              <span className="valor">{dinheiro(sel.reduce((s, o) => s + Number(o.total), 0))}</span>
            </div>
            {sel.length ? (
              <div className="pilha" style={{ gap: 8 }}>{sel.map((o, i) => <FichaOS key={o.id} o={o} i={i} />)}</div>
            ) : (
              <p className="vazio">Dia livre.</p>
            )}
            <Link href="/atendimento" className="btn alfinete" style={{ marginTop: 16, width: '100%' }}><IcAgulha /> Nova OS</Link>
          </div>
      </section>
    </>
  );
}
