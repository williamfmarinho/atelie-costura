import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cancelarOrdem, darBaixa, reabrirOrdem } from '@/app/actions';
import BotaoImprimir from '@/components/BotaoImprimir';
import { InputData } from '@/components/Campos';
import { EtiquetaStatus, SELECT_ORDEM } from '@/components/FichaOS';
import FormOS from '@/components/FormOS';
import { CosturaTitulo, IcCheck, IcVolta } from '@/components/Icones';
import { dataCurta, dataLonga, dinheiro, formataTelefone, hoje } from '@/lib/format';
import { db, FORMAS_PAGAMENTO, type Cliente, type OrdemCompleta } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function DetalheOS({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ baixa?: string; editar?: string; ok?: string; erro?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const sb = db();
  const { data } = await sb.from('ordens').select(SELECT_ORDEM).eq('id', id).maybeSingle();
  if (!data) notFound();
  const o = data as OrdemCompleta;
  const itens = [...o.ordem_itens].sort((a, b) => a.posicao - b.posicao);

  if (sp.editar && o.status === 'aberta') {
    const { data: cli } = await sb.from('clientes').select('*').eq('id', o.cliente_id).maybeSingle<Cliente>();
    return (
      <>
        <header className="topo">
          <div className="sobe"><div className="sobre">Editando OS nº {o.numero}</div><h1>Ajustar a <em>ordem</em></h1><CosturaTitulo /></div>
        </header>
        <FormOS ordem={o} cliente={cli} />
      </>
    );
  }

  const { data: mov } = await sb.from('movimentacoes').select('id').eq('ordem_id', id).maybeSingle();

  return (
    <>
      <header className="topo">
        <div className="sobe">
          <div className="sobre"><Link href="/ordens" className="linha" style={{ gap: 4 }}><IcVolta width={14} /> Ordens</Link></div>
          <h1>OS <em>nº {o.numero}</em></h1>
          <CosturaTitulo />
        </div>
        <div className="acoes sobe nao-imprime" style={{ '--i': 1 } as React.CSSProperties}>
          <BotaoImprimir />
          {o.status === 'aberta' && <Link href={`/ordens/${o.id}?editar=1`} className="btn fantasma">Editar</Link>}
          {o.status === 'aberta' && <Link href={`/ordens/${o.id}?baixa=1`} className="btn salvia"><IcCheck /> Dar baixa</Link>}
        </div>
      </header>

      {sp.ok === 'nova' && <div className="aviso ok sobe">Ordem registrada! Entrega marcada para {dataLonga(o.data_entrega)}.</div>}
      {sp.ok === 'editada' && <div className="aviso ok sobe">Alterações salvas.</div>}
      {sp.ok === 'baixa' && <div className="aviso ok sobe">Baixa registrada{mov ? ' e entrada lançada no caixa' : ''}.</div>}

      <section className="grade g-lado">
        <div className="folha pesponto sobe" style={{ '--i': 2 } as React.CSSProperties}>
          <header>
            <h2>Peças</h2>
            <EtiquetaStatus o={o} />
          </header>
          <div className="rolagem">
            <table className="tabela">
              <thead><tr><th>#</th><th>Peça</th><th>Serviço</th><th className="direita">Valor</th></tr></thead>
              <tbody>
                {itens.map((it, i) => (
                  <tr key={it.id}>
                    <td className="num suave">{String(i + 1).padStart(2, '0')}</td>
                    <td><b>{it.peca}</b></td>
                    <td className="suave">{it.servico ?? '—'}</td>
                    <td className="direita valor">{dinheiro(it.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="soma-os"><span>Total</span><span className="valor">{dinheiro(o.total)}</span></div>
          {o.observacoes && <p style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}><span className="suave pequeno">Observações: </span>{o.observacoes}</p>}
        </div>

        <div className="pilha">
          <div className="folha sobe" style={{ '--i': 3 } as React.CSSProperties}>
            <header><h3>Cliente</h3><Link href={`/clientes/${o.cliente_id}`} className="nao-imprime">ficha →</Link></header>
            <div style={{ fontFamily: 'var(--display)', fontSize: '1.5rem', fontWeight: 600 }}>{o.clientes?.nome}</div>
            {o.clientes?.telefone && <div className="suave">{formataTelefone(o.clientes.telefone)}</div>}
            <hr className="costura" />
            <dl className="pilha" style={{ gap: 8, margin: 0 }}>
              {[
                ['Entrada', dataCurta(o.data_entrada)],
                ['Entrega prevista', dataCurta(o.data_entrega)],
                ...(o.status === 'entregue' ? [['Entregue em', dataCurta(o.data_entrega_efetiva)], ['Pagamento', o.forma_pagamento ?? '—']] : []),
              ].map(([k, v]) => (
                <div key={k} className="linha entre"><dt className="suave pequeno">{k}</dt><dd style={{ margin: 0 }} className="num">{v}</dd></div>
              ))}
            </dl>
          </div>

          <div className="folha sobe nao-imprime" style={{ '--i': 4 } as React.CSSProperties}>
            {o.status === 'aberta' ? (
              <form action={cancelarOrdem} className="linha entre">
                <input type="hidden" name="id" value={o.id} />
                <span className="suave pequeno">A cliente desistiu?</span>
                <button className="btn perigo pequeno">Cancelar OS</button>
              </form>
            ) : (
              <form action={reabrirOrdem} className="linha entre">
                <input type="hidden" name="id" value={o.id} />
                <span className="suave pequeno">{o.status === 'entregue' ? 'Baixa feita por engano? Reabrir remove a entrada do caixa.' : 'Ordem cancelada.'}</span>
                <button className="btn fantasma pequeno">Reabrir OS</button>
              </form>
            )}
          </div>
        </div>
      </section>

      {sp.baixa && o.status === 'aberta' && (
        <div className="veu">
          <form action={darBaixa} className="folha pesponto">
            <input type="hidden" name="id" value={o.id} />
            <header><h2>Dar baixa na <em>OS nº {o.numero}</em></h2></header>
            {sp.erro && <div className="aviso">Informe a forma de pagamento e a data da entrega.</div>}
            <div className="soma-os" style={{ marginTop: 0, marginBottom: 16 }}><span>{o.clientes?.nome}</span><span className="valor">{dinheiro(o.total)}</span></div>
            <div className="linha-form">
              <label className="campo">
                <span>Forma de pagamento</span>
                <select name="forma_pagamento" required defaultValue="">
                  <option value="" disabled>Escolha…</option>
                  {FORMAS_PAGAMENTO.map((f) => <option key={f}>{f}</option>)}
                </select>
              </label>
              <label className="campo">
                <span>Data da entrega</span>
                <InputData name="data_entrega_efetiva" defaultValue={hoje()} max={hoje()} required />
              </label>
            </div>
            <label className="linha" style={{ marginTop: 14, gap: 8 }}>
              <input type="checkbox" name="lancar_caixa" defaultChecked /> Lançar {dinheiro(o.total)} como entrada no caixa
            </label>
            <div className="linha" style={{ marginTop: 18, justifyContent: 'flex-end' }}>
              <Link href={`/ordens/${o.id}`} className="btn fantasma">Voltar</Link>
              <button className="btn salvia"><IcCheck /> Confirmar entrega</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
