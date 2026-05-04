import React, { useState } from 'react';
import { Search, ArrowUpDown, Pencil, AlertCircle, Plus, X, Trash2 } from 'lucide-react';
import { Student } from '../types';
import { getGradeLevel } from '../utils/parser';

interface StudentTableProps {
  students: Student[];
  onUpdateStudent: (id: string, updated: Partial<Student>) => void;
  onAddStudent: () => void;
  onDeleteStudent: (id: string) => void;
}

export const StudentTable: React.FC<StudentTableProps> = ({ students, onUpdateStudent, onAddStudent, onDeleteStudent }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const sortStudents = (students: Student[]) => {
    if (!sortConfig) return students;

    return [...students].sort((a, b) => {
      let aVal: any = a[sortConfig.key as keyof Student];
      let bVal: any = b[sortConfig.key as keyof Student];

      if (sortConfig.key === 'className') {
        const aGrade = getGradeLevel(a.className);
        const bGrade = getGradeLevel(b.className);
        if (aGrade !== bGrade) {
            return sortConfig.direction === 'asc' ? parseInt(aGrade) - parseInt(bGrade) : parseInt(bGrade) - parseInt(aGrade);
        }
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const filteredStudents = sortStudents(
    students.filter(s =>
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.wishes.some(w => w.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Name oder Klasse suchen..."
            className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" /> Schüler:in hinzufügen
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm uppercase">
              <th className="px-6 py-3 cursor-pointer hover:bg-gray-100" onClick={() => requestSort('lastName')}>
                Name <ArrowUpDown className="inline w-4 h-4 ml-1" />
              </th>
              <th className="px-6 py-3 cursor-pointer hover:bg-gray-100" onClick={() => requestSort('className')}>
                Klasse <ArrowUpDown className="inline w-4 h-4 ml-1" />
              </th>
              <th className="px-6 py-3">Wünsche</th>
              <th className="px-6 py-3">Anti-Wünsche</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredStudents.map((student) => (
              <tr key={student.id} className="group hover:bg-blue-50 transition-colors relative">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    {student.fullName}
                    <button
                        className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-100 rounded"
                        onClick={() => setEditingId(student.id)}
                    >
                        <Pencil className="w-3 h-3 text-gray-500" />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4">{student.className}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-1">
                    {student.wishes.map((w, i) => (
                      <span key={i} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">{w}</span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1">
                    {student.antiWishes.map((w, i) => (
                      <span key={i} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">{w}</span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {student.errors.length > 0 ? (
                    <div className="flex items-center text-red-600 group/err relative">
                      <AlertCircle className="w-5 h-5 mr-1" />
                      <span className="text-sm font-medium">Problem</span>
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover/err:block bg-gray-900 text-white p-2 rounded text-xs w-48 z-10 shadow-lg">
                        {student.errors.join(', ')}
                      </div>
                    </div>
                  ) : (
                    <span className="text-green-600 text-sm font-medium">OK</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingId && (
          <StudentEditModal
            student={students.find(s => s.id === editingId)!}
            onClose={() => setEditingId(null)}
            onSave={(updated) => {
                onUpdateStudent(editingId, updated);
                setEditingId(null);
            }}
            onDelete={() => {
                onDeleteStudent(editingId);
                setEditingId(null);
            }}
          />
      )}
      {isAddModalOpen && (
          <StudentEditModal
            onClose={() => setIsAddModalOpen(false)}
            onSave={(newStudent) => {
                // Since handleAddStudent in App.tsx doesn't accept parameters yet,
                // we'll need to adapt how students are added.
                // For now, let's assume we use a specialized handler or onAddStudent.
                (onAddStudent as any)(newStudent);
                setIsAddModalOpen(false);
            }}
            isNew
          />
      )}
    </div>
  );
};

interface StudentEditModalProps {
    student?: Student;
    onClose: () => void;
    onSave: (updated: any) => void;
    onDelete?: () => void;
    isNew?: boolean;
}

const StudentEditModal: React.FC<StudentEditModalProps> = ({ student, onClose, onSave, onDelete, isNew }) => {
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [data, setData] = useState(student ? { ...student } : {
        firstName: '',
        lastName: '',
        className: '',
        wishes: ['', '', ''],
        antiWishes: ['', '', ''],
        didNotVote: false
    });

    const handleWishChange = (idx: number, val: string) => {
        const newWishes = [...(data.wishes || [])];
        newWishes[idx] = val;
        setData({ ...data, wishes: newWishes });
    };

    const handleAntiWishChange = (idx: number, val: string) => {
        const newAntiWishes = [...(data.antiWishes || [])];
        newAntiWishes[idx] = val;
        setData({ ...data, antiWishes: newAntiWishes });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{isNew ? 'Schüler:in hinzufügen' : 'Schüler:in bearbeiten'}</h3>
                    <button onClick={onClose}><X className="w-6 h-6" /></button>
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Vorname</label>
                            <input className="w-full border p-2 rounded" value={data.firstName} onChange={e => setData({...data, firstName: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nachname</label>
                            <input className="w-full border p-2 rounded" value={data.lastName} onChange={e => setData({...data, lastName: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Klasse</label>
                        <input className="w-full border p-2 rounded" value={data.className} onChange={e => setData({...data, className: e.target.value})} placeholder="z.B. 7c oder Q1a" />
                    </div>

                    <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-bold text-gray-700">Projektwünsche</label>
                            <button
                                onClick={() => setData({...data, didNotVote: !data.didNotVote, wishes: data.didNotVote ? ['', '', ''] : [], antiWishes: data.didNotVote ? ['', '', ''] : []})}
                                className={`text-xs px-2 py-1 rounded border transition-colors ${data.didNotVote ? 'bg-red-600 text-white border-red-600' : 'bg-gray-100 text-gray-600 border-gray-300'}`}
                            >
                                {data.didNotVote ? 'Nicht gewählt aktiv' : 'Nicht gewählt?'}
                            </button>
                        </div>
                        {!data.didNotVote && (
                            <div className="grid grid-cols-3 gap-2">
                                {[0, 1, 2].map(i => (
                                    <input
                                        key={i}
                                        placeholder={`Wunsch ${i+1}`}
                                        className="border p-2 rounded text-sm"
                                        value={data.wishes?.[i] || ''}
                                        onChange={e => handleWishChange(i, e.target.value)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {!data.didNotVote && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Projekt-Ausschlüsse (NICHT-Wünsche)</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[0, 1, 2].map(i => (
                                    <input
                                        key={i}
                                        placeholder={`Ausschluss ${i+1}`}
                                        className="border p-2 rounded text-sm"
                                        value={data.antiWishes?.[i] || ''}
                                        onChange={e => handleAntiWishChange(i, e.target.value)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4 pt-4">
                        {!isNew && onDelete && (
                            <button
                                className="px-4 py-2 text-red-600 border border-red-200 hover:bg-red-50 rounded"
                                onClick={() => setIsConfirmingDelete(true)}
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                        <button className="flex-grow bg-blue-600 text-white py-2 rounded font-bold" onClick={() => onSave(data)}>Speichern</button>
                        <button className="flex-grow border py-2 rounded" onClick={onClose}>Abbrechen</button>
                    </div>
                </div>
            </div>

            {isConfirmingDelete && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <h4 className="text-lg font-bold text-gray-900 mb-2">Schüler:in löschen?</h4>
                        <p className="text-sm text-gray-500 mb-6">
                            Möchten Sie <strong>{data.firstName} {data.lastName}</strong> wirklich unwiderruflich aus der Liste entfernen?
                        </p>
                        <div className="flex gap-3">
                            <button
                                className="flex-grow bg-red-600 text-white py-2 rounded font-bold hover:bg-red-700"
                                onClick={onDelete}
                            >
                                Ja, löschen
                            </button>
                            <button
                                className="flex-grow border border-gray-300 py-2 rounded font-medium hover:bg-gray-50"
                                onClick={() => setIsConfirmingDelete(false)}
                            >
                                Abbrechen
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
