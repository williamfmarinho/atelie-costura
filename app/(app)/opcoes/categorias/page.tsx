import Link from 'next/link';
import { excluirCategoria, salvarCategoria } from '@/app/actions';
import { db, type Categoria } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function Categorias({ searchParams }: { searchParams: Promise<{ editar?: string; erro?: string }> }) {
  const sp = await searchParams;
  const { data } = await db().from('categorias').select('*').order('fixa', { ascending: false }).order('nome');
  const cats = (data ?? []) as Categoria[];
  const ed = cats.find((c) => c.id === sp.editar);

  const Lista = ({ tipo, titulo }: { tipo: 'entrada' | 'saida'; titulo: string }) => (
    <div className="folha pesponto sobe" style={{ '--i': tipo === 'saida' ? 2 : 3 } as React.CSSProperties}>
      <header><h2>{titulo}</h2></header>
      <table className="tabela">
        <tbody>
          {cats.filter((c) => c.tipo === tipo).map((c) => (
            <tr key={c.id}>
              <td><b>{c.nome}</b></td>
              <td>{c.fixa && <span className="etiqueta fixa">fixa</span>}</td>
              <td className="direita" style={{ whiteSpace: 'nowrap' }}>
                <Link href={`/opcoes/categorias?editar=${c.id}`} className="pequeno">editar</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <section className="grade g-lado">
        <div className="pilha">
          <Lista tipo="saida" titulo="Saídas" />
          <Lista tipo="entrada" titulo="Entradas" />
        </div>
        <div className="folha sobe" style={{ '--i': 4, position: 'sticky', top: 24 } as React.CSSProperties}>
          <header><h2>{ed ? 'Editar categoria' : 'Nova categoria'}</h2>{ed && <Link href="/opcoes/categorias">cancelar</Link>}</header>
          {sp.erro === 'dup' && <div className="aviso">Já existe uma categoria com esse nome.</div>}
          {sp.erro === 'nome' && <div className="aviso">Informe o nome.</div>}
          <form action={salvarCategoria} className="pilha" style={{ gap: 12 }} key={ed?.id ?? 'nova'}>
            {ed && <input type="hidden" name="id" value={ed.id} />}
            <label className="campo"><span>Nome</span><input name="nome" required defaultValue={ed?.nome} placeholder="Ex.: Aluguel" /></label>
            <label className="campo">
              <span>Tipo</span>
              <select name="tipo" defaultValue={ed?.tipo ?? 'saida'}>
                <option value="saida">Saída (despesa)</option>
                <option value="entrada">Entrada (receita)</option>
              </select>
            </label>
            <label className="linha" style={{ gap: 8, background: 'var(--papel-2)', padding: '12px 14px', borderRadius: 10 }}>
              <input type="checkbox" name="fixa" defaultChecked={ed?.fixa} />
              <span><b>Despesa fixa</b><br /><span className="pequeno suave">Aluguel, água, luz… aparece separada nos relatórios.</span></span>
            </label>
            <button className="btn">{ed ? 'Salvar' : 'Criar categoria'}</button>
          </form>
          {ed && (
            <form action={excluirCategoria} style={{ marginTop: 12, textAlign: 'right' }}>
              <input type="hidden" name="id" value={ed.id} />
              <button className="link-btn perigo pequeno">excluir (lançamentos ficam sem categoria)</button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
