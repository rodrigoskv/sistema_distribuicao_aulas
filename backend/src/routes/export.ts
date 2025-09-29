import { Router } from 'express';
import { buildExcel, buildPDF } from '../services/ExportService';

export const exportRouter = Router();

exportRouter.get('/excel', async (_req, res) => {
  const buf = await buildExcel();
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition','attachment; filename="horario.xlsx"');
  res.send(Buffer.from(buf));
});

exportRouter.get('/pdf', async (_req, res) => {
  const buf = await buildPDF();
  res.setHeader('Content-Type','application/pdf');
  res.setHeader('Content-Disposition','attachment; filename="horario.pdf"');
  res.send(Buffer.from(buf));
});
