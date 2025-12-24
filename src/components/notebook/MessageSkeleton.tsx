"use client";

interface MessageSkeletonProps {
  count?: number;
  variant?: "user" | "assistant" | "mixed";
}

export function MessageSkeleton({ count = 3, variant = "mixed" }: MessageSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => {
    const isUser = variant === "user" || (variant === "mixed" && i % 2 === 0);
    return { id: i, isUser };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "24px" }}>
      {items.map(({ id, isUser }) => (
        <div
          key={id}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: isUser ? "flex-end" : "flex-start",
            gap: "8px",
          }}
        >
          <div
            style={{
              width: isUser ? "60%" : "80%",
              padding: "16px 20px",
              borderRadius: isUser ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
              background: "var(--bg-secondary)",
            }}
          >
            <div
              style={{
                height: "14px",
                width: "70%",
                borderRadius: "4px",
                background: "linear-gradient(90deg, var(--border-color) 25%, var(--bg-tertiary) 50%, var(--border-color) 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s infinite",
                marginBottom: "8px",
              }}
            />
            <div
              style={{
                height: "14px",
                width: "90%",
                borderRadius: "4px",
                background: "linear-gradient(90deg, var(--border-color) 25%, var(--bg-tertiary) 50%, var(--border-color) 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s infinite",
                marginBottom: "8px",
              }}
            />
            {!isUser && (
              <div
                style={{
                  height: "14px",
                  width: "50%",
                  borderRadius: "4px",
                  background: "linear-gradient(90deg, var(--border-color) 25%, var(--bg-tertiary) 50%, var(--border-color) 75%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.5s infinite",
                }}
              />
            )}
          </div>
        </div>
      ))}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
