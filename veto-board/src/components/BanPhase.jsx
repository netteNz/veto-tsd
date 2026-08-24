import { useEffect, useState, useMemo } from "react";
import { Ban, Flag, Castle, Skull, Crown, Bomb, Target } from "lucide-react";
import { getGroupedCombos, postVeto } from "../lib/api";

// Import the shared utilities
import { processBansAndPicks, getMapId, getModeId, isSlayerMode } from "../lib/bans";

function modeIcon(modeName) {
  const props = { size: 16 };
  const lower = String(modeName).toLowerCase();
  if (lower.includes("flag")) return <Flag {...props} className="text-team-blue" />;
  if (lower.includes("stronghold")) return <Castle {...props} className="text-hud" />;
  if (lower.includes("king")) return <Crown {...props} className="text-warn" />;
  if (lower.includes("bomb")) return <Bomb {...props} className="text-team-red" />;
  if (lower.includes("oddball")) return <Skull {...props} className="text-hud" />;
  if (lower.includes("slayer")) return <Target {...props} className="text-team-red" />;
  return null;
}

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

  const handleCardSelect = (mapId, modeId) => {
    const mapNum = Number(mapId);
    const modeNum = Number(modeId);
    if (isNaN(mapNum) || isNaN(modeNum)) return;

    if (selectedMap === mapNum && selectedMode === modeNum) {
      // clicking the already-selected card deselects it
      setSelectedMap(null);
      setSelectedMode(null);
      return;
    }
    setSelectedMap(mapNum);
    setSelectedMode(modeNum);
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

      // Filter the combos based on exact combo ban/pick status
      newGroup.combos = (group.combos || []).filter(combo => {
        const mapId = Number(combo.map_id);
        const modeId = Number(group.mode_id);

        if (!mapId || !modeId) return false;

        // Build exact combo key and check explicit combo bans/picks
        const comboKey = `${mapId}:${modeId}`;
        if (bannedCombinations.has(comboKey) || pickedCombinations.has(comboKey)) {
          return false;
        }

        // For slayer flow, also respect map-level slayer bans (map-only bans)
        if (!isObjectiveCombo && slayerBannedMapIds.has(mapId)) {
          return false;
        }

        return true;
      });

      return newGroup;
    }).filter(group => group.combos && group.combos.length > 0);
  }, [available, isObjectiveCombo, bannedCombinations, slayerBannedMapIds, pickedCombinations]);

  return (
    <div className="space-y-5 rounded-2xl border border-ink-muted/10 bg-panel p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
          <Ban size={18} className="text-warn" />
          Ban Phase
        </h3>
        <div className="text-sm text-ink-muted">
          {currentTeam === "A" ? series.team_a : series.team_b} eliminating an{" "}
          {isObjectiveCombo ? "objective combo" : "slayer map"}
        </div>
      </div>

      <div className="space-y-5">
        {filteredAvailable.length === 0 && (
          <div className="text-sm text-ink-muted">No combos remaining to ban.</div>
        )}

        {filteredAvailable.map((group) => (
          <div key={group.mode_id}>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-ink-muted">
              {modeIcon(group.mode)}
              {group.mode}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {group.combos.map((combo) => {
                const isSelected = selectedMap === Number(combo.map_id) && selectedMode === Number(group.mode_id);
                return (
                  <button
                    key={combo.map_id}
                    type="button"
                    onClick={() => handleCardSelect(combo.map_id, group.mode_id)}
                    className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                      isSelected
                        ? "border-warn/60 bg-warn/10 text-ink"
                        : "border-transparent bg-panel-raised text-ink hover:bg-panel-raised/70"
                    }`}
                  >
                    {combo.map}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <button
          className="rounded-lg bg-warn px-4 py-2 font-medium text-void transition-colors hover:bg-warn/90 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!selectedMap || !selectedMode || loading}
          onClick={handleSubmit}
        >
          {loading ? "Processing…" : "Confirm Ban"}
        </button>

        {error && <p className="text-sm text-team-red">{error}</p>}
      </div>
    </div>
  );
}
