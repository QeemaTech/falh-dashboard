import { useCallback, useEffect, useState } from "react";

type Options = {
  /** Close when pointer leaves the container. Default false — use outside click only. */
  closeOnPointerLeave?: boolean;
};

function isInsideMuiOverlay(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      ".MuiModal-root, .MuiPopover-root, .MuiMenu-root, .MuiPopper-root, [role='presentation']"
    )
  );
}

export function useDropdown(options: Options = {}) {
  const { closeOnPointerLeave = false } = options;
  const [open, setOpen] = useState(false);
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    setContainerEl(node);
  }, []);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((current) => !current), []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (isInsideMuiOverlay(target)) return;
      if (containerEl && !containerEl.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, containerEl]);

  const onContainerMouseLeave = useCallback(
    (event: React.MouseEvent) => {
      if (!closeOnPointerLeave || !open) return;
      const next = event.relatedTarget as Node | null;
      if (!containerEl?.contains(next)) {
        setOpen(false);
      }
    },
    [closeOnPointerLeave, open, containerEl]
  );

  return {
    open,
    setOpen,
    close,
    toggle,
    containerRef,
    anchorEl: containerEl,
    onContainerMouseLeave,
  };
}
