import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Table, Save, Share2 } from 'lucide-react';
import { Schedule } from '@/lib/schedulingAlgorithm';
import { Teacher, Class, Subject, ExportData, ScheduleExport, ScheduleRow, DaySlot } from '@/types';

interface ExportPanelProps {
  schedule: Schedule | null;
  teachers: Teacher[];
  classes: Class[];
  subjects: Subject[];
}

export default function ExportPanel({ schedule, teachers, classes, subjects }: ExportPanelProps) {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'json'>('pdf');
  const [exportType, setExportType] = useState<'all' | 'class' | 'teacher'>('all');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [includeTeacherNames, setIncludeTeacherNames] = useState(true);
  const [includeRoomInfo, setIncludeRoomInfo] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  if (!schedule) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Exportar Horários
          </CardTitle>
          <CardDescription>
            Nenhum horário foi gerado ainda. Vá para a aba "Gerar Horários" para criar um novo horário.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const exportData = prepareExportData();
      
      switch (exportFormat) {
        case 'pdf':
          await exportToPDF(exportData);
          break;
        case 'excel':
          await exportToExcel(exportData);
          break;
        case 'json':
          await exportToJSON(exportData);
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Erro durante a exportação. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const prepareExportData = (): ExportData => {
    const timeSlots = [
      { id: 'reading_morning', label: 'Leitura', time: '07:45-08:04', period: 'morning' },
      { id: 'slot1_morning', label: '1ª aula', time: '08:04-08:44', period: 'morning' },
      { id: 'slot2_morning', label: '2ª aula', time: '08:44-09:26', period: 'morning' },
      { id: 'slot3_morning', label: '3ª aula', time: '09:26-10:07', period: 'morning' },
      { id: 'slot4_morning', label: '4ª aula', time: '10:23-11:04', period: 'morning' },
      { id: 'slot5_morning', label: '5ª aula', time: '11:04-11:45', period: 'morning' },
      { id: 'slot1_afternoon', label: '1ª aula', time: '13:15-13:56', period: 'afternoon' },
      { id: 'slot2_afternoon', label: '2ª aula', time: '13:56-14:37', period: 'afternoon' },
      { id: 'slot3_afternoon', label: '3ª aula', time: '14:37-15:18', period: 'afternoon' },
      { id: 'reading_afternoon', label: 'Leitura', time: '15:35-15:55', period: 'afternoon' },
      { id: 'slot4_afternoon', label: '4ª aula', time: '15:55-16:35', period: 'afternoon' },
      { id: 'slot5_afternoon', label: '5ª aula', time: '16:35-17:15', period: 'afternoon' }
    ];

    const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
    
    const data: ExportData = {
      metadata: {
        generatedAt: schedule.generatedAt,
        fitness: schedule.fitness,
        hardViolations: schedule.hardViolations,
        softViolations: schedule.softViolations,
        totalAssignments: schedule.assignments.length
      },
      schedules: []
    };

    if (exportType === 'all' || exportType === 'class') {
      const classesToExport = exportType === 'all' ? classes : classes.filter(c => selectedItems.includes(c.id));
      
      classesToExport.forEach(classItem => {
        const classSchedule: ScheduleExport = {
          type: 'class',
          id: classItem.id,
          name: classItem.name,
          grade: classItem.grade,
          period: classItem.period,
          grid: []
        };

        const relevantSlots = timeSlots.filter(slot => slot.period === classItem.period);
        
        relevantSlots.forEach(slot => {
          const row: ScheduleRow = {
            slot: slot.label,
            time: slot.time,
            days: []
          };

          days.forEach((day, dayIndex) => {
            const timeSlotId = `${slot.id}_day${dayIndex}`;
            const assignment = schedule.assignments.find(a => 
              a.classId === classItem.id && a.timeSlotId === timeSlotId
            );

            if (assignment) {
              const subject = subjects.find(s => s.id === assignment.subjectId);
              const teacher = teachers.find(t => t.id === assignment.teacherId);
              
              row.days.push({
                day,
                subject: subject?.name || 'N/A',
                subjectCode: subject?.code || 'N/A',
                teacher: includeTeacherNames ? (teacher?.name || 'N/A') : '',
                room: includeRoomInfo ? assignment.roomType : ''
              });
            } else if (slot.label === 'Leitura') {
              row.days.push({
                day,
                subject: 'Leitura',
                subjectCode: 'LEIT',
                teacher: '',
                room: ''
              });
            } else {
              row.days.push({
                day,
                subject: '',
                subjectCode: '',
                teacher: '',
                room: ''
              });
            }
          });

          classSchedule.grid.push(row);
        });

        data.schedules.push(classSchedule);
      });
    }

    if (exportType === 'all' || exportType === 'teacher') {
      const teachersToExport = exportType === 'all' ? teachers : teachers.filter(t => selectedItems.includes(t.id));
      
      teachersToExport.forEach(teacher => {
        const teacherSchedule: ScheduleExport = {
          type: 'teacher',
          id: teacher.id,
          name: teacher.name,
          isRegent: teacher.isRegent,
          maxWeeklyHours: teacher.maxWeeklyHours,
          grid: []
        };

        timeSlots.forEach(slot => {
          const row: ScheduleRow = {
            slot: slot.label,
            time: slot.time,
            period: slot.period as 'morning' | 'afternoon',
            days: []
          };

          days.forEach((day, dayIndex) => {
            const timeSlotId = `${slot.id}_day${dayIndex}`;
            const assignment = schedule.assignments.find(a => 
              a.teacherId === teacher.id && a.timeSlotId === timeSlotId
            );

            if (assignment) {
              const subject = subjects.find(s => s.id === assignment.subjectId);
              const classItem = classes.find(c => c.id === assignment.classId);
              
              row.days.push({
                day,
                subject: subject?.code || 'N/A',
                class: classItem?.name || 'N/A',
                room: includeRoomInfo ? assignment.roomType : ''
              });
            } else {
              row.days.push({
                day,
                subject: '',
                class: '',
                room: ''
              });
            }
          });

          teacherSchedule.grid.push(row);
        });

        data.schedules.push(teacherSchedule);
      });
    }

    return data;
  };

  const exportToPDF = async (data: ExportData) => {
    // Simple HTML to PDF conversion
    const htmlContent = generateHTMLContent(data);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const exportToExcel = async (data: ExportData) => {
    // Convert to CSV format for simple Excel compatibility
    let csvContent = '';
    
    data.schedules.forEach((schedule: ScheduleExport) => {
      csvContent += `\n${schedule.type.toUpperCase()}: ${schedule.name}\n`;
      csvContent += 'Horário,Segunda,Terça,Quarta,Quinta,Sexta\n';
      
      schedule.grid.forEach((row: ScheduleRow) => {
        const rowData = [
          `${row.slot} (${row.time})`,
          ...row.days.map((day: DaySlot) => {
            if (schedule.type === 'class') {
              return `${day.subject}${day.teacher ? ` - ${day.teacher}` : ''}`;
            } else {
              return `${day.subject}${day.class ? ` - ${day.class}` : ''}`;
            }
          })
        ];
        csvContent += rowData.join(',') + '\n';
      });
      csvContent += '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `horarios_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToJSON = async (data: ExportData) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `horarios_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const generateHTMLContent = (data: ExportData) => {
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Horários Escolares</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .schedule { margin-bottom: 40px; page-break-after: always; }
          .schedule-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: center; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .time-slot { background-color: #f9f9f9; font-weight: bold; }
          .empty { color: #999; }
          .metadata { font-size: 12px; color: #666; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Sistema de Distribuição de Aulas</h1>
          <h2>Horários Escolares</h2>
          <div class="metadata">
            Gerado em: ${data.metadata.generatedAt.toLocaleString()}<br>
            Fitness: ${data.metadata.fitness.toFixed(0)}/10000 | 
            Violações: ${data.metadata.hardViolations} críticas, ${data.metadata.softViolations} leves<br>
            Total de aulas: ${data.metadata.totalAssignments}
          </div>
        </div>
    `;

    data.schedules.forEach((schedule: ScheduleExport) => {
      html += `
        <div class="schedule">
          <div class="schedule-title">
            ${schedule.type === 'class' ? 'TURMA' : 'PROFESSOR'}: ${schedule.name}
            ${schedule.grade ? ` (${schedule.grade}º ano)` : ''}
            ${schedule.isRegent ? ' - Regente' : ''}
          </div>
          <table>
            <thead>
              <tr>
                <th>Horário</th>
                <th>Segunda</th>
                <th>Terça</th>
                <th>Quarta</th>
                <th>Quinta</th>
                <th>Sexta</th>
              </tr>
            </thead>
            <tbody>
      `;

      schedule.grid.forEach((row: ScheduleRow) => {
        html += `
          <tr>
            <td class="time-slot">${row.slot}<br><small>${row.time}</small></td>
        `;

        row.days.forEach((day: DaySlot) => {
          if (schedule.type === 'class') {
            const content = day.subject || '-';
            const teacher = day.teacher ? `<br><small>${day.teacher}</small>` : '';
            html += `<td>${content}${teacher}</td>`;
          } else {
            const content = day.subject || '-';
            const classInfo = day.class ? `<br><small>${day.class}</small>` : '';
            html += `<td>${content}${classInfo}</td>`;
          }
        });

        html += '</tr>';
      });

      html += `
            </tbody>
          </table>
        </div>
      `;
    });

    html += '</body></html>';
    return html;
  };

  const saveConfiguration = () => {
    const config = {
      teachers,
      classes,
      subjects,
      schedule,
      savedAt: new Date().toISOString()
    };
    
    const jsonString = JSON.stringify(config, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `configuracao_escola_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Exportar Horários
          </CardTitle>
          <CardDescription>
            Exporte os horários gerados em diferentes formatos para impressão ou compartilhamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{schedule.assignments.length}</div>
              <div className="text-sm text-blue-800">Aulas Agendadas</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{schedule.fitness.toFixed(0)}</div>
              <div className="text-sm text-green-800">Fitness Score</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{schedule.hardViolations}</div>
              <div className="text-sm text-purple-800">Conflitos</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Formato de Exportação</label>
                <Select value={exportFormat} onValueChange={(value: 'pdf' | 'excel' | 'json') => setExportFormat(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        PDF (Impressão)
                      </div>
                    </SelectItem>
                    <SelectItem value="excel">
                      <div className="flex items-center gap-2">
                        <Table className="w-4 h-4" />
                        CSV/Excel
                      </div>
                    </SelectItem>
                    <SelectItem value="json">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        JSON (Dados)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Exportação</label>
                <Select value={exportType} onValueChange={(value: 'all' | 'class' | 'teacher') => setExportType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Horários</SelectItem>
                    <SelectItem value="class">Por Turma</SelectItem>
                    <SelectItem value="teacher">Por Professor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Opções de Formatação</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeTeacher"
                      checked={includeTeacherNames}
                      onCheckedChange={(checked) => setIncludeTeacherNames(checked as boolean)}
                    />
                    <label htmlFor="includeTeacher" className="text-sm">
                      Incluir nomes dos professores
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeRoom"
                      checked={includeRoomInfo}
                      onCheckedChange={(checked) => setIncludeRoomInfo(checked as boolean)}
                    />
                    <label htmlFor="includeRoom" className="text-sm">
                      Incluir informações de sala
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {(exportType === 'class' || exportType === 'teacher') && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Selecionar {exportType === 'class' ? 'Turmas' : 'Professores'}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded">
                {(exportType === 'class' ? classes : teachers).map((item: Teacher | Class) => (
                  <div key={item.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`item-${item.id}`}
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedItems([...selectedItems, item.id]);
                        } else {
                          setSelectedItems(selectedItems.filter(id => id !== item.id));
                        }
                      }}
                    />
                    <label htmlFor={`item-${item.id}`} className="text-sm">
                      {item.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <Button 
              onClick={handleExport} 
              disabled={isExporting || (exportType !== 'all' && selectedItems.length === 0)}
              className="flex-1"
            >
              {isExporting ? (
                <>
                  <Download className="w-4 h-4 mr-2 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar {exportFormat.toUpperCase()}
                </>
              )}
            </Button>
            
            <Button 
              onClick={saveConfiguration} 
              variant="outline"
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Configuração
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Horário</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Data de geração:</span>
                <span className="font-medium">{schedule.generatedAt.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Total de aulas:</span>
                <span className="font-medium">{schedule.assignments.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Fitness score:</span>
                <span className="font-medium">{schedule.fitness.toFixed(0)}/10000</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Violações críticas:</span>
                <Badge variant={schedule.hardViolations === 0 ? "default" : "destructive"}>
                  {schedule.hardViolations}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Violações leves:</span>
                <Badge variant="secondary">{schedule.softViolations}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Qualidade geral:</span>
                <Badge className={
                  schedule.hardViolations === 0 && schedule.softViolations < 10 ? "bg-green-500" :
                  schedule.hardViolations === 0 ? "bg-blue-500" : "bg-red-500"
                }>
                  {schedule.hardViolations === 0 && schedule.softViolations < 10 ? "Excelente" :
                   schedule.hardViolations === 0 ? "Bom" : "Precisa Ajustes"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}