import { useState, useEffect, useMemo } from "react";
import { getGroupedCombos, getAllMaps, API_BASE } from "../lib/api";
import { currentPickerSide, currentPickerLabel } from "../lib/turn";

export default function PickPhase({ series, onSuccess }) {
  const [maps, setMaps] = useState([]);
  const [groupedCombos, setGroupedCombos] = useState({ objective: [], slayer: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ---- Source of truth from backend ----
  const turn = series?.turn;                 // { action: "PICK", kind: "OBJECTIVE_COMBO" | "SLAYER_MAP", team: "A"|"B" }
  const pickerSide = currentPickerSide(series);
  const pickerLabel = currentPickerLabel(series);
  const isObjective = turn?.kind === "OBJECTIVE_COMBO";
  const isSlayer = turn?.kind === "SLAYER_MAP";

  useEffect(() => {
    (async () => {
      try {
        const [mapsList, grouped] = await Promise.all([getAllMaps(), getGroupedCombos()]);
        setMaps(mapsList || []);
        setGroupedCombos(grouped || { objective: [], slayer: [] });
      } catch (e) {
        console.error("Failed to load pick data:", e);
        setError("Failed to load maps/combos.");
      }
    })();
  }, []);

  const slayerCandidates = useMemo(() => {
    // Use API slayer list if present, otherwise derive from maps
    const fromApi = groupedCombos?.slayer?.[0]?.combos || [];
    if (fromApi.length) return fromApi.map(c => ({ id: c.map_id, name: c.map }));
    return (maps || []).filter(m => m?.modes?.some(md => md.name === "Slayer"));
  }, [groupedCombos, maps]);

  const handlePick = async ({ mapId, modeId }) => {
    if (!turn || turn.action !== "PICK") return;

    setLoading(true);
    setError("");

    // define everything *before* try/catch so it’s in scope
    const kind = turn?.kind; // "OBJECTIVE_COMBO" | "SLAYER_MAP"
    const endpoint =
      kind === "OBJECTIVE_COMBO" ? "pick_objective_combo" : "pick_slayer_map";
    const team = series?.turn?.team; // "A" | "B" from backend

    // build body the server expects
    const body =
      kind === "OBJECTIVE_COMBO"
        ? { team, map: Number(mapId), mode: Number(modeId) }
        : { team, map: Number(mapId) };

    // basic validation to match the server error you saw
    if (!team || !body.map || (kind === "OBJECTIVE_COMBO" && !body.mode)) {
      setError("team, map, and mode are required");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/series/${series.id}/${endpoint}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Pick failed");
      }

      onSuccess?.();
    } catch (e) {
      console.error("Pick failed:", e);
      setError(e.message || "Pick failed");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="bg-gray-800 text-white p-6 rounded space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-blue-400">
          Pick Phase {isObjective ? "— Objective" : isSlayer ? "— Slayer" : ""}
        </h3>
        <div className="text-sm text-gray-300">{pickerLabel} to pick</div>
      </div>

      {/* optional guard if you multi-client the tool; remove if single operator */}
      {!pickerSide && (
        <div className="bg-yellow-900 border border-yellow-600 text-yellow-100 px-3 py-2 rounded">
          Waiting for server turn info…
        </div>
      )}

      {error && (
        <div className="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {isObjective && (
        <div className="space-y-4">
          <p className="text-gray-300">Select an objective mode/map combination:</p>
          {(groupedCombos.objective || []).map((modeGroup) => (
            <div key={modeGroup.mode_id} className="bg-gray-700 p-4 rounded">
              <h4 className="font-semibold text-yellow-400 mb-3">{modeGroup.mode}</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {modeGroup.combos.map(combo => (
                  <button
                    key={`${modeGroup.mode_id}_${combo.map_id}`}
                    onClick={() => handlePick({ mapId: combo.map_id, modeId: modeGroup.mode_id })}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-3 py-2 rounded text-sm transition-colors"
                  >
                    {combo.map}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {isSlayer && (
        <div className="space-y-4">
          <p className="text-gray-300">Select a Slayer map:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {slayerCandidates.map(m => {
              const mapId = m.id ?? m.map_id ?? m.pk ?? m;
              const label = m.name ?? m.map ?? String(mapId);
              return (
                <button
                  key={mapId}
                  onClick={() => handlePick({ mapId })}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-4 py-3 rounded transition-colors"
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {loading && <div className="text-center text-gray-400">Making pick…</div>}
    </div>
  );
}
