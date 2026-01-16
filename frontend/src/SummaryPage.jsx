import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ChatPanel from "./ChatPanel";
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
      .then((all) => {
        const found = all?.find((item) => item.id === Number(id));
        setData(found);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load summary");
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p className="status">Loading...</p>;
  if (error) return <p className="status">{error}</p>;
  if (!data) return <p className="status">Summary not found</p>;

  return (
    <div className="summary-page">
      {/* TITLE */}
      <h1 className="article-title">{data.article.title}</h1>
        <div className="card-image">
            <img
              src={data.hero_image || "/static/news/llama-logo.png"}
              alt="article"
            />
        </div>
      {/* AI SUMMARY */}
      <h2 className="section-title">AI Summary</h2>

      <div className="markdown-body">
        <ReactMarkdown 
          remarkPlugins= {[remarkGfm]}
          rehypePlugins= {[rehypeSanitize]}
        >
          {data.ai_summary}
        </ReactMarkdown>
      </div>

      {/* CHAT */}
      <ChatPanel
        articleId={data.article.id}
        summaryId={data.id}
      />
    </div>
  );
}

export default SummaryPage;
