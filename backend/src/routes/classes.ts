// src/routes/classes.ts
import { Router } from 'express';
import { AppDataSource } from '../db/data-source';
import { SchoolClass } from '../models/SchoolClass';
import { WeeklyLoad } from '../models/WeeklyLoad';
import { Lesson } from '../models/Lesson';
import { Teacher } from '../models/Teacher';

export const classesRouter = Router();
const classRepo = () => AppDataSource.getRepository(SchoolClass);
const loadRepo  = () => AppDataSource.getRepository(WeeklyLoad);

// O model aceita apenas estes turnos:
type Shift = 'MATUTINO' | 'VESPERTINO';

const computeCT = (gradeYear: number) => [6, 7, 8, 9].includes(Number(gradeYear));

// 🔹 Templates EMBUTIDOS (sem ../config/DefaultLoads)
const DEFAULT_LOADS_1_5: Record<string, number> = {
  PORT: 5, MAT: 5, CIE: 2, HIST: 2, GEO: 2, EF: 2, ART: 2, ING: 2, ER: 1, INF: 1,
};

const DEFAULT_LOADS_6_9: Record<string, number> = {
  PORT: 5, MAT: 5, CIE: 3, HIST: 2, GEO: 2, EF: 2, ART: 2, ING: 2, ESP: 2, ER: 1, INF: 1,
};

// Listar
classesRouter.get('/classes', async (_req, res) => {
  res.json(await classRepo().find({ order: { name: 'ASC' } }));
});

// Criar
classesRouter.post('/classes', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const gradeYear = Number(req.body.gradeYear);
  const shift = String(req.body.shift || '').toUpperCase() as Shift;

  if (!name || Number.isNaN(gradeYear) || !shift) {
    return res.status(400).send('name, gradeYear e shift são obrigatórios');
  }

  const entity: Partial<SchoolClass> = {
    name,
    gradeYear,
    shift,
    hasContraturno: computeCT(gradeYear),
  };

  const saved = await classRepo().save(classRepo().create(entity));
  res.status(201).json(saved);
});

// Atualizar
classesRouter.put('/classes/:id', async (req, res) => {
  const id = Number(req.params.id);
  const cls = await classRepo().findOne({ where: { id } });
  if (!cls) return res.status(404).send('Class não encontrada');

  if (req.body.name !== undefined) {
    const nm = String(req.body.name || '').trim();
    if (!nm) return res.status(400).send('name inválido');
    cls.name = nm;
  }
  if (req.body.shift !== undefined) {
    const sh = String(req.body.shift || '').toUpperCase() as Shift;
    if (!sh) return res.status(400).send('shift inválido');
    cls.shift = sh;
  }
  if (req.body.gradeYear !== undefined) {
    const gy = Number(req.body.gradeYear);
    if (Number.isNaN(gy)) return res.status(400).send('gradeYear inválido');
    cls.gradeYear = gy;
    cls.hasContraturno = computeCT(gy);
  }

  const saved = await classRepo().save(cls);
  res.json(saved);
});

// Remover (com opção hard=true para apagar dados relacionados)
classesRouter.delete('/classes/:id', async (req, res) => {
  const id = Number(req.params.id);
  const hard = String(req.query.hard || '').toLowerCase() === 'true';

  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: 'id inválido' });
  }

  await AppDataSource.transaction(async (trx) => {
    const cRepo = trx.getRepository(SchoolClass);
    const wRepo = trx.getRepository(WeeklyLoad);
    const lRepo = trx.getRepository(Lesson);
    const tRepo = trx.getRepository(Teacher);

    const cls = await cRepo.findOne({ where: { id } });
    if (!cls) {
      res.status(404).json({ error: 'Class não encontrada' });
      return;
    }

    let removedWeeklyLoads = 0;
    let removedLessons = 0;
    let updatedTeachers = 0;

    if (hard) {
      // Apaga cargas semanais da turma
      removedWeeklyLoads = await wRepo
        .createQueryBuilder()
        .delete()
        .from(WeeklyLoad)
        .where('schoolClassId = :id', { id })
        .execute()
        .then(r => r.affected || 0);

      // Apaga lessons cujo schoolClass = nome da turma
      removedLessons = await lRepo
        .createQueryBuilder()
        .delete()
        .from(Lesson)
        .where('schoolClass = :name', { name: cls.name })
        .execute()
        .then(r => r.affected || 0);

      // Remove id da turma do allowedClassIds dos professores
      const teachers = await tRepo.find();
      const toUpdate: Teacher[] = [];
      for (const t of teachers) {
        const csv = String((t as any).allowedClassIds || '').trim();
        if (!csv) continue;
        const filtered = csv
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
          .map(Number)
          .filter(n => Number.isFinite(n) && n > 0 && n !== id);
        const next = filtered.join(',');
        if (next !== csv) {
          (t as any).allowedClassIds = next;
          toUpdate.push(t);
        }
      }
      if (toUpdate.length) {
        await tRepo.save(toUpdate);
        updatedTeachers = toUpdate.length;
      }
    }

    await cRepo.delete(id);

    res.json({
      ok: true,
      hard,
      removedWeeklyLoads,
      removedLessons,
      updatedTeachers,
    });
  });
});

