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
        className="bg-green-500 px-4 py-2 rounded text-white hover:bg-green-600 disabled:opacity-60"
      >
        {loading ? "Creating..." : "Create Series"}
      </button>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </form>
  );
}
