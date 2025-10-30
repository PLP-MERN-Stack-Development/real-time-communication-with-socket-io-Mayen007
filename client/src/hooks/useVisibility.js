import { useRef, useEffect } from 'react';

// useVisibility: returns a ref to attach to an element and calls onVisible when
// the element becomes visible inside the given root (rootRef) with the
// specified threshold. Debounces visibility callback by debounceMs.
export default function useVisibility(onVisible, { rootRef = null, threshold = 0.6, debounceMs = 300 } = {}) {
  const nodeRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !nodeRef.current) return;

    if (!('IntersectionObserver' in window)) {
      // fallback: call immediately (best-effort)
      onVisible && onVisible();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
            // require it to stay visible for debounceMs
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
              onVisible && onVisible();
              timerRef.current = null;
            }, debounceMs);
          } else {
            if (timerRef.current) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
            }
          }
        });
      },
      {
        root: rootRef && rootRef.current ? rootRef.current : null,
        threshold,
      }
    );

    const el = nodeRef.current;
    observer.observe(el);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (el) observer.unobserve(el);
      observer.disconnect();
    };
  }, [onVisible, rootRef, threshold, debounceMs]);

  return nodeRef;
}
