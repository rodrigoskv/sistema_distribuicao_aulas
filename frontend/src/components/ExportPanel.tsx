import React, { useState } from 'react';
import { getBlob } from '../lib/api';

const ENTITIES = [
  { key:'subjects', label:'Disciplinas' },
  { key:'teachers', label:'Professores' },
  { key:'classes',  label:'Turmas' },
  { key:'loads',    label:'Cargas semanais (turma x disciplina)' },
] as const;

export default function ExportPanel(){
  const [entity, setEntity] = useState<typeof ENTITIES[number]['key']>('subjects');
  const [downloading, setDownloading] = useState(false);

  async function download(path:string, filename:string){
    setDownloading(true);
    try{
      const blob = await getBlob(path);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download=filename; a.click();
      URL.revokeObjectURL(url);
    } finally { setDownloading(false); }
  }

  return (
    <div className="card">
      <h3>Exportar dados</h3>
      <div className="row" style={{alignItems:'center'}}>
        <select value={entity} onChange={e=>setEntity(e.target.value as any)}>
          {ENTITIES.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
        </select>
        <button className="primary" disabled={downloading}
          onClick={()=>download(`/export/${entity}`, `${entity}.csv`)}>
          {downloading ? 'Gerando...' : 'Exportar CSV'}
        </button>
        <button className="secondary" disabled={downloading}
          onClick={()=>download(`/templates/${entity}`, `${entity}-template.csv`)}>
          Baixar template
        </button>
      </div>
      <p style={{color:'#a3acb8', marginTop:8}}>
        CSV com separador “;”. Também disponível para importação.
      </p>
    </div>
  );
}
