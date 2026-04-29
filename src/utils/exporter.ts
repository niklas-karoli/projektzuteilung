import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType, HeadingLevel } from "docx";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Student, Project } from "../types";
import { getGradeGroup, getGradeLevel } from "./parser";

export const generateExports = async (students: Student[], projects: Project[]) => {
  const zip = new JSZip();

  // 1. Overall allocation (Full)
  const fullData = students.map(s => [s.fullName, s.className, s.assignedProjectId || 'Keine', s.wishes.join(', '), s.antiWishes.join(', ')]);
  const fullHeaders = ['Name', 'Klasse', 'Projekt', 'Wünsche', 'Anti-Wünsche'];
  await addPdfAndDocx(zip, "Gesamte_Zuteilung_Voll", "Gesamte Projektzuteilung (Vollständig)", fullHeaders, fullData);

  // 2. Simple allocation
  const simpleData = students.map(s => [s.fullName, s.className, s.assignedProjectId || 'Keine']);
  const simpleHeaders = ['Name', 'Klasse', 'Projekt'];
  await addPdfAndDocx(zip, "Gesamte_Zuteilung_Kompakt", "Projektzuteilung", simpleHeaders, simpleData);

  // 3. By Project
  const projectFolder = zip.folder("Projekte");
  for (const p of projects) {
    const projectStudents = students.filter(s => s.assignedProjectId === p.id);
    const pData = projectStudents.map(s => [s.fullName, s.className]);
    const pHeaders = ['Name', 'Klasse'];
    await addPdfAndDocx(projectFolder!, `Projekt_${p.id}`, `Teilnehmerliste Projekt ${p.id}`, pHeaders, pData);
  }

  // 4. By Class
  const classFolder = zip.folder("Klassen");
  const classes = [...new Set(students.map(s => s.className))].sort();
  for (const c of classes) {
    const classStudents = students.filter(s => s.className === c).sort((a, b) => a.lastName.localeCompare(b.lastName));
    const cData = classStudents.map(s => [`${s.firstName} ${s.lastName}`, s.assignedProjectId || 'Keine']);
    const cHeaders = ['Name', 'Projekt'];
    await addPdfAndDocx(classFolder!, `Klasse_${c}`, `Projektliste Klasse ${c}`, cHeaders, cData);
  }

  // 5. By Grade Level (Stufen)
  const stufenFolder = zip.folder("Stufen");
  const groups: Record<string, string[]> = {
      "Unterstufe_5-6": ["5", "6"],
      "Mittelstufe_7-10": ["7", "8", "9", "10"],
      "Oberstufe_11-13": ["11", "12", "13", "EF", "Q1", "Q2"]
  };

  for (const [name, grades] of Object.entries(groups)) {
      const groupStudents = students.filter(s => grades.includes(getGradeLevel(s.className))).sort((a, b) => a.className.localeCompare(b.className) || a.lastName.localeCompare(b.lastName));
      if (groupStudents.length > 0) {
          const gData = groupStudents.map(s => [s.fullName, s.className, s.assignedProjectId || 'Keine']);
          const gHeaders = ['Name', 'Klasse', 'Projekt'];
          await addPdfAndDocx(stufenFolder!, name, `Projektliste ${name.replace('_', ' ')}`, gHeaders, gData);
      }
  }

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, "Projektzuteilung_2026_Export.zip");
};

async function addPdfAndDocx(folder: JSZip, filename: string, title: string, headers: string[], data: string[][]) {
  // PDF
  const doc = new jsPDF();
  doc.text(title, 14, 15);
  (doc as any).autoTable({
    head: [headers],
    body: data,
    startY: 20,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 }
  });
  folder.file(`${filename}.pdf`, doc.output('blob'));

  // DOCX
  const docx = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ text: title, heading: HeadingLevel.HEADING_1, spacing: { after: 200 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: headers.map(h => new TableCell({ children: [new Paragraph({ text: h, alignment: AlignmentType.CENTER })], shading: { fill: "EEEEEE" } }))
            }),
            ...data.map(row => new TableRow({
              children: row.map(cell => new TableCell({ children: [new Paragraph(cell)] }))
            }))
          ]
        })
      ]
    }]
  });
  const docxBlob = await Packer.toBlob(docx);
  folder.file(`${filename}.docx`, docxBlob);
}
