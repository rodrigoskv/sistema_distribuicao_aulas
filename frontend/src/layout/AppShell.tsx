import React from 'react';
import brandUrl from '../ui/brand.svg';


type Item = { key: string; label: string; icon: React.ReactNode };

export function AppShell({
  active,
  onNavigate,
  children,
}: {
  active: string;
  onNavigate: (key: string) => void;
  children: React.ReactNode;
}) {
  const items: Item[] = [
    { key: 'dashboard', label: 'Dashboard', icon: iconChart() },
    { key: 'classes',   label: 'Turmas',    icon: iconUsers() },
    { key: 'subjects',  label: 'Disciplinas', icon: iconBook() },
    { key: 'teachers',  label: 'Professores', icon: iconTeacher() },
    { key: 'schedule',  label: 'Horários',  icon: iconClock() },
    { key: 'export',    label: 'Exportar',  icon: iconUpload() },
    { key: 'import',    label: 'Importar',  icon: iconDownload() },
  ];

  return (
    <div className="ga-shell">
      <aside className="ga-sidebar">
        <div className="ga-logo">{logo()} <span>Timely</span></div>
        <nav className="ga-nav">
          {items.map(it => (
            <a key={it.key}
               className={active === it.key ? 'active' : ''}
               onClick={e => {e.preventDefault(); onNavigate(it.key)}}
               href="#">
              {it.icon}<span>{it.label}</span>
            </a>
          ))}
        </nav>
      </aside>

      <main className="ga-main">
        <header className="ga-header">
          <div className="ga-header-inner" style={{justifyContent:'space-between'}}>
            <div className="ga-header-title">{items.find(i=>i.key===active)?.label}</div>
            {/* Sem barra de pesquisa; canto direito com a logo */}
            <img src={brandUrl} className="ga-brand" alt="Logo" />
          </div>
        </header>

        <div className="ga-content">{children}</div>
      </main>
    </div>
  );
}


function logo(){return (
  <svg viewBox="0 0 24 24" fill="none"><path d="M4 18V6m6 12V10m6 8V4m6 14V8" stroke="#1a73e8" strokeWidth="2" strokeLinecap="round"/></svg>
)}
function iconChart(){return <svg viewBox="0 0 24 24" fill="none"><path d="M3 3v18h18" stroke="currentColor" strokeWidth="2"/><path d="M7 15l3-3 3 4 4-6" stroke="currentColor" strokeWidth="2"/></svg>}
function iconUsers(){return <svg viewBox="0 0 24 24" fill="none"><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="2"/><path d="M2 20c0-3 3-5 6-5" stroke="currentColor" strokeWidth="2"/><circle cx="17" cy="11" r="3" stroke="currentColor" strokeWidth="2"/><path d="M13 20c0-2.5 2.5-4 5-4" stroke="currentColor" strokeWidth="2"/></svg>}
function iconBook(){return <svg viewBox="0 0 24 24" fill="none"><path d="M5 4h12a2 2 0 012 2v14H7a2 2 0 01-2-2V4z" stroke="currentColor" strokeWidth="2"/><path d="M7 18h12" stroke="currentColor" strokeWidth="2"/></svg>}
function iconClock(){return <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="2"/></svg>}
function iconUpload(){return <svg viewBox="0 0 24 24" fill="none"><path d="M12 3v12m0 0l-4-4m4 4l4-4" stroke="currentColor" strokeWidth="2"/><path d="M5 21h14" stroke="currentColor" strokeWidth="2"/></svg>}
function iconDownload(){return <svg viewBox="0 0 24 24" fill="none"><path d="M12 21V9m0 0l4 4m-4-4l-4 4" stroke="currentColor" strokeWidth="2"/><path d="M5 3h14" stroke="currentColor" strokeWidth="2"/></svg>}
function iconTeacher(){return (<svg viewBox="0 0 24 24" fill="none">   {/* lousa */}   <rect x="3" y="4" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="2"/>   {/* ponteiro / braço indicando a lousa */}     <path d="M14 9l4-1" stroke="currentColor" strokeWidth="2"/>    {/* cabeça do professor */}     <circle cx="18" cy="13" r="2" stroke="currentColor" strokeWidth="2"/>     {/* tronco/ombros do professor */}    <path d="M16 19c0-2 1.5-3 3-3s3 1 3 3" stroke="currentColor" strokeWidth="2"/>     {/* base da lousa (suporte) */}     <path d="M6 20h6M9 12v5" stroke="currentColor" strokeWidth="2"/>   </svg>
 );
}