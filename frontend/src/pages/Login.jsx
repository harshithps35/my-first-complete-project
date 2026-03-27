import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // Animated water particle background
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.4,
      dy: -Math.random() * 0.6 - 0.2,
      opacity: Math.random() * 0.5 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(14,165,233,${p.opacity})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        if (!form.name.trim()) { setError('Name is required'); setLoading(false); return; }
        await register(form.name, form.email, form.password);
      }
      navigate('/address');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <canvas ref={canvasRef} className="login-canvas" />

      {/* Background gradient orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="login-wrapper">
        {/* Left Panel — Branding */}
        <div className="login-brand">
          <div className="brand-logo">
            <div className="logo-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M16 2C16 2 6 10 6 18a10 10 0 0020 0C26 10 16 2 16 2z" fill="url(#water-grad)" />
                <path d="M10 20c0-4 4-8 6-12 2 4 6 8 6 12" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none" />
                <defs>
                  <linearGradient id="water-grad" x1="16" y1="2" x2="16" y2="28" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div>
              <div className="brand-name">AquaSense</div>
              <div className="brand-tagline">Smart Water Intelligence</div>
            </div>
          </div>

          <div className="brand-hero">
            <h1 className="brand-headline">Monitor. Predict.<br /><span className="gradient-text">Preserve.</span></h1>
            <p className="brand-desc">
              AI-powered groundwater monitoring for North Bangalore.
              Real-time IoT sensors + satellite data to protect our water future.
            </p>
          </div>

          <div className="brand-stats">
            {[
              { label: 'IoT Sensors', value: '8+', icon: '📡' },
              { label: 'Zones Monitored', value: '6', icon: '🗺' },
              { label: 'AI Accuracy', value: '92%', icon: '🤖' },
            ].map(s => (
              <div key={s.label} className="stat-chip">
                <span className="stat-icon">{s.icon}</span>
                <div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="brand-areas">
            {['Yelahanka', 'Hebbal', 'Devanahalli', 'Kogilu', 'Bagalur', 'Rajanukunte'].map(a => (
              <span key={a} className="area-chip">{a}</span>
            ))}
          </div>
        </div>

        {/* Right Panel — Auth Form */}
        <div className="login-form-panel glass-card">
          <div className="form-header">
            <h2 className="form-title">{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
            <p className="form-subtitle">
              {mode === 'login'
                ? 'Sign in to access your groundwater dashboard'
                : 'Join AquaSense to monitor your area'}
            </p>
          </div>

          <div className="mode-toggle">
            <button className={`toggle-btn ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>Sign In</button>
            <button className={`toggle-btn ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>Register</button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'register' && (
              <div className="form-group slide-in">
                <label className="form-label">Full Name</label>
                <input
                  id="reg-name"
                  name="name"
                  type="text"
                  className="form-input"
                  placeholder="Harshith Prasad"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                id="auth-email"
                name="email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                id="auth-password"
                name="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <button id="auth-submit-btn" type="submit" className="btn btn-primary submit-btn" disabled={loading}>
              {loading ? (
                <><span className="btn-loader"></span> {mode === 'login' ? 'Signing in...' : 'Creating account...'}</>
              ) : (
                mode === 'login' ? '→ Sign In' : '→ Create Account'
              )}
            </button>
          </form>

          <div className="demo-hint">
            <span>🔑</span> Demo: <strong>test@aquasense.com</strong> / <strong>password123</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
