import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type TierBadgeProps = {
  label: string;
  revealed?: boolean;
  className?: string;
};

const MATRIX_CHARS = ["A", "E", "H", "K", "M", "N", "R", "S", "T", "X", "0", "1", "4", "7"];

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

  const minWidthStyle = useMemo(
    () => ({ minWidth: `${effectiveLength + 1}ch` }),
    [effectiveLength]
  );

  return (
    <span
      className={cn(
        "tier-badge relative inline-flex items-center justify-center rounded-[0.95rem] border border-slate-200/80 bg-white/70 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.55)] backdrop-blur-sm transition-colors",
        className
      )}
      style={minWidthStyle}
    >
      <span
        className={cn(
          "transition-opacity duration-200 ease-out",
          revealed ? "opacity-100" : "opacity-0"
        )}
        style={minWidthStyle}
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
            className="vote-matrix__char text-xs font-semibold uppercase tracking-[0.28em] text-slate-500"
            style={{ animationDelay: `${idx * 0.08}s` }}
          >
            {char}
          </span>
        ))}
      </span>
      {!revealed && <span className="sr-only">Tier hidden until a winner is selected.</span>}
    </span>
  );
};
