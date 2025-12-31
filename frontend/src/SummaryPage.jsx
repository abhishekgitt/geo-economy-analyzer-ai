import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import ChatPanel from "./ChatPanel";

function SummaryPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/summaries/")
      .then(res => res.json())
      .then(all => {
        const found = all.find(item => item.id === Number(id));
        setData(found);
      });
  }, [id]);

  if (!data) return <p>Loading...</p>;

  return (
    <div>
      <h2>{data.article.title}</h2>

      <h3>AI Summary</h3>
      <p>{data.ai_summary}</p>

      <h3>Full Article</h3>
      <p>{data.article.content}</p>

      <ChatPanel
        articleId={data.article.id}
        summaryId={data.id}
      />
    </div>
  );
}

export default SummaryPage;
