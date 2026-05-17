"use client";

import { useState, useRef } from "react";

export function ChameleonTooltip() {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleMouseEnter() {
    setVisible(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), 2500);
  }

  function handleMouseLeave() {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
  }

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`absolute top-10 right-16 pointer-events-none transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="bg-white border border-black shadow-[4px_4px_0px_#000] px-4 py-2.5">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-black">
            Prompts that adapt. Quietly.
          </span>
        </div>
      </div>
    </div>
  );
}
