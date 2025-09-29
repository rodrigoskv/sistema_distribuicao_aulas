import React, { useState } from 'react';
import SubjectConfig from '../components/SubjectConfig';
import TeacherForm from '../components/TeacherForm';
import ClassForm from '../components/ClassForm';
import ImportData from '../components/ImportData';
import ScheduleGenerator from '../components/ScheduleGenerator';
import ScheduleViewer from '../components/ScheduleViewer';
import ExportPanel from '../components/ExportPanel';
import '../styles.css';

type Tab = 'horario' | 'disciplinas' | 'professores' | 'turmas' | 'import' | 'export';

export default function App() {
  const [tab, setTab] = useState<Tab>('horario');

  return (
    <div className="container">
      <h1>Sistema de Distribuição de Horários</h1>

      <nav>
        <a className={tab === 'horario' ? 'active' : ''} href="#horario" onClick={() => setTab('horario')}>Horário</a>
        <a className={tab === 'disciplinas' ? 'active' : ''} href="#disciplinas" onClick={() => setTab('disciplinas')}>Disciplinas</a>
        <a className={tab === 'professores' ? 'active' : ''} href="#professores" onClick={() => setTab('professores')}>Professores</a>
        <a className={tab === 'turmas' ? 'active' : ''} href="#turmas" onClick={() => setTab('turmas')}>Turmas</a>
        <a className={tab === 'import' ? 'active' : ''} href="#import" onClick={() => setTab('import')}>Importar</a>
        <a className={tab === 'export' ? 'active' : ''} href="#export" onClick={() => setTab('export')}>Exportar</a>
      </nav>

      {tab === 'horario' && (
        <>
          <div style={{ maxWidth: 560 }}>
            <ScheduleGenerator />
          </div>

          <div style={{ marginTop: 16 }}>
            <ScheduleViewer />
          </div>
        </>
      )}

      {tab === 'disciplinas' && <SubjectConfig />}
      {tab === 'professores' && <TeacherForm />}
      {tab === 'turmas' && <ClassForm />}
      {tab === 'import' && <ImportData />}
      {tab === 'export' && <ExportPanel />}
    </div>
  );
}
