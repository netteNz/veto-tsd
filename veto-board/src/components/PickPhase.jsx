import { useState, useEffect, useMemo } from "react";
import { ChevronDown, ChevronUp, Flag, Castle, Skull, Crown, Bomb, Target } from "lucide-react";
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

  // Use the shared utility to process bans and picks  
  const {
    bannedCombinations,
    slayerBannedMapIds,
    pickedCombinations,        // CHANGED: Use this instead of pickedMapIds
    slayerPickedMapIds,
  } = useMemo(() => {
    return processBansAndPicks(series?.actions || []);
  }, [series?.actions]);

  // Look up which team made a given pick, straight from the action log
  // (the banned/picked Sets from processBansAndPicks only track membership, not team)
  const pickTeamByMapMode = useMemo(() => {
    const lookup = new Map();
    for (const a of series?.actions || []) {
      if (a.action_type !== "PICK") continue;
      const mapId = Number(getMapId(a));
      const modeId = Number(getModeId(a));
      if (mapId) lookup.set(`slayer:${mapId}`, a.team);
      if (mapId && modeId) lookup.set(`obj:${mapId}:${modeId}`, a.team);
    }
    return lookup;
  }, [series?.actions]);

  // Process all slayer maps, including banned ones (for display)
  const allSlayerMaps = useMemo(() => {
    if (!maps.length) return [];
    return maps
      .filter(m => {
        if (!m?.modes || !Array.isArray(m.modes)) return false;
        return m.modes.some(mode => isSlayerMode(mode));
      })
      .map(m => {
        const mapId = Number(m.id);
        const isBanned = slayerBannedMapIds.has(mapId);
        // CHANGED: only consider Slayer picks here
        const isPicked = !isBanned && slayerPickedMapIds.has(mapId);
        return {
          id: mapId,
          name: m.name || m.map || `Map ${mapId}`,
          isBanned,
          isPicked,
          pickedByTeam: isPicked ? pickTeamByMapMode.get(`slayer:${mapId}`) : null,
          disabled: isBanned || isPicked
        };
      });
  }, [maps, slayerBannedMapIds, slayerPickedMapIds, pickTeamByMapMode]);

  // Available Slayer maps (for selection - filtered)
  const availableSlayerMaps = useMemo(() => {
    return allSlayerMaps.filter(m => !m.isBanned && !m.isPicked);
  }, [allSlayerMaps]);

  // Process objective combos
  const processedObjectiveCombos = useMemo(() => {
    if (!groupedCombos?.objective) return [];
    return groupedCombos.objective
      .filter(modeGroup => {
        if (!modeGroup.combos || modeGroup.combos.length === 0) return false;
        return !isSlayerMode(modeGroup.mode);
      })
      .map(modeGroup => {
        const modeId = Number(getModeId(modeGroup));
        const processedCombos = (modeGroup.combos || []).map(combo => {
          const mapId = Number(getMapId(combo));
          const comboKey = `${mapId}:${modeId}`;
          const isBanned = bannedCombinations.has(comboKey);
          const isPicked = pickedCombinations.has(comboKey); // CHANGED: Use exact combo check
          const pickedByTeam = isPicked ? pickTeamByMapMode.get(`obj:${comboKey}`) : null;
          return { ...combo, isBanned, isPicked, pickedByTeam, disabled: isBanned || isPicked };
        });
        return {
          ...modeGroup,
          mode: getModeName(modeGroup) || modeGroup.mode,
          combos: processedCombos
        };
      });
  }, [groupedCombos, bannedCombinations, pickedCombinations, pickTeamByMapMode]); // CHANGED: Updated dependencies

  // Available objective combos (for selection)
  const availableObjectiveCombos = useMemo(() => {
    return processedObjectiveCombos.map(modeGroup => {
      const availableCombos = modeGroup.combos.filter(combo => !combo.disabled);
      return availableCombos.length ? { ...modeGroup, combos: availableCombos } : null;
    }).filter(Boolean);
  }, [processedObjectiveCombos]);

  const handlePick = async ({ mapId, modeId }) => {
    if (!turn || turn.action !== "PICK") return;

    setLoading(true);
    setError("");

    const kind = turn?.kind;
    const endpoint = kind === "OBJECTIVE_COMBO" ? "pick_objective_combo" : "pick_slayer_map";
    const team = series?.turn?.team;

    const payload =
      kind === "OBJECTIVE_COMBO"
        ? {
            team,
            map_id: Number(mapId),
            map: Number(mapId),
            objective_mode_id: Number(modeId),
            mode_id: Number(modeId),
            objective_mode: Number(modeId),
          }
        : {
            team,
            map_id: Number(mapId),
            map: Number(mapId),
          };

    if (!payload.team || !payload.map_id || (kind === "OBJECTIVE_COMBO" && !payload.objective_mode_id)) {
      setError("team, map_id and objective_mode_id are required");
      setLoading(false);
      return;
    }

    console.log("[DEBUG] Sending pick:", { endpoint, payload });

    try {
      const res = await fetch(`${API_BASE}/series/${series.id}/${endpoint}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("[DEBUG] Pick failed. Status:", res.status, "Body:", text);
        let msg = "Pick failed";
        try { msg = (JSON.parse(text)?.detail) || msg; } catch {}
        throw new Error(msg);
      }

      onSuccess?.();
    } catch (e) {
      console.error("Pick failed:", e);
      setError(e.message || "Pick failed");
    } finally {
      setLoading(false);
    }
  };

  // Add state to track expanded/collapsed sections
  const [expandedSections, setExpandedSections] = useState({
    availableSelections: false,  // Now collapsed by default
    objectiveModes: true
  });

  // Toggle function for any section
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Function to render mode icons
  const renderModeIcon = (modeName) => {
    const iconProps = {
      size: 18,
      className: "transition-transform hover:scale-110"
    };

    const lowerModeName = String(modeName).toLowerCase();

    if (lowerModeName.includes('flag')) {
      return <Flag {...iconProps} className={`${iconProps.className} text-team-blue`} />;
    } else if (lowerModeName.includes('stronghold')) {
      return <Castle {...iconProps} className={`${iconProps.className} text-hud`} />;
    } else if (lowerModeName.includes('slayer')) {
      return <Target {...iconProps} className={`${iconProps.className} text-team-red`} />;
    } else if (lowerModeName.includes('king')) {
      return <Crown {...iconProps} className={`${iconProps.className} text-warn`} />;
    } else if (lowerModeName.includes('bomb')) {
      return <Bomb {...iconProps} className={`${iconProps.className} text-team-red`} />;
    } else if (lowerModeName.includes('oddball')) {
      return <Skull {...iconProps} className={`${iconProps.className} text-hud`} />;
    }

    // Default icon if no match
    return <div className="w-[18px] h-[18px]" />;
  };

  // Corner-bracket + reticle-strike overlay shown on eliminated combos
  const TargetLockOverlay = () => (
    <>
      <span className="lock-bracket pointer-events-none absolute left-1 top-1 h-2 w-2 border-l border-t border-warn" />
      <span className="lock-bracket pointer-events-none absolute right-1 top-1 h-2 w-2 border-r border-t border-warn" />
      <span className="lock-bracket pointer-events-none absolute bottom-1 left-1 h-2 w-2 border-b border-l border-warn" />
      <span className="lock-bracket pointer-events-none absolute bottom-1 right-1 h-2 w-2 border-b border-r border-warn" />
      <span className="lock-strike-line pointer-events-none absolute left-0 top-1/2 h-px w-full origin-left -translate-y-1/2 bg-warn/70" />
    </>
  );

  return (
    <div className="space-y-5 rounded-2xl border border-ink-muted/10 bg-panel p-6">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-hud">
          <Target size={18} />
          Pick Phase {isObjective ? "— Objective" : isSlayer ? "— Slayer" : ""}
        </h3>
        <div className="text-sm text-ink-muted">{pickerLabel} to pick</div>
      </div>

      {!dataLoaded ? (
        <div className="py-8 text-center text-sm text-ink-muted">
          <div className="animate-pulse">Loading maps and game modes&hellip;</div>
        </div>
      ) : (
        <>
          <div className="mb-3">
            <p className="text-xs text-ink-muted">
              <span className="font-medium text-warn">Amber</span> = eliminated ·{" "}
              <span className="font-medium text-team-red">red</span> / <span className="font-medium text-team-blue">blue</span> = picked, by team
            </p>
          </div>

          {/* Slayer Maps Display */}
          {isSlayer && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-ink-muted">Select a Slayer map:</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {allSlayerMaps.map(map => {
                  const isTeamA = map.pickedByTeam === "A";
                  return (
                    <button
                      key={map.id}
                      onClick={() => !map.disabled && handlePick({ mapId: map.id })}
                      disabled={map.disabled || loading}
                      className={`
                        relative overflow-hidden rounded-lg border p-3 transition-colors
                        ${map.isBanned
                          ? 'target-locked border-transparent bg-warn/10 text-ink-muted'
                          : map.isPicked
                            ? isTeamA
                              ? 'border-transparent bg-team-red/10 text-ink'
                              : 'border-transparent bg-team-blue/10 text-ink'
                            : 'border-transparent bg-panel-raised text-ink hover:bg-panel-raised/70'
                        }
                        ${map.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      {map.isBanned && <TargetLockOverlay />}
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{map.name}</div>
                        {map.isBanned ? (
                          <span className="text-xs text-warn">Eliminated</span>
                        ) : map.isPicked ? (
                          <span className={`text-xs ${isTeamA ? 'text-team-red' : 'text-team-blue'}`}>Picked</span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}

                {allSlayerMaps.length === 0 && (
                  <div className="col-span-4 text-center text-sm text-ink-muted">
                    No Slayer maps available
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Objective Modes Display */}
          {isObjective && processedObjectiveCombos.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-ink-muted">Select an objective mode/map combination:</p>
              {processedObjectiveCombos.map((modeGroup) => (
                <div key={modeGroup.mode_id} className="rounded-xl bg-panel-raised p-4">
                  <h4 className="mb-3 flex items-center font-medium text-hud">
                    {renderModeIcon(modeGroup.mode)}
                    <span className="ml-2">{modeGroup.mode}</span>
                  </h4>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {modeGroup.combos.map(combo => {
                      const isTeamA = combo.pickedByTeam === "A";
                      return (
                        <button
                          key={`${modeGroup.mode_id}_${combo.map_id}`}
                          onClick={() => !combo.disabled && handlePick({ mapId: combo.map_id, modeId: modeGroup.mode_id })}
                          disabled={combo.disabled || loading}
                          className={`
                            relative overflow-hidden rounded-lg border p-3
                            ${combo.isBanned
                              ? 'target-locked border-transparent bg-warn/10 text-ink-muted'
                              : combo.isPicked
                                ? isTeamA
                                  ? 'border-transparent bg-team-red/10 text-ink'
                                  : 'border-transparent bg-team-blue/10 text-ink'
                                : 'border-transparent bg-panel text-ink hover:bg-panel/70'
                            }
                            transition-colors
                            ${combo.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                          `}
                        >
                          {combo.isBanned && <TargetLockOverlay />}
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{combo.map}</div>
                            {combo.isBanned && <span className="text-xs text-warn">Eliminated</span>}
                            {combo.isPicked && (
                              <span className={`text-xs ${isTeamA ? 'text-team-red' : 'text-team-blue'}`}>Picked</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Collapsible Available Selections */}
          {turn?.action === "PICK" && (
            <div className="mt-8 border-t border-ink-muted/10 pt-6">
              <div
                className="flex cursor-pointer items-center justify-between"
                onClick={() => toggleSection('availableSelections')}
              >
                <h4 className="mb-0 font-medium text-hud">Available Selections</h4>
                {expandedSections.availableSelections ? (
                  <ChevronUp className="h-5 w-5 text-hud" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-hud" />
                )}
              </div>

              {expandedSections.availableSelections && (
                <div className="mt-4 transition-all duration-300">
                  {isSlayer && (
                    <div className="rounded-xl bg-panel-raised p-4">
                      <p className="mb-3 text-sm font-medium text-hud">Slayer Maps</p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-5">
                        {availableSlayerMaps.length > 0 ? (
                          availableSlayerMaps.map(map => (
                            <button
                              key={map.id}
                              onClick={() => handlePick({ mapId: map.id })}
                              disabled={loading}
                              className="rounded-lg bg-hud/10 px-3 py-2 text-sm text-ink transition-colors hover:bg-hud/20"
                            >
                              {map.name}
                            </button>
                          ))
                        ) : (
                          <div className="col-span-full text-sm text-ink-muted">
                            No available Slayer maps to pick
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {isObjective && (
                    <div className="mt-4 rounded-xl bg-panel-raised p-4">
                      <div
                        className="flex cursor-pointer items-center justify-between"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent parent handler from triggering
                          toggleSection('objectiveModes');
                        }}
                      >
                        <p className="mb-0 flex items-center text-sm font-medium text-hud">
                          <Target size={16} className="mr-2" />
                          <span>Objective Modes</span>
                        </p>
                        {expandedSections.objectiveModes ? (
                          <ChevronUp className="h-4 w-4 text-hud" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-hud" />
                        )}
                      </div>

                      {expandedSections.objectiveModes && (
                        <div className="mt-3 grid grid-cols-1 gap-4">
                          {availableObjectiveCombos.length > 0 ? (
                            availableObjectiveCombos.map(modeGroup => (
                              <div key={modeGroup.mode_id} className="rounded-lg bg-panel p-3">
                                <h5 className="mb-2 flex items-center text-sm font-medium text-ink-muted">
                                  {renderModeIcon(modeGroup.mode)}
                                  <span className="ml-2">{modeGroup.mode}</span>
                                </h5>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                                  {modeGroup.combos.map(combo => (
                                    <button
                                      key={combo.map_id}
                                      onClick={() => handlePick({ mapId: combo.map_id, modeId: modeGroup.mode_id })}
                                      disabled={loading}
                                      className="group rounded-lg bg-hud/10 px-3 py-2 text-sm text-ink transition-colors hover:bg-hud/20"
                                    >
                                      <div className="flex items-center justify-center">
                                        <Target size={14} className="mr-1 text-hud transition-transform group-hover:scale-110" />
                                        <span>{combo.map}</span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center text-sm text-ink-muted">
                              No available objective combinations to pick
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {loading && <div className="text-center text-sm text-ink-muted">Making pick&hellip;</div>}

      {error && (
        <div className="mt-4 rounded-lg bg-team-red/10 px-4 py-3 text-sm text-team-red">
          {error}
        </div>
      )}
    </div>
  );
}
