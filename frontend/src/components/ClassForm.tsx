import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Plus, Edit, Trash2, Save, X, Search } from 'lucide-react';
import { Class } from '@/types';

interface ClassFormProps {
  classes: Class[];
  setClasses: (classes: Class[]) => void;
}

export default function ClassForm({ classes, setClasses }: ClassFormProps) {
  const [currentClass, setCurrentClass] = useState<Partial<Class>>({
    name: '',
    grade: 1,
    period: 'morning',
    studentCount: 25,
    contraTurnoDay: undefined
  });

  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const grades = [
    { value: 1, label: '1º Ano' },
    { value: 2, label: '2º Ano' },
    { value: 3, label: '3º Ano' },
    { value: 4, label: '4º Ano' },
    { value: 5, label: '5º Ano' },
    { value: 6, label: '6º Ano' },
    { value: 7, label: '7º Ano' },
    { value: 8, label: '8º Ano' },
    { value: 9, label: '9º Ano' }
  ];

  const periods = [
    { value: 'morning', label: 'Matutino' },
    { value: 'afternoon', label: 'Vespertino' }
  ];

  const contraTurnoDays = [
    { value: 0, label: 'Segunda-feira' },
    { value: 1, label: 'Terça-feira' },
    { value: 2, label: 'Quarta-feira' },
    { value: 3, label: 'Quinta-feira' },
    { value: 4, label: 'Sexta-feira' }
  ];

  const handleSubmit = () => {
    if (!currentClass.name || !currentClass.grade || !currentClass.period) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const newClass: Class = {
      id: Date.now(),
      name: currentClass.name!,
      grade: currentClass.grade!,
      period: currentClass.period! as 'morning' | 'afternoon',
      studentCount: currentClass.studentCount || 25,
      contraTurnoDay: currentClass.contraTurnoDay
    };

    setClasses([...classes, newClass]);
    setCurrentClass({
      name: '',
      grade: 1,
      period: 'morning',
      studentCount: 25,
      contraTurnoDay: undefined
    });
  };

  const handleEditClass = (classItem: Class) => {
    setEditingClass({ ...classItem });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingClass || !editingClass.name || !editingClass.grade || !editingClass.period) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const updatedClasses = classes.map(classItem =>
      classItem.id === editingClass.id ? editingClass : classItem
    );
    setClasses(updatedClasses);
    setIsEditDialogOpen(false);
    setEditingClass(null);
  };

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setEditingClass(null);
  };

  const removeClass = (id: number) => {
    if (confirm('Tem certeza que deseja remover esta turma?')) {
      setClasses(classes.filter(c => c.id !== id));
    }
  };

  const filteredClasses = classes.filter(classItem =>
    classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    grades.find(g => g.value === classItem.grade)?.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    periods.find(p => p.value === classItem.period)?.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ClassFormFieldsInner = ({ 
    classData, 
    onChange, 
    isEditing = false 
  }: {
    classData: Partial<Class>;
    onChange: (field: keyof Class, value: string | number | undefined) => void;
    isEditing?: boolean;
  }) => (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-gray-700 dark:text-gray-300">Nome da Turma</Label>
          <Input
            value={classData.name || ''}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="Ex: 5º A, 8º B"
            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-gray-700 dark:text-gray-300">Quantidade de Alunos</Label>
          <Input
            type="number"
            min="1"
            max="50"
            value={classData.studentCount || 25}
            onChange={(e) => onChange('studentCount', parseInt(e.target.value) || 25)}
            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-gray-700 dark:text-gray-300">Ano Escolar</Label>
          <Select
            value={classData.grade?.toString()}
            onValueChange={(value) => onChange('grade', parseInt(value))}
          >
            <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
              <SelectValue placeholder="Selecione o ano" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              {grades.map(grade => (
                <SelectItem key={grade.value} value={grade.value.toString()}>
                  {grade.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-gray-700 dark:text-gray-300">Turno</Label>
          <Select
            value={classData.period}
            onValueChange={(value) => onChange('period', value)}
          >
            <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
              <SelectValue placeholder="Selecione o turno" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              {periods.map(period => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Contra-turno for grades 6-9 */}
      {classData.grade && classData.grade >= 6 && classData.grade <= 9 && (
        <div className="space-y-2">
          <Label className="text-gray-700 dark:text-gray-300">
            Dia do Contra-turno (6º ao 9º ano)
          </Label>
          <Select
            value={classData.contraTurnoDay?.toString()}
            onValueChange={(value) => onChange('contraTurnoDay', value ? parseInt(value) : undefined)}
          >
            <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
              <SelectValue placeholder="Selecione o dia do contra-turno" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <SelectItem value="">Nenhum</SelectItem>
              {contraTurnoDays.map(day => (
                <SelectItem key={day.value} value={day.value.toString()}>
                  {day.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Contra-turno é usado para completar a carga horária das disciplinas
          </p>
        </div>
      )}
    </div>
  );

  const ClassFormFields = React.memo(ClassFormFieldsInner);


  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <BookOpen className="w-5 h-5" />
            Cadastro de Turmas
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Gerencie turmas, anos escolares e configurações de contra-turno
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Add New Class Form */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="pt-6">
          <ClassFormFields
            classData={currentClass}
            onChange={(field, value) => setCurrentClass({ ...currentClass, [field]: value })}
          />

          <div className="mt-6">
            <Button onClick={handleSubmit} className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 py-3">
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Turma
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Classes List */}
      {classes.length > 0 && (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-gray-900 dark:text-white">Turmas Cadastradas</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  {classes.length} turma(s) cadastrada(s)
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar turma..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredClasses.map(classItem => (
              <div key={classItem.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{classItem.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        {grades.find(g => g.value === classItem.grade)?.label}
                      </Badge>
                      <Badge className={classItem.period === 'morning' 
                        ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                        : 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
                      }>
                        {periods.find(p => p.value === classItem.period)?.label}
                      </Badge>
                      {classItem.contraTurnoDay !== undefined && (
                        <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                          Contra-turno: {contraTurnoDays.find(d => d.value === classItem.contraTurnoDay)?.label}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClass(classItem)}
                      className="border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeClass(classItem.id)}
                      className="border-gray-300 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span>{classItem.studentCount} alunos</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Edit Class Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Editar Turma</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300">
              Modifique as informações da turma conforme necessário
            </DialogDescription>
          </DialogHeader>
          
          {editingClass && (
            <div className="space-y-6">
              <ClassFormFields
                classData={editingClass}
                onChange={(field, value) => setEditingClass({ ...editingClass, [field]: value })}
                isEditing={true}
              />

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4">
                <Button onClick={handleSaveEdit} className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </Button>
                <Button onClick={handleCancelEdit} variant="outline" className="border-gray-300 dark:border-gray-600">
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