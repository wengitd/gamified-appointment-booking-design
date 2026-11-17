import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Check, FileText, X, Clock, CalendarDays, UserRoundPlus, CircleCheck } from "lucide-react";
import { isoOf, todayISO, dayKeyOf, addDays, startOfWeek, WEEKDAY_NAMES } from "../shared.jsx";
import { normalize, dateOfKey } from "../data/initialData.js";

const SESSION_MIN = 50, ROW_PX = 32, DAY_START = 8 * 60, DAY_END = 20 * 60;
const WEEKDAY_SHORT = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const LOCATIONS = ["Consulta particular", "Online"];
const toMinutes = h => { const [hh, mm] = h.split(":").map(Number); return hh * 60 + mm; };
const hhmm = m => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const sameDay = (a, b) => a.toDateString() === b.toDateString();

const longDate = d => {
  const s = new Intl.DateTimeFormat("es-CL", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(d).replace(",", "");
  return s[0].toUpperCase() + s.slice(1);
};

const rangeLabel = (a, b) => {
  const f = (d, opts) => new Intl.DateTimeFormat("es-CL", opts).format(d);
  if (a.getFullYear() !== b.getFullYear()) return `${f(a, { day: "numeric", month: "long", year: "numeric" })} – ${f(b, { day: "numeric", month: "long", year: "numeric" })}`;
  if (a.getMonth() !== b.getMonth()) return `${f(a, { day: "numeric", month: "long" })} – ${f(b, { day: "numeric", month: "long" })} de ${b.getFullYear()}`;
  return `${a.getDate()} – ${b.getDate()} de ${f(b, { month: "long" })} de ${b.getFullYear()}`;
};

const withLanes = items => {
  const out = []; let group = [], groupEnd = -1;
  const flush = () => {
    const lanes = [];
    group.forEach(it => {
      let l = lanes.findIndex(end => end <= it.start);
      if (l < 0) l = lanes.length;
      lanes[l] = it.start + SESSION_MIN;
      out.push({ ...it, lane: l });
    });
    out.slice(-group.length).forEach(it => it.lanes = lanes.length);
  };
  items.forEach(it => {
    if (group.length && it.start >= groupEnd) { flush(); group = []; }
    group.push(it);
    groupEnd = Math.max(groupEnd, it.start + SESSION_MIN);
  });
  if (group.length) flush();
  return out;
};

function AppointmentModal({ value, bookings, patients, fichas, onClose, onSave, onDelete, onCreatePatient, onOpenFicha }) {
  const [form, setForm] = useState(value);
  const set = field => e => setForm({ ...form, [field]: e.target.value });
  const [y, m, d] = form.iso ? form.iso.split("-").map(Number) : [];
  const key = form.iso && form.time ? `${dayKeyOf(new Date(y, m - 1, d))}|${form.time}` : null;
  const clash = key && key !== value.key && bookings[key]?.patient?.trim() ? bookings[key] : null;
  const name = patients.find(p => normalize(p) === normalize(form.patient)) || form.patient.trim();
  const unknown = name && !patients.includes(name);
  const cancelled = form.status === "cancelada";
  const hasFicha = value.key && fichas.some(f => f.name === value.patient && f.date === value.iso);
  const isPast = value.key && value.iso <= todayISO();
  const save = (extra = {}) => {
    const b = { patient: name, location: form.location.trim(), ...(cancelled ? { status: "cancelada" } : {}), ...extra };
    onSave(key, b);
    onClose();
    return b;
  };
  const valid = name && key && !clash;

  return (
    <div className="modal-backdrop" onClick={onClose} onKeyDown={e => e.key === "Escape" && onClose()}>
      <section className="card modal appt-modal" role="dialog" aria-modal="true" aria-label={value.key ? "Editar cita" : "Nueva cita"} onClick={e => e.stopPropagation()}>
        <div className="card-heading">
          <div><span className="eyebrow">{value.key ? "EDITAR CITA" : "NUEVA CITA"}</span><h2>{value.key ? value.patient : "Agendar paciente"}</h2></div>
          <CalendarDays className="sage-icon" size={28} />
        </div>
        {cancelled && <p className="appt-flag">Esta cita está cancelada.</p>}
        <form className="form" onSubmit={e => { e.preventDefault(); if (valid) save(); }}>
          <label>Paciente<input list="appt-patients" value={form.patient} onChange={set("patient")} placeholder="Escribe un paciente" autoFocus={!value.key} required /></label>
          <datalist id="appt-patients">{patients.map(p => <option key={p} value={p} />)}</datalist>
          {unknown && <p className="appt-hint">"{name}" aún no está registrado. Puedes guardar la cita y crear su ficha después.</p>}
          <div className="appt-row">
            <label>Fecha<input type="date" value={form.iso} onChange={set("iso")} required /></label>
            <label>Hora<input type="time" step={900} value={form.time} onChange={set("time")} required /></label>
          </div>
          {clash && <p className="appt-error">Ya hay una cita a esa hora con {clash.patient}. Elige otro horario.</p>}
          <label>Ubicación<input list="appt-locations" value={form.location} onChange={set("location")} placeholder="Consulta particular, Online…" /></label>
          <datalist id="appt-locations">{LOCATIONS.map(l => <option key={l} value={l} />)}</datalist>
          <div className="modal-actions">
            {value.key && <button type="button" className="text-button danger" onClick={() => { onDelete(); onClose(); }}>Eliminar</button>}
            {value.key && <button type="button" className="secondary" onClick={() => setForm({ ...form, status: cancelled ? "" : "cancelada" })}>{cancelled ? "Reactivar cita" : "Cancelar cita"}</button>}
            {unknown && <button type="button" className="secondary" disabled={!valid} onClick={() => { save(); onCreatePatient(name, key); }}><UserRoundPlus size={16} /> Guardar y crear ficha</button>}
            {isPast && !hasFicha && !cancelled && !unknown && <button type="button" className="secondary" onClick={() => onOpenFicha({ name: value.patient, date: value.iso })}><FileText size={16} /> Registrar ficha</button>}
            <button type="submit" className="primary" disabled={!valid}>{value.key ? "Guardar cambios" : "Agendar"} <CircleCheck size={17} /></button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function AgendaPage({ date, setDate, bookings, setBookings, fichas, patients, focusSlot, openFocus, onCreatePatient, onOpenFicha }) {
  const [view, setView] = useState(() => window.matchMedia?.("(max-width: 760px)").matches ? "day" : "week");
  const [editing, setEditing] = useState(null);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t); }, []);
  const days = view === "week" ? Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(date), i)) : [date];
  const shift = n => setDate(addDays(date, n * (view === "week" ? 7 : 1)));

  const openEdit = key => { const [dayKey, time] = key.split("|"); setEditing({ key, iso: isoOf(dateOfKey(dayKey)), time, patient: "", location: "", status: "", ...bookings[key] }); };
  const openNew = (d, time) => setEditing({ key: null, iso: isoOf(d), time, patient: "", location: LOCATIONS[0], status: "" });

  useEffect(() => {
    if (!focusSlot) return;
    document.querySelector(`[data-slot="${focusSlot}"]`)?.scrollIntoView({ block: "center" });
    if (openFocus && bookings[focusSlot]) openEdit(focusSlot);
  }, []);

  const items = days.map(d => {
    const k = dayKeyOf(d);
    return withLanes(Object.entries(bookings)
      .filter(([key, b]) => key.split("|")[0] === k && b.patient?.trim())
      .map(([key, b]) => ({ key, ...b, start: toMinutes(key.split("|")[1]) }))
      .sort((a, b) => a.start - b.start));
  });
  const starts = items.flat().map(i => i.start);
  const from = Math.min(DAY_START, ...starts.map(m => Math.floor(m / 60) * 60));
  const to = Math.max(DAY_END, ...starts.map(m => Math.ceil((m + SESSION_MIN) / 60) * 60));
  const rows = Array.from({ length: (to - from) / 30 }, (_, i) => from + i * 30);
  const y = m => (m - from) / 30 * ROW_PX;
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const stateOf = (it, d) => {
    if (it.status === "cancelada") return "cancelled";
    const iso = isoOf(d);
    const past = iso < isoOf(now) || (sameDay(d, now) && it.start + SESSION_MIN <= nowMin);
    if (!past) return "upcoming";
    return fichas.some(f => f.name === it.patient && f.date === iso) ? "done" : "pending";
  };
  const ICONS = { done: Check, pending: FileText, cancelled: X, upcoming: Clock };
  const TITLES = { done: "Atendida, ficha registrada", pending: "Falta registrar la ficha", cancelled: "Cita cancelada", upcoming: "Próxima cita" };

  return (
    <div className="content agenda-content">
      <section className="card agenda-card">
        <div className="cal-toolbar">
          <div><span className="eyebrow">{view === "week" ? "SEMANA" : "DÍA"}</span><h2>{view === "week" ? rangeLabel(days[0], days[6]) : longDate(date)}</h2></div>
          <div className="cal-controls">
            <div className="cal-nav">
              <button aria-label={view === "week" ? "Semana anterior" : "Día anterior"} onClick={() => shift(-1)}><ChevronLeft size={18} /></button>
              <button className="cal-today" onClick={() => setDate(new Date())}>Hoy</button>
              <button aria-label={view === "week" ? "Semana siguiente" : "Día siguiente"} onClick={() => shift(1)}><ChevronRight size={18} /></button>
            </div>
            <div className="cal-switch" role="group" aria-label="Vista">
              {[["week", "Semana"], ["day", "Día"]].map(([v, label]) => (
                <button key={v} aria-pressed={view === v} className={view === v ? "on" : ""} onClick={() => setView(v)}>{label}</button>
              ))}
            </div>
            <button className="primary" onClick={() => openNew(sameDay(date, now) || view === "day" ? date : days[0], hhmm(Math.min(Math.max(Math.ceil(nowMin / 30) * 30, DAY_START), DAY_END - 60)))}>
              <Plus size={17} /> Nueva cita
            </button>
          </div>
        </div>

        <div className="cal-scroll">
          <div className={`cal ${view}`} style={{ "--cols": days.length }}>
            <div className="cal-head">
              <div />
              {days.map(d => (
                <button key={d.toDateString()} className={`cal-dayhead ${sameDay(d, now) ? "today" : ""}`} onClick={() => { setDate(d); setView("day"); }} title="Ver este día">
                  <small>{WEEKDAY_SHORT[d.getDay()]}</small><b>{d.getDate()}</b>
                </button>
              ))}
            </div>
            <div className="cal-body" style={{ height: rows.length * ROW_PX }}>
              <div className="cal-hours">{rows.filter(m => m % 60 === 0).map(m => <span key={m} style={{ top: y(m) }}>{hhmm(m)}</span>)}</div>
              {days.map((d, di) => (
                <div key={d.toDateString()} className={`cal-col ${sameDay(d, now) ? "today" : ""}`}>
                  {rows.map(m => (
                    <button key={m} className={`cal-slot ${m % 60 ? "half" : ""}`} style={{ top: y(m), height: ROW_PX }}
                      aria-label={`Nueva cita ${WEEKDAY_NAMES[d.getDay()]} ${d.getDate()} a las ${hhmm(m)}`} onClick={() => openNew(d, hhmm(m))}>
                      <Plus size={14} />
                    </button>
                  ))}
                  {items[di].map(it => {
                    const st = stateOf(it, d), Icon = ICONS[st];
                    const unknown = !patients.some(p => normalize(p) === normalize(it.patient));
                    const place = it.location?.trim();
                    return (
                      <button key={it.key} data-slot={it.key}
                        className={`cal-event ${st} ${focusSlot === it.key ? "focus" : ""} ${unknown ? "unknown" : ""} ${place ? "" : "no-loc"}`}
                        style={{ top: y(it.start) + 2, height: SESSION_MIN / 30 * ROW_PX - 4, left: `calc(${it.lane / it.lanes * 100}% + 4px)`, width: `calc(${100 / it.lanes}% - 8px)` }}
                        title={`${hhmm(it.start)} ${it.patient} · ${place || "Sin ubicación"} · ${TITLES[st]}${unknown ? " · Paciente no registrado" : ""}`}
                        onClick={() => openEdit(it.key)}>
                        <span className="cal-event-line"><Icon size={13} strokeWidth={st === "done" ? 3 : 2} />{hhmm(it.start)}</span>
                        <b>{it.patient}</b>
                        <small>{place || "Sin ubicación"}</small>
                      </button>
                    );
                  })}
                  {sameDay(d, now) && nowMin >= from && nowMin <= to && <div className="cal-now" style={{ top: y(nowMin) }} aria-hidden="true" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="cal-legend" aria-label="Leyenda">
          <span className="done">Atendida</span><span className="pending">Falta ficha</span><span className="upcoming">Próxima</span><span className="cancelled">Cancelada</span>
        </div>
        <p className="agenda-footnote">Haz clic en un espacio libre para agendar o en una cita para editarla, moverla o cancelarla. Prototipo con datos ficticios: los cambios se guardan en este navegador.</p>
      </section>

      {editing && (
        <AppointmentModal value={editing} bookings={bookings} patients={patients} fichas={fichas} onClose={() => setEditing(null)}
          onSave={(key, b) => setBookings(old => { const next = { ...old }; if (editing.key) delete next[editing.key]; next[key] = b; return next; })}
          onDelete={() => setBookings(old => { const next = { ...old }; delete next[editing.key]; return next; })}
          onCreatePatient={onCreatePatient} onOpenFicha={onOpenFicha} />
      )}
    </div>
  );
}
