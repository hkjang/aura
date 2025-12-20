"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, Check, AlertCircle, Info, CheckCircle } from "lucide-react";

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

// Mock notifications - in production, fetch from API
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: '모델 배포 완료',
    message: 'GPT-4o 모델이 성공적으로 배포되었습니다.',
    time: '5분 전',
    read: false
  },
  {
    id: '2',
    type: 'warning',
    title: '비용 알림',
    message: '이번 달 예산의 80%를 사용했습니다.',
    time: '1시간 전',
    read: false
  },
  {
    id: '3',
    type: 'info',
    title: '시스템 업데이트',
    message: '새로운 기능이 추가되었습니다.',
    time: '3시간 전',
    read: true
  }
];

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle style={{ width: '16px', height: '16px', color: 'var(--color-success)' }} />;
      case 'warning': return <AlertCircle style={{ width: '16px', height: '16px', color: 'var(--color-warning)' }} />;
      case 'error': return <AlertCircle style={{ width: '16px', height: '16px', color: 'var(--color-error)' }} />;
      default: return <Info style={{ width: '16px', height: '16px', color: 'var(--color-primary)' }} />;
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: isOpen ? 'var(--bg-tertiary)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          transition: 'all 150ms ease'
        }}
      >
        <Bell style={{ width: '18px', height: '18px' }} />
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '16px',
            height: '16px',
            borderRadius: '8px',
            background: 'var(--color-error)',
            color: 'white',
            fontSize: '10px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '360px',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 100,
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              알림
              {unreadCount > 0 && (
                <span style={{ 
                  marginLeft: '8px',
                  fontSize: '12px',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: 'var(--color-primary-light)',
                  color: 'var(--color-primary)'
                }}>
                  {unreadCount}개 새 알림
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  fontSize: '12px',
                  color: 'var(--color-primary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                모두 읽음
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '32px',
                textAlign: 'center',
                color: 'var(--text-tertiary)',
                fontSize: '13px'
              }}>
                알림이 없습니다
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '14px 16px',
                    background: notification.read ? 'transparent' : 'var(--bg-secondary)',
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'background 150ms ease'
                  }}
                >
                  <div style={{ flexShrink: 0, marginTop: '2px' }}>
                    {getIcon(notification.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: notification.read ? 500 : 600,
                      color: 'var(--text-primary)',
                      marginBottom: '4px'
                    }}>
                      {notification.title}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.4
                    }}>
                      {notification.message}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-tertiary)',
                      marginTop: '6px'
                    }}>
                      {notification.time}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notification.id);
                    }}
                    style={{
                      flexShrink: 0,
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-tertiary)',
                      opacity: 0.5
                    }}
                  >
                    <X style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border-color)',
              textAlign: 'center'
            }}>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  fontSize: '13px',
                  color: 'var(--color-primary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                모든 알림 보기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
