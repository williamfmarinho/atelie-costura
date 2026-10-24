// Agulha com linha solta — decoração fixa no canto inferior direito.
export default function Doodle() {
  return (
    <svg className="doodle" viewBox="0 0 320 260" aria-hidden>
      {/* linha: sai do buraco da agulha, faz um laço e termina num pesponto */}
      <path className="fio" d="M297 60 C 280 28, 228 34, 218 70 C 208 104, 250 112, 242 84 C 234 56, 172 64, 140 104 C 110 146, 60 150, 40 196 C 30 220, 40 240, 64 236" />
      <path className="ponto" d="M74 232 l14 -4 M100 224 l14 -5 M126 214 l13 -6" />
      {/* agulha inclinada */}
      <g transform="rotate(38 250 120)">
        <path className="agulha" d="M244 30 C 244 24, 256 24, 256 30 L 254 200 L 250 222 L 246 200 Z" />
        <ellipse className="buraco" cx="250" cy="44" rx="2.6" ry="9" />
      </g>
    </svg>
  );
}
