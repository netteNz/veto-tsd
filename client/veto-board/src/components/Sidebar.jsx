import React from 'react'

export default function Sidebar({
  open,
  collapsed = false,
  onClose,
  onToggleCollapse,
  vetos = [],
  series = [],
  selectedVeto,
  selectedSeries,
  onSelectVeto,
  onSelectSeries,
}) {
  // mobile translate state, desktop width classes
  const mobileTranslate = open ? 'translate-x-0' : '-translate-x-full'
  const desktopWidth = collapsed ? 'md:w-16' : 'md:w-72'

  return (
    <>
      {/* mobile backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-30 transition-opacity md:hidden ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        className={`
          fixed z-40 left-0 top-0 h-full bg-gray-900 border-r border-gray-800
          transform transition-transform duration-200 ${mobileTranslate} md:translate-x-0
          ${desktopWidth} w-72
        `}
      >
        <div className="h-14 flex items-center px-2 md:px-4 border-b border-gray-800 justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded ${collapsed ? 'bg-gray-700' : 'bg-indigo-600'}`} />
            {/* title hidden when fully collapsed on md */}
            <span className={`font-semibold text-sm text-gray-100 ${collapsed ? 'hidden md:inline-block' : ''}`}>VetoBoard</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              title="Collapse"
              onClick={onToggleCollapse}
              className="p-1 rounded hover:bg-gray-800 hidden md:inline-flex"
            >
              <svg className="w-4 h-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d={collapsed ? "M6 18L18 6M6 6l12 12" : "M6 12h12"} />
              </svg>
            </button>

            {/* mobile close */}
            <button
              title="Close"
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-800 md:hidden"
            >
              <svg className="w-4 h-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <nav className="p-3 divide-y divide-gray-800 overflow-auto h-[calc(100%-56px)]">
          <div className="pb-4">
            <div className="text-xs text-gray-400 uppercase tracking-wide px-1">Veto</div>
            <ul className="mt-3 space-y-2">
              {vetos.map((v) => {
                const id = v.id ?? v.pk ?? v
                const label = v.name ?? v.title ?? String(v)
                const active = selectedVeto === id
                return (
                  <li
                    key={id}
                    onClick={() => onSelectVeto?.(id)}
                    className={`flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer transition-colors ${active ? 'bg-gray-800 border border-gray-700' : 'hover:bg-gray-800'}`}
                  >
                    <div className={`w-9 h-9 rounded flex items-center justify-center ${active ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                      <span className="text-xs text-white">{label.charAt(0)}</span>
                    </div>

                    {/* hide labels when collapsed on md */}
                    <div className={`flex-1 min-w-0 ${collapsed ? 'hidden md:block' : 'block'}`}>
                      <div className="text-sm font-medium text-gray-100 truncate">{label}</div>
                      <div className="text-xs text-gray-400">{(v.items?.length ?? 0) + ' items'}</div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="pt-4">
            <div className="text-xs text-gray-400 uppercase tracking-wide px-1">Series</div>
            <ul className="mt-3 space-y-1">
              {series.length === 0 && <li className="px-2 py-2 text-sm text-gray-500">No series</li>}
              {series.map((s) => {
                const sid = s.id ?? s.pk ?? s
                const label = s.name ?? s.title ?? `Series ${s.id ?? ''}`
                const active = selectedSeries === sid
                return (
                  <li
                    key={sid}
                    onClick={() => onSelectSeries?.(s)}
                    className={`flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer text-sm transition-colors ${active ? 'bg-indigo-600 text-white' : 'hover:bg-gray-800 text-gray-200'}`}
                  >
                    <div className={`w-8 h-8 rounded ${active ? 'bg-indigo-700' : 'bg-gray-700'} flex items-center justify-center`}>
                      <span className="text-xs text-white">{String(sid).slice(-2)}</span>
                    </div>

                    <div className={`min-w-0 ${collapsed ? 'hidden md:block' : 'block'}`}>
                      {label}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>

        <div className={`absolute bottom-0 left-0 right-0 p-3 border-t border-gray-800 ${collapsed ? 'hidden md:block' : ''}`}>
          <div className="text-xs text-gray-500">v0.1</div>
        </div>
      </aside>
    </>
  )
}