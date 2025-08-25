import { useEffect, useState } from "react";
import { getGroupedCombos, postVeto } from "../lib/api";

export default function BanPhase({ series, onSuccess }) {
  const [combos, setCombos] = useState({ objective: [], slayer: [] });
  const [selectedMap, setSelectedMap] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const currentTeam = series.turn?.team; // "A" or "B"
  const kind = series.turn?.kind; // "OBJECTIVE_COMBO" or "SLAYER_MAP"

  useEffect(() => {
    getGroupedCombos().then(setCombos);
  }, []);

  const handleSubmit = async () => {
    if (loading) return;

    setError("");
    setLoading(true);

    // Fix: Pass the team identifier ("A" or "B") instead of team name
    const teamIdentifier = currentTeam; // This is already "A" or "B"

    console.log("[DEBUG] Submitting veto:", {
      seriesId: series.id,
      teamIdentifier, // Changed from team name to identifier
      selectedMap,
      selectedMode,
      kind,
    });

    try {
      const res = await postVeto(
        series.id,
        teamIdentifier, // Pass "A" or "B", not the team name
        selectedMap,
        selectedMode
      );
      console.log("[DEBUG] veto posted:", res);
      onSuccess(); // reload series
    } catch (err) {
      console.error("[DEBUG] Ban failed:", err);
      console.error("[DEBUG] Error details:", err.response?.data);
      setError(`Ban failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectionChange = (e) => {
    const value = e.target.value;
    console.log("[DEBUG] Selection changed:", value);

    if (value) {
      const [mapId, modeId] = value.split(",");
      const mapNum = Number(mapId);
      const modeNum = Number(modeId);

      console.log("[DEBUG] Parsed selection:", { mapNum, modeNum });
      setSelectedMap(mapNum);
      setSelectedMode(modeNum);
    } else {
      setSelectedMap(null);
      setSelectedMode(null);
    }
  };

  // Add more debugging for the kind determination
  console.log("[DEBUG] Kind:", kind);
  console.log("[DEBUG] Combos state:", combos);

  // Fix the logic - make sure we're checking the right values
  const isObjectiveCombo = kind === "OBJECTIVE_COMBO" || kind?.includes("OBJECTIVE");
  const available = isObjectiveCombo ? combos.objective : combos.slayer;

  console.log("[DEBUG] Is objective combo:", isObjectiveCombo);
  console.log("[DEBUG] Available combos:", available);

  return (
    <div className="bg-gray-800 text-white p-4 mt-4 rounded space-y-4">
      <h3 className="font-bold text-lg">Ban Phase</h3>
      <div className="text-sm text-gray-300">
        Turn:{" "}
        <span className="font-semibold">
          {currentTeam === "A" ? series.team_a : series.team_b}
        </span>{" "}
        — banning an {isObjectiveCombo ? "Objective combo" : "Slayer map"}
      </div>

      {/* Enhanced debugging info */}
      <div className="text-xs text-gray-400 space-y-1">
        <div>DEBUG: Selected Map: {selectedMap}, Mode: {selectedMode}</div>
        <div>DEBUG: Available: {available.length}, Kind: "{kind}"</div>
        <div>DEBUG: Is Objective: {isObjectiveCombo ? "YES" : "NO"}</div>
        <div>DEBUG: Team Identifier: "{currentTeam}", Series ID: {series.id}</div>
      </div>

      <div className="flex flex-col gap-4">
        <select
          className="bg-gray-900 text-white p-2 rounded"
          onChange={handleSelectionChange}
          value={selectedMap && selectedMode ? `${selectedMap},${selectedMode}` : ""}
        >
          <option value="">
            Select {isObjectiveCombo ? "map × objective mode" : "slayer map"} combo
          </option>
          {available.map((group) => (
            <optgroup key={group.mode_id} label={group.mode}>
              {group.combos.map((combo) => (
                <option key={combo.map_id} value={`${combo.map_id},${group.mode_id}`}>
                  {combo.map}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        <button
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white disabled:opacity-50"
          disabled={!selectedMap || !selectedMode || loading}
          onClick={handleSubmit}
        >
          {loading ? "Processing..." : "Confirm Ban"}
        </button>

        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>
    </div>
  );
}
