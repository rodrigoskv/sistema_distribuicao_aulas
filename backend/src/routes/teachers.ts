import { Router } from 'express';
import { AppDataSource } from '../db/data-source';
import { Teacher } from '../models/Teacher';

export const teachersRouter = Router();
const repo = () => AppDataSource.getRepository(Teacher);

function normCSV(v: any): string {
  if (Array.isArray(v)) return v.map((s: any) => String(s).trim().toUpperCase()).filter(Boolean).join(',');
  return String(v ?? '').split(',').map(s => s.trim().toUpperCase()).filter(Boolean).join(',');
}
function optString(v: any): string | undefined {
  const s = String(v ?? '').trim();
  return s ? s : undefined;
}

teachersRouter.get('/teachers', async (_req, res) => {
  res.json(await repo().find({ order: { name: 'ASC' } }));
});

teachersRouter.post('/teachers', async (req, res) => {
  const b = req.body || {};
  const t = repo().create({
    name: String(b.name || '').trim(),
    email: optString(b.email),
    subjectCodes: normCSV(b.subjectCodes),
    maxWeeklyLoad: Number(b.maxWeeklyLoad || 0),

    availableMorning: !!b.availableMorning,
    availableAfternoon: !!b.availableAfternoon,
    availableCounterShift: !!b.availableCounterShift,

    allowedClassIds: b.allowedClassIds !== undefined ? String(b.allowedClassIds || '') : undefined,

    monM: !!b?.availability?.mon?.morning,
    monA: !!b?.availability?.mon?.afternoon,
    tueM: !!b?.availability?.tue?.morning,
    tueA: !!b?.availability?.tue?.afternoon,
    wedM: !!b?.availability?.wed?.morning,
    wedA: !!b?.availability?.wed?.afternoon,
    thuM: !!b?.availability?.thu?.morning,
    thuA: !!b?.availability?.thu?.afternoon,
    friM: !!b?.availability?.fri?.morning,
    friA: !!b?.availability?.fri?.afternoon,
  } as Partial<Teacher>);
  res.status(201).json(await repo().save(t));
});

teachersRouter.put('/teachers/:id', async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body || {};

  const patch: Partial<Teacher> = {
    name: b.name !== undefined ? String(b.name || '').trim() : undefined,
    email: b.email !== undefined ? optString(b.email) : undefined,
    subjectCodes: b.subjectCodes !== undefined ? normCSV(b.subjectCodes) : undefined,
    maxWeeklyLoad: b.maxWeeklyLoad !== undefined ? Number(b.maxWeeklyLoad || 0) : undefined,

    availableMorning: b.availableMorning !== undefined ? !!b.availableMorning : undefined,
    availableAfternoon: b.availableAfternoon !== undefined ? !!b.availableAfternoon : undefined,
    availableCounterShift: b.availableCounterShift !== undefined ? !!b.availableCounterShift : undefined,

    allowedClassIds: b.allowedClassIds !== undefined ? String(b.allowedClassIds || '') : undefined,

    monM: b?.availability?.mon?.morning ?? undefined,
    monA: b?.availability?.mon?.afternoon ?? undefined,
    tueM: b?.availability?.tue?.morning ?? undefined,
    tueA: b?.availability?.tue?.afternoon ?? undefined,
    wedM: b?.availability?.wed?.morning ?? undefined,
    wedA: b?.availability?.wed?.afternoon ?? undefined,
    thuM: b?.availability?.thu?.morning ?? undefined,
    thuA: b?.availability?.thu?.afternoon ?? undefined,
    friM: b?.availability?.fri?.morning ?? undefined,
    friA: b?.availability?.fri?.afternoon ?? undefined,
  };

  await repo().update(id, patch as any);
  res.json(await repo().findOneBy({ id }));
});

teachersRouter.delete('/teachers/:id', async (req, res) => {
  await repo().delete(Number(req.params.id));
  res.json({ ok: true });
});
