import { useState, useEffect, useCallback, useRef } from "react";

type SerializableValue = string | number | boolean | null | object | Array<unknown>;

interface UsePersistentStateOptions<T> {
  key: string;
  defaultValue: T;
  storage?: "local" | "session";
  debounceMs?: number;
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
}

/**
 * 로컬/세션 스토리지에 상태를 자동으로 영속화하는 훅
 * 새로고침 시 작업 상태를 자동 복구합니다.
 */
export function usePersistentState<T extends SerializableValue>({
  key,
  defaultValue,
  storage = "local",
  debounceMs = 500,
  serialize = JSON.stringify,
  deserialize = JSON.parse
}: UsePersistentStateOptions<T>): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  
  // 초기값 로드
  const getStoredValue = useCallback((): T => {
    if (typeof window === "undefined") return defaultValue;
    
    try {
      const storageObj = storage === "local" ? localStorage : sessionStorage;
      const stored = storageObj.getItem(key);
      
      if (stored === null) return defaultValue;
      return deserialize(stored);
    } catch (error) {
      console.warn(`Failed to load persisted state for key "${key}":`, error);
      return defaultValue;
    }
  }, [key, defaultValue, storage, deserialize]);
  
  const [state, setState] = useState<T>(getStoredValue);
  const debounceRef = useRef<NodeJS.Timeout>();
  
  // 상태 변경 시 스토리지에 저장 (debounce)
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      try {
        const storageObj = storage === "local" ? localStorage : sessionStorage;
        storageObj.setItem(key, serialize(state));
      } catch (error) {
        console.warn(`Failed to persist state for key "${key}":`, error);
      }
    }, debounceMs);
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [state, key, storage, serialize, debounceMs]);
  
  // 다른 탭에서의 변경 감지
  useEffect(() => {
    if (typeof window === "undefined" || storage !== "local") return;
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setState(deserialize(e.newValue));
        } catch (error) {
          console.warn(`Failed to sync state for key "${key}":`, error);
        }
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key, storage, deserialize]);
  
  // 상태 초기화
  const clearState = useCallback(() => {
    if (typeof window === "undefined") return;
    
    try {
      const storageObj = storage === "local" ? localStorage : sessionStorage;
      storageObj.removeItem(key);
      setState(defaultValue);
    } catch (error) {
      console.warn(`Failed to clear state for key "${key}":`, error);
    }
  }, [key, defaultValue, storage]);
  
  return [state, setState, clearState];
}

// 편의를 위한 특화된 훅들

/**
 * 채팅 입력 상태 영속화
 */
export function usePersistentChatInput(threadId?: string) {
  const key = threadId ? `aura-chat-input-${threadId}` : "aura-chat-input-global";
  
  return usePersistentState<string>({
    key,
    defaultValue: "",
    debounceMs: 300
  });
}

/**
 * 선택된 모델 상태 영속화
 */
export function usePersistentModelSelection() {
  return usePersistentState<{ provider: string; modelId: string } | null>({
    key: "aura-selected-model",
    defaultValue: null
  });
}

/**
 * 사용자 설정 영속화
 */
export function usePersistentSettings<T extends Record<string, unknown>>(defaultSettings: T) {
  return usePersistentState<T>({
    key: "aura-user-settings",
    defaultValue: defaultSettings
  });
}

/**
 * 작업 세션 상태 영속화
 */
export interface WorkSession {
  id: string;
  name: string;
  startTime: string;
  messages: Array<{ role: string; content: string }>;
  notes: string[];
}

export function usePersistentWorkSession() {
  return usePersistentState<WorkSession | null>({
    key: "aura-work-session",
    defaultValue: null
  });
}

/**
 * UI 상태 영속화 (사이드바 열림/닫힘 등)
 */
export interface UIState {
  sidebarOpen: boolean;
  historyPanelOpen: boolean;
  focusModeEnabled: boolean;
  theme: "light" | "dark" | "system";
}

export function usePersistentUIState() {
  return usePersistentState<UIState>({
    key: "aura-ui-state",
    defaultValue: {
      sidebarOpen: true,
      historyPanelOpen: false,
      focusModeEnabled: false,
      theme: "dark"
    }
  });
}

export default usePersistentState;
