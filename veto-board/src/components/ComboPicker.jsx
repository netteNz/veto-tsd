import React from "react";

/**
 * Renders objective combos and slayer map buttons and calls onPick(mapId, modeId?)
 * Option A: buttons are colored by `_status` if present, but only "available" arrive here.
 */
export default function ComboPicker({
  objectiveCombos = [],
  slayerMaps = [],
  onPick,
  loading = false,
}) {
  const normMapId = (m) => {
    if (m?.map_id) return m.map_id;
    if (m?.map?.id) return m.map.id;
    if (m?.map) return m.map; // map is just the ID
    if (m?.id) return m.id;
    if (m?.pk) return m.pk;
    return m;
  };

  const normModeId = (c) => {
    if (c?.mode_id) return c.mode_id;
    if (c?.mode?.id) return c.mode.id;
    if (c?.mode) return c.mode; // mode is just the ID
    if (c?.modeId) return c.modeId;
    return null;
  };

  const mapLabel = (c) => {
    if (c?.map_name) return c.map_name;
    if (c?.mapName) return c.mapName;
    if (c?.map?.name) return c.map.name;
    if (c?.map?.map_name) return c.map.map_name;
    if (typeof c?.map === "string") return c.map;

    const mapId = normMapId(c);
    return mapId ? `Map ${mapId}` : "Unknown Map";
  };

  const clsByStatus = (base, status) => {
    if (status === "picked")
      return `${base} bg-purple-700 hover:bg-purple-700 cursor-not-allowed`;
    if (status === "banned")
      return `${base} bg-red-800 hover:bg-red-800 cursor-not-allowed`;
    return base; // available
  };

  return (
    <div className="space-y-4">
      {objectiveCombos && objectiveCombos.length > 0 && (
        <div className="p-4 bg-slate-700 rounded">
          <div className="text-yellow-400 font-semibold mb-2">objective</div>
          <div className="flex flex-wrap gap-2">
            {objectiveCombos.map((combo, idx) => {
              const mapId = normMapId(combo);
              const modeId = normModeId(combo);
              const status = combo?._status || "available";
              return (
                <button
                  key={`${mapId}-${modeId}-${idx}`}
                  onClick={() => onPick && onPick(mapId, modeId)}
                  disabled={loading || !mapId || !modeId || status !== "available"}
                  className={clsByStatus(
                    "px-3 py-2 rounded text-sm disabled:opacity-50 bg-blue-600 hover:bg-blue-700",
                    status
                  )}
                >
                  {mapLabel(combo)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {slayerMaps && slayerMaps.length > 0 && (
        <div className="p-4 bg-slate-700 rounded">
          <div className="text-yellow-400 font-semibold mb-2">slayer</div>
          <div className="flex flex-wrap gap-2">
            {slayerMaps.map((m, idx) => {
              const mapId = normMapId(m);
              const label = m?.name ?? m?.map_name ?? String(mapId);
              const status = m?._status || "available";
              return (
                <button
                  key={`${mapId}-${idx}`}
                  onClick={() => onPick && onPick(mapId, null)}
                  disabled={loading || !mapId || status !== "available"}
                  className={clsByStatus(
                    "px-4 py-2 rounded text-sm disabled:opacity-50 bg-green-600 hover:bg-green-700",
                    status
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
