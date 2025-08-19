import { useEffect, useState } from "react";
import BanPhase from "./BanPhase";

import {
  getSeries,
  postUndo,
  postReset,
} from "../lib/api";
import TeamAssignmentForm from "./TeamAssignmentForm";
import SeriesTypeSelector from "./SeriesTypeSelector";

export default function SeriesManager({ seriesId }) {
  const [series, setSeries] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSeries();
  }, []);

  const loadSeries = async () => {
    try {
      const data = await getSeries(seriesId);
      setSeries(data);
    } catch (err) {
      setError("Could not load series.");
    }
  };

  const handleUndo = async () => {
    await postUndo(seriesId);
    await loadSeries();
  };

  const handleReset = async () => {
    await postReset(seriesId);
    await loadSeries();
  };

  if (error) return <div className="text-red-500">{error}</div>;
  if (!series) return <div className="text-white">Loading series...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Series: {series.id}</h2>

      {series.state === "IDLE" && (
        <TeamAssignmentForm series={series} onSuccess={loadSeries} />
      )}

      {series.state === "SERIES_SETUP" && (
        <SeriesTypeSelector series={series} onSuccess={loadSeries} />
      )}

      {series.state === "BAN_PHASE" && (
        <BanPhase series={series} onSuccess={loadSeries} />
      )}

      {(series.state === "BAN_PHASE" || series.state === "PICK_WINDOW") && (
        <div className="flex gap-2">
          <button
            onClick={handleUndo}
            className="bg-yellow-500 px-4 py-1 rounded text-black"
          >
            Undo
          </button>
          <button
            onClick={handleReset}
            className="bg-red-500 px-4 py-1 rounded text-white"
          >
            Reset
          </button>
        </div>
      )}

      {/* TEMPORARY: Display current state (can be removed later) */}
      <div className="text-sm text-gray-400">State: {series.state}</div>
    </div>
  );
}
