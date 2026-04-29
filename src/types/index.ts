export interface Student {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  className: string;
  wishes: string[];
  antiWishes: string[];
  assignedProjectId?: string;
  errors: string[];
}

export interface Project {
  id: string;
  maxParticipants: number;
  allowedGrades: string[]; // e.g. ["5", "6", "7", "8", "9", "10", "11", "12", "13"] or ["EF", "Q1", "Q2"]
  currentParticipants: number;
}

export interface AllocationState {
  students: Student[];
  projects: Project[];
  isAllocated: boolean;
}
