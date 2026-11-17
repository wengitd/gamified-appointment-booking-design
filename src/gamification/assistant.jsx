import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { plural } from "../shared.jsx";
import "./assistant.css";

// Intensidad del asistente: la gamificación se suaviza con el tiempo y la persona decide.
export const INTENSITIES = [
  { id: "auto", label: "Automática", description: "Celebra todo al comienzo y se vuelve más tranquila desde el nivel 3." },
  { id: "completa", label: "Completa", description: "Celebración en cada ficha, logros y subidas de nivel." },
  { id: "discreta", label: "Discreta", description: "Las fichas solo suman hojas en silencio. Celebra logros, niveles y desafíos." },
  { id: "minima", label: "Mínima", description: "Sin celebraciones. Solo el camino del día y tu racha." },
];
const IDS = INTENSITIES.map(i => i.id);
export const AUTO_LEVEL = 3;  // desde este nivel "auto" pasa a discreta

export const effectiveIntensity = (setting, level = 1) =>
  setting === "completa" || setting === "discreta" || setting === "minima" ? setting
  : level >= AUTO_LEVEL ? "discreta" : "completa";

// kind: "ficha" | "achievement" | "level" | "challenge" -> "card" | "bump" | "none"
export const celebrationMode = (intensity, kind) =>
  intensity === "minima" ? "none"
  : intensity === "discreta" ? (kind === "ficha" ? "bump" : "card")
  : "card";

export const showExtras = intensity => intensity !== "minima";

// Entero estable durante el día local (días desde 1970).
export const dailySeed = (date = new Date()) => Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);

// Mezcla seed + sal para que cada banco no avance al mismo ritmo que los demás.
const hash = (seed, salt) => {
  let h = (Number(seed) || 0) ^ 0x9e3779b9;
  for (const c of salt) h = Math.imul(h ^ c.charCodeAt(0), 0x5bd1e995) ^ (h >>> 15);
  return (h ^ (h >>> 13)) >>> 0;
};
const pick = (bank, seed, salt) => bank[hash(seed, salt) % bank.length];

const queda = (n, one, many) => n === 1 ? `Te queda ${one}` : `Te quedan ${n} ${many}`;

const BANKS = {
  pending: (s) => {
    const n = s.pending.length, p = s.pending[0]?.patient;
    return [
      `Tienes ${plural(n, "ficha atrasada", "fichas atrasadas")}. ¿Partimos por ahí?`,
      p && `¿Partimos por la ficha de ${p}? Es un ratito y queda listo.`,
      `${n === 1 ? "Hay 1 ficha" : `Hay ${n} fichas`} esperando de días anteriores. Vamos de a una 🌱`,
      p && `La sesión con ${p} aún no tiene ficha. ¿La dejamos al día?`,
      `Un pendiente a la vez. ${n === 1 ? "Solo queda 1" : `Son ${n}`} y lo sacamos juntos.`,
    ].filter(Boolean);
  },
  missingToday: (s) => {
    const n = s.missingToday.length, t = s.todayPatients.length, p = s.missingToday[0]?.patient;
    return [
      `Hoy tienes ${plural(t, "atención", "atenciones")}. ${queda(n, "1 ficha", "fichas")} por registrar.`,
      p && `¿Registramos la ficha de ${p} mientras está fresquita?`,
      `${queda(n, "1 ficha", "fichas")} de hoy. Vas a buen ritmo 🌱`,
      p && `Siguiente: ${p}. Unos minutos y queda listo.`,
      n === t ? `Tu día tiene ${plural(t, "atención", "atenciones")}. Las fichas te esperan sin apuro.`
        : `Ya llevas ${t - n} de ${t} fichas de hoy. ¡Bien ahí!`,
    ].filter(Boolean);
  },
  noLocation: (s) => {
    const n = s.noLocation.length, p = s.noLocation[0]?.patient;
    return [
      `Hay ${plural(n, "bloque", "bloques")} de hoy o mañana sin ubicación.`,
      p && `¿Dónde atiendes a ${p}? Falta la ubicación del bloque.`,
      `Un detalle: ${n === 1 ? "a 1 bloque le falta" : `a ${n} bloques les falta`} la ubicación. Te toma un segundo.`,
      `Ordenemos la agenda: ${plural(n, "bloque", "bloques")} sin consulta asignada 📍`,
    ].filter(Boolean);
  },
  free: () => [
    "Hoy no tienes atenciones. Día libre 🌿",
    "Sin atenciones hoy. Aprovecha de descansar 🌿",
    "Día tranquilo: la agenda de hoy está libre ☕",
    "Hoy no hay sesiones. Tu consulta también descansa 🌿",
    "Agenda libre hoy. Si quieres, revisa la de mañana con calma.",
  ],
  done: () => [
    "¡Todo al día! Disfruta tu tarde 🌙",
    "Fichas y agenda en orden. Ya puedes desconectarte con calma 🌙",
    "¡Listo por hoy! Tu documentación quedó impecable ✨",
    "Todo registrado. Buen momento para un cafecito ☕",
    "Jornada en orden. Mañana seguimos 🌱",
    "Nada pendiente por aquí. ¡Qué buena pega! 🌸",
  ],
};
const STREAK_LINES = [
  n => `${n} días seguidos al día. ¡Qué constancia! ☀️`,
  n => `Todo al día y ya van ${n} días de racha ☀️`,
  n => `¡${n} días con la consulta en orden! Disfruta la tarde 🌙`,
];

