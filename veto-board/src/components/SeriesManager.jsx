import { useEffect, useState } from "react";
import BanPhase from "./BanPhase";
import PickPhase from "./PickPhase";
import SeriesLayout from "./SeriesLayout";

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

  // Update the loadSeries function to ensure we're getting fresh data:

  const loadSeries = async () => {
    try {
      console.log("[DEBUG] Loading series data...");
      const data = await getSeries(seriesId);
      console.log("[DEBUG] Series data loaded:", data);
      console.log("[DEBUG] Actions:", data.actions);
      setSeries(data);
    } catch (err) {
      console.error("[DEBUG] Error loading series:", err);
      setError("Could not load series.");
    }
  };

  const handleUndo = async () => {
    try {
      console.log("[DEBUG] Attempting undo...");
      const result = await postUndo(seriesId);
      console.log("[DEBUG] Undo result:", result);
      await loadSeries();
      console.log("[DEBUG] Series reloaded after undo");
    } catch (err) {
      console.error("[DEBUG] Undo failed:", err);
      setError(`Undo failed: ${err.message}`);
    }
  };

  const handleReset = async () => {
    try {
      console.log("[DEBUG] Attempting reset...");
      const result = await postReset(seriesId);
      console.log("[DEBUG] Reset result:", result);
      await loadSeries();
      console.log("[DEBUG] Series reloaded after reset");
    } catch (err) {
      console.error("[DEBUG] Reset failed:", err);
      setError(`Reset failed: ${err.message}`);
    }
  };

  const renderCurrentPhase = () => {
    if (!series) return null;

    switch (series.state) {
      case "IDLE":
        return <TeamAssignmentForm series={series} onSuccess={loadSeries} />;
        
      case "SERIES_SETUP":
        return <SeriesTypeSelector series={series} onSuccess={loadSeries} />;
      
      case "BAN_PHASE":
        return (
          <div className="space-y-6">
            <BanPhase series={series} onSuccess={loadSeries} />
            <SeriesLayout series={series} onSuccess={loadSeries} />
          </div>
        );
      
      case "PICK_WINDOW":
        return (
          <div className="space-y-6">
            <PickPhase series={series} onSuccess={loadSeries} />
            <SeriesLayout series={series} onSuccess={loadSeries} />
          </div>
        );
      
      case "SERIES_COMPLETE":
        return <SeriesLayout series={series} onSuccess={loadSeries} />;
      
      default:
        return (
          <div className="text-gray-400">
            Unknown state: {series.state}
          </div>
        );
    }
  };

  if (error) return <div className="text-red-500">{error}</div>;
  if (!series) return <div className="text-white">Loading series...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Series: {series.id}</h2>

      {renderCurrentPhase()}

      {/* Only show Undo/Reset buttons during active phases */}
      {(series.state === "BAN_PHASE" || series.state === "PICK_WINDOW") && (
        <div className="flex gap-2">
          <button
            onClick={handleUndo}
            className="bg-yellow-500 hover:bg-yellow-600 px-4 py-1 rounded text-black"
          >
            Undo
          </button>
          <button
            onClick={handleReset}
            className="bg-red-500 hover:bg-red-600 px-4 py-1 rounded text-white"
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
