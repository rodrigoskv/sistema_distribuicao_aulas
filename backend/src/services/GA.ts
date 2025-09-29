// src/services/GA.ts
import { AppDataSource } from '../db/data-source';
import { Teacher } from '../models/Teacher';
import { SchoolClass } from '../models/SchoolClass';
import { WeeklyLoad } from '../models/WeeklyLoad';
import { Subject } from '../models/Subject';

type Shift = 'MATUTINO' | 'VESPERTINO';
type Day = 0 | 1 | 2 | 3 | 4;

export interface GenerateOptions {
  days?: Day[];                 // default: [0..4]
  periodsPerShift?: number;     // default: 5
}

export interface Assignment {
  classId: number;
  day: Day;
  shift: Shift;
  period: number;
  subjectCode: string;
  teacherId: number;
}

export interface ScheduleResult {
  schedule: Assignment[];
  unassigned: Array<{ classId: number; subjectCode: string; reason: string }>;
  stats: { classCount: number; teacherCount: number; totalPlaced: number; totalUnassigned: number; };
}

const DAYS_DEFAULT: Day[] = [0,1,2,3,4];
const PERIODS_DEFAULT = 5;

function opposite(shift: Shift): Shift {
  return shift === 'MATUTINO' ? 'VESPERTINO' : 'MATUTINO';
}

