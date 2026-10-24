'use client';

import { useState } from 'react';
import type { Categoria } from '@/lib/supabase';

/** Escolha Entrada/Saída + lista de categorias só do tipo escolhido. Os campos do meio vêm como children. */
export default function TipoCategoria({ cats, tipoInicial, categoriaInicial, children }: {
  cats: Categoria[]; tipoInicial: 'entrada' | 'saida'; categoriaInicial?: string | null; children: React.ReactNode;
}) {
  const [tipo, setTipo] = useState(tipoInicial);
  const [categoria, setCategoria] = useState(categoriaInicial ?? '');
  const doTipo = cats.filter((c) => c.tipo === tipo);

  function trocarTipo(t: 'entrada' | 'saida') {
    setTipo(t);
    // categoria do outro tipo não vale mais
    if (!cats.some((c) => c.id === categoria && c.tipo === t)) setCategoria('');
  }

  return (
    <>
      <div className="abas" style={{ alignSelf: 'flex-start' }}>
        {(['entrada', 'saida'] as const).map((t) => (
          <label key={t} className={tipo === t ? 'ativo' : ''} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, cursor: 'pointer' }}>
            <input type="radio" name="tipo" value={t} checked={tipo === t} onChange={() => trocarTipo(t)}
              style={{ width: 'auto', accentColor: t === 'entrada' ? 'var(--salvia)' : 'var(--alfinete)' }} />
            {t === 'entrada' ? 'Entrada' : 'Saída'}
          </label>
        ))}
      </div>
      {children}
      <label className="campo">
        <span>Categoria {tipo === 'entrada' ? 'de entrada' : 'de saída'}</span>
        <select name="categoria_id" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <option value="">Sem categoria</option>
          {doTipo.map((c) => <option key={c.id} value={c.id}>{c.nome}{c.fixa ? ' (fixa)' : ''}</option>)}
        </select>
      </label>
    </>
  );
}
