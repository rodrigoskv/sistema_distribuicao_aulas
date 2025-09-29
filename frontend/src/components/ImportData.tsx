import React, { useState } from 'react';
import { postFile, getBlob } from '../lib/api';

const ENTITIES = [
  { key:'subjects', label:'Disciplinas' },
  { key:'teachers', label:'Professores' },
  { key:'classes',  label:'Turmas' },
  { key:'loads',    label:'Cargas semanais (turma x disciplina)' },
] as const;

type Report = { ok:boolean; entity:string; inserted:number; updated:number; errors:Array<{row:number; error:string}>; error?:string };

export default function ImportData(){
  const [entity, setEntity] = useState<typeof ENTITIES[number]['key']>('subjects');
  const [file, setFile] = useState<File|null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report|null>(null);

  async function submit(){
    if (!file) return;
    setLoading(true); setReport(null);
    try{ setReport(await postFile<Report>(`/import/${entity}`, file)); }
    catch(e:any){ setReport({ ok:false, entity, inserted:0, updated:0, errors:[], error: e?.message||String(e) }); }
    finally{ setLoading(false); }
  }

  async function downloadTemplate(){
    const blob = await getBlob(`/templates/${entity}`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=`${entity}-template.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="card">
      <h3>Importar Dados (CSV/XLSX)</h3>
      <div className="row" style={{alignItems:'center'}}>
        <select value={entity} onChange={e=>setEntity(e.target.value as any)}>
          {ENTITIES.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
        </select>
        <input type="file" accept=".csv,.xlsx" onChange={e=>setFile(e.target.files?.[0]??null)} />
        <button className="primary" disabled={!file || loading} onClick={submit}>
          {loading ? 'Importando...' : 'Importar'}
        </button>
        <button className="secondary" onClick={downloadTemplate}>
          Baixar template
        </button>
      </div>

      {report && (
        <div style={{marginTop:12}}>
          <div className="ga-badge">Inseridos: <b>{report.inserted}</b></div>{' '}
          <div className="ga-badge">Atualizados: <b>{report.updated}</b></div>{' '}
          <div className="ga-badge">Erros: <b>{report.errors?.length ?? 0}</b></div>
          {report.error && <div style={{color:'#ff8a8a', marginTop:8}}>Erro: {report.error}</div>}

          {report.errors?.length > 0 && (
            <table className="ga-table" style={{marginTop:12}}>
              <thead><tr><th>Linha</th><th>Problema</th></tr></thead>
              <tbody>{report.errors.map((e,idx)=>(<tr key={idx}><td>{e.row}</td><td>{e.error}</td></tr>))}</tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
