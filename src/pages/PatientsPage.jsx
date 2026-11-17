import React, { useState, useEffect } from "react";
import { Search, Plus, Check, X, Eye, FileDown, Pencil, FileText, ArrowLeft, UserRoundPlus, Mic, CircleCheck } from "lucide-react";
import { FICHA_FIELDS, formatFicha, normalize, matchesQuery } from "../data/initialData.js";

function PatientList({ fichas, onNew, onUpdate }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(null);
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(null);

  const saveEdit = () => {
    const values = { name: editing.name.trim(), rut: editing.rut.trim() || "—", phone: editing.phone.trim() || "—" };
    if (!values.name) return;
    const count = onUpdate(editing.ficha, values);
    setEditing(null);
    setNotice(`Datos de ${values.name} actualizados${count > 1 ? ` en sus ${count} fichas` : ""}.`);
  };

  const editKeys = e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(null); };
  const editInput = (field, label) => (
    <input className="cell-input" value={editing[field]} aria-label={label} autoFocus={field === "name"}
      onChange={e => setEditing({ ...editing, [field]: e.target.value })} onKeyDown={editKeys} />
  );

  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(""), 4500); return () => clearTimeout(t); }, [notice]);

  const q = normalize(query);
  const rows = fichas.filter(f => matchesQuery(f, query)).sort((a, b) => b.date.localeCompare(a.date));
  const download = f => setNotice(`Descarga simulada: "Ficha ${f.name} · ${f.date}.pdf". La generación real de PDF aún no está implementada.`);

  return (
    <div className="content">
      <section className="card patients-card">
        <div className="patients-toolbar">
          <div>
            <span className="eyebrow">FICHAS CLÍNICAS</span><h2>Mis pacientes</h2>
            <p className="muted">
              {q ? `${rows.length} ${rows.length === 1 ? "ficha encontrada" : "fichas encontradas"} para "${query.trim()}"` : `${rows.length} fichas registradas. Busca un paciente para ver todas sus fichas.`}
            </p>
          </div>
          <div className="patients-actions">
            <label className="search">
              <Search size={17} />
              <input type="search" placeholder="Buscar por nombre o RUT" aria-label="Buscar paciente" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Escape" && setQuery("")} />
              {query && <button type="button" className="clear-btn" title="Borrar búsqueda" aria-label="Borrar búsqueda" onClick={() => setQuery("")}><X size={15} /></button>}
            </label>
            <button className="primary" onClick={onNew}><Plus size={17} /> Agregar paciente</button>
          </div>
        </div>

        <div className="table-scroll">
          <table className="patients-table">
            <thead><tr><th>Nombre</th><th>RUT</th><th>Número contacto</th><th>Fecha ficha</th><th>Ficha</th><th>Editar</th></tr></thead>
            <tbody>
              {rows.map(f => editing?.ficha.id === f.id ? (
                <tr key={f.id} className="editing">
                  <td>{editInput("name", "Nombre")}</td>
                  <td>{editInput("rut", "RUT")}</td>
                  <td>{editInput("phone", "Número contacto")}</td>
                  <td>{formatFicha(f.date)}</td>
                  <td />
                  <td>
                    <div className="ficha-actions">
                      <button className="icon-btn confirm" title="Guardar cambios" aria-label="Guardar cambios" disabled={!editing.name.trim()} onClick={saveEdit}><Check size={18} strokeWidth={3} /></button>
                      <button className="icon-btn ghost" title="Cancelar" aria-label="Cancelar edición" onClick={() => setEditing(null)}><X size={18} /></button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={f.id}>
                  <td className="name">{f.name}</td>
                  <td className="num">{f.rut}</td>
                  <td className="num">{f.phone}</td>
                  <td>{formatFicha(f.date)}</td>
                  <td>
                    <div className="ficha-actions">
                      <button className="icon-btn" title="Ver ficha" aria-label={`Ver ficha de ${f.name} del ${f.date}`} onClick={() => setOpen(f)}><Eye size={18} /></button>
                      <button className="icon-btn" title="Descargar PDF" aria-label={`Descargar PDF de ${f.name} del ${f.date}`} onClick={() => download(f)}><FileDown size={18} /></button>
                    </div>
                  </td>
                  <td>
                    <div className="ficha-actions">
                      <button className="icon-btn" title="Editar paciente" aria-label={`Editar datos de ${f.name}`} onClick={() => setEditing({ ficha: f, name: f.name, rut: f.rut === "—" ? "" : f.rut, phone: f.phone === "—" ? "" : f.phone })}><Pencil size={17} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={6} className="empty">No encontramos fichas para "{query.trim()}". Prueba con otro nombre o RUT.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="agenda-footnote">Prototipo con datos ficticios. No ingresar datos reales de pacientes.</p>
      </section>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(null)} onKeyDown={e => e.key === "Escape" && setOpen(null)}>
          <section className="card modal" role="dialog" aria-modal="true" aria-label={`Ficha de ${open.name}`} onClick={e => e.stopPropagation()}>
            <div className="card-heading"><div><span className="eyebrow">FICHA CLÍNICA</span><h2>{open.name}</h2></div><FileText className="sage-icon" size={28} /></div>
            <dl className="ficha-meta"><dt>RUT</dt><dd>{open.rut}</dd><dt>Contacto</dt><dd>{open.phone}</dd><dt>Fecha</dt><dd>{formatFicha(open.date)}</dd></dl>
            {open.notes
              ? FICHA_FIELDS.map(([key, label]) => <div className="ficha-note" key={key}><b>{label}</b><p>{open.notes[key].trim() || "—"}</p></div>)
              : <div className="ficha-note">Contenido clínico de demostración. En la versión real aquí verás las notas de la sesión.</div>}
            <div className="modal-actions">
              <button className="secondary" onClick={() => download(open)}><FileDown size={16} /> Descargar PDF</button>
              <button className="primary" autoFocus onClick={() => setOpen(null)}>Cerrar</button>
            </div>
          </section>
        </div>
      )}
      {notice && <div className="toast" role="status">{notice}<button aria-label="Cerrar aviso" onClick={() => setNotice("")}><X size={15} /></button></div>}
    </div>
  );
}

