import React, { useEffect, useMemo, useState } from 'react';
import { get, post, put, del } from '../lib/api';

type Shift = 'MATUTINO'|'VESPERTINO';
type SchoolClass = { id:number; name:string; gradeYear:number; shift:Shift; hasContraturno:boolean };
type Subject = { id:number; code:string; name:string; active?:boolean };
type LoadRow = { subjectCode:string; hoursPerWeek:number };

const DEFAULT_1_5: Record<string, number> = { PORT:5, MAT:5, CIE:2, HIST:2, GEO:2, EF:2, ART:2, ING:2, ER:1, INF:1 };
const DEFAULT_6_9: Record<string, number> = { PORT:5, MAT:5, CIE:3, HIST:2, GEO:2, EF:2, ART:2, ING:2, ESP:2, ER:1, INF:1 };

export default function ClassForm(){
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subs, setSubs] = useState<Subject[]>([]);

  // criar turma
  const [name,setName]=useState('');
  const [gradeYear,setGrade]=useState<number>(1);
  const [shift,setShift]=useState<Shift>('MATUTINO');

  // editar turma
  const [editing, setEditing] = useState<SchoolClass | null>(null);
  const [eName,setEName]=useState('');
  const [eGrade,setEGrade]=useState<number>(1);
  const [eShift,setEShift]=useState<Shift>('MATUTINO');

  // cargas por turma
  const [selected, setSelected] = useState<SchoolClass | null>(null);
  const [loads, setLoads] = useState<Record<string, number>>({}); // subjectCode -> hours

  async function loadAll(){
    const [cls, sj] = await Promise.all([get<SchoolClass[]>('/classes'), get<Subject[]>('/subjects')]);
    setClasses(cls); setSubs(sj);

    // se a turma selecionada ainda existir, recarrega cargas; senão, limpa seleção
    if (selected && cls.some(c => c.id === selected.id)) {
      const l = await get<LoadRow[]>(`/classes/${selected.id}/loads`);
      setLoads(Object.fromEntries(l.map(x => [x.subjectCode.toUpperCase(), Number(x.hoursPerWeek||0)])));
    } else {
      setSelected(null);
      setLoads({});
    }
  }
  useEffect(()=>{ loadAll(); },[]);

  useEffect(()=>{ (async()=>{
    if (!selected) return;
    const l = await get<LoadRow[]>(`/classes/${selected.id}/loads`);
    setLoads(Object.fromEntries(l.map(x => [x.subjectCode.toUpperCase(), Number(x.hoursPerWeek||0)])));
  })(); },[selected?.id]);

  async function addClass(){
    if (!name.trim()) return alert('Informe o nome da turma');
    await post<SchoolClass>('/classes', { name: name.trim(), gradeYear, shift });
    setName(''); setGrade(1); setShift('MATUTINO');
    await loadAll();
  }

  function openEdit(c: SchoolClass){
    setEditing(c);
    setEName(c.name);
    setEGrade(c.gradeYear);
    setEShift(c.shift);
  }
  async function saveEdit(){
    if (!editing) return;
    if (!eName.trim()) return alert('Informe o nome da turma');
    await put<SchoolClass>(`/classes/${editing.id}`, { name: eName.trim(), gradeYear: eGrade, shift: eShift });
    setEditing(null);
    await loadAll();
  }

  // excluir turma (com opção de hard delete)
  async function removeClass(c: SchoolClass){
    const sure = window.confirm(`Excluir a turma "${c.name}"?`);
    if (!sure) return;

    const hard = window.confirm(
      'Também deseja EXCLUIR as cargas semanais e os horários gerados desta turma?\n\nOK = excluir tudo\nCancelar = excluir apenas a turma'
    );

    if (selected?.id === c.id) setSelected(null);
    if (editing?.id === c.id) setEditing(null);

    await del<void>(`/classes/${c.id}${hard ? '?hard=true' : ''}`);
    await loadAll();
  }

  function updateLoad(code:string, v:number){
    setLoads(prev => ({ ...prev, [code]: Math.max(0, v|0) }));
  }

  async function saveLoads(){
    if (!selected) return;
    const arr: LoadRow[] = Object.entries(loads)
      .map(([subjectCode, hoursPerWeek]) => ({ subjectCode, hoursPerWeek }))
      .filter(x => x.hoursPerWeek > 0);
    await put(`/classes/${selected.id}/loads`, { loads: arr });
    const l = await get<LoadRow[]>(`/classes/${selected.id}/loads`);
    setLoads(Object.fromEntries(l.map(x => [x.subjectCode.toUpperCase(), Number(x.hoursPerWeek||0)])));
  }

  function suggest(){
    if (!selected) return;
    const tpl = selected.gradeYear >= 1 && selected.gradeYear <= 5 ? DEFAULT_1_5 : DEFAULT_6_9;
    const map: Record<string, number> = {};
    for (const s of subs) map[s.code.toUpperCase()] = tpl[s.code.toUpperCase()] ?? 0;
    setLoads(map);
  }

  const total = useMemo(()=>Object.values(loads).reduce((a,b)=>a+(Number(b)||0),0),[loads]);

  // preview de CT no editor (apenas visual; o backend recalcula oficialmente)
  const ctPreview = (gy:number) => [6,7,8,9].includes(Number(gy));

  return (
    <div className="card">
      <h3>Turmas</h3>

      {/* Criar turma */}
      <div className="row" style={{gap:8}}>
        <input placeholder="Nome" value={name} onChange={e=>setName(e.target.value)} />
        <input type="number" min={1} max={9} placeholder="Série (1–9)" value={gradeYear} onChange={e=>setGrade(Math.min(9, Math.max(1, Number(e.target.value)||1)))} />
        <select value={shift} onChange={e=>setShift(e.target.value as Shift)}>
          <option value="MATUTINO">Matutino</option>
          <option value="VESPERTINO">Vespertino</option>
        </select>
        <button className="primary" onClick={addClass}>Adicionar</button>
      </div>

      {/* Lista */}
      <table style={{marginTop:12, width:'100%'}}>
        <thead><tr><th>Turma</th><th>Série</th><th>Turno</th><th>CT</th><th>Ações</th></tr></thead>
        <tbody>
          {classes.map(c=>(
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.gradeYear}º</td>
              <td>{c.shift}</td>
              <td>{c.hasContraturno?'Sim':'Não'}</td>
              <td style={{display:'flex', gap:8}}>
                <button onClick={()=>openEdit(c)}>Editar</button>
                <button onClick={()=>setSelected(c)}>Editar cargas</button>
                {/* Excluir com o MESMO estilo dos outros botões */}
                <button onClick={()=>removeClass(c)} title="Excluir turma">Excluir</button>
              </td>
            </tr>
          ))}
          {classes.length===0 && <tr><td colSpan={5}>Nenhuma turma.</td></tr>}
        </tbody>
      </table>

      {/* Editor de turma */}
      {editing && (
        <div className="card" style={{marginTop:16}}>
          <h4>Editar turma</h4>
          <div className="row" style={{gap:8, flexWrap:'wrap'}}>
            <input placeholder="Nome" value={eName} onChange={e=>setEName(e.target.value)} />
            <input type="number" min={1} max={9} placeholder="Série (1–9)" value={eGrade} onChange={e=>setEGrade(Math.min(9, Math.max(1, Number(e.target.value)||1)))} />
            <select value={eShift} onChange={e=>setEShift(e.target.value as Shift)}>
              <option value="MATUTINO">Matutino</option>
              <option value="VESPERTINO">Vespertino</option>
            </select>
            <div style={{alignSelf:'center', color:'#94a3b8'}}>CT (automático): <b>{ctPreview(eGrade) ? 'Sim' : 'Não'}</b></div>
          </div>
          <div className="row" style={{gap:8, marginTop:10}}>
            <button className="primary" onClick={saveEdit}>Salvar</button>
            <button onClick={()=>setEditing(null)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Editor de cargas */}
      {selected && (
        <div className="card" style={{marginTop:16}}>
          <h4>Cargas semanais — {selected.name} ({selected.gradeYear}º — {selected.shift})</h4>
          <div className="row" style={{gap:8, flexWrap:'wrap'}}>
            <button onClick={suggest}>Sugerir cargas</button>
            <span><b>Total:</b> {total} aulas/semana</span>
          </div>
          <table style={{marginTop:10, width:'100%'}}>
            <thead><tr><th>Matéria</th><th>Código</th><th>Aulas/semana</th></tr></thead>
            <tbody>
              {subs.map(s=>{
                const code = s.code.toUpperCase();
                const v = loads[code] ?? 0;
                return (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{code}</td>
                    <td>
                      <input type="number" min={0} value={v} onChange={e=>updateLoad(code, Number(e.target.value)||0)} style={{width:90}} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="row" style={{gap:8, marginTop:10}}>
            <button className="primary" onClick={saveLoads}>Salvar cargas</button>
            <button onClick={()=>setSelected(null)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
