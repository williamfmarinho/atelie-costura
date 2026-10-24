import ExcelJS from 'exceljs';
import { parseISO } from '@/lib/format';
import { montarRelatorio } from '@/lib/relatorio';

export const dynamic = 'force-dynamic';

const MOEDA = '"R$" #,##0.00;[Red]-"R$" #,##0.00';
const AMEIXA = 'FF4F2F7A';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const r = await montarRelatorio(url.searchParams.get('p') ?? undefined, url.searchParams.get('ref') ?? undefined);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Ateliê de Costura';
  wb.created = new Date();

  const cabecalho = (ws: ExcelJS.Worksheet) => {
    const linha = ws.getRow(1);
    linha.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    linha.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AMEIXA } };
    linha.alignment = { vertical: 'middle' };
    linha.height = 22;
    ws.views = [{ state: 'frozen', ySplit: 1 }];
  };
  const data = (iso: string) => parseISO(iso);
  const c2 = (v: number) => Math.round(v * 100) / 100;

  // Resumo
  const resumo = wb.addWorksheet('Resumo');
  resumo.columns = [{ header: r.titulo, key: 'k', width: 30 }, { header: '', key: 'v', width: 18 }];
  cabecalho(resumo);
  resumo.addRows([
    { k: 'Período', v: `${r.ini.split('-').reverse().join('/')} a ${r.fim.split('-').reverse().join('/')}` },
    { k: 'Entradas', v: r.totE },
    { k: 'Despesas (total)', v: r.totS },
    { k: '   Despesas fixas', v: r.totFixas },
    { k: '   Despesas variáveis', v: c2(r.totS - r.totFixas) },
    { k: 'Resultado', v: c2(r.totE - r.totS) },
  ]);
  resumo.getColumn('v').numFmt = MOEDA;
  resumo.getRow(7).font = { bold: true };

  // Por categoria
  const cat = resumo.workbook.addWorksheet('Despesas por categoria');
  cat.columns = [
    { header: 'Categoria', key: 'nome', width: 30 },
    { header: 'Tipo', key: 'tipo', width: 12 },
    { header: 'Lançamentos', key: 'qtd', width: 14 },
    { header: 'Total', key: 'total', width: 16, style: { numFmt: MOEDA } },
    { header: '% das despesas', key: 'pct', width: 16, style: { numFmt: '0.0%' } },
  ];
  cabecalho(cat);
  for (const c of r.porCategoria) cat.addRow({ nome: c.nome, tipo: c.fixa ? 'Fixa' : 'Variável', qtd: c.qtd, total: c.total, pct: r.totS ? c.total / r.totS : 0 });
  const totCat = cat.addRow({ nome: 'Total', qtd: r.saidas.length, total: r.totS, pct: r.totS ? 1 : 0 });
  totCat.font = { bold: true };

  // Mês a mês
  const meses = wb.addWorksheet('Mês a mês');
  meses.columns = [
    { header: 'Mês', key: 'nome', width: 16 },
    { header: 'Entradas', key: 'e', width: 16, style: { numFmt: MOEDA } },
    { header: 'Saídas', key: 's', width: 16, style: { numFmt: MOEDA } },
    { header: 'Saldo', key: 'saldo', width: 16, style: { numFmt: MOEDA } },
  ];
  cabecalho(meses);
  for (const m of r.meses) meses.addRow({ nome: m.nome, e: c2(m.e), s: c2(m.s), saldo: c2(m.e - m.s) });

  // Lançamentos
  const lanc = wb.addWorksheet('Lançamentos');
  lanc.columns = [
    { header: 'Data', key: 'data', width: 12, style: { numFmt: 'dd/mm/yyyy' } },
    { header: 'Tipo', key: 'tipo', width: 10 },
    { header: 'Descrição', key: 'descricao', width: 40 },
    { header: 'Categoria', key: 'categoria', width: 26 },
    { header: 'Fixa', key: 'fixa', width: 8 },
    { header: 'Pagamento', key: 'pagamento', width: 18 },
    { header: 'Valor', key: 'valor', width: 16, style: { numFmt: MOEDA } },
  ];
  cabecalho(lanc);
  for (const m of r.movs) {
    lanc.addRow({
      data: data(m.data),
      tipo: m.tipo === 'entrada' ? 'Entrada' : 'Saída',
      descricao: m.descricao,
      categoria: m.categorias?.nome ?? '',
      fixa: m.categorias?.fixa ? 'Sim' : '',
      pagamento: m.forma_pagamento ?? '',
      valor: m.tipo === 'entrada' ? Number(m.valor) : -Number(m.valor),
    });
  }
  lanc.autoFilter = { from: 'A1', to: 'G1' };

  const buffer = await wb.xlsx.writeBuffer();
  const nome = `relatorio-${r.titulo.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-')}.xlsx`;
  return new Response(buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${nome}"`,
    },
  });
}
