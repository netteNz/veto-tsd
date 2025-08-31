// src/App.jsx
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/Sidebar";   // your new sidebar/layout
import VetoPage from "./pages/VetoPage";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          {/* default route -> /veto */}
          <Route index element={<Navigate to="/veto" replace />} />
          <Route path="/veto" element={<VetoPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}