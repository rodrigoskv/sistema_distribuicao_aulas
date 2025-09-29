// backend/src/routes/scheduleCheck.ts
import { Router } from 'express';
import { AppDataSource } from '../db/data-source';
import { WeeklyLoad } from '../models/WeeklyLoad';
import { SchoolClass } from '../models/SchoolClass';
import { Teacher } from '../models/Teacher';

export const scheduleCheck = Router();

scheduleCheck.get('/schedule/preflight', async (_req, res) => {
  const cls = await AppDataSource.getRepository(SchoolClass).find();
  const loads = await AppDataSource.getRepository(WeeklyLoad).find();
  const teachers = await AppDataSource.getRepository(Teacher).find();

  const problems: string[] = [];

  if (cls.length === 0) problems.push('Nenhuma turma cadastrada.');
  if (loads.length === 0) problems.push('Nenhuma carga semanal cadastrada (WeeklyLoad).');

  const badLoads = loads.filter(l => !l.subjectCode || !l.hoursPerWeek || l.hoursPerWeek <= 0);
  if (badLoads.length) problems.push(`Cargas inválidas: ${badLoads.length}.`);

  const noSubjects = teachers.filter(t => !String(t.subjectCodes||'').trim());
  if (noSubjects.length) problems.push(`Professores sem disciplinas: ${noSubjects.length}.`);

  const zeroMax = teachers.filter(t => !t.maxWeeklyLoad || t.maxWeeklyLoad <= 0);
  if (zeroMax.length) problems.push(`Professores com carga máxima 0: ${zeroMax.length}.`);

  const noTurn = teachers.filter(t => !t.availableMorning && !t.availableAfternoon && !t.availableCounterShift);
  if (noTurn.length) problems.push(`Professores sem nenhum turno disponível: ${noTurn.length}.`);

  res.json({ ok: problems.length === 0, problems });
});
