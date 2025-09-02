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
      const mapId = Number(getMapId(m));
      if (!mapId) return false;
      
      // Check if this map is banned for Slayer or picked for any mode
      if (slayerBannedMapIds.has(mapId)) return false;
      if (pickedMapIds.has(mapId)) return false;

      // Verify it supports Slayer
      if (m.modes && Array.isArray(m.modes)) {
        return m.modes.some(
          (mode) =>
            (typeof mode === "string" && mode.toLowerCase().includes("slayer")) ||
            (typeof mode === "object" &&
              mode.name &&
              mode.name.toLowerCase().includes("slayer"))
        );
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
