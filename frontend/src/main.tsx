import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';

// tema GA
import './ui/ga-theme.css';

// shell (sidebar + header)
import { AppShell } from './layout/AppShell';

// suas páginas/peças existentes
import SubjectConfig from './components/SubjectConfig';
import TeacherForm from './components/TeacherForm';
import ClassForm from './components/ClassForm';
import ScheduleGenerator from './components/ScheduleGenerator';
import ScheduleViewer from './components/ScheduleViewer';
import ImportData from './components/ImportData';
import ExportPanel from './components/ExportPanel';

import { get } from './lib/api';

type Route = 'dashboard'|'subjects'|'teachers'|'classes'|'schedule'|'export'|'import';

function App(){
  const [route, setRoute] = useState<Route>('dashboard');

  // cards do dashboard (contagens)
  const [stats, setStats] = useState<{subjects:number; teachers:number; classes:number}>({subjects:0, teachers:0, classes:0});
  useEffect(() => {
    (async()=>{
      try{
        const [subs, tchs, cls] = await Promise.all([
          get<any[]>('/subjects'), get<any[]>('/teachers'), get<any[]>('/classes')
        ]);
        setStats({subjects: subs.length||0, teachers: tchs.length||0, classes: cls.length||0});
      }catch{/* silencioso */}
    })();
  }, []);

  return (
    <AppShell active={route} onNavigate={(k)=>setRoute(k as Route)}>
      {route === 'dashboard' && <Dashboard stats={stats} onGo={(k)=>setRoute(k as Route)} />}

      {route === 'subjects'  && (
        <div className="ga-card">
          <h3>Disciplinas</h3>
          <SubjectConfig/>
        </div>
      )}

      {route === 'teachers'  && (
        <div className="ga-card">
          <h3>Professores</h3>
          <TeacherForm/>
        </div>
      )}

      {route === 'classes'   && (
        <div className="ga-card">
          <h3>Turmas</h3>
          <ClassForm/>
        </div>
      )}

{route === 'schedule'  && (
  <div className="ga-grid cols-3">
    <div className="ga-card" style={{gridColumn:'span 2'}}>
      <h3>Gerar horários</h3>
      <ScheduleGenerator onDone={() => {
        // opcional: ficar na mesma rota ou atualizar algo
        // aqui você pode, por exemplo, forçar recarregar o Viewer:
        // setRefreshKey(k => k + 1);
      }} />
    </div>
    <div className="ga-card">
      <h3>Visualizar</h3>
      <ScheduleViewer />
    </div>
  </div>
)}


      {route === 'export'    && (
        <div className="ga-card">
          <h3>Exportar</h3>
          <ExportPanel/>
        </div>
      )}

      {route === 'import'    && (
        <div className="ga-card">
          <h3>Importar</h3>
          <ImportData/>
        </div>
      )}
    </AppShell>
  );
}

/* ======= Dashboard com atalhos ======= */
function Dashboard({stats, onGo}:{stats:{subjects:number; teachers:number; classes:number}, onGo:(k:Route)=>void}){
  return (
    <div className="ga-grid cols-3">
      <div className="ga-card">
        <div className="ga-badge">📚 Disciplinas</div>
        <h3 style={{marginTop:8}}>{stats.subjects}</h3>
        <div style={{color:'var(--ga-text-muted)', marginBottom:12}}>cadastradas</div>
        <button className="ga-btn-primary" onClick={()=>onGo('subjects')}>Gerenciar</button>
      </div>
      <div className="ga-card">
        <div className="ga-badge">👩‍🏫 Professores</div>
        <h3 style={{marginTop:8}}>{stats.teachers}</h3>
        <div style={{color:'var(--ga-text-muted)', marginBottom:12}}>cadastrados</div>
        <button className="ga-btn-primary" onClick={()=>onGo('teachers')}>Gerenciar</button>
      </div>
      <div className="ga-card">
        <div className="ga-badge">👥 Turmas</div>
        <h3 style={{marginTop:8}}>{stats.classes}</h3>
        <div style={{color:'var(--ga-text-muted)', marginBottom:12}}>cadastradas</div>
        <button className="ga-btn-primary" onClick={()=>onGo('classes')}>Gerenciar</button>
      </div>
    </div>
  );
}

/* ======= Render ======= */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
