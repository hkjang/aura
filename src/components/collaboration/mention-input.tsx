"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { AtSign, X, Search, User } from "lucide-react";

interface MentionUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  users: MentionUser[];
  onMention?: (user: MentionUser) => void;
  placeholder?: string;
}

// @ 멘션 파싱
function parseMentions(text: string): Array<{ start: number; end: number; userId: string }> {
  const mentions: Array<{ start: number; end: number; userId: string }> = [];
  const regex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    mentions.push({
      start: match.index,
      end: match.index + match[0].length,
      userId: match[2]
    });
  }
  
  return mentions;
}

// 멘션을 표시용 텍스트로 변환
function formatMentionForDisplay(text: string): string {
  return text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, "@$1");
}

export function MentionInput({
  value,
  onChange,
  users,
  onMention,
  placeholder = "메시지를 입력하세요... (@로 멘션)"
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // 멘션 트리거 감지
  useEffect(() => {
    const textBeforeCursor = value.slice(0, cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf("@");
    
    if (atIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(atIndex + 1);
      // 공백이 없으면 멘션 중
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setSearchQuery(textAfterAt);
        setShowSuggestions(true);
        setSelectedIndex(0);
        return;
      }
    }
    
    setShowSuggestions(false);
  }, [value, cursorPosition]);
  
  // 필터링된 사용자
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users.slice(0, 5);
    const query = searchQuery.toLowerCase();
    return users
      .filter(u => 
        u.name.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query)
      )
      .slice(0, 5);
  }, [users, searchQuery]);
  
  // 멘션 삽입
  const insertMention = useCallback((user: MentionUser) => {
    const textBeforeCursor = value.slice(0, cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf("@");
    const textAfterCursor = value.slice(cursorPosition);
    
    const mentionText = `@[${user.name}](${user.id})`;
    const newValue = 
      value.slice(0, atIndex) + 
      mentionText + " " + 
      textAfterCursor;
    
    onChange(newValue);
    setShowSuggestions(false);
    onMention?.(user);
    
    // 커서 위치 업데이트
    setTimeout(() => {
      if (inputRef.current) {
        const newCursor = atIndex + mentionText.length + 1;
        inputRef.current.selectionStart = newCursor;
        inputRef.current.selectionEnd = newCursor;
        inputRef.current.focus();
      }
    }, 0);
  }, [value, cursorPosition, onChange, onMention]);
  
  // 키보드 네비게이션
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions) return;
    
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredUsers.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case "Enter":
        if (filteredUsers[selectedIndex]) {
          e.preventDefault();
          insertMention(filteredUsers[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        break;
    }
  }, [showSuggestions, filteredUsers, selectedIndex, insertMention]);
  
  // 입력 핸들러
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setCursorPosition(e.target.selectionStart);
  }, [onChange]);
  
  const handleSelect = useCallback((e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    setCursorPosition(e.currentTarget.selectionStart);
  }, []);
  
  // 현재 멘션 목록
  const mentions = parseMentions(value);
  const mentionedUsers = mentions
    .map(m => users.find(u => u.id === m.userId))
    .filter(Boolean) as MentionUser[];
  
  return (
    <div className="mention-input-container">
      <div className="input-wrapper">
        <textarea
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onSelect={handleSelect}
          onClick={handleSelect}
          placeholder={placeholder}
          rows={3}
        />
        
        {showSuggestions && filteredUsers.length > 0 && (
          <div className="suggestions-popup">
            <div className="suggestions-header">
              <Search size={14} />
              <span>사용자 선택</span>
            </div>
            {filteredUsers.map((user, index) => (
              <button
                key={user.id}
                className={`suggestion-item ${index === selectedIndex ? "selected" : ""}`}
                onClick={() => insertMention(user)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="user-avatar">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} />
                  ) : (
                    <User size={16} />
                  )}
                </div>
                <div className="user-info">
                  <span className="user-name">{user.name}</span>
                  {user.email && <span className="user-email">{user.email}</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {mentionedUsers.length > 0 && (
        <div className="mentioned-users">
          <AtSign size={14} />
          <span>멘션:</span>
          {mentionedUsers.map(user => (
            <span key={user.id} className="mention-tag">
              {user.name}
              <button 
                onClick={() => {
                  const regex = new RegExp(`@\\[${user.name}\\]\\(${user.id}\\)\\s?`, "g");
                  onChange(value.replace(regex, ""));
                }}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      
      <style jsx>{`
        .mention-input-container {
          position: relative;
        }
        
        .input-wrapper {
          position: relative;
        }
        
        textarea {
          width: 100%;
          padding: 12px 14px;
          background: var(--bg-secondary, #1e1e2e);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 10px;
          color: var(--text-primary, #e0e0e0);
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
          outline: none;
        }
        
        textarea:focus {
          border-color: var(--primary, #7c3aed);
        }
        
        textarea::placeholder {
          color: var(--text-muted, #6e6e7e);
        }
        
        .suggestions-popup {
          position: absolute;
          bottom: 100%;
          left: 0;
          width: 280px;
          margin-bottom: 8px;
          background: var(--bg-primary, #12121a);
          border: 1px solid var(--border-color, #3e3e5a);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
          z-index: 100;
        }
        
        .suggestions-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: var(--bg-secondary, #1e1e2e);
          border-bottom: 1px solid var(--border-color, #3e3e5a);
          font-size: 12px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .suggestion-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px 14px;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
        }
        
        .suggestion-item:hover,
        .suggestion-item.selected {
          background: var(--bg-hover, #2e2e44);
        }
        
        .user-avatar {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary, #252536);
          border-radius: 50%;
          overflow: hidden;
          color: var(--text-muted, #6e6e7e);
        }
        
        .user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .user-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .user-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary, #e0e0e0);
        }
        
        .user-email {
          font-size: 11px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .mentioned-users {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
          font-size: 12px;
          color: var(--text-muted, #6e6e7e);
        }
        
        .mention-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          background: rgba(124, 58, 237, 0.1);
          border: 1px solid var(--primary, #7c3aed);
          border-radius: 14px;
          color: var(--primary, #7c3aed);
        }
        
        .mention-tag button {
          padding: 2px;
          background: transparent;
          border: none;
          color: var(--primary, #7c3aed);
          cursor: pointer;
          opacity: 0.7;
        }
        
        .mention-tag button:hover {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

export default MentionInput;
