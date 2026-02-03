import { useState, useEffect } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Globe, ArrowRight, Briefcase, BarChart2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProfileMenu from "../ProfileMenu";
import CustomSelect from "../CustomSelect";
import "./TrendingJobs.css";

function TrendingJobs() {
    const [stats, setStats] = useState([]);
    const [country, setCountry] = useState("in");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const countryOptions = [
        { value: "in", label: "India" },
        { value: "us", label: "United States" },
        { value: "gb", label: "United Kingdom" },
        { value: "ca", label: "Canada" },
        { value: "au", label: "Australia" }
    ];

    useEffect(() => {
        fetchStats();
    }, [country]);

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/jobs/trending/?country=${country}`);
            if (!res.ok) throw new Error("Failed to fetch trending stats");
            const data = await res.json();
            setStats(data);
        } catch (err) {
            setError("Could not load trending data. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100 }
        }
    };

    return (
        <div className="trending-page">
            <nav className="summary-nav glass">
                <button className="back-btn" onClick={() => navigate("/")}>
                    <ArrowLeft size={18} />
                    Hub
                </button>
                <div className="summary-actions">
                    <button className="nav-link-btn active">
                        <TrendingUp size={16} /> Trends
                    </button>
                    <div style={{ marginLeft: "10px" }}>
                        <ProfileMenu />
                    </div>
                </div>
            </nav>

            <Motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="trending-header"
            >
                <h1>Market <span className="gradient-text">Pulse</span></h1>
                <p>Real-time demand analysis across key technology sectors.</p>
            </Motion.header>

            <div className="trending-controls">
                <CustomSelect
                    options={countryOptions}
                    value={country}
                    onChange={setCountry}
                    icon={Globe}
                />
            </div>

            {error && <div className="status-container"><p className="error">{error}</p></div>}

            {loading ? (
                <div className="trending-grid">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="skeleton-card">
                            <div className="skeleton-shimmer" />
                            <div className="skeleton-header">
                                <div className="skeleton-icon" />
                                <div className="skeleton-badge" />
                            </div>
                            <div className="skeleton-content">
                                <div className="skeleton-text-lg" />
                                <div className="skeleton-text-sm" />
                            </div>
                            <div className="skeleton-btn" />
                        </div>
                    ))}
                </div>
            ) : (
                <Motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="trending-grid"
                >
                    {stats.map((stat, index) => (
                        <Motion.div
                            key={stat.title}
                            variants={itemVariants}
                            className="trend-card"
                            whileHover={{ scale: 1.02 }}
                        >
                            <div className="card-header">
                                <div className="icon-box">
                                    <BarChart2 size={20} />
                                </div>
                                <div className={`trend-growth ${stat.growth.startsWith('+') ? 'positive' : 'negative'}`}>
                                    {stat.growth.startsWith('+') ? <TrendingUp size={12} /> : null}
                                    {stat.growth}
                                </div>
                            </div>

                            <div className="trend-stats">
                                <span className="stat-value">{stat.count.toLocaleString()}</span>
                                <span className="stat-label">{stat.title}</span>
                            </div>

                            <button
                                className="card-action"
                                onClick={() => navigate(`/jobs?q=${encodeURIComponent(stat.title)}&country=${country}`)}
                            >
                                View Openings <ArrowRight size={14} />
                            </button>
                        </Motion.div>
                    ))}
                </Motion.div>
            )}
        </div>
    );
}

export default TrendingJobs;
