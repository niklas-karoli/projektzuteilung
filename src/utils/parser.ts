import { Student } from '../types';

export const parseHtmlTable = (html: string): Student[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const rows = Array.from(doc.querySelectorAll('tr'));

  if (rows.length < 2) return [];

  const headers = Array.from(rows[0].querySelectorAll('th, td')).map(cell => cell.textContent?.trim() || '');

  // Find indices based on headers
  const fullNameIdx = headers.indexOf('Vollständiger Name');
  const firstNameIdx = headers.indexOf('Vorname');
  const lastNameIdx = headers.indexOf('Nachname');
  const classIdx = headers.indexOf('Klasse');

  // Find multiple "Projektwunsch" indices
  const wishIndices: number[] = [];
  headers.forEach((header, idx) => {
    if (header === 'Projektwunsch' || header === 'Wunschprojekt') {
      wishIndices.push(idx);
    }
  });

  // Find multiple "NICHT" indices
  const antiWishIndices: number[] = [];
  headers.forEach((header, idx) => {
    if (header.toLowerCase().includes('nicht')) {
      antiWishIndices.push(idx);
    }
  });

  return rows.slice(1).map((row, rowIdx) => {
    const cells = Array.from(row.querySelectorAll('td')).map(cell => cell.textContent?.trim() || '');

    const wishes = wishIndices.map(idx => cells[idx]).filter(Boolean);
    const antiWishes = antiWishIndices.map(idx => cells[idx]).filter(Boolean);
    const className = cells[classIdx] || '';

    const errors: string[] = [];

    // Check for duplicate wishes
    const uniqueWishes = new Set(wishes);
    if (uniqueWishes.size < wishes.length) {
      errors.push('Doppelte Projektwünsche angegeben.');
    }

    // Check if anti-wish is also a wish
    wishes.forEach(w => {
      if (antiWishes.includes(w)) {
        errors.push(`Projekt ${w} sowohl als Wunsch als auch als Ausschluss angegeben.`);
      }
    });

    // Simple class validation (Number + Letter or EF/Q1/Q2)
    const classRegex = /^(\d+|EF|Q1|Q2)[a-zA-Z]?$/i;
    if (!classRegex.test(className.replace(/\s/g, ''))) {
      errors.push(`Ungültige Klasse: "${className}"`);
    }

    return {
      id: `${className}-${cells[lastNameIdx]}-${cells[firstNameIdx]}-${rowIdx}`,
      fullName: cells[fullNameIdx] || `${cells[firstNameIdx]} ${cells[lastNameIdx]}`,
      firstName: cells[firstNameIdx] || '',
      lastName: cells[lastNameIdx] || '',
      className,
      wishes,
      antiWishes,
      errors
    };
  });
};

export const getGradeLevel = (className: string): string => {
  const match = className.match(/^(\d+|EF|Q1|Q2)/i);
  if (!match) return 'unknown';
  const val = match[1].toUpperCase();
  if (val === 'EF') return '11';
  if (val === 'Q1') return '12';
  if (val === 'Q2') return '13';
  return val;
};

export const getGradeGroup = (grade: string): 'unter' | 'mittel' | 'ober' | 'unknown' => {
  const g = parseInt(grade);
  if (isNaN(g)) {
     if (['11', '12', '13', 'EF', 'Q1', 'Q2'].includes(grade.toUpperCase())) return 'ober';
     return 'unknown';
  }
  if (g <= 6) return 'unter';
  if (g <= 10) return 'mittel';
  return 'ober';
};
