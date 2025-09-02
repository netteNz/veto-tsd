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
  
  // Process bans with improved Slayer detection
  for (const ban of bans) {
    const mapId = Number(getMapId(ban));
    if (!mapId) continue;
    
    // Enhanced check for Slayer bans
    if (
      // Check if the ban's kind is SLAYER_MAP
      ban.kind === "SLAYER_MAP" || 
      // Check if mode is Slayer
      isSlayerMode(ban.mode) || 
      // Check mode_name
      isSlayerMode(ban.mode_name) ||
      // Check if this is a ban without a mode_id (likely a Slayer ban)
      (!getModeId(ban) && ban.action_type === "BAN")
    ) {
      slayerBannedMapIds.add(mapId);
    }
    // Otherwise track as an objective ban with mode
    else {
      const modeId = Number(getModeId(ban));
      if (modeId) {
        bannedCombinations.add(`${mapId}:${modeId}`);
      }
    }
  }
  
  // Process picks (unchanged)
  for (const pick of picks) {
    const mapId = Number(getMapId(pick));
    if (!mapId) continue;
    
    pickedMapIds.add(mapId);
    
    const modeId = Number(getModeId(pick));
    if (modeId) {
      pickedCombinations.add(`${mapId}:${modeId}`);
    }
  }
  
  return {
    bannedCombinations,
    slayerBannedMapIds,
    pickedMapIds,
    pickedCombinations
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