// Cargas semanais (listar)
classesRouter.get('/classes/:id/loads', async (req, res) => {
  const classId = Number(req.params.id);
  res.json(await loadRepo().find({ where: { schoolClassId: classId } }));
});

// Cargas semanais (substitui em lote)
classesRouter.put('/classes/:id/loads', async (req, res) => {
  const classId = Number(req.params.id);
  const loads: Array<{subjectCode:string, hoursPerWeek:number}> = Array.isArray(req.body.loads) ? req.body.loads : [];
  await loadRepo().delete({ schoolClassId: classId });

  for (const { subjectCode, hoursPerWeek } of loads) {
    const code = String(subjectCode || '').trim().toUpperCase();
    const hpw: number = Math.max(0, Number(hoursPerWeek || 0));
    if (!code) continue;
    const row: Partial<WeeklyLoad> = { schoolClassId: classId, subjectCode: code, hoursPerWeek: hpw };
    await loadRepo().save(loadRepo().create(row));
  }

  res.json(await loadRepo().find({ where: { schoolClassId: classId } }));
});

// Aplica template por turma (1–5 ou 6–9)
classesRouter.post('/classes/:id/apply-default-loads', async (req, res) => {
  const id = Number(req.params.id);
  const cls = await classRepo().findOne({ where: { id } });
  if (!cls) return res.status(404).send('Class não encontrada');

  const tpl = cls.gradeYear >= 1 && cls.gradeYear <= 5 ? DEFAULT_LOADS_1_5 : DEFAULT_LOADS_6_9;

  await loadRepo().delete({ schoolClassId: id });
  for (const [subjectCodeRaw, hours] of Object.entries(tpl)) {
    const subjectCode = String(subjectCodeRaw).toUpperCase();
    const hpw: number = Math.max(0, Number(hours) || 0); // corrige 'unknown' -> number
    if (!subjectCode || hpw <= 0) continue;

    const row: Partial<WeeklyLoad> = { schoolClassId: id, subjectCode, hoursPerWeek: hpw };
    await loadRepo().save(loadRepo().create(row));
  }
  res.json(await loadRepo().find({ where: { schoolClassId: id } }));
});

// Aplica templates para TODAS as turmas
classesRouter.post('/classes/apply-default-loads/all', async (_req, res) => {
  const list = await classRepo().find();
  for (const cls of list) {
    const tpl = cls.gradeYear >= 1 && cls.gradeYear <= 5 ? DEFAULT_LOADS_1_5 : DEFAULT_LOADS_6_9;
    await loadRepo().delete({ schoolClassId: cls.id });

    for (const [subjectCodeRaw, hours] of Object.entries(tpl)) {
      const subjectCode = String(subjectCodeRaw).toUpperCase();
      const hpw: number = Math.max(0, Number(hours) || 0);
      if (!subjectCode || hpw <= 0) continue;

      const row: Partial<WeeklyLoad> = { schoolClassId: cls.id, subjectCode, hoursPerWeek: hpw };
      await loadRepo().save(loadRepo().create(row));
    }
  }
  res.json({ ok: true });
});
