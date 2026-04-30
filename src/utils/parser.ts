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
    const rawClassName = cells[classIdx] || '';
    const className = normalizeClassName(rawClassName);

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
    const classRegex = /^(EF|Q1|Q2|\d+)[a-z]*$/i;
    if (!classRegex.test(className)) {
      errors.push(`Ungültige Klasse: "${rawClassName}"`);
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

export const normalizeClassName = (className: string): string => {
  const trimmed = className.replace(/\s+/g, '');
  const match = trimmed.match(/^(\d+)([a-zA-Z]*)$/i);
  if (match) {
    const num = parseInt(match[1]);
    const suffix = match[2].toLowerCase();
    if (num === 11) return `EF${suffix}`;
    if (num === 12) return `Q1${suffix}`;
    if (num === 13) return `Q2${suffix}`;
    return `${num}${suffix}`;
  }
  // For EF, Q1, Q2 already present, just normalize suffix
  const matchSpecial = trimmed.match(/^(EF|Q1|Q2)([a-zA-Z]*)$/i);
  if (matchSpecial) {
    return `${matchSpecial[1].toUpperCase()}${matchSpecial[2].toLowerCase()}`;
  }
  return trimmed;
};

export const getGradeLevel = (className: string): string => {
  const match = className.match(/^(EF|Q1|Q2|\d+)/i);
  if (!match) return 'unknown';
  const val = match[1].toUpperCase();
  return val;
};

export const getGradeGroup = (grade: string): 'unter' | 'mittel' | 'ober' | 'unknown' => {
  if (['EF', 'Q1', 'Q2'].includes(grade.toUpperCase())) return 'ober';
  const g = parseInt(grade);
  if (isNaN(g)) return 'unknown';
  if (g <= 6) return 'unter';
  if (g <= 10) return 'mittel';
  return 'ober';
};
