'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { cargaDosDias, filaDoDia, salvarOrdem, type FilaItem } from '@/app/actions';
import { addDias, dataLonga, dinheiro, dinheiroParaTexto, formataCPF, formataTelefone, hoje, textoParaNumero } from '@/lib/format';
import type { Cliente, OrdemCompleta } from '@/lib/supabase';
import BuscaCliente from './BuscaCliente';
import { InputData, InputDinheiro } from './Campos';
import { IcCheck, IcMais } from './Icones';

type ItemForm = { chave: number; peca: string; servico: string; valor: string };
type Carga = { data: string; qtd: number; total: number };

let seq = 1;
const novoItem = (): ItemForm => ({ chave: seq++, peca: '', servico: '', valor: '' });
const DIAS_FAIXA = 7;

export default function FormOS({ cliente: clienteInicial, ordem }: { cliente?: Cliente | null; ordem?: OrdemCompleta }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState('');
  const hj = hoje();

  const [cliente, setCliente] = useState<Cliente | null>(clienteInicial ?? null);
  const [dataEntrada, setDataEntrada] = useState(ordem?.data_entrada ?? hj);
  const [dataEntrega, setDataEntrega] = useState(ordem?.data_entrega ?? '');
  const [obs, setObs] = useState(ordem?.observacoes ?? '');
  const [itens, setItens] = useState<ItemForm[]>(() =>
    ordem?.ordem_itens.length
      ? [...ordem.ordem_itens].sort((a, b) => a.posicao - b.posicao).map((i) => ({ chave: seq++, peca: i.peca, servico: i.servico ?? '', valor: dinheiroParaTexto(i.valor) }))
      : [novoItem()]
  );

  // menor data de entrega permitida: hoje (ou a data já gravada de uma OS atrasada em edição)
  const minEntrega = ordem && ordem.data_entrega < hj ? ordem.data_entrega : hj;

  const diaVisto = dataEntrega || hj;
  const [fila, setFila] = useState<FilaItem[] | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [inicioFaixa, setInicioFaixa] = useState(hj);
  const [faixa, setFaixa] = useState<Carga[]>([]);
  const [janelaAberta, setJanelaAberta] = useState(false);
  const pecaRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const focarChave = useRef<number | null>(null);

  const total = useMemo(() => itens.reduce((s, i) => s + textoParaNumero(i.valor), 0), [itens]);

  // fila do dia visto (mantém o conteúdo anterior enquanto carrega → sem piscar)
  useEffect(() => {
    let vivo = true;
    setCarregando(true);
    filaDoDia(diaVisto, ordem?.id).then((f) => { if (vivo) { setFila(f); setCarregando(false); } });
    return () => { vivo = false; };
  }, [diaVisto, ordem?.id]);

  // faixa de dias: só se move quando a data escolhida sai dela
  useEffect(() => {
    if (!dataEntrega) return;
    const fim = addDias(inicioFaixa, DIAS_FAIXA - 1);
    if (dataEntrega < inicioFaixa || dataEntrega > fim) {
      const novo = addDias(dataEntrega, -3);
      setInicioFaixa(novo < minEntrega ? minEntrega : novo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataEntrega]);

  useEffect(() => {
    let vivo = true;
    cargaDosDias(inicioFaixa, addDias(inicioFaixa, DIAS_FAIXA - 1), ordem?.id).then((c) => vivo && setFaixa(c));
    return () => { vivo = false; };
  }, [inicioFaixa, ordem?.id]);

  useEffect(() => {
    if (focarChave.current != null) pecaRefs.current[focarChave.current]?.focus();
    focarChave.current = null;
  }, [itens.length]);

  const mudaItem = (chave: number, campo: keyof Omit<ItemForm, 'chave'>, v: string) =>
    setItens((xs) => xs.map((x) => (x.chave === chave ? { ...x, [campo]: v } : x)));
  const adiciona = () => {
    const n = novoItem();
    focarChave.current = n.chave;
    setItens((xs) => [...xs, n]);
  };

  function escolherData(v: string, abrirJanela = true) {
    if (v < minEntrega) return;
    setDataEntrega(v);
    if (abrirJanela) setJanelaAberta(true);
  }

  function moverFaixa(dias: number) {
    const novo = addDias(inicioFaixa, dias);
    setInicioFaixa(novo < hj ? hj : novo);
  }

  function enviar() {
    setErro('');
    if (!cliente) return setErro('Escolha ou cadastre a cliente primeiro.');
    if (!dataEntrega) return setErro('Defina a data de entrega.');
    iniciar(async () => {
      const r = await salvarOrdem({
        id: ordem?.id,
        cliente_id: cliente.id,
        data_entrada: dataEntrada,
        data_entrega: dataEntrega,
        observacoes: obs,
        itens: itens.map(({ peca, servico, valor }) => ({ peca, servico, valor })),
      });
      if (r.erro) setErro(r.erro);
      else router.push(`/ordens/${r.id}?ok=${ordem ? 'editada' : 'nova'}`);
    });
  }

  const janela = (onFechar?: () => void) => (
    <JanelaDia
      data={diaVisto} escolhida={!!dataEntrega} fila={fila} carregando={carregando} total={total}
      faixa={faixa} minimo={minEntrega} podeVoltar={inicioFaixa > hj}
      onEscolher={(d) => escolherData(d, false)} onMover={moverFaixa} onFechar={onFechar}
    />
  );

  // sem cliente ainda: primeiro a busca/cadastro
  if (!cliente) {
    return (
      <div className="pilha">
        <div className="passo sobe"><b>1</b> Encontre ou cadastre a cliente</div>
        <BuscaCliente modo="os" onEscolher={setCliente} />
      </div>
    );
  }

  return (
    <div className="grade g-lado">
      <div className="pilha">
        {erro && <div className="aviso">{erro}</div>}

        <section className="folha sobe" style={{ '--i': 1 } as React.CSSProperties}>
          <header><h2>Cliente</h2>{!ordem && <Link href="/atendimento" className="pequeno">trocar cliente</Link>}</header>
          <div className="linha entre" style={{ background: 'var(--lilas-claro)', borderRadius: 12, padding: '12px 16px' }}>
            <div>
              <div style={{ fontFamily: 'var(--display)', fontSize: '1.45rem', fontWeight: 600 }}>{cliente.nome}</div>
              <div className="pequeno suave">{[cliente.cpf && `CPF ${formataCPF(cliente.cpf)}`, formataTelefone(cliente.telefone)].filter(Boolean).join(' · ') || 'sem contato cadastrado'}</div>
            </div>
            <Link href={`/clientes/${cliente.id}`} className="pequeno" target="_blank">ver ficha ↗</Link>
          </div>
        </section>

        <section className="folha sobe" style={{ '--i': 2 } as React.CSSProperties}>
          <header><h2>Datas</h2></header>
          <div className="linha-form" style={{ alignItems: 'start' }}>
            <label className="campo"><span>Entrada</span><InputData value={dataEntrada} onChange={setDataEntrada} max={hj} /></label>
            <label className="campo"><span>Entrega prevista</span><InputData value={dataEntrega} onChange={(v) => escolherData(v)} min={minEntrega} /></label>
          </div>
        </section>

        <section className="folha pesponto sobe" style={{ '--i': 3 } as React.CSSProperties}>
          <header><h2>Peças e serviços</h2><span className="suave pequeno">valor combinado na hora</span></header>
          <div className="itens-os">
            {itens.map((it, idx) => (
              <div key={it.chave} className="item-os">
                <span className="ordem">{String(idx + 1).padStart(2, '0')}</span>
                <input placeholder="Peça (ex.: Vestido)" value={it.peca} ref={(el) => { pecaRefs.current[it.chave] = el; }} onChange={(e) => mudaItem(it.chave, 'peca', e.target.value)} />
                <input placeholder="Serviço (ex.: barra e ajuste na cintura)" value={it.servico} onChange={(e) => mudaItem(it.chave, 'servico', e.target.value)} />
                <InputDinheiro value={it.valor} onChange={(v) => mudaItem(it.chave, 'valor', v)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adiciona(); } }} />
                <button type="button" className="remover" title="Remover" onClick={() => setItens((xs) => (xs.length > 1 ? xs.filter((x) => x.chave !== it.chave) : [novoItem()]))}>×</button>
              </div>
            ))}
          </div>
          <button type="button" className="btn fantasma pequeno" style={{ marginTop: 12 }} onClick={adiciona}><IcMais /> Adicionar peça</button>
          <div className="soma-os">
            <span>Total da OS</span>
            <span className="valor">{dinheiro(total)}</span>
          </div>
          <label className="campo" style={{ marginTop: 16 }}>
            <span>Observações</span>
            <textarea value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Medidas, detalhes, sinal pago…" />
          </label>
        </section>

        <div className="linha">
          <button type="button" onClick={enviar} className="btn alfinete" disabled={pendente} style={{ padding: '14px 26px', fontSize: '1rem' }}>
            <IcCheck /> {pendente ? 'Salvando…' : ordem ? 'Salvar alterações' : 'Registrar ordem de serviço'}
          </button>
          {ordem && <Link href={`/ordens/${ordem.id}`} className="btn fantasma">Cancelar edição</Link>}
        </div>
      </div>

      <aside style={{ position: 'sticky', top: 24 }} className="sobe">{janela()}</aside>

      {janelaAberta && (
        <div className="veu" onClick={() => setJanelaAberta(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(520px, 100%)' }}>
            {janela(() => setJanelaAberta(false))}
            <button type="button" className="btn" style={{ width: '100%', marginTop: 10 }} onClick={() => setJanelaAberta(false)}>
              <IcCheck /> Confirmar {dataEntrega && dataLonga(dataEntrega).toLowerCase()}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function JanelaDia({ data, escolhida, fila, carregando, total, faixa, minimo, podeVoltar, onEscolher, onMover, onFechar }: {
  data: string; escolhida: boolean; fila: FilaItem[] | null; carregando: boolean; total: number;
  faixa: Carga[]; minimo: string; podeVoltar: boolean;
  onEscolher: (d: string) => void; onMover: (dias: number) => void; onFechar?: () => void;
}) {
  const lista = fila ?? [];
  const soma = lista.reduce((s, o) => s + Number(o.total), 0);
  const comEsta = soma + total;
  const maior = Math.max(1, ...faixa.map((v) => v.total));
  return (
    <div className={`janela-dia ${carregando ? 'carregando' : ''}`}>
      <div className="cab">
        {onFechar && <button type="button" className="fechar" onClick={onFechar} aria-label="Fechar">×</button>}
        <small>{escolhida ? 'Fila de entregas' : 'Prévia de hoje · escolha a data de entrega'}</small>
        <h3>{data === hoje() ? `Hoje, ${dataLonga(data).split(', ')[1]}` : dataLonga(data)}</h3>
        <div className="total-dia">{dinheiro(soma)}</div>
        <div style={{ fontSize: '0.88rem', opacity: 0.85 }}>
          {fila === null ? 'Carregando…' : lista.length === 0 ? 'Dia livre — nenhum serviço agendado.' : `${lista.length} ${lista.length === 1 ? 'serviço já agendado' : 'serviços já agendados'} para este dia`}
        </div>
        {escolhida && total > 0 && (
          <>
            <div className="medidor"><i style={{ width: `${(soma / Math.max(comEsta, 1)) * 100}%` }} /></div>
            <div style={{ fontSize: '0.82rem', marginTop: 6, opacity: 0.85 }}>Com esta OS o dia fica em <b>{dinheiro(comEsta)}</b></div>
          </>
        )}
      </div>
      <div className="corpo">
        {lista.map((o) => (
          <div key={o.id} className="item-fila">
            <span>
              <b>{o.clientes?.nome}</b> <span className="suave pequeno">nº {o.numero}</span>
              <span className="pequeno suave" style={{ display: 'block' }}>{o.ordem_itens.map((i) => i.peca).join(', ')}</span>
            </span>
            <span style={{ textAlign: 'right' }}>
              <span className="valor">{dinheiro(o.total)}</span>
              {o.status === 'entregue' && <span className="etiqueta entregue" style={{ display: 'flex', marginTop: 4 }}>entregue</span>}
            </span>
          </div>
        ))}
        <div className="linha entre" style={{ margin: '14px 0 8px' }}>
          <span className="pequeno suave" style={{ letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: '0.68rem' }}>Próximos dias · toque para escolher</span>
          <span className="linha" style={{ gap: 4 }}>
            <button type="button" className="seta-faixa" disabled={!podeVoltar} onClick={() => onMover(-7)} aria-label="Semana anterior">‹</button>
            <button type="button" className="seta-faixa" onClick={() => onMover(7)} aria-label="Próxima semana">›</button>
          </span>
        </div>
        <div className="faixa-dias">
          {faixa.map((v) => {
            const bloqueado = v.data < minimo;
            return (
              <button type="button" key={v.data} disabled={bloqueado} onClick={() => onEscolher(v.data)} title={`${v.qtd} serviço(s) · ${dinheiro(v.total)}`}
                className={`${escolhida && v.data === data ? 'sel' : ''} ${v.data === hoje() ? 'hoje' : ''}`}>
                <span className="sem">{new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'UTC' }).format(new Date(v.data + 'T12:00:00Z')).replace('.', '')}</span>
                <b>{v.data.slice(8)}</b>
                <span className="tubo"><span style={{ height: `${(v.total / maior) * 100}%` }} /></span>
                <span className="qtd">{v.qtd}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
