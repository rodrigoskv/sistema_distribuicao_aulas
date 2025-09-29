import React, { useEffect, useState } from 'react';
import { get, post, put, del } from '../lib/api';

function AvailabilityGrid({ t }: { t: any }) {
  const rows = [
    { name: 'Seg', m: !!t.monM, a: !!t.monA },
    { name: 'Ter', m: !!t.tueM, a: !!t.tueA },
    { name: 'Qua', m: !!t.wedM, a: !!t.wedA },
    { name: 'Qui', m: !!t.thuM, a: !!t.thuA },
    { name: 'Sex', m: !!t.friM, a: !!t.friA },
  ];
  const Dot = ({ on, title }: { on: boolean; title: string }) => (
    <div
      title={title}
      aria-label={title}
      style={{
        width: 14, height: 14, borderRadius: 4,
        background: on ? '#22c55e' : '#334155',
        border: '1px solid #475569',
      }}
    />
  );
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '48px 22px 22px', gap: 6, alignItems: 'center' }}>
      <div></div>
      <div title="Manhã" style={{ fontSize: 12, color: '#94a3b8' }}>M</div>
      <div title="Tarde" style={{ fontSize: 12, color: '#94a3b8' }}>T</div>
      {rows.map((r) => (
        <React.Fragment key={r.name}>
          <div style={{ fontSize: 12, color: '#cbd5e1' }}>{r.name}</div>
          <Dot on={r.m} title={`${r.name} • Manhã: ${r.m ? 'disponível' : 'indisponível'}`} />
          <Dot on={r.a} title={`${r.name} • Tarde: ${r.a ? 'disponível' : 'indisponível'}`} />
        </React.Fragment>
      ))}
    </div>
  );
}

// Legenda compacta
function AvailabilityLegend() {
  const Chip = ({ c, label }: { c: string; label: string }) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 6px',
      borderRadius: 999, background: '#0f172a', border: '1px solid #334155', fontSize: 12, color: '#94a3b8'
    }}>
      <span style={{ width: 12, height: 12, borderRadius: 4, background: c, border: '1px solid #475569' }} />
      {label}
    </span>
  );
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
      <Chip c="#22c55e" label="Disponível" />
      <Chip c="#334155" label="Indisponível" />
    </div>
  );
}

type Subject = { id:number; code:string; name:string };
type Shift = 'MATUTINO'|'VESPERTINO';
type SchoolClass = { id:number; name:string; gradeYear:number; shift:Shift; hasContraturno:boolean };

type Teacher = {
  id:number;
  name:string;
  email:string;
  subjectCodes:string;            // CSV no backend
  maxWeeklyLoad:number;
  allowedClassIds?: string | null;
  // novos campos de disponibilidade:
  monM:boolean; monA:boolean; tueM:boolean; tueA:boolean; wedM:boolean; wedA:boolean; thuM:boolean; thuA:boolean; friM:boolean; friA:boolean;
};

type AvState = { mon:{m:boolean,a:boolean}; tue:{m:boolean,a:boolean}; wed:{m:boolean,a:boolean}; thu:{m:boolean,a:boolean}; fri:{m:boolean,a:boolean} };
const emptyAv = ():AvState => ({ mon:{m:false,a:false}, tue:{m:false,a:false}, wed:{m:false,a:false}, thu:{m:false,a:false}, fri:{m:false,a:false} });

