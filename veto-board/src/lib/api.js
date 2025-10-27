// Add debugging at the top to see all environment variables
console.log("[DEBUG] Environment mode:", import.meta.env.MODE);
console.log("[DEBUG] All environment variables:", import.meta.env);
console.log("[DEBUG] VITE_API_BASE specifically:", import.meta.env.VITE_API_BASE);

const API_BASE = import.meta.env.VITE_API_BASE || "VITE_API_URL=https://veto-webapp-production.up.railway.app";

console.log("[DEBUG] Final API_BASE value:", API_BASE);

// Export API_BASE so other components can use it
export { API_BASE };

export async function getSeries(id) {
  try {
    const res = await fetch(`${API_BASE}/series/${id}/`);
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(`Series ${id} not found`);
      }
      throw new Error(`Failed to fetch series: ${res.status}`);
    }
    return res.json();
  } catch (err) {
    console.error(`[DEBUG] Get series ${id} failed:`, err);
    throw err;
  }
}

export async function getAllMaps() {
  const res = await fetch(`${API_BASE}/maps/`);
  const data = await res.json();
  console.log("[DEBUG] fetched maps:", data); // check the shape
  return data.results;
}

export async function getSeriesState(id) {
  const res = await fetch(`${API_BASE}/series/${id}/state/`);
  if (!res.ok) throw new Error("Failed to fetch series state");
  return res.json();
}

export async function assignRoles(id, teamA, teamB) {
  const res = await fetch(`${API_BASE}/series/${id}/assign_roles/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ team_a: teamA, team_b: teamB }),
  });
  return res.json();
}

export async function confirmSeriesType(id, type) {
  const res = await fetch(`${API_BASE}/series/${id}/confirm_tsd/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ series_type: type }),
  });
  return res.json();
}

export async function getGroupedCombos() {
  const res = await fetch(`${API_BASE}/maps/combos/grouped/`);
  const data = await res.json();
  return data;
}

export const postVeto = async (seriesId, team, mapId, modeId) => {
  // Get the current series to determine what kind of ban this should be
  const series = await getSeries(seriesId);
  const kind = series.turn?.kind;

  console.log("[DEBUG] postVeto called with:", { seriesId, team, mapId, modeId, kind });

  if (kind === "OBJECTIVE_COMBO") {
    // Call the TSD machine's ban_objective_combo method
    const response = await fetch(`${API_BASE}/series/${seriesId}/ban_objective_combo/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        team: team,
        objective_mode_id: modeId,
        map_id: mapId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    return await response.json();
  } else if (kind === "SLAYER_MAP") {
    // Call the TSD machine's ban_slayer_map method
    const response = await fetch(`${API_BASE}/series/${seriesId}/ban_slayer_map/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        team: team,
        map_id: mapId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    return await response.json();
  } else {
    throw new Error(`Unknown ban kind: ${kind}`);
  }
};

export async function postUndo(id) {
  const res = await fetch(`${API_BASE}/series/${id}/undo/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });
  if (!res.ok) throw new Error("Failed to undo last action");
  return res.json();
}

export async function postReset(id) {
  const res = await fetch(`${API_BASE}/series/${id}/reset/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });
  if (!res.ok) throw new Error("Failed to reset series");
  return res.json();
}

export async function createSeries(teamA = "", teamB = "") {
  try {
    const body = {};
    if (teamA && teamB) {
      body.team_a = teamA;
      body.team_b = teamB;
    }
    
    console.log("[DEBUG] Creating series with API_BASE:", API_BASE);
    console.log("[DEBUG] Request URL:", `${API_BASE}/series/`);
    console.log("[DEBUG] Request body:", JSON.stringify(body));
    
    const res = await fetch(`${API_BASE}/series/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    
    console.log("[DEBUG] Response status:", res.status);
    console.log("[DEBUG] Response headers:", [...res.headers.entries()]);
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("[DEBUG] Create series error:", errorData);
      throw new Error(`Failed to create series: ${res.status} - ${errorData.detail || res.statusText}`);
    }
    
    return res.json();
  } catch (err) {
    console.error("[DEBUG] Create series failed:", err);
    throw err;
  }
}
