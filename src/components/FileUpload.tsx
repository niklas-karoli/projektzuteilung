import React, { useCallback } from 'react';
import { Upload } from 'lucide-react';
import { parseHtmlTable } from '../utils/parser';
import { Student } from '../types';

interface FileUploadProps {
  onDataLoaded: (students: Student[]) => void;
  onJsonLoaded: (data: any) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, onJsonLoaded }) => {
  const handleHtmlUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    let allStudents: Student[] = [];

    for (let i = 0; i < files.length; i++) {
      const text = await files[i].text();
      if (files[i].name.endsWith('.json')) {
          try {
              const json = JSON.parse(text);
              onJsonLoaded(json);
              return;
          } catch(e) {
              console.error("Failed to parse JSON", e);
          }
      } else {
          const students = parseHtmlTable(text);
          allStudents = [...allStudents, ...students];
      }
    }

    if (allStudents.length > 0) {
        onDataLoaded(allStudents);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-white shadow-sm hover:border-blue-400 transition-colors cursor-pointer relative">
      <Upload className="w-12 h-12 text-gray-400 mb-4" />
      <p className="text-lg font-medium text-gray-700">HTML-Dateien (Wahlen) oder Speicherstand (.json) hochladen</p>
      <p className="text-sm text-gray-500 mt-2">Mehrere Dateien gleichzeitig möglich</p>
      <input
        type="file"
        multiple
        accept=".html,.json"
        className="absolute inset-0 opacity-0 cursor-pointer"
        onChange={handleHtmlUpload}
      />
    </div>
  );
};
