import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BookOpen, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { Subject } from '@/types';

interface SubjectConfigProps {
  subjects: Subject[];
  setSubjects: (subjects: Subject[]) => void;
}

export default function SubjectConfig({ subjects, setSubjects }: SubjectConfigProps) {
  const [currentSubject, setCurrentSubject] = useState<Partial<Subject>>({
    name: '',
    code: '',
    weeklyHours: {},
    requiresSpecialRoom: undefined
  });

  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const defaultBNCCSubjects: Omit<Subject, 'id'>[] = [
    {
      name: 'Língua Portuguesa',
      code: 'PORT',
      weeklyHours: { 1: 7, 2: 7, 3: 7, 4: 7, 5: 7, 6: 4, 7: 4, 8: 4, 9: 4 },
      requiresSpecialRoom: undefined
    },
    {
      name: 'Matemática',
      code: 'MAT',
      weeklyHours: { 1: 7, 2: 7, 3: 7, 4: 7, 5: 7, 6: 4, 7: 4, 8: 4, 9: 4 },
      requiresSpecialRoom: undefined
    },
    {
      name: 'Ciências',
      code: 'CIE',
      weeklyHours: { 1: 2, 2: 2, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3 },
      requiresSpecialRoom: 'lab'
    },
    {
      name: 'História',
      code: 'HIST',
      weeklyHours: { 1: 2, 2: 2, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 2, 9: 2 },
      requiresSpecialRoom: undefined
    },
    {
      name: 'Geografia',
      code: 'GEO',
      weeklyHours: { 1: 2, 2: 2, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 2, 9: 2 },
      requiresSpecialRoom: undefined
    },
    {
      name: 'Educação Física',
      code: 'EF',
      weeklyHours: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 2, 9: 2 },
      requiresSpecialRoom: 'gym'
    },
    {
      name: 'Arte',
      code: 'ART',
      weeklyHours: { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2 },
      requiresSpecialRoom: 'arts'
    },
    {
      name: 'Inglês',
      code: 'ING',
      weeklyHours: { 6: 2, 7: 2, 8: 2, 9: 2 },
      requiresSpecialRoom: undefined
    },
    {
      name: 'Espanhol',
      code: 'ESP',
      weeklyHours: { 6: 2, 7: 2, 8: 2, 9: 2 },
      requiresSpecialRoom: undefined
    },
    {
      name: 'Ensino Religioso',
      code: 'ER',
      weeklyHours: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1 },
      requiresSpecialRoom: undefined
    },
    {
      name: 'Informática',
      code: 'INF',
      weeklyHours: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 2, 7: 2, 8: 2, 9: 2 },
      requiresSpecialRoom: 'lab'
    }
  ];

  const handleWeeklyHoursChange = (grade: number, hours: number, isEditing: boolean = false) => {
    if (isEditing && editingSubject) {
      const newWeeklyHours = { ...editingSubject.weeklyHours };
      if (hours > 0) {
        newWeeklyHours[grade] = hours;
      } else {
        delete newWeeklyHours[grade];
      }
      setEditingSubject({ ...editingSubject, weeklyHours: newWeeklyHours });
    } else {
      const newWeeklyHours = { ...currentSubject.weeklyHours };
      if (hours > 0) {
        newWeeklyHours[grade] = hours;
      } else {
        delete newWeeklyHours[grade];
      }
      setCurrentSubject({ ...currentSubject, weeklyHours: newWeeklyHours });
    }
  };

  const handleSubmit = () => {
    if (!currentSubject.name || !currentSubject.code) {
      alert('Preencha nome e código da disciplina');
      return;
    }

    const newSubject: Subject = {
      id: Date.now(),
      name: currentSubject.name!,
      code: currentSubject.code!,
      weeklyHours: currentSubject.weeklyHours || {},
      requiresSpecialRoom: currentSubject.requiresSpecialRoom
    };

    setSubjects([...subjects, newSubject]);
    setCurrentSubject({
      name: '',
      code: '',
      weeklyHours: {},
      requiresSpecialRoom: undefined
    });
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject({ ...subject });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingSubject || !editingSubject.name || !editingSubject.code) {
      alert('Preencha nome e código da disciplina');
      return;
    }

    const updatedSubjects = subjects.map(subject =>
      subject.id === editingSubject.id ? editingSubject : subject
    );
    setSubjects(updatedSubjects);
    setIsEditDialogOpen(false);
    setEditingSubject(null);
  };

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setEditingSubject(null);
  };

  const removeSubject = (id: number) => {
    if (confirm('Tem certeza que deseja remover esta disciplina?')) {
      setSubjects(subjects.filter(s => s.id !== id));
    }
  };

  const loadDefaultSubjects = () => {
    const newSubjects = defaultBNCCSubjects.map((subject, index) => ({
      ...subject,
      id: Date.now() + index
    }));
    setSubjects([...subjects, ...newSubjects]);
  };

  const getTotalWeeklyHours = () => {
    const totals: { [grade: number]: number } = {};
    for (let grade = 1; grade <= 9; grade++) {
      totals[grade] = subjects.reduce((sum, subject) => {
        return sum + (subject.weeklyHours[grade] || 0);
      }, 0);
    }
    return totals;
  };

  const SubjectFormFieldsInner = ({ 
    subjectData, 
    onChange, 
    onWeeklyHoursChange,
    isEditing = false 
  }: {
    subjectData: Partial<Subject>;
    onChange: (field: keyof Subject, value: string | 'lab' | 'gym' | 'arts' | undefined) => void;
    onWeeklyHoursChange: (grade: number, hours: number) => void;
    isEditing?: boolean;
  }) => (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-gray-700 dark:text-gray-300">Nome da Disciplina</Label>
          <Input
            value={subjectData.name || ''}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="Ex: Matemática, História"
            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-gray-700 dark:text-gray-300">Código da Disciplina</Label>
          <Input
            value={subjectData.code || ''}
            onChange={(e) => onChange('code', e.target.value.toUpperCase())}
            placeholder="Ex: MAT, HIST"
            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Special Room */}
      <div className="space-y-4">
        <Label className="text-gray-700 dark:text-gray-300">Requer Sala Especial</Label>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="no-special-room"
              checked={!subjectData.requiresSpecialRoom}
              onCheckedChange={(checked) => {
                if (checked) onChange('requiresSpecialRoom', undefined);
              }}
            />
            <Label htmlFor="no-special-room" className="text-sm text-gray-700 dark:text-gray-300">
              Não requer
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="lab-room"
              checked={subjectData.requiresSpecialRoom === 'lab'}
              onCheckedChange={(checked) => {
                if (checked) onChange('requiresSpecialRoom', 'lab');
              }}
            />
            <Label htmlFor="lab-room" className="text-sm text-gray-700 dark:text-gray-300">
              Laboratório
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="gym-room"
              checked={subjectData.requiresSpecialRoom === 'gym'}
              onCheckedChange={(checked) => {
                if (checked) onChange('requiresSpecialRoom', 'gym');
              }}
            />
            <Label htmlFor="gym-room" className="text-sm text-gray-700 dark:text-gray-300">
              Quadra/Ginásio
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="arts-room"
              checked={subjectData.requiresSpecialRoom === 'arts'}
              onCheckedChange={(checked) => {
                if (checked) onChange('requiresSpecialRoom', 'arts');
              }}
            />
            <Label htmlFor="arts-room" className="text-sm text-gray-700 dark:text-gray-300">
              Sala de Artes
            </Label>
          </div>
        </div>
      </div>

      <Separator className="bg-gray-200 dark:bg-gray-700" />

      {/* Weekly Hours */}
      <div className="space-y-4">
        <Label className="text-gray-700 dark:text-gray-300 text-lg font-medium">
          Aulas por Semana
        </Label>
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(grade => (
            <div key={grade} className="space-y-2">
              <Label className="text-sm text-gray-600 dark:text-gray-400">
                {grade}º Ano
              </Label>
              <Input
                type="number"
                min="0"
                max="15"
                value={subjectData.weeklyHours?.[grade] || ''}
                onChange={(e) => onWeeklyHoursChange(grade, parseInt(e.target.value) || 0)}
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-center"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const totals = getTotalWeeklyHours();

  const SubjectFormFields = React.memo(SubjectFormFieldsInner);


  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <BookOpen className="w-5 h-5" />
            Configuração de Disciplinas
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Gerencie disciplinas, aulas semanais e requisitos de salas especiais
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Default Subjects Button */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Disciplinas BNCC Padrão</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Carregue as 11 disciplinas padrão da BNCC com aulas semanais pré-definidas
              </p>
            </div>
            <Button onClick={loadDefaultSubjects} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Carregar Disciplinas BNCC
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add New Subject Form */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
        <CardContent className="pt-6">
          <SubjectFormFields
            subjectData={currentSubject}
            onChange={(field, value) => setCurrentSubject({ ...currentSubject, [field]: value })}
            onWeeklyHoursChange={(grade, hours) => handleWeeklyHoursChange(grade, hours, false)}
          />

          <div className="mt-6">
            <Button onClick={handleSubmit} className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white py-3">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Disciplina
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subjects List */}
      {subjects.length > 0 && (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Disciplinas Cadastradas</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              {subjects.length} disciplina(s) cadastrada(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subjects.map(subject => (
              <div key={subject.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {subject.name} ({subject.code})
                    </h3>
                    {subject.requiresSpecialRoom && (
                      <Badge className="mt-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                        {subject.requiresSpecialRoom === 'lab' && 'Laboratório'}
                        {subject.requiresSpecialRoom === 'gym' && 'Quadra/Ginásio'}
                        {subject.requiresSpecialRoom === 'arts' && 'Sala de Artes'}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditSubject(subject)}
                      className="border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeSubject(subject.id)}
                      className="border-gray-300 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-700 dark:text-gray-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Aulas semanais:</span>
                  {Object.entries(subject.weeklyHours)
                    .map(([grade, hours]) => `${grade}º ano: ${hours} aulas`)
                    .join(' | ')}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Summary Table */}
      {subjects.length > 0 && (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Resumo de Aulas por Semana</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Total de aulas por ano escolar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left p-2 text-gray-900 dark:text-white font-medium">Disciplina</th>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(grade => (
                      <th key={grade} className="text-center p-2 text-gray-900 dark:text-white font-medium">
                        {grade}º
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subjects.map(subject => (
                    <tr key={subject.id} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="p-2 text-gray-900 dark:text-white font-medium">
                        {subject.code}
                      </td>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(grade => (
                        <td key={grade} className="text-center p-2 text-gray-700 dark:text-gray-300">
                          {subject.weeklyHours[grade] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                    <td className="p-2 font-bold text-gray-900 dark:text-white">TOTAL</td>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(grade => (
                      <td key={grade} className="text-center p-2 font-bold text-gray-900 dark:text-white">
                        {totals[grade]}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Subject Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Editar Disciplina</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300">
              Modifique as informações da disciplina conforme necessário
            </DialogDescription>
          </DialogHeader>
          
          {editingSubject && (
            <div className="space-y-6">
              <SubjectFormFields
                subjectData={editingSubject}
                onChange={(field, value) => setEditingSubject({ ...editingSubject, [field]: value })}
                onWeeklyHoursChange={(grade, hours) => handleWeeklyHoursChange(grade, hours, true)}
                isEditing={true}
              />

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4">
                <Button onClick={handleSaveEdit} className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </Button>
                <Button onClick={handleCancelEdit} variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}