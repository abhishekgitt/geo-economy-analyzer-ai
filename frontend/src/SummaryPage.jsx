import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { motion as Motion, useScroll, useSpring, useTransform } from "framer-motion";
import anime from "animejs";
import { ArrowLeft, Clock, Share2, Bookmark, Sparkles, Volume2, Square } from "lucide-react";
import ProfileMenu from "./ProfileMenu";
import "./SummaryPage.css"

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import "github-markdown-css/github-markdown.css";

function SummaryPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const badgeRef = useRef(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const imageY = useTransform(scrollYProgress, [0, 0.4], [0, 100]);

  // Handle cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleVoiceMode = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      if (!data?.ai_summary) return;

      // Clean text: aggressive markdown stripping for speech
      let textToRead = data.ai_summary
        .replace(/[#*`_~\[\]]/g, '') // Remove simple markdown symbols
        .replace(/\(https?:\/\/[^\)]+\)/g, '') // Remove standard markdown URLs
        .replace(/<[^>]*>/g, '') // Remove any HTML tags
        .replace(/^\s*-\s+/gm, '... ') // Replace bullets with distinct pause
        .replace(/[:\-]/g, ' ') // Replace remaining colons/dashes with space
        .replace(/\n+/g, '. '); // Replace newlines with full stops

      const utterance = new SpeechSynthesisUtterance(textToRead);
      // Optional: Select a decent voice if available
      const voices = window.speechSynthesis.getVoices();
      // Try to find a premium English voice
      const preferredVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha"));
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

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
      .then((all) => {
        const found = all?.find((item) => item.id === Number(id));
        setData(found);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load summary");
        setLoading(false);
      });
  }, [id, navigate, token]);

  useEffect(() => {
    if (!loading && badgeRef.current) {
      anime({
        targets: badgeRef.current,
        rotate: [0, 5, -5, 0],
        duration: 3000,
        loop: true,
        easing: 'easeInOutSine'
      });
    }
  }, [loading]);

  if (loading) return (
    <div className="status-container">
      <div className="loader" />
      <p>Fetching job market analysis...</p>
    </div>
  );

  if (error) return <div className="status-container"><p className="error">{error}</p></div>;
  if (!data) return <div className="status-container"><p>Job market report not found.</p></div>;

  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="summary-page"
    >
      <Motion.div className="progress-bar" style={{ scaleX }} />

      <nav className="summary-nav glass">
        <button className="back-btn" onClick={() => navigate("/")}>
          <ArrowLeft size={18} />
          Back to Hub
        </button>
        <div className="summary-actions">
          <button
            onClick={handleVoiceMode}
            style={{
              height: '40px',
              padding: '0 20px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: isSpeaking ? 'rgba(64, 196, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${isSpeaking ? 'rgba(64, 196, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
              color: isSpeaking ? '#40c4ff' : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (!isSpeaking) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSpeaking) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
          >
            {isSpeaking ? (
              <>
                <span style={{ position: 'relative', display: 'flex' }}>
                  <span style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: '#40c4ff', opacity: 0.4, animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' }}></span>
                  <Square size={14} fill="currentColor" />
                </span>
                <span>Stop Reading</span>
              </>
            ) : (
              <>
                <Volume2 size={16} />
                <span>Read Summary</span>
              </>
            )}
          </button>
          <button className="action-icon"><Bookmark size={18} /></button>
          <button className="action-icon"><Share2 size={18} /></button>
          <div style={{ marginLeft: "10px" }}>
            <button
              className="ai-chat-btn"
              onClick={() => navigate(`/chat/${id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #0071e3 0%, #00a8e8 100%)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '20px',
                color: 'white',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 113, 227, 0.3)'
              }}
            >
              <Sparkles size={14} fill="white" />
              Ask Intelligence
            </button>
          </div>
          <div style={{ marginLeft: "10px" }}>
            <ProfileMenu />
          </div>
        </div>
      </nav>

      <div className="summary-header-split">
        <Motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="summary-hero"
        >
          <div className="hero-meta">
            <span className="tag-pill">{data.article.source}</span>
            <span><Clock size={14} /> 8m analysis</span>
          </div>
          <h1 className="article-title">{data.article.title}</h1>
        </Motion.div>

        <Motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="main-image-wrap"
        >
          <Motion.img
            src={data.hero_image || "/static/news/llama-logo.png"}
            alt="article"
            className={!data.hero_image ? "default-logo" : ""}
          />
          <div className="image-overlay-grad" />
        </Motion.div>
      </div>

      <Motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="summary-content"
      >
        <div className="ai-report-section">
          <div className="section-header">
            <div ref={badgeRef} className="report-badge">
              <Sparkles size={12} style={{ marginRight: '4px' }} />
              AI INSIGHT
            </div>
            <h2>Executive Job Market Analysis</h2>
          </div>

          <Motion.div
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            viewport={{ once: true }}
            className="markdown-body report-body glass"
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
            >
              {data.ai_summary}
            </ReactMarkdown>
          </Motion.div>
        </div>
      </Motion.div>


    </Motion.div>
  );
}

export default SummaryPage;



