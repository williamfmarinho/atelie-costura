'use client';
import { useState } from 'react';
import { IcOlho, IcOlhoFechado } from './Icones';

/** Campo de senha com o olho para mostrar/esconder o que foi digitado. */
export default function InputSenha(props: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [ver, setVer] = useState(false);
  return (
    <div className="input-senha">
      <input {...props} type={ver ? 'text' : 'password'} />
      <button type="button" onClick={() => setVer(!ver)} aria-label={ver ? 'Esconder senha' : 'Mostrar senha'} title={ver ? 'Esconder' : 'Mostrar'}>
        {ver ? <IcOlhoFechado /> : <IcOlho />}
      </button>
    </div>
  );
}
