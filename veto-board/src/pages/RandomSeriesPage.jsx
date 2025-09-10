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
      "Solitude", "Fortress", "Origin", "Lattice"
    ];
    
    const objectiveModes = [
      { id: 1, name: "Capture the Flag" },
      { id: 2, name: "Strongholds" },
      { id: 3, name: "Oddball" },
      { id: 4, name: "King of the Hill" },
      { id: 5, name: "Neutral Bomb" }
    ];
    
    const slayerMode = { id: 6, name: "Slayer" };
    
    // Determine series parameters based on series type
    let totalGames;
    let gamePattern = []; // true = objective, false = slayer
    
    if (seriesType === "Bo3") {
      totalGames = 3;
      gamePattern = [true, false, true]; // Objective, Slayer, Objective
    } else if (seriesType === "Bo5") {
      totalGames = 5;
      gamePattern = [true, false, true, true, false]; // Obj, Slayer, Obj, Obj, Slayer
    } else { // Bo7
      totalGames = 7;
      // Pattern needs to be: obj, slayer, obj, obj, slayer, obj, slayer
      gamePattern = [true, false, true, true, false, true, false];  
    }
    
    const totalBans = seriesType === "Bo7" ? 7 : seriesType === "Bo5" ? 5 : 3;
    const objectiveBans = seriesType === "Bo7" ? 5 : seriesType === "Bo5" ? 3 : 2;
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
        kind: "OBJECTIVE_COMBO", // Add this explicit kind
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
    
    // Generate picks following the specific pattern
    const pickedMaps = new Set();
    
    for (let i = 0; i < totalGames; i++) {
      const isObjective = gamePattern[i]; // Get from pattern instead of alternating
      console.log(`Game ${i+1}: ${isObjective ? "Objective" : "Slayer"}`);
      
      let mapName;
      let attempts = 0;
      do {
        mapName = maps[Math.floor(Math.random() * maps.length)];
        attempts++;
        if (attempts > 100) break;
      } while (pickedMaps.has(mapName));
      
      pickedMaps.add(mapName);
      
      if (isObjective) {
        // For objective games, select a random objective mode
        const mode = objectiveModes[Math.floor(Math.random() * objectiveModes.length)];
        
        actions.push({
          id: totalBans + i + 1,
          action_type: "PICK",
          map: mapName,
          map_id: maps.indexOf(mapName) + 1,
          mode: mode.name,
          mode_id: mode.id,
          mode_name: mode.name,
          team: i % 2 === 0 ? "A" : "B",
          kind: "OBJECTIVE_COMBO"  // Add explicit kind for objective
        });
      } else {
        // For slayer games
        actions.push({
          id: totalBans + i + 1,
          action_type: "PICK",
          map: mapName,
          map_id: maps.indexOf(mapName) + 1,
          mode: "Slayer",
          mode_id: slayerMode.id,
          mode_name: "Slayer",
          kind: "SLAYER_MAP",  // Make sure this is set
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
    
    // After generating all actions
    console.log("Generated pattern:", gamePattern);
    console.log("Generated picks:", actions.filter(a => a.action_type === "PICK").map(p => p.kind));
    
    setTimeout(() => {
      setRandomSeries(newSeries);
      setIsLoading(false);
    }, 10);
    
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
          <option value="Bo3">Best of 3</option>
          <option value="Bo5">Best of 5</option>
          <option value="Bo7">Best of 7</option>
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
    </div>
  );
}