import { canPlace, softCost, ensureContraTurno } from "./constraints.js";
import { demandByClass } from "./bncc.js";

function blankState(){ return { slots:[], stats:{} }; }

function allTimeslots(cfg){
  const days = cfg.settings.days, shifts = cfg.settings.shifts, periods = cfg.settings.periodsPerShift;
  const ts = [];
  for (const day of days) for (const shift of shifts) for (let p=1;p<=periods;p++) ts.push({ day, shift, period:p });
  return ts;
}

function teachersFor(subject, cfg, day, shift){
  return cfg.teachers.filter(t => t.subjects.includes(subject) && (t.availability?.[day]||[]).includes(shift));
}

export function generateSchedule(cfg){
  const state = blankState();
  const ts = allTimeslots(cfg);
  const demands = demandByClass(cfg);

  function placeBlock(classId, subject, preferOpposite=false){
    let best = null;
    for (const { day, shift, period } of ts){
      const turma = cfg.classes.find(c=>c.id===classId);
      const allowOpposite = turma.year >= 6;
      if (!allowOpposite && shift !== turma.shift) continue;
      if (preferOpposite && shift === turma.shift) continue;

      const teachers = teachersFor(subject, cfg, day, shift);
      if (!teachers.length) continue;

      const tries = [];
      for (const t of teachers){
        const res = t.needsResource || null;
        const s1 = { day, shift, period, classId, subject, teacherId: t.id, resourceId: res };
        const s2 = { day, shift, period: period+1, classId, subject, teacherId: t.id, resourceId: res };
        if (period < cfg.settings.periodsPerShift && canPlace(s1, state) && canPlace(s2, state)){
          tries.push({ slots:[s1,s2], cost: softCost([s1,s2], state) });
        }
        if (canPlace(s1, state)){
          tries.push({ slots:[s1], cost: softCost([s1], state) + 0.2 });
        }
      }
      if (tries.length){
        const cand = tries.sort((a,b)=>a.cost-b.cost)[0];
        if (!best || cand.cost < best.cost) best = cand;
      }
    }
    if (best){ state.slots.push(...best.slots); return best.slots.length; }
    return 0;
  }

  // ordem por maior demanda total
  const classOrder = Object.keys(demands).sort((a,b)=>{
    const sum = (o)=> Object.values(o).reduce((x,y)=>x+y,0);
    return sum(demands[b]) - sum(demands[a]);
  });

  for (const classId of classOrder){
    const subj = Object.keys(demands[classId]);
    const prio = ["Portugues","Matematica","Ciencias","Historia","Geografia","Ingles","Artes","EducacaoFisica"];
    const ordered = subj.sort((a,b)=> prio.indexOf(a)-prio.indexOf(b));

    // se 6..9 ano, tente colocar um bloco no contra-turno logo de cara
    const turma = cfg.classes.find(c=>c.id===classId);
    if (turma.year >= 6){
      for (const s of ordered){
        if (demands[classId][s] > 0){
          const placed = placeBlock(classId, s, /*preferOpposite=*/true);
          if (placed>0){ demands[classId][s] -= placed; break; }
        }
      }
    }

    // alocação normal
    for (const s of ordered){
      let need = demands[classId][s];
      while (need > 0){
        const placed = placeBlock(classId, s);
        if (placed===0) break;
        need -= placed;
      }
    }
  }

  // verificação contra-turno; tentativa extra se pendente
  if (!ensureContraTurno(state, cfg)){
    for (const turma of cfg.classes.filter(c=>c.year>=6)){
      const substate = { slots: state.slots.filter(s=>s.classId===turma.id) };
      const ok = ensureContraTurno(substate, { settings: cfg.settings, classes:[turma] });
      if (!ok){
        const subjList = Object.keys(cfg.bncc[String(turma.year)]||{});
        for (const subject of subjList){
          const placed = placeBlock(turma.id, subject, /*preferOpposite=*/true);
          if (placed>0) break;
        }
      }
    }
  }

  state.stats = { slots: state.slots.length, contraTurnoOk: ensureContraTurno(state, cfg) };
  return state;
}
