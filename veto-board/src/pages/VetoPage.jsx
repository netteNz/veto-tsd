// src/pages/VetoPage.jsx
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { HelpCircle } from "lucide-react";
import SeriesManager from "../components/SeriesManager";
import { createSeries } from "../lib/api";
import "../index.css";

export default function VetoPage() {
  const [seriesId, setSeriesId] = useState(null);
  const [loading, setLoading] = useState(false);

  // read seriesId from query param if present (navigate from LandingPage)
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sid = params.get("seriesId");
    if (sid) {
      setSeriesId(Number(sid));
    }
  }, [location.search]);

  // create a blank series (series manager will show the assignment UI)
  const handleNewSeries = async () => {
    setLoading(true);
    try {
      const s = await createSeries("", "");
      setSeriesId(s.id);
    } catch (err) {
      console.error("Failed to create series:", err);
      alert("Failed to create series");
    } finally {
      setLoading(false);
    }
  };

  const handleResetToCreate = () => {
    // unmount SeriesManager and return to "create" state (if you want)
    setSeriesId(null);
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="font-display text-3xl font-bold text-ink">Setup New Series</h1>
          <Link to="/help" className="ml-4 flex items-center text-sm text-hud hover:underline">
            <HelpCircle size={14} className="mr-1" />
            <span>How to Use</span>
          </Link>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleNewSeries}
            className="rounded-lg bg-hud px-4 py-2 text-sm font-medium text-void transition-colors hover:bg-hud/90 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={loading}
          >
            {loading ? "Creating…" : "New Series"}
          </button>
          <button
            onClick={handleResetToCreate}
            className="rounded-lg px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-panel hover:text-ink"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Always mount SeriesManager when we have a seriesId.
          The TeamAssignmentForm (assignment UI) lives inside SeriesManager (IDLE state). */}
      {seriesId ? (
        <SeriesManager seriesId={seriesId} onSuccess={() => {/* refresh if needed */}} />
      ) : (
        <div className="rounded-2xl bg-panel p-6">
          <p className="text-sm text-ink-muted">
            Click "New Series" to create a series. The team-assignment form is shown inside the Series Manager.
          </p>
        </div>
      )}
    </div>
  );
}