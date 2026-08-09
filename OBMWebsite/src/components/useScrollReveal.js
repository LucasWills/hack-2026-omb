import { useEffect, useRef, useState } from 'react';

/**
 * Reveals an element with a fade/rise transition the first time it
 * scrolls into view. Respects prefers-reduced-motion.
 *
 * Usage:
 *   const [ref, isVisible] = useScrollReveal();
 *   <div ref={ref} className={`content-section reveal ${isVisible ? 'is-visible' : ''}`}>
 */
export default function useScrollReveal(options = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px', ...options }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
}
