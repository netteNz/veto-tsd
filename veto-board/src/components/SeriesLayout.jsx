import { useEffect, useState, useMemo } from "react";
import { getGroupedCombos, getAllMaps, API_BASE } from "../lib/api";
import AvailableCombos from "./AvailableCombos";
import { currentPickerSide, currentPickerLabel } from "../lib/turn";
import { processBansAndPicks, isComboBanned, isComboPicked, getMapId, getModeId, isSlayerMode, getModeName } from "../lib/bans"; // Add isSlayerMode
import { 
  Flag, 
  Castle, 
  Skull, 
  Crown, 
  Bomb, 
  Target, 
  XCircle, 
  CheckCircle 
} from "lucide-react";

export default function SeriesLayout({ series, onSuccess }) {
  // quick runtime diagnostics
  useEffect(() => {
    console.log("[SeriesLayout] props:", { seriesId: series?.id, state: series?.state, actionsLen: series?.actions?.length ?? 0 });
  }, [series?.id, series?.state, series?.actions?.length]);

  // Keep existing state variables
  const [mapsById, setMapsById] = useState({});
  const [modeById, setModeById] = useState({});
  const [groupedCombos, setGroupedCombos] = useState({ objective: [], slayer: [] });
  const [mapsList, setMapsList] = useState([]);
  const [openPickGame, setOpenPickGame] = useState(null);
  const [loadingPick, setLoadingPick] = useState(false);
  const [pickError, setPickError] = useState("");

  // Get processed ban/pick data
  const banPickData = useMemo(() => {
    return processBansAndPicks(series?.actions || []);
  }, [series?.actions]);
  
  // Add these variables for rendering purposes
  const bans = useMemo(() => series?.actions?.filter(a => a.action_type === "BAN") || [], [series?.actions]);
  const picks = useMemo(() => series?.actions?.filter(a => a.action_type === "PICK") || [], [series?.actions]);

  const pickerLabel = currentPickerLabel(series);
  const turn = series?.turn; // { action, kind, team }

  useEffect(() => {
    (async () => {
      try {
        const [mapsListRes, combos, modesRes] = await Promise.all([
          getAllMaps(),
          getGroupedCombos(),
          fetch(`${API_BASE}/gamemodes/`)
        ]);
        const modesJson = await modesRes.json();

        const mapLookup = {};
        (mapsListRes || []).forEach(m => { mapLookup[m.id] = m.name; });

        const modeLookup = {};
        (modesJson.results || []).forEach(md => { modeLookup[md.id] = md.name; });

        setMapsById(mapLookup);
        setModeById(modeLookup);
        setGroupedCombos(combos || { objective: [], slayer: [] });
        setMapsList(mapsListRes || []);
      } catch (e) {
        console.error("Failed to fetch map/mode details:", e);
      }
    })();
  }, []);

  // Inline pick (optional)
  const doPick = async ({ mapId, modeId }) => {
    if (!turn || turn.action !== "PICK") return;
    setLoadingPick(true); setPickError("");
    try {
      const endpoint = turn.kind === "OBJECTIVE_COMBO" ? "pick_objective_combo" : "pick_slayer_map";
      const team = series?.turn?.team;

      // Build tolerant payload (include both *_id and bare keys)
      const payload =
        turn.kind === "OBJECTIVE_COMBO"
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

      // Validate before sending
      if (!payload.team || !payload.map_id || (turn.kind === "OBJECTIVE_COMBO" && !payload.objective_mode_id)) {
        setPickError("team, map_id and objective_mode_id are required");
        setLoadingPick(false);
        return;
      }

      console.log("[DEBUG] Sending pick:", { endpoint, payload });

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

      setOpenPickGame(null);
      onSuccess?.();
    } catch (e) {
      console.error("Pick failed:", e);
      setPickError(e.message || "Pick failed");
    } finally {
      setLoadingPick(false);
    }
  };

  // Update the objectiveBans useMemo implementation with better type safety

  const objectiveBans = useMemo(() => {
    if (!series?.actions) return [];
    
    // Log the actions to debug
    console.log("[DEBUG] All actions for objective bans:", series.actions);
    
    // More lenient filtering for objective bans
    return series.actions.filter(action => {
      // Must be a ban
      if (action.action_type !== "BAN") return false;
      
      // If it has kind field, use that to determine
      if (action.kind) {
        return action.kind === "OBJECTIVE_COMBO" || action.kind.includes("OBJECTIVE");
      }
      
      // Not explicitly marked as slayer - ADD TYPE CHECKING
      const isExplicitlySlayer = 
        action.kind === "SLAYER_MAP" ||
        action.mode_id === 6 ||
        (typeof action.mode === 'string' && action.mode.toLowerCase() === "slayer") || // Fixed
        (typeof action.mode_name === 'string' && action.mode_name.toLowerCase() === "slayer"); // Fixed
        
      if (isExplicitlySlayer) return false;
      
      // Has a mode_id that's not slayer, or has a mode name that's not slayer
      return action.mode_id !== undefined || action.mode || action.mode_name;
    });
  }, [series?.actions]);

  // Also update the slayerBans logic with the same fix
  const slayerBans = useMemo(() => {
    if (!series?.actions) return [];
    
    // Log the actions to debug
    console.log("[DEBUG] All actions for slayer bans:", series.actions);
    
    // Collect unique slayer bans by map
    const uniqueMaps = new Map();
    
    series.actions.forEach(action => {
      // Skip non-bans
      if (action.action_type !== "BAN") return;
      
      // Check if this is a slayer ban using multiple approaches - ADD TYPE CHECKING
      const isSlayer = 
        action.kind === "SLAYER_MAP" ||
        action.mode_id === 6 ||
        (typeof action.mode === 'string' && action.mode.toLowerCase() === "slayer") || // Fixed
        (typeof action.mode_name === 'string' && action.mode_name.toLowerCase() === "slayer") || // Fixed
        (!action.mode_id && !action.mode && !action.mode_name); // If no mode specified, assume slayer
    
      if (!isSlayer) return;
      
      const mapId = action.map_id || action.map;
      if (!mapId) return;
      
      // Store by map ID, and keep the most recent ban for each map
      uniqueMaps.set(String(mapId), action);
    });
    
    // Convert map values to array
    return Array.from(uniqueMaps.values());
  }, [series?.actions]);

  // FIXED: Use helper function for available slayer maps
  const availableSlayerMaps = useMemo(() => {
    return (mapsList || []).filter(m => {
      const mapId = Number(m.id);
      const supports = m?.modes?.some(md =>
        (typeof md === "string" && md.toLowerCase() === "slayer") ||
        (md?.name?.toLowerCase() === "slayer")
      );
      
      // FIXED: Use helper function instead of direct set checking
      return supports && !isComboBanned(mapId, 6, banPickData) && !isComboPicked(mapId, 6, banPickData);
    });
  }, [mapsList, banPickData]);

  // In SeriesLayout.jsx where you render the Game Layout
  const getGameMode = (action) => {
    if (action.kind === "SLAYER_MAP" || 
        action.mode_name === "Slayer" || 
        action.mode === "Slayer") {
      return "Slayer";
    }
    return action.mode || action.mode_name;
  };

  // Update the renderModeIcon function to swap icons for Slayer and Oddball

  const renderModeIcon = (modeName, isSlayer = false) => {
    const iconProps = { 
      size: 18, 
      className: "transition-transform hover:scale-110" 
    };
    
    // Add type safety - convert to string and handle null/undefined
    const modeNameStr = typeof modeName === 'string' ? modeName : String(modeName || '');
    const lowerModeName = modeNameStr.toLowerCase();
    
    // CHANGED: Slayer should use Target icon
    if (isSlayer || lowerModeName.includes('slayer')) {
      return <Target {...iconProps} className={`${iconProps.className} text-red-400`} />;
    }
    
    if (lowerModeName.includes('flag')) {
      return <Flag {...iconProps} className={`${iconProps.className} text-blue-400`} />;
    } else if (lowerModeName.includes('stronghold')) {
      return <Castle {...iconProps} className={`${iconProps.className} text-purple-400`} />;
    } else if (lowerModeName.includes('king')) {
      return <Crown {...iconProps} className={`${iconProps.className} text-yellow-400`} />;
    } else if (lowerModeName.includes('bomb')) {
      return <Bomb {...iconProps} className={`${iconProps.className} text-orange-400`} />;
    // CHANGED: Oddball should use Skull icon
    } else if (lowerModeName.includes('oddball')) {
      return <Skull {...iconProps} className={`${iconProps.className} text-green-400`} />;
    }
    
    // Default icon if no match
    return <div className="w-[18px] h-[18px]" />;
  };

  return (
    <div className="bg-gray-800 text-white p-6 mt-4 rounded space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Series Layout — Bo7</h2>
        <div className="text-sm text-gray-300">
          {series.team_a} vs {series.team_b}
        </div>
      </div>

      {/* Bans Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-700 p-4 rounded">
          <h3 className="text-lg font-semibold mb-3 text-red-400 flex items-center">
            <XCircle size={18} className="mr-2" />
            Objective Bans ({objectiveBans.length})
          </h3>
          <div className="space-y-2">
            {objectiveBans.length === 0 && <div className="text-gray-400 text-sm">No objective bans yet</div>}
            {objectiveBans.map(ban => {
              // Look up map name from the ID
              const mapId = ban.map_id || ban.map;
              const mapName = (typeof mapId === 'number' && mapsById[mapId]) || ban.map || `Map ${mapId}`;
              
              // Look up mode name from the ID
              const modeId = ban.mode_id || ban.mode;
              const modeName = (typeof modeId === 'number' && modeById[modeId]) || ban.mode_name || ban.mode || `Mode ${modeId}`;
              
              return (
                <div key={ban.id} className="flex items-center justify-between mb-1 bg-gray-800/50 p-2 rounded">
                  <div className="flex items-center">
                    {renderModeIcon(modeName)}
                    <span className="ml-2 font-medium">{mapName}</span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <span>{modeName} — Team {ban.team}</span>
                    <XCircle size={16} className="ml-2 text-red-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gray-700 p-4 rounded">
          <h3 className="text-lg font-semibold mb-3 text-red-400 flex items-center">
            <XCircle size={18} className="mr-2" />
            <Target size={18} className="mr-2" />
            Slayer Bans ({slayerBans.length})
          </h3>
          <div className="space-y-2">
            {slayerBans.length === 0 && <div className="text-gray-400 text-sm">No slayer bans yet</div>}
            {slayerBans.map((ban, i) => {
              const mapId = ban.map_id || ban.map;
              const mapName = (typeof mapId === 'number' && mapsById[mapId]) || ban.map || `Map ${mapId}`;
              
              return (
                <div key={ban.id || i} className="flex justify-between text-sm bg-gray-800/50 p-2 rounded">
                  <div className="flex items-center">
                    <Target size={16} className="mr-2 text-red-400" />
                    <span className="font-medium">{mapName}</span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <span>Team {ban.team}</span>
                    <XCircle size={16} className="ml-2 text-red-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Picks grid */}
      <div className="bg-gray-700 p-4 rounded">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold mb-2 text-green-400">Game Layout</h3>
          {series.state === "PICK_WINDOW" && turn?.action === "PICK" && (
            <div className="text-sm text-gray-300">Current picker: {pickerLabel}</div>
          )}
        </div>

        {/* Existing picked rounds (if server returns them) */}
        <div className="grid grid-cols-1 gap-3">
          {picks.map((p, i) => {
            // Get proper map name from ID
            const mapName = mapsById[p.map || p.map_id] || p.map || `Map ${p.map || p.map_id}`;;
            
            // Get proper mode name using lookup
            const modeId = p.mode_id || p.mode;
            let modeName;
            
            // Handle Slayer special case
            if (p.kind === "SLAYER_MAP" || 
                p.mode_name === "Slayer" || 
                p.mode === "Slayer" ||
                modeId === 6) {
              modeName = "Slayer";
            } else {
              // Try to get name from lookup table first, then fallbacks
              modeName = (typeof modeId === 'number' && modeById[modeId]) || 
                        p.mode_name || 
                        (typeof p.mode === 'string' ? p.mode : `Mode ${modeId}`);
            }
            
            // Determine if this is a Slayer mode for icon rendering
            const isSlayerMode = modeName === "Slayer" || p.kind === "SLAYER_MAP";
            
            return (
              <div key={p.id || i} className="flex justify-between bg-gray-800 p-3 rounded">
                <div className="font-medium">
                  {mapName}
                </div>
                <div className="flex items-center text-gray-300">
                  {renderModeIcon(modeName, isSlayerMode)}
                  <span className="ml-2">{modeName}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Inline picker panel (only when it’s pick window) */}
        {series.state === "PICK_WINDOW" && turn?.action === "PICK" && (
          <div className="p-4 bg-slate-800 rounded mt-4">
            <div className="text-sm text-gray-300 mb-2">
              Select an available map / combo for this pick:
            </div>

            <AvailableCombos
              series={series}
              groupedCombos={groupedCombos}
              mapsList={mapsList}
              gameType={turn.kind === "OBJECTIVE_COMBO" ? "Objective" : "Slayer"}
              loading={loadingPick}
              onPick={async (mapId, modeId) => {
                try {
                  await doPick({ mapId, modeId });
                } catch (e) {
                  setPickError(e?.message || "Pick failed");
                }
              }}
              // Provide filtered slayer list to the child if it expects it
              slayerMapsOverride={availableSlayerMaps}
            />

            {pickError && <div className="mt-2 text-red-400 text-sm">{pickError}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
