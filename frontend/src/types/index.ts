export interface Teacher {
  id: number;
  name: string;
  email: string;
  isRegent: boolean;
  maxWeeklyHours: number;
  subjects: number[];
  availability: { [timeSlotId: string]: boolean[] }; // [monday, tuesday, wednesday, thursday, friday]
}

export interface Class {
  id: number;
  name: string;
  grade: number; // 1-9
  period: 'morning' | 'afternoon';
  studentCount: number;
  contraTurnoDay?: number; // 0-4 (Monday-Friday) for grades 6-9
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  weeklyHours: { [grade: number]: number }; // Back to grade-specific hours
  requiresSpecialRoom?: 'lab' | 'gym' | 'arts';
}

export interface Schedule {
  assignments: Assignment[];
  fitness: number;
  hardViolations: number;
  softViolations: number;
  generatedAt: Date;
}

export interface Assignment {
  id: string;
  teacherId: number;
  classId: number;
  subjectId: number;
  timeSlotId: string;
  roomType: 'regular' | 'lab' | 'gym' | 'arts';
  isContraTurno?: boolean;
  isReading?: boolean;
}

export interface ExportData {
  teachers: Teacher[];
  classes: Class[];
  subjects: Subject[];
  schedule?: Schedule;
}