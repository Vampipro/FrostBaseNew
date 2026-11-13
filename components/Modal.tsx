"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export default function Modal({ onClose, wide, children }: { onClose: () => void; wide?: boolean; children: ReactNode }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, []);
  if (!mounted) return null;
  // Портал у <body>: вікно більше не «застрягає» у stacking-context сторінки і лежить поверх меню, футера й ефектів
  return createPortal(
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={"modal" + (wide ? " wide" : "")} role="dialog" aria-modal="true">
        <button className="modal-x" aria-label="close" onClick={onClose}>✕</button>
        {children}
      </div>
    </div>,
    document.body
  );
}
