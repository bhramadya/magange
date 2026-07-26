import { useCallback, useSyncExternalStore } from 'react';

/**
 * React hook that returns `true` when the user prefers reduced motion,
 * and `false` otherwise. Re-renders automatically when the OS preference
 * changes.
 *
 * Use this to conditionally disable non-essential animations, respecting
 * WCAG success criterion 2.3.3 (Animation from Interactions).
 */
function subscribe(callback: () => void): () => void {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    mql.addEventListener('change', callback);

    return () => mql.removeEventListener('change', callback);
}

function getSnapshot(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getServerSnapshot(): boolean {
    return false; // SSR safe — assume no reduced motion on server
}

export function useReducedMotion(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Motion props for Framer Motion / Motion React that respect the user's
 * reduced-motion preference. Spread into any animated element.
 *
 * Example:
 *   <motion.div {...reducedMotionProps} animate={{ x: 100 }}>
 *
 * When the user prefers reduced motion, the animation is skipped entirely
 * and the element renders at its `animate` state immediately.
 */
export function useReducedMotionProps() {
    const reduced = useReducedMotion();

    return {
        // Skip animation when reduced motion is preferred
        ...(reduced ? { initial: undefined, animate: undefined } : {}),
    };
}

/**
 * Callback-wrapper: suppresses the callback when the user prefers reduced
 * motion. Useful for scroll-triggered or hover-triggered effects.
 */
export function useReducedMotionSafe<T extends (...args: unknown[]) => void>(
    fn: T,
): T {
    const reduced = useReducedMotion();

    return useCallback(
        (...args: unknown[]) => {
            if (reduced) {
                return;
            }

            fn(...args);
        },
        [reduced, fn],
    ) as T;
}
