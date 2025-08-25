import { useState, useEffect } from "react";
import { getGroupedCombos, getAllMaps } from "../lib/api";

const API_BASE = "http://localhost:8000/api";

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
    { game: 1, type: "Objective", picker: "B" },
    { game: 2, type: "Slayer", picker: "A" },
    { game: 3, type: "Objective", picker: "B" },
    { game: 4, type: "Objective", picker: "A" },
    { game: 5, type: "Slayer", picker: "B" },
    { game: 6, type: "Objective", picker: "A" },
    { game: 7, type: "Slayer", picker: "B" }
  ];

  // Find current game to pick
  const currentGame = gameStructure.find(game => {
    const existingPick = series.actions?.find(action => 
      action.action_type === "PICK" && action.step === game.game
    );
    return !existingPick;
  });

  if (!currentGame) {
    return (
      <div className="bg-gray-800 text-white p-6 rounded">
        <h3 className="text-lg font-semibold text-green-400">All Games Picked!</h3>
        <p className="text-gray-300">The series is ready to begin.</p>
      </div>
    );
  }

  const pickerTeam = currentGame.picker === "A" ? series.team_a : series.team_b;
  const isObjectiveGame = currentGame.type === "Objective";

  const handlePick = async (mapId, modeId = null) => {
    setLoading(true);
    setError("");

    try {
      const endpoint = isObjectiveGame ? "pick_objective_combo" : "pick_slayer_map";
      const body = isObjectiveGame 
        ? { team: currentGame.picker, map: parseInt(mapId), mode: parseInt(modeId) }
        : { team: currentGame.picker, map: parseInt(mapId) };

      const res = await fetch(`${API_BASE}/series/${series.id}/${endpoint}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to pick map`);
      }

      onSuccess();
    } catch (err) {
      console.error("Pick failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get available maps based on game type
  const getAvailableMaps = () => {
    if (isObjectiveGame) {
      // For objective games, show grouped combos
      return groupedCombos;
    } else {
      // For slayer games, show just slayer-compatible maps
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
          {Object.entries(availableMaps).map(([modeName, mapList]) => (
            <div key={modeName} className="bg-gray-700 p-4 rounded">
              <h4 className="font-semibold text-yellow-400 mb-3">{modeName}</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {mapList.map(combo => (
                  <button
                    key={`${combo.mode_id}_${combo.map_id}`}
                    onClick={() => handlePick(combo.map_id, combo.mode_id)}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-3 py-2 rounded text-sm transition-colors"
                  >
                    {combo.map_name}
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
                key={map.id}
                onClick={() => handlePick(map.id)}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-4 py-3 rounded transition-colors"
              >
                {map.name}
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