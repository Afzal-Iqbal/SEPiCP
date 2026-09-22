// frontend/src/pages/AuthPage.jsx
// ── Fix: all screen components are defined at MODULE level (not inside AuthPage)
// ── so React never unmounts them on state changes → no re-render flicker

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, BookOpen, Lock, Mail, User, Eye, EyeOff,
  ArrowRight, CheckCircle, AlertTriangle, ChevronRight, KeyRound, Shield
} from 'lucide-react';

// ── Shared password input with show/hide ──────────────────────────────────────
function PwInput({ id, placeholder, value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <div style={inputWrap}>
      <Lock size={18} color="#94a3b8" style={{ flexShrink: 0 }} />
      <input id={id} type={show ? 'text' : 'password'} placeholder={placeholder}
        value={value} onChange={onChange} autoComplete="new-password" required
        style={inputBase} />
      <button type="button" onClick={() => setShow(s => !s)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#94a3b8' }}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function TextInput({ id, type = 'text', placeholder, value, onChange, icon: Icon }) {
  return (
    <div style={inputWrap}>
      <Icon size={18} color="#94a3b8" style={{ flexShrink: 0 }} />
      <input id={id} type={type} placeholder={placeholder} value={value}
        onChange={onChange} autoComplete="off" required style={inputBase} />
    </div>
  );
}

const inputWrap = {
  display: 'flex', alignItems: 'center', gap: 12,
  background: '#f8fafc', border: '1.5px solid #e2e8f0',
  borderRadius: 14, padding: '0 16px',
};
const inputBase = {
  flex: 1, border: 'none', background: 'transparent',
  padding: '15px 0', fontSize: 14, color: '#0f172a',
  outline: 'none', fontWeight: 500,
};

// ── SCREEN 1: Role chooser ────────────────────────────────────────────────────
function ChooseScreen({ onTeacher, onStudent, onAdmin }) {
  return (
    <motion.div key="choose"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.25 }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>
          Who are you?
        </h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>Select your role to continue.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Teacher */}
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={onTeacher}
          style={roleCard}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#1e3a8a'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(30,58,138,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}>
          <div style={{ ...roleIcon, background: '#eff6ff' }}>
            <BookOpen size={26} color="#1e3a8a" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>I'm a Teacher</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>
              Register or sign in to create and publish surveys
            </div>
          </div>
          <ChevronRight size={20} color="#94a3b8" />
        </motion.button>

        {/* Student */}
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={onStudent}
          style={roleCard}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#0891b2'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(8,145,178,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}>
          <div style={{ ...roleIcon, background: '#ecfeff' }}>
            <GraduationCap size={26} color="#0891b2" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>I'm a Student</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>
              No account needed — just enter the course code from your teacher
            </div>
          </div>
          <div style={{ background: '#ecfeff', color: '#0891b2', fontSize: 11,
            fontWeight: 800, padding: '4px 10px', borderRadius: 99,
            textTransform: 'uppercase', letterSpacing: 1, flexShrink: 0 }}>
            No Login
          </div>
        </motion.button>
        {/* Admin */}
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={onAdmin}
          style={roleCard}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#15803d'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(21,128,61,0.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}>
          <div style={{ ...roleIcon, background: '#f0fdf4' }}>
            <Shield size={26} color="#15803d" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>I'm an Admin</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>
              Superuser access to system management and responses
            </div>
          </div>
          <ChevronRight size={20} color="#94a3b8" />
        </motion.button>
      </div>
    </motion.div>
  );
}

const roleCard = {
  display: 'flex', alignItems: 'center', gap: 18,
  padding: '22px 24px', borderRadius: 18,
  border: '2px solid #e2e8f0', background: '#fff',
  cursor: 'pointer', textAlign: 'left', width: '100%',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};
const roleIcon = {
  width: 52, height: 52, borderRadius: 14,
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};

// ── SCREEN 2: Teacher Login ───────────────────────────────────────────────────
function TeacherLoginScreen({ email, setEmail, password, setPassword, error, success, loading, onSubmit, onRegister, onBack }) {
  return (
    <motion.div key="teacher-login"
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ ...roleIcon, background: '#eff6ff', width: 44, height: 44, borderRadius: 12 }}>
          <BookOpen size={20} color="#1e3a8a" />
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>Teacher Sign In</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Access your survey dashboard</div>
        </div>
      </div>

      <Alert error={error} success={success} />

      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <TextInput id="t-email" type="email" placeholder="your@university.edu"
          icon={Mail} value={email} onChange={e => setEmail(e.target.value)} />
        <PwInput id="t-password" placeholder="Password"
          value={password} onChange={e => setPassword(e.target.value)} />

        <button type="submit" disabled={loading} style={submitBtn(loading)}>
          {loading ? 'Signing in…' : <><KeyRound size={18} /> Sign In</>}
        </button>
      </form>

      <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
        <p style={{ fontSize: 13, color: '#64748b' }}>
          Don't have an account?{' '}
          <button type="button" onClick={onRegister} style={linkBtn}>Create teacher account</button>
        </p>
        <button type="button" onClick={onBack} style={backBtn}>← Back to role selection</button>
      </div>
    </motion.div>
  );
}

