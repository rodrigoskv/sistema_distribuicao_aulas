import React, { useEffect, useState } from 'react';
import { get, post, put, del } from '../lib/api';

type Subject = { id:number; code:string; name:string; active:boolean };

export default function SubjectConfig(){
  const [subs, setSubs] = useState<Subject[]>([]);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [code,setCode]=useState(''); 
  const [name,setName]=useState(''); 
  const [active,setActive]=useState(true);

  async function load(){ setSubs(await get<Subject[]>('/subjects')); }
  useEffect(()=>{ load(); },[]);

  function reset(){ setEditing(null); setCode(''); setName(''); setActive(true); }

  async function submit(e: React.FormEvent){
    e.preventDefault();
    const payload = { code, name, active };
    if (editing) await put<Subject>(`/subjects/${editing.id}`, payload);
    else         await post<Subject>('/subjects', payload);
    await load(); reset();
  }

  async function onDelete(s: Subject){
    if (!confirm(`Excluir ${s.code}?`)) return;
    await del(`/subjects/${s.id}`);
    await load();
  }
  function onEdit(s: Subject){ setEditing(s); setCode(s.code); setName(s.name); setActive(!!s.active); }

  return (
    <div className="card">
      <h3>Disciplinas</h3>
      <form className="row" style={{gap:8}} onSubmit={submit}>
        <input placeholder="Código" value={code} onChange={e=>setCode(e.target.value)} />
        <input placeholder="Nome" value={name} onChange={e=>setName(e.target.value)} />
        <label style={{display:'inline-flex',alignItems:'center',gap:6}}>
          <input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)} />
          Ativa
        </label>
        <button className="primary" type="submit">{editing ? 'Salvar' : 'Adicionar'}</button>
        {editing && <button type="button" onClick={reset}>Cancelar</button>}
      </form>

      <table style={{marginTop:12, width:'100%'}}>
        <thead><tr><th>Código</th><th>Nome</th><th>Ativa</th><th>Ações</th></tr></thead>
        <tbody>
          {subs.map(s=>(
            <tr key={s.id}>
              <td>{s.code}</td><td>{s.name}</td>
              <td align="center">{s.active ? 'Sim' : 'Não'}</td>
              <td align="right">
                <button onClick={()=>onEdit(s)}>Editar</button>{' '}
                <button onClick={()=>onDelete(s)}>Excluir</button>
              </td>
            </tr>
          ))}
          {subs.length===0 && <tr><td colSpan={4}>Nenhuma disciplina.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
