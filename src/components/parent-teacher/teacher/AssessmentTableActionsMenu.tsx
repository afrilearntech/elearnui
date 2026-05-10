"use client";

import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";

export type AssessmentTableActionItem = {
  id: string;
  label: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
};

type AssessmentTableActionsMenuProps = {
  /** Unique id for this row (used to track open state) */
  rowKey: string;
  /** Which row's menu is open; parent controls so only one menu opens */
  openRowKey: string | null;
  onOpenChange: (key: string | null) => void;
  items: AssessmentTableActionItem[];
  align?: "left" | "right";
};

const MENU_MIN_WIDTH = 200;

export default function AssessmentTableActionsMenu({
  rowKey,
  openRowKey,
  onOpenChange,
  items,
  align = "right",
}: AssessmentTableActionsMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const isOpen = openRowKey === rowKey;

  const updatePosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const left =
      align === "right"
        ? Math.max(8, rect.right - MENU_MIN_WIDTH)
        : Math.min(rect.left, window.innerWidth - MENU_MIN_WIDTH - 8);
    setCoords({ top: rect.bottom + 4, left });
  };

  useLayoutEffect(() => {
    if (!isOpen) {
      setCoords(null);
      return;
    }
    updatePosition();
  }, [isOpen, align]);

  useEffect(() => {
    if (!isOpen) return;
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      onOpenChange(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(null);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onOpenChange]);

  const menu =
    isOpen && coords && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-[200] min-w-[200px] rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
            style={{ top: coords.top, left: coords.left }}
          >
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  if (item.disabled) return;
                  item.onClick();
                  onOpenChange(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon icon={item.icon} className="h-4 w-4 shrink-0 text-gray-500" />
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div className={`inline-flex ${align === "right" ? "justify-end" : "justify-start"}`}>
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-label="Open actions menu"
          onClick={() => onOpenChange(isOpen ? null : rowKey)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        >
          <Icon icon="solar:menu-dots-bold" className="h-5 w-5" />
        </button>
      </div>
      {menu}
    </>
  );
}
