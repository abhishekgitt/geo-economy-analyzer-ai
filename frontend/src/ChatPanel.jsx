import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, MessageSquare, Volume2, Square } from "lucide-react";
import "./ChatPanel.css";
import { useEffect, useRef } from "react";

function ChatPanel({ articleId, summaryId }) {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const chatEndRef = useRef(null);

  const MAX_FREE = 10;
  const token = localStorage.getItem("access_token");

  const askAI = async () => {
    if (!question.trim() || loading || count >= MAX_FREE) return;

    const userMsg = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setQuestion("");

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
          question: question,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [...prev, { role: "ai", content: `⚠️ Error: ${data.error || "Failed to get AI response"}` }]);
        return;
      }

      const replyContent = data?.reply || "⚠️ AI returned an empty response.";
      setMessages((prev) => [...prev, { role: "ai", content: replyContent }]);
      setCount((c) => c + 1);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "ai", content: "⚠️ Connection failed. Please check your network and try again." }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleSpeak = (text, idx) => {
    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
    } else {
      window.speechSynthesis.cancel();

      const textToRead = text
        .replace(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu, '') // Remove emojis
        .replace(/[#*`_~\[\]]/g, '')
        .replace(/\(https?:\/\/[^\)]+\)/g, '')
        .replace(/<[^>]*>/g, '')
        .replace(/\n+/g, '. ');

      const utterance = new SpeechSynthesisUtterance(textToRead);
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha"));
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onend = () => setSpeakingIdx(null);
      utterance.onerror = () => setSpeakingIdx(null);

      window.speechSynthesis.speak(utterance);
      setSpeakingIdx(idx);
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
            {count}/{MAX_FREE} Queries
          </span>
        </div>

        <div className="chat-history">
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <Motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`chat-bubble ${msg.role === 'user' ? 'user-bubble' : 'ai-bubble markdown-body'}`}
              >
                {msg.role === 'ai' ? (
                  <div className="ai-message-wrapper">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                      {msg.content}
                    </ReactMarkdown>
                    <div className="ai-message-footer">
                      <button
                        className={`chat-voice-btn ${speakingIdx === idx ? 'active' : ''}`}
                        onClick={() => handleSpeak(msg.content, idx)}
                      >
                        {speakingIdx === idx ? (
                          <>
                            <div className="ping-wrapper small">
                              <div className="ping-ring small"></div>
                              <Square size={10} fill="currentColor" />
                            </div>
                            <span>Stop Reading</span>
                          </>
                        ) : (
                          <>
                            <Volume2 size={12} />
                            <span>Read Aloud</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  msg.content
                )}
              </Motion.div>
            ))}
            {loading && (
              <Motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="ai-thinking"
              >
                <div className="pulse-dots">
                  <span>.</span><span>.</span><span>.</span>
                </div>
              </Motion.div>
            )}
            <div ref={chatEndRef} />
          </AnimatePresence>
        </div>

        <div className="chat-input-wrapper">
          <div className="chat-input-container">
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
              placeholder="Message Job Market AI..."
              disabled={count >= MAX_FREE}
            />
            <Motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`chat-send-btn ${question.trim() ? 'active' : ''}`}
              onClick={askAI}
              disabled={loading || count >= MAX_FREE || !question.trim()}
            >
              <Send size={18} strokeWidth={2.5} color="white" />
            </Motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPanel;