function NewPatientForm({ onBack, onAdd, initialName = "", backLabel }) {
  const [voice, setVoice] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(initialName);
  const [rut, setRut] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const reset = () => { setSaved(false); setName(""); setRut(""); setPhone(""); setEmail(""); };

  return (
    <div className="content">
      <section className="card patient-card">
        <button className="text-button back-link" onClick={onBack}><ArrowLeft size={15} /> {backLabel || "Volver a pacientes"}</button>
        <div className="card-heading">
          <div>
            <h2>Nuevo paciente</h2>
            <p className="muted">{backLabel ? `"${initialName}" aún no está registrado. Completa sus datos y vuelve a la agenda.` : "Registra los datos administrativos del paciente."}</p>
          </div>
          <UserRoundPlus className="sage-icon" size={28} />
        </div>
        {saved ? (
          <div className="success-panel">
            <CircleCheck size={38} /><h3>¡Ficha creada!</h3>
            <p>El paciente <b>{name}</b> fue agregado al prototipo.</p>
            <div className="success-actions">
              {backLabel
                ? <button className="primary" autoFocus onClick={onBack}>{backLabel}</button>
                : <><button className="secondary" onClick={onBack}>Ver pacientes</button><button className="primary" onClick={reset}>Agregar otro paciente</button></>}
            </div>
          </div>
        ) : (
          <>
            <div className="voice-panel">
              <div className="voice-icon"><Mic size={28} /></div>
              <h3>¿Prefieres hablar?</h3><p>El asistente te ayuda a completar la ficha.</p>
              <button className="primary" onClick={() => setVoice(!voice)}>{voice ? "Cerrar modo voz" : "🎙️ Comenzar por voz"}</button>
              {voice && <div className="voice-notice"><b>Modo voz de demostración</b><p>La integración real del micrófono y la transcripción aún no está implementada. Puedes completar los campos manualmente para probar el flujo.</p></div>}
            </div>
            <form className="form" onSubmit={e => { e.preventDefault(); onAdd({ name, rut, phone }); setSaved(true); }}>
              <label>Nombre completo<input required value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del paciente" /></label>
              <label>RUT<input value={rut} onChange={e => setRut(e.target.value)} placeholder="11.111.111-1" /></label>
              <label>Teléfono<input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+56 9 ..." /></label>
              <label>Correo electrónico<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@ejemplo.cl" /></label>
              <button className="primary wide" type="submit">Guardar ficha <CircleCheck size={17} /></button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

export default function PatientsPage({ view, setView, fichas, onAdd, onUpdate, draft, onBackToAgenda }) {
  if (view === "new") {
    return draft
      ? <NewPatientForm key={draft.slotKey} initialName={draft.name} backLabel="Volver a la agenda" onBack={onBackToAgenda} onAdd={onAdd} />
      : <NewPatientForm onBack={() => setView("list")} onAdd={onAdd} />;
  }
  return <PatientList fichas={fichas} onNew={() => setView("new")} onUpdate={onUpdate} />;
}
