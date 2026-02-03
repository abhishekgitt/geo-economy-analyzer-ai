import { useNavigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import GeneralChatPanel from "./GeneralChatPanel";
import "./ChatPage.css"; // Reuse existing chat page layout

function GeneralChat() {
    const navigate = useNavigate();

    return (
        <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="chat-page"
        >
            <nav className="chat-page-nav">
                <button className="back-btn" onClick={() => navigate('/')}>
                    <ArrowLeft size={18} />
                    Back to Home
                </button>
                <div className="header-badge">
                    <Sparkles size={14} className="icon-pulse" />
                    <span>General Career Intelligence</span>
                </div>
            </nav>

            <Motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="chat-page-content"
            >

                <GeneralChatPanel />
            </Motion.div>
        </Motion.div>
    );
}

export default GeneralChat;
