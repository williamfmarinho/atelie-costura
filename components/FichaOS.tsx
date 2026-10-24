import Link from 'next/link';
import { dataCurta, dinheiro, diasAte } from '@/lib/format';
import type { OrdemCompleta } from '@/lib/supabase';

export function EtiquetaStatus({ o }: { o: Pick<OrdemCompleta, 'status' | 'data_entrega'> }) {
  if (o.status === 'entregue') return <span className="etiqueta entregue">Entregue</span>;
  if (o.status === 'cancelada') return <span className="etiqueta cancelada">Cancelada</span>;
  const d = diasAte(o.data_entrega);
  if (d < 0) return <span className="etiqueta atrasada">Atrasada {-d}d</span>;
  if (d === 0) return <span className="etiqueta hoje">Entrega hoje</span>;
  return <span className="etiqueta">{d === 1 ? 'Amanhã' : `Em ${d} dias`}</span>;
}

export function resumoItens(o: Pick<OrdemCompleta, 'ordem_itens'>) {
  return [...(o.ordem_itens ?? [])]
    .sort((a, b) => a.posicao - b.posicao)
    .map((i) => (i.servico ? `${i.peca} (${i.servico})` : i.peca))
    .join(' · ');
}

export default function FichaOS({ o, i = 0, semCliente = false }: { o: OrdemCompleta; i?: number; semCliente?: boolean }) {
  return (
    <Link href={`/ordens/${o.id}`} className="ficha-os sobe" style={{ '--i': i } as React.CSSProperties}>
      <span className="n">nº {o.numero}</span>
      <span style={{ minWidth: 0 }}>
        <span className="quem">{semCliente ? `Entrada ${dataCurta(o.data_entrada)}` : o.clientes?.nome}</span>
        <span className="oque" style={{ display: 'block' }}>{resumoItens(o) || 'Sem itens'}</span>
      </span>
      <span className="lado">
        <span className="valor">{dinheiro(o.total)}</span>
        <span className="linha" style={{ gap: 6 }}>
          <span className="pequeno suave">{o.status === 'entregue' ? dataCurta(o.data_entrega_efetiva) : dataCurta(o.data_entrega)}</span>
          <EtiquetaStatus o={o} />
        </span>
      </span>
    </Link>
  );
}

export const SELECT_ORDEM = '*, clientes(id, nome, telefone), ordem_itens(*)';
