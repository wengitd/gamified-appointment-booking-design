import React, { useState } from "react";
import { CircleCheck, Mic, Search, X, Sprout, UserRoundPlus } from "lucide-react";
import { todayISO } from "../shared.jsx";
import { FICHA_FIELDS, formatFicha, matchesQuery } from "../data/initialData.js";

export default function FichasPage({ draft, fichas, onAdd, onViewPatients, onNewPatient, onHome }) {
  const emptyNotes = { objetivo: "", desarrollo: "", conclusion: "" };
  const patients = [...fichas.reduce((m, f) => m.has(f.rut + f.name) ? m : m.set(f.rut + f.name, f), new Map()).values()];
  const [query, setQuery] = useState(draft?.name || "");
  const [patient, setPatient] = useState(() => draft ? patients.find(p => p.name === draft.name) || null : null);
  const [date, setDate] = useState(draft?.date || todayISO());
  const [notes, setNotes] = useState(emptyNotes);
  const [listening, setListening] = useState(null);
  const [saved, setSaved] = useState(false);
  const isLate = date !== todayISO();

  const suggestions = !patient && query.trim() ? patients.filter(p => matchesQuery(p, query)).slice(0, 5) : [];
  const pick = p => { setPatient(p); setQuery(p.name); };
  const clearSearch = () => { setQuery(""); setPatient(null); };
  const toggleVoice = key => setListening(l => l === key ? null : key);
  const hasNotes = Object.values(notes).some(v => v.trim());
  const reset = () => { setQuery(""); setPatient(null); setDate(todayISO()); setNotes(emptyNotes); setListening(null); setSaved(false); };
  const mic = (key, label) => (
    <button type="button" className={`mic-btn ${listening === key ? "listening" : ""}`} aria-label={label} aria-pressed={listening === key} onClick={() => toggleVoice(key)}>
      <Mic size={20} />
    </button>
  );

  return (
    <div className="content">
      <section className="card ficha-card">
        {saved ? (
          <div className="success-panel">
            <CircleCheck size={38} /><h3>¡Ficha guardada!</h3>
            <p>La sesión de <b>{patient.name}</b> quedó registrada {isLate ? `para el ${formatFicha(date).toLowerCase()}` : "para hoy"}.</p>
            <div className="success-actions">
              <button className="secondary" onClick={onViewPatients}>Ver pacientes</button>
              <button className="secondary" onClick={onHome}>Volver al inicio</button>
              <button className="primary" onClick={reset}>Agregar otra ficha</button>
            </div>
          </div>
        ) : (
          <>
            <div className="ficha-top">
              <div><span className="eyebrow">NUEVA ATENCIÓN</span><h2>Agregar ficha</h2><p className="muted">Busca el paciente para registrar la sesión de hoy.</p></div>
              <button type="button" className={`voice-hint ${listening === "all" ? "listening" : ""}`} aria-pressed={listening === "all"} onClick={() => toggleVoice("all")}>
                <span className="mic-btn"><Mic size={20} /></span>
                <span><b>¿Prefieres hablar?</b><small>Presiona el ícono para que el asistente complete la ficha</small></span>
              </button>
            </div>
            {listening && <div className="voice-notice"><b>Modo voz de demostración</b><p>La integración real del micrófono y la transcripción aún no está implementada. Puedes escribir en los campos para probar el flujo.</p></div>}

            <div className="patient-search">
              <Search size={22} />
              <input value={query} placeholder="Nombre o RUT del paciente" aria-label="Buscar paciente"
                onChange={e => { setQuery(e.target.value); setPatient(null); }}
                onKeyDown={e => { if (e.key === "Enter" && suggestions[0]) { e.preventDefault(); pick(suggestions[0]); } if (e.key === "Escape") clearSearch(); }} />
              {query && <button type="button" className="clear-btn" title="Borrar búsqueda" aria-label="Borrar búsqueda" onClick={clearSearch}><X size={18} /></button>}
              {mic("search", "Buscar paciente por voz")}
              {suggestions.length > 0 && (
                <ul className="suggestions">
                  {suggestions.map(p => <li key={p.rut + p.name}><button type="button" onClick={() => pick(p)}><b>{p.name}</b><small>{p.rut}</small></button></li>)}
                </ul>
              )}
            </div>
            {!patient && !query.trim() && <p className="search-hint"><Sprout size={16} /> Escribe un nombre o RUT y elige al paciente para abrir su ficha.</p>}
            {!patient && query.trim() && !suggestions.length && (
              <div className="search-hint">No encontramos a "{query.trim()}".<button className="text-button" onClick={onNewPatient}><UserRoundPlus size={15} /> Registrar paciente nuevo</button></div>
            )}

            {patient && (
              <form className="ficha-form" onSubmit={e => { e.preventDefault(); onAdd({ ...patient, notes, date }); setListening(null); setSaved(true); }}>
                <div className="ficha-head">
                  <div className="ficha-title"><span className="eyebrow">{isLate ? "ATENCIÓN PENDIENTE" : "FICHA PACIENTE"}</span><h3>{patient.name}</h3><small>{formatFicha(date)}</small></div>
                  <button className="primary" type="submit" disabled={!hasNotes} title={hasNotes ? "" : "Escribe al menos un campo"}>Guardar <CircleCheck size={17} /></button>
                </div>
                {FICHA_FIELDS.map(([key, label, placeholder]) => (
                  <div className="ficha-field" key={key}>
                    <label htmlFor={`ficha-${key}`}>{label}</label>
                    <div className="field-box">
                      <textarea id={`ficha-${key}`} rows={key === "desarrollo" ? 5 : 3} value={notes[key]} placeholder={placeholder} onChange={e => setNotes({ ...notes, [key]: e.target.value })} />
                      {mic(key, `Dictar ${label.toLowerCase()}`)}
                    </div>
                  </div>
                ))}
              </form>
            )}
          </>
        )}
      </section>
    </div>
  );
}
