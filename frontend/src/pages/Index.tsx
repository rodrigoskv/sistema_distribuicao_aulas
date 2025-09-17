import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Moon, Sun, Users, BookOpen, Calendar, Settings, Upload, Download } from 'lucide-react';
import TeacherForm from '@/components/TeacherForm';
import ClassForm from '@/components/ClassForm';
import SubjectConfig from '@/components/SubjectConfig';
import ScheduleGenerator from '@/components/ScheduleGenerator';
import ScheduleViewer from '@/components/ScheduleViewer';
import ExportPanel from '@/components/ExportPanel';
import ImportData from '@/components/ImportData';
import { Teacher, Class, Subject } from '@/types';
import { Schedule } from '@/lib/schedulingAlgorithm';

export default function Index() {
  const [darkMode, setDarkMode] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | null>(null);
  const [activeTab, setActiveTab] = useState<'teachers' | 'classes' | 'subjects' | 'import' | 'export' | 'generate' | 'view'>('teachers');

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleImportTeachers = (importedTeachers: Teacher[]) => {
    setTeachers(prev => [...prev, ...importedTeachers]);
  };

  const handleImportClasses = (importedClasses: Class[]) => {
    setClasses(prev => [...prev, ...importedClasses]);
  };

  const handleImportSubjects = (importedSubjects: Subject[]) => {
    setSubjects(prev => [...prev, ...importedSubjects]);
  };

  const getSystemStatus = () => {
    const hasTeachers = teachers.length > 0;
    const hasClasses = classes.length > 0;
    const hasSubjects = subjects.length > 0;
    const hasSchedule = currentSchedule !== null;

    return {
      hasTeachers,
      hasClasses,
      hasSubjects,
      hasSchedule,
      isReady: hasTeachers && hasClasses && hasSubjects
    };
  };

  const status = getSystemStatus();

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Sistema de Distribuição de Horários Escolares
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Geração automática de horários com suporte a contra-turno
            </p>
          </div>
          <Button
            onClick={toggleDarkMode}
            variant="outline"
            size="icon"
            className="border-gray-300 dark:border-gray-600"
          >
            {darkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Status Dashboard */}
        <Card className="mb-8 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Settings className="w-5 h-5" />
              Status do Sistema
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Acompanhe o progresso da configuração do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Professores</div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{teachers.length}</span>
                    <Badge variant={status.hasTeachers ? 'default' : 'secondary'} className={
                      status.hasTeachers 
                        ? 'bg-green-500 dark:bg-green-600 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }>
                      {status.hasTeachers ? 'Configurado' : 'Pendente'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-green-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Turmas</div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{classes.length}</span>
                    <Badge variant={status.hasClasses ? 'default' : 'secondary'} className={
                      status.hasClasses 
                        ? 'bg-green-500 dark:bg-green-600 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }>
                      {status.hasClasses ? 'Configurado' : 'Pendente'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-purple-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Disciplinas</div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{subjects.length}</span>
                    <Badge variant={status.hasSubjects ? 'default' : 'secondary'} className={
                      status.hasSubjects 
                        ? 'bg-green-500 dark:bg-green-600 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }>
                      {status.hasSubjects ? 'Configurado' : 'Pendente'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Settings className="w-8 h-8 text-orange-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Horário</div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {status.hasSchedule ? 'Gerado' : 'Não gerado'}
                    </span>
                    <Badge variant={status.hasSchedule ? 'default' : 'secondary'} className={
                      status.hasSchedule 
                        ? 'bg-green-500 dark:bg-green-600 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }>
                      {status.hasSchedule ? 'Pronto' : 'Pendente'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {status.isReady && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-800 dark:text-green-200 text-sm">
                  ✅ Sistema configurado! Você pode gerar horários na aba "Gerar Horários".
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Tabs - Updated order: Professores → Turmas → Disciplinas → Importar → Exportar → Gerar → Visualizar */}
<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <TabsTrigger 
              value="teachers" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300"
            >
              <Users className="w-4 h-4" />
              Professores
            </TabsTrigger>
            <TabsTrigger 
              value="classes" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300"
            >
              <BookOpen className="w-4 h-4" />
              Turmas
            </TabsTrigger>
            <TabsTrigger 
              value="subjects" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300"
            >
              <Calendar className="w-4 h-4" />
              Disciplinas
            </TabsTrigger>
            <TabsTrigger 
              value="import" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300"
            >
              <Upload className="w-4 h-4" />
              Importar
            </TabsTrigger>
            <TabsTrigger 
              value="export" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300"
            >
              <Download className="w-4 h-4" />
              Exportar
            </TabsTrigger>
            <TabsTrigger 
              value="generate" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300"
            >
              <Settings className="w-4 h-4" />
              Gerar Horários
            </TabsTrigger>
            <TabsTrigger 
              value="view" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300"
            >
              <Calendar className="w-4 h-4" />
              Visualizar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="teachers">
            <TeacherForm 
              teachers={teachers} 
              setTeachers={setTeachers} 
              subjects={subjects}
            />
          </TabsContent>

          <TabsContent value="classes">
            <ClassForm 
              classes={classes} 
              setClasses={setClasses}
            />
          </TabsContent>

          <TabsContent value="subjects">
            <SubjectConfig 
              subjects={subjects} 
              setSubjects={setSubjects}
            />
          </TabsContent>

          <TabsContent value="import">
            <ImportData
              onImportTeachers={handleImportTeachers}
              onImportClasses={handleImportClasses}
              onImportSubjects={handleImportSubjects}
            />
          </TabsContent>

          <TabsContent value="export">
            <ExportPanel
              schedule={currentSchedule}
              teachers={teachers}
              classes={classes}
              subjects={subjects}
            />
          </TabsContent>

          <TabsContent value="generate">
            <ScheduleGenerator
              teachers={teachers}
              classes={classes}
              subjects={subjects}
              onScheduleGenerated={setCurrentSchedule}
              switchTab={setActiveTab}
            />
          </TabsContent>

          <TabsContent value="view">
            <ScheduleViewer
              schedule={currentSchedule}
              teachers={teachers}
              classes={classes}
              subjects={subjects}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}