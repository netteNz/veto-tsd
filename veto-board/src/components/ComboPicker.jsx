import React from "react";

/**
 * Renders objective combos and slayer map buttons and calls onPick(mapId, modeId?)
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
    if (m?.map) return m.map;
    if (m?.id) return m.id;
    if (m?.pk) return m.pk;
    return m;
  };

  const normModeId = (c) => {
    if (c?.mode_id) return c.mode_id;
    if (c?.mode?.id) return c.mode.id;
    if (c?.mode) return c.mode;
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

  return (
    <div className="space-y-4">
      {/* Render grouped objective combos if provided */}
      {objectiveCombos && objectiveCombos.length > 0 && (
        <div className="space-y-4">
          {objectiveCombos.map((group, gi) => (
            <div key={gi} className="bg-panel-raised p-4">
              <h4 className="mb-2 text-sm font-medium text-hud">{group.mode}</h4>
              <div className="flex flex-wrap gap-2">
                {group.combos.map((combo, idx) => {
                  const mapId = normMapId(combo);
                  // prefer combo.mode, fall back to group.mode / group.modeId
                  const modeId =
                    normModeId(combo) ??
                    normModeId(group) ??
                    (typeof group.modeId === "number" ? group.modeId : null) ??
                    (typeof group.mode === "number" ? group.mode : null);
                  return (
                    <button
                      key={`${mapId}-${modeId ?? "no-mode"}-${idx}`}
                      onClick={() => onPick && onPick(mapId, modeId)}
                      // disable when no map or no explicit mode id (null/undefined)
                      disabled={loading || !mapId || modeId == null}
                      className="rounded-lg bg-hud/10 px-3 py-2 text-sm text-ink transition-colors hover:bg-hud/20 disabled:opacity-40"
                    >
                      {mapLabel(combo)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {slayerMaps && slayerMaps.length > 0 && (
        <div className="bg-panel-raised p-4">
          <h4 className="mb-2 text-sm font-medium text-hud">Slayer</h4>
          <div className="flex flex-wrap gap-2">
            {slayerMaps.map((m, idx) => {
              const mapId = normMapId(m);
              const label = m?.name ?? m?.map_name ?? String(mapId);
              return (
                <button
                  key={`${mapId}-${idx}`}
                  onClick={() => onPick && onPick(mapId, null)}
                  disabled={loading || !mapId}
                  className="rounded-lg bg-hud/10 px-4 py-2 text-sm text-ink transition-colors hover:bg-hud/20 disabled:opacity-40"
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
