// src/App.jsx
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/Sidebar";
import LandingPage from "./pages/LandingPage";
import VetoPage from "./pages/VetoPage";
import RandomSeriesPage from "./pages/RandomSeriesPage";
import HelpPage from "./pages/HelpPage";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="veto" element={<VetoPage />} />
          <Route path="random" element={<RandomSeriesPage />} />
          <Route path="help" element={<HelpPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}