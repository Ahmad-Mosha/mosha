import type { Variants, Transition } from "framer-motion";

/**
 * Shared motion vocabulary. Everything that moves in MOSHA uses one of these,
 * so the whole system decelerates on the same curve — the thing that makes
 * motion read as designed rather than decorative.
 *
 * Reduced-motion is handled globally by <MotionConfig reducedMotion="user">
 * in providers.tsx; individual components do not need to check for it.
 */

export const ease: Transition["ease"] = [0.22, 1, 0.36, 1];

/** Screen-to-screen change. Short enough that it never delays the work. */
export const screenTransition: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.12, ease } },
};

/** Parent of a list; children arrive in sequence rather than all at once. */
export const listContainer: Variants = {
  animate: { transition: { staggerChildren: 0.028, delayChildren: 0.02 } },
};

/** A row or card inside a staggered list. */
export const listItem: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.26, ease } },
  exit: { opacity: 0, x: -8, transition: { duration: 0.14, ease } },
};

/** Springy pop for things that appear in place — dialogs, popovers, badges. */
export const popIn: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 420, damping: 32 },
  },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.12, ease } },
};
