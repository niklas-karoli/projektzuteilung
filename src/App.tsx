import { useState, useMemo, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { PrideHeart } from './components/PrideHeart';
import { StudentTable } from './components/StudentTable';
import { ProjectTable } from './components/ProjectTable';
import { LoadingAnimation } from './components/LoadingAnimation';
import { ResultsView } from './components/ResultsView';
import { Student, Project, AllocationState } from './types';
import { getGradeLevel, normalizeClassName } from './utils/parser';
import { allocate } from './utils/allocator';
import { generateExports } from './utils/exporter';

function App() {
  const [state, setState] = useState<AllocationState>({
    students: [],
    projects: [],
    isAllocated: false,
  });
  const [isCalculating, setIsCalculating] = useState(false);
  const [currentProblemIdx, setCurrentProblemIdx] = useState(0);

  const handleDataLoaded = (newStudents: Student[]) => {
    setState(prev => {
      const combined = [...prev.students, ...newStudents];
      const unique = Array.from(new Map(combined.map(s => [`${s.firstName}-${s.lastName}-${s.className}`, s])).values());

      const projectIds = new Set<string>();
      unique.forEach(s => {
        s.wishes.forEach(w => projectIds.add(w));
        s.antiWishes.forEach(aw => projectIds.add(aw));
      });

      const newProjects: Project[] = Array.from(projectIds)
        .sort((a, b) => {
            const numA = parseInt(a);
            const numB = parseInt(b);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            return a.localeCompare(b);
        })
        .map(id => {
            const existing = prev.projects.find(p => p.id === id);
            return existing || {
                id,
                maxParticipants: 20,
                allowedGrades: ["5", "6", "7", "8", "9", "10", "EF", "Q1", "Q2"],
                currentParticipants: 0
            };
        });

      return {
        ...prev,
        students: unique,
        projects: newProjects
      };
    });
  };

  const handleUpdateStudent = (id: string, updated: Partial<Student>) => {
    setState(prev => ({
        ...prev,
        students: prev.students.map(s => {
            if (s.id === id) {
                const newStudent = { ...s, ...updated };
                if (updated.className) {
                    newStudent.className = normalizeClassName(updated.className);
                }
                const errors = [];
                const classRegex = /^(EF|Q1|Q2|\d+)[a-z]*$/i;
                if (!classRegex.test(newStudent.className)) {
                    errors.push(`Ungültige Klasse: "${newStudent.className}"`);
                }
                const uniqueWishes = new Set(newStudent.wishes);
                if (uniqueWishes.size < newStudent.wishes.length) {
                    errors.push('Doppelte Projektwünsche angegeben.');
                }
                newStudent.wishes.forEach(w => {
                    if (newStudent.antiWishes.includes(w)) {
                        errors.push(`Projekt ${w} sowohl als Wunsch als auch als Ausschluss angegeben.`);
                    }
                });
                return { ...newStudent, errors, fullName: `${newStudent.firstName} ${newStudent.lastName}` };
            }
            return s;
        })
    }));
  };

  const handleDeleteStudent = (id: string) => {
    setState(prev => ({
        ...prev,
        students: prev.students.filter(s => s.id !== id)
    }));
  };

  const handleAddStudent = (studentData?: Partial<Student>) => {
      const id = `manual-${Date.now()}`;
      const className = normalizeClassName(studentData?.className || '5a');
      const newStudent: Student = {
          id,
          firstName: studentData?.firstName || 'Neue:r',
          lastName: studentData?.lastName || 'Schüler:in',
          fullName: `${studentData?.firstName || 'Neue:r'} ${studentData?.lastName || 'Schüler:in'}`,
          className,
          wishes: (studentData?.wishes || []).filter(Boolean),
          antiWishes: (studentData?.antiWishes || []).filter(Boolean),
          didNotVote: studentData?.didNotVote || false,
          errors: []
      };

      // Basic validation
      const classRegex = /^(EF|Q1|Q2|\d+)[a-z]*$/i;
      if (!classRegex.test(newStudent.className)) {
          newStudent.errors.push(`Ungültige Klasse: "${newStudent.className}"`);
      }

      setState(prev => ({ ...prev, students: [newStudent, ...prev.students] }));
  };

  const handleUpdateProject = (id: string, updated: Partial<Project>) => {
      setState(prev => ({
          ...prev,
          projects: prev.projects.map(p => p.id === id ? { ...p, ...updated } : p)
      }));
  };

  const handleDeleteProject = (id: string) => {
      setState(prev => ({
          ...prev,
          projects: prev.projects.filter(p => p.id !== id)
      }));
  };

  const handleAddProject = (projectData?: Partial<Project>) => {
      const newId = projectData?.id || String(Math.max(0, ...state.projects.map(p => parseInt(p.id)).filter(n => !isNaN(n))) + 1);
      setState(prev => ({
          ...prev,
          projects: [...prev.projects, {
              id: newId,
              maxParticipants: projectData?.maxParticipants || 20,
              allowedGrades: projectData?.allowedGrades || ["5", "6", "7", "8", "9", "10", "EF", "Q1", "Q2"],
              currentParticipants: 0
          }].sort((a, b) => {
              const numA = parseInt(a.id);
              const numB = parseInt(b.id);
              if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
              return a.id.localeCompare(b.id);
          })
      }));
  };

  const handleStartAllocation = () => {
      setIsCalculating(true);
      setTimeout(() => {
          const result = allocate(state.students, state.projects);
          setState(prev => ({
              ...prev,
              students: result.students,
              projects: result.projects,
              isAllocated: true
          }));
          setIsCalculating(false);
      }, 2000);
  };

  const handleManualOverride = (studentId: string, projectId: string) => {
      setState(prev => {
          const newStudents = prev.students.map(s => {
              if (s.id === studentId) {
                  const isConfirmed = !!projectId && projectId === s.recommendedProjectId;
                  return {
                      ...s,
                      assignedProjectId: projectId || undefined,
                      isRecommendationConfirmed: isConfirmed
                  };
              }
              return s;
          });
          const newProjects = prev.projects.map(p => ({
              ...p,
              currentParticipants: newStudents.filter(s => s.assignedProjectId === p.id).length
          }));
          return { ...prev, students: newStudents, projects: newProjects };
      });
  };

  const handleSaveState = () => {
      const data = JSON.stringify(state, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = state.isAllocated ? 'projektzuteilung_ergebnis.json' : 'projektzuteilung_speicherstand.json';
      link.click();
  };

  const handleDownloadZip = () => {
      generateExports(state.students, state.projects);
  };

  const handleJsonLoaded = (data: any) => {
      if (data.students && data.projects) {
          setState({
              students: data.students,
              projects: data.projects,
              isAllocated: !!data.isAllocated
          });
      }
  };

  const problems = state.students.filter(s => s.errors.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {isCalculating && <LoadingAnimation />}
      <header className="bg-white shadow-sm py-6 px-8 sticky top-0 z-40 flex justify-between items-center border-b">
        <h1 className="text-3xl font-bold text-gray-900">Projektzuteilung 2026</h1>
        <div className="flex gap-4">
            {state.students.length > 0 && !state.isAllocated && (
                <button onClick={handleSaveState} className="px-4 py-2 border rounded hover:bg-gray-50 transition-colors">Speichern</button>
            )}
            {state.isAllocated && (
                <button onClick={() => setState(prev => ({...prev, isAllocated: false}))} className="px-4 py-2 border rounded hover:bg-gray-50 transition-colors">Zurück zur Bearbeitung</button>
            )}
            {problems.length > 0 && !state.isAllocated && (
                <button
                    onClick={() => {
                        const allProblems = document.querySelectorAll('.text-red-600');
                        if (allProblems.length > 0) {
                            const nextIdx = currentProblemIdx % allProblems.length;
                            allProblems[nextIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
                            setCurrentProblemIdx(nextIdx + 1);
                        }
                    }}
                    className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors font-medium"
                >
                    <span className="mr-2">⚠️ {problems.length} Probleme</span>
                    <span className="text-xs bg-red-700 text-white px-1.5 py-0.5 rounded-full">Nächstes</span>
                </button>
            )}
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 pb-20 space-y-12">
        {state.students.length === 0 ? (
          <div className="max-w-2xl mx-auto mt-20">
            <FileUpload onDataLoaded={handleDataLoaded} onJsonLoaded={handleJsonLoaded} />
          </div>
        ) : state.isAllocated ? (
            <ResultsView
                students={state.students}
                projects={state.projects}
                onManualOverride={handleManualOverride}
                onUpdateStudent={handleUpdateStudent}
                onDownloadZip={handleDownloadZip}
                onSaveState={handleSaveState}
            />
        ) : (
          <>
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Übersicht</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 rounded">
                        <p className="text-sm text-blue-600 font-medium uppercase">Schüler:innen</p>
                        <p className="text-2xl font-bold">{state.students.length}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded">
                        <p className="text-sm text-green-600 font-medium uppercase">Projekte</p>
                        <p className="text-2xl font-bold">{state.projects.length}</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded">
                        <p className="text-sm text-red-600 font-medium uppercase">Probleme</p>
                        <p className="text-2xl font-bold">{problems.length}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded flex items-center justify-center">
                        <button className="w-full h-full text-blue-600 font-bold hover:underline" onClick={() => setState({students: [], projects: [], isAllocated: false})}>Neu starten</button>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">1. Schüler:innen & Wünsche</h2>
                <StudentTable
                    students={state.students}
                    onUpdateStudent={handleUpdateStudent}
                    onAddStudent={handleAddStudent}
                    onDeleteStudent={handleDeleteStudent}
                />
            </div>

            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">2. Projekte & Kapazitäten</h2>
                <ProjectTable
                    projects={state.projects}
                    onUpdateProject={handleUpdateProject}
                    onDeleteProject={handleDeleteProject}
                    onAddProject={handleAddProject}
                />
            </div>

            <div className="flex justify-center pt-8 flex-col items-center gap-2">
                {problems.length > 0 && (
                    <p className="text-red-500 text-sm font-medium">⚠️ Es gibt noch Probleme in der Datentabelle. Eine Zuteilung ist trotzdem möglich, kann aber unvollständig sein.</p>
                )}
                <button
                    onClick={handleStartAllocation}
                    className="px-12 py-4 rounded-full text-xl font-bold shadow-lg transition-all bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95"
                >
                    Zuteilung starten
                </button>
            </div>
          </>
        )}
      </main>

      <footer className="bg-white border-t py-6 text-center text-gray-500">
        proudly developed with love by Niklas Karoli <PrideHeart className="w-8 h-8 inline-block align-text-bottom ml-1" />
      </footer>
    </div>
  );
}

export default App;
