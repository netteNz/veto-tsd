/**
 * Utility functions for processing bans and picks in a consistent way
 */

/**
 * Extract map ID from various object structures
 */
export const getMapId = (x) =>
  x?.map_id || x?.map?.id || x?.map || x?.id || x?.pk || null;

/**
 * Extract mode ID from various object structures
 */
export const getModeId = (x) => 
  x?.mode_id || x?.mode?.id || x?.mode || null;

/**
 * Extract mode name consistently
 */
export const getModeName = (x) => {
  if (!x) return "";
  if (typeof x === "string") return x;
  return x.name || x.mode || "";
};

/**
 * Check if a mode is Slayer
 */
export const isSlayerMode = (modeVal) => {
  if (!modeVal) return false;
  
  // If it's a direct "SLAYER_MAP" kind, it's definitely Slayer
  if (modeVal === "SLAYER_MAP" || 
      (typeof modeVal === "object" && modeVal.kind === "SLAYER_MAP")) {
    return true;
  }
  
  // Check string values
  if (typeof modeVal === "string") {
    return modeVal.toLowerCase() === "slayer" || modeVal.toLowerCase().includes("slayer");
  }
  
  // Check name property
  const name = modeVal.name || modeVal.mode_name || modeVal.mode || "";
  return name.toLowerCase() === "slayer" || name.toLowerCase().includes("slayer");
};

/**
 * Process bans and picks from series actions
 * Returns consistent data structures for use across components
 */
export function processBansAndPicks(actions) {
  const bans = actions?.filter(a => a.action_type === "BAN") || [];
  const picks = actions?.filter(a => a.action_type === "PICK") || [];

  const bannedCombinations = new Set();
  const slayerBannedMapIds = new Set();
  const pickedMapIds = new Set();
  const pickedCombinations = new Set();
  const slayerPickedMapIds = new Set();
  const objectivePickedMapIds = new Set();

  // Process bans with BETTER Slayer detection
  for (const ban of bans) {
    const mapId = Number(getMapId(ban));
    if (!mapId) continue;
    
    console.log(`[DEBUG] Processing ban:`, ban);
    
    // ENHANCED: Check for Slayer bans more thoroughly
    const isSlayerBan = 
      ban.kind === "SLAYER_MAP" ||
      ban.ban_type === "SLAYER_MAP" ||
      (ban.mode_id === 6) ||
      (ban.mode === "Slayer") ||
      (ban.mode_name === "Slayer") ||
      (typeof ban.mode === 'string' && ban.mode.toLowerCase() === "slayer") ||
      (typeof ban.mode_name === 'string' && ban.mode_name.toLowerCase() === "slayer") ||
      // NEW: If no mode info at all, and we can determine from context it's slayer
      (!ban.mode_id && !ban.mode && !ban.mode_name && ban.map_id);
    
    console.log(`[DEBUG] Map ${ban.map} (ID: ${mapId}) - isSlayerBan: ${isSlayerBan}`);
    
    if (isSlayerBan) {
      slayerBannedMapIds.add(mapId);
      console.log(`[DEBUG] Added to slayer banned: ${mapId}`);
    } else {
      const modeId = Number(getModeId(ban));
      if (modeId) {
        bannedCombinations.add(`${mapId}:${modeId}`);
        console.log(`[DEBUG] Added to objective banned: ${mapId}:${modeId}`);
      }
    }
  }
  
  // Process picks with STRICTER classification
  for (const pick of picks) {
    const mapId = Number(getMapId(pick));
    if (!mapId) continue;

    pickedMapIds.add(mapId);

    const modeId = Number(getModeId(pick));
    if (modeId) {
      pickedCombinations.add(`${mapId}:${modeId}`);
    }

    // SIMPLIFIED: Use kind field first for picks too
    const isSlayerPick = 
      pick.kind === "SLAYER_MAP" ||
      (pick.mode_id === 6) ||
      (typeof pick.mode === 'string' && pick.mode.toLowerCase() === "slayer") ||
      (typeof pick.mode_name === 'string' && pick.mode_name.toLowerCase() === "slayer");

    if (isSlayerPick) {
      slayerPickedMapIds.add(mapId);
      console.log(`[DEBUG] Classified as SLAYER pick: ${pick.map}`);
    } else {
      objectivePickedMapIds.add(mapId);
      console.log(`[DEBUG] Classified as OBJECTIVE pick: ${pick.map} + ${pick.mode || pick.mode_name}`);
    }
  }
  
  console.log("DEBUG - Final slayer banned map IDs:", Array.from(slayerBannedMapIds));
  
  return {
    bannedCombinations,
    slayerBannedMapIds,
    pickedMapIds,           
    pickedCombinations,
    slayerPickedMapIds,
    objectivePickedMapIds,
  };
}

/**
 * Check if a specific map+mode combination is banned
 */
export function isComboBanned(mapId, modeId, banData) {
  const { bannedCombinations, slayerBannedMapIds } = banData;
  
  // For Slayer, just check if the map is banned for Slayer
  if (isSlayerMode({ mode: modeId })) {
    return slayerBannedMapIds.has(Number(mapId));
  }
  
  // For other modes, check the specific combination
  return bannedCombinations.has(`${Number(mapId)}:${Number(modeId)}`);
}

/**
 * Check if a map is picked (unavailable for any mode)
 */
export function isMapPicked(mapId, pickData) {
  return pickData.pickedMapIds.has(Number(mapId));
}