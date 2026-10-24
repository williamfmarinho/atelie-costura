import { fimDoMes, inicioDoMes, lerMes, maiuscula, MESES, mesParam } from './format';
import { db, type Movimentacao } from './supabase';

export const PERIODOS = { mes: { n: 1, rotulo: 'Mês' }, tri: { n: 3, rotulo: 'Trimestre' }, sem: { n: 6, rotulo: 'Semestre' } } as const;
export type Periodo = keyof typeof PERIODOS;

/** Dados do relatório financeiro de um mês, trimestre ou semestre civil. Usado pela página e pelo Excel. */
export async function montarRelatorio(pParam?: string, refParam?: string) {
  const p: Periodo = pParam === 'tri' || pParam === 'sem' ? pParam : 'mes';
  const n = PERIODOS[p].n;
  const ref = lerMes(refParam);
  // alinha ao início do trimestre/semestre civil
  const mesIni = Math.floor((ref.mes - 1) / n) * n + 1;
  const ano = ref.ano;
  const ini = inicioDoMes(ano, mesIni);
  const fim = fimDoMes(ano, mesIni + n - 1);

  const { data } = await db().from('movimentacoes').select('*, categorias(*)').gte('data', ini).lte('data', fim).order('data');
  const movs = (data ?? []) as Movimentacao[];
  const soma = (xs: Movimentacao[]) => xs.reduce((s, m) => s + Number(m.valor), 0);
  const saidas = movs.filter((m) => m.tipo === 'saida');
  const entradas = movs.filter((m) => m.tipo === 'entrada');
  const totS = soma(saidas);
  const totE = soma(entradas);
  const totFixas = soma(saidas.filter((m) => m.categorias?.fixa));

  const porCategoria = Object.values(
    saidas.reduce<Record<string, { nome: string; fixa: boolean; total: number; qtd: number }>>((acc, m) => {
      const k = m.categorias?.id ?? '—';
      acc[k] ??= { nome: m.categorias?.nome ?? 'Sem categoria', fixa: !!m.categorias?.fixa, total: 0, qtd: 0 };
      acc[k].total += Number(m.valor);
      acc[k].qtd++;
      return acc;
    }, {})
  ).sort((a, b) => Number(b.fixa) - Number(a.fixa) || b.total - a.total);

  const meses = Array.from({ length: n }, (_, i) => {
    const m = mesIni + i;
    const pref = `${ano}-${String(m).padStart(2, '0')}`;
    const doMes = movs.filter((x) => x.data.startsWith(pref));
    return { rotulo: MESES[m - 1].slice(0, 3), nome: maiuscula(MESES[m - 1]), e: soma(doMes.filter((x) => x.tipo === 'entrada')), s: soma(doMes.filter((x) => x.tipo === 'saida')) };
  });

  const titulo = maiuscula(
    p === 'mes' ? `${MESES[mesIni - 1]} de ${ano}` : p === 'tri' ? `${(mesIni - 1) / 3 + 1}º trimestre de ${ano}` : `${mesIni === 1 ? '1º' : '2º'} semestre de ${ano}`
  );

  return { p, n, ano, mesIni, ini, fim, refQs: mesParam(ano, mesIni), movs, saidas, entradas, totS, totE, totFixas, porCategoria, meses, titulo };
}
