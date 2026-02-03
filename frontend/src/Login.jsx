import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { ChevronRight, ShieldCheck, User, Lock } from "lucide-react";
import "./Login.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const login = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        setError("Invalid credentials");
        setLoading(false);
        return;
      }

      const data = await res.json();
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      navigate("/");
    } catch {
      setError("Connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="login-card"
      >
        <div className="login-left">
          <Motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="login-logo">
              <ShieldCheck size={32} color="var(--accent)" />
            </div>
            <h2>Welcome back</h2>
            <p className="subtitle">Enter your credentials to access the Trend Hub</p>
          </Motion.div>

          {error && (
            <Motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="error"
            >
              {error}
            </Motion.p>
          )}

          <div className="auth-form">
            <div className="input-group">
              <div className="input-field">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="input-field">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <Motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={login}
              disabled={loading}
              className="login-btn"
            >
              {loading ? "Authenticating..." : "Sign In"}
              {!loading && <ChevronRight size={18} />}
            </Motion.button>
          </div>

          <p className="signup-prompt">
            Don’t have an account? <Link to="/signup">Create shared access</Link>
          </p>
        </div>

        <div className="login-right">
          <div className="glass-panel">
            <Motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3>Job Market <br />Trend Hub</h3>
              <p>Advanced AI-driven insights for the modern employment landscape.</p>
              <div className="feature-badges">
                <span className="badge">Spring Physics</span>
                <span className="badge">Bento Grid</span>
                <span className="badge">AI Driven</span>
              </div>
            </Motion.div>
          </div>
        </div>
      </Motion.div>
    </div>
  );
}

export default Login;