export default function TeacherForm(){
  const [subs, setSubs] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [editing, setEditing] = useState<Teacher | null>(null);

  const [name,setName]=useState('');
  const [email,setEmail]=useState('');
  const [selSubs,setSelSubs]=useState<string[]>([]);
  const [max,setMax]=useState<number>(0);
  const [allowed,setAllowed]=useState<number[]>([]);
  const [av,setAv]=useState<AvState>(emptyAv());

  async function load(){
    const [s, t, c] = await Promise.all([get<Subject[]>('/subjects'), get<Teacher[]>('/teachers'), get<SchoolClass[]>('/classes')]);
    setSubs(s); setTeachers(t); setClasses(c);
  }
  useEffect(()=>{ load(); },[]);

  function reset(){
    setEditing(null);
    setName(''); setEmail(''); setSelSubs([]); setMax(0); setAllowed([]); setAv(emptyAv());
  }
  function toggle(day:keyof AvState, part:'m'|'a'){
    setAv(prev => ({...prev, [day]: {...prev[day], [part]: !prev[day][part]}}));
  }

  async function submit(e: React.FormEvent){
    e.preventDefault();
    const payload:any = {
      name,
      email: email.trim(),
      subjectCodes: selSubs,
      maxWeeklyLoad: max,
      allowedClassIds: allowed,
      availability: {
        mon: { morning: av.mon.m, afternoon: av.mon.a },
        tue: { morning: av.tue.m, afternoon: av.tue.a },
        wed: { morning: av.wed.m, afternoon: av.wed.a },
        thu: { morning: av.thu.m, afternoon: av.thu.a },
        fri: { morning: av.fri.m, afternoon: av.fri.a },
      },
    };
    if (editing) await put<Teacher>(`/teachers/${editing.id}`, payload);
    else         await post<Teacher>('/teachers', payload);
    await load(); reset();
  }

  async function onDelete(t: Teacher){
    if (!confirm(`Excluir professor ${t.name}?`)) return;
    await del(`/teachers/${t.id}`);
    await load();
  }

  function onEdit(t: Teacher){
    setEditing(t);
    setName(t.name);
    setEmail(t.email || '');
    setSelSubs((t.subjectCodes || '').split(',').filter(Boolean));
    setMax(t.maxWeeklyLoad || 0);
    const ids = (t.allowedClassIds || '').split(',').map(s=>Number(s.trim())).filter(n=>Number.isFinite(n)&&n>0);
    setAllowed(ids);
    setAv({
      mon:{m:!!t.monM,a:!!t.monA},
      tue:{m:!!t.tueM,a:!!t.tueA},
      wed:{m:!!t.wedM,a:!!t.wedA},
      thu:{m:!!t.thuM,a:!!t.thuA},
      fri:{m:!!t.friM,a:!!t.friA},
    });
  }

  const DayRow = ({label, keyDay}:{label:string; keyDay:keyof AvState}) => (
    <div style={{display:'flex', gap:8, alignItems:'center'}}>
      <span style={{width:70}}>{label}</span>
      <label><input type="checkbox" checked={av[keyDay].m} onChange={()=>toggle(keyDay,'m')} /> Manhã</label>
      <label><input type="checkbox" checked={av[keyDay].a} onChange={()=>toggle(keyDay,'a')} /> Tarde</label>
    </div>
  );

  return (
    <div className="card">
      <h3>Professores</h3>
      <form className="row" style={{gap:12, alignItems:'flex-start'}} onSubmit={submit}>
        <div style={{display:'grid', gap:8, minWidth:260}}>
          <input placeholder="Nome" value={name} onChange={e=>setName(e.target.value)} />
          <input placeholder="Email (opcional)" value={email} onChange={e=>setEmail(e.target.value)} />
          <select multiple value={selSubs} onChange={e=>setSelSubs(Array.from(e.target.selectedOptions).map(o=>o.value))} style={{minWidth:240, minHeight:120}}>
            {subs.map((s)=><option key={s.id} value={s.code}>{s.code} - {s.name}</option>)}
          </select>
          {/* Máx com tooltip didático */}
          <input
            type="number"
            min={0}
            placeholder="Máx (aulas/semana)"
            title="Quantidade máxima de aulas (períodos) que este professor pode assumir na semana inteira, somando todas as turmas."
            value={max}
            onChange={e=>setMax(Number(e.target.value)||0)}
          />
        </div>

        <div style={{display:'grid', gap:6}}>
          <b>Disponibilidade</b>
          <DayRow label="Segunda" keyDay="mon" />
          <DayRow label="Terça"   keyDay="tue" />
          <DayRow label="Quarta"  keyDay="wed" />
          <DayRow label="Quinta"  keyDay="thu" />
          <DayRow label="Sexta"   keyDay="fri" />
        </div>

        <div style={{display:'grid', gap:8}}>
          <b>Turmas permitidas</b>
          <select multiple value={allowed.map(String)} onChange={e=>setAllowed(Array.from(e.target.selectedOptions).map(o=>Number(o.value)))} style={{minWidth:260, minHeight:120}}>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.shift} — {c.gradeYear}º</option>)}
          </select>
          <div style={{display:'flex', gap:8}}>
            <button className="primary" type="submit">{editing ? 'Salvar' : 'Adicionar'}</button>
            {editing && <button type="button" onClick={reset}>Cancelar</button>}
          </div>
        </div>
      </form>

      <table style={{marginTop:12, width:'100%'}}>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Disciplinas</th>
            <th title="Máximo de aulas (períodos) por semana">Máx (sem.)</th>
            <th>Disponibilidade</th>
            <th>Turmas</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map(t=>{
            const ids = (t.allowedClassIds || '').split(',').filter(Boolean);
            const names = ids.map(id => classes.find(c => String(c.id)===id)?.name).filter(Boolean).join(', ');
            return (
              <tr key={t.id}>
                <td>{t.name}</td>
                <td>{t.email || '—'}</td>
                <td>{t.subjectCodes || '—'}</td>
                <td align="center" title={`${t.maxWeeklyLoad ?? 0} aulas/semana`}>
                  {t.maxWeeklyLoad ?? 0}
                </td>
                <td><AvailabilityGrid t={t} /></td>
                <td>{names || 'todas'}</td>
                <td align="right">
                  <button onClick={()=>onEdit(t)}>Editar</button>{' '}
                  <button onClick={()=>onDelete(t)}>Excluir</button>
                </td>
              </tr>
            );
          })}
          {teachers.length===0 && <tr><td colSpan={7}>Nenhum professor.</td></tr>}
        </tbody>
      </table>

      {/* legenda mostrada uma vez, abaixo da tabela */}
      <AvailabilityLegend />
    </div>
  );
}
