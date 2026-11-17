import React from "react";
import { CalendarCheck, FileText, ClipboardCheck, Footprints, ChevronRight, Plus, Check, Clock } from "lucide-react";
import { plural, ProgressBar } from "../shared.jsx";
import { welcomeThemeClass, mascotAccessory } from "../gamification/levels.jsx";
import { ChallengeCard } from "../gamification/challenges.jsx";
import { assistantMessage, dailySeed } from "../gamification/assistant.jsx";
import { appointments } from "../data/initialData.js";
import { StreakLine, WeekSummary } from "../components/SharedUI.jsx";

function Appointment({ time, patient, desc }) {
  return (
    <div className="appointment">
      <div className="appointment-icon"><Clock size={20} /></div>
      <div className="appointment-copy"><b>{time} · {patient}</b><small>{desc}</small></div>
      <span className="status">Confirmada</span>
    </div>
  );
}

export default function HomePage({ status: s, streak, summary, level, challenge, userName, onNavigate, onFocusSlot, onOpenFicha }) {
  const weekEnd = [5, 6, 0].includes(new Date().getDay());
  const steps = [
    {
      title: "Organizar agenda", Icon: CalendarCheck, action: "Completar agenda",
      sub: !s.toPlace.length ? "No hay atenciones agendadas para hoy ni mañana" : s.noLocation.length ? `${plural(s.noLocation.length, "bloque", "bloques")} de hoy y mañana sin ubicación` : "Hoy y mañana tienen ubicación",
      count: s.toPlace.length ? [s.toPlace.length - s.noLocation.length, s.toPlace.length] : null,
      go: () => s.noLocation[0] ? onFocusSlot(s.noLocation[0].key) : onNavigate("Agenda")
    },
    {
      title: "Registrar atenciones", Icon: FileText, action: "Registrar ficha",
      sub: !s.todayPatients.length ? "Día libre 🌿 Sin atenciones hoy" : s.missingToday.length ? `Siguiente: ${s.missingToday[0].patient}` : "Todas las fichas de hoy están listas",
      count: s.todayPatients.length ? [s.todayPatients.length - s.missingToday.length, s.todayPatients.length] : null,
      go: () => s.missingToday[0] ? onOpenFicha({ name: s.missingToday[0].patient, date: s.missingToday[0].iso }) : onNavigate("Fichas clínicas")
    },
    {
      title: "Revisar pendientes", Icon: ClipboardCheck, action: "Resolver pendiente",
      sub: s.pending.length ? `${plural(s.pending.length, "atención", "atenciones")} de los últimos 7 días sin ficha` : "No tienes fichas atrasadas",
      count: null,
      go: () => s.pending[0] ? onOpenFicha({ name: s.pending[0].patient, date: s.pending[0].iso }) : onNavigate("Pacientes")
    },
  ];
  const next = s.done.findIndex(d => !d);

  return (
    <div className="content">
      <section className={`welcome card ${welcomeThemeClass(level)}`}>
        <div>
          <span className="eyebrow">TU ASISTENTE DE HOY</span>
          <h2>¡Hola, {userName || "Nicolás"}!</h2>
        </div>
        <div className="assistant">
          <div className="bubble" aria-live="polite">{assistantMessage(s, streak, dailySeed())}</div>
          <div className="mascot" aria-hidden="true">
            {s.completed === 3 ? "🌸" : "🌱"}
            {mascotAccessory(level) && <span className="mascot-accessory" aria-hidden="true">{mascotAccessory(level)}</span>}
          </div>
        </div>
      </section>

      <section className={`card progress-card ${s.completed === 3 ? "closed" : ""}`}>
        <div className="card-heading">
          <h3>{s.completed === 3 ? "Jornada cerrada 🌙" : "Tu progreso de hoy"}</h3>
          <strong>{s.completed}/3</strong>
        </div>
        <ProgressBar value={s.completed / 3 * 100} />
        <p className="muted">
          {s.completed === 3 ? "Tu documentación está al día. Tómate un respiro." : `¡Vas muy bien! Te ${3 - s.completed === 1 ? "queda 1 paso" : `quedan ${3 - s.completed} pasos`}.`}
        </p>
        <StreakLine streak={streak} />
      </section>

      {challenge && <ChallengeCard challenge={challenge} />}

      {weekEnd && (
        <section className="card week-card">
          <div className="card-heading">
            <h3>Tu semana 🌿</h3>
            <button className="text-button" onClick={() => onNavigate("Progreso")}>Ver progreso →</button>
          </div>
          <WeekSummary summary={summary} />
        </section>
      )}

      <section className="card">
        <div className="card-heading"><h3>Tu camino de hoy</h3><Footprints className="sage-icon" /></div>
        <ol className="path">
          {steps.map(({ title, sub, Icon, action, count, go }, i) => (
            <li className={`path-step ${s.done[i] ? "done" : i === next ? "current" : ""}`} key={title}>
              <div className="path-node">{s.done[i] ? <Check size={24} strokeWidth={3} /> : i + 1}</div>
              <div className="task">
                <div className="task-icon"><Icon size={22} /></div>
                <div className="task-copy">
                  <b>{title}{count && <span className="step-count">{count[0]}/{count[1]}</span>}</b>
                  <small>{sub}</small>
                </div>
                {s.done[i]
                  ? <button className="status status-link" title={`Ir a ${title.toLowerCase()}`} onClick={go}>Listo <ChevronRight size={13} /></button>
                  : <button className="small-action" onClick={go}>{action} <ChevronRight size={15} /></button>}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="card">
        <div className="card-heading">
          <h3>Próximas atenciones</h3>
          <button className="text-button" onClick={() => onNavigate("Agenda")}>Ver agenda →</button>
        </div>
        {appointments.slice(0, 2).map(([time, patient, desc]) => (
          <Appointment key={time} time={time} patient={patient} desc={desc} />
        ))}
      </section>

      <button className="primary wide" onClick={() => onNavigate("Pacientes", "new")}>
        <Plus size={18} /> Nuevo paciente
      </button>
    </div>
  );
}
