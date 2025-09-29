// src/seed.ts
import { AppDataSource } from './db/data-source';
import { Subject } from './models/Subject';
import { Timeslot } from './models/Timeslot';
import { SchoolClass } from './models/SchoolClass';
import { WeeklyLoad } from './models/WeeklyLoad';
import { Teacher } from './models/Teacher';

export async function seed() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  const ds = AppDataSource;

  // 1) Disciplinas (pré-carregadas – garantimos)
  const subjRepo = ds.getRepository(Subject);
  const SUBJECTS: ReadonlyArray<readonly [string, string]> = [
    ['PORT','Língua Portuguesa'], ['MAT','Matemática'], ['CIE','Ciências'],
    ['HIST','História'], ['GEO','Geografia'], ['EF','Educação Física'],
    ['ART','Arte'], ['ING','Inglês'], ['ESP','Espanhol'],
    ['ER','Ensino Religioso'], ['INF','Informática']
  ];
  for (const [code, name] of SUBJECTS) {
    const existing = await subjRepo.findOne({ where: { code } });
    if (!existing) {
      await subjRepo.save(subjRepo.create({ code, name, active: true }));
    }
  }

  // 2) Timeslots (5 dias x 5 aulas manhã e 5 aulas tarde)
  const tRepo = ds.getRepository(Timeslot);
  if (await tRepo.count() === 0) {
    const shifts: Array<Timeslot['shift']> = ['MATUTINO', 'VESPERTINO'];
    const labelsM = ['07:30–08:20','08:20–09:10','09:20–10:10','10:10–11:00','11:00–11:50'];
    const labelsA = ['13:00–13:50','13:50–14:40','14:50–15:40','15:40–16:30','16:30–17:20'];
    for (let day = 1; day <= 5; day++) {
      for (const shift of shifts) {
        const labels = shift === 'MATUTINO' ? labelsM : labelsA;
        for (let index = 0; index < labels.length; index++) {
          await tRepo.save(tRepo.create({
            day, shift, index, label: labels[index], isTeaching: true
          }));
        }
      }
    }
  }

  // 3) Turmas
  const classRepo = ds.getRepository(SchoolClass);
  const loadRepo  = ds.getRepository(WeeklyLoad);

  let c5a = await classRepo.findOne({ where: { name: '5ºA' } });
  let c5b = await classRepo.findOne({ where: { name: '5ºB' } });
  let c6a = await classRepo.findOne({ where: { name: '6ºA' } });
  let c6b = await classRepo.findOne({ where: { name: '6ºB' } });

  if (!c5a) c5a = await classRepo.save(classRepo.create({ name: '5ºA', gradeYear: 5, shift: 'MATUTINO',  hasContraturno: false }));
  if (!c5b) c5b = await classRepo.save(classRepo.create({ name: '5ºB', gradeYear: 5, shift: 'MATUTINO',  hasContraturno: false }));
  if (!c6a) c6a = await classRepo.save(classRepo.create({ name: '6ºA', gradeYear: 6, shift: 'VESPERTINO', hasContraturno: true  }));
  if (!c6b) c6b = await classRepo.save(classRepo.create({ name: '6ºB', gradeYear: 6, shift: 'VESPERTINO', hasContraturno: true  }));

  // 4) Cargas semanais por turma (mínimo viável e realista)
  async function ensureLoads(scId: number, pairs: ReadonlyArray<readonly [string, number]>) {
    for (const [subjectCode, hoursPerWeek] of pairs) {
      const exists = await loadRepo.findOne({ where: { schoolClassId: scId, subjectCode } });
      if (!exists) await loadRepo.save(loadRepo.create({ schoolClassId: scId, subjectCode, hoursPerWeek }));
    }
  }

  await ensureLoads(c5a.id, [
    ['PORT',5], ['MAT',5], ['CIE',3], ['HIST',2], ['GEO',2], ['EF',2], ['ART',2], ['ING',2]
  ]);
  await ensureLoads(c5b.id, [
    ['PORT',5], ['MAT',5], ['CIE',3], ['HIST',2], ['GEO',2], ['EF',2], ['ART',2], ['ING',2]
  ]);
  await ensureLoads(c6a.id, [
    ['PORT',5], ['MAT',5], ['CIE',3], ['HIST',2], ['GEO',2], ['EF',2], ['ART',1], ['ING',2], ['ER',1]
  ]);
  await ensureLoads(c6b.id, [
    ['PORT',5], ['MAT',5], ['CIE',3], ['HIST',2], ['GEO',2], ['EF',2], ['ART',1], ['ING',2], ['ER',1]
  ]);

  // 5) Professores (capacidade suficiente para cobrir as cargas)
  const teacherRepo = ds.getRepository(Teacher);
  if (await teacherRepo.count() === 0) {
    const allowMorning   = `${c5a.id},${c5b.id}`;
    const allowAfternoon = `${c6a.id},${c6b.id}`;
    const allowAll       = `${c5a.id},${c5b.id},${c6a.id},${c6b.id}`;

    const add = (t: Partial<Teacher>) =>
      teacherRepo.save(teacherRepo.create(t as Teacher));

    // Manhã (5º ano)
    await add({ name:'Simone',  email:'simone@escola.local',  subjectCodes:'PORT', maxWeeklyLoad:20,
      monM:true,tueM:true,wedM:true,thuM:true,friM:true, allowedClassIds: allowMorning });
    await add({ name:'Carlos',  email:'carlos@escola.local',  subjectCodes:'MAT',  maxWeeklyLoad:20,
      monM:true,tueM:true,wedM:true,thuM:true,friM:true, allowedClassIds: allowMorning });
    await add({ name:'Ana',     email:'ana@escola.local',     subjectCodes:'CIE',  maxWeeklyLoad:12,
      monM:true,tueM:true,wedM:true,thuM:false,friM:false, allowedClassIds: allowMorning });
    await add({ name:'Bruno',   email:'bruno@escola.local',   subjectCodes:'HIST', maxWeeklyLoad:10,
      monM:true,tueM:true,wedM:false,thuM:true,friM:false, allowedClassIds: allowMorning });
    await add({ name:'Carla',   email:'carla@escola.local',   subjectCodes:'GEO',  maxWeeklyLoad:10,
      monM:true,tueM:true,wedM:false,thuM:true,friM:false, allowedClassIds: allowMorning });
    await add({ name:'Diego',   email:'diego@escola.local',   subjectCodes:'EF',   maxWeeklyLoad:10,
      monM:true,tueM:false,wedM:true,thuM:false,friM:true, allowedClassIds: allowMorning });
    await add({ name:'Elisa',   email:'elisa@escola.local',   subjectCodes:'ART',  maxWeeklyLoad:8,
      monM:true,tueM:false,wedM:true,thuM:false,friM:false, allowedClassIds: allowMorning });
    await add({ name:'Fábio',   email:'fabio@escola.local',   subjectCodes:'ING',  maxWeeklyLoad:12,
      monM:true,tueM:true,wedM:true,thuM:false,friM:false, allowedClassIds: allowMorning });

    // Tarde (6º ano)
    await add({ name:'Paula',   email:'paula@escola.local',   subjectCodes:'PORT', maxWeeklyLoad:20,
      monA:true,tueA:true,wedA:true,thuA:true,friA:true, allowedClassIds: allowAfternoon });
    await add({ name:'Rafael',  email:'rafael@escola.local',  subjectCodes:'MAT',  maxWeeklyLoad:20,
      monA:true,tueA:true,wedA:true,thuA:true,friA:true, allowedClassIds: allowAfternoon });
    await add({ name:'Bianca',  email:'bianca@escola.local',  subjectCodes:'CIE',  maxWeeklyLoad:12,
      monA:true,tueA:true,wedA:true,thuA:false,friA:false, allowedClassIds: allowAfternoon });
    await add({ name:'Gustavo', email:'gustavo@escola.local', subjectCodes:'HIST', maxWeeklyLoad:10,
      monA:true,tueA:true,wedA:false,thuA:true,friA:false, allowedClassIds: allowAfternoon });
    await add({ name:'Helena',  email:'helena@escola.local',  subjectCodes:'GEO',  maxWeeklyLoad:10,
      monA:true,tueA:true,wedA:false,thuA:true,friA:false, allowedClassIds: allowAfternoon });
    await add({ name:'Ígor',    email:'igor@escola.local',    subjectCodes:'EF',   maxWeeklyLoad:10,
      monA:true,tueA:false,wedA:true,thuA:false,friA:true, allowedClassIds: allowAfternoon });
    await add({ name:'Joana',   email:'joana@escola.local',   subjectCodes:'ART',  maxWeeklyLoad:8,
      monA:true,tueA:false,wedA:true,thuA:false,friA:false, allowedClassIds: allowAfternoon });
    await add({ name:'Lívia',   email:'livia@escola.local',   subjectCodes:'ING',  maxWeeklyLoad:12,
      monA:true,tueA:true,wedA:true,thuA:false,friA:false, allowedClassIds: allowAfternoon });
    await add({ name:'Nina',    email:'nina@escola.local',    subjectCodes:'ER',   maxWeeklyLoad:4,
      monA:true,tueA:false,wedA:false,thuA:false,friA:true, allowedClassIds: allowAfternoon });

    // Um “coringa” para INF caso use no futuro
    await add({ name:'Otávio',  email:'otavio@escola.local',  subjectCodes:'INF',  maxWeeklyLoad:6,
      monM:true,tueA:true,wedM:true,thuA:true,friM:false, allowedClassIds: allowAll });
  }

  console.log('Seed OK.');
}

// permite rodar direto: `npm run seed`
if (require.main === module) {
  seed()
    .then(() => { console.log('Done'); process.exit(0); })
    .catch((e) => { console.error(e); process.exit(1); });
}
