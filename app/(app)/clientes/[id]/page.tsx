import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EtiquetaStatus } from '@/components/FichaOS';
import FormCliente from '@/components/FormCliente';
import { CosturaTitulo, IcAgulha, IcVolta } from '@/components/Icones';
import { dataCurta, dataDeInstante, dinheiro, formataCPF, formataTelefone } from '@/lib/format';
import { db, type Cliente, type OrdemCompleta } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function FichaCliente({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ editar?: string; erro?: string; todas?: string }> }) {
  const { id } = await params;
  const { editar, erro, todas } = await searchParams;
  const sb = db();
  const { data: c } = await sb.from('clientes').select('*').eq('id', id).maybeSingle<Cliente>();
  if (!c) notFound();
  const { data, count } = await sb
    .from('ordens')
    .select('*, ordem_itens(*)', { count: 'exact' })
    .eq('cliente_id', id)
    .order('data_entrada', { ascending: false })
    .order('numero', { ascending: false })
    .limit(todas ? 200 : 5);
  const ordens = (data ?? []) as OrdemCompleta[];
  const gasto = ordens.filter((o) => o.status === 'entregue').reduce((s, o) => s + Number(o.total), 0);

  return (
    <>
      <header className="topo">
        <div className="sobe">
          <div className="sobre"><Link href="/atendimento" className="linha" style={{ gap: 4 }}><IcVolta width={14} /> Atendimento</Link></div>
          <h1>{c.nome}</h1>
          <CosturaTitulo />
        </div>
        <div className="acoes sobe" style={{ '--i': 1 } as React.CSSProperties}>
          <Link href={`/clientes/${c.id}${editar ? '' : '?editar=1'}`} className="btn fantasma">{editar ? 'Fechar edição' : 'Editar dados'}</Link>
          <Link href={`/atendimento?cliente=${c.id}`} className="btn alfinete"><IcAgulha /> Nova ordem de serviço</Link>
        </div>
      </header>

      <section className="grade g-lado">
        <div className="pilha">
          <div className="folha pesponto sobe" style={{ '--i': 2 } as React.CSSProperties}>
            <header>
              <h2>Últimas ordens de serviço</h2>
              <span className="suave pequeno">{count ?? 0} no total</span>
            </header>
            {ordens.length === 0 && <p className="vazio">Nenhuma OS ainda para esta cliente.</p>}
            <div className="pilha" style={{ gap: 14 }}>
              {ordens.map((o, i) => (
                <article key={o.id} className="sobe" style={{ '--i': i, border: '1px solid var(--linha)', borderRadius: 12, padding: '14px 16px', background: '#fff' } as React.CSSProperties}>
                  <div className="linha entre" style={{ marginBottom: 8 }}>
                    <Link href={`/ordens/${o.id}`} style={{ fontFamily: 'var(--display)', fontSize: '1.3rem', fontWeight: 600, textDecoration: 'none' }}>
                      OS nº {o.numero}
                    </Link>
                    <EtiquetaStatus o={o} />
                  </div>
                  <div className="pequeno suave" style={{ marginBottom: 8 }}>
                    Entrada {dataCurta(o.data_entrada)} · Entrega prevista {dataCurta(o.data_entrega)}
                    {o.status === 'entregue' && <> · Entregue {dataCurta(o.data_entrega_efetiva)} via {o.forma_pagamento}</>}
                  </div>
                  <table className="tabela">
                    <tbody>
                      {[...o.ordem_itens].sort((a, b) => a.posicao - b.posicao).map((it) => (
                        <tr key={it.id}>
                          <td><b>{it.peca}</b>{it.servico && <span className="suave"> — {it.servico}</span>}</td>
                          <td className="direita valor">{dinheiro(it.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr><td>Total</td><td className="direita valor">{dinheiro(o.total)}</td></tr>
                    </tfoot>
                  </table>
                  {o.observacoes && <p className="pequeno suave" style={{ margin: '8px 0 0' }}>“{o.observacoes}”</p>}
                </article>
              ))}
            </div>
            {!todas && (count ?? 0) > ordens.length && (
              <p style={{ textAlign: 'center', marginBottom: 0 }}><Link href={`/clientes/${c.id}?todas=1`}>ver todas as {count} ordens</Link></p>
            )}
          </div>
        </div>

        <div className="folha sobe" style={{ '--i': 3 } as React.CSSProperties}>
          {editar ? (
            <>
              <header><h2>Editar cadastro</h2></header>
              <FormCliente c={c} erro={erro} />
            </>
          ) : (
            <>
              <header><h2>Cadastro</h2></header>
              <dl className="pilha" style={{ gap: 10, margin: 0 }}>
                {[
                  ['CPF', formataCPF(c.cpf) || '—'],
                  ['Telefone', formataTelefone(c.telefone) || '—'],
                  ['E-mail', c.email || '—'],
                  ['Endereço', c.endereco || '—'],
                  ['Cliente desde', dataDeInstante(c.created_at)],
                ].map(([k, v]) => (
                  <div key={k} className="linha entre" style={{ borderBottom: '1px dashed var(--linha)', paddingBottom: 8 }}>
                    <dt className="suave pequeno">{k}</dt>
                    <dd style={{ margin: 0, textAlign: 'right' }}>{v}</dd>
                  </div>
                ))}
              </dl>
              {c.observacoes && <p style={{ whiteSpace: 'pre-wrap' }}>{c.observacoes}</p>}
              <hr className="costura" />
              <div className="linha entre">
                <span className="suave pequeno">Total já pago (OS listadas)</span>
                <span className="valor" style={{ fontSize: '1.3rem' }}>{dinheiro(gasto)}</span>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
