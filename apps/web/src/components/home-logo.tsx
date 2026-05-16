"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const CLICK_WINDOW_MS = 1500;
const TRIGGER_AT = 3;
const REVEAL_TTL_MS = 6000;
const NUDGE_INTERVAL_MS = 4000;
const NUDGE_DURATION_MS = 600;

export function HomeLogo() {
  const [revealed, setRevealed] = useState(false);
  const [nudging, setNudging] = useState(false);
  const [hovering, setHovering] = useState(false);
  const countRef = useRef(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Periodic nudge to hint that the logo is clickable. Skips while the user is
  // hovering or while the easter egg reveal is open, so we never steal focus
  // from either an active interaction or the payoff itself.
  useEffect(() => {
    const interval = setInterval(() => {
      if (revealed || hovering) return;
      setNudging(true);
      const t = setTimeout(() => setNudging(false), NUDGE_DURATION_MS);
      return () => clearTimeout(t);
    }, NUDGE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [revealed, hovering]);

  function bumpCounter() {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    countRef.current += 1;

    if (countRef.current >= TRIGGER_AT) {
      countRef.current = 0;
      setRevealed(true);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = setTimeout(
        () => setRevealed(false),
        REVEAL_TTL_MS,
      );
      return;
    }

    idleTimerRef.current = setTimeout(() => {
      countRef.current = 0;
    }, CLICK_WINDOW_MS);
  }

  function onClick(e: React.MouseEvent) {
    // We're rendering this on the landing page, where Link to "/" is a no-op
    // navigation. Suppress it so spam-clicks feel like a button press.
    e.preventDefault();
    bumpCounter();
  }

  return (
    <div className="relative shrink-0">
      <Link
        href="/"
        onClick={onClick}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        aria-label="Lexem home"
        className="group flex items-center gap-1"
      >
        <Image
          key={nudging ? "nudge" : "idle"}
          src="/logo-no-bg.png"
          alt="Lexem"
          width={1400}
          height={629}
          style={{ height: 48, width: "auto" }}
          draggable={false}
          priority
          className={`transition-transform duration-100 ease-out group-active:scale-[0.92] group-active:translate-y-[1px] ${nudging ? "lexem-nudge" : ""}`}
        />
        <span className="font-serif font-semibold text-2xl leading-none tracking-wide">
          Lexem
        </span>
      </Link>

      <div
        role="status"
        aria-live="polite"
        aria-hidden={!revealed}
        className={`absolute top-full left-0 mt-3 z-40 bg-white border border-black/10 shadow-[6px_6px_0px_#000] px-4 py-3 w-[min(22rem,calc(100vw-2rem))] transition-all duration-200 ease-out ${
          revealed
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-1 pointer-events-none"
        }`}
      >
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-3xl font-black tracking-tight leading-none">
            言素
          </span>
          <span className="text-xs font-mono uppercase tracking-widest text-neutral-500">
            Genso
          </span>
        </div>
        <p className="mt-2 text-sm text-neutral-700 leading-relaxed">
          <span className="italic">&ldquo;word element.&rdquo;</span> In
          linguistics, a lexeme is the smallest unit of meaning. That&apos;s
          what we built Lexem to version-control.
        </p>
      </div>
    </div>
  );
}
