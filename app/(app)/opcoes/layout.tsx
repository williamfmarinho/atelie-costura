import { CosturaTitulo } from '@/components/Icones';
import { AbasOpcoes } from '@/components/LinkOpcoes';

export default function LayoutOpcoes({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="topo">
        <div className="sobe">
          <div className="sobre">Opções</div>
          <h1>Ajustes do <em>ateliê</em></h1>
          <CosturaTitulo />
        </div>
      </header>
      <AbasOpcoes />
      {children}
    </>
  );
}
