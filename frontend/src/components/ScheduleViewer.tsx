import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, User, BookOpen, AlertTriangle, Clock } from 'lucide-react';
import { Schedule } from '@/lib/schedulingAlgorithm';
import { Teacher, Class, Subject } from '@/types';

interface ScheduleViewerProps {
  schedule: Schedule | null;     
  teachers: Teacher[];
  classes: Class[];
  subjects: Subject[];
}


export default function ScheduleViewer({ schedule, teachers, classes, subjects }: ScheduleViewerProps) {
  const [localSchedule, setLocalSchedule] = useState<Schedule | null>(schedule);

  React.useEffect(() => {
    if (!schedule) {
      try {
        const raw = localStorage.getItem('generatedSchedule');
        if (raw) setLocalSchedule(JSON.parse(raw));
      } catch {}
    } else {
      setLocalSchedule(schedule);
    }
  }, [schedule]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [viewMode, setViewMode] = useState<'class' | 'teacher'>('class');

  if (!localSchedule) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Calendar className="w-5 h-5" />
            Visualização de Horários
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Nenhum horário foi gerado ainda. Vá para a aba "Gerar Horários" para criar um novo horário.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Updated time slots with specific school hours
  const timeSlots = {
    morning: [
      { id: 'reading_morning', label: 'Leitura', time: '07:45-08:04', isReading: true },
      { id: 'slot1_morning', label: '1ª aula', time: '08:04-08:44', isReading: false },
      { id: 'slot2_morning', label: '2ª aula', time: '08:44-09:26', isReading: false },
      { id: 'slot3_morning', label: '3ª aula', time: '09:26-10:07', isReading: false },
      { id: 'slot4_morning', label: '4ª aula', time: '10:23-11:04', isReading: false },
      { id: 'slot5_morning', label: '5ª aula', time: '11:04-11:45', isReading: false }
    ],
    afternoon: [
      { id: 'slot1_afternoon', label: '1ª aula', time: '13:15-13:56', isReading: false },
      { id: 'slot2_afternoon', label: '2ª aula', time: '13:56-14:37', isReading: false },
      { id: 'slot3_afternoon', label: '3ª aula', time: '14:37-15:18', isReading: false },
      { id: 'reading_afternoon', label: 'Leitura', time: '15:35-15:55', isReading: true },
      { id: 'slot4_afternoon', label: '4ª aula', time: '15:55-16:35', isReading: false },
      { id: 'slot5_afternoon', label: '5ª aula', time: '16:35-17:15', isReading: false }
    ]
  };

  const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
  const dayOptions = [
    { value: 0, label: 'Segunda-feira' },
    { value: 1, label: 'Terça-feira' },
    { value: 2, label: 'Quarta-feira' },
    { value: 3, label: 'Quinta-feira' },
    { value: 4, label: 'Sexta-feira' }
  ];

  const getAssignmentForSlot = (classId: number | null, teacherId: number | null, day: number, slotId: string) => {
    const timeSlotId = `${slotId}_day${day}`;
    
    return localSchedule.assignments.find(assignment => {
      if (classId !== null) {
        return assignment.classId === classId && assignment.timeSlotId === timeSlotId;
      } else if (teacherId !== null) {
        return assignment.teacherId === teacherId && assignment.timeSlotId === timeSlotId;
      }
      return false;
    });
  };

  const getSubjectInfo = (subjectId: number) => {
    return subjects.find(s => s.id === subjectId);
  };

  const getTeacherInfo = (teacherId: number) => {
    return teachers.find(t => t.id === teacherId);
  };

  const getClassInfo = (classId: number) => {
    return classes.find(c => c.id === classId);
  };

  const renderClassSchedule = (classId: number) => {
    const classInfo = getClassInfo(classId);
    if (!classInfo) return null;

    const regularSlots = timeSlots[classInfo.period];
    const contraTurnoSlots = classInfo.grade >= 6 && classInfo.contraTurnoDay !== undefined 
      ? timeSlots[classInfo.period === 'morning' ? 'afternoon' : 'morning']
      : [];

    return (
      <div className="space-y-6">
        {/* Regular Schedule */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Horário Regular - {classInfo.period === 'morning' ? '🌅 Matutino' : '🌇 Vespertino'}
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-6 gap-2 mb-4">
                <div className="font-medium text-center text-gray-900 dark:text-white">Horário</div>
                {days.map(day => (
                  <div key={day} className="font-medium text-center text-gray-900 dark:text-white">{day}</div>
                ))}
              </div>
              
              {regularSlots.map(slot => (
                <div key={slot.id} className="grid grid-cols-6 gap-2 mb-2">
                  <div className="text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                    <div className="font-medium text-gray-900 dark:text-white">{slot.label}</div>
                    <div className="text-gray-500 dark:text-gray-400">{slot.time}</div>
                    {slot.id === 'slot3_morning' && (
                      <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">Recreio: 10:07-10:23</div>
                    )}
                    {slot.id === 'slot3_afternoon' && (
                      <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">Recreio: 15:18-15:35</div>
                    )}
                  </div>
                  {days.map((_, dayIndex) => {
                    const assignment = getAssignmentForSlot(classId, null, dayIndex, slot.id);
                    const subject = assignment ? getSubjectInfo(assignment.subjectId) : null;
                    const teacher = assignment ? getTeacherInfo(assignment.teacherId) : null;
                    
                    return (
                      <div key={dayIndex} className="p-2 border border-gray-200 dark:border-gray-600 rounded min-h-[60px] bg-white dark:bg-gray-800">
                        {assignment && subject && teacher && !assignment.isContraTurno ? (
                          <div className="space-y-1">
                            <div className="font-medium text-sm text-gray-900 dark:text-white">{subject.name}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-300">{teacher.name}</div>
                            {assignment.roomType !== 'regular' && (
                              <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                                {assignment.roomType === 'lab' && 'Lab'}
                                {assignment.roomType === 'gym' && 'Quadra'}
                                {assignment.roomType === 'arts' && 'Artes'}
                              </Badge>
                            )}
                          </div>
                        ) : slot.isReading ? (
                          <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                            📚 Leitura
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 dark:text-gray-500">-</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contra-turno Schedule */}
        {classInfo.grade >= 6 && classInfo.contraTurnoDay !== undefined && contraTurnoSlots.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Contra-turno - {dayOptions[classInfo.contraTurnoDay].label} - {classInfo.period === 'morning' ? '🌇 Vespertino' : '🌅 Matutino'}
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <div className="min-w-[200px]">
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="font-medium text-center text-gray-900 dark:text-white">Horário</div>
                  <div className="font-medium text-center text-gray-900 dark:text-white">{dayOptions[classInfo.contraTurnoDay].label}</div>
                </div>
                
                {contraTurnoSlots.map(slot => {
                  const assignment = getAssignmentForSlot(classId, null, classInfo.contraTurnoDay!, slot.id);
                  const subject = assignment ? getSubjectInfo(assignment.subjectId) : null;
                  const teacher = assignment ? getTeacherInfo(assignment.teacherId) : null;
                  
                  return (
                    <div key={slot.id} className="grid grid-cols-2 gap-2 mb-2">
                      <div className="text-sm p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
                        <div className="font-medium text-gray-900 dark:text-white">{slot.label}</div>
                        <div className="text-gray-500 dark:text-gray-400">{slot.time}</div>
                      </div>
                      <div className="p-2 border border-gray-200 dark:border-gray-600 rounded min-h-[60px] bg-white dark:bg-gray-800">
                        {assignment && subject && teacher && assignment.isContraTurno ? (
                          <div className="space-y-1">
                            <div className="font-medium text-sm text-gray-900 dark:text-white">{subject.name}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-300">{teacher.name}</div>
                            <Badge className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                              Contra-turno
                            </Badge>
                          </div>
                        ) : slot.isReading ? (
                          <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                            📚 Leitura
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 dark:text-gray-500">-</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTeacherSchedule = (teacherId: number) => {
    const teacherInfo = getTeacherInfo(teacherId);
    if (!teacherInfo) return null;

    const allTimeSlots = [...timeSlots.morning, ...timeSlots.afternoon];

    return (
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-6 gap-2 mb-4">
            <div className="font-medium text-center text-gray-900 dark:text-white">Horário</div>
            {days.map(day => (
              <div key={day} className="font-medium text-center text-gray-900 dark:text-white">{day}</div>
            ))}
          </div>
          
          {allTimeSlots.map(slot => (
            <div key={slot.id} className="grid grid-cols-6 gap-2 mb-2">
              <div className="text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                <div className="font-medium text-gray-900 dark:text-white">{slot.label}</div>
                <div className="text-gray-500 dark:text-gray-400">{slot.time}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  {slot.id.includes('morning') ? '🌅' : '🌇'}
                </div>
              </div>
              {days.map((_, dayIndex) => {
                const assignment = getAssignmentForSlot(null, teacherId, dayIndex, slot.id);
                const subject = assignment ? getSubjectInfo(assignment.subjectId) : null;
                const classInfo = assignment ? getClassInfo(assignment.classId) : null;
                
                return (
                  <div key={dayIndex} className="p-2 border border-gray-200 dark:border-gray-600 rounded min-h-[60px] bg-white dark:bg-gray-800">
                    {assignment && subject && classInfo ? (
                      <div className="space-y-1">
                        <div className="font-medium text-sm text-gray-900 dark:text-white">{subject.code}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">{classInfo.name}</div>
                        {assignment.isContraTurno && (
                          <Badge className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                            Contra-turno
                          </Badge>
                        )}
                        {assignment.roomType !== 'regular' && (
                          <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                            {assignment.roomType === 'lab' && 'Lab'}
                            {assignment.roomType === 'gym' && 'Quadra'}
                            {assignment.roomType === 'arts' && 'Artes'}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 dark:text-gray-500">-</div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getConflicts = () => {
    const conflicts: string[] = [];
    
    // Check for teacher conflicts
    const teacherSlots = new Map<string, number>();
    localSchedule.assignments.forEach(assignment => {
      const key = `${assignment.teacherId}_${assignment.timeSlotId}`;
      teacherSlots.set(key, (teacherSlots.get(key) || 0) + 1);
    });
    
    teacherSlots.forEach((count, key) => {
      if (count > 1) {
        const [teacherId, timeSlotId] = key.split('_');
        const teacher = getTeacherInfo(parseInt(teacherId));
        conflicts.push(`Professor ${teacher?.name} tem ${count} aulas simultâneas`);
      }
    });
    
    // Check for class conflicts
    const classSlots = new Map<string, number>();
    localSchedule.assignments.forEach(assignment => {
      const key = `${assignment.classId}_${assignment.timeSlotId}`;
      classSlots.set(key, (classSlots.get(key) || 0) + 1);
    });
    
    classSlots.forEach((count, key) => {
      if (count > 1) {
        const [classId, timeSlotId] = key.split('_');
        const classInfo = getClassInfo(parseInt(classId));
        conflicts.push(`Turma ${classInfo?.name} tem ${count} aulas simultâneas`);
      }
    });
    
    return conflicts;
  };

  const conflicts = getConflicts();
  const contraTurnoAssignments = localSchedule.assignments.filter(a => a.isContraTurno);

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Calendar className="w-5 h-5" />
            Visualização de Horários
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Visualize os horários gerados por turma ou professor, incluindo contra-turno
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">Qualidade:</span>
              <Badge className={`ml-2 ${
                localSchedule.hardViolations === 0 ? 'bg-green-500 dark:bg-green-600' : 'bg-red-500 dark:bg-red-600'
              }`}>
                {localSchedule.hardViolations === 0 ? 'Sem Conflitos' : `${localSchedule.hardViolations} Conflitos`}
              </Badge>
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">Aulas:</span>
              <span className="ml-2 text-gray-900 dark:text-white">{localSchedule.assignments.length}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">Contra-turno:</span>
              <span className="ml-2 text-blue-600 dark:text-blue-400">{contraTurnoAssignments.length}</span>
            </div>
          </div>

          {conflicts.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="font-medium text-red-800 dark:text-red-200">Conflitos Detectados</span>
              </div>
              <ul className="list-disc list-inside space-y-1">
                {conflicts.map((conflict, index) => (
                  <li key={index} className="text-sm text-red-700 dark:text-red-300">{conflict}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'class' | 'teacher')}>
        <TabsList className="grid w-full grid-cols-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <TabsTrigger 
            value="class" 
            className="flex items-center gap-2 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300"
          >
            <BookOpen className="w-4 h-4" />
            Por Turma
          </TabsTrigger>
          <TabsTrigger 
            value="teacher" 
            className="flex items-center gap-2 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300"
          >
            <User className="w-4 h-4" />
            Por Professor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="class" className="space-y-4">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Horário por Turma</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Selecione uma turma para visualizar seu horário semanal e contra-turno
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <SelectValue placeholder="Selecione uma turma" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  {classes.map(classItem => (
                    <SelectItem 
                      key={classItem.id} 
                      value={classItem.id.toString()}
                      className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {classItem.name} - {classItem.period === 'morning' ? 'Matutino' : 'Vespertino'}
                      {classItem.grade >= 6 && classItem.contraTurnoDay !== undefined && (
                        <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                          (Contra-turno: {dayOptions[classItem.contraTurnoDay].label})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedClass && renderClassSchedule(parseInt(selectedClass))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teacher" className="space-y-4">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Horário por Professor</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Selecione um professor para visualizar sua carga horária semanal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <SelectValue placeholder="Selecione um professor" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  {teachers.map(teacher => (
                    <SelectItem 
                      key={teacher.id} 
                      value={teacher.id.toString()}
                      className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {teacher.name} {teacher.isRegent && '(Regente)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedTeacher && renderTeacherSchedule(parseInt(selectedTeacher))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}