import { useState } from "react";
import { assignRoles } from "../lib/api";

export default function TeamAssignmentForm({ series, onSuccess }) {
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
    <div className="bg-gray-800 text-white p-6 rounded">
      <h3 className="text-lg font-semibold mb-4">Assign Team Names</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Team A</label>
          <input
            type="text"
            value={teamA}
            onChange={(e) => setTeamA(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            placeholder="Enter Team A name"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Team B</label>
          <input
            type="text"
            value={teamB}
            onChange={(e) => setTeamB(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            placeholder="Enter Team B name"
            disabled={loading}
          />
        </div>

        {error && <div className="text-red-400 text-sm">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white disabled:opacity-50"
        >
          {loading ? "Assigning..." : "Assign Teams"}
        </button>
      </form>
    </div>
  );
}
