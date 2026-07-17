import { useEffect, useRef, useState } from "react";

/**
 * Given a list of items (newest first), returns the set of IDs that
 * appeared since the previous render. On first render, nothing is
 * marked new (avoids highlighting the initial load).
 */
export function useNewIds<T extends { id: string }>(items: T[] | undefined, ttlMs = 1600): Set<string> {
  const seenRef = useRef<Set<string> | null>(null);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!items) return;
    const ids = new Set(items.map((i) => i.id));
    if (seenRef.current === null) {
      seenRef.current = ids;
      return;
    }
    const fresh: string[] = [];
    for (const id of ids) if (!seenRef.current.has(id)) fresh.push(id);
    seenRef.current = ids;
    if (fresh.length === 0) return;
    setNewIds((prev) => {
      const next = new Set(prev);
      fresh.forEach((id) => next.add(id));
      return next;
    });
    const t = setTimeout(() => {
      setNewIds((prev) => {
        const next = new Set(prev);
        fresh.forEach((id) => next.delete(id));
        return next;
      });
    }, ttlMs);
    return () => clearTimeout(t);
  }, [items, ttlMs]);

  return newIds;
}
