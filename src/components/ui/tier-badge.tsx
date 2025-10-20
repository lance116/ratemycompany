import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type TierBadgeProps = {
  label: string;
  revealed?: boolean;
  className?: string;
};

const MATRIX_CHARS = ["A", "E", "H", "K", "M", "N", "R", "S", "T", "X", "0", "1", "4", "7"];

const TIER_PALETTE: Record<string, { start: string; end: string; border: string; text: string; shadow: string }> = {
  "s+ tier": {
    start: "rgba(253, 224, 71, 0.32)",
    end: "rgba(255, 255, 255, 0.96)",
    border: "rgba(250, 204, 21, 0.55)",
    text: "rgba(120, 53, 15, 0.78)",
    shadow: "0 18px 38px -32px rgba(187, 139, 0, 0.6)",
  },
  "s tier": {
    start: "rgba(253, 230, 138, 0.28)",
    end: "rgba(255, 255, 255, 0.96)",
    border: "rgba(250, 204, 21, 0.45)",
    text: "rgba(120, 53, 15, 0.74)",
    shadow: "0 18px 38px -32px rgba(191, 148, 38, 0.55)",
  },
  "a+ tier": {
    start: "rgba(251, 191, 36, 0.25)",
    end: "rgba(255, 255, 255, 0.95)",
    border: "rgba(251, 191, 36, 0.42)",
    text: "rgba(133, 77, 14, 0.72)",
    shadow: "0 18px 36px -32px rgba(201, 114, 20, 0.5)",
  },
  "a tier": {
    start: "rgba(248, 206, 80, 0.22)",
    end: "rgba(255, 255, 255, 0.95)",
    border: "rgba(245, 158, 11, 0.38)",
    text: "rgba(146, 64, 14, 0.7)",
    shadow: "0 18px 36px -32px rgba(202, 138, 4, 0.45)",
  },
  "b+ tier": {
    start: "rgba(190, 242, 100, 0.18)",
    end: "rgba(255, 255, 255, 0.94)",
    border: "rgba(132, 204, 22, 0.42)",
    text: "rgba(63, 98, 18, 0.72)",
    shadow: "0 18px 34px -32px rgba(101, 163, 13, 0.42)",
  },
  "b tier": {
    start: "rgba(134, 239, 172, 0.18)",
    end: "rgba(255, 255, 255, 0.94)",
    border: "rgba(34, 197, 94, 0.38)",
    text: "rgba(22, 101, 52, 0.74)",
    shadow: "0 18px 34px -32px rgba(22, 163, 74, 0.38)",
  },
  "c+ tier": {
    start: "rgba(125, 211, 252, 0.18)",
    end: "rgba(255, 255, 255, 0.94)",
    border: "rgba(14, 165, 233, 0.38)",
    text: "rgba(12, 74, 110, 0.74)",
    shadow: "0 18px 34px -32px rgba(14, 165, 233, 0.35)",
  },
  "c tier": {
    start: "rgba(165, 180, 252, 0.18)",
    end: "rgba(255, 255, 255, 0.94)",
    border: "rgba(99, 102, 241, 0.36)",
    text: "rgba(55, 48, 163, 0.72)",
    shadow: "0 18px 34px -32px rgba(99, 102, 241, 0.33)",
  },
  "d+ tier": {
    start: "rgba(148, 163, 184, 0.18)",
    end: "rgba(255, 255, 255, 0.93)",
    border: "rgba(100, 116, 139, 0.34)",
    text: "rgba(30, 41, 59, 0.72)",
    shadow: "0 18px 32px -32px rgba(100, 116, 139, 0.32)",
  },
  "d tier": {
    start: "rgba(148, 163, 184, 0.16)",
    end: "rgba(255, 255, 255, 0.92)",
    border: "rgba(100, 116, 139, 0.32)",
    text: "rgba(30, 41, 59, 0.7)",
    shadow: "0 18px 30px -32px rgba(71, 85, 105, 0.3)",
  },
  "f tier": {
    start: "rgba(51, 65, 85, 0.18)",
    end: "rgba(255, 255, 255, 0.9)",
    border: "rgba(51, 65, 85, 0.32)",
    text: "rgba(30, 41, 59, 0.75)",
    shadow: "0 18px 28px -28px rgba(30, 41, 59, 0.28)",
  },
};

const DEFAULT_PALETTE = {
  start: "rgba(241, 245, 249, 0.2)",
  end: "rgba(255, 255, 255, 0.95)",
  border: "rgba(203, 213, 225, 0.5)",
  text: "rgba(71, 85, 105, 0.74)",
  shadow: "0 18px 32px -32px rgba(71, 85, 105, 0.28)",
};

const generateMatrixString = (length: number) => {
  let result = "";
  for (let i = 0; i < length; i += 1) {
    const glyph = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
    result += glyph;
  }
  return result;
};

export const TierBadge: React.FC<TierBadgeProps> = ({ label, revealed = true, className }) => {
  const effectiveLength = useMemo(() => Math.max(3, label.replace(/\s+/g, "").length), [label]);
  const [matrixValue, setMatrixValue] = useState(() => generateMatrixString(effectiveLength));
  const intervalRef = useRef<number | null>(null);
  const palette = useMemo(() => {
    const normalized = label.trim().toLowerCase();
    return TIER_PALETTE[normalized] ?? DEFAULT_PALETTE;
  }, [label]);

  useEffect(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!revealed) {
      const updateMatrix = () => setMatrixValue(generateMatrixString(effectiveLength));
      updateMatrix();
      intervalRef.current = window.setInterval(updateMatrix, 130);
      return () => {
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }

    return undefined;
  }, [revealed, effectiveLength]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const minWidthStyle = useMemo(() => ({ minWidth: `${effectiveLength + 1}ch` }), [effectiveLength]);

  const appliedPalette = revealed ? palette : DEFAULT_PALETTE;

  const badgeStyle = useMemo(
    () => ({
      ...minWidthStyle,
      background: `linear-gradient(135deg, ${appliedPalette.start}, ${appliedPalette.end})`,
      borderColor: appliedPalette.border,
      color: appliedPalette.text,
      boxShadow: appliedPalette.shadow,
    }),
    [minWidthStyle, appliedPalette]
  );

  return (
    <span
      className={cn(
        "tier-badge relative inline-flex items-center justify-center rounded-[0.95rem] border px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.28em] backdrop-blur-sm transition-colors",
        className
      )}
      style={badgeStyle}
    >
      <span
        className={cn(
          "transition-opacity duration-200 ease-out",
          revealed ? "opacity-100" : "opacity-0"
        )}
        style={{ ...minWidthStyle, color: appliedPalette.text }}
      >
        {label}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-200 ease-out",
          revealed ? "opacity-0" : "opacity-100"
        )}
        style={minWidthStyle}
      >
        {Array.from(matrixValue).map((char, idx) => (
          <span
            key={`${char}-${idx}`}
            className="vote-matrix__char text-xs font-semibold uppercase tracking-[0.28em]"
            style={{ animationDelay: `${idx * 0.08}s`, color: appliedPalette.text }}
          >
            {char}
          </span>
        ))}
      </span>
      {!revealed && <span className="sr-only">Tier hidden until a winner is selected.</span>}
    </span>
  );
};
