import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from 'docx';
import * as XLSX from 'xlsx';
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

export function downloadPPTX(content: string, filename = 'export') {
  const prs = new pptxgen();
  prs.layout = 'LAYOUT_16x9';
  const BG = '0C0C0C';
  const ACCENT = '8B1414';

  const addSlide = (title: string, titleSize: number) => {
    const slide = prs.addSlide();
    slide.background = { color: BG };
    slide.addText(title, { x: 0.5, y: 0.25, w: 9, h: titleSize === 32 ? 1.1 : 0.7, fontSize: titleSize, bold: true, color: 'FFFFFF', fontFace: 'Calibri' });
    slide.addShape(prs.ShapeType.rect, { x: 0.5, y: titleSize === 32 ? 1.4 : 1.0, w: 9, h: 0.035, fill: { color: ACCENT } } as any);
    return { slide, bodyY: titleSize === 32 ? 1.6 : 1.2 };
  };

  let current: { slide: any; bodyY: number } | null = null;

  for (const block of parseMarkdownBlocks(content)) {
    if (block.type === 'heading' && (block.level === 1 || block.level === 2)) {
      current = addSlide(block.text || '', block.level === 1 ? 32 : 24);
    } else if (block.type === 'heading' && (block.level ?? 0) >= 3) {
      if (!current) current = addSlide('', 0);
      current.slide.addText(block.text || '', { x: 0.5, y: current.bodyY, w: 9, h: 0.4, fontSize: 16, bold: true, color: ACCENT, fontFace: 'Calibri' });
      current.bodyY += 0.45;
    } else if (block.type === 'paragraph' || block.type === 'bullet') {
      if (!current) current = addSlide('', 0);
      if (current.bodyY > 6.4) current = addSlide('(continued)', 14);
      const prefix = block.type === 'bullet' ? '• ' : '';
      current.slide.addText(`${prefix}${cleanInline(block.text || '')}`, {
        x: block.type === 'bullet' ? 0.8 : 0.5, y: current.bodyY, w: 8.5, h: 0.4,
        fontSize: 13, color: 'CCCCCC', fontFace: 'Calibri', valign: 'top',
      });
      current.bodyY += 0.42;
    } else if (block.type === 'table' && block.headers && block.rows) {
      if (!current) current = addSlide('', 0);
      if (current.bodyY > 5) current = addSlide('Table (continued)', 20);
      const rows = [[...(block.headers || [])], ...(block.rows || [])];
      current.slide.addTable(
        rows.map((r, ri) => r.map(cell => ({
          text: cell,
          options: { bold: ri === 0, color: ri === 0 ? 'FFFFFF' : 'DDDDDD', fill: ri === 0 ? ACCENT : (ri % 2 === 0 ? '1A1A1A' : '141414'), fontSize: 10, fontFace: 'Calibri' },
        }))),
        { x: 0.5, y: current.bodyY, w: 9, colW: Array(block.headers.length).fill(9 / block.headers.length) }
      );
      current.bodyY += rows.length * 0.35 + 0.3;
    }
  }

  if (!current) {
    const s = prs.addSlide(); s.background = { color: BG };
    s.addText('Export', { x: 0.5, y: 2.5, w: 9, fontSize: 28, bold: true, color: 'FFFFFF', align: 'center' });
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
