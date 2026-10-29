import { Link, useLocation } from "@tanstack/react-router"
import { LazyMotion, useReducedMotion } from "motion/react"
import * as Motion from "motion/react-m"
import type { ReactNode } from "react"

import { m } from "@/shared/i18n"

import { LocaleSelect } from "./LocaleSelect.tsx"
import { ThemeControls } from "./ThemeControls.tsx"

const loadMotionFeatures = () => import("./motion-features.ts").then((module) => module.default)

const NAV_LINK = "text-muted-foreground hover:text-foreground [&.active]:text-foreground"

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useLocation({ select: (location) => location.pathname })
  const reduceMotion = useReducedMotion()

  return (
    <div className="min-h-svh">
      <header className="border-b">
        <nav className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-3 text-sm">
          <Link to="/" className={NAV_LINK} activeOptions={{ exact: true }}>
            {m.nav_home()}
          </Link>
          <Link to="/todos" className={NAV_LINK}>
            {m.nav_todos()}
          </Link>
          <Link to="/dashboard" className={NAV_LINK}>
            {m.nav_dashboard()}
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <LocaleSelect />
            <ThemeControls />
          </div>
        </nav>
      </header>
      <LazyMotion features={loadMotionFeatures} strict>
        <Motion.main
          key={pathname}
          className="mx-auto max-w-4xl px-6 py-8"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {children}
        </Motion.main>
      </LazyMotion>
    </div>
  )
}
