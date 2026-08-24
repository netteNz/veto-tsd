import { useEffect, useState } from "react";
import { assignRoles } from "../lib/api";

export default function TeamAssignmentForm({ series, onSuccess }) {
  // debug: detect multiple mounts
  useEffect?.(() => {}, []); // ensure hooks import if not already
  console.log("[MOUNT] TeamAssignmentForm", { seriesId: series?.id, teamA: series?.team_a, teamB: series?.team_b });
  console.log(new Error("TeamAssignmentForm mount stack").stack);

  const [teamA, setTeamA] = useState(series.team_a || "");
  const [teamB, setTeamB] = useState(series.team_b || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!teamA.trim() || !teamB.trim()) {
      setError("Both team names are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await assignRoles(series.id, teamA.trim(), teamB.trim());
      onSuccess();
    } catch (err) {
      setError(`Failed to assign teams: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-ink-muted/10 bg-panel p-6">
      <h3 className="mb-4 font-display text-lg font-semibold text-ink">Assign Team Names</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-team-red">Team A</label>
          <input
            type="text"
            value={teamA}
            onChange={(e) => setTeamA(e.target.value)}
            className="w-full rounded-lg border border-transparent bg-panel-raised px-3 py-2 text-ink placeholder:text-ink-muted focus:border-team-red/50"
            placeholder="Enter Team A name"
            disabled={loading}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-team-blue">Team B</label>
          <input
            type="text"
            value={teamB}
            onChange={(e) => setTeamB(e.target.value)}
            className="w-full rounded-lg border border-transparent bg-panel-raised px-3 py-2 text-ink placeholder:text-ink-muted focus:border-team-blue/50"
            placeholder="Enter Team B name"
            disabled={loading}
          />
        </div>

        {error && <div className="text-sm text-team-red">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-hud px-4 py-2 font-medium text-void transition-colors hover:bg-hud/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Assigning…" : "Assign Teams"}
        </button>
      </form>
    </div>
  );
}
