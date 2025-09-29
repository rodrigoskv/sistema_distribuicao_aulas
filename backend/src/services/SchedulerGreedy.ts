import { AppDataSource } from '../db/data-source';
import { Lesson } from '../models/Lesson';
import { Schedule } from '../models/Schedule';
import { SchoolClass } from '../models/SchoolClass';
import { WeeklyLoad } from '../models/WeeklyLoad';
import { Teacher } from '../models/Teacher';
import { Timeslot } from '../models/Timeslot';
import { DeepPartial } from 'typeorm';

type Shift = 'MATUTINO' | 'VESPERTINO' | 'CONTRATURNO';
type Opts = { population?: number; generations?: number; mutation?: number };

const PERIODS_PER_SHIFT = 5; // ✅ 5 aulas por turno/dia

const DAY_LABEL: Record<number, string> = { 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex' };
const ORDINAL: Record<number, string> = {
  1: '1ª aula',
  2: '2ª aula',
  3: '3ª aula',
  4: '4ª aula',
  5: '5ª aula',
};

// ----------------- helpers de slot -----------------
function getDay(ts: Timeslot | any): number { return Number((ts as any).day ?? 1); }
function getShift(ts: Timeslot | any): Shift { return String((ts as any).shift ?? 'MATUTINO').toUpperCase() as Shift; }
function getOrder(ts: Timeslot | any): number { return Number((ts as any).index ?? 1); }
function isTeachingSlot(ts: Timeslot | any): boolean {
  const v = (ts as any).isTeaching;
  return v === undefined ? true : !!v;
}
function formatSlotLabel(_day: number, _shift: Shift, ord: number) {
  return ORDINAL[ord] ?? `${ord}ª aula`;
}

// ----------------- helpers de professor -----------------
function teacherHasSubject(t: Teacher, code: string) {
  const csv = String((t as any).subjectCodes || '').toUpperCase();
  return csv.split(',').map(s => s.trim()).filter(Boolean).includes(code.toUpperCase());
}
function teacherAllowedForClass(t: Teacher, classId: number) {
  const raw = String((t as any).allowedClassIds || '').trim();
  if (!raw) return true;
  const ids = raw.split(',').map(s => Number(s.trim())).filter(n => Number.isFinite(n) && n > 0);
  return ids.includes(classId);
}
function teacherAvailableOn(t: Teacher, dayIdx: number, shift: Exclude<Shift, 'CONTRATURNO'>) {
  const map: Record<number, { m: keyof Teacher; a: keyof Teacher }> = {
    1: { m: 'monM', a: 'monA' },
    2: { m: 'tueM', a: 'tueA' },
    3: { m: 'wedM', a: 'wedA' },
    4: { m: 'thuM', a: 'thuA' },
    5: { m: 'friM', a: 'friA' },
  } as any;
  const f = map[dayIdx];
  if (!f) return false;
  const wantsMorning = !!(t as any)[f.m];
  const wantsAfternoon = !!(t as any)[f.a];
  return shift === 'MATUTINO' ? wantsMorning : wantsAfternoon;
}

// ✅ exportado para ser usado também no /preflight
export async function ensureTimeslots(): Promise<Timeslot[]> {
  const repo = AppDataSource.getRepository(Timeslot);
  let rows = await repo.find();

  // Sincroniza para 5 períodos por turno/dia:
  // - Cria faltantes (1..5)
  // - Desativa extras (>5) para não entrarem na geração
  const shifts: Shift[] = ['MATUTINO', 'VESPERTINO']; // adicione 'CONTRATURNO' se necessário
  const key = (d: number, s: Shift, i: number) => `${d}-${s}-${i}`;

  const byKey = new Map<string, Timeslot>();
  for (const r of rows) byKey.set(key(r.day as any, r.shift as any, r.index as any), r);

  const toCreate: DeepPartial<Timeslot>[] = [];
  const toUpdate: Timeslot[] = [];

  for (const s of shifts) {
    for (let d = 1; d <= 5; d++) {
      // garantir 1..PERIODS_PER_SHIFT
      for (let i = 1; i <= PERIODS_PER_SHIFT; i++) {
        if (!byKey.has(key(d, s, i))) {
          toCreate.push({
            day: d,
            shift: s,
            index: i,
            label: `${DAY_LABEL[d]} · ${ORDINAL[i] ?? `${i}ª aula`}`,
            isTeaching: true,
          });
        }
      }
    }
  }

  // desativar quaisquer slots > PERIODS_PER_SHIFT
  for (const r of rows) {
    if (r.index > PERIODS_PER_SHIFT && r.isTeaching) {
      r.isTeaching = false;
      toUpdate.push(r);
    }
  }

  if (toCreate.length) {
    const entities = repo.create(toCreate);
    await repo.save(entities);
  }
  if (toUpdate.length) {
    await repo.save(toUpdate);
  }

  rows = await repo.find();
  return rows;
}

// ----------------- geração simples e legível -----------------
export async function generateNaive(_opts: Opts) {
  const ds = AppDataSource;

  await ensureTimeslots();
  const allTimeslots = await ds.getRepository(Timeslot).find();

  const classes  = await ds.getRepository(SchoolClass).find({ order: { name: 'ASC' } });
  const teachers = await ds.getRepository(Teacher).find({ order: { name: 'ASC' } });

  // estados auxiliares
  const busyTeacher = new Set<string>();
  const busyClass   = new Set<string>();
  const teacherLoad = new Map<number, number>();      // aulas atribuídas por prof
  const sameSubjectPerDay = new Set<string>();        // evita 2x mesma matéria no mesmo dia para mesma turma

  // helper: respeita limite semanal (0 = ilimitado)
  const respectsCap = (t: Teacher) => {
    const used = teacherLoad.get(t.id!) || 0;
    const max  = Number((t as any).maxWeeklyLoad ?? 0);
    return max > 0 ? used < max : true;
  };

  // helper: escolhe o elegível menos carregado neste momento
  const pickLeastLoaded = (cands: Teacher[], day: number, shift: Shift, ord: number) => {
    let best: Teacher | null = null;
    let bestLoad = Number.POSITIVE_INFINITY;
    for (const t of cands) {
      const tKey = `${t.id}@${day}@${shift}@${ord}`;
      if (busyTeacher.has(tKey)) continue;
      const used = teacherLoad.get(t.id!) || 0;
      if (used < bestLoad) { best = t; bestLoad = used; }
    }
    return best;
  };

  // 💾 tudo em transação para consistência
  return await ds.transaction(async (trx) => {
    const scheduleRepo = trx.getRepository(Schedule);
    const lessonRepo   = trx.getRepository(Lesson);
    const loadRepo     = trx.getRepository(WeeklyLoad);

    // ---- CRIAÇÃO DO SCHEDULE (objeto único; evita overload de array)
    const schedule = scheduleRepo.create({ createdAt: new Date(), fitness: 0 } as DeepPartial<Schedule>);
    await scheduleRepo.save(schedule); // o próprio objeto recebe o id

    const lessonsToInsert: DeepPartial<Lesson>[] = [];

    for (const cls of classes) {
      const clsLoads = await loadRepo.find({ where: { schoolClassId: cls.id } });

      const clsSlots = allTimeslots
        .filter(ts =>
          isTeachingSlot(ts) &&
          getShift(ts) === (cls.shift as Shift) &&
          getOrder(ts) <= PERIODS_PER_SHIFT // ✅ usa só 1..5
        )
        .sort((a, b) => (getDay(a) - getDay(b)) || (getOrder(a) - getOrder(b)));

      for (const l of clsLoads) {
        const subjectCode = String(l.subjectCode || '').trim().toUpperCase();
        const need        = Math.max(0, Number(l.hoursPerWeek || 0));
        if (!subjectCode || need <= 0) continue;

        let placed = 0;

        for (const ts of clsSlots) {
          if (placed >= need) break;

          const day   = getDay(ts);
          const shift = getShift(ts);
          const ord   = getOrder(ts);
          const classSlotKey = `${cls.id}@${day}@${shift}@${ord}`;
          if (busyClass.has(classSlotKey)) continue;

          // ✅ não repetir a MESMA matéria 2x no mesmo dia para esta turma
          const subjDayKey = `${cls.id}@${day}@${subjectCode}`;
          if (sameSubjectPerDay.has(subjDayKey)) continue;

          const eligible = teachers.filter(t =>
            teacherHasSubject(t, subjectCode) &&
            teacherAllowedForClass(t, cls.id) &&
            teacherAvailableOn(t, day, shift as Exclude<Shift,'CONTRATURNO'>) &&
            respectsCap(t)
          );

          const chosen = pickLeastLoaded(eligible, day, shift, ord);
          if (!chosen) continue;

          // marca ocupações
          busyClass.add(classSlotKey);
          busyTeacher.add(`${chosen.id}@${day}@${shift}@${ord}`);
          teacherLoad.set(chosen.id!, (teacherLoad.get(chosen.id!) || 0) + 1);
          sameSubjectPerDay.add(subjDayKey);

          const friendly = formatSlotLabel(day, shift, ord);

          lessonsToInsert.push({
            scheduleId: schedule.id,
            teacher: (chosen as any).name,
            subject: subjectCode,
            schoolClass: cls.name,
            timeslotLabel: friendly, // “1ª aula” ... “5ª aula”
            resource: null,
            shift,
            day,
            slot: ord,
          });
          placed++;
        }
      }
    }

    const lessonEntities = lessonRepo.create(lessonsToInsert);
    await lessonRepo.save(lessonEntities);

    const lessons = await lessonRepo.find({
      where: { scheduleId: schedule.id },
      order: { schoolClass: 'ASC', day: 'ASC', slot: 'ASC' } as any,
    });

    return { schedule, lessons };
  });
}
