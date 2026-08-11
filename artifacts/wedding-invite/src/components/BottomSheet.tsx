import React, { useEffect } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { X } from "lucide-react";

const NAME_FONT = "var(--name-font-family, 'Dancing Script', serif)";

const SPRING = {
  type: "spring",
  damping: 32,
  stiffness: 340,
  mass: 0.85,
} as const;

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Render as a flex-block child (parent handles width constraint & positioning). */
  inset?: boolean;
  /** Skip animations — used inside scaled editor preview frames. */
  previewMode?: boolean;
  /** Extra CSS vars / inline styles forwarded to the sheet wrapper (e.g. font vars). */
  style?: React.CSSProperties;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  inset,
  previewMode,
  style,
}: BottomSheetProps) {
  const dragY = useMotionValue(0);

  // Prevent background scroll while sheet is open
  useEffect(() => {
    if (!isOpen || previewMode) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen, previewMode]);

  const handleDragEnd = (
    _: unknown,
    info: { offset: { y: number }; velocity: { y: number } },
  ) => {
    if (info.offset.y > 80 || info.velocity.y > 450) {
      dragY.set(0);
      onClose();
    }
  };

  /** The visible sheet panel — shared across all render paths. */
  const sheetPanel = (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.03, bottom: 0.55 }}
      style={{ y: dragY, touchAction: "none" }}
      onDragEnd={handleDragEnd}
      className="w-full rounded-t-[26px] bg-card shadow-2xl border border-primary/10 border-b-0"
    >
      {/* ── Drag handle ── */}
      <div className="flex justify-center pt-3 pb-0 select-none">
        <div className="w-10 h-1.5 rounded-full bg-muted-foreground/20 cursor-grab active:cursor-grabbing" />
      </div>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 pt-2.5 pb-1.5">
        <p
          className="text-[22px] font-semibold text-primary"
          style={{ fontFamily: NAME_FONT }}
        >
          {title}
        </p>
        <button
          type="button"
          onClick={onClose}
          data-testid="button-close-panel"
          className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <X size={14} />
        </button>
      </div>

      {/* ── Scrollable content ──
          onPointerDown stopPropagation is the key fix:
          Framer Motion listens for pointerdown on the motion.div to start drag.
          By stopping bubbling here, touches inside the content area never reach
          the drag handler — the browser handles them as normal scroll instead.
          The drag-to-dismiss still works from the handle and header above. */}
      <div
        className="overflow-y-auto overscroll-contain px-5"
        style={{
          maxHeight: "calc(75vh - 76px)",
          paddingBottom: "max(20px, env(safe-area-inset-bottom))",
          touchAction: "pan-y",
          WebkitOverflowScrolling: "touch",
          ...style,
        } as React.CSSProperties}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </motion.div>
  );

  // ── Preview mode: no Framer Motion (avoids issues inside scaled frames) ──
  if (previewMode) {
    if (!isOpen) return null;
    return (
      <>
        <div
          className="absolute inset-0 z-40 bg-black/25"
          onClick={onClose}
        />
        <div className="absolute bottom-0 left-0 right-0 z-50">
          {sheetPanel}
        </div>
      </>
    );
  }

  // ── Inset mode: parent constrains width; panel is a flex-column child ──
  if (inset) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="bs-backdrop-inset"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[4px] pointer-events-auto"
              onClick={onClose}
            />
            <motion.div
              key="bs-panel-inset"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={SPRING}
              className="w-full relative z-50"
            >
              {sheetPanel}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // ── Default (standalone fixed) mode ──
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="bs-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[4px]"
            onClick={onClose}
          />
          <motion.div
            key="bs-panel"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={SPRING}
            className="fixed bottom-0 left-0 right-0 z-50 flex justify-center"
          >
            <div className="w-full max-w-[420px]">{sheetPanel}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
