// demanda por turma a partir da BNCC
export function demandByClass(cfg){
  const result = {};
  for (const turma of cfg.classes){
    const map = cfg.bncc[String(turma.year)] || {};
    result[turma.id] = { ...map };
    for (const k of Object.keys(result[turma.id])) result[turma.id][k] = Number(result[turma.id][k] || 0);
  }
  return result;
}
