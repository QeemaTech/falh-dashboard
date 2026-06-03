import { useCallback, useEffect, useRef, useState } from "react";

type Options = {
  /** Close when pointer leaves the container. Default false — use outside click only. */
  closeOnPointerLeave?: boolean;
};

export function useDropdown(options: Options = {}) {
  const { closeOnPointerLeave = false } = options;
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((current) => !current), []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const onContainerMouseLeave = useCallback(
    (event: React.MouseEvent) => {
      if (!closeOnPointerLeave || !open) return;
      const next = event.relatedTarget as Node | null;
      if (!containerRef.current?.contains(next)) {
        setOpen(false);
      }
    },
    [closeOnPointerLeave, open]
  );

  return {
    open,
    setOpen,
    close,
    toggle,
    containerRef,
    onContainerMouseLeave,
  };
}
