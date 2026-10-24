// Ícones traço fino, no espírito do desenho da logo.
type P = React.SVGProps<SVGSVGElement>;
const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export const IcPainel = (p: P) => (<svg {...base} {...p}><path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-4H4zM14 4v4h6V4z" /></svg>);
export const IcTesoura = (p: P) => (<svg {...base} {...p}><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M8.1 8.1 20 20M8.1 15.9 20 4" /></svg>);
export const IcAgulha = (p: P) => (<svg {...base} {...p}><path d="M4 20 18.5 5.5a2.1 2.1 0 1 1 3 3L7 23" /><path d="M17 7c-4-3-9-2-11 2s1 7 4 6" /></svg>);
export const IcAgenda = (p: P) => (<svg {...base} {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /><path d="M7 14h2M11 14h2M15 14h2M7 17h2M11 17h2" /></svg>);
export const IcCaixa = (p: P) => (<svg {...base} {...p}><path d="M3 7h18v12H3z" /><path d="M3 11h18" /><circle cx="16.5" cy="15" r="1.5" /><path d="M6 7V5h12v2" /></svg>);
export const IcEtiqueta = (p: P) => (<svg {...base} {...p}><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1.5" /></svg>);
export const IcGrafico = (p: P) => (<svg {...base} {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>);
export const IcLista = (p: P) => (<svg {...base} {...p}><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /></svg>);
export const IcBusca = (p: P) => (<svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>);
export const IcMais = (p: P) => (<svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>);
export const IcCheck = (p: P) => (<svg {...base} {...p}><path d="m5 12 5 5L20 7" /></svg>);
export const IcSeta = (p: P) => (<svg {...base} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
export const IcVolta = (p: P) => (<svg {...base} {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>);
export const IcImprimir = (p: P) => (<svg {...base} {...p}><path d="M6 9V3h12v6M6 18H4v-7h16v7h-2" /><path d="M6 14h12v7H6z" /></svg>);

export const IcEngrenagem = (p: P) => (<svg {...base} {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>);
export const IcOlho = (p: P) => (<svg {...base} {...p}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>);
export const IcOlhoFechado = (p: P) => (<svg {...base} {...p}><path d="M9.9 4.2A9.6 9.6 0 0 1 12 4c6.4 0 10 8 10 8a17 17 0 0 1-2.2 3.2M6.6 6.6A17.4 17.4 0 0 0 2 12s3.6 8 10 8a9.4 9.4 0 0 0 5.4-1.6M14.1 14.1a3 3 0 1 1-4.2-4.2M2 2l20 20" /></svg>);
export const IcExcel = (p: P) => (<svg {...base} {...p}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6M9 13l4 5M13 13l-4 5" /></svg>);

export function CosturaTitulo() {
  return (
    <svg className="costura-titulo" viewBox="0 0 180 10" aria-hidden>
      <path d="M2 5 C 30 1, 60 9, 90 5 S 150 1, 178 5" />
    </svg>
  );
}
