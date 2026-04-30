import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType, HeadingLevel } from "docx";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Student, Project } from "../types";
import { getGradeLevel } from "./parser";

export const generateExports = async (students: Student[], projects: Project[]) => {
  const zip = new JSZip();

  // 1. Overall allocation (Root)
  const fullData = students.map(s => [s.fullName, s.className, s.assignedProjectId || 'Keine', s.wishes.join(', '), s.antiWishes.join(', ')]);
  const fullHeaders = ['Name', 'Klasse', 'Projekt', 'Wünsche', 'Anti-Wünsche'];
  await addPdfAndDocx(zip, "Gesamte_Zuteilung", "Gesamte Projektzuteilung", fullHeaders, fullData);

  // 2. By Class (Folder: klasse)
  const classFolder = zip.folder("klasse");
  const classes = [...new Set(students.map(s => s.className))].sort((a, b) => {
    // Custom sort for classes: 5a, 5b, ... 10c, EFa, Q1a
    const getSortVal = (c: string) => {
        const level = getGradeLevel(c);
        const suffix = c.replace(level, '').toLowerCase();
        let levelNum = parseInt(level);
        if (level === 'EF') levelNum = 11;
        if (level === 'Q1') levelNum = 12;
        if (level === 'Q2') levelNum = 13;
        return levelNum * 100 + suffix.charCodeAt(0);
    };
    return getSortVal(a) - getSortVal(b);
  });

  for (const c of classes) {
    const classStudents = students.filter(s => s.className === c).sort((a, b) => a.lastName.localeCompare(b.lastName));
    const cData = classStudents.map(s => [`${s.firstName} ${s.lastName}`, s.assignedProjectId || 'Keine']);
    const cHeaders = ['Schüler:in', 'Zugeordnetes Projekt'];
    await addPdfAndDocx(classFolder!, `Klasse_${c}`, `Projektliste Klasse ${c}`, cHeaders, cData);
  }

  // 3. By Grade Level (Folder: stufe)
  const stufenFolder = zip.folder("stufe");
  const allGrades = [...new Set(students.map(s => getGradeLevel(s.className)))].sort((a, b) => {
      const order = ["5", "6", "7", "8", "9", "10", "EF", "Q1", "Q2"];
      return order.indexOf(a) - order.indexOf(b);
  });

  for (const g of allGrades) {
      const gStudents = students.filter(s => getGradeLevel(s.className) === g).sort((a, b) => a.lastName.localeCompare(b.lastName));
      if (gStudents.length > 0) {
          const gData = gStudents.map(s => [`${s.firstName} ${s.lastName}`, s.className, s.assignedProjectId || 'Keine']);
          const gHeaders = ['Schüler:in', 'Klasse', 'Zugeordnetes Projekt'];
          await addPdfAndDocx(stufenFolder!, `Stufe_${g}`, `Projektliste Stufe ${g}`, gHeaders, gData);
      }
  }

  // 4. By Project (Folder: projekt)
  const projectFolder = zip.folder("projekt");
  for (const p of projects) {
    const projectStudents = students.filter(s => s.assignedProjectId === p.id).sort((a, b) => a.lastName.localeCompare(b.lastName));
    const pData = projectStudents.map(s => [`${s.firstName} ${s.lastName}`, s.className]);
    const pHeaders = ['Schüler:in', 'Klasse'];
    await addPdfAndDocx(projectFolder!, `Projekt_${p.id}`, `Teilnehmer:innenliste Projekt ${p.id}`, pHeaders, pData);
  }

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, "Projektzuteilung_Export.zip");
};

async function addPdfAndDocx(folder: JSZip, filename: string, title: string, headers: string[], data: string[][]) {
  // PDF
  const doc = new jsPDF();
  doc.text(title, 14, 15);
  autoTable(doc, {
    head: [headers],
    body: data,
    startY: 20,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 }
  });
  const pdfBlob = doc.output('blob');
  folder.file(`${filename}.pdf`, pdfBlob);

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
              children: headers.map(h => new TableCell({ children: [new Paragraph({ text: h, alignment: AlignmentType.CENTER, bold: true })], shading: { fill: "EEEEEE" } }))
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
