import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from 'docx';
import * as XLSX from '@e965/xlsx';
import pptxgen from 'pptxgenjs';

// ── Markdown block parser ──────────────────────────────────────────────────

interface Block {
  type: 'heading' | 'paragraph' | 'bullet' | 'code' | 'table' | 'hr';
  level?: number;
  text?: string;
  headers?: string[];
  rows?: string[][];
}

export function parseMarkdownBlocks(md: string): Block[] {
  const lines = md.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // heading
    const hm = line.match(/^(#{1,6})\s+(.+)/);
    if (hm) { blocks.push({ type: 'heading', level: hm[1].length, text: hm[2].replace(/\*\*/g, '') }); i++; continue; }

    // table
    if (line.includes('|') && i + 1 < lines.length && lines[i + 1].replace(/[\s|:-]/g, '').length === 0) {
      const headers = line.split('|').map(h => h.trim()).filter(Boolean);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|')) {
        rows.push(lines[i].split('|').map(c => c.trim()).filter(Boolean));
        i++;
      }
      blocks.push({ type: 'table', headers, rows });
      continue;
    }

    // code block
    if (line.startsWith('```')) {
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++; }
      i++;
      blocks.push({ type: 'code', text: codeLines.join('\n') });
      continue;
    }

    // hr
    if (/^---+$/.test(line.trim())) { blocks.push({ type: 'hr' }); i++; continue; }

    // bullet
    const bm = line.match(/^[-*›]\s+(.*)/);
    if (bm) { blocks.push({ type: 'bullet', text: bm[1] }); i++; continue; }

    // numbered list
    const nm = line.match(/^\d+\.\s+(.*)/);
    if (nm) { blocks.push({ type: 'bullet', text: nm[1] }); i++; continue; }

    // paragraph (skip blanks)
    if (line.trim()) blocks.push({ type: 'paragraph', text: line.trim() });
    i++;
  }
  return blocks;
}

