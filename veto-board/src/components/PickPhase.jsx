import { useState, useEffect, useMemo } from "react";
import { getGroupedCombos, getAllMaps, API_BASE } from "../lib/api";
import { currentPickerSide, currentPickerLabel } from "../lib/turn";
import { 
  processBansAndPicks, 
  getMapId, 
  getModeId, 
  getModeName,
  isSlayerMode 
} from "../lib/bans";

export default function PickPhase({ series, onSuccess }) {
  const [maps, setMaps] = useState([]);
  const [groupedCombos, setGroupedCombos] = useState({ objective: [], slayer: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);

  // Source of truth from backend
  const turn = series?.turn;                 
  const pickerSide = currentPickerSide(series);
  const pickerLabel = currentPickerLabel(series);
  const isObjective = turn?.kind === "OBJECTIVE_COMBO";
  const isSlayer = turn?.kind === "SLAYER_MAP";

  // Load maps and combos data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [mapsData, combosData] = await Promise.all([
          getAllMaps(),
          getGroupedCombos()
        ]);
        setMaps(mapsData || []);
        setGroupedCombos(combosData || { objective: [], slayer: [] });
        setDataLoaded(true);
      } catch (err) {
        console.error("Failed to load map/combo data:", err);
        setError("Failed to load maps data. Please try refreshing.");
      }
    };
    
    loadData();
  }, []);

  // Get ban and pick data using shared utility
  const {
    bannedCombinations,    // Set of "mapId:modeId" strings
    slayerBannedMapIds,    // Set of map IDs banned for Slayer
    pickedMapIds,          // All picked map IDs (any mode) 
    pickedCombinations     // Set of "mapId:modeId" strings for picks
  } = useMemo(() => {
    return processBansAndPicks(series?.actions || []);
  }, [series?.actions]);

  // Process all slayer maps, including banned ones (for display)
  const allSlayerMaps = useMemo(() => {
    if (!maps.length) return [];
    
    return maps
      .filter(m => {
        // Only include maps that support Slayer
        if (!m?.modes || !Array.isArray(m.modes)) return false;
        return m.modes.some(mode =>
          (typeof mode === "string" && mode.toLowerCase() === "slayer") ||
          (typeof mode === "object" && mode?.name?.toLowerCase() === "slayer")
        );
      })
      .map(m => {
        const mapId = Number(m.id);
        // A map cannot be both banned and picked - ban takes precedence
        const isBanned = slayerBannedMapIds.has(mapId);
        const isPicked = !isBanned && pickedMapIds.has(mapId);
        
        // Debug info to help diagnose the issue
        console.log(`Map ${m.name || m.map} (${mapId}): banned=${isBanned}, picked=${isPicked}`);
        
        return {
          id: mapId,
          name: m.name || m.map || `Map ${mapId}`,
          isBanned,
          isPicked,
          disabled: isBanned || isPicked
        };
      });
  }, [maps, slayerBannedMapIds, pickedMapIds]);

  // Available Slayer maps (for selection - filtered)
  const availableSlayerMaps = useMemo(() => {
    return allSlayerMaps.filter(m => !m.isBanned && !m.isPicked);
  }, [allSlayerMaps]);

  // Process objective combos
  const processedObjectiveCombos = useMemo(() => {
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
        const processedCombos = (modeGroup.combos || []).map(combo => {
          const mapId = Number(getMapId(combo));
          
          // Check for specific combination bans/picks
          const comboKey = `${mapId}:${modeId}`;
          const isBanned = bannedCombinations.has(comboKey);
          const isPicked = pickedCombinations.has(comboKey);
          const isMapPicked = pickedMapIds.has(mapId);
          
          return {
            ...combo,
            isBanned,
            isPicked,
            disabled: isBanned || isPicked || isMapPicked
          };
        });
        
        return { ...modeGroup, combos: processedCombos };
      });
  }, [groupedCombos, bannedCombinations, pickedCombinations, pickedMapIds]);

  // Available objective combos (for selection)
  const availableObjectiveCombos = useMemo(() => {
    return processedObjectiveCombos
      .filter(modeGroup => modeGroup.combos.some(c => !c.disabled))
      .map(modeGroup => ({
        ...modeGroup,
        combos: modeGroup.combos.filter(c => !c.disabled)
      }));
  }, [processedObjectiveCombos]);

  const handlePick = async ({ mapId, modeId }) => {
    if (!turn || turn.action !== "PICK") return;

    setLoading(true);
    setError("");

    const kind = turn?.kind;
    const endpoint = kind === "OBJECTIVE_COMBO" ? "pick_objective_combo" : "pick_slayer_map";
    const team = series?.turn?.team;

    const body =
      kind === "OBJECTIVE_COMBO"
        ? { team, map: Number(mapId), mode: Number(modeId) }
        : { team, map: Number(mapId) };

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

      {!dataLoaded ? (
        <div className="text-center py-8">
          <div className="animate-pulse">Loading maps and game modes...</div>
        </div>
      ) : (
        <>
          <div className="mb-3">
            <p className="text-sm text-gray-300">
              Maps shown in <span className="text-red-500 font-semibold">red</span> have been vetoed.
              <span className="text-green-500 font-semibold ml-1">Green</span> items have been picked.
            </p>
          </div>

          {/* Slayer Maps Display */}
          {isSlayer && (
            <div className="space-y-4">
              <p className="text-gray-300">Select a Slayer map:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {allSlayerMaps.map(map => (
                  <button
                    key={map.id}
                    onClick={() => !map.disabled && handlePick({ mapId: map.id })}
                    disabled={map.disabled || loading}
                    className={`
                      p-3 rounded border transition-colors
                      ${map.isBanned
                        ? 'border-red-800 bg-red-900/30 text-red-400'
                        : map.isPicked
                          ? 'border-green-800 bg-green-900/30 text-green-400'
                          : 'border-blue-800 bg-blue-900/30 text-white hover:bg-blue-800/40'
                      }
                      ${map.disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{map.name}</div>
                      {/* Only show one status label - ban takes precedence over pick */}
                      {map.isBanned ? (
                        <span className="px-2 py-1 text-xs rounded bg-red-800/50 text-red-300">
                          Vetoed
                        </span>
                      ) : map.isPicked ? (
                        <span className="px-2 py-1 text-xs rounded bg-green-800/50 text-green-300">
                          Picked
                        </span>
                      ) : null}
                    </div>
                  </button>
                ))}
                
                {allSlayerMaps.length === 0 && (
                  <div className="col-span-4 text-center text-gray-400">
                    No Slayer maps available
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Objective Modes Display */}
          {isObjective && processedObjectiveCombos.length > 0 && (
            <div className="space-y-4">
              <p className="text-gray-300">Select an objective mode/map combination:</p>
              {processedObjectiveCombos.map((modeGroup) => (
                <div key={modeGroup.mode_id} className="bg-gray-700 p-4 rounded">
                  <h4 className="font-semibold text-green-400 mb-3">{modeGroup.mode}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {modeGroup.combos.map(combo => (
                      <button
                        key={`${modeGroup.mode_id}_${combo.map_id}`}
                        onClick={() => !combo.disabled && handlePick({ mapId: combo.map_id, modeId: modeGroup.mode_id })}
                        disabled={combo.disabled || loading}
                        className={`
                          p-3 rounded border 
                          ${combo.isBanned 
                            ? 'border-red-800 bg-red-900/30 text-red-400' 
                            : combo.isPicked 
                              ? 'border-green-800 bg-green-900/30 text-green-400'
                              : 'border-blue-800 bg-blue-900/30 text-white hover:bg-blue-800/40'
                          }
                          transition-colors
                          ${combo.disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{combo.map}</div>
                          {combo.isBanned && (
                            <span className="px-2 py-1 text-xs rounded bg-red-800/50 text-red-300">
                              Vetoed
                            </span>
                          )}
                          {combo.isPicked && (
                            <span className="px-2 py-1 text-xs rounded bg-green-800/50 text-green-300">
                              Picked
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Simplified Selection Area */}
          {turn?.action === "PICK" && (
            <div className="mt-8 border-t border-gray-700 pt-6">
              <h4 className="text-lg font-semibold text-blue-400 mb-4">Available Selections</h4>
              
              {isSlayer && (
                <div className="bg-gray-700/50 p-4 rounded">
                  <p className="mb-3 font-medium text-blue-400">Slayer Maps</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {availableSlayerMaps.length > 0 ? (
                      availableSlayerMaps.map(map => (
                        <button
                          key={map.id}
                          onClick={() => handlePick({ mapId: map.id })}
                          disabled={loading}
                          className="px-3 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded text-sm transition-colors"
                        >
                          {map.name}
                        </button>
                      ))
                    ) : (
                      <div className="col-span-full text-gray-400">
                        No available Slayer maps to pick
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {isObjective && (
                <div className="bg-gray-700/50 p-4 rounded">
                  <p className="mb-3 font-medium text-green-400">Objective Modes</p>
                  <div className="grid grid-cols-1 gap-4">
                    {availableObjectiveCombos.length > 0 ? (
                      availableObjectiveCombos.map(modeGroup => (
                        <div key={modeGroup.mode_id} className="bg-gray-800/50 p-3 rounded">
                          <h5 className="font-medium text-green-300 mb-2">{modeGroup.mode}</h5>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {modeGroup.combos.map(combo => (
                              <button
                                key={combo.map_id}
                                onClick={() => handlePick({ mapId: combo.map_id, modeId: modeGroup.mode_id })}
                                disabled={loading}
                                className="px-3 py-2 bg-green-700 hover:bg-green-600 text-white rounded text-sm transition-colors"
                              >
                                {combo.map}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-400">
                        No available objective combinations to pick
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {loading && <div className="text-center text-gray-400">Making pick…</div>}
      
      {error && (
        <div className="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded mt-4">
          {error}
        </div>
      )}
    </div>
  );
}
