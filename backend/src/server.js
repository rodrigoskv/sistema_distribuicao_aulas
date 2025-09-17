import express from "express";
import cors from "cors";
import { getConfig, setConfig, getSchedule, setSchedule, loadSeed } from "./store.js";
import { generateSchedule } from "./scheduler/algorithm.js";
import { exportCSV, exportExcel, exportPDF } from "./services/exporters.js";

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// seed inicial se vazio
if (!getConfig().teachers?.length) setConfig(loadSeed());

app.get("/api/ping", (req,res)=>res.json({ ok:true, ts: Date.now() }));

// Config
app.get("/api/config", (req,res)=> res.json(getConfig()));
app.post("/api/config", (req,res)=> { setConfig(req.body); setSchedule(null); res.json({ ok:true }); });

// Schedule
app.post("/api/schedule/generate", (req,res)=> {
  const cfg = getConfig();
  const result = generateSchedule(cfg);
  setSchedule(result);
  res.json({ ok:true, stats: result?.stats || {} });
});

app.get("/api/schedule", (req,res)=> res.json(getSchedule() || { slots: [], stats: {} }));

// Export
app.get("/api/export/csv", (req,res)=> {
  const csv = exportCSV(getSchedule());
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=schedule.csv");
  res.send(csv);
});

app.get("/api/export/excel", async (req,res)=> {
  const buffer = await exportExcel(getSchedule());
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=schedule.xlsx");
  res.send(buffer);
});

app.get("/api/export/pdf", async (req,res)=> {
  const { buffer } = await exportPDF(getSchedule());
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=schedule.pdf");
  res.send(buffer);
});

app.listen(PORT, ()=> console.log("API on http://localhost:"+PORT));