// ── SCREEN 3: Admin Login ───────────────────────────────────────────────────
function AdminLoginScreen({ email, setEmail, password, setPassword, error, success, loading, onSubmit, onBack }) {
  return (
    <motion.div key="admin-login"
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ ...roleIcon, background: '#f0fdf4', width: 44, height: 44, borderRadius: 12 }}>
          <Shield size={20} color="#15803d" />
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>Admin Sign In</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Superuser privileges required</div>
        </div>
      </div>

      <Alert error={error} success={success} />

      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <TextInput id="a-email" type="email" placeholder="admin@system.edu"
          icon={Mail} value={email} onChange={e => setEmail(e.target.value)} />
        <PwInput id="a-password" placeholder="Password"
          value={password} onChange={e => setPassword(e.target.value)} />

        <button type="submit" disabled={loading} style={{ ...submitBtn(loading), background: '#15803d', boxShadow: '0 4px 20px rgba(21,128,61,0.25)' }}>
          {loading ? 'Signing in…' : <><KeyRound size={18} /> Sign In</>}
        </button>
      </form>

      <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
        <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center' }}>
          No registration available for this role. If you are an admin and cannot log in, contact system support.
        </p>
        <button type="button" onClick={onBack} style={backBtn}>← Back to role selection</button>
      </div>
    </motion.div>
  );
}

// ── SCREEN 3: Teacher Register ────────────────────────────────────────────────
function TeacherRegisterScreen({ name, setName, email, setEmail, password, setPassword, confirmPw, setConfirmPw, error, loading, onSubmit, onLogin, onBack }) {
  return (
    <motion.div key="teacher-register"
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <div style={{ ...roleIcon, background: '#eff6ff', width: 44, height: 44, borderRadius: 12 }}>
          <BookOpen size={20} color="#1e3a8a" />
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>Create Teacher Account</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Register to start publishing surveys</div>
        </div>
      </div>

      <Alert error={error} />

      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <TextInput id="r-name" placeholder="Full Name"
          icon={User} value={name} onChange={e => setName(e.target.value)} />
        <TextInput id="r-email" type="email" placeholder="Academic email (e.g. john@university.edu)"
          icon={Mail} value={email} onChange={e => setEmail(e.target.value)} />
        <PwInput id="r-password" placeholder="Password (min. 8 characters)"
          value={password} onChange={e => setPassword(e.target.value)} />
        <PwInput id="r-confirm" placeholder="Confirm Password"
          value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />

        {/* Strength bar */}
        {password.length > 0 && (
          <div style={{ display: 'flex', gap: 4 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 99,
                background: password.length >= i * 3 ? '#1e3a8a' : '#e2e8f0',
                transition: 'background 0.2s' }} />
            ))}
          </div>
        )}

        <button type="submit" disabled={loading} style={submitBtn(loading)}>
          {loading ? 'Creating account…' : <><ArrowRight size={18} /> Create Account</>}
        </button>
      </form>

      <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
        <p style={{ fontSize: 13, color: '#64748b' }}>
          Already have an account?{' '}
          <button type="button" onClick={onLogin} style={linkBtn}>Sign in</button>
        </p>
        <button type="button" onClick={onBack} style={backBtn}>← Back to role selection</button>
      </div>
    </motion.div>
  );
}

