import React, { useState, useEffect } from "react";
import { plural } from "../shared.jsx";
import { resetStore } from "../data/initialData.js";

export function Celebration({ text, amount, emoji, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className={`celebration ${emoji ? "achievement" : ""}`} role="status">
      <div className="leaves" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <span key={i} style={{ "--i": i }}>{emoji ? "✨" : "🍃"}</span>
        ))}
      </div>
      <span className="celebration-mascot" aria-hidden="true">{emoji || "🌱"}</span>
      <b>{text}</b>
      {amount > 0 && <span className="leaf-badge">+{amount} 🍃</span>}
    </div>
  );
}

export function StreakLine({ streak }) {
  return (
    <p className="streak-line">
      <span aria-hidden="true">☀️</span> <b>{plural(streak.count, "día al día", "días al día")}</b>
      {!streak.todayDone && streak.count > 0 && <span> · completa tus fichas de hoy para sumar uno más</span>}
      {streak.covered && <span className="grace"> · Te cubrimos el {streak.covered} 💚</span>}
    </p>
  );
}

export function WeekSummary({ summary: w }) {
  const delay = w.delay === null ? "—" : w.delay < 0.05 ? "Mismo día" : `${w.delay.toFixed(1).replace(".", ",")} días`;
  return (
    <>
      <div className="summary-tiles">
        <div><b>{w.sameDay}</b><small>{w.sameDay === 1 ? "ficha" : "fichas"} el mismo día</small></div>
        <div><b>{w.late}</b><small>{w.late === 1 ? "atrasada resuelta" : "atrasadas resueltas"}</small></div>
        <div><b>{w.closed}</b><small>{w.closed === 1 ? "jornada cerrada" : "jornadas cerradas"}</small></div>
        <div><b>{delay}</b><small>entre atención y ficha</small></div>
      </div>
      <p className="muted">
        {w.achievements.length
          ? `Logros de la semana: ${w.achievements.map(a => `${a.emoji} ${a.name}`).join(", ")}.`
          : "Esta semana aún no desbloqueas logros nuevos."}{" "}
        Juntaste {w.leaves} hojas 🍃.
      </p>
    </>
  );
}

export function ResetData() {
  const [asking, setAsking] = useState(false);
  return (
    <div className="reset-row">
      {asking ? (
        <>
          <span>Se borrarán pacientes, fichas, agenda, hojas y logros de este navegador.</span>
          <button className="secondary" onClick={() => setAsking(false)}>Cancelar</button>
          <button className="primary danger" onClick={resetStore}>Sí, reiniciar</button>
        </>
      ) : (
        <>
          <span>Los datos de prueba se guardan en este navegador.</span>
          <button className="secondary" onClick={() => setAsking(true)}>Reiniciar datos de prueba</button>
        </>
      )}
    </div>
  );
}
