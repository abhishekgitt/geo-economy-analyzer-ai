import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Signup.css";

function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSignup = async () => {
    setError("");

    const res = await fetch("http://127.0.0.1:8000/api/register/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Signup failed");
      return;
    }

    navigate("/login");
  };

  return (
    <div className="signup-page">
      <div className="signup-card">

        {/* LEFT */}
        <div className="signup-left">
          <h2>Create Account</h2>

          {error && <p className="signup-error">{error}</p>}

          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            placeholder="Email (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={handleSignup}>Sign Up</button>
        </div>

        {/* RIGHT */}
        <div className="signup-right">
          <h3>Global News Analyzer AI</h3>
          <p>
            Create your account to get personalized news summaries powered by AI.
          </p>
        </div>

      </div>
    </div>
  );
}

export default Signup;
