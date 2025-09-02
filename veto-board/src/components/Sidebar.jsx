import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { 
  Box, 
  Settings, 
  Swords, 
  ChevronLeft, 
  ChevronRight, 
  Dices, 
  HelpCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";


/**
 *
 * Usage (with React Router):
 * <AppLayout>
 *   <Route path="/veto" element={<VetoPage />} />
 * </AppLayout>
 */

const NAV_ITEMS = [
  { label: "Veto", to: "/veto", icon: Swords },
  { label: "Random Series", to: "/random", icon: Dices },
  { label: "How to Use", to: "/help", icon: HelpCircle },
  // Add more later: { label: "Analytics", to: "/analytics", icon: Gauge }
];

function classNames(...parts) {
  return parts.filter(Boolean).join(" ");
}

export default function AppLayout() {
  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100">
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(true);

  return (
    <aside
      className={classNames(
        "h-full border-r border-neutral-800 bg-neutral-950/95 backdrop-blur",
        open ? "w-64" : "w-20",
        "transition-all duration-300 ease-in-out"
      )}
    >
      {/* Top: App mark + store name */}
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="grid place-items-center rounded-xl bg-neutral-900 p-2 ring-1 ring-neutral-800">
          <Box className="size-6" />
        </div>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="brand"
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              className="truncate"
            >
              <div className="text-sm font-semibold leading-tight">TSD Veto Platform</div>
              <div className="text-xs text-neutral-400 leading-tight">netteNz</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-neutral-800" />

      {/* Nav */}
      <nav className="mt-3 flex flex-col gap-1 px-2">
        {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={!open ? label : undefined}
            className={({ isActive }) =>
              classNames(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
                "hover:bg-neutral-900/70 hover:ring-1 hover:ring-neutral-800",
                isActive
                  ? "bg-neutral-900/80 ring-1 ring-neutral-700"
                  : "text-neutral-300"
              )
            }
          >
            <Icon className="size-5 shrink-0 text-neutral-300" />
            <AnimatePresence initial={false}>
              {open && (
                <motion.span
                  key={label}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  className="truncate"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* Bottom controls */}
      <div className="absolute inset-x-0 bottom-0 px-2 pb-3">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full rounded-xl border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-900"
        >
          <div className="flex items-center justify-center gap-2">
            {open ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
            <AnimatePresence initial={false}>
              {open && (
                <motion.span
                  key="collapse"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {"Collapse sidebar"}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </button>
      </div>
    </aside>
  );
}

/** Optional helper: page shell for quick testing without wiring react-router */
export function DemoPageShell() {
  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100">
      <Sidebar />
      <section className="flex-1 p-8">
        <h1 className="text-2xl font-semibold">Veto</h1>
        <p className="mt-2 max-w-prose text-neutral-300">
          Your content goes here. The sidebar is built to match a modern admin panel
          with a dark, high-contrast look inspired by the screenshot.
        </p>
      </section>
    </div>
  );
}