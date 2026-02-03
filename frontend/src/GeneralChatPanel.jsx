import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, MessageSquare, Volume2, Square } from "lucide-react";
import "./ChatPanel.css"; // Reuse existing styles
import { useRef } from "react";

function GeneralChatPanel() {
    const [messages, setMessages] = useState([
        { role: "ai", content: "👋 Hello! I'm your Job Market AI assistant. How can I help you today? Whether it's career advice, interview tips, or market trends, I'm here to chat!" }
    ]);
    const [question, setQuestion] = useState("");
    const [loading, setLoading] = useState(false);
    const [speakingIdx, setSpeakingIdx] = useState(null);
    const chatEndRef = useRef(null);

    const token = localStorage.getItem("access_token");

    const askAI = async () => {
        if (!question.trim() || loading) return;

        const userMsg = { role: "user", content: question };
        setMessages((prev) => [...prev, userMsg]);
        setLoading(true);
        setQuestion("");

        try {
            const res = await fetch("http://127.0.0.1:8000/api/general-chat/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ question: question }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessages((prev) => [...prev, { role: "ai", content: `⚠️ Error: ${data.error || "Failed to get AI response"}` }]);
                return;
            }

            setMessages((prev) => [...prev, { role: "ai", content: data.reply || "⚠️ AI returned an empty response." }]);
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
                        <h3>Job Market AI</h3>
                    </div>
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
                            <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ai-thinking">
                                <div className="pulse-dots"><span>.</span><span>.</span><span>.</span></div>
                            </Motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="chat-input-wrapper">
                    <div className="chat-input-container">
                        <MessageSquare size={18} className="input-icon" />
                        <input
                            className="chat-input"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && askAI()}
                            placeholder="Ask anything about jobs or your career..."
                        />
                        <Motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="chat-send-btn"
                            onClick={askAI}
                            disabled={loading || !question.trim()}
                        >
                            <Send size={18} />
                        </Motion.button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GeneralChatPanel;