function cleanInline(s: string) {
  return s
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

function stripMarkdown(md: string) {
  return parseMarkdownBlocks(md)
    .map(b => {
      if (b.type === 'heading') return cleanInline(b.text || '');
      if (b.type === 'paragraph') return cleanInline(b.text || '');
      if (b.type === 'bullet') return `• ${cleanInline(b.text || '')}`;
      if (b.type === 'code') return b.text || '';
      if (b.type === 'table') return [(b.headers || []).join(' | '), ...(b.rows || []).map(r => r.join(' | '))].join('\n');
      return '';
    })
    .filter(Boolean)
    .join('\n\n');
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Markdown ──────────────────────────────────────────────────────────────

export function downloadMarkdown(content: string, filename = 'export') {
  triggerDownload(new Blob([content], { type: 'text/markdown;charset=utf-8' }), `${filename}.md`);
}

// ── Plain Text ─────────────────────────────────────────────────────────────

export function downloadText(content: string, filename = 'export') {
  triggerDownload(new Blob([stripMarkdown(content)], { type: 'text/plain;charset=utf-8' }), `${filename}.txt`);
}

// ── PDF ───────────────────────────────────────────────────────────────────

export function downloadPDF(content: string, filename = 'export') {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const M = 18;
  const PW = doc.internal.pageSize.getWidth() - M * 2;
  let y = M;

  const newPageIfNeeded = (h: number) => {
    if (y + h > doc.internal.pageSize.getHeight() - M) { doc.addPage(); y = M; }
  };

  for (const block of parseMarkdownBlocks(content)) {
    if (block.type === 'heading') {
      const sizes = [22, 17, 14, 12, 11, 10];
      const sz = sizes[Math.min((block.level ?? 1) - 1, 5)];
      newPageIfNeeded(sz * 0.5 + 6);
      doc.setFontSize(sz); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
      const ls = doc.splitTextToSize(block.text || '', PW);
      doc.text(ls, M, y);
      y += ls.length * sz * 0.38 + 4;
      if (block.level === 1 || block.level === 2) {
        doc.setDrawColor(92, 5, 5); doc.setLineWidth(0.4);
        doc.line(M, y - 1, M + PW, y - 1);
        y += 2;
      }
    } else if (block.type === 'paragraph') {
      newPageIfNeeded(8);
      doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(55, 55, 55);
      const ls = doc.splitTextToSize(cleanInline(block.text || ''), PW);
      doc.text(ls, M, y);
      y += ls.length * 5 + 2;
    } else if (block.type === 'bullet') {
      newPageIfNeeded(7);
      doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(55, 55, 55);
      const ls = doc.splitTextToSize(`• ${cleanInline(block.text || '')}`, PW - 6);
      doc.text(ls, M + 4, y);
      y += ls.length * 5 + 1;
    } else if (block.type === 'table' && block.headers && block.rows) {
      newPageIfNeeded(30);
      autoTable(doc, {
        startY: y, head: [block.headers], body: block.rows,
        margin: { left: M, right: M },
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [92, 5, 5], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 248, 248] },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    } else if (block.type === 'code') {
      newPageIfNeeded(20);
      doc.setFontSize(8); doc.setFont('courier', 'normal'); doc.setTextColor(30, 30, 30);
      const ls = doc.splitTextToSize(block.text || '', PW - 8);
      const boxH = ls.length * 4 + 6;
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(M, y - 3, PW, boxH, 2, 2, 'F');
      doc.text(ls, M + 4, y + 1);
      y += boxH + 4;
    } else if (block.type === 'hr') {
      doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.2);
      doc.line(M, y, M + PW, y);
      y += 4;
    }
  }

  doc.save(`${filename}.pdf`);
}

// ── DOCX ──────────────────────────────────────────────────────────────────

function parseInlineRuns(text: string): TextRun[] {
  const runs: TextRun[] = [];
  const parts = text.split(/(\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+`)/);
  for (const p of parts) {
    if (!p) continue;
    if (p.startsWith('**') && p.endsWith('**')) runs.push(new TextRun({ text: p.slice(2, -2), bold: true }));
    else if (p.startsWith('*') && p.endsWith('*')) runs.push(new TextRun({ text: p.slice(1, -1), italics: true }));
    else if (p.startsWith('`') && p.endsWith('`')) runs.push(new TextRun({ text: p.slice(1, -1), font: 'Courier New', size: 18 }));
    else runs.push(new TextRun({ text: p }));
  }
  return runs;
}

export async function downloadDOCX(content: string, filename = 'export') {
  const headingLevels = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4, HeadingLevel.HEADING_5, HeadingLevel.HEADING_6];
  const children: any[] = [];

  for (const block of parseMarkdownBlocks(content)) {
    if (block.type === 'heading') {
      children.push(new Paragraph({ text: block.text, heading: headingLevels[Math.min((block.level ?? 1) - 1, 5)] }));
    } else if (block.type === 'paragraph') {
      children.push(new Paragraph({ children: parseInlineRuns(block.text || '') }));
    } else if (block.type === 'bullet') {
      children.push(new Paragraph({ children: parseInlineRuns(block.text || ''), bullet: { level: 0 } }));
    } else if (block.type === 'code') {
      children.push(new Paragraph({ children: [new TextRun({ text: block.text, font: 'Courier New', size: 18 })] }));
    } else if (block.type === 'table' && block.headers && block.rows) {
      const tableRows = [
        new TableRow({ children: block.headers.map(h => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })] })) }),
        ...block.rows.map(row => new TableRow({ children: row.map(cell => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: cell })] })] })) })),
      ];
      children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows }));
      children.push(new Paragraph({}));
    } else if (block.type === 'hr') {
      children.push(new Paragraph({ children: [new TextRun({ text: '' })], border: { bottom: { color: 'CCCCCC', space: 1, style: 'single', size: 6 } } }));
    }
  }

  const docx = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(docx);
  triggerDownload(blob, `${filename}.docx`);
}

// ── XLSX ──────────────────────────────────────────────────────────────────

export function downloadXLSX(content: string, filename = 'export') {
  const blocks = parseMarkdownBlocks(content);
  const wb = XLSX.utils.book_new();
  const tables = blocks.filter(b => b.type === 'table');

  // Text sheet
  const textLines = stripMarkdown(content).split('\n').filter(Boolean);
  const wsText = XLSX.utils.aoa_to_sheet(textLines.map(l => [l]));
  XLSX.utils.book_append_sheet(wb, wsText, 'Content');

  // Table sheets
  tables.forEach((t, idx) => {
    const data = [t.headers || [], ...(t.rows || [])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), `Table ${idx + 1}`);
  });

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ── CSV ───────────────────────────────────────────────────────────────────

export function downloadCSV(content: string, filename = 'export') {
  const blocks = parseMarkdownBlocks(content);
  const tables = blocks.filter(b => b.type === 'table');
  let csv = '';

  if (tables.length > 0) {
    const t = tables[0];
    const rows = [t.headers || [], ...(t.rows || [])];
    csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
  } else {
    csv = stripMarkdown(content).split('\n').map(l => `"${l.replace(/"/g, '""')}"`).join('\n');
  }

  triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${filename}.csv`);
}

// ── PPTX ──────────────────────────────────────────────────────────────────

function isNumericValue(s: string): boolean {
  return !isNaN(parseFloat(s.replace(/[$,%\s]/g, '')));
}

function tableToChartData(headers: string[], rows: string[][]) {
  // Find label column (first non-numeric) and numeric columns
  const labelCol = headers.findIndex((_, ci) => rows.some(r => !isNumericValue(r[ci] ?? '')));
  const numericCols = headers.map((_, ci) => ci).filter(ci =>
    ci !== labelCol && rows.filter(r => isNumericValue(r[ci] ?? '')).length > rows.length * 0.5
  );
  if (numericCols.length === 0 || rows.length < 2) return null;
  const labels = rows.map(r => r[labelCol >= 0 ? labelCol : 0] ?? '');
  return numericCols.map(ci => ({
    name: headers[ci],
    labels,
    values: rows.map(r => parseFloat((r[ci] ?? '0').replace(/[$,%\s]/g, '')) || 0),
  }));
}

export function downloadPPTX(content: string, filename = 'export') {
  const prs = new pptxgen();
  prs.layout = 'LAYOUT_16x9';
  const BG = '0C0C0C';
  const ACCENT = '8B1414';
  const ACCENT2 = 'CC2222';
  const MUTED = '444444';
  const FOOTER_Y = 7.05;
  const dateStr = new Date().toLocaleDateString('en-US', { dateStyle: 'medium' });

  const addFooter = (slide: any) => {
    slide.addText(`Generated by CockRoach Intelligence  ·  ${dateStr}`, {
      x: 0.5, y: FOOTER_Y, w: 9, h: 0.25,
      fontSize: 7, color: MUTED, fontFace: 'Calibri', align: 'right', italic: true,
    });
    slide.addShape(prs.ShapeType.rect, { x: 0.5, y: FOOTER_Y - 0.05, w: 9, h: 0.01, fill: { color: '222222' } } as any);
  };

  const addSlide = (title: string, titleSize: number) => {
    const slide = prs.addSlide();
    slide.background = { color: BG };
    if (title) {
      slide.addText(title, {
        x: 0.5, y: 0.28, w: 9, h: titleSize === 32 ? 1.0 : 0.65,
        fontSize: titleSize, bold: true, color: 'FFFFFF', fontFace: 'Calibri',
      });
    }
    slide.addShape(prs.ShapeType.rect, {
      x: 0.5, y: title ? (titleSize === 32 ? 1.35 : 1.02) : 0.28,
      w: 9, h: 0.03, fill: { color: ACCENT },
    } as any);
    addFooter(slide);
    return { slide, bodyY: title ? (titleSize === 32 ? 1.55 : 1.2) : 0.45 };
  };

  const blocks = parseMarkdownBlocks(content);

  // Cover slide — extract first H1 as presentation title
  const firstH1 = blocks.find(b => b.type === 'heading' && b.level === 1);
  const coverSlide = prs.addSlide();
  coverSlide.background = { color: BG };
  // Decorative bar
  coverSlide.addShape(prs.ShapeType.rect, { x: 0, y: 3.5, w: 10, h: 0.06, fill: { color: ACCENT } } as any);
  coverSlide.addShape(prs.ShapeType.rect, { x: 0, y: 3.56, w: 10, h: 0.03, fill: { color: ACCENT2 } } as any);
  coverSlide.addText(firstH1?.text ?? filename, {
    x: 0.6, y: 1.6, w: 8.8, h: 1.5,
    fontSize: 36, bold: true, color: 'FFFFFF', fontFace: 'Calibri', valign: 'bottom',
  });
  coverSlide.addText(`CockRoach Intelligence Report  ·  ${dateStr}`, {
    x: 0.6, y: 4.0, w: 8.8, h: 0.4,
    fontSize: 13, color: '888888', fontFace: 'Calibri', italic: true,
  });

  let current: { slide: any; bodyY: number } | null = null;

  for (const block of blocks) {
    if (block.type === 'heading' && (block.level === 1 || block.level === 2)) {
      current = addSlide(block.text || '', block.level === 1 ? 28 : 22);

    } else if (block.type === 'heading' && (block.level ?? 0) >= 3) {
      if (!current) current = addSlide('', 0);
      if (current.bodyY > 6.6) current = addSlide('(continued)', 14);
      current.slide.addText(block.text || '', {
        x: 0.5, y: current.bodyY, w: 9, h: 0.38, fontSize: 15, bold: true, color: ACCENT2, fontFace: 'Calibri',
      });
      current.bodyY += 0.44;

    } else if (block.type === 'paragraph' || block.type === 'bullet') {
      if (!current) current = addSlide('', 0);
      if (current.bodyY > 6.5) current = addSlide('(continued)', 14);
      const isBullet = block.type === 'bullet';
      current.slide.addText(`${isBullet ? '• ' : ''}${cleanInline(block.text || '')}`, {
        x: isBullet ? 0.8 : 0.5, y: current.bodyY, w: 8.7, h: 0.38,
        fontSize: 12.5, color: 'CCCCCC', fontFace: 'Calibri', valign: 'top',
      });
      current.bodyY += 0.42;

    } else if (block.type === 'table' && block.headers && block.rows) {
      // Attempt chart rendering for numeric tables
      const chartData = tableToChartData(block.headers, block.rows);

      if (chartData && block.rows.length >= 2) {
        // Chart slide
        if (!current) current = addSlide('', 0);
        if (current.bodyY > 5) current = addSlide('Chart', 20);
        const chartH = Math.min(3.8, 6.8 - current.bodyY);
        (current.slide as any).addChart(
          (prs as any).ChartType?.bar ?? 'bar',
          chartData,
          {
            x: 0.5, y: current.bodyY, w: 9, h: chartH,
            chartColors: [ACCENT, ACCENT2, '661111', 'FF4444', 'AA2222'],
            showLegend: chartData.length > 1,
            legendPos: 'b',
            legendFontSize: 9,
            catAxisLabelColor: '888888',
            valAxisLabelColor: '888888',
            catAxisLabelFontSize: 9,
            valAxisLabelFontSize: 9,
            dataLabelFontSize: 8,
            dataLabelColor: 'CCCCCC',
            plotAreaBkgColor: '111111',
          }
        );
        current.bodyY += chartH + 0.2;
      } else {
        // Fallback: table
        if (!current) current = addSlide('', 0);
        if (current.bodyY > 5) current = addSlide('Table (continued)', 20);
        const rows = [[...(block.headers)], ...(block.rows)];
        current.slide.addTable(
          rows.map((r, ri) => r.map(cell => ({
            text: cell,
            options: {
              bold: ri === 0,
              color: ri === 0 ? 'FFFFFF' : 'DDDDDD',
              fill: ri === 0 ? ACCENT : (ri % 2 === 0 ? '1A1A1A' : '141414'),
              fontSize: 10, fontFace: 'Calibri',
            },
          }))),
          { x: 0.5, y: current.bodyY, w: 9, colW: Array(block.headers.length).fill(9 / block.headers.length) }
        );
        current.bodyY += rows.length * 0.34 + 0.3;
      }
    } else if (block.type === 'hr') {
      if (current) {
        current.slide.addShape(prs.ShapeType.rect, {
          x: 0.5, y: current.bodyY, w: 9, h: 0.015, fill: { color: '2a2a2a' },
        } as any);
        current.bodyY += 0.25;
      }
    }
  }

  if (!current) {
    const s = prs.addSlide();
    s.background = { color: BG };
    s.addText('Export', { x: 0.5, y: 2.5, w: 9, fontSize: 28, bold: true, color: 'FFFFFF', align: 'center' });
    addFooter(s);
  }

  prs.writeFile({ fileName: `${filename}.pptx` });
}

export const EXPORT_FORMATS = [
  { label: 'Markdown', ext: 'md', fn: downloadMarkdown },
  { label: 'Text', ext: 'txt', fn: downloadText },
  { label: 'PDF', ext: 'pdf', fn: downloadPDF },
  { label: 'Word', ext: 'docx', fn: downloadDOCX },
  { label: 'Excel', ext: 'xlsx', fn: downloadXLSX },
  { label: 'CSV', ext: 'csv', fn: downloadCSV },
  { label: 'PowerPoint', ext: 'pptx', fn: downloadPPTX },
] as const;
