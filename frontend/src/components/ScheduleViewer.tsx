import React, { useEffect, useMemo, useState } from "react";
import { get } from "../lib/api";

type Lesson = {
  scheduleId: number;
  teacher: string;
  subject: string;
  schoolClass: string;
  timeslotLabel: string;
  shift: "MATUTINO" | "VESPERTINO" | "CONTRATURNO";
  day: 1 | 2 | 3 | 4 | 5;
  slot: 1 | 2 | 3 | 4 | 5;
};

type ApiResp = {
  schedule: { id: number; createdAt: string; fitness: number } | null;
  lessons: Lesson[];
};

const DAYS: Array<{ key: 1 | 2 | 3 | 4 | 5; label: string }> = [
  { key: 1, label: "Seg" },
  { key: 2, label: "Ter" },
  { key: 3, label: "Qua" },
  { key: 4, label: "Qui" },
  { key: 5, label: "Sex" },
];
const SLOTS = [1, 2, 3, 4, 5] as const;

export default function ScheduleViewer() {
  const [data, setData] = useState<ApiResp | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    try {
      setLoading(true);
      const j = await get<ApiResp>("/schedule");
      setData(j);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const byClass = useMemo(() => {
    const map = new Map<string, { shift: Lesson["shift"]; lessons: Lesson[] }>();
    const lessons = data?.lessons ?? [];
    for (const l of lessons) {
      if (!map.has(l.schoolClass)) map.set(l.schoolClass, { shift: l.shift, lessons: [] });
      map.get(l.schoolClass)!.lessons.push(l);
    }
    return map;
  }, [data]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 18 }}>Visualizar</div>
      {loading && <div style={{ opacity: 0.7 }}>Carregando…</div>}

      <div
        style={{
          display: "flex",
          gap: 16,
          overflowX: "auto",
          paddingBottom: 8,
        }}
      >
        {[...byClass.entries()].map(([className, group]) => (
          <ClassTable
            key={className}
            className={className}
            shift={group.shift}
            lessons={group.lessons}
          />
        ))}
        {!loading && byClass.size === 0 && (
          <div style={{ opacity: 0.7 }}>Nenhum horário gerado.</div>
        )}
      </div>
    </div>
  );
}

function ClassTable({
  className,
  shift,
  lessons,
}: {
  className: string;
  shift: Lesson["shift"];
  lessons: Lesson[];
}) {
  const grid = useMemo(() => {
    const m = new Map<number, Map<number, Lesson>>();
    for (const d of DAYS.map((d) => d.key)) m.set(d, new Map());
    for (const l of lessons) {
      if (!m.has(l.day)) m.set(l.day, new Map());
      m.get(l.day)!.set(l.slot, l);
    }
    return m;
  }, [lessons]);

  return (
    <div
      style={{
        minWidth: 520,
        background: "var(--card, #12161f)",
        borderRadius: 12,
        padding: 12,
        boxShadow: "0 0 0 1px rgba(255,255,255,0.06) inset",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 8 }}>
        {className} <span style={{ opacity: 0.6 }}>· {shift}</span>
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 14,
        }}
      >
        <thead>
          <tr>
            <Th style={{ width: 64 }}>Dia</Th>
            {SLOTS.map((s) => (
              <Th key={s}>{s}ª aula</Th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((d) => (
            <tr key={d.key}>
              <TdHeader>{d.label}</TdHeader>
              {SLOTS.map((s) => {
                const l = grid.get(d.key)?.get(s);
                return (
                  <Td key={s}>
                    {l ? (
                      <div style={{ display: "grid", gap: 2 }}>
                        <div style={{ fontWeight: 600 }}>{l.subject}</div>
                        <div style={{ opacity: 0.8 }}>{l.teacher}</div>
                      </div>
                    ) : (
                      <span style={{ opacity: 0.35 }}>—</span>
                    )}
                  </Td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({
  children,
  style,
}: React.PropsWithChildren<{ style?: React.CSSProperties }>) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: "8px 10px",
        borderBottom: "1px solid #2a3344",
        color: "#a7b0bf",
        fontWeight: 600,
        ...style,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: React.PropsWithChildren) {
  return (
    <td
      style={{
        padding: "10px 10px",
        borderBottom: "1px solid #1b2230",
        verticalAlign: "top",
      }}
    >
      {children}
    </td>
  );
}

function TdHeader({ children }: React.PropsWithChildren) {
  return (
    <td
      style={{
        padding: "10px 10px",
        borderBottom: "1px solid #1b2230",
        color: "#a7b0bf",
        width: 64,
        whiteSpace: "nowrap",
        fontWeight: 600,
      }}
    >
      {children}
    </td>
  );
}
