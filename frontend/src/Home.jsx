import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

function Home() {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/summaries/")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch data");
        }
        return res.json();
      })
      .then((data) => {
        setSummaries(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <h2>Loading...</h2>;
  if (error) return <h2>Error: {error}</h2>;

  return (
    <div className="container">
      <h1 className="title">Global Economic News - AI</h1>

      {summaries.map((item) => (
        <div
          key={item.id}
          className="news-card"
          onClick={() => navigate(`/summary/${item.id}`)}
        >
          <h3>{item.article.title}</h3>
          <p className="source">{item.article.source}</p>
        </div>
      ))}
    </div>
  );
}

export default Home;
