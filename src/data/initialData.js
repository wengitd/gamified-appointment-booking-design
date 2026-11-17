import { isoOf, dayKeyOf, addDays, startOfWeek, WEEKDAY_NAMES, sessionsOn, daysBetween } from "../shared.jsx";
import { CHALLENGE_REWARD } from "../gamification/challenges.jsx";

export const appointments = [
  ["09:00", "Paciente A", "Sesión individual · 50 min"],
  ["11:00", "Paciente B", "Sesión individual · 50 min"],
  ["15:00", "Paciente C", "Sesión individual · 50 min"],
  ["17:00", "Paciente D", "Sesión individual · 50 min"],
];

export const PATIENTS = {
  A: ["Paciente A", "11.111.111-1", "+56 9 1234 5601"],
  B: ["Paciente B", "12.345.678-5", "+56 9 1234 5602"],
  C: ["Paciente C", "13.579.246-8", "+56 9 1234 5603"],
  D: ["Paciente D", "14.682.035-K", "+56 9 1234 5604"],
  E: ["Paciente E", "15.926.374-2", "+56 9 1234 5605"],
};

export const initialFichas = [
  ["A","2026-11-02"],["B","2026-11-02"],["C","2026-10-28"],["A","2026-10-26"],["D","2026-10-21"],
  ["E","2026-10-19"],["B","2026-10-12"],["A","2026-10-05"],["C","2026-09-30"],["D","2026-09-23"],["A","2026-09-14"],
].map(([p, date], i) => {
  const [name, rut, phone] = PATIENTS[p];
  return { id: i + 1, name, rut, phone, date };
});

export const LEAVES = { sameDay: 10, late: 5, agenda: 5, closed: 15 };

export const STAGES = [
  { min: 0, emoji: "🌱", name: "Semilla" },
  { min: 30, emoji: "🌿", name: "Brote" },
  { min: 80, emoji: "🪴", name: "Planta" },
  { min: 150, emoji: "🌸", name: "Flor" },
  { min: 250, emoji: "🌳", name: "Árbol" },
];

export const LEAF_RULES = [
  ["Ficha el mismo día de la atención", LEAVES.sameDay],
  ["Ficha atrasada resuelta", LEAVES.late],
  ["Agenda de hoy y mañana completa", LEAVES.agenda],
  ["Jornada cerrada (3 pasos)", LEAVES.closed],
  ["Desafío semanal cumplido", CHALLENGE_REWARD],
];

export const ACHIEVEMENTS = [
  { id: "semilla", emoji: "🌱", name: "Primera semilla", desc: "Registra tu primera ficha", count: "fichas", goal: 1 },
  { id: "mismo-dia", emoji: "📝", name: "Mismo día", desc: "Escribe 5 fichas el día de la atención", count: "sameDay", goal: 5 },
  { id: "agenda", emoji: "🗓️", name: "Agenda clara", desc: "Completa tu agenda 5 días", count: "agenda", goal: 5 },
  { id: "rescate", emoji: "🛟", name: "Al rescate", desc: "Resuelve 3 fichas atrasadas", count: "late", goal: 3 },
  { id: "cierre", emoji: "🌙", name: "Buenas noches", desc: "Cierra 3 jornadas completas", count: "closed", goal: 3 },
  { id: "constancia-10", emoji: "☀️", name: "Constancia", desc: "10 días al día", count: "streak", goal: 10 },
  { id: "constancia-30", emoji: "🌻", name: "Raíces firmes", desc: "30 días al día", count: "streak", goal: 30 },
  { id: "constancia-100", emoji: "🌳", name: "Bosque propio", desc: "100 días al día", count: "streak", goal: 100 },
  { id: "voz", emoji: "🎙️", name: "Voz propia", desc: "Dicta tu primera ficha (cuando el dictado esté activo)", count: "voice", goal: 1 },
];

export const FICHA_FIELDS = [
  ["objetivo", "Objetivo de la sesión", "¿Qué quieres trabajar hoy con el paciente?"],
  ["desarrollo", "Desarrollo de la sesión", "Temas, intervenciones y observaciones…"],
  ["conclusion", "Conclusión de la sesión", "Acuerdos, tareas y próximos pasos…"],
];

export const STORE = "menta:v1:";

export const stageFor = (leaves, stages = STAGES) => {
  const i = stages.findLastIndex(s => leaves >= s.min);
  return { ...stages[i], index: i, next: stages[i + 1] };
};

export const weekLeaves = (log, now = new Date()) => {
  const from = isoOf(startOfWeek(now));
  return log.filter(e => e.date >= from).reduce((n, e) => n + e.amount, 0);
};

