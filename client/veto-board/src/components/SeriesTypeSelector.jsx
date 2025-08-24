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
    <div className="bg-gray-800 text-white p-6 rounded">
      <h3 className="text-lg font-semibold mb-4">Select Series Type</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Series Format</label>
          <select
            value={seriesType}
            onChange={(e) => setSeriesType(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            disabled={loading}
          >
            <option value="Bo3">Best of 3</option>
            <option value="Bo5">Best of 5</option>
            <option value="Bo7">Best of 7</option>
          </select>
        </div>

        {error && (
          <div className="text-red-400 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white disabled:opacity-50"
        >
          {loading ? "Confirming..." : "Start Veto Process"}
        </button>
      </form>

      <div className="mt-4 text-sm text-gray-400">
        <p>Teams: <span className="text-white">{series.team_a} vs {series.team_b}</span></p>
      </div>
    </div>
  );
}