// Misma prioridad que antes: pendientes > fichas de hoy > ubicación > día libre > todo al día.
export const assistantMessage = (s, streak, seed = dailySeed()) => {
  const situation = s.pending.length ? "pending" : s.missingToday.length ? "missingToday"
    : s.noLocation.length ? "noLocation" : !s.todayPatients.length ? "free" : "done";
  if (situation === "done" && streak?.count >= 5 && hash(seed, "streak?") % 3 === 0)
    return pick(STREAK_LINES, seed, "streak")(streak.count);
  return pick(BANKS[situation](s), seed, situation);
};

// Texto variado para la tarjeta de celebración.
export const celebrationLine = (kind, data = {}, seed = Date.now()) => {
  if (kind === "ficha") {
    const { remainingToday = 0, pending = 0, late } = data;
    const head = pick(late
      ? ["¡Pendiente resuelto!", "¡Uno menos de la lista!", "¡Al día con ese!", "¡Bien ahí, quedó listo!"]
      : ["¡Una menos!", "¡Ficha lista!", "¡Registrada!", "¡Bien hecho!"], seed, "fichaHead");
    const tail = remainingToday ? `${queda(remainingToday, "1 ficha", "fichas")} de hoy.`
      : pending ? `${pending === 1 ? "Queda 1 pendiente" : `Quedan ${pending} pendientes`}.`
      : pick(["Vas muy bien 🌱", "Todo avanzando 🌱", "Qué buen ritmo 🌿"], seed, "fichaTail");
    return `${head} ${tail}`;
  }
  const banks = {
    closed: ["¡Jornada cerrada! Todo al día 🌙", "¡Día cerrado! Ahora a descansar 🌙", "Todo en orden por hoy. ¡Bien ahí! ✨", "¡Listo! Tu consulta quedó al día 🌸"],
    achievement: [`Logro desbloqueado: ${data.name}`, `¡Nuevo logro! ${data.name}`, `Te ganaste «${data.name}» ✨`, `${data.name}: ¡logrado!`],
    level: [`¡Subiste al nivel ${data.level}${data.name ? `: ${data.name}` : ""}!`, `Nivel ${data.level}${data.name ? ` · ${data.name}` : ""}. Tu orden da frutos 🌿`, `¡Nivel ${data.level}! Tu jardín sigue creciendo 🌱`],
    challenge: [`¡Desafío cumplido: ${data.title}!`, `Lo lograste: ${data.title} ✨`, `${data.title}, ¡completado!`, `Desafío listo: ${data.title} 🌿`],
  };
  return banks[kind] ? pick(banks[kind], seed, kind) : "";
};

export function AssistantSettings({ value = "auto", level = 1, onChange, onClose }) {
  const refs = useRef({});
  const current = IDS.includes(value) ? value : "auto";
  useEffect(() => { refs.current[current]?.focus(); }, []);
  useEffect(() => {
    const onKey = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const move = (e, i) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); onChange(IDS[i]); return; }
    if (!step && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const next = e.key === "Home" ? 0 : e.key === "End" ? IDS.length - 1 : (i + step + IDS.length) % IDS.length;
    onChange(IDS[next]); refs.current[IDS[next]]?.focus();
  };
  const resolved = INTENSITIES.find(i => i.id === effectiveIntensity("auto", level)).label;
  return <div className="modal-backdrop" onClick={onClose}>
    <section className="card modal assistant-settings" role="dialog" aria-modal="true" aria-labelledby="assistant-settings-title" onClick={e => e.stopPropagation()}>
      <div className="card-heading"><div><span className="eyebrow">TU ASISTENTE</span><h2 id="assistant-settings-title">Configuración</h2></div>
        <button className="settings-close" aria-label="Cerrar configuración" onClick={onClose}><X size={18}/></button></div>
      <h3 id="intensity-label">Intensidad del asistente</h3>
      <div className="intensity-options" role="radiogroup" aria-labelledby="intensity-label">
        {INTENSITIES.map((opt, i) => {
          const on = opt.id === current;
          return <div key={opt.id} ref={el => refs.current[opt.id] = el} role="radio" aria-checked={on} tabIndex={on ? 0 : -1}
            className={`intensity-option ${on ? "selected" : ""}`} onClick={() => onChange(opt.id)} onKeyDown={e => move(e, i)}>
            <span className="intensity-dot" aria-hidden="true"/>
            <span className="intensity-text"><b>{opt.label}{opt.id === "auto" && <small className="intensity-now">Ahora: {resolved}</small>}</b><span>{opt.description}</span></span>
          </div>;
        })}
      </div>
      <p className="settings-note">🌱 Los avances nunca se pierden al cambiar la intensidad.</p>
      <div className="modal-actions"><button className="primary" onClick={onClose}>Listo</button></div>
    </section>
  </div>;
}

// "+N" flotante dentro del chip de hojas (el chip lleva la clase "has-bump"; agregar "bump" para el pulso).
export function LeafBump({ amount }) {
  if (!amount) return null;
  return <span className="leaf-bump" aria-hidden="true">+{amount}</span>;
}
