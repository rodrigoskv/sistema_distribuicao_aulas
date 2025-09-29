import { Router } from 'express';
import { AppDataSource } from '../db/data-source';
import { Schedule } from '../models/Schedule';
import { Lesson } from '../models/Lesson';
import { SchoolClass } from '../models/SchoolClass';
import { WeeklyLoad } from '../models/WeeklyLoad';
import { Teacher } from '../models/Teacher';
import { Timeslot } from '../models/Timeslot';
import { ensureTimeslots, generateNaive } from '../services/NaiveScheduler';

export const scheduleRouter = Router();

/** Sanidade antes de gerar – formato que o front espera */
scheduleRouter.get('/preflight', async (_req, res) => {
  const ds = AppDataSource;
  const problems: string[] = [];

  // ✅ garante que timeslots existam (idempotente)
  await ensureTimeslots();

  const [classes, loads, teachers, timeslots] = await Promise.all([
    ds.getRepository(SchoolClass).count(),
    ds.getRepository(WeeklyLoad).count(),
    ds.getRepository(Teacher).count(),
    ds.getRepository(Timeslot).count(),
  ]);

  if (!timeslots) problems.push('Nenhum timeslot cadastrado.');
  if (!loads)     problems.push('Nenhuma carga semanal (WeeklyLoad) cadastrada.');
  if (!classes)   problems.push('Nenhuma turma cadastrada.');
  if (!teachers)  problems.push('Nenhum professor cadastrado.');

  res.json({ ok: problems.length === 0, problems });
});

/** Último horário gerado (schedule + lessons) */
scheduleRouter.get('/', async (_req, res) => {
  const schRepo = AppDataSource.getRepository(Schedule);
  const lessonRepo = AppDataSource.getRepository(Lesson);

  // pega UM schedule mais recente (não array)
  const schedule = await schRepo.findOne({
    where: {},
    order: { createdAt: 'DESC' },
  });

  if (!schedule) {
    return res.json({ schedule: null, lessons: [] });
  }

  const lessons = await lessonRepo.find({
    where: { scheduleId: schedule.id },
    order: { schoolClass: 'ASC', day: 'ASC', slot: 'ASC' } as any,
  });

  res.json({
    schedule: {
      id: schedule.id,
      createdAt: schedule.createdAt,
      fitness: schedule.fitness,
    },
    lessons,
  });
});

/** Geração – por ora usa o plano B (naive) */
scheduleRouter.post('/generate', async (req, res) => {
  const { population = 120, generations = 40, mutation = 0.07 } = req.body || {};
  const { schedule, lessons } = await generateNaive({ population, generations, mutation });
  res.status(201).json({
    engine: 'naive',
    scheduleId: schedule.id,
    lessons: lessons.length,
  });
});

/** Limpar tudo (útil para testar) */
scheduleRouter.post('/clear', async (_req, res) => {
  await AppDataSource.getRepository(Lesson).clear();
  await AppDataSource.getRepository(Schedule).clear();
  res.json({ ok: true });
});
