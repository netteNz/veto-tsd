const API_BASE = "http://localhost:8000/api"; // change this if different

export async function getSeries(id) {
  const res = await fetch(`${API_BASE}/series/${id}/`);
  if (!res.ok) throw new Error("Failed to fetch series");
  return res.json();
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
  return res.json();
  return data;
}

export async function postVeto(id, team, map, mode) {
  const res = await fetch(`${API_BASE}/series/${id}/veto/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ team, map, mode }),
  });
  return res.json();
}

export async function postUndo(id) {
  const res = await fetch(`${API_BASE}/series/${id}/undo/`, {
    method: "POST",
  });
  return res.json();
}

export async function postReset(id) {
  const res = await fetch(`${API_BASE}/series/${id}/reset/`, {
    method: "POST",
  });
  return res.json();
}
