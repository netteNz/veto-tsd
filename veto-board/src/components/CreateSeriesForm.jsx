import { useState } from "react";
import { API_BASE } from "../lib/api";

export default function CreateSeriesForm({ onCreated }) {
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/series/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_a: teamA, team_b: teamB }),
      });
      const data = await res.json();
      onCreated(data.id); // pass new seriesId to parent
    } catch (err) {
      setError("Failed to create series.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 p-4 rounded space-y-4">
      <h2 className="text-white font-bold text-xl">Start a New Series</h2>
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
        className="bg-green-500 px-4 py-2 rounded text-white hover:bg-green-600"
      >
        {loading ? "Creating..." : "Create Series"}
      </button>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </form>
  );
}
