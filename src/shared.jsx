// Helpers de fecha y texto compartidos por la app y los módulos de gamificación.
import React from "react";
export const isoOf = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
export const todayISO = () => isoOf(new Date());
export const dayKeyOf = d => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const startOfWeek = d => addDays(d, -((d.getDay() + 6) % 7));  // lunes
export const WEEKDAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
export const sessionsOn = (bookings, d) => {
  const k = dayKeyOf(d);
  return Object.entries(bookings)
    .filter(([key, b]) => key.split("|")[0] === k && b.patient?.trim() && b.status !== "cancelada")
    .map(([key, b]) => ({ key, ...b, iso: isoOf(d) }))
    .sort((a, b) => a.key.localeCompare(b.key));
};
export const daysBetween = (a, b) => Math.round((new Date(`${b}T12:00`) - new Date(`${a}T12:00`)) / 86400000);
export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
export function ProgressBar({value}) { return <div className="progress-track"><div className="progress-fill" style={{width:`${value}%`}}/></div>; }
