import React, { useState } from 'react';
import { Trash2, Plus, ArrowUpDown, X } from 'lucide-react';
import { Project } from '../types';

interface ProjectTableProps {
  projects: Project[];
  onUpdateProject: (id: string, updated: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
  onAddProject: (projectData?: Partial<Project>) => void;
}

export const ProjectTable: React.FC<ProjectTableProps> = ({ projects, onUpdateProject, onDeleteProject, onAddProject }) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'id', direction: 'asc' });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
          onClick={() => setIsAddModalOpen(true)}
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
              <th className="px-6 py-3 w-32">Max. Teilnehmer:innen</th>
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

      {isAddModalOpen && (
          <ProjectEditModal
            onClose={() => setIsAddModalOpen(false)}
            onSave={(newProject) => {
                onAddProject(newProject);
                setIsAddModalOpen(false);
            }}
            existingIds={projects.map(p => p.id)}
          />
      )}
    </div>
  );
};

const ProjectEditModal: React.FC<{ onClose: () => void; onSave: (p: Partial<Project>) => void; existingIds: string[] }> = ({ onClose, onSave, existingIds }) => {
    const [data, setData] = useState<Partial<Project>>({
        id: '',
        maxParticipants: 20,
        allowedGrades: ["5", "6", "7", "8", "9", "10", "EF", "Q1", "Q2"]
    });
    const [error, setError] = useState('');

    const allGrades = ["5", "6", "7", "8", "9", "10", "EF", "Q1", "Q2"];

    const toggleGrade = (grade: string) => {
        const newGrades = data.allowedGrades?.includes(grade)
            ? data.allowedGrades.filter(g => g !== grade)
            : [...(data.allowedGrades || []), grade];
        setData({ ...data, allowedGrades: newGrades });
    };

    const handleSave = () => {
        if (!data.id) {
            setError('Bitte Projektnummer angeben.');
            return;
        }
        if (existingIds.includes(data.id)) {
            setError('Projektnummer existiert bereits.');
            return;
        }
        onSave(data);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Projekt hinzufügen</h3>
                    <button onClick={onClose}><X className="w-6 h-6" /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Projektnummer</label>
                        <input
                            className={`w-full border p-2 rounded ${error ? 'border-red-500' : ''}`}
                            value={data.id}
                            onChange={e => { setData({...data, id: e.target.value}); setError(''); }}
                            placeholder="z.B. 42"
                        />
                        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Max. Teilnehmer:innen</label>
                        <input
                            type="number"
                            className="w-full border p-2 rounded"
                            value={data.maxParticipants}
                            onChange={e => setData({...data, maxParticipants: parseInt(e.target.value) || 0})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Zugelassene Stufen</label>
                        <div className="flex flex-wrap gap-1">
                            {allGrades.map(grade => (
                                <button
                                    key={grade}
                                    onClick={() => toggleGrade(grade)}
                                    className={`px-2 py-1 text-xs rounded transition-colors ${
                                        data.allowedGrades?.includes(grade)
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                    }`}
                                >
                                    {grade}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                        <button className="flex-grow bg-green-600 text-white py-2 rounded font-bold" onClick={handleSave}>Speichern</button>
                        <button className="flex-grow border py-2 rounded" onClick={onClose}>Abbrechen</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
