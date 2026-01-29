import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import {
  Check, ArrowRight, Target, Cpu, Globe, TrendingUp, ShieldCheck,
  BarChart3, Zap, Droplets, Scale, Activity, Users, DollarSign
} from "lucide-react";
import "./SelectTopics.css";

function SelectTopics() {
  const [topics, setTopics] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/topics/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        setTopics(data);
        setLoading(false);
      });
  }, [token]);

  const toggleTopic = (id) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(t => t !== id)
        : [...prev, id]
    );
  };

  const getIcon = (name) => {
    const n = name.toLowerCase();
    if (n.includes('ai')) return <Cpu size={24} />;
    if (n.includes('gdp') || n.includes('economy')) return <BarChart3 size={24} />;
    if (n.includes('inflation')) return <Activity size={24} />;
    if (n.includes('oil')) return <Droplets size={24} />;
    if (n.includes('sanction') || n.includes('tariff')) return <ShieldCheck size={24} />;
    if (n.includes('trade')) return <Globe size={24} />;
    if (n.includes('currency')) return <DollarSign size={24} />;
    if (n.includes('layoffs') || n.includes('unemployment')) return <Users size={24} />;
    if (n.includes('recession')) return <TrendingUp size={24} style={{ transform: 'rotate(180deg)' }} />;
    return <Target size={24} />;
  };

  const savePreferences = () => {
    fetch("http://127.0.0.1:8000/api/user/preferences/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ topics: selected }),
    }).then(() => navigate("/"));
  };

  if (loading) return (
    <div className="status-container">
      <div className="loader" />
      <p>Configuring your intelligence environment...</p>
    </div>
  );

  return (
    <div className="select-topics-page">
      <Motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="onboarding-header"
      >
        <h1>Tailor Your Feed</h1>
        <p>Select the geoeconomic signals you want to prioritize.</p>
      </Motion.header>

      <Motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
          }
        }}
        className="topics-grid"
      >
        {topics.map(t => (
          <Motion.div
            key={t.id}
            variants={{
              hidden: { scale: 0.9, opacity: 0 },
              visible: { scale: 1, opacity: 1 }
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleTopic(t.id)}
            className={`topic-card ${selected.includes(t.id) ? 'selected' : ''}`}
          >
            {getIcon(t.name)}
            <span className="topic-name">{t.name}</span>
            <AnimatePresence>
              {selected.includes(t.id) && (
                <Motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="selection-indicator"
                >
                  <Check size={12} />
                </Motion.div>
              )}
            </AnimatePresence>
          </Motion.div>
        ))}
      </Motion.div>

      <Motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="onboarding-footer"
      >
        <button
          className="continue-btn"
          onClick={savePreferences}
          disabled={!selected.length}
        >
          Initialize Hub <ArrowRight size={20} />
        </button>
      </Motion.footer>
    </div>
  );
}

export default SelectTopics;


