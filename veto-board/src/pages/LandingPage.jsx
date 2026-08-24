import { Link, useNavigate } from "react-router-dom";
import { Crosshair, HelpCircle, Shuffle, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { createSeries } from "../lib/api";

export default function LandingPage() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  const handleStartNewSeries = async () => {
    try {
      setCreating(true);
      const s = await createSeries("", "");
      navigate(`/veto?seriesId=${s.id}`);
    } catch (err) {
      console.error("Failed to create series:", err);
      alert("Failed to create series");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 pb-10 text-center">
          <div className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-hud">
            Map &amp; Mode Draft Tool
          </div>
          <h1 className="font-display text-5xl font-bold text-ink sm:text-6xl">
            TSD Veto
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink-muted">
            Run the ban and pick draft for a competitive Halo Infinite series &mdash; live, in front of both teams.
          </p>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <button
            onClick={handleStartNewSeries}
            className="group rounded-2xl bg-panel p-8 text-left transition-colors hover:bg-panel-raised disabled:cursor-not-allowed disabled:opacity-60"
            disabled={creating}
          >
            <Crosshair size={32} className="mb-4 text-team-red transition-transform group-hover:scale-110" />
            <h2 className="mb-2 font-display text-2xl font-bold text-ink">Start New Series</h2>
            <p className="text-sm text-ink-muted">
              {creating ? "Creating…" : "Assign teams, choose a format, and run the live veto draft"}
            </p>
          </button>

          <Link
            to="/random"
            className="group rounded-2xl bg-panel p-8 text-left transition-colors hover:bg-panel-raised"
          >
            <Shuffle size={32} className="mb-4 text-team-blue transition-transform group-hover:scale-110" />
            <h2 className="mb-2 font-display text-2xl font-bold text-ink">Random Series</h2>
            <p className="text-sm text-ink-muted">
              Generate a randomized series for practice or a demo run-through
            </p>
          </Link>
        </div>

        <div className="mb-8 text-center">
          <Link
            to="/help"
            className="inline-flex items-center text-sm text-ink-muted transition-colors hover:text-hud"
          >
            <HelpCircle size={16} className="mr-2" />
            <span>How to use this tool</span>
          </Link>
        </div>

        <div className="mb-8 rounded-xl bg-warn/10 p-6">
          <h3 className="mb-2 flex items-center gap-2 font-medium text-warn">
            <TriangleAlert size={18} />
            Project Status
          </h3>
          <p className="text-sm text-ink">
            This project is currently being refactored to run as a <span className="font-semibold">frontend-only application</span> for demonstration purposes. The Django REST backend has been decoupled, and the tool now operates independently using client-side state management. Backend integration will be reintroduced in future versions.
          </p>
        </div>

        <div className="rounded-2xl bg-panel p-6">
          <h3 className="mb-3 font-medium text-ink">Features</h3>
          <ul className="space-y-2 text-sm text-ink-muted">
            <li>Team-based veto and pick system</li>
            <li>Support for Bo3, Bo5, and Bo7 series formats</li>
            <li>Real-time series progression tracking</li>
            <li>Live drafting and ban phase management</li>
          </ul>
        </div>
      </div>
    </div>
  );
}