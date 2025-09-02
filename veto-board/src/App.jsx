// src/App.jsx
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/Sidebar";
import VetoPage from "./pages/VetoPage";
import RandomSeriesPage from "./pages/RandomSeriesPage";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/veto" replace />} />
          <Route path="veto" element={<VetoPage />} />
          <Route path="random" element={<RandomSeriesPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}