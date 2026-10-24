'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IcEngrenagem } from './Icones';

export default function LinkOpcoes() {
  const ativo = usePathname().startsWith('/opcoes');
  return (
    <Link href="/opcoes" className={`opcoes ${ativo ? 'ativo' : ''}`} title="Opções">
      <IcEngrenagem /> <span>Opções</span>
    </Link>
  );
}

export function AbasOpcoes() {
  const path = usePathname();
  return (
    <nav className="abas" style={{ marginBottom: 20 }}>
      <Link href="/opcoes" className={path === '/opcoes' ? 'ativo' : ''}>Senha de acesso</Link>
      <Link href="/opcoes/categorias" className={path.startsWith('/opcoes/categorias') ? 'ativo' : ''}>Categorias financeiras</Link>
    </nav>
  );
}
