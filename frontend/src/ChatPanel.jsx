import { useState } from "react";
import { data } from "react-router-dom";

function ChatPanel({ articleId, summaryId }) {
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState("");
  const [count, setCount] = useState(0);

  const MAX_FREE = 5;

  const askAI = () => {
    if (count >= MAX_FREE) return;
    
    fetch("http://127.0.0.1:8000/api/chat/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        article_id: articleId,
        summary_id: summaryId,
        question: question
      })
    })
      .then(res => res.json())
      .then(data => {
        setReply(data.reply);
        setCount(prev => prev + 1);
      });
  };

  return (
    <div className="chat-panel">
      <h3>Ask AI</h3>

      {count >= MAX_FREE - 1 && (
        <p className="warning">
          ⚠️ Free chats almost over ({MAX_FREE - count} left)
        </p>
      )}

      <input
        value={question}
        onChange={e => setQuestion(e.target.value)}
        placeholder="Ask about this news..."
      />

      <button onClick={askAI} disabled={count >= MAX_FREE}>
        Ask AI
      </button>

      {reply && <p className="ai-reply">{reply}</p>}
    </div>
  );
}

export default ChatPanel;
