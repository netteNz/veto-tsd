import { useState, useCallback, useEffect } from "react";
import SeriesLayout from "../components/SeriesLayout";

export default function RandomSeriesPage() {
  const [seriesType, setSeriesType] = useState("Bo7");
  const [randomSeries, setRandomSeries] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Move generation logic to a callback function
  const generateRandomSeries = useCallback(() => {
    setIsLoading(true);
    
    // Maps and modes to use for random generation
    const maps = [
      "Aquarius", "Live Fire", "Streets", "Recharge", 
      "Catalyst", "Solitude", "Fortress", "Origin", "Lattice"
    ];
    
    const objectiveModes = [
      { id: 1, name: "Capture the Flag" },
      { id: 2, name: "Strongholds" },
      { id: 3, name: "Oddball" },
      { id: 4, name: "King of the Hill" },
      { id: 5, name: "Neutral Bomb" }
    ];
    
    const slayerMode = { id: 6, name: "Slayer" };
    
    // Determine number of bans and picks based on series type
    const totalBans = seriesType === "Bo7" ? 7 : 5;
    const objectiveBans = seriesType === "Bo7" ? 5 : 3;
    const slayerBans = totalBans - objectiveBans;
    
    // Generate bans
    const actions = [];
    const usedMaps = new Set();
    
    // Generate objective bans
    for (let i = 0; i < objectiveBans; i++) {
      let mapName;
      let attempts = 0;
      do {
        mapName = maps[Math.floor(Math.random() * maps.length)];
        attempts++;
        // Safety check to prevent infinite loops
        if (attempts > 100) break;
      } while (usedMaps.has(`${mapName}-objective`));
      
      usedMaps.add(`${mapName}-objective`);
      
      const mode = objectiveModes[Math.floor(Math.random() * objectiveModes.length)];
      
      actions.push({
        id: i + 1,
        action_type: "BAN",
        map: mapName,
        map_id: maps.indexOf(mapName) + 1,
        mode: mode.name,
        mode_id: mode.id,
        mode_name: mode.name,
        team: i % 2 === 0 ? "A" : "B"
      });
    }
    
    // Generate slayer bans
    for (let i = 0; i < slayerBans; i++) {
      let mapName;
      let attempts = 0;
      do {
        mapName = maps[Math.floor(Math.random() * maps.length)];
        attempts++;
        // Safety check to prevent infinite loops
        if (attempts > 100) break;
      } while (usedMaps.has(`${mapName}-slayer`));
      
      usedMaps.add(`${mapName}-slayer`);
      
      actions.push({
        id: objectiveBans + i + 1,
        action_type: "BAN",
        map: mapName,
        map_id: maps.indexOf(mapName) + 1,
        mode: "Slayer",
        mode_id: slayerMode.id,
        mode_name: "Slayer",
        kind: "SLAYER_MAP",
        team: (objectiveBans + i) % 2 === 0 ? "A" : "B"
      });
    }
    
    // Generate picks (maximum 4 to avoid performance issues)
    const totalGames = Math.min(4, seriesType === "Bo7" ? 7 : 5);
    const pickedMaps = new Set();
    
    for (let i = 0; i < totalGames; i++) {
      const isObjective = i % 2 === 0; // Alternate objective and slayer
      
      let mapName;
      let attempts = 0;
      do {
        mapName = maps[Math.floor(Math.random() * maps.length)];
        attempts++;
        // Safety check to prevent infinite loops
        if (attempts > 100) break;
      } while (pickedMaps.has(mapName) || 
              (isObjective && usedMaps.has(`${mapName}-objective`)) ||
              (!isObjective && usedMaps.has(`${mapName}-slayer`)));
      
      pickedMaps.add(mapName);
      
      if (isObjective) {
        const mode = objectiveModes[Math.floor(Math.random() * objectiveModes.length)];
        
        actions.push({
          id: totalBans + i + 1,
          action_type: "PICK",
          map: mapName,
          map_id: maps.indexOf(mapName) + 1,
          mode: mode.name,
          mode_id: mode.id,
          mode_name: mode.name,
          team: i % 2 === 0 ? "A" : "B"
        });
      } else {
        actions.push({
          id: totalBans + i + 1,
          action_type: "PICK",
          map: mapName,
          map_id: maps.indexOf(mapName) + 1,
          mode: "Slayer",
          mode_id: slayerMode.id,
          mode_name: "Slayer",
          kind: "SLAYER_MAP",
          team: i % 2 === 0 ? "A" : "B"
        });
      }
    }
    
    // Create series object
    const newSeries = {
      id: 999,
      actions: actions,
      type: seriesType,
      status: "IN_PROGRESS",
      turn: null,
      team_a: "Team A",
      team_b: "Team B"
    };
    
    setTimeout(() => {
      setRandomSeries(newSeries);
      setIsLoading(false);
    }, 10); // Short timeout to avoid UI freezing
    
    return newSeries;
  }, [seriesType]);
  
  // Generate once on mount
  useEffect(() => {
    generateRandomSeries();
  }, [generateRandomSeries]);
  
  const handleRegenerate = () => {
    generateRandomSeries();
  };
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Random Series Generator</h1>
        <div className="flex space-x-4">
          <button
            onClick={handleRegenerate}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
            disabled={isLoading}
          >
            {isLoading ? "Generating..." : "Regenerate"}
          </button>
        </div>
      </div>
      
      <div className="mb-6 bg-gray-800 p-4 rounded flex items-center space-x-4">
        <label className="text-white">Series Type:</label>
        <select 
          value={seriesType}
          onChange={(e) => setSeriesType(e.target.value)}
          className="bg-gray-700 text-white p-2 rounded"
          disabled={isLoading}
        >
          <option value="Bo7">Best of 7</option>
          <option value="Bo5">Best of 5</option>
        </select>
      </div>
      
      {isLoading ? (
        <div className="bg-gray-800 rounded p-8 text-center">
          <p className="text-xl text-gray-300">Generating random series...</p>
        </div>
      ) : randomSeries ? (
        <div className="bg-gray-800 rounded p-4">
          <SeriesLayout 
            series={randomSeries}
            onSuccess={() => {}} // No-op since this is read-only
          />
        </div>
      ) : null}
      
      {!isLoading && randomSeries && (
        <div className="mt-6 bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-bold text-white mb-3">Debug: Generated Series</h2>
          <pre className="bg-gray-900 p-4 rounded text-green-400 overflow-auto max-h-96">
            {JSON.stringify(randomSeries, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}