import { useEffect, useState, useMemo } from "react";
import { getSeries, postUndo, postReset } from "../lib/api";
import { processBansAndPicks } from "../lib/bans";
import { currentPickerLabel } from "../lib/turn";
import BanPhase from "./BanPhase";
import PickPhase from "./PickPhase";
import SeriesLayout from "./SeriesLayout";
import SeriesTypeSelector from "./SeriesTypeSelector";
import TeamAssignmentForm from "./TeamAssignmentForm";
import exportElementToPdf from "../lib/exportPdf";
import { Download, Ban, Crosshair } from "lucide-react";

const TOTAL_BAN_STEPS = 7;

function TurnBeacon({ series }) {
  const turn = series?.turn;
  if (!turn?.team || !turn?.action) return null;

  const teamColor = turn.team === "A" ? "bg-team-red" : "bg-team-blue";
  const teamRing = turn.team === "A" ? "ring-team-red/40" : "ring-team-blue/40";
  const teamText = turn.team === "A" ? "text-team-red" : "text-team-blue";
  const label = currentPickerLabel(series);
  const isBan = turn.action === "BAN";
  const banCount = (series?.actions || []).filter((a) => a.action_type === "BAN").length;

  return (
    <div className={`hud-notch-sm flex items-center justify-between gap-4 bg-panel px-4 py-3 ring-1 ${teamRing}`}>
      <div className="flex items-center gap-3">
        <span className={`beacon-pulse size-2.5 rounded-full ${teamColor} ${teamText}`} />
        <div>
          <div className="font-display text-sm font-semibold text-ink">
            {label || `Team ${turn.team}`}
          </div>
          <div className="text-xs text-ink-muted">
            {isBan ? "eliminating a combo" : "selecting a combo"}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isBan ? <Ban size={16} className="text-warn" /> : <Crosshair size={16} className="text-hud" />}
        <span className="font-display text-sm font-semibold text-ink">
          {isBan ? "Ban" : "Pick"}
        </span>
        {series?.state === "BAN_PHASE" && (
          <span className="font-mono text-xs text-ink-muted">
            {Math.min(banCount + 1, TOTAL_BAN_STEPS)}/{TOTAL_BAN_STEPS}
          </span>
        )}
      </div>
    </div>
  );
}

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

  if (error) return <div className="text-team-red">{error}</div>;
  if (!series) return <div className="text-ink-muted">Loading series&hellip;</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-ink">
          Series {seriesId}
          <span className="ml-2 font-mono text-sm font-normal text-ink-muted">
            {series?.state}
          </span>
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

      <TurnBeacon series={series} />

      {/* Render current phase */}
      {renderCurrentPhase()}
    </div>
  );
}
