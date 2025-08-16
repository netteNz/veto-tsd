export default function ComboGrid({ groupedData, selected }) {
  if (!selected) {
    return (
      <div className="text-text.muted">Select a mode from the left to see available maps.</div>
    );
  }

  const list = (selected.group === 'objective'
    ? groupedData.objective
    : groupedData.slayer);

  const entry = list.find(x => x.mode === selected.mode);
  if (!entry) return <div className="text-text.muted">No maps found.</div>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {entry.combos.map(c => (
        <div key={c.slug} className="p-4 bg-panelBg rounded-lg">
          <div className="font-semibold">{c.map}</div>
          <div className="text-text.muted text-sm">{selected.mode}</div>
        </div>
      ))}
    </div>
  );
}