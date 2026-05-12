import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Student } from '../types';
import { normalizeClassName } from '../utils/parser';

interface MappingModalProps {
  headers: string[];
  sampleRow: any[];
  rawData: any[][];
  onClose: () => void;
  onConfirm: (students: Student[]) => void;
}

type MappingType = 'firstName' | 'lastName' | 'className' | 'wish' | 'antiWish' | 'ignore';

export const MappingModal: React.FC<MappingModalProps> = ({ headers, sampleRow, rawData, onClose, onConfirm }) => {
  const [mappings, setMappings] = useState<MappingType[]>(headers.map(header => {
      const h = header.toLowerCase();
      if (h.includes('vorname')) return 'firstName';
      if (h.includes('nachname')) return 'lastName';
      if (h.includes('klasse')) return 'className';
      if (h.includes('nicht') || h.includes('anti')) return 'antiWish';
      if (h.includes('wunsch')) return 'wish';
      return 'ignore';
  }));

  const handleMappingChange = (index: number, type: MappingType) => {
    const newMappings = [...mappings];
    newMappings[index] = type;
    setMappings(newMappings);
  };

  const isValid =
    mappings.includes('firstName') &&
    mappings.includes('lastName') &&
    mappings.includes('className');

  const handleConfirm = () => {
    if (!isValid) return;

    const firstNameIdx = mappings.indexOf('firstName');
    const lastNameIdx = mappings.indexOf('lastName');
    const classNameIdx = mappings.indexOf('className');
    const wishIndices = mappings.map((m, i) => m === 'wish' ? i : -1).filter(i => i !== -1);
    const antiWishIndices = mappings.map((m, i) => m === 'antiWish' ? i : -1).filter(i => i !== -1);

    const students: Student[] = rawData.map((row, rowIdx) => {
      const firstName = String(row[firstNameIdx] || '').trim();
      const lastName = String(row[lastNameIdx] || '').trim();
      const rawClassName = String(row[classNameIdx] || '').trim();
      const className = normalizeClassName(rawClassName);

      const wishes = wishIndices.map(idx => String(row[idx] || '').trim()).filter(Boolean);
      const antiWishes = antiWishIndices.map(idx => String(row[idx] || '').trim()).filter(Boolean);

      const errors: string[] = [];
      const classRegex = /^(EF|Q1|Q2|\d+)[a-z]*$/i;
      if (!classRegex.test(className)) {
        errors.push(`Ungültige Klasse: "${rawClassName}"`);
      }

      const uniqueWishes = new Set(wishes);
      if (uniqueWishes.size < wishes.length) {
        errors.push('Doppelte Projektwünsche angegeben.');
      }

      wishes.forEach(w => {
        if (antiWishes.includes(w)) {
          errors.push(`Projekt ${w} sowohl als Wunsch als auch als Ausschluss angegeben.`);
        }
      });

      return {
        id: `xlsx-${rowIdx}-${Date.now()}`,
        fullName: `${firstName} ${lastName}`,
        firstName,
        lastName,
        className,
        wishes,
        antiWishes,
        errors
      };
    });

    onConfirm(students);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">Spaltenzuordnung</h3>
            <p className="text-sm text-gray-500 mt-1">Bitte ordnen Sie die Spalten Ihrer Excel-Datei den entsprechenden Feldern zu.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="flex-grow overflow-auto p-6">
          {!isValid && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">
                <strong>Pflichtfelder fehlen:</strong> Bitte ordnen Sie mindestens <strong>Vorname</strong>, <strong>Nachname</strong> und <strong>Klasse</strong> zu.
              </p>
            </div>
          )}

          <div className="inline-block min-w-full align-middle border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {headers.map((header, idx) => (
                    <th key={idx} className="px-4 py-4 text-left">
                      <div className="flex flex-col gap-3">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider truncate max-w-[200px]" title={header}>
                          {header}
                        </span>
                        <select
                          className={`text-sm border rounded-md px-2 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow ${
                            mappings[idx] === 'ignore' ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-700 border-blue-200 font-medium'
                          }`}
                          value={mappings[idx]}
                          onChange={(e) => handleMappingChange(idx, e.target.value as MappingType)}
                        >
                          <option value="ignore">Ignorieren</option>
                          <option value="firstName">Vorname *</option>
                          <option value="lastName">Nachname *</option>
                          <option value="className">Klasse *</option>
                          <option value="wish">Wunsch</option>
                          <option value="antiWish">Anti-Wunsch</option>
                        </select>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr className="bg-blue-50/30">
                  {sampleRow.map((cell, idx) => (
                    <td key={idx} className="px-4 py-4 text-sm text-gray-600 italic">
                      {String(cell || '')}
                    </td>
                  ))}
                </tr>
                {rawData.slice(0, 3).map((row, rIdx) => (
                  <tr key={rIdx}>
                    {headers.map((_, cIdx) => (
                      <td key={cIdx} className="px-4 py-3 text-sm text-gray-400">
                        {String(row[cIdx] || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">Zeige Header, Beispielzeile und erste 3 Datensätze zur Orientierung.</p>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-white transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid}
            className={`px-8 py-2.5 rounded-lg font-bold text-white transition-all shadow-md ${
              isValid ? 'bg-blue-600 hover:bg-blue-700 active:scale-95' : 'bg-gray-300 cursor-not-allowed shadow-none'
            }`}
          >
            Daten importieren
          </button>
        </div>
      </div>
    </div>
  );
};
