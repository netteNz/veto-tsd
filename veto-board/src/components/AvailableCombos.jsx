import React, { useMemo } from "react";
import ComboPicker from "./ComboPicker";

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
  const actions = series.actions ?? [];
  const bans = actions.filter((a) => a.action_type === "BAN");
  const picks = actions.filter((a) => a.action_type === "PICK");

  const mapIdFrom = (obj) =>
    obj?.map_id ?? obj?.map?.id ?? obj?.map ?? obj?.id ?? obj?.pk ?? obj;

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

  // Build objective combos grouped by mode, skipping Slayer and empty groups
  const availableObjectiveCombos = useMemo(() => {
    if (!groupedCombos || Array.isArray(groupedCombos)) return [];

    const groups = [];
    Object.entries(groupedCombos).forEach(([modeName, combos]) => {
      if (!Array.isArray(combos)) return;
      if (modeName.toLowerCase().includes("slayer")) return; // skip Slayer

      const filtered = combos.filter((c) => {
        const mid = mapIdFrom(c);
        if (!mid) return false;
        if (bannedMapIds.has(Number(mid))) return false;
        if (pickedMapIds.has(Number(mid))) return false;
        return true;
      });

      if (filtered.length > 0) {
        groups.push({ mode: modeName, combos: filtered });
      }
    });

    console.debug("AvailableCombos - objective groups:", groups);
    return groups;
  }, [groupedCombos, bannedMapIds, pickedMapIds]);

  // Slayer: filter out banned/picked and non-slayer-support maps
  const availableSlayerMaps = useMemo(() => {
    return (mapsList || []).filter((m) => {
      const mid = mapIdFrom(m);
      if (!mid) return false;
      if (bannedMapIds.has(Number(mid))) return false;
      if (pickedMapIds.has(Number(mid))) return false;

      if (m.modes && Array.isArray(m.modes)) {
        return m.modes.some(
          (mode) =>
            (typeof mode === "string" && mode.toLowerCase().includes("slayer")) ||
            (typeof mode === "object" &&
              mode.name &&
              mode.name.toLowerCase().includes("slayer"))
        );
      }
      return true;
    });
  }, [mapsList, bannedMapIds, pickedMapIds]);

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
