import Link from 'next/link';
import BotaoExportar from '@/components/BotaoExportar';
import { CosturaTitulo } from '@/components/Icones';
import { dataCurta, dinheiro, mesParam } from '@/lib/format';
import { montarRelatorio, PERIODOS, type Periodo } from '@/lib/relatorio';

export const dynamic = 'force-dynamic';

export default async function Relatorios({ searchParams }: { searchParams: Promise<{ p?: string; ref?: string }> }) {
  const sp = await searchParams;
  const { p, n, ano, mesIni, ini, fim, refQs, saidas, entradas, totS, totE, totFixas, porCategoria, meses, titulo } = await montarRelatorio(sp.p, sp.ref);
  const maiorCat = Math.max(1, ...porCategoria.map((c) => c.total));
  const maiorMes = Math.max(1, ...meses.flatMap((m) => [m.e, m.s]));

  return (
    <>
      <header className="topo">
        <div className="sobe">
          <div className="sobre">Relatório de despesas</div>
          <h1><em>{titulo}</em></h1>
          <CosturaTitulo />
        </div>
        <div className="acoes sobe nao-imprime" style={{ '--i': 1 } as React.CSSProperties}>
          <nav className="abas">
            {(Object.keys(PERIODOS) as Periodo[]).map((k) => (
              <Link key={k} href={`/financeiro/relatorios?p=${k}`} className={p === k ? 'ativo' : ''}>{PERIODOS[k].rotulo}</Link>
            ))}
          </nav>
          <Link href={`/financeiro/relatorios?p=${p}&ref=${mesParam(ano, mesIni, -n)}`} className="btn fantasma">←</Link>
          <Link href={`/financeiro/relatorios?p=${p}&ref=${mesParam(ano, mesIni, n)}`} className="btn fantasma">→</Link>
          <BotaoExportar excel={`/financeiro/relatorios/excel?p=${p}&ref=${refQs}`} />
        </div>
      </header>

      <section className="grade g4" style={{ marginBottom: 20 }}>
        <div className="folha indicador sobe" style={{ '--i': 1 } as React.CSSProperties}><div className="rotulo">Total de despesas</div><span className="valor" style={{ color: 'var(--alfinete)' }}>{dinheiro(totS)}</span><div className="nota">{saidas.length} lançamentos</div></div>
        <div className="folha indicador sobe" style={{ '--i': 2 } as React.CSSProperties}><div className="rotulo">Despesas fixas</div><span className="valor">{dinheiro(totFixas)}</span><div className="nota">variáveis: {dinheiro(totS - totFixas)}</div></div>
        <div className="folha indicador sobe" style={{ '--i': 3 } as React.CSSProperties}><div className="rotulo">Entradas</div><span className="valor" style={{ color: 'var(--salvia)' }}>{dinheiro(totE)}</span><div className="nota">{entradas.length} lançamentos</div></div>
        <div className="folha indicador ameixa sobe" style={{ '--i': 4 } as React.CSSProperties}><div className="rotulo">Resultado</div><span className="valor">{dinheiro(totE - totS)}</span><div className="nota">{dataCurta(ini)} a {dataCurta(fim)}</div></div>
      </section>

      <section className="grade g2" style={{ marginBottom: 20 }}>
        <div className="folha pesponto sobe" style={{ '--i': 5 } as React.CSSProperties}>
          <header><h2>Despesas por categoria</h2></header>
          {porCategoria.length ? porCategoria.map((c, i) => (
            <div key={c.nome} className="barra-linha">
              <span>{c.nome} {c.fixa && <span className="etiqueta fixa" style={{ marginLeft: 4 }}>fixa</span>}</span>
              <span className="barra"><i className={c.fixa ? 'fixa' : ''} style={{ width: `${(c.total / maiorCat) * 100}%`, animationDelay: `${i * 60}ms` }} /></span>
              <span className="valor">{dinheiro(c.total)}</span>
            </div>
          )) : <p className="vazio">Sem despesas no período.</p>}
        </div>
        <div className="folha sobe" style={{ '--i': 6 } as React.CSSProperties}>
          <header>
            <h2>{n > 1 ? 'Mês a mês' : 'Entradas × saídas'}</h2>
            <span className="linha pequeno"><span className="etiqueta entrada">entradas</span><span className="etiqueta saida">saídas</span></span>
          </header>
          <div className="colunas-mes">
            {meses.map((m, i) => (
              <div key={m.rotulo} className="col">
                <div className="pares">
                  <i className="e" style={{ height: `${(m.e / maiorMes) * 100}%`, animationDelay: `${i * 80}ms` }} title={dinheiro(m.e)} />
                  <i className="s" style={{ height: `${(m.s / maiorMes) * 100}%`, animationDelay: `${i * 80 + 40}ms` }} title={dinheiro(m.s)} />
                </div>
                <small>{m.rotulo}</small>
              </div>
            ))}
          </div>
          <table className="tabela" style={{ marginTop: 12 }}>
            <thead><tr><th>Mês</th><th className="direita">Entradas</th><th className="direita">Saídas</th><th className="direita">Saldo</th></tr></thead>
            <tbody>
              {meses.map((m) => (
                <tr key={m.rotulo}>
                  <td style={{ textTransform: 'capitalize' }}>{m.rotulo}</td>
                  <td className="direita valor">{dinheiro(m.e)}</td>
                  <td className="direita valor">{dinheiro(m.s)}</td>
                  <td className="direita valor" style={{ color: m.e - m.s < 0 ? 'var(--alfinete)' : undefined }}>{dinheiro(m.e - m.s)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="folha sobe" style={{ '--i': 7 } as React.CSSProperties}>
        <header><h2>Todas as despesas do período</h2></header>
        {saidas.length ? (
          <div className="rolagem">
            <table className="tabela">
              <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Pagamento</th><th className="direita">Valor</th></tr></thead>
              <tbody>
                {saidas.map((m) => (
                  <tr key={m.id}>
                    <td className="num suave">{dataCurta(m.data)}</td>
                    <td>{m.descricao}</td>
                    <td>{m.categorias ? <span className={`etiqueta ${m.categorias.fixa ? 'fixa' : 'saida'}`}>{m.categorias.nome}</span> : '—'}</td>
                    <td className="suave">{m.forma_pagamento ?? '—'}</td>
                    <td className="direita valor">{dinheiro(m.valor)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr><td colSpan={4}>Total</td><td className="direita valor">{dinheiro(totS)}</td></tr></tfoot>
            </table>
          </div>
        ) : <p className="vazio">Nada lançado.</p>}
      </div>
    </>
  );
}
