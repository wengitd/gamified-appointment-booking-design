// Desafío semanal e Invernadero: premian el orden administrativo, nunca el volumen clínico.
// Si un desafío no se cumple, no se pierde nada: cada lunes llega uno nuevo.
import React from "react";
import { isoOf, addDays, startOfWeek, sessionsOn, daysBetween, plural, ProgressBar } from "../shared.jsx";
import "./challenges.css";

export const CHALLENGE_REWARD = 30;

const dateOf = iso => new Date(`${iso}T12:00`);
const inRange = (e, from, to) => e.date >= from && e.date <= to;
const fichaFor = (fichas, s) => fichas.find(f => f.name === s.patient && f.date === s.iso);
const uniqSessions = list => [...new Map(list.map(s => [s.patient + s.iso, s])).values()];
const weekSessions = (bookings, monday, days = 7) => uniqSessions(Array.from({ length: days }, (_, i) => sessionsOn(bookings, addDays(monday, i))).flat());
const hourOf = at => { const d = new Date(at); return d.getHours() + d.getMinutes() / 60; };

// Desafíos de maestría: se rotan por número de semana cuando la semana anterior quedó en orden.
const MASTERY = [
  { id: "cierres", emoji: "🌙", title: "Cierra 4 jornadas", description: "Completa los 3 pasos del día en 4 jornadas distintas.", goal: 4,
    count: week => new Set(week.filter(e => e.kind === "closed").map(e => e.date)).size },
  { id: "cierre-temprano", emoji: "🌇", title: "Cierra antes de las 19:00, 3 veces", description: "Deja la jornada cerrada antes de las 19:00 en 3 días.", goal: 3,
    count: week => new Set(week.filter(e => e.kind === "closed" && e.at && hourOf(e.at) < 19).map(e => e.date)).size },
  { id: "ficha-rapida", emoji: "⏱️", title: "Fichas dentro de 2 horas, 5 veces", description: "Escribe 5 fichas a menos de 2 horas de terminar la sesión.", goal: 5,
    // Una ficha cuenta si se registró entre el inicio de la sesión y 3 h después (sesión de ~1 h + 2 h).
    count: (week, bookings, fichas) => week.filter(e => {
      if (e.kind !== "sameDay" || !e.at) return false;
      const f = fichas.find(f => `ficha:${f.id}` === e.key);
      if (!f) return false;
      return sessionsOn(bookings, dateOf(f.date)).filter(s => s.patient === f.name).some(s => {
        const [h, m] = s.key.split("|")[1].split(":").map(Number);
        const start = new Date(`${f.date}T12:00`).setHours(h, m, 0, 0);
        return e.at >= start && e.at - start <= 3 * 3600000;
      });
    }).length },
];

// Elige el desafío de la semana de `now` a partir del punto más débil de la semana anterior:
// 1) hubo fichas atrasadas o atenciones hábiles sin ficha → "Todas las fichas el mismo día";
// 2) si no, menos de 5 días con agenda completa → "Agenda completa 5 días";
// 3) si no, un desafío de maestría rotado por número de semana.
export function weeklyChallenge(log, bookings, fichas, now = new Date()) {
  const monday = startOfWeek(now), weekStart = isoOf(monday), weekEnd = isoOf(addDays(monday, 6));
  const prevMonday = addDays(monday, -7), prevStart = isoOf(prevMonday), prevEnd = isoOf(addDays(monday, -1));
  const prevLog = log.filter(e => inRange(e, prevStart, prevEnd)), week = log.filter(e => inRange(e, weekStart, weekEnd));

  const prevLate = prevLog.filter(e => e.kind === "late").length;
  const prevMissing = weekSessions(bookings, prevMonday, 5).filter(s => !fichaFor(fichas, s)).length;
  if (prevLate || prevMissing) {
    // Cuenta cada atención de lunes a hoy (paciente + día) con ficha que no se resolvió como atrasada.
    // Meta = máx(3, atenciones de la semana hasta hoy): se cumple cuando todas tienen ficha del mismo día
    // y hubo al menos 3. Las de hoy sin ficha aún no fallan, solo faltan.
    const elapsed = Math.min(7, daysBetween(weekStart, isoOf(now)) + 1);
    const sessions = weekSessions(bookings, monday, elapsed);
    const lateKeys = new Set(log.filter(e => e.kind === "late").map(e => e.key));
    const progress = sessions.filter(s => { const f = fichaFor(fichas, s); return f && !lateKeys.has(`ficha:${f.id}`); }).length;
    const goal = Math.max(3, sessions.length);
    return { id: "mismo-dia", weekStart, emoji: "📝", title: "Todas las fichas el mismo día",
      description: "Escribe la ficha de cada atención el mismo día (al menos 3 esta semana).",
      why: prevLate ? "La semana pasada algunas fichas quedaron para después; esta semana probamos escribirlas el mismo día."
        : "La semana pasada quedaron atenciones sin ficha; esta semana vamos por tenerlas todas al día.",
      progress: Math.min(progress, goal), goal, done: progress >= goal };
  }

  const prevAgenda = new Set(prevLog.filter(e => e.kind === "agenda").map(e => e.date)).size;
  if (prevAgenda < 5) {
    const progress = new Set(week.filter(e => e.kind === "agenda").map(e => e.date)).size;
    return { id: "agenda-5", weekStart, emoji: "🗓️", title: "Agenda completa 5 días",
      description: "Deja hoy y mañana con todas sus ubicaciones en 5 días distintos.",
      why: prevAgenda ? `La semana pasada la agenda quedó completa ${plural(prevAgenda, "día", "días")}; esta semana vamos por 5.`
        : "Una agenda con todas sus ubicaciones te ahorra dudas: esta semana vamos por 5 días.",
      progress: Math.min(progress, 5), goal: 5, done: progress >= 5 };
  }

  const weekNumber = Math.floor(daysBetween("2024-01-01", weekStart) / 7);  // 2024-01-01 fue lunes
  const m = MASTERY[((weekNumber % MASTERY.length) + MASTERY.length) % MASTERY.length];
  const progress = m.count(week, bookings, fichas);
  return { id: m.id, weekStart, emoji: m.emoji, title: m.title, description: m.description,
    why: "La semana pasada todo quedó en orden, así que este es un desafío de maestría para afinar tu ritmo.",
    progress: Math.min(progress, m.goal), goal: m.goal, done: progress >= m.goal };
}

