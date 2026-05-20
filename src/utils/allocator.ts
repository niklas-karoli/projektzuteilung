import { Student, Project } from '../types';
import { getGradeLevel, getGradeGroup } from './parser';
import _ from 'lodash';

export const allocate = (students: Student[], projects: Project[]) => {
  const resultStudents = students.map(s => ({
    ...s,
    assignedProjectId: undefined as string | undefined,
    recommendedProjectId: undefined as string | undefined,
    isRecommendationConfirmed: false
  }));
  const projectMap = new Map(projects.map(p => [p.id, { ...p, currentStudents: [] as string[] }]));

  // Separate students into groups
  const studentsWithWishes = resultStudents.filter(s => s.wishes.length > 0 && !s.didNotVote && s.errors.length === 0);
  const studentsWithErrors = resultStudents.filter(s => (s.wishes.length === 0 || s.didNotVote || s.errors.length > 0));

  // Calculate demand for each project (based on valid wishes)
  const demand = new Map<string, number>();
  studentsWithWishes.forEach(s => {
    s.wishes.forEach(w => demand.set(w, (demand.get(w) || 0) + 1));
  });

  // Rarity: higher means fewer people want this project relative to its capacity
  const rarity = new Map<string, number>();
  projects.forEach(p => {
    const votes = demand.get(p.id) || 0;
    // Projects with 0 votes are "infinitely rare" for the purpose of prioritization
    rarity.set(p.id, votes > 0 ? p.maxParticipants / votes : 999);
  });

  const getBalanceScore = (student: Student, project: any) => {
    let score = 0;

    // Grade balance score
    const gradeGroup = getGradeGroup(getGradeLevel(student.className));
    const groupCount = project.currentStudents.filter((sid: string) => {
      const s = resultStudents.find(st => st.id === sid);
      return s && getGradeGroup(getGradeLevel(s.className)) === gradeGroup;
    }).length;

    // Penalty for over-representing a grade group (stronger penalty as it gets full)
    score -= (groupCount / project.maxParticipants) * 15;

    // Class balance score
    const classCount = project.currentStudents.filter((sid: string) => {
      const s = resultStudents.find(st => st.id === sid);
      return s && s.className === student.className;
    }).length;

    // Penalty for over-representing a class
    score -= (classCount / project.maxParticipants) * 25;

    // Fill level penalty: Prefer projects that are less full
    score -= (project.currentStudents.length / project.maxParticipants) * 20;

    return score;
  };

  const getScore = (student: Student, project: any) => {
    let score = getBalanceScore(student, project);

    // Rarity bonus: Prioritize filling projects that have low demand
    // This is only used in the first pass for students with wishes.
    score += (rarity.get(project.id) || 0) * 10;

    return score;
  };

  // Multiple passes to maximize satisfaction
  const passes = 10;
  let bestStudents = [...resultStudents];
  let maxAssigned = -1;

  for (let i = 0; i < passes; i++) {
    // Reset state for this pass
    projectMap.forEach(p => p.currentStudents = []);
    resultStudents.forEach(s => s.assignedProjectId = undefined);

    let shuffledWishes = _.shuffle(studentsWithWishes);

    // Sort students by "difficulty" - those with wishes for full/rare projects first?
    // Actually, user wants equal weight for wishes 1, 2, 3.

    shuffledWishes.forEach(student => {
      const availableWishes = student.wishes
        .map(w => projectMap.get(w))
        .filter(p => p && p.currentStudents.length < p.maxParticipants && p.allowedGrades.includes(getGradeLevel(student.className)));

      if (availableWishes.length > 0) {
        // Evaluate each valid wish
        const scoredWishes = availableWishes.map(p => ({
          project: p,
          score: getScore(student, p)
        }));

        const best = _.maxBy(scoredWishes, 'score');
        if (best) {
          best.project.currentStudents.push(student.id);
          student.assignedProjectId = best.project.id;
        }
      }
    });

    const currentAssigned = resultStudents.filter(s => s.assignedProjectId).length;
    if (currentAssigned > maxAssigned) {
      maxAssigned = currentAssigned;
      bestStudents = _.cloneDeep(resultStudents);
    }

    if (maxAssigned === studentsWithWishes.length) break; // Perfect allocation
  }

  // Restore best allocation
  const finalStudents = bestStudents;
  const finalProjectMap = new Map(projects.map(p => [p.id, { ...p, currentStudents: finalStudents.filter(s => s.assignedProjectId === p.id).map(s => s.id) }]));

  // Pass 2: Fill gaps with students who have errors, no votes, or couldn't get their wishes
  // Shuffling filler students to ensure fair distribution of the remaining slots
  const fillerStudents = _.shuffle(finalStudents.filter(s => !s.assignedProjectId));

  // Virtual tracking of participants to ensure we don't over-recommend to a single project
  // and to maintain balance in the second pass.
  const virtualProjectMap = new Map(
    Array.from(finalProjectMap.entries()).map(([id, p]) => [
      id,
      { ...p, currentStudents: [...p.currentStudents] }
    ])
  );

  fillerStudents.forEach(student => {
    // Recommendation logic: find a project that is:
    // 1. Not an anti-wish
    // 2. Has space (respecting virtual capacity)
    // 3. Fits grade level

    const candidates = Array.from(virtualProjectMap.values())
      .filter(p => {
        return p.currentStudents.length < p.maxParticipants &&
               p.allowedGrades.includes(getGradeLevel(student.className)) &&
               !student.antiWishes.includes(p.id);
      });

    if (candidates.length > 0) {
      // Score candidates for this filler
      const scoredCandidates = candidates.map(p => {
        const fillPercentage = p.currentStudents.length / p.maxParticipants;

        // Primary priority: Projects with the lowest percentage of filled capacity
        // We use a very high weight for this to ensure even distribution across all available slots.
        let score = (1 - fillPercentage) * 10000;

        // Secondary priority: Grade and class balance
        // We use getBalanceScore to avoid rarity bonus overriding the fill percentage logic.
        score += getBalanceScore(student, p);

        return { project: p, score };
      });

      const best = _.maxBy(scoredCandidates, 'score');
      if (best) {
        student.recommendedProjectId = best.project.id;
        // Update virtual capacity so the next filler sees this slot as taken
        const vp = virtualProjectMap.get(best.project.id);
        if (vp) {
          vp.currentStudents.push(student.id);
        }
      }
    }
  });

  return {
    students: finalStudents,
    projects: projects.map(p => ({
      ...p,
      originalDemand: demand.get(p.id) || 0,
      currentParticipants: finalProjectMap.get(p.id)?.currentStudents.length || 0
    }))
  };
};

