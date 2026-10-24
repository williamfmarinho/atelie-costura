'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IcAgenda, IcCaixa, IcGrafico, IcLista, IcPainel, IcTesoura } from './Icones';

const grupos = [
  { titulo: 'Ateliê', itens: [
    { href: '/', rotulo: 'Painel', Ic: IcPainel },
    { href: '/atendimento', rotulo: 'Atendimento', Ic: IcTesoura },
    { href: '/ordens', rotulo: 'Ordens de serviço', Ic: IcLista },
    { href: '/agenda', rotulo: 'Agenda de entregas', Ic: IcAgenda },
  ] },
  { titulo: 'Financeiro', itens: [
    { href: '/financeiro', rotulo: 'Caixa', Ic: IcCaixa },
    { href: '/financeiro/relatorios', rotulo: 'Relatórios', Ic: IcGrafico },
  ] },
];

export default function Menu() {
  const path = usePathname();
  const ativo = (href: string) => {
    if (href === '/') return path === '/';
    if (href === '/ordens') return path.startsWith('/ordens');
    if (href === '/financeiro') return path === '/financeiro';
    if (href === '/atendimento') return path.startsWith('/atendimento') || path.startsWith('/clientes');
    return path.startsWith(href);
  };
  return (
    <nav className="menu">
      {grupos.map((g) => (
        <div key={g.titulo} style={{ display: 'contents' }}>
          <div className="grupo">{g.titulo}</div>
          {g.itens.map(({ href, rotulo, Ic }) => (
            <Link key={href} href={href} className={ativo(href) ? 'ativo' : ''}>
              <Ic /> {rotulo}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
