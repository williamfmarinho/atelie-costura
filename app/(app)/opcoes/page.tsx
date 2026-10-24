import FormSenha from '@/components/FormSenha';

export default function OpcoesSenha() {
  return (
    <section className="grade g-lado">
      <div className="folha pesponto sobe">
        <header><h2>Alterar senha de acesso</h2></header>
        <FormSenha />
      </div>
      <div className="folha sobe" style={{ '--i': 1 } as React.CSSProperties}>
        <header><h3>Como funciona</h3></header>
        <ul className="suave" style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }}>
          <li>A senha vale para todos os aparelhos do ateliê.</li>
          <li>Use pelo menos 6 caracteres.</li>
          <li>Ao trocar, este aparelho continua conectado e os demais pedem a senha nova.</li>
          <li>Toque no olho para conferir o que foi digitado.</li>
        </ul>
      </div>
    </section>
  );
}
