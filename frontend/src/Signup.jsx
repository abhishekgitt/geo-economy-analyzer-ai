import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { UserPlus, Mail, Lock, User, ChevronRight } from "lucide-react";
import "./Signup.css";

function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSignup = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
        setLoading(false);
        return;
      }

      navigate("/login");
    } catch {
      setError("Connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="signup-card"
      >
        <div className="signup-left">
          <Motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="signup-logo">
              <UserPlus size={32} color="var(--accent)" />
            </div>
            <h2>Join the Trend Hub</h2>
            <p className="subtitle">Start your journey into AI-driven job market analysis</p>
          </Motion.div>

          {error && (
            <Motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="signup-error"
            >
              {error}
            </Motion.p>
          )}

          <div className="auth-form">
            <div className="input-group">
              <div className="input-field">
                <User size={18} className="input-icon" />
                <input
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="input-field">
                <Mail size={18} className="input-icon" />
                <input
                  placeholder="Email (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
              onClick={handleSignup}
              disabled={loading}
              className="signup-btn"
            >
              {loading ? "Creating Account..." : "Create Account"}
              {!loading && <ChevronRight size={18} />}
            </Motion.button>
          </div>

          <p className="login-prompt">
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </div>

        <div className="signup-right">
          <div className="glass-panel">
            <Motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3>Empowering <br />Careers</h3>
              <p>Join thousands of users leveraging AI to navigate the complex job market.</p>
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

export default Signup;


