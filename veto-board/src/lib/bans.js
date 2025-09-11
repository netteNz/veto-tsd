/**
 * Utility functions for processing bans and picks in a consistent way
 */

export const getMapId = (x) =>
  x?.map_id || x?.map?.id || x?.map || x?.id || x?.pk || null;

export const getModeId = (x) => 
  x?.mode_id || x?.mode?.id || x?.mode || null;

export const getModeName = (x) => {
  if (!x) return "";
  if (typeof x === "string") return x;
  return x.name || x.mode || "";
};

export const isSlayerMode = (modeVal) => {
  if (!modeVal) return false;
  
  // Check for mode ID 6 (Slayer)
  if (modeVal === 6 || modeVal === "6") return true;
  
  // Check string values
  if (typeof modeVal === "string") {
    return modeVal.toLowerCase() === "slayer" || modeVal.toLowerCase().includes("slayer");
  }
  
  // Check name property
  const name = modeVal.name || modeVal.mode_name || modeVal.mode || "";
  return name.toLowerCase() === "slayer" || name.toLowerCase().includes("slayer");
};

export function processBansAndPicks(actions) {
  const bans = actions?.filter(a => a.action_type === "BAN") || [];
  const picks = actions?.filter(a => a.action_type === "PICK") || [];

  const bannedCombinations = new Set();
  const slayerBannedMapIds = new Set();
  const pickedMapIds = new Set();
  const pickedCombinations = new Set();
  const slayerPickedMapIds = new Set();
  const objectivePickedMapIds = new Set();

  // Process bans - FIXED: Rely primarily on 'kind' field
  for (const ban of bans) {
    const mapId = Number(getMapId(ban));
    if (!mapId) continue;
    
    console.log(`[DEBUG] Processing ban:`, ban);
    
    // FIXED: Prioritize 'kind' field, then fallback to mode checks
    const isSlayerBan = 
      ban.kind === "SLAYER_MAP" ||
      (ban.mode_id === 6) ||
      (ban.mode === "Slayer") ||
      (ban.mode_name === "Slayer") ||
      isSlayerMode(ban.mode) ||
      isSlayerMode(ban.mode_name);
    
    console.log(`[DEBUG] Map ${ban.map} (ID: ${mapId}) - kind: ${ban.kind}, isSlayerBan: ${isSlayerBan}`);
    
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
  
  // Process picks
  for (const pick of picks) {
    const mapId = Number(getMapId(pick));
    if (!mapId) continue;

    pickedMapIds.add(mapId);

    const modeId = Number(getModeId(pick));
    if (modeId) {
      pickedCombinations.add(`${mapId}:${modeId}`);
    }

    const isSlayerPick = 
      pick.kind === "SLAYER_MAP" ||
      pick.slot_type === "SLAYER" ||
      (pick.mode_id === 6) ||
      isSlayerMode(pick.mode) ||
      isSlayerMode(pick.mode_name);

    if (isSlayerPick) {
      slayerPickedMapIds.add(mapId);
      console.log(`[DEBUG] Classified as SLAYER pick: ${pick.map}`);
    } else {
      objectivePickedMapIds.add(mapId);
      console.log(`[DEBUG] Classified as OBJECTIVE pick: ${pick.map}`);
    }
  }
  
  console.log("DEBUG - Final slayer banned map IDs:", Array.from(slayerBannedMapIds));
  console.log("DEBUG - Final objective banned combinations:", Array.from(bannedCombinations));
  
  return {
    bannedCombinations,
    slayerBannedMapIds,
    pickedMapIds,           
    pickedCombinations,
    slayerPickedMapIds,
    objectivePickedMapIds,
  };
}

// FIXED: Correct helper functions
export function isComboBanned(mapId, modeId, banData) {
  const { bannedCombinations, slayerBannedMapIds } = banData;
  const numMapId = Number(mapId);
  const numModeId = Number(modeId);
  
  // For Slayer (mode ID 6), check slayer banned maps
  if (numModeId === 6 || isSlayerMode(modeId)) {
    return slayerBannedMapIds.has(numMapId);
  }
  
  // For other modes, check specific combination
  return bannedCombinations.has(`${numMapId}:${numModeId}`);
}

export function isComboPicked(mapId, modeId, pickData) {
  const { pickedCombinations, slayerPickedMapIds } = pickData;
  const numMapId = Number(mapId);
  const numModeId = Number(modeId);
  
  // For Slayer, check if map was used in any Slayer round
  if (numModeId === 6 || isSlayerMode(modeId)) {
    return slayerPickedMapIds.has(numMapId);
  }
  
  // For objectives, check exact combination
  return pickedCombinations.has(`${numMapId}:${numModeId}`);
}

export function isMapModeAvailable(mapId, modeId, banData, pickData) {
  return !isComboBanned(mapId, modeId, banData) && !isComboPicked(mapId, modeId, pickData);
}