export async function generateSchedule(opts: GenerateOptions = {}): Promise<ScheduleResult> {
  const days = (opts.days && opts.days.length ? opts.days : DAYS_DEFAULT) as Day[];
  const periodsPerShift = Math.max(1, opts.periodsPerShift ?? PERIODS_DEFAULT);

  const teacherRepo = AppDataSource.getRepository(Teacher);
  const classRepo   = AppDataSource.getRepository(SchoolClass);
  const loadRepo    = AppDataSource.getRepository(WeeklyLoad);
  const subjRepo    = AppDataSource.getRepository(Subject);

  const [teachers, classes, loads, subjects] = await Promise.all([
    teacherRepo.find(), classRepo.find(), loadRepo.find(), subjRepo.find()
  ]);

  const subjByCode = new Map(subjects.map(s => [s.code.toUpperCase(), s]));

  const loadsByClass = new Map<number, WeeklyLoad[]>();
  for (const l of loads) {
    const arr = loadsByClass.get(l.schoolClassId) || [];
    arr.push(l);
    loadsByClass.set(l.schoolClassId, arr);
  }

  type TState = {
    id: number;
    name: string;
    subjects: Set<string>;
    remaining: number;
    availM: boolean;
    availA: boolean;
    availCT: boolean;
    allowed: Set<number> | null; // null => qualquer turma; Set => somente IDs contidos
  };
  const tState = new Map<number, TState>();
  for (const t of teachers) {
    const codes = String(t.subjectCodes || '')
      .split(',').map(x => x.trim().toUpperCase()).filter(Boolean);
    const allowedSet = (() => {
      const csv = (t as any).allowedClassIds as string | null | undefined;
      if (!csv) return null;
      const ids = csv.split(',').map(s => Number(s.trim())).filter(n => Number.isFinite(n) && n>0);
      return ids.length ? new Set(ids) : null;
    })();
    tState.set(t.id, {
      id: t.id,
      name: t.name,
      subjects: new Set(codes),
      remaining: Math.max(0, Number(t.maxWeeklyLoad || 0)),
      availM: !!t.availableMorning,
      availA: !!t.availableAfternoon,
      availCT: !!(t as any).availableCounterShift,
      allowed: allowedSet,
    });
  }

  type Need = { classId: number; subjectCode: string };
  const needs: Need[] = [];
  for (const c of classes) {
    const clsLoads = loadsByClass.get(c.id) || [];
    for (const l of clsLoads) {
      const code = String(l.subjectCode || '').toUpperCase();
      if (!code || !subjByCode.has(code)) continue;
      const qty = Math.max(0, Number(l.hoursPerWeek || 0));
      for (let i = 0; i < qty; i++) needs.push({ classId: c.id, subjectCode: code });
    }
  }

  function teacherCountFor(code: string, classId: number) {
    let count = 0;
    for (const t of tState.values()) {
      if (!t.subjects.has(code)) continue;
      if (t.allowed && !t.allowed.has(classId)) continue;
      count++;
    }
    return count;
  }
  needs.sort((a, b) => {
    const ta = teacherCountFor(a.subjectCode, a.classId);
    const tb = teacherCountFor(b.subjectCode, b.classId);
    if (ta !== tb) return ta - tb;
    return a.classId - b.classId;
  });

  const schedule: Assignment[] = [];
  const unassigned: ScheduleResult['unassigned'] = [];
  const busy = new Set<string>(); // teacherId|day|period|shift
  const classDaySubject = new Set<string>(); // classId|day|subject
  const classSlotBusy = new Set<string>(); // classId|day|period|shift
  const busyKey = (tid:number, d:Day, p:number, s:Shift) => `${tid}|${d}|${p}|${s}`;

  const classSlots = new Map<number, Array<{ day: Day; period: number; shift: Shift; isCT: boolean }>>();
  const classById = new Map(classes.map(c => [c.id, c]));
  for (const c of classes) {
    const slots: Array<{ day: Day; period: number; shift: Shift; isCT: boolean }> = [];
    for (const d of days) {
      for (let p = 0; p < periodsPerShift; p++) {
        slots.push({ day: d, period: p, shift: c.shift as Shift, isCT: false });
        if (c.hasContraturno) slots.push({ day: d, period: p, shift: opposite(c.shift as Shift), isCT: true });
      }
    }
    classSlots.set(c.id, slots);
  }

  for (const need of needs) {
    const c = classById.get(need.classId)!;
    const slots = classSlots.get(need.classId)!;

    let placed = false;

    const ordered = [...slots].sort((s1, s2) => {
      const w1 = s1.shift === (c.shift as Shift) ? 0 : 1;
      const w2 = s2.shift === (c.shift as Shift) ? 0 : 1;
      if (w1 !== w2) return w1 - w2;
      if (s1.day !== s2.day) return s1.day - s2.day;
      return s1.period - s2.period;
    });

    for (const slot of ordered) {
      const keyClassSlot = `${need.classId}|${slot.day}|${slot.period}|${slot.shift}`;
      if (classSlotBusy.has(keyClassSlot)) continue;

      const keyNoRepeat = `${need.classId}|${slot.day}|${need.subjectCode}`;
      if (classDaySubject.has(keyNoRepeat)) continue;

      const candidates: TState[] = [];
      for (const t of tState.values()) {
        if (!t.subjects.has(need.subjectCode)) continue;
        if (t.allowed && !t.allowed.has(need.classId)) continue;     // 🔒 restrição por turma
        if (t.remaining <= 0) continue;

        const isMainShift = slot.shift === (c.shift as Shift);
        if (isMainShift) {
          if (slot.shift === 'MATUTINO' && !t.availM) continue;
          if (slot.shift === 'VESPERTINO' && !t.availA) continue;
        } else {
          if (!t.availCT) continue;
          if (slot.shift === 'MATUTINO' && !t.availM) continue;
          if (slot.shift === 'VESPERTINO' && !t.availA) continue;
        }

        if (busy.has(busyKey(t.id, slot.day, slot.period, slot.shift))) continue;

        candidates.push(t);
      }

      if (!candidates.length) continue;

      candidates.sort((a, b) => b.remaining - a.remaining);
      const chosen = candidates[0];

      schedule.push({ classId: need.classId, day: slot.day, shift: slot.shift, period: slot.period, subjectCode: need.subjectCode, teacherId: chosen.id });
      chosen.remaining -= 1;
      busy.add(busyKey(chosen.id, slot.day, slot.period, slot.shift));
      classSlotBusy.add(keyClassSlot);
      classDaySubject.add(keyNoRepeat);

      const idx = slots.findIndex(s => s.day === slot.day && s.period === slot.period && s.shift === slot.shift);
      if (idx >= 0) slots.splice(idx, 1);

      placed = true;
      break;
    }

    if (!placed) {
      unassigned.push({ classId: need.classId, subjectCode: need.subjectCode, reason: 'Sem professor/slot disponível dentro das restrições' });
    }
  }

  return {
    schedule,
    unassigned,
    stats: { classCount: classes.length, teacherCount: teachers.length, totalPlaced: schedule.length, totalUnassigned: unassigned.length },
  };
}
