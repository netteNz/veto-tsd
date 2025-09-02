import { useEffect, useState, useMemo } from "react";
import { getGroupedCombos, getAllMaps, API_BASE } from "../lib/api";
import AvailableCombos from "./AvailableCombos";
import { currentPickerSide, currentPickerLabel } from "../lib/turn";
import { processBansAndPicks, getMapId, getModeId, isSlayerMode } from "../lib/bans"; // Add isSlayerMode

export default function SeriesLayout({ series, onSuccess }) {
  // Keep existing state variables
  const [mapsById, setMapsById] = useState({});
  const [modeById, setModeById] = useState({});
  const [groupedCombos, setGroupedCombos] = useState({ objective: [], slayer: [] });
  const [mapsList, setMapsList] = useState([]);
  const [openPickGame, setOpenPickGame] = useState(null);
  const [loadingPick, setLoadingPick] = useState(false);
  const [pickError, setPickError] = useState("");

  // Use the shared utility to process bans and picks
  const {
    bannedCombinations,
    slayerBannedMapIds,
    pickedMapIds,
    pickedCombinations
  } = useMemo(() => {
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
      const body = turn.kind === "OBJECTIVE_COMBO"
        ? { map: Number(mapId), mode: Number(modeId) }
        : { map: Number(mapId) };

      const res = await fetch(`${API_BASE}/series/${series.id}/${endpoint}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Pick failed");
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

  // Replace these custom implementations with ones using the shared data
  const objectiveBans = useMemo(() => {
    if (!series?.actions) return [];
    
    // Use the already processed ban data to build display-ready bans
    return series.actions
      .filter(a => a.action_type === "BAN")
      .filter(b => {
        const mapId = Number(getMapId(b));
        const modeId = Number(getModeId(b));
        
        // Check if it's an objective ban (not a slayer ban)
        return modeId && !isSlayerMode(b.mode) && 
          bannedCombinations.has(`${mapId}:${modeId}`);
      });
  }, [series?.actions, bannedCombinations]);

  // Fix the slayerBans calculation to avoid duplicates by map name
  const slayerBans = useMemo(() => {
    if (!series?.actions) return [];
    
    // Track banned maps by name to avoid duplication in the UI
    const uniqueBannedMapNames = new Set();
    const result = [];
    
    for (const action of series.actions) {
      if (action.action_type !== "BAN") continue;
      
      const mapId = Number(getMapId(action));
      const mapName = action.map || mapsById[mapId]?.name || `Map ${mapId}`;
      
      const isSlayerBan = 
        action.kind === "SLAYER_MAP" ||
        slayerBannedMapIds.has(mapId) ||
        (!getModeId(action) && action.action_type === "BAN");
      
      if (isSlayerBan) {
        // Only add this ban if we haven't seen this map name before
        if (!uniqueBannedMapNames.has(mapName)) {
          uniqueBannedMapNames.add(mapName);
          result.push(action);
        }
      }
    }
    
    return result;
  }, [series?.actions, slayerBannedMapIds, mapsById]);

  // Use the shared data structures for available maps
  const availableSlayerMaps = useMemo(() => {
    return (mapsList || []).filter(m => {
      const mapId = Number(m.id);
      const supports = m?.modes?.some(md => 
        (typeof md === "string" && md.toLowerCase() === "slayer") || 
        (md?.name?.toLowerCase() === "slayer")
      );
      return supports && !slayerBannedMapIds.has(mapId) && !pickedMapIds.has(mapId);
    });
  }, [mapsList, slayerBannedMapIds, pickedMapIds]);

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
          <h3 className="text-lg font-semibold mb-3 text-red-400">
            Objective Bans ({objectiveBans.length})
          </h3>
          <div className="space-y-2">
            {objectiveBans.length === 0 && <div className="text-gray-400 text-sm">No objective bans yet</div>}
            {objectiveBans.map((ban, i) => (
              <div key={ban.id || i} className="flex justify-between text-sm">
                <span>{mapsById[ban.map || ban.map_id] || `Map ${ban.map || ban.map_id}`}</span>
                <span className="text-gray-400">
                  {modeById[ban.mode || ban.mode_id] || `Mode ${ban.mode || ban.mode_id}`} — Team {ban.team}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-700 p-4 rounded">
          <h3 className="text-lg font-semibold mb-3 text-red-400">
            Slayer Bans ({slayerBans.length})
          </h3>
          <div className="space-y-2">
            {slayerBans.length === 0 && <div className="text-gray-400 text-sm">No slayer bans yet</div>}
            {slayerBans.map((ban, i) => (
              <div key={ban.id || i} className="flex justify-between text-sm">
                <span>{mapsById[ban.map || ban.map_id] || `Map ${ban.map || ban.map_id}`}</span>
                <span className="text-gray-400">Team {ban.team}</span>
              </div>
            ))}
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
          {picks.map((p, i) => (
            <div key={p.id || i} className="flex justify-between bg-gray-800 p-3 rounded">
              <div className="font-medium">
                {mapsById[p.map || p.map_id] || `Map ${p.map || p.map_id}`}
              </div>
              <div className="text-gray-400">
                {modeById[p.mode || p.mode_id] || "Slayer"}
              </div>
            </div>
          ))}
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

      {/* Debug footer */}
      <div className="text-xs text-gray-500 space-y-1">
        <div>DEBUG: Bans: {bans.length}, Picks: {picks.length}</div>
        <div>DEBUG: State: {series.state}</div>
        <div>DEBUG: Turn: {JSON.stringify(turn)}</div>
      </div>
    </div>
  );
}
