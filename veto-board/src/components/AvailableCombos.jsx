import React, { useMemo } from "react";
import ComboPicker from "./ComboPicker";

/**
 * Compute available objective combos and slayer maps after veto.
 * Option A: tag each item with `_status`, but only render "available".
 */
export default function AvailableCombos({
  series = {},
  groupedCombos = {},
  mapsList = [],
  gameType = null,
  onPick,
  loading = false,
}) {
  // normalize action arrays
  const actions = series.actions ?? [];
  const bans = actions.filter((a) => a.action_type === "BAN");
  const picks = actions.filter((a) => a.action_type === "PICK");

  // helper to extract map id from different shapes
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

  // Flatten groupedCombos defensively (handles { modeName:[...] } shape)
  const allObjectiveCombos = useMemo(() => {
    if (!groupedCombos) return [];
    if (Array.isArray(groupedCombos)) return groupedCombos;

    const all = [];
    Object.entries(groupedCombos).forEach(([modeName, combos]) => {
      if (Array.isArray(combos)) {
        combos.forEach((combo) => {
          all.push({ ...combo, _modeName: modeName });
        });
      }
    });
    return all;
  }, [groupedCombos]);

  // Tag each combo with _status, but only surface "available"
  const availableObjectiveCombos = useMemo(() => {
    return allObjectiveCombos
      .map((c) => {
        const mid = mapIdFrom(c);
        const banned = bannedMapIds.has(Number(mid));
        const picked = pickedMapIds.has(Number(mid));
        const _status = banned ? "banned" : picked ? "picked" : "available";
        return { ...c, _status };
      })
      .filter((c) => c._status === "available");
  }, [allObjectiveCombos, bannedMapIds, pickedMapIds]);

  // Slayer: tag with _status, then keep only "available" that support Slayer
  const availableSlayerMaps = useMemo(() => {
    return (mapsList || [])
      .map((m) => {
        const mid = mapIdFrom(m);
        const banned = bannedMapIds.has(Number(mid));
        const picked = pickedMapIds.has(Number(mid));
        const _status = banned ? "banned" : picked ? "picked" : "available";
        return { ...m, _status };
      })
      .filter((m) => {
        if (m._status !== "available") return false;
        if (!m?.modes || !Array.isArray(m.modes)) return true; // fallback: keep
        return m.modes.some(
          (mode) =>
            (typeof mode === "string" &&
              mode.toLowerCase().includes("slayer")) ||
            (typeof mode === "object" &&
              mode?.name?.toLowerCase().includes("slayer"))
        );
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
