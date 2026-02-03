import { useState, useEffect } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Briefcase, DollarSign, ExternalLink, Globe, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProfileMenu from "./ProfileMenu";
import "./JobsPage.css";

function JobsPage() {
    const [jobs, setJobs] = useState([]);
    const [query, setQuery] = useState("");
    const [location, setLocation] = useState("");
    const [country, setCountry] = useState("in");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchJobs = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/jobs/?q=${encodeURIComponent(query)}&loc=${encodeURIComponent(location)}&country=${country}`);
            const data = await res.json();
            if (data.error) {
                setError(data.error);
            } else {
                setJobs(data.results || []);
            }
        } catch (err) {
            setError("Failed to fetch jobs. Check your connection.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, [country]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchJobs();
    };

    return (
        <div className="jobs-page">
            <nav className="summary-nav glass">
                <button className="back-btn" onClick={() => navigate("/")}>
                    <ArrowLeft size={18} />
                    Hub
                </button>
                <div className="summary-actions">
                    <button className="nav-link-btn active">
                        <Briefcase size={16} /> Jobs
                    </button>
                    <div style={{ marginLeft: "10px" }}>
                        <ProfileMenu />
                    </div>
                </div>
            </nav>

            <Motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="jobs-header"
            >
                <h1>India <span className="gradient-text">Tech Jobs</span></h1>
                <p>Curated tech opportunities in India and beyond.</p>
            </Motion.header>

            <form className="search-container" onSubmit={handleSearch}>
                <div className="search-box">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Job title, keywords..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <div className="search-box">
                    <MapPin size={20} />
                    <input
                        type="text"
                        placeholder="Location..."
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                    />
                </div>
                <div className="search-box" style={{ maxWidth: '120px' }}>
                    <Globe size={20} />
                    <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none' }}
                    >
                        <option value="in">India</option>
                        <option value="us">USA</option>
                        <option value="gb">UK</option>
                        <option value="ca">Canada</option>
                        <option value="au">Australia</option>
                    </select>
                </div>
                <button type="submit" className="search-btn">Find Jobs</button>
            </form>

            {error && <div className="status-container"><p className="error">{error}</p></div>}

            <div className="job-grid">
                <AnimatePresence>
                    {loading ? (
                        <div className="status-container" style={{ gridColumn: "1/-1" }}>
                            <div className="loader" />
                            <p>Scanning global registries...</p>
                        </div>
                    ) : (
                        jobs.map((job, index) => (
                            <Motion.div
                                key={job.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="job-card"
                            >
                                <div className="job-header-info">
                                    <h3>{job.title.replace(/<\/?[^>]+(>|$)/g, "")}</h3>
                                </div>

                                <div className="job-meta">
                                    <div className="meta-item">
                                        <Briefcase size={14} />
                                        {job.company.display_name}
                                    </div>
                                    <div className="meta-item">
                                        <MapPin size={14} />
                                        {job.location.display_name}
                                    </div>
                                    {job.salary_min && (
                                        <div className="meta-item salary">
                                            <DollarSign size={14} />
                                            {Math.round(job.salary_min).toLocaleString()} {job.salary_max ? `- ${Math.round(job.salary_max).toLocaleString()}` : ""}
                                        </div>
                                    )}
                                </div>

                                <p className="job-description">
                                    {job.description.replace(/<\/?[^>]+(>|$)/g, "")}
                                </p>

                                <div className="job-footer">
                                    <div className="tag-pill">ADZUNA JOB</div>
                                    <a href={job.redirect_url} target="_blank" rel="noopener noreferrer" className="apply-link">
                                        View Details <ExternalLink size={14} style={{ marginLeft: '4px' }} />
                                    </a>
                                </div>
                            </Motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {!loading && jobs.length === 0 && !error && (
                <div className="status-container" style={{ gridColumn: "1/-1" }}>
                    <p>No jobs found. Try adjusting your search criteria.</p>
                </div>
            )}
        </div>
    );
}

export default JobsPage;
