// src/routes/subjects.ts
import { Router } from 'express';
import { AppDataSource } from '../db/data-source';
import { Subject } from '../models/Subject';

export const subjectsRouter = Router();
const repo = () => AppDataSource.getRepository(Subject);

const DEFAULTS: Array<[string, string]> = [
  ['PORT','Língua Portuguesa'], ['MAT','Matemática'], ['CIE','Ciências'],
  ['HIST','História'], ['GEO','Geografia'], ['EF','Educação Física'],
  ['ART','Arte'], ['ING','Inglês'], ['ESP','Espanhol'],
  ['ER','Ensino Religioso'], ['INF','Informática']
];

// Seed idempotente
subjectsRouter.post('/subjects/seed-defaults', async (_req, res) => {
  const r = repo();
  for (const [code, name] of DEFAULTS) {
    const existing = await r.findOne({ where: { code } });
    if (!existing) {
      await r.save(r.create({ code, name, active: true }));
    }
  }
  res.json({ ok: true, count: DEFAULTS.length });
});

// Listar
subjectsRouter.get('/subjects', async (_req, res) => {
  res.json(await repo().find({ order: { code: 'ASC' } }));
});

// Criar
subjectsRouter.post('/subjects', async (req, res) => {
  const code = String(req.body.code || '').trim().toUpperCase();
  const name = String(req.body.name || '').trim();
  const active = req.body.active === undefined ? true : !!req.body.active;

  if (!code || !name) return res.status(400).send('code e name são obrigatórios');

  const r = repo();
  const exists = await r.findOne({ where: { code } });
  if (exists) return res.status(409).send('Já existe disciplina com esse code');

  const saved = await r.save(r.create({ code, name, active }));
  res.status(201).json(saved);
});

// Atualizar
subjectsRouter.put('/subjects/:id', async (req, res) => {
  const id = Number(req.params.id);
  const r = repo();
  const subj = await r.findOne({ where: { id } });
  if (!subj) return res.status(404).send('Subject não encontrado');

  if (req.body.code !== undefined) {
    const newCode = String(req.body.code || '').trim().toUpperCase();
    if (!newCode) return res.status(400).send('code inválido');
    if (newCode !== subj.code) {
      const clash = await r.findOne({ where: { code: newCode } });
      if (clash) return res.status(409).send('Já existe disciplina com esse code');
      subj.code = newCode;
    }
  }
  if (req.body.name !== undefined) {
    const nm = String(req.body.name || '').trim();
    if (!nm) return res.status(400).send('name inválido');
    subj.name = nm;
  }
  if (req.body.active !== undefined) subj.active = !!req.body.active;

  const saved = await r.save(subj);
  res.json(saved);
});

// Remover
subjectsRouter.delete('/subjects/:id', async (req, res) => {
  const id = Number(req.params.id);
  await repo().delete(id);
  res.json({ ok: true });
});
