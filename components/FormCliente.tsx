import { salvarCliente } from '@/app/actions';
import type { Cliente } from '@/lib/supabase';
import { CamposCliente } from './Campos';

export default function FormCliente({ c, erro }: { c: Cliente; erro?: string }) {
  return (
    <form action={salvarCliente} className="pilha" style={{ gap: 14 }}>
      {erro === 'cpf' && <div className="aviso">Já existe uma cliente com esse CPF.</div>}
      {erro === 'nome' && <div className="aviso">Informe o nome.</div>}
      {erro === 'geral' && <div className="aviso">Não foi possível salvar. Tente novamente.</div>}
      <input type="hidden" name="id" value={c.id} />
      <CamposCliente c={c} />
      <div className="linha">
        <button className="btn">Salvar alterações</button>
      </div>
    </form>
  );
}
