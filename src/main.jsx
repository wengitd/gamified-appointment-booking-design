import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { FileText, Flower2, Settings, Home, CalendarDays, Users, LogOut } from "lucide-react";
import LoginScreen from "./Login.jsx";
import "./styles.css";
import logoIcon from "../brand/humana-mente-icon.svg";

import { todayISO } from "./shared.jsx";
import { totalLeaves, levelFor, levelUps, unlockedThemes } from "./gamification/levels.jsx";
import { weeklyChallenge, pieceForWeek, CHALLENGE_REWARD } from "./gamification/challenges.jsx";
import { effectiveIntensity, celebrationMode, showExtras, celebrationLine, AssistantSettings, LeafBump } from "./gamification/assistant.jsx";

import {
  STORE, LEAVES, ACHIEVEMENTS, initialFichas, todayBookings, initialLeaves,
  dayStatus, streakInfo, weekLeaves, achievementCounts, weekSummary, dateOfKey
} from "./data/initialData.js";

import { Celebration } from "./components/SharedUI.jsx";
import HomePage from "./pages/HomePage.jsx";
import AgendaPage from "./pages/AgendaPage.jsx";
import PatientsPage from "./pages/PatientsPage.jsx";
import FichasPage from "./pages/FichasPage.jsx";
import ProgressPage from "./pages/ProgressPage.jsx";

function usePersisted(key, initial) {
  const [value, setValue] = useState(() => {
    try { const raw = localStorage.getItem(STORE + key); if (raw) return JSON.parse(raw); } catch {}
    return typeof initial === "function" ? initial() : initial;
  });
  useEffect(() => { try { localStorage.setItem(STORE + key, JSON.stringify(value)); } catch {} }, [key, value]);
  return [value, setValue];
}

