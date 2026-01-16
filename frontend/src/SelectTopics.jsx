import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function SelectTopics() {
  const [topics, setTopics] = useState([]);
  const [selected, setSelected] = useState([]);

  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/topics/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(setTopics);
  }, []);

  const toggleTopic = (id) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(t => t !== id)
        : [...prev, id]
    );
  };

  const savePreferences = () => {
    fetch("http://127.0.0.1:8000/api/user/preferences/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ topics: selected }),
    }).then(() => navigate("/"));
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Select your interests</h1>

      <div style={{ marginTop: "20px" }}>
        {topics.map(t => (
          <button
            key={t.id}
            onClick={() => toggleTopic(t.id)}
            style={{
              margin: "6px",
              padding: "10px 16px",
              borderRadius: "20px",
              border: "none",
              cursor: "pointer",
              background: selected.includes(t.id) ? "#4f46e5" : "#ddd",
              color: selected.includes(t.id) ? "#fff" : "#000",
            }}
          >
            {t.name}
          </button>
        ))}
      </div>

      <button
        onClick={savePreferences}
        disabled={!selected.length}
        style={{ marginTop: "30px", padding: "12px 24px" }}
      >
        Continue →
      </button>
    </div>
  );
}

export default SelectTopics;
