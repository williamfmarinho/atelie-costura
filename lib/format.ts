const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const dinheiro = (v: number | string | null | undefined) => brl.format(Number(v ?? 0));

// Fuso do ateliê (Fortaleza = horário de Brasília, sem horário de verão).
// Nunca dependemos do relógio/fuso do servidor (a Vercel roda em UTC).
export const TZ = 'America/Fortaleza';

/** Data de hoje (YYYY-MM-DD) no fuso de São Paulo. */
export function hoje() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}

/** Converte YYYY-MM-DD para Date ao meio-dia UTC (evita pular de dia com fuso). */
export const parseISO = (iso: string) => new Date(iso + 'T12:00:00Z');

export const toISO = (d: Date) => d.toISOString().slice(0, 10);

export function addDias(iso: string, n: number) {
  const d = parseISO(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toISO(d);
}

export function dataCurta(iso: string | null | undefined) {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export function dataLonga(iso: string) {
  return maiuscula(new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }).format(parseISO(iso)));
}

export const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export function nomeMes(ano: number, mes: number) {
  return `${MESES[mes - 1]} de ${ano}`;
}

export function fimDoMes(ano: number, mes: number) {
  return toISO(new Date(Date.UTC(ano, mes, 0, 12)));
}

export function inicioDoMes(ano: number, mes: number) {
  return `${ano}-${String(mes).padStart(2, '0')}-01`;
}

/** "2026-10" -> {ano, mes}; inválido -> mês atual. */
export function lerMes(v: string | undefined) {
  const m = /^(\d{4})-(\d{2})$/.exec(v ?? '');
  if (m) return { ano: +m[1], mes: +m[2] };
  const [ano, mes] = hoje().split('-').map(Number);
  return { ano, mes };
}

export function mesParam(ano: number, mes: number, delta = 0) {
  const d = new Date(Date.UTC(ano, mes - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function formataCPF(v: string | null | undefined) {
  const d = (v ?? '').replace(/\D/g, '');
  if (d.length !== 11) return v ?? '';
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function diasAte(iso: string) {
  return Math.round((parseISO(iso).getTime() - parseISO(hoje()).getTime()) / 86400000);
}

export const maiuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** 12345678901 -> 123.456.789-01 (parcial enquanto digita). */
export function mascaraCPF(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
}

/** 85997667877 -> (85) 99766-7877; 8532667877 -> (85) 3266-7877. */
export function mascaraTelefone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export const formataTelefone = (v: string | null | undefined) => (v ? mascaraTelefone(v) : '');

/** Dígitos digitados viram centavos: "5500" -> "55,00". */
export function mascaraDinheiro(v: string) {
  const d = v.replace(/\D/g, '').replace(/^0+/, '').slice(0, 11);
  if (!d) return '';
  return (Number(d) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const dinheiroParaTexto = (n: number | string | null | undefined) =>
  n == null || n === '' ? '' : mascaraDinheiro(Number(n).toFixed(2));

/** "1.234,56" -> 1234.56 */
export function textoParaNumero(s: string) {
  const t = s.trim();
  if (!t) return 0;
  const n = t.includes(',') ? Number(t.replace(/\./g, '').replace(',', '.')) : Number(t);
  return Number.isFinite(n) ? n : 0;
}

/** "24/10/2026" -> "2026-10-24" (ou null se inválida). */
export function brParaISO(s: string) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (!m) return null;
  const iso = `${m[3]}-${m[2]}-${m[1]}`;
  const d = parseISO(iso);
  return Number.isNaN(d.getTime()) || toISO(d) !== iso ? null : iso;
}

export const isoParaBR = (iso: string | null | undefined) => (iso ? dataCurta(iso) : '');

/** Data (dd/mm/aaaa) de um instante (timestamptz) no fuso do ateliê. */
export function dataDeInstante(ts: string | null | undefined) {
  if (!ts) return '—';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(ts));
}

/** Hora atual (0–23) no fuso do ateliê. */
export const horaAgora = () => Number(new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', hourCycle: 'h23' }).format(new Date()));
