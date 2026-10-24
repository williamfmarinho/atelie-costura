import Link from 'next/link';
import { excluirMovimentacao, salvarMovimentacao } from '@/app/actions';
import { InputData, InputDinheiro } from '@/components/Campos';
import { CosturaTitulo } from '@/components/Icones';
import TipoCategoria from '@/components/TipoCategoria';
import { dataCurta, dinheiro, dinheiroParaTexto, fimDoMes, hoje, inicioDoMes, lerMes, maiuscula, MESES, mesParam } from '@/lib/format';
import { db, FORMAS_PAGAMENTO, type Categoria, type Movimentacao } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function Caixa({ searchParams }: { searchParams: Promise<{ mes?: string; tipo?: string; editar?: string; erro?: string }> }) {
  const sp = await searchParams;
  const { ano, mes } = lerMes(sp.mes);
  const mesQs = mesParam(ano, mes);
  const sb = db();
  const [{ data: movsData }, { data: catsData }] = await Promise.all([
    sb.from('movimentacoes').select('*, categorias(*)').gte('data', inicioDoMes(ano, mes)).lte('data', fimDoMes(ano, mes)).order('data', { ascending: false }).order('created_at', { ascending: false }),
    sb.from('categorias').select('*').order('nome'),
  ]);
  const todas = (movsData ?? []) as Movimentacao[];
  const cats = (catsData ?? []) as Categoria[];
  const movs = sp.tipo === 'entrada' || sp.tipo === 'saida' ? todas.filter((m) => m.tipo === sp.tipo) : todas;
  const entradas = todas.filter((m) => m.tipo === 'entrada').reduce((s, m) => s + Number(m.valor), 0);
  const saidas = todas.filter((m) => m.tipo === 'saida').reduce((s, m) => s + Number(m.valor), 0);
  const fixas = todas.filter((m) => m.tipo === 'saida' && m.categorias?.fixa).reduce((s, m) => s + Number(m.valor), 0);

  const ed = sp.editar ? todas.find((m) => m.id === sp.editar) : undefined;
  const volta = `/financeiro?mes=${mesQs}${sp.tipo ? `&tipo=${sp.tipo}` : ''}`;
  const tipoForm = ed?.tipo ?? (sp.tipo === 'entrada' ? 'entrada' : 'saida');

  return (
    <>
      <header className="topo">
        <div className="sobe">
          <div className="sobre">Controle de caixa</div>
          <h1>{maiuscula(MESES[mes - 1])} <em>{ano}</em></h1>
          <CosturaTitulo />
        </div>
        <div className="acoes sobe" style={{ '--i': 1 } as React.CSSProperties}>
          <Link href={`/financeiro?mes=${mesParam(ano, mes, -1)}`} className="btn fantasma">←</Link>
          <span className="mes-atual">{MESES[mes - 1].slice(0, 3)}/{ano}</span>
          <Link href={`/financeiro?mes=${mesParam(ano, mes, 1)}`} className="btn fantasma">→</Link>
          {mesQs !== hoje().slice(0, 7) && <Link href="/financeiro" className="btn fantasma pequeno">voltar ao mês atual</Link>}
        </div>
      </header>

      <section className="grade g4" style={{ marginBottom: 20 }}>
        <div className="folha indicador sobe" style={{ '--i': 1 } as React.CSSProperties}>
          <div className="rotulo">Entradas</div><span className="valor" style={{ color: 'var(--salvia)' }}>{dinheiro(entradas)}</span>
        </div>
        <div className="folha indicador sobe" style={{ '--i': 2 } as React.CSSProperties}>
          <div className="rotulo">Saídas</div><span className="valor" style={{ color: 'var(--alfinete)' }}>{dinheiro(saidas)}</span>
        </div>
        <div className="folha indicador sobe" style={{ '--i': 3 } as React.CSSProperties}>
          <div className="rotulo">Despesas fixas</div><span className="valor">{dinheiro(fixas)}</span>
          <div className="nota">{saidas ? Math.round((fixas / saidas) * 100) : 0}% das saídas</div>
        </div>
        <div className="folha indicador ameixa sobe" style={{ '--i': 4 } as React.CSSProperties}>
          <div className="rotulo">Saldo do mês</div><span className="valor">{dinheiro(entradas - saidas)}</span>
          <span className="carimbo">R$</span>
        </div>
      </section>

      <section className="grade g-lado">
        <div className="folha pesponto sobe" style={{ '--i': 5 } as React.CSSProperties}>
          <header>
            <h2>Movimentações</h2>
            <nav className="abas">
              <Link href={`/financeiro?mes=${mesQs}`} className={!sp.tipo ? 'ativo' : ''}>Todas</Link>
              <Link href={`/financeiro?mes=${mesQs}&tipo=entrada`} className={sp.tipo === 'entrada' ? 'ativo' : ''}>Entradas</Link>
              <Link href={`/financeiro?mes=${mesQs}&tipo=saida`} className={sp.tipo === 'saida' ? 'ativo' : ''}>Saídas</Link>
            </nav>
          </header>
          {movs.length ? (
            <div className="rolagem">
              <table className="tabela">
                <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th className="direita">Valor</th><th /></tr></thead>
                <tbody>
                  {movs.map((m) => (
                    <tr key={m.id} style={m.id === sp.editar ? { background: 'var(--lilas-claro)' } : undefined}>
                      <td className="num suave">{dataCurta(m.data)}</td>
                      <td>
                        {m.ordem_id ? <Link href={`/ordens/${m.ordem_id}`}>{m.descricao}</Link> : m.descricao}
                        {m.forma_pagamento && <span className="suave pequeno"> · {m.forma_pagamento}</span>}
                      </td>
                      <td>{m.categorias ? <span className={`etiqueta ${m.categorias.fixa ? 'fixa' : m.tipo}`}>{m.categorias.nome}</span> : <span className="suave">—</span>}</td>
                      <td className="direita valor" style={{ color: m.tipo === 'entrada' ? 'var(--salvia)' : 'var(--alfinete)' }}>
                        {m.tipo === 'entrada' ? '+' : '−'} {dinheiro(m.valor)}
                      </td>
                      <td className="direita" style={{ whiteSpace: 'nowrap' }}>
                        <Link href={`${volta}&editar=${m.id}`} className="pequeno">editar</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="vazio">Nenhuma movimentação neste mês.</p>
          )}
        </div>

        <div className="folha sobe" style={{ '--i': 6, position: 'sticky', top: 24 } as React.CSSProperties}>
          <header>
            <h2>{ed ? 'Corrigir lançamento' : 'Novo lançamento'}</h2>
            {ed && <Link href={volta}>cancelar</Link>}
          </header>
          {sp.erro && <div className="aviso">Preencha a descrição e um valor maior que zero.</div>}
          <form action={salvarMovimentacao} className="pilha" style={{ gap: 12 }} key={ed?.id ?? 'novo'}>
            {ed && <input type="hidden" name="id" value={ed.id} />}
            <input type="hidden" name="volta" value={volta} />
            <TipoCategoria cats={cats} tipoInicial={tipoForm} categoriaInicial={ed?.categoria_id}>
              <label className="campo"><span>Descrição</span><input name="descricao" required defaultValue={ed?.descricao} placeholder="Ex.: Conta de luz" /></label>
              <div className="linha-form">
                <label className="campo"><span>Valor (R$)</span><InputDinheiro name="valor" required defaultValue={dinheiroParaTexto(ed?.valor)} /></label>
                <label className="campo"><span>Data</span><InputData name="data" required defaultValue={ed?.data ?? (mesQs === hoje().slice(0, 7) ? hoje() : inicioDoMes(ano, mes))} /></label>
              </div>
            </TipoCategoria>
            <label className="campo">
              <span>Forma de pagamento</span>
              <select name="forma_pagamento" defaultValue={ed?.forma_pagamento ?? ''}>
                <option value="">—</option>
                {FORMAS_PAGAMENTO.map((f) => <option key={f}>{f}</option>)}
              </select>
            </label>
            <button className="btn">{ed ? 'Salvar correção' : 'Lançar'}</button>
          </form>
          {ed && (
            <form action={excluirMovimentacao} style={{ marginTop: 12, textAlign: 'right' }}>
              <input type="hidden" name="id" value={ed.id} />
              <input type="hidden" name="volta" value={volta} />
              <button className="link-btn perigo pequeno">excluir este lançamento</button>
            </form>
          )}
          <p className="pequeno suave" style={{ marginBottom: 0 }}>
            <Link href="/opcoes/categorias">Gerenciar categorias</Link> · <Link href="/financeiro/relatorios">Relatórios</Link>
          </p>
        </div>
      </section>
    </>
  );
}
