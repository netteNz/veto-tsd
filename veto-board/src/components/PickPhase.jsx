import { useState, useEffect } from "react";
import { getGroupedCombos, getAllMaps, API_BASE } from "../lib/api";


export default function PickPhase({ series, onSuccess }) {
  const [maps, setMaps] = useState([]);
  const [modes, setModes] = useState({});
  const [groupedCombos, setGroupedCombos] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [mapsData, combosData, modesRes] = await Promise.all([
        getAllMaps(),
        getGroupedCombos(),
        fetch(`${API_BASE}/gamemodes/`)
      ]);

      const modesData = await modesRes.json();
      
      setMaps(mapsData);
      setGroupedCombos(combosData);
      
      // Create modes lookup
      const modeLookup = {};
      modesData.results?.forEach(mode => {
        modeLookup[mode.id] = mode;
      });
      setModes(modeLookup);
    } catch (err) {
      console.error("Failed to load pick data:", err);
      setError("Failed to load maps and modes");
    }
  };

  // Game structure for TSD Bo7
  const gameStructure = [
    { game: 1, type: "Objective", picker: "A" },
    { game: 2, type: "Slayer", picker: "B" },
    { game: 3, type: "Objective", picker: "A" },
    { game: 4, type: "Objective", picker: "B" },
    { game: 5, type: "Slayer", picker: "A" },
    { game: 6, type: "Objective", picker: "B" },
    { game: 7, type: "Slayer", picker: "A" }
  ];

  // Find current game to pick
  const currentGame = gameStructure.find(g => {
    const existingPick = series.actions?.find(action => 
      action.action_type === "PICK" && action.game === g.game
    );
    return !existingPick;
  });

  console.debug("Current game to pick:", currentGame);
  console.debug("Series team assignments:", { team_a: series.team_a, team_b: series.team_b });
  console.debug("All series actions:", series.actions);

  if (!currentGame) {
    return <div className="text-white">All games have been picked!</div>;
  }

  const isObjectiveGame = currentGame.type === "Objective";
  const pickerTeam = currentGame.picker === "A" ? series.team_a : series.team_b;
  console.debug("Picker team calculation:", { 
    gamePicker: currentGame.picker, 
    pickerTeam,
    shouldPickTeamA: currentGame.picker === "A",
    actualTeamA: series.team_a,
    actualTeamB: series.team_b
   });

  const handlePick = async (mapId, modeId = null) => {
    console.debug("handlePick called with raw:", { mapId, modeId });
    setLoading(true);
    setError("");

    try {
      const endpoint = isObjectiveGame ? "pick_objective_combo" : "pick_slayer_map";

      // validate map and mode for objective picks FIRST
      const mapVal = mapId != null ? parseInt(mapId, 10) : NaN;
      const modeVal = modeId != null ? parseInt(modeId, 10) : NaN;

      // Use the picker letter directly since API expects "A" or "B", not team IDs
      const teamValue = currentGame.picker; // "A" or "B"
      console.debug("Sending pick request:", {
        currentGame,
        teamValue,
        expectedPicker: currentGame.picker,
        body: isObjectiveGame 
          ? { team: teamValue, map: mapVal, mode: modeVal }
          : { team: teamValue, map: mapVal }
      });

      if (!teamValue || Number.isNaN(mapVal) || (isObjectiveGame && Number.isNaN(modeVal))) {
        const missing = [
          !teamValue && "team",
          Number.isNaN(mapVal) && "map",
          isObjectiveGame && Number.isNaN(modeVal) && "mode"
        ].filter(Boolean).join(", ");
        throw new Error(`${missing} ${missing.includes(",") ? "are" : "is"} required`);
      }

      const body = isObjectiveGame 
        ? { team: teamValue, map: mapVal, mode: modeVal }
        : { team: teamValue, map: mapVal };
      
      console.debug("Picking payload:", body, "endpoint:", endpoint);

      const res = await fetch(`${API_BASE}/series/${series.id}/${endpoint}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to pick map`);
      }

      onSuccess && onSuccess();
    } catch (err) {
      console.error("Pick failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // normalization helpers
  const pickObjective = (combo, modeId) => {
    console.debug("pickObjective raw combo:", combo);
    console.debug("pickObjective combo keys:", Object.keys(combo || {}));
    const mapVal = combo.map_id ?? combo.map?.id ?? combo.map;
    const modeVal = modeId; // pass mode ID from parent
    console.debug("pickObjective normalized:", { mapVal, modeVal, combo });
    handlePick(mapVal, modeVal);
  };

  const pickSlayer = (m) => {
    const mapVal = m.id ?? m.pk ?? m.map_id ?? m;
    console.debug("pickSlayer normalized:", { mapVal, m });
    handlePick(mapVal);
  };
  
  // Get available maps based on game type
  const getAvailableMaps = () => {
    if (isObjectiveGame) {
      // For objective games, show grouped combos
      return groupedCombos.objective || [];
    } else {
      // For slayer games, show just slayer-compatible maps
      // Use slayer combos from API or fallback to filtered maps
      if (groupedCombos.slayer && groupedCombos.slayer.length > 0) {
        return groupedCombos.slayer[0]?.combos || [];
      }
      return maps.filter(map => 
        map.modes?.some(mode => mode.name === "Slayer")
      );
    }
  };

  const availableMaps = getAvailableMaps();

  return (
    <div className="bg-gray-800 text-white p-6 rounded space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-blue-400">
          Game {currentGame.game} Pick - {currentGame.type}
        </h3>
        <div className="text-sm text-gray-300">
          {pickerTeam} to pick
        </div>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {isObjectiveGame ? (
        // Objective game picker - show mode/map combos
        <div className="space-y-4">
          <p className="text-gray-300">Select an objective mode/map combination:</p>
          {availableMaps.map((modeGroup) => (
            <div key={modeGroup.mode_id} className="bg-gray-700 p-4 rounded">
              <h4 className="font-semibold text-yellow-400 mb-3">{modeGroup.mode}</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {modeGroup.combos.map(combo => (
                  <button
                    key={`${modeGroup.mode_id}_${combo.map_id}`}
                    onClick={() => pickObjective(combo, modeGroup.mode_id)}
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
      ) : (
        // Slayer game picker - show just maps
        <div className="space-y-4">
          <p className="text-gray-300">Select a slayer map:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {availableMaps.map(map => (
              <button
                key={map.map_id ?? map.id ?? map.pk}
                onClick={() => pickSlayer(map)}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-4 py-3 rounded transition-colors"
              >
                {map.map ?? map.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center text-gray-400">
          Making pick...
        </div>
      )}
    </div>
  );
}