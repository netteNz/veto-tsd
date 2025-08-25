import { useEffect, useState } from "react";
import { getGroupedCombos, getAllMaps } from "../lib/api";
import AvailableCombos from "./AvailableCombos";

// Import the API_BASE from the centralized api.js file
const API_BASE = "http://localhost:8000/api";

export default function SeriesLayout({ series, onSuccess }) {
  const [maps, setMaps] = useState({});
  const [modes, setModes] = useState({});
  const [groupedCombos, setGroupedCombos] = useState({});
  const [mapsList, setMapsList] = useState([]);
  const [openPickGame, setOpenPickGame] = useState(null);
  const [loadingPick, setLoadingPick] = useState(false);
  const [pickError, setPickError] = useState("");

  // Add debugging to see what the series object contains
  console.log("[DEBUG] Series object:", series);
  console.log("[DEBUG] Series actions:", series.actions);
  console.log("[DEBUG] All series keys:", Object.keys(series));

  // Fetch map and mode details for display
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        // Get all maps and modes for reference
        const [mapsDataList, combosData, modesRes] = await Promise.all([
          getAllMaps(),
          getGroupedCombos(),
          fetch(`${API_BASE}/gamemodes/`)
        ]);
        const mapsData = { results: mapsDataList };
        const combosDataJson = combosData;
        const modesData = await modesRes.json();

        // Create lookup objects
        const mapLookup = {};
        const modeLookup = {};

        mapsData.results?.forEach(map => {
          mapLookup[map.id] = map.name;
        });

        modesData.results?.forEach(mode => {
          modeLookup[mode.id] = mode.name;
        });

        setMaps(mapLookup);
        setModes(modeLookup);
        setGroupedCombos(combosDataJson || {});
        setMapsList(mapsData.results || []);
      } catch (err) {
        console.error("Failed to fetch map/mode details:", err);
      }
    };

    fetchDetails();
  }, []);

  // Try different ways to access the ban data
  const bans = series.actions?.filter(action => action.action_type === "BAN") || 
              series.bans || 
              series.seriesban_set || 
              [];
              
  const picks = series.actions?.filter(action => action.action_type === "PICK") || 
               series.picks || 
               series.seriesround_set || 
               [];

  console.log("[DEBUG] Extracted bans:", bans);
  console.log("[DEBUG] Extracted picks:", picks);

  // Group bans by type
  const objectiveBans = bans.filter(ban => {
    // Handle different possible data structures
    const modeId = ban.mode || ban.mode_id;
    const modeName = modes[modeId];
    return modeName && modeName !== "Slayer";
  });

  const slayerBans = bans.filter(ban => {
    const modeId = ban.mode || ban.mode_id;
    const modeName = modes[modeId];
    return modeName === "Slayer" || !modeId; // Slayer bans might not have mode
  });

  console.log("[DEBUG] Objective bans:", objectiveBans);
  console.log("[DEBUG] Slayer bans:", slayerBans);

  // Determine series format - TSD is always Bo7
  const format = "Bo7";

  // TSD game structure
  const gameStructure = [
    { game: 1, type: "Objective", picker: "B" },
    { game: 2, type: "Slayer", picker: "A" },
    { game: 3, type: "Objective", picker: "B" },
    { game: 4, type: "Objective", picker: "A" },
    { game: 5, type: "Slayer", picker: "B" },
    { game: 6, type: "Objective", picker: "A" },
    { game: 7, type: "Slayer", picker: "B" }
  ];

  return (
    <div className="bg-gray-800 text-white p-6 mt-4 rounded space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Series Layout - {format}</h2>
        <div className="text-sm text-gray-300">
          {series.team_a} vs {series.team_b}
        </div>
      </div>

      {/* Bans Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-700 p-4 rounded">
          <h3 className="text-lg font-semibold mb-3 text-red-400">Objective Bans ({objectiveBans.length})</h3>
          <div className="space-y-2">
            {objectiveBans.map((ban, index) => {
              const mapId = ban.map || ban.map_id;
              const modeId = ban.mode || ban.mode_id;
              return (
                <div key={ban.id || index} className="flex justify-between text-sm">
                  <span>{maps[mapId] || `Map ${mapId}`}</span>
                  <span className="text-gray-400">
                    {modes[modeId] || `Mode ${modeId}`} - Team {ban.team}
                  </span>
                </div>
              );
            })}
            {objectiveBans.length === 0 && (
              <div className="text-gray-400 text-sm">No objective bans yet</div>
            )}
          </div>
        </div>

        <div className="bg-gray-700 p-4 rounded">
          <h3 className="text-lg font-semibold mb-3 text-red-400">Slayer Bans ({slayerBans.length})</h3>
          <div className="space-y-2">
            {slayerBans.map((ban, index) => {
              const mapId = ban.map || ban.map_id;
              return (
                <div key={ban.id || index} className="flex justify-between text-sm">
                  <span>{maps[mapId] || `Map ${mapId}`}</span>
                  <span className="text-gray-400">Team {ban.team}</span>
                </div>
              );
            })}
            {slayerBans.length === 0 && (
              <div className="text-gray-400 text-sm">No slayer bans yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Game Layout */}
      <div className="bg-gray-700 p-4 rounded">
        <h3 className="text-lg font-semibold mb-4 text-green-400">Game Layout</h3>
        <div className="grid grid-cols-1 gap-3">
          {gameStructure.map(game => {
            const gamePick = picks.find(pick => pick.step === game.game || pick.round === game.game);
            const pickerTeam = game.picker === "A" ? series.team_a : series.team_b;

            // Helpers to compute available options
            const isObjective = game.type === "Objective";

            const availableObjectiveCombos = Object.entries(groupedCombos || {}).reduce((acc, [modeName, combos]) => {
              const filtered = combos.filter(c => {
                // exclude combos that were banned
                const wasBanned = bans.some(b => (b.map || b.map_id) === c.map_id && (b.mode || b.mode_id) === c.mode_id);
                // exclude combos that were already picked
                const wasPicked = picks.some(p => (p.map || p.map_id) === c.map_id && (p.mode || p.mode_id) === c.mode_id);
                return !wasBanned && !wasPicked;
              });
              if (filtered.length) acc[modeName] = filtered;
              return acc;
            }, {});

            const availableSlayerMaps = mapsList.filter(m => {
              const supportsSlayer = m.modes?.some(md => md.name === "Slayer");
              const wasBanned = slayerBans.some(b => (b.map || b.map_id) === m.id);
              const wasPicked = picks.some(p => (p.map || p.map_id) === m.id);
              return supportsSlayer && !wasBanned && !wasPicked;
            });

            const handlePick = async (mapId, modeId = null) => {
              setLoadingPick(true);
              setPickError("");
              try {
                const endpoint = isObjective ? "pick_objective_combo" : "pick_slayer_map";

                // normalize team id (game.picker is "A"|"B"; series.team_a/team_b may be id or object)
                const rawTeam = game.picker === "A" ? series.team_a : series.team_b;
                const teamValue = typeof rawTeam === "object"
                  ? (rawTeam.id ?? rawTeam.pk ?? rawTeam)
                  : rawTeam;

                const mapVal = mapId != null ? parseInt(mapId, 10) : NaN;
                const modeVal = modeId != null ? parseInt(modeId, 10) : NaN;

                if (!teamValue || Number.isNaN(mapVal) || (isObjective && Number.isNaN(modeVal))) {
                  const missing = [
                    !teamValue && "team",
                    Number.isNaN(mapVal) && "map",
                    isObjective && Number.isNaN(modeVal) && "mode"
                  ].filter(Boolean).join(", ");
                  throw new Error(`${missing} ${missing.includes(",") ? "are" : "is"} required`);
                }

                const body = isObjective
                  ? { team: parseInt(teamValue, 10), map: mapVal, mode: modeVal }
                  : { team: parseInt(teamValue, 10), map: mapVal };

                console.debug("SeriesLayout pick payload:", body, "endpoint:", endpoint);
 
                 const res = await fetch(`${API_BASE}/series/${series.id}/${endpoint}/`, {
                   method: "POST",
                   headers: { "Content-Type": "application/json" },
                   body: JSON.stringify(body)
                 });
 
                 if (!res.ok) {
                   const err = await res.json().catch(() => ({}));
                   throw new Error(err.detail || "Failed to pick map");
                 }
 
                 setOpenPickGame(null);
                 onSuccess?.();
               } catch (err) {
                 console.error("Pick failed:", err);
                 setPickError(err.message || "Pick failed");
               } finally {
                 setLoadingPick(false);
               }
             };

            return (
              <div key={game.game} className="flex flex-col bg-gray-800 p-3 rounded space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="font-semibold text-blue-400">Game {game.game}</span>
                    <span className="text-gray-300">({game.type})</span>
                  </div>

                  <div className="flex items-center space-x-4">
                    {gamePick ? (
                      <div className="text-green-400">
                        <span className="font-medium">
                          {maps[gamePick.map || gamePick.map_id]}
                        </span>
                        <span className="text-gray-400 ml-2">
                          ({modes[gamePick.mode || gamePick.mode_id]})
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setOpenPickGame(openPickGame === game.game ? null : game.game)}
                          className="bg-gray-600 px-3 py-1 rounded text-sm"
                        >
                          Pick ({pickerTeam})
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded picker panel */}
                {openPickGame === game.game && (
                  <div className="p-4 bg-slate-800 rounded mt-3">
                    <div className="text-sm text-gray-300 mb-2">Select an available map / combo for this pick:</div>

                    <AvailableCombos
                      series={series}
                      groupedCombos={groupedCombos}
                      mapsList={mapsList}
                      gameType={game.type}
                      loading={loadingPick}
                      onPick={async (mapId, modeId) => {
                        // prefer existing handlePick if it's defined in this component
                        try {
                          setPickError("");
                          setLoadingPick(true);

                          if (typeof handlePick === "function") {
                            // handlePick(mapId, modeId) is expected to post and call onSuccess
                            await handlePick(mapId, modeId);
                          } else {
                            // defensive fallback: log payload for debugging
                            console.debug("Pick requested (no handlePick):", { seriesId: series.id, game, mapId, modeId });
                          }

                          setOpenPickGame(null);
                          onSuccess?.();
                        } catch (err) {
                          console.error("Pick failed from AvailableCombos:", err);
                          setPickError(err?.message || "Pick failed");
                        } finally {
                          setLoadingPick(false);
                        }
                      }}
                    />

                    {pickError && (
                      <div className="mt-2 text-red-400 text-sm">
                        {pickError}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Enhanced Debug Info */}
      <div className="text-xs text-gray-500 space-y-1">
        <div>DEBUG: Total Bans: {bans.length}, Picks: {picks.length}</div>
        <div>DEBUG: State: {series.state}</div>
        <div>DEBUG: Format: {format}</div>
        <div>DEBUG: Available series properties: {Object.keys(series).join(', ')}</div>
      </div>
    </div>
  );
}