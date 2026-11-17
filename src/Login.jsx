import React, { useState, useEffect } from 'react';
import './Login.css';
import logoIcon from "../brand/humana-mente-icon.svg";

export default function Login({ onLoginSuccess }) {
  // Pestaña activa: 'login' | 'register' | 'recover'
  const [activeTab, setActiveTab] = useState('login');

  // Estados de formularios
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Registro
  const [fullName, setFullName] = useState('');
  const [rut, setRut] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Recuperación
  const [recoverEmail, setRecoverEmail] = useState('');
  const [recoverSent, setRecoverSent] = useState(false);

  // Interactividad del asistente (🌸)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [mood, setMood] = useState('tranquilo');

  // Mini-simulador de gamificación
  const [streak, setStreak] = useState(11);
  const [leaves, setLeaves] = useState(15);
  const [plantStage, setPlantStage] = useState(2); // 1: Semilla, 2: Brote, 3: Flor, 4: Huerta
  const [floatingPoints, setFloatingPoints] = useState(null);
  const [isEntering, setIsEntering] = useState(false);

  // Mover mirada del asistente según el largo del correo
  useEffect(() => {
    const currentInput = activeTab === 'login' ? email : regEmail;
    if (!isPasswordFocused && currentInput.length > 0) {
      const progress = Math.min(currentInput.length / 25, 1);
      setEyeOffset({ x: (progress - 0.5) * 8, y: 3 });
    } else {
      setEyeOffset({ x: 0, y: 0 });
    }
  }, [email, regEmail, isPasswordFocused, activeTab]);

  // Formateo automático de RUT chileno
  const handleRutChange = (e) => {
    let clean = e.target.value.replace(/[^0-9kK]/g, '').toUpperCase();
    if (clean.length > 9) clean = clean.slice(0, 9);
    if (clean.length > 1) {
      const body = clean.slice(0, -1);
      const dv = clean.slice(-1);
      const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      setRut(`${formattedBody}-${dv}`);
    } else {
      setRut(clean);
    }
  };

  // Medidor botánico de contraseña
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { level: 0, label: 'Sin clave', icon: '🌱' };
    if (pwd.length < 6) return { level: 1, label: 'Semilla (muy corta)', icon: '🌱' };
    if (pwd.length < 9 || !/[0-9]/.test(pwd)) return { level: 2, label: 'Brote (agrega números)', icon: '🌿' };
    return { level: 3, label: 'Flor (clave segura)', icon: '🌸' };
  };

  // Acción del simulador de gamificación
  const triggerGamificationAction = (type) => {
    if (type === 'ficha') {
      setLeaves((prev) => prev + 10);
      setPlantStage((prev) => Math.min(prev + 1, 4));
      setFloatingPoints('+10 🌿 Ficha al día');
    } else if (type === 'jornada') {
      setStreak((prev) => prev + 1);
      setLeaves((prev) => prev + 5);
      setFloatingPoints('+1 ☀️ Racha aumentada');
    }
    setTimeout(() => setFloatingPoints(null), 1600);
  };

  // Envío de Login
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setIsEntering(true);
    setTimeout(() => {
      if (onLoginSuccess) {
        onLoginSuccess({ email: email || 'doctor@humanamente.cl', mood, streak, leaves });
      } else {
        setIsEntering(false);
        alert('¡Bienvenido a humana-mente! Redirigiendo a Mi espacio...');
      }
    }, 1100);
  };

  const handleDemoLogin = () => {
    setEmail('psicologo@humanamente.cl');
    setPassword('••••••••••••');
    setIsEntering(true);
    setTimeout(() => {
      if (onLoginSuccess) {
        onLoginSuccess({ name: 'Doctor PS', mood, streak, leaves });
      } else {
        setIsEntering(false);
        alert('Acceso Demo concedido: ¡Hola, Doctor!');
      }
    }, 1000);
  };

  const moodMessages = {
    tranquilo: 'Día tranquilo: listo para comenzar a tu ritmo ☕',
    enfocado: 'Modo enfoque: hoy dejamos todas las fichas al día 🎯',
    agradecido: 'Gran energía: cada sesión suma a tu huerta 🌱',
  };

  const plantIcons = ['🌱', '🌿', '🌸', '🍓'];
  const strength = getPasswordStrength(regPassword);

  return (
    <div className="hm-login-wrapper">
      {/* Partículas flotantes de fondo */}
      <div className="hm-bg-blobs">
        <span className="hm-blob hm-blob-1"></span>
        <span className="hm-blob hm-blob-2"></span>
      </div>

      <main className="hm-login-card">
        {/* PANEL IZQUIERDO: IDENTIDAD Y GAMIFICACIÓN INTERACTIVA */}
        
        <section className="hm-left-panel">
          {/* 
          <div className="hm-brand-header">
            <div className="hm-logo-badge">
              <span className="hm-logo-brain">🧠</span>
            </div>
            <div>
              <h1 className="hm-title">Humana-mente</h1>
              <p className="hm-brand-subtitle">Tu consulta, un paso a la vez.</p>
            </div>
          </div>*/}

          
          {/* Asistente reactivo */}
          {/*
          <div className="hm-assistant-box">
            <div className={`hm-flower-avatar ${isPasswordFocused ? 'is-hiding' : ''}`}>
              <span className="hm-flower-petal">🌸</span>
              {!isPasswordFocused ? (
                <div
                  className="hm-eyes"
                  style={{ transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)` }}
                >
                  <span className="hm-eye"></span>
                  <span className="hm-eye"></span>
                </div>
              ) : (
                <div className="hm-leaf-cover">🍃🍃</div>
              )}
            </div>
            <div className="hm-speech-bubble">
              <span className="hm-assistant-tag">TU ASISTENTE DE HOY</span>
              <p>{isPasswordFocused ? 'No miro tu clave, es privada 🔒' : moodMessages[mood]}</p>
            </div>
          </div>
          |*/}  

          {/* Selector de ánimo */}
          {/*
          <div className="hm-mood-selector">
            <span className="hm-section-label">¿CÓMO EMPIEZAS HOY?</span>
            <div className="hm-mood-pills">
              <button
                type="button"
                className={`hm-pill ${mood === 'tranquilo' ? 'active' : ''}`}
                onClick={() => setMood('tranquilo')}
              >
                ☕ Tranquilo
              </button>
              <button
                type="button"
                className={`hm-pill ${mood === 'enfocado' ? 'active' : ''}`}
                onClick={() => setMood('enfocado')}
              >
                🎯 Enfocado
              </button>
              <button
                type="button"
                className={`hm-pill ${mood === 'agradecido' ? 'active' : ''}`}
                onClick={() => setMood('agradecido')}
              >
                🌱 Motivado
              </button>
            </div>
          </div>
          */}      
        
        </section>

        {/* PANEL DERECHO: FORMULARIOS DINÁMICOS */}
        <section className="hm-right-panel">
          
          

          {/* VISTA: LOGIN */}
          {activeTab === 'login' && (

            <form className="hm-form fade-in" onSubmit={handleLoginSubmit}>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <img className="brand-mark" src={logoIcon} alt="" />
              </div>
    
              <div className="hm-form-header">
                
                <span className="hm-kicker">CONSULTA PARTICULAR</span>
                <h2>¡Hola, Doctor!</h2>
              </div>
              

              <div className="hm-input-group">
                <label htmlFor="login-email">Correo electrónico</label>
                <input
                  id="login-email"
                  type="email"
                  placeholder="ejemplo@humanamente.cl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="hm-input-group">
                <div className="hm-label-row">
                  <label htmlFor="login-pass">Contraseña</label>
                  <button
                    type="button"
                    className="hm-link-btn"
                    onClick={() => {
                      setRecoverSent(false);
                      setActiveTab('recover');
                    }}
                  >
                    ¿Olvidaste tu clave?
                  </button>
                </div>
                <div className="hm-password-wrapper">
                  <input
                    id="login-pass"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="hm-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Mostrar contraseña"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <label className="hm-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Mantener mi sesión iniciada en este equipo</span>
              </label>

              <button type="submit" className="hm-primary-btn" disabled={isEntering}>
                {isEntering ? 'Abriendo tu consulta...' : 'Entrar a mi espacio'}
              </button>

              <div className="hm-divider">
                <span>o prueba el entorno</span>
              </div>

              <button type="button" className="hm-demo-btn" onClick={handleDemoLogin}>
                <span className="hm-avatar-initials">PS</span>
                Entrar con cuenta Demo (Dr. PS)
              </button>
            </form>
          )}

          
          {/* VISTA: RECUPERAR CONTRASEÑA */}
          {activeTab === 'recover' && (
            <div className="hm-form fade-in">
              <button
                type="button"
                className="hm-back-btn"
                onClick={() => setActiveTab('login')}
              >
                ← Volver al inicio de sesión
              </button>

              <div className="hm-form-header">
                <span className="hm-kicker"></span>
                <h2>Recupera tu clave</h2>
                <p>Ingresa el código de verificación que recibiste en tu celular.</p>
              </div>

              {!recoverSent ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setRecoverSent(true);
                  }}
                >
                  <div className="hm-input-group">
                    <label htmlFor="rec-email"></label>
                    <input
                      id="rec-email"
                      type="email"
                      placeholder="Código"
                      value={recoverEmail}
                      onChange={(e) => setRecoverEmail(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="hm-primary-btn">
                    Enviar código
                  </button>
                </form>
              ) : (
                <div className="hm-success-box">
                  <span>✉️</span>
                  <p>
                    ¡Listo! Revisa la bandeja de entrada de <strong>{recoverEmail}</strong>.
                  </p>
                </div>
              )}
            </div>
          )}

          <footer className="hm-footer">
            verisón 1.0.0 - © 2026 
          </footer>
        </section>
      </main>
    </div>
  );
}