export const streakInfo = (bookings, fichas, now = new Date()) => {
  const dayState = d => {
    const sessions = sessionsOn(bookings, d), iso = isoOf(d);
    if (!sessions.length && !fichas.some(f => f.date === iso)) return "empty";
    return sessions.every(s => fichas.some(f => f.name === s.patient && f.date === iso)) ? "ok" : "missing";
  };
  const todayDone = dayState(now) === "ok";
  let count = todayDone ? 1 : 0;
  const graceWeeks = new Set(), covered = [];
  for (let i = 1; i <= 120; i++) {
    const d = addDays(now, -i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const state = dayState(d);
    if (state === "empty") continue;
    if (state === "ok") { count++; continue; }
    const week = isoOf(startOfWeek(d));
    if (graceWeeks.has(week)) break;
    graceWeeks.add(week); covered.push(d);
  }
  const coveredThisWeek = covered.find(d => d >= startOfWeek(now));
  return { count, todayDone, covered: coveredThisWeek ? WEEKDAY_NAMES[coveredThisWeek.getDay()] : null };
};

export const formatFicha = iso => {
  const s = new Intl.DateTimeFormat("es-CL", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${iso}T12:00`)).replace(",", "");
  return s[0].toUpperCase() + s.slice(1);
};

export const normalize = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export const matchesQuery = (f, query) => {
  const q = normalize(query);
  if (!q) return true;
  const digits = q.replace(/[^0-9k]/g, "");
  return normalize(f.name).includes(q) || (/\d/.test(digits) && f.rut.toLowerCase().replace(/[^0-9k]/g, "").includes(digits));
};

export const dateOfKey = dayKey => {
  const [y, m, d] = dayKey.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const todayBookings = () => {
  const dayKey = dayKeyOf(new Date());
  return {
    ...Object.fromEntries(appointments.map(([time, patient]) => [`${dayKey}|${time}`, { patient, location: "Consulta particular" }])),
    [`${dayKeyOf(addDays(new Date(), -1))}|16:00`]: { patient: "Paciente E", location: "Online" },
  };
};

export const dayStatus = (bookings, fichas, now = new Date()) => {
  const slotsOn = d => sessionsOn(bookings, d);
  const uniq = list => [...new Map(list.map(s => [s.patient + s.iso, s])).values()];
  const hasFicha = s => fichas.some(f => f.name === s.patient && f.date === s.iso);
  const today = slotsOn(now);
  const toPlace = [...today, ...slotsOn(addDays(now, 1))];
  const noLocation = toPlace.filter(s => !s.location?.trim());
  const todayPatients = uniq(today);
  const missingToday = todayPatients.filter(s => !hasFicha(s));
  const pending = uniq(Array.from({ length: 7 }, (_, i) => slotsOn(addDays(now, -7 + i))).flat()).filter(s => !hasFicha(s));
  const done = [!noLocation.length, !missingToday.length, !pending.length];
  return { toPlace, noLocation, todayPatients, missingToday, pending, done, completed: done.filter(Boolean).length };
};

export const initialLeaves = () => {
  const from = isoOf(startOfWeek(new Date()));
  return initialFichas.filter(f => f.date >= from).map(f => ({
    key: `ficha:${f.id}`, date: f.date, session: f.date, kind: "sameDay", amount: LEAVES.sameDay, reason: `Ficha de ${f.name}`
  }));
};

export const achievementCounts = (log, streak) => {
  const n = kind => log.filter(e => e.kind === kind).length;
  return { fichas: n("sameDay") + n("late"), sameDay: n("sameDay"), late: n("late"), agenda: n("agenda"), closed: n("closed"), streak: streak.count, voice: 0 };
};

export const weekSummary = (log, unlocked, now = new Date()) => {
  const from = isoOf(startOfWeek(now));
  const week = log.filter(e => e.date >= from);
  const fichas = week.filter(e => e.session);
  const delay = fichas.length ? fichas.reduce((n, e) => n + daysBetween(e.session, e.date), 0) / fichas.length : null;
  return {
    sameDay: week.filter(e => e.kind === "sameDay").length,
    late: week.filter(e => e.kind === "late").length,
    closed: week.filter(e => e.kind === "closed").length,
    leaves: week.reduce((n, e) => n + e.amount, 0),
    delay,
    achievements: ACHIEVEMENTS.filter(a => unlocked?.[a.id] >= from),
  };
};

export const resetStore = () => {
  try { Object.keys(localStorage).filter(k => k.startsWith(STORE)).forEach(k => localStorage.removeItem(k)); } catch {}
  location.reload();
};
