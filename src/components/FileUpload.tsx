import React, { useState } from 'react';
import { Upload, FileType } from 'lucide-react';
import { Student } from '../types';
import * as XLSX from 'xlsx';
import { MappingModal } from './MappingModal';

interface FileUploadProps {
  onDataLoaded: (students: Student[]) => void;
  onJsonLoaded: (data: any) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, onJsonLoaded }) => {
  const [excelData, setExcelData] = useState<{ headers: string[], sampleRow: any[], rawData: any[][] } | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.json')) {
      const text = await file.text();
      try {
        const json = JSON.parse(text);
        onJsonLoaded(json);
      } catch (e) {
        console.error("Failed to parse JSON", e);
      }
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length > 0) {
          const headers = jsonData[0].map(h => String(h || ''));
          const sampleRow = jsonData.length > 1 ? jsonData[1] : [];
          const rawData = jsonData.slice(1);
          setExcelData({ headers, sampleRow, rawData });
        }
      };
      reader.readAsArrayBuffer(file);
    }

    // Reset input
    event.target.value = '';
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center p-12 border-3 border-dashed border-gray-300 rounded-2xl bg-white shadow-xl hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer relative group">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <Upload className="w-10 h-10 text-blue-600" />
        </div>
        <p className="text-xl font-bold text-gray-800">Daten importieren</p>
        <div className="flex gap-4 mt-4 text-sm font-medium">
          <span className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
            <FileType className="w-4 h-4 mr-1.5" /> Excel (.xlsx)
          </span>
          <span className="flex items-center text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            <FileType className="w-4 h-4 mr-1.5" /> Speicherstand (.json)
          </span>
        </div>
        <p className="text-sm text-gray-400 mt-6 italic">Wählen Sie eine Datei aus, um zu beginnen</p>
        <input
          type="file"
          accept=".xlsx,.xls,.json"
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={handleFileUpload}
        />
      </div>

      {excelData && (
        <MappingModal
          headers={excelData.headers}
          sampleRow={excelData.sampleRow}
          rawData={excelData.rawData}
          onClose={() => setExcelData(null)}
          onConfirm={(students) => {
            onDataLoaded(students);
            setExcelData(null);
          }}
        />
      )}
    </>
  );
};