export const allocateLateVotes = (students: Student[], projects: Project[]) => {
  // Respect existing assignments
  const resultStudents = students.map(s => {
    if (s.assignedProjectId && !s.recommendedProjectId) {
      // Already assigned to a wish project, keep it fixed
      return { ...s };
    }
    // Recommendations or unassigned students are reset for the late vote round
    return {
      ...s,
      assignedProjectId: undefined,
      recommendedProjectId: undefined,
      isRecommendationConfirmed: false
    };
  });

  const projectMap = new Map(projects.map(p => {
    const assignedIds = resultStudents.filter(s => s.assignedProjectId === p.id).map(s => s.id);
    return [p.id, { ...p, currentStudents: assignedIds }];
  }));

  // Late voters are those who were unassigned or are new (all who don't have a fixed assignedProjectId now)
  const lateVoters = resultStudents.filter(s => !s.assignedProjectId);
  const lateVotersWithWishes = lateVoters.filter(s => s.wishes.length > 0 && !s.didNotVote && s.errors.length === 0);

  // Rarity based on ORIGINAL demand
  const rarity = new Map<string, number>();
  projects.forEach(p => {
    const votes = p.originalDemand || 0;
    rarity.set(p.id, votes > 0 ? p.maxParticipants / votes : 999);
  });

  const getBalanceScore = (student: Student, project: any) => {
    let score = 0;
    const gradeGroup = getGradeGroup(getGradeLevel(student.className));
    const groupCount = project.currentStudents.filter((sid: string) => {
      const s = resultStudents.find(st => st.id === sid);
      return s && getGradeGroup(getGradeLevel(s.className)) === gradeGroup;
    }).length;
    score -= (groupCount / project.maxParticipants) * 15;
    const classCount = project.currentStudents.filter((sid: string) => {
      const s = resultStudents.find(st => st.id === sid);
      return s && s.className === student.className;
    }).length;
    score -= (classCount / project.maxParticipants) * 25;
    score -= (project.currentStudents.length / project.maxParticipants) * 1000; // Strong fill level penalty
    return score;
  };

  // Allocation loop for late voters with wishes
  const passes = 10;
  let bestStudents = [...resultStudents];
  let maxAssigned = -1;

  for (let i = 0; i < passes; i++) {
    // Reset state for this pass (only for late voters)
    projectMap.forEach(p => {
      const originalAssigned = resultStudents.filter(s => s.assignedProjectId === p.id && !s.recommendedProjectId).map(s => s.id);
      p.currentStudents = originalAssigned;
    });
    resultStudents.forEach(s => {
      if (s.recommendedProjectId || !s.assignedProjectId) s.assignedProjectId = undefined;
    });

    let shuffledLateVoters = _.shuffle(lateVotersWithWishes);

    shuffledLateVoters.forEach(student => {
      const availableWishes = student.wishes
        .map(w => projectMap.get(w))
        .filter(p => p && p.currentStudents.length < p.maxParticipants && p.allowedGrades.includes(getGradeLevel(student.className)));

      if (availableWishes.length > 0) {
        const scoredWishes = availableWishes.map(p => {
          let score = getBalanceScore(student, p);
          // Rarity bonus based on ORIGINAL demand
          score += (rarity.get(p.id) || 0) * 10;
          return { project: p, score };
        });

        const best = _.maxBy(scoredWishes, 'score');
        if (best) {
          best.project.currentStudents.push(student.id);
          student.assignedProjectId = best.project.id;
        }
      }
    });

    const currentAssigned = resultStudents.filter(s => s.assignedProjectId).length;
    if (currentAssigned > maxAssigned) {
      maxAssigned = currentAssigned;
      bestStudents = _.cloneDeep(resultStudents);
    }
  }

  // Restore best allocation
  const finalStudents = bestStudents;
  const finalProjectMap = new Map(projects.map(p => [p.id, { ...p, currentStudents: finalStudents.filter(s => s.assignedProjectId === p.id).map(s => s.id) }]));

  // Recommendations for remaining filler students (including those who didn't vote in late vote)
  const fillerStudents = _.shuffle(finalStudents.filter(s => !s.assignedProjectId));
  const virtualProjectMap = new Map(
    Array.from(finalProjectMap.entries()).map(([id, p]) => [
      id,
      { ...p, currentStudents: [...p.currentStudents] }
    ])
  );

  fillerStudents.forEach(student => {
    const candidates = Array.from(virtualProjectMap.values())
      .filter(p => {
        return p.currentStudents.length < p.maxParticipants &&
               p.allowedGrades.includes(getGradeLevel(student.className)) &&
               !student.antiWishes.includes(p.id);
      });

    if (candidates.length > 0) {
      const scoredCandidates = candidates.map(p => {
        const fillPercentage = p.currentStudents.length / p.maxParticipants;
        let score = (1 - fillPercentage) * 10000;
        score += getBalanceScore(student, p);
        return { project: p, score };
      });

      const best = _.maxBy(scoredCandidates, 'score');
      if (best) {
        student.recommendedProjectId = best.project.id;
        const vp = virtualProjectMap.get(best.project.id);
        if (vp) vp.currentStudents.push(student.id);
      }
    }
  });

  return {
    students: finalStudents,
    projects: projects.map(p => ({
      ...p,
      currentParticipants: finalProjectMap.get(p.id)?.currentStudents.length || 0
    }))
  };
};
