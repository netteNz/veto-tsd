import { useEffect, useState, useMemo } from "react";
import { getGroupedCombos, postVeto } from "../lib/api";

// Import the shared utilities
import { processBansAndPicks, getMapId, getModeId, isSlayerMode } from "../lib/bans";

export default function BanPhase({ series, onSuccess }) {
  const [combos, setCombos] = useState({ objective: [], slayer: [] });
  const [selectedMap, setSelectedMap] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const currentTeam = series.turn?.team; // "A" or "B"
  const kind = series.turn?.kind; // "OBJECTIVE_COMBO" or "SLAYER_MAP"

  // Process the bans and picks from the series actions
  const {
    bannedCombinations,
    slayerBannedMapIds,
    pickedMapIds,
    pickedCombinations,
  } = useMemo(() => {
    return processBansAndPicks(series?.actions || []);
  }, [series?.actions]);

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
      teamIdentifier, 
      selectedMap,
      selectedMode,
      kind,
    });

    try {
      const res = await postVeto(
        series.id,
        teamIdentifier,
        selectedMap,
        selectedMode
      );
      console.log("[DEBUG] veto posted:", res);
      console.log("[DEBUG] Calling onSuccess to reload series...");
      
      // Add a small delay to make sure UI updates properly
      setTimeout(() => {
        onSuccess(); // reload series
      }, 100);
      
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

  // After you've loaded the combos, filter them before displaying in UI
  const filteredAvailable = useMemo(() => {
    if (!available || !available.length) return [];
    
    return available.map(group => {
      // Clone the group
      const newGroup = {...group};
      
      // Filter the combos based on ban/pick status
      newGroup.combos = (group.combos || []).filter(combo => {
        const mapId = Number(combo.map_id);
        const modeId = Number(group.mode_id);
        
        // Skip if map is picked for any mode
        if (pickedMapIds.has(mapId)) {
          return false;
        }
        
        // For objective, check combination bans
        if (isObjectiveCombo) {
          const comboKey = `${mapId}:${modeId}`;
          return !bannedCombinations.has(comboKey);
        }
        // For slayer, check slayer-specific bans
        else {
          return !slayerBannedMapIds.has(mapId);
        }
      });
      
      return newGroup;
    }).filter(group => group.combos && group.combos.length > 0);
  }, [available, isObjectiveCombo, bannedCombinations, slayerBannedMapIds, pickedMapIds]);

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

      <div className="flex flex-col gap-4">
        <select
          className="bg-gray-900 text-white p-2 rounded"
          onChange={handleSelectionChange}
          value={selectedMap && selectedMode ? `${selectedMap},${selectedMode}` : ""}
        >
          <option value="">
            Select {isObjectiveCombo ? "map × objective mode" : "slayer map"} combo
          </option>
          {filteredAvailable.map((group) => (
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
