// lib/turn.ts (or a small util file)
export function currentPickerLabel(series) {
  const side = series?.turn?.team; // "A" | "B" (from backend)
  if (!side) return "";
  return side === "A" ? series?.team_a ?? "Team A" : series?.team_b ?? "Team B";
}

export function currentPickerSide(series) {
  return series?.turn?.team ?? null; // "A" | "B" | null
}
