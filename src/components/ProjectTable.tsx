import React, { useState } from 'react';
import { Trash2, Plus, ArrowUpDown } from 'lucide-react';
import { Project } from '../types';

interface ProjectTableProps {
  projects: Project[];
  onUpdateProject: (id: string, updated: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
  onAddProject: () => void;
}

export const ProjectTable: React.FC<ProjectTableProps> = ({ projects, onUpdateProject, onDeleteProject, onAddProject }) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'id', direction: 'asc' });

  const sortedProjects = [...projects].sort((a, b) => {
    const numA = parseInt(a.id);
    const numB = parseInt(b.id);
    const valA = isNaN(numA) ? a.id : numA;
    const valB = isNaN(numB) ? b.id : numB;

    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const allGrades = ["5", "6", "7", "8", "9", "10", "EF", "Q1", "Q2"];

  const toggleGrade = (project: Project, grade: string) => {
      const newGrades = project.allowedGrades.includes(grade)
        ? project.allowedGrades.filter(g => g !== grade)
        : [...project.allowedGrades, grade];
      onUpdateProject(project.id, { allowedGrades: newGrades });
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-bold">Projekte konfigurieren</h2>
        <button
          onClick={onAddProject}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" /> Projekt hinzufügen
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm uppercase">
              <th className="px-6 py-3 cursor-pointer hover:bg-gray-100 w-24" onClick={() => requestSort('id')}>
                Nr. <ArrowUpDown className="inline w-4 h-4 ml-1" />
              </th>
              <th className="px-6 py-3 w-32">Max. Teilnehmer</th>
              <th className="px-6 py-3">Zugelassene Stufen</th>
              <th className="px-6 py-3 w-20 text-center">Aktion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedProjects.map((project) => (
              <tr key={project.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono font-bold">{project.id}</td>
                <td className="px-6 py-4">
                  <input
                    type="number"
                    min="1"
                    className="w-20 border rounded px-2 py-1"
                    value={project.maxParticipants}
                    onChange={(e) => onUpdateProject(project.id, { maxParticipants: parseInt(e.target.value) || 0 })}
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {allGrades.map(grade => (
                      <button
                        key={grade}
                        onClick={() => toggleGrade(project, grade)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          project.allowedGrades.includes(grade)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        {grade}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => onDeleteProject(project.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
