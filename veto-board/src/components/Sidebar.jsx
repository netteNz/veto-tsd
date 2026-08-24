import { useState } from "react";
import { Outlet, NavLink, Link } from "react-router-dom"; // Add Link import
import {
  Crosshair,
  Swords,
  ChevronLeft,
  ChevronRight,
  Dices,
  HelpCircle,
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
    <div className="min-h-screen w-full bg-void text-ink">
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
        "relative h-full border-r border-ink-muted/20 bg-panel",
        open ? "w-64" : "w-20",
        "transition-all duration-300 ease-in-out shadow-xl"
      )}
    >
      {/* Top: App mark + brand name */}
      <Link to="/" className="block hover:opacity-80 transition-opacity">
        <div className="flex items-center gap-3 px-4 py-5">
          <div className="relative grid size-10 shrink-0 place-items-center">
            <span className="pointer-events-none absolute left-0 top-0 h-2.5 w-2.5 border-l-2 border-t-2 border-hud" />
            <span className="pointer-events-none absolute right-0 top-0 h-2.5 w-2.5 border-r-2 border-t-2 border-hud" />
            <span className="pointer-events-none absolute bottom-0 left-0 h-2.5 w-2.5 border-b-2 border-l-2 border-hud" />
            <span className="pointer-events-none absolute bottom-0 right-0 h-2.5 w-2.5 border-b-2 border-r-2 border-hud" />
            <Crosshair className="size-5 text-hud" />
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
                <div className="font-display text-base font-semibold uppercase leading-tight tracking-wider text-ink">
                  TSD Veto
                </div>
                <div className="font-mono text-[11px] leading-tight text-ink-muted">
                  Mission Control &middot; netteNz
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Link>

      {/* Divider */}
      <div className="mx-4 border-t border-ink-muted/15" />

      {/* Nav */}
      <nav className="mt-5 flex flex-col gap-1.5 px-2">
        {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={!open ? label : undefined}
            className={({ isActive }) =>
              classNames(
                "group flex items-center gap-3 px-3 py-2.5 font-sans text-sm font-medium transition-all",
                "hover:bg-panel-raised",
                isActive
                  ? "bg-hud/10 text-ink ring-1 ring-hud/40"
                  : "text-ink-muted hover:text-ink"
              )
            }
          >
            <Icon className={classNames(
              "size-5 shrink-0",
              "group-hover:text-hud",
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
          className="w-full border border-hud/20 bg-hud/5 px-3 py-2.5 text-xs text-ink transition-colors hover:bg-hud/10"
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
    <div className="flex h-screen bg-void text-ink">
      <Sidebar />
      <section className="flex-1 p-8">
        <h1 className="font-display text-2xl font-semibold">Veto</h1>
        <p className="mt-2 max-w-prose text-ink-muted">
          Your content goes here.
        </p>
      </section>
    </div>
  );
}