'use client';

import { useActionState } from 'react';
import { alterarSenha } from '@/app/actions';
import { IcCheck } from './Icones';
import InputSenha from './InputSenha';

export default function FormSenha() {
  const [estado, acao, salvando] = useActionState(alterarSenha, null);
  return (
    <form action={acao} className="pilha" style={{ gap: 14 }} key={estado?.ok ? 'ok' : 'form'}>
      {estado?.erro && <div className="aviso">{estado.erro}</div>}
      {estado?.ok && <div className="aviso ok">Senha alterada! Os outros aparelhos vão precisar entrar de novo com a senha nova.</div>}
      <label className="campo"><span>Senha atual</span><InputSenha name="atual" required autoComplete="current-password" /></label>
      <label className="campo"><span>Nova senha</span><InputSenha name="nova" required minLength={6} autoComplete="new-password" /></label>
      <label className="campo"><span>Confirme a nova senha</span><InputSenha name="confirmacao" required minLength={6} autoComplete="new-password" /></label>
      <div className="linha"><button className="btn alfinete" disabled={salvando}><IcCheck /> {salvando ? 'Salvando…' : 'Alterar senha'}</button></div>
    </form>
  );
}
