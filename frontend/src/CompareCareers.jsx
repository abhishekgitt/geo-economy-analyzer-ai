import { useState } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BarChart3, Send, Loader2, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProfileMenu from "./ProfileMenu";
import "./CompareCareers.css";

function CompareCareers() {
    const [career1, setCareer1] = useState("");
    const [career2, setCareer2] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleCompare = async (e) => {
        e.preventDefault();
        if (!career1 || !career2) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch("http://127.0.0.1:8000/api/compare/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ career1, career2 }),
            });

            if (!res.ok) throw new Error("Failed to generate comparison");
            const data = await res.json();
            setResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="compare-page">
            <nav className="summary-nav glass">
                <button className="back-btn" onClick={() => navigate("/")}>
                    <ArrowLeft size={18} />
                    Hub
                </button>
                <div className="summary-actions">
                    <button className="nav-link-btn active">
                        <BarChart3 size={16} /> Comparison
                    </button>
                    <div style={{ marginLeft: "10px" }}>
                        <ProfileMenu />
                    </div>
                </div>
            </nav>

            <Motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="compare-header"
            >
                <h1>Career <span className="gradient-text">Battle</span></h1>
                <p>AI-powered side-by-side comparison of your future paths.</p>
            </Motion.header>

            <form className="compare-form" onSubmit={handleCompare}>
                <div className="input-group">
                    <div className="career-input-box">
                        <label>First Career</label>
                        <input
                            type="text"
                            placeholder="e.g. Data Scientist"
                            value={career1}
                            onChange={(e) => setCareer1(e.target.value)}
                            required
                        />
                    </div>
                    <div className="vs-badge">VS</div>
                    <div className="career-input-box">
                        <label>Second Career</label>
                        <input
                            type="text"
                            placeholder="e.g. Product Manager"
                            value={career2}
                            onChange={(e) => setCareer2(e.target.value)}
                            required
                        />
                    </div>
                </div>
                <button type="submit" className="compare-btn" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" /> : "Start Comparison"}
                </button>
            </form>

            <AnimatePresence>
                {error && (
                    <Motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="error-message"
                    >
                        {error}
                    </Motion.div>
                )}

                {result && (
                    <Motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="result-container"
                    >
                        <div className="table-wrapper glass">
                            <table className="comparison-table">
                                <thead>
                                    <tr>
                                        <th>Feature</th>
                                        <th>{career1}</th>
                                        <th>{career2}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.comparison.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="feature-cell">{item.feature}</td>
                                            <td>{item.career1}</td>
                                            <td>{item.career2}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="ai-summary glass">
                            <div className="summary-header">
                                <Info size={18} />
                                <h3>AI Insight</h3>
                            </div>
                            <p>{result.summary}</p>
                        </div>
                    </Motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default CompareCareers;
