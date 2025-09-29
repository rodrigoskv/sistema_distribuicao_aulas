import React, { useState } from "react";
import { get, post } from "../lib/api";

type Props = { onGenerated?: () => void };

export default function ScheduleGenerator({ onGenerated }: Props) {
  const [population, setPopulation] = useState(120);
  const [generations, setGenerations] = useState(40);
  const [mutation, setMutation] = useState(0.07);

  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);
  const [msg, setMsg] = useState<string>("");

  async function handleGenerate() {
    setMsg("");
    setProblems([]);
    try {
      setLoading(true);
      const pf = await get<{ ok: boolean; problems: string[] }>("/schedule/preflight");
      if (!pf.ok) {
        setProblems(pf.problems || []);
        setMsg("Há pendências que impedem a geração.");
        return;
      }
      await post("/schedule/generate", { population, generations, mutation });
      setMsg("Horários gerados com sucesso.");
      onGenerated?.();
    } catch (e: any) {
      setMsg(e?.message || "Falha ao gerar horários.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        background: "var(--card, #12161f)",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 0 0 1px rgba(255,255,255,0.06) inset",
        maxWidth: 560,          // 👈 card menor
        width: "100%",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>
        Gerar horários
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            background: loading ? "#2b3344" : "#3c66ff",
            color: "#fff",
            border: 0,
            borderRadius: 8,
            padding: "10px 16px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
          }}
          title="Gerar horários"
        >
          {loading ? "Gerando..." : "Gerar"}
        </button>

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          style={{
            background: "transparent",
            color: "#c9d1d9",
            border: 0,
            padding: 8,
            textDecoration: "underline",
            cursor: "pointer",
          }}
          title="Opções avançadas"
        >
          {showAdvanced ? "Ocultar avançado" : "Avançado"}
        </button>
      </div>

      {showAdvanced && (
        <div
          style={{
            marginTop: 14,
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(150px, 1fr))",
            gap: 12,
          }}
        >
          <Field label="População">
            <input
              type="number"
              value={population}
              onChange={(e) => setPopulation(Number(e.target.value))}
              min={10}
              step={10}
              style={inputStyle}
            />
          </Field>
          <Field label="Gerações">
            <input
              type="number"
              value={generations}
              onChange={(e) => setGenerations(Number(e.target.value))}
              min={1}
              step={1}
              style={inputStyle}
            />
          </Field>
          <Field label="Mutação">
            <input
              type="number"
              value={mutation}
              onChange={(e) => setMutation(Number(e.target.value))}
              min={0}
              max={1}
              step={0.01}
              style={inputStyle}
            />
          </Field>
        </div>
      )}

      {msg && (
        <div style={{ marginTop: 12, color: "#c9d1d9" }}>
          {msg}
        </div>
      )}
      {!!problems.length && (
        <div style={{ marginTop: 10, color: "#ffb3b3" }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Pendências:</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {problems.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: React.PropsWithChildren<{ label: string }>) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 13, color: "#a7b0bf" }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#171c27",
  color: "#e6edf3",
  border: "1px solid #2a3344",
  borderRadius: 8,
  padding: "10px 12px",
  outline: "none",
};