function App({ user, onLogout }) {
  const [page, setPage] = useState("Inicio");
  const [patientView, setPatientView] = useState("list");
  const [fichas, setFichas] = usePersisted("fichas", initialFichas);
  const [agendaDate, setAgendaDate] = useState(() => new Date());
  const [bookings, setBookings] = usePersisted("bookings", todayBookings);
  const [patientDraft, setPatientDraft] = useState(null);
  const [agendaFocus, setAgendaFocus] = useState(null);
  const [fichaDraft, setFichaDraft] = useState(null);
  const [celebrations, setCelebrations] = useState([]);
  const [leafLog, setLeafLog] = usePersisted("leaves", initialLeaves);
  const [unlocked, setUnlocked] = usePersisted("unlocked", null);

  const status = dayStatus(bookings, fichas);
  const streak = streakInfo(bookings, fichas);
  const leaves = weekLeaves(leafLog);
  const counts = achievementCounts(leafLog, streak);
  const total = totalLeaves(leafLog);
  const lvl = levelFor(total);

  const [themeSetting, setThemeId] = usePersisted("theme", "clasico");
  const themeId = unlockedThemes(lvl.level).some(t => t.id === themeSetting) ? themeSetting : "clasico";
  const [intensitySetting, setIntensitySetting] = usePersisted("assistantIntensity", "auto");
  const intensity = effectiveIntensity(intensitySetting, lvl.level);
  const extras = showExtras(intensity);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pieces, setPieces] = usePersisted("pieces", []);
  const challenge = weeklyChallenge(leafLog, bookings, fichas);
  const [bump, setBump] = useState(null);

  useEffect(() => { if (!bump) return; const t = setTimeout(() => setBump(null), 1300); return () => clearTimeout(t); }, [bump]);

  const celebrate = c => setCelebrations(list => [...list, { id: Date.now() + Math.random(), ...c }]);
  const notify = (kind, c) => {
    const mode = celebrationMode(intensity, kind);
    if (mode === "card") celebrate(c);
    else if (mode === "bump" && c.amount) setBump({ id: Date.now(), amount: c.amount });
  };

  const award = (key, amount, reason, kind, session) =>
    setLeafLog(log => log.some(e => e.key === key) ? log : [...log, { key, date: todayISO(), at: Date.now(), amount, reason, kind, session }]);

  const prevTotal = useRef(total);
  useEffect(() => {
    levelUps(prevTotal.current, total).forEach(l => notify("level", { text: celebrationLine("level", { level: l.level, name: l.name }), emoji: "⭐", amount: 0 }));
    prevTotal.current = total;
  }, [total]);

  useEffect(() => {
    const key = `challenge:${challenge.weekStart}`;
    if (!challenge.done || leafLog.some(e => e.key === key)) return;
    const piece = pieceForWeek(challenge.weekStart);
    award(key, CHALLENGE_REWARD, `Desafío: ${challenge.title}`, "challenge");
    setPieces(list => list.some(p => p.weekStart === challenge.weekStart) ? list : [...list, { id: piece.id, weekStart: challenge.weekStart }]);
    notify("challenge", { text: celebrationLine("challenge", { title: challenge.title }), emoji: piece.emoji, amount: CHALLENGE_REWARD });
  }, [challenge.done, challenge.weekStart]);

  useEffect(() => { if (status.toPlace.length && status.done[0]) award(`agenda:${todayISO()}`, LEAVES.agenda, "Agenda de hoy y mañana completa", "agenda"); }, [status.done[0], status.toPlace.length]);
  useEffect(() => { if (status.completed === 3) award(`cierre:${todayISO()}`, LEAVES.closed, "Jornada cerrada", "closed"); }, [status.completed]);

  useEffect(() => {
    const reached = ACHIEVEMENTS.filter(a => counts[a.count] >= a.goal);
    if (unlocked === null) { setUnlocked(Object.fromEntries(reached.map(a => [a.id, todayISO()]))); return; }
    const fresh = reached.filter(a => !unlocked[a.id]);
    if (!fresh.length) return;
    setUnlocked({ ...unlocked, ...Object.fromEntries(fresh.map(a => [a.id, todayISO()])) });
    fresh.forEach(a => notify("achievement", { text: celebrationLine("achievement", { name: a.name }), emoji: a.emoji, amount: 0 }));
  }, [JSON.stringify(counts)]);

  const patientNames = [...new Set(fichas.map(f => f.name))];
  const navigate = (next, view = "list") => { setPage(next); setPatientView(view); setAgendaFocus(null); setFichaDraft(null); if (next !== "Agenda") setPatientDraft(null); };
  const createFromAgenda = (name, slotKey) => { setPage("Pacientes"); setPatientView("new"); setPatientDraft({ name, slotKey }); };
  const focusSlot = slotKey => { navigate("Agenda"); setAgendaDate(dateOfKey(slotKey.split("|")[0])); setAgendaFocus(slotKey); };
  const openFicha = draft => { navigate("Fichas clínicas"); setFichaDraft(draft); };

  const addFicha = ({ name, rut, phone, notes, date }) => {
    const ficha = { id: Date.now(), name, rut: rut || "—", phone: phone || "—", date: date || todayISO(), notes };
    const next = [ficha, ...fichas];
    setFichas(next);
    if (!notes) return;
    const late = ficha.date !== todayISO();
    const amount = late ? LEAVES.late : LEAVES.sameDay;
    award(`ficha:${ficha.id}`, amount, late ? `Pendiente de ${name} resuelto` : `Ficha de ${name}`, late ? "late" : "sameDay", ficha.date);
    const after = dayStatus(bookings, next);
    const closes = after.completed === 3 && !leafLog.some(e => e.key === `cierre:${todayISO()}`);
    const text = after.completed === 3 ? celebrationLine("closed", {}, leafLog.length)
      : celebrationLine("ficha", { remainingToday: after.missingToday.length, pending: after.pending.length, late }, leafLog.length);
    notify("ficha", { text, amount: amount + (closes ? LEAVES.closed : 0) });
  };

  const updatePatient = (old, values) => {
    const same = f => f.name === old.name && f.rut === old.rut;
    setFichas(list => list.map(f => same(f) ? { ...f, ...values } : f));
    if (values.name !== old.name) setBookings(b => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v.patient === old.name ? { ...v, patient: values.name } : v])));
    return fichas.filter(same).length;
  };

  const addFromAgenda = p => {
    addFicha(p);
    setBookings(old => ({ ...old, [patientDraft.slotKey]: { ...old[patientDraft.slotKey], patient: p.name.trim() } }));
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img className="brand-mark" src={logoIcon} alt="" />
          <div><b>humana-<span>mente</span></b><small>Tu consulta, un paso a la vez.</small></div>
        </div>
        <div className="nav-label">MENÚ</div>
        {[
          ["Inicio", Home], ["Agenda", CalendarDays], ["Pacientes", Users], ["Fichas clínicas", FileText], ["Progreso", Flower2]
        ].map(([label, Icon]) => (
          <button key={label} className={`nav-item ${page === label ? "active" : ""}`} onClick={() => navigate(label)}>
            <Icon size={19} /><span>{label}</span>
          </button>
        ))}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <button className="sidebar-bottom" onClick={() => setSettingsOpen(true)}><Settings size={17} /> <span>Configuración</span></button>
          <button className="sidebar-bottom" onClick={onLogout}><LogOut size={17} /> <span>Cerrar sesión</span></button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div><span className="eyebrow">CONSULTA PARTICULAR</span><h1>{page === "Inicio" ? "Mi espacio" : page}</h1></div>
          <div className="topbar-right">
            <button className="stat-chip" title="Días al día" aria-label={`Racha de ${streak.count} días al día`} onClick={() => navigate("Progreso")}><span aria-hidden="true">☀️</span>{streak.count}</button>
            {extras && (
              <button key={bump?.id || "hojas"} className={`stat-chip has-bump ${bump ? "bump" : ""}`} title="Hojas de esta semana" aria-label={`${leaves} hojas esta semana`} onClick={() => navigate("Progreso")}>
                <span aria-hidden="true">🍃</span>{leaves}{bump && <LeafBump amount={bump.amount} />}
              </button>
            )}
            <div className="avatar" aria-label="Perfil">PS</div>
          </div>
        </header>

        {page === "Inicio" && (
          <HomePage status={status} streak={streak} summary={weekSummary(leafLog, unlocked)} level={lvl.level}
            challenge={extras ? challenge : null} userName={user?.name} onNavigate={navigate} onFocusSlot={focusSlot} onOpenFicha={openFicha} />
        )}
        {page === "Agenda" && (
          <AgendaPage date={agendaDate} setDate={setAgendaDate} bookings={bookings} setBookings={setBookings} fichas={fichas}
            patients={patientNames} focusSlot={patientDraft?.slotKey || agendaFocus} openFocus={!!agendaFocus}
            onCreatePatient={createFromAgenda} onOpenFicha={openFicha} />
        )}
        {page === "Pacientes" && (
          <PatientsPage view={patientView} setView={setPatientView} fichas={fichas}
            onAdd={patientDraft ? addFromAgenda : addFicha} onUpdate={updatePatient}
            draft={patientDraft} onBackToAgenda={() => setPage("Agenda")} />
        )}
        {page === "Fichas clínicas" && (
          <FichasPage key={fichaDraft ? fichaDraft.name + fichaDraft.date : "nueva"} draft={fichaDraft} fichas={fichas}
            onAdd={addFicha} onViewPatients={() => navigate("Pacientes")} onNewPatient={() => navigate("Pacientes", "new")} onHome={() => navigate("Inicio")} />
        )}
        {page === "Progreso" && (
          <ProgressPage leaves={leaves} log={leafLog} streak={streak} counts={counts} unlocked={unlocked}
            extras={extras} total={total} themeId={themeId} onThemeChange={setThemeId} challenge={challenge}
            pieces={pieces} onOpenSettings={() => setSettingsOpen(true)} />
        )}

        <footer>humana-mente · Prototipo conceptual · Datos ficticios</footer>
      </main>

      {celebrations[0] && <Celebration key={celebrations[0].id} {...celebrations[0]} onDone={() => setCelebrations(list => list.slice(1))} />}
      {settingsOpen && <AssistantSettings value={intensitySetting} level={lvl.level} onChange={setIntensitySetting} onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

function Root() {
  const [user, setUser] = useState(null);

  if (!user) {
    return <LoginScreen onLoginSuccess={(userData) => setUser(userData)} />;
  }

  return <App user={user} onLogout={() => setUser(null)} />;
}

createRoot(document.getElementById("root")).render(<Root />);
