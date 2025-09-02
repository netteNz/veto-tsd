import React, { useMemo } from "react";
import ComboPicker from "./ComboPicker";
import { processBansAndPicks } from "../lib/bans";

/**
 * Compute available objective combos and slayer maps after veto.
 */
export default function AvailableCombos({
  series = {},
  groupedCombos = {},
  mapsList = [],
  gameType = null,
  onPick,
  loading = false,
}) {
  // Use the shared ban/pick processing logic
  const {
    bannedCombinations,
    slayerBannedMapIds,
    pickedMapIds,
    pickedCombinations
  } = useMemo(() => {
    return processBansAndPicks(series.actions || []);
  }, [series.actions]);

  const getMapId = (x) => 
    x?.map_id || x?.map?.id || x?.map || x?.id || x?.pk || null;

  const getModeId = (x) => 
    x?.mode_id || x?.mode?.id || x?.mode || null;

  // Build objective combos grouped by mode, with mode-aware ban checking
  const availableObjectiveCombos = useMemo(() => {
    if (!groupedCombos?.objective) return [];

    return groupedCombos.objective
      .filter(modeGroup => {
        // Skip empty groups and slayer modes
        if (!modeGroup.combos || modeGroup.combos.length === 0) return false;
        const modeName = (modeGroup.mode || "").toLowerCase();
        if (modeName.includes("slayer")) return false;
        return true;
      })
      .map(modeGroup => {
        const modeId = Number(getModeId(modeGroup));
        // Only include combos that aren't banned or picked
        const availableCombos = (modeGroup.combos || [])
          .filter(combo => {
            const mapId = Number(getMapId(combo));
            if (!mapId || pickedMapIds.has(mapId)) return false;
            
            // Check if this specific map+mode combination is banned
            const comboKey = `${mapId}:${modeId}`;
            return !bannedCombinations.has(comboKey);
          })
          .map(combo => ({
            ...combo,
            map_id: Number(getMapId(combo)),
            mode_id: modeId
          }));
          
        // Only include mode groups that have available maps
        if (availableCombos.length === 0) return null;
        return { ...modeGroup, combos: availableCombos };
      })
      .filter(Boolean); // Remove null entries
  }, [groupedCombos, bannedCombinations, pickedMapIds]);

  // Slayer: filter out maps that are specifically banned for Slayer
  const availableSlayerMaps = useMemo(() => {
    return (mapsList || []).filter((m) => {
      // Convert to Number to ensure consistent comparison
      const mapId = Number(getMapId(m));
      if (!mapId) return false;
      
      // Use explicit Number conversion for comparison with Set values
      if (slayerBannedMapIds.has(mapId)) {
        console.log(`Map ${mapId} (${m.name || m.map}) is banned for Slayer`);
        return false;
      }
      
      if (pickedMapIds.has(mapId)) {
        console.log(`Map ${mapId} (${m.name || m.map}) is already picked`);
        return false;
      }

      // Improved Slayer mode detection
      if (m.modes && Array.isArray(m.modes)) {
        return m.modes.some(mode => {
          if (typeof mode === "string") {
            return mode.toLowerCase().includes("slayer");
          }
          if (typeof mode === "object" && mode.name) {
            return mode.name.toLowerCase().includes("slayer");
          }
          if (typeof mode === "number" || typeof mode === "string") {
            // Check if this is a direct mode ID reference that's a slayer mode
            // This handles cases where modes are just IDs
            return [6, "6", "slayer"].includes(mode);
          }
          return false;
        });
      }
      return false; // If no modes array, assume it doesn't support Slayer
    });
  }, [mapsList, slayerBannedMapIds, pickedMapIds]);

  return (
    <div>
      <ComboPicker
        objectiveCombos={gameType === "Objective" ? availableObjectiveCombos : []}
        slayerMaps={gameType === "Slayer" ? availableSlayerMaps : []}
        onPick={onPick}
        loading={loading}
      />
    </div>
  );
}
