import React from "react";
import { ProgressBar, plural } from "../shared.jsx";
import "./levels.css";

// Nivel de jardinera: se calcula con el total histórico de hojas y nunca baja ni se reinicia.
// Con uso normal (~60-90 hojas/semana) los niveles llegan cerca de los meses 1, 2, 4 y 8.
// Lo que desbloquea es solo visual (temas, fondos, accesorios); nunca funciones de trabajo.
const STAGE_BASE = [
  { min: 0, name: "Semilla" },
  { min: 30, name: "Brote" },
  { min: 80, name: "Planta" },
  { min: 150, name: "Flor" },
  { min: 250, name: "Árbol" },
];

export const THEMES = [
  { id: "clasico", name: "Clásico", emojis: ["🌱", "🌿", "🪴", "🌸", "🌳"], level: 1 },
  { id: "cactus", name: "Desierto", emojis: ["🌰", "🌱", "🌵", "🌺", "🏜️"], level: 2 },
  { id: "bambu", name: "Bambú", emojis: ["🌱", "🍃", "🎍", "🎋", "🏞️"], level: 3 },
  { id: "tulipanes", name: "Tulipanes", emojis: ["🌱", "🌿", "🌷", "💐", "🌻"], level: 4 },
  { id: "bosque", name: "Bosque", emojis: ["🌰", "🌱", "🍄", "🌲", "🏕️"], level: 5 },
];

export const LEVELS = [
  { level: 1, name: "Aprendiz", min: 0, unlocks: { theme: "clasico", welcome: "", accessory: "" } },
  { level: 2, name: "Cultivadora", min: 100, unlocks: { theme: "cactus", welcome: "theme-2", accessory: "🎒" } },
  { level: 3, name: "Jardinera", min: 300, unlocks: { theme: "bambu", welcome: "theme-3", accessory: "🎓" } },
  { level: 4, name: "Paisajista", min: 700, unlocks: { theme: "tulipanes", welcome: "theme-4", accessory: "🧭" } },
  { level: 5, name: "Guardiana del bosque", min: 1500, unlocks: { theme: "bosque", welcome: "theme-5", accessory: "👑" } },
];

const lv = n => LEVELS[Math.min(Math.max(n, 1), LEVELS.length) - 1];
const themeById = id => THEMES.find(t => t.id === id) ?? THEMES[0];

export const totalLeaves = (log = []) => log.reduce((n, e) => n + (Number(e.amount) || 0), 0);

export const levelFor = total => {
  const cur = LEVELS.findLast(l => total >= l.min) ?? LEVELS[0], nx = LEVELS[cur.level];
  const next = nx ? { level: nx.level, name: nx.name, min: nx.min } : null;
  const progress = next ? Math.min(100, Math.max(0, (total - cur.min) / (next.min - cur.min) * 100)) : 100;
  return { level: cur.level, name: cur.name, min: cur.min, next, progress, unlocks: cur.unlocks };
};

export const unlockedThemes = level => THEMES.filter(t => t.level <= level);
export const gardenStagesFor = themeId => { const t = themeById(themeId); return STAGE_BASE.map((s, i) => ({ ...s, emoji: t.emojis[i] })); };
export const welcomeThemeClass = level => lv(level).unlocks.welcome;
export const mascotAccessory = level => lv(level).unlocks.accessory;
export const levelUps = (prevTotal, nextTotal) => LEVELS.filter(l => l.level > 1 && prevTotal < l.min && nextTotal >= l.min);

export function LevelCard({ total, themeId = "clasico", onThemeChange }) {
  const cur = levelFor(total), current = themeById(themeId).level <= cur.level ? themeId : "clasico";
  return <section className="card level-card">
    <div className="card-heading">
      <div><span className="eyebrow">TU NIVEL DE JARDINERA</span><h2>Nivel {cur.level} · {cur.name}</h2></div>
      <span className="level-total" title="Hojas acumuladas desde el inicio">🍃 {total}</span>
    </div>
    <ProgressBar value={cur.progress}/>
    <p className="level-hint">{cur.next ? `Te faltan ${plural(cur.next.min - total, "hoja", "hojas")} para Nivel ${cur.next.level} · ${cur.next.name}` : "¡Llegaste al nivel máximo! Tu jardín ya es un bosque 🌲"}</p>
    <p className="muted">Llevas {plural(total, "hoja acumulada", "hojas acumuladas")}. Tu nivel nunca baja: el orden que construyes se queda contigo.</p>

    <ol className="level-row">
      {LEVELS.map(l => {
        const ok = l.level <= cur.level, t = themeById(l.unlocks.theme);
        return <li key={l.level} className={`${ok ? "reached" : "locked"} ${l.level === cur.level ? "current" : ""}`}>
          <span className="level-num">{ok ? l.level : "🔒"}</span>
          <b>{l.name}</b>
          <small>{l.min === 0 ? "Inicio" : `${l.min} hojas`}</small>
          <span className="level-unlocks" title={`Desbloquea: tema ${t.name}${l.unlocks.accessory ? ` y accesorio ${l.unlocks.accessory}` : ""}`}>{t.emojis[3]}{l.unlocks.accessory}</span>
        </li>;
      })}
    </ol>

    <div className="theme-picker">
      <h3>Tema del jardín</h3>
      <div className="theme-options">
        {THEMES.map(t => {
          const ok = t.level <= cur.level;
          return <button key={t.id} type="button" className={`theme-option ${current === t.id ? "active" : ""}`} disabled={!ok}
            aria-pressed={current === t.id} onClick={() => ok && onThemeChange?.(t.id)}>
            <span className="theme-emojis" aria-hidden="true">{t.emojis.join("")}</span>
            <b>{t.name}</b>
            {!ok && <small>Nivel {t.level}</small>}
          </button>;
        })}
      </div>
    </div>
  </section>;
}
