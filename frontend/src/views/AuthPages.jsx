import { useState } from "react";
import { registerUser, loginUser } from "../api";
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');

  .auth-root {
    font-family: 'DM Sans', sans-serif;
    background: #0d0a1a;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    position: relative;
    overflow: hidden;
  }

  .auth-root *, .auth-root *::before, .auth-root *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .bg-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
  }
  .orb1 { width: 340px; height: 340px; background: #6c3fc7; top: -80px; left: -80px; opacity: 0.45; }
  .orb2 { width: 260px; height: 260px; background: #a855f7; bottom: -60px; right: -60px; opacity: 0.35; }
  .orb3 { width: 180px; height: 180px; background: #7c3aed; top: 40%; left: 50%; transform: translateX(-50%); opacity: 0.18; }

  .tab-row {
    display: flex;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(168,85,247,0.25);
    border-radius: 50px;
    padding: 4px;
    margin-bottom: 2rem;
    position: relative;
    z-index: 2;
  }

  .tab-btn {
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: rgba(255,255,255,0.5);
    background: none;
    border: none;
    padding: 8px 28px;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.3s ease;
    letter-spacing: 0.3px;
  }
  .tab-btn.active {
    background: linear-gradient(135deg, #7c3aed, #a855f7);
    color: #fff;
    box-shadow: 0 4px 20px rgba(168,85,247,0.4);
  }

  .auth-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(168,85,247,0.2);
    border-radius: 24px;
    padding: 2.2rem 2rem;
    width: 100%;
    max-width: 420px;
    backdrop-filter: blur(20px);
    position: relative;
    z-index: 2;
    box-shadow: 0 8px 60px rgba(108,63,199,0.3), inset 0 1px 0 rgba(255,255,255,0.08);
    animation: fadeUp 0.4s ease both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .card-header { text-align: center; margin-bottom: 1.8rem; }

  .card-icon {
    width: 52px; height: 52px;
    background: linear-gradient(135deg, #6d28d9, #a855f7);
    border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 1rem;
    box-shadow: 0 6px 24px rgba(168,85,247,0.5);
    font-size: 22px;
    color: #fff;
  }

  .card-title {
    font-family: 'Syne', sans-serif;
    font-size: 22px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 4px;
    letter-spacing: -0.3px;
  }

  .card-sub {
    font-size: 13px;
    color: rgba(255,255,255,0.4);
  }

  .form-group { margin-bottom: 1rem; }

  .form-label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: rgba(255,255,255,0.5);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
  }

  .input-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-icon {
    position: absolute;
    left: 14px;
    color: rgba(168,85,247,0.6);
    font-size: 16px;
    pointer-events: none;
    z-index: 1;
  }

  .form-input {
    width: 100%;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(168,85,247,0.2);
    border-radius: 12px;
    padding: 11px 14px 11px 40px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: #fff;
    outline: none;
    transition: border 0.2s, box-shadow 0.2s, background 0.2s;
  }
  .form-input::placeholder { color: rgba(255,255,255,0.22); }
  .form-input:focus {
    border-color: rgba(168,85,247,0.6);
    background: rgba(168,85,247,0.07);
    box-shadow: 0 0 0 3px rgba(168,85,247,0.12);
  }

  .form-input.has-toggle { padding-right: 40px; }

  .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  .toggle-pass {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    cursor: pointer;
    color: rgba(255,255,255,0.3);
    font-size: 16px;
    padding: 4px;
    transition: color 0.2s;
    z-index: 1;
  }
  .toggle-pass:hover { color: rgba(168,85,247,0.8); }

  .strength-bar {
    display: flex; gap: 4px; margin-top: 6px;
  }
  .strength-seg {
    flex: 1; height: 3px; border-radius: 3px;
    background: rgba(255,255,255,0.1);
    transition: background 0.3s;
  }
  .strength-seg.weak   { background: #f87171; }
  .strength-seg.medium { background: #facc15; }
  .strength-seg.strong { background: #a855f7; }

  .remember-row {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 1.2rem;
  }

  .check-label {
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; color: rgba(255,255,255,0.45);
    cursor: pointer;
  }
  .check-label input[type=checkbox] {
    accent-color: #a855f7;
    width: 15px; height: 15px;
    cursor: pointer;
  }

  .forgot-link {
    font-size: 13px;
    color: #a855f7;
    background: none;
    border: none;
    cursor: pointer;
    transition: color 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .forgot-link:hover { color: #c084fc; }

  .btn-primary {
    width: 100%;
    padding: 13px;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
    color: #fff;
    font-family: 'Syne', sans-serif;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    letter-spacing: 0.2px;
    transition: transform 0.15s, box-shadow 0.2s, opacity 0.2s;
    box-shadow: 0 6px 24px rgba(168,85,247,0.45);
  }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 10px 32px rgba(168,85,247,0.55); }
  .btn-primary:active { transform: translateY(0); opacity: 0.9; }

  .divider {
    display: flex; align-items: center; gap: 10px;
    margin: 1.2rem 0;
  }
  .divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.08); }
  .divider-text { font-size: 12px; color: rgba(255,255,255,0.25); }

  .socials { display: flex; gap: 10px; }
  .social-btn {
    flex: 1;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 10px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    color: rgba(255,255,255,0.7);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.2s, border 0.2s;
  }
  .social-btn:hover { background: rgba(168,85,247,0.1); border-color: rgba(168,85,247,0.3); }

  .footer-text {
    text-align: center;
    margin-top: 1.4rem;
    font-size: 13px;
    color: rgba(255,255,255,0.3);
  }

  .footer-link {
    color: #a855f7;
    background: none;
    border: none;
    cursor: pointer;
    font-weight: 500;
    font-size: 13px;
    font-family: 'DM Sans', sans-serif;
    transition: color 0.2s;
  }
  .footer-link:hover { color: #c084fc; }

  .terms-link {
    color: #a855f7;
    text-decoration: none;
  }

  .toast {
    position: absolute;
    top: -56px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(168,85,247,0.15);
    border: 1px solid rgba(168,85,247,0.4);
    border-radius: 50px;
    padding: 8px 20px;
    font-size: 13px;
    color: #c084fc;
    white-space: nowrap;
    animation: slideIn 0.3s ease;
    pointer-events: none;
  }

  @keyframes slideIn {
    from { opacity: 0; top: -40px; }
    to   { opacity: 1; top: -56px; }
  }
`;

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const GitHubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
  </svg>
);

function getStrength(val) {
  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  return score;
}

function StrengthBar({ password }) {
  const score = password ? getStrength(password) : 0;
  const cls = score <= 1 ? "weak" : score <= 2 ? "medium" : "strong";
  return (
    <div className="strength-bar">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`strength-seg${i < score ? " " + cls : ""}`} />
      ))}
    </div>
  );
}

function LoginCard({ onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [toast, setToast] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    try {
      const res = await loginUser(email, password);
      localStorage.setItem('user', JSON.stringify(res.data));
      window.location.hash = '#/upload';
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    }
  };
  return (
    <div className="auth-card" key="login">
      {toast && <div className="toast">✦ Welcome back!</div>}
      <div className="card-header">
        <div className="card-icon">🔒</div>
        <div className="card-title">Welcome back</div>
        <div className="card-sub">Sign in to continue your journey</div>
      </div>

      <div className="form-group">
        <label className="form-label">Email address</label>
        <div className="input-wrap">
          <span className="input-icon">✉</span>
          <input
            className="form-input"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Password</label>
        <div className="input-wrap">
          <span className="input-icon">🔑</span>
          <input
            className="form-input has-toggle"
            type={showPass ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="toggle-pass" onClick={() => setShowPass(!showPass)} aria-label="toggle password">
            {showPass ? "🙈" : "👁"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: "rgba(248,113,113,0.1)",
          border: "1px solid rgba(248,113,113,0.3)",
          borderRadius: "10px",
          padding: "10px 14px",
          fontSize: "13px",
          color: "#f87171",
          marginBottom: "1rem",
          textAlign: "center"
        }}>
          {error}
        </div>
      )}

      <button className="btn-primary" onClick={handleSubmit}>Sign in →</button>


      <p className="footer-text">
        No account yet?{" "}
        <button className="footer-link" onClick={onSwitch}>Create one</button>
      </p>
    </div>
  );
}

function RegisterCard({ onSwitch }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [agree, setAgree] = useState(false);
  const [toast, setToast] = useState(false);
  const [error, setError] = useState("");
 

  const handleSubmit = async () => {
    setError("");
    if (!firstName || !email || !password) { setError("Please fill in all fields."); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
    if (!emailRegex.test(email)) { setError("Please enter a valid email address."); return; } 

    if (!agree) { setError("Please agree to the terms."); return; }
    try {
      const res = await registerUser(email, password, firstName, lastName);
      localStorage.setItem('user', JSON.stringify(res.data));
      window.location.hash = '#/upload';
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    }
  };
  return (
    <div className="auth-card" key="register">
      {toast && <div className="toast">✦ Account created!</div>}
      <div className="card-header">
        <div className="card-icon">✨</div>
        <div className="card-sub">Create your account in seconds</div>
      </div>

      <div className="row-2">
        <div className="form-group">
          <label className="form-label">First name</label>
          <div className="input-wrap">
            <span className="input-icon">👤</span>
            <input
              className="form-input"
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Last name</label>
          <div className="input-wrap">
            <span className="input-icon">👤</span>
            <input
              className="form-input"
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Email address</label>
        <div className="input-wrap">
          <span className="input-icon">✉</span>
          <input
            className="form-input"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Password</label>
        <div className="input-wrap">
          <span className="input-icon">🔑</span>
          <input
            className="form-input has-toggle"
            type={showPass ? "text" : "password"}
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="toggle-pass" onClick={() => setShowPass(!showPass)} aria-label="toggle password">
            {showPass ? "🙈" : "👁"}
          </button>
        </div>
        <StrengthBar password={password} />
      </div>

      <div className="form-group" style={{ marginBottom: "1.2rem" }}>
        <label className="check-label">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          I agree to the{" "}
          <a href="#" className="terms-link">Terms</a> &amp;{" "}
          <a href="#" className="terms-link">Privacy Policy</a>
        </label>
      </div>

      {error && (
        <div style={{
          background: "rgba(248,113,113,0.1)",
          border: "1px solid rgba(248,113,113,0.3)",
          borderRadius: "10px",
          padding: "10px 14px",
          fontSize: "13px",
          color: "#f87171",
          marginBottom: "1rem",
          textAlign: "center"
        }}>
          {error}
        </div>
      )}

      <button className="btn-primary" onClick={handleSubmit}>Create account →</button>

      <p className="footer-text">
        Already have an account?{" "}
        <button className="footer-link" onClick={onSwitch}>Sign in</button>
      </p>
    </div>
  );
}

export default function AuthPages() {
  const [tab, setTab] = useState("login");

  return (
    <>
      <style>{styles}</style>
      <div className="auth-root">
        <div className="bg-orb orb1" />
        <div className="bg-orb orb2" />
        <div className="bg-orb orb3" />

        <div className="tab-row">
          <button
            className={`tab-btn${tab === "login" ? " active" : ""}`}
            onClick={() => setTab("login")}
          >
            Sign in
          </button>
          <button
            className={`tab-btn${tab === "register" ? " active" : ""}`}
            onClick={() => setTab("register")}
          >
            Create account
          </button>
        </div>

        {tab === "login"
          ? <LoginCard onSwitch={() => setTab("register")} />
          : <RegisterCard onSwitch={() => setTab("login")} />
        }
      </div>
    </>
  );
}
