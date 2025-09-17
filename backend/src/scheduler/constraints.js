// Restrições Hard + custo (Soft)
export function canPlace(slot, state){
  // conflito professor
  if (state.slots.some(s => s.day===slot.day && s.shift===slot.shift && s.period===slot.period && s.teacherId===slot.teacherId)) return false;
  // conflito turma
  if (state.slots.some(s => s.day===slot.day && s.shift===slot.shift && s.period===slot.period && s.classId===slot.classId)) return false;
  // conflito recurso exclusivo
  if (slot.resourceId){
    if (state.slots.some(s => s.day===slot.day && s.shift===slot.shift && s.period===slot.period && s.resourceId===slot.resourceId)) return false;
  }
  return true;
}

export function softCost(addedSlots, state){
  let cost = 0;
  for (const slot of addedSlots){
    // favorecer pares consecutivos
    const neighbor = state.slots.some(s =>
      s.day===slot.day && s.shift===slot.shift && s.classId===slot.classId && s.subject===slot.subject &&
      (s.period===slot.period-1 || s.period===slot.period+1)
    );
    if (!neighbor) cost += 1;
    // penalizar gaps da turma
    const cls = state.slots.filter(s=> s.day===slot.day && s.shift===slot.shift && s.classId===slot.classId).map(s=>s.period).sort((a,b)=>a-b);
    for (let i=1;i<cls.length;i++){ const gap = cls[i]-cls[i-1]-1; if (gap>0) cost += gap; }
    // penalizar gaps do professor
    const tch = state.slots.filter(s=> s.day===slot.day && s.shift===slot.shift && s.teacherId===slot.teacherId).map(s=>s.period).sort((a,b)=>a-b);
    for (let i=1;i<tch.length;i++){ const gap = tch[i]-tch[i-1]-1; if (gap>0) cost += gap; }
  }
  return cost;
}

export function ensureContraTurno(state, cfg){
  const need = cfg.settings?.contraTurnoPeriods ?? 2;
  const days = cfg.settings.days;
  for (const turma of cfg.classes){
    if (turma.year < 6) continue;
    const classSlots = state.slots.filter(s => s.classId===turma.id);
    const ok = days.some(d => classSlots.filter(s => s.day===d && s.shift!==turma.shift).length >= need);
    if (!ok) return false;
  }
  return true;
}
