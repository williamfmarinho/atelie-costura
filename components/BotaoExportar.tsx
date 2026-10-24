'use client';

import { useEffect, useRef, useState } from 'react';
import { IcExcel, IcImprimir } from './Icones';

/** Botão "Imprimir" com opções: imprimir/salvar PDF ou baixar planilha do Excel. */
export default function BotaoExportar({ excel }: { excel: string }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setAberto(false); };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false);
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('keydown', esc); };
  }, [aberto]);

  return (
    <div className="exportar nao-imprime" ref={ref}>
      <button type="button" className="btn fantasma" aria-expanded={aberto} onClick={() => setAberto(!aberto)}>
        <IcImprimir /> Imprimir ▾
      </button>
      {aberto && (
        <div className="exportar-menu" role="menu">
          <button type="button" role="menuitem" onClick={() => { setAberto(false); setTimeout(() => window.print(), 50); }}>
            <IcImprimir /> <span><b>Imprimir ou PDF</b><small>abre a janela de impressão</small></span>
          </button>
          <a role="menuitem" href={excel} download onClick={() => setAberto(false)}>
            <IcExcel /> <span><b>Planilha Excel (.xlsx)</b><small>resumo, categorias e lançamentos</small></span>
          </a>
        </div>
      )}
    </div>
  );
}