// ── Shared mini components ────────────────────────────────────────────────────
function Alert({ error, success }) {
  return (
    <AnimatePresence>
      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12,
            padding: '12px 16px', color: '#dc2626', fontSize: 13, fontWeight: 600,
            display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 16 }}>
          <AlertTriangle size={15} style={{ marginTop: 1, flexShrink: 0 }} />{error}
        </motion.div>
      )}
      {success && !error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12,
            padding: '12px 16px', color: '#16a34a', fontSize: 13, fontWeight: 600,
            display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
          <CheckCircle size={15} />{success}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const submitBtn = (loading) => ({
  marginTop: 8, padding: '15px', borderRadius: 14,
  background: loading ? '#94a3b8' : '#1e3a8a',
  color: '#fff', border: 'none', fontWeight: 800, fontSize: 15,
  cursor: loading ? 'not-allowed' : 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  boxShadow: '0 4px 20px rgba(30,58,138,0.25)',
});
const linkBtn = {
  background: 'none', border: 'none', color: '#1e3a8a',
  fontWeight: 800, cursor: 'pointer', fontSize: 13,
};
const backBtn = {
  background: 'none', border: 'none', color: '#94a3b8',
  cursor: 'pointer', fontSize: 12, fontWeight: 600,
};

// ── Main AuthPage (state lives here, no inner component definitions) ───────────
export default function AuthPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const [screen, setScreen]       = useState('choose');
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [loading, setLoading]     = useState(false);

  const clear = () => { setName(''); setEmail(''); setPassword(''); setConfirmPw(''); setError(''); setSuccess(''); };

  const goTo = (s) => { clear(); setScreen(s); };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (password !== confirmPw) { setError('Passwords do not match.'); return; }
    if (password.length < 8)    { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      const res  = await fetch('http://127.0.0.1:8080/api/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: name.trim().toLowerCase().replace(/\s+/g, '_'),
          email: email.trim(),
          password,
          role: 'teacher',
          first_name: name.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || Object.values(data).flat().join(' '));
        return;
      }
      setSuccess('Account created! Please sign in.');
      goTo('teacher-login');
    } catch {
      setError('Server error. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const result = await login(email.trim(), password, 'teacher');
      if (!result.success) setError(result.message || 'Login failed.');
      // On success AuthContext sets user → App.jsx redirects to /teacher
    } catch {
      setError('Server error. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #f8fafc 50%, #e0f2fe 100%)',
      display: 'flex' }}>

      {/* ── Left hero (md+ screens) ── */}
      <div className="auth-hero" style={{ flex: 1, flexDirection: 'column',
        justifyContent: 'center', padding: '60px 72px',
        background: '#1e3a8a', position: 'relative', overflow: 'hidden', display: 'none' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300,
          borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 250, height: 250,
          borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 56 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={24} color="#fff" />
            </div>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>SEPiCP</span>
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 20 }}>
            Student Engagement<br />&amp; Pedagogy<br />
            <span style={{ color: '#93c5fd' }}>Evaluation Platform</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 1.7, maxWidth: 400, marginBottom: 44 }}>
            A research tool bridging instructor pedagogy and student experience through structured, anonymous evaluation surveys.
          </p>
          {['📋 75-field Instructor Survey', '📝 84-field Student Survey',
            '🔐 Anonymous Student Responses', '📊 Built-in Analytics'].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <CheckCircle size={15} color="#4ade80" />
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 600 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', padding: '40px 24px', margin: '0 auto' }}>
        {/* Mobile logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: '#1e3a8a',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={22} color="#fff" />
          </div>
          <span style={{ fontSize: 17, fontWeight: 900, color: '#0f172a' }}>SEPiCP</span>
        </div>

        {/* Card */}
        <div style={{ width: '100%', background: '#fff', borderRadius: 28, padding: '40px 36px',
          boxShadow: '0 20px 80px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
          <AnimatePresence mode="wait">
            {screen === 'choose'           && <ChooseScreen onTeacher={() => goTo('teacher-login')} onStudent={() => navigate('/survey/student')} onAdmin={() => goTo('admin-login')} />}
            {screen === 'teacher-login'    && <TeacherLoginScreen email={email} setEmail={setEmail} password={password} setPassword={setPassword} error={error} success={success} loading={loading} onSubmit={handleLogin} onRegister={() => goTo('teacher-register')} onBack={() => goTo('choose')} />}
            {screen === 'teacher-register' && <TeacherRegisterScreen name={name} setName={setName} email={email} setEmail={setEmail} password={password} setPassword={setPassword} confirmPw={confirmPw} setConfirmPw={setConfirmPw} error={error} loading={loading} onSubmit={handleRegister} onLogin={() => goTo('teacher-login')} onBack={() => goTo('choose')} />}
            {screen === 'admin-login'      && <AdminLoginScreen email={email} setEmail={setEmail} password={password} setPassword={setPassword} error={error} success={success} loading={loading} onSubmit={handleLogin} onBack={() => goTo('choose')} />}
          </AnimatePresence>
        </div>

        <p style={{ marginTop: 20, color: '#94a3b8', fontSize: 12, textAlign: 'center' }}>
          © 2026 SEPiCP · All responses are confidential
        </p>
      </div>

      <style>{`@media (min-width: 900px) { .auth-hero { display: flex !important; } }`}</style>
    </div>
  );
}
