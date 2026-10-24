'use client';

import { useEffect, useRef, useState } from 'react';
import { brParaISO, isoParaBR, mascaraCPF, mascaraDinheiro, mascaraTelefone } from '@/lib/format';
import { IcAgenda } from './Icones';

type Base = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange'>;

/** Input de texto com máscara; envia o texto mascarado (o servidor guarda só os dígitos). */
function InputMascara({ mascara, defaultValue = '', onChange, ...rest }: Base & { mascara: (v: string) => string; defaultValue?: string; onChange?: (v: string) => void }) {
  const [v, setV] = useState(() => mascara(defaultValue));
  return (
    <input
      {...rest}
      value={v}
      onChange={(e) => {
        const m = mascara(e.target.value);
        setV(m);
        onChange?.(m);
      }}
    />
  );
}

export const InputCPF = (p: Base & { defaultValue?: string | null }) => (
  <InputMascara inputMode="numeric" placeholder="000.000.000-00" {...p} defaultValue={p.defaultValue ?? ''} mascara={mascaraCPF} />
);

export const InputTelefone = (p: Base & { defaultValue?: string | null }) => (
  <InputMascara inputMode="tel" placeholder="(00) 00000-0000" {...p} defaultValue={p.defaultValue ?? ''} mascara={mascaraTelefone} />
);

/** Valor em reais preenchido pelos centavos: 5500 → 55,00. */
export function InputDinheiro({ value, defaultValue, onChange, className = '', ...rest }: Base & { value?: string; defaultValue?: string; onChange?: (v: string) => void }) {
  const [interno, setInterno] = useState(defaultValue ?? '');
  const atual = value ?? interno;
  return (
    <input
      inputMode="numeric"
      placeholder="0,00"
      autoComplete="off"
      {...rest}
      className={`num ${className}`}
      style={{ textAlign: 'right', ...rest.style }}
      value={atual}
      onChange={(e) => {
        const m = mascaraDinheiro(e.target.value);
        if (value === undefined) setInterno(m);
        onChange?.(m);
      }}
    />
  );
}

/** Data no formato dd/mm/aaaa, com calendário. Valor interno/enviado em ISO (aaaa-mm-dd). */
export function InputData({
  name, value, defaultValue, onChange, min, max, required, autoFocus,
}: { name?: string; value?: string; defaultValue?: string; onChange?: (iso: string) => void; min?: string; max?: string; required?: boolean; autoFocus?: boolean }) {
  const [interno, setInterno] = useState(defaultValue ?? '');
  const iso = value ?? interno;
  const [texto, setTexto] = useState(isoParaBR(iso));
  const [erro, setErro] = useState('');
  const nativo = useRef<HTMLInputElement>(null);

  useEffect(() => { setTexto(isoParaBR(iso)); setErro(''); }, [iso]);

  function aplicar(novo: string) {
    if (min && novo < min) { setErro(`A data não pode ser antes de ${isoParaBR(min)}.`); return; }
    if (max && novo > max) { setErro(`A data não pode ser depois de ${isoParaBR(max)}.`); return; }
    setErro('');
    if (value === undefined) setInterno(novo);
    onChange?.(novo);
  }

  function digitar(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 8);
    const t = d.length > 4 ? `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}` : d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
    setTexto(t);
    if (d.length === 8) {
      const novo = brParaISO(t);
      if (novo) aplicar(novo);
      else setErro('Data inválida.');
    } else setErro('');
  }

  return (
    <div className={`input-data ${erro ? 'invalido' : ''}`}>
      <input
        inputMode="numeric"
        placeholder="dd/mm/aaaa"
        value={texto}
        required={required}
        autoFocus={autoFocus}
        onChange={(e) => digitar(e.target.value)}
        onBlur={() => { if (texto !== isoParaBR(iso)) { setTexto(isoParaBR(iso)); } }}
      />
      <button type="button" tabIndex={-1} aria-label="Abrir calendário" onClick={() => { try { nativo.current?.showPicker(); } catch { nativo.current?.focus(); } }}>
        <IcAgenda />
      </button>
      <input type="date" ref={nativo} className="nativo" tabIndex={-1} aria-hidden value={iso} min={min} max={max} onChange={(e) => e.target.value && aplicar(e.target.value)} />
      {name && <input type="hidden" name={name} value={iso} />}
      {erro && <small className="erro-campo">{erro}</small>}
    </div>
  );
}

/** Campos completos de cadastro de cliente (só o nome é obrigatório). */
export function CamposCliente({ c, nomeInicial = '', cpfInicial = '' }: {
  c?: { nome: string; cpf: string | null; telefone: string | null; email: string | null; endereco: string | null; observacoes: string | null } | null;
  nomeInicial?: string; cpfInicial?: string;
}) {
  return (
    <>
      <div className="linha-form">
        <label className="campo" style={{ gridColumn: 'span 2' }}>
          <span>Nome *</span>
          <input name="nome" required defaultValue={c?.nome ?? nomeInicial} autoFocus />
        </label>
        <label className="campo"><span>CPF</span><InputCPF name="cpf" defaultValue={c?.cpf ?? cpfInicial} /></label>
        <label className="campo"><span>Telefone / WhatsApp</span><InputTelefone name="telefone" defaultValue={c?.telefone} /></label>
        <label className="campo"><span>E-mail</span><input name="email" type="email" defaultValue={c?.email ?? ''} /></label>
        <label className="campo" style={{ gridColumn: 'span 2' }}><span>Endereço</span><input name="endereco" defaultValue={c?.endereco ?? ''} /></label>
      </div>
      <label className="campo">
        <span>Observações (medidas, preferências…)</span>
        <textarea name="observacoes" defaultValue={c?.observacoes ?? ''} />
      </label>
    </>
  );
}
