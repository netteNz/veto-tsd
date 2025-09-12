/**
 * Utility functions for processing bans and picks in a consistent way
 */

export const getMapId = (x) =>
  x?.map_id || x?.map?.id || x?.map || x?.id || x?.pk || null;

export const getModeId = (x) =>
  // prefer explicit objective_mode fields, then generic mode fields
  x?.objective_mode_id ||
  x?.objective_mode ||
  x?.mode_id ||
  x?.mode?.id ||
  x?.mode ||
  x?.modeId ||
  null;

export const getModeName = (x) => {
  if (!x) return "";
  if (typeof x === "string") return x;
  return x.name || x.mode || "";
};

export const isSlayerMode = (modeVal) => {
  if (modeVal == null) return false;
  // Prefer numeric mode id if available (mode.id, mode_id, or raw value)
  const parsed = Number(modeVal?.id ?? modeVal?.mode_id ?? modeVal);
  if (!isNaN(parsed) && parsed === 6) return true;
  // Fallback: only treat explicit string mentions of "slayer" as Slayer
  if (typeof modeVal === "string") {
    const s = modeVal.toLowerCase();
    return s === "slayer" || s.includes("slayer");
  }
  // If object has a name-like property, check it safely
  const name = (typeof modeVal?.name === "string" && modeVal.name) ||
               (typeof modeVal?.mode_name === "string" && modeVal.mode_name) ||
               "";
  return name.toLowerCase().includes("slayer");
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
    
    // Determine mode id using helper, then decide if this is a Slayer ban.
    const banModeId = Number(getModeId(ban));

    // If kind explicitly indicates objective, trust it and never treat as Slayer.
    const kindStr = typeof ban.kind === "string" ? ban.kind.toUpperCase() : "";
    const isObjectiveKind = kindStr.includes("OBJECTIVE");
    // Only treat numeric modeId === 6 as Slayer when kind is absent/ambiguous
    const isSlayerBan = ban.kind === "SLAYER_MAP" || (!isObjectiveKind && banModeId === 6);
    if (banModeId === 6 && isObjectiveKind) {
      console.warn(`[WARN] Ban has mode=6 but kind=${ban.kind}; treating as OBJECTIVE_COMBO (defensive)`, ban);
    }
     
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
 
    const pickModeId = Number(getModeId(pick));
    const pickKindStr = typeof pick.kind === "string" ? pick.kind.toUpperCase() : "";
    const pickIsObjectiveKind = pickKindStr.includes("OBJECTIVE");
    const isSlayerPick = pick.kind === "SLAYER_MAP" || (!pickIsObjectiveKind && pickModeId === 6);
    if (pickModeId === 6 && pickIsObjectiveKind) {
      console.warn(`[WARN] Pick has mode=6 but kind=${pick.kind}; treating as OBJECTIVE (defensive)`, pick);
    }
 
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