// Invernadero: una colección por mes, con estaciones del hemisferio sur.
const C = (month, name, emoji, pieces) => ({ month, name, emoji, pieces: pieces.map(([id, e, n]) => ({ id: `${month + 1}-${id}`, emoji: e, name: n })) });
export const COLLECTIONS = [
  C(0, "Verano en la costa", "🏖️", [["sandia", "🍉", "Sandía"], ["concha", "🐚", "Concha"], ["ola", "🌊", "Ola"], ["quitasol", "⛱️", "Quitasol"]]),
  C(1, "Vacaciones al sur", "🏕️", [["volcan", "🌋", "Volcán"], ["lago", "🏞️", "Lago"], ["maqui", "🫐", "Maqui"], ["fogata", "🔥", "Fogata"]]),
  C(2, "Vendimia", "🍇", [["uva", "🍇", "Racimo"], ["manzana", "🍎", "Manzana"], ["canasto", "🧺", "Canasto"], ["aceituna", "🫒", "Aceituna"]]),
  C(3, "Otoño dorado", "🍂", [["hoja", "🍁", "Hoja roja"], ["hongo", "🍄", "Hongo"], ["castana", "🌰", "Castaña"], ["zapallo", "🎃", "Zapallo"]]),
  C(4, "Primeras lluvias", "☔", [["paraguas", "☔", "Paraguas"], ["botas", "🥾", "Botas"], ["nube", "🌧️", "Nube"], ["cazuela", "🍲", "Cazuela"]]),
  C(5, "Solsticio de invierno", "🌙", [["vela", "🕯️", "Vela"], ["tetera", "🫖", "Tetera"], ["bufanda", "🧣", "Bufanda"], ["estrellas", "✨", "Estrellas"]]),
  C(6, "Invierno en la cordillera", "🏔️", [["copo", "❄️", "Copo de nieve"], ["guantes", "🧤", "Guantes"], ["taza", "☕", "Taza caliente"], ["llama", "🦙", "Llama"]]),
  C(7, "Brotes de agosto", "🌿", [["lena", "🪵", "Leña"], ["calcetines", "🧦", "Calcetines de lana"], ["brote", "🌱", "Primer brote"], ["zorzal", "🐦", "Zorzal"]]),
  C(8, "Fiestas Patrias", "🇨🇱", [["volantin", "🪁", "Volantín"], ["empanada", "🥟", "Empanada"], ["cueca", "💃", "Pañuelo de cueca"], ["anticucho", "🍢", "Anticucho"]]),
  C(9, "Primavera en flor", "🌸", [["cerezo", "🌸", "Flor de cerezo"], ["abeja", "🐝", "Abeja"], ["tulipan", "🌷", "Tulipán"], ["mariposa", "🦋", "Mariposa"]]),
  C(10, "Huerta de primavera", "🍓", [["frutilla", "🍓", "Frutilla"], ["menta", "🌿", "Menta"], ["chinita", "🐞", "Chinita"], ["girasol", "🌻", "Girasol"]]),
  C(11, "Comienza el verano", "☀️", [["cerezas", "🍒", "Cerezas"], ["helado", "🍦", "Helado"], ["atardecer", "🌅", "Atardecer largo"], ["fin-de-ano", "🎆", "Fin de año"]]),
];
const PIECES = Object.fromEntries(COLLECTIONS.flatMap(c => c.pieces.map(p => [p.id, { ...p, collection: c.name, month: c.month }])));

