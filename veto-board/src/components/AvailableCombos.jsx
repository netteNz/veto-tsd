import React, { useMemo } from "react";
import ComboPicker from "./ComboPicker";
import { processBansAndPicks } from "../lib/bans";

export default function AvailableCombos({
  series = {},
  groupedCombos = {},
  mapsList = [],
  gameType = null,
  onPick,
  loading = false,
  slayerMapsOverride = null,
}) {
  const {
    bannedCombinations,
    slayerBannedMapIds,
    pickedCombinations,        // Use this instead of objectivePickedMapIds
    slayerPickedMapIds,
  } = useMemo(() => {
    return processBansAndPicks(series.actions || []);
  }, [series.actions]);

  const getMapId = (x) => 
    x?.map_id || x?.map?.id || x?.map || x?.id || x?.pk || null;

  const getModeId = (x) => 
    x?.mode_id || x?.mode?.id || x?.mode || null;

  // FIXED: Check exact map+mode combinations, not just maps
  const availableObjectiveCombos = useMemo(() => {
    if (!groupedCombos?.objective) return [];
    return groupedCombos.objective
      .filter(modeGroup => {
        if (!modeGroup.combos || modeGroup.combos.length === 0) return false;
        const modeName = (modeGroup.mode || "").toLowerCase();
        if (modeName.includes("slayer")) return false;
        return true;
      })
      .map(modeGroup => {
        const modeId = Number(getModeId(modeGroup));
        const availableCombos = (modeGroup.combos || [])
          .filter(combo => {
            const mapId = Number(getMapId(combo));
            if (!mapId) return false;
            
            // FIXED: Check if this exact map+mode combo was picked or banned
            const comboKey = `${mapId}:${modeId}`;
            if (bannedCombinations.has(comboKey)) return false;
            if (pickedCombinations.has(comboKey)) return false; // This is the key fix
            
            return true;
          })
          .map(combo => ({ ...combo, map_id: Number(getMapId(combo)), mode_id: modeId }));
        return availableCombos.length ? { ...modeGroup, combos: availableCombos } : null;
      })
      .filter(Boolean);
  }, [groupedCombos, bannedCombinations, pickedCombinations]); // Updated dependencies

  // Slayer logic remains the same - it should block maps used in ANY Slayer round
  const availableSlayerMaps = useMemo(() => {
    if (slayerMapsOverride && Array.isArray(slayerMapsOverride)) return slayerMapsOverride;
    return (mapsList || []).filter((m) => {
      const mapId = Number(getMapId(m));
      if (!mapId) return false;
      if (slayerBannedMapIds.has(mapId)) return false;
      if (slayerPickedMapIds.has(mapId)) return false; // Block maps used in Slayer rounds
      if (m.modes && Array.isArray(m.modes)) {
        return m.modes.some(mode => {
          if (typeof mode === "string") return mode.toLowerCase().includes("slayer");
          if (typeof mode === "object" && mode.name) return mode.name.toLowerCase().includes("slayer");
          if (typeof mode === "number" || typeof mode === "string") return [6, "6", "slayer"].includes(mode);
          return false;
        });
      }
      return false;
    });
  }, [mapsList, slayerBannedMapIds, slayerPickedMapIds, slayerMapsOverride]);

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
