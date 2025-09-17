import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Settings, Play, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { schedulingEngine, Schedule } from '@/lib/schedulingAlgorithm';
import { Teacher, Class, Subject } from '@/types';

interface ScheduleGeneratorProps {
  teachers: Teacher[];
  classes: Class[];
  subjects: Subject[];
  switchTab?: (tab: string) => void;
  onScheduleGenerated: (schedule: Schedule | null) => void;
}

export default function ScheduleGenerator({ 
  teachers, 
  classes, 
  subjects, 
  onScheduleGenerated 
, switchTab}: ScheduleGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentGeneration, setCurrentGeneration] = useState(0);
  const [bestFitness, setBestFitness] = useState(0);
  const [generatedSchedule, setGeneratedSchedule] = useState<Schedule | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateInputs = (): string[] => {
    const errors: string[] = [];
    
    if (teachers.length === 0) {
      errors.push('Nenhum professor cadastrado');
    }
    
    if (classes.length === 0) {
      errors.push('Nenhuma turma cadastrada');
    }
    
    if (subjects.length === 0) {
      errors.push('Nenhuma disciplina configurada');
    }
    
    // Check if there are teachers for all subjects
    const subjectIds = subjects.map(s => s.id);
    const teacherSubjects = new Set(teachers.flatMap(t => t.subjects));
    
    for (const subject of subjects) {
      if (!teacherSubjects.has(subject.id)) {
        errors.push(`Nenhum professor cadastrado para ${subject.name}`);
      }
    }
    
    // Check if regent teachers exist for 1st-5th grade classes
    const earlyGradeClasses = classes.filter(c => c.grade <= 5);
    const regentTeachers = teachers.filter(t => t.isRegent);
    
    if (earlyGradeClasses.length > 0 && regentTeachers.length === 0) {
      errors.push('Turmas do 1º ao 5º ano requerem pelo menos um professor regente');
    }
    
    // Check period compatibility
    const morningClasses = classes.filter(c => c.period === 'morning');
    const afternoonClasses = classes.filter(c => c.period === 'afternoon');
    
    if (morningClasses.length > 0 || afternoonClasses.length > 0) {
      // Check if teachers have availability for required periods
      let hasAvailableTeachers = false;
      for (const teacher of teachers) {
        const availability = teacher.availability;
        if (availability && Object.keys(availability).length > 0) {
          hasAvailableTeachers = true;
          break;
        }
      }
      
      if (!hasAvailableTeachers) {
        errors.push('Configure a disponibilidade de horários dos professores');
      }
    }
    
    return errors;
  };

  const handleGenerate = async () => {
    const errors = validateInputs();
    setValidationErrors(errors);
    
    if (errors.length > 0) {
      return;
    }
    
    setIsGenerating(true);
    setProgress(0);
    setCurrentGeneration(0);
    setBestFitness(0);
    setGeneratedSchedule(null);
    
    try {
      const schedule = await schedulingEngine.generateSchedule(
        teachers,
        classes,
        subjects,
        (generation: number, fitness: number) => {
          setCurrentGeneration(generation);
          setBestFitness(fitness);
          setProgress(Math.min(100, (generation / 500) * 100));
        }
      );
      
      setGeneratedSchedule(schedule);
      try { localStorage.setItem('generatedSchedule', JSON.stringify(schedule)); } catch {}
      onScheduleGenerated(schedule);
      setProgress(100);
      if (switchTab) switchTab('view');
    } catch (error) {
      console.error('Error generating schedule:', error);
      setValidationErrors(['Erro interno durante a geração do horário']);
    } finally {
      setIsGenerating(false);
    }
  };

  const getQualityBadge = (schedule: Schedule) => {
    if (schedule.hardViolations === 0 && schedule.softViolations < 10) {
      return <Badge className="bg-green-500 dark:bg-green-600">Excelente</Badge>;
    } else if (schedule.hardViolations === 0 && schedule.softViolations < 50) {
      return <Badge className="bg-blue-500 dark:bg-blue-600">Bom</Badge>;
    } else if (schedule.hardViolations < 5) {
      return <Badge className="bg-yellow-500 dark:bg-yellow-600">Aceitável</Badge>;
    } else {
      return <Badge className="bg-red-500 dark:bg-red-600">Precisa Ajustes</Badge>;
    }
  };

  const calculateStats = () => {
    const totalAssignments = classes.reduce((total, classItem) => {
      return total + subjects.reduce((classTotal, subject) => {
        return classTotal + (subject.weeklyHours[classItem.grade] || 0);
      }, 0);
    }, 0);
    
    const teacherWorkload = teachers.reduce((total, teacher) => total + teacher.maxWeeklyHours, 0);
    
    return {
      totalAssignments,
      teacherWorkload,
      avgWorkloadPerTeacher: teachers.length > 0 ? Math.round(teacherWorkload / teachers.length) : 0
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Settings className="w-5 h-5" />
            Gerador de Horários Escolares
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Configure e gere automaticamente os horários das turmas usando algoritmo genético
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {validationErrors.length > 0 && (
            <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                <div className="space-y-1">
                  <p className="font-medium">Corrija os seguintes problemas:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{teachers.length}</div>
              <div className="text-sm text-blue-800 dark:text-blue-300">Professores</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{classes.length}</div>
              <div className="text-sm text-green-800 dark:text-green-300">Turmas</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalAssignments}</div>
              <div className="text-sm text-purple-800 dark:text-purple-300">Aulas/Semana</div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white">Estatísticas do Sistema</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Total de aulas semanais:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{stats.totalAssignments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Carga horária total dos professores:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{stats.teacherWorkload}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Média por professor:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{stats.avgWorkloadPerTeacher}h</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Turmas matutinas:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{classes.filter(c => c.period === 'morning').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Turmas vespertinas:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{classes.filter(c => c.period === 'afternoon').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Professores regentes:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{teachers.filter(t => t.isRegent).length}</span>
                </div>
              </div>
            </div>
          </div>

          {isGenerating && (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Gerando horários... Geração {currentGeneration}/500</span>
              </div>
              <Progress value={progress} className="w-full" />
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Melhor fitness atual: {bestFitness.toFixed(0)}/10000
              </div>
            </div>
          )}

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || validationErrors.length > 0}
            className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Gerando Horários...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Gerar Horários Automaticamente
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedSchedule && (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
              Horário Gerado com Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-gray-700 dark:text-gray-300">Qualidade:</span>
              {getQualityBadge(generatedSchedule)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Total de aulas:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{generatedSchedule.assignments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Fitness score:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{generatedSchedule.fitness.toFixed(0)}/10000</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Violações críticas:</span>
                  <span className={`font-medium ${generatedSchedule.hardViolations === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {generatedSchedule.hardViolations}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Violações leves:</span>
                  <span className="font-medium text-yellow-600 dark:text-yellow-400">{generatedSchedule.softViolations}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Gerado em:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {generatedSchedule.generatedAt.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            {generatedSchedule.hardViolations > 0 && (
              <Alert className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
                <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <AlertDescription className="text-orange-800 dark:text-orange-200">
                  <p className="font-medium">Atenção: O horário gerado possui {generatedSchedule.hardViolations} violação(ões) crítica(s).</p>
                  <p className="text-sm mt-1">
                    Isso pode indicar conflitos de professor, turma ou sala. Revise o horário na aba "Visualizar" 
                    e faça ajustes manuais se necessário.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={() => switchTab && switchTab('view')}
                className="flex-1 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
              >
                Visualizar Horário
              </Button>
              <Button 
                onClick={() => switchTab && switchTab('export')}
                variant="outline"
                className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Exportar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}