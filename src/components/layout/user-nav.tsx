"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { LogOut, User, Settings, Shield, ChevronDown } from "lucide-react";

export function UserNav() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => setIsOpen(!isOpen);

  // Show login button if not authenticated
  if (status === "loading") {
    return (
      <div style={{ 
        width: '32px', 
        height: '32px', 
        borderRadius: '50%', 
        background: 'var(--bg-tertiary)',
        animation: 'pulse 2s infinite'
      }} />
    );
  }

  if (!session) {
    return (
      <Link 
        href="/login"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          fontSize: '14px',
          fontWeight: 500,
          color: 'var(--color-white)',
          background: 'var(--color-primary)',
          borderRadius: 'var(--radius-md)',
          textDecoration: 'none',
          transition: 'all 150ms ease'
        }}
      >
        로그인
      </Link>
    );
  }

  const userName = session.user?.name || "사용자";
  const userEmail = session.user?.email || "";
  const userRole = (session.user as any)?.role || "USER";
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || "U";

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Avatar Button */}
      <button 
        onClick={toggleDropdown}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 8px 4px 4px',
          background: isOpen ? 'var(--bg-tertiary)' : 'transparent',
          border: '1px solid transparent',
          borderRadius: 'var(--radius-full)',
          cursor: 'pointer',
          transition: 'all 150ms ease'
        }}
      >
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'var(--color-primary)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 600
        }}>
          {initials}
        </div>
        <ChevronDown 
          style={{ 
            width: '14px', 
            height: '14px', 
            color: 'var(--text-secondary)',
            transition: 'transform 150ms',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 'calc(100% + 8px)',
          width: '240px',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          zIndex: 9999
        }}>
          {/* User Info */}
          <div style={{ 
            padding: '16px', 
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'var(--color-primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 600
              }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {userName}
                </p>
                <p style={{ 
                  fontSize: '12px', 
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {userEmail}
                </p>
              </div>
            </div>
            <div style={{ 
              marginTop: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              background: userRole === 'ADMIN' ? 'var(--color-primary-light)' : 'var(--bg-tertiary)',
              color: userRole === 'ADMIN' ? 'var(--color-primary)' : 'var(--text-secondary)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              fontWeight: 600
            }}>
              <Shield style={{ width: '10px', height: '10px' }} />
              {userRole === 'ADMIN' ? '관리자' : '사용자'}
            </div>
          </div>
          
          {/* Menu Items */}
          <div style={{ padding: '8px' }}>
            <Link 
              href="/dashboard/profile" 
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                textDecoration: 'none',
                borderRadius: 'var(--radius-md)',
                transition: 'background 100ms ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <User style={{ width: '16px', height: '16px', color: 'var(--text-secondary)' }} />
              프로필
            </Link>
            <Link 
              href="/dashboard/settings" 
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                textDecoration: 'none',
                borderRadius: 'var(--radius-md)',
                transition: 'background 100ms ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Settings style={{ width: '16px', height: '16px', color: 'var(--text-secondary)' }} />
              설정
            </Link>
          </div>
          
          {/* Logout */}
          <div style={{ padding: '8px', borderTop: '1px solid var(--border-color)' }}>
            <button 
              onClick={() => {
                setIsOpen(false);
                signOut({ callbackUrl: '/login' });
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 12px',
                color: 'var(--color-error)',
                fontSize: '14px',
                background: 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'background 100ms ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <LogOut style={{ width: '16px', height: '16px' }} />
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
