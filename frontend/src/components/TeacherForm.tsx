import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Users, Plus, Edit, Trash2, Save, X, Search } from 'lucide-react';
import { Teacher, Subject } from '@/types';

interface TeacherFormProps {
  teachers: Teacher[];
  setTeachers: (teachers: Teacher[]) => void;
  subjects: Subject[];
}

export default function TeacherForm({ teachers, setTeachers, subjects }: TeacherFormProps) {
  const [currentTeacher, setCurrentTeacher] = useState<Partial<Teacher>>({
    name: '',
    email: '',
    isRegent: false,
    maxWeeklyHours: 20,
    subjects: [],
    availability: {}
  });

  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const timeSlots = [
    { id: 'slot1_morning', label: '1ª aula (08:04-08:44)', period: 'morning' },
    { id: 'slot2_morning', label: '2ª aula (08:44-09:26)', period: 'morning' },
    { id: 'slot3_morning', label: '3ª aula (09:26-10:07)', period: 'morning' },
    { id: 'slot4_morning', label: '4ª aula (10:23-11:04)', period: 'morning' },
    { id: 'slot5_morning', label: '5ª aula (11:04-11:45)', period: 'morning' },
    { id: 'slot1_afternoon', label: '1ª aula (13:15-13:56)', period: 'afternoon' },
    { id: 'slot2_afternoon', label: '2ª aula (13:56-14:37)', period: 'afternoon' },
    { id: 'slot3_afternoon', label: '3ª aula (14:37-15:18)', period: 'afternoon' },
    { id: 'slot4_afternoon', label: '4ª aula (15:55-16:35)', period: 'afternoon' },
    { id: 'slot5_afternoon', label: '5ª aula (16:35-17:15)', period: 'afternoon' }
  ];

  const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

  const initializeAvailability = (teacher: Partial<Teacher>) => {
    const availability: { [timeSlotId: string]: boolean[] } = {};
    timeSlots.forEach(slot => {
      availability[slot.id] = teacher.availability?.[slot.id] || [true, true, true, true, true];
    });
    return availability;
  };

  const handleAvailabilityChange = (
    timeSlotId: string, 
    dayIndex: number, 
    available: boolean,
    isEditing: boolean = false
  ) => {
    if (isEditing && editingTeacher) {
      const newAvailability = { ...editingTeacher.availability };
      if (!newAvailability[timeSlotId]) {
        newAvailability[timeSlotId] = [true, true, true, true, true];
      }
      newAvailability[timeSlotId][dayIndex] = available;
      setEditingTeacher({ ...editingTeacher, availability: newAvailability });
    } else {
      const newAvailability = { ...currentTeacher.availability };
      if (!newAvailability[timeSlotId]) {
        newAvailability[timeSlotId] = [true, true, true, true, true];
      }
      newAvailability[timeSlotId][dayIndex] = available;
      setCurrentTeacher({ ...currentTeacher, availability: newAvailability });
    }
  };

  const handleSubjectToggle = (subjectId: number, isEditing: boolean = false) => {
    if (isEditing && editingTeacher) {
      const newSubjects = editingTeacher.subjects.includes(subjectId)
        ? editingTeacher.subjects.filter(id => id !== subjectId)
        : [...editingTeacher.subjects, subjectId];
      setEditingTeacher({ ...editingTeacher, subjects: newSubjects });
    } else {
      const newSubjects = (currentTeacher.subjects || []).includes(subjectId)
        ? (currentTeacher.subjects || []).filter(id => id !== subjectId)
        : [...(currentTeacher.subjects || []), subjectId];
      setCurrentTeacher({ ...currentTeacher, subjects: newSubjects });
    }
  };

  const handleSubmit = () => {
    if (!currentTeacher.name || !currentTeacher.email) {
      alert('Preencha nome e email do professor');
      return;
    }

    const newTeacher: Teacher = {
      id: Date.now(),
      name: currentTeacher.name!,
      email: currentTeacher.email!,
      isRegent: currentTeacher.isRegent || false,
      maxWeeklyHours: currentTeacher.maxWeeklyHours || 20,
      subjects: currentTeacher.subjects || [],
      availability: initializeAvailability(currentTeacher)
    };

    setTeachers([...teachers, newTeacher]);
    setCurrentTeacher({
      name: '',
      email: '',
      isRegent: false,
      maxWeeklyHours: 20,
      subjects: [],
      availability: {}
    });
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher({ ...teacher });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingTeacher || !editingTeacher.name || !editingTeacher.email) {
      alert('Preencha nome e email do professor');
      return;
    }

    const updatedTeachers = teachers.map(teacher =>
      teacher.id === editingTeacher.id ? editingTeacher : teacher
    );
    setTeachers(updatedTeachers);
    setIsEditDialogOpen(false);
    setEditingTeacher(null);
  };

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setEditingTeacher(null);
  };

  const removeTeacher = (id: number) => {
    if (confirm('Tem certeza que deseja remover este professor?')) {
      setTeachers(teachers.filter(t => t.id !== id));
    }
  };

  const getSubjectNames = (subjectIds: number[]) => {
    return subjectIds
      .map(id => subjects.find(s => s.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getSubjectNames(teacher.subjects).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const AvailabilityGrid = ({ 
    availability, 
    onAvailabilityChange, 
    isEditing = false 
  }: {
    availability: { [timeSlotId: string]: boolean[] };
    onAvailabilityChange: (timeSlotId: string, dayIndex: number, available: boolean) => void;
    isEditing?: boolean;
  }) => (
    <div className="space-y-4">
      <Label className="text-gray-700 dark:text-gray-300 text-lg font-medium">
        Disponibilidade Semanal
      </Label>
      
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <div className="grid grid-cols-6 gap-2 mb-4">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400"></div>
          {days.map(day => (
            <div key={day} className="text-sm font-medium text-gray-600 dark:text-gray-400 text-center">
              {day}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Matutino</div>
          {timeSlots.filter(slot => slot.period === 'morning').map(slot => (
            <div key={slot.id} className="grid grid-cols-6 gap-2 items-center">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {slot.label}
              </div>
              {days.map((_, dayIndex) => (
                <div key={dayIndex} className="flex justify-center">
                  <Checkbox
                    checked={availability[slot.id]?.[dayIndex] || false}
                    onCheckedChange={(checked) => 
                      onAvailabilityChange(slot.id, dayIndex, !!checked)
                    }
                  />
                </div>
              ))}
            </div>
          ))}

          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-4">Vespertino</div>
          {timeSlots.filter(slot => slot.period === 'afternoon').map(slot => (
            <div key={slot.id} className="grid grid-cols-6 gap-2 items-center">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {slot.label}
              </div>
              {days.map((_, dayIndex) => (
                <div key={dayIndex} className="flex justify-center">
                  <Checkbox
                    checked={availability[slot.id]?.[dayIndex] || false}
                    onCheckedChange={(checked) => 
                      onAvailabilityChange(slot.id, dayIndex, !!checked)
                    }
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Users className="w-5 h-5" />
            Cadastro de Professores
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Gerencie professores, disciplinas e disponibilidade de horários
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Add New Teacher Form */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="teacherName" className="text-gray-700 dark:text-gray-300">Nome do Professor</Label>
                <Input
                  id="teacherName"
                  value={currentTeacher.name || ''}
                  onChange={(e) => setCurrentTeacher({ ...currentTeacher, name: e.target.value })}
                  placeholder="Nome completo"
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacherEmail" className="text-gray-700 dark:text-gray-300">Email</Label>
                <Input
                  id="teacherEmail"
                  type="email"
                  value={currentTeacher.email || ''}
                  onChange={(e) => setCurrentTeacher({ ...currentTeacher, email: e.target.value })}
                  placeholder="email@escola.com"
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxHours" className="text-gray-700 dark:text-gray-300">Carga Horária Máxima</Label>
                <Input
                  id="maxHours"
                  type="number"
                  min="1"
                  max="40"
                  value={currentTeacher.maxWeeklyHours || 20}
                  onChange={(e) => setCurrentTeacher({ ...currentTeacher, maxWeeklyHours: parseInt(e.target.value) || 20 })}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isRegent"
                checked={currentTeacher.isRegent || false}
                onCheckedChange={(checked) => setCurrentTeacher({ ...currentTeacher, isRegent: !!checked })}
              />
              <Label htmlFor="isRegent" className="text-gray-700 dark:text-gray-300">
                Professor Regente (1º ao 5º ano)
              </Label>
            </div>

            <Separator className="bg-gray-200 dark:bg-gray-700" />

            {/* Subjects */}
            <div className="space-y-4">
              <Label className="text-gray-700 dark:text-gray-300 text-lg font-medium">Disciplinas que Leciona</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {subjects.map(subject => (
                  <div key={subject.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`subject-${subject.id}`}
                      checked={(currentTeacher.subjects || []).includes(subject.id)}
                      onCheckedChange={() => handleSubjectToggle(subject.id)}
                    />
                    <Label htmlFor={`subject-${subject.id}`} className="text-sm text-gray-700 dark:text-gray-300">
                      {subject.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="bg-gray-200 dark:bg-gray-700" />

            {/* Availability */}
            <AvailabilityGrid
              availability={initializeAvailability(currentTeacher)}
              onAvailabilityChange={(timeSlotId, dayIndex, available) => 
                handleAvailabilityChange(timeSlotId, dayIndex, available, false)
              }
            />

            <Button onClick={handleSubmit} className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 py-3">
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Professor
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Teachers List */}
      {teachers.length > 0 && (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-gray-900 dark:text-white">Professores Cadastrados</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  {teachers.length} professor(es) cadastrado(s)
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar professor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredTeachers.map(teacher => (
              <div key={teacher.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{teacher.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{teacher.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTeacher(teacher)}
                      className="border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeTeacher(teacher.id)}
                      className="border-gray-300 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Tipo:</span>
                    <Badge className={teacher.isRegent ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 ml-2' : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 ml-2'}>
                      {teacher.isRegent ? 'Regente' : 'Especialista'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Carga Máxima:</span>
                    <span className="text-gray-900 dark:text-white ml-2">{teacher.maxWeeklyHours}h/semana</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Disciplinas:</span>
                    <span className="text-gray-900 dark:text-white ml-2">
                      {getSubjectNames(teacher.subjects) || 'Nenhuma'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Edit Teacher Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Editar Professor</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300">
              Modifique as informações do professor conforme necessário
            </DialogDescription>
          </DialogHeader>
          
          {editingTeacher && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Nome do Professor</Label>
                  <Input
                    value={editingTeacher.name}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Email</Label>
                  <Input
                    type="email"
                    value={editingTeacher.email}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, email: e.target.value })}
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Carga Horária Máxima</Label>
                  <Input
                    type="number"
                    min="1"
                    max="40"
                    value={editingTeacher.maxWeeklyHours}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, maxWeeklyHours: parseInt(e.target.value) || 20 })}
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={editingTeacher.isRegent}
                  onCheckedChange={(checked) => setEditingTeacher({ ...editingTeacher, isRegent: !!checked })}
                />
                <Label className="text-gray-700 dark:text-gray-300">
                  Professor Regente (1º ao 5º ano)
                </Label>
              </div>

              <Separator className="bg-gray-200 dark:bg-gray-700" />

              {/* Subjects */}
              <div className="space-y-4">
                <Label className="text-gray-700 dark:text-gray-300 text-lg font-medium">Disciplinas que Leciona</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {subjects.map(subject => (
                    <div key={subject.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={editingTeacher.subjects.includes(subject.id)}
                        onCheckedChange={() => handleSubjectToggle(subject.id, true)}
                      />
                      <Label className="text-sm text-gray-700 dark:text-gray-300">
                        {subject.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-gray-200 dark:bg-gray-700" />

              {/* Availability */}
              <AvailabilityGrid
                availability={editingTeacher.availability}
                onAvailabilityChange={(timeSlotId, dayIndex, available) => 
                  handleAvailabilityChange(timeSlotId, dayIndex, available, true)
                }
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