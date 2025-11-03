import { useEffect, useState, useMemo } from "react";
import { getSeries, postUndo, postReset } from "../lib/api";
import { processBansAndPicks } from "../lib/bans";
import BanPhase from "./BanPhase";
import PickPhase from "./PickPhase";
import SeriesLayout from "./SeriesLayout";
import SeriesTypeSelector from "./SeriesTypeSelector";
import TeamAssignmentForm from "./TeamAssignmentForm";
import exportElementToPdf from "../lib/exportPdf";
import { Download } from "lucide-react";

export default function SeriesManager({ seriesId, onSuccess }) {
  const [series, setSeries] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (seriesId) {
      loadSeries();
    }
  }, [seriesId]);

  const loadSeries = async () => {
    try {
      console.log("[DEBUG] Loading series data...");
      const data = await getSeries(seriesId);
      console.log("[DEBUG] Series data loaded:", data);
      console.log("[DEBUG] Actions count:", data.actions?.length);
      console.log("[DEBUG] First 3 actions:", data.actions?.slice(0, 3));

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

  const handleExportPdf = async () => {
    try {
      console.log("[DEBUG] Starting PDF export...");

      // Wait a bit for any pending UI updates
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Find the series layout element
      const seriesLayoutEl =
        document.querySelector("#series-layout") ||
        document.querySelector(".series-layout") ||
        document.querySelector("[data-export-target]");

      if (!seriesLayoutEl) {
        throw new Error("Could not find series layout element to export");
      }

      console.log("[DEBUG] Found export target:", seriesLayoutEl);

      const filename = `veto-series-${series?.id || "final"}.pdf`;
      await exportElementToPdf(seriesLayoutEl, filename, {
        scale: 1,
        backgroundColor: "#1f2937",
      });

      console.log("[DEBUG] PDF export successful");
    } catch (err) {
      console.error("[DEBUG] PDF export failed:", err);
      const errorMsg = err?.message || String(err) || "Unknown export error";
      alert(`Export failed: ${errorMsg}`);
    }
  };

  const processedBanData = useMemo(() => {
    return processBansAndPicks(series?.actions || []);
  }, [series?.actions]);

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
            <BanPhase
              series={series}
              onSuccess={() => {
                loadSeries();
                onSuccess?.();
              }}
              processedBanData={processedBanData}
            />
            <SeriesLayout series={series} onSuccess={loadSeries} />
          </div>
        );

      case "PICK_WINDOW":
        return (
          <div className="space-y-6">
            <PickPhase
              series={series}
              onSuccess={() => {
                loadSeries();
                onSuccess?.();
              }}
              processedBanData={processedBanData}
            />
            <SeriesLayout series={series} onSuccess={loadSeries} />
          </div>
        );

      case "SERIES_COMPLETE":
        return <SeriesLayout series={series} onSuccess={loadSeries} />;

      default:
        return (
          <div className="text-gray-400">Unknown state: {series.state}</div>
        );
    }
  };

  if (error) return <div className="text-red-500">{error}</div>;
  if (!series) return <div className="text-white">Loading series...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header with controls */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">
          Series {seriesId} {series?.state && `(${series.state})`}
        </h2>

        <div className="flex items-center gap-2">
          {/* Show Export button only when series is complete */}
          {/* {series?.state === "SERIES_COMPLETE" && (
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded text-white font-medium"
              title="Export final results to PDF"
            >
              <Download size={16} />
              Export PDF
            </button>
          )} */}

        
        </div>
      </div>

      {/* Render current phase */}
      {renderCurrentPhase()}
    </div>
  );
}
