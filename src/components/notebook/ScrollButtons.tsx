"use client";

import { useState, useEffect } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

interface ScrollButtonsProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

export function ScrollButtons({ containerRef }: ScrollButtonsProps) {
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowTop(scrollTop > 200);
      setShowBottom(scrollHeight - scrollTop - clientHeight > 200);
    };

    container.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => container.removeEventListener("scroll", handleScroll);
  }, [containerRef]);

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    containerRef.current?.scrollTo({ 
      top: containerRef.current.scrollHeight, 
      behavior: "smooth" 
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        right: "24px",
        bottom: "120px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        zIndex: 40,
      }}
    >
      {showTop && (
        <button
          onClick={scrollToTop}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: "1px solid var(--border-color)",
            background: "var(--bg-primary)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-secondary)",
            transition: "all 0.2s",
          }}
          title="맨 위로"
          aria-label="맨 위로 스크롤"
        >
          <ArrowUp style={{ width: "18px", height: "18px" }} />
        </button>
      )}
      {showBottom && (
        <button
          onClick={scrollToBottom}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: "1px solid var(--border-color)",
            background: "var(--bg-primary)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-secondary)",
            transition: "all 0.2s",
          }}
          title="맨 아래로"
          aria-label="맨 아래로 스크롤"
        >
          <ArrowDown style={{ width: "18px", height: "18px" }} />
        </button>
      )}
    </div>
  );
}
