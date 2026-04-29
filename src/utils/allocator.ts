import { Student, Project } from '../types';
import { getGradeLevel, getGradeGroup } from './parser';
import _ from 'lodash';

export const allocate = (students: Student[], projects: Project[]) => {
  const resultStudents = students.map(s => ({ ...s, assignedProjectId: undefined as string | undefined }));
  const projectMap = new Map(projects.map(p => [p.id, { ...p, currentStudents: [] as string[] }]));

  // Calculate demand for each project
  const demand = new Map<string, number>();
  students.forEach(s => {
    s.wishes.forEach(w => demand.set(w, (demand.get(w) || 0) + 1));
  });

  // Calculate rarity weight: Higher means we should prioritize filling this project
  const rarity = new Map<string, number>();
  projects.forEach(p => {
    const votes = demand.get(p.id) || 0;
    rarity.set(p.id, votes > 0 ? p.maxParticipants / votes : 0);
  });

  // Shuffle students for fairness
  let shuffledStudents = _.shuffle(resultStudents);

  const assign = (student: Student, projectId: string) => {
    const p = projectMap.get(projectId);
    if (!p) return false;
    if (p.currentStudents.length >= p.maxParticipants) return false;

    // Check grade level restriction
    const grade = getGradeLevel(student.className);
    if (!p.allowedGrades.includes(grade)) return false;

    // Check anti-wishes
    if (student.antiWishes.includes(projectId)) return false;

    p.currentStudents.push(student.id);
    return true;
  };

  // Pass 1: Try to satisfy students with "rare" project wishes first
  // Sort students by the "max rarity" of their wishes
  shuffledStudents.sort((a, b) => {
      const maxRarityA = Math.max(...a.wishes.map(w => rarity.get(w) || 0));
      const maxRarityB = Math.max(...b.wishes.map(w => rarity.get(w) || 0));
      return maxRarityB - maxRarityA;
  });

  const tryAssign = (student: any) => {
      // Find best wish based on balance
      const availableWishes = student.wishes
        .map((w: string) => projectMap.get(w))
        .filter((p: any) => p && p.currentStudents.length < p.maxParticipants && p.allowedGrades.includes(getGradeLevel(student.className)));

      if (availableWishes.length === 0) return false;

      // Score each wish
      const scoredWishes = availableWishes.map((p: any) => {
          let score = 0;

          // Grade balance score
          const gradeGroup = getGradeGroup(getGradeLevel(student.className));
          const groupCount = p.currentStudents.filter((sid: string) => {
              const s = students.find(st => st.id === sid);
              return s && getGradeGroup(getGradeLevel(s.className)) === gradeGroup;
          }).length;

          // Penalty for over-representing a grade group
          score -= (groupCount / p.maxParticipants) * 10;

          // Class balance score
          const classCount = p.currentStudents.filter((sid: string) => {
              const s = students.find(st => st.id === sid);
              return s && s.className === student.className;
          }).length;

          // Penalty for over-representing a class
          score -= (classCount / p.maxParticipants) * 20;

          // Rarity bonus
          score += (rarity.get(p.id) || 0) * 5;

          return { project: p, score };
      });

      const best = _.maxBy(scoredWishes, 'score');
      if (best) {
          best.project.currentStudents.push(student.id);
          student.assignedProjectId = best.project.id;
          return true;
      }
      return false;
  };

  shuffledStudents.forEach(s => tryAssign(s));

  return {
    students: resultStudents,
    projects: projects.map(p => ({
        ...p,
        currentParticipants: projectMap.get(p.id)?.currentStudents.length || 0
    }))
  };
};
