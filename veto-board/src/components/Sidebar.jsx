import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { 
  FlaskConical, // Changed from Shield to FlaskConical
  Swords, 
  ChevronLeft, 
  ChevronRight, 
  Dices, 
  HelpCircle,
  Zap // New import for a visual accent
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
    <div className="min-h-screen w-full bg-neutral-950 text-white">
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
        "h-full border-r border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950 backdrop-blur",
        open ? "w-64" : "w-20",
        "transition-all duration-300 ease-in-out shadow-xl"
      )}
    >
      {/* Top: App mark + store name */}
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="grid place-items-center rounded-xl border border-blue-500 p-2.5 shadow-sm shadow-blue-500/10">
          <FlaskConical className="size-5 text-blue-400" />
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
              <div className="text-sm font-bold text-white leading-tight tracking-wide flex items-center">
                TSD Veto <Zap className="h-3 w-3 ml-1 text-blue-400" />
              </div>
              <div className="text-xs text-blue-400 leading-tight font-medium">Created by netteNz</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-neutral-800/70" />

      {/* Nav */}
      <nav className="mt-5 flex flex-col gap-1.5 px-2">
        {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={!open ? label : undefined}
            className={({ isActive }) =>
              classNames(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                "hover:bg-neutral-800 hover:shadow-md",
                isActive
                  ? "bg-blue-600/10 text-white ring-1 ring-blue-500/30 shadow-sm"
                  : "text-white/80 hover:text-white"
              )
            }
          >
            <Icon className={classNames(
              "size-5 shrink-0", 
              "group-hover:text-blue-400",
              "transition-colors duration-200"
            )} />
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
          className="w-full rounded-xl border border-blue-500/20 bg-blue-500/5 px-3 py-2.5 text-xs text-white hover:bg-blue-600/10 transition-colors shadow-sm"
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
                  className="font-medium"
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