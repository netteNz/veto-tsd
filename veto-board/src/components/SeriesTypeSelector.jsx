import { useState } from "react";
import { confirmSeriesType } from "../lib/api";

export default function SeriesTypeSelector({ series, onSuccess }) {
  const [seriesType, setSeriesType] = useState("Bo7");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setError("");

    try {
      await confirmSeriesType(series.id, seriesType);
      onSuccess();
    } catch (err) {
      setError(`Failed to confirm series type: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-ink-muted/10 bg-panel p-6">
      <h3 className="mb-4 font-display text-lg font-semibold text-ink">Select Series Type</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-ink-muted">Series Format</label>
          <select
            value={seriesType}
            onChange={(e) => setSeriesType(e.target.value)}
            className="w-full rounded-lg border border-transparent bg-panel-raised px-3 py-2 text-ink focus:border-hud/50"
            disabled={loading}
          >
            <option value="Bo3">Best of 3</option>
            <option value="Bo5">Best of 5</option>
            <option value="Bo7">Best of 7</option>
          </select>
        </div>

        {error && (
          <div className="text-sm text-team-red">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-hud px-4 py-2 font-medium text-void transition-colors hover:bg-hud/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Confirming…" : "Start Veto Process"}
        </button>
      </form>

      <div className="mt-4 text-sm text-ink-muted">
        <p>
          Teams:{" "}
          <span className="text-team-red">{series.team_a}</span>
          {" "}vs{" "}
          <span className="text-team-blue">{series.team_b}</span>
        </p>
      </div>
    </div>
  );
}