// La pieza depende del lunes: mes del lunes y su índice de semana dentro del mes (máx. 3).
export function pieceForWeek(weekStartISO) {
  const d = dateOf(weekStartISO), c = COLLECTIONS[d.getMonth()];
  return { ...c.pieces[Math.min(3, Math.floor((d.getDate() - 1) / 7))], collection: c.name, month: c.month };
}

export function ChallengeCard({ challenge, piece }) {
  if (!challenge) return null;
  const { emoji, title, description, why, progress, goal, done } = challenge;
  const p = piece || pieceForWeek(challenge.weekStart), c = COLLECTIONS[p.month];
  return <section className={`card challenge-card ${done ? "done" : ""}`}>
    <div className="card-heading">
      <div><span className="eyebrow">DESAFÍO DE LA SEMANA</span><h3>{title}</h3></div>
      <span className="challenge-emoji" aria-hidden="true">{done ? "🏆" : emoji}</span>
    </div>
    <p className="challenge-desc">{description}</p>
    <p className="muted">{why}</p>
    <div className="challenge-progress">
      <ProgressBar value={Math.min(100, progress / goal * 100)}/>
      <span>{progress}/{goal}</span>
    </div>
    {done
      ? <p className="challenge-reward">¡Desafío cumplido! Ganaste +{CHALLENGE_REWARD} 🍃 y <b>{p.emoji} {p.name}</b> para tu Invernadero.</p>
      : <>
        <p className="challenge-reward">+{CHALLENGE_REWARD} 🍃 y una pieza de la colección {c.name} {c.emoji}</p>
        <p className="challenge-note">Si no alcanzas, no pasa nada: el lunes llega otro desafío.</p>
      </>}
  </section>;
}

// `earned`: ids de pieza o {id, weekStart}. Con weekStart se separan los años; sin él, el id basta.
export function Greenhouse({ earned = [], now = new Date() }) {
  const items = earned.map(x => typeof x === "string" ? { id: x } : x).filter(x => PIECES[x.id]);
  const ym = x => x.weekStart ? x.weekStart.slice(0, 7) : null;
  const currentYM = isoOf(now).slice(0, 7), current = COLLECTIONS[now.getMonth()];
  const isCurrent = x => PIECES[x.id].month === current.month && (!ym(x) || ym(x) === currentYM);
  const have = new Set(items.filter(isCurrent).map(x => x.id));

  const past = [...items.filter(x => !isCurrent(x)).reduce((map, x) => {
    const group = `${ym(x) || ""}#${PIECES[x.id].month}`;
    if (!map.has(group)) map.set(group, { key: group, ym: ym(x), collection: COLLECTIONS[PIECES[x.id].month], ids: new Set() });
    map.get(group).ids.add(x.id);
    return map;
  }, new Map()).values()].sort((a, b) => (b.ym || "").localeCompare(a.ym || "") || b.collection.month - a.collection.month);
  const label = g => g.ym ? new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric" }).format(dateOf(`${g.ym}-15`)) : null;

  return <section className="card greenhouse">
    <div className="card-heading">
      <div><h3>Invernadero</h3><p className="muted">Colección de {new Intl.DateTimeFormat("es-CL", { month: "long" }).format(now)}: {current.name} {current.emoji}</p></div>
      <strong>{have.size}/4</strong>
    </div>
    <div className="greenhouse-slots">
      {current.pieces.map(p => {
        const got = have.has(p.id);
        return <div key={p.id} className={`greenhouse-slot ${got ? "earned" : "missing"}`}>
          <span className="greenhouse-emoji" aria-hidden="true">{got ? p.emoji : "?"}</span>
          <small>{got ? p.name : "Por descubrir"}</small>
        </div>;
      })}
    </div>
    <p className="muted">Cada desafío semanal cumplido suma una pieza. Las piezas nunca se pierden.</p>
    {past.length > 0 && <ul className="greenhouse-past">
      {past.map(g => <li key={g.key}>
        <span className="greenhouse-past-name">{g.collection.emoji} {g.collection.name}{label(g) && <small> · {label(g)}</small>}</span>
        <span className="greenhouse-past-pieces" aria-label={`${g.ids.size} de 4 piezas`}>
          {g.collection.pieces.map(p => <span key={p.id} className={g.ids.has(p.id) ? "" : "missing"} title={p.name}>{g.ids.has(p.id) ? p.emoji : "·"}</span>)}
          {g.ids.size === 4 && <b className="greenhouse-complete">Completa</b>}
        </span>
      </li>)}
    </ul>}
  </section>;
}
