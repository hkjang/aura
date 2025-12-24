"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
}

export function RatingStars({ value, onChange, max = 5, size = "md", readonly = false }: RatingStarsProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const sizes: Record<string, string> = {
    sm: "16px",
    md: "20px",
    lg: "28px",
  };

  const displayValue = hoverValue ?? value;

  return (
    <div
      style={{
        display: "inline-flex",
        gap: "4px",
      }}
      onMouseLeave={() => setHoverValue(null)}
    >
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= displayValue;

        return (
          <button
            key={i}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(starValue)}
            onMouseEnter={() => !readonly && setHoverValue(starValue)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "2px",
              border: "none",
              background: "transparent",
              cursor: readonly ? "default" : "pointer",
              transition: "transform 0.1s",
            }}
          >
            <Star
              style={{
                width: sizes[size],
                height: sizes[size],
                fill: isFilled ? "#f59e0b" : "transparent",
                color: isFilled ? "#f59e0b" : "var(--border-color)",
                transition: "all 0.15s",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
