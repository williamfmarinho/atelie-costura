'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { buscarClientes, criarCliente, ultimasOrdens } from '@/app/actions';
import { dataCurta, dinheiro, formataCPF, formataTelefone } from '@/lib/format';
import type { Cliente, OrdemCompleta } from '@/lib/supabase';
import { CamposCliente } from './Campos';
import { EtiquetaStatus, resumoItens } from './FichaOS';
import { IcAgulha, IcBusca, IcCheck, IcMais, IcSeta } from './Icones';

type Props = {
  /** atendimento: mostra a ficha e o botão de Nova OS. os: devolve a cliente escolhida para o formulário. */
  modo: 'atendimento' | 'os';
  onEscolher?: (c: Cliente) => void;
  recentes?: Cliente[];
};

const ehDocumento = (t: string) => /\d/.test(t) && t.replace(/\D/g, '').length === t.replace(/[.\-\s()]/g, '').length;

export default function BuscaCliente({ modo, onEscolher, recentes = [] }: Props) {
  const [termo, setTermo] = useState('');
  const [pesquisado, setPesquisado] = useState('');
  const [resultados, setResultados] = useState<Cliente[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [ordens, setOrdens] = useState<OrdemCompleta[] | null>(null);
  const [aberta, setAberta] = useState<string | null>(null);
  const [cadastrando, setCadastrando] = useState(false);
  const [erro, setErro] = useState('');
  const [salvando, iniciar] = useTransition();
  const ultimaBusca = useRef(0);
  const [prefill, setPrefill] = useState('');
  const router = useRouter();

  async function buscar(t = termo) {
    const q = t.trim();
    if (q.length < 2) return;
    const id = ++ultimaBusca.current;
    setBuscando(true);
    const r = await buscarClientes(q);
    if (id !== ultimaBusca.current) return; // resposta antiga
    setBuscando(false);
    setPesquisado(q);
    setResultados(r);
    setPrefill(q);
    setCadastrando(r.length === 0);
    setErro('');
    if (r.length === 1) abrir(r[0]);
    else { setCliente(null); setOrdens(null); }
  }

  // busca sozinha depois de uma pausa na digitação
  useEffect(() => {
    if (termo.trim().length < 2 || termo.trim() === pesquisado) return;
    const t = setTimeout(() => buscar(termo), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termo]);

  async function abrir(c: Cliente) {
    setCliente(c);
    setCadastrando(false);
    setOrdens(null);
    setAberta(null);
    setOrdens(await ultimasOrdens(c.id));
  }

  function novoCliente() {
    setPrefill(termo.trim());
    setCliente(null);
    setOrdens(null);
    setErro('');
    setCadastrando(true);
  }

  function cadastrar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const abrirOS = (e.nativeEvent as SubmitEvent).submitter?.getAttribute('value') === 'os';
    iniciar(async () => {
      const r = await criarCliente(fd);
      if (r.erro || !r.cliente) return setErro(r.erro ?? 'Erro ao cadastrar.');
      if (modo === 'atendimento' && abrirOS) return router.push(`/atendimento?cliente=${r.cliente.id}`);
      setResultados([r.cliente]);
      setOrdens([]);
      setCliente(r.cliente);
      setCadastrando(false);
      if (modo === 'os') onEscolher?.(r.cliente);
    });
  }

  const lista = resultados ?? (termo.trim() ? [] : recentes);

  return (
    <div className="pilha">
      <form className="busca-grande" onSubmit={(e) => { e.preventDefault(); buscar(); }}>
        <IcBusca />
        <input value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Nome, CPF ou telefone da cliente" autoFocus autoComplete="off" />
        <button className="btn" aria-label="Buscar" disabled={buscando}>{buscando ? 'Buscando…' : <><IcBusca /> Buscar</>}</button>
        <button type="button" className="btn alfinete" onClick={novoCliente}><IcMais /> Novo cliente</button>
      </form>

      {/* várias encontradas (ou recentes) */}
      {!cliente && !cadastrando && lista.length > 0 && (
        <div className="folha pesponto sobe">
          <header>
            <h2>{resultados ? `${lista.length} encontradas` : 'Atendidas recentemente'}</h2>
            {resultados && <button type="button" className="btn pequeno fantasma" onClick={novoCliente}><IcMais /> Cadastrar nova</button>}
          </header>
          <div className="pilha" style={{ gap: 8 }}>
            {lista.map((c, i) => (
              <button type="button" key={c.id} onClick={() => abrir(c)} className="ficha-os sobe" style={{ '--i': i, gridTemplateColumns: '1fr auto', font: 'inherit', textAlign: 'left', cursor: 'pointer' } as React.CSSProperties}>
                <span>
                  <span className="quem">{c.nome}</span>
                  <span className="oque" style={{ display: 'block' }}>{[c.cpf && `CPF ${formataCPF(c.cpf)}`, formataTelefone(c.telefone)].filter(Boolean).join(' · ') || 'sem contato'}</span>
                </span>
                <IcSeta width={18} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* não encontrada (ou botão Novo cliente) → cadastro */}
      {cadastrando && (
        <div className="folha sobe">
          <header>
            <h2>{resultados?.length === 0 && prefill === pesquisado ? <>Nenhuma cliente para <em>“{pesquisado}”</em></> : 'Novo cliente'}</h2>
            <button type="button" className="link-btn" onClick={() => setCadastrando(false)}>cancelar</button>
          </header>
          <p className="suave" style={{ marginTop: -6 }}>Só o nome é obrigatório.</p>
          {erro && <div className="aviso">{erro}</div>}
          <form onSubmit={cadastrar} className="pilha" style={{ gap: 14 }} key={prefill}>
            <CamposCliente nomeInicial={ehDocumento(prefill) ? '' : prefill} cpfInicial={ehDocumento(prefill) && prefill.replace(/\D/g, '').length === 11 ? prefill : ''} />
            <div className="linha">
              {modo === 'atendimento' ? (
                <>
                  <button className="btn alfinete" name="acao" value="os" disabled={salvando}><IcAgulha /> {salvando ? 'Cadastrando…' : 'Cadastrar e abrir nova OS'}</button>
                  <button className="btn fantasma" name="acao" value="so" disabled={salvando}><IcCheck /> Só cadastrar</button>
                </>
              ) : (
                <button className="btn alfinete" disabled={salvando}><IcCheck /> {salvando ? 'Cadastrando…' : 'Cadastrar cliente'}</button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* cliente encontrada */}
      {cliente && (
        <section className="grade g-lado">
          <div className="folha pesponto sobe">
            <header>
              <h2>Ordens anteriores</h2>
              {resultados && resultados.length > 1 && <button type="button" className="link-btn" onClick={() => { setCliente(null); setOrdens(null); }}>← outras clientes</button>}
            </header>
            {ordens === null ? (
              <p className="vazio">Carregando…</p>
            ) : ordens.length === 0 ? (
              <p className="vazio">Primeira visita — nenhuma OS ainda.</p>
            ) : (
              <div className="pilha" style={{ gap: 8 }}>
                {ordens.map((o, i) => (
                  <div key={o.id} className="os-sanfona sobe" style={{ '--i': i } as React.CSSProperties}>
                    <button type="button" className="ficha-os" aria-expanded={aberta === o.id} onClick={() => setAberta(aberta === o.id ? null : o.id)}
                      style={{ width: '100%', font: 'inherit', textAlign: 'left', cursor: 'pointer' }}>
                      <span className="n">nº {o.numero}</span>
                      <span style={{ minWidth: 0 }}>
                        <span className="quem">{dataCurta(o.data_entrada)}</span>
                        <span className="oque" style={{ display: 'block' }}>{resumoItens(o)}</span>
                      </span>
                      <span className="lado"><span className="valor">{dinheiro(o.total)}</span><EtiquetaStatus o={o} /></span>
                    </button>
                    {aberta === o.id && (
                      <div className="os-detalhe">
                        <div className="pequeno suave" style={{ marginBottom: 8 }}>
                          Entrada {dataCurta(o.data_entrada)} · Entrega prevista {dataCurta(o.data_entrega)}
                          {o.status === 'entregue' && <> · Entregue {dataCurta(o.data_entrega_efetiva)} via {o.forma_pagamento}</>}
                        </div>
                        <table className="tabela">
                          <tbody>
                            {[...o.ordem_itens].sort((a, b) => a.posicao - b.posicao).map((it) => (
                              <tr key={it.id}><td><b>{it.peca}</b>{it.servico && <span className="suave"> — {it.servico}</span>}</td><td className="direita valor">{dinheiro(it.valor)}</td></tr>
                            ))}
                          </tbody>
                          <tfoot><tr><td>Total</td><td className="direita valor">{dinheiro(o.total)}</td></tr></tfoot>
                        </table>
                        {o.observacoes && <p className="pequeno suave">“{o.observacoes}”</p>}
                        <Link href={`/ordens/${o.id}`} className="pequeno">abrir OS completa →</Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="folha sobe" style={{ '--i': 1 } as React.CSSProperties}>
            <div style={{ fontFamily: 'var(--display)', fontSize: '1.8rem', fontWeight: 600, lineHeight: 1.1 }}>{cliente.nome}</div>
            <dl className="pilha" style={{ gap: 8, margin: '14px 0 0' }}>
              {[
                ['CPF', formataCPF(cliente.cpf) || '—'],
                ['Telefone', formataTelefone(cliente.telefone) || '—'],
                ['E-mail', cliente.email || '—'],
                ['Endereço', cliente.endereco || '—'],
              ].map(([k, v]) => (
                <div key={k} className="linha entre" style={{ borderBottom: '1px dashed var(--linha)', paddingBottom: 6 }}>
                  <dt className="suave pequeno">{k}</dt><dd style={{ margin: 0, textAlign: 'right' }}>{v}</dd>
                </div>
              ))}
            </dl>
            {cliente.observacoes && <p className="pequeno" style={{ whiteSpace: 'pre-wrap' }}>{cliente.observacoes}</p>}
            <div className="pilha" style={{ gap: 8, marginTop: 16 }}>
              {modo === 'atendimento' ? (
                <>
                  <Link href={`/atendimento?cliente=${cliente.id}`} className="btn alfinete"><IcAgulha /> Nova ordem de serviço</Link>
                  <Link href={`/clientes/${cliente.id}`} className="btn fantasma">Ficha completa / editar</Link>
                </>
              ) : (
                <button type="button" className="btn alfinete" onClick={() => onEscolher?.(cliente)}><IcCheck /> Usar esta cliente na OS</button>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
