'use client';
import { IcImprimir } from './Icones';

export default function BotaoImprimir({ rotulo = 'Imprimir' }: { rotulo?: string }) {
  return (
    <button type="button" className="btn fantasma nao-imprime" onClick={() => window.print()}>
      <IcImprimir /> {rotulo}
    </button>
  );
}
