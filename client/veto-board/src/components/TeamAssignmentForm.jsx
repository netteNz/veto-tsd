import { useState } from "react";
import { assignRoles } from "../lib/api";

export default function TeamAssignmentForm({ series, onSuccess }) {
  const [teamA, setTeamA] = useState(series.team_a || "");
  const [teamB, setTeamB] = useState(series.team_b || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await assignRoles(series.id, teamA, teamB);
      onSuccess(); // trigger series reload
    } catch (err) {
      setError("Failed to assign roles.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-800 p-4 rounded">
      <h3 className="text-white font-semibold">Assign Teams</h3>
      <div className="flex flex-col gap-2">
        <input
          type="text"
          className="p-2 rounded bg-gray-900 text-white"
          placeholder="Team Alpha"
          value={teamA}
          onChange={(e) => setTeamA(e.target.value)}
          required
        />
        <input
          type="text"
          className="p-2 rounded bg-gray-900 text-white"
          placeholder="Team Beta"
          value={teamB}
          onChange={(e) => setTeamB(e.target.value)}
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-500 px-4 py-2 rounded text-white hover:bg-blue-600"
      >
        {loading ? "Assigning..." : "Assign Roles"}
      </button>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </form>
  );
}
