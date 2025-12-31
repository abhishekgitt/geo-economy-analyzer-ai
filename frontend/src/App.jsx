import { Routes, Route } from "react-router-dom";
import Home from "./Home";
import SummaryPage from "./SummaryPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/summary/:id" element={<SummaryPage />} />
    </Routes>
  );
}

export default App;

