// Mostrado na hora em que se troca de aba, enquanto a página busca os dados.
export default function Carregando() {
  return (
    <div className="carregando-pagina" aria-busy="true" aria-label="Carregando">
      <div className="esq-titulo" />
      <div className="grade g4" style={{ marginTop: 26 }}>
        {[0, 1, 2, 3].map((i) => <div key={i} className="esq-bloco" style={{ height: 96, animationDelay: `${i * 90}ms` }} />)}
      </div>
      <div className="esq-bloco" style={{ height: 280, marginTop: 18 }} />
    </div>
  );
}
