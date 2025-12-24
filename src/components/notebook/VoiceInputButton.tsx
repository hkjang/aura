"use client";

import { useState } from "react";
import { Mic, MicOff } from "lucide-react";

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInputButton({ onTranscript, disabled = false }: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  const startListening = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const windowAny = window as any;
    
    if (!windowAny.webkitSpeechRecognition && !windowAny.SpeechRecognition) {
      setIsSupported(false);
      alert("이 브라우저는 음성 인식을 지원하지 않습니다.");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = windowAny.SpeechRecognition || windowAny.webkitSpeechRecognition;
    
    const recognition = new SpeechRecognition();
    recognition.lang = "ko-KR";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
    };

    recognition.start();
  };

  if (!isSupported) return null;

  return (
    <button
      onClick={startListening}
      disabled={disabled || isListening}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        border: "none",
        background: isListening ? "#ef4444" : "var(--bg-secondary)",
        cursor: disabled ? "not-allowed" : "pointer",
        color: isListening ? "white" : "var(--text-secondary)",
        transition: "all 0.2s",
        animation: isListening ? "pulse 1.5s infinite" : "none",
      }}
      title={isListening ? "듣는 중..." : "음성 입력"}
      aria-label="음성 입력"
    >
      {isListening ? (
        <MicOff style={{ width: "18px", height: "18px" }} />
      ) : (
        <Mic style={{ width: "18px", height: "18px" }} />
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
        }
      `}</style>
    </button>
  );
}
