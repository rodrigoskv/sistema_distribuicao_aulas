import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

export function exportCSV(schedule){
  const rows = [["classId","day","shift","period","subject","teacherId","resourceId"]];
  for (const s of schedule?.slots || []) rows.push([s.classId, s.day, s.shift, s.period, s.subject, s.teacherId, s.resourceId||""]);
  return rows.map(r=>r.join(",")).join("\n");
}

export async function exportExcel(schedule){
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Schedule");
  ws.addRow(["classId","day","shift","period","subject","teacherId","resourceId"]);
  for (const s of schedule?.slots || []) ws.addRow([s.classId, s.day, s.shift, s.period, s.subject, s.teacherId, s.resourceId||""]);
  return wb.xlsx.writeBuffer();
}

export async function exportPDF(schedule){
  const doc = new PDFDocument({ margin: 36 });
  const chunks = [];
  doc.on("data", c=>chunks.push(c));

  doc.fontSize(18).text("Grade Horária", { align:"center" }).moveDown();

  const grouped = new Map();
  for (const s of schedule?.slots || []){
    if (!grouped.has(s.classId)) grouped.set(s.classId, []);
    grouped.get(s.classId).push(s);
  }

  for (const [classId, arr] of grouped){
    doc.fontSize(14).text("Turma: " + classId);
    doc.fontSize(10);
    arr.sort((a,b)=> a.day.localeCompare(b.day) || a.shift.localeCompare(b.shift) || a.period-b.period);
    for (const s of arr){
      doc.text(`${s.day} ${s.shift} p${s.period} — ${s.subject} (${s.teacherId})${s.resourceId? " ["+s.resourceId+"]":""}`);
    }
    doc.moveDown();
  }

  doc.end();
  await new Promise(r=>doc.on("end", r));
  return { buffer: Buffer.concat(chunks) };
}
