import React from "react";
import { Leaf, CalendarCheck } from "lucide-react";
import { isoOf, todayISO, startOfWeek, ProgressBar } from "../shared.jsx";
import { gardenStagesFor, LevelCard } from "../gamification/levels.jsx";
import { ChallengeCard, Greenhouse } from "../gamification/challenges.jsx";
import { ACHIEVEMENTS, LEAF_RULES, stageFor, formatFicha, weekSummary } from "../data/initialData.js";
import { StreakLine, WeekSummary, ResetData } from "../components/SharedUI.jsx";

function Achievements({ counts, unlocked }) {
  return (
    <div className="badge-grid">
      {ACHIEVEMENTS.map(a => {
        const value = Math.min(counts[a.count], a.goal), done = !!unlocked?.[a.id];
        return (
          <div key={a.id} className={`badge ${done ? "" : "locked"}`}>
            <span className="badge-emoji" aria-hidden="true">{a.emoji}</span>
            <b>{a.name}</b><small>{a.desc}</small>
            {done ? <span className="badge-state">Desbloqueado</span>
              : <><ProgressBar value={value / a.goal * 100} /><span className="badge-state">{value}/{a.goal}</span></>}
          </div>
        );
      })}
    </div>
  );
}

export default function ProgressPage({ leaves, log, streak, counts, unlocked, extras, total, themeId, onThemeChange, challenge, pieces, onOpenSettings }) {
  const stages = gardenStagesFor(themeId);
  const stage = stageFor(leaves, stages);
  const span = stage.next ? stage.next.min - stage.min : 1;
  const recent = [...log].reverse().slice(0, 5);
  const when = iso => iso === todayISO() ? "Hoy" : formatFicha(iso).split(" ").slice(0, 3).join(" ");

  if (!extras) {
    return (
      <div className="content">
        <section className="card">
          <div className="card-heading"><h3>Racha</h3><span className="streak-big">☀️ {streak.count}</span></div>
          <StreakLine streak={streak} />
          <p className="muted">Estás en intensidad mínima: el jardín, las hojas y los desafíos están ocultos, pero tus avances siguen guardados.</p>
          <button className="secondary" onClick={onOpenSettings}>Cambiar intensidad</button>
        </section>
        <ResetData />
      </div>
    );
  }

  return (
    <div className="content">
      <LevelCard total={total} themeId={themeId} onThemeChange={onThemeChange} />
      <ChallengeCard challenge={challenge} />
      <section className="card garden">
        <span className="eyebrow">TU JARDÍN DE ESTA SEMANA</span>
        <div className="garden-plant" aria-hidden="true">{stage.emoji}</div>
        <h2>{stage.name}</h2>
        <p className="muted">Llevas <b>{leaves} hojas</b> esta semana. El jardín vuelve a ser semilla cada lunes.</p>
        <div className="garden-progress">
          <ProgressBar value={stage.next ? (leaves - stage.min) / span * 100 : 100} />
          <p>{stage.next ? `Te faltan ${stage.next.min - leaves} hojas para ${stage.next.emoji} ${stage.next.name}` : `¡Tu jardín llegó a su última etapa esta semana! ${stage.emoji}`}</p>
        </div>
        <ol className="stages">
          {stages.map((s, i) => <li key={s.name} className={i <= stage.index ? "reached" : ""}><span aria-hidden="true">{s.emoji}</span><small>{s.name}</small></li>)}
        </ol>
      </section>

      <div className="progress-grid">
        <section className="card">
          <div className="card-heading"><h3>Racha</h3><span className="streak-big">☀️ {streak.count}</span></div>
          <StreakLine streak={streak} />
          <p className="muted">Suma un día hábil cuando todas sus atenciones tienen ficha. Los fines de semana y los días sin atenciones no la cortan, y cada semana tienes un día de gracia.</p>
        </section>
        <section className="card">
          <div className="card-heading"><h3>Cómo ganar hojas</h3><Leaf className="sage-icon" /></div>
          <ul className="leaf-list">{LEAF_RULES.map(([label, n]) => <li key={label}><span>{label}</span><b>+{n} 🍃</b></li>)}</ul>
        </section>
      </div>

      <section className="card">
        <div className="card-heading"><h3>Últimas hojas</h3></div>
        {recent.length
          ? <ul className="leaf-list">{recent.map(e => <li key={e.key}><span>{e.reason}<small> · {when(e.date)}</small></span><b>+{e.amount} 🍃</b></li>)}</ul>
          : <p className="muted">Aún no ganas hojas esta semana. ¡Tu primera ficha suma 10!</p>}
      </section>

      <section className="card">
        <div className="card-heading">
          <div><h3>Resumen de la semana</h3><p className="muted">Desde el lunes {formatFicha(isoOf(startOfWeek(new Date()))).split(" ").slice(1, 4).join(" ")}</p></div>
          <CalendarCheck className="sage-icon" />
        </div>
        <WeekSummary summary={weekSummary(log, unlocked)} />
      </section>

      <section className="card">
        <div className="card-heading"><h3>Logros</h3><strong>{ACHIEVEMENTS.filter(a => unlocked?.[a.id]).length}/{ACHIEVEMENTS.length}</strong></div>
        <Achievements counts={counts} unlocked={unlocked} />
      </section>

      <Greenhouse earned={pieces} />
      <ResetData />
    </div>
  );
}
