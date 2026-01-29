import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Globe, BarChart3, Clock } from "lucide-react";
import "./Home.css";

function Home() {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/summaries/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.clear();
          navigate("/login");
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.needs_onboarding) {
          navigate("/select-topics");
          return;
        }

        setSummaries(data || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load summaries");
        setLoading(false);
      });
  }, [navigate, token]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  if (loading) return (
    <div className="status-container">
      <Motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="loader"
      />
      <p>Analyzing global markets...</p>
    </div>
  );

  if (error) return <div className="status-container"><p className="error">{error}</p></div>;

  return (
    <div className="home-page">
      <Motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 80, damping: 20 }}
        className="home-header"
      >
        <div className="header-badge">
          <Globe size={14} className="icon-pulse" />
          <span>Real-time Intelligence</span>
        </div>
        <h1>Geo-Economy <br /><span className="gradient-text">Intelligence Hub</span></h1>
        <p>Advanced AI-driven analysis of geopolitics and global economic shifts.</p>
      </Motion.header>

      <Motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="card-grid"
      >
        <AnimatePresence>
          {summaries.map((item, index) => (
            <Motion.div
              layout
              key={item.id}
              variants={itemVariants}
              whileHover={{
                scale: 1.02,
                y: -5,
                transition: { type: "spring", stiffness: 400, damping: 10 }
              }}
              whileTap={{ scale: 0.98 }}
              className={`blog-card ${index === 0 ? 'featured-card' : ''}`}
              onClick={() => navigate(`/summary/${item.id}`)}
            >
              <div className="card-image-wrap">
                <img
                  src={item.hero_image || "/static/news/llama-logo.png"}
                  alt="article"
                  loading="lazy"
                />
                <div className="image-overlay" />
              </div>

              <div className="card-content">
                <div className="card-meta">
                  <span className="tag-pill">{item.article.source}</span>
                  <span className="time-pill"><Clock size={12} /> 5m read</span>
                </div>
                <h3>{item.article.title}</h3>
                <p className="description">
                  {item.short_preview?.slice(0, 120)}...
                </p>

                <div className="card-footer">
                  <div className="footer-stat">
                    <TrendingUp size={14} />
                    <span>High Impact</span>
                  </div>
                  <Motion.div
                    className="arrow-link"
                    whileHover={{ x: 5 }}
                  >
                    Read Insight →
                  </Motion.div>
                </div>
              </div>
            </Motion.div>
          ))}
        </AnimatePresence>
      </Motion.div>
    </div>
  );
}

export default Home;


