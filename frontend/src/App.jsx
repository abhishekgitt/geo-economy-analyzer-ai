import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./Home";
import SummaryPage from "./SummaryPage";
import Login from "./Login";
import SelectTopics from "./SelectTopics";
import Signup from "./Signup";

const isAuthenticated = () => {
  return !!localStorage.getItem("access_token");
};

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* PROTECTED */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />

      <Route
        path="/select-topics"
        element={
          <ProtectedRoute>
            <SelectTopics />
          </ProtectedRoute>
        }
      />

      <Route
        path="/summary/:id"
        element={
          <ProtectedRoute>
            <SummaryPage />
          </ProtectedRoute>
        }
      />

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;

