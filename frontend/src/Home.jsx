import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  }, []);

  if (loading) return <h2 className="status">Loading...</h2>;
  if (error) return <h2 className="status">{error}</h2>;

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>Global News Analyzer AI</h1>
        <p>Latest Feeds About Economics & Geopolitics</p>
      </header>

      <div className="card-grid">
        {summaries.map((item) => (
          <div
            key={item.id}
            className="blog-card"
            onClick={() => navigate(`/summary/${item.id}`)}
          >
            <div className="card-image">
              <img
                src={item.hero_image || "/static/news/llama-logo.png"}
                alt="article"
              />
            </div>

            <div className="card-content">
              <h3>{item.article.title}</h3>
              <p className="description">
                {item.short_preview?.slice(0, 100)}...
              </p>

              <div className="tags">
                <span className="tag">{item.article.source}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
