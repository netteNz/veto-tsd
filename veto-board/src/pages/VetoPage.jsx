// src/pages/VetoPage.jsx
import { useEffect, useState, useRef } from "react";
import SeriesManager from "../components/SeriesManager";
import { createSeries } from "../lib/api";
import "../index.css";

export default function VetoPage() {
  const [seriesId, setSeriesId] = useState(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    const init = async () => {
      if (initialized.current) return;
      initialized.current = true;

      try {
        console.log("[DEBUG] Creating new series...");
        const newSeries = await createSeries();
        console.log("[DEBUG] New series created:", newSeries);
        setSeriesId(newSeries.id);
      } catch (err) {
        console.error("[DEBUG] Failed to create series:", err);
        if (import.meta.env.DEV) {
          console.log("[DEBUG] Falling back to hardcoded series ID for development");
          setSeriesId(11);
        }
      }
      setLoading(false);
    };

    init();
  }, []);

  const handleNewSeries = async () => {
    setLoading(true);
    try {
      console.log("[DEBUG] Creating new series via button...");
      const newSeries = await createSeries();
      console.log("[DEBUG] New series created:", newSeries);
      setSeriesId(newSeries.id);
    } catch (err) {
      console.error("[DEBUG] Failed to create new series:", err);
      alert(`Failed to create new series: ${err.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-white">TSD Veto Tool</h1>
        <button
          onClick={handleNewSeries}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
          disabled={loading}
        >
          New Series
        </button>
      </div>

      {loading ? (
        <p className="text-white">Loading...</p>
      ) : (
        <SeriesManager seriesId={seriesId} />
      )}
    </div>
  );
}