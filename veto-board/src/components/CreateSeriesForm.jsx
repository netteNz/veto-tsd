import { useState } from "react";

export default function CreateSeriesForm({ onSubmit, loading = false }) {
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (typeof onSubmit !== "function") {
        throw new Error("onSubmit is not a function");
      }
      // pass raw form values — parent is responsible for API call
      await onSubmit({ team_a: teamA, team_b: teamB });
    } catch (err) {
      console.error("Create series error:", err);
      setError(err?.message || "Failed to create series.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-ink-muted/10 bg-panel p-4">
      <h2 className="font-display text-xl font-bold text-ink">Start a New Series</h2>
      <div className="flex flex-col gap-2">
        <input
          type="text"
          className="rounded-lg border border-transparent bg-panel-raised p-2 text-ink placeholder:text-ink-muted focus:border-team-red/50"
          placeholder="Team Alpha"
          value={teamA}
          onChange={(e) => setTeamA(e.target.value)}
          required
        />
        <input
          type="text"
          className="rounded-lg border border-transparent bg-panel-raised p-2 text-ink placeholder:text-ink-muted focus:border-team-blue/50"
          placeholder="Team Beta"
          value={teamB}
          onChange={(e) => setTeamB(e.target.value)}
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-hud px-4 py-2 font-medium text-void transition-colors hover:bg-hud/90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? "Creating…" : "Create Series"}
      </button>
      {error && <p className="text-sm text-team-red">{error}</p>}
    </form>
  );
}
