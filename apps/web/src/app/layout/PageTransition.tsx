import { useLocation } from "@tanstack/react-router"
import { LazyMotion, useReducedMotion } from "motion/react"
import * as Motion from "motion/react-m"
import type { ReactNode } from "react"

const loadMotionFeatures = () => import("./motion-features.ts").then((module) => module.default)

/** The page's `<main>`, faded in on navigation unless the user prefers reduced motion. */
export function PageTransition({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const pathname = useLocation({ select: (location) => location.pathname })
  const reduceMotion = useReducedMotion()

  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <Motion.main
        key={pathname}
        id="main"
        tabIndex={-1}
        className={className}
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {children}
      </Motion.main>
    </LazyMotion>
  )
}
