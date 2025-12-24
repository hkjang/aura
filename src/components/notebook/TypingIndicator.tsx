"use client";

export function TypingIndicator() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        padding: "16px 20px",
        borderRadius: "20px 20px 20px 4px",
        background: "linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)",
        maxWidth: "100px",
        marginBottom: "24px",
      }}
    >
      <span
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: "var(--color-primary)",
          animation: "bounce 1.4s infinite ease-in-out",
          animationDelay: "0s",
        }}
      />
      <span
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: "var(--color-primary)",
          animation: "bounce 1.4s infinite ease-in-out",
          animationDelay: "0.2s",
        }}
      />
      <span
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: "var(--color-primary)",
          animation: "bounce 1.4s infinite ease-in-out",
          animationDelay: "0.4s",
        }}
      />
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
