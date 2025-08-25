import React, { useMemo } from "react";
import ComboPicker from "./ComboPicker";

/**
 * Compute available objective combos and slayer maps after veto.
 */
export default function AvailableCombos({ series = {}, groupedCombos = {}, mapsList = [], gameType = null, onPick, loading = false }) {
  // normalize action arrays
  const actions = series.actions ?? [];
  const bans = actions.filter(a => a.action_type === "BAN");
  const picks = actions.filter(a => a.action_type === "PICK");

  // helper to extract map id from different shapes
  const mapIdFrom = (obj) => obj?.map_id ?? obj?.map?.id ?? obj?.map ?? obj?.id ?? obj?.pk ?? obj;

  const bannedMapIds = useMemo(() => {
    const s = new Set();
    for (const b of bans) {
      const mid = mapIdFrom(b);
      if (mid) s.add(Number(mid));
    }
    return s;
  }, [bans]);

  const pickedMapIds = useMemo(() => {
    const s = new Set();
    for (const p of picks) {
      const mid = mapIdFrom(p);
      if (mid) s.add(Number(mid));
    }
    return s;
  }, [picks]);

  // Debug the groupedCombos structure
  console.debug("AvailableCombos - groupedCombos:", groupedCombos);
  console.debug("AvailableCombos - groupedCombos keys:", Object.keys(groupedCombos || {}));

  // Flatten groupedCombos defensive handling:
  // groupedCombos might be { modeName: [...] } format
  const allObjectiveCombos = useMemo(() => {
    if (!groupedCombos) return [];
    if (Array.isArray(groupedCombos)) return groupedCombos;
    
    // Flatten all combos from all modes
    const allCombos = [];
    Object.entries(groupedCombos).forEach(([modeName, combos]) => {
      if (Array.isArray(combos)) {
        // Add mode name to each combo for reference
        combos.forEach(combo => {
          allCombos.push({
            ...combo,
            _modeName: modeName
          });
        });
      }
    });
    
    console.debug("AvailableCombos - flattened combos:", allCombos);
    return allCombos;
  }, [groupedCombos]);

  // Filter out combos whose map was banned or already picked
  const availableObjectiveCombos = useMemo(() => {
    return allObjectiveCombos.filter(c => {
      const mid = mapIdFrom(c);
      console.debug("AvailableCombos - checking combo:", { combo: c, mapId: mid, banned: bannedMapIds.has(Number(mid)), picked: pickedMapIds.has(Number(mid)) });
      if (!mid) return false;
      if (bannedMapIds.has(Number(mid))) return false;
      if (pickedMapIds.has(Number(mid))) return false;
      return true;
    });
  }, [allObjectiveCombos, bannedMapIds, pickedMapIds]);

  // For slayer: use mapsList; filter out banned/picked maps
  const availableSlayerMaps = useMemo(() => {
    return (mapsList || []).filter(m => {
      const mid = mapIdFrom(m);
      if (!mid) return false;
      if (bannedMapIds.has(Number(mid))) return false;
      if (pickedMapIds.has(Number(mid))) return false;
      // Check if map supports Slayer mode
      if (m.modes && Array.isArray(m.modes)) {
        return m.modes.some(mode => 
          (typeof mode === 'string' && mode.toLowerCase().includes("slayer")) ||
          (typeof mode === 'object' && mode.name && mode.name.toLowerCase().includes("slayer"))
        );
      }
      return true; // fallback: include it
    });
  }, [mapsList, bannedMapIds, pickedMapIds]);

  console.debug("AvailableCombos - final:", { 
    availableObjectiveCombos, 
    availableSlayerMaps,
    bannedMapIds: Array.from(bannedMapIds),
    pickedMapIds: Array.from(pickedMapIds)
  });

  // Render with ComboPicker
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