import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, FileText, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { Teacher, Class, Subject } from '@/types';
import * as XLSX from 'xlsx';

interface ImportDataProps {
  onImportTeachers: (teachers: Teacher[]) => void;
  onImportClasses: (classes: Class[]) => void;
  onImportSubjects: (subjects: Subject[]) => void;
}

interface ImportedTeacher extends Partial<Teacher> {
  subjectNames?: string[];
}

interface ImportedData {
  teachers: ImportedTeacher[];
  classes: Partial<Class>[];
  subjects: Partial<Subject>[];
}

interface ValidationError {
  type: 'error' | 'warning';
  sheet: 'teachers' | 'classes' | 'subjects';
  row: number;
  field: string;
  message: string;
}

interface ExcelRow {
  [key: string]: string | number | boolean | undefined;
}

export default function ImportData({ onImportTeachers, onImportClasses, onImportSubjects }: ImportDataProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importedData, setImportedData] = useState<ImportedData | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const timeSlots = [
    { id: 'slot1_morning', label: '1ª aula (08:04-08:44)' },
    { id: 'slot2_morning', label: '2ª aula (08:44-09:26)' },
    { id: 'slot3_morning', label: '3ª aula (09:26-10:07)' },
    { id: 'slot4_morning', label: '4ª aula (10:23-11:04)' },
    { id: 'slot5_morning', label: '5ª aula (11:04-11:45)' },
    { id: 'slot1_afternoon', label: '1ª aula (13:15-13:56)' },
    { id: 'slot2_afternoon', label: '2ª aula (13:56-14:37)' },
    { id: 'slot3_afternoon', label: '3ª aula (14:37-15:18)' },
    { id: 'slot4_afternoon', label: '4ª aula (15:55-16:35)' },
    { id: 'slot5_afternoon', label: '5ª aula (16:35-17:15)' }
  ];

  const generateCompleteTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Complete Teachers data with realistic examples
    const teachersData = [
      ['Nome', 'Email', 'Disciplinas', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Aulas Máximas', 'É Regente', 'Observações'],
      // Professores regentes (1º ao 5º ano)
      ['Ana Maria Silva', 'ana.silva@escola.com', 'Língua Portuguesa,Matemática,Ciências,História,Geografia,Arte,Ensino Religioso', 'Sim', 'Sim', 'Sim', 'Sim', 'Sim', '25', 'Sim', 'Regente do 1º ano'],
      ['Carlos Eduardo Santos', 'carlos.santos@escola.com', 'Língua Portuguesa,Matemática,Ciências,História,Geografia,Arte,Ensino Religioso', 'Sim', 'Sim', 'Sim', 'Sim', 'Não', '25', 'Sim', 'Regente do 2º ano - não disponível sextas'],
      ['Mariana Costa Lima', 'mariana.lima@escola.com', 'Língua Portuguesa,Matemática,Ciências,História,Geografia,Arte,Ensino Religioso', 'Sim', 'Sim', 'Sim', 'Sim', 'Sim', '25', 'Sim', 'Regente do 3º ano'],
      ['Roberto Alves Pereira', 'roberto.pereira@escola.com', 'Língua Portuguesa,Matemática,Ciências,História,Geografia,Arte,Ensino Religioso', 'Sim', 'Sim', 'Sim', 'Sim', 'Sim', '25', 'Sim', 'Regente do 4º ano'],
      ['Fernanda Oliveira Rocha', 'fernanda.rocha@escola.com', 'Língua Portuguesa,Matemática,Ciências,História,Geografia,Arte,Ensino Religioso', 'Sim', 'Sim', 'Sim', 'Sim', 'Sim', '25', 'Sim', 'Regente do 5º ano'],
      
      // Professores especialistas
      ['João Pedro Mathias', 'joao.mathias@escola.com', 'Matemática', 'Sim', 'Sim', 'Sim', 'Sim', 'Sim', '20', 'Não', 'Especialista em Matemática - 6º ao 9º ano'],
      ['Luciana Ferreira Souza', 'luciana.souza@escola.com', 'Língua Portuguesa', 'Sim', 'Sim', 'Sim', 'Sim', 'Sim', '20', 'Não', 'Especialista em Português - 6º ao 9º ano'],
      ['Rafael Mendes Castro', 'rafael.castro@escola.com', 'Ciências', 'Sim', 'Sim', 'Não', 'Sim', 'Sim', '18', 'Não', 'Professor de Ciências - não disponível quartas'],
      ['Patricia Gomes Barbosa', 'patricia.barbosa@escola.com', 'História', 'Sim', 'Sim', 'Sim', 'Sim', 'Sim', '18', 'Não', 'Professora de História'],
      ['Anderson Silva Nunes', 'anderson.nunes@escola.com', 'Geografia', 'Não', 'Sim', 'Sim', 'Sim', 'Sim', '18', 'Não', 'Professor de Geografia - não disponível segundas'],
      ['Juliana Rodrigues Melo', 'juliana.melo@escola.com', 'Inglês', 'Sim', 'Sim', 'Sim', 'Sim', 'Não', '15', 'Não', 'Professora de Inglês - não disponível sextas'],
      ['Diego Carvalho Teixeira', 'diego.teixeira@escola.com', 'Espanhol', 'Sim', 'Sim', 'Sim', 'Sim', 'Sim', '15', 'Não', 'Professor de Espanhol'],
      ['Camila Araújo Dias', 'camila.dias@escola.com', 'Arte', 'Sim', 'Sim', 'Sim', 'Sim', 'Sim', '20', 'Não', 'Professora de Arte - sala de artes'],
      ['Bruno Henrique Costa', 'bruno.costa@escola.com', 'Educação Física', 'Sim', 'Sim', 'Sim', 'Sim', 'Sim', '25', 'Não', 'Professor de Educação Física - quadra'],
      ['Marcos Antonio Reis', 'marcos.reis@escola.com', 'Educação Física', 'Sim', 'Sim', 'Sim', 'Não', 'Sim', '20', 'Não', 'Professor de Ed. Física - não disponível quintas'],
      ['Tatiana Moreira Santos', 'tatiana.santos@escola.com', 'Informática', 'Sim', 'Sim', 'Sim', 'Sim', 'Sim', '18', 'Não', 'Professora de Informática - laboratório'],
      ['Padre José Maria', 'padre.jose@escola.com', 'Ensino Religioso', 'Sim', 'Sim', 'Sim', 'Sim', 'Não', '15', 'Não', 'Ensino Religioso - não disponível sextas'],
      
      // Professores auxiliares/substitutos
      ['Sandra Regina Lopes', 'sandra.lopes@escola.com', 'Língua Portuguesa,Matemática', 'Sim', 'Sim', 'Sim', 'Sim', 'Sim', '20', 'Não', 'Professora auxiliar - substituta'],
      ['Rodrigo Ferreira Silva', 'rodrigo.silva@escola.com', 'Ciências,Matemática', 'Sim', 'Sim', 'Sim', 'Sim', 'Sim', '18', 'Não', 'Professor auxiliar de exatas'],
      ['Cristiane Almeida Pinto', 'cristiane.pinto@escola.com', 'História,Geografia', 'Sim', 'Sim', 'Sim', 'Sim', 'Sim', '18', 'Não', 'Professora de humanas']
    ];
    const teachersWs = XLSX.utils.aoa_to_sheet(teachersData);
    XLSX.utils.book_append_sheet(wb, teachersWs, 'Professores');

    // Complete Classes data - realistic school structure
    const classesData = [
      ['Nome', 'Ano', 'Turno', 'Alunos', 'Contra-turno', 'Observações'],
      // Ensino Fundamental I - Anos Iniciais (1º ao 5º)
      ['1º A', '1', 'Matutino', '28', 'Não', 'Turma do primeiro ano - manhã'],
      ['1º B', '1', 'Vespertino', '26', 'Não', 'Turma do primeiro ano - tarde'],
      ['2º A', '2', 'Matutino', '30', 'Não', 'Turma do segundo ano - manhã'],
      ['2º B', '2', 'Vespertino', '28', 'Não', 'Turma do segundo ano - tarde'],
      ['3º A', '3', 'Matutino', '32', 'Não', 'Turma do terceiro ano - manhã'],
      ['3º B', '3', 'Vespertino', '29', 'Não', 'Turma do terceiro ano - tarde'],
      ['4º A', '4', 'Matutino', '31', 'Não', 'Turma do quarto ano - manhã'],
      ['4º B', '4', 'Vespertino', '27', 'Não', 'Turma do quarto ano - tarde'],
      ['5º A', '5', 'Matutino', '33', 'Não', 'Turma do quinto ano - manhã'],
      ['5º B', '5', 'Vespertino', '30', 'Não', 'Turma do quinto ano - tarde'],
      
      // Ensino Fundamental II - Anos Finais (6º ao 9º)
      ['6º A', '6', 'Matutino', '35', 'Sim', 'Sexto ano A - contra-turno quartas'],
      ['6º B', '6', 'Vespertino', '33', 'Sim', 'Sexto ano B - contra-turno terças'],
      ['7º A', '7', 'Matutino', '34', 'Sim', 'Sétimo ano A - contra-turno quintas'],
      ['7º B', '7', 'Vespertino', '32', 'Sim', 'Sétimo ano B - contra-turno segundas'],
      ['8º A', '8', 'Matutino', '36', 'Sim', 'Oitavo ano A - contra-turno sextas'],
      ['8º B', '8', 'Vespertino', '34', 'Sim', 'Oitavo ano B - contra-turno quartas'],
      ['9º A', '9', 'Matutino', '33', 'Sim', 'Nono ano A - contra-turno terças'],
      ['9º B', '9', 'Vespertino', '31', 'Sim', 'Nono ano B - contra-turno quintas']
    ];
    const classesWs = XLSX.utils.aoa_to_sheet(classesData);
    XLSX.utils.book_append_sheet(wb, classesWs, 'Turmas');

    // Complete Subjects data - All 11 BNCC subjects
    const subjectsData = [
      ['Nome', 'Código', 'Requer Sala Especial', '1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano', '6º Ano', '7º Ano', '8º Ano', '9º Ano'],
      ['Língua Portuguesa', 'PORT', 'Não', '7', '7', '7', '7', '7', '4', '4', '4', '4'],
      ['Matemática', 'MAT', 'Não', '7', '7', '7', '7', '7', '4', '4', '4', '4'],
      ['Ciências', 'CIE', 'Sim', '2', '2', '3', '3', '3', '3', '3', '3', '3'],
      ['História', 'HIST', 'Não', '2', '2', '3', '3', '3', '2', '2', '2', '2'],
      ['Geografia', 'GEO', 'Não', '2', '2', '3', '3', '3', '2', '2', '2', '2'],
      ['Educação Física', 'EF', 'Sim', '3', '3', '3', '3', '3', '2', '2', '2', '2'],
      ['Arte', 'ART', 'Sim', '2', '2', '2', '2', '2', '2', '2', '2', '2'],
      ['Inglês', 'ING', 'Não', '0', '0', '0', '0', '0', '2', '2', '2', '2'],
      ['Espanhol', 'ESP', 'Não', '0', '0', '0', '0', '0', '2', '2', '2', '2'],
      ['Ensino Religioso', 'ER', 'Não', '1', '1', '1', '1', '1', '1', '1', '1', '1'],
      ['Informática', 'INF', 'Sim', '1', '1', '1', '1', '1', '2', '2', '2', '2']
    ];
    const subjectsWs = XLSX.utils.aoa_to_sheet(subjectsData);
    XLSX.utils.book_append_sheet(wb, subjectsWs, 'Disciplinas');

    // Add instructions sheet
    const instructionsData = [
      ['INSTRUÇÕES PARA USO DO TEMPLATE'],
      [''],
      ['Este template contém dados completos para gerar horários escolares:'],
      [''],
      ['ABA PROFESSORES:'],
      ['- 20 professores com especialidades definidas'],
      ['- 5 professores regentes (1º ao 5º ano)'],
      ['- 15 professores especialistas (6º ao 9º ano)'],
      ['- Disponibilidade realista com algumas restrições'],
      ['- Cargas horárias apropriadas por especialidade'],
      ['- DISCIPLINAS: Liste as disciplinas separadas por vírgula'],
      ['  Exemplo: "Matemática,Ciências" ou "Língua Portuguesa,História,Geografia"'],
      [''],
      ['ABA TURMAS:'],
      ['- 18 turmas do 1º ao 9º ano'],
      ['- 2 turmas por ano escolar'],
      ['- Distribuição entre turnos Matutino e Vespertino'],
      ['- Contra-turno configurado para 6º ao 9º ano'],
      ['- Quantidade realista de alunos (26-36 por turma)'],
      [''],
      ['ABA DISCIPLINAS:'],
      ['- Todas as 11 disciplinas BNCC obrigatórias'],
      ['- Cargas horárias conforme diretrizes nacionais'],
      ['- Salas especiais definidas (Lab, Quadra, Arte)'],
      ['- Distribuição adequada por faixa etária'],
      [''],
      ['MAPEAMENTO DE DISCIPLINAS:'],
      ['- Professores regentes: múltiplas disciplinas para anos iniciais'],
      ['- Especialistas: disciplina específica para anos finais'],
      ['- Nomes das disciplinas devem coincidir exatamente com a aba Disciplinas'],
      ['- Use vírgulas para separar múltiplas disciplinas'],
      [''],
      ['COMO USAR:'],
      ['1. Baixe este template'],
      ['2. Ajuste os dados conforme sua escola'],
      ['3. Mantenha os nomes das disciplinas consistentes'],
      ['4. Importe no sistema'],
      ['5. Gere os horários automaticamente'],
      [''],
      ['OBSERVAÇÕES:'],
      ['- Professores regentes lecionam múltiplas disciplinas'],
      ['- Especialistas focam em suas áreas específicas'],
      ['- Algumas restrições de disponibilidade são realistas'],
      ['- Contra-turno permite atividades complementares'],
      ['- Sistema mapeia automaticamente disciplinas por nome'],
      [''],
      ['Total de aulas semanais por ano:'],
      ['1º ao 5º ano: 25 aulas'],
      ['6º ao 9º ano: 25 aulas + contra-turno']
    ];
    const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsData);
    XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instruções');

    // Download the file
    XLSX.writeFile(wb, 'template_completo_escola.xlsx');
  };

  const parseAvailability = (availabilityData: ExcelRow): { [timeSlotId: string]: boolean[] } => {
    const availability: { [timeSlotId: string]: boolean[] } = {};
    
    // Parse availability for each day (Monday to Friday)
    const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
    const dayAvailability: boolean[] = [];
    
    days.forEach((day, index) => {
      const dayValue = availabilityData[day];
      let isAvailable = false;
      
      if (typeof dayValue === 'string') {
        isAvailable = dayValue.toLowerCase() === 'sim' || dayValue === '1';
      } else if (typeof dayValue === 'number') {
        isAvailable = dayValue === 1;
      } else if (typeof dayValue === 'boolean') {
        isAvailable = dayValue;
      }
      
      dayAvailability.push(isAvailable);
    });

    // Apply the same availability to all time slots
    timeSlots.forEach(slot => {
      availability[slot.id] = [...dayAvailability];
    });

    return availability;
  };

  const validateData = (data: ImportedData): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Validate subjects first (needed for teacher validation)
    data.subjects.forEach((subject, index) => {
      if (!subject.name || !subject.code) {
        errors.push({
          type: 'error',
          sheet: 'subjects',
          row: index + 2,
          field: 'name/code',
          message: 'Nome e código da disciplina são obrigatórios'
        });
      }

      // Validate weekly hours
      for (let grade = 1; grade <= 9; grade++) {
        const hours = subject.weeklyHours?.[grade];
        if (hours !== undefined && (isNaN(hours) || hours < 0 || hours > 15)) {
          errors.push({
            type: 'error',
            sheet: 'subjects',
            row: index + 2,
            field: `${grade}º Ano`,
            message: `Quantidade de aulas deve ser um número entre 0 e 15`
          });
        }
      }
    });

    // Create subject name map for validation
    const subjectNames = new Set(data.subjects.map(s => s.name?.toLowerCase()).filter(Boolean));

    // Validate teachers
    data.teachers.forEach((teacher, index) => {
      if (!teacher.name || !teacher.email) {
        errors.push({
          type: 'error',
          sheet: 'teachers',
          row: index + 2,
          field: 'name/email',
          message: 'Nome e email do professor são obrigatórios'
        });
      }

      // Validate email format
      if (teacher.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(teacher.email)) {
        errors.push({
          type: 'error',
          sheet: 'teachers',
          row: index + 2,
          field: 'email',
          message: 'Formato de email inválido'
        });
      }

      // Validate subjects
      if (teacher.subjectNames && teacher.subjectNames.length > 0) {
        teacher.subjectNames.forEach(subjectName => {
          if (!subjectNames.has(subjectName.toLowerCase())) {
            errors.push({
              type: 'warning',
              sheet: 'teachers',
              row: index + 2,
              field: 'subjects',
              message: `Disciplina "${subjectName}" não encontrada na aba Disciplinas`
            });
          }
        });
      } else {
        errors.push({
          type: 'warning',
          sheet: 'teachers',
          row: index + 2,
          field: 'subjects',
          message: 'Professor não tem disciplinas atribuídas'
        });
      }

      // Validate availability (at least one day should be available)
      if (teacher.availability) {
        const hasAvailability = Object.values(teacher.availability).some(days => 
          days.some(day => day === true)
        );
        
        if (!hasAvailability) {
          errors.push({
            type: 'error',
            sheet: 'teachers',
            row: index + 2,
            field: 'availability',
            message: 'Professor deve estar disponível em pelo menos um dia da semana'
          });
        }
      }

      // Validate max weekly hours
      if (teacher.maxWeeklyHours && (teacher.maxWeeklyHours < 1 || teacher.maxWeeklyHours > 40)) {
        errors.push({
          type: 'error',
          sheet: 'teachers',
          row: index + 2,
          field: 'maxWeeklyHours',
          message: 'Quantidade máxima de aulas deve estar entre 1 e 40'
        });
      }
    });

    // Validate classes
    data.classes.forEach((classItem, index) => {
      if (!classItem.name || !classItem.grade || !classItem.period) {
        errors.push({
          type: 'error',
          sheet: 'classes',
          row: index + 2,
          field: 'basic_info',
          message: 'Nome, ano e turno da turma são obrigatórios'
        });
      }

      // Validate grade
      if (classItem.grade && (classItem.grade < 1 || classItem.grade > 9)) {
        errors.push({
          type: 'error',
          sheet: 'classes',
          row: index + 2,
          field: 'grade',
          message: 'Ano escolar deve estar entre 1 e 9'
        });
      }

      // Validate period
      if (classItem.period && !['morning', 'afternoon'].includes(classItem.period)) {
        errors.push({
          type: 'error',
          sheet: 'classes',
          row: index + 2,
          field: 'period',
          message: 'Turno deve ser "Matutino" ou "Vespertino"'
        });
      }

      // Validate student count
      if (classItem.studentCount && (classItem.studentCount < 1 || classItem.studentCount > 50)) {
        errors.push({
          type: 'error',
          sheet: 'classes',
          row: index + 2,
          field: 'studentCount',
          message: 'Quantidade de alunos deve estar entre 1 e 50'
        });
      }
    });

    return errors;
  };

  const processFile = async (selectedFile: File) => {
    setIsProcessing(true);
    setValidationErrors([]);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });

      const importedData: ImportedData = {
        teachers: [],
        classes: [],
        subjects: []
      };

      // Process Subjects sheet FIRST to create the mapping
      if (workbook.SheetNames.includes('Disciplinas')) {
        const subjectsSheet = workbook.Sheets['Disciplinas'];
        const subjectsJson = XLSX.utils.sheet_to_json(subjectsSheet) as ExcelRow[];

        importedData.subjects = subjectsJson.map((row: ExcelRow) => {
          const weeklyHours: { [grade: number]: number } = {};
          
          for (let grade = 1; grade <= 9; grade++) {
            const hours = Number(row[`${grade}º Ano`]);
            if (!isNaN(hours) && hours > 0) {
              weeklyHours[grade] = hours;
            }
          }

          let requiresSpecialRoom: 'lab' | 'gym' | 'arts' | undefined = undefined;
          const specialRoomValue = String(row['Requer Sala Especial'] || '').toLowerCase();
          if (specialRoomValue === 'sim' || row['Requer Sala Especial'] === '1') {
            // Try to determine room type based on subject name
            const subjectName = String(row['Nome'] || '').toLowerCase();
            if (subjectName.includes('física') || subjectName.includes('educação física')) {
              requiresSpecialRoom = 'gym';
            } else if (subjectName.includes('arte') || subjectName.includes('artes')) {
              requiresSpecialRoom = 'arts';
            } else {
              requiresSpecialRoom = 'lab';
            }
          }

          return {
            name: String(row['Nome'] || ''),
            code: String(row['Código'] || ''),
            weeklyHours,
            requiresSpecialRoom
          };
        });
      }

      // Create subject name to ID mapping
      const subjectNameToId = new Map<string, number>();
      importedData.subjects.forEach((subject, index) => {
        if (subject.name) {
          subjectNameToId.set(subject.name.toLowerCase().trim(), Date.now() + index + 2000);
        }
      });

      // Process Teachers sheet
      if (workbook.SheetNames.includes('Professores')) {
        const teachersSheet = workbook.Sheets['Professores'];
        const teachersJson = XLSX.utils.sheet_to_json(teachersSheet) as ExcelRow[];

        importedData.teachers = teachersJson.map((row: ExcelRow) => {
          const disciplinasValue = row['Disciplinas'];
          let subjectNames: string[] = [];
          
          if (disciplinasValue) {
            subjectNames = String(disciplinasValue)
              .split(',')
              .map((s: string) => s.trim())
              .filter(s => s.length > 0);
          }

          // Map subject names to IDs
          const subjects = subjectNames
            .map((name: string) => subjectNameToId.get(name.toLowerCase().trim()))
            .filter((id: number | undefined) => id !== undefined) as number[];

          return {
            name: String(row['Nome'] || ''),
            email: String(row['Email'] || ''),
            subjects,
            subjectNames, // Keep for display purposes
            availability: parseAvailability(row),
            maxWeeklyHours: Number(row['Aulas Máximas']) || 20,
            isRegent: String(row['É Regente'] || '').toLowerCase() === 'sim' || row['É Regente'] === '1'
          };
        });
      }

      // Process Classes sheet
      if (workbook.SheetNames.includes('Turmas')) {
        const classesSheet = workbook.Sheets['Turmas'];
        const classesJson = XLSX.utils.sheet_to_json(classesSheet) as ExcelRow[];

        importedData.classes = classesJson.map((row: ExcelRow) => {
          let period: 'morning' | 'afternoon' = 'morning';
          const turnoValue = String(row['Turno'] || '').toLowerCase();
          if (turnoValue.includes('vespertino') || turnoValue.includes('tarde')) {
            period = 'afternoon';
          }

          const contraTurnoValue = String(row['Contra-turno'] || '').toLowerCase();
          const hasContraTurno = contraTurnoValue === 'sim' || row['Contra-turno'] === '1';

          return {
            name: String(row['Nome'] || ''),
            grade: Number(row['Ano']) || 1,
            period,
            studentCount: Number(row['Alunos']) || 25,
            contraTurnoDay: hasContraTurno ? 2 : undefined // Default to Wednesday
          };
        });
      }

      // Validate data
      const errors = validateData(importedData);
      setValidationErrors(errors);
      setImportedData(importedData);

    } catch (error) {
      console.error('Error processing file:', error);
      setValidationErrors([{
        type: 'error',
        sheet: 'subjects',
        row: 0,
        field: 'file',
        message: 'Erro ao processar arquivo. Verifique se é um arquivo Excel válido.'
      }]);
    }

    setIsProcessing(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processFile(selectedFile);
    }
  };

  const handleImport = () => {
    if (!importedData) return;

    const hasErrors = validationErrors.some(error => error.type === 'error');
    if (hasErrors) {
      alert('Corrija os erros antes de importar os dados.');
      return;
    }

    // Convert imported data to proper format with proper IDs
    const subjects: Subject[] = importedData.subjects
      .filter(s => s.name && s.code)
      .map((s, index) => ({
        id: Date.now() + index + 2000,
        name: s.name!,
        code: s.code!,
        weeklyHours: s.weeklyHours || {},
        requiresSpecialRoom: s.requiresSpecialRoom
      }));

    // Create final subject name to ID mapping with actual IDs
    const finalSubjectNameToId = new Map<string, number>();
    subjects.forEach((subject) => {
      finalSubjectNameToId.set(subject.name.toLowerCase().trim(), subject.id);
    });

    const teachers: Teacher[] = importedData.teachers
      .filter(t => t.name && t.email)
      .map((t, index) => {
        // Map subject names to actual subject IDs
        const subjectIds = (t.subjectNames || [])
          .map((name: string) => finalSubjectNameToId.get(name.toLowerCase().trim()))
          .filter((id: number | undefined) => id !== undefined) as number[];

        return {
          id: Date.now() + index,
          name: t.name!,
          email: t.email!,
          subjects: subjectIds,
          availability: t.availability || {},
          maxWeeklyHours: t.maxWeeklyHours || 20,
          isRegent: t.isRegent || false
        };
      });

    const classes: Class[] = importedData.classes
      .filter(c => c.name && c.grade && c.period)
      .map((c, index) => ({
        id: Date.now() + index + 1000,
        name: c.name!,
        grade: c.grade!,
        period: c.period! as 'morning' | 'afternoon',
        studentCount: c.studentCount || 25,
        contraTurnoDay: c.contraTurnoDay
      }));

    // Import data in correct order
    if (subjects.length > 0) onImportSubjects(subjects);
    if (teachers.length > 0) onImportTeachers(teachers);
    if (classes.length > 0) onImportClasses(classes);

    // Reset state
    setFile(null);
    setImportedData(null);
    setValidationErrors([]);

    alert(`Dados importados com sucesso!\n${teachers.length} professores, ${classes.length} turmas, ${subjects.length} disciplinas.\n\nDisciplinas mapeadas corretamente para cada professor.`);
  };

  const ErrorSummary = () => {
    const errorCount = validationErrors.filter(e => e.type === 'error').length;
    const warningCount = validationErrors.filter(e => e.type === 'warning').length;

    return (
      <div className="space-y-2">
        {errorCount > 0 && (
          <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              {errorCount} erro(s) encontrado(s). Corrija antes de importar.
            </AlertDescription>
          </Alert>
        )}
        
        {warningCount > 0 && (
          <Alert className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              {warningCount} aviso(s) encontrado(s). Verifique se necessário.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Upload className="w-5 h-5" />
            Importação de Dados
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Importe professores, turmas e disciplinas através de arquivo Excel/CSV
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={generateCompleteTemplate} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white">
              <Download className="w-4 h-4 mr-2" />
              Baixar Template Completo
            </Button>
            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Template com 20 professores, 18 turmas e 11 disciplinas BNCC
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">📋 Template Completo Inclui:</h4>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <p>• <strong>20 Professores:</strong> 5 regentes (1º-5º) + 15 especialistas (6º-9º)</p>
              <p>• <strong>18 Turmas:</strong> 2 turmas por ano (1º-9º) com turnos matutino/vespertino</p>
              <p>• <strong>11 Disciplinas BNCC:</strong> Todas as disciplinas obrigatórias com cargas corretas</p>
              <p>• <strong>Mapeamento Correto:</strong> Disciplinas corretamente atribuídas a cada professor</p>
              <p>• <strong>Dados Realistas:</strong> Disponibilidades, restrições e observações práticas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Label htmlFor="file-upload" className="text-gray-700 dark:text-gray-300">
              Selecionar Arquivo Excel/CSV
            </Label>
            <Input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            />
            {isProcessing && (
              <div className="text-sm text-blue-600 dark:text-blue-400">
                Processando arquivo...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validationErrors.length > 0 && (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Validação dos Dados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ErrorSummary />
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {validationErrors.map((error, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border text-sm ${
                    error.type === 'error' 
                      ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                      : 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
                  }`}
                >
                  <div className="font-medium">
                    {error.sheet === 'teachers' && 'Professores'} 
                    {error.sheet === 'classes' && 'Turmas'} 
                    {error.sheet === 'subjects' && 'Disciplinas'} 
                    - Linha {error.row}
                  </div>
                  <div>{error.field}: {error.message}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Data */}
      {importedData && (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Preview dos Dados</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Verifique os dados antes de importar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="teachers" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="teachers">
                  Professores ({importedData.teachers.length})
                </TabsTrigger>
                <TabsTrigger value="classes">
                  Turmas ({importedData.classes.length})
                </TabsTrigger>
                <TabsTrigger value="subjects">
                  Disciplinas ({importedData.subjects.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="teachers" className="space-y-2 max-h-60 overflow-y-auto">
                {importedData.teachers.map((teacher, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="font-medium text-gray-900 dark:text-white">{teacher.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Email: {teacher.email} | Máximo: {teacher.maxWeeklyHours} aulas
                      {teacher.isRegent && <Badge className="ml-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">Regente</Badge>}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Disciplinas:</strong> {teacher.subjectNames?.join(', ') || 'Nenhuma'}
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="classes" className="space-y-2 max-h-60 overflow-y-auto">
                {importedData.classes.map((classItem, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="font-medium text-gray-900 dark:text-white">{classItem.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {classItem.grade}º ano | {classItem.period === 'morning' ? 'Matutino' : 'Vespertino'} | {classItem.studentCount} alunos
                      {classItem.contraTurnoDay !== undefined && (
                        <Badge className="ml-2 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                          Contra-turno
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="subjects" className="space-y-2 max-h-60 overflow-y-auto">
                {importedData.subjects.map((subject, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {subject.name} ({subject.code})
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Aulas: {Object.entries(subject.weeklyHours || {})
                        .map(([grade, hours]) => `${grade}º=${hours}`)
                        .join(', ')}
                      {subject.requiresSpecialRoom && (
                        <Badge className="ml-2 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                          Sala especial
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>

            <Separator className="my-4" />

            <div className="flex items-center gap-4">
              <Button 
                onClick={handleImport}
                disabled={validationErrors.some(e => e.type === 'error')}
                className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Importar Dados
              </Button>
              <Button 
                onClick={() => {
                  setFile(null);
                  setImportedData(null);
                  setValidationErrors([]);
                }}
                variant="outline"
                className="border-gray-300 dark:border-gray-600"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}