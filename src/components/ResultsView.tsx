import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, AlertTriangle, Info, Download, Save, ArrowUpDown, Check, X } from 'lucide-react';
import { Student, Project } from '../types';
import { getGradeLevel } from '../utils/parser';

interface ResultsViewProps {
  students: Student[];
  projects: Project[];
  onManualOverride: (studentId: string, projectId: string) => void;
  onUpdateStudent: (id: string, updated: Partial<Student>) => void;
  onDownloadZip: () => void;
  onSaveState: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ students, projects, onManualOverride, onUpdateStudent, onDownloadZip, onSaveState }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [overviewSort, setOverviewSort] = useState<'id' | 'percentage'>('percentage');

  const grades = ["5", "6", "7", "8", "9", "10", "EF", "Q1", "Q2"];

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedStudents = useMemo(() => {
    let filtered = students.filter(s => {
        const matchesSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              s.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (s.assignedProjectId || '').includes(searchTerm);
        const matchesProject = filterProject === 'all' || s.assignedProjectId === filterProject;
        const matchesGrade = filterGrade === 'all' || s.className.startsWith(filterGrade);
        return matchesSearch && matchesProject && matchesGrade;
    });

    if (!sortConfig) return filtered;

    return [...filtered].sort((a, b) => {
        let aVal: any = a[sortConfig.key as keyof Student];
        let bVal: any = b[sortConfig.key as keyof Student];

        if (sortConfig.key === 'className') {
            const aGrade = getGradeLevel(a.className);
            const bGrade = getGradeLevel(b.className);
            if (aGrade !== bGrade) {
                // Approximate sorting for EF/Q1/Q2
                const order = ["5", "6", "7", "8", "9", "10", "EF", "Q1", "Q2"];
                const aIdx = order.indexOf(aGrade);
                const bIdx = order.indexOf(bGrade);
                return sortConfig.direction === 'asc' ? aIdx - bIdx : bIdx - aIdx;
            }
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });
  }, [students, searchTerm, filterProject, filterGrade, sortConfig]);

  const getStatusIcon = (student: Student) => {
    if (student.isRecommendationConfirmed) return <Check className="w-4 h-4 text-blue-500" />;
    if (!student.assignedProjectId) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (student.wishes.includes(student.assignedProjectId)) return null;
    return <Info className="w-4 h-4 text-yellow-500" title="Nicht im Wunschprojekt" />;
  };

  const invalidVotes = sortedStudents.filter(s => s.errors.length > 0 && !s.assignedProjectId && !s.isRecommendationConfirmed);
  const didNotVote = sortedStudents.filter(s => s.didNotVote && !s.assignedProjectId && !s.isRecommendationConfirmed);
  const regularStudents = sortedStudents.filter(s => !invalidVotes.includes(s) && !didNotVote.includes(s));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-lg shadow">
          <div className="flex flex-wrap gap-4 flex-grow">
            <div className="relative max-w-xs flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                    className="pl-9 pr-4 py-2 w-full border rounded text-sm"
                    placeholder="Suchen..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <select className="border rounded px-3 py-2 text-sm" value={filterProject} onChange={e => setFilterProject(e.target.value)}>
                <option value="all">Alle Projekte</option>
                {projects.map(p => <option key={p.id} value={p.id}>Projekt {p.id}</option>)}
                <option value="">Keine Zuteilung</option>
            </select>
            <select className="border rounded px-3 py-2 text-sm" value={filterGrade} onChange={e => setFilterGrade(e.target.value)}>
                <option value="all">Alle Stufen</option>
                {grades.map(g => <option key={g} value={g}>{g}. Stufe</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={onSaveState} className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm font-medium">
                <Save className="w-4 h-4 mr-2" /> Speicherstand
            </button>
            <button onClick={onDownloadZip} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium">
                <Download className="w-4 h-4 mr-2" /> Export (ZIP)
            </button>
          </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                    <th className="px-6 py-3 cursor-pointer hover:bg-gray-100" onClick={() => requestSort('lastName')}>
                        Name <ArrowUpDown className="inline w-3 h-3 ml-1" />
                    </th>
                    <th className="px-6 py-3 cursor-pointer hover:bg-gray-100" onClick={() => requestSort('className')}>
                        Klasse <ArrowUpDown className="inline w-3 h-3 ml-1" />
                    </th>
                    <th className="px-6 py-3">Wünsche</th>
                    <th className="px-6 py-3">Anti-Wünsche</th>
                    <th className="px-6 py-3">Projekt (Ist)</th>
                    <th className="px-6 py-3">Status / Empfehlung</th>
                </tr>
            </thead>
            <tbody className="divide-y text-sm">
                {[
                    { title: 'Zuteilungen', students: regularStudents },
                    { title: 'Ungültige Wahl', students: invalidVotes },
                    { title: 'Nicht gewählt', students: didNotVote }
                ].map(group => (
                    <React.Fragment key={group.title}>
                        {group.students.length > 0 && (
                            <tr className="bg-gray-100 border-y">
                                <td colSpan={5} className="px-6 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">{group.title} ({group.students.length})</td>
                            </tr>
                        )}
                        {group.students.map(student => (
                            <tr key={student.id} className={`${student.isRecommendationConfirmed ? 'bg-blue-50 hover:bg-blue-100' : (student.assignedProjectId ? 'hover:bg-gray-50' : 'bg-red-50 hover:bg-red-100')}`}>
                                <td className="px-6 py-4 font-medium">{student.fullName}</td>
                                <td className="px-6 py-4">{student.className}</td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-1">
                                        {student.wishes.map(w => (
                                            <span key={w} className={`px-1.5 py-0.5 rounded text-[10px] ${student.assignedProjectId === w ? 'bg-green-600 text-white font-bold' : 'bg-gray-100 text-gray-600'}`}>{w}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-1">
                                        {student.antiWishes.map(w => (
                                            <span key={w} className="px-1.5 py-0.5 rounded text-[10px] bg-red-50 text-red-600">{w}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <select
                                        className={`border rounded px-2 py-1 text-xs font-bold ${!student.assignedProjectId ? 'border-red-500 text-red-600' : ''}`}
                                        value={student.assignedProjectId || ''}
                                        onChange={e => onManualOverride(student.id, e.target.value)}
                                    >
                                        <option value="">- Nicht zugeteilt -</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>Projekt {p.id}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(student)}
                                        {!student.assignedProjectId && student.recommendedProjectId && !student.isRecommendationConfirmed && (
                                            <div className="flex items-center gap-2 bg-white border rounded px-2 py-1 shadow-sm">
                                                <span className="text-xs text-gray-600">Empfehlung: <strong>{student.recommendedProjectId}</strong></span>
                                                <button
                                                    onClick={() => onManualOverride(student.id, student.recommendedProjectId!)}
                                                    className="p-1 hover:bg-green-100 text-green-600 rounded"
                                                    title="Empfehlung übernehmen"
                                                >
                                                    <Check className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                        {student.isRecommendationConfirmed && (
                                            <button
                                                onClick={() => onManualOverride(student.id, '')}
                                                className="text-[10px] text-blue-600 hover:underline flex items-center"
                                            >
                                                <X className="w-2 h-2 mr-1" /> Rückgängig
                                            </button>
                                        )}
                                        {!student.assignedProjectId && !student.recommendedProjectId && <span className="text-red-600 font-bold">Wunsch nicht möglich</span>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </React.Fragment>
                ))}
            </tbody>
        </table>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="font-bold">Projektübersicht & Auslastung</h3>
              <div className="flex gap-4">
                  <div className="flex bg-gray-200 p-0.5 rounded-lg">
                      <button
                        onClick={() => setOverviewSort('percentage')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${overviewSort === 'percentage' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Nach Füllgrad
                      </button>
                      <button
                        onClick={() => setOverviewSort('id')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${overviewSort === 'id' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Nach Nummer
                      </button>
                  </div>
                  <select className="border rounded px-2 py-1 text-sm" onChange={e => setExpandedProject(e.target.value)} value={expandedProject || ''}>
                      <option value="">Teilnehmer:innen anzeigen...</option>
                      {projects.map(p => <option key={p.id} value={p.id}>Projekt {p.id}</option>)}
                  </select>
              </div>
          </div>

          <div className="p-6">
              <div className="grid gap-6">
                  {[...projects]
                    .sort((a, b) => {
                        if (overviewSort === 'percentage') {
                            const percA = a.currentParticipants / a.maxParticipants;
                            const percB = b.currentParticipants / b.maxParticipants;
                            return percB - percA;
                        }
                        const numA = parseInt(a.id);
                        const numB = parseInt(b.id);
                        return (isNaN(numA) || isNaN(numB)) ? a.id.localeCompare(b.id) : numA - numB;
                    })
                    .map(p => {
                      const percentage = Math.min(100, (p.currentParticipants / p.maxParticipants) * 100);
                      const isOverfilled = p.currentParticipants > p.maxParticipants;

                      return (
                          <div key={p.id} className={`border rounded-xl p-4 transition-all ${expandedProject === p.id ? 'ring-2 ring-blue-500 bg-blue-50/30' : 'hover:bg-gray-50'}`}>
                              <div className="flex flex-wrap justify-between items-start gap-4 mb-3">
                                  <div className="flex items-center gap-3">
                                      <div className="bg-gray-800 text-white font-bold w-10 h-10 rounded-lg flex items-center justify-center text-lg shadow-sm">
                                          {p.id}
                                      </div>
                                      <div>
                                          <div className="flex items-center gap-2">
                                              <h4 className="font-bold text-gray-800">Projekt {p.id}</h4>
                                              <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                                                  {p.allowedGrades.join(', ')}
                                              </span>
                                          </div>
                                          <p className="text-xs text-gray-500">
                                              {p.currentParticipants} von {p.maxParticipants} Plätzen belegt
                                          </p>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <span className={`text-xl font-black ${isOverfilled ? 'text-red-600' : 'text-blue-600'}`}>
                                          {Math.round(percentage)}%
                                      </span>
                                  </div>
                              </div>

                              <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                                  <div
                                      className={`absolute left-0 top-0 h-full transition-all duration-700 ease-out rounded-full ${
                                          isOverfilled ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                                          percentage > 80 ? 'bg-amber-500' : 'bg-green-500'
                                      }`}
                                      style={{ width: `${percentage}%` }}
                                  />
                              </div>

                              {expandedProject === p.id && (
                                  <div className="mt-6 pt-4 border-t border-blue-100 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 animate-in fade-in slide-in-from-top-2">
                                      {students
                                        .filter(s => s.assignedProjectId === p.id)
                                        .map(s => (
                                          <div key={s.id} className="text-[10px] p-2 bg-white rounded shadow-sm border border-blue-100 flex justify-between gap-2">
                                              <span className="font-medium truncate">{s.fullName}</span>
                                              <span className="text-blue-600 font-bold shrink-0">{s.className}</span>
                                          </div>
                                      ))}
                                      {p.currentParticipants === 0 && (
                                          <div className="col-span-full py-4 text-center text-gray-400 italic text-sm">
                                              Noch keine Teilnehmer:innen zugeteilt.
                                          </div>
                                      )}
                                  </div>
                              )}
                          </div>
                      );
                  })}
              </div>
          </div>
      </div>
    </div>
  );
};
