import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, MessageSquare } from "lucide-react";
import "./ChatPanel.css";

function ChatPanel({ articleId, summaryId }) {
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);

  const MAX_FREE = 5;
  const token = localStorage.getItem("access_token");

  const askAI = async () => {
    if (!question.trim() || loading || count >= MAX_FREE) return;

    setLoading(true);
    setReply("");

    try {
      const res = await fetch("http://127.0.0.1:8000/api/chat/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          article_id: articleId,
          summary_id: summaryId,
          question,
        }),
      });

      const data = await res.json();
      setReply(data?.reply || "⚠️ No response from AI.");
      setCount((c) => c + 1);
      setQuestion("");
    } catch {
      setReply("⚠️ Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-container glass">
        <div className="chat-header">
          <div className="flex-center gap-2">
            <Sparkles size={18} className="text-secondary" />
            <h3>Ask Intelligence</h3>
          </div>
          <span className="usage-indicator">
            {count}/{MAX_FREE} Free Queries Left
          </span>
        </div>

        <div className="chat-input-wrapper">
          <MessageSquare size={18} className="input-icon" />
          <input
            className="chat-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                askAI();
              }
            }}
            placeholder="What else would you like to know?"
            disabled={count >= MAX_FREE}
          />
          <Motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="chat-send-btn"
            onClick={askAI}
            disabled={loading || count >= MAX_FREE || !question.trim()}
          >
            <Send size={18} />
          </Motion.button>
        </div>

        <AnimatePresence mode="wait">
          {loading && (
            <Motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="ai-thinking"
            >
              <div className="pulse-dots">
                <span>.</span><span>.</span><span>.</span>
              </div>
              Synthesizing insights...
            </Motion.div>
          )}

          {reply && !loading && (
            <Motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="ai-reply markdown-body"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
              >
                {reply}
              </ReactMarkdown>
            </Motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default ChatPanel;


