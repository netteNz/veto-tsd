import React, { useMemo } from "react";
import ComboPicker from "./ComboPicker";
import { processBansAndPicks, isComboBanned, isComboPicked, getMapId, getModeId } from "../lib/bans";

export default function AvailableCombos({
  series = {},
  groupedCombos = {},
  mapsList = [],
  gameType = null,
  onPick,
  loading = false,
  slayerMapsOverride = null,
}) {
  // Get processed ban/pick data
  const banPickData = useMemo(() => {
    return processBansAndPicks(series.actions || []);
  }, [series.actions]);

  // FIXED: Use helper functions for objective combos
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
            if (!mapId || !modeId) return false;
            
            // FIXED: Use helper functions
            return !isComboBanned(mapId, modeId, banPickData) && 
                   !isComboPicked(mapId, modeId, banPickData);
          })
          .map(combo => ({ ...combo, map_id: Number(getMapId(combo)), mode_id: modeId }));
        return availableCombos.length ? { ...modeGroup, combos: availableCombos } : null;
      })
      .filter(Boolean);
  }, [groupedCombos, banPickData]);

  // FIXED: Use helper functions for slayer maps
  const availableSlayerMaps = useMemo(() => {
    if (slayerMapsOverride && Array.isArray(slayerMapsOverride)) return slayerMapsOverride;
    return (mapsList || []).filter((m) => {
      const mapId = Number(getMapId(m));
      if (!mapId) return false;
      
      // FIXED: Use helper function (mode ID 6 = Slayer)
      return !isComboBanned(mapId, 6, banPickData) && 
             !isComboPicked(mapId, 6, banPickData);
    });
  }, [mapsList, banPickData, slayerMapsOverride]);

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
