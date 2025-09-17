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

export interface Assignment {
  id: string;
  teacherId: number;
  classId: number;
  subjectId: number;
  timeSlotId: string; // Format: slotId_dayIndex
  roomType: 'regular' | 'lab' | 'gym' | 'arts';
  isContraTurno?: boolean;
  isReading?: boolean;
}

export interface Schedule {
  assignments: Assignment[];
  fitness: number;
  hardViolations: number;
  softViolations: number;
  generatedAt: Date;
}

// Time slots with reading periods
export const TIME_SLOTS = {
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

class SchedulingEngine {
  private teachers: Teacher[] = [];
  private classes: Class[] = [];
  private subjects: Subject[] = [];
  private assignments: Assignment[] = [];

  async generateSchedule(
    teachers: Teacher[],
    classes: Class[],
    subjects: Subject[],
    onProgress?: (generation: number, fitness: number) => void
  ): Promise<Schedule> {
    this.teachers = teachers;
    this.classes = classes;
    this.subjects = subjects;
    this.assignments = [];

    // Generate regular schedule
    await this.generateRegularSchedule(onProgress);
    
    // Generate contra-turno schedule for grades 6-9
    await this.generateContraTurnoSchedule();

    // Generate automatic reading assignments
    await this.generateReadingAssignments();

    const fitness = this.calculateFitness();
    const violations = this.countViolations();

    return {
      assignments: [...this.assignments],
      fitness,
      hardViolations: violations.hard,
      softViolations: violations.soft,
      generatedAt: new Date()
    };
  }

  private async generateRegularSchedule(onProgress?: (generation: number, fitness: number) => void) {
    const maxGenerations = 500;
    let bestFitness = 0;
    let bestAssignments: Assignment[] = [];

    for (let generation = 0; generation < maxGenerations; generation++) {
      this.assignments = [];
      
      // Generate assignments for each class
      for (const classItem of this.classes) {
        await this.generateClassSchedule(classItem);
      }

      const fitness = this.calculateFitness();
      
      if (fitness > bestFitness) {
        bestFitness = fitness;
        bestAssignments = [...this.assignments];
      }

      if (onProgress) {
        onProgress(generation + 1, bestFitness);
      }

      // Early termination if perfect solution found
      if (fitness >= 9500) break;

      // Add some randomness for genetic algorithm simulation
      await new Promise(resolve => setTimeout(resolve, 1));
    }

    this.assignments = bestAssignments;
  }

  private async generateClassSchedule(classItem: Class) {
    const timeSlots = TIME_SLOTS[classItem.period];
    const days = [0, 1, 2, 3, 4]; // Monday to Friday

    // Get required subjects for this grade with their weekly hours
    const requiredSubjects = this.subjects.filter(subject => 
      subject.weeklyHours[classItem.grade] && subject.weeklyHours[classItem.grade] > 0
    );

    // Create assignment pool based on weekly hours for this specific grade
    const assignmentPool: { subjectId: number; count: number }[] = [];
    
    for (const subject of requiredSubjects) {
      const weeklyHours = subject.weeklyHours[classItem.grade] || 0;
      assignmentPool.push({ subjectId: subject.id, count: weeklyHours });
    }

    // Calculate available slots (excluding reading slots)
    const availableSlots = timeSlots.filter(slot => !slot.isReading);

    // Assign to regular time slots
    for (const day of days) {
      for (const slot of availableSlots) {
        const timeSlotId = `${slot.id}_day${day}`;
        
        // Find a subject that needs more assignments
        const availableSubject = assignmentPool.find(item => item.count > 0);
        
        if (availableSubject) {
          // Find available teacher for this subject
          const availableTeacher = this.findAvailableTeacher(
            availableSubject.subjectId, 
            classItem, 
            timeSlotId
          );

          if (availableTeacher) {
            const subject = this.subjects.find(s => s.id === availableSubject.subjectId)!;
            
            this.assignments.push({
              id: `${classItem.id}_${availableSubject.subjectId}_${timeSlotId}`,
              teacherId: availableTeacher.id,
              classId: classItem.id,
              subjectId: availableSubject.subjectId,
              timeSlotId,
              roomType: subject.requiresSpecialRoom || 'regular',
              isContraTurno: false,
              isReading: false
            });

            availableSubject.count--;
          }
        }
      }
    }
  }

  private async generateContraTurnoSchedule() {
    // Generate contra-turno schedules for grades 6-9 that still need hours
    const contraTurnoClasses = this.classes.filter(c => c.grade >= 6 && c.grade <= 9);
    
    for (const classItem of contraTurnoClasses) {
      if (classItem.contraTurnoDay !== undefined) {
        await this.generateContraTurnoForClass(classItem, classItem.contraTurnoDay);
      }
    }
  }

  private async generateContraTurnoForClass(classItem: Class, contraTurnoDay: number) {
    // Use opposite period for contra-turno
    const contraTurnoPeriod = classItem.period === 'morning' ? 'afternoon' : 'morning';
    const timeSlots = TIME_SLOTS[contraTurnoPeriod];
    const availableSlots = timeSlots.filter(slot => !slot.isReading);
    
    // Check which subjects still need assignments for this class
    const requiredSubjects = this.subjects.filter(subject => 
      subject.weeklyHours[classItem.grade] && subject.weeklyHours[classItem.grade] > 0
    );

    // Count current assignments for each subject
    const currentAssignments = new Map<number, number>();
    this.assignments
      .filter(a => a.classId === classItem.id && !a.isContraTurno)
      .forEach(assignment => {
        const current = currentAssignments.get(assignment.subjectId) || 0;
        currentAssignments.set(assignment.subjectId, current + 1);
      });

    // Find subjects that still need more hours
    const remainingSubjects: { subjectId: number; needed: number }[] = [];
    for (const subject of requiredSubjects) {
      const required = subject.weeklyHours[classItem.grade];
      const assigned = currentAssignments.get(subject.id) || 0;
      const needed = required - assigned;
      
      if (needed > 0) {
        remainingSubjects.push({ subjectId: subject.id, needed });
      }
    }

    // Assign remaining subjects to contra-turno slots
    let slotIndex = 0;
    for (const { subjectId, needed } of remainingSubjects) {
      for (let i = 0; i < needed && slotIndex < availableSlots.length; i++) {
        const slot = availableSlots[slotIndex];
        const timeSlotId = `${slot.id}_day${contraTurnoDay}`;
        
        const availableTeacher = this.findAvailableTeacher(
          subjectId,
          classItem,
          timeSlotId
        );

        if (availableTeacher) {
          const subject = this.subjects.find(s => s.id === subjectId)!;
          
          this.assignments.push({
            id: `${classItem.id}_${subjectId}_${timeSlotId}_contra`,
            teacherId: availableTeacher.id,
            classId: classItem.id,
            subjectId: subjectId,
            timeSlotId,
            roomType: subject.requiresSpecialRoom || 'regular',
            isContraTurno: true,
            isReading: false
          });
        }

        slotIndex++;
      }
    }
  }

  private async generateReadingAssignments() {
    // Automatic reading assignments
    // Morning reading (07:45-08:04) -> teacher of 1st class (08:04-08:44)
    // Afternoon reading (15:35-15:55) -> teacher of 4th class (15:55-16:35)

    for (const classItem of this.classes) {
      const days = [0, 1, 2, 3, 4];
      
      for (const day of days) {
        if (classItem.period === 'morning') {
          // Morning reading assignment
          const firstClassTimeSlot = `slot1_morning_day${day}`;
          const readingTimeSlot = `reading_morning_day${day}`;
          
          const firstClassAssignment = this.assignments.find(
            a => a.classId === classItem.id && a.timeSlotId === firstClassTimeSlot
          );
          
          if (firstClassAssignment) {
            this.assignments.push({
              id: `reading_${classItem.id}_${readingTimeSlot}`,
              teacherId: firstClassAssignment.teacherId,
              classId: classItem.id,
              subjectId: firstClassAssignment.subjectId,
              timeSlotId: readingTimeSlot,
              roomType: 'regular',
              isContraTurno: false,
              isReading: true
            });
          }
        } else {
          // Afternoon reading assignment
          const fourthClassTimeSlot = `slot4_afternoon_day${day}`;
          const readingTimeSlot = `reading_afternoon_day${day}`;
          
          const fourthClassAssignment = this.assignments.find(
            a => a.classId === classItem.id && a.timeSlotId === fourthClassTimeSlot
          );
          
          if (fourthClassAssignment) {
            this.assignments.push({
              id: `reading_${classItem.id}_${readingTimeSlot}`,
              teacherId: fourthClassAssignment.teacherId,
              classId: classItem.id,
              subjectId: fourthClassAssignment.subjectId,
              timeSlotId: readingTimeSlot,
              roomType: 'regular',
              isContraTurno: false,
              isReading: true
            });
          }
        }
      }
    }
  }

  private findAvailableTeacher(subjectId: number, classItem: Class, timeSlotId: string): Teacher | null {
    // Find teachers who can teach this subject
    const qualifiedTeachers = this.teachers.filter(teacher => 
      teacher.subjects.includes(subjectId)
    );

    // For grades 1-5, prefer regent teachers
    if (classItem.grade <= 5) {
      const regentTeachers = qualifiedTeachers.filter(t => t.isRegent);
      if (regentTeachers.length > 0) {
        return this.selectBestTeacher(regentTeachers, timeSlotId);
      }
    }

    return this.selectBestTeacher(qualifiedTeachers, timeSlotId);
  }

  private selectBestTeacher(teachers: Teacher[], timeSlotId: string): Teacher | null {
    // Check availability and current workload
    const availableTeachers = teachers.filter(teacher => {
      // Check if teacher is available at this time
      const [slotId, dayPart] = timeSlotId.split('_day');
      const dayIndex = parseInt(dayPart);
      
      // Skip reading slots for availability check (they're automatic)
      if (slotId.includes('reading')) {
        return true;
      }
      
      if (teacher.availability[slotId] && !teacher.availability[slotId][dayIndex]) {
        return false;
      }

      // Check if teacher already has assignment at this time
      const hasConflict = this.assignments.some(assignment => 
        assignment.teacherId === teacher.id && assignment.timeSlotId === timeSlotId
      );

      return !hasConflict;
    });

    if (availableTeachers.length === 0) return null;

    // Select teacher with lowest current workload
    return availableTeachers.reduce((best, current) => {
      const bestWorkload = this.getTeacherCurrentWorkload(best.id);
      const currentWorkload = this.getTeacherCurrentWorkload(current.id);
      return currentWorkload < bestWorkload ? current : best;
    });
  }

  private getTeacherCurrentWorkload(teacherId: number): number {
    return this.assignments.filter(a => a.teacherId === teacherId).length;
  }

  private calculateFitness(): number {
    let fitness = 10000;
    const violations = this.countViolations();
    
    // Penalize hard violations heavily
    fitness -= violations.hard * 100;
    
    // Penalize soft violations lightly
    fitness -= violations.soft * 10;
    
    // Bonus for balanced teacher workloads
    const workloadBalance = this.calculateWorkloadBalance();
    fitness += workloadBalance * 50;
    
    return Math.max(0, fitness);
  }

  private countViolations(): { hard: number; soft: number } {
    let hardViolations = 0;
    let softViolations = 0;

    // Check for teacher conflicts (hard violation)
    const teacherSlots = new Map<string, number>();
    this.assignments.forEach(assignment => {
      const key = `${assignment.teacherId}_${assignment.timeSlotId}`;
      teacherSlots.set(key, (teacherSlots.get(key) || 0) + 1);
    });
    
    teacherSlots.forEach(count => {
      if (count > 1) hardViolations += count - 1;
    });

    // Check for class conflicts (hard violation)
    const classSlots = new Map<string, number>();
    this.assignments.forEach(assignment => {
      const key = `${assignment.classId}_${assignment.timeSlotId}`;
      classSlots.set(key, (classSlots.get(key) || 0) + 1);
    });
    
    classSlots.forEach(count => {
      if (count > 1) hardViolations += count - 1;
    });

    // Check teacher workload limits (soft violation)
    this.teachers.forEach(teacher => {
      const workload = this.getTeacherCurrentWorkload(teacher.id);
      if (workload > teacher.maxWeeklyHours) {
        softViolations += workload - teacher.maxWeeklyHours;
      }
    });

    return { hard: hardViolations, soft: softViolations };
  }

  private calculateWorkloadBalance(): number {
    const workloads = this.teachers.map(teacher => 
      this.getTeacherCurrentWorkload(teacher.id)
    );
    
    if (workloads.length === 0) return 0;
    
    const avg = workloads.reduce((sum, w) => sum + w, 0) / workloads.length;
    const variance = workloads.reduce((sum, w) => sum + Math.pow(w - avg, 2), 0) / workloads.length;
    
    // Lower variance is better (more balanced)
    return Math.max(0, 100 - variance);
  }
}

export const schedulingEngine = new SchedulingEngine();