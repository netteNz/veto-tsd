import { useEffect, useState } from "react";
import { getGroupedCombos, postVeto } from "../lib/api";

export default function BanPhase({ series, onSuccess }) {
  const [combos, setCombos] = useState({ objective: [], slayer: [] });
  const [selectedMap, setSelectedMap] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [error, setError] = useState("");

  const currentTeam = series.turn?.team; // "A" or "B"
  const kind = series.turn?.kind; // "OBJECTIVE_COMBO" or "SLAYER_MAP"

  useEffect(() => {
    getGroupedCombos().then(setCombos);
  }, []);

  const handleSubmit = async () => {
    setError("");

    try {
      const res = await postVeto(series.id, currentTeam === "A" ? series.team_a : series.team_b, selectedMap, selectedMode);
      console.log("[DEBUG] veto posted:", res);
      onSuccess(); // reload series
    } catch (err) {
      setError("Ban failed. Invalid selection?");
    }
  };

  const available = kind === "OBJECTIVE_COMBO" ? combos.objective : combos.slayer;

  return (
    <div className="bg-gray-800 text-white p-4 mt-4 rounded space-y-4">
      <h3 className="font-bold text-lg">Ban Phase</h3>
      <div className="text-sm text-gray-300">
        Turn: <span className="font-semibold">{currentTeam === "A" ? series.team_a : series.team_b}</span> — {kind}
      </div>

      <div className="flex flex-col gap-4">
        <select
          className="bg-gray-900 text-white p-2 rounded"
          onChange={(e) => {
            const [mapId, modeId] = e.target.value.split(",");
            setSelectedMap(Number(mapId));
            setSelectedMode(Number(modeId));
          }}
          defaultValue=""
        >
          <option disabled value="">Select map × mode combo</option>
          {available.map((group) => (
            <optgroup key={group.mode_id} label={group.mode}>
              {group.combos.map((combo) => (
                <option key={combo.map_id} value={`${combo.map_id},${group.mode_id}`}>
                  {combo.map}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        <button
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white disabled:opacity-50"
          disabled={!selectedMap || !selectedMode}
          onClick={handleSubmit}
        >
          Confirm Ban
        </button>

        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>
    </div>
  );
}
