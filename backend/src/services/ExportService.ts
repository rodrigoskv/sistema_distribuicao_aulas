import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { AppDataSource } from '../db/data-source';
import { Lesson } from '../models/Lesson';

export async function buildExcel(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Horário');
  ws.addRow(['Turma','Disciplina','Professor','Dia','Turno','Slot','Recurso','Etiqueta']);

  const repo = AppDataSource.getRepository(Lesson);
  const lessons = await repo.find();
  for (const l of lessons) {
    ws.addRow([l.schoolClass, l.subject, l.teacher, l.day, l.shift, l.slot, l.resource||'', l.timeslotLabel]);
  }

  // ExcelJS retorna ArrayBuffer → converte para Buffer (Node)
  const ab = await wb.xlsx.writeBuffer();            // ArrayBuffer
  return Buffer.from(new Uint8Array(ab as ArrayBuffer));
}

export async function buildPDF(): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 36 });
  const chunks: Buffer[] = [];

  doc.fontSize(16).text('Horário Escolar', { align: 'center' }).moveDown();

  const repo = AppDataSource.getRepository(Lesson);
  const lessons = await repo.find();

  doc.fontSize(10);
  for (const l of lessons) {
    doc.text(`${l.schoolClass} - ${l.subject} - ${l.teacher} | ${l.shift} D${l.day} S${l.slot}${l.resource? ' ('+l.resource+')':''}`);
  }
  doc.end();

  return await new Promise<Buffer>((resolve) => {
    doc.on('data', (b: Buffer)=>chunks.push(b));
    doc.on('end', ()=>resolve(Buffer.concat(chunks)));
  });
}
