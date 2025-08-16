const API = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/api';

export async function fetchGrouped(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API}/maps/combos/grouped/${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}


const BASE = import.meta.env.VITE_API_BASE || ''

async function handleRes(res) {
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(txt || res.statusText)
  }
  return res.json().catch(() => null)
}

export async function getMaps(page = 1) {
  // include trailing slash to avoid 301
  return handleRes(await fetch(`${BASE}/maps/?page=${page}`))
}

export async function getModes() {
  // derive modes from maps (MapSerializer exposes modes)
  const mapsData = await getMaps()
  const maps = mapsData?.results ?? mapsData ?? []
  const modeMap = new Map()
  for (const m of maps) {
    const modes = m.modes ?? []
    for (const mo of modes) {
      const id = mo.id ?? mo.pk ?? mo
      if (!modeMap.has(id)) modeMap.set(id, { id, name: mo.name ?? String(id) })
    }
  }
  return Array.from(modeMap.values())
}

export async function getSeries(page = 1) {
  return handleRes(await fetch(`${BASE}/series/?page=${page}`))
}

export async function getSeriesForMode(modeId) {
  // backend series shape may include actions; we fetch all series and filter client-side as a safe fallback
  const data = await getSeries()
  const results = data?.results ?? data ?? []
  return results.filter((s) => {
    const actions = s.actions ?? []
    return actions.some((a) => a.mode === modeId || a.mode?.id === modeId)
  })
}

export async function createSeries(payload) {
  return handleRes(
    await fetch(`${BASE}/series/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  )
}

export async function postAction(seriesId, payload) {
  return handleRes(
    await fetch(`${BASE}/series/${seriesId}/action/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  )
}
