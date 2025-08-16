import React, { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import './index.css'
import { getModes, getSeriesForMode, getSeries } from './lib/api'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true) // mobile / desktop visible
  const [collapsed, setCollapsed] = useState(false) // desktop collapse
  const [modes, setModes] = useState([])
  const [series, setSeries] = useState([])
  const [selectedMode, setSelectedMode] = useState(null)
  const [selectedSeries, setSelectedSeries] = useState(null)
  const [messages, setMessages] = useState([
    { id: 1, role: 'system', text: 'Welcome to VetoBoard' },
    { id: 2, role: 'assistant', text: 'Select a veto on the left to start a series.' },
  ])
  const [input, setInput] = useState('')

  useEffect(() => {
    let mounted = true
    getModes()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.results ?? []
        if (mounted) {
          setModes(list)
          if (!selectedMode && list.length) setSelectedMode(list[0].id ?? list[0].pk ?? list[0])
        }
      })
      .catch(() => {
        // ignore - fallback to empty
      })

    // initial series load (optional)
    getSeries()
      .then((d) => {
        const all = d?.results ?? d ?? []
        if (mounted) setSeries(all)
      })
      .catch(() => {})

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (selectedMode == null) return
    let mounted = true
    getSeriesForMode(selectedMode)
      .then((list) => {
        if (mounted) setSeries(list)
      })
      .catch(() => {
        // keep previous or empty
        if (mounted) setSeries([])
      })
    return () => (mounted = false)
  }, [selectedMode])

  function onSelectMode(id) {
    setSelectedMode(id)
    setSelectedSeries(null)
  }

  function onSelectSeries(s) {
    setSelectedSeries(s?.id ?? s)
  }

  function sendMessage(e) {
    e?.preventDefault()
    if (!input.trim()) return
    setMessages((m) => [...m, { id: Date.now(), role: 'user', text: input.trim() }])
    setInput('')
    // hook: create series / post actions using createSeries/postAction
  }

  return (
    <div className="min-h-screen flex bg-gray-900 text-gray-100">
      <Sidebar
        open={sidebarOpen}
        collapsed={collapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        vetos={modes}
        series={series}
        selectedVeto={selectedMode}
        selectedSeries={selectedSeries}
        onSelectVeto={onSelectMode}
        onSelectSeries={onSelectSeries}
      />

      <div className="flex-1 flex flex-col">
        <header className="h-14 flex items-center px-4 border-b border-gray-800 bg-gray-900">
          <button
            aria-label="Toggle sidebar"
            onClick={() => setSidebarOpen((s) => !s)}
            className="mr-3 p-2 rounded-md hover:bg-gray-800 md:hidden"
          >
            <svg className="w-5 h-5 text-gray-200" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h1 className="text-sm font-semibold">VetoBoard</h1>
          <div className="ml-auto text-xs text-gray-400 pr-4">{selectedSeries ? `Series: ${selectedSeries}` : ''}</div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto w-full max-w-4xl">
            <div className="flex flex-col h-[72vh] bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-lg">
              <div className="flex-1 overflow-auto p-6 space-y-4 custom-scroll">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[80%] px-4 py-2 text-sm ${
                      m.role === 'user'
                        ? 'ml-auto bg-indigo-600 text-white rounded-tl-lg rounded-bl-lg'
                        : 'mr-auto bg-gray-700 text-gray-100 rounded-tr-lg rounded-br-lg'
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
              </div>

              <form onSubmit={sendMessage} className="border-t border-gray-700 p-4 bg-gray-900 flex items-center gap-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Send a message..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-4 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-500">Send</button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}